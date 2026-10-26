-- Soften Performance Hub V2.61.0
-- Fase 6 - Fundacao Produto/Squad.
--
-- Objetivos:
--   - criar uma dimensao oficial de Produto, independente de Squad e de origem;
--   - registrar fontes de atendimentos, resolucoes, custos, FTE e resultado economico;
--   - atribuir cada fonte a um ou mais produtos sem ultrapassar 100%;
--   - preservar o saldo nao atribuido como "Nao classificado";
--   - preparar reconciliacao futura de demanda, custo e unit economics sem duplicar fatos.

begin;

create table if not exists public.strategy_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  active boolean not null default true,
  aliases text[] not null default '{}'::text[],
  source text not null default 'manual' check (source in ('manual','import','system')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(code),'') is not null),
  check (nullif(trim(name),'') is not null)
);

create unique index if not exists uq_strategy_products_org_code
  on public.strategy_products(organization_id,upper(trim(code)));
create index if not exists idx_strategy_products_org_active
  on public.strategy_products(organization_id,active,upper(trim(name)));

create table if not exists public.strategy_product_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  competence_id uuid not null references public.strategy_competences(id) on delete cascade,
  source_domain text not null check (source_domain in ('attendance','resolution','people_cost','operational_cost','fte','result')),
  metric_key text not null,
  source_reference text not null,
  source_quantity numeric(18,6) check (source_quantity is null or source_quantity >= 0),
  source_amount numeric(18,2) check (source_amount is null or source_amount >= 0),
  currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  person_id uuid references public.strategy_people(id) on delete set null,
  user_id_snapshot uuid references auth.users(id) on delete set null,
  technician_name_snapshot text,
  squad_code_snapshot text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(metric_key),'') is not null),
  check (nullif(trim(source_reference),'') is not null),
  check (source_quantity is not null or source_amount is not null)
);

create unique index if not exists uq_strategy_product_sources_reference
  on public.strategy_product_sources(organization_id,competence_id,source_domain,source_reference);
create index if not exists idx_strategy_product_sources_competence
  on public.strategy_product_sources(organization_id,competence_id,source_domain);
create index if not exists idx_strategy_product_sources_squad
  on public.strategy_product_sources(organization_id,competence_id,squad_code_snapshot);
create index if not exists idx_strategy_product_sources_person
  on public.strategy_product_sources(organization_id,competence_id,person_id);

create table if not exists public.strategy_product_attributions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid not null references public.strategy_product_sources(id) on delete cascade,
  product_id uuid not null references public.strategy_products(id) on delete restrict,
  product_code_snapshot text not null,
  product_name_snapshot text not null,
  allocation_share numeric(10,8) not null check (allocation_share > 0 and allocation_share <= 1),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id,product_id)
);

create index if not exists idx_strategy_product_attributions_source
  on public.strategy_product_attributions(source_id);
create index if not exists idx_strategy_product_attributions_product
  on public.strategy_product_attributions(organization_id,product_id);

-- Integridade multi-tenant da fonte.
create or replace function public.validate_strategy_product_source_scope()
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
    raise exception 'strategy product source competence organization mismatch' using errcode='23514';
  end if;
  if new.person_id is not null and not exists (
    select 1 from public.strategy_people sp
    where sp.id=new.person_id and sp.organization_id=new.organization_id
  ) then
    raise exception 'strategy product source person organization mismatch' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_strategy_product_source_scope() from public;
revoke all on function public.validate_strategy_product_source_scope() from authenticated;

drop trigger if exists strategy_product_sources_scope_guard on public.strategy_product_sources;
create trigger strategy_product_sources_scope_guard
before insert or update of organization_id,competence_id,person_id on public.strategy_product_sources
for each row execute function public.validate_strategy_product_source_scope();

-- A atribuicao congela codigo/nome do Produto no momento do vinculo e garante
-- que fonte e produto pertencem a mesma organizacao.
create or replace function public.validate_strategy_product_attribution_scope()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_code text;
  v_name text;
