(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenAlertEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const SEVERITY_ORDER={critical:0,warning:1,info:2,success:3};
  const VALID_SEVERITIES=new Set(Object.keys(SEVERITY_ORDER));
  const VALID_CATEGORIES=new Set(['announcement','operation','performance','feedback','system']);
  const VALID_AUDIENCES=new Set(['all','admins','technicians','squad']);
  const asText=(v,max=4000)=>String(v??'').trim().slice(0,max);
  const asIso=v=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString()};
  function hashText(value=''){
    let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(36);
  }
  function normalizeSeverity(value){const v=String(value||'info').toLowerCase();return VALID_SEVERITIES.has(v)?v:'info'}
  function normalizeCategory(value){const v=String(value||'system').toLowerCase();return VALID_CATEGORIES.has(v)?v:'system'}
  function normalizeAudience(value){const v=String(value||'all').toLowerCase();return VALID_AUDIENCES.has(v)?v:'all'}
  function normalizeInternal(row={}){
    const startsAt=asIso(row.starts_at??row.startsAt) || asIso(row.created_at??row.createdAt) || new Date().toISOString();
    const expiresAt=asIso(row.expires_at??row.expiresAt);
    return{
      id:String(row.id||''),source:'internal',title:asText(row.title,180),text:asText(row.message??row.text,4000),severity:normalizeSeverity(row.severity),category:normalizeCategory(row.category),audienceType:normalizeAudience(row.audience_type??row.audienceType),squadId:row.squad_id??row.squadId??null,actionView:asText(row.action_view??row.actionView,40)||null,actionSection:asText(row.action_section??row.actionSection,40)||null,actionLabel:asText(row.action_label??row.actionLabel,60)||'Abrir',startsAt,expiresAt,active:row.active!==false,createdAt:asIso(row.created_at??row.createdAt)||startsAt,createdBy:row.created_by??row.createdBy??null,updatedAt:asIso(row.updated_at??row.updatedAt)||null,raw:row
    };
  }
  function automaticAlert({code='signal',scope='global',period='',subject='',severity='info',category='performance',title='',text='',createdAt=null,actionView=null,actionSection=null,actionLabel='Abrir'}={}){
    const normalizedSeverity=normalizeSeverity(severity),normalizedCategory=normalizeCategory(category),payload=[code,scope,period,subject,normalizedSeverity,title,text].join('|');
    return{id:`auto:${code}:${hashText(payload)}`,source:'automatic',code:String(code),scope:String(scope),period:String(period||''),subject:String(subject||''),severity:normalizedSeverity,category:normalizedCategory,title:asText(title,180),text:asText(text,4000),createdAt:asIso(createdAt)||new Date().toISOString(),actionView:actionView?String(actionView):null,actionSection:actionSection?String(actionSection):null,actionLabel:asText(actionLabel,60)||'Abrir',active:true};
  }
  function audienceMatches(item,user={}){
    const n=item?.source==='internal'?item:normalizeInternal(item||{}),role=String(user.role||''),type=n.audienceType||'all';
    if(type==='all')return true;
    if(type==='admins')return role==='super_admin'||role==='squad_admin';
    if(type==='technicians')return role==='technician';
    if(type==='squad')return Boolean(n.squadId&&user.squadId&&String(n.squadId)===String(user.squadId));
    return false;
  }
  function isActive(item,now=new Date()){
    const n=item?.source==='internal'?item:normalizeInternal(item||{});if(n.active===false)return false;
    const ts=now instanceof Date?now.getTime():new Date(now).getTime(),start=n.startsAt?new Date(n.startsAt).getTime():0,end=n.expiresAt?new Date(n.expiresAt).getTime():Infinity;
    return ts>=start&&ts<end;
  }
  function sortFeed(rows=[]){
    return[...rows].sort((a,b)=>{
      if(Boolean(a.read)!==Boolean(b.read))return a.read?1:-1;
      const severity=(SEVERITY_ORDER[a.severity]??9)-(SEVERITY_ORDER[b.severity]??9);if(severity)return severity;
      return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    });
  }
  function buildFeed({automatic=[],notifications=[],readIds=[],autoReadIds=[],user={},now=new Date()}={}){
    const read=new Set((readIds||[]).map(String)),autoRead=new Set((autoReadIds||[]).map(String));
    const internal=(notifications||[]).map(normalizeInternal).filter(n=>audienceMatches(n,user)&&isActive(n,now)).map(n=>({...n,read:read.has(String(n.id))}));
    const auto=(automatic||[]).map(a=>({...a,source:'automatic',severity:normalizeSeverity(a.severity),category:normalizeCategory(a.category),read:autoRead.has(String(a.id))}));
    return sortFeed([...internal,...auto]);
  }
  function counts(rows=[]){
    const out={total:rows.length,unread:0,critical:0,warning:0,internal:0,automatic:0};
    for(const row of rows){if(!row.read)out.unread++;if(row.severity==='critical')out.critical++;if(row.severity==='warning')out.warning++;if(row.source==='internal')out.internal++;if(row.source==='automatic')out.automatic++;}
    return out;
  }
  function filterFeed(rows=[],filters={}){
    const status=String(filters.status||'all'),source=String(filters.source||'all'),severity=String(filters.severity||'all'),category=String(filters.category||'all'),search=String(filters.search||'').trim().toLocaleLowerCase('pt-BR');
    return(rows||[]).filter(row=>{
      if(status==='unread'&&row.read)return false;if(status==='read'&&!row.read)return false;
      if(source!=='all'&&row.source!==source)return false;if(severity!=='all'&&row.severity!==severity)return false;if(category!=='all'&&row.category!==category)return false;
      if(search&&!`${row.title||''} ${row.text||''}`.toLocaleLowerCase('pt-BR').includes(search))return false;
      return true;
    });
  }
  function audienceLabel(item,squadCode=''){
    const type=item?.audienceType||normalizeAudience(item?.audience_type);if(type==='admins')return'Administradores';if(type==='technicians')return'Técnicos';if(type==='squad')return squadCode?`Squad ${squadCode}`:'Squad específico';return'Todos';
  }
  return{SEVERITY_ORDER,hashText,normalizeSeverity,normalizeCategory,normalizeAudience,normalizeInternal,automaticAlert,audienceMatches,isActive,sortFeed,buildFeed,counts,filterFeed,audienceLabel};
});
