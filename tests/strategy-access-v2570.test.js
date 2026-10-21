const test = require('node:test');
const assert = require('node:assert/strict');
const access = require('../js/strategy-access.js');

test('acesso estratégico normaliza campos do banco sem ampliar permissões', () => {
  const normalized = access.normalizeAccess({
    can_view_strategy:true,
    can_view_aggregates:true,
    can_view_people_costs:false,
    can_edit_costs:false,
    can_close_competence:false,
    can_manage_access:true
  }, {source:'supabase'});
  assert.equal(normalized.canViewStrategy, true);
  assert.equal(normalized.canViewAggregates, true);
  assert.equal(normalized.canViewPeopleCosts, false);
  assert.equal(normalized.canEditCosts, false);
  assert.equal(normalized.canCloseCompetence, false);
  assert.equal(normalized.canManageAccess, true);
  assert.equal(normalized.source, 'supabase');
});

test('perfil técnico não recebe acesso estratégico implicitamente', () => {
  const technician = access.demoAccessForRole('technician');
  assert.equal(access.canView(technician), false);
  assert.equal(access.canViewAggregates(technician), false);
});

test('super_admin demo recebe somente acesso mínimo da fundação', () => {
  const admin = access.demoAccessForRole('super_admin');
  assert.equal(admin.canViewStrategy, true);
  assert.equal(admin.canViewAggregates, true);
  assert.equal(admin.canManageAccess, true);
  assert.equal(admin.canViewPeopleCosts, false);
  assert.equal(admin.canEditCosts, false);
  assert.equal(admin.canCloseCompetence, false);
});

test('migração pendente é explicitamente sinalizada', () => {
  const status = access.accessStatus(access.normalizeAccess({}, {source:'supabase', remoteAvailable:false}));
  assert.deepEqual(status, {tone:'warning', label:'Migração pendente'});
});
