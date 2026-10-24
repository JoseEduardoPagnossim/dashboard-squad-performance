-- Soften Performance Hub V2.60.2
-- Fase 5 - Receita Influenciada.
--
-- Regra econômica:
--   draft      = oportunidade influenciada em andamento (pipeline, não receita);
--   confirmed  = oportunidade convertida (gross_amount entra em Receita Influenciada);
--   cancelled  = encerrada sem conversão / cancelada (auditável, não entra em receita).
-- Receita Influenciada permanece separada da Receita Direta.

begin;

alter table public.strategy_result_events
  add column if not exists influenced_revenue_stage text;

alter table public.strategy_result_events
  drop constraint if exists strategy_result_events_influenced_stage_check;
alter table public.strategy_result_events
  add constraint strategy_result_events_influenced_stage_check
  check (
    influenced_revenue_stage is null
    or influenced_revenue_stage in (
      'originated','qualified','evolved','negotiation_support','handoff','other'
    )
  );

create index if not exists idx_strategy_result_events_influenced_stage
  on public.strategy_result_events(organization_id,competence_id,influenced_revenue_stage)
  where result_type='influenced';

create or replace function public.validate_strategy_influenced_revenue_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.result_type='influenced' then
    if nullif(trim(coalesce(new.influenced_revenue_stage,'')),'') is null then
      raise exception 'influenced revenue stage required' using errcode='23514';
    end if;
    if upper(trim(coalesce(new.currency,'')))<>'BRL' then
      raise exception 'influenced revenue V2.60.2 supports BRL only' using errcode='23514';
    end if;
    if new.status='confirmed' then
      if coalesce(new.gross_amount,0)<=0 then
        raise exception 'influenced revenue gross amount must be greater than zero when confirmed' using errcode='23514';
      end if;
      if nullif(trim(coalesce(new.source_reference,'')),'') is null then
        raise exception 'source reference required for confirmed influenced revenue' using errcode='23514';
      end if;
    end if;
  elsif new.influenced_revenue_stage is not null then
    raise exception 'influenced revenue stage is only valid for influenced events' using errcode='23514';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_strategy_influenced_revenue_event() from public;
revoke all on function public.validate_strategy_influenced_revenue_event() from authenticated;

drop trigger if exists strategy_result_events_influenced_revenue_guard on public.strategy_result_events;
create trigger strategy_result_events_influenced_revenue_guard
before insert or update of result_type,status,gross_amount,currency,source_reference,influenced_revenue_stage
on public.strategy_result_events
for each row execute function public.validate_strategy_influenced_revenue_event();

create or replace function public.get_strategy_influenced_revenue_summary(
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
      and e.result_type='influenced'
      and e.currency='BRL'
      and e.influenced_revenue_stage is not null
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
  ), stage_rows as (
    select
      influenced_revenue_stage stage,
      count(*)::bigint opportunity_count,
      count(*) filter (where status='draft')::bigint draft_count,
      count(*) filter (where status='confirmed')::bigint converted_count,
      count(*) filter (where status='cancelled')::bigint cancelled_count,
      coalesce(sum(gross_amount) filter (where status='confirmed'),0)::numeric(14,2) influenced_revenue_total,
      coalesce(sum(gross_amount) filter (where status='draft'),0)::numeric(14,2) open_potential_amount
    from filtered
    group by influenced_revenue_stage
  ), totals as (
    select
      count(*)::bigint opportunity_count,
      count(*) filter (where status='draft')::bigint draft_count,
      count(*) filter (where status='confirmed')::bigint converted_count,
      count(*) filter (where status='cancelled')::bigint cancelled_count,
      coalesce(sum(gross_amount) filter (where status='confirmed'),0)::numeric(14,2) influenced_revenue_total,
      coalesce(sum(gross_amount) filter (where status='draft'),0)::numeric(14,2) open_potential_amount,
      coalesce(sum(monthly_recurring_amount) filter (where status='confirmed'),0)::numeric(14,2) monthly_recurring_amount,
      coalesce(sum(annual_recurring_amount) filter (where status='confirmed'),0)::numeric(14,2) annual_recurring_amount,
      count(distinct source)::bigint source_count
    from filtered
  )
  select jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'opportunity_count',t.opportunity_count,
    'draft_count',t.draft_count,
    'converted_count',t.converted_count,
    'cancelled_count',t.cancelled_count,
    'influenced_revenue_total',t.influenced_revenue_total,
    'open_potential_amount',t.open_potential_amount,
    'monthly_recurring_amount',t.monthly_recurring_amount,
    'annual_recurring_amount',t.annual_recurring_amount,
    'conversion_rate',case when (t.converted_count+t.cancelled_count)>0 then t.converted_count::numeric/(t.converted_count+t.cancelled_count) else 0 end,
    'attributed_event_count',(select count(*) from flags where attributed),
    'unattributed_event_count',(select count(*) from flags where not attributed),
    'source_count',t.source_count,
    'stages',coalesce((
      select jsonb_agg(jsonb_build_object(
        'stage',stage,
        'opportunity_count',opportunity_count,
        'draft_count',draft_count,
        'converted_count',converted_count,
        'cancelled_count',cancelled_count,
        'influenced_revenue_total',influenced_revenue_total,
        'open_potential_amount',open_potential_amount
      ) order by stage)
      from stage_rows
    ),'[]'::jsonb)
  ) into v_result
  from totals t;

  return coalesce(v_result,jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'opportunity_count',0,'draft_count',0,'converted_count',0,'cancelled_count',0,
    'influenced_revenue_total',0,'open_potential_amount',0,
    'monthly_recurring_amount',0,'annual_recurring_amount',0,'conversion_rate',0,
    'attributed_event_count',0,'unattributed_event_count',0,'source_count',0,
    'stages','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_influenced_revenue_summary(date,text) from public;
grant execute on function public.get_strategy_influenced_revenue_summary(date,text) to authenticated;

comment on column public.strategy_result_events.influenced_revenue_stage is
'V2.60.2: forma comprovada de participação do time na oportunidade influenciada.';
comment on function public.get_strategy_influenced_revenue_summary(date,text) is
'V2.60.2: separa pipeline draft de Receita Influenciada confirmed e evita duplicidade por Squad com EXISTS nas atribuições.';

notify pgrst,'reload schema';
commit;
