-- V2.63.3: catalogo comercial segregado por origem e revisoes de comissao.
-- Depende das migrations V2.63.0, V2.63.1 e V2.63.2.
-- Nenhuma venda, receita, bonificacao ou snapshot oficial e alterado.
begin;
create or replace function public.strategy_catalog_normalize_v2633(p_name text)
returns text language sql immutable strict set search_path=public as $$
 select regexp_replace(translate(lower(btrim(p_name)),
 'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
 'aaaaaaeeeeiiiiooooouuuucnyy'), '[^a-z0-9]', '', 'g')
$$;
create table if not exists public.strategy_commercial_products (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 source_key text not null check (source_key in ('contracted_modules_csv','merchandise_sales_csv')),
 name text not null check (length(btrim(name)) between 2 and 160),
 normalized_name text not null check (normalized_name ~ '^[a-z0-9]{2,160}$'),
 generates_mrr boolean not null,
 active boolean not null default true,
 commission_type text not null default 'unconfigured' check (commission_type in ('unconfigured','full','percentage','net_after_third_party','fixed')),
 commission_percentage numeric(10,2),
 third_party_cost numeric(16,2),
 fixed_amount numeric(16,2),
 commission_revision integer not null default 0 check (commission_revision>=0),
 created_by uuid not null references auth.users(id),
 updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,source_key,normalized_name),
 constraint strategy_commercial_products_mrr_v2633 check
  (generates_mrr=(source_key='contracted_modules_csv')),
 constraint strategy_commercial_products_rule_v2633 check (
  (commission_type in ('unconfigured','full') and commission_percentage is null and third_party_cost is null and fixed_amount is null) or
  (commission_type='percentage' and commission_percentage between 0 and 100 and third_party_cost is null and fixed_amount is null) or
  (commission_type='net_after_third_party' and third_party_cost>=0 and commission_percentage is null and fixed_amount is null) or
  (commission_type='fixed' and fixed_amount>=0 and commission_percentage is null and third_party_cost is null)
 ),
 constraint strategy_commercial_products_normalized_v2633 check
  (normalized_name=public.strategy_catalog_normalize_v2633(name))
);
create index if not exists idx_strategy_commercial_products_scope_v2633
 on public.strategy_commercial_products(organization_id,source_key,name);
create table if not exists public.strategy_commercial_commission_revisions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 product_id uuid not null references public.strategy_commercial_products(id) on delete restrict,
 revision integer not null check(revision>0),
 commission_type text not null check (commission_type in ('unconfigured','full','percentage','net_after_third_party','fixed')),
 commission_percentage numeric(10,2),third_party_cost numeric(16,2),fixed_amount numeric(16,2),
 changed_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(product_id,revision),
 constraint strategy_commercial_commission_revisions_rule_v2633 check (
  (commission_type in ('unconfigured','full') and commission_percentage is null and third_party_cost is null and fixed_amount is null) or
  (commission_type='percentage' and commission_percentage between 0 and 100 and third_party_cost is null and fixed_amount is null) or
  (commission_type='net_after_third_party' and third_party_cost>=0 and commission_percentage is null and fixed_amount is null) or
  (commission_type='fixed' and fixed_amount>=0 and commission_percentage is null and third_party_cost is null)
 )
);
create index if not exists idx_strategy_commercial_revisions_scope_v2633
 on public.strategy_commercial_commission_revisions(organization_id,product_id,revision);
alter table public.strategy_commercial_products enable row level security;
alter table public.strategy_commercial_commission_revisions enable row level security;
drop policy if exists strategy_commercial_products_read_v2633 on public.strategy_commercial_products;
create policy strategy_commercial_products_read_v2633 on public.strategy_commercial_products for select to authenticated
 using(organization_id=(select (public.current_profile()).organization_id)
 and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));
drop policy if exists strategy_commercial_revisions_read_v2633 on public.strategy_commercial_commission_revisions;
create policy strategy_commercial_revisions_read_v2633 on public.strategy_commercial_commission_revisions for select to authenticated
 using(organization_id=(select (public.current_profile()).organization_id)
 and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));
