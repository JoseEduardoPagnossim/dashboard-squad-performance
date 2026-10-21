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

test('V2.56.2 troca o Squad visualmente antes de iniciar a hidratação da Qualidade',()=>{
  assert.equal(pkg.version,'2.56.2');
  const select=blockBetween('async function selectSquad','function requireSpecificSquad');
  const renderPos=select.indexOf('refreshSelectors();render();applyPermissions();updateBreadcrumbs();');
  const hydratePos=select.indexOf('hydrateIndicatorSquadFilter(code,{section:indicatorSectionAtChange})');
  assert.ok(renderPos>=0,'render imediato ausente');
  assert.ok(hydratePos>renderPos,'a hidratação não pode bloquear a troca visual do filtro');
  assert.doesNotMatch(select,/await\s+ensureIndicatorSquadFilterReady/);
});

test('V2.56.2 Qualidade limpa valores anteriores enquanto o novo Squad carrega',()=>{
  assert.match(app,/function renderQualityScopePending\(squads,rangeIds,\{error=false\}=\{\}\)/);
  assert.match(app,/pending=state\.indicatorHydrationKey===scopeKey\|\|indicatorScopeHasPendingFullData\(state\.squadCode,rangeIds\)/);
  assert.match(app,/if\(pending\)\{renderQualityScopePending\(squads,rangeIds,\{error:state\.indicatorHydrationErrorKey===scopeKey\}\);return;\}/);
  assert.match(app,/state\.indicatorHydrationKey=indicatorScopeContextKey\(indicatorSectionAtChange,code\)/);
  assert.match(app,/qualityServiceTotal'\)\.textContent='—'/);
  assert.match(app,/Atualizando dados de \$\{scope\}/);
});

test('V2.56.2 descarta hidratações antigas por Squad, seção e período',()=>{
  assert.match(app,/seq=\+\+state\.indicatorHydrationSeq/);
  assert.match(app,/indicatorScopeContextKey\(section,code\)!==key/);
  assert.match(app,/state\.indicatorSection!==section\|\|state\.squadCode!==code/);
  assert.match(app,/const indicator=name==='indicators'\?\(state\.indicatorSection\|\|'performance'\):''/);
  assert.match(app,/state\.analysisStartDate\|\|''/);
  assert.match(app,/state\.analysisEndDate\|\|''/);
});

test('V2.56.2 usa na Qualidade o mesmo carregador de dados da aba Desempenho',()=>{
  const hydrate=blockBetween('function hydrateIndicatorSquadFilter','async function selectSquad');
  assert.match(hydrate,/ensureViewData\('indicators',state\.adminSection\)/);
  assert.doesNotMatch(hydrate,/ensureMonthsLoaded\(/);
  assert.match(app,/async function ensureMonthsLoaded\(codes,ids,\{silent=false\}=\{\}\)/);
});

test('V2.56.2 mantém alteração frontend-only e cache-bust atualizado',()=>{
  assert.ok(index.includes('js/app.js?v=2.56.2'));
  assert.ok(index.includes('css/styles.css?v=2.56.2'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.2.sql')));
});
