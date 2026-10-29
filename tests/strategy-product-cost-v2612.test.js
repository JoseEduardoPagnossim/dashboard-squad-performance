const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const product=require(join(root,'js','strategy-product.js'));
const data=require(join(root,'js','strategy-data.js'));
const strategy=require(join(root,'js','strategy.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.61.2.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','PRODUTO_SQUAD_CUSTO_V2.61.2.md');

test('V2.61.2 ativa Custo por Produto e preserva roadmap posterior',()=>{
  assert.equal(pkg.version,'2.63.5');
  assert.equal(pkg.assetVersion,'2.63.5-r1');
  assert.equal(product.RULE_VERSION,'PS-0.5.0-unit-economics');
  assert.equal(product.CATALOG.find(x=>x.id==='cost-by-product').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='result-by-product').state,'ready');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/V2\.61\.2 • CUSTO POR PRODUTO/);
  assert.ok(index.includes('js/strategy-product.js?v=2.63.5-r1'));
});

test('motor calcula Cost to Serve e custos unitários sem inventar denominadores',()=>{
  const cost=product.buildCost({aggregate:{source_available:true,total_cost:1000,classified_cost:800,unclassified_cost:200,cost_coverage_pct:80,financial_total_cost:1000,reconciliation_gap:0,attendance_source_available:true,resolution_source_available:true,client_source_available:false,rows:[{product_code:'GA',product_name:'Gerencie Aqui',people_cost:500,operational_cost:300,total_cost:800,attendance:100,resolutions:80,clients:20},{product_code:'UNCLASSIFIED',unclassified:true,total_cost:200,attendance:25,resolutions:20}]}});
  assert.equal(cost.totalCost,1000);
  assert.equal(cost.rows[0].costPerAttendance,8);
  assert.equal(cost.rows[0].costPerResolution,10);
  assert.equal(cost.rows[0].costPerClient,null);
  assert.equal(cost.rows.find(x=>x.unclassified).totalCost,200);
  assert.equal(cost.reconciled,true);
});

test('motor explicita diferença de reconciliação e Não classificado',()=>{
  const cost=product.buildCost({aggregate:{source_available:true,total_cost:900,financial_total_cost:1000,reconciliation_gap:-100,unclassified_cost:300,rows:[{product_code:'UNCLASSIFIED',unclassified:true,total_cost:300}]}});
  assert.equal(cost.reconciled,false);
  assert.equal(cost.reconciliationGap,-100);
  assert.ok(cost.warnings.some(x=>/Não classificada/i.test(x)));
});

test('contexto estratégico propaga e congela Custo por Produto',()=>{
  const ctx=data.buildFinancialContext({productCost:{source_available:true,total_cost:500,rows:[{product_code:'FOOD',product_name:'Food',total_cost:500}]}});
  assert.equal(ctx.productCost.sourceAvailable,true);
  assert.equal(ctx.productCost.rows[0].productCode,'FOOD');
  assert.equal(Object.isFrozen(ctx.productCost.rows),true);
  const controller=strategy.createController();
  controller.initializeContext({squads:{D:{code:'D',competences:['2026-10']}}});
  controller.setFinancialData({productCost:{source_available:true,total_cost:500,rows:[{product_code:'FOOD',total_cost:500}]}});
  assert.equal(controller.viewModel().financial.productCost.totalCost,500);
});

test('migration sincroniza custos oficiais sem criar fonte financeira paralela',()=>{
  assert.match(migration,/sync_strategy_product_cost_sources/i);
  assert.match(migration,/strategy_employee_costs/i);
  assert.match(migration,/strategy_cost_allocations/i);
  assert.match(migration,/strategy_operational_costs/i);
  assert.match(migration,/source_domain.*people_cost/i);
  assert.match(migration,/source_domain.*operational_cost/i);
  assert.match(migration,/allocation_driver','attendance'/i);
});

test('sincronização replica a classificação de Atendimentos e mantém residual',()=>{
  assert.match(migration,/AUTO:V2\.61\.2:attendance-driver/i);
  assert.match(migration,/source_domain='attendance'/i);
  assert.match(migration,/lower\(trim\(s\.metric_key\)\)='attendance'/i);
  assert.match(migration,/a\.allocation_share/i);
  assert.match(migration,/strategy_product_attributions/i);
});

test('migration protege permissão e competência fechada',()=>{
  assert.match(migration,/has_strategy_access\('edit_costs'\)/i);
  assert.match(migration,/strategy product competence is closed; reopen before syncing cost sources/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
});

test('RPC agrega custos por Produto e reconcilia com get_strategy_financial_summary',()=>{
  assert.match(migration,/get_strategy_product_cost_summary/i);
  assert.match(migration,/get_strategy_financial_summary\(p_competence,p_squad_code\)/i);
  assert.match(migration,/classified_cost/i);
  assert.match(migration,/unclassified_cost/i);
  assert.match(migration,/reconciliation_gap/i);
  assert.match(migration,/'UNCLASSIFIED'/i);
});

test('interface publica Cost to Serve, custos unitários e sincronização',()=>{
  for(const id of ['strategyProductCostStatus','strategySyncProductCostBtn','strategyProductCostTotal','strategyProductCostCoverage','strategyProductCostPeople','strategyProductCostOperational','strategyProductCostUnclassified','strategyProductCostRows'])assert.match(index,new RegExp(`id="${id}"`));
  assert.match(app,/strategyProductEngine\.buildCost/);
  assert.match(app,/get_strategy_product_cost_summary/);
  assert.match(app,/sync_strategy_product_cost_sources/);
  assert.match(app,/strategy\.product_cost_sync/);
  assert.match(app,/productCostMissing=.*V2\.61\.2/s);
});

test('V2.61.2 permanece estável após Resultado e Unit Economics por Produto',()=>{
  assert.equal(product.CATALOG.find(x=>x.id==='result-by-product').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='unit-economics-product').state,'ready');
  const doc=readFileSync(docPath,'utf8');
  assert.match(doc,/não calcula Receita Direta\/Influenciada\/Protegida por Produto/i);
});
