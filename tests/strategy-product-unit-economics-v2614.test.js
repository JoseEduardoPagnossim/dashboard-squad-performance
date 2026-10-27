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
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.61.4.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','PRODUTO_SQUAD_UNIT_ECONOMICS_V2.61.4.md');

test('V2.61.4 ativa Unit Economics por Produto e mantém comparativos posteriores',()=>{
  assert.equal(pkg.version,'2.62.0');
  assert.equal(pkg.assetVersion,'2.62.0-r1');
  assert.equal(product.RULE_VERSION,'PS-0.5.0-unit-economics');
  assert.equal(product.CATALOG.find(x=>x.id==='unit-economics-product').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='squad-comparison').state,'ready');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/V2\.61\.4 • UNIT ECONOMICS POR PRODUTO/);
  assert.ok(index.includes('js/strategy-product.js?v=2.62.0-r1'));
});

test('motor cruza custo, demanda, FTE e Receita Direta no ROI por Produto',()=>{
  const unit=product.buildUnitEconomics({aggregate:{source_available:true,attendance_total:100,resolutions_total:75,clients_total:20,total_cost:1000,direct_revenue:1500,influenced_revenue:600,protected_revenue:1200,protected_mrr:200,nominal_fte:2,available_fte:2,availability_complete:true,fte_coverage_pct:80,attendance_source_available:true,resolution_source_available:true,client_source_available:true,rows:[{product_code:'GA',product_name:'Gerencie Aqui',attendance:80,resolutions:60,clients:16,total_cost:800,available_fte:1.6,nominal_fte:1.6,direct_revenue:1200,influenced_revenue:500,protected_revenue:900,protected_mrr:150},{product_code:'UNCLASSIFIED',unclassified:true,attendance:20,resolutions:15,clients:4,total_cost:200,available_fte:.4,nominal_fte:.4,direct_revenue:300,influenced_revenue:100,protected_revenue:300,protected_mrr:50}]}});
  const ga=unit.rows.find(x=>x.productCode==='GA');
  assert.equal(ga.costPerAttendance,10);
  assert.equal(ga.attendancePerAvailableFte,50);
  assert.equal(ga.directRoiPct,50);
  assert.equal(ga.directCostCoveragePct,150);
  assert.equal(ga.influencedPerCost,0.625);
  assert.equal(ga.protectedPerCost,1.125);
  assert.equal(unit.total.directRoiPct,50);
});

test('ROI usa somente Receita Direta e não soma Influenciada ou Protegida',()=>{
  const unit=product.buildUnitEconomics({aggregate:{source_available:true,total_cost:1000,direct_revenue:500,influenced_revenue:5000,protected_revenue:9000,rows:[{product_code:'FOOD',total_cost:1000,direct_revenue:500,influenced_revenue:5000,protected_revenue:9000}]}});
  assert.equal(unit.total.directRoiPct,-50);
  assert.equal(unit.rows[0].influencedPerCost,5);
  assert.equal(unit.rows[0].protectedPerCost,9);
  assert.ok(unit.warnings.some(x=>/ROI.*somente Receita Direta/i.test(x)));
});

test('custo zero e FTE indisponível não fabricam ROI ou produtividade',()=>{
  const unit=product.buildUnitEconomics({aggregate:{source_available:true,availability_complete:false,attendance_source_available:true,resolution_source_available:true,rows:[{product_code:'GA',attendance:30,resolutions:20,total_cost:0,direct_revenue:100,nominal_fte:1,available_fte:null}]}});
  assert.equal(unit.rows[0].directRoiPct,null);
  assert.equal(unit.rows[0].directCostCoveragePct,null);
  assert.equal(unit.rows[0].attendancePerAvailableFte,null);
  assert.equal(unit.rows[0].resolutionsPerAvailableFte,null);
});

