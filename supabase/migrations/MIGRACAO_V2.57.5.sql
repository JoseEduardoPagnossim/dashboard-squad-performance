-- Soften Performance Hub V2.57.5
-- Resultado Executivo: histórico financeiro + produção/qualidade agregadas.

begin;

create or replace function public.get_strategy_financial_history(p_squad_code text default null)
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
  v_code := upper(trim(coalesce(p_squad_code,'')));
  v_all := v_code='' or v_code='ALL';

  with rows as (
    select
      sc.competence,
      sc.status,
      coalesce((select count(distinct sec.person_id) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) people_count,
      coalesce((select round(sum(sec.fte)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) fte,
      coalesce((select round(sum(sec.salary*sec.fte)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) salary,
      coalesce((select round(sum(sec.employer_charges*sec.fte)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) employer_charges,
      coalesce((select round(sum(sec.benefits*sec.fte)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) benefits,
      coalesce((select round(sum(sec.variable_pay*sec.fte)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) variable_pay,
      coalesce((select round(sum(sec.overtime*sec.fte)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) overtime,
      coalesce((select round(sum(sec.other_costs*sec.fte)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) other_costs,
      coalesce((select round(sum(sec.total_cost)::numeric,2) from public.strategy_employee_costs sec where sec.organization_id=v_org and sec.competence_id=sc.id and (v_all or upper(coalesce(sec.squad_code_snapshot,''))=v_code)),0) people_cost,
      case when v_all then
        coalesce((select round(sum(soc.amount)::numeric,2) from public.strategy_operational_costs soc where soc.organization_id=v_org and soc.competence_id=sc.id),0)
      else
        coalesce((select round(sum(sca.allocated_amount)::numeric,2) from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id where sca.organization_id=v_org and soc.competence_id=sc.id and upper(sca.squad_code)=v_code),0)
      end operational_cost,
      coalesce((select round(sum(sca.allocated_amount)::numeric,2) from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id where sca.organization_id=v_org and soc.competence_id=sc.id and upper(sca.squad_code)='UNALLOCATED'),0) unallocated_operational_cost,
      coalesce((select sum(tm.att)::bigint from public.squads s join public.squad_months sm on sm.squad_id=s.id left join public.technician_monthly tm on tm.squad_month_id=sm.id where s.organization_id=v_org and sm.year=extract(year from sc.competence)::int and sm.month=extract(month from sc.competence)::int and (v_all or upper(s.code)=v_code)),0) attendance,
      (select case when coalesce(sum(greatest(tm.att-coalesce(tm.evaluation_excluded_att,0),0)),0)>0 then coalesce(sum(tm.total_eval),0)::numeric/sum(greatest(tm.att-coalesce(tm.evaluation_excluded_att,0),0))::numeric else null end from public.squads s join public.squad_months sm on sm.squad_id=s.id left join public.technician_monthly tm on tm.squad_month_id=sm.id where s.organization_id=v_org and sm.year=extract(year from sc.competence)::int and sm.month=extract(month from sc.competence)::int and (v_all or upper(s.code)=v_code)) evaluation_rate
    from public.strategy_competences sc
    where sc.organization_id=v_org
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'competence',to_char(r.competence,'YYYY-MM'),'status',r.status,'squad_code',case when v_all then 'ALL' else v_code end,
    'people_count',r.people_count,'fte',r.fte,'salary',r.salary,'employer_charges',r.employer_charges,'benefits',r.benefits,'variable_pay',r.variable_pay,'overtime',r.overtime,'other_costs',r.other_costs,
    'people_cost',r.people_cost,'operational_cost',r.operational_cost,'unallocated_operational_cost',r.unallocated_operational_cost,'total_cost',round((r.people_cost+r.operational_cost)::numeric,2),
    'attendance',r.attendance,'evaluation_rate',r.evaluation_rate
  ) order by r.competence),'[]'::jsonb) into v_result from rows r;
  return coalesce(v_result,'[]'::jsonb);
end;
$$;
revoke all on function public.get_strategy_financial_history(text) from public;
grant execute on function public.get_strategy_financial_history(text) to authenticated;

-- A consolidação por Squad também passa a trazer produção e qualidade para usuários
-- estratégicos sem depender das permissões das telas operacionais.
create or replace function public.get_strategy_squad_cost_summary(p_competence date)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_org uuid; v_result jsonb;
begin
  if not public.has_strategy_access('aggregates') then raise exception 'strategy aggregate access denied' using errcode='42501'; end if;
  select (public.current_profile()).organization_id into v_org;
  with comp as (select id from public.strategy_competences where organization_id=v_org and competence=date_trunc('month',p_competence)::date limit 1),
  p as (select upper(coalesce(sec.squad_code_snapshot,'')) squad_code,count(distinct sec.person_id) people_count,coalesce(round(sum(sec.fte)::numeric,2),0) fte,coalesce(round(sum(sec.total_cost)::numeric,2),0) people_cost from public.strategy_employee_costs sec join comp c on c.id=sec.competence_id where sec.organization_id=v_org and nullif(trim(sec.squad_code_snapshot),'') is not null group by 1),
  o as (select upper(sca.squad_code) squad_code,coalesce(round(sum(sca.allocated_amount)::numeric,2),0) operational_cost from public.strategy_cost_allocations sca join public.strategy_operational_costs soc on soc.id=sca.operational_cost_id join comp c on c.id=soc.competence_id where sca.organization_id=v_org and upper(sca.squad_code)<>'UNALLOCATED' group by 1),
  ops as (select upper(s.code) squad_code,coalesce(sum(tm.att),0)::bigint attendance,case when coalesce(sum(greatest(tm.att-coalesce(tm.evaluation_excluded_att,0),0)),0)>0 then coalesce(sum(tm.total_eval),0)::numeric/sum(greatest(tm.att-coalesce(tm.evaluation_excluded_att,0),0))::numeric else null end evaluation_rate from public.squads s join public.squad_months sm on sm.squad_id=s.id left join public.technician_monthly tm on tm.squad_month_id=sm.id where s.organization_id=v_org and sm.year=extract(year from p_competence)::int and sm.month=extract(month from p_competence)::int group by upper(s.code)),
  codes as (select squad_code from p union select squad_code from o union select squad_code from ops)
  select coalesce(jsonb_agg(jsonb_build_object('squad_code',codes.squad_code,'people_count',coalesce(p.people_count,0),'fte',coalesce(p.fte,0),'people_cost',coalesce(p.people_cost,0),'operational_cost',coalesce(o.operational_cost,0),'total_cost',coalesce(p.people_cost,0)+coalesce(o.operational_cost,0),'attendance',coalesce(ops.attendance,0),'evaluation_rate',ops.evaluation_rate) order by codes.squad_code),'[]'::jsonb) into v_result from codes left join p using(squad_code) left join o using(squad_code) left join ops using(squad_code);
  return coalesce(v_result,'[]'::jsonb);
end;$$;
revoke all on function public.get_strategy_squad_cost_summary(date) from public;
grant execute on function public.get_strategy_squad_cost_summary(date) to authenticated;

notify pgrst,'reload schema';
commit;
