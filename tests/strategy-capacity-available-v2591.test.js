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
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.59.1.sql');
const migration=readFileSync(migrationPath,'utf8');

test('V2.59.1 publica capacidade disponivel com migration propria',()=>{
  assert.equal(pkg.version,'2.59.9');
  assert.equal(pkg.assetVersion,'2.59.9');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.equal(existsSync(migrationPath),true);
  assert.match(index,/INDICADOR V2\.59\.1/);
  assert.match(index,/strategyCapacitySquadRows/);
  assert.match(index,/strategyCapacityTechnicianRows/);
  assert.match(index,/Disponib\. %/);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.59.9'));
});

test('FTE disponivel respeita FTE nominal e disponibilidade explicita',()=>{
  assert.equal(capacity.calculateAvailableFte(1,1),1);
  assert.equal(capacity.calculateAvailableFte(1,0.5),0.5);
  assert.equal(capacity.calculateAvailableFte(0.5,0.5),0.25);
  assert.equal(capacity.calculateAvailableFte(1,0),0);
  assert.equal(capacity.calculateAvailableFte(1,null),null);
});

test('consolidacao por Squad soma FTE disponivel sem confundir headcount',()=>{
  const result=capacity.buildAvailableCapacity([
    {id:'a',name:'A',squadCode:'A',nominalFte:1,availabilityFactor:1},
    {id:'b',name:'B',squadCode:'A',nominalFte:1,availabilityFactor:0.5},
    {id:'c',name:'C',squadCode:'B',nominalFte:0.5,availabilityFactor:1}
  ]);
  assert.equal(result.summary.peopleCount,3);
  assert.equal(result.summary.nominalFte,2.5);
  assert.equal(result.summary.availableFte,2);
  assert.equal(result.summary.unavailableFte,0.5);
  assert.equal(result.summary.availabilityRate,0.8);
  const squadA=result.squads.find(row=>row.squadCode==='A');
  assert.equal(squadA.peopleCount,2);
  assert.equal(squadA.nominalFte,2);
  assert.equal(squadA.availableFte,1.5);
});

test('disponibilidade ausente mantem consolidado fail closed e zero explicito e valido',()=>{
  const missing=capacity.buildAvailableCapacity([
    {id:'a',name:'A',squadCode:'A',nominalFte:1,availabilityFactor:1},
    {id:'b',name:'B',squadCode:'A',nominalFte:1,availabilityFactor:null}
  ]);
  assert.equal(missing.summary.availabilityComplete,false);
  assert.equal(missing.summary.availableFte,null);
  assert.equal(missing.summary.availabilityMissing,1);
  assert.equal(missing.summary.availabilityCoverage,0.5);
  const zero=capacity.buildAvailableCapacity([{id:'a',name:'A',squadCode:'A',nominalFte:1,availabilityFactor:0}]);
  assert.equal(zero.summary.availabilityComplete,true);
  assert.equal(zero.summary.availableFte,0);
  assert.equal(zero.summary.unavailableFte,1);
});

test('fundacao ativa V2.59.1 sem antecipar utilizacao ou FTE necessario',()=>{
  const foundation=capacity.buildFoundation({
    scope:{competence:'2026-10',squadCode:'A',demandUnit:'resolutions'},
    metrics:{nominalFte:2,availableFte:1.5,peopleCount:2,resolutions:300,attendance:400},
    availability:{fte:true,attendance:true,resolutions:true,availabilityFactors:true,historicalCapacity:false}
  });
  assert.equal(foundation.metrics.availableFte,1.5);
  assert.equal(foundation.metrics.unavailableFte,0.5);
  assert.equal(foundation.metrics.availabilityRate,0.75);
  assert.equal(foundation.metrics.utilizationRate,null);
  assert.equal(foundation.metrics.requiredFte,null);
  assert.equal(foundation.catalog.find(x=>x.id==='available-capacity').status,'active');
  assert.equal(foundation.catalog.find(x=>x.id==='used-capacity').status,'active');
});

test('normalizador preserva disponibilidade nula e calcula FTE disponivel somente quando informada',()=>{
  const known=data.normalizeEmployeeCostRow({person_id:'p1',fte:1,availability_factor:0.5,salary:1000});
  assert.equal(known.availabilityFactor,0.5);
  assert.equal(known.availableFte,0.5);
  assert.equal(known.totalCost,1000);
  const missing=data.normalizeEmployeeCostRow({person_id:'p2',fte:1,availability_factor:null,salary:1000});
  assert.equal(missing.availabilityFactor,null);
  assert.equal(missing.availableFte,null);
});

test('migration adiciona fator sem alterar custo e preserva historico fechado',()=>{
  assert.match(migration,/add column if not exists availability_factor numeric\(5,4\)/i);
  assert.match(migration,/sc\.status <> 'closed'/i);
  assert.match(migration,/alter column availability_factor set default 1/i);
  assert.match(migration,/check \(availability_factor is null or \(availability_factor >= 0 and availability_factor <= 1\)\)/i);
  assert.match(migration,/get_strategy_capacity_summary/i);
  assert.match(migration,/get_strategy_capacity_squad_summary/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
  assert.doesNotMatch(migration,/total_cost[\s\S]{0,120}availability_factor/i);
});

test('app persiste disponibilidade e consome RPC agregada sem expor detalhes individuais',()=>{
  assert.match(app,/availability_factor:availabilityFactor/);
  assert.match(app,/get_strategy_capacity_summary/);
  assert.match(app,/get_strategy_capacity_squad_summary/);
  assert.match(app,/strategyCapacityEngine\.buildAvailableCapacity/);
  assert.match(app,/Detalhes individuais protegidos/);
  assert.match(app,/capacityMissing\?'V2\.59\.1'/);
});
