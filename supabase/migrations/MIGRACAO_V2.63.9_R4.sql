-- V2.63.9 R4: custos operacionais removiveis e importacao auditavel de folha.
-- BASE OFICIAL: V2.63.9 R2. Nao depende do hotfix R3 descartado.
-- Executar em homologacao antes da producao. Nao reescreve competencias fechadas.
begin;

create table if not exists public.strategy_deleted_operational_costs_v2639_r4 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id),
 original_cost_id uuid not null,
 original_row jsonb not null,
 allocations jsonb not null default '[]'::jsonb,
 reason text not null,
 deleted_by uuid not null references auth.users(id),
 deleted_at timestamptz not null default now()
);
create table if not exists public.strategy_person_cost_import_batches_v2639_r4 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id),
 request_token uuid not null,
 source_file text not null,
 people_count integer not null check(people_count between 1 and 1000),
 imported_by uuid not null references auth.users(id),
 imported_at timestamptz not null default now(),
 unique(organization_id,request_token)
);
create table if not exists public.strategy_person_cost_import_lines_v2639_r4 (
 id uuid primary key default gen_random_uuid(),
 batch_id uuid not null references public.strategy_person_cost_import_batches_v2639_r4(id) on delete restrict,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id),
 person_id uuid not null references public.strategy_people(id),
 previous_values jsonb,
 new_values jsonb not null,
 provisions numeric(14,2) not null,
 provision_charges numeric(14,2) not null,
 variable_source text not null check(variable_source in ('preserve','spreadsheet','bonus')),
 unique(batch_id,person_id)
);
create table if not exists public.strategy_person_cost_provisions_v2639_r4 (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id),
 person_id uuid not null references public.strategy_people(id),
 imported_amount numeric(14,2) not null default 0 check(imported_amount>=0),
 last_batch_id uuid not null references public.strategy_person_cost_import_batches_v2639_r4(id),
 updated_at timestamptz not null default now(),
 primary key(organization_id,competence_id,person_id)
);
create index if not exists strategy_cost_import_history_v2639_r4 on public.strategy_person_cost_import_batches_v2639_r4(organization_id,competence_id,imported_at desc);

