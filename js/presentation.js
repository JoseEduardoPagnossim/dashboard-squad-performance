(() => {
  const params = new URLSearchParams(window.location.search);
  const route = {
    enabled: params.get('view') === 'presentation',
    squad: (params.get('squad') || '').trim().toUpperCase(),
    direct: params.get('view') === 'presentation',
    tv: (params.get('tv') || '').trim(),
    playlist: (params.get('playlist') || '').trim()
  };

  const ALL_MODES = ['day','notesDay','general','notesGeneral','group','notesGroup'];
  const MODE_LABELS = {day:'Finalizados do Dia',notesDay:'Notas do Dia',general:'Finalizados Geral',notesGeneral:'Notas Geral',group:'Finalizados por Grupo',notesGroup:'Notas por Grupo'};
  const CONFIG_KEY = 'softenPresentationConfigV1';
  const DEFAULT_CONFIG = {squad:'all',interval:20,refresh:5,columns:'auto',fit:'auto',scale:'auto',density:'auto',safe:8,carousel:true,kpis:true,spotlights:true,filters:false,modes:[...ALL_MODES],start:'day'};
  function boolParam(value,fallback){if(value==null||value==='')return fallback;return !['0','false','off','no'].includes(String(value).toLowerCase())}
  function normalizeConfig(input={}){
    const rawModes=Array.isArray(input.modes)?input.modes:String(input.modes||'').split(',');
    const modes=rawModes.map(x=>String(x).trim()).filter((x,i,a)=>ALL_MODES.includes(x)&&a.indexOf(x)===i);
    const cfg={...DEFAULT_CONFIG,...input};
    cfg.squad=String(cfg.squad||'all').toUpperCase();if(cfg.squad==='ALL')cfg.squad='all';if(!['all','A','B','D','E'].includes(cfg.squad))cfg.squad='all';
    cfg.interval=[10,15,20,30,45,60].includes(Number(cfg.interval))?Number(cfg.interval):20;
    cfg.refresh=[1,2,5,10,15].includes(Number(cfg.refresh))?Number(cfg.refresh):5;
    cfg.columns=['auto','1','2'].includes(String(cfg.columns))?String(cfg.columns):'auto';
    cfg.fit=['auto','width','height','fill','none'].includes(String(cfg.fit))?String(cfg.fit):'auto';
    cfg.scale=['auto','75','80','85','90','95','100','105','110'].includes(String(cfg.scale))?String(cfg.scale):'auto';
    cfg.density=['auto','compact','normal','wide'].includes(String(cfg.density))?String(cfg.density):'auto';
    cfg.safe=[0,8,16,24,32].includes(Number(cfg.safe))?Number(cfg.safe):8;
    cfg.carousel=cfg.carousel!==false;cfg.kpis=cfg.kpis!==false;cfg.spotlights=cfg.spotlights!==false;cfg.filters=cfg.filters===true;
    cfg.modes=modes.length?modes:[...ALL_MODES];cfg.start=cfg.modes.includes(cfg.start)?cfg.start:cfg.modes[0];
    return cfg;
  }
  function loadSavedConfig(){try{return normalizeConfig(JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}'))}catch(e){return normalizeConfig()}}
  function saveConfig(cfg){const next=normalizeConfig(cfg);try{localStorage.setItem(CONFIG_KEY,JSON.stringify(next))}catch(e){}return next}
  function configFromUrl(){
    if(!route.direct)return null;
    const hasConfig=['interval','refresh','tabs','carousel','kpis','spots','filters','columns','fit','scale','density','safe','start'].some(k=>params.has(k));
    if(!hasConfig)return null;
    return normalizeConfig({
      squad:route.squad||'all',interval:Number(params.get('interval')||20),refresh:Number(params.get('refresh')||5),columns:params.get('columns')||'auto',fit:params.get('fit')||'auto',scale:params.get('scale')||'auto',density:params.get('density')||'auto',safe:Number(params.get('safe')||8),
      carousel:boolParam(params.get('carousel'),true),kpis:boolParam(params.get('kpis'),true),spotlights:boolParam(params.get('spots'),true),filters:boolParam(params.get('filters'),false),
      modes:(params.get('tabs')||'').split(','),start:params.get('start')||''
    });
  }
  function activeModes(){return state.config?.modes?.length?state.config.modes:ALL_MODES}

  const EXCLUDED_TECHNICIANS = [
    'Jose Eduardo Pagnossim','Heitor Drago Gois','João Paulo Cardoso','Eduardo Thomaz','Renata Romão',
    'LETICIA SANCHES','PAMELA MUNHOZ','HAMILTON MACHADO','JUAN DELFINO','LEONARDO TOFOLETTI',
    'ERIC JUSSANI','GABRIEL ANDRADE FIRMINO'
  ].map(normalizeName);

  const state = {
    payload:null,
    config:configFromUrl()||loadSavedConfig(),
    activeMode:'day',
    carouselEnabled:true,
    autoSwitch:true,
    manualPauseUntil:0,
    carouselDuration:20000,
    cycleStartedAt:Date.now(),
    cycleTimer:null,
    refreshEveryMs:5*60*1000,
    refreshTimer:null,
    reconnectTimer:null,
    refreshInFlight:false,
    refreshHandler:null,
    lastSuccessfulRefresh:0,
    lastRefreshError:null,
    bound:false,
    adminBound:false,
    rankings:null,
    wakeLock:null,
    fitRaf:0,
    fitObserver:null,
    appliedScale:1,
    appliedDensity:'normal',
    heartbeatTimer:null,
    connectionKind:'online'
  };

  state.activeMode=state.config.start;state.carouselEnabled=state.config.carousel;state.carouselDuration=state.config.interval*1000;state.refreshEveryMs=state.config.refresh*60*1000;

  function $(selector){ return document.querySelector(selector); }
  function $$(selector){ return [...document.querySelectorAll(selector)]; }
  function num(v){ const n=Number(v); return Number.isFinite(n)?n:0; }
  function normalizeName(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
  }
  function escapeHtml(value){
    return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
  function formatNumber(v){ return Math.round(num(v)).toLocaleString('pt-BR'); }
  function formatDecimal(v){ return num(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function formatPercent(v){ return `${num(v).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`; }
  function formatDateBR(iso){
    const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:'-';
  }
  function directUrl(squad,config=state.config){
    const cfg=normalizeConfig({...config,squad:squad||config?.squad||'all'}),url=new URL(window.location.href);
    url.searchParams.set('view','presentation');url.searchParams.set('squad',cfg.squad==='all'?'all':cfg.squad);
    url.searchParams.set('interval',String(cfg.interval));url.searchParams.set('refresh',String(cfg.refresh));url.searchParams.set('columns',cfg.columns);url.searchParams.set('fit',cfg.fit);url.searchParams.set('scale',cfg.scale);url.searchParams.set('density',cfg.density);url.searchParams.set('safe',String(cfg.safe));
    url.searchParams.set('carousel',cfg.carousel?'1':'0');url.searchParams.set('kpis',cfg.kpis?'1':'0');url.searchParams.set('spots',cfg.spotlights?'1':'0');url.searchParams.set('filters',cfg.filters?'1':'0');
    url.searchParams.set('tabs',cfg.modes.join(','));url.searchParams.set('start',cfg.start||cfg.modes[0]);url.hash='';return url.toString();
  }
  function normalUrl(){
    const url = new URL(window.location.href);
    ['view','squad','interval','refresh','columns','fit','scale','density','safe','carousel','kpis','spots','filters','tabs','start','tv','playlist'].forEach(k=>url.searchParams.delete(k));
    url.hash='';return url.toString();
  }
  function setDirectMode(active){ document.body.classList.toggle('presentation-direct',!!active);if(active){requestWakeLock();scheduleDisplayFit();}else{resetDisplayFit();} }
  function requestFullscreen(){ const el=document.documentElement;if(document.fullscreenElement)return Promise.resolve();return el.requestFullscreen?el.requestFullscreen():Promise.resolve(); }
  function exitFullscreen(){ if(!document.fullscreenElement)return Promise.resolve();return document.exitFullscreen?document.exitFullscreen():Promise.resolve(); }
  function pad2(v){return String(v).padStart(2,'0')}
  function clockLabel(ts=Date.now()){const d=new Date(ts);return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`}
  async function requestWakeLock(){
    if(!route.direct||document.hidden||!('wakeLock' in navigator))return;
    try{state.wakeLock=await navigator.wakeLock.request('screen');state.wakeLock.addEventListener?.('release',()=>{state.wakeLock=null})}catch(e){}
  }
  function updateFullscreenButton(){const btn=$('#presentationFullscreenBtn');if(btn)btn.textContent=document.fullscreenElement?'⛶ Sair da tela cheia':'⛶ Tela cheia'}
  function fitLabel(){const cfg=state.config,fit={auto:'Automático',width:'Largura',height:'Altura',fill:'Preencher',none:'Sem ajuste'}[cfg.fit]||'Automático',density={auto:'Auto',compact:'Compacta',normal:'Normal',wide:'Ampla'}[cfg.density]||'Auto';return `${fit} • ${Math.round(state.appliedScale*100)}% • ${density==='Auto'?state.appliedDensity:density}`}
  function resetDisplayFit(){
    cancelAnimationFrame(state.fitRaf);const shell=$('.presentation-shell');if(!shell)return;
    document.documentElement.classList.remove('presentation-tv-fit');document.body.classList.remove('presentation-density-compact','presentation-density-normal','presentation-density-wide');
    shell.style.removeProperty('width');shell.style.removeProperty('transform');shell.style.removeProperty('left');shell.style.removeProperty('top');shell.style.removeProperty('position');
    const note=$('#presentationFitNote');if(note)note.textContent='Ajuste automático à tela';state.appliedScale=1;state.appliedDensity='normal';
  }
  function chooseAutoDensity(){
    const rows=activeRows?.()||[],h=window.innerHeight||1080,w=window.innerWidth||1920;
    if(h<760||w<1250||rows.length>14)return'compact';
    if(h>=1050&&w>=1800&&rows.length<=8)return'wide';
    return'normal';
  }
  function applyDisplayFit(){
    if(!document.body.classList.contains('presentation-direct'))return;
    const shell=$('.presentation-shell');if(!shell)return;
    const cfg=state.config||DEFAULT_CONFIG,safe=Math.max(0,num(cfg.safe)),vw=Math.max(320,window.innerWidth||document.documentElement.clientWidth||1920),vh=Math.max(240,window.innerHeight||document.documentElement.clientHeight||1080);
    const density=cfg.density==='auto'?chooseAutoDensity():cfg.density;state.appliedDensity=density;
    document.documentElement.classList.add('presentation-tv-fit');document.body.classList.remove('presentation-density-compact','presentation-density-normal','presentation-density-wide');document.body.classList.add(`presentation-density-${density}`);
    shell.style.position='absolute';shell.style.width='1920px';shell.style.transform='none';shell.style.left='0px';shell.style.top='0px';
    const designWidth=1920,naturalHeight=Math.max(1080,Math.ceil(shell.scrollHeight||1080)),availW=Math.max(1,vw-safe*2),availH=Math.max(1,vh-safe*2),rw=availW/designWidth,rh=availH/naturalHeight;
    let base=1;if(cfg.fit==='auto')base=Math.min(rw,rh);else if(cfg.fit==='width')base=rw;else if(cfg.fit==='height')base=rh;else if(cfg.fit==='fill')base=Math.max(rw,rh);
    const multiplier=cfg.scale==='auto'?1:(Number(cfg.scale)||100)/100;let scale=Math.min(4,Math.max(.25,base*multiplier));state.appliedScale=scale;
    const scaledW=designWidth*scale,scaledH=naturalHeight*scale,left=safe+Math.max(0,(availW-scaledW)/2),top=safe+Math.max(0,(availH-scaledH)/2);
    shell.style.left=`${left}px`;shell.style.top=`${top}px`;shell.style.transformOrigin='top left';shell.style.transform=`scale(${scale})`;
    const note=$('#presentationFitNote');if(note)note.textContent=`Tela ${vw}×${vh} • ${fitLabel()}`;
  }
  function scheduleDisplayFit(){cancelAnimationFrame(state.fitRaf);state.fitRaf=requestAnimationFrame(()=>requestAnimationFrame(applyDisplayFit))}

  function connectionState(kind,title,text){
    state.connectionKind=kind||'online';
    const pill=$('#presentationConnectionPill'),banner=$('#presentationConnectionBanner'),pt=pill?.querySelector('strong');
    if(pill){pill.classList.remove('online','syncing','offline','degraded');pill.classList.add(kind);if(pt)pt.textContent=kind==='online'?'Online':kind==='syncing'?'Sincronizando':kind==='offline'?'Sem conexão':'Atenção';}
    if(banner){const show=kind==='offline'||kind==='degraded';banner.classList.toggle('hidden',!show);banner.classList.toggle('offline',kind==='offline');banner.classList.toggle('degraded',kind==='degraded');}
    if($('#presentationConnectionTitle'))$('#presentationConnectionTitle').textContent=title||'';
    if($('#presentationConnectionText'))$('#presentationConnectionText').textContent=text||'';
  }
  function syncNote(){
    const el=$('#presentationSyncNote');if(!el)return;
    if(state.refreshInFlight){el.textContent='Sincronizando dados agora…';return}
    if(state.lastSuccessfulRefresh){el.textContent=`Última sincronização ${clockLabel(state.lastSuccessfulRefresh)} • automática a cada ${state.config.refresh} min`;return}
    el.textContent=`Atualização automática a cada ${state.config.refresh} min`;
  }
  function scheduleReconnect(){
    clearTimeout(state.reconnectTimer);state.reconnectTimer=setTimeout(()=>triggerRefresh('retry'),60000);
  }
  async function triggerRefresh(reason='manual'){
    if(state.refreshInFlight||typeof state.refreshHandler!=='function')return;
    if(navigator.onLine===false){connectionState('offline','Sem conexão','Exibindo os últimos dados carregados. Nova tentativa automática em 1 minuto.');scheduleReconnect();return;}
    state.refreshInFlight=true;connectionState('syncing','Sincronizando','Buscando os dados mais recentes do Performance Hub…');syncNote();
    const btn=$('#presentationRefreshBtn');if(btn){btn.disabled=true;btn.textContent='↻ Atualizando…'}
    try{
      await state.refreshHandler({reason});
      state.lastSuccessfulRefresh=Date.now();state.lastRefreshError=null;connectionState('online');emitHeartbeat('refresh');
    }catch(err){
      state.lastRefreshError=err;connectionState(navigator.onLine===false?'offline':'degraded',navigator.onLine===false?'Sem conexão':'Falha na atualização',navigator.onLine===false?'Exibindo os últimos dados carregados. A sincronização será retomada automaticamente.':'Não foi possível buscar novos dados. A apresentação continuará com a última atualização válida e tentará novamente em 1 minuto.');scheduleReconnect();
    }finally{
      state.refreshInFlight=false;if(btn){btn.disabled=false;btn.textContent='↻ Atualizar agora'}syncNote();
    }
  }


  function runtimeStatus(){
    return {deviceKey:route.tv||'',playlistId:route.playlist||'',mode:state.activeMode,lastRefreshAt:state.lastSuccessfulRefresh?new Date(state.lastSuccessfulRefresh).toISOString():null,connectionState:state.connectionKind||'online',viewport:{width:window.innerWidth||0,height:window.innerHeight||0,devicePixelRatio:window.devicePixelRatio||1,fullscreen:!!document.fullscreenElement},appVersion:'2.43.2'};
  }
  function emitHeartbeat(reason='interval'){
    if(!route.direct||!route.tv)return;
    window.dispatchEvent(new CustomEvent('soften:presentation-heartbeat',{detail:{...runtimeStatus(),reason}}));
  }
  function restartHeartbeat(){
    clearInterval(state.heartbeatTimer);state.heartbeatTimer=null;
    if(!route.direct||!route.tv)return;
    emitHeartbeat('start');state.heartbeatTimer=setInterval(()=>emitHeartbeat('interval'),30000);
  }

  function normalizeRows(rows){
    return (rows||[]).map(row=>{
      const notes={
        5:num(row.notes?.[5]??row.notes5),4:num(row.notes?.[4]??row.notes4),3:num(row.notes?.[3]??row.notes3),
        2:num(row.notes?.[2]??row.notes2),1:num(row.notes?.[1]??row.notes1)
      };
      const totalRatings=notes[1]+notes[2]+notes[3]+notes[4]+notes[5];
      const ratingSum=notes[1]+notes[2]*2+notes[3]*3+notes[4]*4+notes[5]*5;
      return {date:String(row.date||''),technician:String(row.technician||row.technicianName||''),group:String(row.group||row.squadCode||''),quantity:num(row.quantity??row.att),notes,totalRatings,ratingSum};
    }).filter(r=>r.date&&r.technician&&r.group&&!EXCLUDED_TECHNICIANS.includes(normalizeName(r.technician)));
  }

  function addToMap(map,row,amount){
    const key=normalizeName(row.technician),current=map.get(key)||{technician:row.technician,group:row.group,totalQuantity:0,roundsSet:new Set()};
    current.totalQuantity+=num(amount);current.roundsSet.add(row.date);current.group=current.group||row.group;map.set(key,current);
  }
  function rankFromMap(map){
    return [...map.values()].map(item=>({technician:item.technician,group:item.group,totalQuantity:item.totalQuantity,roundsParticipated:item.roundsSet.size,averagePerRound:item.roundsSet.size?item.totalQuantity/item.roundsSet.size:0}))
      .sort((a,b)=>b.totalQuantity-a.totalQuantity||b.averagePerRound-a.averagePerRound||a.technician.localeCompare(b.technician,'pt-BR'))
      .map((item,index)=>({...item,position:index+1}));
  }
  function addNotesToMap(map,row){
    const key=normalizeName(row.technician),current=map.get(key)||{technician:row.technician,group:row.group,totalRatings:0,ratingSum:0,roundsSet:new Set()};
    current.totalRatings+=num(row.totalRatings);current.ratingSum+=num(row.ratingSum);if(num(row.totalRatings)>0)current.roundsSet.add(row.date);current.group=current.group||row.group;map.set(key,current);
  }
  function rankNotesFromMap(map){
    return [...map.values()].filter(item=>item.totalRatings>0).map(item=>({technician:item.technician,group:item.group,totalRatings:item.totalRatings,ratingSum:item.ratingSum,averageRating:item.totalRatings?item.ratingSum/item.totalRatings:0,roundsParticipated:item.roundsSet.size}))
      .sort((a,b)=>b.totalRatings-a.totalRatings||b.averageRating-a.averageRating||a.technician.localeCompare(b.technician,'pt-BR'))
      .map((item,index)=>({...item,position:index+1}));
  }
  function movement(previousPosition,currentPosition){
    if(!previousPosition)return{label:'novo',value:0,icon:'◎',className:'new'};
    const delta=previousPosition-currentPosition;
    if(delta>0)return{label:`+${delta}`,value:delta,icon:'▲',className:'up'};
    if(delta<0)return{label:`${delta}`,value:delta,icon:'▼',className:'down'};
    return{label:'=',value:0,icon:'━',className:'same'};
  }
  function buildOverallRanking(rows,previousDate){
    const full=new Map(),prev=new Map();rows.forEach(row=>{addToMap(full,row,row.quantity);if(previousDate&&row.date<=previousDate)addToMap(prev,row,row.quantity)});
    const pp=new Map(rankFromMap(prev).map(item=>[normalizeName(item.technician),item.position]));
    return rankFromMap(full).map(item=>({...item,movement:movement(pp.get(normalizeName(item.technician)),item.position)}));
  }
  function buildDayRanking(rows,date,previousDate){
    const day=new Map(),prev=new Map();rows.forEach(row=>{if(row.date===date)addToMap(day,row,row.quantity);if(previousDate&&row.date===previousDate)addToMap(prev,row,row.quantity)});
    const pp=new Map(rankFromMap(prev).map(item=>[normalizeName(item.technician),item.position]));
    return rankFromMap(day).map(item=>({...item,date,movement:movement(pp.get(normalizeName(item.technician)),item.position)}));
  }
  function buildNoteRanking(rows,date='',previousDate=''){
    const full=new Map(),prev=new Map();rows.forEach(row=>{if(!date||row.date===date)addNotesToMap(full,row)});rows.forEach(row=>{if(!previousDate)return;if(date){if(row.date===previousDate)addNotesToMap(prev,row)}else if(row.date<=previousDate)addNotesToMap(prev,row)});
    const pp=new Map(rankNotesFromMap(prev).map(item=>[normalizeName(item.technician),item.position]));
    return rankNotesFromMap(full).map(item=>({...item,totalQuantity:item.totalRatings,averagePerRound:item.averageRating,movement:movement(pp.get(normalizeName(item.technician)),item.position)}));
  }
  function buildGroupRanking(rows){
    const map=new Map();rows.forEach(row=>{const key=normalizeName(row.group),current=map.get(key)||{technician:row.group,group:row.group,totalQuantity:0,roundsSet:new Set()};current.totalQuantity+=row.quantity;current.roundsSet.add(row.date);map.set(key,current)});
    return [...map.values()].map(item=>({technician:item.technician,group:item.group,totalQuantity:item.totalQuantity,roundsParticipated:item.roundsSet.size,averagePerRound:item.roundsSet.size?item.totalQuantity/item.roundsSet.size:0}))
      .sort((a,b)=>b.totalQuantity-a.totalQuantity||b.averagePerRound-a.averagePerRound||a.technician.localeCompare(b.technician,'pt-BR'))
      .map((item,index)=>({...item,position:index+1,movement:{label:'grupo',value:0,icon:'◆',className:'same'}}));
  }
  function buildGroupNoteRanking(rows){
    const map=new Map();let periodTotal=0;rows.forEach(row=>{periodTotal+=row.totalRatings;const key=normalizeName(row.group),current=map.get(key)||{technician:row.group,group:row.group,totalRatings:0,ratingSum:0,roundsSet:new Set()};current.totalRatings+=row.totalRatings;current.ratingSum+=row.ratingSum;if(row.totalRatings>0)current.roundsSet.add(row.date);map.set(key,current)});
    return [...map.values()].filter(item=>item.totalRatings>0).map(item=>({technician:item.technician,group:item.group,totalRatings:item.totalRatings,ratingSum:item.ratingSum,totalQuantity:item.totalRatings,averageRating:item.totalRatings?item.ratingSum/item.totalRatings:0,percentageOfRatings:periodTotal?(item.totalRatings/periodTotal)*100:0,roundsParticipated:item.roundsSet.size,averagePerRound:item.roundsSet.size?item.totalRatings/item.roundsSet.size:0}))
      .sort((a,b)=>b.totalRatings-a.totalRatings||b.averageRating-a.averageRating||a.technician.localeCompare(b.technician,'pt-BR'))
      .map((item,index)=>({...item,position:index+1,movement:{label:'grupo',value:0,icon:'◆',className:'same'}}));
  }
  function calculate(rows){
    const normalized=normalizeRows(rows),rounds=[...new Set(normalized.map(r=>r.date))].sort(),lastDate=rounds.at(-1)||'',previousDate=rounds.length>1?rounds.at(-2):'';
    const overall=buildOverallRanking(normalized,previousDate),lastDay=buildDayRanking(normalized,lastDate,previousDate),noteOverall=buildNoteRanking(normalized,'',previousDate),noteDay=buildNoteRanking(normalized,lastDate,previousDate),groupRanking=buildGroupRanking(normalized),noteGroupRanking=buildGroupNoteRanking(normalized);
    const summary=normalized.reduce((a,r)=>{a.att+=r.quantity;a.eval+=r.totalRatings;a.ratingSum+=r.ratingSum;return a},{att:0,eval:0,ratingSum:0});
    summary.avg=summary.eval?summary.ratingSum/summary.eval:0;
    return{rows:normalized,rounds,lastDate,previousDate,overall,lastDay,noteOverall,noteDay,groupRanking,noteGroupRanking,summary};
  }
  function activeRows(){
    const r=state.rankings||{};const map={day:r.lastDay||[],notesDay:r.noteDay||[],general:r.overall||[],notesGeneral:r.noteOverall||[],group:r.groupRanking||[],notesGroup:r.noteGroupRanking||[]};
    const search=normalizeName($('#presentationSearch')?.value||''),group=$('#presentationGroupFilter')?.value||'';
    return (map[state.activeMode]||[]).filter(item=>(!search||normalizeName(item.technician).includes(search))&&(!group||item.group===group));
  }
  function modeMeta(){
    const meta={
      day:['Ranking Att Finalizado do Dia','Mostra somente a última rodada encontrada no período.'],
      notesDay:['Ranking de Notas do dia','Soma a quantidade de avaliações recebidas por técnico na última data do período.'],
      general:['Total Finalizados','Soma as rodadas do período filtrado.'],
      notesGeneral:['Total Notas','Soma a quantidade de avaliações por técnico dentro do período filtrado.'],
      group:['Ranking por grupo','Soma os atendimentos por Squad/grupo dentro do período filtrado.'],
      notesGroup:['Ranking de notas por grupo','Soma a quantidade de avaliações por Squad/grupo dentro do período filtrado.']
    };return meta[state.activeMode]||meta.general;
  }
  function getStatus(position,totalRows){
    if(state.activeMode==='group'||state.activeMode==='notesGroup')return{label:'◆ Grupo',rowClass:'',badgeClass:'status-middle'};
    if(position<=6)return{label:'🏆 G6',rowClass:'g6',badgeClass:'status-g6'};
    if(totalRows>=4&&position>totalRows-4)return{label:'⚠ Z4',rowClass:'z4',badgeClass:'status-z4'};
    return{label:'⚙ Meio',rowClass:'',badgeClass:'status-middle'};
  }
  function medal(position){if(position===1)return'<span class="presentation-medal gold">1</span>';if(position===2)return'<span class="presentation-medal silver">2</span>';if(position===3)return'<span class="presentation-medal bronze">3</span>';return''}
  function shortGroup(group){const t=String(group||'').trim();if(!t)return'-';return t.length<=3?t.toUpperCase():t.replace(/^SQUAD\s+/i,'').slice(0,3).toUpperCase()}
  function renderRow(item,totalRows,index){
    const status=getStatus(item.position,totalRows),mv=item.movement||{label:'novo',icon:'◎',className:'new'},notesMode=['notesDay','notesGeneral','notesGroup'].includes(state.activeMode),groupMode=['group','notesGroup'].includes(state.activeMode);
    return `<tr class="${status.rowClass}" style="animation-delay:${index*18}ms"><td class="presentation-pos">${item.position}º ${medal(item.position)}</td><td class="presentation-tech" title="${escapeHtml(item.technician)}">${escapeHtml(item.technician)}</td><td><span class="presentation-squad-badge">${escapeHtml(groupMode?'GRP':shortGroup(item.group))}</span></td><td class="presentation-num">${formatNumber(item.totalQuantity)}</td>${notesMode?`<td class="presentation-num">${formatDecimal(item.averageRating)}</td>`:''}${state.activeMode==='notesGroup'?`<td class="presentation-num">${formatPercent(item.percentageOfRatings)}</td>`:''}<td><span class="presentation-move ${mv.className}">${mv.icon} ${escapeHtml(mv.label)}</span></td><td><span class="presentation-status ${status.badgeClass}">${status.label}</span></td></tr>`;
  }
  function buildTable(rows,totalRows){
    if(!rows.length)return'<div class="presentation-empty">Sem dados nesta coluna.</div>';
    const notesMode=['notesDay','notesGeneral','notesGroup'].includes(state.activeMode),groupMode=['group','notesGroup'].includes(state.activeMode);
    return `<table class="presentation-table"><thead><tr><th>Pos.</th><th>${groupMode?'Grupo':'Técnico'}</th><th>${groupMode?'Tipo':'Squad'}</th><th>${notesMode?'Aval.':'Total'}</th>${notesMode?'<th>Média</th>':''}${state.activeMode==='notesGroup'?'<th>% do total</th>':''}<th>Mov.</th><th>Status</th></tr></thead><tbody>${rows.map((item,index)=>renderRow(item,totalRows,index)).join('')}</tbody></table>`;
  }
  function renderSpotlights(rows){
    const wrap=$('#presentationSpotlights');if(!wrap)return;
    const groupMode=['group','notesGroup'].includes(state.activeMode),hide=groupMode||!state.config.spotlights;wrap.classList.toggle('hidden',hide);if(hide)return;
    const g6=rows.slice(0,6),z4=rows.slice(-4);
    const mini=item=>`<div class="presentation-mini-row"><span>${item.position}º</span><strong>${escapeHtml(item.technician)}</strong><b>${formatNumber(item.totalQuantity)}</b></div>`;
    $('#presentationG6').innerHTML=g6.length?g6.map(mini).join(''):'<div class="presentation-empty small">Sem dados</div>';
    $('#presentationZ4').innerHTML=z4.length?z4.map(mini).join(''):'<div class="presentation-empty small">Sem dados</div>';
  }
  function renderTabs(){
    const modes=activeModes(),tabs=$('.presentation-tabs');
    $$('[data-presentation-mode]').forEach(btn=>{const mode=btn.dataset.presentationMode,enabled=modes.includes(mode),active=mode===state.activeMode;btn.classList.toggle('hidden',!enabled);btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false');if(enabled&&tabs)tabs.appendChild(btn)});
    if(!modes.includes(state.activeMode))state.activeMode=modes[0];
    const meta=modeMeta();if($('#presentationRankingTitle'))$('#presentationRankingTitle').textContent=meta[0];if($('#presentationRankingSubtitle'))$('#presentationRankingSubtitle').textContent=meta[1];
    if($('#presentationCarouselBtn'))$('#presentationCarouselBtn').textContent=state.carouselEnabled?'🎠 Carrossel ON':'🎠 Carrossel OFF';
    updateCarouselProgress();syncNote();
  }
  function updateCarouselProgress(now=Date.now()){
    const note=$('#presentationCarouselNote'),bar=$('#presentationCycleProgress');
    if(!state.carouselEnabled){if(note)note.textContent='Carrossel pausado';if(bar)bar.style.width='0%';return}
    if(document.hidden){if(note)note.textContent='Carrossel aguardando a tela voltar ao foco';return}
    if(state.manualPauseUntil>now){const sec=Math.max(1,Math.ceil((state.manualPauseUntil-now)/1000));if(note)note.textContent=`Troca manual • carrossel retoma em ${sec}s`;if(bar)bar.style.width='0%';return}
    state.autoSwitch=true;
    const elapsed=Math.max(0,now-state.cycleStartedAt),pct=Math.min(100,(elapsed/state.carouselDuration)*100),remaining=Math.max(0,Math.ceil((state.carouselDuration-elapsed)/1000));
    if(note)note.textContent=`Próxima tela em ${remaining}s • carrossel ativo`;if(bar)bar.style.width=`${pct}%`;
  }
  function advanceCarousel(){const modes=activeModes(),i=modes.indexOf(state.activeMode);state.activeMode=modes[(i+1)%modes.length];state.cycleStartedAt=Date.now();renderAll();}
  function renderGroups(){
    const sel=$('#presentationGroupFilter');if(!sel||!state.rankings)return;const current=sel.value,groups=[...new Set(state.rankings.rows.map(r=>r.group))].sort((a,b)=>a.localeCompare(b,'pt-BR'));sel.innerHTML='<option value="">Todos os grupos</option>'+groups.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');if(groups.includes(current))sel.value=current;
  }
  function renderRanking(){
    const rows=activeRows(),container=$('#presentationRankingColumns');if(!container)return;renderSpotlights(rows);
    if(!rows.length){container.innerHTML='<div class="presentation-empty">Nenhum dado encontrado para esta visualização.</div>';return;}
    const groupMode=['group','notesGroup'].includes(state.activeMode),direct=document.body.classList.contains('presentation-direct'),layout=state.config.columns;
    const two=layout==='2'||(layout==='auto'&&!groupMode&&(direct||rows.length>8));
    if(two){const half=Math.ceil(rows.length/2);container.classList.add('two-columns');container.innerHTML=`<div>${buildTable(rows.slice(0,half),rows.length)}</div><div>${buildTable(rows.slice(half),rows.length)}</div>`;}
    else{container.classList.remove('two-columns');container.innerHTML=`<div>${buildTable(rows,rows.length)}</div>`;}
  }
  function renderHeader(payload){
    const r=state.rankings;if(!r)return;
    if($('#presentationTitle'))$('#presentationTitle').textContent=payload.title||'Apresentação';
    if($('#presentationSubtitle'))$('#presentationSubtitle').textContent=payload.subtitle||'Performance Suporte Técnico';
    if($('#presentationPeriod'))$('#presentationPeriod').textContent=payload.periodLabel||'-';
    if($('#presentationUpdated'))$('#presentationUpdated').textContent=payload.updatedLabel||'Fonte: Performance Hub';
    if($('#presentationLastDate'))$('#presentationLastDate').textContent=formatDateBR(r.lastDate);
    if($('#presentationDays'))$('#presentationDays').textContent=formatNumber(r.rounds.length);
    if($('#presentationAttLeader'))$('#presentationAttLeader').textContent=r.overall[0]?.technician||'-';
    if($('#presentationNotesLeader'))$('#presentationNotesLeader').textContent=r.noteOverall[0]?.technician||'-';
    if($('#presentationAvg'))$('#presentationAvg').textContent=r.summary.eval?formatDecimal(r.summary.avg):'-';
    if($('#presentationTotalRatings'))$('#presentationTotalRatings').textContent=formatNumber(r.summary.eval);
  }
  function renderAll(){if(!state.payload)return;
    if(route.direct)$('#presentationAdminPanel')?.classList.add('hidden');
    $('.presentation-kpis')?.classList.toggle('hidden',!state.config.kpis);
    $('.presentation-filters')?.classList.toggle('hidden',route.direct&&!state.config.filters);
    renderHeader(state.payload);renderTabs();renderGroups();renderRanking();renderAdminConfig();scheduleDisplayFit();
  }
  function restartRefreshTimer(){clearInterval(state.refreshTimer);state.refreshEveryMs=state.config.refresh*60*1000;state.refreshTimer=setInterval(()=>triggerRefresh('interval'),state.refreshEveryMs)}
  function applyRuntimeConfig(config,persist=true){
    state.config=normalizeConfig(config);if(persist&&!route.direct)state.config=saveConfig(state.config);
    state.carouselDuration=state.config.interval*1000;state.carouselEnabled=state.config.carousel;state.refreshEveryMs=state.config.refresh*60*1000;
    if(!activeModes().includes(state.activeMode))state.activeMode=state.config.start||activeModes()[0];
    if(state.bound)restartRefreshTimer();state.cycleStartedAt=Date.now();scheduleDisplayFit();
    return state.config;
  }
  function configFromForm(){
    const rows=$$('#presentationConfigModeList [data-config-mode]'),modes=rows.filter(r=>r.querySelector('input')?.checked).map(r=>r.dataset.configMode);
    return normalizeConfig({squad:$('#presentationConfigSquad')?.value||'all',interval:Number($('#presentationConfigInterval')?.value||20),refresh:Number($('#presentationConfigRefresh')?.value||5),columns:$('#presentationConfigColumns')?.value||'auto',fit:$('#presentationConfigFit')?.value||'auto',scale:$('#presentationConfigScale')?.value||'auto',density:$('#presentationConfigDensity')?.value||'auto',safe:Number($('#presentationConfigSafe')?.value||8),carousel:!!$('#presentationConfigCarousel')?.checked,kpis:!!$('#presentationConfigKpis')?.checked,spotlights:!!$('#presentationConfigSpotlights')?.checked,filters:!!$('#presentationConfigFilters')?.checked,modes,start:modes[0]});
  }
  function updateConfigUrl(){const el=$('#presentationConfigUrl');if(!el)return;const cfg=configFromForm();el.textContent=directUrl(cfg.squad,cfg);el.title=el.textContent}
  function moveConfigMode(mode,delta){const list=$('#presentationConfigModeList'),row=list?.querySelector(`[data-config-mode="${mode}"]`);if(!row||!list)return;const sib=delta<0?row.previousElementSibling:row.nextElementSibling;if(sib)list.insertBefore(delta<0?row:sib,delta<0?sib:row);updateConfigUrl()}
  function populateAdminForm(config){
    const cfg=normalizeConfig(config||state.config),list=$('#presentationConfigModeList');
    if(list){list.innerHTML=cfg.modes.concat(ALL_MODES.filter(m=>!cfg.modes.includes(m))).map(mode=>`<div class="presentation-config-mode" data-config-mode="${mode}"><label><input type="checkbox" ${cfg.modes.includes(mode)?'checked':''}><span>${MODE_LABELS[mode]}</span></label><div><button type="button" data-mode-up="${mode}" title="Mover para cima">↑</button><button type="button" data-mode-down="${mode}" title="Mover para baixo">↓</button></div></div>`).join('');list.dataset.ready='1'}
    const set=(id,val)=>{const e=$(id);if(e)e.value=String(val)};set('#presentationConfigSquad',cfg.squad);set('#presentationConfigInterval',cfg.interval);set('#presentationConfigRefresh',cfg.refresh);set('#presentationConfigColumns',cfg.columns);set('#presentationConfigFit',cfg.fit);set('#presentationConfigScale',cfg.scale);set('#presentationConfigDensity',cfg.density);set('#presentationConfigSafe',cfg.safe);
    if($('#presentationConfigCarousel'))$('#presentationConfigCarousel').checked=cfg.carousel;if($('#presentationConfigKpis'))$('#presentationConfigKpis').checked=cfg.kpis;if($('#presentationConfigSpotlights'))$('#presentationConfigSpotlights').checked=cfg.spotlights;if($('#presentationConfigFilters'))$('#presentationConfigFilters').checked=cfg.filters;updateConfigUrl();
    return cfg;
  }
  function renderAdminConfig(){
    const panel=$('#presentationAdminPanel');if(!panel||route.direct)return;
    const list=$('#presentationConfigModeList');if(!list?.dataset.ready)populateAdminForm(state.config);else updateConfigUrl();
  }
  function loadAdminDraft(config){if(route.direct)return normalizeConfig(config);return populateAdminForm(config)}
  function bindAdminConfig(){
    if(state.adminBound)return;state.adminBound=true;
    $('#presentationAdminPanel')?.addEventListener('change',e=>{if(e.target.matches('input,select'))updateConfigUrl()});
    $('#presentationConfigModeList')?.addEventListener('click',e=>{const up=e.target.closest('[data-mode-up]'),down=e.target.closest('[data-mode-down]');if(up)moveConfigMode(up.dataset.modeUp,-1);if(down)moveConfigMode(down.dataset.modeDown,1)});
    $('#presentationApplyConfigBtn')?.addEventListener('click',()=>{const cfg=applyRuntimeConfig(configFromForm(),true);window.dispatchEvent(new CustomEvent('soften:presentation-config-applied',{detail:cfg}));renderAll()});
    $('#presentationResetConfigBtn')?.addEventListener('click',()=>{state.config=saveConfig(DEFAULT_CONFIG);populateAdminForm(state.config);if(state.payload)renderAll()});
    $('#presentationConfigCopyBtn')?.addEventListener('click',async()=>{const url=directUrl(configFromForm().squad,configFromForm());try{await navigator.clipboard.writeText(url)}catch(e){window.prompt('Copie a URL:',url)}});
    $('#presentationConfigOpenBtn')?.addEventListener('click',()=>{const cfg=configFromForm();window.open(directUrl(cfg.squad,cfg),'_blank','noopener')});
  }
  function syncAdminConfig(){bindAdminConfig();renderAdminConfig();}

  function setMode(mode,manual=true){
    if(!activeModes().includes(mode))return;state.activeMode=mode;state.cycleStartedAt=Date.now();
    if(manual){state.autoSwitch=false;state.manualPauseUntil=Date.now()+60000}else{state.autoSwitch=true;state.manualPauseUntil=0}
    renderAll();emitHeartbeat('mode');
  }
  function toggleCarousel(){state.carouselEnabled=!state.carouselEnabled;state.config.carousel=state.carouselEnabled;if(!route.direct)saveConfig(state.config);state.cycleStartedAt=Date.now();if(state.carouselEnabled){state.autoSwitch=true;state.manualPauseUntil=0}renderTabs();}
  function bind(){
    if(state.bound)return;state.bound=true;syncAdminConfig();
    $$('[data-presentation-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.presentationMode,true)));
    $('#presentationCarouselBtn')?.addEventListener('click',toggleCarousel);
    $('#presentationRefreshBtn')?.addEventListener('click',()=>triggerRefresh('manual'));
    $('#presentationRetryBtn')?.addEventListener('click',()=>triggerRefresh('retry'));
    $('#presentationSearch')?.addEventListener('input',renderRanking);
    $('#presentationGroupFilter')?.addEventListener('change',renderRanking);
    $('#view-presentation')?.addEventListener('dblclick',e=>{if(e.target.closest('button,input,select'))return;requestFullscreen().catch(()=>{})});
    window.addEventListener('resize',()=>{if(document.body.classList.contains('presentation-direct')){renderRanking();scheduleDisplayFit()}});
    window.addEventListener('online',()=>{connectionState('syncing','Conexão restabelecida','Sincronizando os dados mais recentes…');setTimeout(()=>triggerRefresh('online'),600)});
    window.addEventListener('offline',()=>{connectionState('offline','Sem conexão','Exibindo os últimos dados carregados. A sincronização será retomada automaticamente.');scheduleReconnect()});
    document.addEventListener('fullscreenchange',()=>{updateFullscreenButton();scheduleDisplayFit()});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){state.cycleStartedAt=Date.now();requestWakeLock();if(navigator.onLine!==false&&Date.now()-state.lastSuccessfulRefresh>state.refreshEveryMs)triggerRefresh('visible')}});
    document.addEventListener('keydown',e=>{
      if(e.target?.matches?.('input,select,textarea'))return;
      if(e.key==='f'||e.key==='F'){e.preventDefault();(document.fullscreenElement?exitFullscreen():requestFullscreen()).catch(()=>{})}
      else if(e.key===' '){e.preventDefault();toggleCarousel()}
      else if(e.key==='ArrowRight'){e.preventDefault();const modes=activeModes(),i=modes.indexOf(state.activeMode);setMode(modes[(i+1)%modes.length],true)}
      else if(e.key==='ArrowLeft'){e.preventDefault();const modes=activeModes(),i=modes.indexOf(state.activeMode);setMode(modes[(i-1+modes.length)%modes.length],true)}
      else if(e.key==='r'||e.key==='R'){e.preventDefault();triggerRefresh('keyboard')}
    });
    state.cycleTimer=setInterval(()=>{
      const now=Date.now();updateCarouselProgress(now);
      if(!state.carouselEnabled||document.hidden)return;
      if(state.manualPauseUntil>now)return;
      if(!state.autoSwitch){state.autoSwitch=true;state.cycleStartedAt=now;return}
      if(now-state.cycleStartedAt>=state.carouselDuration)advanceCarousel();
    },500);
    restartRefreshTimer();
    if('ResizeObserver' in window){state.fitObserver=new ResizeObserver(()=>scheduleDisplayFit());const shell=$('.presentation-shell');if(shell)state.fitObserver.observe(shell)}
    if(navigator.onLine===false)connectionState('offline','Sem conexão','Exibindo os últimos dados carregados. A sincronização será retomada automaticamente.');else connectionState('online');
    updateFullscreenButton();requestWakeLock();restartHeartbeat();
  }
  function render(payload){
    applyRuntimeConfig(state.config,false);
    state.payload=payload||{};state.rankings=calculate(payload?.rows||[]);if(typeof payload?.refresh==='function')state.refreshHandler=payload.refresh;
    if(payload?.refreshedAt)state.lastSuccessfulRefresh=new Date(payload.refreshedAt).getTime()||Date.now();
    else if(!state.lastSuccessfulRefresh)state.lastSuccessfulRefresh=Date.now();
    bind();renderAll();emitHeartbeat('render');
  }

  window.SoftenPresentation = {route,directUrl,normalUrl,setDirectMode,requestFullscreen,exitFullscreen,render,setMode,refresh:triggerRefresh,getConfig:()=>normalizeConfig(state.config),getFormConfig:()=>configFromForm(),loadAdminDraft,applyConfig:(cfg)=>{applyRuntimeConfig(cfg,!route.direct);if(state.payload)renderAll();else renderAdminConfig()},syncAdminConfig,getRuntimeStatus:runtimeStatus,emitHeartbeat,fit:()=>{scheduleDisplayFit()},__test:{calculate,normalizeRows,normalizeConfig}};
})();
