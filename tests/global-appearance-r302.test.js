const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const root=join(__dirname,'..');
const read=name=>readFileSync(join(root,name),'utf8');
const app=read('js/app.js'), html=read('index.html'),css=read('css/styles.css');
const sql=read('supabase/migrations/MIGRACAO_V2.63.23_APARENCIA_INSTITUCIONAL_R302.sql');
test('R30.2 deixa a arte do carregamento fora do seletor de tema de Squad',()=>{
 assert.match(html,/id="globalBootArt"/);
 assert.doesNotMatch(html,/<div class="boot-dragon"><img data-theme-art/);
 assert.match(app,/\.hero,\.team-hero,\.help-hero,\.profile-hero,\.sound-welcome-card/);
 assert.doesNotMatch(app,/\.login-screen,\.boot-card,\.sound-welcome-card/);
});
test('R30.2 possui fundo global diferente do hero individual',()=>{
 assert.match(css,/--global-background-img:none/);
 assert.match(css,/\.boot-card:before\{background-image:[^\n]+var\(--global-background-img\)/);
 assert.match(css,/\.bg-layer:after\{background-image:[^\n]+var\(--global-background-img\)/);
 assert.match(app,/--global-background-img/);
 assert.match(app,/r\.setProperty\('--hero-img',bg\)/);
});
test('R30.2 requer salvar imagem global separadamente',()=>{
 for(const id of ['globalBackgroundFile','saveGlobalBackgroundBtn','removeGlobalBackgroundBtn'])assert.ok(html.includes(`id="${id}"`));
 assert.match(app,/async function saveGlobalBackground\(/);
 assert.match(app,/from\('organization_appearance'\)\.upsert\(/);
 assert.match(app,/rpc\('get_public_global_background'/);
});
test('R30.2 usa RLS e somente imagem no retorno publico',()=>{
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/revoke all on public\.organization_appearance from anon/i);
 assert.match(sql,/p\.role='super_admin'/);
 assert.match(sql,/returns text language sql stable security definer/);
 assert.match(sql,/grant execute on function public\.get_public_global_background\(text\) to anon, authenticated/i);
 assert.doesNotMatch(sql,/grant select on public\.organization_appearance to anon/i);
});
test('R30.2 README e revisao coerentes',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.assetVersion,'2.63.9-r3051');
 assert.match(read('README.md'),/R30\.2/);
 assert.match(html,/js\/app\.js\?v=2\.63\.9-r3051/);
});
