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
  // V2.62.2: isolated workforce/FTE assumptions; transfers redistribute, never create FTE.
  function parseHeadcount(value,label){const n=Number(value);if(!Number.isInteger(n)||n<0||n>1000)throw new RangeError(label+' deve ser um inteiro entre 0 e 1000.');return n}
  function parseHours(value,label){const n=Number(value);if(!Number.isFinite(n)||n<=0||n>60)throw new RangeError(label+' deve ficar entre 0 e 60 horas por semana.');return n}
  function createWorkforceBaseline(input={}){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(input.competence||'')))throw new Error('Competência inválida.');
    const fte=num(input.fte);
    const valid=fte!==null&&fte>=0;
    return Object.freeze({competence:String(input.competence),squadCode:String(input.squadCode||'all'),revision:input.revision??null,fte:valid?fte:null});
  }
  function simulateWorkforce(base,options={}){
    if(!base||!base.competence)throw new Error('Base de equipe inválida.');
    const hires=parseHeadcount(options.hires??0,'Contratações');
    const exits=parseHeadcount(options.exits??0,'Desligamentos');
    const transfersIn=parseHeadcount(options.transfersIn??0,'Transferências de entrada');
    const transfersOut=parseHeadcount(options.transfersOut??0,'Transferências de saída');
    const currentHours=parseHours(options.currentHours??44,'Jornada atual');
    const newHours=parseHours(options.newHours??currentHours,'Nova jornada');
    if(hires+exits+transfersIn+transfersOut>1000)throw new RangeError('Quantidade de movimentações excessiva.');
    // FTE baseline is an equivalent workforce: it is not necessarily employee headcount.
    // New people enter at the planned weekly schedule; exits and outgoing transfers are
    // assumed to carry an equivalent fraction based on the current weekly schedule.
    const referenceHours=parseHours(options.referenceHours??44,'Jornada FTE de referência');
    const status=base.fte===null?'insufficient_data':'simulated';
    const unitCurrent=currentHours/referenceHours,unitNew=newHours/referenceHours;
    const movementFte=(hires+transfersIn)*unitNew-(exits+transfersOut)*unitCurrent;
    // Existing workforce schedule change is applied first; movement is applied after.
    const projected=status==='simulated'?Math.max(0,base.fte*newHours/currentHours+movementFte):null;
    // If transfers exist the 'all' scope cannot be used to falsely create/lose company FTE.
    const projectedGlobal=status==='simulated'?Math.max(0,base.fte*newHours/currentHours+hires*unitNew-exits*unitCurrent):null;
    if(status==='simulated' && (exits+transfersOut)*unitCurrent>base.fte*newHours/currentHours+1e-8)throw new RangeError('Saídas excedem o FTE de origem disponível.');
    return Object.freeze({ruleVersion:'SC-WORKFORCE-1.0.0',status,official:false,persisted:false,competence:base.competence,squadCode:base.squadCode,revision:base.revision,
      baselineFte:base.fte,projectedFte:base.squadCode==='all'?projectedGlobal:projected,deltaFte:status==='simulated'?(base.squadCode==='all'?projectedGlobal:projected)-base.fte:null,
      hires,exits,transfersIn,transfersOut,currentHours,newHours,referenceHours,
      transferNetFte:(transfersIn*unitNew-transfersOut*unitCurrent),movementFte,
      note:'Simulação agregada de FTE; não modifica pessoas, escalas, custos nem histórico.'});
  }
  // V2.62.3: product demand projections are read-only and preserve the official source.
  function createDemandBaseline(input={}){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(input.competence||'')))throw new Error('Competência inválida.');
    const raw=Array.isArray(input.rows)?input.rows:[];
    const rows=raw.map((r,i)=>{
      const a=num(r.attendance),v=num(r.resolutions);
      const valid=a!==null&&v!==null&&a>=0&&v>=0&&v<=a&&Number.isInteger(a)&&Number.isInteger(v);
      return Object.freeze({code:String(r.productCode??r.code??i),name:String(r.productName??r.name??'Não classificado'),attendance:valid?a:null,resolutions:valid?v:null,valid});
    });
    const available=input.attendanceSourceAvailable===true&&input.resolutionSourceAvailable===true;
    return Object.freeze({competence:String(input.competence),squadCode:String(input.squadCode||'all'),revision:input.revision??null,available,rows:Object.freeze(rows)});
  }
  function simulateDemand(base,options={}){
    if(!base||!Array.isArray(base.rows))throw new Error('Base de demanda inválida.');
    const variationPct=parsePercent(options.variationPct??0);
    const resolutionRateDeltaPct=Number(options.resolutionRateDeltaPct??0);
    if(!Number.isFinite(resolutionRateDeltaPct)||resolutionRateDeltaPct< -100||resolutionRateDeltaPct>100)throw new RangeError('Ajuste da taxa de resolução deve estar entre -100 e 100 pontos percentuais.');
    const selected=String(options.productCode??'all');
    const target=selected==='all'?base.rows:base.rows.filter(row=>row.code===selected);
    const valid=base.available&&target.length>0&&target.every(row=>row.valid);
    const rows=valid?target.map(row=>{
      const attendance=Math.max(0,Math.round(row.attendance*(1+variationPct/100)));
      const rate=row.attendance>0?row.resolutions/row.attendance:null;
      const newRate=rate===null?null:Math.max(0,Math.min(1,rate+resolutionRateDeltaPct/100));
      const resolutions=newRate===null?null:Math.min(attendance,Math.round(attendance*newRate));
      return Object.freeze({...row,projectedAttendance:attendance,projectedResolutions:resolutions,baselineRate:rate,projectedRate:newRate});
    }):[];
    const sum=(key)=>rows.reduce((total,row)=>total+row[key],0);
    const originalAttendance=valid?sum('attendance'):null,originalResolutions=valid?sum('resolutions'):null;
    const projectedAttendance=valid?sum('projectedAttendance'):null;
    const projectedResolutions=valid&&rows.every(row=>row.projectedResolutions!==null)?sum('projectedResolutions'):null;
    return Object.freeze({ruleVersion:'SC-DEMAND-1.0.0',official:false,persisted:false,status:valid&&projectedResolutions!==null?'simulated':'insufficient_data',competence:base.competence,squadCode:base.squadCode,revision:base.revision,productCode:selected,variationPct,resolutionRateDeltaPct,baselineAttendance:originalAttendance,baselineResolutions:originalResolutions,projectedAttendance,projectedResolutions,deltaAttendance:projectedAttendance===null?null:projectedAttendance-originalAttendance,deltaResolutions:projectedResolutions===null?null:projectedResolutions-originalResolutions,rows:Object.freeze(rows)});
  }
  return Object.freeze({RULE_VERSION,TYPES,COST_FIELDS,COST_LABELS,createBaseline,simulate,parsePercent,createCostBaseline,simulateCosts,createWorkforceBaseline,simulateWorkforce,createDemandBaseline,simulateDemand});
});
