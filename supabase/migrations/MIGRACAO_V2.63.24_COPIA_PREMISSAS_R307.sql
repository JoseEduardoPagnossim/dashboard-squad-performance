-- R30.7 (V2.63.24): copia revisada dos custos fixos da competencia anterior.
-- Somente em competencia aberta, sem sobrescrever custos ja existentes.
-- Remuneracao variavel, horas extras, provisoes e outros custos pessoais nao sao replicados.
-- Execute apos as migrations V2.57.4, V2.59.1 e V2.63.9 R4.
begin;

create table if not exists public.strategy_cost_copy_audit_r307 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 source_competence_id uuid not null references public.strategy_competences(id),
 destination_competence_id uuid not null references public.strategy_competences(id),
 person_ids uuid[] not null default '{}'::uuid[],
 operational_ids uuid[] not null default '{}'::uuid[],
 copied_people integer not null default 0,
 copied_operational integer not null default 0,
 copy_fte boolean not null default false,
 copied_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists strategy_cost_copy_audit_org_r307 on public.strategy_cost_copy_audit_r307(organization_id, created_at desc);
alter table public.strategy_cost_copy_audit_r307 enable row level security;
revoke all on public.strategy_cost_copy_audit_r307 from public, anon, authenticated;
grant select on public.strategy_cost_copy_audit_r307 to authenticated;
drop policy if exists strategy_cost_copy_audit_select_r307 on public.strategy_cost_copy_audit_r307;
create policy strategy_cost_copy_audit_select_r307 on public.strategy_cost_copy_audit_r307
 for select to authenticated using (
  organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('people_costs')
  and public.has_strategy_access('edit_costs')
 );

-- Permite reconhecer reexecucoes do mesmo item sem duplicar despesas operacionais.
create unique index if not exists strategy_operational_copy_source_unique_r307
 on public.strategy_operational_costs(organization_id, competence_id, source_reference)
 where source_reference like 'r307:%';

create or replace function public.strategy_preview_previous_costs_r307(p_competence date)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_source date;v_src uuid;v_dst uuid;v_status text;
 v_people jsonb;v_operational jsonb;
begin
 if auth.uid() is null or not public.has_strategy_access('edit_costs') or not public.has_strategy_access('people_costs') then
  raise exception 'Acesso negado a custos pessoais.' using errcode='42501';
 end if;
 v_org:=(select (public.current_profile()).organization_id);
 if v_org is null or p_competence is null or extract(day from p_competence)<>1 then
  raise exception 'Organizacao ou competencia invalida.';
 end if;
 v_source:=(p_competence-interval '1 month')::date;
 select id,status into v_dst,v_status from public.strategy_competences
  where organization_id=v_org and competence=p_competence;
 if v_dst is null then raise exception 'Crie a competencia financeira de destino antes de copiar.';end if;
 if v_status='closed' then raise exception 'Competencia de destino fechada. Copia bloqueada.' using errcode='23514';end if;
 select id into v_src from public.strategy_competences
  where organization_id=v_org and competence=v_source;
 if v_src is null then raise exception 'Competencia financeira anterior nao encontrada.';end if;

 select coalesce(jsonb_agg(jsonb_build_object(
   'id',c.person_id,'name',p.name,'role',p.role_label,'active',p.active,
   'salary',c.salary,'employerCharges',c.employer_charges,'benefits',c.benefits,
   'existing',exists(select 1 from public.strategy_employee_costs d where d.organization_id=v_org and d.competence_id=v_dst and d.person_id=c.person_id),
   'eligible',p.active and not exists(select 1 from public.strategy_employee_costs d where d.organization_id=v_org and d.competence_id=v_dst and d.person_id=c.person_id)
  ) order by p.name),'[]'::jsonb) into v_people
 from public.strategy_employee_costs c join public.strategy_people p on p.id=c.person_id and p.organization_id=v_org
 where c.organization_id=v_org and c.competence_id=v_src;

 select coalesce(jsonb_agg(jsonb_build_object(
   'id',o.id,'description',o.description,'category',o.category,'amount',o.amount,'recurring',o.recurring,
   'existing',exists(select 1 from public.strategy_operational_costs d where d.organization_id=v_org and d.competence_id=v_dst and
     (d.source_reference='r307:'||o.id::text||':'||to_char(v_source,'YYYY-MM') or
      (lower(btrim(d.description))=lower(btrim(o.description)) and d.category=o.category and d.scope_type=o.scope_type and coalesce(d.squad_code,'')=coalesce(o.squad_code,'')))),
   'eligible',o.allocation_method<>'manual' and o.amount>0 and not exists(select 1 from public.strategy_operational_costs d where d.organization_id=v_org and d.competence_id=v_dst and
     (d.source_reference='r307:'||o.id::text||':'||to_char(v_source,'YYYY-MM') or
      (lower(btrim(d.description))=lower(btrim(o.description)) and d.category=o.category and d.scope_type=o.scope_type and coalesce(d.squad_code,'')=coalesce(o.squad_code,''))))
  ) order by o.description),'[]'::jsonb) into v_operational
 from public.strategy_operational_costs o where o.organization_id=v_org and o.competence_id=v_src;

 return jsonb_build_object('source',to_char(v_source,'YYYY-MM-DD'),'destination',to_char(p_competence,'YYYY-MM-DD'),
  'people',coalesce(v_people,'[]'::jsonb),'operational',coalesce(v_operational,'[]'::jsonb));
