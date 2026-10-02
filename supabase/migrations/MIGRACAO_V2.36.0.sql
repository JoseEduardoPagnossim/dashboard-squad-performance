-- SOFTEN PERFORMANCE HUB V2.36.0
-- Central de Importacao: historico, snapshot de seguranca e reversao da ultima carga.

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid references public.squads(id) on delete set null,
  kind text not null check (kind in ('service','quality')),
  period text not null,
  file_name text not null,
  checksum text,
  scope_codes text[] not null default '{}',
  valid_rows integer not null default 0 check (valid_rows >= 0),
  ignored_rows integer not null default 0 check (ignored_rows >= 0),
  unmatched_count integer not null default 0 check (unmatched_count >= 0),
  status text not null default 'success' check (status in ('success','failed','reverted')),
  risk_level text not null default 'ok' check (risk_level in ('ok','warning','error')),
  summary jsonb not null default '{}'::jsonb,
  before_snapshot jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text,
  imported_at timestamptz not null default now(),
  reverted_by uuid references auth.users(id) on delete set null,
  reverted_at timestamptz
);

create index if not exists idx_import_batches_org_date on public.import_batches(organization_id, imported_at desc);
create index if not exists idx_import_batches_squad_date on public.import_batches(squad_id, imported_at desc);
create index if not exists idx_import_batches_period on public.import_batches(period, kind);

alter table public.import_batches enable row level security;

drop policy if exists import_batches_select on public.import_batches;
create policy import_batches_select on public.import_batches
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.organization_id = import_batches.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and import_batches.squad_id = p.squad_id)
      )
  )
);

drop policy if exists import_batches_insert on public.import_batches;
create policy import_batches_insert on public.import_batches
for insert to authenticated
with check (
  actor_user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.organization_id = import_batches.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and import_batches.squad_id = p.squad_id)
      )
  )
);

drop policy if exists import_batches_update on public.import_batches;
create policy import_batches_update on public.import_batches
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.organization_id = import_batches.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and import_batches.squad_id = p.squad_id)
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.organization_id = import_batches.organization_id
      and (
        p.role = 'super_admin'
        or (p.role = 'squad_admin' and import_batches.squad_id = p.squad_id)
      )
  )
);

grant select, insert, update on public.import_batches to authenticated;
revoke delete on public.import_batches from anon, authenticated;

comment on table public.import_batches is 'Historico de importacoes CSV com resumo de validacao e snapshot de seguranca para reversao controlada.';
comment on column public.import_batches.before_snapshot is 'Snapshot anterior das competencias tocadas pela importacao. Usado somente para reversao administrativa segura.';
