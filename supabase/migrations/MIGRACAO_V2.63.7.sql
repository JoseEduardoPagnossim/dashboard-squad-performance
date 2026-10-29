-- V2.63.7: auditable manual commercial entries and explicit revisions.
-- Requires V2.63.6; leaves imported sales and official bonus untouched.
begin;
create table if not exists public.strategy_manual_entries (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 entry_group_id uuid not null,
 request_token uuid,
 revision integer not null check(revision between 1 and 9999),
 competence date not null check(extract(day from competence)=1),
 occurred_on date not null,
 entry_type text not null check(entry_type in ('direct_sale','influenced','protected','third_party_cost')),
 status text not null check(status in ('posted','cancelled')),
 squad_code text not null check(squad_code in ('A','B','C','D','E')),
 person_id uuid references public.strategy_people(id) on delete restrict,
 amount numeric(14,2) not null check(amount>0),
 mrr numeric(14,2) not null default 0 check(mrr>=0),
 description text not null check(length(btrim(description)) between 4 and 250),
 external_reference text,
 reason text not null,
 result_event_id uuid references public.strategy_result_events(id) on delete restrict,
 operational_cost_id uuid references public.strategy_operational_costs(id) on delete restrict,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(organization_id,entry_group_id,revision),
 unique(organization_id,request_token),
 check(occurred_on>=competence and occurred_on<(competence+interval '1 month')::date),
 check(entry_type='direct_sale' or mrr=0),
 check(status='cancelled' or ((entry_type='third_party_cost' and operational_cost_id is not null and result_event_id is null) or (entry_type<>'third_party_cost' and result_event_id is not null and operational_cost_id is null))),
 check(status='posted' or (result_event_id is null and operational_cost_id is null))
);
create index if not exists strategy_manual_entries_month_v2637 on public.strategy_manual_entries(organization_id,competence,created_at desc);
create index if not exists strategy_manual_entries_person_v2637 on public.strategy_manual_entries(organization_id,person_id);
alter table public.strategy_manual_entries enable row level security;
revoke all on public.strategy_manual_entries from public,anon,authenticated;
grant select on public.strategy_manual_entries to authenticated;
drop policy if exists strategy_manual_entries_select_v2637 on public.strategy_manual_entries;
create policy strategy_manual_entries_select_v2637 on public.strategy_manual_entries for select to authenticated using
 (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));

-- Prevent bypassing the revision ledger via ordinary direct UPDATE/DELETE of projections.
create or replace function public.strategy_manual_projection_guard_v2637()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 if current_setting('strategy.manual_edit_v2637',true)='ok' then
  if tg_op='DELETE' then return old;end if;return new;
 end if;
 v_id:=old.id;
 if tg_table_name='strategy_result_events' and exists(select 1 from public.strategy_manual_entries where result_event_id=v_id) then
  raise exception 'Lancamento manual protegido: use revisao auditavel.' using errcode='55000';
 elsif tg_table_name='strategy_operational_costs' and exists(select 1 from public.strategy_manual_entries where operational_cost_id=v_id) then
  raise exception 'Custo manual protegido: use revisao auditavel.' using errcode='55000';
 end if;
 if tg_op='DELETE' then return old;end if;return new;
end $$;
drop trigger if exists strategy_manual_guard_event_v2637 on public.strategy_result_events;
create trigger strategy_manual_guard_event_v2637 before update or delete on public.strategy_result_events
for each row execute function public.strategy_manual_projection_guard_v2637();
drop trigger if exists strategy_manual_guard_cost_v2637 on public.strategy_operational_costs;
create trigger strategy_manual_guard_cost_v2637 before update or delete on public.strategy_operational_costs
for each row execute function public.strategy_manual_projection_guard_v2637();

