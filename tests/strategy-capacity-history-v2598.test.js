const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const capacity=require(join(root,'js','strategy-capacity.js'));
const data=require(join(root,'js','strategy-data.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.59.8.sql');
const migration=readFileSync(migrationPath,'utf8');

function snapshot(competence,{source='close',availableFte=4,resolutions=1000,resolutionPerFte=250,attendance=1200,attendancePerFte=300,fcr=null}={}){
  return {competence,squadCode:'ALL',status:'closed',revision:1,snapshotVersion:'CS-1.0.0',ruleVersion:'CA-0.9.0-snapshots-history',source,financialSnapshotRevision:1,candidateCount:4,nominalFte:4,availableFte,availabilityRate:1,availabilityComplete:true,complete:true,usedCapacityVolume:resolutions,usedPerAvailableFte:resolutionPerFte,attendanceComplete:true,attendanceVolume:attendance,attendancePerAvailableFte:attendancePerFte,resolutionRate:fcr??(attendance>0?resolutions/attendance:null)};
}

test('V2.59.8 publica snapshots e evolucao de capacidade',()=>{
  assert.equal(pkg.version,'2.62.2');
  assert.equal(pkg.assetVersion,'2.62.2-r1');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.ok(existsSync(migrationPath));
  assert.ok(existsSync(join(root,'docs','CAPACIDADE_SNAPSHOTS_HISTORICO_V2.59.8.md')));
  for(const id of ['strategyCapacitySnapshotCount','strategyCapacitySnapshotOfficial','strategyCapacitySnapshotBackfill','strategyCapacitySnapshotLatestStatus','strategyCapacityEvolutionFteChart','strategyCapacityEvolutionUtilizationChart','strategyCapacityHistoryRows']) assert.ok(index.includes(`id="${id}"`),id);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.62.2-r1'));
  assert.match(app,/get_strategy_capacity_snapshot_history/);
  assert.match(app,/renderStrategyCapacityHistory/);
});

test('migration cria snapshot revisionado, trigger de fechamento, backfill identificado e RPC congelada',()=>{
  assert.match(migration,/create table if not exists public\.strategy_capacity_snapshots/i);
  assert.match(migration,/unique \(organization_id, competence_id, revision\)/i);
  assert.match(migration,/financial_snapshot_revision=revision/i);
  assert.match(migration,/capture_strategy_capacity_snapshot\(new\.id,'close'\)/i);
  assert.match(migration,/strategy_capacity_snapshot_on_close/i);
  assert.match(migration,/capture_strategy_capacity_snapshot\(r\.id,'legacy_backfill'\)/i);
  assert.match(migration,/create or replace function public\.get_strategy_capacity_snapshot_history\(\)/i);
  assert.match(migration,/from public\.strategy_capacity_snapshots scs/i);
  assert.match(migration,/select public\.get_strategy_capacity_snapshot_history\(\)/i);
  assert.match(migration,/revoke all on function public\.capture_strategy_capacity_snapshot\(uuid,text\) from authenticated/i);
});

test('normalizacao preserva metadados do snapshot e zero como dado valido',()=>{
  const row=data.normalizeCapacityHistoryRow({competence:'2026-10-01',squad_code:'A',status:'closed',revision:2,snapshot_version:'CS-1.0.0',rule_version:'CA-0.9.0-snapshots-history',source:'legacy_backfill',financial_snapshot_revision:2,candidate_count:3,nominal_fte:3,available_fte:2.5,availability_rate:0.833333,availability_complete:true,used_capacity_complete:true,used_capacity_volume:0,used_per_available_fte:0,attendance_complete:true,attendance_volume:0,attendance_per_available_fte:0,resolution_rate:0});
  assert.equal(row.competence,'2026-10');
  assert.equal(row.revision,2);
  assert.equal(row.source,'legacy_backfill');
  assert.equal(row.financialSnapshotRevision,2);
  assert.equal(row.availableFte,2.5);
  assert.equal(row.usedCapacityVolume,0);
  assert.equal(row.attendanceVolume,0);
  assert.equal(row.resolutionRate,0);
  assert.equal(row.availabilityComplete,true);
});

test('evolucao recalcula utilizacao, FTE necessario, gap e diagnostico usando somente snapshots anteriores',()=>{
  const history=[
    snapshot('2026-08',{source:'legacy_backfill',resolutions:1000,resolutionPerFte:250,attendance:1200,attendancePerFte:300}),
    snapshot('2026-09',{resolutions:1040,resolutionPerFte:260,attendance:1240,attendancePerFte:310}),
    snapshot('2026-10',{resolutions:1200,resolutionPerFte:300,attendance:1500,attendancePerFte:375,fcr:.8})
  ];
  const evolution=capacity.buildCapacityEvolution(history,{squadCode:'ALL',comparison:'previous'});
  assert.equal(evolution.snapshotCount,3);
  assert.equal(evolution.frozenCount,2);
  assert.equal(evolution.backfillCount,1);
  assert.equal(evolution.rows[0].utilizationRate,null);
  assert.equal(evolution.rows[1].referenceResolutionPerFte,250);
  assert.equal(evolution.rows[1].referenceAttendancePerFte,300);
  assert.equal(evolution.rows[2].referenceResolutionPerFte,260);
  assert.equal(evolution.rows[2].referenceAttendancePerFte,310);
  assert.ok(Math.abs(evolution.rows[2].utilizationRate-(300/260))<1e-12);
  assert.ok(Math.abs(evolution.rows[2].requiredFte-(1500/310))<1e-12);
  assert.ok(evolution.rows[2].gapFte<0);
  assert.equal(evolution.rows[2].diagnosticTitle,'DÉFICIT COM SOBRECARGA');
});

test('historico permanece fail-closed quando a janela exige competencia ausente',()=>{
  const history=[snapshot('2026-08'),snapshot('2026-10',{resolutions:1200,resolutionPerFte:300,attendance:1500,attendancePerFte:375})];
  const evolution=capacity.buildCapacityEvolution(history,{squadCode:'ALL',comparison:'previous'});
  const october=evolution.rows.find(row=>row.competence==='2026-10');
  assert.equal(october.utilizationRate,null);
  assert.equal(october.requiredFte,null);
  assert.equal(october.gapFte,null);
  assert.equal(october.diagnosticReady,false);
});
