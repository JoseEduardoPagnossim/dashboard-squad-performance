-- Soften Performance Hub V2.57.6
-- Gestão Estratégica: fechamento seguro, snapshots revisionados e histórico imutável.

begin;

alter table public.strategy_competences
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references auth.users(id) on delete set null,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopened_by uuid references auth.users(id) on delete set null,
  add column if not exists snapshot_revision integer not null default 0,
  add column if not exists snapshot_version text,
  add column if not exists rule_version text;

create table if not exists public.strategy_competence_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  revision integer not null check (revision > 0),
  snapshot_version text not null,
  rule_version text not null,
  snapshot_fingerprint text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, competence_id, revision)
);

create index if not exists idx_strategy_snapshots_competence_revision
  on public.strategy_competence_snapshots(competence_id, revision desc);

alter table public.strategy_competence_snapshots enable row level security;
revoke all on table public.strategy_competence_snapshots from public;
revoke all on table public.strategy_competence_snapshots from authenticated;
grant select on table public.strategy_competence_snapshots to authenticated;

create or replace function public.is_strategy_competence_open(p_competence_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1
    from public.strategy_competences sc
    join public.profiles p on p.user_id=(select auth.uid())
    where sc.id=p_competence_id
      and sc.organization_id=p.organization_id
      and p.active=true
      and sc.status <> 'closed'
  );
$$;
revoke all on function public.is_strategy_competence_open(uuid) from public;
grant execute on function public.is_strategy_competence_open(uuid) to authenticated;

-- Fechamento passa a ser exclusivamente via RPC. Edição normal só alcança
-- competências abertas e nunca consegue gravar status=closed diretamente.
drop policy if exists strategy_competences_update on public.strategy_competences;
create policy strategy_competences_update on public.strategy_competences
for update to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and status <> 'closed'
)
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and status in ('draft','provisional')
);

drop policy if exists strategy_competences_delete on public.strategy_competences;
create policy strategy_competences_delete on public.strategy_competences
for delete to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and status <> 'closed'
);

-- Custos pessoais ficam imutáveis enquanto a competência estiver fechada.
drop policy if exists strategy_employee_costs_insert on public.strategy_employee_costs;
create policy strategy_employee_costs_insert on public.strategy_employee_costs
for insert to authenticated
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
  and public.is_strategy_competence_open(competence_id)
);

drop policy if exists strategy_employee_costs_update on public.strategy_employee_costs;
create policy strategy_employee_costs_update on public.strategy_employee_costs
for update to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
  and public.is_strategy_competence_open(competence_id)
)
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
  and public.is_strategy_competence_open(competence_id)
);

drop policy if exists strategy_employee_costs_delete on public.strategy_employee_costs;
create policy strategy_employee_costs_delete on public.strategy_employee_costs
for delete to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
  and public.is_strategy_competence_open(competence_id)
);

-- Custos operacionais e os rateios também congelam junto com a competência.
drop policy if exists strategy_operational_costs_insert on public.strategy_operational_costs;
create policy strategy_operational_costs_insert on public.strategy_operational_costs
for insert to authenticated
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.is_strategy_competence_open(competence_id)
);

drop policy if exists strategy_operational_costs_update on public.strategy_operational_costs;
create policy strategy_operational_costs_update on public.strategy_operational_costs
for update to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.is_strategy_competence_open(competence_id)
)
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.is_strategy_competence_open(competence_id)
);

drop policy if exists strategy_operational_costs_delete on public.strategy_operational_costs;
create policy strategy_operational_costs_delete on public.strategy_operational_costs
for delete to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.is_strategy_competence_open(competence_id)
);

drop policy if exists strategy_cost_allocations_insert on public.strategy_cost_allocations;
create policy strategy_cost_allocations_insert on public.strategy_cost_allocations
for insert to authenticated
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and exists (
    select 1 from public.strategy_operational_costs soc
    where soc.id=operational_cost_id
      and soc.organization_id=(select (public.current_profile()).organization_id)
      and public.is_strategy_competence_open(soc.competence_id)
  )
);

