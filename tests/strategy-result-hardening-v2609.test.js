const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const result=require(join(root,'js','strategy-result.js'));
const data=require(join(root,'js','strategy-data.js'));
const strategy=require(join(root,'js','strategy.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.60.9.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','HARDENING_RESULTADO_V2.60.9.md');

function frozen(competence,{revision=1,source='close',cost=100,direct=120,influenced=30,protectedRevenue=20,fingerprint='abc',financialRevision=revision,ruleVersion='RE-0.9.0-result-history'}={}){
  const net=direct-cost;
  return {
    competence,status:'closed',revision,snapshot_version:'RS-1.0.0',rule_version:ruleVersion,source,
    financial_snapshot_revision:financialRevision,snapshot_fingerprint:fingerprint,credited_event_count:1,total_cost:cost,fte:1,
    direct_revenue:direct,direct_mrr:0,direct_arr:0,influenced_revenue:influenced,influenced_mrr:0,influenced_arr:0,
    protected_revenue:protectedRevenue,protected_mrr:0,protected_arr:0,
    direct_net_return:cost>0?net:null,direct_roi_pct:cost>0?net/cost*100:null,direct_cost_coverage:cost>0?direct/cost:null,
    influenced_impact_per_cost:cost>0?influenced/cost:null,protected_impact_per_cost:cost>0?protectedRevenue/cost:null
  };
}

test('V2.60.9 fecha a Fase 5 com hardening versionado',()=>{
  assert.equal(pkg.version,'2.61.4');
  assert.equal(pkg.assetVersion,'2.61.4-r1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.equal(result.RESULT_SNAPSHOT_VERSION,'RS-1.0.0');
  assert.equal(result.RESULT_HARDENING_VERSION,'RH-1.0.0');
  assert.equal(result.CATALOG.at(-1).version,'V2.60.9');
  assert.equal(result.CATALOG.at(-1).state,'ready');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/V2\.60\.9 • HARDENING E FECHAMENTO DA FASE 5/);
  assert.ok(index.includes('js/strategy-result.js?v=2.61.4-r1'));
});

test('historico escolhe maior revisao e desempata fechamento oficial sobre backfill',()=>{
  const rows=result.latestResultSnapshots([
    frozen('2026-09',{revision:1,source:'close',direct:100}),
    frozen('2026-09',{revision:2,source:'legacy_backfill',direct:200}),
    frozen('2026-09',{revision:2,source:'close',direct:250}),
    frozen('2026-10',{revision:1,source:'close',direct:300})
  ]);
  assert.equal(rows.length,2);
  assert.equal(rows[0].revision,2);
  assert.equal(rows[0].source,'close');
  assert.equal(rows[0].directRevenue,250);
});

test('snapshot com contrato invalido fica fora da evolucao em modo fail-closed',()=>{
  const valid=frozen('2026-09');
  const invalid=frozen('2026-10',{financialRevision:2});
  const history=result.buildResultHistory({history:{source_available:true,snapshot_version:'RS-1.0.0',hardening:{version:'RH-1.0.0',invalid_snapshot_count:1},rows:[valid,invalid]}});
  assert.equal(history.rows.length,1);
  assert.equal(history.latest.competence,'2026-09');
  assert.equal(history.integrity.invalidCount,1);
  assert.equal(history.integrity.hardeningApplied,true);
  assert.equal(result.normalizeResultHistoryRow(invalid).contractValid,false);
});

test('formula historica de ROI e revisao financeira sao revalidadas no cliente',()=>{
  const wrongRoi={...frozen('2026-10'),direct_roi_pct:999};
  const row=result.normalizeResultHistoryRow(wrongRoi);
  assert.equal(row.contractValid,false);
  assert.ok(row.contractIssues.includes('direct_roi_pct'));
  const missing=data.normalizeResultHistoryRow({competence:'2026-10',revision:1,snapshot_version:'RS-1.0.0'});
  assert.equal(missing.totalCost,null);
  assert.equal(missing.directRevenue,null);
});

test('ROI consolidado explicita receita ainda sem rateio e nao a perde do numerador',()=>{
  const roi=result.buildOperationalReturn({aggregate:{source_available:true,total_cost:100,direct_revenue:150,influenced_revenue:50,protected_revenue:20,unallocated_direct_revenue:30,unallocated_influenced_revenue:10,unallocated_protected_revenue:0,direct_roi_pct:50,direct_cost_coverage:1.5,rows:[]}});
  assert.equal(roi.directRevenue,150);
  assert.equal(roi.unallocatedDirectRevenue,30);
  assert.equal(roi.unallocatedInfluencedRevenue,10);
  assert.equal(roi.allocationComplete,false);
  assert.equal(roi.directRoiPct,50);
});

test('controller preserva resultHistory e metadados de hardening no view model',()=>{
  const controller=strategy.createController();
  controller.initializeContext({squads:{A:{code:'A',competences:['2026-10']}}});
  controller.setFinancialData({competences:[{competence:'2026-10',status:'closed'}],resultHistory:{source_available:true,hardening:{version:'RH-1.0.0'},rows:[frozen('2026-10')]}});
  const vm=controller.viewModel();
  assert.equal(vm.financial.resultHistory.hardening.version,'RH-1.0.0');
  assert.equal(vm.financial.resultHistory.rows.length,1);
});

test('migration serializa shares e bloqueia fechamento sem atribuicao economica completa',()=>{
  assert.match(migration,/validate_strategy_result_attribution_share_total/i);
  assert.match(migration,/from public\.strategy_result_events e[\s\S]*for update/i);
  assert.match(migration,/validate_strategy_result_close_integrity/i);
  assert.match(migration,/strategy result close blocked/i);
  assert.match(migration,/null_share_count=0 and abs\(explicit_share_sum-1\)>0\.000001/i);
  assert.match(migration,/strategy_result_close_integrity_guard/i);
});

test('migration torna snapshot bruto imutavel, sem leitura direta e valida fingerprint/contrato',()=>{
  assert.match(migration,/revoke select on table public\.strategy_result_snapshots from authenticated/i);
  assert.match(migration,/strategy_result_snapshots_snapshot_version_match/i);
  assert.match(migration,/strategy_result_snapshots_financial_revision_match/i);
  assert.match(migration,/strategy_result_snapshots_fingerprint_match/i);
  assert.match(migration,/snapshot_fingerprint=md5\(snapshot::text\)/i);
  assert.match(migration,/prevent_strategy_result_snapshot_mutation/i);
  assert.match(migration,/before update or delete on public\.strategy_result_snapshots/i);
  assert.match(migration,/strategy result snapshots are immutable/i);
});

test('historico do banco e deterministico, exclui reabertas e rejeita contrato invalido',()=>{
  assert.match(migration,/row_number\(\) over/i);
  assert.match(migration,/case srs\.source when 'close' then 0 else 1 end/i);
  assert.match(migration,/where a\.competence_status='closed'[\s\S]*and a\.contract_valid/i);
  assert.match(migration,/invalid_snapshot_count/i);
  assert.match(migration,/'version','RH-1\.0\.0'/i);
});

test('ROI da operacao usa total oficial e mantem linhas por Squad rateadas',()=>{
  assert.match(migration,/get_strategy_direct_revenue_summary\(p_competence,null\)/i);
  assert.match(migration,/get_strategy_influenced_revenue_summary\(p_competence,null\)/i);
  assert.match(migration,/get_strategy_protected_revenue_summary\(p_competence,null\)/i);
  assert.match(migration,/unallocated_direct_revenue/i);
  assert.match(migration,/v_direct-v_alloc_direct/i);
});

test('app comunica hardening e erro de fechamento de Resultado de forma operacional',()=>{
  assert.match(app,/strategyResultHardeningAllocation/);
  assert.match(app,/MIGRAÇÃO PENDENTE/);
  assert.match(app,/strategy result close blocked\|full economic attribution/i);
  assert.match(app,/resultados confirmados sem atribuição econômica completa/i);
});
