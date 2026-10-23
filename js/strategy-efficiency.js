(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyEfficiency=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='EF-0.6.0-relative-efficiency-benchmarks';
  const COVERAGE_KEYS=Object.freeze(['financial','attendance','fte','quality','resolutions']);
  const METRIC_CATALOG=Object.freeze([
    Object.freeze({id:'cost-per-attendance',label:'Custo por atendimento',version:'V2.58.1',requires:Object.freeze(['financial','attendance'])}),
    Object.freeze({id:'cost-per-resolution',label:'Custo por resolução',version:'V2.58.2',requires:Object.freeze(['financial','resolutions'])}),
    Object.freeze({id:'economic-productivity-person',label:'Produtividade econômica por técnico',version:'V2.58.3',requires:Object.freeze(['financial','attendance','fte','resolutions'])}),
    Object.freeze({id:'economic-productivity-squad',label:'Produtividade econômica por Squad',version:'V2.58.4',requires:Object.freeze(['financial','attendance','fte','resolutions'])}),
    Object.freeze({id:'relative-efficiency-benchmarks',label:'Comparativos, benchmarks e eficiência relativa',version:'V2.58.5',requires:Object.freeze(['financial','attendance','fte','resolutions'])})
  ]);

  function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function bool(value){return value===true}
  function text(value,fallback=''){const out=String(value??'').trim();return out||fallback}
  function percent(value){return Math.max(0,Math.min(1,num(value)))}
  function normalizeScope(raw={}){
    const competence=text(raw.competence),squadCode=text(raw.squadCode,'all').toUpperCase();
    return Object.freeze({competence,squadCode:squadCode==='ALL'?'all':squadCode,comparison:text(raw.comparison,'previous'),competenceStatus:text(raw.competenceStatus,'draft')});
  }
  function normalizeAvailability(raw={}){
    return Object.freeze({
      financial:bool(raw.financial),
      attendance:bool(raw.attendance),
      fte:bool(raw.fte),
      quality:bool(raw.quality),
      resolutions:bool(raw.resolutions)
    });
  }
  function calculateCostPerAttendance(totalCost,attendance){
    const cost=Math.max(0,num(totalCost)),volume=Math.max(0,num(attendance));
    return volume>0?cost/volume:null;
  }
  function calculateCostPerResolution(totalCost,resolutions){
    const cost=Math.max(0,num(totalCost)),volume=Math.max(0,num(resolutions));
    return volume>0?cost/volume:null;
  }
  function calculateResolutionRate(resolutions,attendance){
    const resolved=Math.max(0,num(resolutions)),volume=Math.max(0,num(attendance));
    return volume>0?Math.min(1,resolved/volume):null;
  }
  function calculateEconomicProductivity(resolutions,totalCost,scale=1000){
    const resolved=Math.max(0,num(resolutions)),cost=Math.max(0,num(totalCost)),factor=Math.max(1,num(scale,1000));
    return cost>0?resolved*factor/cost:null;
  }
  function normalizeTechnicianProductivityRow(raw={}){
    const personalCost=Math.max(0,num(raw.personalCost??raw.totalCost??raw.total_cost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions)),fte=Math.max(0,num(raw.fte));
    const rating=Number(raw.avgRating??raw.avg_rating),evaluationCoverage=Number(raw.evaluationCoverage??raw.evaluation_coverage);
    return Object.freeze({
      id:text(raw.id||raw.userId||raw.user_id),
      name:text(raw.name||raw.label,'Sem identificação'),
      squadCode:text(raw.squadCode||raw.squad_code).toUpperCase(),
      personalCost,fte,attendance,resolutions,
      costPerAttendance:calculateCostPerAttendance(personalCost,attendance),
      costPerResolution:calculateCostPerResolution(personalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      economicProductivity:calculateEconomicProductivity(resolutions,personalCost),
      avgRating:Number.isFinite(rating)?Math.max(0,Math.min(5,rating)):null,
      evaluationCoverage:Number.isFinite(evaluationCoverage)?percent(evaluationCoverage):null,
      sourceAvailable:raw.sourceAvailable===true,
      linked:raw.linked===true
    });
  }
  function buildTechnicianProductivity(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeTechnicianProductivityRow);
    const ready=normalized.filter(row=>row.linked&&row.sourceAvailable&&row.personalCost>0);
    const ranked=ready.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.name.localeCompare(b.name,'pt-BR')).map((row,index)=>Object.freeze({...row,rank:index+1}));
    const totalCost=ready.reduce((sum,row)=>sum+row.personalCost,0),resolutions=ready.reduce((sum,row)=>sum+row.resolutions,0),attendance=ready.reduce((sum,row)=>sum+row.attendance,0);
    const ratingWeight=ready.reduce((sum,row)=>sum+(row.avgRating!=null&&row.resolutions>0?row.resolutions:0),0),weightedRating=ready.reduce((sum,row)=>sum+(row.avgRating!=null?row.avgRating*row.resolutions:0),0);
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      rows:Object.freeze(ranked),
      eligibleCount:ready.length,
      totalCost,resolutions,attendance,
      economicProductivity:calculateEconomicProductivity(resolutions,totalCost),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      avgRating:ratingWeight>0?weightedRating/ratingWeight:null
    });
  }
  function normalizeSquadProductivityRow(raw={}){
    const totalCost=Math.max(0,num(raw.totalCost??raw.total_cost)),peopleCost=Math.max(0,num(raw.peopleCost??raw.people_cost)),operationalCost=Math.max(0,num(raw.operationalCost??raw.operational_cost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions)),fte=Math.max(0,num(raw.fte));
    const evaluation=Number(raw.evaluationRate??raw.evaluation_rate),resolutionEntries=Math.max(0,num(raw.resolutionEntries??raw.resolution_entries));
    return Object.freeze({
      squadCode:text(raw.squadCode||raw.squad_code).toUpperCase(),
      label:text(raw.label||raw.name||raw.squadCode||raw.squad_code,'Sem identificação'),
      totalCost,peopleCost,operationalCost,fte,attendance,resolutions,resolutionEntries,
      costPerAttendance:calculateCostPerAttendance(totalCost,attendance),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      attendancePerFte:fte>0?attendance/fte:null,
      resolutionsPerFte:fte>0?resolutions/fte:null,
      economicProductivity:calculateEconomicProductivity(resolutions,totalCost),
      evaluationRate:Number.isFinite(evaluation)?percent(evaluation):null,
      sourceAvailable:raw.sourceAvailable===true||resolutionEntries>0
    });
  }
  function buildSquadProductivity(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeSquadProductivityRow);
    const ready=normalized.filter(row=>row.squadCode&&row.sourceAvailable&&row.totalCost>0);
    const ranked=ready.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.squadCode.localeCompare(b.squadCode,'pt-BR')).map((row,index)=>Object.freeze({...row,rank:index+1}));
    const totalCost=ready.reduce((sum,row)=>sum+row.totalCost,0),peopleCost=ready.reduce((sum,row)=>sum+row.peopleCost,0),operationalCost=ready.reduce((sum,row)=>sum+row.operationalCost,0),resolutions=ready.reduce((sum,row)=>sum+row.resolutions,0),attendance=ready.reduce((sum,row)=>sum+row.attendance,0),fte=ready.reduce((sum,row)=>sum+row.fte,0);
    const qualityWeight=ready.reduce((sum,row)=>sum+(row.evaluationRate!=null?Math.max(1,row.attendance):0),0),weightedQuality=ready.reduce((sum,row)=>sum+(row.evaluationRate!=null?row.evaluationRate*Math.max(1,row.attendance):0),0);
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      rows:Object.freeze(ranked),eligibleCount:ready.length,totalCost,peopleCost,operationalCost,resolutions,attendance,fte,
      economicProductivity:calculateEconomicProductivity(resolutions,totalCost),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      resolutionsPerFte:fte>0?resolutions/fte:null,
      evaluationRate:qualityWeight>0?weightedQuality/qualityWeight:null
    });
  }

  function median(values=[]){
    const rows=(Array.isArray(values)?values:[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    if(!rows.length)return null;
    const mid=Math.floor(rows.length/2);
    return rows.length%2?rows[mid]:(rows[mid-1]+rows[mid])/2;
  }
  function average(values=[]){
    const rows=(Array.isArray(values)?values:[]).map(Number).filter(Number.isFinite);
    return rows.length?rows.reduce((sum,value)=>sum+value,0)/rows.length:null;
  }
  function relativeIndex(value,benchmark){
    const current=Number(value),base=Number(benchmark);
    return Number.isFinite(current)&&Number.isFinite(base)&&base>0?current/base*100:null;
  }
  function relativeBand(value,benchmark,tolerance=.05){
    const delta=changeRatio(value,benchmark),limit=Math.max(0,num(tolerance,.05));
    if(delta==null)return'no-base';
    if(delta>limit)return'above';
    if(delta<-limit)return'below';
    return'near';
  }
  function buildSquadBenchmarks(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeSquadProductivityRow),eligible=normalized.filter(row=>row.squadCode&&row.sourceAvailable&&row.totalCost>0&&row.economicProductivity!=null);
    const totalCost=eligible.reduce((sum,row)=>sum+row.totalCost,0),resolutions=eligible.reduce((sum,row)=>sum+row.resolutions,0),operation=calculateEconomicProductivity(resolutions,totalCost),mean=average(eligible.map(row=>row.economicProductivity)),medianValue=median(eligible.map(row=>row.economicProductivity)),best=eligible.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.squadCode.localeCompare(b.squadCode,'pt-BR'))[0]||null;
    const enriched=normalized.map(row=>Object.freeze({...row,benchmarkEligible:eligible.some(item=>item.squadCode===row.squadCode),operationBenchmark:operation,medianBenchmark:medianValue,vsOperation:changeRatio(row.economicProductivity,operation),vsMedian:changeRatio(row.economicProductivity,medianValue),relativeIndex:relativeIndex(row.economicProductivity,operation),relativeBand:relativeBand(row.economicProductivity,operation)}));
    return Object.freeze({ruleVersion:RULE_VERSION,eligibleCount:eligible.length,operationBenchmark:operation,meanBenchmark:mean,medianBenchmark:medianValue,best:best?Object.freeze({...best}):null,rows:Object.freeze(enriched)});
  }
  function buildTechnicianBenchmarks(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeTechnicianProductivityRow),eligible=normalized.filter(row=>row.linked&&row.sourceAvailable&&row.personalCost>0&&row.economicProductivity!=null);
    const totalCost=eligible.reduce((sum,row)=>sum+row.personalCost,0),resolutions=eligible.reduce((sum,row)=>sum+row.resolutions,0),operation=calculateEconomicProductivity(resolutions,totalCost),mean=average(eligible.map(row=>row.economicProductivity)),medianValue=median(eligible.map(row=>row.economicProductivity)),best=eligible.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.name.localeCompare(b.name,'pt-BR'))[0]||null;
    const bySquad=new Map();
    for(const row of eligible){const code=row.squadCode||'SEM_SQUAD',group=bySquad.get(code)||{cost:0,resolutions:0,count:0};group.cost+=row.personalCost;group.resolutions+=row.resolutions;group.count++;bySquad.set(code,group);}
    const squadBenchmarks=new Map([...bySquad.entries()].map(([code,group])=>[code,Object.freeze({squadCode:code,count:group.count,economicProductivity:calculateEconomicProductivity(group.resolutions,group.cost)})]));
    const enriched=normalized.map(row=>{const squad=squadBenchmarks.get(row.squadCode),squadBenchmark=squad?.economicProductivity??null;return Object.freeze({...row,benchmarkEligible:eligible.some(item=>item.id===row.id),operationBenchmark:operation,squadBenchmark,vsOperation:changeRatio(row.economicProductivity,operation),vsSquad:changeRatio(row.economicProductivity,squadBenchmark),relativeIndex:relativeIndex(row.economicProductivity,operation),relativeBand:relativeBand(row.economicProductivity,squadBenchmark??operation)});});
    return Object.freeze({ruleVersion:RULE_VERSION,eligibleCount:eligible.length,operationBenchmark:operation,meanBenchmark:mean,medianBenchmark:medianValue,best:best?Object.freeze({...best}):null,squadBenchmarks:Object.freeze([...squadBenchmarks.values()]),rows:Object.freeze(enriched)});
  }

  function normalizeMetrics(raw={}){
    const evaluation=Number(raw.evaluationRate),totalCost=Math.max(0,num(raw.totalCost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions));
    return Object.freeze({
      totalCost,
      peopleCost:Math.max(0,num(raw.peopleCost)),
      operationalCost:Math.max(0,num(raw.operationalCost)),
      attendance,
      resolutions,
      costPerAttendance:calculateCostPerAttendance(totalCost,attendance),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      fte:Math.max(0,num(raw.fte)),
      peopleCount:Math.max(0,Math.round(num(raw.peopleCount))),
      evaluationRate:Number.isFinite(evaluation)?percent(evaluation):null
    });
  }
  function normalizeUnitRow(raw={}){
    const totalCost=Math.max(0,num(raw.totalCost??raw.total_cost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions));
    return Object.freeze({
      id:text(raw.id),
      label:text(raw.label||raw.name||raw.squadCode||raw.squad_code,'Sem identificação'),
      squadCode:text(raw.squadCode||raw.squad_code).toUpperCase(),
      totalCost,
      attendance,
      resolutions,
      costPerAttendance:calculateCostPerAttendance(totalCost,attendance),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance)
    });
  }
  function changeRatio(current,baseline){
    const cur=Number(current),base=Number(baseline);
    return Number.isFinite(cur)&&Number.isFinite(base)&&base>0?(cur-base)/base:null;
  }
  function buildCostPerAttendance({current={},baseline=null,comparisonLabel=''}={}){
    const currentRow=normalizeUnitRow(current),baselineRow=baseline?normalizeUnitRow(baseline):null;
    const delta=baselineRow?changeRatio(currentRow.costPerAttendance,baselineRow.costPerAttendance):null;
    const impact=baselineRow&&currentRow.costPerAttendance!=null&&baselineRow.costPerAttendance!=null&&currentRow.attendance>0?(currentRow.costPerAttendance-baselineRow.costPerAttendance)*currentRow.attendance:null;
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      status:currentRow.costPerAttendance==null?'pending':'ready',
      current:currentRow,
      baseline:baselineRow,
      comparisonLabel:text(comparisonLabel,'Sem base de comparação'),
      delta,
      impact
    });
  }
  function buildCostPerResolution({current={},baseline=null,comparisonLabel=''}={}){
    const currentRow=normalizeUnitRow(current),baselineRow=baseline?normalizeUnitRow(baseline):null;
    const delta=baselineRow?changeRatio(currentRow.costPerResolution,baselineRow.costPerResolution):null;
    const impact=baselineRow&&currentRow.costPerResolution!=null&&baselineRow.costPerResolution!=null&&currentRow.resolutions>0?(currentRow.costPerResolution-baselineRow.costPerResolution)*currentRow.resolutions:null;
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      status:currentRow.costPerResolution==null?'pending':'ready',
      current:currentRow,
      baseline:baselineRow,
      comparisonLabel:text(comparisonLabel,'Sem base de comparação'),
      delta,
      impact
    });
  }
  function coverageScore(availability={}){
    const normalized=normalizeAvailability(availability),count=COVERAGE_KEYS.filter(key=>normalized[key]).length,total=COVERAGE_KEYS.length;
    return Object.freeze({count,total,ratio:total?count/total:0,label:`${count}/${total}`});
  }
  function metricReadiness(metric,availability){
    const missing=(metric.requires||[]).filter(key=>!availability[key]);
    return Object.freeze({...metric,status:missing.length?'pending':'ready',missing:Object.freeze(missing)});
  }
  function warnings(scope,metrics,availability){
    const out=[];
    if(!scope.competence)out.push('Selecione uma competência estratégica.');
    if(!availability.financial)out.push('A consolidação financeira da competência ainda não está disponível.');
    if(!availability.attendance)out.push('Não há produção operacional válida no escopo selecionado.');
    if(!availability.fte)out.push('O FTE estratégico ainda não está disponível no escopo selecionado.');
    if(!availability.quality)out.push('A taxa de avaliação não está disponível para este escopo.');
    if(!availability.resolutions)out.push('A base de resoluções ainda não foi informada para esta competência.');
    if(metrics.totalCost>0&&metrics.peopleCost+metrics.operationalCost===0)out.push('O custo total existe sem composição de pessoas/operação; valide a consolidação.');
    return Object.freeze(out);
  }
  function buildFoundation(input={}){
    const scope=normalizeScope(input.scope||input),metrics=normalizeMetrics(input.metrics||input),availability=normalizeAvailability(input.availability||{}),coverage=coverageScore(availability),catalog=METRIC_CATALOG.map(metric=>metricReadiness(metric,availability)),notes=warnings(scope,metrics,availability);
    const status=!scope.competence||!availability.financial?'blocked':coverage.ratio===1?'ready':'partial';
    return Object.freeze({ruleVersion:RULE_VERSION,scope,metrics,availability,coverage,status,catalog:Object.freeze(catalog),warnings:notes});
  }

  return{RULE_VERSION,COVERAGE_KEYS,METRIC_CATALOG,normalizeScope,normalizeAvailability,normalizeMetrics,normalizeUnitRow,calculateCostPerAttendance,calculateCostPerResolution,calculateResolutionRate,calculateEconomicProductivity,normalizeTechnicianProductivityRow,buildTechnicianProductivity,normalizeSquadProductivityRow,buildSquadProductivity,median,average,relativeIndex,relativeBand,buildSquadBenchmarks,buildTechnicianBenchmarks,changeRatio,buildCostPerAttendance,buildCostPerResolution,coverageScore,metricReadiness,buildFoundation};
});
