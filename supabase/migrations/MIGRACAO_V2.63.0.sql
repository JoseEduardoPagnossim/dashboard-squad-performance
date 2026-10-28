-- V2.63.0: fundacao comercial e identidade de Pre-atendimento.
-- Requer migrations ate V2.62.9. Executar antes de publicar frontend/Edge Functions.
begin;

-- Perfil separado do suporte operacional: nunca criar pre-atendimento como technician.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('super_admin','squad_admin','technician','pre_attendance'));

alter table public.strategy_people
  add column if not exists functional_team text not null default 'support';
alter table public.strategy_people drop constraint if exists strategy_people_functional_team_check;
alter table public.strategy_people add constraint strategy_people_functional_team_check
  check (functional_team in ('support','pre_attendance','other'));
create unique index if not exists ux_strategy_pre_attendance_user
  on public.strategy_people(organization_id,user_id)
  where user_id is not null and functional_team='pre_attendance';

-- Protege a identidade: nao permite usuario inativo, outra empresa ou tecnico de suporte
-- como conta de Pre-atendimento. Pessoa manual pode existir ainda sem login.
create or replace function public.strategy_guard_pre_attendance_person()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role text; v_active boolean;
begin
  if new.functional_team='pre_attendance' then
    new.default_squad_code := 'C';
    if new.user_id is not null then
      select role,active into v_role,v_active
      from public.profiles where user_id=new.user_id and organization_id=new.organization_id;
      if v_role is distinct from 'pre_attendance' or v_active is distinct from true then
        raise exception 'Conta de Pre-atendimento nao pertence a organizacao, esta inativa ou tem perfil incorreto.';
      end if;
    end if;
  elsif new.user_id is not null and exists (
    select 1 from public.profiles p where p.user_id=new.user_id and p.role='pre_attendance'
  ) then
    raise exception 'Conta de Pre-atendimento exige functional_team=pre_attendance.';
  end if;
  return new;
end $$;
drop trigger if exists strategy_guard_pre_attendance_person_tg on public.strategy_people;
create trigger strategy_guard_pre_attendance_person_tg
before insert or update of organization_id,user_id,functional_team,default_squad_code
on public.strategy_people for each row execute function public.strategy_guard_pre_attendance_person();

-- A propria pessoa pode consultar SOMENTE seu cadastro nao financeiro.
-- Os custos permanecem sob as politicas restritas de strategy_employee_costs.
drop policy if exists strategy_pre_attendance_self_select on public.strategy_people;
create policy strategy_pre_attendance_self_select on public.strategy_people
for select to authenticated using (
  user_id=(select auth.uid()) and functional_team='pre_attendance'
  and organization_id=(select (public.current_profile()).organization_id)
  and (select (public.current_profile()).role)='pre_attendance'
  and (select (public.current_profile()).active)=true
);

-- Reconciliacao EXPLICITA da conta ativa com pessoa estrategica anteriormente manual.
-- A identidade operacional e os dados mensais nunca sao alterados.
create or replace function public.link_strategy_pre_attendance_person(p_person_id uuid,p_user_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_org uuid; v_old_id uuid; v_target_id uuid;
begin
  select organization_id into v_org from public.profiles
    where user_id=auth.uid() and active=true and role='super_admin';
  if v_org is null or not public.has_strategy_access('edit_costs')
    or not public.has_strategy_access('people_costs') then
    raise exception 'Sem permissao para vincular pessoas estrategicas.';
  end if;
  if not exists(select 1 from public.profiles where user_id=p_user_id and organization_id=v_org
    and role='pre_attendance' and active=true) then
    raise exception 'Usuario de Pre-atendimento nao encontrado ou inativo.';
  end if;
  select id into v_target_id from public.strategy_people
  where id=p_person_id and organization_id=v_org and user_id is null and active=true
  for update;
  if v_target_id is null then raise exception 'Pessoa estrategica indisponivel ou ja vinculada.'; end if;
  select id into v_old_id from public.strategy_people
    where user_id=p_user_id and organization_id=v_org and functional_team='pre_attendance'
    for update;
  if v_old_id is not null then
    if exists(select 1 from public.strategy_employee_costs where person_id=v_old_id) then
      raise exception 'Conta ja possui custos. Concilie o historico antes de mudar a pessoa.';
    end if;
    if exists(select 1 from public.strategy_result_attributions where person_id=v_old_id) then
      raise exception 'Conta ja possui receitas. Concilie o historico antes de mudar a pessoa.';
    end if;
    if exists(select 1 from public.strategy_product_sources where person_id=v_old_id) then
      raise exception 'Conta ja possui atribuicoes. Concilie o historico antes de mudar a pessoa.';
    end if;
    delete from public.strategy_people where id=v_old_id;
  end if;
  update public.strategy_people set user_id=p_user_id,functional_team='pre_attendance',
    default_squad_code='C',role_label='Pre-atendimento',updated_by=auth.uid(),updated_at=now()
  where id=v_target_id and organization_id=v_org;
  return v_target_id;
end $$;
revoke all on function public.link_strategy_pre_attendance_person(uuid,uuid) from public,anon;
grant execute on function public.link_strategy_pre_attendance_person(uuid,uuid) to authenticated;

-- Infraestrutura para CSVs e inclusoes manuais. SEM reconhecimento de receita nesta versao.
create table if not exists public.strategy_import_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_key text not null check (source_key in ('contracted_modules_csv','merchandise_sales_csv','manual')),
  label text not null,
  origin text not null check (origin in ('csv','manual')),
  generates_mrr boolean not null,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(organization_id,source_key),
  constraint source_semantics_v2630 check (
    (source_key='contracted_modules_csv' and origin='csv' and generates_mrr)
    or (source_key='merchandise_sales_csv' and origin='csv' and not generates_mrr)
    or (source_key='manual' and origin='manual' and not generates_mrr)
  )
);
create table if not exists public.strategy_import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid not null references public.strategy_import_sources(id) on delete restrict,
  competence date,
  file_name text,
  file_fingerprint text,
  status text not null default 'draft' check (status in ('draft','validated','rejected','imported')),
  total_rows integer not null default 0 check(total_rows>=0),
  accepted_rows integer not null default 0 check(accepted_rows>=0),
  rejected_rows integer not null default 0 check(rejected_rows>=0),
  mapping jsonb not null default '{}'::jsonb check(jsonb_typeof(mapping)='object'),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint batch_competence_v2630 check (competence is null or extract(day from competence)=1),
  constraint batch_rows_v2630 check (accepted_rows+rejected_rows<=total_rows)
);
create index if not exists idx_strategy_import_batches_scope_v2630
 on public.strategy_import_batches(organization_id,competence desc,created_at desc);

