(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyInsights=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function foundationInsights(){
    return Object.freeze([
      Object.freeze({code:'STRATEGY_FOUNDATION_READY',tone:'info',title:'Fundação estratégica ativa',text:'A nova área está isolada do operacional e pronta para receber custos por competência nas próximas etapas.'})
    ]);
  }
  return{foundationInsights};
});
