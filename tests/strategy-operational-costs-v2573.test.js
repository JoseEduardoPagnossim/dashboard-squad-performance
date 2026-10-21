const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, existsSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const pkg = require(join(root, 'package.json'));
const costEngine = require(join(root, 'js', 'strategy-cost-engine.js'));
const dataEngine = require(join(root, 'js', 'strategy-data.js'));
const strategyEngine = require(join(root, 'js', 'strategy.js'));
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const migrationPath = join(root, 'supabase', 'migrations', 'MIGRACAO_V2.57.3.sql');
const migration = readFileSync(migrationPath, 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');

const squads = ['A','B','D','E'];

test('V2.57.3 publica custos operacionais e rateios', () => {
  assert.equal(pkg.version, '2.57.3');
  assert.equal(existsSync(migrationPath), true);
  assert.match(index, /id="strategyOperationalEditor"/);
  assert.match(index, /id="strategyNewOperationalAllocationMethod"/);
  assert.match(index, /id="strategyOperationalRows"/);
  assert.match(index, /id="strategySaveOperationalCostsBtn"/);
  assert.match(app, /get_strategy_operational_cost_summary/);
  assert.match(app, /get_strategy_allocation_basis/);
  assert.match(app, /save_strategy_operational_cost/);
});

test('rateio direto direciona 100% para um único Squad', () => {
  const plan = costEngine.buildOperationalAllocationPlan({amount:1000,method:'direct',squadCodes:squads,directSquad:'D'});
  assert.equal(plan.valid, true);
  assert.deepEqual(plan.allocations.map(x=>[x.squadCode,x.percentage,x.allocatedAmount]), [['D',100,1000]]);
});

test('rateio por FTE usa proporção agregada e fecha exatamente em 100%', () => {
  const plan = costEngine.buildOperationalAllocationPlan({amount:900,method:'headcount',squadCodes:squads,fteBySquad:{A:2,B:1,D:3,E:0}});
  assert.equal(plan.valid, true);
  assert.equal(plan.percentageTotal, 100);
  assert.equal(plan.allocatedTotal, 900);
  assert.equal(plan.allocations.find(x=>x.squadCode==='D').percentage, 50);
  assert.equal(plan.allocations.find(x=>x.squadCode==='A').percentage, 33.3333);
});

test('rateio por atendimentos usa produção da competência', () => {
  const plan = costEngine.buildOperationalAllocationPlan({amount:800,method:'attendance',squadCodes:squads,attendanceBySquad:{A:100,B:100,D:400,E:200}});
  assert.equal(plan.valid, true);
  assert.equal(plan.allocations.find(x=>x.squadCode==='D').percentage, 50);
  assert.equal(plan.allocations.find(x=>x.squadCode==='E').percentage, 25);
});

test('rateio manual rejeita total diferente de 100%', () => {
  const invalid = costEngine.buildOperationalAllocationPlan({amount:1000,method:'manual',squadCodes:squads,manualPercentages:{A:20,B:20,D:20,E:20}});
  assert.equal(invalid.valid, false);
  assert.match(invalid.error, /100%/);
  const valid = costEngine.buildOperationalAllocationPlan({amount:1000,method:'manual',squadCodes:squads,manualPercentages:{A:20,B:30,D:30,E:20}});
  assert.equal(valid.valid, true);
  assert.equal(valid.percentageTotal,100);
});

test('consolidado operacional respeita Squad e Todos é a soma dos rateios', () => {
  const costs = [
    {id:'c1',amount:1000,category:'technology',allocationMethod:'manual'},
    {id:'c2',amount:500,category:'communication',allocationMethod:'direct'}
  ];
  const allocations = [
    {operationalCostId:'c1',squadCode:'A',percentage:40},
    {operationalCostId:'c1',squadCode:'D',percentage:60},
    {operationalCostId:'c2',squadCode:'D',percentage:100}
  ];
  const all = costEngine.summarizeOperationalCosts(costs,allocations,{squadCode:'all'});
  const a = costEngine.summarizeOperationalCosts(costs,allocations,{squadCode:'A'});
  const d = costEngine.summarizeOperationalCosts(costs,allocations,{squadCode:'D'});
  assert.equal(all.operationalCost,1500);
  assert.equal(a.operationalCost,400);
  assert.equal(d.operationalCost,1100);
  assert.equal(all.operationalCost,a.operationalCost+d.operationalCost);
  assert.equal(d.directCost,500);
  assert.equal(d.sharedCost,600);
});

test('resumo financeiro soma pessoas e operação sem misturar os motores', () => {
  const result = costEngine.mergeFinancialSummary({totalCost:10000,fte:2,peopleCount:2},{operationalCost:2500,directCost:500,sharedCost:2000,costCount:3},{competence:'2026-10',squadCode:'all'});
  assert.equal(result.peopleCost,10000);
  assert.equal(result.operationalCost,2500);
  assert.equal(result.totalCost,12500);
  assert.equal(result.fte,2);
});

test('normalização preserva método, categoria e fotografia do rateio', () => {
  const cost = dataEngine.normalizeOperationalCostRow({id:'c',description:'Chat',category:'communication',amount:600,allocation_method:'attendance',recurring:true});
  const allocation = dataEngine.normalizeCostAllocationRow({operational_cost_id:'c',squad_code:'d',percentage:42.5,basis_value:850,basis_total:2000});
  assert.equal(cost.category,'communication');
  assert.equal(cost.allocationMethod,'attendance');
  assert.equal(cost.recurring,true);
  assert.equal(allocation.squadCode,'D');
  assert.equal(allocation.percentage,42.5);
  assert.equal(allocation.basisValue,850);
});

test('controller combina resumo operacional agregado com custos de pessoas', () => {
  const controller = strategyEngine.createController({access:{can_view_strategy:true,can_view_aggregates:true}});
  controller.initializeContext({squads:{D:{code:'D',months:{'2026-10':{}}}}});
  controller.setFinancialData({
    competences:[{id:'x',competence:'2026-10-01',status:'draft'}],
    summary:{competence:'2026-10',people_count:2,fte:2,total_cost:10000},
    operationalSummary:{competence:'2026-10',cost_count:2,operational_cost:3000,direct_cost:1000,shared_cost:2000,categories:{technology:2000,communication:1000}}
  });
  const vm=controller.viewModel();
  assert.equal(vm.summary.peopleCost,10000);
  assert.equal(vm.summary.operationalCost,3000);
  assert.equal(vm.summary.totalCost,13000);
  assert.equal(vm.summary.operationalCategories.technology,2000);
});

test('migration protege detalhes e expõe somente consolidados para acesso agregado', () => {
  assert.match(migration,/create table if not exists public\.strategy_operational_costs/i);
  assert.match(migration,/create table if not exists public\.strategy_cost_allocations/i);
  assert.match(migration,/has_strategy_access\('edit_costs'\)/i);
  assert.match(migration,/create or replace function public\.get_strategy_operational_cost_summary/i);
  assert.match(migration,/create or replace function public\.get_strategy_allocation_basis/i);
  assert.match(migration,/create or replace function public\.save_strategy_operational_cost/i);
  assert.match(migration,/allocation percentage must total 100/i);
  assert.match(schema,/create table if not exists public\.strategy_operational_costs/i);
  assert.match(schema,/get_strategy_operational_cost_summary/i);
});
