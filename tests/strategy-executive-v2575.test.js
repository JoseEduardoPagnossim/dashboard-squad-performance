const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const engine=require(join(root,'js','strategy-cost-engine.js'));
const data=require(join(root,'js','strategy-data.js'));
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.57.5.sql');
const migration=readFileSync(migrationPath,'utf8');

test('V2.57.7 publica Resultado Executivo com histórico e comparação',()=>{
  assert.equal(pkg.version,'2.58.9');
  assert.equal(existsSync(migrationPath),true);
  for(const id of ['strategyExecutiveUnitCostChart','strategyExecutiveEfficiencyChart','strategyExecutiveComposition','strategyExecutiveInsights','strategyExecutiveSquadRows','strategyEfficiencySpread'])assert.match(index,new RegExp(id));
  assert.match(app,/get_strategy_financial_history/);
});

test('comparação anterior calcula spread e custo unitário',()=>{
  const history=[
    {competence:'2026-09',totalCost:100000,attendance:10000,costPerAttendance:10,fte:20,evaluationRate:.35},
    {competence:'2026-10',totalCost:102000,attendance:11000,costPerAttendance:102000/11000,fte:20,evaluationRate:.36}
  ];
  const x=engine.buildExecutiveAnalysis({history,currentCompetence:'2026-10',comparison:'previous',qualityTarget:.343});
  assert.equal(x.available,true);
  assert.ok(Math.abs(x.costChange-.02)<1e-9);
  assert.ok(Math.abs(x.attendanceChange-.10)<1e-9);
  assert.ok(Math.abs(x.spread-.08)<1e-9);
  assert.equal(x.qualityStatus,'preserved');
  assert.ok(x.costPerAttendanceChange<0);
});

test('comparação 3m usa média das competências anteriores e exclui atual',()=>{
  const history=[
    {competence:'2026-07',totalCost:90,attendance:90,evaluationRate:.34},
    {competence:'2026-08',totalCost:100,attendance:100,evaluationRate:.35},
    {competence:'2026-09',totalCost:110,attendance:110,evaluationRate:.36},
    {competence:'2026-10',totalCost:120,attendance:132,evaluationRate:.36}
  ];
  const x=engine.buildExecutiveAnalysis({history,currentCompetence:'2026-10',comparison:'3m'});
  assert.equal(x.window.baselineRows.length,3);
  assert.equal(x.window.baseline.totalCost,100);
  assert.equal(x.window.baseline.attendance,100);
  assert.equal(x.costChange,.2);
  assert.ok(Math.abs(x.attendanceChange-.32)<1e-12);
});

test('queda de qualidade impede classificar ganho como preservado',()=>{
  const history=[{competence:'2026-09',totalCost:100,attendance:100,evaluationRate:.38},{competence:'2026-10',totalCost:101,attendance:120,evaluationRate:.31}];
  const x=engine.buildExecutiveAnalysis({history,currentCompetence:'2026-10',comparison:'previous',qualityTarget:.343});
  assert.equal(x.qualityStatus,'below_target');
  assert.ok(x.spread>0);
});

test('normalização histórica preserva produção e qualidade agregadas',()=>{
  const row=data.normalizeFinancialHistoryRow({competence:'2026-10',total_cost:1000,people_cost:800,operational_cost:200,fte:2,attendance:100,evaluation_rate:.36});
  assert.equal(row.attendance,100);
  assert.equal(row.evaluationRate,.36);
  assert.equal(row.costPerAttendance,10);
  assert.equal(row.attendancePerFte,50);
});

test('migration executiva retorna somente agregados e inclui produção',()=>{
  assert.match(migration,/get_strategy_financial_history/i);
  assert.match(migration,/get_strategy_squad_cost_summary/i);
  assert.match(migration,/attendance/i);
  assert.match(migration,/evaluation_rate/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
  assert.doesNotMatch(migration,/select\s+sec\.salary\s+from/i);
});
