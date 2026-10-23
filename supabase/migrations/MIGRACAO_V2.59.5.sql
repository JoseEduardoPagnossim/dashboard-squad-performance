-- Soften Performance Hub V2.59.5
-- Resolucao automatica via Qualidade Completa + FCR operacional + FTE necessario.
--
-- Regras principais:
--   resolvidos = atendimentos operacionais - respostas explicitas Resolve = Nao
--   ausencia de resposta e considerada resolvida somente quando a competencia
--   possui importacao valida com a coluna Resolve.
--   FTE necessario usa demanda de atendimentos, pois chamados nao resolvidos
--   tambem consomem capacidade operacional.

begin;

create table if not exists public.quality_full_resolution_daily (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid not null references public.squads(id) on delete cascade,
  squad_code text not null,
  metric_date date not null,
  user_id uuid references auth.users(id) on delete set null,
  technician_name_snapshot text not null,
  technician_key text not null,
  resolve_yes integer not null default 0 check (resolve_yes >= 0),
  resolve_no integer not null default 0 check (resolve_no >= 0),
  resolve_blank integer not null default 0 check (resolve_blank >= 0),
  resolve_invalid integer not null default 0 check (resolve_invalid >= 0),
  source_rows integer not null default 0 check (source_rows >= 0),
  source_file text,
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quality_full_resolution_daily_unique unique (organization_id,squad_id,metric_date,technician_key)
);

create index if not exists idx_quality_full_resolution_daily_org_date
  on public.quality_full_resolution_daily(organization_id,metric_date);
create index if not exists idx_quality_full_resolution_daily_squad_date
  on public.quality_full_resolution_daily(squad_id,metric_date);
create index if not exists idx_quality_full_resolution_daily_user
  on public.quality_full_resolution_daily(organization_id,user_id,metric_date);

create table if not exists public.quality_full_resolution_coverage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid not null references public.squads(id) on delete cascade,
  squad_code text not null,
  competence date not null,
  resolve_column_present boolean not null default false,
  source_rows integer not null default 0 check (source_rows >= 0),
  linked_rows integer not null default 0 check (linked_rows >= 0),
  unlinked_rows integer not null default 0 check (unlinked_rows >= 0),
  unlinked_no_rows integer not null default 0 check (unlinked_no_rows >= 0),
  resolve_yes integer not null default 0 check (resolve_yes >= 0),
  resolve_no integer not null default 0 check (resolve_no >= 0),
  resolve_blank integer not null default 0 check (resolve_blank >= 0),
  resolve_invalid integer not null default 0 check (resolve_invalid >= 0),
  source_file text,
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quality_full_resolution_coverage_unique unique (organization_id,squad_id,competence),
  constraint quality_full_resolution_coverage_month check (competence=date_trunc('month',competence)::date)
);

create index if not exists idx_quality_full_resolution_coverage_org_comp
  on public.quality_full_resolution_coverage(organization_id,competence);

alter table public.quality_full_resolution_daily enable row level security;
alter table public.quality_full_resolution_coverage enable row level security;

drop policy if exists quality_full_resolution_daily_select on public.quality_full_resolution_daily;
create policy quality_full_resolution_daily_select on public.quality_full_resolution_daily
for select to authenticated using (public.can_read_squad(squad_id));
drop policy if exists quality_full_resolution_daily_insert on public.quality_full_resolution_daily;
create policy quality_full_resolution_daily_insert on public.quality_full_resolution_daily
for insert to authenticated with check (public.can_admin_squad(squad_id) and imported_by=(select auth.uid()));
drop policy if exists quality_full_resolution_daily_update on public.quality_full_resolution_daily;
create policy quality_full_resolution_daily_update on public.quality_full_resolution_daily
for update to authenticated using (public.can_admin_squad(squad_id)) with check (public.can_admin_squad(squad_id));
drop policy if exists quality_full_resolution_daily_delete on public.quality_full_resolution_daily;
create policy quality_full_resolution_daily_delete on public.quality_full_resolution_daily
for delete to authenticated using (public.can_admin_squad(squad_id));

