-- Soften Performance Hub V2.58.0 R5
-- Compatibility hotfix for installations that already created the V2.57.3
-- strategic operational-cost tables before V2.57.4 changed their shape.
-- Preserves existing rows and upgrades them to the current allocation contract.

begin;

do $$
declare
  v_legacy_allocation boolean := false;
begin
  if to_regclass('public.strategy_operational_costs') is null then
    raise exception 'strategy_operational_costs is missing; execute the strategic migrations from V2.57.3 onward first';
  end if;

  if to_regclass('public.strategy_cost_allocations') is null then
    raise exception 'strategy_cost_allocations is missing; execute the strategic migrations from V2.57.3 onward first';
  end if;

  -- V2.57.3 used English category values and "headcount". The current UI
  -- writes Portuguese labels and uses FTE. Remove only the legacy checks,
  -- normalize stored values, and install the current allocation-method check.
  alter table public.strategy_operational_costs
    drop constraint if exists strategy_operational_costs_category_check;

  alter table public.strategy_operational_costs
    drop constraint if exists strategy_operational_costs_allocation_method_check;

  update public.strategy_operational_costs
  set category = case category
    when 'technology' then 'Tecnologia'
    when 'communication' then U&'Comunica\00E7\00E3o'
    when 'infrastructure' then 'Infraestrutura'
    when 'third_party' then 'Terceiros'
    when 'training' then 'Treinamento'
    when 'other' then 'Outros'
    else category
  end;

  update public.strategy_operational_costs
  set allocation_method = 'fte'
  where allocation_method = 'headcount';

  alter table public.strategy_operational_costs
    alter column category set default 'Outros';

  alter table public.strategy_operational_costs
    alter column allocation_method set default 'fte';

  alter table public.strategy_operational_costs
    add constraint strategy_operational_costs_allocation_method_check
    check (allocation_method in ('direct','fte','attendance','manual'));

  -- Missing allocated_amount identifies the V2.57.3 allocation shape, where
  -- percentage was stored as 0..100. Capture this before adding new columns.
  select not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'strategy_cost_allocations'
      and column_name = 'allocated_amount'
  ) into v_legacy_allocation;

  alter table public.strategy_cost_allocations
    add column if not exists allocation_method_snapshot text;

  alter table public.strategy_cost_allocations
    add column if not exists allocated_amount numeric(14,2);

  alter table public.strategy_cost_allocations
    drop constraint if exists strategy_cost_allocations_percentage_check;

  if v_legacy_allocation then
    -- Convert legacy percentage values (100 = 100%) to fractions (1 = 100%)
    -- while changing precision in one operation, avoiding intermediate rounding.
    alter table public.strategy_cost_allocations
      alter column percentage type numeric(10,8)
      using (percentage / 100.0)::numeric(10,8);
  else
    alter table public.strategy_cost_allocations
      alter column percentage type numeric(10,8)
      using percentage::numeric(10,8);
  end if;

  update public.strategy_cost_allocations sca
  set allocation_method_snapshot = case
    when soc.allocation_method = 'headcount' then 'fte'
    else coalesce(nullif(soc.allocation_method,''),'fte')
  end
  from public.strategy_operational_costs soc
  where soc.id = sca.operational_cost_id
    and sca.allocation_method_snapshot is null;

  update public.strategy_cost_allocations
  set allocation_method_snapshot = 'fte'
  where allocation_method_snapshot is null;

  update public.strategy_cost_allocations sca
  set allocated_amount = round((soc.amount * sca.percentage)::numeric,2)
  from public.strategy_operational_costs soc
  where soc.id = sca.operational_cost_id
    and sca.allocated_amount is null;

  update public.strategy_cost_allocations
  set allocated_amount = 0
  where allocated_amount is null;

  alter table public.strategy_cost_allocations
    alter column allocation_method_snapshot set default 'fte',
    alter column allocation_method_snapshot set not null,
    alter column allocated_amount set default 0,
    alter column allocated_amount set not null;

  alter table public.strategy_cost_allocations
    add constraint strategy_cost_allocations_percentage_check
    check (percentage >= 0 and percentage <= 1);

  alter table public.strategy_cost_allocations
    drop constraint if exists strategy_cost_allocations_allocated_amount_check;

  alter table public.strategy_cost_allocations
    add constraint strategy_cost_allocations_allocated_amount_check
    check (allocated_amount >= 0);
end
$$;

notify pgrst,'reload schema';
commit;
