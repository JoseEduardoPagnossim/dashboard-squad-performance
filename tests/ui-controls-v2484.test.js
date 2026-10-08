const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const index = readFileSync(join(root,'index.html'),'utf8');
const css = readFileSync(join(root,'css','design-system.css'),'utf8');
const styles = readFileSync(join(root,'css','styles.css'),'utf8');
const ds = readFileSync(join(root,'js','design-system.js'),'utf8');
const app = readFileSync(join(root,'js','app.js'),'utf8');

test('V2.48.6 mantém todos os tipos de campos visíveis no Design System',()=>{
  assert.match(css,/input\[type="search"\].*appearance:none/s);
  assert.match(css,/::-webkit-search-cancel-button/);
  assert.match(css,/input\[type="number"\].*-moz-appearance:textfield/s);
  assert.match(css,/::-webkit-inner-spin-button/);
  assert.match(css,/\.ds-select-source/);
  assert.match(css,/\.ds-select-proxy/);
  assert.match(css,/\.ds-select-trigger/);
  assert.match(css,/\.ds-select-menu/);
  assert.match(css,/ds-picker-shell/);
  assert.match(css,/ds-color-trigger/);
  assert.match(css,/input\[type="checkbox"\].*appearance:none/s);
  assert.match(css,/input\[type="range"\].*appearance:none/s);
});

test('select customizado não move nem substitui o select original',()=>{
  assert.match(ds,/select\.insertAdjacentElement\('afterend',proxy\)/);
  assert.doesNotMatch(ds,/shell\.appendChild\(select\)/);
  assert.doesNotMatch(ds,/HTMLSelectElement\.prototype/);
  assert.doesNotMatch(ds,/installSelectValueHooks/);
  assert.match(ds,/select\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
  assert.match(ds,/select\.dispatchEvent\(new Event\('input',\{bubbles:true\}\)\)/);
});

test('selects dinâmicos e dependentes possuem sincronização segura',()=>{
  assert.match(ds,/function selectOptionSignature/);
  assert.match(ds,/function syncAllSelectControls/);
  assert.match(ds,/MutationObserver/);
  assert.match(ds,/targetSelect=mutation\.target\?\.tagName==='SELECT'/);
  assert.match(ds,/window\.setInterval\(\(\)=>\{if\(!document\.hidden\)syncAllSelectControls\(\)\},350\)/);
  assert.match(ds,/cleanupSelectController/);
  assert.match(ds,/document\.body\.appendChild\(menu\)/);
  assert.match(css,/\.ds-select-menu\{display:none;position:fixed/);
});



test('V2.48.6 impede select-fonte invisível de ampliar o documento',()=>{
  assert.match(css,/#appShell select\.ds-select-source[\s\S]*?width:1px!important[\s\S]*?min-width:1px!important[\s\S]*?max-width:1px!important/);
  assert.match(css,/#appShell select\.ds-select-source[\s\S]*?left:0!important[\s\S]*?right:auto!important/);
  assert.match(css,/#appShell select\.ds-select-source[\s\S]*?contain:size layout style!important/);
  assert.match(css,/#appShell\{width:100%;max-width:100%;min-width:0\}/);
  assert.match(css,/\.ds-select-portal\{max-width:calc\(100vw - 16px\)!important\}/);
});
test('todos uploads HTML continuam ocultos e acionados por componentes',()=>{
  const files=[...index.matchAll(/<input\b[^>]*type="file"[^>]*>/g)].map(m=>m[0]);
  assert.ok(files.length>=1);
  for(const field of files) assert.match(field,/\bhidden\b/,`upload visivel encontrado: ${field}`);
  assert.match(css,/input\[type="file"\].*display:none!important/s);
});

test('Design System não acessa regras de negócio nem Supabase',()=>{
  assert.match(ds,/function enhancePickerInput/);
  assert.match(ds,/function enhanceColorInput/);
  assert.match(ds,/function enhanceControls/);
  assert.match(ds,/showPicker/);
  assert.equal(/supabase|\.rpc\(|fetch\(/i.test(ds),false);
});

test('sidebar continua com grade estável e recuperação de estado legado',()=>{
  assert.match(styles,/V2\.48\.5 - SIDEBAR ESTRUTURALMENTE ESTAVEL/);
  assert.match(styles,/grid-template-rows:auto minmax\(0,1fr\) auto auto auto!important/);
  assert.match(styles,/\.sidebar-nav\{[\s\S]*?overflow-y:auto!important/);
  assert.match(styles,/\.campaign-visual\{[\s\S]*?display:block!important/);
  assert.match(styles,/\.sidebar-footer\{[\s\S]*?display:block!important/);
  assert.match(app,/legacy=Number\(raw\.version\|\|0\)<5/);
  assert.match(app,/normalizeUiNavigation\(\{sidebarCollapsed:base\.navigation\?\.sidebarCollapsed===true\}\)/);
  assert.match(app,/version:5/);
});

test('V2.48.8 mantém o hotfix de controles e as migrations posteriores',()=>{
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.48.6.sql')),false);
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.48.7.sql')),true);
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.48.8.sql')),true);
  assert.ok(index.includes('V2.48.14'));
  assert.ok(app.includes("APP_VERSION = '2.48.14'"));
});
