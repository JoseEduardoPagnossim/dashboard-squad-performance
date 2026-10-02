const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const engine = readFileSync(join(root, 'js', 'chart-engine.js'), 'utf8');

test('chart-engine carrega antes do app principal', () => {
  const enginePos = index.indexOf('js/chart-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(enginePos >= 0, 'chart-engine.js deve estar no index.html');
  assert.ok(appPos > enginePos, 'chart-engine.js deve carregar antes de app.js');
});

test('app principal depende explicitamente do motor de gráficos', () => {
  assert.match(app, /window\.SoftenChartEngine/);
  assert.match(app, /chartEngineLineVisual/);
  assert.match(app, /chartEnginePercentScale/);
});

test('primitivas duplicadas de gráfico não permanecem no app principal', () => {
  for (const name of ['smoothSvgPath', 'smoothAreaPath', 'splitChartPointSegments', 'chartDataLabelSvg', 'chartValueText']) {
    assert.equal(app.includes(`function ${name}(`), false, `${name} deve residir no chart-engine.js`);
  }
});

test('motor exporta as primitivas centrais esperadas', () => {
  for (const marker of ['normalizePreferences', 'labelVisible', 'percentScale', 'lineVisual', 'applyCssVariables', 'smoothSvgPath', 'dataLabelSvg']) {
    assert.ok(engine.includes(marker), `chart-engine.js deve conter ${marker}`);
  }
});
