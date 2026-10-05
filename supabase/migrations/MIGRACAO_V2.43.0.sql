-- SOFTEN PERFORMANCE HUB V2.43.0
-- Contexto inicial enxuto para login rapido + indices de apoio ao lazy loading.

begin;

create index if not exists idx_squad_months_squad_period_desc
  on public.squad_months (squad_id, year desc, month desc);

create index if not exists idx_daily_metrics_tech_day
  on public.daily_metrics (technician_month_id, day);

create index if not exists idx_quality_daily_metrics_tech_day_type
  on public.quality_daily_metrics (technician_month_id, day, quality_type);

create index if not exists idx_quality_person_month_day_type
  on public.quality_person_daily_metrics (squad_month_id, day, quality_type);

create or replace function public.get_initial_dashboard_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_latest_key integer;
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

  select max(sm.year * 100 + sm.month)
    into v_latest_key
    from public.squads s
    join public.squad_months sm on sm.squad_id = s.id
   where s.organization_id = v_profile.organization_id
     and s.active = true
     and (
       v_profile.role = 'super_admin'
       or s.id = v_profile.squad_id
     );

  select jsonb_build_object(
    'schema', 'v2.43.0',
    'generated_at', now(),
    'latest_period_key', v_latest_key,
    'profile', jsonb_build_object(
      'user_id', v_profile.user_id,
      'email', v_profile.email,
      'full_name', v_profile.full_name,
      'role', v_profile.role,
      'organization_id', v_profile.organization_id,
      'squad_id', v_profile.squad_id,
      'technician_name', v_profile.technician_name,
      'permissions', coalesce(v_profile.permissions, '{}'::jsonb),
      'ui_preferences', coalesce(v_profile.ui_preferences, '{}'::jsonb),
      'avatar_path', v_profile.avatar_path,
      'squad', (
        select jsonb_build_object('id', s.id, 'code', s.code, 'name', s.name)
          from public.squads s
         where s.id = v_profile.squad_id
         limit 1
      )
    ),
    'squads', coalesce((
      select jsonb_agg(
        jsonb_build_object('id', s.id, 'code', s.code, 'name', s.name)
        order by s.code
      )
      from public.squads s
      where s.organization_id = v_profile.organization_id
        and s.active = true
        and (v_profile.role = 'super_admin' or s.id = v_profile.squad_id)
    ), '[]'::jsonb),
    'month_index', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', sm.id,
          'squad_id', sm.squad_id,
          'squad_code', s.code,
          'year', sm.year,
          'month', sm.month,
          'source_file', sm.source_file,
          'latest_day', sm.latest_day,
          'imported_at', sm.imported_at,
          'is_closed', sm.is_closed,
          'closed_at', sm.closed_at,
          'closed_by', sm.closed_by
        )
        order by sm.year desc, sm.month desc, s.code
      )
      from public.squads s
      join public.squad_months sm on sm.squad_id = s.id
      where s.organization_id = v_profile.organization_id
        and s.active = true
        and (v_profile.role = 'super_admin' or s.id = v_profile.squad_id)
    ), '[]'::jsonb),
    'home_months', coalesce((
      select jsonb_agg(month_row.payload order by month_row.squad_code)
      from (
        select
          s.code as squad_code,
          jsonb_build_object(
            'id', sm.id,
            'squad_id', sm.squad_id,
            'squad_code', s.code,
            'year', sm.year,
            'month', sm.month,
            'source_file', sm.source_file,
            'latest_day', sm.latest_day,
            'imported_at', sm.imported_at,
            'team_goal_att', sm.team_goal_att,
            'team_goal_eval_pct', sm.team_goal_eval_pct,
            'is_closed', sm.is_closed,
            'closed_at', sm.closed_at,
            'closed_by', sm.closed_by,
            'quality_person_daily_metrics', '[]'::jsonb,
            'technician_monthly', coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'id', tm.id,
                  'user_id', tm.user_id,
                  'technician_name', tm.technician_name,
                  'att', tm.att,
                  'notes5', tm.notes5,
                  'notes4', tm.notes4,
                  'notes3', tm.notes3,
                  'notes2', tm.notes2,
                  'notes1', tm.notes1,
                  'total_eval', tm.total_eval,
                  'avg_rating', tm.avg_rating,
                  'eval_pct', tm.eval_pct,
                  'evaluation_excluded_att', tm.evaluation_excluded_att,
                  'status', tm.status,
                  'goals_hit', tm.goals_hit,
                  'points', tm.points,
                  'rank', tm.rank,
                  'discount', tm.discount,
                  'point_bonus', tm.point_bonus,
                  'goal_att', tm.goal_att,
                  'goal_eval', tm.goal_eval,
                  'daily_metrics', '[]'::jsonb,
                  'quality_daily_metrics', '[]'::jsonb,
                  'technician_finance_monthly', case
                    when tfm.id is null then '[]'::jsonb
                    else jsonb_build_array(jsonb_build_object(
                      'id', tfm.id,
                      'manual_bonus', tfm.manual_bonus,
                      'sales_commission', tfm.sales_commission,
                      'vacation', tfm.vacation,
                      'exclude_from_group_count', tfm.exclude_from_group_count,
                      'calculated', tfm.calculated
                    ))
                  end
                )
                order by tm.technician_name
              )
              from public.technician_monthly tm
              left join public.technician_finance_monthly tfm
                on tfm.technician_month_id = tm.id
              where tm.squad_month_id = sm.id
                and (
                  v_profile.role <> 'technician'
                  or tm.user_id = v_user
                  or (
                    tm.user_id is null
                    and v_profile.technician_name is not null
                    and lower(trim(tm.technician_name)) = lower(trim(v_profile.technician_name))
                  )
                )
            ), '[]'::jsonb)
          ) as payload
        from public.squads s
        join public.squad_months sm on sm.squad_id = s.id
        where s.organization_id = v_profile.organization_id
          and s.active = true
          and (v_profile.role = 'super_admin' or s.id = v_profile.squad_id)
          and (v_latest_key is null or sm.year * 100 + sm.month = v_latest_key)
      ) month_row
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.get_initial_dashboard_context() from public;
grant execute on function public.get_initial_dashboard_context() to authenticated;

comment on function public.get_initial_dashboard_context() is
'V2.43: retorna perfil, squads, indice de competencias e resumo da competencia mais recente em uma unica chamada para acelerar o login.';

commit;
