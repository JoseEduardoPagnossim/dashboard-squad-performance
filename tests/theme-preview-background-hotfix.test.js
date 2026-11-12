const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
test('faixa de tema contem imagem propria, separada do fundo CSS geral', () => {
  assert.match(html, /class="theme-preview"><img class="theme-preview-art hidden"/);
  assert.match(js, /const previewArt=\$\('#configAppearanceCard \.theme-preview-art'\)/);
  assert.match(js, /if\(safeBg\)\{/);
  assert.match(js, /previewArt\.src=safeBg/);
  assert.match(js, /previewArt\.removeAttribute\('src'\)/);
  assert.match(css, /#configAppearanceCard \.theme-preview-art\{[^}]*object-fit:cover/);
  assert.match(css, /#configAppearanceCard \.theme-preview::before\{/);
});
