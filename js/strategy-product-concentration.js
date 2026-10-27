(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoftenStrategyProductConcentration=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const RULE_VERSION='PS-0.8.0-mix-concentration';
 const METRICS=Object.freeze({attendance:{label:'Atendimentos',field:'attendance',flag:'attendanceSourceAvailable'},cost:{label:'Custo',field:'totalCost'},direct:{label:'Receita direta',field:'directRevenue',reconciled:'direct'},influenced:{label:'Receita influenciada',field:'influencedRevenue',reconciled:'influenced'},protected:{label:'Receita protegida',field:'protectedRevenue',reconciled:'protected'}});
 const code=v=>String(v??'').trim().toUpperCase();
 const number=v=>v==null||v===''?null:Number.isFinite(Number(v))?Number(v):null;
 const missing=v=>v==null||v==='';
 const safe=v=>{const n=number(v);return n!=null&&n>=0?n:null};
 function analyze({summaries=[],squadNames={},metric='attendance',selectedSquad='all'}={}){
  const key=Object.prototype.hasOwnProperty.call(METRICS,metric)?metric:'attendance',meta=METRICS[key];
  const productTotals=new Map(),squadTotals=new Map(),warnings=[],seen=new Set();let excluded=0;
  for(const item of summaries){const squad=code(item.squadCode);if(!squad||seen.has(squad)||selectedSquad!=='all'&&code(selectedSquad)!==squad)continue;seen.add(squad);
   const view=item.view||{},agg=item.aggregate||{};
   if((agg.sourceAvailable!==true&&agg.source_available!==true)||!Array.isArray(view.rows)||meta.flag&&view[meta.flag]!==true||meta.reconciled&&view.reconciled?.[meta.reconciled]===false||key==='cost'&&view.reconciled?.cost===false){warnings.push(`${squad}: fonte ausente ou sem reconciliação (${key})`);excluded++;continue;}
   const rows=view.rows;let squadSum=0,valid=true;
   for(const row of rows){const val=safe(row[meta.field]);if(val==null){valid=false;break;}squadSum+=val;}
   if(!valid){warnings.push(`${squad}: valores incompletos (${key})`);excluded++;continue;}
   squadTotals.set(squad,{code:squad,name:String(squadNames[squad]||squad),value:squadSum,products:[]});
   for(const row of rows){const product=code(row.productCode)||'UNCLASSIFIED',amount=safe(row[meta.field]);
    const unclassified=row.unclassified===true||['UNCLASSIFIED','__UNCLASSIFIED__'].includes(product);
    const p=productTotals.get(product)||{code:product,name:unclassified?'Não classificado':String(row.productName||product),value:0,unclassified,squads:[]};
    p.value+=amount;p.squads.push({code:squad,value:amount});productTotals.set(product,p);
    squadTotals.get(squad).products.push({code:product,value:amount,unclassified});
   }
  }
  const grand=[...squadTotals.values()].reduce((s,x)=>s+x.value,0);
  function sorted(rows,total){return rows.map(x=>({...x,share:total>0?x.value/total:null})).sort((a,b)=>b.value-a.value||a.code.localeCompare(b.code,'pt-BR'));}
  const products=sorted([...productTotals.values()],grand),squads=sorted([...squadTotals.values()],grand);
  const unclassified=products.filter(p=>p.unclassified).reduce((s,p)=>s+p.value,0);
  const classifiedProducts=products.filter(p=>!p.unclassified);
  const concentration=arr=>{const valid=arr.filter(r=>r.share!=null);return{top1:valid.length?valid[0].share:null,top3:valid.length?valid.slice(0,3).reduce((s,r)=>s+r.share,0):null,hhi:valid.length?valid.reduce((s,r)=>s+r.share*r.share,0):null};};
  const productStats=concentration(products),squadStats=concentration(squads);
  const dependencies=squads.map(s=>{const mix=sorted(s.products,s.value);const classified=mix.filter(r=>!r.unclassified);const main=classified[0]||null;return Object.freeze({squadCode:s.code,squadName:s.name,value:s.value,topProductCode:main?.code||null,topProductShare:main?.share??null,unclassifiedShare:mix.filter(r=>r.unclassified).reduce((a,r)=>a+(r.share||0),0),highConcentration:main?.share!=null&&main.share>=0.5,mix:Object.freeze(mix)});});
  const alerts=[];
  if(grand>0&&productStats.top1>=0.5)alerts.push('Um único produto concentra pelo menos 50% do indicador selecionado.');
  if(grand>0&&squadStats.top1>=0.5)alerts.push('Um único Squad concentra pelo menos 50% do indicador selecionado.');
  if(grand>0&&unclassified/grand>=0.1)alerts.push('Pelo menos 10% do indicador está sem classificação de Produto.');
  if(excluded)alerts.push('Fontes incompletas: análise parcial; não interpretar os percentuais como totais da operação.');
  return Object.freeze({ruleVersion:RULE_VERSION,metric:key,metricLabel:meta.label,total:grand,partial:excluded>0,sourceCount:squads.length,excluded,products:Object.freeze(products),squads:Object.freeze(squads),classifiedProducts:Object.freeze(classifiedProducts),unclassified,unclassifiedShare:grand>0?unclassified/grand:null,productStats,squadStats,dependencies:Object.freeze(dependencies),alerts:Object.freeze(alerts),warnings:Object.freeze(warnings)});
 }
 return{RULE_VERSION,METRICS,analyze};
});
