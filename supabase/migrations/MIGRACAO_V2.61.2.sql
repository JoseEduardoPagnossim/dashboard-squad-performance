-- Soften Performance Hub V2.61.2
-- Fase 6 - Custo por Produto / Cost to Serve.
--
-- Regras:
--   - o custo oficial continua vindo de strategy_employee_costs + strategy_operational_costs/alocações;
--   - Atendimentos classificados por Produto são o driver padrão do rateio dentro de cada Squad;
--   - a parcela de demanda ainda Não classificada carrega a mesma parcela de custo;
--   - Cost to Serve = custo de pessoas + custo operacional atribuídos ao Produto;
--   - custo/atendimento, custo/resolução e custo/cliente usam os denominadores da V2.61.1;
--   - nenhum custo desaparece: o total por Produto + Não classificado reconcilia com o custo oficial do escopo.

begin;

create or replace function public.sync_strategy_product_cost_sources(
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
  v_people_rows integer:=0;
  v_operational_rows integer:=0;
  v_auto_rows integer:=0;
begin
  if not public.has_strategy_access('edit_costs') then
    raise exception 'strategy product cost sync access denied' using errcode='42501';
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
    raise exception 'strategy competence not found for product cost sync' using errcode='23503';
  end if;
  if v_status='closed' then
    raise exception 'strategy product competence is closed; reopen before syncing cost sources' using errcode='55000';
  end if;

  -- Zera apenas fontes derivadas desta versão no escopo antes de reconstruir.
  -- As que deixarem de existir na origem serão removidas após os UPSERTs.
  update public.strategy_product_sources s
  set source_amount=0,updated_by=v_user,updated_at=now()
  where s.organization_id=v_org
    and s.competence_id=v_comp
    and s.source_domain in ('people_cost','operational_cost')
    and coalesce(s.metadata->>'managed_by','')='V2.61.2'
    and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code);

  with people as (
    select upper(trim(sec.squad_code_snapshot)) squad_code,
      round(coalesce(sum(sec.total_cost),0)::numeric,2) source_amount
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
  select v_org,v_comp,'people_cost','people_cost','strategy_people_cost:'||p.squad_code,
    null,p.source_amount,'BRL',p.squad_code,
    jsonb_build_object('sync_version','V2.61.2','managed_by','V2.61.2','allocation_driver','attendance','source_table','strategy_employee_costs','automatic',true),
    v_user,v_user,now(),now()
  from people p
  on conflict (organization_id,competence_id,source_domain,source_reference)
  do update set
    metric_key=excluded.metric_key,
    source_quantity=null,
    source_amount=excluded.source_amount,
    currency='BRL',
    squad_code_snapshot=excluded.squad_code_snapshot,
    metadata=excluded.metadata,
    updated_by=excluded.updated_by,
    updated_at=now();
  get diagnostics v_people_rows=row_count;

  with op_allocated as (
    select upper(trim(sca.squad_code)) squad_code,
      round(coalesce(sum(sca.allocated_amount),0)::numeric,2) source_amount
    from public.strategy_cost_allocations sca
    join public.strategy_operational_costs soc
      on soc.id=sca.operational_cost_id
     and soc.organization_id=v_org
     and soc.competence_id=v_comp
    where sca.organization_id=v_org
      and upper(trim(sca.squad_code))<>'UNALLOCATED'
      and (v_all or upper(trim(sca.squad_code))=v_code)
    group by upper(trim(sca.squad_code))
  ), op_unallocated as (
    select 'UNALLOCATED'::text squad_code,
      round(coalesce(sum(sca.allocated_amount),0)::numeric,2) source_amount
    from public.strategy_cost_allocations sca
    join public.strategy_operational_costs soc
      on soc.id=sca.operational_cost_id
     and soc.organization_id=v_org
     and soc.competence_id=v_comp
    where sca.organization_id=v_org
      and upper(trim(sca.squad_code))='UNALLOCATED'
      and v_all
    having coalesce(sum(sca.allocated_amount),0)>0
  ), op as (
    select * from op_allocated
    union all
    select * from op_unallocated
  )
  insert into public.strategy_product_sources(
    organization_id,competence_id,source_domain,metric_key,source_reference,
    source_quantity,source_amount,currency,squad_code_snapshot,metadata,
    created_by,updated_by,created_at,updated_at
  )
  select v_org,v_comp,'operational_cost','operational_cost','strategy_operational_cost:'||o.squad_code,
    null,o.source_amount,'BRL',o.squad_code,
    jsonb_build_object('sync_version','V2.61.2','managed_by','V2.61.2','allocation_driver','attendance','source_table','strategy_cost_allocations','automatic',true),
    v_user,v_user,now(),now()
  from op o
  on conflict (organization_id,competence_id,source_domain,source_reference)
  do update set
    metric_key=excluded.metric_key,
    source_quantity=null,
    source_amount=excluded.source_amount,
    currency='BRL',
    squad_code_snapshot=excluded.squad_code_snapshot,
    metadata=excluded.metadata,
    updated_by=excluded.updated_by,
    updated_at=now();
  get diagnostics v_operational_rows=row_count;

  delete from public.strategy_product_sources s
  where s.organization_id=v_org
    and s.competence_id=v_comp
    and s.source_domain in ('people_cost','operational_cost')
    and coalesce(s.metadata->>'managed_by','')='V2.61.2'
    and coalesce(s.source_amount,0)=0
    and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code);

  -- Fontes de custo criadas por esta versão são derivadas e têm o rateio
  -- reconstruído a cada sincronização. A classificação deve ser feita na
  -- fonte de Atendimentos; o custo segue o mesmo driver de forma auditável.
  delete from public.strategy_product_attributions a
  using public.strategy_product_sources s
  where a.source_id=s.id
    and a.organization_id=v_org
    and s.organization_id=v_org
    and s.competence_id=v_comp
    and s.source_domain in ('people_cost','operational_cost')
    and coalesce(s.metadata->>'managed_by','')='V2.61.2'
    and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code);

  with cost_sources as (
    select s.id,s.squad_code_snapshot
    from public.strategy_product_sources s
    where s.organization_id=v_org
      and s.competence_id=v_comp
      and s.source_domain in ('people_cost','operational_cost')
      and coalesce(s.metadata->>'managed_by','')='V2.61.2'
      and upper(trim(coalesce(s.squad_code_snapshot,'')))<>'UNALLOCATED'
      and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code)
  ), attendance_sources as (
    select s.id,s.squad_code_snapshot
    from public.strategy_product_sources s
    where s.organization_id=v_org
      and s.competence_id=v_comp
      and s.source_domain='attendance'
      and lower(trim(s.metric_key))='attendance'
  )
  insert into public.strategy_product_attributions(
    organization_id,source_id,product_id,product_code_snapshot,product_name_snapshot,
    allocation_share,notes,created_by,updated_by,created_at,updated_at
  )
  select v_org,c.id,a.product_id,a.product_code_snapshot,a.product_name_snapshot,
    a.allocation_share,'AUTO:V2.61.2:attendance-driver',v_user,v_user,now(),now()
  from cost_sources c
  join attendance_sources ds
    on upper(trim(coalesce(ds.squad_code_snapshot,'')))=upper(trim(coalesce(c.squad_code_snapshot,'')))
  join public.strategy_product_attributions a
    on a.organization_id=v_org and a.source_id=ds.id
  where a.allocation_share>0;
  get diagnostics v_auto_rows=row_count;

  return jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'people_cost_sources_synced',v_people_rows,
    'operational_cost_sources_synced',v_operational_rows,
    'automatic_product_attributions',v_auto_rows,
    'allocation_driver','attendance'
  );
