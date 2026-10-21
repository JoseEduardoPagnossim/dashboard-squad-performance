const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');

test('regressao V2.56.1: troca de Squad continua reativa e nao bloqueia o filtro',()=>{
  assert.doesNotMatch(app,/await\s+ensureIndicatorSquadFilterReady/);
  assert.match(app,/refreshSelectors\(\);render\(\);applyPermissions\(\);updateBreadcrumbs\(\);/);
});

test('regressao V2.56.1: Qualidade nao volta a possuir um controlador paralelo de hidratacao',()=>{
  assert.doesNotMatch(app,/hydrateIndicatorSquadFilter/);
  assert.doesNotMatch(app,/indicatorHydrationKey/);
  assert.doesNotMatch(app,/indicatorHydrationSeq/);
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.3.sql')));
});