begin
  if not exists (
    select 1 from public.strategy_product_sources s
    where s.id=new.source_id and s.organization_id=new.organization_id
  ) then
    raise exception 'strategy product source organization mismatch' using errcode='23514';
  end if;

  select trim(p.code),trim(p.name)
    into v_code,v_name
  from public.strategy_products p
  where p.id=new.product_id
    and p.organization_id=new.organization_id
    and p.active=true;

  if v_code is null then
    raise exception 'strategy product attribution requires an active product from the same organization' using errcode='23514';
  end if;

  new.product_code_snapshot:=v_code;
  new.product_name_snapshot:=v_name;
  return new;
end;
$$;
revoke all on function public.validate_strategy_product_attribution_scope() from public;
revoke all on function public.validate_strategy_product_attribution_scope() from authenticated;

drop trigger if exists strategy_product_attributions_scope_guard on public.strategy_product_attributions;
create trigger strategy_product_attributions_scope_guard
before insert or update of organization_id,source_id,product_id on public.strategy_product_attributions
for each row execute function public.validate_strategy_product_attribution_scope();

-- Serializa atribuicoes concorrentes da mesma fonte e impede soma acima de 100%.
create or replace function public.validate_strategy_product_attribution_share_total()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_source uuid;
  v_total numeric;
begin
  v_source:=new.source_id;
  perform 1 from public.strategy_product_sources s where s.id=v_source for update;
  if not found then
    raise exception 'strategy product source not found for allocation validation' using errcode='23503';
  end if;

  select coalesce(sum(a.allocation_share),0)
    into v_total
  from public.strategy_product_attributions a
  where a.source_id=v_source and a.id<>new.id;

  v_total:=v_total+new.allocation_share;
  if v_total>1.000001 then
    raise exception 'strategy product allocation shares exceed 100%% for source %',v_source using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_strategy_product_attribution_share_total() from public;
revoke all on function public.validate_strategy_product_attribution_share_total() from authenticated;

drop trigger if exists strategy_product_attributions_share_guard on public.strategy_product_attributions;
create trigger strategy_product_attributions_share_guard
before insert or update of source_id,allocation_share on public.strategy_product_attributions
for each row execute function public.validate_strategy_product_attribution_share_total();

-- Fontes e atribuicoes fazem parte da competencia e ficam bloqueadas durante o fechamento.
create or replace function public.validate_strategy_product_source_competence_open()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_competence_id uuid;
  v_status text;
begin
  v_competence_id:=case when tg_op='DELETE' then old.competence_id else new.competence_id end;
  select status into v_status from public.strategy_competences where id=v_competence_id;
  if v_status='closed' then
    raise exception 'strategy product competence is closed; reopen before changing product sources' using errcode='55000';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.validate_strategy_product_source_competence_open() from public;
revoke all on function public.validate_strategy_product_source_competence_open() from authenticated;

drop trigger if exists strategy_product_sources_open_guard on public.strategy_product_sources;
create trigger strategy_product_sources_open_guard
before insert or update or delete on public.strategy_product_sources
for each row execute function public.validate_strategy_product_source_competence_open();

create or replace function public.validate_strategy_product_attribution_competence_open()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_source_id uuid;
  v_status text;
begin
  v_source_id:=case when tg_op='DELETE' then old.source_id else new.source_id end;
  select sc.status into v_status
  from public.strategy_product_sources s
  join public.strategy_competences sc on sc.id=s.competence_id
  where s.id=v_source_id;
  if v_status='closed' then
    raise exception 'strategy product competence is closed; reopen before changing product attributions' using errcode='55000';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.validate_strategy_product_attribution_competence_open() from public;
revoke all on function public.validate_strategy_product_attribution_competence_open() from authenticated;

drop trigger if exists strategy_product_attributions_open_guard on public.strategy_product_attributions;
create trigger strategy_product_attributions_open_guard
before insert or update or delete on public.strategy_product_attributions
for each row execute function public.validate_strategy_product_attribution_competence_open();