end;
$$;

revoke all on function public.sync_strategy_product_cost_sources(date,text) from public;
grant execute on function public.sync_strategy_product_cost_sources(date,text) to authenticated;

create or replace function public.get_strategy_product_cost_summary(
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
  v_financial jsonb;
  v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy product cost aggregate access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';
  v_demand:=public.get_strategy_product_demand_summary(p_competence,p_squad_code);
  v_financial:=public.get_strategy_financial_summary(p_competence,p_squad_code);

  with comp as (
    select id
    from public.strategy_competences
    where organization_id=v_org
      and competence=date_trunc('month',p_competence)::date
    limit 1
  ), cost_sources as (
    select s.*,
      case when s.source_domain='people_cost' then 'people_cost' else 'operational_cost' end cost_metric
    from public.strategy_product_sources s
    join comp c on c.id=s.competence_id
    where s.organization_id=v_org
      and s.source_domain in ('people_cost','operational_cost')
      and lower(trim(s.metric_key)) in ('people_cost','operational_cost')
      and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code)
  ), source_share as (
    select s.id,s.cost_metric,coalesce(s.source_amount,0)::numeric source_amount,
      least(1::numeric,greatest(0::numeric,coalesce(sum(a.allocation_share),0))) allocated_share
    from cost_sources s
    left join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
    group by s.id,s.cost_metric,s.source_amount
  ), allocated as (
    select a.product_code_snapshot product_code,
      a.product_name_snapshot product_name,
      false unclassified,
      s.cost_metric,
      (coalesce(s.source_amount,0)*a.allocation_share)::numeric amount
    from cost_sources s
    join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
  ), residual as (
    select 'UNCLASSIFIED'::text product_code,
      'Não classificado'::text product_name,
      true unclassified,
      ss.cost_metric,
      (ss.source_amount*(1-ss.allocated_share))::numeric amount
    from source_share ss
    where (1-ss.allocated_share)>0.000001
  ), combined as (
    select * from allocated
    union all
    select * from residual
  ), cost_rows as (
    select product_code,max(product_name)::text product_name,unclassified,
      coalesce(sum(amount) filter (where cost_metric='people_cost'),0)::numeric people_cost,
      coalesce(sum(amount) filter (where cost_metric='operational_cost'),0)::numeric operational_cost,
      coalesce(sum(amount),0)::numeric total_cost
    from combined
    group by product_code,unclassified
  ), demand_rows as (
    select
      upper(coalesce(x->>'product_code','UNCLASSIFIED')) product_code,
      coalesce((x->>'attendance')::numeric,0) attendance,
      coalesce((x->>'tickets')::numeric,0) tickets,
      coalesce((x->>'clients')::numeric,0) clients,
      coalesce((x->>'resolutions')::numeric,0) resolutions
    from jsonb_array_elements(coalesce(v_demand->'rows','[]'::jsonb)) x
  ), codes as (
    select product_code from cost_rows
    union
    select product_code from demand_rows
  ), rows as (
    select c.product_code,
      coalesce(cr.product_name,case when c.product_code='UNCLASSIFIED' then 'Não classificado' else c.product_code end) product_name,
      c.product_code='UNCLASSIFIED' unclassified,
      coalesce(cr.people_cost,0)::numeric people_cost,
      coalesce(cr.operational_cost,0)::numeric operational_cost,
      coalesce(cr.total_cost,0)::numeric total_cost,
      coalesce(dr.attendance,0)::numeric attendance,
      coalesce(dr.tickets,0)::numeric tickets,
      coalesce(dr.clients,0)::numeric clients,
      coalesce(dr.resolutions,0)::numeric resolutions
    from codes c
    left join cost_rows cr using(product_code)
    left join demand_rows dr using(product_code)
  ), totals as (
    select
      count(*)::integer source_count,
      coalesce(sum(source_amount),0)::numeric total_cost,
      coalesce(sum(source_amount*allocated_share),0)::numeric classified_cost,
      coalesce(sum(source_amount*(1-allocated_share)),0)::numeric unclassified_cost,
      coalesce(sum(source_amount) filter (where cost_metric='people_cost'),0)::numeric people_cost,
      coalesce(sum(source_amount) filter (where cost_metric='operational_cost'),0)::numeric operational_cost
    from source_share
  )
  select jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'allocation_driver','attendance',
    'source_count',coalesce(t.source_count,0),
    'people_cost',round(coalesce(t.people_cost,0),2),
    'operational_cost',round(coalesce(t.operational_cost,0),2),
    'total_cost',round(coalesce(t.total_cost,0),2),
    'classified_cost',round(coalesce(t.classified_cost,0),2),
    'unclassified_cost',round(coalesce(t.unclassified_cost,0),2),
    'cost_coverage_pct',case when coalesce(t.total_cost,0)>0 then round((t.classified_cost/t.total_cost*100)::numeric,2) else null end,
    'financial_total_cost',round(coalesce((v_financial->>'total_cost')::numeric,0),2),
    'reconciliation_gap',round((coalesce(t.total_cost,0)-coalesce((v_financial->>'total_cost')::numeric,0))::numeric,2),
    'attendance_source_available',coalesce((v_demand->>'attendance_source_available')::boolean,false),
    'resolution_source_available',coalesce((v_demand->>'resolution_source_available')::boolean,false),
    'client_source_available',coalesce((v_demand->>'client_source_available')::boolean,false),
    'rows',coalesce((select jsonb_agg(jsonb_build_object(
      'product_code',r.product_code,
      'product_name',r.product_name,
      'unclassified',r.unclassified,
      'people_cost',round(r.people_cost,2),
      'operational_cost',round(r.operational_cost,2),
      'total_cost',round(r.total_cost,2),
      'attendance',r.attendance,
      'tickets',r.tickets,
      'clients',r.clients,
      'resolutions',r.resolutions
    ) order by r.unclassified asc,r.total_cost desc,r.product_name) from rows r),'[]'::jsonb)
  ) into v_result
  from totals t;

  return coalesce(v_result,jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'allocation_driver','attendance','source_count',0,
    'people_cost',0,'operational_cost',0,'total_cost',0,'classified_cost',0,'unclassified_cost',0,'cost_coverage_pct',null,
    'financial_total_cost',coalesce((v_financial->>'total_cost')::numeric,0),'reconciliation_gap',0,
    'attendance_source_available',coalesce((v_demand->>'attendance_source_available')::boolean,false),
    'resolution_source_available',coalesce((v_demand->>'resolution_source_available')::boolean,false),
    'client_source_available',coalesce((v_demand->>'client_source_available')::boolean,false),
    'rows','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_product_cost_summary(date,text) from public;
grant execute on function public.get_strategy_product_cost_summary(date,text) to authenticated;

comment on function public.sync_strategy_product_cost_sources(date,text) is
'V2.61.2: sincroniza custos oficiais para Produto/Squad e replica o rateio de Atendimentos como driver auditavel do Cost to Serve.';
comment on function public.get_strategy_product_cost_summary(date,text) is
'V2.61.2: Cost to Serve por Produto com custo de pessoas, operacional, custo por atendimento/resolucao/cliente no frontend e reconciliacao com o custo oficial.';

select pg_notify('pgrst','reload schema');
commit;
