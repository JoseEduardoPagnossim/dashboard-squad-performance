const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname,'..');
const index = readFileSync(join(root,'index.html'),'utf8');
const app = readFileSync(join(root,'js','app.js'),'utf8');
const css = readFileSync(join(root,'css','styles.css'),'utf8');
const pkg = require(join(root,'package.json'));

test('V2.50 identifica a versão e carrega o motor comparativo antes do app',()=>{
  assert.equal(pkg.version,'2.50.0');
  const comparePos=index.indexOf('js/comparison-engine.js?v=2.50.0');
  const appPos=index.indexOf('js/app.js?v=2.50.0');
  assert.ok(comparePos>=0 && appPos>comparePos);
  assert.match(app,/window\.SoftenComparisonEngine/);
  assert.match(app,/APP_VERSION = '2\.50\.0'/);
});

test('Meu desempenho oferece comparação opcional sem criar outro filtro global',()=>{
  assert.ok(index.includes('id="individualCompareMode"'));
  assert.ok(index.includes('value="previous-month"'));
  assert.ok(index.includes('value="previous-period"'));
  for(const id of ['kpiAttCompare','kpiNotesCompare','kpiEvalCompare','kpiAvgCompare'])assert.ok(index.includes(`id="${id}"`));
  assert.match(app,/function renderIndividualComparison\(/);
  assert.match(app,/ensureIndividualComparisonData/);
  assert.match(app,/monthIdsForRange\(start,end\)/);
  assert.match(css,/\.kpi-comparison/);
});

test('KPIs possuem explicação auditável do cálculo',()=>{
  for(const key of ['att','notes5','evalPct','avg','points'])assert.ok(index.includes(`data-kpi-explain="${key}"`));
  for(const id of ['metricExplainModal','metricExplainTitle','metricExplainValue','metricExplainGrid','metricExplainFormula'])assert.ok(index.includes(`id="${id}"`));
  assert.match(app,/function metricExplanationData\(/);
  assert.match(app,/function openMetricExplanation\(/);
  assert.match(app,/Meta proporcional/);
  assert.match(app,/% avaliado = total de avaliações/);
  assert.match(app,/Pontuação = atendimentos × nota média/);
  assert.match(css,/\.metric-explain-modal/);
});
