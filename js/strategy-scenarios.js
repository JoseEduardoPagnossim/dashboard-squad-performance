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
  const COST_FIELDS=Object.freeze(['salary','employerCharges','benefits','variablePay','overtime','otherCosts','operationalCost']);
  const COST_LABELS=Object.freeze({salary:'Salários',employerCharges:'Encargos',benefits:'Benefícios',variablePay:'Remuneração variável',overtime:'Horas extras',otherCosts:'Outros custos pessoais',operationalCost:'Despesas operacionais'});
  function money(n){return Math.round((n+Number.EPSILON)*100)/100}
  function createCostBaseline(input={}){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(input.competence||'')))throw new Error('Competência inválida.');
    const values={};let complete=true;
    for(const key of COST_FIELDS){const value=num(input[key]);values[key]=value!=null&&value>=0?value:null;if(values[key]===null)complete=false;}
    const peopleKeys=COST_FIELDS.filter(key=>key!=='operationalCost');
    const peopleTotal=complete?money(peopleKeys.reduce((sum,key)=>sum+values[key],0)):null;
    const total=complete?money(peopleTotal+values.operationalCost):null;
    const authoritative=num(input.totalCost);
    const reconciled=complete&&authoritative!==null&&authoritative>=0&&Math.abs(total-authoritative)<=0.07;
    return Object.freeze({competence:String(input.competence),squadCode:String(input.squadCode||'all'),revision:input.revision??null,components:Object.freeze(values),peopleTotal,total,authoritativeTotal:authoritative,reconciled});
  }
  function simulateCosts(base,variations={},operationalSharePct=100){
    if(!base||!base.components)throw new Error('Base de custos inválida.');
    const rates={};const components={};
    for(const key of COST_FIELDS){rates[key]=parsePercent(variations[key]??0);const val=base.components[key];components[key]=val===null?null:money(Math.max(0,val*(1+rates[key]/100)));}
    const share=Number(operationalSharePct);
    if(!Number.isFinite(share)||share<0||share>100)throw new RangeError('Participação operacional deve ficar entre 0% e 100%.');
    const valid=base.reconciled===true;
    const costAfter=valid?money(COST_FIELDS.reduce((sum,key)=>sum+components[key],0)):null;
    const peopleAfter=valid?money(COST_FIELDS.filter(key=>key!=='operationalCost').reduce((sum,key)=>sum+components[key],0)):null;
    // A distribuição não cria nem elimina despesas: afeta apenas a visualização do rateio.
    const allocated=valid?money(components.operationalCost*share/100):null;
    const unallocated=valid?money(components.operationalCost-allocated):null;
    return Object.freeze({ruleVersion:'SC-COST-1.0.0',status:valid?'simulated':'insufficient_data',official:false,persisted:false,
      competence:base.competence,squadCode:base.squadCode,revision:base.revision,baselineTotal:valid?base.total:null,projectedTotal:costAfter,
      delta:valid?money(costAfter-base.total):null,peopleCost:peopleAfter,operationalCost:valid?components.operationalCost:null,
      allocatedOperational:allocated,unallocatedOperational:unallocated,operationalSharePct:share,
      components:Object.freeze(components),variations:Object.freeze(rates)});
  }
  return Object.freeze({RULE_VERSION,TYPES,COST_FIELDS,COST_LABELS,createBaseline,simulate,parsePercent,createCostBaseline,simulateCosts});
});
