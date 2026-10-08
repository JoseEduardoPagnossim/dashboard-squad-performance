const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const styles = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const advanced = readFileSync(join(root, 'js', 'finance-advanced.js'), 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');

 test('V2.48.8 persiste a isenção manual por técnico e competência', () => {
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.48.8.sql')), true);
  assert.match(schema, /waive_below_discount boolean not null default false/);
  assert.match(app, /waive_below_discount:!!t\.waiveBelowDiscount/);
  assert.match(app, /waiveBelowDiscount:!!firstRelation\(t\.technician_finance_monthly\)\.waive_below_discount/);
  assert.match(app, /\['vacation','waiveBelowDiscount','excludeFromGroupCount'\]/);
});

 test('férias e exceção manual não alimentam o pool de desconto ABAIXO', () => {
  assert.match(app, /discountEligible:!t\.excludeFromGroupCount&&!t\.vacation&&!t\.waiveBelowDiscount/);
  assert.match(app, /discount=discountEligible&&financeStatus==='ABAIXO'/);
  assert.match(app, /redistributionEligible=financialAdjustmentEligible/);
  assert.match(app, /discountWaiverReason=.*t\.vacation\?'vacation':t\.waiveBelowDiscount\?'manual'/);
});

 test('memória e fechamento preservam a nova exceção', () => {
  assert.match(advanced, /waiveBelowDiscount: !!t\.waiveBelowDiscount/);
  assert.match(app, /closedSnapshot=\{version:11/);
  assert.match(app, /waiveBelowDiscount:!!t\.waiveBelowDiscount/);
  assert.match(app, /t\.waiveBelowDiscount=!!s\.waiveBelowDiscount/);
});

 test('lista financeira usa grade compacta restrita ao módulo e sem tocar na sidebar', () => {
  assert.match(app, /finance-tech-table-head/);
  assert.match(app, /finance-tech-row-summary/);
  assert.match(app, /finance-tech-inputs-compact/);
  assert.match(styles, /V2\.48\.8 - BONIFICACAO COMPACTA/);
  assert.match(styles, /\.admin-finance #financeTechnicianRows\.finance-tech-list/);
  assert.match(styles, /\.admin-finance \.finance-tech-row-summary/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*?\.admin-finance \.finance-tech-row-summary/);
  const start = styles.indexOf('V2.48.8 - BONIFICACAO COMPACTA');
  const end = styles.indexOf('V2.48.10 - BONIFICACAO ORIENTADA AO FECHAMENTO', start);
  const v2488Block = styles.slice(start, end > start ? end : undefined);
  assert.equal(/\.sidebar\s*\{/.test(v2488Block), false, 'a correção V2.48.8 não deve sobrescrever a sidebar');
  assert.equal(/\.topbar\s*\{/.test(v2488Block), false, 'a correção V2.48.8 não deve sobrescrever a topbar');
});
