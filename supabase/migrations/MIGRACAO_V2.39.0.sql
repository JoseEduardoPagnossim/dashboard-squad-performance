-- SOFTEN PERFORMANCE HUB V2.39.0
-- Financeiro avancado: memoria imutavel dos calculos e versao das regras.

create table if not exists public.finance_calculation_memory (
  id uuid primary key default gen_random_uuid(),
  squad_month_id uuid not null references public.squad_months(id) on delete cascade,
  squad_id uuid not null references public.squads(id) on delete cascade,
  rule_version text not null,
  rule_fingerprint text not null,
  trigger text not null,
  official_model text not null check (official_model in ('squad','individual')),
  summary jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_calc_memory_month_date
  on public.finance_calculation_memory(squad_month_id, created_at desc);
create index if not exists idx_finance_calc_memory_squad_date
  on public.finance_calculation_memory(squad_id, created_at desc);
create index if not exists idx_finance_calc_memory_rule
  on public.finance_calculation_memory(rule_version, rule_fingerprint);

alter table public.finance_calculation_memory enable row level security;

drop policy if exists finance_calc_memory_select on public.finance_calculation_memory;
create policy finance_calc_memory_select on public.finance_calculation_memory
for select to authenticated
using (
  public.can_admin_squad(squad_id)
  and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and coalesce(p.permissions ->> 'finance.view', 'true') <> 'false'
  )
  and exists (
    select 1
    from public.squad_months sm
    where sm.id = finance_calculation_memory.squad_month_id
      and sm.squad_id = finance_calculation_memory.squad_id
  )
);

drop policy if exists finance_calc_memory_insert on public.finance_calculation_memory;
create policy finance_calc_memory_insert on public.finance_calculation_memory
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and public.can_admin_squad(squad_id)
  and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and (
        coalesce(p.permissions ->> 'finance.manage', 'true') <> 'false'
        or (
          finance_calculation_memory.trigger = 'month_close'
          and coalesce(p.permissions ->> 'month.manage', 'true') <> 'false'
        )
      )
  )
  and exists (
    select 1
    from public.squad_months sm
    where sm.id = finance_calculation_memory.squad_month_id
      and sm.squad_id = finance_calculation_memory.squad_id
  )
);

-- Memoria de calculo e historico: registros sao somente leitura depois da criacao.
grant select, insert on public.finance_calculation_memory to authenticated;
revoke update, delete on public.finance_calculation_memory from anon, authenticated;

comment on table public.finance_calculation_memory is
  'Memoria imutavel dos calculos de bonificacao: regras, assinatura, modelo, parametros e valores por competencia.';
comment on column public.finance_calculation_memory.rule_version is
  'Versao semantica da logica financeira usada no calculo.';
comment on column public.finance_calculation_memory.rule_fingerprint is
  'Assinatura deterministica dos parametros financeiros usados naquela memoria.';
comment on column public.finance_calculation_memory.snapshot is
  'Fotografia completa das configuracoes e valores calculados para auditoria futura.';
