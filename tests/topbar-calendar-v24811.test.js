const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const finance = readFileSync(join(root, 'js', 'finance-rules.js'), 'utf8');

test('V2.48.11 remove popup nativo dos quatro filtros de periodo', () => {
  for (const id of ['analysisStartDatePicker','analysisEndDatePicker','indicatorStartDatePicker','indicatorEndDatePicker']) {
    assert.match(index, new RegExp(`id="${id}" class="date-picker-state" type="hidden"`));
  }
  assert.doesNotMatch(app, /openNativeDatePicker/);
  assert.doesNotMatch(app, /showPicker/);
});

test('V2.48.11 calendario proprio preserva o fluxo de filtro existente', () => {
  assert.match(app, /function openAnalysisCalendar\(/);
  assert.match(app, /function renderAnalysisCalendar\(/);
  assert.match(app, /handleAnalysisDateInput\(analysisCalendarUi\.which,value\)/);
  assert.match(app, /importedDateBounds\(\)/);
  assert.match(css, /\.ds-calendar-popover\{/);
  assert.match(css, /\.ds-calendar-day\.selected/);
});

test('V2.48.11 topbar libera a largura do valor sem trocar os selects', () => {
  assert.match(css, /\.topbar \.top-actions>\.select-wrap\{[\s\S]*grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(css, /--top-month-w:162px/);
  assert.match(css, /--top-tech-w:224px/);
  assert.match(css, /--top-quick-w:244px/);
  assert.match(index, /<select id="squadSelect"><\/select>/);
  assert.match(index, /<select id="monthSelect"><\/select>/);
  assert.match(index, /<select id="techSelect"><\/select>/);
});

test('V2.48.11 e somente frontend e nao altera regra financeira', () => {
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.48.11.sql')), false);
  assert.match(finance, /FINANCE_RULE_VERSION = 'FR-2\.48\.8-1'/);
  assert.match(app, /APP_VERSION = '2\.49\.1'/);
  assert.ok(index.includes('V2.49.1'));
});
