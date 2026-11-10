-- R23: Recalculo EXPLICITO das comissoes de vendas ja existentes reconhecidas como
-- duplicadas na reimportacao; nunca duplica venda/receita e nunca altera snapshots.
-- Requer V2.63.16/R21. Executar em homologacao antes de producao.
begin;
create table if not exists public.strategy_commission_replacements_r23 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 batch_id uuid not null references public.strategy_import_batches(id) on delete restrict,
 source_key text not null check(source_key in ('contracted_modules_csv','merchandise_sales_csv')),
 sale_id uuid not null,
 commission_id uuid not null references public.strategy_sales_commissions(id) on delete restrict,
 competence date not null,
 old_amount numeric(14,2),new_amount numeric(14,2),
 old_status text not null,new_status text not null,
 old_revision integer not null,new_revision integer not null,
 old_rule jsonb not null,new_rule jsonb not null,
 changed_by uuid not null references auth.users(id),
 changed_at timestamptz not null default now(),
 unique(organization_id,batch_id,source_key,sale_id)
);
alter table public.strategy_commission_replacements_r23 enable row level security;
revoke all on public.strategy_commission_replacements_r23 from public,anon,authenticated;
grant select on public.strategy_commission_replacements_r23 to authenticated;
create policy strategy_commission_replacements_read_r23 on public.strategy_commission_replacements_r23
 for select to authenticated using (
 organization_id=(select (public.current_profile()).organization_id)
 and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs'));

create or replace function public.replace_strategy_batch_commissions_r23(p_batch_id uuid,p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_org uuid;v_source text;v_row record;v_sale record;v_comm public.strategy_sales_commissions%rowtype;
 v_rule jsonb;v_amount numeric(14,2);v_status text;
 v_row_revision integer;
 v_eligible integer:=0;v_changed integer:=0;v_missing integer:=0;v_pending integer:=0;v_applied integer:=0;
 v_old_total numeric:=0;v_new_total numeric:=0;
begin
 v_org:=(select (public.current_profile()).organization_id);
 if auth.uid() is null or v_org is null or not public.has_strategy_access('people_costs')
    or not public.has_strategy_access('edit_costs') then
    raise exception 'Permissao estrategica insuficiente.' using errcode='42501';end if;
 if p_batch_id is null then raise exception 'Lote obrigatorio.';end if;
 select s.source_key into v_source from public.strategy_import_batches b
 join public.strategy_import_sources s on s.id=b.source_id and s.organization_id=b.organization_id
 where b.id=p_batch_id and b.organization_id=v_org and b.status='imported'
   and s.source_key in ('contracted_modules_csv','merchandise_sales_csv');
 if v_source is null then raise exception 'Lote inexistente, incompleto ou fora do escopo.';end if;

 -- Seleciona SOMENTE identidades marcadas como duplicate neste lote, nunca todas
 -- as vendas de uma competencia e nunca registros de outras organizacoes.
 for v_row in
   select a.sale_identity from public.strategy_recurring_import_attempts a
   where v_source='contracted_modules_csv' and a.organization_id=v_org
     and a.batch_id=p_batch_id and a.outcome='duplicate'
   union all
   select a.sale_identity from public.strategy_merchandise_import_attempts a
   where v_source='merchandise_sales_csv' and a.organization_id=v_org
     and a.batch_id=p_batch_id and a.outcome='duplicate'
 loop
   if v_source='contracted_modules_csv' then
     select id,competence,person_id,product_id,squad_code,monthly_amount as gross_amount
       into v_sale from public.strategy_recurring_sales
       where organization_id=v_org and source_key=v_source and sale_identity=v_row.sale_identity;
   else
     select id,competence,person_id,product_id,squad_code,gross_amount
       into v_sale from public.strategy_merchandise_sales
       where organization_id=v_org and source_key=v_source and sale_identity=v_row.sale_identity;
   end if;
   if v_sale.id is null then raise exception 'Venda duplicada nao localizada. Operacao cancelada.';end if;
   if exists(select 1 from public.strategy_commission_replacements_r23 a
        where a.organization_id=v_org and a.batch_id=p_batch_id and a.source_key=v_source and a.sale_id=v_sale.id) then
      v_applied:=v_applied+1;continue;
   end if;
   -- Lock impede concorrencia com fechamentos e recálculos.
   select * into v_comm from public.strategy_sales_commissions c
      where c.organization_id=v_org and c.source_key=v_source and c.sale_id=v_sale.id
      for update;
   if not found then v_missing:=v_missing+1;continue;end if;
   if exists(select 1 from public.strategy_competences c where c.organization_id=v_org
              and c.competence=v_sale.competence and c.status='closed')
      or exists(select 1 from public.squad_months sm join public.squads s on s.id=sm.squad_id
                where s.organization_id=v_org and s.code::text=v_sale.squad_code
                  and sm.year=extract(year from v_sale.competence)::integer
                  and sm.month=extract(month from v_sale.competence)::integer and sm.is_closed=true) then
      raise exception 'Competencia fechada (%). Nao e permitido recalcular.',v_sale.competence;
   end if;
   -- Nao alterar comissao quando ja foi transferida para bonificacao operacional.
   if exists(select 1 from public.technician_finance_monthly tf
       join public.technician_monthly tm on tm.id=tf.technician_month_id
       join public.squad_months sm on sm.id=tm.squad_month_id
       join public.squads s on s.id=sm.squad_id
       join public.strategy_people p on p.user_id=tm.user_id and p.organization_id=v_org
       where p.id=v_sale.person_id and s.organization_id=v_org
         and s.code::text=v_sale.squad_code
         and sm.year=extract(year from v_sale.competence)::integer
         and sm.month=extract(month from v_sale.competence)::integer
         and coalesce(tf.sales_commission,0)<>0)
      or exists(select 1 from public.super_admin_commissions lc
          join public.strategy_people p on p.user_id=lc.user_id and p.organization_id=v_org
          where p.id=v_sale.person_id and lc.organization_id=v_org
            and lc.year=extract(year from v_sale.competence)::integer
            and lc.month=extract(month from v_sale.competence)::integer
            and coalesce(lc.imported_sales_commission,0)<>0) then
      raise exception 'Comissao ja vinculada a bonificacao da competencia %. Revise antes de recalcular.',v_sale.competence;
   end if;
   select jsonb_build_object('type',pr.commission_type,'percentage',pr.commission_percentage,
             'third_party_cost',pr.third_party_cost,'fixed_amount',pr.fixed_amount),pr.commission_revision
       into v_rule,v_row_revision
       from public.strategy_commercial_products pr
       where pr.id=v_sale.product_id and pr.organization_id=v_org and pr.source_key=v_source and pr.active=true;
   if v_rule is null then v_pending:=v_pending+1;continue;end if;
   v_amount:=public.strategy_commission_amount_v2636(v_sale.gross_amount,v_rule);
   if v_amount is null then v_pending:=v_pending+1;continue;end if;
   v_eligible:=v_eligible+1;v_old_total:=v_old_total+coalesce(v_comm.commission_amount,0);
   v_new_total:=v_new_total+v_amount;
   if p_apply then
     insert into public.strategy_commission_replacements_r23
       (organization_id,batch_id,source_key,sale_id,commission_id,competence,
        old_amount,new_amount,old_status,new_status,old_revision,new_revision,old_rule,new_rule,changed_by)
     values(v_org,p_batch_id,v_source,v_sale.id,v_comm.id,v_sale.competence,
        v_comm.commission_amount,v_amount,v_comm.status,'calculated',v_comm.rule_revision,
        v_row_revision,v_comm.rule_snapshot,v_rule,auth.uid());
     update public.strategy_sales_commissions
       set commission_amount=v_amount,status='calculated',rule_snapshot=v_rule,
           rule_revision=v_row_revision
       where id=v_comm.id and organization_id=v_org;
     v_changed:=v_changed+1;
   end if;
 end loop;
 return jsonb_build_object('eligible',v_eligible,'changed',v_changed,'missingLedger',v_missing,
   'pendingRule',v_pending,'alreadyApplied',v_applied,'oldTotal',v_old_total,'newTotal',v_new_total,
   'delta',v_new_total-v_old_total,'mode',case when p_apply then 'applied' else 'preview' end);
end $$;
revoke all on function public.replace_strategy_batch_commissions_r23(uuid,boolean) from public,anon;
grant execute on function public.replace_strategy_batch_commissions_r23(uuid,boolean) to authenticated;
commit;
