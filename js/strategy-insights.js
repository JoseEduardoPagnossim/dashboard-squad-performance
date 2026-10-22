(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyInsights=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function foundationInsights(){return Object.freeze([Object.freeze({code:'STRATEGY_FINANCIAL_ENGINE_READY',tone:'info',title:'Motor financeiro consolidado',text:'Custos de pessoas e custos operacionais rateados são consolidados por competência e Squad, mantendo o operacional somente leitura.'})]);}
  function financialInsights(summary={},squads=[]){const out=[];if(Number(summary.unallocatedOperationalCost||0)>0)out.push(Object.freeze({code:'UNALLOCATED_OPERATIONAL_COST',tone:'warning',title:'Há custo operacional sem rateio',text:`Existe valor operacional ainda sem base de rateio. Revise FTE/atendimentos da competência antes de usar comparações por Squad.`}));const valid=(squads||[]).filter(r=>Number(r.attendance)>0&&Number.isFinite(Number(r.costPerAttendance)));if(valid.length>=2){const sorted=[...valid].sort((a,b)=>a.costPerAttendance-b.costPerAttendance),low=sorted[0],high=sorted.at(-1);if(high.costPerAttendance>low.costPerAttendance*1.15)out.push(Object.freeze({code:'SQUAD_COST_SPREAD',tone:'info',title:'Diferença relevante de custo unitário entre Squads',text:`Squad ${high.squadCode} está acima do Squad ${low.squadCode} em custo por atendimento. Use o indicador como ponto de investigação, não como ranking isolado.`}));}return Object.freeze(out);}
  return{foundationInsights,financialInsights};
});
