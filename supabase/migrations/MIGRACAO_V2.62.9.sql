-- V2.62.9 - Hardening de cenarios historicos (aplicar apos V2.62.8).
-- O motor economico continua no frontend. Esta migration impõe INVARIANTES
-- sobre os valores recebidos no banco e impede revisoes adulteradas.
begin;

create or replace function public.strategy_scenario_guard_revision()
returns trigger
language plpgsql security invoker set search_path=pg_catalog,public
as $$
declare
  v_scenario text;
  v_field text;
  v_metrics jsonb;
  v_assumptions jsonb;
  v_reference jsonb;
  v_delta jsonb;
  v_current jsonb;
  v_numeric numeric;
  v_total numeric;
  v_direct numeric;
  v_fte numeric;
  v_required numeric;
  v_gap numeric;
begin
  if tg_op <> 'INSERT' then
    raise exception 'Revisoes de cenarios sao imutaveis' using errcode='42501';
  end if;
  if auth.uid() is not null and (
    new.created_by is distinct from auth.uid() or
    new.organization_id is distinct from (public.current_profile()).organization_id or
    not public.has_strategy_access('aggregates') or
    not public.has_strategy_access('edit_costs') or
    not public.has_strategy_access('people_costs')
  ) then
    raise exception 'Escopo ou permissao invalida para salvar cenario' using errcode='42501';
  end if;
  if not exists (
    select 1 from public.strategy_competences c
    where c.id = new.competence_id and c.organization_id = new.organization_id and c.competence = new.competence
  ) then
    raise exception 'Competencia e organizacao nao conciliadas' using errcode='23514';
  end if;
  if new.projection->>'official' is distinct from 'false' or
     new.projection->>'persisted' is distinct from 'false' or
     new.projection->>'competence' is distinct from to_char(new.competence,'YYYY-MM') or
     upper(coalesce(new.projection->>'squadCode','')) <> new.squad_code or
     coalesce(new.projection->>'revision','') <> coalesce(new.baseline_revision::text,'') or
     new.projection->>'ruleVersion' is distinct from 'SC-COMPARISON-1.0.0' or
     jsonb_typeof(new.projection->'delta') is distinct from 'object' or
     octet_length(new.projection::text)>180000 or octet_length(new.assumptions::text)>12000 then
    raise exception 'Identidade, versao ou tamanho da projecao invalido' using errcode='23514';
  end if;

  for v_scenario in select unnest(array['current','optimistic','conservative','custom']) loop
    v_metrics := new.projection #> array['scenarios',v_scenario,'metrics'];
    v_assumptions := new.assumptions->v_scenario;
    v_reference := new.projection #> array['scenarios',v_scenario,'assumptions'];
    v_delta := new.projection->'delta'->v_scenario;
    if jsonb_typeof(v_metrics) is distinct from 'object' or
       jsonb_typeof(v_assumptions) is distinct from 'object' or
       v_assumptions is distinct from v_reference or
       jsonb_typeof(v_delta) is distinct from 'object' then
      raise exception 'Estrutura ou premissas incoerentes: %',v_scenario using errcode='23514';
    end if;
    for v_field in select unnest(array['attendance','availableFte','requiredFte','utilizationPct','idleFte','overloadFte','gapFte',
      'directRevenue','influencedRevenue','protectedRevenue','peopleCost','operationalCost','totalCost','directNet','directRoiPct']) loop
      if not (v_metrics ? v_field) or
         jsonb_typeof(v_metrics->v_field) not in ('number','null') or
         not (v_delta ? v_field) or
         jsonb_typeof(v_delta->v_field) not in ('number','null') then
        raise exception 'Metrica ou delta invalido: %.%',v_scenario,v_field using errcode='23514';
      end if;
      if jsonb_typeof(v_metrics->v_field)='number' then
        v_numeric := (v_metrics->>v_field)::numeric;
        if abs(v_numeric)>1000000000000000 or (v_field not in ('gapFte','directNet','directRoiPct') and v_numeric<0) or
           (v_field='attendance' and v_numeric<>trunc(v_numeric)) then
          raise exception 'Valor fora do dominio: %.%',v_scenario,v_field using errcode='23514';
        end if;
      end if;
      v_current := new.projection #> array['scenarios','current','metrics',v_field];
      if jsonb_typeof(v_current) not in ('number','null') then
        raise exception 'Base atual incompleta para %',v_field using errcode='23514';
      end if;
      if jsonb_typeof(v_current)='number' and jsonb_typeof(v_metrics->v_field)='number' then
        if jsonb_typeof(v_delta->v_field) is distinct from 'number' or
           abs((v_delta->>v_field)::numeric - ((v_metrics->>v_field)::numeric - (new.projection #>> array['scenarios','current','metrics',v_field])::numeric))>0.00001 then
          raise exception 'Delta incompativel com a base atual: %.%',v_scenario,v_field using errcode='23514';
        end if;
      elsif jsonb_typeof(v_delta->v_field) is distinct from 'null' then
        raise exception 'Delta sem fonte numerica: %.%',v_scenario,v_field using errcode='23514';
      end if;
    end loop;

    for v_field in select unnest(array['demandPct','directRevenue','influencedRevenue','protectedRevenue','peopleCost','operationalCost']) loop
      if jsonb_typeof(v_assumptions->v_field) is distinct from 'number' or
         (v_assumptions->>v_field)::numeric not between -100 and 300 then
        raise exception 'Percentual de premissa invalido: %.%',v_scenario,v_field using errcode='23514';
      end if;
    end loop;
    for v_field in select unnest(array['hires','exits','transfersIn','transfersOut']) loop
      if jsonb_typeof(v_assumptions->v_field) is distinct from 'number' or
         (v_assumptions->>v_field)::numeric not between 0 and 1000 or
         (v_assumptions->>v_field)::numeric<>trunc((v_assumptions->>v_field)::numeric) then
        raise exception 'Movimentacao de equipe invalida: %.%',v_scenario,v_field using errcode='23514';
      end if;
    end loop;
    for v_field in select unnest(array['currentHours','newHours']) loop
      if jsonb_typeof(v_assumptions->v_field) is distinct from 'number' or
         (v_assumptions->>v_field)::numeric<=0 or (v_assumptions->>v_field)::numeric>60 then
        raise exception 'Jornada invalida: %.%',v_scenario,v_field using errcode='23514';
      end if;
    end loop;
    if jsonb_typeof(v_metrics->'totalCost')='number' then
      if jsonb_typeof(v_metrics->'peopleCost') is distinct from 'number' or
         jsonb_typeof(v_metrics->'operationalCost') is distinct from 'number' or
         jsonb_typeof(v_metrics->'directRevenue') is distinct from 'number' or
         jsonb_typeof(v_metrics->'directNet') is distinct from 'number' then
        raise exception 'Componentes do custo ou resultado ausentes' using errcode='23514';
      end if;
      v_total:=(v_metrics->>'totalCost')::numeric;
      v_direct:=(v_metrics->>'directRevenue')::numeric;
      if abs(v_total-((v_metrics->>'peopleCost')::numeric+(v_metrics->>'operationalCost')::numeric))>0.075 or
         abs((v_metrics->>'directNet')::numeric-(v_direct-v_total))>0.075 then
        raise exception 'Total de custos ou retorno liquido nao conciliado' using errcode='23514';
      end if;
      if v_total=0 then
        if jsonb_typeof(v_metrics->'directRoiPct') is distinct from 'null' then
          raise exception 'ROI deve ser indisponivel quando custo e zero' using errcode='23514';
        end if;
      elsif jsonb_typeof(v_metrics->'directRoiPct') is distinct from 'number' or
            abs((v_metrics->>'directRoiPct')::numeric-((v_direct-v_total)/v_total*100))>0.015 then
        raise exception 'ROI direto nao conciliado' using errcode='23514';
      end if;
    end if;
    if jsonb_typeof(v_metrics->'gapFte')='number' then
      if jsonb_typeof(v_metrics->'availableFte') is distinct from 'number' or
         jsonb_typeof(v_metrics->'requiredFte') is distinct from 'number' or
         jsonb_typeof(v_metrics->'idleFte') is distinct from 'number' or
         jsonb_typeof(v_metrics->'overloadFte') is distinct from 'number' then
        raise exception 'Componentes de capacidade ausentes' using errcode='23514';
      end if;
      v_fte:=(v_metrics->>'availableFte')::numeric;
      v_required:=(v_metrics->>'requiredFte')::numeric;
      v_gap:=(v_metrics->>'gapFte')::numeric;
      if abs(v_gap-(v_fte-v_required))>0.00001 or
         abs((v_metrics->>'idleFte')::numeric-greatest(0,v_gap))>0.00001 or
         abs((v_metrics->>'overloadFte')::numeric-greatest(0,-v_gap))>0.00001 then
        raise exception 'Gap, ociosidade ou utilizacao inconsistentes' using errcode='23514';
      end if;
      if v_fte>0 and (jsonb_typeof(v_metrics->'utilizationPct') is distinct from 'number' or
          abs((v_metrics->>'utilizationPct')::numeric-(v_required/v_fte*100))>0.0001) then
        raise exception 'Utilizacao projetada inconsistente' using errcode='23514';
      end if;
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.strategy_scenario_guard_revision() from public,anon,authenticated;
drop trigger if exists strategy_scenario_revision_guard on public.strategy_scenario_revisions;
create trigger strategy_scenario_revision_guard
before insert or update or delete on public.strategy_scenario_revisions
for each row execute function public.strategy_scenario_guard_revision();

-- Apenas novos registros receberao a versao endurecida. Historico anterior segue imutavel.
alter table public.strategy_scenario_revisions alter column rule_version set default 'SC-HISTORY-1.1.0';
revoke insert,update,delete,truncate on public.strategy_scenario_revisions from public,anon,authenticated;
commit;
