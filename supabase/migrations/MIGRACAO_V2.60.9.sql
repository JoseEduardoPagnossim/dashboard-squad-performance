-- Soften Performance Hub V2.60.9
-- Fase 5 - Hardening, regressoes, integridade e fechamento do Resultado.
--
-- Esta migration nao soma naturezas economicas nem muda o contrato do snapshot
-- RS-1.0.0. Ela fecha a Fase 5 reforcando:
--   - atribuicao economica completa antes do fechamento;
--   - serializacao do limite de attribution_share por evento;
--   - imutabilidade e contrato defensivo dos snapshots;
--   - leitura historica fail-closed e deterministica;
--   - ROI consolidado reconciliado com toda Receita Direta confirmada da operacao.

begin;

-- ---------------------------------------------------------------------------
-- 1. Atribuicoes: serializa alteracoes concorrentes por evento antes de validar
--    a soma explicita. Isso evita duas gravacoes simultaneas ultrapassarem 100%.
-- ---------------------------------------------------------------------------
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

  -- Lock por evento: concorrencia de atribuicoes do mesmo evento fica serializada.
  perform 1
  from public.strategy_result_events e
  where e.id=v_event
  for update;

  if not found then
    raise exception 'strategy result event not found for attribution share validation' using errcode='23503';
  end if;

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

-- ---------------------------------------------------------------------------
-- 2. Fechamento: todo evento economicamente elegivel deve fechar com 100% de
--    atribuicao efetiva. A regra respeita o motor existente:
--      * share explicita tem precedencia;
--      * participantes sem share dividem o saldo restante;
--      * sem participante nao existe rateio economico auditavel.
-- ---------------------------------------------------------------------------
create or replace function public.validate_strategy_result_close_integrity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_gap_count integer := 0;
  v_unattributed_count integer := 0;
begin
  if new.status='closed' and old.status is distinct from new.status then
    with eligible_events as (
      select e.id
      from public.strategy_result_events e
      where e.organization_id=new.organization_id
        and e.competence_id=new.id
        and e.currency='BRL'
        and (
          (e.result_type='direct' and e.status='confirmed')
          or (e.result_type='influenced' and e.status='confirmed')
          or (e.result_type='protected' and e.status='confirmed' and e.protection_verified_at is not null and e.protection_lost_at is null)
        )
    ), allocation_state as (
      select
        e.id,
        count(a.id)::integer attribution_count,
        coalesce(sum(a.attribution_share) filter (where a.attribution_share is not null),0)::numeric explicit_share_sum,
        count(a.id) filter (where a.attribution_share is null)::integer null_share_count
      from eligible_events e
      left join public.strategy_result_attributions a
        on a.organization_id=new.organization_id
       and a.event_id=e.id
      group by e.id
    )
    select
      count(*) filter (where attribution_count=0),
      count(*) filter (
        where attribution_count=0
           or (null_share_count=0 and abs(explicit_share_sum-1)>0.000001)
      )
    into v_unattributed_count,v_gap_count
    from allocation_state;

    if v_gap_count>0 then
      raise exception 'strategy result close blocked: % eligible event(s) without full economic attribution (% without attribution)',v_gap_count,v_unattributed_count using errcode='23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_strategy_result_close_integrity() from public;
revoke all on function public.validate_strategy_result_close_integrity() from authenticated;

drop trigger if exists strategy_result_close_integrity_guard on public.strategy_competences;
create trigger strategy_result_close_integrity_guard
before update of status on public.strategy_competences
for each row
when (new.status='closed' and old.status is distinct from new.status)
execute function public.validate_strategy_result_close_integrity();

