-- Soften Performance Hub V2.60.6
-- Fase 5 - ROI e retorno operacional.
--
-- Regras economicas:
--   - ROI usa somente Receita Direta realizada;
--   - retorno liquido direto = Receita Direta - custo;
--   - cobertura direta = Receita Direta / custo;
--   - Receita Influenciada e Protegida permanecem independentes e aparecem apenas
--     como impacto por R$ de custo, nunca como parte do ROI;
--   - tecnico usa custo pessoal; Squad/operacao usam custo total com rateio operacional.

begin;

create or replace function public.get_strategy_result_roi_summary(
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
  v_code text;
  v_all boolean;
  v_result jsonb;
  v_financial jsonb;
  v_costs jsonb;
  v_cost numeric;
  v_direct numeric;
  v_influenced numeric;
  v_protected numeric;
  v_fte numeric;
  v_rows jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy aggregate ROI access denied' using errcode='42501';
  end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  v_result:=public.get_strategy_result_squad_summary(p_competence,p_squad_code);
  v_financial:=public.get_strategy_financial_summary(p_competence,p_squad_code);
  v_costs:=public.get_strategy_squad_cost_summary(p_competence);

  v_cost:=greatest(0,coalesce((v_financial->>'total_cost')::numeric,0));
  v_fte:=greatest(0,coalesce((v_financial->>'fte')::numeric,0));
  v_direct:=greatest(0,coalesce((v_result->>'direct_revenue')::numeric,0));
  v_influenced:=greatest(0,coalesce((v_result->>'influenced_revenue')::numeric,0));
  v_protected:=greatest(0,coalesce((v_result->>'protected_revenue')::numeric,0));

  with result_rows as (
    select
      upper(trim(coalesce(x->>'squad_code',''))) squad_code,
      greatest(0,coalesce((x->>'direct_revenue')::numeric,0)) direct_revenue,
      greatest(0,coalesce((x->>'influenced_revenue')::numeric,0)) influenced_revenue,
      greatest(0,coalesce((x->>'protected_revenue')::numeric,0)) protected_revenue,
      greatest(0,coalesce((x->>'direct_mrr')::numeric,0)) direct_mrr,
      greatest(0,coalesce((x->>'influenced_mrr')::numeric,0)) influenced_mrr,
      greatest(0,coalesce((x->>'protected_mrr')::numeric,0)) protected_mrr
    from jsonb_array_elements(coalesce(v_result->'rows','[]'::jsonb)) x
  ), cost_rows as (
    select
      upper(trim(coalesce(x->>'squad_code',''))) squad_code,
      greatest(0,coalesce((x->>'total_cost')::numeric,0)) total_cost,
      greatest(0,coalesce((x->>'people_cost')::numeric,0)) people_cost,
      greatest(0,coalesce((x->>'operational_cost')::numeric,0)) operational_cost,
      greatest(0,coalesce((x->>'fte')::numeric,0)) fte
    from jsonb_array_elements(coalesce(v_costs,'[]'::jsonb)) x
    where v_all or upper(trim(coalesce(x->>'squad_code','')))=v_code
  ), codes as (
    select squad_code from result_rows where squad_code<>''
    union
    select squad_code from cost_rows where squad_code<>''
  ), joined as (
    select
      c.squad_code,
      coalesce(cr.total_cost,0) total_cost,
      coalesce(cr.people_cost,0) people_cost,
      coalesce(cr.operational_cost,0) operational_cost,
      coalesce(cr.fte,0) fte,
      coalesce(rr.direct_revenue,0) direct_revenue,
      coalesce(rr.influenced_revenue,0) influenced_revenue,
      coalesce(rr.protected_revenue,0) protected_revenue,
      coalesce(rr.direct_mrr,0) direct_mrr,
      coalesce(rr.influenced_mrr,0) influenced_mrr,
      coalesce(rr.protected_mrr,0) protected_mrr
    from codes c
    left join result_rows rr using(squad_code)
    left join cost_rows cr using(squad_code)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'squad_code',squad_code,
    'total_cost',round(total_cost,2),
    'people_cost',round(people_cost,2),
    'operational_cost',round(operational_cost,2),
    'fte',round(fte,2),
    'direct_revenue',round(direct_revenue,2),
    'influenced_revenue',round(influenced_revenue,2),
    'protected_revenue',round(protected_revenue,2),
    'direct_mrr',round(direct_mrr,2),
    'influenced_mrr',round(influenced_mrr,2),
    'protected_mrr',round(protected_mrr,2),
    'direct_net_return',round(direct_revenue-total_cost,2),
    'direct_roi_pct',case when total_cost>0 then round(((direct_revenue-total_cost)/total_cost*100)::numeric,2) else null end,
    'direct_cost_coverage',case when total_cost>0 then round((direct_revenue/total_cost)::numeric,4) else null end,
    'influenced_impact_per_cost',case when total_cost>0 then round((influenced_revenue/total_cost)::numeric,4) else null end,
    'protected_impact_per_cost',case when total_cost>0 then round((protected_revenue/total_cost)::numeric,4) else null end,
    'direct_revenue_per_fte',case when fte>0 then round((direct_revenue/fte)::numeric,2) else null end,
    'protected_mrr_per_fte',case when fte>0 then round((protected_mrr/fte)::numeric,2) else null end
  ) order by squad_code),'[]'::jsonb)
  into v_rows
  from joined;

  return jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'total_cost',round(v_cost,2),
    'fte',round(v_fte,2),
    'direct_revenue',round(v_direct,2),
    'influenced_revenue',round(v_influenced,2),
    'protected_revenue',round(v_protected,2),
    'direct_net_return',round(v_direct-v_cost,2),
    'direct_roi_pct',case when v_cost>0 then round(((v_direct-v_cost)/v_cost*100)::numeric,2) else null end,
    'direct_cost_coverage',case when v_cost>0 then round((v_direct/v_cost)::numeric,4) else null end,
    'influenced_impact_per_cost',case when v_cost>0 then round((v_influenced/v_cost)::numeric,4) else null end,
    'protected_impact_per_cost',case when v_cost>0 then round((v_protected/v_cost)::numeric,4) else null end,
    'direct_revenue_per_fte',case when v_fte>0 then round((v_direct/v_fte)::numeric,2) else null end,
    'protected_mrr_per_fte',case when v_fte>0 then round((greatest(0,coalesce((v_result->>'protected_mrr')::numeric,0))/v_fte)::numeric,2) else null end,
    'rows',coalesce(v_rows,'[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_strategy_result_roi_summary(date,text) from public;
grant execute on function public.get_strategy_result_roi_summary(date,text) to authenticated;

comment on function public.get_strategy_result_roi_summary(date,text) is
'V2.60.6: cruza Resultado por Squad com custos. ROI considera somente Receita Direta; Influenciada e Protegida permanecem impactos separados por R$ de custo.';

create or replace function public.get_strategy_result_technician_roi_summary(
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
  v_competence_id uuid;
  v_result jsonb;
  v_rows jsonb;
  v_cost_total numeric;
  v_direct numeric;
  v_influenced numeric;
  v_protected numeric;
begin
  if not public.has_strategy_access('people_costs') then
    raise exception 'strategy technician ROI access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode='42501';
  end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  select id into v_competence_id
  from public.strategy_competences
  where organization_id=v_org
    and competence=date_trunc('month',p_competence)::date
  limit 1;

  v_result:=public.get_strategy_result_technician_summary(p_competence,p_squad_code);

  with result_rows as (
    select
      x,
      nullif(x->>'person_id','')::uuid person_id,
      nullif(x->>'user_id','')::uuid user_id,
      upper(trim(coalesce(x->>'squad_code',''))) squad_code,
      greatest(0,coalesce((x->>'direct_revenue')::numeric,0)) direct_revenue,
      greatest(0,coalesce((x->>'influenced_revenue')::numeric,0)) influenced_revenue,
      greatest(0,coalesce((x->>'protected_revenue')::numeric,0)) protected_revenue
    from jsonb_array_elements(coalesce(v_result->'rows','[]'::jsonb)) x
  ), resolved as (
    select
      r.*,
      coalesce(r.person_id,sp.id) resolved_person_id
    from result_rows r
    left join public.strategy_people sp
      on sp.organization_id=v_org
     and r.person_id is null
     and r.user_id is not null
     and sp.user_id=r.user_id
  ), joined as (
    select
      r.x,
      r.squad_code,
      r.direct_revenue,
      r.influenced_revenue,
      r.protected_revenue,
      coalesce(sec.total_cost,0)::numeric total_cost,
      coalesce(sec.fte,0)::numeric fte,
      (sec.id is not null) cost_available
    from resolved r
    left join public.strategy_employee_costs sec
      on sec.organization_id=v_org
     and sec.competence_id=v_competence_id
     and sec.person_id=r.resolved_person_id
  )
  select
    coalesce(jsonb_agg(
      x || jsonb_build_object(
        'cost_available',cost_available,
        'total_cost',round(total_cost,2),
        'fte',round(fte,2),
        'direct_net_return',case when cost_available then round(direct_revenue-total_cost,2) else null end,
        'direct_roi_pct',case when total_cost>0 then round(((direct_revenue-total_cost)/total_cost*100)::numeric,2) else null end,
        'direct_cost_coverage',case when total_cost>0 then round((direct_revenue/total_cost)::numeric,4) else null end,
        'influenced_impact_per_cost',case when total_cost>0 then round((influenced_revenue/total_cost)::numeric,4) else null end,
        'protected_impact_per_cost',case when total_cost>0 then round((protected_revenue/total_cost)::numeric,4) else null end,
        'direct_revenue_per_fte',case when fte>0 then round((direct_revenue/fte)::numeric,2) else null end
      ) order by coalesce(x->>'technician_name',''),coalesce(x->>'squad_code','')
    ),'[]'::jsonb),
    coalesce(sum(total_cost) filter (where cost_available),0),
    coalesce(sum(direct_revenue) filter (where cost_available),0),
    coalesce(sum(influenced_revenue) filter (where cost_available),0),
    coalesce(sum(protected_revenue) filter (where cost_available),0)
  into v_rows,v_cost_total,v_direct,v_influenced,v_protected
  from joined;

  return jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'technician_count',coalesce((v_result->>'technician_count')::bigint,0),
    'costed_technician_count',(select count(*) from jsonb_array_elements(v_rows) x where coalesce((x->>'cost_available')::boolean,false)),
    'technician_cost_total',round(v_cost_total,2),
    'direct_revenue',round(v_direct,2),
    'influenced_revenue',round(v_influenced,2),
    'protected_revenue',round(v_protected,2),
    'direct_net_return',round(v_direct-v_cost_total,2),
    'direct_roi_pct',case when v_cost_total>0 then round(((v_direct-v_cost_total)/v_cost_total*100)::numeric,2) else null end,
    'direct_cost_coverage',case when v_cost_total>0 then round((v_direct/v_cost_total)::numeric,4) else null end,
    'rows',coalesce(v_rows,'[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_strategy_result_technician_roi_summary(date,text) from public;
grant execute on function public.get_strategy_result_technician_roi_summary(date,text) to authenticated;

comment on function public.get_strategy_result_technician_roi_summary(date,text) is
'V2.60.6: cruza contribuicao individual com custo pessoal. ROI individual considera somente Receita Direta; demais naturezas permanecem impactos separados.';

notify pgrst,'reload schema';
commit;
