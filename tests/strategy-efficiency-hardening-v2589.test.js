const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const data=require(join(root,'js','strategy-data.js'));
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.58.9.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','HARDENING_EFICIENCIA_V2.58.9.md');

test('V2.58.9 fecha a Fase 3 com hardening versionado',()=>{
  assert.equal(pkg.version,'2.60.4');
  assert.equal(pkg.assetVersion,'2.60.4');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/V2\.60\.4/);
  assert.ok(index.includes('js/strategy-efficiency.js?v=2.60.4'));
  assert.ok(index.includes('js/app.js?v=2.60.4'));
});

test('null permanece sem base e nao vira zero nos calculos relativos',()=>{
  assert.equal(efficiency.optionalNumber(null),null);
  assert.equal(efficiency.optionalNumber(''),null);
  assert.equal(efficiency.changeRatio(null,10),null);
  assert.equal(efficiency.relativeIndex(null,10),null);
  assert.equal(efficiency.average([null,10]),10);
  assert.equal(efficiency.median([null,10,20]),15);
  const snapshot=efficiency.normalizeEfficiencySnapshot({competence:'2026-09',operation:{total_cost:100,resolutions:0,resolution_entries:0,cost_per_resolution:null,evaluation_rate:null},benchmarks:{operation_benchmark:null,median_benchmark:null,best_value:null}});
  assert.equal(snapshot.operation.costPerResolution,null);
  assert.equal(snapshot.operation.evaluationRate,null);
  assert.equal(snapshot.benchmarks.operationBenchmark,null);
  assert.equal(snapshot.benchmarks.medianBenchmark,null);
  assert.equal(snapshot.benchmarks.bestValue,null);
});

test('strategy-data tambem preserva null em snapshot vindo da RPC',()=>{
  const row=data.normalizeEfficiencyHistoryRow({competence:'2026-09',operation:{total_cost:100,resolutions:0,resolution_entries:0,cost_per_resolution:null,evaluation_rate:null},benchmarks:{operation_benchmark:null,median_benchmark:null,best_value:null}});
  assert.equal(row.operation.costPerResolution,null);
  assert.equal(row.operation.evaluationRate,null);
  assert.equal(row.benchmarks.operationBenchmark,null);
  assert.equal(row.benchmarks.medianBenchmark,null);
  assert.equal(row.benchmarks.bestValue,null);
});

test('benchmark de Squad fica fail-closed quando existe custo sem base de resolucao',()=>{
  const result=efficiency.buildSquadBenchmarks([
    {squadCode:'A',totalCost:10000,resolutions:100,resolutionEntries:1,sourceAvailable:true},
    {squadCode:'B',totalCost:10000,resolutions:0,resolutionEntries:0,sourceAvailable:false}
  ]);
  assert.equal(result.candidateCount,2);
  assert.equal(result.eligibleCount,1);
  assert.equal(result.coverageComplete,false);
  assert.equal(result.coverageRatio,.5);
  assert.equal(result.operationBenchmark,null);
  assert.equal(result.meanBenchmark,null);
  assert.equal(result.medianBenchmark,null);
  assert.equal(result.best,null);
  assert.equal(result.rows.find(row=>row.squadCode==='A').benchmarkEligible,false);
});

test('zero resolucoes explicitamente informado conta como cobertura valida',()=>{
  const result=efficiency.buildSquadBenchmarks([
    {squadCode:'A',totalCost:10000,resolutions:100,resolutionEntries:1,sourceAvailable:true},
    {squadCode:'B',totalCost:10000,resolutions:0,resolutionEntries:1,sourceAvailable:true}
  ]);
  assert.equal(result.coverageComplete,true);
  assert.equal(result.operationBenchmark,5);
  assert.equal(result.rows.find(row=>row.squadCode==='B').economicProductivity,0);
  assert.equal(result.rows.find(row=>row.squadCode==='B').benchmarkEligible,true);
});