test('contexto estratégico propaga e congela Unit Economics',()=>{
  const ctx=data.buildFinancialContext({productUnitEconomics:{source_available:true,total_cost:500,rows:[{product_code:'FOOD',total_cost:500,direct_revenue:700}]}});
  assert.equal(ctx.productUnitEconomics.sourceAvailable,true);
  assert.equal(ctx.productUnitEconomics.rows[0].productCode,'FOOD');
  assert.equal(Object.isFrozen(ctx.productUnitEconomics.rows),true);
  const controller=strategy.createController();controller.initializeContext({squads:{D:{code:'D',competences:['2026-10']}}});controller.setFinancialData({productUnitEconomics:{source_available:true,total_cost:500,rows:[{product_code:'FOOD',total_cost:500}]}});
  assert.equal(controller.viewModel().financial.productUnitEconomics.totalCost,500);
});

test('migration atualiza bases anteriores e sincroniza FTE oficial',()=>{
  assert.match(migration,/sync_strategy_product_demand_sources\(p_competence,p_squad_code\)/i);
  assert.match(migration,/sync_strategy_product_cost_sources\(p_competence,p_squad_code\)/i);
  assert.match(migration,/sync_strategy_product_result_sources\(p_competence,p_squad_code\)/i);
  assert.match(migration,/strategy_employee_costs/i);
  assert.match(migration,/metric_key.*nominal_fte/i);
  assert.match(migration,/metric_key.*available_fte/i);
  assert.match(migration,/AUTO:V2\.61\.4:attendance-driver/i);
});

test('FTE por Produto usa driver de Atendimentos e mantém residual UNCLASSIFIED',()=>{
  assert.match(migration,/source_domain='attendance'.*metric_key\)\)='attendance'/s);
  assert.match(migration,/allocation_driver','attendance'/i);
  assert.match(migration,/'UNCLASSIFIED'/i);
  assert.match(migration,/source_quantity\*\(1-ss\.allocated_share\)/i);
});

test('RPC de Unit Economics reconcilia FTE, custo e três naturezas separadamente',()=>{
  assert.match(migration,/get_strategy_product_unit_economics_summary/i);
  assert.match(migration,/get_strategy_product_demand_summary\(p_competence,p_squad_code\)/i);
  assert.match(migration,/get_strategy_product_cost_summary\(p_competence,p_squad_code\)/i);
  assert.match(migration,/get_strategy_product_result_summary\(p_competence,p_squad_code\)/i);
  assert.match(migration,/get_strategy_capacity_summary\(p_competence,p_squad_code\)/i);
  for(const key of ['demand_reconciled','direct_reconciled','influenced_reconciled','protected_reconciled','fte_reconciled'])assert.match(migration,new RegExp(key,'i'));
  assert.doesNotMatch(migration,/'demand_reconciled',true/i);
  assert.match(migration,/sum\(dr\.attendance\).*attendance_total/s);
});

test('interface publica Unit Economics, sincronização e detecção da migration',()=>{
  for(const id of ['strategyProductUnitStatus','strategySyncProductUnitBtn','strategyProductUnitRoi','strategyProductUnitCost','strategyProductUnitFte','strategyProductUnitCostPerAttendance','strategyProductUnitAttendancePerFte','strategyProductUnitFteCoverage','strategyProductUnitRows'])assert.match(index,new RegExp(`id="${id}"`));
  assert.match(app,/strategyProductEngine\.buildUnitEconomics/);
  assert.match(app,/get_strategy_product_unit_economics_summary/);
  assert.match(app,/sync_strategy_product_unit_economics_sources/);
  assert.match(app,/strategy\.product_unit_economics_sync/);
  assert.match(app,/productUnitEconomicsMissing=.*V2\.61\.4/s);
});

test('V2.61.4 preserva próxima etapa para Comparativo entre Squads',()=>{
  const doc=readFileSync(docPath,'utf8');
  assert.equal(product.CATALOG.find(x=>x.id==='squad-comparison').state,'ready');
  assert.match(doc,/V2\.61\.5.*Comparativo entre Squads/s);
  assert.match(doc,/FTE alocado/i);
  assert.match(doc,/Receita Direta/i);
});
