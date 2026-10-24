-- Soften Performance Hub V2.60.3
-- Fase 5 - Receita Protegida.
--
-- Regra econômica:
--   draft      = caso em acompanhamento / receita em risco (não é protegida ainda);
--   confirmed  = permanência validada; valor preservado entra em Receita Protegida;
--   cancelled  = perda confirmada / retenção sem sucesso; permanece auditável e não entra na métrica.
--
-- Receita Protegida é valor existente preservado e permanece separada da Receita
-- Direta e Influenciada. MRR/ARR protegidos são indicadores paralelos e não são
-- somados novamente ao total de gross_amount.

begin;

alter table public.strategy_result_events
  add column if not exists protected_revenue_type text,
  add column if not exists protection_verified_at timestamptz,
  add column if not exists protection_lost_at timestamptz;

alter table public.strategy_result_events
  drop constraint if exists strategy_result_events_protected_type_check;
alter table public.strategy_result_events
  add constraint strategy_result_events_protected_type_check
  check (
    protected_revenue_type is null
    or protected_revenue_type in ('retention','recovery','cancellation_prevention')
  );

alter table public.strategy_result_events
  drop constraint if exists strategy_result_events_protection_dates_check;
alter table public.strategy_result_events
  add constraint strategy_result_events_protection_dates_check
  check (
    protection_lost_at is null
    or protection_verified_at is null
    or protection_lost_at >= protection_verified_at
  );

create index if not exists idx_strategy_result_events_protected_type
  on public.strategy_result_events(organization_id,competence_id,protected_revenue_type)
  where result_type='protected';

create index if not exists idx_strategy_result_events_protection_outcome
  on public.strategy_result_events(organization_id,competence_id,status,protection_lost_at)
  where result_type='protected';

create or replace function public.validate_strategy_protected_revenue_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.result_type='protected' then
    if nullif(trim(coalesce(new.protected_revenue_type,'')),'') is null then
      raise exception 'protected revenue type required' using errcode='23514';
    end if;
    if upper(trim(coalesce(new.currency,'')))<>'BRL' then
      raise exception 'protected revenue V2.60.3 supports BRL only' using errcode='23514';
    end if;

    if coalesce(new.gross_amount,0)<=0
       and coalesce(new.monthly_recurring_amount,0)<=0
       and coalesce(new.annual_recurring_amount,0)<=0 then
      raise exception 'protected revenue requires amount, MRR or ARR' using errcode='23514';
    end if;

    if new.protection_verified_at is not null and new.protection_verified_at < new.occurred_at then
      raise exception 'protection verification cannot precede protected revenue event' using errcode='23514';
    end if;
    if new.protection_lost_at is not null and new.protection_lost_at < new.occurred_at then
      raise exception 'protection loss cannot precede protected revenue event' using errcode='23514';
    end if;

    if new.status='confirmed' then
      if nullif(trim(coalesce(new.source_reference,'')),'') is null then
        raise exception 'source reference required for confirmed protected revenue' using errcode='23514';
      end if;
      if new.protection_verified_at is null then
        raise exception 'protection verification date required for confirmed protected revenue' using errcode='23514';
      end if;
      if new.protection_lost_at is not null then
        raise exception 'confirmed protected revenue cannot already be marked as lost' using errcode='23514';
      end if;
    elsif new.status='cancelled' then
      if new.protection_lost_at is null then
        new.protection_lost_at:=now();
      end if;
    elsif new.status='draft' then
      if new.protection_verified_at is not null or new.protection_lost_at is not null then
        raise exception 'draft protected revenue cannot have verification or loss date' using errcode='23514';
      end if;
    end if;
  elsif new.protected_revenue_type is not null
     or new.protection_verified_at is not null
     or new.protection_lost_at is not null then
    raise exception 'protection fields are only valid for protected events' using errcode='23514';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_strategy_protected_revenue_event() from public;
revoke all on function public.validate_strategy_protected_revenue_event() from authenticated;

drop trigger if exists strategy_result_events_protected_revenue_guard on public.strategy_result_events;
create trigger strategy_result_events_protected_revenue_guard
before insert or update of result_type,status,gross_amount,monthly_recurring_amount,annual_recurring_amount,currency,source_reference,protected_revenue_type,protection_verified_at,protection_lost_at
on public.strategy_result_events
for each row execute function public.validate_strategy_protected_revenue_event();

