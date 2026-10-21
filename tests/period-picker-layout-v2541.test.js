const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const pkg = require(join(root, 'package.json'));

test('V2.57.0 mantém mês e ano visíveis dentro da navegação do calendário', () => {
  assert.equal(pkg.version, '2.57.0');
  assert.match(css, /\.period-picker-jump \.ds-select-proxy\{[\s\S]*width:100%!important/);
  assert.match(css, /\.period-picker-jump \.ds-select-trigger\{[\s\S]*width:100%!important[\s\S]*height:34px!important/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 18px!important/);
});

test('V2.57.0 atualiza cache-bust principal sem migration nova', () => {
  assert.ok(index.includes('css/styles.css?v=2.57.0'));
  assert.ok(index.includes('js/app.js?v=2.57.0'));
  assert.ok(index.includes('V2.57.0'));
});
