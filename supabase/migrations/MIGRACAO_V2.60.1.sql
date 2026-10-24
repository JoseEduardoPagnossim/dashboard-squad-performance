-- Soften Performance Hub V2.60.1
-- Fase 5 - Receita Direta.
--
-- Regra econômica:
--   Receita Direta Total = SUM(gross_amount) de eventos DIRECT + CONFIRMED.
--   Novo MRR e Novo ARR são indicadores paralelos e NÃO são somados novamente.
--   Up-sell é categoria nativa de Receita Direta.
--   Drafts, cancelados/estornados e eventos sem valor confirmado não entram.

begin;

alter table public.strategy_result_events
  add column if not exists direct_revenue_category text;

alter table public.strategy_result_events
  drop constraint if exists strategy_result_events_direct_category_check;
alter table public.strategy_result_events
  add constraint strategy_result_events_direct_category_check
  check (
    direct_revenue_category is null
    or direct_revenue_category in (
      'upsell','plan_upgrade','module_addon','service','training','implementation','direct_sale','other'
    )
  );

create index if not exists idx_strategy_result_events_direct_category
  on public.strategy_result_events(organization_id,competence_id,direct_revenue_category)
  where result_type='direct';

-- Guard de integridade da Receita Direta. Permite rascunho incompleto, mas um
-- evento confirmado precisa estar pronto para entrar na métrica financeira.
create or replace function public.validate_strategy_direct_revenue_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.result_type='direct' then
    if new.status='confirmed' then
      if nullif(trim(coalesce(new.direct_revenue_category,'')),'') is null then
        raise exception 'direct revenue category required for confirmed event' using errcode='23514';
      end if;
      if coalesce(new.gross_amount,0)<=0 then
        raise exception 'direct revenue gross amount must be greater than zero' using errcode='23514';
      end if;
      if upper(trim(coalesce(new.currency,'')))<>'BRL' then
        raise exception 'direct revenue V2.60.1 supports BRL only' using errcode='23514';
      end if;
    end if;
  elsif new.direct_revenue_category is not null then
    raise exception 'direct revenue category is only valid for direct events' using errcode='23514';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_strategy_direct_revenue_event() from public;
revoke all on function public.validate_strategy_direct_revenue_event() from authenticated;

drop trigger if exists strategy_result_events_direct_revenue_guard on public.strategy_result_events;
create trigger strategy_result_events_direct_revenue_guard
before insert or update of result_type,status,gross_amount,currency,direct_revenue_category
on public.strategy_result_events
for each row execute function public.validate_strategy_direct_revenue_event();

create or replace function public.get_strategy_direct_revenue_summary(
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
      and e.result_type='direct'
      and e.status='confirmed'
      and e.currency='BRL'
      and e.gross_amount>0
      and e.direct_revenue_category is not null
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
  ), category_rows as (
    select
      direct_revenue_category category,
      count(*)::bigint event_count,
      coalesce(sum(gross_amount),0)::numeric(14,2) revenue_total,
      coalesce(sum(monthly_recurring_amount),0)::numeric(14,2) monthly_recurring_amount,
      coalesce(sum(annual_recurring_amount),0)::numeric(14,2) annual_recurring_amount
    from filtered
    group by direct_revenue_category
  )
  select jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'event_count',(select count(*) from filtered),
    'revenue_total',coalesce((select sum(gross_amount) from filtered),0),
    'monthly_recurring_amount',coalesce((select sum(monthly_recurring_amount) from filtered),0),
    'annual_recurring_amount',coalesce((select sum(annual_recurring_amount) from filtered),0),
    'ticket_average',coalesce((select avg(gross_amount) from filtered),0),
    'attributed_event_count',(select count(*) from flags where attributed),
    'unattributed_event_count',(select count(*) from flags where not attributed),
    'source_count',(select count(distinct source) from filtered),
    'categories',coalesce((
      select jsonb_agg(jsonb_build_object(
        'category',category,
        'event_count',event_count,
        'revenue_total',revenue_total,
        'monthly_recurring_amount',monthly_recurring_amount,
        'annual_recurring_amount',annual_recurring_amount
      ) order by category)
      from category_rows
    ),'[]'::jsonb)
  ) into v_result;

  return coalesce(v_result,jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'event_count',0,
    'revenue_total',0,
    'monthly_recurring_amount',0,
    'annual_recurring_amount',0,
    'ticket_average',0,
    'attributed_event_count',0,
    'unattributed_event_count',0,
    'source_count',0,
    'categories','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_direct_revenue_summary(date,text) from public;
grant execute on function public.get_strategy_direct_revenue_summary(date,text) to authenticated;

comment on column public.strategy_result_events.direct_revenue_category is
'V2.60.1: categoria nativa da Receita Direta. Up-sell usa o código upsell.';
comment on function public.get_strategy_direct_revenue_summary(date,text) is
'V2.60.1: soma somente gross_amount de Receita Direta confirmada; MRR/ARR são retornados separadamente para impedir dupla contagem.';

notify pgrst,'reload schema';
commit;
