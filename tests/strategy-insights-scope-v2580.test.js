import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');

test('V2.58.4 usa o engine de insights carregado no escopo do app',()=>{
  assert.match(app,/const strategyInsightsEngine = window\.SoftenStrategyInsights;/);
  assert.match(app,/insights=strategyInsightsEngine\.executiveInsights\(/);
  assert.doesNotMatch(app,/insights=insightEngine\.executiveInsights\(/);
});

test('render executivo referencia apenas o alias strategyInsightsEngine para insights',()=>{
  const start=app.indexOf('function renderStrategyExecutive(');
  const end=app.indexOf('async function loadStrategyFinanceData',start);
  assert.ok(start>=0&&end>start,'renderStrategyExecutive deve existir antes do carregamento financeiro');
  const block=app.slice(start,end);
  assert.match(block,/strategyInsightsEngine\.executiveInsights/);
  assert.doesNotMatch(block,/\binsightEngine\b/);
});
