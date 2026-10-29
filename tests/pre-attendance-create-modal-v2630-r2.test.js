'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const js=read('js/app.js');
const html=read('index.html');

function initialize(){
 const elements={};
 const element=(name)=>elements[name]||(elements[name]={value:'',disabled:false,required:false,textContent:'',classList:{toggle(){}}});
 const role=element('#newUserRole');
 Object.defineProperty(role,'innerHTML',{get(){return this._html||''},set(s){this._html=s;const m=s.match(/<option value="([^"]*)"/);this.value=m?m[1]:'';}});
 const squad=element('#newUserSquad');
 Object.defineProperty(squad,'innerHTML',{get(){return this._html||''},set(s){this._html=s;const m=s.match(/<option value="([^"]*)"/);this.value=m?m[1]:'';}});
 const form=element('#createUserForm');form.reset=()=>{role.value='technician';squad.value=''};
 const state={squads:{D:{code:'D'},A:{code:'A'}},squadCode:'D',user:{squadCode:'D'}};
 const start=js.indexOf('  function openCreateUser(){');
 const end=js.indexOf('  async function handleCreateUser(e){',start);
 assert.ok(start>=0&&end>start,'funcoes originais devem existir');
 const factory=new Function('$','state','isAdmin','hasPermission','isSuperAdmin','escapeHtml','openModal',js.slice(start,end)+'\nreturn {openCreateUser,syncCreateUserFields};');
 let opened=false;
 const handlers=factory(element,state,()=>true,()=>true,()=>true,s=>s,()=>{opened=true});
 return {element,opened:()=>opened,...handlers};
}

test('modal existente lista as tres opcoes ao ser aberto, sem remover Pre-atendimento',()=>{
 const m=initialize();m.openCreateUser();
 assert.equal(m.opened(),true);
 assert.match(m.element('#newUserRole').innerHTML,/<option value="pre_attendance">Pré-atendimento<\/option>/);
 assert.match(m.element('#newUserRole').innerHTML,/<option value="technician">Técnico<\/option>/);
 assert.match(m.element('#newUserRole').innerHTML,/<option value="super_admin">Administrador<\/option>/);
 assert.ok(!m.element('#newUserSquad').disabled);
 assert.equal(m.element('#newUserSquad').value,'D');
 assert.equal(m.element('#newUserTechName').required,true);
});

test('perfil pre mostra Squad C estrategico, sem campo tecnico operacional',()=>{
 const m=initialize();m.openCreateUser();m.element('#newUserRole').value='pre_attendance';m.syncCreateUserFields();
 assert.equal(m.element('#newUserSquad').value,'C');
 assert.match(m.element('#newUserSquad').innerHTML,/Squad C \(Estratégico\)/);
 assert.equal(m.element('#newUserSquad').disabled,true);
 assert.equal(m.element('#newUserTechName').required,false);
 assert.match(m.element('#userModalHint').textContent,/Pré-atendimento.*Squad C/);
});

test('trocar Pre para Tecnico e Administrador restaura respectivamente squad e ausencia dele',()=>{
 const m=initialize();m.openCreateUser();m.element('#newUserRole').value='pre_attendance';m.syncCreateUserFields();
 m.element('#newUserRole').value='technician';m.syncCreateUserFields();
 assert.equal(m.element('#newUserSquad').value,'D');
 assert.match(m.element('#newUserSquad').innerHTML,/Squad A/);
 assert.ok(!m.element('#newUserSquad').disabled);
 assert.equal(m.element('#newUserTechName').required,true);
 m.element('#newUserRole').value='super_admin';m.syncCreateUserFields();
 assert.equal(m.element('#newUserSquad').value,'');
 assert.equal(m.element('#newUserSquad').disabled,true);
 assert.equal(m.element('#newUserTechName').required,false);
});

test('HTML requisita novo app cache-bust sem alterar identidade da versao 2.63.0',()=>{
 assert.match(html,/src="js\/app\.js\?v=2\.63\.7-r1"/);
 assert.match(html,/id="newUserRole"[^>]*>.*value="pre_attendance"/);
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'2.63.7');
 assert.equal(pkg.assetVersion,'2.63.7-r1');
});
