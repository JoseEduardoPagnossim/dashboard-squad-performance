(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyInsights=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function foundationInsights(){
    return Object.freeze([
      Object.freeze({code:'STRATEGY_PEOPLE_COSTS_READY',tone:'info',title:'Custos estratégicos separados do operacional',text:'Pessoas e custos operacionais são consolidados por competência e Squad sem alterar atendimentos, qualidade ou bonificação; os percentuais de rateio ficam fotografados para auditoria.'})
    ]);
  }
  return{foundationInsights};
});
