-- Soften Performance Hub V2.61.3
-- Fase 6 - Resultado economico por Produto.
-- Sincroniza as tres naturezas economicas oficiais da Fase 5 para a camada
-- Produto/Squad preservando rateio por Squad, MRR/ARR e saldo nao classificado.

begin;

create or replace function public.sync_strategy_product_result_sources(
  p_competence date,
  p_squad_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_org uuid;
  v_user uuid:=auth.uid();
  v_comp uuid;
  v_code text;
  v_all boolean;
  v_rows integer:=0;
begin
  if not public.has_strategy_access('edit_costs') then
    raise exception 'strategy product result sync access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  select id into v_comp
  from public.strategy_competences
  where organization_id=v_org
    and competence=date_trunc('month',p_competence)::date
  limit 1;
  if v_comp is null then raise exception 'strategy competence not found' using errcode='P0002'; end if;
  if exists(select 1 from public.strategy_competences where id=v_comp and status='closed') then
    raise exception 'strategy product competence is closed; reopen before syncing result sources' using errcode='23514';
  end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  -- Marca a decomposicao anterior como obsoleta antes do UPSERT. As fontes
  -- que continuam elegiveis reutilizam o mesmo ID e preservam atribuicoes de Produto.
  update public.strategy_product_sources s
  set metadata=coalesce(s.metadata,'{}'::jsonb)||jsonb_build_object('stale',true),updated_by=v_user,updated_at=now()
  where s.organization_id=v_org
    and s.competence_id=v_comp
    and s.source_domain='result'
    and coalesce(s.metadata->>'managed_by','')='V2.61.3'
    and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code);

  with eligible_events as (
    select e.*
    from public.strategy_result_events e
    where e.organization_id=v_org
      and e.competence_id=v_comp
      and e.currency='BRL'
      and (
        (e.result_type='direct' and e.status='confirmed')
        or (e.result_type='influenced' and e.status='confirmed')
        or (e.result_type='protected' and e.status='confirmed' and e.protection_verified_at is not null and e.protection_lost_at is null)
      )
  ), attr_base as (
    select a.event_id,
      coalesce(nullif(upper(trim(coalesce(a.squad_code_snapshot,''))),''),'UNALLOCATED') squad_code,
      a.attribution_share,
      sum(coalesce(a.attribution_share,0)) over(partition by a.event_id) explicit_share_sum,
      count(*) filter(where a.attribution_share is null) over(partition by a.event_id) null_share_count
    from public.strategy_result_attributions a
    join eligible_events e on e.id=a.event_id
    where a.organization_id=v_org
  ), credited as (
    select event_id,squad_code,
      case
        when attribution_share is not null then greatest(0,least(1,attribution_share))
        when null_share_count>0 then greatest(0,1-least(1,explicit_share_sum))/null_share_count
        else 0
      end effective_share
    from attr_base
  ), squad_shares as (
    select event_id,squad_code,sum(effective_share)::numeric effective_share
    from credited
    group by event_id,squad_code
  ), credited_totals as (
    select event_id,least(1::numeric,coalesce(sum(effective_share),0)) credited_share
    from squad_shares
    group by event_id
  ), event_parts as (
    select e.id event_id,e.result_type,e.gross_amount,e.monthly_recurring_amount,e.annual_recurring_amount,
      e.description,e.source,e.source_reference,
      ss.squad_code,ss.effective_share
    from eligible_events e
    join squad_shares ss on ss.event_id=e.id and ss.effective_share>0
    union all
    select e.id,e.result_type,e.gross_amount,e.monthly_recurring_amount,e.annual_recurring_amount,
      e.description,e.source,e.source_reference,
      'UNALLOCATED'::text, greatest(0,1-coalesce(ct.credited_share,0))::numeric
    from eligible_events e
    left join credited_totals ct on ct.event_id=e.id
    where greatest(0,1-coalesce(ct.credited_share,0))>0.000001
  )
  insert into public.strategy_product_sources(
    organization_id,competence_id,source_domain,metric_key,source_reference,
    source_quantity,source_amount,currency,squad_code_snapshot,metadata,
    created_by,updated_by,created_at,updated_at
  )
  select v_org,v_comp,'result',ep.result_type,
    'strategy_result_event:'||ep.event_id::text||':'||ep.squad_code,
    null,round((ep.gross_amount*ep.effective_share)::numeric,2),'BRL',ep.squad_code,
    jsonb_build_object(
      'sync_version','V2.61.3','managed_by','V2.61.3','automatic',true,'stale',false,
      'result_event_id',ep.event_id,'result_type',ep.result_type,
      'effective_squad_share',ep.effective_share,
      'source_mrr',round((ep.monthly_recurring_amount*ep.effective_share)::numeric,2),
      'source_arr',round((ep.annual_recurring_amount*ep.effective_share)::numeric,2),
      'result_source',ep.source,'result_source_reference',ep.source_reference,
      'description',ep.description
    ),v_user,v_user,now(),now()
  from event_parts ep
  where (v_all or ep.squad_code=v_code)
    and (ep.gross_amount>0 or ep.monthly_recurring_amount>0 or ep.annual_recurring_amount>0)
  on conflict (organization_id,competence_id,source_domain,source_reference)
  do update set
    metric_key=excluded.metric_key,
    source_amount=excluded.source_amount,
    currency=excluded.currency,
    squad_code_snapshot=excluded.squad_code_snapshot,
    metadata=excluded.metadata,
    updated_by=excluded.updated_by,
    updated_at=now();
  get diagnostics v_rows=row_count;

  return jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'result_sources_synced',v_rows,
    'nature_count',3
  );
