-- V2.63.1: modelos de mapeamento de CSVs comerciais, sem reconhecimento de receita.
-- Executar DEPOIS de MIGRACAO_V2.63.0.sql. Preserva dados financeiros e snapshots.
begin;
create table if not exists public.strategy_import_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_key text not null check (source_key in ('contracted_modules_csv','merchandise_sales_csv')),
  name text not null check (length(btrim(name)) between 1 and 80),
  columns jsonb not null check (jsonb_typeof(columns)='object'),
  headers jsonb not null check (jsonb_typeof(headers)='array' and jsonb_array_length(headers) between 1 and 100),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,source_key,name),
  constraint strategy_import_mapping_required_v2631 check (
    columns ?& array['date','seller','squad','product','amount']
    and (source_key='contracted_modules_csv' or columns ? 'saleId')
    and jsonb_typeof(columns->'date')='string'
    and jsonb_typeof(columns->'seller')='string'
    and jsonb_typeof(columns->'squad')='string'
    and jsonb_typeof(columns->'product')='string'
    and jsonb_typeof(columns->'amount')='string'
  )
);
create index if not exists idx_strategy_import_mappings_scope_v2631
 on public.strategy_import_mappings (organization_id,source_key,name);
-- Atualizacao do timestamp em alteracoes pelo proprietario.
create or replace function public.strategy_touch_import_mapping_v2631()
returns trigger language plpgsql set search_path=public as $$
begin
 new.updated_at=now();new.created_at=old.created_at;
 return new;
end $$;
drop trigger if exists strategy_touch_import_mapping_v2631 on public.strategy_import_mappings;
create trigger strategy_touch_import_mapping_v2631 before update on public.strategy_import_mappings
 for each row execute function public.strategy_touch_import_mapping_v2631();
alter table public.strategy_import_mappings enable row level security;
drop policy if exists strategy_import_mappings_read_v2631 on public.strategy_import_mappings;
create policy strategy_import_mappings_read_v2631 on public.strategy_import_mappings for select to authenticated
 using (organization_id=(select (public.current_profile()).organization_id)
 and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_import_mappings_insert_v2631 on public.strategy_import_mappings;
create policy strategy_import_mappings_insert_v2631 on public.strategy_import_mappings for insert to authenticated
 with check (organization_id=(select (public.current_profile()).organization_id)
 and created_by=(select auth.uid())
 and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_import_mappings_update_v2631 on public.strategy_import_mappings;
create policy strategy_import_mappings_update_v2631 on public.strategy_import_mappings for update to authenticated
 using (organization_id=(select (public.current_profile()).organization_id)
 and created_by=(select auth.uid())
 and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'))
 with check (organization_id=(select (public.current_profile()).organization_id)
 and created_by=(select auth.uid())
 and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));
-- DELETE nao autorizado: modelos possuem rastreabilidade e reutilizacao.
revoke all on public.strategy_import_mappings from anon;
grant select,insert,update on public.strategy_import_mappings to authenticated;
commit;
