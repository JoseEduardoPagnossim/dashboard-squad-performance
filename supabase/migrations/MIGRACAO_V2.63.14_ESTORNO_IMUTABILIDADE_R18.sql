-- Hotfix R18: narrow, audited exception to phase8 immutable guard for commercial batch reversal.
-- Apply AFTER R17. No business data is changed by this migration.
-- Direct DELETE/UPDATE remains blocked. Does not change snapshots, monthly finance or operational closure.
begin;

create or replace function public.strategy_phase8_immutable_guard_v2639()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_marker text;
 v_allowed boolean:=false;
begin
 if TG_OP='DELETE' and TG_TABLE_SCHEMA='public' and TG_TABLE_NAME in
    ('strategy_recurring_sales','strategy_merchandise_sales','strategy_sales_commissions') then
  v_marker:=nullif(current_setting('app.strategy_commercial_reversal_id',true),'');
  if v_marker is not null and v_marker ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
   if TG_TABLE_NAME in ('strategy_recurring_sales','strategy_merchandise_sales') then
    -- Only exactly snapshotted rows from the indicated, authorized reversal may be removed.
    select exists (
     select 1 from public.strategy_commercial_batch_reversals_v26311 r
     join public.strategy_commercial_reversed_sales_v26311 a on a.reversal_id=r.id
     where r.id=v_marker::uuid and r.organization_id=OLD.organization_id
       and r.batch_id=OLD.batch_id and a.organization_id=r.organization_id
       and a.original_sale_id=OLD.id and a.sale_data=to_jsonb(OLD)
       and ((TG_TABLE_NAME='strategy_recurring_sales' and r.source_key='contracted_modules_csv')
        or (TG_TABLE_NAME='strategy_merchandise_sales' and r.source_key='merchandise_sales_csv'))
    ) into v_allowed;
   else
    -- Commission must match the archived commission of a sale in the same reversal.
    select exists (
     select 1 from public.strategy_commercial_batch_reversals_v26311 r
     join public.strategy_commercial_reversed_sales_v26311 a on a.reversal_id=r.id
     where r.id=v_marker::uuid and r.organization_id=OLD.organization_id
       and r.source_key=OLD.source_key and a.organization_id=r.organization_id
       and a.original_sale_id=OLD.sale_id and a.commission_data=to_jsonb(OLD)
    ) into v_allowed;
   end if;
  end if;
  if v_allowed then return OLD; end if;
 end if;
 raise exception 'Historico comercial/financeiro imutavel: realize ajuste auditado em uma nova revisao.' using errcode='55000';
end $$;

-- Existing row triggers automatically execute the updated function. Do not disable them.

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
 -- Transaction-local authorization: it only works against immutable sale copies created above.
 perform set_config('app.strategy_commercial_reversal_id',v_reversal::text,true);
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
 perform set_config('app.strategy_commercial_reversal_id','',true);
 update public.strategy_import_batches set status='reverted',notes=left(coalesce(notes,'')||' | Estornado: '||btrim(p_reason),2000) where id=p_batch_id and organization_id=v_org;
 -- A parcela automática dos líderes ainda abertos passa a refletir as comissões restantes.
 update public.super_admin_commissions c set imported_sales_commission=coalesce((select sum(sc.commission_amount)
  from public.strategy_sales_commissions sc join public.strategy_people p on p.id=sc.person_id and p.organization_id=v_org
  where sc.organization_id=v_org and p.user_id=c.user_id and sc.competence=make_date(c.year,c.month,1)
    and sc.squad_code=c.squad_code and sc.status='calculated'),0),updated_by=auth.uid(),updated_at=now()
 where c.organization_id=v_org and c.squad_code in ('A','B','D','E') and exists(select 1 from public.profiles p where p.organization_id=v_org and p.user_id=c.user_id and p.role='super_admin');
 return jsonb_build_object('reversalId',v_reversal,'removedSales',v_count,'amount',v_preview->>'amount');
end $$;

-- Only authenticated frontend callers may invoke the audited reversal RPC.
revoke all on function public.reverse_strategy_commercial_batch_v26311(uuid,integer,text) from public,anon;
grant execute on function public.reverse_strategy_commercial_batch_v26311(uuid,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
