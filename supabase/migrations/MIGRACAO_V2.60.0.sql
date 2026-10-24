-- Soften Performance Hub V2.60.0
-- Fase 5 - Fundação de Resultado.
--
-- Cria o contrato econômico da Fase 5 separando o evento econômico da sua
-- atribuição a pessoas/Squads. A fundação NÃO soma receita direta, influenciada
-- e protegida e NÃO publica ainda métricas monetárias das V2.60.1-V2.60.8.

begin;

create table if not exists public.strategy_result_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  result_type text not null check (result_type in ('direct','influenced','protected')),
  status text not null default 'draft' check (status in ('draft','confirmed','cancelled')),
  occurred_at timestamptz not null default now(),
  gross_amount numeric(14,2) not null default 0 check (gross_amount >= 0),
  monthly_recurring_amount numeric(14,2) not null default 0 check (monthly_recurring_amount >= 0),
  annual_recurring_amount numeric(14,2) not null default 0 check (annual_recurring_amount >= 0),
  currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  source text not null default 'manual' check (source in ('manual','csv','api','crm')),
  source_reference text,
  external_entity_type text,
  external_entity_id text,
  description text,
  notes text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategy_result_attributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.strategy_result_events(id) on delete cascade,
  person_id uuid references public.strategy_people(id) on delete set null,
  user_id_snapshot uuid references auth.users(id) on delete set null,
  technician_name_snapshot text,
  squad_code_snapshot text,
  attribution_role text not null default 'contributor' check (attribution_role in ('owner','originator','contributor','retainer','other')),
  attribution_share numeric(10,8) check (attribution_share is null or (attribution_share >= 0 and attribution_share <= 1)),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (person_id is not null or nullif(trim(coalesce(technician_name_snapshot,'')),'') is not null or nullif(trim(coalesce(squad_code_snapshot,'')),'') is not null)
);

create index if not exists idx_strategy_result_events_competence on public.strategy_result_events(competence_id);
create index if not exists idx_strategy_result_events_org_type_status on public.strategy_result_events(organization_id,result_type,status);
create index if not exists idx_strategy_result_events_occurred_at on public.strategy_result_events(organization_id,occurred_at);
create unique index if not exists uq_strategy_result_events_source_ref
  on public.strategy_result_events(organization_id,source,source_reference)
  where nullif(trim(coalesce(source_reference,'')),'') is not null;
create index if not exists idx_strategy_result_attributions_event on public.strategy_result_attributions(event_id);
create index if not exists idx_strategy_result_attributions_squad on public.strategy_result_attributions(organization_id,squad_code_snapshot);
create index if not exists idx_strategy_result_attributions_person on public.strategy_result_attributions(organization_id,person_id);

alter table public.strategy_result_events enable row level security;
alter table public.strategy_result_attributions enable row level security;

-- Integridade multi-tenant defensiva: FKs simples garantem existência, e estes
-- guards garantem que competência, evento e pessoa pertencem à mesma organização.
create or replace function public.validate_strategy_result_event_scope()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not exists (
    select 1 from public.strategy_competences sc
    where sc.id=new.competence_id and sc.organization_id=new.organization_id
  ) then
    raise exception 'strategy result competence organization mismatch' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_strategy_result_event_scope() from public;
revoke all on function public.validate_strategy_result_event_scope() from authenticated;

drop trigger if exists strategy_result_events_scope_guard on public.strategy_result_events;
create trigger strategy_result_events_scope_guard
before insert or update of organization_id,competence_id on public.strategy_result_events
for each row execute function public.validate_strategy_result_event_scope();

create or replace function public.validate_strategy_result_attribution_scope()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not exists (
    select 1 from public.strategy_result_events e
    where e.id=new.event_id and e.organization_id=new.organization_id
  ) then
    raise exception 'strategy result event organization mismatch' using errcode='23514';
  end if;
  if new.person_id is not null and not exists (
    select 1 from public.strategy_people sp
    where sp.id=new.person_id and sp.organization_id=new.organization_id
  ) then
    raise exception 'strategy result person organization mismatch' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_strategy_result_attribution_scope() from public;
revoke all on function public.validate_strategy_result_attribution_scope() from authenticated;

