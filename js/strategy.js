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

  const VALID_SECTIONS=Object.freeze(['executive','costs','assumptions']);
  const SECTION_META=Object.freeze({
    executive:Object.freeze({label:'Resultado Executivo',eyebrow:'VISÃO EXECUTIVA'}),
    costs:Object.freeze({label:'Custos & Eficiência',eyebrow:'CUSTOS E EFICIÊNCIA'}),
    assumptions:Object.freeze({label:'Premissas',eyebrow:'PREMISSAS E DADOS'})
  });
  const COMPARISONS=Object.freeze(['previous','3m','6m','12m']);

  function normalizeSection(value){const section=String(value||'').trim();return VALID_SECTIONS.includes(section)?section:'executive'}
  function normalizeSquad(value,context){const code=String(value||'all').trim().toUpperCase();if(code==='ALL')return'all';return context.squads.some(row=>row.code===code)?code:'all'}
  function normalizeCompetence(value,context){const id=String(value||'').trim();return context.competences.includes(id)?id:(context.latestCompetence||'')}
  function normalizeComparison(value){const id=String(value||'').trim();return COMPARISONS.includes(id)?id:'previous'}
  function emptyContext(){return dataEngine.buildOperationalContext({squads:{}})}

  function createController(seed={}){
    let context=emptyContext();
    let state={
      section:normalizeSection(seed.section),
      competence:'',
      squadCode:'all',
      comparison:normalizeComparison(seed.comparison),
      access:accessEngine.normalizeAccess(seed.access||{}),
      initialized:false
    };
    function setAccess(access){state={...state,access:accessEngine.normalizeAccess(access)};return getState()}
    function initializeContext(input={}){
      context=dataEngine.buildOperationalContext(input);
      state={...state,competence:normalizeCompetence(state.competence||seed.competence,context),squadCode:normalizeSquad(state.squadCode||seed.squadCode,context),initialized:true};
      return getState();
    }
    function setSection(section){state={...state,section:normalizeSection(section)};return getState()}
    function setSquadCode(code){state={...state,squadCode:normalizeSquad(code,context)};return getState()}
    function setCompetence(id){state={...state,competence:normalizeCompetence(id,context)};return getState()}
    function setComparison(value){state={...state,comparison:normalizeComparison(value)};return getState()}
    function getState(){return{...state,access:{...state.access}}}
    function getContext(){return{squads:context.squads.map(row=>({...row,competences:[...row.competences]})),competences:[...context.competences],latestCompetence:context.latestCompetence}}
    function viewModel(){
      const snapshot=getState(),ctx=getContext(),meta=SECTION_META[snapshot.section],summary=costEngine.emptySummary(snapshot);
      return{state:snapshot,context:ctx,meta,summary,insights:insightEngine.foundationInsights(),accessStatus:accessEngine.accessStatus(snapshot.access)};
    }
    return{setAccess,initializeContext,setSection,setSquadCode,setCompetence,setComparison,getState,getContext,viewModel};
  }

  return{VALID_SECTIONS,SECTION_META,COMPARISONS,normalizeSection,createController};
});
