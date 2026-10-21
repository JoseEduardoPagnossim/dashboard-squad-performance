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

test('regressao V2.56.2: Qualidade limpa os valores enquanto o mes do novo Squad ainda esta resumido',()=>{
  assert.equal(pkg.version,'2.56.3');
  const quality=blockBetween('function renderQualityIndicators','function monthServiceTechnicianTotals');
  assert.match(quality,/pending=indicatorScopeHasPendingFullData\(state\.squadCode,rangeIds\)/);
  assert.match(quality,/if\(pending\)\{renderQualityScopePending\(squads,rangeIds\);return;\}/);
  assert.match(app,/qualityServiceTotal'\)\.textContent='—'/);
  assert.match(app,/Atualizando dados de \$\{scope\}/);
});

test('regressao V2.56.2: respostas antigas continuam protegidas pelo token global da tela',()=>{
  const hydrate=blockBetween('function hydrateCurrentViewAsync','function schedulePostLoginHydration');
  assert.match(hydrate,/state\.indicatorSection\|\|'performance'/);
  assert.match(hydrate,/state\.squadCode/);
  assert.match(hydrate,/state\.currentId\|\|''/);
  assert.match(hydrate,/state\.analysisStartDate\|\|''/);
  assert.match(hydrate,/state\.analysisEndDate\|\|''/);
  assert.match(hydrate,/if\(current!==token\)return/);
});

test('regressao V2.56.2: cache-bust permanece alinhado com a versao atual',()=>{
  assert.ok(index.includes('js/app.js?v=2.56.3'));
  assert.ok(index.includes('css/styles.css?v=2.56.3'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.3.sql')));
});
