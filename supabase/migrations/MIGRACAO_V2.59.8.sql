-- Soften Performance Hub V2.59.8
-- Fase 4 - Snapshots, historico e evolucao de capacidade.
--
-- Congela a fotografia de capacidade no fechamento da competencia e passa a
-- usar essa fotografia imutavel como fonte do historico da Fase 4.
-- Competencias antigas recebem backfill explicitamente identificado como
-- legacy_backfill; a base viva nunca e apresentada como snapshot oficial.

begin;

create table if not exists public.strategy_capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  revision integer not null check (revision > 0),
  snapshot_version text not null,
  rule_version text not null,
  source text not null check (source in ('close','legacy_backfill')),
  financial_snapshot_revision integer not null check (financial_snapshot_revision > 0),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (organization_id, competence_id, revision),
  constraint strategy_capacity_snapshots_financial_revision_match
    check (financial_snapshot_revision=revision),
  constraint strategy_capacity_snapshots_payload_object
    check (jsonb_typeof(snapshot)='object')
);

create index if not exists idx_strategy_capacity_snapshots_competence_revision
  on public.strategy_capacity_snapshots(competence_id, revision desc);

alter table public.strategy_capacity_snapshots enable row level security;
revoke all on table public.strategy_capacity_snapshots from public;
revoke all on table public.strategy_capacity_snapshots from authenticated;
grant select on table public.strategy_capacity_snapshots to authenticated;

comment on table public.strategy_capacity_snapshots is
'V2.59.8: fotografia revisionada e imutavel da capacidade por operacao e Squad no fechamento da competencia.';

