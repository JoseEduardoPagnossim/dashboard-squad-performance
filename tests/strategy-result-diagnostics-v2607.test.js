const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const result=require(join(root,'js','strategy-result.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');

test('V2.60.7 publica insights de resultado sem migration nova',()=>{
  assert.equal(pkg.version,'2.62.2');
  assert.equal(pkg.assetVersion,'2.62.2-r1');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.equal(result.CATALOG.find(item=>item.id==='result-diagnostics')?.state,'ready');
  assert.ok(existsSync(join(root,'docs','RESULTADO_DIAGNOSTICOS_V2.60.7.md')));
  assert.equal(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.7.sql')),false);
  assert.match(index,/V2\.60\.7 • INSIGHTS E DIAGNÓSTICO DE RESULTADO/);
  assert.match(index,/strategyResultDiagnosticPriority/);
  assert.match(index,/strategyResultDiagnosticSquadRows/);
  assert.match(index,/strategyResultDiagnosticTechRows/);
  assert.ok(index.includes('js/strategy-result.js?v=2.62.2-r1'));
});

test('retorno direto forte usa cobertura e não soma outras naturezas',()=>{
  const d=result.diagnoseResultRow({total_cost:1000,direct_revenue:1500,influenced_revenue:5000,protected_revenue:4000},'squad');
  assert.equal(d.code,'DIRECT_RETURN_STRONG');
  assert.equal(d.tone,'good');
  assert.equal(d.evidence.directCostCoverage,1.5);
  assert.equal(d.evidence.directRoiPct,50);
});

test('resultado próximo do break-even gera atenção sem classificar como prejuízo estrutural',()=>{
  const d=result.diagnoseResultRow({total_cost:1000,direct_revenue:900,influenced_revenue:0,protected_revenue:0},'squad');
  assert.equal(d.code,'NEAR_BREAK_EVEN');
  assert.equal(d.tone,'warn');
  assert.match(d.nextStep,/Revisar custo|oportunidades/i);
});

test('influência alta com retorno direto baixo orienta investigar conversão sem atribuir culpa',()=>{
  const d=result.diagnoseResultRow({total_cost:1000,direct_revenue:300,influenced_revenue:2500,protected_revenue:200},'squad');
  assert.equal(d.code,'INFLUENCE_CONVERSION_SIGNAL');
  assert.equal(d.tone,'warn');
  assert.match(d.detail,/não prova falha/i);
  assert.match(d.nextStep,/handoff|convers|fechamento/i);
});

test('proteção relevante reconhece papel de retenção sem tratar protegida como ROI',()=>{
  const d=result.diagnoseResultRow({total_cost:1000,direct_revenue:200,influenced_revenue:100,protected_revenue:2200},'squad');
  assert.equal(d.code,'PROTECTION_CONCENTRATION');
  assert.match(d.detail,/retenção/i);
  assert.equal(d.evidence.protectedImpactPerCost,2.2);
  assert.equal(d.evidence.directCostCoverage,.2);
});

test('custo sem atribuição econômica sinaliza lacuna e não afirma ausência de valor',()=>{
  const d=result.diagnoseResultRow({total_cost:1000,direct_revenue:0,influenced_revenue:0,protected_revenue:0},'squad');
  assert.equal(d.code,'ECONOMIC_ATTRIBUTION_GAP');
  assert.equal(d.tone,'bad');
  assert.match(d.detail,/não prova ausência de valor/i);
});

test('sem custo válido diagnóstico fecha como base incompleta',()=>{
  const d=result.diagnoseResultRow({total_cost:0,direct_revenue:5000,influenced_revenue:2000,protected_revenue:1000},'squad');
  assert.equal(d.code,'DATA_GAP');
  assert.equal(d.ready,false);
  assert.equal(d.evidence.directCostCoverage,null);
});

test('técnico sem custo pessoal permanece visível mas sem diagnóstico econômico conclusivo',()=>{
  const d=result.diagnoseResultRow({technician_name:'Ana',squad_code:'D',cost_available:false,total_cost:0,direct_revenue:900},'technician');
  assert.equal(d.label,'Ana');
  assert.equal(d.code,'DATA_GAP');
  assert.equal(d.ready,false);
});

test('sumário prioriza leitura crítica e mantém contagens transparentes',()=>{
  const rows=[
    result.diagnoseResultRow({total_cost:1000,direct_revenue:1500},'squad'),
    result.diagnoseResultRow({total_cost:1000,direct_revenue:900},'squad'),
    result.diagnoseResultRow({total_cost:1000,direct_revenue:100},'squad'),
    result.diagnoseResultRow({total_cost:0,direct_revenue:1000},'squad')
  ];
  const s=result.summarizeResultDiagnostics(rows);
  assert.equal(s.healthy,1);
  assert.equal(s.attention,1);
  assert.equal(s.critical,1);
  assert.equal(s.dataGap,1);
  assert.equal(s.priority.code,'DIRECT_RETURN_BELOW_COST');
});

test('buildResultDiagnostics respeita filtro de Squad e preserva naturezas separadas',()=>{
  const d=result.buildResultDiagnostics({scope:{competence:'2026-10',squadCode:'D'},operational:{source_available:true,total_cost:1000,direct_revenue:700,influenced_revenue:1500,protected_revenue:500,rows:[
    {squad_code:'D',total_cost:600,direct_revenue:300,influenced_revenue:900,protected_revenue:200},
    {squad_code:'E',total_cost:400,direct_revenue:400,influenced_revenue:600,protected_revenue:300}
  ]},technicians:{source_available:true,rows:[
    {technician_key:'1',technician_name:'Ana',squad_code:'D',cost_available:true,total_cost:500,direct_revenue:200,influenced_revenue:800,protected_revenue:100},
    {technician_key:'2',technician_name:'Beto',squad_code:'E',cost_available:true,total_cost:500,direct_revenue:500,influenced_revenue:700,protected_revenue:400}
  ]}});
  assert.equal(d.squads.length,1);
  assert.equal(d.squads[0].squadCode,'D');
  assert.equal(d.technicians.length,1);
  assert.equal(d.technicians[0].label,'Ana');
  assert.equal(Object.hasOwn(d.operation.evidence,'totalEconomicRevenue'),false);
});

test('app renderiza diagnóstico usando ROI existente e preserva guardrail causal',()=>{
  assert.match(app,/renderStrategyResultDiagnostics/);
  assert.match(app,/buildResultDiagnostics/);
  assert.match(app,/strategyResultDiagnosticGuardrail/);
  assert.match(index,/Diagnóstico não é causa nem decisão automática/);
  assert.match(index,/Influenciada e Protegida aparecem como contexto independente/);
});
