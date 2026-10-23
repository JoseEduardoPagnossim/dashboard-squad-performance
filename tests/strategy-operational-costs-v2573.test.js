const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const costEngine=require(join(root,'js','strategy-cost-engine.js'));
const dataEngine=require(join(root,'js','strategy-data.js'));
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.57.4.sql');
const migration=readFileSync(migrationPath,'utf8');

// Compatibilidade histórica: a etapa planejada como V2.57.3 foi absorvida
// pelo motor financeiro consolidado da V2.57.4. Este arquivo permanece com
// o nome antigo apenas para impedir que um teste legado volte a exigir APIs
// removidas do motor atual.

test('compatibilidade: custos operacionais usam o motor financeiro atual da V2.57.7',()=>{
  assert.equal(pkg.version,'2.58.4');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(typeof costEngine.calculateOperationalAllocations,'function');
  assert.equal(typeof costEngine.summarizeOperationalCosts,'function');
  assert.equal(typeof costEngine.buildOperationalAllocationPlan,'undefined');
});

test('rateio direto direciona 100% para um único Squad',()=>{
  const rows=costEngine.calculateOperationalAllocations({amount:400,scopeType:'squad',squadCode:'D',allocationMethod:'direct'},{});
  assert.deepEqual(rows.map(r=>[r.squadCode,r.allocatedAmount,r.percentage]),[['D',400,1]]);
});

test('rateio por FTE usa proporção agregada e preserva exatamente o valor',()=>{
  const rows=costEngine.calculateOperationalAllocations({amount:600,scopeType:'organization',allocationMethod:'fte'},{fteBySquad:{A:1,B:2,D:3}});
  assert.equal(rows.reduce((s,r)=>s+r.allocatedAmount,0),600);
  assert.equal(rows.find(r=>r.squadCode==='A').allocatedAmount,100);
  assert.equal(rows.find(r=>r.squadCode==='B').allocatedAmount,200);
  assert.equal(rows.find(r=>r.squadCode==='D').allocatedAmount,300);
});

test('rateio por atendimentos usa produção da competência',()=>{
  const rows=costEngine.calculateOperationalAllocations({amount:300,scopeType:'organization',allocationMethod:'attendance'},{attendanceBySquad:{A:100,D:200}});
  assert.equal(rows.find(r=>r.squadCode==='A').allocatedAmount,100);
  assert.equal(rows.find(r=>r.squadCode==='D').allocatedAmount,200);
});

test('rateio manual é normalizado pelos pesos e fecha o valor integral',()=>{
  const rows=costEngine.calculateOperationalAllocations({amount:100,scopeType:'organization',allocationMethod:'manual'},{manualBySquad:{A:20,B:30,D:50}});
  assert.equal(rows.reduce((s,r)=>s+r.allocatedAmount,0),100);
  assert.equal(rows.find(r=>r.squadCode==='A').allocatedAmount,20);
  assert.equal(rows.find(r=>r.squadCode==='B').allocatedAmount,30);
  assert.equal(rows.find(r=>r.squadCode==='D').allocatedAmount,50);
});

test('consolidado operacional respeita Squad e Todos preserva custo total',()=>{
  const costs=[{id:'o1',amount:400},{id:'o2',amount:600}];
  const allocations=[
    {operationalCostId:'o1',squadCode:'A',allocatedAmount:150},
    {operationalCostId:'o1',squadCode:'D',allocatedAmount:250},
    {operationalCostId:'o2',squadCode:'A',allocatedAmount:200},
    {operationalCostId:'o2',squadCode:'D',allocatedAmount:400}
  ];
  assert.equal(costEngine.summarizeOperationalCosts(costs,allocations,{squadCode:'A'}).operationalCost,350);
  assert.equal(costEngine.summarizeOperationalCosts(costs,allocations,{squadCode:'D'}).operationalCost,650);
  assert.equal(costEngine.summarizeOperationalCosts(costs,allocations,{squadCode:'all'}).operationalCost,1000);
});

test('resumo financeiro soma pessoas e operação no motor consolidado',()=>{
  const summary=costEngine.mergeFinancialSummary({peopleCost:7000,operationalCost:3000,attendance:500,fte:2},{competence:'2026-10',squadCode:'all'});
  assert.equal(summary.totalCost,10000);
  assert.equal(summary.costPerAttendance,20);
  assert.equal(summary.attendancePerFte,250);
});

test('normalização preserva método, categoria e fotografia do rateio',()=>{
  const row=dataEngine.normalizeAllocationRow({operational_cost_id:'o1',squad_code:'D',allocation_method:'fte',basis_value:3,percentage:0.5,allocated_amount:250});
  assert.equal(row.operationalCostId,'o1');
  assert.equal(row.squadCode,'D');
  assert.equal(row.allocationMethod,'fte');
  assert.equal(row.basisValue,3);
  assert.equal(row.percentage,0.5);
  assert.equal(row.allocatedAmount,250);
  assert.equal(typeof dataEngine.normalizeCostAllocationRow,'undefined');
});

test('migration atual protege detalhes e expõe consolidados financeiros por RPC',()=>{
  assert.match(migration,/strategy_operational_costs/i);
  assert.match(migration,/strategy_cost_allocations/i);
  assert.match(migration,/get_strategy_financial_summary/i);
  assert.match(migration,/get_strategy_squad_cost_summary/i);
  assert.match(migration,/enable row level security/i);
});
