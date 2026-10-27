const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const e=require('../js/strategy-scenarios');
function fixture(extra={}){
 const economicBase=e.createEconomicBaseline({competence:'2026-10',squadCode:'A',revision:3,sourceAvailable:true,allocationComplete:true,
 totalCost:2000,resultCost:2000,peopleCost:1500,operationalCost:500,directRevenue:3000,influencedRevenue:4000,protectedRevenue:5000,...extra});
 const workforceBase=e.createWorkforceBaseline({competence:'2026-10',squadCode:'A',revision:3,fte:10});
 return {economicBase,workforceBase,baselineAttendance:1000,attendanceSourceAvailable:true,referenceAttendancePerFte:100,capacityReferenceAvailable:true};
}
test('retorna exatamente quatro colunas e permanece imutável sem persistência',()=>{
 const output=e.compareScenarios(fixture());
 assert.deepEqual(output.order,['current','optimistic','conservative','custom']);
 assert.equal(output.persisted,false);assert.equal(output.official,false);
 assert.ok(Object.isFrozen(output));assert.ok(Object.isFrozen(output.scenarios));
 assert.ok(Object.isFrozen(output.scenarios.optimistic.metrics));
});
test('cenário atual reproduz a base e deltas zerados',()=>{
 const out=e.compareScenarios(fixture()),actual=out.scenarios.current;
 assert.equal(actual.metrics.attendance,1000);assert.equal(actual.metrics.availableFte,10);
 assert.equal(actual.metrics.requiredFte,10);assert.equal(actual.metrics.utilizationPct,100);
 assert.equal(actual.metrics.directRevenue,3000);assert.equal(actual.metrics.totalCost,2000);
 assert.equal(actual.metrics.directNet,1000);assert.equal(actual.metrics.directRoiPct,50);
 assert.equal(out.delta.current.directNet,0);
});
test('cenário otimista projeta demanda e FTE, mas mantém ROI independente da demanda',()=>{
 const out=e.compareScenarios(fixture()),good=out.scenarios.optimistic;
 assert.equal(good.metrics.attendance,1150);assert.equal(good.metrics.availableFte,11);
 assert.equal(good.metrics.requiredFte,11.5);assert.equal(good.metrics.overloadFte,0.5);
 assert.equal(good.metrics.directRevenue,3360);
 assert.equal(good.metrics.totalCost,2070);
 assert.equal(good.metrics.directNet,1290);
 assert.equal(good.metrics.influencedRevenue,4400);assert.equal(good.metrics.protectedRevenue,5250);
 assert.ok(Math.abs(good.metrics.directRoiPct-1290/2070*100)<1e-8);
});
test('cenário conservador não é inferência de risco ou previsão probabilística',()=>{
 const out=e.compareScenarios(fixture()),bad=out.scenarios.conservative;
 assert.equal(bad.metrics.attendance,900);assert.equal(bad.metrics.availableFte,10);
 assert.equal(bad.metrics.idleFte,1);assert.equal(bad.metrics.overloadFte,0);
 assert.equal(bad.metrics.directRevenue,2700);assert.equal(bad.metrics.totalCost,2115);
 assert.equal(bad.metrics.directNet,585);
});
test('personalizado permite demanda, jornada, contratações e receita independentes',()=>{
 const out=e.compareScenarios(fixture(),{demandPct:50,hires:2,currentHours:44,newHours:40,directRevenue:0,peopleCost:10});
 const row=out.scenarios.custom.metrics;
 assert.equal(row.attendance,1500);
 assert.ok(Math.abs(row.availableFte-(12*40/44))<1e-8);
 assert.equal(row.directRevenue,3000);
 assert.equal(row.peopleCost,1650);
 assert.equal(row.totalCost,2150);
 assert.equal(row.directNet,850);
});
test('receita influenciada ou protegida não modifica retorno líquido e ROI',()=>{
 const out=e.compareScenarios(fixture(),{influencedRevenue:300,protectedRevenue:200});
 assert.equal(out.scenarios.custom.metrics.directNet,out.scenarios.current.metrics.directNet);
 assert.equal(out.scenarios.custom.metrics.directRoiPct,out.scenarios.current.metrics.directRoiPct);
 assert.equal(out.scenarios.custom.metrics.influencedRevenue,16000);
 assert.equal(out.scenarios.custom.metrics.protectedRevenue,15000);
});
test('se só o financeiro estiver incompleto, capacidade e demanda continuam calculadas',()=>{
 const out=e.compareScenarios(fixture({resultCost:1950}));
 assert.equal(out.scenarios.current.status.economic,'insufficient_data');
 assert.equal(out.scenarios.custom.metrics.totalCost,null);
 assert.equal(out.scenarios.current.metrics.attendance,1000);
 assert.equal(out.scenarios.current.metrics.utilizationPct,100);
 assert.equal(out.delta.custom.directRoiPct,null);
});
test('se o FTE ou histórico faltar, financeiro segue disponível e não inventa utilização',()=>{
 const input=fixture();input.workforceBase=e.createWorkforceBaseline({competence:'2026-10',squadCode:'A',revision:3,fte:null});
 const out=e.compareScenarios(input);
 assert.equal(out.scenarios.current.metrics.availableFte,null);
 assert.equal(out.scenarios.current.metrics.utilizationPct,null);
 assert.equal(out.scenarios.current.metrics.totalCost,2000);
});
test('escopo e revisão incompatíveis bloqueiam colunas',()=>{
 const input=fixture();input.workforceBase=e.createWorkforceBaseline({competence:'2026-10',squadCode:'B',revision:3,fte:10});
 assert.throws(()=>e.compareScenarios(input),/Squad/);
 input.workforceBase=e.createWorkforceBaseline({competence:'2026-10',squadCode:'A',revision:1,fte:10});
 assert.throws(()=>e.compareScenarios(input),/revisão/);
});
test('variações inválidas são rejeitadas e movimentações inválidas não derrubam os demais cenários',()=>{
 assert.throws(()=>e.compareScenarios(fixture(),{directRevenue:301}),RangeError);
 assert.throws(()=>e.compareScenarios(fixture(),{demandPct:'abc'}),RangeError);
 const out=e.compareScenarios(fixture(),{exits:100});
 assert.equal(out.scenarios.custom.metrics.availableFte,null);
 assert.equal(out.scenarios.custom.metrics.totalCost,2000);
 assert.equal(out.scenarios.current.metrics.availableFte,10);
 assert.ok(out.scenarios.custom.issues.some(issue=>/excedem/.test(issue)));
});
test('escopo todos os Squads ignora transferência interna no FTE total',()=>{
 const input=fixture(); input.economicBase=e.createEconomicBaseline({...input.economicBase.amounts,
 competence:'2026-10',squadCode:'all',revision:3,sourceAvailable:true,allocationComplete:true,resultCost:2000});
 input.workforceBase=e.createWorkforceBaseline({competence:'2026-10',squadCode:'all',revision:3,fte:10});
 const out=e.compareScenarios(input,{transfersIn:3,transfersOut:2});
 assert.equal(out.scenarios.custom.metrics.availableFte,10);
});
test('custo zero deve gerar ROI indisponível sem infinito',()=>{
 const out=e.compareScenarios(fixture(),{peopleCost:-100,operationalCost:-100});
 assert.equal(out.scenarios.custom.metrics.totalCost,0);
 assert.equal(out.scenarios.custom.metrics.directRoiPct,null);
});
test('UI e listeners do comparativo estão conectados ao motor, escopo e versão',()=>{
 const root=path.join(__dirname,'..'),index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
 assert.match(index,/option value="comparison"/);
 assert.match(index,/id="strategyScenarioComparisonSection"/);
 assert.match(index,/id="scenarioComparisonRows"/);
 assert.match(index,/data-scenario-comparison="directRevenue"/);
 assert.match(index,/data-scenario-comparison="newHours"/);
 assert.match(app,/compareScenarios/);
 assert.match(app,/strategyScenarioComparisonSection input/);
 assert.match(app,/strategyCapacityAttendanceReference/);
});
