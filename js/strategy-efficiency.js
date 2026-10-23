(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyEfficiency=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const RULE_VERSION='EF-0.8.0-snapshots-history';
  const SNAPSHOT_VERSION='ES-1.0.0';
  const DIAGNOSTIC_THRESHOLDS=Object.freeze({efficiencyTolerance:.05,resolutionTolerance:.05,qualityTolerance:.03,ratingTolerance:.3});
  const COVERAGE_KEYS=Object.freeze(['financial','attendance','fte','quality','resolutions']);
  const METRIC_CATALOG=Object.freeze([
    Object.freeze({id:'cost-per-attendance',label:'Custo por atendimento',version:'V2.58.1',requires:Object.freeze(['financial','attendance'])}),
    Object.freeze({id:'cost-per-resolution',label:'Custo por resolução',version:'V2.58.2',requires:Object.freeze(['financial','resolutions'])}),
    Object.freeze({id:'economic-productivity-person',label:'Produtividade econômica por técnico',version:'V2.58.3',requires:Object.freeze(['financial','attendance','fte','resolutions'])}),
    Object.freeze({id:'economic-productivity-squad',label:'Produtividade econômica por Squad',version:'V2.58.4',requires:Object.freeze(['financial','attendance','fte','resolutions'])}),
    Object.freeze({id:'relative-efficiency-benchmarks',label:'Comparativos, benchmarks e eficiência relativa',version:'V2.58.5',requires:Object.freeze(['financial','attendance','fte','resolutions'])}),
    Object.freeze({id:'efficiency-diagnostics',label:'Insights e diagnóstico de eficiência',version:'V2.58.6',requires:Object.freeze(['financial','attendance','fte','resolutions'])}),
    Object.freeze({id:'efficiency-history',label:'Snapshots, histórico e evolução',version:'V2.58.8',requires:Object.freeze(['financial','attendance','fte','resolutions'])})
  ]);

  function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function bool(value){return value===true}
  function text(value,fallback=''){const out=String(value??'').trim();return out||fallback}
  function percent(value){return Math.max(0,Math.min(1,num(value)))}
  function normalizeScope(raw={}){
    const competence=text(raw.competence),squadCode=text(raw.squadCode,'all').toUpperCase();
    return Object.freeze({competence,squadCode:squadCode==='ALL'?'all':squadCode,comparison:text(raw.comparison,'previous'),competenceStatus:text(raw.competenceStatus,'draft')});
  }
  function normalizeAvailability(raw={}){
    return Object.freeze({
      financial:bool(raw.financial),
      attendance:bool(raw.attendance),
      fte:bool(raw.fte),
      quality:bool(raw.quality),
      resolutions:bool(raw.resolutions)
    });
  }
  function calculateCostPerAttendance(totalCost,attendance){
    const cost=Math.max(0,num(totalCost)),volume=Math.max(0,num(attendance));
    return volume>0?cost/volume:null;
  }
  function calculateCostPerResolution(totalCost,resolutions){
    const cost=Math.max(0,num(totalCost)),volume=Math.max(0,num(resolutions));
    return volume>0?cost/volume:null;
  }
  function calculateResolutionRate(resolutions,attendance){
    const resolved=Math.max(0,num(resolutions)),volume=Math.max(0,num(attendance));
    return volume>0?Math.min(1,resolved/volume):null;
  }
  function calculateEconomicProductivity(resolutions,totalCost,scale=1000){
    const resolved=Math.max(0,num(resolutions)),cost=Math.max(0,num(totalCost)),factor=Math.max(1,num(scale,1000));
    return cost>0?resolved*factor/cost:null;
  }
  function normalizeTechnicianProductivityRow(raw={}){
    const personalCost=Math.max(0,num(raw.personalCost??raw.totalCost??raw.total_cost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions)),fte=Math.max(0,num(raw.fte));
    const rating=Number(raw.avgRating??raw.avg_rating),evaluationCoverage=Number(raw.evaluationCoverage??raw.evaluation_coverage);
    return Object.freeze({
      id:text(raw.id||raw.userId||raw.user_id),
      name:text(raw.name||raw.label,'Sem identificação'),
      squadCode:text(raw.squadCode||raw.squad_code).toUpperCase(),
      personalCost,fte,attendance,resolutions,
      costPerAttendance:calculateCostPerAttendance(personalCost,attendance),
      costPerResolution:calculateCostPerResolution(personalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      economicProductivity:calculateEconomicProductivity(resolutions,personalCost),
      avgRating:Number.isFinite(rating)?Math.max(0,Math.min(5,rating)):null,
      evaluationCoverage:Number.isFinite(evaluationCoverage)?percent(evaluationCoverage):null,
      sourceAvailable:raw.sourceAvailable===true,
      linked:raw.linked===true
    });
  }
  function buildTechnicianProductivity(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeTechnicianProductivityRow);
    const ready=normalized.filter(row=>row.linked&&row.sourceAvailable&&row.personalCost>0);
    const ranked=ready.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.name.localeCompare(b.name,'pt-BR')).map((row,index)=>Object.freeze({...row,rank:index+1}));
    const totalCost=ready.reduce((sum,row)=>sum+row.personalCost,0),resolutions=ready.reduce((sum,row)=>sum+row.resolutions,0),attendance=ready.reduce((sum,row)=>sum+row.attendance,0);
    const ratingWeight=ready.reduce((sum,row)=>sum+(row.avgRating!=null&&row.resolutions>0?row.resolutions:0),0),weightedRating=ready.reduce((sum,row)=>sum+(row.avgRating!=null?row.avgRating*row.resolutions:0),0);
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      rows:Object.freeze(ranked),
      eligibleCount:ready.length,
      totalCost,resolutions,attendance,
      economicProductivity:calculateEconomicProductivity(resolutions,totalCost),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      avgRating:ratingWeight>0?weightedRating/ratingWeight:null
    });
  }
  function normalizeSquadProductivityRow(raw={}){
    const totalCost=Math.max(0,num(raw.totalCost??raw.total_cost)),peopleCost=Math.max(0,num(raw.peopleCost??raw.people_cost)),operationalCost=Math.max(0,num(raw.operationalCost??raw.operational_cost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions)),fte=Math.max(0,num(raw.fte));
    const evaluation=Number(raw.evaluationRate??raw.evaluation_rate),resolutionEntries=Math.max(0,num(raw.resolutionEntries??raw.resolution_entries));
    return Object.freeze({
      squadCode:text(raw.squadCode||raw.squad_code).toUpperCase(),
      label:text(raw.label||raw.name||raw.squadCode||raw.squad_code,'Sem identificação'),
      totalCost,peopleCost,operationalCost,fte,attendance,resolutions,resolutionEntries,
      costPerAttendance:calculateCostPerAttendance(totalCost,attendance),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      attendancePerFte:fte>0?attendance/fte:null,
      resolutionsPerFte:fte>0?resolutions/fte:null,
      economicProductivity:calculateEconomicProductivity(resolutions,totalCost),
      evaluationRate:Number.isFinite(evaluation)?percent(evaluation):null,
      sourceAvailable:raw.sourceAvailable===true||resolutionEntries>0
    });
  }
  function buildSquadProductivity(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeSquadProductivityRow);
    const ready=normalized.filter(row=>row.squadCode&&row.sourceAvailable&&row.totalCost>0);
    const ranked=ready.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.squadCode.localeCompare(b.squadCode,'pt-BR')).map((row,index)=>Object.freeze({...row,rank:index+1}));
    const totalCost=ready.reduce((sum,row)=>sum+row.totalCost,0),peopleCost=ready.reduce((sum,row)=>sum+row.peopleCost,0),operationalCost=ready.reduce((sum,row)=>sum+row.operationalCost,0),resolutions=ready.reduce((sum,row)=>sum+row.resolutions,0),attendance=ready.reduce((sum,row)=>sum+row.attendance,0),fte=ready.reduce((sum,row)=>sum+row.fte,0);
    const qualityWeight=ready.reduce((sum,row)=>sum+(row.evaluationRate!=null?Math.max(1,row.attendance):0),0),weightedQuality=ready.reduce((sum,row)=>sum+(row.evaluationRate!=null?row.evaluationRate*Math.max(1,row.attendance):0),0);
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      rows:Object.freeze(ranked),eligibleCount:ready.length,totalCost,peopleCost,operationalCost,resolutions,attendance,fte,
      economicProductivity:calculateEconomicProductivity(resolutions,totalCost),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      resolutionsPerFte:fte>0?resolutions/fte:null,
      evaluationRate:qualityWeight>0?weightedQuality/qualityWeight:null
    });
  }

  function median(values=[]){
    const rows=(Array.isArray(values)?values:[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    if(!rows.length)return null;
    const mid=Math.floor(rows.length/2);
    return rows.length%2?rows[mid]:(rows[mid-1]+rows[mid])/2;
  }
  function average(values=[]){
    const rows=(Array.isArray(values)?values:[]).map(Number).filter(Number.isFinite);
    return rows.length?rows.reduce((sum,value)=>sum+value,0)/rows.length:null;
  }
  function relativeIndex(value,benchmark){
    const current=Number(value),base=Number(benchmark);
    return Number.isFinite(current)&&Number.isFinite(base)&&base>0?current/base*100:null;
  }
  function relativeBand(value,benchmark,tolerance=.05){
    const delta=changeRatio(value,benchmark),limit=Math.max(0,num(tolerance,.05));
    if(delta==null)return'no-base';
    if(delta>limit)return'above';
    if(delta<-limit)return'below';
    return'near';
  }
  function buildSquadBenchmarks(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeSquadProductivityRow),eligible=normalized.filter(row=>row.squadCode&&row.sourceAvailable&&row.totalCost>0&&row.economicProductivity!=null);
    const totalCost=eligible.reduce((sum,row)=>sum+row.totalCost,0),resolutions=eligible.reduce((sum,row)=>sum+row.resolutions,0),attendance=eligible.reduce((sum,row)=>sum+row.attendance,0),operation=calculateEconomicProductivity(resolutions,totalCost),mean=average(eligible.map(row=>row.economicProductivity)),medianValue=median(eligible.map(row=>row.economicProductivity)),best=eligible.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.squadCode.localeCompare(b.squadCode,'pt-BR'))[0]||null;
    const qualityWeight=eligible.reduce((sum,row)=>sum+(row.evaluationRate!=null?Math.max(1,row.attendance):0),0),weightedQuality=eligible.reduce((sum,row)=>sum+(row.evaluationRate!=null?row.evaluationRate*Math.max(1,row.attendance):0),0),operationEvaluationRate=qualityWeight>0?weightedQuality/qualityWeight:null,operationResolutionRate=calculateResolutionRate(resolutions,attendance),operationCostPerResolution=calculateCostPerResolution(totalCost,resolutions);
    const enriched=normalized.map(row=>Object.freeze({...row,benchmarkEligible:eligible.some(item=>item.squadCode===row.squadCode),operationBenchmark:operation,medianBenchmark:medianValue,operationCostPerResolution,operationResolutionRate,operationEvaluationRate,vsOperation:changeRatio(row.economicProductivity,operation),vsMedian:changeRatio(row.economicProductivity,medianValue),costPerResolutionDelta:changeRatio(row.costPerResolution,operationCostPerResolution),resolutionRateDelta:row.resolutionRate!=null&&operationResolutionRate!=null?row.resolutionRate-operationResolutionRate:null,evaluationRateDelta:row.evaluationRate!=null&&operationEvaluationRate!=null?row.evaluationRate-operationEvaluationRate:null,relativeIndex:relativeIndex(row.economicProductivity,operation),relativeBand:relativeBand(row.economicProductivity,operation)}));
    return Object.freeze({ruleVersion:RULE_VERSION,eligibleCount:eligible.length,operationBenchmark:operation,meanBenchmark:mean,medianBenchmark:medianValue,operationCostPerResolution,operationResolutionRate,operationEvaluationRate,best:best?Object.freeze({...best}):null,rows:Object.freeze(enriched)});
  }
  function buildTechnicianBenchmarks(rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeTechnicianProductivityRow),eligible=normalized.filter(row=>row.linked&&row.sourceAvailable&&row.personalCost>0&&row.economicProductivity!=null);
    const totalCost=eligible.reduce((sum,row)=>sum+row.personalCost,0),resolutions=eligible.reduce((sum,row)=>sum+row.resolutions,0),attendance=eligible.reduce((sum,row)=>sum+row.attendance,0),operation=calculateEconomicProductivity(resolutions,totalCost),mean=average(eligible.map(row=>row.economicProductivity)),medianValue=median(eligible.map(row=>row.economicProductivity)),best=eligible.slice().sort((a,b)=>(b.economicProductivity??-1)-(a.economicProductivity??-1)||a.name.localeCompare(b.name,'pt-BR'))[0]||null;
    const ratingWeight=eligible.reduce((sum,row)=>sum+(row.avgRating!=null&&row.resolutions>0?row.resolutions:0),0),weightedRating=eligible.reduce((sum,row)=>sum+(row.avgRating!=null?row.avgRating*row.resolutions:0),0),operationAvgRating=ratingWeight>0?weightedRating/ratingWeight:null,operationResolutionRate=calculateResolutionRate(resolutions,attendance),operationCostPerResolution=calculateCostPerResolution(totalCost,resolutions);
    const bySquad=new Map();
    for(const row of eligible){const code=row.squadCode||'SEM_SQUAD',group=bySquad.get(code)||{cost:0,resolutions:0,attendance:0,count:0,ratingWeight:0,weightedRating:0};group.cost+=row.personalCost;group.resolutions+=row.resolutions;group.attendance+=row.attendance;group.count++;if(row.avgRating!=null&&row.resolutions>0){group.ratingWeight+=row.resolutions;group.weightedRating+=row.avgRating*row.resolutions;}bySquad.set(code,group);}
    const squadBenchmarks=new Map([...bySquad.entries()].map(([code,group])=>[code,Object.freeze({squadCode:code,count:group.count,economicProductivity:calculateEconomicProductivity(group.resolutions,group.cost),costPerResolution:calculateCostPerResolution(group.cost,group.resolutions),resolutionRate:calculateResolutionRate(group.resolutions,group.attendance),avgRating:group.ratingWeight>0?group.weightedRating/group.ratingWeight:null})]));
    const enriched=normalized.map(row=>{const squad=squadBenchmarks.get(row.squadCode),squadBenchmark=squad?.economicProductivity??null,squadCostPerResolution=squad?.costPerResolution??null,squadResolutionRate=squad?.resolutionRate??null,squadAvgRating=squad?.avgRating??null;return Object.freeze({...row,benchmarkEligible:eligible.some(item=>item.id===row.id),operationBenchmark:operation,squadBenchmark,squadCostPerResolution,squadResolutionRate,squadAvgRating,operationCostPerResolution,operationResolutionRate,operationAvgRating,vsOperation:changeRatio(row.economicProductivity,operation),vsSquad:changeRatio(row.economicProductivity,squadBenchmark),costPerResolutionDelta:changeRatio(row.costPerResolution,squadCostPerResolution??operationCostPerResolution),resolutionRateDelta:row.resolutionRate!=null&&(squadResolutionRate??operationResolutionRate)!=null?row.resolutionRate-(squadResolutionRate??operationResolutionRate):null,ratingDelta:row.avgRating!=null&&(squadAvgRating??operationAvgRating)!=null?row.avgRating-(squadAvgRating??operationAvgRating):null,relativeIndex:relativeIndex(row.economicProductivity,operation),relativeBand:relativeBand(row.economicProductivity,squadBenchmark??operation)});});
    return Object.freeze({ruleVersion:RULE_VERSION,eligibleCount:eligible.length,operationBenchmark:operation,meanBenchmark:mean,medianBenchmark:medianValue,operationCostPerResolution,operationResolutionRate,operationAvgRating,best:best?Object.freeze({...best}):null,squadBenchmarks:Object.freeze([...squadBenchmarks.values()]),rows:Object.freeze(enriched)});
  }

  function diagnoseEfficiencyRow(row={},kind='squad'){
    const t=DIAGNOSTIC_THRESHOLDS,eligible=row.benchmarkEligible===true,efficiencyDelta=kind==='technician'?(row.vsSquad??row.vsOperation):row.vsOperation,costDelta=row.costPerResolutionDelta,resolutionDelta=row.resolutionRateDelta,qualityDelta=kind==='technician'?row.ratingDelta:row.evaluationRateDelta;
    const base={kind,id:kind==='technician'?row.id:row.squadCode,label:kind==='technician'?row.name:row.label,squadCode:row.squadCode||'',benchmarkEligible:eligible,signals:Object.freeze({efficiencyDelta:efficiencyDelta??null,costPerResolutionDelta:costDelta??null,resolutionRateDelta:resolutionDelta??null,qualityDelta:qualityDelta??null})};
    if(!eligible)return Object.freeze({...base,code:'DATA_GAP',tone:'neutral',priority:0,title:'Base insuficiente para diagnóstico',detail:'Não há custo e resolução suficientes para comparar esta linha com a referência econômica.',nextStep:'Completar custo, vínculo e base de resoluções antes de interpretar eficiência.'});
    if(efficiencyDelta!=null&&efficiencyDelta>t.efficiencyTolerance&&qualityDelta!=null&&qualityDelta<-(kind==='technician'?t.ratingTolerance:t.qualityTolerance))return Object.freeze({...base,code:'QUALITY_GUARDRAIL',tone:'warn',priority:3,title:'Eficiência acima da referência com alerta de qualidade',detail:'A produtividade econômica está acima da referência, mas o guardrail de qualidade está abaixo da base comparável.',nextStep:'Investigar o motivo da diferença de qualidade antes de replicar o padrão de custo e ritmo.'});
    if(efficiencyDelta!=null&&efficiencyDelta<-t.efficiencyTolerance&&resolutionDelta!=null&&resolutionDelta<-t.resolutionTolerance)return Object.freeze({...base,code:'RESOLUTION_PRESSURE',tone:'bad',priority:3,title:'Pressão de resolução reduz a eficiência',detail:'A produtividade econômica e a taxa de resolução estão abaixo da referência comparável.',nextStep:'Analisar o fluxo de resolução, dependências e retorno de casos antes de atuar somente em custo.'});
    if(efficiencyDelta!=null&&efficiencyDelta<-t.efficiencyTolerance&&costDelta!=null&&costDelta>t.efficiencyTolerance)return Object.freeze({...base,code:'COST_PRESSURE',tone:'warn',priority:2,title:'Custo por resolução acima da referência',detail:'A produtividade econômica está abaixo da referência e o custo por resolução está proporcionalmente mais alto.',nextStep:'Revisar composição de custo, distribuição de capacidade e volume resolvido no mesmo contexto.'});
    if(efficiencyDelta!=null&&efficiencyDelta>t.efficiencyTolerance){
      if(qualityDelta==null)return Object.freeze({...base,code:'HIGH_EFFICIENCY_QUALITY_GAP',tone:'neutral',priority:1,title:'Eficiência acima da referência; qualidade sem base comparável',detail:'O ganho econômico está presente, mas não há guardrail de qualidade suficiente para validar sustentabilidade.',nextStep:'Completar a base de qualidade antes de transformar o resultado em referência de gestão.'});
      return Object.freeze({...base,code:'HEALTHY_EFFICIENCY',tone:'good',priority:1,title:'Eficiência acima da referência com guardrails preservados',detail:'A produtividade econômica supera a referência sem sinal relevante de deterioração nos guardrails comparáveis.',nextStep:'Identificar práticas replicáveis e acompanhar a manutenção do resultado nas próximas competências.'});
    }
    if(efficiencyDelta!=null&&Math.abs(efficiencyDelta)<=t.efficiencyTolerance)return Object.freeze({...base,code:'NEAR_REFERENCE',tone:'neutral',priority:0,title:'Eficiência próxima da referência',detail:'A produtividade econômica está dentro da faixa de ±5% da referência comparável.',nextStep:'Acompanhar tendência e evitar intervenção baseada em oscilação pequena de uma única competência.'});
    return Object.freeze({...base,code:'EFFICIENCY_GAP',tone:'warn',priority:2,title:'Eficiência abaixo da referência',detail:'A produtividade econômica está abaixo da referência, sem um único vetor dominante identificado pelos dados disponíveis.',nextStep:'Comparar custo por resolução, taxa de resolução, FTE e qualidade para localizar o principal desvio.'});
  }
  function summarizeDiagnostics(rows=[]){
    const list=Array.isArray(rows)?rows:[],attention=list.filter(row=>row.priority>=2).length,healthy=list.filter(row=>row.code==='HEALTHY_EFFICIENCY').length,dataGap=list.filter(row=>row.code==='DATA_GAP'||row.code==='HIGH_EFFICIENCY_QUALITY_GAP').length,comparable=list.filter(row=>row.benchmarkEligible).length;
    const prioritized=list.slice().sort((a,b)=>b.priority-a.priority||Math.abs(b.signals?.efficiencyDelta??0)-Math.abs(a.signals?.efficiencyDelta??0)||String(a.label).localeCompare(String(b.label),'pt-BR'));
    return Object.freeze({total:list.length,comparable,attention,healthy,dataGap,priority:prioritized[0]||null});
  }
  function buildEfficiencyDiagnostics({squads=[],technicians=[]}={}){
    const squadBenchmarks=buildSquadBenchmarks(squads),technicianBenchmarks=buildTechnicianBenchmarks(technicians),squadDiagnostics=squadBenchmarks.rows.map(row=>diagnoseEfficiencyRow(row,'squad')),technicianDiagnostics=technicianBenchmarks.rows.map(row=>diagnoseEfficiencyRow(row,'technician'));
    return Object.freeze({ruleVersion:RULE_VERSION,thresholds:DIAGNOSTIC_THRESHOLDS,squadBenchmarks,technicianBenchmarks,squads:Object.freeze(squadDiagnostics),technicians:Object.freeze(technicianDiagnostics),squadSummary:summarizeDiagnostics(squadDiagnostics),technicianSummary:summarizeDiagnostics(technicianDiagnostics)});
  }


  function normalizeSnapshotMetric(raw={}){
    const totalCost=Math.max(0,num(raw.totalCost??raw.total_cost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions)),fte=Math.max(0,num(raw.fte));
    const productivity=Number(raw.economicProductivity??raw.economic_productivity),costPerResolution=Number(raw.costPerResolution??raw.cost_per_resolution),costPerAttendance=Number(raw.costPerAttendance??raw.cost_per_attendance),resolutionRate=Number(raw.resolutionRate??raw.resolution_rate),evaluationRate=Number(raw.evaluationRate??raw.evaluation_rate);
    return Object.freeze({
      squadCode:text(raw.squadCode??raw.squad_code).toUpperCase(),
      totalCost,peopleCost:Math.max(0,num(raw.peopleCost??raw.people_cost)),operationalCost:Math.max(0,num(raw.operationalCost??raw.operational_cost)),fte,attendance,resolutions,resolutionEntries:Math.max(0,num(raw.resolutionEntries??raw.resolution_entries)),
      costPerAttendance:Number.isFinite(costPerAttendance)?Math.max(0,costPerAttendance):calculateCostPerAttendance(totalCost,attendance),
      costPerResolution:Number.isFinite(costPerResolution)?Math.max(0,costPerResolution):calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:Number.isFinite(resolutionRate)?percent(resolutionRate):calculateResolutionRate(resolutions,attendance),
      economicProductivity:Number.isFinite(productivity)?Math.max(0,productivity):calculateEconomicProductivity(resolutions,totalCost),
      evaluationRate:Number.isFinite(evaluationRate)?percent(evaluationRate):null
    });
  }
  function normalizeEfficiencySnapshot(raw={}){
    const operation=normalizeSnapshotMetric(raw.operation||{}),squads=(Array.isArray(raw.squads)?raw.squads:[]).map(normalizeSnapshotMetric).filter(row=>row.squadCode),bench=raw.benchmarks&&typeof raw.benchmarks==='object'?raw.benchmarks:{};
    const operationBenchmark=Number(bench.operationBenchmark??bench.operation_benchmark),meanBenchmark=Number(bench.meanBenchmark??bench.mean_benchmark),medianBenchmark=Number(bench.medianBenchmark??bench.median_benchmark),bestValue=Number(bench.bestValue??bench.best_value);
    return Object.freeze({
      competence:text(raw.competence),status:text(raw.status,'closed'),revision:Math.max(0,Math.round(num(raw.revision))),snapshotVersion:text(raw.snapshotVersion??raw.snapshot_version,SNAPSHOT_VERSION),ruleVersion:text(raw.ruleVersion??raw.rule_version),source:text(raw.source,'close'),financialSnapshotRevision:Math.max(0,Math.round(num(raw.financialSnapshotRevision??raw.financial_snapshot_revision))),createdAt:raw.createdAt??raw.created_at??null,
      operation,squads:Object.freeze(squads),benchmarks:Object.freeze({operationBenchmark:Number.isFinite(operationBenchmark)?operationBenchmark:null,meanBenchmark:Number.isFinite(meanBenchmark)?meanBenchmark:null,medianBenchmark:Number.isFinite(medianBenchmark)?medianBenchmark:null,bestSquadCode:text(bench.bestSquadCode??bench.best_squad_code).toUpperCase(),bestValue:Number.isFinite(bestValue)?bestValue:null})
    });
  }
  function buildEfficiencyEvolution(rows=[],{squadCode='all'}={}){
    const code=text(squadCode,'all').toUpperCase(),normalized=(Array.isArray(rows)?rows:[]).map(normalizeEfficiencySnapshot).filter(row=>row.competence).sort((a,b)=>a.competence.localeCompare(b.competence));
    let previous=null,firstReady=null;
    const timeline=normalized.map(row=>{
      const metric=code==='ALL'?row.operation:(row.squads.find(item=>item.squadCode===code)||null),operation=row.operation,ready=!!metric&&metric.totalCost>0&&metric.resolutionEntries>0&&metric.economicProductivity!=null;
      const current=metric||normalizeSnapshotMetric({squadCode:code});
      const productivityDelta=ready&&previous?.ready?changeRatio(current.economicProductivity,previous.metric.economicProductivity):null;
      const costPerResolutionDelta=ready&&previous?.ready?changeRatio(current.costPerResolution,previous.metric.costPerResolution):null;
      const resolutionRateDelta=ready&&previous?.ready&&current.resolutionRate!=null&&previous.metric.resolutionRate!=null?current.resolutionRate-previous.metric.resolutionRate:null;
      const evaluationDelta=ready&&previous?.ready&&current.evaluationRate!=null&&previous.metric.evaluationRate!=null?current.evaluationRate-previous.metric.evaluationRate:null;
      if(ready&&!firstReady)firstReady={metric:current,operation};
      const baseProductivity=firstReady?.metric?.economicProductivity,baseCostResolution=firstReady?.metric?.costPerResolution;
      const out=Object.freeze({...row,metric,operation,ready,productivityDelta,costPerResolutionDelta,resolutionRateDelta,evaluationDelta,productivityIndex:ready&&baseProductivity>0?current.economicProductivity/baseProductivity*100:null,costPerResolutionIndex:ready&&baseCostResolution>0&&current.costPerResolution!=null?current.costPerResolution/baseCostResolution*100:null,operationRelativeIndex:ready&&operation.economicProductivity>0?current.economicProductivity/operation.economicProductivity*100:null});
      if(ready)previous=out;
      return out;
    });
    const readyRows=timeline.filter(row=>row.ready),latest=readyRows.at(-1)||null,prior=readyRows.at(-2)||null;
    return Object.freeze({ruleVersion:RULE_VERSION,snapshotVersion:SNAPSHOT_VERSION,squadCode:code==='ALL'?'all':code,rows:Object.freeze(timeline),readyCount:readyRows.length,frozenCount:timeline.filter(row=>row.source==='close').length,backfillCount:timeline.filter(row=>row.source==='legacy_backfill').length,liveCount:timeline.filter(row=>row.source==='live_preview').length,latest,previous:prior,latestProductivityDelta:latest&&prior?changeRatio(latest.metric.economicProductivity,prior.metric.economicProductivity):null,latestCostPerResolutionDelta:latest&&prior?changeRatio(latest.metric.costPerResolution,prior.metric.costPerResolution):null});
  }

  function normalizeMetrics(raw={}){
    const evaluation=Number(raw.evaluationRate),totalCost=Math.max(0,num(raw.totalCost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions));
    return Object.freeze({
      totalCost,
      peopleCost:Math.max(0,num(raw.peopleCost)),
      operationalCost:Math.max(0,num(raw.operationalCost)),
      attendance,
      resolutions,
      costPerAttendance:calculateCostPerAttendance(totalCost,attendance),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance),
      fte:Math.max(0,num(raw.fte)),
      peopleCount:Math.max(0,Math.round(num(raw.peopleCount))),
      evaluationRate:Number.isFinite(evaluation)?percent(evaluation):null
    });
  }
  function normalizeUnitRow(raw={}){
    const totalCost=Math.max(0,num(raw.totalCost??raw.total_cost)),attendance=Math.max(0,num(raw.attendance)),resolutions=Math.max(0,num(raw.resolutions));
    return Object.freeze({
      id:text(raw.id),
      label:text(raw.label||raw.name||raw.squadCode||raw.squad_code,'Sem identificação'),
      squadCode:text(raw.squadCode||raw.squad_code).toUpperCase(),
      totalCost,
      attendance,
      resolutions,
      costPerAttendance:calculateCostPerAttendance(totalCost,attendance),
      costPerResolution:calculateCostPerResolution(totalCost,resolutions),
      resolutionRate:calculateResolutionRate(resolutions,attendance)
    });
  }
  function changeRatio(current,baseline){
    const cur=Number(current),base=Number(baseline);
    return Number.isFinite(cur)&&Number.isFinite(base)&&base>0?(cur-base)/base:null;
  }
  function buildCostPerAttendance({current={},baseline=null,comparisonLabel=''}={}){
    const currentRow=normalizeUnitRow(current),baselineRow=baseline?normalizeUnitRow(baseline):null;
    const delta=baselineRow?changeRatio(currentRow.costPerAttendance,baselineRow.costPerAttendance):null;
    const impact=baselineRow&&currentRow.costPerAttendance!=null&&baselineRow.costPerAttendance!=null&&currentRow.attendance>0?(currentRow.costPerAttendance-baselineRow.costPerAttendance)*currentRow.attendance:null;
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      status:currentRow.costPerAttendance==null?'pending':'ready',
      current:currentRow,
      baseline:baselineRow,
      comparisonLabel:text(comparisonLabel,'Sem base de comparação'),
      delta,
      impact
    });
  }
  function buildCostPerResolution({current={},baseline=null,comparisonLabel=''}={}){
    const currentRow=normalizeUnitRow(current),baselineRow=baseline?normalizeUnitRow(baseline):null;
    const delta=baselineRow?changeRatio(currentRow.costPerResolution,baselineRow.costPerResolution):null;
    const impact=baselineRow&&currentRow.costPerResolution!=null&&baselineRow.costPerResolution!=null&&currentRow.resolutions>0?(currentRow.costPerResolution-baselineRow.costPerResolution)*currentRow.resolutions:null;
    return Object.freeze({
      ruleVersion:RULE_VERSION,
      status:currentRow.costPerResolution==null?'pending':'ready',
      current:currentRow,
      baseline:baselineRow,
      comparisonLabel:text(comparisonLabel,'Sem base de comparação'),
      delta,
      impact
    });
  }
  function coverageScore(availability={}){
    const normalized=normalizeAvailability(availability),count=COVERAGE_KEYS.filter(key=>normalized[key]).length,total=COVERAGE_KEYS.length;
    return Object.freeze({count,total,ratio:total?count/total:0,label:`${count}/${total}`});
  }
  function metricReadiness(metric,availability){
    const missing=(metric.requires||[]).filter(key=>!availability[key]);
    return Object.freeze({...metric,status:missing.length?'pending':'ready',missing:Object.freeze(missing)});
  }
  function warnings(scope,metrics,availability){
    const out=[];
    if(!scope.competence)out.push('Selecione uma competência estratégica.');
    if(!availability.financial)out.push('A consolidação financeira da competência ainda não está disponível.');
    if(!availability.attendance)out.push('Não há produção operacional válida no escopo selecionado.');
    if(!availability.fte)out.push('O FTE estratégico ainda não está disponível no escopo selecionado.');
    if(!availability.quality)out.push('A taxa de avaliação não está disponível para este escopo.');
    if(!availability.resolutions)out.push('A base de resoluções ainda não foi informada para esta competência.');
    if(metrics.totalCost>0&&metrics.peopleCost+metrics.operationalCost===0)out.push('O custo total existe sem composição de pessoas/operação; valide a consolidação.');
    return Object.freeze(out);
  }
  function buildFoundation(input={}){
    const scope=normalizeScope(input.scope||input),metrics=normalizeMetrics(input.metrics||input),availability=normalizeAvailability(input.availability||{}),coverage=coverageScore(availability),catalog=METRIC_CATALOG.map(metric=>metricReadiness(metric,availability)),notes=warnings(scope,metrics,availability);
    const status=!scope.competence||!availability.financial?'blocked':coverage.ratio===1?'ready':'partial';
    return Object.freeze({ruleVersion:RULE_VERSION,scope,metrics,availability,coverage,status,catalog:Object.freeze(catalog),warnings:notes});
  }

  return{RULE_VERSION,SNAPSHOT_VERSION,DIAGNOSTIC_THRESHOLDS,COVERAGE_KEYS,METRIC_CATALOG,normalizeScope,normalizeAvailability,normalizeMetrics,normalizeUnitRow,normalizeSnapshotMetric,normalizeEfficiencySnapshot,buildEfficiencyEvolution,calculateCostPerAttendance,calculateCostPerResolution,calculateResolutionRate,calculateEconomicProductivity,normalizeTechnicianProductivityRow,buildTechnicianProductivity,normalizeSquadProductivityRow,buildSquadProductivity,median,average,relativeIndex,relativeBand,buildSquadBenchmarks,buildTechnicianBenchmarks,diagnoseEfficiencyRow,summarizeDiagnostics,buildEfficiencyDiagnostics,changeRatio,buildCostPerAttendance,buildCostPerResolution,coverageScore,metricReadiness,buildFoundation};
});
