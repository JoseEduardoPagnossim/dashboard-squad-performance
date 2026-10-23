-- Soften Performance Hub V2.59.1
-- Fase 4 - Capacidade disponivel por tecnico e Squad.
--
-- Regra central:
--   FTE disponivel = FTE nominal x fator de disponibilidade
--
-- O fator representa a parcela da competencia em que a pessoa esteve
-- efetivamente disponivel para a operacao. Ele nao altera salario, custos
-- pessoais ou o FTE contratual.

begin;

alter table public.strategy_employee_costs
  add column if not exists availability_factor numeric(5,4);

-- Competencias ainda abertas passam a assumir disponibilidade integral como
-- ponto de partida. Competencias ja fechadas permanecem nulas para nao criar
-- retrospectivamente uma fotografia de disponibilidade que nunca foi informada.
update public.strategy_employee_costs sec
set availability_factor = 1
from public.strategy_competences sc
where sc.id = sec.competence_id
  and sc.organization_id = sec.organization_id
  and sc.status <> 'closed'
  and sec.availability_factor is null;

alter table public.strategy_employee_costs
  alter column availability_factor set default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'strategy_employee_costs_availability_factor_check'
  ) then
    alter table public.strategy_employee_costs
      add constraint strategy_employee_costs_availability_factor_check
      check (availability_factor is null or (availability_factor >= 0 and availability_factor <= 1));
  end if;
end;
$$;

comment on column public.strategy_employee_costs.availability_factor is
'V2.59.1: parcela da competencia efetivamente disponivel para a operacao. 1 = 100%, 0.5 = 50%. Nulo preserva competencias historicas sem base explicita.';

create or replace function public.get_strategy_capacity_summary(
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
  v_nominal numeric := 0;
  v_known_nominal numeric := 0;
  v_available numeric := 0;
  v_people bigint := 0;
  v_entries bigint := 0;
  v_missing bigint := 0;
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

  select
    count(distinct sec.person_id),
    coalesce(sum(sec.fte),0),
    coalesce(sum(sec.fte) filter (where sec.availability_factor is not null),0),
    coalesce(sum(sec.fte * sec.availability_factor) filter (where sec.availability_factor is not null),0),
    count(sec.id) filter (where sec.availability_factor is not null),
    count(sec.id) filter (where sec.availability_factor is null and sec.fte > 0)
  into v_people,v_nominal,v_known_nominal,v_available,v_entries,v_missing
  from public.strategy_employee_costs sec
  join public.strategy_competences sc
    on sc.id = sec.competence_id
   and sc.organization_id = sec.organization_id
  where sec.organization_id = v_org
    and sc.competence = date_trunc('month',p_competence)::date
    and (v_all or upper(coalesce(sec.squad_code_snapshot,'')) = v_code);

  return jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'people_count',coalesce(v_people,0),
    'nominal_fte',round(coalesce(v_nominal,0)::numeric,4),
    'availability_entries',coalesce(v_entries,0),
    'availability_missing',coalesce(v_missing,0),
    'availability_complete',coalesce(v_missing,0)=0 and coalesce(v_people,0)>0,
    'availability_coverage',case when coalesce(v_nominal,0)>0 then round((coalesce(v_known_nominal,0)/v_nominal)::numeric,6) else null end,
    'available_fte',case when coalesce(v_missing,0)=0 and coalesce(v_people,0)>0 then round(coalesce(v_available,0)::numeric,4) else null end,
    'unavailable_fte',case when coalesce(v_missing,0)=0 and coalesce(v_people,0)>0 then round((coalesce(v_nominal,0)-coalesce(v_available,0))::numeric,4) else null end,
    'availability_rate',case when coalesce(v_missing,0)=0 and coalesce(v_nominal,0)>0 then round((coalesce(v_available,0)/v_nominal)::numeric,6) else null end
  );
end;
$$;

revoke all on function public.get_strategy_capacity_summary(date,text) from public;
grant execute on function public.get_strategy_capacity_summary(date,text) to authenticated;

create or replace function public.get_strategy_capacity_squad_summary(
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

  with rows as (
    select
      upper(trim(sec.squad_code_snapshot)) squad_code,
      count(distinct sec.person_id)::bigint people_count,
      coalesce(sum(sec.fte),0)::numeric nominal_fte,
      coalesce(sum(sec.fte) filter (where sec.availability_factor is not null),0)::numeric known_nominal_fte,
      coalesce(sum(sec.fte * sec.availability_factor) filter (where sec.availability_factor is not null),0)::numeric known_available_fte,
      (count(sec.id) filter (where sec.availability_factor is not null))::bigint availability_entries,
      (count(sec.id) filter (where sec.availability_factor is null and sec.fte > 0))::bigint availability_missing
    from public.strategy_employee_costs sec
    join public.strategy_competences sc
      on sc.id = sec.competence_id
     and sc.organization_id = sec.organization_id
    where sec.organization_id = v_org
      and sc.competence = date_trunc('month',p_competence)::date
      and nullif(trim(sec.squad_code_snapshot),'') is not null
    group by upper(trim(sec.squad_code_snapshot))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'squad_code',squad_code,
    'people_count',people_count,
    'nominal_fte',round(nominal_fte,4),
    'availability_entries',availability_entries,
    'availability_missing',availability_missing,
    'availability_complete',availability_missing=0 and people_count>0,
    'availability_coverage',case when nominal_fte>0 then round((known_nominal_fte/nominal_fte)::numeric,6) else null end,
    'available_fte',case when availability_missing=0 and people_count>0 then round(known_available_fte,4) else null end,
    'unavailable_fte',case when availability_missing=0 and people_count>0 then round((nominal_fte-known_available_fte),4) else null end,
    'availability_rate',case when availability_missing=0 and nominal_fte>0 then round((known_available_fte/nominal_fte)::numeric,6) else null end
  ) order by squad_code),'[]'::jsonb)
  into v_result
  from rows;

  return coalesce(v_result,'[]'::jsonb);
end;
$$;

revoke all on function public.get_strategy_capacity_squad_summary(date) from public;
grant execute on function public.get_strategy_capacity_squad_summary(date) to authenticated;

notify pgrst,'reload schema';
commit;