-- Historicos de custos individuais: so leitura com permissao financeira.
do $$ declare t text;begin
 foreach t in array array['strategy_deleted_operational_costs_v2639_r4','strategy_person_cost_import_batches_v2639_r4','strategy_person_cost_import_lines_v2639_r4','strategy_person_cost_provisions_v2639_r4'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('drop policy if exists %I on public.%I',t||'_select',t);
  execute format('create policy %I on public.%I for select to authenticated using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access(''edit_costs'') and public.has_strategy_access(''people_costs''))',t||'_select',t);
 end loop;
end $$;

-- Grants expressos para auditoria estatica do projeto.
grant select on public.strategy_deleted_operational_costs_v2639_r4 to authenticated;
grant select on public.strategy_person_cost_import_batches_v2639_r4 to authenticated;
grant select on public.strategy_person_cost_import_lines_v2639_r4 to authenticated;
grant select on public.strategy_person_cost_provisions_v2639_r4 to authenticated;

create or replace function public.strategy_delete_operational_cost_v2639_r4(p_cost_id uuid,p_reason text default 'Exclusao solicitada na Gestao Estrategica')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_cost record;v_comp record;v_alloc jsonb;v_reason text;
begin
 if auth.uid() is null or not public.has_strategy_access('edit_costs') then raise exception 'Sem permissao para excluir custos estrategicos.' using errcode='42501';end if;
 v_org:=(select (public.current_profile()).organization_id);
 if v_org is null or p_cost_id is null then raise exception 'Organizacao ou custo invalido.';end if;
 v_reason:=left(btrim(coalesce(p_reason,'')),500);
 if length(v_reason)<5 then raise exception 'Informe uma justificativa com ao menos 5 caracteres.';end if;
 select * into v_cost from public.strategy_operational_costs where id=p_cost_id and organization_id=v_org for update;
 if not found then raise exception 'Custo operacional nao encontrado nesta organizacao.';end if;
 select * into v_comp from public.strategy_competences where id=v_cost.competence_id and organization_id=v_org for update;
 if v_comp.status='closed' then raise exception 'Competencia fechada. Reabra antes de excluir.' using errcode='23514';end if;
 if exists(select 1 from public.strategy_manual_entries where organization_id=v_org and operational_cost_id=p_cost_id) then
  raise exception 'Este custo esta vinculado a um lancamento manual auditavel. Corrija/cancele o lancamento de origem, nao exclua aqui.' using errcode='23514';
 end if;
 select coalesce(jsonb_agg(to_jsonb(a) order by a.squad_code),'[]'::jsonb) into v_alloc
 from public.strategy_cost_allocations a where organization_id=v_org and operational_cost_id=p_cost_id;
 insert into public.strategy_deleted_operational_costs_v2639_r4(organization_id,competence_id,original_cost_id,original_row,allocations,reason,deleted_by)
 values(v_org,v_comp.id,p_cost_id,to_jsonb(v_cost),v_alloc,v_reason,auth.uid());
 delete from public.strategy_operational_costs where id=p_cost_id and organization_id=v_org;
 if not found then raise exception 'Falha ao excluir custo.';end if;
 return jsonb_build_object('deleted',true,'id',p_cost_id,'competence',v_comp.competence,'previous_amount',v_cost.amount);
end $$;

-- Bloquear DELETE direto: exclusao somente via RPC com auditoria e verificacao de competencia.
revoke delete on public.strategy_operational_costs from authenticated;

-- Cada lote atualiza APENAS o que veio da planilha e preserva outros custos existentes.
-- Provisoes ficam no campo other_costs, controlando sua parcela por pessoa/competencia
-- para que reimportar nao acumule o mesmo encargo novamente.
create or replace function public.strategy_import_person_costs_v2639_r4(p_competence date,p_rows jsonb,p_source_file text,p_request_token uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_comp record;v_batch uuid;v_row jsonb;v_person record;v_previous record;v_saved record;
 v_count int;v_extra numeric;v_prev_extra numeric;v_old_other numeric;v_new_other numeric;
 v_salary numeric;v_charges numeric;v_benefits numeric;v_prov numeric;v_prov_charges numeric;
 v_var_source text;v_variable numeric;v_bonus_preview jsonb;v_bonus_row jsonb;v_name text;
 v_seen uuid[]:='{}'::uuid[];v_person_id uuid;
begin
 if auth.uid() is null or not public.has_strategy_access('edit_costs') or not public.has_strategy_access('people_costs') then raise exception 'Sem permissao para importar custos pessoais.' using errcode='42501';end if;
 v_org:=(select (public.current_profile()).organization_id);
 if v_org is null or p_competence is null or extract(day from p_competence)<>1 or p_request_token is null then raise exception 'Organizacao, competencia ou token invalido.';end if;
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) not between 1 and 1000 then raise exception 'Informe de 1 a 1000 pessoas.';end if;
 if length(btrim(coalesce(p_source_file,''))) not between 3 and 180 then raise exception 'Nome do arquivo invalido.';end if;
 select * into v_comp from public.strategy_competences where organization_id=v_org and competence=p_competence for update;
 if not found then raise exception 'Crie a competencia estrategica antes de importar a planilha.';end if;
 if v_comp.status='closed' then raise exception 'Competencia fechada. Importacao bloqueada.' using errcode='23514';end if;
 select id into v_batch from public.strategy_person_cost_import_batches_v2639_r4 where organization_id=v_org and request_token=p_request_token;
 if found then return jsonb_build_object('already_imported',true,'batch_id',v_batch);end if;
 select count(*) into v_count from jsonb_array_elements(p_rows);
 insert into public.strategy_person_cost_import_batches_v2639_r4(organization_id,competence_id,request_token,source_file,people_count,imported_by)
 values(v_org,v_comp.id,p_request_token,left(p_source_file,180),v_count,auth.uid()) returning id into v_batch;
 for v_row in select value from jsonb_array_elements(p_rows) loop
  v_person_id:=nullif(v_row->>'person_id','')::uuid;
  if v_person_id is null or v_person_id=any(v_seen) then raise exception 'Pessoa ausente ou duplicada no lote.';end if;
  v_seen:=array_append(v_seen,v_person_id);
  select * into v_person from public.strategy_people where id=v_person_id and organization_id=v_org and active=true for update;
  if not found then raise exception 'Pessoa inativa ou nao pertence a organizacao.';end if;
  v_salary:=round((v_row->>'salary')::numeric,2);
  v_charges:=round((v_row->>'employer_charges')::numeric,2);
  v_benefits:=round((v_row->>'benefits')::numeric,2);
  v_prov:=round((v_row->>'provisions')::numeric,2);
  v_prov_charges:=round((v_row->>'provision_charges')::numeric,2);
  if v_salary is null or v_charges is null or v_benefits is null or v_prov is null or v_prov_charges is null or least(v_salary,v_charges,v_benefits,v_prov,v_prov_charges)<0 then raise exception 'Valores ausentes ou negativos para %.',v_person.name;end if;
  if greatest(v_salary,v_charges,v_benefits,v_prov,v_prov_charges)>1000000000 then raise exception 'Valor financeiro fora do limite seguro.';end if;
  v_extra:=v_prov+v_prov_charges;
  select * into v_previous from public.strategy_employee_costs where organization_id=v_org and competence_id=v_comp.id and person_id=v_person_id for update;
  select imported_amount into v_prev_extra from public.strategy_person_cost_provisions_v2639_r4 where organization_id=v_org and competence_id=v_comp.id and person_id=v_person_id for update;
  v_prev_extra:=coalesce(v_prev_extra,0);v_old_other:=coalesce(v_previous.other_costs,0);
  if v_old_other+0.001<v_prev_extra then raise exception 'Outros custos de % foram alterados; concilie manualmente antes de reimportar.',v_person.name;end if;
  v_new_other:=round(v_old_other-v_prev_extra+v_extra,2);
  v_var_source:=coalesce(nullif(v_row->>'variable_source',''),'preserve');
  if v_var_source not in ('preserve','spreadsheet','bonus') then raise exception 'Fonte do variavel invalida.';end if;
  v_variable:=coalesce(v_previous.variable_pay,0);
  if v_var_source='spreadsheet' then v_variable:=round((v_row->>'variable_sheet')::numeric,2);
  elsif v_var_source='bonus' then
    if v_bonus_preview is null then v_bonus_preview:=public.strategy_bonus_reconciliation_preview_v2638(p_competence);end if;
    select value into v_bonus_row from jsonb_array_elements(v_bonus_preview->'people') where value->>'person_id'=v_person_id::text;
    if v_bonus_row is null or v_bonus_row->>'status' not in ('synced','needs_sync','needs_resync','manual_conflict','cost_row_missing') or v_bonus_row->>'amount' is null then raise exception 'Bonificacao oficial indisponivel ou pendente para %.',v_person.name;end if;
    v_variable:=round((v_bonus_row->>'amount')::numeric,2);
  end if;
  if v_variable is null or v_variable<0 or v_variable>1000000000 then raise exception 'Variavel invalido para %.',v_person.name;end if;
  insert into public.strategy_employee_costs(organization_id,competence_id,person_id,squad_code_snapshot,fte,salary,employer_charges,benefits,variable_pay,overtime,other_costs,source,source_reference,updated_by,created_by,updated_at)
  values(v_org,v_comp.id,v_person_id,v_person.default_squad_code,coalesce(v_previous.fte,v_person.default_fte,1),v_salary,v_charges,v_benefits,v_variable,coalesce(v_previous.overtime,0),v_new_other,'csv',left('R4:'||p_source_file,180),auth.uid(),auth.uid(),now())
  on conflict(organization_id,competence_id,person_id) do update set
   salary=excluded.salary,employer_charges=excluded.employer_charges,benefits=excluded.benefits,variable_pay=excluded.variable_pay,
   other_costs=excluded.other_costs,source=excluded.source,source_reference=excluded.source_reference,updated_by=auth.uid(),updated_at=now();
  select * into v_saved from public.strategy_employee_costs where organization_id=v_org and competence_id=v_comp.id and person_id=v_person_id;
  -- Fonte oficial escolhida explicitamente: gravar tambem a reconciliacao,
  -- caso contrario o fechamento V2.63.8 interpretaria o bonus como ajuste manual.
  if v_var_source='bonus' then
   if coalesce(v_saved.fte,0)<>1 then raise exception 'Bonificacao oficial requer FTE 1 para %.',v_person.name;end if;
   insert into public.strategy_bonus_cost_links_v2638(organization_id,competence_id,person_id,source_type,amount,source_fingerprint,synced_by)
   values(v_org,v_comp.id,v_person_id,v_bonus_row->>'source_type',v_variable,v_bonus_row->>'source_fingerprint',auth.uid())
   on conflict(organization_id,competence_id,person_id) do update set source_type=excluded.source_type,amount=excluded.amount,source_fingerprint=excluded.source_fingerprint,synced_by=excluded.synced_by,synced_at=now();
   insert into public.strategy_bonus_sync_audit_v2638(organization_id,competence_id,person_id,previous_pay,new_pay,previous_fingerprint,new_fingerprint,synced_by)
   values(v_org,v_comp.id,v_person_id,coalesce(v_previous.variable_pay,0),v_variable,null,v_bonus_row->>'source_fingerprint',auth.uid());
  end if;
  insert into public.strategy_person_cost_import_lines_v2639_r4(batch_id,organization_id,competence_id,person_id,previous_values,new_values,provisions,provision_charges,variable_source)
  values(v_batch,v_org,v_comp.id,v_person_id,case when v_previous.id is null then null else to_jsonb(v_previous) end,to_jsonb(v_saved),v_prov,v_prov_charges,v_var_source);
  insert into public.strategy_person_cost_provisions_v2639_r4(organization_id,competence_id,person_id,imported_amount,last_batch_id)
  values(v_org,v_comp.id,v_person_id,v_extra,v_batch)
  on conflict(organization_id,competence_id,person_id) do update set imported_amount=excluded.imported_amount,last_batch_id=excluded.last_batch_id,updated_at=now();
 end loop;
 return jsonb_build_object('already_imported',false,'batch_id',v_batch,'imported',v_count);
end $$;

-- Aplicacao explicita de bonus oficial para um colaborador, inclusive apos divergencia manual.
-- Mantem a trilha da V2.63.8 e nao permite forcar valor informado pelo navegador.
create or replace function public.strategy_set_official_bonus_v2639_r4(p_competence date,p_person_id uuid,p_expected_variable numeric)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_comp record;v_cost record;v_preview jsonb;v_row jsonb;v_fp_previous text;v_amount numeric;
begin
 if auth.uid() is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs') then raise exception 'Acesso financeiro negado.' using errcode='42501';end if;
 v_org:=(select (public.current_profile()).organization_id);
 select * into v_comp from public.strategy_competences where competence=p_competence and organization_id=v_org for update;
 if not found or v_comp.status='closed' then raise exception 'Competencia fechada ou inexistente.';end if;
 select ec.* into v_cost from public.strategy_employee_costs ec join public.strategy_people p on p.id=ec.person_id and p.organization_id=v_org and p.active=true
 where ec.organization_id=v_org and ec.competence_id=v_comp.id and ec.person_id=p_person_id for update of ec;
 if not found then raise exception 'Pessoa sem custo pessoal cadastrado nesta competencia.';end if;
 if coalesce(v_cost.fte,0)<>1 then raise exception 'Revisao manual: FTE diferente de 1.';end if;
 if v_cost.variable_pay is distinct from p_expected_variable then raise exception 'O valor do campo Variavel mudou. Atualize a tela e tente novamente.';end if;
 v_preview:=public.strategy_bonus_reconciliation_preview_v2638(p_competence);
 select value into v_row from jsonb_array_elements(v_preview->'people') where value->>'person_id'=p_person_id::text;
 if v_row is null or v_row->>'status' not in ('synced','needs_sync','needs_resync','manual_conflict') or v_row->>'amount' is null or v_row->>'source_fingerprint' is null then
  raise exception 'Bonificacao oficial ainda nao validada, aprovada ou fechada para esta pessoa.';
 end if;
 v_amount:=round((v_row->>'amount')::numeric,2);
 if v_amount<0 then raise exception 'Valor oficial invalido.';end if;
 select source_fingerprint into v_fp_previous from public.strategy_bonus_cost_links_v2638 where organization_id=v_org and competence_id=v_comp.id and person_id=p_person_id;
 update public.strategy_employee_costs set variable_pay=v_amount,updated_by=auth.uid(),updated_at=now()
 where id=v_cost.id and organization_id=v_org;
 insert into public.strategy_bonus_cost_links_v2638(organization_id,competence_id,person_id,source_type,amount,source_fingerprint,synced_by)
 values(v_org,v_comp.id,p_person_id,v_row->>'source_type',v_amount,v_row->>'source_fingerprint',auth.uid())
 on conflict(organization_id,competence_id,person_id) do update set source_type=excluded.source_type,amount=excluded.amount,source_fingerprint=excluded.source_fingerprint,synced_by=excluded.synced_by,synced_at=now();
 insert into public.strategy_bonus_sync_audit_v2638(organization_id,competence_id,person_id,previous_pay,new_pay,previous_fingerprint,new_fingerprint,synced_by)
 values(v_org,v_comp.id,p_person_id,v_cost.variable_pay,v_amount,v_fp_previous,v_row->>'source_fingerprint',auth.uid());
 return jsonb_build_object('person_id',p_person_id,'amount',v_amount,'source_type',v_row->>'source_type','synced',true);
end $$;

revoke all on function public.strategy_set_official_bonus_v2639_r4(date,uuid,numeric) from public,anon;
grant execute on function public.strategy_set_official_bonus_v2639_r4(date,uuid,numeric) to authenticated;
revoke all on function public.strategy_delete_operational_cost_v2639_r4(uuid,text) from public,anon;
revoke all on function public.strategy_import_person_costs_v2639_r4(date,jsonb,text,uuid) from public,anon;
grant execute on function public.strategy_delete_operational_cost_v2639_r4(uuid,text) to authenticated;
grant execute on function public.strategy_import_person_costs_v2639_r4(date,jsonb,text,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
