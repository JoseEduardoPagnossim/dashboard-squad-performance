const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'css','styles.css'),'utf8');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pkg=require('../package.json');

test('V2.57.7 mantém subaba oculta mesmo com layout pessoal ativo',()=>{
  assert.equal(pkg.version,'2.62.0');
  assert.match(css,/\.hidden\{display:none!important\}/);
  assert.match(css,/\.personal-layout-root:not\(\.home-widget-grid\):not\(\.hidden\)\{display:flex!important/);
  assert.doesNotMatch(css,/\.personal-layout-root:not\(\.home-widget-grid\)\{display:flex!important/);
});

test('V2.57.7 continua alternando Desempenho e Qualidade pela classe hidden',()=>{
  assert.match(app,/indicatorPerformancePanel[^\n]*classList\.toggle\('hidden',section!=='performance'\)/);
  assert.match(app,/indicatorQualityPanel[^\n]*classList\.toggle\('hidden',section!=='quality'\)/);
  assert.match(app,/layoutRootForView\(view\).*view==='indicators'\?'#indicatorPerformancePanel'/s);
});

test('V2.57.7 publica cache-bust coerente sem migration',()=>{
  for(const asset of ['css/styles.css','js/app.js','js/design-system.js','js/filter-system.js']){
    assert.ok(index.includes(`${asset}?v=2.62.0-r1`),asset);
  }
  assert.ok(index.includes('V2.60.7'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.7.sql')));
});
