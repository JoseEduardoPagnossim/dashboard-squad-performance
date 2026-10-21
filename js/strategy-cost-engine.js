(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCostEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-0.3.0-operational';
  const OPERATIONAL_CATEGORIES=Object.freeze(['technology','communication','infrastructure','third_party','training','other']);
  const ALLOCATION_METHODS=Object.freeze(['direct','headcount','attendance','manual']);
  function num(value){const n=Number(value);return Number.isFinite(n)?n:0}
  function money(value){return Math.round(Math.max(0,num(value))*100)/100}
  function clampFte(value){return Math.max(0,Math.min(1,num(value)||0))}
  function cleanCode(value){return String(value||'').trim().toUpperCase()}
  function round(value,digits=4){const factor=10**digits;return Math.round(num(value)*factor)/factor}
  function calculatePersonCost(input={}){
    const fte=clampFte(input.fte??1);
    const salary=money(input.salary),employerCharges=money(input.employerCharges??input.employer_charges),benefits=money(input.benefits),variablePay=money(input.variablePay??input.variable_pay),overtime=money(input.overtime),otherCosts=money(input.otherCosts??input.other_costs);
    const grossCost=money(salary+employerCharges+benefits+variablePay+overtime+otherCosts);
    const totalCost=money(grossCost*fte);
    return Object.freeze({fte,salary,employerCharges,benefits,variablePay,overtime,otherCosts,grossCost,totalCost});
  }
  function summarizePeopleCosts(rows=[],{squadCode='all'}={}){
    const code=cleanCode(squadCode)||'ALL',filtered=(rows||[]).filter(row=>code==='ALL'||cleanCode(row.squadCode||row.squad_code_snapshot)===code);
    const people=new Set();let fte=0,salary=0,employerCharges=0,benefits=0,variablePay=0,overtime=0,otherCosts=0,totalCost=0;
    for(const row of filtered){const calc=calculatePersonCost(row);if(row.personId||row.person_id)people.add(String(row.personId||row.person_id));fte+=calc.fte;salary+=calc.salary*calc.fte;employerCharges+=calc.employerCharges*calc.fte;benefits+=calc.benefits*calc.fte;variablePay+=calc.variablePay*calc.fte;overtime+=calc.overtime*calc.fte;otherCosts+=calc.otherCosts*calc.fte;totalCost+=calc.totalCost;}
    return Object.freeze({ruleVersion:RULE_VERSION,peopleCount:people.size,fte:round(fte,2),salary:money(salary),employerCharges:money(employerCharges),benefits:money(benefits),variablePay:money(variablePay),overtime:money(overtime),otherCosts:money(otherCosts),totalCost:money(totalCost)});
  }
  function normalizeCategory(value){const id=String(value||'').trim().toLowerCase();return OPERATIONAL_CATEGORIES.includes(id)?id:'other'}
  function normalizeAllocationMethod(value){const id=String(value||'').trim().toLowerCase();return ALLOCATION_METHODS.includes(id)?id:'manual'}
  function allocationRowsFromWeights(codes,weights,amount){
    const positive=codes.map(code=>({code,weight:Math.max(0,num(weights?.[code]))})).filter(row=>row.weight>0),total=positive.reduce((sum,row)=>sum+row.weight,0);
    if(!positive.length||total<=0)return{valid:false,error:'Base de rateio sem valores positivos.',allocations:[],percentageTotal:0,allocatedTotal:0};
    const allocations=positive.map(row=>({squadCode:row.code,percentage:round(row.weight/total*100,4),basisValue:round(row.weight,4),basisTotal:round(total,4)}));
    const percentageTotal=round(allocations.reduce((sum,row)=>sum+row.percentage,0),4),delta=round(100-percentageTotal,4);
    if(allocations.length&&Math.abs(delta)>0)allocations[allocations.length-1].percentage=round(allocations[allocations.length-1].percentage+delta,4);
    return{valid:true,error:'',allocations:allocations.map(row=>({...row,allocatedAmount:money(amount*row.percentage/100)})),percentageTotal:100,allocatedTotal:money(amount)};
  }
  function buildOperationalAllocationPlan({amount=0,method='manual',squadCodes=[],directSquad='',fteBySquad={},attendanceBySquad={},manualPercentages={}}={}){
    const value=money(amount),mode=normalizeAllocationMethod(method),codes=[...new Set((squadCodes||[]).map(cleanCode).filter(Boolean))].sort();
    if(value<=0)return{valid:false,error:'Informe um valor maior que zero.',method:mode,allocations:[],percentageTotal:0,allocatedTotal:0};
    if(!codes.length)return{valid:false,error:'Nenhum Squad disponível para rateio.',method:mode,allocations:[],percentageTotal:0,allocatedTotal:0};
    if(mode==='direct'){
      const code=cleanCode(directSquad);if(!codes.includes(code))return{valid:false,error:'Selecione um Squad válido para o custo direto.',method:mode,allocations:[],percentageTotal:0,allocatedTotal:0};
      return{valid:true,error:'',method:mode,allocations:[{squadCode:code,percentage:100,basisValue:1,basisTotal:1,allocatedAmount:value}],percentageTotal:100,allocatedTotal:value};
    }
    if(mode==='headcount')return{method:mode,...allocationRowsFromWeights(codes,fteBySquad,value)};
    if(mode==='attendance')return{method:mode,...allocationRowsFromWeights(codes,attendanceBySquad,value)};
    const allocations=codes.map(code=>({squadCode:code,percentage:round(Math.max(0,num(manualPercentages?.[code])),4),basisValue:round(Math.max(0,num(manualPercentages?.[code])),4),basisTotal:100})).filter(row=>row.percentage>0);
    const total=round(allocations.reduce((sum,row)=>sum+row.percentage,0),4);
    if(Math.abs(total-100)>.01)return{valid:false,error:`O rateio manual precisa totalizar 100%. Total atual: ${total.toFixed(2)}%.`,method:mode,allocations,percentageTotal:total,allocatedTotal:money(allocations.reduce((sum,row)=>sum+value*row.percentage/100,0))};
    if(allocations.length){const delta=round(100-total,4);allocations[allocations.length-1].percentage=round(allocations[allocations.length-1].percentage+delta,4)}
    return{valid:true,error:'',method:mode,allocations:allocations.map(row=>({...row,allocatedAmount:money(value*row.percentage/100)})),percentageTotal:100,allocatedTotal:value};
  }
  function summarizeOperationalCosts(costs=[],allocations=[],{squadCode='all'}={}){
    const code=cleanCode(squadCode)||'ALL',byCost=new Map();for(const row of allocations||[]){const key=String(row.operationalCostId||row.operational_cost_id||'');if(!key)continue;const list=byCost.get(key)||[];list.push(row);byCost.set(key,list)}
    let operationalCost=0,directCost=0,sharedCost=0,invalidCostCount=0;const categories=Object.fromEntries(OPERATIONAL_CATEGORIES.map(id=>[id,0]));const included=new Set();
    for(const cost of costs||[]){const id=String(cost.id||''),amount=money(cost.amount),method=normalizeAllocationMethod(cost.allocationMethod||cost.allocation_method),rows=byCost.get(id)||[],totalPct=round(rows.reduce((sum,row)=>sum+Math.max(0,num(row.percentage)),0),4);if(Math.abs(totalPct-100)>.01){invalidCostCount++;continue}let value=0;for(const row of rows){if(code==='ALL'||cleanCode(row.squadCode||row.squad_code)===code)value+=amount*Math.max(0,num(row.percentage))/100}value=money(value);if(value<=0)continue;included.add(id);operationalCost+=value;if(method==='direct')directCost+=value;else sharedCost+=value;categories[normalizeCategory(cost.category)]+=value;}
    Object.keys(categories).forEach(key=>{categories[key]=money(categories[key])});
    return Object.freeze({ruleVersion:RULE_VERSION,costCount:included.size,operationalCost:money(operationalCost),directCost:money(directCost),sharedCost:money(sharedCost),invalidCostCount,categories:Object.freeze(categories)});
  }
  function emptySummary({competence='',squadCode='all'}={}){
    return Object.freeze({ruleVersion:RULE_VERSION,competence:String(competence||''),squadCode:String(squadCode||'all'),status:'costs',peopleCount:0,fte:0,salary:0,employerCharges:0,benefits:0,variablePay:0,overtime:0,otherCosts:0,peopleCost:0,operationalCost:0,directOperationalCost:0,sharedOperationalCost:0,operationalCostCount:0,invalidOperationalCostCount:0,operationalCategories:Object.freeze(Object.fromEntries(OPERATIONAL_CATEGORIES.map(id=>[id,0]))),totalCost:0,costPerAttendance:null});
  }
  function mergePeopleSummary(base={},meta={}){
    const total=money(base.totalCost??base.total_cost);
    return Object.freeze({...emptySummary(meta),peopleCount:Math.max(0,num(base.peopleCount??base.people_count)),fte:Math.max(0,num(base.fte)),salary:money(base.salary),employerCharges:money(base.employerCharges??base.employer_charges),benefits:money(base.benefits),variablePay:money(base.variablePay??base.variable_pay),overtime:money(base.overtime),otherCosts:money(base.otherCosts??base.other_costs),peopleCost:total,totalCost:total});
  }
  function mergeFinancialSummary(peopleBase={},operationalBase={},meta={}){
    const people=mergePeopleSummary(peopleBase,meta),opCost=money(operationalBase.operationalCost??operationalBase.operational_cost??operationalBase.totalCost??operationalBase.total_cost),categories=operationalBase.categories||operationalBase.operationalCategories||operationalBase.category_breakdown||{};
    return Object.freeze({...people,operationalCost:opCost,directOperationalCost:money(operationalBase.directCost??operationalBase.direct_cost),sharedOperationalCost:money(operationalBase.sharedCost??operationalBase.shared_cost),operationalCostCount:Math.max(0,num(operationalBase.costCount??operationalBase.cost_count)),invalidOperationalCostCount:Math.max(0,num(operationalBase.invalidCostCount??operationalBase.invalid_cost_count)),operationalCategories:Object.freeze(Object.fromEntries(OPERATIONAL_CATEGORIES.map(id=>[id,money(categories?.[id])]))),totalCost:money(people.peopleCost+opCost)});
  }
  return{RULE_VERSION,OPERATIONAL_CATEGORIES,ALLOCATION_METHODS,calculatePersonCost,summarizePeopleCosts,normalizeCategory,normalizeAllocationMethod,buildOperationalAllocationPlan,summarizeOperationalCosts,emptySummary,mergePeopleSummary,mergeFinancialSummary};
});
