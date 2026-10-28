const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const result=require(join(root,'js','strategy-result.js'));
const data=require(join(root,'js','strategy-data.js'));
const strategy=require(join(root,'js','strategy.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.4.sql'),'utf8');

test('V2.60.4 publica Resultado por técnico e atualiza motor',()=>{
  assert.equal(pkg.version,'2.63.0');
  assert.equal(pkg.assetVersion,'2.63.0-r3');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.equal(result.buildFoundation({aggregate:{sourceAvailable:true}}).catalog.find(x=>x.id==='result-by-technician').status,'ready');
  assert.ok(existsSync(join(root,'docs','RESULTADO_TECNICO_V2.60.4.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.4.sql')));
  assert.match(index,/V2\.60\.4 • RESULTADO POR TÉCNICO/);
  assert.ok(index.includes('js/strategy-result.js?v=2.63.0-r3'));
});

test('motor mantém as três naturezas separadas por técnico',()=>{
  const vm=result.buildTechnicianResults({scope:{competence:'2026-10',squadCode:'D'},aggregate:{
    source_available:true,technician_count:2,participation_count:5,credited_event_count:4,
    direct_revenue:1200,influenced_revenue:5000,protected_revenue:2400,direct_mrr:300,influenced_mrr:700,protected_mrr:450,
    rows:[
      {technician_key:'1',technician_name:'Ana',squad_code:'D',participation_count:3,credited_event_count:3,direct_event_count:1,direct_revenue:1200,direct_mrr:300,influenced_event_count:1,influenced_revenue:2000,influenced_mrr:400,protected_event_count:1,protected_revenue:800,protected_mrr:200},
      {technician_key:'2',technician_name:'Bruno',squad_code:'D',participation_count:2,credited_event_count:1,influenced_event_count:1,influenced_revenue:3000,influenced_mrr:300,protected_event_count:1,protected_revenue:1600,protected_mrr:250}
    ]
  }});
  assert.equal(vm.status,'ready');
  assert.equal(vm.directRevenue,1200);
  assert.equal(vm.influencedRevenue,5000);
  assert.equal(vm.protectedRevenue,2400);
  assert.equal(vm.rows[0].technicianName,'Ana');
  assert.equal(vm.rows[0].directRevenue,1200);
  assert.ok(vm.warnings.some(x=>/não formam um total econômico único/i.test(x)));
});

test('normalização individual não aceita valores negativos',()=>{
  const row=result.normalizeTechnicianResultRow({technician_key:'x',technician_name:'Teste',direct_revenue:-10,influenced_revenue:-20,protected_mrr:-5,participation_count:-1});
  assert.equal(row.directRevenue,0);
  assert.equal(row.influencedRevenue,0);
  assert.equal(row.protectedMrr,0);
  assert.equal(row.participationCount,0);
});

test('contexto financeiro preserva Resultado por técnico e protegido',()=>{
  const ctx=data.buildFinancialContext({
    resultProtectedRevenue:{source_available:true,protected_mrr:900,types:[]},
    resultTechnician:{source_available:true,technician_count:1,direct_revenue:500,rows:[{technician_key:'p1',person_id:'p1',technician_name:'Ana',squad_code:'D',direct_revenue:500}]}
  });
  assert.equal(ctx.resultProtectedRevenue.protectedMrr,900);
  assert.equal(ctx.resultTechnician.sourceAvailable,true);
  assert.equal(ctx.resultTechnician.technicianCount,1);
  assert.equal(ctx.resultTechnician.rows[0].directRevenue,500);
});

test('controller expõe Receita Protegida e Resultado por técnico no view model',()=>{
  const controller=strategy.createController({access:{canViewStrategy:true,canViewPeopleCosts:true}});
  controller.initializeContext({squads:{D:{code:'D',name:'Delta',months:{'2026-10':{}}}}});
  controller.setFinancialData({competences:[{competence:'2026-10'}],resultProtectedRevenue:{sourceAvailable:true,protectedMrr:100},resultTechnician:{sourceAvailable:true,technicianCount:1,rows:[]}});
  const vm=controller.viewModel();
  assert.equal(vm.financial.resultProtectedRevenue.protectedMrr,100);
  assert.equal(vm.financial.resultTechnician.technicianCount,1);
});

test('migration protege soma de shares explícitos acima de 100%',()=>{
  assert.match(migration,/validate_strategy_result_attribution_share_total/i);
  assert.match(migration,/v_total>1\.000001/i);
  assert.match(migration,/attribution shares exceed 100%%/i);
  assert.match(migration,/before insert or update of event_id,attribution_share/i);
});

test('RPC calcula share efetivo sem redistribuir após filtro de Squad',()=>{
  assert.match(migration,/sum\(coalesce\(a\.attribution_share,0\)\) over\(partition by a\.event_id\)/i);
  assert.match(migration,/count\(\*\) filter \(where a\.attribution_share is null\) over\(partition by a\.event_id\)/i);
  assert.match(migration,/greatest\(0,1-least\(1,a\.explicit_share_sum\)\)\/a\.null_share_count/i);
  assert.match(migration,/scoped as \(\s*select \*\s*from credited\s*where v_all or upper/i);
});

test('RPC inclui apenas eventos econômicos válidos por natureza',()=>{
  assert.match(migration,/e\.result_type='direct' and e\.status='confirmed'/i);
  assert.match(migration,/e\.result_type='influenced' and e\.status='confirmed'/i);
  assert.match(migration,/e\.result_type='protected' and e\.status='confirmed' and e\.protection_verified_at is not null and e\.protection_lost_at is null/i);
  assert.doesNotMatch(migration,/direct_revenue[^\n]*\+[^\n]*influenced_revenue/i);
});

test('RPC individual exige permissão people_costs',()=>{
  assert.match(migration,/get_strategy_result_technician_summary/i);
  assert.match(migration,/has_strategy_access\('people_costs'\)/i);
  assert.match(migration,/strategy people result access denied/i);
});

test('app carrega e renderiza Resultado por técnico sem ranking composto',()=>{
  assert.match(app,/get_strategy_result_technician_summary/);
  assert.match(app,/function renderStrategyTechnicianResults\(/);
  assert.match(app,/strategyResultEngine\.buildTechnicianResults/);
  assert.match(index,/Sem ranking composto/);
  assert.match(index,/Direta atribuída/);
  assert.match(index,/Influenciada atribuída/);
  assert.match(index,/Protegida atribuída/);
});
