(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyScenarios=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SC-1.0.0';
  const TYPES=Object.freeze([
    Object.freeze({id:'cost',label:'Custos',unit:'%',description:'Projeção dos custos totais'}),
    Object.freeze({id:'fte',label:'Equipe e FTE',unit:'%',description:'Projeção do FTE disponível'}),
    Object.freeze({id:'demand',label:'Demanda',unit:'%',description:'Projeção do volume de atendimentos'})
  ]);
  function num(value){return typeof value==='number'&&Number.isFinite(value)?value:null}
  function parsePercent(value){const n=Number(value);if(!Number.isFinite(n)||n< -100||n>300)throw new RangeError('Variação deve estar entre -100% e 300%.');return n}
  function createBaseline(input={}){
    const obj={competence:String(input.competence||''),squadCode:String(input.squadCode||'all'),revision:input.revision??null,
      cost:num(input.cost),fte:num(input.fte),attendance:num(input.attendance)};
    if(!/^\d{4}-\d{2}$/.test(obj.competence))throw new Error('Competência-base inválida.');
    return Object.freeze(obj);
  }
  function simulate(baseline,type,variation){
    if(!TYPES.some(item=>item.id===type))throw new Error('Tipo de cenário desconhecido.');
    const pct=parsePercent(variation),key=type==='cost'?'cost':type==='fte'?'fte':'attendance';
    const source=baseline?.[key];const valid=typeof source==='number'&&Number.isFinite(source)&&source>=0;
    const projected=valid?Math.max(0,source*(1+pct/100)):null;
    return Object.freeze({ruleVersion:RULE_VERSION,type,variationPct:pct,competence:baseline?.competence||'',squadCode:baseline?.squadCode||'all',
      baselineRevision:baseline?.revision??null,baselineValue:valid?source:null,projectedValue:projected,delta:valid?projected-source:null,
      status:valid?'simulated':'insufficient_data',official:false,persisted:false});
  }
  return Object.freeze({RULE_VERSION,TYPES,createBaseline,simulate,parsePercent});
});
