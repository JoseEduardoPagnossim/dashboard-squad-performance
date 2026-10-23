const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync, existsSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const pkg = require(join(root, 'package.json'));
const navigation = require(join(root, 'js', 'navigation-engine.js'));
const workspace = require(join(root, 'js', 'workspace-engine.js'));
const filters = require(join(root, 'js', 'filter-system.js'));
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const migrationPath = join(root, 'supabase', 'migrations', 'MIGRACAO_V2.57.0.sql');
const migration = readFileSync(migrationPath, 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');

test('V2.57.7 publica a fundação isolada da Gestão Estratégica', () => {
  assert.equal(pkg.version, '2.59.2');
  assert.match(index, /id="view-strategy"/);
  assert.match(index, /data-view="strategy"/);
  assert.match(index, /data-strategy-section="executive"/);
  assert.match(index, /data-strategy-section="costs"/);
  assert.match(index, /data-strategy-section="assumptions"/);
  assert.match(index, /css\/strategy\.css\?v=2\.59\.2/);
  assert.match(index, /js\/strategy-access\.js\?v=2\.59\.2/);
  assert.match(index, /js\/strategy-data\.js\?v=2\.59\.2/);
  assert.match(index, /js\/strategy-cost-engine\.js\?v=2\.59\.2/);
  assert.match(index, /js\/strategy-insights\.js\?v=2\.59\.2/);
  assert.match(index, /js\/strategy\.js\?v=2\.59\.2/);
  assert.ok(index.indexOf('js/strategy.js?v=2.59.2') < index.indexOf('js/app.js?v=2.59.2'));
  assert.match(app, /APP_VERSION = '2\.59\.2'/);
});

test('rota estratégica descarta filtros operacionais da URL', () => {
  const route = navigation.routeFromSearch('?page=strategy&section=costs&squad=E&month=2026-10&tech=Arthur&from=2026-10-01&to=2026-10-21');
  assert.deepEqual(route, {page:'strategy', section:'costs'});
  const url = navigation.routeUrl('https://example.test/app?squad=A&month=2026-09', route);
  assert.equal(url.searchParams.get('page'), 'strategy');
  assert.equal(url.searchParams.get('section'), 'costs');
  assert.equal(url.searchParams.has('squad'), false);
  assert.equal(url.searchParams.has('month'), false);
});

test('workspace estratégico não herda memória de filtros operacionais', () => {
  const base = workspace.copyRoute({page:'strategy', section:'executive', squad:'D', month:'2026-10', from:'2026-10-01', to:'2026-10-21'});
  assert.deepEqual(base, {page:'strategy', section:'executive'});
  const merged = workspace.mergeRememberedFilters(
    base,
    {'strategy:executive':{month:'2026-09', tech:'Arthur'}},
    true,
    {page:'indicators', squad:'E', from:'2026-10-01', to:'2026-10-21'}
  );
  assert.deepEqual(merged, {page:'strategy', section:'executive'});
  assert.equal(workspace.routeContextKey(base), 'strategy:executive');
});

test('filtros globais operacionais ficam ocultos na Gestão Estratégica', () => {
  const visible = filters.visibility({view:'strategy', isSuperAdmin:true, isTechnician:false, squadCode:'all'});
  assert.deepEqual(visible, {squad:false, competence:false, period:false, technician:false});
  assert.equal(filters.activeCount({view:'strategy', isSuperAdmin:true}), 0);
});

test('a fundação V2.57.0 cria somente a camada de acesso estratégico no banco', () => {
  assert.equal(existsSync(migrationPath), true);
  assert.match(migration, /create table if not exists public\.strategy_access/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /can_view_strategy boolean/i);
  assert.match(migration, /can_view_people_costs boolean/i);
  assert.match(migration, /can_edit_costs boolean/i);
  assert.match(migration, /can_close_competence boolean/i);
  assert.match(migration, /can_manage_access boolean/i);
  assert.match(migration, /can_view_people_costs,\s*can_edit_costs,\s*can_close_competence/i);
  assert.match(schema, /create table if not exists public\.strategy_access/i);
  assert.doesNotMatch(migration, /strategy_employee_costs/i);
  assert.doesNotMatch(migration, /strategy_operational_costs/i);
});
