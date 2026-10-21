const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');

test('regressao V2.56.1: Qualidade nao volta ao fluxo bloqueante ao trocar Squad',()=>{
  assert.doesNotMatch(app,/await\s+ensureIndicatorSquadFilterReady/);
  assert.match(app,/hydrateIndicatorSquadFilter\(code,\{section:indicatorSectionAtChange\}\)/);
  assert.match(app,/refreshSelectors\(\);render\(\);applyPermissions\(\);updateBreadcrumbs\(\);/);
});

test('regressao V2.56.1: troca direta na Qualidade usa o mesmo carregador de Indicadores',()=>{
  assert.match(app,/ensureViewData\('indicators',state\.adminSection\)/);
  assert.match(app,/state\.indicatorHydrationKey=indicatorScopeContextKey\(indicatorSectionAtChange,code\)/);
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.2.sql')));
});
