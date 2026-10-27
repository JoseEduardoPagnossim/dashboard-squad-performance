(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SoftenStrategyProductSquadMatrix=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const RULE_VERSION='PS-0.7.0-product-squad-matrix';
 const positive=(n)=>Number.isFinite(Number(n))&&Number(n)>0?Number(n):null;
 const ratio=(a,b)=>Number.isFinite(Number(a))&&positive(b)!=null?Number(a)/Number(b):null;
 const normalizeCode=v=>String(v||'').trim().toUpperCase();
 const metrics=Object.freeze({attendance:{label:'Atendimentos',direction:'none'},costPerAttendance:{label:'Custo / atendimento',direction:'min'},costPerResolution:{label:'Custo / resolução',direction:'min'},attendancePerFte:{label:'Atendimentos / FTE',direction:'max'},resolutionPerFte:{label:'Resoluções / FTE',direction:'max'},directRoi:{label:'ROI direto',direction:'max'},directNet:{label:'Resultado direto líquido',direction:'max'}});
 function build({summaries=[],squadNames={},selectedProduct='all',metric='costPerAttendance',includeUnclassified=false}={}){
  const metricKey=Object.hasOwn(metrics,metric)?metric:'costPerAttendance';const products=new Map(),codes=new Set(),warnings=[];
  for(const item of summaries){const code=normalizeCode(item.squadCode);if(!code||codes.has(code))continue;codes.add(code);
   const s=item.aggregate||{};if(!s.sourceAvailable&&!s.source_available){warnings.push(`${code}: resumo de produto indisponível`);continue;}
   const data=item.view||{};const rows=Array.isArray(data.rows)?data.rows:[];
   for(const row of rows){const productCode=normalizeCode(row.productCode||row.product_code);if(!productCode)continue;
    const unclassified=row.unclassified===true||productCode==='__UNCLASSIFIED__'||productCode==='UNCLASSIFIED';if(unclassified&&!includeUnclassified)continue;
    if(selectedProduct!=='all'&&productCode!==normalizeCode(selectedProduct))continue;
    if(!products.has(productCode))products.set(productCode,{code:productCode,name:String(row.productName||row.product_name||productCode),cells:new Map()});
    const attendance=Number(row.attendance)||0,resolutions=Number(row.resolutions)||0,cost=Number(row.totalCost)||0,direct=Number(row.directRevenue)||0,fte=row.availableFte;
    const complete=data.attendanceSourceAvailable===true&&data.availabilityComplete===true&&data.fteReconciled!==false;
    const cell={squadCode:code,squadName:String(squadNames[code]||code),productCode,attendance:data.attendanceSourceAvailable?attendance:null,resolutions:data.resolutionSourceAvailable?resolutions:null,totalCost:cost,availableFte:complete?fte:null,directRevenue:direct,influencedRevenue:Number(row.influencedRevenue)||0,protectedRevenue:Number(row.protectedRevenue)||0,
     costPerAttendance:data.attendanceSourceAvailable?ratio(cost,attendance):null,costPerResolution:data.resolutionSourceAvailable?ratio(cost,resolutions):null,attendancePerFte:complete?ratio(attendance,fte):null,resolutionPerFte:complete&&data.resolutionSourceAvailable?ratio(resolutions,fte):null,directNet:direct-cost,directRoi:ratio(direct-cost,cost),unclassified};
    products.get(productCode).cells.set(code,cell);
   }
  }
  const squads=[...codes].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const rows=[...products.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(p=>{
   const cells=squads.map(code=>p.cells.get(code)||null);const values=cells.map(c=>c?.[metricKey]).filter(v=>v!==null&&v!==undefined&&Number.isFinite(v));
   const direction=metrics[metricKey].direction;const min=values.length?Math.min(...values):null,max=values.length?Math.max(...values):null;
   return Object.freeze({code:p.code,name:p.name,cells:Object.freeze(cells.map(c=>{if(!c)return null;const value=c[metricKey];const comparable=value!=null&&Number.isFinite(value);return Object.freeze({...c,value,rank:!comparable||direction==='none'||values.length<2?'neutral':min===max?'tie':value===(direction==='min'?min:max)?'best':value===(direction==='min'?max:min)?'worst':'middle'});})),comparableCount:values.length});
  });
  return Object.freeze({ruleVersion:RULE_VERSION,metric:metricKey,metricLabel:metrics[metricKey].label,rows:Object.freeze(rows),squads:Object.freeze(squads),warnings:Object.freeze(warnings)});
 }
 return{RULE_VERSION,metrics,ratio,build};
});
