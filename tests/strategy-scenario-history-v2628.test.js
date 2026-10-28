const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scenarios=require('../js/strategy-scenarios');
const history=require('../js/strategy-scenario-history');
const root=path.join(__dirname,'..');
function projected(custom={}){
 const economicBase=scenarios.createEconomicBaseline({competence:'2026-10',squadCode:'A',revision:2,sourceAvailable:true,allocationComplete:true,
   totalCost:1000,resultCost:1000,peopleCost:750,operationalCost:250,directRevenue:1400,influencedRevenue:500,protectedRevenue:300});
 const workforceBase=scenarios.createWorkforceBaseline({competence:'2026-10',squadCode:'A',revision:2,fte:5});
 return scenarios.compareScenarios({economicBase,workforceBase,baselineAttendance:500,attendanceSourceAvailable:true,referenceAttendancePerFte:100,capacityReferenceAvailable:true},custom);
}
function saved(revision=1,custom={}){
 const p=history.buildPayload(projected(custom));
 return {id:'id'+revision,scenario_id:'group',revision,competence:'2026-10-01',squad_code:'A',baseline_revision:2,
   assumptions:JSON.parse(JSON.stringify(p.assumptions)),projection:JSON.parse(JSON.stringify(p.projection)),name:'Plano',notes:'Decisao teste',created_at:'2026-10-'+String(revision).padStart(2,'0')+'T10:00:00Z'};
}
test('payload salva todas as premissas e resultados sem mudar comparativo vivo',()=>{
 const compare=projected({directRevenue:20,demandPct:30});const before=JSON.stringify(compare);
 const p=history.buildPayload(compare);
 assert.deepEqual(Object.keys(p.assumptions),['current','optimistic','conservative','custom']);
 assert.equal(p.assumptions.custom.directRevenue,20);assert.equal(p.assumptions.custom.demandPct,30);
 assert.equal(p.projection.scenarios.custom.metrics.directRevenue,1680);
 assert.equal(p.projection.official,false);assert.equal(p.projection.persisted,false);assert.equal(p.baselineRevision,2);
 assert.equal(JSON.stringify(compare),before);
});
test('não aceita comparação sem alternativas nem escopo válido',()=>{
 assert.throws(()=>history.buildPayload({competence:'2026-13',squadCode:'A'}),/inválido/);
 assert.throws(()=>history.buildPayload({competence:'2026-10',squadCode:'A',scenarios:{}}),/incompleto/);
});
test('revisões append-only podem ser comparadas sem recalcular a base oficial',()=>{
 const v1=saved(1),v2=saved(2,{directRevenue:20,demandPct:30});
 const before=JSON.stringify(v1);const result=history.compare(v1,v2,'custom');
 assert.equal(result.scenario,'custom');assert.equal(result.left.revision,1);assert.equal(result.right.revision,2);
 assert.equal(result.metrics.find(x=>x.key==='directRevenue').delta,280);
 assert.equal(result.metrics.find(x=>x.key==='attendance').delta,150);
 assert.equal(JSON.stringify(v1),before);
});
test('apenas as projeções, e não receitas influenciadas/protegidas, determinam ROI direto',()=>{
 const a=saved(1),b=saved(2,{influencedRevenue:60,protectedRevenue:30});
 const comparison=history.compare(a,b);
 assert.equal(comparison.metrics.find(x=>x.key==='directRoiPct').delta,0);
 assert.ok(comparison.metrics.find(x=>x.key==='influencedRevenue').delta>0);
});
test('histórico rejeita ROI omitido de projeção financeiramente disponível',()=>{
 const a=saved(1),b=saved(2);a.projection.scenarios.custom.metrics.directRoiPct=null;
 assert.throws(()=>history.compare(a,b),/ROI direto|Diferença/);
});
test('recusa projeção de outro escopo ou alternativa inválida',()=>{
 const a=saved(1),b=saved(2);b.squad_code='B';b.projection.squadCode='B';assert.throws(()=>history.compare(a,b),/diferentes/);
 b.squad_code='A';b.projection.squadCode='A';assert.throws(()=>history.compare(a,b,'banana'),/inválido/);
});
test('validação recusa histórico com origem adulterada ou faltando métricas',()=>{
 const a=saved(1);a.projection.competence='2026-09';assert.throws(()=>history.validateRevision(a),/inconsistentes/);
 const b=saved(1);delete b.projection.scenarios.custom.metrics;assert.throws(()=>history.validateRevision(b),/inconsistentes/);
});
test('lista filtra escopo e ordena revisões sem editar os originais',()=>{
 const a=saved(1),b=saved(2),c=saved(3);c.squad_code='B';
 const rows=history.normalizeHistory([a,c,b],'2026-10','a');assert.deepEqual(rows.map(r=>r.revision),[2,1]);
 assert.equal(a.revision,1);
});
test('SQL habilita apenas leitura sob RLS com escrita por RPC protegida e sem UPDATE ou DELETE',()=>{
 const sql=fs.readFileSync(path.join(root,'supabase/migrations/MIGRACAO_V2.62.8.sql'),'utf8');
 assert.match(sql,/alter table public\.strategy_scenario_revisions enable row level security/i);
 assert.match(sql,/grant select on public\.strategy_scenario_revisions to authenticated/i);
 assert.match(sql,/has_strategy_access\('aggregates'\)/);
 assert.match(sql,/has_strategy_access\('edit_costs'\)/);
 assert.match(sql,/has_strategy_access\('people_costs'\)/);
 assert.match(sql,/security definer set search_path=public/i);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/unique \(organization_id,scenario_id,revision\)/);
 assert.doesNotMatch(sql,/grant\s+(?:insert|update|delete|all)\s+on\s+public\.strategy_scenario_revisions\s+to\s+authenticated/i);
 assert.match(sql,/revoke all on public\.strategy_scenario_revisions from public,anon,authenticated/i);
});
test('SQL garante escopo da organização, competência e revisão-base',()=>{
 const sql=fs.readFileSync(path.join(root,'supabase/migrations/MIGRACAO_V2.62.8.sql'),'utf8');
 assert.match(sql,/organization_id=v_org and competence=p_competence/);
 assert.match(sql,/v_group\.competence<>p_competence or v_group\.squad_code<>v_squad/);
 assert.match(sql,/p_projection->>'competence'/);
 assert.match(sql,/p_projection->>'squadCode'/);
 assert.match(sql,/p_baseline_revision/);
});
test('interface fornece salvamento, revisão, comparação e recuperação explícitas',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
 assert.match(index,/id="scenarioHistorySaveBtn"/);assert.match(index,/id="scenarioHistoryGroup"/);
 assert.match(index,/id="scenarioHistoryLeft"/);assert.match(index,/id="scenarioHistoryRight"/);
 assert.match(index,/js\/strategy-scenario-history\.js\?v=2\.63\.0-r3/);
 assert.match(app,/save_strategy_scenario_revision/);assert.match(app,/loadStrategyScenarioHistory/);assert.match(app,/restoreStrategyScenarioHistory/);
 assert.match(app,/escapeHtml\(row\.name\)/);assert.match(app,/scenarioHistoryState\.lastProjection=compared/);
 assert.match(app,/strategyEditAccess\(\)/);
});
