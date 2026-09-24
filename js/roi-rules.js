(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenRoiRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const safe=value=>Number.isFinite(Number(value))?Number(value):0;
  const round=(value,decimals=2)=>{const p=10**decimals;return Math.round((safe(value)+Number.EPSILON)*p)/p;};

  function calculateMonthlyRoi(input={}){
    const cost=Math.max(0,safe(input.cost));
    const attendances=Math.max(0,safe(input.attendances));
    const clients=Math.max(0,safe(input.clients));
    const ticket=Math.max(0,safe(input.ticket));
    const churnReference=Math.max(0,safe(input.churnReference));
    const churnCurrent=Math.max(0,safe(input.churnCurrent));
    const additionalRevenue=Math.max(0,safe(input.additionalRevenue));
    const technicians=Math.max(0,safe(input.technicians));
    const businessDays=Math.max(0,safe(input.businessDays));
    const hoursPerDay=Math.max(0,safe(input.hoursPerDay));
    const churnDelta=churnReference-churnCurrent;
    const preservedClients=clients*churnDelta;
    const protectedMonthly=preservedClients*ticket;
    const protectedAnnual=protectedMonthly*12;
    const estimatedBenefit=protectedMonthly;
    const realizedBenefit=additionalRevenue;
    const economicBenefit=estimatedBenefit+realizedBenefit;
    const roiPct=cost?((economicBenefit-cost)/cost)*100:null;
    const costPerAttendance=attendances?cost/attendances:null;
    const costPerClient=clients?cost/clients:null;
    const productivityPerTechDay=technicians&&businessDays?attendances/(technicians*businessDays):null;
    const productivityPerHour=technicians&&businessDays&&hoursPerDay?attendances/(technicians*businessDays*hoursPerDay):null;
    return{
      cost:round(cost),attendances:round(attendances,2),clients:round(clients,2),ticket:round(ticket),
      churnReference,churnCurrent,churnDelta,preservedClients:round(preservedClients,4),
      protectedMonthly:round(protectedMonthly),protectedAnnual:round(protectedAnnual),
      additionalRevenue:round(additionalRevenue),estimatedBenefit:round(estimatedBenefit),
      realizedBenefit:round(realizedBenefit),economicBenefit:round(economicBenefit),
      roiPct:roiPct==null?null:round(roiPct,2),
      costPerAttendance:costPerAttendance==null?null:round(costPerAttendance),
      costPerClient:costPerClient==null?null:round(costPerClient),
      productivityPerTechDay:productivityPerTechDay==null?null:round(productivityPerTechDay,2),
      productivityPerHour:productivityPerHour==null?null:round(productivityPerHour,2),
      technicians:round(technicians,2),businessDays:round(businessDays,2),hoursPerDay:round(hoursPerDay,2)
    };
  }

  function aggregateRoiRows(rows=[]){
    const valid=(rows||[]).filter(Boolean);
    const totals=valid.reduce((acc,row)=>{
      acc.cost+=safe(row.cost);acc.attendances+=safe(row.attendances);acc.clients+=safe(row.clients);
      acc.additionalRevenue+=safe(row.additionalRevenue);acc.protectedMonthly+=safe(row.protectedMonthly);
      acc.technicians+=safe(row.technicians);acc.businessDays+=safe(row.businessDays);
      if(row.isComplete===true)acc.completeMonths+=1;
      if(row.hasChurn===true){
        const weight=Math.max(0,safe(row.clients));
        acc.churnCurrentWeighted+=safe(row.churnCurrent)*weight;
        acc.churnReferenceWeighted+=safe(row.churnReference)*weight;
        acc.churnWeight+=weight;
        acc.churnMonths+=1;
      }
      return acc;
    },{cost:0,attendances:0,clients:0,additionalRevenue:0,protectedMonthly:0,technicians:0,businessDays:0,churnCurrentWeighted:0,churnReferenceWeighted:0,churnWeight:0,completeMonths:0,churnMonths:0});
    const economicBenefit=totals.protectedMonthly+totals.additionalRevenue;
    return{
      months:valid.length,
      cost:round(totals.cost),attendances:round(totals.attendances,2),clientMonths:round(totals.clients,2),
      additionalRevenue:round(totals.additionalRevenue),protectedMonthly:round(totals.protectedMonthly),
      economicBenefit:round(economicBenefit),
      roiPct:totals.cost?round(((economicBenefit-totals.cost)/totals.cost)*100,2):null,
      costPerAttendance:totals.attendances?round(totals.cost/totals.attendances):null,
      costPerClientMonth:totals.clients?round(totals.cost/totals.clients):null,
      churnCurrent:totals.churnWeight?totals.churnCurrentWeighted/totals.churnWeight:0,
      churnReference:totals.churnWeight?totals.churnReferenceWeighted/totals.churnWeight:0,
      hasChurn:totals.churnMonths>0,completeMonths:totals.completeMonths,isComplete:valid.length>0&&totals.completeMonths===valid.length
    };
  }

  function groupPeriodId(monthId,grain='month'){
    const match=String(monthId||'').match(/^(\d{4})-(\d{2})$/);if(!match)return String(monthId||'');
    const year=Number(match[1]),month=Number(match[2]);
    if(grain==='year')return String(year);
    if(grain==='quarter')return `${year}-T${Math.floor((month-1)/3)+1}`;
    return `${year}-${String(month).padStart(2,'0')}`;
  }

  function groupRoiHistory(rows=[],grain='month'){
    const groups=new Map();
    for(const row of rows||[]){const key=groupPeriodId(row.id,grain);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
    return [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([id,items])=>({id,rows:items,...aggregateRoiRows(items)}));
  }

  return{calculateMonthlyRoi,aggregateRoiRows,groupPeriodId,groupRoiHistory};
});
