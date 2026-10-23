-- Soften Performance Hub V2.59.3
-- Fase 4 - Utilizacao, ociosidade e sobrecarga.
--
-- Publica historico agregado de capacidade para que a aplicacao compare a
-- carga atual com competencias anteriores FECHADAS e completas.
-- A migration nao cria tabela, nao altera custos e nao presume disponibilidade
-- para competencias historicas sem availability_factor.

begin;

create or replace function public.get_strategy_capacity_utilization_history()
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
      sc.competence::date competence,
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
      and sc.status='closed'
  ), squad_agg as (
    select
      competence,
      squad_code,
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base
    where nullif(squad_code,'') is not null
    group by competence,squad_code
  ), operation_agg as (
    select
      competence,
      'ALL'::text squad_code,
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base
    group by competence
  ), rows as (
    select * from operation_agg
    union all
    select * from squad_agg
  ), normalized as (
    select
      competence,squad_code,candidate_count,availability_missing,available_fte_known,
      used_capacity_entries,used_capacity_missing,used_capacity_volume,inconsistent_rows,
      (candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0) complete
    from rows
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'competence',to_char(competence,'YYYY-MM'),
    'squad_code',squad_code,
    'status','closed',
    'candidate_count',candidate_count,
    'availability_missing',availability_missing,
    'used_capacity_entries',used_capacity_entries,
    'used_capacity_missing',used_capacity_missing,
    'inconsistent_rows',inconsistent_rows,
    'used_capacity_complete',complete,
    'available_fte',case when complete then round(available_fte_known,4) else null end,
    'used_capacity_volume',case when complete then round(used_capacity_volume,0) else null end,
    'used_per_available_fte',case when complete then round((used_capacity_volume/available_fte_known)::numeric,6) else null end
  ) order by competence,squad_code),'[]'::jsonb)
  into v_result
  from normalized;

  return coalesce(v_result,'[]'::jsonb);
end;
$$;

revoke all on function public.get_strategy_capacity_utilization_history() from public;
grant execute on function public.get_strategy_capacity_utilization_history() to authenticated;

comment on function public.get_strategy_capacity_utilization_history() is
'V2.59.3: historico agregado de competencias fechadas para referencia de utilizacao; preserva fail-closed quando disponibilidade ou resolucoes estao incompletas.';

notify pgrst,'reload schema';
commit;
