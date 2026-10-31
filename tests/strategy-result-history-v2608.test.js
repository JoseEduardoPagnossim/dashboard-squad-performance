const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const result=require(join(root,'js','strategy-result.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.8.sql'),'utf8');

function frozen(competence,{revision=1,source='close',cost=100,direct=120,influenced=30,protectedRevenue=20,fingerprint='hist',financialRevision=revision,ruleVersion='RE-0.9.0-result-history'}={}){
  return {
    competence,status:'closed',revision,financial_snapshot_revision:financialRevision,snapshot_version:'RS-1.0.0',rule_version:ruleVersion,source,snapshot_fingerprint:fingerprint,squad_code:'ALL',credited_event_count:1,total_cost:cost,fte:1,
    direct_revenue:direct,direct_mrr:0,direct_arr:0,influenced_revenue:influenced,influenced_mrr:0,influenced_arr:0,protected_revenue:protectedRevenue,protected_mrr:0,protected_arr:0,
    direct_net_return:direct-cost,direct_roi_pct:cost>0?((direct-cost)/cost)*100:null,direct_cost_coverage:cost>0?direct/cost:null,influenced_impact_per_cost:cost>0?influenced/cost:null,protected_impact_per_cost:cost>0?protectedRevenue/cost:null
  };
}

test('V2.60.8 publica snapshots e histórico de Resultado',()=>{
  assert.equal(pkg.version,'2.63.9');
  assert.equal(pkg.assetVersion,'2.63.9-r1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.equal(result.CATALOG.find(item=>item.id==='result-history')?.state,'ready');
  assert.ok(existsSync(join(root,'docs','RESULTADO_HISTORICO_V2.60.8.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.8.sql')));
  assert.match(index,/V2\.60\.8 • SNAPSHOTS, HISTÓRICO E EVOLUÇÃO/);
  assert.match(index,/strategyResultHistoryRows/);
  assert.ok(index.includes('js/strategy-result.js?v=2.63.9-r1'));
});

test('histórico ordena competências e calcula evolução entre snapshots fechados',()=>{
  const h=result.buildResultHistory({scope:{squadCode:'all'},history:{source_available:true,snapshot_version:'RS-1.0.0',rows:[
    frozen('2026-09',{cost:800,direct:1000,influenced:500,protectedRevenue:200,fingerprint:'sep'}),
    frozen('2026-10',{cost:1000,direct:1400,influenced:450,protectedRevenue:500,fingerprint:'oct'})
  ]}});
  assert.equal(h.rows.length,2);
  assert.equal(h.latest.competence,'2026-10');
  assert.equal(h.previous.competence,'2026-09');
  assert.equal(h.evolution.directRevenueDelta,400);
  assert.equal(h.evolution.protectedRevenueDelta,300);
  assert.equal(h.evolution.directRoiPctDelta,15);
  assert.equal(h.evolution.directRevenueChangePct,40);
});

test('histórico não cria total econômico somando naturezas distintas',()=>{
  const h=result.buildResultHistory({history:{source_available:true,rows:[frozen('2026-10',{cost:50,direct:100,influenced:200,protectedRevenue:300})]}});
  assert.equal(Object.hasOwn(h.latest,'totalEconomicRevenue'),false);
  assert.equal(Object.hasOwn(h.evolution,'totalEconomicRevenueDelta'),false);
});

test('snapshot legacy_backfill permanece identificado e documentado como reconstrução',()=>{
  const h=result.buildResultHistory({history:{source_available:true,rows:[frozen('2026-10',{source:'legacy_backfill'})]}});
  assert.equal(h.latest.source,'legacy_backfill');
  assert.ok(h.warnings.some(item=>/legacy_backfill/.test(item)));
});

test('migration cria snapshot revisionado ligado ao snapshot financeiro',()=>{
  assert.match(migration,/create table if not exists public\.strategy_result_snapshots/i);
  assert.match(migration,/financial_snapshot_revision integer not null/i);
  assert.match(migration,/snapshot_fingerprint text not null/i);
  assert.match(migration,/RS-1\.0\.0/);
  assert.match(migration,/RE-0\.9\.0-result-history/);
  assert.match(migration,/v_fin\.snapshot->'summary'/);
  assert.match(migration,/v_fin\.snapshot->'squads'/);
});

test('fechamento captura Resultado e preserva revisões anteriores',()=>{
  assert.match(migration,/create trigger strategy_result_snapshot_on_close/i);
  assert.match(migration,/capture_strategy_result_snapshot\(new\.id,'close'\)/i);
  assert.match(migration,/unique \(organization_id,competence_id,revision\)/i);
  assert.match(migration,/on conflict \(organization_id,competence_id,revision\) do nothing/i);
});

test('competência fechada bloqueia mutação de eventos e atribuições no banco',()=>{
  assert.match(migration,/strategy_result_events_open_guard/i);
  assert.match(migration,/strategy_result_attributions_open_guard/i);
  assert.match(migration,/strategy result competence is closed/i);
  assert.match(migration,/before insert or update or delete on public\.strategy_result_events/i);
});

test('histórico RPC escolhe operação em Todos e Squad no filtro específico',()=>{
  assert.match(migration,/get_strategy_result_snapshot_history/i);
  assert.match(migration,/when v_all then coalesce\(l\.snapshot->'operation'/i);
  assert.match(migration,/jsonb_array_elements\(coalesce\(l\.snapshot->'squads'/i);
  assert.match(migration,/order by competence/i);
});

test('app carrega e renderiza snapshots sem recalcular competências antigas',()=>{
  assert.match(app,/get_strategy_result_snapshot_history/);
  assert.match(app,/renderStrategyResultHistory/);
  assert.match(app,/buildResultHistory/);
  assert.match(app,/legacy_backfill/);
  assert.match(index,/Histórico não é recálculo/);
});

test('roadmap marca V2.60.8 como ativa e mantém ROI baseado em Receita Direta',()=>{
  assert.equal(result.CATALOG.find(item=>item.id==='result-history')?.version,'V2.60.8');
  assert.equal(result.CATALOG.find(item=>item.id==='result-history')?.state,'ready');
  const h=result.buildResultHistory({history:{source_available:true,rows:[frozen('2026-10',{cost:50,direct:100,influenced:900,protectedRevenue:900})]}});
  assert.equal(h.latest.directRoiPct,100);
  assert.equal(h.latest.directRevenue,100);
});
