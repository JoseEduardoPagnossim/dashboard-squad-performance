const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('../js/finance-report-engine');
const app=fs.readFileSync('js/app.js','utf8');
test('R11: reconcilia técnicos e líderes em centavos, sem contar líder na produção',()=>{
 const r=engine.financialExportAudit([
  {'Perfil financeiro':'TÉCNICO','Técnico':'Ana','Grupo':'A','Valor oficial':100.10},
  {'Perfil financeiro':'LÍDER','Técnico':'Líder A','Grupo':'A','Valor oficial':25.20},
  {'Perfil financeiro':'TÉCNICO','Técnico':'João','Grupo':'A','Valor oficial':30.30}
 ]);
 assert.deepEqual(r.counts,{technicians:2,leaders:1,unidentified:0});
 assert.deepEqual(r.totals,{technicians:130.4,leaders:25.2,overall:155.6});
 assert.deepEqual(r.warnings,[]);
});
test('R11: aponta valor inválido, perfil desconhecido e possível duplicação',()=>{
 const r=engine.financialExportAudit([
  {'Perfil financeiro':'LÍDER','Técnico':'Marina','Grupo':'B','Valor oficial':50},
  {'Perfil financeiro':'LÍDER','Técnico':'Marina','Grupo':'B','Valor oficial':40},
  {'Perfil financeiro':'TÉCNICO','Valor oficial':''},
  {'Perfil financeiro':'ADMIN','Valor oficial':10}
 ]);
 assert.equal(r.warnings.length,3);
 assert.equal(r.counts.unidentified,1);
 assert.equal(r.totals.overall,90);
 assert.match(r.warnings.join(' '),/duplicado/);
});
test('R11: Excel e PDF compartilham a mesma reconciliação financeira',()=>{
 assert.match(app,/function financeReportExportAudit\(rows\)\{return financeReportEngine\.financialExportAudit\(rows\)\}/);
 assert.match(app,/XLSX\.utils\.book_append_sheet\(wb,XLSX\.utils\.json_to_sheet\(auditRows\),'Conferencia'\)/);
 assert.match(app,/Total financeiro \$\{fmtMoney\(audit\.totals\.overall\)\}/);
 assert.match(app,/Pendências de auditoria/);
});