drop trigger if exists strategy_result_attributions_scope_guard on public.strategy_result_attributions;
create trigger strategy_result_attributions_scope_guard
before insert or update of organization_id,event_id,person_id on public.strategy_result_attributions
for each row execute function public.validate_strategy_result_attribution_scope();

-- O detalhe econômico segue a permissão granular de edição estratégica.
-- A leitura agregada é feita exclusivamente pela RPC abaixo.
drop policy if exists strategy_result_events_select on public.strategy_result_events;
create policy strategy_result_events_select on public.strategy_result_events for select to authenticated
using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_result_events_insert on public.strategy_result_events;
create policy strategy_result_events_insert on public.strategy_result_events for insert to authenticated
with check (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_result_events_update on public.strategy_result_events;
create policy strategy_result_events_update on public.strategy_result_events for update to authenticated
using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'))
with check (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_result_events_delete on public.strategy_result_events;
create policy strategy_result_events_delete on public.strategy_result_events for delete to authenticated
using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));

drop policy if exists strategy_result_attributions_select on public.strategy_result_attributions;
create policy strategy_result_attributions_select on public.strategy_result_attributions for select to authenticated
using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_result_attributions_insert on public.strategy_result_attributions;
create policy strategy_result_attributions_insert on public.strategy_result_attributions for insert to authenticated
with check (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_result_attributions_update on public.strategy_result_attributions;
create policy strategy_result_attributions_update on public.strategy_result_attributions for update to authenticated
using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'))
with check (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_result_attributions_delete on public.strategy_result_attributions;
create policy strategy_result_attributions_delete on public.strategy_result_attributions for delete to authenticated
using (organization_id=(select (public.current_profile()).organization_id) and public.has_strategy_access('edit_costs'));

grant select,insert,update,delete on public.strategy_result_events to authenticated;
grant select,insert,update,delete on public.strategy_result_attributions to authenticated;

create or replace function public.get_strategy_result_foundation(p_competence date,p_squad_code text default null)
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
    raise exception 'strategy aggregate access denied' using errcode='42501';
  end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;
  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  with comp as (
    select id,competence from public.strategy_competences
    where organization_id=v_org and competence=date_trunc('month',p_competence)::date
    limit 1
  ), filtered as (
    select e.*
    from public.strategy_result_events e
    join comp c on c.id=e.competence_id
    where e.organization_id=v_org
      and (v_all or exists (
        select 1 from public.strategy_result_attributions a
        where a.organization_id=v_org and a.event_id=e.id and upper(trim(coalesce(a.squad_code_snapshot,'')))=v_code
      ))
  ), attribution_flags as (
    select f.id,exists(select 1 from public.strategy_result_attributions a where a.organization_id=v_org and a.event_id=f.id) attributed
    from filtered f
  )
  select jsonb_build_object(
    'source_available',true,
    'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'event_count',(select count(*) from filtered),
    'confirmed_count',(select count(*) from filtered where status='confirmed'),
    'draft_count',(select count(*) from filtered where status='draft'),
    'cancelled_count',(select count(*) from filtered where status='cancelled'),
    'direct_count',(select count(*) from filtered where result_type='direct'),
    'influenced_count',(select count(*) from filtered where result_type='influenced'),
    'protected_count',(select count(*) from filtered where result_type='protected'),
    'attributed_count',(select count(*) from attribution_flags where attributed),
    'unattributed_count',(select count(*) from attribution_flags where not attributed),
    'source_count',(select count(distinct source) from filtered)
  ) into v_result;

  return coalesce(v_result,jsonb_build_object('source_available',true,'competence',to_char(date_trunc('month',p_competence)::date,'YYYY-MM'),'squad_code',case when v_all then 'ALL' else v_code end));
end;
$$;

revoke all on function public.get_strategy_result_foundation(date,text) from public;
grant execute on function public.get_strategy_result_foundation(date,text) to authenticated;

comment on table public.strategy_result_events is
'V2.60.0: eventos econômicos da Fase 5, classificados explicitamente como receita direta, influenciada ou protegida.';
comment on table public.strategy_result_attributions is
'V2.60.0: atribuições de pessoas/Squads a eventos econômicos sem duplicar o evento financeiro.';
comment on function public.get_strategy_result_foundation(date,text) is
'V2.60.0: retorna somente prontidão e contagens da Fundação de Resultado; não agrega valores monetários.';

notify pgrst,'reload schema';
commit;
