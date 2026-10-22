-- Soften Performance Hub V2.58.2
-- Base explícita de resoluções para custo por resolução.
-- Resolução NÃO é inferida a partir de atendimentos: ela precisa ser registrada
-- por técnico/competência e permanece imutável quando a competência é fechada.

begin;

create table if not exists public.strategy_resolution_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  technician_name_snapshot text not null,
  squad_code_snapshot text not null,
  resolutions bigint not null default 0 check (resolutions >= 0),
  source text not null default 'manual' check (source in ('manual','csv','api')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, competence_id, user_id, squad_code_snapshot)
);

create index if not exists idx_strategy_resolution_metrics_competence
  on public.strategy_resolution_metrics(competence_id);
create index if not exists idx_strategy_resolution_metrics_org_squad
  on public.strategy_resolution_metrics(organization_id, squad_code_snapshot);
create index if not exists idx_strategy_resolution_metrics_user
  on public.strategy_resolution_metrics(organization_id, user_id);

alter table public.strategy_resolution_metrics enable row level security;

-- O detalhe individual de resolução acompanha a mesma proteção de custos pessoais.
drop policy if exists strategy_resolution_metrics_select on public.strategy_resolution_metrics;
create policy strategy_resolution_metrics_select on public.strategy_resolution_metrics
for select to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_resolution_metrics_insert on public.strategy_resolution_metrics;
create policy strategy_resolution_metrics_insert on public.strategy_resolution_metrics
for insert to authenticated
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
  and public.is_strategy_competence_open(competence_id)
);

drop policy if exists strategy_resolution_metrics_update on public.strategy_resolution_metrics;
create policy strategy_resolution_metrics_update on public.strategy_resolution_metrics
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

drop policy if exists strategy_resolution_metrics_delete on public.strategy_resolution_metrics;
create policy strategy_resolution_metrics_delete on public.strategy_resolution_metrics
for delete to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
  and public.is_strategy_competence_open(competence_id)
);

grant select, insert, update, delete on public.strategy_resolution_metrics to authenticated;

-- Visão agregada da competência. Usuários sem acesso a custos pessoais podem
-- consumir os totais sem acessar as linhas individuais.
create or replace function public.get_strategy_resolution_summary(p_competence date,p_squad_code text default null)
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
  v_comp uuid;
  v_resolutions bigint := 0;
  v_entries bigint := 0;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy aggregate access denied' using errcode='42501';
  end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  v_code := upper(trim(coalesce(p_squad_code,'')));
  v_all := v_code='' or v_code='ALL';
  select id into v_comp
  from public.strategy_competences
  where organization_id=v_org
    and competence=date_trunc('month',p_competence)::date
  limit 1;
  if v_comp is null then
    return jsonb_build_object(
      'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
      'squad_code',case when v_all then 'ALL' else v_code end,
      'resolutions',0,
      'resolution_entries',0
    );
  end if;
  select coalesce(sum(resolutions),0)::bigint,count(*)::bigint
    into v_resolutions,v_entries
  from public.strategy_resolution_metrics
  where organization_id=v_org
    and competence_id=v_comp
    and (v_all or upper(squad_code_snapshot)=v_code);
  return jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'resolutions',v_resolutions,
    'resolution_entries',v_entries
  );
end;
$$;
revoke all on function public.get_strategy_resolution_summary(date,text) from public;
grant execute on function public.get_strategy_resolution_summary(date,text) to authenticated;

create or replace function public.get_strategy_resolution_squad_summary(p_competence date)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_comp uuid;
  v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy aggregate access denied' using errcode='42501';
  end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  select id into v_comp
  from public.strategy_competences
  where organization_id=v_org
    and competence=date_trunc('month',p_competence)::date
  limit 1;
  if v_comp is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'squad_code',q.squad_code,
    'resolutions',q.resolutions,
    'resolution_entries',q.entries
  ) order by q.squad_code),'[]'::jsonb)
  into v_result
  from (
    select upper(squad_code_snapshot) squad_code,
      coalesce(sum(resolutions),0)::bigint resolutions,
      count(*)::bigint entries
    from public.strategy_resolution_metrics
    where organization_id=v_org and competence_id=v_comp
    group by upper(squad_code_snapshot)
  ) q;
  return coalesce(v_result,'[]'::jsonb);
end;
$$;
revoke all on function public.get_strategy_resolution_squad_summary(date) from public;
grant execute on function public.get_strategy_resolution_squad_summary(date) to authenticated;

create or replace function public.get_strategy_resolution_history(p_squad_code text default null)
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
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  v_code := upper(trim(coalesce(p_squad_code,'')));
  v_all := v_code='' or v_code='ALL';
  with rows as (
    select sc.competence,
      coalesce(sum(srm.resolutions) filter (where v_all or upper(srm.squad_code_snapshot)=v_code),0)::bigint resolutions,
      (count(srm.id) filter (where v_all or upper(srm.squad_code_snapshot)=v_code))::bigint resolution_entries
    from public.strategy_competences sc
    left join public.strategy_resolution_metrics srm
      on srm.competence_id=sc.id and srm.organization_id=sc.organization_id
    where sc.organization_id=v_org
    group by sc.id,sc.competence
    order by sc.competence
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'competence',to_char(competence,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'resolutions',resolutions,
    'resolution_entries',resolution_entries
  ) order by competence),'[]'::jsonb)
  into v_result from rows;
  return coalesce(v_result,'[]'::jsonb);
end;
$$;
revoke all on function public.get_strategy_resolution_history(text) from public;
grant execute on function public.get_strategy_resolution_history(text) to authenticated;

notify pgrst,'reload schema';
commit;
