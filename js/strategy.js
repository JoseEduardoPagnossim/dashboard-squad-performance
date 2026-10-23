(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./strategy-access.js'):root.SoftenStrategyAccess,
    typeof module==='object'&&module.exports?require('./strategy-data.js'):root.SoftenStrategyData,
    typeof module==='object'&&module.exports?require('./strategy-cost-engine.js'):root.SoftenStrategyCostEngine,
    typeof module==='object'&&module.exports?require('./strategy-insights.js'):root.SoftenStrategyInsights
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategy=api;
})(typeof window!=='undefined'?window:globalThis,function(accessEngine,dataEngine,costEngine,insightEngine){
  'use strict';
  if(!accessEngine||!dataEngine||!costEngine||!insightEngine)throw new Error('Dependências da Gestão Estratégica não carregadas.');

  const VALID_SECTIONS=Object.freeze(['executive','efficiency','costs','assumptions']);
  const SECTION_META=Object.freeze({
    executive:Object.freeze({label:'Resultado Executivo',eyebrow:'VISÃO EXECUTIVA'}),
    efficiency:Object.freeze({label:'Eficiência',eyebrow:'EFICIÊNCIA RELATIVA'}),
    costs:Object.freeze({label:'Custos & Eficiência',eyebrow:'CUSTOS E EFICIÊNCIA'}),
    assumptions:Object.freeze({label:'Premissas',eyebrow:'PREMISSAS E DADOS'})
  });
  const COMPARISONS=Object.freeze(['previous','3m','6m','12m']);
  const STRATEGIC_GROUPS=Object.freeze([Object.freeze({code:'PRE',name:'Pré-atendimento',competences:Object.freeze([]),strategicOnly:true})]);

  function normalizeSection(value){const section=String(value||'').trim();return VALID_SECTIONS.includes(section)?section:'executive'}
  function availableSquads(context){const rows=[...(context.squads||[]),...STRATEGIC_GROUPS],seen=new Set();return rows.filter(row=>{const code=String(row?.code||'').toUpperCase();if(!code||seen.has(code))return false;seen.add(code);return true;});}
  function normalizeSquad(value,context){const code=String(value||'all').trim().toUpperCase();if(code==='ALL')return'all';return availableSquads(context).some(row=>row.code===code)?code:'all'}
  function availableCompetences(context,financial){return[...new Set([...(context.competences||[]),...(financial.competences||[]).map(row=>row.competence)])].filter(Boolean).sort()}
  function normalizeCompetence(value,context,financial){const id=dataEngine.competenceId(value);const list=availableCompetences(context,financial);return list.includes(id)?id:(list.at(-1)||context.latestCompetence||'')}
  function normalizeComparison(value){const id=String(value||'').trim();return COMPARISONS.includes(id)?id:'previous'}
  function emptyContext(){return dataEngine.buildOperationalContext({squads:{}})}
  function emptyFinancial(){return dataEngine.buildFinancialContext()}

  function createController(seed={}){
    let context=emptyContext(),financial=emptyFinancial();
    let state={section:normalizeSection(seed.section),competence:'',squadCode:'all',comparison:normalizeComparison(seed.comparison),access:accessEngine.normalizeAccess(seed.access||{}),initialized:false,financialLoaded:false,financialLoading:false,financialError:''};
    function setAccess(access){financial=emptyFinancial();state={...state,access:accessEngine.normalizeAccess(access),financialLoaded:false,financialLoading:false,financialError:''};return getState()}
    function initializeContext(input={}){context=dataEngine.buildOperationalContext(input);state={...state,competence:normalizeCompetence(state.competence||seed.competence,context,financial),squadCode:normalizeSquad(state.squadCode||seed.squadCode,context),initialized:true};return getState()}
    function setFinancialData(input={}){financial=dataEngine.buildFinancialContext(input);state={...state,competence:normalizeCompetence(state.competence||seed.competence,context,financial),financialLoaded:true,financialLoading:false,financialError:''};return getState()}
    function setFinancialLoading(loading=true){state={...state,financialLoading:loading===true};return getState()}
    function setFinancialError(message=''){state={...state,financialLoading:false,financialError:String(message||''),financialLoaded:false};return getState()}
    function setSection(section){state={...state,section:normalizeSection(section)};return getState()}
    function setSquadCode(code){state={...state,squadCode:normalizeSquad(code,context)};return getState()}
    function setCompetence(id){state={...state,competence:normalizeCompetence(id,context,financial)};return getState()}
    function setComparison(value){state={...state,comparison:normalizeComparison(value)};return getState()}
    function getState(){return{...state,access:{...state.access}}}
    function getContext(){const comps=availableCompetences(context,financial);return{squads:availableSquads(context).map(row=>({...row,competences:[...(row.competences||[])]})),operationalCompetences:[...context.competences],financialCompetences:financial.competences.map(row=>row.competence),competences:comps,latestCompetence:comps.at(-1)||context.latestCompetence}}
    function getFinancialData(){return{competences:financial.competences.map(row=>({...row})),people:financial.people.map(row=>({...row})),costs:financial.costs.map(row=>({...row})),operationalCosts:financial.operationalCosts.map(row=>({...row})),allocations:financial.allocations.map(row=>({...row})),resolutionMetrics:financial.resolutionMetrics.map(row=>({...row})),summary:{...financial.summary},squadSummary:financial.squadSummary.map(row=>({...row})),history:financial.history.map(row=>({...row}))}}
    function selectedCompetenceRecord(){return financial.competences.find(row=>row.competence===state.competence)||null}
    function viewModel(){
      const snapshot=getState(),ctx=getContext(),fin=getFinancialData(),meta=SECTION_META[snapshot.section];
      let base=fin.summary||{};
      if(!base.competence&&(fin.costs.length||fin.operationalCosts.length)){
        const people=costEngine.summarizePeopleCosts(fin.costs,{squadCode:snapshot.squadCode}),ops=costEngine.summarizeOperationalCosts(fin.operationalCosts,fin.allocations,{squadCode:snapshot.squadCode});
        base={...people,peopleCost:people.totalCost,operationalCost:ops.operationalCost,unallocatedOperationalCost:ops.unallocatedCost,totalCost:people.totalCost+ops.operationalCost};
      }
      const summary=costEngine.mergeFinancialSummary(base,{competence:snapshot.competence,squadCode:snapshot.squadCode});
      return{state:snapshot,context:ctx,financial:fin,competenceRecord:selectedCompetenceRecord(),meta,summary,insights:insightEngine.foundationInsights(),accessStatus:accessEngine.accessStatus(snapshot.access)};
    }
    return{setAccess,initializeContext,setFinancialData,setFinancialLoading,setFinancialError,setSection,setSquadCode,setCompetence,setComparison,getState,getContext,getFinancialData,viewModel};
  }

  return{VALID_SECTIONS,SECTION_META,COMPARISONS,STRATEGIC_GROUPS,normalizeSection,createController};
});
