(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyProduct=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='PS-0.3.0-product-cost';
  const UNCLASSIFIED_CODE='UNCLASSIFIED';
  const SOURCE_DOMAINS=Object.freeze([
    Object.freeze({id:'attendance',label:'Atendimentos',valueKind:'quantity',next:'V2.61.1'}),
    Object.freeze({id:'resolution',label:'Resoluções',valueKind:'quantity',next:'V2.61.1'}),
    Object.freeze({id:'people_cost',label:'Custo de pessoas',valueKind:'amount',next:'V2.61.2'}),
    Object.freeze({id:'operational_cost',label:'Custo operacional',valueKind:'amount',next:'V2.61.2'}),
    Object.freeze({id:'fte',label:'FTE',valueKind:'quantity',next:'V2.61.4'}),
    Object.freeze({id:'result',label:'Resultado econômico',valueKind:'amount',next:'V2.61.3'})
  ]);
  const SOURCE_DOMAIN_IDS=Object.freeze(new Set(SOURCE_DOMAINS.map(row=>row.id)));
  const DEMAND_METRICS=Object.freeze([
    Object.freeze({id:'attendance',label:'Atendimentos',shareBase:true}),
    Object.freeze({id:'client',label:'Clientes atendidos',shareBase:false}),
    Object.freeze({id:'ticket',label:'Chamados',shareBase:false}),
    Object.freeze({id:'resolution',label:'Resoluções',shareBase:false})
  ]);
  const CATALOG=Object.freeze([
    Object.freeze({id:'product-squad-foundation',label:'Fundação Produto/Squad',version:'V2.61.0',state:'ready'}),
    Object.freeze({id:'demand-by-product',label:'Demanda por Produto',version:'V2.61.1',state:'ready'}),
    Object.freeze({id:'cost-by-product',label:'Custo por Produto',version:'V2.61.2',state:'ready'}),
    Object.freeze({id:'result-by-product',label:'Resultado econômico por Produto',version:'V2.61.3',state:'planned'}),
    Object.freeze({id:'unit-economics-product',label:'Unit Economics por Produto',version:'V2.61.4',state:'planned'}),
    Object.freeze({id:'squad-comparison',label:'Comparativo entre Squads',version:'V2.61.5',state:'planned'}),
    Object.freeze({id:'product-squad-matrix',label:'Matriz Produto × Squad',version:'V2.61.6',state:'planned'}),
    Object.freeze({id:'mix-concentration',label:'Mix, concentração e dependência',version:'V2.61.7',state:'planned'}),
    Object.freeze({id:'product-squad-diagnostics',label:'Insights e diagnóstico Produto/Squad',version:'V2.61.8',state:'planned'}),
    Object.freeze({id:'product-squad-history-hardening',label:'Snapshots, histórico e hardening',version:'V2.61.9',state:'planned'})
  ]);

  function num(value){const n=Number(value);return Number.isFinite(n)?n:0}
  function optionalNumber(value){if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)?n:null}
  function text(value){return String(value??'').trim()}
  function cleanCode(value){return text(value).toUpperCase()}
  function clampPct(value){const n=optionalNumber(value);return n==null?null:Math.max(0,Math.min(100,n))}
  function normalizeScope(scope={}){return Object.freeze({competence:text(scope.competence),squadCode:cleanCode(scope.squadCode||'ALL')||'ALL',comparison:text(scope.comparison||'previous')||'previous'});}
  function normalizeProduct(raw={}){
    const aliases=Array.isArray(raw.aliases)?raw.aliases:[];
    return Object.freeze({
      id:text(raw.id),code:cleanCode(raw.code),name:text(raw.name),active:raw.active!==false,
      aliases:Object.freeze([...new Set(aliases.map(text).filter(Boolean))]),aliasCount:Math.max(0,num(raw.alias_count??raw.aliasCount??aliases.length)),
      source:text(raw.source)||'manual',createdAt:raw.created_at??raw.createdAt??null,updatedAt:raw.updated_at??raw.updatedAt??null
    });
  }
  function normalizeDomainRow(raw={}){
    const id=text(raw.domain??raw.id??raw.source_domain),sourceCount=Math.max(0,num(raw.source_count??raw.sourceCount)),full=Math.max(0,num(raw.fully_classified_count??raw.fullyClassifiedCount)),partial=Math.max(0,num(raw.partially_classified_count??raw.partiallyClassifiedCount)),unclassified=Math.max(0,num(raw.unclassified_count??raw.unclassifiedCount)),allocatedShare=Math.max(0,num(raw.allocated_share??raw.allocatedShare)),coverage=optionalNumber(raw.coverage_pct??raw.coveragePct),meta=SOURCE_DOMAINS.find(row=>row.id===id);
    return Object.freeze({id,label:meta?.label||id,valueKind:meta?.valueKind||'quantity',next:meta?.next||'',sourceCount,fullyClassifiedCount:full,partiallyClassifiedCount:partial,unclassifiedCount:unclassified,allocatedShare,coveragePct:coverage==null?(sourceCount>0?Math.min(100,allocatedShare/sourceCount*100):null):Math.max(0,Math.min(100,coverage))});
  }
  function normalizeFoundation(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},domains=Array.isArray(source.domains)?source.domains:[],products=Array.isArray(source.products)?source.products:[],sourceCount=Math.max(0,num(source.source_count??source.sourceCount)),allocatedShare=Math.max(0,num(source.allocated_share??source.allocatedShare)),coverage=optionalNumber(source.classification_coverage_pct??source.classificationCoveragePct);
    return Object.freeze({
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,
      competence:text(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',
      productCount:Math.max(0,num(source.product_count??source.productCount)),activeProductCount:Math.max(0,num(source.active_product_count??source.activeProductCount)),
      sourceCount,fullyClassifiedSourceCount:Math.max(0,num(source.fully_classified_source_count??source.fullyClassifiedSourceCount)),partiallyClassifiedSourceCount:Math.max(0,num(source.partially_classified_source_count??source.partiallyClassifiedSourceCount)),unclassifiedSourceCount:Math.max(0,num(source.unclassified_source_count??source.unclassifiedSourceCount)),
      allocatedShare,unclassifiedShare:Math.max(0,num(source.unclassified_share??source.unclassifiedShare)),
      classificationCoveragePct:coverage==null?(sourceCount>0?Math.min(100,allocatedShare/sourceCount*100):null):Math.max(0,Math.min(100,coverage)),
      products:Object.freeze(products.map(normalizeProduct).filter(row=>row.id||row.code)),
      domains:Object.freeze(SOURCE_DOMAINS.map(meta=>normalizeDomainRow(domains.find(row=>text(row.domain??row.id??row.source_domain)===meta.id)||{domain:meta.id})))
    });
  }
  function normalizeDemandRow(raw={}){
    const code=cleanCode(raw.product_code??raw.productCode)||UNCLASSIFIED_CODE,name=text(raw.product_name??raw.productName)||(code===UNCLASSIFIED_CODE?'Não classificado':code),unclassified=raw.unclassified===true||code===UNCLASSIFIED_CODE;
    return Object.freeze({
      productCode:code,productName:name,unclassified,
      attendance:Math.max(0,num(raw.attendance)),
      tickets:Math.max(0,num(raw.tickets??raw.ticket_count??raw.ticketCount)),
      clients:Math.max(0,num(raw.clients??raw.client_count??raw.clientCount)),
      resolutions:Math.max(0,num(raw.resolutions??raw.resolution_count??raw.resolutionCount))
    });
  }
  function normalizeDemand(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows.map(normalizeDemandRow):[],attendanceTotal=Math.max(0,num(source.attendance_total??source.attendanceTotal));
    return Object.freeze({
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,
      competence:text(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',
      attendanceTotal,attendanceClassified:Math.max(0,num(source.attendance_classified??source.attendanceClassified)),attendanceUnclassified:Math.max(0,num(source.attendance_unclassified??source.attendanceUnclassified)),attendanceCoveragePct:clampPct(source.attendance_coverage_pct??source.attendanceCoveragePct),
      ticketTotal:Math.max(0,num(source.ticket_total??source.ticketTotal)),ticketClassified:Math.max(0,num(source.ticket_classified??source.ticketClassified)),ticketUnclassified:Math.max(0,num(source.ticket_unclassified??source.ticketUnclassified)),ticketCoveragePct:clampPct(source.ticket_coverage_pct??source.ticketCoveragePct),
      clientTotal:Math.max(0,num(source.client_total??source.clientTotal)),clientClassified:Math.max(0,num(source.client_classified??source.clientClassified)),clientUnclassified:Math.max(0,num(source.client_unclassified??source.clientUnclassified)),clientCoveragePct:clampPct(source.client_coverage_pct??source.clientCoveragePct),
      resolutionTotal:Math.max(0,num(source.resolution_total??source.resolutionTotal)),resolutionClassified:Math.max(0,num(source.resolution_classified??source.resolutionClassified)),resolutionUnclassified:Math.max(0,num(source.resolution_unclassified??source.resolutionUnclassified)),resolutionCoveragePct:clampPct(source.resolution_coverage_pct??source.resolutionCoveragePct),
      attendanceSourceAvailable:source.attendance_source_available===true||source.attendanceSourceAvailable===true,
      ticketSourceAvailable:source.ticket_source_available===true||source.ticketSourceAvailable===true,
      clientSourceAvailable:source.client_source_available===true||source.clientSourceAvailable===true,
      resolutionSourceAvailable:source.resolution_source_available===true||source.resolutionSourceAvailable===true,
      rows:Object.freeze(rows)
    });
  }
  function buildDemand({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeDemand(aggregate),denominator=base.attendanceTotal;
    const rows=base.rows.map(row=>Object.freeze({...row,demandSharePct:denominator>0?row.attendance/denominator*100:null})).sort((a,b)=>Number(a.unclassified)-Number(b.unclassified)||b.attendance-a.attendance||a.productName.localeCompare(b.productName,'pt-BR'));
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:base.sourceAvailable?'ready':'pending',sourceAvailable:base.sourceAvailable,
      attendanceTotal:base.attendanceTotal,attendanceClassified:base.attendanceClassified,attendanceUnclassified:base.attendanceUnclassified,attendanceCoveragePct:base.attendanceCoveragePct,
      ticketTotal:base.ticketTotal,ticketClassified:base.ticketClassified,ticketUnclassified:base.ticketUnclassified,ticketCoveragePct:base.ticketCoveragePct,
      clientTotal:base.clientTotal,clientClassified:base.clientClassified,clientUnclassified:base.clientUnclassified,clientCoveragePct:base.clientCoveragePct,
      resolutionTotal:base.resolutionTotal,resolutionClassified:base.resolutionClassified,resolutionUnclassified:base.resolutionUnclassified,resolutionCoveragePct:base.resolutionCoveragePct,
      attendanceSourceAvailable:base.attendanceSourceAvailable,ticketSourceAvailable:base.ticketSourceAvailable,clientSourceAvailable:base.clientSourceAvailable,resolutionSourceAvailable:base.resolutionSourceAvailable,
      rows:Object.freeze(rows),
      warnings:Object.freeze([
        'Participação na demanda usa Atendimentos como denominador; Clientes, Chamados e Resoluções permanecem métricas independentes.',
        'Clientes atendidos nunca são inferidos de Atendimentos: a fonte precisa informar clientes únicos já deduplicados no escopo registrado.',
        'Chamados nunca são igualados automaticamente a Atendimentos. Sem uma fonte explícita de Chamados, o indicador permanece indisponível.',
        'Atendimentos e Resoluções podem ser sincronizados das fontes oficiais existentes; a classificação por Produto respeita os shares da Fundação.',
        'Qualquer volume sem atribuição de Produto permanece em Não classificado e continua no denominador da demanda.'
      ])
    });
  }

  function normalizeCostRow(raw={}){
    const code=cleanCode(raw.product_code??raw.productCode)||UNCLASSIFIED_CODE,name=text(raw.product_name??raw.productName)||(code===UNCLASSIFIED_CODE?'Não classificado':code),unclassified=raw.unclassified===true||code===UNCLASSIFIED_CODE;
    const peopleCost=Math.max(0,num(raw.people_cost??raw.peopleCost)),operationalCost=Math.max(0,num(raw.operational_cost??raw.operationalCost)),totalCost=Math.max(0,num(raw.total_cost??raw.totalCost??peopleCost+operationalCost));
    return Object.freeze({
      productCode:code,productName:name,unclassified,peopleCost,operationalCost,totalCost,
      attendance:Math.max(0,num(raw.attendance)),tickets:Math.max(0,num(raw.tickets)),clients:Math.max(0,num(raw.clients)),resolutions:Math.max(0,num(raw.resolutions))
    });
  }
  function normalizeCost(raw={}){
    const source=raw&&typeof raw==='object'?raw:{},rows=Array.isArray(source.rows)?source.rows.map(normalizeCostRow):[],totalCost=Math.max(0,num(source.total_cost??source.totalCost));
    return Object.freeze({
      sourceAvailable:source.source_available===true||source.sourceAvailable===true,
      competence:text(source.competence),squadCode:cleanCode(source.squad_code??source.squadCode)||'ALL',allocationDriver:text(source.allocation_driver??source.allocationDriver)||'attendance',sourceCount:Math.max(0,num(source.source_count??source.sourceCount)),
      peopleCost:Math.max(0,num(source.people_cost??source.peopleCost)),operationalCost:Math.max(0,num(source.operational_cost??source.operationalCost)),totalCost,
      classifiedCost:Math.max(0,num(source.classified_cost??source.classifiedCost)),unclassifiedCost:Math.max(0,num(source.unclassified_cost??source.unclassifiedCost)),costCoveragePct:clampPct(source.cost_coverage_pct??source.costCoveragePct),
      financialTotalCost:Math.max(0,num(source.financial_total_cost??source.financialTotalCost)),reconciliationGap:optionalNumber(source.reconciliation_gap??source.reconciliationGap)??0,
      attendanceSourceAvailable:source.attendance_source_available===true||source.attendanceSourceAvailable===true,
      resolutionSourceAvailable:source.resolution_source_available===true||source.resolutionSourceAvailable===true,
      clientSourceAvailable:source.client_source_available===true||source.clientSourceAvailable===true,
      rows:Object.freeze(rows)
    });
  }
  function buildCost({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeCost(aggregate),denominator=base.totalCost;
    const rows=base.rows.map(row=>Object.freeze({...row,
      costSharePct:denominator>0?row.totalCost/denominator*100:null,
      costPerAttendance:base.attendanceSourceAvailable&&row.attendance>0?row.totalCost/row.attendance:null,
      costPerResolution:base.resolutionSourceAvailable&&row.resolutions>0?row.totalCost/row.resolutions:null,
      costPerClient:base.clientSourceAvailable&&row.clients>0?row.totalCost/row.clients:null
    })).sort((a,b)=>Number(a.unclassified)-Number(b.unclassified)||b.totalCost-a.totalCost||a.productName.localeCompare(b.productName,'pt-BR'));
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:base.sourceAvailable?'ready':'pending',sourceAvailable:base.sourceAvailable,allocationDriver:base.allocationDriver,sourceCount:base.sourceCount,
      peopleCost:base.peopleCost,operationalCost:base.operationalCost,totalCost:base.totalCost,classifiedCost:base.classifiedCost,unclassifiedCost:base.unclassifiedCost,costCoveragePct:base.costCoveragePct,
      financialTotalCost:base.financialTotalCost,reconciliationGap:base.reconciliationGap,reconciled:Math.abs(base.reconciliationGap)<=0.01,
      attendanceSourceAvailable:base.attendanceSourceAvailable,resolutionSourceAvailable:base.resolutionSourceAvailable,clientSourceAvailable:base.clientSourceAvailable,
      rows:Object.freeze(rows),
      warnings:Object.freeze([
        'Cost to Serve = custo de pessoas + custo operacional atribuídos ao Produto; nenhuma receita entra nesta fórmula.',
        'Atendimentos por Produto são o driver padrão do rateio dentro de cada Squad na V2.61.2.',
        'A parcela de Atendimentos ainda Não classificada carrega a mesma parcela de custo e permanece visível.',
        'Custo por atendimento, resolução e cliente só é calculado quando o respectivo denominador existe e possui fonte válida.',
        'O custo total Produto + Não classificado deve reconciliar com o custo financeiro oficial da mesma competência e escopo.'
      ])
    });
  }

  function buildFoundation({scope={},aggregate={}}={}){
    const normalizedScope=normalizeScope(scope),base=normalizeFoundation(aggregate),catalog=CATALOG.map(item=>Object.freeze({...item,status:item.state==='ready'?'ready':'planned'}));
    const coverageReady=base.sourceCount>0&&base.classificationCoveragePct!=null;
    return Object.freeze({
      ruleVersion:RULE_VERSION,scope:normalizedScope,status:base.sourceAvailable?'ready':'pending',sourceAvailable:base.sourceAvailable,
      productCount:base.productCount,activeProductCount:base.activeProductCount,sourceCount:base.sourceCount,
      fullyClassifiedSourceCount:base.fullyClassifiedSourceCount,partiallyClassifiedSourceCount:base.partiallyClassifiedSourceCount,unclassifiedSourceCount:base.unclassifiedSourceCount,
      allocatedShare:base.allocatedShare,unclassifiedShare:base.unclassifiedShare,classificationCoveragePct:base.classificationCoveragePct,
      products:base.products,domains:base.domains,catalog:Object.freeze(catalog),
      readiness:Object.freeze({catalogReady:base.activeProductCount>0,sourceRegistryReady:base.sourceAvailable,coverageReady}),
      warnings:Object.freeze([
        'Produto é uma dimensão própria: nenhum atendimento, custo, FTE ou resultado muda de natureza ao ser associado a um produto.',
        'Uma fonte pode ser distribuída entre vários produtos, mas a soma das participações nunca pode ultrapassar 100%.',
        'Qualquer saldo ainda não atribuído permanece explicitamente como Não classificado; ele nunca é descartado do denominador de cobertura.',
        'Atendimentos, resoluções, custos, FTE e resultado econômico usam o mesmo contrato de fonte + atribuição para permitir reconciliação futura.',
        'A V2.61.2 ativa Custo por Produto usando Atendimentos como driver auditável; resultado econômico e unit economics continuam reservados às próximas versões.'
      ])
    });
  }

  return{RULE_VERSION,UNCLASSIFIED_CODE,SOURCE_DOMAINS,SOURCE_DOMAIN_IDS,DEMAND_METRICS,CATALOG,normalizeScope,normalizeProduct,normalizeDomainRow,normalizeFoundation,normalizeDemandRow,normalizeDemand,buildDemand,normalizeCostRow,normalizeCost,buildCost,buildFoundation};
});
