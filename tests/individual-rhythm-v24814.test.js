const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const styles = readFileSync(join(root, 'css', 'styles.css'), 'utf8');
const finance = readFileSync(join(root, 'js', 'finance-rules.js'), 'utf8');

function individualHtml(){
  const start=index.indexOf('<section id="view-individual"');
  const end=index.indexOf('<section id="view-team"',start);
  return index.slice(start,end);
}

test('V2.48.14 coloca Ritmo do mês antes dos KPIs do período',()=>{
  const html=individualHtml();
  const monthly=html.indexOf('id="monthlyRhythmCard"');
  const period=html.indexOf('id="individualPeriodLabel"');
  const kpis=html.indexOf('class="kpi-grid individual-period-kpis"');
  assert.ok(monthly>=0);
  assert.ok(period>monthly);
  assert.ok(kpis>period);
  assert.match(html,/RITMO DO MÊS/);
  assert.match(html,/Desempenho no período selecionado/);
});

test('V2.48.14 separa valores mensais dos valores do recorte',()=>{
  assert.match(app,/monthlyAttCurrent'\)\.textContent=fmtInt\(t\.att\)/);
  assert.match(app,/monthlyNotesCurrent'\)\.textContent=fmtInt\(t\.notes5\)/);
  assert.match(app,/kpiAtt'\)\.textContent=fmtInt\(period\.att\)/);
  assert.match(app,/kpiNotes'\)\.textContent=fmtInt\(period\.notes5\)/);
  assert.match(index,/Meta proporcional do período:/);
  assert.match(index,/Progresso do mês:/);
  assert.match(index,/Pontuação oficial do mês/);
});

test('V2.48.14 remove redundâncias do período e o card mensal antigo',()=>{
  const html=individualHtml();
  assert.equal(html.includes('Como está o seu ritmo?'),false);
  assert.equal(html.includes('Meta mensal completa'),false);
  const renderStart=app.indexOf('function renderIndividual()');
  const renderEnd=app.indexOf('function technicianStatusAudit',renderStart);
  const render=app.slice(renderStart,renderEnd);
  assert.equal((render.match(/analysisRangeLabel\(\)/g)||[]).length,1,'o intervalo exato deve aparecer uma única vez no bloco principal');
  assert.doesNotMatch(render,/Período analisado:/);
  assert.doesNotMatch(app,/dailySummary'\)\.textContent=`\$\{analysisRangeLabel\(\)\}/);
});

test('V2.48.14 mantém layout responsivo sem mexer no shell global',()=>{
  assert.match(styles,/V2\.48\.14 — Ritmo mensal no topo/);
  assert.match(styles,/\.individual-period-kpis\{margin-top:0;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)\}/);
  assert.match(styles,/@media\(max-width:720px\)[\s\S]*?\.individual-period-kpis\{grid-template-columns:1fr\}/);
  const v24814=styles.slice(styles.indexOf('V2.48.14 — Ritmo mensal no topo'));
  assert.doesNotMatch(v24814,/\.sidebar\s*\{/);
  assert.doesNotMatch(v24814,/\.topbar\s*\{/);
});

test('V2.48.14 é frontend-only e preserva regra financeira',()=>{
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.48.14.sql')),false);
  assert.match(app,/APP_VERSION = '2\.48\.14'/);
  assert.match(index,/V2\.48\.14/);
  assert.match(finance,/FINANCE_RULE_VERSION = 'FR-2\.48\.8-1'/);
});
