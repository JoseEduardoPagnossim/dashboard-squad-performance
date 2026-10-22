const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const access = require('../js/strategy-access.js');
const data = require('../js/strategy-data.js');
const cost = require('../js/strategy-cost-engine.js');
const strategy = require('../js/strategy.js');

test('V2.57.9: campo DB explícito false prevalece sobre camelCase stale true', () => {
  const normalized = access.normalizeAccess({ canViewStrategy: true, can_view_strategy: false });
  assert.equal(normalized.canViewStrategy, false);
  assert.equal(access.normalizeAccess({ canViewStrategy: true }).canViewStrategy, true);
});

test('V2.57.9: alteração/revogação de acesso apaga dados financeiros carregados', () => {
  const controller = strategy.createController();
  controller.initializeContext({ squads: { D: { code: 'D', name: 'Squad D', months: { '2026-10': {} } } } });
  controller.setAccess({ canViewStrategy: true, canViewAggregates: true, canViewPeopleCosts: true, canEditCosts: true });
  controller.setFinancialData({
    competences: [{ id: 'c1', competence: '2026-10-01', status: 'draft' }],
    summary: { competence: '2026-10', people_cost: 900, operational_cost: 100, total_cost: 1000 },
    history: [{ competence: '2026-10', total_cost: 1000, attendance: 100 }]
  });
  assert.equal(controller.getState().financialLoaded, true);
  assert.equal(controller.getFinancialData().summary.totalCost, 1000);
  controller.setAccess({ canViewStrategy: true, canViewAggregates: false, canViewPeopleCosts: false, canEditCosts: false });
  assert.equal(controller.getState().financialLoaded, false);
  assert.equal(controller.getFinancialData().summary.totalCost, 0);
  assert.deepEqual(controller.getFinancialData().history, []);
});

test('V2.57.9: total_cost explícito negativo é normalizado para zero', () => {
  const row = data.normalizeEmployeeCostRow({ person_id: 'p1', fte: 1, salary: 100, total_cost: -50 });
  assert.equal(row.totalCost, 0);
});

test('V2.57.9: percentual de rateio fica limitado entre 0 e 1', () => {
  assert.equal(data.normalizeAllocationRow({ operational_cost_id: 'op1', percentage: 2 }).percentage, 1);
  assert.equal(data.normalizeAllocationRow({ operational_cost_id: 'op1', percentage: -2 }).percentage, 0);
});

test('V2.57.9: aliases de Squad são consolidados sem perder centavos', () => {
  const result = cost.allocateCents(10.01, { a: 1, A: 1, B: 2 });
  assert.deepEqual(Object.keys(result.allocations).sort(), ['A', 'B']);
  assert.equal(result.weights.A, 2);
  assert.equal(result.basis, 4);
  assert.equal(result.percentages.A, 0.5);
  assert.equal(Number(Object.values(result.allocations).reduce((sum, value) => sum + value, 0).toFixed(2)), 10.01);
});

test('V2.57.9: rateio operacional usa base normalizada e preserva o valor total', () => {
  const rows = cost.calculateOperationalAllocations(
    { amount: 10.01, scopeType: 'organization', allocationMethod: 'fte' },
    { fteBySquad: { a: 1, A: 1, B: 2 } }
  );
  const a = rows.find(row => row.squadCode === 'A');
  assert.equal(a.basisValue, 2);
  assert.equal(Number(rows.reduce((sum, row) => sum + row.allocatedAmount, 0).toFixed(2)), 10.01);
});

test('V2.57.9: versão do motor de custo identifica a regra corrigida', () => {
  assert.equal(cost.RULE_VERSION, 'SC-0.6.1');
});

test('V2.57.9: UI executiva aplica guarda agregada antes de calcular dados sensíveis', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  const start = app.indexOf('function renderStrategyExecutive(vm,displayAggregate)');
  const end = app.indexOf('async function loadStrategyFinanceData', start);
  assert.ok(start >= 0 && end > start);
  const block = app.slice(start, end);
  const guard = block.indexOf('if(!displayAggregate)');
  const analysis = block.indexOf('strategyExecutiveAnalysis(vm)');
  assert.ok(guard >= 0, 'guarda de permissão agregada ausente');
  assert.ok(analysis > guard, 'análise agregada ocorre antes da guarda de permissão');
  assert.match(app, /renderStrategySquadConsolidation\(vm,displayAggregate=false\)/);
  assert.match(app, /renderStrategySquadConsolidation\(vm,displayAggregate\)/);
});
