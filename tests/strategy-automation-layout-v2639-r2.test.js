'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css/strategy.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('Automacao recebe grid vertical de uma coluna, outros paineis preservados',()=>{
  assert.match(css,/\.strategy-panel\{display:grid;grid-template-columns:minmax\(0,1\.35fr\) minmax\(280px,\.65fr\)/);
  assert.match(css,/\.strategy-panel\[data-strategy-panel="automation"\]\s*\{\s*grid-template-columns:minmax\(0,1fr\);\s*align-items:start/);
  assert.match(html,/class="strategy-panel hidden" data-strategy-panel="automation"/);
  assert.doesNotMatch(css,/\.strategy-panel\[data-strategy-panel="executive"\]\s*\{\s*grid-template-columns:minmax\(0,1fr\)/);
});

test('Tabelas da Automacao rolam dentro dos cartoes sem empurrar a largura da pagina',()=>{
  assert.match(css,/\.strategy-panel\[data-strategy-panel="automation"\] \.strategy-table-wrap\s*\{[\s\S]*?max-width:100%;[\s\S]*?overflow-x:auto;/);
  assert.match(css,/\.strategy-panel\[data-strategy-panel="automation"\] > \.strategy-placeholder-card\s*\{[\s\S]*?min-width:0;[\s\S]*?max-width:100%;/);
  assert.match(html,/id="strategyCsvPreview"/);
  assert.match(html,/id="strategyCsvProducts"/);
  assert.match(html,/class="strategy-placeholder-card strategy-csv-importer"/);
});

test('Hotfix R2 atualiza todos os assets e nao exige nova migration',()=>{
  assert.equal(pkg.version,'2.63.9');
  assert.equal(pkg.assetVersion,'2.63.9-r4');
  const refs=[...html.matchAll(/(?:src|href)="([^"?]+)\?v=([^" ]+)"/g)];
  assert.ok(refs.length>=40);
  for(const m of refs)if(m[1]!=='js/audit-utils.js')assert.equal(m[2],pkg.assetVersion,m[1]);
  assert.doesNotMatch(html,/\?v=2\.63\.9-r1/);
});
