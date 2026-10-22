(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyInsights=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const RULE_VERSION='SI-1.1.0';
  function foundationInsights(){return Object.freeze([Object.freeze({code:'STRATEGY_FINANCIAL_ENGINE_READY',tone:'info',title:'Resultado Executivo ativo',text:'Custos, produção e qualidade passam a ser lidos no mesmo contexto para apoiar decisões sem alterar o operacional.'})]);}
  function pct(value){return `${value>=0?'+':''}${(value*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`}
  function pp(value){return `${value>=0?'+':''}${(value*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p.`}
  function executiveInsights(analysis={},summary={},squads=[],meta={}){
    const out=[];
    if(meta?.status==='closed')out.push(Object.freeze({code:'CLOSED_SNAPSHOT_ACTIVE',tone:'positive',title:'Competência fechada e congelada',text:`Os indicadores usam o snapshot oficial${meta.snapshotRevision?` #${meta.snapshotRevision}`:''}; alterações posteriores em dados operacionais não reescrevem esta fotografia.`}));
    else if(meta?.status==='provisional')out.push(Object.freeze({code:'PROVISIONAL_COMPETENCE',tone:'info',title:'Competência ainda provisória',text:'Os indicadores já podem apoiar análise, mas permanecem sujeitos a alterações até o fechamento oficial.'}));
    else if(Number(summary.totalCost||0)>0)out.push(Object.freeze({code:'DRAFT_COMPETENCE',tone:'info',title:'Competência em preenchimento',text:'Há dados financeiros lançados, mas a competência ainda não foi consolidada por snapshot.'}));
    if(Number(summary.unallocatedOperationalCost||0)>0)out.push(Object.freeze({code:'UNALLOCATED_OPERATIONAL_COST',tone:'warning',title:'Há custo operacional sem rateio',text:'Existe custo operacional ainda não alocado. Regularize o rateio antes de fechar a competência ou usar comparações por Squad como base de decisão.'}));
    if(analysis?.available&&analysis?.window?.baseline){
      if(analysis.spread!=null&&analysis.spread>0.02&&analysis.qualityStatus==='preserved')out.push(Object.freeze({code:'HEALTHY_EFFICIENCY_GAIN',tone:'positive',title:'Ganho de eficiência com qualidade preservada',text:`A produção evoluiu ${pct(analysis.attendanceChange)} contra ${pct(analysis.costChange)} de custo, abrindo um spread de ${pp(analysis.spread)}.`}));
      else if(analysis.spread!=null&&analysis.spread>0.02&&analysis.qualityStatus!=='preserved')out.push(Object.freeze({code:'EFFICIENCY_QUALITY_ALERT',tone:'warning',title:'Ganho de produtividade exige atenção à qualidade',text:'A produção cresceu mais rápido que o custo, mas a qualidade não acompanhou o mesmo movimento. Avalie a sustentabilidade do ganho antes de expandir a meta.'}));
      else if(analysis.spread!=null&&analysis.spread<-0.02)out.push(Object.freeze({code:'COST_GROWING_FASTER',tone:'warning',title:'Custo cresce acima da produção',text:`O custo variou ${pct(analysis.costChange)} enquanto a produção variou ${pct(analysis.attendanceChange)}. O spread de eficiência ficou em ${pp(analysis.spread)}.`}));
      if(analysis.costPerAttendanceChange!=null&&analysis.costPerAttendanceChange<=-.05)out.push(Object.freeze({code:'UNIT_COST_IMPROVED',tone:'positive',title:'Custo unitário em melhora',text:`O custo por atendimento caiu ${Math.abs(analysis.costPerAttendanceChange*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}% frente à base de comparação.`}));
      if(analysis.evaluationDelta!=null&&analysis.evaluationDelta<=-.03)out.push(Object.freeze({code:'QUALITY_DROP',tone:'warning',title:'Queda relevante na taxa de avaliação',text:`A taxa de avaliação recuou ${Math.abs(analysis.evaluationDelta*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p. frente à base de comparação.`}));
    }
    const valid=(squads||[]).filter(r=>Number(r.attendance)>0&&Number.isFinite(Number(r.costPerAttendance)));
    if(valid.length>=2){
      const sorted=[...valid].sort((a,b)=>a.costPerAttendance-b.costPerAttendance),low=sorted[0],high=sorted.at(-1),gap=low.costPerAttendance>0?(high.costPerAttendance/low.costPerAttendance)-1:null;
      if(gap!=null&&gap>.15)out.push(Object.freeze({code:'SQUAD_COST_SPREAD',tone:'info',title:'Diferença relevante de custo unitário entre Squads',text:`O Squad ${high.squadCode} apresenta custo por atendimento ${Math.round(gap*100).toLocaleString('pt-BR')}% acima do Squad ${low.squadCode}. Use o desvio como ponto de investigação, não como ranking isolado.`}));
    }
    if(!out.length)out.push(Object.freeze({code:'NO_EXECUTIVE_ALERTS',tone:'neutral',title:'Sem desvio estratégico relevante',text:'Os principais indicadores não apresentam, neste momento, variações suficientes para gerar alerta automático.'}));
    return Object.freeze(out.slice(0,5));
  }
  function financialInsights(summary={},squads=[],meta={}){return executiveInsights({},summary,squads,meta)}
  return{RULE_VERSION,foundationInsights,executiveInsights,financialInsights};
});
