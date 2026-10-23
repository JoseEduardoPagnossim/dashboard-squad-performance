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

test('V2.57.7 torna a troca de Squad deterministica',()=>{
  assert.equal(pkg.version,'2.59.6');
  const select=blockBetween('async function selectSquad','function requireSpecificSquad');
  assert.match(select,/selectionSeq=\+\+state\.squadSelectionSeq/);
  assert.match(select,/await ensureViewData\(state\.currentView,state\.adminSection,\{strict:true,forceMonths:forceQualityScope\}\)/);
  assert.match(select,/if\(selectionSeq!==state\.squadSelectionSeq\|\|state\.squadCode!==code\)return;/);
  assert.match(select,/state\.squadSelectionLoadError=false;refreshSelectors\(\);render\(\);applyPermissions\(\);updateBreadcrumbs\(\);/);
});

test('V2.57.7 remove o fluxo paralelo que mascarava o bug da Qualidade',()=>{
  for(const token of ['hydrateIndicatorSquadFilter','indicatorHydrationSeq','indicatorHydrationKey','indicatorHydrationErrorKey','indicatorScopeContextKey','indicatorSquadFilterRequiresFullData']) assert.ok(!app.includes(token),token);
});

test('V2.57.7 propaga falha mensal somente na troca explicita',()=>{
  const months=blockBetween('async function ensureMonthsLoaded','function orgDailyRequestedRange');
  assert.match(months,/strict\?job:job\.catch\(err=>null\)/);
  const view=blockBetween('async function ensureViewData','function hydrateCurrentViewAsync');
  assert.match(view,/\{strict=false,forceMonths=false\}=\{\}/);
  assert.match(view,/ensureMonthsLoaded\(codes,ids,\{silent:true,strict,force:forceMonths\}\)/);
});

test('V2.57.7 publica todos os assets com o mesmo cache-bust',()=>{
  const refs=[...index.matchAll(/(?:href|src)="((?:css|js)\/[^"]+)\?v=([^"]+)"/g)].map(m=>({asset:m[1],version:m[2]}));
  const current=refs.filter(x=>x.asset!=='js/audit-utils.js');
  assert.ok(current.length>5);
  assert.deepEqual([...new Set(current.map(x=>x.version))],[pkg.assetVersion]);
  assert.ok(index.includes('V2.59.6'));
});
