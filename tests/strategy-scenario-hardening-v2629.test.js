'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../js/strategy-scenarios');
const history=require('../js/strategy-scenario-history');
const root=path.join(__dirname,'..');
const sql=fs.readFileSync(path.join(root,'supabase/migrations/MIGRACAO_V2.62.9.sql'),'utf8');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
function comparison(custom={},config={}){
  const scope={competence:'2026-10',squadCode:config.squadCode||'A',revision:4};
  const financial=engine.createEconomicBaseline({...scope,sourceAvailable:config.noMoney!==true,allocationComplete:true,
    totalCost:10000,resultCost:10000,peopleCost:7000,operationalCost:3000,
    directRevenue:12000,influencedRevenue:4000,protectedRevenue:2500});
  const workforce=engine.createWorkforceBaseline({...scope,fte:8});
  return engine.compareScenarios({economicBase:financial,workforceBase:workforce,
    baselineAttendance:800,attendanceSourceAvailable:config.noDemand!==true,
    referenceAttendancePerFte:100,capacityReferenceAvailable:config.noCapacity!==true},custom);
}
function revision(comp){
  const payload=history.buildPayload(comp);
  return {id:'00000000-0000-0000-0000-000000000001',scenario_id:'00000000-0000-0000-0000-000000000002',
    revision:1,competence:'2026-10-01',squad_code:comp.squadCode,baseline_revision:comp.revision,
    assumptions:JSON.parse(JSON.stringify(payload.assumptions)),projection:JSON.parse(JSON.stringify(payload.projection))};
}
function modified(fn){const comp=JSON.parse(JSON.stringify(comparison()));fn(comp);return comp;}
test('hardening aprova projeções regulares e mantém as quatro alternativas',()=>{
 const c=comparison({hires:2,demandPct:35,newHours:40,currentHours:44,peopleCost:15,directRevenue:18});
 assert.equal(history.validateProjection(c),c);
 const saved=revision(c);assert.equal(history.validateRevision(saved),saved);
});
test('projeção não muta as bases ao criar revisões históricas',()=>{
 const c=comparison({directRevenue:9});const before=JSON.stringify(c);const p=history.buildPayload(c);
 assert.equal(JSON.stringify(c),before);assert.equal(Object.isFrozen(p.projection),true);
 assert.equal(Object.isFrozen(p.projection.scenarios.custom.metrics),true);
 assert.equal(Object.isFrozen(p.assumptions.custom),true);
});
test('validação impede total de custos falsificado',()=>{
 const c=modified(c=>c.scenarios.custom.metrics.totalCost+=50);
 assert.throws(()=>history.buildPayload(c),/Custos financeiros|Diferença/);
});
test('validação impede retorno líquido inconsistente',()=>{
 const c=modified(c=>{c.scenarios.custom.metrics.directNet+=200;c.delta.custom.directNet+=200});
 assert.throws(()=>history.buildPayload(c),/Resultado líquido/);
});
test('validação impede ROI calculado sobre receita influenciada',()=>{
 const c=modified(c=>{c.scenarios.custom.metrics.directRoiPct+=10;c.delta.custom.directRoiPct+=10});
 assert.throws(()=>history.buildPayload(c),/ROI/);
});
test('custo zero exige ROI indisponível',()=>{
 const c=comparison({peopleCost:-100,operationalCost:-100});
 assert.equal(c.scenarios.custom.metrics.totalCost,0);
 assert.equal(c.scenarios.custom.metrics.directRoiPct,null);
 assert.equal(history.validateProjection(c),c);
 const bad=JSON.parse(JSON.stringify(c));bad.scenarios.custom.metrics.directRoiPct=0;bad.delta.custom.directRoiPct=0;
 assert.throws(()=>history.buildPayload(bad),/ROI|Diferença/);
});
test('ROI só pode estar ausente quando não houver fonte ou custo zero',()=>{
 const c=modified(c=>{c.scenarios.custom.metrics.directRoiPct=null;c.delta.custom.directRoiPct=null});
 assert.throws(()=>history.buildPayload(c),/ROI direto obrigatório/);
});
test('validação impede gap de FTE incoerente',()=>{
 const c=modified(c=>{c.scenarios.custom.metrics.gapFte+=1;c.delta.custom.gapFte+=1});
 assert.throws(()=>history.buildPayload(c),/Gap de FTE/);
});
test('validação impede ociosidade e sobrecarga não conciliadas',()=>{
 const c=modified(c=>{c.scenarios.custom.metrics.overloadFte+=3;c.delta.custom.overloadFte+=3});
 assert.throws(()=>history.buildPayload(c),/Ociosidade ou sobrecarga/);
});
test('validação impede utilização incompatível com FTE disponível',()=>{
 const c=modified(c=>{c.scenarios.custom.metrics.utilizationPct+=5;c.delta.custom.utilizationPct+=5});
 assert.throws(()=>history.buildPayload(c),/Utilização inconsistente/);
});
test('validação rejeita delta falsificado mesmo quando métrica não mudou',()=>{
 const c=modified(c=>{c.delta.custom.directRevenue=1000});
 assert.throws(()=>history.buildPayload(c),/Diferença incompatível/);
});
test('null permanece null em fontes parciais, nunca zero implícito',()=>{
 const c=comparison({}, {noMoney:true,noCapacity:true});
 assert.equal(c.scenarios.custom.metrics.directRevenue,null);
 assert.equal(c.scenarios.custom.metrics.directRoiPct,null);
 assert.equal(c.scenarios.custom.metrics.requiredFte,null);
 assert.equal(history.validateProjection(c),c);
 const first=revision(c),second=revision(comparison());
 const diff=history.compare(first,second);
 assert.equal(diff.metrics.find(m=>m.key==='directRevenue').delta,null);
});
test('alternativa ausente ou moeda negativa são rejeitadas',()=>{
 assert.throws(()=>history.buildPayload(modified(c=>delete c.scenarios.optimistic.metrics)),/incompleta/);
 assert.throws(()=>history.buildPayload(modified(c=>{c.scenarios.custom.metrics.peopleCost=-1;c.delta.custom.peopleCost=-7001})),/Métrica inválida/);
});
test('premissas violadas são bloqueadas mesmo quando a métrica parece plausível',()=>{
 for(const change of [
  c=>{c.scenarios.custom.assumptions.hires=1.5},
  c=>{c.scenarios.custom.assumptions.demandPct=301},
  c=>{c.scenarios.custom.assumptions.newHours=0}
 ])assert.throws(()=>history.buildPayload(modified(change)),/inválid|inválida/i);
});
test('histórico detecta troca de revisão-base e premissas de forma independente',()=>{
 const a=revision(comparison());a.baseline_revision=7;
 assert.throws(()=>history.validateRevision(a),/inconsistentes/);
 const b=revision(comparison());b.assumptions.custom.hires=9;
 assert.throws(()=>history.validateRevision(b),/Premissas arquivadas/);
});
test('cenário Global não recebe FTE fictício de transferências internas',()=>{
 const c=comparison({transfersIn:3,transfersOut:1},{squadCode:'all'});
 assert.equal(c.scenarios.custom.metrics.availableFte,c.scenarios.current.metrics.availableFte);
 assert.equal(history.validateProjection(c),c);
});
test('propriedades financeiras e de capacidade resistem a série determinística de hipóteses',()=>{
 for(let i=0;i<64;i++){
  const c=comparison({demandPct:i-20,directRevenue:(i%25)-10,peopleCost:i%17,operationalCost:i%11,
   hires:i%5,exits:i%3,newHours:40+(i%5),currentHours:44});
  assert.equal(history.validateProjection(c),c);
  for(const id of history.SCENARIOS){
   const m=c.scenarios[id].metrics;
   if(m.totalCost!==null){assert.ok(Math.abs(m.peopleCost+m.operationalCost-m.totalCost)<=0.075);assert.ok(Math.abs(m.directRevenue-m.totalCost-m.directNet)<=0.075)}
   if(m.gapFte!==null){assert.ok(Math.abs(m.availableFte-m.requiredFte-m.gapFte)<=0.00001)}
  }
 }
});
test('migration impõe validação de escopo, RLS e direitos de gravação',()=>{
 assert.match(sql,/new\.organization_id is distinct from \(public\.current_profile\(\)\)\.organization_id/);
 assert.match(sql,/public\.has_strategy_access\('aggregates'\)/);
 assert.match(sql,/public\.has_strategy_access\('edit_costs'\)/);
 assert.match(sql,/public\.has_strategy_access\('people_costs'\)/);
 assert.match(sql,/new\.created_by is distinct from auth\.uid\(\)/);
 assert.match(sql,/c\.organization_id = new\.organization_id/);
 assert.match(sql,/revoke insert,update,delete,truncate on public\.strategy_scenario_revisions/);
});
test('migration impõe fórmulas de ROI, custos, capacidade e diferenças históricas',()=>{
 assert.match(sql,/v_total-\(\(v_metrics->>'peopleCost'\)/);
 assert.match(sql,/v_direct-v_total/);
 assert.match(sql,/ROI direto nao conciliado/);
 assert.match(sql,/v_gap-\(v_fte-v_required\)/);
 assert.match(sql,/Delta incompativel com a base atual/);
 assert.match(sql,/v_assumptions is distinct from v_reference/);
});
test('migration é transacional, append-only e preserva revisões antigas',()=>{
 assert.match(sql,/^begin;/mi);assert.match(sql,/^commit;/mi);
 assert.match(sql,/before insert or update or delete on public\.strategy_scenario_revisions/);
 assert.match(sql,/tg_op <> 'INSERT'/);
 assert.match(sql,/alter column rule_version set default 'SC-HISTORY-1\.1\.0'/);
 assert.doesNotMatch(sql,/\btruncate table\b|\bdrop table\b|\bdelete from public\.strategy_scenario_revisions\b/i);
});
test('frontend bloqueia salvamento duplicado e respostas obsoletas por alteração de acesso',()=>{
 assert.match(app,/scenarioHistoryState\.saving/);
 assert.match(app,/if\(scenarioHistoryState\.saving\)return/);
 assert.match(app,/\+\+scenarioHistoryState\.run;scenarioHistoryState\.rows=\[\];scenarioHistoryState\.lastProjection=null/);
 assert.match(app,/scenarioHistoryState\.saving=false;renderStrategyScenarioHistory/);
});
test('versões e cache bust estão coerentes e sem nova migração de dados oficiais',()=>{
 const pkg=require('../package.json');const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.equal(pkg.version,'2.63.0');assert.equal(pkg.assetVersion,'2.63.0-r1');
 assert.match(index,/js\/strategy-scenario-history\.js\?v=2\.63\.0-r1/);
 assert.doesNotMatch(sql,/update\s+public\.strategy_competences|delete\s+from\s+public\.strategy_employee_costs/i);
});
