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
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.2.sql'),'utf8');

test('V2.60.2 publica Receita Influenciada separada da Receita Direta',()=>{
  assert.equal(pkg.version,'2.62.9');
  assert.equal(pkg.assetVersion,'2.62.9-r1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.ok(result.INFLUENCE_STAGE_IDS.includes('originated'));
  assert.ok(result.INFLUENCE_STAGE_IDS.includes('qualified'));
  assert.ok(result.INFLUENCE_STAGE_IDS.includes('evolved'));
  assert.ok(existsSync(join(root,'docs','RESULTADO_RECEITA_INFLUENCIADA_V2.60.2.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.2.sql')));
  assert.match(index,/V2\.60\.2 • RECEITA INFLUENCIADA/);
  assert.match(index,/strategyInfluencedRevenueTotal/);
  assert.match(index,/strategyInfluencedRevenueStage/);
  assert.match(index,/strategyAddInfluencedRevenueBtn/);
  assert.ok(index.includes('js/strategy-result.js?v=2.62.9-r1'));
});

test('motor separa pipeline aberto de receita influenciada convertida',()=>{
  const influenced=result.buildInfluencedRevenue({scope:{competence:'2026-10',squadCode:'D'},aggregate:{
    source_available:true,opportunity_count:8,draft_count:3,converted_count:4,cancelled_count:1,
    influenced_revenue_total:12000,open_potential_amount:7000,monthly_recurring_amount:900,annual_recurring_amount:10800,conversion_rate:.8,
    attributed_event_count:8,unattributed_event_count:0,source_count:2,
    stages:[
      {stage:'originated',opportunity_count:3,draft_count:1,converted_count:2,cancelled_count:0,influenced_revenue_total:7000,open_potential_amount:2500},
      {stage:'qualified',opportunity_count:5,draft_count:2,converted_count:2,cancelled_count:1,influenced_revenue_total:5000,open_potential_amount:4500}
    ]
  }});
  assert.equal(influenced.status,'ready');
  assert.equal(influenced.influencedRevenueTotal,12000);
  assert.equal(influenced.openPotentialAmount,7000);
  assert.equal(influenced.convertedCount,4);
  assert.equal(influenced.conversionRate,.8);
  assert.equal(influenced.stages.find(x=>x.id==='originated').influencedRevenueTotal,7000);
  assert.ok(influenced.warnings.some(x=>/pipeline influenciado, não receita/i.test(x)));
});

test('taxa de conversão é derivada apenas sobre oportunidades encerradas quando RPC não informa',()=>{
  const influenced=result.buildInfluencedRevenue({aggregate:{sourceAvailable:true,convertedCount:3,cancelledCount:1,conversionRate:0}});
  assert.equal(influenced.conversionRate,.75);
});

test('normalização reconhece etapa de influência e rejeita etapa desconhecida',()=>{
  assert.equal(result.normalizeEvent({result_type:'influenced',influenced_revenue_stage:'QUALIFIED'}).influencedRevenueStage,'qualified');
  assert.equal(result.normalizeEvent({result_type:'influenced',influenced_revenue_stage:'x'}).influencedRevenueStage,'');
});

test('contexto financeiro preserva agregado de Receita Influenciada e etapas',()=>{
  const ctx=data.buildFinancialContext({resultInfluencedRevenue:{source_available:true,competence:'2026-10',squad_code:'D',opportunity_count:2,converted_count:1,influenced_revenue_total:800,stages:[{stage:'handoff',opportunity_count:2,converted_count:1,influenced_revenue_total:800}]}});
  assert.equal(ctx.resultInfluencedRevenue.sourceAvailable,true);
  assert.equal(ctx.resultInfluencedRevenue.opportunityCount,2);
  assert.equal(ctx.resultInfluencedRevenue.influencedRevenueTotal,800);
  assert.equal(ctx.resultInfluencedRevenue.stages[0].stage,'handoff');
});

test('migration exige etapa, referência no convertido e agrega receita apenas de confirmed',()=>{
  assert.match(migration,/add column if not exists influenced_revenue_stage/i);
  assert.match(migration,/'originated','qualified','evolved'/i);
  assert.match(migration,/validate_strategy_influenced_revenue_event/i);
  assert.match(migration,/new\.result_type='influenced'/i);
  assert.match(migration,/new\.status='confirmed'/i);
  assert.match(migration,/source reference required for confirmed influenced revenue/i);
  assert.match(migration,/get_strategy_influenced_revenue_summary/i);
  assert.match(migration,/e\.result_type='influenced'/i);
  assert.match(migration,/sum\(gross_amount\) filter \(where status='confirmed'\)/i);
  assert.match(migration,/sum\(gross_amount\) filter \(where status='draft'\)/i);
  assert.doesNotMatch(migration,/sum\(gross_amount\).*result_type='direct'/i);
});

test('filtro de Squad usa EXISTS nas atribuições e não multiplica o evento',()=>{
  assert.match(migration,/exists\s*\(\s*select 1\s*from public\.strategy_result_attributions/i);
  assert.match(migration,/a\.event_id=e\.id/i);
  assert.match(migration,/squad_code_snapshot/i);
});

test('app carrega agregado e registra oportunidade com atribuição sem crédito integral',()=>{
  assert.match(app,/get_strategy_influenced_revenue_summary/);
  assert.match(app,/function renderStrategyInfluencedRevenue\(/);
  assert.match(app,/function addStrategyInfluencedRevenue\(/);
  assert.match(app,/result_type:'influenced'/);
  assert.match(app,/influenced_revenue_stage:stage/);
  assert.match(app,/stage==='originated'\?'originator':'contributor'/);
  assert.match(app,/attribution_share:null/);
  assert.match(app,/strategy\.influenced_revenue_create/);
  assert.match(app,/function cancelStrategyInfluencedRevenue\(/);
});

test('roadmap ativa Receita Direta e Influenciada e mantém Protegida planejada',()=>{
  const foundation=result.buildFoundation({aggregate:{sourceAvailable:true}});
  assert.equal(foundation.catalog.find(x=>x.id==='direct-revenue').status,'ready');
  assert.equal(foundation.catalog.find(x=>x.id==='influenced-revenue').status,'ready');
  assert.equal(foundation.catalog.find(x=>x.id==='protected-revenue').status,'ready');
});
