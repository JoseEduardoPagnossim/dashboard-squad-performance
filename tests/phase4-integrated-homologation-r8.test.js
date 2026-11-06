'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const importer=require('../js/strategy-csv-importer');
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const leaderSql=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.10_FASE1_LIDERES.sql','utf8');

test('Fase 4: MRR e avulsas sugerem obrigatórias, opcionais iniciam desligadas',()=>{
  for(const [source,csv,optional] of [
    ['contracted_modules_csv','Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Anterior,Vl Atual Ativo,Cliente,CNPJ\n06/11/2026,Ana,A,Módulo X,300,60,Empresa X,123\n','customer'],
    ['merchandise_sales_csv','id,Data,Vendedor,grupo,Produto,vlTotalItem,quantidade\n42,2026-11-06,Ana,B,Certificado,150,2\n','quantity']
  ]){
    const parsed=importer.parse(csv),mapping=importer.suggest(source,parsed.headers),def=importer.definition(source);
    for(const field of def.fields.filter(f=>f.required))assert.ok(mapping[field.key],field.key);
    assert.equal(mapping[optional],undefined);
    assert.equal(importer.auditPreview(source,parsed,mapping).summary.needsReview,0);
    mapping[optional]=optional==='quantity'?'quantidade':'Cliente';
    assert.doesNotThrow(()=>importer.validateMapping(source,parsed.headers,mapping));
  }
});

test('Fase 4: MRR ausente gera pendência sem descartar venda nem afetar grupo C',()=>{
  const csv='Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Anterior,Vl Atual Ativo\n06/11/2026,Ana,C,Módulo X,100,\n06/11/2026,Ana,C,Módulo X,100,20\n';
  const parsed=importer.parse(csv),m=importer.suggest('contracted_modules_csv',parsed.headers);
  const audit=importer.auditPreview('contracted_modules_csv',parsed,m);
  assert.equal(audit.summary.total,2);
  assert.equal(audit.summary.missingMonthly,1);
  assert.equal(audit.summary.needsReview,1);
  assert.equal(audit.bySquad.find(x=>x.squad==='C').rows,2);
  assert.equal(parsed.rowCount,2);
});

test('Fase 4: modelo salvo usa o motor definido e preserva campo opcional explícito',()=>{
  const fn=app.slice(app.indexOf('  function applyStrategyCsvTemplate(){'),app.indexOf('  async function handleStrategyCsvChange',app.indexOf('  function applyStrategyCsvTemplate(){')));
  assert.match(fn,/engine=window\.SoftenStrategyCsvImporter/);
  assert.match(fn,/const mapped=engine\.validateMapping/);
  assert.match(fn,/engine\.definition\(cs\.sourceKey\)/);
});

test('Fase 4: líderes vinculados somente à bonificação, com isolamento do Squad',()=>{
  const start=app.indexOf('  function reportAdminRows(m){');
  const end=app.indexOf('\n  function loadExternalScriptOnce',start);
  assert.ok(start>=0&&end>start);
  const report=new Function('state','safe',app.slice(start,end)+';return reportAdminRows')({squadCode:'A',superAdminCommissions:[
    {name:'Líder A',squad_code:'A',year:2026,month:11,amount:100},
    {name:'Líder B',squad_code:'B',year:2026,month:11,amount:200}
  ]},v=>Number(v)||0);
  const rows=report({year:2026,month:11});
  assert.equal(rows.length,1);
  assert.equal(rows[0]['Conta na Base do Squad'],'NÃO');
  assert.match(app,/function financeReportRows\(m\)\{return \[\.\.\.individualMetricTechnicians\(m\)\.map/);
  assert.match(leaderSql,/squad_code/);
});

test('Fase 4: interface publica cache-buster novo e conferência de MRR',()=>{
  assert.match(html,/js\/app\.js\?v=2\.63\.9-r9/);
  assert.match(app,/missingMonthly/);
});
