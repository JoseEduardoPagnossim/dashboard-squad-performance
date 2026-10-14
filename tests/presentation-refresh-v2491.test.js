const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');

test('V2.50.2 apresentação usa consolidado organizacional para qualquer usuário autorizado',()=>{
  assert.match(app,/function presentationDailyRows\(\)[\s\S]*?const source=state\.supabase\?\(state\.orgTechnicianDailyOverview\|\|\[\]\):orgTechnicianDailyRows\(\),target=presentationTargetSquad\(\)/);
  assert.match(app,/if\(name==='presentation'\)jobs\.push\(ensureOrgOverviewData\(\{daily:true,technicians:true\}\)\)/);
  assert.match(app,/async function refreshPresentationData\(\)[\s\S]*?ensureOrgOverviewData\(\{daily:true,technicians:true,force:true,strict:true\}\)/);
  const refresh=app.slice(app.indexOf('async function refreshPresentationData()'),app.indexOf('async function copyPresentationUrl()'));
  assert.doesNotMatch(refresh,/ensureMonthLoaded\(/);
});

test('V2.50.2 escopo da apresentação segue a configuração, não o técnico logado',()=>{
  assert.match(app,/function allowedPresentationConfig\(config\)\{const cfg=clone\(config\|\|\{\}\),requested=String\(cfg\.squad\|\|'all'\)/);
  assert.doesNotMatch(app,/if\(!isSuperAdmin\(\)\)cfg\.squad=state\.user/);
  assert.match(app,/function presentationTargetSquad\(\)/);
  assert.match(app,/state\.squadCode=requestedPresentationSquad==='ALL'\?'all'/);
});

test('RPC organizacional mantém isolamento por organization_id',()=>{
  assert.match(schema,/create function public\.get_org_technician_daily_overview\(\)[\s\S]*?p\.organization_id = s\.organization_id/);
  assert.match(schema,/grant execute on function public\.get_org_technician_daily_overview\(\) to authenticated/);
});

test('V2.50.2 preserva a última apresentação válida se a sincronização falhar',()=>{
  assert.match(app,/backup=\{overview:clone\(state\.orgOverview\),technicians:clone\(state\.orgTechnicianOverview\),daily:clone\(state\.orgDailyOverview\),technicianDaily:clone\(state\.orgTechnicianDailyOverview\),loaded:state\.orgOverviewLoaded\}/);
  assert.match(app,/Falha ao sincronizar dados da apresentação\./);
  assert.ok(index.includes('js/app.js?v=2.50.2'));
});
