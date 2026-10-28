(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyScenarioHistory=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-HISTORY-1.0.0';
  const SCENARIOS=['current','optimistic','conservative','custom'];
  const LABELS={current:'Atual',optimistic:'Otimista',conservative:'Conservador',custom:'Personalizado'};
  const metricKeys=['attendance','availableFte','requiredFte','utilizationPct','idleFte','overloadFte','gapFte','directRevenue','influencedRevenue','protectedRevenue','peopleCost','operationalCost','totalCost','directNet','directRoiPct'];
  const finite=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
  const validScope=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value||'');
  function buildPayload(compared){
    if(!compared||!validScope(compared.competence)||!String(compared.squadCode||''))throw new Error('Escopo de cenário inválido.');
    if(!compared.scenarios||SCENARIOS.some(id=>!compared.scenarios[id]?.assumptions))throw new Error('Comparativo incompleto.');
    const assumptions=Object.fromEntries(SCENARIOS.map(id=>[id,{...compared.scenarios[id].assumptions}]));
    const projection=JSON.parse(JSON.stringify(compared));
    if(projection.official!==false||projection.persisted!==false)throw new Error('O histórico aceita somente projeções não oficiais.');
    const result={competence:compared.competence,squadCode:String(compared.squadCode).toUpperCase(),baselineRevision:compared.revision??null,
      assumptions,projection};
    if(JSON.stringify(result).length>180000)throw new Error('Simulação excede o limite de armazenamento.');
    return Object.freeze(result);
  }
  function validateRevision(row){
    if(!row||!row.id||!row.scenario_id||!Number.isInteger(row.revision)||row.revision<=0||!validScope(String(row.competence||'').slice(0,7)))throw new Error('Revisão histórica inválida.');
    const projection=row.projection||{},assumptions=row.assumptions||{};
    if(projection.official!==false||projection.competence!==String(row.competence).slice(0,7)||
       String(projection.squadCode).toUpperCase()!==String(row.squad_code).toUpperCase()||
       SCENARIOS.some(id=>!projection.scenarios?.[id]?.metrics||!assumptions[id]))throw new Error('Histórico com origem ou métricas inconsistentes.');
    return row;
  }
  function compare(left,right,scenario='custom'){
    validateRevision(left);validateRevision(right);
    if(!SCENARIOS.includes(scenario))throw new Error('Cenário comparado inválido.');
    if(String(left.competence).slice(0,7)!==String(right.competence).slice(0,7)||String(left.squad_code).toUpperCase()!==String(right.squad_code).toUpperCase())
      throw new Error('Não é possível comparar competências ou Squads diferentes.');
    const a=left.projection.scenarios[scenario].metrics,b=right.projection.scenarios[scenario].metrics;
    const metrics=metricKeys.map(key=>{const before=finite(a[key]),after=finite(b[key]);return Object.freeze({key,prior:before,current:after,delta:before===null||after===null?null:Math.round((after-before)*1000000)/1000000});});
    return Object.freeze({ruleVersion:RULE_VERSION,scenario,scope:{competence:String(left.competence).slice(0,7),squadCode:String(left.squad_code).toUpperCase()},
      left:{id:left.id,scenarioId:left.scenario_id,revision:left.revision,baselineRevision:left.baseline_revision},
      right:{id:right.id,scenarioId:right.scenario_id,revision:right.revision,baselineRevision:right.baseline_revision},metrics:Object.freeze(metrics),
      note:'Diferenças entre projeções arquivadas, não entre resultados operacionais realizados.'});
  }
  function normalizeHistory(rows,competence,squad){
    if(!validScope(competence))throw new Error('Competência inválida.');
    const selected=(Array.isArray(rows)?rows:[]).filter(row=>String(row.competence||'').slice(0,7)===competence&&String(row.squad_code||'').toUpperCase()===String(squad).toUpperCase());
    return Object.freeze(selected.map(validateRevision).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||b.revision-a.revision));
  }
  return Object.freeze({RULE_VERSION,SCENARIOS,LABELS,metricKeys,buildPayload,validateRevision,normalizeHistory,compare});
});
