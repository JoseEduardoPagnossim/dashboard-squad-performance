-- R30.2: imagem institucional publica separada das imagens dos Squads.
-- Execute apos R30 / R29.2. Dados operacionais nao sao expostos anonimamente.
begin;
create table if not exists public.organization_appearance (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  background_image text,
  updated_at timestamptz not null default now(),
  constraint organization_appearance_image_safe check (
    background_image is null or
    (length(background_image)<=2800000 and background_image ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$')
  )
);
alter table public.organization_appearance enable row level security;
revoke all on public.organization_appearance from anon;
grant select, insert, update on public.organization_appearance to authenticated;
drop policy if exists organization_appearance_select_admin on public.organization_appearance;
create policy organization_appearance_select_admin on public.organization_appearance
for select to authenticated using (
 exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.organization_id=organization_appearance.organization_id and p.active=true and p.role='super_admin')
);
drop policy if exists organization_appearance_insert_admin on public.organization_appearance;
create policy organization_appearance_insert_admin on public.organization_appearance
for insert to authenticated with check (
 exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.organization_id=organization_appearance.organization_id and p.active=true and p.role='super_admin')
);
drop policy if exists organization_appearance_update_admin on public.organization_appearance;
create policy organization_appearance_update_admin on public.organization_appearance
for update to authenticated using (
 exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.organization_id=organization_appearance.organization_id and p.active=true and p.role='super_admin')
) with check (
 exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.organization_id=organization_appearance.organization_id and p.active=true and p.role='super_admin')
);
create or replace function public.get_public_global_background(p_org_slug text default 'soften-sistemas')
returns text language sql stable security definer set search_path=public as $$
 select a.background_image from public.organization_appearance a
 join public.organizations o on o.id=a.organization_id where o.slug=p_org_slug limit 1
$$;
revoke all on function public.get_public_global_background(text) from public;
grant execute on function public.get_public_global_background(text) to anon, authenticated;
comment on function public.get_public_global_background(text) is 'R30.2: somente imagem institucional destinada a exibicao publica; sem perfis, contratos ou metricas.';
commit;
