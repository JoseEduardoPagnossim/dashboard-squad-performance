const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const styles = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const rules = readFileSync(join(root, 'js', 'finance-rules.js'), 'utf8');

test('V2.48.10 remove os tres cards-legado de redirecionamento', () => {
  assert.equal(index.includes('module-config-pointer'), false);
  assert.equal(index.includes('presentation-config-pointer'), false);
  assert.equal(index.includes('data-open-settings-module='), false);
  assert.ok(index.includes('data-settings-module-filter="operation"'));
  assert.ok(index.includes('data-settings-module-filter="finance"'));
  assert.ok(index.includes('data-settings-module-filter="presentation"'));
  assert.equal(styles.includes('.module-config-pointer'), false);
  assert.equal(styles.includes('.presentation-config-pointer'), false);
});

test('V2.48.10 prioriza fechamento financeiro e mantem secundarios no final', () => {
  const closing = index.indexOf('id="financeClosingCard"');
  const memory = index.indexOf('id="financeMemoryCard"');
  const simulator = index.indexOf('id="financeSimulatorCard"');
  assert.ok(closing >= 0 && memory > closing && simulator > memory);
  assert.match(index, /<details[^>]+id="financeMemoryCard"/);
  assert.match(index, /<details[^>]+id="financeSimulatorCard"/);
  assert.equal(/<details[^>]+id="financeMemoryCard"[^>]*\sopen(?:\s|>)/.test(index), false);
  assert.equal(/<details[^>]+id="financeSimulatorCard"[^>]*\sopen(?:\s|>)/.test(index), false);
});

test('V2.48.10 KPIs usam o mesmo consolidado financeiro do motor', () => {
  for (const id of ['financeClosingKpis','financeClosingContext','financeTechnicianRows']) assert.ok(index.includes(`id="${id}"`));
  assert.match(app, /comparison:c/);
  assert.match(app, /c\.groupAvgPerDay/);
  assert.match(app, /c\.groupNotes5Pct/);
  assert.match(app, /c\.groupCommissionAtt/);
  assert.match(app, /c\.groupCommissionNotes5/);
  assert.match(app, /c\.cancelRate\?\?rate/);
  assert.match(app, /c\.cancelMultiplier\?\?mult/);
  assert.match(app, /m\.financeMonthData/);
});

test('V2.48.10 limita o novo layout ao modulo financeiro e nao muda a regra', () => {
  assert.ok(styles.includes('.admin-finance .finance-closing-kpis'));
  assert.ok(styles.includes('.admin-finance.finance-secondary-panel'));
  assert.ok(rules.includes("FINANCE_RULE_VERSION = 'FR-2.48.8-1'"));
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.48.10.sql')), false);
});
