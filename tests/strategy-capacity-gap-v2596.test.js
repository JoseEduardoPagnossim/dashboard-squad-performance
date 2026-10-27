const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const capacity=require(join(root,'js','strategy-capacity.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

test('V2.59.6 publica gap de capacidade sem migration nova',()=>{
  assert.equal(pkg.version,'2.61.7');
  assert.equal(pkg.assetVersion,'2.61.7-r1');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.ok(existsSync(join(root,'docs','CAPACIDADE_GAP_V2.59.6.md')));
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.59.6.sql')),false);
  assert.match(index,/INDICADOR V2\.59\.6/);
  assert.match(index,/strategyCapacityGapFte/);
  assert.match(index,/strategyCapacityGapSquadRows/);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.61.7-r1'));
  assert.match(app,/renderStrategyCapacityGap/);
});

test('gap negativo representa deficit de FTE e atendimentos',()=>{
  const r=capacity.calculateCapacityGap({availableFte:4,requiredFte:5,referenceAttendancePerFte:300,attendance:1500});
  assert.equal(r.ready,true);
  assert.equal(r.status,'deficit');
  assert.equal(r.gapFte,-1);
  assert.equal(r.deficitFte,1);
  assert.equal(r.availableCapacityVolume,1200);
  assert.equal(r.gapCapacityVolume,-300);
  assert.equal(r.deficitCapacityVolume,300);
});

test('gap positivo representa excesso de FTE e capacidade',()=>{
  const r=capacity.calculateCapacityGap({availableFte:6,requiredFte:5,referenceAttendancePerFte:300,attendance:1500});
  assert.equal(r.ready,true);
  assert.equal(r.status,'excess');
  assert.equal(r.gapFte,1);
  assert.equal(r.excessFte,1);
  assert.equal(r.gapCapacityVolume,300);
  assert.equal(r.excessCapacityVolume,300);
});

test('gap zero representa equilibrio sem arredondar a regra',()=>{
  const r=capacity.calculateCapacityGap({availableFte:5,requiredFte:5,referenceAttendancePerFte:300,attendance:1500});
  assert.equal(r.ready,true);
  assert.equal(r.status,'balanced');
  assert.equal(r.gapFte,0);
  assert.equal(r.gapCapacityVolume,0);
});

test('gap permanece fail-closed sem referencia ou FTE disponivel',()=>{
  assert.equal(capacity.calculateCapacityGap({availableFte:null,requiredFte:5,referenceAttendancePerFte:300,attendance:1500}).ready,false);
  assert.equal(capacity.calculateCapacityGap({availableFte:4,requiredFte:null,referenceAttendancePerFte:null,attendance:1500}).ready,false);
});

test('buildCapacityGap usa a mesma referencia historica do FTE necessario',()=>{
  const history=[{competence:'2026-09',squadCode:'A',status:'closed',availableFte:4,attendanceComplete:true,attendancePerAvailableFte:300}];
  const r=capacity.buildCapacityGap({current:{attendance:1500,availableFte:4},history,competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(r.ready,true);
  assert.equal(r.required.requiredFte,5);
  assert.equal(r.gap.gapFte,-1);
  assert.equal(r.gap.gapCapacityVolume,-300);
});

test('fundacao ativa gap somente com FTE, disponibilidade, demanda e historico',()=>{
  const foundation=capacity.buildFoundation({
    scope:{competence:'2026-10',squadCode:'all',comparison:'previous',demandUnit:'resolutions'},
    metrics:{nominalFte:5,availableFte:4,peopleCount:5,attendance:1500,resolutions:1200,referenceAttendancePerFte:300,requiredFteSampleCount:1},
    availability:{fte:true,attendance:true,resolutions:true,availabilityFactors:true,historicalCapacity:false,historicalAttendanceCapacity:true}
  });
  const item=foundation.catalog.find(x=>x.id==='capacity-gap');
  assert.equal(item.status,'active');
  assert.equal(foundation.metrics.requiredFte,5);
  assert.equal(foundation.metrics.capacityGapFte,-1);
  assert.equal(foundation.metrics.capacityGapVolume,-300);
  assert.equal(foundation.metrics.capacityGapStatus,'deficit');
});

test('FTE necessario foi reposicionado para o painel Capacidade',()=>{
  const capacityPanel=index.indexOf('data-strategy-panel="capacity"');
  const required=index.indexOf('strategy-capacity-required-fte');
  const gap=index.indexOf('strategy-capacity-gap');
  assert.ok(capacityPanel>=0&&required>capacityPanel&&gap>required);
});
