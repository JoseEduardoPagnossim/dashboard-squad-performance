-- Soften Performance Hub V2.57.0
-- Fundação da Gestão Estratégica: autorização independente do operacional.
-- Ainda não cria tabelas de salário/custos. Elas entram nas próximas etapas.

begin;

create table if not exists public.strategy_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  can_view_strategy boolean not null default false,
  can_view_aggregates boolean not null default false,
  can_view_people_costs boolean not null default false,
  can_edit_costs boolean not null default false,
  can_close_competence boolean not null default false,
  can_manage_access boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_strategy_access_user on public.strategy_access(user_id);
create index if not exists idx_strategy_access_org on public.strategy_access(organization_id);

-- Helper SECURITY DEFINER para que as policies não precisem consultar a própria
-- tabela strategy_access diretamente (o que causaria recursão de RLS).
create or replace function public.has_strategy_access(p_capability text default 'view')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.strategy_access sa
    join public.profiles p on p.user_id = (select auth.uid())
    where sa.user_id = (select auth.uid())
      and sa.organization_id = p.organization_id
      and p.active = true
      and case lower(coalesce(p_capability,'view'))
        when 'view' then sa.can_view_strategy
        when 'aggregates' then sa.can_view_strategy and sa.can_view_aggregates
        when 'people_costs' then sa.can_view_strategy and sa.can_view_people_costs
        when 'edit_costs' then sa.can_view_strategy and sa.can_edit_costs
        when 'close_competence' then sa.can_view_strategy and sa.can_close_competence
        when 'manage_access' then sa.can_view_strategy and sa.can_manage_access
        else false
      end
  );
$$;

revoke all on function public.has_strategy_access(text) from public;
grant execute on function public.has_strategy_access(text) to authenticated;

alter table public.strategy_access enable row level security;

drop policy if exists strategy_access_select on public.strategy_access;
create policy strategy_access_select on public.strategy_access
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and (
    user_id = (select auth.uid())
    or public.has_strategy_access('manage_access')
  )
);

drop policy if exists strategy_access_insert on public.strategy_access;
create policy strategy_access_insert on public.strategy_access
for insert to authenticated
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('manage_access')
);

drop policy if exists strategy_access_update on public.strategy_access;
create policy strategy_access_update on public.strategy_access
for update to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('manage_access')
)
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('manage_access')
);

drop policy if exists strategy_access_delete on public.strategy_access;
create policy strategy_access_delete on public.strategy_access
for delete to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.has_strategy_access('manage_access')
);

grant select, insert, update, delete on table public.strategy_access to authenticated;

-- Bootstrap conservador: administradores atuais ganham acesso à fundação e agregados,
-- mas NÃO recebem acesso a custos individuais, edição ou fechamento de competência.
-- can_manage_access permite que esses administradores deleguem o acesso estratégico
-- posteriormente sem transformar o papel super_admin em permissão financeira implícita.
insert into public.strategy_access (
  organization_id,
  user_id,
  can_view_strategy,
  can_view_aggregates,
  can_view_people_costs,
  can_edit_costs,
  can_close_competence,
  can_manage_access
)
select
  p.organization_id,
  p.user_id,
  true,
  true,
  false,
  false,
  false,
  true
from public.profiles p
where p.active = true
  and p.role = 'super_admin'
on conflict (organization_id, user_id) do nothing;

notify pgrst, 'reload schema';

commit;
