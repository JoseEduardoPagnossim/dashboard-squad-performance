'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const mod=require('../js/strategy-merchandise-import'),csv=require('../js/strategy-csv-importer');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const org='org-test';
const header='id,Data,Vendedor,grupo,Produto,quantidade,vlTotalItem';
const body=[
'100,2026-10-27 21:00:00.000,Ana,C,Certificado Digital,1,150.00',
'100,2026-10-27 21:00:00.000,Ana,C,Anuidade,2,200.00',
'101,2026-10-28 23:00:00.000,Bruno,A,Certificado Digital,3,75.50',
'102,2026-10-28 23:00:00.000,Bruno,,Certificado Digital,3,45.00',
'103,2026-10-28 23:00:00.000,Desconhecido,A,Certificado Digital,1,80.00',
'104,2026-10-28 23:00:00.000,Ana,C,Sem Cadastro,1,30.00',
'105,2026-02-30 23:00:00.000,Ana,C,Anuidade,1,20.00',
'106,2026-10-28 23:00:00.000,Ana,C,Anuidade,1,-20.00',
',2026-10-28 23:00:00.000,Ana,C,Anuidade,1,20.00',
'107,2026-10-28 23:00:00.000,Ana,C,Anuidade,zero,20.00'];
const parsed=csv.parse([header,...body].join('\n')+'\n'),mapping=csv.suggest(mod.SOURCE,parsed.headers);
const people=[{id:'p-c',user_id:'u-c',name:'Ana',organization_id:org,active:true,default_squad_code:'C',functional_team:'pre_attendance'},
{id:'p-a',user_id:'u-a',name:'Bruno',organization_id:org,active:true,default_squad_code:'A',functional_team:'support'}];
const profiles=[{user_id:'u-c',full_name:'Ana',organization_id:org,active:true,role:'pre_attendance'},
{user_id:'u-a',full_name:'Bruno',organization_id:org,active:true,role:'technician'}];
const products=['Certificado Digital','Anuidade'].map((name,i)=>({id:'pr-'+i,name,normalized_name:name.toLowerCase().replace(/[^a-z]/g,''),source_key:mod.SOURCE,generates_mrr:false,active:true}));
const build=(extra={})=>mod.build({organizationId:org,parsed,mapping,people,profiles,products,...extra});
test('motor é exclusivo do CSV avulso, sem MRR',()=>assert.equal(mod.SOURCE,'merchandise_sales_csv'));
test('reconhece 7 campos reais e data civil sem ajuste de fuso',()=>{assert.equal(mapping.saleId,'id');assert.equal(mapping.date,'Data');assert.equal(mapping.amount,'vlTotalItem');assert.equal(mapping.quantity,'quantidade');const r=build();assert.deepEqual(r.ready.map(x=>x.date),['2026-10-27','2026-10-27','2026-10-28']);});
test('id repetido em produtos diferentes gera duas vendas distintas',()=>{const r=build();assert.equal(r.ready.length,3);assert.deepEqual(r.ready.slice(0,2).map(x=>x.saleId),['100','100']);assert.notEqual(r.ready[0].productId,r.ready[1].productId);});
test('vlTotalItem não é multiplicado pela quantidade',()=>{const r=build();assert.equal(r.summary.readyAmountCents,42550);assert.equal(r.ready[1].amountCents,20000);assert.equal(r.ready[1].quantity,'2');assert.equal(r.ready[2].quantity,'3');});
test('ignora grupo vazio e mantém pendências sem lançar valores',()=>{const s=build().summary;assert.deepEqual({total:s.total,ready:s.ready,ignored:s.ignoredNoGroup,seller:s.pendingSeller,product:s.pendingProduct,date:s.pendingDate,amount:s.pendingAmount,id:s.pendingId,quantity:s.pendingQuantity},
{total:10,ready:3,ignored:1,seller:1,product:1,date:1,amount:1,id:1,quantity:1});});
test('Pré-atendimento Squad C requer conta e perfil ativo',()=>{const result=build({profiles:profiles.map(p=>p.user_id==='u-c'?{...p,role:'technician'}:p)});assert.equal(result.summary.ready,1);assert.equal(result.summary.pendingSeller,8);});
test('produto da origem MRR não é aceito como venda avulsa',()=>{const alt=products.map(p=>p.name==='Anuidade'?{...p,source_key:'contracted_modules_csv',generates_mrr:true}:p);const s=build({products:alt}).summary;assert.equal(s.ready,2);assert.equal(s.pendingProduct,6);});
test('quantidade opcional ausente é permitida sem alterar valor',()=>{const x=csv.parse('id,Data,Vendedor,grupo,Produto,vlTotalItem\n200,28/10/2026,Ana,C,Anuidade,25.00\n');const out=build({parsed:x,mapping:csv.suggest(mod.SOURCE,x.headers)});assert.equal(out.summary.ready,1);assert.equal(out.ready[0].quantity,'');});
test('quantidade positiva é normalizada e não pode ser zero, negativa ou textual',()=>{assert.equal(mod.quantity('2,5000'),'2.5');assert.equal(mod.quantity('1.00'),'1');assert.equal(mod.quantity(''), '');for(const invalid of ['0','-2','abc','1,55555','100000000'])assert.equal(mod.quantity(invalid),null);});
test('linhas idênticas são vendidas separadamente por ordinal estável',()=>{const same='300,2026-10-28 21:00:00.000,Ana,C,Anuidade,1,50.00';const x=csv.parse([header,same,same,same].join('\n')+'\n');const arg={parsed:x,mapping:csv.suggest(mod.SOURCE,x.headers)};const a=build(arg),b=build(arg);assert.equal(a.summary.ready,3);assert.equal(a.summary.repeatedRows,3);assert.deepEqual(a.ready.map(x=>x.occurrence),[1,2,3]);assert.deepEqual(a.ready,b.ready);});
test('mudança de quantidade ou valor preserva itens distintos',()=>{const x=csv.parse([header,'300,28/10/2026,Ana,C,Anuidade,1,50','300,28/10/2026,Ana,C,Anuidade,2,50','300,28/10/2026,Ana,C,Anuidade,1,60'].join('\n')+'\n');const r=build({parsed:x,mapping:csv.suggest(mod.SOURCE,x.headers)});assert.deepEqual(r.ready.map(x=>x.occurrence),[1,1,1]);});
test('motor não associa usuário sem a organização exigida',()=>{const wrong=people.map(p=>({...p,organization_id:'other'}));assert.equal(build({people:wrong}).summary.ready,0);});
test('lote respeita blocos de até 100 e falha em tamanho inválido',()=>{const v=mod.chunks({ready:Array.from({length:207},(_,i)=>i)});assert.deepEqual(v.map(x=>x.length),[100,100,7]);assert.throws(()=>mod.chunks({ready:[]},101));});
test('UI separa módulo avulso de recorrente e exige confirmação explícita',()=>{const app=read('js/app.js'),html=read('index.html');for(const id of ['strategyMerchandiseStatus','strategyMerchandiseSummary','strategyMerchandiseReview','strategyMerchandiseConfirm','strategyMerchandiseResult'])assert.ok(html.includes(`id="${id}"`),id);
for(const token of ['SoftenStrategyMerchandiseImport','prepareStrategyMerchandise','window.confirm','start_strategy_merchandise_batch_v2635','import_strategy_merchandise_sales_v2635','finish_strategy_merchandise_batch_v2635','strategyInvalidateFinance'])assert.ok(app.includes(token),token);
assert.match(html,/strategy-merchandise-import\.js\?v=2\.63\.8-r1/);});
test('migration gera receita direta com MRR e ARR ZERO e sem duplicar quantidade',()=>{const sql=read('supabase/migrations/MIGRACAO_V2.63.5.sql');for(const x of ["'merchandise_sales_csv'","'direct_sale'",'v_value,0,0','v_amount_cents::numeric/100','source_sale_id','item_quantity','source_occurrence','commission_posted'])assert.ok(sql.includes(x),x);assert.doesNotMatch(sql,/v_value\s*\*\s*(?:v_qty|v_item)/);});
test('migration valida conta ativa, Squad C, alias, produto não MRR e competência fechada',()=>{const sql=read('supabase/migrations/MIGRACAO_V2.63.5.sql');for(const x of ['v_profile.role',"'pre_attendance'","'technician'",'strategy_seller_aliases','strategy_commercial_products','generates_mrr=false',"v_comp_status='closed'",'organization_id=v_org'])assert.ok(sql.includes(x),x);});
test('ledger e tentativas são imutáveis sob RLS, sem atualização direta',()=>{const sql=read('supabase/migrations/MIGRACAO_V2.63.5.sql');for(const x of ['enable row level security','unique(organization_id,source_key,sale_identity)','unique(batch_id,sale_identity)','pg_advisory_xact_lock','strategy_merchandise_protect_result_v2635','strategy_merchandise_protect_attr_v2635',"has_strategy_access('people_costs')","has_strategy_access('edit_costs')"] )assert.ok(sql.includes(x),x);
assert.doesNotMatch(sql,/grant (insert|update|delete|all) on public\.strategy_merchandise_sales to authenticated/i);
assert.doesNotMatch(sql,/insert into public\.technician_finance_monthly|update public\.strategy_result_snapshots|insert into public\.strategy_recurring_sales/i);});
test('idempotência por origem+identidade não depende exclusivamente do ID',()=>{const sql=read('supabase/migrations/MIGRACAO_V2.63.5.sql');assert.ok(sql.includes('v_normal_ref,v_day_text,v_normal_seller,v_squad,v_product.normalized_name,v_amount_cents::text,v_qty_text,v_occurrence::text'));assert.ok(sql.includes('duplicate'));});
