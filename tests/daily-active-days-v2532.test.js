const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');

test('V2.57.7 exclui dias zerados do grafico e da media diaria',()=>{
  assert.equal(pkg.version,'2.62.0');
  assert.match(app,/\.filter\(item=>item\.value>0\)/);
  assert.match(app,/Média geral dos dias com atendimento/);
  assert.match(app,/Média diária do \${scopeLabel}/);
  assert.match(app,/\$\{fmtInt\(data\.days\)\} dia\(s\) com atendimento/);
});

test('V2.57.7 atualiza cache-bust e versao visivel',()=>{
  assert.ok(index.includes('V2.60.7'));
  assert.ok(index.includes('js/app.js?v=2.62.0-r1'));
  assert.ok(index.includes('css/styles.css?v=2.62.0-r1'));
  assert.match(app,/APP_VERSION = '2\.62\.0'/);
});
