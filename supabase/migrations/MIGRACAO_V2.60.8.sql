-- Soften Performance Hub V2.60.8
-- Fase 5 - Snapshots, histórico e evolução do Resultado.
--
-- Objetivos:
--   - congelar o resultado econômico no fechamento da competência;
--   - vincular o snapshot à mesma revisão financeira oficial;
--   - preservar Receita Direta, Influenciada e Protegida separadamente;
--   - acompanhar evolução por operação ou Squad sem recalcular o passado;
--   - impedir mutações de Resultado enquanto a competência estiver fechada.

begin;

create table if not exists public.strategy_result_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  revision integer not null check (revision > 0),
  snapshot_version text not null default 'RS-1.0.0',
  rule_version text not null default 'RE-0.9.0-result-history',
  source text not null default 'close' check (source in ('close','legacy_backfill')),
  financial_snapshot_revision integer not null check (financial_snapshot_revision > 0),
  snapshot_fingerprint text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (organization_id,competence_id,revision)
);

create index if not exists idx_strategy_result_snapshots_history
  on public.strategy_result_snapshots(organization_id,competence_id,revision desc);

alter table public.strategy_result_snapshots enable row level security;
revoke all on table public.strategy_result_snapshots from public;
revoke all on table public.strategy_result_snapshots from authenticated;
grant select on table public.strategy_result_snapshots to authenticated;

drop policy if exists strategy_result_snapshots_select on public.strategy_result_snapshots;
create policy strategy_result_snapshots_select on public.strategy_result_snapshots
for select to authenticated
using (
  organization_id=(public.current_profile()).organization_id
  and public.has_strategy_access('aggregates')
);

-- Hardening: Resultado não pode mudar enquanto a competência estiver fechada.
create or replace function public.validate_strategy_result_competence_open()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_competence_id uuid;
  v_status text;
begin
  v_competence_id:=case when tg_op='DELETE' then old.competence_id else new.competence_id end;
  select status into v_status from public.strategy_competences where id=v_competence_id;
  if v_status='closed' then
    raise exception 'strategy result competence is closed; reopen before changing result events' using errcode='55000';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.validate_strategy_result_competence_open() from public;
revoke all on function public.validate_strategy_result_competence_open() from authenticated;

drop trigger if exists strategy_result_events_open_guard on public.strategy_result_events;
create trigger strategy_result_events_open_guard
before insert or update or delete on public.strategy_result_events
for each row execute function public.validate_strategy_result_competence_open();

create or replace function public.validate_strategy_result_attribution_competence_open()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_event_id uuid;
  v_status text;
begin
  v_event_id:=case when tg_op='DELETE' then old.event_id else new.event_id end;
  select sc.status into v_status
  from public.strategy_result_events e
  join public.strategy_competences sc on sc.id=e.competence_id
  where e.id=v_event_id;
  if v_status='closed' then
    raise exception 'strategy result competence is closed; reopen before changing result attributions' using errcode='55000';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.validate_strategy_result_attribution_competence_open() from public;
revoke all on function public.validate_strategy_result_attribution_competence_open() from authenticated;

drop trigger if exists strategy_result_attributions_open_guard on public.strategy_result_attributions;
create trigger strategy_result_attributions_open_guard
before insert or update or delete on public.strategy_result_attributions
for each row execute function public.validate_strategy_result_attribution_competence_open();

