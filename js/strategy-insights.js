(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyInsights=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function foundationInsights(){
    return Object.freeze([
      Object.freeze({code:'STRATEGY_PEOPLE_COSTS_READY',tone:'info',title:'Custos pessoais separados do operacional',text:'A competência financeira preserva salário, encargos, benefícios, FTE e demais custos pessoais sem alterar atendimentos, qualidade ou bonificação.'})
    ]);
  }
  return{foundationInsights};
});
