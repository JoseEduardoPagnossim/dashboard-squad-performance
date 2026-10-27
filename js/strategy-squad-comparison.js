(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategySquadComparison=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='PS-0.6.0-squad-comparison';
  const valid=(value)=>value!=null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
  const ratio=(a,b)=>valid(a)!=null&&valid(b)!=null&&Number(b)>0?Number(a)/Number(b):null;
  function build({squads=[],result={},scope='all',names={}}={}){
    const results=new Map((result.rows||[]).map(r=>[String(r.squadCode||r.squad_code||'').toUpperCase(),r]));
    const rows=squads.filter(r=>r.squadCode&&r.squadCode!=='ALL'&&(scope==='all'||r.squadCode===scope)).map(r=>{
      const econ=results.get(r.squadCode)||{};
      const attendance=valid(r.attendance),resolutions=valid(r.resolutions),totalCost=valid(r.totalCost),fte=r.availabilityComplete?valid(r.availableFte):null;
      const used=r.usedCapacityComplete?valid(r.usedCapacityVolume):null;
      const direct=Number(econ.directRevenue||0),influenced=Number(econ.influencedRevenue||0),protectedRevenue=Number(econ.protectedRevenue||0);
      return Object.freeze({code:r.squadCode,name:names[r.squadCode]||r.squadCode,totalCost,attendance,resolutions,fte,nominalFte:r.fte,costPerAttendance:ratio(totalCost,attendance),costPerResolution:ratio(totalCost,resolutions),attendancePerFte:ratio(attendance,fte),resolutionsPerFte:ratio(resolutions,fte),fcr:ratio(resolutions,attendance),utilization:ratio(used,fte),capacityUsed:used,directRevenue:result.sourceAvailable?direct:null,influencedRevenue:result.sourceAvailable?influenced:null,protectedRevenue:result.sourceAvailable?protectedRevenue:null,directNet:result.sourceAvailable&&totalCost!=null?direct-totalCost:null,directRoi:result.sourceAvailable&&totalCost>0?(direct-totalCost)/totalCost:null,availabilityComplete:!!r.availabilityComplete,usedCapacityComplete:!!r.usedCapacityComplete});
    }).sort((a,b)=>a.code.localeCompare(b.code,'pt-BR'));
    return Object.freeze({ruleVersion:RULE_VERSION,rows:Object.freeze(rows),scope});
  }
  return{RULE_VERSION,ratio,build};
});
