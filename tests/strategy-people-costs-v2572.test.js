const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, existsSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const pkg = require(join(root, 'package.json'));
const costEngine = require(join(root, 'js', 'strategy-cost-engine.js'));
const dataEngine = require(join(root, 'js', 'strategy-data.js'));
const accessEngine = require(join(root, 'js', 'strategy-access.js'));
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const migrationPath = join(root, 'supabase', 'migrations', 'MIGRACAO_V2.57.2.sql');
const migration = readFileSync(migrationPath, 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');

test('V2.57.6 publica competências, pessoas e custos pessoais', () => {
  assert.equal(pkg.version, '2.57.6');
  assert.equal(existsSync(migrationPath), true);
  assert.match(index, /id="strategyNewCompetenceInput"/);
  assert.match(index, /id="strategyPeopleRows"/);
  assert.match(index, /id="strategySavePeopleCostsBtn"/);
  assert.match(app, /strategy_competences/);
  assert.match(app, /strategy_people/);
  assert.match(app, /strategy_employee_costs/);
});

test('motor pessoal soma componentes e aplica FTE somente no custo atribuído', () => {
  const full = costEngine.calculatePersonCost({fte:1,salary:3000,employerCharges:1800,benefits:600,variablePay:200,overtime:100,otherCosts:50});
  assert.equal(full.grossCost, 5750);
  assert.equal(full.totalCost, 5750);
  const half = costEngine.calculatePersonCost({fte:.5,salary:3000,employerCharges:1800,benefits:600,variablePay:200,overtime:100,otherCosts:50});
  assert.equal(half.grossCost, 5750);
  assert.equal(half.totalCost, 2875);
});

test('resumo por Squad mantém Todos como soma e não média dos Squads', () => {
  const rows = [
    {personId:'a',squadCode:'A',fte:1,salary:3000,employerCharges:1500},
    {personId:'d',squadCode:'D',fte:.5,salary:4000,employerCharges:2000}
  ];
  const all = costEngine.summarizePeopleCosts(rows,{squadCode:'all'});
  const a = costEngine.summarizePeopleCosts(rows,{squadCode:'A'});
  const d = costEngine.summarizePeopleCosts(rows,{squadCode:'D'});
  assert.equal(all.totalCost, a.totalCost + d.totalCost);
  assert.equal(all.totalCost, 7500);
  assert.equal(all.peopleCount, 2);
  assert.equal(all.fte, 1.5);
});

test('normalização preserva fotografia mensal sem alterar cadastro operacional', () => {
  const person = dataEngine.normalizePersonRow({id:'p1',name:'Pessoa',default_squad_code:'d',default_fte:.75});
  const cost = dataEngine.normalizeEmployeeCostRow({person_id:'p1',squad_code_snapshot:'a',fte:.5,salary:1000,employer_charges:500});
  assert.equal(person.squadCode, 'D');
  assert.equal(person.defaultFte, .75);
  assert.equal(cost.squadCode, 'A');
  assert.equal(cost.totalCost, 750);
});

test('acesso básico não equivale a acesso de salários ou edição', () => {
  const basic = accessEngine.normalizeAccess({can_view_strategy:true,can_view_aggregates:true});
  assert.equal(accessEngine.canViewAggregates(basic), true);
  assert.equal(accessEngine.canViewPeopleCosts(basic), false);
  assert.equal(accessEngine.canEditCosts(basic), false);
  const editor = accessEngine.normalizeAccess({can_view_strategy:true,can_view_aggregates:true,can_view_people_costs:true,can_edit_costs:true});
  assert.equal(accessEngine.canViewPeopleCosts(editor), true);
  assert.equal(accessEngine.canEditCosts(editor), true);
});

test('migration isola custos pessoais com RLS e RPC agregada sem SELECT individual', () => {
  assert.match(migration, /create table if not exists public\.strategy_competences/i);
  assert.match(migration, /create table if not exists public\.strategy_people/i);
  assert.match(migration, /create table if not exists public\.strategy_employee_costs/i);
  assert.match(migration, /generated always as/i);
  assert.match(migration, /has_strategy_access\('people_costs'\)/i);
  assert.match(migration, /has_strategy_access\('edit_costs'\)/i);
  assert.match(migration, /create or replace function public\.get_strategy_people_cost_summary/i);
  assert.match(migration, /has_strategy_access\('aggregates'\)/i);
  assert.match(schema, /create table if not exists public\.strategy_employee_costs/i);
});

test('frontend agregado usa RPC e só consulta detalhes quando há acesso pessoal', () => {
  assert.match(app, /rpc\('get_strategy_financial_summary'/);
  assert.match(app, /if\(strategyPeopleAccess\(\)\)/);
  assert.match(app, /from\('strategy_employee_costs'\)/);
  assert.match(index, /Acesso à Gestão Estratégica/i);
});
