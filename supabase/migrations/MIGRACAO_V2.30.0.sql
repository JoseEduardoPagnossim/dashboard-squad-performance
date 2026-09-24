-- SOFTEN PERFORMANCE HUB V2.30.0
-- Modulo executivo ROI do Suporte Tecnico.
-- Reaproveita support_monthly_costs para custos e premissas mensais e cria somente
-- a tabela de oportunidades de receita adicional, que nao existia no projeto.

begin;

alter table public.support_monthly_costs
  add column if not exists roi_cost_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists roi_avg_ticket numeric(14,2) not null default 0 check (roi_avg_ticket >= 0),
  add column if not exists roi_churn_reference numeric(8,6) not null default 0 check (roi_churn_reference >= 0 and roi_churn_reference <= 1),
  add column if not exists roi_churn_current numeric(8,6) not null default 0 check (roi_churn_current >= 0 and roi_churn_current <= 1),
  add column if not exists roi_portfolio_clients int not null default 0 check (roi_portfolio_clients >= 0),
  add column if not exists roi_served_clients int not null default 0 check (roi_served_clients >= 0),
  add column if not exists roi_active_clients int not null default 0 check (roi_active_clients >= 0),
  add column if not exists roi_client_method text not null default 'active',
  add column if not exists roi_notes text,
  add column if not exists roi_data_origin text not null default 'manual',
  add column if not exists roi_field_origins jsonb not null default '{}'::jsonb,
  add column if not exists roi_source_file text,
  add column if not exists roi_imported_at timestamptz null,
  add column if not exists roi_created_by uuid null references auth.users(id) on delete set null,
  add column if not exists roi_created_at timestamptz null,
  add column if not exists roi_updated_by uuid null references auth.users(id) on delete set null,
  add column if not exists roi_updated_at timestamptz null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'support_monthly_costs_roi_client_method_check'
      and conrelid = 'public.support_monthly_costs'::regclass
  ) then
    alter table public.support_monthly_costs
      add constraint support_monthly_costs_roi_client_method_check
      check (roi_client_method in ('portfolio','served','active'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'support_monthly_costs_roi_data_origin_check'
      and conrelid = 'public.support_monthly_costs'::regclass
  ) then
    alter table public.support_monthly_costs
      add constraint support_monthly_costs_roi_data_origin_check
      check (roi_data_origin in ('manual','imported'));
  end if;
end $$;

comment on column public.support_monthly_costs.roi_cost_breakdown is
'Composicao detalhada do custo para o modulo ROI. Cada chave registra valor, descricao e origem sem substituir o total legado payroll_cost + other_costs.';
comment on column public.support_monthly_costs.roi_avg_ticket is
'Ticket medio mensal usado no ROI quando informado especificamente no modulo. Se zero, o frontend pode reutilizar o parametro ja existente em quality_financial_monthly.';
comment on column public.support_monthly_costs.roi_churn_reference is
'Churn de referencia em formato decimal, por exemplo 0.035 para 3,5%.';
comment on column public.support_monthly_costs.roi_churn_current is
'Churn atual em formato decimal, por exemplo 0.028 para 2,8%.';
comment on column public.support_monthly_costs.roi_client_method is
'Metodologia de clientes usada no custo por cliente e na estimativa de retencao: portfolio, served ou active.';
comment on column public.support_monthly_costs.roi_field_origins is
'Mapa de origem dos campos do ROI: manual ou imported. Dados reaproveitados de outras tabelas sao classificados pelo frontend como automaticos.';

create table if not exists public.support_roi_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_date date not null,
  client_name text not null,
  squad_id uuid null references public.squads(id) on delete set null,
  team_name text,
  technician_user_id uuid null references auth.users(id) on delete set null,
  technician_name text,
  opportunity_type text not null,
  description text,
  potential_value numeric(14,2) not null default 0 check (potential_value >= 0),
  converted_value numeric(14,2) not null default 0 check (converted_value >= 0),
  status text not null default 'pending' check (status in ('pending','converted','lost','canceled')),
  source_origin text not null default 'manual' check (source_origin in ('manual','imported')),
  source_file text,
  source_row int,
  import_key text,
  imported_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_roi_opportunities_import_key_unique unique (organization_id, import_key)
);

-- Mantem a migration idempotente mesmo se a tabela tiver sido criada por uma execucao parcial anterior.
alter table public.support_roi_opportunities
  add column if not exists imported_at timestamptz null;

create index if not exists idx_support_roi_opportunities_period
  on public.support_roi_opportunities (organization_id, opportunity_date);
create index if not exists idx_support_roi_opportunities_status
  on public.support_roi_opportunities (organization_id, status, opportunity_date);

comment on table public.support_roi_opportunities is
'Oportunidades de receita adicional originadas pelo Suporte. Somente status converted entra como receita adicional realizada no ROI.';

alter table public.support_roi_opportunities enable row level security;

drop policy if exists support_roi_opportunities_select on public.support_roi_opportunities;
create policy support_roi_opportunities_select on public.support_roi_opportunities
for select to authenticated
using (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
);

drop policy if exists support_roi_opportunities_insert on public.support_roi_opportunities;
create policy support_roi_opportunities_insert on public.support_roi_opportunities
for insert to authenticated
with check (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
);

drop policy if exists support_roi_opportunities_update on public.support_roi_opportunities;
create policy support_roi_opportunities_update on public.support_roi_opportunities
for update to authenticated
using (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
)
with check (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
);

drop policy if exists support_roi_opportunities_delete on public.support_roi_opportunities;
create policy support_roi_opportunities_delete on public.support_roi_opportunities
for delete to authenticated
using (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
);

grant select, insert, update, delete on public.support_roi_opportunities to authenticated;

commit;