create or replace function public.capture_strategy_capacity_snapshot(
  p_competence_id uuid,
  p_source text default 'close'
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_comp record;
  v_fin record;
  v_rows jsonb := '[]'::jsonb;
  v_operation jsonb := '{}'::jsonb;
  v_squads jsonb := '[]'::jsonb;
  v_payload jsonb;
  v_id uuid;
begin
  if p_source not in ('close','legacy_backfill') then
    raise exception 'invalid capacity snapshot source' using errcode='22023';
  end if;

  select sc.* into v_comp
  from public.strategy_competences sc
  where sc.id=p_competence_id;

  if v_comp.id is null then return null; end if;
  if v_comp.status <> 'closed' then return null; end if;
  if coalesce(v_comp.snapshot_revision,0) <= 0 then return null; end if;

  select ss.* into v_fin
  from public.strategy_competence_snapshots ss
  where ss.organization_id=v_comp.organization_id
    and ss.competence_id=v_comp.id
    and ss.revision=v_comp.snapshot_revision
  order by ss.revision desc
  limit 1;

  if v_fin.id is null then return null; end if;

  with base as (
    select
      upper(trim(coalesce(sec.squad_code_snapshot,''))) squad_code,
      sec.fte::numeric nominal_fte,
      sec.availability_factor::numeric availability_factor,
      srm.id resolution_metric_id,
      coalesce(srm.resolutions,0)::numeric resolutions,
      tm.id attendance_metric_id,
      coalesce(tm.att,0)::numeric attendance
    from public.strategy_employee_costs sec
    join public.strategy_people sp
      on sp.id=sec.person_id
     and sp.organization_id=sec.organization_id
    left join public.strategy_resolution_metrics srm
      on srm.organization_id=sec.organization_id
     and srm.competence_id=sec.competence_id
     and srm.user_id=sp.user_id
     and upper(trim(srm.squad_code_snapshot))=upper(trim(coalesce(sec.squad_code_snapshot,'')))
    left join public.squads s
      on s.organization_id=sec.organization_id
     and upper(s.code)=upper(trim(coalesce(sec.squad_code_snapshot,'')))
    left join public.squad_months sm
      on sm.squad_id=s.id
     and sm.year=extract(year from v_comp.competence)::int
     and sm.month=extract(month from v_comp.competence)::int
    left join public.technician_monthly tm
      on tm.squad_month_id=sm.id
     and tm.user_id=sp.user_id
    where sec.organization_id=v_comp.organization_id
      and sec.competence_id=v_comp.id
  ), squad_agg as (
    select
      squad_code,
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      coalesce(sum(nominal_fte) filter (where nominal_fte>0),0)::numeric nominal_fte,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null)::bigint attendance_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is null)::bigint attendance_missing,
      coalesce(sum(attendance) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null),0)::numeric attendance_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base
    where nullif(squad_code,'') is not null
    group by squad_code
  ), operation_agg as (
    select
      'ALL'::text squad_code,
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      coalesce(sum(nominal_fte) filter (where nominal_fte>0),0)::numeric nominal_fte,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null)::bigint attendance_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is null)::bigint attendance_missing,
      coalesce(sum(attendance) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null),0)::numeric attendance_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base
  ), rows as (
    select * from operation_agg
    union all
    select * from squad_agg
  ), normalized as (
    select *,
      (candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0) resolution_complete,
      (candidate_count>0 and availability_missing=0 and attendance_missing=0 and available_fte_known>0) attendance_complete,
      (candidate_count>0 and availability_missing=0) availability_complete
    from rows
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'squad_code',squad_code,
    'candidate_count',candidate_count,
    'nominal_fte',round(nominal_fte,4),
    'availability_missing',availability_missing,
    'availability_complete',availability_complete,
    'available_fte',case when availability_complete then round(available_fte_known,4) else null end,
    'availability_rate',case when availability_complete and nominal_fte>0 then round((available_fte_known/nominal_fte)::numeric,8) else null end,
    'used_capacity_entries',used_capacity_entries,
    'used_capacity_missing',used_capacity_missing,
    'inconsistent_rows',inconsistent_rows,
    'used_capacity_complete',resolution_complete,
    'used_capacity_volume',case when resolution_complete then round(used_capacity_volume,0) else null end,
    'used_per_available_fte',case when resolution_complete then round((used_capacity_volume/available_fte_known)::numeric,8) else null end,
    'attendance_entries',attendance_entries,
    'attendance_missing',attendance_missing,
    'attendance_complete',attendance_complete,
    'attendance_volume',case when attendance_complete then round(attendance_volume,0) else null end,
    'attendance_per_available_fte',case when attendance_complete then round((attendance_volume/available_fte_known)::numeric,8) else null end,
    'resolution_rate',case when resolution_complete and attendance_complete and attendance_volume>0 and used_capacity_volume<=attendance_volume then round((used_capacity_volume/attendance_volume)::numeric,8) else null end
  ) order by squad_code),'[]'::jsonb)
  into v_rows
  from normalized;

  select value into v_operation
  from jsonb_array_elements(v_rows)
  where upper(coalesce(value->>'squad_code',''))='ALL'
  limit 1;

  select coalesce(jsonb_agg(value order by value->>'squad_code'),'[]'::jsonb)
  into v_squads
  from jsonb_array_elements(v_rows)
  where upper(coalesce(value->>'squad_code',''))<>'ALL';

  v_payload := jsonb_build_object(
    'snapshot_version','CS-1.0.0',
    'rule_version','CA-0.9.0-snapshots-history',
    'source',p_source,
    'competence',to_char(v_comp.competence,'YYYY-MM'),
    'status','closed',
    'revision',v_comp.snapshot_revision,
    'financial_snapshot_revision',v_fin.revision,
    'captured_at',now(),
    'operation',coalesce(v_operation,'{}'::jsonb),
    'squads',coalesce(v_squads,'[]'::jsonb)
  );

  insert into public.strategy_capacity_snapshots(
    organization_id,competence_id,revision,snapshot_version,rule_version,source,
    financial_snapshot_revision,snapshot,created_at
  ) values (
    v_comp.organization_id,v_comp.id,v_comp.snapshot_revision,'CS-1.0.0',
    'CA-0.9.0-snapshots-history',p_source,v_fin.revision,v_payload,now()
  )
  on conflict (organization_id,competence_id,revision) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.strategy_capacity_snapshots
    where organization_id=v_comp.organization_id
      and competence_id=v_comp.id
      and revision=v_comp.snapshot_revision;
  end if;

  return v_id;
