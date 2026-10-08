const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const finance = readFileSync(join(root, 'js', 'finance-rules.js'), 'utf8');

function blockAfter(marker){
  const start=css.indexOf(marker);
  assert.ok(start>=0, `bloco ${marker} deve existir`);
  return css.slice(start);
}

test('V2.48.12 substitui a composicao comprimida do select por coluna flexivel', () => {
  const block=blockAfter('V2.48.12 - TOPBAR ESTAVEL / VALORES SEM RECORTE');
  assert.match(block, /\.topbar \.top-actions>\.select-wrap\{[\s\S]*?display:flex!important;[\s\S]*?flex-direction:column!important;/);
  assert.match(block, /height:var\(--top-control-h\)!important;[\s\S]*?max-height:var\(--top-control-h\)!important;/);
  assert.match(block, /overflow:visible!important;/);
  assert.match(block, /\.ds-select-proxy\{[\s\S]*?height:20px!important;[\s\S]*?max-height:20px!important;/);
  assert.match(block, /\.ds-select-trigger\{[\s\S]*?height:20px!important;[\s\S]*?padding:0!important;/);
  assert.match(block, /\.ds-select-value\{[\s\S]*?height:20px!important;[\s\S]*?line-height:20px!important;/);
});

test('V2.48.12 mantém altura externa e corrige somente o conteúdo dos filtros', () => {
  assert.match(css, /--top-control-h:44px;/);
  const oldPos=css.indexOf('V2.48.11 - TOPBAR LEGIVEL + CALENDARIO DO DESIGN SYSTEM');
  const newPos=css.indexOf('V2.48.12 - TOPBAR ESTAVEL / VALORES SEM RECORTE');
  assert.ok(oldPos>=0 && newPos>oldPos, 'hotfix deve sobrescrever a V2.48.11 sem remover o calendário');
  for(const id of ['squadSelect','monthSelect','techSelect']) assert.ok(index.includes(`id="${id}"`));
  assert.match(app,/\$\('#squadSelect'\)\.addEventListener\('change',async e=>\{await selectSquad\(e\.target\.value,\{history:'replace'\}\);\}\)/);
  assert.match(app,/\$\('#techSelect'\)\.addEventListener\('change',e=>\{state\.techName=e\.target\.value;renderIndividual\(\);syncPersistentUrl\(\{replace:true\}\);\}\)/);
});

test('V2.48.12 preserva calendário próprio, sidebar e regra financeira', () => {
  assert.match(css,/\.ds-calendar-popover\{/);
  assert.match(css,/V2\.48\.5 - SIDEBAR ESTRUTURALMENTE ESTAVEL/);
  assert.match(finance,/FINANCE_RULE_VERSION = 'FR-2\.48\.8-1'/);
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.48.12.sql')),false);
});

test('V2.48.12 atualiza somente versão de frontend', () => {
  assert.match(app,/APP_VERSION = '2\.48\.14'/);
  assert.ok(index.includes('V2.48.14'));
  assert.ok(index.includes('css/styles.css?v=2.48.14'));
  assert.ok(index.includes('js/app.js?v=2.48.14'));
});
