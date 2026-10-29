(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategySellerReconciliation=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const SOURCES=Object.freeze(['contracted_modules_csv','merchandise_sales_csv']);
  function normalizeName(value){return String(value??'').normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
  function squadCode(value){const s=String(value??'').trim().toUpperCase();return /^[A-E]$/.test(s)?s:null;}
  function roleFor(squad){return squad==='C'?'pre_attendance':'technician';}
  function identityList(people,profiles){
    const pmap=new Map((profiles||[]).filter(p=>p?.user_id&&p.active===true).map(p=>[String(p.user_id),p]));
    return (people||[]).filter(p=>p?.id&&p.user_id&&p.active!==false).map(p=>{
      const profile=pmap.get(String(p.user_id)),squad=squadCode(p.default_squad_code);
      if(!profile||!squad||String(profile.organization_id)!==String(p.organization_id)||profile.role!==roleFor(squad))return null;
      if(squad==='C'&&p.functional_team!=='pre_attendance')return null;
      if(squad!=='C'&&p.functional_team==='pre_attendance')return null;
      return Object.freeze({personId:String(p.id),userId:String(p.user_id),name:String(p.name||profile.full_name||''),profileName:String(profile.full_name||''),squad,role:profile.role,organizationId:String(p.organization_id)});
    }).filter(Boolean);
  }
  function reconcile({sourceKey,parsed,mapping,people=[],profiles=[],aliases=[]}={}){
    if(!SOURCES.includes(sourceKey))throw new Error('Origem comercial inválida.');
    const csv=typeof require==='function'?require('./strategy-csv-importer'):globalThis.SoftenStrategyCsvImporter;
    if(!csv)throw new Error('Motor CSV indisponível.');
    const clean=csv.validateMapping(sourceKey,parsed.headers,mapping),identities=identityList(people,profiles);
    const si=parsed.headers.indexOf(clean.seller),gi=parsed.headers.indexOf(clean.squad);
    const grouped=new Map(),summary={matched:0,pending:0,ambiguous:0,eligible:0,ignoredNoGroup:0,ignoredNoSeller:0,groups:0};
    for(const row of parsed.rows){
      const squad=squadCode(row[gi]);if(!squad){summary.ignoredNoGroup++;continue;}
      const name=String(row[si]??'').trim(),normalized=normalizeName(name);if(!normalized){summary.ignoredNoSeller++;continue;}
      const key=JSON.stringify([sourceKey,squad,normalized]);if(!grouped.has(key))grouped.set(key,{key,sourceKey,squad,normalized,name,count:0});grouped.get(key).count++;
    }
    const groups=[];
    for(const group of grouped.values()){
      summary.eligible+=group.count;
      const matchingAliases=aliases.filter(a=>a&&a.source_key===sourceKey&&a.squad_code===group.squad&&a.alias_normalized===group.normalized);
      const candidates=matchingAliases.length?identities.filter(i=>matchingAliases.some(a=>String(a.person_id)===i.personId)):identities.filter(i=>i.squad===group.squad&&(normalizeName(i.name)===group.normalized||normalizeName(i.profileName)===group.normalized));
      const matches=candidates.filter(i=>i.squad===group.squad),status=matchingAliases.length&&matches.length!==1?'pending':matches.length===1?'matched':matches.length>1?'ambiguous':'pending';
      summary[status]+=group.count;
      groups.push(Object.freeze({...group,status,method:status==='matched'?(matchingAliases.length?'alias':'nome exato'):null,personId:status==='matched'?matches[0].personId:null,userId:status==='matched'?matches[0].userId:null,personName:status==='matched'?matches[0].name:null}));
    }
    summary.groups=groups.length;groups.sort((a,b)=>a.squad.localeCompare(b.squad)||a.name.localeCompare(b.name,'pt-BR'));
    return Object.freeze({summary:Object.freeze(summary),groups:Object.freeze(groups),identities:Object.freeze(identities),sourceKey,official:false,persisted:false});
  }
  function aliasPayload({organizationId,sourceKey,group,personId,alias}={}){
    const squad=squadCode(group),name=String(alias??'').trim(),normalized=normalizeName(name);
    if(!organizationId||!personId||!SOURCES.includes(sourceKey)||!squad||name.length<2||name.length>160||normalized.length<2||normalized.length>160)throw new Error('Informe origem, nome, Squad e pessoa válidos.');
    return Object.freeze({p_source_key:sourceKey,p_squad_code:squad,p_alias_name:name,p_alias_normalized:normalized,p_person_id:personId});
  }
  return Object.freeze({SOURCES,normalizeName,squadCode,roleFor,identityList,reconcile,aliasPayload});
});
