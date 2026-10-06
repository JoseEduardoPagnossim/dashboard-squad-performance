(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenWorkspaceEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const ROUTE_KEYS=['page','section','module','indicator','squad','month','tech','from','to'];
  const FILTER_KEYS=['squad','month','tech','from','to'];
  const VALID_PAGES=new Set(['home','alerts','individual','team','indicators','presentation','feedbacks','users','audit','admin','settings','profile','my-feedbacks','help']);
  const MAX_SAVED_VIEWS=30;
  const MAX_FAVORITES=20;
  const MAX_FILTER_CONTEXTS=40;

  function text(value){return String(value??'').trim()}
  function normalizeText(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim()}
  function dateText(value){const v=text(value);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:''}
  function monthText(value){const v=text(value);return /^\d{4}-\d{2}$/.test(v)?v:''}
  function squadText(value){const v=text(value).toUpperCase();if(v==='ALL')return'all';return /^[A-Z]$/.test(v)?v:''}
  function idText(value,prefix='item'){
    const raw=text(value).replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
    return raw||`${prefix}-${Date.now().toString(36)}`;
  }
  function isoText(value){const v=text(value);const ms=Date.parse(v);return Number.isFinite(ms)?new Date(ms).toISOString():''}
  function copyRoute(route={}){
    const page=VALID_PAGES.has(text(route.page))?text(route.page):'home';
    const out={page};
    const section=text(route.section),module=text(route.module),indicator=text(route.indicator),squad=squadText(route.squad),month=monthText(route.month),tech=text(route.tech).slice(0,160),from=dateText(route.from),to=dateText(route.to);
    if(section)out.section=section.slice(0,80);
    if(module)out.module=module.slice(0,80);
    if(indicator)out.indicator=indicator.slice(0,80);
    if(squad)out.squad=squad;
    if(month)out.month=month;
    if(tech)out.tech=tech;
    if(from)out.from=from;
    if(to)out.to=to;
    return out;
  }
  function routeContextKey(route={}){
    const r=copyRoute(route),detail=r.page==='admin'?r.section:r.page==='settings'?r.module:r.page==='indicators'?r.indicator:'';
    return detail?`${r.page}:${detail}`:r.page;
  }
  function filterSnapshot(route={}){
    const r=copyRoute(route),out={};
    FILTER_KEYS.forEach(k=>{if(r[k])out[k]=r[k]});
    return out;
  }
  function routeSignature(route={}){
    const r=copyRoute(route);
    return ROUTE_KEYS.filter(k=>r[k]).map(k=>`${k}=${encodeURIComponent(r[k])}`).join('&');
  }
  function mergeRememberedFilters(route={},memory={},enabled=true){
    const base=copyRoute(route);if(!enabled)return base;
    const remembered=memory&&typeof memory==='object'?memory[routeContextKey(base)]:null;
    if(!remembered||typeof remembered!=='object')return base;
    const snap=filterSnapshot(remembered),merged={...base};
    FILTER_KEYS.forEach(k=>{if(!merged[k]&&snap[k])merged[k]=snap[k]});
    return copyRoute(merged);
  }
  function rememberFilters(workspace,route,now=new Date().toISOString()){
    const current=normalizeWorkspace(workspace),key=routeContextKey(route),snap=filterSnapshot(route);
    if(!current.persistentFilters||key==='home'||!Object.keys(snap).length)return current;
    const previous=current.filterMemory?.[key]||{},previousSnap=filterSnapshot(previous);
    if(JSON.stringify(previousSnap)===JSON.stringify(snap))return current;
    const entries=Object.entries(current.filterMemory||{}).filter(([k])=>k!==key);
    const next={[key]:{...snap,updatedAt:isoText(now)||new Date().toISOString()}};
    entries.sort((a,b)=>Date.parse(b[1]?.updatedAt||0)-Date.parse(a[1]?.updatedAt||0)).slice(0,MAX_FILTER_CONTEXTS-1).forEach(([k,v])=>{next[k]=v});
    return{...current,filterMemory:next};
  }
  function normalizeSavedView(item,index=0){
    const raw=item&&typeof item==='object'?item:{},route=copyRoute(raw.route),name=text(raw.name).slice(0,72);
    if(!name)return null;
    const createdAt=isoText(raw.createdAt)||new Date(0).toISOString(),updatedAt=isoText(raw.updatedAt)||createdAt;
    return{id:idText(raw.id||`saved-${index+1}`,'saved'),name,route,createdAt,updatedAt};
  }
  function normalizeFavorite(item,index=0){
    const raw=item&&typeof item==='object'?item:{},route=copyRoute(raw.route),signature=routeSignature(route),label=text(raw.label).slice(0,80);
    if(!signature||route.page==='home'&&!Object.keys(route).some(k=>k!=='page'))return null;
    return{id:idText(raw.id||`fav-${index+1}`,'fav'),label:label||'Favorito',route,signature,createdAt:isoText(raw.createdAt)||new Date(0).toISOString()};
  }
  function normalizeFilterMemory(memory){
    const raw=memory&&typeof memory==='object'?memory:{},entries=[];
    for(const [key,value] of Object.entries(raw)){
      if(!key||!value||typeof value!=='object')continue;
      const snap=filterSnapshot(value);if(!Object.keys(snap).length)continue;
      entries.push([key.slice(0,120),{...snap,updatedAt:isoText(value.updatedAt)||new Date(0).toISOString()}]);
    }
    entries.sort((a,b)=>Date.parse(b[1].updatedAt)-Date.parse(a[1].updatedAt));
    return Object.fromEntries(entries.slice(0,MAX_FILTER_CONTEXTS));
  }
  function normalizeWorkspace(workspace){
    const raw=workspace&&typeof workspace==='object'?workspace:{},saved=[],favorites=[];
    for(const [i,item] of (Array.isArray(raw.savedViews)?raw.savedViews:[]).entries()){
      const view=normalizeSavedView(item,i);if(view&&!saved.some(x=>x.id===view.id))saved.push(view);if(saved.length>=MAX_SAVED_VIEWS)break;
    }
    for(const [i,item] of (Array.isArray(raw.favorites)?raw.favorites:[]).entries()){
      const fav=normalizeFavorite(item,i);if(fav&&!favorites.some(x=>x.signature===fav.signature))favorites.push(fav);if(favorites.length>=MAX_FAVORITES)break;
    }
    return{version:1,persistentFilters:raw.persistentFilters!==false,filterMemory:normalizeFilterMemory(raw.filterMemory),savedViews:saved,favorites};
  }
  function createSavedView(workspace,{id,name,route,now=new Date().toISOString()}={}){
    const current=normalizeWorkspace(workspace),view=normalizeSavedView({id:id||`saved-${Date.now().toString(36)}`,name,route,createdAt:now,updatedAt:now},current.savedViews.length);
    if(!view)return current;
    const saved=[view,...current.savedViews.filter(x=>x.id!==view.id)].slice(0,MAX_SAVED_VIEWS);
    return{...current,savedViews:saved};
  }
  function renameSavedView(workspace,id,name,now=new Date().toISOString()){
    const current=normalizeWorkspace(workspace),clean=text(name).slice(0,72);if(!clean)return current;
    return{...current,savedViews:current.savedViews.map(v=>v.id===id?{...v,name:clean,updatedAt:isoText(now)||new Date().toISOString()}:v)};
  }
  function deleteSavedView(workspace,id){const current=normalizeWorkspace(workspace);return{...current,savedViews:current.savedViews.filter(v=>v.id!==id)}}
  function favoriteForRoute(workspace,route){const current=normalizeWorkspace(workspace),sig=routeSignature(route);return current.favorites.find(f=>f.signature===sig)||null}
  function toggleFavorite(workspace,{route,label,now=new Date().toISOString()}={}){
    const current=normalizeWorkspace(workspace),r=copyRoute(route),sig=routeSignature(r),found=current.favorites.find(f=>f.signature===sig);
    if(found)return{...current,favorites:current.favorites.filter(f=>f.signature!==sig)};
    if(!sig)return current;
    const fav=normalizeFavorite({id:`fav-${Date.now().toString(36)}`,label,route:r,createdAt:now},current.favorites.length);
    return fav?{...current,favorites:[fav,...current.favorites].slice(0,MAX_FAVORITES)}:current;
  }
  function setPersistentFilters(workspace,enabled){const current=normalizeWorkspace(workspace);return{...current,persistentFilters:enabled!==false}}
  function clearFilterMemory(workspace){const current=normalizeWorkspace(workspace);return{...current,filterMemory:{}}}
  return{ROUTE_KEYS,FILTER_KEYS,MAX_SAVED_VIEWS,MAX_FAVORITES,normalizeText,copyRoute,routeContextKey,filterSnapshot,routeSignature,mergeRememberedFilters,rememberFilters,normalizeWorkspace,createSavedView,renameSavedView,deleteSavedView,favoriteForRoute,toggleFavorite,setPersistentFilters,clearFilterMemory};
});
