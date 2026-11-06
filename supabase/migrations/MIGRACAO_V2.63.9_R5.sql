-- R5: novas vendas usam Vl Anterior como base comercial; Vl Atual Ativo preservado como MRR.
-- Nao corrige automaticamente historico de vendas ou comissoes. Executar em homologacao.
begin;
alter table public.strategy_recurring_sales add column if not exists active_monthly_amount numeric(14,2);
comment on column public.strategy_recurring_sales.monthly_amount is 'Base comercial (Vl Anterior) para registros R5; registros antigos preservam valor importado original';
comment on column public.strategy_recurring_sales.active_monthly_amount is 'MRR ativo Vl Atual Ativo para novas importacoes R5; NULL nos registros historicos anteriores';
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
   or (v_squad<>'C' and (v_profile.role<>'technician' or v_person.functional_team='pre_attendance')) then raise exception 'Conta/squad nao elegivel.';end if;
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
revoke all on function public.import_strategy_recurring_sales_v2639_r5(uuid,jsonb) from public,anon;
grant execute on function public.import_strategy_recurring_sales_v2639_r5(uuid,jsonb) to authenticated;
commit;
