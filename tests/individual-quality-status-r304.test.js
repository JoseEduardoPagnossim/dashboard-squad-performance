const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
const pkg=require(path.join(root,'package.json'));
test('R30.4: status oficial do ranking consulta o tecnico da competencia',()=>{
 assert.match(app,/const officialMonth=currentMonth\(\)/);
 assert.match(app,/technicianStatusAudit\(official,officialMonth\)/);
 assert.match(app,/Recorte: \$\{escapeHtml\(t\.periodStatus/);
 assert.match(html,/Status oficial = competência mensal; recorte = simulação/);
});
test('R30.4: contagens de notas baixas limitadas ao proprio tecnico',()=>{
 assert.match(app,/function renderIndividualLowRatings\(period,monthly\)/);
 assert.match(app,/renderIndividualLowRatings\(period,t\)/);
 assert.match(app,/\[1,2,3\]\.map\(n=>Math\.max\(0,safe\(period/);
 assert.match(html,/id="individualLowRatings"/);
 assert.doesNotMatch(app.slice(app.indexOf('function renderIndividualLowRatings'),app.indexOf('function technicianStatusAudit')),/from\('profiles'\)|from\('quality_person_daily_metrics'\)/);
});
test('R30.4: login usa imagem institucional sem fundo de squad',()=>{
 assert.match(css,/\.login-screen:before\{background-image:linear-gradient[^;]*var\(--global-background-img\)/);
 assert.match(app,/get_public_global_background/);
 assert.match(css,/background-size:100% 100%,cover/);
});
test('R30.4: manual e revisao de assets',()=>{
 assert.match(html,/Entender status oficial e simulado no Ranking/);
 assert.match(html,/Consultar minhas notas baixas/);
 assert.match(html,/Configurar e conferir o fundo institucional do login/);
 assert.equal(pkg.assetVersion,'2.63.9-r3061');
 assert.match(html,/js\/app\.js\?v=2\.63\.9-r3061/);
});
