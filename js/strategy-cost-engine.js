(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCostEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-0.1.0-foundation';
  function emptySummary({competence='',squadCode='all'}={}){
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      competence:String(competence||''),
      squadCode:String(squadCode||'all'),
      status:'foundation',
      peopleCost:null,
      operationalCost:null,
      totalCost:null,
      costPerAttendance:null
    });
  }
  return{RULE_VERSION,emptySummary};
});
