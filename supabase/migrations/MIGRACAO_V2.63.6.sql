-- V2.63.6 - motor comercial auditavel, sem lancamentos de folha implícitos.
-- Aplicar apos V2.63.5. Comissao por venda e paga uma vez na competencia original.
begin;
create table if not exists public.strategy_sales_commissions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 source_key text not null check(source_key in ('contracted_modules_csv','merchandise_sales_csv')),
 sale_id uuid not null,
 person_id uuid not null references public.strategy_people(id) on delete restrict,
 competence date not null check(extract(day from competence)=1),
 squad_code text not null check(squad_code in ('A','B','C','D','E')),
 gross_amount numeric(14,2) not null check(gross_amount>=0),
 commission_amount numeric(14,2),
 status text not null check(status in ('calculated','pending_rule','pending_cost')),
 rule_snapshot jsonb not null,
 rule_revision integer not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(organization_id,source_key,sale_id),
 check((status='calculated' and commission_amount is not null and commission_amount>=0) or (status<>'calculated' and commission_amount is null))
);
create index if not exists strategy_sales_commissions_month_v2636 on public.strategy_sales_commissions(organization_id,competence,person_id,squad_code);
alter table public.strategy_sales_commissions enable row level security;
revoke all on public.strategy_sales_commissions from public,anon,authenticated;
grant select on public.strategy_sales_commissions to authenticated;
drop policy if exists strategy_sales_commissions_select_v2636 on public.strategy_sales_commissions;
create policy strategy_sales_commissions_select_v2636 on public.strategy_sales_commissions for select to authenticated using
 (organization_id=(select (public.current_profile()).organization_id) and
  ((public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs')) or
   person_id in(select id from public.strategy_people where organization_id=(select (public.current_profile()).organization_id) and user_id=auth.uid())));

-- Calculo deterministico usando somente a regra congelada no momento da importacao.
create or replace function public.strategy_commission_amount_v2636(p_gross numeric,p_rule jsonb)
returns numeric language plpgsql immutable set search_path=public,pg_temp as $$
declare v_kind text;v_pct numeric;v_cost numeric;v_fixed numeric;v_result numeric;
begin
 if p_gross is null or p_gross<0 or p_rule is null or jsonb_typeof(p_rule)<>'object' then return null;end if;
 v_kind:=p_rule->>'type';
 if v_kind='full' then v_result:=p_gross;
 elsif v_kind='percentage' then
  if nullif(p_rule->>'percentage','') is null then return null;end if;
  v_pct:=(p_rule->>'percentage')::numeric;
  if v_pct<0 or v_pct>100 then return null;end if;
  v_result:=p_gross*v_pct/100;
 elsif v_kind='net_after_third_party' then
  if nullif(p_rule->>'third_party_cost','') is null then return null;end if;
  v_cost:=(p_rule->>'third_party_cost')::numeric;
  if v_cost<0 then return null;end if;
  v_result:=greatest(0,p_gross-v_cost);
 elsif v_kind='fixed' then
  if nullif(p_rule->>'fixed_amount','') is null then return null;end if;
  v_fixed:=(p_rule->>'fixed_amount')::numeric;
  if v_fixed<0 then return null;end if;
  v_result:=v_fixed;
 else return null;end if;
 return round(v_result,2);
exception when invalid_text_representation or numeric_value_out_of_range then return null;
end $$;

-- Nunca recalcular/reescrever uma comissao ja gravada; evita que mudancas futuras de regra reabram historico.
create or replace function public.calculate_strategy_sales_commissions_v2636(p_competence date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_status text;v_added int:=0;v_pending int:=0;v_total numeric:=0;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then
  raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 if p_competence is null or extract(day from p_competence)<>1 then raise exception 'Competencia invalida.';end if;
 select status into v_status from public.strategy_competences where organization_id=v_org and competence=p_competence for update;
 if v_status='closed' then raise exception 'Competencia estrategica fechada.';end if;
 -- Os dois CSVs ja foram validados e reconciliados pelo importador original.
 with sales as (
  select id,organization_id,source_key,person_id,competence,squad_code,monthly_amount as gross_amount,commission_rule_at_import as rule_snapshot,commission_revision_at_import as revision
  from public.strategy_recurring_sales where organization_id=v_org and competence=p_competence
  union all
  select id,organization_id,source_key,person_id,competence,squad_code,gross_amount,commission_rule_at_import,commission_revision_at_import
  from public.strategy_merchandise_sales where organization_id=v_org and competence=p_competence
 ), created as (
  insert into public.strategy_sales_commissions(organization_id,source_key,sale_id,person_id,competence,squad_code,gross_amount,commission_amount,status,rule_snapshot,rule_revision,created_by)
  select s.organization_id,s.source_key,s.id,s.person_id,s.competence,s.squad_code,s.gross_amount,
   public.strategy_commission_amount_v2636(s.gross_amount,s.rule_snapshot),
   case when (s.rule_snapshot->>'type')='net_after_third_party' and nullif(s.rule_snapshot->>'third_party_cost','') is null then 'pending_cost'
        when public.strategy_commission_amount_v2636(s.gross_amount,s.rule_snapshot) is null then 'pending_rule'
        else 'calculated' end,s.rule_snapshot,s.revision,auth.uid()
  from sales s where not exists(select 1 from public.strategy_sales_commissions x where x.organization_id=s.organization_id and x.source_key=s.source_key and x.sale_id=s.id)
  on conflict(organization_id,source_key,sale_id) do nothing
  returning commission_amount,status
 ) select count(*),count(*) filter(where status<>'calculated'),coalesce(sum(commission_amount),0) into v_added,v_pending,v_total from created;
 return jsonb_build_object('created',v_added,'pending',v_pending,'amountAdded',v_total,'competence',p_competence);
end $$;

-- Visao mensal de contabilizacao: nao inclui MRR futuro, so comissoes da venda original.
create or replace function public.strategy_commissions_summary_v2636(p_competence date)
returns table(person_id uuid,person_name text,user_id uuid,role text,squad_code text,sales_count bigint,gross_amount numeric,commission_amount numeric,pending_count bigint)
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or p_competence is null or extract(day from p_competence)<>1 then raise exception 'Solicitacao invalida.';end if;
 if not (public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs')) then raise exception 'Permissao insuficiente.' using errcode='42501';end if;
 return query select c.person_id,p.name,p.user_id,coalesce(pr.role,''),c.squad_code,count(*),sum(c.gross_amount),sum(c.commission_amount),count(*) filter(where c.status<>'calculated')
 from public.strategy_sales_commissions c join public.strategy_people p on p.id=c.person_id and p.organization_id=v_org
 left join public.profiles pr on pr.user_id=p.user_id and pr.organization_id=v_org
 where c.organization_id=v_org and c.competence=p_competence
 group by c.person_id,p.name,p.user_id,pr.role,c.squad_code order by p.name,c.squad_code;
end $$;

-- Sincronizacao explicita e conservadora: so tecnicos com competencia operacional existente e aberta.
-- Nao cria tecnico/atendimento ficticio para Pre-atendimento, nem altera outras parcelas.
create or replace function public.sync_strategy_sales_bonus_v2636(p_competence date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_row record;v_tm uuid;v_old numeric;v_synced int:=0;v_skipped int:=0;v_unmatched int:=0;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 if p_competence is null or extract(day from p_competence)<>1 then raise exception 'Competencia invalida.';end if;
 if exists(select 1 from public.strategy_competences where organization_id=v_org and competence=p_competence and status='closed') then raise exception 'Competencia estrategica fechada.';end if;
 for v_row in
  select c.person_id,p.user_id,p.name,c.squad_code,sum(c.commission_amount) amount,count(*) filter(where c.status<>'calculated') pending
  from public.strategy_sales_commissions c join public.strategy_people p on p.id=c.person_id
  join public.profiles pr on pr.user_id=p.user_id and pr.organization_id=v_org and pr.active=true and pr.role='technician'
  where c.organization_id=v_org and c.competence=p_competence
  group by c.person_id,p.user_id,p.name,c.squad_code
 loop
  if v_row.pending>0 then v_skipped:=v_skipped+1;continue;end if;
  -- Competencias de Suporte precisam existir; nao criamos linhas tecnicas apenas para receber comissao.
  select tm.id into v_tm from public.technician_monthly tm
   join public.squad_months sm on sm.id=tm.squad_month_id
   join public.squads s on s.id=sm.squad_id
   where tm.user_id=v_row.user_id and s.organization_id=v_org and s.code::text=v_row.squad_code
    and sm.year=extract(year from p_competence)::int and sm.month=extract(month from p_competence)::int
    and coalesce(sm.is_closed,false)=false limit 1;
  if v_tm is null then v_unmatched:=v_unmatched+1;continue;end if;
  select sales_commission into v_old from public.technician_finance_monthly where technician_month_id=v_tm for update;
  -- Nunca substituir uma comissao preenchida manualmente sem decisao explicita.
  if coalesce(v_old,0)<>0 and abs(v_old-v_row.amount)>0.001 then v_skipped:=v_skipped+1;continue;end if;
  insert into public.technician_finance_monthly(technician_month_id,sales_commission,updated_by,updated_at)
  values(v_tm,v_row.amount,auth.uid(),now()) on conflict(technician_month_id) do update
  set sales_commission=excluded.sales_commission,updated_by=excluded.updated_by,updated_at=now();
  v_synced:=v_synced+1;
 end loop;
 return jsonb_build_object('synced',v_synced,'manualConflictsOrPending',v_skipped,'noOperationalMonth',v_unmatched,'preAttendance','separate-commercial-ledger');
end $$;

revoke all on function public.calculate_strategy_sales_commissions_v2636(date) from public,anon;
revoke all on function public.strategy_commissions_summary_v2636(date) from public,anon;
revoke all on function public.sync_strategy_sales_bonus_v2636(date) from public,anon;
grant execute on function public.calculate_strategy_sales_commissions_v2636(date) to authenticated;
grant execute on function public.strategy_commissions_summary_v2636(date) to authenticated;
grant execute on function public.sync_strategy_sales_bonus_v2636(date) to authenticated;
commit;
