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

test('V2.56.3 troca Squad em Qualidade pelo mesmo fluxo usado em Desempenho',()=>{
  assert.equal(pkg.version,'2.56.3');
  const select=blockBetween('async function selectSquad','function requireSpecificSquad');
  assert.match(select,/refreshSelectors\(\);render\(\);applyPermissions\(\);updateBreadcrumbs\(\);/);
  assert.match(select,/if\(state\.supabase&&state\.currentView!=='home'\)hydrateCurrentViewAsync\(state\.currentView,state\.adminSection\)/);
  assert.doesNotMatch(select,/indicatorSectionAtChange|hydrateIndicatorSquadFilter|indicatorHydration/);
});

test('V2.56.3 entrar em Qualidade reutiliza o ciclo global de hidratacao de Indicadores',()=>{
  const section=blockBetween('function setIndicatorSection','function syncIndicatorSectionUi');
  assert.match(section,/hydrateCurrentViewAsync\('indicators',state\.adminSection\)/);
  assert.doesNotMatch(section,/hydrateIndicatorSquadFilter|indicatorHydration/);
});

test('V2.56.3 remove completamente o controlador paralelo que causava divergencia entre abas',()=>{
  for(const legacy of ['hydrateIndicatorSquadFilter','indicatorHydrationSeq','indicatorHydrationKey','indicatorHydrationErrorKey','indicatorScopeContextKey','indicatorSquadFilterRequiresFullData']){
    assert.equal(app.includes(legacy),false,legacy);
  }
});

test('V2.56.3 mantem um unico carregador de meses completos para Desempenho e Qualidade',()=>{
  const ensure=blockBetween('async function ensureViewData','function hydrateCurrentViewAsync');
  assert.match(app,/function viewNeedsFullMonth\(name,section\)\{return\['individual','team','indicators','feedbacks'\]\.includes\(name\)/);
  assert.match(ensure,/ensureMonthsLoaded\(codes,ids,\{silent:true\}\)/);
  const hydrate=blockBetween('function hydrateCurrentViewAsync','function schedulePostLoginHydration');
  assert.match(hydrate,/ensureViewData\(name,section\)/);
  assert.match(hydrate,/refreshSelectors\(\);render\(\)/);
});

test('V2.56.3 publica cache-bust completo sem migration',()=>{
  for(const asset of ['css/styles.css','css/design-system.css','css/presentation.css','js/performance-engine.js','js/filter-system.js','js/app.js']){
    assert.ok(index.includes(`${asset}?v=2.56.3`),asset);
  }
  assert.ok(index.includes('V2.56.3'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.3.sql')));
});