-- ---------------------------------------------------------------------------
-- 3. Snapshots: consumo somente por RPC agregada, contrato fail-closed e
--    imutabilidade retroativa. NOT VALID protege novos writes sem travar legado.
-- ---------------------------------------------------------------------------
revoke select on table public.strategy_result_snapshots from authenticated;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_snapshot_version_match') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_snapshot_version_match
      check ((snapshot->>'snapshot_version')=snapshot_version) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_rule_version_match') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_rule_version_match
      check ((snapshot->>'rule_version')=rule_version) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_source_match') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_source_match
      check ((snapshot->>'source')=source) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_revision_match') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_revision_match
      check (case when coalesce(snapshot->>'revision','') ~ '^[0-9]+$' then (snapshot->>'revision')::integer=revision else false end) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_financial_revision_match') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_financial_revision_match
      check (financial_snapshot_revision=revision) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_financial_payload_revision_match') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_financial_payload_revision_match
      check (case when coalesce(snapshot->>'financial_snapshot_revision','') ~ '^[0-9]+$' then (snapshot->>'financial_snapshot_revision')::integer=financial_snapshot_revision else false end) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_payload_object') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_payload_object
      check (jsonb_typeof(snapshot)='object') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_operation_object') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_operation_object
      check (jsonb_typeof(snapshot->'operation')='object') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_squads_array') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_squads_array
      check (jsonb_typeof(snapshot->'squads')='array') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_integrity_object') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_integrity_object
      check (jsonb_typeof(snapshot->'integrity')='object') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname='strategy_result_snapshots_fingerprint_match') then
    alter table public.strategy_result_snapshots
      add constraint strategy_result_snapshots_fingerprint_match
      check (snapshot_fingerprint=md5(snapshot::text)) not valid;
  end if;
end;
$$;

create or replace function public.prevent_strategy_result_snapshot_mutation()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  raise exception 'strategy result snapshots are immutable' using errcode='55000';
end;
$$;

revoke all on function public.prevent_strategy_result_snapshot_mutation() from public;
revoke all on function public.prevent_strategy_result_snapshot_mutation() from authenticated;

drop trigger if exists strategy_result_snapshots_immutable_guard on public.strategy_result_snapshots;
create trigger strategy_result_snapshots_immutable_guard
before update or delete on public.strategy_result_snapshots
for each row
execute function public.prevent_strategy_result_snapshot_mutation();