create or replace function public.capture_strategy_result_snapshot(
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
  v_operation jsonb := '{}'::jsonb;
  v_squads jsonb := '[]'::jsonb;
  v_integrity jsonb := '{}'::jsonb;
  v_payload jsonb;
  v_fingerprint text;
  v_id uuid;
begin
  if p_source not in ('close','legacy_backfill') then
    raise exception 'invalid result snapshot source' using errcode='22023';
  end if;

  select sc.* into v_comp
  from public.strategy_competences sc
  where sc.id=p_competence_id;

  if v_comp.id is null then return null; end if;
  if v_comp.status<>'closed' then return null; end if;
  if coalesce(v_comp.snapshot_revision,0)<=0 then return null; end if;

  select ss.* into v_fin
  from public.strategy_competence_snapshots ss
  where ss.organization_id=v_comp.organization_id
    and ss.competence_id=v_comp.id
    and ss.revision=v_comp.snapshot_revision
  order by ss.revision desc
  limit 1;

  if v_fin.id is null then return null; end if;

  with eligible_events as (
    select e.*
    from public.strategy_result_events e
    where e.organization_id=v_comp.organization_id
      and e.competence_id=v_comp.id
      and e.currency='BRL'
      and (
        (e.result_type='direct' and e.status='confirmed')
        or (e.result_type='influenced' and e.status='confirmed')
        or (e.result_type='protected' and e.status='confirmed' and e.protection_verified_at is not null and e.protection_lost_at is null)
      )
  ), attr_base as (
    select
      a.*,
      e.result_type,
      e.gross_amount,
      e.monthly_recurring_amount,
      e.annual_recurring_amount,
      sum(coalesce(a.attribution_share,0)) over(partition by a.event_id) explicit_share_sum,
      count(*) filter (where a.attribution_share is null) over(partition by a.event_id) null_share_count
    from public.strategy_result_attributions a
    join eligible_events e on e.id=a.event_id
    where a.organization_id=v_comp.organization_id
  ), credited as (
    select
      a.*,
      case
        when a.attribution_share is not null then greatest(0,least(1,a.attribution_share))
        when a.null_share_count>0 then greatest(0,1-least(1,a.explicit_share_sum))/a.null_share_count
        else 0
      end effective_share,
      coalesce(nullif(upper(trim(coalesce(a.squad_code_snapshot,''))),''),'SEM SQUAD') effective_squad
    from attr_base a
  ), result_squads as (
    select
      effective_squad squad_code,
      count(distinct event_id) filter (where effective_share>0)::bigint credited_event_count,
      coalesce(sum(gross_amount*effective_share) filter (where result_type='direct'),0)::numeric(14,2) direct_revenue,
      coalesce(sum(monthly_recurring_amount*effective_share) filter (where result_type='direct'),0)::numeric(14,2) direct_mrr,
      coalesce(sum(annual_recurring_amount*effective_share) filter (where result_type='direct'),0)::numeric(14,2) direct_arr,
      coalesce(sum(gross_amount*effective_share) filter (where result_type='influenced'),0)::numeric(14,2) influenced_revenue,
      coalesce(sum(monthly_recurring_amount*effective_share) filter (where result_type='influenced'),0)::numeric(14,2) influenced_mrr,
      coalesce(sum(annual_recurring_amount*effective_share) filter (where result_type='influenced'),0)::numeric(14,2) influenced_arr,
      coalesce(sum(gross_amount*effective_share) filter (where result_type='protected'),0)::numeric(14,2) protected_revenue,
      coalesce(sum(monthly_recurring_amount*effective_share) filter (where result_type='protected'),0)::numeric(14,2) protected_mrr,
      coalesce(sum(annual_recurring_amount*effective_share) filter (where result_type='protected'),0)::numeric(14,2) protected_arr
    from credited
    group by effective_squad
  ), financial_squads as (
    select
      upper(trim(coalesce(value->>'squad_code',''))) squad_code,
      greatest(0,coalesce((value->>'total_cost')::numeric,0)) total_cost,
      greatest(0,coalesce((value->>'fte')::numeric,0)) fte
    from jsonb_array_elements(coalesce(v_fin.snapshot->'squads','[]'::jsonb)) value
  ), squad_codes as (
    select squad_code from result_squads
    union
    select squad_code from financial_squads where nullif(squad_code,'') is not null
  ), combined as (
    select
      c.squad_code,
      coalesce(r.credited_event_count,0) credited_event_count,
      coalesce(f.total_cost,0)::numeric(14,2) total_cost,
      coalesce(f.fte,0)::numeric fte,
      coalesce(r.direct_revenue,0)::numeric(14,2) direct_revenue,
      coalesce(r.direct_mrr,0)::numeric(14,2) direct_mrr,
      coalesce(r.direct_arr,0)::numeric(14,2) direct_arr,
      coalesce(r.influenced_revenue,0)::numeric(14,2) influenced_revenue,
      coalesce(r.influenced_mrr,0)::numeric(14,2) influenced_mrr,
      coalesce(r.influenced_arr,0)::numeric(14,2) influenced_arr,
      coalesce(r.protected_revenue,0)::numeric(14,2) protected_revenue,
      coalesce(r.protected_mrr,0)::numeric(14,2) protected_mrr,
      coalesce(r.protected_arr,0)::numeric(14,2) protected_arr
    from squad_codes c
    left join result_squads r using(squad_code)
    left join financial_squads f using(squad_code)
  ), squad_json as (
    select jsonb_build_object(
      'squad_code',squad_code,
      'credited_event_count',credited_event_count,
      'total_cost',total_cost,
      'fte',round(fte,4),
      'direct_revenue',direct_revenue,
      'direct_mrr',direct_mrr,
      'direct_arr',direct_arr,
      'influenced_revenue',influenced_revenue,
      'influenced_mrr',influenced_mrr,
      'influenced_arr',influenced_arr,
      'protected_revenue',protected_revenue,
      'protected_mrr',protected_mrr,
      'protected_arr',protected_arr,
      'direct_net_return',case when total_cost>0 then round((direct_revenue-total_cost)::numeric,2) else null end,
      'direct_roi_pct',case when total_cost>0 then round((((direct_revenue-total_cost)/total_cost)*100)::numeric,4) else null end,
      'direct_cost_coverage',case when total_cost>0 then round((direct_revenue/total_cost)::numeric,8) else null end,
      'influenced_impact_per_cost',case when total_cost>0 then round((influenced_revenue/total_cost)::numeric,8) else null end,
      'protected_impact_per_cost',case when total_cost>0 then round((protected_revenue/total_cost)::numeric,8) else null end
    ) payload
    from combined
  )
  select coalesce(jsonb_agg(payload order by payload->>'squad_code'),'[]'::jsonb)
  into v_squads
  from squad_json;

  with totals as (
    select
      coalesce(sum((value->>'credited_event_count')::numeric),0) credited_event_count,
      coalesce(sum((value->>'direct_revenue')::numeric),0) direct_revenue,
      coalesce(sum((value->>'direct_mrr')::numeric),0) direct_mrr,
      coalesce(sum((value->>'direct_arr')::numeric),0) direct_arr,
      coalesce(sum((value->>'influenced_revenue')::numeric),0) influenced_revenue,
      coalesce(sum((value->>'influenced_mrr')::numeric),0) influenced_mrr,
      coalesce(sum((value->>'influenced_arr')::numeric),0) influenced_arr,
      coalesce(sum((value->>'protected_revenue')::numeric),0) protected_revenue,
      coalesce(sum((value->>'protected_mrr')::numeric),0) protected_mrr,
      coalesce(sum((value->>'protected_arr')::numeric),0) protected_arr
    from jsonb_array_elements(v_squads) value
  ), financial as (
    select
      greatest(0,coalesce((v_fin.snapshot->'summary'->>'total_cost')::numeric,0)) total_cost,
      greatest(0,coalesce((v_fin.snapshot->'summary'->>'fte')::numeric,0)) fte
  )
  select jsonb_build_object(
    'squad_code','ALL',
    'credited_event_count',t.credited_event_count,
    'total_cost',round(f.total_cost,2),
    'fte',round(f.fte,4),
    'direct_revenue',round(t.direct_revenue,2),
    'direct_mrr',round(t.direct_mrr,2),
    'direct_arr',round(t.direct_arr,2),
    'influenced_revenue',round(t.influenced_revenue,2),
    'influenced_mrr',round(t.influenced_mrr,2),
    'influenced_arr',round(t.influenced_arr,2),
    'protected_revenue',round(t.protected_revenue,2),
    'protected_mrr',round(t.protected_mrr,2),
    'protected_arr',round(t.protected_arr,2),
    'direct_net_return',case when f.total_cost>0 then round((t.direct_revenue-f.total_cost)::numeric,2) else null end,
    'direct_roi_pct',case when f.total_cost>0 then round((((t.direct_revenue-f.total_cost)/f.total_cost)*100)::numeric,4) else null end,
    'direct_cost_coverage',case when f.total_cost>0 then round((t.direct_revenue/f.total_cost)::numeric,8) else null end,
    'influenced_impact_per_cost',case when f.total_cost>0 then round((t.influenced_revenue/f.total_cost)::numeric,8) else null end,
    'protected_impact_per_cost',case when f.total_cost>0 then round((t.protected_revenue/f.total_cost)::numeric,8) else null end
  ) into v_operation
  from totals t cross join financial f;

  with all_events as (
    select e.id,e.result_type,e.status,
      exists(select 1 from public.strategy_result_attributions a where a.organization_id=e.organization_id and a.event_id=e.id) attributed
    from public.strategy_result_events e
    where e.organization_id=v_comp.organization_id and e.competence_id=v_comp.id
  )
  select jsonb_build_object(
    'event_count',count(*),
    'confirmed_count',count(*) filter (where status='confirmed'),
    'draft_count',count(*) filter (where status='draft'),
    'cancelled_count',count(*) filter (where status='cancelled'),
    'direct_count',count(*) filter (where result_type='direct'),
    'influenced_count',count(*) filter (where result_type='influenced'),
    'protected_count',count(*) filter (where result_type='protected'),
    'attributed_count',count(*) filter (where attributed),
    'unattributed_count',count(*) filter (where not attributed)
  ) into v_integrity
  from all_events;

  v_payload:=jsonb_build_object(
    'snapshot_version','RS-1.0.0',
    'rule_version','RE-0.9.0-result-history',
    'source',p_source,
    'competence',to_char(v_comp.competence,'YYYY-MM'),
    'status','closed',
    'revision',v_comp.snapshot_revision,
    'financial_snapshot_revision',v_fin.revision,
    'captured_at',now(),
    'operation',coalesce(v_operation,'{}'::jsonb),
    'squads',coalesce(v_squads,'[]'::jsonb),
    'integrity',coalesce(v_integrity,'{}'::jsonb)
  );
  v_fingerprint:=md5(v_payload::text);

  insert into public.strategy_result_snapshots(
    organization_id,competence_id,revision,snapshot_version,rule_version,source,
    financial_snapshot_revision,snapshot_fingerprint,snapshot,created_at
  ) values (
    v_comp.organization_id,v_comp.id,v_comp.snapshot_revision,'RS-1.0.0',
    'RE-0.9.0-result-history',p_source,v_fin.revision,v_fingerprint,v_payload,now()
  )
  on conflict (organization_id,competence_id,revision) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.strategy_result_snapshots
    where organization_id=v_comp.organization_id
      and competence_id=v_comp.id
      and revision=v_comp.snapshot_revision;
  end if;

  return v_id;
end;
$$;

revoke all on function public.capture_strategy_result_snapshot(uuid,text) from public;
revoke all on function public.capture_strategy_result_snapshot(uuid,text) from authenticated;

create or replace function public.strategy_result_snapshot_after_close()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='closed' and old.status is distinct from new.status then
    perform public.capture_strategy_result_snapshot(new.id,'close');
  end if;
  return new;
end;
$$;

revoke all on function public.strategy_result_snapshot_after_close() from public;
revoke all on function public.strategy_result_snapshot_after_close() from authenticated;

drop trigger if exists strategy_result_snapshot_on_close on public.strategy_competences;
create trigger strategy_result_snapshot_on_close
after update of status on public.strategy_competences
for each row
when (new.status='closed' and old.status is distinct from new.status)
execute function public.strategy_result_snapshot_after_close();

-- Backfill controlado: reconstrói com o estado disponível hoje e marca a origem.
do $$
declare r record;
begin
  for r in
    select sc.id
    from public.strategy_competences sc
    where sc.status='closed'
      and coalesce(sc.snapshot_revision,0)>0
      and not exists (
        select 1 from public.strategy_result_snapshots srs
        where srs.organization_id=sc.organization_id
          and srs.competence_id=sc.id
          and srs.revision=sc.snapshot_revision
      )
  loop
    perform public.capture_strategy_result_snapshot(r.id,'legacy_backfill');
  end loop;
end;
$$;

create or replace function public.get_strategy_result_snapshot_history(
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
    raise exception 'strategy aggregate result history access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode='42501';
  end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  with latest as (
    select distinct on (srs.competence_id)
      srs.competence_id,srs.revision,srs.snapshot_version,srs.rule_version,srs.source,
      srs.financial_snapshot_revision,srs.snapshot_fingerprint,srs.snapshot,srs.created_at,sc.competence
    from public.strategy_result_snapshots srs
    join public.strategy_competences sc on sc.id=srs.competence_id
    where srs.organization_id=v_org
    order by srs.competence_id,srs.revision desc
  ), selected as (
    select
      l.*,
      case
        when v_all then coalesce(l.snapshot->'operation','{}'::jsonb)
        else coalesce((
          select value
          from jsonb_array_elements(coalesce(l.snapshot->'squads','[]'::jsonb)) value
          where upper(trim(coalesce(value->>'squad_code','')))=v_code
          limit 1
        ),'{}'::jsonb)
      end metric
    from latest l
  ), rows as (
    select * from selected where metric<>'{}'::jsonb
  )
  select jsonb_build_object(
    'source_available',true,
    'squad_code',case when v_all then 'ALL' else v_code end,
    'snapshot_version','RS-1.0.0',
    'rule_version','RE-0.9.0-result-history',
    'rows',coalesce(jsonb_agg(
      jsonb_build_object(
        'competence',to_char(competence,'YYYY-MM'),
        'status','closed',
        'revision',revision,
        'snapshot_version',snapshot_version,
        'rule_version',rule_version,
        'source',source,
        'financial_snapshot_revision',financial_snapshot_revision,
        'snapshot_fingerprint',snapshot_fingerprint,
        'created_at',created_at
      ) || metric
      order by competence
    ),'[]'::jsonb)
  ) into v_result
  from rows;

  return coalesce(v_result,jsonb_build_object(
    'source_available',true,
    'squad_code',case when v_all then 'ALL' else v_code end,
    'snapshot_version','RS-1.0.0',
    'rule_version','RE-0.9.0-result-history',
    'rows','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_result_snapshot_history(text) from public;
grant execute on function public.get_strategy_result_snapshot_history(text) to authenticated;

comment on table public.strategy_result_snapshots is
'V2.60.8: fotografia revisionada e imutavel do Resultado economico no fechamento da competencia, vinculada a revisao financeira oficial.';
comment on function public.get_strategy_result_snapshot_history(text) is
'V2.60.8: historico de Resultado por operacao ou Squad usando apenas snapshots fechados; nunca recalcula competencias passadas.';

notify pgrst,'reload schema';
commit;
