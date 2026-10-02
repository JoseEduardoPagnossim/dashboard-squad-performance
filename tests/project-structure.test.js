const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const engine = readFileSync(join(root, 'js', 'chart-engine.js'), 'utf8');
const predictiveEngine = readFileSync(join(root, 'js', 'predictive-engine.js'), 'utf8');

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


test('gráfico diário inicializa visual antes de usar linha e pontos', () => {
  const start = app.indexOf('function renderChart(');
  const end = app.indexOf('function renderDaily(', start);
  assert.ok(start >= 0 && end > start, 'renderChart deve existir');
  const renderChartBlock = app.slice(start, end);
  assert.match(renderChartBlock, /visual=chartEngineLineVisual\(prefs\)/);
  assert.ok(renderChartBlock.indexOf('visual=chartEngineLineVisual(prefs)') < renderChartBlock.indexOf('visual.pointRadius'), 'visual deve ser inicializado antes do primeiro uso');
});

test('import-engine carrega antes do app principal', () => {
  const enginePos = index.indexOf('js/import-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(enginePos >= 0, 'import-engine.js deve estar no index.html');
  assert.ok(appPos > enginePos, 'import-engine.js deve carregar antes de app.js');
});

test('central de importacao possui preview, historico e reversao', () => {
  for (const id of ['importPreviewBlock','importPreviewSummary','importValidationList','importComparisonRows','importHistoryRows','undoLastImportBtn']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(app, /window\.SoftenImportEngine/);
  assert.match(app, /captureImportSnapshot/);
  assert.match(app, /undoLastImport/);
});


test('predictive-engine carrega antes do app principal', () => {
  const enginePos = index.indexOf('js/predictive-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(enginePos >= 0, 'predictive-engine.js deve estar no index.html');
  assert.ok(appPos > enginePos, 'predictive-engine.js deve carregar antes de app.js');
});

test('gestao preditiva possui KPIs, alertas e comparativos', () => {
  for (const id of ['predictiveKpis','predictiveAlerts','predictiveSquadRows','predictiveRiskRows','predictiveConfidence']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(app, /window\.SoftenPredictiveEngine/);
  assert.match(app, /renderPredictiveManagement/);
  assert.match(app, /predictiveScopeData/);
  for (const marker of ['projectCount','countMetric','rateMetric','technicianRisk','buildAlerts']) assert.ok(predictiveEngine.includes(marker), `predictive-engine.js deve conter ${marker}`);
});
