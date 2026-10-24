const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.51.0.sql'), 'utf8');
const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8');
const engine = require(join(root, 'js', 'import-engine.js'));
const pkg = require(join(root, 'package.json'));

test('V2.53.0 adiciona aliases historicos ao cadastro do tecnico',()=>{
  assert.equal(pkg.version,'2.60.6');
  assert.ok(index.includes('id="editUserAliases"'));
  assert.match(index,/Nomes anteriores \/ aliases do CSV/);
  assert.match(app,/async function persistTechnicianAliasesForUser\(/);
  assert.match(app,/oldTechName,u\.techName|oldTechName:u\.techName/);
  assert.match(app,/O nome anterior foi preservado como alias do CSV/);
  const editStart=app.indexOf('async function handleEditUser');
  const editEnd=app.indexOf('async function toggleUserActive',editStart);
  const edit=app.slice(editStart,editEnd);
  assert.ok(edit.indexOf('persistTechnicianAliasesForUser') < edit.indexOf("manageSupabaseUser('update'"),'o alias antigo deve ser salvo antes de alterar o perfil');
});

test('migração cria catálogo de aliases e recupera nomes históricos sem alterar métricas',()=>{
  for(const sql of [migration,schema]){
    assert.match(sql,/create table if not exists public\.technician_aliases/);
    assert.match(sql,/unique \(user_id, alias_key\)/);
    assert.match(sql,/from public\.profile_squad_history h/);
    assert.match(sql,/from public\.technician_monthly tm/);
    assert.match(sql,/from public\.audit_logs a/);
    assert.match(sql,/idx_technician_monthly_month_user/);
    assert.match(sql,/deduplicated_candidates/);
    assert.match(sql,/before insert or update on public\.technician_aliases/);
  }
  assert.doesNotMatch(migration,/set\s+att\s*=|att\s*=\s*att\s*\+/i,'migration não deve somar métricas antigas potencialmente duplicadas');
});

test('CSV operacional resolve nome para user_id antes de consolidar a competência',()=>{
  assert.match(app,/function technicianIdentityKey\(userId,name\)/);
  assert.match(app,/function resolveTechnicianAliasCandidate\(map,name\)/);
  assert.match(app,/rows\.push\(\{\.\.\.r,originalName:r\.name,name:canonical,userId:candidate\.userId\|\|null/);
  assert.match(app,/const identity=technicianIdentityKey\(r\.userId,r\.name\)/);
  assert.match(app,/previousByIdentity=new Map\(\)/);
  assert.match(app,/preferredPreviousTechnician\(prevRows,canonical,raw\.userId\)/);
});

test('persistência reconcilia linhas mensais duplicadas pela identidade estável',()=>{
  assert.match(app,/function existingMonthlyIdentity\(row,userMap,activeUserIds=new Set\(\)\)/);
  assert.match(app,/function chooseExistingMonthlyPrimary\(/);
  assert.match(app,/duplicates=matches\.filter\(x=>x\.id!==primary\?\.id\)/);
  assert.match(app,/from\('technician_monthly'\)\.delete\(\)\.eq\('id',duplicate\.id\)/);
  assert.match(app,/return\{reconciledDuplicates,unlinkedHistorical\}/);
  assert.match(app,/identityDuplicatesReconciled:identityReconciled/);
});

test('alias ambiguo bloqueia importação em vez de mesclar pessoas parecidas',()=>{
  const validation=engine.validatePreview({kind:'service',totalRows:10,validRows:10,ambiguous:1,summary:{squads:[]}});
  assert.equal(validation.blocked,true);
  assert.equal(validation.level,'error');
  assert.ok(validation.issues.some(issue=>issue.code==='ambiguous'));
  assert.match(app,/return\{status:'ambiguous',candidate:null,candidates:distinct\}/);
});
