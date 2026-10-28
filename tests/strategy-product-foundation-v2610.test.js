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
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.61.0.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','PRODUTO_SQUAD_FUNDACAO_V2.61.0.md');

test('V2.61.0 inicia a Fase 6 com Fundação Produto/Squad versionada',()=>{
  assert.equal(pkg.version,'2.62.9');
  assert.equal(pkg.assetVersion,'2.62.9-r1');
  assert.equal(product.RULE_VERSION,'PS-0.5.0-unit-economics');
  assert.equal(product.CATALOG[0].version,'V2.61.0');
  assert.equal(product.CATALOG[0].state,'ready');
  assert.equal(product.CATALOG.at(-1).version,'V2.61.9');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/FASE 6 • V2\.61\.0/);
  assert.ok(index.includes('js/strategy-product.js?v=2.62.9-r1'));
  assert.ok(index.indexOf('js/strategy-product.js?v=2.62.9-r1')<index.indexOf('js/strategy.js?v=2.62.9-r1'));
  assert.ok(index.indexOf('js/strategy-product.js?v=2.62.9-r1')<index.indexOf('js/app.js?v=2.62.9-r1'));
});

test('motor mantém os seis domínios fundacionais após ativação de Unit Economics',()=>{
  assert.deepEqual(product.SOURCE_DOMAINS.map(x=>x.id),['attendance','resolution','people_cost','operational_cost','fte','result']);
  assert.equal(product.SOURCE_DOMAIN_IDS.has('attendance'),true);
  assert.equal(product.SOURCE_DOMAIN_IDS.has('result'),true);
  assert.equal(product.UNCLASSIFIED_CODE,'UNCLASSIFIED');
  const f=product.buildFoundation({scope:{competence:'2026-10',squadCode:'D'},aggregate:{source_available:true,active_product_count:2,source_count:0}});
  assert.equal(f.readiness.catalogReady,true);
  assert.equal(f.readiness.coverageReady,false);
  assert.ok(f.warnings.some(x=>/não classificado/i.test(x)));
  assert.equal(f.catalog.filter(x=>x.status==='ready').length,9);
});

test('cobertura preserva saldo não classificado no denominador',()=>{
  const f=product.buildFoundation({aggregate:{source_available:true,source_count:4,allocated_share:2.5,unclassified_share:1.5,fully_classified_source_count:2,partially_classified_source_count:1,unclassified_source_count:1,domains:[{domain:'attendance',source_count:2,allocated_share:1.25}]}});
  assert.equal(f.classificationCoveragePct,62.5);
  assert.equal(f.unclassifiedShare,1.5);
  assert.equal(f.domains.find(x=>x.id==='attendance').coveragePct,62.5);
  assert.equal(f.fullyClassifiedSourceCount,2);
  assert.equal(f.partiallyClassifiedSourceCount,1);
  assert.equal(f.unclassifiedSourceCount,1);
});

test('normalização do catálogo mantém identidade e aliases sem inventar produto',()=>{
  const row=product.normalizeProduct({id:'p1',code:' ga ',name:'Gerencie Aqui',aliases:['GA','Gerencie Aqui','GA'],alias_count:3,active:true});
  assert.equal(row.code,'GA');
  assert.equal(row.name,'Gerencie Aqui');
  assert.deepEqual(row.aliases,['GA','Gerencie Aqui']);
  assert.equal(row.aliasCount,3);
  assert.equal(product.normalizeProduct({}).code,'');
});

