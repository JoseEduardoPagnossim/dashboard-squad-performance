-- V2.61.9: snapshots imutaveis de Produto/Squad por revisao do fechamento financeiro.
begin;
create table if not exists public.strategy_product_squad_snapshots (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 competence_id uuid not null references public.strategy_competences(id) on delete cascade,
 revision integer not null check(revision>0),
 financial_snapshot_revision integer not null check(financial_snapshot_revision>0),
 snapshot_version text not null default 'PS-1.0.0',
 rule_version text not null default 'PS-1.0.0-history',
 snapshot jsonb not null,
 created_at timestamptz not null default now(),
 unique(organization_id,competence_id,revision)
);
create index if not exists idx_strategy_product_squad_snapshots_history on public.strategy_product_squad_snapshots(organization_id,competence_id,revision desc);
alter table public.strategy_product_squad_snapshots enable row level security;
revoke all on public.strategy_product_squad_snapshots from public,anon,authenticated;
grant select on public.strategy_product_squad_snapshots to authenticated;
drop policy if exists strategy_product_squad_snapshot_read on public.strategy_product_squad_snapshots;
create policy strategy_product_squad_snapshot_read on public.strategy_product_squad_snapshots for select to authenticated using(organization_id=(public.current_profile()).organization_id and public.has_strategy_access('aggregates'));

-- Persistencia e leitura de revisoes exclusivamente por funcao server-side.
create or replace function public.freeze_strategy_product_squad_snapshot(p_competence date)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_org uuid;v_comp public.strategy_competences%rowtype;v_squads jsonb;v_code text;v_rev integer;v_payload jsonb;v_existing jsonb;
begin
 if not public.has_strategy_access('close_competence') then raise exception 'access to close strategy competence required' using errcode='42501';end if;
 v_org:=(public.current_profile()).organization_id;
 if v_org is null then raise exception 'active profile not found' using errcode='42501';end if;
 select * into v_comp from public.strategy_competences where organization_id=v_org and competence=p_competence for update;
 if not found or v_comp.status<>'closed' then raise exception 'Competencia deve estar fechada para congelar Produto/Squad';end if;
 v_rev:=coalesce(v_comp.snapshot_revision,0);
 if v_rev<=0 then raise exception 'Revisao financeira invalida';end if;
 select snapshot into v_existing from public.strategy_product_squad_snapshots where organization_id=v_org and competence_id=v_comp.id and revision=v_rev;
 if found then return jsonb_build_object('revision',v_rev,'already_frozen',true,'snapshot',v_existing);end if;
 v_squads:='[]'::jsonb;
 for v_code in select distinct upper(trim(squad_code_snapshot)) from public.strategy_product_sources where organization_id=v_org and competence_id=v_comp.id and coalesce(trim(squad_code_snapshot),'')<>'' order by 1 loop
  v_squads:=v_squads||jsonb_build_array(jsonb_build_object('code',v_code,'data',public.get_strategy_product_unit_economics_summary(p_competence,v_code)));
 end loop;
 if jsonb_array_length(v_squads)=0 then raise exception 'Nenhuma fonte Produto/Squad disponivel para congelamento';end if;
 v_payload:=jsonb_build_object('competence',to_char(p_competence,'YYYY-MM'),'squads',v_squads,'source','official-unit-economics-rpc');
 insert into public.strategy_product_squad_snapshots(organization_id,competence_id,revision,financial_snapshot_revision,snapshot)
 values(v_org,v_comp.id,v_rev,v_rev,v_payload) on conflict do nothing;
 return jsonb_build_object('revision',v_rev,'already_frozen',false,'snapshot',v_payload);
end;$$;
revoke all on function public.freeze_strategy_product_squad_snapshot(date) from public,anon;
grant execute on function public.freeze_strategy_product_squad_snapshot(date) to authenticated;
-- Nenhuma permissao de UPDATE/DELETE/INSERT e concedida aos clientes.
commit;
