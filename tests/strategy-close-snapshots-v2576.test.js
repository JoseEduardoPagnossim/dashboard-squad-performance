const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const data=require(join(root,'js','strategy-data.js'));
const access=require(join(root,'js','strategy-access.js'));
const insights=require(join(root,'js','strategy-insights.js'));
const engine=require(join(root,'js','strategy-cost-engine.js'));
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.57.6.sql');
const migration=readFileSync(migrationPath,'utf8');

test('V2.57.7 publica fechamento e snapshot revisionado',()=>{
  assert.equal(pkg.version,'2.63.5');
  assert.equal(existsSync(migrationPath),true);
  assert.match(index,/strategyCloseCompetenceBtn/);
  assert.match(index,/strategyReopenCompetenceBtn/);
  assert.match(index,/strategySnapshotMeta/);
  assert.match(app,/close_strategy_competence/);
  assert.match(app,/reopen_strategy_competence/);
});

test('permissão de fechamento continua separada do acesso estratégico',()=>{
  const a=access.normalizeAccess({can_view_strategy:true,can_view_aggregates:true,can_edit_costs:true,can_view_people_costs:true,can_close_competence:false});
  assert.equal(access.canEditCosts(a),true);
  assert.equal(access.canCloseCompetence(a),false);
  assert.match(app,/data-strategy-close-access/);
  assert.match(app,/setDirectoryStrategyCloseAccess/);
});

test('normalização da competência preserva metadados do snapshot',()=>{
  const row=data.normalizeCompetenceRow({id:'c1',competence:'2026-10-01',status:'closed',closed_at:'2026-10-31T10:00:00Z',snapshot_revision:2,snapshot_version:'SS-1.0.0',rule_version:'SC-0.6.0-snapshot'});
  assert.equal(row.competence,'2026-10');
  assert.equal(row.status,'closed');
  assert.equal(row.snapshotRevision,2);
  assert.equal(row.snapshotVersion,'SS-1.0.0');
  assert.equal(row.ruleVersion,'SC-0.6.0-snapshot');
});

test('resumo financeiro preserva qualidade congelada',()=>{
  const row=data.normalizeFinancialHistoryRow({competence:'2026-10',total_cost:1000,people_cost:800,operational_cost:200,fte:2,attendance:100,evaluation_rate:.36,quality_target:.343,status:'closed'});
  assert.equal(row.evaluationRate,.36);
  assert.equal(row.qualityTarget,.343);
  assert.equal(row.costPerAttendance,10);
});

test('insights sinalizam snapshot fechado antes dos desvios executivos',()=>{
  const rows=insights.executiveInsights({available:false},{totalCost:1000},[],{status:'closed',snapshotRevision:3});
  assert.equal(rows[0].code,'CLOSED_SNAPSHOT_ACTIVE');
  assert.match(rows[0].text,/snapshot oficial #3/i);
  assert.equal(insights.RULE_VERSION,'SI-1.1.0');
});

test('motor financeiro identifica a regra usada no snapshot',()=>{
  assert.equal(engine.RULE_VERSION,'SC-0.6.1');
});

test('migration mantém histórico de snapshots e não sobrescreve revisões',()=>{
  assert.match(migration,/strategy_competence_snapshots/i);
  assert.match(migration,/unique \(organization_id, competence_id, revision\)/i);
  assert.match(migration,/snapshot_revision/i);
  assert.match(migration,/v_revision := coalesce\(v_comp\.snapshot_revision,0\)\+1/i);
  assert.match(migration,/snapshot_fingerprint/i);
});

test('competência fechada bloqueia mutações de custos via RLS',()=>{
  assert.match(migration,/is_strategy_competence_open\(competence_id\)/i);
  assert.match(migration,/status <> 'closed'/i);
  assert.match(migration,/status in \('draft','provisional'\)/i);
  assert.match(migration,/unallocated operational costs must be resolved before closing/i);
  assert.match(migration,/operational cost allocation mismatch must be resolved before closing/i);
});

test('RPCs executivas usam snapshot em competência fechada',()=>{
  assert.match(migration,/if v_comp\.status='closed'/i);
  assert.match(migration,/v_snapshot->'summary'/i);
  assert.match(migration,/v_snapshot->'squads'/i);
  assert.match(migration,/get_strategy_financial_history/i);
  assert.match(migration,/get_strategy_financial_summary\(r\.competence,p_squad_code\)/i);
});


test('meta de qualidade consolidada pesa uma vez por Squad, não por técnico',()=>{
  assert.match(migration,/squad_ops as \(/i);
  assert.match(migration,/group by upper\(s\.code\),sm\.id,sm\.team_goal_eval_pct/i);
  assert.match(migration,/sum\(quality_target\*greatest\(attendance,1\)\)/i);
  assert.doesNotMatch(migration,/sum\(sm\.team_goal_eval_pct\*greatest\(coalesce\(satt\.attendance,0\),1\)\)/i);
});
