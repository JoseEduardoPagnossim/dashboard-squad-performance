-- SOFTEN PERFORMANCE HUB V2.40.0
-- TV / Comunicacao: playlists, multiplas TVs e monitoramento por heartbeat.

begin;

create table if not exists public.presentation_playlists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid references public.squads(id) on delete cascade,
  name text not null,
  description text not null default '',
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presentation_playlists_name_check check (char_length(trim(name)) between 1 and 80)
);

create index if not exists idx_presentation_playlists_org on public.presentation_playlists(organization_id, updated_at desc);
create index if not exists idx_presentation_playlists_squad on public.presentation_playlists(squad_id, updated_at desc);

create table if not exists public.presentation_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid references public.squads(id) on delete cascade,
  playlist_id uuid references public.presentation_playlists(id) on delete set null,
  device_key text not null unique,
  name text not null,
  location text not null default '',
  active boolean not null default true,
  last_seen_at timestamptz,
  last_refresh_at timestamptz,
  last_mode text,
  connection_state text not null default 'unknown',
  viewport jsonb not null default '{}'::jsonb,
  app_version text,
  user_agent text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presentation_devices_name_check check (char_length(trim(name)) between 1 and 80),
  constraint presentation_devices_key_check check (char_length(trim(device_key)) between 6 and 120)
);

create index if not exists idx_presentation_devices_org on public.presentation_devices(organization_id, updated_at desc);
create index if not exists idx_presentation_devices_squad on public.presentation_devices(squad_id, updated_at desc);
create index if not exists idx_presentation_devices_playlist on public.presentation_devices(playlist_id);
create index if not exists idx_presentation_devices_seen on public.presentation_devices(organization_id, last_seen_at desc);

alter table public.presentation_playlists enable row level security;
alter table public.presentation_devices enable row level security;

-- Gestores enxergam e administram somente o proprio escopo. Admin geral enxerga a organizacao inteira.
drop policy if exists presentation_playlists_select on public.presentation_playlists;
create policy presentation_playlists_select on public.presentation_playlists
for select to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

drop policy if exists presentation_playlists_insert on public.presentation_playlists;
create policy presentation_playlists_insert on public.presentation_playlists
for insert to authenticated
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

drop policy if exists presentation_playlists_update on public.presentation_playlists;
create policy presentation_playlists_update on public.presentation_playlists
for update to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
)
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

drop policy if exists presentation_playlists_delete on public.presentation_playlists;
create policy presentation_playlists_delete on public.presentation_playlists
for delete to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

drop policy if exists presentation_devices_select on public.presentation_devices;
create policy presentation_devices_select on public.presentation_devices
for select to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

drop policy if exists presentation_devices_insert on public.presentation_devices;
create policy presentation_devices_insert on public.presentation_devices
for insert to authenticated
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

drop policy if exists presentation_devices_update on public.presentation_devices;
create policy presentation_devices_update on public.presentation_devices
for update to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
)
with check (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

drop policy if exists presentation_devices_delete on public.presentation_devices;
create policy presentation_devices_delete on public.presentation_devices
for delete to authenticated
using (
  organization_id=(select (public.current_profile()).organization_id)
  and (public.is_super_admin() or (squad_id is not null and public.can_admin_squad(squad_id)))
);

-- Uma TV direta nao precisa de acesso SELECT administrativo: recebe somente a propria configuracao via RPC.
create or replace function public.get_presentation_device_config(p_device_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  me public.profiles%rowtype;
  d public.presentation_devices%rowtype;
  pl public.presentation_playlists%rowtype;
begin
  select * into me from public.profiles where user_id=(select auth.uid()) and active=true limit 1;
  if me.user_id is null then return null; end if;
  select * into d from public.presentation_devices where device_key=trim(p_device_key) and active=true limit 1;
  if d.id is null or d.organization_id<>me.organization_id then return null; end if;
  if d.playlist_id is not null then select * into pl from public.presentation_playlists where id=d.playlist_id and active=true limit 1; end if;
  return jsonb_build_object(
    'device', jsonb_build_object('id',d.id,'device_key',d.device_key,'name',d.name,'location',d.location,'squad_code',coalesce((select code from public.squads where id=d.squad_id),'all'),'playlist_id',d.playlist_id,'active',d.active,'last_seen_at',d.last_seen_at,'last_refresh_at',d.last_refresh_at,'last_mode',d.last_mode,'connection_state',d.connection_state,'viewport',d.viewport,'app_version',d.app_version),
    'playlist', case when pl.id is null then null else jsonb_build_object('id',pl.id,'name',pl.name,'description',pl.description,'squad',coalesce((select code from public.squads where id=pl.squad_id),'all'),'config',pl.config,'active',pl.active,'updated_at',pl.updated_at) end
  );
end;
$$;

-- Heartbeat com superficie minima: usuario autenticado da mesma organizacao pode apenas atualizar telemetria da TV.
create or replace function public.touch_presentation_device(p_device_key text, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  me public.profiles%rowtype;
  d public.presentation_devices%rowtype;
  refresh_at timestamptz;
begin
  select * into me from public.profiles where user_id=(select auth.uid()) and active=true limit 1;
  if me.user_id is null then return jsonb_build_object('ok',false,'reason','profile'); end if;
  select * into d from public.presentation_devices where device_key=trim(p_device_key) limit 1;
  if d.id is null or d.organization_id<>me.organization_id then return jsonb_build_object('ok',false,'reason','device'); end if;
  if not d.active then return jsonb_build_object('ok',false,'reason','inactive'); end if;
  begin refresh_at=nullif(p_payload->>'last_refresh_at','')::timestamptz; exception when others then refresh_at=null; end;
  update public.presentation_devices set
    last_seen_at=now(),
    last_refresh_at=coalesce(refresh_at,last_refresh_at),
    last_mode=nullif(left(coalesce(p_payload->>'last_mode',''),60),''),
    connection_state=left(coalesce(nullif(p_payload->>'connection_state',''),'online'),30),
    viewport=case when jsonb_typeof(p_payload->'viewport')='object' then p_payload->'viewport' else '{}'::jsonb end,
    app_version=nullif(left(coalesce(p_payload->>'app_version',''),30),''),
    user_agent=nullif(left(coalesce(p_payload->>'user_agent',''),500),''),
    updated_at=now()
  where id=d.id;
  return jsonb_build_object('ok',true,'device_id',d.id,'server_time',now());
end;
$$;

revoke all on function public.get_presentation_device_config(text) from public;
revoke all on function public.touch_presentation_device(text,jsonb) from public;
grant execute on function public.get_presentation_device_config(text) to authenticated;
grant execute on function public.touch_presentation_device(text,jsonb) to authenticated;

grant select,insert,update,delete on public.presentation_playlists to authenticated;
grant select,insert,update,delete on public.presentation_devices to authenticated;

comment on table public.presentation_playlists is 'Playlists nomeadas da Apresentacao/TV do Performance Hub.';
comment on table public.presentation_devices is 'TVs cadastradas e ultimo heartbeat da Apresentacao/TV.';

commit;
