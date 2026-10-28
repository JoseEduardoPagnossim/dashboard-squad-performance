const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const pkg = require(join(root, 'package.json'));

test('V2.52.3 adiciona benchmark consolidado abaixo dos cards de Squad', () => {
  assert.equal(pkg.version, '2.62.9');
  assert.match(index, /id="portfolioBenchmarkCard"/);
  assert.match(index, /Taxa consolidada de avaliação × benchmark/);
  assert.match(index, /Objetivo 60% • limite mínimo 20%/);
  assert.match(index, /id="portfolioBenchmarkChart"/);
  assert.match(css, /V2\.52\.3 - BENCHMARK CONSOLIDADO/);
});

test('benchmark usa consolidado ponderado e as mesmas agregações dos KPIs', () => {
  assert.match(app, /function portfolioBenchmarkData\(/);
  assert.match(app, /deriveTotals\(periodTechniciansForSquad\(squad,from,to\)\)/);
  assert.match(app, /eligibleAtt\+=safe\(totals\.eligibleAtt\)/);
  assert.match(app, /evalPct:has&&eligibleAtt\?evals\/eligibleAtt\*100:null/);
  assert.doesNotMatch(app, /PORTFOLIO_EVAL_BENCHMARK_GOOD\s*=\s*\.6/);
});

test('benchmark inclui objetivo, limite e tendência linear sem poluir rótulos', () => {
  assert.match(app, /PORTFOLIO_EVAL_BENCHMARK_MIN=20,PORTFOLIO_EVAL_BENCHMARK_GOOD=60/);
  assert.match(app, /function linearTrendValues\(/);
  assert.match(app, /name:'Taxa consolidada'.*labelMode:'all'/s);
  assert.match(app, /name:'Tendência'.*dashed:true.*points:false.*labels:false/s);
  assert.match(app, /name:'Limite mínimo 20%'.*points:false.*labels:false/s);
  assert.match(app, /name:'Objetivo 60%'.*points:false.*labels:false/s);
});

test('renderer aceita controle por série e o gráfico entra no fluxo de exportação', () => {
  assert.match(app, /const showArea=s\.area!==false&&!s\.dashed/);
  assert.match(app, /s\.points===false\?'':/);
  assert.match(app, /s\.labels===false\?false:\(s\.labelMode==='all'\?true:/);
  assert.match(app, /el\.dataset\.exportTitle='Taxa consolidada de avaliação × benchmark'/);
  assert.match(app, /scheduleChartExportControls\(\)/);
});

test('V2.52.3 atualiza cache e permanece frontend-only', () => {
  assert.ok(index.includes('js/app.js?v=2.62.9-r1'));
  assert.ok(index.includes('css/styles.css?v=2.62.9-r1'));
  assert.equal(existsSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.52.3.sql')), false);
});
