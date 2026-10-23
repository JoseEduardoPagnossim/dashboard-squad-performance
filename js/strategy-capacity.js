(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCapacity=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='CA-0.1.0-capacity-foundation';
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
  function bool(value){return value===true}
  function text(value,fallback=''){const out=String(value??'').trim();return out||fallback}
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
  function buildFoundation(input={}){
    const scope=normalizeScope(input.scope),availability=normalizeAvailability(input.availability),raw=input.metrics||{};
    const nominalFte=Math.max(0,num(raw.nominalFte??raw.fte)),peopleCount=Math.max(0,Math.round(num(raw.peopleCount))),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions));
    const demand=scope.demandUnit==='attendance'?attendance:resolutions;
    const demandAvailable=scope.demandUnit==='attendance'?availability.attendance:availability.resolutions;
    const metrics=Object.freeze({
      nominalFte,peopleCount,attendance,resolutions,demand,demandUnit:scope.demandUnit,
      attendancePerNominalFte:availability.attendance?observedPerFte(attendance,nominalFte):null,
      resolutionsPerNominalFte:availability.resolutions?observedPerFte(resolutions,nominalFte):null,
      availableFte:null,
      theoreticalCapacity:null,
      usedCapacity:null,
      utilizationRate:null,
      requiredFte:null,
      capacityGap:null
    });
    const catalog=ROADMAP_CATALOG.map(item=>{
      const missing=item.requires.filter(key=>!availability[key]);
      return Object.freeze({...item,status:missing.length?'pending':'base-ready',missing:Object.freeze(missing)});
    });
    const coreReady=availability.fte&&demandAvailable;
    const warnings=[];
    if(!availability.fte)warnings.push('FTE nominal indisponível: a competência precisa ter força de trabalho estratégica atribuída.');
    if(!demandAvailable)warnings.push(`Base de ${scope.demandUnit==='attendance'?'atendimentos':'resoluções'} indisponível para o escopo selecionado.`);
    if(!availability.availabilityFactors)warnings.push('Fatores de disponibilidade ainda não fazem parte da V2.59.0; férias, afastamentos e disponibilidade parcial entram na V2.59.1.');
    if(!availability.historicalCapacity)warnings.push('A fundação não estima capacidade sustentável nem FTE necessário. Essa referência será construída nas versões seguintes da Fase 4.');
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

  return{RULE_VERSION,DEMAND_UNITS,FOUNDATION_SOURCES,ROADMAP_CATALOG,normalizeDemandUnit,normalizeScope,normalizeAvailability,observedPerFte,buildFoundation};
});
