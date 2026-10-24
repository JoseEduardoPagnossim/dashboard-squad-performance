const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pkg=require('../package.json');

function blockBetween(start,end){
  const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
  assert.ok(a>=0,`inicio nao encontrado: ${start}`);
  assert.ok(b>a,`fim nao encontrado: ${end}`);
  return app.slice(a,b);
}

test('regressao: selectSquad renderiza o novo escopo e depois aguarda sua carga completa',()=>{
  const select=blockBetween('async function selectSquad','function requireSpecificSquad');
  const firstRender=select.indexOf('refreshSelectors();render();applyPermissions();updateBreadcrumbs();');
  const awaitedLoad=select.indexOf('await ensureViewData(state.currentView,state.adminSection,{strict:true,forceMonths:forceQualityScope})');
  assert.ok(firstRender>=0,'render imediato ausente');
  assert.ok(awaitedLoad>firstRender,'carga completa deve ocorrer apos refletir a selecao visual');
  assert.match(select,/selectionSeq=\+\+state\.squadSelectionSeq/);
});

test('regressao: Qualidade limpa valores enquanto faltam dados completos do novo Squad',()=>{
  assert.match(app,/function renderQualityScopePending\(squads,rangeIds,\{error=false\}=\{\}\)/);
  assert.match(app,/pending=indicatorScopeHasPendingFullData\(scope\.code,rangeIds\)/);
  assert.match(app,/if\(state\.squadSelectionLoadError\)\{renderQualityScopePending\(squads,rangeIds,\{error:true\}\);return;\}/);
  assert.match(app,/qualityServiceTotal'\)\.textContent='—'/);
});

test('regressao: carregamento explicito do filtro nao engole erro mensal',()=>{
  const months=blockBetween('async function ensureMonthsLoaded','function orgDailyRequestedRange');
  assert.match(months,/\{silent=false,strict=false,force=false\}/);
  assert.match(months,/jobs\.push\(strict\?job:job\.catch\(err=>null\)\)/);
  const view=blockBetween('async function ensureViewData','function hydrateCurrentViewAsync');
  assert.match(view,/ensureMonthsLoaded\(codes,ids,\{silent:true,strict,force:forceMonths\}\)/);
});

test('regressao: Qualidade usa o mesmo ciclo de hidratacao das demais subabas',()=>{
  const section=blockBetween('function setIndicatorSection','function syncIndicatorSectionUi');
  assert.match(section,/hydrateCurrentViewAsync\('indicators',state\.adminSection\)/);
  assert.doesNotMatch(section,/hydrateIndicatorSquadFilter/);
});

test('cache-bust acompanha a versao atual',()=>{
  assert.equal(pkg.version,'2.60.6');
  assert.ok(index.includes('js/app.js?v=2.60.6'));
  assert.ok(index.includes('css/styles.css?v=2.60.6'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.7.sql')));
});
