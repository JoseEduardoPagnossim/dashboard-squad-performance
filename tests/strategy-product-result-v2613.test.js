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
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.61.3.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','PRODUTO_SQUAD_RESULTADO_V2.61.3.md');

test('V2.61.3 mantém Resultado econômico por Produto após Unit Economics',()=>{
  assert.equal(pkg.version,'2.62.9');
  assert.equal(pkg.assetVersion,'2.62.9-r1');
  assert.equal(product.RULE_VERSION,'PS-0.5.0-unit-economics');
  assert.equal(product.CATALOG.find(x=>x.id==='result-by-product').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='unit-economics-product').state,'ready');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/V2\.61\.3 • RESULTADO ECONÔMICO POR PRODUTO/);
  assert.ok(index.includes('js/strategy-product.js?v=2.62.9-r1'));
});

test('motor mantém Direta, Influenciada e Protegida separadas',()=>{
  const result=product.buildResult({aggregate:{source_available:true,direct_revenue:1000,influenced_revenue:2000,protected_revenue:3000,official_direct_revenue:1000,official_influenced_revenue:2000,official_protected_revenue:3000,rows:[{product_code:'GA',product_name:'Gerencie Aqui',direct_revenue:600,influenced_revenue:800,protected_revenue:1200},{product_code:'UNCLASSIFIED',unclassified:true,direct_revenue:400,influenced_revenue:1200,protected_revenue:1800}]}});
  assert.equal(result.directRevenue,1000);
  assert.equal(result.influencedRevenue,2000);
  assert.equal(result.protectedRevenue,3000);
  assert.deepEqual(result.reconciled,{direct:true,influenced:true,protected:true});
  assert.equal(result.rows.find(x=>x.unclassified).protectedRevenue,1800);
  assert.ok(result.warnings.some(x=>/nunca são somadas/i.test(x)));
});

test('motor preserva MRR e ARR como indicadores paralelos',()=>{
  const result=product.buildResult({aggregate:{source_available:true,direct_mrr:120,direct_revenue:500,rows:[{product_code:'FOOD',direct_revenue:500,direct_mrr:120,direct_arr:1440}]}});
  assert.equal(result.directMrr,120);
  assert.equal(result.rows[0].directArr,1440);
  assert.equal(result.directRevenue,500);
});

test('contexto estratégico propaga e congela Resultado por Produto',()=>{
  const ctx=data.buildFinancialContext({productResult:{source_available:true,direct_revenue:500,rows:[{product_code:'FOOD',direct_revenue:500}]}});
  assert.equal(ctx.productResult.sourceAvailable,true);
  assert.equal(ctx.productResult.rows[0].productCode,'FOOD');
  assert.equal(Object.isFrozen(ctx.productResult.rows),true);
  const controller=strategy.createController();controller.initializeContext({squads:{D:{code:'D',competences:['2026-10']}}});controller.setFinancialData({productResult:{source_available:true,direct_revenue:500,rows:[{product_code:'FOOD',direct_revenue:500}]}});
  assert.equal(controller.viewModel().financial.productResult.directRevenue,500);
});

test('migration sincroniza somente eventos econômicos elegíveis da Fase 5',()=>{
  assert.match(migration,/strategy_result_events/i);
  assert.match(migration,/strategy_result_attributions/i);
  assert.match(migration,/result_type='direct'.*status='confirmed'/s);
  assert.match(migration,/result_type='influenced'.*status='confirmed'/s);
  assert.match(migration,/result_type='protected'.*protection_verified_at is not null.*protection_lost_at is null/s);
});

test('sincronização replica o rateio efetivo por Squad e preserva UNALLOCATED',()=>{
  assert.match(migration,/explicit_share_sum/i);
  assert.match(migration,/null_share_count/i);
  assert.match(migration,/effective_share/i);
  assert.match(migration,/'UNALLOCATED'/i);
  assert.match(migration,/source_domain.*'result'/i);
});

test('RPC de Produto mantém residual UNCLASSIFIED e três naturezas independentes',()=>{
  assert.match(migration,/get_strategy_product_result_summary/i);
  assert.match(migration,/'UNCLASSIFIED'/i);
  assert.match(migration,/direct_revenue/i);
  assert.match(migration,/influenced_revenue/i);
  assert.match(migration,/protected_revenue/i);
  assert.match(migration,/get_strategy_result_squad_summary\(p_competence,p_squad_code\)/i);
});

test('migration protege permissão e competência fechada',()=>{
  assert.match(migration,/has_strategy_access\('edit_costs'\)/i);
  assert.match(migration,/strategy product competence is closed; reopen before syncing result sources/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
});

test('interface publica Resultado por Produto e sincronização',()=>{
  for(const id of ['strategyProductResultStatus','strategySyncProductResultBtn','strategyProductResultDirect','strategyProductResultInfluenced','strategyProductResultProtected','strategyProductResultDirectCoverage','strategyProductResultUnclassified','strategyProductResultRows'])assert.match(index,new RegExp(`id="${id}"`));
  assert.match(app,/strategyProductEngine\.buildResult/);
  assert.match(app,/get_strategy_product_result_summary/);
  assert.match(app,/sync_strategy_product_result_sources/);
  assert.match(app,/strategy\.product_result_sync/);
  assert.match(app,/productResultMissing=.*V2\.61\.3/s);
});

test('V2.61.3 permanece documentada após ativação de Unit Economics por Produto',()=>{
  assert.equal(product.CATALOG.find(x=>x.id==='unit-economics-product').state,'ready');
  const doc=readFileSync(docPath,'utf8');
  assert.match(doc,/Unit Economics.*V2\.61\.4/i);
});
