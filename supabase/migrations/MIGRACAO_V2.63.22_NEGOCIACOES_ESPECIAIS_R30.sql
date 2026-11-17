-- R30: conciliacao supervisionada das migracoes de plano / fidelidade.
-- Depende de R29.2 e R23. SEM alterar vendas anteriores ou competencias fechadas.
-- O codigo do grupo nao contem CNPJ; o prefixo so existe temporariamente no navegador.
BEGIN;
CREATE TABLE IF NOT EXISTS public.strategy_special_deal_lines_r30 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 batch_id uuid not null references public.strategy_import_batches(id) on delete restrict,
 sale_id uuid not null unique references public.strategy_recurring_sales(id) on delete restrict,
 group_code text not null check(group_code ~ '^R30-[0-9]{5}$'),
 expected_count integer not null check(expected_count between 2 and 10000),
 role text not null check(role in ('anchor','member')),
 original_amount numeric(14,2) not null check(original_amount>0),
 mrr_amount numeric(14,2) not null check(mrr_amount>=0),
 commission_amount numeric(14,2) not null check(commission_amount>=0),
 csv_line integer not null check(csv_line>1),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(organization_id,batch_id,csv_line),
 check(role='anchor' or (mrr_amount=0 and commission_amount=0))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_special_deal_anchor_r30 ON public.strategy_special_deal_lines_r30 (organization_id,batch_id,group_code) WHERE role='anchor';
CREATE INDEX IF NOT EXISTS idx_special_deal_group_r30 ON public.strategy_special_deal_lines_r30 (organization_id,batch_id,group_code);
ALTER TABLE public.strategy_special_deal_lines_r30 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.strategy_special_deal_lines_r30 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.strategy_special_deal_lines_r30 TO authenticated;
CREATE POLICY strategy_special_deal_lines_read_r30 ON public.strategy_special_deal_lines_r30
 FOR SELECT TO authenticated USING (
 organization_id=(select (public.current_profile()).organization_id)
 AND public.has_strategy_access('people_costs') AND public.has_strategy_access('edit_costs'));

