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

test('V2.52.1 adiciona evolução combinada nos cards de Todos os Squads', () => {
  assert.equal(pkg.version, '2.52.1');
  assert.match(app, /function squadPortfolioTrendBuckets\(/);
  assert.match(app, /days<=15\?'daily':days<=45\?'weekly':'monthly'/);
  assert.match(app, /function renderSquadPortfolioTrendChart\(/);
  assert.match(app, /Volume × avaliação/);
  assert.match(app, /Atendimentos/);
  assert.match(app, /Avaliações/);
  assert.match(app, /% Avaliação/);
  assert.match(app, /configuredPercentScaleForValues\(evalValues,100\)/);
  assert.match(app, /chartSquadColor\(s\.code,index\)/);
  assert.match(css, /V2\.52\.1 - VISAO DOS SQUADS/);
  assert.match(css, /squad-card-trend-host\.chart\.interactive-chart/);
});

test('granularidade do mini gráfico segue diário, semanal e competência', () => {
  assert.match(app, /if\(days<=15\)/);
  assert.match(app, /else if\(days<=45\)/);
  assert.match(app, /for\(const id of monthIdsForRange\(start,end\)\)/);
  assert.match(app, /label:`S\$\{index\}`/);
  assert.match(app, /label:shortHistoryMonth\(id\)/);
});

test('exportação transparente usa contraste explícito e oferece variante para fundo escuro', () => {
  assert.deepEqual(exporter.normalizeExportOptions({appearance:'transparent-dark',layout:'slide'}), {appearance:'transparent-dark',layout:'slide'});
  const common = {
    title:'Avaliação por Squad',
    chartSvgMarkup:'<svg viewBox="0 0 100 100"><text class="axis-label" x="5" y="5">35%</text></svg>',
    legend:[{label:'Squad A',color:'#f0a33a'}],
    palette:{text:'#ffffff',muted:'#999999'},
    options:{layout:'slide'}
  };
  const lightTransparent = exporter.buildExportSvg({...common,options:{...common.options,appearance:'transparent'}});
  assert.match(lightTransparent, /fill="#111827"/);
  assert.match(lightTransparent, /fill="#475569"/);
  assert.doesNotMatch(lightTransparent, /<rect width="100%" height="100%"/);
  const darkTransparent = exporter.buildExportSvg({...common,options:{...common.options,appearance:'transparent-dark'}});
  assert.match(darkTransparent, /fill="#f8fafc"/);
  assert.match(darkTransparent, /fill="#cbd5e1"/);
  assert.ok(index.includes('value="transparent-dark"'));
});

test('V2.52.1 permanece frontend-only', () => {
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.52.1.sql')), false);
});
