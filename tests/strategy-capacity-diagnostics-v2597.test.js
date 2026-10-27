const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const capacity=require(join(root,'js','strategy-capacity.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

function history({resolutionPerFte=250,attendancePerFte=300,squadCode='A'}={}){
  return [{competence:'2026-09',squadCode,status:'closed',availableFte:4,complete:true,usedPerAvailableFte:resolutionPerFte,usedCapacityVolume:resolutionPerFte*4,attendanceComplete:true,attendancePerAvailableFte:attendancePerFte,attendanceVolume:attendancePerFte*4}];
}

test('V2.59.7 publica diagnostico de capacidade sem migration nova',()=>{
  assert.equal(pkg.version,'2.62.5');
  assert.equal(pkg.assetVersion,'2.62.5-r1');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.ok(existsSync(join(root,'docs','CAPACIDADE_DIAGNOSTICOS_V2.59.7.md')));
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.59.7.sql')),false);
  assert.match(index,/INDICADOR V2\.59\.7/);
  assert.match(index,/strategyCapacityDiagnosticSituation/);
  assert.match(index,/strategyCapacityDiagnosticSquadRows/);
  assert.equal((index.match(/id=\"strategyCapacityDiagnosticSituation\"/g)||[]).length,1);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.62.5-r1'));
  assert.match(app,/renderStrategyCapacityDiagnostics/);
});

test('deficit com utilizacao acima vira deficit com sobrecarga',()=>{
  const d=capacity.buildCapacityDiagnostic({current:{attendance:1500,resolutions:1200,availableFte:4,usedCapacityVolume:1200,usedPerAvailableFte:300},history:history(),competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(d.ready,true);
  assert.equal(d.code,'deficit-overload');
  assert.equal(d.title,'DÉFICIT COM SOBRECARGA');
  assert.equal(d.evidence.gapFte,-1);
  assert.equal(d.evidence.utilizationRate,1.2);
  assert.equal(d.evidence.fcr,0.8);
});

test('deficit com baixa utilizacao orienta investigar absorcao antes de ampliar equipe',()=>{
  const d=capacity.buildCapacityDiagnostic({current:{attendance:1500,resolutions:800,availableFte:4,usedCapacityVolume:800,usedPerAvailableFte:200},history:history(),competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(d.code,'deficit-low-throughput');
  assert.match(d.summary,/baixa|abaixo/i);
  assert.ok(d.actions.some(x=>/FCR|backlog|complexidade/i.test(x)));
});

test('operacao equilibrada exige gap equilibrado e utilizacao dentro',()=>{
  const d=capacity.buildCapacityDiagnostic({current:{attendance:1200,resolutions:1000,availableFte:4,usedCapacityVolume:1000,usedPerAvailableFte:250},history:history(),competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(d.code,'balanced-stable');
  assert.equal(d.title,'OPERAÇÃO EQUILIBRADA');
  assert.equal(d.evidence.gapFte,0);
  assert.equal(d.evidence.utilizationRate,1);
});

test('excesso com baixa utilizacao vira capacidade ociosa potencial',()=>{
  const d=capacity.buildCapacityDiagnostic({current:{attendance:900,resolutions:700,availableFte:4,usedCapacityVolume:700,usedPerAvailableFte:175},history:history(),competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(d.code,'excess-idle');
  assert.equal(d.title,'CAPACIDADE OCIOSA POTENCIAL');
  assert.ok(d.evidence.gapFte>0);
  assert.ok(d.evidence.utilizationRate<0.9);
});

test('excesso com utilizacao acima e tratado como sinais divergentes',()=>{
  const d=capacity.buildCapacityDiagnostic({current:{attendance:900,resolutions:1200,availableFte:4,usedCapacityVolume:1200,usedPerAvailableFte:300},history:history(),competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(d.code,'divergent-signals');
  assert.equal(d.evidence.fcr,null,'resolucoes acima dos atendimentos nao devem fabricar FCR');
});

test('diagnostico permanece fail-closed quando falta uma das referencias historicas',()=>{
  const h=history().map(x=>({...x,attendanceComplete:false,attendancePerAvailableFte:null}));
  const d=capacity.buildCapacityDiagnostic({current:{attendance:1200,resolutions:1000,availableFte:4,usedCapacityVolume:1000,usedPerAvailableFte:250},history:h,competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(d.ready,false);
  assert.equal(d.code,'insufficient-base');
  assert.ok(d.evidence.missing.some(x=>/atendimentos\/FTE/.test(x)));
});

test('FCR e evidencia contextual e nao possui meta automatica',()=>{
  const d=capacity.buildCapacityDiagnostic({current:{attendance:1200,resolutions:600,availableFte:4,usedCapacityVolume:600,usedPerAvailableFte:150},history:history(),competence:'2026-10',squadCode:'A',comparison:'previous'});
  assert.equal(d.evidence.fcr,0.5);
  assert.doesNotMatch(JSON.stringify(d),/meta.{0,20}FCR|FCR.{0,20}meta/i);
});
