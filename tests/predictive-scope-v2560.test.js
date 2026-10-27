const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../js/predictive-engine.js');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pkg=require('../package.json');

test('V2.57.7 filtra a gestão preditiva pelo Squad selecionado sem alterar a coleção de origem',()=>{
  const squads=[{code:'A'},{code:'B'},{code:'D'},{code:'E'}];
  assert.deepEqual(engine.scopeSquads(squads,'all').map(x=>x.code),['A','B','D','E']);
  assert.deepEqual(engine.scopeSquads(squads,'A').map(x=>x.code),['A']);
  assert.deepEqual(engine.scopeSquads(squads,'d').map(x=>x.code),['D']);
  assert.deepEqual(engine.scopeSquads(squads,'X'),[]);
  assert.deepEqual(squads.map(x=>x.code),['A','B','D','E']);
});

test('V2.57.7 cards e tabela preditiva usam exatamente o mesmo escopo filtrado',()=>{
  assert.match(app,/const scopedSquads=predictiveEngine\.scopeSquads\(squads,state\.squadCode\)/);
  assert.match(app,/rows=scopedSquads\.map\(s=>predictiveSquadMonthData\(s,id\)\)/);
  assert.match(app,/realAtt=rows\.reduce\(\(s,r\)=>s\+r\.att\.realized,0\)/);
  assert.match(app,/squadRows\.innerHTML=data\.rows\.map/);
  assert.match(app,/scopeLabel=state\.squadCode==='all'\?'Todos os Squads':`Squad \$\{state\.squadCode\}`/);
});

test('V2.57.7 diferencia projeção de desempenho realizado e corrige semântica de risco',()=>{
  for(const label of ['Projeção de atendimentos','Projeção de Notas 5','Tendência de avaliação','Técnicos sob risco','Representatividade']) assert.ok(app.includes(label),label);
  assert.ok(app.includes("rightLabel:'Critério',right:'2+ sinais'"));
  assert.ok(index.includes('Projeção de fechamento da competência'));
  assert.ok(index.includes('respeitam o Squad selecionado'));
});

test('V2.57.7 é frontend-only e preserva o motor financeiro e as demais abas',()=>{
  assert.equal(pkg.version,'2.62.3');
  assert.ok(index.includes('js/predictive-engine.js?v=2.62.3-r1'));
  assert.ok(index.includes('js/app.js?v=2.62.3-r1'));
  assert.ok(!fs.existsSync(path.join(root,'supabase','migrations','MIGRACAO_V2.56.7.sql')));
  assert.match(app,/function periodGoalForTechnician\(/);
  assert.match(app,/function periodTeamGoal\(/);
  assert.match(app,/function renderIndividual\(/);
  assert.match(app,/function renderTeam\(/);
});
