-- Soften Performance Hub V2.50.2 R2
-- Corrige a fonte da Apresentacao para um consolidado diario dedicado.
-- Expoe somente metricas operacionais da mesma organizacao do usuario autenticado.

begin;

drop function if exists public.get_presentation_technician_daily_overview();

create function public.get_presentation_technician_daily_overview()
returns table (
  squad_code text,
  year integer,
  month integer,
  day integer,
  technician_name text,
  att bigint,
  notes5 bigint,
  notes4 bigint,
  notes3 bigint,
  notes2 bigint,
  notes1 bigint,
  total_eval bigint,
  avg_rating numeric,
  eval_pct numeric
)
language sql
security definer
set search_path = public
as $$
  select
    s.code::text as squad_code,
    sm.year,
    sm.month,
    dm.day,
    tm.technician_name::text,
    coalesce(sum(dm.att),0)::bigint as att,
    coalesce(sum(dm.notes5),0)::bigint as notes5,
    coalesce(sum(dm.notes4),0)::bigint as notes4,
    coalesce(sum(dm.notes3),0)::bigint as notes3,
    coalesce(sum(dm.notes2),0)::bigint as notes2,
    coalesce(sum(dm.notes1),0)::bigint as notes1,
    coalesce(sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1),0)::bigint as total_eval,
    case
      when coalesce(sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1),0) = 0 then 0::numeric
      else (
        sum(dm.notes5 * 5 + dm.notes4 * 4 + dm.notes3 * 3 + dm.notes2 * 2 + dm.notes1)::numeric
        / sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1)::numeric
      )
    end as avg_rating,
    case
      when coalesce(sum(dm.att),0) = 0 then 0::numeric
      else sum(dm.notes5 + dm.notes4 + dm.notes3 + dm.notes2 + dm.notes1)::numeric / sum(dm.att)::numeric
    end as eval_pct
  from public.daily_metrics dm
  join public.technician_monthly tm on tm.id = dm.technician_month_id
  join public.squad_months sm on sm.id = tm.squad_month_id
  join public.squads s on s.id = sm.squad_id
  where exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.organization_id = s.organization_id
      and coalesce(p.active, true) = true
  )
  group by s.code, sm.year, sm.month, dm.day, tm.technician_name
  order by sm.year, sm.month, dm.day, s.code, tm.technician_name;
$$;

revoke all on function public.get_presentation_technician_daily_overview() from public;
grant execute on function public.get_presentation_technician_daily_overview() to authenticated;

commit;
