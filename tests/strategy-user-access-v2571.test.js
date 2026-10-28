const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const root = join(__dirname, '..');
const pkg = require(join(root, 'package.json'));
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const access = readFileSync(join(root, 'js', 'strategy-access.js'), 'utf8');
const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.57.1.sql'), 'utf8');
const migration2574 = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.57.4.sql'), 'utf8');

test('V2.57.1 adiciona checkbox de Gestão Estratégica no Controle de Usuários', () => {
  assert.equal(pkg.version, '2.62.9');
  assert.match(index, /<th>Gestão Estratégica<\/th>/);
  assert.match(app, /data-strategy-user-access/);
  assert.match(app, /setDirectoryStrategyAccess/);
});

test('acesso estratégico fica opt-in inclusive para super_admin', () => {
  assert.match(access, /function demoAccessForRole\(role,enabled=false\)/);
  assert.doesNotMatch(access, /canManageAccess:true/);
  assert.match(app, /demoAccessForRole\(state\.user\.role,state\.user\.strategyAccess===true\)/);
});

test('somente Super Admin consegue persistir o checkbox', () => {
  assert.match(app, /if\(!u\|\|!isSuperAdmin\(\)\)/);
  assert.match(migration, /public\.is_super_admin\(\)/);
  assert.doesNotMatch(migration, /has_strategy_access\('manage_access'\)/);
});

test('marcar libera o MVP estratégico atual e mantém fechamento separado', () => {
  assert.match(app, /can_view_strategy:enabled===true/);
  assert.match(app, /can_view_aggregates:enabled===true/);
  assert.match(app, /can_view_people_costs:enabled===true/);
  assert.match(app, /can_edit_costs:enabled===true/);
  assert.match(app, /can_close_competence:enabled===true&&strategyAccessEngine\.canCloseCompetence/);
  assert.match(app, /data-strategy-close-access/);
  assert.match(app, /can_manage_access:false/);
  assert.match(migration2574, /where can_view_strategy = true/i);
});

test('migração V2.57.1 revoga apenas o bootstrap automático da fundação', () => {
  assert.match(migration, /can_view_strategy = false/);
  assert.match(migration, /can_manage_access = true/);
  assert.match(migration, /p\.role = 'super_admin'/);
});
