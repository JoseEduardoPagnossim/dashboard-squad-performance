const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');

test('V2.48.13 mantém ações da importação visíveis em rodapé fixo e rola somente o corpo', () => {
  assert.match(index, /class="import-modal-body" id="importModalBody"/);
  assert.match(index, /class="modal-actions import-modal-footer"/);
  assert.match(css, /\.import-modal-card\{[^}]*max-height:calc\(100dvh - 28px\)[^}]*grid-template-rows:auto minmax\(0,1fr\) auto[^}]*overflow:hidden!important/);
  assert.match(css, /\.import-modal-body\{[^}]*overflow-y:auto[^}]*overscroll-behavior:contain/);
  assert.match(css, /html\.modal-open,body\.modal-open\{overflow:hidden!important\}/);
  assert.match(app, /function syncModalScrollLock\(\)/);
  assert.match(app, /document\.documentElement\.classList\.toggle\('modal-open',locked\)/);
});

test('escopo da importação é escolhido na dialog e não depende do filtro externo', () => {
  assert.match(index, /id="csvScopeSelect"/);
  assert.match(index, /Este escopo vale somente para esta importação e não altera o filtro de Squad/);
  assert.match(app, /function populateImportScopeSelect\(\)/);
  assert.match(app, /function selectedImportScope\(\)/);
  assert.match(app, /const preferred=allowAll\?'all'/);
  assert.match(app, /const targetCode=pending\.codes\?\.\[0\],s=state\.squads\?\.\[targetCode\]/);
  assert.doesNotMatch(app, /const s=currentSquad\(\),previous=s\.months\[id\]/);
  assert.doesNotMatch(app, /state\.currentId=id;state\.techName=data\.technicians/);
});

test('trocar Squad reaproveita o mesmo arquivo e recalcula a prévia', () => {
  assert.match(app, /state\.pendingCsvSource=\{fileName:file\.name,fileSize:file\.size,checksum,text,kind\}/);
  assert.match(app, /csvScopeSelect'\)\)\$\('#csvScopeSelect'\)\.addEventListener\('change',refreshPendingCsvForScope\)/);
  assert.match(app, /async function refreshPendingCsvForScope\(\)/);
  assert.match(app, /await preparePendingCsvSource\(state\.pendingCsvSource\)/);
});

test('Central de Importação aceita arrastar e soltar sem remover o seletor tradicional', () => {
  assert.match(index, /id="importCenterDropzone"/);
  assert.match(index, /id="importDropzone"/);
  assert.match(index, /id="csvInput" type="file" accept="\.csv,text\/csv" hidden/);
  assert.match(app, /function bindImportDropzone\(el,\{openFirst=false\}=\{\}\)/);
  assert.match(app, /addEventListener\('drop'/);
  assert.match(app, /handleCsvSelection\(file\)/);
  assert.match(app, /chooseFileBtn'\)\.addEventListener\('click',\(\)=>\$\('#csvInput'\)\.click\(\)\)/);
});

test('V2.48.13 é frontend-only e preserva regra financeira e schema', () => {
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.48.13.sql')), false);
  assert.match(app, /APP_VERSION = '2\.50\.0'/);
  assert.match(index, /V2\.50\.0/);
  const finance = readFileSync(join(root, 'js', 'finance-rules.js'), 'utf8');
  assert.match(finance, /FR-2\.48\.8-1/);
});
