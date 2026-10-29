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
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.61.1.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','PRODUTO_SQUAD_DEMANDA_V2.61.1.md');

test('V2.61.1 mantém Demanda por Produto ativa na Fase 6',()=>{
  assert.equal(pkg.version,'2.63.5');
  assert.equal(pkg.assetVersion,'2.63.5-r1');
  assert.equal(product.RULE_VERSION,'PS-0.5.0-unit-economics');
  assert.equal(product.CATALOG.find(x=>x.id==='product-squad-foundation').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='demand-by-product').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='cost-by-product').state,'ready');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/V2\.63\.5 • Fase 8 — Automação/);
});

test('motor mantém Atendimentos como denominador exclusivo da participação na demanda',()=>{
  const vm=product.buildDemand({aggregate:{source_available:true,attendance_total:100,attendance_source_available:true,rows:[{product_code:'GA',product_name:'Gerencie Aqui',attendance:60,clients:10,tickets:20,resolutions:50},{product_code:'UNCLASSIFIED',product_name:'Não classificado',unclassified:true,attendance:40,clients:5,tickets:5,resolutions:20}]}});
  assert.equal(vm.rows[0].productCode,'GA');
  assert.equal(vm.rows[0].demandSharePct,60);
  assert.equal(vm.rows[1].demandSharePct,40);
  assert.equal(vm.attendanceTotal,100);
});

test('motor preserva indisponibilidade independente de Clientes, Chamados e Resoluções',()=>{
  const vm=product.buildDemand({aggregate:{source_available:true,attendance_source_available:true,attendance_total:50,client_source_available:false,ticket_source_available:false,resolution_source_available:false}});
  assert.equal(vm.attendanceSourceAvailable,true);
  assert.equal(vm.clientSourceAvailable,false);
  assert.equal(vm.ticketSourceAvailable,false);
  assert.equal(vm.resolutionSourceAvailable,false);
  assert.ok(vm.warnings.some(x=>/clientes.*nunca são inferidos/i.test(x)));
  assert.ok(vm.warnings.some(x=>/chamados.*nunca/i.test(x)));
});

test('contexto estratégico propaga demanda por Produto sem misturar com Fundação',()=>{
  const ctx=data.buildFinancialContext({productFoundation:{source_available:true,product_count:1},productDemand:{source_available:true,attendance_total:10,attendance_source_available:true,rows:[{product_code:'GA',product_name:'Gerencie Aqui',attendance:10}]}});
  assert.equal(ctx.productFoundation.sourceAvailable,true);
  assert.equal(ctx.productDemand.sourceAvailable,true);
  assert.equal(ctx.productDemand.attendanceTotal,10);
  assert.equal(Object.isFrozen(ctx.productDemand.rows),true);
  const controller=strategy.createController();
  controller.initializeContext({squads:{D:{code:'D',competences:['2026-10']}}});
  controller.setFinancialData({productDemand:{source_available:true,attendance_total:7,rows:[{product_code:'GA',product_name:'Gerencie Aqui',attendance:7}]}});
  assert.equal(controller.viewModel().financial.productDemand.rows[0].attendance,7);
});

test('migration sincroniza somente Atendimentos e Resoluções oficiais',()=>{
  assert.match(migration,/sync_strategy_product_demand_sources/i);
  assert.match(migration,/technician_monthly/i);
  assert.match(migration,/strategy_resolution_metrics/i);
  assert.match(migration,/'operational_attendance:'\|\|a\.squad_code/i);
  assert.match(migration,/'strategy_resolution:'\|\|r\.squad_code/i);
  assert.match(migration,/'client_sources_inferred',false/i);
  assert.match(migration,/'ticket_sources_inferred',false/i);
  assert.match(migration,/'client_sources_inferred',false/i);
  assert.match(migration,/'ticket_sources_inferred',false/i);
});

test('sincronização preserva fontes e atribuições por upsert estável',()=>{
  assert.match(migration,/on conflict \(organization_id,competence_id,source_domain,source_reference\)/i);
  assert.match(migration,/do update set[\s\S]*source_quantity=excluded\.source_quantity/i);
  assert.doesNotMatch(migration,/delete from public\.strategy_product_attributions/i);
  assert.match(migration,/strategy product competence is closed; reopen before syncing demand sources/i);
});

test('RPC de Demanda preserva Não classificado e calcula cobertura ponderada por quantidade',()=>{
  assert.match(migration,/get_strategy_product_demand_summary/i);
  assert.match(migration,/coalesce\(s\.source_quantity,0\)\*a\.allocation_share/i);
  assert.match(migration,/coalesce\(ss\.source_quantity,0\)\*\(1-ss\.allocated_share\)/i);
  assert.match(migration,/'UNCLASSIFIED'/i);
  assert.match(migration,/attendance_coverage_pct/i);
  assert.match(migration,/attendance_classified\/t\.attendance_total\*100/i);
});

test('RPC mantém Clientes e Chamados como métricas explícitas e separadas',()=>{
  assert.match(migration,/lower\(trim\(s\.metric_key\)\)='ticket'/i);
  assert.match(migration,/lower\(trim\(s\.metric_key\)\)='client'/i);
  assert.match(migration,/ticket_source_available/i);
  assert.match(migration,/client_source_available/i);
  assert.match(migration,/resolution_source_available/i);
});

test('interface publica KPIs e tabela da Demanda por Produto',()=>{
  for(const id of ['strategyProductDemandStatus','strategySyncProductDemandBtn','strategyProductDemandAttendance','strategyProductDemandCoverage','strategyProductDemandClients','strategyProductDemandTickets','strategyProductDemandResolutions','strategyProductDemandRows'])assert.match(index,new RegExp(`id="${id}"`));
  assert.match(app,/strategyProductEngine\.buildDemand/);
  assert.match(app,/get_strategy_product_demand_summary/);
  assert.match(app,/sync_strategy_product_demand_sources/);
  assert.match(app,/strategy\.product_demand_sync/);
  assert.match(app,/productDemandMissing=.*get_strategy_product_demand_summary.*sync_strategy_product_demand_sources.*V2\.61\.1/s);
});

test('V2.61.2 permanece estável após ativação de Custo por Produto',()=>{
  const demand=product.CATALOG.find(x=>x.id==='demand-by-product');
  assert.equal(demand.state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='cost-by-product').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='unit-economics-product').state,'ready');
  assert.match(readFileSync(docPath,'utf8'),/V2\.61\.2.*Custo por Produto/s);
});
