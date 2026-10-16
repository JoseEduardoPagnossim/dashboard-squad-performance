-- Soften Performance Hub V2.51.0
-- Identidade estavel de tecnicos + aliases historicos de CSV.

begin;

create or replace function public.technician_alias_key(p_name text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(
    translate(
      upper(btrim(coalesce(p_name,''))),
      'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ',
      'AAAAAEEEEIIIIOOOOOUUUUCN'
    ),
    '[[:space:]]+',
    '',
    'g'
  );
$$;

create table if not exists public.technician_aliases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  alias_name text not null,
  alias_key text not null,
  source text not null default 'manual' check (source in ('profile','full_name','history','monthly','audit','manual','automatic')),
  active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technician_aliases_user_key_unique unique (user_id, alias_key),
  constraint technician_aliases_name_not_blank check (length(btrim(alias_name)) > 0),
  constraint technician_aliases_key_not_blank check (length(btrim(alias_key)) > 0)
);

create or replace function public.prepare_technician_alias()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_organization_id uuid;
begin
  select p.organization_id into v_organization_id
  from public.profiles p
  where p.user_id = new.user_id;
  if v_organization_id is null then
    raise exception 'Perfil do tecnico nao encontrado para o alias.';
  end if;
  new.organization_id := v_organization_id;
  new.alias_name := upper(regexp_replace(btrim(coalesce(new.alias_name,'')), '[[:space:]]+', ' ', 'g'));
  new.alias_key := public.technician_alias_key(new.alias_name);
  new.updated_at := now();
  if new.alias_key = '' then
    raise exception 'Alias de tecnico invalido.';
  end if;
  return new;
end;
$$;

drop trigger if exists technician_aliases_prepare on public.technician_aliases;
create trigger technician_aliases_prepare
before insert or update on public.technician_aliases
for each row execute function public.prepare_technician_alias();

create index if not exists idx_technician_aliases_org_key
  on public.technician_aliases (organization_id, alias_key)
  where active = true;

create index if not exists idx_technician_aliases_user
  on public.technician_aliases (user_id, active);

-- Ajuda as importacoes a localizar rapidamente o registro mensal da pessoa real.
create index if not exists idx_technician_monthly_month_user
  on public.technician_monthly (squad_month_id, user_id)
  where user_id is not null;

alter table public.technician_aliases enable row level security;

drop policy if exists technician_aliases_select on public.technician_aliases;
create policy technician_aliases_select on public.technician_aliases
for select to authenticated
using (
  organization_id = (select (public.current_profile()).organization_id)
);

drop policy if exists technician_aliases_insert on public.technician_aliases;
create policy technician_aliases_insert on public.technician_aliases
for insert to authenticated
with check (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
  and exists (
    select 1 from public.profiles p
    where p.user_id = technician_aliases.user_id
      and p.organization_id = technician_aliases.organization_id
  )
);

drop policy if exists technician_aliases_update on public.technician_aliases;
create policy technician_aliases_update on public.technician_aliases
for update to authenticated
using (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
)
with check (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
);

drop policy if exists technician_aliases_delete on public.technician_aliases;
create policy technician_aliases_delete on public.technician_aliases
for delete to authenticated
using (
  public.is_super_admin()
  and organization_id = (select (public.current_profile()).organization_id)
);

grant select, insert, update, delete on table public.technician_aliases to authenticated;

-- Semente inicial: nome atual, nome completo, historico de Squad, registros mensais ja vinculados
-- e nomes anteriores registrados na auditoria. Isso recupera mudancas feitas antes da V2.51.0.
with alias_candidates as (
  select p.organization_id, p.user_id, p.technician_name as alias_name, 'profile'::text as source
  from public.profiles p
  where p.role = 'technician' and nullif(btrim(p.technician_name),'') is not null

  union all

  select p.organization_id, p.user_id, p.full_name, 'full_name'::text
  from public.profiles p
  where p.role = 'technician' and nullif(btrim(p.full_name),'') is not null

  union all

  select h.organization_id, h.user_id, h.technician_name, 'history'::text
  from public.profile_squad_history h
  where nullif(btrim(h.technician_name),'') is not null

  union all

  select s.organization_id, tm.user_id, tm.technician_name, 'monthly'::text
  from public.technician_monthly tm
  join public.squad_months sm on sm.id = tm.squad_month_id
  join public.squads s on s.id = sm.squad_id
  where tm.user_id is not null and nullif(btrim(tm.technician_name),'') is not null

  union all

  select p.organization_id, p.user_id, a.before_data->>'technician_name', 'audit'::text
  from public.audit_logs a
  join public.profiles p on p.user_id::text = a.entity_id
  where a.entity_type = 'profile'
    and nullif(btrim(a.before_data->>'technician_name'),'') is not null

  union all

  select p.organization_id, p.user_id, a.after_data->>'technician_name', 'audit'::text
  from public.audit_logs a
  join public.profiles p on p.user_id::text = a.entity_id
  where a.entity_type = 'profile'
    and nullif(btrim(a.after_data->>'technician_name'),'') is not null
)
, normalized_candidates as (
  select
    c.organization_id,
    c.user_id,
    c.alias_name,
    public.technician_alias_key(c.alias_name) as alias_key,
    c.source,
    case c.source
      when 'profile' then 1
      when 'full_name' then 2
      when 'history' then 3
      when 'monthly' then 4
      when 'audit' then 5
      else 9
    end as source_priority
  from alias_candidates c
  where public.technician_alias_key(c.alias_name) <> ''
), deduplicated_candidates as (
  select distinct on (user_id, alias_key)
    organization_id, user_id, alias_name, alias_key, source
  from normalized_candidates
  order by user_id, alias_key, source_priority, alias_name
)
insert into public.technician_aliases (
  organization_id, user_id, alias_name, alias_key, source, active
)
select
  c.organization_id,
  c.user_id,
  c.alias_name,
  c.alias_key,
  c.source,
  true
from deduplicated_candidates c
on conflict (user_id, alias_key) do update
set active = true,
    updated_at = now();

comment on table public.technician_aliases is
'V2.51.0: nomes atuais e historicos aceitos no CSV para identificar um tecnico pelo user_id, sem tratar mudanca de nome como uma nova pessoa.';

comment on column public.technician_monthly.user_id is
'Identidade estavel do tecnico. A partir da V2.51.0, importacoes devem priorizar este campo; technician_name permanece como rotulo de exibicao.';

notify pgrst, 'reload schema';

commit;
