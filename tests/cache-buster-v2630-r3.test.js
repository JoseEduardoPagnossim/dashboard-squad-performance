'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

test('todos os scripts e estilos do HTML usam a mesma revisao de assets declarada no package.json',()=>{
  assert.equal(pkg.version,'2.63.8');
  assert.equal(pkg.assetVersion,'2.63.8-r1');
  const refs=[...html.matchAll(/(?:src|href)=["']([^"']+\?v=([^"']+))["']/g)]
    .map(m=>({ref:m[1],version:m[2]}))
    .filter(x=>!x.ref.startsWith('js/audit-utils.js'));
  assert.ok(refs.length>=40,'esperadas dezenas de referencias JS/CSS versionadas');
  for(const ref of refs) assert.equal(ref.version,pkg.assetVersion,ref.ref);
  assert.ok(refs.some(x=>x.ref.startsWith('js/app.js?v=')),'app.js presente');
  assert.ok(refs.some(x=>x.ref.startsWith('css/styles.css?v=')),'styles.css presente');
});

test('o cache-buster da versao e uniforme sem misturar revisoes',()=>{
  assert.doesNotMatch(html,/\?v=2\.63\.0-r[123](?=["'])/);
  assert.match(html,/js\/app\.js\?v=2\.63\.8-r1/);
  assert.match(html,/id="newUserRole"[^>]*>[\s\S]*?value="pre_attendance"/);
});
