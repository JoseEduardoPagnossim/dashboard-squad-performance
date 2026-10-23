const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const pkg = require(join(root, 'package.json'));

test('V2.57.8 trata reimportacao operacional como fotografia substitutiva',()=>{
  assert.equal(pkg.version,'2.59.7');
  assert.match(app,/Reimportação operacional é uma fotografia substitutiva da competência aberta/);
  assert.doesNotMatch(app,/Preserva quem teve produção na competência mas não veio na extração atual/);
});

test('tecnico ausente do CSV nao e acrescentado de volta a m.technicians',()=>{
  const start=app.indexOf('function buildMonthFromCsv');
  const end=app.indexOf('function normalizeHeader',start);
  const fn=app.slice(start,end);
  assert.match(fn,/const technicians=\[\.\.\.byTech\.values\(\)\]\.map/);
  assert.doesNotMatch(fn,/technicians\.push\(preserved\)/);
  assert.doesNotMatch(fn,/for\(const \[identityKey,prevRows\] of previousByIdentity\)/);
});

test('persistencia apaga linhas mensais antigas que nao existem na nova fotografia',()=>{
  assert.match(app,/keepIds=new Set\(\)/);
  assert.match(app,/for\(const old of \[\.\.\.alive\.values\(\)\]\)\{if\(keepIds\.has\(old\.id\)\)continue;const \{error:se\}=await state\.supabase\.from\('technician_monthly'\)\.delete\(\)\.eq\('id',old\.id\)/);
});

test('reimportacao continua preservando metas e configuracoes de quem permanece no CSV',()=>{
  const start=app.indexOf('function buildMonthFromCsv');
  const end=app.indexOf('function normalizeHeader',start);
  const fn=app.slice(start,end);
  assert.match(fn,/prev=preferredPreviousTechnician\(prevRows,canonical,raw\.userId\)/);
  assert.match(fn,/goalAtt:safe\(prev\.goalAtt\)/);
  assert.match(fn,/financeManualBonus:safe\(prev\.financeManualBonus\)/);
});
