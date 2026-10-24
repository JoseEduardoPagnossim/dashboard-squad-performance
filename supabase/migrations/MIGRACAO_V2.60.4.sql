-- Soften Performance Hub V2.60.4
-- Fase 5 - Resultado por tecnico.
--
-- Objetivo:
--   consolidar a contribuicao economica individual sem duplicar o valor do evento.
--
-- Regras:
--   - Receita Direta, Influenciada e Protegida permanecem naturezas independentes;
--   - attribution_share explicita tem precedencia;
--   - quando houver participantes sem share explicito, o saldo restante do evento
--     e dividido igualmente entre eles;
--   - se todos os participantes estiverem sem share, o evento e dividido igualmente;
--   - shares explicitos do mesmo evento nao podem ultrapassar 100%;
--   - detalhes individuais exigem people_costs.

begin;

create or replace function public.validate_strategy_result_attribution_share_total()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_event uuid;
  v_total numeric;
begin
  v_event:=new.event_id;
  select coalesce(sum(attribution_share),0)
    into v_total
  from public.strategy_result_attributions
  where event_id=v_event
    and id<>new.id
    and attribution_share is not null;

  if new.attribution_share is not null then
    v_total:=v_total+new.attribution_share;
  end if;

  if v_total>1.000001 then
    raise exception 'strategy result attribution shares exceed 100%% for event %',v_event using errcode='23514';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_strategy_result_attribution_share_total() from public;
revoke all on function public.validate_strategy_result_attribution_share_total() from authenticated;

drop trigger if exists strategy_result_attributions_share_guard on public.strategy_result_attributions;
create trigger strategy_result_attributions_share_guard
before insert or update of event_id,attribution_share
on public.strategy_result_attributions
for each row execute function public.validate_strategy_result_attribution_share_total();

