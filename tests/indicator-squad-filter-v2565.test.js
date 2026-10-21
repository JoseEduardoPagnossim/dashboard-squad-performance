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

test('V2.57.1 força recarga mensal apenas na troca direta dentro de Qualidade',()=>{
  assert.equal(pkg.version,'2.57.1');
  const select=blockBetween('async function selectSquad','function requireSpecificSquad');
  assert.match(select,/forceQualityScope=state\.currentView==='indicators'&&state\.indicatorSection==='quality'/);
  assert.match(select,/await ensureViewData\(state\.currentView,state\.adminSection,\{strict:true,forceMonths:forceQualityScope\}\)/);
});

test('V2.57.1 ensureViewData mantém um carregador único e encaminha forceMonths',()=>{
  const ensure=blockBetween('async function ensureViewData','function hydrateCurrentViewAsync');
  assert.match(ensure,/\{strict=false,forceMonths=false\}/);
  assert.match(ensure,/ensureMonthsLoaded\(codes,ids,\{silent:true,strict,force:forceMonths\}\)/);
});

test('V2.57.1 ensureMonthsLoaded pode invalidar full month sem alterar chamadas normais',()=>{
  const ensure=blockBetween('async function ensureMonthsLoaded','function orgDailyRequestedRange');
  assert.match(ensure,/\{silent=false,strict=false,force=false\}/);
  assert.match(ensure,/if\(!month\|\|\(!force&&isPerformanceFullMonth\(month\)\)\)continue/);
  assert.match(ensure,/ensureMonthLoaded\(code,id,\{silent:true,force\}\)/);
});

test('V2.57.1 Qualidade recalcula escopo no instante da renderização',()=>{
  const scope=blockBetween('function qualityCurrentRenderScope','function renderQualityIndicators');
  assert.match(scope,/const squads=indicatorScopeSquads\(\),rangeIds=analysisMonthIds\(\)\.filter\(id=>indicatorMonthIds\(squads\)\.includes\(id\)\)/);
  const render=blockBetween('function renderQualityIndicators','function monthServiceTechnicianTotals');
  assert.match(render,/const scope=qualityCurrentRenderScope\(\),squads=scope\.squads,rangeIds=scope\.rangeIds/);
  assert.doesNotMatch(render,/\bsquads=_squads\b|\brangeIds=_rangeIds\b/);
});

test('V2.57.1 inclui teste legado do GitHub e cache-bust coerente',()=>{
  assert.ok(fs.existsSync(path.join(root,'tests','indicator-squad-filter-v2563.test.js')));
  for(const asset of ['css/styles.css','js/app.js','js/performance-engine.js','js/filter-system.js']) assert.ok(index.includes(`${asset}?v=2.57.1`),asset);
  assert.ok(index.includes('V2.57.1'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.7.sql')));
});
