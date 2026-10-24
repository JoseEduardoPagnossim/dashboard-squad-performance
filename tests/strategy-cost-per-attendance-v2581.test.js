const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

test('V2.58.1 permanece preservada dentro da V2.58.9',()=>{
  assert.equal(pkg.version,'2.59.9');
  assert.equal(pkg.assetVersion,'2.59.9');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.match(index,/INDICADOR V2\.58\.1/);
  assert.match(index,/strategyCostPerAttendanceValue/);
  assert.match(index,/strategyCostPerAttendanceSquadRows/);
  assert.match(index,/strategyCostPerAttendanceTechRows/);
});

test('custo por atendimento usa custo consolidado dividido pelo volume e protege divisao por zero',()=>{
  assert.equal(efficiency.calculateCostPerAttendance(35000,2500),14);
  assert.equal(efficiency.calculateCostPerAttendance(35000,0),null);
  assert.equal(efficiency.calculateCostPerAttendance(-10,10),0);
});

test('comparacao unitária considera que queda de custo pode ser mensurada sem fabricar baseline',()=>{
  const result=efficiency.buildCostPerAttendance({
    current:{totalCost:32000,attendance:2000},
    baseline:{totalCost:36000,attendance:2000},
    comparisonLabel:'Mês anterior'
  });
  assert.equal(result.status,'ready');
  assert.equal(result.current.costPerAttendance,16);
  assert.equal(result.baseline.costPerAttendance,18);
  assert.ok(Math.abs(result.delta-(-2/18))<1e-9);
  assert.equal(result.impact,-4000);
  const withoutBase=efficiency.buildCostPerAttendance({current:{totalCost:1000,attendance:100}});
  assert.equal(withoutBase.delta,null);
});

test('UI calcula operação e Squad com custo total, mas técnico usa apenas custo pessoal',()=>{
  assert.match(app,/function strategyCostPerAttendanceAnalysis\(/);
  assert.match(app,/function strategyTechnicianCostPerAttendanceRows\(/);
  assert.match(app,/personalCost=safe\(cost\?\.totalCost\)/);
  assert.match(app,/strategyConsolidatedSquads\(vm\)/);
  assert.match(app,/strategyEfficiencyEngine\.calculateCostPerAttendance\(personalCost,attendance\)/);
  assert.match(index,/Custos compartilhados permanecem no nível do Squad|custo pessoal do técnico/i);
});

test('produção individual é carregada pela competência estratégica antes do cálculo por técnico',()=>{
  assert.match(app,/ensureMonthsLoaded\(operationalCodes,\[st\.competence\]/);
  assert.match(app,/function strategyOperationalTechnicianStats\(competence\)/);
  assert.match(app,/tech\?\.userId/);
});
