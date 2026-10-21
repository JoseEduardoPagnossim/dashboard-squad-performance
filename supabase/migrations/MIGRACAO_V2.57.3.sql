-- Soften Performance Hub V2.57.3
-- Gestão Estratégica: custos operacionais e rateios por Squad.
-- Não altera tabelas operacionais. Rateios ficam fotografados na competência.

begin;

create table if not exists public.strategy_operational_costs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  description text not null,
  category text not null default 'other' check (category in ('technology','communication','infrastructure','third_party','training','other')),
  subcategory text,
  amount numeric(14,2) not null check (amount > 0),
  scope_type text not null default 'organization' check (scope_type in ('organization','squad')),
  squad_code text,
  allocation_method text not null check (allocation_method in ('direct','headcount','attendance','manual')),
  recurring boolean not null default false,
  source text not null default 'manual' check (source in ('manual','csv','api')),
  source_reference text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((allocation_method = 'direct' and scope_type = 'squad' and nullif(btrim(squad_code), '') is not null) or allocation_method <> 'direct')
);

create table if not exists public.strategy_cost_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operational_cost_id uuid not null references public.strategy_operational_costs(id) on delete cascade,
  squad_code text not null,
  percentage numeric(9,4) not null check (percentage > 0 and percentage <= 100),
  basis_value numeric(18,4) not null default 0 check (basis_value >= 0),
  basis_total numeric(18,4) not null default 0 check (basis_total >= 0),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, operational_cost_id, squad_code)
);

create index if not exists idx_strategy_operational_costs_competence on public.strategy_operational_costs(competence_id);
create index if not exists idx_strategy_operational_costs_org_category on public.strategy_operational_costs(organization_id, category);
create index if not exists idx_strategy_cost_allocations_cost on public.strategy_cost_allocations(operational_cost_id);
create index if not exists idx_strategy_cost_allocations_org_squad on public.strategy_cost_allocations(organization_id, squad_code);

alter table public.strategy_operational_costs enable row level security;
alter table public.strategy_cost_allocations enable row level security;

-- Linhas detalhadas de custo operacional e seus rateios ficam disponíveis
-- somente para quem pode editar custos. Usuários de Diretoria recebem apenas
-- os consolidados pelas RPCs abaixo.
drop policy if exists strategy_operational_costs_select on public.strategy_operational_costs;
create policy strategy_operational_costs_select on public.strategy_operational_costs
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_operational_costs_insert on public.strategy_operational_costs;
create policy strategy_operational_costs_insert on public.strategy_operational_costs
for insert to authenticated
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_operational_costs_update on public.strategy_operational_costs;
create policy strategy_operational_costs_update on public.strategy_operational_costs
for update to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
)
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_operational_costs_delete on public.strategy_operational_costs;
create policy strategy_operational_costs_delete on public.strategy_operational_costs
for delete to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_cost_allocations_select on public.strategy_cost_allocations;
create policy strategy_cost_allocations_select on public.strategy_cost_allocations
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_cost_allocations_insert on public.strategy_cost_allocations;
create policy strategy_cost_allocations_insert on public.strategy_cost_allocations
for insert to authenticated
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_cost_allocations_update on public.strategy_cost_allocations;
create policy strategy_cost_allocations_update on public.strategy_cost_allocations
for update to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
)
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

drop policy if exists strategy_cost_allocations_delete on public.strategy_cost_allocations;
create policy strategy_cost_allocations_delete on public.strategy_cost_allocations
for delete to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('edit_costs')
);

grant select, insert, update, delete on public.strategy_operational_costs to authenticated;
grant select, insert, update, delete on public.strategy_cost_allocations to authenticated;

