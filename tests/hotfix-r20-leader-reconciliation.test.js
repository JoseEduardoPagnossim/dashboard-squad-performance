const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const recon=require('../js/strategy-seller-reconciliation');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('R20 cria vinculo via migration, nao cria tecnico operacional',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.15_CONCILIACAO_LIDERES_R20.sql');
 for(const term of ['HEITOR DRAGO','year=2026 AND month=10','squad_code=\'A\'','strategy_people','NOT EXISTS','functional_team,default_squad_code','super_admin'])assert.ok(sql.includes(term),term);
 assert.doesNotMatch(sql,/UPDATE public\.squad_months|UPDATE public\.technician_months/i);
});
test('R20 carrega dados estrategicos apos preparar lideres, e rotula perfil correto',()=>{
 const js=read('js/app.js'),html=read('index.html');
 assert.match(js,/await state\.supabase\.rpc\('prepare_strategy_leader_sellers_v26311'\)/);
 assert.ok(js.indexOf("rpc('prepare_strategy_leader_sellers_v26311')")<js.indexOf("from('strategy_people').select('id,user_id,name,active,functional_team,default_squad_code')"));
 assert.match(js,/Líder\/Administrador/);
 assert.match(html,/js\/app\.js\?v=2\.63\.9-r20/);
});
test('R20 Heitor por Squad A exige identidade estrategica e alias sem virar tecnico',()=>{
 const people=[{id:'person-heitor',user_id:'user-heitor',name:'HEITOR DRAGO',active:true,functional_team:'other',organization_id:'org',default_squad_code:null}];
 const profiles=[{user_id:'user-heitor',full_name:'HEITOR DRAGO',active:true,role:'super_admin',organization_id:'org'}];
 const commissions=[{user_id:'user-heitor',year:2026,month:10,squad_code:'A'}];
 const ids=recon.identityList(people,profiles,commissions);
 assert.equal(ids.length,1);assert.equal(ids[0].role,'super_admin');assert.equal(ids[0].squad,'A');assert.deepEqual(ids[0].periods,['2026-10']);
});