drop policy if exists quality_full_resolution_coverage_select on public.quality_full_resolution_coverage;
create policy quality_full_resolution_coverage_select on public.quality_full_resolution_coverage
for select to authenticated using (public.can_read_squad(squad_id));
drop policy if exists quality_full_resolution_coverage_insert on public.quality_full_resolution_coverage;
create policy quality_full_resolution_coverage_insert on public.quality_full_resolution_coverage
for insert to authenticated with check (public.can_admin_squad(squad_id) and imported_by=(select auth.uid()));
drop policy if exists quality_full_resolution_coverage_update on public.quality_full_resolution_coverage;
create policy quality_full_resolution_coverage_update on public.quality_full_resolution_coverage
for update to authenticated using (public.can_admin_squad(squad_id)) with check (public.can_admin_squad(squad_id));
drop policy if exists quality_full_resolution_coverage_delete on public.quality_full_resolution_coverage;
create policy quality_full_resolution_coverage_delete on public.quality_full_resolution_coverage
for delete to authenticated using (public.can_admin_squad(squad_id));

grant select,insert,update,delete on public.quality_full_resolution_daily to authenticated;
grant select,insert,update,delete on public.quality_full_resolution_coverage to authenticated;

comment on table public.quality_full_resolution_daily is
'V2.59.5: respostas Resolve agregadas por tecnico/dia a partir da Importacao de Qualidade Completa.';
comment on table public.quality_full_resolution_coverage is
'V2.59.5: comprova que a competencia foi importada com coluna Resolve e registra integridade da fonte para FCR automatico.';

