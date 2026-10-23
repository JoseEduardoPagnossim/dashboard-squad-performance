(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyCapacity=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='CA-0.4.0-utilization-bands';
  const DEMAND_UNITS=Object.freeze(['resolutions','attendance']);
  const FOUNDATION_SOURCES=Object.freeze(['fte','attendance','resolutions','availabilityFactors','historicalCapacity']);
  const ACTIVE_METRICS=Object.freeze(new Set(['available-capacity','used-capacity','utilization']));
  const UTILIZATION_BANDS=Object.freeze({below:0.90,above:1.10});
  const COMPARISON_MONTHS=Object.freeze({previous:1,'3m':3,'6m':6,'12m':12});
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
  function normalizeComparison(value){const key=text(value,'previous');return Object.prototype.hasOwnProperty.call(COMPARISON_MONTHS,key)?key:'previous'}
  function normalizeScope(raw={}){
    const squad=text(raw.squadCode,'all').toUpperCase();
    return Object.freeze({
      competence:text(raw.competence),
      squadCode:squad==='ALL'?'all':squad,
      comparison:normalizeComparison(raw.comparison),
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
  function calculateUsedCapacity(volume,availableFte,{sourceAvailable=true,availabilityComplete=true}={}){
    const demand=Math.max(0,num(volume)),fte=optionalNumber(availableFte);
    if(!sourceAvailable||!availabilityComplete||fte==null||fte<0)return Object.freeze({usedVolume:null,usedPerAvailableFte:null,ready:false,inconsistent:false});
    const normalizedFte=Math.max(0,fte),inconsistent=normalizedFte===0&&demand>0;
    return Object.freeze({
      usedVolume:inconsistent?null:demand,
      usedPerAvailableFte:!inconsistent&&normalizedFte>0?demand/normalizedFte:null,
      ready:!inconsistent,
      inconsistent
    });
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
  function normalizeUsedCapacityRow(raw={},options={}){
    const demandUnit=normalizeDemandUnit(options.demandUnit??raw.demandUnit),base=normalizeCapacityPerson(raw),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions));
    const attendanceSourceAvailable=raw.attendanceSourceAvailable===true||raw.attendance_source_available===true;
    const resolutionSourceAvailable=raw.resolutionSourceAvailable===true||raw.resolution_source_available===true||raw.sourceAvailable===true;
    const demand=demandUnit==='attendance'?attendance:resolutions,demandSourceAvailable=demandUnit==='attendance'?attendanceSourceAvailable:resolutionSourceAvailable;
    const used=calculateUsedCapacity(demand,base.availableFte,{sourceAvailable:base.availableFte===0?true:demandSourceAvailable,availabilityComplete:base.availabilityComplete});
    const inconsistent=used.inconsistent===true||(base.availableFte===0&&demandSourceAvailable&&demand>0);
    return Object.freeze({...base,attendance,resolutions,demand,demandUnit,attendanceSourceAvailable,resolutionSourceAvailable,demandSourceAvailable,usedVolume:inconsistent?null:used.usedVolume,usedPerAvailableFte:inconsistent?null:used.usedPerAvailableFte,usedCapacityReady:used.ready===true&&!inconsistent,inconsistent});
  }
  function summarizeCapacityRows(rows=[]){
    const normalized=(rows||[]).map(normalizeCapacityPerson),peopleCount=normalized.length,nominalFte=normalized.reduce((sum,row)=>sum+row.nominalFte,0),missingRows=normalized.filter(row=>!row.availabilityComplete&&row.nominalFte>0),knownNominalFte=normalized.filter(row=>row.availabilityFactor!=null).reduce((sum,row)=>sum+row.nominalFte,0),knownAvailableFte=normalized.filter(row=>row.availableFte!=null).reduce((sum,row)=>sum+row.availableFte,0),complete=peopleCount>0&&missingRows.length===0;
    const availableFte=complete?knownAvailableFte:null,unavailableFte=availableFte==null?null:Math.max(0,nominalFte-availableFte),availabilityRate=availableFte!=null&&nominalFte>0?availableFte/nominalFte:null,availabilityCoverage=nominalFte>0?knownNominalFte/nominalFte:null;
    return Object.freeze({peopleCount,nominalFte,availableFte,unavailableFte,availabilityRate,availabilityCoverage,availabilityEntries:normalized.filter(row=>row.availabilityFactor!=null).length,availabilityMissing:missingRows.length,availabilityComplete:complete});
  }
  function summarizeUsedCapacityRows(rows=[],options={}){
    const demandUnit=normalizeDemandUnit(options.demandUnit),normalized=(rows||[]).map(row=>normalizeUsedCapacityRow(row,{demandUnit}));
    const candidates=normalized.filter(row=>row.nominalFte>0),availabilityMissing=candidates.filter(row=>!row.availabilityComplete),active=candidates.filter(row=>row.availabilityComplete&&row.availableFte>0),sourceMissing=active.filter(row=>!row.demandSourceAvailable),inconsistent=normalized.filter(row=>row.inconsistent),availabilityComplete=candidates.length>0&&availabilityMissing.length===0,demandComplete=active.length>0&&sourceMissing.length===0,complete=availabilityComplete&&demandComplete&&inconsistent.length===0;
    const nominalFte=candidates.reduce((sum,row)=>sum+row.nominalFte,0),availableFte=availabilityComplete?candidates.reduce((sum,row)=>sum+Math.max(0,row.availableFte??0),0):null,coveredAvailableFte=active.filter(row=>row.demandSourceAvailable).reduce((sum,row)=>sum+Math.max(0,row.availableFte??0),0),usedVolume=complete?active.reduce((sum,row)=>sum+row.demand,0):null,usedPerAvailableFte=complete&&availableFte>0?usedVolume/availableFte:null,coverage=availableFte!=null&&availableFte>0?coveredAvailableFte/availableFte:null;
    return Object.freeze({peopleCount:normalized.length,candidateCount:candidates.length,activeCapacityCount:active.length,nominalFte,availableFte,usedVolume,usedPerAvailableFte,demandUnit,demandEntries:active.filter(row=>row.demandSourceAvailable).length,demandMissing:sourceMissing.length,demandComplete,availabilityMissing:availabilityMissing.length,availabilityComplete,coverage,inconsistentCount:inconsistent.length,complete});
  }
  function buildAvailableCapacity(rows=[]){
    const normalized=(rows||[]).map(normalizeCapacityPerson),bySquad=new Map();
    for(const row of normalized){const code=row.squadCode||'SEM_SQUAD';if(!bySquad.has(code))bySquad.set(code,[]);bySquad.get(code).push(row);}
    const squads=[...bySquad.entries()].map(([squadCode,items])=>Object.freeze({squadCode,...summarizeCapacityRows(items)})).sort((a,b)=>a.squadCode.localeCompare(b.squadCode,'pt-BR'));
    return Object.freeze({summary:summarizeCapacityRows(normalized),rows:Object.freeze(normalized),squads:Object.freeze(squads)});
  }
  function buildUsedCapacity(rows=[],options={}){
    const demandUnit=normalizeDemandUnit(options.demandUnit),normalized=(rows||[]).map(row=>normalizeUsedCapacityRow(row,{demandUnit})),bySquad=new Map();
    for(const row of normalized){const code=row.squadCode||'SEM_SQUAD';if(!bySquad.has(code))bySquad.set(code,[]);bySquad.get(code).push(row);}
    const squads=[...bySquad.entries()].map(([squadCode,items])=>Object.freeze({squadCode,...summarizeUsedCapacityRows(items,{demandUnit})})).sort((a,b)=>a.squadCode.localeCompare(b.squadCode,'pt-BR'));
    return Object.freeze({summary:summarizeUsedCapacityRows(normalized,{demandUnit}),rows:Object.freeze(normalized),squads:Object.freeze(squads)});
  }

  function competenceId(value){
    const m=String(value??'').trim().match(/^(\d{4})-(\d{2})/);return m?`${m[1]}-${m[2]}`:'';
  }
  function priorCompetences(competence,count){
    const id=competenceId(competence),m=id.match(/^(\d{4})-(\d{2})$/);if(!m)return[];
    const base=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,1)),out=[];
    for(let i=1;i<=count;i++){const d=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()-i,1));out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`);}
    return out;
  }
  function median(values=[]){
    const rows=(values||[]).map(optionalNumber).filter(v=>v!=null).sort((a,b)=>a-b);if(!rows.length)return null;const mid=Math.floor(rows.length/2);return rows.length%2?rows[mid]:(rows[mid-1]+rows[mid])/2;
  }
  function normalizeCapacityHistoryRow(raw={}){
    const availableFte=optionalNumber(raw.availableFte??raw.available_fte),usedVolume=optionalNumber(raw.usedCapacityVolume??raw.used_capacity_volume),usedPerFte=optionalNumber(raw.usedPerAvailableFte??raw.used_per_available_fte);
    return Object.freeze({
      competence:competenceId(raw.competence),squadCode:text(raw.squadCode??raw.squad_code,'ALL').toUpperCase(),status:text(raw.status,'closed'),
      availableFte:availableFte==null?null:Math.max(0,availableFte),usedCapacityVolume:usedVolume==null?null:Math.max(0,usedVolume),usedPerAvailableFte:usedPerFte==null?null:Math.max(0,usedPerFte),
      complete:raw.complete===true||raw.used_capacity_complete===true||raw.usedCapacityComplete===true,
      availabilityMissing:Math.max(0,num(raw.availabilityMissing??raw.availability_missing)),demandMissing:Math.max(0,num(raw.demandMissing??raw.used_capacity_missing)),inconsistentCount:Math.max(0,num(raw.inconsistentCount??raw.inconsistent_rows))
    });
  }
  function buildHistoricalReference(history=[],options={}){
    const comparison=normalizeComparison(options.comparison),requestedCount=COMPARISON_MONTHS[comparison],current=competenceId(options.competence),scope=text(options.squadCode,'ALL').toUpperCase()==='ALL'?'ALL':text(options.squadCode).toUpperCase(),expected=priorCompetences(current,requestedCount),normalized=(history||[]).map(normalizeCapacityHistoryRow),byKey=new Map(normalized.map(row=>[`${row.competence}|${row.squadCode}`,row]));
    const samples=expected.map(id=>byKey.get(`${id}|${scope}`)||null),valid=samples.filter(row=>row&&row.status==='closed'&&row.complete&&row.usedPerAvailableFte!=null&&row.availableFte>0),ready=current!==''&&samples.length===requestedCount&&valid.length===requestedCount;
    const referencePerFte=ready?median(valid.map(row=>row.usedPerAvailableFte)):null;
    return Object.freeze({comparison,scope,requestedCount,expectedCompetences:Object.freeze(expected),sampleCount:valid.length,missingCount:requestedCount-valid.length,samples:Object.freeze(valid),ready:ready&&referencePerFte!=null&&referencePerFte>0,referencePerFte:referencePerFte!=null&&referencePerFte>0?referencePerFte:null});
  }
  function classifyUtilization(rate){
    const value=optionalNumber(rate);if(value==null)return Object.freeze({status:'unavailable',label:'SEM REFERÊNCIA',tone:'neutral'});
    if(value<UTILIZATION_BANDS.below)return Object.freeze({status:'below',label:'ABAIXO DA CAPACIDADE',tone:'warn'});
    if(value>UTILIZATION_BANDS.above)return Object.freeze({status:'above',label:'ACIMA DA CAPACIDADE',tone:'bad'});
    return Object.freeze({status:'within',label:'DENTRO DA CAPACIDADE',tone:'good'});
  }
  function calculateUtilization({usedVolume,usedPerAvailableFte,availableFte,referencePerFte}={}){
    const volume=optionalNumber(usedVolume),intensity=optionalNumber(usedPerAvailableFte),fte=optionalNumber(availableFte),reference=optionalNumber(referencePerFte);
    const ready=volume!=null&&intensity!=null&&fte!=null&&fte>0&&reference!=null&&reference>0;
    if(!ready)return Object.freeze({ready:false,utilizationRate:null,sustainableCapacityVolume:null,balanceVolume:null,slackVolume:null,overloadVolume:null,...classifyUtilization(null)});
    const sustainableCapacityVolume=reference*fte,utilizationRate=intensity/reference,balanceVolume=sustainableCapacityVolume-volume,slackVolume=Math.max(0,balanceVolume),overloadVolume=Math.max(0,-balanceVolume),classification=classifyUtilization(utilizationRate);
    return Object.freeze({ready:true,utilizationRate,sustainableCapacityVolume,balanceVolume,slackVolume,overloadVolume,...classification});
  }
  function buildUtilization({current={},history=[],competence='',squadCode='ALL',comparison='previous'}={}){
    const reference=buildHistoricalReference(history,{competence,squadCode,comparison}),utilization=calculateUtilization({usedVolume:current.usedCapacityVolume??current.usedVolume,usedPerAvailableFte:current.usedPerAvailableFte,availableFte:current.availableFte,referencePerFte:reference.referencePerFte});
    return Object.freeze({reference,utilization,ready:reference.ready&&utilization.ready});
  }

  function buildFoundation(input={}){
    const scope=normalizeScope(input.scope),availability=normalizeAvailability(input.availability),raw=input.metrics||{};
    const nominalFte=Math.max(0,num(raw.nominalFte??raw.fte)),peopleCount=Math.max(0,Math.round(num(raw.peopleCount))),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions)),availableRaw=optionalNumber(raw.availableFte),availableFte=availability.availabilityFactors&&availableRaw!=null?Math.max(0,Math.min(nominalFte,availableRaw)):null;
    const demand=scope.demandUnit==='attendance'?attendance:resolutions,demandAvailable=scope.demandUnit==='attendance'?availability.attendance:availability.resolutions;
    const usedVolumeRaw=optionalNumber(raw.usedCapacityVolume??raw.used_capacity_volume),usedPerFteRaw=optionalNumber(raw.usedPerAvailableFte??raw.used_per_available_fte),usedComplete=raw.usedCapacityComplete===true||raw.used_capacity_complete===true;
    const usedCapacityVolume=usedComplete&&usedVolumeRaw!=null?Math.max(0,usedVolumeRaw):null,usedPerAvailableFte=usedComplete&&usedPerFteRaw!=null?Math.max(0,usedPerFteRaw):(usedComplete&&usedCapacityVolume!=null&&availableFte>0?usedCapacityVolume/availableFte:null);
    const referencePerFte=availability.historicalCapacity?optionalNumber(raw.referencePerFte??raw.sustainableReferencePerFte):null;
    const utilization=calculateUtilization({usedVolume:usedCapacityVolume,usedPerAvailableFte,availableFte,referencePerFte});
    const metrics=Object.freeze({
      nominalFte,peopleCount,attendance,resolutions,demand,demandUnit:scope.demandUnit,
      attendancePerNominalFte:availability.attendance?observedPerFte(attendance,nominalFte):null,
      resolutionsPerNominalFte:availability.resolutions?observedPerFte(resolutions,nominalFte):null,
      availableFte,
      unavailableFte:availableFte==null?null:Math.max(0,nominalFte-availableFte),
      availabilityRate:availableFte!=null&&nominalFte>0?availableFte/nominalFte:null,
      theoreticalCapacity:null,
      usedCapacity:usedCapacityVolume,
      usedCapacityVolume,
      usedPerAvailableFte,
      usedCapacityComplete:usedComplete,
      referencePerFte:referencePerFte!=null&&referencePerFte>0?referencePerFte:null,
      historicalSampleCount:Math.max(0,num(raw.historicalSampleCount)),
      sustainableCapacityVolume:utilization.sustainableCapacityVolume,
      utilizationRate:utilization.utilizationRate,
      capacityBalance:utilization.balanceVolume,
      slackVolume:utilization.slackVolume,
      overloadVolume:utilization.overloadVolume,
      utilizationStatus:utilization.status,
      requiredFte:null,
      capacityGap:null
    });
    const catalog=ROADMAP_CATALOG.map(item=>{
      const missing=item.requires.filter(key=>!availability[key]);
      const status=missing.length?'pending':ACTIVE_METRICS.has(item.id)?'active':'base-ready';
      return Object.freeze({...item,status,missing:Object.freeze(missing)});
    });
    const coreReady=availability.fte&&demandAvailable;
    const warnings=[];
    if(!availability.fte)warnings.push('FTE nominal indisponível: a competência precisa ter força de trabalho estratégica atribuída.');
    if(!demandAvailable)warnings.push(`Base de ${scope.demandUnit==='attendance'?'atendimentos':'resoluções'} indisponível para o escopo selecionado.`);
    if(!availability.availabilityFactors)warnings.push('Disponibilidade incompleta: informe a porcentagem disponível de cada pessoa da competência para calcular o FTE disponível.');
    else warnings.push('FTE disponível = FTE nominal × disponibilidade da competência. A disponibilidade não altera salário, custos ou o FTE contratual.');
    if(availability.availabilityFactors&&demandAvailable&&!usedComplete)warnings.push('Capacidade utilizada permanece indisponível enquanto houver FTE disponível sem uma base explícita de demanda/resolução.');
    else if(usedComplete)warnings.push('Capacidade utilizada representa a carga realmente absorvida: volume resolvido e volume por FTE disponível.');
    if(!availability.historicalCapacity)warnings.push('Utilização permanece indisponível até a janela selecionada possuir competências anteriores fechadas com disponibilidade e resoluções completas.');
    else warnings.push(`Utilização compara a carga atual com a mediana histórica da janela selecionada. Faixas: abaixo de ${Math.round(UTILIZATION_BANDS.below*100)}%, dentro entre ${Math.round(UTILIZATION_BANDS.below*100)}% e ${Math.round(UTILIZATION_BANDS.above*100)}%, acima de ${Math.round(UTILIZATION_BANDS.above*100)}%.`);
    warnings.push('A referência histórica observada não é meta automática nem capacidade contratual; ela representa o padrão sustentável disponível na base fechada comparável.');
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

  return{RULE_VERSION,DEMAND_UNITS,FOUNDATION_SOURCES,ROADMAP_CATALOG,UTILIZATION_BANDS,COMPARISON_MONTHS,normalizeDemandUnit,normalizeScope,normalizeAvailability,observedPerFte,calculateAvailableFte,calculateUsedCapacity,normalizeCapacityPerson,normalizeUsedCapacityRow,summarizeCapacityRows,summarizeUsedCapacityRows,buildAvailableCapacity,buildUsedCapacity,competenceId,priorCompetences,median,normalizeCapacityHistoryRow,buildHistoricalReference,classifyUtilization,calculateUtilization,buildUtilization,buildFoundation};
});
