-- Fase 11: habilita líderes com Squad financeiro para venda e permite estorno controlado de lotes.
-- Aplicar após todas as migrations anteriores, incluindo V2.63.10.
-- Não mexe nos dados operacionais dos técnicos nem em snapshots.
begin;

alter table public.super_admin_commissions add column if not exists imported_sales_commission numeric(14,2) not null default 0;
comment on column public.super_admin_commissions.imported_sales_commission is 'Somente vendas calculadas do CSV, separado do campo sales_commission manual.';

-- Histórico permanente da retirada; cada venda conserva registro anterior, regra e comissão.
create table if not exists public.strategy_commercial_batch_reversals_v26311 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 batch_id uuid not null unique references public.strategy_import_batches(id),
 source_key text not null check(source_key in ('contracted_modules_csv','merchandise_sales_csv')),
 reason text not null check(length(btrim(reason)) between 12 and 500),
 sales_count integer not null,
 gross_amount numeric(18,2) not null,
 reversed_by uuid not null references auth.users(id),
 reversed_at timestamptz not null default now()
);
create table if not exists public.strategy_commercial_reversed_sales_v26311 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 reversal_id uuid not null references public.strategy_commercial_batch_reversals_v26311(id),
 original_sale_id uuid not null,
 original_event_id uuid not null,
 sale_data jsonb not null,
 commission_data jsonb,
 unique(reversal_id,original_sale_id)
);
create index if not exists strategy_reversed_sales_parent_v26311 on public.strategy_commercial_reversed_sales_v26311(reversal_id);
alter table public.strategy_commercial_batch_reversals_v26311 enable row level security;
alter table public.strategy_commercial_reversed_sales_v26311 enable row level security;
revoke all on public.strategy_commercial_batch_reversals_v26311,public.strategy_commercial_reversed_sales_v26311 from public,anon,authenticated;
grant select on public.strategy_commercial_batch_reversals_v26311,public.strategy_commercial_reversed_sales_v26311 to authenticated;
create policy strategy_batch_reversal_read_v26311 on public.strategy_commercial_batch_reversals_v26311 for select to authenticated using
 (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));
create policy strategy_reversed_sale_read_v26311 on public.strategy_commercial_reversed_sales_v26311 for select to authenticated using
 (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));

alter table public.strategy_import_batches drop constraint if exists strategy_import_batches_status_check;
alter table public.strategy_import_batches add constraint strategy_import_batches_status_check check (status in ('draft','validated','rejected','imported','reverted'));

-- Vínculo de vendedor administrativo usa a pessoa estratégica já existente, ou a cria sem atendimento.
create or replace function public.prepare_strategy_leader_sellers_v26311()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_count int:=0;v_row record;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then
  raise exception 'Sem acesso financeiro.' using errcode='42501';end if;
 for v_row in select distinct p.user_id,p.full_name from public.profiles p
  where p.organization_id=v_org and p.active=true and p.role='super_admin'
   and exists(select 1 from public.super_admin_commissions c where c.organization_id=v_org and c.user_id=p.user_id and c.squad_code in ('A','B','D','E'))
 loop
  if not exists(select 1 from public.strategy_people s where s.organization_id=v_org and s.user_id=v_row.user_id and s.active=true) then
   insert into public.strategy_people(organization_id,user_id,name,role_label,functional_team,default_squad_code,active,source,created_by,updated_by)
   values(v_org,v_row.user_id,coalesce(nullif(btrim(v_row.full_name),''),'Líder'),'Líder','other',null,true,'manual',auth.uid(),auth.uid());
   v_count:=v_count+1;
  end if;
 end loop;
 return jsonb_build_object('created',v_count);
end $$;

