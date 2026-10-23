-- Soften Performance Hub V2.58.9
-- Hardening da Fase 3: integridade da base de resolucoes e dos snapshots de eficiencia.
-- Objetivos:
-- 1) impedir resolucoes impossiveis (> atendimentos operacionais do tecnico);
-- 2) normalizar nome/Squad antes da persistencia;
-- 3) manter competencias fechadas imutaveis mesmo fora do fluxo normal de RLS;
-- 4) reforcar o contrato revisionado dos snapshots sem reescrever historico existente.

begin;

create or replace function public.validate_strategy_resolution_metric_integrity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_comp record;
  v_attendance numeric := 0;
  v_matches bigint := 0;
begin
  -- ON DELETE SET NULL de auth.users precisa continuar preservando o historico.
  -- Quando somente o user_id e limpo pela FK, nao revalida a competencia fechada.
  if tg_op='UPDATE'
     and old.user_id is not null and new.user_id is null
     and new.organization_id is not distinct from old.organization_id
     and new.competence_id is not distinct from old.competence_id
     and new.technician_name_snapshot is not distinct from old.technician_name_snapshot
     and new.squad_code_snapshot is not distinct from old.squad_code_snapshot
     and new.resolutions is not distinct from old.resolutions
     and new.source is not distinct from old.source
     and new.notes is not distinct from old.notes then
    return new;
  end if;

  new.technician_name_snapshot := btrim(coalesce(new.technician_name_snapshot,''));
  new.squad_code_snapshot := upper(btrim(coalesce(new.squad_code_snapshot,'')));

  if new.technician_name_snapshot='' then
    raise exception 'strategy resolution technician name is required' using errcode='23514';
  end if;
  if new.squad_code_snapshot='' then
    raise exception 'strategy resolution squad code is required' using errcode='23514';
  end if;
  if coalesce(new.resolutions,0)<0 then
    raise exception 'strategy resolutions cannot be negative' using errcode='23514';
  end if;

  select sc.id,sc.organization_id,sc.competence,sc.status
    into v_comp
  from public.strategy_competences sc
  where sc.id=new.competence_id;

  if v_comp.id is null then
    raise exception 'strategy competence not found' using errcode='23503';
  end if;
  if v_comp.organization_id is distinct from new.organization_id then
    raise exception 'strategy resolution organization mismatch' using errcode='23514';
  end if;
  if v_comp.status='closed' then
    raise exception 'strategy resolution metric is immutable while competence is closed' using errcode='23514';
  end if;

  -- Resolucao positiva precisa possuir identidade operacional verificavel.
  if new.user_id is null then
    if new.resolutions>0 then
      raise exception 'strategy resolution user link is required for positive resolutions' using errcode='23514';
    end if;
    return new;
  end if;

  select coalesce(sum(tm.att),0)::numeric,count(tm.id)::bigint
    into v_attendance,v_matches
  from public.squads s
  join public.squad_months sm on sm.squad_id=s.id
  join public.technician_monthly tm on tm.squad_month_id=sm.id
  where s.organization_id=new.organization_id
    and upper(s.code)=new.squad_code_snapshot
    and sm.year=extract(year from v_comp.competence)::int
    and sm.month=extract(month from v_comp.competence)::int
    and tm.user_id=new.user_id;

  if new.resolutions>coalesce(v_attendance,0) then
    raise exception 'resolutions exceed operational attendance (% > %) for this technician and competence',new.resolutions,coalesce(v_attendance,0)
      using errcode='23514';
  end if;

  -- Se nao ha linha operacional, somente zero e aceito. Isso evita que CSV/API
  -- criem produtividade economica sem uma base de atendimento correspondente.
  if v_matches=0 and new.resolutions>0 then
    raise exception 'operational attendance base not found for strategy resolution metric' using errcode='23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_strategy_resolution_metric_integrity() from public;
revoke all on function public.validate_strategy_resolution_metric_integrity() from authenticated;

drop trigger if exists strategy_resolution_metrics_integrity_guard on public.strategy_resolution_metrics;
create trigger strategy_resolution_metrics_integrity_guard
before insert or update of organization_id,competence_id,user_id,technician_name_snapshot,squad_code_snapshot,resolutions,source,notes
on public.strategy_resolution_metrics
for each row
execute function public.validate_strategy_resolution_metric_integrity();

-- Novos snapshots precisam apontar para a mesma revisao do snapshot financeiro.
-- NOT VALID preserva registros historicos ja existentes caso haja legado divergente,
-- mas passa a impedir novos registros inconsistentes.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='strategy_efficiency_snapshots_financial_revision_match'
      and conrelid='public.strategy_efficiency_snapshots'::regclass
  ) then
    alter table public.strategy_efficiency_snapshots
      add constraint strategy_efficiency_snapshots_financial_revision_match
      check (financial_snapshot_revision=revision) not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='strategy_efficiency_snapshots_payload_object'
      and conrelid='public.strategy_efficiency_snapshots'::regclass
  ) then
    alter table public.strategy_efficiency_snapshots
      add constraint strategy_efficiency_snapshots_payload_object
      check (jsonb_typeof(snapshot)='object') not valid;
  end if;
end;
$$;

comment on function public.validate_strategy_resolution_metric_integrity() is
'V2.58.9: valida integridade da base explicita de resolucoes contra a producao operacional e preserva imutabilidade de competencia fechada.';

notify pgrst,'reload schema';
commit;
