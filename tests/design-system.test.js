const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css', 'design-system.css'), 'utf8');
const js = readFileSync(join(root, 'js', 'design-system.js'), 'utf8');

function pos(text){ return index.indexOf(text); }

test('V2.44 carrega a camada visual entre styles e presentation', () => {
  const styles = pos('css/styles.css');
  const design = pos('css/design-system.css');
  const presentation = pos('css/presentation.css');
  assert.ok(styles >= 0 && design > styles && presentation > design);
});

test('V2.44 carrega design-system.js antes do app principal', () => {
  const design = pos('js/design-system.js');
  const app = pos('js/app.js');
  assert.ok(design >= 0 && app > design);
  assert.match(js, /window|root\.SoftenDesignSystem/);
});

test('Design System possui tokens centrais de espacamento, controle, superficie e foco', () => {
  for (const token of ['--ds-space-4','--ds-control-h','--ds-card-padding','--ds-border','--ds-surface','--ds-focus']) {
    assert.ok(css.includes(token), `token ${token} deve existir`);
  }
});

test('Cards sao classificados por funcao sem alterar regras de negocio', () => {
  for (const marker of ['ds-card-kpi','ds-card-analysis','ds-card-config','ds-card-interactive']) {
    assert.ok(js.includes(marker), `design-system.js deve aplicar ${marker}`);
    assert.ok(css.includes(`.${marker}`), `design-system.css deve estilizar ${marker}`);
  }
  assert.equal(/supabase|fetch\(|\.rpc\(/i.test(js), false, 'Design System nao deve acessar rede ou banco');
});

test('Tabelas largas recebem densidade e primeira coluna fixa', () => {
  assert.match(js, /if\(count>=7\)table\.classList\.add\('ds-table-wide'\)/);
  assert.match(js, /if\(count>=9\)table\.classList\.add\('ds-table-dense'\)/);
  assert.match(js, /if\(count>=12\)table\.classList\.add\('ds-table-compact'\)/);
  assert.match(css, /\.ds-table-wide th:first-child/);
  assert.match(css, /position:sticky;left:0/);
});

test('Design System respeita densidade de layout existente e responsividade', () => {
  assert.match(css, /\.layout-density-compact/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /font-variant-numeric:tabular-nums/);
});

test('V2.44 esta documentada e nao exige migration nova', () => {
  const doc = readFileSync(join(root, 'docs', 'DESIGN_SYSTEM_V2.44.0.md'), 'utf8');
  assert.match(doc, /Design System/);
  assert.match(doc, /não altera Supabase/);
  assert.match(doc, /não altera cálculos/);
});