-- Bloqueia fonte de outra organizacao em lotes.
create or replace function public.strategy_import_batch_scope_guard_v2630()
returns trigger language plpgsql set search_path=public as $$
begin
 if not exists(select 1 from public.strategy_import_sources s
   where s.id=new.source_id and s.organization_id=new.organization_id) then
   raise exception 'Fonte de importacao pertence a outra organizacao.';
 end if;
 return new;
end $$;
drop trigger if exists strategy_import_batch_scope_v2630 on public.strategy_import_batches;
create trigger strategy_import_batch_scope_v2630 before insert or update
 on public.strategy_import_batches for each row execute function public.strategy_import_batch_scope_guard_v2630();

alter table public.strategy_import_sources enable row level security;
alter table public.strategy_import_batches enable row level security;
drop policy if exists strategy_import_sources_read_v2630 on public.strategy_import_sources;
create policy strategy_import_sources_read_v2630 on public.strategy_import_sources
for select to authenticated using (organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('people_costs'));
drop policy if exists strategy_import_sources_write_v2630 on public.strategy_import_sources;
create policy strategy_import_sources_write_v2630 on public.strategy_import_sources
for insert to authenticated with check (organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('people_costs') and public.has_strategy_access('edit_costs')
  and created_by=(select auth.uid()));
drop policy if exists strategy_import_batches_read_v2630 on public.strategy_import_batches;
create policy strategy_import_batches_read_v2630 on public.strategy_import_batches
for select to authenticated using (organization_id=(select (public.current_profile()).organization_id)
  and public.has_strategy_access('people_costs'));
-- Sem INSERT/UPDATE/DELETE em lotes: liberados apenas com motor validado na V2.63.1+.
grant select,insert on public.strategy_import_sources to authenticated;
grant select on public.strategy_import_batches to authenticated;
-- Isolamento explicito do login do Pre-atendimento no RPC existente.
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

  -- Perfil de Pre-atendimento: somente identidade; nenhuma competencia de Suporte
  -- ou comissao de outros tecnicos pode atravessar esta RPC SECURITY DEFINER.
  if v_profile.role = 'pre_attendance' then
    return jsonb_build_object(
      'schema','v2.63.0','generated_at',now(),'latest_period_key',null,
      'profile',jsonb_build_object(
        'user_id',v_profile.user_id,'email',v_profile.email,'full_name',v_profile.full_name,
        'role',v_profile.role,'organization_id',v_profile.organization_id,
        'squad_id',null,'technician_name',null,
        'permissions','{}'::jsonb,'ui_preferences',coalesce(v_profile.ui_preferences,'{}'::jsonb),
        'avatar_path',v_profile.avatar_path,'squad',null
      ),
      'squads','[]'::jsonb,'month_index','[]'::jsonb,'home_months','[]'::jsonb
    );
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

notify pgrst,'reload schema';
commit;
