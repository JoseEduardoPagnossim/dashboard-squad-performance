-- SOFTEN PERFORMANCE HUB V2.29.8
-- Auditoria administrativa imutável e rastreabilidade das operações críticas.
-- Execute uma única vez no SQL Editor do Supabase antes de usar a tela Auditoria.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid references public.squads(id) on delete set null,
  actor_user_id uuid,
  actor_name text not null,
  actor_email text,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  description text,
  before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);
create index if not exists idx_audit_logs_squad_created on public.audit_logs(squad_id, created_at desc);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.organization_id = audit_logs.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and audit_logs.squad_id = p.squad_id)
      )
  )
);

-- Não existe policy de INSERT/UPDATE/DELETE para o cliente.
-- Toda inclusão passa pela função abaixo, que deriva o ator da sessão autenticada.
revoke insert, update, delete on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_squad_id uuid default null,
  p_description text default null,
  p_before_data jsonb default '{}'::jsonb,
  p_after_data jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  result_id uuid;
begin
  select p.* into actor
  from public.profiles p
  where p.user_id = auth.uid()
    and p.active = true
  limit 1;

  if actor.user_id is null or actor.role not in ('super_admin','squad_admin') then
    raise exception 'Sem permissão para registrar auditoria.' using errcode = '42501';
  end if;

  if coalesce(trim(p_action),'') = '' or coalesce(trim(p_entity_type),'') = '' then
    raise exception 'Ação e tipo da entidade são obrigatórios.' using errcode = '22023';
  end if;

  if actor.role = 'squad_admin' then
    if p_squad_id is null or p_squad_id <> actor.squad_id then
      raise exception 'Admin do Squad só pode auditar ações do próprio Squad.' using errcode = '42501';
    end if;
  elsif p_squad_id is not null and not exists (
    select 1 from public.squads s
    where s.id = p_squad_id and s.organization_id = actor.organization_id
  ) then
    raise exception 'Squad fora da organização do usuário.' using errcode = '42501';
  end if;

  insert into public.audit_logs (
    organization_id,squad_id,actor_user_id,actor_name,actor_email,actor_role,
    action,entity_type,entity_id,description,before_data,after_data,metadata
  ) values (
    actor.organization_id,p_squad_id,actor.user_id,actor.full_name,actor.email,actor.role,
    trim(p_action),trim(p_entity_type),nullif(trim(coalesce(p_entity_id,'')),''),
    nullif(trim(coalesce(p_description,'')),''),
    coalesce(p_before_data,'{}'::jsonb),coalesce(p_after_data,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb)
  ) returning id into result_id;

  return result_id;
end;
$$;

revoke all on function public.log_audit_event(text,text,text,uuid,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.log_audit_event(text,text,text,uuid,text,jsonb,jsonb,jsonb) to authenticated;
