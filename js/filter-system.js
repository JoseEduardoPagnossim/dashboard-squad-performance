(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SoftenFilterSystem=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const EMPTY=Object.freeze({squad:false,competence:false,period:false,technician:false});
  const BASE_MATRIX=Object.freeze({
    home:{squad:true,competence:true,period:false,technician:false},
    individual:{squad:true,competence:true,period:true,technician:true},
    team:{squad:true,competence:true,period:true,technician:false},
    indicators:{squad:true,competence:false,period:true,technician:false},
    presentation:{squad:true,competence:false,period:true,technician:false},
    feedbacks:{squad:true,competence:true,period:false,technician:false},
    users:EMPTY,
    audit:EMPTY,
    alerts:EMPTY,
    profile:EMPTY,
    'my-feedbacks':EMPTY,
    help:EMPTY
  });
  const ADMIN_MATRIX=Object.freeze({
    operation:{squad:true,competence:true,period:false,technician:false},
    finance:{squad:true,competence:true,period:false,technician:false},
    costs:EMPTY,
    appearance:{squad:true,competence:false,period:false,technician:false}
  });
  const SETTINGS_MATRIX=Object.freeze({
    operation:{squad:true,competence:false,period:false,technician:false},
    finance:{squad:true,competence:false,period:false,technician:false},
    appearance:{squad:true,competence:false,period:false,technician:false},
    presentation:{squad:true,competence:false,period:false,technician:false},
    personalization:EMPTY,
    access:EMPTY,
    performance:EMPTY,
    all:{squad:true,competence:false,period:false,technician:false}
  });

  function cloneRule(rule){return{...EMPTY,...(rule||EMPTY)}}
  function contextRule({view='home',adminSection='',settingsModule='all',indicatorSection='performance'}={}){
    if(view==='admin')return cloneRule(ADMIN_MATRIX[adminSection]);
    if(view==='settings')return cloneRule(SETTINGS_MATRIX[settingsModule]||SETTINGS_MATRIX.all);
    const rule=cloneRule(BASE_MATRIX[view]);
    if(view==='indicators'&&indicatorSection==='financial-impact')return cloneRule(EMPTY);
    if(view==='indicators'&&indicatorSection==='business-days')return cloneRule({squad:true});
    return rule;
  }
  function visibility(context={}){
    const rule=contextRule(context);
    if(!context.isSuperAdmin)rule.squad=false;
    if(context.isTechnician){rule.squad=false;rule.technician=false;}
    if(String(context.squadCode||'').toLowerCase()==='all'){
      rule.technician=false;
      if(context.view==='team')rule.competence=false;
    }
    return rule;
  }
  function visibleKeys(context={}){const rule=visibility(context);return Object.keys(EMPTY).filter(key=>rule[key]);}
  function controlKeys(context={}){
    const rule=visibility(context),keys=[];
    if(rule.squad)keys.push('squad');
    // V2.49.1: quando há período, competência passa a morar dentro do mesmo
    // controle visual "Período de análise" e não conta como um filtro separado.
    if(rule.period)keys.push('analysis');
    else if(rule.competence)keys.push('competence');
    if(rule.technician)keys.push('technician');
    return keys;
  }
  function activeCount(context={}){return controlKeys(context).length;}

  return{BASE_MATRIX,ADMIN_MATRIX,SETTINGS_MATRIX,contextRule,visibility,visibleKeys,controlKeys,activeCount};
});
