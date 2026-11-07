-- R21: vinculo financeiro centralizado por competencia, sem conceder edicao
-- das bonificacoes de outros administradores via acesso direto a tabela.
begin;
create or replace function public.strategy_set_leader_financial_squad_r21(
 p_leader_user_id uuid, p_year integer, p_month integer,
 p_squad_code text, p_expected_squad_code text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
 v_org uuid;
 v_id uuid;
 v_current text;
 v_existing boolean;
begin
 select organization_id into v_org
 from public.profiles
 where user_id = auth.uid() and role='super_admin' and active=true;
 if v_org is null then raise exception 'Apenas administrador ativo pode alterar vinculos financeiros.'; end if;
 if p_year not between 2020 and 2100 or p_month not between 1 and 12 or p_squad_code not in ('A','B','D','E') then
   raise exception 'Competencia ou Squad invalido.';
 end if;
 if not exists (
  select 1 from public.profiles p where p.user_id=p_leader_user_id
   and p.organization_id=v_org and p.role='super_admin' and p.active=true
 ) then raise exception 'Lider nao encontrado ou nao pertence a organizacao.'; end if;
 -- Evita corrida entre duas telas, sem sobrescrever valores financeiros.
 select id,squad_code into v_id,v_current
 from public.super_admin_commissions
 where organization_id=v_org and user_id=p_leader_user_id and year=p_year and month=p_month
 for update;
 v_existing = found;
 if coalesce(v_current,'') <> coalesce(p_expected_squad_code,'') then
  raise exception 'Vinculo alterado por outra sessao. Atualize a pagina.';
 end if;
 if v_existing then
  update public.super_admin_commissions set squad_code=p_squad_code,
   updated_by=auth.uid(),updated_at=now()
  where id=v_id;
 else
  insert into public.super_admin_commissions
   (organization_id,user_id,year,month,squad_code,updated_by)
  values(v_org,p_leader_user_id,p_year,p_month,p_squad_code,auth.uid())
  returning id into v_id;
 end if;
 -- O mesmo login passa a ter pessoa estrategica para a conciliacao comercial.
 if not exists(select 1 from public.strategy_people sp where sp.organization_id=v_org and sp.user_id=p_leader_user_id) then
  insert into public.strategy_people
   (organization_id,user_id,name,role_label,functional_team,default_squad_code,active,source)
  select p.organization_id,p.user_id,coalesce(nullif(btrim(p.full_name),''),'Lider'),
         'Lider','other',null,true,'manual'
  from public.profiles p where p.user_id=p_leader_user_id and p.organization_id=v_org;
 else
  update public.strategy_people set active=true,updated_at=now()
  where organization_id=v_org and user_id=p_leader_user_id and active=false;
 end if;
 return v_id;
end;
$$;
revoke all on function public.strategy_set_leader_financial_squad_r21(uuid,integer,integer,text,text) from public;
revoke all on function public.strategy_set_leader_financial_squad_r21(uuid,integer,integer,text,text) from anon;
grant execute on function public.strategy_set_leader_financial_squad_r21(uuid,integer,integer,text,text) to authenticated;
commit;
