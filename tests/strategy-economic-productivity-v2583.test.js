const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const doc=join(root,'docs','EFICIENCIA_PRODUTIVIDADE_TECNICO_V2.58.3.md');

test('V2.58.3 permanece preservada dentro da V2.58.9',()=>{
  assert.equal(pkg.version,'2.61.9');
  assert.equal(pkg.assetVersion,'2.61.9-r1');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.equal(existsSync(doc),true);
  assert.match(index,/Produtividade econômica por técnico/);
  assert.match(index,/strategyTechnicianEconomicProductivityRows/);
  assert.match(index,/Resoluções \/ R\$ 1\.000/);
});

test('produtividade economica mede resolucoes por R$ 1.000 de custo pessoal',()=>{
  assert.equal(efficiency.calculateEconomicProductivity(20,4000),5);
  assert.equal(efficiency.calculateEconomicProductivity(0,4000),0);
  assert.equal(efficiency.calculateEconomicProductivity(10,0),null);
});

test('ranking usa produtividade e nao custo baixo isoladamente',()=>{
  const result=efficiency.buildTechnicianProductivity([
    {id:'a',name:'A',personalCost:3000,attendance:100,resolutions:30,fte:1,linked:true,sourceAvailable:true,avgRating:4.8},
    {id:'b',name:'B',personalCost:2000,attendance:100,resolutions:10,fte:1,linked:true,sourceAvailable:true,avgRating:5},
    {id:'c',name:'C',personalCost:5000,attendance:100,resolutions:60,fte:1,linked:true,sourceAvailable:true,avgRating:4.5}
  ]);
  assert.deepEqual(result.rows.map(r=>r.id),['c','a','b']);
  assert.equal(result.rows[0].economicProductivity,12);
  assert.equal(result.rows[1].economicProductivity,10);
  assert.equal(result.rows[2].economicProductivity,5);
});

test('qualidade fica como contexto e nao altera a formula economica',()=>{
  const a=efficiency.normalizeTechnicianProductivityRow({id:'a',personalCost:4000,resolutions:20,avgRating:5,linked:true,sourceAvailable:true});
  const b=efficiency.normalizeTechnicianProductivityRow({id:'b',personalCost:4000,resolutions:20,avgRating:2,linked:true,sourceAvailable:true});
  assert.equal(a.economicProductivity,b.economicProductivity);
  assert.notEqual(a.avgRating,b.avgRating);
});

test('app exige permissao individual e usa base explicita de resolucoes',()=>{
  assert.match(app,/if\(!strategyPeopleAccess\(\)\).*Produtividade individual protegida/s);
  assert.match(app,/strategyResolutionMetricForUser\(vm,person\.userId,squadCode\)/);
  assert.match(app,/buildTechnicianProductivity\(raw\)/);
  assert.doesNotMatch(app,/economicProductivity\s*=\s*attendance/);
});
