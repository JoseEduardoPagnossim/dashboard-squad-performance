'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const seller=require('../js/strategy-seller-reconciliation');
const csv=require('../js/strategy-csv-importer');
const recurring=require('../js/strategy-recurring-import');
const merchandise=require('../js/strategy-merchandise-import');
const read=p=>fs.readFileSync(p,'utf8');
const org='org1';
const people=[{id:'leader1',user_id:'heitor',name:'Heitor',active:true,functional_team:'other',default_squad_code:null,organization_id:org}];
const profiles=[{user_id:'heitor',full_name:'Heitor',active:true,role:'super_admin',organization_id:org}];
const months=[{user_id:'heitor',year:2026,month:10,squad_code:'A'}];
const products=[{id:'prod',name:'Modulo',normalized_name:'modulo',source_key:'contracted_modules_csv',generates_mrr:true,active:true}];
test('líder sem Squad operacional não é vendedor sem vinculação financeira',()=>{
 assert.deepEqual(seller.identityList(people,profiles,[]),[]);
 assert.deepEqual(seller.identityList(people,profiles,months).map(x=>x.squad),['A']);
});
test('líder conciliado recebe vendas somente na competência financeira',()=>{
 const parsed=csv.parse('Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Anterior,Vl Atual Ativo\n28/10/2026,Heitor,A,Modulo,50,20\n28/11/2026,Heitor,A,Modulo,50,20');
 const r=recurring.build({parsed,mapping:csv.suggest('contracted_modules_csv',parsed.headers),people,profiles,leaderCommissions:months,products,organizationId:org});
 assert.equal(r.summary.ready,1);assert.equal(r.summary.pendingSeller,1);assert.equal(r.ready[0].personId,'leader1');
});
test('mercadorias também respeitam mês financeiro do líder',()=>{
 const parsed=csv.parse('id,Data,Vendedor,grupo,Produto,vlTotalItem\n1,28/10/2026,Heitor,A,Modulo,25\n2,28/11/2026,Heitor,A,Modulo,30');
 const r=merchandise.build({parsed,mapping:csv.suggest('merchandise_sales_csv',parsed.headers),people,profiles,leaderCommissions:months,products:[{...products[0],source_key:'merchandise_sales_csv',generates_mrr:false}],organizationId:org});
 assert.equal(r.summary.ready,1);assert.equal(r.summary.pendingSeller,1);
});
test('SQL autoriza líder por Squad/competência e preserva comissão manual',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.11_LIDERES_ESTORNO.sql');
 for(const token of ['import_strategy_recurring_sales_v2639_r5','import_strategy_merchandise_sales_v2635','upsert_strategy_seller_alias_v2632','v_profile.role=\'super_admin\'','lc.year=extract(year from v_date)','imported_sales_commission','sales_commission','sync_strategy_leader_sales_v26311'])assert.ok(sql.includes(token),token);
});
test('estorno é transacional, auditado, por lote e bloqueia meses fechados',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.11_LIDERES_ESTORNO.sql');
 for(const token of ['strategy_commercial_batch_reversals_v26311','strategy_commercial_reversed_sales_v26311','preview_strategy_commercial_batch_reversal_v26311','reverse_strategy_commercial_batch_v26311','p_expected_sales','p_reason','status=\'closed\'','strategy_competence_snapshots','strategy_financial_closure_v2638','strategy_sales_commissions','strategy_result_attributions','strategy_result_events','status=\'reverted\''])assert.ok(sql.includes(token),token);
 assert.match(sql,/revoke all on function public\.reverse_strategy_commercial_batch_v26311/);
 assert.doesNotMatch(sql,/grant (delete|update) on public\.strategy_recurring_sales to authenticated/i);
});
test('tela usa prévia antes do estorno e não remove vendas diretamente',()=>{
 const html=read('index.html'),app=read('js/app.js');
 for(const id of ['strategyLeaderSellerPrepare','strategyLeaderSalesSync','strategyCommercialReversePreview','strategyCommercialReverseReason','strategyCommercialReverseConfirm'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(app,/preview_strategy_commercial_batch_reversal_v26311/);
 assert.match(app,/reverse_strategy_commercial_batch_v26311/);
 assert.doesNotMatch(app,/\.from\('strategy_recurring_sales'\)\.delete\(/);
});
