const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');
const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.50.2_R2.sql'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');

test('V2.50.2 R3 apresentação usa o RPC organizacional estável de forma isolada',()=>{
  assert.match(app,/async function ensurePresentationDailyOverview\(/);
  assert.match(app,/const attempts=\['get_org_technician_daily_overview','get_presentation_technician_daily_overview'\]/);
  assert.match(app,/for\(const rpcName of attempts\)/);
  assert.match(app,/state\.supabase\.rpc\(rpcName\)/);
  assert.match(app,/if\(name==='presentation'\)jobs\.push\(ensurePresentationDailyOverview\(\)\)/);
  assert.doesNotMatch(app,/if\(name==='presentation'\)jobs\.push\(ensureOrgOverviewData/);
});

test('V2.50.2 R3 atualização manual usa a mesma fonte isolada e preserva última visão válida',()=>{
  const refresh=app.slice(app.indexOf('async function refreshPresentationData()'),app.indexOf('async function copyPresentationUrl()'));
  assert.match(refresh,/ensurePresentationDailyOverview\(\{force:true,strict:true\}\)/);
  assert.doesNotMatch(refresh,/ensureOrgOverviewData/);
  assert.match(refresh,/state\.orgTechnicianDailyOverview=backup/);
  assert.match(refresh,/state\.presentationLastSyncAt=lastSync/);
});

test('escopo da apresentação segue a configuração, não o técnico logado',()=>{
  assert.match(app,/function presentationTargetSquad\(\)/);
  assert.match(app,/const source=state\.supabase\?\(state\.orgTechnicianDailyOverview\|\|\[\]\):orgTechnicianDailyRows\(\),target=presentationTargetSquad\(\)/);
  assert.doesNotMatch(app,/presentationDailyRows\(\)[\s\S]{0,700}state\.user\.techName/);
});

test('RPC dedicada mantém isolamento por organization_id e não expõe campos financeiros',()=>{
  const schemaStart=schema.lastIndexOf('drop function if exists public.get_presentation_technician_daily_overview()');
  const schemaEnd=schema.indexOf('grant execute on function public.get_presentation_technician_daily_overview() to authenticated;',schemaStart);
  const schemaRpc=schema.slice(schemaStart,schemaEnd+100);
  for(const sql of [schemaRpc,migration]){
    assert.match(sql,/get_presentation_technician_daily_overview/);
    assert.match(sql,/p\.organization_id = s\.organization_id/);
    assert.match(sql,/grant execute on function public\.get_presentation_technician_daily_overview\(\) to authenticated/);
    assert.doesNotMatch(sql,/manual_bonus|sales_commission|redistributed|discount/);
  }
});

test('V2.50.2 R3 adiciona fallback detalhado e cache-bust do app',()=>{
  assert.match(app,/async function presentationDetailedFallbackRows\(/);
  assert.match(app,/buildOrgTechnicianDailyOverviewFromState\(\)/);
  assert.match(app,/if\(!rows\.length\)/);
  assert.ok(index.includes('js/app.js?v=2.50.2-r3'));
});