create or replace function public.get_strategy_result_technician_summary(
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
  if not public.has_strategy_access('people_costs') then
    raise exception 'strategy people result access denied' using errcode='42501';
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
  ), eligible_events as (
    select e.*
    from public.strategy_result_events e
    join comp c on c.id=e.competence_id
    where e.organization_id=v_org
      and e.currency='BRL'
      and (
        (e.result_type='direct' and e.status='confirmed')
        or (e.result_type='influenced' and e.status='confirmed')
        or (e.result_type='protected' and e.status='confirmed' and e.protection_verified_at is not null and e.protection_lost_at is null)
      )
  ), attr_base as (
    select
      a.*,
      e.result_type,
      e.gross_amount,
      e.monthly_recurring_amount,
      e.annual_recurring_amount,
      sum(coalesce(a.attribution_share,0)) over(partition by a.event_id) explicit_share_sum,
      count(*) filter (where a.attribution_share is null) over(partition by a.event_id) null_share_count
    from public.strategy_result_attributions a
    join eligible_events e on e.id=a.event_id
    where a.organization_id=v_org
      and (a.person_id is not null or nullif(trim(coalesce(a.technician_name_snapshot,'')),'') is not null)
  ), credited as (
    select
      a.*,
      case
        when a.attribution_share is not null then greatest(0,least(1,a.attribution_share))
        when a.null_share_count>0 then greatest(0,1-least(1,a.explicit_share_sum))/a.null_share_count
        else 0
      end effective_share
    from attr_base a
  ), scoped as (
    select *
    from credited
    where v_all or upper(trim(coalesce(squad_code_snapshot,'')))=v_code
  ), rows as (
    select
      coalesce(person_id::text,user_id_snapshot::text,lower(trim(technician_name_snapshot))||'|'||upper(trim(coalesce(squad_code_snapshot,'')))) technician_key,
      max(person_id::text) person_id,
      max(user_id_snapshot::text) user_id,
      max(technician_name_snapshot) technician_name,
      case when count(distinct nullif(upper(trim(coalesce(squad_code_snapshot,''))),'') )>1 then 'MULTI' else max(upper(trim(coalesce(squad_code_snapshot,'')))) end squad_code,
      count(distinct event_id)::bigint participation_count,
      count(distinct event_id) filter (where effective_share>0)::bigint credited_event_count,
      count(distinct event_id) filter (where result_type='direct' and effective_share>0)::bigint direct_event_count,
      coalesce(sum(gross_amount*effective_share) filter (where result_type='direct'),0)::numeric(14,2) direct_revenue,
      coalesce(sum(monthly_recurring_amount*effective_share) filter (where result_type='direct'),0)::numeric(14,2) direct_mrr,
      coalesce(sum(annual_recurring_amount*effective_share) filter (where result_type='direct'),0)::numeric(14,2) direct_arr,
      count(distinct event_id) filter (where result_type='influenced' and effective_share>0)::bigint influenced_event_count,
      coalesce(sum(gross_amount*effective_share) filter (where result_type='influenced'),0)::numeric(14,2) influenced_revenue,
      coalesce(sum(monthly_recurring_amount*effective_share) filter (where result_type='influenced'),0)::numeric(14,2) influenced_mrr,
      coalesce(sum(annual_recurring_amount*effective_share) filter (where result_type='influenced'),0)::numeric(14,2) influenced_arr,
      count(distinct event_id) filter (where result_type='protected' and effective_share>0)::bigint protected_event_count,
      coalesce(sum(gross_amount*effective_share) filter (where result_type='protected'),0)::numeric(14,2) protected_revenue,
      coalesce(sum(monthly_recurring_amount*effective_share) filter (where result_type='protected'),0)::numeric(14,2) protected_mrr,
      coalesce(sum(annual_recurring_amount*effective_share) filter (where result_type='protected'),0)::numeric(14,2) protected_arr,
      coalesce(sum(effective_share) filter (where result_type='direct'),0)::numeric(12,6) direct_share_units,
      coalesce(sum(effective_share) filter (where result_type='influenced'),0)::numeric(12,6) influenced_share_units,
      coalesce(sum(effective_share) filter (where result_type='protected'),0)::numeric(12,6) protected_share_units
    from scoped
    group by coalesce(person_id::text,user_id_snapshot::text,lower(trim(technician_name_snapshot))||'|'||upper(trim(coalesce(squad_code_snapshot,''))))
  ), totals as (
    select
      count(*)::bigint technician_count,
      coalesce(sum(participation_count),0)::bigint participation_count,
      coalesce(sum(credited_event_count),0)::bigint credited_event_count,
      coalesce(sum(direct_revenue),0)::numeric(14,2) direct_revenue,
      coalesce(sum(influenced_revenue),0)::numeric(14,2) influenced_revenue,
      coalesce(sum(protected_revenue),0)::numeric(14,2) protected_revenue,
      coalesce(sum(direct_mrr),0)::numeric(14,2) direct_mrr,
      coalesce(sum(influenced_mrr),0)::numeric(14,2) influenced_mrr,
      coalesce(sum(protected_mrr),0)::numeric(14,2) protected_mrr
    from rows
  )
  select jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'technician_count',t.technician_count,
    'participation_count',t.participation_count,
    'credited_event_count',t.credited_event_count,
    'direct_revenue',t.direct_revenue,
    'influenced_revenue',t.influenced_revenue,
    'protected_revenue',t.protected_revenue,
    'direct_mrr',t.direct_mrr,
    'influenced_mrr',t.influenced_mrr,
    'protected_mrr',t.protected_mrr,
    'rows',coalesce((
      select jsonb_agg(jsonb_build_object(
        'technician_key',technician_key,
        'person_id',person_id,
        'user_id',user_id,
        'technician_name',technician_name,
        'squad_code',squad_code,
        'participation_count',participation_count,
        'credited_event_count',credited_event_count,
        'direct_event_count',direct_event_count,
        'direct_revenue',direct_revenue,
        'direct_mrr',direct_mrr,
        'direct_arr',direct_arr,
        'influenced_event_count',influenced_event_count,
        'influenced_revenue',influenced_revenue,
        'influenced_mrr',influenced_mrr,
        'influenced_arr',influenced_arr,
        'protected_event_count',protected_event_count,
        'protected_revenue',protected_revenue,
        'protected_mrr',protected_mrr,
        'protected_arr',protected_arr,
        'direct_share_units',direct_share_units,
        'influenced_share_units',influenced_share_units,
        'protected_share_units',protected_share_units
      ) order by technician_name,squad_code)
      from rows
    ),'[]'::jsonb)
  ) into v_result
  from totals t;

  return coalesce(v_result,jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'technician_count',0,
    'participation_count',0,
    'credited_event_count',0,
    'direct_revenue',0,
    'influenced_revenue',0,
    'protected_revenue',0,
    'direct_mrr',0,
    'influenced_mrr',0,
    'protected_mrr',0,
    'rows','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_result_technician_summary(date,text) from public;
grant execute on function public.get_strategy_result_technician_summary(date,text) to authenticated;

comment on function public.get_strategy_result_technician_summary(date,text) is
'V2.60.4: contribuicao economica individual por tecnico com rateio deterministico por attribution_share e sem somar as tres naturezas em um total artificial.';
comment on function public.validate_strategy_result_attribution_share_total() is
'V2.60.4: impede shares explicitos acima de 100% no mesmo evento economico.';

notify pgrst,'reload schema';
commit;
