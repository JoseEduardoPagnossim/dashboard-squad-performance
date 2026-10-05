const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../js/settings-engine.js');

test('perfis base respeitam limites de acesso', () => {
  const superPerms = engine.defaultPermissions('super_admin');
  const squadPerms = engine.defaultPermissions('squad_admin');
  const techPerms = engine.defaultPermissions('technician');
  assert.equal(superPerms['permissions.manage'], true);
  assert.equal(squadPerms['permissions.manage'], false);
  assert.equal(squadPerms['finance.manage'], true);
  assert.equal(techPerms['finance.manage'], false);
  assert.equal(techPerms['dashboard.customize'], true);
});

test('override granular apenas restringe e nunca eleva o perfil', () => {
  const squad = engine.effectivePermissions('squad_admin', {'finance.manage': false, 'indicators.view': true});
  assert.equal(squad['finance.manage'], false);
  assert.equal(squad['indicators.view'], false, 'squad_admin não pode ganhar indicadores executivos por override');
  const tech = engine.effectivePermissions('technician', {'users.manage': true});
  assert.equal(tech['users.manage'], false, 'técnico não pode receber gestão de usuários acima do papel base');
});

test('layout normaliza ordem, ocultos e densidade', () => {
  const layout = engine.normalizeLayout('individual', {order:['finance','hero','finance','inexistente'],hidden:['game','inexistente'],density:'compact'});
  assert.equal(layout.order[0], 'finance');
  assert.equal(layout.order[1], 'hero');
  assert.equal(new Set(layout.order).size, engine.LAYOUTS.individual.blocks.length);
  assert.deepEqual(layout.hidden, ['game']);
  assert.equal(layout.density, 'compact');
});

test('mover e ocultar blocos preserva um layout válido', () => {
  let layout = engine.normalizeLayout('team', {});
  const first = layout.order[0];
  layout = engine.moveBlock('team', layout, first, 'down');
  assert.equal(layout.order[1], first);
  layout = engine.toggleBlock('team', layout, first, false);
  assert.ok(layout.hidden.includes(first));
  layout = engine.toggleBlock('team', layout, first, true);
  assert.equal(layout.hidden.includes(first), false);
});

test('navegacao normaliza sidebar, grupos e submodulos sem perder compatibilidade', () => {
  const prefs = engine.normalizePreferences({version:1,layouts:{},navigation:{sidebarCollapsed:true,groups:{management:true},subgroups:{people:true}}});
  assert.equal(prefs.version, 2);
  assert.equal(prefs.navigation.sidebarCollapsed, true);
  assert.equal(prefs.navigation.groups.management, true);
  assert.equal(prefs.navigation.groups.performance, false);
  assert.equal(prefs.navigation.subgroups.people, true);
  assert.equal(prefs.navigation.subgroups.finance, false);
});

test('preferencias padrao deixam navegacao expandida', () => {
  const prefs = engine.defaultPreferences();
  assert.equal(prefs.navigation.sidebarCollapsed, false);
  assert.deepEqual(prefs.navigation.groups, {performance:false,management:false,account:false});
});
