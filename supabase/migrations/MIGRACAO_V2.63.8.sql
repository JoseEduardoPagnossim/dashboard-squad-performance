-- V2.63.8: reconciliacao de Bonificacao oficial com custo estrategico,
-- aprovacao de Pre-atendimento, cancelamentos por Squad e fechamento revisionado.
-- Executar apos a V2.63.7. Idempotente quanto a esquema e wrapper do fechamento.
begin;

create table if not exists public.strategy_pre_bonus_approvals_v2638 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence date not null,
 person_id uuid not null references public.strategy_people(id),
 amount numeric(14,2) not null check(amount>=0),
 revision integer not null default 1 check(revision>0),
 sales_count int not null check(sales_count>=0),
 source_fingerprint text not null,
 approved_by uuid not null references auth.users(id),
 approved_at timestamptz not null default now(),
 unique(organization_id,competence,person_id,revision),
 check(extract(day from competence)=1)
);
create table if not exists public.strategy_bonus_cost_links_v2638 (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id) on delete cascade,
 person_id uuid not null references public.strategy_people(id),
 source_type text not null check(source_type in ('technician_official','pre_attendance_approved')),
 amount numeric(14,2) not null check(amount>=0),
 source_fingerprint text not null,
 synced_by uuid not null references auth.users(id),
 synced_at timestamptz not null default now(),
 primary key(organization_id,competence_id,person_id)
);
create table if not exists public.strategy_bonus_sync_audit_v2638 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id),
 person_id uuid not null references public.strategy_people(id),
 previous_pay numeric(14,2) not null,
 new_pay numeric(14,2) not null,
 previous_fingerprint text,
 new_fingerprint text not null,
 synced_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.strategy_financial_closure_v2638 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id),
 revision integer not null check(revision>0),
 finance_snapshot_id uuid not null references public.strategy_competence_snapshots(id),
 bonus_snapshot jsonb not null,
 cancellation_snapshot jsonb not null,
 snapshot_fingerprint text not null,
 closed_by uuid not null references auth.users(id),
 closed_at timestamptz not null default now(),
 unique(organization_id,competence_id,revision)
);
create index if not exists strategy_bonus_cost_links_month_v2638 on public.strategy_bonus_cost_links_v2638(organization_id,competence_id);
create index if not exists strategy_pre_bonus_month_v2638 on public.strategy_pre_bonus_approvals_v2638(organization_id,competence);

