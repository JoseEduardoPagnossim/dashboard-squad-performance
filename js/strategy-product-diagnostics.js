(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoftenStrategyProductDiagnostics=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const RULE_VERSION='PS-0.9.0-product-diagnostics';
 const clean=v=>String(v??'').trim().toUpperCase();
 const valid=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
 const ratio=(a,b)=>valid(a)!=null&&valid(b)!=null&&Number(b)>0?Number(a)/Number(b):null;
 const percent=n=>`${(n*100).toFixed(1)}%`;
 const add=(items,entry)=>items.push(Object.freeze({id:entry.id,level:entry.level,title:entry.title,description:entry.description,evidence:Object.freeze(entry.evidence),scope:entry.scope,product:entry.product||null,squad:entry.squad||null,ruleVersion:RULE_VERSION}));
 function build({summaries=[],squadNames={},selectedSquad='all',selectedProduct='all'}={}){
  const cells=new Map(),warnings=[],issues=[];const seen=new Set();let excluded=0;
  for(const item of summaries){const squad=clean(item.squadCode);if(!squad||seen.has(squad)||selectedSquad!=='all'&&clean(selectedSquad)!==squad)continue;seen.add(squad);
   const view=item.view||{},agg=item.aggregate||{};
   if((agg.sourceAvailable!==true&&agg.source_available!==true)||!Array.isArray(view.rows)){excluded++;warnings.push(`${squad}: resumo por produto indisponível`);continue;}
   for(const row of view.rows){const product=clean(row.productCode||row.product_code);if(!product||row.unclassified===true||product==='UNCLASSIFIED'||product==='__UNCLASSIFIED__'||selectedProduct!=='all'&&clean(selectedProduct)!==product)continue;
    const itemCell={squad,product,productName:String(row.productName||row.product_name||product),squadName:String(squadNames[squad]||squad),attendance:view.attendanceSourceAvailable===true?valid(row.attendance):null,resolutions:view.resolutionSourceAvailable===true?valid(row.resolutions):null,cost:view.reconciled?.cost===false?null:valid(row.totalCost),fte:view.availabilityComplete===true&&view.fteReconciled!==false?valid(row.availableFte):null,direct:view.reconciled?.direct===false?null:valid(row.directRevenue),influenced:view.reconciled?.influenced===false?null:valid(row.influencedRevenue),protected:view.reconciled?.protected===false?null:valid(row.protectedRevenue)};
    if(!cells.has(product))cells.set(product,[]);cells.get(product).push(itemCell);
   }
  }
  for(const [product,rows] of cells){
   // Compare the same product across distinct squads; never infer a performance conclusion from a single row.
   const costRates=rows.map(r=>ratio(r.cost,r.attendance)).filter(v=>v!=null&&v>=0);
   const workRates=rows.map(r=>ratio(r.attendance,r.fte)).filter(v=>v!=null&&v>=0);
   const resolutionRates=rows.map(r=>ratio(r.resolutions,r.attendance)).filter(v=>v!=null&&v>=0&&v<=1);
   const costReference=costRates.length>=2?costRates.reduce((a,b)=>a+b,0)/costRates.length:null;
   const workReference=workRates.length>=2?workRates.reduce((a,b)=>a+b,0)/workRates.length:null;
   const resolutionReference=resolutionRates.length>=2?resolutionRates.reduce((a,b)=>a+b,0)/resolutionRates.length:null;
   for(const r of rows){const at=ratio(r.cost,r.attendance),prod=ratio(r.attendance,r.fte),resolution=ratio(r.resolutions,r.attendance),net=r.cost!=null&&r.direct!=null?r.direct-r.cost:null;
    const evidenceBase={product:r.productName,squad:r.squadName,attendance:r.attendance,cost:r.cost,fte:r.fte};
    // Thresholds are descriptive screening heuristics. Include a minimum volume and at least 2 valid peers.
    if(r.attendance>=10&&costReference!=null&&costReference>0&&at!=null&&at>=costReference*1.3){add(issues,{id:`high-cost:${product}:${r.squad}`,level:'attention',title:'Custo unitário acima da referência',description:`${r.squadName} apresenta custo por atendimento pelo menos 30% acima da média dos Squads com dados válidos para ${r.productName}. Investigar mix de casos, rateios e esforço antes de atribuir uma causa.`,scope:'product-squad',product,squad:r.squad,evidence:{...evidenceBase,costPerAttendance:at,peerMean:costReference,differencePct:(at/costReference-1)*100,peers:costRates.length}});}
    if(r.attendance>=10&&workReference!=null&&workReference>0&&prod!=null&&prod<=workReference*0.7){add(issues,{id:`low-throughput:${product}:${r.squad}`,level:'attention',title:'Atendimentos por FTE abaixo da referência',description:`${r.squadName} tem atendimentos por FTE pelo menos 30% abaixo da média dos Squads para ${r.productName}. Verificar complexidade e disponibilidade antes de interpretar como ociosidade.`,scope:'product-squad',product,squad:r.squad,evidence:{...evidenceBase,attendancePerFte:prod,peerMean:workReference,differencePct:(prod/workReference-1)*100,peers:workRates.length}});}
    if(r.attendance>=10&&resolutionReference!=null&&resolutionReference>0&&resolution!=null&&resolution<=resolutionReference*0.8){add(issues,{id:`low-resolution:${product}:${r.squad}`,level:'attention',title:'Resoluções por atendimento abaixo da referência',description:`${r.squadName} apresenta proporção de resoluções pelo menos 20% abaixo da média comparável em ${r.productName}. Não equivale automaticamente ao FCR oficial; confirmar critérios de resolução.`,scope:'product-squad',product,squad:r.squad,evidence:{...evidenceBase,resolutions:r.resolutions,resolutionsPerAttendance:resolution,peerMean:resolutionReference,peers:resolutionRates.length}});}
    if(r.attendance>=10&&net!=null&&net<0){add(issues,{id:`negative-direct:${product}:${r.squad}`,level:'observe',title:'Resultado direto líquido negativo',description:`Em ${r.productName}, a receita direta atribuída a ${r.squadName} é menor que o custo alocado. Receita influenciada ou protegida não deve ser somada para mudar esse resultado.`,scope:'product-squad',product,squad:r.squad,evidence:{...evidenceBase,directRevenue:r.direct,directNet:net,influencedRevenue:r.influenced,protectedRevenue:r.protected}});}
   }
  }
  const chosen=issues.sort((a,b)=>({attention:0,observe:1}[a.level]-{attention:0,observe:1}[b.level])||a.product.localeCompare(b.product)||a.squad.localeCompare(b.squad)||a.id.localeCompare(b.id));
  if(excluded)warnings.push('Os diagnósticos são parciais: uma ou mais fontes de Squad foram excluídas.');
  return Object.freeze({ruleVersion:RULE_VERSION,items:Object.freeze(chosen),warnings:Object.freeze(warnings),sourceCount:seen.size-excluded,partial:excluded>0,scannedProducts:cells.size,thresholds:Object.freeze({minAttendance:10,costGap:0.3,fteGap:0.3,resolutionGap:0.2})});
 }
 return {RULE_VERSION,build,ratio};
});
