const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const importEngine=require(join(root,'js','import-engine.js'));
const capacity=require(join(root,'js','strategy-capacity.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.59.5.sql'),'utf8');

test('V2.59.5 publica FCR automatico e FTE necessario',()=>{
  assert.equal(pkg.version,'2.61.8');
  assert.equal(pkg.assetVersion,'2.61.8-r1');
  assert.equal(capacity.RULE_VERSION,'CA-1.0.0-phase4-hardening');
  assert.ok(existsSync(join(root,'docs','CAPACIDADE_FTE_NECESSARIO_FCR_V2.59.5.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.59.5.sql')));
  assert.match(index,/strategyCapacityRequiredFteDetail/);
  assert.match(index,/indicatorFcrTechRows/);
  assert.match(index,/portfolioFcrTotal/);
  assert.ok(index.includes('js/strategy-capacity.js?v=2.61.8-r1'));
});

test('Resolve reconhece Sim, Nao, vazio e valor invalido',()=>{
  assert.equal(importEngine.normalizeResolveAnswer('Sim'),'yes');
  assert.equal(importEngine.normalizeResolveAnswer('NÃO'),'no');
  assert.equal(importEngine.normalizeResolveAnswer(''),'blank');
  assert.equal(importEngine.normalizeResolveAnswer('talvez'),'invalid');
});

test('FCR considera apenas Resolve Nao como nao resolvido',()=>{
  const r=importEngine.calculateFcr(500,100,{sourceComplete:true});
  assert.equal(r.ready,true);
  assert.equal(r.resolved,400);
  assert.equal(r.fcr,.8);
});

test('FCR falha fechado sem fonte valida ou quando Nao excede atendimentos',()=>{
  assert.equal(importEngine.calculateFcr(500,0,{sourceComplete:false}).ready,false);
  assert.equal(importEngine.calculateFcr(10,11,{sourceComplete:true}).ready,false);
  const zero=importEngine.calculateFcr(10,0,{sourceComplete:true});
  assert.equal(zero.ready,true);
  assert.equal(zero.resolved,10);
  assert.equal(zero.fcr,1);
});

test('Qualidade Completa reconhece Resolve como coluna opcional',()=>{
  const mapped=importEngine.resolveQualityFullImportColumns(['DataAvaliacao','nomeApresentativo','NotaServico','NotaProduto','NotaEmpresa','grupoAtendimento','Resolve']);
  assert.deepEqual(mapped.missing,[]);
  assert.equal(mapped.indexes.resolve,6);
  const without=importEngine.resolveQualityFullImportColumns(['DataAvaliacao','nomeApresentativo','NotaServico','NotaProduto','NotaEmpresa','grupoAtendimento']);
  assert.equal(without.indexes.resolve,null);
});

test('FTE necessario usa atendimentos e mediana historica por FTE disponivel',()=>{
  const history=[
    {competence:'2026-09',squadCode:'ALL',status:'closed',availableFte:5,attendanceComplete:true,attendancePerAvailableFte:300},
  ];
  const r=capacity.buildRequiredFte({current:{attendance:1500},history,competence:'2026-10',squadCode:'ALL',comparison:'previous'});
  assert.equal(r.reference.ready,true);
  assert.equal(r.calculation.ready,true);
  assert.equal(r.calculation.requiredFte,5);
});

test('FTE necessario nao pula competencia faltante na janela de 3 meses',()=>{
  const history=[
    {competence:'2026-09',squadCode:'A',status:'closed',availableFte:2,attendanceComplete:true,attendancePerAvailableFte:200},
    {competence:'2026-07',squadCode:'A',status:'closed',availableFte:2,attendanceComplete:true,attendancePerAvailableFte:210},
    {competence:'2026-06',squadCode:'A',status:'closed',availableFte:2,attendanceComplete:true,attendancePerAvailableFte:220},
  ];
  const r=capacity.buildRequiredFte({current:{attendance:600},history,competence:'2026-10',squadCode:'A',comparison:'3m'});
  assert.equal(r.reference.ready,false);
  assert.equal(r.calculation.ready,false);
  assert.equal(r.calculation.requiredFte,null);
});

test('FTE necessario aceita demanda zero quando referencia e valida',()=>{
  const r=capacity.calculateRequiredFte({attendance:0,referenceAttendancePerFte:250});
  assert.equal(r.ready,true);
  assert.equal(r.requiredFte,0);
});

test('app sincroniza resolucao automatica e bloqueia edicao da fonte csv',()=>{
  assert.match(app,/syncAutomaticResolutionsForCompetence/);
  assert.match(app,/source==='csv'/);
  assert.match(app,/Automático · Qualidade Completa/);
  assert.match(app,/get_operational_fcr_overview_range/);
  assert.match(app,/renderStrategyRequiredFte/);
});

test('migration cria fonte Resolve, FCR operacional e historico de atendimentos por FTE',()=>{
  assert.match(migration,/create table if not exists public\.quality_full_resolution_daily/i);
  assert.match(migration,/create table if not exists public\.quality_full_resolution_coverage/i);
  assert.match(migration,/sync_strategy_resolution_metrics_from_quality/i);
  assert.match(migration,/get_operational_fcr_overview_range/i);
  assert.match(migration,/attendance_per_available_fte/i);
  assert.match(migration,/greatest\(attendance-resolve_no,0\)/i);
});
