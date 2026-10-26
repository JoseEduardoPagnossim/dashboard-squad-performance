-- Soften Performance Hub V2.61.1
-- Fase 6 - Demanda por Produto.
--
-- Objetivos:
--   - conectar Atendimentos e Resolucoes as fontes oficiais ja existentes;
--   - medir Atendimentos, Chamados, Clientes atendidos e Resolucoes por Produto;
--   - calcular participacao na demanda usando Atendimentos como denominador;
--   - manter qualquer saldo sem Produto como "Nao classificado";
--   - nunca inferir Cliente ou Chamado a partir de Atendimentos.

begin;

create index if not exists idx_strategy_product_sources_demand_metric
  on public.strategy_product_sources(organization_id,competence_id,source_domain,metric_key,squad_code_snapshot);

-- Sincroniza apenas as fontes que ja possuem origem oficial no dashboard.
-- Cliente unico e Chamado nao sao inferidos: entram somente quando uma fonte
-- explicita com metric_key='client' ou metric_key='ticket' for registrada.
create or replace function public.sync_strategy_product_demand_sources(
  p_competence date,
  p_squad_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_user uuid;
  v_comp uuid;
  v_status text;
  v_code text;
  v_all boolean;
  v_attendance_rows integer:=0;
  v_resolution_rows integer:=0;
begin
  if not public.has_strategy_access('edit_costs') then
    raise exception 'strategy product demand sync access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id,auth.uid() into v_org,v_user;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  select sc.id,sc.status into v_comp,v_status
  from public.strategy_competences sc
  where sc.organization_id=v_org
    and sc.competence=date_trunc('month',p_competence)::date
  limit 1;

  if v_comp is null then
    raise exception 'strategy competence not found for product demand sync' using errcode='23503';
  end if;
  if v_status='closed' then
    raise exception 'strategy product competence is closed; reopen before syncing demand sources' using errcode='55000';
  end if;

  with attendance as (
    select upper(trim(s.code)) squad_code,coalesce(sum(tm.att),0)::numeric source_quantity
    from public.squads s
    join public.squad_months sm on sm.squad_id=s.id
    left join public.technician_monthly tm on tm.squad_month_id=sm.id
    where s.organization_id=v_org
      and sm.year=extract(year from p_competence)::int
      and sm.month=extract(month from p_competence)::int
      and (v_all or upper(trim(s.code))=v_code)
    group by upper(trim(s.code))
  )
  insert into public.strategy_product_sources(
    organization_id,competence_id,source_domain,metric_key,source_reference,
    source_quantity,source_amount,currency,squad_code_snapshot,metadata,
    created_by,updated_by,created_at,updated_at
  )
  select v_org,v_comp,'attendance','attendance','operational_attendance:'||a.squad_code,
    a.source_quantity,null,'BRL',a.squad_code,
    jsonb_build_object('sync_version','V2.61.1','source_table','technician_monthly','metric','attendance','automatic',true),
    v_user,v_user,now(),now()
  from attendance a
  on conflict (organization_id,competence_id,source_domain,source_reference)
  do update set
    metric_key=excluded.metric_key,
    source_quantity=excluded.source_quantity,
    source_amount=null,
    squad_code_snapshot=excluded.squad_code_snapshot,
    metadata=excluded.metadata,
    updated_by=excluded.updated_by,
    updated_at=now();
  get diagnostics v_attendance_rows=row_count;

  with resolutions as (
    select upper(trim(r.squad_code_snapshot)) squad_code,coalesce(sum(r.resolutions),0)::numeric source_quantity
    from public.strategy_resolution_metrics r
    where r.organization_id=v_org
      and r.competence_id=v_comp
      and (v_all or upper(trim(r.squad_code_snapshot))=v_code)
    group by upper(trim(r.squad_code_snapshot))
  )
  insert into public.strategy_product_sources(
    organization_id,competence_id,source_domain,metric_key,source_reference,
    source_quantity,source_amount,currency,squad_code_snapshot,metadata,
    created_by,updated_by,created_at,updated_at
  )
  select v_org,v_comp,'resolution','resolution','strategy_resolution:'||r.squad_code,
    r.source_quantity,null,'BRL',r.squad_code,
    jsonb_build_object('sync_version','V2.61.1','source_table','strategy_resolution_metrics','metric','resolution','automatic',true),
    v_user,v_user,now(),now()
  from resolutions r
  on conflict (organization_id,competence_id,source_domain,source_reference)
  do update set
    metric_key=excluded.metric_key,
    source_quantity=excluded.source_quantity,
    source_amount=null,
    squad_code_snapshot=excluded.squad_code_snapshot,
    metadata=excluded.metadata,
    updated_by=excluded.updated_by,
    updated_at=now();
  get diagnostics v_resolution_rows=row_count;

  return jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'attendance_sources_synced',v_attendance_rows,
    'resolution_sources_synced',v_resolution_rows,
    'client_sources_inferred',false,
    'ticket_sources_inferred',false
  );
