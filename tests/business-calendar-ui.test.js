const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const css=readFileSync(join(root,'css','styles.css'),'utf8');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.48.7.sql'),'utf8');

test('V2.48.7 publica o calendário operacional na área de bonificação',()=>{
  assert.ok(index.includes('id="configBusinessCalendarCard"'));
  for(const id of ['businessCalendarYearSelect','businessCalendarRows','businessCalendarDateInput','businessCalendarAddBtn','businessCalendarSaveBtn']) assert.ok(index.includes(`id="${id}"`));
  assert.ok(index.includes('js/business-calendar.js?v=2.48.12'));
  assert.ok(existsSync(join(root,'js','business-calendar.js')));
});

test('bonificação usa os dias úteis do calendário e preserva memória no fechamento',()=>{
  assert.match(app,/calendarSummary=financeBusinessCalendarSummary\(m\),days=Math\.max\(1,safe\(calendarSummary\.businessDays\)\)/);
  assert.match(app,/financeComparison=\{version:8[\s\S]*?businessCalendar:clone\(calendarSummary\)/);
  assert.match(app,/closedSnapshot=\{version:11[\s\S]*?businessCalendar:clone/);
  assert.match(app,/Dias úteis considerados/);
  assert.match(app,/Atendimentos ÷ dias úteis ÷ técnicos considerados/);
  assert.match(app,/performanceScope\(\)\{return `\$\{state\.user\?\.organizationId\|\|'org'\}:\$\{state\.user\?\.userId\|\|'user'\}:v\$\{APP_VERSION\}`\}/);
});

test('filtros da topbar mantêm os mesmos listeners de negócio',()=>{
  assert.match(app,/\$\('#squadSelect'\)\.addEventListener\('change',async e=>\{await selectSquad\(e\.target\.value,\{history:'replace'\}\);\}\)/);
  assert.match(app,/\$\('#monthSelect'\)\.addEventListener\('change',async e=>/);
  assert.match(app,/\$\('#techSelect'\)\.addEventListener\('change',e=>\{state\.techName=e\.target\.value;renderIndividual\(\);syncPersistentUrl\(\{replace:true\}\);\}\)/);
  assert.match(css,/V2\.48\.7 - FILTROS DO TOPO LEGIVEIS/);
  assert.match(css,/@media\(min-width:981px\)\{[\s\S]*?--top-squad-w:160px;[\s\S]*?--top-month-w:160px;[\s\S]*?--top-tech-w:220px;/);
  assert.match(css,/\.topbar \.top-actions>\.select-wrap \.ds-select-proxy/);
});

test('V2.48.7 não remove a estrutura estável da sidebar',()=>{
  assert.match(css,/V2\.48\.5 - SIDEBAR ESTRUTURALMENTE ESTAVEL/);
  assert.match(css,/grid-template-rows:auto minmax\(0,1fr\) auto auto auto!important/);
  assert.match(css,/\.sidebar-nav\{[\s\S]*?overflow-y:auto!important/);
});

test('migration isola calendário por organização e restringe escrita a administrador',()=>{
  assert.match(migration,/create table if not exists public\.business_calendar_exceptions/);
  assert.match(migration,/unique \(organization_id, date\)/);
  assert.match(migration,/for select to authenticated[\s\S]*?organization_id = \(select \(public\.current_profile\(\)\)\.organization_id\)/);
  assert.match(migration,/for insert to authenticated[\s\S]*?public\.is_super_admin\(\)/);
  assert.match(migration,/for update to authenticated[\s\S]*?public\.is_super_admin\(\)/);
  assert.match(migration,/for delete to authenticated[\s\S]*?public\.is_super_admin\(\)/);
});
