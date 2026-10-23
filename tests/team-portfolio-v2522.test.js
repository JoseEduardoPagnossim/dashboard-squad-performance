const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const exporter = require(join(root, 'js', 'chart-export.js'));
const pkg = require(join(root, 'package.json'));

test('V2.52.2 habilita exportação nos gráficos de Volume x avaliação dos cards', () => {
  assert.equal(pkg.version, '2.59.4');
  assert.match(app, /fullscreen-chart-modal,.squad-card-with-trend/);
  assert.match(app, /shell\.querySelector\('\.squad-trend-head'\)/);
  assert.match(app, /event\.stopPropagation\(\);openChartExport\(chart\)/);
  assert.match(app, /el\.dataset\.exportTitle=`Volume × avaliação/);
  assert.match(app, /el\.dataset\.exportEyebrow='VISÃO DO SQUAD'/);
  assert.match(app, /chartExportContextFor\(chart\)/);
  assert.match(css, /squad-trend-head \.chart-export-trigger/);
});

test('V2.52.2 mostra rótulos de atendimentos na base e percentual na linha', () => {
  assert.match(app, /squad-trend-bar-label/);
  assert.match(app, /y="\$\{base-7\}"/);
  assert.match(app, /squad-trend-pct-label/);
  assert.match(app, /minimumFractionDigits:1,maximumFractionDigits:1/);
  assert.match(app, /const labelEvery=rows\.length<=12\?1:2/);
  assert.match(css, /squad-card-trend \.chart-data-label/);
  assert.match(css, /paint-order:stroke fill/);
});

test('legenda do gráfico compacto entra no fluxo de exportação', () => {
  assert.match(app, /squad-trend-meta chart-legend-inline/);
  assert.match(app, /chart-legend-item/);
  assert.match(app, /legend-swatch/);
  assert.match(app, /% avaliação<\/span>/);
});

test('exportador reforça legibilidade dos labels em tema e transparência', () => {
  const svg = exporter.buildExportSvg({
    title: 'Volume × avaliação • Squad D',
    chartSvgMarkup: '<svg viewBox="0 0 520 195"><text class="chart-data-label compact squad-trend-bar-label" x="20" y="180">1.845</text><text class="chart-data-label compact squad-trend-pct-label" x="20" y="80" fill="var(--success)">37,3%</text></svg>',
    legend: [{ label: 'Atendimentos', color: '#58a6ff' }, { label: '% avaliação', color: '#36c98f' }],
    palette: { bg: '#080b12', panel: '#11161f', text: '#f5f6f8' },
    options: { appearance: 'transparent', layout: 'slide' }
  });
  assert.match(svg, /paint-order:stroke fill/);
  assert.match(svg, /stroke:#ffffff/);
  assert.match(svg, /squad-trend-bar-label\{fill:#111827\}/);
  assert.match(svg, /Atendimentos/);
  assert.match(svg, /% avaliação/);
});

test('V2.52.2 atualiza cache e continua frontend-only', () => {
  assert.ok(index.includes('js/app.js?v=2.59.4'));
  assert.ok(index.includes('js/chart-export.js?v=2.59.4'));
  assert.ok(index.includes('css/styles.css?v=2.59.4'));
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.52.3.sql')), false);
});
