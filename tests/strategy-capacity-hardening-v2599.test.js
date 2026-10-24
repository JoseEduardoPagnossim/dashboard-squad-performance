const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const capacity=require(join(root,'js','strategy-capacity.js'));
const data=require(join(root,'js','strategy-data.js'));
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.59.9.sql');
const migration=readFileSync(migrationPath,'utf8');
const docPath=join(root,'docs','HARDENING_CAPACIDADE_V2.59.9.md');

function frozen(competence,{revision=1,source='close',availableFte=4,nominalFte=4,resolutions=1000,resolutionPerFte=250,attendance=1200,attendancePerFte=300,usedMissing=0,attendanceMissing=0,inconsistentRows=0,complete=true,attendanceComplete=true,financialRevision=revision}={}){
  return {competence,squadCode:'ALL',status:'closed',revision,snapshotVersion:'CS-1.0.0',ruleVersion:'CA-0.9.0-snapshots-history',source,financialSnapshotRevision:financialRevision,candidateCount:4,nominalFte,availableFte,availabilityRate:nominalFte>0?Math.min(1,availableFte/nominalFte):null,availabilityComplete:true,complete,usedCapacityComplete:complete,usedCapacityMissing:usedMissing,usedCapacityVolume:resolutions,usedPerAvailableFte:resolutionPerFte,attendanceComplete,attendanceMissing,inconsistentRows,attendanceVolume:attendance,attendancePerAvailableFte:attendancePerFte,resolutionRate:attendance>0&&resolutions<=attendance?resolutions/attendance:null};
}

test('V2.59.9 fecha a Fase 4 com hardening versionado',()=>{
  assert.equal(pkg.version,'2.59.9');
  assert.equal(pkg.assetVersion,'2.59.9');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.equal(existsSync(migrationPath),true);
  assert.equal(existsSync(docPath),true);
  assert.match(index,/V2\.59\.9/);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.59.9'));
  assert.ok(index.includes('js/app.js?v=2.59.9'));
});

test('historico escolhe maior revisao independentemente da ordem',()=>{
  const rows=[
    frozen('2026-09',{revision:2,resolutions:1200,resolutionPerFte:300}),
    frozen('2026-09',{revision:1,resolutions:800,resolutionPerFte:200})
  ];
  const selected=capacity.latestCapacitySnapshots(rows);
  assert.equal(selected.length,1);
  assert.equal(selected[0].revision,2);
  assert.equal(selected[0].usedCapacityVolume,1200);
  const reversed=capacity.latestCapacitySnapshots([...rows].reverse());
  assert.equal(reversed[0].revision,2);
  assert.equal(reversed[0].usedCapacityVolume,1200);
});

test('previa de competencia reaberta prevalece sobre snapshot congelado',()=>{
  const selected=capacity.latestCapacitySnapshots([
    frozen('2026-10',{revision:3,resolutions:900}),
    {...frozen('2026-10',{revision:3,resolutions:900}),source:'live_preview',status:'draft',revision:0,financialSnapshotRevision:0,snapshotVersion:'LIVE',ruleVersion:'CA-1.0.0-phase4-hardening',usedCapacityVolume:1100,usedPerAvailableFte:275}
  ]);
  assert.equal(selected.length,1);
  assert.equal(selected[0].source,'live_preview');
  assert.equal(selected[0].usedCapacityVolume,1100);
});

test('snapshot parcial ou inconsistente fica fail-closed mesmo marcado como completo',()=>{
  const missing=capacity.normalizeCapacityHistoryRow(frozen('2026-09',{usedMissing:1}));
  assert.equal(missing.complete,false);
  const inconsistent=capacity.normalizeCapacityHistoryRow(frozen('2026-09',{inconsistentRows:1}));
  assert.equal(inconsistent.complete,false);
  assert.equal(inconsistent.attendanceComplete,false);
  const ref=capacity.buildHistoricalReference([frozen('2026-09',{usedMissing:1})],{competence:'2026-10',squadCode:'ALL',comparison:'previous'});
  assert.equal(ref.ready,false);
  assert.equal(ref.referencePerFte,null);
});

test('aliases vindos do strategy-data preservam faltantes e inconsistencias no motor',()=>{
  const rpc=data.normalizeCapacityHistoryRow({competence:'2026-09',squad_code:'ALL',status:'closed',revision:1,snapshot_version:'CS-1.0.0',rule_version:'CA-0.9.0-snapshots-history',source:'close',financial_snapshot_revision:1,candidate_count:4,nominal_fte:4,available_fte:4,availability_complete:true,availability_missing:0,used_capacity_complete:true,used_capacity_missing:1,used_capacity_volume:1000,used_per_available_fte:250,attendance_complete:true,attendance_missing:0,attendance_volume:1200,attendance_per_available_fte:300,inconsistent_rows:2});
  assert.equal(rpc.usedCapacityMissing,1);
  assert.equal(rpc.inconsistentRows,2);
  const hardened=capacity.normalizeCapacityHistoryRow(rpc);
  assert.equal(hardened.demandMissing,1);
  assert.equal(hardened.inconsistentCount,2);
  assert.equal(hardened.complete,false);
});

test('contrato do snapshot invalido nao participa da referencia historica',()=>{
  const wrongRevision=frozen('2026-09',{revision:2,financialRevision:1});
  const normalized=capacity.normalizeCapacityHistoryRow(wrongRevision);
  assert.equal(normalized.contractValid,false);
  assert.equal(normalized.complete,false);
  const ref=capacity.buildHistoricalReference([wrongRevision],{competence:'2026-10',squadCode:'ALL',comparison:'previous'});
  assert.equal(ref.ready,false);
});

test('FTE disponivel acima do nominal e limitado e invalida cobertura historica',()=>{
  const normalized=capacity.normalizeCapacityHistoryRow(frozen('2026-09',{nominalFte:4,availableFte:5}));
  assert.equal(normalized.availableFte,4);
  assert.equal(normalized.availabilityComplete,false);
  assert.equal(normalized.complete,false);
});

test('app usa seletor defensivo de snapshots antes de renderizar a evolucao',()=>{
  assert.match(app,/return strategyCapacityEngine\.latestCapacitySnapshots\(rows\)/);
});

test('migration V2.59.9 torna snapshot imutavel e reforca contrato do payload',()=>{
  assert.match(migration,/revoke select on table public\.strategy_capacity_snapshots from authenticated/i);
  assert.match(migration,/strategy_capacity_snapshots_snapshot_version_match/i);
  assert.match(migration,/strategy_capacity_snapshots_rule_version_match/i);
  assert.match(migration,/strategy_capacity_snapshots_source_match/i);
  assert.match(migration,/strategy_capacity_snapshots_revision_match/i);
  assert.match(migration,/strategy_capacity_snapshots_financial_payload_revision_match/i);
  assert.match(migration,/jsonb_typeof\(snapshot->'operation'\)='object'/i);
  assert.match(migration,/jsonb_typeof\(snapshot->'squads'\)='array'/i);
  assert.match(migration,/prevent_strategy_capacity_snapshot_mutation/i);
  assert.match(migration,/before update or delete on public\.strategy_capacity_snapshots/i);
  assert.match(migration,/strategy capacity snapshots are immutable/i);
});
