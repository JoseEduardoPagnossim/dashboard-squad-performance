const test = require('node:test');
const assert = require('node:assert/strict');

const audit = require('../js/audit-utils.js');

test('confirmação crítica aceita caixa e espaços diferentes', () => {
  assert.equal(audit.confirmationMatches('  reabrir  ', 'REABRIR'), true);
  assert.equal(audit.confirmationMatches('excluir', 'EXCLUIR'), true);
});

test('confirmação crítica rejeita texto diferente', () => {
  assert.equal(audit.confirmationMatches('REABRI', 'REABRIR'), false);
  assert.equal(audit.confirmationMatches('', 'EXCLUIR'), false);
});

test('sanitização de auditoria remove dados sensíveis sem apagar dados úteis', () => {
  const sanitized = audit.sanitizeAuditValue({
    amount: 350,
    name: 'Regra financeira',
    password: 'segredo',
    access_token: 'token-secreto',
    nested: { service_role: 'nao-logar', enabled: true }
  });

  assert.deepEqual(sanitized, {
    amount: 350,
    name: 'Regra financeira',
    password: '[removido]',
    access_token: '[removido]',
    nested: { service_role: '[removido]', enabled: true }
  });
});

test('sanitização limita profundidade e tamanho de arrays', () => {
  const list = Array.from({ length: 120 }, (_, i) => i);
  const sanitized = audit.sanitizeAuditValue({ list });
  assert.equal(sanitized.list.length, 100);
});

test('ações de auditoria são categorizadas e rotuladas', () => {
  assert.equal(audit.actionCategory('finance.config_update'), 'finance');
  assert.equal(audit.actionCategory('month.reopen'), 'month');
  assert.equal(audit.actionCategory('roi.settings_update'), 'roi');
  assert.equal(audit.actionCategory('unknown.action'), 'other');
  assert.equal(audit.actionLabel('month.reopen'), 'Competência reaberta');
  assert.equal(audit.actionLabel('roi.opportunity_create'), 'Oportunidade de ROI criada');
});
