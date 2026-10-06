const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const styles = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.48.2.sql'), 'utf8').toLowerCase();

test('V2.48.2 nao injeta imagem de futebol no primeiro paint', () => {
  assert.match(styles, /--hero-img:none;--hero-opacity:\.08;/);
  assert.equal(/data-theme-art[^>]+src="assets\/brasil-em-campo-public\.jpg"/.test(index), false);
  assert.match(index, /SOFTEN PERFORMANCE HUB • CARREGANDO IDENTIDADE VISUAL/);
});

test('boot usa cache valido ou fallback neutro, nunca DEFAULT_THEME diretamente', () => {
  assert.match(app, /const cachedBootTheme=loadCachedTheme\(\)/);
  assert.match(app, /applyTheme\(cachedBootTheme\|\|BOOT_FALLBACK_THEME/);
  assert.match(app, /preset:'bootstrap'/);
});

test('tema publico e carregado antes de exibir login em navegador limpo', () => {
  assert.match(app, /hydratePublicThemeBootstrap/);
  assert.match(app, /rpc\('get_public_theme_bootstrap'/);
  assert.match(app, /if\(!cachedBootTheme\)await hydratePublicThemeBootstrap\(\);\s*showLogin\(\)/);
});

test('tema autenticado do Squad e resolvido antes de liberar a interface', () => {
  const enterStart = app.indexOf('async function enterApp(user)');
  const hideBoot = app.indexOf("hideBoot();$('#loginScreen')", enterStart);
  const ensureTheme = app.indexOf('await ensureSquadTheme(state.squadCode,{force:false,apply:false})', enterStart);
  assert.ok(enterStart >= 0 && ensureTheme > enterStart && hideBoot > ensureTheme);
});

test('RPC publica expoe somente identidade visual e nao libera SELECT anonimo nas tabelas', () => {
  assert.match(migration, /create or replace function public\.get_public_theme_bootstrap/);
  assert.match(migration, /security definer/);
  assert.match(migration, /grant execute on function public\.get_public_theme_bootstrap\(text\) to anon, authenticated/);
  assert.equal(/grant\s+select[^;]+squad_themes[^;]+anon/.test(migration), false);
  assert.equal(/'soundtrack'/.test(migration), false);
});
