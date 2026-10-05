-- SOFTEN PERFORMANCE HUB V2.43.1
-- Observabilidade leve de performance: login, carregamento de modulos, cache e erros.

begin;

create table if not exists public.app_performance_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('login','module','error','cache','client')),
  event_name text not null,
  duration_ms numeric(12,2) not null default 0,
  success boolean not null default true,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_performance_events_org_created
  on public.app_performance_events (organization_id, created_at desc);

create index if not exists idx_app_performance_events_org_type_name_created
  on public.app_performance_events (organization_id, event_type, event_name, created_at desc);

alter table public.app_performance_events enable row level security;

-- Sem acesso direto para o frontend. Gravacao e leitura acontecem somente pelas RPCs abaixo.
revoke all on table public.app_performance_events from anon, authenticated;
grant all on table public.app_performance_events to service_role;

create or replace function public.record_performance_events(p_events jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_event jsonb;
  v_count integer := 0;
  v_type text;
  v_name text;
  v_source text;
  v_duration numeric;
  v_success boolean;
  v_metadata jsonb;
  v_version text;
begin
  if v_user is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  select p.* into v_profile
    from public.profiles p
   where p.user_id = v_user
     and p.active = true
   limit 1;

  if not found then
    raise exception 'Perfil ativo nao encontrado.';
  end if;

  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'p_events deve ser um array JSON.';
  end if;

  for v_event in
    select value
      from jsonb_array_elements(p_events)
     limit 50
  loop
    v_type := lower(left(coalesce(v_event->>'event_type','module'), 24));
    if v_type not in ('login','module','error','cache','client') then
      v_type := 'module';
    end if;

    v_name := left(coalesce(nullif(v_event->>'event_name',''),'unknown'), 80);
    v_source := left(coalesce(v_event->>'source',''), 80);
    v_duration := greatest(0, least(600000, coalesce((v_event->>'duration_ms')::numeric, 0)));
    v_success := coalesce((v_event->>'success')::boolean, true);
    v_metadata := case when jsonb_typeof(v_event->'metadata')='object' then v_event->'metadata' else '{}'::jsonb end;
    if pg_column_size(v_metadata) > 4096 then
      v_metadata := jsonb_build_object('truncated', true);
    end if;
    v_version := left(coalesce(v_event->>'app_version',''), 32);

    insert into public.app_performance_events (
      organization_id,user_id,event_type,event_name,duration_ms,success,source,metadata,app_version
    ) values (
      v_profile.organization_id,v_user,v_type,v_name,v_duration,v_success,nullif(v_source,''),v_metadata,nullif(v_version,'')
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

revoke all on function public.record_performance_events(jsonb) from public;
grant execute on function public.record_performance_events(jsonb) to authenticated;

create or replace function public.get_performance_summary(p_hours integer default 168)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_role text;
  v_since timestamptz;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Sessao nao encontrada.';
  end if;

  select p.organization_id, p.role
    into v_org, v_role
    from public.profiles p
   where p.user_id = v_user
     and p.active = true
   limit 1;

  if v_org is null then
    raise exception 'Perfil ativo nao encontrado.';
  end if;

  if v_role <> 'super_admin' then
    raise exception 'Apenas Admin Geral pode consultar metricas globais de performance.';
  end if;

  v_since := now() - make_interval(hours => greatest(1, least(coalesce(p_hours,168), 24*90)));

  select jsonb_build_object(
    'generated_at', now(),
    'since', v_since,
    'hours', greatest(1, least(coalesce(p_hours,168), 24*90)),
    'total_events', (select count(*) from public.app_performance_events e where e.organization_id=v_org and e.created_at>=v_since),
    'logins', coalesce((
      select jsonb_build_object(
        'count', count(*),
        'avg_ms', round(avg(e.duration_ms),2),
        'p50_ms', round((percentile_cont(.50) within group (order by e.duration_ms))::numeric,2),
        'p95_ms', round((percentile_cont(.95) within group (order by e.duration_ms))::numeric,2),
        'max_ms', round(max(e.duration_ms),2)
      )
      from public.app_performance_events e
      where e.organization_id=v_org and e.created_at>=v_since and e.event_type='login' and e.success=true
    ), jsonb_build_object('count',0,'avg_ms',0,'p50_ms',0,'p95_ms',0,'max_ms',0)),
    'errors', (select count(*) from public.app_performance_events e where e.organization_id=v_org and e.created_at>=v_since and e.event_type='error'),
    'cache', coalesce((
      select jsonb_build_object(
        'samples', count(*),
        'avg_hit_rate', round(avg((e.metadata->>'cache_hit_rate')::numeric),4)
      )
      from public.app_performance_events e
      where e.organization_id=v_org and e.created_at>=v_since and e.metadata ? 'cache_hit_rate'
    ), jsonb_build_object('samples',0,'avg_hit_rate',0)),
    'modules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', q.event_name,
        'count', q.cnt,
        'avg_ms', q.avg_ms,
        'p95_ms', q.p95_ms,
        'max_ms', q.max_ms,
        'errors', q.errors
      ) order by q.avg_ms desc)
      from (
        select e.event_name,
               count(*) cnt,
               round(avg(e.duration_ms),2) avg_ms,
               round((percentile_cont(.95) within group (order by e.duration_ms))::numeric,2) p95_ms,
               round(max(e.duration_ms),2) max_ms,
               count(*) filter (where e.success=false) errors
          from public.app_performance_events e
         where e.organization_id=v_org
           and e.created_at>=v_since
           and e.event_type='module'
         group by e.event_name
         order by avg(e.duration_ms) desc
         limit 20
      ) q
    ), '[]'::jsonb),
    'recent_errors', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', q.event_name,
        'source', q.source,
        'message', q.message,
        'created_at', q.created_at,
        'app_version', q.app_version
      ) order by q.created_at desc)
      from (
        select e.event_name,e.source,left(coalesce(e.metadata->>'message',''),300) message,e.created_at,e.app_version
          from public.app_performance_events e
         where e.organization_id=v_org
           and e.created_at>=v_since
           and e.event_type='error'
         order by e.created_at desc
         limit 12
      ) q
    ), '[]'::jsonb),
    'slow_events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type', q.event_type,
        'name', q.event_name,
        'duration_ms', q.duration_ms,
        'source', q.source,
        'created_at', q.created_at
      ) order by q.duration_ms desc)
      from (
        select e.event_type,e.event_name,e.duration_ms,e.source,e.created_at
          from public.app_performance_events e
         where e.organization_id=v_org
           and e.created_at>=v_since
           and e.duration_ms>=1500
         order by e.duration_ms desc
         limit 15
      ) q
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.get_performance_summary(integer) from public;
grant execute on function public.get_performance_summary(integer) to authenticated;

comment on table public.app_performance_events is 'V2.43.1: telemetria leve do Performance Hub. Sem conteudo operacional, senhas ou dados de clientes.';
comment on function public.record_performance_events(jsonb) is 'V2.43.1: grava lote pequeno de metricas de performance do usuario autenticado.';
comment on function public.get_performance_summary(integer) is 'V2.43.1: resumo agregado de performance da organizacao para Admin Geral.';

commit;