drop policy if exists strategy_cost_allocations_update on public.strategy_cost_allocations;
create policy strategy_cost_allocations_update on public.strategy_cost_allocations
for update to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and exists (
    select 1 from public.strategy_operational_costs soc
    where soc.id=operational_cost_id
      and soc.organization_id=(select (public.current_profile()).organization_id)
      and public.is_strategy_competence_open(soc.competence_id)
  )
)
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and exists (
    select 1 from public.strategy_operational_costs soc
    where soc.id=operational_cost_id
      and soc.organization_id=(select (public.current_profile()).organization_id)
      and public.is_strategy_competence_open(soc.competence_id)
  )
);

drop policy if exists strategy_cost_allocations_delete on public.strategy_cost_allocations;
create policy strategy_cost_allocations_delete on public.strategy_cost_allocations
for delete to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and exists (
    select 1 from public.strategy_operational_costs soc
    where soc.id=operational_cost_id
      and soc.organization_id=(select (public.current_profile()).organization_id)
      and public.is_strategy_competence_open(soc.competence_id)
  )
);

-- Resumo financeiro: competências fechadas leem a fotografia do snapshot.
create or replace function public.get_strategy_financial_summary(p_competence date,p_squad_code text default null)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare
  v_org uuid; v_all boolean; v_code text; v_result jsonb; v_comp record; v_snapshot jsonb;
