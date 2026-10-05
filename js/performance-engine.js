(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenPerformanceEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const DEFAULT_TTL=5*60*1000;
  const PREFIX='softenPerformanceCacheV243:';
  const METRICS_KEY='softenPerformanceMetricsV2431';
  const EVENT_LIMIT=240;
  const memory=new Map();
  const now=()=>Date.now();
  const perfNow=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
  const baseMetrics=()=>({startedAt:now(),cache:{hit:0,miss:0,stale:0,write:0},events:[],longTasks:0,longTaskMs:0});
  let metrics=baseMetrics();
  let longTaskObserver=null;

  function safeNumber(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function clone(value){try{return JSON.parse(JSON.stringify(value))}catch(e){return value}}
  function restoreMetrics(){
    try{
      if(typeof sessionStorage==='undefined')return;
      const raw=sessionStorage.getItem(METRICS_KEY);if(!raw)return;
      const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object')return;
      metrics={...baseMetrics(),...parsed,cache:{...baseMetrics().cache,...(parsed.cache||{})},events:Array.isArray(parsed.events)?parsed.events.slice(-EVENT_LIMIT):[]};
    }catch(e){}
  }
  function persistMetrics(){try{if(typeof sessionStorage!=='undefined')sessionStorage.setItem(METRICS_KEY,JSON.stringify(metrics));}catch(e){}}
  restoreMetrics();

  function cacheKey(scope,key){return `${PREFIX}${String(scope||'global')}:${String(key||'')}`}
  function writeCache(scope,key,value,ttl=DEFAULT_TTL){
    const record={savedAt:now(),expiresAt:now()+Math.max(1000,Number(ttl)||DEFAULT_TTL),value};
    const id=cacheKey(scope,key);memory.set(id,record);metrics.cache.write++;persistMetrics();
    try{if(typeof sessionStorage!=='undefined')sessionStorage.setItem(id,JSON.stringify(record));}catch(e){}
    return value;
  }
  function readCache(scope,key,{allowStale=false}={}){
    const id=cacheKey(scope,key);let record=memory.get(id)||null;
    if(!record){try{if(typeof sessionStorage!=='undefined'){const raw=sessionStorage.getItem(id);if(raw)record=JSON.parse(raw);}}catch(e){record=null}}
    if(!record){metrics.cache.miss++;persistMetrics();return null;}
    memory.set(id,record);
    const stale=Number(record.expiresAt||0)<now();
    if(stale){metrics.cache.stale++;if(!allowStale){metrics.cache.miss++;persistMetrics();return null;}}
    metrics.cache.hit++;persistMetrics();
    return{value:record.value,savedAt:Number(record.savedAt||0),expiresAt:Number(record.expiresAt||0),stale};
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

  function sanitizeMeta(meta={}){
    if(!meta||typeof meta!=='object')return{};
    const out={};
    for(const [key,value] of Object.entries(meta)){
      if(value==null||typeof value==='boolean'||typeof value==='number')out[String(key).slice(0,60)]=value;
      else if(typeof value==='string')out[String(key).slice(0,60)]=value.slice(0,240);
    }
    return out;
  }
  function recordEvent(type,name,durationMs=0,meta={},success=true){
    const event={type:String(type||'module').slice(0,24),name:String(name||'unknown').slice(0,80),durationMs:Math.max(0,safeNumber(durationMs)),success:success!==false,meta:sanitizeMeta(meta),at:new Date().toISOString()};
    metrics.events.push(event);if(metrics.events.length>EVENT_LIMIT)metrics.events.splice(0,metrics.events.length-EVENT_LIMIT);persistMetrics();return event;
  }
  function recordError(name,error,meta={}){
    const message=String(error?.message||error||'Erro desconhecido').replace(/\s+/g,' ').slice(0,300);
    return recordEvent('error',name,0,{...sanitizeMeta(meta),message},false);
  }
  async function measureAsync(name,task,{type='module',meta={}}={}){
    const started=perfNow();try{const value=await task();recordEvent(type,name,perfNow()-started,meta,true);return value;}catch(error){recordEvent(type,name,perfNow()-started,{...sanitizeMeta(meta),message:String(error?.message||error||'').slice(0,240)},false);throw error;}
  }
  function percentile(values,p=0.95){
    const nums=(values||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);if(!nums.length)return 0;
    const rank=Math.min(nums.length-1,Math.max(0,Math.ceil(p*nums.length)-1));return nums[rank];
  }
  function summarizeEvents(events=metrics.events){
    const groups=new Map();for(const event of events||[]){const key=`${event.type}|${event.name}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(event);}
    return [...groups.entries()].map(([key,rows])=>{const [type,name]=key.split('|'),times=rows.map(r=>safeNumber(r.durationMs));const total=times.reduce((a,b)=>a+b,0);return{type,name,count:rows.length,avgMs:rows.length?total/rows.length:0,p95Ms:percentile(times,.95),maxMs:times.length?Math.max(...times):0,errorCount:rows.filter(r=>r.success===false).length};}).sort((a,b)=>b.avgMs-a.avgMs);
  }
  function metricsSnapshot(){
    const cache={...metrics.cache},lookups=cache.hit+cache.miss,hitRate=lookups?cache.hit/lookups:0;
    return{startedAt:metrics.startedAt,cache:{...cache,lookups,hitRate},events:clone(metrics.events),summaries:summarizeEvents(metrics.events),longTasks:safeNumber(metrics.longTasks),longTaskMs:safeNumber(metrics.longTaskMs)};
  }
  function resetMetrics(){metrics=baseMetrics();persistMetrics();return metricsSnapshot();}
  function observeLongTasks(){
    if(longTaskObserver||typeof PerformanceObserver==='undefined')return false;
    try{
      const supported=PerformanceObserver.supportedEntryTypes||[];if(!supported.includes('longtask'))return false;
      longTaskObserver=new PerformanceObserver(list=>{for(const entry of list.getEntries()){metrics.longTasks++;metrics.longTaskMs+=safeNumber(entry.duration);recordEvent('client','long_task',entry.duration,{},true);}});longTaskObserver.observe({entryTypes:['longtask']});return true;
    }catch(e){longTaskObserver=null;return false;}
  }
  function stopLongTaskObserver(){try{longTaskObserver?.disconnect?.();}catch(e){}longTaskObserver=null;}

  return{DEFAULT_TTL,cacheKey,writeCache,readCache,removeCache,clearScope,createTracker,summarize,monthCacheId,themeCacheId,initialCacheId,isSummaryMonth,isFullMonth,markMonth,scheduleIdle,recordEvent,recordError,measureAsync,percentile,summarizeEvents,metricsSnapshot,resetMetrics,observeLongTasks,stopLongTaskObserver};
});