-- ---------------------------------------------------------------------------
-- 4. ROI da operacao: em Todos, usa o total economico confirmado das naturezas
--    oficiais; linhas por Squad continuam usando o rateio economico da V2.60.5.
--    A diferenca fica exposta como parcela ainda nao rateada enquanto o mes abre.
-- ---------------------------------------------------------------------------
create or replace function public.get_strategy_result_roi_summary(
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
  v_code text;
  v_all boolean;
  v_result jsonb;
  v_direct_summary jsonb;
  v_influenced_summary jsonb;
  v_protected_summary jsonb;
  v_financial jsonb;
  v_costs jsonb;
  v_cost numeric;
  v_direct numeric;
  v_influenced numeric;
  v_protected numeric;
  v_protected_mrr numeric;
  v_alloc_direct numeric;
  v_alloc_influenced numeric;
  v_alloc_protected numeric;
  v_fte numeric;
  v_rows jsonb;
begin
  if not public.has_strategy_access('aggregates') then
    raise exception 'strategy aggregate ROI access denied' using errcode='42501';
  end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  v_result:=public.get_strategy_result_squad_summary(p_competence,p_squad_code);
  v_financial:=public.get_strategy_financial_summary(p_competence,p_squad_code);
  v_costs:=public.get_strategy_squad_cost_summary(p_competence);

  v_cost:=greatest(0,coalesce((v_financial->>'total_cost')::numeric,0));
  v_fte:=greatest(0,coalesce((v_financial->>'fte')::numeric,0));
  v_alloc_direct:=greatest(0,coalesce((v_result->>'direct_revenue')::numeric,0));
  v_alloc_influenced:=greatest(0,coalesce((v_result->>'influenced_revenue')::numeric,0));
  v_alloc_protected:=greatest(0,coalesce((v_result->>'protected_revenue')::numeric,0));

  if v_all then
    v_direct_summary:=public.get_strategy_direct_revenue_summary(p_competence,null);
    v_influenced_summary:=public.get_strategy_influenced_revenue_summary(p_competence,null);
    v_protected_summary:=public.get_strategy_protected_revenue_summary(p_competence,null);
    v_direct:=greatest(0,coalesce((v_direct_summary->>'revenue_total')::numeric,0));
    v_influenced:=greatest(0,coalesce((v_influenced_summary->>'influenced_revenue_total')::numeric,0));
    v_protected:=greatest(0,coalesce((v_protected_summary->>'protected_revenue_total')::numeric,0));
    v_protected_mrr:=greatest(0,coalesce((v_protected_summary->>'protected_mrr')::numeric,0));
  else
    v_direct:=v_alloc_direct;
    v_influenced:=v_alloc_influenced;
    v_protected:=v_alloc_protected;
    v_protected_mrr:=greatest(0,coalesce((v_result->>'protected_mrr')::numeric,0));
  end if;

  with result_rows as (
    select
      upper(trim(coalesce(x->>'squad_code',''))) squad_code,
      greatest(0,coalesce((x->>'direct_revenue')::numeric,0)) direct_revenue,
      greatest(0,coalesce((x->>'influenced_revenue')::numeric,0)) influenced_revenue,
      greatest(0,coalesce((x->>'protected_revenue')::numeric,0)) protected_revenue,
      greatest(0,coalesce((x->>'direct_mrr')::numeric,0)) direct_mrr,
      greatest(0,coalesce((x->>'influenced_mrr')::numeric,0)) influenced_mrr,
      greatest(0,coalesce((x->>'protected_mrr')::numeric,0)) protected_mrr
    from jsonb_array_elements(coalesce(v_result->'rows','[]'::jsonb)) x
  ), cost_rows as (
    select
      upper(trim(coalesce(x->>'squad_code',''))) squad_code,
      greatest(0,coalesce((x->>'total_cost')::numeric,0)) total_cost,
      greatest(0,coalesce((x->>'people_cost')::numeric,0)) people_cost,
      greatest(0,coalesce((x->>'operational_cost')::numeric,0)) operational_cost,
      greatest(0,coalesce((x->>'fte')::numeric,0)) fte
    from jsonb_array_elements(coalesce(v_costs,'[]'::jsonb)) x
    where v_all or upper(trim(coalesce(x->>'squad_code','')))=v_code
  ), codes as (
    select squad_code from result_rows where squad_code<>''
    union
    select squad_code from cost_rows where squad_code<>''
  ), joined as (
    select
      c.squad_code,
      coalesce(cr.total_cost,0) total_cost,
      coalesce(cr.people_cost,0) people_cost,
      coalesce(cr.operational_cost,0) operational_cost,
      coalesce(cr.fte,0) fte,
      coalesce(rr.direct_revenue,0) direct_revenue,
      coalesce(rr.influenced_revenue,0) influenced_revenue,
      coalesce(rr.protected_revenue,0) protected_revenue,
      coalesce(rr.direct_mrr,0) direct_mrr,
      coalesce(rr.influenced_mrr,0) influenced_mrr,
      coalesce(rr.protected_mrr,0) protected_mrr
    from codes c
    left join result_rows rr using(squad_code)
    left join cost_rows cr using(squad_code)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'squad_code',squad_code,
    'total_cost',round(total_cost,2),
    'people_cost',round(people_cost,2),
    'operational_cost',round(operational_cost,2),
    'fte',round(fte,2),
    'direct_revenue',round(direct_revenue,2),
    'influenced_revenue',round(influenced_revenue,2),
    'protected_revenue',round(protected_revenue,2),
    'direct_mrr',round(direct_mrr,2),
    'influenced_mrr',round(influenced_mrr,2),
    'protected_mrr',round(protected_mrr,2),
    'direct_net_return',round(direct_revenue-total_cost,2),
    'direct_roi_pct',case when total_cost>0 then round(((direct_revenue-total_cost)/total_cost*100)::numeric,2) else null end,
    'direct_cost_coverage',case when total_cost>0 then round((direct_revenue/total_cost)::numeric,4) else null end,
    'influenced_impact_per_cost',case when total_cost>0 then round((influenced_revenue/total_cost)::numeric,4) else null end,
    'protected_impact_per_cost',case when total_cost>0 then round((protected_revenue/total_cost)::numeric,4) else null end,
    'direct_revenue_per_fte',case when fte>0 then round((direct_revenue/fte)::numeric,2) else null end,
    'protected_mrr_per_fte',case when fte>0 then round((protected_mrr/fte)::numeric,2) else null end
  ) order by squad_code),'[]'::jsonb)
  into v_rows
  from joined;

  return jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'currency','BRL',
    'total_cost',round(v_cost,2),
    'fte',round(v_fte,2),
    'direct_revenue',round(v_direct,2),
    'influenced_revenue',round(v_influenced,2),
    'protected_revenue',round(v_protected,2),
    'unallocated_direct_revenue',case when v_all then round(greatest(0,v_direct-v_alloc_direct),2) else 0 end,
    'unallocated_influenced_revenue',case when v_all then round(greatest(0,v_influenced-v_alloc_influenced),2) else 0 end,
    'unallocated_protected_revenue',case when v_all then round(greatest(0,v_protected-v_alloc_protected),2) else 0 end,
    'direct_net_return',round(v_direct-v_cost,2),
    'direct_roi_pct',case when v_cost>0 then round(((v_direct-v_cost)/v_cost*100)::numeric,2) else null end,
    'direct_cost_coverage',case when v_cost>0 then round((v_direct/v_cost)::numeric,4) else null end,
    'influenced_impact_per_cost',case when v_cost>0 then round((v_influenced/v_cost)::numeric,4) else null end,
    'protected_impact_per_cost',case when v_cost>0 then round((v_protected/v_cost)::numeric,4) else null end,
    'direct_revenue_per_fte',case when v_fte>0 then round((v_direct/v_fte)::numeric,2) else null end,
    'protected_mrr_per_fte',case when v_fte>0 then round((v_protected_mrr/v_fte)::numeric,2) else null end,
    'rows',coalesce(v_rows,'[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_strategy_result_roi_summary(date,text) from public;
grant execute on function public.get_strategy_result_roi_summary(date,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Historico: seleciona uma revisao por competencia de forma deterministica,
--    exclui competencia reaberta e rejeita snapshot cujo contrato/fingerprint
--    esteja inconsistente. Nao recai silenciosamente para revisao antiga.
-- ---------------------------------------------------------------------------
create or replace function public.get_strategy_result_snapshot_history(
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
    raise exception 'strategy aggregate result history access denied' using errcode='42501';
  end if;

  select (public.current_profile()).organization_id into v_org;
  if v_org is null then
    raise exception 'active profile not found' using errcode='42501';
  end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  with ranked as (
    select
      srs.id,srs.competence_id,srs.revision,srs.snapshot_version,srs.rule_version,srs.source,
      srs.financial_snapshot_revision,srs.snapshot_fingerprint,srs.snapshot,srs.created_at,
      sc.competence,sc.status competence_status,
      row_number() over(
        partition by srs.competence_id
        order by srs.revision desc,
          case srs.source when 'close' then 0 else 1 end,
          srs.created_at desc,srs.id desc
      ) rn
    from public.strategy_result_snapshots srs
    join public.strategy_competences sc on sc.id=srs.competence_id
    where srs.organization_id=v_org
  ), latest as (
    select * from ranked where rn=1
  ), audited as (
    select
      l.*,
      (
        l.snapshot_version='RS-1.0.0'
        and l.snapshot_version=coalesce(l.snapshot->>'snapshot_version','')
        and l.rule_version=coalesce(l.snapshot->>'rule_version','')
        and l.source=coalesce(l.snapshot->>'source','')
        and case when coalesce(l.snapshot->>'revision','') ~ '^[0-9]+$' then (l.snapshot->>'revision')::integer=l.revision else false end
        and l.financial_snapshot_revision=l.revision
        and case when coalesce(l.snapshot->>'financial_snapshot_revision','') ~ '^[0-9]+$' then (l.snapshot->>'financial_snapshot_revision')::integer=l.financial_snapshot_revision else false end
        and jsonb_typeof(l.snapshot)='object'
        and jsonb_typeof(l.snapshot->'operation')='object'
        and jsonb_typeof(l.snapshot->'squads')='array'
        and jsonb_typeof(l.snapshot->'integrity')='object'
        and l.snapshot_fingerprint=md5(l.snapshot::text)
      ) contract_valid
    from latest l
  ), selected as (
    select
      a.*,
      case
        when v_all then coalesce(a.snapshot->'operation','{}'::jsonb)
        else coalesce((
          select value
          from jsonb_array_elements(coalesce(a.snapshot->'squads','[]'::jsonb)) value
          where upper(trim(coalesce(value->>'squad_code','')))=v_code
          limit 1
        ),'{}'::jsonb)
      end metric
    from audited a
    where a.competence_status='closed'
      and a.contract_valid
  ), rows as (
    select * from selected where metric<>'{}'::jsonb
  ), stats as (
    select
      count(*)::bigint latest_snapshot_count,
      count(*) filter (where competence_status='closed')::bigint closed_snapshot_count,
      count(*) filter (where competence_status<>'closed')::bigint reopened_competence_count,
      count(*) filter (where competence_status='closed' and contract_valid)::bigint eligible_snapshot_count,
      count(*) filter (where competence_status='closed' and not contract_valid)::bigint invalid_snapshot_count,
      count(*) filter (where competence_status='closed' and contract_valid and source='legacy_backfill')::bigint legacy_backfill_count
    from audited
  )
  select jsonb_build_object(
    'source_available',true,
    'squad_code',case when v_all then 'ALL' else v_code end,
    'snapshot_version','RS-1.0.0',
    'rule_version','RE-1.0.0-phase5-hardening',
    'hardening',jsonb_build_object(
      'version','RH-1.0.0',
      'latest_snapshot_count',s.latest_snapshot_count,
      'closed_snapshot_count',s.closed_snapshot_count,
      'eligible_snapshot_count',s.eligible_snapshot_count,
      'invalid_snapshot_count',s.invalid_snapshot_count,
      'reopened_competence_count',s.reopened_competence_count,
      'legacy_backfill_count',s.legacy_backfill_count
    ),
    'rows',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'competence',to_char(competence,'YYYY-MM'),
          'status','closed',
          'revision',revision,
          'snapshot_version',snapshot_version,
          'rule_version',rule_version,
          'source',source,
          'financial_snapshot_revision',financial_snapshot_revision,
          'snapshot_fingerprint',snapshot_fingerprint,
          'created_at',created_at
        ) || metric
        order by competence
      )
      from rows
    ),'[]'::jsonb)
  ) into v_result
  from stats s;

  return coalesce(v_result,jsonb_build_object(
    'source_available',true,
    'squad_code',case when v_all then 'ALL' else v_code end,
    'snapshot_version','RS-1.0.0',
    'rule_version','RE-1.0.0-phase5-hardening',
    'hardening',jsonb_build_object('version','RH-1.0.0','latest_snapshot_count',0,'closed_snapshot_count',0,'eligible_snapshot_count',0,'invalid_snapshot_count',0,'reopened_competence_count',0,'legacy_backfill_count',0),
    'rows','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_result_snapshot_history(text) from public;
grant execute on function public.get_strategy_result_snapshot_history(text) to authenticated;

comment on function public.validate_strategy_result_close_integrity() is
'V2.60.9: bloqueia o fechamento quando evento economico elegivel nao possui 100% de atribuicao efetiva.';
comment on function public.prevent_strategy_result_snapshot_mutation() is
'V2.60.9: impede update/delete de snapshots de Resultado para preservar a fotografia historica revisionada.';
comment on function public.get_strategy_result_roi_summary(date,text) is
'V2.60.9: ROI da operacao usa toda Receita Direta confirmada; linhas por Squad preservam o rateio economico e a parcela nao rateada fica auditavel.';
comment on function public.get_strategy_result_snapshot_history(text) is
'V2.60.9: historico fail-closed e deterministico; exclui competencias reabertas e snapshots com contrato ou fingerprint invalido.';
comment on table public.strategy_result_snapshots is
'V2.60.9: snapshots de Resultado revisionados, imutaveis, validados por contrato/fingerprint e consumidos somente por RPC agregada.';

notify pgrst,'reload schema';
commit;
