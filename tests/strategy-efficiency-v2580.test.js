const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const navigation=require(join(root,'js','navigation-engine.js'));
const filters=require(join(root,'js','filter-system.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

test('V2.58.8 publica a Fundação da Eficiência isolada do operacional',()=>{
  assert.equal(pkg.version,'2.58.9');
  assert.match(index,/data-strategy-section="efficiency"/);
  assert.match(index,/data-strategy-panel="efficiency"/);
  assert.match(index,/strategyEfficiencyBaseCost/);
  assert.match(index,/strategyEfficiencyReadinessRows/);
  assert.match(index,/js\/strategy-efficiency\.js\?v=2\.58\.9/);
  assert.ok(index.indexOf('js/strategy-efficiency.js?v=2.58.9')<index.indexOf('js/strategy.js?v=2.58.9'));
  assert.ok(index.indexOf('js/strategy-efficiency.js?v=2.58.9')<index.indexOf('js/app.js?v=2.58.9'));
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.58.0.sql')),false);
});

test('rota de eficiência preserva o isolamento e descarta filtros operacionais',()=>{
  const route=navigation.routeFromSearch('?page=strategy&section=efficiency&squad=D&month=2026-10&tech=Arthur&from=2026-10-01&to=2026-10-22');
  assert.deepEqual(route,{page:'strategy',section:'efficiency'});
  assert.equal(filters.activeCount({view:'strategy',isSuperAdmin:true}),0);
});

test('fundação preservada publica atendimento e resolução com prontidão independente',()=>{
  const foundation=efficiency.buildFoundation({
    scope:{competence:'2026-10',squadCode:'D',comparison:'previous',competenceStatus:'draft'},
    metrics:{totalCost:40000,peopleCost:35000,operationalCost:5000,attendance:2500,resolutions:1800,fte:7,evaluationRate:.41},
    availability:{financial:true,attendance:true,fte:true,quality:true,resolutions:true}
  });
  assert.equal(foundation.ruleVersion,'EF-0.9.0-phase3-hardening');
  assert.equal(foundation.status,'ready');
  assert.equal(foundation.coverage.ratio,1);
  assert.equal(foundation.metrics.totalCost,40000);
  assert.equal(foundation.metrics.costPerAttendance,16);
  assert.equal(foundation.catalog.find(x=>x.id==='cost-per-attendance').status,'ready');
  const resolution=foundation.catalog.find(x=>x.id==='cost-per-resolution');
  assert.equal(resolution.status,'ready');
  assert.deepEqual(resolution.missing,[]);
  assert.equal(foundation.metrics.costPerResolution,40000/1800);
});

test('fundação sinaliza base parcial sem fabricar valores ausentes',()=>{
  const foundation=efficiency.buildFoundation({scope:{competence:'2026-10',squadCode:'all'},metrics:{attendance:0,fte:0},availability:{financial:true}});
  assert.equal(foundation.status,'partial');
  assert.equal(foundation.metrics.attendance,0);
  assert.equal(foundation.metrics.fte,0);
  assert.equal(foundation.availability.attendance,false);
  assert.equal(foundation.availability.resolutions,false);
  assert.ok(foundation.warnings.some(x=>/produção operacional/i.test(x)));
});

test('UI da eficiência respeita permissão e usa disponibilidade explícita de resolução',()=>{
  const start=app.indexOf('function strategyEfficiencyFoundation(vm,displayAggregate)');
  const end=app.indexOf('function renderStrategy({skipLoad=false}',start);
  assert.ok(start>=0&&end>start);
  const block=app.slice(start,end);
  assert.match(block,/financialReady=displayAggregate/);
  assert.match(block,/resolutionEntries/);
  assert.match(block,/strategyEfficiencyEngine\.buildFoundation/);
  assert.match(block,/strategyCostPerResolutionAnalysis/);
  assert.match(block,/strategyEfficiencyEngine\.calculateCostPerResolution/);
});
