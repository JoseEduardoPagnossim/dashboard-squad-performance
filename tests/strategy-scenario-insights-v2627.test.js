const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scenarios=require('../js/strategy-scenarios');
const insights=require('../js/strategy-scenario-insights');
function fixture(opts={}){
  const economicBase=scenarios.createEconomicBaseline({competence:'2026-10',squadCode:'A',revision:3,sourceAvailable:true,allocationComplete:true,
    totalCost:2000,resultCost:2000,peopleCost:1500,operationalCost:500,directRevenue:3000,influencedRevenue:4000,protectedRevenue:5000,...(opts.economic||{})});
  const workforceBase=scenarios.createWorkforceBaseline({competence:'2026-10',squadCode:'A',revision:3,fte:opts.fte===undefined?10:opts.fte});
  return scenarios.compareScenarios({economicBase,workforceBase,baselineAttendance:opts.attendance===undefined?1000:opts.attendance,
    attendanceSourceAvailable:opts.attendanceAvailable!==false,referenceAttendancePerFte:opts.reference===undefined?100:opts.reference,
    capacityReferenceAvailable:opts.referenceAvailable!==false},opts.custom||{});
}
const has=(out,scenario,code)=>out.items.some(item=>item.scenario===scenario&&item.code===code);
test('insights são isolados, não oficiais, imutáveis e preservam escopo e revisão',()=>{
  const input=fixture(),before=JSON.stringify(input),out=insights.analyze(input);
  assert.equal(out.ruleVersion,'SC-INSIGHTS-1.0.0');assert.equal(out.persisted,false);assert.equal(out.official,false);
  assert.equal(out.competence,'2026-10');assert.equal(out.squadCode,'A');assert.equal(out.revision,3);
  assert.equal(JSON.stringify(input),before);assert.ok(Object.isFrozen(out));assert.ok(Object.isFrozen(out.items));
  assert.ok(out.items.length>0);assert.ok(Object.isFrozen(out.items[0]));assert.ok(Object.isFrozen(out.items[0].evidence));
});
test('cenário otimista com demanda acima da capacidade gera evidência de sobrecarga',()=>{
  const out=insights.analyze(fixture());assert.equal(has(out,'optimistic','overload'),true);
  const card=out.items.find(r=>r.code==='overload'&&r.scenario==='optimistic');
  assert.equal(card.kind,'critical');assert.ok(card.evidence.some(r=>r.label==='Sobrecarga'&&Math.abs(r.value-0.5)<0.01));
});
test('cenário conservador detecta queda econômica e aumento de custo com menor demanda',()=>{
  const out=insights.analyze(fixture());assert.ok(has(out,'conservative','net-down'));
  assert.ok(has(out,'conservative','cost-demand'));
});
test('resultado melhora mas sobrecarga continua: compensação explícita',()=>{
  const out=insights.analyze(fixture());assert.ok(has(out,'optimistic','profit-overload'));
  assert.ok(has(out,'optimistic','net-up'));
});
test('alívio da sobrecarga é oportunidade quando existe déficit na base',()=>{
  const out=insights.analyze(fixture({attendance:1200,custom:{hires:5}}));
  assert.ok(has(out,'custom','relief'));
});
test('ociosidade de vinte por cento é atenção, sem inferir desligamento',()=>{
  const out=insights.analyze(fixture({custom:{demandPct:-30}}));
  assert.ok(has(out,'custom','idle'));assert.equal(out.items.find(r=>r.code==='idle'&&r.scenario==='custom').kind,'attention');
});
test('receita direta crescente com lucro decrescente é compensação, não oportunidade inventada',()=>{
  const out=insights.analyze(fixture({custom:{directRevenue:5,peopleCost:30}}));
  assert.ok(has(out,'custom','sales-net'));assert.ok(!has(out,'custom','net-up'));
});
test('custo direto negativo e custo zero produzem sinais sem inventar ROI',()=>{
  const bad=insights.analyze(fixture({custom:{directRevenue:-100}}));assert.ok(has(bad,'custom','loss'));
  const zero=insights.analyze(fixture({custom:{peopleCost:-100,operationalCost:-100}}));
  assert.ok(zero.items.every(card=>card.evidence.every(r=>r.value===null||Number.isFinite(r.value))));
});
test('receita influenciada e protegida não entram no ROI, com aviso específico',()=>{
  const out=insights.analyze(fixture({custom:{influencedRevenue:100,protectedRevenue:50}}));
  assert.ok(has(out,'custom','revenue-types'));
  assert.equal(out.items.find(r=>r.code==='revenue-types'&&r.scenario==='custom').kind,'information');
});
test('contratações sem ajuste salarial automático geram aviso de premissas independentes',()=>{
  const out=insights.analyze(fixture());assert.ok(has(out,'optimistic','headcount-expense'));
  const card=out.items.find(r=>r.scenario==='optimistic'&&r.code==='headcount-expense');
  assert.match(card.action,/custos de contratação/);
});
test('dados econômicos faltantes não produzem sinais de lucro e preservam capacidade',()=>{
  const out=insights.analyze(fixture({economic:{resultCost:1900}}));
  assert.ok(has(out,'optimistic','overload'));assert.ok(has(out,'optimistic','missing'));
  assert.ok(!out.items.some(r=>r.dimension==='economic'&&r.code==='net-up'));
});
test('produtividade histórica ausente impede qualquer diagnóstico de utilização',()=>{
  const out=insights.analyze(fixture({referenceAvailable:false}));
  assert.ok(!out.items.some(r=>['overload','idle','profit-overload','relief'].includes(r.code)));
  assert.ok(has(out,'custom','missing'));
});
test('FTE ausente não é interpretado como sobrecarga zero e não elimina sinais financeiros',()=>{
  const out=insights.analyze(fixture({fte:null,custom:{directRevenue:-30}}));
  assert.ok(!out.items.some(r=>r.code==='overload'));
  assert.ok(has(out,'custom','net-down'));
});
test('filtros por cenário e tipo preservam os contadores totais',()=>{
  const compared=fixture(),all=insights.analyze(compared);
  const filtered=insights.analyze(compared,{scenario:'optimistic',kind:'tradeoff'});
  assert.equal(filtered.total,all.total);assert.deepEqual(filtered.counts,all.counts);
  assert.ok(filtered.items.every(item=>item.scenario==='optimistic'&&item.kind==='tradeoff'));
  assert.throws(()=>insights.analyze(compared,{kind:'banana'}),/inválido/);
  assert.throws(()=>insights.analyze(compared,{scenario:'current'}),/inválido/);
});
test('identificadores e prioridades são determinísticos sem cartões duplicados',()=>{
  const compared=fixture(),first=insights.analyze(compared),second=insights.analyze(compared);
  assert.deepEqual(first.items,second.items);assert.equal(new Set(first.items.map(item=>item.id)).size,first.items.length);
  assert.ok(first.items.every((item,i)=>i===0||insights.PRIORITY[first.items[i-1].kind]<=insights.PRIORITY[item.kind]));
});
test('contrato UI integra motor, segurança por escape, listeners e versões',()=>{
  const root=path.join(__dirname,'..');const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');const css=fs.readFileSync(path.join(root,'css/strategy.css'),'utf8');
  const pkg=require('../package.json');assert.equal(pkg.version,'2.63.5');assert.equal(pkg.assetVersion,'2.63.5-r1');
  assert.match(index,/id="strategyScenarioInsightsSection"/);assert.match(index,/id="scenarioInsightsScenario"/);
  assert.match(index,/id="scenarioInsightsKind"/);assert.match(index,/js\/strategy-scenario-insights\.js\?v=2\.63\.5-r1/);
  assert.match(app,/insightEngine\.analyze\(compared/);assert.match(app,/escapeHtml\(item\.title\)/);
  assert.match(app,/scenarioInsightsScenario, #view-strategy #scenarioInsightsKind/);
  assert.match(css,/strategy-scenario-insight-card/);
});
