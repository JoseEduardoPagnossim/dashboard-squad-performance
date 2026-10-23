(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCapacity=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='CA-0.2.0-available-capacity';
  const DEMAND_UNITS=Object.freeze(['resolutions','attendance']);
  const FOUNDATION_SOURCES=Object.freeze(['fte','attendance','resolutions','availabilityFactors','historicalCapacity']);
  const ROADMAP_CATALOG=Object.freeze([
    Object.freeze({id:'available-capacity',label:'Capacidade disponível',version:'V2.59.1',requires:Object.freeze(['fte','availabilityFactors'])}),
    Object.freeze({id:'used-capacity',label:'Capacidade utilizada',version:'V2.59.2',requires:Object.freeze(['fte','resolutions','availabilityFactors'])}),
    Object.freeze({id:'utilization',label:'Utilização, ociosidade e sobrecarga',version:'V2.59.3',requires:Object.freeze(['fte','resolutions','availabilityFactors','historicalCapacity'])}),
    Object.freeze({id:'productivity-per-fte',label:'Produtividade por FTE',version:'V2.59.4',requires:Object.freeze(['fte','resolutions'])}),
    Object.freeze({id:'required-fte',label:'FTE necessário',version:'V2.59.5',requires:Object.freeze(['resolutions','historicalCapacity'])}),
    Object.freeze({id:'capacity-gap',label:'Gap de capacidade',version:'V2.59.6',requires:Object.freeze(['fte','resolutions','availabilityFactors','historicalCapacity'])}),
    Object.freeze({id:'capacity-diagnostics',label:'Insights de capacidade',version:'V2.59.7',requires:Object.freeze(['fte','resolutions','availabilityFactors','historicalCapacity'])}),
    Object.freeze({id:'capacity-history',label:'Snapshots e evolução',version:'V2.59.8',requires:Object.freeze(['fte','resolutions','availabilityFactors','historicalCapacity'])})
  ]);

  function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function optionalNumber(value){if(value===null||value===undefined)return null;if(typeof value==='string'&&!value.trim())return null;const n=Number(value);return Number.isFinite(n)?n:null}
  function bool(value){return value===true}
  function text(value,fallback=''){const out=String(value??'').trim();return out||fallback}
  function clamp01(value){const n=optionalNumber(value);return n==null?null:Math.max(0,Math.min(1,n))}
  function normalizeDemandUnit(value){const unit=text(value,'resolutions').toLowerCase();return DEMAND_UNITS.includes(unit)?unit:'resolutions'}
  function normalizeScope(raw={}){
    const squad=text(raw.squadCode,'all').toUpperCase();
    return Object.freeze({
      competence:text(raw.competence),
      squadCode:squad==='ALL'?'all':squad,
      comparison:['previous','3m','6m','12m'].includes(text(raw.comparison))?text(raw.comparison):'previous',
      demandUnit:normalizeDemandUnit(raw.demandUnit),
      competenceStatus:text(raw.competenceStatus,'draft')
    });
  }
  function normalizeAvailability(raw={}){
    return Object.freeze({
      fte:bool(raw.fte),
      attendance:bool(raw.attendance),
      resolutions:bool(raw.resolutions),
      availabilityFactors:bool(raw.availabilityFactors),
      historicalCapacity:bool(raw.historicalCapacity)
    });
  }
  function observedPerFte(volume,fte){const v=Math.max(0,num(volume)),base=Math.max(0,num(fte));return base>0?v/base:null}
  function calculateAvailableFte(nominalFte,availabilityFactor){
    const fte=Math.max(0,num(nominalFte)),factor=clamp01(availabilityFactor);
    return factor==null?null:fte*factor;
  }
  function normalizeCapacityPerson(raw={}){
    const nominalFte=Math.max(0,num(raw.nominalFte??raw.fte)),availabilityFactor=clamp01(raw.availabilityFactor??raw.availability_factor),availableFte=calculateAvailableFte(nominalFte,availabilityFactor);
    return Object.freeze({
      id:text(raw.id),name:text(raw.name,'Sem nome'),squadCode:text(raw.squadCode??raw.squad_code).toUpperCase(),
      nominalFte,availabilityFactor,availableFte,
      unavailableFte:availableFte==null?null:Math.max(0,nominalFte-availableFte),
      availabilityComplete:availabilityFactor!=null||nominalFte===0
    });
  }
  function summarizeCapacityRows(rows=[]){
    const normalized=(rows||[]).map(normalizeCapacityPerson),peopleCount=normalized.length,nominalFte=normalized.reduce((sum,row)=>sum+row.nominalFte,0),missingRows=normalized.filter(row=>!row.availabilityComplete&&row.nominalFte>0),knownNominalFte=normalized.filter(row=>row.availabilityFactor!=null).reduce((sum,row)=>sum+row.nominalFte,0),knownAvailableFte=normalized.filter(row=>row.availableFte!=null).reduce((sum,row)=>sum+row.availableFte,0),complete=peopleCount>0&&missingRows.length===0;
    const availableFte=complete?knownAvailableFte:null,unavailableFte=availableFte==null?null:Math.max(0,nominalFte-availableFte),availabilityRate=availableFte!=null&&nominalFte>0?availableFte/nominalFte:null,availabilityCoverage=nominalFte>0?knownNominalFte/nominalFte:null;
    return Object.freeze({peopleCount,nominalFte,availableFte,unavailableFte,availabilityRate,availabilityCoverage,availabilityEntries:normalized.filter(row=>row.availabilityFactor!=null).length,availabilityMissing:missingRows.length,availabilityComplete:complete});
  }
  function buildAvailableCapacity(rows=[]){
    const normalized=(rows||[]).map(normalizeCapacityPerson),bySquad=new Map();
    for(const row of normalized){const code=row.squadCode||'SEM_SQUAD';if(!bySquad.has(code))bySquad.set(code,[]);bySquad.get(code).push(row);}
    const squads=[...bySquad.entries()].map(([squadCode,items])=>Object.freeze({squadCode,...summarizeCapacityRows(items)})).sort((a,b)=>a.squadCode.localeCompare(b.squadCode,'pt-BR'));
    return Object.freeze({summary:summarizeCapacityRows(normalized),rows:Object.freeze(normalized),squads:Object.freeze(squads)});
  }
  function buildFoundation(input={}){
    const scope=normalizeScope(input.scope),availability=normalizeAvailability(input.availability),raw=input.metrics||{};
    const nominalFte=Math.max(0,num(raw.nominalFte??raw.fte)),peopleCount=Math.max(0,Math.round(num(raw.peopleCount))),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions)),availableRaw=optionalNumber(raw.availableFte),availableFte=availability.availabilityFactors&&availableRaw!=null?Math.max(0,Math.min(nominalFte,availableRaw)):null;
    const demand=scope.demandUnit==='attendance'?attendance:resolutions;
    const demandAvailable=scope.demandUnit==='attendance'?availability.attendance:availability.resolutions;
    const metrics=Object.freeze({
      nominalFte,peopleCount,attendance,resolutions,demand,demandUnit:scope.demandUnit,
      attendancePerNominalFte:availability.attendance?observedPerFte(attendance,nominalFte):null,
      resolutionsPerNominalFte:availability.resolutions?observedPerFte(resolutions,nominalFte):null,
      availableFte,
      unavailableFte:availableFte==null?null:Math.max(0,nominalFte-availableFte),
      availabilityRate:availableFte!=null&&nominalFte>0?availableFte/nominalFte:null,
      theoreticalCapacity:null,
      usedCapacity:null,
      utilizationRate:null,
      requiredFte:null,
      capacityGap:null
    });
    const catalog=ROADMAP_CATALOG.map(item=>{
      const missing=item.requires.filter(key=>!availability[key]);
      const status=missing.length?'pending':item.id==='available-capacity'?'active':'base-ready';
      return Object.freeze({...item,status,missing:Object.freeze(missing)});
    });
    const coreReady=availability.fte&&demandAvailable;
    const warnings=[];
    if(!availability.fte)warnings.push('FTE nominal indisponível: a competência precisa ter força de trabalho estratégica atribuída.');
    if(!demandAvailable)warnings.push(`Base de ${scope.demandUnit==='attendance'?'atendimentos':'resoluções'} indisponível para o escopo selecionado.`);
    if(!availability.availabilityFactors)warnings.push('Disponibilidade incompleta: informe a porcentagem disponível de cada pessoa da competência para calcular o FTE disponível.');
    else warnings.push('FTE disponível = FTE nominal × disponibilidade da competência. A disponibilidade não altera salário, custos ou o FTE contratual.');
    if(!availability.historicalCapacity)warnings.push('Capacidade sustentável, utilização e FTE necessário permanecem sem cálculo até as próximas versões da Fase 4.');
    warnings.push('FTE nominal representa força equivalente cadastrada; não deve ser interpretado como quantidade de pessoas.');
    warnings.push('Zero informado é dado válido; ausência de fonte permanece indisponível e não é convertida em zero.');
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      phase:'Fase 4 — Capacidade',
      scope,availability,metrics,
      status:coreReady?'ready':(availability.fte||demandAvailable?'partial':'blocked'),
      catalog:Object.freeze(catalog),
      sources:Object.freeze(FOUNDATION_SOURCES.map(key=>Object.freeze({key,available:availability[key]}))),
      warnings:Object.freeze(warnings)
    });
  }

  return{RULE_VERSION,DEMAND_UNITS,FOUNDATION_SOURCES,ROADMAP_CATALOG,normalizeDemandUnit,normalizeScope,normalizeAvailability,observedPerFte,calculateAvailableFte,normalizeCapacityPerson,summarizeCapacityRows,buildAvailableCapacity,buildFoundation};
});
