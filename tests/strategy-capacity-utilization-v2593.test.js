const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const capacity=require(join(root,'js','strategy-capacity.js'));
const data=require(join(root,'js','strategy-data.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.59.3.sql');
const migration=readFileSync(migrationPath,'utf8');

function historyRow(competence,squadCode,usedPerAvailableFte,availableFte=2){
  return {competence,squadCode,status:'closed',availableFte,usedCapacityVolume:usedPerAvailableFte*availableFte,usedPerAvailableFte,complete:true};
}

test('V2.59.6 publica utilizacao com regra e migration proprias',()=>{
  assert.equal(pkg.version,'2.59.8');
  assert.equal(pkg.assetVersion,'2.59.8');
  assert.equal(capacity.RULE_VERSION,'CA-0.9.0-snapshots-history');
  assert.equal(existsSync(migrationPath),true);
  assert.match(index,/INDICADOR V2\.59\.3/);
  assert.match(index,/strategyCapacityUtilizationRate/);
  assert.match(index,/strategyCapacityReferencePerFte/);
  assert.match(index,/strategyCapacityUtilizationSquadRows/);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.59.8'));
});

test('referencia historica usa exatamente os meses anteriores da janela e mediana',()=>{
  const history=[
    historyRow('2026-07','ALL',180),
    historyRow('2026-08','ALL',200),
    historyRow('2026-09','ALL',220)
  ];
  const ref=capacity.buildHistoricalReference(history,{competence:'2026-10',squadCode:'ALL',comparison:'3m'});
  assert.equal(ref.ready,true);
  assert.equal(ref.referencePerFte,200);
  assert.deepEqual(ref.expectedCompetences,['2026-09','2026-08','2026-07']);
  assert.equal(ref.sampleCount,3);
});

test('janela nao pula mes ausente ou incompleto para buscar base mais antiga',()=>{
  const history=[
    historyRow('2026-06','ALL',160),
    historyRow('2026-07','ALL',180),
    {...historyRow('2026-08','ALL',200),complete:false},
    historyRow('2026-09','ALL',220)
  ];
  const ref=capacity.buildHistoricalReference(history,{competence:'2026-10',squadCode:'ALL',comparison:'3m'});
  assert.equal(ref.ready,false);
  assert.equal(ref.referencePerFte,null);
  assert.equal(ref.sampleCount,2);
  assert.equal(ref.missingCount,1);
});

test('utilizacao calcula capacidade observada, saldo, folga e sobrecarga',()=>{
  const within=capacity.calculateUtilization({usedVolume:400,usedPerAvailableFte:200,availableFte:2,referencePerFte:200});
  assert.equal(within.ready,true);
  assert.equal(within.utilizationRate,1);
  assert.equal(within.sustainableCapacityVolume,400);
  assert.equal(within.balanceVolume,0);
  assert.equal(within.status,'within');

  const below=capacity.calculateUtilization({usedVolume:320,usedPerAvailableFte:160,availableFte:2,referencePerFte:200});
  assert.equal(below.utilizationRate,0.8);
  assert.equal(below.slackVolume,80);
  assert.equal(below.status,'below');

  const above=capacity.calculateUtilization({usedVolume:480,usedPerAvailableFte:240,availableFte:2,referencePerFte:200});
  assert.equal(above.utilizationRate,1.2);
  assert.equal(above.overloadVolume,80);
  assert.equal(above.status,'above');
});

test('faixas de utilizacao sao explicitas e inclusivas no intervalo 90 a 110',()=>{
  assert.equal(capacity.classifyUtilization(0.8999).status,'below');
  assert.equal(capacity.classifyUtilization(0.90).status,'within');
  assert.equal(capacity.classifyUtilization(1).status,'within');
  assert.equal(capacity.classifyUtilization(1.10).status,'within');
  assert.equal(capacity.classifyUtilization(1.1001).status,'above');
});

test('operacao e Squad usam referencias historicas independentes',()=>{
  const history=[
    historyRow('2026-09','ALL',200),
    historyRow('2026-09','A',250),
    historyRow('2026-09','B',150)
  ];
  const op=capacity.buildUtilization({current:{usedCapacityVolume:420,usedPerAvailableFte:210,availableFte:2},history,competence:'2026-10',squadCode:'ALL',comparison:'previous'});
  const squadA=capacity.buildUtilization({current:{usedCapacityVolume:275,usedPerAvailableFte:275,availableFte:1},history,competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(op.reference.referencePerFte,200);
  assert.equal(op.utilization.utilizationRate,1.05);
  assert.equal(squadA.reference.referencePerFte,250);
  assert.equal(squadA.utilization.utilizationRate,1.1);
});

test('historico normalizado preserva null e completude sem fabricar zero',()=>{
  const row=data.normalizeCapacityHistoryRow({competence:'2026-09-01',squad_code:'A',status:'closed',available_fte:null,used_capacity_volume:null,used_per_available_fte:null,used_capacity_complete:false});
  assert.equal(row.competence,'2026-09');
  assert.equal(row.squadCode,'A');
  assert.equal(row.availableFte,null);
  assert.equal(row.usedCapacityVolume,null);
  assert.equal(row.usedPerAvailableFte,null);
  assert.equal(row.usedCapacityComplete,false);
});

test('migration usa apenas competencias fechadas e nao cria tabela ou backfill',()=>{
  assert.match(migration,/get_strategy_capacity_utilization_history/i);
  assert.match(migration,/sc\.status='closed'/i);
  assert.match(migration,/availability_factor is null/i);
  assert.match(migration,/used_capacity_complete/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
  assert.doesNotMatch(migration,/create table/i);
  assert.doesNotMatch(migration,/update\s+public\.strategy_employee_costs/i);
});

test('app carrega historico de utilizacao e mantem FTE necessario pendente',()=>{
  assert.match(app,/get_strategy_capacity_utilization_history/);
  assert.match(app,/strategyCapacityEngine\.buildHistoricalReference/);
  assert.match(app,/strategyCapacityEngine\.buildUtilization/);
  assert.match(app,/renderStrategyCapacityUtilization/);
  assert.match(app,/capacityUtilizationMissing\?'V2\.59\.3'/);
  assert.match(app,/renderStrategyRequiredFte/);
});
