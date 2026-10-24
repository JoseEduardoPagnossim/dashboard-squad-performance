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

test('V2.60.8 publica snapshots e histórico de Resultado',()=>{
  assert.equal(pkg.version,'2.60.8');
  assert.equal(pkg.assetVersion,'2.60.8');
  assert.equal(result.RULE_VERSION,'RE-0.9.0-result-history');
  assert.equal(result.CATALOG.find(item=>item.id==='result-history')?.state,'ready');
  assert.ok(existsSync(join(root,'docs','RESULTADO_HISTORICO_V2.60.8.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.8.sql')));
  assert.match(index,/V2\.60\.8 • SNAPSHOTS, HISTÓRICO E EVOLUÇÃO/);
  assert.match(index,/strategyResultHistoryRows/);
  assert.ok(index.includes('js/strategy-result.js?v=2.60.8'));
});

test('histórico ordena competências e calcula evolução entre snapshots fechados',()=>{
  const h=result.buildResultHistory({scope:{squadCode:'all'},history:{source_available:true,snapshot_version:'RS-1.0.0',rows:[
    {competence:'2026-09',squad_code:'ALL',direct_revenue:1000,influenced_revenue:500,protected_revenue:200,total_cost:800,direct_roi_pct:25,direct_cost_coverage:1.25},
    {competence:'2026-10',squad_code:'ALL',direct_revenue:1400,influenced_revenue:450,protected_revenue:500,total_cost:1000,direct_roi_pct:40,direct_cost_coverage:1.4}
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
  const h=result.buildResultHistory({history:{source_available:true,rows:[{competence:'2026-10',direct_revenue:100,influenced_revenue:200,protected_revenue:300}]}});
  assert.equal(Object.hasOwn(h.latest,'totalEconomicRevenue'),false);
  assert.equal(Object.hasOwn(h.evolution,'totalEconomicRevenueDelta'),false);
});

test('snapshot legacy_backfill permanece identificado e documentado como reconstrução',()=>{
  const h=result.buildResultHistory({history:{source_available:true,rows:[{competence:'2026-10',source:'legacy_backfill'}]}});
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
  assert.equal(result.CATALOG.at(-1).version,'V2.60.8');
  assert.equal(result.CATALOG.at(-1).state,'ready');
  const h=result.buildResultHistory({history:{source_available:true,rows:[{competence:'2026-10',direct_revenue:100,influenced_revenue:900,protected_revenue:900,total_cost:50,direct_roi_pct:100}]}});
  assert.equal(h.latest.directRoiPct,100);
  assert.equal(h.latest.directRevenue,100);
});