alter table public.strategy_products enable row level security;
alter table public.strategy_product_sources enable row level security;
alter table public.strategy_product_attributions enable row level security;

-- Catalogo: leitura estrategica agregada, edicao pela mesma permissao de configuracao financeira.
drop policy if exists strategy_products_select on public.strategy_products;
create policy strategy_products_select on public.strategy_products for select to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('aggregates'));
drop policy if exists strategy_products_insert on public.strategy_products;
create policy strategy_products_insert on public.strategy_products for insert to authenticated
with check (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_products_update on public.strategy_products;
create policy strategy_products_update on public.strategy_products for update to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'))
with check (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_products_delete on public.strategy_products;
create policy strategy_products_delete on public.strategy_products for delete to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));

-- Fontes/atribuicoes detalhadas ficam protegidas; o agregado e servido pela RPC.
drop policy if exists strategy_product_sources_select on public.strategy_product_sources;
create policy strategy_product_sources_select on public.strategy_product_sources for select to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_product_sources_insert on public.strategy_product_sources;
create policy strategy_product_sources_insert on public.strategy_product_sources for insert to authenticated
with check (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_product_sources_update on public.strategy_product_sources;
create policy strategy_product_sources_update on public.strategy_product_sources for update to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'))
with check (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_product_sources_delete on public.strategy_product_sources;
create policy strategy_product_sources_delete on public.strategy_product_sources for delete to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));

