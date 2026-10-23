import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

test('release atual preserva o hardening de cache introduzido na R5',()=>{
  assert.equal(pkg.version,'2.59.0');
  assert.equal(pkg.assetVersion,'2.59.0');
  assert.match(index,/js\/app\.js\?v=2\.59\.0/);
  assert.match(index,/V2\.59\.0 • Fundação de Capacidade/);
});

test('R5 mantém compatibilidade com app antigo em cache sem reintroduzir referência inválida no app atual',()=>{
  assert.match(index,/window\.insightEngine = window\.SoftenStrategyInsights/);
  assert.match(app,/strategyInsightsEngine\.executiveInsights\(/);
  assert.doesNotMatch(app,/\binsightEngine\.executiveInsights\(/);
});

test('todos os assets versionados da release usam a versão corrente',()=>{
  const versions=[...index.matchAll(/(?:src|href)=["']([^"']+)\?v=([^"']+)["']/g)]
    .filter(([,asset])=>asset!=='js/audit-utils.js')
    .map(([,asset,version])=>({asset,version}));
  assert.ok(versions.length>10);
  for(const row of versions) assert.equal(row.version,pkg.assetVersion,row.asset);
});
