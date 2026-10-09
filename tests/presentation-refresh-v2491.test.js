const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');

test('V2.49.1 R5 remove chamada ao carregador monolítico já removido',()=>{
  assert.doesNotMatch(app,/await\s+loadSupabaseData\(\)/);
  assert.match(app,/async function refreshPresentationData\(\)[\s\S]*?ensureMonthLoaded\(code,id,\{force:true,silent:true\}\)/);
});

test('V2.49.1 R5 sincroniza todas as competências do período da apresentação',()=>{
  assert.match(app,/refreshPresentationData\(\)[\s\S]*?const ids=analysisMonthIds\(\)\.filter\(Boolean\)/);
  assert.match(app,/\(\['indicators','team','individual','presentation'\]\.includes\(name\)\)\?analysisMonthIds\(\)\.filter\(Boolean\)/);
});

test('V2.49.1 R5 preserva a última apresentação válida se a sincronização falhar',()=>{
  assert.match(app,/backup=\{currentId:state\.currentId,techName:state\.techName,theme:clone\(state\.theme\),months:\{\}\}/);
  assert.match(app,/Falha ao sincronizar dados da apresentação\./);
  assert.ok(index.includes('js/app.js?v=2.50.0'));
});
