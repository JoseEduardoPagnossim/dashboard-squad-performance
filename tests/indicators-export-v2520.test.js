const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const pkg = require(join(root, 'package.json'));
const charts = require(join(root, 'js', 'chart-engine.js'));
const exporter = require(join(root, 'js', 'chart-export.js'));

test('V2.52.0 otimiza os três papéis dos indicadores de avaliação', () => {
  assert.equal(pkg.version, '2.58.4');
  assert.match(index, /Nota média das avaliações por Squad/);
  assert.match(index, /% de avaliação dos Squads x meta/);
  assert.match(index, /id="indicatorHistoryEvalTitle">% de avaliação/);
  assert.match(app, /function renderSquadCoverageBarChart\(/);
  assert.match(app, /function periodTeamEvalGoal\(/);
  assert.match(app, /data\.average/);
});

test('cores oficiais dos Squads são configuráveis e usadas pela camada de gráficos', () => {
  assert.deepEqual(charts.normalizeSquadColors({ A: '#123456' }), {
    A: '#123456', B: '#36c98f', D: '#46a4ff', E: '#d879ff'
  });
  assert.equal(charts.squadColor('D', { squadColors: { D: '#abcdef' } }), '#abcdef');
  for (const code of ['A', 'B', 'D', 'E']) assert.ok(index.includes(`id="chartSquadColor${code}"`));
  assert.match(app, /chartSquadColor\(s\.code,i\)/);
  assert.match(app, /chartSquadColor\(code,i\)/);
});

test('escala inteligente abre o eixo quando percentuais estão próximos', () => {
  assert.deepEqual(charts.percentScaleForValues([30.8, 45.4], 100, { yScaleMode: 'focus' }), { min: 25, max: 50, focused: true });
  assert.deepEqual(charts.percentScaleForValues([30.8, 45.4], 100, { yScaleMode: 'full' }), { min: 0, max: 100, focused: false });
  assert.deepEqual(charts.percentScaleForValues([30.8, 45.4], 100, { yScaleMode: 'manual', yMin: 20, yMax: 60 }), { min: 20, max: 60, focused: true });
  assert.match(app, /Escala focada:/);
  assert.match(app, /Barras com base em 0%/);
});

test('presets simplificam a configuração e preservam ajustes avançados', () => {
  const presentation = charts.presetPreferences('presentation');
  assert.equal(presentation.visualPreset, 'presentation');
  assert.equal(presentation.labelDensity, 'extremes');
  assert.equal(presentation.yScaleMode, 'focus');
  assert.ok(presentation.chartHeight > charts.presetPreferences('executive').chartHeight);
  for (const preset of ['executive', 'analytical', 'presentation']) assert.match(index, new RegExp(`data-chart-preset="${preset}"`));
  assert.ok(index.includes('id="chartAdvancedSettings"'));
  assert.match(css, /V2\.52\.0 - INDICADORES OTIMIZADOS/);
});

test('exportação gera SVG vetorial e layout 16:9 para apresentação', () => {
  const chartExportIndex = index.indexOf('js/chart-export.js?v=2.58.4');
  const appIndex = index.indexOf('js/app.js?v=2.58.4');
  assert.ok(chartExportIndex >= 0 && appIndex > chartExportIndex, 'chart-export precisa carregar antes do app');
  const svg = exporter.buildExportSvg({
    title: 'Avaliação por Squad',
    eyebrow: 'AVALIAÇÃO',
    context: 'Todos os Squads • Outubro 2026',
    source: 'Fonte: Soften Performance Hub',
    scaleNote: 'Escala focada: 25%–50%',
    chartSvgMarkup: '<svg viewBox="0 0 100 100"><path d="M0 50 L100 20"/></svg>',
    legend: [{ label: 'Squad A', color: '#f0a33a' }],
    options: { appearance: 'current', layout: 'slide' }
  });
  assert.match(svg, /width="1920" height="1080"/);
  assert.match(svg, /Avaliação por Squad/);
  assert.match(svg, /Todos os Squads • Outubro 2026/);
  assert.match(svg, /Escala focada: 25%–50%/);
  assert.equal(exporter.fileSafeName('Taxa média de Avaliação'), 'taxa-media-de-avaliacao');
  for (const id of ['chartExportModal','chartExportCopyBtn','chartExportSvgBtn','chartExportPngBtn']) assert.ok(index.includes(`id="${id}"`));
  assert.match(app, /navigator\.clipboard\?\.write/);
  assert.match(app, /1920,height=layout==='chart'\?900:1080/);
});

test('V2.52.0 é frontend-only e não cria migration adicional', () => {
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.52.3.sql')), false);
});
