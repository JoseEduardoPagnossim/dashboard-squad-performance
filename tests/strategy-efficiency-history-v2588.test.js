const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const data=require(join(root,'js','strategy-data.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.58.8.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','EFICIENCIA_SNAPSHOTS_HISTORICO_V2.58.8.md');

test('V2.58.8 publica snapshots, historico e evolucao com migration propria',()=>{
  assert.equal(pkg.version,'2.62.8');
  assert.equal(pkg.assetVersion,'2.62.8-r1');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.equal(efficiency.SNAPSHOT_VERSION,'ES-1.0.0');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/INDICADOR V2\.58\.8/);
  assert.match(index,/strategyEfficiencyHistoryRows/);
  assert.match(index,/strategyEfficiencyEvolutionChart/);
  assert.match(index,/strategyEfficiencyEvolutionIndexChart/);
  assert.match(app,/get_strategy_efficiency_history/);
  assert.match(app,/renderStrategyEfficiencyHistory/);
});

test('migration mantem snapshot por revisao e captura automaticamente no fechamento',()=>{
  assert.match(migration,/create table if not exists public\.strategy_efficiency_snapshots/i);
  assert.match(migration,/unique \(organization_id, competence_id, revision\)/i);
  assert.match(migration,/strategy_efficiency_snapshot_on_close/i);
  assert.match(migration,/after update of status on public\.strategy_competences/i);
  assert.match(migration,/capture_strategy_efficiency_snapshot\(new\.id,'close'\)/i);
  assert.match(migration,/legacy_backfill/i);
  assert.match(migration,/get_strategy_efficiency_history/i);
});

test('snapshot normalizado preserva origem, revisao e benchmark congelado',()=>{
  const row=data.normalizeEfficiencyHistoryRow({competence:'2026-09',status:'closed',revision:2,snapshot_version:'ES-1.0.0',rule_version:'EF-0.8.0-snapshots-history',source:'close',operation:{total_cost:10000,attendance:500,resolutions:400,economic_productivity:40,cost_per_resolution:25,resolution_rate:.8,evaluation_rate:.4},squads:[{squad_code:'D',total_cost:4000,resolutions:180,resolution_entries:4,economic_productivity:45}],benchmarks:{operation_benchmark:40,median_benchmark:42,best_squad_code:'D',best_value:45}});
  assert.equal(row.competence,'2026-09');
  assert.equal(row.revision,2);
  assert.equal(row.source,'close');
  assert.equal(row.operation.economicProductivity,40);
  assert.equal(row.squads[0].squadCode,'D');
  assert.equal(row.benchmarks.bestSquadCode,'D');
});

test('evolucao usa fotografia do Squad sem trocar a referencia congelada da operacao',()=>{
  const history=[
    {competence:'2026-08',source:'close',revision:1,operation:{totalCost:10000,resolutions:400,resolutionEntries:8,economicProductivity:40,costPerResolution:25},squads:[{squadCode:'D',totalCost:4000,resolutions:180,resolutionEntries:3,economicProductivity:45,costPerResolution:22.222}]},
    {competence:'2026-09',source:'close',revision:1,operation:{totalCost:11000,resolutions:462,resolutionEntries:8,economicProductivity:42,costPerResolution:23.81},squads:[{squadCode:'D',totalCost:4200,resolutions:210,resolutionEntries:3,economicProductivity:50,costPerResolution:20}]}
  ];
  const result=efficiency.buildEfficiencyEvolution(history,{squadCode:'D'});
  assert.equal(result.readyCount,2);
  assert.equal(result.rows[1].metric.economicProductivity,50);
  assert.equal(result.rows[1].operation.economicProductivity,42);
  assert.ok(result.latestProductivityDelta>.11&&result.latestProductivityDelta<.12);
  assert.equal(result.rows[0].productivityIndex,100);
  assert.ok(result.rows[1].productivityIndex>111);
});

test('historico distingue snapshot oficial, backfill e previa aberta',()=>{
  const rows=[
    {competence:'2026-07',source:'legacy_backfill',revision:1,operation:{totalCost:100,resolutions:10,resolutionEntries:1}},
    {competence:'2026-08',source:'close',revision:1,operation:{totalCost:100,resolutions:12,resolutionEntries:1}},
    {competence:'2026-09',source:'live_preview',revision:0,operation:{totalCost:100,resolutions:14,resolutionEntries:1}}
  ];
  const result=efficiency.buildEfficiencyEvolution(rows);
  assert.equal(result.backfillCount,1);
  assert.equal(result.frozenCount,1);
  assert.equal(result.liveCount,1);
});
