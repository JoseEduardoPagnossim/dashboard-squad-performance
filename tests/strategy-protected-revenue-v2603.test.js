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
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.3.sql'),'utf8');

test('V2.60.3 publica Receita Protegida com retenção, recuperação e prevenção',()=>{
  assert.equal(pkg.version,'2.61.1');
  assert.equal(pkg.assetVersion,'2.61.1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.deepEqual(result.PROTECTED_TYPE_IDS,['retention','recovery','cancellation_prevention']);
  assert.ok(existsSync(join(root,'docs','RESULTADO_RECEITA_PROTEGIDA_V2.60.3.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.3.sql')));
  assert.match(index,/V2\.60\.3 • RECEITA PROTEGIDA/);
  assert.match(index,/strategyProtectedRevenueTotal/);
  assert.match(index,/strategyAddProtectedRevenueBtn/);
  assert.ok(index.includes('js/strategy-result.js?v=2.61.1'));
});

test('motor separa receita em risco, protegida e perdida sem somar recorrência no total',()=>{
  const protectedRevenue=result.buildProtectedRevenue({scope:{competence:'2026-10',squadCode:'D'},aggregate:{
    source_available:true,case_count:7,draft_count:2,protected_count:4,lost_count:1,
    protected_revenue_total:5000,at_risk_amount:1800,protected_mrr:1200,protected_arr:14400,at_risk_mrr:350,at_risk_arr:4200,
    protection_rate:.8,attributed_event_count:7,unattributed_event_count:0,source_count:2,
    types:[
      {type:'retention',case_count:4,draft_count:1,protected_count:2,lost_count:1,protected_revenue_total:3000,protected_mrr:800,protected_arr:9600},
      {type:'cancellation_prevention',case_count:3,draft_count:1,protected_count:2,lost_count:0,protected_revenue_total:2000,protected_mrr:400,protected_arr:4800}
    ]
  }});
  assert.equal(protectedRevenue.status,'ready');
  assert.equal(protectedRevenue.protectedRevenueTotal,5000);
  assert.equal(protectedRevenue.protectedMrr,1200);
  assert.equal(protectedRevenue.protectedArr,14400);
  assert.equal(protectedRevenue.atRiskMrr,350);
  assert.equal(protectedRevenue.protectionRate,.8);
  assert.equal(protectedRevenue.types.find(x=>x.id==='retention').protectedCount,2);
  assert.ok(protectedRevenue.warnings.some(x=>/não é nova venda/i.test(x)));
  assert.ok(protectedRevenue.warnings.some(x=>/MRR e ARR protegidos.*não são somados/i.test(x)));
});

test('taxa de proteção deriva apenas de casos encerrados quando RPC não informa',()=>{
  const protectedRevenue=result.buildProtectedRevenue({aggregate:{sourceAvailable:true,protectedCount:3,lostCount:1,protectionRate:0}});
  assert.equal(protectedRevenue.protectionRate,.75);
});

test('normalização reconhece natureza e datas de proteção',()=>{
  const row=result.normalizeEvent({result_type:'protected',protected_revenue_type:'RETENTION',protection_verified_at:'2026-10-20T12:00:00Z',protection_lost_at:null});
  assert.equal(row.protectedRevenueType,'retention');
  assert.equal(row.protectionVerifiedAt,'2026-10-20T12:00:00Z');
  assert.equal(result.normalizeProtectedType('x'),'');
});

test('contexto financeiro preserva agregado de Receita Protegida e composição',()=>{
  const ctx=data.buildFinancialContext({resultProtectedRevenue:{source_available:true,competence:'2026-10',squad_code:'D',case_count:3,protected_count:2,protected_mrr:900,types:[{type:'recovery',case_count:3,protected_count:2,protected_mrr:900}]}});
  assert.equal(ctx.resultProtectedRevenue.sourceAvailable,true);
  assert.equal(ctx.resultProtectedRevenue.caseCount,3);
  assert.equal(ctx.resultProtectedRevenue.protectedMrr,900);
  assert.equal(ctx.resultProtectedRevenue.types[0].type,'recovery');
});

test('migration exige tipo, valor e validação para protegido confirmado',()=>{
  assert.match(migration,/add column if not exists protected_revenue_type/i);
  assert.match(migration,/add column if not exists protection_verified_at/i);
  assert.match(migration,/add column if not exists protection_lost_at/i);
  assert.match(migration,/'retention','recovery','cancellation_prevention'/i);
  assert.match(migration,/validate_strategy_protected_revenue_event/i);
  assert.match(migration,/protected revenue requires amount, MRR or ARR/i);
  assert.match(migration,/protection verification date required for confirmed protected revenue/i);
  assert.match(migration,/new\.protection_lost_at:=now\(\)/i);
  assert.match(migration,/protection verification cannot precede protected revenue event/i);
  assert.match(migration,/protection loss cannot precede protected revenue event/i);
});

test('RPC agrega somente proteção confirmada e validada e mantém risco separado',()=>{
  assert.match(migration,/get_strategy_protected_revenue_summary/i);
  assert.match(migration,/e\.result_type='protected'/i);
  assert.match(migration,/status='confirmed' and protection_verified_at is not null and protection_lost_at is null/i);
  assert.match(migration,/sum\(gross_amount\) filter \(where status='draft'\)/i);
  assert.match(migration,/protected_mrr/i);
  assert.match(migration,/at_risk_mrr/i);
  assert.doesNotMatch(migration,/protected_revenue_total[^\n]*\+[^\n]*(protected_mrr|protected_arr)/i);
});

test('filtro de Squad usa EXISTS nas atribuições sem multiplicar o caso protegido',()=>{
  assert.match(migration,/exists\s*\(\s*select 1\s*from public\.strategy_result_attributions/i);
  assert.match(migration,/a\.event_id=e\.id/i);
  assert.match(migration,/squad_code_snapshot/i);
});

test('app registra, confirma e marca perda preservando auditoria',()=>{
  assert.match(app,/get_strategy_protected_revenue_summary/);
  assert.match(app,/function renderStrategyProtectedRevenue\(/);
  assert.match(app,/function addStrategyProtectedRevenue\(/);
  assert.match(app,/result_type:'protected'/);
  assert.match(app,/protected_revenue_type:type/);
  assert.match(app,/attribution_role:'retainer'/);
  assert.match(app,/function confirmStrategyProtectedRevenue\(/);
  assert.match(app,/protection_verified_at:verifiedAt/);
  assert.match(app,/function cancelStrategyProtectedRevenue\(/);
  assert.match(app,/protection_lost_at:lostAt/);
  assert.match(app,/strategy\.protected_revenue_create/);
});

test('roadmap ativa as três naturezas econômicas e mantém resultado por técnico planejado',()=>{
  const foundation=result.buildFoundation({aggregate:{sourceAvailable:true}});
  assert.equal(foundation.catalog.find(x=>x.id==='direct-revenue').status,'ready');
  assert.equal(foundation.catalog.find(x=>x.id==='influenced-revenue').status,'ready');
  assert.equal(foundation.catalog.find(x=>x.id==='protected-revenue').status,'ready');
  assert.equal(foundation.catalog.find(x=>x.id==='result-by-technician').status,'ready');
});
