-- R17: estorno comercial em cascata por lote (apos R16).
-- Mantidas travas estrategicas, fechamento operacional posterior, acesso por organizacao,
-- lote elegivel e auditoria. Nao modifica comissoes manuais ou snapshots.
begin;
create or replace function public.preview_strategy_commercial_batch_reversal_v26311(p_batch_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_source text;v_batch public.strategy_import_batches%rowtype;v_count int;v_sum numeric;v_locked boolean;v_operational boolean;v_comm int;
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

 ) into v_locked;
 -- Fechamento operacional anterior a importação não congela uma venda comercial posterior.
 -- Fechamentos realizados APÓS o lote continuam exigindo conferência por segurança.
 select exists(select 1 from (
   select competence,squad_code from public.strategy_recurring_sales where organization_id=v_org and batch_id=p_batch_id
   union all select competence,squad_code from public.strategy_merchandise_sales where organization_id=v_org and batch_id=p_batch_id
 ) x join public.squads sq on sq.organization_id=v_org and sq.code::text=x.squad_code
 join public.squad_months sm on sm.squad_id=sq.id and sm.year=extract(year from x.competence)::int and sm.month=extract(month from x.competence)::int
 where sm.is_closed=true and (sm.closed_at is null or sm.closed_at>=v_batch.created_at)
 ) into v_operational;
 select count(*) into v_comm from public.strategy_sales_commissions sc where sc.organization_id=v_org and
 ((sc.source_key='contracted_modules_csv' and sc.sale_id in(select id from public.strategy_recurring_sales where organization_id=v_org and batch_id=p_batch_id)) or
  (sc.source_key='merchandise_sales_csv' and sc.sale_id in(select id from public.strategy_merchandise_sales where organization_id=v_org and batch_id=p_batch_id)));
 -- A comissao manual da folha nao comprova sincronizacao com este lote.
 -- A RPC de estorno apaga em cascata somente as vendas e comissoes comerciais
 -- vinculadas ao lote, com copia imutavel para auditoria.
 return jsonb_build_object('batchId',p_batch_id,'source',v_source,'status',v_batch.status,'sales',v_count,'amount',v_sum,'commissions',v_comm,
  'blocked',v_locked or v_operational or v_count>5000 or v_batch.status not in ('imported','draft') or v_count=0,
  'reason',case when v_locked then 'Competência fechada ou snapshot existente' when v_operational then 'Fechamento operacional posterior à importação: conferir histórico' when v_count>5000 then 'Lote acima de 5.000 vendas' when v_count=0 or v_batch.status not in ('imported','draft') then 'Lote não elegível' else null end);
end $$;


revoke all on function public.preview_strategy_commercial_batch_reversal_v26311(uuid) from public,anon;
grant execute on function public.preview_strategy_commercial_batch_reversal_v26311(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