end;
$$;

revoke all on function public.sync_strategy_product_result_sources(date,text) from public;
grant execute on function public.sync_strategy_product_result_sources(date,text) to authenticated;

create or replace function public.get_strategy_product_result_summary(
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
  v_official jsonb;
  v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy product result aggregate access denied' using errcode='42501';
  end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';
  v_official:=public.get_strategy_result_squad_summary(p_competence,p_squad_code);

  with comp as (
    select id from public.strategy_competences
    where organization_id=v_org and competence=date_trunc('month',p_competence)::date limit 1
  ), sources as (
    select s.id,lower(trim(s.metric_key)) result_type,coalesce(s.source_amount,0)::numeric gross_amount,
      coalesce(nullif(s.metadata->>'source_mrr','')::numeric,0) mrr,
      coalesce(nullif(s.metadata->>'source_arr','')::numeric,0) arr
    from public.strategy_product_sources s join comp c on c.id=s.competence_id
    where s.organization_id=v_org and s.source_domain='result'
      and lower(trim(s.metric_key)) in ('direct','influenced','protected')
      and coalesce(s.metadata->>'stale','false')<>'true'
      and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code)
  ), source_share as (
    select s.id,s.result_type,s.gross_amount,s.mrr,s.arr,
      least(1::numeric,greatest(0::numeric,coalesce(sum(a.allocation_share),0))) allocated_share
    from sources s left join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
    group by s.id,s.result_type,s.gross_amount,s.mrr,s.arr
  ), allocated as (
    select a.product_code_snapshot product_code,a.product_name_snapshot product_name,false unclassified,
      s.result_type,
      (s.gross_amount*a.allocation_share)::numeric amount,
      (s.mrr*a.allocation_share)::numeric mrr,
      (s.arr*a.allocation_share)::numeric arr
    from sources s join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
  ), residual as (
    select 'UNCLASSIFIED'::text product_code,'Não classificado'::text product_name,true unclassified,
      ss.result_type,
      (ss.gross_amount*(1-ss.allocated_share))::numeric amount,
      (ss.mrr*(1-ss.allocated_share))::numeric mrr,
      (ss.arr*(1-ss.allocated_share))::numeric arr
    from source_share ss where (1-ss.allocated_share)>0.000001
  ), combined as (
    select * from allocated union all select * from residual
  ), rows as (
    select product_code,max(product_name)::text product_name,unclassified,
      coalesce(sum(amount) filter(where result_type='direct'),0)::numeric(14,2) direct_revenue,
      coalesce(sum(mrr) filter(where result_type='direct'),0)::numeric(14,2) direct_mrr,
      coalesce(sum(arr) filter(where result_type='direct'),0)::numeric(14,2) direct_arr,
      coalesce(sum(amount) filter(where result_type='influenced'),0)::numeric(14,2) influenced_revenue,
      coalesce(sum(mrr) filter(where result_type='influenced'),0)::numeric(14,2) influenced_mrr,
      coalesce(sum(arr) filter(where result_type='influenced'),0)::numeric(14,2) influenced_arr,
      coalesce(sum(amount) filter(where result_type='protected'),0)::numeric(14,2) protected_revenue,
      coalesce(sum(mrr) filter(where result_type='protected'),0)::numeric(14,2) protected_mrr,
      coalesce(sum(arr) filter(where result_type='protected'),0)::numeric(14,2) protected_arr
    from combined group by product_code,unclassified
  ), totals as (
    select
      coalesce(sum(direct_revenue),0)::numeric(14,2) direct_revenue,
      coalesce(sum(influenced_revenue),0)::numeric(14,2) influenced_revenue,
      coalesce(sum(protected_revenue),0)::numeric(14,2) protected_revenue,
      coalesce(sum(direct_mrr),0)::numeric(14,2) direct_mrr,
      coalesce(sum(influenced_mrr),0)::numeric(14,2) influenced_mrr,
      coalesce(sum(protected_mrr),0)::numeric(14,2) protected_mrr,
      coalesce(sum(direct_revenue) filter(where not unclassified),0)::numeric(14,2) direct_classified,
      coalesce(sum(influenced_revenue) filter(where not unclassified),0)::numeric(14,2) influenced_classified,
      coalesce(sum(protected_revenue) filter(where not unclassified),0)::numeric(14,2) protected_classified,
      coalesce(sum(direct_revenue) filter(where unclassified),0)::numeric(14,2) direct_unclassified,
      coalesce(sum(influenced_revenue) filter(where unclassified),0)::numeric(14,2) influenced_unclassified,
      coalesce(sum(protected_revenue) filter(where unclassified),0)::numeric(14,2) protected_unclassified
    from rows
  )
  select jsonb_build_object(
    'source_available',true,'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,'currency','BRL','source_count',(select count(*) from sources),
    'direct_revenue',t.direct_revenue,'influenced_revenue',t.influenced_revenue,'protected_revenue',t.protected_revenue,
    'direct_mrr',t.direct_mrr,'influenced_mrr',t.influenced_mrr,'protected_mrr',t.protected_mrr,
    'direct_classified',t.direct_classified,'influenced_classified',t.influenced_classified,'protected_classified',t.protected_classified,
    'direct_unclassified',t.direct_unclassified,'influenced_unclassified',t.influenced_unclassified,'protected_unclassified',t.protected_unclassified,
    'direct_coverage_pct',case when t.direct_revenue>0 then t.direct_classified/t.direct_revenue*100 else null end,
    'influenced_coverage_pct',case when t.influenced_revenue>0 then t.influenced_classified/t.influenced_revenue*100 else null end,
    'protected_coverage_pct',case when t.protected_revenue>0 then t.protected_classified/t.protected_revenue*100 else null end,
    'official_direct_revenue',coalesce((v_official->>'direct_revenue')::numeric,0),
    'official_influenced_revenue',coalesce((v_official->>'influenced_revenue')::numeric,0),
    'official_protected_revenue',coalesce((v_official->>'protected_revenue')::numeric,0),
    'rows',coalesce((select jsonb_agg(jsonb_build_object(
      'product_code',r.product_code,'product_name',r.product_name,'unclassified',r.unclassified,
      'direct_revenue',r.direct_revenue,'direct_mrr',r.direct_mrr,'direct_arr',r.direct_arr,
      'influenced_revenue',r.influenced_revenue,'influenced_mrr',r.influenced_mrr,'influenced_arr',r.influenced_arr,
      'protected_revenue',r.protected_revenue,'protected_mrr',r.protected_mrr,'protected_arr',r.protected_arr
    ) order by r.unclassified,r.product_name) from rows r),'[]'::jsonb)
  ) into v_result from totals t;

  return coalesce(v_result,jsonb_build_object('source_available',true,'rows','[]'::jsonb));
end;
$$;

revoke all on function public.get_strategy_product_result_summary(date,text) from public;
grant execute on function public.get_strategy_product_result_summary(date,text) to authenticated;

comment on function public.sync_strategy_product_result_sources(date,text) is
'V2.61.3: sincroniza Resultado economico elegivel da Fase 5 para Produto/Squad usando o mesmo rateio efetivo por Squad.';
comment on function public.get_strategy_product_result_summary(date,text) is
'V2.61.3: agrega Receita Direta, Influenciada e Protegida por Produto sem criar total economico artificial.';

notify pgrst,'reload schema';
commit;
