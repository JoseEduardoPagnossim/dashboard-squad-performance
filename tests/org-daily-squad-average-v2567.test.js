const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const pkg=require('../package.json');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('V2.57.7 filtra o consolidado diario pelo Squad global antes de calcular a media',()=>{
  assert.equal(pkg.version,'2.63.5');
  assert.match(app,/function orgDailyScopeCode\(\)\{return state\.squadCode==='all'\?null:String\(state\.squadCode\|\|''\)\.toUpperCase\(\);\}/);
  assert.match(app,/function filteredOrgDailyRows\(\).*dateBetween\(date\)&&\(!code\|\|rowCode===code\)/s);
});

test('V2.57.7 calcula Todos os Squads pela soma diaria e preserva somente dias com atendimento',()=>{
  assert.match(app,/map\.set\(date,\(map\.get\(date\)\|\|0\)\+safe\(r\.totalAtt\)\)/);
  assert.match(app,/\.filter\(item=>item\.value>0\)/);
  assert.match(app,/average=values\.length\?values\.reduce\(\(a,b\)=>a\+b,0\)\/values\.length:0/);
});

test('V2.57.7 adapta titulo legenda e resumo ao Squad selecionado',()=>{
  assert.ok(index.includes('id="teamOrgDailyTitle"'));
  assert.ok(index.includes('id="indicatorOrgDailyTitle"'));
  assert.match(app,/Atendimentos diários do \$\{scopeLabel\}/);
  assert.match(app,/Média diária do \$\{scopeLabel\}/);
  assert.match(app,/Média geral dos dias com atendimento/);
  assert.match(app,/\$\{data\.scopeLabel\} • \$\{analysisRangeLabel\(\)\} • média/);
});

test('V2.57.7 publica cache-bust coerente sem migration',()=>{
  for(const asset of ['css/styles.css','js/app.js','js/chart-engine.js']){
    assert.ok(index.includes(`${asset}?v=2.63.5-r1`),asset);
  }
  assert.ok(index.includes('V2.60.7'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.7.sql')));
});
