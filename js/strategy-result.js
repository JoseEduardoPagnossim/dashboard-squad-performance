(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyResult=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='RE-0.1.0-result-foundation';
  const RESULT_TYPES=Object.freeze({
    direct:Object.freeze({id:'direct',label:'Receita direta',version:'V2.60.1',description:'Receita comprovadamente atribuída à atuação do time.'}),
    influenced:Object.freeze({id:'influenced',label:'Receita influenciada',version:'V2.60.2',description:'Receita em que o time participou da origem, qualificação ou evolução, sem atribuição integral.'}),
    protected:Object.freeze({id:'protected',label:'Receita protegida',version:'V2.60.3',description:'Receita existente preservada por retenção, recuperação ou prevenção de cancelamento.'})
  });
  const EVENT_STATUSES=Object.freeze(['draft','confirmed','cancelled']);
  const CATALOG=Object.freeze([
    Object.freeze({id:'result-foundation',label:'Fundação de Resultado',version:'V2.60.0',state:'ready'}),
    Object.freeze({id:'direct-revenue',label:'Receita direta',version:'V2.60.1',state:'planned'}),
    Object.freeze({id:'influenced-revenue',label:'Receita influenciada',version:'V2.60.2',state:'planned'}),
    Object.freeze({id:'protected-revenue',label:'Receita protegida',version:'V2.60.3',state:'planned'}),
    Object.freeze({id:'result-by-technician',label:'Resultado por técnico',version:'V2.60.4',state:'planned'}),
    Object.freeze({id:'result-by-squad',label:'Resultado por Squad',version:'V2.60.5',state:'planned'}),
    Object.freeze({id:'result-roi',label:'ROI e retorno operacional',version:'V2.60.6',state:'planned'}),
    Object.freeze({id:'result-diagnostics',label:'Insights e diagnóstico de resultado',version:'V2.60.7',state:'planned'}),
    Object.freeze({id:'result-history',label:'Snapshots, histórico e evolução',version:'V2.60.8',state:'planned'})
  ]);

  function text(value,fallback=''){const out=String(value??'').trim();return out||fallback}
  function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function nonNegative(value){return Math.max(0,num(value))}
  function cleanCode(value){return text(value).toUpperCase()}
  function normalizeType(value){const id=text(value).toLowerCase();return Object.prototype.hasOwnProperty.call(RESULT_TYPES,id)?id:''}
  function normalizeStatus(value){const id=text(value).toLowerCase();return EVENT_STATUSES.includes(id)?id:'draft'}
  function normalizeScope(raw={}){
    const squadCode=cleanCode(raw.squadCode||raw.squad_code||'ALL');
    return Object.freeze({
      competence:text(raw.competence),
      squadCode:squadCode==='ALL'?'all':squadCode,
      comparison:text(raw.comparison,'previous')
    });
  }
  function normalizeEvent(raw={}){
    const metadata=raw.metadata&&typeof raw.metadata==='object'&&!Array.isArray(raw.metadata)?{...raw.metadata}:{};
    return Object.freeze({
      id:text(raw.id),
      competenceId:text(raw.competence_id??raw.competenceId),
      resultType:normalizeType(raw.result_type??raw.resultType),
      status:normalizeStatus(raw.status),
      occurredAt:raw.occurred_at??raw.occurredAt??null,
      grossAmount:nonNegative(raw.gross_amount??raw.grossAmount),
      monthlyRecurringAmount:nonNegative(raw.monthly_recurring_amount??raw.monthlyRecurringAmount),
      annualRecurringAmount:nonNegative(raw.annual_recurring_amount??raw.annualRecurringAmount),
      currency:cleanCode(raw.currency||'BRL')||'BRL',
      source:text(raw.source,'manual').toLowerCase(),
      sourceReference:text(raw.source_reference??raw.sourceReference),
      externalEntityType:text(raw.external_entity_type??raw.externalEntityType),
      externalEntityId:text(raw.external_entity_id??raw.externalEntityId),
      description:text(raw.description),
      metadata:Object.freeze(metadata)
    });
  }
  function normalizeAttribution(raw={}){
    const shareRaw=raw.attribution_share??raw.attributionShare;
    const share=shareRaw===null||shareRaw===undefined||shareRaw===''?null:Math.max(0,Math.min(1,num(shareRaw)));
    return Object.freeze({
      id:text(raw.id),eventId:text(raw.event_id??raw.eventId),personId:text(raw.person_id??raw.personId)||null,
      userId:text(raw.user_id_snapshot??raw.userId)||null,technicianName:text(raw.technician_name_snapshot??raw.technicianName),
      squadCode:cleanCode(raw.squad_code_snapshot??raw.squadCode),role:text(raw.attribution_role??raw.attributionRole,'contributor').toLowerCase(),
      attributionShare:share
    });
  }
  function normalizeFoundationAggregate(raw={}){
    const counts=raw.counts&&typeof raw.counts==='object'?raw.counts:{};
    const types=raw.types&&typeof raw.types==='object'?raw.types:{};
    return Object.freeze({
      sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,
      competence:text(raw.competence),squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',
      eventCount:nonNegative(raw.event_count??raw.eventCount??counts.total),
      confirmedCount:nonNegative(raw.confirmed_count??raw.confirmedCount??counts.confirmed),
      draftCount:nonNegative(raw.draft_count??raw.draftCount??counts.draft),
      cancelledCount:nonNegative(raw.cancelled_count??raw.cancelledCount??counts.cancelled),
      attributedCount:nonNegative(raw.attributed_count??raw.attributedCount),
      unattributedCount:nonNegative(raw.unattributed_count??raw.unattributedCount),
      sourceCount:nonNegative(raw.source_count??raw.sourceCount),
      directCount:nonNegative(raw.direct_count??raw.directCount??types.direct),
      influencedCount:nonNegative(raw.influenced_count??raw.influencedCount??types.influenced),
      protectedCount:nonNegative(raw.protected_count??raw.protectedCount??types.protected)
    });
  }
  function buildFoundation({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeFoundationAggregate(aggregate),sourceReady=base.sourceAvailable===true;
    const counts=Object.freeze({
      total:base.eventCount,confirmed:base.confirmedCount,draft:base.draftCount,cancelled:base.cancelledCount,
      attributed:base.attributedCount,unattributed:base.unattributedCount,sources:base.sourceCount,
      direct:base.directCount,influenced:base.influencedCount,protected:base.protectedCount
    });
    const typeCards=Object.freeze(Object.values(RESULT_TYPES).map(def=>Object.freeze({...def,count:counts[def.id]})));
    const catalog=Object.freeze(CATALOG.map(item=>Object.freeze({...item,status:item.id==='result-foundation'?(sourceReady?'ready':'pending'):'planned'})));
    const warnings=Object.freeze([
      'Receita direta, influenciada e protegida são naturezas econômicas diferentes e não devem ser somadas como “receita gerada”.',
      'A classificação do evento é explícita: o motor não converte automaticamente uma oportunidade influenciada em receita direta.',
      'Eventos cancelados ou estornados permanecem auditáveis, mas não devem compor métricas econômicas futuras.',
      'Evento econômico e atribuição são entidades separadas para evitar duplicidade quando várias pessoas participam do mesmo resultado.',
      'A V2.60.0 prepara a base e a auditoria; os cálculos monetários entram somente nas versões específicas da Fase 5.'
    ]);
    return Object.freeze({ruleVersion:RULE_VERSION,scope:normalizedScope,status:sourceReady?'ready':'pending',sourceAvailable:sourceReady,counts,typeCards,catalog,warnings});
  }

  return{RULE_VERSION,RESULT_TYPES,EVENT_STATUSES,CATALOG,normalizeType,normalizeStatus,normalizeScope,normalizeEvent,normalizeAttribution,normalizeFoundationAggregate,buildFoundation};
});