test('contexto estratégico propaga e congela a fundação Produto/Squad',()=>{
  const ctx=data.buildFinancialContext({productFoundation:{source_available:true,competence:'2026-10-01',product_count:1,active_product_count:1,source_count:2,products:[{id:'p1',code:'GA',name:'Gerencie Aqui'}],domains:[{domain:'attendance',source_count:2,coverage_pct:50}]}});
  assert.equal(ctx.productFoundation.sourceAvailable,true);
  assert.equal(ctx.productFoundation.competence,'2026-10');
  assert.equal(ctx.productFoundation.products[0].code,'GA');
  assert.equal(ctx.productFoundation.domains[0].coveragePct,50);
  assert.equal(Object.isFrozen(ctx.productFoundation.products),true);
  const controller=strategy.createController();
  controller.initializeContext({squads:{D:{code:'D',competences:['2026-10']}}});
  controller.setFinancialData({productFoundation:{source_available:true,product_count:1,products:[{id:'p1',code:'GA',name:'Gerencie Aqui'}]}});
  assert.equal(controller.viewModel().financial.productFoundation.products[0].code,'GA');
});

test('navegação estratégica publica Produto/Squad como seção independente',()=>{
  assert.ok(strategy.VALID_SECTIONS.includes('product'));
  assert.equal(strategy.SECTION_META.product.label,'Produto/Squad');
  assert.match(index,/data-strategy-section="product"/);
  assert.match(index,/data-strategy-panel="product"/);
  assert.match(index,/strategyProductCoverage/);
  assert.match(index,/strategyProductDomainRows/);
  assert.match(index,/strategyProductCatalogRows/);
});

test('migration cria catálogo, fontes e atribuições com contrato único',()=>{
  assert.match(migration,/create table if not exists public\.strategy_products/i);
  assert.match(migration,/create table if not exists public\.strategy_product_sources/i);
  assert.match(migration,/create table if not exists public\.strategy_product_attributions/i);
  assert.match(migration,/source_domain in \('attendance','resolution','people_cost','operational_cost','fte','result'\)/i);
  assert.match(migration,/source_quantity is not null or source_amount is not null/i);
  assert.match(migration,/unique \(source_id,product_id\)/i);
  assert.match(migration,/product_code_snapshot/i);
  assert.match(migration,/product_name_snapshot/i);
});

test('migration protege multi-tenant, competência fechada e soma de shares',()=>{
  assert.match(migration,/validate_strategy_product_source_scope/i);
  assert.match(migration,/validate_strategy_product_attribution_scope/i);
  assert.match(migration,/perform 1 from public\.strategy_product_sources s where s\.id=v_source for update/i);
  assert.match(migration,/v_total>1\.000001/i);
  assert.match(migration,/allocation shares exceed 100/i);
  assert.match(migration,/strategy product competence is closed; reopen before changing product sources/i);
  assert.match(migration,/strategy product competence is closed; reopen before changing product attributions/i);
  assert.match(migration,/has_strategy_access\('edit_costs'\)/i);
});

test('RPC da fundação mede cobertura e permite filtro de Squad sem descartar residual',()=>{
  assert.match(migration,/get_strategy_product_foundation/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
  assert.match(migration,/v_all or upper\(trim\(coalesce\(s\.squad_code_snapshot,''\)\)\)=v_code/i);
  assert.match(migration,/fully_classified_source_count/i);
  assert.match(migration,/partially_classified_source_count/i);
  assert.match(migration,/unclassified_source_count/i);
  assert.match(migration,/classification_coverage_pct/i);
  assert.match(migration,/unclassified_share/i);
  assert.match(migration,/'domains'/i);
  assert.match(migration,/'products'/i);
});

test('app carrega fundação, administra catálogo e mantém roadmap da Fase 6',()=>{
  assert.match(app,/SoftenStrategyProduct/);
  assert.match(app,/get_strategy_product_foundation/);
  assert.match(app,/strategyProductEngine\.buildFoundation/);
  assert.match(app,/function renderStrategyProduct\(/);
  assert.match(app,/function addStrategyProduct\(/);
  assert.match(app,/function toggleStrategyProduct\(/);
  assert.match(app,/strategy\.product_create/);
  assert.match(app,/strategy\.product_status/);
  assert.match(app,/MIGRAÇÃO PENDENTE/);
  assert.equal(product.CATALOG.find(x=>x.id==='product-squad-foundation').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='demand-by-product').state,'ready');
  assert.equal(product.CATALOG.find(x=>x.id==='product-squad-history-hardening').state,'ready');
});
