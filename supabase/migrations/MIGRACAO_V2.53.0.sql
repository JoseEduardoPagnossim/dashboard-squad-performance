-- SOFTEN PERFORMANCE HUB V2.53.0
-- Qualidade Completa: base agregada diaria, sem deduplicacao de clientes.

begin;

create table if not exists public.quality_full_daily (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  squad_id uuid not null references public.squads(id) on delete cascade,
  squad_code text not null check (squad_code in ('A','B','D','E')),
  metric_date date not null,
  service_n1 integer not null default 0 check (service_n1 >= 0),
  service_n2 integer not null default 0 check (service_n2 >= 0),
  service_n3 integer not null default 0 check (service_n3 >= 0),
  service_n4 integer not null default 0 check (service_n4 >= 0),
  service_n5 integer not null default 0 check (service_n5 >= 0),
  product_n1 integer not null default 0 check (product_n1 >= 0),
  product_n2 integer not null default 0 check (product_n2 >= 0),
  product_n3 integer not null default 0 check (product_n3 >= 0),
  product_n4 integer not null default 0 check (product_n4 >= 0),
  product_n5 integer not null default 0 check (product_n5 >= 0),
  company_n1 integer not null default 0 check (company_n1 >= 0),
  company_n2 integer not null default 0 check (company_n2 >= 0),
  company_n3 integer not null default 0 check (company_n3 >= 0),
  company_n4 integer not null default 0 check (company_n4 >= 0),
  company_n5 integer not null default 0 check (company_n5 >= 0),
  source_rows integer not null default 0 check (source_rows >= 0),
  source_file text,
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quality_full_daily_unique unique (organization_id, squad_id, metric_date)
);

create index if not exists idx_quality_full_daily_org_date
  on public.quality_full_daily (organization_id, metric_date);

create index if not exists idx_quality_full_daily_squad_date
  on public.quality_full_daily (squad_id, metric_date);

comment on table public.quality_full_daily is
'V2.53.0: agregacao diaria da Qualidade Completa sem deduplicacao; nenhum cliente ou CNPJ e armazenado.';

alter table public.quality_full_daily enable row level security;

drop policy if exists quality_full_daily_select on public.quality_full_daily;
create policy quality_full_daily_select on public.quality_full_daily
for select to authenticated
using (public.can_read_squad(squad_id));

drop policy if exists quality_full_daily_insert on public.quality_full_daily;
create policy quality_full_daily_insert on public.quality_full_daily
for insert to authenticated
with check (
  public.can_admin_squad(squad_id)
  and imported_by = (select auth.uid())
);

drop policy if exists quality_full_daily_update on public.quality_full_daily;
create policy quality_full_daily_update on public.quality_full_daily
for update to authenticated
using (public.can_admin_squad(squad_id))
with check (public.can_admin_squad(squad_id));

drop policy if exists quality_full_daily_delete on public.quality_full_daily;
create policy quality_full_daily_delete on public.quality_full_daily
for delete to authenticated
using (public.can_admin_squad(squad_id));

grant select, insert, update, delete on public.quality_full_daily to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.import_batches
  drop constraint if exists import_batches_kind_check;

alter table public.import_batches
  add constraint import_batches_kind_check
  check (kind in ('service','quality','quality-full'));

notify pgrst, 'reload schema';

commit;
