-- SOFTEN PERFORMANCE HUB V2.42.0
-- Avatar otimizado de usuario via Supabase Storage.
-- A navegacao retratil usa ui_preferences existente e nao precisa de novas colunas.

alter table public.profiles
  add column if not exists avatar_path text;

comment on column public.profiles.avatar_path is
'Caminho privado do avatar WebP no bucket user-avatars. A imagem e redimensionada no navegador antes do upload.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  false,
  131072,
  array['image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.save_my_avatar_path(p_avatar_path text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_expected text;
begin
  if v_user is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  select organization_id
    into v_org
    from public.profiles
   where user_id = v_user
     and active = true
   limit 1;

  if v_org is null then
    raise exception 'Perfil ativo nao encontrado.';
  end if;

  v_expected := v_org::text || '/' || v_user::text || '.webp';

  if p_avatar_path is not null and p_avatar_path <> v_expected then
    raise exception 'Caminho de avatar invalido.';
  end if;

  update public.profiles
     set avatar_path = p_avatar_path,
         updated_at = now()
   where user_id = v_user
     and active = true;

  if not found then
    raise exception 'Perfil ativo nao encontrado.';
  end if;

  return p_avatar_path;
end;
$$;

revoke all on function public.save_my_avatar_path(text) from public;
grant execute on function public.save_my_avatar_path(text) to authenticated;

-- Leitura: qualquer usuario autenticado da organizacao pode assinar a imagem.
-- Isso permite evoluir futuramente para fotos em feedbacks/rankings sem tornar o bucket publico.
drop policy if exists user_avatars_select_org on storage.objects;
create policy user_avatars_select_org
on storage.objects
for select
to authenticated
using (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = (
    select p.organization_id::text
      from public.profiles p
     where p.user_id = (select auth.uid())
       and p.active = true
     limit 1
  )
);

-- Escrita/exclusao: cada usuario so pode manter o proprio arquivo canonico.
drop policy if exists user_avatars_insert_own on storage.objects;
create policy user_avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-avatars'
  and name = (
    select p.organization_id::text || '/' || p.user_id::text || '.webp'
      from public.profiles p
     where p.user_id = (select auth.uid())
       and p.active = true
     limit 1
  )
);

drop policy if exists user_avatars_update_own on storage.objects;
create policy user_avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'user-avatars'
  and name = (
    select p.organization_id::text || '/' || p.user_id::text || '.webp'
      from public.profiles p
     where p.user_id = (select auth.uid())
       and p.active = true
     limit 1
  )
)
with check (
  bucket_id = 'user-avatars'
  and name = (
    select p.organization_id::text || '/' || p.user_id::text || '.webp'
      from public.profiles p
     where p.user_id = (select auth.uid())
       and p.active = true
     limit 1
  )
);

drop policy if exists user_avatars_delete_own on storage.objects;
create policy user_avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-avatars'
  and name = (
    select p.organization_id::text || '/' || p.user_id::text || '.webp'
      from public.profiles p
     where p.user_id = (select auth.uid())
       and p.active = true
     limit 1
  )
);
