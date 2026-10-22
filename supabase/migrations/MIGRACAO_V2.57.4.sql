-- Soften Performance Hub V2.57.4
-- Motor financeiro estratégico + custos operacionais + consolidação por Squad.
-- Também alinha o checkbox "Acesso à Gestão Estratégica" ao MVP atual:
-- marcado = visualizar agregados + consultar custos pessoais + editar custos.

begin;

-- Corrige os usuários que já estavam com o checkbox estratégico marcado.
update public.strategy_access
set
  can_view_aggregates = true,
  can_view_people_costs = true,
  can_edit_costs = true,
  updated_at = now()
where can_view_strategy = true;

create table if not exists public.strategy_operational_costs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  description text not null,
  category text not null default 'Outros',
  amount numeric(14,2) not null default 0 check (amount >= 0),
  scope_type text not null default 'organization' check (scope_type in ('organization','squad')),
  squad_code text,
  allocation_method text not null default 'fte' check (allocation_method in ('direct','fte','attendance','manual')),
  recurring boolean not null default false,
  source text not null default 'manual' check (source in ('manual','csv','api')),
  source_reference text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope_type = 'organization') or (scope_type = 'squad' and nullif(trim(squad_code),'') is not null))
);

create table if not exists public.strategy_cost_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operational_cost_id uuid not null references public.strategy_operational_costs(id) on delete cascade,
  squad_code text not null,
  allocation_method_snapshot text not null,
  basis_value numeric(18,4) not null default 0 check (basis_value >= 0),
  percentage numeric(10,8) not null default 0 check (percentage >= 0 and percentage <= 1),
  allocated_amount numeric(14,2) not null default 0 check (allocated_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operational_cost_id, squad_code)
);

create index if not exists idx_strategy_operational_costs_competence on public.strategy_operational_costs(competence_id);
create index if not exists idx_strategy_operational_costs_org on public.strategy_operational_costs(organization_id);
create index if not exists idx_strategy_cost_allocations_cost on public.strategy_cost_allocations(operational_cost_id);
create index if not exists idx_strategy_cost_allocations_squad on public.strategy_cost_allocations(organization_id, squad_code);

alter table public.strategy_operational_costs enable row level security;
alter table public.strategy_cost_allocations enable row level security;

-- O detalhe operacional segue protegido: o checkbox estratégico do MVP agora
-- concede can_edit_costs, mas a policy continua granular para evolução futura.
drop policy if exists strategy_operational_costs_select on public.strategy_operational_costs;
create policy strategy_operational_costs_select on public.strategy_operational_costs for select to authenticated
using (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_operational_costs_insert on public.strategy_operational_costs;
create policy strategy_operational_costs_insert on public.strategy_operational_costs for insert to authenticated
with check (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_operational_costs_update on public.strategy_operational_costs;
create policy strategy_operational_costs_update on public.strategy_operational_costs for update to authenticated
using (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'))
with check (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_operational_costs_delete on public.strategy_operational_costs;
create policy strategy_operational_costs_delete on public.strategy_operational_costs for delete to authenticated
using (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));

drop policy if exists strategy_cost_allocations_select on public.strategy_cost_allocations;
create policy strategy_cost_allocations_select on public.strategy_cost_allocations for select to authenticated
using (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_cost_allocations_insert on public.strategy_cost_allocations;
create policy strategy_cost_allocations_insert on public.strategy_cost_allocations for insert to authenticated
with check (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_cost_allocations_update on public.strategy_cost_allocations;
create policy strategy_cost_allocations_update on public.strategy_cost_allocations for update to authenticated
using (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'))
with check (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_cost_allocations_delete on public.strategy_cost_allocations;
create policy strategy_cost_allocations_delete on public.strategy_cost_allocations for delete to authenticated
using (organization_id = (select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));

grant select, insert, update, delete on public.strategy_operational_costs to authenticated;
grant select, insert, update, delete on public.strategy_cost_allocations to authenticated;

create or replace function public.get_strategy_financial_summary(p_competence date,p_squad_code text default null)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_org uuid; v_all boolean; v_code text; v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then raise exception 'strategy aggregate access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  v_code := upper(trim(coalesce(p_squad_code,''))); v_all := v_code='' or v_code='ALL';
  with comp as (
    select id from public.strategy_competences where organization_id=v_org and competence=date_trunc('month',p_competence)::date limit 1
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
  )
  select jsonb_build_object('competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),'squad_code',case when v_all then 'ALL' else v_code end,
    'people_count',people.people_count,'fte',people.fte,'salary',people.salary,'employer_charges',people.employer_charges,'benefits',people.benefits,'variable_pay',people.variable_pay,'overtime',people.overtime,'other_costs',people.other_costs,'people_cost',people.people_cost,'operational_cost',op.operational_cost,'unallocated_operational_cost',op.unallocated_operational_cost,'total_cost',round((people.people_cost+op.operational_cost)::numeric,2)) into v_result from people cross join op;
  return coalesce(v_result,'{}'::jsonb);
end;$$;
revoke all on function public.get_strategy_financial_summary(date,text) from public;
grant execute on function public.get_strategy_financial_summary(date,text) to authenticated;

create or replace function public.get_strategy_squad_cost_summary(p_competence date)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_org uuid; v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then raise exception 'strategy aggregate access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id into v_org;
  with comp as (select id from public.strategy_competences where organization_id=v_org and competence=date_trunc('month',p_competence)::date limit 1),
  p as (select upper(coalesce(sec.squad_code_snapshot,'')) squad_code,count(distinct sec.person_id) people_count,coalesce(round(sum(sec.fte)::numeric,2),0) fte,coalesce(round(sum(sec.total_cost)::numeric,2),0) people_cost from public.strategy_employee_costs sec join comp c on c.id=sec.competence_id where sec.organization_id=v_org and nullif(trim(sec.squad_code_snapshot),'') is not null group by 1),
  o as (select upper(sca.squad_code) squad_code,coalesce(round(sum(sca.allocated_amount)::numeric,2),0) operational_cost from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id join comp c on c.id=soc.competence_id where sca.organization_id=v_org and upper(sca.squad_code)<>'UNALLOCATED' group by 1),
  codes as (select squad_code from p union select squad_code from o)
  select coalesce(jsonb_agg(jsonb_build_object('squad_code',codes.squad_code,'people_count',coalesce(p.people_count,0),'fte',coalesce(p.fte,0),'people_cost',coalesce(p.people_cost,0),'operational_cost',coalesce(o.operational_cost,0),'total_cost',coalesce(p.people_cost,0)+coalesce(o.operational_cost,0)) order by codes.squad_code),'[]'::jsonb) into v_result from codes left join p using(squad_code) left join o using(squad_code);
  return coalesce(v_result,'[]'::jsonb);
end;$$;
revoke all on function public.get_strategy_squad_cost_summary(date) from public;
grant execute on function public.get_strategy_squad_cost_summary(date) to authenticated;

notify pgrst,'reload schema';
commit;
