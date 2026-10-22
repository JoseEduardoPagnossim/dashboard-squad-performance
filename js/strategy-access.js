(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenStrategyAccess=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const ACCESS_KEYS=Object.freeze([
    'canViewStrategy',
    'canViewAggregates',
    'canViewPeopleCosts',
    'canEditCosts',
    'canCloseCompetence',
    'canManageAccess'
  ]);
  const EMPTY_ACCESS=Object.freeze({
    canViewStrategy:false,
    canViewAggregates:false,
    canViewPeopleCosts:false,
    canEditCosts:false,
    canCloseCompetence:false,
    canManageAccess:false,
    source:'none',
    remoteAvailable:true
  });

  const DB_FIELD_MAP=Object.freeze({
    canViewStrategy:'can_view_strategy',
    canViewAggregates:'can_view_aggregates',
    canViewPeopleCosts:'can_view_people_costs',
    canEditCosts:'can_edit_costs',
    canCloseCompetence:'can_close_competence',
    canManageAccess:'can_manage_access'
  });

  function bool(value){return value===true}
  function hasOwn(source,key){return Object.prototype.hasOwnProperty.call(source,key)}
  function normalizeAccess(raw={},meta={}){
    const source=raw&&typeof raw==='object'?raw:{};
    const out={...EMPTY_ACCESS};
    for(const key of ACCESS_KEYS){
      const dbKey=DB_FIELD_MAP[key];
      out[key]=hasOwn(source,dbKey)?bool(source[dbKey]):bool(source[key]);
    }
    out.source=String(meta.source||source.source||'remote');
    out.remoteAvailable=meta.remoteAvailable!==false&&source.remoteAvailable!==false;
    return out;
  }
  function demoAccessForRole(role,enabled=false){
    const allowed=enabled===true;
    return normalizeAccess(allowed?{
      canViewStrategy:true,
      canViewAggregates:true,
      canViewPeopleCosts:true,
      canEditCosts:true
    }:{},{source:'demo',remoteAvailable:true});
  }
  function canView(access){return normalizeAccess(access).canViewStrategy}
  function canViewAggregates(access){const a=normalizeAccess(access);return a.canViewStrategy&&a.canViewAggregates}
  function canViewPeopleCosts(access){const a=normalizeAccess(access);return a.canViewStrategy&&a.canViewPeopleCosts}
  function canEditCosts(access){const a=normalizeAccess(access);return a.canViewStrategy&&a.canEditCosts&&a.canViewPeopleCosts}
  function canCloseCompetence(access){const a=normalizeAccess(access);return a.canViewStrategy&&a.canCloseCompetence}
  function accessStatus(access){
    const a=normalizeAccess(access);
    if(!a.remoteAvailable)return{tone:'warning',label:'Migração pendente'};
    if(a.canViewStrategy)return{tone:'success',label:'Acesso estratégico ativo'};
    return{tone:'neutral',label:'Sem acesso estratégico'};
  }
  return{ACCESS_KEYS,EMPTY_ACCESS,DB_FIELD_MAP,normalizeAccess,demoAccessForRole,canView,canViewAggregates,canViewPeopleCosts,canEditCosts,canCloseCompetence,accessStatus};
});
