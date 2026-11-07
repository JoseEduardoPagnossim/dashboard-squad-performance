const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
test('R19: no undefined loader reference in commercial reversal or leader sync', () => {
  assert.doesNotMatch(code, /loadSuperAdminCommissions\s*\(/);
  assert.match(code, /await ensureSuperAdminCommissions\(true\)/);
});
test('R19: server rejection and frontend refresh have separate error messages', () => {
  assert.match(code, /Estorno recusado pelo banco:/);
  assert.match(code, /Estorno realizado no banco, mas não foi possível atualizar a tela/);
});
