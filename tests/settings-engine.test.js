const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../js/settings-engine.js');

test('V2.43.2 trabalha com Administrador e Tecnico como perfis ativos', () => {
  const adminPerms = engine.defaultPermissions('super_admin');
  const techPerms = engine.defaultPermissions('technician');
  assert.equal(adminPerms['permissions.manage'], true);
  assert.equal(adminPerms['finance.manage'], true);
  assert.equal(adminPerms['indicators.view'], true);
  assert.equal(techPerms['finance.manage'], false);
  assert.equal(techPerms['dashboard.customize'], true);
  assert.equal(engine.normalizeRole('squad_admin'), 'super_admin', 'papel legado deve ser normalizado como Administrador');
});

test('Administrador sempre tem acesso completo e overrides so restringem Tecnicos', () => {
  const admin = engine.effectivePermissions('super_admin', {'finance.manage': false, 'users.manage': false});
  assert.equal(admin['finance.manage'], true, 'Administrador nao pode ser restringido por override');
  assert.equal(admin['users.manage'], true, 'Administrador deve manter acesso completo');
  const legacy = engine.effectivePermissions('squad_admin', {'indicators.view': false});
  assert.equal(legacy['indicators.view'], true, 'papel legado deve receber o mesmo acesso do Administrador');
  const tech = engine.effectivePermissions('technician', {'users.manage': true, 'presentation.view': false});
  assert.equal(tech['users.manage'], false, 'Tecnico nao pode receber gestao de usuarios acima do papel base');
  assert.equal(tech['presentation.view'], false, 'Tecnico pode ter um recurso originalmente permitido restringido');
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
