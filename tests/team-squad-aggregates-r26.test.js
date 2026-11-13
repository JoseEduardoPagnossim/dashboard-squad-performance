import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/MIGRACAO_V2.29.5.sql',import.meta.url),'utf8');
test('R26: Visao do Squad consulta consolidado mensal tambem para tecnicos',()=>{
  const start=app.indexOf('async function ensureViewData(');
  const end=app.indexOf('function hydrateCurrentViewAsync(',start);
  const view=app.slice(start,end);
  assert.match(view,/else if\(name==='team'\)\s*\{/);
  assert.match(view,/ensureOrgOverviewData\(\{daily:privileged,technicians:privileged,strict:true\}\)/);
  assert.match(view,/const privileged=isSuperAdmin\(\)/);
  assert.doesNotMatch(view,/\(name==='indicators'\|\|name==='team'\)\&\&isSuperAdmin\(\)/);
});
test('R26: consulta publica ao usuario autenticado devolve so agregados da organizacao',()=>{
  assert.match(sql,/create or replace function public\.get_org_squad_monthly_overview\(\)/);
  assert.match(sql,/p\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql,/s\.organization_id = me\.organization_id/);
  assert.match(sql,/grant execute on function public\.get_org_squad_monthly_overview\(\) to authenticated/);
  assert.doesNotMatch(sql.slice(sql.indexOf('create or replace function public.get_org_squad_monthly_overview()'),sql.indexOf('revoke all on function public.get_org_squad_monthly_overview()')), /technician_name\s+text/i);
});
test('R26: nao mascarar falha de consulta com serie isolada',()=>{
  const start=app.indexOf('function renderTeamSquadOverview(');
  const end=app.indexOf('function renderIndicatorSquadOverview(',start);
  const fn=app.slice(start,end);
  assert.match(fn,/state\.supabase&&!state\.orgOverviewLoaded/);
  assert.match(fn,/buildOrgSquadMonthlySeries\(state\.supabase\?state\.orgOverview:null\)/);
  assert.match(fn,/renderIndicatorLineChart\(\$\('#teamSquadAttendanceChart'\),data\.labels,data\.attendance/);
  assert.match(fn,/renderIndicatorLineChart\(\$\('#teamSquadEvaluationChart'\),data\.labels,data\.evaluation/);
});
