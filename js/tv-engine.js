(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenTvEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const ONLINE_AFTER_MS=90*1000;
  const ATTENTION_AFTER_MS=5*60*1000;
  const TV_QUERY_KEYS=['interval','refresh','columns','fit','scale','density','safe','carousel','kpis','spots','filters','tabs','start','squad','playlist'];

  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function text(v){return String(v??'').trim()}
  function nowIso(now=Date.now()){return new Date(now).toISOString()}
  function safeDate(value){const t=value?new Date(value).getTime():0;return Number.isFinite(t)?t:0}
  function normalizeSquad(value){const raw=text(value).toUpperCase();if(raw==='ALL')return'all';return ['A','B','D','E'].includes(raw)?raw:'all'}
  function normalizePlaylist(input={}){
    const config=input.config&&typeof input.config==='object'?{...input.config}:{};
    return {
      id:input.id||input.localId||null,
      name:text(input.name)||'Playlist sem nome',
      description:text(input.description),
      squad:normalizeSquad(input.squad||config.squad||'all'),
      config:{...config,squad:normalizeSquad(config.squad||input.squad||'all')},
      active:input.active!==false,
      createdAt:input.created_at||input.createdAt||null,
      updatedAt:input.updated_at||input.updatedAt||null
    };
  }
  function normalizeDevice(input={}){
    return {
      id:input.id||input.localId||null,
      deviceKey:text(input.device_key||input.deviceKey),
      name:text(input.name)||'TV sem nome',
      location:text(input.location),
      squad:normalizeSquad(input.squad_code||input.squad||'all'),
      playlistId:input.playlist_id||input.playlistId||null,
      active:input.active!==false,
      lastSeenAt:input.last_seen_at||input.lastSeenAt||null,
      lastRefreshAt:input.last_refresh_at||input.lastRefreshAt||null,
      lastMode:text(input.last_mode||input.lastMode),
      connectionState:text(input.connection_state||input.connectionState)||'unknown',
      viewport:input.viewport&&typeof input.viewport==='object'?input.viewport:{},
      appVersion:text(input.app_version||input.appVersion),
      userAgent:text(input.user_agent||input.userAgent),
      createdAt:input.created_at||input.createdAt||null,
      updatedAt:input.updated_at||input.updatedAt||null
    };
  }
  function statusForDevice(device,now=Date.now()){
    const d=normalizeDevice(device);
    if(!d.active)return{key:'inactive',label:'Inativa',ageMs:null};
    const seen=safeDate(d.lastSeenAt);
    if(!seen)return{key:'never',label:'Nunca conectou',ageMs:null};
    const age=Math.max(0,now-seen);
    if(age<=ONLINE_AFTER_MS)return{key:'online',label:'Online',ageMs:age};
    if(age<=ATTENTION_AFTER_MS)return{key:'attention',label:'Atenção',ageMs:age};
    return{key:'offline',label:'Offline',ageMs:age};
  }
  function monitorSummary(devices,now=Date.now()){
    const result={total:0,online:0,attention:0,offline:0,inactive:0,never:0};
    for(const raw of devices||[]){result.total++;const key=statusForDevice(raw,now).key;if(Object.hasOwn(result,key))result[key]++;}
    return result;
  }
  function humanAge(value,now=Date.now()){
    const t=safeDate(value);if(!t)return'Nunca';const diff=Math.max(0,now-t),sec=Math.round(diff/1000);
    if(sec<10)return'Agora';if(sec<60)return`há ${sec}s`;const min=Math.round(sec/60);if(min<60)return`há ${min} min`;const h=Math.round(min/60);if(h<24)return`há ${h} h`;const d=Math.round(h/24);return`há ${d} d`;
  }
  function generateDeviceKey(prefix='tv'){
    let token='';
    try{if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(2);globalThis.crypto.getRandomValues(a);token=[...a].map(v=>v.toString(36)).join('');}}
    catch(e){}
    if(!token)token=`${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
    return `${text(prefix||'tv').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'tv'}-${token.slice(0,16)}`;
  }
  function deviceUrl(baseUrl,deviceKey){
    const url=new URL(baseUrl,typeof window!=='undefined'?window.location.href:'https://localhost/');
    url.searchParams.set('view','presentation');
    url.searchParams.set('tv',text(deviceKey));
    for(const key of TV_QUERY_KEYS)url.searchParams.delete(key);
    url.hash='';return url.toString();
  }
  function playlistUrl(baseUrl,playlistId,squad='all'){
    const url=new URL(baseUrl,typeof window!=='undefined'?window.location.href:'https://localhost/');
    url.searchParams.set('view','presentation');url.searchParams.set('playlist',text(playlistId));url.searchParams.set('squad',normalizeSquad(squad));url.searchParams.delete('tv');url.hash='';return url.toString();
  }
  function heartbeatPayload({mode='',lastRefreshAt=null,connectionState='online',viewport={},appVersion='',playlistId=null}={}){
    return {last_seen_at:nowIso(),last_refresh_at:lastRefreshAt||null,last_mode:text(mode),connection_state:text(connectionState)||'online',viewport:viewport&&typeof viewport==='object'?viewport:{},app_version:text(appVersion),playlist_id:playlistId||null};
  }
  return {ONLINE_AFTER_MS,ATTENTION_AFTER_MS,normalizePlaylist,normalizeDevice,statusForDevice,monitorSummary,humanAge,generateDeviceKey,deviceUrl,playlistUrl,heartbeatPayload,normalizeSquad};
});