drop policy if exists strategy_product_attributions_select on public.strategy_product_attributions;
create policy strategy_product_attributions_select on public.strategy_product_attributions for select to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_product_attributions_insert on public.strategy_product_attributions;
create policy strategy_product_attributions_insert on public.strategy_product_attributions for insert to authenticated
with check (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_product_attributions_update on public.strategy_product_attributions;
create policy strategy_product_attributions_update on public.strategy_product_attributions for update to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'))
with check (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_product_attributions_delete on public.strategy_product_attributions;
create policy strategy_product_attributions_delete on public.strategy_product_attributions for delete to authenticated
using (organization_id=(public.current_profile()).organization_id and public.has_strategy_access('edit_costs'));

grant select,insert,update,delete on public.strategy_products to authenticated;
grant select,insert,update,delete on public.strategy_product_sources to authenticated;
grant select,insert,update,delete on public.strategy_product_attributions to authenticated;

create or replace function public.get_strategy_product_foundation(
  p_competence date,
  p_squad_code text default null
)
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
    raise exception 'strategy product aggregate access denied' using errcode='42501';
  end if;
  select (public.current_profile()).organization_id into v_org;
  if v_org is null then raise exception 'active profile not found' using errcode='42501'; end if;

  v_code:=upper(trim(coalesce(p_squad_code,'')));
  v_all:=v_code='' or v_code='ALL';

  with comp as (
    select id,competence
    from public.strategy_competences
    where organization_id=v_org
      and competence=date_trunc('month',p_competence)::date
    limit 1
  ), filtered_sources as (
    select s.*
    from public.strategy_product_sources s
    join comp c on c.id=s.competence_id
    where s.organization_id=v_org
      and (v_all or upper(trim(coalesce(s.squad_code_snapshot,'')))=v_code)
  ), source_state as (
    select
      s.id,s.source_domain,
      least(1::numeric,greatest(0::numeric,coalesce(sum(a.allocation_share),0))) share_total
    from filtered_sources s
    left join public.strategy_product_attributions a
      on a.organization_id=v_org and a.source_id=s.id
    group by s.id,s.source_domain
  ), domain_catalog(domain,ord) as (
    values ('attendance',1),('resolution',2),('people_cost',3),('operational_cost',4),('fte',5),('result',6)
  ), domain_rows as (
    select
      d.domain,d.ord,
      count(ss.id)::integer source_count,
      count(ss.id) filter (where ss.share_total>=0.999999)::integer fully_classified_count,
      count(ss.id) filter (where ss.share_total>0.000001 and ss.share_total<0.999999)::integer partially_classified_count,
      count(ss.id) filter (where ss.share_total<=0.000001)::integer unclassified_count,
      coalesce(sum(ss.share_total),0)::numeric allocated_share,
      case when count(ss.id)>0 then round((sum(ss.share_total)/count(ss.id))*100,2) else null end coverage_pct
    from domain_catalog d
    left join source_state ss on ss.source_domain=d.domain
    group by d.domain,d.ord
  ), totals as (
    select
      count(*)::integer source_count,
      count(*) filter (where share_total>=0.999999)::integer fully_classified_source_count,
      count(*) filter (where share_total>0.000001 and share_total<0.999999)::integer partially_classified_source_count,
      count(*) filter (where share_total<=0.000001)::integer unclassified_source_count,
      coalesce(sum(share_total),0)::numeric allocated_share,
      coalesce(sum(1-share_total),0)::numeric unclassified_share,
      case when count(*)>0 then round((sum(share_total)/count(*))*100,2) else null end classification_coverage_pct
    from source_state
  ), products as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',p.id,'code',upper(trim(p.code)),'name',trim(p.name),'active',p.active,
      'alias_count',coalesce(cardinality(p.aliases),0),'source',p.source,'updated_at',p.updated_at
    ) order by p.active desc,upper(trim(p.name))),'[]'::jsonb) rows
    from public.strategy_products p
    where p.organization_id=v_org
  )
  select jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),
    'squad_code',case when v_all then 'ALL' else v_code end,
    'product_count',(select count(*)::integer from public.strategy_products p where p.organization_id=v_org),
    'active_product_count',(select count(*)::integer from public.strategy_products p where p.organization_id=v_org and p.active=true),
    'source_count',coalesce(t.source_count,0),
    'fully_classified_source_count',coalesce(t.fully_classified_source_count,0),
    'partially_classified_source_count',coalesce(t.partially_classified_source_count,0),
    'unclassified_source_count',coalesce(t.unclassified_source_count,0),
    'allocated_share',coalesce(t.allocated_share,0),
    'unclassified_share',coalesce(t.unclassified_share,0),
    'classification_coverage_pct',t.classification_coverage_pct,
    'products',(select rows from products),
    'domains',coalesce((select jsonb_agg(jsonb_build_object(
      'domain',d.domain,'source_count',d.source_count,'fully_classified_count',d.fully_classified_count,
      'partially_classified_count',d.partially_classified_count,'unclassified_count',d.unclassified_count,
      'allocated_share',d.allocated_share,'coverage_pct',d.coverage_pct
    ) order by d.ord) from domain_rows d),'[]'::jsonb)
  ) into v_result
  from totals t;

  return coalesce(v_result,jsonb_build_object(
    'competence',to_char(date_trunc('month',p_competence),'YYYY-MM-DD'),'squad_code',case when v_all then 'ALL' else v_code end,
    'product_count',0,'active_product_count',0,'source_count',0,'fully_classified_source_count',0,
    'partially_classified_source_count',0,'unclassified_source_count',0,'allocated_share',0,'unclassified_share',0,
    'classification_coverage_pct',null,'products','[]'::jsonb,'domains','[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_strategy_product_foundation(date,text) from public;
grant execute on function public.get_strategy_product_foundation(date,text) to authenticated;

comment on table public.strategy_products is
'V2.61.0: dimensao oficial de Produto para unit economics e comparacoes Produto/Squad.';
comment on table public.strategy_product_sources is
'V2.61.0: registro unico de fatos/fontes que futuramente serao reconciliados por Produto. Uma fonte nunca desaparece por falta de classificacao.';
comment on table public.strategy_product_attributions is
'V2.61.0: atribuicao fracionaria Produto x fonte. O saldo ate 100% e tratado como Nao classificado.';
comment on function public.get_strategy_product_foundation(date,text) is
'V2.61.0: resumo agregado da fundacao Produto/Squad, com cobertura de classificacao e saldo Nao classificado.';

select pg_notify('pgrst','reload schema');
commit;
