const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const doc=join(root,'docs','EFICIENCIA_PRODUTIVIDADE_SQUAD_V2.58.4.md');

test('V2.58.4 permanece preservada dentro da V2.58.9',()=>{
  assert.equal(pkg.version,'2.59.0');
  assert.equal(pkg.assetVersion,'2.59.0');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.equal(existsSync(doc),true);
  assert.match(index,/INDICADOR V2\.58\.4/);
  assert.match(index,/Produtividade econômica por Squad/);
  assert.match(index,/strategySquadEconomicProductivityRows/);
  assert.match(index,/strategySquadProductivityPerThousand/);
  assert.match(index,/Resoluções \/ FTE/);
});

test('produtividade do Squad usa custo total consolidado incluindo operacao rateada',()=>{
  const row=efficiency.normalizeSquadProductivityRow({squadCode:'D',peopleCost:8000,operationalCost:2000,totalCost:10000,attendance:600,resolutions:250,fte:5,resolutionEntries:5,evaluationRate:.42});
  assert.equal(row.economicProductivity,25);
  assert.equal(row.costPerResolution,40);
  assert.equal(row.resolutionsPerFte,50);
  assert.equal(row.resolutionRate,250/600);
  assert.equal(row.sourceAvailable,true);
});

test('ranking por Squad recompensa resultado por custo e nao custo baixo isoladamente',()=>{
  const result=efficiency.buildSquadProductivity([
    {squadCode:'A',label:'Squad A',totalCost:10000,peopleCost:8000,operationalCost:2000,attendance:500,resolutions:200,fte:4,resolutionEntries:4,sourceAvailable:true,evaluationRate:.40},
    {squadCode:'B',label:'Squad B',totalCost:6000,peopleCost:5000,operationalCost:1000,attendance:300,resolutions:60,fte:3,resolutionEntries:3,sourceAvailable:true,evaluationRate:.45},
    {squadCode:'D',label:'Squad D',totalCost:15000,peopleCost:12000,operationalCost:3000,attendance:700,resolutions:450,fte:6,resolutionEntries:6,sourceAvailable:true,evaluationRate:.38}
  ]);
  assert.deepEqual(result.rows.map(r=>r.squadCode),['D','A','B']);
  assert.equal(result.rows[0].economicProductivity,30);
  assert.equal(result.rows[1].economicProductivity,20);
  assert.equal(result.rows[2].economicProductivity,10);
  assert.equal(result.totalCost,31000);
  assert.equal(result.resolutions,710);
});

test('taxa de avaliacao e FTE ficam como guardrails e nao alteram a formula economica',()=>{
  const a=efficiency.normalizeSquadProductivityRow({squadCode:'A',totalCost:10000,resolutions:200,fte:5,resolutionEntries:1,evaluationRate:.50,sourceAvailable:true});
  const b=efficiency.normalizeSquadProductivityRow({squadCode:'B',totalCost:10000,resolutions:200,fte:3,resolutionEntries:1,evaluationRate:.20,sourceAvailable:true});
  assert.equal(a.economicProductivity,b.economicProductivity);
  assert.notEqual(a.evaluationRate,b.evaluationRate);
  assert.notEqual(a.resolutionsPerFte,b.resolutionsPerFte);
});

test('Squad sem base explicita de resolucao permanece fora do ranking',()=>{
  const result=efficiency.buildSquadProductivity([
    {squadCode:'A',totalCost:10000,resolutions:0,resolutionEntries:0,sourceAvailable:false},
    {squadCode:'B',totalCost:10000,resolutions:100,resolutionEntries:1,sourceAvailable:true}
  ]);
  assert.equal(result.eligibleCount,1);
  assert.deepEqual(result.rows.map(r=>r.squadCode),['B']);
});

test('app usa consolidacao por Squad e protege a visao pela permissao agregada',()=>{
  assert.match(app,/strategySquadEconomicProductivityRows\(vm\)/);
  assert.match(app,/buildSquadProductivity\(raw\)/);
  assert.match(app,/if\(!displayAggregate\).*Sem permissão agregada/s);
  assert.match(app,/sourceAvailable:safe\(row\.resolutionEntries\)>0/);
  assert.match(app,/renderStrategySquadEconomicProductivity\(vm,displayAggregate\)/);
});
