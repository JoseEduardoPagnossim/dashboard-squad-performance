(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyEfficiency=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='EF-0.4.0-economic-productivity-person';
  const COVERAGE_KEYS=Object.freeze(['financial','attendance','fte','quality','resolutions']);
  const METRIC_CATALOG=Object.freeze([
    Object.freeze({id:'cost-per-attendance',label:'Custo por atendimento',version:'V2.58.1',requires:Object.freeze(['financial','attendance'])}),
    Object.freeze({id:'cost-per-resolution',label:'Custo por resolução',version:'V2.58.2',requires:Object.freeze(['financial','resolutions'])}),
    Object.freeze({id:'economic-productivity-person',label:'Produtividade econômica por técnico',version:'V2.58.3',requires:Object.freeze(['financial','attendance','fte','resolutions'])}),
    Object.freeze({id:'economic-productivity-squad',label:'Produtividade econômica por Squad',version:'V2.58.4',requires:Object.freeze(['financial','attendance','fte'])})
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

  return{RULE_VERSION,COVERAGE_KEYS,METRIC_CATALOG,normalizeScope,normalizeAvailability,normalizeMetrics,normalizeUnitRow,calculateCostPerAttendance,calculateCostPerResolution,calculateResolutionRate,calculateEconomicProductivity,normalizeTechnicianProductivityRow,buildTechnicianProductivity,changeRatio,buildCostPerAttendance,buildCostPerResolution,coverageScore,metricReadiness,buildFoundation};
});
