const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const index = readFileSync(join(root,'index.html'),'utf8');
const app = readFileSync(join(root,'js','app.js'),'utf8');
const styles = readFileSync(join(root,'css','styles.css'),'utf8');
const design = readFileSync(join(root,'css','design-system.css'),'utf8');
const migration = readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.48.3.sql'),'utf8').toLowerCase();

test('V2.48.3 oferece exatamente tres fontes de sistema',()=>{
  for(const value of ['inter','roboto','source-sans']) assert.ok(index.includes(`value="${value}"`));
  assert.match(app,/SYSTEM_FONT_OPTIONS/);
  assert.match(app,/fontFamily:normalizeSystemFont/);
  assert.match(styles,/--app-font-family/);
});

test('tipografia acompanha tema e boot publico',()=>{
  assert.match(app,/applySystemFont\(state\.theme\.fontFamily\)/);
  assert.match(migration,/'fontfamily'/);
  assert.match(index,/fonts\.googleapis\.com\/css2\?family=Inter/);
});

test('editor de tema tem salvar e cancelar explicitos',()=>{
  for(const id of ['saveThemeChangesBtn','cancelThemeChangesBtn','themeEditStatus']) assert.ok(index.includes(`id="${id}"`));
  assert.match(app,/function beginThemeEditor/);
  assert.match(app,/function saveThemeEditor/);
  assert.match(app,/function cancelThemeEditor/);
  assert.match(app,/themeEditorSnapshot/);
});

test('campos nativos visiveis recebem componentes padronizados',()=>{
  assert.match(design,/appearance:none/);
  assert.match(design,/input\[type="checkbox"\]/);
  assert.match(design,/input\[type="range"\]/);
  assert.match(design,/color-control/);
  assert.ok(index.includes('id="chooseBackgroundBtn"'));
  assert.match(index,/id="backgroundFile"[^>]+hidden/);
});

test('personalizacao de tema nao persiste enquanto usuario apenas edita',()=>{
  const start=app.indexOf("$$('[data-theme-edit-mode]')");
  const end=app.indexOf("$('#saveGoalsBtn')",start);
  assert.ok(start>=0&&end>start);
  const bindings=app.slice(start,end);
  assert.equal(bindings.includes('saveTheme();'),false,'handlers de preview do tema não devem persistir automaticamente');
  assert.match(bindings,/markThemeEditorDirty/);
});

test('telas administrativas mapeadas mantem salvamento explicito',()=>{
  for(const id of ['saveGoalsBtn','saveScoreSettingsBtn','saveMonthlyMetricsBtn','saveFinanceBtn','saveFinanceTechniciansBtn','saveSupportCostsBtn','saveChartPrefsBtn','saveLayoutBtn','presentationApplyConfigBtn','presentationPlaylistSaveBtn']){
    assert.ok(index.includes(`id="${id}"`),`${id} deve continuar disponível`);
  }
});

test('upload de fundo deixa de exibir input file nativo',()=>{
  assert.match(index,/id="chooseBackgroundBtn"/);
  assert.match(index,/id="backgroundFile" type="file"[^>]*hidden/);
  assert.match(app,/chooseBackgroundBtn/);
});
