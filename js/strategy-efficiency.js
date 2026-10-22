(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyEfficiency=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='EF-0.1.0-foundation';
  const COVERAGE_KEYS=Object.freeze(['financial','attendance','fte','quality']);
  const METRIC_CATALOG=Object.freeze([
    Object.freeze({id:'cost-per-attendance',label:'Custo por atendimento',version:'V2.58.1',requires:Object.freeze(['financial','attendance'])}),
    Object.freeze({id:'cost-per-resolution',label:'Custo por resolução',version:'V2.58.2',requires:Object.freeze(['financial','resolutions'])}),
    Object.freeze({id:'economic-productivity-person',label:'Produtividade econômica por técnico',version:'V2.58.3',requires:Object.freeze(['financial','attendance','fte'])}),
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
  function normalizeMetrics(raw={}){
    const evaluation=Number(raw.evaluationRate);
    return Object.freeze({
      totalCost:Math.max(0,num(raw.totalCost)),
      peopleCost:Math.max(0,num(raw.peopleCost)),
      operationalCost:Math.max(0,num(raw.operationalCost)),
      attendance:Math.max(0,num(raw.attendance)),
      fte:Math.max(0,num(raw.fte)),
      peopleCount:Math.max(0,Math.round(num(raw.peopleCount))),
      evaluationRate:Number.isFinite(evaluation)?percent(evaluation):null,
      resolutions:Math.max(0,num(raw.resolutions))
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
    if(metrics.totalCost>0&&metrics.peopleCost+metrics.operationalCost===0)out.push('O custo total existe sem composição de pessoas/operação; valide a consolidação.');
    return Object.freeze(out);
  }
  function buildFoundation(input={}){
    const scope=normalizeScope(input.scope||input),metrics=normalizeMetrics(input.metrics||input),availability=normalizeAvailability(input.availability||{}),coverage=coverageScore(availability),catalog=METRIC_CATALOG.map(metric=>metricReadiness(metric,availability)),notes=warnings(scope,metrics,availability);
    const status=!scope.competence||!availability.financial?'blocked':coverage.ratio===1?'ready':'partial';
    return Object.freeze({ruleVersion:RULE_VERSION,scope,metrics,availability,coverage,status,catalog:Object.freeze(catalog),warnings:notes});
  }

  return{RULE_VERSION,COVERAGE_KEYS,METRIC_CATALOG,normalizeScope,normalizeAvailability,normalizeMetrics,coverageScore,metricReadiness,buildFoundation};
});
