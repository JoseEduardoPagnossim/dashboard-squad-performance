-- Soften Performance Hub V2.57.1
-- Controle explícito do acesso à Gestão Estratégica pelo Super Admin.
-- O acesso passa a ser opt-in: sem checkbox marcado, o usuário não vê a área.

begin;

-- O próprio usuário continua podendo consultar seu registro de acesso.
-- Somente Super Admin pode consultar/administrar acessos de terceiros,
-- independentemente de possuir ou não acesso à Gestão Estratégica.
drop policy if exists strategy_access_select on public.strategy_access;
create policy strategy_access_select on public.strategy_access
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and (
    user_id = (select auth.uid())
    or public.is_super_admin()
  )
);

drop policy if exists strategy_access_insert on public.strategy_access;
create policy strategy_access_insert on public.strategy_access
for insert to authenticated
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.is_super_admin()
);

drop policy if exists strategy_access_update on public.strategy_access;
create policy strategy_access_update on public.strategy_access
for update to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.is_super_admin()
)
with check (
  organization_id = (select (public.current_profile()).organization_id)
  and public.is_super_admin()
);

drop policy if exists strategy_access_delete on public.strategy_access;
create policy strategy_access_delete on public.strategy_access
for delete to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and public.is_super_admin()
);

-- A V2.57.0 fez bootstrap automático dos super_admins com esta combinação.
-- Revoga somente esse padrão automático para que a nova regra seja realmente opt-in.
update public.strategy_access sa
set
  can_view_strategy = false,
  can_view_aggregates = false,
  can_view_people_costs = false,
  can_edit_costs = false,
  can_close_competence = false,
  can_manage_access = false,
  updated_at = now()
where sa.can_view_strategy = true
  and sa.can_view_aggregates = true
  and sa.can_view_people_costs = false
  and sa.can_edit_costs = false
  and sa.can_close_competence = false
  and sa.can_manage_access = true
  and exists (
    select 1
    from public.profiles p
    where p.organization_id = sa.organization_id
      and p.user_id = sa.user_id
      and p.active = true
      and p.role = 'super_admin'
  );

notify pgrst, 'reload schema';

commit;
