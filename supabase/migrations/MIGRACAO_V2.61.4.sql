-- Soften Performance Hub V2.61.4
-- Fase 6 - Unit Economics por Produto.
--
-- Objetivos:
--   - cruzar Demanda, Cost to Serve, FTE e Resultado econômico por Produto;
--   - alocar FTE nominal/disponível pelo mesmo driver de Atendimentos usado no custo;
--   - calcular ROI exclusivamente sobre Receita Direta;
--   - manter Influenciada e Protegida como indicadores de impacto por R$ de custo;
--   - preservar Não classificado e reconciliação com as fontes oficiais.

begin;

create index if not exists idx_strategy_product_sources_fte_metric
  on public.strategy_product_sources(organization_id,competence_id,source_domain,metric_key,squad_code_snapshot);

create or replace function public.sync_strategy_product_unit_economics_sources(
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
  v_demand jsonb;
  v_cost jsonb;
  v_result jsonb;
  v_nominal_rows integer:=0;
  v_available_rows integer:=0;
  v_auto_rows integer:=0;
begin
  if not public.has_strategy_access('edit_costs') then
    raise exception 'strategy product unit economics sync access denied' using errcode='42501';
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
    raise exception 'strategy competence not found for product unit economics sync' using errcode='23503';
  end if;
  if v_status='closed' then
    raise exception 'strategy product competence is closed; reopen before syncing unit economics sources' using errcode='55000';
  end if;

  -- Atualiza primeiro as bases que alimentam Unit Economics. Isso evita que o
  -- usuário compare FTE novo com Demanda/Custo/Resultado de uma sincronização antiga.
  v_demand:=public.sync_strategy_product_demand_sources(p_competence,p_squad_code);
  v_cost:=public.sync_strategy_product_cost_sources(p_competence,p_squad_code);
  v_result:=public.sync_strategy_product_result_sources(p_competence,p_squad_code);

  -- FTE é derivado e reconstruído: as atribuições são automáticas pelo mesmo
  -- driver de Atendimentos utilizado no Cost to Serve.
  delete from public.strategy_product_sources s
  where s.organization_id=v_org
    and s.competence_id=v_comp
    and s.source_domain='fte'
    and coalesce(s.metadata->>'managed_by','')='V2.61.4'
    and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code);

  with fte as (
    select upper(trim(sec.squad_code_snapshot)) squad_code,
      round(coalesce(sum(sec.fte),0)::numeric,6) nominal_fte,
      round(coalesce(sum(sec.fte*sec.availability_factor) filter(where sec.availability_factor is not null),0)::numeric,6) available_fte,
      count(sec.id) filter(where sec.fte>0 and sec.availability_factor is null) availability_missing
    from public.strategy_employee_costs sec
    where sec.organization_id=v_org
      and sec.competence_id=v_comp
      and nullif(trim(sec.squad_code_snapshot),'') is not null
      and (v_all or upper(trim(sec.squad_code_snapshot))=v_code)
    group by upper(trim(sec.squad_code_snapshot))
  )
  insert into public.strategy_product_sources(
    organization_id,competence_id,source_domain,metric_key,source_reference,
    source_quantity,source_amount,currency,squad_code_snapshot,metadata,
    created_by,updated_by,created_at,updated_at
  )
  select v_org,v_comp,'fte','nominal_fte','strategy_capacity_fte:'||f.squad_code||':nominal',
    f.nominal_fte,null,'BRL',f.squad_code,
    jsonb_build_object('sync_version','V2.61.4','managed_by','V2.61.4','allocation_driver','attendance','source_table','strategy_employee_costs','metric','nominal_fte','automatic',true),
    v_user,v_user,now(),now()
  from fte f
  where f.nominal_fte>0
  on conflict (organization_id,competence_id,source_domain,source_reference)
  do update set source_quantity=excluded.source_quantity,source_amount=null,metric_key=excluded.metric_key,
    squad_code_snapshot=excluded.squad_code_snapshot,metadata=excluded.metadata,updated_by=excluded.updated_by,updated_at=now();
  get diagnostics v_nominal_rows=row_count;

  with fte as (
    select upper(trim(sec.squad_code_snapshot)) squad_code,
      round(coalesce(sum(sec.fte),0)::numeric,6) nominal_fte,
      round(coalesce(sum(sec.fte*sec.availability_factor) filter(where sec.availability_factor is not null),0)::numeric,6) available_fte,
      count(sec.id) filter(where sec.fte>0 and sec.availability_factor is null) availability_missing
    from public.strategy_employee_costs sec
    where sec.organization_id=v_org
      and sec.competence_id=v_comp
      and nullif(trim(sec.squad_code_snapshot),'') is not null
      and (v_all or upper(trim(sec.squad_code_snapshot))=v_code)
    group by upper(trim(sec.squad_code_snapshot))
  )
  insert into public.strategy_product_sources(
    organization_id,competence_id,source_domain,metric_key,source_reference,
    source_quantity,source_amount,currency,squad_code_snapshot,metadata,
    created_by,updated_by,created_at,updated_at
  )
  select v_org,v_comp,'fte','available_fte','strategy_capacity_fte:'||f.squad_code||':available',
    f.available_fte,null,'BRL',f.squad_code,
    jsonb_build_object('sync_version','V2.61.4','managed_by','V2.61.4','allocation_driver','attendance','source_table','strategy_employee_costs','metric','available_fte','availability_complete',true,'automatic',true),
    v_user,v_user,now(),now()
  from fte f
  where f.nominal_fte>0 and f.availability_missing=0
  on conflict (organization_id,competence_id,source_domain,source_reference)
  do update set source_quantity=excluded.source_quantity,source_amount=null,metric_key=excluded.metric_key,
    squad_code_snapshot=excluded.squad_code_snapshot,metadata=excluded.metadata,updated_by=excluded.updated_by,updated_at=now();
  get diagnostics v_available_rows=row_count;

  -- Replica a classificação da Demanda no FTE. O FTE alocado representa
  -- consumo equivalente de capacidade; não é apontamento de horas por Produto.
  with fte_sources as (
    select s.id,s.squad_code_snapshot
    from public.strategy_product_sources s
    where s.organization_id=v_org and s.competence_id=v_comp and s.source_domain='fte'
      and coalesce(s.metadata->>'managed_by','')='V2.61.4'
      and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code)
  ), attendance_sources as (
    select s.id,s.squad_code_snapshot
    from public.strategy_product_sources s
    where s.organization_id=v_org and s.competence_id=v_comp
      and s.source_domain='attendance' and lower(trim(s.metric_key))='attendance'
  )
  insert into public.strategy_product_attributions(
    organization_id,source_id,product_id,product_code_snapshot,product_name_snapshot,
    allocation_share,notes,created_by,updated_by,created_at,updated_at
  )
  select v_org,f.id,a.product_id,a.product_code_snapshot,a.product_name_snapshot,
    a.allocation_share,'AUTO:V2.61.4:attendance-driver',v_user,v_user,now(),now()
  from fte_sources f
  join attendance_sources ds
    on upper(trim(coalesce(ds.squad_code_snapshot,'')))=upper(trim(coalesce(f.squad_code_snapshot,'')))
  join public.strategy_product_attributions a
    on a.organization_id=v_org and a.source_id=ds.id
  where a.allocation_share>0
  on conflict (source_id,product_id)
  do update set allocation_share=excluded.allocation_share,notes=excluded.notes,updated_by=excluded.updated_by,updated_at=now();
  get diagnostics v_auto_rows=row_count;

  return jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'demand_sync',v_demand,'cost_sync',v_cost,'result_sync',v_result,
    'nominal_fte_sources_synced',v_nominal_rows,
    'available_fte_sources_synced',v_available_rows,
    'automatic_product_attributions',v_auto_rows,
    'allocation_driver','attendance'
  );
