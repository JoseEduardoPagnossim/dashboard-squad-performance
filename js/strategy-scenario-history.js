(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyScenarioHistory=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-HISTORY-1.1.0';
  const SCENARIOS=['current','optimistic','conservative','custom'];
  const LABELS={current:'Atual',optimistic:'Otimista',conservative:'Conservador',custom:'Personalizado'};
  const metricKeys=['attendance','availableFte','requiredFte','utilizationPct','idleFte','overloadFte','gapFte','directRevenue','influencedRevenue','protectedRevenue','peopleCost','operationalCost','totalCost','directNet','directRoiPct'];
  const finite=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
  const validScope=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(value||'');
  const PERCENT_FIELDS=['demandPct','directRevenue','influencedRevenue','protectedRevenue','peopleCost','operationalCost'];
  const HEADCOUNT_FIELDS=['hires','exits','transfersIn','transfersOut'];
  const isNonnegative=key=>!['gapFte','directNet','directRoiPct'].includes(key);
  const close=(a,b,tolerance)=>Math.abs(a-b)<=tolerance;
  function validateProjection(projection){
    if(!projection||projection.official!==false||projection.persisted!==false||!validScope(projection.competence)||
       !/^(ALL|[A-Z0-9_-]{1,40})$/.test(String(projection.squadCode||'').toUpperCase())||
       !projection.scenarios||typeof projection.scenarios!=='object')throw new Error('Projeção não oficial ou escopo inválido.');
    if(!projection.delta||typeof projection.delta!=='object')throw new Error('Diferenças do comparativo ausentes.');
    const current=projection.scenarios.current?.metrics;
    if(!current)throw new Error('Base do cenário atual ausente.');
    for(const id of SCENARIOS){
      const item=projection.scenarios[id];
      if(!item||!item.metrics||!item.assumptions)throw new Error('Alternativa '+id+' incompleta.');
      for(const key of metricKeys){
        if(!Object.hasOwn(item.metrics,key))throw new Error('Métrica ausente: '+key+'.');
        const value=item.metrics[key];
        if(value!==null&&(finite(value)===null||(isNonnegative(key)&&value<0)))throw new Error('Métrica inválida: '+key+'.');
        const delta=projection.delta[id]?.[key];
        if(delta===undefined||!(delta===null||finite(delta)!==null))throw new Error('Diferença inválida: '+id+'.'+key+'.');
        if(value===null||current[key]===null){
          if(delta!==null)throw new Error('Diferença sem fonte numérica: '+id+'.'+key+'.');
        }else if(!close(delta,value-current[key],0.00001))throw new Error('Diferença incompatível: '+id+'.'+key+'.');
      }
      const m=item.metrics;
      if(m.attendance!==null&&!Number.isInteger(m.attendance))throw new Error('Atendimentos precisam ser inteiros.');
      if(m.totalCost!==null&&m.peopleCost!==null&&m.operationalCost!==null&&
         !close(m.totalCost,m.peopleCost+m.operationalCost,0.075))throw new Error('Custos financeiros não conciliados.');
      if(m.directNet!==null&&m.directRevenue!==null&&m.totalCost!==null&&
         !close(m.directNet,m.directRevenue-m.totalCost,0.075))throw new Error('Resultado líquido inconsistente.');
      if(m.totalCost>0&&m.directRevenue!==null&&m.directRoiPct===null)throw new Error('ROI direto obrigatório quando o custo é positivo.');
      if(m.totalCost===0&&m.directRoiPct!==null)throw new Error('ROI indefinido com custo zero.');
      if(m.totalCost>0&&m.directRevenue!==null&&m.directRoiPct!==null&&
         !close(m.directRoiPct,(m.directRevenue/m.totalCost-1)*100,0.015))throw new Error('Fórmula do ROI inconsistente.');
      if(m.availableFte!==null&&m.requiredFte!==null&&m.gapFte!==null&&
         !close(m.gapFte,m.availableFte-m.requiredFte,0.00001))throw new Error('Gap de FTE inconsistente.');
      if(m.gapFte!==null&&m.idleFte!==null&&m.overloadFte!==null&&
         (!close(m.idleFte,Math.max(0,m.gapFte),0.00001)||!close(m.overloadFte,Math.max(0,-m.gapFte),0.00001)))
         throw new Error('Ociosidade ou sobrecarga incompatível com gap.');
      if(m.availableFte>0&&m.requiredFte!==null&&m.utilizationPct!==null&&
         !close(m.utilizationPct,100*m.requiredFte/m.availableFte,0.0001))throw new Error('Utilização inconsistente.');
      const assumptions=item.assumptions;
      for(const key of PERCENT_FIELDS){if(finite(assumptions[key])===null||assumptions[key]<-100||assumptions[key]>300)
        throw new Error('Percentual de premissa inválido: '+key+'.');}
      for(const key of HEADCOUNT_FIELDS){if(!Number.isInteger(assumptions[key])||assumptions[key]<0||assumptions[key]>1000)
        throw new Error('Movimentação de equipe inválida: '+key+'.');}
      for(const key of ['currentHours','newHours']){if(finite(assumptions[key])===null||assumptions[key]<=0||assumptions[key]>60)
        throw new Error('Jornada inválida: '+key+'.');}
    }
    return projection;
  }
  function deepFreeze(value){
    if(value&&typeof value==='object'&&!Object.isFrozen(value)){
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  }
  function buildPayload(compared){
    if(!compared||!validScope(compared.competence)||!String(compared.squadCode||''))throw new Error('Escopo de cenário inválido.');
    if(!compared.scenarios||SCENARIOS.some(id=>!compared.scenarios[id]?.assumptions))throw new Error('Comparativo incompleto.');
    validateProjection(compared);
    const assumptions=Object.fromEntries(SCENARIOS.map(id=>[id,{...compared.scenarios[id].assumptions}]));
    const projection=JSON.parse(JSON.stringify(compared));
    if(projection.official!==false||projection.persisted!==false)throw new Error('O histórico aceita somente projeções não oficiais.');
    const result={competence:compared.competence,squadCode:String(compared.squadCode).toUpperCase(),baselineRevision:compared.revision??null,
      assumptions,projection};
    if(JSON.stringify(result).length>180000)throw new Error('Simulação excede o limite de armazenamento.');
    return deepFreeze(result);
  }
  function validateRevision(row){
    if(!row||!row.id||!row.scenario_id||!Number.isInteger(row.revision)||row.revision<=0||!validScope(String(row.competence||'').slice(0,7)))throw new Error('Revisão histórica inválida.');
    const projection=row.projection||{},assumptions=row.assumptions||{};
    if(projection.official!==false||projection.persisted!==false||projection.competence!==String(row.competence).slice(0,7)||
       String(projection.squadCode).toUpperCase()!==String(row.squad_code).toUpperCase()||
       String(projection.revision??'')!==String(row.baseline_revision??'')||
       SCENARIOS.some(id=>!projection.scenarios?.[id]?.metrics||!assumptions[id]))throw new Error('Histórico com origem ou métricas inconsistentes.');
    validateProjection(projection);
    for(const id of SCENARIOS){
      if(JSON.stringify(assumptions[id])!==JSON.stringify(projection.scenarios[id].assumptions))
        throw new Error('Premissas arquivadas diferentes das projetadas.');
    }
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
  return Object.freeze({RULE_VERSION,SCENARIOS,LABELS,metricKeys,validateProjection,buildPayload,validateRevision,normalizeHistory,compare});
});
