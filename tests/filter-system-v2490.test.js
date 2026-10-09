const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const filters = require(join(root, 'js', 'filter-system.js'));
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const finance = readFileSync(join(root, 'js', 'finance-rules.js'), 'utf8');

function topbarHtml(){
  const start=index.indexOf('<header class="topbar">');
  const end=index.indexOf('</header>',start);
  assert.ok(start>=0 && end>start,'topbar deve existir');
  return index.slice(start,end);
}

test('V2.49 define uma matriz contextual única de filtros',()=>{
  assert.deepEqual(filters.contextRule({view:'home'}),{squad:true,competence:true,period:false,technician:false});
  assert.deepEqual(filters.contextRule({view:'individual'}),{squad:true,competence:true,period:true,technician:true});
  assert.deepEqual(filters.contextRule({view:'team'}),{squad:true,competence:true,period:true,technician:false});
  assert.deepEqual(filters.contextRule({view:'presentation'}),{squad:true,competence:false,period:true,technician:false});
  assert.deepEqual(filters.contextRule({view:'admin',adminSection:'operation'}),{squad:true,competence:true,period:false,technician:false});
  assert.deepEqual(filters.contextRule({view:'admin',adminSection:'finance'}),{squad:true,competence:true,period:false,technician:false});
  assert.deepEqual(filters.contextRule({view:'admin',adminSection:'costs'}),{squad:false,competence:false,period:false,technician:false});
  assert.deepEqual(filters.contextRule({view:'settings',settingsModule:'finance'}),{squad:true,competence:false,period:false,technician:false});
});

test('V2.49 remove filtros globais redundantes de subseções com filtros próprios',()=>{
  assert.deepEqual(filters.contextRule({view:'indicators',indicatorSection:'financial-impact'}),{squad:false,competence:false,period:false,technician:false});
  assert.deepEqual(filters.contextRule({view:'indicators',indicatorSection:'business-days'}),{squad:true,competence:false,period:false,technician:false});
  assert.deepEqual(filters.contextRule({view:'indicators',indicatorSection:'performance'}),{squad:true,competence:false,period:true,technician:false});
  assert.deepEqual(filters.contextRule({view:'indicators',indicatorSection:'quality'}),{squad:true,competence:false,period:true,technician:false});
  assert.deepEqual(filters.contextRule({view:'indicators',indicatorSection:'detail'}),{squad:true,competence:false,period:true,technician:false});
});

test('V2.49 respeita perfil e escopo no que pode ser exibido',()=>{
  const tech=filters.visibility({view:'individual',isSuperAdmin:false,isTechnician:true,squadCode:'D'});
  assert.deepEqual(tech,{squad:false,competence:true,period:true,technician:false});
  const allTeam=filters.visibility({view:'team',isSuperAdmin:true,isTechnician:false,squadCode:'all'});
  assert.deepEqual(allTeam,{squad:true,competence:false,period:true,technician:false});
  assert.equal(filters.visibleKeys({view:'individual',isSuperAdmin:true,isTechnician:false,squadCode:'D'}).length,4);
});

test('topbar mantém os três selects oficiais e consolida datas em um PeriodPicker',()=>{
  const top=topbarHtml();
  for(const id of ['squadSelect','monthSelect','techSelect']) assert.equal((top.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} deve continuar único`);
  assert.match(top,/id="competenceControl"[\s\S]*?<span>Competência<\/span>/);
  assert.match(top,/id="analysisPeriodTrigger"[\s\S]*?<span>Período de análise<\/span>/);
  assert.match(top,/id="analysisStartDate"[^>]*type="hidden"/);
  assert.match(top,/id="analysisEndDate"[^>]*type="hidden"/);
  assert.doesNotMatch(top,/data-analysis-preset/);
  assert.doesNotMatch(top,/class="date-quick/);
});

test('PeriodPicker reúne atalhos, intervalo e aplicação explícita',()=>{
  for(const id of ['periodPickerStart','periodPickerEnd','periodPickerCancel','periodPickerApply']) assert.ok(index.includes(`id="${id}"`));
  assert.match(app,/function applyAnalysisPeriodPicker\(\)/);
  assert.match(app,/commitAnalysisRange\(payload\.start,payload\.end,payload\.preset/);
  assert.match(app,/function analysisPresetRange\(preset,/);
  assert.match(css,/\.analysis-period-popover\{/);
});

test('drawer mobile trabalha em rascunho e só aplica filtros visíveis',()=>{
  for(const id of ['filterDrawerTrigger','filterDrawer','mobileSquadSelect','mobileMonthSelect','mobilePeriodTrigger','mobileTechSelect','filterDrawerApply']) assert.ok(index.includes(`id="${id}"`));
  assert.match(index,/id="filterDrawerReset"[^>]*>Limpar filtros<\/button>/);
  assert.match(app,/filterDrawerUi\.draft=\{squad:state\.squadCode,month:state\.currentId,tech:state\.techName,start:state\.analysisStartDate,end:state\.analysisEndDate,preset:state\.analysisPreset,mode:state\.analysisMode,competenceId:state\.analysisCompetenceId\|\|state\.currentId\}/);
  assert.match(app,/const visible=topFilterVisibility\(\);state\.routeApplying=true/);
  assert.match(app,/visible\.competence&&d\.month/);
  assert.match(app,/visible\.period&&d\.start&&d\.end/);
  assert.match(app,/visible\.technician&&d\.tech/);
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.filter-drawer-trigger\{display:inline-flex\}/);
  assert.match(css,/body\.filter-drawer-open\{overflow:hidden!important\}/);
  assert.match(css,/@media\(max-width:1760px\) and \(min-width:981px\)[\s\S]*?\.topbar \.top-actions\{[\s\S]*?flex-wrap:wrap!important/);
  assert.match(css,/max-width:calc\(100% - 150px\)/);
});

test('URLs e Visões continuam usando os mesmos parâmetros oficiais',()=>{
  assert.match(app,/const visible=topFilterVisibility\(page,state\.adminSection\)/);
  assert.match(app,/if\(visible\.competence&&state\.currentId\)route\.month=state\.currentId/);
  assert.match(app,/if\(visible\.technician&&state\.techName\)route\.tech=state\.techName/);
  assert.match(app,/if\(visible\.period\)\{if\(state\.analysisStartDate\)route\.from=state\.analysisStartDate;if\(state\.analysisEndDate\)route\.to=state\.analysisEndDate;\}/);
  assert.match(app,/if\(target\.month&&competenceIdsForSquad\(\)\.includes\(target\.month\)\)/);
});

test('Indicadores não duplicam mais filtros visíveis de data',()=>{
  const start=index.indexOf('id="indicatorGlobalToolbar"');
  const end=index.indexOf('id="indicatorPerformancePanel"',start);
  const toolbar=index.slice(start,end);
  assert.match(toolbar,/O período agora é controlado pelo filtro único no topo da página/);
  assert.doesNotMatch(toolbar,/type="date"/);
  assert.doesNotMatch(toolbar,/data-analysis-preset/);
  assert.match(toolbar,/id="indicatorStartDate"[^>]*type="hidden"/);
  assert.match(toolbar,/id="indicatorEndDate"[^>]*type="hidden"/);
});

test('V2.49 é frontend-only e preserva a regra financeira',()=>{
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.49.0.sql')),false);
  assert.match(finance,/FINANCE_RULE_VERSION = 'FR-2\.48\.8-1'/);
  assert.match(app,/APP_VERSION = '2\.50\.0'/);
  assert.ok(index.includes('V2.50.0'));
});