end;
$$;

revoke all on function public.sync_strategy_product_unit_economics_sources(date,text) from public;
grant execute on function public.sync_strategy_product_unit_economics_sources(date,text) to authenticated;

create or replace function public.get_strategy_product_unit_economics_summary(
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
  v_demand jsonb;
  v_cost jsonb;
  v_result jsonb;
  v_capacity jsonb;
  v_output jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy product unit economics aggregate access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';
  v_demand:=public.get_strategy_product_demand_summary(p_competence,p_squad_code);
  v_cost:=public.get_strategy_product_cost_summary(p_competence,p_squad_code);
  v_result:=public.get_strategy_product_result_summary(p_competence,p_squad_code);
  v_capacity:=public.get_strategy_capacity_summary(p_competence,p_squad_code);

  with comp as (
    select id from public.strategy_competences
    where organization_id=v_org and competence=date_trunc('month',p_competence)::date limit 1
  ), fte_sources as (
    select s.id,lower(trim(s.metric_key)) metric_key,coalesce(s.source_quantity,0)::numeric source_quantity
    from public.strategy_product_sources s join comp c on c.id=s.competence_id
    where s.organization_id=v_org and s.source_domain='fte'
      and lower(trim(s.metric_key)) in ('nominal_fte','available_fte')
      and coalesce(s.metadata->>'managed_by','')='V2.61.4'
      and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code)
  ), fte_share as (
    select s.id,s.metric_key,s.source_quantity,
      least(1::numeric,greatest(0::numeric,coalesce(sum(a.allocation_share),0))) allocated_share
    from fte_sources s left join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
    group by s.id,s.metric_key,s.source_quantity
  ), fte_allocated as (
    select a.product_code_snapshot product_code,a.product_name_snapshot product_name,false unclassified,
      s.metric_key,(s.source_quantity*a.allocation_share)::numeric quantity
    from fte_sources s join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
  ), fte_residual as (
    select 'UNCLASSIFIED'::text product_code,'Não classificado'::text product_name,true unclassified,
      ss.metric_key,(ss.source_quantity*(1-ss.allocated_share))::numeric quantity
    from fte_share ss where (1-ss.allocated_share)>0.000001
  ), fte_combined as (
    select * from fte_allocated union all select * from fte_residual
  ), fte_rows as (
    select product_code,max(product_name)::text product_name,unclassified,
      coalesce(sum(quantity) filter(where metric_key='nominal_fte'),0)::numeric nominal_fte,
      case when exists(select 1 from fte_sources where metric_key='available_fte')
        then coalesce(sum(quantity) filter(where metric_key='available_fte'),0)::numeric else null end available_fte
    from fte_combined group by product_code,unclassified
  ), demand_rows as (
    select upper(coalesce(x->>'product_code','UNCLASSIFIED')) product_code,
      coalesce(x->>'product_name',case when upper(coalesce(x->>'product_code','UNCLASSIFIED'))='UNCLASSIFIED' then 'Não classificado' else upper(coalesce(x->>'product_code','')) end) product_name,
      coalesce(nullif(x->>'attendance','')::numeric,0) attendance,
      coalesce(nullif(x->>'tickets','')::numeric,0) tickets,
      coalesce(nullif(x->>'clients','')::numeric,0) clients,
      coalesce(nullif(x->>'resolutions','')::numeric,0) resolutions
    from jsonb_array_elements(coalesce(v_demand->'rows','[]'::jsonb)) x
  ), cost_rows as (
    select upper(coalesce(x->>'product_code','UNCLASSIFIED')) product_code,
      coalesce(nullif(x->>'people_cost','')::numeric,0) people_cost,
      coalesce(nullif(x->>'operational_cost','')::numeric,0) operational_cost,
      coalesce(nullif(x->>'total_cost','')::numeric,0) total_cost
    from jsonb_array_elements(coalesce(v_cost->'rows','[]'::jsonb)) x
  ), result_rows as (
    select upper(coalesce(x->>'product_code','UNCLASSIFIED')) product_code,
      coalesce(x->>'product_name',case when upper(coalesce(x->>'product_code','UNCLASSIFIED'))='UNCLASSIFIED' then 'Não classificado' else upper(coalesce(x->>'product_code','')) end) product_name,
      coalesce(nullif(x->>'direct_revenue','')::numeric,0) direct_revenue,
      coalesce(nullif(x->>'influenced_revenue','')::numeric,0) influenced_revenue,
      coalesce(nullif(x->>'protected_revenue','')::numeric,0) protected_revenue,
      coalesce(nullif(x->>'direct_mrr','')::numeric,0) direct_mrr,
      coalesce(nullif(x->>'influenced_mrr','')::numeric,0) influenced_mrr,
      coalesce(nullif(x->>'protected_mrr','')::numeric,0) protected_mrr
    from jsonb_array_elements(coalesce(v_result->'rows','[]'::jsonb)) x
  ), codes as (
    select product_code from demand_rows union select product_code from cost_rows
    union select product_code from result_rows union select product_code from fte_rows
  ), rows as (
    select c.product_code,
      coalesce(fr.product_name,dr.product_name,rr.product_name,case when c.product_code='UNCLASSIFIED' then 'Não classificado' else c.product_code end) product_name,
      c.product_code='UNCLASSIFIED' unclassified,
      coalesce(dr.attendance,0)::numeric attendance,coalesce(dr.tickets,0)::numeric tickets,coalesce(dr.clients,0)::numeric clients,coalesce(dr.resolutions,0)::numeric resolutions,
      coalesce(cr.people_cost,0)::numeric people_cost,coalesce(cr.operational_cost,0)::numeric operational_cost,coalesce(cr.total_cost,0)::numeric total_cost,
      coalesce(fr.nominal_fte,0)::numeric nominal_fte,fr.available_fte,
      coalesce(rr.direct_revenue,0)::numeric direct_revenue,coalesce(rr.influenced_revenue,0)::numeric influenced_revenue,coalesce(rr.protected_revenue,0)::numeric protected_revenue,
      coalesce(rr.direct_mrr,0)::numeric direct_mrr,coalesce(rr.influenced_mrr,0)::numeric influenced_mrr,coalesce(rr.protected_mrr,0)::numeric protected_mrr
    from codes c
    left join demand_rows dr using(product_code)
    left join cost_rows cr using(product_code)
    left join result_rows rr using(product_code)
    left join fte_rows fr using(product_code)
  ), fte_totals as (
    select
      coalesce(sum(source_quantity) filter(where metric_key='nominal_fte'),0)::numeric nominal_fte,
      coalesce(sum(source_quantity*allocated_share) filter(where metric_key='nominal_fte'),0)::numeric classified_nominal_fte,
      coalesce(sum(source_quantity*(1-allocated_share)) filter(where metric_key='nominal_fte'),0)::numeric unclassified_nominal_fte,
      case when exists(select 1 from fte_sources where metric_key='available_fte') then coalesce(sum(source_quantity) filter(where metric_key='available_fte'),0)::numeric else null end available_fte
    from fte_share
  )
  select jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'allocation_driver','attendance',
    'attendance_total',coalesce((v_demand->>'attendance_total')::numeric,0),
    'resolutions_total',coalesce((v_demand->>'resolution_total')::numeric,0),
    'clients_total',coalesce((v_demand->>'client_total')::numeric,0),
    'total_cost',coalesce((v_cost->>'total_cost')::numeric,0),
    'direct_revenue',coalesce((v_result->>'direct_revenue')::numeric,0),
    'influenced_revenue',coalesce((v_result->>'influenced_revenue')::numeric,0),
    'protected_revenue',coalesce((v_result->>'protected_revenue')::numeric,0),
    'protected_mrr',coalesce((v_result->>'protected_mrr')::numeric,0),
    'nominal_fte',round(coalesce(ft.nominal_fte,0),6),
    'available_fte',case when coalesce((v_capacity->>'availability_complete')::boolean,false) then round(coalesce(ft.available_fte,0),6) else null end,
    'availability_complete',coalesce((v_capacity->>'availability_complete')::boolean,false),
    'classified_nominal_fte',round(coalesce(ft.classified_nominal_fte,0),6),
    'unclassified_nominal_fte',round(coalesce(ft.unclassified_nominal_fte,0),6),
    'fte_coverage_pct',case when coalesce(ft.nominal_fte,0)>0 then round((ft.classified_nominal_fte/ft.nominal_fte*100)::numeric,2) else null end,
    'official_nominal_fte',coalesce((v_capacity->>'nominal_fte')::numeric,0),
    'official_available_fte',case when coalesce((v_capacity->>'availability_complete')::boolean,false) then (v_capacity->>'available_fte')::numeric else null end,
    'nominal_fte_reconciliation_gap',round((coalesce(ft.nominal_fte,0)-coalesce((v_capacity->>'nominal_fte')::numeric,0))::numeric,6),
    'available_fte_reconciliation_gap',case when coalesce((v_capacity->>'availability_complete')::boolean,false) then round((coalesce(ft.available_fte,0)-coalesce((v_capacity->>'available_fte')::numeric,0))::numeric,6) else null end,
    'demand_reconciled',(select abs(coalesce(sum(dr.attendance),0)-coalesce((v_demand->>'attendance_total')::numeric,0))<=0.0001 from demand_rows dr),
    'cost_reconciled',abs(coalesce((v_cost->>'reconciliation_gap')::numeric,0))<=0.01,
    'direct_reconciled',abs(coalesce((v_result->>'direct_revenue')::numeric,0)-coalesce((v_result->>'official_direct_revenue')::numeric,0))<=0.01,
    'influenced_reconciled',abs(coalesce((v_result->>'influenced_revenue')::numeric,0)-coalesce((v_result->>'official_influenced_revenue')::numeric,0))<=0.01,
    'protected_reconciled',abs(coalesce((v_result->>'protected_revenue')::numeric,0)-coalesce((v_result->>'official_protected_revenue')::numeric,0))<=0.01,
    'fte_reconciled',abs(coalesce(ft.nominal_fte,0)-coalesce((v_capacity->>'nominal_fte')::numeric,0))<=0.0001
      and (not coalesce((v_capacity->>'availability_complete')::boolean,false) or abs(coalesce(ft.available_fte,0)-coalesce((v_capacity->>'available_fte')::numeric,0))<=0.0001),
    'attendance_source_available',coalesce((v_demand->>'attendance_source_available')::boolean,false),
    'resolution_source_available',coalesce((v_demand->>'resolution_source_available')::boolean,false),
    'client_source_available',coalesce((v_demand->>'client_source_available')::boolean,false),
    'rows',coalesce((select jsonb_agg(jsonb_build_object(
      'product_code',r.product_code,'product_name',r.product_name,'unclassified',r.unclassified,
      'attendance',r.attendance,'tickets',r.tickets,'clients',r.clients,'resolutions',r.resolutions,
      'people_cost',round(r.people_cost,2),'operational_cost',round(r.operational_cost,2),'total_cost',round(r.total_cost,2),
      'nominal_fte',round(r.nominal_fte,6),'available_fte',case when coalesce((v_capacity->>'availability_complete')::boolean,false) then round(coalesce(r.available_fte,0),6) else null end,
      'direct_revenue',round(r.direct_revenue,2),'influenced_revenue',round(r.influenced_revenue,2),'protected_revenue',round(r.protected_revenue,2),
      'direct_mrr',round(r.direct_mrr,2),'influenced_mrr',round(r.influenced_mrr,2),'protected_mrr',round(r.protected_mrr,2)
    ) order by r.unclassified,r.product_name) from rows r),'[]'::jsonb)
  ) into v_output
  from fte_totals ft;

  return coalesce(v_output,jsonb_build_object('source_available',true,'rows','[]'::jsonb));
end;
$$;

revoke all on function public.get_strategy_product_unit_economics_summary(date,text) from public;
grant execute on function public.get_strategy_product_unit_economics_summary(date,text) to authenticated;

comment on function public.sync_strategy_product_unit_economics_sources(date,text) is
'V2.61.4: atualiza Demanda, Custo e Resultado e sincroniza FTE nominal/disponível como capacidade equivalente alocada por Atendimentos.';
comment on function public.get_strategy_product_unit_economics_summary(date,text) is
'V2.61.4: consolida Unit Economics por Produto sem somar Receita Direta, Influenciada e Protegida em um único resultado.';

select pg_notify('pgrst','reload schema');
commit;