end;
$$;

revoke all on function public.capture_strategy_capacity_snapshot(uuid,text) from public;
revoke all on function public.capture_strategy_capacity_snapshot(uuid,text) from authenticated;

create or replace function public.strategy_capacity_snapshot_after_close()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='closed' and old.status is distinct from new.status then
    perform public.capture_strategy_capacity_snapshot(new.id,'close');
  end if;
  return new;
end;
$$;

revoke all on function public.strategy_capacity_snapshot_after_close() from public;
revoke all on function public.strategy_capacity_snapshot_after_close() from authenticated;

drop trigger if exists strategy_capacity_snapshot_on_close on public.strategy_competences;
create trigger strategy_capacity_snapshot_on_close
after update of status on public.strategy_competences
for each row
when (new.status='closed' and old.status is distinct from new.status)
execute function public.strategy_capacity_snapshot_after_close();

-- Reconstrucao controlada para competencias fechadas antes da V2.59.8.
do $$
declare r record;
begin
  for r in
    select sc.id
    from public.strategy_competences sc
    where sc.status='closed'
      and coalesce(sc.snapshot_revision,0)>0
      and not exists (
        select 1
        from public.strategy_capacity_snapshots scs
        where scs.organization_id=sc.organization_id
          and scs.competence_id=sc.id
          and scs.revision=sc.snapshot_revision
      )
  loop
    perform public.capture_strategy_capacity_snapshot(r.id,'legacy_backfill');
  end loop;
end;
$$;

create or replace function public.get_strategy_capacity_snapshot_history()
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

  with latest as (
    select distinct on (scs.competence_id)
      scs.competence_id,scs.revision,scs.snapshot_version,scs.rule_version,scs.source,
      scs.financial_snapshot_revision,scs.snapshot,scs.created_at,sc.competence
    from public.strategy_capacity_snapshots scs
    join public.strategy_competences sc on sc.id=scs.competence_id
    where scs.organization_id=v_org
    order by scs.competence_id,scs.revision desc
  ), expanded as (
    select
      competence,revision,snapshot_version,rule_version,source,financial_snapshot_revision,created_at,
      coalesce(snapshot->'operation','{}'::jsonb) metric
    from latest
    union all
    select
      l.competence,l.revision,l.snapshot_version,l.rule_version,l.source,l.financial_snapshot_revision,l.created_at,
      s.value metric
    from latest l
    cross join lateral jsonb_array_elements(coalesce(l.snapshot->'squads','[]'::jsonb)) s(value)
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'competence',to_char(competence,'YYYY-MM'),
      'status','closed',
      'revision',revision,
      'snapshot_version',snapshot_version,
      'rule_version',rule_version,
      'source',source,
      'financial_snapshot_revision',financial_snapshot_revision,
      'created_at',created_at
    ) || metric
    order by competence,coalesce(metric->>'squad_code','ALL')
  ),'[]'::jsonb)
  into v_result
  from expanded;

  return coalesce(v_result,'[]'::jsonb);
end;
$$;

revoke all on function public.get_strategy_capacity_snapshot_history() from public;
grant execute on function public.get_strategy_capacity_snapshot_history() to authenticated;

-- Compatibilidade: consumidores antigos do historico passam a receber a mesma
-- fonte congelada da V2.59.8, sem depender da base operacional viva.
create or replace function public.get_strategy_capacity_utilization_history()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select public.get_strategy_capacity_snapshot_history();
$$;

revoke all on function public.get_strategy_capacity_utilization_history() from public;
grant execute on function public.get_strategy_capacity_utilization_history() to authenticated;

comment on function public.get_strategy_capacity_snapshot_history() is
'V2.59.8: historico agregado de capacidade lido exclusivamente de snapshots revisionados por competencia.';
comment on function public.get_strategy_capacity_utilization_history() is
'V2.59.8: alias compativel para o historico de capacidade congelado em snapshots.';

notify pgrst,'reload schema';
commit;
