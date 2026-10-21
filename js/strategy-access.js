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
  function normalizeAccess(raw={},meta={}){
    const source=raw&&typeof raw==='object'?raw:{};
    const out={...EMPTY_ACCESS};
    for(const key of ACCESS_KEYS){
      const dbKey=DB_FIELD_MAP[key];
      out[key]=bool(source[key])||bool(source[dbKey]);
    }
    out.source=String(meta.source||source.source||'remote');
    out.remoteAvailable=meta.remoteAvailable!==false&&source.remoteAvailable!==false;
    return out;
  }
  function demoAccessForRole(role){
    const admin=String(role||'').trim()==='super_admin'||String(role||'').trim()==='squad_admin';
    return normalizeAccess(admin?{
      canViewStrategy:true,
      canViewAggregates:true,
      canManageAccess:true
    }:{},{source:'demo',remoteAvailable:true});
  }
  function canView(access){return normalizeAccess(access).canViewStrategy}
  function canViewAggregates(access){const a=normalizeAccess(access);return a.canViewStrategy&&a.canViewAggregates}
  function accessStatus(access){
    const a=normalizeAccess(access);
    if(!a.remoteAvailable)return{tone:'warning',label:'Migração pendente'};
    if(a.canViewStrategy)return{tone:'success',label:'Acesso estratégico ativo'};
    return{tone:'neutral',label:'Sem acesso estratégico'};
  }
  return{ACCESS_KEYS,EMPTY_ACCESS,DB_FIELD_MAP,normalizeAccess,demoAccessForRole,canView,canViewAggregates,accessStatus};
});