-- Consolida custos operacionais sem expor descrição, fornecedor ou linha individual.
create or replace function public.get_strategy_operational_cost_summary(
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

  with rows as (
    select
      soc.id,
      soc.category,
      soc.allocation_method,
      soc.amount,
      sca.squad_code,
      sca.percentage,
      round((soc.amount * sca.percentage / 100.0)::numeric, 2) as allocated_amount
    from public.strategy_operational_costs soc
    join public.strategy_competences sc on sc.id = soc.competence_id
    join public.strategy_cost_allocations sca
      on sca.operational_cost_id = soc.id
     and sca.organization_id = soc.organization_id
    where soc.organization_id = v_org
      and sc.organization_id = v_org
      and sc.competence = date_trunc('month', p_competence)::date
      and (
        p_squad_code is null
        or trim(p_squad_code) = ''
        or upper(trim(p_squad_code)) = 'ALL'
        or upper(sca.squad_code) = upper(trim(p_squad_code))
      )
  ), category_rows as (
    select category, round(sum(allocated_amount)::numeric, 2) as amount
    from rows
    group by category
  ), invalid_rows as (
    select soc.id
    from public.strategy_operational_costs soc
    join public.strategy_competences sc on sc.id = soc.competence_id
    left join public.strategy_cost_allocations sca
      on sca.operational_cost_id = soc.id
     and sca.organization_id = soc.organization_id
    where soc.organization_id = v_org
      and sc.organization_id = v_org
      and sc.competence = date_trunc('month', p_competence)::date
    group by soc.id
    having abs(coalesce(sum(sca.percentage),0) - 100) > 0.01
  )
  select jsonb_build_object(
    'competence', to_char(date_trunc('month', p_competence)::date, 'YYYY-MM'),
    'squad_code', coalesce(nullif(upper(trim(p_squad_code)), ''), 'ALL'),
    'cost_count', (select count(distinct id) from rows),
    'operational_cost', coalesce((select round(sum(allocated_amount)::numeric,2) from rows),0),
    'direct_cost', coalesce((select round(sum(allocated_amount)::numeric,2) from rows where allocation_method='direct'),0),
    'shared_cost', coalesce((select round(sum(allocated_amount)::numeric,2) from rows where allocation_method<>'direct'),0),
    'invalid_cost_count', (select count(*) from invalid_rows),
    'categories', coalesce((select jsonb_object_agg(category, amount) from category_rows),'{}'::jsonb)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

revoke all on function public.get_strategy_operational_cost_summary(date,text) from public;
grant execute on function public.get_strategy_operational_cost_summary(date,text) to authenticated;

-- Base agregada usada pelo editor para fotografar rateios automáticos.
-- Não retorna salário individual; somente FTE e atendimentos consolidados por Squad.
create or replace function public.get_strategy_allocation_basis(
  p_competence date
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
  if not public.has_strategy_access('edit_costs') then
    raise exception 'strategy cost edit access denied' using errcode = '42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode = '42501';
  end if;

  with active_squads as (
    select s.code
    from public.squads s
    where s.organization_id = v_org and s.active = true
  ), fte as (
    select upper(coalesce(sec.squad_code_snapshot,'')) as squad_code, coalesce(sum(sec.fte),0)::numeric as fte
    from public.strategy_employee_costs sec
    join public.strategy_competences sc on sc.id = sec.competence_id
    where sec.organization_id = v_org
      and sc.organization_id = v_org
      and sc.competence = date_trunc('month', p_competence)::date
      and nullif(btrim(sec.squad_code_snapshot),'') is not null
    group by upper(sec.squad_code_snapshot)
  ), attendance as (
    select upper(s.code) as squad_code, coalesce(sum(tm.att),0)::numeric as attendance
    from public.squads s
    join public.squad_months sm on sm.squad_id = s.id
    left join public.technician_monthly tm on tm.squad_month_id = sm.id
    where s.organization_id = v_org
      and s.active = true
      and sm.year = extract(year from p_competence)::integer
      and sm.month = extract(month from p_competence)::integer
    group by upper(s.code)
  )
  select jsonb_build_object(
    'competence', to_char(date_trunc('month', p_competence)::date, 'YYYY-MM'),
    'rows', coalesce(jsonb_agg(jsonb_build_object(
      'squad_code', upper(s.code),
      'fte', coalesce(f.fte,0),
      'attendance', coalesce(a.attendance,0)
    ) order by s.code), '[]'::jsonb)
  ) into v_result
  from active_squads s
  left join fte f on f.squad_code = upper(s.code)
  left join attendance a on a.squad_code = upper(s.code);

  return coalesce(v_result, jsonb_build_object('competence',to_char(date_trunc('month', p_competence)::date,'YYYY-MM'),'rows','[]'::jsonb));
end;
$$;

revoke all on function public.get_strategy_allocation_basis(date) from public;
grant execute on function public.get_strategy_allocation_basis(date) to authenticated;


-- Grava custo + rateio em uma única transação para evitar linhas parcialmente
-- atualizadas quando o navegador falha entre duas operações.
create or replace function public.save_strategy_operational_cost(
  p_cost_id uuid,
  p_competence date,
  p_description text,
  p_category text,
  p_subcategory text,
  p_amount numeric,
  p_allocation_method text,
  p_squad_code text,
  p_recurring boolean,
  p_allocations jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_competence_id uuid;
  v_cost_id uuid;
  v_sum numeric;
  v_status text;
begin
  if not public.has_strategy_access('edit_costs') then
    raise exception 'strategy cost edit access denied' using errcode = '42501';
  end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode = '42501'; end if;
  if nullif(btrim(p_description),'') is null then raise exception 'cost description required'; end if;
  if coalesce(p_amount,0) <= 0 then raise exception 'cost amount must be greater than zero'; end if;
  if p_category not in ('technology','communication','infrastructure','third_party','training','other') then raise exception 'invalid operational cost category'; end if;
  if p_allocation_method not in ('direct','headcount','attendance','manual') then raise exception 'invalid allocation method'; end if;
  if p_allocation_method='direct' and nullif(btrim(p_squad_code),'') is null then raise exception 'direct cost requires squad'; end if;
  if jsonb_typeof(coalesce(p_allocations,'[]'::jsonb)) <> 'array' then raise exception 'allocations must be an array'; end if;

  select sc.id,sc.status into v_competence_id,v_status
  from public.strategy_competences sc
  where sc.organization_id=v_org and sc.competence=date_trunc('month',p_competence)::date;
  if v_competence_id is null then raise exception 'strategy competence not found'; end if;
  if v_status='closed' then raise exception 'closed strategy competence cannot be edited'; end if;

  select coalesce(sum((item->>'percentage')::numeric),0) into v_sum
  from jsonb_array_elements(coalesce(p_allocations,'[]'::jsonb)) item;
  if abs(v_sum-100) > 0.01 then raise exception 'allocation percentage must total 100'; end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_allocations,'[]'::jsonb)) item
    left join public.squads s on s.organization_id=v_org and s.active=true and upper(s.code)=upper(item->>'squad_code')
    where s.id is null or coalesce((item->>'percentage')::numeric,0) <= 0
  ) then raise exception 'invalid allocation squad or percentage'; end if;

  if p_cost_id is null then
    insert into public.strategy_operational_costs(
      organization_id,competence_id,description,category,subcategory,amount,scope_type,squad_code,allocation_method,recurring,source,created_by,updated_by,updated_at
    ) values (
      v_org,v_competence_id,btrim(p_description),p_category,nullif(btrim(p_subcategory),''),round(p_amount::numeric,2),case when p_allocation_method='direct' then 'squad' else 'organization' end,case when p_allocation_method='direct' then upper(btrim(p_squad_code)) else null end,p_allocation_method,coalesce(p_recurring,false),'manual',auth.uid(),auth.uid(),now()
    ) returning id into v_cost_id;
  else
    update public.strategy_operational_costs set
      description=btrim(p_description),category=p_category,subcategory=nullif(btrim(p_subcategory),''),amount=round(p_amount::numeric,2),scope_type=case when p_allocation_method='direct' then 'squad' else 'organization' end,squad_code=case when p_allocation_method='direct' then upper(btrim(p_squad_code)) else null end,allocation_method=p_allocation_method,recurring=coalesce(p_recurring,false),updated_by=auth.uid(),updated_at=now()
    where id=p_cost_id and organization_id=v_org and competence_id=v_competence_id
    returning id into v_cost_id;
    if v_cost_id is null then raise exception 'operational cost not found'; end if;
    delete from public.strategy_cost_allocations where organization_id=v_org and operational_cost_id=v_cost_id;
  end if;

  insert into public.strategy_cost_allocations(organization_id,operational_cost_id,squad_code,percentage,basis_value,basis_total,created_by,updated_by,updated_at)
  select v_org,v_cost_id,upper(btrim(item->>'squad_code')),round((item->>'percentage')::numeric,4),coalesce((item->>'basis_value')::numeric,0),coalesce((item->>'basis_total')::numeric,0),auth.uid(),auth.uid(),now()
  from jsonb_array_elements(coalesce(p_allocations,'[]'::jsonb)) item;

  return v_cost_id;
end;
$$;

revoke all on function public.save_strategy_operational_cost(uuid,date,text,text,text,numeric,text,text,boolean,jsonb) from public;
grant execute on function public.save_strategy_operational_cost(uuid,date,text,text,text,numeric,text,text,boolean,jsonb) to authenticated;

create or replace function public.delete_strategy_operational_cost(p_cost_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status text;
begin
  if not public.has_strategy_access('edit_costs') then raise exception 'strategy cost edit access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id into v_org;
  select sc.status into v_status
  from public.strategy_operational_costs soc join public.strategy_competences sc on sc.id=soc.competence_id
  where soc.id=p_cost_id and soc.organization_id=v_org;
  if v_status is null then return false; end if;
  if v_status='closed' then raise exception 'closed strategy competence cannot be edited'; end if;
  delete from public.strategy_operational_costs where id=p_cost_id and organization_id=v_org;
  return found;
end;
$$;

revoke all on function public.delete_strategy_operational_cost(uuid) from public;
grant execute on function public.delete_strategy_operational_cost(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
