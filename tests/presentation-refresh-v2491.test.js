const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const presentation = readFileSync(join(root, 'js', 'presentation.js'), 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');
const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.50.2_R4.sql'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');

test('V2.53.0 R4 apresentação usa contexto organizacional dedicado por período e Squad',()=>{
  assert.match(app,/async function fetchPresentationDailyContextRpc\(/);
  assert.match(app,/get_presentation_daily_context_v2502/);
  assert.match(app,/p_start_date:state\.analysisStartDate\|\|null/);
  assert.match(app,/p_end_date:state\.analysisEndDate\|\|null/);
  assert.match(app,/p_squad_code:target==='all'\?null:target/);
  assert.match(app,/if\(name==='presentation'\)jobs\.push\(ensurePresentationDailyOverview\(\)\)/);
  assert.doesNotMatch(app,/if\(name==='presentation'\)jobs\.push\(ensureOrgOverviewData/);
});

test('R4 mantém compatibilidade legada, mas não reduz técnico ao próprio detalhamento',()=>{
  assert.match(app,/const attempts=\['get_org_technician_daily_overview','get_presentation_technician_daily_overview'\]/);
  assert.match(app,/async function presentationDetailedFallbackRows\(\)[\s\S]*if\(!isAdmin\(\)\)return\[\]/);
  assert.match(app,/const configured=String\(window\.SoftenPresentation[\s\S]*if\(!configured\|\|configured==='ALL'\)return'all';[\s\S]*return configured;/);
  assert.doesNotMatch(app,/presentationDailyRows\(\)[\s\S]{0,700}state\.user\.techName/);
});

test('R4 não aceita 0 registros inesperados como sincronização saudável',()=>{
  assert.match(app,/function presentationHasIndexedPeriod\(/);
  assert.match(app,/const unexpectedEmpty=!rows\.length&&presentationHasIndexedPeriod\(\)/);
  assert.match(app,/if\(unexpectedEmpty&&strict\)throw new Error/);
  assert.match(app,/window\.SoftenPresentationDiagnostics=/);
  assert.match(app,/setConnectionState\?\.\('degraded','Fonte sem registros'/);
  assert.match(presentation,/setConnectionState:\(kind,title,text\)=>connectionState\(kind,title,text\)/);
});

test('RPC R4 usa o mesmo vínculo de profile/organization do contexto de login e não expõe financeiro',()=>{
  for(const sql of [schema,migration]){
    assert.match(sql,/get_presentation_daily_context_v2502/);
    assert.match(sql,/v_profile public\.profiles%rowtype/);
    assert.match(sql,/where p\.user_id = v_user/);
    assert.match(sql,/s\.organization_id = v_profile\.organization_id/);
    assert.match(sql,/grant execute on function public\.get_presentation_daily_context_v2502\(date,date,text\) to authenticated/);
    assert.doesNotMatch(sql.slice(sql.lastIndexOf('get_presentation_daily_context_v2502')),/manual_bonus|sales_commission|redistributed|discount/);
  }
  assert.match(migration,/notify pgrst, 'reload schema'/);
});

test('R4 preserva última visão válida em falha e atualiza cache-bust',()=>{
  const refresh=app.slice(app.indexOf('async function refreshPresentationData()'),app.indexOf('async function copyPresentationUrl()'));
  assert.match(refresh,/backup=clone\(state\.orgTechnicianDailyOverview\|\|\[\]\)/);
  assert.match(refresh,/backupMeta=clone\(state\.presentationDataMeta\|\|null\)/);
  assert.match(refresh,/state\.orgTechnicianDailyOverview=backup/);
  assert.match(refresh,/state\.presentationDataMeta=backupMeta/);
  assert.ok(index.includes('js/presentation.js?v=2.57.1'));
  assert.ok(index.includes('js/app.js?v=2.57.1'));
});
