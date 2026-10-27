const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const capacity=require(join(root,'js','strategy-capacity.js'));
const strategy=require(join(root,'js','strategy.js'));
const navigation=require(join(root,'js','navigation-engine.js'));
const filters=require(join(root,'js','filter-system.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

 test('V2.59.2 publica fundacao de capacidade isolada',()=>{
  assert.equal(pkg.version,'2.61.9');
  assert.equal(pkg.assetVersion,'2.61.9-r1');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.ok(strategy.VALID_SECTIONS.includes('capacity'));
  assert.equal(strategy.SECTION_META.capacity.label,'Capacidade');
  assert.match(index,/data-strategy-section="capacity"/);
  assert.match(index,/data-strategy-panel="capacity"/);
  assert.match(index,/strategyCapacityNominalFte/);
  assert.match(index,/strategyCapacityReadinessRows/);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.61.9-r1'));
  assert.ok(index.indexOf('js/strategy-capacity.js?v=2.61.9-r1')<index.indexOf('js/app.js?v=2.61.9-r1'));
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.59.0.sql')),false);
});

test('rota de capacidade preserva isolamento dos filtros operacionais',()=>{
  const route=navigation.routeFromSearch('?page=strategy&section=capacity&squad=D&month=2026-10&tech=Arthur&from=2026-10-01&to=2026-10-22');
  assert.deepEqual(route,{page:'strategy',section:'capacity'});
  assert.equal(filters.activeCount({view:'strategy',isSuperAdmin:true}),0);
});

test('fundacao diferencia FTE nominal de capacidade disponivel e FTE necessario',()=>{
  const foundation=capacity.buildFoundation({
    scope:{competence:'2026-10',squadCode:'D',comparison:'previous',demandUnit:'resolutions'},
    metrics:{nominalFte:7,peopleCount:8,attendance:1500,resolutions:1200},
    availability:{fte:true,attendance:true,resolutions:true,availabilityFactors:false,historicalCapacity:false}
  });
  assert.equal(foundation.status,'ready');
  assert.equal(foundation.metrics.nominalFte,7);
  assert.equal(foundation.metrics.peopleCount,8);
  assert.equal(foundation.metrics.resolutionsPerNominalFte,1200/7);
  assert.equal(foundation.metrics.availableFte,null);
  assert.equal(foundation.metrics.theoreticalCapacity,null);
  assert.equal(foundation.metrics.utilizationRate,null);
  assert.equal(foundation.metrics.requiredFte,null);
  assert.equal(foundation.metrics.capacityGap,null);
  assert.ok(foundation.warnings.some(x=>/FTE nominal representa força equivalente/i.test(x)));
});

test('roadmap de capacidade declara dependencias sem fabricar prontidao',()=>{
  const foundation=capacity.buildFoundation({scope:{competence:'2026-10'},metrics:{nominalFte:4,resolutions:800},availability:{fte:true,resolutions:true}});
  const productivity=foundation.catalog.find(x=>x.id==='productivity-per-fte');
  const available=foundation.catalog.find(x=>x.id==='available-capacity');
  const required=foundation.catalog.find(x=>x.id==='required-fte');
  assert.equal(productivity.status,'pending');
  assert.ok(productivity.missing.includes('availabilityFactors'));
  assert.equal(available.status,'pending');
  assert.ok(available.missing.includes('availabilityFactors'));
  assert.equal(required.status,'pending');
  assert.ok(required.missing.includes('attendance'));
  assert.ok(required.missing.includes('historicalAttendanceCapacity'));
});

test('zero explicito continua dado e ausencia de fonte continua indisponivel',()=>{
  const explicitZero=capacity.buildFoundation({scope:{demandUnit:'resolutions'},metrics:{nominalFte:2,resolutions:0},availability:{fte:true,resolutions:true}});
  assert.equal(explicitZero.metrics.resolutions,0);
  assert.equal(explicitZero.metrics.resolutionsPerNominalFte,0);
  const missing=capacity.buildFoundation({scope:{demandUnit:'resolutions'},metrics:{nominalFte:2,resolutions:0},availability:{fte:true,resolutions:false}});
  assert.equal(missing.metrics.resolutionsPerNominalFte,null);
  assert.equal(missing.status,'partial');
});

test('app consome motor de capacidade sem calcular fases futuras',()=>{
  assert.match(app,/SoftenStrategyCapacity/);
  assert.match(app,/function strategyCapacityFoundation\(/);
  assert.match(app,/strategyCapacityEngine\.buildFoundation/);
  assert.match(app,/renderStrategyCapacity\(vm,displayAggregate\)/);
  assert.match(app,/availabilityFactors:availabilityReady/);
  assert.match(app,/historicalCapacity:historicalReady/);
  assert.match(app,/renderStrategyRequiredFte/);
});
