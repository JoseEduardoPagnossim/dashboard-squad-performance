-- V2.63.9: hardening da Fase 8. Executar somente apos MIGRACAO_V2.63.8.sql.
-- Nao altera valores existentes; revisa preflight do fechamento e blinda historicos.
begin;

-- Reaplicar a previa V2.63.8 preservando a assinatura publica, com guardas de origem.
create or replace function public.strategy_bonus_reconciliation_preview_v2638(p_competence date)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_comp record;r record;v_op record;v_src numeric;v_text text;v_fp text;v_expected text;
 v_state text;v_kind text;v_count int;v_match_count int;v_snapshot_final numeric;v_link record;
 v_rows jsonb:='[]'::jsonb;v_churn jsonb:='[]'::jsonb;v_issues int:=0;v_churn_issues int:=0;v_total numeric:=0;
 v_com_count int;v_pending int;v_auth_fp text;v_approved_total numeric;v_approval record;v_row jsonb;v_churn_state text;
begin
 if auth.uid() is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Acesso financeiro estrategico negado.' using errcode='42501';end if;
 v_org:=(select (public.current_profile()).organization_id);
 if v_org is null or p_competence is null or extract(day from p_competence)<>1 then raise exception 'Organizacao/competencia invalida.';end if;
 select * into v_comp from public.strategy_competences where organization_id=v_org and competence=p_competence;
 if v_comp.id is null then raise exception 'Crie a competencia estrategica antes da reconciliacao.';end if;
 for r in
  select p.id person_id,p.name,p.user_id,p.default_squad_code squad,pr.role,
         ec.id cost_id,ec.variable_pay,ec.fte
  from public.strategy_people p
  join public.profiles pr on pr.user_id=p.user_id and pr.organization_id=p.organization_id and pr.active=true
  left join public.strategy_employee_costs ec on ec.person_id=p.id and ec.organization_id=v_org and ec.competence_id=v_comp.id
  where p.organization_id=v_org and p.active=true and pr.role in ('technician','pre_attendance')
   and (ec.id is not null or exists(select 1 from public.strategy_sales_commissions c where c.person_id=p.id and c.organization_id=v_org and c.competence=p_competence))
  order by p.name,p.id
 loop
  v_src:=null;v_fp:=null;v_state:='source_missing';v_kind:=case when r.role='pre_attendance' then 'pre_attendance_approved' else 'technician_official' end;
  if r.role='pre_attendance' then
   if r.squad<>'C' then v_state:='squad_mismatch';else
    select count(*),count(*) filter(where status<>'calculated'),md5(coalesce(string_agg(id::text||':'||status||':'||coalesce(commission_amount::text,'?'),',' order by id),'EMPTY')),coalesce(sum(commission_amount),0)
    into v_com_count,v_pending,v_auth_fp,v_approved_total from public.strategy_sales_commissions where organization_id=v_org and person_id=r.person_id and competence=p_competence;
    select * into v_approval from public.strategy_pre_bonus_approvals_v2638 where organization_id=v_org and person_id=r.person_id and competence=p_competence order by revision desc limit 1;
    if v_pending>0 then v_state:='commission_pending';
    elsif v_approval.id is null then v_state:='approval_pending';
    elsif v_approval.source_fingerprint<>v_auth_fp or v_approval.sales_count<>v_com_count then v_state:='approval_outdated';
    elsif v_approval.amount is distinct from round(v_approved_total,2) then v_state:='approved_amount_mismatch';
    else v_src:=v_approval.amount;v_fp:=v_approval.source_fingerprint;v_state:='ready';end if;
   end if;
  else
   select count(*) into v_count from public.technician_monthly tm
    join public.squad_months sm on sm.id=tm.squad_month_id join public.squads s on s.id=sm.squad_id
    where s.organization_id=v_org and upper(s.code::text)=upper(coalesce(r.squad,'')) and tm.user_id=r.user_id
      and sm.year=extract(year from p_competence)::int and sm.month=extract(month from p_competence)::int;
   if v_count<>1 then v_state:=case when v_count>1 then 'ambiguous_operational_month' else 'operational_month_missing' end;
   else
    select sm.id month_id,sm.is_closed,sm.closed_snapshot,tm.technician_name,tfm.calculated
    into v_op from public.technician_monthly tm join public.squad_months sm on sm.id=tm.squad_month_id
    join public.squads s on s.id=sm.squad_id left join public.technician_finance_monthly tfm on tfm.technician_month_id=tm.id
    where s.organization_id=v_org and upper(s.code::text)=upper(coalesce(r.squad,'')) and tm.user_id=r.user_id
      and sm.year=extract(year from p_competence)::int and sm.month=extract(month from p_competence)::int limit 1;
    if not coalesce(v_op.is_closed,false) then v_state:='operational_month_open';
    elsif coalesce(v_op.calculated->>'final','') !~ '^\d+(\.\d{1,2})?$' then v_state:='official_bonus_missing';
    else
     -- A memoria do fechamento precisa confirmar o valor individual calculado.
     select count(*),max((e.value->'financeData'->>'final')::numeric)
       into v_match_count,v_snapshot_final
       from jsonb_array_elements(case when jsonb_typeof(v_op.closed_snapshot->'technicians')='array' then v_op.closed_snapshot->'technicians' else '[]'::jsonb end) e
       where lower(trim(e.value->>'name'))=lower(trim(v_op.technician_name))
         and coalesce(e.value->'financeData'->>'final','') ~ '^\d+(\.\d{1,2})?$';
     v_src:=(v_op.calculated->>'final')::numeric;
     if v_match_count<>1 or v_snapshot_final is distinct from v_src then v_state:='official_snapshot_mismatch';v_src:=null;
     else v_fp:=md5(v_op.month_id::text||':'||v_op.technician_name||':'||v_src::text||':'||coalesce(v_op.closed_snapshot->>'financeRuleFingerprint',''));v_state:='ready';end if;
    end if;
   end if;
  end if;
  select * into v_link from public.strategy_bonus_cost_links_v2638 where organization_id=v_org and competence_id=v_comp.id and person_id=r.person_id;
  if v_state='ready' then
   if r.cost_id is null then v_state:='cost_row_missing';
   elsif coalesce(r.fte,0)<>1 then v_state:='fte_not_one';
   elsif v_link.person_id is not null and (v_link.source_fingerprint is distinct from v_fp or v_link.amount is distinct from v_src) then
     v_state:=case when r.variable_pay=v_link.amount then 'needs_resync' else 'manual_conflict' end;
   elsif v_link.person_id is not null and r.variable_pay=v_src and v_link.source_fingerprint=v_fp then v_state:='synced';
   elsif v_link.person_id is not null and r.variable_pay is distinct from v_link.amount then v_state:='manual_conflict';
   elsif coalesce(r.variable_pay,0)<>0 then v_state:='manual_conflict';
   else v_state:='needs_sync';end if;
  end if;
  if v_state<>'synced' then v_issues:=v_issues+1;end if;
  if v_src is not null then v_total:=v_total+v_src;end if;
  v_row:=jsonb_build_object('person_id',r.person_id,'person_name',r.name,'squad_code',r.squad,'profile',r.role,
    'source_type',v_kind,'amount',v_src,'source_fingerprint',v_fp,'variable_pay',r.variable_pay,'fte',r.fte,
    'status',v_state,'cost_id',r.cost_id);
  v_rows:=v_rows||jsonb_build_array(v_row);
 end loop;
 for v_op in
  select s.code::text squad,sm.is_closed,sm.finance_month_data,
         (sm.closed_snapshot->'financeMonthData') as closed_finance_month_data
   from public.squad_months sm join public.squads s on s.id=sm.squad_id
   where s.organization_id=v_org and sm.year=extract(year from p_competence)::int and sm.month=extract(month from p_competence)::int
   order by s.code
 loop
  -- Nunca fazer fallback para dados editaveis quando o mes operacional esta fechado.
  -- Caso o snapshot oficial esteja ausente, deixar pendencia explicita.
  if coalesce(v_op.is_closed,false) then
   v_row:=v_op.closed_finance_month_data;
   v_churn_state:='official_closed';
   if v_row is null or jsonb_typeof(v_row)<>'object' then v_churn_state:='missing_closed_snapshot';end if;
  else
   v_row:=v_op.finance_month_data;
   v_churn_state:='provisional';
  end if;
  if v_churn_state='official_closed' and (
     coalesce(v_row->>'customersStart','') !~ '^[0-9]{1,9}$'
     or coalesce(v_row->>'canceledCount','') !~ '^[0-9]{1,9}$'
     or (case when coalesce(v_row->>'customersStart','') ~ '^[0-9]{1,9}$'
                   and coalesce(v_row->>'canceledCount','') ~ '^[0-9]{1,9}$'
          then (v_row->>'canceledCount')::numeric > (v_row->>'customersStart')::numeric else true end)
     ) then v_churn_state:='invalid_closed_cancellations';end if;
  if v_churn_state<>'official_closed' then v_churn_issues:=v_churn_issues+1;end if;
  v_churn:=v_churn||jsonb_build_array(jsonb_build_object('squad_code',v_op.squad,'operational_closed',coalesce(v_op.is_closed,false),
   'customers_start',case when coalesce(v_row->>'customersStart','') ~ '^[0-9]{1,9}$' then (v_row->>'customersStart')::int else null end,
   'cancellations',case when coalesce(v_row->>'canceledCount','') ~ '^[0-9]{1,9}$' then (v_row->>'canceledCount')::int else null end,
   'status',v_churn_state));
 end loop;
 -- Fechamento vazio, sem custo nem fonte operacional, requer revisao humana.
 if jsonb_array_length(v_rows)=0 and jsonb_array_length(v_churn)=0 then v_churn_issues:=v_churn_issues+1;end if;
 return jsonb_build_object('competence',to_char(p_competence,'YYYY-MM'),'strategy_status',v_comp.status,'people',v_rows,
    'issues',v_issues+v_churn_issues,'bonus_issues',v_issues,'cancellation_issues',v_churn_issues,'bonus_total',round(v_total,2),'cancellations_by_squad',v_churn,'ready_to_close',v_issues=0 and v_churn_issues=0);