end;
$$;

revoke all on function public.sync_strategy_product_demand_sources(date,text) from public;
grant execute on function public.sync_strategy_product_demand_sources(date,text) to authenticated;

create or replace function public.get_strategy_product_demand_summary(
  p_competence date,
  p_squad_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_code text;
  v_all boolean;
  v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy product demand aggregate access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  with comp as (
    select id,competence
    from public.strategy_competences
    where organization_id=v_org
      and competence=date_trunc('month',p_competence)::date
    limit 1
  ), demand_sources as (
    select s.*,
      case
        when s.source_domain='attendance' and lower(trim(s.metric_key))='attendance' then 'attendance'
        when s.source_domain='attendance' and lower(trim(s.metric_key))='ticket' then 'ticket'
        when s.source_domain='attendance' and lower(trim(s.metric_key))='client' then 'client'
        when s.source_domain='resolution' and lower(trim(s.metric_key))='resolution' then 'resolution'
        else null
      end demand_metric
    from public.strategy_product_sources s
    join comp c on c.id=s.competence_id
    where s.organization_id=v_org
      and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code)
      and (
        (s.source_domain='attendance' and lower(trim(s.metric_key)) in ('attendance','ticket','client'))
        or (s.source_domain='resolution' and lower(trim(s.metric_key))='resolution')
      )
  ), source_share as (
    select s.id,s.demand_metric,s.source_quantity,
      least(1::numeric,greatest(0::numeric,coalesce(sum(a.allocation_share),0))) allocated_share
    from demand_sources s
    left join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
    group by s.id,s.demand_metric,s.source_quantity
  ), allocated as (
    select
      a.product_code_snapshot product_code,
      a.product_name_snapshot product_name,
      false unclassified,
      s.demand_metric,
      (coalesce(s.source_quantity,0)*a.allocation_share)::numeric quantity
    from demand_sources s
    join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
  ), residual as (
    select
      'UNCLASSIFIED'::text product_code,
      'Não classificado'::text product_name,
      true unclassified,
      ss.demand_metric,
      (coalesce(ss.source_quantity,0)*(1-ss.allocated_share))::numeric quantity
    from source_share ss
    where (1-ss.allocated_share)>0.000001
  ), combined as (
    select * from allocated
    union all
    select * from residual
  ), product_rows as (
    select product_code,max(product_name)::text product_name,unclassified,
      coalesce(sum(quantity) filter (where demand_metric='attendance'),0)::numeric attendance,
      coalesce(sum(quantity) filter (where demand_metric='ticket'),0)::numeric tickets,
      coalesce(sum(quantity) filter (where demand_metric='client'),0)::numeric clients,
      coalesce(sum(quantity) filter (where demand_metric='resolution'),0)::numeric resolutions
    from combined
    group by product_code,unclassified
  ), metric_totals as (
    select demand_metric,
      count(*)::integer source_count,
      coalesce(sum(source_quantity),0)::numeric total_quantity,
      coalesce(sum(source_quantity*allocated_share),0)::numeric classified_quantity,
      coalesce(sum(source_quantity*(1-allocated_share)),0)::numeric unclassified_quantity
    from source_share
    group by demand_metric
  ), totals as (
    select
      coalesce((select total_quantity from metric_totals where demand_metric='attendance'),0)::numeric attendance_total,
      coalesce((select classified_quantity from metric_totals where demand_metric='attendance'),0)::numeric attendance_classified,
      coalesce((select unclassified_quantity from metric_totals where demand_metric='attendance'),0)::numeric attendance_unclassified,
      coalesce((select total_quantity from metric_totals where demand_metric='ticket'),0)::numeric ticket_total,
      coalesce((select classified_quantity from metric_totals where demand_metric='ticket'),0)::numeric ticket_classified,
      coalesce((select unclassified_quantity from metric_totals where demand_metric='ticket'),0)::numeric ticket_unclassified,
      coalesce((select total_quantity from metric_totals where demand_metric='client'),0)::numeric client_total,
      coalesce((select classified_quantity from metric_totals where demand_metric='client'),0)::numeric client_classified,
      coalesce((select unclassified_quantity from metric_totals where demand_metric='client'),0)::numeric client_unclassified,
      coalesce((select total_quantity from metric_totals where demand_metric='resolution'),0)::numeric resolution_total,
      coalesce((select classified_quantity from metric_totals where demand_metric='resolution'),0)::numeric resolution_classified,
      coalesce((select unclassified_quantity from metric_totals where demand_metric='resolution'),0)::numeric resolution_unclassified,
      exists(select 1 from metric_totals where demand_metric='attendance') attendance_source_available,
      exists(select 1 from metric_totals where demand_metric='ticket') ticket_source_available,
      exists(select 1 from metric_totals where demand_metric='client') client_source_available,
      exists(select 1 from metric_totals where demand_metric='resolution') resolution_source_available
  )
  select jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'attendance_total',t.attendance_total,
    'attendance_classified',t.attendance_classified,
    'attendance_unclassified',t.attendance_unclassified,
    'attendance_coverage_pct',case when t.attendance_total>0 then round(t.attendance_classified/t.attendance_total*100,2) else null end,
    'ticket_total',t.ticket_total,
    'ticket_classified',t.ticket_classified,
    'ticket_unclassified',t.ticket_unclassified,
    'ticket_coverage_pct',case when t.ticket_total>0 then round(t.ticket_classified/t.ticket_total*100,2) else null end,
    'client_total',t.client_total,
    'client_classified',t.client_classified,
    'client_unclassified',t.client_unclassified,
    'client_coverage_pct',case when t.client_total>0 then round(t.client_classified/t.client_total*100,2) else null end,
    'resolution_total',t.resolution_total,
    'resolution_classified',t.resolution_classified,
    'resolution_unclassified',t.resolution_unclassified,
    'resolution_coverage_pct',case when t.resolution_total>0 then round(t.resolution_classified/t.resolution_total*100,2) else null end,
    'attendance_source_available',t.attendance_source_available,
    'ticket_source_available',t.ticket_source_available,
    'client_source_available',t.client_source_available,
    'resolution_source_available',t.resolution_source_available,
    'rows',coalesce((select jsonb_agg(jsonb_build_object(
      'product_code',r.product_code,
      'product_name',r.product_name,
      'unclassified',r.unclassified,
      'attendance',r.attendance,
      'tickets',r.tickets,
      'clients',r.clients,
      'resolutions',r.resolutions
    ) order by r.unclassified asc,r.attendance desc,r.product_name) from product_rows r),'[]'::jsonb)
  ) into v_result
  from totals t;

  return coalesce(v_result,jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'attendance_total',0,'attendance_classified',0,'attendance_unclassified',0,'attendance_coverage_pct',null,
    'ticket_total',0,'ticket_classified',0,'ticket_unclassified',0,'ticket_coverage_pct',null,
    'client_total',0,'client_classified',0,'client_unclassified',0,'client_coverage_pct',null,
    'resolution_total',0,'resolution_classified',0,'resolution_unclassified',0,'resolution_coverage_pct',null,
    'attendance_source_available',false,'ticket_source_available',false,'client_source_available',false,'resolution_source_available',false,
    'rows','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_product_demand_summary(date,text) from public;
grant execute on function public.get_strategy_product_demand_summary(date,text) to authenticated;

comment on function public.sync_strategy_product_demand_sources(date,text) is
'V2.61.1: sincroniza Atendimentos e Resolucoes oficiais para a camada Produto/Squad sem inferir Clientes ou Chamados.';
comment on function public.get_strategy_product_demand_summary(date,text) is
'V2.61.1: Demanda por Produto com Atendimentos, participacao na demanda, Clientes, Chamados, Resolucoes e saldo Nao classificado.';

select pg_notify('pgrst','reload schema');
commit;