-- Dados sensiveis apenas para gestores habilitados. Gravação somente via RPC.
do $$ declare t text;begin
 foreach t in array array['strategy_pre_bonus_approvals_v2638','strategy_bonus_cost_links_v2638','strategy_bonus_sync_audit_v2638','strategy_financial_closure_v2638'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('drop policy if exists %I on public.%I',t||'_view',t);
  execute format('create policy %I on public.%I for select to authenticated using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access(''people_costs'') and public.has_strategy_access(''edit_costs''))',t||'_view',t);
 end loop;
end $$;

-- Grants explícitos para inspeção estática e Data API. Todas as mutações seguem apenas por RPC.
grant select on public.strategy_pre_bonus_approvals_v2638 to authenticated;
grant select on public.strategy_bonus_cost_links_v2638 to authenticated;
grant select on public.strategy_bonus_sync_audit_v2638 to authenticated;
grant select on public.strategy_financial_closure_v2638 to authenticated;

-- Prévia estritamente de leitura. Fontes oficiais: mês de Suporte FECHADO,
-- resultado calculado persistido e fotografia de fechamento da Bonificação.
-- Pré-atendimento: aprovação explícita e congelada das comissões já apuradas.
create or replace function public.strategy_bonus_reconciliation_preview_v2638(p_competence date)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_comp record;r record;v_op record;v_src numeric;v_text text;v_fp text;v_expected text;
 v_state text;v_kind text;v_count int;v_match_count int;v_snapshot_final numeric;v_link record;
 v_rows jsonb:='[]'::jsonb;v_churn jsonb:='[]'::jsonb;v_issues int:=0;v_churn_issues int:=0;v_total numeric:=0;
 v_com_count int;v_pending int;v_auth_fp text;v_approval record;v_row jsonb;
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
    select count(*),count(*) filter(where status<>'calculated'),md5(coalesce(string_agg(id::text||':'||status||':'||coalesce(commission_amount::text,'?'),',' order by id),'EMPTY'))
    into v_com_count,v_pending,v_auth_fp from public.strategy_sales_commissions where organization_id=v_org and person_id=r.person_id and competence=p_competence;
    select * into v_approval from public.strategy_pre_bonus_approvals_v2638 where organization_id=v_org and person_id=r.person_id and competence=p_competence order by revision desc limit 1;
    if v_pending>0 then v_state:='commission_pending';
    elsif v_approval.id is null then v_state:='approval_pending';
    elsif v_approval.source_fingerprint<>v_auth_fp or v_approval.sales_count<>v_com_count then v_state:='approval_outdated';
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
  v_row:=case when coalesce(v_op.is_closed,false) then coalesce(v_op.closed_finance_month_data,v_op.finance_month_data) else v_op.finance_month_data end;
  if not coalesce(v_op.is_closed,false)
     or coalesce(v_row->>'customersStart','') !~ '^\d+$'
     or coalesce(v_row->>'canceledCount','') !~ '^\d+$' then
     v_churn_issues:=v_churn_issues+1;
  end if;
  v_churn:=v_churn||jsonb_build_array(jsonb_build_object('squad_code',v_op.squad,'operational_closed',coalesce(v_op.is_closed,false),
   'customers_start',case when coalesce(v_row->>'customersStart','') ~ '^\d+$' then (v_row->>'customersStart')::int else null end,
   'cancellations',case when coalesce(v_row->>'canceledCount','') ~ '^\d+$' then (v_row->>'canceledCount')::int else null end,
   'status',case when not coalesce(v_op.is_closed,false) then 'provisional' else 'official_closed' end));
 end loop;
 return jsonb_build_object('competence',to_char(p_competence,'YYYY-MM'),'strategy_status',v_comp.status,'people',v_rows,
    'issues',v_issues+v_churn_issues,'bonus_issues',v_issues,'cancellation_issues',v_churn_issues,'bonus_total',round(v_total,2),'cancellations_by_squad',v_churn,'ready_to_close',v_issues=0 and v_churn_issues=0);
end $$;

create or replace function public.strategy_approve_pre_bonus_v2638(p_competence date,p_person_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_comp uuid;v_count int;v_pending int;v_total numeric;v_fp text;v_old record;v_name text;
begin
 if auth.uid() is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Acesso negado.' using errcode='42501';end if;
 v_org:=(select (public.current_profile()).organization_id);
 select id into v_comp from public.strategy_competences where organization_id=v_org and competence=p_competence and status<>'closed' for update;
 if v_comp is null then raise exception 'Competencia invalida ou fechada.';end if;
 select p.name into v_name from public.strategy_people p join public.profiles pr on pr.user_id=p.user_id and pr.organization_id=v_org and pr.role='pre_attendance' and pr.active=true
 where p.id=p_person_id and p.organization_id=v_org and p.active=true and p.functional_team='pre_attendance' and p.default_squad_code='C';
 if v_name is null then raise exception 'Pessoa do Pre-atendimento ativa e vinculada nao encontrada.';end if;
 select count(*),count(*) filter(where status<>'calculated'),coalesce(sum(commission_amount),0),
 md5(coalesce(string_agg(id::text||':'||status||':'||coalesce(commission_amount::text,'?'),',' order by id),'EMPTY'))
 into v_count,v_pending,v_total,v_fp from public.strategy_sales_commissions where organization_id=v_org and person_id=p_person_id and competence=p_competence;
 if v_pending>0 then raise exception 'Existem comissoes pendentes; regularize antes da aprovacao.';end if;
 select * into v_old from public.strategy_pre_bonus_approvals_v2638 where organization_id=v_org and competence=p_competence and person_id=p_person_id order by revision desc limit 1 for update;
 if v_old.id is not null and v_old.source_fingerprint=v_fp and v_old.amount=round(v_total,2) then
  return jsonb_build_object('approved',true,'already_approved',true,'amount',v_old.amount,'revision',v_old.revision);
 end if;
 insert into public.strategy_pre_bonus_approvals_v2638(organization_id,competence,person_id,revision,amount,sales_count,source_fingerprint,approved_by)
 values(v_org,p_competence,p_person_id,coalesce(v_old.revision,0)+1,round(v_total,2),v_count,v_fp,auth.uid());
 return jsonb_build_object('approved',true,'already_approved',false,'amount',round(v_total,2),'sales_count',v_count,'revision',coalesce(v_old.revision,0)+1);
end $$;

create or replace function public.strategy_sync_official_bonus_v2638(p_competence date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_comp record;v_preview jsonb;v_row jsonb;v_state text;v_old numeric;v_previous text;v_count int:=0;v_skipped int:=0;
begin
 if auth.uid() is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Acesso negado.' using errcode='42501';end if;
 v_org:=(select (public.current_profile()).organization_id);
 select * into v_comp from public.strategy_competences where organization_id=v_org and competence=p_competence and status<>'closed' for update;
 if v_comp.id is null then raise exception 'Competencia invalida ou fechada.';end if;
 v_preview:=public.strategy_bonus_reconciliation_preview_v2638(p_competence);
 for v_row in select value from jsonb_array_elements(v_preview->'people') loop
  v_state:=v_row->>'status';
  if v_state not in ('needs_sync','needs_resync') then v_skipped:=v_skipped+1;continue;end if;
  select variable_pay into v_old from public.strategy_employee_costs where id=(v_row->>'cost_id')::uuid and organization_id=v_org and competence_id=v_comp.id for update;
  -- Nova verificacao sob lock: nunca substituir valor manual nem FTE diferente de 1.
  if not found or (v_state='needs_sync' and v_old<>0) or (v_state='needs_resync' and v_old is distinct from
    (select amount from public.strategy_bonus_cost_links_v2638 where organization_id=v_org and competence_id=v_comp.id and person_id=(v_row->>'person_id')::uuid)) then
    v_skipped:=v_skipped+1;continue;
  end if;
  select source_fingerprint into v_previous from public.strategy_bonus_cost_links_v2638 where organization_id=v_org and competence_id=v_comp.id and person_id=(v_row->>'person_id')::uuid;
  update public.strategy_employee_costs set variable_pay=(v_row->>'amount')::numeric,updated_by=auth.uid(),updated_at=now()
  where id=(v_row->>'cost_id')::uuid and organization_id=v_org and competence_id=v_comp.id and fte=1;
  insert into public.strategy_bonus_cost_links_v2638(organization_id,competence_id,person_id,source_type,amount,source_fingerprint,synced_by)
  values(v_org,v_comp.id,(v_row->>'person_id')::uuid,v_row->>'source_type',(v_row->>'amount')::numeric,v_row->>'source_fingerprint',auth.uid())
  on conflict(organization_id,competence_id,person_id) do update set amount=excluded.amount,source_fingerprint=excluded.source_fingerprint,source_type=excluded.source_type,synced_by=excluded.synced_by,synced_at=now();
  insert into public.strategy_bonus_sync_audit_v2638(organization_id,competence_id,person_id,previous_pay,new_pay,previous_fingerprint,new_fingerprint,synced_by)
  values(v_org,v_comp.id,(v_row->>'person_id')::uuid,v_old,(v_row->>'amount')::numeric,v_previous,v_row->>'source_fingerprint',auth.uid());
  v_count:=v_count+1;
 end loop;
 return jsonb_build_object('synced',v_count,'skipped',v_skipped,'preview',public.strategy_bonus_reconciliation_preview_v2638(p_competence));
end $$;

-- Guardar fechamento original intocado; wrapper faz preflight antes de fechar e
-- cria snapshot COMPLMENTAR (nunca altera o financeiro historico da V2.57.6).
do $$begin
 if to_regprocedure('public.close_strategy_competence_core_v2638(date)') is null then
  alter function public.close_strategy_competence(date) rename to close_strategy_competence_core_v2638;
 end if;
end $$;
create or replace function public.close_strategy_competence(p_competence date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_comp record;v_preview jsonb;v_result jsonb;v_snap uuid;v_s text;
begin
 if auth.uid() is null or not public.has_strategy_access('close_competence') or not public.has_strategy_access('people_costs') then raise exception 'Acesso de fechamento financeiro negado.' using errcode='42501';end if;
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

-- Direitos apenas a authenticated; execucao SECURITY DEFINER checa perfil e tenant.
revoke all on function public.strategy_bonus_reconciliation_preview_v2638(date) from public,anon;
revoke all on function public.strategy_approve_pre_bonus_v2638(date,uuid) from public,anon;
revoke all on function public.strategy_sync_official_bonus_v2638(date) from public,anon;
revoke all on function public.close_strategy_competence(date) from public,anon;
revoke all on function public.close_strategy_competence_core_v2638(date) from public,anon,authenticated;
grant execute on function public.strategy_bonus_reconciliation_preview_v2638(date) to authenticated;
grant execute on function public.strategy_approve_pre_bonus_v2638(date,uuid) to authenticated;
grant execute on function public.strategy_sync_official_bonus_v2638(date) to authenticated;
grant execute on function public.close_strategy_competence(date) to authenticated;
notify pgrst,'reload schema';
commit;
