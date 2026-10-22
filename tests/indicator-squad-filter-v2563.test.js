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
test('V2.57.7 troca Squad em Qualidade pelo fluxo global aguardado',()=>{
  assert.equal(pkg.version,'2.58.1');
  const select=blockBetween('async function selectSquad','function requireSpecificSquad');
  assert.match(select,/await ensureViewData\(state\.currentView,state\.adminSection,\{strict:true,forceMonths:forceQualityScope\}\)/);
  assert.doesNotMatch(select,/hydrateIndicatorSquadFilter|indicatorHydration/);
});
test('V2.57.7 entrar em Qualidade reutiliza o ciclo global de hidratacao de Indicadores',()=>{
  const section=blockBetween('function setIndicatorSection','function syncIndicatorSectionUi');
  assert.match(section,/hydrateCurrentViewAsync\('indicators',state\.adminSection\)/);
  assert.doesNotMatch(section,/hydrateIndicatorSquadFilter|indicatorHydration/);
});
test('V2.57.7 remove completamente o controlador paralelo antigo',()=>{
  for(const legacy of ['hydrateIndicatorSquadFilter','indicatorHydrationSeq','indicatorHydrationKey','indicatorHydrationErrorKey','indicatorScopeContextKey','indicatorSquadFilterRequiresFullData']){
    assert.equal(app.includes(legacy),false,legacy);
  }
});
test('V2.57.7 permite recarga forcada do mesmo carregador mensal',()=>{
  const ensure=blockBetween('async function ensureViewData','function hydrateCurrentViewAsync');
  assert.match(ensure,/ensureMonthsLoaded\(codes,ids,\{silent:true,strict,force:forceMonths\}\)/);
  const months=blockBetween('async function ensureMonthsLoaded','function orgDailyRequestedRange');
  assert.match(months,/force=false/);
  assert.match(months,/ensureMonthLoaded\(code,id,\{silent:true,force\}\)/);
});
test('V2.57.7 publica cache-bust completo sem migration',()=>{
  for(const asset of ['css/styles.css','css/design-system.css','css/presentation.css','js/performance-engine.js','js/filter-system.js','js/app.js']){
    assert.ok(index.includes(`${asset}?v=2.58.1`),asset);
  }
  assert.ok(index.includes('V2.58.1'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.7.sql')));
});
