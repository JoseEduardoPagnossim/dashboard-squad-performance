const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const doc=join(root,'docs','EFICIENCIA_DIAGNOSTICOS_V2.58.6.md');

test('V2.58.6 publica insights e diagnostico explicavel sem migration nova',()=>{
  assert.equal(pkg.version,'2.61.4');
  assert.equal(pkg.assetVersion,'2.61.4-r1');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.equal(existsSync(doc),true);
  assert.match(index,/INDICADOR V2\.58\.6/);
  assert.match(index,/strategyEfficiencyDiagnosticPriority/);
  assert.match(index,/strategyEfficiencyDiagnosticSquadRows/);
  assert.match(index,/strategyEfficiencyDiagnosticTechRows/);
  assert.match(app,/renderStrategyEfficiencyDiagnostics/);
});

test('diagnostico identifica pressao de resolucao antes de atribuir problema apenas a custo',()=>{
  const result=efficiency.diagnoseEfficiencyRow({benchmarkEligible:true,squadCode:'D',label:'Squad D',vsOperation:-.12,costPerResolutionDelta:.08,resolutionRateDelta:-.09,evaluationRateDelta:0},'squad');
  assert.equal(result.code,'RESOLUTION_PRESSURE');
  assert.equal(result.priority,3);
  assert.equal(result.tone,'bad');
});

test('diagnostico identifica pressao de custo quando resolucao esta preservada',()=>{
  const result=efficiency.diagnoseEfficiencyRow({benchmarkEligible:true,squadCode:'B',label:'Squad B',vsOperation:-.14,costPerResolutionDelta:.18,resolutionRateDelta:-.01,evaluationRateDelta:.01},'squad');
  assert.equal(result.code,'COST_PRESSURE');
  assert.equal(result.priority,2);
});

test('ganho economico com qualidade abaixo da referencia aciona guardrail',()=>{
  const result=efficiency.diagnoseEfficiencyRow({benchmarkEligible:true,squadCode:'A',label:'Squad A',vsOperation:.16,costPerResolutionDelta:-.1,resolutionRateDelta:.04,evaluationRateDelta:-.06},'squad');
  assert.equal(result.code,'QUALITY_GUARDRAIL');
  assert.equal(result.priority,3);
  assert.equal(result.tone,'warn');
});

test('diagnostico tecnico usa referencia do proprio Squad e nota como guardrail',()=>{
  const rows=[
    {id:'1',name:'Ana',squadCode:'A',personalCost:5000,resolutions:60,attendance:70,avgRating:4.0,linked:true,sourceAvailable:true},
    {id:'2',name:'Beto',squadCode:'A',personalCost:5000,resolutions:40,attendance:60,avgRating:5.0,linked:true,sourceAvailable:true}
  ];
  const bench=efficiency.buildTechnicianBenchmarks(rows),ana=bench.rows.find(row=>row.id==='1');
  assert.ok(ana.vsSquad>0);
  assert.ok(ana.ratingDelta<-.3);
  const diag=efficiency.diagnoseEfficiencyRow(ana,'technician');
  assert.equal(diag.code,'QUALITY_GUARDRAIL');
});

test('sumario prioriza alertas e contabiliza lacunas sem criar score oculto',()=>{
  const rows=[
    efficiency.diagnoseEfficiencyRow({benchmarkEligible:true,label:'A',squadCode:'A',vsOperation:.08,costPerResolutionDelta:-.05,resolutionRateDelta:.02,evaluationRateDelta:0},'squad'),
    efficiency.diagnoseEfficiencyRow({benchmarkEligible:true,label:'B',squadCode:'B',vsOperation:-.11,costPerResolutionDelta:.15,resolutionRateDelta:0,evaluationRateDelta:0},'squad'),
    efficiency.diagnoseEfficiencyRow({benchmarkEligible:false,label:'D',squadCode:'D'},'squad')
  ];
  const summary=efficiency.summarizeDiagnostics(rows);
  assert.equal(summary.attention,1);
  assert.equal(summary.healthy,1);
  assert.equal(summary.dataGap,1);
  assert.equal(summary.priority.code,'COST_PRESSURE');
});
