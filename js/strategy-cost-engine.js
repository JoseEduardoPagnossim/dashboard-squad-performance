(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCostEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-0.5.0-executive';
  function num(value){const n=Number(value);return Number.isFinite(n)?n:0}
  function money(value){return Math.round(Math.max(0,num(value))*100)/100}
  function clampFte(value){return Math.max(0,Math.min(1,num(value)||0))}
  function cleanCode(value){return String(value||'').trim().toUpperCase()}
  function calculatePersonCost(input={}){
    const fte=clampFte(input.fte??1);
    const salary=money(input.salary),employerCharges=money(input.employerCharges??input.employer_charges),benefits=money(input.benefits),variablePay=money(input.variablePay??input.variable_pay),overtime=money(input.overtime),otherCosts=money(input.otherCosts??input.other_costs);
    const grossCost=money(salary+employerCharges+benefits+variablePay+overtime+otherCosts);
    const totalCost=money(grossCost*fte);
    return Object.freeze({fte,salary,employerCharges,benefits,variablePay,overtime,otherCosts,grossCost,totalCost});
  }
  function summarizePeopleCosts(rows=[],{squadCode='all'}={}){
    const code=cleanCode(squadCode||'ALL'),filtered=(rows||[]).filter(row=>code==='ALL'||cleanCode(row.squadCode||row.squad_code_snapshot)===code);
    const people=new Set();let fte=0,salary=0,employerCharges=0,benefits=0,variablePay=0,overtime=0,otherCosts=0,totalCost=0;
    for(const row of filtered){const calc=calculatePersonCost(row);if(row.personId||row.person_id)people.add(String(row.personId||row.person_id));fte+=calc.fte;salary+=calc.salary*calc.fte;employerCharges+=calc.employerCharges*calc.fte;benefits+=calc.benefits*calc.fte;variablePay+=calc.variablePay*calc.fte;overtime+=calc.overtime*calc.fte;otherCosts+=calc.otherCosts*calc.fte;totalCost+=calc.totalCost;}
    return Object.freeze({ruleVersion:RULE_VERSION,peopleCount:people.size,fte:Math.round(fte*100)/100,salary:money(salary),employerCharges:money(employerCharges),benefits:money(benefits),variablePay:money(variablePay),overtime:money(overtime),otherCosts:money(otherCosts),totalCost:money(totalCost)});
  }
  function allocateCents(amount,weights={}){
    const totalCents=Math.round(money(amount)*100),entries=Object.entries(weights||{}).map(([code,value])=>[cleanCode(code),Math.max(0,num(value))]).filter(([code,value])=>code&&value>0),basis=entries.reduce((s,[,v])=>s+v,0);
    if(totalCents<=0||basis<=0)return{allocations:{},percentages:{},basis};
    const raw=entries.map(([code,value])=>{const exact=totalCents*(value/basis),floor=Math.floor(exact);return{code,value,exact,floor,frac:exact-floor}}),used=raw.reduce((s,r)=>s+r.floor,0),remaining=totalCents-used;
    raw.sort((a,b)=>b.frac-a.frac||a.code.localeCompare(b.code));for(let i=0;i<remaining;i++)raw[i%raw.length].floor++;
    raw.sort((a,b)=>a.code.localeCompare(b.code));const allocations={},percentages={};for(const row of raw){allocations[row.code]=row.floor/100;percentages[row.code]=row.value/basis;}
    return{allocations,percentages,basis};
  }
  function calculateOperationalAllocations(cost={},basis={}){
    const amount=money(cost.amount),scope=String(cost.scopeType||cost.scope_type||'organization').toLowerCase(),method=String(cost.allocationMethod||cost.allocation_method||'fte').toLowerCase(),directCode=cleanCode(cost.squadCode||cost.squad_code);
    if(amount<=0)return Object.freeze([]);
    if(scope==='squad'||method==='direct'){
      if(!directCode)return Object.freeze([{squadCode:'UNALLOCATED',percentage:1,basisValue:0,allocatedAmount:amount,allocationMethod:'direct',unallocated:true}]);
      return Object.freeze([Object.freeze({squadCode:directCode,percentage:1,basisValue:1,allocatedAmount:amount,allocationMethod:'direct',unallocated:false})]);
    }
    let weights={};
    if(method==='attendance')weights=basis.attendanceBySquad||{};
    else if(method==='manual')weights=basis.manualBySquad||{};
    else weights=basis.fteBySquad||{};
    const distributed=allocateCents(amount,weights),codes=Object.keys(distributed.allocations);
    if(!codes.length)return Object.freeze([Object.freeze({squadCode:'UNALLOCATED',percentage:1,basisValue:0,allocatedAmount:amount,allocationMethod:method,unallocated:true})]);
    return Object.freeze(codes.map(code=>Object.freeze({squadCode:code,percentage:distributed.percentages[code]||0,basisValue:Math.max(0,num(weights[code])),allocatedAmount:money(distributed.allocations[code]),allocationMethod:method,unallocated:false})));
  }
  function summarizeOperationalCosts(costs=[],allocations=[],{squadCode='all'}={}){
    const code=cleanCode(squadCode||'ALL');
    if(code==='ALL')return Object.freeze({operationalCost:money((costs||[]).reduce((s,row)=>s+money(row.amount),0)),unallocatedCost:money((allocations||[]).filter(a=>cleanCode(a.squadCode||a.squad_code)==='UNALLOCATED').reduce((s,a)=>s+money(a.allocatedAmount??a.allocated_amount),0))});
    return Object.freeze({operationalCost:money((allocations||[]).filter(a=>cleanCode(a.squadCode||a.squad_code)===code).reduce((s,a)=>s+money(a.allocatedAmount??a.allocated_amount),0)),unallocatedCost:0});
  }
  function emptySummary({competence='',squadCode='all'}={}){
    return Object.freeze({ruleVersion:RULE_VERSION,competence:String(competence||''),squadCode:String(squadCode||'all'),status:'financial-consolidated',peopleCount:0,fte:0,salary:0,employerCharges:0,benefits:0,variablePay:0,overtime:0,otherCosts:0,peopleCost:0,operationalCost:0,unallocatedOperationalCost:0,totalCost:0,attendance:0,costPerAttendance:null,attendancePerFte:null});
  }
  function mergeFinancialSummary(base={},meta={}){
    const peopleCost=money(base.peopleCost??base.people_cost??base.totalPeopleCost??base.people_total??base.total_cost_people??base.totalCostPeople??base.total_cost??0),operationalCost=money(base.operationalCost??base.operational_cost),explicitTotal=Number(base.totalCost??base.total_cost),totalCost=Number.isFinite(explicitTotal)&&('operationalCost' in base||'operational_cost' in base||'peopleCost' in base||'people_cost' in base)?money(explicitTotal):money(peopleCost+operationalCost),attendance=Math.max(0,num(base.attendance));
    const fte=Math.max(0,num(base.fte));
    return Object.freeze({...emptySummary(meta),peopleCount:Math.max(0,num(base.peopleCount??base.people_count)),fte,salary:money(base.salary),employerCharges:money(base.employerCharges??base.employer_charges),benefits:money(base.benefits),variablePay:money(base.variablePay??base.variable_pay),overtime:money(base.overtime),otherCosts:money(base.otherCosts??base.other_costs),peopleCost,operationalCost,unallocatedOperationalCost:money(base.unallocatedOperationalCost??base.unallocated_operational_cost),totalCost,attendance,costPerAttendance:attendance>0?money(totalCost/attendance):null,attendancePerFte:fte>0?Math.round((attendance/fte)*100)/100:null});
  }
  function mergePeopleSummary(base={},meta={}){return mergeFinancialSummary({...base,peopleCost:base.peopleCost??base.totalCost??base.total_cost,operationalCost:0,totalCost:base.peopleCost??base.totalCost??base.total_cost},meta)}

  function changeRatio(current,previous){const prev=num(previous),cur=num(current);return prev>0?(cur-prev)/prev:null}
  function averageRows(rows=[]){
    const valid=(rows||[]).filter(Boolean);if(!valid.length)return null;
    const keys=['peopleCount','fte','salary','employerCharges','benefits','variablePay','overtime','otherCosts','peopleCost','operationalCost','unallocatedOperationalCost','totalCost','attendance','evaluationRate','costPerAttendance','attendancePerFte'];
    const out={};for(const key of keys){const vals=valid.map(r=>Number(r[key])).filter(Number.isFinite);out[key]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;}return out;
  }
  function comparisonWindow(history=[],currentCompetence='',mode='previous'){
    const rows=[...(history||[])].filter(r=>r&&r.competence).sort((a,b)=>String(a.competence).localeCompare(String(b.competence))),idx=rows.findIndex(r=>r.competence===currentCompetence);if(idx<0)return{current:null,baseline:null,baselineRows:[],label:'Sem base de comparação'};
    const current=rows[idx],count=mode==='12m'?12:mode==='6m'?6:mode==='3m'?3:1,baselineRows=rows.slice(Math.max(0,idx-count),idx),baseline=mode==='previous'?(baselineRows.at(-1)||null):averageRows(baselineRows),label=mode==='previous'?'Mês anterior':`Média das ${baselineRows.length} competência(s) anteriores`;
    return{current,baseline,baselineRows,label};
  }
  function buildExecutiveAnalysis({history=[],currentCompetence='',comparison='previous',qualityTarget=null}={}){
    const window=comparisonWindow(history,currentCompetence,comparison),current=window.current,baseline=window.baseline;if(!current)return Object.freeze({available:false,window,spread:null,qualityStatus:'unknown'});
    const costChange=baseline?changeRatio(current.totalCost,baseline.totalCost):null,attendanceChange=baseline?changeRatio(current.attendance,baseline.attendance):null,costPerAttendanceChange=baseline?changeRatio(current.costPerAttendance,baseline.costPerAttendance):null,fteChange=baseline?changeRatio(current.fte,baseline.fte):null;
    const currentEval=Number(current.evaluationRate),baseEval=baseline?Number(baseline.evaluationRate):NaN,evaluationDelta=Number.isFinite(currentEval)&&Number.isFinite(baseEval)?currentEval-baseEval:null,target=Number(qualityTarget),qualityStatus=Number.isFinite(currentEval)&&Number.isFinite(target)?(currentEval>=target?'preserved':'below_target'):(evaluationDelta==null?'unknown':evaluationDelta>=-.01?'preserved':'declining'),spread=attendanceChange!=null&&costChange!=null?attendanceChange-costChange:null;
    return Object.freeze({available:true,window,costChange,attendanceChange,costPerAttendanceChange,fteChange,evaluationDelta,spread,qualityTarget:Number.isFinite(target)?target:null,qualityStatus});
  }

  function consolidateSquads({squadCodes=[],peopleCosts=[],operationalCosts=[],allocations=[],operationalStats={}}={}){
    const codes=[...new Set([...(squadCodes||[]).map(cleanCode),...(peopleCosts||[]).map(r=>cleanCode(r.squadCode||r.squad_code_snapshot)),...(allocations||[]).map(r=>cleanCode(r.squadCode||r.squad_code))].filter(c=>c&&c!=='UNALLOCATED'))].sort();
    return Object.freeze(codes.map(code=>{const people=summarizePeopleCosts(peopleCosts,{squadCode:code}),ops=summarizeOperationalCosts(operationalCosts,allocations,{squadCode:code}),stats=operationalStats?.[code]||{},attendance=Math.max(0,num(stats.attendance)),totalCost=money(people.totalCost+ops.operationalCost);return Object.freeze({squadCode:code,peopleCount:people.peopleCount,fte:people.fte,peopleCost:people.totalCost,operationalCost:ops.operationalCost,totalCost,attendance,evaluationRate:Number.isFinite(Number(stats.evaluationRate))?Number(stats.evaluationRate):null,costPerAttendance:attendance>0?money(totalCost/attendance):null,attendancePerFte:people.fte>0?Math.round((attendance/people.fte)*100)/100:null});}));
  }
  return{RULE_VERSION,calculatePersonCost,summarizePeopleCosts,allocateCents,calculateOperationalAllocations,summarizeOperationalCosts,emptySummary,mergePeopleSummary,mergeFinancialSummary,changeRatio,averageRows,comparisonWindow,buildExecutiveAnalysis,consolidateSquads};
});
