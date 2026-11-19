'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/date-controls.js'), 'utf8');
const pkg = require(path.join(root, 'package.json'));
test('R30.6.1: input calendario nativo nao recebe toque nem clique, preservando valor interno', () => {
  assert.match(css, /\.ds-date-control>\.ds-date-source\{display:none!important/);
  assert.match(css, /pointer-events:none!important/);
  assert.match(js, /input\.setAttribute\('aria-hidden','true'\)/);
  assert.match(js, /button\.addEventListener\('click'/);
  assert.match(js, /input\.dispatchEvent\(new Event\('change'/);
});
test('R30.6.1: modal responsivo isolado e revisao de assets consistente', () => {
  assert.match(css, /\.ds-date-dialog>\.ds-date-dialog-panel/);
  assert.match(css, /max-height:calc\(100dvh - 24px\)!important/);
  assert.match(js, /class="ds-date-nav-current"/);
  assert.equal(pkg.assetVersion, '2.63.9-r3062');
  assert.match(html, /js\/date-controls\.js\?v=2\.63\.9-r3062/);
});
