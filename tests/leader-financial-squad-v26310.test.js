const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sql=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.10_FASE1_LIDERES.sql','utf8');
const start=src.indexOf('  function reportAdminRows(m){');
const end=src.indexOf('\n  function loadExternalScriptOnce',start);
const fn=new Function('state','safe',`${src.slice(start,end)};return reportAdminRows`);
const safe=v=>Number(v)||0;
test('líder é exportado apenas na sua competência e Squad financeiro',()=>{
  const state={squadCode:'A',superAdminCommissions:[
    {name:'Líder A',squad_code:'A',year:2026,month:11,amount:100,sales_commission:15,manual_bonus:20,discount:5,redistribution:3},
    {name:'Líder B',squad_code:'B',year:2026,month:11,amount:200},
    {name:'Líder antigo',year:2026,month:11,amount:300},
    {name:'Líder outro mês',squad_code:'A',year:2026,month:10,amount:400}
  ]};
  const rows=fn(state,safe)({year:2026,month:11});
  assert.equal(rows.length,1);
  assert.equal(rows[0]['Técnico'],'Líder A');
  assert.equal(rows[0]['Valor oficial'],133);
  assert.equal(rows[0]['Conta na Base do Squad'],'NÃO');
  assert.equal(rows[0]['Atendimentos'],undefined);
  state.squadCode='B';assert.equal(fn(state,safe)({year:2026,month:11}).length,1);
  state.squadCode='C';assert.equal(fn(state,safe)({year:2026,month:11}).length,0);
});
test('exportações utilizam mesma tabela financeira sem duplicar administrador',()=>{
  assert.match(src,/function financeReportRows\(m\)\{return \[\.\.\.individualMetricTechnicians\(m\)\.map/);
  assert.match(src,/\.\.\.reportAdminRows\(m\)\]\}/);
  assert.ok(!src.includes("'Administradores');const c=m.financeComparison"));
  assert.match(src,/await ensureSuperAdminCommissions\(\);await loadExternalScriptOnce/);
});
test('vínculo e valores de líderes existem somente na tabela financeira',()=>{
  for(const col of ['squad_code','sales_commission','manual_bonus','discount','redistribution','vacation'])assert.ok(sql.includes(col));
  assert.ok(!sql.includes('alter table public.technician_monthly'));
  for(const id of ['superAdminCommissionSquad','superAdminSalesInput','superAdminBonusInput','superAdminDiscountInput'])assert.ok(html.includes(`id="${id}"`));
  assert.match(src,/if\(m.isClosed\)return toast\('Competência fechada/);
});
