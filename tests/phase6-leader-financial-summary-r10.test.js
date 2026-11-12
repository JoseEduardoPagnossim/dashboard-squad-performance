'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const report=require('../js/finance-report-engine');
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');

test('Fase 6: consolida somente líderes e preserva a folha técnica',()=>{
  const rows=[
    {'Perfil financeiro':'TÉCNICO','Valor oficial':900},
    {'Perfil financeiro':'LÍDER','Valor oficial':123.45},
    {'Perfil financeiro':'LÍDER','Valor oficial':20.10},
    {'Perfil financeiro':'TÉCNICO','Valor oficial':700}
  ];
  assert.deepEqual(report.leaderFinancialSummary(rows),{count:2,total:143.55});
  assert.equal(rows.reduce((s,x)=>s+x['Valor oficial'],0)>1600,true);
  assert.deepEqual(report.leaderFinancialSummary(rows.filter(x=>x['Perfil financeiro']==='TÉCNICO')),{count:0,total:0});
});
test('Fase 6: relatório de liderança mantém competência e Squad como filtros',()=>{
  const start=app.indexOf('  function reportAdminRows(m){');
  const end=app.indexOf('\n  function loadExternalScriptOnce',start);
  const filter=new Function('state','safe',app.slice(start,end)+';return reportAdminRows')(
    {squadCode:'B',superAdminCommissions:[
      {squad_code:'B',year:2026,month:11,name:'Líder B',amount:100,sales_commission:15,manual_bonus:10,discount:2,redistribution:7},
      {squad_code:'A',year:2026,month:11,name:'Líder A',amount:200},
      {squad_code:'B',year:2026,month:10,name:'Mês anterior',amount:300}
    ]},v=>Number(v)||0);
  const rows=filter({year:2026,month:11});
  assert.equal(rows.length,1);
  assert.deepEqual(report.leaderFinancialSummary(rows),{count:1,total:130});
  assert.equal(rows[0]['Atendimentos'],undefined);
});
test('Fase 6: Excel e PDF utilizam o mesmo consolidado, sem alterar indicadores',()=>{
  assert.match(app,/function financeReportLeadershipSummary\(rows\)\{return financeReportEngine\.leaderFinancialSummary\(rows\)\}/);
  assert.match(app,/'Bonificação líderes \(fora das métricas\)':leadership\.total/);
  assert.match(app,/Líderes financeiros \$\{leadership\.count\}: \$\{fmtMoney\(leadership\.total\)\}/);
  assert.match(app,/function financeReportRows\(m\)\{return \[\.\.\.individualMetricTechnicians\(m\)\.map/);
  assert.match(html,/js\/finance-report-engine\.js\?v=2\.63\.9-r25/);
});
