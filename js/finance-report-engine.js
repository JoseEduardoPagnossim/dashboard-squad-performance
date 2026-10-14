(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenFinanceReportEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const COLUMNS=Object.freeze([
    {id:'group',key:'Grupo',label:'Grupo',shortLabel:'Grupo',type:'text',group:'Identificação'},
    {id:'technician',key:'Técnico',label:'Técnico',shortLabel:'Técnico',type:'text',group:'Identificação',required:true},
    {id:'status',key:'Status financeiro',label:'Status financeiro',shortLabel:'Status',type:'text',group:'Identificação'},
    {id:'attendance',key:'Atendimentos',label:'Atendimentos',shortLabel:'Atend.',type:'integer',group:'Produção'},
    {id:'excludedAttendance',key:'Atend. sem avaliação',label:'Atend. sem avaliação',shortLabel:'Sem aval.',type:'integer',group:'Produção'},
    {id:'eligibleAttendance',key:'Base elegível avaliação',label:'Base elegível avaliação',shortLabel:'Base aval.',type:'integer',group:'Produção'},
    {id:'avgPerDay',key:'Atend./dia individual',label:'Atend./dia individual',shortLabel:'At./dia',type:'number',group:'Produção'},
    {id:'notes5',key:'Notas 5',label:'Notas 5',shortLabel:'N5',type:'integer',group:'Qualidade'},
    {id:'notes5Pct',key:'% Notas 5 individual',label:'% Notas 5 individual',shortLabel:'% N5',type:'percent',group:'Qualidade'},
    {id:'squadCommissionAtt',key:'Base Squad - comissão atend.',label:'Base Squad · comissão atend.',shortLabel:'Sq. atend.',type:'money',group:'Base Squad'},
    {id:'squadCommissionNotes',key:'Base Squad - comissão N5',label:'Base Squad · comissão N5',shortLabel:'Sq. N5',type:'money',group:'Base Squad'},
    {id:'squadFinal',key:'Base Squad - final',label:'Base Squad · final',shortLabel:'Base Squad',type:'money',group:'Base Squad'},
    {id:'individualCommissionAtt',key:'Individual - comissão atend.',label:'Individual · comissão atend.',shortLabel:'Ind. atend.',type:'money',group:'Individual'},
    {id:'individualCommissionNotes',key:'Individual - comissão N5',label:'Individual · comissão N5',shortLabel:'Ind. N5',type:'money',group:'Individual'},
    {id:'individualBeforeCap',key:'Individual - antes do teto',label:'Individual · antes do teto',shortLabel:'Ind. pré-teto',type:'money',group:'Individual'},
    {id:'individualCapAdjustment',key:'Individual - ajuste teto',label:'Individual · ajuste teto',shortLabel:'Ajuste teto',type:'money',group:'Individual'},
    {id:'individualFinal',key:'Individual - final',label:'Individual · final',shortLabel:'Individual',type:'money',group:'Individual'},
    {id:'difference',key:'Diferença Individual x Squad',label:'Diferença Individual × Squad',shortLabel:'Dif.',type:'money',group:'Comparação'},
    {id:'officialModel',key:'Modelo oficial',label:'Modelo oficial',shortLabel:'Oficial',type:'text',group:'Fechamento'},
    {id:'officialValue',key:'Valor oficial',label:'Valor oficial',shortLabel:'Valor oficial',type:'money',group:'Fechamento'},
    {id:'baseTechnicianCommission',key:'Comissão base do técnico',label:'Comissão base do técnico',shortLabel:'Comissão base',type:'money',group:'Fechamento'},
    {id:'cancelMultiplier',key:'Multiplicador cancelamento',label:'Multiplicador cancelamento',shortLabel:'Mult. canc.',type:'multiplier',group:'Cálculo'},
    {id:'afterCancel',key:'Base após cancelamento',label:'Base após cancelamento',shortLabel:'Após canc.',type:'money',group:'Cálculo'},
    {id:'afterVacation',key:'Base após férias',label:'Base após férias',shortLabel:'Após férias',type:'money',group:'Cálculo'},
    {id:'vacationAdjustment',key:'Ajuste férias sobre a base',label:'Ajuste férias sobre a base',shortLabel:'Ajuste férias',type:'money',group:'Cálculo'},
    {id:'manualBonus',key:'Bônus manual',label:'Bônus manual',shortLabel:'Bônus manual',type:'money',group:'Ajustes'},
    {id:'topAttendancePrize',key:'Prêmio atendimento',label:'Prêmio atendimento',shortLabel:'Prêmio atend.',type:'money',group:'Ajustes'},
    {id:'topNotesPrize',key:'Prêmio Notas 5',label:'Prêmio Notas 5',shortLabel:'Prêmio N5',type:'money',group:'Ajustes'},
    {id:'bonusTotal',key:null,label:'Bônus total',shortLabel:'Bônus',type:'money',group:'Ajustes',computed:'bonusTotal'},
    {id:'manualCommission',key:null,label:'Comissão manual',shortLabel:'Comissão manual',type:'money',group:'Ajustes',computed:'bonusTotal',presetOnly:true},
    {id:'sales',key:'Comissão vendas',label:'Comissão Venda',shortLabel:'Comissão Venda',type:'money',group:'Ajustes'},
    {id:'discount',key:'Desconto',label:'Desconto',shortLabel:'Desc.',type:'money',group:'Ajustes'},
    {id:'redistribution',key:'Redistribuição',label:'Redistribuição',shortLabel:'Redistrib.',type:'money',group:'Ajustes'},
    {id:'vacation',key:'Férias',label:'Férias',shortLabel:'Férias',type:'text',group:'Exceções'},
    {id:'waiveBelowDiscount',key:'Isenção manual desconto ABAIXO',label:'Isenção manual desconto ABAIXO',shortLabel:'Isenção desc.',type:'text',group:'Exceções'},
    {id:'discountEligible',key:'Elegível desconto ABAIXO',label:'Elegível desconto ABAIXO',shortLabel:'Eleg. desc.',type:'text',group:'Exceções'},
    {id:'countsSquadBase',key:'Conta na Base do Squad',label:'Conta na Base do Squad',shortLabel:'Conta qtd.',type:'text',group:'Exceções'},
    {id:'redistributionEligible',key:'Participa redistribuição se ACIMA',label:'Participa redistribuição se ACIMA',shortLabel:'Eleg. redistrib.',type:'text',group:'Exceções'},
    {id:'ruleVersion',key:'Versão das regras',label:'Versão das regras',shortLabel:'Regra',type:'text',group:'Auditoria'},
    {id:'ruleFingerprint',key:'Assinatura das regras',label:'Assinatura das regras',shortLabel:'Assinatura',type:'text',group:'Auditoria'}
  ]);

  const IDS=COLUMNS.map(c=>c.id);
  const REQUIRED_IDS=COLUMNS.filter(c=>c.required).map(c=>c.id);
  const DEFAULT_VISIBLE=Object.freeze(['technician','status','squadFinal','individualFinal','difference','officialModel','officialValue','bonusTotal','sales','discount','redistribution','vacation','countsSquadBase']);
  const COMPACT_VISIBLE=Object.freeze(['technician','status','attendance','officialValue','bonusTotal','discount','redistribution','vacation']);
  const HR_VISIBLE=Object.freeze(['group','technician','baseTechnicianCommission','sales','manualCommission']);
  const FULL_VISIBLE=Object.freeze(COLUMNS.filter(c=>!c.presetOnly).map(c=>c.id));

  function validId(id){return IDS.includes(id)}
  function uniqueValid(values){const out=[];for(const id of Array.isArray(values)?values:[])if(validId(id)&&!out.includes(id))out.push(id);return out}
  function normalizedOrder(values){const out=uniqueValid(values);for(const id of IDS)if(!out.includes(id))out.push(id);return out}
  function normalizedVisible(values,fallback=DEFAULT_VISIBLE){const out=uniqueValid(Array.isArray(values)?values:fallback);for(const id of REQUIRED_IDS)if(!out.includes(id))out.unshift(id);return out.length?out:[...REQUIRED_IDS]}
  function normalizeConfig(config){
    const raw=config&&typeof config==='object'?config:{};
    return{version:1,order:normalizedOrder(raw.order),visible:normalizedVisible(raw.visible),applyToExcel:raw.applyToExcel===true};
  }
  function defaultConfig(){return normalizeConfig({order:IDS,visible:DEFAULT_VISIBLE,applyToExcel:false})}
  function presetConfig(name,current){
    const base=normalizeConfig(current);
    if(name==='compact')return normalizeConfig({order:[...COMPACT_VISIBLE,...IDS.filter(id=>!COMPACT_VISIBLE.includes(id))],visible:COMPACT_VISIBLE,applyToExcel:base.applyToExcel});
    if(name==='hr')return normalizeConfig({order:[...HR_VISIBLE,...IDS.filter(id=>!HR_VISIBLE.includes(id))],visible:HR_VISIBLE,applyToExcel:true});
    if(name==='full')return normalizeConfig({order:IDS,visible:FULL_VISIBLE,applyToExcel:base.applyToExcel});
    if(name==='default')return defaultConfig();
    return base;
  }
  function selectedColumns(config){const normalized=normalizeConfig(config),visible=new Set(normalized.visible);return normalized.order.filter(id=>visible.has(id)).map(id=>COLUMNS.find(c=>c.id===id)).filter(Boolean)}
  function moveColumn(config,sourceId,targetId){
    const next=normalizeConfig(config),from=next.order.indexOf(sourceId),to=next.order.indexOf(targetId);if(from<0||to<0||from===to)return next;
    const order=[...next.order],[moved]=order.splice(from,1);order.splice(to,0,moved);return normalizeConfig({...next,order});
  }
  function stepColumn(config,id,direction){
    const next=normalizeConfig(config),index=next.order.indexOf(id),target=index+(direction==='up'?-1:1);if(index<0||target<0||target>=next.order.length)return next;
    const order=[...next.order];[order[index],order[target]]=[order[target],order[index]];return normalizeConfig({...next,order});
  }
  function setVisible(config,id,visible){
    const next=normalizeConfig(config),column=COLUMNS.find(c=>c.id===id);if(!column)return next;
    const set=new Set(next.visible);if(visible||column.required)set.add(id);else set.delete(id);return normalizeConfig({...next,visible:[...set]});
  }
  function columnById(id){return COLUMNS.find(c=>c.id===id)||null}
  function computedValue(row,column){if(column?.computed==='bonusTotal')return Number(row?.['Bônus manual']||0)+Number(row?.['Prêmio atendimento']||0)+Number(row?.['Prêmio Notas 5']||0);return column?.key?row?.[column.key]:''}

  return{COLUMNS,DEFAULT_VISIBLE,COMPACT_VISIBLE,HR_VISIBLE,FULL_VISIBLE,REQUIRED_IDS,normalizeConfig,defaultConfig,presetConfig,selectedColumns,moveColumn,stepColumn,setVisible,columnById,computedValue};
});