end $$;


-- Garantir que o fechamento confira as mesmas permissoes do preflight.
-- Usar a implementacao atual do wrapper com um unico ajuste de permissao.
create or replace function public.close_strategy_competence(p_competence date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_comp record;v_preview jsonb;v_result jsonb;v_snap uuid;v_s text;
begin
 if auth.uid() is null or not public.has_strategy_access('close_competence') or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Acesso de fechamento financeiro negado.' using errcode='42501';end if;
 v_org:=(select (public.current_profile()).organization_id);
 select * into v_comp from public.strategy_competences where organization_id=v_org and competence=p_competence for update;
 if v_comp.id is null then raise exception 'Competencia nao encontrada.';end if;
 if v_comp.status='closed' then return public.close_strategy_competence_core_v2638(p_competence);end if;
 v_preview:=public.strategy_bonus_reconciliation_preview_v2638(p_competence);
 if (v_preview->>'issues')::int>0 then raise exception 'Fechamento financeiro bloqueado: % pendencia(s) de Bonificacao. Consulte V2.63.8.',v_preview->>'issues' using errcode='23514';end if;
 v_result:=public.close_strategy_competence_core_v2638(p_competence);
 select id into v_snap from public.strategy_competence_snapshots where organization_id=v_org and competence_id=v_comp.id and revision=(v_result->>'revision')::int;
 if v_snap is null then raise exception 'Snapshot financeiro oficial nao foi encontrado.';end if;
 v_s:=md5(v_preview::text||':'||v_snap::text);
 insert into public.strategy_financial_closure_v2638(organization_id,competence_id,revision,finance_snapshot_id,bonus_snapshot,cancellation_snapshot,snapshot_fingerprint,closed_by)
 values(v_org,v_comp.id,(v_result->>'revision')::int,v_snap,v_preview->'people',v_preview->'cancellations_by_squad',v_s,auth.uid());
 return v_result||jsonb_build_object('phase8_snapshot_fingerprint',v_s,'phase8_bonus_total',v_preview->'bonus_total');
end $$;


-- Historicos consumados sao append-only. Links de custo continuam atualizaveis
-- exclusivamente via RPC de conciliacao; nao aplica gatilho nesses links.
create or replace function public.strategy_phase8_immutable_guard_v2639()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 raise exception 'Historico comercial/financeiro imutavel: realize ajuste auditado em uma nova revisao.' using errcode='55000';
end $$;
revoke all on function public.strategy_phase8_immutable_guard_v2639() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array[
  'strategy_recurring_sales','strategy_recurring_import_attempts',
  'strategy_merchandise_sales','strategy_merchandise_import_attempts',
  'strategy_sales_commissions','strategy_pre_bonus_approvals_v2638',
  'strategy_bonus_sync_audit_v2638','strategy_financial_closure_v2638'
 ] loop
  execute format('drop trigger if exists phase8_immutable_guard_v2639 on public.%I',t);
  execute format('create trigger phase8_immutable_guard_v2639 before update or delete on public.%I for each row execute function public.strategy_phase8_immutable_guard_v2639()',t);
 end loop;
end $$;

-- Depois do CREATE OR REPLACE, manter execucao restrita a usuarios autenticados.
revoke all on function public.strategy_bonus_reconciliation_preview_v2638(date) from public,anon;
revoke all on function public.close_strategy_competence(date) from public,anon;
revoke all on function public.close_strategy_competence_core_v2638(date) from public,anon,authenticated;
grant execute on function public.strategy_bonus_reconciliation_preview_v2638(date) to authenticated;
grant execute on function public.close_strategy_competence(date) to authenticated;
notify pgrst,'reload schema';
commit;