revoke all on public.strategy_commercial_products from public,anon,authenticated;
revoke all on public.strategy_commercial_commission_revisions from public,anon,authenticated;
grant select on public.strategy_commercial_products to authenticated;
grant select on public.strategy_commercial_commission_revisions to authenticated;
-- As escritas ocorrem somente via RPC de seguranca, nunca pelo cliente direto.
create or replace function public.register_strategy_commercial_products_v2633(p_source_key text,p_products jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_name text;v_norm text;v_item jsonb;v_seen text[]:=array[]::text[];v_new int:=0;v_existing int:=0;v_total int:=0;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs')
 then raise exception 'Acesso negado ao catalogo de produtos.';end if;
 if p_source_key is null or p_source_key not in ('contracted_modules_csv','merchandise_sales_csv')
 or p_products is null or jsonb_typeof(p_products)<>'array' or jsonb_array_length(p_products) not between 1 and 200
 then raise exception 'Origem ou lista de produtos invalida.';end if;
 for v_item in select value from jsonb_array_elements(p_products) loop
  if jsonb_typeof(v_item)<>'string' then raise exception 'Nome do produto deve ser texto.';end if;
  v_name:=regexp_replace(btrim(v_item#>>'{}'),'\s+',' ','g');
  v_norm:=public.strategy_catalog_normalize_v2633(v_name);
  if length(v_name) not between 2 and 160 or length(v_norm) not between 2 and 160
    or v_norm in(select unnest(v_seen)) then raise exception 'Produto invalido ou repetido no lote.';end if;
  v_seen:=array_append(v_seen,v_norm);
  insert into public.strategy_commercial_products(organization_id,source_key,name,normalized_name,generates_mrr,created_by)
   values(v_org,p_source_key,v_name,v_norm,p_source_key='contracted_modules_csv',auth.uid())
   on conflict (organization_id,source_key,normalized_name) do nothing;
  if found then v_new:=v_new+1;else v_existing:=v_existing+1;end if;
  v_total:=v_total+1;
 end loop;
 return jsonb_build_object('total',v_total,'created',v_new,'existing',v_existing);
end $$;
create or replace function public.set_strategy_commercial_commission_v2633(
 p_product_id uuid,p_commission_type text,p_percentage numeric default null,
 p_third_party_cost numeric default null,p_fixed_amount numeric default null
) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_org uuid;v_product public.strategy_commercial_products%rowtype;v_revision integer;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs') or not public.has_strategy_access('edit_costs')
 then raise exception 'Acesso negado a configuracao de comissao.';end if;
 if p_commission_type is null or p_commission_type not in ('unconfigured','full','percentage','net_after_third_party','fixed')
 or not (
  (p_commission_type in ('unconfigured','full') and p_percentage is null and p_third_party_cost is null and p_fixed_amount is null) or
  (p_commission_type='percentage' and p_percentage between 0 and 100 and scale(p_percentage)<=2 and p_third_party_cost is null and p_fixed_amount is null) or
  (p_commission_type='net_after_third_party' and p_third_party_cost between 0 and 99999999.99 and scale(p_third_party_cost)<=2 and p_percentage is null and p_fixed_amount is null) or
  (p_commission_type='fixed' and p_fixed_amount between 0 and 99999999.99 and scale(p_fixed_amount)<=2 and p_percentage is null and p_third_party_cost is null)
 ) then raise exception 'Regra de comissao invalida.';end if;
 select * into v_product from public.strategy_commercial_products where id=p_product_id and organization_id=v_org and active=true for update;
 if not found then raise exception 'Produto ausente, inativo ou de outra organizacao.';end if;
 if v_product.commission_type=p_commission_type
 and v_product.commission_percentage is not distinct from p_percentage
 and v_product.third_party_cost is not distinct from p_third_party_cost
 and v_product.fixed_amount is not distinct from p_fixed_amount then return v_product.commission_revision;end if;
 v_revision:=v_product.commission_revision+1;
 insert into public.strategy_commercial_commission_revisions
 (organization_id,product_id,revision,commission_type,commission_percentage,third_party_cost,fixed_amount,changed_by)
 values(v_org,p_product_id,v_revision,p_commission_type,p_percentage,p_third_party_cost,p_fixed_amount,auth.uid());
 update public.strategy_commercial_products set commission_type=p_commission_type,commission_percentage=p_percentage,
 third_party_cost=p_third_party_cost,fixed_amount=p_fixed_amount,commission_revision=v_revision,
 updated_by=auth.uid(),updated_at=now() where id=p_product_id and organization_id=v_org;
 return v_revision;
end $$;
revoke all on function public.register_strategy_commercial_products_v2633(text,jsonb) from public,anon;
revoke all on function public.set_strategy_commercial_commission_v2633(uuid,text,numeric,numeric,numeric) from public,anon;
grant execute on function public.register_strategy_commercial_products_v2633(text,jsonb) to authenticated;
grant execute on function public.set_strategy_commercial_commission_v2633(uuid,text,numeric,numeric,numeric) to authenticated;
notify pgrst,'reload schema';
commit;
