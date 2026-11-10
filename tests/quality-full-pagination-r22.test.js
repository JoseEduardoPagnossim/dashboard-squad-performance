const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const start = app.indexOf('async function ensureQualityFullLoaded(');
const end = app.indexOf('function negativeImportValues(', start);
const section = app.slice(start, end);

test('Qualidade Completa pagina toda a base sem truncar meses recentes', () => {
  assert.ok(start >= 0 && end > start);
  assert.match(section, /const pageSize=500/);
  assert.match(section, /\.range\(offset,offset\+pageSize-1\)/);
  assert.match(section, /rows\.push\(\.\.\.page\)/);
  assert.match(section, /if\(page\.length<pageSize\)break/);
  assert.match(section, /\.eq\('organization_id',state\.user\.organizationId\)/);
  assert.match(section, /\.order\('metric_date',\{ascending:true\}\)\.order\('squad_id',\{ascending:true\}\)/);
});