-- Only this RPC can write manual ledger rows; all effects are atomic.
create or replace function public.save_strategy_manual_entry_v2637(p_entry jsonb,p_entry_group_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_group uuid;v_previous public.strategy_manual_entries%rowtype;
 v_rev int:=1;v_comp date;v_status text;v_comp_id uuid;
 v_date date;v_type text;v_squad text;v_person uuid;v_amount numeric;v_mrr numeric;
 v_desc text;v_ref text;v_reason text;v_event uuid;v_cost uuid;v_entry uuid;
 v_person_squad text;v_person_role text;v_request_token uuid;v_duplicate public.strategy_manual_entries%rowtype;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then
  raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 if p_entry is null or jsonb_typeof(p_entry)<>'object' or pg_column_size(p_entry)>8192 then raise exception 'Dados manuais invalidos.';end if;
 v_request_token:=nullif(p_entry->>'requestToken','')::uuid;
 if v_request_token is null then raise exception 'Identificador de requisicao obrigatorio.';end if;
 select * into v_duplicate from public.strategy_manual_entries where organization_id=v_org and request_token=v_request_token limit 1;
 if found then return jsonb_build_object('id',v_duplicate.id,'groupId',v_duplicate.entry_group_id,'revision',v_duplicate.revision,'status',v_duplicate.status,'idempotent',true);end if;
 v_type:=p_entry->>'type';v_squad:=upper(btrim(coalesce(p_entry->>'squadCode','')));
 if v_type not in ('direct_sale','influenced','protected','third_party_cost') or v_type is null or v_squad not in ('A','B','C','D','E') then raise exception 'Tipo ou Squad invalido.';end if;
 v_date:=(p_entry->>'occurredOn')::date;
 v_comp:=date_trunc('month',v_date)::date;
 if (p_entry->>'competence') is distinct from to_char(v_comp,'YYYY-MM-DD') then raise exception 'Data fora da competencia selecionada.';end if;
 v_amount:=round((p_entry->>'amount')::numeric,2);v_mrr:=round(coalesce((p_entry->>'mrr')::numeric,0),2);
 if v_amount<=0 or v_amount>999999999999.99 or v_mrr<0 or v_mrr>999999999999.99 or (v_type<>'direct_sale' and v_mrr<>0) then raise exception 'Valores invalidos.';end if;
 v_desc:=btrim(coalesce(p_entry->>'description',''));v_ref:=nullif(btrim(coalesce(p_entry->>'reference','')),'');
 v_reason:=btrim(coalesce(p_entry->>'reason',''));
 if length(v_desc) not between 4 and 250 or length(coalesce(v_ref,''))>180 or length(v_reason) not between 10 and 500 then raise exception 'Descricao, referencia ou justificativa invalidas.';end if;
 if v_type in ('influenced','protected') and v_ref is null then raise exception 'Receita influenciada/protegida exige referencia comprovavel.';end if;
 if nullif(p_entry->>'personId','') is not null then v_person:=(p_entry->>'personId')::uuid;end if;
 if v_type='direct_sale' and v_person is null then raise exception 'Venda exige colaborador ativo vinculado.';end if;
 if v_person is not null then
  select p.default_squad_code,pr.role into v_person_squad,v_person_role from public.strategy_people p
  join public.profiles pr on pr.user_id=p.user_id and pr.organization_id=v_org and pr.active=true
  where p.id=v_person and p.organization_id=v_org and p.active=true and pr.role in ('technician','pre_attendance') limit 1;
  if not found or upper(coalesce(v_person_squad,''))<>v_squad or (v_squad='C' and v_person_role<>'pre_attendance')
     or (v_squad<>'C' and v_person_role<>'technician') then raise exception 'Colaborador, perfil ou Squad nao conciliados.';end if;
 end if;
 select id,status into v_comp_id,v_status from public.strategy_competences
  where organization_id=v_org and competence=v_comp for update;
 if v_comp_id is null then raise exception 'Crie a competencia estrategica antes do lancamento.';end if;
 if v_status='closed' then raise exception 'Competencia estrategica fechada.' using errcode='55000';end if;
 v_group:=coalesce(p_entry_group_id,gen_random_uuid());
 perform pg_advisory_xact_lock(hashtextextended(v_org::text||':'||v_group::text,637));
 if p_entry_group_id is not null then
  select * into v_previous from public.strategy_manual_entries
  where organization_id=v_org and entry_group_id=v_group order by revision desc limit 1 for update;
  if not found or v_previous.status='cancelled' then raise exception 'Lancamento inexistente ou cancelado.';end if;
  if v_previous.competence<>v_comp then raise exception 'Correcao em outra competencia exige novo lancamento.';end if;
  v_rev:=v_previous.revision+1;
  perform set_config('strategy.manual_edit_v2637','ok',true);
  if v_previous.result_event_id is not null then
   update public.strategy_result_events set status='cancelled',updated_by=auth.uid(),updated_at=now()
    where id=v_previous.result_event_id and organization_id=v_org;
  else
   update public.strategy_cost_allocations set allocated_amount=0,updated_at=now() where operational_cost_id=v_previous.operational_cost_id and organization_id=v_org;
   update public.strategy_operational_costs set amount=0,notes='Retificado pela revisao '||v_rev||' do lancamento manual.',updated_by=auth.uid(),updated_at=now()
    where id=v_previous.operational_cost_id and organization_id=v_org;
  end if;
 end if;
 if v_type='third_party_cost' then
  insert into public.strategy_operational_costs(organization_id,competence_id,description,category,amount,scope_type,squad_code,allocation_method,source,source_reference,notes,created_by,updated_by)
   values(v_org,v_comp_id,v_desc,'Terceiros',v_amount,'squad',v_squad,'direct','manual',
    'manual:v2637:'||v_group||':r'||v_rev,v_ref,auth.uid(),auth.uid()) returning id into v_cost;
  insert into public.strategy_cost_allocations(organization_id,operational_cost_id,squad_code,allocation_method_snapshot,basis_value,percentage,allocated_amount)
   values(v_org,v_cost,v_squad,'direct',1,1,v_amount);
 else
  insert into public.strategy_result_events(organization_id,competence_id,result_type,status,occurred_at,gross_amount,monthly_recurring_amount,annual_recurring_amount,currency,source,source_reference,description,notes,metadata,created_by,updated_by,direct_revenue_category,influenced_revenue_stage,protected_revenue_type,protection_verified_at)
  values(v_org,v_comp_id,case when v_type='direct_sale' then 'direct' else v_type end,'confirmed',(v_date::text||' 12:00:00+00')::timestamptz,
  v_amount,v_mrr,round(v_mrr*12,2),'BRL','manual','manual:v2637:'||v_group||':r'||v_rev,v_desc,v_reason,
  jsonb_build_object('manual_entry_group',v_group,'manual_revision',v_rev,'external_reference',v_ref,'commission_status','not_automatically_applied'),auth.uid(),auth.uid(),
  case when v_type='direct_sale' then 'direct_sale' else null end,
  case when v_type='influenced' then 'other' else null end,
  case when v_type='protected' then 'retention' else null end,
  case when v_type='protected' then (v_date::text||' 12:00:00+00')::timestamptz else null end)
  returning id into v_event;
  insert into public.strategy_result_attributions(organization_id,event_id,person_id,squad_code_snapshot,attribution_role,attribution_share,created_by)
   values(v_org,v_event,v_person,v_squad,'owner',1,auth.uid());
 end if;
 insert into public.strategy_manual_entries(organization_id,entry_group_id,request_token,revision,competence,occurred_on,entry_type,status,squad_code,person_id,amount,mrr,description,external_reference,reason,result_event_id,operational_cost_id,created_by)
 values(v_org,v_group,v_request_token,v_rev,v_comp,v_date,v_type,'posted',v_squad,v_person,v_amount,v_mrr,v_desc,v_ref,v_reason,v_event,v_cost,auth.uid()) returning id into v_entry;
 return jsonb_build_object('id',v_entry,'groupId',v_group,'revision',v_rev,'status','posted');
end $$;

create or replace function public.cancel_strategy_manual_entry_v2637(p_entry_group_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_previous public.strategy_manual_entries%rowtype;v_comp_status text;v_id uuid;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then
  raise exception 'Permissao insuficiente.' using errcode='42501';end if;
 if p_entry_group_id is null or length(btrim(coalesce(p_reason,''))) not between 10 and 500 then raise exception 'Justificativa de cancelamento obrigatoria.';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_org::text||':'||p_entry_group_id::text,637));
 select * into v_previous from public.strategy_manual_entries where organization_id=v_org and entry_group_id=p_entry_group_id order by revision desc limit 1 for update;
 if not found or v_previous.status='cancelled' then raise exception 'Lancamento nao encontrado ou ja cancelado.';end if;
 select status into v_comp_status from public.strategy_competences where organization_id=v_org and competence=v_previous.competence for update;
 if v_comp_status='closed' then raise exception 'Competencia fechada.' using errcode='55000';end if;
 perform set_config('strategy.manual_edit_v2637','ok',true);
 if v_previous.result_event_id is not null then
  update public.strategy_result_events set status='cancelled',updated_by=auth.uid(),updated_at=now()
  where id=v_previous.result_event_id and organization_id=v_org;
 else
  update public.strategy_cost_allocations set allocated_amount=0,updated_at=now() where operational_cost_id=v_previous.operational_cost_id and organization_id=v_org;
  update public.strategy_operational_costs set amount=0,notes='Cancelado: '||left(btrim(p_reason),400),updated_by=auth.uid(),updated_at=now()
  where id=v_previous.operational_cost_id and organization_id=v_org;
 end if;
 insert into public.strategy_manual_entries(organization_id,entry_group_id,revision,competence,occurred_on,entry_type,status,squad_code,person_id,amount,mrr,description,external_reference,reason,created_by)
 values(v_org,p_entry_group_id,v_previous.revision+1,v_previous.competence,v_previous.occurred_on,v_previous.entry_type,'cancelled',v_previous.squad_code,v_previous.person_id,
 v_previous.amount,v_previous.mrr,v_previous.description,v_previous.external_reference,btrim(p_reason),auth.uid()) returning id into v_id;
 return jsonb_build_object('id',v_id,'groupId',p_entry_group_id,'revision',v_previous.revision+1,'status','cancelled');
end $$;
revoke all on function public.strategy_manual_projection_guard_v2637() from public,anon,authenticated;
revoke all on function public.save_strategy_manual_entry_v2637(jsonb,uuid) from public,anon;
revoke all on function public.cancel_strategy_manual_entry_v2637(uuid,text) from public,anon;
grant execute on function public.save_strategy_manual_entry_v2637(jsonb,uuid) to authenticated;
grant execute on function public.cancel_strategy_manual_entry_v2637(uuid,text) to authenticated;
commit;
