const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const financeRules = readFileSync(join(root, 'js', 'finance-rules.js'), 'utf8');
const styles = readFileSync(join(root, 'css', 'styles.css'), 'utf8');

test('V2.48.9 remove identificadores técnicos da interface financeira', () => {
  assert.equal(index.includes('id="financeRuleVersion"'), false);
  assert.equal(index.includes('id="financeRuleFingerprint"'), false);
  assert.equal(index.includes('id="configFinanceRuleVersion"'), false);
  assert.equal(index.includes('id="configFinanceRuleFingerprint"'), false);
  assert.equal(index.includes('finance-version-badge'), false);
  assert.equal(index.includes('finance-rule-governance'), false);
  assert.equal(styles.includes('.finance-version-badge'), false);
  assert.equal(styles.includes('.finance-rule-governance'), false);
  assert.equal(/regra \$\{financeRuleVersionForMonth\(m\)\}/.test(app), false);
});

test('V2.48.9 mantém rastreabilidade interna e não altera a regra financeira', () => {
  assert.ok(app.includes('financeRuleVersionForMonth'));
  assert.ok(app.includes('financeRuleFingerprintForMonth'));
  assert.ok(app.includes('financeRuleVersion:financeRuleVersionForMonth(m)'));
  assert.ok(financeRules.includes("FINANCE_RULE_VERSION = 'FR-2.48.8-1'"));
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.48.9.sql')), false);
});
