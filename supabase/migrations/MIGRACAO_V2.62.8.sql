-- V2.62.8 - Historico de simulacoes estrategicas, separado de dados oficiais.
-- Todas as versoes sao append-only; a API publica oferece leitura sob RLS e gravacao via RPC.
begin;
create table if not exists public.strategy_scenario_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid not null,
  revision integer not null check (revision between 1 and 100000),
  competence_id uuid not null references public.strategy_competences(id) on delete restrict,
  competence date not null,
  squad_code text not null check (squad_code ~ '^[A-Z0-9_-]{1,40}$'),
  baseline_revision integer check (baseline_revision is null or baseline_revision > 0),
  name text not null check (length(trim(name)) between 1 and 120),
  notes text not null default '' check (length(notes)<=2000),
  assumptions jsonb not null check (jsonb_typeof(assumptions)='object'),
  projection jsonb not null check (jsonb_typeof(projection)='object'),
  rule_version text not null default 'SC-HISTORY-1.0.0',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,scenario_id,revision)
);
create index if not exists idx_strategy_scenario_revisions_scope on public.strategy_scenario_revisions (organization_id,competence,squad_code,created_at desc);
create index if not exists idx_strategy_scenario_revisions_group on public.strategy_scenario_revisions (organization_id,scenario_id,revision desc);
alter table public.strategy_scenario_revisions enable row level security;
revoke all on public.strategy_scenario_revisions from public,anon,authenticated;
grant select on public.strategy_scenario_revisions to authenticated;
drop policy if exists strategy_scenario_revisions_read on public.strategy_scenario_revisions;
create policy strategy_scenario_revisions_read on public.strategy_scenario_revisions for select to authenticated
using(organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('aggregates'));

create or replace function public.save_strategy_scenario_revision(
  p_scenario_id uuid,p_name text,p_notes text,p_competence date,p_squad_code text,
  p_baseline_revision integer,p_assumptions jsonb,p_projection jsonb
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_id uuid;v_rev integer;v_comp_id uuid;v_group record;v_squad text;v_name text;v_notes text;
begin
  if auth.uid() is null or not public.has_strategy_access('aggregates') or
     not public.has_strategy_access('edit_costs') or not public.has_strategy_access('people_costs') then
    raise exception 'Permissao estrategica de edicao e consulta necessaria' using errcode='42501';
  end if;
  v_org:=(public.current_profile()).organization_id;
  if v_org is null then raise exception 'Organizacao nao encontrada' using errcode='42501';end if;
  v_squad:=upper(trim(coalesce(p_squad_code,'')));
  v_name:=trim(coalesce(p_name,''));v_notes:=coalesce(p_notes,'');
  if v_squad !~ '^[A-Z0-9_-]{1,40}$' or length(v_name) not between 1 and 120 or length(v_notes)>2000 then
    raise exception 'Escopo, nome ou notas invalidos';end if;
  if p_competence is null or extract(day from p_competence)<>1 then raise exception 'Competencia invalida';end if;
  if p_baseline_revision is not null and p_baseline_revision<=0 then raise exception 'Revisao-base invalida';end if;
  if jsonb_typeof(p_assumptions) is distinct from 'object' or jsonb_typeof(p_projection) is distinct from 'object' or
    jsonb_typeof(p_projection->'scenarios') is distinct from 'object' or
    jsonb_typeof(p_assumptions->'custom') is distinct from 'object' or
    octet_length(p_projection::text)>180000 or octet_length(p_assumptions::text)>12000 or
    p_projection->>'official' is distinct from 'false' or p_projection->>'persisted' is distinct from 'false' or
    jsonb_typeof(p_projection #> '{scenarios,current,metrics}') is distinct from 'object' or
    jsonb_typeof(p_projection #> '{scenarios,optimistic,metrics}') is distinct from 'object' or
    jsonb_typeof(p_projection #> '{scenarios,conservative,metrics}') is distinct from 'object' or
    jsonb_typeof(p_projection #> '{scenarios,custom,metrics}') is distinct from 'object' or
    p_projection->>'competence' is distinct from to_char(p_competence,'YYYY-MM') or
    upper(coalesce(p_projection->>'squadCode',''))<>v_squad or
    coalesce(p_projection->>'revision','')<>coalesce(p_baseline_revision::text,'') then
    raise exception 'Premissas ou projecoes inconsistentes com o escopo';end if;
  if not coalesce((p_projection->'scenarios' ?& array['current','optimistic','conservative','custom']),false) or
     not coalesce((p_assumptions ?& array['current','optimistic','conservative','custom']),false) then
    raise exception 'Quatro alternativas do comparativo sao obrigatorias';end if;
  select id into v_comp_id from public.strategy_competences where organization_id=v_org and competence=p_competence;
  if v_comp_id is null then raise exception 'Competencia inexistente na organizacao';end if;
  v_id:=coalesce(p_scenario_id,gen_random_uuid());
  perform pg_advisory_xact_lock(hashtext(v_org::text),hashtext(v_id::text));
  select competence,squad_code into v_group from public.strategy_scenario_revisions
    where organization_id=v_org and scenario_id=v_id order by revision desc limit 1;
  if found and (v_group.competence<>p_competence or v_group.squad_code<>v_squad) then
    raise exception 'Nao e permitido mudar competencia ou Squad de um cenario salvo';end if;
  select coalesce(max(revision),0)+1 into v_rev from public.strategy_scenario_revisions where organization_id=v_org and scenario_id=v_id;
  insert into public.strategy_scenario_revisions(organization_id,scenario_id,revision,competence_id,competence,squad_code,
    baseline_revision,name,notes,assumptions,projection,created_by)
    values(v_org,v_id,v_rev,v_comp_id,p_competence,v_squad,p_baseline_revision,v_name,v_notes,p_assumptions,p_projection,auth.uid());
  return jsonb_build_object('scenario_id',v_id,'revision',v_rev,'competence',to_char(p_competence,'YYYY-MM'),'squad_code',v_squad);
end;$$;
revoke all on function public.save_strategy_scenario_revision(uuid,text,text,date,text,integer,jsonb,jsonb) from public,anon;
grant execute on function public.save_strategy_scenario_revision(uuid,text,text,date,text,integer,jsonb,jsonb) to authenticated;
-- Sem grants de INSERT/UPDATE/DELETE; historico publicado e sempre imutavel pelo cliente.
commit;
