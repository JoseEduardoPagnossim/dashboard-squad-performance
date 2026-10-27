(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoftenStrategyProductHistory=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const RULE_VERSION='PS-1.0.0-history';
const num=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
function normalize(row){const data=row.snapshot||{};const squads=Array.isArray(data.squads)?data.squads:[];return{competence:String(row.competence||data.competence||''),revision:Number(row.revision||0),createdAt:row.created_at||null,financialRevision:Number(row.financial_snapshot_revision||0),squads:squads.map(s=>({code:String(s.code||''),data:s.data||{}})),ruleVersion:row.rule_version||null};}
function summarize(rows){return(rows||[]).map(normalize).sort((a,b)=>a.competence.localeCompare(b.competence)||a.revision-b.revision);}
function evolution(rows){const latest=new Map();for(const row of summarize(rows))latest.set(row.competence,row);return[...latest.values()].sort((a,b)=>a.competence.localeCompare(b.competence)).map((row,index,all)=>({competence:row.competence,revision:row.revision,squadCount:row.squads.length,financialRevision:row.financialRevision,previous:all[index-1]?.competence||null}));}
function validate(rows){const seen=new Set();const warnings=[];for(const row of summarize(rows)){const k=row.competence+':'+row.revision;if(seen.has(k))warnings.push('Revisão duplicada: '+k);seen.add(k);if(!row.financialRevision)warnings.push('Revisão financeira ausente: '+k);if(!row.squads.length)warnings.push('Sem Squad registrado: '+k);}return{ok:warnings.length===0,warnings};}
return{RULE_VERSION,normalize,summarize,evolution,validate,num};});