begin
  if not public.has_strategy_access('aggregates') then raise exception 'strategy aggregate access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  v_code := upper(trim(coalesce(p_squad_code,''))); v_all := v_code='' or v_code='ALL';
  select sc.id,sc.competence,sc.status into v_comp from public.strategy_competences sc where sc.organization_id=v_org and sc.competence=date_trunc('month',p_competence)::date limit 1;
  if v_comp.id is null then return '{}'::jsonb; end if;

  if v_comp.status='closed' then
    select ss.snapshot into v_snapshot from public.strategy_competence_snapshots ss where ss.organization_id=v_org and ss.competence_id=v_comp.id order by ss.revision desc limit 1;
    if v_snapshot is not null then
      if v_all then return coalesce(v_snapshot->'summary','{}'::jsonb); end if;
      select value into v_result from jsonb_array_elements(coalesce(v_snapshot->'squads','[]'::jsonb)) where upper(coalesce(value->>'squad_code',''))=v_code limit 1;
      return coalesce(v_result,jsonb_build_object('competence',to_char(v_comp.competence,'YYYY-MM'),'squad_code',v_code,'people_count',0,'fte',0,'salary',0,'employer_charges',0,'benefits',0,'variable_pay',0,'overtime',0,'other_costs',0,'people_cost',0,'operational_cost',0,'unallocated_operational_cost',0,'total_cost',0,'attendance',0,'evaluation_rate',null,'quality_target',null));
    end if;
  end if;

  with comp as (
    select v_comp.id id
  ), people as (
    select count(distinct sec.person_id) people_count,coalesce(round(sum(sec.fte)::numeric,2),0) fte,
      coalesce(round(sum(sec.salary*sec.fte)::numeric,2),0) salary,
      coalesce(round(sum(sec.employer_charges*sec.fte)::numeric,2),0) employer_charges,
      coalesce(round(sum(sec.benefits*sec.fte)::numeric,2),0) benefits,
      coalesce(round(sum(sec.variable_pay*sec.fte)::numeric,2),0) variable_pay,
      coalesce(round(sum(sec.overtime*sec.fte)::numeric,2),0) overtime,
      coalesce(round(sum(sec.other_costs*sec.fte)::numeric,2),0) other_costs,
      coalesce(round(sum(sec.total_cost)::numeric,2),0) people_cost
    from public.strategy_employee_costs sec join comp c on c.id=sec.competence_id
    where sec.organization_id=v_org and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)
  ), op as (
    select case when v_all then
      coalesce((select round(sum(soc.amount)::numeric,2) from public.strategy_operational_costs soc join comp c on c.id=soc.competence_id where soc.organization_id=v_org),0)
    else
      coalesce((select round(sum(sca.allocated_amount)::numeric,2) from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id join comp c on c.id=soc.competence_id where sca.organization_id=v_org and upper(sca.squad_code)=v_code),0)
    end operational_cost,
    coalesce((select round(sum(sca.allocated_amount)::numeric,2) from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id join comp c on c.id=soc.competence_id where sca.organization_id=v_org and upper(sca.squad_code)='UNALLOCATED'),0) unallocated_operational_cost
  ), squad_ops as (
    select
      upper(s.code) squad_code,
      sm.team_goal_eval_pct quality_target,
      coalesce(sum(tm.att),0)::bigint attendance,
      coalesce(sum(tm.total_eval),0)::numeric total_eval,
      coalesce(sum(greatest(tm.att-coalesce(tm.evaluation_excluded_att,0),0)),0)::numeric eligible_eval
    from public.squads s
    join public.squad_months sm on sm.squad_id=s.id and sm.year=extract(year from v_comp.competence)::int and sm.month=extract(month from v_comp.competence)::int
    left join public.technician_monthly tm on tm.squad_month_id=sm.id
    where s.organization_id=v_org and (v_all or upper(s.code)=v_code)
    group by upper(s.code),sm.id,sm.team_goal_eval_pct
  ), ops as (
    select
      coalesce(sum(attendance),0)::bigint attendance,
      case when coalesce(sum(eligible_eval),0)>0 then coalesce(sum(total_eval),0)::numeric/sum(eligible_eval)::numeric else null end evaluation_rate,
      case when count(*)>0 then sum(quality_target*greatest(attendance,1)) / nullif(sum(greatest(attendance,1)),0) else null end quality_target
    from squad_ops
  )
  select jsonb_build_object(
    'competence',to_char(v_comp.competence,'YYYY-MM'),'squad_code',case when v_all then 'ALL' else v_code end,
    'people_count',people.people_count,'fte',people.fte,'salary',people.salary,'employer_charges',people.employer_charges,'benefits',people.benefits,'variable_pay',people.variable_pay,'overtime',people.overtime,'other_costs',people.other_costs,
    'people_cost',people.people_cost,'operational_cost',op.operational_cost,'unallocated_operational_cost',op.unallocated_operational_cost,'total_cost',round((people.people_cost+op.operational_cost)::numeric,2),
    'attendance',ops.attendance,'evaluation_rate',ops.evaluation_rate,'quality_target',ops.quality_target
  ) into v_result from people cross join op cross join ops;
  return coalesce(v_result,'{}'::jsonb);
end;$$;
revoke all on function public.get_strategy_financial_summary(date,text) from public;
grant execute on function public.get_strategy_financial_summary(date,text) to authenticated;

