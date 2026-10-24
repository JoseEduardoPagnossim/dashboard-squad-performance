const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const doc=join(root,'docs','EFICIENCIA_BENCHMARKS_V2.58.5.md');

test('V2.58.5 permanece preservada dentro da V2.58.9',()=>{
  assert.equal(pkg.version,'2.60.5');
  assert.equal(pkg.assetVersion,'2.60.5');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.equal(existsSync(doc),true);
  assert.match(index,/INDICADOR V2\.58\.5/);
  assert.match(index,/strategyEfficiencyBenchmarkSquadRows/);
  assert.match(index,/strategyEfficiencyBenchmarkTechRows/);
  assert.match(index,/INDICADOR V2\.58\.4/);
  assert.match(app,/renderStrategyEfficiencyBenchmarks/);
});

test('benchmark de Squad usa operacao ponderada, media, mediana e indice 100',()=>{
  const result=efficiency.buildSquadBenchmarks([
    {squadCode:'A',label:'Squad A',totalCost:10000,resolutions:100,resolutionEntries:2,sourceAvailable:true},
    {squadCode:'B',label:'Squad B',totalCost:20000,resolutions:100,resolutionEntries:2,sourceAvailable:true},
    {squadCode:'D',label:'Squad D',totalCost:10000,resolutions:200,resolutionEntries:2,sourceAvailable:true}
  ]);
  assert.equal(result.eligibleCount,3);
  assert.equal(result.operationBenchmark,10);
  assert.equal(result.meanBenchmark,(10+5+20)/3);
  assert.equal(result.medianBenchmark,10);
  assert.equal(result.best.squadCode,'D');
  const squadA=result.rows.find(row=>row.squadCode==='A');
  const squadB=result.rows.find(row=>row.squadCode==='B');
  assert.equal(squadA.relativeIndex,100);
  assert.equal(squadA.relativeBand,'near');
  assert.equal(squadB.relativeIndex,50);
  assert.equal(squadB.relativeBand,'below');
});

test('benchmark individual compara tecnico com base ponderada do proprio Squad',()=>{
  const result=efficiency.buildTechnicianBenchmarks([
    {id:'1',name:'Ana',squadCode:'A',personalCost:5000,resolutions:50,attendance:60,linked:true,sourceAvailable:true},
    {id:'2',name:'Beto',squadCode:'A',personalCost:5000,resolutions:25,attendance:50,linked:true,sourceAvailable:true},
    {id:'3',name:'Caio',squadCode:'B',personalCost:10000,resolutions:100,attendance:110,linked:true,sourceAvailable:true}
  ]);
  assert.equal(result.operationBenchmark,8.75);
  const ana=result.rows.find(row=>row.id==='1');
  assert.equal(ana.squadBenchmark,7.5);
  assert.ok(ana.vsSquad>0);
  assert.ok(ana.vsOperation>0);
  assert.equal(ana.relativeIndex,10/8.75*100);
});

test('benchmark ignora linhas sem custo ou sem fonte e nao inventa base',()=>{
  const result=efficiency.buildSquadBenchmarks([
    {squadCode:'A',totalCost:0,resolutions:10,sourceAvailable:true},
    {squadCode:'B',totalCost:1000,resolutions:0,sourceAvailable:false}
  ]);
  assert.equal(result.eligibleCount,0);
  assert.equal(result.operationBenchmark,null);
  assert.equal(result.medianBenchmark,null);
  assert.equal(result.best,null);
});
