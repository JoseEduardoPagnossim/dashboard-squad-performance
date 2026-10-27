const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'css','styles.css'),'utf8');
const workspace=readFileSync(join(root,'js','workspace-engine.js'),'utf8');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));

test('V2.57.7 adiciona competencias inicial e final no intervalo livre',()=>{
  assert.equal(pkg.version,'2.61.4');
  assert.match(index,/id="periodFreeStartSelect"/);
  assert.match(index,/id="periodFreeEndSelect"/);
  assert.match(app,/function setFreeCompetenceBoundary\(which,id\)/);
  assert.match(app,/syncFreeDraftCompetenceIds\(\)/);
});

test('V2.57.7 oferece presets longos no intervalo livre',()=>{
  for(const preset of ['3m','6m','12m','year','prev-year','history'])assert.ok(index.includes(`data-free-period-preset="${preset}"`));
  assert.match(app,/function freePeriodPresetRange\(preset,target='state'\)/);
  assert.match(app,/function applyFreePeriodPreset\(preset\)/);
});

test('V2.57.7 permite saltar diretamente mes e ano no calendario',()=>{
  assert.match(index,/id="periodPickerMonthSelect"/);
  assert.match(index,/id="periodPickerYearSelect"/);
  assert.match(app,/function setPeriodCalendarView\(year,month\)/);
  assert.match(css,/\.period-picker-jump/);
});

test('V2.57.7 preserva Squad e periodo como contexto global',()=>{
  assert.match(workspace,/GLOBAL_FILTER_KEYS=\['squad','from','to'\]/);
  assert.match(workspace,/function rememberGlobalContext\(/);
  assert.match(app,/function liveGlobalFilterRoute\(\)/);
  assert.match(app,/rememberWorkspaceGlobalContext\(next,liveGlobalFilterRoute\(\)\)/);
  assert.match(app,/rememberedRoute\(rawTarget,\{preferLive:false\}\)/);
  assert.match(app,/function routeUsesAnalysisPeriod\(route=\{\}\)/);
  assert.match(app,/if\(routeUsesAnalysisPeriod\(target\)\)syncCurrentMonthToAnalysisEnd\(\)/);
  assert.match(app,/previousMonth=state\.currentId,previousRange=\{start:state\.analysisStartDate/);
});

test('V2.57.7 atualiza os assets principais sem migration nova',()=>{
  assert.ok(index.includes('css/styles.css?v=2.61.4-r1'));
  assert.ok(index.includes('js/workspace-engine.js?v=2.61.4-r1'));
  assert.ok(index.includes('js/app.js?v=2.61.4-r1'));
});
