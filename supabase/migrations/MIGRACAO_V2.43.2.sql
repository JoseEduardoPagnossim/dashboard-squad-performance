-- SOFTEN PERFORMANCE HUB V2.43.2
-- Simplificacao de perfis: Administrador (super_admin) + Tecnico.
-- O valor squad_admin permanece aceito pelo schema apenas como legado historico,
-- mas deixa de possuir privilegios administrativos e nao e criado pela aplicacao.

begin;

-- Garante a coluna de permissoes usada desde a V2.38 em bases atualizadas fora de ordem.
alter table public.profiles
  add column if not exists permissions jsonb not null default '{}'::jsonb;

-- Converte qualquer Admin de Squad legado para Administrador global.
-- O administrador nao possui vinculo fixo de Squad nem restricoes individuais.
update public.profiles
   set role = 'super_admin',
       squad_id = null,
       technician_name = null,
       permissions = '{}'::jsonb,
       updated_at = now()
 where role = 'squad_admin';

-- A partir desta versao, Administradores sempre possuem acesso integral.
update public.profiles
   set permissions = '{}'::jsonb,
       updated_at = now()
 where role = 'super_admin'
   and coalesce(permissions, '{}'::jsonb) <> '{}'::jsonb;

-- Mantemos o nome da funcao por compatibilidade com as policies existentes,
-- mas somente super_admin pode administrar qualquer Squad.
create or replace function public.can_admin_squad(target_squad uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles p
      join public.squads s on s.id = target_squad
     where p.user_id = (select auth.uid())
       and p.active = true
       and p.organization_id = s.organization_id
       and p.role = 'super_admin'
  );
$$;

revoke all on function public.can_admin_squad(uuid) from public;
grant execute on function public.can_admin_squad(uuid) to authenticated;

comment on function public.can_admin_squad(uuid) is
'V2.43.2: nome mantido por compatibilidade; somente Administradores (super_admin) possuem privilegios administrativos sobre Squads.';

commit;
