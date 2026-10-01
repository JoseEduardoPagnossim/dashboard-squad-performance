(() => {
  const params = new URLSearchParams(window.location.search);
  const route = {
    enabled: params.get('view') === 'presentation',
    squad: (params.get('squad') || '').trim().toUpperCase(),
    direct: params.get('view') === 'presentation'
  };

  const MODES = ['day','notesDay','general','notesGeneral','group','notesGroup'];
  const EXCLUDED_TECHNICIANS = [
    'Jose Eduardo Pagnossim','Heitor Drago Gois','João Paulo Cardoso','Eduardo Thomaz','Renata Romão',
    'LETICIA SANCHES','PAMELA MUNHOZ','HAMILTON MACHADO','JUAN DELFINO','LEONARDO TOFOLETTI',
    'ERIC JUSSANI','GABRIEL ANDRADE FIRMINO'
  ].map(normalizeName);

  const state = {
    payload:null,
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
    rankings:null,
    wakeLock:null
  };

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
  function directUrl(squad){
    const url = new URL(window.location.href);
    url.searchParams.set('view','presentation');
    if(squad && squad !== 'all') url.searchParams.set('squad',String(squad).toUpperCase());
    else if(squad === 'all') url.searchParams.set('squad','all');
    else url.searchParams.delete('squad');
    url.hash='';
    return url.toString();
  }
  function normalUrl(){
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('squad');
    url.hash='';
    return url.toString();
  }
  function setDirectMode(active){ document.body.classList.toggle('presentation-direct',!!active);if(active)requestWakeLock(); }
  function requestFullscreen(){ const el=document.documentElement;if(document.fullscreenElement)return Promise.resolve();return el.requestFullscreen?el.requestFullscreen():Promise.resolve(); }
  function exitFullscreen(){ if(!document.fullscreenElement)return Promise.resolve();return document.exitFullscreen?document.exitFullscreen():Promise.resolve(); }
  function pad2(v){return String(v).padStart(2,'0')}
  function clockLabel(ts=Date.now()){const d=new Date(ts);return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`}
  async function requestWakeLock(){
    if(!route.direct||document.hidden||!('wakeLock' in navigator))return;
    try{state.wakeLock=await navigator.wakeLock.request('screen');state.wakeLock.addEventListener?.('release',()=>{state.wakeLock=null})}catch(e){}
  }
  function updateFullscreenButton(){const btn=$('#presentationFullscreenBtn');if(btn)btn.textContent=document.fullscreenElement?'⛶ Sair da tela cheia':'⛶ Tela cheia'}
  function connectionState(kind,title,text){
    const pill=$('#presentationConnectionPill'),banner=$('#presentationConnectionBanner'),pt=pill?.querySelector('strong');
    if(pill){pill.classList.remove('online','syncing','offline','degraded');pill.classList.add(kind);if(pt)pt.textContent=kind==='online'?'Online':kind==='syncing'?'Sincronizando':kind==='offline'?'Sem conexão':'Atenção';}
    if(banner){const show=kind==='offline'||kind==='degraded';banner.classList.toggle('hidden',!show);banner.classList.toggle('offline',kind==='offline');banner.classList.toggle('degraded',kind==='degraded');}
    if($('#presentationConnectionTitle'))$('#presentationConnectionTitle').textContent=title||'';
    if($('#presentationConnectionText'))$('#presentationConnectionText').textContent=text||'';
  }
  function syncNote(){
    const el=$('#presentationSyncNote');if(!el)return;
    if(state.refreshInFlight){el.textContent='Sincronizando dados agora…';return}
    if(state.lastSuccessfulRefresh){el.textContent=`Última sincronização ${clockLabel(state.lastSuccessfulRefresh)} • automática a cada 5 min`;return}
    el.textContent='Atualização automática a cada 5 min';
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
      state.lastSuccessfulRefresh=Date.now();state.lastRefreshError=null;connectionState('online');
    }catch(err){
      state.lastRefreshError=err;connectionState(navigator.onLine===false?'offline':'degraded',navigator.onLine===false?'Sem conexão':'Falha na atualização',navigator.onLine===false?'Exibindo os últimos dados carregados. A sincronização será retomada automaticamente.':'Não foi possível buscar novos dados. A apresentação continuará com a última atualização válida e tentará novamente em 1 minuto.');scheduleReconnect();
    }finally{
      state.refreshInFlight=false;if(btn){btn.disabled=false;btn.textContent='↻ Atualizar agora'}syncNote();
    }
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
    const groupMode=['group','notesGroup'].includes(state.activeMode);wrap.classList.toggle('hidden',groupMode);if(groupMode)return;
    const g6=rows.slice(0,6),z4=rows.slice(-4);
    const mini=item=>`<div class="presentation-mini-row"><span>${item.position}º</span><strong>${escapeHtml(item.technician)}</strong><b>${formatNumber(item.totalQuantity)}</b></div>`;
    $('#presentationG6').innerHTML=g6.length?g6.map(mini).join(''):'<div class="presentation-empty small">Sem dados</div>';
    $('#presentationZ4').innerHTML=z4.length?z4.map(mini).join(''):'<div class="presentation-empty small">Sem dados</div>';
  }
  function renderTabs(){
    $$('[data-presentation-mode]').forEach(btn=>{const active=btn.dataset.presentationMode===state.activeMode;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false')});
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
  function advanceCarousel(){const i=MODES.indexOf(state.activeMode);state.activeMode=MODES[(i+1)%MODES.length];state.cycleStartedAt=Date.now();renderAll();}
  function renderGroups(){
    const sel=$('#presentationGroupFilter');if(!sel||!state.rankings)return;const current=sel.value,groups=[...new Set(state.rankings.rows.map(r=>r.group))].sort((a,b)=>a.localeCompare(b,'pt-BR'));sel.innerHTML='<option value="">Todos os grupos</option>'+groups.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');if(groups.includes(current))sel.value=current;
  }
  function renderRanking(){
    const rows=activeRows(),container=$('#presentationRankingColumns');if(!container)return;renderSpotlights(rows);
    if(!rows.length){container.innerHTML='<div class="presentation-empty">Nenhum dado encontrado para esta visualização.</div>';return;}
    const groupMode=['group','notesGroup'].includes(state.activeMode),direct=document.body.classList.contains('presentation-direct');
    if(!groupMode&&(direct||rows.length>8)){const half=Math.ceil(rows.length/2);container.classList.add('two-columns');container.innerHTML=`<div>${buildTable(rows.slice(0,half),rows.length)}</div><div>${buildTable(rows.slice(half),rows.length)}</div>`;}
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
  function renderAll(){if(!state.payload)return;renderHeader(state.payload);renderTabs();renderGroups();renderRanking();}
  function setMode(mode,manual=true){
    if(!MODES.includes(mode))return;state.activeMode=mode;state.cycleStartedAt=Date.now();
    if(manual){state.autoSwitch=false;state.manualPauseUntil=Date.now()+60000}else{state.autoSwitch=true;state.manualPauseUntil=0}
    renderAll();
  }
  function toggleCarousel(){state.carouselEnabled=!state.carouselEnabled;state.cycleStartedAt=Date.now();if(state.carouselEnabled){state.autoSwitch=true;state.manualPauseUntil=0}renderTabs();}
  function bind(){
    if(state.bound)return;state.bound=true;
    $$('[data-presentation-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.presentationMode,true)));
    $('#presentationCarouselBtn')?.addEventListener('click',toggleCarousel);
    $('#presentationRefreshBtn')?.addEventListener('click',()=>triggerRefresh('manual'));
    $('#presentationRetryBtn')?.addEventListener('click',()=>triggerRefresh('retry'));
    $('#presentationSearch')?.addEventListener('input',renderRanking);
    $('#presentationGroupFilter')?.addEventListener('change',renderRanking);
    $('#view-presentation')?.addEventListener('dblclick',e=>{if(e.target.closest('button,input,select'))return;requestFullscreen().catch(()=>{})});
    window.addEventListener('resize',()=>{if(document.body.classList.contains('presentation-direct'))renderRanking()});
    window.addEventListener('online',()=>{connectionState('syncing','Conexão restabelecida','Sincronizando os dados mais recentes…');setTimeout(()=>triggerRefresh('online'),600)});
    window.addEventListener('offline',()=>{connectionState('offline','Sem conexão','Exibindo os últimos dados carregados. A sincronização será retomada automaticamente.');scheduleReconnect()});
    document.addEventListener('fullscreenchange',updateFullscreenButton);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){state.cycleStartedAt=Date.now();requestWakeLock();if(navigator.onLine!==false&&Date.now()-state.lastSuccessfulRefresh>state.refreshEveryMs)triggerRefresh('visible')}});
    document.addEventListener('keydown',e=>{
      if(e.target?.matches?.('input,select,textarea'))return;
      if(e.key==='f'||e.key==='F'){e.preventDefault();(document.fullscreenElement?exitFullscreen():requestFullscreen()).catch(()=>{})}
      else if(e.key===' '){e.preventDefault();toggleCarousel()}
      else if(e.key==='ArrowRight'){e.preventDefault();const i=MODES.indexOf(state.activeMode);setMode(MODES[(i+1)%MODES.length],true)}
      else if(e.key==='ArrowLeft'){e.preventDefault();const i=MODES.indexOf(state.activeMode);setMode(MODES[(i-1+MODES.length)%MODES.length],true)}
      else if(e.key==='r'||e.key==='R'){e.preventDefault();triggerRefresh('keyboard')}
    });
    state.cycleTimer=setInterval(()=>{
      const now=Date.now();updateCarouselProgress(now);
      if(!state.carouselEnabled||document.hidden)return;
      if(state.manualPauseUntil>now)return;
      if(!state.autoSwitch){state.autoSwitch=true;state.cycleStartedAt=now;return}
      if(now-state.cycleStartedAt>=state.carouselDuration)advanceCarousel();
    },500);
    state.refreshTimer=setInterval(()=>triggerRefresh('interval'),state.refreshEveryMs);
    if(navigator.onLine===false)connectionState('offline','Sem conexão','Exibindo os últimos dados carregados. A sincronização será retomada automaticamente.');else connectionState('online');
    updateFullscreenButton();requestWakeLock();
  }
  function render(payload){
    state.payload=payload||{};state.rankings=calculate(payload?.rows||[]);if(typeof payload?.refresh==='function')state.refreshHandler=payload.refresh;
    if(payload?.refreshedAt)state.lastSuccessfulRefresh=new Date(payload.refreshedAt).getTime()||Date.now();
    else if(!state.lastSuccessfulRefresh)state.lastSuccessfulRefresh=Date.now();
    bind();renderAll();
  }

  window.SoftenPresentation = {route,directUrl,normalUrl,setDirectMode,requestFullscreen,exitFullscreen,render,setMode,refresh:triggerRefresh,__test:{calculate,normalizeRows}};
})();
