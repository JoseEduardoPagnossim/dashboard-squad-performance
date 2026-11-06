'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const report=require('../js/finance-report-engine');
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');

function adminReportFor(squad,commissions){
  const start=app.indexOf('  function reportAdminRows(m){');
  const end=app.indexOf('\n  function loadExternalScriptOnce',start);
  assert.ok(start>=0&&end>start,'função administrativa de relatório presente');
  return new Function('state','safe',app.slice(start,end)+';return reportAdminRows')(
    {squadCode:squad,superAdminCommissions:commissions},v=>Number(v)||0);
}

test('Fase 5: os quatro líderes aparecem apenas em seu próprio Squad financeiro',()=>{
  const commissions=['A','B','D','E'].map((squad_code,i)=>({name:`Líder ${squad_code}`,squad_code,year:2026,month:11,amount:200+i*10,sales_commission:30,manual_bonus:20,discount:15,redistribution:5,notes:`Ajuste ${squad_code}`}));
  for(const squad of ['A','B','D','E']){
    const rows=adminReportFor(squad,commissions)({year:2026,month:11});
    assert.equal(rows.length,1);assert.equal(rows[0]['Grupo'],squad);
    assert.equal(rows[0]['Perfil financeiro'],'LÍDER');
    assert.equal(rows[0]['Conta na Base do Squad'],'NÃO');
    assert.equal(rows[0]['Observação'],`Ajuste ${squad}`);
    assert.equal(rows[0]['Valor oficial'],rows[0]['Comissão base do técnico']+30+20-15+5);
    assert.equal(report.computedValue(rows[0],report.columnById('hrPaymentTotal')),rows[0]['Valor oficial']);
  }
  assert.deepEqual(adminReportFor('C',commissions)({year:2026,month:11}),[]);
  assert.deepEqual(adminReportFor('A',commissions)({year:2026,month:10}),[]);
});

test('Fase 5: RH respeita valor oficial com descontos e redistribuição, sem pagamento duplicado',()=>{
  const row={'Comissão base do técnico':200,'Comissão vendas':80,'Bônus manual':30,'Desconto':40,'Redistribuição':15,'Valor oficial':285};
  assert.equal(report.computedValue(row,report.columnById('hrPaymentTotal')),285);
  assert.equal(report.computedValue({...row,'Valor oficial':0},report.columnById('hrPaymentTotal')),0);
  const {['Valor oficial']:unused,...withoutOfficial}=row;
  assert.equal(report.computedValue(withoutOfficial,report.columnById('hrPaymentTotal')),285);
});

test('Fase 5: perfil e observações são campos opcionais selecionáveis nos dois formatos',()=>{
  const selected=report.selectedColumns(report.normalizeConfig({visible:['technician','financeRole','notes','officialValue'],applyToExcel:true}));
  assert.deepEqual(selected.map(x=>x.id),['technician','financeRole','officialValue','notes']);
  assert.equal(report.computedValue({'Perfil financeiro':'LÍDER'},report.columnById('financeRole')),'LÍDER');
  assert.equal(report.computedValue({'Observação':'Férias e ajuste'},report.columnById('notes')),'Férias e ajuste');
  assert.match(app,/financeReportProjectedRows\(rows,columns\)/);
  assert.match(app,/financeReportDisplayValue\(row,column\)/);
  assert.match(html,/js\/finance-report-engine\.js\?v=2\.63\.9-r12/);
});
