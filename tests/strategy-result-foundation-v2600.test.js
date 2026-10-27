const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const result=require(join(root,'js','strategy-result.js'));
const strategy=require(join(root,'js','strategy.js'));
const navigation=require(join(root,'js','navigation-engine.js'));
const filters=require(join(root,'js','filter-system.js'));
const data=require(join(root,'js','strategy-data.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.0.sql'),'utf8');

test('V2.60.0 publica Fundação de Resultado isolada',()=>{
  assert.equal(pkg.version,'2.61.4');
  assert.equal(pkg.assetVersion,'2.61.4-r1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.ok(strategy.VALID_SECTIONS.includes('result'));
  assert.equal(strategy.SECTION_META.result.label,'Resultado');
  assert.match(index,/data-strategy-section="result"/);
  assert.match(index,/data-strategy-panel="result"/);
  assert.match(index,/strategyResultEventCount/);
  assert.match(index,/strategyResultReadinessRows/);
  assert.ok(index.includes('js/strategy-result.js?v=2.61.4-r1'));
  assert.ok(index.indexOf('js/strategy-result.js?v=2.61.4-r1')<index.indexOf('js/strategy.js?v=2.61.4-r1'));
  assert.ok(index.indexOf('js/strategy-result.js?v=2.61.4-r1')<index.indexOf('js/app.js?v=2.61.4-r1'));
  assert.ok(existsSync(join(root,'docs','RESULTADO_FUNDACAO_V2.60.0.md')));
});

test('rota de Resultado preserva isolamento dos filtros operacionais',()=>{
  const route=navigation.routeFromSearch('?page=strategy&section=result&squad=D&month=2026-10&tech=Arthur&from=2026-10-01&to=2026-10-22');
  assert.deepEqual(route,{page:'strategy',section:'result'});
  assert.equal(filters.activeCount({view:'strategy',isSuperAdmin:true}),0);
});

test('motor mantém direta, influenciada e protegida como naturezas separadas',()=>{
  const foundation=result.buildFoundation({scope:{competence:'2026-10',squadCode:'D',comparison:'previous'},aggregate:{sourceAvailable:true,eventCount:12,confirmedCount:7,draftCount:3,cancelledCount:2,directCount:4,influencedCount:5,protectedCount:3,attributedCount:10,unattributedCount:2,sourceCount:2}});
  assert.equal(foundation.status,'ready');
  assert.deepEqual(foundation.scope,{competence:'2026-10',squadCode:'D',comparison:'previous'});
  assert.equal(foundation.counts.direct,4);
  assert.equal(foundation.counts.influenced,5);
  assert.equal(foundation.counts.protected,3);
  assert.equal(foundation.counts.confirmed,7);
  assert.ok(foundation.warnings.some(x=>/não devem ser somadas/i.test(x)));
  assert.equal(foundation.catalog.find(x=>x.id==='direct-revenue').status,'ready');
});

test('normalização não inventa classificação nem valores negativos',()=>{
  const event=result.normalizeEvent({result_type:'qualquer',status:'x',gross_amount:-10,monthly_recurring_amount:-5,currency:'brl'});
  assert.equal(event.resultType,'');
  assert.equal(event.status,'draft');
  assert.equal(event.grossAmount,0);
  assert.equal(event.monthlyRecurringAmount,0);
  assert.equal(event.currency,'BRL');
});

test('contexto financeiro preserva fundação de Resultado normalizada',()=>{
  const ctx=data.buildFinancialContext({resultFoundation:{source_available:true,competence:'2026-10',squad_code:'D',event_count:2,direct_count:1,protected_count:1}});
  assert.equal(ctx.resultFoundation.sourceAvailable,true);
  assert.equal(ctx.resultFoundation.eventCount,2);
  assert.equal(ctx.resultFoundation.directCount,1);
  assert.equal(ctx.resultFoundation.protectedCount,1);
});

test('migration separa evento de atribuição e não cria soma monetária agregada',()=>{
  assert.match(migration,/create table if not exists public\.strategy_result_events/i);
  assert.match(migration,/create table if not exists public\.strategy_result_attributions/i);
  assert.match(migration,/result_type in \('direct','influenced','protected'\)/i);
  assert.match(migration,/status in \('draft','confirmed','cancelled'\)/i);
  assert.match(migration,/get_strategy_result_foundation/i);
  assert.match(migration,/validate_strategy_result_event_scope/i);
  assert.match(migration,/validate_strategy_result_attribution_scope/i);
  assert.match(migration,/strategy result event organization mismatch/i);
  assert.doesNotMatch(migration,/sum\s*\(\s*gross_amount/i);
});

test('app carrega e renderiza fundação sem antecipar cálculos monetários',()=>{
  assert.match(app,/SoftenStrategyResult/);
  assert.match(app,/get_strategy_result_foundation/);
  assert.match(app,/strategyResultEngine\.buildFoundation/);
  assert.match(app,/function renderStrategyResult\(/);
  assert.doesNotMatch(app,/strategyResultDirectRevenueTotal/);
});
