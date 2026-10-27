const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const result=require(join(root,'js','strategy-result.js'));
const data=require(join(root,'js','strategy-data.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.1.sql'),'utf8');

test('V2.60.1 publica Receita Direta com Up-sell nativo',()=>{
  assert.equal(pkg.version,'2.62.1');
  assert.equal(pkg.assetVersion,'2.62.1-r1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.ok(result.DIRECT_CATEGORY_IDS.includes('upsell'));
  assert.equal(result.DIRECT_REVENUE_CATEGORIES.find(x=>x.id==='upsell').label,'Up-sell');
  assert.ok(existsSync(join(root,'docs','RESULTADO_RECEITA_DIRETA_V2.60.1.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.1.sql')));
  assert.match(index,/V2\.60\.1 • RECEITA DIRETA/);
  assert.match(index,/strategyDirectRevenueTotal/);
  assert.match(index,/strategyDirectRevenueCategory/);
  assert.match(index,/strategyAddDirectRevenueBtn/);
  assert.ok(index.includes('js/strategy-result.js?v=2.62.1-r1'));
});

test('motor soma somente valor confirmado e mantém MRR/ARR separados',()=>{
  const direct=result.buildDirectRevenue({scope:{competence:'2026-10',squadCode:'D'},aggregate:{
    source_available:true,competence:'2026-10',squad_code:'D',currency:'BRL',event_count:3,revenue_total:1500,
    monthly_recurring_amount:320,annual_recurring_amount:3600,ticket_average:500,attributed_event_count:3,unattributed_event_count:0,source_count:1,
    categories:[
      {category:'upsell',event_count:2,revenue_total:1000,monthly_recurring_amount:250,annual_recurring_amount:3000},
      {category:'service',event_count:1,revenue_total:500,monthly_recurring_amount:70,annual_recurring_amount:600}
    ]
  }});
  assert.equal(direct.status,'ready');
  assert.equal(direct.revenueTotal,1500);
  assert.equal(direct.monthlyRecurringAmount,320);
  assert.equal(direct.annualRecurringAmount,3600);
  assert.equal(direct.ticketAverage,500);
  assert.equal(direct.categories.find(x=>x.id==='upsell').revenueTotal,1000);
  assert.equal(direct.categories.reduce((sum,x)=>sum+x.revenueTotal,0),1500);
  assert.ok(direct.warnings.some(x=>/não são adicionados ao total/i.test(x)));
});

test('ticket médio é derivado quando RPC não o informa',()=>{
  const direct=result.buildDirectRevenue({aggregate:{sourceAvailable:true,eventCount:4,revenueTotal:1000,ticketAverage:0}});
  assert.equal(direct.ticketAverage,250);
});

test('normalização de evento reconhece categoria direta e não inventa categoria inválida',()=>{
  assert.equal(result.normalizeEvent({result_type:'direct',direct_revenue_category:'UPSELL'}).directRevenueCategory,'upsell');
  assert.equal(result.normalizeEvent({result_type:'direct',direct_revenue_category:'qualquer'}).directRevenueCategory,'');
});

test('contexto financeiro preserva agregado de Receita Direta e categorias',()=>{
  const ctx=data.buildFinancialContext({resultDirectRevenue:{source_available:true,competence:'2026-10',squad_code:'D',event_count:2,revenue_total:900,categories:[{category:'upsell',event_count:2,revenue_total:900}]}});
  assert.equal(ctx.resultDirectRevenue.sourceAvailable,true);
  assert.equal(ctx.resultDirectRevenue.eventCount,2);
  assert.equal(ctx.resultDirectRevenue.revenueTotal,900);
  assert.equal(ctx.resultDirectRevenue.categories[0].category,'upsell');
  assert.equal(ctx.resultDirectRevenue.categories[0].revenueTotal,900);
});

test('migration exige integridade e agrega apenas Receita Direta confirmada',()=>{
  assert.match(migration,/add column if not exists direct_revenue_category/i);
  assert.match(migration,/'upsell','plan_upgrade','module_addon'/i);
  assert.match(migration,/validate_strategy_direct_revenue_event/i);
  assert.match(migration,/new\.result_type='direct'/i);
  assert.match(migration,/new\.status='confirmed'/i);
  assert.match(migration,/gross_amount,0\)<=0/i);
  assert.match(migration,/supports BRL only/i);
  assert.match(migration,/get_strategy_direct_revenue_summary/i);
  assert.match(migration,/e\.result_type='direct'/i);
  assert.match(migration,/e\.status='confirmed'/i);
  assert.match(migration,/'revenue_total',coalesce\(\(select sum\(gross_amount\)/i);
  assert.match(migration,/'monthly_recurring_amount',coalesce\(\(select sum\(monthly_recurring_amount\)/i);
  assert.doesNotMatch(migration,/sum\(gross_amount\s*\+\s*monthly_recurring_amount/i);
});

test('filtro de Squad usa atribuição sem duplicar linhas do evento',()=>{
  assert.match(migration,/exists\s*\(\s*select 1\s*from public\.strategy_result_attributions/i);
  assert.match(migration,/a\.event_id=e\.id/i);
  assert.match(migration,/squad_code_snapshot/i);
});

test('app carrega agregado, registra evento e cria atribuição owner',()=>{
  assert.match(app,/get_strategy_direct_revenue_summary/);
  assert.match(app,/function renderStrategyDirectRevenue\(/);
  assert.match(app,/function addStrategyDirectRevenue\(/);
  assert.match(app,/result_type:'direct'/);
  assert.match(app,/direct_revenue_category:category/);
  assert.match(app,/attribution_role:'owner'/);
  assert.match(app,/attribution_share:1/);
  assert.match(app,/strategy\.direct_revenue_create/);
  assert.match(app,/function cancelStrategyDirectRevenue\(/);
  assert.match(app,/strategy\.direct_revenue_cancel/);
});

test('Receita Direta aparece ativa no roadmap e Influenciada/Protegida continuam planejadas',()=>{
  const foundation=result.buildFoundation({aggregate:{sourceAvailable:true}});
  assert.equal(foundation.catalog.find(x=>x.id==='direct-revenue').status,'ready');
  assert.equal(foundation.catalog.find(x=>x.id==='influenced-revenue').status,'ready');
  assert.equal(foundation.catalog.find(x=>x.id==='protected-revenue').status,'ready');
});
