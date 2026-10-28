const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');

function blockBetween(start,end){
  const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
  assert.ok(a>=0,`inicio nao encontrado: ${start}`);
  assert.ok(b>a,`fim nao encontrado: ${end}`);
  return app.slice(a,b);
}

test('V2.61.4 R1 card de tecnicos usa o mesmo status oficial da matriz por competencia',()=>{
  const render=blockBetween('function renderIndicators()','function predictiveGoalSummary');
  assert.match(render,/String\(t\.status\)\.toUpperCase\(\)==='ACIMA'/);
  assert.match(render,/officialAbove=statusItems\.reduce/);
  assert.match(render,/officialBelow=statusItems\.reduce/);
  assert.match(render,/aboveRatio=officialStatusRecords\?officialAbove\/officialStatusRecords:0/);
  assert.match(render,/indicatorAboveCount'\)\.textContent=`\$\{fmtInt\(officialAbove\)\} acima • \$\{fmtInt\(officialBelow\)\} abaixo`/);
  assert.doesNotMatch(render,/totalAbove\+=above/);
  assert.doesNotMatch(render,/totalBelow\+=below/);
});

test('V2.61.4 R1 matriz continua baseada no status mensal oficial persistido',()=>{
  const matrix=blockBetween('function buildStatusMatrix','function renderTechnicianStatusMatrix');
  assert.match(matrix,/statuses\[id\]=String\(t\.status\|\|''\)\.toUpperCase\(\)/);
});

test('V2.61.4 R1 força recarga do app sem consumir V2.61.5',()=>{
  assert.ok(index.includes('js/app.js?v=2.63.0-r1'));
  assert.ok(index.includes('css/styles.css?v=2.63.0-r1'));
  assert.match(app,/APP_VERSION = '2\.63\.0'/);
});
