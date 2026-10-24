(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyResult=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='RE-0.9.0-result-history';
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
    Object.freeze({id:'result-by-squad',label:'Resultado por Squad',version:'V2.60.5',state:'ready'}),
    Object.freeze({id:'result-roi',label:'ROI e retorno operacional',version:'V2.60.6',state:'ready'}),
    Object.freeze({id:'result-diagnostics',label:'Insights e diagnóstico de resultado',version:'V2.60.7',state:'ready'}),
    Object.freeze({id:'result-history',label:'Snapshots, histórico e evolução',version:'V2.60.8',state:'ready'})
  ]);
  const RESULT_DIAGNOSTIC_THRESHOLDS=Object.freeze({strongCoverage:1.25,breakEvenCoverage:1,nearBreakEvenCoverage:.85,materialImpactPerCost:1});

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
        'Resultado por técnico exige acesso a dados individuais estratégicos; ROI e retorno usam essa atribuição na camada V2.60.6.'
      ])
    });
  }


  function normalizeSquadResultRow(raw={}){
    return Object.freeze({
      squadCode:cleanCode(raw.squad_code??raw.squadCode)||'SEM SQUAD',
      technicianCount:nonNegative(raw.technician_count??raw.technicianCount),
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
  function normalizeSquadResultAggregate(raw={}){
    const rows=Array.isArray(raw.rows)?raw.rows.map(normalizeSquadResultRow).filter(row=>row.squadCode):[];
    return Object.freeze({
      sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,
      competence:text(raw.competence),squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',currency:cleanCode(raw.currency||'BRL')||'BRL',
      squadCount:nonNegative(raw.squad_count??raw.squadCount??rows.length),
      technicianCount:nonNegative(raw.technician_count??raw.technicianCount),
      participationCount:nonNegative(raw.participation_count??raw.participationCount),
      creditedEventCount:nonNegative(raw.credited_event_count??raw.creditedEventCount),
      directRevenue:nonNegative(raw.direct_revenue??raw.directRevenue),influencedRevenue:nonNegative(raw.influenced_revenue??raw.influencedRevenue),protectedRevenue:nonNegative(raw.protected_revenue??raw.protectedRevenue),
      directMrr:nonNegative(raw.direct_mrr??raw.directMrr),influencedMrr:nonNegative(raw.influenced_mrr??raw.influencedMrr),protectedMrr:nonNegative(raw.protected_mrr??raw.protectedMrr),
      rows:Object.freeze(rows)
    });
  }
  function buildSquadResults({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeSquadResultAggregate(aggregate),ready=base.sourceAvailable===true;
    const rows=Object.freeze([...base.rows].sort((a,b)=>b.participationCount-a.participationCount||a.squadCode.localeCompare(b.squadCode,'pt-BR')));
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:ready?'ready':'pending',sourceAvailable:ready,currency:base.currency,
      squadCount:base.squadCount,technicianCount:base.technicianCount,participationCount:base.participationCount,creditedEventCount:base.creditedEventCount,
      directRevenue:base.directRevenue,influencedRevenue:base.influencedRevenue,protectedRevenue:base.protectedRevenue,
      directMrr:base.directMrr,influencedMrr:base.influencedMrr,protectedMrr:base.protectedMrr,rows,
      warnings:Object.freeze([
        'Receita Direta, Influenciada e Protegida permanecem separadas por Squad e não formam um total econômico único.',
        'O rateio econômico é calculado antes do filtro de Squad, impedindo redistribuição retroativa ao trocar a visualização.',
        'Eventos compartilhados entre Squads respeitam attribution_share; o saldo sem percentual segue a mesma divisão determinística da visão por técnico.',
        'Resultado por Squad é visão agregada. ROI e retorno líquido usam esta consolidação na camada V2.60.6.'
      ])
    });
  }


  function nullableNumber(value){
    if(value===null||value===undefined||value==='')return null;
    const n=Number(value);return Number.isFinite(n)?n:null;
  }
  function normalizeRoiFields(raw={}){
    const totalCost=nonNegative(raw.total_cost??raw.totalCost),fte=nonNegative(raw.fte),directRevenue=nonNegative(raw.direct_revenue??raw.directRevenue),influencedRevenue=nonNegative(raw.influenced_revenue??raw.influencedRevenue),protectedRevenue=nonNegative(raw.protected_revenue??raw.protectedRevenue);
    const directNetRaw=nullableNumber(raw.direct_net_return??raw.directNetReturn),roiRaw=nullableNumber(raw.direct_roi_pct??raw.directRoiPct),coverageRaw=nullableNumber(raw.direct_cost_coverage??raw.directCostCoverage),influencedImpactRaw=nullableNumber(raw.influenced_impact_per_cost??raw.influencedImpactPerCost),protectedImpactRaw=nullableNumber(raw.protected_impact_per_cost??raw.protectedImpactPerCost),directPerFteRaw=nullableNumber(raw.direct_revenue_per_fte??raw.directRevenuePerFte),protectedMrrPerFteRaw=nullableNumber(raw.protected_mrr_per_fte??raw.protectedMrrPerFte);
    return{
      totalCost,fte,directRevenue,influencedRevenue,protectedRevenue,
      directMrr:nonNegative(raw.direct_mrr??raw.directMrr),influencedMrr:nonNegative(raw.influenced_mrr??raw.influencedMrr),protectedMrr:nonNegative(raw.protected_mrr??raw.protectedMrr),
      directNetReturn:directNetRaw!=null?directNetRaw:(totalCost>0?directRevenue-totalCost:null),
      directRoiPct:roiRaw!=null?roiRaw:(totalCost>0?(directRevenue-totalCost)/totalCost*100:null),
      directCostCoverage:coverageRaw!=null?Math.max(0,coverageRaw):(totalCost>0?directRevenue/totalCost:null),
      influencedImpactPerCost:influencedImpactRaw!=null?Math.max(0,influencedImpactRaw):(totalCost>0?influencedRevenue/totalCost:null),
      protectedImpactPerCost:protectedImpactRaw!=null?Math.max(0,protectedImpactRaw):(totalCost>0?protectedRevenue/totalCost:null),
      directRevenuePerFte:directPerFteRaw!=null?Math.max(0,directPerFteRaw):(fte>0?directRevenue/fte:null),
      protectedMrrPerFte:protectedMrrPerFteRaw!=null?Math.max(0,protectedMrrPerFteRaw):(fte>0?nonNegative(raw.protected_mrr??raw.protectedMrr)/fte:null)
    };
  }
  function normalizeSquadRoiRow(raw={}){
    return Object.freeze({squadCode:cleanCode(raw.squad_code??raw.squadCode)||'SEM SQUAD',peopleCost:nonNegative(raw.people_cost??raw.peopleCost),operationalCost:nonNegative(raw.operational_cost??raw.operationalCost),...normalizeRoiFields(raw)});
  }
  function normalizeResultRoiAggregate(raw={}){
    const rows=Array.isArray(raw.rows)?raw.rows.map(normalizeSquadRoiRow).filter(row=>row.squadCode):[];
    return Object.freeze({sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,competence:text(raw.competence),squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',currency:cleanCode(raw.currency||'BRL')||'BRL',...normalizeRoiFields(raw),rows:Object.freeze(rows)});
  }
  function buildOperationalReturn({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeResultRoiAggregate(aggregate),ready=base.sourceAvailable===true;
    const rows=Object.freeze([...base.rows].sort((a,b)=>{
      const ar=a.directRoiPct==null?-Infinity:a.directRoiPct,br=b.directRoiPct==null?-Infinity:b.directRoiPct;return br-ar||b.directRevenue-a.directRevenue||a.squadCode.localeCompare(b.squadCode,'pt-BR');
    }));
    return Object.freeze({ruleVersion:RULE_VERSION,scope:normalizedScope,status:ready?'ready':'pending',sourceAvailable:ready,currency:base.currency,totalCost:base.totalCost,fte:base.fte,directRevenue:base.directRevenue,influencedRevenue:base.influencedRevenue,protectedRevenue:base.protectedRevenue,directNetReturn:base.directNetReturn,directRoiPct:base.directRoiPct,directCostCoverage:base.directCostCoverage,influencedImpactPerCost:base.influencedImpactPerCost,protectedImpactPerCost:base.protectedImpactPerCost,directRevenuePerFte:base.directRevenuePerFte,protectedMrrPerFte:base.protectedMrrPerFte,rows,warnings:Object.freeze([
      'ROI e retorno líquido usam somente Receita Direta confirmada como numerador econômico.',
      'Receita Influenciada e Protegida permanecem independentes e são exibidas apenas como impacto por R$ de custo.',
      'ROI direto = (Receita Direta - custo) / custo. Cobertura direta = Receita Direta / custo.',
      'Squad e operação usam custo total; o custo individual do técnico usa somente seu custo pessoal registrado.',
      'Sem custo válido, ROI e razões por custo ficam indisponíveis em vez de assumir custo zero.'
    ])});
  }
  function normalizeTechnicianRoiRow(raw={}){
    return Object.freeze({technicianKey:text(raw.technician_key??raw.technicianKey),personId:text(raw.person_id??raw.personId)||null,userId:text(raw.user_id??raw.userId)||null,technicianName:text(raw.technician_name??raw.technicianName,'Sem identificação'),squadCode:cleanCode(raw.squad_code??raw.squadCode),costAvailable:raw.cost_available===true||raw.costAvailable===true,...normalizeRoiFields(raw)});
  }
  function normalizeTechnicianRoiAggregate(raw={}){
    const rows=Array.isArray(raw.rows)?raw.rows.map(normalizeTechnicianRoiRow).filter(row=>row.technicianKey||row.personId||row.userId):[];
    const directNetRaw=nullableNumber(raw.direct_net_return??raw.directNetReturn),roiRaw=nullableNumber(raw.direct_roi_pct??raw.directRoiPct),coverageRaw=nullableNumber(raw.direct_cost_coverage??raw.directCostCoverage);
    return Object.freeze({sourceAvailable:raw.source_available===true||raw.sourceAvailable===true,competence:text(raw.competence),squadCode:cleanCode(raw.squad_code??raw.squadCode)||'ALL',currency:cleanCode(raw.currency||'BRL')||'BRL',technicianCount:nonNegative(raw.technician_count??raw.technicianCount??rows.length),costedTechnicianCount:nonNegative(raw.costed_technician_count??raw.costedTechnicianCount),technicianCostTotal:nonNegative(raw.technician_cost_total??raw.technicianCostTotal),directRevenue:nonNegative(raw.direct_revenue??raw.directRevenue),influencedRevenue:nonNegative(raw.influenced_revenue??raw.influencedRevenue),protectedRevenue:nonNegative(raw.protected_revenue??raw.protectedRevenue),directNetReturn:directNetRaw,directRoiPct:roiRaw,directCostCoverage:coverageRaw,rows:Object.freeze(rows)});
  }
  function buildTechnicianOperationalReturn({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeTechnicianRoiAggregate(aggregate),ready=base.sourceAvailable===true;
    const rows=Object.freeze([...base.rows].sort((a,b)=>{const ar=a.directRoiPct==null?-Infinity:a.directRoiPct,br=b.directRoiPct==null?-Infinity:b.directRoiPct;return br-ar||b.directRevenue-a.directRevenue||a.technicianName.localeCompare(b.technicianName,'pt-BR');}));
    return Object.freeze({ruleVersion:RULE_VERSION,scope:normalizedScope,status:ready?'ready':'pending',sourceAvailable:ready,currency:base.currency,technicianCount:base.technicianCount,costedTechnicianCount:base.costedTechnicianCount,technicianCostTotal:base.technicianCostTotal,directRevenue:base.directRevenue,influencedRevenue:base.influencedRevenue,protectedRevenue:base.protectedRevenue,directNetReturn:base.directNetReturn,directRoiPct:base.directRoiPct,directCostCoverage:base.directCostCoverage,rows,warnings:Object.freeze([
      'ROI individual usa somente Receita Direta atribuída e custo pessoal do técnico.',
      'Influenciada/R$ custo e Protegida/R$ custo são indicadores de impacto, não ROI.',
      'Técnicos sem custo pessoal vinculado permanecem visíveis, mas com ROI indisponível.'
    ])});
  }

  function resultDiagnosticLabel(raw={},kind='squad'){
    if(kind==='operation')return 'Operação';
    if(kind==='technician')return text(raw.technicianName??raw.technician_name,'Sem identificação');
    const code=cleanCode(raw.squadCode??raw.squad_code);return code&&code!=='SEM SQUAD'?`Squad ${code}`:'Sem Squad';
  }
  function resultDiagnosticRule(fields){
    const t=RESULT_DIAGNOSTIC_THRESHOLDS,c=fields.directCostCoverage,inf=fields.influencedImpactPerCost,prot=fields.protectedImpactPerCost;
    if(c==null)return Object.freeze({code:'DATA_GAP',title:'BASE ECONÔMICA INCOMPLETA',tone:'neutral',priority:0,detail:'O custo necessário para interpretar retorno e cobertura não está disponível neste escopo.',nextStep:'Completar ou validar o custo da competência antes de interpretar retorno econômico.'});
    if(fields.directRevenue===0&&fields.influencedRevenue===0&&fields.protectedRevenue===0)return Object.freeze({code:'ECONOMIC_ATTRIBUTION_GAP',title:'CUSTO SEM RESULTADO ECONÔMICO ATRIBUÍDO',tone:'bad',priority:3,detail:'Há custo registrado, mas nenhuma contribuição econômica foi atribuída nesta competência. Isso não prova ausência de valor; pode indicar lacuna de registro ou atuação sem evento econômico mensurado.',nextStep:'Auditar cobertura dos lançamentos de Receita Direta, Influenciada e Protegida antes de concluir baixa performance.'});
    if(c>=t.strongCoverage)return Object.freeze({code:'DIRECT_RETURN_STRONG',title:'RETORNO DIRETO FORTE',tone:'good',priority:1,detail:'A Receita Direta cobre o custo com folga nesta competência. Influenciada e Protegida continuam como impactos complementares e não ampliam artificialmente o ROI.',nextStep:'Validar recorrência, concentração e repetibilidade do resultado antes de usar a leitura como referência de capacidade.'});
    if(c>=t.breakEvenCoverage)return Object.freeze({code:'DIRECT_RETURN_POSITIVE',title:'RETORNO DIRETO POSITIVO',tone:'good',priority:1,detail:'A Receita Direta cobre o custo do escopo. O resultado está acima do break-even direto sem depender da soma de receitas influenciadas ou protegidas.',nextStep:'Monitorar estabilidade do retorno e a origem das receitas para verificar se o desempenho é recorrente.'});
    if(c>=t.nearBreakEvenCoverage)return Object.freeze({code:'NEAR_BREAK_EVEN',title:'PRÓXIMO DO BREAK-EVEN DIRETO',tone:'warn',priority:2,detail:'A Receita Direta está próxima de cobrir o custo, mas ainda não alcança o break-even. Pequenas variações de custo ou conversão podem alterar a leitura.',nextStep:'Revisar custo, oportunidades em evolução e recorrência das receitas antes de qualquer ajuste estrutural.'});
    if(inf!=null&&inf>=t.materialImpactPerCost&&fields.influencedRevenue>fields.directRevenue&&fields.influencedRevenue>=fields.protectedRevenue)return Object.freeze({code:'INFLUENCE_CONVERSION_SIGNAL',title:'INFLUÊNCIA ALTA, RETORNO DIRETO BAIXO',tone:'warn',priority:3,detail:'O valor influenciado é relevante em relação ao custo, enquanto a Receita Direta ainda não cobre a operação. O dado não prova falha de conversão; sinaliza que o handoff, fechamento e a janela de reconhecimento merecem investigação.',nextStep:'Auditar oportunidades influenciadas, status de conversão, responsável pelo fechamento e competência em que a receita foi reconhecida.'});
    if(prot!=null&&prot>=t.materialImpactPerCost&&fields.protectedRevenue>fields.directRevenue)return Object.freeze({code:'PROTECTION_CONCENTRATION',title:'IMPACTO CONCENTRADO EM PROTEÇÃO',tone:'warn',priority:3,detail:'A operação preserva valor relevante, mas a Receita Direta não cobre o custo. Isso pode refletir um papel econômico de retenção e não deve ser tratado automaticamente como baixa performance comercial.',nextStep:'Separar a carga de retenção e validar MRR preservado, risco de churn e custo de proteção antes de comparar com metas de venda.'});
    return Object.freeze({code:'DIRECT_RETURN_BELOW_COST',title:'RETORNO DIRETO ABAIXO DO CUSTO',tone:'bad',priority:3,detail:'A Receita Direta atribuída não cobre o custo nesta competência. Receitas Influenciada e Protegida permanecem evidências separadas e não corrigem o ROI por soma.',nextStep:'Revisar mix de atividades, cobertura de registros, custo e geração de Receita Direta antes de definir ação gerencial.'});
  }
  function diagnoseResultRow(raw={},kind='squad'){
    const fields=normalizeRoiFields(raw),costAvailable=kind==='technician'?(raw.costAvailable===true||raw.cost_available===true):fields.totalCost>0,prepared={...fields,directCostCoverage:costAvailable?fields.directCostCoverage:null,influencedImpactPerCost:costAvailable?fields.influencedImpactPerCost:null,protectedImpactPerCost:costAvailable?fields.protectedImpactPerCost:null};
    const rule=resultDiagnosticRule(prepared);
    return Object.freeze({...rule,ready:prepared.directCostCoverage!=null,kind,label:resultDiagnosticLabel(raw,kind),squadCode:cleanCode(raw.squadCode??raw.squad_code),technicianKey:text(raw.technicianKey??raw.technician_key),evidence:Object.freeze({totalCost:prepared.totalCost,fte:prepared.fte,directRevenue:prepared.directRevenue,influencedRevenue:prepared.influencedRevenue,protectedRevenue:prepared.protectedRevenue,directNetReturn:prepared.directNetReturn,directRoiPct:prepared.directRoiPct,directCostCoverage:prepared.directCostCoverage,influencedImpactPerCost:prepared.influencedImpactPerCost,protectedImpactPerCost:prepared.protectedImpactPerCost}),causalGuardrail:'Diagnóstico baseado em sinais observados; não atribui causa sem evidência operacional adicional.'});
  }
  function summarizeResultDiagnostics(rows=[]){
    const list=(Array.isArray(rows)?rows:[]).filter(Boolean),critical=list.filter(row=>row.tone==='bad').length,attention=list.filter(row=>row.tone==='warn').length,healthy=list.filter(row=>row.tone==='good').length,dataGap=list.filter(row=>row.tone==='neutral'||row.ready===false).length,comparable=list.filter(row=>row.ready!==false&&row.tone!=='neutral').length,toneWeight={bad:4,warn:3,good:2,neutral:1};
    const priority=[...list].sort((a,b)=>(b.priority??0)-(a.priority??0)||(toneWeight[b.tone]||0)-(toneWeight[a.tone]||0)||(a.evidence?.directCostCoverage??Infinity)-(b.evidence?.directCostCoverage??Infinity))[0]||null;
    return Object.freeze({critical,attention,healthy,dataGap,comparable,total:list.length,priority});
  }
  function buildResultDiagnostics({scope={},operational={},technicians={}}={}){
    const normalizedScope=normalizeScope(scope),op=normalizeResultRoiAggregate(operational),tech=normalizeTechnicianRoiAggregate(technicians),scopeCode=normalizedScope.squadCode==='all'?'ALL':cleanCode(normalizedScope.squadCode);
    const operation=diagnoseResultRow({...op,sourceAvailable:op.sourceAvailable},'operation');
    let squads=op.rows.map(row=>diagnoseResultRow(row,'squad'));
    let technicianRows=tech.rows.map(row=>diagnoseResultRow(row,'technician'));
    if(scopeCode!=='ALL'){squads=squads.filter(row=>row.squadCode===scopeCode);technicianRows=technicianRows.filter(row=>row.squadCode===scopeCode);}
    const visible=[operation,...squads,...technicianRows],summary=summarizeResultDiagnostics(visible);
    return Object.freeze({ruleVersion:RULE_VERSION,thresholds:RESULT_DIAGNOSTIC_THRESHOLDS,scope:normalizedScope,status:op.sourceAvailable?'ready':'pending',operation,squads:Object.freeze(squads),technicians:Object.freeze(technicianRows),summary,warnings:Object.freeze([
      'Diagnósticos explicam combinações de sinais; não afirmam causa sem evidência adicional.',
      'ROI continua baseado somente em Receita Direta. Influenciada e Protegida são usadas como contexto econômico independente.',
      'Leituras individuais exigem custo pessoal disponível e permanecem protegidas pela permissão people_costs.',
      'Um alerta indica ponto de investigação gerencial, não decisão automática de contratação, corte ou cobrança.'
    ])});
  }


  function normalizeResultHistoryRow(raw={}){
    const source=raw&&typeof raw==='object'?raw:{};
    const optional=value=>value===null||value===undefined||value===''?null:num(value,null);
    return Object.freeze({
      competence:text(source.competence),status:text(source.status,'closed'),revision:nonNegative(source.revision),
      snapshotVersion:text(source.snapshot_version??source.snapshotVersion),ruleVersion:text(source.rule_version??source.ruleVersion),
      source:text(source.source,'close'),financialSnapshotRevision:nonNegative(source.financial_snapshot_revision??source.financialSnapshotRevision),
      snapshotFingerprint:text(source.snapshot_fingerprint??source.snapshotFingerprint),createdAt:source.created_at??source.createdAt??null,
      squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',creditedEventCount:nonNegative(source.credited_event_count??source.creditedEventCount),
      totalCost:nonNegative(source.total_cost??source.totalCost),fte:nonNegative(source.fte),
      directRevenue:nonNegative(source.direct_revenue??source.directRevenue),directMrr:nonNegative(source.direct_mrr??source.directMrr),directArr:nonNegative(source.direct_arr??source.directArr),
      influencedRevenue:nonNegative(source.influenced_revenue??source.influencedRevenue),influencedMrr:nonNegative(source.influenced_mrr??source.influencedMrr),influencedArr:nonNegative(source.influenced_arr??source.influencedArr),
      protectedRevenue:nonNegative(source.protected_revenue??source.protectedRevenue),protectedMrr:nonNegative(source.protected_mrr??source.protectedMrr),protectedArr:nonNegative(source.protected_arr??source.protectedArr),
      directNetReturn:optional(source.direct_net_return??source.directNetReturn),directRoiPct:optional(source.direct_roi_pct??source.directRoiPct),directCostCoverage:optional(source.direct_cost_coverage??source.directCostCoverage),
      influencedImpactPerCost:optional(source.influenced_impact_per_cost??source.influencedImpactPerCost),protectedImpactPerCost:optional(source.protected_impact_per_cost??source.protectedImpactPerCost)
    });
  }
  function normalizeResultHistory(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows:[];
    return Object.freeze({sourceAvailable:source.source_available===true||source.sourceAvailable===true,squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',snapshotVersion:text(source.snapshot_version??source.snapshotVersion),ruleVersion:text(source.rule_version??source.ruleVersion),rows:Object.freeze(rows.map(normalizeResultHistoryRow).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence)))});
  }
  function historyDelta(current,previous,key){
    if(!current||!previous)return null;
    const a=current[key],b=previous[key];
    if(a===null||a===undefined||b===null||b===undefined)return null;
    return num(a)-num(b);
  }
  function buildResultHistory({scope={},history={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeResultHistory(history),rows=[...base.rows];
    const latest=rows.at(-1)||null,previous=rows.length>1?rows.at(-2):null;
    const evolution=Object.freeze({
      competenceCount:rows.length,
      directRevenueDelta:historyDelta(latest,previous,'directRevenue'),
      influencedRevenueDelta:historyDelta(latest,previous,'influencedRevenue'),
      protectedRevenueDelta:historyDelta(latest,previous,'protectedRevenue'),
      directRoiPctDelta:historyDelta(latest,previous,'directRoiPct'),
      directCostCoverageDelta:historyDelta(latest,previous,'directCostCoverage'),
      totalCostDelta:historyDelta(latest,previous,'totalCost'),
      directRevenueChangePct:latest&&previous&&previous.directRevenue>0?((latest.directRevenue-previous.directRevenue)/previous.directRevenue)*100:null
    });
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:base.sourceAvailable?'ready':'pending',sourceAvailable:base.sourceAvailable,
      snapshotVersion:base.snapshotVersion||'RS-1.0.0',rows:Object.freeze(rows),latest,previous,evolution,
      warnings:Object.freeze([
        'Histórico usa somente snapshots de competências fechadas; competências passadas não são recalculadas com regras atuais.',
        'Receita Direta, Influenciada e Protegida permanecem séries independentes e não são somadas em um total econômico artificial.',
        'Snapshots legacy_backfill representam reconstrução com a melhor base disponível e devem ser lidos com essa ressalva.',
        'ROI histórico continua baseado somente em Receita Direta e no custo congelado da mesma revisão financeira.'
      ])
    });
  }


  return{RULE_VERSION,RESULT_DIAGNOSTIC_THRESHOLDS,RESULT_TYPES,DIRECT_REVENUE_CATEGORIES,DIRECT_CATEGORY_IDS,INFLUENCE_STAGES,INFLUENCE_STAGE_IDS,PROTECTED_REVENUE_TYPES,PROTECTED_TYPE_IDS,EVENT_STATUSES,CATALOG,normalizeType,normalizeStatus,normalizeDirectCategory,normalizeInfluenceStage,normalizeProtectedType,normalizeScope,normalizeEvent,normalizeAttribution,normalizeFoundationAggregate,buildFoundation,normalizeDirectCategoryAggregate,normalizeDirectRevenueAggregate,buildDirectRevenue,normalizeInfluenceStageAggregate,normalizeInfluencedRevenueAggregate,buildInfluencedRevenue,normalizeProtectedTypeAggregate,normalizeProtectedRevenueAggregate,buildProtectedRevenue,normalizeTechnicianResultRow,normalizeTechnicianResultAggregate,buildTechnicianResults,normalizeSquadResultRow,normalizeSquadResultAggregate,buildSquadResults,normalizeRoiFields,normalizeSquadRoiRow,normalizeResultRoiAggregate,buildOperationalReturn,normalizeTechnicianRoiRow,normalizeTechnicianRoiAggregate,buildTechnicianOperationalReturn,resultDiagnosticRule,diagnoseResultRow,summarizeResultDiagnostics,buildResultDiagnostics,normalizeResultHistoryRow,normalizeResultHistory,buildResultHistory};
});