-- Sincroniza a base estrategica de resolucoes com a fonte automatica.
create or replace function public.sync_strategy_resolution_metrics_from_quality(
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
  v_comp uuid;
  v_status text;
  v_code text := upper(trim(coalesce(p_squad_code,'')));
  v_competence date := date_trunc('month',p_competence)::date;
  v_processed integer := 0;
  v_synced integer := 0;
  v_rows integer := 0;
  v_incomplete integer := 0;
  r record;
begin
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  select id,status into v_comp,v_status
  from public.strategy_competences
  where organization_id=v_org and competence=v_competence
  limit 1;

  if v_comp is null then
    return jsonb_build_object('status','no_competence','competence',to_char(v_competence,'YYYY-MM'),'synced',0);
  end if;
  if v_status='closed' then
    return jsonb_build_object('status','closed','competence',to_char(v_competence,'YYYY-MM'),'synced',0);
  end if;

  for r in
    select s.id squad_id,s.code squad_code
    from public.squads s
    where s.organization_id=v_org
      and (v_code='' or v_code='ALL' or upper(s.code)=v_code)
      and exists (
        select 1 from public.squad_months sm
        where sm.squad_id=s.id and sm.year=extract(year from v_competence)::int and sm.month=extract(month from v_competence)::int
      )
  loop
    if not public.can_admin_squad(r.squad_id) and not public.has_strategy_access('edit_costs') then
      raise exception 'resolution sync access denied' using errcode='42501';
    end if;
    v_processed := v_processed + 1;

    if not exists (
      select 1
      from public.quality_full_resolution_coverage c
      where c.organization_id=v_org and c.squad_id=r.squad_id and c.competence=v_competence
        and c.resolve_column_present=true and c.resolve_invalid=0 and c.unlinked_no_rows=0
    ) then
      delete from public.strategy_resolution_metrics
      where organization_id=v_org and competence_id=v_comp
        and upper(trim(squad_code_snapshot))=upper(r.squad_code)
        and source='csv';
      v_incomplete := v_incomplete + 1;
      continue;
    end if;

    -- Quando a fonte automatica e valida, ela e primaria para os tecnicos
    -- operacionais vinculados. O preenchimento manual permanece contingencia
    -- apenas onde nao existe fonte automatica valida.
    delete from public.strategy_resolution_metrics srm
    using public.squad_months sm, public.technician_monthly tm
    where srm.organization_id=v_org and srm.competence_id=v_comp
      and upper(trim(srm.squad_code_snapshot))=upper(r.squad_code)
      and sm.squad_id=r.squad_id and sm.year=extract(year from v_competence)::int and sm.month=extract(month from v_competence)::int
      and tm.squad_month_id=sm.id and tm.user_id is not null and srm.user_id=tm.user_id;

    with op as (
      select tm.user_id,tm.technician_name,coalesce(tm.att,0)::bigint attendance
      from public.squad_months sm
      join public.technician_monthly tm on tm.squad_month_id=sm.id
      where sm.squad_id=r.squad_id
        and sm.year=extract(year from v_competence)::int
        and sm.month=extract(month from v_competence)::int
        and tm.user_id is not null
    ), neg as (
      select q.user_id,coalesce(sum(q.resolve_no),0)::bigint resolve_no
      from public.quality_full_resolution_daily q
      where q.organization_id=v_org and q.squad_id=r.squad_id
        and q.metric_date>=v_competence and q.metric_date<(v_competence+interval '1 month')::date
        and q.user_id is not null
      group by q.user_id
    ), valid as (
      select op.user_id,op.technician_name,op.attendance,coalesce(neg.resolve_no,0)::bigint resolve_no
      from op left join neg on neg.user_id=op.user_id
      where coalesce(neg.resolve_no,0)<=op.attendance
    )
    insert into public.strategy_resolution_metrics(
      organization_id,competence_id,user_id,technician_name_snapshot,squad_code_snapshot,
      resolutions,source,notes,created_by,updated_by,created_at,updated_at
    )
    select v_org,v_comp,v.user_id,v.technician_name,upper(r.squad_code),
      greatest(v.attendance-v.resolve_no,0),'csv',
      'Automatico via Qualidade Completa: atendimentos - Resolve=Nao',
      auth.uid(),auth.uid(),now(),now()
    from valid v
    on conflict (organization_id,competence_id,user_id,squad_code_snapshot)
    do update set
      technician_name_snapshot=excluded.technician_name_snapshot,
      resolutions=excluded.resolutions,
      source='csv',
      notes=excluded.notes,
      updated_by=auth.uid(),
      updated_at=now();

    get diagnostics v_rows = row_count;
    v_synced := v_synced + v_rows;
  end loop;

  return jsonb_build_object(
    'status','ok','competence',to_char(v_competence,'YYYY-MM'),
    'squads_processed',v_processed,'synced',v_synced,'incomplete_squads',v_incomplete
  );
end;
$$;

revoke all on function public.sync_strategy_resolution_metrics_from_quality(date,text) from public;
grant execute on function public.sync_strategy_resolution_metrics_from_quality(date,text) to authenticated;

-- FCR operacional por tecnico no intervalo solicitado. A competencia so e
-- considerada completa quando todos os meses com atendimento possuem uma
-- importacao valida com a coluna Resolve.
create or replace function public.get_operational_fcr_overview_range(
  p_start_date date,
  p_end_date date
)
returns table (
  squad_code text,
  squad_name text,
  user_id uuid,
  technician_name text,
  attendance bigint,
  resolve_yes bigint,
  resolve_no bigint,
  resolve_blank bigint,
  resolved bigint,
  fcr numeric,
  source_complete boolean,
  covered_months bigint,
  attendance_months bigint
)
language sql
stable
security definer
set search_path=public
as $$
  with me as (
    select p.organization_id,p.squad_id,p.role
    from public.profiles p
    where p.user_id=auth.uid() and coalesce(p.active,true)=true
    limit 1
  ), bounds as (
    select least(p_start_date,p_end_date) date_from,greatest(p_start_date,p_end_date) date_to
  ), op_month as (
    select s.id squad_id,s.code::text squad_code,s.name::text squad_name,
      make_date(sm.year,sm.month,1) competence,
      tm.user_id,tm.technician_name::text technician_name,
      coalesce(sum(dm.att),0)::bigint attendance
    from me
    join bounds b on true
    join public.squads s on s.organization_id=me.organization_id
      and (me.role='super_admin' or s.id=me.squad_id)
    join public.squad_months sm on sm.squad_id=s.id
    join public.technician_monthly tm on tm.squad_month_id=sm.id
    join public.daily_metrics dm on dm.technician_month_id=tm.id
    where make_date(sm.year,sm.month,dm.day) between b.date_from and b.date_to
      and dm.day<=coalesce(sm.latest_day,dm.day)
    group by s.id,s.code,s.name,sm.year,sm.month,tm.user_id,tm.technician_name
    having coalesce(sum(dm.att),0)>0
  ), answers as (
    select q.squad_id,date_trunc('month',q.metric_date)::date competence,q.user_id,
      coalesce(sum(q.resolve_yes),0)::bigint resolve_yes,
      coalesce(sum(q.resolve_no),0)::bigint resolve_no,
      coalesce(sum(q.resolve_blank),0)::bigint resolve_blank
    from me join bounds b on true
    join public.quality_full_resolution_daily q on q.organization_id=me.organization_id
    where q.metric_date between b.date_from and b.date_to and q.user_id is not null
    group by q.squad_id,date_trunc('month',q.metric_date)::date,q.user_id
  ), monthly as (
    select o.*,
      coalesce(a.resolve_yes,0)::bigint resolve_yes,
      coalesce(a.resolve_no,0)::bigint resolve_no,
      coalesce(a.resolve_blank,0)::bigint resolve_blank,
      (c.id is not null and c.resolve_column_present=true and c.resolve_invalid=0 and c.unlinked_no_rows=0) coverage_valid
    from op_month o
    left join answers a on a.squad_id=o.squad_id and a.competence=o.competence and a.user_id=o.user_id
    left join public.quality_full_resolution_coverage c
      on c.organization_id=(select organization_id from me)
     and c.squad_id=o.squad_id and c.competence=o.competence
  ), grouped as (
    select squad_code,squad_name,user_id,technician_name,
      sum(attendance)::bigint attendance,
      sum(resolve_yes)::bigint resolve_yes,
      sum(resolve_no)::bigint resolve_no,
      sum(resolve_blank)::bigint resolve_blank,
      count(*)::bigint attendance_months,
      count(*) filter (where coverage_valid)::bigint covered_months,
      bool_and(coverage_valid) and sum(resolve_no)<=sum(attendance) source_complete
    from monthly
    group by squad_code,squad_name,user_id,technician_name
  )
  select squad_code,squad_name,user_id,technician_name,attendance,resolve_yes,resolve_no,resolve_blank,
    case when source_complete then greatest(attendance-resolve_no,0)::bigint else null end resolved,
    case when source_complete and attendance>0 then greatest(attendance-resolve_no,0)::numeric/attendance::numeric else null end fcr,
    source_complete,covered_months,attendance_months
  from grouped
  order by squad_code,technician_name;
$$;

revoke all on function public.get_operational_fcr_overview_range(date,date) from public;
grant execute on function public.get_operational_fcr_overview_range(date,date) to authenticated;

comment on function public.get_operational_fcr_overview_range(date,date) is
'V2.59.5: FCR automatico por tecnico; somente Resolve=Nao reduz resolucoes, e ausencia de resposta conta como resolvida quando a fonte Resolve esta completa.';

-- Amplia o historico de capacidade com atendimentos/FTE disponivel. A V2.59.3
-- continua usando resolucoes/FTE para utilizacao; a V2.59.5 usa atendimentos/FTE
-- para dimensionar FTE necessario para toda a demanda recebida.
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
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  with base as (
    select sc.competence::date competence,upper(trim(coalesce(sec.squad_code_snapshot,''))) squad_code,
      sec.fte::numeric nominal_fte,sec.availability_factor::numeric availability_factor,
      srm.id resolution_metric_id,coalesce(srm.resolutions,0)::numeric resolutions,
      tm.id attendance_metric_id,coalesce(tm.att,0)::numeric attendance
    from public.strategy_employee_costs sec
    join public.strategy_competences sc on sc.id=sec.competence_id and sc.organization_id=sec.organization_id
    join public.strategy_people sp on sp.id=sec.person_id and sp.organization_id=sec.organization_id
    left join public.strategy_resolution_metrics srm on srm.organization_id=sec.organization_id and srm.competence_id=sec.competence_id and srm.user_id=sp.user_id and upper(trim(srm.squad_code_snapshot))=upper(trim(coalesce(sec.squad_code_snapshot,'')))
    left join public.squads s on s.organization_id=sec.organization_id and upper(s.code)=upper(trim(coalesce(sec.squad_code_snapshot,'')))
    left join public.squad_months sm on sm.squad_id=s.id and sm.year=extract(year from sc.competence)::int and sm.month=extract(month from sc.competence)::int
    left join public.technician_monthly tm on tm.squad_month_id=sm.id and tm.user_id=sp.user_id
    where sec.organization_id=v_org and sc.status='closed'
  ), squad_agg as (
    select competence,squad_code,
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null)::bigint attendance_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is null)::bigint attendance_missing,
      coalesce(sum(attendance) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null),0)::numeric attendance_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base where nullif(squad_code,'') is not null group by competence,squad_code
  ), operation_agg as (
    select competence,'ALL'::text squad_code,
      count(*) filter (where nominal_fte>0)::bigint candidate_count,
      count(*) filter (where nominal_fte>0 and availability_factor is null)::bigint availability_missing,
      coalesce(sum(nominal_fte*availability_factor) filter (where nominal_fte>0 and availability_factor is not null),0)::numeric available_fte_known,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null)::bigint used_capacity_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is null)::bigint used_capacity_missing,
      coalesce(sum(resolutions) filter (where nominal_fte>0 and availability_factor>0 and resolution_metric_id is not null),0)::numeric used_capacity_volume,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null)::bigint attendance_entries,
      count(*) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is null)::bigint attendance_missing,
      coalesce(sum(attendance) filter (where nominal_fte>0 and availability_factor>0 and attendance_metric_id is not null),0)::numeric attendance_volume,
      count(*) filter (where nominal_fte>0 and availability_factor=0 and resolution_metric_id is not null and resolutions>0)::bigint inconsistent_rows
    from base group by competence
  ), rows as (select * from operation_agg union all select * from squad_agg), normalized as (
    select *,
      (candidate_count>0 and availability_missing=0 and used_capacity_missing=0 and inconsistent_rows=0 and available_fte_known>0) resolution_complete,
      (candidate_count>0 and availability_missing=0 and attendance_missing=0 and available_fte_known>0) attendance_complete
    from rows
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'competence',to_char(competence,'YYYY-MM'),'squad_code',squad_code,'status','closed',
    'candidate_count',candidate_count,'availability_missing',availability_missing,
    'used_capacity_entries',used_capacity_entries,'used_capacity_missing',used_capacity_missing,'inconsistent_rows',inconsistent_rows,
    'used_capacity_complete',resolution_complete,
    'available_fte',case when availability_missing=0 and candidate_count>0 then round(available_fte_known,4) else null end,
    'used_capacity_volume',case when resolution_complete then round(used_capacity_volume,0) else null end,
    'used_per_available_fte',case when resolution_complete then round((used_capacity_volume/available_fte_known)::numeric,6) else null end,
    'attendance_entries',attendance_entries,'attendance_missing',attendance_missing,'attendance_complete',attendance_complete,
    'attendance_volume',case when attendance_complete then round(attendance_volume,0) else null end,
    'attendance_per_available_fte',case when attendance_complete then round((attendance_volume/available_fte_known)::numeric,6) else null end
  ) order by competence,squad_code),'[]'::jsonb)
  into v_result from normalized;
  return coalesce(v_result,'[]'::jsonb);
end;
$$;

revoke all on function public.get_strategy_capacity_utilization_history() from public;
grant execute on function public.get_strategy_capacity_utilization_history() to authenticated;

comment on function public.get_strategy_capacity_utilization_history() is
'V2.59.5: historico fechado de capacidade com resolucoes/FTE para utilizacao e atendimentos/FTE para dimensionamento de FTE necessario.';

notify pgrst,'reload schema';
commit;
