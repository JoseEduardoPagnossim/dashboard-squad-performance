const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const index = readFileSync(join(root,'index.html'),'utf8');
const css = readFileSync(join(root,'css','design-system.css'),'utf8');
const styles = readFileSync(join(root,'css','styles.css'),'utf8');
const ds = readFileSync(join(root,'js','design-system.js'),'utf8');

test('V2.48.4 remove aparencia nativa dos campos visiveis',()=>{
  assert.match(css,/input\[type="search"\].*appearance:none/s);
  assert.match(css,/::-webkit-search-cancel-button/);
  assert.match(css,/input\[type="number"\].*-moz-appearance:textfield/s);
  assert.match(css,/::-webkit-inner-spin-button/);
  assert.match(css,/#appShell select,.modal select\{[\s\S]*?appearance:none!important/);
  assert.match(css,/\.ds-select-source/);
  assert.match(css,/\.ds-select-trigger/);
  assert.match(css,/\.ds-select-menu/);
  assert.match(ds,/function enhanceSelect/);
  assert.match(ds,/installSelectValueHooks/);
  assert.match(css,/ds-picker-shell/);
  assert.match(css,/ds-color-trigger/);
});

test('todos uploads HTML continuam ocultos e acionados por componentes',()=>{
  const files=[...index.matchAll(/<input\b[^>]*type="file"[^>]*>/g)].map(m=>m[0]);
  assert.ok(files.length>=1);
  for(const field of files) assert.match(field,/\bhidden\b/,`upload visivel encontrado: ${field}`);
  assert.match(css,/input\[type="file"\].*display:none!important/s);
});

test('Design System melhora pickers e cores sem acessar regras de negocio',()=>{
  assert.match(ds,/function enhancePickerInput/);
  assert.match(ds,/function enhanceColorInput/);
  assert.match(ds,/function enhanceControls/);
  assert.match(ds,/showPicker/);
  assert.equal(/supabase|\.rpc\(|fetch\(/i.test(ds),false);
});

test('sidebar V2.48.4 usa grade e somente a navegacao rola',()=>{
  assert.match(styles,/V2\.48\.4 - SIDEBAR ESTRUTURALMENTE ESTAVEL/);
  assert.match(styles,/grid-template-rows:auto minmax\(0,1fr\) auto auto auto!important/);
  assert.match(styles,/\.sidebar-nav\{[\s\S]*?overflow-y:auto!important/);
  assert.match(styles,/\.campaign-visual\{[\s\S]*?display:block!important/);
  assert.match(styles,/\.sidebar-footer\{[\s\S]*?display:block!important/);
});

test('V2.48.4 nao exige migration nova',()=>{
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.48.4.sql')),false);
  assert.ok(index.includes('V2.48.4'));
});
