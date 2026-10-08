const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const filters = require(join(root, 'js', 'filter-system.js'));
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const pkg = require(join(root, 'package.json'));

function topbarHtml(){
  const start=index.indexOf('<header class="topbar">');
  const end=index.indexOf('</header>',start);
  return index.slice(start,end);
}

test('V2.49.1 identifica a versão correta',()=>{
  assert.equal(pkg.version,'2.49.1');
  assert.ok(index.includes('js/app.js?v=2.49.1-r1'));
});

test('Competência e período ocupam um único controle visual quando há análise temporal',()=>{
  const top=topbarHtml();
  assert.match(top,/id="analysisPeriodTrigger"[\s\S]*?<span>Período de análise<\/span>/);
  assert.match(app,/monthControl\.classList\.toggle\('hidden',!visibility\.competence\|\|visibility\.period\)/);
  assert.deepEqual(filters.controlKeys({view:'individual',isSuperAdmin:true,isTechnician:false,squadCode:'D'}),['squad','analysis','technician']);
  assert.equal(filters.activeCount({view:'individual',isSuperAdmin:true,isTechnician:false,squadCode:'D'}),3);
});

test('seletor possui modos Por competência e Intervalo livre',()=>{
  for(const mode of ['competence','free']) assert.ok(index.includes(`data-period-mode="${mode}"`));
  assert.ok(index.includes('id="periodCompetenceSelect"'));
  for(const cut of ['month','to-date','first-half','second-half','custom']) assert.ok(index.includes(`data-competence-cut="${cut}"`));
  assert.match(app,/function competencePresetRange\(id,preset='month',target='state'\)/);
  assert.match(app,/analysisPeriodUi\.draftMode='free'/);
  assert.match(css,/\.period-picker-mode-switch\{/);
});

test('modo competência limita o calendário e troca de competência recalcula o recorte',()=>{
  assert.match(app,/function configurePickerBounds\(\)/);
  assert.match(app,/competenceBounds\(analysisPeriodUi\.draftCompetenceId,analysisPeriodUi\.target\)/);
  assert.match(app,/function setPickerDraftFromCompetence\(id,preset=null\)/);
  assert.match(app,/defaultCompetencePreset\(id,analysisPeriodUi\.target\)/);
});

test('intervalo livre preserva períodos de múltiplas competências',()=>{
  assert.match(app,/state\.analysisMode=mode\|\|\(ids\.length>1\?'free':'competence'\)/);
  assert.match(app,/analysisScopeCount\(start,end\)/);
  assert.match(app,/Metas mensais são proporcionadas por competência/);
  assert.match(app,/function periodGoalForTechnician\([\s\S]*?for\(const id of analysisMonthIds\(\)\)/);
});

test('analysisStartDate e analysisEndDate continuam sendo a fonte oficial',()=>{
  assert.match(app,/function commitAnalysisRange\(start,end,preset='custom'/);
  assert.match(app,/state\.analysisStartDate=next\.start;state\.analysisEndDate=next\.end/);
  assert.match(app,/if\(visible\.period\)\{if\(state\.analysisStartDate\)route\.from=state\.analysisStartDate;if\(state\.analysisEndDate\)route\.to=state\.analysisEndDate;\}/);
});

test('drawer mobile também funde competência e período',()=>{
  assert.match(index,/id="mobilePeriodTrigger"[\s\S]*?<span>Período de análise<\/span>/);
  assert.match(app,/mobileCompetenceControl'\)\?\.classList\.toggle\('hidden',!visibility\.competence\|\|visibility\.period\)/);
  assert.match(app,/mode:state\.analysisMode,competenceId:state\.analysisCompetenceId\|\|state\.currentId/);
});

test('hotfix mantém a troca de competência estável dentro da dialog',()=>{
  assert.match(app,/select\.dataset\.optionsKey!==optionsKey/);
  assert.match(app,/select\.value=analysisPeriodUi\.draftCompetenceId/);
  assert.match(app,/competenceSelect\?\.addEventListener\('input',handleCompetenceSelection\)/);
  assert.match(app,/competenceSelect\?\.addEventListener\('change',handleCompetenceSelection\)/);
  assert.match(app,/setPickerDraftFromCompetence\(id\);renderAnalysisPeriodPicker\(\)/);
});
