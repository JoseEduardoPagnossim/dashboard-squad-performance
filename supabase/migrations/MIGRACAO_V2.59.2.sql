-- Soften Performance Hub V2.59.2
-- Fase 4 - Capacidade utilizada.
--
-- Conceito desta etapa:
--   capacidade utilizada = carga real absorvida pela estrutura disponivel.
--
-- A V2.59.2 NAO calcula percentual de utilizacao. Ela consolida o volume
-- resolvido e a intensidade observada por FTE disponivel. A taxa percentual
-- depende de uma referencia sustentavel e fica reservada para a V2.59.3.

begin;

create or replace function public.get_strategy_capacity_used_summary(
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
    raise exception 'strategy aggregate access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode='42501';
  end if;

  v_code := upper(trim(coalesce(p_squad_code,'')));
  v_all := v_code = '' or v_code = 'ALL';

  with base as (
    select
      sec.id,
      sec.person_id,
      sec.fte::numeric nominal_fte,
      sec.availability_factor::numeric availability_factor,
      upper(trim(coalesce(sec.squad_code_snapshot,''))) squad_code,
      sp.user_id,
      srm.id resolution_metric_id,
      coalesce(srm.resolutions,0)::numeric resolutions
    from public.strategy_employee_costs sec
    join public.strategy_competences sc
      on sc.id=sec.competence_id
     and sc.organization_id=sec.organization_id
    join public.strategy_people sp
      on sp.id=sec.person_id
     and sp.organization_id=sec.organization_id
    left join public.strategy_resolution_metrics srm
      on srm.organization_id=sec.organization_id
     and srm.competence_id=sec.competence_id
     and srm.user_id=sp.user_id
     and upper(trim(srm.squad_code_snapshot))=upper(trim(coalesce(sec.squad_code_snapshot,'')))
    where sec.organization_id=v_org
      and sc.competence=date_trunc('month',p_competence)::date
      and (v_all or upper(trim(coalesce(sec.squad_code_snapshot,'')))=v_code)
  ), agg as (
    select
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      coalesce(sum(nominal_fte) filter (where nominal_fte>0),0)::numeric nominal_fte,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric covered_available_fte,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base
  )
  select jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'used_capacity_unit','resolutions',
    'candidate_count',candidate_count,
    'availability_complete',candidate_count>0 and availability_missing=0,
    'used_capacity_entries',used_capacity_entries,
    'used_capacity_missing',used_capacity_missing,
    'used_capacity_complete',candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0,
    'used_capacity_coverage',case when available_fte_known>0 then round((covered_available_fte/available_fte_known)::numeric,6) else null end,
    'used_capacity_volume',case when candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0 then round(used_capacity_volume,0) else null end,
    'used_per_available_fte',case when candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0 then round((used_capacity_volume/available_fte_known)::numeric,6) else null end,
    'used_capacity_inconsistent',inconsistent_rows>0,
    'used_capacity_inconsistent_rows',inconsistent_rows
  ) into v_result
  from agg;

  return coalesce(v_result,jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'used_capacity_unit','resolutions',
    'candidate_count',0,
    'availability_complete',false,
    'used_capacity_entries',0,
    'used_capacity_missing',0,
    'used_capacity_complete',false,
    'used_capacity_coverage',null,
    'used_capacity_volume',null,
    'used_per_available_fte',null,
    'used_capacity_inconsistent',false,
    'used_capacity_inconsistent_rows',0
  ));
end;
$$;

revoke all on function public.get_strategy_capacity_used_summary(date,text) from public;
grant execute on function public.get_strategy_capacity_used_summary(date,text) to authenticated;

create or replace function public.get_strategy_capacity_used_squad_summary(
  p_competence date
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy aggregate access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode='42501';
  end if;

  with base as (
    select
      upper(trim(coalesce(sec.squad_code_snapshot,''))) squad_code,
      sec.fte::numeric nominal_fte,
      sec.availability_factor::numeric availability_factor,
      srm.id resolution_metric_id,
      coalesce(srm.resolutions,0)::numeric resolutions
    from public.strategy_employee_costs sec
    join public.strategy_competences sc
      on sc.id=sec.competence_id
     and sc.organization_id=sec.organization_id
    join public.strategy_people sp
      on sp.id=sec.person_id
     and sp.organization_id=sec.organization_id
    left join public.strategy_resolution_metrics srm
      on srm.organization_id=sec.organization_id
     and srm.competence_id=sec.competence_id
     and srm.user_id=sp.user_id
     and upper(trim(srm.squad_code_snapshot))=upper(trim(coalesce(sec.squad_code_snapshot,'')))
    where sec.organization_id=v_org
      and sc.competence=date_trunc('month',p_competence)::date
      and nullif(trim(sec.squad_code_snapshot),'') is not null
  ), agg as (
    select
      squad_code,
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric covered_available_fte,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base
    group by squad_code
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'squad_code',squad_code,
    'used_capacity_unit','resolutions',
    'candidate_count',candidate_count,
    'used_capacity_entries',used_capacity_entries,
    'used_capacity_missing',used_capacity_missing,
    'used_capacity_complete',candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0,
    'used_capacity_coverage',case when available_fte_known>0 then round((covered_available_fte/available_fte_known)::numeric,6) else null end,
    'used_capacity_volume',case when candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0 then round(used_capacity_volume,0) else null end,
    'used_per_available_fte',case when candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0 then round((used_capacity_volume/available_fte_known)::numeric,6) else null end,
    'used_capacity_inconsistent',inconsistent_rows>0,
    'used_capacity_inconsistent_rows',inconsistent_rows
  ) order by squad_code),'[]'::jsonb)
  into v_result
  from agg;

  return coalesce(v_result,'[]'::jsonb);
end;
$$;

revoke all on function public.get_strategy_capacity_used_squad_summary(date) from public;
grant execute on function public.get_strategy_capacity_used_squad_summary(date) to authenticated;

comment on function public.get_strategy_capacity_used_summary(date,text) is
'V2.59.2: consolida a carga efetivamente absorvida em resolucoes e resolucoes por FTE disponivel; nao calcula taxa percentual de utilizacao.';
comment on function public.get_strategy_capacity_used_squad_summary(date) is
'V2.59.2: consolida capacidade utilizada por Squad sem expor linhas individuais.';

notify pgrst,'reload schema';
commit;
