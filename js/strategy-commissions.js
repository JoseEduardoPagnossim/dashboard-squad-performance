(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoftenStrategyCommissions=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
function cents(v){if(typeof v!=='number'||!Number.isFinite(v)||v<0)return null;return Math.round(v*100);}
function calculate(gross,rule){const base=cents(gross);if(base===null||!rule||typeof rule!=='object')return {status:'pending_rule',amount:null};
 const type=rule.type;let result;
 if(type==='full')result=base;
 else if(type==='percentage'){const p=Number(rule.percentage);if(rule.percentage===null||rule.percentage===undefined||!Number.isFinite(p)||p<0||p>100)return{status:'pending_rule',amount:null};result=Math.round(base*p/100);}
 else if(type==='net_after_third_party'){const cost=cents(Number(rule.third_party_cost));if(rule.third_party_cost===null||rule.third_party_cost===undefined||cost===null)return{status:'pending_cost',amount:null};result=Math.max(0,base-cost);}
 else if(type==='fixed'){const fixed=cents(Number(rule.fixed_amount));if(rule.fixed_amount===null||rule.fixed_amount===undefined||fixed===null)return{status:'pending_rule',amount:null};result=fixed;}
 else return{status:'pending_rule',amount:null};
 return{status:'calculated',amount:result/100};}
function summarize(rows){const group=new Map();for(const r of rows){const key=JSON.stringify([r.person_id,r.competence,r.squad_code]);if(!group.has(key))group.set(key,{personId:r.person_id,competence:r.competence,squad:r.squad_code,sales:0,commission:0,pending:0});const x=group.get(key);x.sales++;if(r.status==='calculated')x.commission+=Math.round(r.commission_amount*100);else x.pending++;}return [...group.values()].map(x=>({...x,commission:Math.round(x.commission)/100}));}
return Object.freeze({calculate,summarize});});
