(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCostEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-0.2.0-people';
  function num(value){const n=Number(value);return Number.isFinite(n)?n:0}
  function money(value){return Math.round(Math.max(0,num(value))*100)/100}
  function clampFte(value){return Math.max(0,Math.min(1,num(value)||0))}
  function calculatePersonCost(input={}){
    const fte=clampFte(input.fte??1);
    const salary=money(input.salary),employerCharges=money(input.employerCharges??input.employer_charges),benefits=money(input.benefits),variablePay=money(input.variablePay??input.variable_pay),overtime=money(input.overtime),otherCosts=money(input.otherCosts??input.other_costs);
    const grossCost=money(salary+employerCharges+benefits+variablePay+overtime+otherCosts);
    const totalCost=money(grossCost*fte);
    return Object.freeze({fte,salary,employerCharges,benefits,variablePay,overtime,otherCosts,grossCost,totalCost});
  }
  function summarizePeopleCosts(rows=[],{squadCode='all'}={}){
    const code=String(squadCode||'all').toUpperCase(),filtered=(rows||[]).filter(row=>code==='ALL'||code==='ALL'.toLowerCase()||String(row.squadCode||row.squad_code_snapshot||'').toUpperCase()===code);
    const people=new Set();let fte=0,salary=0,employerCharges=0,benefits=0,variablePay=0,overtime=0,otherCosts=0,totalCost=0;
    for(const row of filtered){const calc=calculatePersonCost(row);if(row.personId||row.person_id)people.add(String(row.personId||row.person_id));fte+=calc.fte;salary+=calc.salary*calc.fte;employerCharges+=calc.employerCharges*calc.fte;benefits+=calc.benefits*calc.fte;variablePay+=calc.variablePay*calc.fte;overtime+=calc.overtime*calc.fte;otherCosts+=calc.otherCosts*calc.fte;totalCost+=calc.totalCost;}
    return Object.freeze({ruleVersion:RULE_VERSION,peopleCount:people.size,fte:Math.round(fte*100)/100,salary:money(salary),employerCharges:money(employerCharges),benefits:money(benefits),variablePay:money(variablePay),overtime:money(overtime),otherCosts:money(otherCosts),totalCost:money(totalCost)});
  }
  function emptySummary({competence='',squadCode='all'}={}){
    return Object.freeze({ruleVersion:RULE_VERSION,competence:String(competence||''),squadCode:String(squadCode||'all'),status:'people-costs',peopleCount:0,fte:0,salary:0,employerCharges:0,benefits:0,variablePay:0,overtime:0,otherCosts:0,peopleCost:0,operationalCost:null,totalCost:0,costPerAttendance:null});
  }
  function mergePeopleSummary(base={},meta={}){
    const total=money(base.totalCost??base.total_cost);
    return Object.freeze({...emptySummary(meta),peopleCount:Math.max(0,num(base.peopleCount??base.people_count)),fte:Math.max(0,num(base.fte)),salary:money(base.salary),employerCharges:money(base.employerCharges??base.employer_charges),benefits:money(base.benefits),variablePay:money(base.variablePay??base.variable_pay),overtime:money(base.overtime),otherCosts:money(base.otherCosts??base.other_costs),peopleCost:total,totalCost:total});
  }
  return{RULE_VERSION,calculatePersonCost,summarizePeopleCosts,emptySummary,mergePeopleSummary};
});
