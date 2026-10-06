-- SOFTEN PERFORMANCE HUB V2.48.2
-- Identidade visual publica para boot/login sem expor dados operacionais.
-- Retorna somente campos de ambientacao do tema mais recentemente atualizado
-- da organizacao solicitada. Nenhuma tabela passa a ter SELECT anonimo.

begin;

create or replace function public.get_public_theme_bootstrap(
  p_org_slug text default 'soften-sistemas'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_strip_nulls(
    jsonb_build_object(
      'name', st.theme -> 'name',
      'campaignTitle', st.theme -> 'campaignTitle',
      'campaignTagline', st.theme -> 'campaignTagline',
      'preset', st.theme -> 'preset',
      'colors', st.theme -> 'colors',
      'accent', st.theme -> 'accent',
      'secondary', st.theme -> 'secondary',
      'bg', st.theme -> 'bg',
      'bg2', st.theme -> 'bg2',
      'panel', st.theme -> 'panel',
      'panel2', st.theme -> 'panel2',
      'text', st.theme -> 'text',
      'muted', st.theme -> 'muted',
      'border', st.theme -> 'border',
      'background', st.theme -> 'background',
      'favicon', st.theme -> 'favicon',
      'opacity', st.theme -> 'opacity'
    )
  )
  from public.squad_themes st
  join public.squads s on s.id = st.squad_id
  join public.organizations o on o.id = s.organization_id
  where o.slug = p_org_slug
    and s.active = true
  order by st.updated_at desc, s.code asc
  limit 1;
$$;

revoke all on function public.get_public_theme_bootstrap(text) from public;
grant execute on function public.get_public_theme_bootstrap(text) to anon, authenticated;

comment on function public.get_public_theme_bootstrap(text) is
  'V2.48.2: retorna somente a identidade visual publica usada no boot/login do Performance Hub.';

commit;
