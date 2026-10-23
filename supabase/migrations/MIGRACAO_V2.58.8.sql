-- Soften Performance Hub V2.58.8
-- Snapshots, historico e evolucao da eficiencia economica.
-- Congela indicadores agregados por revisao de competencia fechada, sem recalcular
-- o passado quando o motor de eficiencia evoluir em versoes futuras.

begin;

create table if not exists public.strategy_efficiency_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  revision integer not null check (revision > 0),
  snapshot_version text not null default 'ES-1.0.0',
  rule_version text not null default 'EF-0.8.0-snapshots-history',
  source text not null default 'close' check (source in ('close','legacy_backfill')),
  financial_snapshot_revision integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (organization_id, competence_id, revision)
);

create index if not exists idx_strategy_efficiency_snapshots_competence_revision
  on public.strategy_efficiency_snapshots(competence_id, revision desc);
create index if not exists idx_strategy_efficiency_snapshots_org_created
  on public.strategy_efficiency_snapshots(organization_id, created_at desc);

alter table public.strategy_efficiency_snapshots enable row level security;
revoke all on table public.strategy_efficiency_snapshots from public;
revoke all on table public.strategy_efficiency_snapshots from authenticated;
grant select on table public.strategy_efficiency_snapshots to authenticated;

-- RLS permanece fail-closed: nao ha policy de SELECT direto. A leitura suportada
-- ocorre somente pela RPC agregada abaixo.