-- Regras oficiais de elegibilidade executadas NO SERVIDOR, inclusive data da venda.
create or replace function public.import_strategy_recurring_sales_v2639_r5(p_batch_id uuid,p_sales jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_batch public.strategy_import_batches%rowtype;v_item jsonb;v_person public.strategy_people%rowtype;
 v_product public.strategy_commercial_products%rowtype;v_profile public.profiles%rowtype;
 v_date date;v_contract_date text;v_day_text text;v_squad text;v_seller text;v_customer text;v_tax text;
 v_amount_cents bigint;v_active_cents bigint;v_occurrence integer;v_value numeric(14,2);v_active_value numeric(14,2);v_id text;v_event uuid;v_comp uuid;v_comp_status text;
 v_normal_seller text;v_normal_customer text;v_key text;v_seen text[]:=array[]::text[];
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
  if coalesce(v_item->>'activeMonthlyCents','') !~ '^[0-9]{1,11}$' then raise exception 'Vl Atual Ativo/MRR ausente ou invalido.';end if;
  v_active_cents:=(v_item->>'activeMonthlyCents')::bigint;
  if v_active_cents not between 1 and 9999999999 then raise exception 'MRR fora dos limites.';end if;
  v_active_value:=v_active_cents::numeric / 100;
  if coalesce(v_item->>'occurrence','') !~ '^[0-9]{1,5}$' or (v_item->>'occurrence')::integer not between 1 and 10000
  then raise exception 'Ocorrencia da venda invalida.';end if;
  v_occurrence:=(v_item->>'occurrence')::integer;
  select * into v_person from public.strategy_people where id=(v_item->>'personId')::uuid and organization_id=v_org and active=true;
  if not found or v_person.user_id is null or v_person.default_squad_code is distinct from v_squad then raise exception 'Pessoa nao conciliada no Squad da venda.';end if;
  select * into v_profile from public.profiles where user_id=v_person.user_id and organization_id=v_org and active=true;
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
  v_normal_customer:=public.strategy_catalog_normalize_v2633(v_customer);
  v_key:=md5(concat_ws('|',v_day_text,v_normal_seller,v_squad,v_product.normalized_name,v_amount_cents::text,v_tax,v_normal_customer,v_contract_date,v_occurrence::text));
  if v_key=any(v_seen) then raise exception 'Vendas identicas no mesmo lote: revisar antes de contabilizar.';end if;
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
      jsonb_build_object('commercial_source','contracted_modules_csv','product_id',v_product.id,'batch_id',p_batch_id,'sale_identity',v_key,'mrr_contractual',true,'commission_posted',false,'commission_revision_at_import',v_product.commission_revision),auth.uid()) returning id into v_event;
    insert into public.strategy_result_attributions(organization_id,event_id,person_id,user_id_snapshot,technician_name_snapshot,squad_code_snapshot,attribution_role,attribution_share,created_by)
    values(v_org,v_event,v_person.id,v_person.user_id,v_person.name,v_squad,'owner',1,auth.uid());
    insert into public.strategy_recurring_sales(organization_id,source_key,sale_identity,event_id,person_id,product_id,batch_id,occurred_on,competence,squad_code,
      seller_name,customer_name,customer_tax_id,monthly_amount,annual_equivalent,source_occurrence,commission_revision_at_import,commission_rule_at_import,created_by,active_monthly_amount)
    values(v_org,'contracted_modules_csv',v_key,v_event,v_person.id,v_product.id,p_batch_id,v_date,date_trunc('month',v_date)::date,v_squad,v_seller,v_customer,v_tax,v_value,v_active_value*12,v_occurrence,v_product.commission_revision,
      jsonb_build_object('type',v_product.commission_type,'percentage',v_product.commission_percentage,
       'third_party_cost',v_product.third_party_cost,'fixed_amount',v_product.fixed_amount),auth.uid(),v_active_value);
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

