(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyAutomation=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const SOURCE_DEFINITIONS=Object.freeze([
    Object.freeze({key:'contracted_modules_csv',label:'Anotação de venda / Produtos Contratados',origin:'csv',generatesMrr:true}),
    Object.freeze({key:'merchandise_sales_csv',label:'Venda de Mercadorias',origin:'csv',generatesMrr:false}),
    Object.freeze({key:'manual',label:'Lançamentos manuais',origin:'manual',generatesMrr:null})
  ]);
  function normalizeName(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function sourceByKey(key){return SOURCE_DEFINITIONS.find(s=>s.key===String(key||''))||null}
  function normalizeSquad(code){const value=String(code||'').trim().toUpperCase();return /^[A-E]$/.test(value)?value:null}
  function isPreAttendance({functionalTeam,role,squadCode}={}){return role==='pre_attendance'||functionalTeam==='pre_attendance'||(normalizeSquad(squadCode)==='C'&&role!=='technician')}
  function createSourcePayload(organizationId,userId){if(!organizationId||!userId)throw new Error('Organizacao e usuario obrigatorios.');return SOURCE_DEFINITIONS.map(s=>Object.freeze({organization_id:organizationId,created_by:userId,source_key:s.key,label:s.label,origin:s.origin,generates_mrr:s.generatesMrr===true}))}
  function validateIdentityLink({profile,person}={}){
    if(!profile||!person)throw new Error('Conta e pessoa obrigatorias.');
    if(profile.role!=='pre_attendance'||profile.active!==true)throw new Error('Conta inativa ou perfil incorreto.');
    if(profile.organizationId!==person.organizationId)throw new Error('Organizacoes diferentes.');
    if(person.userId)throw new Error('Pessoa ja vinculada.');
    return Object.freeze({userId:profile.userId,personId:person.id,functionalTeam:'pre_attendance',squadCode:'C'});
  }
  return Object.freeze({SOURCE_DEFINITIONS,sourceByKey,normalizeName,normalizeSquad,isPreAttendance,createSourcePayload,validateIdentityLink});
});
