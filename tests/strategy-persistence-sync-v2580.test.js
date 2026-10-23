const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const strategy=require(join(root,'js','strategy.js'));
const data=require(join(root,'js','strategy-data.js'));

test('V2.58.4 R2 deixa competencias persistidas visiveis e selecionaveis',()=>{
  assert.match(index,/strategyCompetenceList/);
  assert.match(app,/data-strategy-competence-chip/);
  assert.match(app,/Nenhuma competência foi alterada\. O salvamento não foi confirmado pelo banco/);
  assert.match(app,/Nenhuma competência foi alterada/);
  assert.match(app,/strategy_competences'\)\.update\(\{status,notes:notes\|\|null/);
  assert.match(app,/snapshot_version,rule_version,created_at,updated_at'\)\.maybeSingle\(\)/);
});

test('cadastro de pessoa confirma escrita e atualiza a tela antes do reload',()=>{
  assert.match(app,/insert\(payload\)\.select\('id,user_id,name,role_label,default_squad_code/);
  assert.match(app,/strategyMergeFinancialData\(\{people:/);
  assert.match(app,/adicionado e exibido na base estratégica/);
});

test('tecnicos operacionais podem ser sincronizados sem obrigar pre-atendimento no operacional',()=>{
  assert.match(index,/strategySyncOperationalPeopleBtn/);
  assert.match(app,/function syncStrategyOperationalPeople/);
  assert.match(app,/\.eq\('role','technician'\)\.eq\('active',true\)/);
  assert.match(app,/source:'api'/);
  assert.match(app,/unlinkedByName=new Map/);
  assert.match(app,/Não foi possível vincular/);
  assert.match(index,/Pré-atendimento/);
});

test('grupo PRE existe apenas no contexto estrategico',()=>{
  assert.equal(strategy.STRATEGIC_GROUPS.some(row=>row.code==='PRE'&&row.strategicOnly===true),true);
  const controller=strategy.createController({squadCode:'PRE'});
  controller.initializeContext({squads:{D:{code:'D',name:'Squad D',months:{'2026-10':{}}}}});
  assert.equal(controller.getContext().squads.some(row=>row.code==='PRE'),true);
  controller.setSquadCode('PRE');
  assert.equal(controller.getState().squadCode,'PRE');
});

test('normalizadores aceitam linhas locais camelCase durante reconciliacao otimista',()=>{
  const person=data.normalizePersonRow({id:'p1',userId:'u1',name:'Ana',roleLabel:'Técnico',squadCode:'D',defaultFte:.8,source:'api'});
  assert.equal(person.userId,'u1');assert.equal(person.squadCode,'D');assert.equal(person.defaultFte,.8);
  const cost=data.normalizeEmployeeCostRow({id:'c1',competenceId:'m1',personId:'p1',squadCode:'PRE',fte:1,employerCharges:20,variablePay:10,otherCosts:5,totalCost:35});
  assert.equal(cost.personId,'p1');assert.equal(cost.squadCode,'PRE');assert.equal(cost.totalCost,35);
});
