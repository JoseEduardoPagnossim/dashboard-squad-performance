const test = require('node:test');
const assert = require('node:assert/strict');

const charts = require('../js/chart-engine.js');

test('preferências padrão são normalizadas de forma previsível', () => {
  assert.deepEqual(charts.normalizePreferences(), charts.DEFAULT_PREFERENCES);
});

test('preferências inválidas são limitadas aos intervalos seguros', () => {
  const cfg = charts.normalizePreferences({
    labelDensity: 'x', labelFontSize: 100, axisFontSize: 1, legendFontSize: 99,
    chartHeight: 900, cardPadding: 2, yScaleMode: 'manual', yMin: 95, yMax: 20,
    lineWidth: 99, pointRadius: 0
  });
  assert.equal(cfg.labelDensity, 'all');
  assert.equal(cfg.labelFontSize, 18);
  assert.equal(cfg.axisFontSize, 9);
  assert.equal(cfg.legendFontSize, 16);
  assert.equal(cfg.chartHeight, 520);
  assert.equal(cfg.cardPadding, 16);
  assert.equal(cfg.yScaleMode, 'manual');
  assert.equal(cfg.yMin, 95);
  assert.equal(cfg.yMax, 96);
  assert.equal(cfg.lineWidth, 6);
  assert.equal(cfg.pointRadius, 2);
});

test('densidade de rótulos respeita todos os modos', () => {
  assert.equal(charts.labelVisible(2, 8, { labelDensity: 'all' }), true);
  assert.equal(charts.labelVisible(3, 8, { labelDensity: 'alternate' }), false);
  assert.equal(charts.labelVisible(4, 8, { labelDensity: 'alternate' }), true);
  assert.equal(charts.labelVisible(4, 8, { labelDensity: 'every3' }), false);
  assert.equal(charts.labelVisible(3, 8, { labelDensity: 'every3' }), true);
  assert.equal(charts.labelVisible(4, 8, { labelDensity: 'extremes' }), false);
  assert.equal(charts.labelVisible(7, 8, { labelDensity: 'extremes' }), true);
  assert.equal(charts.labelVisible(0, 8, { labelDensity: 'none' }), false);
});

test('séries com até dois pontos continuam legíveis exceto quando rótulos estão ocultos', () => {
  assert.equal(charts.labelVisible(1, 2, { labelDensity: 'extremes' }), true);
  assert.equal(charts.labelVisible(1, 2, { labelDensity: 'none' }), false);
});

test('altura configurada preserva o delta em diferentes tipos de gráfico', () => {
  const prefs = { chartHeight: 420 };
  assert.equal(charts.configuredHeight(340, prefs), 420);
  assert.equal(charts.configuredHeight(320, prefs), 400);
  assert.equal(charts.configuredHeight(280, prefs), 360);
});

test('escala percentual automática arredonda para dezenas e respeita teto explícito', () => {
  assert.deepEqual(charts.percentScale(53, null, {}), { min: 0, max: 60 });
  assert.deepEqual(charts.percentScale(53, 100, {}), { min: 0, max: 100 });
});

test('escala percentual manual usa mínimo e máximo configurados', () => {
  assert.deepEqual(charts.percentScale(99, 100, { yScaleMode: 'manual', yMin: 20, yMax: 60 }), { min: 20, max: 60 });
});

test('estilo de linha e ponto deriva da mesma preferência central', () => {
  const normal = charts.lineVisual({ lineWidth: 4, pointRadius: 5 });
  assert.equal(normal.lineWidth, 4);
  assert.equal(normal.pointRadius, 5);
  const emphasis = charts.lineVisual({ lineWidth: 4, pointRadius: 5 }, { emphasis: true });
  assert.ok(emphasis.lineWidth > normal.lineWidth);
  assert.ok(emphasis.pointRadius > normal.pointRadius);
  const dashed = charts.lineVisual({ lineWidth: 4, pointRadius: 5 }, { dashed: true });
  assert.ok(dashed.lineWidth < normal.lineWidth);
});

test('variáveis CSS são geradas a partir de uma única configuração', () => {
  const received = new Map();
  const rootStyle = { setProperty: (key, value) => received.set(key, value) };
  charts.applyCssVariables(rootStyle, { chartHeight: 400, cardPadding: 28, labelFontSize: 12 });
  assert.equal(received.get('--chart-card-padding'), '28px');
  assert.equal(received.get('--chart-label-font-size'), '12px');
  assert.equal(received.get('--chart-height-base'), '400px');
  assert.equal(received.get('--chart-height-sm'), '310px');
});

test('segmentação interrompe linhas em valores nulos', () => {
  const segments = charts.splitPointSegments([10, 20, null, 30], i => i * 10, v => 100 - v);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments[0].map(p => p.value), [10, 20]);
  assert.deepEqual(segments[1].map(p => p.value), [30]);
});

test('caminho SVG é estável para um e vários pontos', () => {
  assert.equal(charts.smoothSvgPath([{ x: 1, y: 2 }]), 'M 1 2');
  const path = charts.smoothSvgPath([{ x: 0, y: 10 }, { x: 10, y: 20 }, { x: 20, y: 15 }]);
  assert.match(path, /^M 0 10 C /);
  assert.match(path, /20 15$/);
});

test('área SVG fecha na linha de base', () => {
  const area = charts.smoothAreaPath([{ x: 0, y: 10 }, { x: 10, y: 20 }], 100);
  assert.match(area, /L 10 100 L 0 100 Z$/);
});

test('rótulo SVG escapa conteúdo potencialmente inseguro', () => {
  const label = charts.dataLabelSvg(10, 20, '<script>alert(1)</script>');
  assert.ok(!label.includes('<script>'));
  assert.ok(label.includes('&lt;script&gt;'));
});

test('formatadores mantêm padrão pt-BR e percentual', () => {
  assert.equal(charts.inlineLabel(42.5, { percent: true, decimals: 1 }), '42,5%');
  assert.equal(charts.valueText(1234, { decimals: 0 }), '1.234');
});

test('ids de renderização são únicos', () => {
  const a = charts.nextRenderId('line');
  const b = charts.nextRenderId('line');
  assert.notEqual(a, b);
  assert.match(a, /^line-\d+$/);
});