-- Consolidação por Squad também usa snapshot quando a competência estiver fechada.
create or replace function public.get_strategy_squad_cost_summary(p_competence date)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_org uuid; v_result jsonb; v_comp record; v_snapshot jsonb;
begin
  if not public.has_strategy_access('aggregates') then raise exception 'strategy aggregate access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id into v_org;
  select sc.id,sc.competence,sc.status into v_comp from public.strategy_competences sc where sc.organization_id=v_org and sc.competence=date_trunc('month',p_competence)::date limit 1;
  if v_comp.id is null then return '[]'::jsonb; end if;
  if v_comp.status='closed' then
    select ss.snapshot into v_snapshot from public.strategy_competence_snapshots ss where ss.organization_id=v_org and ss.competence_id=v_comp.id order by ss.revision desc limit 1;
    if v_snapshot is not null then return coalesce(v_snapshot->'squads','[]'::jsonb); end if;
  end if;

  with comp as (select v_comp.id id),
  p as (
    select upper(coalesce(sec.squad_code_snapshot,'')) squad_code,count(distinct sec.person_id) people_count,coalesce(round(sum(sec.fte)::numeric,2),0) fte,
      coalesce(round(sum(sec.salary*sec.fte)::numeric,2),0) salary,coalesce(round(sum(sec.employer_charges*sec.fte)::numeric,2),0) employer_charges,coalesce(round(sum(sec.benefits*sec.fte)::numeric,2),0) benefits,
      coalesce(round(sum(sec.variable_pay*sec.fte)::numeric,2),0) variable_pay,coalesce(round(sum(sec.overtime*sec.fte)::numeric,2),0) overtime,coalesce(round(sum(sec.other_costs*sec.fte)::numeric,2),0) other_costs,
      coalesce(round(sum(sec.total_cost)::numeric,2),0) people_cost
    from public.strategy_employee_costs sec join comp c on c.id=sec.competence_id where sec.organization_id=v_org and nullif(trim(sec.squad_code_snapshot),'') is not null group by 1
  ),
  o as (select upper(sca.squad_code) squad_code,coalesce(round(sum(sca.allocated_amount)::numeric,2),0) operational_cost from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id join comp c on c.id=soc.competence_id where sca.organization_id=v_org and upper(sca.squad_code)<>'UNALLOCATED' group by 1),
  ops as (
    select upper(s.code) squad_code,coalesce(sum(tm.att),0)::bigint attendance,
      case when coalesce(sum(greatest(tm.att-coalesce(tm.evaluation_excluded_att,0),0)),0)>0 then coalesce(sum(tm.total_eval),0)::numeric/sum(greatest(tm.att-coalesce(tm.evaluation_excluded_att,0),0))::numeric else null end evaluation_rate,
      max(sm.team_goal_eval_pct) quality_target
    from public.squads s join public.squad_months sm on sm.squad_id=s.id left join public.technician_monthly tm on tm.squad_month_id=sm.id
    where s.organization_id=v_org and sm.year=extract(year from v_comp.competence)::int and sm.month=extract(month from v_comp.competence)::int group by upper(s.code)
  ),
  codes as (select squad_code from p union select squad_code from o union select squad_code from ops)
  select coalesce(jsonb_agg(jsonb_build_object(
    'competence',to_char(v_comp.competence,'YYYY-MM'),'squad_code',codes.squad_code,'people_count',coalesce(p.people_count,0),'fte',coalesce(p.fte,0),
    'salary',coalesce(p.salary,0),'employer_charges',coalesce(p.employer_charges,0),'benefits',coalesce(p.benefits,0),'variable_pay',coalesce(p.variable_pay,0),'overtime',coalesce(p.overtime,0),'other_costs',coalesce(p.other_costs,0),
    'people_cost',coalesce(p.people_cost,0),'operational_cost',coalesce(o.operational_cost,0),'unallocated_operational_cost',0,'total_cost',coalesce(p.people_cost,0)+coalesce(o.operational_cost,0),
    'attendance',coalesce(ops.attendance,0),'evaluation_rate',ops.evaluation_rate,'quality_target',ops.quality_target
  ) order by codes.squad_code),'[]'::jsonb) into v_result from codes left join p using(squad_code) left join o using(squad_code) left join ops using(squad_code);
  return coalesce(v_result,'[]'::jsonb);
end;$$;
revoke all on function public.get_strategy_squad_cost_summary(date) from public;
grant execute on function public.get_strategy_squad_cost_summary(date) to authenticated;

