const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const migrationPath = join(root, 'supabase', 'migrations', 'MIGRACAO_V2.57.7.sql');
const migration = readFileSync(migrationPath, 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');
const pkg = require(join(root, 'package.json'));

test('V2.57.7 publica saneamento de tecnicos excluidos na reimportacao',()=>{
  assert.equal(pkg.version,'2.59.5');
  assert.equal(existsSync(migrationPath),true);
  assert.match(app,/function activeTechnicianDirectoryByUserId\(userId\)/);
  assert.match(app,/u\.role!==\'technician\'\|\|u\.active===false/);
  assert.match(app,/source:linked\?'histórico':'histórico sem usuário ativo'/);
});

test('persistencia revalida user_id no banco antes de salvar a competencia',()=>{
  assert.match(app,/\.eq\('role','technician'\)\.eq\('active',true\)/);
  assert.match(app,/activeUserIds\.has\(String\(t\.userId\)\)/);
  assert.match(app,/existingMonthlyIdentity\(old,userMap,activeUserIds\)/);
  assert.match(app,/resolvedUserId=currentId\|\|userMap\[nameLinkKey\(t\.name\)\]\|\|null/);
});

test('banco impede que usuario inativo ou excluido seja ressuscitado',()=>{
  for(const sql of [migration,schema]){
    assert.match(sql,/guard_active_technician_monthly_user/);
    assert.match(sql,/p\.role\s*=\s*'technician'/);
    assert.match(sql,/p\.active\s*=\s*true/);
    assert.match(sql,/new\.user_id\s*:=\s*null/);
  }
  assert.match(migration,/sm\.is_closed\s*=\s*false/);
  assert.match(migration,/update public\.technician_monthly tm[\s\S]*set user_id = null/);
});

test('tecnico historico sem user_id fica fora das metricas individuais em competencia aberta',()=>{
  assert.match(app,/function individualMetricTechnicians\(m\)/);
  assert.match(app,/if\(!state\.supabase\|\|m\?\.isClosed\)return rows;return rows\.filter\(t=>!!t\?\.userId\)/);
  assert.match(app,/return scoreRefsFromRows\(individualMetricTechnicians\(m\)\)/);
  assert.match(app,/const metricRows=individualMetricTechnicians\(m\),active=metricRows\.filter/);
  assert.match(app,/function autoTeamAttGoal\(m\).*individualMetricTechnicians\(m\)\.length/);
});

test('total do Squad continua usando todas as linhas, inclusive producao historica sem usuario',()=>{
  assert.match(app,/m\.teamTotals=deriveTotals\(m\.technicians\)/);
  assert.doesNotMatch(app,/m\.teamTotals=deriveTotals\(individualMetricTechnicians\(m\)\)/);
});


test('reimportacao identifica tecnico historico e informa saneamento antes de gravar',()=>{
  assert.match(app,/historicalUnlinked=rows\.filter\(r=>r\.linkSource==='histórico sem usuário ativo'\)\.length/);
  assert.match(app,/identityStatus:historicalUnlinked\?'historical_unlinked':'linked'/);
  assert.match(app,/t\.identityStatus==='historical_unlinked'/);
  assert.match(app,/mantém a produção do Squad, mas é salvo sem user_id e fica fora de ranking, headcount e bonificação individual/);
});

test('ranking individual por período exclui desvinculado sem retirar produção dos totais do Squad',()=>{
  assert.match(app,/function periodTechniciansForSquad\(squad,start=state\.analysisStartDate,end=state\.analysisEndDate,\{individualOnly=false\}=\{\}\)/);
  assert.match(app,/individualOnly\?individualMetricTechnicians\(m\):\(m\?\.technicians\|\|\[\]\)/);
  assert.match(app,/const allPeriodRows=periodTechniciansForSquad\(currentSquad\(\)\),periodRows=periodTechniciansForSquad\(currentSquad\(\),state\.analysisStartDate,state\.analysisEndDate,\{individualOnly:true\}\),totals=deriveTotals\(allPeriodRows\)/);
});

test('ranking RPC do técnico ignora vínculo inativo em competência aberta e preserva fechamento histórico',()=>{
  for(const sql of [migration,schema]){
    assert.match(sql,/left join public\.profiles linked_profile[\s\S]*linked_profile\.role = 'technician'[\s\S]*linked_profile\.active,true/);
    assert.match(sql,/coalesce\(sm\.is_closed,false\) = true or linked_profile\.user_id is not null/);
  }
});
