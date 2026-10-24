(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyResult=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='RE-0.5.0-technician-results';
  const RESULT_TYPES=Object.freeze({
    direct:Object.freeze({id:'direct',label:'Receita direta',version:'V2.60.1',description:'Receita comprovadamente atribuída à atuação do time.'}),
    influenced:Object.freeze({id:'influenced',label:'Receita influenciada',version:'V2.60.2',description:'Receita em que o time participou da origem, qualificação ou evolução, sem atribuição integral.'}),
    protected:Object.freeze({id:'protected',label:'Receita protegida',version:'V2.60.3',description:'Receita existente preservada por retenção, recuperação ou prevenção de cancelamento.'})
  });
  const DIRECT_REVENUE_CATEGORIES=Object.freeze([
    Object.freeze({id:'upsell',label:'Up-sell',description:'Incremento de receita fechado diretamente pelo time.'}),
    Object.freeze({id:'plan_upgrade',label:'Upgrade de plano',description:'Evolução para um plano de maior valor.'}),
    Object.freeze({id:'module_addon',label:'Módulo adicional',description:'Venda de módulo ou recurso adicional.'}),
    Object.freeze({id:'service',label:'Serviço avulso',description:'Serviço adicional cobrado fora da recorrência principal.'}),
    Object.freeze({id:'training',label:'Treinamento adicional',description:'Treinamento adicional vendido pelo time.'}),
    Object.freeze({id:'implementation',label:'Implantação / setup',description:'Implantação, setup ou configuração adicional cobrada.'}),
    Object.freeze({id:'direct_sale',label:'Venda direta',description:'Venda fechada diretamente pelo time fora das demais categorias.'}),
    Object.freeze({id:'other',label:'Outros',description:'Outra receita direta comprovada e documentada.'})
  ]);
  const DIRECT_CATEGORY_IDS=Object.freeze(DIRECT_REVENUE_CATEGORIES.map(item=>item.id));
  const INFLUENCE_STAGES=Object.freeze([
    Object.freeze({id:'originated',label:'Originou oportunidade',description:'O time identificou e gerou a oportunidade.'}),
    Object.freeze({id:'qualified',label:'Qualificou necessidade',description:'O time validou necessidade, impacto e aderência.'}),
    Object.freeze({id:'evolved',label:'Evoluiu oportunidade',description:'O time ajudou a oportunidade a avançar no processo.'}),
    Object.freeze({id:'negotiation_support',label:'Apoiou negociação',description:'O time forneceu apoio técnico ou operacional durante a negociação.'}),
    Object.freeze({id:'handoff',label:'Encaminhou oportunidade',description:'O time realizou o handoff qualificado para o setor responsável pelo fechamento.'}),
    Object.freeze({id:'other',label:'Outra influência',description:'Outra participação comprovada na geração ou evolução da receita.'})
  ]);
  const INFLUENCE_STAGE_IDS=Object.freeze(INFLUENCE_STAGES.map(item=>item.id));
  const PROTECTED_REVENUE_TYPES=Object.freeze([
    Object.freeze({id:'retention',label:'Retenção',description:'Cliente com intenção ou pedido de cancelamento que permaneceu ativo após atuação do time.'}),
    Object.freeze({id:'recovery',label:'Recuperação',description:'Receita ou cliente recuperado após risco de perda, interrupção ou saída.'}),
    Object.freeze({id:'cancellation_prevention',label:'Prevenção de cancelamento',description:'Atuação preventiva que neutralizou risco comprovado antes do cancelamento se concretizar.'})
  ]);
  const PROTECTED_TYPE_IDS=Object.freeze(PROTECTED_REVENUE_TYPES.map(item=>item.id));
  const EVENT_STATUSES=Object.freeze(['draft','confirmed','cancelled']);
  const CATALOG=Object.freeze([
    Object.freeze({id:'result-foundation',label:'Fundação de Resultado',version:'V2.60.0',state:'ready'}),
    Object.freeze({id:'direct-revenue',label:'Receita direta',version:'V2.60.1',state:'ready'}),
    Object.freeze({id:'influenced-revenue',label:'Receita influenciada',version:'V2.60.2',state:'ready'}),
    Object.freeze({id:'protected-revenue',label:'Receita protegida',version:'V2.60.3',state:'ready'}),
    Object.freeze({id:'result-by-technician',label:'Resultado por técnico',version:'V2.60.4',state:'ready'}),
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
  function normalizeDirectCategory(value){const id=text(value).toLowerCase();return DIRECT_CATEGORY_IDS.includes(id)?id:''}
  function normalizeInfluenceStage(value){const id=text(value).toLowerCase();return INFLUENCE_STAGE_IDS.includes(id)?id:''}
  function normalizeProtectedType(value){const id=text(value).toLowerCase();return PROTECTED_TYPE_IDS.includes(id)?id:''}
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
      directRevenueCategory:normalizeDirectCategory(raw.direct_revenue_category??raw.directRevenueCategory),
      influencedRevenueStage:normalizeInfluenceStage(raw.influenced_revenue_stage??raw.influencedRevenueStage),
      protectedRevenueType:normalizeProtectedType(raw.protected_revenue_type??raw.protectedRevenueType),
      protectionVerifiedAt:raw.protection_verified_at??raw.protectionVerifiedAt??null,
      protectionLostAt:raw.protection_lost_at??raw.protectionLostAt??null,
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
    const catalog=Object.freeze(CATALOG.map(item=>Object.freeze({...item,status:item.state==='ready'?(sourceReady?'ready':'pending'):'planned'})));
    const warnings=Object.freeze([
      'Receita direta, influenciada e protegida são naturezas econômicas diferentes e não devem ser somadas como “receita gerada”.',
      'A classificação do evento é explícita: o motor não converte automaticamente uma oportunidade influenciada em receita direta.',
      'Eventos cancelados ou estornados permanecem auditáveis, mas não compõem as métricas econômicas.',
      'Evento econômico e atribuição são entidades separadas para evitar duplicidade quando várias pessoas participam do mesmo resultado.',
      'Na Receita Direta, o total usa somente o valor confirmado do evento; MRR e ARR são exibidos separadamente e não são somados novamente.'
    ]);
    return Object.freeze({ruleVersion:RULE_VERSION,scope:normalizedScope,status:sourceReady?'ready':'pending',sourceAvailable:sourceReady,counts,typeCards,catalog,warnings});
  }

  function normalizeDirectCategoryAggregate(raw={}){
    const category=normalizeDirectCategory(raw.category??raw.direct_revenue_category??raw.id);
    return Object.freeze({
      category,
      eventCount:nonNegative(raw.event_count??raw.eventCount),
      revenueTotal:nonNegative(raw.revenue_total??raw.revenueTotal),
      monthlyRecurringAmount:nonNegative(raw.monthly_recurring_amount??raw.monthlyRecurringAmount),
      annualRecurringAmount:nonNegative(raw.annual_recurring_amount??raw.annualRecurringAmount)
    });
  }
  function normalizeDirectRevenueAggregate(raw={}){
    const categories=Array.isArray(raw.categories)?raw.categories.map(normalizeDirectCategoryAggregate).filter(row=>row.category):[];
    return Object.freeze({
      sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,
      competence:text(raw.competence),
      squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',
      currency:cleanCode(raw.currency||'BRL')||'BRL',
      eventCount:nonNegative(raw.event_count??raw.eventCount),
      revenueTotal:nonNegative(raw.revenue_total??raw.revenueTotal),
      monthlyRecurringAmount:nonNegative(raw.monthly_recurring_amount??raw.monthlyRecurringAmount),
      annualRecurringAmount:nonNegative(raw.annual_recurring_amount??raw.annualRecurringAmount),
      ticketAverage:nonNegative(raw.ticket_average??raw.ticketAverage),
      attributedEventCount:nonNegative(raw.attributed_event_count??raw.attributedEventCount),
      unattributedEventCount:nonNegative(raw.unattributed_event_count??raw.unattributedEventCount),
      sourceCount:nonNegative(raw.source_count??raw.sourceCount),
      categories:Object.freeze(categories)
    });
  }
  function buildDirectRevenue({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeDirectRevenueAggregate(aggregate),ready=base.sourceAvailable===true;
    const byCategory=new Map(base.categories.map(row=>[row.category,row]));
    const categories=Object.freeze(DIRECT_REVENUE_CATEGORIES.map(def=>Object.freeze({...def,...(byCategory.get(def.id)||{category:def.id,eventCount:0,revenueTotal:0,monthlyRecurringAmount:0,annualRecurringAmount:0})})));
    const eventCount=base.eventCount;
    const ticketAverage=eventCount>0?base.revenueTotal/eventCount:0;
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      scope:normalizedScope,
      status:ready?'ready':'pending',
      sourceAvailable:ready,
      currency:base.currency,
      eventCount,
      revenueTotal:base.revenueTotal,
      monthlyRecurringAmount:base.monthlyRecurringAmount,
      annualRecurringAmount:base.annualRecurringAmount,
      ticketAverage:base.ticketAverage>0?base.ticketAverage:ticketAverage,
      attributedEventCount:base.attributedEventCount,
      unattributedEventCount:base.unattributedEventCount,
      sourceCount:base.sourceCount,
      categories,
      warnings:Object.freeze([
        'Somente eventos de Receita Direta com status confirmado entram nos valores.',
        'Receita Direta Total = soma de gross_amount. Novo MRR e Novo ARR são indicadores paralelos e não são adicionados ao total.',
        'Up-sell é uma categoria nativa de Receita Direta.',
        'Quando o time apenas identifica ou encaminha a oportunidade e outro setor fecha, o evento deve ser Receita Influenciada, não Direta.',
        'O filtro de Squad nesta versão mostra eventos com participação atribuída ao Squad; a divisão econômica entre Squads entra na V2.60.5.'
      ])
    });
  }

  function normalizeInfluenceStageAggregate(raw={}){
    const stage=normalizeInfluenceStage(raw.stage??raw.influenced_revenue_stage??raw.id);
    return Object.freeze({
      stage,
      opportunityCount:nonNegative(raw.opportunity_count??raw.opportunityCount),
      draftCount:nonNegative(raw.draft_count??raw.draftCount),
      convertedCount:nonNegative(raw.converted_count??raw.convertedCount),
      cancelledCount:nonNegative(raw.cancelled_count??raw.cancelledCount),
      influencedRevenueTotal:nonNegative(raw.influenced_revenue_total??raw.influencedRevenueTotal),
      openPotentialAmount:nonNegative(raw.open_potential_amount??raw.openPotentialAmount)
    });
  }
  function normalizeInfluencedRevenueAggregate(raw={}){
    const stages=Array.isArray(raw.stages)?raw.stages.map(normalizeInfluenceStageAggregate).filter(row=>row.stage):[];
    return Object.freeze({
      sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,
      competence:text(raw.competence),
      squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',
      currency:cleanCode(raw.currency||'BRL')||'BRL',
      opportunityCount:nonNegative(raw.opportunity_count??raw.opportunityCount),
      draftCount:nonNegative(raw.draft_count??raw.draftCount),
      convertedCount:nonNegative(raw.converted_count??raw.convertedCount),
      cancelledCount:nonNegative(raw.cancelled_count??raw.cancelledCount),
      influencedRevenueTotal:nonNegative(raw.influenced_revenue_total??raw.influencedRevenueTotal),
      openPotentialAmount:nonNegative(raw.open_potential_amount??raw.openPotentialAmount),
      monthlyRecurringAmount:nonNegative(raw.monthly_recurring_amount??raw.monthlyRecurringAmount),
      annualRecurringAmount:nonNegative(raw.annual_recurring_amount??raw.annualRecurringAmount),
      conversionRate:Math.max(0,Math.min(1,num(raw.conversion_rate??raw.conversionRate))),
      attributedEventCount:nonNegative(raw.attributed_event_count??raw.attributedEventCount),
      unattributedEventCount:nonNegative(raw.unattributed_event_count??raw.unattributedEventCount),
      sourceCount:nonNegative(raw.source_count??raw.sourceCount),
      stages:Object.freeze(stages)
    });
  }
  function buildInfluencedRevenue({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeInfluencedRevenueAggregate(aggregate),ready=base.sourceAvailable===true;
    const byStage=new Map(base.stages.map(row=>[row.stage,row]));
    const stages=Object.freeze(INFLUENCE_STAGES.map(def=>Object.freeze({...def,...(byStage.get(def.id)||{stage:def.id,opportunityCount:0,draftCount:0,convertedCount:0,cancelledCount:0,influencedRevenueTotal:0,openPotentialAmount:0})})));
    const closed=base.convertedCount+base.cancelledCount,conversionRate=closed>0?base.convertedCount/closed:0;
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:ready?'ready':'pending',sourceAvailable:ready,currency:base.currency,
      opportunityCount:base.opportunityCount,draftCount:base.draftCount,convertedCount:base.convertedCount,cancelledCount:base.cancelledCount,
      influencedRevenueTotal:base.influencedRevenueTotal,openPotentialAmount:base.openPotentialAmount,monthlyRecurringAmount:base.monthlyRecurringAmount,annualRecurringAmount:base.annualRecurringAmount,
      conversionRate:base.conversionRate>0?base.conversionRate:conversionRate,attributedEventCount:base.attributedEventCount,unattributedEventCount:base.unattributedEventCount,sourceCount:base.sourceCount,stages,
      warnings:Object.freeze([
        'Oportunidade em andamento é pipeline influenciado, não receita realizada.',
        'Somente eventos influenciados confirmados entram em Receita Influenciada.',
        'Receita Influenciada permanece separada da Receita Direta e não deve ser somada como se o time tivesse fechado ambas.',
        'A referência externa identifica a oportunidade e impede que o mesmo evento seja registrado novamente como outra natureza econômica.',
        'A etapa de influência descreve como o time participou; ela não define percentual de crédito econômico.'
      ])
    });
  }


  function normalizeProtectedTypeAggregate(raw={}){
    const type=normalizeProtectedType(raw.type??raw.protected_revenue_type??raw.id);
    return Object.freeze({
      type,
      caseCount:nonNegative(raw.case_count??raw.caseCount),
      draftCount:nonNegative(raw.draft_count??raw.draftCount),
      protectedCount:nonNegative(raw.protected_count??raw.protectedCount),
      lostCount:nonNegative(raw.lost_count??raw.lostCount),
      protectedRevenueTotal:nonNegative(raw.protected_revenue_total??raw.protectedRevenueTotal),
      atRiskAmount:nonNegative(raw.at_risk_amount??raw.atRiskAmount),
      protectedMrr:nonNegative(raw.protected_mrr??raw.protectedMrr),
      protectedArr:nonNegative(raw.protected_arr??raw.protectedArr),
      atRiskMrr:nonNegative(raw.at_risk_mrr??raw.atRiskMrr),
      atRiskArr:nonNegative(raw.at_risk_arr??raw.atRiskArr)
    });
  }
  function normalizeProtectedRevenueAggregate(raw={}){
    const types=Array.isArray(raw.types)?raw.types.map(normalizeProtectedTypeAggregate).filter(row=>row.type):[];
    return Object.freeze({
      sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,
      competence:text(raw.competence),
      squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',
      currency:cleanCode(raw.currency||'BRL')||'BRL',
      caseCount:nonNegative(raw.case_count??raw.caseCount),
      draftCount:nonNegative(raw.draft_count??raw.draftCount),
      protectedCount:nonNegative(raw.protected_count??raw.protectedCount),
      lostCount:nonNegative(raw.lost_count??raw.lostCount),
      protectedRevenueTotal:nonNegative(raw.protected_revenue_total??raw.protectedRevenueTotal),
      atRiskAmount:nonNegative(raw.at_risk_amount??raw.atRiskAmount),
      protectedMrr:nonNegative(raw.protected_mrr??raw.protectedMrr),
      protectedArr:nonNegative(raw.protected_arr??raw.protectedArr),
      atRiskMrr:nonNegative(raw.at_risk_mrr??raw.atRiskMrr),
      atRiskArr:nonNegative(raw.at_risk_arr??raw.atRiskArr),
      protectionRate:Math.max(0,Math.min(1,num(raw.protection_rate??raw.protectionRate))),
      attributedEventCount:nonNegative(raw.attributed_event_count??raw.attributedEventCount),
      unattributedEventCount:nonNegative(raw.unattributed_event_count??raw.unattributedEventCount),
      sourceCount:nonNegative(raw.source_count??raw.sourceCount),
      types:Object.freeze(types)
    });
  }
  function buildProtectedRevenue({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeProtectedRevenueAggregate(aggregate),ready=base.sourceAvailable===true;
    const byType=new Map(base.types.map(row=>[row.type,row]));
    const types=Object.freeze(PROTECTED_REVENUE_TYPES.map(def=>Object.freeze({...def,...(byType.get(def.id)||{type:def.id,caseCount:0,draftCount:0,protectedCount:0,lostCount:0,protectedRevenueTotal:0,atRiskAmount:0,protectedMrr:0,protectedArr:0,atRiskMrr:0,atRiskArr:0})})));
    const closed=base.protectedCount+base.lostCount,protectionRate=closed>0?base.protectedCount/closed:0;
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:ready?'ready':'pending',sourceAvailable:ready,currency:base.currency,
      caseCount:base.caseCount,draftCount:base.draftCount,protectedCount:base.protectedCount,lostCount:base.lostCount,
      protectedRevenueTotal:base.protectedRevenueTotal,atRiskAmount:base.atRiskAmount,protectedMrr:base.protectedMrr,protectedArr:base.protectedArr,atRiskMrr:base.atRiskMrr,atRiskArr:base.atRiskArr,
      protectionRate:base.protectionRate>0?base.protectionRate:protectionRate,attributedEventCount:base.attributedEventCount,unattributedEventCount:base.unattributedEventCount,sourceCount:base.sourceCount,types,
      warnings:Object.freeze([
        'Receita Protegida mede valor existente preservado; não é nova venda e permanece separada da Receita Direta e Influenciada.',
        'Casos em acompanhamento são risco/pipeline de retenção e não entram como receita protegida até a permanência ser validada.',
        'Um caso confirmado precisa ter data de validação e valor preservado em receita do período, MRR ou ARR.',
        'Se a receita for perdida depois da confirmação, o evento deve ser marcado como perdido para deixar de compor a métrica ativa e permanecer auditável.',
        'MRR e ARR protegidos são indicadores paralelos e não são somados novamente à Receita Protegida Total.'
      ])
    });
  }


  function normalizeTechnicianResultRow(raw={}){
    return Object.freeze({
      technicianKey:text(raw.technician_key??raw.technicianKey),
      personId:text(raw.person_id??raw.personId)||null,
      userId:text(raw.user_id??raw.userId)||null,
      technicianName:text(raw.technician_name??raw.technicianName,'Sem identificação'),
      squadCode:cleanCode(raw.squad_code??raw.squadCode),
      participationCount:nonNegative(raw.participation_count??raw.participationCount),
      creditedEventCount:nonNegative(raw.credited_event_count??raw.creditedEventCount),
      directEventCount:nonNegative(raw.direct_event_count??raw.directEventCount),
      directRevenue:nonNegative(raw.direct_revenue??raw.directRevenue),
      directMrr:nonNegative(raw.direct_mrr??raw.directMrr),
      directArr:nonNegative(raw.direct_arr??raw.directArr),
      influencedEventCount:nonNegative(raw.influenced_event_count??raw.influencedEventCount),
      influencedRevenue:nonNegative(raw.influenced_revenue??raw.influencedRevenue),
      influencedMrr:nonNegative(raw.influenced_mrr??raw.influencedMrr),
      influencedArr:nonNegative(raw.influenced_arr??raw.influencedArr),
      protectedEventCount:nonNegative(raw.protected_event_count??raw.protectedEventCount),
      protectedRevenue:nonNegative(raw.protected_revenue??raw.protectedRevenue),
      protectedMrr:nonNegative(raw.protected_mrr??raw.protectedMrr),
      protectedArr:nonNegative(raw.protected_arr??raw.protectedArr),
      directShareUnits:nonNegative(raw.direct_share_units??raw.directShareUnits),
      influencedShareUnits:nonNegative(raw.influenced_share_units??raw.influencedShareUnits),
      protectedShareUnits:nonNegative(raw.protected_share_units??raw.protectedShareUnits)
    });
  }
  function normalizeTechnicianResultAggregate(raw={}){
    const rows=Array.isArray(raw.rows)?raw.rows.map(normalizeTechnicianResultRow).filter(row=>row.technicianKey||row.personId||row.userId):[];
    return Object.freeze({
      sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,
      competence:text(raw.competence),squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',currency:cleanCode(raw.currency||'BRL')||'BRL',
      technicianCount:nonNegative(raw.technician_count??raw.technicianCount??rows.length),
      participationCount:nonNegative(raw.participation_count??raw.participationCount),
      creditedEventCount:nonNegative(raw.credited_event_count??raw.creditedEventCount),
      directRevenue:nonNegative(raw.direct_revenue??raw.directRevenue),influencedRevenue:nonNegative(raw.influenced_revenue??raw.influencedRevenue),protectedRevenue:nonNegative(raw.protected_revenue??raw.protectedRevenue),
      directMrr:nonNegative(raw.direct_mrr??raw.directMrr),influencedMrr:nonNegative(raw.influenced_mrr??raw.influencedMrr),protectedMrr:nonNegative(raw.protected_mrr??raw.protectedMrr),
      rows:Object.freeze(rows)
    });
  }
  function buildTechnicianResults({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeTechnicianResultAggregate(aggregate),ready=base.sourceAvailable===true;
    const rows=Object.freeze([...base.rows].sort((a,b)=>b.participationCount-a.participationCount||a.technicianName.localeCompare(b.technicianName,'pt-BR')));
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:ready?'ready':'pending',sourceAvailable:ready,currency:base.currency,
      technicianCount:base.technicianCount,participationCount:base.participationCount,creditedEventCount:base.creditedEventCount,
      directRevenue:base.directRevenue,influencedRevenue:base.influencedRevenue,protectedRevenue:base.protectedRevenue,
      directMrr:base.directMrr,influencedMrr:base.influencedMrr,protectedMrr:base.protectedMrr,rows,
      warnings:Object.freeze([
        'As três naturezas permanecem separadas por técnico e não formam um total econômico único.',
        'attribution_share explícita tem precedência; o saldo sem percentual é dividido entre os demais participantes do mesmo evento.',
        'A soma dos créditos individuais de cada natureza nunca pode ultrapassar o valor do evento econômico.',
        'Resultado por técnico exige acesso a dados individuais estratégicos; ROI e comparação com custo entram somente na V2.60.6.'
      ])
    });
  }


  return{RULE_VERSION,RESULT_TYPES,DIRECT_REVENUE_CATEGORIES,DIRECT_CATEGORY_IDS,INFLUENCE_STAGES,INFLUENCE_STAGE_IDS,PROTECTED_REVENUE_TYPES,PROTECTED_TYPE_IDS,EVENT_STATUSES,CATALOG,normalizeType,normalizeStatus,normalizeDirectCategory,normalizeInfluenceStage,normalizeProtectedType,normalizeScope,normalizeEvent,normalizeAttribution,normalizeFoundationAggregate,buildFoundation,normalizeDirectCategoryAggregate,normalizeDirectRevenueAggregate,buildDirectRevenue,normalizeInfluenceStageAggregate,normalizeInfluencedRevenueAggregate,buildInfluencedRevenue,normalizeProtectedTypeAggregate,normalizeProtectedRevenueAggregate,buildProtectedRevenue,normalizeTechnicianResultRow,normalizeTechnicianResultAggregate,buildTechnicianResults};
});