-- Histórico sempre usa o resumo oficial da competência. Em mês fechado, isso
-- significa o snapshot; em mês aberto, significa os dados vivos.
create or replace function public.get_strategy_financial_history(p_squad_code text default null)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_org uuid; r record; v_item jsonb; v_result jsonb := '[]'::jsonb;
begin
  if not public.has_strategy_access('aggregates') then raise exception 'strategy aggregate access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  for r in select sc.competence,sc.status from public.strategy_competences sc where sc.organization_id=v_org order by sc.competence loop
    v_item := public.get_strategy_financial_summary(r.competence,p_squad_code);
    v_result := v_result || jsonb_build_array(coalesce(v_item,'{}'::jsonb) || jsonb_build_object('status',r.status));
  end loop;
  return v_result;
end;$$;
revoke all on function public.get_strategy_financial_history(text) from public;
grant execute on function public.get_strategy_financial_history(text) to authenticated;

-- Fechamento gera snapshot completo e revisionado. Custos sem rateio ou rateios
-- cuja soma não fecha com o lançamento impedem o fechamento.
create or replace function public.close_strategy_competence(p_competence date)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid; v_uid uuid; v_comp record; v_summary jsonb; v_squads jsonb; v_people jsonb; v_ops jsonb; v_alloc jsonb;
  v_snapshot jsonb; v_revision integer; v_fingerprint text; v_bad_alloc integer; v_unallocated numeric; v_now timestamptz := now();
begin
  if not public.has_strategy_access('close_competence') then raise exception 'strategy close competence access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id,(select auth.uid()) into v_org,v_uid;
  select * into v_comp from public.strategy_competences sc where sc.organization_id=v_org and sc.competence=date_trunc('month',p_competence)::date for update;
  if v_comp.id is null then raise exception 'strategy competence not found' using errcode='P0002'; end if;
  if v_comp.status='closed' then
    return jsonb_build_object('competence',to_char(v_comp.competence,'YYYY-MM'),'status','closed','revision',v_comp.snapshot_revision,'snapshot_version',v_comp.snapshot_version,'closed_at',v_comp.closed_at);
  end if;

  select coalesce(sum(sca.allocated_amount),0) into v_unallocated
  from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id
  where soc.organization_id=v_org and soc.competence_id=v_comp.id and upper(sca.squad_code)='UNALLOCATED';
  if abs(coalesce(v_unallocated,0)) > 0.009 then raise exception 'unallocated operational costs must be resolved before closing' using errcode='23514'; end if;

  select count(*) into v_bad_alloc from (
    select soc.id,soc.amount,coalesce(sum(sca.allocated_amount),0) allocated
    from public.strategy_operational_costs soc left join public.strategy_cost_allocations sca on sca.operational_cost_id=soc.id and sca.organization_id=soc.organization_id
    where soc.organization_id=v_org and soc.competence_id=v_comp.id
    group by soc.id,soc.amount
    having abs(soc.amount-coalesce(sum(sca.allocated_amount),0)) > 0.009
  ) q;
  if v_bad_alloc>0 then raise exception 'operational cost allocation mismatch must be resolved before closing' using errcode='23514'; end if;

  v_summary := public.get_strategy_financial_summary(v_comp.competence,null);
  v_squads := public.get_strategy_squad_cost_summary(v_comp.competence);

  select coalesce(jsonb_agg(jsonb_build_object(
    'person_id',sec.person_id,'name',sp.name,'role_label',sp.role_label,'squad_code',sec.squad_code_snapshot,'fte',sec.fte,
    'salary',sec.salary,'employer_charges',sec.employer_charges,'benefits',sec.benefits,'variable_pay',sec.variable_pay,'overtime',sec.overtime,'other_costs',sec.other_costs,'total_cost',sec.total_cost,'source',sec.source
  ) order by sp.name),'[]'::jsonb) into v_people
  from public.strategy_employee_costs sec join public.strategy_people sp on sp.id=sec.person_id
  where sec.organization_id=v_org and sec.competence_id=v_comp.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',soc.id,'description',soc.description,'category',soc.category,'amount',soc.amount,'scope_type',soc.scope_type,'squad_code',soc.squad_code,'allocation_method',soc.allocation_method,'recurring',soc.recurring,'source',soc.source
  ) order by soc.description),'[]'::jsonb) into v_ops
  from public.strategy_operational_costs soc where soc.organization_id=v_org and soc.competence_id=v_comp.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'operational_cost_id',sca.operational_cost_id,'squad_code',sca.squad_code,'allocation_method',sca.allocation_method_snapshot,'basis_value',sca.basis_value,'percentage',sca.percentage,'allocated_amount',sca.allocated_amount
  ) order by sca.operational_cost_id,sca.squad_code),'[]'::jsonb) into v_alloc
  from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id
  where sca.organization_id=v_org and soc.competence_id=v_comp.id;

  v_revision := coalesce(v_comp.snapshot_revision,0)+1;
  v_snapshot := jsonb_build_object(
    'snapshot_version','SS-1.0.0','rule_version','SC-0.6.0-snapshot','insight_rule_version','SI-1.1.0',
    'competence',to_char(v_comp.competence,'YYYY-MM'),'revision',v_revision,'closed_at',v_now,
    'summary',v_summary,'squads',v_squads,'people',v_people,'operational_costs',v_ops,'allocations',v_alloc,
    'facts',jsonb_build_object('people_count',jsonb_array_length(v_people),'operational_cost_count',jsonb_array_length(v_ops),'allocation_count',jsonb_array_length(v_alloc),'unallocated_operational_cost',coalesce(v_unallocated,0))
  );
  v_fingerprint := md5(v_snapshot::text);

  insert into public.strategy_competence_snapshots(organization_id,competence_id,revision,snapshot_version,rule_version,snapshot_fingerprint,snapshot,created_by,created_at)
  values(v_org,v_comp.id,v_revision,'SS-1.0.0','SC-0.6.0-snapshot',v_fingerprint,v_snapshot,v_uid,v_now);

  update public.strategy_competences set status='closed',closed_at=v_now,closed_by=v_uid,reopened_at=null,reopened_by=null,snapshot_revision=v_revision,snapshot_version='SS-1.0.0',rule_version='SC-0.6.0-snapshot',updated_by=v_uid,updated_at=v_now where id=v_comp.id;

  return jsonb_build_object('competence',to_char(v_comp.competence,'YYYY-MM'),'status','closed','revision',v_revision,'snapshot_version','SS-1.0.0','rule_version','SC-0.6.0-snapshot','fingerprint',v_fingerprint,'closed_at',v_now);
