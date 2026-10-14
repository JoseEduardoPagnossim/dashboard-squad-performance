-- Soften Performance Hub V2.50.2 R4
-- Fonte organizacional definitiva da Apresentacao.
-- Usa o mesmo padrao de contexto do login: auth.uid() -> profile ativo -> organization_id.

begin;

create or replace function public.get_presentation_daily_context_v2502(
  p_start_date date default null,
  p_end_date date default null,
  p_squad_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_start_key integer;
  v_end_key integer;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  select p.*
    into v_profile
    from public.profiles p
   where p.user_id = v_user
     and p.active = true
   limit 1;

  if not found then
    raise exception 'Perfil ativo nao encontrado.';
  end if;

  if p_start_date is not null then
    v_start_key := extract(year from p_start_date)::integer * 10000
      + extract(month from p_start_date)::integer * 100
      + extract(day from p_start_date)::integer;
  end if;

  if p_end_date is not null then
    v_end_key := extract(year from p_end_date)::integer * 10000
      + extract(month from p_end_date)::integer * 100
      + extract(day from p_end_date)::integer;
  end if;

  with source_rows as (
    select
      s.code::text as squad_code,
      sm.year,
      sm.month,
      dm.day,
      tm.technician_name::text as technician_name,
      coalesce(dm.att,0)::numeric as att,
      coalesce(dm.notes5,0)::numeric as notes5,
      coalesce(dm.notes4,0)::numeric as notes4,
      coalesce(dm.notes3,0)::numeric as notes3,
      coalesce(dm.notes2,0)::numeric as notes2,
      coalesce(dm.notes1,0)::numeric as notes1,
      sm.year * 10000 + sm.month * 100 + dm.day as date_key
    from public.daily_metrics dm
    join public.technician_monthly tm on tm.id = dm.technician_month_id
    join public.squad_months sm on sm.id = tm.squad_month_id
    join public.squads s on s.id = sm.squad_id
    where s.organization_id = v_profile.organization_id
      and s.active = true
  ), filtered as (
    select *
    from source_rows sr
    where (p_squad_code is null or upper(trim(sr.squad_code)) = upper(trim(p_squad_code)))
      and (v_start_key is null or sr.date_key >= v_start_key)
      and (v_end_key is null or sr.date_key <= v_end_key)
  ), aggregated as (
    select
      f.squad_code,
      f.year,
      f.month,
      f.day,
      f.technician_name,
      coalesce(sum(f.att),0)::bigint as att,
      coalesce(sum(f.notes5),0)::bigint as notes5,
      coalesce(sum(f.notes4),0)::bigint as notes4,
      coalesce(sum(f.notes3),0)::bigint as notes3,
      coalesce(sum(f.notes2),0)::bigint as notes2,
      coalesce(sum(f.notes1),0)::bigint as notes1,
      coalesce(sum(f.notes5 + f.notes4 + f.notes3 + f.notes2 + f.notes1),0)::bigint as total_eval,
      case
        when coalesce(sum(f.notes5 + f.notes4 + f.notes3 + f.notes2 + f.notes1),0) = 0 then 0::numeric
        else (
          sum(f.notes5 * 5 + f.notes4 * 4 + f.notes3 * 3 + f.notes2 * 2 + f.notes1)::numeric
          / sum(f.notes5 + f.notes4 + f.notes3 + f.notes2 + f.notes1)::numeric
        )
      end as avg_rating,
      case
        when coalesce(sum(f.att),0) = 0 then 0::numeric
        else sum(f.notes5 + f.notes4 + f.notes3 + f.notes2 + f.notes1)::numeric / sum(f.att)::numeric
      end as eval_pct
    from filtered f
    group by f.squad_code, f.year, f.month, f.day, f.technician_name
  )
  select jsonb_build_object(
    'schema', 'v2.50.2-r4',
    'generated_at', now(),
    'requested_squad', coalesce(nullif(trim(p_squad_code),''), 'all'),
    'requested_start', p_start_date,
    'requested_end', p_end_date,
    'source_total', (select count(*) from source_rows),
    'row_count', (select count(*) from aggregated),
    'rows', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'squad_code', a.squad_code,
          'year', a.year,
          'month', a.month,
          'day', a.day,
          'technician_name', a.technician_name,
          'att', a.att,
          'notes5', a.notes5,
          'notes4', a.notes4,
          'notes3', a.notes3,
          'notes2', a.notes2,
          'notes1', a.notes1,
          'total_eval', a.total_eval,
          'avg_rating', a.avg_rating,
          'eval_pct', a.eval_pct
        )
        order by a.year, a.month, a.day, a.squad_code, a.technician_name
      )
      from aggregated a
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.get_presentation_daily_context_v2502(date,date,text) from public;
grant execute on function public.get_presentation_daily_context_v2502(date,date,text) to authenticated;

comment on function public.get_presentation_daily_context_v2502(date,date,text) is
'V2.50.2 R4: contexto diario da Apresentacao para todos os tecnicos da mesma organizacao, filtrado por periodo e Squad.';

-- Forca o PostgREST/Supabase a atualizar o cache de funcoes apos a migration.
notify pgrst, 'reload schema';

commit;
