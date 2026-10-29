-- V2.63.2: aliases explicitos de vendedores; sem importar dados financeiros.
-- Depende de MIGRACAO_V2.63.0 e V2.63.1.
begin;
create table if not exists public.strategy_seller_aliases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_key text not null check (source_key in ('contracted_modules_csv','merchandise_sales_csv')),
  squad_code text not null check (squad_code in ('A','B','C','D','E')),
  alias_name text not null check (length(btrim(alias_name)) between 2 and 160),
  alias_normalized text not null check (alias_normalized ~ '^[a-z0-9]{2,160}$'),
  person_id uuid not null references public.strategy_people(id) on delete restrict,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,source_key,squad_code,alias_normalized)
);
create index if not exists idx_strategy_seller_aliases_scope_v2632 on public.strategy_seller_aliases(organization_id,source_key,squad_code);
alter table public.strategy_seller_aliases enable row level security;
drop policy if exists strategy_seller_aliases_select_v2632 on public.strategy_seller_aliases;
create policy strategy_seller_aliases_select_v2632 on public.strategy_seller_aliases for select to authenticated
 using (organization_id=(select (public.current_profile()).organization_id)
   and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));
revoke all on public.strategy_seller_aliases from anon,authenticated;
grant select on public.strategy_seller_aliases to authenticated;
-- Nao liberar escrita direta: o servidor verifica organizacao, perfil, Squad e identidade da pessoa.
create or replace function public.upsert_strategy_seller_alias_v2632(
 p_source_key text,p_squad_code text,p_alias_name text,p_alias_normalized text,p_person_id uuid
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_person public.strategy_people%rowtype;v_role text;v_active boolean;v_id uuid;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs')
    or not public.has_strategy_access('edit_costs') then raise exception 'Acesso negado a conciliacao comercial.';end if;
 if p_source_key not in ('contracted_modules_csv','merchandise_sales_csv') or p_source_key is null
    or p_squad_code not in ('A','B','C','D','E') or p_squad_code is null
    or length(btrim(coalesce(p_alias_name,''))) not between 2 and 160
    or coalesce(p_alias_normalized,'') !~ '^[a-z0-9]{2,160}$' then
    raise exception 'Dados de alias invalidos.';end if;
 select * into v_person from public.strategy_people where id=p_person_id and organization_id=v_org and active=true;
 if not found or v_person.user_id is null then raise exception 'Pessoa sem conta ativa na organizacao.';end if;
 select role,active into v_role,v_active from public.profiles
  where user_id=v_person.user_id and organization_id=v_org;
 if coalesce(v_active,false) is not true then raise exception 'Conta de usuario inativa.';end if;
 if coalesce(v_person.default_squad_code,'')<>p_squad_code
    or (p_squad_code='C' and (v_role<>'pre_attendance' or v_person.functional_team<>'pre_attendance'))
    or (p_squad_code<>'C' and (v_role<>'technician' or v_person.functional_team='pre_attendance')) then
    raise exception 'Pessoa e grupo incompatíveis.';end if;
 insert into public.strategy_seller_aliases(organization_id,source_key,squad_code,alias_name,alias_normalized,person_id,created_by,updated_by)
 values(v_org,p_source_key,p_squad_code,btrim(p_alias_name),p_alias_normalized,p_person_id,auth.uid(),auth.uid())
 on conflict (organization_id,source_key,squad_code,alias_normalized)
 do update set alias_name=excluded.alias_name,person_id=excluded.person_id,updated_by=auth.uid(),updated_at=now()
 returning id into v_id;
 return v_id;
end $$;
revoke all on function public.upsert_strategy_seller_alias_v2632(text,text,text,text,uuid) from public,anon;
grant execute on function public.upsert_strategy_seller_alias_v2632(text,text,text,text,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