end;
$$;
revoke all on function public.close_strategy_competence(date) from public;
grant execute on function public.close_strategy_competence(date) to authenticated;

create or replace function public.reopen_strategy_competence(p_competence date)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_org uuid; v_uid uuid; v_comp record; v_now timestamptz:=now();
begin
  if not public.has_strategy_access('close_competence') then raise exception 'strategy close competence access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id,(select auth.uid()) into v_org,v_uid;
  select * into v_comp from public.strategy_competences sc where sc.organization_id=v_org and sc.competence=date_trunc('month',p_competence)::date for update;
  if v_comp.id is null then raise exception 'strategy competence not found' using errcode='P0002'; end if;
  if v_comp.status<>'closed' then return jsonb_build_object('competence',to_char(v_comp.competence,'YYYY-MM'),'status',v_comp.status,'revision',v_comp.snapshot_revision); end if;
  update public.strategy_competences set status='provisional',reopened_at=v_now,reopened_by=v_uid,updated_by=v_uid,updated_at=v_now where id=v_comp.id;
  return jsonb_build_object('competence',to_char(v_comp.competence,'YYYY-MM'),'status','provisional','revision',v_comp.snapshot_revision,'reopened_at',v_now);
end;
$$;
revoke all on function public.reopen_strategy_competence(date) from public;
grant execute on function public.reopen_strategy_competence(date) to authenticated;

notify pgrst,'reload schema';
commit;
