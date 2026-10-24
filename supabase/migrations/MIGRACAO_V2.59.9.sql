-- Soften Performance Hub V2.59.9
-- Fase 4 - Hardening, regressoes e fechamento da Capacidade.
--
-- Esta migration nao altera formulas da Fase 4. Ela fortalece o contrato dos
-- snapshots criados na V2.59.8, reduz superficie de leitura direta e impede
-- mutacao retroativa das fotografias historicas.

begin;

-- O historico deve ser consumido somente pelas RPCs agregadas autorizadas.
-- A tabela bruta permanece protegida por RLS e deixa de ter SELECT direto.
revoke select on table public.strategy_capacity_snapshots from authenticated;

-- Contratos defensivos para novos snapshots. NOT VALID protege novos writes
-- sem bloquear a instalacao por eventual legado anterior ao hardening.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='strategy_capacity_snapshots_snapshot_version_match'
  ) then
    alter table public.strategy_capacity_snapshots
      add constraint strategy_capacity_snapshots_snapshot_version_match
      check ((snapshot->>'snapshot_version')=snapshot_version) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='strategy_capacity_snapshots_rule_version_match'
  ) then
    alter table public.strategy_capacity_snapshots
      add constraint strategy_capacity_snapshots_rule_version_match
      check ((snapshot->>'rule_version')=rule_version) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='strategy_capacity_snapshots_source_match'
  ) then
    alter table public.strategy_capacity_snapshots
      add constraint strategy_capacity_snapshots_source_match
      check ((snapshot->>'source')=source) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='strategy_capacity_snapshots_revision_match'
  ) then
    alter table public.strategy_capacity_snapshots
      add constraint strategy_capacity_snapshots_revision_match
      check ((snapshot->>'revision')::integer=revision) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='strategy_capacity_snapshots_financial_payload_revision_match'
  ) then
    alter table public.strategy_capacity_snapshots
      add constraint strategy_capacity_snapshots_financial_payload_revision_match
      check ((snapshot->>'financial_snapshot_revision')::integer=financial_snapshot_revision) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='strategy_capacity_snapshots_operation_object'
  ) then
    alter table public.strategy_capacity_snapshots
      add constraint strategy_capacity_snapshots_operation_object
      check (jsonb_typeof(snapshot->'operation')='object') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='strategy_capacity_snapshots_squads_array'
  ) then
    alter table public.strategy_capacity_snapshots
      add constraint strategy_capacity_snapshots_squads_array
      check (jsonb_typeof(snapshot->'squads')='array') not valid;
  end if;
end;
$$;

create or replace function public.prevent_strategy_capacity_snapshot_mutation()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  raise exception 'strategy capacity snapshots are immutable' using errcode='55000';
end;
$$;

revoke all on function public.prevent_strategy_capacity_snapshot_mutation() from public;
revoke all on function public.prevent_strategy_capacity_snapshot_mutation() from authenticated;

drop trigger if exists strategy_capacity_snapshots_immutable_guard on public.strategy_capacity_snapshots;
create trigger strategy_capacity_snapshots_immutable_guard
before update or delete on public.strategy_capacity_snapshots
for each row
execute function public.prevent_strategy_capacity_snapshot_mutation();

comment on function public.prevent_strategy_capacity_snapshot_mutation() is
'V2.59.9: impede update/delete de snapshots de capacidade para preservar a fotografia historica revisionada.';

comment on table public.strategy_capacity_snapshots is
'V2.59.9: snapshots de capacidade revisionados, imutaveis e consumidos por RPC agregada autorizada.';

notify pgrst,'reload schema';
commit;
