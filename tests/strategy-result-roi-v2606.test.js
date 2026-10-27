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
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.6.sql'),'utf8');

test('V2.60.6 publica ROI e retorno operacional',()=>{
  assert.equal(pkg.version,'2.61.8');
  assert.equal(pkg.assetVersion,'2.61.8-r1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.equal(result.CATALOG.find(item=>item.id==='result-roi')?.state,'ready');
  assert.ok(existsSync(join(root,'docs','RESULTADO_ROI_RETORNO_V2.60.6.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.6.sql')));
  assert.match(index,/V2\.60\.6 • ROI E RETORNO OPERACIONAL/);
  assert.ok(index.includes('js/strategy-result.js?v=2.61.8-r1'));
});

test('motor calcula ROI direto, retorno líquido e cobertura sem misturar naturezas',()=>{
  const vm=result.buildOperationalReturn({scope:{competence:'2026-10'},aggregate:{source_available:true,total_cost:1000,fte:2,direct_revenue:1500,influenced_revenue:4000,protected_revenue:3000,protected_mrr:600,rows:[]}});
  assert.equal(vm.status,'ready');
  assert.equal(vm.directNetReturn,500);
  assert.equal(vm.directRoiPct,50);
  assert.equal(vm.directCostCoverage,1.5);
  assert.equal(vm.influencedImpactPerCost,4);
  assert.equal(vm.protectedImpactPerCost,3);
  assert.equal(vm.directRevenuePerFte,750);
  assert.equal(vm.protectedMrrPerFte,300);
  assert.equal(Object.hasOwn(vm,'totalEconomicRevenue'),false);
});

test('motor não cria ROI infinito quando custo é zero',()=>{
  const vm=result.buildOperationalReturn({aggregate:{source_available:true,total_cost:0,direct_revenue:1000,influenced_revenue:2000,protected_revenue:3000}});
  assert.equal(vm.directNetReturn,null);
  assert.equal(vm.directRoiPct,null);
  assert.equal(vm.directCostCoverage,null);
  assert.equal(vm.influencedImpactPerCost,null);
  assert.equal(vm.protectedImpactPerCost,null);
});

test('resultado individual preserva técnico sem custo mas deixa ROI indisponível',()=>{
  const vm=result.buildTechnicianOperationalReturn({aggregate:{source_available:true,technician_count:2,costed_technician_count:1,technician_cost_total:500,direct_revenue:900,direct_net_return:400,direct_roi_pct:80,direct_cost_coverage:1.8,rows:[
    {technician_key:'1',technician_name:'Ana',squad_code:'D',cost_available:true,total_cost:500,fte:1,direct_revenue:900,direct_net_return:400,direct_roi_pct:80,direct_cost_coverage:1.8,influenced_impact_per_cost:2,protected_impact_per_cost:1},
    {technician_key:'2',technician_name:'Bruno',squad_code:'D',cost_available:false,total_cost:0,direct_revenue:200,direct_net_return:null,direct_roi_pct:null}
  ]}});
  assert.equal(vm.costedTechnicianCount,1);
  assert.equal(vm.rows.find(r=>r.technicianName==='Bruno').directRoiPct,null);
  assert.equal(vm.rows.find(r=>r.technicianName==='Bruno').costAvailable,false);
});

test('contexto financeiro e controller preservam ROI agregado e individual',()=>{
  const ctx=data.buildFinancialContext({resultRoi:{source_available:true,total_cost:1000,direct_roi_pct:20,rows:[{squad_code:'D',total_cost:1000,direct_roi_pct:20}]},resultTechnicianRoi:{source_available:true,technician_count:1,rows:[{technician_key:'p1',technician_name:'Ana',cost_available:true,total_cost:500,direct_roi_pct:10}]}});
  assert.equal(ctx.resultRoi.sourceAvailable,true);
  assert.equal(ctx.resultRoi.rows[0].directRoiPct,20);
  assert.equal(ctx.resultTechnicianRoi.rows[0].costAvailable,true);
  const controller=strategy.createController({access:{canViewStrategy:true,canViewAggregates:true,canViewPeopleCosts:true},competence:'2026-10'});
  controller.initializeContext({squads:{D:{name:'Delta',competences:['2026-10']}}});
  controller.setFinancialData({competences:[{competence:'2026-10'}],resultRoi:{sourceAvailable:true,totalCost:1000},resultTechnicianRoi:{sourceAvailable:true,technicianCount:1,rows:[]}});
  const vm=controller.viewModel();
  assert.equal(vm.financial.resultRoi.totalCost,1000);
  assert.equal(vm.financial.resultTechnicianRoi.technicianCount,1);
});

test('RPC agregado reutiliza fontes oficiais e calcula ROI somente com direta',()=>{
  assert.match(migration,/get_strategy_result_roi_summary/i);
  assert.match(migration,/get_strategy_result_squad_summary\(p_competence,p_squad_code\)/i);
  assert.match(migration,/get_strategy_financial_summary\(p_competence,p_squad_code\)/i);
  assert.match(migration,/get_strategy_squad_cost_summary\(p_competence\)/i);
  assert.match(migration,/\(v_direct-v_cost\)\/v_cost\*100/i);
  assert.doesNotMatch(migration,/\(v_direct\+v_influenced\+v_protected/i);
});

test('RPC individual exige people_costs e cruza custo pessoal por competência',()=>{
  assert.match(migration,/get_strategy_result_technician_roi_summary/i);
  assert.match(migration,/has_strategy_access\('people_costs'\)/i);
  assert.match(migration,/strategy_employee_costs/i);
  assert.match(migration,/sec\.person_id=r\.resolved_person_id/i);
  assert.match(migration,/sum\(direct_revenue\) filter \(where cost_available\)/i);
});

test('Influenciada e Protegida ficam como impacto por custo e não ROI',()=>{
  assert.match(migration,/influenced_impact_per_cost/i);
  assert.match(migration,/protected_impact_per_cost/i);
  assert.match(index,/Influenciada \/ R\$ custo/);
  assert.match(index,/Protegida \/ R\$ custo/);
  assert.match(index,/impacto complementar, não ROI/);
});

test('app carrega e renderiza ROI nos dois níveis',()=>{
  assert.match(app,/get_strategy_result_roi_summary/);
  assert.match(app,/get_strategy_result_technician_roi_summary/);
  assert.match(app,/renderStrategyOperationalReturn/);
  assert.match(app,/buildOperationalReturn/);
  assert.match(app,/buildTechnicianOperationalReturn/);
  assert.match(app,/resultRoiMissing\?'V2\.60\.6'/);
});

test('UI documenta as fórmulas e mantém custo individual protegido',()=>{
  assert.match(index,/Retorno líquido direto/);
  assert.match(index,/\(direta − custo\) ÷ custo/);
  assert.match(index,/Dados individuais continuam protegidos pela permissão de custos de pessoas/);
  assert.match(index,/ROI usa somente Receita Direta confirmada/);
});