create or replace function public.get_strategy_protected_revenue_summary(
  p_competence date,
  p_squad_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_code text;
  v_all boolean;
  v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy aggregate access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode='42501';
  end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  with comp as (
    select id
    from public.strategy_competences
    where organization_id=v_org
      and competence=date_trunc('month',p_competence)::date
    limit 1
  ), filtered as (
    select e.*
    from public.strategy_result_events e
    join comp c on c.id=e.competence_id
    where e.organization_id=v_org
      and e.result_type='protected'
      and e.currency='BRL'
      and e.protected_revenue_type is not null
      and (
        v_all
        or exists (
          select 1
          from public.strategy_result_attributions a
          where a.organization_id=v_org
            and a.event_id=e.id
            and upper(trim(coalesce(a.squad_code_snapshot,'')))=v_code
        )
      )
  ), flags as (
    select f.id,
      exists(
        select 1 from public.strategy_result_attributions a
        where a.organization_id=v_org and a.event_id=f.id
      ) attributed
    from filtered f
  ), type_rows as (
    select
      protected_revenue_type type,
      count(*)::bigint case_count,
      count(*) filter (where status='draft')::bigint draft_count,
      count(*) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null)::bigint protected_count,
      count(*) filter (where status='cancelled' or protection_lost_at is not null)::bigint lost_count,
      coalesce(sum(gross_amount) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null),0)::numeric(14,2) protected_revenue_total,
      coalesce(sum(gross_amount) filter (where status='draft'),0)::numeric(14,2) at_risk_amount,
      coalesce(sum(monthly_recurring_amount) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null),0)::numeric(14,2) protected_mrr,
      coalesce(sum(annual_recurring_amount) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null),0)::numeric(14,2) protected_arr,
      coalesce(sum(monthly_recurring_amount) filter (where status='draft'),0)::numeric(14,2) at_risk_mrr,
      coalesce(sum(annual_recurring_amount) filter (where status='draft'),0)::numeric(14,2) at_risk_arr
    from filtered
    group by protected_revenue_type
  ), totals as (
    select
      count(*)::bigint case_count,
      count(*) filter (where status='draft')::bigint draft_count,
      count(*) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null)::bigint protected_count,
      count(*) filter (where status='cancelled' or protection_lost_at is not null)::bigint lost_count,
      coalesce(sum(gross_amount) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null),0)::numeric(14,2) protected_revenue_total,
      coalesce(sum(gross_amount) filter (where status='draft'),0)::numeric(14,2) at_risk_amount,
      coalesce(sum(monthly_recurring_amount) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null),0)::numeric(14,2) protected_mrr,
      coalesce(sum(annual_recurring_amount) filter (where status='confirmed' and protection_verified_at is not null and protection_lost_at is null),0)::numeric(14,2) protected_arr,
      coalesce(sum(monthly_recurring_amount) filter (where status='draft'),0)::numeric(14,2) at_risk_mrr,
      coalesce(sum(annual_recurring_amount) filter (where status='draft'),0)::numeric(14,2) at_risk_arr,
      count(distinct source)::bigint source_count
    from filtered
  )
  select jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'case_count',t.case_count,
    'draft_count',t.draft_count,
    'protected_count',t.protected_count,
    'lost_count',t.lost_count,
    'protected_revenue_total',t.protected_revenue_total,
    'at_risk_amount',t.at_risk_amount,
    'protected_mrr',t.protected_mrr,
    'protected_arr',t.protected_arr,
    'at_risk_mrr',t.at_risk_mrr,
    'at_risk_arr',t.at_risk_arr,
    'protection_rate',case when (t.protected_count+t.lost_count)>0 then t.protected_count::numeric/(t.protected_count+t.lost_count) else 0 end,
    'attributed_event_count',(select count(*) from flags where attributed),
    'unattributed_event_count',(select count(*) from flags where not attributed),
    'source_count',t.source_count,
    'types',coalesce((
      select jsonb_agg(jsonb_build_object(
        'type',type,
        'case_count',case_count,
        'draft_count',draft_count,
        'protected_count',protected_count,
        'lost_count',lost_count,
        'protected_revenue_total',protected_revenue_total,
        'at_risk_amount',at_risk_amount,
        'protected_mrr',protected_mrr,
        'protected_arr',protected_arr,
        'at_risk_mrr',at_risk_mrr,
        'at_risk_arr',at_risk_arr
      ) order by type)
      from type_rows
    ),'[]'::jsonb)
  ) into v_result
  from totals t;

  return coalesce(v_result,jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'case_count',0,'draft_count',0,'protected_count',0,'lost_count',0,
    'protected_revenue_total',0,'at_risk_amount',0,
    'protected_mrr',0,'protected_arr',0,'at_risk_mrr',0,'at_risk_arr',0,
    'protection_rate',0,'attributed_event_count',0,'unattributed_event_count',0,'source_count',0,
    'types','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_protected_revenue_summary(date,text) from public;
grant execute on function public.get_strategy_protected_revenue_summary(date,text) to authenticated;

comment on column public.strategy_result_events.protected_revenue_type is
'V2.60.3: natureza da proteção: retenção, recuperação ou prevenção de cancelamento.';
comment on column public.strategy_result_events.protection_verified_at is
'V2.60.3: momento em que a permanência/recuperação foi validada para entrar na Receita Protegida.';
comment on column public.strategy_result_events.protection_lost_at is
'V2.60.3: momento em que a proteção deixou de ser válida; o evento permanece auditável e sai da métrica ativa.';
comment on function public.get_strategy_protected_revenue_summary(date,text) is
'V2.60.3: separa receita em risco, receita protegida validada e perdas, mantendo MRR/ARR paralelos ao gross_amount.';

notify pgrst,'reload schema';
commit;
