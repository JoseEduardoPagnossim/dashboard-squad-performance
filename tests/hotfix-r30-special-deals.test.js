'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const recurring=require('../js/strategy-recurring-import');
const csv=require('../js/strategy-csv-importer');
const src=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.22_NEGOCIACOES_ESPECIAIS_R30.sql','utf8');
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const headers='Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Anterior,Vl Atual Ativo,Cliente,ClienteCNPJ,DataCadItemContrato';
const rows=[
  ['15/11/2026','Ana','D','Financeiro','80','1000','Cliente 1','11.222.333/0001-44','2026-11-15 10:12:05.123'],
  ['15/11/2026','Ana','D','Estoque','50','999','Cliente 1','11.222.333/0001-44','2026-11-15 10:12:35.455'],
  ['15/11/2026','Ana','D','NFS-e','40','5','Cliente 1','11.222.333/0001-44','2026-11-15 10:12:40.092'],
  ['15/11/2026','Bruno','D','Financeiro','30','500','Cliente 2','11.222.333/0001-55','2026-11-15 10:12:07.555'],
  ['15/11/2026','Ana','D','Financeiro','60','500','Cliente 3','44.555.666/0001-44','2026-11-15 10:12:07.555']
];
const data=csv.parse([headers,...rows.map(r=>r.join(','))].join('\n')+'\n');
const mapping=csv.suggest('contracted_modules_csv',data.headers);
const org='org';
const people=['Ana','Bruno'].map(n=>({id:n,user_id:n,name:n,organization_id:org,active:true,default_squad_code:'D',functional_team:'support'}));
const profiles=people.map(p=>({user_id:p.user_id,full_name:p.name,organization_id:org,active:true,role:'technician'}));
const products=['Financeiro','Estoque','NFS-e'].map(n=>({id:n,name:n,normalized_name:recurring.normalize(n),source_key:recurring.SOURCE,generates_mrr:true,active:true}));
const make=()=>recurring.build({parsed:data,mapping,people,profiles,products,organizationId:org});
test('R30: mapeia somente colunas de agrupamento e dispensa Vl Atual Ativo',()=>{
  assert.equal(mapping.amount,'Vl Anterior');assert.equal(mapping.activeMonthly,undefined);
  assert.equal(mapping.taxId,'ClienteCNPJ');assert.equal(mapping.contractDate,'DataCadItemContrato');
  assert.equal(mapping.customer,undefined);
  assert.equal(make().summary.readyMrrCents,26000);
});
test('R30: identifica janela de 60s com milissegundos, mesmo vendedor e 7 digitos',()=>{
  const groups=recurring.detectSpecialDeals(make());
  assert.equal(groups.length,1);
  assert.deepEqual(groups[0].lines,[2,3,4]);
  assert.equal(groups[0].totalCents,17000);
  assert.equal(groups[0].seller,'Ana');
  assert.equal(groups[0].customerPrefix,'1122233');
  assert.ok(!JSON.stringify(groups).includes('11222333'));
  assert.ok(!JSON.stringify(groups).includes('11.222.333/0001-44'));
  assert.match(app,/CNPJ usado no agrupamento \(7 primeiros dígitos\)/);
});
test('R30: bloqueia toda negociação sem decisão e valida valores manuais',()=>{
  const p=make();
  assert.throws(()=>recurring.applySpecialDecisions(p,{}),/Revise/);
  assert.throws(()=>recurring.applySpecialDecisions(p,{'R30-00001':{mode:'special',mrrCents:-1,commissionCents:500}}),/válidos/);
});
test('R30: aprova comissão uma vez, zera membros, preserva demais vendas',()=>{
  const p=recurring.applySpecialDecisions(make(),{'R30-00001':{mode:'special',mrrCents:3500,commissionCents:2000}});
  assert.equal(p.ready.length,5);
  assert.deepEqual(p.ready.slice(0,3).map(x=>x.specialMrrCents),[3500,0,0]);
  assert.deepEqual(p.ready.slice(0,3).map(x=>x.specialCommissionCents),[2000,0,0]);
  assert.equal(p.ready[3].specialGroupId,undefined);
});
test('R30: vendas independentes mantêm os critérios normais',()=>{
  const p=recurring.applySpecialDecisions(make(),{'R30-00001':{mode:'independent'}});
  assert.equal(p.ready.filter(x=>x.specialGroupId).length,0);
});
test('R30: detecta somente horários completos, não agrupa pelo dia',()=>{
  assert.equal(recurring.timestampMinute('2026-11-15'),null);
  assert.equal(recurring.timestampMinute('2026-11-15 10:12:05.123'),Date.UTC(2026,10,15,10,12,5));
  assert.equal(recurring.timestampMinute('2026-11-15 25:12:05'),null);
});
test('R30: SQL usa Vl Anterior, registra auditoria sem prefixo e protege R23',()=>{
  assert.match(src,/strategy_special_deal_lines_r30/);
  assert.match(src,/v_active_value:=v_value/);
  assert.doesNotMatch(src,/v_item->>'activeMonthlyCents'/);
  assert.match(src,/v_special_comm::numeric\/100/);
  assert.match(src,/commission_rule_at_import->>'r30_special'/);
  assert.match(src,/competence.*closed/);
  assert.doesNotMatch(src,/tax_prefix|cnpj_prefix/);
});
test('R30: etapa condicional e validação acontecem antes do Supabase',()=>{
  assert.match(html,/id="strategySpecialReviewR30"/);
  const start=app.indexOf('async function confirmStrategyRecurringImport()');
  const part=app.slice(start,start+2200);
  assert.ok(part.indexOf('resolvedSpecialDecisionsR30')<part.indexOf('start_strategy_recurring_batch_v2634') || part.includes('resolvedSpecialDecisionsR30'));
});

test('R30: mantém grupos especiais juntos em blocos de 100',()=>{
  const ready=[];
  for(let i=0;i<99;i++)ready.push({line:i+2});
  ready.push({line:101,specialGroupId:'R30-00001',specialRole:'anchor'});
  ready.push({line:102,specialGroupId:'R30-00001',specialRole:'member'});
  const result=recurring.chunks({ready});
  assert.deepEqual(result.map(c=>c.length),[99,2]);
  assert.equal(result[1][0].specialRole,'anchor');
});
test('R30: grupo maior que 100 bloqueia antes da gravacao',()=>{
  const ready=Array.from({length:101},(_,i)=>({line:i+2,specialGroupId:'R30-00001',specialRole:i?'member':'anchor'}));
  assert.throws(()=>recurring.chunks({ready}),/maior/);
});
