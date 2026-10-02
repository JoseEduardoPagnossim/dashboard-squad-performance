-- SOFTEN PERFORMANCE HUB V2.38.0
-- Preferências individuais de interface + permissões granulares restritivas.

alter table public.profiles
  add column if not exists permissions jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists ui_preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.permissions is
'Overrides restritivos de permissões da interface. Apenas false remove uma permissão que já pertence ao perfil base; não concede privilégios acima do role.';

comment on column public.profiles.ui_preferences is
'Preferências pessoais do Performance Hub, incluindo layout e densidade dos painéis.';

create or replace function public.save_my_ui_preferences(p_preferences jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_clean jsonb := coalesce(p_preferences, '{}'::jsonb);
begin
  if v_user is null then
    raise exception 'Sessão não encontrada.';
  end if;

  if jsonb_typeof(v_clean) <> 'object' then
    raise exception 'Preferências inválidas.';
  end if;

  update public.profiles
     set ui_preferences = v_clean,
         updated_at = now()
   where user_id = v_user
     and active = true;

  if not found then
    raise exception 'Perfil ativo não encontrado.';
  end if;

  return v_clean;
end;
$$;

revoke all on function public.save_my_ui_preferences(jsonb) from public;
grant execute on function public.save_my_ui_preferences(jsonb) to authenticated;

-- As permissões específicas complementam a segurança existente por role/RLS.
-- O limite máximo de acesso continua sendo super_admin, squad_admin ou technician.
