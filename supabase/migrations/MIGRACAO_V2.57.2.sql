-- Soften Performance Hub V2.57.2
-- Gestão Estratégica: competências, pessoas e custos pessoais.
-- Mantém o domínio financeiro estratégico isolado das tabelas operacionais.

begin;

create table if not exists public.strategy_competences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence date not null,
  status text not null default 'draft' check (status in ('draft','provisional','closed')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, competence),
  check (extract(day from competence) = 1)
);

create table if not exists public.strategy_people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role_label text,
  default_squad_code text,
  default_fte numeric(5,4) not null default 1 check (default_fte >= 0 and default_fte <= 1),
  active boolean not null default true,
  source text not null default 'manual' check (source in ('manual','csv','api')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategy_employee_costs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  person_id uuid not null references public.strategy_people(id) on delete cascade,
  squad_code_snapshot text,
  fte numeric(5,4) not null default 1 check (fte >= 0 and fte <= 1),
  salary numeric(14,2) not null default 0 check (salary >= 0),
  employer_charges numeric(14,2) not null default 0 check (employer_charges >= 0),
  benefits numeric(14,2) not null default 0 check (benefits >= 0),
  variable_pay numeric(14,2) not null default 0 check (variable_pay >= 0),
  overtime numeric(14,2) not null default 0 check (overtime >= 0),
  other_costs numeric(14,2) not null default 0 check (other_costs >= 0),
  total_cost numeric(14,2) generated always as (
    round(((salary + employer_charges + benefits + variable_pay + overtime + other_costs) * fte)::numeric, 2)
  ) stored,
  source text not null default 'manual' check (source in ('manual','csv','api')),
  source_reference text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, competence_id, person_id)
);

create index if not exists idx_strategy_competences_org_competence on public.strategy_competences(organization_id, competence desc);
create index if not exists idx_strategy_people_org_active on public.strategy_people(organization_id, active);
create index if not exists idx_strategy_people_user on public.strategy_people(user_id);
create index if not exists idx_strategy_employee_costs_competence on public.strategy_employee_costs(competence_id);
create index if not exists idx_strategy_employee_costs_person on public.strategy_employee_costs(person_id);
create index if not exists idx_strategy_employee_costs_org_squad on public.strategy_employee_costs(organization_id, squad_code_snapshot);

alter table public.strategy_competences enable row level security;
alter table public.strategy_people enable row level security;
alter table public.strategy_employee_costs enable row level security;

-- Competências não expõem salário e podem ser lidas por qualquer usuário já
-- autorizado a entrar na Gestão Estratégica.
drop policy if exists strategy_competences_select on public.strategy_competences;
create policy strategy_competences_select on public.strategy_competences
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('view')
);

drop policy if exists strategy_competences_insert on public.strategy_competences;
create policy strategy_competences_insert on public.strategy_competences
for insert to authenticated
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_competences_update on public.strategy_competences;
create policy strategy_competences_update on public.strategy_competences
for update to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
)
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_competences_delete on public.strategy_competences;
create policy strategy_competences_delete on public.strategy_competences
for delete to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

-- Pessoas e custos pessoais ficam invisíveis para o acesso estratégico básico.
drop policy if exists strategy_people_select on public.strategy_people;
create policy strategy_people_select on public.strategy_people
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_people_insert on public.strategy_people;
create policy strategy_people_insert on public.strategy_people
for insert to authenticated
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_people_update on public.strategy_people;
create policy strategy_people_update on public.strategy_people
for update to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
)
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_people_delete on public.strategy_people;
create policy strategy_people_delete on public.strategy_people
for delete to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_employee_costs_select on public.strategy_employee_costs;
create policy strategy_employee_costs_select on public.strategy_employee_costs
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_employee_costs_insert on public.strategy_employee_costs;
create policy strategy_employee_costs_insert on public.strategy_employee_costs
for insert to authenticated
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_employee_costs_update on public.strategy_employee_costs;
create policy strategy_employee_costs_update on public.strategy_employee_costs
for update to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
)
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
);

drop policy if exists strategy_employee_costs_delete on public.strategy_employee_costs;
create policy strategy_employee_costs_delete on public.strategy_employee_costs
for delete to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
  and public.has_strategy_access('people_costs')
);

grant select, insert, update, delete on public.strategy_competences to authenticated;
grant select, insert, update, delete on public.strategy_people to authenticated;
grant select, insert, update, delete on public.strategy_employee_costs to authenticated;

-- O usuário com acesso agregado recebe somente totais; nomes e salários
-- individuais não são retornados por esta função.
create or replace function public.get_strategy_people_cost_summary(
  p_competence date,
  p_squad_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy aggregate access denied' using errcode = '42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'competence', to_char(date_trunc('month', p_competence)::date, 'YYYY-MM'),
    'squad_code', coalesce(nullif(upper(trim(p_squad_code)), ''), 'ALL'),
    'people_count', count(distinct sec.person_id),
    'fte', coalesce(round(sum(sec.fte)::numeric, 2), 0),
    'salary', coalesce(round(sum(sec.salary * sec.fte)::numeric, 2), 0),
    'employer_charges', coalesce(round(sum(sec.employer_charges * sec.fte)::numeric, 2), 0),
    'benefits', coalesce(round(sum(sec.benefits * sec.fte)::numeric, 2), 0),
    'variable_pay', coalesce(round(sum(sec.variable_pay * sec.fte)::numeric, 2), 0),
    'overtime', coalesce(round(sum(sec.overtime * sec.fte)::numeric, 2), 0),
    'other_costs', coalesce(round(sum(sec.other_costs * sec.fte)::numeric, 2), 0),
    'total_cost', coalesce(round(sum(sec.total_cost)::numeric, 2), 0)
  ) into v_result
  from public.strategy_employee_costs sec
  join public.strategy_competences sc on sc.id = sec.competence_id
  where sec.organization_id = v_org
    and sc.organization_id = v_org
    and sc.competence = date_trunc('month', p_competence)::date
    and (
      p_squad_code is null
      or trim(p_squad_code) = ''
      or upper(trim(p_squad_code)) = 'ALL'
      or upper(coalesce(sec.squad_code_snapshot, '')) = upper(trim(p_squad_code))
    );

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

revoke all on function public.get_strategy_people_cost_summary(date,text) from public;
grant execute on function public.get_strategy_people_cost_summary(date,text) to authenticated;

notify pgrst, 'reload schema';

commit;
