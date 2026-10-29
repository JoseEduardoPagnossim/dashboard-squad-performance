'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const csv=require('../js/strategy-csv-importer'),recon=require('../js/strategy-seller-reconciliation');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const org='o1';
const people=[
 {id:'p1',user_id:'u1',name:'José Paulo',default_squad_code:'A',active:true,functional_team:'support',organization_id:org},
 {id:'p2',user_id:'u2',name:'Gabriel Garcia',default_squad_code:'C',active:true,functional_team:'pre_attendance',organization_id:org},
 {id:'p3',user_id:null,name:'Sem conta',default_squad_code:'D',active:true,functional_team:'support',organization_id:org},
 {id:'p4',user_id:'u4',name:'Maria Souza',default_squad_code:'D',active:false,functional_team:'support',organization_id:org},
 {id:'p5',user_id:'u5',name:'Outra Organização',default_squad_code:'E',active:true,functional_team:'support',organization_id:'o2'}
];
const profiles=[
 {user_id:'u1',full_name:'Jose Paulo',role:'technician',active:true,organization_id:org},
 {user_id:'u2',full_name:'Gabriel Garcia',role:'pre_attendance',active:true,organization_id:org},
 {user_id:'u4',full_name:'Maria Souza',role:'technician',active:true,organization_id:org},
 {user_id:'u5',full_name:'Outra Organização',role:'technician',active:true,organization_id:'o2'}
];
const content='Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Atual Ativo\n28/10/2026,José Paulo,A,Modulo,25\n28/10/2026,Gabriel Garcia,C,Modulo,25\n28/10/2026,GABRIEL GARCIA,C,Modulo,25\n28/10/2026,Gabriel Garcia,D,Modulo,25\n28/10/2026,Jose P.,A,Modulo,25\n28/10/2026,Sem conta,D,Modulo,25\n28/10/2026,Sem Grupo,,Modulo,25\n28/10/2026,Maria Souza,D,Modulo,25\n';
const parsed=csv.parse(content),mapping=csv.suggest('contracted_modules_csv',parsed.headers);
function run(options={}){return recon.reconcile({sourceKey:'contracted_modules_csv',parsed,mapping,people,profiles,...options});}
test('normalize nomes sem diferenciar caixa, acentos, espacos ou pontuacao',()=>{assert.equal(recon.normalizeName(' JÓSÉ  PAULO '),'josepaulo');assert.equal(recon.normalizeName('Jose P.'),'josep');});
test('apenas grupo A-E e reconhece pre-atendimento C',()=>{assert.equal(recon.squadCode('c'),'C');assert.equal(recon.squadCode('N'),null);assert.equal(recon.roleFor('C'),'pre_attendance');});
test('contas ativas vinculadas por pessoa, equipe, role e organizacao',()=>{assert.deepEqual(recon.identityList(people,profiles).map(x=>x.personId),['p1','p2','p5']);});
test('contabiliza grupo valido e ignora linha sem grupo',()=>{const r=run();assert.equal(r.summary.ignoredNoGroup,1);assert.equal(r.summary.eligible,7);});
test('concilia por nome exato e Squad sem correspondencia fraca',()=>{const r=run();assert.equal(r.summary.matched,3);assert.equal(r.summary.pending,4);assert.equal(r.groups.find(x=>x.name==='Jose P.').status,'pending');});
test('grupo C somente conta pre_attendance; nao associa venda do D a Gabriel',()=>{const r=run();assert.equal(r.groups.find(x=>x.name==='Gabriel Garcia'&&x.squad==='D').status,'pending');assert.equal(r.groups.find(x=>x.name==='Gabriel Garcia'&&x.squad==='C').personId,'p2');});
test('profissional ativo sem user_id nao cria identidade inventada',()=>{const r=run();assert.equal(r.groups.find(x=>x.name==='Sem conta').status,'pending');});
test('pessoa inativa nao recebe vendas',()=>{const r=run();assert.equal(r.groups.find(x=>x.name==='Maria Souza').status,'pending');});
test('alias aprovado concilia apenas mesmo grupo e origem',()=>{const aliases=[{source_key:'contracted_modules_csv',squad_code:'A',alias_normalized:'josep',person_id:'p1'}];const r=run({aliases});assert.equal(r.groups.find(x=>x.name==='Jose P.').personId,'p1');assert.equal(r.summary.matched,4);const other=recon.reconcile({sourceKey:'merchandise_sales_csv',parsed:csv.parse('id,Data,Vendedor,grupo,Produto,vlTotalItem\n1,28/10/2026,Jose P.,A,Item,25'),mapping:{saleId:'id',date:'Data',seller:'Vendedor',squad:'grupo',product:'Produto',amount:'vlTotalItem'},people,profiles,aliases});assert.equal(other.summary.pending,1);});
test('alias apontando para usuario de outro grupo nao é aplicado',()=>{const r=run({aliases:[{source_key:'contracted_modules_csv',squad_code:'A',alias_normalized:'josep',person_id:'p2'}]});assert.equal(r.groups.find(x=>x.name==='Jose P.').status,'pending');});
test('alias cadastrado para pessoa removida nao reutiliza match por nome',()=>{const r=run({aliases:[{source_key:'contracted_modules_csv',squad_code:'C',alias_normalized:'gabrielgarcia',person_id:'inexistente'}]});assert.equal(r.groups.find(x=>x.name==='Gabriel Garcia'&&x.squad==='C').status,'pending');});
test('duplicidade de nomes no mesmo Squad fica ambigua e sem userId',()=>{const others=[...people,{...people[0],id:'p99',user_id:'u99'}];const users=[...profiles,{...profiles[0],user_id:'u99'}];const r=run({people:others,profiles:users});const j=r.groups.find(x=>x.name==='José Paulo');assert.equal(j.status,'ambiguous');assert.equal(j.userId,null);});
test('muda Squad e impede casar pessoa apenas pelo nome',()=>{const p=[...people,{...people[0],id:'p77',user_id:'u77',name:'José Paulo',default_squad_code:'D'}];const users=[...profiles,{...profiles[0],user_id:'u77'}];const r=run({people:p,profiles:users});assert.equal(r.groups.find(x=>x.name==='José Paulo').personId,'p1');});
test('linha sem vendedor fica pendente especial, sem receita',()=>{const x=csv.parse('Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Atual Ativo\n28/10/2026,,C,Modulo,25');const r=recon.reconcile({sourceKey:'contracted_modules_csv',parsed:x,mapping:csv.suggest('contracted_modules_csv',x.headers),people,profiles});assert.equal(r.summary.ignoredNoSeller,1);assert.equal(r.summary.eligible,0);});
test('aliasPayload nao permite origem incorreta ou nome vazio',()=>{assert.throws(()=>recon.aliasPayload({organizationId:'o',sourceKey:'manual',group:'A',personId:'p1',alias:'Jose'}),/origem/);assert.throws(()=>recon.aliasPayload({organizationId:'o',sourceKey:'contracted_modules_csv',group:'A',personId:'p1',alias:'J'}),/nome/);});
test('aliasPayload normaliza e nao envia valor financeiro do CSV',()=>{const p=recon.aliasPayload({organizationId:org,sourceKey:'contracted_modules_csv',group:'C',personId:'p2',alias:' GÁBRIEL GARCIA '});assert.equal(p.p_alias_normalized,'gabrielgarcia');assert.equal(p.p_squad_code,'C');assert.equal(Object.isFrozen(p),true);assert.equal(JSON.stringify(p).includes('25'),false);});
test('resultado de conciliação nao modifica estruturas de origem ou cria receita',()=>{const before=JSON.stringify(parsed),r=run();assert.equal(JSON.stringify(parsed),before);assert.equal(r.persisted,false);assert.equal(r.official,false);assert.equal(Object.isFrozen(r.groups),true);});
test('SQL V2.63.2 cria aliases com RLS e gravação por RPC validada no servidor',()=>{const sql=read('supabase/migrations/MIGRACAO_V2.63.2.sql');for(const x of ['strategy_seller_aliases','enable row level security','has_strategy_access(\'edit_costs\')','has_strategy_access(\'people_costs\')','auth.uid()','upsert_strategy_seller_alias_v2632','organization_id=v_org','v_person.user_id','v_person.functional_team','v_role','person_id uuid'])assert.ok(sql.includes(x),x);assert.match(sql,/revoke all on public\.strategy_seller_aliases from anon,authenticated/i);assert.doesNotMatch(sql,/grant (insert|update|delete|all) on public\.strategy_seller_aliases to authenticated/i);});
test('UI integra conciliador com seleção e RPC, sem postar CSV ao backend',()=>{const html=read('index.html'),js=read('js/app.js');for(const id of ['strategySellerSummary','strategySellerRows','strategySellerAliasKey','strategySellerAliasPerson','strategySellerAliasSave'])assert.ok(html.includes(`id="${id}"`));assert.match(js,/SoftenStrategySellerReconciliation/);assert.match(js,/upsert_strategy_seller_alias_v2632/);assert.match(js,/renderStrategySellerReconciliation/);assert.match(html,/strategy-seller-reconciliation\.js\?v=2\.63\.2-r1/);});
