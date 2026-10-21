const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');

test('regressao: Qualidade nao possui controlador paralelo de hidratacao',()=>{
  assert.doesNotMatch(app,/hydrateIndicatorSquadFilter/);
  assert.doesNotMatch(app,/indicatorHydration(?:Seq|Key|ErrorKey)/);
  assert.match(app,/refreshSelectors\(\);render\(\);applyPermissions\(\);updateBreadcrumbs\(\);/);
});

test('regressao: troca direta de Squad usa o carregador comum da tela',()=>{
  assert.match(app,/await ensureViewData\(state\.currentView,state\.adminSection,\{strict:true\}\)/);
  assert.match(app,/if\(selectionSeq!==state\.squadSelectionSeq\|\|state\.squadCode!==code\)return;/);
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.4.sql')));
});