test('benchmark tecnico nao compara Squad com base parcial',()=>{
  const result=efficiency.buildTechnicianBenchmarks([
    {id:'a',name:'Ana',squadCode:'A',personalCost:5000,resolutions:50,attendance:60,linked:true,sourceAvailable:true},
    {id:'b',name:'Beto',squadCode:'A',personalCost:5000,resolutions:0,attendance:50,linked:true,sourceAvailable:false},
    {id:'c',name:'Caio',squadCode:'B',personalCost:5000,resolutions:40,attendance:50,linked:true,sourceAvailable:true}
  ]);
  assert.equal(result.coverageComplete,false);
  assert.equal(result.operationBenchmark,null);
  assert.equal(result.squadBenchmarks.find(row=>row.squadCode==='A').coverageComplete,false);
  assert.equal(result.rows.find(row=>row.id==='a').benchmarkEligible,false);
  assert.equal(result.squadBenchmarks.find(row=>row.squadCode==='B').coverageComplete,true);
  assert.equal(result.rows.find(row=>row.id==='c').benchmarkEligible,true);
});

test('historico escolhe maior revisao e prioriza previa quando competencia foi reaberta',()=>{
  const frozen=efficiency.latestEfficiencySnapshots([
    {competence:'2026-08',revision:1,source:'close',operation:{total_cost:100,resolutions:10,resolution_entries:1},squads:[{squad_code:'A',total_cost:100,resolutions:10,resolution_entries:1}]},
    {competence:'2026-08',revision:2,source:'close',operation:{total_cost:100,resolutions:20,resolution_entries:1},squads:[{squad_code:'A',total_cost:100,resolutions:20,resolution_entries:1}]}
  ]);
  assert.equal(frozen.length,1);
  assert.equal(frozen[0].revision,2);
  const reopened=efficiency.latestEfficiencySnapshots([
    frozen[0],
    {competence:'2026-08',revision:0,source:'live_preview',operation:{total_cost:100,resolutions:30,resolution_entries:1},squads:[{squad_code:'A',total_cost:100,resolutions:30,resolution_entries:1}]}
  ]);
  assert.equal(reopened.length,1);
  assert.equal(reopened[0].source,'live_preview');
  assert.equal(reopened[0].operation.resolutions,30);
});

test('evolucao da operacao nao considera snapshot parcialmente coberto como pronto',()=>{
  const rows=[
    {competence:'2026-08',revision:1,source:'close',operation:{total_cost:200,resolutions:10,resolution_entries:1,economic_productivity:50},squads:[{squad_code:'A',total_cost:100,resolutions:10,resolution_entries:1,economic_productivity:100},{squad_code:'B',total_cost:100,resolutions:0,resolution_entries:0,economic_productivity:0}]}
  ];
  const operation=efficiency.buildEfficiencyEvolution(rows);
  const squadA=efficiency.buildEfficiencyEvolution(rows,{squadCode:'A'});
  assert.equal(operation.readyCount,0);
  assert.equal(operation.rows[0].coverage.operationComplete,false);
  assert.equal(squadA.readyCount,1);
});

test('app exige cobertura completa para declarar resolucoes prontas e troca snapshot por previa reaberta',()=>{
  assert.match(app,/costBearing\.every\(row=>row\.sourceAvailable\)/);
  assert.match(app,/frozen\.splice\(index,1,live\)/);
});

test('migration V2.58.9 protege resolucoes e contrato dos snapshots',()=>{
  assert.match(migration,/validate_strategy_resolution_metric_integrity/i);
  assert.match(migration,/resolutions exceed operational attendance/i);
  assert.match(migration,/strategy resolution metric is immutable while competence is closed/i);
  assert.match(migration,/strategy_resolution_metrics_integrity_guard/i);
  assert.match(migration,/financial_snapshot_revision=revision/i);
  assert.match(migration,/jsonb_typeof\(snapshot\)='object'/i);
  assert.match(migration,/ON DELETE SET NULL/i);
});
