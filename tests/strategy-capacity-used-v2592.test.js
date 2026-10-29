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
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.59.2.sql');
const migration=readFileSync(migrationPath,'utf8');

test('V2.59.2 publica capacidade utilizada sem antecipar taxa de utilizacao',()=>{
  assert.equal(pkg.version,'2.63.7');
  assert.equal(pkg.assetVersion,'2.63.7-r1');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.equal(existsSync(migrationPath),true);
  assert.match(index,/INDICADOR V2\.59\.2/);
  assert.match(index,/strategyCapacityUsedVolume/);
  assert.match(index,/strategyCapacityUsedPerFte/);
  assert.match(index,/strategyCapacityUsedSquadRows/);
  assert.match(index,/strategyCapacityUsedTechnicianRows/);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.63.7-r1'));
});

test('capacidade utilizada mede volume e intensidade por FTE disponivel',()=>{
  const result=capacity.calculateUsedCapacity(300,1.5,{sourceAvailable:true,availabilityComplete:true});
  assert.equal(result.ready,true);
  assert.equal(result.usedVolume,300);
  assert.equal(result.usedPerAvailableFte,200);
  const zero=capacity.calculateUsedCapacity(0,2,{sourceAvailable:true,availabilityComplete:true});
  assert.equal(zero.usedVolume,0);
  assert.equal(zero.usedPerAvailableFte,0);
});

test('ausencia de resolucao ou disponibilidade mantem capacidade utilizada fail closed',()=>{
  assert.equal(capacity.calculateUsedCapacity(100,1,{sourceAvailable:false,availabilityComplete:true}).usedVolume,null);
  assert.equal(capacity.calculateUsedCapacity(100,1,{sourceAvailable:true,availabilityComplete:false}).usedVolume,null);
  const rows=capacity.buildUsedCapacity([
    {id:'a',squadCode:'A',nominalFte:1,availabilityFactor:1,resolutions:100,resolutionSourceAvailable:true},
    {id:'b',squadCode:'A',nominalFte:1,availabilityFactor:1,resolutions:0,resolutionSourceAvailable:false}
  ]);
  assert.equal(rows.summary.complete,false);
  assert.equal(rows.summary.usedVolume,null);
  assert.equal(rows.summary.demandMissing,1);
  assert.equal(rows.summary.coverage,0.5);
});

test('disponibilidade zero nao exige resolucao mas producao positiva com zero FTE e inconsistente',()=>{
  const ok=capacity.buildUsedCapacity([
    {id:'a',squadCode:'A',nominalFte:1,availabilityFactor:1,resolutions:100,resolutionSourceAvailable:true},
    {id:'b',squadCode:'A',nominalFte:1,availabilityFactor:0,resolutions:0,resolutionSourceAvailable:false}
  ]);
  assert.equal(ok.summary.complete,true);
  assert.equal(ok.summary.usedVolume,100);
  assert.equal(ok.summary.availableFte,1);
  const bad=capacity.normalizeUsedCapacityRow({id:'b',squadCode:'A',nominalFte:1,availabilityFactor:0,resolutions:10,resolutionSourceAvailable:true});
  assert.equal(bad.inconsistent,true);
  assert.equal(bad.usedVolume,null);
});

test('consolidacao por Squad usa somente FTE disponivel e preserva cobertura',()=>{
  const result=capacity.buildUsedCapacity([
    {id:'a',squadCode:'A',nominalFte:1,availabilityFactor:1,resolutions:200,resolutionSourceAvailable:true},
    {id:'b',squadCode:'A',nominalFte:1,availabilityFactor:0.5,resolutions:100,resolutionSourceAvailable:true},
    {id:'c',squadCode:'B',nominalFte:1,availabilityFactor:1,resolutions:150,resolutionSourceAvailable:true}
  ]);
  assert.equal(result.summary.availableFte,2.5);
  assert.equal(result.summary.usedVolume,450);
  assert.equal(result.summary.usedPerAvailableFte,180);
  const squadA=result.squads.find(row=>row.squadCode==='A');
  assert.equal(squadA.availableFte,1.5);
  assert.equal(squadA.usedVolume,300);
  assert.equal(squadA.usedPerAvailableFte,200);
  assert.equal(squadA.coverage,1);
});

test('fundacao ativa V2.59.2 e mantem percentual de utilizacao pendente',()=>{
  const foundation=capacity.buildFoundation({
    scope:{competence:'2026-10',squadCode:'A',demandUnit:'resolutions'},
    metrics:{nominalFte:2,availableFte:1.5,peopleCount:2,resolutions:300,usedCapacityVolume:300,usedPerAvailableFte:200,usedCapacityComplete:true},
    availability:{fte:true,resolutions:true,availabilityFactors:true,historicalCapacity:false}
  });
  assert.equal(foundation.metrics.usedCapacityVolume,300);
  assert.equal(foundation.metrics.usedPerAvailableFte,200);
  assert.equal(foundation.metrics.utilizationRate,null);
  assert.equal(foundation.metrics.requiredFte,null);
  assert.equal(foundation.catalog.find(x=>x.id==='available-capacity').status,'active');
  assert.equal(foundation.catalog.find(x=>x.id==='used-capacity').status,'active');
  assert.equal(foundation.catalog.find(x=>x.id==='utilization').status,'pending');
});

test('normalizador agregado preserva campos de capacidade utilizada e null real',()=>{
  const ready=data.normalizeFinancialSummary({nominal_fte:2,available_fte:1.5,used_capacity_volume:300,used_per_available_fte:200,used_capacity_coverage:1,used_capacity_entries:2,used_capacity_missing:0,used_capacity_complete:true});
  assert.equal(ready.usedCapacityVolume,300);
  assert.equal(ready.usedPerAvailableFte,200);
  assert.equal(ready.usedCapacityCoverage,1);
  assert.equal(ready.usedCapacityComplete,true);
  const missing=data.normalizeFinancialSummary({nominal_fte:2,available_fte:1.5,used_capacity_volume:null,used_per_available_fte:null,used_capacity_complete:false});
  assert.equal(missing.usedCapacityVolume,null);
  assert.equal(missing.usedPerAvailableFte,null);
});

test('migration agrega carga sem expor detalhe e nao calcula taxa percentual',()=>{
  assert.match(migration,/get_strategy_capacity_used_summary/i);
  assert.match(migration,/get_strategy_capacity_used_squad_summary/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
  assert.match(migration,/used_per_available_fte/i);
  assert.match(migration,/availability_factor>0 and resolution_metric_id is null/i);
  assert.match(migration,/availability_factor=0 and resolution_metric_id is not null and resolutions>0/i);
  assert.doesNotMatch(migration,/utilization_rate/i);
  assert.doesNotMatch(migration,/create table/i);
});

test('app consome RPCs V2.59.2 e mantem detalhes individuais protegidos',()=>{
  assert.match(app,/get_strategy_capacity_used_summary/);
  assert.match(app,/get_strategy_capacity_used_squad_summary/);
  assert.match(app,/strategyCapacityEngine\.buildUsedCapacity/);
  assert.match(app,/Detalhes individuais protegidos/);
  assert.match(app,/capacityUsedMissing\?'V2\.59\.2'/);
  assert.match(app,/renderStrategyRequiredFte/);
});