create or replace function public.import_strategy_recurring_sales_v2639_r5(p_batch_id uuid,p_sales jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_batch public.strategy_import_batches%rowtype;v_item jsonb;v_person public.strategy_people%rowtype;
 v_product public.strategy_commercial_products%rowtype;v_profile public.profiles%rowtype;
 v_date date;v_contract_date text;v_day_text text;v_squad text;v_seller text;v_customer text;v_tax text;
 v_amount_cents bigint;v_active_cents bigint;v_occurrence integer;v_value numeric(14,2);v_active_value numeric(14,2);v_id text;v_event uuid;v_comp uuid;v_comp_status text;
 v_normal_seller text;v_normal_customer text;v_key text;v_seen text[]:=array[]::text[];
 v_special_group text;v_special_role text;v_special_mrr bigint;v_special_comm bigint;v_sale_id uuid;v_rule jsonb;
 v_new integer:=0;v_duplicate integer:=0;v_closed integer:=0;v_resumed integer:=0;v_previous text;v_first text;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs')
 then raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 if p_sales is null or jsonb_typeof(p_sales)<>'array' or jsonb_array_length(p_sales) not between 1 and 100 then raise exception 'Lote de vendas invalido (maximo 100).';end if;
 select * into v_batch from public.strategy_import_batches where id=p_batch_id and organization_id=v_org for update;
 if not found or v_batch.status<>'draft' then raise exception 'Lote inexistente ou finalizado.';end if;
 if not exists(select 1 from public.strategy_import_sources s where s.id=v_batch.source_id and s.organization_id=v_org and s.source_key='contracted_modules_csv' and s.active=true) then raise exception 'Fonte do lote invalida.';end if;
 for v_item in select value from jsonb_array_elements(p_sales) loop
  if jsonb_typeof(v_item)<>'object' then raise exception 'Venda invalida.';end if;
  v_day_text:=v_item->>'date';
  if v_day_text is null or v_day_text !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or to_char(to_date(v_day_text,'YYYY-MM-DD'),'YYYY-MM-DD')<>v_day_text
  then raise exception 'Data da venda invalida.';end if;
  v_date:=to_date(v_day_text,'YYYY-MM-DD');v_seller:=btrim(coalesce(v_item->>'seller',''));v_squad:=upper(btrim(coalesce(v_item->>'squad','')));
  v_customer:=left(btrim(coalesce(v_item->>'customer','')),160);v_tax:=left(regexp_replace(coalesce(v_item->>'taxId',''),'[^0-9]','','g'),30);
  v_contract_date:=coalesce(v_item->>'contractDate','');
  if v_contract_date<>'' and (v_contract_date !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or to_char(to_date(v_contract_date,'YYYY-MM-DD'),'YYYY-MM-DD')<>v_contract_date) then raise exception 'Data contratual invalida.';end if;
  if length(v_seller) not between 2 and 160 or v_squad not in ('A','B','C','D','E') then raise exception 'Vendedor/Squad invalido.';end if;
  if coalesce(v_item->>'amountCents','') !~ '^[0-9]{1,11}$' then raise exception 'Valor mensal invalido.';end if;
  v_amount_cents:=(v_item->>'amountCents')::bigint;
  if v_amount_cents not between 1 and 9999999999 then raise exception 'Valor mensal fora dos limites.';end if;
  v_value:=v_amount_cents::numeric / 100;
  -- R30: somente Vl Anterior. Vl Atual Ativo e ignorado, mesmo se enviado.
  v_active_value:=v_value;
  v_special_group:=nullif(btrim(coalesce(v_item->>'specialGroupId','')),'');
  v_special_role:=nullif(btrim(coalesce(v_item->>'specialRole','')),'');
  v_special_mrr:=null;v_special_comm:=null;
  if v_special_group is not null then
   if v_special_group !~ '^R30-[0-9]{5}$' or v_special_role not in ('anchor','member')
    or coalesce(v_item->>'specialMrrCents','') !~ '^[0-9]{1,11}$'
    or coalesce(v_item->>'specialCommissionCents','') !~ '^[0-9]{1,11}$'
    or coalesce(v_item->>'specialLineCount','') !~ '^[0-9]{1,5}$'
    or (v_item->>'specialLineCount')::integer not between 2 and 10000
   then raise exception 'R30: negociacao especial sem aprovacao valida.';end if;
   v_special_mrr:=(v_item->>'specialMrrCents')::bigint;
   v_special_comm:=(v_item->>'specialCommissionCents')::bigint;
   if v_special_mrr>9999999999 or v_special_comm>9999999999 then raise exception 'R30: valores fora do limite.';end if;
   if v_special_role='member' and (v_special_mrr<>0 or v_special_comm<>0) then
    raise exception 'R30: modulo secundario deve ter MRR e comissao zero.';end if;
   v_active_value:=v_special_mrr::numeric/100;
  elsif v_special_role is not null or v_item ? 'specialMrrCents' or v_item ? 'specialCommissionCents' then
    raise exception 'R30: revisao especial incompleta.';
  end if;
  if coalesce(v_item->>'occurrence','') !~ '^[0-9]{1,5}$' or (v_item->>'occurrence')::integer not between 1 and 10000
  then raise exception 'Ocorrencia da venda invalida.';end if;
  v_occurrence:=(v_item->>'occurrence')::integer;
  select * into v_person from public.strategy_people where id=(v_item->>'personId')::uuid and organization_id=v_org and active=true;
  if not found or v_person.user_id is null then raise exception 'Pessoa nao conciliada na organizacao.';end if;
  select * into v_profile from public.profiles where user_id=v_person.user_id and organization_id=v_org and active=true;
  -- R29.2: tecnicos continuam validados pelo Squad operacional;
  -- lideres sao validados pelo Squad financeiro da competencia da propria venda.
  if not found then raise exception 'Conta do vendedor inativa ou fora da organizacao.';end if;
  if v_profile.role='super_admin' then
    if v_squad='C' or v_person.functional_team='pre_attendance' or not exists (
      select 1 from public.super_admin_commissions lc
      where lc.organization_id=v_org and lc.user_id=v_person.user_id
        and lc.year=extract(year from v_date)::int
        and lc.month=extract(month from v_date)::int
        and lc.squad_code=v_squad
    ) then
      raise exception 'Lider sem Squad financeiro correspondente a competencia da venda.';
    end if;
  elsif v_person.default_squad_code is distinct from v_squad then
    raise exception 'Pessoa nao conciliada no Squad da venda.';
  end if;
  if not found or (v_squad='C' and (v_profile.role<>'pre_attendance' or v_person.functional_team<>'pre_attendance'))
   or (v_squad<>'C' and (v_person.functional_team='pre_attendance' or not (v_profile.role='technician' or (v_profile.role='super_admin' and exists (select 1 from public.super_admin_commissions lc where lc.organization_id=v_org and lc.user_id=v_person.user_id and lc.year=extract(year from v_date)::int and lc.month=extract(month from v_date)::int and lc.squad_code=v_squad))))) then raise exception 'Conta/squad nao elegivel.';end if;
  v_normal_seller:=public.strategy_catalog_normalize_v2633(v_seller);
  if v_normal_seller<>public.strategy_catalog_normalize_v2633(v_person.name) and v_normal_seller<>public.strategy_catalog_normalize_v2633(coalesce(v_profile.full_name,''))
   and not exists(select 1 from public.strategy_seller_aliases a where a.organization_id=v_org and a.source_key='contracted_modules_csv'
    and a.squad_code=v_squad and a.person_id=v_person.id and a.alias_normalized=v_normal_seller)
  then raise exception 'Alias do vendedor nao aprovado.';end if;
  select * into v_product from public.strategy_commercial_products where id=(v_item->>'productId')::uuid
   and organization_id=v_org and source_key='contracted_modules_csv' and generates_mrr=true and active=true;
  if not found or public.strategy_catalog_normalize_v2633(coalesce(v_item->>'product',''))<>v_product.normalized_name then raise exception 'Produto recorrente nao cadastrado ou nao corresponde ao arquivo.';end if;
  -- Identidade idempotente calculada com CNPJ transitorio; o CNPJ completo nao e persistido nas novas vendas R30.
  v_normal_customer:=public.strategy_catalog_normalize_v2633(v_customer);
  v_key:=md5(concat_ws('|',v_day_text,v_normal_seller,v_squad,v_product.normalized_name,v_amount_cents::text,v_tax,v_normal_customer,v_contract_date,v_occurrence::text));
  if v_key=any(v_seen) then raise exception 'Vendas identicas no mesmo lote: revisar antes de contabilizar.';end if;
  -- Nao converter retroativamente uma venda ja gravada com regra normal.
  -- Isso exigiria ajuste financeiro supervisionado e conciliação da bonificacao.
  if v_special_group is not null and exists(
    select 1 from public.strategy_recurring_sales old where old.organization_id=v_org
      and old.sale_identity=v_key and coalesce(old.commission_rule_at_import->>'r30_special','false')<>'true'
  ) then raise exception 'R30: linha ja importada com regra normal. Revise a auditoria antes de converter.';end if;
  v_seen:=array_append(v_seen,v_key);
  perform pg_advisory_xact_lock(hashtextextended(v_org::text||':'||v_key,0));
  select outcome into v_previous from public.strategy_recurring_import_attempts where batch_id=p_batch_id and sale_identity=v_key;
  if found then v_resumed:=v_resumed+1;continue;end if;
  if exists(select 1 from public.strategy_recurring_sales where organization_id=v_org and source_key='contracted_modules_csv' and sale_identity=v_key)
   or exists(select 1 from public.strategy_recurring_sales old
      where old.organization_id=v_org and old.source_key='contracted_modules_csv'
       and old.occurred_on=v_date and old.squad_code=v_squad and old.product_id=v_product.id
       and old.source_occurrence=v_occurrence
       and public.strategy_catalog_normalize_v2633(old.seller_name)=v_normal_seller
       and public.strategy_catalog_normalize_v2633(coalesce(old.customer_name,''))=v_normal_customer
       and regexp_replace(coalesce(old.customer_tax_id,''),'[^0-9]','','g')=v_tax)
  then v_first:='duplicate';v_duplicate:=v_duplicate+1;
  else
   insert into public.strategy_competences(organization_id,competence,created_by)
    values(v_org,date_trunc('month',v_date)::date,auth.uid()) on conflict(organization_id,competence) do nothing;
   select id,status into v_comp,v_comp_status from public.strategy_competences where organization_id=v_org and competence=date_trunc('month',v_date)::date for update;
   if v_comp_status='closed' then v_first:='closed';v_closed:=v_closed+1;
   else
    v_id:='contracted_modules_csv:v2634:'||v_key;
    insert into public.strategy_result_events(organization_id,competence_id,result_type,status,occurred_at,gross_amount,monthly_recurring_amount,annual_recurring_amount,
      currency,source,source_reference,description,direct_revenue_category,metadata,created_by)
    values(v_org,v_comp,'direct','confirmed',(v_date::timestamp at time zone 'UTC'),v_value,v_active_value,v_active_value*12,
      'BRL','csv',v_id,'Contratacao de modulo: '||v_product.name,'module_addon',
      jsonb_build_object('commercial_source','contracted_modules_csv','product_id',v_product.id,'batch_id',p_batch_id,'sale_identity',v_key,'mrr_contractual',true,'commission_posted',false,'commission_revision_at_import',v_product.commission_revision,
        'r30_special',v_special_group is not null,'r30_group',v_special_group,'r30_role',v_special_role),auth.uid()) returning id into v_event;
    insert into public.strategy_result_attributions(organization_id,event_id,person_id,user_id_snapshot,technician_name_snapshot,squad_code_snapshot,attribution_role,attribution_share,created_by)
    values(v_org,v_event,v_person.id,v_person.user_id,v_person.name,v_squad,'owner',1,auth.uid());
    v_rule:=case when v_special_group is not null then jsonb_build_object('type','fixed','fixed_amount',v_special_comm::numeric/100,'r30_special',true,'r30_group',v_special_group,'r30_role',v_special_role) else jsonb_build_object('type',v_product.commission_type,'percentage',v_product.commission_percentage,'third_party_cost',v_product.third_party_cost,'fixed_amount',v_product.fixed_amount) end;
    insert into public.strategy_recurring_sales(organization_id,source_key,sale_identity,event_id,person_id,product_id,batch_id,occurred_on,competence,squad_code,
      seller_name,customer_name,customer_tax_id,monthly_amount,annual_equivalent,source_occurrence,commission_revision_at_import,commission_rule_at_import,created_by,active_monthly_amount)
    values(v_org,'contracted_modules_csv',v_key,v_event,v_person.id,v_product.id,p_batch_id,v_date,date_trunc('month',v_date)::date,v_squad,v_seller,v_customer,NULL,v_value,v_active_value*12,v_occurrence,v_product.commission_revision,
      v_rule,auth.uid(),v_active_value) returning id into v_sale_id;
    if v_special_group is not null then
      insert into public.strategy_special_deal_lines_r30(organization_id,batch_id,sale_id,group_code,expected_count,role,original_amount,mrr_amount,commission_amount,csv_line,created_by)
      values(v_org,p_batch_id,v_sale_id,v_special_group,(v_item->>'specialLineCount')::integer,v_special_role,v_value,v_active_value,v_special_comm::numeric/100,(v_item->>'line')::integer,auth.uid());
    end if;
    v_first:='imported';v_new:=v_new+1;
   end if;
  end if;
  insert into public.strategy_recurring_import_attempts(organization_id,batch_id,sale_identity,outcome)
  values(v_org,p_batch_id,v_key,v_first);
 end loop;
 if v_batch.accepted_rows+v_batch.rejected_rows+v_new+v_duplicate+v_closed>v_batch.total_rows then raise exception 'Excede o total preparado do lote.';end if;
 update public.strategy_import_batches set accepted_rows=accepted_rows+v_new,
 rejected_rows=rejected_rows+v_duplicate+v_closed
 where id=p_batch_id and organization_id=v_org;
 return jsonb_build_object('imported',v_new,'duplicates',v_duplicate,'closed',v_closed,'resumed',v_resumed);
end $$;


create or replace function public.replace_strategy_batch_commissions_r23(p_batch_id uuid,p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_source text;v_row record;v_sale record;v_comm public.strategy_sales_commissions%rowtype;
 v_rule jsonb;v_amount numeric(14,2);v_status text;
 v_row_revision integer;
 v_eligible integer:=0;v_changed integer:=0;v_missing integer:=0;v_pending integer:=0;v_applied integer:=0;
 v_old_total numeric:=0;v_new_total numeric:=0;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs')
    or not public.has_strategy_access('edit_costs') then
    raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 if p_batch_id is null then raise exception 'Lote obrigatorio.';end if;
 select s.source_key into v_source from public.strategy_import_batches b
 join public.strategy_import_sources s on s.id=b.source_id and s.organization_id=b.organization_id
 where b.id=p_batch_id and b.organization_id=v_org and b.status='imported'
   and s.source_key in ('contracted_modules_csv','merchandise_sales_csv');
 if v_source is null then raise exception 'Lote inexistente, incompleto ou fora do escopo.';end if;

 -- Seleciona SOMENTE identidades marcadas como duplicate neste lote, nunca todas
 -- as vendas de uma competencia e nunca registros de outras organizacoes.
 for v_row in
   select a.sale_identity from public.strategy_recurring_import_attempts a
   where v_source='contracted_modules_csv' and a.organization_id=v_org
     and a.batch_id=p_batch_id and a.outcome='duplicate'
   union all
   select a.sale_identity from public.strategy_merchandise_import_attempts a
   where v_source='merchandise_sales_csv' and a.organization_id=v_org
     and a.batch_id=p_batch_id and a.outcome='duplicate'
 loop
   if v_source='contracted_modules_csv' then
     select id,competence,person_id,product_id,squad_code,monthly_amount as gross_amount
       into v_sale from public.strategy_recurring_sales
       where organization_id=v_org and source_key=v_source and sale_identity=v_row.sale_identity;
   else
     select id,competence,person_id,product_id,squad_code,gross_amount
       into v_sale from public.strategy_merchandise_sales
       where organization_id=v_org and source_key=v_source and sale_identity=v_row.sale_identity;
   end if;
   if v_sale.id is null then raise exception 'Venda duplicada nao localizada. Operacao cancelada.';end if;
   if v_source='contracted_modules_csv' and exists(
     select 1 from public.strategy_recurring_sales s
     where s.id=v_sale.id and s.organization_id=v_org and s.commission_rule_at_import->>'r30_special'='true') then
     continue; -- Nunca substituir regra manual R30 por regra geral do catalogo.
   end if;
   if exists(select 1 from public.strategy_commission_replacements_r23 a
        where a.organization_id=v_org and a.batch_id=p_batch_id and a.source_key=v_source and a.sale_id=v_sale.id) then
      v_applied:=v_applied+1;continue;
   end if;
   -- Lock impede concorrencia com fechamentos e recálculos.
   select * into v_comm from public.strategy_sales_commissions c
      where c.organization_id=v_org and c.source_key=v_source and c.sale_id=v_sale.id
      for update;
   if not found then v_missing:=v_missing+1;continue;end if;
   if exists(select 1 from public.strategy_competences c where c.organization_id=v_org
              and c.competence=v_sale.competence and c.status='closed')
      or exists(select 1 from public.squad_months sm join public.squads s on s.id=sm.squad_id
                where s.organization_id=v_org and s.code::text=v_sale.squad_code
                  and sm.year=extract(year from v_sale.competence)::integer
                  and sm.month=extract(month from v_sale.competence)::integer and sm.is_closed=true) then
      raise exception 'Competencia fechada (%). Nao e permitido recalcular.',v_sale.competence;
   end if;
   -- Nao alterar comissao quando ja foi transferida para bonificacao operacional.
   if exists(select 1 from public.technician_finance_monthly tf
       join public.technician_monthly tm on tm.id=tf.technician_month_id
       join public.squad_months sm on sm.id=tm.squad_month_id
       join public.squads s on s.id=sm.squad_id
       join public.strategy_people p on p.user_id=tm.user_id and p.organization_id=v_org
       where p.id=v_sale.person_id and s.organization_id=v_org
         and s.code::text=v_sale.squad_code
         and sm.year=extract(year from v_sale.competence)::integer
         and sm.month=extract(month from v_sale.competence)::integer
         and coalesce(tf.sales_commission,0)<>0)
      or exists(select 1 from public.super_admin_commissions lc
          join public.strategy_people p on p.user_id=lc.user_id and p.organization_id=v_org
          where p.id=v_sale.person_id and lc.organization_id=v_org
            and lc.year=extract(year from v_sale.competence)::integer
            and lc.month=extract(month from v_sale.competence)::integer
            and coalesce(lc.imported_sales_commission,0)<>0) then
      raise exception 'Comissao ja vinculada a bonificacao da competencia %. Revise antes de recalcular.',v_sale.competence;
   end if;
   select jsonb_build_object('type',pr.commission_type,'percentage',pr.commission_percentage,
             'third_party_cost',pr.third_party_cost,'fixed_amount',pr.fixed_amount),pr.commission_revision
       into v_rule,v_row_revision
       from public.strategy_commercial_products pr
       where pr.id=v_sale.product_id and pr.organization_id=v_org and pr.source_key=v_source and pr.active=true;
   if v_rule is null then v_pending:=v_pending+1;continue;end if;
   v_amount:=public.strategy_commission_amount_v2636(v_sale.gross_amount,v_rule);
   if v_amount is null then v_pending:=v_pending+1;continue;end if;
   v_eligible:=v_eligible+1;v_old_total:=v_old_total+coalesce(v_comm.commission_amount,0);
   v_new_total:=v_new_total+v_amount;
   if p_apply then
     insert into public.strategy_commission_replacements_r23
       (organization_id,batch_id,source_key,sale_id,commission_id,competence,
        old_amount,new_amount,old_status,new_status,old_revision,new_revision,old_rule,new_rule,changed_by)
     values(v_org,p_batch_id,v_source,v_sale.id,v_comm.id,v_sale.competence,
        v_comm.commission_amount,v_amount,v_comm.status,'calculated',v_comm.rule_revision,
        v_row_revision,v_comm.rule_snapshot,v_rule,auth.uid());
     update public.strategy_sales_commissions
       set commission_amount=v_amount,status='calculated',rule_snapshot=v_rule,
           rule_revision=v_row_revision
       where id=v_comm.id and organization_id=v_org;
     v_changed:=v_changed+1;
   end if;
 end loop;
 return jsonb_build_object('eligible',v_eligible,'changed',v_changed,'missingLedger',v_missing,
   'pendingRule',v_pending,'alreadyApplied',v_applied,'oldTotal',v_old_total,'newTotal',v_new_total,
   'delta',v_new_total-v_old_total,'mode',case when p_apply then 'applied' else 'preview' end);
end $$;

create or replace function public.finish_strategy_recurring_batch_v2634(p_batch_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_batch public.strategy_import_batches%rowtype;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs')
 then raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 select * into v_batch from public.strategy_import_batches where id=p_batch_id and organization_id=v_org for update;
 if not found or v_batch.status<>'draft' then raise exception 'Lote inexistente ou ja finalizado.';end if;
 if v_batch.accepted_rows+v_batch.rejected_rows<>v_batch.total_rows then raise exception 'Existem linhas ainda nao processadas. Reprocesse antes de fechar.';end if;
 if exists (
   select 1 from public.strategy_special_deal_lines_r30 l
   where l.organization_id=v_org and l.batch_id=p_batch_id
   group by l.group_code
   having count(*)<>min(l.expected_count) or min(l.expected_count)<>max(l.expected_count)
     or count(*) filter(where l.role='anchor')<>1
 ) then raise exception 'R30: negociacao especial incompleta; confira as linhas antes de finalizar o lote.';end if;
 update public.strategy_import_batches set status='imported' where id=p_batch_id and organization_id=v_org;
 return jsonb_build_object('accepted',v_batch.accepted_rows,'duplicates_or_closed',v_batch.rejected_rows,'total',v_batch.total_rows);
end $$;

REVOKE ALL ON FUNCTION public.import_strategy_recurring_sales_v2639_r5(uuid,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.finish_strategy_recurring_batch_v2634(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finish_strategy_recurring_batch_v2634(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_strategy_recurring_sales_v2639_r5(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.replace_strategy_batch_commissions_r23(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_strategy_batch_commissions_r23(uuid,boolean) TO authenticated;
COMMIT;
