const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
test('R30.5.1: resumo de qualidade fica apos cinco KPIs e antes da auditoria',()=>{
 assert.ok(html.indexOf('id="kpiPoints"')<html.indexOf('id="individualLowRatings"'));
 assert.ok(html.indexOf('id="individualLowRatings"')<html.indexOf('class="card status-audit-card"'));
 assert.equal((html.match(/id="individualLowRatings"/g)||[]).length,1);
});
test('R30.5.1: resumo apresenta notas e detalhes sem mudar fonte individual',()=>{
 assert.match(js,/function renderIndividualLowRatings\(period,monthly\)/);
 assert.match(js,/individual-low-ratings-strip/);
 assert.match(js,/Ver dias com notas baixas/);
 assert.match(js,/\[1,2,3\]\.map\(n=>Math\.max\(0,safe\(period/);
 assert.match(css,/\.individual-low-ratings-strip\{/);
 assert.doesNotMatch(css,/\.individual-low-ratings-grid\{/);
});
