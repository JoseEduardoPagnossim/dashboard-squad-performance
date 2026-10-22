const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

test('custos pessoais exibem ação explícita de exclusão estratégica',()=>{
  assert.match(index,/<th>Ações<\/th>/i);
  assert.match(app,/data-strategy-remove-person=/);
  assert.match(app,/Excluir dos custos/);
  assert.match(app,/function removeStrategyPersonFromCosts\(personId\)/);
});

test('exclusão preserva usuário operacional e histórico fechado',()=>{
  const start=app.indexOf('async function removeStrategyPersonFromCosts');
  const end=app.indexOf('function setStrategySection',start);
  assert.ok(start>=0&&end>start);
  const block=app.slice(start,end);
  assert.match(block,/filter\(row=>row\.status!==['"]closed['"]\)/);
  assert.match(block,/strategy_employee_costs'\)\.delete\(\)/);
  assert.match(block,/strategy_people'\)\.update\(\{active:false/);
  assert.match(block,/usuário operacional/i);
  assert.doesNotMatch(block,/from\(['"]profiles['"]\)\.delete/);
  assert.doesNotMatch(block,/from\(['"]technician_monthly['"]\)\.delete/);
});

test('sincronização não recria técnico excluído porque considera vínculos inativos existentes',()=>{
  assert.match(app,/existingUserIds=new Set\(people\.map\(row=>String\(row\.userId\|\|''\)\)\.filter\(Boolean\)\)/);
  assert.match(app,/pending=technicians\.filter\(row=>!existingUserIds\.has/);
  assert.match(app,/excluded=.*filter\(p=>p\.active===false\)/);
});