create or replace function public.import_strategy_merchandise_sales_v2635(p_batch_id uuid,p_sales jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_batch public.strategy_import_batches%rowtype;v_item jsonb;v_person public.strategy_people%rowtype;
 v_product public.strategy_commercial_products%rowtype;v_profile public.profiles%rowtype;
 v_day_text text;v_date date;v_squad text;v_seller text;v_sale_ref text;v_qty_text text;
 v_amount_cents bigint;v_occurrence integer;v_value numeric(14,2);v_id text;v_event uuid;v_comp uuid;v_comp_status text;
 v_normal_seller text;v_normal_ref text;v_key text;v_seen text[]:=array[]::text[];
 v_new integer:=0;v_duplicate integer:=0;v_closed integer:=0;v_resumed integer:=0;v_previous text;v_first text;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs')
 then raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 if p_sales is null or jsonb_typeof(p_sales)<>'array' or jsonb_array_length(p_sales) not between 1 and 100
 then raise exception 'Lote invalido (maximo 100).';end if;
 select * into v_batch from public.strategy_import_batches where id=p_batch_id and organization_id=v_org for update;
 if not found or v_batch.status<>'draft' then raise exception 'Lote inexistente ou finalizado.';end if;
 if not exists(select 1 from public.strategy_import_sources s where s.id=v_batch.source_id and s.organization_id=v_org
 and s.source_key='merchandise_sales_csv' and s.origin='csv' and s.generates_mrr=false and s.active=true)
 then raise exception 'Origem do lote invalida.';end if;
 for v_item in select value from jsonb_array_elements(p_sales) loop
  if jsonb_typeof(v_item)<>'object' then raise exception 'Venda invalida.';end if;
  v_day_text:=v_item->>'date';
  if v_day_text is null or v_day_text !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
   or to_char(to_date(v_day_text,'YYYY-MM-DD'),'YYYY-MM-DD')<>v_day_text
  then raise exception 'Data invalida.';end if;
  v_date:=to_date(v_day_text,'YYYY-MM-DD');
  v_seller:=btrim(coalesce(v_item->>'seller',''));
  v_squad:=upper(btrim(coalesce(v_item->>'squad','')));
  v_sale_ref:=left(btrim(coalesce(v_item->>'saleId','')),101);
  v_qty_text:=btrim(coalesce(v_item->>'quantity',''));
  if length(v_sale_ref) not between 1 and 100 then raise exception 'ID de venda invalido.';end if;
  if length(v_seller) not between 2 and 160 or v_squad not in ('A','B','C','D','E') then raise exception 'Vendedor/Squad invalido.';end if;
  if v_qty_text<>'' then
   if v_qty_text !~ '^[0-9]{1,8}(\.[0-9]{1,4})?$' or v_qty_text::numeric<=0 or v_qty_text::numeric>99999999
   then raise exception 'Quantidade invalida.';end if;
  end if;
  if coalesce(v_item->>'amountCents','') !~ '^[0-9]{1,11}$' then raise exception 'Valor invalido.';end if;
  v_amount_cents:=(v_item->>'amountCents')::bigint;
  if v_amount_cents not between 1 and 9999999999 then raise exception 'Valor fora dos limites.';end if;
  v_value:=v_amount_cents::numeric/100; -- vlTotalItem ja e o valor total, NAO multiplica pela quantidade
  if coalesce(v_item->>'occurrence','') !~ '^[0-9]{1,5}$' or (v_item->>'occurrence')::integer not between 1 and 10000
  then raise exception 'Ocorrencia invalida.';end if;
  v_occurrence:=(v_item->>'occurrence')::integer;
  select * into v_person from public.strategy_people where id=(v_item->>'personId')::uuid and organization_id=v_org and active=true;
  if not found or v_person.user_id is null or v_person.default_squad_code is distinct from v_squad
  then raise exception 'Pessoa nao conciliada no Squad informado.';end if;
  select * into v_profile from public.profiles where user_id=v_person.user_id and organization_id=v_org and active=true;
  if not found or (v_squad='C' and (v_profile.role<>'pre_attendance' or v_person.functional_team<>'pre_attendance'))
   or (v_squad<>'C' and (v_person.functional_team='pre_attendance' or not (v_profile.role='technician' or (v_profile.role='super_admin' and exists (select 1 from public.super_admin_commissions lc where lc.organization_id=v_org and lc.user_id=v_person.user_id and lc.year=extract(year from v_date)::int and lc.month=extract(month from v_date)::int and lc.squad_code=v_squad)))))
  then raise exception 'Conta/Squad nao elegivel.';end if;
  v_normal_seller:=public.strategy_catalog_normalize_v2633(v_seller);
  if v_normal_seller<>public.strategy_catalog_normalize_v2633(v_person.name)
   and v_normal_seller<>public.strategy_catalog_normalize_v2633(coalesce(v_profile.full_name,''))
   and not exists(select 1 from public.strategy_seller_aliases a where a.organization_id=v_org and a.source_key='merchandise_sales_csv'
     and a.squad_code=v_squad and a.person_id=v_person.id and a.alias_normalized=v_normal_seller)
  then raise exception 'Alias nao aprovado para o vendedor.';end if;
  select * into v_product from public.strategy_commercial_products where id=(v_item->>'productId')::uuid
   and organization_id=v_org and source_key='merchandise_sales_csv' and generates_mrr=false and active=true;
  if not found or public.strategy_catalog_normalize_v2633(coalesce(v_item->>'product',''))<>v_product.normalized_name
  then raise exception 'Produto avulso nao cadastrado ou nao corresponde ao CSV.';end if;
  v_normal_ref:=public.strategy_catalog_normalize_v2633(v_sale_ref);
  v_key:=md5(concat_ws('|',v_normal_ref,v_day_text,v_normal_seller,v_squad,v_product.normalized_name,v_amount_cents::text,v_qty_text,v_occurrence::text));
  if v_key=any(v_seen) then raise exception 'Identidades repetidas no lote. Revise as ocorrencias.';end if;
  v_seen:=array_append(v_seen,v_key);
  perform pg_advisory_xact_lock(hashtextextended(v_org::text||':merchandise_sales_csv:'||v_key,0));
  select outcome into v_previous from public.strategy_merchandise_import_attempts where batch_id=p_batch_id and sale_identity=v_key;
  if found then v_resumed:=v_resumed+1;continue;end if;
  if exists(select 1 from public.strategy_merchandise_sales where organization_id=v_org and source_key='merchandise_sales_csv' and sale_identity=v_key)
  then v_first:='duplicate';v_duplicate:=v_duplicate+1;
  else
   insert into public.strategy_competences(organization_id,competence,created_by)
     values(v_org,date_trunc('month',v_date)::date,auth.uid()) on conflict(organization_id,competence) do nothing;
   select id,status into v_comp,v_comp_status from public.strategy_competences where organization_id=v_org
     and competence=date_trunc('month',v_date)::date for update;
   if v_comp_status='closed' then v_first:='closed';v_closed:=v_closed+1;
   else
    v_id:='merchandise_sales_csv:v2635:'||v_key;
    insert into public.strategy_result_events(organization_id,competence_id,result_type,status,occurred_at,gross_amount,monthly_recurring_amount,annual_recurring_amount,
       currency,source,source_reference,description,direct_revenue_category,metadata,created_by)
    values(v_org,v_comp,'direct','confirmed',(v_date::timestamp at time zone 'UTC'),v_value,0,0,
      'BRL','csv',v_id,'Venda avulsa: '||v_product.name,'direct_sale',
      jsonb_build_object('commercial_source','merchandise_sales_csv','source_sale_id',v_sale_ref,'product_id',v_product.id,'batch_id',p_batch_id,'sale_identity',v_key,
       'quantity',nullif(v_qty_text,'')::numeric,'mrr_contractual',false,'commission_posted',false,'commission_revision_at_import',v_product.commission_revision),auth.uid())
       returning id into v_event;
    insert into public.strategy_result_attributions(organization_id,event_id,person_id,user_id_snapshot,technician_name_snapshot,squad_code_snapshot,attribution_role,attribution_share,created_by)
    values(v_org,v_event,v_person.id,v_person.user_id,v_person.name,v_squad,'owner',1,auth.uid());
    insert into public.strategy_merchandise_sales(organization_id,source_key,sale_identity,event_id,person_id,product_id,batch_id,occurred_on,competence,squad_code,
      source_sale_id,seller_name,item_quantity,gross_amount,source_occurrence,commission_revision_at_import,commission_rule_at_import,created_by)
    values(v_org,'merchandise_sales_csv',v_key,v_event,v_person.id,v_product.id,p_batch_id,v_date,date_trunc('month',v_date)::date,v_squad,
      v_sale_ref,v_seller,nullif(v_qty_text,'')::numeric,v_value,v_occurrence,v_product.commission_revision,
      jsonb_build_object('type',v_product.commission_type,'percentage',v_product.commission_percentage,
        'third_party_cost',v_product.third_party_cost,'fixed_amount',v_product.fixed_amount),auth.uid());
    v_first:='imported';v_new:=v_new+1;
   end if;
  end if;
  insert into public.strategy_merchandise_import_attempts(organization_id,batch_id,sale_identity,outcome)
  values(v_org,p_batch_id,v_key,v_first);
 end loop;
 if v_batch.accepted_rows+v_batch.rejected_rows+v_new+v_duplicate+v_closed>v_batch.total_rows
 then raise exception 'Excede total preparado do lote.';end if;
 update public.strategy_import_batches set accepted_rows=accepted_rows+v_new,rejected_rows=rejected_rows+v_duplicate+v_closed
  where id=p_batch_id and organization_id=v_org;
 return jsonb_build_object('imported',v_new,'duplicates',v_duplicate,'closed',v_closed,'resumed',v_resumed);
end $$;

create or replace function public.upsert_strategy_seller_alias_v2632(
 p_source_key text,p_squad_code text,p_alias_name text,p_alias_normalized text,p_person_id uuid
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_person public.strategy_people%rowtype;v_role text;v_active boolean;v_id uuid;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs')
    or not public.has_strategy_access('edit_costs') then raise exception 'Acesso negado a conciliacao comercial.';end if;
 if p_source_key not in ('contracted_modules_csv','merchandise_sales_csv') or p_source_key is null
    or p_squad_code not in ('A','B','C','D','E') or p_squad_code is null
    or length(btrim(coalesce(p_alias_name,''))) not between 2 and 160
    or coalesce(p_alias_normalized,'') !~ '^[a-z0-9]{2,160}$' then
    raise exception 'Dados de alias invalidos.';end if;
 select * into v_person from public.strategy_people where id=p_person_id and organization_id=v_org and active=true;
 if not found or v_person.user_id is null then raise exception 'Pessoa sem conta ativa na organizacao.';end if;
 select role,active into v_role,v_active from public.profiles
  where user_id=v_person.user_id and organization_id=v_org;
 if coalesce(v_active,false) is not true then raise exception 'Conta de usuario inativa.';end if;
 if (v_role<>'super_admin' and coalesce(v_person.default_squad_code,'')<>p_squad_code)
    or (p_squad_code='C' and (v_role<>'pre_attendance' or v_person.functional_team<>'pre_attendance'))
    or (p_squad_code<>'C' and (v_person.functional_team='pre_attendance' or not (v_role='technician' or (v_role='super_admin' and exists (select 1 from public.super_admin_commissions lc where lc.organization_id=v_org and lc.user_id=v_person.user_id and lc.squad_code=p_squad_code))))) then
    raise exception 'Pessoa e grupo incompatíveis.';end if;
 insert into public.strategy_seller_aliases(organization_id,source_key,squad_code,alias_name,alias_normalized,person_id,created_by,updated_by)
 values(v_org,p_source_key,p_squad_code,btrim(p_alias_name),p_alias_normalized,p_person_id,auth.uid(),auth.uid())
 on conflict (organization_id,source_key,squad_code,alias_normalized)
 do update set alias_name=excluded.alias_name,person_id=excluded.person_id,updated_by=auth.uid(),updated_at=now()
 returning id into v_id;
 return v_id;
end $$;

-- Sincronizar somente a parcela automática separada; nunca sobrescrever a parcela manual.
create or replace function public.sync_strategy_leader_sales_v26311(p_competence date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_count int:=0;v_row record;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Sem acesso.' using errcode='42501';end if;
 if p_competence is null or extract(day from p_competence)<>1 then raise exception 'Competência inválida.';end if;
 if exists(select 1 from public.squad_months sm join public.squads sq on sq.id=sm.squad_id where sq.organization_id=v_org and sm.year=extract(year from p_competence)::int and sm.month=extract(month from p_competence)::int and sm.is_closed=true) then raise exception 'Mês operacional fechado.';end if;
 if exists(select 1 from public.strategy_competences where organization_id=v_org and competence=p_competence and status='closed') or
 exists(select 1 from public.strategy_financial_closure_v2638 fc join public.strategy_competences c on c.id=fc.competence_id where fc.organization_id=v_org and c.competence=p_competence) then raise exception 'Competência consolidada.';end if;
 for v_row in select a.user_id,a.squad_code,
 sum(coalesce(sc.commission_amount,0)) as amount,
 count(*) filter(where sc.status<>'calculated') as pending
 from public.strategy_sales_commissions sc join public.strategy_people a on a.id=sc.person_id and a.organization_id=v_org
 join public.profiles pr on pr.user_id=a.user_id and pr.organization_id=v_org and pr.active=true and pr.role='super_admin'
 where sc.organization_id=v_org and sc.competence=p_competence
 group by a.user_id,a.squad_code loop
  if v_row.pending>0 then raise exception 'Comissões de líder pendentes: corrija antes de sincronizar.';end if;
  if not exists(select 1 from public.super_admin_commissions x where x.organization_id=v_org and x.user_id=v_row.user_id and x.year=extract(year from p_competence)::int and x.month=extract(month from p_competence)::int and x.squad_code=v_row.squad_code) then
   raise exception 'Líder sem configuração financeira na competência.';end if;
 end loop;
 update public.super_admin_commissions c set imported_sales_commission=coalesce((
  select sum(sc.commission_amount) from public.strategy_sales_commissions sc
  join public.strategy_people p on p.id=sc.person_id and p.organization_id=v_org
  where sc.organization_id=v_org and sc.competence=p_competence and p.user_id=c.user_id and sc.squad_code=c.squad_code and sc.status='calculated'),0),updated_at=now(),updated_by=auth.uid()
 where c.organization_id=v_org and c.year=extract(year from p_competence)::int and c.month=extract(month from p_competence)::int
  and c.squad_code in ('A','B','D','E') and exists(select 1 from public.profiles p where p.organization_id=v_org and p.user_id=c.user_id and p.role='super_admin' and p.active=true);
 get diagnostics v_count=row_count;
 return jsonb_build_object('leaders',v_count,'competence',p_competence);
end $$;

-- Prévia sempre em tempo real: não depende de números enviados pelo navegador.
create or replace function public.preview_strategy_commercial_batch_reversal_v26311(p_batch_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_source text;v_batch public.strategy_import_batches%rowtype;v_count int;v_sum numeric;v_locked boolean;v_comm int;v_synced boolean;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Sem acesso financeiro.' using errcode='42501';end if;
 select * into v_batch from public.strategy_import_batches where id=p_batch_id and organization_id=v_org;
 if not found then raise exception 'Lote não localizado.';end if;
 select source_key into v_source from public.strategy_import_sources where id=v_batch.source_id and organization_id=v_org;
 if v_source is null or v_source not in ('contracted_modules_csv','merchandise_sales_csv') then raise exception 'Origem não comercial.';end if;
 if v_source='contracted_modules_csv' then
  select count(*),coalesce(sum(monthly_amount),0) into v_count,v_sum from public.strategy_recurring_sales where organization_id=v_org and batch_id=p_batch_id;
 else
  select count(*),coalesce(sum(gross_amount),0) into v_count,v_sum from public.strategy_merchandise_sales where organization_id=v_org and batch_id=p_batch_id;
 end if;
 select exists(select 1 from (
   select competence,squad_code,person_id from public.strategy_recurring_sales where organization_id=v_org and batch_id=p_batch_id
   union all select competence,squad_code,person_id from public.strategy_merchandise_sales where organization_id=v_org and batch_id=p_batch_id
  ) x join public.strategy_competences c on c.organization_id=v_org and c.competence=x.competence
  where c.status='closed' or exists(select 1 from public.strategy_competence_snapshots s where s.competence_id=c.id)
   or exists(select 1 from public.strategy_financial_closure_v2638 f where f.competence_id=c.id)
   or exists(select 1 from public.squad_months sm join public.squads sq on sq.id=sm.squad_id where sq.organization_id=v_org and sq.code::text=x.squad_code and sm.year=extract(year from x.competence)::int and sm.month=extract(month from x.competence)::int and sm.is_closed=true)
 ) into v_locked;
 select count(*) into v_comm from public.strategy_sales_commissions sc where sc.organization_id=v_org and
 ((sc.source_key='contracted_modules_csv' and sc.sale_id in(select id from public.strategy_recurring_sales where organization_id=v_org and batch_id=p_batch_id)) or
  (sc.source_key='merchandise_sales_csv' and sc.sale_id in(select id from public.strategy_merchandise_sales where organization_id=v_org and batch_id=p_batch_id)));
 -- Se houver lançamento técnico já sincronizado, não se presume um estorno automático seguro.
 select exists(select 1 from public.strategy_sales_commissions sc
  join public.strategy_people p on p.id=sc.person_id and p.organization_id=v_org
  join public.profiles pr on pr.user_id=p.user_id and pr.organization_id=v_org and pr.role='technician'
  join public.technician_monthly tm on tm.user_id=p.user_id
  join public.squad_months sm on sm.id=tm.squad_month_id and sm.year=extract(year from sc.competence)::int and sm.month=extract(month from sc.competence)::int
  join public.squads sq on sq.id=sm.squad_id and sq.organization_id=v_org and sq.code::text=sc.squad_code
  join public.technician_finance_monthly tf on tf.technician_month_id=tm.id
  where sc.organization_id=v_org and tf.sales_commission<>0 and
   ((sc.source_key='contracted_modules_csv' and sc.sale_id in(select id from public.strategy_recurring_sales where batch_id=p_batch_id and organization_id=v_org)) or
    (sc.source_key='merchandise_sales_csv' and sc.sale_id in(select id from public.strategy_merchandise_sales where batch_id=p_batch_id and organization_id=v_org)))
 ) into v_synced;
 return jsonb_build_object('batchId',p_batch_id,'source',v_source,'status',v_batch.status,'sales',v_count,'amount',v_sum,'commissions',v_comm,
  'blocked',v_locked or v_synced or v_count>5000 or v_batch.status not in ('imported','draft'),
  'reason',case when v_locked then 'Competência fechada ou snapshot existente' when v_synced then 'Comissão técnica já lançada: conciliar folha antes do estorno' when v_count>5000 then 'Lote acima de 5.000 vendas' when v_batch.status not in ('imported','draft') then 'Lote não elegível' else null end);
end $$;

create or replace function public.reverse_strategy_commercial_batch_v26311(p_batch_id uuid,p_expected_sales integer,p_reason text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_preview jsonb;v_reversal uuid;v_source text;v_event uuid;v_sale record;v_count int:=0;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Sem acesso.' using errcode='42501';end if;
 if length(btrim(coalesce(p_reason,''))) not between 12 and 500 then raise exception 'Informe justificativa com 12 a 500 caracteres.';end if;
 perform 1 from public.strategy_import_batches where id=p_batch_id and organization_id=v_org for update;
 v_preview:=public.preview_strategy_commercial_batch_reversal_v26311(p_batch_id);
 if (v_preview->>'blocked')::boolean then raise exception 'Estorno bloqueado: %',coalesce(v_preview->>'reason','Verifique as pendências.');end if;
 if (v_preview->>'sales')::int<>p_expected_sales then raise exception 'Quantidade de vendas alterada; confira novamente.';end if;
 v_source:=v_preview->>'source';
 insert into public.strategy_commercial_batch_reversals_v26311(organization_id,batch_id,source_key,reason,sales_count,gross_amount,reversed_by)
 values(v_org,p_batch_id,v_source,btrim(p_reason),p_expected_sales,(v_preview->>'amount')::numeric,auth.uid()) returning id into v_reversal;
 for v_sale in
  select to_jsonb(s) sale_row,s.id,s.event_id,s.competence,s.squad_code,s.person_id from public.strategy_recurring_sales s where s.organization_id=v_org and s.batch_id=p_batch_id and v_source='contracted_modules_csv'
  union all
  select to_jsonb(s),s.id,s.event_id,s.competence,s.squad_code,s.person_id from public.strategy_merchandise_sales s where s.organization_id=v_org and s.batch_id=p_batch_id and v_source='merchandise_sales_csv'
 loop
  insert into public.strategy_commercial_reversed_sales_v26311(organization_id,reversal_id,original_sale_id,original_event_id,sale_data,commission_data)
  values(v_org,v_reversal,v_sale.id,v_sale.event_id,v_sale.sale_row,(select to_jsonb(c) from public.strategy_sales_commissions c where c.organization_id=v_org and c.source_key=v_source and c.sale_id=v_sale.id));
  delete from public.strategy_sales_commissions where organization_id=v_org and source_key=v_source and sale_id=v_sale.id;
  if v_source='contracted_modules_csv' then delete from public.strategy_recurring_sales where organization_id=v_org and id=v_sale.id;
  else delete from public.strategy_merchandise_sales where organization_id=v_org and id=v_sale.id;end if;
  delete from public.strategy_result_attributions where organization_id=v_org and event_id=v_sale.event_id;
  delete from public.strategy_result_events where organization_id=v_org and id=v_sale.event_id;
  v_count:=v_count+1;
 end loop;
 update public.strategy_import_batches set status='reverted',notes=left(coalesce(notes,'')||' | Estornado: '||btrim(p_reason),2000) where id=p_batch_id and organization_id=v_org;
 -- A parcela automática dos líderes ainda abertos passa a refletir as comissões restantes.
 update public.super_admin_commissions c set imported_sales_commission=coalesce((select sum(sc.commission_amount)
  from public.strategy_sales_commissions sc join public.strategy_people p on p.id=sc.person_id and p.organization_id=v_org
  where sc.organization_id=v_org and p.user_id=c.user_id and sc.competence=make_date(c.year,c.month,1)
    and sc.squad_code=c.squad_code and sc.status='calculated'),0),updated_by=auth.uid(),updated_at=now()
 where c.organization_id=v_org and c.squad_code in ('A','B','D','E') and exists(select 1 from public.profiles p where p.organization_id=v_org and p.user_id=c.user_id and p.role='super_admin');
 return jsonb_build_object('reversalId',v_reversal,'removedSales',v_count,'amount',v_preview->>'amount');
end $$;

revoke all on function public.prepare_strategy_leader_sellers_v26311() from public,anon;
revoke all on function public.sync_strategy_leader_sales_v26311(date) from public,anon;
revoke all on function public.preview_strategy_commercial_batch_reversal_v26311(uuid) from public,anon;
revoke all on function public.reverse_strategy_commercial_batch_v26311(uuid,integer,text) from public,anon;
grant execute on function public.prepare_strategy_leader_sellers_v26311() to authenticated;
grant execute on function public.sync_strategy_leader_sales_v26311(date) to authenticated;
grant execute on function public.preview_strategy_commercial_batch_reversal_v26311(uuid) to authenticated;
grant execute on function public.reverse_strategy_commercial_batch_v26311(uuid,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