-- Funcao interna: usa o snapshot financeiro da mesma revisao como fonte imutavel
-- e acrescenta a base explicita de resolucoes, que ja fica bloqueada por RLS ao fechar.
create or replace function public.capture_strategy_efficiency_snapshot(
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
  v_summary jsonb;
  v_fin_squads jsonb;
  v_operation jsonb;
  v_squads jsonb := '[]'::jsonb;
  v_squad jsonb;
  v_code text;
  v_resolutions numeric := 0;
  v_entries bigint := 0;
  v_total_cost numeric := 0;
  v_people_cost numeric := 0;
  v_operational_cost numeric := 0;
  v_attendance numeric := 0;
  v_fte numeric := 0;
  v_people_count numeric := 0;
  v_evaluation numeric;
  v_cost_att numeric;
  v_cost_res numeric;
  v_resolution_rate numeric;
  v_productivity numeric;
  v_mean numeric;
  v_median numeric;
  v_best_code text;
  v_best_value numeric;
  v_benchmarks jsonb;
  v_payload jsonb;
  v_id uuid;
begin
  if p_source not in ('close','legacy_backfill') then
    raise exception 'invalid efficiency snapshot source' using errcode='22023';
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

  v_summary := coalesce(v_fin.snapshot->'summary','{}'::jsonb);
  v_fin_squads := coalesce(v_fin.snapshot->'squads','[]'::jsonb);

  select coalesce(sum(srm.resolutions),0),count(srm.id)
    into v_resolutions,v_entries
  from public.strategy_resolution_metrics srm
  where srm.organization_id=v_comp.organization_id
    and srm.competence_id=v_comp.id;

  v_total_cost := greatest(0,coalesce((v_summary->>'total_cost')::numeric,0));
  v_people_cost := greatest(0,coalesce((v_summary->>'people_cost')::numeric,0));
  v_operational_cost := greatest(0,coalesce((v_summary->>'operational_cost')::numeric,0));
  v_attendance := greatest(0,coalesce((v_summary->>'attendance')::numeric,0));
  v_fte := greatest(0,coalesce((v_summary->>'fte')::numeric,0));
  v_people_count := greatest(0,coalesce((v_summary->>'people_count')::numeric,0));
  begin v_evaluation := (v_summary->>'evaluation_rate')::numeric; exception when others then v_evaluation := null; end;
  v_cost_att := case when v_attendance>0 then v_total_cost/v_attendance else null end;
  v_cost_res := case when v_resolutions>0 then v_total_cost/v_resolutions else null end;
  v_resolution_rate := case when v_attendance>0 then least(1,v_resolutions/v_attendance) else null end;
  v_productivity := case when v_total_cost>0 then v_resolutions*1000/v_total_cost else null end;

  v_operation := jsonb_build_object(
    'total_cost',v_total_cost,
    'people_cost',v_people_cost,
    'operational_cost',v_operational_cost,
    'people_count',v_people_count,
    'fte',v_fte,
    'attendance',v_attendance,
    'resolutions',v_resolutions,
    'resolution_entries',v_entries,
    'cost_per_attendance',v_cost_att,
    'cost_per_resolution',v_cost_res,
    'resolution_rate',v_resolution_rate,
    'economic_productivity',v_productivity,
    'evaluation_rate',v_evaluation
  );

  for v_squad in select value from jsonb_array_elements(v_fin_squads)
  loop
    v_code := upper(trim(coalesce(v_squad->>'squad_code','')));
    if v_code='' then continue; end if;
    select coalesce(sum(srm.resolutions),0),count(srm.id)
      into v_resolutions,v_entries
    from public.strategy_resolution_metrics srm
    where srm.organization_id=v_comp.organization_id
      and srm.competence_id=v_comp.id
      and upper(srm.squad_code_snapshot)=v_code;

    v_total_cost := greatest(0,coalesce((v_squad->>'total_cost')::numeric,0));
    v_attendance := greatest(0,coalesce((v_squad->>'attendance')::numeric,0));
    v_cost_att := case when v_attendance>0 then v_total_cost/v_attendance else null end;
    v_cost_res := case when v_resolutions>0 then v_total_cost/v_resolutions else null end;
    v_resolution_rate := case when v_attendance>0 then least(1,v_resolutions/v_attendance) else null end;
    v_productivity := case when v_total_cost>0 then v_resolutions*1000/v_total_cost else null end;

    v_squads := v_squads || jsonb_build_array(
      v_squad || jsonb_build_object(
        'resolutions',v_resolutions,
        'resolution_entries',v_entries,
        'cost_per_attendance',v_cost_att,
        'cost_per_resolution',v_cost_res,
        'resolution_rate',v_resolution_rate,
        'economic_productivity',v_productivity
      )
    );
  end loop;

  with eligible as (
    select
      upper(e->>'squad_code') squad_code,
      (e->>'economic_productivity')::numeric productivity
    from jsonb_array_elements(v_squads) e
    where coalesce((e->>'resolution_entries')::numeric,0)>0
      and coalesce((e->>'total_cost')::numeric,0)>0
      and nullif(e->>'economic_productivity','') is not null
  )
  select avg(productivity),
         percentile_cont(0.5) within group(order by productivity)
    into v_mean,v_median
  from eligible;

  select squad_code,productivity into v_best_code,v_best_value
  from (
    select
      upper(e->>'squad_code') squad_code,
      (e->>'economic_productivity')::numeric productivity
    from jsonb_array_elements(v_squads) e
    where coalesce((e->>'resolution_entries')::numeric,0)>0
      and coalesce((e->>'total_cost')::numeric,0)>0
      and nullif(e->>'economic_productivity','') is not null
  ) q
  order by productivity desc,squad_code
  limit 1;

  v_benchmarks := jsonb_build_object(
    'operation_benchmark',case when coalesce((v_operation->>'total_cost')::numeric,0)>0 then (v_operation->>'economic_productivity')::numeric else null end,
    'mean_benchmark',v_mean,
    'median_benchmark',v_median,
    'best_squad_code',v_best_code,
    'best_value',v_best_value
  );

  v_payload := jsonb_build_object(
    'snapshot_version','ES-1.0.0',
    'rule_version','EF-0.8.0-snapshots-history',
    'source',p_source,
    'competence',to_char(v_comp.competence,'YYYY-MM'),
    'status','closed',
    'revision',v_comp.snapshot_revision,
    'financial_snapshot_revision',v_fin.revision,
    'captured_at',now(),
    'operation',v_operation,
    'squads',v_squads,
    'benchmarks',v_benchmarks
  );

  insert into public.strategy_efficiency_snapshots(
    organization_id,competence_id,revision,snapshot_version,rule_version,source,
    financial_snapshot_revision,snapshot,created_at
  ) values (
    v_comp.organization_id,v_comp.id,v_comp.snapshot_revision,'ES-1.0.0',
    'EF-0.8.0-snapshots-history',p_source,v_fin.revision,v_payload,now()
  )
  on conflict (organization_id,competence_id,revision) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.strategy_efficiency_snapshots
    where organization_id=v_comp.organization_id
      and competence_id=v_comp.id
      and revision=v_comp.snapshot_revision;
  end if;
  return v_id;
end;
$$;
revoke all on function public.capture_strategy_efficiency_snapshot(uuid,text) from public;
revoke all on function public.capture_strategy_efficiency_snapshot(uuid,text) from authenticated;

create or replace function public.strategy_efficiency_snapshot_after_close()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='closed' and old.status is distinct from new.status then
    perform public.capture_strategy_efficiency_snapshot(new.id,'close');
  end if;
  return new;
end;
$$;
revoke all on function public.strategy_efficiency_snapshot_after_close() from public;
revoke all on function public.strategy_efficiency_snapshot_after_close() from authenticated;

drop trigger if exists strategy_efficiency_snapshot_on_close on public.strategy_competences;
create trigger strategy_efficiency_snapshot_on_close
after update of status on public.strategy_competences
for each row
when (new.status='closed' and old.status is distinct from new.status)
execute function public.strategy_efficiency_snapshot_after_close();

-- Backfill controlado para competencias ja fechadas. Como a fonte financeira ja
-- estava congelada, o registro e marcado explicitamente como legacy_backfill.
do $$
declare r record;
begin
  for r in
    select sc.id
    from public.strategy_competences sc
    where sc.status='closed'
      and coalesce(sc.snapshot_revision,0)>0
      and not exists (
        select 1 from public.strategy_efficiency_snapshots ses
        where ses.organization_id=sc.organization_id
          and ses.competence_id=sc.id
          and ses.revision=sc.snapshot_revision
      )
  loop
    perform public.capture_strategy_efficiency_snapshot(r.id,'legacy_backfill');
  end loop;
end;
$$;

-- Historico agregado. A tabela bruta fica inacessivel ao cliente; somente a RPC
-- devolve operacao/Squads e nunca expoe custos individuais.
create or replace function public.get_strategy_efficiency_history()
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
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  with latest as (
    select distinct on (ses.competence_id)
      ses.competence_id,ses.revision,ses.snapshot_version,ses.rule_version,ses.source,
      ses.financial_snapshot_revision,ses.snapshot,ses.created_at,sc.competence
    from public.strategy_efficiency_snapshots ses
    join public.strategy_competences sc on sc.id=ses.competence_id
    where ses.organization_id=v_org
    order by ses.competence_id,ses.revision desc
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'competence',to_char(competence,'YYYY-MM'),
    'status','closed',
    'revision',revision,
    'snapshot_version',snapshot_version,
    'rule_version',rule_version,
    'source',source,
    'financial_snapshot_revision',financial_snapshot_revision,
    'created_at',created_at,
    'operation',coalesce(snapshot->'operation','{}'::jsonb),
    'squads',coalesce(snapshot->'squads','[]'::jsonb),
    'benchmarks',coalesce(snapshot->'benchmarks','{}'::jsonb)
  ) order by competence),'[]'::jsonb)
  into v_result
  from latest;

  return coalesce(v_result,'[]'::jsonb);
end;
$$;
revoke all on function public.get_strategy_efficiency_history() from public;
grant execute on function public.get_strategy_efficiency_history() to authenticated;

notify pgrst,'reload schema';
commit;
