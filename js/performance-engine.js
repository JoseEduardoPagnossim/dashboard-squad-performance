(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenPerformanceEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const DEFAULT_TTL=5*60*1000;
  const PREFIX='softenPerformanceCacheV243:';
  const memory=new Map();
  const now=()=>Date.now();
  const perfNow=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
  function cacheKey(scope,key){return `${PREFIX}${String(scope||'global')}:${String(key||'')}`}
  function writeCache(scope,key,value,ttl=DEFAULT_TTL){
    const record={savedAt:now(),expiresAt:now()+Math.max(1000,Number(ttl)||DEFAULT_TTL),value};
    const id=cacheKey(scope,key);memory.set(id,record);
    try{if(typeof sessionStorage!=='undefined')sessionStorage.setItem(id,JSON.stringify(record));}catch(e){}
    return value;
  }
  function readCache(scope,key,{allowStale=false}={}){
    const id=cacheKey(scope,key);let record=memory.get(id)||null;
    if(!record){try{if(typeof sessionStorage!=='undefined'){const raw=sessionStorage.getItem(id);if(raw)record=JSON.parse(raw);}}catch(e){record=null}}
    if(!record)return null;
    memory.set(id,record);
    if(!allowStale&&Number(record.expiresAt||0)<now())return null;
    return{value:record.value,savedAt:Number(record.savedAt||0),expiresAt:Number(record.expiresAt||0),stale:Number(record.expiresAt||0)<now()};
  }
  function removeCache(scope,key){const id=cacheKey(scope,key);memory.delete(id);try{if(typeof sessionStorage!=='undefined')sessionStorage.removeItem(id);}catch(e){}}
  function clearScope(scope){const prefix=`${PREFIX}${String(scope||'global')}:`;for(const key of [...memory.keys()])if(key.startsWith(prefix))memory.delete(key);try{if(typeof sessionStorage!=='undefined')for(let i=sessionStorage.length-1;i>=0;i--){const key=sessionStorage.key(i);if(key&&key.startsWith(prefix))sessionStorage.removeItem(key);}}catch(e){}}
  function createTracker(label='session'){
    const started=perfNow(),marks=[{name:'start',at:started}],meta={};
    return{
      label,
      mark(name,data){const at=perfNow();marks.push({name:String(name),at});if(data!==undefined)meta[String(name)]=data;return at-started;},
      set(name,value){meta[String(name)]=value;return value;},
      snapshot(){const end=perfNow(),steps=[];for(let i=1;i<marks.length;i++)steps.push({name:marks[i].name,ms:Math.max(0,marks[i].at-marks[i-1].at)});return{label,totalMs:Math.max(0,end-started),steps,marks:marks.map(m=>({name:m.name,ms:Math.max(0,m.at-started)})),meta:{...meta}};}
    };
  }
  function summarize(snapshot){if(!snapshot)return'';return `${snapshot.label}: ${Math.round(snapshot.totalMs)} ms`}
  function monthCacheId(squadCode,monthId,level='full'){return `month:${String(squadCode||'').toUpperCase()}:${String(monthId||'')}:${level}`}
  function themeCacheId(squadCode){return `theme:${String(squadCode||'').toUpperCase()}`}
  function initialCacheId(userId){return `initial:${String(userId||'anonymous')}`}
  function isSummaryMonth(month){return !!month&&month.__loadLevel==='summary'}
  function isFullMonth(month){return !!month&&month.__loadLevel==='full'}
  function markMonth(month,level='summary'){if(month&&typeof month==='object')month.__loadLevel=level;return month}
  function scheduleIdle(task,{timeout=1200}={}){
    if(typeof task!=='function')return null;
    if(typeof requestIdleCallback==='function')return requestIdleCallback(()=>task(),{timeout});
    return setTimeout(task,60);
  }
  return{DEFAULT_TTL,cacheKey,writeCache,readCache,removeCache,clearScope,createTracker,summarize,monthCacheId,themeCacheId,initialCacheId,isSummaryMonth,isFullMonth,markMonth,scheduleIdle};
});
