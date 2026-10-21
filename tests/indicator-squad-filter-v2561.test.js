const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pkg=require('../package.json');

test('V2.56.1 carrega o escopo completo antes de renderizar troca de Squad em Indicadores',()=>{
  assert.equal(pkg.version,'2.56.1');
  assert.match(app,/const waitForIndicatorScope=state\.currentView==='indicators'&&indicatorSquadFilterRequiresFullData\(state\.indicatorSection\);/);
  assert.match(app,/if\(waitForIndicatorScope\)\{await ensureIndicatorSquadFilterReady\(code\);if\(state\.squadCode!==code\)return;\}\s*refreshSelectors\(\);render\(\)/);
});

test('V2.56.1 Qualidade nao depende de abrir Desempenho antes',()=>{
  assert.match(app,/return \['quality','business-days','detail'\]\.includes\(section\);/);
  assert.match(app,/requested==='ALL'\?Object\.keys\(state\.squads\|\|\{\}\)\.sort\(\):\[requested\]/);
  assert.match(app,/await ensureMonthsLoaded\(codes,ids,\{silent:true\}\)/);
  assert.match(app,/if\(state\.supabase&&indicatorSquadFilterRequiresFullData\(state\.indicatorSection\)\) hydrateCurrentViewAsync\('indicators',state\.adminSection\)/);
});

test('V2.56.1 preserva escopo corporativo do impacto financeiro e nao cria migration',()=>{
  assert.match(app,/if\(state\.indicatorSection==='financial-impact'\)/);
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.1.sql')));
  assert.ok(index.includes('js/app.js?v=2.56.1'));
});