end $$;

create or replace function public.strategy_copy_previous_costs_r307(
 p_competence date,
 p_person_ids uuid[] default '{}'::uuid[],
 p_operational_ids uuid[] default '{}'::uuid[],
 p_copy_fte boolean default false
)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_source date;v_src uuid;v_dst uuid;v_status text;
 v_person uuid;v_cost public.strategy_employee_costs%rowtype;v_person_row public.strategy_people%rowtype;
 v_opid uuid;v_op public.strategy_operational_costs%rowtype;v_new_op uuid;
 v_people_count integer:=0;v_op_count integer:=0;v_rows integer;v_basis jsonb;v_total_weight numeric;
 v_key text;
begin
 if auth.uid() is null or not public.has_strategy_access('edit_costs') or not public.has_strategy_access('people_costs') then
  raise exception 'Sem permissao para copiar custos estrategicos.' using errcode='42501';
 end if;
 v_org:=(select (public.current_profile()).organization_id);
 if v_org is null or p_competence is null or extract(day from p_competence)<>1 then
  raise exception 'Organizacao ou competencia invalida.';
 end if;
 if coalesce(cardinality(p_person_ids),0)+coalesce(cardinality(p_operational_ids),0) not between 1 and 1000 then
  raise exception 'Selecione entre 1 e 1000 itens para copiar.';
 end if;
 if (select count(*) from unnest(coalesce(p_person_ids,'{}'::uuid[])) u(id)) <>
    (select count(distinct id) from unnest(coalesce(p_person_ids,'{}'::uuid[])) u(id))
 or (select count(*) from unnest(coalesce(p_operational_ids,'{}'::uuid[])) u(id)) <>
    (select count(distinct id) from unnest(coalesce(p_operational_ids,'{}'::uuid[])) u(id)) then
  raise exception 'Selecao com identificadores duplicados.';
 end if;
 v_source:=(p_competence-interval '1 month')::date;
 -- Serializa copias concorrentes deste destino. Uma transacao abrange toda a operacao.
 perform pg_advisory_xact_lock(hashtextextended(v_org::text||':'||p_competence::text||':r307',0));
 select id,status into v_dst,v_status from public.strategy_competences
  where organization_id=v_org and competence=p_competence for update;
 if v_dst is null then raise exception 'Crie a competencia de destino antes de copiar.';end if;
 if v_status='closed' then raise exception 'Competencia de destino fechada. Copia bloqueada.' using errcode='23514';end if;
 select id into v_src from public.strategy_competences
  where organization_id=v_org and competence=v_source;
 if v_src is null then raise exception 'Competencia anterior nao encontrada.';end if;

 foreach v_person in array coalesce(p_person_ids,'{}'::uuid[]) loop
  select * into v_cost from public.strategy_employee_costs
   where organization_id=v_org and competence_id=v_src and person_id=v_person;
  if not found then raise exception 'Custo pessoal de origem nao encontrado: %',v_person;end if;
  select * into v_person_row from public.strategy_people
   where id=v_person and organization_id=v_org and active=true;
  if not found then raise exception 'Pessoa inativa ou de outra organizacao: %',v_person;end if;
  insert into public.strategy_employee_costs(
   organization_id,competence_id,person_id,squad_code_snapshot,fte,availability_factor,
   salary,employer_charges,benefits,variable_pay,overtime,other_costs,
   source,source_reference,notes,created_by,updated_by
  ) values(
   v_org,v_dst,v_person,coalesce(v_person_row.default_squad_code,v_cost.squad_code_snapshot),
   case when p_copy_fte then v_cost.fte else v_person_row.default_fte end,
   case when p_copy_fte then coalesce(v_cost.availability_factor,1) else 1 end,
   v_cost.salary,v_cost.employer_charges,v_cost.benefits,0,0,0,
   'manual','r307:'||v_source::text,'Copia de custos fixos de '||to_char(v_source,'MM/YYYY')||'. Variaveis e provisoes nao copiadas.',
   auth.uid(),auth.uid()
  ) on conflict(organization_id,competence_id,person_id) do nothing;
  get diagnostics v_rows=row_count;v_people_count:=v_people_count+v_rows;
 end loop;

 -- Recalcular distribuicao com os dados do mes de destino apos os custos pessoais novos.
 v_basis:=public.get_strategy_allocation_basis(p_competence);
 foreach v_opid in array coalesce(p_operational_ids,'{}'::uuid[]) loop
  select * into v_op from public.strategy_operational_costs
   where id=v_opid and organization_id=v_org and competence_id=v_src;
  if not found then raise exception 'Despesa de origem nao encontrada: %',v_opid;end if;
  if v_op.allocation_method='manual' or v_op.amount<=0 then
   raise exception 'Despesa com rateio manual ou valor zerado exige cadastro individual: %',v_op.description;
  end if;
  v_key:='r307:'||v_op.id::text||':'||to_char(v_source,'YYYY-MM');
  if exists(select 1 from public.strategy_operational_costs d
    where d.organization_id=v_org and d.competence_id=v_dst
      and (d.source_reference=v_key or
       (lower(btrim(d.description))=lower(btrim(v_op.description)) and d.category=v_op.category
        and d.scope_type=v_op.scope_type and coalesce(d.squad_code,'')=coalesce(v_op.squad_code,'')))) then
   continue;
  end if;
  insert into public.strategy_operational_costs(
   organization_id,competence_id,description,category,amount,scope_type,squad_code,
   allocation_method,recurring,source,source_reference,notes,created_by,updated_by
  ) values(
   v_org,v_dst,v_op.description,v_op.category,v_op.amount,v_op.scope_type,v_op.squad_code,
   v_op.allocation_method,v_op.recurring,'manual',v_key,
   'Copia conferida de '||to_char(v_source,'MM/YYYY')||'. Revisar rateio na competencia de destino.',auth.uid(),auth.uid()
  ) returning id into v_new_op;
  v_op_count:=v_op_count+1;

  if v_op.scope_type='squad' or v_op.allocation_method='direct' then
   insert into public.strategy_cost_allocations(
     organization_id,operational_cost_id,squad_code,allocation_method_snapshot,basis_value,percentage,allocated_amount
   ) values(v_org,v_new_op,coalesce(nullif(upper(btrim(v_op.squad_code)),''),'UNALLOCATED'),
      'direct',case when nullif(btrim(v_op.squad_code),'') is null then 0 else 1 end,1,v_op.amount);
  else
   -- Rateia pelo FTE ou atendimentos do destino, nao pelas percentagens historicas.
   select coalesce(sum(greatest(0,case when v_op.allocation_method='attendance'
     then coalesce((e.value->>'attendance')::numeric,0)
     else coalesce((e.value->>'fte')::numeric,0) end)),0) into v_total_weight
   from jsonb_array_elements(coalesce(v_basis->'rows','[]'::jsonb)) e(value);
   if v_total_weight=0 then
    insert into public.strategy_cost_allocations(
      organization_id,operational_cost_id,squad_code,allocation_method_snapshot,basis_value,percentage,allocated_amount
    ) values(v_org,v_new_op,'UNALLOCATED',v_op.allocation_method,0,1,v_op.amount);
   else
    with weights as (
     select upper(e.value->>'squad_code') as code,
      greatest(0,case when v_op.allocation_method='attendance'
       then coalesce((e.value->>'attendance')::numeric,0)
       else coalesce((e.value->>'fte')::numeric,0) end) as weight
     from jsonb_array_elements(coalesce(v_basis->'rows','[]'::jsonb)) e(value)
    ), base_cents as (
     select code,weight,
       floor(round(v_op.amount*100,0)*weight/v_total_weight)::integer as fixed_cents,
       (round(v_op.amount*100,0)*weight/v_total_weight)
          -floor(round(v_op.amount*100,0)*weight/v_total_weight) as remainder
     from weights where weight>0
    ), ranked as (
     select code,weight,fixed_cents,
      row_number() over(order by remainder desc,code)::integer as priority,
      (round(v_op.amount*100,0)-sum(fixed_cents) over())::integer as leftover
     from base_cents
    )
    insert into public.strategy_cost_allocations(
      organization_id,operational_cost_id,squad_code,allocation_method_snapshot,basis_value,percentage,allocated_amount
    )
    select v_org,v_new_op,code,v_op.allocation_method,weight,
     round(weight/v_total_weight,8),(fixed_cents+case when priority<=leftover then 1 else 0 end)/100.0
    from ranked;
   end if;
  end if;
 end loop;

 insert into public.strategy_cost_copy_audit_r307(
  organization_id,source_competence_id,destination_competence_id,person_ids,operational_ids,
  copied_people,copied_operational,copy_fte,copied_by
 ) values(v_org,v_src,v_dst,coalesce(p_person_ids,'{}'::uuid[]),coalesce(p_operational_ids,'{}'::uuid[]),
  v_people_count,v_op_count,coalesce(p_copy_fte,false),auth.uid());
 return jsonb_build_object('source',to_char(v_source,'YYYY-MM-DD'),
  'destination',to_char(p_competence,'YYYY-MM-DD'),
  'people_copied',v_people_count,'operational_copied',v_op_count,
  'existing_preserved',true,'variable_costs_copied',false);
end $$;

revoke all on function public.strategy_preview_previous_costs_r307(date) from public,anon;
revoke all on function public.strategy_copy_previous_costs_r307(date,uuid[],uuid[],boolean) from public,anon;
grant execute on function public.strategy_preview_previous_costs_r307(date) to authenticated;
grant execute on function public.strategy_copy_previous_costs_r307(date,uuid[],uuid[],boolean) to authenticated;
commit;
