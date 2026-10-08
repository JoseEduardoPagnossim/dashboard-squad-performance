const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');

function blockBetween(text, startMarker, endMarker){
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `marcador inicial ausente: ${startMarker}`);
  assert.ok(end > start, `marcador final ausente: ${endMarker}`);
  return text.slice(start, end);
}

test('V2.41 usa a logo oficial no login e no boot', () => {
  const login = blockBetween(index, 'id="loginScreen"', 'id="soundWelcome"');
  const boot = blockBetween(index, 'id="bootScreen"', 'id="loginScreen"');
  assert.match(login, /assets\/soften-logo-sidebar\.png/);
  assert.match(login, /login-shell-v241/);
  assert.match(boot, /boot-brand-logo/);
  assert.match(boot, /assets\/soften-logo-sidebar\.png/);
});

test('Home existe, aparece primeiro na navegacao e e a rota inicial apos login', () => {
  assert.ok(index.includes('id="view-home"'), 'view-home deve existir');
  const navHome = index.indexOf('data-view="home"');
  const navIndividual = index.indexOf('data-view="individual"');
  assert.ok(navHome >= 0 && navHome < navIndividual, 'Inicio deve aparecer antes de Meu desempenho');
  assert.match(app, /currentView:'home'/);
  const enterApp = blockBetween(app, 'async function enterApp(user)', 'function applyPermissions()');
  assert.match(enterApp, /state\.currentView='home'/);
});

test('Home possui renderizacao especifica por perfil', () => {
  for (const marker of ['renderHome()', 'renderTechnicianHome(', 'renderSuperAdminHome(']) {
    assert.ok(app.includes(marker), `app.js deve conter ${marker}`);
  }
  assert.match(app, /isTechnician\(\).*renderTechnicianHome/);
  assert.match(app, /if\(isTechnician\(\)\)renderTechnicianHome\(id,months\[0\]\);else renderSuperAdminHome\(id,months\);/);
  assert.equal(app.includes('renderSquadAdminHome'), false, 'Home nao deve manter perfil Admin de Squad');
});

test('Home possui KPIs, alertas, atalhos e visao de Squads', () => {
  for (const id of ['homeKpis','homeAlerts','homeQuickActions','homeSquadOverview','homeContext','homeEmpty']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(css, /\.home-kpi-grid/);
  assert.match(css, /\.home-alert-list/);
  assert.match(css, /\.home-squad-grid/);
});

test('empty states principais oferecem proximo passo explicito', () => {
  for (const id of ['individualEmpty','teamEmpty']) {
    const pos = index.indexOf(`id="${id}"`);
    assert.ok(pos >= 0, `${id} deve existir`);
    const excerpt = index.slice(pos, pos + 900);
    assert.match(excerpt, /empty-state-actions/);
    assert.ok(/data-empty-view|data-empty-admin-section/.test(excerpt), `${id} deve oferecer uma acao`);
  }
  assert.match(app, /data-empty-view/);
});

test('V2.41 padroniza proporcoes de controles sem remover responsividade', () => {
  assert.match(css, /--ui-control-height:40px/);
  assert.match(css, /\.btn\{min-height:var\(--ui-control-height\)/);
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /login-card-v241/);
});


test('V2.45 transforma a Home em grade modular personalizavel', () => {
  for (const id of ['homeLayoutToolbar','homeWidgetGrid','homeWidgetKpis','homeWidgetAlerts','homeWidgetActions','homeWidgetSquads','homeWidgetContext']) {
    assert.ok(index.includes(`id="${id}"`), `Home modular deve conter ${id}`);
  }
  assert.match(app, /Organizar Home/);
  assert.match(app, /beginHomeLayoutEdit/);
  assert.match(app, /saveHomeLayoutEdit/);
  assert.match(app, /reorderHomeWidgets/);
  assert.match(css, /\.home-widget-size-small/);
  assert.match(css, /\.home-widget-size-medium/);
  assert.match(css, /\.home-widget-size-wide/);
  assert.match(css, /\.home-widget-size-full/);
});

test('V2.45 oferece drag-and-drop e fallback de ordenacao nas Configuracoes', () => {
  assert.match(app, /data-layout-size/);
  assert.match(app, /dragstart/);
  assert.match(app, /reorderLayoutDraft/);
  assert.match(app, /data-layout-move="up"/);
  assert.match(app, /data-layout-move="down"/);
});


test('V2.45.1 preserva CSS Grid da Home mesmo com layout pessoal ativo', () => {
  assert.match(css, /\.personal-layout-root:not\(\.home-widget-grid\)\{display:flex!important/);
  assert.match(css, /\.home-widget-grid\{display:grid!important/);
  assert.match(css, /\.home-widget-grid\.personal-layout-root\{display:grid!important/);
  assert.match(css, /width:100%;min-width:0/);
  assert.match(css, /\.home-widget-role-unavailable\{display:none!important\}/);
});

test('V2.45.1 diferencia widget oculto em edicao e fora da edicao', () => {
  assert.match(app, /classList\.toggle\('layout-user-hidden',!state\.homeLayoutEditMode&&hidden\)/);
  assert.match(app, /classList\.toggle\('home-widget-edit-hidden',state\.homeLayoutEditMode&&hidden\)/);
  assert.match(app, /state\.homeLayoutEditMode\?homeLayoutDraft\(\):savedHomeLayout\(\)/);
});

test('V2.49 centraliza o mapeamento dos filtros superiores em um motor contextual', () => {
  const filterBlock = blockBetween(app, 'function topFilterVisibility(', 'function syncTopFiltersForView(');
  assert.match(filterBlock, /filterSystem\.visibility/);
  assert.match(filterBlock, /settingsModule:state\.settingsModule/);
  assert.match(filterBlock, /indicatorSection:state\.indicatorSection/);
  assert.match(app, /syncTopFiltersForView\('indicators',state\.adminSection\)/);
  assert.match(app, /SUPORTE TÉCNICO COMPLETO/);
});

test('V2.45.2 centraliza parser CSV e mapeamento financeiro no import-engine', () => {
  assert.match(app, /const parseCsvRows=importEngine\.parseCsvRows/);
  assert.match(app, /resolveFinancialImpactColumns\(rawHeaders\)/);
  assert.match(index, /Nota Atendimento/);
  assert.match(index, /sep=;/);
});
