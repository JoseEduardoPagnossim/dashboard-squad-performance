const test = require('node:test');
const assert = require('node:assert/strict');
const strategy = require('../js/strategy.js');
const data = require('../js/strategy-data.js');

function operationalFixture(){
  return {
    A:{code:'A', name:'Squad A', months:{'2026-09':{total:100}, '2026-10':{total:120}}},
    D:{code:'D', name:'Squad D', months:{'2026-10':{total:150}}}
  };
}

test('adaptador estratégico lê contexto operacional sem expor os objetos de origem', () => {
  const source = operationalFixture();
  const context = data.buildOperationalContext({squads:source});
  assert.deepEqual(context.competences, ['2026-09','2026-10']);
  assert.equal(context.latestCompetence, '2026-10');
  assert.deepEqual(context.squads.map(row=>row.code), ['A','D']);
  context.squads[0].competences.includes('2026-09');
  assert.equal(source.A.strategyField, undefined);
});

test('controller mantém filtros estratégicos em estado próprio', () => {
  const operational = operationalFixture();
  const original = JSON.stringify(operational);
  const controller = strategy.createController({section:'costs', squadCode:'D', competence:'2026-10'});
  controller.initializeContext({squads:operational});
  controller.setSquadCode('A');
  controller.setCompetence('2026-09');
  controller.setComparison('6m');
  controller.setSection('assumptions');
  const state = controller.getState();
  assert.equal(state.squadCode, 'A');
  assert.equal(state.competence, '2026-09');
  assert.equal(state.comparison, '6m');
  assert.equal(state.section, 'assumptions');
  assert.equal(JSON.stringify(operational), original, 'fonte operacional não pode ser alterada');
});

test('controller rejeita Squad, competência e seção fora do contexto', () => {
  const controller = strategy.createController();
  controller.initializeContext({squads:operationalFixture()});
  controller.setSquadCode('Z');
  controller.setCompetence('2025-01');
  controller.setSection('finance');
  const state = controller.getState();
  assert.equal(state.squadCode, 'all');
  assert.equal(state.competence, '2026-10');
  assert.equal(state.section, 'executive');
});

test('V2.57.5 mantém custos estratégicos separados e aceita contexto financeiro próprio', () => {
  const controller = strategy.createController({access:{canViewStrategy:true,canViewAggregates:true,canViewPeopleCosts:true}});
  controller.initializeContext({squads:operationalFixture()});
  controller.setFinancialData({
    competences:[{id:'c1',competence:'2026-10-01',status:'draft'}],
    people:[{id:'p1',name:'Pessoa A',default_squad_code:'D',default_fte:1}],
    costs:[{person_id:'p1',competence_id:'c1',squad_code_snapshot:'D',fte:1,salary:3000,employer_charges:1800,benefits:600,variable_pay:100,overtime:0,other_costs:0}],
    summary:{}
  });
  const vm = controller.viewModel();
  assert.equal(vm.summary.peopleCost, 5500);
  assert.equal(vm.summary.totalCost, 5500);
  assert.equal(vm.summary.operationalCost, 0);
  assert.equal(vm.competenceRecord.competence, '2026-10');
  assert.ok(vm.insights.some(item=>item.code==='STRATEGY_FINANCIAL_ENGINE_READY'));
});
