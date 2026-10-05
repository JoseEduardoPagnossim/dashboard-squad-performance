-- SOFTEN PERFORMANCE HUB V2.46.0
-- Central de Alertas + notificacoes internas por publico e leitura individual.
-- Revisao: corrigido fechamento das expressoes RLS da V2.46.0.

begin;

create table if not exists public.internal_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('critical','warning','info','success')),
  category text not null default 'announcement' check (category in ('announcement','operation','performance','feedback','system')),
  audience_type text not null default 'all' check (audience_type in ('all','admins','technicians','squad')),
  squad_id uuid references public.squads(id) on delete cascade,
  action_view text,
  action_section text,
  action_label text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_notifications_title_check check (char_length(trim(title)) between 1 and 120),
  constraint internal_notifications_message_check check (char_length(trim(message)) between 1 and 1200),
  constraint internal_notifications_audience_squad_check check (audience_type <> 'squad' or squad_id is not null),
  constraint internal_notifications_window_check check (expires_at is null or expires_at > starts_at)
);

create index if not exists idx_internal_notifications_org_active
  on public.internal_notifications(organization_id, active, starts_at desc);
create index if not exists idx_internal_notifications_org_created
  on public.internal_notifications(organization_id, created_at desc);
create index if not exists idx_internal_notifications_squad
  on public.internal_notifications(squad_id, created_at desc);

create table if not exists public.internal_notification_reads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  notification_id uuid not null references public.internal_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint internal_notification_reads_unique unique (notification_id, user_id)
);

create index if not exists idx_internal_notification_reads_user
  on public.internal_notification_reads(user_id, read_at desc);
create index if not exists idx_internal_notification_reads_notification
  on public.internal_notification_reads(notification_id);

alter table public.internal_notifications enable row level security;
alter table public.internal_notification_reads enable row level security;

-- Administradores podem consultar e administrar todas as notificacoes da organizacao.
-- Tecnicos recebem apenas itens ativos/validos destinados a todos, tecnicos ou ao proprio Squad.
drop policy if exists internal_notifications_select on public.internal_notifications;
create policy internal_notifications_select on public.internal_notifications
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
  and (
    public.is_super_admin()
    or (
      (select (public.current_profile()).role) = 'technician'
      and active = true
      and starts_at <= now()
      and (expires_at is null or expires_at > now())
      and (
        audience_type in ('all','technicians')
        or (audience_type = 'squad' and squad_id = (select (public.current_profile()).squad_id))
      )
    )
  )
);

drop policy if exists internal_notifications_insert on public.internal_notifications;
create policy internal_notifications_insert on public.internal_notifications
for insert to authenticated
with check (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
  and (
    audience_type <> 'squad'
    or exists (
      select 1 from public.squads s
      where s.id = squad_id
        and s.organization_id = (select (public.current_profile()).organization_id)
    )
  )
);

drop policy if exists internal_notifications_update on public.internal_notifications;
create policy internal_notifications_update on public.internal_notifications
for update to authenticated
using (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
)
with check (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
  and (
    audience_type <> 'squad'
    or exists (
      select 1 from public.squads s
      where s.id = squad_id
        and s.organization_id = (select (public.current_profile()).organization_id)
    )
  )
);

drop policy if exists internal_notifications_delete on public.internal_notifications;
create policy internal_notifications_delete on public.internal_notifications
for delete to authenticated
using (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
);

-- Cada usuario registra e enxerga apenas as proprias leituras, sempre dentro da organizacao atual.
drop policy if exists internal_notification_reads_select on public.internal_notification_reads;
create policy internal_notification_reads_select on public.internal_notification_reads
for select to authenticated
using (
  user_id = (select auth.uid())
  and organization_id = (select (public.current_profile()).organization_id)
);

drop policy if exists internal_notification_reads_insert on public.internal_notification_reads;
create policy internal_notification_reads_insert on public.internal_notification_reads
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and organization_id = (select (public.current_profile()).organization_id)
  and exists (
    select 1 from public.internal_notifications n
    where n.id = internal_notification_reads.notification_id
      and n.organization_id = internal_notification_reads.organization_id
      and (
        public.is_super_admin()
        or (
          (select (public.current_profile()).role) = 'technician'
          and n.active = true
          and n.starts_at <= now()
          and (n.expires_at is null or n.expires_at > now())
          and (
            n.audience_type in ('all','technicians')
            or (n.audience_type = 'squad' and n.squad_id = (select (public.current_profile()).squad_id))
          )
        )
      )
  )
);

drop policy if exists internal_notification_reads_update on public.internal_notification_reads;
create policy internal_notification_reads_update on public.internal_notification_reads
for update to authenticated
using (
  user_id = (select auth.uid())
  and organization_id = (select (public.current_profile()).organization_id)
)
with check (
  user_id = (select auth.uid())
  and organization_id = (select (public.current_profile()).organization_id)
  and exists (
    select 1 from public.internal_notifications n
    where n.id = internal_notification_reads.notification_id
      and n.organization_id = internal_notification_reads.organization_id
      and (
        public.is_super_admin()
        or (
          (select (public.current_profile()).role) = 'technician'
          and n.active = true
          and n.starts_at <= now()
          and (n.expires_at is null or n.expires_at > now())
          and (
            n.audience_type in ('all','technicians')
            or (n.audience_type = 'squad' and n.squad_id = (select (public.current_profile()).squad_id))
          )
        )
      )
  )
);

drop policy if exists internal_notification_reads_delete on public.internal_notification_reads;
create policy internal_notification_reads_delete on public.internal_notification_reads
for delete to authenticated
using (
  user_id = (select auth.uid())
  and organization_id = (select (public.current_profile()).organization_id)
);

grant select, insert, update, delete on table public.internal_notifications to authenticated;
grant select, insert, update, delete on table public.internal_notification_reads to authenticated;

comment on table public.internal_notifications is 'V2.46: notificacoes internas publicadas no Performance Hub, segmentadas por publico.';
comment on table public.internal_notification_reads is 'V2.46: controle individual de leitura das notificacoes internas.';

commit;
