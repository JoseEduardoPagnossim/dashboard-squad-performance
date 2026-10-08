(() => {
  const utils = window.SoftenPerformanceUtils;
  if(!utils) throw new Error('SoftenPerformanceUtils não carregado. Verifique js/core-utils.js.');
  const {MONTHS_PT,MONTH_SHEET,$,$$,fmtInt,fmtPct,fmtMoney,fmtNum,clamp,HISTORY_COLORS,safe,roundTo,clone,firstRelation}=utils;
  const businessCalendar = window.SoftenBusinessCalendar;
  if(!businessCalendar) throw new Error('SoftenBusinessCalendar não carregado. Verifique js/business-calendar.js.');
  const financeRules = window.SoftenFinanceRules;
  if(!financeRules) throw new Error('SoftenFinanceRules não carregado. Verifique js/finance-rules.js.');
  const {DEFAULT_FINANCE_SETTINGS}=financeRules;
  const financeAdvanced = window.SoftenFinanceAdvanced;
  if(!financeAdvanced) throw new Error('SoftenFinanceAdvanced não carregado. Verifique js/finance-advanced.js.');
  const auditUtils = window.SoftenAuditUtils;
  if(!auditUtils) throw new Error('SoftenAuditUtils não carregado. Verifique js/audit-utils.js.');
  const {sanitizeAuditValue,confirmationMatches,actionCategory,actionLabel}=auditUtils;
  const chartEngine = window.SoftenChartEngine;
  if(!chartEngine) throw new Error('SoftenChartEngine não carregado. Verifique js/chart-engine.js.');
  const {DEFAULT_PREFERENCES:DEFAULT_CHART_PREFERENCES,normalizePreferences:normalizeChartPreferences,labelVisible:chartEngineLabelVisible,configuredHeight:chartEngineConfiguredHeight,percentScale:chartEnginePercentScale,lineVisual:chartEngineLineVisual,applyCssVariables:applyChartCssVariables,nextRenderId:nextChartRenderId,splitPointSegments:splitChartPointSegments,smoothSvgPath,smoothAreaPath,seriesGradient:svgSeriesGradient,inlineLabel:chartInlineLabel,valueText:chartValueText,dataLabelSvg:chartDataLabelSvg,bindSharedTooltip:bindSharedChartTooltip,bindTooltips:bindChartTooltips}=chartEngine;
  const importEngine = window.SoftenImportEngine;
  if(!importEngine) throw new Error('SoftenImportEngine não carregado. Verifique js/import-engine.js.');
  const {checksumText:importChecksum,summarizeService:summarizeServiceImport,summarizeQuality:summarizeQualityImport,validatePreview:validateImportPreview,historySummary:normalizeImportHistory,canRollback:canRollbackImport}=importEngine;
  const parseCsvRows=importEngine.parseCsvRows;
  const predictiveEngine = window.SoftenPredictiveEngine;
  if(!predictiveEngine) throw new Error('SoftenPredictiveEngine não carregado. Verifique js/predictive-engine.js.');
  const alertEngine = window.SoftenAlertEngine;
  if(!alertEngine) throw new Error('SoftenAlertEngine não carregado. Verifique js/alert-engine.js.');
  const settingsEngine = window.SoftenSettingsEngine;
  if(!settingsEngine) throw new Error('SoftenSettingsEngine não carregado. Verifique js/settings-engine.js.');
  const performanceEngine = window.SoftenPerformanceEngine;
  if(!performanceEngine) throw new Error('SoftenPerformanceEngine nao carregado. Verifique js/performance-engine.js.');
  const {writeCache:writePerformanceCache,readCache:readPerformanceCache,clearScope:clearPerformanceCacheScope,createTracker:createPerformanceTracker,monthCacheId:performanceMonthCacheId,themeCacheId:performanceThemeCacheId,initialCacheId:performanceInitialCacheId,isFullMonth:isPerformanceFullMonth,markMonth:markPerformanceMonth,scheduleIdle:schedulePerformanceIdle,recordEvent:recordLocalPerformanceEvent,recordError:recordLocalPerformanceError,metricsSnapshot:getLocalPerformanceMetrics,resetMetrics:resetLocalPerformanceMetrics,observeLongTasks:observePerformanceLongTasks}=performanceEngine;
  const tvEngine = window.SoftenTvEngine;
  if(!tvEngine) throw new Error('SoftenTvEngine não carregado. Verifique js/tv-engine.js.');
  const {normalizePlaylist:normalizeTvPlaylist,normalizeDevice:normalizeTvDevice,statusForDevice:tvDeviceStatus,monitorSummary:tvMonitorSummary,humanAge:tvHumanAge,generateDeviceKey:generateTvDeviceKey,deviceUrl:buildTvDeviceUrl,heartbeatPayload:buildTvHeartbeatPayload}=tvEngine;
  const navigationEngine = window.SoftenNavigationEngine;
  if(!navigationEngine) throw new Error('SoftenNavigationEngine não carregado. Verifique js/navigation-engine.js.');
  const {routeFromLocation:readNavigationRoute,routeUrl:buildNavigationUrl,searchCommands:searchNavigationCommands,normalizeText:normalizeNavigationText}=navigationEngine;
  const workspaceEngine = window.SoftenWorkspaceEngine;
  if(!workspaceEngine) throw new Error('SoftenWorkspaceEngine não carregado. Verifique js/workspace-engine.js.');
  const filterSystem = window.SoftenFilterSystem;
  if(!filterSystem) throw new Error('SoftenFilterSystem não carregado. Verifique js/filter-system.js.');
  const {normalizeWorkspace,routeSignature:workspaceRouteSignature,mergeRememberedFilters:mergeWorkspaceRememberedFilters,rememberFilters:rememberWorkspaceFilters,createSavedView:createWorkspaceSavedView,renameSavedView:renameWorkspaceSavedView,deleteSavedView:deleteWorkspaceSavedView,favoriteForRoute:workspaceFavoriteForRoute,toggleFavorite:toggleWorkspaceFavorite,setPersistentFilters:setWorkspacePersistentFilters,clearFilterMemory:clearWorkspaceFilterMemory}=workspaceEngine;
  const {PERMISSIONS:PERMISSION_DEFS,defaultPreferences:defaultUiPreferences,normalizePreferences:normalizeBaseUiPreferences,layoutDefinition:settingsLayoutDefinition,normalizeLayout:normalizeUiLayout,moveBlock:moveUiBlock,toggleBlock:toggleUiBlock,setBlockSize:setUiBlockSize,normalizeNavigation:normalizeUiNavigation,effectivePermissions:settingsEffectivePermissions,permissionGroups:settingsPermissionGroups,normalizeRole:normalizeAccessRole}=settingsEngine;
  function normalizeUiPreferences(preferences){const raw=preferences&&typeof preferences==='object'?preferences:{},base=normalizeBaseUiPreferences(raw),legacy=Number(raw.version||0)<5,navigation=legacy?normalizeUiNavigation({sidebarCollapsed:base.navigation?.sidebarCollapsed===true}):base.navigation;return{...base,version:5,navigation,workspace:normalizeWorkspace(raw.workspace)}}

  const DEFAULT_FAVICON = 'assets/favicon-brasil.png';
  const DEFAULT_SOUNDTRACK = 'assets/casa-do-dragao-ambient.mp3';
  const DEFAULT_SOUNDTRACK_NAME = 'Ritmo da Torcida';
  const COLOR_MODE_KEY = 'softenPerformanceColorModeV1';
  const LAST_THEME_KEY = 'softenPerformanceLastThemeV1';
  const LAST_SQUAD_KEY = 'softenPerformanceLastSquadV1';
  const APP_VERSION = '2.49.1';
  const AVATAR_BUCKET = 'user-avatars';
  const AVATAR_MAX_SOURCE_BYTES = 5*1024*1024;
  const AVATAR_TARGET_BYTES = 100*1024;
  const PRESENTATION_ROUTE = window.SoftenPresentation?.route || {enabled:false,squad:'',direct:false};
  const SYSTEM_FONT_OPTIONS = Object.freeze({inter:{label:'Inter',stack:'\"Inter\",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif'},roboto:{label:'Roboto',stack:'\"Roboto\",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif'},'source-sans':{label:'Source Sans 3',stack:'\"Source Sans 3\",ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif'}});
  const DEFAULT_SYSTEM_FONT = 'inter';
  const DEFAULT_DARK_COLORS = {accent:'#f0a33a',secondary:'#ef5a29',bg:'#080b12',bg2:'#10141e',panel:'rgba(17,22,31,.88)',panel2:'rgba(24,30,42,.92)',text:'#f5f6f8',muted:'#9aa3b1',border:'rgba(255,255,255,.09)',success:'#36c98f',danger:'#f26363',warn:'#f2c14e',shadow:'0 18px 55px rgba(0,0,0,.34)'};
  const DEFAULT_LIGHT_COLORS = {accent:'#d97706',secondary:'#ea580c',bg:'#f3f6fa',bg2:'#f8fafc',panel:'rgba(255,255,255,.94)',panel2:'#ffffff',text:'#0f172a',muted:'#64748b',border:'rgba(148,163,184,.32)',success:'#16815f',danger:'#dc4c4c',warn:'#a16207',shadow:'0 12px 32px rgba(15,23,42,.08)'};
  const DEFAULT_THEME = {fontFamily:DEFAULT_SYSTEM_FONT,soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.20,favicon:DEFAULT_FAVICON,name:'Brasil em Campo',campaignTitle:'Brasil em Campo',campaignTagline:'Um só time. Uma só meta. Cada atendimento conta.',preset:'brasil',colors:{dark:{accent:'#FFD600',secondary:'#00A859',bg:'#031F18',bg2:'#071D31',panel:'rgba(7,35,29,.91)',panel2:'rgba(9,44,36,.95)',text:'#F8FAF7',muted:'#A9C1B8',border:'rgba(255,214,0,.15)',success:'#22C55E',danger:'#EF5350',warn:'#F7C948',shadow:'0 18px 55px rgba(0,15,11,.42)'},light:{accent:'#C89F00',secondary:'#087A3E',bg:'#EEF5F0',bg2:'#F7FAF8',panel:'rgba(255,255,255,.96)',panel2:'#FFFFFF',text:'#10261D',muted:'#60766D',border:'rgba(0,121,52,.18)',success:'#168547',danger:'#C93F3C',warn:'#A97800',shadow:'0 12px 32px rgba(15,58,37,.10)'}},accent:'#FFD600',secondary:'#00A859',bg:'#031F18',bg2:'#071D31',panel:'rgba(7,35,29,.91)',panel2:'rgba(9,44,36,.95)',text:'#F8FAF7',muted:'#A9C1B8',border:'rgba(255,214,0,.15)',background:'assets/brasil-em-campo-public.jpg',opacity:.20};
  const BOOT_FALLBACK_THEME = {fontFamily:DEFAULT_SYSTEM_FONT,name:'Soften Performance Hub',campaignTitle:'Performance Hub',campaignTagline:'Gestão de desempenho',preset:'bootstrap',soundtrack:null,soundtrackName:'',soundtrackVolume:.18,favicon:'assets/soften-logo-sidebar.png',colors:{dark:{...DEFAULT_DARK_COLORS,accent:'#20b7f5',secondary:'#176bd3'},light:{...DEFAULT_LIGHT_COLORS,accent:'#0284c7',secondary:'#2563eb'}},background:null,opacity:.06};
  const PUBLIC_THEME_ORG_SLUG = String(window.APP_CONFIG?.publicOrganizationSlug||'soften-sistemas').trim()||'soften-sistemas';
  const DEMO_USERS = Array.isArray(window.SOFTEN_DEMO_USERS) ? [...window.SOFTEN_DEMO_USERS] : [];

  function loadDemoCreatedUsers(){
    try{const v=JSON.parse(localStorage.getItem('squadDashboardDemoUsersV21')||'[]');return Array.isArray(v)?v:[]}catch(e){return []}
  }
  function allDemoUsers(){
    const extra=loadDemoCreatedUsers();
    const map=new Map();
    [...DEMO_USERS,...extra].forEach(u=>map.set(String(u.email||'').toLowerCase(),u));
    return [...map.values()];
  }
  function saveDemoCreatedUsers(list){localStorage.setItem('squadDashboardDemoUsersV21',JSON.stringify(list||[]))}
  function findDemoUser(email){return allDemoUsers().find(x=>String(x.email).toLowerCase()===String(email).toLowerCase())}

  const state = {
    user:null,
    supabase:null,
    squads:loadDemoSquads(),
    squadCode:'D',
    currentId:null,
    techName:null,
    theme:clone(DEFAULT_THEME),
    themeEditorSnapshot:null,
    themeEditorDirty:false,
    chartPreferences:clone(DEFAULT_CHART_PREFERENCES),
    appearanceScope:'squad',
    uiPreferences:defaultUiPreferences(),
    layoutDraft:null,
    homeLayoutEditMode:false,
    homeLayoutDraft:null,
    homeDraggedWidget:null,
    editPermissionDraft:{},
    colorMode:loadColorModePreference(),
    currentView:'home',
    adminSection:'operation',
    settingsModule:'all',
    userDirectory:[],
    userDirectoryLoaded:false,
    auditLogs:[],
    auditLoaded:false,
    auditLoading:false,
    auditError:null,
    internalNotifications:[],
    notificationReadIds:[],
    notificationsLoaded:false,
    notificationsLoading:false,
    notificationsRemoteAvailable:true,
    notificationsError:'',
    notificationRefreshTimer:null,
    notificationPopoverOpen:false,
    notificationFilters:{status:'all',source:'all',severity:'all',category:'all',search:''},
    routeApplying:false,
    globalSearchOpen:false,
    globalSearchIndex:0,
    globalSearchResults:[],
    workspacePopoverOpen:false,
    savedViewEditingId:null,
    recoveryMode:false,
    pendingCsv:null,
    importHistory:[],
    importHistoryLoaded:false,
    importHistoryLoading:false,
    importPreview:null,
    indicatorStartId:null,
    indicatorEndId:null,
    analysisStartDate:null,
    analysisEndDate:null,
    analysisPreset:'month',
    analysisMode:'competence',
    analysisCompetenceId:null,
    orgOverview:[],
    orgTechnicianOverview:[],
    orgDailyOverview:[],
    orgTechnicianDailyOverview:[],
    presentationLastSyncAt:null,
    presentationPlaylists:[],
    presentationDevices:[],
    presentationOpsLoaded:false,
    presentationOpsLoading:null,
    presentationOpsRemote:true,
    presentationPlaylistSelectedId:null,
    presentationRouteDevice:null,
    presentationRoutePlaylist:null,
    presentationRouteConfigSignature:'',
    presentationMonitorTimer:null,
    allTechniciansMetric:'points',
    allTechniciansRangeIds:[],
    dailyTechniciansMetric:'points',
    indicatorSection:'performance',
    businessDaysBaseId:null,
    businessDaysCompareCount:6,
    businessDaysCutoff:null,
    businessDaysLowType:'service',
    reconciliationCache:{},
    feedbackCache:{},
    feedbackLoading:{},
    feedbackEditor:null,
    myFeedbacks:null,
    myFeedbackLoading:false,
    superAdminCommissions:[],
    financeRankingCache:{},
    financeRankingLoading:{},
    financeMemoryCache:{},
    financeMemoryLoaded:{},
    financeMemoryLoading:{},
    financeMemoryError:{},
    financeSimulator:{periodKey:null,techName:null,result:null},
    businessCalendarRows:[],
    businessCalendarLoaded:false,
    businessCalendarLoading:null,
    businessCalendarRemoteAvailable:true,
    businessCalendarYear:new Date().getFullYear(),
    businessCalendarDraft:null,
    gameRankingCache:{},
    gameRankingLoading:{},
    supportCostMonthId:null,
    supportCostCache:{},
    supportCostLoading:{},
    financialImpactMonthId:null,
    financialImpactCache:{},
    financialImpactLoaded:false,
    financialImpactLoading:null,
    dataPromises:{},
    orgOverviewLoaded:false,
    orgOverviewLoading:null,
    superAdminCommissionsLoaded:false,
    superAdminCommissionsLoading:null,
    performanceDiagnostics:null,
    performanceTracker:null,
    performanceLoginStartedAt:null,
    performanceRemoteSummary:null,
    performanceRemoteLoading:false,
    performanceRemoteError:'',
    performanceTelemetryQueue:[],
    performanceTelemetryTimer:null,
    performanceTelemetryAvailable:true,
    initialContextSource:'',
    backgroundHydrationStarted:false,
    audio:{source:null,playing:false,pendingResume:false,previewing:false,previewBefore:null,fadeTimer:null}
  };


  const SETTINGS_MODULES={
    personalization:{label:'Meu painel',icon:'▦'},
    operation:{label:'Operação e metas',icon:'◎'},
    finance:{label:'Bonificação',icon:'R$'},
    appearance:{label:'Aparência e gráficos',icon:'✦'},
    presentation:{label:'Apresentação / TV',icon:'▣'},
    access:{label:'Usuários e permissões',icon:'♟'},
    system:{label:'Performance do sistema',icon:'◴'}
  };

  const ADMIN_SECTION_META={operation:{label:'Operação',icon:'↻'},finance:{label:'Bonificação',icon:'R$'},costs:{label:'Custos',icon:'⏱'},appearance:{label:'Aparência',icon:'✦'}};
  const INDICATOR_SECTION_META={performance:{label:'Indicadores gerais',icon:'◔'},quality:{label:'Qualidade',icon:'★'},'financial-impact':{label:'Impacto financeiro',icon:'R$'},'business-days':{label:'Dias úteis',icon:'▤'},detail:{label:'Detalhamento de qualidade',icon:'≡'}};
  const GLOBAL_NAV_COMMANDS=[
    {id:'home',label:'Início',description:'Resumo e atalhos do Performance Hub',group:'Navegação',icon:'⌂',view:'home',keywords:'home começo resumo dashboard'},
    {id:'alerts',label:'Central de Alertas',description:'Alertas automáticos e notificações internas',group:'Navegação',icon:'♢',view:'alerts',permission:'notifications.view',keywords:'alertas notificações avisos sino'},
    {id:'individual',label:'Meu desempenho',description:'Indicadores individuais do técnico selecionado',group:'Desempenho',icon:'◈',view:'individual',keywords:'tecnico individual produtividade avaliação pontos'},
    {id:'team',label:'Visão do Squad',description:'Performance consolidada do Squad',group:'Desempenho',icon:'♛',view:'team',keywords:'equipe squad ranking desempenho'},
    {id:'indicator-performance',label:'Indicadores gerais',description:'Visão executiva, produtividade e gestão preditiva',group:'Indicadores',icon:'◔',view:'indicators',indicatorSection:'performance',permission:'indicators.view',keywords:'indicadores geral gestão preditiva projeção'},
    {id:'indicator-quality',label:'Indicadores · Qualidade',description:'Serviço, Produto e Empresa',group:'Indicadores',icon:'★',view:'indicators',indicatorSection:'quality',permission:'indicators.view',keywords:'qualidade serviço produto empresa avaliação'},
    {id:'indicator-financial-impact',label:'Indicadores · Impacto financeiro',description:'Exposição financeira associada à qualidade',group:'Indicadores',icon:'R$',view:'indicators',indicatorSection:'financial-impact',permission:'indicators.view',keywords:'financeiro qualidade mrr risco receita clientes'},
    {id:'indicator-business-days',label:'Indicadores · Dias úteis',description:'Comparativo de competências pelo mesmo corte de dias úteis',group:'Indicadores',icon:'▤',view:'indicators',indicatorSection:'business-days',permission:'indicators.view',keywords:'dias úteis comparação competências meses'},
    {id:'indicator-detail',label:'Indicadores · Detalhamento',description:'Notas baixas e leitura detalhada por técnico',group:'Indicadores',icon:'≡',view:'indicators',indicatorSection:'detail',permission:'indicators.view',keywords:'detalhamento notas baixas técnico qualidade'},
    {id:'presentation',label:'Apresentação',description:'Ranking, TV e visualização de apresentação',group:'Desempenho',icon:'▣',view:'presentation',permission:'presentation.view',keywords:'tv apresentação ranking carrossel fullscreen'},
    {id:'admin-operation',label:'Operação',description:'Importação, metas e fechamento mensal',group:'Gestão',icon:'↻',view:'admin',adminSection:'operation',adminOnly:true,keywords:'operação importação metas mês'},
    {id:'admin-finance',label:'Bonificação',description:'Financeiro e memória de cálculo',group:'Gestão',icon:'R$',view:'admin',adminSection:'finance',permission:'finance.view',adminOnly:true,keywords:'financeiro bonificação comissão férias'},
    {id:'admin-costs',label:'Custos',description:'Custos operacionais do suporte',group:'Gestão',icon:'⏱',view:'admin',adminSection:'costs',permission:'costs.view',adminOnly:true,keywords:'custos folha horas operação'},
    {id:'feedbacks',label:'Feedbacks',description:'Gestão de feedbacks dos técnicos',group:'Pessoas',icon:'✎',view:'feedbacks',permission:'feedback.manage',adminOnly:true,keywords:'feedback pessoas técnico avaliação'},
    {id:'users',label:'Usuários',description:'Usuários, perfis e permissões',group:'Pessoas',icon:'♟',view:'users',permission:'users.manage',adminOnly:true,keywords:'usuários acessos permissões perfil'},
    {id:'audit',label:'Auditoria',description:'Histórico de ações administrativas',group:'Governança',icon:'⌁',view:'audit',permission:'audit.view',adminOnly:true,keywords:'auditoria histórico alterações ações'},
    {id:'settings',label:'Configurações',description:'Central de configurações do painel',group:'Configurações',icon:'⚙',view:'settings',keywords:'configurações ajustes preferências'},
    {id:'settings-personalization',label:'Configurações · Meu painel',description:'Layout, densidade e personalização individual',group:'Configurações',icon:'▦',view:'settings',settingsModule:'personalization',permission:'dashboard.customize',keywords:'layout widgets personalização painel'},
    {id:'settings-operation',label:'Configurações · Operação e metas',description:'Metas e parâmetros mensais',group:'Configurações',icon:'◎',view:'settings',settingsModule:'operation',adminOnly:true,keywords:'metas operação parâmetros'},
    {id:'settings-finance',label:'Configurações · Bonificação',description:'Modelo financeiro e regras de bonificação',group:'Configurações',icon:'R$',view:'settings',settingsModule:'finance',permission:'finance.view',adminOnly:true,keywords:'bonificação financeiro regras'},
    {id:'settings-appearance',label:'Configurações · Aparência e gráficos',description:'Tema, identidade visual e preferências de gráficos',group:'Configurações',icon:'✦',view:'settings',settingsModule:'appearance',permission:'appearance.manage',adminOnly:true,keywords:'tema aparência gráficos cores'},
    {id:'settings-presentation',label:'Configurações · Apresentação / TV',description:'Playlists, TVs e preferências da apresentação',group:'Configurações',icon:'▣',view:'settings',settingsModule:'presentation',permission:'presentation.manage',adminOnly:true,keywords:'tv apresentação playlist dispositivos'},
    {id:'settings-access',label:'Configurações · Usuários e permissões',description:'Perfis e acesso granular',group:'Configurações',icon:'♟',view:'settings',settingsModule:'access',permission:'permissions.manage',adminOnly:true,keywords:'usuários permissões acesso'},
    {id:'settings-system',label:'Configurações · Performance do sistema',description:'Métricas técnicas e observabilidade',group:'Configurações',icon:'◴',view:'settings',settingsModule:'system',adminOnly:true,keywords:'performance sistema cache métricas diagnóstico'},
    {id:'profile',label:'Meu perfil',description:'Dados pessoais, avatar e senha',group:'Conta',icon:'◉',view:'profile',keywords:'perfil avatar senha conta'},
    {id:'my-feedbacks',label:'Meus feedbacks',description:'Histórico de feedbacks recebidos',group:'Conta',icon:'✎',view:'my-feedbacks',techOnly:true,keywords:'meus feedbacks técnico'},
    {id:'help',label:'Como usar',description:'Ajuda e guia do Performance Hub',group:'Conta',icon:'?',view:'help',keywords:'ajuda guia manual como usar'}
  ];
  function commandAllowed(command){
    if(command.adminOnly&&!isAdmin())return false;if(command.techOnly&&!isTechnician())return false;if(command.permission&&!hasPermission(command.permission))return false;
    if(command.view==='admin'){
      if(!isAdmin())return false;
      if(command.adminSection==='operation'&&!hasPermission('data.import')&&!hasPermission('goals.manage')&&!hasPermission('month.manage'))return false;
      if(command.adminSection==='finance'&&!hasPermission('finance.view'))return false;
      if(command.adminSection==='costs'&&!hasPermission('costs.view'))return false;
      if(command.adminSection==='appearance'&&!hasPermission('appearance.manage'))return false;
    }
    if(command.view==='indicators'&&!hasPermission('indicators.view'))return false;
    if(command.view==='presentation'&&!hasPermission('presentation.view'))return false;
    if(command.view==='alerts'&&!hasPermission('notifications.view'))return false;
    if(command.settingsModule&&!settingsModuleAllowed(command.settingsModule))return false;
    return true;
  }
  function globalNavigationCommands(){
    const commands=[...workspaceDynamicCommands(),...GLOBAL_NAV_COMMANDS].filter(commandAllowed).map(x=>({...x}));
    if(isSuperAdmin())Object.values(state.squads||{}).sort((a,b)=>a.code.localeCompare(b.code)).forEach(s=>commands.push({id:`squad-${s.code}`,label:`Squad ${s.code}`,description:`Abrir a visão consolidada de ${s.name||`Squad ${s.code}`}`,group:'Squads',icon:s.code,view:'team',squad:s.code,keywords:`squad ${s.code} ${s.name||''} equipe`}));
    if(state.squadCode&&state.squadCode!=='all'){
      const names=new Map();for(const m of Object.values(currentMonths()||{}))for(const t of m?.technicians||[]){const key=normalizeNavigationText(t.name);if(key&&!names.has(key))names.set(key,t.name);}
      [...names.values()].sort((a,b)=>a.localeCompare(b,'pt-BR')).slice(0,80).forEach(name=>commands.push({id:`tech-${state.squadCode}-${normalizeNavigationText(name).replace(/\s+/g,'-')}`,label:name,description:`Abrir desempenho individual · Squad ${state.squadCode}`,group:'Técnicos',icon:'◈',view:'individual',tech:name,keywords:`técnico ${name} desempenho squad ${state.squadCode}`}));
    }
    return commands;
  }
  function routeAccessible(route){
    const target={view:route?.page||'home',adminSection:route?.section||null,settingsModule:route?.module||null,indicatorSection:route?.indicator||null};
    if(target.view==='home')return true;
    const candidates=GLOBAL_NAV_COMMANDS.filter(c=>c.view===target.view).filter(c=>!target.adminSection||c.adminSection===target.adminSection).filter(c=>!target.settingsModule||c.settingsModule===target.settingsModule).filter(c=>!target.indicatorSection||c.indicatorSection===target.indicatorSection);
    if(candidates.length)return candidates.some(commandAllowed);
    return !['admin','users','feedbacks','audit','indicators','presentation','alerts','my-feedbacks'].includes(target.view);
  }
  function currentPersistentRoute(){
    const page=state.currentView||'home',route={page};
    if(page==='admin')route.section=state.adminSection||'operation';
    if(page==='settings'&&state.settingsModule&&state.settingsModule!=='all')route.module=state.settingsModule;
    if(page==='indicators')route.indicator=state.indicatorSection||'performance';
    const visible=topFilterVisibility(page,state.adminSection);
    if(visible.squad&&state.squadCode)route.squad=state.squadCode;
    if(visible.competence&&state.currentId)route.month=state.currentId;
    if(visible.technician&&state.techName)route.tech=state.techName;
    if(visible.period){if(state.analysisStartDate)route.from=state.analysisStartDate;if(state.analysisEndDate)route.to=state.analysisEndDate;}
    return route;
  }
  function syncPersistentUrl({replace=false}={}){
    if(!state.user||state.routeApplying||PRESENTATION_ROUTE.enabled)return;
    const route=currentPersistentRoute();rememberCurrentWorkspaceFilters();
    const next=buildNavigationUrl(window.location.href,route),current=new URL(window.location.href);
    if(next.pathname===current.pathname&&next.search===current.search&&next.hash===current.hash){syncWorkspaceToolbar();return;}
    const method=replace?'replaceState':'pushState';window.history[method]({softenRoute:true},'',`${next.pathname}${next.search}${next.hash}`);syncWorkspaceToolbar();
  }
  function routeTechnicianName(value){const wanted=normalizeNavigationText(value);if(!wanted)return null;for(const m of Object.values(currentMonths()||{}))for(const t of m?.technicians||[])if(normalizeNavigationText(t.name)===wanted)return t.name;return null}
  async function restorePersistentRoute(route=readNavigationRoute(window.location),{canonicalize=true}={}){
    if(PRESENTATION_ROUTE.enabled||!state.user)return;state.routeApplying=true;
    try{
      const rawTarget=routeAccessible(route)?route:{page:'home'},target=rawTarget.page==='home'?rawTarget:rememberedRoute(rawTarget);
      if(isSuperAdmin()&&target.squad){const code=target.squad==='all'?'all':String(target.squad).toUpperCase();if((code==='all'||state.squads?.[code])&&code!==state.squadCode)await selectSquad(code,{history:'none'});}
      if(target.month&&competenceIdsForSquad().includes(target.month)){state.currentId=target.month;if(state.squadCode!=='all'&&state.supabase&&!isPerformanceFullMonth(currentMonths()[target.month]))ensureMonthLoaded(state.squadCode,target.month,{silent:true}).catch(()=>{});if(state.squadCode!=='all')chooseDefaultTech();}
      if(target.from||target.to){const range=clampAnalysisRange(target.from||state.analysisStartDate,target.to||state.analysisEndDate);if(range.start&&range.end){state.analysisStartDate=range.start;state.analysisEndDate=range.end;state.analysisPreset='custom';syncAnalysisModeFromRange();syncCurrentMonthToAnalysisEnd();}}
      if(target.page==='indicators'&&target.indicator&&INDICATOR_SECTION_META[target.indicator])state.indicatorSection=target.indicator;
      if(target.page==='settings')state.settingsModule=target.module&&SETTINGS_MODULES[target.module]&&settingsModuleAllowed(target.module)?target.module:'all';
      if(target.page==='admin'&&target.section&&ADMIN_SECTION_META[target.section])state.adminSection=target.section;
      if(target.page==='individual'&&target.tech){const found=routeTechnicianName(target.tech);if(found)state.techName=found;}
      refreshSelectors();showView(target.page||'home',target.page==='admin'?state.adminSection:null,{history:'none'});if(target.page==='settings')applySettingsModuleFilter({scroll:false});updateBreadcrumbs();
    }finally{state.routeApplying=false;if(canonicalize)syncPersistentUrl({replace:true});}
  }
  function breadcrumbRoute(label,target=null,icon=''){return{label,target,icon}}
  function currentBreadcrumbItems(){
    if(state.currentView==='home')return[breadcrumbRoute('Início',null,'⌂')];
    const items=[breadcrumbRoute('Início',{view:'home'},'⌂')],page=state.currentView;
    if(['alerts','individual','team','indicators','presentation'].includes(page))items.push(breadcrumbRoute('Desempenho'));
    if(page==='alerts')items.push(breadcrumbRoute('Central de Alertas'));
    else if(page==='individual')items.push(breadcrumbRoute('Meu desempenho'));
    else if(page==='team')items.push(breadcrumbRoute('Visão do Squad'));
    else if(page==='presentation')items.push(breadcrumbRoute('Apresentação'));
    else if(page==='indicators'){items.push(breadcrumbRoute('Indicadores',{view:'indicators',indicatorSection:'performance'}));items.push(breadcrumbRoute(INDICATOR_SECTION_META[state.indicatorSection]?.label||'Indicadores gerais'));}
    else if(page==='admin'){
      items.push(breadcrumbRoute('Gestão'));
      if(['finance','costs'].includes(state.adminSection))items.push(breadcrumbRoute('Financeiro'));
      items.push(breadcrumbRoute(ADMIN_SECTION_META[state.adminSection]?.label||'Operação'));
    }else if(['feedbacks','users'].includes(page)){items.push(breadcrumbRoute('Gestão'));items.push(breadcrumbRoute('Pessoas'));items.push(breadcrumbRoute(page==='feedbacks'?'Feedbacks':'Usuários'));}
    else if(page==='audit'){items.push(breadcrumbRoute('Gestão'));items.push(breadcrumbRoute('Governança'));items.push(breadcrumbRoute('Auditoria'));}
    else if(page==='settings'){items.push(breadcrumbRoute('Configurações',state.settingsModule!=='all'?{view:'settings'}:null,'⚙'));if(state.settingsModule!=='all')items.push(breadcrumbRoute(SETTINGS_MODULES[state.settingsModule]?.label||'Configurações'));}
    else if(page==='profile'){items.push(breadcrumbRoute('Conta'));items.push(breadcrumbRoute('Meu perfil'));}
    else if(page==='my-feedbacks'){items.push(breadcrumbRoute('Conta'));items.push(breadcrumbRoute('Meus feedbacks'));}
    else if(page==='help'){items.push(breadcrumbRoute('Conta'));items.push(breadcrumbRoute('Como usar'));}
    return items;
  }
  function breadcrumbTargetAttrs(target){if(!target)return'';return Object.entries(target).map(([key,value])=>` data-breadcrumb-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${escapeHtml(value)}"`).join('')}
  function updateBreadcrumbs(){
    const el=$('#appBreadcrumbs');if(el){const items=currentBreadcrumbItems();el.innerHTML=items.map((item,index)=>{const last=index===items.length-1,icon=index===0?'<span class="breadcrumb-home-icon">⌂</span>':'';if(item.target&&!last)return`<span class="breadcrumb-item"><button class="breadcrumb-link" type="button"${breadcrumbTargetAttrs(item.target)}>${icon}${escapeHtml(item.label)}</button></span>`;return`<span class="breadcrumb-item"><span class="${last?'breadcrumb-current':'breadcrumb-label'}"${last?' aria-current="page"':''}>${icon}${escapeHtml(item.label)}</span></span>`}).join('');}
    syncWorkspaceToolbar();
  }
  async function executeNavigationTarget(target={}){
    const requestedRoute=navigationRouteFromTarget(target),resolvedRoute=target.workspaceExact?workspaceEngine.copyRoute(requestedRoute):rememberedRoute(requestedRoute),resolved={...target,...navigationTargetFromRoute(resolvedRoute)};
    const previousApplying=state.routeApplying;state.routeApplying=true;
    try{
      if(resolved.squad&&isSuperAdmin()&&resolved.squad!==state.squadCode)await selectSquad(resolved.squad,{history:'none'});
      if(resolved.month&&state.squadCode!=='all'&&currentMonths()?.[resolved.month]){state.currentId=resolved.month;chooseDefaultTech();}
      if(resolved.from||resolved.to){const range=clampAnalysisRange(resolved.from||state.analysisStartDate,resolved.to||state.analysisEndDate);if(range.start&&range.end){state.analysisStartDate=range.start;state.analysisEndDate=range.end;state.analysisPreset='custom';syncAnalysisModeFromRange();syncCurrentMonthToAnalysisEnd();}}
      if(resolved.tech){const found=routeTechnicianName(resolved.tech);if(found)state.techName=found;}
      if(resolved.indicatorSection&&INDICATOR_SECTION_META[resolved.indicatorSection])state.indicatorSection=resolved.indicatorSection;
      if(resolved.settingsModule&&SETTINGS_MODULES[resolved.settingsModule]&&settingsModuleAllowed(resolved.settingsModule))state.settingsModule=resolved.settingsModule;
      if(resolved.adminSection&&ADMIN_SECTION_META[resolved.adminSection])state.adminSection=resolved.adminSection;
      refreshSelectors();showView(resolved.view||'home',resolved.view==='admin'?state.adminSection:null,{history:'none'});if(resolved.view==='settings')applySettingsModuleFilter({scroll:true});
    }finally{state.routeApplying=previousApplying;}
    updateBreadcrumbs();syncPersistentUrl({replace:false});
  }
  function globalSearchResultById(id){return state.globalSearchResults.find(x=>x.id===id)||globalNavigationCommands().find(x=>x.id===id)||null}
  function renderGlobalSearch(){
    const host=$('#globalSearchResults'),input=$('#globalSearchInput');if(!host)return;const query=input?.value||'',commands=globalNavigationCommands();state.globalSearchResults=searchNavigationCommands(commands,query,16);if(state.globalSearchIndex>=state.globalSearchResults.length)state.globalSearchIndex=Math.max(0,state.globalSearchResults.length-1);
    if(!state.globalSearchResults.length){host.innerHTML='<div class="global-search-empty"><div><strong>Nenhum resultado encontrado</strong><small>Tente outro termo, nome de tela, configuração, Squad ou técnico.</small></div></div>';return;}
    let lastGroup='';host.innerHTML=state.globalSearchResults.map((command,index)=>{const group=command.group||'Navegação',heading=group!==lastGroup?`<div class="global-search-group">${escapeHtml(group)}</div>`:'';lastGroup=group;return`${heading}<button class="global-search-result ${index===state.globalSearchIndex?'is-active':''}" type="button" role="option" aria-selected="${index===state.globalSearchIndex?'true':'false'}" data-global-command="${escapeHtml(command.id)}"><span class="global-search-result-icon">${escapeHtml(command.icon||'→')}</span><span class="global-search-result-copy"><strong>${escapeHtml(command.label)}</strong><small>${escapeHtml(command.description||'Abrir')}</small></span><span class="global-search-result-group">${escapeHtml(group)}</span></button>`}).join('');
    host.querySelector('.global-search-result.is-active')?.scrollIntoView({block:'nearest'});
  }
  function openGlobalSearch(){if(!state.user||PRESENTATION_ROUTE.enabled)return;setNotificationPopover(false);setWorkspacePopover(false);state.globalSearchOpen=true;state.globalSearchIndex=0;const palette=$('#globalSearchPalette');palette?.classList.remove('hidden');palette?.setAttribute('aria-hidden','false');document.body.classList.add('command-palette-open');if($('#globalSearchInput'))$('#globalSearchInput').value='';renderGlobalSearch();setTimeout(()=>$('#globalSearchInput')?.focus(),0)}
  function closeGlobalSearch(){state.globalSearchOpen=false;$('#globalSearchPalette')?.classList.add('hidden');$('#globalSearchPalette')?.setAttribute('aria-hidden','true');document.body.classList.remove('command-palette-open')}
  function moveGlobalSearch(delta){if(!state.globalSearchResults.length)return;state.globalSearchIndex=(state.globalSearchIndex+delta+state.globalSearchResults.length)%state.globalSearchResults.length;renderGlobalSearch()}
  async function activateGlobalSearch(id=null){const command=id?globalSearchResultById(id):state.globalSearchResults[state.globalSearchIndex];if(!command)return;closeGlobalSearch();await executeNavigationTarget(command)}
  function handleGlobalSearchKeydown(e){
    if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();state.globalSearchOpen?closeGlobalSearch():openGlobalSearch();return;}
    if(!state.globalSearchOpen)return;
    if(e.key==='Escape'){e.preventDefault();closeGlobalSearch();return;}if(e.key==='ArrowDown'){e.preventDefault();moveGlobalSearch(1);return;}if(e.key==='ArrowUp'){e.preventDefault();moveGlobalSearch(-1);return;}if(e.key==='Enter'){e.preventDefault();activateGlobalSearch();}
  }
  function prepareCentralSettings(){
    const target=$('#centralConfigModules');if(!target)return;
    $$('[data-central-config]').forEach(card=>{
      const module=card.dataset.centralConfig||'operation',meta=SETTINGS_MODULES[module]||{label:card.dataset.centralLabel||module,icon:card.dataset.centralIcon||'⚙'};
      card.classList.remove('admin-section','admin-operation','admin-finance','admin-appearance');
      card.classList.add('settings-module-card','settings-centralized-card');
      card.dataset.configModule=module;
      card.dataset.configSearch=`${meta.label} ${card.dataset.centralLabel||''}`;
      if(!card.querySelector(':scope > .settings-module-badge')){
        const badge=document.createElement('div');badge.className='settings-module-badge';badge.innerHTML=`<span>${escapeHtml(card.dataset.centralIcon||meta.icon)}</span><strong>MÓDULO: ${escapeHtml(card.dataset.centralLabel||meta.label).toUpperCase()}</strong>`;card.prepend(badge);
      }
      target.appendChild(card);
    });
  }
  function settingsModuleAllowed(module){
    if(module==='personalization')return hasPermission('dashboard.customize');
    if(module==='operation')return isAdmin()&&hasPermission('goals.manage');
    if(module==='finance')return isAdmin()&&hasPermission('finance.view');
    if(module==='appearance')return isAdmin()&&hasPermission('appearance.manage');
    if(module==='presentation')return isAdmin()&&hasPermission('presentation.manage');
    if(module==='access')return isSuperAdmin()&&hasPermission('permissions.manage');
    if(module==='system')return isSuperAdmin();
    return true;
  }
  function syncSettingsContext(){
    const select=$('#settingsMonthSelect'),label=$('#settingsScopeLabel'),hint=$('#settingsScopeHint');
    if(!select)return;
    const specific=state.squadCode!=='all',ids=specific?Object.keys(currentMonths()).sort().reverse():[];
    select.disabled=!specific||!ids.length;
    select.innerHTML=!specific?'<option value="">Selecione um Squad</option>':ids.length?ids.map(id=>{const m=currentMonths()[id];return `<option value="${id}" ${id===state.currentId?'selected':''}>${escapeHtml(m.monthName)} ${m.year}${m.isClosed?' • Fechado':''}</option>`}).join(''):'<option value="">Sem competências</option>';
    if(specific&&ids.length&&!ids.includes(state.currentId)){state.currentId=ids[0];chooseDefaultTech();select.value=state.currentId;}
    if(label)label.textContent=specific?`Squad ${state.squadCode} • ${currentMonth()?`${currentMonth().monthName} ${currentMonth().year}`:'sem competência'}`:'Todos os Squads';
    if(hint)hint.textContent=specific?'Regras mensais abaixo usam esta competência. Aparência pode ser aplicada a um ou a todos os Squads.':'Selecione um Squad para metas e bonificação. Aparência continua permitindo aplicação global.';
  }
  function applySettingsModuleFilter({scroll=false}={}){
    const active=state.settingsModule||'all',term=String($('#settingsSearchInput')?.value||'').trim().toLocaleLowerCase('pt-BR');let visible=0,first=null;
    $$('#settingsModuleNav [data-settings-module-filter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.settingsModuleFilter===active));
    $$('#view-settings .settings-module-card').forEach(card=>{
      const module=card.dataset.configModule||'personalization',allowed=settingsModuleAllowed(module),moduleMatch=active==='all'||module===active,hay=`${card.dataset.configSearch||''} ${card.textContent||''}`.toLocaleLowerCase('pt-BR'),searchMatch=!term||hay.includes(term),show=allowed&&moduleMatch&&searchMatch&&!card.classList.contains('permission-hidden');
      card.classList.toggle('settings-filter-hidden',!show);if(show){visible++;if(!first)first=card;}
    });
    if($('#settingsNoResults'))$('#settingsNoResults').classList.toggle('hidden',visible>0);
    if(scroll&&first)setTimeout(()=>first.scrollIntoView({behavior:'smooth',block:'start'}),20);
  }
  function openSettingsModule(module='all',{scroll=true,history='push'}={}){
    const requested=SETTINGS_MODULES[module]?module:'all';state.settingsModule=requested;
    if(state.currentView!=='settings')showView('settings',null,{history:'none'});else renderSettings();
    syncTopFiltersForView('settings',state.adminSection);applySettingsModuleFilter({scroll});updateBreadcrumbs();
    if(history!=='none')syncPersistentUrl({replace:history==='replace'});
  }


  function userPreferenceStorageKey(user=state.user){return `softenPerformanceUiPreferencesV1:${user?.userId||user?.email||'anonymous'}`}
  function readLocalUiPreferences(user=state.user){try{const value=JSON.parse(localStorage.getItem(userPreferenceStorageKey(user))||'{}');return value&&typeof value==='object'?value:{}}catch(e){return{}}}
  function loadLocalUiPreferences(user=state.user){return normalizeUiPreferences(readLocalUiPreferences(user))}
  function saveLocalUiPreferences(prefs=state.uiPreferences,user=state.user){try{localStorage.setItem(userPreferenceStorageKey(user),JSON.stringify(normalizeUiPreferences(prefs)))}catch(e){console.warn('Não foi possível salvar o layout local.',e)}}
  function effectivePermissionsFor(user=state.user){return settingsEffectivePermissions(user?.role||'technician',user?.permissions||{})}
  function hasPermission(key,user=state.user){return effectivePermissionsFor(user)[key]===true}
  function requirePermission(key,message='Você não possui permissão para esta ação.'){if(hasPermission(key))return true;toast(message);return false}
  function loadUserUiPreferences(user=state.user){
    const localRaw=readLocalUiPreferences(user),remoteRaw=user?.uiPreferences&&typeof user.uiPreferences==='object'?user.uiPreferences:null,source=remoteRaw||localRaw,needsMigration=Number(source?.version||0)<5;
    state.uiPreferences=normalizeUiPreferences(source);saveLocalUiPreferences(state.uiPreferences,user);
    if(needsMigration&&user&&state.supabase)setTimeout(()=>persistMyUiPreferences(),0);
    return state.uiPreferences;
  }
  let uiPreferencePersistTimer=null;
  function navigationPreferences(){return normalizeUiNavigation(state.uiPreferences?.navigation)}
  function applyNavigationPreferences(){
    const nav=navigationPreferences(),shell=$('#appShell'),sidebar=$('#appSidebar'),desktop=window.innerWidth>980;
    shell?.classList.toggle('sidebar-collapsed',desktop&&nav.sidebarCollapsed);
    sidebar?.classList.toggle('sidebar-collapsed',desktop&&nav.sidebarCollapsed);
    const collapseBtn=$('#sidebarCollapseBtn');
    if(collapseBtn){const collapsed=desktop&&nav.sidebarCollapsed;collapseBtn.setAttribute('aria-expanded',collapsed?'false':'true');collapseBtn.setAttribute('aria-label',collapsed?'Expandir menu lateral':'Recolher menu lateral');collapseBtn.title=collapsed?'Expandir menu lateral':'Recolher menu lateral';collapseBtn.querySelector('span').textContent=collapsed?'›':'‹';}
    $$('[data-nav-group]').forEach(group=>{const key=group.dataset.navGroup,collapsed=!!nav.groups?.[key];group.classList.toggle('nav-section-collapsed',collapsed);const toggle=group.querySelector('[data-nav-group-toggle]');if(toggle)toggle.setAttribute('aria-expanded',collapsed?'false':'true')});
    $$('[data-nav-subgroup]').forEach(group=>{const key=group.dataset.navSubgroup,collapsed=!!nav.subgroups?.[key],available=[...group.querySelectorAll('.nav-btn')].some(btn=>!btn.classList.contains('hidden')&&!btn.classList.contains('permission-hidden'));group.classList.toggle('nav-subsection-collapsed',collapsed);group.classList.toggle('nav-subgroup-unavailable',!available);const toggle=group.querySelector('[data-nav-subgroup-toggle]');if(toggle)toggle.setAttribute('aria-expanded',collapsed?'false':'true')});
    $$('.nav-btn').forEach(btn=>{const label=btn.querySelector('.nav-text')?.textContent?.trim();if(label){btn.setAttribute('aria-label',label);btn.title=desktop&&nav.sidebarCollapsed?label:'';}});
  }
  function scheduleUiPreferencePersist(){
    saveLocalUiPreferences(state.uiPreferences);clearTimeout(uiPreferencePersistTimer);uiPreferencePersistTimer=setTimeout(()=>persistMyUiPreferences(),450);
  }

  function workspacePreferences(){return normalizeWorkspace(state.uiPreferences?.workspace)}
  function updateWorkspacePreferences(workspace,{persist=true,render=true}={}){
    const next=normalizeWorkspace(workspace);state.uiPreferences=normalizeUiPreferences({...state.uiPreferences,workspace:next});
    if(render)syncWorkspaceToolbar();if(persist)scheduleUiPreferencePersist();else saveLocalUiPreferences(state.uiPreferences);return next;
  }
  function navigationTargetFromRoute(route={}){
    const r=workspaceEngine.copyRoute(route);return{view:r.page||'home',adminSection:r.section||null,settingsModule:r.module||null,indicatorSection:r.indicator||null,squad:r.squad||null,month:r.month||null,tech:r.tech||null,from:r.from||null,to:r.to||null};
  }
  function navigationRouteFromTarget(target={}){
    return workspaceEngine.copyRoute({page:target.view||target.page||'home',section:target.adminSection||target.section||null,module:target.settingsModule||target.module||null,indicator:target.indicatorSection||target.indicator||null,squad:target.squad||null,month:target.month||null,tech:target.tech||null,from:target.from||null,to:target.to||null});
  }
  function rememberedRoute(route={}){const ws=workspacePreferences();return mergeWorkspaceRememberedFilters(route,ws.filterMemory,ws.persistentFilters)}
  function rememberCurrentWorkspaceFilters(){
    if(!state.user||state.routeApplying||PRESENTATION_ROUTE.enabled)return;const ws=workspacePreferences(),route=currentPersistentRoute(),next=rememberWorkspaceFilters(ws,route);
    if(JSON.stringify(next.filterMemory)!==JSON.stringify(ws.filterMemory))updateWorkspacePreferences(next,{persist:true,render:false});
  }
  function workspaceRouteTitle(route={}){
    const r=workspaceEngine.copyRoute(route),page=r.page||'home';
    if(page==='admin')return ADMIN_SECTION_META[r.section]?.label||'Gestão';
    if(page==='settings')return r.module&&SETTINGS_MODULES[r.module]?`Configurações · ${SETTINGS_MODULES[r.module].label}`:'Configurações';
    if(page==='indicators')return r.indicator&&INDICATOR_SECTION_META[r.indicator]?`Indicadores · ${INDICATOR_SECTION_META[r.indicator].label.replace(/^Indicadores\s*/i,'')}`:'Indicadores';
    const labels={home:'Início',alerts:'Central de Alertas',individual:'Meu desempenho',team:'Visão do Squad',presentation:'Apresentação',feedbacks:'Feedbacks',users:'Usuários',audit:'Auditoria',profile:'Meu perfil','my-feedbacks':'Meus feedbacks',help:'Como usar'};
    return labels[page]||'Performance Hub';
  }
  function workspaceRouteContext(route={}){
    const r=workspaceEngine.copyRoute(route),parts=[],dateLabel=value=>{const d=parseIsoAnalysisDate(value);return d?d.toLocaleDateString('pt-BR'):String(value||'')};if(r.squad)parts.push(r.squad==='all'?'Todos os Squads':`Squad ${r.squad}`);if(r.month)parts.push(monthLabelFromId(r.month));if(r.tech)parts.push(r.tech);if(r.from&&r.to)parts.push(`${dateLabel(r.from)} → ${dateLabel(r.to)}`);return parts.join(' · ');
  }
  function defaultSavedViewName(route=currentPersistentRoute()){const title=workspaceRouteTitle(route),context=workspaceRouteContext(route);return context?`${title} · ${context}`:title}
  function currentRouteFavorite(){return workspaceFavoriteForRoute(workspacePreferences(),currentPersistentRoute())}
  function workspaceRouteOpenable(route){return routeAccessible(workspaceEngine.copyRoute(route))}
  function workspaceDynamicCommands(){
    const ws=workspacePreferences(),out=[];
    for(const fav of ws.favorites){if(!workspaceRouteOpenable(fav.route))continue;out.push({id:`workspace-favorite-${fav.id}`,label:fav.label,description:`Favorito${workspaceRouteContext(fav.route)?` · ${workspaceRouteContext(fav.route)}`:''}`,group:'Favoritos',icon:'★',...navigationTargetFromRoute(fav.route),workspaceRoute:fav.route,workspaceExact:true,priority:150});}
    for(const saved of ws.savedViews){if(!workspaceRouteOpenable(saved.route))continue;out.push({id:`workspace-saved-${saved.id}`,label:saved.name,description:`Visão salva${workspaceRouteContext(saved.route)?` · ${workspaceRouteContext(saved.route)}`:''}`,group:'Visões salvas',icon:'▣',...navigationTargetFromRoute(saved.route),workspaceRoute:saved.route,workspaceExact:true,priority:125});}
    return out;
  }
  function setWorkspacePopover(open){
    state.workspacePopoverOpen=!!open;const pop=$('#workspacePopover'),btn=$('#workspaceMenuBtn');pop?.classList.toggle('hidden',!state.workspacePopoverOpen);btn?.setAttribute('aria-expanded',state.workspacePopoverOpen?'true':'false');if(state.workspacePopoverOpen){setNotificationPopover(false);renderWorkspacePopover();}
  }
  function toggleWorkspacePopover(){setWorkspacePopover(!state.workspacePopoverOpen)}
  function workspaceListRow(item,type){
    const isSaved=type==='saved',route=item.route,context=workspaceRouteContext(route),fav=isSaved?workspaceFavoriteForRoute(workspacePreferences(),route):item;
    return `<div class="workspace-list-row" data-workspace-${isSaved?'saved':'favorite'}="${escapeHtml(item.id)}"><button class="workspace-list-open" type="button" data-workspace-open-${isSaved?'saved':'favorite'}="${escapeHtml(item.id)}"><span class="workspace-list-icon">${isSaved?'▣':'★'}</span><span><strong>${escapeHtml(isSaved?item.name:item.label)}</strong><small>${escapeHtml(context||workspaceRouteTitle(route))}</small></span></button><div class="workspace-list-actions">${isSaved?`<button type="button" class="workspace-icon-btn ${fav?'active':''}" data-workspace-favorite-saved="${escapeHtml(item.id)}" title="${fav?'Remover dos favoritos':'Adicionar aos favoritos'}">★</button><button type="button" class="workspace-icon-btn" data-workspace-edit-saved="${escapeHtml(item.id)}" title="Renomear visão">✎</button><button type="button" class="workspace-icon-btn danger" data-workspace-delete-saved="${escapeHtml(item.id)}" title="Excluir visão">×</button>`:`<button type="button" class="workspace-icon-btn danger" data-workspace-remove-favorite="${escapeHtml(item.id)}" title="Remover favorito">×</button>`}</div></div>`;
  }
  function renderWorkspacePopover(){
    const ws=workspacePreferences(),host=$('#workspacePopover');if(!host)return;const favorites=ws.favorites.filter(f=>workspaceRouteOpenable(f.route)),saved=ws.savedViews.filter(v=>workspaceRouteOpenable(v.route));
    const favList=favorites.length?favorites.map(x=>workspaceListRow(x,'favorite')).join(''):'<div class="workspace-empty">Nenhum favorito ainda. Use a estrela no topo para adicionar a visão atual.</div>';
    const savedList=saved.length?saved.map(x=>workspaceListRow(x,'saved')).join(''):'<div class="workspace-empty">Salve uma combinação de tela e filtros para abrir novamente com um clique.</div>';
    host.innerHTML=`<div class="workspace-popover-head"><div><span class="eyebrow">ATALHOS PESSOAIS</span><strong>Visões e favoritos</strong></div><button class="workspace-popover-close" id="workspacePopoverCloseBtn" type="button" aria-label="Fechar">×</button></div><div class="workspace-current-card"><div><strong>${escapeHtml(workspaceRouteTitle(currentPersistentRoute()))}</strong><small>${escapeHtml(workspaceRouteContext(currentPersistentRoute())||'Visão atual')}</small></div><button class="btn primary compact" id="saveCurrentViewBtn" type="button" ${state.currentView==='home'?'disabled':''}>Salvar visão</button></div><label class="workspace-filter-toggle"><span><strong>Filtros persistentes</strong><small>Lembrar Squad, mês, técnico e período por tela.</small></span><input id="workspacePersistentFiltersToggle" type="checkbox" ${ws.persistentFilters?'checked':''}><i></i></label><div class="workspace-section-head"><strong>Favoritos</strong><span>${favorites.length}</span></div><div class="workspace-list">${favList}</div><div class="workspace-section-head"><strong>Visões salvas</strong><span>${saved.length}</span></div><div class="workspace-list">${savedList}</div><div class="workspace-popover-foot"><button class="link-btn" id="workspaceClearFiltersBtn" type="button" ${Object.keys(ws.filterMemory||{}).length?'':'disabled'}>Limpar filtros lembrados</button><small>${state.supabase?'Sincronizado no seu perfil':'Salvo neste navegador'}</small></div>`;
  }
  function syncWorkspaceToolbar(){
    const route=currentPersistentRoute(),fav=workspaceFavoriteForRoute(workspacePreferences(),route),btn=$('#currentFavoriteBtn'),count=$('#workspaceSavedCount'),ws=workspacePreferences(),canFavorite=route.page!=='home';
    if(btn){btn.disabled=!canFavorite;btn.classList.toggle('active',!!fav);btn.setAttribute('aria-pressed',fav?'true':'false');btn.title=canFavorite?(fav?'Remover visão atual dos favoritos':'Favoritar visão atual'):'A tela inicial já é o ponto de partida';const icon=btn.querySelector('[data-favorite-icon]');if(icon)icon.textContent=fav?'★':'☆';}
    if(count){const total=ws.savedViews.length+ws.favorites.length;count.textContent=String(total);count.classList.toggle('hidden',total===0);}
    if(state.workspacePopoverOpen)renderWorkspacePopover();
  }
  function toggleCurrentFavorite(){
    const route=currentPersistentRoute();if(route.page==='home')return toast('A tela inicial já é o seu ponto de partida.');const ws=workspacePreferences(),existing=workspaceFavoriteForRoute(ws,route),label=defaultSavedViewName(route),next=toggleWorkspaceFavorite(ws,{route,label});updateWorkspacePreferences(next);toast(existing?'Favorito removido.':'Visão adicionada aos favoritos.');
  }
  function openSavedViewModal(id=null){
    const ws=workspacePreferences(),saved=id?ws.savedViews.find(v=>v.id===id):null;if(!saved&&state.currentView==='home')return toast('Abra uma tela com filtros antes de salvar uma visão.');state.savedViewEditingId=saved?.id||null;const route=saved?.route||currentPersistentRoute(),fav=workspaceFavoriteForRoute(ws,route);if($('#savedViewModalTitle'))$('#savedViewModalTitle').textContent=saved?'Renomear visão salva':'Salvar visão atual';if($('#savedViewModalText'))$('#savedViewModalText').textContent=saved?'Altere o nome sem perder os filtros e o destino já salvos.':'A tela, o Squad, a competência, o técnico e o período atuais serão guardados.';if($('#savedViewNameInput'))$('#savedViewNameInput').value=saved?.name||defaultSavedViewName(route);if($('#savedViewFavoriteInput'))$('#savedViewFavoriteInput').checked=!!fav;if($('#savedViewContext'))$('#savedViewContext').textContent=`${workspaceRouteTitle(route)}${workspaceRouteContext(route)?` · ${workspaceRouteContext(route)}`:''}`;openModal('savedViewModal');setTimeout(()=>$('#savedViewNameInput')?.select(),0);
  }
  async function saveSavedViewFromModal(e){
    e?.preventDefault();const name=String($('#savedViewNameInput')?.value||'').trim();if(!name)return toast('Informe um nome para a visão.');const ws=workspacePreferences(),editing=state.savedViewEditingId,saved=editing?ws.savedViews.find(v=>v.id===editing):null,route=saved?.route||currentPersistentRoute();let next=editing?renameWorkspaceSavedView(ws,editing,name):createWorkspaceSavedView(ws,{name,route});const shouldFavorite=!!$('#savedViewFavoriteInput')?.checked,existing=workspaceFavoriteForRoute(next,route);if(shouldFavorite&&!existing)next=toggleWorkspaceFavorite(next,{route,label:name});if(!shouldFavorite&&existing)next=toggleWorkspaceFavorite(next,{route,label:name});if(shouldFavorite){const fav=workspaceFavoriteForRoute(next,route);if(fav&&fav.label!==name)next={...next,favorites:next.favorites.map(x=>x.id===fav.id?{...x,label:name}:x)}}updateWorkspacePreferences(next);state.savedViewEditingId=null;closeModal('savedViewModal');toast(editing?'Visão atualizada.':'Visão salva.');
  }
  async function deleteWorkspaceSavedViewById(id){
    const ws=workspacePreferences(),saved=ws.savedViews.find(v=>v.id===id);if(!saved)return;if(!await confirmDialog(`Excluir a visão salva “${saved.name}”? Os dados do painel não serão alterados.`,{title:'Excluir visão salva',confirmText:'Excluir',tone:'danger'}))return;updateWorkspacePreferences(deleteWorkspaceSavedView(ws,id));toast('Visão salva excluída.');
  }
  async function openWorkspaceRoute(route){setWorkspacePopover(false);await executeNavigationTarget({...navigationTargetFromRoute(route),workspaceExact:true})}
  function handleWorkspacePopoverClick(e){
    const close=e.target.closest('#workspacePopoverCloseBtn');if(close)return setWorkspacePopover(false);const save=e.target.closest('#saveCurrentViewBtn');if(save)return openSavedViewModal();const openSaved=e.target.closest('[data-workspace-open-saved]');if(openSaved){const row=workspacePreferences().savedViews.find(v=>v.id===openSaved.dataset.workspaceOpenSaved);if(row)openWorkspaceRoute(row.route);return}const openFav=e.target.closest('[data-workspace-open-favorite]');if(openFav){const row=workspacePreferences().favorites.find(v=>v.id===openFav.dataset.workspaceOpenFavorite);if(row)openWorkspaceRoute(row.route);return}const edit=e.target.closest('[data-workspace-edit-saved]');if(edit)return openSavedViewModal(edit.dataset.workspaceEditSaved);const del=e.target.closest('[data-workspace-delete-saved]');if(del){deleteWorkspaceSavedViewById(del.dataset.workspaceDeleteSaved);return}const favSaved=e.target.closest('[data-workspace-favorite-saved]');if(favSaved){const ws=workspacePreferences(),row=ws.savedViews.find(v=>v.id===favSaved.dataset.workspaceFavoriteSaved);if(!row)return;const existing=workspaceFavoriteForRoute(ws,row.route),next=toggleWorkspaceFavorite(ws,{route:row.route,label:row.name});updateWorkspacePreferences(next);toast(existing?'Visão removida dos favoritos.':'Visão adicionada aos favoritos.');return}const removeFav=e.target.closest('[data-workspace-remove-favorite]');if(removeFav){const ws=workspacePreferences(),row=ws.favorites.find(v=>v.id===removeFav.dataset.workspaceRemoveFavorite);if(row)updateWorkspacePreferences(toggleWorkspaceFavorite(ws,{route:row.route,label:row.label}));return}const clear=e.target.closest('#workspaceClearFiltersBtn');if(clear){updateWorkspacePreferences(clearWorkspaceFilterMemory(workspacePreferences()));toast('Filtros lembrados foram limpos.');}}
  function handleWorkspacePopoverChange(e){const toggle=e.target.closest('#workspacePersistentFiltersToggle');if(!toggle)return;updateWorkspacePreferences(setWorkspacePersistentFilters(workspacePreferences(),toggle.checked));toast(toggle.checked?'Filtros persistentes ativados.':'Filtros persistentes desativados.');}
  function updateNavigationPreferences(mutator){
    const next=mutator(navigationPreferences())||navigationPreferences();
    state.uiPreferences=normalizeUiPreferences({...state.uiPreferences,navigation:next});applyNavigationPreferences();scheduleUiPreferencePersist();
  }
  function toggleSidebarCollapsed(){if(window.innerWidth<=980)return;updateNavigationPreferences(nav=>({...nav,sidebarCollapsed:!nav.sidebarCollapsed}))}
  function toggleNavigationGroup(key){updateNavigationPreferences(nav=>({...nav,groups:{...nav.groups,[key]:!nav.groups?.[key]}}))}
  function toggleNavigationSubgroup(key){updateNavigationPreferences(nav=>({...nav,subgroups:{...nav.subgroups,[key]:!nav.subgroups?.[key]}}))}
  const HOME_WIDGET_SIZE_LABELS={small:'Pequeno',medium:'Médio',wide:'Largo',full:'Total'};
  function layoutRootForView(view){return view==='home'?'#homeWidgetGrid':view==='individual'?'#individualContent':view==='team'?'#teamContent':view==='indicators'?'#indicatorPerformancePanel':null}
  function clearPersonalLayout(view){
    const def=settingsLayoutDefinition(view);if(!def)return;
    for(const block of def.blocks){const el=$(block.selector);if(!el)continue;el.classList.remove('layout-user-hidden','home-widget-size-small','home-widget-size-medium','home-widget-size-wide','home-widget-size-full','home-widget-edit-hidden','home-widget-dragging','home-widget-drag-over');el.style.order='';el.draggable=false;}
    const root=$(layoutRootForView(view));if(root){root.classList.remove('personal-layout-root','layout-density-compact');root.removeAttribute('data-layout-density');}
  }
  function applyPersonalLayout(view=state.currentView){
    const def=settingsLayoutDefinition(view);if(!def)return;clearPersonalLayout(view);
    const layout=normalizeUiLayout(view,state.uiPreferences?.layouts?.[view]),root=$(layoutRootForView(view));if(!root)return;
    root.classList.add('personal-layout-root');root.dataset.layoutDensity=layout.density;root.classList.toggle('layout-density-compact',layout.density==='compact');
    layout.order.forEach((key,index)=>{const block=def.blocks.find(b=>b.key===key),el=block?$(block.selector):null;if(!el)return;el.style.order=String(index);el.classList.toggle('layout-user-hidden',layout.hidden.includes(key));if(view==='home'){const size=layout.sizes?.[key]||block.defaultSize||'full';el.classList.add(`home-widget-size-${size}`);}});
  }
  function visibleLayoutViews(){return ['home','individual','team',...(hasPermission('indicators.view')?['indicators']:[])]}
  function currentLayoutDraft(){
    const view=$('#layoutViewSelect')?.value||visibleLayoutViews()[0]||'individual';
    if(!state.layoutDraft||state.layoutDraft.view!==view)state.layoutDraft={view,layout:normalizeUiLayout(view,state.uiPreferences?.layouts?.[view])};
    return state.layoutDraft;
  }
  function layoutSizeOptions(block,current){
    const allowed=Array.isArray(block?.sizes)&&block.sizes.length?block.sizes:[];
    return allowed.map(size=>`<option value="${escapeHtml(size)}" ${size===current?'selected':''}>${escapeHtml(HOME_WIDGET_SIZE_LABELS[size]||size)}</option>`).join('');
  }
  function renderLayoutEditor(){
    const select=$('#layoutViewSelect');if(!select)return;
    const allowed=visibleLayoutViews();select.innerHTML=allowed.map(v=>`<option value="${v}">${escapeHtml(settingsLayoutDefinition(v)?.label||v)}</option>`).join('');
    if(!allowed.includes(select.value))select.value=allowed[0]||'home';
    if(!state.layoutDraft||state.layoutDraft.view!==select.value)state.layoutDraft={view:select.value,layout:normalizeUiLayout(select.value,state.uiPreferences?.layouts?.[select.value])};
    const {view,layout}=state.layoutDraft,def=settingsLayoutDefinition(view);$('#layoutDensitySelect').value=layout.density;
    $('#layoutBlockList').innerHTML=layout.order.map((key,index)=>{const block=def.blocks.find(b=>b.key===key);if(!block)return'';const visible=!layout.hidden.includes(key),size=layout.sizes?.[key]||block.defaultSize||'full',sizeControl=view==='home'&&Array.isArray(block.sizes)&&block.sizes.length>1?`<label class="layout-size-field"><span>Tamanho</span><select data-layout-size="${escapeHtml(key)}">${layoutSizeOptions(block,size)}</select></label>`:'';return `<div class="layout-block-row" data-layout-key="${escapeHtml(key)}" draggable="true"><span class="layout-drag-handle" title="Arraste para ordenar" aria-hidden="true">⋮⋮</span><div class="layout-block-main"><label><input type="checkbox" data-layout-visible="${escapeHtml(key)}" ${visible?'checked':''}><span><strong>${escapeHtml(block.label)}</strong><small>${visible?'Visível no painel':'Oculto no painel'}</small></span></label></div>${sizeControl}<div class="layout-order-actions"><button type="button" class="table-action" data-layout-move="up" ${index===0?'disabled':''}>↑</button><button type="button" class="table-action" data-layout-move="down" ${index===layout.order.length-1?'disabled':''}>↓</button></div></div>`}).join('');
  }
  function renderSettings(){
    if(!$('#view-settings'))return;prepareCentralSettings();
    const perms=effectivePermissionsFor(),enabled=Object.values(perms).filter(Boolean).length;
    $('#settingsRoleLabel').textContent=roleLabel(state.user?.role||'');$('#settingsPermissionSummary').textContent=`${enabled} permissões ativas no perfil`;
    $('#layoutSaveStatus').textContent=hasPermission('dashboard.customize')?'Personalizável':'Bloqueado';
    $('#layoutViewSelect').disabled=!hasPermission('dashboard.customize');$('#layoutDensitySelect').disabled=!hasPermission('dashboard.customize');$('#saveLayoutBtn').disabled=!hasPermission('dashboard.customize');$('#resetLayoutBtn').disabled=!hasPermission('dashboard.customize');
    renderLayoutEditor();syncSettingsContext();
    if(isAdmin()){
      const previousSection=state.adminSection;state.adminSection='operation';
      try{renderAdmin();}finally{state.adminSection=previousSection;}
      window.SoftenPresentation?.syncAdminConfig?.();
      renderPresentationOpsAdmin();
    }
    const groups=settingsPermissionGroups(state.user?.role||'technician');if($('#settingsPermissionOverview'))$('#settingsPermissionOverview').innerHTML=Object.entries(groups).map(([section,items])=>`<div><strong>${escapeHtml(section)}</strong><span>${items.filter(p=>perms[p.key]).length}/${items.length} ativas</span></div>`).join('');
    if(isSuperAdmin())renderPerformanceSettings();
    applySettingsModuleFilter();
  }

  async function persistMyUiPreferences(){
    saveLocalUiPreferences(state.uiPreferences);
    if(!state.supabase)return true;
    try{const {error}=await state.supabase.rpc('save_my_ui_preferences',{p_preferences:normalizeUiPreferences(state.uiPreferences)});if(error)throw error;state.user.uiPreferences=clone(state.uiPreferences);return true}catch(err){console.warn('Preferências salvas localmente; persistência no Supabase indisponível. Execute a migração V2.38.0.',err);return false}
  }
  async function saveCurrentLayout(){
    if(!requirePermission('dashboard.customize'))return;const draft=currentLayoutDraft();draft.layout.density=$('#layoutDensitySelect').value==='compact'?'compact':'comfortable';
    state.uiPreferences=normalizeUiPreferences({...state.uiPreferences,layouts:{...(state.uiPreferences?.layouts||{}),[draft.view]:draft.layout}});applyPersonalLayout(draft.view);const remote=await persistMyUiPreferences();$('#layoutSaveStatus').textContent=remote?'Salvo':'Salvo localmente';toast(remote?'Layout salvo.':'Layout salvo neste navegador. Execute a migração V2.38.0 para sincronizar entre dispositivos.');
  }
  async function resetCurrentLayout(){
    if(!requirePermission('dashboard.customize'))return;const view=$('#layoutViewSelect').value;state.layoutDraft={view,layout:normalizeUiLayout(view,{})};state.uiPreferences=normalizeUiPreferences({...state.uiPreferences,layouts:{...(state.uiPreferences?.layouts||{}),[view]:state.layoutDraft.layout}});renderLayoutEditor();applyPersonalLayout(view);await persistMyUiPreferences();$('#layoutSaveStatus').textContent='Padrão restaurado';toast('Layout restaurado para o padrão.');
  }
  function changeLayoutDraftMove(key,direction){const draft=currentLayoutDraft();draft.layout=moveUiBlock(draft.view,draft.layout,key,direction);renderLayoutEditor()}
  function changeLayoutDraftVisibility(key,visible){const draft=currentLayoutDraft();draft.layout=toggleUiBlock(draft.view,draft.layout,key,visible);renderLayoutEditor()}
  function changeLayoutDraftSize(key,size){const draft=currentLayoutDraft();draft.layout=setUiBlockSize(draft.view,draft.layout,key,size);renderLayoutEditor()}
  function reorderLayoutDraft(fromKey,toKey){const draft=currentLayoutDraft(),order=[...draft.layout.order],from=order.indexOf(fromKey),to=order.indexOf(toKey);if(from<0||to<0||from===to)return;order.splice(to,0,order.splice(from,1)[0]);draft.layout=normalizeUiLayout(draft.view,{...draft.layout,order});renderLayoutEditor()}

  function savedHomeLayout(){return normalizeUiLayout('home',state.uiPreferences?.layouts?.home)}
  function homeLayoutDraft(){if(!state.homeLayoutDraft)state.homeLayoutDraft=savedHomeLayout();return state.homeLayoutDraft}
  function homeWidgetBarHtml(block,layout){const key=block.key,hidden=layout.hidden.includes(key),size=layout.sizes?.[key]||block.defaultSize||'full',options=layoutSizeOptions(block,size);return `<button class="home-widget-drag" type="button" title="Arraste o widget" aria-label="Arraste ${escapeHtml(block.label)}">⋮⋮</button><strong>${escapeHtml(block.label)}</strong>${options?`<label><span>Tamanho</span><select data-home-widget-size="${escapeHtml(key)}">${options}</select></label>`:''}<button class="btn secondary compact home-widget-visibility" type="button" data-home-widget-toggle="${escapeHtml(key)}">${hidden?'Mostrar':'Ocultar'}</button>`}
  function renderHomeWidgetEditState(){
    const root=$('#homeWidgetGrid'),def=settingsLayoutDefinition('home');if(!root||!def)return;
    const layout=normalizeUiLayout('home',state.homeLayoutEditMode?homeLayoutDraft():savedHomeLayout());if(state.homeLayoutEditMode)state.homeLayoutDraft=layout;
    root.classList.toggle('home-layout-editing',state.homeLayoutEditMode);root.classList.toggle('layout-density-compact',layout.density==='compact');
    layout.order.forEach((key,index)=>{const block=def.blocks.find(b=>b.key===key),el=block?$(block.selector):null;if(!el)return;const roleUnavailable=key==='squads'&&isTechnician(),hidden=layout.hidden.includes(key);el.classList.toggle('home-widget-role-unavailable',roleUnavailable);el.style.order=String(index);el.classList.remove('home-widget-size-small','home-widget-size-medium','home-widget-size-wide','home-widget-size-full');el.classList.add(`home-widget-size-${layout.sizes?.[key]||block.defaultSize||'full'}`);el.classList.toggle('layout-user-hidden',!state.homeLayoutEditMode&&hidden);el.classList.toggle('home-widget-edit-hidden',state.homeLayoutEditMode&&hidden);el.draggable=state.homeLayoutEditMode&&!roleUnavailable;const bar=el.querySelector('.home-widget-editbar');if(bar){bar.innerHTML=state.homeLayoutEditMode?homeWidgetBarHtml(block,layout):'';bar.setAttribute('aria-hidden',state.homeLayoutEditMode?'false':'true');}});
    $('#homeLayoutToolbar')?.classList.toggle('hidden',!state.homeLayoutEditMode);
  }
  function beginHomeLayoutEdit(){if(!requirePermission('dashboard.customize'))return;state.homeLayoutEditMode=true;state.homeLayoutDraft=savedHomeLayout();renderHomeWidgetEditState();$('#homeLayoutToolbar')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
  function cancelHomeLayoutEdit(){state.homeLayoutEditMode=false;state.homeLayoutDraft=null;applyPersonalLayout('home');renderHomeWidgetEditState();}
  function resetHomeLayoutDraft(){state.homeLayoutDraft=normalizeUiLayout('home',{});renderHomeWidgetEditState();toast('Home restaurada para o padrão no rascunho. Clique em Salvar Home para confirmar.')}
  async function saveHomeLayoutEdit(){if(!requirePermission('dashboard.customize'))return;const layout=normalizeUiLayout('home',homeLayoutDraft());state.uiPreferences=normalizeUiPreferences({...state.uiPreferences,layouts:{...(state.uiPreferences?.layouts||{}),home:layout}});state.homeLayoutEditMode=false;state.homeLayoutDraft=null;applyPersonalLayout('home');renderHomeWidgetEditState();const remote=await persistMyUiPreferences();toast(remote?'Home personalizada salva.':'Home salva neste navegador. A sincronização remota não está disponível.');}
  function updateHomeWidgetSize(key,size){state.homeLayoutDraft=setUiBlockSize('home',homeLayoutDraft(),key,size);renderHomeWidgetEditState()}
  function toggleHomeWidgetVisibility(key){const layout=homeLayoutDraft(),visible=layout.hidden.includes(key);state.homeLayoutDraft=toggleUiBlock('home',layout,key,visible);renderHomeWidgetEditState()}
  function reorderHomeWidgets(fromKey,toKey){const layout=homeLayoutDraft(),order=[...layout.order],from=order.indexOf(fromKey),to=order.indexOf(toKey);if(from<0||to<0||from===to)return;order.splice(to,0,order.splice(from,1)[0]);state.homeLayoutDraft=normalizeUiLayout('home',{...layout,order});renderHomeWidgetEditState()}
  function renderPermissionEditor(role=$('#editUserRole')?.value||'technician'){
    const wrap=$('#editUserPermissions');if(!wrap)return;const normalized=normalizeAccessRole(role),section=$('#editUserPermissionsSection'),canRestrict=isAdmin()&&hasPermission('permissions.manage')&&normalized==='technician';section?.classList.toggle('hidden',!canRestrict);if(!canRestrict){wrap.innerHTML='';return;}
    const groups=settingsPermissionGroups(normalized),raw=state.editPermissionDraft||{};wrap.innerHTML=Object.entries(groups).map(([group,items])=>`<div class="permission-group"><strong>${escapeHtml(group)}</strong>${items.map(item=>`<label><input type="checkbox" data-user-permission="${escapeHtml(item.key)}" ${raw[item.key]===false?'':'checked'}><span>${escapeHtml(item.label)}</span></label>`).join('')}</div>`).join('');
  }
  function collectPermissionOverrides(){const out={};$$('[data-user-permission]').forEach(input=>{if(!input.checked)out[input.dataset.userPermission]=false});return out}

  function normalizeSystemFont(value){const key=String(value||'').trim().toLowerCase();return SYSTEM_FONT_OPTIONS[key]?key:DEFAULT_SYSTEM_FONT}
  function systemFontStack(value){return SYSTEM_FONT_OPTIONS[normalizeSystemFont(value)].stack}
  function applySystemFont(value){const key=normalizeSystemFont(value);document.documentElement.style.setProperty('--app-font-family',systemFontStack(key));document.documentElement.dataset.systemFont=key;const preview=$('#systemFontPreview');if(preview)preview.style.fontFamily=systemFontStack(key);return key}
  function syncSystemFontControl(){const key=normalizeSystemFont(state.theme?.fontFamily);if($('#systemFontSelect'))$('#systemFontSelect').value=key;applySystemFont(key)}

  function currentChartPreferences(){return normalizeChartPreferences(state.theme?.chartPreferences||state.chartPreferences||DEFAULT_CHART_PREFERENCES)}
  function applyChartPreferences(prefs){
    const cfg=applyChartCssVariables(document.documentElement.style,prefs);
    state.chartPreferences=cfg;
    return cfg;
  }
  function syncChartPreferencePreview(fontOverride=null){
    const cfg=currentChartPreferences(),fontKey=normalizeSystemFont(fontOverride||state.theme?.fontFamily);
    if($('#systemFontSelect'))$('#systemFontSelect').value=fontKey;
    if($('#systemFontPreview'))$('#systemFontPreview').style.fontFamily=systemFontStack(fontKey);
    if($('#chartLabelFontInput'))$('#chartLabelFontInput').value=cfg.labelFontSize;
    if($('#chartAxisFontInput'))$('#chartAxisFontInput').value=cfg.axisFontSize;
    if($('#chartLegendFontInput'))$('#chartLegendFontInput').value=cfg.legendFontSize;
    if($('#chartHeightInput'))$('#chartHeightInput').value=cfg.chartHeight;
    if($('#chartCardPaddingInput'))$('#chartCardPaddingInput').value=cfg.cardPadding;
    if($('#chartScaleMode'))$('#chartScaleMode').value=cfg.yScaleMode;
    if($('#chartScaleMinInput'))$('#chartScaleMinInput').value=cfg.yMin;
    if($('#chartScaleMaxInput'))$('#chartScaleMaxInput').value=cfg.yMax;
    if($('#chartLabelDensity'))$('#chartLabelDensity').value=cfg.labelDensity;
    if($('#chartLineWidthInput'))$('#chartLineWidthInput').value=cfg.lineWidth;
    if($('#chartPointRadiusInput'))$('#chartPointRadiusInput').value=cfg.pointRadius;
    if($('#chartLabelFontValue'))$('#chartLabelFontValue').textContent=`${cfg.labelFontSize} px`;
    if($('#chartAxisFontValue'))$('#chartAxisFontValue').textContent=`${cfg.axisFontSize} px`;
    if($('#chartLegendFontValue'))$('#chartLegendFontValue').textContent=`${cfg.legendFontSize} px`;
    if($('#chartHeightValue'))$('#chartHeightValue').textContent=`${cfg.chartHeight} px`;
    if($('#chartCardPaddingValue'))$('#chartCardPaddingValue').textContent=`${cfg.cardPadding} px`;
    if($('#chartLineWidthValue'))$('#chartLineWidthValue').textContent=`${Number(cfg.lineWidth).toLocaleString('pt-BR',{minimumFractionDigits:cfg.lineWidth%1?1:0,maximumFractionDigits:1})} px`;
    if($('#chartPointRadiusValue'))$('#chartPointRadiusValue').textContent=`${Number(cfg.pointRadius).toLocaleString('pt-BR',{minimumFractionDigits:cfg.pointRadius%1?1:0,maximumFractionDigits:1})} px`;
    if($('#chartScaleMinInput'))$('#chartScaleMinInput').disabled=cfg.yScaleMode!=='manual';
    if($('#chartScaleMaxInput'))$('#chartScaleMaxInput').disabled=cfg.yScaleMode!=='manual';
  }
  function collectChartPreferencesFromUi(){
    return normalizeChartPreferences({labelDensity:$('#chartLabelDensity')?.value,labelFontSize:$('#chartLabelFontInput')?.value,axisFontSize:$('#chartAxisFontInput')?.value,legendFontSize:$('#chartLegendFontInput')?.value,chartHeight:$('#chartHeightInput')?.value,cardPadding:$('#chartCardPaddingInput')?.value,yScaleMode:$('#chartScaleMode')?.value,yMin:$('#chartScaleMinInput')?.value,yMax:$('#chartScaleMaxInput')?.value,lineWidth:$('#chartLineWidthInput')?.value,pointRadius:$('#chartPointRadiusInput')?.value});
  }
  function appearanceScopeCodes(){
    if(state.appearanceScope==='all'&&isSuperAdmin())return Object.keys(state.squads||{}).filter(code=>code!=='all');
    return state.squadCode&&state.squadCode!=='all'?[state.squadCode]:[];
  }
  function canEditAppearance(){return isAdmin()&&hasPermission('appearance.manage')&&appearanceScopeCodes().length>0}
  function appearanceScopeLabel(){const codes=appearanceScopeCodes();return state.appearanceScope==='all'&&isSuperAdmin()?`todos os Squads (${codes.join(', ')})`:(codes[0]?`Squad ${codes[0]}`:'nenhum Squad')}
  function previewChartPreferences(){
    if(!canEditAppearance())return;
    const cfg=collectChartPreferencesFromUi(),fontKey=normalizeSystemFont($('#systemFontSelect')?.value||state.theme?.fontFamily);
    applyChartPreferences(cfg);applySystemFont(fontKey);syncChartPreferencePreview(fontKey);render();
    if($('#chartPrefsStatus'))$('#chartPrefsStatus').textContent=`Pré-visualização aplicada. Clique em salvar para persistir em ${appearanceScopeLabel()}.`;
  }
  function saveChartPreferences(){
    if(!canEditAppearance())return toast('Selecione um Squad específico ou use o escopo Todos os Squads como Administrador.');
    const cfg=collectChartPreferencesFromUi(),fontKey=normalizeSystemFont($('#systemFontSelect')?.value||state.theme?.fontFamily);
    state.theme=normalizeThemePayload({...state.theme,chartPreferences:cfg,fontFamily:fontKey,preset:'custom'});
    applyChartPreferences(cfg);applySystemFont(fontKey);syncChartPreferencePreview(fontKey);saveTheme();render();
    if($('#chartPrefsStatus'))$('#chartPrefsStatus').textContent=`Configuração visual salva em ${appearanceScopeLabel()}.`;
    toast(`Configuração visual salva em ${appearanceScopeLabel()}.`);
  }
  function resetChartPreferences(){
    if(!canEditAppearance())return toast('Selecione um Squad específico ou use o escopo Todos os Squads como Administrador.');
    const cfg=normalizeChartPreferences(DEFAULT_CHART_PREFERENCES),fontKey=DEFAULT_SYSTEM_FONT;
    state.theme=normalizeThemePayload({...state.theme,chartPreferences:cfg,fontFamily:fontKey,preset:'custom'});
    applyChartPreferences(cfg);applySystemFont(fontKey);syncChartPreferencePreview(fontKey);saveTheme();render();
    if($('#chartPrefsStatus'))$('#chartPrefsStatus').textContent=`Padrão restaurado em ${appearanceScopeLabel()}.`;
    toast(`Configuração visual restaurada em ${appearanceScopeLabel()}.`);
  }
  function chartLabelVisible(index,total){return chartEngineLabelVisible(index,total,currentChartPreferences())}
  function configuredChartHeight(baseHeight=340){return chartEngineConfiguredHeight(baseHeight,currentChartPreferences())}
  function configuredPercentScale(rawTop,explicitMax=null){return chartEnginePercentScale(rawTop,explicitMax,currentChartPreferences())}


  function loadDemoSquads(){
    const base={
      A:{code:'A',name:'Squad A',dbId:null,months:{}},
      B:{code:'B',name:'Squad B',dbId:null,months:{}},
      D:{code:'D',name:'Squad D',dbId:null,months:{[window.DEFAULT_SQUAD_DATA.id]:clone(window.DEFAULT_SQUAD_DATA)}},
      E:{code:'E',name:'Squad E',dbId:null,months:{}}
    };
    try{
      const saved=JSON.parse(localStorage.getItem('squadDashboardDataV2')||'null');
      if(saved&&typeof saved==='object'){
        for(const code of Object.keys(base)) if(saved[code]?.months) base[code].months=saved[code].months;
      }
    }catch(e){}
    return base;
  }
  function saveDemoSquads(){
    if((window.APP_CONFIG?.mode||'demo')!=='demo') return;
    const payload={}; Object.values(state.squads).forEach(s=>payload[s.code]={months:s.months});
    localStorage.setItem('squadDashboardDataV2',JSON.stringify(payload));
  }
  function allThemes(){try{return JSON.parse(localStorage.getItem('squadDashboardThemesV2')||'{}')}catch(e){return {}}}
  function systemColorMode(){return window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark'}
  function loadColorModePreference(){try{const saved=localStorage.getItem(COLOR_MODE_KEY);if(saved==='light'||saved==='dark')return saved}catch(e){}return systemColorMode()}
  function hasStoredColorMode(){try{return ['light','dark'].includes(localStorage.getItem(COLOR_MODE_KEY))}catch(e){return false}}
  function isLegacyVermithorTheme(theme){const t=normalizeThemePayload(theme||DEFAULT_THEME);return t.preset==='vermithor'||(!t.preset&&(!t.campaignTitle||t.campaignTitle==='Casa do Dragão'||t.campaignTitle==='Dragão Vermithor'))}
  function resolveLegacyTheme(theme){
    const t=normalizeThemePayload(theme||DEFAULT_THEME);
    if(!isLegacyVermithorTheme(t))return t;
    const shared=loadLastTheme();
    return shared&&!isLegacyVermithorTheme(shared)&&sanitizeThemeBackground(shared.background)?normalizeThemePayload(shared):t;
  }
  function loadThemeForSquad(code){const t=allThemes()[code];return resolveLegacyTheme(t||DEFAULT_THEME)}
  function loadCachedTheme(){
    try{
      const direct=JSON.parse(localStorage.getItem(LAST_THEME_KEY)||'null');
      if(direct)return normalizeThemePayload(direct);
      const themes=allThemes(),lastCode=localStorage.getItem(LAST_SQUAD_KEY);
      if(lastCode&&themes[lastCode])return normalizeThemePayload(themes[lastCode]);
      if(themes.D)return normalizeThemePayload(themes.D);
      const first=Object.values(themes).find(Boolean);
      return first?normalizeThemePayload(first):null;
    }catch(e){return null}
  }
  function loadLastTheme(){return loadCachedTheme()||clone(DEFAULT_THEME)}
  function rememberLastTheme(theme){try{const normalized=normalizeThemePayload(theme||DEFAULT_THEME);if(isLegacyVermithorTheme(normalized))return;localStorage.setItem(LAST_THEME_KEY,JSON.stringify(normalized))}catch(err){console.warn('Não foi possível guardar o último tema para as telas públicas.',err)}}
  function rememberLastSquad(code){if(!code||code==='all')return;try{localStorage.setItem(LAST_SQUAD_KEY,String(code))}catch(e){}}
  let themePersistTimer=null;
  function saveTheme(){
    if(!hasPermission('appearance.manage'))return;const codes=appearanceScopeCodes();if(!codes.length)return;
    if(state.squadCode&&state.squadCode!=='all')rememberLastSquad(state.squadCode);
    const normalized=normalizeThemePayload(state.theme),themes=allThemes();
    codes.forEach(code=>{themes[code]=clone(normalized);if(state.squads?.[code])state.squads[code].theme=clone(normalized)});
    try{localStorage.setItem('squadDashboardThemesV2',JSON.stringify(themes));}catch(err){console.warn('Tema grande demais para o cache local; mantendo persistência no Supabase.',err);}
    rememberLastTheme(normalized);
    if(state.supabase){clearTimeout(themePersistTimer);themePersistTimer=setTimeout(()=>persistThemeToSupabase(codes,normalized).catch(console.error),350)}
  }

  function showBoot(message='Validando sua sessão e carregando os dados...'){
    const el=$('#bootScreen');if(!el)return;el.classList.remove('hidden');if($('#bootMessage'))$('#bootMessage').textContent=message;
  }
  function hideBoot(){const el=$('#bootScreen');if(el)el.classList.add('hidden')}
  async function hydratePublicThemeBootstrap(){
    if(!state.supabase||!PUBLIC_THEME_ORG_SLUG)return null;
    try{
      if($('#bootMessage'))$('#bootMessage').textContent='Carregando identidade visual...';
      const {data,error}=await state.supabase.rpc('get_public_theme_bootstrap',{p_org_slug:PUBLIC_THEME_ORG_SLUG});
      if(error)throw error;
      if(!data||typeof data!=='object'||Array.isArray(data)||!Object.keys(data).length)return null;
      const theme=normalizeThemePayload(data);applyTheme(theme);return theme;
    }catch(err){
      const msg=String(err?.message||err||'');
      if(!/get_public_theme_bootstrap|function .* does not exist|schema cache/i.test(msg))console.warn('Tema público de entrada indisponível.',err);
      return null;
    }
  }

  async function boot(){
    state.performanceTracker=createPerformanceTracker('boot');
    applyColorMode(state.colorMode,{persist:false,reapplyTheme:false});
    const cachedBootTheme=loadCachedTheme();
    applyTheme(cachedBootTheme||BOOT_FALLBACK_THEME,{remember:!!cachedBootTheme});
    bindSystemColorMode();
    showBoot();
    try{observePerformanceLongTasks();}catch(e){}
    prepareCentralSettings();
    bindStaticEvents();
    if((window.APP_CONFIG?.mode||'demo')==='supabase'){
      try{
        if($('#bootMessage'))$('#bootMessage').textContent='Conectando com segurança...';
        await initSupabase();performanceMark('supabase_library');
        if($('#bootMessage'))$('#bootMessage').textContent='Validando sua sessão...';
        const {data}=await state.supabase.auth.getSession();performanceMark('session_checked');
        if(state.recoveryMode){if(!cachedBootTheme)await hydratePublicThemeBootstrap();showLogin('Link de recuperação validado. Defina sua nova senha.');openModal('recoveryModal');return;}
        if(data?.session) return await enterSupabaseSession(data.session.user,{allowCache:true});
        if(!cachedBootTheme)await hydratePublicThemeBootstrap();
        showLogin();
      }
      catch(err){console.error(err); showLogin('Não foi possível conectar ao Supabase. Confira js/config.js.');}
    }else{
      try{const saved=JSON.parse(sessionStorage.getItem('squadDemoSession')||'null'); if(saved?.email){const u=findDemoUser(saved.email);if(u) return enterApp({...u});}}catch(e){}
      showLogin();
    }
  }

  function bindStaticEvents(){
    $('#loginForm').addEventListener('submit',handleLogin);
    $('#forgotPasswordBtn').addEventListener('click',handleForgotPassword);
    $('#recoveryForm').addEventListener('submit',handleRecoveryPassword);
    $('#logoutBtn').addEventListener('click',logout);
    $$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>executeNavigationTarget({view:btn.dataset.view||'home',adminSection:btn.dataset.adminSection||null,settingsModule:btn.dataset.settingsModule||null})));
    $('#globalSearchTrigger')?.addEventListener('click',openGlobalSearch);
    $('#globalSearchBackdrop')?.addEventListener('click',closeGlobalSearch);
    $('#currentFavoriteBtn')?.addEventListener('click',e=>{e.stopPropagation();toggleCurrentFavorite();});
    $('#workspaceMenuBtn')?.addEventListener('click',e=>{e.stopPropagation();toggleWorkspacePopover();});
    $('#workspacePopover')?.addEventListener('click',e=>{e.stopPropagation();handleWorkspacePopoverClick(e);});
    $('#workspacePopover')?.addEventListener('change',handleWorkspacePopoverChange);
    $('#savedViewForm')?.addEventListener('submit',saveSavedViewFromModal);
    $('#globalSearchInput')?.addEventListener('input',()=>{state.globalSearchIndex=0;renderGlobalSearch();});
    $('#globalSearchResults')?.addEventListener('mousemove',e=>{const btn=e.target.closest('[data-global-command]');if(!btn)return;const index=state.globalSearchResults.findIndex(x=>x.id===btn.dataset.globalCommand);if(index>=0&&index!==state.globalSearchIndex){state.globalSearchIndex=index;renderGlobalSearch();}});
    $('#globalSearchResults')?.addEventListener('click',e=>{const btn=e.target.closest('[data-global-command]');if(btn)activateGlobalSearch(btn.dataset.globalCommand);});
    $('#appBreadcrumbs')?.addEventListener('click',e=>{const btn=e.target.closest('[data-breadcrumb-view]');if(!btn)return;executeNavigationTarget({view:btn.dataset.breadcrumbView,adminSection:btn.dataset.breadcrumbAdminSection||null,settingsModule:btn.dataset.breadcrumbSettingsModule||null,indicatorSection:btn.dataset.breadcrumbIndicatorSection||null});});
    document.addEventListener('keydown',handleGlobalSearchKeydown);
    window.addEventListener('popstate',()=>{if(state.user&&!PRESENTATION_ROUTE.enabled)restorePersistentRoute(readNavigationRoute(window.location),{canonicalize:true}).catch(err=>console.error('Falha ao restaurar rota do navegador.',err));});
    if($('#view-home'))$('#view-home').addEventListener('click',handleHomeClick);
    $('#saveHomeLayoutBtn')?.addEventListener('click',saveHomeLayoutEdit);
    $('#cancelHomeLayoutBtn')?.addEventListener('click',cancelHomeLayoutEdit);
    $('#resetHomeLayoutBtn')?.addEventListener('click',resetHomeLayoutDraft);
    if($('#homeWidgetGrid')){const grid=$('#homeWidgetGrid');grid.addEventListener('change',e=>{const size=e.target.closest('[data-home-widget-size]');if(size&&state.homeLayoutEditMode)updateHomeWidgetSize(size.dataset.homeWidgetSize,size.value);});grid.addEventListener('click',e=>{const toggle=e.target.closest('[data-home-widget-toggle]');if(toggle&&state.homeLayoutEditMode){e.preventDefault();toggleHomeWidgetVisibility(toggle.dataset.homeWidgetToggle);}});grid.addEventListener('dragstart',e=>{if(!state.homeLayoutEditMode)return;const widget=e.target.closest('[data-home-widget]');if(!widget||widget.classList.contains('home-widget-role-unavailable'))return;state.homeDraggedWidget=widget.dataset.homeWidget;widget.classList.add('home-widget-dragging');e.dataTransfer?.setData('text/plain',state.homeDraggedWidget);if(e.dataTransfer)e.dataTransfer.effectAllowed='move';});grid.addEventListener('dragover',e=>{if(!state.homeLayoutEditMode||!state.homeDraggedWidget)return;const widget=e.target.closest('[data-home-widget]');if(!widget||widget.dataset.homeWidget===state.homeDraggedWidget)return;e.preventDefault();grid.querySelectorAll('.home-widget').forEach(x=>x.classList.toggle('home-widget-drag-over',x===widget));});grid.addEventListener('drop',e=>{if(!state.homeLayoutEditMode||!state.homeDraggedWidget)return;const widget=e.target.closest('[data-home-widget]');if(!widget)return;e.preventDefault();reorderHomeWidgets(state.homeDraggedWidget,widget.dataset.homeWidget);state.homeDraggedWidget=null;});grid.addEventListener('dragend',()=>{state.homeDraggedWidget=null;grid.querySelectorAll('.home-widget').forEach(x=>x.classList.remove('home-widget-dragging','home-widget-drag-over'));});}
    $$('[data-empty-view],[data-empty-admin-section]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.emptyAdminSection)showView('admin',btn.dataset.emptyAdminSection);else if(btn.dataset.emptyView)showView(btn.dataset.emptyView);}));
    if($('#layoutViewSelect'))$('#layoutViewSelect').addEventListener('change',()=>{state.layoutDraft=null;renderLayoutEditor();});
    if($('#layoutDensitySelect'))$('#layoutDensitySelect').addEventListener('change',()=>{const draft=currentLayoutDraft();draft.layout.density=$('#layoutDensitySelect').value==='compact'?'compact':'comfortable';});
    if($('#layoutBlockList'))$('#layoutBlockList').addEventListener('click',e=>{const move=e.target.closest('[data-layout-move]');if(move){const row=move.closest('[data-layout-key]');if(row)changeLayoutDraftMove(row.dataset.layoutKey,move.dataset.layoutMove);}});
    if($('#layoutBlockList'))$('#layoutBlockList').addEventListener('change',e=>{const input=e.target.closest('[data-layout-visible]');if(input){changeLayoutDraftVisibility(input.dataset.layoutVisible,!!input.checked);return}const size=e.target.closest('[data-layout-size]');if(size)changeLayoutDraftSize(size.dataset.layoutSize,size.value);});
    if($('#layoutBlockList')){let dragged=null;$('#layoutBlockList').addEventListener('dragstart',e=>{const row=e.target.closest('[data-layout-key]');if(!row)return;dragged=row.dataset.layoutKey;row.classList.add('layout-dragging');e.dataTransfer?.setData('text/plain',dragged);if(e.dataTransfer)e.dataTransfer.effectAllowed='move';});$('#layoutBlockList').addEventListener('dragover',e=>{const row=e.target.closest('[data-layout-key]');if(!dragged||!row||row.dataset.layoutKey===dragged)return;e.preventDefault();$$('#layoutBlockList .layout-block-row').forEach(x=>x.classList.toggle('layout-drag-over',x===row));});$('#layoutBlockList').addEventListener('drop',e=>{const row=e.target.closest('[data-layout-key]');if(!dragged||!row)return;e.preventDefault();reorderLayoutDraft(dragged,row.dataset.layoutKey);dragged=null;});$('#layoutBlockList').addEventListener('dragend',()=>{dragged=null;$$('#layoutBlockList .layout-block-row').forEach(x=>x.classList.remove('layout-dragging','layout-drag-over'));});}
    if($('#saveLayoutBtn'))$('#saveLayoutBtn').addEventListener('click',saveCurrentLayout);
    if($('#resetLayoutBtn'))$('#resetLayoutBtn').addEventListener('click',resetCurrentLayout);
    $$('[data-settings-route]').forEach(btn=>btn.addEventListener('click',()=>openSettingsModule(btn.dataset.settingsRoute)));
    $$('[data-settings-view]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.permission&&!hasPermission(btn.dataset.permission))return toast('Você não possui permissão para esta tela.');showView(btn.dataset.settingsView)}));
    $$('[data-open-settings-module]').forEach(btn=>btn.addEventListener('click',()=>openSettingsModule(btn.dataset.openSettingsModule)));
    $$('#settingsModuleNav [data-settings-module-filter]').forEach(btn=>btn.addEventListener('click',()=>openSettingsModule(btn.dataset.settingsModuleFilter,{scroll:false})));
    if($('#settingsSearchInput'))$('#settingsSearchInput').addEventListener('input',()=>{state.settingsModule='all';applySettingsModuleFilter();});
    $('#refreshPerformanceMetricsBtn')?.addEventListener('click',()=>loadPerformanceRemoteSummary(true));
    $('#resetPerformanceMetricsBtn')?.addEventListener('click',resetPerformanceCenter);
    $('#exportPerformanceMetricsBtn')?.addEventListener('click',exportPerformanceDiagnostics);
    $('#notificationBellBtn')?.addEventListener('click',e=>{e.stopPropagation();setWorkspacePopover(false);toggleNotificationPopover();});
    $('#notificationMarkAllBtn')?.addEventListener('click',markAllNotificationsRead);
    $('#openAlertCenterBtn')?.addEventListener('click',()=>{setNotificationPopover(false);showView('alerts');});
    $('#refreshNotificationsBtn')?.addEventListener('click',()=>ensureNotificationsLoaded(true));
    $('#publishedNotificationsRefreshBtn')?.addEventListener('click',()=>ensureNotificationsLoaded(true));
    $('#newNotificationBtn')?.addEventListener('click',openNotificationComposer);
    $('#notificationComposerForm')?.addEventListener('submit',publishInternalNotification);
    $('#notificationAudienceInput')?.addEventListener('change',syncNotificationAudienceField);
    $('#alertMarkAllReadBtn')?.addEventListener('click',markAllNotificationsRead);
    ['#alertStatusFilter','#alertSourceFilter','#alertSeverityFilter','#alertCategoryFilter'].forEach(sel=>$(sel)?.addEventListener('change',()=>{syncNotificationFilterState();renderAlertCenter();}));
    $('#alertSearchInput')?.addEventListener('input',()=>{syncNotificationFilterState();renderAlertCenter();});
    $('#notificationPopoverList')?.addEventListener('click',handleNotificationDelegatedClick);
    $('#alertCenterRows')?.addEventListener('click',handleNotificationDelegatedClick);
    $('#publishedNotificationRows')?.addEventListener('click',handleNotificationDelegatedClick);
    document.addEventListener('click',e=>{if(state.notificationPopoverOpen&&!e.target.closest('#notificationShell'))setNotificationPopover(false);if(state.workspacePopoverOpen&&!e.target.closest('#workspaceShell'))setWorkspacePopover(false);});
    if($('#helpSearchInput'))$('#helpSearchInput').addEventListener('input',applyHelpSearch);
    if($('#clearHelpSearchBtn'))$('#clearHelpSearchBtn').addEventListener('click',()=>{$('#helpSearchInput').value='';applyHelpSearch();$('#helpSearchInput').focus();});
    $$('[data-help-view],[data-help-admin-section],[data-help-settings-module]').forEach(btn=>btn.addEventListener('click',()=>openHelpTarget(btn)));
    if($('#settingsMonthSelect'))$('#settingsMonthSelect').addEventListener('change',e=>{if(!e.target.value)return;state.currentId=e.target.value;chooseDefaultTech();refreshSelectors();renderSettings();syncPersistentUrl({replace:true});});
    if($('#openUsersPermissionsBtn'))$('#openUsersPermissionsBtn').addEventListener('click',()=>showView('users'));
    if($('#resetUserPermissionsBtn'))$('#resetUserPermissionsBtn').addEventListener('click',()=>{state.editPermissionDraft={};renderPermissionEditor($('#editUserRole').value);});
    ['#topUserProfileBtn'].forEach(sel=>{const el=$(sel);if(!el)return;el.addEventListener('click',()=>showView('profile'));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showView('profile')}})});
    $('#profilePasswordForm').addEventListener('submit',handleProfilePasswordChange);
    $('#sidebarCollapseBtn')?.addEventListener('click',toggleSidebarCollapsed);
    $$('[data-nav-group-toggle]').forEach(btn=>btn.addEventListener('click',()=>toggleNavigationGroup(btn.dataset.navGroupToggle)));
    $$('[data-nav-subgroup-toggle]').forEach(btn=>btn.addEventListener('click',()=>toggleNavigationSubgroup(btn.dataset.navSubgroupToggle)));
    $('#chooseProfileAvatarBtn')?.addEventListener('click',()=>$('#profileAvatarInput')?.click());
    $('#profileAvatarInput')?.addEventListener('change',handleProfileAvatarFile);
    $('#removeProfileAvatarBtn')?.addEventListener('click',removeProfileAvatar);
    const mobileMenu=$('#mobileMenu');
    const sidebar=$('.sidebar');
    const sidebarBackdrop=$('#sidebarBackdrop');
    const setSidebarOpen=(open)=>{
      if(!sidebar||!mobileMenu)return;
      sidebar.classList.toggle('open',!!open);
      document.body.classList.toggle('sidebar-open',!!open);
      mobileMenu.setAttribute('aria-expanded',open?'true':'false');
      mobileMenu.setAttribute('aria-label',open?'Fechar menu lateral':'Abrir menu lateral');
    };
    mobileMenu?.addEventListener('click',()=>setSidebarOpen(!sidebar.classList.contains('open')));
    sidebarBackdrop?.addEventListener('click',()=>setSidebarOpen(false));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sidebar?.classList.contains('open'))setSidebarOpen(false)});
    window.addEventListener('resize',()=>{if(window.innerWidth>980&&sidebar?.classList.contains('open'))setSidebarOpen(false);applyNavigationPreferences();});
    window.addEventListener('error',e=>captureClientPerformanceError('window_error',e.error||e.message,{source:String(e.filename||'').split('/').pop()||'window'}));
    window.addEventListener('unhandledrejection',e=>captureClientPerformanceError('unhandled_rejection',e.reason||'Promise rejeitada',{source:'promise'}));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){queueCachePerformanceSample();flushPerformanceTelemetry();}});
    $('#squadSelect').addEventListener('change',async e=>{await selectSquad(e.target.value,{history:'replace'});});
    $('#monthSelect').addEventListener('change',async e=>{state.currentId=e.target.value;if(state.supabase&&state.squadCode!=='all'){try{await ensureMonthLoaded(state.squadCode,state.currentId);}catch(err){toast('Nao foi possivel carregar esta competencia.');}}chooseDefaultTech();refreshSelectors();render();syncPersistentUrl({replace:true});});
    $('#techSelect').addEventListener('change',e=>{state.techName=e.target.value;renderIndividual();syncPersistentUrl({replace:true});});
    $('#adminImportBtn').addEventListener('click',()=>{if(requirePermission('data.import'))openImport('service')});
    if($('#adminQualityImportBtn'))$('#adminQualityImportBtn').addEventListener('click',()=>{if(requirePermission('data.import'))openImport('quality')});
    if($('#qualityImportBtn'))$('#qualityImportBtn').addEventListener('click',()=>{if(requirePermission('data.import'))openImport('quality')});
    $('#adminThemeBtn').addEventListener('click',()=>{if(!requirePermission('appearance.manage'))return;beginThemeEditor()});
    if($('#openUsersBtn'))$('#openUsersBtn').addEventListener('click',()=>{if(requirePermission('users.manage'))showView('users')});
    $('#newUserBtn').addEventListener('click',()=>{if(requirePermission('users.manage'))openCreateUser()});
    if($('#auditSearchInput'))$('#auditSearchInput').addEventListener('input',renderAuditRows);
    if($('#auditCategoryFilter'))$('#auditCategoryFilter').addEventListener('change',renderAuditRows);
    if($('#refreshAuditBtn'))$('#refreshAuditBtn').addEventListener('click',()=>renderAuditLogView(true));
    if($('#presentationCopyUrlBtn'))$('#presentationCopyUrlBtn').addEventListener('click',copyPresentationUrl);
    if($('#presentationOpenUrlBtn'))$('#presentationOpenUrlBtn').addEventListener('click',openPresentationUrl);
    if($('#presentationFullscreenBtn'))$('#presentationFullscreenBtn').addEventListener('click',togglePresentationFullscreen);
    if($('#presentationExitDirectBtn'))$('#presentationExitDirectBtn').addEventListener('click',exitDirectPresentation);
    window.addEventListener('soften:presentation-config-applied',async e=>{if(!isAdmin())return;const cfg=e.detail||{},requested=String(cfg.squad||state.squadCode);if(isSuperAdmin()&&requested&&requested!==state.squadCode&&(['all',...Object.keys(state.squads)].includes(requested))){await selectSquad(requested);}else renderPresentation();});
    window.addEventListener('soften:presentation-heartbeat',e=>persistPresentationHeartbeat(e.detail||{}));
    $('#presentationPlaylistSelect')?.addEventListener('change',e=>selectPresentationPlaylist(e.target.value));
    $('#presentationPlaylistNewBtn')?.addEventListener('click',newPresentationPlaylistDraft);
    $('#presentationPlaylistLoadBtn')?.addEventListener('click',loadSelectedPresentationPlaylist);
    $('#presentationPlaylistSaveBtn')?.addEventListener('click',savePresentationPlaylist);
    $('#presentationPlaylistDeleteBtn')?.addEventListener('click',deletePresentationPlaylist);
    $('#presentationMonitorRefreshBtn')?.addEventListener('click',()=>ensurePresentationOpsLoaded(true));
    $('#presentationCreateDeviceBtn')?.addEventListener('click',createPresentationDevice);
    $('#presentationDeviceRows')?.addEventListener('click',handlePresentationDeviceAction);
    $('#createUserForm').addEventListener('submit',handleCreateUser);
    $('#newUserRole').addEventListener('change',syncCreateUserFields);
    $('#editUserForm').addEventListener('submit',handleEditUser);
    $('#editUserRole').addEventListener('change',()=>{syncEditUserFields();state.editPermissionDraft={};renderPermissionEditor($('#editUserRole').value);});
    $('#editUserSquad').addEventListener('change',syncEditUserFields);
    $('#userSearchInput').addEventListener('input',renderUserRows);
    $('#userRoleFilter').addEventListener('change',renderUserRows);
    $('#chooseFileBtn').addEventListener('click',()=>$('#csvInput').click());
    $('#csvInput').addEventListener('change',handleCsvFile);
    $('#confirmCsvImportBtn').addEventListener('click',confirmCsvImport);
    if($('#csvMonthSelect'))$('#csvMonthSelect').addEventListener('change',renderImportPreview);
    if($('#csvScopeSelect'))$('#csvScopeSelect').addEventListener('change',refreshPendingCsvForScope);
    bindImportDropzone($('#importDropzone'),{openFirst:false});
    bindImportDropzone($('#importCenterDropzone'),{openFirst:true});
    if($('#refreshImportHistoryBtn'))$('#refreshImportHistoryBtn').addEventListener('click',()=>ensureImportHistoryLoaded(true));
    if($('#undoLastImportBtn'))$('#undoLastImportBtn').addEventListener('click',undoLastImport);
    $('#saveMonthlyMetricsBtn').addEventListener('click',saveMonthlyMetrics);
    if($('#saveFinanceBtn'))$('#saveFinanceBtn').addEventListener('click',saveFinanceConfiguration);
    if($('#saveFinanceTechniciansBtn'))$('#saveFinanceTechniciansBtn').addEventListener('click',saveFinanceTechnicians);
    if($('#copyFinanceRulesBtn'))$('#copyFinanceRulesBtn').addEventListener('click',copyFinanceRulesFromPreviousMonth);
    if($('#exportFinanceExcelBtn'))$('#exportFinanceExcelBtn').addEventListener('click',exportFinanceExcel);
    if($('#exportFinancePdfBtn'))$('#exportFinancePdfBtn').addEventListener('click',exportFinancePdf);
    if($('#saveSuperAdminCommissionBtn'))$('#saveSuperAdminCommissionBtn').addEventListener('click',saveSuperAdminCommission);
    if($('#financeModelSquad'))$('#financeModelSquad').addEventListener('change',previewFinanceModelChange);
    if($('#financeModelIndividual'))$('#financeModelIndividual').addEventListener('change',previewFinanceModelChange);
    if($('#financeCompareToggle'))$('#financeCompareToggle').addEventListener('change',previewFinanceModelChange);
    if($('#financeTechnicianCompareToggle'))$('#financeTechnicianCompareToggle').addEventListener('change',previewFinanceModelChange);
    if($('#financeIndividualCap'))$('#financeIndividualCap').addEventListener('change',previewFinanceModelChange);
    if($('#financeSimulatorTech'))$('#financeSimulatorTech').addEventListener('change',()=>loadFinanceSimulatorDefaults(currentMonth(),$('#financeSimulatorTech').value));
    if($('#runFinanceSimulationBtn'))$('#runFinanceSimulationBtn').addEventListener('click',runFinanceSimulation);
    if($('#resetFinanceSimulationBtn'))$('#resetFinanceSimulationBtn').addEventListener('click',()=>loadFinanceSimulatorDefaults(currentMonth(),$('#financeSimulatorTech')?.value,true));
    if($('#refreshFinanceMemoryBtn'))$('#refreshFinanceMemoryBtn').addEventListener('click',()=>ensureFinanceMemoryLoaded(currentMonth(),true));
    if($('#recordFinanceMemoryBtn'))$('#recordFinanceMemoryBtn').addEventListener('click',()=>recordFinanceCalculationMemory(currentMonth(),'manual_snapshot',{notify:true}));
    if($('#businessCalendarYearSelect'))$('#businessCalendarYearSelect').addEventListener('change',e=>{state.businessCalendarYear=Number(e.target.value)||new Date().getFullYear();state.businessCalendarDraft=null;renderBusinessCalendar(currentMonth());});
    if($('#businessCalendarAddBtn'))$('#businessCalendarAddBtn').addEventListener('click',addBusinessCalendarDraftRow);
    if($('#businessCalendarRestoreNationalBtn'))$('#businessCalendarRestoreNationalBtn').addEventListener('click',restoreBusinessCalendarNationalDefaults);
    if($('#businessCalendarSaveBtn'))$('#businessCalendarSaveBtn').addEventListener('click',saveBusinessCalendar);
    if($('#businessCalendarRows'))$('#businessCalendarRows').addEventListener('change',e=>{if(!e.target.closest('[data-calendar-field]'))return;syncBusinessCalendarDraftFromDom();renderBusinessCalendar(currentMonth());});
    if($('#businessCalendarRows'))$('#businessCalendarRows').addEventListener('click',e=>{const btn=e.target.closest('[data-calendar-remove]');if(btn)removeBusinessCalendarDraftRow(btn.dataset.calendarRemove);});
    if($('#supportCostMonthSelect'))$('#supportCostMonthSelect').addEventListener('change',e=>{state.supportCostMonthId=e.target.value;renderSupportCosts();});
    if($('#copyPreviousSupportCostsBtn'))$('#copyPreviousSupportCostsBtn').addEventListener('click',copyPreviousSupportCosts);
    if($('#saveSupportCostsBtn'))$('#saveSupportCostsBtn').addEventListener('click',saveSupportCosts);
    ['#supportPayrollCost','#supportOtherCosts','#supportTechnicianCount','#supportHoursPerDay'].forEach(sel=>{if($(sel))$(sel).addEventListener('input',updateSupportCostPreview)});
    if($('#financialImpactMonthSelect'))$('#financialImpactMonthSelect').addEventListener('change',e=>{state.financialImpactMonthId=e.target.value;renderFinancialImpactIndicators();});
    if($('#financialImpactActiveClients'))$('#financialImpactActiveClients').addEventListener('input',updateFinancialImpactPreview);
    if($('#financialImpactAvgTicket'))$('#financialImpactAvgTicket').addEventListener('input',updateFinancialImpactPreview);
    if($('#importFinancialQualityCsvBtn'))$('#importFinancialQualityCsvBtn').addEventListener('click',()=>$('#financialQualityCsvInput')?.click());
    if($('#financialQualityCsvInput'))$('#financialQualityCsvInput').addEventListener('change',handleFinancialQualityCsvFile);
    if($('#saveFinancialImpactParamsBtn'))$('#saveFinancialImpactParamsBtn').addEventListener('click',saveFinancialImpactParameters);
    $('#copyPreviousGoalsBtn').addEventListener('click',copyGoalsFromPreviousMonth);
    $('#saveScoreSettingsBtn').addEventListener('click',saveScoreSettings);
    $$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.dataset.close==='themeModal'?cancelThemeEditor():closeModal(b.dataset.close)));
    if($('#saveThemeChangesBtn'))$('#saveThemeChangesBtn').addEventListener('click',saveThemeEditor);
    if($('#cancelThemeChangesBtn'))$('#cancelThemeChangesBtn').addEventListener('click',cancelThemeEditor);
    if($('#confirmDialogConfirm'))$('#confirmDialogConfirm').addEventListener('click',()=>settleConfirmDialog(true));
    if($('#confirmDialogCancel'))$('#confirmDialogCancel').addEventListener('click',()=>settleConfirmDialog(false));
    if($('#confirmDialogClose'))$('#confirmDialogClose').addEventListener('click',()=>settleConfirmDialog(false));
    if($('#confirmDialogPhraseInput')){$('#confirmDialogPhraseInput').addEventListener('input',syncConfirmDialogRequirement);$('#confirmDialogPhraseInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('#confirmDialogConfirm')?.disabled){e.preventDefault();settleConfirmDialog(true)}});}
    $$('.modal').forEach(m=>{
      let backdropDown=false;
      m.addEventListener('pointerdown',e=>{backdropDown=e.target===m;});
      m.addEventListener('pointerup',e=>{
        const staticBackdrop=m.dataset.staticBackdrop==='true';
        if(!staticBackdrop&&backdropDown&&e.target===m){if(m.id==='themeModal')cancelThemeEditor();else closeModal(m.id);}
        backdropDown=false;
      });
      m.addEventListener('pointercancel',()=>{backdropDown=false});
    });
    $$('[data-color-mode-toggle]').forEach(b=>b.addEventListener('click',toggleColorMode));
    $$('[data-theme-edit-mode]').forEach(b=>b.addEventListener('click',()=>applyColorMode(b.dataset.themeEditMode,{persist:true,reapplyTheme:true})));
    $$('.preset').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.theme)));
    $('#accentColor').addEventListener('input',e=>{if(!isAdmin())return;setThemePaletteColor('accent',e.target.value);state.theme.name='Personalizado';state.theme.preset='custom';syncThemeColorText();markThemeEditorDirty();updateThemeName();});
    $('#secondaryColor').addEventListener('input',e=>{if(!isAdmin())return;setThemePaletteColor('secondary',e.target.value);state.theme.name='Personalizado';state.theme.preset='custom';syncThemeColorText();markThemeEditorDirty();updateThemeName();});
    if($('#accentColorText'))$('#accentColorText').addEventListener('change',e=>applyThemeHexInput('accent',e.target));
    if($('#secondaryColorText'))$('#secondaryColorText').addEventListener('change',e=>applyThemeHexInput('secondary',e.target));
    if($('#chooseBackgroundBtn'))$('#chooseBackgroundBtn').addEventListener('click',()=>$('#backgroundFile')?.click());
    $('#backgroundFile').addEventListener('change',handleBackground);
    if($('#chooseFaviconBtn'))$('#chooseFaviconBtn').addEventListener('click',()=>$('#faviconFile')?.click());
    if($('#faviconFile'))$('#faviconFile').addEventListener('change',handleFavicon);
    if($('#resetFavicon'))$('#resetFavicon').addEventListener('click',resetFavicon);
    if($('#chooseSoundtrackBtn'))$('#chooseSoundtrackBtn').addEventListener('click',()=>$('#soundtrackFile')?.click());
    if($('#soundtrackFile'))$('#soundtrackFile').addEventListener('change',handleSoundtrackFile);
    if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').addEventListener('click',previewThemeSoundtrack);
    if($('#resetSoundtrack'))$('#resetSoundtrack').addEventListener('click',resetSoundtrack);
    if($('#removeSoundtrack'))$('#removeSoundtrack').addEventListener('click',removeSoundtrack);
    if($('#soundtrackNameInput'))$('#soundtrackNameInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.soundtrackName=e.target.value.trim()||DEFAULT_SOUNDTRACK_NAME;state.theme.preset='custom';markThemeEditorDirty();syncSoundPlayerUi();});
    if($('#soundtrackDefaultVolume')){$('#soundtrackDefaultVolume').addEventListener('input',e=>{if(!isAdmin())return;const v=clamp(safe(e.target.value)/100,0,1);state.theme.soundtrackVolume=v;if($('#soundtrackDefaultVolumeLabel'))$('#soundtrackDefaultVolumeLabel').textContent=`${Math.round(v*100)}%`;});$('#soundtrackDefaultVolume').addEventListener('change',()=>{if(!isAdmin())return;state.theme.preset='custom';markThemeEditorDirty();});}
    if($('#soundToggleBtn'))$('#soundToggleBtn').addEventListener('click',toggleSoundPlayback);
    if($('#soundMuteBtn'))$('#soundMuteBtn').addEventListener('click',toggleSoundMute);
    if($('#soundVolume'))$('#soundVolume').addEventListener('input',handleSoundVolume);
    if($('#soundEnterOn'))$('#soundEnterOn').addEventListener('click',()=>chooseSoundWelcome(true));
    if($('#soundEnterOff'))$('#soundEnterOff').addEventListener('click',()=>chooseSoundWelcome(false));
    $('#campaignNameInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.campaignTitle=e.target.value;state.theme.name=e.target.value||'Personalizado';state.theme.preset='custom';markThemeEditorDirty();applyTheme(state.theme,{remember:false});});
    $('#campaignTaglineInput').addEventListener('input',e=>{if(!isAdmin())return;state.theme.campaignTagline=e.target.value;state.theme.preset='custom';markThemeEditorDirty();applyTheme(state.theme,{remember:false});});
    $('#saveGoalsBtn').addEventListener('click',saveTeamGoals);
    $('#autoGoalBtn').addEventListener('click',useAutomaticTeamGoal);
    $('#importThemeBtn').addEventListener('click',()=>{if(canEditAppearance())$('#themeJsonInput').click();else toast('Selecione um Squad específico ou use Todos os Squads como Administrador.')});
    $('#themeJsonInput').addEventListener('change',handleThemeJson);
    $('#exportThemeBtn').addEventListener('click',exportTheme);
    $('#removeBg').addEventListener('click',()=>{if(!isAdmin())return;state.theme.background=null;state.theme.preset='custom';applyTheme(state.theme,{remember:false});markThemeEditorDirty('Fundo removido na prévia. Salve o tema para confirmar.');toast('Fundo removido da prévia.');});
    [
      ['analysisStartDate','analysisStartDatePicker','start'],
      ['analysisEndDate','analysisEndDatePicker','end'],
      ['indicatorStartDate','indicatorStartDatePicker','start'],
      ['indicatorEndDate','indicatorEndDatePicker','end']
    ].forEach(([textId,pickerId,which])=>bindAnalysisDateField(textId,pickerId,which));
    $$('[data-analysis-preset]').forEach(btn=>btn.addEventListener('click',()=>setAnalysisPreset(btn.dataset.analysisPreset)));
    bindAnalysisPeriodPicker();
    bindFilterDrawer();
    if($('#openAllTechniciansChartBtn'))$('#openAllTechniciansChartBtn').addEventListener('click',()=>openAllTechniciansChart('indicator'));
    if($('#openAllTechniciansChartTeamBtn'))$('#openAllTechniciansChartTeamBtn').addEventListener('click',()=>openAllTechniciansChart('team'));
    if($('#openDailyTechniciansChartBtn'))$('#openDailyTechniciansChartBtn').addEventListener('click',openDailyTechniciansChart);
    $$('[data-indicator-section]').forEach(btn=>btn.addEventListener('click',()=>setIndicatorSection(btn.dataset.indicatorSection)));
    if($('#businessDaysBaseMonth'))$('#businessDaysBaseMonth').addEventListener('change',e=>{state.businessDaysBaseId=e.target.value;state.businessDaysCutoff=null;renderIndicators();});
    if($('#businessDaysCompareCount'))$('#businessDaysCompareCount').addEventListener('change',e=>{state.businessDaysCompareCount=Math.max(2,safe(e.target.value)||6);renderIndicators();});
    if($('#businessDaysCutoff'))$('#businessDaysCutoff').addEventListener('change',e=>{state.businessDaysCutoff=Math.max(1,safe(e.target.value)||1);renderIndicators();});
    if($('#businessDaysLowType'))$('#businessDaysLowType').addEventListener('change',e=>{state.businessDaysLowType=['service','product','company'].includes(e.target.value)?e.target.value:'service';renderIndicators();});
    if($('#qualityReconciliationRows'))$('#qualityReconciliationRows').addEventListener('click',e=>{const btn=e.target.closest('[data-reconcile-id]');if(btn)openReconciliationDetail(btn.dataset.reconcileId);});
    if($('#adminReconciliationRows'))$('#adminReconciliationRows').addEventListener('click',e=>{const btn=e.target.closest('[data-reconcile-id]');if(btn)openReconciliationDetail(btn.dataset.reconcileId);});
    if($('#allTechniciansMetric'))$('#allTechniciansMetric').addEventListener('change',e=>{state.allTechniciansMetric=e.target.value;renderAllTechniciansFullscreenChart(state.allTechniciansRangeIds);});
    if($('#dailyTechniciansMetric'))$('#dailyTechniciansMetric').addEventListener('change',e=>{state.dailyTechniciansMetric=e.target.value;renderDailyTechniciansFullscreenChart();});
    if($('#generateSquadFeedbacksBtn'))$('#generateSquadFeedbacksBtn').addEventListener('click',generateSquadFeedbacks);
    if($('#regenerateSquadFeedbacksBtn'))$('#regenerateSquadFeedbacksBtn').addEventListener('click',regenerateSquadFeedbacks);
    if($('#feedbackRegenerateBtn'))$('#feedbackRegenerateBtn').addEventListener('click',()=>regenerateSingleFeedback(state.feedbackEditor?.t?.name));
    if($('#feedbackSaveDraftBtn'))$('#feedbackSaveDraftBtn').addEventListener('click',()=>saveFeedbackEditor('draft'));
    if($('#feedbackFinalizeBtn'))$('#feedbackFinalizeBtn').addEventListener('click',()=>saveFeedbackEditor('finalized'));
    if($('#saveChartPrefsBtn'))$('#saveChartPrefsBtn').addEventListener('click',saveChartPreferences);
    if($('#resetChartPrefsBtn'))$('#resetChartPrefsBtn').addEventListener('click',resetChartPreferences);
    if($('#appearanceScopeSelect'))$('#appearanceScopeSelect').addEventListener('change',e=>{state.appearanceScope=e.target.value==='all'&&isSuperAdmin()?'all':'squad';renderAdmin();});
    ['#systemFontSelect','#chartLabelDensity','#chartScaleMode','#chartScaleMinInput','#chartScaleMaxInput','#chartLabelFontInput','#chartAxisFontInput','#chartLegendFontInput','#chartHeightInput','#chartCardPaddingInput','#chartLineWidthInput','#chartPointRadiusInput'].forEach(sel=>{if($(sel))$(sel).addEventListener('input',previewChartPreferences)});
    let allTechResizeTimer=null;window.addEventListener('resize',()=>{const monthlyOpen=$('#allTechniciansModal')?.classList.contains('open'),dailyOpen=$('#dailyTechniciansModal')?.classList.contains('open');if(!monthlyOpen&&!dailyOpen)return;clearTimeout(allTechResizeTimer);allTechResizeTimer=setTimeout(()=>{if(monthlyOpen)renderAllTechniciansFullscreenChart(state.allTechniciansRangeIds);if(dailyOpen)renderDailyTechniciansFullscreenChart();},120);});
  }

  async function handleLogin(e){
    e.preventDefault(); state.performanceLoginStartedAt=performance.now(); $('#loginError').textContent='';
    const email=$('#loginEmail').value.trim().toLowerCase(), password=$('#loginPassword').value;
    const btn=$('.login-submit'); btn.disabled=true; btn.textContent='Entrando...';
    try{
      if((window.APP_CONFIG?.mode||'demo')==='supabase'){
        const {data,error}=await state.supabase.auth.signInWithPassword({email,password}); if(error)throw error; await enterSupabaseSession(data.user,{allowCache:false});
      }else{
        const u=allDemoUsers().find(x=>String(x.email).toLowerCase()===email&&x.password===password); if(!u)throw new Error('E-mail ou senha inválidos.'); sessionStorage.setItem('squadDemoSession',JSON.stringify({email:u.email})); await enterApp({...u});
      }
    }catch(err){$('#loginError').textContent=humanAuthError(err);}finally{btn.disabled=false;btn.textContent='Entrar';}
  }
  function humanAuthError(err){
    const m=String(err?.message||err||'');
    if(/invalid login|invalid.*credential/i.test(m))return'E-mail ou senha inválidos.';
    if(/email not confirmed/i.test(m))return'Confirme seu e-mail antes de entrar.';
    if(/rate limit/i.test(m))return'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    return m||'Não foi possível entrar.';
  }
  function authRedirectUrl(){return window.location.origin+window.location.pathname;}
  async function handleForgotPassword(){
    $('#loginError').textContent='';
    const email=$('#loginEmail').value.trim().toLowerCase();
    if(!email){$('#loginError').textContent='Informe seu e-mail primeiro.';$('#loginEmail').focus();return;}
    if((window.APP_CONFIG?.mode||'demo')!=='supabase'){$('#loginError').textContent='A recuperação de senha fica disponível no modo Supabase.';return;}
    const btn=$('#forgotPasswordBtn');btn.disabled=true;btn.textContent='Enviando...';
    try{
      const {error}=await state.supabase.auth.resetPasswordForEmail(email,{redirectTo:authRedirectUrl()});
      if(error)throw error;
      $('#loginError').classList.add('success');
      $('#loginError').textContent='E-mail de recuperação enviado. Abra o link neste mesmo navegador.';
    }catch(err){$('#loginError').classList.remove('success');$('#loginError').textContent=humanAuthError(err)}
    finally{btn.disabled=false;btn.textContent='Esqueci minha senha';}
  }
  async function handleRecoveryPassword(e){
    e.preventDefault();
    const p1=$('#recoveryPassword').value,p2=$('#recoveryPasswordConfirm').value,errEl=$('#recoveryError');errEl.textContent='';
    if(p1.length<8){errEl.textContent='A senha precisa ter pelo menos 8 caracteres.';return;}
    if(p1!==p2){errEl.textContent='As senhas não conferem.';return;}
    const btn=$('#recoverySubmit');btn.disabled=true;btn.textContent='Salvando...';
    try{
      const {data,error}=await state.supabase.auth.updateUser({password:p1});if(error)throw error;
      state.recoveryMode=false;closeModal('recoveryModal');
      window.history.replaceState({},document.title,authRedirectUrl());
      $('#loginError').classList.add('success');$('#loginError').textContent='Senha alterada com sucesso. Entrando...';
      if(data?.user) await enterSupabaseSession(data.user,{allowCache:false}); else {const {data:sess}=await state.supabase.auth.getSession();if(sess?.session?.user)await enterSupabaseSession(sess.session.user,{allowCache:false});}
    }catch(err){errEl.textContent=humanAuthError(err)}
    finally{btn.disabled=false;btn.textContent='Salvar nova senha';}
  }
  function showLogin(message=''){ hideBoot();$('#loginScreen').classList.remove('hidden');$('#appShell').classList.add('hidden');if(message)$('#loginError').textContent=message; }
  async function logout(){
    closeGlobalSearch();stopThemeAudio();clearInterval(state.notificationRefreshTimer);state.notificationRefreshTimer=null;const cacheScope=performanceScope();clearPerformanceCacheScope(cacheScope);clearPerformanceCacheScope('initial');if(state.supabase) await state.supabase.auth.signOut();sessionStorage.removeItem('squadDemoSession');state.user=null;state.backgroundHydrationStarted=false;showLogin();
  }

  async function enterApp(user){
    const canonicalRole=normalizeAccessRole(user?.role);state.user={...user,role:canonicalRole,squadCode:canonicalRole==='super_admin'?null:(user?.squadCode||null),permissions:canonicalRole==='super_admin'?{}:(user?.permissions||{})};loadUserUiPreferences(state.user);
    state.dataPromises={};state.orgOverviewLoaded=false;state.orgOverviewLoading=null;state.superAdminCommissionsLoaded=false;state.superAdminCommissionsLoading=null;state.backgroundHydrationStarted=false;setDataLoadIndicator(false);
    state.userDirectoryLoaded=false;state.userDirectory=[];state.auditLogs=[];state.auditLoaded=false;state.auditLoading=false;state.auditError=null;state.internalNotifications=[];state.notificationReadIds=[];state.notificationsLoaded=false;state.notificationsLoading=false;state.notificationsRemoteAvailable=true;state.notificationsError='';state.notificationPopoverOpen=false;state.notificationFilters={status:'all',source:'all',severity:'all',category:'all',search:''};state.gameRankingCache={};state.gameRankingLoading={};state.feedbackCache={};state.feedbackLoading={};state.feedbackEditor=null;state.myFeedbacks=null;state.myFeedbackLoading=false;state.supportCostMonthId=null;state.supportCostCache={};state.supportCostLoading={};state.financialImpactMonthId=null;state.financialImpactCache={};state.financialImpactLoaded=false;state.financialImpactLoading=null;state.presentationPlaylists=[];state.presentationDevices=[];state.presentationOpsLoaded=false;state.presentationOpsLoading=null;state.presentationOpsRemote=true;state.presentationPlaylistSelectedId=null;state.presentationRouteDevice=null;state.presentationRoutePlaylist=null;state.presentationRouteConfigSignature='';
    state.businessCalendarRows=[];state.businessCalendarLoaded=false;state.businessCalendarLoading=null;state.businessCalendarRemoteAvailable=true;state.businessCalendarYear=new Date().getFullYear();state.businessCalendarDraft=null;
    await ensureBusinessCalendarLoaded(false);
    if(PRESENTATION_ROUTE.enabled)await preparePresentationRouteContext();
    const requestedPresentationSquad=PRESENTATION_ROUTE.enabled?String(PRESENTATION_ROUTE.squad||'').toUpperCase():'';
    if(PRESENTATION_ROUTE.enabled){
      if(user.role==='super_admin')state.squadCode=requestedPresentationSquad==='ALL'?'all':(state.squads[requestedPresentationSquad]?requestedPresentationSquad:'all');
      else state.squadCode=user.squadCode||'D';
      state.currentView='presentation';
    }else{
      state.squadCode=user.role==='super_admin'?'D':(user.squadCode||'D');
      state.currentView='home';
    }
    if(state.squadCode==='all'){
      state.currentId=null;state.techName='';state.theme=loadCachedTheme()||state.theme||BOOT_FALLBACK_THEME;applyTheme(state.theme);
    }else{
      rememberLastSquad(state.squadCode);chooseLatestMonth();chooseDefaultTech();
      if(state.supabase){try{await ensureSquadTheme(state.squadCode,{force:false,apply:false})}catch(err){console.warn('Tema do Squad indisponível durante a entrada; usando cache local.',err)}}
      state.theme=resolveLegacyTheme(state.squads[state.squadCode]?.theme||loadThemeForSquad(state.squadCode));applyTheme(state.theme);
    }
    if((window.APP_CONFIG?.mode||'demo')==='demo'){state.orgOverview=buildOrgOverviewFromState();state.orgTechnicianOverview=buildOrgTechnicianOverviewFromState();state.orgDailyOverview=buildOrgDailyOverviewFromState();state.orgTechnicianDailyOverview=buildOrgTechnicianDailyOverviewFromState();}
    resetAnalysisRange(true);
    applyPermissions();applyNavigationPreferences();refreshSelectors();render();
    if(!PRESENTATION_ROUTE.enabled)await restorePersistentRoute(readNavigationRoute(window.location),{canonicalize:true});
    hideBoot();$('#loginScreen').classList.add('hidden');$('#appShell').classList.remove('hidden');
    refreshCurrentUserAvatarUrl().catch(err=>console.warn('Avatar indisponível; usando iniciais.',err));
    if(PRESENTATION_ROUTE.enabled){window.SoftenPresentation?.setDirectMode(true);if($('#presentationExitDirectBtn'))$('#presentationExitDirectBtn').classList.remove('hidden');showView('presentation',null,{history:'none'});}
    else{window.SoftenPresentation?.setDirectMode(false);updateBreadcrumbs();}
    initializeThemeAudio();
    ensureNotificationsLoaded(false).catch(()=>{});
    clearInterval(state.notificationRefreshTimer);state.notificationRefreshTimer=setInterval(()=>ensureNotificationsLoaded(true).catch(()=>{}),60000);
    clearInterval(state.presentationMonitorTimer);state.presentationMonitorTimer=setInterval(()=>{if(state.currentView==='settings'&&state.settingsModule==='presentation'&&isAdmin())ensurePresentationOpsLoaded(true);},30000);
  }
  function applyPermissions(){
    const admin=isAdmin(), superAdmin=isSuperAdmin();
    $$('.admin-only').forEach(el=>el.classList.toggle('hidden',!admin));
    $$('.super-only').forEach(el=>el.classList.toggle('hidden',!superAdmin));
    $$('.tech-only').forEach(el=>el.classList.toggle('hidden',!isTechnician()));
    $$('.admin-help').forEach(el=>el.classList.toggle('hidden',!admin));
    $$('.super-help').forEach(el=>el.classList.toggle('hidden',!superAdmin));
    $$('[data-permission]').forEach(el=>{const allowed=hasPermission(el.dataset.permission);el.classList.toggle('permission-hidden',!allowed);if('disabled' in el)el.disabled=!allowed;});
    if($('#operationNavBtn'))$('#operationNavBtn').classList.toggle('permission-hidden',!(hasPermission('data.import')||hasPermission('goals.manage')||hasPermission('month.manage')));
    const permissionButtons={
      'data.import':['#adminImportBtn','#adminQualityImportBtn','#qualityImportBtn','#confirmCsvImportBtn','#undoLastImportBtn'],
      'goals.manage':['#saveGoalsBtn','#autoGoalBtn','#saveMonthlyMetricsBtn','#saveScoreSettingsBtn','#copyPreviousGoalsBtn'],
      'finance.manage':['#saveFinanceBtn','#saveFinanceTechniciansBtn','#copyFinanceRulesBtn','#saveSuperAdminCommissionBtn','#businessCalendarAddBtn','#businessCalendarRestoreNationalBtn','#businessCalendarSaveBtn'],
      'costs.view':['#saveSupportCostsBtn','#copyPreviousSupportCostsBtn'],
      'feedback.manage':['#generateSquadFeedbacksBtn','#regenerateSquadFeedbacksBtn','#feedbackSaveDraftBtn','#feedbackFinalizeBtn','#feedbackRegenerateBtn'],
      'appearance.manage':['#adminThemeBtn','#importThemeBtn','#exportThemeBtn','#saveChartPrefsBtn','#resetChartPrefsBtn','#removeBg'],
      'presentation.manage':['#presentationApplyConfigBtn','#presentationResetConfigBtn','#presentationPlaylistSaveBtn','#presentationPlaylistDeleteBtn','#presentationCreateDeviceBtn'],
      'notifications.manage':['#newNotificationBtn','#notificationPublishBtn']
    };
    for(const [permission,selectors] of Object.entries(permissionButtons))for(const selector of selectors){const el=$(selector);if(el)el.disabled=!hasPermission(permission);}
    syncTopFiltersForView(state.currentView,state.adminSection);
    syncAnalysisDateControls();
    if($('#topUserName'))$('#topUserName').textContent=state.user.fullName;
    if($('#topUserScope'))$('#topUserScope').textContent=isAdmin()?'Acesso administrativo':`Squad ${state.user.squadCode}`;
    renderUserAvatar($('#topAvatar'),state.user);
    refreshNotificationBadges();
  }
  function isTechnician(){return state.user?.role==='technician'}
  function isAdmin(){return normalizeAccessRole(state.user?.role)==='super_admin'}
  function isSuperAdmin(){return isAdmin()}
  function roleLabel(r){return normalizeAccessRole(r)==='super_admin'?'Administrador':'Técnico'}

  const DEMO_AUDIT_KEY='softenPerformanceAuditV1';
  function auditSquadId(code=state.squadCode){return code&&code!=='all'?(state.squads?.[code]?.dbId||null):null}
  function loadDemoAuditLogs(){try{const rows=JSON.parse(localStorage.getItem(DEMO_AUDIT_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch(e){return[]}}
  function saveDemoAuditLogs(rows){try{localStorage.setItem(DEMO_AUDIT_KEY,JSON.stringify((rows||[]).slice(0,500)))}catch(e){console.warn('Não foi possível persistir a auditoria demo.',e)}}
  async function logAuditEvent(action,{entityType='system',entityId=null,squadId=undefined,description='',beforeData={},afterData={},metadata={}}={}){
    if(!isAdmin())return false;
    const resolvedSquadId=squadId===undefined?auditSquadId():squadId;
    const before=sanitizeAuditValue(beforeData??{}),after=sanitizeAuditValue(afterData??{}),meta=sanitizeAuditValue(metadata??{});
    if(state.supabase){
      try{
        const {error}=await state.supabase.rpc('log_audit_event',{p_action:String(action||''),p_entity_type:String(entityType||'system'),p_entity_id:entityId==null?null:String(entityId),p_squad_id:resolvedSquadId||null,p_description:description||null,p_before_data:before,p_after_data:after,p_metadata:meta});
        if(error)throw error;state.auditLoaded=false;state.auditError=null;return true;
      }catch(err){state.auditError=String(err?.message||err||'Auditoria indisponível.');console.warn('A operação foi concluída, mas o registro de auditoria não pôde ser gravado.',err);return false;}
    }
    const row={id:`demo-audit-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,organization_id:state.user?.organizationId||'demo',squad_id:resolvedSquadId||null,squadCode:state.squadCode==='all'?null:state.squadCode,actor_user_id:state.user?.userId||state.user?.email||'demo',actor_name:state.user?.fullName||'Usuário',actor_email:state.user?.email||'',actor_role:state.user?.role||'',action:String(action||''),entity_type:String(entityType||'system'),entity_id:entityId==null?null:String(entityId),description:description||'',before_data:before,after_data:after,metadata:meta,created_at:new Date().toISOString()};
    const rows=[row,...loadDemoAuditLogs()].slice(0,500);saveDemoAuditLogs(rows);state.auditLogs=rows;state.auditLoaded=true;state.auditError=null;return true;
  }
  async function loadAuditLogs(force=false){
    if(!isAdmin())return[];if(state.auditLoaded&&!force)return state.auditLogs;if(state.auditLoading)return state.auditLogs;state.auditLoading=true;state.auditError=null;
    try{
      if(state.supabase){
        const {data,error}=await state.supabase.from('audit_logs').select('id,organization_id,squad_id,actor_user_id,actor_name,actor_email,actor_role,action,entity_type,entity_id,description,before_data,after_data,metadata,created_at,squads(code,name)').eq('organization_id',state.user.organizationId).order('created_at',{ascending:false}).limit(250);
        if(error)throw error;state.auditLogs=(data||[]).map(r=>{const sq=firstRelation(r.squads);return{...r,squadCode:sq?.code||null,squadName:sq?.name||null}});
      }else state.auditLogs=loadDemoAuditLogs();
      state.auditLoaded=true;return state.auditLogs;
    }catch(err){state.auditError=String(err?.message||err||'Não foi possível carregar a auditoria.');console.error(err);return[];}finally{state.auditLoading=false;}
  }
  function auditDetailsJson(row){const payload={antes:row.before_data||{},depois:row.after_data||{},metadados:row.metadata||{}};return JSON.stringify(payload,null,2)}
  function renderAuditRows(){
    const body=$('#auditRows');if(!body)return;const search=String($('#auditSearchInput')?.value||'').trim().toLowerCase(),category=$('#auditCategoryFilter')?.value||'all';let rows=[...(state.auditLogs||[])];
    if(category!=='all')rows=rows.filter(r=>actionCategory(r.action)===category);
    if(search)rows=rows.filter(r=>[r.actor_name,r.actor_email,r.action,actionLabel(r.action),r.entity_type,r.entity_id,r.description,r.squadCode,JSON.stringify(r.metadata||{})].some(v=>String(v||'').toLowerCase().includes(search)));
    if($('#auditCountLabel'))$('#auditCountLabel').textContent=`${rows.length} ${rows.length===1?'registro':'registros'}`;
    if(state.auditError){$('#auditStatus').textContent='Auditoria indisponível. Execute a migração V2.29.8 no Supabase e atualize a tela.';body.innerHTML='<tr><td colspan="5"><div class="audit-empty">Não foi possível consultar os registros de auditoria.</div></td></tr>';return;}
    $('#auditStatus').textContent=state.supabase?'Exibindo até 250 ações mais recentes dentro do seu escopo de acesso.':'Modo demonstração: os registros ficam somente neste navegador.';
    body.innerHTML=rows.length?rows.map(r=>`<tr><td><strong>${escapeHtml(formatDateTime(r.created_at))}</strong></td><td><div class="audit-actor"><strong>${escapeHtml(r.actor_name||'Usuário')}</strong><small>${escapeHtml(roleLabel(r.actor_role||''))}${r.actor_email?` • ${escapeHtml(r.actor_email)}`:''}</small></div></td><td><span class="audit-action-pill">${escapeHtml(actionLabel(r.action))}</span><small class="metric-sub">${escapeHtml(r.action||'')}</small></td><td><div class="audit-scope"><strong>${r.squadCode?`Squad ${escapeHtml(r.squadCode)}`:'Organização'}</strong><small>${escapeHtml(r.entity_type||'')} ${r.entity_id?`• ${escapeHtml(r.entity_id)}`:''}</small></div></td><td><div class="audit-detail"><span>${escapeHtml(r.description||actionLabel(r.action))}</span><details><summary>Ver antes / depois</summary><pre class="audit-json">${escapeHtml(auditDetailsJson(r))}</pre></details></div></td></tr>`).join(''):'<tr><td colspan="5"><div class="audit-empty">Nenhuma ação encontrada para este filtro.</div></td></tr>';
  }
  async function renderAuditLogView(force=false){if(!isAdmin())return;if($('#auditScopeText'))$('#auditScopeText').textContent=isSuperAdmin()?'Você visualiza a auditoria de toda a organização.':`Você visualiza apenas as ações administrativas do Squad ${state.user.squadCode}.`;if($('#auditStatus'))$('#auditStatus').textContent='Carregando auditoria...';await loadAuditLogs(force);renderAuditRows();}

  function currentSquad(){return state.squadCode==='all'?null:state.squads[state.squadCode]}
  function currentMonths(){return currentSquad()?.months||{}}
  function currentMonth(){return currentMonths()[state.currentId]||null}
  function currentTech(){const m=currentMonth();if(!m)return null;return m.technicians.find(t=>samePersonName(t.name,state.techName))||m.technicians[0]||null}
  function chooseLatestMonth(){const ids=Object.keys(currentMonths()).sort().reverse();state.currentId=ids[0]||null}
  function chooseDefaultTech(){const m=currentMonth();if(!m){state.techName='';return}if(isTechnician()){const own=m.technicians.find(t=>samePersonName(t.name,state.user.techName));state.techName=own?.name||state.user.techName||m.technicians[0]?.name||'';return}if(!m.technicians.some(t=>samePersonName(t.name,state.techName)))state.techName=m.technicians[0]?.name||''}


  function isoDateParts(year,month,day){return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`}
  function parseIsoAnalysisDate(value){const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return Number.isNaN(d.getTime())?null:d}
  function isoToBrDate(value){const d=parseIsoAnalysisDate(value);return d?`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`:''}
  function maskBrDate(value){const digits=String(value||'').replace(/\D/g,'').slice(0,8);if(digits.length<=2)return digits;if(digits.length<=4)return `${digits.slice(0,2)}/${digits.slice(2)}`;return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`}
  function brDateToIso(value){const m=String(value||'').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return null;const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]),d=new Date(year,month-1,day);if(d.getFullYear()!==year||d.getMonth()!==month-1||d.getDate()!==day)return null;return isoDateParts(year,month,day)}
  function setDateFieldError(textId,message=''){const field=$(`[data-date-field="${textId}"]`),error=$('#'+textId+'Error'),input=$('#'+textId);if(field)field.classList.toggle('invalid',!!message);if(input)input.setAttribute('aria-invalid',message?'true':'false');if(error)error.textContent=message}

  // V2.48.11 — calendário próprio do Design System. O valor continua passando
  // por handleAnalysisDateInput(), preservando a mesma lógica, URL e filtros.
  const analysisCalendarUi={root:null,textId:'',which:'',anchor:null,viewYear:0,viewMonth:0,min:'',max:''};
  const analysisPeriodUi={open:false,anchor:null,target:'state',draftStart:null,draftEnd:null,draftPreset:'custom',draftMode:'competence',draftCompetenceId:null,viewYear:0,viewMonth:0,min:'',max:''};
  const filterDrawerUi={open:false,draft:null};
  const analysisCalendarMonths=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const analysisCalendarWeekdays=['D','S','T','Q','Q','S','S'];
  function calendarMonthIntersectsBounds(year,month,min,max){const first=isoDateParts(year,month,1),last=isoDateParts(year,month,new Date(year,month,0).getDate());return(!min||last>=min)&&(!max||first<=max)}
  function ensureAnalysisCalendar(){
    if(analysisCalendarUi.root?.isConnected)return analysisCalendarUi.root;
    const root=document.createElement('div');root.id='analysisDateCalendar';root.className='ds-calendar-popover hidden';root.setAttribute('role','dialog');root.setAttribute('aria-modal','false');root.setAttribute('aria-label','Selecionar data');document.body.appendChild(root);analysisCalendarUi.root=root;
    root.addEventListener('click',event=>{
      const nav=event.target.closest('[data-calendar-nav]');if(nav){event.preventDefault();const delta=nav.dataset.calendarNav==='prev'?-1:1;let y=analysisCalendarUi.viewYear,m=analysisCalendarUi.viewMonth+delta;if(m<1){m=12;y--}if(m>12){m=1;y++}if(calendarMonthIntersectsBounds(y,m,analysisCalendarUi.min,analysisCalendarUi.max)){analysisCalendarUi.viewYear=y;analysisCalendarUi.viewMonth=m;renderAnalysisCalendar();}return}
      const day=event.target.closest('[data-calendar-date]');if(day&&!day.disabled){event.preventDefault();const value=day.dataset.calendarDate;closeAnalysisCalendar();setDateFieldError(analysisCalendarUi.textId);handleAnalysisDateInput(analysisCalendarUi.which,value);return}
      const today=event.target.closest('[data-calendar-today]');if(today&&!today.disabled){event.preventDefault();const value=today.dataset.calendarToday;closeAnalysisCalendar();setDateFieldError(analysisCalendarUi.textId);handleAnalysisDateInput(analysisCalendarUi.which,value);return}
      if(event.target.closest('[data-calendar-close]')){event.preventDefault();closeAnalysisCalendar();analysisCalendarUi.anchor?.focus();}
    });
    document.addEventListener('pointerdown',event=>{if(root.classList.contains('hidden'))return;if(root.contains(event.target)||analysisCalendarUi.anchor?.contains?.(event.target))return;closeAnalysisCalendar();},true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!root.classList.contains('hidden')){event.preventDefault();const anchor=analysisCalendarUi.anchor;closeAnalysisCalendar();anchor?.focus();}},true);
    window.addEventListener('resize',()=>{if(!root.classList.contains('hidden'))positionAnalysisCalendar()},{passive:true});
    window.addEventListener('scroll',()=>{if(!root.classList.contains('hidden'))closeAnalysisCalendar()},{passive:true,capture:true});
    return root;
  }
  function closeAnalysisCalendar(){const root=analysisCalendarUi.root;if(root)root.classList.add('hidden');if(analysisCalendarUi.anchor)analysisCalendarUi.anchor.setAttribute('aria-expanded','false');}
  function positionAnalysisCalendar(){const root=analysisCalendarUi.root,anchor=analysisCalendarUi.anchor;if(!root||!anchor)return;const rect=anchor.getBoundingClientRect(),margin=10,width=Math.min(310,window.innerWidth-margin*2);root.style.width=`${width}px`;root.style.left='0px';root.style.top='0px';const height=Math.max(330,root.offsetHeight||0),below=window.innerHeight-rect.bottom-margin,above=rect.top-margin,openUp=below<Math.min(height,360)&&above>below;let top=openUp?Math.max(margin,rect.top-height-8):Math.min(window.innerHeight-height-margin,rect.bottom+8);top=Math.max(margin,top);let left=Math.min(Math.max(margin,rect.right-width),Math.max(margin,window.innerWidth-width-margin));root.style.left=`${left}px`;root.style.top=`${top}px`;root.classList.toggle('open-up',openUp);}
  function renderAnalysisCalendar(){
    const root=ensureAnalysisCalendar(),y=analysisCalendarUi.viewYear,m=analysisCalendarUi.viewMonth,min=analysisCalendarUi.min,max=analysisCalendarUi.max;
    const selected=analysisCalendarUi.which==='start'?state.analysisStartDate:state.analysisEndDate,rangeStart=state.analysisStartDate||'',rangeEnd=state.analysisEndDate||'',today=localIsoDate(new Date()),days=new Date(y,m,0).getDate(),firstDow=new Date(y,m-1,1).getDay();
    const prevM=m===1?12:m-1,prevY=m===1?y-1:y,nextM=m===12?1:m+1,nextY=m===12?y+1:y;
    const prevDisabled=!calendarMonthIntersectsBounds(prevY,prevM,min,max),nextDisabled=!calendarMonthIntersectsBounds(nextY,nextM,min,max);
    const title=analysisCalendarUi.which==='start'?'Data inicial':'Data final';
    let cells='';for(let i=0;i<firstDow;i++)cells+='<span class="ds-calendar-empty" aria-hidden="true"></span>';
    for(let day=1;day<=days;day++){const iso=isoDateParts(y,m,day),disabled=(min&&iso<min)||(max&&iso>max),classes=['ds-calendar-day'];if(iso===selected)classes.push('selected');if(iso===today)classes.push('today');if(rangeStart&&rangeEnd&&iso>=rangeStart&&iso<=rangeEnd)classes.push('in-range');if(iso===rangeStart)classes.push('range-start');if(iso===rangeEnd)classes.push('range-end');const label=new Date(y,m-1,day).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});cells+=`<button type="button" class="${classes.join(' ')}" data-calendar-date="${iso}" ${disabled?'disabled':''} aria-label="${label}" ${iso===selected?'aria-current="date"':''}>${day}</button>`;}
    const todayAllowed=(!min||today>=min)&&(!max||today<=max);
    root.innerHTML=`<div class="ds-calendar-head"><div><small>${title}</small><strong>${analysisCalendarMonths[m-1]} ${y}</strong></div><div class="ds-calendar-nav"><button type="button" data-calendar-nav="prev" ${prevDisabled?'disabled':''} aria-label="Mês anterior">‹</button><button type="button" data-calendar-nav="next" ${nextDisabled?'disabled':''} aria-label="Próximo mês">›</button></div></div><div class="ds-calendar-weekdays">${analysisCalendarWeekdays.map(x=>`<span>${x}</span>`).join('')}</div><div class="ds-calendar-grid">${cells}</div><div class="ds-calendar-foot"><button type="button" class="ds-calendar-link" data-calendar-today="${today}" ${todayAllowed?'':'disabled'}>Hoje</button><button type="button" class="ds-calendar-link" data-calendar-close>Fechar</button></div>`;
    requestAnimationFrame(positionAnalysisCalendar);
  }
  function openAnalysisCalendar(textId,which,anchor){
    const bounds=importedDateBounds(),current=which==='start'?state.analysisStartDate:state.analysisEndDate;let focus=current||bounds.max||localIsoDate(new Date());if(bounds.min&&focus<bounds.min)focus=bounds.min;if(bounds.max&&focus>bounds.max)focus=bounds.max;const d=parseIsoAnalysisDate(focus)||new Date();
    analysisCalendarUi.textId=textId;analysisCalendarUi.which=which;analysisCalendarUi.anchor=anchor;analysisCalendarUi.viewYear=d.getFullYear();analysisCalendarUi.viewMonth=d.getMonth()+1;analysisCalendarUi.min=bounds.min||'';analysisCalendarUi.max=bounds.max||'';
    const root=ensureAnalysisCalendar();root.classList.remove('hidden');anchor?.setAttribute('aria-expanded','true');renderAnalysisCalendar();
  }
  function commitAnalysisTextDate(textId,which){const input=$('#'+textId);if(!input)return false;const iso=brDateToIso(input.value);if(!iso){setDateFieldError(textId,'Informe uma data válida.');return false}setDateFieldError(textId);handleAnalysisDateInput(which,iso);return true}
  function bindAnalysisDateField(textId,pickerId,which){const input=$('#'+textId),picker=$('#'+pickerId),button=$(`[data-date-picker-for="${textId}"]`);if(!input)return;input.addEventListener('input',()=>{input.value=maskBrDate(input.value);setDateFieldError(textId)});input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitAnalysisTextDate(textId,which)}else if(e.key==='Escape'){e.preventDefault();closeAnalysisCalendar();syncAnalysisDateControls();input.blur()}});input.addEventListener('blur',()=>{if(input.value.trim())commitAnalysisTextDate(textId,which);else syncAnalysisDateControls()});if(picker)picker.value=which==='start'?(state.analysisStartDate||''):(state.analysisEndDate||'');if(button){button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openAnalysisCalendar(textId,which,button)});}}
  function localIsoDate(d){return isoDateParts(d.getFullYear(),d.getMonth()+1,d.getDate())}
  function monthIdForDate(value){const d=parseIsoAnalysisDate(value);return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`:null}
  function addCalendarDays(value,delta){const d=parseIsoAnalysisDate(value);if(!d)return value;d.setDate(d.getDate()+delta);return localIsoDate(d)}
  function dateBetween(value,start=state.analysisStartDate,end=state.analysisEndDate){return !!value&&(!start||value>=start)&&(!end||value<=end)}
  function analysisScopeSquads(){return state.squadCode==='all'?Object.values(state.squads||{}).filter(Boolean):(currentSquad()?[currentSquad()]:[])}
  function importedDateBounds(squads=analysisScopeSquads()){
    let min=null,max=null;
    for(const squad of squads||[]){for(const m of Object.values(squad?.months||{})){if(!m)continue;const last=Math.max(1,Math.min(safe(m.latestDay)||1,new Date(m.year,m.month,0).getDate()));const start=isoDateParts(m.year,m.month,1),end=isoDateParts(m.year,m.month,last);if(!min||start<min)min=start;if(!max||end>max)max=end;}}
    return{min,max};
  }
  function currentCalendarMonthLatest(bounds=importedDateBounds()){
    if(!bounds.max)return null;const now=new Date(),currentId=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    let latest=null;for(const squad of analysisScopeSquads()){const m=squad?.months?.[currentId];if(!m)continue;const d=isoDateParts(m.year,m.month,Math.max(1,safe(m.latestDay)||1));if(!latest||d>latest)latest=d;}
    return latest||bounds.max;
  }
  function competenceBounds(id,target='state'){
    const match=String(id||'').match(/^(\d{4})-(\d{2})$/);if(!match)return{min:null,max:null,id:null,isClosed:false,months:[]};
    const year=Number(match[1]),month=Number(match[2]),scope=periodScopeSquads(target),months=(scope||[]).map(s=>s?.months?.[id]).filter(Boolean);if(!months.length)return{min:null,max:null,id,year,month,isClosed:false,months:[]};
    const lastCalendarDay=new Date(year,month,0).getDate(),latest=Math.max(...months.map(m=>Math.max(1,Math.min(lastCalendarDay,safe(m.latestDay)||lastCalendarDay))));
    return{min:isoDateParts(year,month,1),max:isoDateParts(year,month,latest),id,year,month,isClosed:months.every(m=>!!m.isClosed),months};
  }
  function competenceIdsForPeriodTarget(target='state'){
    if(target==='drawer'&&filterDrawerUi.draft?.squad)return competenceIdsForSquad(filterDrawerUi.draft.squad);
    return competenceIdsForSquad();
  }
  function defaultCompetencePreset(id,target='state'){const meta=competenceBounds(id,target);return meta.isClosed?'month':'to-date';}
  function competencePresetRange(id,preset='month',target='state'){
    const meta=competenceBounds(id,target);if(!meta.min||!meta.max)return{start:null,end:null,preset,id};let start=meta.min,end=meta.max,resolved=preset||'month';
    const maxDay=parseIsoAnalysisDate(meta.max)?.getDate()||1;
    if(resolved==='to-date'){
      const today=localIsoDate(new Date());end=today<meta.min?meta.min:(today<meta.max?today:meta.max);
    }else if(resolved==='first-half')end=isoDateParts(meta.year,meta.month,Math.min(15,maxDay));
    else if(resolved==='second-half'){
      if(maxDay<16){start=meta.min;end=meta.max;resolved=defaultCompetencePreset(id,target);}else start=isoDateParts(meta.year,meta.month,16);
    }else if(resolved!=='custom')resolved='month';
    return{start,end,preset:resolved,id};
  }
  function detectCompetencePreset(id,start,end,target='state'){
    for(const preset of ['month','to-date','first-half','second-half']){const range=competencePresetRange(id,preset,target);if(range.start===start&&range.end===end)return range.preset;}
    return'custom';
  }
  function syncAnalysisModeFromRange({mode=null,competenceId=null}={}){
    const start=state.analysisStartDate,end=state.analysisEndDate;if(!start||!end)return;
    const ids=analysisMonthIds(),endId=monthIdForDate(end),resolvedId=competenceId||endId||state.currentId;
    state.analysisMode=mode||(ids.length>1?'free':'competence');state.analysisCompetenceId=resolvedId||null;
    if(state.analysisMode==='competence'&&resolvedId)state.analysisPreset=detectCompetencePreset(resolvedId,start,end,'state');
    else if(state.analysisMode==='free')state.analysisPreset='custom';
  }
  function resetAnalysisRange(force=false){
    const bounds=importedDateBounds();if(!bounds.max){state.analysisStartDate=null;state.analysisEndDate=null;state.analysisCompetenceId=null;syncAnalysisDateControls();return;}
    if(!force&&state.analysisStartDate&&state.analysisEndDate)return;
    const end=currentCalendarMonthLatest(bounds)||bounds.max,id=monthIdForDate(end),preset=defaultCompetencePreset(id,'state'),range=competencePresetRange(id,preset,'state');
    state.analysisStartDate=range.start||bounds.min;state.analysisEndDate=range.end||end;state.analysisPreset=range.preset||preset;state.analysisMode='competence';state.analysisCompetenceId=id;syncCurrentMonthToAnalysisEnd();syncAnalysisDateControls();
  }
  function clampRangeToBounds(start,end,bounds=importedDateBounds()){
    if(!bounds.max)return{start:null,end:null};let s=start||bounds.min,e=end||bounds.max;if(s<bounds.min)s=bounds.min;if(e>bounds.max)e=bounds.max;if(s>e)s=e;return{start:s,end:e};
  }
  function clampAnalysisRange(start,end){return clampRangeToBounds(start,end,importedDateBounds());}
  function syncCurrentMonthToAnalysisEnd(){
    if(state.squadCode==='all'||!state.analysisEndDate)return;const id=state.analysisMode==='competence'&&state.analysisCompetenceId?state.analysisCompetenceId:monthIdForDate(state.analysisEndDate);if(id&&currentMonths()[id]){state.currentId=id;chooseDefaultTech();}
  }
  function shortDateNoYear(value){const d=parseIsoAnalysisDate(value);return d?`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`:'';}
  function analysisRangeCompactLabel(start=state.analysisStartDate,end=state.analysisEndDate){
    if(!start||!end)return'Sem período';const a=isoToBrDate(start),b=isoToBrDate(end);return start===end?a:`${a} — ${b}`;
  }
  function analysisCompetenceLabel(id=state.analysisCompetenceId||state.currentId){const meta=competenceMeta(id);return meta?`${meta.monthName} ${meta.year}`:monthLabelFromId(id||'');}
  function analysisScopeCount(start=state.analysisStartDate,end=state.analysisEndDate){
    if(!start||!end)return 0;const a=parseIsoAnalysisDate(start),b=parseIsoAnalysisDate(end);if(!a||!b)return 0;return((b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth())+1);
  }
  function analysisUnifiedLabel(start=state.analysisStartDate,end=state.analysisEndDate,mode=state.analysisMode,competenceId=state.analysisCompetenceId,preset=state.analysisPreset){
    if(!start||!end)return'Sem período';
    if(mode==='competence'){
      const id=competenceId||monthIdForDate(end),label=analysisCompetenceLabel(id)||monthLabelFromId(id),cut={month:'Mês completo','to-date':'Até hoje','first-half':'1ª quinzena','second-half':'2ª quinzena'}[preset];
      return `${label} · ${cut||`${shortDateNoYear(start)}–${shortDateNoYear(end)}`}`;
    }
    const count=analysisScopeCount(start,end);return `${shortDateNoYear(start)}–${shortDateNoYear(end)} · ${count} ${count===1?'competência':'competências'}`;
  }
  function syncAnalysisDateControls(){
    const bounds=importedDateBounds();
    [['analysisStartDate','analysisStartDatePicker'],['indicatorStartDate','indicatorStartDatePicker']].forEach(([textId,pickerId])=>{const text=$('#'+textId),picker=$('#'+pickerId);if(text)text.value=isoToBrDate(state.analysisStartDate);if(picker){picker.value=state.analysisStartDate||'';picker.dataset.min=bounds.min||'';picker.dataset.max=bounds.max||'';}setDateFieldError(textId);});
    [['analysisEndDate','analysisEndDatePicker'],['indicatorEndDate','indicatorEndDatePicker']].forEach(([textId,pickerId])=>{const text=$('#'+textId),picker=$('#'+pickerId);if(text)text.value=isoToBrDate(state.analysisEndDate);if(picker){picker.value=state.analysisEndDate||'';picker.dataset.min=bounds.min||'';picker.dataset.max=bounds.max||'';}setDateFieldError(textId);});
    const label=analysisUnifiedLabel();if($('#analysisPeriodValue'))$('#analysisPeriodValue').textContent=label;if($('#mobilePeriodValue')&&!filterDrawerUi.open)$('#mobilePeriodValue').textContent=label;
    $$('[data-analysis-preset]').forEach(b=>b.classList.toggle('active',b.dataset.analysisPreset===state.analysisPreset));
    if(analysisPeriodUi.open&&analysisPeriodUi.target==='state')renderAnalysisPeriodPicker();
  }
  function commitAnalysisRange(start,end,preset='custom',{mode=null,competenceId=null}={}){
    const next=clampAnalysisRange(start,end);state.analysisStartDate=next.start;state.analysisEndDate=next.end;state.analysisPreset=preset||'custom';syncAnalysisModeFromRange({mode,competenceId});syncCurrentMonthToAnalysisEnd();refreshSelectors();syncAnalysisDateControls();render();if(state.supabase&&state.currentView!=='home')hydrateCurrentViewAsync(state.currentView,state.adminSection);syncPersistentUrl({replace:true});
  }
  function handleAnalysisDateInput(which,value){
    const next=clampAnalysisRange(which==='start'?value:state.analysisStartDate,which==='end'?value:state.analysisEndDate);commitAnalysisRange(next.start,next.end,'custom',{mode:analysisScopeCount(next.start,next.end)>1?'free':'competence',competenceId:monthIdForDate(next.end)});
  }
  // Compatibilidade com atalhos legados/rotas antigas. O seletor visual V2.49.1
  // usa competencePresetRange() e o modo intervalo livre.
  function analysisPresetRange(preset,bounds=importedDateBounds(),scopeSquads=analysisScopeSquads()){
    if(!bounds.max)return{start:null,end:null,preset};let end=bounds.max,start=end,resolved=preset;
    if(preset==='today'){const today=localIsoDate(new Date());end=today<bounds.min?bounds.min:today>bounds.max?bounds.max:today;start=end;}
    else if(preset==='7d'){start=addCalendarDays(end,-6);}
    else if(preset==='15d'){start=addCalendarDays(end,-14);}
    else if(preset==='prev-month'){const d=parseIsoAnalysisDate(end);d.setDate(1);d.setMonth(d.getMonth()-1);const y=d.getFullYear(),m=d.getMonth()+1,id=`${y}-${String(m).padStart(2,'0')}`;let last=new Date(y,m,0).getDate();const latestDays=(scopeSquads||[]).map(s=>safe(s.months?.[id]?.latestDay)).filter(Boolean);if(latestDays.length)last=Math.max(...latestDays);start=isoDateParts(y,m,1);end=isoDateParts(y,m,last);}
    else {const d=parseIsoAnalysisDate(end);start=isoDateParts(d.getFullYear(),d.getMonth()+1,1);resolved='month';}
    const next=clampRangeToBounds(start,end,bounds);return{start:next.start,end:next.end,preset:resolved};
  }
  function setAnalysisPreset(preset){const next=analysisPresetRange(preset);if(next.start&&next.end)commitAnalysisRange(next.start,next.end,next.preset,{mode:'free'});}

  function analysisRangeLabel(){if(!state.analysisStartDate||!state.analysisEndDate)return'Sem período';const a=parseIsoAnalysisDate(state.analysisStartDate),b=parseIsoAnalysisDate(state.analysisEndDate),fmt=d=>d.toLocaleDateString('pt-BR');return state.analysisStartDate===state.analysisEndDate?fmt(a):`${fmt(a)} até ${fmt(b)}`;}

  function periodScopeSquads(target='state'){if(target==='drawer'&&filterDrawerUi.draft?.squad){const code=filterDrawerUi.draft.squad;return code==='all'?Object.values(state.squads||{}):[state.squads?.[code]].filter(Boolean);}return analysisScopeSquads();}
  function periodBoundsForTarget(target='state'){return importedDateBounds(periodScopeSquads(target));}
  function pickerSource(target='state'){
    if(target==='drawer'&&filterDrawerUi.draft)return filterDrawerUi.draft;
    return{start:state.analysisStartDate,end:state.analysisEndDate,preset:state.analysisPreset,mode:state.analysisMode,competenceId:state.analysisCompetenceId||state.currentId};
  }
  function closeAnalysisPeriodPicker({restoreFocus=false}={}){
    const root=$('#analysisPeriodPopover');if(root)root.classList.add('hidden');analysisPeriodUi.open=false;analysisPeriodUi.anchor?.setAttribute('aria-expanded','false');if(restoreFocus)analysisPeriodUi.anchor?.focus?.();
  }
  function positionAnalysisPeriodPicker(){const root=$('#analysisPeriodPopover'),anchor=analysisPeriodUi.anchor;if(!root||!anchor||root.classList.contains('hidden'))return;const margin=10,rect=anchor.getBoundingClientRect();root.style.left='0px';root.style.top='0px';const width=Math.min(720,window.innerWidth-margin*2);root.style.width=`${width}px`;const height=Math.max(520,root.offsetHeight||0),below=window.innerHeight-rect.bottom-margin,above=rect.top-margin,openUp=below<Math.min(height,570)&&above>below;let top=openUp?Math.max(margin,rect.top-height-8):Math.min(window.innerHeight-height-margin,rect.bottom+8);let left=Math.min(Math.max(margin,rect.left),Math.max(margin,window.innerWidth-width-margin));root.style.left=`${left}px`;root.style.top=`${Math.max(margin,top)}px`;root.classList.toggle('open-up',openUp);}
  function configurePickerBounds(){
    const global=periodBoundsForTarget(analysisPeriodUi.target),comp=analysisPeriodUi.draftMode==='competence'?competenceBounds(analysisPeriodUi.draftCompetenceId,analysisPeriodUi.target):null;
    analysisPeriodUi.min=comp?.min||global.min||'';analysisPeriodUi.max=comp?.max||global.max||'';
  }
  function setPickerDraftFromCompetence(id,preset=null){
    if(!id)return;analysisPeriodUi.draftMode='competence';analysisPeriodUi.draftCompetenceId=id;const resolved=preset||defaultCompetencePreset(id,analysisPeriodUi.target),next=competencePresetRange(id,resolved,analysisPeriodUi.target);analysisPeriodUi.draftStart=next.start;analysisPeriodUi.draftEnd=next.end;analysisPeriodUi.draftPreset=next.preset;configurePickerBounds();const focus=parseIsoAnalysisDate(next.end||next.start);if(focus){analysisPeriodUi.viewYear=focus.getFullYear();analysisPeriodUi.viewMonth=focus.getMonth()+1;}
  }
  function openAnalysisPeriodPicker(anchor,target='state'){
    const bounds=periodBoundsForTarget(target),source=pickerSource(target);if(!bounds.max)return toast('Não há datas importadas para este escopo.');
    const ids=competenceIdsForPeriodTarget(target),sourceStart=source.start||bounds.min,sourceEnd=source.end||bounds.max,sourceCount=analysisScopeCount(sourceStart,sourceEnd),sourceCompetence=source.competenceId||source.month||monthIdForDate(sourceEnd)||ids[0];
    analysisPeriodUi.open=true;analysisPeriodUi.anchor=anchor;analysisPeriodUi.target=target;analysisPeriodUi.draftMode=source.mode||(sourceCount>1?'free':'competence');analysisPeriodUi.draftCompetenceId=ids.includes(sourceCompetence)?sourceCompetence:(ids.includes(monthIdForDate(sourceEnd))?monthIdForDate(sourceEnd):ids[0]||null);analysisPeriodUi.draftStart=sourceStart;analysisPeriodUi.draftEnd=sourceEnd;analysisPeriodUi.draftPreset=source.preset||'custom';
    if(analysisPeriodUi.draftMode==='competence'){
      const cb=competenceBounds(analysisPeriodUi.draftCompetenceId,target);if(!cb.min||sourceStart<cb.min||sourceEnd>cb.max)setPickerDraftFromCompetence(analysisPeriodUi.draftCompetenceId);else{analysisPeriodUi.draftPreset=detectCompetencePreset(analysisPeriodUi.draftCompetenceId,sourceStart,sourceEnd,target);configurePickerBounds();}
    }else configurePickerBounds();
    const focus=parseIsoAnalysisDate(analysisPeriodUi.draftEnd||analysisPeriodUi.draftStart||bounds.max);analysisPeriodUi.viewYear=focus.getFullYear();analysisPeriodUi.viewMonth=focus.getMonth()+1;$('#analysisPeriodPopover')?.classList.remove('hidden');anchor?.setAttribute('aria-expanded','true');renderAnalysisPeriodPicker();requestAnimationFrame(positionAnalysisPeriodPicker);
  }
  function periodDraftContains(iso){const s=analysisPeriodUi.draftStart,e=analysisPeriodUi.draftEnd;return!!(s&&e&&iso>=s&&iso<=e);}
  function pickerScopeText(start=analysisPeriodUi.draftStart,end=analysisPeriodUi.draftEnd){const count=analysisScopeCount(start,end);if(!count)return'—';return`${count} ${count===1?'competência':'competências'}`;}
  function renderAnalysisPeriodPicker(){
    const root=$('#analysisPeriodPopover');if(!root||!analysisPeriodUi.open)return;configurePickerBounds();const y=analysisPeriodUi.viewYear,m=analysisPeriodUi.viewMonth,days=new Date(y,m,0).getDate(),firstDow=new Date(y,m-1,1).getDay(),today=localIsoDate(new Date()),mode=analysisPeriodUi.draftMode;
    $$('[data-period-mode]').forEach(b=>{const active=b.dataset.periodMode===mode;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
    $('#periodCompetencePanel')?.classList.toggle('hidden',mode!=='competence');$('#periodCompetenceCuts')?.classList.toggle('hidden',mode!=='competence');$('#periodFreePanel')?.classList.toggle('hidden',mode!=='free');
    const ids=competenceIdsForPeriodTarget(analysisPeriodUi.target),select=$('#periodCompetenceSelect');if(select){
      const squadKey=analysisPeriodUi.target==='drawer'?(filterDrawerUi.draft?.squad||''):(state.squadCode||''),optionsKey=`${analysisPeriodUi.target}|${squadKey}|${ids.join(',')}`;
      if(select.dataset.optionsKey!==optionsKey){select.innerHTML=ids.map(id=>{const meta=competenceMeta(id,analysisPeriodUi.target==='drawer'?filterDrawerUi.draft?.squad:state.squadCode),cb=competenceBounds(id,analysisPeriodUi.target),closed=cb.isClosed?' • Fechado':'';return`<option value="${id}">${escapeHtml(meta?.monthName||monthLabelFromId(id).split(' ')[0])} ${escapeHtml(meta?.year||id.slice(0,4))}${closed}</option>`;}).join('');select.dataset.optionsKey=optionsKey;}
      select.disabled=!ids.length;if(ids.includes(analysisPeriodUi.draftCompetenceId))select.value=analysisPeriodUi.draftCompetenceId;window.SoftenDesignSystem?.syncSelects?.({rebuild:true});
    }
    if(mode==='competence'){
      const cb=competenceBounds(analysisPeriodUi.draftCompetenceId,analysisPeriodUi.target);if($('#periodCompetenceStatus'))$('#periodCompetenceStatus').textContent=cb.isClosed?'Competência fechada':'Competência em andamento';
      $$('[data-competence-cut]').forEach(b=>{const cut=b.dataset.competenceCut;b.classList.toggle('active',cut===analysisPeriodUi.draftPreset);b.disabled=cut==='second-half'&&parseIsoAnalysisDate(cb.max)?.getDate()<16;});
    }else if($('#periodFreeScope'))$('#periodFreeScope').textContent=pickerScopeText();
    if($('#periodPickerMonth'))$('#periodPickerMonth').textContent=`${analysisCalendarMonths[m-1]} ${y}`;
    if($('#periodPickerStart'))$('#periodPickerStart').textContent=analysisPeriodUi.draftStart?isoToBrDate(analysisPeriodUi.draftStart):'Selecione';
    if($('#periodPickerEnd'))$('#periodPickerEnd').textContent=analysisPeriodUi.draftEnd?isoToBrDate(analysisPeriodUi.draftEnd):'Selecione';
    const summary=analysisPeriodUi.draftStart&&analysisPeriodUi.draftEnd?analysisUnifiedLabel(analysisPeriodUi.draftStart,analysisPeriodUi.draftEnd,mode,analysisPeriodUi.draftCompetenceId,analysisPeriodUi.draftPreset):'Escolha a data final';if($('#periodPickerSummary'))$('#periodPickerSummary').textContent=summary;
    if($('#periodPickerSelectionNote'))$('#periodPickerSelectionNote').textContent=mode==='competence'?'Recorte aplicado somente dentro da competência selecionada.':`Abrangência: ${pickerScopeText()}. Metas mensais são proporcionadas por competência.`;
    let html='';for(let i=0;i<firstDow;i++)html+='<span class="period-picker-empty" aria-hidden="true"></span>';
    for(let d=1;d<=days;d++){const iso=isoDateParts(y,m,d),disabled=(analysisPeriodUi.min&&iso<analysisPeriodUi.min)||(analysisPeriodUi.max&&iso>analysisPeriodUi.max),selected=iso===analysisPeriodUi.draftStart||iso===analysisPeriodUi.draftEnd,cls=['period-picker-day'];if(periodDraftContains(iso))cls.push('in-range');if(iso===analysisPeriodUi.draftStart)cls.push('range-start');if(iso===analysisPeriodUi.draftEnd)cls.push('range-end');if(selected)cls.push('selected');if(iso===today)cls.push('today');html+=`<button type="button" class="${cls.join(' ')}" data-period-date="${iso}" ${disabled?'disabled':''}>${d}</button>`;}
    if($('#periodPickerGrid'))$('#periodPickerGrid').innerHTML=html;if($('#periodPickerApply'))$('#periodPickerApply').disabled=!(analysisPeriodUi.draftStart&&analysisPeriodUi.draftEnd);
    const prevM=m===1?12:m-1,prevY=m===1?y-1:y,nextM=m===12?1:m+1,nextY=m===12?y+1:y,prev=$('[data-period-nav="prev"]'),next=$('[data-period-nav="next"]');if(prev)prev.disabled=!calendarMonthIntersectsBounds(prevY,prevM,analysisPeriodUi.min,analysisPeriodUi.max);if(next)next.disabled=!calendarMonthIntersectsBounds(nextY,nextM,analysisPeriodUi.min,analysisPeriodUi.max);
  }
  function choosePeriodDraftDate(iso){
    if(analysisPeriodUi.draftMode==='competence')analysisPeriodUi.draftPreset='custom';
    if(!analysisPeriodUi.draftStart||analysisPeriodUi.draftEnd){analysisPeriodUi.draftStart=iso;analysisPeriodUi.draftEnd=null;}else if(iso<analysisPeriodUi.draftStart){analysisPeriodUi.draftStart=iso;}else{analysisPeriodUi.draftEnd=iso;}if(analysisPeriodUi.draftMode==='free')analysisPeriodUi.draftPreset='custom';renderAnalysisPeriodPicker();
  }
  function applyAnalysisPeriodPicker(){
    if(!analysisPeriodUi.draftStart||!analysisPeriodUi.draftEnd)return;const payload={start:analysisPeriodUi.draftStart,end:analysisPeriodUi.draftEnd,preset:analysisPeriodUi.draftPreset||'custom',mode:analysisPeriodUi.draftMode,competenceId:analysisPeriodUi.draftCompetenceId},target=analysisPeriodUi.target;closeAnalysisPeriodPicker();
    if(target==='drawer'&&filterDrawerUi.draft){Object.assign(filterDrawerUi.draft,payload);if(payload.mode==='competence'&&payload.competenceId)filterDrawerUi.draft.month=payload.competenceId;else if(payload.end)filterDrawerUi.draft.month=monthIdForDate(payload.end);if($('#mobilePeriodValue'))$('#mobilePeriodValue').textContent=analysisUnifiedLabel(payload.start,payload.end,payload.mode,payload.competenceId,payload.preset);return;}
    commitAnalysisRange(payload.start,payload.end,payload.preset,{mode:payload.mode,competenceId:payload.competenceId});
  }
  function bindAnalysisPeriodPicker(){
    $('#analysisPeriodTrigger')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();analysisPeriodUi.open?closeAnalysisPeriodPicker():openAnalysisPeriodPicker(e.currentTarget,'state');});
    $('#mobilePeriodTrigger')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openAnalysisPeriodPicker(e.currentTarget,'drawer');});
    $('#periodPickerClose')?.addEventListener('click',()=>closeAnalysisPeriodPicker({restoreFocus:true}));$('#periodPickerCancel')?.addEventListener('click',()=>closeAnalysisPeriodPicker({restoreFocus:true}));$('#periodPickerApply')?.addEventListener('click',applyAnalysisPeriodPicker);
    const competenceSelect=$('#periodCompetenceSelect'),handleCompetenceSelection=e=>{const id=e.currentTarget?.value||e.target?.value;if(!id||id===analysisPeriodUi.draftCompetenceId)return;e.stopPropagation();setPickerDraftFromCompetence(id);renderAnalysisPeriodPicker();requestAnimationFrame(positionAnalysisPeriodPicker);};
    competenceSelect?.addEventListener('input',handleCompetenceSelection);competenceSelect?.addEventListener('change',handleCompetenceSelection);
    $('#analysisPeriodPopover')?.addEventListener('click',e=>{
      const modeBtn=e.target.closest('[data-period-mode]');if(modeBtn){const mode=modeBtn.dataset.periodMode;if(mode===analysisPeriodUi.draftMode)return;if(mode==='competence'){const ids=competenceIdsForPeriodTarget(analysisPeriodUi.target),id=ids.includes(monthIdForDate(analysisPeriodUi.draftEnd))?monthIdForDate(analysisPeriodUi.draftEnd):(analysisPeriodUi.draftCompetenceId||ids[0]);setPickerDraftFromCompetence(id);}else{analysisPeriodUi.draftMode='free';analysisPeriodUi.draftPreset='custom';configurePickerBounds();const bounds=periodBoundsForTarget(analysisPeriodUi.target);const range=clampRangeToBounds(analysisPeriodUi.draftStart,analysisPeriodUi.draftEnd,bounds);analysisPeriodUi.draftStart=range.start;analysisPeriodUi.draftEnd=range.end;}renderAnalysisPeriodPicker();return;}
      const cut=e.target.closest('[data-competence-cut]');if(cut&&analysisPeriodUi.draftMode==='competence'){const preset=cut.dataset.competenceCut;if(preset==='custom'){analysisPeriodUi.draftPreset='custom';analysisPeriodUi.draftStart=null;analysisPeriodUi.draftEnd=null;}else setPickerDraftFromCompetence(analysisPeriodUi.draftCompetenceId,preset);renderAnalysisPeriodPicker();return;}
      const nav=e.target.closest('[data-period-nav]');if(nav){let y=analysisPeriodUi.viewYear,m=analysisPeriodUi.viewMonth+(nav.dataset.periodNav==='prev'?-1:1);if(m<1){m=12;y--;}if(m>12){m=1;y++;}if(calendarMonthIntersectsBounds(y,m,analysisPeriodUi.min,analysisPeriodUi.max)){analysisPeriodUi.viewYear=y;analysisPeriodUi.viewMonth=m;renderAnalysisPeriodPicker();}return;}
      const day=e.target.closest('[data-period-date]');if(day&&!day.disabled)choosePeriodDraftDate(day.dataset.periodDate);
    });
    document.addEventListener('pointerdown',e=>{const root=$('#analysisPeriodPopover');if(!analysisPeriodUi.open||!root)return;const competenceProxy=document.querySelector('.ds-select-proxy[data-for-select="periodCompetenceSelect"]'),insideCompetencePortal=!!e.target?.closest?.('.ds-select-menu.ds-select-portal')&&!!competenceProxy?.classList.contains('open');if(root.contains(e.target)||analysisPeriodUi.anchor?.contains?.(e.target)||insideCompetencePortal)return;closeAnalysisPeriodPicker();},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&analysisPeriodUi.open){e.preventDefault();closeAnalysisPeriodPicker({restoreFocus:true});}},true);window.addEventListener('resize',()=>{if(analysisPeriodUi.open)positionAnalysisPeriodPicker();},{passive:true});
  }
  function cloneSelectOptions(source,target,value){if(!source||!target)return;target.innerHTML=source.innerHTML;target.disabled=source.disabled;if(value!=null)target.value=value;}
  function draftTechnicianOptions(code,month){const m=code&&code!=='all'?state.squads?.[code]?.months?.[month]:null;return(m?.technicians||[]).map(t=>t.name);}
  function syncFilterDrawer(visibility=topFilterVisibility()){
    const count=filterSystem.activeCount({view:state.currentView,adminSection:state.adminSection,settingsModule:state.settingsModule,indicatorSection:state.indicatorSection,isSuperAdmin:isSuperAdmin(),isTechnician:isTechnician(),squadCode:state.squadCode});if($('#filterDrawerCount'))$('#filterDrawerCount').textContent=count;$('#filterDrawerTrigger')?.classList.toggle('no-filters',count===0);
    const map={squad:'#mobileSquadControl',technician:'#mobileTechnicianControl'};for(const[key,sel]of Object.entries(map))$(sel)?.classList.toggle('hidden',!visibility[key]);$('#mobileCompetenceControl')?.classList.toggle('hidden',!visibility.competence||visibility.period);$('#mobilePeriodTrigger')?.classList.toggle('hidden',!visibility.period);if(!filterDrawerUi.open){cloneSelectOptions($('#squadSelect'),$('#mobileSquadSelect'),state.squadCode);cloneSelectOptions($('#monthSelect'),$('#mobileMonthSelect'),state.currentId);cloneSelectOptions($('#techSelect'),$('#mobileTechSelect'),state.techName);if($('#mobilePeriodValue'))$('#mobilePeriodValue').textContent=analysisUnifiedLabel();}
  }
  function refreshFilterDrawerDraftOptions(){
    const d=filterDrawerUi.draft;if(!d)return;const squad=$('#mobileSquadSelect'),month=$('#mobileMonthSelect'),tech=$('#mobileTechSelect');if(squad)squad.value=d.squad;const ids=competenceIdsForSquad(d.squad);if(!ids.includes(d.month))d.month=ids[0]||null;if(month){month.innerHTML=ids.length?ids.map(id=>{const mm=competenceMeta(id,d.squad);return`<option value="${id}">${escapeHtml(mm?.monthName||monthLabelFromId(id).split(' ')[0])} ${escapeHtml(mm?.year||id.slice(0,4))}</option>`}).join(''):'<option>Sem dados</option>';month.value=d.month||'';month.disabled=!ids.length;}const names=draftTechnicianOptions(d.squad,d.month);if(!names.some(n=>samePersonName(n,d.tech)))d.tech=names[0]||'';if(tech){tech.innerHTML=names.length?names.map(n=>`<option>${escapeHtml(n)}</option>`).join(''):'<option>Sem dados</option>';tech.value=d.tech||'';tech.disabled=!names.length;}if($('#mobilePeriodValue'))$('#mobilePeriodValue').textContent=analysisUnifiedLabel(d.start,d.end,d.mode||'competence',d.competenceId||d.month,d.preset||'custom');
  }
  function openFilterDrawer(){
    filterDrawerUi.open=true;filterDrawerUi.draft={squad:state.squadCode,month:state.currentId,tech:state.techName,start:state.analysisStartDate,end:state.analysisEndDate,preset:state.analysisPreset,mode:state.analysisMode,competenceId:state.analysisCompetenceId||state.currentId};$('#filterDrawer')?.classList.remove('hidden');$('#filterDrawerBackdrop')?.classList.remove('hidden');$('#filterDrawer')?.setAttribute('aria-hidden','false');$('#filterDrawerTrigger')?.setAttribute('aria-expanded','true');document.body.classList.add('filter-drawer-open');syncFilterDrawer();refreshFilterDrawerDraftOptions();
  }
  function closeFilterDrawer(){filterDrawerUi.open=false;filterDrawerUi.draft=null;$('#filterDrawer')?.classList.add('hidden');$('#filterDrawerBackdrop')?.classList.add('hidden');$('#filterDrawer')?.setAttribute('aria-hidden','true');$('#filterDrawerTrigger')?.setAttribute('aria-expanded','false');document.body.classList.remove('filter-drawer-open');syncFilterDrawer();}
  async function applyFilterDrawer(){
    const d=filterDrawerUi.draft;if(!d)return closeFilterDrawer();const visible=topFilterVisibility();state.routeApplying=true;try{if(visible.squad&&isSuperAdmin()&&d.squad&&d.squad!==state.squadCode)await selectSquad(d.squad,{history:'none'});if(visible.competence&&d.month&&competenceIdsForSquad().includes(d.month)){state.currentId=d.month;if(state.supabase&&state.squadCode!=='all'){try{await ensureMonthLoaded(state.squadCode,d.month,{silent:true});}catch(e){}}if(state.squadCode!=='all')chooseDefaultTech();}if(visible.period&&d.start&&d.end){const next=clampAnalysisRange(d.start,d.end);state.analysisStartDate=next.start;state.analysisEndDate=next.end;state.analysisPreset=d.preset||'custom';state.analysisMode=d.mode||((analysisScopeCount(next.start,next.end)>1)?'free':'competence');state.analysisCompetenceId=d.competenceId||monthIdForDate(next.end);syncAnalysisModeFromRange({mode:state.analysisMode,competenceId:state.analysisCompetenceId});syncCurrentMonthToAnalysisEnd();}if(visible.technician&&d.tech&&currentMonth()?.technicians?.some(t=>samePersonName(t.name,d.tech)))state.techName=currentMonth().technicians.find(t=>samePersonName(t.name,d.tech)).name;refreshSelectors();render();if(state.supabase&&state.currentView!=='home')hydrateCurrentViewAsync(state.currentView,state.adminSection);syncPersistentUrl({replace:true});}finally{state.routeApplying=false;}closeFilterDrawer();
  }
  function clearFilterDrawerDraft(){
    const d=filterDrawerUi.draft;if(!d)return;const visible=topFilterVisibility();if(visible.squad)d.squad=isSuperAdmin()?'all':state.squadCode;const ids=competenceIdsForSquad(d.squad);if(visible.competence)d.month=ids[0]||null;if(visible.technician)d.tech='';if(visible.period){d.mode='competence';d.competenceId=ids[0]||null;d.month=d.competenceId||d.month;const preset=defaultCompetencePreset(d.competenceId,'drawer'),range=competencePresetRange(d.competenceId,preset,'drawer');d.start=range.start;d.end=range.end;d.preset=range.preset;}refreshFilterDrawerDraftOptions();
  }
  function bindFilterDrawer(){
    $('#filterDrawerTrigger')?.addEventListener('click',openFilterDrawer);$('#filterDrawerClose')?.addEventListener('click',closeFilterDrawer);$('#filterDrawerBackdrop')?.addEventListener('click',closeFilterDrawer);$('#filterDrawerApply')?.addEventListener('click',applyFilterDrawer);$('#filterDrawerReset')?.addEventListener('click',clearFilterDrawerDraft);
    $('#mobileSquadSelect')?.addEventListener('change',e=>{if(!filterDrawerUi.draft)return;const d=filterDrawerUi.draft;d.squad=e.target.value;const ids=competenceIdsForSquad(d.squad);d.month=ids[0]||null;if(topFilterVisibility().period){d.mode='competence';d.competenceId=d.month;const preset=defaultCompetencePreset(d.competenceId,'drawer'),range=competencePresetRange(d.competenceId,preset,'drawer');d.start=range.start;d.end=range.end;d.preset=range.preset;}refreshFilterDrawerDraftOptions();});$('#mobileMonthSelect')?.addEventListener('change',e=>{if(!filterDrawerUi.draft)return;filterDrawerUi.draft.month=e.target.value;if(filterDrawerUi.draft.mode==='competence')filterDrawerUi.draft.competenceId=e.target.value;refreshFilterDrawerDraftOptions();});$('#mobileTechSelect')?.addEventListener('change',e=>{if(filterDrawerUi.draft)filterDrawerUi.draft.tech=e.target.value;});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&filterDrawerUi.open&&!analysisPeriodUi.open)closeFilterDrawer();});window.addEventListener('resize',()=>{if(window.innerWidth>760&&filterDrawerUi.open)closeFilterDrawer()},{passive:true});
  }
  function analysisMonthIds(){
    if(!state.analysisStartDate||!state.analysisEndDate)return[];const start=parseIsoAnalysisDate(state.analysisStartDate),end=parseIsoAnalysisDate(state.analysisEndDate),ids=[];const d=new Date(start.getFullYear(),start.getMonth(),1);while(d<=end){ids.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);d.setMonth(d.getMonth()+1);}return ids;
  }
  function isBusinessDateIso(value){const d=parseIsoAnalysisDate(value),dow=d?.getDay();return dow>=1&&dow<=5}
  function dailyRowsForTechnician(squad,techName,start=state.analysisStartDate,end=state.analysisEndDate){
    const out=[];if(!squad||!techName)return out;for(const id of Object.keys(squad.months||{}).sort()){const m=squad.months[id];if(!m)continue;const t=(m.technicians||[]).find(x=>samePersonName(x.name,techName));if(!t)continue;for(const d of t.daily||[]){if(safe(d.day)>safe(m.latestDay))continue;const date=isoDateParts(m.year,m.month,safe(d.day));if(!dateBetween(date,start,end))continue;out.push({date,year:m.year,month:m.month,day:safe(d.day),off:!!d.off,att:safe(d.att),notes5:safe(d.notes5),notes4:safe(d.notes4),notes3:safe(d.notes3),notes2:safe(d.notes2),notes1:safe(d.notes1)});}}
    return out.sort((a,b)=>a.date.localeCompare(b.date));
  }
  function aggregateDailyRows(rows){
    const r={att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,totalEval:0,avg:0,evalPct:0};for(const d of rows||[]){r.att+=safe(d.att);r.notes5+=safe(d.notes5);r.notes4+=safe(d.notes4);r.notes3+=safe(d.notes3);r.notes2+=safe(d.notes2);r.notes1+=safe(d.notes1);}r.totalEval=r.notes5+r.notes4+r.notes3+r.notes2+r.notes1;r.avg=r.totalEval?truncate2((r.notes5*5+r.notes4*4+r.notes3*3+r.notes2*2+r.notes1)/r.totalEval):0;r.evalPct=r.att?roundTo(r.totalEval/r.att,4):0;return r;
  }
  function technicianPeriodAggregate(squad,techName,start=state.analysisStartDate,end=state.analysisEndDate){
    const result={att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,totalEval:0,avg:0,evalPct:0,evaluationExcludedAtt:0,eligibleAtt:0,daily:[],excludeFromGroupCount:false,excludedMonths:[],countedMonths:[]};
    let activeSegments=0,countedSegments=0;
    for(const id of analysisMonthIds()){
      const m=squad?.months?.[id];if(!m)continue;const t=(m.technicians||[]).find(x=>samePersonName(x.name,techName));if(!t)continue;
      const monthStart=isoDateParts(m.year,m.month,1),monthEnd=isoDateParts(m.year,m.month,Math.max(1,safe(m.latestDay)||1));
      const from=!start||start<monthStart?monthStart:start,to=!end||end>monthEnd?monthEnd:end;if(from>to)continue;
      const fullCompetence=from===monthStart&&to===monthEnd;
      let agg;
      const rows=dailyRowsForTechnician(squad,techName,from,to);result.daily.push(...rows);
      if(fullCompetence){
        // O consolidado mensal e a fonte oficial da competencia. O diario continua anexado
        // para graficos e detalhamento, mas nao substitui N1-N5/total quando houver divergencia historica.
        // O ajuste de atendimentos sem e-mail e mensal; por isso ele so e aplicado quando o
        // recorte cobre a competencia inteira. Em periodos parciais a taxa permanece bruta.
        agg={att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1),evaluationExcludedAtt:normalizedEvaluationExcludedAtt(t)};
      }else{
        agg=aggregateDailyRows(rows);agg.evaluationExcludedAtt=0;
      }
      const totalEval=safe(agg.notes5)+safe(agg.notes4)+safe(agg.notes3)+safe(agg.notes2)+safe(agg.notes1);
      if(safe(agg.att)>0||totalEval>0){activeSegments++;if(t.excludeFromGroupCount)result.excludedMonths.push(id);else{countedSegments++;result.countedMonths.push(id)}}
      result.att+=safe(agg.att);result.notes5+=safe(agg.notes5);result.notes4+=safe(agg.notes4);result.notes3+=safe(agg.notes3);result.notes2+=safe(agg.notes2);result.notes1+=safe(agg.notes1);result.evaluationExcludedAtt+=safe(agg.evaluationExcludedAtt);
    }
    result.totalEval=result.notes5+result.notes4+result.notes3+result.notes2+result.notes1;
    result.avg=result.totalEval?truncate2((result.notes5*5+result.notes4*4+result.notes3*3+result.notes2*2+result.notes1)/result.totalEval):0;
    result.evaluationExcludedAtt=Math.min(Math.max(0,safe(result.evaluationExcludedAtt)),Math.max(0,result.att-result.totalEval));
    result.eligibleAtt=Math.max(0,result.att-result.evaluationExcludedAtt);
    result.evalPct=result.eligibleAtt?roundTo(result.totalEval/result.eligibleAtt,4):0;
    result.excludeFromGroupCount=activeSegments>0&&countedSegments===0;
    return result;
  }
  function technicianVacationMonths(squad,techName,ids=analysisMonthIds()){
    if(!squad||!techName)return[];
    return (ids||[]).filter(id=>{
      const m=squad?.months?.[id];if(!m)return false;
      const t=(m.technicians||[]).find(x=>samePersonName(x.name,techName));
      return !!t?.vacation;
    });
  }
  function vacationBadgeHtml(monthIds,{compact=false}={}){
    const ids=[...(monthIds||[])];if(!ids.length)return'';
    const title=`Férias registradas em: ${ids.map(monthLabelFromId).join(', ')}`;
    return `<span class="vacation-badge${compact?' compact':''}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">🏖${compact?'':' FÉRIAS'}</span>`;
  }
  function groupCountBadgeHtml(excluded,{compact=false}={}){
    if(!excluded)return'';const title='Competência parcial: produção e status são mantidos. O técnico não entra no divisor da Base do Squad e fica fora do desconto/redistribuição financeira.';
    return `<span class="group-count-badge${compact?' compact':''}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">${compact?'Ø':'FORA DA MÉDIA'}</span>`;
  }
  function periodTechniciansForSquad(squad,start=state.analysisStartDate,end=state.analysisEndDate){
    const ids=analysisMonthIds();
    const names=new Map();for(const id of ids){const m=squad?.months?.[id];for(const t of m?.technicians||[]){const key=nameLinkKey(t.name);if(!names.has(key))names.set(key,t.name);}}
    const rows=[...names.values()].map(name=>{const agg=technicianPeriodAggregate(squad,name,start,end),vacationMonths=technicianVacationMonths(squad,name,ids);return{name,...agg,vacationMonths,vacation:vacationMonths.length>0};}).filter(t=>safe(t.att)>0||safe(t.totalEval)>0);
    if(!rows.length)return[];const refs={...scoreRefsFromRows(rows),bonusAtt:20,bonusTotalEval:30,bonusAvg:40,bonusEvalPct:35};for(const t of rows){const scored=calculateScore(t,refs);t.periodPoints=scored.points;t.periodStatus=scored.status;t.periodGoalsHit=scored.goalsHit;t.points=scored.points;t.status=scored.status;}rows.sort((a,b)=>safe(b.periodPoints)-safe(a.periodPoints)||safe(b.att)-safe(a.att)||String(a.name).localeCompare(String(b.name),'pt-BR'));rows.forEach((t,i)=>t.periodRank=i+1);return rows;
  }
  function gameRankingCacheKey(squadCode=state.squadCode,start=state.analysisStartDate,end=state.analysisEndDate){return `${squadCode}|${start||''}|${end||''}`;}
  async function loadGameRankingForTechnician(squadCode=state.squadCode,start=state.analysisStartDate,end=state.analysisEndDate){
    if(!state.supabase||!isTechnician()||!squadCode||!start||!end)return;
    const key=gameRankingCacheKey(squadCode,start,end);if(state.gameRankingCache[key]||state.gameRankingLoading[key])return;state.gameRankingLoading[key]=true;
    try{
      const {data,error}=await state.supabase.rpc('get_my_squad_game_ranking',{p_start_date:start,p_end_date:end});if(error)throw error;
      state.gameRankingCache[key]=(data||[]).map(r=>({name:r.technician_name||'',att:safe(r.att),notes5:safe(r.notes5),notes4:safe(r.notes4),notes3:safe(r.notes3),notes2:safe(r.notes2),notes1:safe(r.notes1),totalEval:safe(r.total_eval),avg:safe(r.avg_rating),evalPct:safe(r.eval_pct),periodPoints:safe(r.points),periodStatus:String(r.status||''),periodGoalsHit:safe(r.goals_hit),periodRank:safe(r.ranking)||null,points:safe(r.points),status:String(r.status||''),excludeFromGroupCount:!!r.exclude_from_group_count}));
    }catch(err){console.warn('Ranking do game do Squad indisponível. Confira a migração V2.29.2.',err);state.gameRankingCache[key]=[];}
    finally{delete state.gameRankingLoading[key];if(state.currentView==='individual'&&state.squadCode===squadCode&&state.analysisStartDate===start&&state.analysisEndDate===end)renderIndividual();}
  }
  function gameRankingRowsForCurrentPeriod(squadCode=state.squadCode,start=state.analysisStartDate,end=state.analysisEndDate){
    if(isTechnician()&&state.supabase){const key=gameRankingCacheKey(squadCode,start,end),cached=state.gameRankingCache[key];if(cached)return cached;loadGameRankingForTechnician(squadCode,start,end);return[];}
    // Para gestores, usa a mesma rotina do ranking da equipe. Em competencias completas ela
    // prioriza o consolidado mensal; em recortes parciais usa o detalhe diario.
    return periodTechniciansForSquad(state.squads?.[squadCode],start,end);
  }
  function periodTechnicianForCurrent(){const squad=currentSquad(),name=state.techName||currentTech()?.name;return periodTechniciansForSquad(squad).find(t=>samePersonName(t.name,name))||null}
  function selectedBusinessDays(){let c=0;if(!state.analysisStartDate||!state.analysisEndDate)return 0;for(let d=state.analysisStartDate;d<=state.analysisEndDate;d=addCalendarDays(d,1))if(isBusinessDateIso(d))c++;return c}
  function periodGoalForTechnician(t,squad=currentSquad()){
    if(!t||!squad)return{att:0,notes5:0,evalPct:0};let att=0,notes5=0,evalWeighted=0,evalWeight=0;for(const id of analysisMonthIds()){const m=squad.months?.[id];if(!m)continue;const mt=(m.technicians||[]).find(x=>samePersonName(x.name,t.name));if(!mt)continue;const monthStart=isoDateParts(m.year,m.month,1),monthEnd=isoDateParts(m.year,m.month,Math.max(1,safe(m.latestDay))),from=state.analysisStartDate>monthStart?state.analysisStartDate:monthStart,to=state.analysisEndDate<monthEnd?state.analysisEndDate:monthEnd;if(from>to)continue;let days=0;for(let d=from;d<=to;d=addCalendarDays(d,1))if(isBusinessDateIso(d))days++;const totalDays=Math.max(1,businessDaysMonFri(m.year,m.month));att+=safe(mt.goalAtt)*(days/totalDays);notes5+=safe(mt.goalEval)*(days/totalDays);if(days>0){evalWeighted+=safe(teamSettings(m).teamGoalEvalPct)*days;evalWeight+=days;}}return{att,notes5,evalPct:evalWeight?evalWeighted/evalWeight:0};
  }
  function periodTeamGoal(squad){let total=0;for(const id of analysisMonthIds()){const m=squad?.months?.[id];if(!m)continue;const monthStart=isoDateParts(m.year,m.month,1),monthEnd=isoDateParts(m.year,m.month,Math.max(1,safe(m.latestDay))),from=state.analysisStartDate>monthStart?state.analysisStartDate:monthStart,to=state.analysisEndDate<monthEnd?state.analysisEndDate:monthEnd;if(from>to)continue;let days=0;for(let d=from;d<=to;d=addCalendarDays(d,1))if(isBusinessDateIso(d))days++;total+=safe(teamSettings(m).teamGoalAtt)*(days/Math.max(1,businessDaysMonFri(m.year,m.month)));}return total;}

  async function selectSquad(code,{history='replace'}={}){
    if(!isSuperAdmin())return; state.squadCode=code;
    if(code==='all'){
      state.currentId=null;state.techName='';
      // A visão consolidada preserva a identidade visual do último Squad selecionado.
      // O tema é visual e não interfere nos dados consolidados.
      applyTheme(state.theme||loadLastTheme());
      if(state.currentView==='individual')showView('team',null,{history:'none'});
    }
    else{rememberLastSquad(code);chooseLatestMonth();chooseDefaultTech();state.theme=resolveLegacyTheme(state.squads[code]?.theme||loadThemeForSquad(code));applyTheme(state.theme);}
    resetAnalysisRange(true);refreshSelectors();render();applyPermissions();updateBreadcrumbs();
    if(state.supabase&&state.currentView!=='home')hydrateCurrentViewAsync(state.currentView,state.adminSection);
    if(history!=='none')syncPersistentUrl({replace:history==='replace'});
  }
  function requireSpecificSquad(){if(state.squadCode==='all'){toast('Selecione um Squad específico primeiro.');return false}return true}

  function resetViewScroll(){
    const goTop=()=>{
      try{window.scrollTo({top:0,left:0,behavior:'auto'});}catch(e){window.scrollTo(0,0);}
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
      const main=$('.main');if(main&&main.scrollTop)main.scrollTop=0;
    };
    goTop();
    requestAnimationFrame(goTop);
  }

  function topFilterVisibility(name=state.currentView,adminSection=state.adminSection){
    return filterSystem.visibility({
      view:name,
      adminSection,
      settingsModule:state.settingsModule,
      indicatorSection:state.indicatorSection,
      isSuperAdmin:isSuperAdmin(),
      isTechnician:isTechnician(),
      squadCode:state.squadCode
    });
  }
  function syncTopFiltersForView(name=state.currentView,adminSection=state.adminSection){
    const visibility=topFilterVisibility(name,adminSection);
    if($('#squadControl'))$('#squadControl').classList.toggle('hidden',!visibility.squad);
    const monthControl=$('.month-control');if(monthControl)monthControl.classList.toggle('hidden',!visibility.competence||visibility.period);
    if($('#analysisDateControl'))$('#analysisDateControl').classList.toggle('hidden',!visibility.period);
    const technicianControl=$('.technician-control');if(technicianControl)technicianControl.classList.toggle('hidden',!visibility.technician);
    if(!visibility.period&&analysisPeriodUi.open&&analysisPeriodUi.target==='state')closeAnalysisPeriodPicker();
    const eyebrow=$('#squadEyebrow');
    if(eyebrow&&name!=='home')eyebrow.textContent=(name==='indicators'&&state.indicatorSection==='financial-impact')?'SUPORTE TÉCNICO COMPLETO':(state.squadCode==='all'?'TODOS OS SQUADS':`SQUAD ${state.squadCode}`);
    syncFilterDrawer(visibility);
    return visibility;
  }

  function showView(name,adminSection=null,{history='push'}={}){
    if((name==='admin'||name==='users'||name==='feedbacks'||name==='audit')&&!isAdmin())return;
    if(name==='my-feedbacks'&&!isTechnician())return;
    if(name==='alerts'&&!hasPermission('notifications.view'))return toast('Você não possui permissão para visualizar a Central de Alertas.');
    if(name==='indicators'&&!hasPermission('indicators.view'))return toast('Você não possui permissão para visualizar Indicadores.');
    if(name==='presentation'&&!hasPermission('presentation.view'))return toast('Você não possui permissão para visualizar a Apresentação.');
    if(name==='users'&&!hasPermission('users.manage'))return toast('Você não possui permissão para gerenciar usuários.');
    if(name==='feedbacks'&&!hasPermission('feedback.manage'))return toast('Você não possui permissão para gerenciar feedbacks.');
    if(name==='audit'&&!hasPermission('audit.view'))return toast('Você não possui permissão para visualizar a auditoria.');
    if(name==='admin'&&adminSection==='operation'&&!hasPermission('data.import')&&!hasPermission('goals.manage')&&!hasPermission('month.manage'))return toast('Você não possui permissão para administrar a operação.');
    if(name==='admin'&&adminSection==='finance'&&!hasPermission('finance.view'))return toast('Você não possui permissão para visualizar a bonificação administrativa.');
    if(name==='admin'&&adminSection==='costs'&&!hasPermission('costs.view'))return toast('Você não possui permissão para visualizar os custos.');
    if(name==='admin'&&adminSection==='appearance'&&!hasPermission('appearance.manage'))return toast('Você não possui permissão para alterar a aparência.');
    if(name==='individual'&&state.squadCode==='all')name='team';
    if(name!=='home'&&state.homeLayoutEditMode)cancelHomeLayoutEdit();
    if(name==='admin'&&adminSection)state.adminSection=adminSection;
    state.currentView=name;
    $$('.view').forEach(v=>v.classList.remove('active')); const view=$('#view-'+name);if(view)view.classList.add('active');
    $$('.nav-btn').forEach(b=>{const sameView=b.dataset.view===name;const sameSection=name!=='admin'||!b.dataset.adminSection||b.dataset.adminSection===state.adminSection;const sameSettings=name!=='settings'||(b.dataset.settingsModule?b.dataset.settingsModule===state.settingsModule:!b.dataset.settingsModule);b.classList.toggle('active',sameView&&sameSection&&sameSettings)});
    const adminTitles={operation:'Operação',finance:'Bonificação',costs:'Custos',appearance:'Aparência'};
    const titles={home:'Início',alerts:'Central de Alertas',individual:'Meu desempenho',team:'Visão do Squad',indicators:'Indicadores',presentation:'Apresentação',feedbacks:'Feedbacks',users:'Usuários',audit:'Auditoria',admin:adminTitles[state.adminSection]||'Gestão',settings:'Configurações',profile:'Meu perfil','my-feedbacks':'Meus feedbacks',help:'Como usar'};
    $('#pageTitle').textContent=titles[name]||'Performance Hub';document.title=`${titles[name]||'Performance Hub'} • Soften Performance Hub`;
    if($('#squadEyebrow'))$('#squadEyebrow').textContent=name==='home'?(isSuperAdmin()?'PERFORMANCE HUB':`SQUAD ${state.user?.squadCode||state.squadCode||'—'}`):(state.squadCode==='all'?'TODOS OS SQUADS':`SQUAD ${state.squadCode}`);
    syncTopFiltersForView(name,state.adminSection);
    syncAnalysisDateControls();
    $('.sidebar').classList.remove('open');
    document.body.classList.remove('sidebar-open');
    $('#mobileMenu')?.setAttribute('aria-expanded','false');
    $('#mobileMenu')?.setAttribute('aria-label','Abrir menu lateral');
    render();
    if(state.supabase&&name!=='home')hydrateCurrentViewAsync(name,state.adminSection);
    updateBreadcrumbs();if(history!=='none')syncPersistentUrl({replace:history==='replace'});
    resetViewScroll();
  }

  function competenceIdsForSquad(code=state.squadCode){
    if(code&&code!=='all')return Object.keys(state.squads?.[code]?.months||{}).sort().reverse();
    return [...new Set(Object.values(state.squads||{}).flatMap(s=>Object.keys(s?.months||{})))].sort().reverse();
  }
  function competenceMeta(id,code=state.squadCode){
    if(code&&code!=='all')return state.squads?.[code]?.months?.[id]||null;
    for(const squad of Object.values(state.squads||{})){const m=squad?.months?.[id];if(m)return m;}
    return null;
  }
  function refreshSelectors(){
    if(isSuperAdmin()) $('#squadSelect').innerHTML=`<option value="all" ${state.squadCode==='all'?'selected':''}>Todos os Squads</option>`+Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${s.code}" ${s.code===state.squadCode?'selected':''}>${escapeHtml(s.name)}</option>`).join('');
    const m=currentMonth(),ids=competenceIdsForSquad();
    if(ids.length&&!ids.includes(state.currentId)){state.currentId=ids[0];if(state.squadCode!=='all')chooseDefaultTech();}
    $('#monthSelect').disabled=!ids.length;
    $('#monthSelect').innerHTML=ids.length?ids.map(id=>{const mm=competenceMeta(id);const closed=state.squadCode!=='all'&&mm?.isClosed?' • Fechado':'';return `<option value="${id}" ${id===state.currentId?'selected':''}>${escapeHtml(mm?.monthName||monthLabelFromId(id).split(' ')[0])} ${escapeHtml(mm?.year||id.slice(0,4))}${closed}</option>`}).join(''):'<option>Sem dados</option>';
    const selectedMonth=currentMonth();
    if(selectedMonth){chooseDefaultTech();$('#techSelect').innerHTML=selectedMonth.technicians.map(t=>`<option ${samePersonName(t.name,state.techName)?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}else $('#techSelect').innerHTML='<option>Sem dados</option>';
    const label=state.squadCode==='all'?'TODOS OS SQUADS':`SQUAD ${state.squadCode}`;$('#squadEyebrow').textContent=label;syncAnalysisDateControls();syncTopFiltersForView(state.currentView,state.adminSection);syncFilterDrawer();
  }

  function render(){
    applyPermissions();
    if(state.currentView==='home'){renderHome();return;}
    if(state.currentView==='alerts'){renderAlertCenter();return;}
    if(state.currentView==='feedbacks'){renderFeedbacks();return;}
    if(state.currentView==='my-feedbacks'){renderMyFeedbacks();return;}
    if(state.currentView==='users')renderUsers().catch(err=>{console.error(err);toast('Não foi possível carregar os usuários.')});
    if(state.currentView==='audit'){renderAuditLogView().catch(err=>{console.error(err);toast('Não foi possível carregar a auditoria.')});return;}
    if(state.currentView==='help')renderHelp();
    if(state.currentView==='settings'){renderSettings();return;}
    if(state.currentView==='profile')renderProfile();
    if(state.currentView==='indicators'){renderIndicators();applyPersonalLayout('indicators');}
    if(state.currentView==='presentation'){renderPresentation();return;}
    if(state.squadCode==='all'){renderTeam();renderAdmin();return}
    const m=currentMonth();
    $('#individualEmpty').classList.toggle('hidden',!!m);$('#individualContent').classList.toggle('hidden',!m);
    $('#teamEmpty').classList.toggle('hidden',!!m);$('#teamContent').classList.toggle('hidden',!m);
    if(m){renderIndividual();renderTeam();applyPersonalLayout('individual');applyPersonalLayout('team');}
    if(state.currentView==='indicators')applyPersonalLayout('indicators');
    renderAdmin();
  }


  function homeLatestPeriodId(){
    const scope=state.squadCode&&state.squadCode!=='all'?[state.squads?.[state.squadCode]].filter(Boolean):Object.values(state.squads||{}),ids=[...new Set(scope.flatMap(s=>Object.keys(s?.months||{})))].sort().reverse();
    if(state.currentId&&ids.includes(state.currentId))return state.currentId;
    return ids[0]||null;
  }
  function homePeriodMonths(id=homeLatestPeriodId()){
    if(!id)return[];
    const squads=state.squadCode&&state.squadCode!=='all'?[state.squads?.[state.squadCode]].filter(Boolean):(isSuperAdmin()?Object.values(state.squads||{}):[]);
    return squads.map(s=>({squad:s,month:s?.months?.[id]||null})).filter(x=>x.month);
  }
  function homeGreetingText(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'}
  function homePeriodLabel(id){return id?monthLabelFromId(id):'Sem competência'}
  function homeLatestImport(months){return(months||[]).map(x=>x.month?.importedAt).filter(Boolean).sort().reverse()[0]||null}
  function homeStatusClass(status=''){const v=String(status||'').toLowerCase();return/critical|abaixo|risk|atenção|atencao/.test(v)?'critical':/warning|evolu|watch/.test(v)?'warning':/acima|ok|achieved|on_track|forte/.test(v)?'positive':'info'}
  function homeKpiHtml({label,value,detail='',icon='◆',progress=null,tone='info'}={}){
    const pct=progress==null?null:clamp(safe(progress),0,1)*100;
    return `<article class="card home-kpi-card ${escapeHtml(tone)}"><div class="home-kpi-head"><span>${escapeHtml(label)}</span><i>${escapeHtml(icon)}</i></div><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail||'')}</small>${pct==null?'':`<div class="home-kpi-progress"><b style="width:${pct.toFixed(1)}%"></b></div>`}</article>`;
  }
  function homeAlertHtml({severity='info',title='',text=''}={}){return `<div class="home-alert-item ${escapeHtml(severity)}"><span></span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(text)}</small></div></div>`}
  function homeQuickButton({icon='→',title='',text='',view='',section='',settings='',permission=''}={}){
    if(permission&&!hasPermission(permission))return'';
    return `<button class="home-quick-btn" type="button" ${view?`data-home-view="${escapeHtml(view)}"`:''} ${section?`data-home-admin-section="${escapeHtml(section)}"`:''} ${settings?`data-home-settings-module="${escapeHtml(settings)}"`:''}><span>${escapeHtml(icon)}</span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(text)}</small></div><b>›</b></button>`;
  }
  function homeRiskForTechnician(t,m,squadCode){
    const days=Math.max(1,businessDaysMonFri(m.year,m.month)),elapsed=Math.max(0,businessDaysElapsed(m.year,m.month,m.latestDay)),evalGoal=teamSettings(m).teamGoalEvalPct;
    return predictiveEngine.technicianRisk({name:t.name,squad:squadCode,att:t.att,notes5:t.notes5,evalPct:t.evalPct,goalAtt:t.goalAtt,goalNotes5:t.goalEval,goalEvalPct:evalGoal,elapsedDays:elapsed,totalDays:days});
  }
  function homeSquadMetric(squad,m){
    const totals=deriveTotals(m?.technicians||[]),notes5=(m?.technicians||[]).reduce((sum,t)=>sum+safe(t.notes5),0),notesGoal=(m?.technicians||[]).reduce((sum,t)=>sum+safe(t.goalEval),0),goals=teamSettings(m),totalDays=Math.max(1,businessDaysMonFri(m.year,m.month)),elapsedDays=Math.max(0,businessDaysElapsed(m.year,m.month,m.latestDay)),attendance=predictiveEngine.countMetric({realized:totals.att,goal:goals.teamGoalAtt,elapsedDays,totalDays}),notes=predictiveEngine.countMetric({realized:notes5,goal:notesGoal,elapsedDays,totalDays}),evaluation=predictiveEngine.rateMetric({realized:totals.evalPct,goal:goals.teamGoalEvalPct}),risks=(m?.technicians||[]).map(t=>homeRiskForTechnician(t,m,squad.code)),atRisk=risks.filter(r=>['critical','warning'].includes(r.level)).length;
    return{squad,m,totals,notes5,notesGoal,goals,totalDays,elapsedDays,attendance,notes,evaluation,risks,atRisk};
  }
  function homeEmptyState(role,id){
    const actions=[];
    if(isAdmin()&&hasPermission('data.import'))actions.push('<button class="btn primary" type="button" data-home-view="admin" data-home-admin-section="operation">Ir para Operação</button>');
    actions.push('<button class="btn secondary" type="button" data-home-view="help">Ver como usar</button>');
    return{icon:isTechnician()?'◈':'↻',title:id?'Sem dados nesta competência':'O painel ainda não possui competências',text:isTechnician()?'Ainda não há dados vinculados ao seu perfil nesta competência. Se isso não era esperado, confirme seu vínculo com o gestor.':'Importe os dados da primeira competência para liberar a Home, indicadores, rankings e bonificação.',actions:actions.join('')};
  }
  function renderHome(){
    const id=homeLatestPeriodId(),months=homePeriodMonths(id),empty=!id||!months.length,first=String(state.user?.fullName||state.user?.email||'Usuário').trim().split(/\s+/)[0]||'Usuário';
    renderUserAvatar($('#homeAvatar'),state.user);
    if($('#homeGreeting'))$('#homeGreeting').textContent=`${homeGreetingText()}, ${first}.`;
    if($('#homeRoleLabel'))$('#homeRoleLabel').textContent=`${roleLabel(state.user?.role||'').toUpperCase()} • ${isSuperAdmin()?'VISÃO GERAL':`SQUAD ${state.user?.squadCode||state.squadCode||'—'}`}`;
    if($('#homePeriodChip'))$('#homePeriodChip').textContent=homePeriodLabel(id);
    if($('#squadEyebrow'))$('#squadEyebrow').textContent=isSuperAdmin()?'PERFORMANCE HUB':`SQUAD ${state.user?.squadCode||state.squadCode||'—'}`;
    const latest=homeLatestImport(months);if($('#homeUpdateChip'))$('#homeUpdateChip').textContent=latest?`Atualizado ${formatDateTime(latest)}`:'Sem importação registrada';
    const emptyEl=$('#homeEmpty'),content=$('#homeContent');emptyEl?.classList.toggle('hidden',!empty);content?.classList.toggle('hidden',empty);
    if(empty){const e=homeEmptyState(state.user?.role,id);if($('#homeEmptyIcon'))$('#homeEmptyIcon').textContent=e.icon;if($('#homeEmptyTitle'))$('#homeEmptyTitle').textContent=e.title;if($('#homeEmptyText'))$('#homeEmptyText').textContent=e.text;if($('#homeEmptyActions'))$('#homeEmptyActions').innerHTML=e.actions;if($('#homeSubtitle'))$('#homeSubtitle').textContent='Assim que houver dados, o resumo da sua operação aparecerá aqui.';if($('#homeHeroActions'))$('#homeHeroActions').innerHTML=homeQuickButton({icon:'?',title:'Abrir guia',text:'Entenda o fluxo do painel',view:'help'});$('#homeSquadsCard')?.classList.add('hidden');$('#homeWidgetSquads')?.classList.add('home-widget-role-unavailable');state.homeLayoutEditMode=false;$('#homeLayoutToolbar')?.classList.add('hidden');return;}
    if(isTechnician())renderTechnicianHome(id,months[0]);else renderSuperAdminHome(id,months);
    if(hasPermission('dashboard.customize')&&$('#homeHeroActions')&&!$('#homeHeroActions').querySelector('[data-home-layout-action="edit"]'))$('#homeHeroActions').insertAdjacentHTML('beforeend','<button class="btn secondary" type="button" data-home-layout-action="edit">▦ Organizar Home</button>');
    applyPersonalLayout('home');
    if(state.homeLayoutEditMode)renderHomeWidgetEditState();
  }
  function renderTechnicianHome(id,entry){
    const m=entry.month,t=(m.technicians||[]).find(x=>samePersonName(x.name,state.user?.techName))||currentTech(),days=Math.max(1,businessDaysMonFri(m.year,m.month)),elapsed=Math.max(0,businessDaysElapsed(m.year,m.month,m.latestDay));
    if(!t){const e=homeEmptyState('technician',id);$('#homeEmpty')?.classList.remove('hidden');$('#homeContent')?.classList.add('hidden');$('#homeEmptyTitle').textContent='Seu usuário ainda não está vinculado aos dados';$('#homeEmptyText').textContent='O login está correto, mas não encontrei seu nome entre os técnicos importados desta competência. Confirme o vínculo do cadastro com o nome usado no CSV.';$('#homeEmptyActions').innerHTML='<button class="btn secondary" type="button" data-home-view="help">Ver como funciona o vínculo</button>';return;}
    const att=predictiveEngine.countMetric({realized:t.att,goal:t.goalAtt,elapsedDays:elapsed,totalDays:days}),notes=predictiveEngine.countMetric({realized:t.notes5,goal:t.goalEval,elapsedDays:elapsed,totalDays:days}),evalGoal=teamSettings(m).teamGoalEvalPct,risk=homeRiskForTechnician(t,m,entry.squad.code),money=safe(t.financeData?.final);
    $('#homeSubtitle').textContent='Seu resumo do mês, com ritmo, qualidade e próximos passos em uma única tela.';
    $('#homeHeroActions').innerHTML='<button class="btn primary" type="button" data-home-view="individual">Ver meu desempenho</button><button class="btn secondary" type="button" data-home-view="alerts">Central de Alertas</button><button class="btn secondary" type="button" data-home-view="my-feedbacks">Meus feedbacks</button>';
    $('#homeKpis').innerHTML=[homeKpiHtml({label:'Atendimentos',value:fmtInt(t.att),detail:`Meta ${fmtInt(t.goalAtt)} • projeção ${fmtInt(Math.round(att.projection))}`,icon:'☎',progress:att.completion,tone:homeStatusClass(att.status)}),homeKpiHtml({label:'Notas 5',value:fmtInt(t.notes5),detail:`Meta ${fmtInt(t.goalEval)} • projeção ${fmtInt(Math.round(notes.projection))}`,icon:'★',progress:notes.completion,tone:homeStatusClass(notes.status)}),homeKpiHtml({label:'% avaliado',value:fmtPct(t.evalPct),detail:`Meta ${fmtPct(evalGoal)} • ${fmtInt(t.totalEval)} avaliações`,icon:'%',progress:evalGoal?t.evalPct/evalGoal:null,tone:t.evalPct>=evalGoal?'positive':'warning'}),homeKpiHtml({label:'Bonificação',value:fmtMoney(money),detail:m.isClosed?'Valor oficial da competência':'Estimativa enquanto o mês está aberto',icon:'R$',tone:m.isClosed?'positive':'info'})].join('');
    const alerts=[];if(risk.reasons.length)risk.reasons.slice(0,3).forEach((reason,i)=>alerts.push({severity:risk.level==='critical'?'critical':'warning',title:i===0?'Atenção ao ritmo':'Ponto para acompanhar',text:reason}));if(!risk.reasons.length)alerts.push({severity:'positive',title:'Ritmo saudável',text:'Seus principais indicadores estão no patamar esperado para a competência.'});if(t.vacation)alerts.push({severity:'info',title:'Férias registradas',text:'O redutor de 50% está sendo aplicado somente sobre a comissão-base, conforme a regra vigente.'});renderHomeAlerts(alerts);
    $('#homeQuickActions').innerHTML=[homeQuickButton({icon:'◈',title:'Meu desempenho',text:'Ranking, metas e histórico',view:'individual'}),homeQuickButton({icon:'✎',title:'Meus feedbacks',text:'Acompanhe devolutivas finalizadas',view:'my-feedbacks'}),homeQuickButton({icon:'◉',title:'Meu perfil',text:'Conta e segurança',view:'profile'}),homeQuickButton({icon:'?',title:'Como usar',text:'Guia completo do painel',view:'help'})].join('');
    $('#homeSquadsCard')?.classList.add('hidden');$('#homeWidgetSquads')?.classList.add('home-widget-role-unavailable');renderHomeContext([{label:'Competência',value:homePeriodLabel(id),note:`${elapsed}/${days} dias úteis`},{label:'Status',value:t.status||'Em acompanhamento',note:`${fmtNum(t.points)} pontos`},{label:'Origem',value:m.sourceFile||'Supabase',note:m.importedAt?formatDateTime(m.importedAt):'Sem data de importação'},{label:'Fechamento',value:m.isClosed?'Fechado':'Em andamento',note:m.isClosed&&m.closedAt?formatDateTime(m.closedAt):'Valores ainda podem mudar'}]);
  }
  function renderSuperAdminHome(id,entries){
    const data=entries.map(x=>homeSquadMetric(x.squad,x.month)),att=data.reduce((s,d)=>s+d.totals.att,0),eligible=data.reduce((s,d)=>s+d.totals.eligibleAtt,0),evals=data.reduce((s,d)=>s+d.totals.eval,0),notes=data.reduce((s,d)=>s+d.notes5,0),goalAtt=data.reduce((s,d)=>s+d.goals.teamGoalAtt,0),goalNotes=data.reduce((s,d)=>s+d.notesGoal,0),projAtt=data.reduce((s,d)=>s+d.attendance.projection,0),projNotes=data.reduce((s,d)=>s+d.notes.projection,0),evalPct=eligible?evals/eligible:0,evalGoal=data.length?data.reduce((s,d)=>s+d.goals.teamGoalEvalPct,0)/data.length:0,atRisk=data.reduce((s,d)=>s+d.atRisk,0),totalTech=data.reduce((s,d)=>s+(d.m.technicians||[]).length,0),behind=data.filter(d=>d.attendance.projectedCompletion<1).length;
    $('#homeSubtitle').textContent='Visão executiva dos Squads com o que está acontecendo agora e onde agir primeiro.';
    $('#homeHeroActions').innerHTML='<button class="btn primary" type="button" data-home-view="indicators">Abrir Indicadores</button><button class="btn secondary" type="button" data-home-view="alerts">Central de Alertas</button><button class="btn secondary" type="button" data-home-squad="all">Comparar Squads</button>';
    $('#homeKpis').innerHTML=[homeKpiHtml({label:'Atendimentos',value:fmtInt(att),detail:`Meta ${fmtInt(goalAtt)} • projeção ${fmtInt(Math.round(projAtt))}`,icon:'☎',progress:goalAtt?att/goalAtt:null,tone:projAtt>=goalAtt?'positive':'warning'}),homeKpiHtml({label:'Notas 5',value:fmtInt(notes),detail:`Meta ${fmtInt(goalNotes)} • projeção ${fmtInt(Math.round(projNotes))}`,icon:'★',progress:goalNotes?notes/goalNotes:null,tone:projNotes>=goalNotes?'positive':'warning'}),homeKpiHtml({label:'% avaliado',value:fmtPct(evalPct),detail:`Referência média ${fmtPct(evalGoal)}`,icon:'%',progress:evalGoal?evalPct/evalGoal:null,tone:evalPct>=evalGoal?'positive':'warning'}),homeKpiHtml({label:'Técnicos em atenção',value:fmtInt(atRisk),detail:`${fmtInt(totalTech)} técnicos • ${fmtInt(behind)} Squad(s) abaixo da projeção`,icon:'!',tone:atRisk||behind?'warning':'positive'})].join('');
    const alerts=[];if(behind)alerts.push({severity:behind>=2?'critical':'warning',title:'Squads abaixo da projeção',text:`${behind} Squad(s) projetam fechamento abaixo da meta de atendimentos.`});if(atRisk)alerts.push({severity:atRisk/Math.max(1,totalTech)>=.3?'critical':'warning',title:'Técnicos que pedem acompanhamento',text:`${atRisk} de ${totalTech} técnico(s) concentram sinais de risco no ritmo atual.`});if(evalGoal&&evalPct<evalGoal)alerts.push({severity:'warning',title:'Avaliação abaixo da referência',text:`Taxa consolidada em ${fmtPct(evalPct)} para referência média de ${fmtPct(evalGoal)}.`});if(!alerts.length)alerts.push({severity:'positive',title:'Operação consolidada estável',text:'Nenhum dos principais indicadores globais está em faixa crítica nesta competência.'});renderHomeAlerts(alerts);
    $('#homeQuickActions').innerHTML=[homeQuickButton({icon:'◔',title:'Indicadores',text:'Gestão preditiva e comparações',view:'indicators',permission:'indicators.view'}),homeQuickButton({icon:'↻',title:'Operação',text:'Importações e fechamento',view:'admin',section:'operation',permission:'data.import'}),homeQuickButton({icon:'♟',title:'Usuários',text:'Acessos e restrições',view:'users',permission:'users.manage'}),homeQuickButton({icon:'⌁',title:'Auditoria',text:'Histórico de alterações',view:'audit',permission:'audit.view'}),homeQuickButton({icon:'▣',title:'TV / Comunicação',text:'Playlists e monitoramento',view:'presentation',permission:'presentation.view'}),homeQuickButton({icon:'⚙',title:'Configurações',text:'Central administrativa',view:'settings'})].join('');
    const squadCard=$('#homeSquadsCard');squadCard?.classList.remove('hidden');$('#homeWidgetSquads')?.classList.remove('home-widget-role-unavailable');if($('#homeSquadsNote'))$('#homeSquadsNote').textContent=`${homePeriodLabel(id)} • ${data.length} Squad(s) com dados`;if($('#homeSquadOverview'))$('#homeSquadOverview').innerHTML=data.sort((a,b)=>a.squad.code.localeCompare(b.squad.code)).map(d=>`<button class="home-squad-card" type="button" data-home-squad="${escapeHtml(d.squad.code)}"><div class="home-squad-head"><span>${escapeHtml(d.squad.code)}</span><b class="${homeStatusClass(d.attendance.status)}">${d.attendance.projectedCompletion>=1?'NO RITMO':'ATENÇÃO'}</b></div><strong>Squad ${escapeHtml(d.squad.code)}</strong><small>${fmtInt(d.totals.att)} atend. • ${fmtPct(d.totals.evalPct)} avaliado</small><div class="home-squad-foot"><span>Projeção ${fmtInt(Math.round(d.attendance.projection))}/${fmtInt(d.goals.teamGoalAtt)}</span><span>${fmtInt(d.atRisk)} técnico(s) atenção</span></div></button>`).join('');
    const latest=homeLatestImport(entries);renderHomeContext([{label:'Competência',value:homePeriodLabel(id),note:`${data.length} Squad(s) com dados`},{label:'Equipe',value:`${fmtInt(totalTech)} técnicos`,note:`${fmtInt(atRisk)} em atenção`},{label:'Última atualização',value:latest?formatDateTime(latest):'Sem registro',note:'Mais recente entre os Squads'},{label:'Cobertura',value:`${data.length}/${Object.keys(state.squads||{}).length} Squads`,note:data.length===Object.keys(state.squads||{}).length?'Todos com dados':'Há Squad sem dados nesta competência'}]);
  }
  function renderHomeAlerts(alerts){const rows=(alerts||[]).slice(0,5);if($('#homeAlertCount'))$('#homeAlertCount').textContent=`${rows.filter(x=>x.severity!=='positive').length} alerta(s)`;if($('#homeAlerts'))$('#homeAlerts').innerHTML=rows.map(homeAlertHtml).join('')||homeAlertHtml({severity:'info',title:'Sem alertas',text:'Nenhum ponto automático foi identificado agora.'})}
  function renderHomeContext(items){if($('#homeContext'))$('#homeContext').innerHTML=(items||[]).map(x=>`<div><span>${escapeHtml(x.label)}</span><strong>${escapeHtml(x.value)}</strong><small>${escapeHtml(x.note||'')}</small></div>`).join('')}


  /* ===== V2.46 Central de Alertas + notificacoes internas ===== */
  const DEMO_INTERNAL_NOTIFICATION_KEY='softenPerformanceInternalNotificationsV1';
  const DEMO_NOTIFICATION_READ_KEY='softenPerformanceInternalNotificationReadsV1';
  const AUTO_ALERT_READ_KEY='softenPerformanceAutoAlertReadsV1';
  function notificationUserKey(){return String(state.user?.userId||state.user?.email||'anonymous')}
  function notificationSquadIdForUser(){const code=state.user?.squadCode||state.squadCode;return code&&code!=='all'?(state.squads?.[code]?.dbId||code):null}
  function notificationAudienceUser(){return{role:state.user?.role||'',squadId:notificationSquadIdForUser()}}
  function notificationSquadCodeById(id){if(!id)return'';return Object.values(state.squads||{}).find(s=>String(s?.dbId||s?.code||'')===String(id))?.code||''}
  function readLocalArray(key){try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows:[]}catch(e){return[]}}
  function writeLocalArray(key,rows){try{localStorage.setItem(key,JSON.stringify(rows||[]))}catch(e){console.warn('Não foi possível persistir notificações locais.',e)}}
  function loadDemoInternalNotifications(){const org=String(state.user?.organizationId||'demo');return readLocalArray(DEMO_INTERNAL_NOTIFICATION_KEY).filter(row=>String(row.organization_id||row.organizationId||'demo')===org)}
  function saveDemoInternalNotifications(rows){const org=String(state.user?.organizationId||'demo'),all=readLocalArray(DEMO_INTERNAL_NOTIFICATION_KEY).filter(row=>String(row.organization_id||row.organizationId||'demo')!==org);writeLocalArray(DEMO_INTERNAL_NOTIFICATION_KEY,[...rows,...all].slice(0,500))}
  function demoNotificationReadKey(){return`${DEMO_NOTIFICATION_READ_KEY}:${notificationUserKey()}`}
  function autoAlertReadKey(){return`${AUTO_ALERT_READ_KEY}:${notificationUserKey()}`}
  function loadAutoAlertReadIds(){return readLocalArray(autoAlertReadKey()).map(String)}
  function saveAutoAlertReadIds(ids){writeLocalArray(autoAlertReadKey(),[...new Set((ids||[]).map(String))].slice(-400))}
  function notificationSeverityLabel(v){return v==='critical'?'Crítica':v==='warning'?'Atenção':v==='success'?'Positiva':'Informativa'}
  function notificationCategoryLabel(v){return v==='operation'?'Operação':v==='performance'?'Performance':v==='feedback'?'Feedback':v==='announcement'?'Comunicado':'Sistema'}
  function notificationIcon(item){return item?.severity==='critical'?'!':item?.severity==='warning'?'△':item?.severity==='success'?'✓':item?.source==='internal'?'◆':'i'}
  function notificationSourceLabel(item){return item?.source==='automatic'?'Automático':'Interno'}
  function localDateTimeValue(date=new Date()){const d=new Date(date),offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,16)}
  function dateInputIso(value){if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString()}
  function notificationActionAllowed(item){const view=item?.actionView;if(!view)return false;if(view==='indicators')return hasPermission('indicators.view');if(view==='presentation')return hasPermission('presentation.view');if(view==='feedbacks')return isAdmin()&&hasPermission('feedback.manage');if(view==='my-feedbacks')return isTechnician();if(view==='admin')return isAdmin();return['home','individual','team','settings','profile','help'].includes(view)}
  function automaticAlertsForCurrentUser(){
    const id=homeLatestPeriodId(),entries=homePeriodMonths(id),alerts=[];if(!id||!entries.length)return alerts;
    if(isTechnician()){
      const entry=entries[0],m=entry?.month,t=(m?.technicians||[]).find(x=>samePersonName(x.name,state.user?.techName))||currentTech();if(!m||!t)return alerts;
      const risk=homeRiskForTechnician(t,m,entry.squad.code);risk.reasons.forEach((reason,index)=>alerts.push(alertEngine.automaticAlert({code:`technician_risk_${index+1}`,scope:`squad-${entry.squad.code}`,period:id,subject:t.name,severity:risk.level==='critical'?'critical':'warning',category:'performance',title:index===0?'Seu ritmo precisa de atenção':'Indicador para acompanhar',text:reason,createdAt:m.importedAt,actionView:'individual',actionLabel:'Ver desempenho'})));
      return alerts;
    }
    const data=entries.map(x=>homeSquadMetric(x.squad,x.month));
    for(const d of data){
      const scope=`squad-${d.squad.code}`;
      if(d.attendance.goal>0&&d.attendance.projectedCompletion<1){const pct=Math.round(d.attendance.projectedCompletion*100);alerts.push(alertEngine.automaticAlert({code:'attendance_projection',scope,period:id,subject:`Squad ${d.squad.code}`,severity:pct<90?'critical':'warning',category:'performance',title:`Squad ${d.squad.code}: atendimentos abaixo da projeção`,text:`Mantido o ritmo atual, o fechamento tende a atingir ${pct}% da meta de atendimentos.`,createdAt:d.m.importedAt,actionView:'indicators',actionSection:'performance',actionLabel:'Abrir gestão preditiva'}));}
      if(d.notes.goal>0&&d.notes.projectedCompletion<1){const pct=Math.round(d.notes.projectedCompletion*100);alerts.push(alertEngine.automaticAlert({code:'notes5_projection',scope,period:id,subject:`Squad ${d.squad.code}`,severity:pct<90?'critical':'warning',category:'performance',title:`Squad ${d.squad.code}: notas 5 abaixo do ritmo`,text:`A projeção atual indica ${pct}% da meta de notas 5.`,createdAt:d.m.importedAt,actionView:'indicators',actionSection:'performance',actionLabel:'Ver indicadores'}));}
      if(d.evaluation.goal>0&&d.evaluation.realized<d.evaluation.goal){const gap=(d.evaluation.goal-d.evaluation.realized)*100;alerts.push(alertEngine.automaticAlert({code:'evaluation_gap',scope,period:id,subject:`Squad ${d.squad.code}`,severity:gap>=5?'critical':'warning',category:'performance',title:`Squad ${d.squad.code}: avaliação abaixo da meta`,text:`Gap atual de ${gap.toFixed(1).replace('.',',')} p.p. em relação à referência configurada.`,createdAt:d.m.importedAt,actionView:'team',actionLabel:'Abrir Squad'}));}
      if(d.atRisk>0){const ratio=d.atRisk/Math.max(1,(d.m.technicians||[]).length);alerts.push(alertEngine.automaticAlert({code:'technicians_at_risk',scope,period:id,subject:`Squad ${d.squad.code}`,severity:ratio>=.3?'critical':'warning',category:'performance',title:`Squad ${d.squad.code}: técnicos em atenção`,text:`${d.atRisk} de ${(d.m.technicians||[]).length} técnico(s) apresentam sinais combinados de risco.`,createdAt:d.m.importedAt,actionView:'indicators',actionSection:'performance',actionLabel:'Ver riscos'}));}
    }
    const available=new Set(entries.map(x=>String(x.squad.code))),missing=Object.keys(state.squads||{}).filter(code=>!available.has(String(code)));
    if(missing.length)alerts.push(alertEngine.automaticAlert({code:'missing_squad_data',scope:'organization',period:id,subject:'Cobertura',severity:'warning',category:'operation',title:'Competência com cobertura incompleta',text:`Sem dados nesta competência para: ${missing.map(c=>`Squad ${c}`).join(', ')}.`,actionView:'admin',actionSection:'operation',actionLabel:'Abrir Operação'}));
    return alerts;
  }
  function personalNotificationFeed(){return alertEngine.buildFeed({automatic:automaticAlertsForCurrentUser(),notifications:state.internalNotifications||[],readIds:state.notificationReadIds||[],autoReadIds:loadAutoAlertReadIds(),user:notificationAudienceUser(),now:new Date()})}
  function notificationFeedCounts(){return alertEngine.counts(personalNotificationFeed())}
  function refreshNotificationBadges(){
    if(!state.user||!hasPermission('notifications.view'))return;
    const count=notificationFeedCounts().unread,badge=$('#notificationBadge'),nav=$('#navNotificationBadge');
    for(const el of [badge,nav])if(el){el.textContent=count>99?'99+':String(count);el.classList.toggle('hidden',count<=0);}
    if($('#notificationBellBtn'))$('#notificationBellBtn').setAttribute('aria-label',count?`Abrir notificações: ${count} não lida(s)`:'Abrir notificações');
  }
  async function ensureNotificationsLoaded(force=false){
    if(!state.user||!hasPermission('notifications.view'))return[];if(state.notificationsLoaded&&!force)return state.internalNotifications;if(state.notificationsLoading)return state.internalNotifications;state.notificationsLoading=true;state.notificationsError='';
    try{
      if(state.supabase){
        const [notificationsResult,readsResult]=await Promise.all([
          state.supabase.from('internal_notifications').select('*').eq('organization_id',state.user.organizationId).order('created_at',{ascending:false}).limit(250),
          state.supabase.from('internal_notification_reads').select('notification_id,read_at').eq('user_id',state.user.userId).order('read_at',{ascending:false}).limit(500)
        ]);
        if(notificationsResult.error)throw notificationsResult.error;if(readsResult.error)throw readsResult.error;
        state.internalNotifications=notificationsResult.data||[];state.notificationReadIds=(readsResult.data||[]).map(r=>String(r.notification_id));state.notificationsRemoteAvailable=true;
      }else{state.internalNotifications=loadDemoInternalNotifications();state.notificationReadIds=readLocalArray(demoNotificationReadKey()).map(String);state.notificationsRemoteAvailable=true;}
      state.notificationsLoaded=true;return state.internalNotifications;
    }catch(err){
      const message=String(err?.message||err||'');state.notificationsLoaded=true;state.internalNotifications=[];state.notificationReadIds=[];state.notificationsRemoteAvailable=false;state.notificationsError=/internal_notifications|internal_notification_reads|relation .* does not exist|schema cache/i.test(message)?'Execute a MIGRACAO_V2.46.0.sql no Supabase para habilitar notificações internas.':'Não foi possível carregar as notificações internas agora.';console.warn('Notificações internas indisponíveis.',err);return[];
    }finally{state.notificationsLoading=false;refreshNotificationSurfaces();}
  }
  function refreshNotificationSurfaces(){refreshNotificationBadges();if(state.notificationPopoverOpen)renderNotificationPopover();if(state.currentView==='alerts')renderAlertCenter();}
  function notificationMiniHtml(item){const action=notificationActionAllowed(item)?`<button type="button" class="notification-mini-action" data-notification-action="${escapeHtml(item.id)}">${escapeHtml(item.actionLabel||'Abrir')}</button>`:'';return`<article class="notification-mini-item ${escapeHtml(item.severity)} ${item.read?'read':'unread'}"><i>${notificationIcon(item)}</i><div><div class="notification-mini-meta"><span>${notificationSourceLabel(item)}</span><small>${escapeHtml(notificationCategoryLabel(item.category))}</small></div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p><footer><small>${escapeHtml(formatDateTime(item.createdAt))}</small><div>${item.read?'':`<button type="button" class="link-btn" data-notification-read="${escapeHtml(item.id)}">Marcar lida</button>`}${action}</div></footer></div></article>`}
  function renderNotificationPopover(){
    const list=$('#notificationPopoverList');if(!list)return;const feed=personalNotificationFeed().slice(0,6);list.innerHTML=feed.map(notificationMiniHtml).join('')||'<div class="notification-popover-empty">Nenhuma notificação ativa.</div>';if($('#notificationMarkAllBtn'))$('#notificationMarkAllBtn').disabled=!feed.some(x=>!x.read);
  }
  function setNotificationPopover(open){state.notificationPopoverOpen=!!open;const pop=$('#notificationPopover'),btn=$('#notificationBellBtn');pop?.classList.toggle('hidden',!open);btn?.setAttribute('aria-expanded',open?'true':'false');if(open){ensureNotificationsLoaded(false).catch(()=>{});renderNotificationPopover();}}
  function toggleNotificationPopover(){setNotificationPopover(!state.notificationPopoverOpen)}
  function notificationFeedItem(id){return personalNotificationFeed().find(x=>String(x.id)===String(id))||null}
  async function markNotificationRead(item){
    if(!item||item.read)return true;try{
      if(item.source==='automatic'){const ids=loadAutoAlertReadIds();ids.push(String(item.id));saveAutoAlertReadIds(ids);}
      else if(state.supabase){const payload={organization_id:state.user.organizationId,notification_id:item.id,user_id:state.user.userId,read_at:new Date().toISOString()};const {error}=await state.supabase.from('internal_notification_reads').upsert(payload,{onConflict:'notification_id,user_id'});if(error)throw error;state.notificationReadIds=[...new Set([...(state.notificationReadIds||[]).map(String),String(item.id)])];}
      else{state.notificationReadIds=[...new Set([...(state.notificationReadIds||[]).map(String),String(item.id)])];writeLocalArray(demoNotificationReadKey(),state.notificationReadIds);}
      refreshNotificationSurfaces();return true;
    }catch(err){console.error(err);toast('Não foi possível registrar a leitura.');return false;}
  }
  async function markAllNotificationsRead(){
    const feed=personalNotificationFeed(),unread=feed.filter(x=>!x.read);if(!unread.length)return toast('Não há notificações não lidas.');
    const autoIds=unread.filter(x=>x.source==='automatic').map(x=>String(x.id)),internalIds=unread.filter(x=>x.source==='internal').map(x=>String(x.id));
    try{
      if(autoIds.length)saveAutoAlertReadIds([...loadAutoAlertReadIds(),...autoIds]);
      if(internalIds.length&&state.supabase){const now=new Date().toISOString(),rows=internalIds.map(id=>({organization_id:state.user.organizationId,notification_id:id,user_id:state.user.userId,read_at:now})),{error}=await state.supabase.from('internal_notification_reads').upsert(rows,{onConflict:'notification_id,user_id'});if(error)throw error;}
      state.notificationReadIds=[...new Set([...(state.notificationReadIds||[]).map(String),...internalIds])];if(!state.supabase)writeLocalArray(demoNotificationReadKey(),state.notificationReadIds);refreshNotificationSurfaces();toast(`${unread.length} item(ns) marcado(s) como lido(s).`);
    }catch(err){console.error(err);toast('Não foi possível marcar todas as notificações como lidas.');}
  }
  async function openNotificationAction(id){const item=notificationFeedItem(id);if(!item)return;await markNotificationRead(item);setNotificationPopover(false);if(!notificationActionAllowed(item))return;if(item.actionView==='admin')showView('admin',item.actionSection||'operation');else if(item.actionView==='indicators'){if(item.actionSection&&INDICATOR_SECTION_META[item.actionSection])state.indicatorSection=item.actionSection;showView('indicators');}else showView(item.actionView);}
  function notificationFeedItemHtml(item){const action=notificationActionAllowed(item)?`<button class="btn secondary compact" type="button" data-notification-action="${escapeHtml(item.id)}">${escapeHtml(item.actionLabel||'Abrir')}</button>`:'';return`<article class="alert-feed-item ${escapeHtml(item.severity)} ${item.read?'read':'unread'}"><div class="alert-feed-icon">${notificationIcon(item)}</div><div class="alert-feed-copy"><div class="alert-feed-meta"><span>${escapeHtml(notificationSourceLabel(item))}</span><span>${escapeHtml(notificationCategoryLabel(item.category))}</span><span>${escapeHtml(notificationSeverityLabel(item.severity))}</span><small>${escapeHtml(formatDateTime(item.createdAt))}</small></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><div class="alert-feed-actions">${item.read?'<span class="alert-read-state">✓ Lido</span>':`<button class="link-btn" type="button" data-notification-read="${escapeHtml(item.id)}">Marcar como lido</button>`}${action}</div></div></article>`}
  function publishedNotificationStatus(row){const n=alertEngine.normalizeInternal(row),now=Date.now(),start=new Date(n.startsAt).getTime(),end=n.expiresAt?new Date(n.expiresAt).getTime():Infinity;if(!n.active)return{key:'inactive',label:'Encerrada'};if(start>now)return{key:'scheduled',label:'Agendada'};if(end<=now)return{key:'expired',label:'Expirada'};return{key:'active',label:'Ativa'}}
  function renderPublishedNotifications(){
    const body=$('#publishedNotificationRows');if(!body||!isSuperAdmin()||!hasPermission('notifications.manage'))return;const rows=(state.internalNotifications||[]).map(alertEngine.normalizeInternal).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    body.innerHTML=rows.length?rows.slice(0,80).map(n=>{const status=publishedNotificationStatus(n),squad=notificationSquadCodeById(n.squadId),audience=alertEngine.audienceLabel(n,squad);return`<tr><td><div class="published-notification-title"><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(notificationCategoryLabel(n.category))}</small></div></td><td>${escapeHtml(audience)}</td><td><span class="notification-severity ${escapeHtml(n.severity)}">${escapeHtml(notificationSeverityLabel(n.severity))}</span></td><td>${escapeHtml(formatDateTime(n.startsAt))}</td><td>${n.expiresAt?escapeHtml(formatDateTime(n.expiresAt)):'Sem expiração'}</td><td><span class="published-status ${status.key}">${status.label}</span></td><td>${n.active?`<button class="link-btn danger-link" type="button" data-notification-archive="${escapeHtml(n.id)}">Encerrar</button>`:'—'}</td></tr>`}).join(''):'<tr><td colspan="7" class="muted">Nenhuma notificação interna publicada.</td></tr>';
  }
  function syncNotificationFilterState(){state.notificationFilters={status:$('#alertStatusFilter')?.value||'all',source:$('#alertSourceFilter')?.value||'all',severity:$('#alertSeverityFilter')?.value||'all',category:$('#alertCategoryFilter')?.value||'all',search:$('#alertSearchInput')?.value||''}}
  function renderAlertCenter(){
    if(!$('#view-alerts'))return;if(!state.notificationsLoaded&&!state.notificationsLoading)ensureNotificationsLoaded(false).catch(()=>{});
    const feed=personalNotificationFeed(),counts=alertEngine.counts(feed),filters=state.notificationFilters||{},filtered=alertEngine.filterFeed(feed,filters);
    if($('#alertKpiUnread'))$('#alertKpiUnread').textContent=fmtInt(counts.unread);if($('#alertKpiCritical'))$('#alertKpiCritical').textContent=fmtInt(counts.critical);if($('#alertKpiAutomatic'))$('#alertKpiAutomatic').textContent=fmtInt(counts.automatic);if($('#alertKpiInternal'))$('#alertKpiInternal').textContent=fmtInt(counts.internal);
    for(const [id,key] of [['alertStatusFilter','status'],['alertSourceFilter','source'],['alertSeverityFilter','severity'],['alertCategoryFilter','category']])if($('#'+id))$('#'+id).value=filters[key]||'all';if($('#alertSearchInput')&&document.activeElement!==$('#alertSearchInput'))$('#alertSearchInput').value=filters.search||'';
    if($('#alertFeedCount'))$('#alertFeedCount').textContent=`${filtered.length} ${filtered.length===1?'item':'itens'}`;if($('#alertCenterRows'))$('#alertCenterRows').innerHTML=filtered.map(notificationFeedItemHtml).join('')||'<div class="alert-center-empty"><strong>Nenhum item neste filtro.</strong><span>Altere os filtros ou aguarde um novo sinal da operação.</span></div>';
    const status=$('#alertCenterStatus');if(status){if(state.notificationsLoading)status.textContent='Atualizando notificações internas...';else if(state.notificationsError)status.textContent=`${state.notificationsError} Os alertas automáticos continuam funcionando normalmente.`;else status.textContent=state.supabase?'Notificações internas sincronizadas por usuário. Atualização automática a cada 60 segundos.':'Modo demonstração: notificações internas armazenadas neste navegador.';}
    if($('#alertMarkAllReadBtn'))$('#alertMarkAllReadBtn').disabled=!counts.unread;renderPublishedNotifications();refreshNotificationBadges();
  }
  function openNotificationComposer(){
    if(!requirePermission('notifications.manage'))return;$('#notificationComposerForm')?.reset();if($('#notificationStartsAtInput'))$('#notificationStartsAtInput').value=localDateTimeValue();if($('#notificationExpiresAtInput'))$('#notificationExpiresAtInput').value='';if($('#notificationActionLabelInput'))$('#notificationActionLabelInput').value='Abrir';if($('#notificationSquadInput'))$('#notificationSquadInput').innerHTML=Object.values(state.squads||{}).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${escapeHtml(s.dbId||s.code)}">Squad ${escapeHtml(s.code)} — ${escapeHtml(s.name||'')}</option>`).join('');syncNotificationAudienceField();if($('#notificationComposerStatus'))$('#notificationComposerStatus').textContent=state.supabase&&!state.notificationsRemoteAvailable?'Execute a MIGRACAO_V2.46.0.sql antes de publicar.':'A notificação ficará disponível no sino e na Central de Alertas.';openModal('notificationComposerModal');
  }
  function syncNotificationAudienceField(){const squad=$('#notificationAudienceInput')?.value==='squad';$('#notificationSquadField')?.classList.toggle('hidden',!squad)}
  async function publishInternalNotification(e){
    e?.preventDefault();if(!requirePermission('notifications.manage'))return;const title=$('#notificationTitleInput')?.value.trim(),message=$('#notificationMessageInput')?.value.trim(),audience=$('#notificationAudienceInput')?.value||'all',startsAt=dateInputIso($('#notificationStartsAtInput')?.value)||new Date().toISOString(),expiresAt=dateInputIso($('#notificationExpiresAtInput')?.value),actionRaw=$('#notificationActionInput')?.value||'';if(!title||!message)return toast('Informe título e mensagem.');if(expiresAt&&new Date(expiresAt)<=new Date(startsAt))return toast('A expiração precisa ser posterior ao início.');
    const [actionViewRaw,actionSectionRaw]=actionRaw.split(':'),squadChoice=$('#notificationSquadInput')?.value||null,squad=audience==='squad'?Object.values(state.squads||{}).find(x=>String(x.dbId||x.code)===String(squadChoice)):null;if(audience==='squad'&&!squad)return toast('Selecione o Squad destinatário.');
    const squadTargetId=audience==='squad'?(state.supabase?(squad?.dbId||null):(squad?.dbId||squad?.code||null)):null;if(audience==='squad'&&!squadTargetId)return toast('O Squad selecionado ainda não possui identificador disponível.');const now=new Date().toISOString(),payload={organization_id:state.user.organizationId||'demo',title,message,severity:$('#notificationSeverityInput')?.value||'info',category:$('#notificationCategoryInput')?.value||'announcement',audience_type:audience,squad_id:squadTargetId,action_view:actionViewRaw||null,action_section:actionSectionRaw||null,action_label:actionRaw?($('#notificationActionLabelInput')?.value.trim()||'Abrir'):null,starts_at:startsAt,expires_at:expiresAt,active:true,created_by:state.user.userId||null,updated_by:state.user.userId||null,created_at:now,updated_at:now};
    const btn=$('#notificationPublishBtn');if(btn){btn.disabled=true;btn.textContent='Publicando...';}
    try{let saved;if(state.supabase){if(!state.notificationsRemoteAvailable)throw new Error('Execute a MIGRACAO_V2.46.0.sql no Supabase.');const {data,error}=await state.supabase.from('internal_notifications').insert(payload).select('*').single();if(error)throw error;saved=data;}else{saved={...payload,id:`demo-notification-${Date.now()}-${Math.random().toString(36).slice(2,8)}`};saveDemoInternalNotifications([saved,...loadDemoInternalNotifications()]);}await logAuditEvent('notification.create',{entityType:'internal_notification',entityId:saved.id,squadId:squad?.dbId||null,description:`Notificação interna “${title}” publicada.`,afterData:{title,severity:payload.severity,category:payload.category,audienceType:audience,squad:squad?.code||null,startsAt,expiresAt},metadata:{actionView:payload.action_view,actionSection:payload.action_section}});closeModal('notificationComposerModal');state.notificationsLoaded=false;await ensureNotificationsLoaded(true);toast('Notificação publicada.');
    }catch(err){console.error(err);if($('#notificationComposerStatus'))$('#notificationComposerStatus').textContent=String(err?.message||err||'Não foi possível publicar.');toast('Não foi possível publicar a notificação.');}finally{if(btn){btn.disabled=false;btn.textContent='Publicar notificação';}}
  }
  async function archiveInternalNotification(id){
    if(!requirePermission('notifications.manage'))return;const row=(state.internalNotifications||[]).find(x=>String(x.id)===String(id));if(!row)return;if(!await confirmDialog(`Encerrar a notificação “${row.title}”? Ela deixará de aparecer para os destinatários.`,{title:'Encerrar notificação',confirmText:'Encerrar',tone:'warning'}))return;try{const now=new Date().toISOString();if(state.supabase){const {error}=await state.supabase.from('internal_notifications').update({active:false,updated_by:state.user.userId,updated_at:now}).eq('id',id);if(error)throw error;}else{const rows=loadDemoInternalNotifications().map(n=>String(n.id)===String(id)?{...n,active:false,updated_by:state.user.userId||null,updated_at:now}:n);saveDemoInternalNotifications(rows);}await logAuditEvent('notification.archive',{entityType:'internal_notification',entityId:id,squadId:row.squad_id||null,description:`Notificação interna “${row.title}” encerrada.`,beforeData:{active:row.active},afterData:{active:false}});state.notificationsLoaded=false;await ensureNotificationsLoaded(true);toast('Notificação encerrada.');}catch(err){console.error(err);toast('Não foi possível encerrar a notificação.');}
  }
  function handleNotificationDelegatedClick(e){const read=e.target.closest('[data-notification-read]');if(read){e.preventDefault();return markNotificationRead(notificationFeedItem(read.dataset.notificationRead));}const action=e.target.closest('[data-notification-action]');if(action){e.preventDefault();return openNotificationAction(action.dataset.notificationAction)}const archive=e.target.closest('[data-notification-archive]');if(archive){e.preventDefault();return archiveInternalNotification(archive.dataset.notificationArchive)}}
  async function handleHomeClick(e){
    const layoutAction=e.target.closest('[data-home-layout-action]');if(layoutAction){if(layoutAction.dataset.homeLayoutAction==='edit')beginHomeLayoutEdit();return;}
    const squadBtn=e.target.closest('[data-home-squad]');if(squadBtn){await selectSquad(squadBtn.dataset.homeSquad);showView('team');return;}
    const btn=e.target.closest('[data-home-view],[data-home-admin-section],[data-home-settings-module]');if(!btn)return;
    if(btn.dataset.homeSettingsModule){openSettingsModule(btn.dataset.homeSettingsModule);return;}
    const view=btn.dataset.homeView||'admin',section=btn.dataset.homeAdminSection||null;showView(view,section);
  }


  const TV_PLAYLIST_LOCAL_KEY='softenPresentationPlaylistsV240';
  const TV_DEVICE_LOCAL_KEY='softenPresentationDevicesV240';
  function tvLocalKey(base){return `${base}:${state.user?.organizationId||'demo'}`}
  function tvSquadCodeFromId(id){if(!id)return 'all';const row=Object.values(state.squads||{}).find(s=>String(s?.dbId||'')===String(id));return row?.code||'all'}
  function loadLocalTvRows(base,normalizer){try{const rows=JSON.parse(localStorage.getItem(tvLocalKey(base))||'[]');return(Array.isArray(rows)?rows:[]).map(normalizer)}catch(e){return[]}}
  function saveLocalTvRows(base,rows){try{localStorage.setItem(tvLocalKey(base),JSON.stringify(rows||[]))}catch(e){console.warn('Não foi possível salvar configuração local da TV.',e)}}
  function presentationPlaylistById(id){return(state.presentationPlaylists||[]).find(p=>String(p.id)===String(id))||null}
  function presentationDeviceById(id){return(state.presentationDevices||[]).find(d=>String(d.id)===String(id))||null}
  function playlistSquadId(config){const code=String(config?.squad||'all').toUpperCase();return code==='ALL'||code==='all'?null:(state.squads?.[code]?.dbId||null)}
  function allowedPresentationConfig(config){const cfg=clone(config||{});if(!isSuperAdmin())cfg.squad=state.user?.squadCode||state.squadCode||'D';return cfg}
  function tvOpsUnavailableMessage(err){const msg=String(err?.message||err||'');return /presentation_(playlists|devices)|get_presentation_device_config|touch_presentation_device|does not exist|schema cache/i.test(msg)}
  async function ensurePresentationOpsLoaded(force=false){
    if(!isAdmin()||!hasPermission('presentation.manage'))return[];
    if(state.presentationOpsLoaded&&!force){renderPresentationOpsAdminRows();return state.presentationPlaylists}
    if(state.presentationOpsLoading)return state.presentationOpsLoading;
    state.presentationOpsLoading=(async()=>{
      try{
        if(state.supabase){
          const [{data:pls,error:pe},{data:devs,error:de}]=await Promise.all([
            state.supabase.from('presentation_playlists').select('id,organization_id,squad_id,name,description,config,active,created_at,updated_at').order('name'),
            state.supabase.from('presentation_devices').select('id,organization_id,squad_id,playlist_id,device_key,name,location,active,last_seen_at,last_refresh_at,last_mode,connection_state,viewport,app_version,user_agent,created_at,updated_at').order('name')
          ]);if(pe)throw pe;if(de)throw de;
          state.presentationPlaylists=(pls||[]).map(row=>normalizeTvPlaylist({...row,squad:tvSquadCodeFromId(row.squad_id)}));state.presentationDevices=(devs||[]).map(row=>normalizeTvDevice({...row,squad:tvSquadCodeFromId(row.squad_id)}));state.presentationOpsRemote=true;
        }else{
          state.presentationPlaylists=loadLocalTvRows(TV_PLAYLIST_LOCAL_KEY,normalizeTvPlaylist);state.presentationDevices=loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice);state.presentationOpsRemote=false;
        }
        state.presentationOpsLoaded=true;renderPresentationOpsAdminRows();return state.presentationPlaylists;
      }catch(err){
        console.warn('Central de TVs usando fallback local. Execute a migração V2.40.0 para sincronização compartilhada.',err);
        state.presentationPlaylists=loadLocalTvRows(TV_PLAYLIST_LOCAL_KEY,normalizeTvPlaylist);state.presentationDevices=loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice);state.presentationOpsRemote=false;state.presentationOpsLoaded=true;renderPresentationOpsAdminRows();
        if(!tvOpsUnavailableMessage(err))toast('Monitoramento remoto das TVs indisponível; usando dados locais deste navegador.');return state.presentationPlaylists;
      }finally{state.presentationOpsLoading=null}
    })();return state.presentationOpsLoading;
  }
  function renderPresentationOpsAdmin(){if(!isAdmin()||!hasPermission('presentation.manage')||!$('#presentationPlaylistSelect'))return;renderPresentationOpsAdminRows();ensurePresentationOpsLoaded(false)}
  function renderPresentationOpsAdminRows(){
    const playlistSelect=$('#presentationPlaylistSelect'),devicePlaylist=$('#presentationDevicePlaylist'),rowsEl=$('#presentationDeviceRows');if(!playlistSelect||!devicePlaylist||!rowsEl)return;
    const playlists=(state.presentationPlaylists||[]).filter(p=>p.active!==false),selected=playlists.some(p=>String(p.id)===String(state.presentationPlaylistSelectedId))?String(state.presentationPlaylistSelectedId):'';
    playlistSelect.innerHTML='<option value="">Nova playlist</option>'+playlists.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} • ${escapeHtml(String(p.config?.squad||p.squad||'all').toUpperCase()==='ALL'?'Todos':`Squad ${p.config?.squad||p.squad}`)}</option>`).join('');playlistSelect.value=selected;
    devicePlaylist.innerHTML='<option value="">Selecione uma playlist</option>'+playlists.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
    if($('#presentationPlaylistCount'))$('#presentationPlaylistCount').textContent=`${playlists.length} ${playlists.length===1?'playlist':'playlists'}`;
    const summary=tvMonitorSummary(state.presentationDevices||[]);if($('#presentationMonitorTotal'))$('#presentationMonitorTotal').textContent=summary.total;if($('#presentationMonitorOnline'))$('#presentationMonitorOnline').textContent=summary.online;if($('#presentationMonitorAttention'))$('#presentationMonitorAttention').textContent=summary.attention;if($('#presentationMonitorOffline'))$('#presentationMonitorOffline').textContent=summary.offline+summary.never+summary.inactive;
    if($('#presentationPlaylistStatus'))$('#presentationPlaylistStatus').textContent=state.presentationOpsRemote?'Sincronizado no Supabase • alterações ficam disponíveis para todas as TVs.':'Modo local • execute a MIGRACAO_V2.40.0.sql para sincronizar playlists, TVs e status entre navegadores.';
    if(!state.presentationDevices?.length){rowsEl.innerHTML='<tr><td colspan="6" class="muted">Nenhuma TV cadastrada.</td></tr>';return;}
    rowsEl.innerHTML=state.presentationDevices.map(d=>{const status=tvDeviceStatus(d),pl=presentationPlaylistById(d.playlistId),url=buildTvDeviceUrl(window.location.href,d.deviceKey),playlistOptions=playlists.map(p=>`<option value="${escapeHtml(p.id)}" ${String(p.id)===String(d.playlistId)?'selected':''}>${escapeHtml(p.name)}</option>`).join('');return `<tr data-tv-device="${escapeHtml(d.id)}"><td><div class="tv-device-name"><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(d.location||d.deviceKey)}</small></div></td><td><select class="tv-device-playlist-select" data-tv-playlist-select><option value="">Sem playlist</option>${playlistOptions}</select></td><td><span class="tv-status-pill ${status.key}">${escapeHtml(status.label)}</span></td><td><div class="tv-device-meta">${escapeHtml(tvHumanAge(d.lastSeenAt))}${d.lastRefreshAt?`<br>dados ${escapeHtml(tvHumanAge(d.lastRefreshAt))}`:''}</div></td><td><div class="tv-device-meta"><strong>${escapeHtml(d.lastMode||'—')}</strong>${d.viewport?.width?`<br>${escapeHtml(`${d.viewport.width}×${d.viewport.height}`)}`:''}</div></td><td><div class="tv-device-actions"><button type="button" data-tv-action="save" title="Salvar playlist">Salvar</button><button type="button" data-tv-action="copy" data-tv-url="${escapeHtml(url)}">Copiar URL</button><button type="button" data-tv-action="open" data-tv-url="${escapeHtml(url)}">Abrir</button><button type="button" data-tv-action="toggle">${d.active?'Pausar':'Ativar'}</button><button type="button" data-tv-action="delete">Excluir</button></div></td></tr>`}).join('');
  }
  function selectPresentationPlaylist(id){state.presentationPlaylistSelectedId=id||null;const p=presentationPlaylistById(id);if($('#presentationPlaylistName'))$('#presentationPlaylistName').value=p?.name||'';if($('#presentationPlaylistDescription'))$('#presentationPlaylistDescription').value=p?.description||'';if($('#presentationPlaylistStatus'))$('#presentationPlaylistStatus').textContent=p?'Playlist selecionada. Use “Carregar no editor” para revisar as telas antes de alterar.':'Nova playlist: ajuste a configuração da TV acima e salve.';}
  function newPresentationPlaylistDraft(){state.presentationPlaylistSelectedId=null;$('#presentationPlaylistSelect').value='';$('#presentationPlaylistName').value='';$('#presentationPlaylistDescription').value='';$('#presentationPlaylistName').focus();if($('#presentationPlaylistStatus'))$('#presentationPlaylistStatus').textContent='Nova playlist: a configuração atual do editor será usada ao salvar.';}
  function loadSelectedPresentationPlaylist(){const p=presentationPlaylistById(state.presentationPlaylistSelectedId);if(!p)return toast('Selecione uma playlist.');window.SoftenPresentation?.loadAdminDraft?.(p.config||{});if($('#presentationPlaylistStatus'))$('#presentationPlaylistStatus').textContent=`${p.name} carregada no editor. Revise e salve para aplicar alterações.`;}
  async function savePresentationPlaylist(){
    if(!requirePermission('presentation.manage'))return;const name=String($('#presentationPlaylistName')?.value||'').trim(),description=String($('#presentationPlaylistDescription')?.value||'').trim();if(!name)return toast('Informe um nome para a playlist.');let config=allowedPresentationConfig(window.SoftenPresentation?.getFormConfig?.()||window.SoftenPresentation?.getConfig?.()||{});const existing=presentationPlaylistById(state.presentationPlaylistSelectedId),now=new Date().toISOString(),localId=existing?.id||`playlist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
    try{
      if(state.supabase&&state.presentationOpsRemote){const payload={organization_id:state.user.organizationId,squad_id:playlistSquadId(config),name,description,config,active:true,updated_by:state.user.userId,updated_at:now};let data,error;if(existing?.id){({data,error}=await state.supabase.from('presentation_playlists').update(payload).eq('id',existing.id).select('id').single());}else{payload.created_by=state.user.userId;({data,error}=await state.supabase.from('presentation_playlists').insert(payload).select('id').single());}if(error)throw error;state.presentationPlaylistSelectedId=data.id;}else{const rows=loadLocalTvRows(TV_PLAYLIST_LOCAL_KEY,normalizeTvPlaylist),next=normalizeTvPlaylist({id:localId,name,description,config,squad:config.squad,active:true,createdAt:existing?.createdAt||now,updatedAt:now});const ix=rows.findIndex(r=>String(r.id)===String(localId));if(ix>=0)rows[ix]=next;else rows.push(next);saveLocalTvRows(TV_PLAYLIST_LOCAL_KEY,rows);state.presentationPlaylistSelectedId=localId;}
      await logAuditEvent(existing?'presentation.playlist_update':'presentation.playlist_create',{entityType:'presentation_playlist',entityId:state.presentationPlaylistSelectedId,squadId:playlistSquadId(config),description:`Playlist ${name} ${existing?'atualizada':'criada'} para a Apresentação/TV.`,beforeData:existing||{},afterData:{name,description,config},metadata:{squad:config.squad}});state.presentationOpsLoaded=false;await ensurePresentationOpsLoaded(true);selectPresentationPlaylist(state.presentationPlaylistSelectedId);toast(existing?'Playlist atualizada.':'Playlist criada.');
    }catch(err){console.error(err);toast('Não foi possível salvar a playlist. Confira a migração V2.40.0.');}
  }
  async function deletePresentationPlaylist(){const p=presentationPlaylistById(state.presentationPlaylistSelectedId);if(!p)return toast('Selecione uma playlist.');const linked=(state.presentationDevices||[]).filter(d=>String(d.playlistId)===String(p.id)).length;if(!await confirmDialog(`Excluir a playlist ${p.name}? ${linked?`${linked} TV(s) ficarão sem playlist atribuída.`:'Nenhuma TV está vinculada a ela.'}`,{title:'Excluir playlist',confirmText:'Excluir',tone:'danger'}))return;try{if(state.supabase&&state.presentationOpsRemote){const {error}=await state.supabase.from('presentation_playlists').delete().eq('id',p.id);if(error)throw error;}else{saveLocalTvRows(TV_PLAYLIST_LOCAL_KEY,loadLocalTvRows(TV_PLAYLIST_LOCAL_KEY,normalizeTvPlaylist).filter(x=>String(x.id)!==String(p.id)));const devices=loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice).map(d=>String(d.playlistId)===String(p.id)?{...d,playlistId:null}:d);saveLocalTvRows(TV_DEVICE_LOCAL_KEY,devices);}await logAuditEvent('presentation.playlist_delete',{entityType:'presentation_playlist',entityId:p.id,squadId:playlistSquadId(p.config),description:`Playlist ${p.name} excluída.`,beforeData:p,afterData:{deleted:true},metadata:{linkedDevices:linked}});state.presentationPlaylistSelectedId=null;state.presentationOpsLoaded=false;newPresentationPlaylistDraft();await ensurePresentationOpsLoaded(true);toast('Playlist excluída.');}catch(err){console.error(err);toast('Não foi possível excluir a playlist.');}}
  async function createPresentationDevice(){
    if(!requirePermission('presentation.manage'))return;const name=String($('#presentationDeviceName')?.value||'').trim(),location=String($('#presentationDeviceLocation')?.value||'').trim(),playlistId=$('#presentationDevicePlaylist')?.value||'',playlist=presentationPlaylistById(playlistId);if(!name)return toast('Informe o nome da TV.');if(!playlist)return toast('Selecione uma playlist para a TV.');const deviceKey=generateTvDeviceKey('tv'),config=allowedPresentationConfig(playlist.config||{}),now=new Date().toISOString(),localId=`device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
    try{let id=localId;if(state.supabase&&state.presentationOpsRemote){const payload={organization_id:state.user.organizationId,squad_id:playlistSquadId(config),playlist_id:playlist.id,device_key:deviceKey,name,location,active:true,connection_state:'unknown',created_by:state.user.userId,updated_by:state.user.userId,created_at:now,updated_at:now};const {data,error}=await state.supabase.from('presentation_devices').insert(payload).select('id').single();if(error)throw error;id=data.id;}else{const rows=loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice);rows.push(normalizeTvDevice({id,deviceKey,name,location,playlistId:playlist.id,squad:config.squad,active:true,createdAt:now,updatedAt:now}));saveLocalTvRows(TV_DEVICE_LOCAL_KEY,rows);}await logAuditEvent('presentation.device_create',{entityType:'presentation_device',entityId:id,squadId:playlistSquadId(config),description:`TV ${name} cadastrada com a playlist ${playlist.name}.`,afterData:{name,location,playlistId:playlist.id,deviceKey},metadata:{playlist:playlist.name,squad:config.squad}});$('#presentationDeviceName').value='';$('#presentationDeviceLocation').value='';state.presentationOpsLoaded=false;await ensurePresentationOpsLoaded(true);const url=buildTvDeviceUrl(window.location.href,deviceKey);try{await navigator.clipboard.writeText(url);toast('TV cadastrada e URL copiada.');}catch(e){toast('TV cadastrada. Use “Copiar URL” na tabela.');}}
    catch(err){console.error(err);toast('Não foi possível cadastrar a TV. Confira a migração V2.40.0.');}
  }
  async function handlePresentationDeviceAction(e){const btn=e.target.closest('[data-tv-action]');if(!btn)return;const row=btn.closest('[data-tv-device]'),device=presentationDeviceById(row?.dataset.tvDevice);if(!device)return;const action=btn.dataset.tvAction;if(action==='copy'){const url=btn.dataset.tvUrl||buildTvDeviceUrl(window.location.href,device.deviceKey);try{await navigator.clipboard.writeText(url);toast('URL da TV copiada.');}catch(err){window.prompt('Copie a URL da TV:',url)}return;}if(action==='open'){window.open(btn.dataset.tvUrl||buildTvDeviceUrl(window.location.href,device.deviceKey),'_blank','noopener');return;}if(action==='save'){const playlistId=row.querySelector('[data-tv-playlist-select]')?.value||null;await updatePresentationDevice(device,{playlistId});return;}if(action==='toggle'){await updatePresentationDevice(device,{active:!device.active});return;}if(action==='delete'){if(!await confirmDialog(`Excluir a TV ${device.name}? A URL cadastrada deixará de ser monitorada.`,{title:'Excluir TV',confirmText:'Excluir',tone:'danger'}))return;await deletePresentationDevice(device);}}
  async function updatePresentationDevice(device,changes={}){const playlist=changes.playlistId?presentationPlaylistById(changes.playlistId):null,config=playlist?.config||{},next={...device,...changes,playlistId:changes.playlistId===undefined?device.playlistId:changes.playlistId,squad:playlist?config.squad:device.squad,updatedAt:new Date().toISOString()};try{if(state.supabase&&state.presentationOpsRemote){const payload={playlist_id:next.playlistId||null,squad_id:next.playlistId?playlistSquadId(config):playlistSquadId({squad:device.squad}),active:next.active,updated_by:state.user.userId,updated_at:next.updatedAt};const {error}=await state.supabase.from('presentation_devices').update(payload).eq('id',device.id);if(error)throw error;}else{const rows=loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice),ix=rows.findIndex(d=>String(d.id)===String(device.id));if(ix>=0)rows[ix]=normalizeTvDevice(next);saveLocalTvRows(TV_DEVICE_LOCAL_KEY,rows);}await logAuditEvent('presentation.device_update',{entityType:'presentation_device',entityId:device.id,squadId:playlistSquadId(playlist?.config||{squad:device.squad}),description:`TV ${device.name} atualizada.`,beforeData:device,afterData:next});state.presentationOpsLoaded=false;await ensurePresentationOpsLoaded(true);toast('TV atualizada.');}catch(err){console.error(err);toast('Não foi possível atualizar a TV.');}}
  async function deletePresentationDevice(device){try{if(state.supabase&&state.presentationOpsRemote){const {error}=await state.supabase.from('presentation_devices').delete().eq('id',device.id);if(error)throw error;}else saveLocalTvRows(TV_DEVICE_LOCAL_KEY,loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice).filter(d=>String(d.id)!==String(device.id)));await logAuditEvent('presentation.device_delete',{entityType:'presentation_device',entityId:device.id,squadId:playlistSquadId({squad:device.squad}),description:`TV ${device.name} excluída do monitoramento.`,beforeData:device,afterData:{deleted:true}});state.presentationOpsLoaded=false;await ensurePresentationOpsLoaded(true);toast('TV excluída.');}catch(err){console.error(err);toast('Não foi possível excluir a TV.');}}
  function routeBundleSignature(bundle){try{return JSON.stringify({d:bundle?.device?.id||bundle?.device?.device_key||'',p:bundle?.playlist?.id||'',u:bundle?.playlist?.updated_at||'',c:bundle?.playlist?.config||{}})}catch(e){return''}}
  async function fetchPresentationRouteBundle(){const key=String(PRESENTATION_ROUTE.tv||'').trim();if(!key)return null;if(state.supabase){const {data,error}=await state.supabase.rpc('get_presentation_device_config',{p_device_key:key});if(error)throw error;return data||null;}const devices=loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice),device=devices.find(d=>d.deviceKey===key&&d.active);if(!device)return null;const playlist=loadLocalTvRows(TV_PLAYLIST_LOCAL_KEY,normalizeTvPlaylist).find(p=>String(p.id)===String(device.playlistId)&&p.active);return{device,playlist};}
  function applyPresentationRouteBundle(bundle){if(!bundle)return null;const device=normalizeTvDevice(bundle.device||{}),playlist=bundle.playlist?normalizeTvPlaylist(bundle.playlist):null;state.presentationRouteDevice=device;state.presentationRoutePlaylist=playlist;const config=playlist?.config?allowedPresentationConfig(playlist.config):allowedPresentationConfig({...window.SoftenPresentation?.getConfig?.(),squad:device.squad});window.SoftenPresentation?.applyConfig?.(config);PRESENTATION_ROUTE.squad=config.squad||device.squad||PRESENTATION_ROUTE.squad;PRESENTATION_ROUTE.playlist=playlist?.id||device.playlistId||'';state.presentationRouteConfigSignature=routeBundleSignature(bundle);return config;}
  async function preparePresentationRouteContext(){if(!PRESENTATION_ROUTE.tv)return;try{const bundle=await fetchPresentationRouteBundle();if(bundle)applyPresentationRouteBundle(bundle);else console.warn('TV cadastrada não encontrada ou inativa; mantendo parâmetros da URL.');}catch(err){console.warn('Não foi possível carregar a configuração dinâmica da TV. Mantendo a configuração disponível na URL/local.',err);}}
  async function refreshPresentationRouteConfig(){if(!PRESENTATION_ROUTE.tv)return false;try{const bundle=await fetchPresentationRouteBundle();if(!bundle)return false;const sig=routeBundleSignature(bundle);if(sig===state.presentationRouteConfigSignature)return false;const config=applyPresentationRouteBundle(bundle),target=String(config?.squad||'all');if(isSuperAdmin()&&target!==state.squadCode&&(['all',...Object.keys(state.squads)].includes(target)))await selectSquad(target);return true;}catch(err){console.warn('Falha ao verificar atualização da playlist da TV.',err);return false}}
  async function persistPresentationHeartbeat(detail){const key=String(detail?.deviceKey||PRESENTATION_ROUTE.tv||'').trim();if(!key||!state.user)return;const payload=buildTvHeartbeatPayload({mode:detail.mode,lastRefreshAt:detail.lastRefreshAt,connectionState:detail.connectionState,viewport:detail.viewport,appVersion:'2.43.2',playlistId:detail.playlistId||PRESENTATION_ROUTE.playlist});payload.user_agent=navigator.userAgent||'';try{if(state.supabase){const {error}=await state.supabase.rpc('touch_presentation_device',{p_device_key:key,p_payload:{last_refresh_at:payload.last_refresh_at,last_mode:payload.last_mode,connection_state:payload.connection_state,viewport:payload.viewport,app_version:payload.app_version,user_agent:payload.user_agent}});if(error)throw error;}else{const rows=loadLocalTvRows(TV_DEVICE_LOCAL_KEY,normalizeTvDevice),ix=rows.findIndex(d=>d.deviceKey===key);if(ix>=0){rows[ix]=normalizeTvDevice({...rows[ix],lastSeenAt:new Date().toISOString(),lastRefreshAt:payload.last_refresh_at||rows[ix].lastRefreshAt,lastMode:payload.last_mode,connectionState:payload.connection_state,viewport:payload.viewport,appVersion:payload.app_version,userAgent:payload.user_agent});saveLocalTvRows(TV_DEVICE_LOCAL_KEY,rows);}}}catch(err){if(!tvOpsUnavailableMessage(err))console.warn('Heartbeat da TV não pôde ser registrado.',err)}}

  function presentationDailyRows(){
    const source=buildOrgTechnicianDailyOverviewFromState();
    const rows=source.filter(r=>dateBetween(r.date||isoDateParts(r.year,r.month,r.day))&&(state.squadCode==='all'||r.squadCode===state.squadCode));
    return rows.map(r=>({
      date:r.date||isoDateParts(r.year,r.month,r.day),
      technician:r.technicianName,
      group:r.squadCode,
      quantity:safe(r.att),
      notes:{5:safe(r.notes5),4:safe(r.notes4),3:safe(r.notes3),2:safe(r.notes2),1:safe(r.notes1)}
    }));
  }
  function renderPresentation(){
    const rows=presentationDailyRows();
    const title=state.squadCode==='all'?'Todos os Squads':`Squad ${state.squadCode}`;
    const subtitle=state.squadCode==='all'?'Ranking consolidado dos Squads carregados no Performance Hub.':'Ranking do Squad usando o histórico diário já armazenado no dashboard.';
    const syncDate=state.presentationLastSyncAt?new Date(state.presentationLastSyncAt):new Date(),time=syncDate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    window.SoftenPresentation?.render({rows,title,subtitle,periodLabel:analysisRangeLabel(),updatedLabel:`Fonte: Performance Hub • ${rows.length} registros diários • sincronizado ${time}`,refreshedAt:syncDate.toISOString(),refresh:refreshPresentationData});
    const direct=!!PRESENTATION_ROUTE.enabled;window.SoftenPresentation?.setDirectMode(direct);if($('#presentationExitDirectBtn'))$('#presentationExitDirectBtn').classList.toggle('hidden',!direct);
  }
  async function refreshPresentationData(){
    if(!state.user)throw new Error('Sessão indisponível.');
    await refreshPresentationRouteConfig();
    if(!state.supabase){state.presentationLastSyncAt=new Date().toISOString();renderPresentation();return {updated:true,source:'local'}}
    const backup={squads:state.squads,orgOverview:state.orgOverview,orgTechnicianOverview:state.orgTechnicianOverview,orgDailyOverview:state.orgDailyOverview,orgTechnicianDailyOverview:state.orgTechnicianDailyOverview,theme:state.theme,currentId:state.currentId,techName:state.techName};
    try{
      await loadSupabaseData();
      if(state.squadCode!=='all'){
        const squad=state.squads[state.squadCode];
        if(!squad)throw new Error(`Squad ${state.squadCode} não está mais disponível.`);
        const ids=Object.keys(squad.months||{}).sort().reverse();
        if(!ids.includes(state.currentId))state.currentId=ids[0]||null;
        const month=state.currentId?squad.months[state.currentId]:null;
        if(month&&!month.technicians.some(t=>samePersonName(t.name,state.techName)))state.techName=month.technicians[0]?.name||'';
        const refreshedTheme=resolveLegacyTheme(squad.theme||loadThemeForSquad(state.squadCode));
        if(refreshedTheme){state.theme=refreshedTheme;applyTheme(state.theme)}
      }
      state.presentationLastSyncAt=new Date().toISOString();refreshSelectors();renderPresentation();
      return {updated:true,at:state.presentationLastSyncAt};
    }catch(err){
      state.squads=backup.squads;state.orgOverview=backup.orgOverview;state.orgTechnicianOverview=backup.orgTechnicianOverview;state.orgDailyOverview=backup.orgDailyOverview;state.orgTechnicianDailyOverview=backup.orgTechnicianDailyOverview;state.theme=backup.theme;state.currentId=backup.currentId;state.techName=backup.techName;
      throw err;
    }
  }
  async function copyPresentationUrl(){
    const cfg=window.SoftenPresentation?.getConfig?.(),target=cfg?.squad||state.squadCode;const url=window.SoftenPresentation?.directUrl(target,cfg)||window.location.href;
    try{await navigator.clipboard.writeText(url);toast('URL da apresentação copiada.')}catch(e){window.prompt('Copie a URL da apresentação:',url)}
  }
  function openPresentationUrl(){const cfg=window.SoftenPresentation?.getConfig?.(),target=cfg?.squad||state.squadCode,url=window.SoftenPresentation?.directUrl(target,cfg)||window.location.href;window.open(url,'_blank','noopener');}
  async function togglePresentationFullscreen(){try{if(document.fullscreenElement)await window.SoftenPresentation?.exitFullscreen();else await window.SoftenPresentation?.requestFullscreen();}catch(e){toast('O navegador bloqueou o modo tela cheia.')}}
  function exitDirectPresentation(){window.location.href=window.SoftenPresentation?.normalUrl()||window.location.pathname;}

  function renderIndividual(){
    const m=currentMonth(),t=currentTech();if(!m||!t)return;const periodRows=gameRankingRowsForCurrentPeriod(),periodFromRanking=periodRows.find(r=>samePersonName(r.name,t.name)),localPeriod=periodTechnicianForCurrent(),period={...(periodFromRanking||localPeriod||{name:t.name,att:0,notes5:0,totalEval:0,avg:0,evalPct:0}),evaluationExcludedAtt:safe(localPeriod?.evaluationExcludedAtt),eligibleAtt:safe(localPeriod?.eligibleAtt)||safe(periodFromRanking?.att),daily:localPeriod?.daily||[]},periodGoal=periodGoalForTechnician(t);
    const attPct=t.goalAtt?safe(t.att)/t.goalAtt:0,notePct=t.goalEval?safe(t.notes5)/t.goalEval:0,hasGoals=safe(t.goalAtt)>0&&safe(t.goalEval)>0;
    const audit=technicianStatusAudit(t,m),rules=audit.rules,periodRefs=periodRows.length?scoreRefsFromRows(periodRows):rules;
    $('#heroName').textContent=firstName(t.name);$('#heroStatus').textContent=t.status?`STATUS ${t.status}`:(hasGoals?overallLabel(attPct,notePct):'METAS PENDENTES');$('#heroStatus').style.color=String(t.status).toUpperCase()==='ACIMA'?'var(--success)':String(t.status).toUpperCase()==='ABAIXO'?'var(--danger)':(hasGoals?overallColor(attPct,notePct):'var(--warn)');$('#heroMessage').textContent='Acompanhe seu ritmo mensal e, logo abaixo, o desempenho do período selecionado.';
    $('#sourceFile').textContent=`Competência oficial: ${m.monthName} ${m.year}`;$('#individualPeriodLabel').textContent=analysisRangeLabel();
    $('#rankNumber').textContent=period.periodRank?`#${period.periodRank}`:'—';$('#rankContext').textContent=`de ${periodRows.length} no período • Squad ${state.squadCode}`;
    const remainingDays=Math.max(1,businessDaysRemaining(m.year,m.month,m.latestDay)),attNeed=Math.max(0,safe(t.goalAtt)-safe(t.att)),notesNeed=Math.max(0,safe(t.goalEval)-safe(t.notes5)),attDailyNeed=attNeed/remainingDays,notesDailyNeed=notesNeed/remainingDays;
    $('#monthlyRhythmPeriod').textContent=`${String(m.monthName).toUpperCase()} ${m.year}`;$('#monthlyAttCurrent').textContent=fmtInt(t.att);$('#monthlyAttGoal').textContent=safe(t.goalAtt)>0?fmtInt(t.goalAtt):'—';$('#monthlyNotesCurrent').textContent=fmtInt(t.notes5);$('#monthlyNotesGoal').textContent=safe(t.goalEval)>0?fmtInt(t.goalEval):'—';$('#monthlyAttBar').style.width=clamp(attPct*100,0,100)+'%';$('#monthlyNotesBar').style.width=clamp(notePct*100,0,100)+'%';$('#monthlyAttDailyNeed').textContent=attDailyNeed.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});$('#monthlyNotesDailyNeed').textContent=notesDailyNeed.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});const rhythmStatus=$('#monthlyRhythmStatus');rhythmStatus.classList.toggle('complete',attPct>=1&&notePct>=1);rhythmStatus.classList.toggle('in-progress',!(attPct>=1&&notePct>=1));rhythmStatus.querySelector('span').textContent=!hasGoals?'Metas mensais ainda não configuradas':attPct>=1&&notePct>=1?'Meta mensal atingida':'Ainda em andamento — meta mensal não atingida';
    $('#kpiAtt').textContent=fmtInt(period.att);$('#kpiAttGoal').textContent=periodGoal.att?fmtInt(periodGoal.att):'—';$('#attBar').style.width=clamp((periodGoal.att?period.att/periodGoal.att:0)*100,0,100)+'%';$('#attProgress').textContent=periodGoal.att?`${fmtPct(period.att/periodGoal.att)} da meta do período`:'—';$('#attRemaining').textContent=periodGoal.att?(period.att>=periodGoal.att?`+${fmtInt(period.att-periodGoal.att)} acima do esperado`:`Faltam ${fmtInt(periodGoal.att-period.att)} no período`):'Sem meta proporcional';if($('#kpiAttMonthlyGoal'))$('#kpiAttMonthlyGoal').textContent=safe(t.goalAtt)>0?fmtInt(t.goalAtt):'—';if($('#kpiAttMonthProgress'))$('#kpiAttMonthProgress').textContent=safe(t.goalAtt)>0?`${fmtInt(t.att)} de ${fmtInt(t.goalAtt)} • ${fmtPct(attPct)}`:'—';
    $('#kpiNotes').textContent=fmtInt(period.notes5);$('#kpiNotesGoal').textContent=periodGoal.notes5?fmtInt(periodGoal.notes5):'—';$('#noteBar').style.width=clamp((periodGoal.notes5?period.notes5/periodGoal.notes5:0)*100,0,100)+'%';$('#noteProgress').textContent=periodGoal.notes5?`${fmtPct(period.notes5/periodGoal.notes5)} da meta do período`:'—';$('#noteRemaining').textContent=periodGoal.notes5?(period.notes5>=periodGoal.notes5?`+${fmtInt(period.notes5-periodGoal.notes5)} acima do esperado`:`Faltam ${fmtInt(periodGoal.notes5-period.notes5)} no período`):'Sem meta proporcional';if($('#kpiNotesMonthlyGoal'))$('#kpiNotesMonthlyGoal').textContent=safe(t.goalEval)>0?fmtInt(t.goalEval):'—';if($('#kpiNotesMonthProgress'))$('#kpiNotesMonthProgress').textContent=safe(t.goalEval)>0?`${fmtInt(t.notes5)} de ${fmtInt(t.goalEval)} • ${fmtPct(notePct)}`:'—';
    $('#kpiEvalPct').textContent=fmtPct(period.evalPct);$('#evalCount').textContent=`${fmtInt(period.totalEval)} avaliações no período${safe(period.evaluationExcludedAtt)>0?` • ${fmtInt(period.evaluationExcludedAtt)} atend. sem avaliação descontados`:''}`;$('#avgRating').textContent=`Média ${safe(period.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;const evalTarget=periodGoal.evalPct||teamSettings(m).teamGoalEvalPct;if($('#kpiEvalMonthlyGoal'))$('#kpiEvalMonthlyGoal').textContent=evalTarget>0?fmtPct(evalTarget):'—';if($('#evalPeriodBar'))$('#evalPeriodBar').style.width=clamp((evalTarget?period.evalPct/evalTarget:0)*100,0,100)+'%';const evalDiff=(safe(period.evalPct)-safe(evalTarget))*100;$('#evalQuality').textContent=`Diferença: ${evalDiff>=0?'+':''}${evalDiff.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p.`;$('#evalQuality').style.color=evalDiff>=0?'var(--success)':'var(--danger)';
    const avgReference=safe(periodRefs.refAvg)||safe(rules.refAvg),avgAbove=safe(period.avg)>=avgReference;$('#kpiAvgRating').textContent=safe(period.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});$('#avgRatingBar').style.width=clamp((safe(period.avg)/5)*100,0,100)+'%';$('#avgRatingStatus').textContent=avgAbove?'Acima da referência do período':'Abaixo da referência do período';$('#avgRatingStatus').style.color=avgAbove?'var(--success)':'var(--danger)';$('#avgRatingReference').textContent=`Ref. do período ${avgReference.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    $('#kpiPoints').textContent=fmtNum(t.points);$('#goalsHit').textContent=`${fmtInt(t.goalsHit)}/4 critérios • acumulado ${fmtNum(cumulativePointsForTech(t))} pts`;if($('#pointsStatusFoot')){$('#pointsStatusFoot').textContent=`Status oficial ${t.status||'—'}`;$('#pointsStatusFoot').style.color=String(t.status).toUpperCase()==='ACIMA'?'var(--success)':String(t.status).toUpperCase()==='ABAIXO'?'var(--danger)':'var(--muted)'}if($('#pointsRankFoot'))$('#pointsRankFoot').textContent=t.rank?`Ranking mensal #${t.rank}`:'Ranking mensal —';
    $('#attGoalPct').textContent=fmtPct(attPct);$('#noteGoalPct').textContent=fmtPct(notePct);$('#attGoalText').textContent=goalLine('atendimentos',t.att,t.goalAtt);$('#noteGoalText').textContent=goalLine('notas',t.notes5,t.goalEval);
    $('#goalOrb').style.background=overallColor(attPct,notePct);$('#goalOrb').style.boxShadow=`0 0 18px ${overallColor(attPct,notePct)}`;const coach=coachText(t,m,attPct,notePct);$('#coachTitle').textContent=coach.title;$('#coachText').textContent=coach.text;
    renderStatusAudit(t,m,audit);renderFinanceSummary(t,m);renderGamification(t,m,attPct,notePct);renderChart(period,m,true);renderDaily(period,m,true);renderMiniRankingPeriod(periodRows,t.name);renderFinanceRanking(m,t.name);
  }

  function technicianStatusAudit(t,m){
    const rules=displayScoreRules(m),criteria=[
      {key:'att',label:'Atendimentos',value:safe(t.att),ref:safe(rules.refAtt),format:v=>fmtNum(v),source:rules.attSource||'Referência do mês'},
      {key:'eval',label:'Total de avaliações',value:safe(t.totalEval),ref:safe(rules.refTotalEval),format:v=>fmtNum(v),source:rules.evalSource||'Referência do mês'},
      {key:'avg',label:'Nota média',value:safe(t.avg),ref:safe(rules.refAvg),format:v=>safe(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),source:rules.avgSource||'Referência do mês'},
      {key:'pct',label:'% avaliado',value:safe(t.evalPct),ref:safe(rules.refEvalPct),format:v=>fmtPct(v),source:rules.pctSource||'Referência do mês'}
    ];
    const active=safe(t.att)>0;criteria.forEach(c=>c.hit=active&&c.value>=c.ref);
    const hits=criteria.filter(c=>c.hit).length;return{rules,criteria,hits,status:active?(hits>=2?'ACIMA':'ABAIXO'):''};
  }
  function renderStatusAudit(t,m,audit=technicianStatusAudit(t,m)){
    const badge=$('#auditStatusBadge'),word=$('#auditStatusWord');if(!badge||!word)return;
    word.textContent=audit.status;badge.textContent=audit.status;badge.classList.toggle('above',audit.status==='ACIMA');badge.classList.toggle('below',audit.status==='ABAIXO');
    const r=audit.rules,progressText=m.isClosed?'mês fechado':'médias atuais do Squad';
    $('#auditExplainer').textContent=m.isClosed?'Referências congeladas no fechamento do mês.':'O status usa sempre as médias atuais do próprio Squad, exatamente como a planilha. A cada importação essas quatro referências são recalculadas.';
    $('#statusAuditGrid').innerHTML=audit.criteria.map(c=>`<div class="audit-item ${c.hit?'hit':'miss'}"><div class="audit-top"><strong>${escapeHtml(c.label)}</strong><span class="audit-check">${c.hit?'✓':'✕'}</span></div><div class="audit-values"><b>${c.format(c.value)}</b><span>vs ${c.format(c.ref)}</span></div><small>${escapeHtml(c.source)}</small></div>`).join('');
    $('#statusAuditFooter').innerHTML=audit.status?`<strong>${audit.hits}/4 critérios atendidos → ${audit.status}.</strong> Referência: ${progressText}. ${m.isClosed?'Os valores não mudam mais até o mês ser reaberto.':'2 ou mais critérios = ACIMA; 0 ou 1 = ABAIXO.'}`:'<strong>Sem status.</strong> O técnico ainda não possui atendimentos no mês.';
  }

  function renderGamification(t,m,attPct,notePct){
    const levels=[{min:0,name:'Recruta'},{min:250,name:'Explorador'},{min:400,name:'Guardião'},{min:550,name:'Mestre'},{min:700,name:'Lenda'}];
    let idx=0;for(let i=0;i<levels.length;i++)if(safe(t.points)>=levels[i].min)idx=i;
    const cur=levels[idx],next=levels[Math.min(idx+1,levels.length-1)],toNext=idx===levels.length-1?1:clamp((safe(t.points)-cur.min)/(next.min-cur.min),0,1);
    const rhythm=clamp(((attPct+notePct)/2)*100,0,100);$('#xpRing').style.setProperty('--p',rhythm);$('#xpPercent').textContent=Math.round(rhythm)+'%';$('#levelBadge').textContent=`NÍVEL ${idx+1}`;$('#levelName').textContent=cur.name;$('#levelBar').style.width=(toNext*100)+'%';$('#nextLevelText').textContent=idx===levels.length-1?'Nível máximo da campanha':`Faltam ${fmtInt(next.min-safe(t.points))} pts para ${next.name}`;$('#levelText').textContent=`${fmtNum(t.points)} pontos no mês • ranking #${t.rank||'—'} do Squad ${state.squadCode}.`;
    let mission;if(attPct>=1&&notePct>=1)mission=['Defenda sua posição','As duas metas foram atingidas. Sustente qualidade e volume até o fechamento.'];else if(attPct<notePct)mission=['Conquiste atendimentos',goalLine('atendimentos',t.att,t.goalAtt)];else mission=['Busque notas 5',goalLine('notas',t.notes5,t.goalEval)];$('#missionTitle').textContent=mission[0];$('#missionText').textContent=mission[1];
    const productive=(t.daily||[]).filter(d=>d.day<=m.latestDay&&!d.off&&safe(d.att)>=10).length;
    const badges=[
      {icon:'🏆',name:'Top 3',desc:'Ranking do Squad',ok:safe(t.rank)>0&&safe(t.rank)<=3},
      {icon:'⭐',name:'Qualidade',desc:'Média ≥ 4,95',ok:safe(t.avg)>=4.95},
      {icon:'%',name:'Avaliações',desc:`≥ ${fmtPct(teamSettings(m).teamGoalEvalPct)}`,ok:safe(t.evalPct)>=teamSettings(m).teamGoalEvalPct},
      {icon:'☎',name:'Volume',desc:'Meta de atend.',ok:attPct>=1},
      {icon:'◆',name:'Notas 5',desc:'Meta de notas',ok:notePct>=1},
      {icon:'🔥',name:'Constância',desc:'3 dias com 10+',ok:productive>=3}
    ];
    $('#achievementBadges').innerHTML=badges.map(b=>`<div class="achievement ${b.ok?'unlocked':'locked'}"><i>${b.icon}</i><b>${b.name}</b><span>${b.ok?'CONQUISTADO':b.desc}</span></div>`).join('');
  }

  function renderChart(t,m,periodMode=false){
    const el=$('#dailyChart');if(!el)return;
    const data=(periodMode?(t.daily||[]):(t.daily||[]).filter(d=>d.day<=Math.max(m.latestDay||31,1)&&!d.off)).filter(d=>!d.off);
    if(!data.length){el.innerHTML='<div class="muted">Sem lançamentos diários disponíveis no período.</div>';return;}
    el.classList.add('interactive-chart','chart-modern','daily-premium-chart');
    const prefs=currentChartPreferences(),visual=chartEngineLineVisual(prefs),chartId=nextChartRenderId('daily'),w=720,h=configuredChartHeight(230),p={l:34,r:16,t:15,b:30};
    const maxVal=Math.max(5,...data.flatMap(d=>[safe(d.att),safe(d.notes5)]));
    const x=i=>p.l+(data.length<=1?(w-p.l-p.r)/2:i*(w-p.l-p.r)/(data.length-1));
    const y=v=>p.t+(h-p.t-p.b)-(safe(v)/maxVal)*(h-p.t-p.b),baseline=h-p.b;
    const attPoints=data.map((d,i)=>({x:x(i),y:y(d.att),index:i,value:safe(d.att)}));
    const notePoints=data.map((d,i)=>({x:x(i),y:y(d.notes5),index:i,value:safe(d.notes5)}));
    const yTicks=[0,.25,.5,.75,1].map(f=>{const yy=p.t+(1-f)*(h-p.t-p.b),v=Math.round(maxVal*f);return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" class="grid-line"/><text x="2" y="${yy+4}" class="axis-label">${v}</text>`}).join('');
    const step=Math.max(1,Math.ceil(data.length/8));
    const labels=data.map(d=>periodMode?String(d.date||'').slice(5).replace('-','/'):String(d.day).padStart(2,'0'));
    const xLabels=labels.map((label,i)=>i%step===0?`<text x="${x(i)-10}" y="${h-7}" class="axis-label">${escapeHtml(label)}</text>`:'').join('');
    const zones=data.map((_,i)=>{const span=data.length<=1?(w-p.l-p.r):(w-p.l-p.r)/(data.length-1),zx=data.length<=1?p.l:Math.max(p.l,x(i)-span/2),zw=data.length<=1?w-p.l-p.r:(i===0||i===data.length-1?span/2:span);return `<rect x="${zx}" y="${p.t}" width="${zw}" height="${h-p.t-p.b}" class="chart-hover-zone" data-chart-index="${i}"></rect>`}).join('');
    const rulers=data.map((_,i)=>`<line x1="${x(i)}" y1="${p.t}" x2="${x(i)}" y2="${baseline}" class="chart-ruler" data-ruler-index="${i}"></line>`).join('');
    const dots=(points,color,seriesIndex)=>points.map(pt=>`<circle cx="${pt.x}" cy="${pt.y}" r="${visual.pointRadius}" fill="${color}" class="chart-point chart-series-shape" style="--series-color:${color}" data-series-index="${seriesIndex}" data-point-index="${pt.index}"></circle>`).join('');
    const pointLabels=(points,color,offset)=>points.map((pt,i)=>chartLabelVisible(i,points.length)?chartDataLabelSvg(pt.x,Math.max(p.t+11,pt.y+offset),fmtInt(pt.value),{color,compact:true}):'').join('');
    const defs=`<defs>${svgSeriesGradient(`${chartId}-att`,'var(--accent)',.24)}${svgSeriesGradient(`${chartId}-note`,'var(--success)',.12)}</defs>`;
    el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${defs}${yTicks}<path d="${smoothAreaPath(attPoints,baseline)}" fill="url(#${chartId}-att)" class="chart-series-area"></path><path d="${smoothAreaPath(notePoints,baseline)}" fill="url(#${chartId}-note)" class="chart-series-area secondary-area"></path><path d="${smoothSvgPath(attPoints)}" class="att-line chart-series-line chart-series-shape" style="--series-color:var(--accent);stroke-width:${visual.lineWidth}" data-series-index="0"></path><path d="${smoothSvgPath(notePoints)}" class="note-line chart-series-line chart-series-shape" style="--series-color:var(--success);stroke-width:${visual.lineWidth}" data-series-index="1"></path>${dots(attPoints,'var(--accent)',0)}${dots(notePoints,'var(--success)',1)}${pointLabels(attPoints,'var(--accent)',-9)}${pointLabels(notePoints,'var(--success)',14)}${rulers}${zones}${xLabels}</svg>`;
    bindSharedChartTooltip(el,{labels,entriesForIndex:i=>[
      {name:'Atendimentos',value:safe(data[i]?.att),text:fmtInt(data[i]?.att),color:'var(--accent)'},
      {name:'Notas 5',value:safe(data[i]?.notes5),text:fmtInt(data[i]?.notes5),color:'var(--success)'}
    ]});
  }
  function renderDaily(t,m,periodMode=false){const rows=(periodMode?(t.daily||[]):(t.daily||[]).filter(d=>d.day<=m.latestDay)).filter(d=>!d.off&&(d.att||d.notes5||d.notes4||d.notes3||d.notes2||d.notes1)).sort((a,b)=>periodMode?String(b.date).localeCompare(String(a.date)):b.day-a.day);const avgAtt=rows.length?rows.reduce((sum,d)=>sum+safe(d.att),0)/rows.length:0;$('#dailySummary').textContent=`Média do recorte: ${avgAtt.toLocaleString('pt-BR',{maximumFractionDigits:1})} atend./dia`;$('#dailyRows').innerHTML=rows.map(d=>{const totalEval=safe(d.notes5)+safe(d.notes4)+safe(d.notes3)+safe(d.notes2)+safe(d.notes1),pct=d.att?totalEval/safe(d.att):0,goal=periodMode&&m?((currentTech()?.goalAtt||0)/Math.max(1,businessDaysMonFri(m.year,m.month))):avgAtt,pace=safe(d.att)>=goal?'good':safe(d.att)>=goal*.72?'mid':'low',label=pace==='good'?'FORTE':pace==='mid'?'OK':'ATENÇÃO',labelDate=periodMode?parseIsoAnalysisDate(d.date)?.toLocaleDateString('pt-BR'):`${String(d.day).padStart(2,'0')}/${String(m.month).padStart(2,'0')}`;return `<tr><td><strong>${labelDate}</strong></td><td>${fmtInt(d.att)}</td><td>${fmtInt(d.notes5)}</td><td>${fmtPct(pct)}</td><td><span class="pace ${pace}">${label}</span></td></tr>`}).join('')||'<tr><td colspan="5" class="muted">Nenhum lançamento diário encontrado no período.</td></tr>'}
  function renderMiniRankingPeriod(list,selected){const el=$('#miniRanking');if(!el)return;if(isTechnician()&&state.supabase&&state.gameRankingLoading[gameRankingCacheKey()]){el.innerHTML='<div class="muted finance-ranking-loading">Carregando ranking do Squad...</div>';return}el.innerHTML=(list||[]).slice(0,8).map(t=>{const vacationMonths=t.vacationMonths||technicianVacationMonths(currentSquad(),t.name);return `<div class="rank-row ${samePersonName(t.name,selected)?'selected':''}"><span class="rank-pos">${t.periodRank||'—'}</span><div><strong>${escapeHtml(shortName(t.name))}${vacationBadgeHtml(vacationMonths,{compact:true})}${groupCountBadgeHtml(t.excludeFromGroupCount,{compact:true})}</strong><small>${fmtInt(t.att)} atend. • ${fmtInt(t.notes5)} notas 5</small></div><span class="rank-score">${fmtNum(t.periodPoints)} pts*</span></div>`}).join('')||'<div class="muted">Sem dados do ranking no período.</div>';}

  function localFinanceRankingRows(m){
    return (m?.technicians||[]).map(t=>({technicianName:t.name,amount:safe(t.financeData?.final),model:financeModelForMonth(m)})).sort((a,b)=>safe(b.amount)-safe(a.amount)||String(a.technicianName).localeCompare(String(b.technicianName),'pt-BR')).map((r,i)=>({...r,rank:i+1}));
  }
  async function loadFinanceRankingForTechnician(m){
    if(!state.supabase||!isTechnician()||!m)return;const key=`${state.squadCode}|${m.id}`;if(state.financeRankingCache[key]||state.financeRankingLoading[key])return;state.financeRankingLoading[key]=true;
    try{const {data,error}=await state.supabase.rpc('get_my_squad_finance_ranking',{p_year:m.year,p_month:m.month});if(error)throw error;state.financeRankingCache[key]=(data||[]).map(r=>({technicianName:r.technician_name,amount:safe(r.amount),rank:safe(r.ranking)||null,model:r.finance_model||financeModelForMonth(m)}));}
    catch(err){console.warn('Ranking financeiro do Squad indisponível. Confira a migração V2.20.0.',err);state.financeRankingCache[key]=[];}finally{delete state.financeRankingLoading[key];if(currentMonth()?.id===m.id)renderFinanceRanking(m,state.techName)}
  }
  function renderFinanceRanking(m,selected){
    const el=$('#financeRanking'),label=$('#financeRankingModel');if(!el||!m)return;const key=`${state.squadCode}|${m.id}`;let rows;
    if(isTechnician()&&state.supabase){rows=state.financeRankingCache[key];if(!rows){el.innerHTML='<div class="muted finance-ranking-loading">Carregando valores do Squad...</div>';loadFinanceRankingForTechnician(m);return}}else rows=localFinanceRankingRows(m);
    if(label)label.textContent=`${financeModelLabel(financeModelForMonth(m))} • ${m.monthName}`;
    el.innerHTML=(rows||[]).map((r,i)=>`<div class="rank-row ${samePersonName(r.technicianName,selected)?'selected':''}"><span class="rank-pos">${r.rank||i+1}</span><div><strong>${escapeHtml(shortName(r.technicianName))}</strong><small>${m.isClosed?'Valor final da competência':'Valor oficial estimado'}</small></div><span class="rank-score finance-rank-value">${fmtMoney(r.amount)}</span></div>`).join('')||'<div class="muted">Nenhum valor financeiro disponível.</div>';
  }

  function renderTeam(){
    const all=state.squadCode==='all';$('#allSquadsPanel').classList.toggle('hidden',!all);$('#singleSquadPanel').classList.toggle('hidden',all);if(all){renderPortfolioPeriod();renderTeamSquadOverview();renderTeamOrgDailyComparison();return}
    const m=currentMonth();if(!m)return;const periodRows=periodTechniciansForSquad(currentSquad()),totals=deriveTotals(periodRows),cfg=teamSettings(m),periodGoal=periodTeamGoal(currentSquad()),attProgress=periodGoal?totals.att/periodGoal:0,evalProgress=cfg.teamGoalEvalPct?totals.evalPct/cfg.teamGoalEvalPct:0;
    const avgPoints=periodRows.length?meanOf(periodRows,t=>t.periodPoints):0,teamStatus=teamStatusFromTechnicianStatuses(periodRows,{period:true}),aboveCount=teamStatus.aboveCount,ratio=teamStatus.ratio,periodStatus=teamStatus.status||'—';
    const teamResultBox=$('#teamResult')?.closest('.team-result');$('#teamResult').textContent=periodStatus;if(teamResultBox){teamResultBox.classList.toggle('above',periodStatus==='ACIMA');teamResultBox.classList.toggle('below',periodStatus==='ABAIXO');teamResultBox.classList.toggle('neutral',!['ACIMA','ABAIXO'].includes(periodStatus))}$('#teamAtt').textContent=fmtInt(totals.att);$('#teamAttGoal').textContent=fmtInt(periodGoal);$('#teamEval').textContent=fmtInt(totals.eval);$('#teamPct').textContent=fmtPct(totals.evalPct);$('#teamPctGoal').textContent=fmtPct(cfg.teamGoalEvalPct);$('#teamAttBar').style.width=clamp(attProgress*100,0,100)+'%';$('#teamPctBar').style.width=clamp(evalProgress*100,0,100)+'%';$('#teamAttNote').textContent=`${analysisRangeLabel()} • ${fmtPct(attProgress)} da meta proporcional`;$('#teamPctNote').textContent=(totals.evalPct>=cfg.teamGoalEvalPct?`${((totals.evalPct-cfg.teamGoalEvalPct)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p. acima da meta`:`Faltam ${((cfg.teamGoalEvalPct-totals.evalPct)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p. para a meta`)+(safe(totals.evaluationExcludedAtt)>0?` • ${fmtInt(totals.evaluationExcludedAtt)} atend. sem avaliação descontados`:'');$('#teamHeroTitle').textContent=`Squad ${state.squadCode} • ${analysisRangeLabel()}`;
    $('#teamAvgPoints').textContent=fmtNum(avgPoints);$('#teamAvgPointsNote').textContent='Pontuação média do período • não define o status da equipe';$('#teamStatusAudit').textContent=teamStatus.count?`${aboveCount} de ${teamStatus.count} técnicos com produção estão ACIMA • ${fmtPct(ratio)} • mínimo 50%`:'Sem técnicos classificados no período';
    $('#teamLeaderboard').innerHTML=periodRows.map(t=>`<div class="leader-item ${t.periodRank===1?'top1':''}"><div class="place">#${t.periodRank||'—'}</div><div class="name">${escapeHtml(t.name)}${vacationBadgeHtml(t.vacationMonths,{compact:true})}${groupCountBadgeHtml(t.excludeFromGroupCount,{compact:true})}</div><div class="metric"><span>Atend.</span><strong>${fmtInt(t.att)}</strong></div><div class="metric"><span>Notas 5</span><strong>${fmtInt(t.notes5)}</strong></div><div class="metric hide-md"><span>% Aval.</span><strong>${fmtPct(t.evalPct)}</strong></div><div class="metric points"><span>Pontos período*</span><strong>${fmtNum(t.periodPoints)}</strong></div><div><span class="status ${String(t.periodStatus).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(t.periodStatus||'—')}</span></div></div>`).join('')||'<div class="muted">Sem dados no período selecionado.</div>';
    renderTeamHistoricalAnalytics(currentSquad());renderTeamSquadOverview();renderTeamOrgDailyComparison();
  }
  function renderPortfolioPeriod(){
    $('#squadPortfolio').innerHTML=Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>{const rows=periodTechniciansForSquad(s),totals=deriveTotals(rows);if(!rows.length)return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status-line">SEM DADOS</span></div><h3>${escapeHtml(s.name)}</h3><div class="squad-empty">Sem produção no período selecionado.</div></article>`;const teamStatus=teamStatusFromTechnicianStatuses(rows,{period:true}),status=teamStatus.status||'—';return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status ${status==='ACIMA'?'above':status==='ABAIXO'?'below':''}">${status}</span></div><h3>${escapeHtml(s.name)}</h3><div class="status-line">${analysisRangeLabel()} • ${rows.length} técnicos</div><div class="squad-summary"><div><span>Atend.</span><strong>${fmtInt(totals.att)}</strong></div><div><span>Aval.</span><strong>${fmtInt(totals.eval)}</strong></div><div><span>% Aval.</span><strong>${fmtPct(totals.evalPct)}</strong></div></div></article>`}).join('');$$('[data-squad-card]').forEach(el=>el.addEventListener('click',()=>selectSquad(el.dataset.squadCard)));
  }

  function renderPortfolio(){
    $('#squadPortfolio').innerHTML=Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code)).map(s=>{const ids=Object.keys(s.months||{}).sort().reverse(),m=ids.length?s.months[ids[0]]:null;if(!m)return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status-line">SEM DADOS</span></div><h3>${escapeHtml(s.name)}</h3><div class="squad-empty">Aguardando a primeira importação.</div></article>`;const totals=m.teamTotals||deriveTotals(m.technicians);return `<article class="card squad-card" data-squad-card="${s.code}"><div class="squad-card-head"><div class="squad-letter">${s.code}</div><span class="status ${String(m.teamResult).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(m.teamResult||'—')}</span></div><h3>${escapeHtml(s.name)}</h3><div class="status-line">${m.monthName} ${m.year} • ${m.technicians.length} técnicos</div><div class="squad-summary"><div><span>Atend.</span><strong>${fmtInt(totals.att)}</strong></div><div><span>Aval.</span><strong>${fmtInt(totals.eval)}</strong></div><div><span>% Aval.</span><strong>${fmtPct(totals.evalPct)}</strong></div></div></article>`}).join('');
    $$('[data-squad-card]').forEach(el=>el.addEventListener('click',()=>selectSquad(el.dataset.squadCard)));
  }


function indicatorScopeSquads(){
  if(state.squadCode==='all') return Object.values(state.squads).sort((a,b)=>a.code.localeCompare(b.code));
  return [currentSquad()].filter(Boolean);
}
function monthLabelFromId(id){
  if(!id)return '—';
  const [y,m]=String(id).split('-').map(Number);
  return `${MONTHS_PT[(m||1)-1]} ${y}`;
}
function indicatorMonthIds(squads=indicatorScopeSquads()){
  const set=new Set();
  squads.forEach(s=>Object.keys(s?.months||{}).forEach(id=>set.add(id)));
  return [...set].sort();
}
function indicatorRangeIds(monthIds){
  if(!monthIds.length){state.indicatorStartId=null;state.indicatorEndId=null;return [];}
  if(!state.indicatorEndId||!monthIds.includes(state.indicatorEndId)) state.indicatorEndId=monthIds[monthIds.length-1];
  if(!state.indicatorStartId||!monthIds.includes(state.indicatorStartId)) state.indicatorStartId=monthIds[Math.max(0,monthIds.length-3)]||monthIds[0];
  let startIndex=monthIds.indexOf(state.indicatorStartId), endIndex=monthIds.indexOf(state.indicatorEndId);
  if(startIndex===-1) startIndex=0;
  if(endIndex===-1) endIndex=monthIds.length-1;
  if(startIndex>endIndex){startIndex=endIndex;state.indicatorStartId=monthIds[startIndex];}
  return monthIds.slice(startIndex,endIndex+1);
}
function fillIndicatorSelect(el,monthIds,selected){
  if(!el)return;
  el.innerHTML=monthIds.map(id=>`<option value="${id}" ${id===selected?'selected':''}>${escapeHtml(monthLabelFromId(id))}</option>`).join('');
  el.disabled=!monthIds.length;
}
function renderIndicatorSafely(label,renderFn,targetIds=[]){
  try{
    renderFn();
    return true;
  }catch(error){
    console.error(`[Indicadores] Falha ao renderizar ${label}:`,error);
    (targetIds||[]).forEach(id=>{
      const el=$('#'+id);
      if(el)el.innerHTML='<div class="chart-empty">Não foi possível renderizar este gráfico. Atualize a página e tente novamente.</div>';
    });
    return false;
  }
}

function setIndicatorSection(section,{history='push'}={}){
  const allowed=new Set(['performance','quality','financial-impact','business-days','detail']);
  state.indicatorSection=allowed.has(section)?section:'performance';
  if(state.currentView==='indicators'){syncTopFiltersForView('indicators',state.adminSection);renderIndicators();}
  updateBreadcrumbs();if(history!=='none')syncPersistentUrl({replace:history==='replace'});
}
function syncIndicatorSectionUi(){
  const section=state.indicatorSection;
  $$('#view-indicators [data-indicator-section]').forEach(btn=>{const active=btn.dataset.indicatorSection===section;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false')});
  if($('#indicatorPerformancePanel'))$('#indicatorPerformancePanel').classList.toggle('hidden',section!=='performance');
  if($('#indicatorQualityPanel'))$('#indicatorQualityPanel').classList.toggle('hidden',section!=='quality');
  if($('#indicatorFinancialImpactPanel'))$('#indicatorFinancialImpactPanel').classList.toggle('hidden',section!=='financial-impact');
  if($('#indicatorBusinessDaysPanel'))$('#indicatorBusinessDaysPanel').classList.toggle('hidden',section!=='business-days');
  if($('#indicatorDetailPanel'))$('#indicatorDetailPanel').classList.toggle('hidden',section!=='detail');
  if($('#indicatorPerformanceActions'))$('#indicatorPerformanceActions').classList.toggle('hidden',section!=='performance');
  if($('#indicatorGlobalToolbar'))$('#indicatorGlobalToolbar').classList.toggle('hidden',section==='business-days'||section==='financial-impact');
  syncTopFiltersForView('indicators',state.adminSection);
  const titles={performance:'Indicadores gerais',quality:'Indicadores de qualidade','financial-impact':'Impacto financeiro da qualidade','business-days':'Comparativo por dias úteis',detail:'Detalhamento de qualidade'};
  const texts={performance:'Leitura consolidada para o Administrador com calendário diário, visão semanal/mensal, produtividade por tempo trabalhado e histórico comparativo entre técnicos ou Squads.',quality:'Serviço, Produto e Empresa analisados separadamente, preservando a origem de cada avaliação e os gráficos usados na reunião semanal.','financial-impact':'Leitura corporativa da qualidade em valores estimados, sem armazenar clientes individualmente. O cálculo usa clientes ativos, ticket médio e um CSV previamente deduplicado.','business-days':'Compare competências diferentes usando o mesmo número de dias úteis, sem colocar um mês parcial contra outro mês completo.',detail:'Identifique os técnicos com maior acúmulo de notas baixas de Serviço, Produto e Empresa dentro do período selecionado.'};
  if($('#indicatorHeroTitle'))$('#indicatorHeroTitle').textContent=titles[section]||titles.performance;
  if($('#indicatorHeroText'))$('#indicatorHeroText').textContent=texts[section]||texts.performance;
}

function renderIndicators(){
  if(!isSuperAdmin()||!$('#view-indicators'))return;syncAnalysisDateControls();const squads=indicatorScopeSquads(),rangeIds=analysisMonthIds().filter(id=>indicatorMonthIds(squads).includes(id));
  $('#indicatorScopeTitle').textContent=state.squadCode==='all'?'Todos os Squads':`Squad ${state.squadCode}`;$('#indicatorScopeText').textContent=state.squadCode==='all'?'Comparativo consolidado entre todos os grupos disponíveis.':`Leitura executiva aprofundada do Squad ${state.squadCode}.`;$('#indicatorPeriodLabel').textContent=analysisRangeLabel();syncIndicatorSectionUi();
  if(state.indicatorSection==='financial-impact'){if($('#indicatorScopeTitle'))$('#indicatorScopeTitle').textContent='Suporte técnico completo';if($('#indicatorScopeText'))$('#indicatorScopeText').textContent='Visão corporativa sem divisão por Squad e sem armazenamento de clientes individuais.';renderFinancialImpactIndicators();return;}
  if(state.indicatorSection==='quality'){renderQualityIndicators(squads,rangeIds);return;}
  if(state.indicatorSection==='business-days'){renderBusinessDaysIndicators(squads);return;}
  if(state.indicatorSection==='detail'){renderDetailIndicators(squads,rangeIds);return;}
  renderIndicatorSafely('consolidado por Squad',()=>renderIndicatorSquadOverview(rangeIds),['indicatorSquadAttendanceChart','indicatorSquadEvaluationChart']);renderIndicatorSafely('ritmo diário do setor',()=>renderIndicatorOrgDailyComparison(rangeIds),['indicatorOrgDailyChart']);
  if(!rangeIds.length){renderPredictiveManagement([]);['indicatorStatusChart','indicatorMonthlyChart','indicatorWeeklyChart','indicatorHistoryAttChart','indicatorHistoryDailyAvgChart','indicatorHistoryEvalChart'].forEach(id=>{if($('#'+id))$('#'+id).innerHTML='<div class="chart-empty">Não há dados no período selecionado.</div>';});if($('#indicatorInsights'))$('#indicatorInsights').innerHTML='<div class="insight-item"><strong>Sem dados</strong><small>Escolha um período com dados importados.</small></div>';return;}
  renderIndicatorSafely('gestão preditiva',()=>renderPredictiveManagement(squads),['predictiveKpis','predictiveAlerts','predictiveSquadRows','predictiveRiskRows']);
  const palette=['var(--accent)','var(--success)','#78b7ff','#ef5a29','#b18cff'],statusItems=[];let totalAtt=0,totalNotes5=0,totalEval=0,totalWorkedDays=0,totalPoints=0,totalTechRecords=0,totalAbove=0,totalBelow=0,squadMonthHits=0,squadMonthTotal=0;const distinctTechs=new Set(),techTotals=new Map();
  const dailySeries=[];
  squads.forEach((squad,sIndex)=>{const periodRows=periodTechniciansForSquad(squad);const totals=deriveTotals(periodRows);totalAtt+=totals.att;totalEval+=totals.eval;totalNotes5+=periodRows.reduce((sum,t)=>sum+safe(t.notes5),0);totalPoints+=periodRows.reduce((sum,t)=>sum+safe(t.periodPoints),0);totalTechRecords+=periodRows.length;const above=periodRows.filter(t=>String(t.periodStatus||t.status||'').toUpperCase()==='ACIMA').length,below=periodRows.filter(t=>String(t.periodStatus||t.status||'').toUpperCase()==='ABAIXO').length,teamStatus=teamStatusFromTechnicianStatuses(periodRows,{period:true});totalAbove+=above;totalBelow+=below;periodRows.forEach(t=>{distinctTechs.add(`${squad.code}|${nameLinkKey(t.name)}`);const key=`${squad.code}|${nameLinkKey(t.name)}`,prev=techTotals.get(key)||{name:t.name,squad:squad.code,points:0,months:1,evalPct:0};prev.points=safe(t.periodPoints);prev.evalPct=safe(t.evalPct);techTotals.set(key,prev);totalWorkedDays+=(t.daily||[]).filter(d=>isBusinessDateIso(d.date)).length;});if(teamStatus.count){squadMonthTotal++;if(teamStatus.status==='ACIMA')squadMonthHits++;}
    const byDate=new Map();periodRows.forEach(t=>(t.daily||[]).forEach(d=>{const b=byDate.get(d.date)||{att:0,eval:0};b.att+=safe(d.att);b.eval+=safe(d.notes5)+safe(d.notes4)+safe(d.notes3)+safe(d.notes2)+safe(d.notes1);byDate.set(d.date,b)}));const labels=analysisDateLabels();dailySeries.push({squad:squad.code,color:palette[sIndex%palette.length],evalValues:labels.map(x=>{const b=byDate.get(x.date);return b&&b.att?(b.eval/b.att)*100:null;})});
  });
  rangeIds.forEach(id=>{let above=0,below=0;squads.forEach(s=>{const m=s.months?.[id];if(!m)return;(m.technicians||[]).forEach(t=>{if(String(t.status).toUpperCase()==='ACIMA')above++;else if(String(t.status).toUpperCase()==='ABAIXO')below++;});});statusItems.push({label:monthLabelFromId(id),above,below});});
  const totalHours=totalWorkedDays*8,totalMinutes=totalHours*60,attPerHour=totalHours?totalAtt/totalHours:0,attPerMinute=totalMinutes?totalAtt/totalMinutes:0,aboveRatio=(totalAbove+totalBelow)?totalAbove/(totalAbove+totalBelow):0,excellence=totalAtt?totalNotes5/totalAtt:0,avgPointsPerTech=totalTechRecords?totalPoints/totalTechRecords:0;$('#indicatorAttPerHour').textContent=fmtNum(attPerHour);$('#indicatorAttPerMinute').textContent=`${fmtNum(attPerMinute)} por minuto`;$('#indicatorWorkedHours').textContent=`${fmtInt(totalHours)} horas consideradas entre ${analysisRangeLabel()}`;$('#indicatorAboveRatio').textContent=fmtPct(aboveRatio);$('#indicatorAboveCount').textContent=`${fmtInt(totalAbove)} acima • ${fmtInt(totalBelow)} abaixo`;$('#indicatorTechVolume').textContent=`${fmtInt(totalTechRecords)} técnicos com produção no período`;const periodAbove=squadMonthHits,periodBelow=Math.max(0,squadMonthTotal-squadMonthHits),periodStatus=periodAbove>periodBelow?'ACIMA':periodBelow>periodAbove?'ABAIXO':'EMPATE';$('#indicatorPeriodStatus').textContent=periodStatus;$('#indicatorPeriodStatus').className=periodStatus==='ACIMA'?'period-status-above':periodStatus==='ABAIXO'?'period-status-below':'period-status-tie';$('#indicatorPeriodStatusDetail').textContent=`${fmtInt(periodAbove)} equipes acima • ${fmtInt(periodBelow)} abaixo`;$('#indicatorPeriodStatusSupport').textContent=`Status das equipes calculado pela proporção de técnicos ACIMA (2 de 4 critérios), sem usar pontuação média.`;$('#indicatorExcellence').textContent=fmtPct(excellence);$('#indicatorAvgPoints').textContent=`${fmtNum(avgPointsPerTech)} pts simulados médios no período`;$('#indicatorExcellenceSupport').textContent=`${fmtInt(distinctTechs.size)} técnicos únicos no período`;
  renderIndicatorSafely('status oficial por competência',()=>renderTechnicianStatusMatrix($('#indicatorStatusChart'),squads,rangeIds),['indicatorStatusChart']);
  const competencyEvalLabels=rangeIds.map(shortHistoryMonth),competencyEvalSeries=squads.map((squad,sIndex)=>({name:`Squad ${squad.code}`,color:palette[sIndex%palette.length],values:rangeIds.map(id=>{const rows=squad.months?.[id]?.technicians||[];const totals=deriveTotals(rows);return totals.att?totals.evalPct*100:null;})}));renderIndicatorSafely('% de avaliação por grupo',()=>{renderIndicatorLineChart($('#indicatorMonthlyChart'),competencyEvalLabels,competencyEvalSeries,{maxValue:100,percent:true,height:340,fitWidth:true});$('#indicatorMonthlyLegend').textContent=rangeIds.length===1?'Taxa de avaliação da competência selecionada por Squad.':`Comparativo por competência entre ${monthLabelFromId(rangeIds[0])} e ${monthLabelFromId(rangeIds[rangeIds.length-1])}.`;},['indicatorMonthlyChart']);
  const weekly=weeklyBucketsForAnalysis(squads);renderIndicatorSafely('avaliação semanal por grupo',()=>{renderIndicatorLineChart($('#indicatorWeeklyChart'),weekly.labels,weekly.series,{maxValue:100,percent:true});$('#indicatorWeeklyNote').textContent=`Semanas construídas entre ${analysisRangeLabel()} • avaliações totais ÷ atendimentos.`;},['indicatorWeeklyChart']);
  const techList=[...techTotals.values()],bestTech=techList.sort((a,b)=>safe(b.points)-safe(a.points))[0];let bestSquad={code:'—',score:-1};squads.forEach(s=>{const rows=periodTechniciansForSquad(s),tot=deriveTotals(rows);if(tot.evalPct>bestSquad.score)bestSquad={code:s.code,score:tot.evalPct};});const strongestMonth=[...statusItems].sort((a,b)=>(b.above-b.below)-(a.above-a.below))[0],weakestMonth=[...statusItems].sort((a,b)=>(a.above-a.below)-(b.above-b.below))[0];$('#indicatorInsights').innerHTML=`<div class="insight-item"><strong>Squad destaque</strong><small>${bestSquad.code==='—'?'Sem base suficiente.':`Squad ${bestSquad.code} lidera em % de avaliação com ${fmtPct(bestSquad.score)} no período.`}</small></div><div class="insight-item"><strong>Técnico destaque do período</strong><small>${bestTech?`${escapeHtml(titleWords(bestTech.name))} • Squad ${escapeHtml(bestTech.squad)} • ${fmtNum(bestTech.points)} pts simulados.`:'Sem dados suficientes.'}</small></div><div class="insight-item"><strong>Status mensal oficial</strong><small>${strongestMonth?`${escapeHtml(strongestMonth.label)} teve o melhor saldo entre ACIMA e ABAIXO dentre as competências tocadas pelo filtro.`:'Sem dados suficientes.'}</small></div><div class="insight-item"><strong>Ponto de atenção</strong><small>${weakestMonth?`${escapeHtml(weakestMonth.label)} teve o menor saldo mensal oficial dentro do período.`:'Sem dados suficientes.'}</small></div>`;
  renderIndicatorSafely('ranking financeiro',()=>renderIndicatorFinanceRanking(squads,rangeIds),['indicatorFinanceRanking']);renderIndicatorSafely('histórico analítico',()=>renderIndicatorHistoricalAnalytics(squads,rangeIds),['indicatorHistoryAttChart','indicatorHistoryDailyAvgChart','indicatorHistoryEvalChart']);
}


function predictiveGoalSummary(squad,month){
  if(!squad||!month)return{att:0,notes5:0,evalPct:0};
  const settings=teamSettings(month),notes5=(month.technicians||[]).reduce((sum,t)=>sum+safe(t.goalEval),0);
  return{att:safe(settings.teamGoalAtt),notes5,evalPct:safe(settings.teamGoalEvalPct)};
}
function predictiveSquadMonthData(squad,id){
  const month=squad?.months?.[id];if(!month)return null;
  const totalDays=Math.max(1,businessDaysMonFri(month.year,month.month)),elapsedDays=Math.max(0,businessDaysElapsed(month.year,month.month,month.latestDay)),official=deriveTotals(month.technicians||[]),officialNotes5=(month.technicians||[]).reduce((sum,t)=>sum+safe(t.notes5),0),summary={att:official.att,eligibleAtt:official.eligibleAtt,evalRate:official.evalPct,service:{total:official.eval,notes5:officialNotes5}},goals=predictiveGoalSummary(squad,month),prevId=predictiveEngine.previousMonthId(id),prev=prevId&&squad.months?.[prevId]?businessDaysMonthSummary([squad],prevId,Math.max(1,elapsedDays)):null;
  const att=predictiveEngine.countMetric({realized:summary.att,goal:goals.att,elapsedDays,totalDays}),notes5=predictiveEngine.countMetric({realized:safe(summary.service?.notes5),goal:goals.notes5,elapsedDays,totalDays}),evaluation=predictiveEngine.rateMetric({realized:safe(summary.evalRate),goal:goals.evalPct});
  const risk=(month.technicians||[]).map(t=>predictiveEngine.technicianRisk({name:t.name,squad:squad.code,att:t.att,notes5:t.notes5,evalPct:t.evalPct,goalAtt:t.goalAtt,goalNotes5:t.goalEval,goalEvalPct:goals.evalPct,elapsedDays,totalDays}));
  return{code:squad.code,id,month,elapsedDays,totalDays,summary,goals,att,notes5,evaluation,previous:prev,risk,confidence:predictiveEngine.confidence(elapsedDays,totalDays)};
}
function predictiveScopeData(squads){
  const ids=indicatorMonthIds(squads);if(!ids.length)return null;
  const preferred=monthIdForDate(state.analysisEndDate),id=preferred&&ids.includes(preferred)?preferred:ids[ids.length-1],rows=(squads||[]).map(s=>predictiveSquadMonthData(s,id)).filter(Boolean);if(!rows.length)return null;
  const elapsedDays=Math.max(...rows.map(r=>r.elapsedDays),0),totalDays=Math.max(...rows.map(r=>r.totalDays),1),realAtt=rows.reduce((s,r)=>s+r.att.realized,0),goalAtt=rows.reduce((s,r)=>s+r.att.goal,0),projectedAtt=rows.reduce((s,r)=>s+r.att.projection,0),realNotes=rows.reduce((s,r)=>s+r.notes5.realized,0),goalNotes=rows.reduce((s,r)=>s+r.notes5.goal,0),projectedNotes=rows.reduce((s,r)=>s+r.notes5.projection,0),evalCount=rows.reduce((s,r)=>s+safe(r.summary.service?.total),0),eligibleAtt=rows.reduce((s,r)=>s+safe(r.summary.eligibleAtt),0),evalPct=eligibleAtt?evalCount/eligibleAtt:0,weightedEvalGoal=rows.reduce((s,r)=>s+(r.goals.evalPct*Math.max(1,r.goals.att)),0)/Math.max(1,rows.reduce((s,r)=>s+Math.max(1,r.goals.att),0));
  const attendance={...predictiveEngine.countMetric({realized:realAtt,goal:goalAtt,elapsedDays,totalDays}),projection:projectedAtt,projectedCompletion:goalAtt?projectedAtt/goalAtt:0};
  attendance.status=goalAtt?(realAtt>=goalAtt?'achieved':attendance.projectedCompletion>=1?'on_track':attendance.projectedCompletion>=.9?'attention':'critical'):'neutral';
  const notes5={...predictiveEngine.countMetric({realized:realNotes,goal:goalNotes,elapsedDays,totalDays}),projection:projectedNotes,projectedCompletion:goalNotes?projectedNotes/goalNotes:0};
  notes5.status=goalNotes?(realNotes>=goalNotes?'achieved':notes5.projectedCompletion>=1?'on_track':notes5.projectedCompletion>=.9?'attention':'critical'):'neutral';
  const evaluation=predictiveEngine.rateMetric({realized:evalPct,goal:weightedEvalGoal});
  const prevAtt=rows.reduce((s,r)=>s+safe(r.previous?.att),0),prevEvalCount=rows.reduce((s,r)=>s+safe(r.previous?.service?.total),0),prevEligible=rows.reduce((s,r)=>s+safe(r.previous?.att),0),prevEval=prevEligible?prevEvalCount/prevEligible:0;
  const attendanceComparison=predictiveEngine.compare(realAtt,prevAtt),evaluationComparison=predictiveEngine.compare(evalPct,prevEval,{points:true}),risk=rows.flatMap(r=>r.risk).sort((a,b)=>b.score-a.score||String(a.name).localeCompare(String(b.name),'pt-BR')),atRisk=risk.filter(x=>x.score>=2),confidence=predictiveEngine.confidence(elapsedDays,totalDays),alerts=predictiveEngine.buildAlerts({attendance,notes5,evaluation,attendanceComparison,evaluationComparison,atRiskTechnicians:atRisk.length,totalTechnicians:risk.length,confidenceLevel:confidence.level});
  return{id,label:monthLabelFromId(id),rows,elapsedDays,totalDays,attendance,notes5,evaluation,attendanceComparison,evaluationComparison,risk,atRisk,confidence,alerts,previousId:predictiveEngine.previousMonthId(id)};
}
function predictiveStatusLabel(status){return status==='achieved'?'META ATINGIDA':status==='on_track'?'EM RITMO':status==='attention'?'ATENÇÃO':status==='critical'?'RISCO':'SEM META'}
function predictiveStatusClass(status){return status==='achieved'||status==='on_track'?'good':status==='attention'?'warn':status==='critical'?'bad':'neutral'}
function predictiveDeltaText(cmp,{points=false}={}){if(!cmp||!cmp.previous)return'Sem base anterior';const n=points?cmp.delta*100:cmp.ratio*100,sign=n>0?'+':'';return `${sign}${n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}${points?' p.p.':'%'} vs. período equivalente`;}
function renderPredictiveManagement(squads){
  const data=predictiveScopeData(squads),kpis=$('#predictiveKpis'),alerts=$('#predictiveAlerts'),squadRows=$('#predictiveSquadRows'),riskRows=$('#predictiveRiskRows'),period=$('#predictivePeriod'),confidence=$('#predictiveConfidence');
  if(!data){if(kpis)kpis.innerHTML='<div class="chart-empty">Sem competência disponível para projeção.</div>';if(alerts)alerts.innerHTML='<div class="predictive-empty">Sem alertas.</div>';if(squadRows)squadRows.innerHTML='<tr><td colspan="8" class="muted">Sem dados.</td></tr>';if(riskRows)riskRows.innerHTML='<tr><td colspan="6" class="muted">Sem dados.</td></tr>';return;}
  if(period)period.textContent=`${data.label} • ${data.elapsedDays}/${data.totalDays} dias úteis`;
  if(confidence){confidence.textContent=`Confiança ${data.confidence.label}`;confidence.className=`predictive-confidence ${data.confidence.level}`;confidence.title=data.confidence.note;}
  const cards=[
    {label:'Atendimentos',m:data.attendance,real:fmtInt(data.attendance.realized),goal:fmtInt(data.attendance.goal),projection:fmtInt(data.attendance.projection),delta:predictiveDeltaText(data.attendanceComparison)},
    {label:'Notas 5',m:data.notes5,real:fmtInt(data.notes5.realized),goal:data.notes5.goal?fmtInt(data.notes5.goal):'—',projection:fmtInt(data.notes5.projection),delta:data.notes5.goal?`${fmtNum(data.notes5.neededPerDay)} por dia útil para a meta`:'Meta individual não configurada'},
    {label:'% de avaliação',m:data.evaluation,real:fmtPct(data.evaluation.realized),goal:data.evaluation.goal?fmtPct(data.evaluation.goal):'—',projection:fmtPct(data.evaluation.projection),delta:predictiveDeltaText(data.evaluationComparison,{points:true})},
    {label:'Técnicos em atenção',m:{status:data.atRisk.length?'attention':'on_track'},real:fmtInt(data.atRisk.length),goal:`de ${fmtInt(data.risk.length)}`,projection:data.risk.length?fmtPct(data.atRisk.length/data.risk.length):'0%',delta:data.atRisk.length?'Priorize os maiores desvios':'Nenhum técnico com 2+ sinais'}
  ];
  if(kpis)kpis.innerHTML=cards.map(c=>`<article class="predictive-kpi ${predictiveStatusClass(c.m.status)}"><div class="predictive-kpi-top"><span>${escapeHtml(c.label)}</span><b>${predictiveStatusLabel(c.m.status)}</b></div><strong>${escapeHtml(c.real)}</strong><div class="predictive-triplet"><span><small>Meta</small>${escapeHtml(c.goal)}</span><span><small>Projeção</small>${escapeHtml(c.projection)}</span></div><p>${escapeHtml(c.delta)}</p></article>`).join('');
  if(alerts)alerts.innerHTML=data.alerts.map(a=>`<div class="predictive-alert ${a.severity}"><i>${a.severity==='critical'?'!':a.severity==='warning'?'△':a.severity==='positive'?'✓':'i'}</i><div><strong>${escapeHtml(a.title)}</strong><small>${escapeHtml(a.text)}</small></div></div>`).join('')||'<div class="predictive-empty">Nenhum alerta automático para esta competência.</div>';
  if(squadRows)squadRows.innerHTML=data.rows.map(r=>{const prev=r.previous,cmp=predictiveEngine.compare(r.att.realized,safe(prev?.att));return `<tr><td><strong>Squad ${escapeHtml(r.code)}</strong></td><td>${fmtInt(r.att.realized)}</td><td>${fmtInt(r.att.goal)}</td><td>${fmtInt(r.att.projection)}</td><td><span class="predictive-table-status ${predictiveStatusClass(r.att.status)}">${predictiveStatusLabel(r.att.status)}</span></td><td>${fmtPct(r.evaluation.realized)}</td><td>${r.evaluation.goal?fmtPct(r.evaluation.goal):'—'}</td><td>${escapeHtml(predictiveDeltaText(cmp))}</td></tr>`}).join('');
  const topRisk=data.risk.filter(r=>r.score>0).slice(0,8);if(riskRows)riskRows.innerHTML=topRisk.length?topRisk.map(r=>`<tr><td><strong>${escapeHtml(titleWords(r.name))}</strong></td><td>Squad ${escapeHtml(r.squad)}</td><td>${fmtInt(r.att.projection)} / ${fmtInt(r.att.goal)}</td><td>${fmtInt(r.notes5.projection)} / ${r.notes5.goal?fmtInt(r.notes5.goal):'—'}</td><td>${fmtPct(r.eval.realized)} / ${r.eval.goal?fmtPct(r.eval.goal):'—'}</td><td><span class="predictive-table-status ${r.level==='critical'?'bad':r.level==='warning'?'warn':'neutral'}" title="${escapeHtml(r.reasons.join(' • '))}">${r.level==='critical'?'ALTO':r.level==='warning'?'MÉDIO':'OBSERVAR'}</span></td></tr>`).join(''):'<tr><td colspan="6" class="muted">Nenhum técnico com sinal de risco nesta competência.</td></tr>';
}


function analysisDateLabels(){const out=[];if(!state.analysisStartDate||!state.analysisEndDate)return out;let i=0;for(let d=state.analysisStartDate;d<=state.analysisEndDate;d=addCalendarDays(d,1),i++){const dt=parseIsoAnalysisDate(d);out.push({date:d,label:`${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`});}return out;}
function weeklyBucketsForAnalysis(squads){const dates=analysisDateLabels(),buckets=[];dates.forEach((x,i)=>{const idx=Math.floor(i/7);if(!buckets[idx])buckets[idx]={start:x.date,end:x.date,bySquad:new Map()};buckets[idx].end=x.date;});(squads||[]).forEach(squad=>{const rows=periodTechniciansForSquad(squad);rows.forEach(t=>(t.daily||[]).forEach(d=>{if(!dateBetween(d.date))return;const offset=Math.floor((parseIsoAnalysisDate(d.date)-parseIsoAnalysisDate(state.analysisStartDate))/86400000),idx=Math.max(0,Math.floor(offset/7)),b=buckets[idx];if(!b)return;const v=b.bySquad.get(squad.code)||{att:0,eval:0};v.att+=safe(d.att);v.eval+=safe(d.notes5)+safe(d.notes4)+safe(d.notes3)+safe(d.notes2)+safe(d.notes1);b.bySquad.set(squad.code,v);}));});const labels=buckets.map(b=>{const a=parseIsoAnalysisDate(b.start),z=parseIsoAnalysisDate(b.end);return `${String(a.getDate()).padStart(2,'0')}/${String(a.getMonth()+1).padStart(2,'0')}–${String(z.getDate()).padStart(2,'0')}/${String(z.getMonth()+1).padStart(2,'0')}`}),palette=['var(--accent)','var(--success)','#78b7ff','#ef5a29','#b18cff'],series=(squads||[]).map((s,i)=>({name:`Squad ${s.code}`,color:palette[i%palette.length],values:buckets.map(b=>{const v=b.bySquad.get(s.code);return v&&v.att?(v.eval/v.att)*100:null;})}));return{labels,series};}


function renderIndicatorFinanceRanking(squads,rangeIds){
  const el=$('#indicatorFinanceRanking'),note=$('#indicatorFinanceRankingNote');if(!el)return;const map=new Map();
  (squads||[]).forEach(squad=>(rangeIds||[]).forEach(id=>{const m=squad.months?.[id];if(!m)return;(m.technicians||[]).forEach(t=>{const key=`${squad.code}|${nameLinkKey(t.name)}`,prev=map.get(key)||{name:t.name,squad:squad.code,amount:0,months:0};prev.amount+=safe(t.financeData?.final);prev.months+=1;map.set(key,prev)})}));
  const rows=[...map.values()].sort((a,b)=>safe(b.amount)-safe(a.amount)||String(a.name).localeCompare(String(b.name),'pt-BR'));
  if(note)note.textContent=rangeIds.length===1?`Financeiro mensal • valor oficial de ${monthLabelFromId(rangeIds[0])}`:`Financeiro permanece por competência • soma de ${monthLabelFromId(rangeIds[0])} a ${monthLabelFromId(rangeIds[rangeIds.length-1])}`;
  el.innerHTML=rows.map((r,i)=>`<div class="finance-ranking-item"><span class="finance-ranking-pos">#${i+1}</span><div><strong>${escapeHtml(titleWords(r.name))}</strong><small>${state.squadCode==='all'?`Squad ${escapeHtml(r.squad)} • `:''}${r.months} competência(s)</small></div><b>${fmtMoney(r.amount)}</b></div>`).join('')||'<div class="chart-empty">Sem valores financeiros no período.</div>';
}


function buildOrgOverviewFromState(){
  const rows=[];
  Object.values(state.squads||{}).filter(Boolean).forEach(squad=>{
    Object.values(squad.months||{}).forEach(m=>{
      if(!m)return;
      const totals=m.teamTotals||deriveTotals(m.technicians||[]);
      rows.push({squadCode:squad.code,squadName:squad.name||`Squad ${squad.code}`,id:m.id||`${m.year}-${String(m.month).padStart(2,'0')}`,year:safe(m.year),month:safe(m.month),totalAtt:safe(totals.att),totalEval:safe(totals.eval),evalPct:safe(totals.evalPct),technicianCount:(m.technicians||[]).length});
    });
  });
  return rows.sort((a,b)=>String(a.id).localeCompare(String(b.id))||String(a.squadCode).localeCompare(String(b.squadCode)));
}
function orgOverviewRows(){
  if((window.APP_CONFIG?.mode||'demo')==='demo')return buildOrgOverviewFromState();
  return (state.orgOverview||[]).length?state.orgOverview:buildOrgOverviewFromState();
}
function buildOrgTechnicianOverviewFromState(){
  const rows=[];
  Object.values(state.squads||{}).filter(Boolean).forEach(squad=>{
    Object.values(squad.months||{}).forEach(m=>{
      (m.technicians||[]).forEach(t=>rows.push({
        squadCode:squad.code,squadName:squad.name,id:m.id,year:m.year,month:m.month,
        technicianName:t.name,att:safe(t.att),totalEval:safe(t.totalEval),avg:safe(t.avg),
        evalPct:safe(t.evalPct),points:safe(t.points),status:String(t.status||'').toUpperCase()
      }));
    });
  });
  return rows.sort((a,b)=>String(a.id).localeCompare(String(b.id))||String(a.squadCode).localeCompare(String(b.squadCode))||String(a.technicianName).localeCompare(String(b.technicianName),'pt-BR'));
}
function orgTechnicianRows(){
  if((window.APP_CONFIG?.mode||'demo')==='demo')return buildOrgTechnicianOverviewFromState();
  return (state.orgTechnicianOverview||[]).length?state.orgTechnicianOverview:buildOrgTechnicianOverviewFromState();
}
function orgTechnicianMonthIds(rows=orgTechnicianRows(),limit=12){
  const ids=[...new Set((rows||[]).map(r=>r.id).filter(Boolean))].sort();
  return limit&&ids.length>limit?ids.slice(-limit):ids;
}
function orgOverviewMonthIds(rows=orgOverviewRows(),limit=12){
  const ids=[...new Set((rows||[]).map(r=>r.id).filter(Boolean))].sort();
  return limit&&ids.length>limit?ids.slice(-limit):ids;
}
function buildOrgSquadSeries(ids,rows=orgOverviewRows()){
  const palette=['#f0a33a','#36c98f','#46a4ff','#d879ff','#ef5a29','#46d7d0','#f2c14e','#ff6d92'];
  const codes=[...new Set((rows||[]).map(r=>r.squadCode).filter(Boolean))].sort();
  const attendance=codes.map((code,i)=>({name:`Squad ${code}`,color:palette[i%palette.length],values:ids.map(id=>{const r=rows.find(x=>x.id===id&&x.squadCode===code);return r?safe(r.totalAtt):null})}));
  const evaluation=codes.map((code,i)=>({name:`Squad ${code}`,color:palette[i%palette.length],values:ids.map(id=>{const r=rows.find(x=>x.id===id&&x.squadCode===code);return r?safe(r.evalPct)*100:null})}));
  return{codes,attendance,evaluation};
}
function buildOrgDailyOverviewFromState(){
  const rows=[];Object.values(state.squads||{}).filter(Boolean).forEach(squad=>{Object.values(squad.months||{}).forEach(m=>{if(!m)return;const byDay=new Map();(m.technicians||[]).forEach(t=>(t.daily||[]).forEach(d=>{if(safe(d.day)>safe(m.latestDay)||d.off)return;const v=byDay.get(safe(d.day))||{att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0};v.att+=safe(d.att);v.notes5+=safe(d.notes5);v.notes4+=safe(d.notes4);v.notes3+=safe(d.notes3);v.notes2+=safe(d.notes2);v.notes1+=safe(d.notes1);byDay.set(safe(d.day),v);}));[...byDay.entries()].forEach(([day,v])=>{const totalEval=v.notes5+v.notes4+v.notes3+v.notes2+v.notes1;rows.push({squadCode:squad.code,id:m.id,year:safe(m.year),month:safe(m.month),day:safe(day),date:isoDateParts(m.year,m.month,day),totalAtt:v.att,notes5:v.notes5,notes4:v.notes4,notes3:v.notes3,notes2:v.notes2,notes1:v.notes1,totalEval,evalPct:v.att?totalEval/v.att:0});});});});return rows.sort((a,b)=>a.date.localeCompare(b.date)||String(a.squadCode).localeCompare(String(b.squadCode)));}
function buildOrgTechnicianDailyOverviewFromState(){const rows=[];Object.values(state.squads||{}).filter(Boolean).forEach(squad=>Object.values(squad.months||{}).forEach(m=>(m.technicians||[]).forEach(t=>(t.daily||[]).forEach(d=>{if(safe(d.day)>safe(m.latestDay)||d.off)return;const totalEval=safe(d.notes5)+safe(d.notes4)+safe(d.notes3)+safe(d.notes2)+safe(d.notes1),avg=totalEval?((safe(d.notes5)*5+safe(d.notes4)*4+safe(d.notes3)*3+safe(d.notes2)*2+safe(d.notes1))/totalEval):0;rows.push({squadCode:squad.code,id:m.id,year:m.year,month:m.month,day:safe(d.day),date:isoDateParts(m.year,m.month,d.day),technicianName:t.name,att:safe(d.att),notes5:safe(d.notes5),notes4:safe(d.notes4),notes3:safe(d.notes3),notes2:safe(d.notes2),notes1:safe(d.notes1),totalEval,avg,evalPct:safe(d.att)?totalEval/safe(d.att):0});}))));return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.squadCode.localeCompare(b.squadCode)||a.technicianName.localeCompare(b.technicianName,'pt-BR'));}
function orgDailyRows(){if((window.APP_CONFIG?.mode||'demo')==='demo')return buildOrgDailyOverviewFromState();return (state.orgDailyOverview||[]).length?state.orgDailyOverview:buildOrgDailyOverviewFromState();}
function orgTechnicianDailyRows(){if((window.APP_CONFIG?.mode||'demo')==='demo')return buildOrgTechnicianDailyOverviewFromState();return (state.orgTechnicianDailyOverview||[]).length?state.orgTechnicianDailyOverview:buildOrgTechnicianDailyOverviewFromState();}
function filteredOrgDailyRows(){return orgDailyRows().filter(r=>dateBetween(r.date||isoDateParts(r.year,r.month,r.day)));}
function buildOrgDailyComparison(){const rows=filteredOrgDailyRows(),map=new Map();rows.forEach(r=>{const date=r.date||isoDateParts(r.year,r.month,r.day);map.set(date,(map.get(date)||0)+safe(r.totalAtt));});const days=[...map.entries()].map(([date,value])=>({date,value})).sort((a,b)=>a.date.localeCompare(b.date)),values=days.map(x=>x.value),average=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;return{labels:days.map(x=>{const d=parseIsoAnalysisDate(x.date);return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`}),series:[{name:'Atendimentos diários do setor',color:'var(--accent)',values},{name:'Média diária do período',color:'var(--accent2)',dashed:true,values:days.map(()=>average)}],average,days:days.length};}
function renderTeamOrgDailyComparison(){const el=$('#teamOrgDailyChart');if(!el)return;const data=buildOrgDailyComparison();if($('#teamOrgDailyNote'))$('#teamOrgDailyNote').textContent=`${analysisRangeLabel()} • média ${fmtNum(data.average)} atend./dia • A+B+D+E`;renderIndicatorLineChart(el,data.labels,data.series,{maxValue:null,percent:false,decimals:0,height:390});}
function renderIndicatorOrgDailyComparison(){const el=$('#indicatorOrgDailyChart');if(!el)return;const data=buildOrgDailyComparison();if($('#indicatorOrgDailyNote'))$('#indicatorOrgDailyNote').textContent=`${analysisRangeLabel()} • média ${fmtNum(data.average)} atend./dia`;renderIndicatorLineChart(el,data.labels,data.series,{maxValue:null,percent:false,decimals:0,height:390});}
function buildOrgSquadMonthlySeries(){
  // Os dois gráficos executivos do setor são mensais por definição.
  // O calendário continua definindo quais competências entram no recorte, mas cada ponto
  // representa a competência consolidada (e não cada dia), evitando dezenas de pontos
  // comprimidos quando o usuário seleciona vários meses.
  const allRows=orgOverviewRows(),available=orgOverviewMonthIds(allRows,0),ids=analysisMonthIds().filter(id=>available.includes(id));
  const data=buildOrgSquadSeries(ids,allRows);
  return{ids,labels:ids.map(shortHistoryMonth),attendance:data.attendance,evaluation:data.evaluation};
}
function renderTeamSquadOverview(){
  if(!$('#teamSquadAttendanceChart'))return;
  const data=buildOrgSquadMonthlySeries();
  $('#teamSectorPeriod').textContent=analysisRangeLabel();
  renderIndicatorLineChart($('#teamSquadAttendanceChart'),data.labels,data.attendance,{maxValue:null,percent:false,decimals:0,height:280,fitWidth:true});
  renderIndicatorLineChart($('#teamSquadEvaluationChart'),data.labels,data.evaluation,{maxValue:null,percent:true,decimals:1,height:280,fitWidth:true});
}
function renderIndicatorSquadOverview(){
  if(!$('#indicatorSquadAttendanceChart'))return;
  const data=buildOrgSquadMonthlySeries();
  $('#indicatorSectorPeriod').textContent=analysisRangeLabel();
  renderIndicatorLineChart($('#indicatorSquadAttendanceChart'),data.labels,data.attendance,{maxValue:null,percent:false,decimals:0,height:280,fitWidth:true});
  renderIndicatorLineChart($('#indicatorSquadEvaluationChart'),data.labels,data.evaluation,{maxValue:null,percent:true,decimals:1,height:280,fitWidth:true});
}

function allTechnicianMetricConfig(metric=state.allTechniciansMetric){
  const configs={
    points:{label:'Pontuação',get:t=>safe(t.points),percent:false,maxValue:null,decimals:1,suffix:' pts'},
    att:{label:'Atendimentos',get:t=>safe(t.att),percent:false,maxValue:null,decimals:0,suffix:' atend.'},
    evalPct:{label:'% de avaliação',get:t=>safe(t.evalPct)*100,percent:true,maxValue:null,decimals:1,suffix:''},
    avg:{label:'Nota média',get:t=>safe(t.avg),percent:false,maxValue:5,decimals:2,suffix:''}
  };
  return configs[metric]||configs.points;
}
function allTechnicianSeries(rangeIds,metric=state.allTechniciansMetric){
  // V2.28.0: mantém a fonte mensal consolidada e adiciona o contexto de férias
  // diretamente ao ponto daquela competência, sem alterar nenhum cálculo.
  const rows=orgTechnicianRows(),ids=rangeIds||analysisMonthIds(),getColor=i=>`hsl(${Math.round((i*137.508)%360)} 78% 64%)`,map=new Map();
  (rows||[]).filter(r=>ids.includes(r.id)).forEach(r=>{
    const key=`${r.squadCode}|${nameLinkKey(r.technicianName)}`;
    if(!map.has(key))map.set(key,{squad:r.squadCode,name:titleWords(r.technicianName),values:new Map(),vacations:new Map()});
    let value=null;
    if(metric==='points')value=safe(r.points);
    else if(metric==='att')value=safe(r.att);
    else if(metric==='evalPct')value=safe(r.evalPct)*100;
    else if(metric==='avg')value=safe(r.avg);
    const m=state.squads?.[r.squadCode]?.months?.[r.id];
    const mt=(m?.technicians||[]).find(t=>samePersonName(t.name,r.technicianName));
    map.get(key).values.set(r.id,value);
    map.get(key).vacations.set(r.id,!!mt?.vacation);
  });
  return [...map.values()]
    .sort((a,b)=>a.squad.localeCompare(b.squad)||a.name.localeCompare(b.name,'pt-BR'))
    .map((e,i)=>({name:`Squad ${e.squad} • ${e.name}`,color:getColor(i),values:ids.map(id=>e.values.has(id)?e.values.get(id):null),vacations:ids.map(id=>!!e.vacations.get(id))}));
}
function allTechnicianSeriesMonthlyPoints(ids,getColor,rows=orgTechnicianRows()){const map=new Map();(rows||[]).filter(r=>ids.includes(r.id)).forEach(r=>{const key=`${r.squadCode}|${nameLinkKey(r.technicianName)}`;if(!map.has(key))map.set(key,{squad:r.squadCode,name:titleWords(r.technicianName),values:new Map()});map.get(key).values.set(r.id,safe(r.points));});return[...map.values()].sort((a,b)=>a.squad.localeCompare(b.squad)||a.name.localeCompare(b.name,'pt-BR')).map((e,i)=>({name:`Squad ${e.squad} • ${e.name}`,color:getColor(i),values:ids.map(id=>e.values.has(id)?e.values.get(id):null)}));}

function currentIndicatorRangeForFullscreen(source='team'){const available=orgTechnicianMonthIds(orgTechnicianRows(),0);const ids=analysisMonthIds().filter(id=>available.includes(id));return ids.length?ids:available.slice(-1);}

function openAllTechniciansChart(source='team'){
  const rangeIds=currentIndicatorRangeForFullscreen(source);
  if(!rangeIds.length){toast('Não há dados de técnicos disponíveis para o período.');return;}
  state.allTechniciansRangeIds=[...rangeIds];
  state.allTechniciansMetric=$('#allTechniciansMetric')?.value||state.allTechniciansMetric||'points';
  openModal('allTechniciansModal');
  // Renderiza depois que o modal estiver visível para usar toda a largura real da tela.
  requestAnimationFrame(()=>requestAnimationFrame(()=>renderAllTechniciansFullscreenChart(rangeIds)));
}
function responsiveFullscreenPlotHeight(el){
  const canvasHeight=Math.max(0,Math.floor(el?.clientHeight||el?.getBoundingClientRect?.().height||0));
  if(canvasHeight)return Math.max(240,canvasHeight-118);
  return Math.max(260,Math.min(650,(window.innerHeight||900)-320));
}
function renderAllTechniciansFullscreenChart(explicitRange=null){
  const el=$('#allTechniciansFullscreenChart');if(!el)return;
  const rangeIds=(explicitRange&&explicitRange.length)?explicitRange:(state.allTechniciansRangeIds?.length?state.allTechniciansRangeIds:currentIndicatorRangeForFullscreen('team'));
  const cfg=allTechnicianMetricConfig(state.allTechniciansMetric),series=allTechnicianSeries(rangeIds,state.allTechniciansMetric),labels=rangeIds.map(shortHistoryMonth);
  $('#allTechniciansMetric').value=state.allTechniciansMetric;
  $('#allTechniciansPeriod').textContent=analysisRangeLabel();
  $('#allTechniciansSubtitle').textContent=`${cfg.label} de todos os técnicos dos Squads A, B, D e E por competência dentro do período selecionado.`;
  $('#allTechniciansCount').textContent=`${series.length} ${series.length===1?'técnico':'técnicos'} • ${analysisRangeLabel()}`;
  renderIndicatorLineChart(el,labels,series,{maxValue:cfg.maxValue,percent:cfg.percent,decimals:cfg.decimals,height:responsiveFullscreenPlotHeight(el),fitWidth:true,emphasis:true});
}

function dailyTechnicianMetricConfig(metric=state.dailyTechniciansMetric){
  const configs={
    points:{label:'Pontuação diária simulada',percent:false,maxValue:null,decimals:1},
    att:{label:'Atendimentos por dia',percent:false,maxValue:null,decimals:0},
    evalPct:{label:'% de avaliação por dia',percent:true,maxValue:100,decimals:1},
    avg:{label:'Nota média por dia',percent:false,maxValue:5,decimals:2}
  };
  return configs[metric]||configs.points;
}
function dailyTechnicianPointMap(rows){
  const grouped=new Map(),out=new Map();
  (rows||[]).forEach(r=>{const key=`${r.squadCode}|${r.date}`,list=grouped.get(key)||[];list.push(r);grouped.set(key,list)});
  grouped.forEach((list,key)=>{
    const metrics=list.map(r=>{const totalEval=safe(r.totalEval)||safe(r.notes5)+safe(r.notes4)+safe(r.notes3)+safe(r.notes2)+safe(r.notes1),avg=totalEval?truncate2((safe(r.notes5)*5+safe(r.notes4)*4+safe(r.notes3)*3+safe(r.notes2)*2+safe(r.notes1))/totalEval):0,evalPct=safe(r.att)?roundTo(totalEval/safe(r.att),4):0;return{...r,totalEval,avg,evalPct}}).filter(r=>safe(r.att)>0||safe(r.totalEval)>0);
    if(!metrics.length)return;
    const refs={refAtt:roundTo(meanOf(metrics,t=>t.att),0),refTotalEval:roundTo(meanOf(metrics,t=>t.totalEval),0),refAvg:truncate2(meanOf(metrics,t=>t.avg)),refEvalPct:roundTo(meanOf(metrics,t=>t.evalPct),4),bonusAtt:20,bonusTotalEval:30,bonusAvg:40,bonusEvalPct:35};
    metrics.forEach(r=>out.set(`${key}|${nameLinkKey(r.technicianName)}`,calculateScore(r,refs).points));
  });
  return out;
}
function dailyTechnicianSeries(metric=state.dailyTechniciansMetric){
  const scoped=orgTechnicianDailyRows().filter(r=>dateBetween(r.date||isoDateParts(r.year,r.month,r.day))&&(state.squadCode==='all'||String(r.squadCode)===String(state.squadCode)));
  const labels=analysisDateLabels(),pointMap=metric==='points'?dailyTechnicianPointMap(scoped):null,map=new Map();
  scoped.forEach(r=>{const name=r.technicianName||'',key=`${r.squadCode}|${nameLinkKey(name)}`;if(!name)return;const entry=map.get(key)||{squad:r.squadCode,name:titleWords(name),values:new Map()};let value=null;if(metric==='att')value=safe(r.att);else if(metric==='evalPct')value=safe(r.att)?safe(r.evalPct)*100:null;else if(metric==='avg')value=safe(r.totalEval)?safe(r.avg):null;else value=pointMap.get(`${r.squadCode}|${r.date}|${nameLinkKey(name)}`);entry.values.set(r.date,value);map.set(key,entry)});
  const color=i=>`hsl(${Math.round((i*137.508)%360)} 78% 64%)`;
  const series=[...map.values()].sort((a,b)=>String(a.squad).localeCompare(String(b.squad))||a.name.localeCompare(b.name,'pt-BR')).map((e,i)=>({name:`Squad ${e.squad} • ${e.name}`,color:color(i),values:labels.map(x=>e.values.has(x.date)?e.values.get(x.date):null)}));
  return{labels:labels.map(x=>x.label),series};
}
function openDailyTechniciansChart(){
  if(!isSuperAdmin())return;const data=dailyTechnicianSeries(state.dailyTechniciansMetric);if(!data.series.length){toast('Não há dados diários de técnicos no período selecionado.');return;}openModal('dailyTechniciansModal');requestAnimationFrame(()=>requestAnimationFrame(renderDailyTechniciansFullscreenChart));
}
function renderDailyTechniciansFullscreenChart(){
  const el=$('#dailyTechniciansFullscreenChart');if(!el)return;const cfg=dailyTechnicianMetricConfig(state.dailyTechniciansMetric),data=dailyTechnicianSeries(state.dailyTechniciansMetric);$('#dailyTechniciansMetric').value=state.dailyTechniciansMetric;$('#dailyTechniciansPeriod').textContent=analysisRangeLabel();$('#dailyTechniciansSubtitle').textContent=state.dailyTechniciansMetric==='points'?`${cfg.label} dentro do calendário selecionado. É uma leitura analítica diária e não altera a pontuação oficial da competência.`:`${cfg.label} dentro do calendário diário selecionado.`;$('#dailyTechniciansCount').textContent=`${data.series.length} ${data.series.length===1?'técnico':'técnicos'} • ${analysisRangeLabel()}`;renderIndicatorLineChart(el,data.labels,data.series,{maxValue:cfg.maxValue,percent:cfg.percent,decimals:cfg.decimals,height:responsiveFullscreenPlotHeight(el),fitWidth:true,emphasis:true});
}

function shortHistoryMonth(id){
  if(!id)return '—';
  const [year,month]=String(id).split('-').map(Number);
  const short=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][Math.max(0,(month||1)-1)];
  return `${short}/${String(year).slice(-2)}`;
}
function historyMonthIdsForSquad(squad,limit=12){
  const ids=Object.keys(squad?.months||{}).sort();
  return limit&&ids.length>limit?ids.slice(-limit):ids;
}
function historyTechKey(t){return `n:${nameLinkKey(t?.name)}`}
function historyBusinessDays(m){
  if(!m)return 0;
  const latest=Math.max(1,Math.min(safe(m.latestDay)||new Date(m.year,m.month,0).getDate(),new Date(m.year,m.month,0).getDate()));
  return businessDaysElapsed(m.year,m.month,latest);
}
function buildTechnicianHistory(squad,ids){
  const techMap=new Map();
  (ids||[]).forEach(id=>(squad?.months?.[id]?.technicians||[]).forEach(t=>{const key=historyTechKey(t);if(!techMap.has(key))techMap.set(key,{key,name:t.name});}));
  const entities=[...techMap.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  const makeSeries=(e,i)=>({name:titleWords(e.name),color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:[],vacations:[]});
  const attendance=entities.map(makeSeries),daily=entities.map(makeSeries),evaluation=entities.map(makeSeries),totals=[];
  (ids||[]).forEach(id=>{
    let monthTotal=0;
    entities.forEach((e,idx)=>{
      const rows=dailyRowsForTechnician(squad,e.name).filter(d=>`${d.year}-${String(d.month).padStart(2,'0')}`===id),agg=aggregateDailyRows(rows),workDays=Math.max(1,new Set(rows.filter(d=>isBusinessDateIso(d.date)).map(d=>d.date)).size);
      const monthlyTech=(squad?.months?.[id]?.technicians||[]).find(t=>samePersonName(t.name,e.name));
      const vacation=!!monthlyTech?.vacation;
      attendance[idx].values.push(rows.length?agg.att:null);attendance[idx].vacations.push(vacation);
      daily[idx].values.push(rows.length?agg.att/workDays:null);daily[idx].vacations.push(vacation);
      evaluation[idx].values.push(rows.length?agg.evalPct*100:null);evaluation[idx].vacations.push(vacation);
      monthTotal+=agg.att;
    });
    totals.push(monthTotal);
  });
  const dailyTechSeries=[...daily];
  daily.unshift({name:'Média Squad',color:'var(--accent2)',dashed:true,vacations:(ids||[]).map(()=>false),values:(ids||[]).map((id,ix)=>{const vals=dailyTechSeries.map(s=>s.values[ix]).filter(v=>v!=null);return vals.length?meanOf(vals,x=>x):null;})});
  evaluation.unshift({name:'Total geral',color:'var(--accent2)',dashed:true,vacations:(ids||[]).map(()=>false),values:(ids||[]).map((id,ix)=>{let att=0,ev=0;entities.forEach(e=>{const rows=dailyRowsForTechnician(squad,e.name).filter(d=>`${d.year}-${String(d.month).padStart(2,'0')}`===id),agg=aggregateDailyRows(rows);att+=agg.att;ev+=agg.totalEval;});return att?(ev/att)*100:null;})});
  return{ids,labels:(ids||[]).map(shortHistoryMonth),totals,attendance,daily,evaluation,entityCount:entities.length};
}
function buildSquadHistory(squads,ids){const active=(squads||[]).filter(Boolean).sort((a,b)=>a.code.localeCompare(b.code)),totals=[],attendance=active.map((s,i)=>({name:`Squad ${s.code}`,color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:[]})),daily=active.map((s,i)=>({name:`Squad ${s.code}`,color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:[]})),evaluation=active.map((s,i)=>({name:`Squad ${s.code}`,color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:[]}));(ids||[]).forEach((id,ix)=>{let overall=0;active.forEach((s,si)=>{const rows=periodTechniciansForSquad(s).filter(t=>(t.daily||[]).some(d=>`${d.year}-${String(d.month).padStart(2,'0')}`===id)),monthDaily=[];rows.forEach(t=>monthDaily.push(...(t.daily||[]).filter(d=>`${d.year}-${String(d.month).padStart(2,'0')}`===id)));const agg=aggregateDailyRows(monthDaily),workDays=Math.max(1,new Set(monthDaily.filter(d=>isBusinessDateIso(d.date)).map(d=>d.date)).size),techCount=Math.max(1,rows.length);attendance[si].values.push(monthDaily.length?agg.att:null);daily[si].values.push(monthDaily.length?agg.att/(workDays*techCount):null);evaluation[si].values.push(monthDaily.length?agg.evalPct*100:null);overall+=agg.att;});totals.push(overall);});daily.unshift({name:'Média geral',color:'var(--accent2)',dashed:true,values:(ids||[]).map((_,ix)=>{const vals=daily.slice(1).map(s=>s.values[ix]).filter(v=>v!=null);return vals.length?meanOf(vals,x=>x):null;})});evaluation.unshift({name:'Total geral',color:'var(--accent2)',dashed:true,values:(ids||[]).map((_,ix)=>{let att=0,weighted=0;attendance.forEach((a,si)=>{const av=a.values[ix],ep=evaluation[si]?.values[ix];if(av!=null&&ep!=null){att+=av;weighted+=av*(ep/100);}});return att?(weighted/att)*100:null;})});return{ids,labels:(ids||[]).map(shortHistoryMonth),totals,attendance,daily,evaluation,entityCount:active.length};}

function renderTeamHistoricalAnalytics(squad){
  if(!squad||!$('#teamHistoryAttChart'))return;
  const ids=analysisMonthIds().filter(id=>squad?.months?.[id]),data=buildTechnicianHistory(squad,ids);
  $('#teamHistoryPeriod').textContent=analysisRangeLabel();
  $('#teamHistorySubtitle').textContent=`${analysisRangeLabel()} • ${data.entityCount} técnicos encontrados no período.`;
  renderHistoryAttendanceChart($('#teamHistoryAttChart'),data.labels,data.totals,data.attendance);
  renderIndicatorLineChart($('#teamHistoryDailyAvgChart'),data.labels,data.daily,{maxValue:null,percent:false,decimals:1});
  renderIndicatorLineChart($('#teamHistoryEvalChart'),data.labels,data.evaluation,{maxValue:null,percent:true});
}
function renderIndicatorHistoricalAnalytics(squads,rangeIds){
  if(!$('#indicatorHistoryAttChart'))return;
  const ids=[...(rangeIds||[])];
  const specific=state.squadCode!=='all'&&squads.length===1;
  const data=specific?buildTechnicianHistory(squads[0],ids):buildSquadHistory(squads,ids);
  $('#indicatorHistoryTitle').textContent=specific?`Histórico dos técnicos do Squad ${state.squadCode}`:'Histórico comparativo dos Squads';
  $('#indicatorHistorySubtitle').textContent=specific?'As linhas representam cada técnico do Squad dentro do período filtrado.':'No escopo geral, as linhas representam cada Squad para manter a leitura clara.';
  $('#indicatorHistoryPeriod').textContent=analysisRangeLabel();
  $('#indicatorHistoryAttTitle').textContent=specific?'Total de atendimentos por técnico / mês':'Total de atendimentos por Squad / mês';
  $('#indicatorHistoryDailyTitle').textContent=specific?'Média de atendimentos por técnico / dia útil':'Média de atendimentos por técnico / dia útil e Squad';
  $('#indicatorHistoryEvalTitle').textContent=specific?'% de avaliação por técnico':'% de avaliação por Squad';
  $('#indicatorHistoryAttNote').textContent=specific?'Barras = total do Squad • linhas = técnicos':'Barras = total geral • linhas = Squads';
  renderHistoryAttendanceChart($('#indicatorHistoryAttChart'),data.labels,data.totals,data.attendance);
  renderIndicatorLineChart($('#indicatorHistoryDailyAvgChart'),data.labels,data.daily,{maxValue:null,percent:false,decimals:1});
  renderIndicatorLineChart($('#indicatorHistoryEvalChart'),data.labels,data.evaluation,{maxValue:null,percent:true});
}
function qualityNoteTotal(row){return safe(row?.notes5)+safe(row?.notes4)+safe(row?.notes3)+safe(row?.notes2)+safe(row?.notes1)}
function qualityWeightedSum(row){return safe(row?.notes5)*5+safe(row?.notes4)*4+safe(row?.notes3)*3+safe(row?.notes2)*2+safe(row?.notes1)}
function qualitySummaryFinalize(row){const total=qualityNoteTotal(row),weighted=qualityWeightedSum(row);return{...row,total,avg:total?weighted/total:0,lowPct:total?(safe(row.notes1)+safe(row.notes2)+safe(row.notes3))/total:0}}
function analysisCoversImportedMonth(m){
  if(!m||!state.analysisStartDate||!state.analysisEndDate)return false;
  const first=isoDateParts(m.year,m.month,1),last=isoDateParts(m.year,m.month,Math.max(1,safe(m.latestDay)||new Date(m.year,m.month,0).getDate()));
  return state.analysisStartDate<=first&&state.analysisEndDate>=last;
}
function monthExternalQualityRows(m){
  if(!m)return[];
  if(Array.isArray(m.qualityExternal)&&m.qualityExternal.length)return m.qualityExternal;
  const out=[];for(const t of m.technicians||[])for(const q of t.qualityDaily||[])out.push({...q,technicianName:t.name,technicianKey:nameLinkKey(t.name)});return out;
}
function qualityRowsForMonth(m,type=null){return monthExternalQualityRows(m).filter(q=>!type||q.qualityType===type)}
function qualityRowDate(m,q){return isoDateParts(m.year,m.month,safe(q.day))}
function qualityMonthlySummary(type,squads,rangeIds){
  const ids=[...(rangeIds||[])],out=new Map(ids.map(id=>[id,{id,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0}]));
  for(const squad of squads||[]){
    for(const id of ids){
      const m=squad?.months?.[id];if(!m)continue;const bucket=out.get(id);if(!bucket)continue;
      const useMonthlyServiceTotals=type==='service'&&analysisCoversImportedMonth(m);
      for(const t of m.technicians||[]){
        if(type==='service'){
          // V2.26.1: para a competência inteira, usar o consolidado mensal oficial.
          // Meses antigos podem ter Nota 1 a 4 no technician_monthly e zeros no daily_metrics,
          // porque essas colunas diárias só passaram a existir na V2.21.
          if(useMonthlyServiceTotals){
            bucket.att+=safe(t.att);bucket.notes5+=safe(t.notes5);bucket.notes4+=safe(t.notes4);bucket.notes3+=safe(t.notes3);bucket.notes2+=safe(t.notes2);bucket.notes1+=safe(t.notes1);
          }else{
            for(const d of t.daily||[]){const date=isoDateParts(m.year,m.month,d.day);if(!dateBetween(date)||d.off)continue;bucket.att+=safe(d.att);bucket.notes5+=safe(d.notes5);bucket.notes4+=safe(d.notes4);bucket.notes3+=safe(d.notes3);bucket.notes2+=safe(d.notes2);bucket.notes1+=safe(d.notes1);}
          }
        }
      }
      if(type!=='service'){for(const q of qualityRowsForMonth(m,type)){const date=qualityRowDate(m,q);if(!dateBetween(date))continue;bucket.notes5+=safe(q.notes5);bucket.notes4+=safe(q.notes4);bucket.notes3+=safe(q.notes3);bucket.notes2+=safe(q.notes2);bucket.notes1+=safe(q.notes1);}}
    }
  }
  return ids.map(id=>qualitySummaryFinalize(out.get(id)||{id,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0}));
}
function qualityPeriodSummary(type,squads,rangeIds){
  const rows=qualityMonthlySummary(type,squads,rangeIds),total=rows.reduce((a,r)=>{a.att+=safe(r.att);a.notes5+=safe(r.notes5);a.notes4+=safe(r.notes4);a.notes3+=safe(r.notes3);a.notes2+=safe(r.notes2);a.notes1+=safe(r.notes1);return a;},{att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0});return qualitySummaryFinalize(total);
}
function qualitySourceInfo(squads,rangeIds){
  const files=new Set(),dates=[];for(const squad of squads||[])for(const id of rangeIds||[]){const m=squad?.months?.[id];if(!m)continue;for(const q of monthExternalQualityRows(m)){if(q.sourceFile)files.add(q.sourceFile);if(q.importedAt)dates.push(q.importedAt)}}
  if(!files.size)return null;dates.sort();return{files:[...files],last:dates[dates.length-1]||null};
}
function qualityDistributionSeries(rows){
  const colors=['var(--danger)','var(--accent2)','var(--warn)','#78b7ff','var(--success)'];
  return [1,2,3,4,5].map((note,i)=>({name:`Nota ${note}`,color:colors[i],values:rows.map(r=>r.total?safe(r[`notes${note}`])/r.total*100:null)}));
}
function qualityMonthlyLabels(rangeIds){return (rangeIds||[]).map(shortHistoryMonth)}
function qualitySquadServiceSummary(squad,rangeIds){return qualityMonthlySummary('service',[squad],rangeIds)}
function renderQualityIndicators(squads,rangeIds){
  if(!$('#indicatorQualityPanel'))return;$('#qualitySquadPeriod').textContent=analysisRangeLabel();
  const ids=[...(rangeIds||[])],labels=qualityMonthlyLabels(ids),serviceRows=qualityMonthlySummary('service',squads,ids),productRows=qualityMonthlySummary('product',squads,ids),companyRows=qualityMonthlySummary('company',squads,ids),service=qualityPeriodSummary('service',squads,ids),product=qualityPeriodSummary('product',squads,ids),company=qualityPeriodSummary('company',squads,ids),source=qualitySourceInfo(squads,ids);
  $('#qualityImportStatus').textContent=source?`${source.files.length===1?'CSV Produto/Empresa importado':'CSVs Produto/Empresa importados'}${source.last?` • ${new Date(source.last).toLocaleDateString('pt-BR')}`:''}`:'Aguardando importação Produto/Empresa';
  $('#qualityServiceTotal').textContent=fmtInt(service.total);$('#qualityServiceRate').textContent=`${fmtPct(service.att?service.total/service.att:0)} dos atendimentos`;$('#qualityServiceAvg').textContent=`Nota média ${service.total?service.avg.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'—'}`;
  $('#qualityProductAvg').textContent=product.total?product.avg.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';$('#qualityProductTotal').textContent=`${fmtInt(product.total)} avaliações`;$('#qualityProductLow').textContent=`${fmtPct(product.lowPct)} notas 1 a 3`;
  $('#qualityCompanyAvg').textContent=company.total?company.avg.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';$('#qualityCompanyTotal').textContent=`${fmtInt(company.total)} avaliações`;$('#qualityCompanyLow').textContent=`${fmtPct(company.lowPct)} notas 1 a 3`;
  const hasExternal=product.total>0||company.total>0;$('#qualityOverallStatus').textContent=hasExternal?'MONITORADO':'SEM BASE';$('#qualityOverallStatus').className=hasExternal?'period-status-above':'period-status-tie';$('#qualityOverallDetail').textContent=hasExternal?`Produto ${fmtPct(product.lowPct)} baixa • Empresa ${fmtPct(company.lowPct)} baixa`:'Importe o CSV de Produto/Empresa';
  renderQualityReconciliation(squads,ids);
  const squadWrap=$('#qualitySquadCharts');if(squadWrap){squadWrap.innerHTML=(squads||[]).map(sq=>`<article class="card chart-card quality-squad-card"><div class="section-title"><div><span class="eyebrow">SQUAD ${escapeHtml(sq.code)}</span><h3>Avaliação x Qtd. Atendimento</h3></div><span class="muted">Qtd. + % avaliado</span></div><div id="qualitySquadChart-${escapeHtml(sq.code)}" class="chart quality-mixed-chart"></div></article>`).join('')||'<div class="card quality-card-empty">Sem Squads no escopo.</div>';(squads||[]).forEach(sq=>{const rows=qualitySquadServiceSummary(sq,ids);renderQualityAttendanceEvaluationChart($(`#qualitySquadChart-${sq.code}`),labels,rows.map(r=>safe(r.att)),rows.map(r=>r.att?r.total/r.att*100:null));});}
  const benchmarkSeries=[{name:'Taxa Avaliação',color:'var(--accent)',values:serviceRows.map(r=>r.att?r.total/r.att*100:null)},{name:'Benchmark mín.',color:'var(--warn)',dashed:true,values:ids.map(()=>20)},{name:'Benchmark bom',color:'var(--success)',dashed:true,values:ids.map(()=>60)},{name:'Nota Baixa Produto',color:'var(--accent2)',values:productRows.map(r=>r.total?r.lowPct*100:null)},{name:'Nota Baixa Serviço',color:'var(--danger)',values:serviceRows.map(r=>r.total?r.lowPct*100:null)}];
  renderIndicatorLineChart($('#qualityBenchmarkChart'),labels,benchmarkSeries,{maxValue:100,percent:true,decimals:1,height:390,fitWidth:true});
  renderQualityGroupedBarChart($('#qualityServiceNotesChart'),labels,serviceRows);renderQualityGroupedBarChart($('#qualityProductNotesChart'),labels,productRows);renderQualityGroupedBarChart($('#qualityCompanyNotesChart'),labels,companyRows);
  $('#qualityServiceChartNote').textContent=`${fmtInt(service.total)} avaliações no período • ${fmtPct(service.lowPct)} notas 1 a 3`;$('#qualityProductChartNote').textContent=product.total?`${fmtInt(product.total)} avaliações no período • ${fmtPct(product.lowPct)} notas 1 a 3`:'Importe o CSV de Produto/Empresa';$('#qualityCompanyChartNote').textContent=company.total?`${fmtInt(company.total)} avaliações válidas • zero/vazio ignorado`:'Importe o CSV de Produto/Empresa';
}
function monthServiceTechnicianTotals(m){
  const map=new Map();for(const t of m?.technicians||[]){const key=nameLinkKey(t.name);map.set(key,{name:t.name,att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1)});}return map;
}
function monthQualityTechnicianTotals(m,type){
  const map=new Map();for(const q of qualityRowsForMonth(m,type)){const name=q.technicianName||q.name||'Técnico sem nome',key=q.technicianKey||nameLinkKey(name),v=map.get(key)||{name,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0};v.notes5+=safe(q.notes5);v.notes4+=safe(q.notes4);v.notes3+=safe(q.notes3);v.notes2+=safe(q.notes2);v.notes1+=safe(q.notes1);map.set(key,v);}return map;
}
function reconciliationMonthData(squads,id){
  const people=new Map();let service=0,product=0,company=0;
  for(const squad of squads||[]){const m=squad?.months?.[id];if(!m)continue;const serviceMap=monthServiceTechnicianTotals(m),productMap=monthQualityTechnicianTotals(m,'product'),companyMap=monthQualityTechnicianTotals(m,'company'),keys=new Set([...serviceMap.keys(),...productMap.keys(),...companyMap.keys()]);
    for(const key of keys){const s=serviceMap.get(key)||{},p=productMap.get(key)||{},c=companyMap.get(key)||{},name=s.name||p.name||c.name||key,svc=qualityNoteTotal(s),prd=qualityNoteTotal(p),cmp=qualityNoteTotal(c),row={key:`${squad.code}|${key}`,name,squad:squad.code,service:svc,product:prd,company:cmp,diffProduct:prd-svc,diffCompany:cmp-svc};people.set(row.key,row);service+=svc;product+=prd;company+=cmp;}
  }
  const rows=[...people.values()],divergent=rows.filter(r=>r.diffProduct!==0||r.diffCompany!==0);return{id,label:monthLabelFromId(id),service,product,company,diffProduct:product-service,diffCompany:company-service,divergent:divergent.length,hasQuality:product>0||company>0,rows};
}
function diffText(v){const n=safe(v);return `${n>0?'+':''}${fmtInt(n)}`}
function diffClass(v){return safe(v)>0?'positive':safe(v)<0?'negative':'zero'}

  function financialImpactEmptyRow(id=''){
    const [year,month]=String(id||'').split('-').map(Number);
    return{id:null,organization_id:state.user?.organizationId||null,year:safe(year),month:safe(month),active_clients:0,avg_ticket:0,evaluated_clients:0,risk_any_clients:0,service_n1:0,service_n2:0,service_n3:0,service_n4:0,service_n5:0,product_n1:0,product_n2:0,product_n3:0,product_n4:0,product_n5:0,company_n1:0,company_n2:0,company_n3:0,company_n4:0,company_n5:0,source_file:'',imported_at:null,updated_at:null};
  }
  function normalizeFinancialImpactRow(row){
    if(!row)return null;const id=`${safe(row.year)}-${String(safe(row.month)).padStart(2,'0')}`,out={...financialImpactEmptyRow(id),...row};
    ['active_clients','evaluated_clients','risk_any_clients','service_n1','service_n2','service_n3','service_n4','service_n5','product_n1','product_n2','product_n3','product_n4','product_n5','company_n1','company_n2','company_n3','company_n4','company_n5'].forEach(k=>out[k]=Math.max(0,Math.round(safe(out[k]))));out.avg_ticket=Math.max(0,safe(out.avg_ticket));return out;
  }
  function loadDemoFinancialImpact(){try{const rows=JSON.parse(localStorage.getItem('softenFinancialQualityV1')||'[]');return Array.isArray(rows)?rows:[]}catch(e){return[]}}
  function saveDemoFinancialImpact(rows){try{localStorage.setItem('softenFinancialQualityV1',JSON.stringify(rows||[]))}catch(e){}}
  function financialImpactMonthIds(){
    const ids=new Set(Object.keys(state.financialImpactCache||{}));Object.values(state.squads||{}).forEach(s=>Object.keys(s?.months||{}).forEach(id=>ids.add(id)));return[...ids].filter(id=>/^\d{4}-\d{2}$/.test(id)).sort();
  }
  async function ensureFinancialImpactLoaded(force=false){
    if(!isSuperAdmin())return{};if(state.financialImpactLoaded&&!force)return state.financialImpactCache;if(state.financialImpactLoading)return state.financialImpactLoading;
    const task=(async()=>{let rows=[];if(state.supabase){const {data,error}=await state.supabase.from('quality_financial_monthly').select('*').eq('organization_id',state.user.organizationId).order('year').order('month');if(error)throw error;rows=data||[];}else rows=loadDemoFinancialImpact();const cache={};for(const raw of rows){const row=normalizeFinancialImpactRow(raw);if(!row?.year||!row?.month)continue;cache[`${row.year}-${String(row.month).padStart(2,'0')}`]=row;}state.financialImpactCache=cache;state.financialImpactLoaded=true;return cache;})();
    state.financialImpactLoading=task;try{return await task}catch(err){console.error(err);state.financialImpactLoaded=true;if($('#financialImpactImportStatus'))$('#financialImpactImportStatus').textContent='Não foi possível carregar a base financeira. Execute a migração V2.29.0.';return state.financialImpactCache||{};}finally{state.financialImpactLoading=null;if(state.currentView==='indicators'&&state.indicatorSection==='financial-impact')renderFinancialImpactIndicators();}
  }
  function financialImpactDimension(row,prefix){
    const counts={};for(const n of [1,2,3,4,5])counts[n]=safe(row?.[`${prefix}_n${n}`]);const total=Object.values(counts).reduce((a,b)=>a+b,0),low=counts[1]+counts[2]+counts[3];return{counts,total,low,lowPct:total?low/total:0};
  }
  function financialImpactMetrics(row,activeClients,avgTicket){
    const active=Math.max(0,Math.round(safe(activeClients))),ticket=Math.max(0,safe(avgTicket)),heard=Math.max(0,Math.round(safe(row?.evaluated_clients))),risk=Math.max(0,Math.round(safe(row?.risk_any_clients))),mrr=active*ticket,represented=heard*ticket,riskRevenue=risk*ticket;return{active,ticket,heard,risk,mrr,represented,riskRevenue,annualRisk:riskRevenue*12,coverage:active?heard/active:0,representedShare:mrr?represented/mrr:0,riskHeardShare:heard?risk/heard:0,riskPortfolioShare:mrr?riskRevenue/mrr:0};
  }
  function financialImpactStrategicMetrics(row,activeClients,avgTicket){
    const base=financialImpactMetrics(row,activeClients,avgTicket),dimensions=[['Serviço','service'],['Produto','product'],['Empresa','company']].map(([label,prefix])=>({label,prefix,...financialImpactDimension(row,prefix)})),signalTotal=dimensions.reduce((sum,d)=>sum+d.low,0),primary=dimensions.slice().sort((a,b)=>b.low-a.low||b.lowPct-a.lowPct||a.label.localeCompare(b.label,'pt-BR'))[0]||null,unheardClients=Math.max(0,base.active-base.heard),unheardRevenue=unheardClients*base.ticket;
    return{...base,dimensions,signalTotal,primary:primary&&primary.low?{...primary,share:signalTotal?primary.low/signalTotal:0}:null,unheardClients,unheardRevenue,unheardShare:base.mrr?unheardRevenue/base.mrr:0};
  }
  function fmtMoneyCompact(value){
    const n=safe(value),a=Math.abs(n),fmt=(v,d=1)=>v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d});
    if(a>=1000000)return `R$ ${fmt(n/1000000,1)} mi`;if(a>=1000)return `R$ ${fmt(n/1000,0)} mil`;return `R$ ${fmt(n,0)}`;
  }
  function renderFinancialImpactTrend(){
    const el=$('#financialImpactTrendChart');if(!el)return;const rows=Object.entries(state.financialImpactCache||{}).sort((a,b)=>a[0].localeCompare(b[0])).filter(([,row])=>safe(row?.evaluated_clients)>0),labels=rows.map(([id])=>shortHistoryMonth(id)),represented=rows.map(([,row])=>{const m=financialImpactMetrics(row,row.active_clients,row.avg_ticket);return m.ticket?m.represented:null}),risk=rows.map(([,row])=>{const m=financialImpactMetrics(row,row.active_clients,row.avg_ticket);return m.ticket?m.riskRevenue:null});
    renderIndicatorLineChart(el,labels,[{name:'Receita representada',color:'var(--accent)',values:represented},{name:'Receita sob sinal',color:'var(--danger)',values:risk}],{height:360,fitWidth:true,decimals:0,axisFormatter:fmtMoneyCompact,valueFormatter:fmtMoney});
    const valid=rows.filter(([,row])=>safe(row?.avg_ticket)>0);if($('#financialImpactTrendNote'))$('#financialImpactTrendNote').textContent=valid.length?`${valid.length} competência(s) com ticket médio • valores estimados, não receita perdida`:'Salve o ticket médio para visualizar a evolução financeira';
  }
  function updateFinancialImpactPreview(){
    if(!isSuperAdmin()||!$('#indicatorFinancialImpactPanel')||state.indicatorSection!=='financial-impact')return;const id=state.financialImpactMonthId,row=state.financialImpactCache?.[id]||financialImpactEmptyRow(id),active=safe($('#financialImpactActiveClients')?.value),ticket=safe($('#financialImpactAvgTicket')?.value),m=financialImpactStrategicMetrics(row,active,ticket);
    $('#financialImpactMrr').textContent=m.active&&m.ticket?fmtMoney(m.mrr):'—';$('#financialImpactPortfolioBase').textContent=m.active&&m.ticket?`${fmtInt(m.active)} clientes × ${fmtMoney(m.ticket)}`:'Informe clientes e ticket médio';$('#financialImpactEvaluated').textContent=fmtInt(m.heard);$('#financialImpactCoverage').textContent=`${fmtPct(m.coverage)} da base`;$('#financialImpactRepresented').textContent=m.ticket?fmtMoney(m.represented):'—';$('#financialImpactRepresentedShare').textContent=`${fmtPct(m.representedShare)} do MRR estimado`;$('#financialImpactRiskClients').textContent=fmtInt(m.risk);$('#financialImpactRiskShare').textContent=`${fmtPct(m.riskHeardShare)} dos clientes ouvidos`;$('#financialImpactRiskRevenue').textContent=m.ticket?fmtMoney(m.riskRevenue):'—';$('#financialImpactRiskPortfolioShare').textContent=`${fmtPct(m.riskPortfolioShare)} do MRR estimado`;$('#financialImpactAnnualExposure').textContent=m.ticket?fmtMoney(m.annualRisk):'—';
    $('#financialStrategicCoverage').textContent=m.active&&m.ticket?fmtPct(m.representedShare):'—';$('#financialStrategicCoverageDetail').textContent=m.active&&m.ticket?`${fmtMoney(m.represented)} de ${fmtMoney(m.mrr)} estimados`:'Informe clientes ativos e ticket médio';
    $('#financialStrategicExposure').textContent=m.heard&&m.ticket?fmtPct(m.riskHeardShare):'—';$('#financialStrategicExposureDetail').textContent=m.heard&&m.ticket?`${fmtMoney(m.riskRevenue)} de ${fmtMoney(m.represented)} representados`:'Importe o CSV e informe o ticket médio';
    $('#financialStrategicPrimaryOrigin').textContent=m.primary?m.primary.label:'—';$('#financialStrategicPrimaryOriginDetail').textContent=m.primary?`${fmtPct(m.primary.share)} dos sinais • ${fmtInt(m.primary.low)} cliente(s) com nota 1 a 3`:'Sem sinais de notas 1 a 3';
    $('#financialStrategicUnheardRevenue').textContent=m.active&&m.ticket?fmtMoney(m.unheardRevenue):'—';$('#financialStrategicUnheardDetail').textContent=m.active&&m.ticket?`${fmtInt(m.unheardClients)} cliente(s) • ${fmtPct(m.unheardShare)} do MRR estimado`:'Informe clientes ativos e ticket médio';
    $('#financialImpactDimensionRows').innerHTML=m.dimensions.map(d=>{const monthly=d.low*m.ticket,annual=monthly*12,participation=m.signalTotal?d.low/m.signalTotal:0;return`<tr><td><strong>${d.label}</strong>${m.primary?.prefix===d.prefix?'<span class="financial-primary-risk-badge">Principal</span>':''}</td><td>${fmtInt(d.total)}</td><td>${fmtInt(d.low)}</td><td>${fmtPct(d.lowPct)}</td><td>${fmtPct(participation)}</td><td>${m.ticket?fmtMoney(monthly):'—'}</td><td>${m.ticket?fmtMoney(annual):'—'}</td></tr>`}).join('');
  }
  function renderFinancialImpactHistory(){
    const el=$('#financialImpactHistoryRows');if(!el)return;const rows=Object.entries(state.financialImpactCache||{}).sort((a,b)=>b[0].localeCompare(a[0]));if(!rows.length){el.innerHTML='<tr><td colspan="9" class="muted">Importe o primeiro CSV deduplicado para iniciar o histórico.</td></tr>';return;}el.innerHTML=rows.map(([id,row])=>{const m=financialImpactMetrics(row,row.active_clients,row.avg_ticket);return`<tr class="${id===state.financialImpactMonthId?'selected-period-row':''}"><td><strong>${escapeHtml(monthLabelFromId(id))}</strong></td><td>${fmtInt(m.active)}</td><td>${m.ticket?fmtMoney(m.ticket):'—'}</td><td>${m.mrr?fmtMoney(m.mrr):'—'}</td><td>${fmtInt(m.heard)}</td><td>${fmtPct(m.coverage)}</td><td>${m.ticket?fmtMoney(m.represented):'—'}</td><td>${fmtInt(m.risk)}</td><td>${m.ticket?fmtMoney(m.riskRevenue):'—'}</td></tr>`}).join('');
  }
  function renderFinancialImpactIndicators(){
    if(!isSuperAdmin()||!$('#indicatorFinancialImpactPanel'))return;if(!state.financialImpactLoaded){$('#financialImpactImportStatus').textContent='Carregando base financeira...';ensureFinancialImpactLoaded().catch(console.error);return;}const ids=financialImpactMonthIds();if(!ids.length){$('#financialImpactMonthSelect').innerHTML='';$('#financialImpactMonthSelect').disabled=true;$('#financialImpactImportStatus').textContent='Sem competências disponíveis.';return;}if(!state.financialImpactMonthId||!ids.includes(state.financialImpactMonthId))state.financialImpactMonthId=ids[ids.length-1];const id=state.financialImpactMonthId,row=state.financialImpactCache?.[id]||financialImpactEmptyRow(id);$('#financialImpactMonthSelect').disabled=false;$('#financialImpactMonthSelect').innerHTML=ids.map(mid=>`<option value="${mid}" ${mid===id?'selected':''}>${escapeHtml(monthLabelFromId(mid))}</option>`).join('');$('#financialImpactActiveClients').value=safe(row.active_clients)||'';$('#financialImpactAvgTicket').value=safe(row.avg_ticket)?safe(row.avg_ticket).toFixed(2):'';$('#financialImpactImportStatus').textContent=row.imported_at?`${monthLabelFromId(id)} • ${fmtInt(row.evaluated_clients)} clientes únicos importados${row.source_file?` • ${row.source_file}`:''}`:`${monthLabelFromId(id)} • aguardando CSV deduplicado`;updateFinancialImpactPreview();renderFinancialImpactTrend();renderFinancialImpactHistory();
  }
  function parseFinancialImpactCsv(text){
    const lines=parseCsvRows(String(text||'').replace(/^﻿/,''));
    if(lines.length<2)throw new Error('CSV financeiro vazio ou sem linhas de dados.');
    const rawHeaders=lines[0].map(v=>String(v||'').trim()),resolved=importEngine.resolveFinancialImpactColumns(rawHeaders);
    if(resolved.missing.length){
      const missing=resolved.missing.map(item=>`${item.label} (aceitos: ${item.accepted.join(', ')})`).join('; '),found=rawHeaders.filter(Boolean).join(', ')||'nenhum';
      throw new Error(`Coluna obrigatória não encontrada: ${missing}. Cabeçalhos encontrados: ${found}.`);
    }
    const idx=resolved.indexes,groups=new Map();let ignored=0;
    for(const cols of lines.slice(1)){const date=parseCsvDate(cols[idx.date]),service=csvRating(cols[idx.service]),product=csvRating(cols[idx.product]),company=csvRating(cols[idx.company]);if(!date||(!service&&!product&&!company)){ignored++;continue;}const id=`${date.year}-${String(date.month).padStart(2,'0')}`,g=groups.get(id)||{id,year:date.year,month:date.month,evaluated_clients:0,risk_any_clients:0,service_n1:0,service_n2:0,service_n3:0,service_n4:0,service_n5:0,product_n1:0,product_n2:0,product_n3:0,product_n4:0,product_n5:0,company_n1:0,company_n2:0,company_n3:0,company_n4:0,company_n5:0};g.evaluated_clients++;if([service,product,company].some(n=>n&&n<=3))g.risk_any_clients++;if(service)g[`service_n${service}`]++;if(product)g[`product_n${product}`]++;if(company)g[`company_n${company}`]++;groups.set(id,g);}
    if(!groups.size)throw new Error('Nenhuma linha válida foi encontrada. Confira a data e as notas do arquivo.');return{months:[...groups.values()].sort((a,b)=>a.id.localeCompare(b.id)),ignored,total:lines.length-1};
  }
  async function handleFinancialQualityCsvFile(e){
    if(!isSuperAdmin())return;const file=e.target.files?.[0];if(!file)return;const btn=$('#importFinancialQualityCsvBtn'),status=$('#financialImpactImportStatus');if(btn){btn.disabled=true;btn.textContent='Importando...';}if(status)status.textContent='Lendo e consolidando o CSV deduplicado...';try{const parsed=parseFinancialImpactCsv(await file.text());await ensureFinancialImpactLoaded();const now=new Date().toISOString(),payloads=[];for(const g of parsed.months){const previous=state.financialImpactCache?.[g.id]||financialImpactEmptyRow(g.id),row=normalizeFinancialImpactRow({...previous,...g,organization_id:state.user.organizationId||'demo',source_file:file.name,imported_by:state.user.userId||null,imported_at:now,updated_at:now});payloads.push(row);state.financialImpactCache[g.id]=row;}if(state.supabase){const dbRows=payloads.map(r=>({organization_id:state.user.organizationId,year:r.year,month:r.month,active_clients:r.active_clients,avg_ticket:Number(safe(r.avg_ticket).toFixed(2)),evaluated_clients:r.evaluated_clients,risk_any_clients:r.risk_any_clients,service_n1:r.service_n1,service_n2:r.service_n2,service_n3:r.service_n3,service_n4:r.service_n4,service_n5:r.service_n5,product_n1:r.product_n1,product_n2:r.product_n2,product_n3:r.product_n3,product_n4:r.product_n4,product_n5:r.product_n5,company_n1:r.company_n1,company_n2:r.company_n2,company_n3:r.company_n3,company_n4:r.company_n4,company_n5:r.company_n5,source_file:file.name,imported_by:state.user.userId,imported_at:now,updated_at:now}));const {error}=await state.supabase.from('quality_financial_monthly').upsert(dbRows,{onConflict:'organization_id,year,month'});if(error)throw error;await ensureFinancialImpactLoaded(true);}else{const map=new Map(loadDemoFinancialImpact().map(r=>[`${safe(r.year)}-${String(safe(r.month)).padStart(2,'0')}`,r]));payloads.forEach(r=>map.set(`${r.year}-${String(r.month).padStart(2,'0')}`,r));saveDemoFinancialImpact([...map.values()]);state.financialImpactLoaded=true;}state.financialImpactMonthId=payloads[payloads.length-1]?.year?`${payloads[payloads.length-1].year}-${String(payloads[payloads.length-1].month).padStart(2,'0')}`:state.financialImpactMonthId;renderFinancialImpactIndicators();const imported=payloads.reduce((sum,r)=>sum+safe(r.evaluated_clients),0),risk=payloads.reduce((sum,r)=>sum+safe(r.risk_any_clients),0);await logAuditEvent('quality.financial_import',{entityType:'quality_financial_monthly',entityId:state.financialImpactMonthId||file.name,squadId:null,description:`CSV de impacto financeiro ${file.name} consolidado em ${payloads.length} competência(s).`,beforeData:{},afterData:{competencies:payloads.map(r=>({year:r.year,month:r.month,evaluatedClients:r.evaluated_clients,riskAnyClients:r.risk_any_clients}))},metadata:{fileName:file.name,rows:parsed.total,ignored:parsed.ignored,importedClients:imported,riskClients:risk}});toast(`${fmtInt(imported)} clientes únicos consolidados em ${payloads.length} competência(s).`);if(status)status.textContent=`${file.name} • ${fmtInt(imported)} clientes únicos • ${fmtInt(risk)} com ao menos um sinal de risco • ${fmtInt(parsed.ignored)} linha(s) ignorada(s)`;}catch(err){console.error(err);if(status)status.textContent=err.message||'Não foi possível importar o CSV.';toast('Não foi possível importar o CSV de impacto financeiro.');}finally{if(btn){btn.disabled=false;btn.textContent='↑ Importar CSV deduplicado';}e.target.value='';}
  }
  async function saveFinancialImpactParameters(){
    if(!isSuperAdmin())return;const id=state.financialImpactMonthId;if(!id)return toast('Selecione uma competência.');const active=Math.max(0,Math.round(safe($('#financialImpactActiveClients')?.value))),ticket=Math.max(0,safe($('#financialImpactAvgTicket')?.value));if(!active)return toast('Informe o total de clientes ativos.');if(!ticket)return toast('Informe o ticket médio mensal.');await ensureFinancialImpactLoaded();const [year,month]=id.split('-').map(Number),previous=state.financialImpactCache?.[id]||financialImpactEmptyRow(id),now=new Date().toISOString(),row=normalizeFinancialImpactRow({...previous,organization_id:state.user.organizationId||'demo',year,month,active_clients:active,avg_ticket:Number(ticket.toFixed(2)),updated_by:state.user.userId||null,updated_at:now});const btn=$('#saveFinancialImpactParamsBtn');if(btn){btn.disabled=true;btn.textContent='Salvando...';}try{if(state.supabase){const db={organization_id:state.user.organizationId,year,month,active_clients:active,avg_ticket:Number(ticket.toFixed(2)),evaluated_clients:row.evaluated_clients,risk_any_clients:row.risk_any_clients,service_n1:row.service_n1,service_n2:row.service_n2,service_n3:row.service_n3,service_n4:row.service_n4,service_n5:row.service_n5,product_n1:row.product_n1,product_n2:row.product_n2,product_n3:row.product_n3,product_n4:row.product_n4,product_n5:row.product_n5,company_n1:row.company_n1,company_n2:row.company_n2,company_n3:row.company_n3,company_n4:row.company_n4,company_n5:row.company_n5,source_file:row.source_file||null,imported_by:row.imported_by||null,imported_at:row.imported_at||null,updated_by:state.user.userId,updated_at:now};const {error}=await state.supabase.from('quality_financial_monthly').upsert(db,{onConflict:'organization_id,year,month'});if(error)throw error;await ensureFinancialImpactLoaded(true);}else{const map=new Map(loadDemoFinancialImpact().map(r=>[`${safe(r.year)}-${String(safe(r.month)).padStart(2,'0')}`,r]));map.set(id,row);saveDemoFinancialImpact([...map.values()]);state.financialImpactCache[id]=row;state.financialImpactLoaded=true;}renderFinancialImpactIndicators();await logAuditEvent('quality.financial_params_update',{entityType:'quality_financial_monthly',entityId:id,squadId:null,description:`Parâmetros de impacto financeiro atualizados em ${monthLabelFromId(id)}.`,beforeData:{activeClients:safe(previous.active_clients),avgTicket:safe(previous.avg_ticket)},afterData:{activeClients:active,avgTicket:Number(ticket.toFixed(2))},metadata:{period:id}});toast(`Parâmetros financeiros de ${monthLabelFromId(id)} salvos.`);}catch(err){console.error(err);toast('Não foi possível salvar. Confira a migração V2.29.0.');}finally{if(btn){btn.disabled=false;btn.textContent='Salvar parâmetros';}}
  }

function renderQualityReconciliation(squads,ids){
  const list=(ids||[]).map(id=>reconciliationMonthData(squads,id)).filter(r=>r.hasQuality);state.reconciliationCache={};list.forEach(r=>state.reconciliationCache[r.id]=r);
  const total=list.reduce((a,r)=>({service:a.service+r.service,product:a.product+r.product,company:a.company+r.company,divergent:a.divergent+r.divergent}),{service:0,product:0,company:0,divergent:0});
  const summary=$('#qualityReconciliationSummary');if(summary)summary.innerHTML=`<div><span>Notas Serviço</span><strong>${fmtInt(total.service)}</strong><small>Fonte operacional</small></div><div><span>Notas Produto</span><strong>${fmtInt(total.product)}</strong><small>Diferença ${diffText(total.product-total.service)}</small></div><div><span>Notas Empresa</span><strong>${fmtInt(total.company)}</strong><small>Diferença ${diffText(total.company-total.service)}</small></div><div><span>Divergências técnico/mês</span><strong>${fmtInt(total.divergent)}</strong><small>Auditoria entre as fontes</small></div>`;
  const body=$('#qualityReconciliationRows');if(body)body.innerHTML=list.length?list.map(r=>`<tr><td><strong>${escapeHtml(r.label)}</strong></td><td>${fmtInt(r.service)}</td><td>${fmtInt(r.product)}</td><td>${fmtInt(r.company)}</td><td><span class="reconcile-diff ${diffClass(r.diffProduct)}">${diffText(r.diffProduct)}</span></td><td><span class="reconcile-diff ${diffClass(r.diffCompany)}">${diffText(r.diffCompany)}</span></td><td>${fmtInt(r.divergent)}</td><td><button type="button" class="btn secondary reconcile-detail-btn" data-reconcile-id="${escapeHtml(r.id)}">Ver técnicos</button></td></tr>`).join(''):'<tr><td colspan="8" class="muted">Sem competências no período selecionado.</td></tr>';
}
function openReconciliationDetail(id){
  const rec=state.reconciliationCache?.[id];if(!rec)return;$('#reconciliationModalTitle').textContent=`Conciliação • ${rec.label}`;$('#reconciliationModalText').textContent=`Serviço ${fmtInt(rec.service)} • Produto ${fmtInt(rec.product)} • Empresa ${fmtInt(rec.company)}. A diferença é informativa e não altera nenhuma fonte.`;
  const rows=rec.rows.filter(r=>r.diffProduct!==0||r.diffCompany!==0).sort((a,b)=>Math.max(Math.abs(b.diffProduct),Math.abs(b.diffCompany))-Math.max(Math.abs(a.diffProduct),Math.abs(a.diffCompany))||a.name.localeCompare(b.name,'pt-BR'));
  $('#reconciliationDetailRows').innerHTML=rows.length?rows.map(r=>`<tr><td><strong>${escapeHtml(titleWords(r.name))}</strong></td><td>Squad ${escapeHtml(r.squad)}</td><td>${fmtInt(r.service)}</td><td>${fmtInt(r.product)}</td><td>${fmtInt(r.company)}</td><td><span class="reconcile-diff ${diffClass(r.diffProduct)}">${diffText(r.diffProduct)}</span></td><td><span class="reconcile-diff ${diffClass(r.diffCompany)}">${diffText(r.diffCompany)}</span></td></tr>`).join(''):'<tr><td colspan="7" class="muted">As fontes fecham para todos os técnicos desta competência.</td></tr>';openModal('reconciliationModal');
}
function businessDayCalendar(y,m,latestDay=null){
  const maxDay=latestDay==null?new Date(y,m,0).getDate():Math.min(new Date(y,m,0).getDate(),Math.max(0,safe(latestDay))),out=[];for(let day=1;day<=maxDay;day++){const dow=new Date(y,m-1,day).getDay();if(dow>=1&&dow<=5)out.push({index:out.length+1,day,date:isoDateParts(y,m,day)});}return out;
}
function scopeMonthLatestDay(squads,id){let latest=0;for(const s of squads||[])latest=Math.max(latest,safe(s?.months?.[id]?.latestDay));return latest}
function businessDayCutoffDay(y,m,cutoff){const cal=businessDayCalendar(y,m);return cal[Math.max(0,Math.min(cal.length,safe(cutoff))-1)]?.day||new Date(y,m,0).getDate()}
function serviceDailyCoverage(mon){
  const monthly={notes5:0,notes4:0,notes3:0,notes2:0,notes1:0},daily={notes5:0,notes4:0,notes3:0,notes2:0,notes1:0};
  for(const t of mon?.technicians||[]){for(const n of [5,4,3,2,1])monthly[`notes${n}`]+=safe(t[`notes${n}`]);for(const d of t.daily||[]){if(safe(d.day)>safe(mon.latestDay)||d.off)continue;for(const n of [5,4,3,2,1])daily[`notes${n}`]+=safe(d[`notes${n}`]);}}
  const complete=[5,4,3,2,1].every(n=>safe(monthly[`notes${n}`])===safe(daily[`notes${n}`]));
  return{complete,monthly,daily};
}
function businessDaysStatusForSquad(mon,cutoffDay){
  const metrics=[];for(const t of mon?.technicians||[]){const daily=[];for(const d of t.daily||[]){if(safe(d.day)>cutoffDay||safe(d.day)>safe(mon.latestDay)||d.off)continue;const date=isoDateParts(mon.year,mon.month,safe(d.day));if(!isBusinessDateIso(date))continue;daily.push(d);}const agg=aggregateDailyRows(daily);if(safe(agg.att)>0||safe(agg.totalEval)>0)metrics.push({name:t.name,...agg,excludeFromGroupCount:!!t.excludeFromGroupCount});}
  if(!metrics.length)return{above:0,below:0,count:0};const refs={...scoreRefsFromRows(metrics),bonusAtt:20,bonusTotalEval:30,bonusAvg:40,bonusEvalPct:35};let above=0,below=0;for(const t of metrics){const status=calculateScore(t,refs).status;if(status==='ACIMA')above++;else if(status==='ABAIXO')below++;}return{above,below,count:metrics.length};
}
function businessDaysMonthSummary(squads,id,cutoff){
  const [y,mn]=String(id).split('-').map(Number),cutoffDay=businessDayCutoffDay(y,mn,cutoff),service={att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0},product={notes5:0,notes4:0,notes3:0,notes2:0,notes1:0},company={notes5:0,notes4:0,notes3:0,notes2:0,notes1:0},techs=new Set();let availableDays=0,above=0,below=0,dailyAligned=true;
  for(const squad of squads||[]){const mon=squad?.months?.[id];if(!mon)continue;if(!serviceDailyCoverage(mon).complete)dailyAligned=false;availableDays=Math.max(availableDays,businessDayCalendar(y,mn,Math.min(cutoffDay,safe(mon.latestDay)||cutoffDay)).length);const status=businessDaysStatusForSquad(mon,cutoffDay);above+=status.above;below+=status.below;for(const t of mon.technicians||[]){let has=false;for(const d of t.daily||[]){if(safe(d.day)>cutoffDay||safe(d.day)>safe(mon.latestDay)||d.off)continue;const date=isoDateParts(y,mn,safe(d.day));if(!isBusinessDateIso(date))continue;service.att+=safe(d.att);service.notes5+=safe(d.notes5);service.notes4+=safe(d.notes4);service.notes3+=safe(d.notes3);service.notes2+=safe(d.notes2);service.notes1+=safe(d.notes1);if(safe(d.att)+qualityNoteTotal(d)>0)has=true;}if(has)techs.add(`${squad.code}|${nameLinkKey(t.name)}`);}for(const q of qualityRowsForMonth(mon)){if(safe(q.day)>cutoffDay||!isBusinessDateIso(qualityRowDate(mon,q)))continue;const target=q.qualityType==='product'?product:q.qualityType==='company'?company:null;if(!target)continue;target.notes5+=safe(q.notes5);target.notes4+=safe(q.notes4);target.notes3+=safe(q.notes3);target.notes2+=safe(q.notes2);target.notes1+=safe(q.notes1);}}
  const svc={...qualitySummaryFinalize(service),dailyAligned},prd=qualitySummaryFinalize(product),cmp=qualitySummaryFinalize(company),techCount=techs.size||(above+below);return{id,label:monthLabelFromId(id),cutoff,availableDays,techCount,att:service.att,attPerTechDay:availableDays&&techCount?service.att/(availableDays*techCount):0,service:svc,product:prd,company:cmp,evalRate:service.att?svc.total/service.att:0,above,below};
}
function businessDaysDailySeries(squads,id,cutoff,metric='attendance'){
  const [y,mn]=String(id).split('-').map(Number),calendar=businessDayCalendar(y,mn).slice(0,cutoff),daily=calendar.map(x=>({day:x.day,att:0,serviceEval:0,serviceLow:0,productLow:0,companyLow:0}));const byDay=new Map(daily.map(x=>[x.day,x]));
  for(const squad of squads||[]){const mon=squad?.months?.[id];if(!mon)continue;for(const t of mon.technicians||[])for(const d of t.daily||[]){const b=byDay.get(safe(d.day));if(!b||safe(d.day)>safe(mon.latestDay)||d.off)continue;b.att+=safe(d.att);b.serviceEval+=qualityNoteTotal(d);b.serviceLow+=safe(d.notes1)+safe(d.notes2)+safe(d.notes3);}for(const q of qualityRowsForMonth(mon)){const b=byDay.get(safe(q.day));if(!b)continue;const low=safe(q.notes1)+safe(q.notes2)+safe(q.notes3);if(q.qualityType==='product')b.productLow+=low;if(q.qualityType==='company')b.companyLow+=low;}}
  let att=0,evals=0,low=0;return daily.map(b=>{att+=b.att;evals+=b.serviceEval;low+=metric==='product'?b.productLow:metric==='company'?b.companyLow:b.serviceLow;return metric==='attendance'?att:metric==='evaluation'?(att?evals/att*100:null):low;});
}
function setDeltaKpi(valueEl,detailEl,delta,{percent=false,points=false,lowerBetter=false,base=null,prev=null}={}){
  if(!valueEl||!detailEl)return;if(delta==null||!Number.isFinite(Number(delta))){valueEl.textContent='—';detailEl.textContent='Sem comparação';valueEl.className='';return;}const n=Number(delta),positive=n>0,good=lowerBetter?!positive:positive;valueEl.textContent=points?`${n>0?'+':''}${n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p.`:`${n>0?'+':''}${n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;valueEl.className=Math.abs(n)<.0001?'delta-neutral':good?'delta-positive':'delta-negative';detailEl.textContent=base==null||prev==null?'Mesmo estágio do mês':`${base} agora • ${prev} anterior`;}
function renderBusinessDaysDistribution(body,rows,type){
  if(!body)return;body.innerHTML=(rows||[]).map(r=>{const q=r[type],misaligned=type==='service'&&q?.dailyAligned===false,has=safe(q?.total)>0,note=n=>has?`<span class="business-days-note-share">${fmtInt(q[`notes${n}`])}<small>${(safe(q[`notes${n}`])/q.total*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</small></span>`:'—';return `<tr><td><strong>${escapeHtml(r.label)}</strong>${misaligned?'<small class="muted" style="display:block;margin-top:4px">⚠ detalhe diário difere do consolidado mensal; reimporte o CSV operacional atual para alinhar</small>':''}</td><td>${note(1)}</td><td>${note(2)}</td><td>${note(3)}</td><td>${note(4)}</td><td>${note(5)}</td><td>${has?fmtInt(q.total):'—'}</td></tr>`;}).join('')||'<tr><td colspan="7" class="muted">Sem dados para comparar.</td></tr>';
}
function renderBusinessDaysIndicators(squads){
  const ids=indicatorMonthIds(squads);if(!ids.length){$('#businessDaysRows').innerHTML='<tr><td colspan="13" class="muted">Sem competências importadas.</td></tr>';['#businessDaysServiceDistributionRows','#businessDaysProductDistributionRows','#businessDaysCompanyDistributionRows'].forEach(sel=>{if($(sel))$(sel).innerHTML='<tr><td colspan="7" class="muted">Sem competências importadas.</td></tr>'});return;}let base=state.businessDaysBaseId;if(!base||!ids.includes(base)){const preferred=monthIdForDate(state.analysisEndDate);base=preferred&&ids.includes(preferred)?preferred:ids[ids.length-1];state.businessDaysBaseId=base;}const baseIndex=ids.indexOf(base),count=Math.max(2,safe(state.businessDaysCompareCount)||6),compareIds=ids.slice(Math.max(0,baseIndex-count+1),baseIndex+1),[by,bm]=base.split('-').map(Number),baseLatest=scopeMonthLatestDay(squads,base)||new Date(by,bm,0).getDate(),available=Math.max(1,businessDayCalendar(by,bm,baseLatest).length);if(!state.businessDaysCutoff||state.businessDaysCutoff>available)state.businessDaysCutoff=available;const cutoff=state.businessDaysCutoff;
  $('#businessDaysBaseMonth').innerHTML=ids.map(id=>`<option value="${id}" ${id===base?'selected':''}>${escapeHtml(monthLabelFromId(id))}</option>`).join('');$('#businessDaysCompareCount').value=String(count);$('#businessDaysCutoff').innerHTML=Array.from({length:available},(_,i)=>`<option value="${i+1}" ${i+1===cutoff?'selected':''}>${i+1}º dia útil</option>`).join('');$('#businessDaysLowType').value=state.businessDaysLowType;$('#businessDaysScopeChip').textContent=`Até o ${cutoff}º dia útil`;
  const rows=compareIds.map(id=>businessDaysMonthSummary(squads,id,cutoff)),baseRow=rows[rows.length-1],prev=rows.length>1?rows[rows.length-2]:null,misalignedServiceRows=rows.filter(r=>r.service?.dailyAligned===false);
  const attDelta=prev&&prev.att?((baseRow.att/prev.att)-1)*100:null,evalDelta=prev&&baseRow.evalRate!=null&&prev.evalRate!=null?(baseRow.evalRate-prev.evalRate)*100:null,prdDelta=prev&&baseRow.product.total&&prev.product.total?(baseRow.product.lowPct-prev.product.lowPct)*100:null,cmpDelta=prev&&baseRow.company.total&&prev.company.total?(baseRow.company.lowPct-prev.company.lowPct)*100:null;
  setDeltaKpi($('#businessDaysAttDelta'),$('#businessDaysAttValues'),attDelta,{base:fmtInt(baseRow.att),prev:prev?fmtInt(prev.att):null});setDeltaKpi($('#businessDaysEvalDelta'),$('#businessDaysEvalValues'),evalDelta,{points:true,base:fmtPct(baseRow.evalRate),prev:prev?fmtPct(prev.evalRate):null});setDeltaKpi($('#businessDaysProductDelta'),$('#businessDaysProductValues'),prdDelta,{points:true,lowerBetter:true,base:baseRow.product.total?fmtPct(baseRow.product.lowPct):'—',prev:prev?.product.total?fmtPct(prev.product.lowPct):'—'});setDeltaKpi($('#businessDaysCompanyDelta'),$('#businessDaysCompanyValues'),cmpDelta,{points:true,lowerBetter:true,base:baseRow.company.total?fmtPct(baseRow.company.lowPct):'—',prev:prev?.company.total?fmtPct(prev.company.lowPct):'—'});
  const labels=Array.from({length:cutoff},(_,i)=>`${i+1}º`),seriesFor=metric=>compareIds.map((id,i)=>({name:shortHistoryMonth(id),color:HISTORY_COLORS[i%HISTORY_COLORS.length],values:businessDaysDailySeries(squads,id,cutoff,metric)}));renderIndicatorLineChart($('#businessDaysAttendanceChart'),labels,seriesFor('attendance'),{height:360,fitWidth:true});renderIndicatorLineChart($('#businessDaysEvaluationChart'),labels,seriesFor('evaluation'),{height:360,fitWidth:true,maxValue:100,percent:true,decimals:1});renderIndicatorLineChart($('#businessDaysLowChart'),labels,seriesFor(state.businessDaysLowType),{height:360,fitWidth:true});
  const lowLabel=state.businessDaysLowType==='product'?'Produto':state.businessDaysLowType==='company'?'Empresa':'Serviço';$('#businessDaysLowNote').textContent=`${lowLabel} • notas 1 a 3`;$('#businessDaysAttendanceNote').textContent=`${compareIds.length} competência(s) • mesmo corte no ${cutoff}º dia útil`;$('#businessDaysTableNote').textContent=`Base ${monthLabelFromId(base)} • corte no ${cutoff}º dia útil${misalignedServiceRows.length?` • ⚠ ${misalignedServiceRows.length} competência(s) com detalhe diário divergente do consolidado`:''}`;
  $('#businessDaysRows').innerHTML=rows.map(r=>`<tr><td><strong>${escapeHtml(r.label)}</strong>${r.service?.dailyAligned===false?'<small class="muted" style="display:block;margin-top:3px">⚠ diário a conferir</small>':''}</td><td>${fmtInt(r.availableDays)}</td><td>${fmtInt(r.att)}</td><td>${r.techCount?r.attPerTechDay.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2}):'—'}</td><td>${r.evalRate!=null?fmtPct(r.evalRate):'—'}</td><td>${fmtInt(r.service.total)}</td><td>${r.service.total?fmtPct(r.service.lowPct):'—'}</td><td>${fmtInt(r.product.total)}</td><td>${r.product.total?fmtPct(r.product.lowPct):'—'}</td><td>${fmtInt(r.company.total)}</td><td>${r.company.total?fmtPct(r.company.lowPct):'—'}</td><td>${fmtInt(r.above)}</td><td>${fmtInt(r.below)}</td></tr>`).join('');
  renderBusinessDaysDistribution($('#businessDaysServiceDistributionRows'),rows,'service');renderBusinessDaysDistribution($('#businessDaysProductDistributionRows'),rows,'product');renderBusinessDaysDistribution($('#businessDaysCompanyDistributionRows'),rows,'company');
}
function detailRankingRows(type,squads){
  const map=new Map();for(const squad of squads||[])for(const id of analysisMonthIds()){const m=squad?.months?.[id];if(!m)continue;if(type==='service'){const full=analysisCoversImportedMonth(m);for(const t of m.technicians||[]){const key=`${squad.code}|${nameLinkKey(t.name)}`,v=map.get(key)||{name:t.name,squad:squad.code,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0};if(full){v.notes5+=safe(t.notes5);v.notes4+=safe(t.notes4);v.notes3+=safe(t.notes3);v.notes2+=safe(t.notes2);v.notes1+=safe(t.notes1);}else for(const d of t.daily||[]){const date=isoDateParts(m.year,m.month,safe(d.day));if(!dateBetween(date)||d.off)continue;v.notes5+=safe(d.notes5);v.notes4+=safe(d.notes4);v.notes3+=safe(d.notes3);v.notes2+=safe(d.notes2);v.notes1+=safe(d.notes1);}map.set(key,v);}}else{for(const q of qualityRowsForMonth(m,type)){const date=qualityRowDate(m,q);if(!dateBetween(date))continue;const name=q.technicianName||'Técnico sem nome',key=`${squad.code}|${q.technicianKey||nameLinkKey(name)}`,v=map.get(key)||{name,squad:squad.code,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0};v.notes5+=safe(q.notes5);v.notes4+=safe(q.notes4);v.notes3+=safe(q.notes3);v.notes2+=safe(q.notes2);v.notes1+=safe(q.notes1);map.set(key,v);}}}
  return [...map.values()].map(v=>{const total=qualityNoteTotal(v),low=safe(v.notes1)+safe(v.notes2)+safe(v.notes3);return{...v,total,low,lowPct:total?low/total:0}}).filter(v=>v.low>0).sort((a,b)=>b.low-a.low||b.lowPct-a.lowPct||b.total-a.total||a.name.localeCompare(b.name,'pt-BR')).slice(0,10);
}
function renderDetailRanking(el,rows){if(!el)return;el.innerHTML=rows.length?rows.map((r,i)=>`<div class="detail-rank-row"><span class="detail-rank-pos">${i+1}</span><div class="detail-rank-main"><strong>${escapeHtml(titleWords(r.name))}</strong><small>Squad ${escapeHtml(r.squad)} • N1 ${fmtInt(r.notes1)} • N2 ${fmtInt(r.notes2)} • N3 ${fmtInt(r.notes3)} • ${fmtInt(r.total)} avaliações</small></div><div class="detail-rank-score"><b>${fmtInt(r.low)}</b><small>${fmtPct(r.lowPct)} baixas</small></div></div>`).join(''):'<div class="chart-empty">Nenhuma nota 1 a 3 encontrada no período.</div>'}
function renderDetailIndicators(squads){if($('#detailPeriodChip'))$('#detailPeriodChip').textContent=analysisRangeLabel();renderDetailRanking($('#detailServiceRanking'),detailRankingRows('service',squads));renderDetailRanking($('#detailProductRanking'),detailRankingRows('product',squads));renderDetailRanking($('#detailCompanyRanking'),detailRankingRows('company',squads));}

function renderQualityAttendanceEvaluationChart(el,labels,attendance,evalPct){
  if(!el)return;const has=(attendance||[]).some(v=>safe(v)>0)||(evalPct||[]).some(v=>v!=null);if(!has){el.innerHTML='<div class="chart-empty">Sem dados no período selecionado.</div>';return;}el.classList.add('interactive-chart','chart-modern');const prefs=currentChartPreferences(),visual=chartEngineLineVisual(prefs),scale=configuredPercentScale(100,100),w=Math.max(760,(labels?.length||0)*108),h=configuredChartHeight(320),p={l:58,r:58,t:30,b:58},plotH=h-p.t-p.b,slot=(w-p.l-p.r)/Math.max(1,labels.length),barW=Math.min(48,slot*.48),attTop=Math.max(1,...(attendance||[]).map(safe))*1.12,base=h-p.b,x=i=>p.l+slot*(i+.5),yAtt=v=>p.t+plotH-(safe(v)/attTop)*plotH,yPct=v=>p.t+plotH-((safe(v)-safe(scale.min))/Math.max(1,safe(scale.max)-safe(scale.min)))*plotH;
  const grid=[0,.25,.5,.75,1].map(f=>{const y=p.t+(1-f)*plotH,val=safe(scale.min)+(safe(scale.max)-safe(scale.min))*f;return `<line x1="${p.l}" y1="${y}" x2="${w-p.r}" y2="${y}" class="grid-line"/><text x="6" y="${y+4}" class="axis-label">${fmtInt(attTop*f)}</text><text x="${w-6}" y="${y+4}" class="quality-right-axis-label">${Math.round(val)}%</text>`}).join('');
  const bars=(attendance||[]).map((v,i)=>{const yy=yAtt(v);return `<rect x="${x(i)-barW/2}" y="${yy}" width="${barW}" height="${Math.max(0,base-yy)}" rx="8" fill="var(--accent)" opacity=".55" class="quality-bar chart-series-shape" data-series-index="0"></rect>${chartLabelVisible(i,labels.length)?chartDataLabelSvg(x(i),Math.max(p.t+11,yy-7),fmtInt(v),{color:'var(--accent)',compact:true}):''}`}).join('');
  const pts=(evalPct||[]).map((v,i)=>v==null?null:{x:x(i),y:yPct(v)}),segments=[];let cur=[];pts.forEach(pt=>{if(pt){cur.push(pt)}else if(cur.length){segments.push(cur);cur=[]}});if(cur.length)segments.push(cur);const line=segments.filter(seg=>seg.length>1).map(seg=>`<path d="${smoothSvgPath(seg)}" fill="none" stroke="var(--success)" stroke-width="${visual.lineWidth}" stroke-linecap="round" stroke-linejoin="round" class="chart-series-shape" data-series-index="1"></path>`).join('')+(evalPct||[]).map((v,i)=>v==null?'':`<circle cx="${x(i)}" cy="${yPct(v)}" r="${visual.pointRadius}" fill="var(--success)" class="chart-series-shape" data-series-index="1"></circle>${chartLabelVisible(i,labels.length)?chartDataLabelSvg(x(i),Math.min(base-5,yPct(v)+15),chartInlineLabel(v,{percent:true,decimals:1}),{color:'var(--success)',compact:true}):''}`).join('');
  const xLabels=(labels||[]).map((l,i)=>`<text x="${x(i)}" y="${h-18}" text-anchor="middle" class="axis-label">${escapeHtml(l)}</text>`).join(''),zones=(labels||[]).map((_,i)=>`<rect x="${p.l+slot*i}" y="${p.t}" width="${slot}" height="${plotH}" class="chart-hover-zone" data-chart-index="${i}"></rect>`).join('');
  el.innerHTML=`<div class="chart-plot-scroll"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px" preserveAspectRatio="none">${grid}${bars}${line}${zones}${xLabels}<text x="${p.l}" y="17" class="quality-axis-title">Atendimentos</text><text x="${w-p.r}" y="17" text-anchor="end" class="quality-axis-title">% avaliação</text></svg></div><div class="chart-legend-inline chart-legend-visible"><span><i class="legend-swatch" style="background:var(--accent)"></i>Qtd. Atendimento</span><span><i class="legend-swatch" style="background:var(--success)"></i>% Avaliação</span></div>`;
  bindSharedChartTooltip(el,{labels,entriesForIndex:i=>[{name:'Qtd. Atendimento',value:attendance?.[i],text:fmtInt(attendance?.[i]),color:'var(--accent)'},{name:'% Avaliação',value:evalPct?.[i],text:evalPct?.[i]==null?'—':`${safe(evalPct[i]).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,color:'var(--success)'}]});
}

function renderQualityGroupedBarChart(el,labels,rows){
  if(!el)return;const series=qualityDistributionSeries(rows),has=(rows||[]).some(r=>safe(r.total)>0);if(!has){el.innerHTML='<div class="chart-empty">Sem avaliações para este indicador no período selecionado.</div>';return;}el.classList.add('interactive-chart','chart-modern','quality-grouped-bar-chart');const scale=configuredPercentScale(100,100),w=Math.max(860,(labels?.length||0)*112),h=configuredChartHeight(350),p={l:54,r:24,t:28,b:62},plotH=h-p.t-p.b,slot=(w-p.l-p.r)/Math.max(1,labels.length),groupW=Math.min(slot*.78,82),barW=Math.max(5,groupW/5-2),x0=i=>p.l+slot*i+(slot-groupW)/2,y=v=>p.t+plotH-((safe(v)-safe(scale.min))/Math.max(1,safe(scale.max)-safe(scale.min)))*plotH,base=h-p.b;
  const grid=[0,.25,.5,.75,1].map(f=>{const yy=p.t+(1-f)*plotH,val=safe(scale.min)+(safe(scale.max)-safe(scale.min))*f;return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" class="grid-line"/><text x="8" y="${yy+4}" class="axis-label">${Math.round(val)}%</text>`}).join('');let bars='';series.forEach((ser,si)=>{(ser.values||[]).forEach((v,i)=>{if(v==null)return;const xx=x0(i)+si*(barW+2),yy=y(v);bars+=`<rect x="${xx}" y="${yy}" width="${barW}" height="${Math.max(0,base-yy)}" rx="3" fill="${ser.color}" class="quality-bar chart-series-shape" data-series-index="${si}"></rect>${chartLabelVisible(i,labels.length)?chartDataLabelSvg(xx+barW/2,Math.max(p.t+10,yy-5),chartInlineLabel(v,{percent:true,decimals:0}),{color:ser.color,compact:true}):''}`})});
  const xLabels=(labels||[]).map((l,i)=>`<text x="${p.l+slot*(i+.5)}" y="${h-18}" text-anchor="middle" class="axis-label">${escapeHtml(l)}</text>`).join(''),zones=(labels||[]).map((_,i)=>`<rect x="${p.l+slot*i}" y="${p.t}" width="${slot}" height="${plotH}" class="chart-hover-zone" data-chart-index="${i}"></rect>`).join(''),legend=`<div class="chart-legend-inline chart-legend-visible chart-legend-interactive">${series.map((ser,si)=>`<button type="button" class="chart-legend-item" data-series-index="${si}" aria-pressed="false"><i class="legend-swatch" style="background:${ser.color}"></i>${ser.name}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="chart-plot-scroll"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px" preserveAspectRatio="none">${grid}${bars}${zones}${xLabels}</svg></div>${legend}`;bindSharedChartTooltip(el,{labels,entriesForIndex:i=>[{name:'Total avaliações',value:rows?.[i]?.total,text:fmtInt(rows?.[i]?.total),color:'var(--accent)'},...series.map(ser=>ser.values?.[i]==null?null:{name:ser.name,value:ser.values[i],text:`${safe(ser.values[i]).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,color:ser.color})]});
}


function renderHistoryAttendanceChart(el,labels,totals,series){
  if(!el)return;
  const validSeries=(series||[]).filter(s=>(s.values||[]).some(v=>v!=null));
  if(!labels?.length||!validSeries.length){el.innerHTML='<div class="chart-empty">Importe pelo menos um mês com técnicos vinculados para visualizar o histórico.</div>';return;}
  el.classList.add('interactive-chart','history-interactive-chart','chart-modern','premium-mixed-chart');
  const prefs=currentChartPreferences(),visual=chartEngineLineVisual(prefs),chartId=nextChartRenderId('history'),w=Math.max(940,labels.length*136),h=configuredChartHeight(360),p={l:58,r:68,t:34,b:60};
  const lineVals=validSeries.flatMap(s=>s.values).filter(v=>v!=null).map(v=>safe(v));
  const lineTop=Math.max(1,...lineVals)*1.12,totalTop=Math.max(1,...(totals||[]).map(safe))*1.12;
  const slot=(w-p.l-p.r)/Math.max(1,labels.length),barW=Math.min(58,slot*.48),baseline=h-p.b;
  const x=i=>p.l+slot*(i+.5),yLine=v=>p.t+(h-p.t-p.b)-(safe(v)/lineTop)*(h-p.t-p.b),yTotal=v=>p.t+(h-p.t-p.b)-(safe(v)/totalTop)*(h-p.t-p.b);
  const leftGrid=[0,.25,.5,.75,1].map(f=>{const yy=p.t+(1-f)*(h-p.t-p.b),lv=lineTop*f,rv=totalTop*f;return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" class="grid-line"/><text x="6" y="${yy+4}" class="axis-label">${fmtInt(lv)}</text><text x="${w-6}" y="${yy+4}" class="axis-label-right">${fmtInt(rv)}</text>`}).join('');
  const defs=[`<linearGradient id="${chartId}-bars" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".92"/><stop offset="100%" stop-color="var(--accent2)" stop-opacity=".28"/></linearGradient>`];
  validSeries.forEach((s,si)=>defs.push(svgSeriesGradient(`${chartId}-area-${si}`,s.color||'var(--accent)',validSeries.length>4?.055:.10)));
  const bars=(totals||[]).map((v,i)=>{const yy=yTotal(v),barHeight=Math.max(0,baseline-yy),label=chartLabelVisible(i,totals.length)?chartDataLabelSvg(x(i),Math.max(p.t+10,yy-8),fmtInt(v),{color:'var(--accent)',compact:true}):'';return `<rect x="${x(i)-barW/2}" y="${yy}" width="${barW}" height="${barHeight}" rx="12" fill="url(#${chartId}-bars)" class="history-total-bar chart-series-shape premium-bar"></rect>${label}`}).join('');
  const paths=validSeries.map((s,si)=>{
    const segments=splitChartPointSegments(s.values,x,yLine),color=s.color||'var(--accent)';
    const areaOpacity=validSeries.length>6?0:(validSeries.length>4?.55:1);
    const areas=areaOpacity?segments.filter(seg=>seg.length>1).map(seg=>`<path d="${smoothAreaPath(seg,baseline)}" fill="url(#${chartId}-area-${si})" class="chart-series-area" data-series-index="${si}" style="opacity:${areaOpacity};--series-color:${color}"></path>`).join(''):'';
    const lines=segments.filter(seg=>seg.length>1).map(seg=>`<path d="${smoothSvgPath(seg)}" fill="none" stroke="${color}" stroke-width="${visual.lineWidth}" stroke-linecap="round" stroke-linejoin="round" class="chart-series-line chart-series-shape" style="--series-color:${color}" data-series-index="${si}"></path>`).join('');
    const dots=(s.values||[]).map((v,i)=>{if(v==null)return'';const vacation=!!s.vacations?.[i],cx=x(i),cy=yLine(v),offset=si%2===0?-9:15,label=chartLabelVisible(i,labels.length)?chartDataLabelSvg(cx,Math.max(p.t+11,Math.min(baseline-4,cy+offset)),chartInlineLabel(v,{decimals:1}),{color,compact:true}):'';return `${vacation?`<circle cx="${cx}" cy="${cy}" r="${visual.pointRadius+4.2}" fill="none" stroke="var(--warn)" stroke-width="2.2" class="vacation-point-halo chart-series-shape" data-series-index="${si}" data-point-index="${i}"></circle>`:''}<circle cx="${cx}" cy="${cy}" r="${vacation?visual.pointRadius+0.8:visual.pointRadius}" fill="${color}" class="chart-point chart-series-shape${vacation?' vacation-point':''}" style="--series-color:${color}" data-series-index="${si}" data-point-index="${i}"></circle>${label}`}).join('');
    return areas+lines+dots;
  }).join('');
  const rulers=labels.map((_,i)=>`<line x1="${x(i)}" y1="${p.t}" x2="${x(i)}" y2="${baseline}" class="chart-ruler" data-ruler-index="${i}"></line>`).join('');
  const zones=labels.map((_,i)=>`<rect x="${p.l+slot*i}" y="${p.t}" width="${slot}" height="${h-p.t-p.b}" class="chart-hover-zone" data-chart-index="${i}"></rect>`).join('');
  const xLabels=labels.map((label,i)=>`<text x="${x(i)}" y="${h-16}" text-anchor="middle" class="axis-label history-x-label">${escapeHtml(label)}</text>`).join('');
  const legend=`<div class="chart-legend-inline chart-legend-visible chart-legend-interactive"><span class="chart-legend-total"><i class="legend-swatch history-total-bar"></i>Total geral</span>${validSeries.map((s,si)=>`<button type="button" class="chart-legend-item" data-series-index="${si}" aria-pressed="false" title="Passe o mouse para destacar; clique para fixar"><i class="legend-swatch" style="background:${s.color||'var(--accent)'}"></i>${escapeHtml(s.name)}</button>`).join('')}</div>`;
  el.innerHTML=`<div class="chart-plot-scroll"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px;--chart-height:${h}px" preserveAspectRatio="none"><defs>${defs.join('')}</defs>${leftGrid}${bars}${paths}${rulers}${zones}${xLabels}<text x="${p.l}" y="18" class="history-axis-title">Técnico / grupo</text><text x="${w-p.r}" y="18" text-anchor="end" class="history-axis-title">Total geral</text></svg></div>${legend}`;
  bindSharedChartTooltip(el,{labels,entriesForIndex:i=>[{name:'Total geral',value:totals?.[i],text:fmtInt(totals?.[i]),color:'var(--accent)'},...validSeries.map(s=>s.values?.[i]==null?null:{name:s.vacations?.[i]?`${s.name} 🏖`:s.name,value:s.values[i],text:`${fmtInt(s.values[i])}${s.vacations?.[i]?' • férias':''}`,color:s.color})]});
}

function buildStatusMatrix(squads,rangeIds){
  const map=new Map();
  const multi=(squads||[]).length>1;
  (squads||[]).forEach(squad=>{
    (rangeIds||[]).forEach(id=>{
      const m=squad?.months?.[id];if(!m)return;
      (m.technicians||[]).forEach(t=>{
        const key=`${squad.code}|${historyTechKey(t)}`;
        if(!map.has(key))map.set(key,{key,name:titleWords(t.name),squad:squad.code,statuses:{},vacations:{}});
        map.get(key).statuses[id]=String(t.status||'').toUpperCase();
        map.get(key).vacations[id]=!!t.vacation;
      });
    });
  });
  return [...map.values()]
    .sort((a,b)=>a.squad.localeCompare(b.squad)||a.name.localeCompare(b.name,'pt-BR'))
    .map(x=>({...x,label:multi?`Squad ${x.squad} • ${x.name}`:x.name}));
}

function renderTechnicianStatusMatrix(el,squads,rangeIds){
  if(!el)return;
  const rows=buildStatusMatrix(squads,rangeIds);
  if(!rows.length){el.innerHTML='<div class="chart-empty">Sem técnicos no período selecionado.</div>';return;}
  const months=(rangeIds||[]).map(id=>({id,label:shortHistoryMonth(id)}));
  const head=`<div class="status-matrix-head"><div class="status-tech-name">Técnico</div>${months.map(m=>`<div>${escapeHtml(m.label)}</div>`).join('')}<div>Resumo</div></div>`;
  const body=rows.map(r=>{
    let above=0,below=0;
    const cells=months.map(m=>{const st=r.statuses[m.id]||'';if(st==='ACIMA')above++;if(st==='ABAIXO')below++;const cls=st==='ACIMA'?'above':st==='ABAIXO'?'below':'empty',vacation=!!r.vacations?.[m.id];const tip=`${r.label} • ${monthLabelFromId(m.id)}: ${st||'sem dados'}${vacation?' • férias registradas':''}`;return `<div class="status-cell ${cls}${vacation?' vacation':''} chart-hover-target" data-chart-tip="${escapeHtml(tip)}"><span>${st==='ACIMA'?'A':st==='ABAIXO'?'B':'—'}</span>${vacation?'<i class="vacation-cell-badge" aria-hidden="true">🏖</i>':''}</div>`}).join('');
    const summary=above===below?'EMPATE':above>below?'ACIMA':'ABAIXO';
    return `<div class="status-matrix-row"><div class="status-tech-name"><strong>${escapeHtml(r.label)}</strong></div>${cells}<div class="status-summary ${summary==='ACIMA'?'above':summary==='ABAIXO'?'below':'tie'}">${summary}<small>${above}A • ${below}B</small></div></div>`;
  }).join('');
  el.innerHTML=`<div class="status-matrix-scroll"><div class="status-matrix" style="--status-cols:${months.length}">${head}${body}</div></div>`;
  bindChartTooltips(el);
}

function renderIndicatorLineChart(el,labels,series,{maxValue=null,percent=false,decimals=0,height=340,fitWidth=false,emphasis=false,axisFormatter=null,valueFormatter=null}={}){
  if(!el)return;
  const validSeries=(series||[]).filter(s=>(s.values||[]).some(v=>v!=null));
  if(!validSeries.length){el.innerHTML='<div class="chart-empty">Sem dados para este recorte.</div>';return;}
  el.classList.add('interactive-chart','chart-modern','premium-line-chart');
  const prefs=currentChartPreferences(),chartId=nextChartRenderId('line');
  const containerWidth=fitWidth?Math.max(0,Math.floor(el.clientWidth||el.getBoundingClientRect?.().width||0)-18):0;
  const resolvedHeight=configuredChartHeight(height),w=Math.max(900,(labels?.length||0)*124,containerWidth),h=Math.max(300,safe(resolvedHeight)||340),p=emphasis?{l:70,r:40,t:36,b:72}:{l:56,r:30,t:32,b:60};
  const vals=validSeries.flatMap(s=>s.values).filter(v=>v!=null).map(v=>safe(v));
  const rawTop=Math.max(1,...vals),scale=percent?configuredPercentScale(rawTop,maxValue):(maxValue!=null?{min:0,max:maxValue}:{min:0,max:rawTop*1.1}),range=Math.max(1,safe(scale.max)-safe(scale.min)),baseline=h-p.b;
  const x=i=>p.l+(labels.length<=1?0:i*(w-p.l-p.r)/(labels.length-1)),y=v=>p.t+(h-p.t-p.b)-((safe(v)-safe(scale.min))/range)*(h-p.t-p.b);
  const grid=[0,.25,.5,.75,1].map(f=>{const yy=p.t+(1-f)*(h-p.t-p.b),v=safe(scale.min)+range*f,label=axisFormatter?axisFormatter(v):(percent?`${v.toLocaleString('pt-BR',{maximumFractionDigits:0})}%`:v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:decimals}));return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" class="grid-line"/><text x="8" y="${yy+4}" class="axis-label">${label}</text>`}).join('');
  const tickStep=labels.length>24?Math.ceil(labels.length/7):labels.length>16?Math.ceil(labels.length/8):labels.length>12?2:1;
  const xLabels=labels.map((label,i)=>{if(i!==0&&i!==labels.length-1&&i%tickStep!==0)return'';const raw=String(label||''),shown=raw.includes('/')?raw:raw.split(' ')[0].slice(0,3);return `<text x="${x(i)}" y="${h-17}" text-anchor="middle" class="axis-label history-x-label">${escapeHtml(shown)}</text>`}).join('');
  const defs=[];
  validSeries.forEach((s,si)=>defs.push(svgSeriesGradient(`${chartId}-area-${si}`,s.color||'var(--accent)',validSeries.length>5?.05:emphasis?.16:.10)));
  const paths=validSeries.map((s,si)=>{
    const color=s.color||'var(--accent)',segments=splitChartPointSegments(s.values,x,y),visual=chartEngineLineVisual(prefs,{emphasis,dashed:!!s.dashed});
    const dash=s.dashed?' stroke-dasharray="7 7"':'',lineWidth=visual.lineWidth,pointRadius=visual.pointRadius;
    const showArea=!s.dashed;
    const areas=showArea?segments.filter(seg=>seg.length>1).map(seg=>`<path d="${smoothAreaPath(seg,baseline)}" fill="url(#${chartId}-area-${si})" class="chart-series-area" style="--series-color:${color}" data-series-index="${si}"></path>`).join(''):'';
    const linePaths=segments.filter(seg=>seg.length>1).map(seg=>`<path d="${smoothSvgPath(seg)}" fill="none" stroke="${color}" stroke-width="${lineWidth}" stroke-linecap="round" stroke-linejoin="round"${dash} class="chart-series-line chart-series-shape" style="--series-color:${color}" data-series-index="${si}"></path>`).join('');
    const dots=(s.values||[]).map((v,i)=>{if(v==null)return'';const vacation=!!s.vacations?.[i],cx=x(i),cy=y(v),offset=(si%3===0?-10:si%3===1?15:-22),label=valueFormatter?valueFormatter(v):chartValueText(v,{percent,decimals}),visible=chartLabelVisible(i,labels.length);return `${vacation?`<circle cx="${cx}" cy="${cy}" r="${pointRadius+4.2}" fill="none" stroke="var(--warn)" stroke-width="2.2" class="vacation-point-halo chart-series-shape" data-series-index="${si}" data-point-index="${i}"></circle>`:''}<circle cx="${cx}" cy="${cy}" r="${vacation?pointRadius+0.8:pointRadius}" fill="${color}" class="chart-point chart-series-shape${vacation?' vacation-point':''}" style="--series-color:${color}" data-series-index="${si}" data-point-index="${i}"></circle>${visible?chartDataLabelSvg(cx,Math.max(p.t+10,Math.min(baseline-5,cy+offset)),label,{color,compact:validSeries.length>3}):''}`}).join('');
    return areas+linePaths+dots;
  }).join('');
  const rulers=(labels||[]).map((_,i)=>`<line x1="${x(i)}" y1="${p.t}" x2="${x(i)}" y2="${baseline}" class="chart-ruler" data-ruler-index="${i}"></line>`).join('');
  const plotWidth=Math.max(1,w-p.l-p.r),zoneWidth=labels.length<=1?plotWidth:plotWidth/(labels.length-1);
  const zones=(labels||[]).map((_,i)=>{const zx=labels.length<=1?p.l:Math.max(p.l,x(i)-zoneWidth/2),zw=labels.length<=1?plotWidth:(i===0||i===labels.length-1?zoneWidth/2:zoneWidth);return `<rect x="${zx}" y="${p.t}" width="${zw}" height="${h-p.t-p.b}" class="chart-hover-zone" data-chart-index="${i}"></rect>`}).join('');
  const legend=`<div class="chart-legend-inline chart-legend-visible chart-legend-interactive">${validSeries.map((s,si)=>`<button type="button" class="chart-legend-item" data-series-index="${si}" aria-pressed="false" title="Passe o mouse para destacar; clique para fixar"><i class="legend-swatch${s.dashed?' dashed':''}" style="background:${s.color||'var(--accent)'}"></i>${escapeHtml(s.name)}</button>`).join('')}</div>`;
  el.classList.toggle('chart-emphasis',!!emphasis);
  el.innerHTML=`<div class="chart-plot-scroll"><svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px;--chart-height:${h}px" preserveAspectRatio="none"><defs>${defs.join('')}</defs>${grid}${paths}${rulers}${zones}${xLabels}</svg></div>${legend}`;
  bindSharedChartTooltip(el,{labels,entriesForIndex:i=>validSeries.map(s=>s.values?.[i]==null?null:{name:s.vacations?.[i]?`${s.name} 🏖`:s.name,value:s.values[i],text:`${valueFormatter?valueFormatter(s.values[i]):chartValueText(s.values[i],{percent,decimals})}${s.vacations?.[i]?' • férias':''}`,color:s.color||'var(--accent)'})});
}




  const FEEDBACK_STORAGE_KEY='squadDashboardFeedbacksV25';
  function feedbackScopeKey(squad=currentSquad(),m=currentMonth()){return squad&&m?`${squad.code}|${m.id}`:null}
  function loadDemoFeedbackStore(){try{const rows=JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch(e){return[]}}
  function saveDemoFeedbackStore(rows){localStorage.setItem(FEEDBACK_STORAGE_KEY,JSON.stringify(rows||[]))}
  function normalizeFeedbackRow(r){return r?{...r,year:safe(r.year),month:safe(r.month),visible_to_technician:!!r.visible_to_technician,status:r.status||'draft',generated_snapshot:r.generated_snapshot||{}}:null}
  function feedbackMonthTechs(m=currentMonth()){return (m?.technicians||[]).filter(t=>safe(t.att)>0||safe(t.totalEval)>0).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'))}
  function feedbackRowForTech(rows,techName){return (rows||[]).find(r=>samePersonName(r.technician_name,techName))||null}
  function previousMonthForFeedback(squad,m){if(!squad||!m)return null;const ids=Object.keys(squad.months||{}).filter(id=>id<m.id).sort();return ids.length?squad.months[ids[ids.length-1]]:null}
  function feedbackTrendText(currentValue,previousValue,label,{percent=false,points=false}={}){
    const cur=safe(currentValue),prev=safe(previousValue);if(!prev)return'';const diff=cur-prev,ratio=Math.abs(diff)/(Math.abs(prev)||1);if(ratio<.03)return `${label} permaneceu estável em relação à competência anterior.`;const dir=diff>0?'evoluiu':'recuou';const formatted=percent?`${Math.abs(diff*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p.`:points?`${Math.abs(diff).toLocaleString('pt-BR',{maximumFractionDigits:1})} pts`:`${Math.abs(diff).toLocaleString('pt-BR',{maximumFractionDigits:0})}`;return `${label} ${dir} ${formatted} em relação à competência anterior.`;
  }
  function feedbackSnapshotForTech(t,m=currentMonth(),squad=currentSquad()){
    const refs=displayScoreRules(m),teamCfg=teamSettings(m),prevMonth=previousMonthForFeedback(squad,m),prev=prevMonth?(prevMonth.technicians||[]).find(x=>samePersonName(x.name,t.name)):null;
    return{version:1,squad:squad?.code||'',year:m?.year,month:m?.month,monthName:m?.monthName||'',technicianName:t.name,userId:t.userId||null,att:safe(t.att),notes5:safe(t.notes5),totalEval:safe(t.totalEval),avg:safe(t.avg),evalPct:safe(t.evalPct),points:safe(t.points),rank:safe(t.rank)||null,status:String(t.status||''),goalsHit:safe(t.goalsHit),goalAtt:safe(t.goalAtt),goalNotes5:safe(t.goalEval),goalEvalPct:safe(teamCfg.teamGoalEvalPct),refs:{att:safe(refs.refAtt),totalEval:safe(refs.refTotalEval),avg:safe(refs.refAvg),evalPct:safe(refs.refEvalPct)},previous:prev?{id:prevMonth.id,monthName:prevMonth.monthName,year:prevMonth.year,att:safe(prev.att),notes5:safe(prev.notes5),totalEval:safe(prev.totalEval),avg:safe(prev.avg),evalPct:safe(prev.evalPct),points:safe(prev.points),rank:safe(prev.rank)||null,status:String(prev.status||'')}:null};
  }
  function generatedFeedbackForTech(t,m=currentMonth(),squad=currentSquad()){
    const snap=feedbackSnapshotForTech(t,m,squad),monthLabel=`${snap.monthName} de ${snap.year}`,status=snap.status||'SEM STATUS',rankText=snap.rank?`${snap.rank}ª posição`:'posição não definida';
    const summaryParts=[`Em ${monthLabel}, ${titleWords(t.name)} registrou ${fmtInt(snap.att)} atendimentos, ${fmtInt(snap.totalEval)} avaliações (${fmtPct(snap.evalPct)} dos atendimentos), nota média ${snap.avg.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} e ${fmtNum(snap.points)} pontos, encerrando a competência na ${rankText} do Squad ${snap.squad} com status ${status}.`];
    if(snap.previous){const trends=[feedbackTrendText(snap.att,snap.previous.att,'O volume de atendimentos'),feedbackTrendText(snap.evalPct,snap.previous.evalPct,'A taxa de avaliação',{percent:true}),feedbackTrendText(snap.points,snap.previous.points,'A pontuação',{points:true})].filter(Boolean);if(trends.length)summaryParts.push(trends.join(' '));}
    const strengths=[];
    if(status==='ACIMA')strengths.push('Fechou a competência acima da referência geral do Squad, atendendo pelo menos dois dos quatro critérios da gamificação.');
    if(snap.goalAtt&&snap.att>=snap.goalAtt)strengths.push(`Atingiu a meta mensal de atendimentos (${fmtInt(snap.att)} de ${fmtInt(snap.goalAtt)}).`);
    if(snap.goalNotes5&&snap.notes5>=snap.goalNotes5)strengths.push(`Atingiu a meta mensal de notas 5 (${fmtInt(snap.notes5)} de ${fmtInt(snap.goalNotes5)}).`);
    if(snap.goalEvalPct&&snap.evalPct>=snap.goalEvalPct)strengths.push(`Manteve taxa de avaliação acima da meta do Squad (${fmtPct(snap.evalPct)} frente a ${fmtPct(snap.goalEvalPct)}).`);
    if(snap.avg>=snap.refs.avg&&snap.totalEval>0)strengths.push(`Nota média de ${snap.avg.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}, igual ou superior à referência da equipe (${snap.refs.avg.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}).`);
    if(snap.previous&&snap.points>snap.previous.points*1.05)strengths.push('Apresentou evolução relevante de pontuação em relação à competência anterior.');
    if(!strengths.length)strengths.push('Há produção registrada na competência e uma base objetiva para evolução dos indicadores no próximo ciclo.');
    const improvements=[];
    if(snap.goalAtt&&snap.att<snap.goalAtt)improvements.push(`Elevar o volume de atendimentos para alcançar a meta mensal de ${fmtInt(snap.goalAtt)}.`);
    if(snap.goalNotes5&&snap.notes5<snap.goalNotes5)improvements.push(`Aumentar a quantidade de notas 5 para alcançar a meta mensal de ${fmtInt(snap.goalNotes5)}.`);
    if(snap.goalEvalPct&&snap.evalPct<snap.goalEvalPct)improvements.push(`Reforçar a solicitação de avaliações ao final dos atendimentos; a taxa ficou em ${fmtPct(snap.evalPct)}, abaixo da meta de ${fmtPct(snap.goalEvalPct)}.`);
    if(snap.avg<snap.refs.avg&&snap.totalEval>0)improvements.push(`Trabalhar a experiência do cliente para superar a referência de nota média do Squad (${snap.refs.avg.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}).`);
    if(status==='ABAIXO')improvements.push(`Recuperar pelo menos dois dos quatro critérios da gamificação para voltar ao status ACIMA.`);
    if(snap.previous&&snap.points<snap.previous.points*.95)improvements.push('Revisar os fatores que provocaram queda de pontuação em relação à competência anterior e definir uma correção de rota objetiva.');
    if(!improvements.length)improvements.push('Manter a constância dos resultados e buscar evolução incremental sem perder qualidade no atendimento.');
    const goals=[];
    if(snap.goalAtt)goals.push(`Atingir pelo menos ${fmtInt(snap.goalAtt)} atendimentos no próximo mês.`);
    if(snap.goalNotes5)goals.push(`Buscar pelo menos ${fmtInt(snap.goalNotes5)} notas 5 no próximo mês.`);
    if(snap.goalEvalPct)goals.push(`Manter taxa de avaliação em ${fmtPct(snap.goalEvalPct)} ou superior.`);
    goals.push(`Manter a nota média igual ou acima da referência do Squad e acompanhar o ranking durante a competência.`);
    return{summary:summaryParts.join('\n\n'),strengths:strengths.map(x=>`• ${x}`).join('\n'),improvement_points:improvements.map(x=>`• ${x}`).join('\n'),next_month_goals:goals.map(x=>`• ${x}`).join('\n'),manager_notes:'',generated_snapshot:snap};
  }
  async function ensureFeedbacksLoaded(force=false){
    const squad=currentSquad(),m=currentMonth(),key=feedbackScopeKey(squad,m);if(!key)return[];if(!force&&state.feedbackCache[key])return state.feedbackCache[key];if(state.feedbackLoading[key])return state.feedbackCache[key]||[];state.feedbackLoading[key]=true;
    try{
      let rows=[];
      if(state.supabase){const {data,error}=await state.supabase.from('technician_feedbacks').select('*').eq('squad_id',squad.dbId).eq('year',m.year).eq('month',m.month).order('technician_name');if(error)throw error;rows=(data||[]).map(normalizeFeedbackRow);}
      else rows=loadDemoFeedbackStore().filter(r=>r.squad_code===squad.code&&safe(r.year)===safe(m.year)&&safe(r.month)===safe(m.month)).map(normalizeFeedbackRow);
      state.feedbackCache[key]=rows;return rows;
    }catch(err){console.error('Feedbacks indisponíveis',err);state.feedbackCache[key]=[];if(state.currentView==='feedbacks')toast('Não foi possível carregar os feedbacks. Confira se a migração V2.25.0 foi executada.');return[];}
    finally{delete state.feedbackLoading[key];if(state.currentView==='feedbacks'&&feedbackScopeKey()===key)renderFeedbacks();}
  }
  function renderFeedbacks(){
    if(!isAdmin()||!$('#view-feedbacks'))return;const specific=state.squadCode!=='all',m=currentMonth(),squad=currentSquad();$('#feedbackScopeEmpty').classList.toggle('hidden',specific);$('#feedbackContent').classList.toggle('hidden',!specific);$('#generateSquadFeedbacksBtn').disabled=!specific||!m;if($('#regenerateSquadFeedbacksBtn'))$('#regenerateSquadFeedbacksBtn').disabled=!specific||!m;if(!specific)return;
    if(!m){$('#feedbackMonthLabel').textContent='Sem competência';$('#feedbackRows').innerHTML='<div class="chart-empty">Importe uma competência para gerar feedbacks.</div>';return;}
    $('#feedbackMonthLabel').textContent=`${m.monthName} ${m.year}`;const key=feedbackScopeKey(squad,m),rows=state.feedbackCache[key];if(!rows){$('#feedbackRows').innerHTML='<div class="chart-empty">Carregando feedbacks...</div>';ensureFeedbacksLoaded();return;}
    const techs=feedbackMonthTechs(m),finalized=rows.filter(r=>r.status==='finalized').length,drafts=rows.filter(r=>r.status==='draft').length;$('#feedbackTechCount').textContent=fmtInt(techs.length);$('#feedbackFinalizedCount').textContent=fmtInt(finalized);$('#feedbackDraftCount').textContent=fmtInt(drafts);$('#feedbackProgressPct').textContent=techs.length?fmtPct(finalized/techs.length):'0%';$('#feedbackListHint').textContent=`${m.monthName} ${m.year} • ${rows.length} de ${techs.length} registros gerados`;
    $('#feedbackRows').innerHTML=techs.map(t=>{const r=feedbackRowForTech(rows,t.name),status=r?.status==='finalized'?'FINALIZADO':r?'RASCUNHO':'NÃO GERADO',klass=r?.status==='finalized'?'finalized':r?'draft':'pending';return `<div class="feedback-row"><div class="feedback-person"><strong>${escapeHtml(titleWords(t.name))}</strong><small>Squad ${escapeHtml(squad.code)} • ${escapeHtml(m.monthName)} ${m.year}</small></div><div class="feedback-metric"><span>Atend.</span><strong>${fmtInt(t.att)}</strong></div><div class="feedback-metric"><span>% Aval.</span><strong>${fmtPct(t.evalPct)}</strong></div><div class="feedback-metric optional"><span>Pontos</span><strong>${fmtNum(t.points)}</strong></div><div class="feedback-metric optional"><span>Status</span><strong>${escapeHtml(t.status||'—')}</strong></div><div class="feedback-row-actions"><span class="feedback-status-badge ${klass}">${status}</span>${r?`<button class="btn secondary compact" type="button" data-feedback-regenerate="${escapeHtml(t.name)}">↻ Regerar</button><button class="btn secondary compact" type="button" data-feedback-open="${escapeHtml(t.name)}">Revisar</button>`:`<button class="btn primary compact" type="button" data-feedback-generate="${escapeHtml(t.name)}">Gerar</button>`}</div></div>`}).join('')||'<div class="chart-empty">Nenhum técnico com produção nesta competência.</div>';
    $$('[data-feedback-open]').forEach(b=>b.addEventListener('click',()=>openFeedbackEditorByName(b.dataset.feedbackOpen)));
    $$('[data-feedback-generate]').forEach(b=>b.addEventListener('click',()=>generateSingleFeedback(b.dataset.feedbackGenerate)));
    $$('[data-feedback-regenerate]').forEach(b=>b.addEventListener('click',()=>regenerateSingleFeedback(b.dataset.feedbackRegenerate)));
  }
  function feedbackPayloadForTech(t,generated,existing=null){const m=currentMonth(),squad=currentSquad(),now=new Date().toISOString();return{organization_id:state.user.organizationId||existing?.organization_id||null,squad_id:squad.dbId||existing?.squad_id||null,technician_user_id:t.userId||existing?.technician_user_id||null,technician_name:t.name,year:m.year,month:m.month,summary:generated.summary||'',strengths:generated.strengths||'',improvement_points:generated.improvement_points||'',next_month_goals:generated.next_month_goals||'',manager_notes:generated.manager_notes||'',status:existing?.status||'draft',visible_to_technician:existing?.visible_to_technician===true,generated_snapshot:generated.generated_snapshot||{},created_by:existing?.created_by||state.user.userId||null,updated_by:state.user.userId||null,updated_at:now,finalized_at:existing?.finalized_at||null};}
  async function persistGeneratedFeedbacks(payloads){
    if(!payloads.length)return[];if(state.supabase){const {data,error}=await state.supabase.from('technician_feedbacks').upsert(payloads,{onConflict:'organization_id,squad_id,year,month,technician_name'}).select('*');if(error)throw error;return(data||[]).map(normalizeFeedbackRow)}
    const store=loadDemoFeedbackStore();payloads.forEach(p=>{const ix=store.findIndex(r=>r.squad_code===state.squadCode&&safe(r.year)===safe(p.year)&&safe(r.month)===safe(p.month)&&samePersonName(r.technician_name,p.technician_name));const row={...p,id:ix>=0?store[ix].id:`demo-feedback-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,squad_code:state.squadCode,organization_id:p.organization_id||'demo-org',squad_id:p.squad_id||`demo-${state.squadCode}`};if(ix>=0)store[ix]=row;else store.push(row)});saveDemoFeedbackStore(store);return store.filter(r=>r.squad_code===state.squadCode&&safe(r.year)===safe(currentMonth().year)&&safe(r.month)===safe(currentMonth().month)).map(normalizeFeedbackRow);
  }
  async function generateSquadFeedbacks(){
    if(!isAdmin()||!hasPermission('feedback.manage')||!requireSpecificSquad())return;const m=currentMonth(),squad=currentSquad();if(!m)return toast('Selecione uma competência com dados.');const key=feedbackScopeKey(squad,m),rows=await ensureFeedbacksLoaded(),techs=feedbackMonthTechs(m),missing=techs.filter(t=>!feedbackRowForTech(rows,t.name));if(!missing.length)return toast('Todos os feedbacks desta competência já foram gerados.');const btn=$('#generateSquadFeedbacksBtn');btn.disabled=true;const old=btn.textContent;btn.textContent='Gerando...';try{const payloads=missing.map(t=>feedbackPayloadForTech(t,generatedFeedbackForTech(t,m,squad)));const saved=await persistGeneratedFeedbacks(payloads);state.feedbackCache[key]=state.supabase?[...rows,...saved.filter(n=>!feedbackRowForTech(rows,n.technician_name))]:saved;toast(`${missing.length} feedback(s) gerado(s) como rascunho.`);renderFeedbacks();}catch(err){console.error(err);toast('Não foi possível gerar os feedbacks. Confira a migração V2.25.0.');}finally{btn.disabled=false;btn.textContent=old;}}
  async function generateSingleFeedback(techName){const m=currentMonth(),squad=currentSquad(),t=feedbackMonthTechs(m).find(x=>samePersonName(x.name,techName));if(!t)return;const key=feedbackScopeKey(squad,m),rows=await ensureFeedbacksLoaded();try{const saved=await persistGeneratedFeedbacks([feedbackPayloadForTech(t,generatedFeedbackForTech(t,m,squad))]);const row=saved.find(x=>samePersonName(x.technician_name,t.name))||saved[0];state.feedbackCache[key]=[...rows.filter(x=>!samePersonName(x.technician_name,t.name)),row];renderFeedbacks();openFeedbackEditor(row,t);}catch(err){console.error(err);toast('Não foi possível gerar este feedback.');}}

  async function regenerateSquadFeedbacks(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth(),squad=currentSquad();if(!m)return toast('Selecione uma competência com dados.');const key=feedbackScopeKey(squad,m),rows=await ensureFeedbacksLoaded(),techs=feedbackMonthTechs(m);const targets=techs.filter(t=>{const r=feedbackRowForTech(rows,t.name);return !r||r.status!=='finalized';});if(!targets.length)return toast('Não há rascunhos ou feedbacks pendentes para regerar.');
    if(!await confirmDialog(`Regerar em lote ${targets.length} feedback(s) não finalizados de ${m.monthName} ${m.year}? Os textos automáticos serão atualizados com os indicadores atuais. Feedbacks finalizados serão preservados e observações do gestor não serão apagadas.`,{title:'Regerar feedbacks em lote',confirmText:'Regerar',tone:'warning'}))return;
    const btn=$('#regenerateSquadFeedbacksBtn');if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent='Regerando...';}
    try{
      const payloads=targets.map(t=>{const existing=feedbackRowForTech(rows,t.name),generated=generatedFeedbackForTech(t,m,squad);generated.manager_notes=existing?.manager_notes||'';return{...feedbackPayloadForTech(t,generated,existing),status:'draft',finalized_at:null};});
      const saved=await persistGeneratedFeedbacks(payloads),savedMap=new Map(saved.map(r=>[nameLinkKey(r.technician_name),r]));state.feedbackCache[key]=rows.filter(r=>!savedMap.has(nameLinkKey(r.technician_name))).concat(saved);renderFeedbacks();toast(`${targets.length} feedback(s) atualizado(s). Feedbacks finalizados foram preservados.`);
    }catch(err){console.error(err);toast('Não foi possível regerar os feedbacks em lote.');}
    finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.oldText||'↻ Regerar em lote';delete btn.dataset.oldText;}}
  }
  async function regenerateSingleFeedback(techName){
    if(!isAdmin()||!techName)return;const m=currentMonth(),squad=currentSquad(),t=feedbackMonthTechs(m).find(x=>samePersonName(x.name,techName));if(!t)return;const key=feedbackScopeKey(squad,m),rows=await ensureFeedbacksLoaded(),existing=feedbackRowForTech(rows,t.name);if(!existing)return generateSingleFeedback(t.name);const finalized=existing.status==='finalized';
    const message=finalized?`Regerar o feedback finalizado de ${titleWords(t.name)}? O conteúdo automático será atualizado, o feedback voltará para rascunho e deixará de ficar disponível ao técnico até ser finalizado novamente. As observações do gestor serão preservadas.`:`Regerar o feedback de ${titleWords(t.name)}? O resumo, pontos positivos, pontos de desenvolvimento e compromissos serão atualizados com os indicadores atuais. As observações do gestor serão preservadas.`;
    if(!await confirmDialog(message,{title:'Regerar feedback individual',confirmText:'Regerar',tone:'warning'}))return;
    const btn=$('#feedbackRegenerateBtn');if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent='Regerando...';}
    try{
      const generated=generatedFeedbackForTech(t,m,squad);generated.manager_notes=existing.manager_notes||'';const payload={...feedbackPayloadForTech(t,generated,existing),status:'draft',finalized_at:null,visible_to_technician:finalized?false:!!existing.visible_to_technician};const saved=await persistGeneratedFeedbacks([payload]),row=saved.find(x=>samePersonName(x.technician_name,t.name))||saved[0];state.feedbackCache[key]=rows.filter(x=>!samePersonName(x.technician_name,t.name)).concat(row);renderFeedbacks();openFeedbackEditor(row,t);toast('Feedback regerado com os indicadores atuais.');
    }catch(err){console.error(err);toast('Não foi possível regerar este feedback.');}
    finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.oldText||'↻ Regerar conteúdo';delete btn.dataset.oldText;}}
  }
  function openFeedbackEditorByName(techName){const m=currentMonth(),rows=state.feedbackCache[feedbackScopeKey()]||[],t=feedbackMonthTechs(m).find(x=>samePersonName(x.name,techName)),r=feedbackRowForTech(rows,techName);if(t&&r)openFeedbackEditor(r,t)}
  function openFeedbackEditor(row,t){
    state.feedbackEditor={row,t};const snap=row.generated_snapshot&&Object.keys(row.generated_snapshot).length?row.generated_snapshot:feedbackSnapshotForTech(t);$('#feedbackEditorTech').textContent=titleWords(t.name);$('#feedbackEditorPeriod').textContent=`${currentMonth().monthName} ${currentMonth().year} • Squad ${state.squadCode}`;const finalized=row.status==='finalized';$('#feedbackEditorStatus').textContent=finalized?'FINALIZADO':'RASCUNHO';$('#feedbackEditorStatus').className=`feedback-status-badge ${finalized?'finalized':'draft'}`;$('#feedbackSummary').value=row.summary||'';$('#feedbackStrengths').value=row.strengths||'';$('#feedbackImprovements').value=row.improvement_points||'';$('#feedbackNextGoals').value=row.next_month_goals||'';$('#feedbackManagerNotes').value=row.manager_notes||'';$('#feedbackVisibleToTechnician').checked=!!row.visible_to_technician;$('#feedbackEditorMetrics').innerHTML=[['Atendimentos',fmtInt(snap.att)],['Avaliações',fmtInt(snap.totalEval)],['% avaliação',fmtPct(snap.evalPct)],['Nota média',safe(snap.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})],['Pontuação',fmtNum(snap.points)],['Ranking',snap.rank?`#${snap.rank}`:'—']].map(([a,b])=>`<div class="feedback-editor-metric"><span>${a}</span><strong>${b}</strong></div>`).join('');openModal('feedbackEditorModal');
  }
  async function saveFeedbackEditor(status='draft'){
    if(!hasPermission('feedback.manage'))return toast('Você não possui permissão para gerenciar feedbacks.');const editor=state.feedbackEditor;if(!editor?.row||!editor?.t)return;const row=editor.row,key=feedbackScopeKey(),now=new Date().toISOString(),payload={summary:$('#feedbackSummary').value.trim(),strengths:$('#feedbackStrengths').value.trim(),improvement_points:$('#feedbackImprovements').value.trim(),next_month_goals:$('#feedbackNextGoals').value.trim(),manager_notes:$('#feedbackManagerNotes').value.trim(),visible_to_technician:$('#feedbackVisibleToTechnician').checked,status,updated_by:state.user.userId||null,updated_at:now,finalized_at:status==='finalized'?now:null};const btn=status==='finalized'?$('#feedbackFinalizeBtn'):$('#feedbackSaveDraftBtn');btn.disabled=true;const old=btn.textContent;btn.textContent='Salvando...';try{let saved;if(state.supabase){const {data,error}=await state.supabase.from('technician_feedbacks').update(payload).eq('id',row.id).select('*').single();if(error)throw error;saved=normalizeFeedbackRow(data);}else{const store=loadDemoFeedbackStore(),ix=store.findIndex(x=>x.id===row.id);saved=normalizeFeedbackRow({...row,...payload});if(ix>=0)store[ix]=saved;saveDemoFeedbackStore(store);}state.feedbackCache[key]=(state.feedbackCache[key]||[]).map(x=>x.id===saved.id?saved:x);state.feedbackEditor={row:saved,t:editor.t};closeModal('feedbackEditorModal');renderFeedbacks();toast(status==='finalized'?'Feedback finalizado.':'Rascunho salvo.');}catch(err){console.error(err);toast('Não foi possível salvar o feedback.');}finally{btn.disabled=false;btn.textContent=old;}}
  async function loadMyFeedbacks(force=false){if(!isTechnician())return[];if(state.myFeedbacks&&!force)return state.myFeedbacks;if(state.myFeedbackLoading)return state.myFeedbacks||[];state.myFeedbackLoading=true;try{let rows=[];if(state.supabase){const {data,error}=await state.supabase.from('technician_feedbacks').select('*').eq('technician_user_id',state.user.userId).eq('status','finalized').eq('visible_to_technician',true).order('year',{ascending:false}).order('month',{ascending:false});if(error)throw error;rows=(data||[]).map(normalizeFeedbackRow);}else rows=loadDemoFeedbackStore().filter(r=>r.status==='finalized'&&r.visible_to_technician&&samePersonName(r.technician_name,state.user.techName)).sort((a,b)=>(safe(b.year)*100+safe(b.month))-(safe(a.year)*100+safe(a.month))).map(normalizeFeedbackRow);state.myFeedbacks=rows;return rows;}catch(err){console.error(err);state.myFeedbacks=[];return[]}finally{state.myFeedbackLoading=false;if(state.currentView==='my-feedbacks')renderMyFeedbacks();}}
  function renderMyFeedbacks(){if(!isTechnician()||!$('#myFeedbackRows'))return;if(!state.myFeedbacks){$('#myFeedbackRows').innerHTML='<div class="card chart-empty">Carregando feedbacks...</div>';loadMyFeedbacks();return;}const rows=state.myFeedbacks;$('#myFeedbackRows').innerHTML=rows.map(r=>{const snap=r.generated_snapshot||{},period=`${MONTHS_PT[Math.max(0,safe(r.month)-1)]||r.month}/${r.year}`;return `<article class="card my-feedback-card"><div class="my-feedback-head"><div><span class="eyebrow">${escapeHtml(period)} • SQUAD ${escapeHtml(snap.squad||state.user.squadCode||'')}</span><h3>Feedback mensal</h3><p>Finalizado em ${r.finalized_at?formatDateTime(r.finalized_at):'data não informada'}</p></div><span class="feedback-status-badge finalized">FINALIZADO</span></div><div class="my-feedback-sections"><div class="my-feedback-block full"><span>Resumo</span><p>${escapeHtml(r.summary||'—')}</p></div><div class="my-feedback-block"><span>Pontos positivos</span><p>${escapeHtml(r.strengths||'—')}</p></div><div class="my-feedback-block"><span>Pontos de desenvolvimento</span><p>${escapeHtml(r.improvement_points||'—')}</p></div><div class="my-feedback-block"><span>Compromissos</span><p>${escapeHtml(r.next_month_goals||'—')}</p></div><div class="my-feedback-block"><span>Observações do gestor</span><p>${escapeHtml(r.manager_notes||'Sem observações adicionais.')}</p></div></div></article>`}).join('')||'<div class="empty-state"><div>✎</div><h2>Nenhum feedback compartilhado</h2><p>Quando seu gestor finalizar e liberar um feedback mensal, ele aparecerá aqui.</p></div>';}


  function avatarInitial(user=state.user){return String(user?.fullName||user?.email||'U').trim().charAt(0).toUpperCase()||'U'}
  function localAvatarStorageKey(user=state.user){return `softenPerformanceAvatarV1:${user?.userId||user?.email||'anonymous'}`}
  function renderUserAvatar(el,user=state.user){
    if(!el||!user)return;const url=user.avatarUrl||(!state.supabase?localStorage.getItem(localAvatarStorageKey(user))||'':'');el.textContent=avatarInitial(user);el.classList.toggle('avatar-has-image',!!url);if(url)el.style.backgroundImage=`url("${String(url).replace(/"/g,'%22')}")`;else el.style.removeProperty('background-image');
  }
  function renderCurrentUserAvatars(){for(const el of [$('#topAvatar'),$('#homeAvatar'),$('#profileAvatar'),$('#profileAvatarPreview')])renderUserAvatar(el,state.user)}
  async function refreshCurrentUserAvatarUrl(){
    if(!state.user)return null;
    if(!state.supabase){state.user.avatarUrl=localStorage.getItem(localAvatarStorageKey(state.user))||null;renderCurrentUserAvatars();return state.user.avatarUrl}
    if(!state.user.avatarPath){state.user.avatarUrl=null;renderCurrentUserAvatars();return null}
    const {data,error}=await state.supabase.storage.from(AVATAR_BUCKET).createSignedUrl(state.user.avatarPath,86400);if(error)throw error;state.user.avatarUrl=data?.signedUrl||null;renderCurrentUserAvatars();return state.user.avatarUrl;
  }
  function loadImageElement(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível ler a imagem.'))};img.src=url;})}
  function canvasToBlob(canvas,quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível otimizar a imagem.')),'image/webp',quality))}
  async function optimizeAvatarFile(file){
    if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use uma imagem JPG, PNG ou WebP.');
    if(file.size>AVATAR_MAX_SOURCE_BYTES)throw new Error('A imagem original deve ter no máximo 5 MB.');
    const img=await loadImageElement(file);const size=Math.min(img.naturalWidth||img.width,img.naturalHeight||img.height);if(!size)throw new Error('Imagem inválida.');
    let outputSize=256,quality=.84,blob=null;
    for(let attempt=0;attempt<6;attempt++){
      const canvas=document.createElement('canvas');canvas.width=outputSize;canvas.height=outputSize;const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,outputSize,outputSize);const sx=((img.naturalWidth||img.width)-size)/2,sy=((img.naturalHeight||img.height)-size)/2;ctx.drawImage(img,sx,sy,size,size,0,0,outputSize,outputSize);blob=await canvasToBlob(canvas,quality);if(blob.size<=AVATAR_TARGET_BYTES)break;quality=Math.max(.58,quality-.08);if(attempt>=2)outputSize=Math.max(192,outputSize-24);
    }
    if(!blob||blob.size>128*1024)throw new Error('Não foi possível reduzir a foto para o limite seguro. Tente outra imagem.');return blob;
  }
  async function blobToDataUrl(blob){return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Falha ao preparar a imagem.'));reader.readAsDataURL(blob)})}
  async function handleProfileAvatarFile(event){
    const input=event?.target||$('#profileAvatarInput'),file=input?.files?.[0],msg=$('#profileAvatarMessage'),choose=$('#chooseProfileAvatarBtn');if(!file)return;if(msg){msg.className='profile-form-message';msg.textContent='Otimizando foto...'}if(choose)choose.disabled=true;
    try{
      const blob=await optimizeAvatarFile(file);
      if(state.supabase){
        if(!state.user?.organizationId||!state.user?.userId)throw new Error('Perfil sem organização ou usuário para armazenar a foto.');
        const path=`${state.user.organizationId}/${state.user.userId}.webp`;const {error:uploadError}=await state.supabase.storage.from(AVATAR_BUCKET).upload(path,blob,{contentType:'image/webp',upsert:true,cacheControl:'3600'});if(uploadError)throw uploadError;
        const {error:profileError}=await state.supabase.rpc('save_my_avatar_path',{p_avatar_path:path});if(profileError)throw profileError;state.user.avatarPath=path;await refreshCurrentUserAvatarUrl();
      }else{const dataUrl=await blobToDataUrl(blob);localStorage.setItem(localAvatarStorageKey(state.user),dataUrl);state.user.avatarUrl=dataUrl;renderCurrentUserAvatars();}
      if(msg){msg.className='profile-form-message success';msg.textContent=`Foto atualizada • ${Math.max(1,Math.round(blob.size/1024))} KB`;}
    }catch(err){console.error(err);if(msg){msg.className='profile-form-message';msg.textContent=err?.message||'Não foi possível atualizar a foto.';}}
    finally{if(choose)choose.disabled=false;if(input)input.value=''}
  }
  async function removeProfileAvatar(){
    const msg=$('#profileAvatarMessage'),btn=$('#removeProfileAvatarBtn');if(btn)btn.disabled=true;if(msg){msg.className='profile-form-message';msg.textContent='Removendo foto...'}
    try{
      if(state.supabase){if(state.user?.avatarPath){const {error}=await state.supabase.storage.from(AVATAR_BUCKET).remove([state.user.avatarPath]);if(error)throw error;}const {error:profileError}=await state.supabase.rpc('save_my_avatar_path',{p_avatar_path:null});if(profileError)throw profileError;state.user.avatarPath=null;state.user.avatarUrl=null;}else{localStorage.removeItem(localAvatarStorageKey(state.user));state.user.avatarUrl=null;}renderCurrentUserAvatars();if(msg){msg.className='profile-form-message success';msg.textContent='Foto removida. As iniciais voltaram a ser usadas.';}
    }catch(err){console.error(err);if(msg){msg.className='profile-form-message';msg.textContent=err?.message||'Não foi possível remover a foto.';}}
    finally{if(btn)btn.disabled=false}
  }

  function renderProfile(){
    if(!state.user||!$('#view-profile'))return;
    const u=state.user,role=roleLabel(u.role),scope=isAdmin()?'Todos os Squads':(u.squadCode?`Squad ${u.squadCode}`:'Sem Squad');
    renderUserAvatar($('#profileAvatar'),u);
    renderUserAvatar($('#profileAvatarPreview'),u);
    $('#profileName').textContent=u.fullName||'Usuário';
    $('#profileEmail').textContent=u.email||'E-mail não informado';
    $('#profileRole').textContent=role;
    $('#profileScope').textContent=scope;
    $('#profileFullName').textContent=u.fullName||'—';
    $('#profileAccountEmail').textContent=u.email||'—';
    $('#profileAccountRole').textContent=role;
    $('#profileAccountSquad').textContent=scope;
    $('#profileTechRow').classList.toggle('hidden',u.role!=='technician');
    $('#profileAccountTech').textContent=u.techName?titleWords(u.techName):'—';
    if($('#removeProfileAvatarBtn'))$('#removeProfileAvatarBtn').disabled=!(u.avatarPath||u.avatarUrl||(!state.supabase&&localStorage.getItem(localAvatarStorageKey(u))));
  }
  async function handleProfilePasswordChange(e){
    e.preventDefault();if(!state.user)return;
    const current=$('#profileCurrentPassword').value,newPassword=$('#profileNewPassword').value,confirm=$('#profileConfirmPassword').value,msg=$('#profilePasswordMessage'),btn=$('#profilePasswordSubmit');
    msg.className='profile-form-message';msg.textContent='';
    if(!current){msg.textContent='Informe sua senha atual.';return;}
    if(String(newPassword).length<8){msg.textContent='A nova senha precisa ter pelo menos 8 caracteres.';return;}
    if(newPassword!==confirm){msg.textContent='A confirmação da nova senha não confere.';return;}
    if(newPassword===current){msg.textContent='A nova senha precisa ser diferente da senha atual.';return;}
    btn.disabled=true;btn.textContent='Atualizando...';
    try{
      if(state.supabase){
        const {error:reauthError}=await state.supabase.auth.signInWithPassword({email:state.user.email,password:current});
        if(reauthError)throw reauthError;
        const {error:updateError}=await state.supabase.auth.updateUser({password:newPassword});
        if(updateError)throw updateError;
      }else{
        updateCurrentDemoPassword(current,newPassword);
      }
      $('#profilePasswordForm').reset();
      msg.className='profile-form-message success';msg.textContent='Senha atualizada com sucesso. Use a nova senha no próximo login.';
      toast('Sua senha foi atualizada com sucesso.');
    }catch(err){
      console.error(err);msg.className='profile-form-message error';msg.textContent=humanProfilePasswordError(err);
    }finally{btn.disabled=false;btn.textContent='Atualizar minha senha';}
  }
  function updateCurrentDemoPassword(currentPassword,newPassword){
    const email=String(state.user?.email||'').toLowerCase(),u=findDemoUser(email);
    if(!u||String(u.password)!==String(currentPassword))throw new Error('Senha atual incorreta.');
    const list=loadDemoCreatedUsers().filter(x=>String(x.email||'').toLowerCase()!==email);
    list.push({...u,email:u.email||email,password:newPassword,userId:u.userId||`demo-profile-${Date.now()}`});
    saveDemoCreatedUsers(list);state.user.password=newPassword;
  }
  function humanProfilePasswordError(err){
    const m=String(err?.message||err||'');
    if(/invalid login|invalid.*credential/i.test(m))return'Senha atual incorreta.';
    if(/same password|different from the old|different.*password/i.test(m))return'A nova senha precisa ser diferente da senha atual.';
    if(/password.*(least|characters|short)/i.test(m))return'A nova senha não atende aos requisitos de segurança. Use pelo menos 8 caracteres.';
    if(/rate limit/i.test(m))return'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    return m||'Não foi possível alterar a senha.';
  }

  function normalizeHelpSearchText(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
  function openHelpTarget(btn){
    if(!btn)return;
    const permission=btn.dataset.permission||'';
    if(permission&&!hasPermission(permission))return toast('Você não possui permissão para esta tela.');
    if(btn.dataset.helpSettingsModule)return openSettingsModule(btn.dataset.helpSettingsModule);
    if(btn.dataset.helpAdminSection)return showView('admin',btn.dataset.helpAdminSection);
    if(btn.dataset.helpView)return showView(btn.dataset.helpView);
  }
  function applyHelpSearch(){
    const input=$('#helpSearchInput');if(!input)return;
    const query=normalizeHelpSearchText(input.value),items=$$('#view-help .help-searchable');let visible=0;
    for(const item of items){
      const haystack=normalizeHelpSearchText(`${item.dataset.helpSearch||''} ${item.textContent||''}`),roleHidden=item.classList.contains('hidden'),match=!query||haystack.includes(query);
      item.classList.toggle('help-filtered-out',!match);
      if(match&&!roleHidden)visible++;
      if(query&&match&&item.tagName==='DETAILS'&&!roleHidden)item.open=true;
    }
    if($('#clearHelpSearchBtn'))$('#clearHelpSearchBtn').classList.toggle('hidden',!query);
    if($('#helpSearchCount'))$('#helpSearchCount').textContent=query?`${visible} tópico${visible===1?'':'s'} encontrado${visible===1?'':'s'}`:'Guia completo exibido';
    if($('#helpNoResults'))$('#helpNoResults').classList.toggle('hidden',!query||visible>0);
  }
  function renderHelp(){
    if(!state.user)return;
    $('#helpRoleName').textContent=roleLabel(state.user.role);
    $('#helpRoleScope').textContent=isSuperAdmin()?'Todos os Squads':`Squad ${state.user.squadCode}`;
    if($('#helpRoleAccess'))$('#helpRoleAccess').textContent=isAdmin()?'Administrador • acesso completo a todos os Squads e módulos':'Consulta pessoal, Visão do Squad, Apresentação e recursos liberados';
    applyHelpSearch();
  }

  async function renderUsers(){
    if(!isAdmin())return;
    $('#usersScopeText').textContent=state.squadCode==='all'?'Você está vendo usuários de toda a organização.':'Você está filtrando a listagem pelo Squad '+state.squadCode+'. Administradores continuam com acesso global.';
    if(!state.userDirectoryLoaded) await loadUserDirectory();
    renderUserRows();
  }
  async function loadUserDirectory(){
    if(!isAdmin()||!hasPermission('users.manage'))return;
    if(state.supabase){
      let rows=null;
      try{
        let q=state.supabase.from('profiles').select('user_id,email,full_name,role,squad_id,technician_name,active,permissions,squads(code,name)').order('full_name');
        const {data,error}=await q;if(error)throw error;rows=data||[];
      }catch(err){
        console.warn('Permissões granulares ainda não disponíveis no banco; usando perfis padrão.',err);
        let q=state.supabase.from('profiles').select('user_id,email,full_name,role,squad_id,technician_name,active,squads(code,name)').order('full_name');
        const {data,error}=await q;if(error)throw error;rows=data||[];
      }
      state.userDirectory=rows.map(p=>({userId:p.user_id,email:p.email||'',fullName:p.full_name,role:normalizeAccessRole(p.role),squadCode:normalizeAccessRole(p.role)==='super_admin'?null:(p.squads?.code||null),techName:p.technician_name||'',active:p.active!==false,permissions:p.permissions||{}}));
    }else{
      state.userDirectory=allDemoUsers().map((u,i)=>({userId:u.userId||`demo-${i}`,email:u.email,fullName:u.fullName,role:normalizeAccessRole(u.role),squadCode:normalizeAccessRole(u.role)==='super_admin'?null:(u.squadCode||null),techName:u.techName||'',active:u.active!==false,permissions:u.permissions||{}}));
    }
    state.userDirectoryLoaded=true;
  }
  function scopedUserDirectory(){
    let list=[...(state.userDirectory||[])];
    if(state.squadCode!=='all') list=list.filter(u=>u.squadCode===state.squadCode || (u.role==='super_admin'&&!u.squadCode));
    return list;
  }
  function renderUserRows(){
    if(!isAdmin()||!$('#userRows'))return;
    const search=String($('#userSearchInput')?.value||'').trim().toLowerCase(),role=$('#userRoleFilter')?.value||'all';
    let list=scopedUserDirectory();
    if(role!=='all')list=list.filter(u=>u.role===role);
    if(search)list=list.filter(u=>[u.fullName,u.email,u.techName,u.squadCode].some(v=>String(v||'').toLowerCase().includes(search)));
    $('#usersCountLabel').textContent=`${list.length} ${list.length===1?'usuário':'usuários'}`;
    const all=scopedUserDirectory(),counts={super_admin:0,technician:0};all.forEach(u=>{const role=normalizeAccessRole(u.role);if(counts[role]!=null)counts[role]++});
    $('#userStats').innerHTML=`<div class="card user-stat"><span>Total no escopo</span><strong>${all.length}</strong></div><div class="card user-stat"><span>Administradores</span><strong>${counts.super_admin}</strong></div><div class="card user-stat"><span>Técnicos</span><strong>${counts.technician}</strong></div>`;
    if(!list.length){$('#userRows').innerHTML='<tr><td colspan="6"><div class="users-empty">Nenhum usuário encontrado neste filtro.</div></td></tr>';return}
    $('#userRows').innerHTML=list.sort((a,b)=>String(a.fullName).localeCompare(String(b.fullName),'pt-BR')).map(u=>{const manageable=canManageDirectoryUser(u),deletable=canDeleteDirectoryUser(u),canToggle=manageable&&u.role!=='super_admin';return `<tr><td><div class="user-cell"><span class="user-avatar table-avatar">${escapeHtml((u.fullName||'U').charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(u.fullName||'Sem nome')}</strong><small>${escapeHtml(u.email||'E-mail não informado')}</small></div></div></td><td><span class="role-pill ${u.role}">${escapeHtml(roleLabel(u.role))}</span></td><td>${u.squadCode?`Squad ${escapeHtml(u.squadCode)}`:'Todos'}</td><td>${escapeHtml(u.techName||'—')}</td><td><span class="status-dot ${u.active?'on':'off'}"></span>${u.active?'Ativo':'Inativo'}</td><td><div class="user-actions"><button class="table-action" data-edit-user="${escapeHtml(u.userId)}" ${manageable?'':'disabled'}>Editar</button><button class="table-action ${u.active?'warning':'success'}" data-toggle-user="${escapeHtml(u.userId)}" ${canToggle?'':'disabled'}>${u.active?'Inativar':'Reativar'}</button><button class="table-action danger" data-delete-user="${escapeHtml(u.userId)}" ${deletable?'':'disabled'}>Excluir</button></div></td></tr>`}).join('');
    $$('[data-edit-user]').forEach(b=>b.addEventListener('click',()=>openEditUser(b.dataset.editUser)));
    $$('[data-toggle-user]').forEach(b=>b.addEventListener('click',()=>toggleUserActive(b.dataset.toggleUser)));
    $$('[data-delete-user]').forEach(b=>b.addEventListener('click',()=>deleteUser(b.dataset.deleteUser)));
  }
  function directoryUserById(userId){return (state.userDirectory||[]).find(u=>String(u.userId)===String(userId))||null}
  function canManageDirectoryUser(u){
    if(!u||!isAdmin()||!hasPermission('users.manage'))return false;
    if(String(u.userId)===String(state.user?.userId))return false;
    return isAdmin();
  }
  function canDeleteDirectoryUser(u){
    if(!canManageDirectoryUser(u))return false;
    if(u.role==='super_admin')return false;
    return isAdmin();
  }
  function openEditUser(userId){
    const u=directoryUserById(userId);if(!canManageDirectoryUser(u))return;
    $('#editUserError').textContent='';$('#editUserId').value=u.userId;$('#editUserName').value=u.fullName||'';$('#editUserEmail').value=u.email||'';
    const roleSel=$('#editUserRole'),squadSel=$('#editUserSquad');
    roleSel.innerHTML='<option value="technician">Técnico</option><option value="super_admin">Administrador</option>';
    roleSel.value=u.role;
    const allowed=Object.values(state.squads);
    squadSel.innerHTML='<option value="">Sem Squad</option>'+allowed.sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${escapeHtml(s.code)}">Squad ${escapeHtml(s.code)}</option>`).join('');
    squadSel.value=u.squadCode||'';squadSel.dataset.originalSquad=u.squadCode||'';$('#editUserTechName').value=u.techName||'';
    const now=new Date(),year=now.getFullYear(),month=now.getMonth()+1;$('#editUserEffectiveMonth').value=`${year}-${String(month).padStart(2,'0')}`;
    state.editPermissionDraft={...(u.permissions||{})};syncEditUserFields();renderPermissionEditor(u.role);openModal('editUserModal');
  }
  function syncEditUserFields(){
    const role=$('#editUserRole').value,isSuper=role==='super_admin';
    $('#editUserSquad').disabled=isSuper||!isSuperAdmin();if(isSuper)$('#editUserSquad').value='';
    $('#editTechnicianNameField').classList.toggle('hidden',role!=='technician');$('#editUserTechName').required=role==='technician';
    $('#editUserRole').disabled=false;
    const moved=isSuperAdmin()&&role==='technician'&&$('#editUserSquad').value&&$('#editUserSquad').value!==($('#editUserSquad').dataset.originalSquad||'');
    $('#editMovementPeriodField')?.classList.toggle('hidden',!moved);$('#editUserEffectiveMonth').required=moved;
  }
  async function handleEditUser(e){
    e.preventDefault();const u=directoryUserById($('#editUserId').value);if(!canManageDirectoryUser(u))return;
    const btn=$('#editUserSubmit');btn.disabled=true;btn.textContent='Salvando...';$('#editUserError').textContent='';
    try{
      const role=$('#editUserRole').value,squadCode=role==='super_admin'?null:$('#editUserSquad').value,techName=role==='technician'?normalizeName($('#editUserTechName').value):null;
      const period=$('#editUserEffectiveMonth').value||'',parts=period.split('-').map(Number);
      const permissions=role==='technician'&&hasPermission('permissions.manage')?collectPermissionOverrides():{};
      const payload={userId:u.userId,fullName:$('#editUserName').value.trim(),role,squadCode,techName,effectiveYear:parts[0]||null,effectiveMonth:parts[1]||null,permissions};
      if(!payload.fullName)throw new Error('Informe o nome completo.');if(role!=='super_admin'&&!state.squads[squadCode])throw new Error('Selecione um Squad válido.');if(role==='technician'&&!techName)throw new Error('Informe o nome do técnico como aparece no CSV.');
      if(state.supabase)await manageSupabaseUser('update',payload);else updateDemoUser({...payload,active:u.active});
      state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();closeModal('editUserModal');toast(`Usuário ${payload.fullName} atualizado${u.squadCode!==squadCode?` e movimentado para o Squad ${squadCode}`:''}.`);
    }catch(err){console.error(err);$('#editUserError').textContent=humanManageUserError(err)}finally{btn.disabled=false;btn.textContent='Salvar alterações'}
  }
  async function toggleUserActive(userId){
    const u=directoryUserById(userId);if(!canManageDirectoryUser(u)||u.role==='super_admin')return;const next=!u.active;
    if(!await confirmDialog(`${next?'Reativar':'Inativar'} o acesso de ${u.fullName}? ${next?'O login será liberado novamente.':'O login será bloqueado, mas todo o histórico será preservado.'}`,{title:next?'Reativar usuário':'Inativar usuário',confirmText:next?'Reativar':'Inativar',tone:next?'success':'warning'}))return;
    try{if(state.supabase)await manageSupabaseUser('set_active',{userId:u.userId,active:next});else updateDemoUser({...u,userId:u.userId,active:next});state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();toast(`${u.fullName} ${next?'reativado':'inativado'} com sucesso.`)}catch(err){console.error(err);toast(humanManageUserError(err))}
  }
  async function deleteUser(userId){
    const u=directoryUserById(userId);if(!canDeleteDirectoryUser(u))return;
    if(!await confirmDialog(`Excluir o acesso de ${u.fullName}? O login será removido. O histórico mensal já importado continuará preservado, porém sem vínculo com este usuário.`,{title:'Excluir usuário',confirmText:'Excluir',tone:'danger',requireText:'EXCLUIR'}))return;
    try{if(state.supabase)await manageSupabaseUser('delete',{userId:u.userId});else deleteDemoUser(u);state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();toast(`Usuário ${u.fullName} excluído.`)}catch(err){console.error(err);toast(humanManageUserError(err))}
  }
  async function manageSupabaseUser(action,payload){
    const body={action,user_id:payload.userId,full_name:payload.fullName,role:payload.role,squad_code:payload.squadCode,technician_name:payload.techName,active:payload.active,effective_year:payload.effectiveYear,effective_month:payload.effectiveMonth,permissions:payload.permissions};
    const {data,error}=await state.supabase.functions.invoke('manage-user',{body});if(error)throw await edgeFunctionErrorMessage(error);if(data?.error)throw new Error(data.error);return data
  }
  function updateDemoUser(p){
    const list=loadDemoCreatedUsers(),i=list.findIndex(x=>String(x.userId)===String(p.userId));if(i>=0){list[i]={...list[i],fullName:p.fullName,role:p.role,squadCode:p.squadCode,techName:p.techName,active:p.active,permissions:p.permissions||list[i].permissions||{}};saveDemoCreatedUsers(list);return}
    throw new Error('Usuários de demonstração padrão não são editáveis. Crie um usuário demo para testar esta função.');
  }
  function deleteDemoUser(u){const list=loadDemoCreatedUsers(),next=list.filter(x=>String(x.userId)!==String(u.userId));if(next.length===list.length)throw new Error('Usuários de demonstração padrão não podem ser excluídos.');saveDemoCreatedUsers(next)}
  function humanManageUserError(err){const m=String(err?.message||err||'');if(/function|failed to fetch|non-2xx/i.test(m))return'Falha no servidor. Confira se a Edge Function manage-user V2.38.0 foi publicada.';if(/self|próprio|proprio/i.test(m))return'Não é permitido alterar, inativar ou excluir o próprio acesso por esta tela.';if(/movimenta.*futur|competência.*futur/i.test(m))return'A movimentação deve começar no mês atual ou em uma competência anterior.';return m||'Não foi possível concluir a operação.'}

  function openCreateUser(){
    if(!isAdmin()||!hasPermission('users.manage'))return;
    $('#createUserForm').reset();$('#createUserError').textContent='';
    const roleSel=$('#newUserRole');
    roleSel.innerHTML='<option value="technician">Técnico</option><option value="super_admin">Administrador</option>';
    const squadSel=$('#newUserSquad');
    const allowed=Object.values(state.squads);
    squadSel.innerHTML=allowed.sort((a,b)=>a.code.localeCompare(b.code)).map(s=>`<option value="${escapeHtml(s.code)}">Squad ${escapeHtml(s.code)}</option>`).join('');
    const preferred=state.squadCode!=='all'&&allowed.some(s=>s.code===state.squadCode)?state.squadCode:(state.user.squadCode||allowed[0]?.code);
    if(preferred)squadSel.value=preferred;
    $('#userModalHint').textContent='Crie Administradores com acesso completo ou Técnicos vinculados a um Squad.';
    syncCreateUserFields();openModal('userModal');
  }
  function syncCreateUserFields(){
    const role=$('#newUserRole').value,isSuper=role==='super_admin';
    $('#newUserSquad').disabled=isSuper||!isSuperAdmin();
    $('#technicianNameField').classList.toggle('hidden',role!=='technician');
    $('#newUserTechName').required=role==='technician';
    if(isSuper)$('#newUserSquad').value='';
  }
  async function handleCreateUser(e){
    e.preventDefault();if(!isAdmin())return;
    const submit=$('#createUserSubmit');submit.disabled=true;submit.textContent='Criando...';$('#createUserError').textContent='';
    try{
      const role=$('#newUserRole').value;
      const payload={fullName:$('#newUserName').value.trim(),email:$('#newUserEmail').value.trim().toLowerCase(),password:$('#newUserPassword').value,role,squadCode:role==='super_admin'?null:$('#newUserSquad').value,techName:role==='technician'?normalizeName($('#newUserTechName').value):null};
      validateNewUserPayload(payload);
      if(state.supabase) await createSupabaseUser(payload); else createDemoUser(payload);
      state.userDirectoryLoaded=false;await loadUserDirectory();renderUserRows();closeModal('userModal');toast(`Usuário ${payload.fullName} criado com sucesso.`);
    }catch(err){console.error(err);$('#createUserError').textContent=humanCreateUserError(err)}finally{submit.disabled=false;submit.textContent='Criar usuário'}
  }
  function validateNewUserPayload(p){
    if(!p.fullName)throw new Error('Informe o nome completo.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw new Error('Informe um e-mail válido.');if(String(p.password||'').length<8)throw new Error('A senha temporária deve ter pelo menos 8 caracteres.');
    if(!['technician','super_admin'].includes(p.role))throw new Error('Perfil inválido.');if(p.role!=='super_admin'&&!state.squads[p.squadCode])throw new Error('Selecione um Squad válido.');if(p.role==='technician'&&!p.techName)throw new Error('Informe o nome do técnico como aparece no CSV.');
  }
  function createDemoUser(p){
    if(allDemoUsers().some(u=>String(u.email).toLowerCase()===p.email))throw new Error('Já existe um usuário com este e-mail.');
    const list=loadDemoCreatedUsers();list.push({email:p.email,password:p.password,fullName:p.fullName,role:p.role,squadCode:p.squadCode,techName:p.techName,active:true,userId:`demo-${Date.now()}`});saveDemoCreatedUsers(list);
  }
  async function edgeFunctionErrorMessage(error){
    let message=String(error?.message||'').trim();
    const response=error?.context;
    try{
      if(response&&typeof response.clone==='function'){
        const copy=response.clone();
        const contentType=String(copy.headers?.get?.('content-type')||'').toLowerCase();
        if(contentType.includes('application/json')){
          const payload=await copy.json();
          message=String(payload?.error||payload?.message||message).trim();
        }else{
          const text=String(await copy.text()).trim();
          if(text)message=text;
        }
      }
    }catch(parseError){console.warn('Não foi possível ler o detalhe da Edge Function.',parseError)}
    const err=new Error(message||'Falha ao executar a função do servidor.');
    err.httpStatus=response?.status||null;
    return err;
  }
  async function createSupabaseUser(p){
    const body={full_name:p.fullName,email:p.email,password:p.password,role:p.role,squad_code:p.squadCode,technician_name:p.techName};
    // Renova a sessão imediatamente antes da ação administrativa. Isso evita que um token
    // antigo/expirado seja enviado para a Edge Function após muitas horas com o painel aberto.
    let session=null;
    try{
      const refreshed=await state.supabase.auth.refreshSession();
      if(!refreshed.error)session=refreshed.data?.session||null;
    }catch(refreshError){console.warn('Refresh de sessão não concluído antes de criar usuário.',refreshError)}
    if(!session){
      const current=await state.supabase.auth.getSession();
      if(current.error)throw current.error;
      session=current.data?.session||null;
    }
    if(!session?.access_token)throw new Error('Sua sessão administrativa expirou. Entre novamente no sistema e tente criar o usuário.');
    const {data,error}=await state.supabase.functions.invoke('create-user',{body,headers:{Authorization:`Bearer ${session.access_token}`}});
    if(error)throw await edgeFunctionErrorMessage(error);
    if(data?.error)throw new Error(data.error);
    return data;
  }
  function humanCreateUserError(err){
    const m=String(err?.message||err||'').trim();
    if(/já está cadastrad.*Squad|edite o usuário existente/i.test(m))return m;if(/already|registered|duplicate|unique|já existe/i.test(m))return'Já existe um usuário com este e-mail. Consulte a listagem e edite o cadastro existente; se não aparecer, confira Authentication > Users.';
    if(/sess[aã]o|jwt|token|unauthorized/i.test(m))return'Sua sessão administrativa expirou ou não foi aceita pelo servidor. Saia, entre novamente e tente de novo.';
    if(/perfil administrador não encontrado/i.test(m))return'Seu login existe, mas o perfil administrativo não foi localizado no banco. Confira a tabela profiles para o seu usuário.';
    if(/sem permissão/i.test(m))return'Seu perfil atual não tem permissão para criar esse tipo de usuário.';
    if(/squad inválido|fora da organização/i.test(m))return'O Squad selecionado não foi localizado para esta organização.';
    if(/configuração do servidor incompleta|service.role|service_role/i.test(m))return'A Edge Function create-user está sem a configuração de servidor necessária. Republique a função no projeto correto do Supabase.';
    if(/function not found|404|failed to fetch/i.test(m))return'A Edge Function create-user não foi encontrada. Republique a função create-user no Supabase.';
    if(/non-2xx|edge function/i.test(m))return`A Edge Function create-user respondeu com erro${err?.httpStatus?` HTTP ${err.httpStatus}`:''}. Abra Supabase > Edge Functions > create-user > Logs para ver o motivo.`;
    return m||'Não foi possível criar o usuário.';
  }

  function renderAdminReconciliation(){
    const body=$('#adminReconciliationRows'),summary=$('#adminReconciliationSummary'),chip=$('#adminReconciliationChip');if(!body||!summary)return;
    const squads=analysisScopeSquads(),ids=indicatorMonthIds(squads);let id=state.currentId&&ids.includes(state.currentId)?state.currentId:(ids[ids.length-1]||null);
    if(!id){if(chip)chip.textContent='Sem competência';summary.innerHTML='<div><span>Conciliação</span><strong>—</strong><small>Importe os dois CSVs para iniciar</small></div>';body.innerHTML='<tr><td colspan="8" class="muted">Nenhuma competência disponível neste escopo.</td></tr>';return;}
    const rec=reconciliationMonthData(squads,id);state.reconciliationCache=state.reconciliationCache||{};state.reconciliationCache[id]=rec;if(chip)chip.textContent=`${rec.label} • ${state.squadCode==='all'?'Todos os Squads':`Squad ${state.squadCode}`}`;
    summary.innerHTML=`<div><span>Notas Serviço</span><strong>${fmtInt(rec.service)}</strong><small>Fonte operacional</small></div><div><span>Notas Produto</span><strong>${rec.hasQuality?fmtInt(rec.product):'—'}</strong><small>${rec.hasQuality?`Diferença ${diffText(rec.diffProduct)}`:'Aguardando importação'}</small></div><div><span>Notas Empresa</span><strong>${rec.hasQuality?fmtInt(rec.company):'—'}</strong><small>${rec.hasQuality?`Diferença ${diffText(rec.diffCompany)}`:'Aguardando importação'}</small></div><div><span>Técnicos divergentes</span><strong>${rec.hasQuality?fmtInt(rec.divergent):'—'}</strong><small>${rec.hasQuality?'Auditoria disponível':'Importe Produto/Empresa'}</small></div>`;
    body.innerHTML=`<tr><td><strong>${escapeHtml(rec.label)}</strong></td><td>${fmtInt(rec.service)}</td><td>${rec.hasQuality?fmtInt(rec.product):'—'}</td><td>${rec.hasQuality?fmtInt(rec.company):'—'}</td><td>${rec.hasQuality?`<span class="reconcile-diff ${diffClass(rec.diffProduct)}">${diffText(rec.diffProduct)}</span>`:'—'}</td><td>${rec.hasQuality?`<span class="reconcile-diff ${diffClass(rec.diffCompany)}">${diffText(rec.diffCompany)}</span>`:'—'}</td><td>${rec.hasQuality?fmtInt(rec.divergent):'—'}</td><td>${rec.hasQuality?`<button type="button" class="btn secondary reconcile-detail-btn" data-reconcile-id="${escapeHtml(rec.id)}">Ver técnicos</button>`:'<span class="muted">Sem qualidade</span>'}</td></tr>`;
  }

  const SUPPORT_COST_DEMO_KEY='squadDashboardSupportMonthlyCostsV2281';
  function loadDemoSupportCosts(){try{const rows=JSON.parse(localStorage.getItem(SUPPORT_COST_DEMO_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch(e){return[]}}
  function saveDemoSupportCosts(rows){localStorage.setItem(SUPPORT_COST_DEMO_KEY,JSON.stringify(rows||[]))}
  function supportCostMonthIds(){
    const ids=new Set(Object.keys(state.supportCostCache||{}));
    Object.values(state.squads||{}).forEach(squad=>Object.keys(squad?.months||{}).forEach(id=>ids.add(id)));
    return [...ids].filter(id=>/^\d{4}-\d{2}$/.test(id)).sort();
  }
  function supportCostDetectedTechnicians(id){
    const names=new Set();
    Object.values(state.squads||{}).forEach(squad=>{
      const m=squad?.months?.[id];if(!m)return;
      (m.technicians||[]).forEach(t=>{const key=nameLinkKey(t.name);if(key)names.add(key);});
    });
    return names.size;
  }
  function supportCostMonthParts(id){const [year,month]=String(id||'').split('-').map(Number);return{year,month}}
  function supportCostHasCache(id){return !!id&&Object.prototype.hasOwnProperty.call(state.supportCostCache||{},id)}
  async function ensureSupportCostsLoaded(id,{force=false}={}){
    if(!id||!isSuperAdmin())return null;
    if(!force&&supportCostHasCache(id))return state.supportCostCache[id]||null;
    if(state.supportCostLoading[id])return state.supportCostLoading[id];
    const task=(async()=>{
      const {year,month}=supportCostMonthParts(id);let row=null;
      if(state.supabase){
        const {data,error}=await state.supabase.from('support_monthly_costs').select('id,organization_id,year,month,payroll_cost,other_costs,technician_count,hours_per_day,updated_at').eq('organization_id',state.user.organizationId).eq('year',year).eq('month',month).maybeSingle();
        if(error)throw error;row=data||null;
      }else{
        row=loadDemoSupportCosts().find(r=>safe(r.year)===year&&safe(r.month)===month)||null;
      }
      state.supportCostCache[id]=row;return row;
    })();
    state.supportCostLoading[id]=task;
    try{return await task}finally{delete state.supportCostLoading[id];if(state.currentView==='admin'&&state.adminSection==='costs'&&state.supportCostMonthId===id)renderSupportCosts();}
  }
  function supportCostInputValue(sel,def=0){const el=$(sel);const v=safe(el?.value);return v>0?v:def}
  function updateSupportCostPreview(){
    if(!isSuperAdmin()||!state.supportCostMonthId||!$('#supportCostSummary'))return;
    const id=state.supportCostMonthId,{year,month}=supportCostMonthParts(id),payroll=Math.max(0,safe($('#supportPayrollCost')?.value)),other=Math.max(0,safe($('#supportOtherCosts')?.value)),techs=Math.max(0,Math.round(safe($('#supportTechnicianCount')?.value))),hoursPerDay=Math.max(.5,safe($('#supportHoursPerDay')?.value)||8),days=businessDaysMonFri(year,month),total=payroll+other,technicianDays=techs*days,totalHours=technicianDays*hoursPerDay,totalMinutes=totalHours*60,costDay=technicianDays?total/technicianDays:0,costHour=totalHours?total/totalHours:0,costMinute=totalMinutes?total/totalMinutes:0;
    $('#supportCostSummary').innerHTML=`<div class="support-cost-summary-card confidential"><span>Custo total do Suporte</span><strong>${fmtMoney(total)}</strong><small>Pagamentos + outros custos</small></div><div class="support-cost-summary-card"><span>Dias úteis</span><strong>${fmtInt(days)}</strong><small>${fmtInt(techs)} técnico(s) × ${hoursPerDay.toLocaleString('pt-BR',{maximumFractionDigits:1})}h/dia</small></div><div class="support-cost-summary-card"><span>Capacidade útil</span><strong>${totalHours.toLocaleString('pt-BR',{maximumFractionDigits:1})} h</strong><small>${fmtInt(totalMinutes)} minutos técnicos na competência</small></div><div class="support-cost-summary-card"><span>Custo / dia útil técnico</span><strong>${technicianDays?fmtMoney(costDay):'—'}</strong><small>Total ÷ técnicos ÷ dias úteis</small></div><div class="support-cost-summary-card"><span>Custo / hora técnica</span><strong>${totalHours?fmtMoney(costHour):'—'}</strong><small>Total ÷ técnicos ÷ dias ÷ horas</small></div><div class="support-cost-summary-card"><span>Custo / minuto técnico</span><strong>${totalMinutes?fmtMoney(costMinute):'—'}</strong><small>Referência para o futuro cálculo por atendimento</small></div>`;
  }
  function renderSupportCosts(){
    if(!isSuperAdmin()||!$('#supportCostMonthSelect'))return;
    let ids=supportCostMonthIds();
    if(!ids.length){
      $('#supportCostMonthSelect').innerHTML='';$('#supportCostStatus').textContent='Sem competências disponíveis.';$('#supportCostSummary').innerHTML='';return;
    }
    if(!state.supportCostMonthId||!ids.includes(state.supportCostMonthId))state.supportCostMonthId=ids[ids.length-1];
    const id=state.supportCostMonthId;
    $('#supportCostMonthSelect').innerHTML=ids.map(mid=>`<option value="${mid}" ${mid===id?'selected':''}>${escapeHtml(monthLabelFromId(mid))}</option>`).join('');
    if(!supportCostHasCache(id)){
      $('#supportCostStatus').textContent='Carregando custo geral...';ensureSupportCostsLoaded(id).catch(err=>{console.error(err);$('#supportCostStatus').textContent='Não foi possível carregar os custos. Confira a migração V2.28.1.';toast('Não foi possível carregar a base de custos. Confira a migração V2.28.1.');});return;
    }
    const saved=state.supportCostCache[id]||null,detected=supportCostDetectedTechnicians(id),techs=safe(saved?.technician_count)>0?Math.round(safe(saved.technician_count)):detected,hours=safe(saved?.hours_per_day)>0?safe(saved.hours_per_day):8;
    $('#supportPayrollCost').value=safe(saved?.payroll_cost)>0?safe(saved.payroll_cost).toFixed(2):'';
    $('#supportOtherCosts').value=safe(saved?.other_costs)>0?safe(saved.other_costs).toFixed(2):'';
    $('#supportTechnicianCount').value=techs||'';
    $('#supportHoursPerDay').value=hours;
    $('#supportDetectedTechnicians').textContent=`Quantidade detectada na competência: ${fmtInt(detected)}${saved&&techs!==detected?' • valor salvo mantido':''}`;
    $('#supportCostStatus').textContent=saved?.updated_at?`${monthLabelFromId(id)} • atualizado em ${formatDateTime(saved.updated_at)}`:`${monthLabelFromId(id)} • ainda não salvo`;
    updateSupportCostPreview();
  }
  async function saveSupportCosts(){
    if(!hasPermission('costs.view'))return toast('Você não possui permissão para alterar os custos.');
    if(!isSuperAdmin())return;
    const id=state.supportCostMonthId;if(!id)return toast('Selecione uma competência.');
    const before=clone(state.supportCostCache?.[id]||{}),{year,month}=supportCostMonthParts(id),payroll=Math.max(0,safe($('#supportPayrollCost')?.value)),other=Math.max(0,safe($('#supportOtherCosts')?.value)),detected=supportCostDetectedTechnicians(id),techs=Math.max(1,Math.round(safe($('#supportTechnicianCount')?.value)||detected||1)),hours=Math.max(.5,safe($('#supportHoursPerDay')?.value)||8),row={organization_id:state.user.organizationId||'demo',year,month,payroll_cost:Number(payroll.toFixed(2)),other_costs:Number(other.toFixed(2)),technician_count:techs,hours_per_day:Number(hours.toFixed(2)),updated_by:state.user.userId||null,updated_at:new Date().toISOString()};
    const btn=$('#saveSupportCostsBtn');if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    try{
      if(state.supabase){const {error}=await state.supabase.from('support_monthly_costs').upsert(row,{onConflict:'organization_id,year,month'});if(error)throw error;}
      else{let store=loadDemoSupportCosts().filter(r=>!(safe(r.year)===year&&safe(r.month)===month));store.push({...row,id:`demo-${id}`});saveDemoSupportCosts(store);}
      await ensureSupportCostsLoaded(id,{force:true});await logAuditEvent('costs.support_update',{entityType:'support_monthly_cost',entityId:id,squadId:null,description:`Custos gerais do Suporte atualizados em ${monthLabelFromId(id)}.`,beforeData:before,afterData:row,metadata:{period:id}});toast(`Custo geral de ${monthLabelFromId(id)} salvo com segurança.`);
    }catch(err){console.error(err);toast('Não foi possível salvar o custo geral. Confira a migração V2.28.1 e suas permissões.');}
    finally{if(btn){btn.disabled=false;btn.textContent='Salvar competência';}}
  }
  async function copyPreviousSupportCosts(){
    if(!isSuperAdmin())return;
    const current=state.supportCostMonthId,ids=supportCostMonthIds();if(!current)return toast('Selecione uma competência.');
    const prevIds=ids.filter(id=>id<current).sort().reverse();if(!prevIds.length)return toast('Não existe uma competência anterior disponível.');
    let previousId=null,previous=null;
    for(const id of prevIds){try{const row=await ensureSupportCostsLoaded(id);if(row&&(safe(row.payroll_cost)>0||safe(row.other_costs)>0)){previousId=id;previous=row;break;}}catch(err){console.error(err);return toast('Não foi possível carregar os custos da competência anterior.');}}
    if(!previousId||!previous)return toast('Nenhuma competência anterior possui custo geral cadastrado.');
    $('#supportPayrollCost').value=safe(previous.payroll_cost).toFixed(2);$('#supportOtherCosts').value=safe(previous.other_costs).toFixed(2);$('#supportTechnicianCount').value=safe(previous.technician_count)||supportCostDetectedTechnicians(current)||'';$('#supportHoursPerDay').value=safe(previous.hours_per_day)||8;updateSupportCostPreview();
    $('#supportCostStatus').textContent=`${monthLabelFromId(current)} • valores copiados de ${monthLabelFromId(previousId)} • revise e salve`;
    toast(`Custos gerais copiados de ${monthLabelFromId(previousId)}. Revise a quantidade de técnicos antes de salvar.`);
  }

  function renderAdmin(){
    if(!isAdmin())return;
    renderImportHistory();if(!state.importHistoryLoaded&&!state.importHistoryLoading)ensureImportHistoryLoaded();
    const specific=state.squadCode!=='all';
    if(!isSuperAdmin())state.appearanceScope='squad';else if(!specific)state.appearanceScope='all';
    if($('#appearanceScopeSelect')){$('#appearanceScopeSelect').value=state.appearanceScope;const allOpt=$('#appearanceScopeSelect').querySelector('option[value="all"]');if(allOpt)allOpt.disabled=!isSuperAdmin();const squadOpt=$('#appearanceScopeSelect').querySelector('option[value="squad"]');if(squadOpt){squadOpt.disabled=!specific;squadOpt.textContent=specific?`Somente Squad ${state.squadCode}`:'Somente Squad (selecione um Squad)'}}
    if($('#appearanceScopeHint'))$('#appearanceScopeHint').textContent=state.appearanceScope==='all'&&isSuperAdmin()?'As alterações de tema e gráficos serão replicadas para A, B, D e E.':'As alterações serão salvas somente no Squad selecionado.';
    syncChartPreferencePreview();
    if($('#chartPrefsStatus'))$('#chartPrefsStatus').textContent=canEditAppearance()?`As alterações serão salvas em ${appearanceScopeLabel()}.`:'Selecione um Squad específico para editar a aparência.';
    const m=currentMonth(),canImport=specific||isSuperAdmin(),locked=!!m?.isClosed;
    renderAdminReconciliation();
    $('#adminScopeTitle').textContent=specific?`Squad ${state.squadCode}`:'Todos os Squads';
    $('#adminScopeText').textContent=specific
      ? (locked?`${m.monthName} ${m.year} está FECHADO. Dados, metas e pontuação histórica estão protegidos. Reabra o mês para alterar.`:'Importação, métricas e fechamento abaixo afetam somente este Squad. Metas e regras ficam na Central de Configurações.')
      :'Administrador pode importar o CSV para todos os Squads de uma vez. Para métricas e fechamento/exclusão de mês, selecione um Squad específico; regras ficam em Configurações.';
    $('#adminImportBtn').disabled=!canImport;if($('#adminQualityImportBtn'))$('#adminQualityImportBtn').disabled=!canImport;
    const disableForScope=['#adminThemeBtn','#importThemeBtn','#exportThemeBtn'];
    const appearanceAllowed=canEditAppearance();
    disableForScope.forEach(sel=>{if($(sel))$(sel).disabled=!appearanceAllowed});
    const adminControlPermissions={
      '#saveGoalsBtn':'goals.manage','#autoGoalBtn':'goals.manage','#saveMonthlyMetricsBtn':'goals.manage','#saveScoreSettingsBtn':'goals.manage','#copyPreviousGoalsBtn':'goals.manage',
      '#saveFinanceBtn':'finance.manage','#saveFinanceTechniciansBtn':'finance.manage','#copyFinanceRulesBtn':'finance.manage','#exportFinanceExcelBtn':'finance.view','#exportFinancePdfBtn':'finance.view'
    };
    Object.entries(adminControlPermissions).forEach(([sel,permission])=>{const el=$(sel);if(!el)return;const lockSensitive=['#saveFinanceBtn','#saveFinanceTechniciansBtn','#copyFinanceRulesBtn'].includes(sel);el.disabled=!hasPermission(permission)||!specific||!m||(locked&&lockSensitive)});
    renderFinanceAdmin(m,specific,locked);
    const financeEditable=hasPermission('finance.manage')&&specific&&!!m&&!locked;
    ['#financeModelSquad','#financeModelIndividual','#financeCompareToggle','#financeTechnicianCompareToggle','#financeCustomersStart','#financeCanceledCount','#financeTopAttPrize','#financeTopNotesPrize','#financeBelowDiscount','#financeIndividualCap'].forEach(sel=>{const el=$(sel);if(el)el.disabled=!financeEditable});
    $$('[data-finance-tier]').forEach(el=>el.disabled=!financeEditable);
    if(state.adminSection==='costs'){
      $('#adminScopeTitle').textContent='Custos do Suporte';
      $('#adminScopeText').textContent='Base confidencial do custo geral do Suporte técnico. Informe pagamentos, outros custos, quantidade total de técnicos e horas úteis por dia; o sistema calcula o custo médio por dia, hora e minuto técnico sem separar por Squad.';
      renderSupportCosts();updateThemeName();return;
    }
    if(!specific||!m){
      $('#monthHistory').innerHTML=specific?'<div class="muted">Nenhum mês importado neste Squad.</div>':'<div class="muted">Selecione um Squad específico para ver o histórico.</div>';
      $('#teamGoalAttInput').value='';$('#teamGoalPctInput').value='';$('#autoGoalHint').textContent=m?'':'Importe um mês para configurar as metas.';
      $('#teamGoalAttInput').disabled=true;$('#teamGoalPctInput').disabled=true;
      ['scoreRefAtt','scoreRefEval','scoreRefAvg','scoreRefPct'].forEach(id=>{if($('#'+id)){$('#'+id).value='';$('#'+id).disabled=true}});if($('#scoreAutoHint'))$('#scoreAutoHint').textContent='Importe um mês para calcular as referências automáticas.';
      $('#monthlyMetricsRows').innerHTML='<tr><td colspan="11" class="muted">Importe um mês para preencher as métricas individuais.</td></tr>';
      $('#monthlyMetricsHint').textContent='Importe um mês para preencher as métricas.';
      updateThemeName();return;
    }
    const ids=Object.keys(currentMonths()).sort().reverse(),latestId=ids[0]||null,cfg=teamSettings(m);
    $('#monthHistory').innerHTML=ids.map(id=>{const mm=currentMonths()[id],closed=!!mm.isClosed,closedInfo=closed&&mm.closedAt?` • fechado em ${formatDateTime(mm.closedAt)}`:'';return `<div class="history-row ${closed?'month-closed':''}"><div><strong>${closed?'🔒 ':'🟢 '}${mm.monthName} ${mm.year}</strong><small>${escapeHtml(mm.sourceFile||'Banco de dados')} • ${mm.technicians.length} técnicos • até dia ${mm.latestDay}${closedInfo}</small></div><span class="tag ${closed?'closed':'open'}">${closed?'FECHADO':id===latestId?'EM ANDAMENTO':'ABERTO'}</span><button class="link-btn" data-open-month="${id}">Abrir</button>${closed?`<button class="link-btn" data-reopen-month="${id}">Reabrir</button>`:`<button class="link-btn" data-close-month="${id}">Fechar mês</button><button class="link-btn danger-link" data-delete-month="${id}">Excluir</button>`}</div>`}).join('');
    $$('[data-open-month]').forEach(b=>b.addEventListener('click',()=>{state.currentId=b.dataset.openMonth;chooseDefaultTech();refreshSelectors();render();showView('individual')}));
    $$('[data-delete-month]').forEach(b=>b.addEventListener('click',()=>deleteImportedMonth(b.dataset.deleteMonth)));
    $$('[data-close-month]').forEach(b=>b.addEventListener('click',()=>closeMonth(b.dataset.closeMonth)));
    $$('[data-reopen-month]').forEach(b=>b.addEventListener('click',()=>reopenMonth(b.dataset.reopenMonth)));
    $('#teamGoalAttInput').value=Math.round(cfg.teamGoalAtt);$('#teamGoalPctInput').value=(cfg.teamGoalEvalPct*100).toFixed(1);
    $('#teamGoalAttInput').disabled=locked||!hasPermission('goals.manage');$('#teamGoalPctInput').disabled=locked||!hasPermission('goals.manage');
    const useful=businessDaysMonFri(m.year,m.month),suggested=autoTeamAttGoal(m);$('#autoGoalHint').textContent=locked?'🔒 Mês fechado: metas preservadas como histórico.':`Sugestão: ${useful} dias úteis × 10 atendimentos × ${m.technicians.length} técnicos = ${fmtInt(suggested)} atendimentos.`;
    renderScoreSettings(m);renderMonthlyMetrics(m);updateThemeName();
  }

  function renderScoreSettings(m){
    const rules=displayScoreRules(m);
    $('#scoreRefAtt').value=safe(rules.refAtt).toFixed(0);$('#scoreRefEval').value=safe(rules.refTotalEval).toFixed(0);$('#scoreRefAvg').value=safe(rules.refAvg).toFixed(2);$('#scoreRefPct').value=(safe(rules.refEvalPct)*100).toFixed(2);
    ['scoreRefAtt','scoreRefEval','scoreRefAvg','scoreRefPct'].forEach(id=>$('#'+id).disabled=true);
    const pop=scoreReferencePopulation(m?.technicians||[]),countInfo=pop.active.length?` • ${pop.active.length} técnico${pop.active.length>1?'s':''} com produção na referência`:'';
    $('#scoreAutoHint').innerHTML=m?.isClosed?`🔒 <strong>Médias congeladas no fechamento:</strong> ${fmtNum(rules.refAtt)} atend. • ${fmtNum(rules.refTotalEval)} avaliações • nota ${safe(rules.refAvg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} • ${fmtPct(rules.refEvalPct)}${countInfo}.`:`<strong>Médias atuais do Squad:</strong> ${fmtNum(rules.refAtt)} atend. • ${fmtNum(rules.refTotalEval)} avaliações • nota ${safe(rules.refAvg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} • ${fmtPct(rules.refEvalPct)}${countInfo}. Competência parcial não altera o status operacional.`;
  }

  function renderMonthlyMetrics(m){
    const list=[...(m?.technicians||[])].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
    const locked=!!m.isClosed,disabled=locked?' disabled':'';
    const pop=scoreReferencePopulation(m?.technicians||[]),excludedEvalTotal=(m?.technicians||[]).reduce((s,t)=>s+normalizedEvaluationExcludedAtt(t),0);$('#monthlyMetricsHint').textContent=locked?`${m.monthName} ${m.year} • 🔒 mês fechado: metas, ajustes e pontuação estão congelados.`:`${m.monthName} ${m.year} • ${pop.active.length} técnico${pop.active.length===1?'':'s'} com produção compõem as médias de status • ${fmtInt(excludedEvalTotal)} atend. sem avaliação descontados da base das taxas.`;
    $('#monthlyMetricsRows').innerHTML=list.map(t=>`<tr data-metric-tech="${escapeHtml(t.name)}"><td><span class="table-tech-name">${escapeHtml(t.name)}${t.vacation?vacationBadgeHtml([m.id],{compact:true}):''}${groupCountBadgeHtml(t.excludeFromGroupCount,{compact:true})}</span></td><td>${fmtInt(t.att)}</td><td><input class="metric-input" data-field="evaluationExcludedAtt" type="number" min="0" max="${Math.max(0,safe(t.att)-safe(t.totalEval))}" step="1" value="${normalizedEvaluationExcludedAtt(t)}" title="Atendimentos que não dispararam e-mail de avaliação"${disabled}><small class="metric-sub">base ${fmtInt(eligibleEvaluationAttendance(t))}</small></td><td>${fmtInt(t.totalEval)}</td><td>${safe(t.avg).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>${fmtPct(t.evalPct)}</td><td><input class="metric-input" data-field="goalAtt" type="number" min="0" step="1" value="${safe(t.goalAtt)}"${disabled}></td><td><input class="metric-input" data-field="goalEval" type="number" min="0" step="1" value="${safe(t.goalEval)}"${disabled}></td><td><span class="status ${String(t.status).toUpperCase()==='ACIMA'?'above':'below'}">${escapeHtml(t.status||'—')}</span><small class="metric-sub">${fmtInt(t.goalsHit)}/4 critérios</small></td><td><strong>${fmtNum(t.points)}</strong></td><td><strong>${fmtNum(cumulativePointsForTech(t))}</strong></td></tr>`).join('')||'<tr><td colspan="11" class="muted">Nenhum técnico encontrado.</td></tr>';
  }

  function monthlyMetricsAuditSnapshot(m){return(m?.technicians||[]).map(t=>({name:t.name,evaluationExcludedAtt:normalizedEvaluationExcludedAtt(t),goalAtt:safe(t.goalAtt),goalEval:safe(t.goalEval),evalPct:safe(t.evalPct),points:safe(t.points),goalsHit:safe(t.goalsHit),status:t.status||''}))}
  async function saveMonthlyMetrics(){
    if(!hasPermission('goals.manage'))return toast('Você não possui permissão para alterar metas individuais.');
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar metas ou bonificações.');return}const btn=$('#saveMonthlyMetricsBtn');btn.disabled=true;btn.textContent='Salvando...';const before=monthlyMetricsAuditSnapshot(m);
    try{
      for(const row of $$('#monthlyMetricsRows [data-metric-tech]')){
        const t=m.technicians.find(x=>samePersonName(x.name,row.dataset.metricTech));if(!t)continue;
        for(const input of $$('[data-field]',row))t[input.dataset.field]=safe(input.value);
      }
      recalculateMonth(m);saveDemoSquads();if(state.supabase){await persistManualMetrics(m);await persistFinanceMonth(m)}invalidateDashboardCaches();await logAuditEvent('goals.monthly_metrics_update',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Metas e métricas individuais atualizadas em ${m.monthName} ${m.year}.`,beforeData:before,afterData:monthlyMetricsAuditSnapshot(m),metadata:{period:m.id,squad:state.squadCode}});refreshSelectors();render();toast('Metas e atendimentos sem avaliação salvos. Taxas, status, ranking e bonificação recalculados.');
    }catch(err){console.error(err);toast('Não foi possível salvar as métricas mensais.')}finally{btn.disabled=false;btn.textContent='Salvar metas e ajustes'}
  }

  async function saveScoreSettings(){
    if(!hasPermission('goals.manage'))return toast('Você não possui permissão para alterar referências.');
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar os parâmetros.');return}const btn=$('#saveScoreSettingsBtn');btn.disabled=true;btn.textContent='Recalculando...';
    try{
      m.scoreSettings={
        refAtt:optionalNumber($('#scoreRefAtt').value),
        refTotalEval:optionalNumber($('#scoreRefEval').value),
        refAvg:optionalNumber($('#scoreRefAvg').value),
        refEvalPct:optionalPercent($('#scoreRefPct').value),
        bonusAtt:20,bonusTotalEval:30,bonusAvg:40,bonusEvalPct:35
      };
      recalculateMonth(m);saveDemoSquads();
      if(state.supabase){
        const {error}=await state.supabase.from('squad_months').update({score_settings:m.scoreSettings,team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;
        await persistCalculatedScores(m);
      }
      invalidateDashboardCaches();
      render();toast('Parâmetros salvos. Pontuação, critérios, status e ranking recalculados.');
    }catch(err){console.error(err);toast('Não foi possível salvar os parâmetros de pontuação. Confira se as migrações V2.3.0 e V2.4.0 foram executadas.')}finally{btn.disabled=false;btn.textContent='Salvar parâmetros e recalcular'}
  }

  function optionalNumber(v){if(v==null||String(v).trim()==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null}
  function optionalPercent(v){const n=optionalNumber(v);return n==null?null:n/100}
  function optionalValue(v){return v==null||v===''?'':String(v)}
  function meanOf(list,getter){return list.length?list.reduce((sum,x)=>sum+safe(getter(x)),0)/list.length:0}
  function truncate2(n){return Math.trunc((safe(n)+1e-9)*100)/100}
  function maxEvaluationExcludedAtt(t){return Math.max(0,safe(t?.att)-safe(t?.totalEval))}
  function normalizedEvaluationExcludedAtt(t){return Math.min(Math.max(0,safe(t?.evaluationExcludedAtt)),maxEvaluationExcludedAtt(t))}
  function eligibleEvaluationAttendance(t){return Math.max(0,safe(t?.att)-normalizedEvaluationExcludedAtt(t))}
  function scoreReferencePopulation(rows){
    // Status operacional: a referência deve reproduzir a planilha oficial e considerar
    // todos os técnicos com produção, inclusive quem teve competência parcial.
    // O checkbox de desconsideração passa a ser exclusivamente financeiro.
    const active=(rows||[]).filter(t=>safe(t.att)>0);
    const divisor=active.length||1;
    return{active,counted:active,ratioBase:active,divisor,excludedCount:0};
  }
  function scoreRefsFromRows(rows){
    const pop=scoreReferencePopulation(rows);
    const totalAtt=pop.active.reduce((sum,t)=>sum+safe(t.att),0);
    const totalEval=pop.active.reduce((sum,t)=>sum+safe(t.totalEval),0);
    return{
      refAtt:roundTo(totalAtt/pop.divisor,0),
      refTotalEval:roundTo(totalEval/pop.divisor,0),
      refAvg:truncate2(meanOf(pop.active,t=>t.avg)),
      refEvalPct:roundTo(meanOf(pop.active,t=>t.evalPct),4),
      activeCount:pop.active.length,
      countedCount:pop.active.length,
      excludedCount:0
    };
  }
  function automaticScoreRefs(m){
    // Fórmula oficial da planilha: todos os técnicos com produção compõem as médias
    // e 2 de 4 critérios atendidos já resultam em ACIMA.
    return scoreRefsFromRows(m?.technicians||[]);
  }
  function businessDaysElapsed(y,m,latest){let c=0,limit=Math.min(Math.max(0,safe(latest)),new Date(y,m,0).getDate());for(let d=1;d<=limit;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function scoreRules(m,options={}){
    const auto=automaticScoreRefs(m),saved=m?.scoreSettings||{},totalDays=Math.max(1,businessDaysMonFri(m.year,m.month)),elapsedDays=Math.min(totalDays,businessDaysElapsed(m.year,m.month,m.latestDay));
    return{refAtt:auto.refAtt,refTotalEval:auto.refTotalEval,refAvg:auto.refAvg,refEvalPct:auto.refEvalPct,baseRefAtt:auto.refAtt,baseRefTotalEval:auto.refTotalEval,bonusAtt:safe(saved.bonusAtt)||20,bonusTotalEval:safe(saved.bonusTotalEval)||30,bonusAvg:safe(saved.bonusAvg)||40,bonusEvalPct:safe(saved.bonusEvalPct)||35,manualCount:0,progress:1,elapsedDays,totalDays,activeCount:auto.activeCount||0,countedCount:auto.activeCount||0,excludedCount:0,attSource:'Média de atendimentos de todos os técnicos com produção (0 casas)',evalSource:'Média de avaliações de todos os técnicos com produção (0 casas)',avgSource:'Média das notas médias de todos os técnicos com produção, truncada (2 casas)',pctSource:'Média da % ajustada de todos os técnicos com produção (4 casas)'};
  }
  function displayScoreRules(m){
    if(m?.isClosed&&m.closedSnapshot?.scoreRules){const r=m.closedSnapshot.scoreRules;return{...r,progress:1,elapsedDays:businessDaysMonFri(m.year,m.month),totalDays:businessDaysMonFri(m.year,m.month),attSource:'Referência congelada no fechamento',evalSource:'Referência congelada no fechamento',avgSource:'Referência congelada no fechamento',pctSource:'Referência congelada no fechamento'}}
    return scoreRules(m);
  }
  function calculateScore(t,rules){
    if(safe(t.att)<=0)return{points:0,goalsHit:0,status:''};
    const hits=[safe(t.att)>=rules.refAtt,safe(t.totalEval)>=rules.refTotalEval,safe(t.avg)>=rules.refAvg,safe(t.evalPct)>=rules.refEvalPct];
    const weights=[rules.bonusAtt,rules.bonusTotalEval,rules.bonusAvg,rules.bonusEvalPct];
    const adjustments=hits.reduce((sum,ok,i)=>sum+(ok?weights[i]:-weights[i]),0);
    const points=Number((safe(t.att)*safe(t.avg)+adjustments).toFixed(2));
    const goalsHit=hits.filter(Boolean).length;
    return{points,goalsHit,status:goalsHit>=2?'ACIMA':'ABAIXO'};
  }
  function teamStatusFromTechnicianStatuses(rows,{period=false}={}){
    const active=(rows||[]).filter(t=>safe(t.att)>0);
    if(!active.length)return{status:'',aboveCount:0,belowCount:0,count:0,ratio:0,excludedCount:0};
    // Resultado da equipe: usa os status individuais calculados pela regra 2 de 4.
    // Competência parcial não altera a leitura operacional do time; a desconsideração
    // existe apenas na Base do Squad e nos ajustes financeiros.
    const readStatus=t=>String(period?(t.periodStatus||t.status||''):(t.status||t.periodStatus||'')).toUpperCase();
    const classified=active.filter(t=>['ACIMA','ABAIXO'].includes(readStatus(t)));
    const aboveCount=classified.filter(t=>readStatus(t)==='ACIMA').length,belowCount=classified.filter(t=>readStatus(t)==='ABAIXO').length,count=classified.length,ratio=count?aboveCount/count:0;
    return{status:count?(ratio>=.5?'ACIMA':'ABAIXO'):'',aboveCount,belowCount,count,ratio,excludedCount:0};
  }
  function cumulativePointsForTech(t,squad=currentSquad()){
    if(!squad)return safe(t?.points);let total=0;
    const latestId=Object.keys(squad.months||{}).sort().reverse()[0]||null;
    for(const m of Object.values(squad.months||{})){
      if(!m.isClosed&&m.id!==latestId)continue;
      const match=(m.technicians||[]).find(x=>(t?.userId&&x.userId&&x.userId===t.userId)||samePersonName(x.name,t?.name));if(match)total+=safe(match.points)
    }
    return Number(total.toFixed(2));
  }

  function recalculateMonth(m,options={}){
    for(const t of m.technicians||[]){
      t.totalEval=safe(t.notes5)+safe(t.notes4)+safe(t.notes3)+safe(t.notes2)+safe(t.notes1);
      const rawAvg=t.totalEval?((safe(t.notes5)*5+safe(t.notes4)*4+safe(t.notes3)*3+safe(t.notes2)*2+safe(t.notes1))/t.totalEval):0;
      t.avg=truncate2(rawAvg);
      t.evaluationExcludedAtt=normalizedEvaluationExcludedAtt(t);
      t.eligibleAtt=eligibleEvaluationAttendance(t);
      t.evalPct=t.eligibleAtt?roundTo(t.totalEval/t.eligibleAtt,4):0;
    }
    if(m.isClosed&&Array.isArray(m.closedSnapshot?.technicians)){
      const snap=new Map(m.closedSnapshot.technicians.map(x=>[nameLinkKey(x.name),x]));
      for(const t of m.technicians||[]){const s=snap.get(nameLinkKey(t.name));if(!s)continue;['att','notes5','notes4','notes3','notes2','notes1','totalEval','avg','evalPct','evaluationExcludedAtt','eligibleAtt','goalAtt','goalEval','points','goalsHit'].forEach(k=>{if(s[k]!=null)t[k]=safe(s[k])});t.status=s.status||'';t.rank=safe(s.rank)||null;t.financeManualBonus=safe(s.financeManualBonus);t.salesCommission=safe(s.salesCommission);t.vacation=!!s.vacation;t.waiveBelowDiscount=!!s.waiveBelowDiscount;t.excludeFromGroupCount=!!s.excludeFromGroupCount;t.financeData=s.financeData?clone(s.financeData):(t.financeData||{});}
      if(m.closedSnapshot.financeSettings)m.financeSettings=clone(m.closedSnapshot.financeSettings);if(m.closedSnapshot.financeMonthData)m.financeMonthData=clone(m.closedSnapshot.financeMonthData);
      if(m.closedSnapshot.financeModel)m.financeModel=m.closedSnapshot.financeModel;else if(safe(m.closedSnapshot.version)<3)m.financeModel='individual';
      if(typeof m.closedSnapshot.financeCompare==='boolean')m.financeCompare=m.closedSnapshot.financeCompare;if(typeof m.closedSnapshot.financeTechCompare==='boolean')m.financeTechCompare=m.closedSnapshot.financeTechCompare;if(Number.isFinite(Number(m.closedSnapshot.financeIndividualCap)))m.financeIndividualCap=safe(m.closedSnapshot.financeIndividualCap);if(m.closedSnapshot.financeComparison)m.financeComparison=clone(m.closedSnapshot.financeComparison);if(m.closedSnapshot.financeRuleVersion)m.financeRuleVersion=m.closedSnapshot.financeRuleVersion;if(m.closedSnapshot.financeRuleFingerprint)m.financeRuleFingerprint=m.closedSnapshot.financeRuleFingerprint;
      m.teamTotals=deriveTotals(m.technicians);const closedTeamStatus=teamStatusFromTechnicianStatuses(m.technicians);m.teamResult=closedTeamStatus.status||m.closedSnapshot.teamResult||m.teamResult||'—';return;
    }
    const rules=scoreRules(m,{final:!!options.final});
    for(const t of m.technicians||[]){const scored=calculateScore(t,rules);t.points=scored.points;t.goalsHit=scored.goalsHit;t.status=scored.status;}
    const ranked=[...(m.technicians||[])].sort((a,b)=>safe(b.points)-safe(a.points)||safe(b.att)-safe(a.att)||String(a.name).localeCompare(String(b.name),'pt-BR'));
    const hasPoints=ranked.some(t=>safe(t.points)!==0);ranked.forEach((t,i)=>t.rank=hasPoints?i+1:null);
    m.teamTotals=deriveTotals(m.technicians);const teamStatus=teamStatusFromTechnicianStatuses(m.technicians);m.teamResult=teamStatus.status||'ABAIXO';recalculateFinance(m);
  }

  const DEMO_BUSINESS_CALENDAR_KEY='softenBusinessCalendarV2487';
  function businessCalendarLocalKey(){return`${DEMO_BUSINESS_CALENDAR_KEY}:${state.user?.organizationId||'demo'}`}
  function normalizeBusinessCalendarRow(row){
    const normalized=businessCalendar.normalizeException(row);if(!normalized)return null;
    return{...normalized,id:row?.id||normalized.id||null,organizationId:row?.organization_id||row?.organizationId||state.user?.organizationId||null};
  }
  function loadDemoBusinessCalendar(){try{const rows=JSON.parse(localStorage.getItem(businessCalendarLocalKey())||'[]');return Array.isArray(rows)?rows.map(normalizeBusinessCalendarRow).filter(Boolean):[]}catch(e){return[]}}
  function saveDemoBusinessCalendar(rows){try{localStorage.setItem(businessCalendarLocalKey(),JSON.stringify((rows||[]).map(row=>({date:row.date,description:row.description,type:row.type,active:row.active!==false}))));}catch(e){console.warn('Calendário operacional local indisponível.',e)}}
  function businessCalendarRowsForYear(year,rows=state.businessCalendarRows){return businessCalendar.mergeYearExceptions(Number(year),rows||[])}
  function financeBusinessCalendarSummary(m){
    if(!m)return{year:0,month:0,latestDay:0,weekdays:0,excludedCount:0,businessDays:0,exceptions:[]};
    if(m.isClosed&&m.closedSnapshot?.businessCalendar)return clone(m.closedSnapshot.businessCalendar);
    return businessCalendar.operationalSummary({year:m.year,month:m.month,latestDay:m.latestDay,exceptions:businessCalendarRowsForYear(m.year)});
  }
  async function ensureBusinessCalendarLoaded(force=false){
    if(state.businessCalendarLoading)return state.businessCalendarLoading;
    if(state.businessCalendarLoaded&&!force)return state.businessCalendarRows;
    state.businessCalendarLoading=(async()=>{
      try{
        if(state.supabase&&state.user?.organizationId){
          const {data,error}=await state.supabase.from('business_calendar_exceptions').select('id,organization_id,date,description,type,active,created_at,updated_at').eq('organization_id',state.user.organizationId).order('date');
          if(error)throw error;state.businessCalendarRows=(data||[]).map(normalizeBusinessCalendarRow).filter(Boolean);state.businessCalendarRemoteAvailable=true;
        }else{state.businessCalendarRows=loadDemoBusinessCalendar();state.businessCalendarRemoteAvailable=true;}
      }catch(err){
        console.warn('Calendário operacional remoto indisponível; usando somente feriados nacionais padrão.',err);state.businessCalendarRows=[];state.businessCalendarRemoteAvailable=false;
      }finally{state.businessCalendarLoaded=true;state.businessCalendarLoading=null;}
      return state.businessCalendarRows;
    })();
    return state.businessCalendarLoading;
  }
  function businessCalendarAvailableYears(m=currentMonth()){
    const years=new Set([new Date().getFullYear(),Number(m?.year)||0,Number(state.businessCalendarYear)||0].filter(Boolean));
    for(const row of state.businessCalendarRows||[]){const parsed=businessCalendar.parseDateKey(row.date);if(parsed)years.add(parsed.year)}
    for(const squad of Object.values(state.squads||{}))for(const month of Object.values(squad.months||{}))if(month?.year)years.add(Number(month.year));
    return [...years].sort((a,b)=>b-a);
  }
  function businessCalendarDraftForYear(year,{reset=false}={}){
    year=Number(year)||new Date().getFullYear();
    if(reset||!state.businessCalendarDraft||state.businessCalendarDraft.year!==year)state.businessCalendarDraft={year,rows:clone(businessCalendarRowsForYear(year))};
    return state.businessCalendarDraft;
  }
  function businessCalendarTypeLabel(type){return({national:'Nacional',state:'Estadual',municipal:'Municipal',company:'Empresa / recesso'})[type]||'Empresa / recesso'}
  function syncBusinessCalendarDraftFromDom(){
    const draft=state.businessCalendarDraft;if(!draft)return;
    const byDate=new Map((draft.rows||[]).map(row=>[row.date,row]));
    $$('#businessCalendarRows [data-calendar-date]').forEach(row=>{const item=byDate.get(row.dataset.calendarDate);if(!item)return;const active=row.querySelector('[data-calendar-field="active"]'),description=row.querySelector('[data-calendar-field="description"]'),type=row.querySelector('[data-calendar-field="type"]');item.active=!!active?.checked;item.description=String(description?.value||item.description||'Dia não útil').trim()||'Dia não útil';item.type=type?.value||item.type||'company';});
  }
  function renderBusinessCalendar(m=currentMonth()){
    const host=$('#businessCalendarRows'),yearSelect=$('#businessCalendarYearSelect');if(!host||!yearSelect)return;
    if(!state.businessCalendarYear)state.businessCalendarYear=Number(m?.year)||new Date().getFullYear();
    const years=businessCalendarAvailableYears(m);if(!years.includes(Number(state.businessCalendarYear)))years.push(Number(state.businessCalendarYear));years.sort((a,b)=>b-a);
    yearSelect.innerHTML=years.map(year=>`<option value="${year}">${year}</option>`).join('');yearSelect.value=String(state.businessCalendarYear);
    const draft=businessCalendarDraftForYear(state.businessCalendarYear),rows=[...(draft.rows||[])].sort((a,b)=>a.date.localeCompare(b.date)),canEdit=isAdmin()&&hasPermission('finance.manage');
    host.innerHTML=rows.map(row=>{const parsed=businessCalendar.parseDateKey(row.date),builtIn=row.builtIn===true,disabled=canEdit?'':' disabled';return`<div class="business-calendar-row ${row.active===false?'is-inactive':''}" data-calendar-date="${escapeHtml(row.date)}"><label title="Considerar este dia como não útil"><input data-calendar-field="active" type="checkbox" ${row.active!==false?'checked':''}${disabled}></label><div class="business-calendar-row-date">${parsed?String(parsed.day).padStart(2,'0')+'/'+String(parsed.month).padStart(2,'0'):'—'}<span class="business-calendar-origin">${builtIn?'Nacional padrão':'Personalizado'}</span></div><div class="calendar-description-cell"><input data-calendar-field="description" type="text" maxlength="120" value="${escapeHtml(row.description||'')}"${disabled}></div><div class="calendar-type-cell"><select data-calendar-field="type"${disabled}><option value="national" ${row.type==='national'?'selected':''}>Nacional</option><option value="state" ${row.type==='state'?'selected':''}>Estadual</option><option value="municipal" ${row.type==='municipal'?'selected':''}>Municipal</option><option value="company" ${row.type==='company'?'selected':''}>Empresa / recesso</option></select></div><div class="calendar-remove-cell">${builtIn?'':`<button class="btn secondary compact" type="button" data-calendar-remove="${escapeHtml(row.date)}"${disabled}>Remover</button>`}</div></div>`}).join('')||'<div class="muted">Nenhum dia não útil cadastrado neste ano.</div>';
    const yearRows=rows.filter(row=>row.active!==false),nationalCount=yearRows.filter(row=>row.type==='national').length,customCount=yearRows.filter(row=>row.builtIn!==true).length,currentSummary=m&&Number(m.year)===Number(state.businessCalendarYear)?businessCalendar.operationalSummary({year:m.year,month:m.month,latestDay:m.latestDay,exceptions:rows}):null;
    if($('#businessCalendarKpis'))$('#businessCalendarKpis').innerHTML=`<div class="business-calendar-kpi"><span>Dias não úteis ativos</span><strong>${fmtInt(yearRows.length)}</strong><small>${nationalCount} nacional(is) • ${customCount} personalizado(s)</small></div><div class="business-calendar-kpi"><span>${currentSummary?'Competência atual':'Ano selecionado'}</span><strong>${currentSummary?`${fmtInt(currentSummary.weekdays)} − ${fmtInt(currentSummary.excludedCount)} = ${fmtInt(currentSummary.businessDays)}`:String(state.businessCalendarYear)}</strong><small>${currentSummary?'seg–sex − dias não úteis = dias válidos':'Calendário compartilhado por todos os Squads'}</small></div><div class="business-calendar-kpi"><span>Descontados na competência</span><strong>${currentSummary?fmtInt(currentSummary.excludedCount):'—'}</strong><small>${currentSummary&&currentSummary.exceptions.length?currentSummary.exceptions.map(x=>`${String(x.day).padStart(2,'0')}/${String(m.month).padStart(2,'0')}`).join(' • '):'Nenhuma data útil descontada'}</small></div>`;
    if($('#businessCalendarStatus'))$('#businessCalendarStatus').textContent=state.businessCalendarRemoteAvailable?'Calendário da organização':'Somente padrão local';
    if($('#businessCalendarHint'))$('#businessCalendarHint').textContent=canEdit?(state.businessCalendarRemoteAvailable?'As alterações só entram no cálculo após salvar. Meses fechados permanecem congelados.':'Execute a migração V2.48.7 para salvar datas personalizadas no Supabase.'):'Somente Administradores com permissão financeira podem editar o calendário.';
    ['businessCalendarAddBtn','businessCalendarRestoreNationalBtn','businessCalendarSaveBtn','businessCalendarDateInput','businessCalendarDescriptionInput','businessCalendarTypeInput'].forEach(id=>{const el=$('#'+id);if(el)el.disabled=!canEdit});
  }
  function handleBusinessCalendarRowsChange(){syncBusinessCalendarDraftFromDom();renderBusinessCalendar(currentMonth())}
  function addBusinessCalendarDraftRow(){
    if(!isAdmin()||!hasPermission('finance.manage'))return;syncBusinessCalendarDraftFromDom();const date=$('#businessCalendarDateInput')?.value||'',parsed=businessCalendar.parseDateKey(date),year=Number(state.businessCalendarYear),description=$('#businessCalendarDescriptionInput')?.value.trim()||'',type=$('#businessCalendarTypeInput')?.value||'company';if(!parsed)return toast('Informe uma data válida.');if(parsed.year!==year)return toast(`A data precisa pertencer a ${year}.`);if(!description)return toast('Informe uma descrição para o dia não útil.');const draft=businessCalendarDraftForYear(year),existing=(draft.rows||[]).find(row=>row.date===parsed.key);if(existing){existing.active=true;existing.description=description;existing.type=type;}else draft.rows.push(normalizeBusinessCalendarRow({date:parsed.key,description,type,active:true,builtIn:false}));$('#businessCalendarDateInput').value='';$('#businessCalendarDescriptionInput').value='';renderBusinessCalendar(currentMonth());
  }
  function removeBusinessCalendarDraftRow(date){syncBusinessCalendarDraftFromDom();const draft=businessCalendarDraftForYear(state.businessCalendarYear);draft.rows=(draft.rows||[]).filter(row=>row.date!==date||row.builtIn===true);renderBusinessCalendar(currentMonth())}
  function restoreBusinessCalendarNationalDefaults(){
    if(!isAdmin()||!hasPermission('finance.manage'))return;syncBusinessCalendarDraftFromDom();const draft=businessCalendarDraftForYear(state.businessCalendarYear),map=new Map((draft.rows||[]).map(row=>[row.date,row]));for(const national of businessCalendar.nationalFixedHolidays(draft.year)){const existing=map.get(national.date);map.set(national.date,{...(existing||{}),...national,id:existing?.id||null,active:true,builtIn:true});}draft.rows=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));renderBusinessCalendar(currentMonth());toast('Feriados nacionais fixos restaurados no rascunho. Clique em Salvar calendário.');
  }
  function businessCalendarChangedMonthIds(beforeRows,afterRows,year){
    const signature=row=>`${row.active!==false}|${row.description||''}|${row.type||''}`,before=new Map(businessCalendar.mergeYearExceptions(year,beforeRows||[]).map(row=>[row.date,signature(row)])),afterRowsMerged=businessCalendar.mergeYearExceptions(year,afterRows||[]),after=new Map(afterRowsMerged.map(row=>[row.date,signature(row)])),dates=new Set([...before.keys(),...after.keys()]),ids=new Set();
    for(const date of dates)if(before.get(date)!==after.get(date))ids.add(String(date).slice(0,7));
    // Ao salvar o calendário, recalcule também competências abertas que contenham qualquer data não útil ativa.
    // Isso cobre a primeira ativação da V2.48.7, quando os feriados nacionais padrão já existem localmente.
    for(const row of afterRowsMerged)if(row.active!==false)ids.add(String(row.date).slice(0,7));
    const current=currentMonth();if(current&&Number(current.year)===Number(year))ids.add(current.id);return[...ids];
  }
  async function refreshFinanceForCalendarMonths(ids){
    if(!isAdmin()||!state.supabase||!ids?.length)return;for(const id of [...new Set(ids)])for(const [code,squad] of Object.entries(state.squads||{})){const placeholder=squad.months?.[id];if(!placeholder||placeholder.isClosed)continue;try{const m=await ensureMonthLoaded(code,id,{force:true,silent:true});if(!m||m.isClosed)continue;recalculateFinance(m);await persistFinanceMonth(m);}catch(err){console.warn(`Não foi possível recalcular ${code} ${id} após alteração do calendário.`,err)}}state.financeRankingCache={};
  }
  async function saveBusinessCalendar(){
    if(!isAdmin()||!hasPermission('finance.manage'))return toast('Você não possui permissão para alterar o calendário operacional.');syncBusinessCalendarDraftFromDom();const draft=businessCalendarDraftForYear(state.businessCalendarYear),year=draft.year,before=clone(state.businessCalendarRows||[]),rows=(draft.rows||[]).map(normalizeBusinessCalendarRow).filter(Boolean),yearRows=rows.filter(row=>businessCalendar.parseDateKey(row.date)?.year===year),beforeYear=(state.businessCalendarRows||[]).filter(row=>businessCalendar.parseDateKey(row.date)?.year===year),changedMonths=businessCalendarChangedMonthIds(beforeYear,yearRows,year),btn=$('#businessCalendarSaveBtn');if(btn){btn.disabled=true;btn.textContent='Salvando...'};
    try{
      if(state.supabase){if(!state.businessCalendarRemoteAvailable)throw new Error('Tabela business_calendar_exceptions indisponível. Execute a migração V2.48.7.');const now=new Date().toISOString(),payloads=yearRows.map(row=>({organization_id:state.user.organizationId,date:row.date,description:row.description,type:row.type,active:row.active!==false,updated_by:state.user.userId,updated_at:now}));if(payloads.length){const {error}=await state.supabase.from('business_calendar_exceptions').upsert(payloads,{onConflict:'organization_id,date'});if(error)throw error;}const keep=new Set(yearRows.map(row=>row.date)),removed=beforeYear.map(row=>row.date).filter(date=>!keep.has(date));if(removed.length){const {error}=await state.supabase.from('business_calendar_exceptions').delete().eq('organization_id',state.user.organizationId).in('date',removed);if(error)throw error;}await ensureBusinessCalendarLoaded(true);}else{const other=(state.businessCalendarRows||[]).filter(row=>businessCalendar.parseDateKey(row.date)?.year!==year);state.businessCalendarRows=[...other,...yearRows];saveDemoBusinessCalendar(state.businessCalendarRows);state.businessCalendarLoaded=true;}
      state.businessCalendarDraft=null;await refreshFinanceForCalendarMonths(changedMonths);await logAuditEvent('finance.business_calendar_update',{entityType:'business_calendar',entityId:String(year),squadId:null,description:`Calendário operacional de ${year} atualizado.`,beforeData:{rows:businessCalendar.mergeYearExceptions(year,beforeYear)},afterData:{rows:businessCalendarRowsForYear(year)},metadata:{year,affectedMonths:changedMonths}});renderBusinessCalendar(currentMonth());render();toast(`Calendário de ${year} salvo. Bonificações abertas afetadas foram recalculadas.`);
    }catch(err){console.error(err);toast('Não foi possível salvar o calendário. Confira a migração V2.48.7 e suas permissões.');}
    finally{if(btn){btn.disabled=false;btn.textContent='Salvar calendário'}}
  }

  function financeSettingsForMonth(m){return financeRules.resolveFinanceSettings(m?.financeSettings)}
  function financeModelForMonth(m){return ['squad','individual'].includes(m?.financeModel)?m.financeModel:(m?.isClosed&&safe(m?.closedSnapshot?.version)<3?'individual':'squad')}
  function financeModelLabel(model){return model==='individual'?'Individual meritocrático':'Base do Squad'}
  function financeFloorTier(value,tiers){return financeRules.financeFloorTier(value,tiers)}
  function financeCancelTier(rate,tiers){return financeRules.financeCancelTier(rate,tiers)}
  function financialStatusRefs(m){return automaticScoreRefs(m)}
  function financePerformanceStatus(t,m){return financeRules.financePerformanceStatus(t,financialStatusRefs(m))}
  function buildFinanceModelData(options){return financeRules.buildFinanceModelData(options)}
  function applyIndividualTotalCap(records,cap){return financeRules.applyIndividualTotalCap(records,cap)}
  function financeRuleVersionForMonth(m){const saved=m?.financeRuleVersion||m?.financeComparison?.ruleVersion||m?.closedSnapshot?.financeRuleVersion;if(saved)return String(saved);if(m?.isClosed)return 'LEGACY-PRE-V2.39';return String(financeRules.FINANCE_RULE_VERSION||'legacy')}
  function financeRuleFingerprintForMonth(m){const version=financeRuleVersionForMonth(m),settings=financeSettingsForMonth(m),financeMonthData=m?.financeMonthData||{},model=financeModelForMonth(m),individualCap=Number.isFinite(Number(m?.financeIndividualCap))?safe(m.financeIndividualCap):7000;return String(m?.financeRuleFingerprint||m?.financeComparison?.ruleFingerprint||m?.closedSnapshot?.financeRuleFingerprint||financeAdvanced.ruleFingerprint({ruleVersion:version,settings,financeMonthData,model,individualCap}))}
  function recalculateFinance(m){
    if(!m||m.isClosed)return;
    // Em produção, técnicos não recalculam o financeiro no navegador: a RLS protege os componentes
    // privados dos colegas e o teto Individual depende da folha completa do Squad. Preserve o cálculo
    // persistido pelo gestor/importação para o próprio técnico.
    if(isTechnician()&&state.supabase)return;
    const settings=financeSettingsForMonth(m);m.financeSettings=settings;m.financeMonthData=m.financeMonthData||{};m.financeModel=financeModelForMonth(m);if(typeof m.financeCompare!=='boolean')m.financeCompare=true;if(typeof m.financeTechCompare!=='boolean')m.financeTechCompare=false;if(!Number.isFinite(Number(m.financeIndividualCap)))m.financeIndividualCap=7000;
    m.financeRuleVersion=financeRules.FINANCE_RULE_VERSION||'legacy';m.financeRuleFingerprint=financeAdvanced.ruleFingerprint({ruleVersion:m.financeRuleVersion,settings,financeMonthData:m.financeMonthData,model:m.financeModel,individualCap:m.financeIndividualCap});const ruleVersion=m.financeRuleVersion,ruleFingerprint=m.financeRuleFingerprint;
    const cancellation=financeRules.cancellationSummary(m.financeMonthData.customersStart,m.financeMonthData.canceledCount,settings.cancelTiers),customers=cancellation.customers,canceled=cancellation.canceled,cancelRate=cancellation.rate,cancelTier=cancellation.tier,rawMult=cancellation.rawMultiplier,effectiveMult=cancellation.effectiveMultiplier;
    const active=(m.technicians||[]).filter(t=>safe(t.att)>0),counted=active.filter(t=>!t.excludeFromGroupCount),calendarSummary=financeBusinessCalendarSummary(m),days=Math.max(1,safe(calendarSummary.businessDays));
    // V2.21.0: todos os atendimentos e Notas 5 continuam no numerador. O checkbox apenas
    // retira o técnico do denominador da quantidade de técnicos usada pela Base do Squad.
    const totalAtt=active.reduce((s,t)=>s+safe(t.att),0),totalN5=active.reduce((s,t)=>s+safe(t.notes5),0),groupEligibleAtt=active.reduce((s,t)=>s+eligibleEvaluationAttendance(t),0),groupExcludedAtt=active.reduce((s,t)=>s+normalizedEvaluationExcludedAtt(t),0);
    const groupBaseData=financeRules.groupFinanceBase({totalAtt,totalN5,countedCount:counted.length,days,eligibleAtt:groupEligibleAtt,evaluationExcludedAtt:groupExcludedAtt,effectiveMultiplier:effectiveMult,attendanceTiers:settings.attendanceTiers,notes5Tiers:settings.notes5Tiers}),groupAvgPerDay=groupBaseData.avgPerDay,groupNotes5Pct=groupBaseData.notes5Pct,groupAttTier=groupBaseData.attendanceTier,groupN5Tier=groupBaseData.notes5Tier,groupCommissionAtt=groupBaseData.commissionAtt,groupCommissionNotes5=groupBaseData.commissionNotes5,groupBase=groupBaseData.afterCancel;
    const attPrize=financeRules.topPrizeAllocation(active,'att',settings.topAttendancePrize),n5Prize=financeRules.topPrizeAllocation(active,'notes5',settings.topNotes5Prize),attWinners=attPrize.winners,n5Winners=n5Prize.winners,attPrizeEach=attPrize.amountEach,n5PrizeEach=n5Prize.amountEach;
    const statuses=new Map();active.forEach(t=>statuses.set(nameLinkKey(t.name),financePerformanceStatus(t,m)));
    // Competência parcial continua recebendo a Base do Squad, mas não participa dos ajustes.
    // Férias e a exceção manual preservam o técnico no divisor/redistribuição, porém impedem
    // que um status ABAIXO gere o desconto e, consequentemente, valor para o pool.
    const financialEligible=active.filter(t=>!t.excludeFromGroupCount);
    const adjustmentEntries=active.map(t=>({
      status:statuses.get(nameLinkKey(t.name)),
      eligible:!t.excludeFromGroupCount,
      discountEligible:!t.excludeFromGroupCount&&!t.vacation&&!t.waiveBelowDiscount,
      redistributionEligible:!t.excludeFromGroupCount
    }));
    const adjustmentSummary=financeRules.financialAdjustmentSummary(adjustmentEntries,settings.belowDiscount),pool=adjustmentSummary.pool,redistribution=adjustmentSummary.redistributionEach;
    let squadTotal=0;const individualRecords=[];
    for(const t of m.technicians||[]){
      const hasProduction=safe(t.att)>0||safe(t.totalEval)>0,avgPerDay=safe(t.att)/days,eligibleAtt=eligibleEvaluationAttendance(t),evaluationExcludedAtt=normalizedEvaluationExcludedAtt(t),notes5Pct=eligibleAtt?safe(t.notes5)/eligibleAtt:0,attTier=financeFloorTier(avgPerDay,settings.attendanceTiers),n5Tier=financeFloorTier(notes5Pct,settings.notes5Tiers),financeStatus=statuses.get(nameLinkKey(t.name))||'';
      const financialAdjustmentEligible=hasProduction&&!t.excludeFromGroupCount,discountEligible=financialAdjustmentEligible&&!t.vacation&&!t.waiveBelowDiscount,redistributionEligible=financialAdjustmentEligible,discountWaiverReason=!hasProduction?'':t.excludeFromGroupCount?'partial':t.vacation?'vacation':t.waiveBelowDiscount?'manual':'',discountWaived=financeStatus==='ABAIXO'&&!discountEligible,topAttBonus=attWinners.includes(t)?attPrizeEach:0,topNotes5Bonus=n5Winners.includes(t)?n5PrizeEach:0,manualBonus=hasProduction?safe(t.financeManualBonus):0,sales=hasProduction?safe(t.salesCommission):0,discount=discountEligible&&financeStatus==='ABAIXO'?safe(settings.belowDiscount):0,redistributed=redistributionEligible&&financeStatus==='ACIMA'?redistribution:0;
      const common={hasProduction,days,eligibleAtt,evaluationExcludedAtt,cancelRate,cancelTier,rawMult,effectiveMult,financeStatus,financialAdjustmentEligible,discountEligible,redistributionEligible,discountWaived,discountWaiverReason,topAttBonus,topNotes5Bonus,manualBonus,sales,discount,redistributed,vacation:!!t.vacation,pool};
      const individual=buildFinanceModelData({mode:'individual',...common,avgPerDay,notes5Pct,commissionAtt:hasProduction?safe(attTier.amount):0,commissionNotes5:hasProduction?safe(n5Tier.amount):0});individual.attendanceTier=safe(attTier.min);individual.notes5Tier=safe(n5Tier.min);
      const squad=buildFinanceModelData({mode:'squad',...common,eligibleAtt:groupEligibleAtt,evaluationExcludedAtt:groupExcludedAtt,avgPerDay:groupAvgPerDay,notes5Pct:groupNotes5Pct,commissionAtt:hasProduction?groupCommissionAtt:0,commissionNotes5:hasProduction?groupCommissionNotes5:0});squad.attendanceTier=safe(groupAttTier.min);squad.notes5Tier=safe(groupN5Tier.min);
      squadTotal+=squad.final;individualRecords.push({t,data:individual,squad});
    }
    const capInfo=applyIndividualTotalCap(individualRecords,Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000);let individualTotal=0;
    individualRecords.forEach(({t,data:individual,squad})=>{individualTotal+=individual.final;const official=m.financeModel==='individual'?individual:squad;t.financeData={...official,version:9,ruleVersion,ruleFingerprint,officialModel:m.financeModel,businessCalendar:clone(calendarSummary),models:{squad:{...squad,ruleVersion,ruleFingerprint,businessCalendar:clone(calendarSummary)},individual:{...individual,ruleVersion,ruleFingerprint,businessCalendar:clone(calendarSummary)}},comparisonDiff:Number((individual.final-squad.final).toFixed(2)),groupBase:{avgPerDay:groupAvgPerDay,notes5Pct:groupNotes5Pct,eligibleAtt:groupEligibleAtt,evaluationExcludedAtt:groupExcludedAtt,commissionAtt:groupCommissionAtt,commissionNotes5:groupCommissionNotes5,afterCancel:groupBase}}});
    const diff=individualTotal-squadTotal;m.financeComparison={version:8,ruleVersion,ruleFingerprint,businessCalendar:clone(calendarSummary),squadTotal:Number(squadTotal.toFixed(2)),individualBeforeCapTotal:capInfo.before,individualTotal:Number(individualTotal.toFixed(2)),individualCap:capInfo.cap,individualCapApplied:capInfo.applied,individualCapFactor:capInfo.factor,individualCapAdjustment:capInfo.adjustment,difference:Number(diff.toFixed(2)),differencePct:squadTotal?diff/squadTotal:0,groupAvgPerDay,groupNotes5Pct,groupEligibleAtt,groupExcludedAtt,groupCommissionAtt,groupCommissionNotes5,groupAfterCancel:groupBase,cancelRate,cancelMultiplier:effectiveMult,activeTechnicians:active.length,countedTechnicians:counted.length,excludedFromGroupCount:Math.max(0,active.length-counted.length),financialAdjustmentEligible:financialEligible.length,discountEligibleTechnicians:adjustmentEntries.filter(x=>x.discountEligible).length,redistributionEligibleTechnicians:adjustmentEntries.filter(x=>x.redistributionEligible).length,belowCount:adjustmentSummary.belowCount,aboveCount:adjustmentSummary.aboveCount,redistributionPool:Number(pool.toFixed(2)),redistributionEach:Number(redistribution.toFixed(2))};m.financeComparisonSnapshot=clone(m.financeComparison);
  }
  function renderFinanceSummary(t,m){
    if(!$('#financeSummaryCard'))return;const d=t.financeData||{},model=d.officialModel||financeModelForMonth(m),other=model==='squad'?'individual':'squad',otherData=d.models?.[other];$('#financeSummaryTitle').textContent=m.isClosed?'Bonificação final':'Bonificação estimada';$('#financeSummaryState').textContent=`${m.isClosed?'FECHADO':'EM ANDAMENTO'} • ${financeModelLabel(model).toUpperCase()}`;$('#financeSummaryTotal').textContent=fmtMoney(d.final);$('#financeVacationBadge').classList.toggle('hidden',!t.vacation);
    const discountNote=d.discountEligible===false?({vacation:'Férias • isento do desconto ABAIXO',manual:'Exceção manual • isento do desconto ABAIXO',partial:'Competência parcial • isento do desconto ABAIXO'}[d.discountWaiverReason]||'Isento do desconto ABAIXO'):(d.financeStatus||'Sem status');
    const items=[['Produção',fmtMoney(d.commissionAtt),`${safe(d.avgPerDay).toLocaleString('pt-BR',{maximumFractionDigits:2})} atend./dia`,''],['Qualidade',fmtMoney(d.commissionNotes5),`${fmtPct(d.notes5Pct)} de Notas 5 • base ${fmtInt(d.eligibleAtt)} atend.`,''],['Cancelamento',`× ${safe(d.cancelMultiplier||1).toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})}`,`${fmtPct(d.cancelRate)} no mês`,''],['Bônus manual',fmtMoney(d.manualBonus),'Informado pelo admin','positive'],['Prêmios',fmtMoney(safe(d.topAttBonus)+safe(d.topNotes5Bonus)),'Maior atendimento / Notas 5','positive'],['Comissão vendas',fmtMoney(d.salesCommission),'Informada pelo admin','positive'],['Desconto',`- ${fmtMoney(d.discount)}`,discountNote,d.discount?'negative':''],['Redistribuição',fmtMoney(d.redistribution),d.redistributionEligible===false?'Competência parcial • não participa':'Somente entre técnicos ACIMA elegíveis','positive']];
    $('#financeBreakdown').innerHTML=items.map(([label,value,note,cls])=>`<div class="finance-break-item ${cls}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`).join('');
    const adminCompare=!isTechnician()&&m.financeCompare&&otherData?` • Simulação ${financeModelLabel(other)}: ${fmtMoney(otherData.final)}.`:'';$('#financeSummarySubtitle').textContent=(t.vacation?`Férias: 50% aplicado somente à comissão-base após cancelamento (${fmtMoney(d.afterCancel)} → ${fmtMoney(d.afterVacationBase)}). O desconto por status ABAIXO fica isento; os demais ajustes permanecem integrais.`:`Modelo aplicado: ${financeModelLabel(model)}.`)+adminCompare;
    const transition=$('#financeTransitionCompare');if(transition){const show=isTechnician()&&m.financeTechCompare===true&&otherData;transition.classList.toggle('hidden',!show);transition.innerHTML=show?`<div><span>SIMULAÇÃO DE TRANSIÇÃO</span><strong>${escapeHtml(financeModelLabel(other))}</strong><small>Comparação informativa; não altera o valor oficial do mês.</small></div><div class="transition-values"><span>Oficial <b>${fmtMoney(d.final)}</b></span><span>Simulação <b>${fmtMoney(otherData.final)}</b></span><span class="${safe(otherData.final)-safe(d.final)>=0?'positive-text':'negative-text'}">Diferença <b>${safe(otherData.final)-safe(d.final)>=0?'+ ':''}${fmtMoney(safe(otherData.final)-safe(d.final))}</b></span></div>`:'';}
    if($('#financeSelfExplanation'))$('#financeSelfExplanation').innerHTML=`<summary>Como este valor foi calculado</summary>${financeExplanationHtml(d,t,m,{compact:true})}`;
  }
  function renderFinanceTierEditor(id,tiers,type){const el=$('#'+id);if(!el)return;const isCancel=type==='cancel';el.innerHTML=`<div class="finance-tier-table"><div class="finance-tier-row finance-tier-head"><span>${isCancel?'Até %':'Faixa'}</span><span>${isCancel?'Multiplicador':'Comissão R$'}</span></div>${(tiers||[]).map((t,i)=>`<div class="finance-tier-row"><input type="number" step="0.01" data-finance-tier="${type}" data-tier-index="${i}" data-tier-field="${isCancel?'max':'min'}" value="${isCancel?(safe(t.max)*100).toFixed(2):type==='notes'?(safe(t.min)*100).toFixed(2):safe(t.min)}"><input type="number" step="0.001" data-finance-tier="${type}" data-tier-index="${i}" data-tier-field="${isCancel?'mult':'amount'}" value="${safe(t[isCancel?'mult':'amount'])}"></div>`).join('')}</div>`}
  function financeDetailGrid(d){const individual=d.mode==='individual';return `<div class="finance-detail-grid"><div><span>Base elegível avaliação</span><strong>${fmtInt(d.eligibleAtt)}</strong><small>${fmtInt(d.evaluationExcludedAtt)} descontado(s)</small></div><div><span>Comissão atendimento</span><strong>${fmtMoney(d.commissionAtt)}</strong></div><div><span>Comissão Notas 5</span><strong>${fmtMoney(d.commissionNotes5)}</strong></div><div><span>Base após cancelamento</span><strong>${fmtMoney(d.afterCancel)}</strong></div>${d.vacation?`<div><span>Base após férias (50%)</span><strong>${fmtMoney(d.afterVacationBase)}</strong><small>Redutor aplicado somente na comissão-base</small></div>`:''}<div><span>Bônus + prêmios</span><strong>${fmtMoney(safe(d.manualBonus)+safe(d.topAttBonus)+safe(d.topNotes5Bonus))}</strong></div><div><span>Vendas</span><strong>${fmtMoney(d.salesCommission)}</strong></div><div><span>Desconto ABAIXO</span><strong>${d.discountEligible===false?'ISENTO':'ELEGÍVEL'}</strong><small>${d.discountEligible===false?({vacation:'Férias',manual:'Exceção manual',partial:'Competência parcial'}[d.discountWaiverReason]||'Isenção'):'Regra normal'}</small></div><div><span>Desconto</span><strong>${d.discount?'- ':''}${fmtMoney(d.discount)}</strong></div><div><span>Redistribuição</span><strong>${fmtMoney(d.redistribution)}</strong><small>${d.redistributionEligible===false?'Não participa':'Participa se ACIMA'}</small></div><div><span>Subtotal antes do teto</span><strong>${fmtMoney(d.preCapFinal)}</strong></div>${individual?`<div><span>Piso zero aplicado</span><strong>${fmtMoney(d.zeroFloorAdjustment)}</strong></div><div><span>Ajuste do teto</span><strong>${fmtMoney(d.capAdjustment)}</strong></div><div><span>Final Individual</span><strong>${fmtMoney(d.final)}</strong></div>`:''}</div>`}
  function financeExplanationHtml(d,t,m,{compact=false}={}){
    const explanation=financeAdvanced.buildCalculationExplanation(d||{},{technicianName:t?.name||'',ruleVersion:financeRuleVersionForMonth(m),ruleFingerprint:financeRuleFingerprintForMonth(m)});
    const steps=(explanation.steps||[]).map((step,index)=>`<li class="finance-explanation-step ${escapeHtml(step.tone||'neutral')}"><span class="finance-explanation-index">${index+1}</span><div><strong>${escapeHtml(step.label)}</strong><small>${escapeHtml(step.formula||'')}</small>${step.note?`<em>${escapeHtml(step.note)}</em>`:''}</div><b>${fmtMoney(step.result)}</b></li>`).join('');
    return `<div class="finance-rule-signature ${compact?'compact':''}"><span>Regra <b>${escapeHtml(explanation.ruleVersion)}</b></span><span>Assinatura <code>${escapeHtml(explanation.ruleFingerprint||'—')}</code></span></div><ol class="finance-explanation-list">${steps}</ol>`;
  }
  function financeMemoryStorageKey(){return'softenFinanceCalculationMemoryV239'}
  function financeMemoryKey(m,squadCode=state.squadCode){return`${squadCode||''}|${m?.id||''}`}
  function financeTriggerLabel(trigger){return({config_update:'Regras/configuração',technician_adjustments:'Ajustes individuais',rules_copy:'Regras copiadas',month_close:'Fechamento do mês',manual_snapshot:'Memória manual'})[trigger]||String(trigger||'Cálculo')}
  function normalizeFinanceMemoryRow(row){if(!row)return null;return{dbId:row.id||null,createdAt:row.created_at||row.createdAt||'',trigger:row.trigger||'',squadCode:row.squad_code||row.squadCode||state.squadCode,period:row.period||'',year:safe(row.year),month:safe(row.month),officialModel:row.official_model||row.officialModel||row.snapshot?.financeModel||'squad',ruleVersion:row.rule_version||row.ruleVersion||'legacy',ruleFingerprint:row.rule_fingerprint||row.ruleFingerprint||'',actor:row.actor||{userId:row.created_by||null,name:row.actor_name||'',email:''},summary:row.summary||{},snapshot:row.snapshot||{}}}
  function demoFinanceMemories(){try{const list=JSON.parse(localStorage.getItem(financeMemoryStorageKey())||'[]');return Array.isArray(list)?list:[]}catch(e){return[]}}
  function saveDemoFinanceMemories(list){try{localStorage.setItem(financeMemoryStorageKey(),JSON.stringify((list||[]).slice(0,120)))}catch(e){console.warn('Memória financeira local indisponível.',e)}}
  async function ensureFinanceMemoryLoaded(m,force=false){
    if(!isAdmin()||!m||state.squadCode==='all')return;const key=financeMemoryKey(m);if(state.financeMemoryLoading[key])return;if(state.financeMemoryLoaded[key]&&!force){renderFinanceMemory(m);return}state.financeMemoryLoading[key]=true;state.financeMemoryError[key]=null;renderFinanceMemory(m);
    try{
      if(state.supabase&&m.dbId){const {data,error}=await state.supabase.from('finance_calculation_memory').select('id,squad_month_id,squad_id,rule_version,rule_fingerprint,trigger,official_model,summary,snapshot,created_by,actor_name,created_at').eq('squad_month_id',m.dbId).order('created_at',{ascending:false}).limit(30);if(error)throw error;state.financeMemoryCache[key]=(data||[]).map(normalizeFinanceMemoryRow).filter(Boolean);}
      else state.financeMemoryCache[key]=demoFinanceMemories().filter(row=>row.squadCode===state.squadCode&&row.period===m.id).map(normalizeFinanceMemoryRow).filter(Boolean).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,30);
      state.financeMemoryLoaded[key]=true;
    }catch(err){console.warn('Memória de cálculo indisponível. Execute a migração V2.39.0 para persistência centralizada.',err);state.financeMemoryError[key]='Histórico centralizado indisponível. Execute a migração V2.39.0.';state.financeMemoryCache[key]=demoFinanceMemories().filter(row=>row.squadCode===state.squadCode&&row.period===m.id).map(normalizeFinanceMemoryRow).filter(Boolean);state.financeMemoryLoaded[key]=true;}
    finally{delete state.financeMemoryLoading[key];renderFinanceMemory(m)}
  }
  async function recordFinanceCalculationMemory(m,trigger='manual_snapshot',{notify=false}={}){
    if(!isAdmin()||!m||state.squadCode==='all')return null;const mayRecord=hasPermission('finance.manage')||(trigger==='month_close'&&hasPermission('month.manage'));if(!mayRecord)return null;const key=financeMemoryKey(m),entry=financeAdvanced.buildCalculationMemory({month:m,squadCode:state.squadCode,trigger,actor:{userId:state.user?.userId||null,name:state.user?.fullName||'',email:state.user?.email||''}});let stored=normalizeFinanceMemoryRow(entry);
    try{
      if(state.supabase&&m.dbId){const squad=currentSquad();if(!squad?.dbId)throw new Error('Squad sem vínculo no Supabase.');const payload={squad_month_id:m.dbId,squad_id:squad.dbId,rule_version:entry.ruleVersion,rule_fingerprint:entry.ruleFingerprint,trigger:entry.trigger,official_model:entry.officialModel,summary:entry.summary,snapshot:entry.snapshot,created_by:state.user.userId,actor_name:state.user.fullName||state.user.email||'Administrador'};const {data,error}=await state.supabase.from('finance_calculation_memory').insert(payload).select('id,rule_version,rule_fingerprint,trigger,official_model,summary,snapshot,created_by,actor_name,created_at').single();if(error)throw error;stored=normalizeFinanceMemoryRow({...data,squadCode:state.squadCode,period:m.id,actor:{userId:state.user.userId,name:state.user.fullName||'',email:state.user.email||''}});}
      else{const all=demoFinanceMemories();all.unshift(entry);saveDemoFinanceMemories(all);}
    }catch(err){console.warn('Não foi possível persistir a memória financeira no Supabase; mantendo fallback local.',err);const all=demoFinanceMemories();all.unshift(entry);saveDemoFinanceMemories(all);state.financeMemoryError[key]='Memória salva apenas neste navegador. Execute a migração V2.39.0 para centralizar.';}
    const rows=state.financeMemoryCache[key]||[];state.financeMemoryCache[key]=[stored,...rows.filter(row=>row.dbId?row.dbId!==stored.dbId:!(row.createdAt===stored.createdAt&&row.trigger===stored.trigger))].slice(0,30);state.financeMemoryLoaded[key]=true;if(trigger==='manual_snapshot')await logAuditEvent('finance.memory_snapshot',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Memória manual da bonificação registrada para ${m.monthName} ${m.year}.`,afterData:{ruleVersion:entry.ruleVersion,ruleFingerprint:entry.ruleFingerprint,officialModel:entry.officialModel,total:entry.summary.total},metadata:{period:m.id,squad:state.squadCode}});renderFinanceMemory(m);if(notify)toast('Memória do cálculo registrada.');return stored;
  }
  function renderFinanceMemory(m){
    const rowsEl=$('#financeMemoryRows'),statusEl=$('#financeMemoryStatus');
    if(!rowsEl)return;
    if(!m||state.squadCode==='all'){
      rowsEl.innerHTML='<div class="muted finance-empty">Selecione um Squad e uma competência.</div>';
      if(statusEl)statusEl.textContent='';
      return;
    }
    const key=financeMemoryKey(m),rows=state.financeMemoryCache[key]||[];
    if(state.financeMemoryLoading[key]){rowsEl.innerHTML='<div class="muted finance-empty">Carregando memória de cálculo...</div>';return}
    if(!state.financeMemoryLoaded[key]){rowsEl.innerHTML='<div class="muted finance-empty">Carregando histórico...</div>';ensureFinanceMemoryLoaded(m);return}
    if(statusEl)statusEl.textContent=state.financeMemoryError[key]||`${rows.length} memória(s) registrada(s) • cada registro preserva regras, parâmetros, modelo e valores calculados.`;
    rowsEl.innerHTML=rows.length?rows.map((row,index)=>{
      const older=rows[index+1],delta=older?financeAdvanced.memoryDelta(older,row):null,diff=delta?safe(delta.totalDifference):0,snapshot=row.snapshot||{},monthData=snapshot.financeMonthData||{},techs=Array.isArray(snapshot.technicians)?snapshot.technicians:[];
      const flags=delta?`${delta.ruleChanged?'<span class="finance-memory-flag warning">REGRAS ALTERADAS</span>':''}${delta.modelChanged?'<span class="finance-memory-flag">MODELO ALTERADO</span>':''}`:'';
      const techRows=techs.length?techs.map(item=>`<tr><td>${escapeHtml(titleWords(item.technicianName||''))}</td><td>${fmtInt(item.attendance)}</td><td>${fmtInt(item.notes5)}</td><td>${item.vacation?'SIM':'NÃO'}</td><td>${fmtMoney(item.finance?.final)}</td></tr>`).join(''):'<tr><td colspan="5" class="muted">Snapshot sem detalhamento individual.</td></tr>';
      return `<article class="finance-memory-row"><div class="finance-memory-main"><div><strong>${escapeHtml(financeTriggerLabel(row.trigger))}</strong><span>${escapeHtml(formatDateTime(row.createdAt)||'—')} • ${escapeHtml(financeModelLabel(row.officialModel))}</span><small>${escapeHtml(row.ruleVersion)} • ${escapeHtml(row.ruleFingerprint||'—')}${row.actor?.name?` • ${escapeHtml(row.actor.name)}`:''}</small>${flags?`<div class="finance-memory-flags">${flags}</div>`:''}</div><div class="finance-memory-total"><strong>${fmtMoney(row.summary?.total)}</strong>${delta?`<small class="${diff>=0?'positive-text':'negative-text'}">${diff>=0?'+ ':''}${fmtMoney(diff)} vs memória anterior</small>`:'<small>primeiro registro disponível</small>'}</div></div><details class="finance-memory-details"><summary>Ver snapshot preservado</summary><div class="finance-memory-meta"><div><span>Modelo</span><b>${escapeHtml(financeModelLabel(row.officialModel))}</b></div><div><span>Teto Individual</span><b>${fmtMoney(snapshot.financeIndividualCap)}</b></div><div><span>Clientes / cancelados</span><b>${fmtInt(monthData.customersStart)} / ${fmtInt(monthData.canceledCount)}</b></div><div><span>Técnicos</span><b>${fmtInt(row.summary?.technicianCount||techs.length)}</b></div></div><div class="table-wrap finance-memory-table"><table><thead><tr><th>Técnico</th><th>Atend.</th><th>N5</th><th>Férias</th><th>Valor</th></tr></thead><tbody>${techRows}</tbody></table></div></details></article>`;
    }).join(''):'<div class="muted finance-empty">Nenhuma memória registrada ainda. Salvar regras, ajustes individuais ou fechar o mês criará registros automaticamente.</div>';
  }
  function renderFinanceSimulator(m,specific){
    const select=$('#financeSimulatorTech');if(!select)return;if(!specific||!m){select.innerHTML='<option value="">Selecione um Squad e um mês</option>';select.disabled=true;$('#financeSimulationResult').innerHTML='<div class="muted finance-empty">Selecione uma competência para simular.</div>';return}select.disabled=false;const names=(m.technicians||[]).map(t=>t.name);const periodKey=financeMemoryKey(m);const previous=select.value||state.financeSimulator.techName;select.innerHTML=names.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(titleWords(name))}</option>`).join('');const selected=names.includes(previous)?previous:(names[0]||'');select.value=selected;if(state.financeSimulator.periodKey!==periodKey||state.financeSimulator.techName!==selected){loadFinanceSimulatorDefaults(m,selected,true)}else renderFinanceSimulationResult(m);
  }
  function loadFinanceSimulatorDefaults(m,name,force=false){
    if(!m||!name)return;const t=(m.technicians||[]).find(x=>samePersonName(x.name,name));if(!t)return;state.financeSimulator={periodKey:financeMemoryKey(m),techName:t.name,result:null};if($('#financeSimulatorTech'))$('#financeSimulatorTech').value=t.name;const values={financeSimAtt:safe(t.att),financeSimNotes5:safe(t.notes5),financeSimExcluded:normalizedEvaluationExcludedAtt(t),financeSimManualBonus:safe(t.financeManualBonus),financeSimSales:safe(t.salesCommission),financeSimCustomersStart:safe(m.financeMonthData?.customersStart),financeSimCanceled:safe(m.financeMonthData?.canceledCount),financeSimCap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000};Object.entries(values).forEach(([id,value])=>{if($('#'+id))$('#'+id).value=value});if($('#financeSimVacation'))$('#financeSimVacation').checked=!!t.vacation;if($('#financeSimExcludedGroup'))$('#financeSimExcludedGroup').checked=!!t.excludeFromGroupCount;if($('#financeSimulatorModel'))$('#financeSimulatorModel').value=financeModelForMonth(m);if($('#financeSimulationResult'))$('#financeSimulationResult').innerHTML='<div class="muted finance-empty">Altere os campos desejados e clique em Simular. Nenhum dado oficial será gravado.</div>';
  }
  function renderFinanceSimulationResult(m){
    const el=$('#financeSimulationResult');if(!el)return;const result=state.financeSimulator.result;
    if(!result||result.periodKey!==financeMemoryKey(m)){el.innerHTML='<div class="muted finance-empty">Altere os campos desejados e clique em Simular. Nenhum dado oficial será gravado.</div>';return}
    const delta=result.delta,sim=result.simulated||{},actual=result.actual||{},actualMonth=result.actualMonthComparison||{},simMonth=result.monthComparison||{},model=result.model;
    const actualPayroll=safe(model==='individual'?actualMonth.individualTotal:actualMonth.squadTotal),simPayroll=safe(model==='individual'?simMonth.individualTotal:simMonth.squadTotal),payrollDiff=Number((simPayroll-actualPayroll).toFixed(2));
    el.innerHTML=`<div class="finance-simulation-kpis"><div><span>Valor atual</span><strong>${fmtMoney(actual.final)}</strong></div><div><span>Valor simulado</span><strong>${fmtMoney(sim.final)}</strong></div><div class="${safe(delta.difference)>=0?'positive-text':'negative-text'}"><span>Diferença do técnico</span><strong>${safe(delta.difference)>=0?'+ ':''}${fmtMoney(delta.difference)}</strong><small>${safe(delta.differencePct)>=0?'+':''}${fmtPct(delta.differencePct)}</small></div><div><span>Modelo simulado</span><strong>${escapeHtml(financeModelLabel(model))}</strong></div><div><span>Folha atual no modelo</span><strong>${fmtMoney(actualPayroll)}</strong></div><div><span>Folha simulada</span><strong>${fmtMoney(simPayroll)}</strong></div><div class="${payrollDiff>=0?'positive-text':'negative-text'}"><span>Impacto na folha</span><strong>${payrollDiff>=0?'+ ':''}${fmtMoney(payrollDiff)}</strong></div><div><span>Assinatura simulada</span><strong>${escapeHtml(sim.ruleVersion||financeRules.FINANCE_RULE_VERSION||'—')}</strong><small>${escapeHtml(sim.ruleFingerprint||'—')}</small></div></div><details class="finance-simulation-explanation" open><summary>Como o valor simulado foi calculado</summary>${financeExplanationHtml(sim,{name:result.technicianName},m,{compact:true})}</details>`;
  }
  function runFinanceSimulation(){
    if(!isAdmin()||!hasPermission('finance.view')||state.squadCode==='all')return;const m=currentMonth(),name=$('#financeSimulatorTech')?.value;if(!m||!name)return toast('Selecione um técnico para simular.');const original=(m.technicians||[]).find(t=>samePersonName(t.name,name));if(!original)return toast('Técnico não localizado.');const simMonth=clone(m);simMonth.isClosed=false;simMonth.closedSnapshot={};simMonth.financeModel=$('#financeSimulatorModel')?.value==='individual'?'individual':'squad';simMonth.financeIndividualCap=Math.max(0,safe($('#financeSimCap')?.value||7000));simMonth.financeMonthData={customersStart:Math.max(0,safe($('#financeSimCustomersStart')?.value)),canceledCount:Math.max(0,safe($('#financeSimCanceled')?.value))};const simTech=(simMonth.technicians||[]).find(t=>samePersonName(t.name,name));if(!simTech)return;
    simTech.att=Math.max(0,Math.trunc(safe($('#financeSimAtt')?.value)));simTech.notes5=Math.max(0,Math.trunc(safe($('#financeSimNotes5')?.value)));const otherRatings=safe(simTech.notes4)+safe(simTech.notes3)+safe(simTech.notes2)+safe(simTech.notes1);if(simTech.notes5+otherRatings>simTech.att)return toast('Na simulação, o total de avaliações não pode superar os atendimentos.');simTech.evaluationExcludedAtt=Math.max(0,Math.trunc(safe($('#financeSimExcluded')?.value)));simTech.financeManualBonus=safe($('#financeSimManualBonus')?.value);simTech.salesCommission=safe($('#financeSimSales')?.value);simTech.vacation=$('#financeSimVacation')?.checked===true;simTech.excludeFromGroupCount=$('#financeSimExcludedGroup')?.checked===true;recalculateMonth(simMonth);const calculated=(simMonth.technicians||[]).find(t=>samePersonName(t.name,name));if(!calculated)return;const actual=clone(original.financeData||{}),simulated=clone(calculated.financeData||{}),delta=financeAdvanced.simulationDelta(actual,simulated);state.financeSimulator={periodKey:financeMemoryKey(m),techName:original.name,result:{periodKey:financeMemoryKey(m),technicianName:original.name,model:simMonth.financeModel,actual,simulated,delta,actualMonthComparison:clone(m.financeComparison||{}),monthComparison:clone(simMonth.financeComparison||{})}};renderFinanceSimulationResult(m);
  }
  function financeTierBandLabel(value,tiers,{percentage=false}={}){
    const sorted=[...(tiers||[])].sort((a,b)=>safe(b.min)-safe(a.min));if(!sorted.length)return'—';const match=financeFloorTier(value,sorted),idx=Math.max(0,sorted.findIndex(t=>safe(t.min)===safe(match.min)&&safe(t.amount)===safe(match.amount))),fmt=value=>percentage?`${(safe(value)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2})}%`:safe(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    if(idx===0)return`≥ ${fmt(sorted[0].min)}`;const upper=safe(sorted[idx-1].min),lower=safe(sorted[idx].min);if(idx===sorted.length-1&&safe(value)<lower)return`< ${fmt(upper)}`;return`${fmt(lower)} a < ${fmt(upper)}`;
  }
  function renderFinanceClosingOverview(m,{settings,model,comparison,calendarAudit,customers,canceled,rate,mult}={}){
    const kpis=$('#financeClosingKpis'),context=$('#financeClosingContext');if(!kpis||!context)return;
    if(!m||state.squadCode==='all'){context.innerHTML='<span>Selecione uma competência</span>';kpis.innerHTML='<div class="finance-closing-kpi"><span>Média atend./dia do Squad</span><strong>—</strong><small>Selecione uma competência.</small></div><div class="finance-closing-kpi"><span>Taxa de Notas 5</span><strong>—</strong><small>Selecione uma competência.</small></div><div class="finance-closing-kpi"><span>Cancelados da competência</span><strong>—</strong><small>Selecione uma competência.</small></div>';return;}
    const c=comparison||{},days=safe(calendarAudit?.businessDays),counted=safe(c.countedTechnicians??c.activeTechnicians),active=safe(c.activeTechnicians),attendanceBand=financeTierBandLabel(c.groupAvgPerDay,settings?.attendanceTiers),notesBand=financeTierBandLabel(c.groupNotes5Pct,settings?.notes5Tiers,{percentage:true}),cancelTiers=[...(settings?.cancelTiers||[])].sort((a,b)=>safe(a.max)-safe(b.max)),cancelTier=financeCancelTier(rate,cancelTiers),cancelIdx=Math.max(0,cancelTiers.findIndex(t=>safe(t.max)===safe(cancelTier.max)&&safe(t.mult)===safe(cancelTier.mult))),cancelBand=!customers?'Sem base de clientes':cancelIdx===cancelTiers.length-1&&safe(rate)>safe(cancelTier.max)?`> ${fmtPct(cancelTier.max)}`:`≤ ${fmtPct(cancelTier.max)}`;
    context.innerHTML=`<span>${escapeHtml(m.monthName)} ${m.year}</span><span>${escapeHtml(financeModelLabel(model))}</span><span>${fmtInt(days)} dias úteis</span><span>${fmtInt(counted)} de ${fmtInt(active)} técnicos</span>`;
    kpis.innerHTML=`<div class="finance-closing-kpi finance-closing-kpi-att"><span>Média atend./dia do Squad</span><strong>${safe(c.groupAvgPerDay).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong><small>atend./técnico/dia</small><div class="finance-closing-kpi-meta"><b>Faixa ${escapeHtml(attendanceBand)}</b><em>${fmtMoney(c.groupCommissionAtt)} na base</em></div><div class="finance-closing-kpi-foot">${fmtInt(days)} dias úteis • ${fmtInt(counted)} técnicos no divisor</div></div><div class="finance-closing-kpi finance-closing-kpi-quality"><span>Taxa de Notas 5</span><strong>${fmtPct(c.groupNotes5Pct)}</strong><small>sobre a base elegível do Squad</small><div class="finance-closing-kpi-meta"><b>Faixa ${escapeHtml(notesBand)}</b><em>${fmtMoney(c.groupCommissionNotes5)} na base</em></div><div class="finance-closing-kpi-foot">Base elegível: ${fmtInt(c.groupEligibleAtt)} atendimentos</div></div><div class="finance-closing-kpi finance-closing-kpi-cancel"><span>Cancelados da competência</span><strong>${fmtInt(canceled)}</strong><small>${fmtPct(rate)} de cancelamento</small><div class="finance-closing-kpi-meta"><b>Faixa ${escapeHtml(cancelBand)}</b><em>Multiplicador × ${safe(mult).toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})}</em></div><div class="finance-closing-kpi-foot">Clientes no início: ${fmtInt(customers)}</div></div>`;
  }
  function renderFinanceAdmin(m,specific,locked){
    renderBusinessCalendar(m);if(!$('#financeTechnicianRows'))return;const disabled=locked?' disabled':'';
    $$('.admin-section').forEach(el=>el.classList.toggle('section-hidden',!el.classList.contains(`admin-${state.adminSection}`)));
    if(!specific||!m){$('#financeTechnicianRows').innerHTML='<div class="muted finance-empty">Selecione um Squad e um mês.</div>';$('#financeAdminHint').textContent='Selecione um Squad específico e um mês.';renderFinanceClosingOverview(null);['financeCustomersStart','financeCanceledCount','financeTopAttPrize','financeTopNotesPrize','financeBelowDiscount','financeIndividualCap'].forEach(id=>{if($('#'+id)){$('#'+id).value='';$('#'+id).disabled=true}});if($('#financeComparisonSummary'))$('#financeComparisonSummary').innerHTML='';if($('#financeBaseAudit'))$('#financeBaseAudit').innerHTML='';renderFinanceMemory(null);renderFinanceSimulator(null,false);renderSuperAdminCommission(null);return;}
    const settings=financeSettingsForMonth(m),md=m.financeMonthData||{},customers=safe(md.customersStart),canceled=safe(md.canceledCount),rate=customers?canceled/customers:0,tier=financeCancelTier(rate,settings.cancelTiers),mult=customers?(safe(tier.mult)===0?1:safe(tier.mult)):1,model=financeModelForMonth(m);m.financeModel=model;
    $('#financeModelSquad').checked=model==='squad';$('#financeModelIndividual').checked=model==='individual';$('#financeModelSquad').disabled=locked;$('#financeModelIndividual').disabled=locked;$('#financeCompareToggle').checked=m.financeCompare!==false;$('#financeCompareToggle').disabled=locked;$('#financeTechnicianCompareToggle').checked=m.financeTechCompare===true;$('#financeTechnicianCompareToggle').disabled=locked;
    $('#financeCustomersStart').value=safe(md.customersStart)||'';$('#financeCanceledCount').value=safe(md.canceledCount)||'';$('#financeTopAttPrize').value=safe(settings.topAttendancePrize);$('#financeTopNotesPrize').value=safe(settings.topNotes5Prize);$('#financeBelowDiscount').value=safe(settings.belowDiscount);$('#financeIndividualCap').value=Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000;['financeCustomersStart','financeCanceledCount','financeTopAttPrize','financeTopNotesPrize','financeBelowDiscount','financeIndividualCap'].forEach(id=>$('#'+id).disabled=locked);
    $('#financeCancelRate').textContent=fmtPct(rate);$('#financeCancelMultiplier').textContent=`× ${mult.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})}`;

    renderFinanceTierEditor('financeAttTiers',settings.attendanceTiers,'att');renderFinanceTierEditor('financeNotesTiers',settings.notes5Tiers,'notes');renderFinanceTierEditor('financeCancelTiers',settings.cancelTiers,'cancel');$$('[data-finance-tier]').forEach(i=>i.disabled=locked);
    const c=m.financeComparison||{},calendarAudit=c.businessCalendar||(m.isClosed?{weekdays:businessDaysElapsed(m.year,m.month,m.latestDay),excludedCount:0,businessDays:businessDaysElapsed(m.year,m.month,m.latestDay),exceptions:[],legacy:true}:financeBusinessCalendarSummary(m));renderFinanceClosingOverview(m,{settings,model,comparison:c,calendarAudit,customers,canceled,rate:safe(c.cancelRate??rate),mult:safe(c.cancelMultiplier??mult)});$('#financeComparisonSummary').classList.toggle('hidden',m.financeCompare===false);$('#financeComparisonSummary').innerHTML=`<div class="finance-compare-card official"><span>MODELO OFICIAL</span><strong>${escapeHtml(financeModelLabel(model))}</strong><small>${fmtMoney(model==='individual'?c.individualTotal:c.squadTotal)}</small></div><div class="finance-compare-card"><span>BASE DO SQUAD</span><strong>${fmtMoney(c.squadTotal)}</strong><small>Folha estimada</small></div><div class="finance-compare-card"><span>INDIVIDUAL</span><strong>${fmtMoney(c.individualTotal)}</strong><small>${c.individualCapApplied?'Após teto global':'Folha estimada'}</small></div><div class="finance-compare-card ${safe(c.difference)>=0?'up':'down'}"><span>IMPACTO INDIVIDUAL</span><strong>${safe(c.difference)>=0?'+ ':''}${fmtMoney(c.difference)}</strong><small>${safe(c.differencePct)>=0?'+':''}${fmtPct(c.differencePct)}</small></div>`;
    $('#financeBaseAudit').innerHTML=`<div><span>Dias seg–sex até a última data</span><strong>${fmtInt(calendarAudit.weekdays)}</strong><small>Base bruta do calendário</small></div><div><span>Dias não úteis descontados</span><strong>${fmtInt(calendarAudit.excludedCount)}</strong>${(calendarAudit.exceptions||[]).length?`<div class="business-calendar-holiday-list">${calendarAudit.exceptions.map(x=>`<span class="business-calendar-holiday-chip">${String(x.day||businessCalendar.parseDateKey(x.date)?.day||'').padStart(2,'0')}/${String(m.month).padStart(2,'0')} • ${escapeHtml(x.description||'Dia não útil')}</span>`).join('')}</div>`:(calendarAudit.legacy?'<small>Snapshot legado • somente segunda a sexta</small>':'<small>Nenhum dia não útil descontado</small>')}</div><div><span>Dias úteis considerados</span><strong>${fmtInt(calendarAudit.businessDays)}</strong><small>${fmtInt(calendarAudit.weekdays)} − ${fmtInt(calendarAudit.excludedCount)} = ${fmtInt(calendarAudit.businessDays)}</small></div><div><span>Técnicos considerados na Base</span><strong>${fmtInt(c.countedTechnicians??c.activeTechnicians)} de ${fmtInt(c.activeTechnicians)}</strong><small>${safe(c.excludedFromGroupCount)} competência(s) parcial(is) fora do divisor financeiro</small></div><div><span>Média do grupo</span><strong>${safe(c.groupAvgPerDay).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} atend./técnico/dia</strong><small>Atendimentos ÷ dias úteis ÷ técnicos considerados</small></div><div><span>% Notas 5 do grupo</span><strong>${fmtPct(c.groupNotes5Pct)}</strong></div><div><span>Comissões da base</span><strong>${fmtMoney(c.groupCommissionAtt)} + ${fmtMoney(c.groupCommissionNotes5)}</strong></div><div><span>Base após cancelamento</span><strong>${fmtMoney(c.groupAfterCancel)}</strong></div><div><span>Individual antes do teto</span><strong>${fmtMoney(c.individualBeforeCapTotal)}</strong></div><div><span>Teto Individual</span><strong>${fmtMoney(c.individualCap||m.financeIndividualCap||7000)}</strong><small>${c.individualCapApplied?`Aplicado • fator ${(safe(c.individualCapFactor)*100).toLocaleString('pt-BR',{maximumFractionDigits:2})}%`:'Não atingido'}</small></div><div><span>Ajuste total do teto</span><strong>${fmtMoney(c.individualCapAdjustment)}</strong></div><div><span>Redistribuição</span><strong>${fmtMoney(c.redistributionPool)} ÷ ${fmtInt(c.aboveCount)} ACIMA elegíveis = ${fmtMoney(c.redistributionEach)}</strong><small>${fmtInt(c.belowCount)} ABAIXO geraram desconto • férias/exceções não entram no pool</small></div>`;
    const list=[...(m.technicians||[])].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR')),showCompare=m.financeCompare!==false;
    const tableHead=`<div class="finance-tech-table-head" aria-hidden="true"><span>Técnico</span><span>At./dia</span><span>% N5</span><span>Base elegível</span><span>Base Squad</span><span>Individual</span><span>Oficial</span></div>`;
    const rowsHtml=list.map(t=>{const d=t.financeData||{},sq=d.models?.squad||d,ind=d.models?.individual||d,prizes=safe(d.topAttBonus)+safe(d.topNotes5Bonus),diff=safe(ind.final)-safe(sq.final),waiver=t.excludeFromGroupCount?'PARCIAL':t.vacation?'FÉRIAS':t.waiveBelowDiscount?'EXCEÇÃO':'',adjustmentText=d.discount?`- ${fmtMoney(d.discount)}`:d.redistribution?`+ ${fmtMoney(d.redistribution)}`:waiver?'ISENTO':'R$ 0,00';return `<article class="finance-tech-card finance-tech-row-card" data-finance-tech="${escapeHtml(t.name)}"><div class="finance-tech-row-summary"><div class="finance-tech-person"><strong>${escapeHtml(t.name)}${t.vacation?vacationBadgeHtml([m.id],{compact:true}):''}${groupCountBadgeHtml(t.excludeFromGroupCount,{compact:true})}</strong><span class="status finance-status ${d.financeStatus==='ACIMA'?'above':d.financeStatus==='ABAIXO'?'below':''}">${escapeHtml(d.financeStatus||'—')}</span>${t.waiveBelowDiscount&&!t.vacation?'<span class="finance-waiver-badge">SEM DESCONTO</span>':''}</div><div class="finance-row-metric"><span>At./dia individual</span><b>${safe(ind.avgPerDay).toLocaleString('pt-BR',{maximumFractionDigits:2})}</b></div><div class="finance-row-metric"><span>% N5 individual</span><b>${fmtPct(ind.notes5Pct)}</b></div><div class="finance-row-metric"><span>Base elegível</span><b>${fmtInt(eligibleEvaluationAttendance(t))}</b><small>${normalizedEvaluationExcludedAtt(t)?`${fmtInt(normalizedEvaluationExcludedAtt(t))} fora`: 'integral'}</small></div><div class="finance-row-metric compare"><span>Base Squad</span><b>${fmtMoney(sq.final)}</b></div><div class="finance-row-metric compare"><span>Individual</span><b>${fmtMoney(ind.final)}</b><small class="${diff>=0?'positive-text':'negative-text'}">${diff>=0?'+ ':''}${fmtMoney(diff)}</small></div><div class="finance-tech-total"><small>${escapeHtml(financeModelLabel(model))}</small><strong>${fmtMoney(d.final)}</strong></div></div><div class="finance-tech-inputs finance-tech-inputs-compact"><label><span>Atend. sem avaliação</span><input data-finance-field="evaluationExcludedAtt" type="number" min="0" max="${Math.max(0,safe(t.att)-safe(t.totalEval))}" step="1" value="${normalizedEvaluationExcludedAtt(t)}"${disabled}><small>Não geraram e-mail.</small></label><label><span>Bônus manual</span><input data-finance-field="financeManualBonus" type="number" step="0.01" value="${safe(t.financeManualBonus)}"${disabled}></label><label><span>Comissão vendas</span><input data-finance-field="salesCommission" type="number" step="0.01" value="${safe(t.salesCommission)}"${disabled}></label><label class="finance-vacation-control finance-flag-control"><input data-finance-field="vacation" type="checkbox" ${t.vacation?'checked':''}${disabled}><span>Férias • pagar 50% da base</span><small>Também isenta desconto ABAIXO.</small></label><label class="finance-waive-control finance-flag-control"><input data-finance-field="waiveBelowDiscount" type="checkbox" ${t.waiveBelowDiscount?'checked':''}${disabled}><span>Isentar desconto ABAIXO</span><small>Não desconta nem alimenta o pool.</small></label><label class="finance-count-control finance-flag-control"><input data-finance-field="excludeFromGroupCount" type="checkbox" ${t.excludeFromGroupCount?'checked':''}${disabled}><span>Fora da quantidade do Squad</span><small>Sai do divisor e de todos os ajustes.</small></label><div class="finance-auto-adjust"><span>Prêmios</span><b>${fmtMoney(prizes)}</b></div><div class="finance-auto-adjust ${waiver?'is-waived':''}"><span>Desconto / redistrib.</span><b>${adjustmentText}</b><small>${waiver?`Isenção: ${waiver.toLowerCase()}`:(d.discount?'Contribui para o pool':d.redistribution?'Recebe redistribuição':'Sem ajuste')}</small></div></div><details class="finance-tech-details"><summary>${showCompare?'Detalhes e auditoria dos dois modelos':'Detalhes do modelo oficial'}</summary>${showCompare?`<div class="finance-model-detail"><h4>Base do Squad</h4>${financeDetailGrid(sq)}</div><div class="finance-model-detail"><h4>Individual meritocrático</h4>${financeDetailGrid(ind)}</div>`:`<div class="finance-model-detail"><h4>${escapeHtml(financeModelLabel(model))}</h4>${financeDetailGrid(d)}</div>`}</details><details class="finance-tech-details finance-explanation-details"><summary>Como este valor foi calculado</summary>${financeExplanationHtml(d,t,m)}</details></article>`}).join('')||'<div class="muted finance-empty">Nenhum técnico.</div>';
    $('#financeTechnicianRows').innerHTML=list.length?tableHead+rowsHtml:rowsHtml;
    $('#financeAdminHint').textContent=`${m.monthName} ${m.year} • ${m.isClosed?'🔒 valores congelados':`modelo oficial: ${financeModelLabel(model)}`}.`;renderFinanceMemory(m);renderFinanceSimulator(m,specific);renderSuperAdminCommission(m);
  }
  function collectFinanceSettingsFromUi(m){const settings=financeSettingsForMonth(m);settings.topAttendancePrize=Math.max(0,safe($('#financeTopAttPrize').value));settings.topNotes5Prize=Math.max(0,safe($('#financeTopNotesPrize').value));settings.belowDiscount=Math.max(0,safe($('#financeBelowDiscount').value));const maps={att:settings.attendanceTiers,notes:settings.notes5Tiers,cancel:settings.cancelTiers};$$('[data-finance-tier]').forEach(inp=>{const type=inp.dataset.financeTier,idx=safe(inp.dataset.tierIndex),field=inp.dataset.tierField,arr=maps[type];if(!arr?.[idx])return;let value=safe(inp.value);if(type==='notes'&&field==='min')value/=100;if(type==='cancel'&&field==='max')value/=100;arr[idx][field]=value;});return settings}
  function previewFinanceModelChange(){if(!isAdmin()||state.squadCode==='all')return;const m=currentMonth();if(!m)return;if(!m.isClosed)m.financeModel=$('#financeModelIndividual')?.checked?'individual':'squad';m.financeCompare=$('#financeCompareToggle')?.checked!==false;m.financeTechCompare=$('#financeTechnicianCompareToggle')?.checked===true;m.financeIndividualCap=Math.max(0,safe($('#financeIndividualCap')?.value||7000));if(!m.isClosed)recalculateMonth(m);renderFinanceAdmin(m,true,!!m.isClosed);if(currentTech())renderFinanceSummary(currentTech(),m)}
  function financeConfigAuditSnapshot(m){return{ruleVersion:financeRuleVersionForMonth(m),ruleFingerprint:financeRuleFingerprintForMonth(m),model:financeModelForMonth(m),compare:m.financeCompare!==false,technicianCompare:m.financeTechCompare===true,individualCap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000,settings:clone(financeSettingsForMonth(m)),monthData:clone(m.financeMonthData||{}),comparison:clone(m.financeComparison||{})}}
  function financeTechnicianAuditSnapshot(m){return(m?.technicians||[]).map(t=>({name:t.name,evaluationExcludedAtt:normalizedEvaluationExcludedAtt(t),manualBonus:safe(t.financeManualBonus),salesCommission:safe(t.salesCommission),vacation:!!t.vacation,waiveBelowDiscount:!!t.waiveBelowDiscount,excludeFromGroupCount:!!t.excludeFromGroupCount,final:safe(t.financeData?.final),financeStatus:t.financeData?.financeStatus||''}))}
  async function saveFinanceConfiguration(){
    if(!hasPermission('finance.manage'))return toast('Você não possui permissão para alterar a bonificação.');
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m||m.isClosed)return toast('Reabra o mês antes de alterar a bonificação.');
    const before=financeConfigAuditSnapshot(m),nextModel=$('#financeModelIndividual')?.checked?'individual':'squad',nextCap=Math.max(0,safe($('#financeIndividualCap')?.value||7000));
    if(!await confirmDialog(`Salvar as regras financeiras de ${m.monthName} ${m.year} e recalcular a bonificação do Squad ${state.squadCode}? Modelo oficial: ${financeModelLabel(nextModel)} • teto Individual: ${fmtMoney(nextCap)}.`,{title:'Recalcular bonificação',confirmText:'Salvar e recalcular',tone:'warning'}))return;
    try{m.financeModel=nextModel;m.financeCompare=$('#financeCompareToggle')?.checked!==false;m.financeTechCompare=$('#financeTechnicianCompareToggle')?.checked===true;m.financeIndividualCap=nextCap;m.financeSettings=collectFinanceSettingsFromUi(m);m.financeMonthData={customersStart:Math.max(0,safe($('#financeCustomersStart').value)),canceledCount:Math.max(0,safe($('#financeCanceledCount').value))};recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistFinanceMonth(m);await logAuditEvent('finance.config_update',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Regras financeiras e modelo oficial recalculados para ${m.monthName} ${m.year}.`,beforeData:before,afterData:financeConfigAuditSnapshot(m),metadata:{period:m.id,squad:state.squadCode}});await recordFinanceCalculationMemory(m,'config_update');state.financeRankingCache={};render();toast(`Modelo ${financeModelLabel(m.financeModel)} salvo como oficial e bonificação recalculada.`)}catch(err){console.error(err);toast('Não foi possível salvar. Confira se as migrações V2.19.0 e V2.20.0 foram executadas.')}
  }
  async function saveFinanceTechnicians(){
    if(!hasPermission('finance.manage'))return toast('Você não possui permissão para alterar valores financeiros.');
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m||m.isClosed)return toast('Reabra o mês antes de alterar os valores financeiros.');
    const before=financeTechnicianAuditSnapshot(m);
    if(!await confirmDialog(`Salvar os ajustes financeiros individuais de ${m.monthName} ${m.year}? Bônus, vendas, férias, isenções do desconto ABAIXO, atendimentos sem avaliação e participação na Base do Squad serão recalculados.`,{title:'Salvar ajustes financeiros',confirmText:'Salvar ajustes',tone:'warning'}))return;
    for(const row of $$('#financeTechnicianRows [data-finance-tech]')){const t=m.technicians.find(x=>samePersonName(x.name,row.dataset.financeTech));if(!t)continue;for(const input of $$('[data-finance-field]',row)){if(['vacation','waiveBelowDiscount','excludeFromGroupCount'].includes(input.dataset.financeField))t[input.dataset.financeField]=!!input.checked;else t[input.dataset.financeField]=safe(input.value)}t.evaluationExcludedAtt=normalizedEvaluationExcludedAtt(t)}
    try{recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistFinanceMonth(m);await logAuditEvent('finance.technicians_update',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Ajustes financeiros individuais atualizados em ${m.monthName} ${m.year}.`,beforeData:before,afterData:financeTechnicianAuditSnapshot(m),metadata:{period:m.id,squad:state.squadCode}});await recordFinanceCalculationMemory(m,'technician_adjustments');state.financeRankingCache={};render();toast('Valores salvos; status operacional e bonificação foram recalculados com as regras consolidadas.')}catch(err){console.error(err);toast('Não foi possível salvar os valores financeiros.')}
  }
  async function persistFinanceMonth(m){
    if(!state.supabase||!m?.dbId)return;const payload={finance_settings:financeSettingsForMonth(m),finance_month_data:m.financeMonthData||{},finance_model:financeModelForMonth(m),finance_compare:m.financeCompare!==false,finance_technician_compare:m.financeTechCompare===true,finance_individual_cap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000,finance_comparison_snapshot:m.financeComparison||{},team_result:m.teamResult};const {error:me}=await state.supabase.from('squad_months').update(payload).eq('id',m.dbId);if(me)throw me;
    for(const t of m.technicians||[]){if(!t.dbId)continue;const row={technician_month_id:t.dbId,manual_bonus:safe(t.financeManualBonus),sales_commission:safe(t.salesCommission),vacation:!!t.vacation,waive_below_discount:!!t.waiveBelowDiscount,exclude_from_group_count:!!t.excludeFromGroupCount,calculated:t.financeData||{},updated_by:state.user.userId,updated_at:new Date().toISOString()};const {data,error}=await state.supabase.from('technician_finance_monthly').upsert(row,{onConflict:'technician_month_id'}).select('id').single();if(error)throw error;t.financeDbId=data.id}
    await persistCalculatedScores(m);
    invalidateDashboardCaches();
  }
  async function copyFinanceRulesFromPreviousMonth(){if(!isAdmin()||!hasPermission('finance.manage')||!requireSpecificSquad())return;const m=currentMonth();if(!m||m.isClosed)return;const prev=previousMonthForCurrent(m);if(!prev)return toast('Não existe mês anterior neste Squad.');if(!await confirmDialog(`Copiar as faixas e parâmetros financeiros de ${prev.monthName} ${prev.year}? O modelo oficial, cancelamento e valores individuais não serão copiados.`,{title:'Copiar regras financeiras',confirmText:'Copiar',tone:'warning'}))return;const before=financeConfigAuditSnapshot(m);m.financeSettings=clone(financeSettingsForMonth(prev));m.financeIndividualCap=Number.isFinite(Number(prev.financeIndividualCap))?safe(prev.financeIndividualCap):7000;recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistFinanceMonth(m);await logAuditEvent('finance.rules_copy',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Regras financeiras copiadas de ${prev.monthName} ${prev.year} para ${m.monthName} ${m.year}.`,beforeData:before,afterData:financeConfigAuditSnapshot(m),metadata:{period:m.id,sourcePeriod:prev.id,squad:state.squadCode}});await recordFinanceCalculationMemory(m,'rules_copy');render();toast('Regras financeiras copiadas do mês anterior.')}
  function financeReportRows(m){return (m?.technicians||[]).map(t=>{const d=t.financeData||{},sq=d.models?.squad||d,ind=d.models?.individual||d,official=financeModelForMonth(m);return{'Técnico':titleWords(t.name),'Status financeiro':d.financeStatus||'','Atendimentos':safe(t.att),'Atend. sem avaliação':normalizedEvaluationExcludedAtt(t),'Base elegível avaliação':eligibleEvaluationAttendance(t),'Atend./dia individual':safe(ind.avgPerDay),'Notas 5':safe(t.notes5),'% Notas 5 individual':safe(ind.notes5Pct),'Base Squad - comissão atend.':safe(sq.commissionAtt),'Base Squad - comissão N5':safe(sq.commissionNotes5),'Base Squad - final':safe(sq.final),'Individual - comissão atend.':safe(ind.commissionAtt),'Individual - comissão N5':safe(ind.commissionNotes5),'Individual - antes do teto':safe(ind.preCapFinal),'Individual - ajuste teto':safe(ind.capAdjustment),'Individual - final':safe(ind.final),'Diferença Individual x Squad':safe(ind.final)-safe(sq.final),'Modelo oficial':financeModelLabel(official),'Versão das regras':financeRuleVersionForMonth(m),'Assinatura das regras':financeRuleFingerprintForMonth(m),'Valor oficial':safe(d.final),'Multiplicador cancelamento':safe(d.cancelMultiplier||1),'Base após cancelamento':safe(d.afterCancel),'Base após férias':safe(d.afterVacationBase??d.afterCancel),'Ajuste férias sobre a base':safe(d.vacationBaseAdjustment),'Bônus manual':safe(d.manualBonus),'Prêmio atendimento':safe(d.topAttBonus),'Prêmio Notas 5':safe(d.topNotes5Bonus),'Comissão vendas':safe(d.salesCommission),'Desconto':safe(d.discount),'Redistribuição':safe(d.redistribution),'Férias':t.vacation?'SIM':'NÃO','Isenção manual desconto ABAIXO':t.waiveBelowDiscount?'SIM':'NÃO','Elegível desconto ABAIXO':d.discountEligible===false?'NÃO':'SIM','Conta na Base do Squad':t.excludeFromGroupCount?'NÃO':'SIM','Participa redistribuição se ACIMA':d.redistributionEligible===false?'NÃO':'SIM'}})}
  function reportAdminRows(m){if(!m)return[];return (state.superAdminCommissions||[]).filter(c=>safe(c.year)===safe(m.year)&&safe(c.month)===safe(m.month)).map(c=>({'Administrador':c.name||'Administrador','Comissão final':safe(c.amount),'Observação':c.notes||''}))}
  function loadExternalScriptOnce(src,test){return new Promise((resolve,reject)=>{if(test?.())return resolve();const existing=[...document.scripts].find(x=>x.src===src);if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const sc=document.createElement('script');sc.src=src;sc.onload=resolve;sc.onerror=()=>reject(new Error('Não foi possível carregar a biblioteca de exportação.'));document.head.appendChild(sc)})}
  async function exportFinanceExcel(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;try{await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',()=>window.XLSX);const wb=XLSX.utils.book_new(),rows=financeReportRows(m),ws=XLSX.utils.json_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,'Tecnicos');const admins=reportAdminRows(m);if(admins.length)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(admins),'Administradores');const c=m.financeComparison||{},summary=[{'Squad':state.squadCode,'Competência':`${m.monthName} ${m.year}`,'Status do mês':m.isClosed?'FECHADO':'EM ANDAMENTO','Modelo oficial':financeModelLabel(financeModelForMonth(m)),'Versão das regras':financeRuleVersionForMonth(m),'Assinatura das regras':financeRuleFingerprintForMonth(m),'Folha Base Squad':safe(c.squadTotal),'Individual antes do teto':safe(c.individualBeforeCapTotal),'Teto Individual':safe(c.individualCap||m.financeIndividualCap||7000),'Fator do teto':safe(c.individualCapFactor||1),'Folha Individual':safe(c.individualTotal),'Diferença':safe(c.difference),'Dias seg-sex':safe(c.businessCalendar?.weekdays),'Dias não úteis descontados':safe(c.businessCalendar?.excludedCount),'Dias úteis financeiros':safe(c.businessCalendar?.businessDays),'Datas descontadas':(c.businessCalendar?.exceptions||[]).map(x=>`${x.date} - ${x.description||'Dia não útil'}`).join(' | '),'Média atend./técnico/dia Squad':safe(c.groupAvgPerDay),'% Notas 5 Squad':safe(c.groupNotes5Pct),'Base Squad após cancelamento':safe(c.groupAfterCancel),'Clientes início':safe(m.financeMonthData?.customersStart),'Cancelados':safe(m.financeMonthData?.canceledCount),'% cancelamento':safe(m.financeMonthData?.customersStart)?safe(m.financeMonthData?.canceledCount)/safe(m.financeMonthData?.customersStart):0,'Técnicos com produção':safe(c.activeTechnicians),'Técnicos considerados na média Base Squad':safe(c.countedTechnicians??c.activeTechnicians),'Técnicos desconsiderados no denominador':safe(c.excludedFromGroupCount)}];XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),'Resumo');XLSX.writeFile(wb,`Bonificacao_Squad_${state.squadCode}_${m.id}.xlsx`);toast('Relatório Excel comparativo gerado.')}catch(err){console.error(err);toast('Não foi possível gerar o Excel. Verifique sua conexão com a internet.')}
  }
  async function exportFinancePdf(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;try{await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>window.jspdf?.jsPDF);await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js',()=>window.jspdf?.jsPDF?.API?.autoTable);const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),rows=financeReportRows(m),c=m.financeComparison||{};doc.setFontSize(16);doc.text(`Bonificação • Squad ${state.squadCode} • ${m.monthName} ${m.year}`,14,14);doc.setFontSize(9);doc.text(`${m.isClosed?'FECHADO':'PRÉVIA'} • Modelo oficial: ${financeModelLabel(financeModelForMonth(m))} • Regra ${financeRuleVersionForMonth(m)} / ${financeRuleFingerprintForMonth(m)} • Base Squad ${fmtMoney(c.squadTotal)} • Individual ${fmtMoney(c.individualTotal)}${c.individualCapApplied?' (teto aplicado)':''} • Gerado em ${new Date().toLocaleString('pt-BR')}`,14,20);const body=rows.map(r=>[r['Técnico'],r['Status financeiro'],fmtMoney(r['Base Squad - final']),fmtMoney(r['Individual - final']),fmtMoney(r['Diferença Individual x Squad']),r['Modelo oficial'],fmtMoney(r['Valor oficial']),fmtMoney(r['Bônus manual']+r['Prêmio atendimento']+r['Prêmio Notas 5']),fmtMoney(r['Comissão vendas']),fmtMoney(r['Desconto']),fmtMoney(r['Redistribuição']),r['Férias'],r['Conta na Base do Squad']]);doc.autoTable({startY:25,head:[['Técnico','Status','Base Squad','Individual','Dif.','Oficial','Valor oficial','Bônus','Vendas','Desc.','Redistrib.','Férias','Conta qtd.']],body,styles:{fontSize:6.6,cellPadding:1.4},headStyles:{fillColor:[35,39,48]},columnStyles:{6:{fontStyle:'bold'}}});const admins=reportAdminRows(m);if(admins.length){const y=doc.lastAutoTable.finalY+8;doc.setFontSize(11);doc.text('Comissão de Administrador',14,y);doc.autoTable({startY:y+3,head:[['Administrador','Comissão final','Observação']],body:admins.map(a=>[a['Administrador'],fmtMoney(a['Comissão final']),a['Observação']]),styles:{fontSize:8}})}doc.save(`Bonificacao_Squad_${state.squadCode}_${m.id}.pdf`);toast('Relatório PDF comparativo gerado.')}catch(err){console.error(err);toast('Não foi possível gerar o PDF. Verifique sua conexão com a internet.')}
  }
  function renderSuperAdminCommission(m){
    if(!isSuperAdmin()||!$('#superAdminCommissionInput'))return;if(!state.supabase&&!state.superAdminCommissions.length){try{state.superAdminCommissions=JSON.parse(localStorage.getItem(demoAdminCommissionKey())||'[]')}catch(e){}}const disabled=!m;$('#superAdminCommissionInput').disabled=disabled;$('#superAdminCommissionNotes').disabled=disabled;$('#saveSuperAdminCommissionBtn').disabled=disabled;const found=m?(state.superAdminCommissions||[]).find(c=>c.user_id===state.user.userId&&safe(c.year)===safe(m.year)&&safe(c.month)===safe(m.month)):null;$('#superAdminCommissionInput').value=found?safe(found.amount):'';$('#superAdminCommissionNotes').value=found?.notes||'';$('#superAdminCommissionPeriod').textContent=m?`${m.monthName} ${m.year} • valor total manual`:'Selecione um Squad e um mês para definir a competência.';
  }
  function demoAdminCommissionKey(){return'squadDashboardSuperAdminCommissionsV218'}
  async function saveSuperAdminCommission(){
    if(!isSuperAdmin())return;const m=currentMonth();if(!m)return toast('Selecione um Squad e um mês para definir a competência.');const amount=Math.max(0,safe($('#superAdminCommissionInput').value)),notes=$('#superAdminCommissionNotes').value.trim(),previous=(state.superAdminCommissions||[]).find(c=>c.user_id===state.user.userId&&safe(c.year)===safe(m.year)&&safe(c.month)===safe(m.month))||null;try{if(state.supabase){const payload={organization_id:state.user.organizationId,user_id:state.user.userId,year:m.year,month:m.month,amount,notes,updated_by:state.user.userId,updated_at:new Date().toISOString()};const {data,error}=await state.supabase.from('super_admin_commissions').upsert(payload,{onConflict:'organization_id,user_id,year,month'}).select('id').single();if(error)throw error;const old=(state.superAdminCommissions||[]).filter(c=>!(c.user_id===state.user.userId&&safe(c.year)===m.year&&safe(c.month)===m.month));state.superAdminCommissions=[...old,{...payload,id:data.id,name:state.user.fullName}]}else{const list=JSON.parse(localStorage.getItem(demoAdminCommissionKey())||'[]').filter(c=>!(c.user_id===state.user.email&&safe(c.year)===m.year&&safe(c.month)===m.month));list.push({user_id:state.user.email,year:m.year,month:m.month,amount,notes,name:state.user.fullName});localStorage.setItem(demoAdminCommissionKey(),JSON.stringify(list));state.superAdminCommissions=list}await logAuditEvent('finance.admin_commission',{entityType:'super_admin_commission',entityId:`${m.year}-${String(m.month).padStart(2,'0')}`,squadId:null,description:`Comissão do Administrador atualizada em ${m.monthName} ${m.year}.`,beforeData:previous?{amount:safe(previous.amount),notes:previous.notes||''}:{},afterData:{amount,notes},metadata:{period:m.id}});renderSuperAdminCommission(m);toast('Comissão do Administrador salva.')}catch(err){console.error(err);toast('Não foi possível salvar a comissão do Administrador. Confira se a migração financeira V2.18.0 está aplicada.')}
  }


  function formatDateTime(v){if(!v)return'';try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return String(v)}}
  function previousMonthForCurrent(m=currentMonth()){
    if(!m)return null;const ids=Object.keys(currentMonths()).filter(id=>id<m.id).sort().reverse();return ids.length?currentMonths()[ids[0]]:null;
  }
  async function copyGoalsFromPreviousMonth(){
    if(!isAdmin()||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de copiar metas.');return}
    const prev=previousMonthForCurrent(m);if(!prev){toast('Não existe um mês anterior importado neste Squad.');return}
    if(!await confirmDialog(`Copiar somente as metas individuais de ${prev.monthName} ${prev.year} para ${m.monthName} ${m.year}? Metas de atendimentos e notas 5 já preenchidas no mês atual serão substituídas.`,{title:'Copiar metas do mês anterior',confirmText:'Copiar metas',tone:'warning'}))return;
    try{
      const beforeGoals=(m.technicians||[]).map(t=>({name:t.name,goalAtt:safe(t.goalAtt),goalEval:safe(t.goalEval)}));let copied=0;for(const t of m.technicians||[]){const old=(prev.technicians||[]).find(x=>(t.userId&&x.userId&&t.userId===x.userId)||samePersonName(x.name,t.name));if(!old)continue;t.goalAtt=safe(old.goalAtt);t.goalEval=safe(old.goalEval);copied++;}
      recalculateMonth(m);saveDemoSquads();if(state.supabase)await persistManualMetrics(m);await logAuditEvent('goals.monthly_metrics_update',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Metas individuais copiadas de ${prev.monthName} ${prev.year} para ${m.monthName} ${m.year}.`,beforeData:beforeGoals,afterData:(m.technicians||[]).map(t=>({name:t.name,goalAtt:safe(t.goalAtt),goalEval:safe(t.goalEval)})),metadata:{period:m.id,sourcePeriod:prev.id,squad:state.squadCode,operation:'copy_goals'}});render();toast(`${copied} técnico(s) tiveram as metas individuais copiadas de ${prev.monthName}.`);
    }catch(err){console.error(err);toast('Não foi possível copiar as metas do mês anterior.')}
  }
  async function closeMonth(id){
    if(!isAdmin()||!hasPermission('month.manage')||!requireSpecificSquad())return;const m=currentMonths()[id];if(!m||m.isClosed)return;
    if(!await confirmDialog(`Fechar ${m.monthName} ${m.year}? Dados, metas, pontuação e bonificação financeira ficarão congelados até que o mês seja reaberto.`,{title:'Fechar competência',confirmText:'Fechar mês',tone:'warning'}))return;
    const before={isClosed:!!m.isClosed,teamResult:m.teamResult||'',technicians:(m.technicians||[]).length,financeModel:financeModelForMonth(m),financeTotal:safe(m.financeComparison?.[financeModelForMonth(m)==='individual'?'individualTotal':'squadTotal'])};
    try{
      recalculateMonth(m,{final:true});const rules=scoreRules(m,{final:true}),now=new Date().toISOString();
      m.closedSnapshot={version:11,closedAt:now,businessCalendar:clone(m.financeComparison?.businessCalendar||financeBusinessCalendarSummary(m)),financeRuleVersion:financeRuleVersionForMonth(m),financeRuleFingerprint:financeRuleFingerprintForMonth(m),scoreRules:{refAtt:rules.refAtt,refTotalEval:rules.refTotalEval,refAvg:rules.refAvg,refEvalPct:rules.refEvalPct,bonusAtt:rules.bonusAtt,bonusTotalEval:rules.bonusTotalEval,bonusAvg:rules.bonusAvg,bonusEvalPct:rules.bonusEvalPct},teamResult:m.teamResult,teamGoals:teamSettings(m),financeModel:financeModelForMonth(m),financeCompare:m.financeCompare!==false,financeTechCompare:m.financeTechCompare===true,financeIndividualCap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000,financeComparison:clone(m.financeComparison||{}),financeSettings:clone(financeSettingsForMonth(m)),financeMonthData:clone(m.financeMonthData||{}),technicians:(m.technicians||[]).map(t=>({name:t.name,att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1),totalEval:safe(t.totalEval),avg:safe(t.avg),evalPct:safe(t.evalPct),evaluationExcludedAtt:normalizedEvaluationExcludedAtt(t),eligibleAtt:eligibleEvaluationAttendance(t),goalAtt:safe(t.goalAtt),goalEval:safe(t.goalEval),points:safe(t.points),goalsHit:safe(t.goalsHit),status:t.status,rank:t.rank,financeManualBonus:safe(t.financeManualBonus),salesCommission:safe(t.salesCommission),vacation:!!t.vacation,waiveBelowDiscount:!!t.waiveBelowDiscount,excludeFromGroupCount:!!t.excludeFromGroupCount,financeData:clone(t.financeData||{})}))};
      m.isClosed=true;m.closedAt=now;m.closedBy=state.user?.userId||state.user?.email||null;saveDemoSquads();
      if(state.supabase&&m.dbId){await persistFinanceMonth(m);const {error}=await state.supabase.from('squad_months').update({is_closed:true,closed_at:now,closed_by:state.user.userId,closed_snapshot:m.closedSnapshot,team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;await persistCalculatedScores(m)}
      await logAuditEvent('month.close',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Competência ${m.monthName} ${m.year} fechada e congelada.`,beforeData:before,afterData:{isClosed:true,closedAt:now,teamResult:m.teamResult,financeModel:financeModelForMonth(m),snapshotVersion:m.closedSnapshot.version,financeRuleVersion:financeRuleVersionForMonth(m)},metadata:{period:m.id,squad:state.squadCode}});
      await recordFinanceCalculationMemory(m,'month_close');invalidateDashboardCaches();refreshSelectors();render();toast(`${m.monthName} ${m.year} fechado e congelado com sucesso.`);
    }catch(err){console.error(err);toast('Não foi possível fechar o mês. Confira as migrações V2.4.0, V2.18.0, V2.19.0 e V2.20.0.')}
  }
  async function reopenMonth(id){
    if(!isAdmin()||!hasPermission('month.manage')||!requireSpecificSquad())return;const m=currentMonths()[id];if(!m||!m.isClosed)return;
    if(!await confirmDialog(`Reabrir ${m.monthName} ${m.year}? O mês voltará a aceitar importações e alterações. Ao concluir a correção, feche-o novamente.`,{title:'Reabrir competência',confirmText:'Reabrir mês',tone:'warning',requireText:'REABRIR'}))return;
    const before={isClosed:true,closedAt:m.closedAt||null,closedBy:m.closedBy||null,snapshotVersion:safe(m.closedSnapshot?.version),teamResult:m.teamResult||'',financeModel:financeModelForMonth(m)};
    try{
      m.isClosed=false;m.closedAt=null;m.closedBy=null;m.closedSnapshot={};recalculateMonth(m);saveDemoSquads();
      if(state.supabase&&m.dbId){const {error}=await state.supabase.from('squad_months').update({is_closed:false,closed_at:null,closed_by:null,closed_snapshot:{},team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;await persistCalculatedScores(m);await persistFinanceMonth(m)}
      await logAuditEvent('month.reopen',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Competência ${m.monthName} ${m.year} reaberta para alterações.`,beforeData:before,afterData:{isClosed:false,closedAt:null,teamResult:m.teamResult,financeModel:financeModelForMonth(m)},metadata:{period:m.id,squad:state.squadCode}});
      invalidateDashboardCaches();refreshSelectors();render();toast(`${m.monthName} ${m.year} reaberto. Faça os ajustes e feche o mês novamente.`);
    }catch(err){console.error(err);toast('Não foi possível reabrir o mês.')}
  }

  async function persistCalculatedScores(m){
    for(const t of m.technicians||[]){if(!t.dbId)continue;const {error}=await state.supabase.from('technician_monthly').update({evaluation_excluded_att:normalizedEvaluationExcludedAtt(t),eval_pct:safe(t.evalPct),points:safe(t.points),goals_hit:safe(t.goalsHit),status:t.status,rank:t.rank}).eq('id',t.dbId);if(error)throw error;}
  }

  async function persistManualMetrics(m){
    for(const t of m.technicians||[]){
      if(!t.dbId)continue;
      const {error}=await state.supabase.from('technician_monthly').update({goal_att:safe(t.goalAtt),goal_eval:safe(t.goalEval),evaluation_excluded_att:normalizedEvaluationExcludedAtt(t),eval_pct:safe(t.evalPct),points:safe(t.points),goals_hit:safe(t.goalsHit),status:t.status,rank:t.rank}).eq('id',t.dbId);if(error)throw error;
    }
    if(m.dbId){const {error}=await state.supabase.from('squad_months').update({team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error;}
  }

  async function deleteImportedMonth(id){
    if(!isAdmin()||!hasPermission('month.manage')||!requireSpecificSquad())return;const m=currentMonths()[id];if(!m)return;if(m.isClosed){toast('Mês fechado não pode ser excluído. Reabra-o primeiro.');return}
    if(!await confirmDialog(`Excluir ${m.monthName} ${m.year} do Squad ${state.squadCode}? Isso remove os dados importados e as métricas manuais deste mês.`,{title:'Excluir competência',confirmText:'Excluir mês',tone:'danger',requireText:'EXCLUIR'}))return;
    const before={period:m.id,monthName:m.monthName,year:m.year,sourceFile:m.sourceFile||'',latestDay:safe(m.latestDay),technicians:(m.technicians||[]).length,isClosed:false};const entityId=m.dbId||m.id,squadId=auditSquadId();
    try{if(state.supabase&&m.dbId){const {error}=await state.supabase.from('squad_months').delete().eq('id',m.dbId);if(error)throw error;}delete currentSquad().months[id];const ids=Object.keys(currentMonths()).sort().reverse();state.currentId=ids[0]||null;chooseDefaultTech();saveDemoSquads();await logAuditEvent('month.delete',{entityType:'squad_month',entityId,squadId,description:`Competência ${m.monthName} ${m.year} excluída do Squad ${state.squadCode}.`,beforeData:before,afterData:{deleted:true},metadata:{period:id,squad:state.squadCode}});invalidateDashboardCaches();refreshSelectors();render();toast('Mês importado excluído.')}catch(err){console.error(err);toast('Não foi possível excluir este mês.')}
  }

  function businessDaysMonFri(y,m){let c=0,days=new Date(y,m,0).getDate();for(let d=1;d<=days;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function autoTeamAttGoal(m){return businessDaysMonFri(m.year,m.month)*10*Math.max(1,m.technicians.length)}
  function teamSettings(m){if(m?.isClosed&&m.closedSnapshot?.teamGoals)return{teamGoalAtt:safe(m.closedSnapshot.teamGoals.teamGoalAtt),teamGoalEvalPct:safe(m.closedSnapshot.teamGoals.teamGoalEvalPct)};const saved=m?.settings||{};return{teamGoalAtt:safe(saved.teamGoalAtt)||autoTeamAttGoal(m),teamGoalEvalPct:Number.isFinite(Number(saved.teamGoalEvalPct))?Number(saved.teamGoalEvalPct):.343}}
  async function saveTeamGoals(){if(!isAdmin()||!hasPermission('goals.manage')||!requireSpecificSquad())return;const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar as metas.');return}const before=clone(teamSettings(m));try{const att=Math.max(0,safe($('#teamGoalAttInput').value)),pct=Math.max(0,safe($('#teamGoalPctInput').value))/100;m.settings={...(m.settings||{}),teamGoalAtt:att||autoTeamAttGoal(m),teamGoalEvalPct:pct};recalculateMonth(m);saveDemoSquads();if(state.supabase){const {error}=await state.supabase.from('squad_months').update({team_goal_att:m.settings.teamGoalAtt,team_goal_eval_pct:m.settings.teamGoalEvalPct,team_result:m.teamResult}).eq('id',m.dbId);if(error)throw error}invalidateDashboardCaches();await logAuditEvent('goals.team_update',{entityType:'squad_month',entityId:m.dbId||m.id,description:`Metas do Squad ${state.squadCode} atualizadas para ${m.monthName} ${m.year}.`,beforeData:before,afterData:clone(teamSettings(m)),metadata:{period:m.id,squad:state.squadCode}});renderTeam();renderAdmin();toast('Metas salvas para '+m.monthName+'.')}catch(err){console.error(err);toast('Não foi possível salvar as metas.')}}
  function useAutomaticTeamGoal(){const m=currentMonth();if(!m)return;if(m.isClosed){toast('Este mês está fechado. Reabra-o antes de alterar as metas.');return}$('#teamGoalAttInput').value=autoTeamAttGoal(m);if(!$('#teamGoalPctInput').value)$('#teamGoalPctInput').value='34.3';toast('Meta automática calculada. Clique em Salvar metas.')}
  function deriveTotals(list){const att=(list||[]).reduce((s,t)=>s+safe(t.att),0),evaluationExcludedAtt=(list||[]).reduce((s,t)=>s+normalizedEvaluationExcludedAtt(t),0),eligibleAtt=Math.max(0,att-evaluationExcludedAtt),evals=(list||[]).reduce((s,t)=>s+safe(t.totalEval),0),points=(list||[]).reduce((s,t)=>s+safe(t.points),0);return{att,evaluationExcludedAtt,eligibleAtt,eval:evals,evalPct:eligibleAtt?evals/eligibleAtt:0,points}}
  function goalLine(noun,current,goal){if(!goal)return'Meta não encontrada.';if(current>=goal)return`Meta atingida: ${fmtInt(current-goal)} ${noun} acima do objetivo.`;return`Faltam ${fmtInt(goal-current)} ${noun} para atingir a meta.`}
  function buildHeroMessage(t,a,n){if(!safe(t.goalAtt)||!safe(t.goalEval))return'Resultados do mês importados. O administrador ainda precisa preencher as metas mensais deste técnico.';if(a>=1&&n>=1)return'Excelente ritmo: as duas metas mensais já foram atingidas.';if(a>=1)return'Meta de atendimentos atingida. Agora o foco é completar as notas 5.';if(n>=1)return'Meta de notas 5 atingida. Agora o foco é completar os atendimentos.';return`Você está em ${fmtPct(a)} da meta de atendimentos e ${fmtPct(n)} da meta de notas 5.`}
  function coachText(t,m,a,n){if(a>=1&&n>=1)return{title:'Meta completa!',text:'As duas metas foram batidas. O objetivo agora é sustentar qualidade e produtividade.'};const remainingDays=Math.max(1,businessDaysRemaining(m.year,m.month,m.latestDay)),attNeed=Math.max(0,t.goalAtt-t.att),noteNeed=Math.max(0,t.goalEval-t.notes5);if(a>=1)return{title:'Foco em avaliações',text:`Estimativa: ${(noteNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} nota(s) 5 por dia útil restante.`};if(n>=1)return{title:'Foco em volume',text:`Estimativa: ${(attNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} atendimento(s) por dia útil restante.`};return{title:'Ritmo necessário',text:`Estimativa: ${(attNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} atendimentos e ${(noteNeed/remainingDays).toLocaleString('pt-BR',{maximumFractionDigits:1})} notas 5 por dia útil restante.`}}
  function businessDaysRemaining(y,m,latest){let c=0,days=new Date(y,m,0).getDate();for(let d=latest+1;d<=days;d++){const dow=new Date(y,m-1,d).getDay();if(dow>=1&&dow<=5)c++}return c}
  function overallLabel(a,n){if(a>=1&&n>=1)return'META BATIDA';if(a>=.75&&n>=.75)return'ESTÁ NO CAMINHO';if(a>=.45||n>=.45)return'PRECISA DE ATENÇÃO';return'APERTA O PÉ'}
  function overallColor(a,n){const min=Math.min(a,n);return min>=1?'var(--success)':min>=.75?'var(--success)':min>=.45?'var(--warn)':'var(--danger)'}
  function firstName(n){return title((n||'').trim().split(/\s+/)[0]||'Técnico')}
  function shortName(n){const p=(n||'').split(/\s+/);return p.length>1?`${title(p[0])} ${title(p[p.length-1])}`:title(n)}
  function title(s=''){return s.charAt(0).toUpperCase()+s.slice(1).toLowerCase()}
  function titleWords(s=''){return s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}

  const IMPORT_HISTORY_KEY='softenPerformanceImportHistoryV236';
  function loadLocalImportHistory(){try{const rows=JSON.parse(localStorage.getItem(IMPORT_HISTORY_KEY)||'[]');return Array.isArray(rows)?rows.map(normalizeImportHistory):[]}catch(e){return[]}}
  function saveLocalImportHistory(rows){
    try{
      const limited=(rows||[]).slice(0,20).map((r,i)=>i<2?r:{...r,beforeSnapshot:null});
      localStorage.setItem(IMPORT_HISTORY_KEY,JSON.stringify(limited));
    }catch(err){console.warn('Histórico local de importação atingiu o limite do navegador.',err)}
  }
  function importTableUnavailable(error){const code=String(error?.code||''),msg=String(error?.message||'').toLowerCase();return code==='42P01'||code==='PGRST205'||msg.includes('import_batches')&&msg.includes('not find')}
  function historyRowFromDb(row){return normalizeImportHistory({id:row.id,batchKey:row.batch_key,kind:row.kind,period:row.period,fileName:row.file_name,checksum:row.checksum,scope:Array.isArray(row.scope_codes)?row.scope_codes:[],rows:row.valid_rows,ignored:row.ignored_rows,unmatched:row.unmatched_count,status:row.status,createdAt:row.imported_at,createdBy:row.actor_name||'',risk:row.risk_level||'ok',beforeSnapshot:row.before_snapshot||null,details:row.summary||{}})}
  async function ensureImportHistoryLoaded(force=false){
    if(state.importHistoryLoading)return state.importHistory;
    if(state.importHistoryLoaded&&!force)return state.importHistory;
    state.importHistoryLoading=true;
    try{
      const local=loadLocalImportHistory();let remote=[];
      if(state.supabase&&state.user?.organizationId){
        const {data,error}=await state.supabase.from('import_batches').select('id,batch_key,kind,period,file_name,checksum,scope_codes,valid_rows,ignored_rows,unmatched_count,status,risk_level,summary,before_snapshot,actor_name,imported_at').eq('organization_id',state.user.organizationId).order('imported_at',{ascending:false}).limit(30);
        if(error&&!importTableUnavailable(error))throw error;
        if(!error)remote=(data||[]).map(historyRowFromDb);
      }
      const map=new Map();[...remote,...local].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).forEach(r=>{const key=r.batchKey||r.id;if(key&&!map.has(key))map.set(key,r)});
      state.importHistory=[...map.values()].slice(0,30);state.importHistoryLoaded=true;renderImportHistory();return state.importHistory;
    }catch(err){console.warn('Não foi possível carregar histórico remoto de importação.',err);state.importHistory=loadLocalImportHistory();state.importHistoryLoaded=true;renderImportHistory();return state.importHistory}
    finally{state.importHistoryLoading=false}
  }
  async function persistImportHistory(record){
    const normalized=normalizeImportHistory(record),local=[normalized,...loadLocalImportHistory().filter(r=>(r.batchKey||r.id)!==(normalized.batchKey||normalized.id))];saveLocalImportHistory(local);state.importHistory=[normalized,...(state.importHistory||[]).filter(r=>(r.batchKey||r.id)!==(normalized.batchKey||normalized.id))].slice(0,30);renderImportHistory();
    if(!state.supabase||!state.user?.organizationId)return normalized;
    const firstCode=normalized.scope.length===1?normalized.scope[0]:null,squadId=firstCode?state.squads?.[firstCode]?.dbId:null;
    const payload={batch_key:normalized.batchKey,organization_id:state.user.organizationId,squad_id:squadId||null,kind:normalized.kind,period:normalized.period,file_name:normalized.fileName,checksum:normalized.checksum,scope_codes:normalized.scope,valid_rows:normalized.rows,ignored_rows:normalized.ignored,unmatched_count:normalized.unmatched,status:normalized.status,risk_level:normalized.risk,summary:normalized.details||{},before_snapshot:normalized.beforeSnapshot||{},actor_user_id:state.user.userId||null,actor_name:state.user.fullName||state.user.email||'Usuário',imported_at:normalized.createdAt};
    const {data,error}=await state.supabase.from('import_batches').upsert(payload,{onConflict:'batch_key'}).select('id').maybeSingle();
    if(error){if(!importTableUnavailable(error))console.warn('Histórico de importação não foi persistido no Supabase.',error);return normalized}
    if(data?.id)normalized.id=data.id;return normalized;
  }
  function formatImportHistoryDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
  function importKindLabel(kind){return kind==='quality'?'Produto/Empresa':'Atendimentos'}
  function renderImportHistory(){
    const body=$('#importHistoryRows');if(!body)return;const rows=(state.importHistory||[]).slice(0,12);
    if(!rows.length){body.innerHTML='<tr><td colspan="8" class="muted">Nenhuma importação registrada ainda.</td></tr>';}
    else body.innerHTML=rows.map(r=>`<tr><td>${formatImportHistoryDate(r.createdAt)}</td><td><span class="import-kind-badge ${r.kind}">${importKindLabel(r.kind)}</span></td><td>${escapeHtml(monthLabelFromId(r.period)||r.period||'—')}</td><td title="${escapeHtml(r.fileName)}">${escapeHtml(String(r.fileName||'—').slice(0,34))}</td><td>${escapeHtml((r.scope||[]).map(c=>`Squad ${c}`).join(', ')||'—')}</td><td>${fmtInt(r.rows)}</td><td><span class="import-risk-chip ${r.risk||'ok'}">${r.risk==='error'?'BLOQUEIO':r.risk==='warning'?'ATENÇÃO':'OK'}</span></td><td><span class="import-status-badge ${r.status}">${r.status==='reverted'?'REVERTIDA':r.status==='failed'?'FALHOU':'CONCLUÍDA'}</span></td></tr>`).join('');
    const latest=(state.importHistory||[]).find(r=>r.status==='success'),age=latest?Date.now()-new Date(latest.createdAt).getTime():Infinity,eligible=canRollbackImport(latest)&&age<=30*60*1000;
    if($('#undoLastImportBtn')){$('#undoLastImportBtn').disabled=!eligible;$('#undoLastImportBtn').title=eligible?'Disponível por 30 minutos após a última importação concluída.':'A reversão fica disponível por 30 minutos após a última importação segura.';}
    if($('#importCenterStatus'))$('#importCenterStatus').textContent=state.importHistoryLoading?'Atualizando...':rows.length?`${rows.length} registro(s)`:'Pronto';
  }
  function currentOperationalImportSummary(code,id){const m=state.squads?.[code]?.months?.[id];if(!m)return{technicians:0,attendance:0,evaluations:0,notes5:0};const totals=deriveTotals(m.technicians||[]);return{technicians:(m.technicians||[]).filter(isOperationalTechnicianRow).length,attendance:safe(totals.att),evaluations:safe(totals.eval),notes5:(m.technicians||[]).reduce((s,t)=>s+safe(t.notes5),0)}}
  function currentQualityImportSummary(code,id){const m=state.squads?.[code]?.months?.[id];if(!m)return{rows:0,technicians:0,product:0,company:0};const rows=m.qualityExternal||[],names=new Set(rows.map(q=>nameLinkKey(q.technicianName)).filter(Boolean));let product=0,company=0;for(const q of rows){const count=[5,4,3,2,1].reduce((s,n)=>s+safe(q[`notes${n}`]),0);if(q.qualityType==='product')product+=count;if(q.qualityType==='company')company+=count}return{rows:product+company,technicians:names.size,product,company}}
  function negativeImportValues(pending,id){if(pending?.kind!=='service')return 0;let count=0;for(const r of pending.rows||[]){if(r.id!==id)continue;for(const key of ['att','notes5','notes4','notes3','notes2','notes1'])if(safe(r[key])<0)count++;}return count}
  function buildImportPreview(pending,id){
    if(!pending||!id)return null;const codes=(pending.codes||[]).filter(code=>(pending.rows||[]).some(r=>r.group===code&&r.id===id)),current={};for(const code of codes)current[code]=pending.kind==='quality'?currentQualityImportSummary(code,id):currentOperationalImportSummary(code,id);
    const summary=pending.kind==='quality'?summarizeQualityImport(pending.rows,id,codes,current):summarizeServiceImport(pending.rows,id,codes,current),closedSquads=codes.filter(code=>!!state.squads?.[code]?.months?.[id]?.isClosed),validRows=summary.rows,validation=validateImportPreview({kind:pending.kind,totalRows:safe(pending.total),validRows,ignored:safe(pending.ignored),unmatched:(pending.unmatched||[]).length,ambiguous:(pending.ambiguous||[]).length,negativeValues:negativeImportValues(pending,id),closedSquads,summary});return{summary,validation,codes};
  }
  function importDeltaText(delta){const d=Number(delta);if(!Number.isFinite(d)||Math.abs(d)<.005)return{className:'flat',text:'0%'};return{className:d>0?'up':'down',text:`${d>0?'+':''}${Math.round(d*100)}%`}}
  function renderImportPreview(){
    const id=$('#csvMonthSelect')?.value,pending=state.pendingCsv,block=$('#importPreviewBlock');if(!block||!pending||!id){if(block)block.classList.add('hidden');return}
    const preview=buildImportPreview(pending,id);state.importPreview=preview;if(!preview){block.classList.add('hidden');return}block.classList.remove('hidden');const {summary,validation}=preview;
    const scopeText=preview.codes.length===1?`Squad ${preview.codes[0]}`:`${preview.codes.length} Squads`;
    $('#importPreviewSummary').innerHTML=[['Linhas válidas',fmtInt(summary.rows)],['Técnicos',fmtInt(summary.technicians)],['Ignoradas',fmtInt(pending.ignored)],['Escopo',scopeText]].map(([a,b])=>`<div class="import-preview-metric"><span>${a}</span><strong>${b}</strong></div>`).join('');
    const banner=$('#importRiskBanner');banner.className=`import-risk-banner ${validation.level}`;banner.innerHTML=validation.blocked?'<strong>⛔ Importação bloqueada.</strong> Corrija os itens críticos antes de gravar.':validation.requiresConfirmation?'<strong>⚠ Revisão necessária.</strong> Existem diferenças relevantes. A confirmação exigirá a palavra IMPORTAR.':'<strong>✓ Validação concluída.</strong> Nenhum risco crítico foi identificado para esta competência.';
    $('#importValidationList').innerHTML=validation.issues.length?validation.issues.map(i=>`<div class="import-validation-item ${i.severity}"><b>${i.severity==='error'?'ERRO':i.severity==='warning'?'ATENÇÃO':'INFO'}</b><span>${escapeHtml(i.message)}</span></div>`).join(''):'<div class="import-validation-item info"><b>OK</b><span>Arquivo, escopo, competência e vínculos passaram pelas validações básicas.</span></div>';
    $('#importComparisonRows').innerHTML=(summary.squads||[]).map(s=>{const current=pending.kind==='quality'?safe(s.current.rows):safe(s.current.attendance),incoming=pending.kind==='quality'?safe(s.incoming.ratings):safe(s.incoming.attendance),delta=importDeltaText(pending.kind==='quality'?s.rowDelta:s.attendanceDelta),status=(pending.kind==='service'&&s.current.attendance>0&&s.attendanceDelta<=-.35)||(pending.kind==='quality'&&s.current.rows>0&&s.rowDelta<=-.40)?'Revisar':'OK';return`<tr><td><strong>Squad ${s.code}</strong></td><td>${fmtInt(current)}</td><td>${fmtInt(incoming)}</td><td><span class="import-delta ${delta.className}">${delta.text}</span></td><td>${fmtInt(s.current.technicians)}</td><td>${fmtInt(s.incoming.technicians)}</td><td><span class="import-risk-chip ${status==='OK'?'ok':'warning'}">${status}</span></td></tr>`}).join('')||'<tr><td colspan="7" class="muted">Nenhum dado vinculado ao período selecionado.</td></tr>';
    const btn=$('#confirmCsvImportBtn');if(btn){btn.disabled=validation.blocked;btn.title=validation.blocked?'Há erros que impedem a importação.':'';}
  }
  function captureImportSnapshot(pending,selectedId){
    const snapshot={};for(const code of pending?.codes||[]){const touched={};for(const id of pending?.months||[]){const hasRows=(pending.rows||[]).some(r=>r.group===code&&r.id===id);if(!hasRows)continue;const mon=state.squads?.[code]?.months?.[id];if(id===selectedId||mon)touched[id]=mon?clone(mon):null}if(Object.keys(touched).length)snapshot[code]=touched}return snapshot;
  }
  function makeImportBatchKey(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`imp-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}
  async function recordCompletedImport(pending,id,snapshot,extra={}){
    const preview=state.importPreview||buildImportPreview(pending,id),record=normalizeImportHistory({batchKey:makeImportBatchKey(),kind:pending.kind,period:id,fileName:pending.fileName,checksum:pending.checksum||'',scope:preview?.codes||pending.codes||[],rows:preview?.summary?.rows||0,ignored:safe(pending.ignored),unmatched:(pending.unmatched||[]).length,status:'success',createdAt:new Date().toISOString(),createdBy:state.user?.fullName||state.user?.email||'',risk:preview?.validation?.level||'ok',beforeSnapshot:snapshot,details:{...extra,totalRows:safe(pending.total),validationIssues:preview?.validation?.issues||[]}});await persistImportHistory(record);return record;
  }
  async function markImportReverted(record){
    const updated=normalizeImportHistory({...record,status:'reverted',details:{...(record.details||{}),revertedAt:new Date().toISOString(),revertedBy:state.user?.fullName||state.user?.email||''}});saveLocalImportHistory([updated,...loadLocalImportHistory().filter(r=>(r.batchKey||r.id)!==(updated.batchKey||updated.id))]);state.importHistory=[updated,...(state.importHistory||[]).filter(r=>(r.batchKey||r.id)!==(updated.batchKey||updated.id))];renderImportHistory();if(state.supabase&&record?.batchKey){const {error}=await state.supabase.from('import_batches').update({status:'reverted',reverted_by:state.user.userId||null,reverted_at:new Date().toISOString()}).eq('batch_key',record.batchKey);if(error&&!importTableUnavailable(error))console.warn(error)}
  }
  async function restoreImportSnapshot(snapshot,{persist=true}={}){
    for(const [code,months] of Object.entries(snapshot||{})){const squad=state.squads?.[code];if(!squad)continue;for(const [id,before] of Object.entries(months||{})){if(before==null){const current=squad.months?.[id];if(persist&&state.supabase&&current?.dbId){const {error}=await state.supabase.from('squad_months').delete().eq('id',current.dbId);if(error)throw error}delete squad.months[id];continue}const restored=clone(before);squad.months[id]=restored;if(persist&&state.supabase){await persistImportedMonth(restored,squad);await persistQualityMonth(restored,restored.sourceFile||'rollback')}}}
    saveDemoSquads();state.financeRankingCache={};refreshSelectors();render();
  }
  async function undoLastImport(){
    if(!isAdmin())return;await ensureImportHistoryLoaded();const record=(state.importHistory||[]).find(r=>r.status==='success'),age=record?Date.now()-new Date(record.createdAt).getTime():Infinity;if(!record||!canRollbackImport(record)||age>30*60*1000)return toast('A última importação não está mais disponível para reversão segura.');
    const affected=Object.entries(record.beforeSnapshot||{}).flatMap(([code,months])=>Object.keys(months||{}).map(id=>({code,id}))),closed=affected.filter(x=>state.squads?.[x.code]?.months?.[x.id]?.isClosed);if(closed.length)return toast('Não é possível reverter: uma competência afetada foi fechada após a importação.');
    if(!await confirmDialog(`Reverter a importação ${record.fileName} de ${monthLabelFromId(record.period)}? O snapshot anterior será restaurado em ${affected.length} competência(s).`,{title:'Desfazer última importação',confirmText:'Reverter importação',tone:'danger',requireText:'REVERTER'}))return;
    try{
      await restoreImportSnapshot(record.beforeSnapshot||{});await markImportReverted(record);await logAuditEvent('month.import_revert',{entityType:'import_batch',entityId:record.batchKey||record.id,squadId:null,description:`Importação ${record.fileName} revertida para o snapshot anterior.`,metadata:{period:record.period,kind:record.kind,scope:record.scope,affectedCompetencies:affected.length}});toast('Última importação revertida com sucesso.');
    }catch(err){console.error(err);toast('Não foi possível reverter completamente a importação. Confira o histórico e o banco antes de tentar novamente.')}
  }

  function importScopeChoices(){
    const codes=Object.keys(state.squads||{}).sort((a,b)=>a.localeCompare(b));
    if(isSuperAdmin())return{codes,allowAll:true};
    const own=state.user?.squadCode&&state.squads?.[state.user.squadCode]?[state.user.squadCode]:[];
    return{codes:own,allowAll:false};
  }
  function populateImportScopeSelect(){
    const el=$('#csvScopeSelect');if(!el)return;
    const {codes,allowAll}=importScopeChoices();
    el.innerHTML=(allowAll?'<option value="all">Todos os Squads</option>':'')+codes.map(code=>`<option value="${escapeHtml(code)}">Squad ${escapeHtml(code)}</option>`).join('');
    const preferred=allowAll?'all':(codes[0]||'');if(preferred)el.value=preferred;el.disabled=!allowAll&&codes.length<=1;
  }
  function selectedImportScope(){
    const {codes,allowAll}=importScopeChoices();let value=String($('#csvScopeSelect')?.value||'').toUpperCase();
    if(value==='ALL'&&allowAll)return{value:'all',scopeAll:true,codes:[...codes]};
    if(!codes.includes(value))value=codes[0]||'';
    return{value,scopeAll:false,codes:value?[value]:[]};
  }
  function importScopeLabel(scope=selectedImportScope()){return scope.scopeAll?'Todos os Squads':scope.codes.length?`Squad ${scope.codes[0]}`:'Nenhum Squad'}
  function updateImportDropzoneFile(source=null){
    const el=$('#importDropzoneFile');if(!el)return;el.textContent=source?.fileName?`${source.fileName} • ${Math.max(1,Math.round(safe(source.fileSize)/1024)).toLocaleString('pt-BR')} KB`:'Nenhum arquivo selecionado';
  }
  function resetImportPreviewUi(){
    state.pendingCsv=null;state.importPreview=null;$('#confirmCsvImportBtn')?.classList.add('hidden');if($('#confirmCsvImportBtn'))$('#confirmCsvImportBtn').disabled=false;$('#csvPeriodBlock')?.classList.add('hidden');$('#importPreviewBlock')?.classList.add('hidden');
  }
  function importUiError(err){
    state.pendingCsv=null;state.importPreview=null;$('#importMessage').textContent='Não foi possível preparar esta importação.';$('#importDetails').textContent=err?.message||String(err);$('#importProgress').style.width='100%';$('#confirmCsvImportBtn').classList.add('hidden');$('#csvPeriodBlock').classList.add('hidden');$('#importPreviewBlock')?.classList.add('hidden');
  }
  function bindImportDropzone(el,{openFirst=false}={}){
    if(!el)return;const choose=()=>{if(openFirst)openImport(null);$('#csvInput')?.click();};
    el.addEventListener('click',choose);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
    for(const type of ['dragenter','dragover'])el.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();el.classList.add('is-dragover');if(e.dataTransfer)e.dataTransfer.dropEffect='copy';});
    for(const type of ['dragleave','dragend'])el.addEventListener(type,e=>{e.preventDefault();e.stopPropagation();el.classList.remove('is-dragover');});
    el.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();el.classList.remove('is-dragover');const file=e.dataTransfer?.files?.[0];if(!file)return;if(openFirst)openImport(null);handleCsvSelection(file);});
  }
  function openImport(expectedKind=null){
    if(!isAdmin())return;
    state.pendingCsv=null;state.pendingCsvSource=null;state.importPreview=null;state.expectedCsvKind=expectedKind;populateImportScopeSelect();updateImportDropzoneFile(null);
    const quality=expectedKind==='quality',service=expectedKind==='service';
    $('#importMessage').textContent=quality?'Selecione o CSV de Produto/Empresa.':service?'Selecione o CSV operacional de atendimentos.':'Selecione ou arraste um CSV. O tipo será identificado automaticamente.';
    $('#importDetails').innerHTML=quality?'<b>CSV Produto/Empresa:</b> Time ou DataAvaliacao, nomeApresentativo, NotaProduto e NotaEmpresa. Cada linha representa uma avaliação. <b>NotaServico é ignorada</b> e cliente não é necessário.':service?'<b>CSV Operacional/Serviço:</b> time, Tecnico, grupoAtendimento, Quantidade e Nota 1 a 5.':'<b>Operacional/Serviço:</b> time, Tecnico, grupoAtendimento, Quantidade e Nota 1 a 5.<br><b>Qualidade Produto/Empresa:</b> Time, nomeApresentativo, NotaProduto e NotaEmpresa. <b>NotaServico é ignorada</b> neste segundo arquivo.';
    $('#importProgress').style.width='0%';$('#chooseFileBtn').disabled=false;resetImportPreviewUi();openModal('importModal');const body=$('#importModalBody');if(body)body.scrollTop=0;
  }
  let confirmDialogResolver=null;
  let confirmDialogRequirement='';
  function syncConfirmDialogRequirement(){const input=$('#confirmDialogPhraseInput'),button=$('#confirmDialogConfirm');if(!button)return;button.disabled=!!confirmDialogRequirement&&!confirmationMatches(input?.value,confirmDialogRequirement);}
  function confirmDialog(message,options={}){
    const modal=$('#confirmDialog');if(!modal)return Promise.resolve(false);
    const title=options.title||'Confirmar ação',confirmText=options.confirmText||'Confirmar',cancelText=options.cancelText||'Cancelar',tone=options.tone||'warning';
    confirmDialogRequirement=String(options.requireText||'').trim();
    $('#confirmDialogTitle').textContent=title;$('#confirmDialogMessage').textContent=message;$('#confirmDialogConfirm').textContent=confirmText;$('#confirmDialogCancel').textContent=cancelText;
    const wrap=$('#confirmDialogPhraseWrap'),input=$('#confirmDialogPhraseInput'),label=$('#confirmDialogPhraseLabel');
    if(wrap)wrap.classList.toggle('hidden',!confirmDialogRequirement);if(input){input.value='';input.placeholder=confirmDialogRequirement||'';}if(label)label.textContent=confirmDialogRequirement?`Digite ${confirmDialogRequirement} para confirmar`:'';
    modal.dataset.tone=tone;const icon=$('#confirmDialogIcon');if(icon)icon.textContent=tone==='danger'?'!':tone==='success'?'✓':'?';syncConfirmDialogRequirement();
    if(confirmDialogResolver){confirmDialogResolver(false);confirmDialogResolver=null}
    openModal('confirmDialog');
    setTimeout(()=>confirmDialogRequirement?$('#confirmDialogPhraseInput')?.focus():$('#confirmDialogConfirm')?.focus(),0);
    return new Promise(resolve=>{confirmDialogResolver=resolve});
  }
  function settleConfirmDialog(value){if(value&&confirmDialogRequirement&&!confirmationMatches($('#confirmDialogPhraseInput')?.value,confirmDialogRequirement))return;const resolve=confirmDialogResolver;confirmDialogResolver=null;confirmDialogRequirement='';closeModal('confirmDialog');if(resolve)resolve(!!value)}
  function syncModalScrollLock(){const locked=!!document.querySelector('.modal.open');document.body.classList.toggle('modal-open',locked);document.documentElement.classList.toggle('modal-open',locked)}
  function openModal(id){const modal=$('#'+id);if(!modal)return;modal.classList.add('open');modal.setAttribute('aria-hidden','false');syncModalScrollLock()}
  function closeModal(id){const modal=$('#'+id);if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');syncModalScrollLock()}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2800)}

  async function preparePendingCsvSource(source){
    if(!source?.text)throw new Error('Arquivo CSV não carregado.');if(!state.userDirectoryLoaded)await loadUserDirectory();
    const scope=selectedImportScope(),{scopeAll,codes}=scope;if(!codes.length)throw new Error('Nenhum Squad disponível para esta importação.');const previousMonth=$('#csvMonthSelect')?.value||'';
    $('#importMessage').textContent=`Preparando ${importScopeLabel(scope)}...`;$('#importProgress').style.width='55%';
    if(source.kind==='quality'){
      const parsed=parseQualityCsv(source.text),mapped=mapQualityCsvRows(parsed.rows,codes),months=[...new Set(mapped.rows.map(r=>r.id))].sort().reverse();
      if(!months.length)throw new Error(scopeAll?'Nenhuma avaliação de Produto/Empresa pôde ser vinculada aos Squads selecionados. Importe primeiro o CSV operacional das competências e confira os nomes dos técnicos.':`Nenhuma avaliação de Produto/Empresa pôde ser vinculada ao Squad ${codes[0]}. Importe primeiro a competência operacional e confira o nome do técnico.`);
      state.pendingCsv={kind:'quality',fileName:source.fileName,fileSize:source.fileSize,checksum:source.checksum,rows:mapped.rows,ignored:parsed.ignored,total:parsed.total,months,unmatched:mapped.unmatched,ambiguous:mapped.ambiguous,scopeAll,codes};
      $('#csvMonthSelect').innerHTML=months.map(id=>{const [y,m]=id.split('-').map(Number);return `<option value="${id}">${MONTHS_PT[m-1]} ${y}</option>`}).join('');if(previousMonth&&months.includes(previousMonth))$('#csvMonthSelect').value=previousMonth;$('#csvPeriodBlock').classList.remove('hidden');$('#confirmCsvImportBtn').classList.remove('hidden');$('#confirmCsvImportBtn').textContent='Importar qualidade';$('#importMessage').textContent=`CSV de Produto/Empresa reconhecido • ${importScopeLabel(scope)}.`;
      if($('#csvPeriodHint'))$('#csvPeriodHint').textContent='Cada linha é uma avaliação individual. A importação consolida NotaProduto e NotaEmpresa por técnico + dia. As demais competências existentes no mesmo CSV também são sincronizadas somente no escopo escolhido acima.';
      const un=mapped.unmatched.length?` • <strong>${mapped.unmatched.length} técnico(s) sem vínculo</strong>: ${escapeHtml(mapped.unmatched.slice(0,6).join(', '))}${mapped.unmatched.length>6?'…':''}`:'',amb=mapped.ambiguous.length?` • <strong>${mapped.ambiguous.length} vínculo(s) ambíguo(s)</strong>`:'';
      const hist=safe(mapped.sourceCounts?.['histórico anterior'])+safe(mapped.sourceCounts?.['histórico posterior']),directory=safe(mapped.sourceCounts?.['cadastro de usuário']);
      $('#importDetails').innerHTML=`<strong>${fmtInt(mapped.rows.length)} avaliações vinculadas</strong> • <strong>${months.length} meses disponíveis</strong>${un}${amb} • ${fmtInt(parsed.ignored)} linha(s) inválida(s)/sem nota de Produto ou Empresa. <span class="muted">Escopo: ${escapeHtml(importScopeLabel(scope))}. Vínculos recuperados pelo histórico: ${fmtInt(hist)} • pelo cadastro: ${fmtInt(directory)}. Técnicos desligados podem permanecer na qualidade mesmo sem linha operacional na competência.</span>`;
    }else{
      const parsed=parseServiceCsv(source.text),aliasBy=serviceTechnicianAliases(codes);if(!codes.some(code=>aliasBy[code]?.size))throw new Error(scopeAll?'Cadastre técnicos nos Squads antes de importar o CSV.':`Cadastre os técnicos do Squad ${codes[0]} em Usuários antes de importar o CSV.`);
      const scopeRows=parsed.rows.filter(r=>codes.includes(r.group)),unmatchedSet=new Set(),rows=[];for(const r of scopeRows){const canonical=aliasBy[r.group]?.get(nameLinkKey(r.name));if(canonical)rows.push({...r,name:canonical});else unmatchedSet.add(`${r.group}: ${r.name}`)}
      const unmatched=[...unmatchedSet].sort(),months=[...new Set(rows.map(r=>r.id))].sort().reverse();if(!months.length)throw new Error(scopeAll?'O CSV não possui registros que correspondam aos técnicos cadastrados nos Squads selecionados. Confira os vínculos em Usuários.':`O CSV não possui registros que correspondam aos técnicos cadastrados do Squad ${codes[0]}. Confira Nome do técnico, Nome completo e Squad do usuário.`);
      state.pendingCsv={kind:'service',fileName:source.fileName,fileSize:source.fileSize,checksum:source.checksum,rows,ignored:parsed.ignored,total:parsed.total,months,unmatched,scopeAll,codes};
      $('#csvMonthSelect').innerHTML=months.map(id=>{const [y,m]=id.split('-').map(Number);return `<option value="${id}">${MONTHS_PT[m-1]} ${y}</option>`}).join('');if(previousMonth&&months.includes(previousMonth))$('#csvMonthSelect').value=previousMonth;$('#csvPeriodBlock').classList.remove('hidden');$('#confirmCsvImportBtn').classList.remove('hidden');$('#confirmCsvImportBtn').textContent='Importar mês';$('#importMessage').textContent=`CSV operacional reconhecido • ${importScopeLabel(scope)}.`;
      if($('#csvPeriodHint'))$('#csvPeriodHint').textContent='A reimportação operacional substitui Serviço/atendimentos do mês, preserva dados financeiros manuais e qualidade Produto/Empresa e sincroniza o detalhamento diário somente no escopo escolhido acima.';
      const unmatchedText=unmatched.length?` • <strong>${unmatched.length} vínculo(s) não encontrado(s) ignorado(s)</strong>: ${escapeHtml(unmatched.slice(0,5).join(', '))}${unmatched.length>5?'…':''}`:'';$('#importDetails').innerHTML=`<strong>${fmtInt(rows.length)} linhas vinculadas</strong> aos técnicos cadastrados • <strong>${months.length} meses disponíveis</strong>${unmatchedText} • ${fmtInt(parsed.ignored)} linhas inválidas/fora dos Squads A, B, D e E. <span class="muted">Escopo: ${escapeHtml(importScopeLabel(scope))}. O vínculo considera Nome do técnico, Nome completo e histórico do Squad.</span>`;
    }
    $('#importProgress').style.width='100%';renderImportPreview();const body=$('#importModalBody');if(body)body.scrollTop=0;
  }
  async function refreshPendingCsvForScope(){
    if(!state.pendingCsvSource){state.pendingCsv=null;state.importPreview=null;$('#csvPeriodBlock')?.classList.add('hidden');$('#importPreviewBlock')?.classList.add('hidden');return}
    $('#confirmCsvImportBtn').disabled=true;try{await preparePendingCsvSource(state.pendingCsvSource)}catch(err){console.error(err);importUiError(err)}finally{$('#confirmCsvImportBtn').disabled=!!state.importPreview?.validation?.blocked}
  }
  async function handleCsvSelection(file){
    if(!isAdmin()||!file)return;openModal('importModal');$('#chooseFileBtn').disabled=true;$('#importMessage').textContent='Lendo CSV...';$('#importProgress').style.width='20%';resetImportPreviewUi();
    try{
      if(!/\.csv$/i.test(String(file.name||'')))throw new Error('Selecione um arquivo no formato CSV.');const text=await file.text(),checksum=importChecksum(text),kind=detectCsvKind(text);$('#importProgress').style.width='40%';
      if(state.expectedCsvKind&&kind!==state.expectedCsvKind)throw new Error(state.expectedCsvKind==='quality'?'Este botão é exclusivo para o CSV de Produto/Empresa. Selecione o arquivo com Time, nomeApresentativo, NotaProduto e NotaEmpresa.':'Este botão é exclusivo para o CSV operacional de atendimentos.');
      state.pendingCsvSource={fileName:file.name,fileSize:file.size,checksum,text,kind};updateImportDropzoneFile(state.pendingCsvSource);await preparePendingCsvSource(state.pendingCsvSource);
    }catch(err){console.error(err);importUiError(err)}finally{$('#chooseFileBtn').disabled=false}
  }
  async function handleCsvFile(e){const file=e.target.files?.[0];try{if(file)await handleCsvSelection(file)}finally{e.target.value=''}}

  async function confirmCsvImport(){
    if(!isAdmin()||!state.pendingCsv)return;const id=$('#csvMonthSelect').value;if(!id)return;const pending=state.pendingCsv,preview=buildImportPreview(pending,id);state.importPreview=preview;renderImportPreview();if(preview?.validation?.blocked)return toast('A importação possui erros críticos. Corrija o arquivo antes de continuar.');
    if(preview?.validation?.requiresConfirmation){const issues=(preview.validation.issues||[]).filter(i=>i.severity==='warning').map(i=>`• ${i.message}`).join('\n');const ok=await confirmDialog(`A prévia encontrou diferenças relevantes:\n\n${issues}\n\nDeseja gravar mesmo assim?`,{title:'Confirmar importação com alertas',confirmText:'Importar mesmo assim',tone:'warning',requireText:'IMPORTAR'});if(!ok)return}
    const btn=$('#confirmCsvImportBtn'),scopeSelect=$('#csvScopeSelect'),monthSelect=$('#csvMonthSelect');btn.disabled=true;btn.textContent='Importando...';if(scopeSelect)scopeSelect.disabled=true;if(monthSelect)monthSelect.disabled=true;const snapshot=captureImportSnapshot(pending,id),[year,month]=id.split('-').map(Number);
    try{
      $('#importProgress').style.width='35%';
      if(pending.kind==='quality'){
        $('#importMessage').textContent='Consolidando Produto e Empresa por técnico e dia...';let importedSquads=0,importedRows=0;const codes=pending.codes.filter(code=>pending.rows.some(r=>r.group===code&&r.id===id));if(!codes.length)throw new Error('Nenhum Squad possui avaliações vinculadas para este mês.');
        for(const code of codes){const squad=state.squads[code],m=squad?.months?.[id];if(!m)continue;if(m.isClosed)throw new Error(`${MONTHS_PT[month-1]} ${year} está fechado no Squad ${code}. Reabra o mês antes de importar.`);const result=applyQualityMonthImport(m,pending.rows.filter(r=>r.group===code&&r.id===id),pending.fileName);importedSquads++;importedRows+=result.sourceRows;if(state.supabase){$('#importMessage').textContent=`Gravando qualidade do Squad ${code}...`;$('#importProgress').style.width=(45+Math.round(importedSquads/Math.max(1,codes.length)*30))+'%';await persistQualityMonth(m,pending.fileName)}}
        $('#importMessage').textContent='Sincronizando Produto/Empresa das demais competências do mesmo CSV...';$('#importProgress').style.width='82%';const historySync=await syncHistoricalQualityFromCsv(pending,id);
        for(const code of codes){const squad=state.squads[code],m=squad?.months?.[id];if(!m)continue;await logAuditEvent('month.import_quality',{entityType:'squad_month',entityId:m.dbId||id,squadId:squad?.dbId||null,description:`Importação de avaliações Produto/Empresa de ${MONTHS_PT[month-1]} ${year} no Squad ${code}.`,metadata:{period:id,fileName:pending.fileName,checksum:pending.checksum,kind:'quality',sourceRows:(pending.rows||[]).filter(r=>r.group===code&&r.id===id).length,ignored:safe(pending.ignored),historicalMonthsPatched:safe(historySync.monthsPatched)}})}
        saveDemoSquads();await recordCompletedImport(pending,id,snapshot,{importedSquads,importedRows,historicalMonthsPatched:safe(historySync.monthsPatched)});render();state.pendingCsv=null;state.importPreview=null;state.expectedCsvKind=null;closeModal('importModal');toast(`${MONTHS_PT[month-1]} ${year}: ${fmtInt(importedRows)} avaliações de Produto/Empresa consolidadas em ${importedSquads} Squad(s).${historySync.monthsPatched?` Histórico de qualidade sincronizado em ${historySync.monthsPatched} competência(s).`:''}`);return;
      }
      $('#importMessage').textContent='Consolidando dados do mês...';let importedSquads=0,importedTechs=0,historySync=null;
      if(pending.scopeAll){
        const candidates=pending.codes.filter(code=>pending.rows.some(r=>r.group===code&&r.id===id));if(!candidates.length)throw new Error('Nenhum Squad possui registros vinculados para este mês.');const closedCodes=candidates.filter(code=>state.squads[code]?.months?.[id]?.isClosed);if(closedCodes.length)throw new Error(`${MONTHS_PT[month-1]} ${year} está fechado no(s) Squad(s) ${closedCodes.join(', ')}. Reabra o mês antes de importar.`);
        for(const code of candidates){const s=state.squads[code],previous=s.months[id],data=buildMonthFromCsv(pending.rows,id,pending.fileName,previous,code);s.months[id]=data;importedSquads++;importedTechs+=data.technicians.length;if(state.supabase){$('#importMessage').textContent=`Gravando Squad ${code}...`;$('#importProgress').style.width=(55+Math.round(importedSquads/Math.max(1,candidates.length)*34))+'%';await persistImportedMonth(data,s)}}historySync=syncHistoricalServiceDailyFromCsv(pending,id);if(historySync.changed.length&&state.supabase){$('#importMessage').textContent='Sincronizando notas diárias das competências anteriores...';await persistHistoricalServiceDailySync(historySync)}for(const code of candidates){const squad=state.squads[code],m=squad?.months?.[id];if(!m)continue;await logAuditEvent('month.import_service',{entityType:'squad_month',entityId:m.dbId||id,squadId:squad?.dbId||null,description:`Importação operacional de ${MONTHS_PT[month-1]} ${year} no Squad ${code}.`,metadata:{period:id,fileName:pending.fileName,checksum:pending.checksum,kind:'service',technicians:(m.technicians||[]).length,sourceRows:(pending.rows||[]).filter(r=>r.group===code&&r.id===id).length,ignored:safe(pending.ignored),historicalMonthsPatched:safe(historySync.monthsPatched)}})}
      }else{
        const targetCode=pending.codes?.[0],s=state.squads?.[targetCode];if(!targetCode||!s)throw new Error('Squad selecionado não está disponível.');const previous=s.months[id];if(previous?.isClosed)throw new Error(`${MONTHS_PT[month-1]} ${year} está fechado no Squad ${targetCode}. Reabra o mês antes de importar.`);const data=buildMonthFromCsv(pending.rows,id,pending.fileName,previous,targetCode);s.months[id]=data;importedSquads=1;importedTechs=data.technicians.length;if(state.supabase){$('#importMessage').textContent=`Gravando Squad ${targetCode}...`;$('#importProgress').style.width='70%';await persistImportedMonth(data,s)}historySync=syncHistoricalServiceDailyFromCsv(pending,id);if(historySync.changed.length&&state.supabase){$('#importMessage').textContent='Sincronizando notas diárias das competências anteriores...';await persistHistoricalServiceDailySync(historySync)}await logAuditEvent('month.import_service',{entityType:'squad_month',entityId:data.dbId||id,squadId:s?.dbId||null,description:`Importação operacional de ${data.monthName} ${data.year} no Squad ${targetCode}.`,metadata:{period:id,fileName:pending.fileName,checksum:pending.checksum,kind:'service',technicians:(data.technicians||[]).length,sourceRows:(pending.rows||[]).filter(r=>r.group===targetCode&&r.id===id).length,ignored:safe(pending.ignored),historicalMonthsPatched:safe(historySync.monthsPatched)}});
      }
      saveDemoSquads();state.financeRankingCache={};if(state.analysisMode==='competence'&&state.analysisPreset!=='custom'){const id=state.analysisCompetenceId||state.currentId,preset=state.analysisPreset,range=competencePresetRange(id,preset,'state');if(range.start&&range.end){state.analysisStartDate=range.start;state.analysisEndDate=range.end;state.analysisCompetenceId=id;}}refreshSelectors();await recordCompletedImport(pending,id,snapshot,{importedSquads,importedTechnicians:importedTechs,historicalMonthsPatched:safe(historySync?.monthsPatched)});render();state.pendingCsv=null;state.importPreview=null;state.expectedCsvKind=null;closeModal('importModal');toast(`${MONTHS_PT[month-1]} ${year}: ${importedSquads} Squad(s) e ${importedTechs} técnico(s) atualizados.${historySync?.monthsPatched?` Histórico diário corrigido em ${historySync.monthsPatched} competência(s).`:''}`);
    }catch(err){
      console.error(err);let rollbackError=null;try{await restoreImportSnapshot(snapshot)}catch(re){rollbackError=re;console.error('Falha ao restaurar snapshot após erro de importação.',re)}$('#importMessage').textContent=rollbackError?'Importação interrompida e a restauração automática precisa de conferência.':'Importação cancelada e estado anterior restaurado.';$('#importDetails').textContent=(err.message||String(err))+(rollbackError?` | Falha na restauração: ${rollbackError.message||rollbackError}`:'')+((state.pendingCsv?.kind==='quality'&&state.supabase)?' Se a tabela de qualidade ainda não existir, execute supabase/migrations/MIGRACAO_V2.27.0.sql no Supabase.':'');$('#importProgress').style.width='100%';
      const failed=normalizeImportHistory({batchKey:makeImportBatchKey(),kind:pending.kind,period:id,fileName:pending.fileName,checksum:pending.checksum,scope:preview?.codes||pending.codes||[],rows:preview?.summary?.rows||0,ignored:safe(pending.ignored),unmatched:(pending.unmatched||[]).length,status:'failed',createdAt:new Date().toISOString(),createdBy:state.user?.fullName||state.user?.email||'',risk:'error',details:{error:err.message||String(err),autoRollback:!rollbackError,rollbackError:rollbackError?.message||null}});await persistImportHistory(failed);
    }finally{btn.disabled=!!state.importPreview?.validation?.blocked;btn.textContent=state.pendingCsv?.kind==='quality'?'Importar qualidade':'Importar mês';if(scopeSelect)scopeSelect.disabled=false;if(monthSelect)monthSelect.disabled=false}
  }

  function detectCsvKind(text){
    const lines=parseCsvRows(String(text||'').replace(/^﻿/,''));if(!lines.length)throw new Error('CSV vazio.');const rawHeaders=lines[0].map(v=>String(v||'').trim()),quality=importEngine.resolveQualityImportColumns(rawHeaders),headers=new Set(rawHeaders.map(normalizeHeader));if(!quality.missing.length)return'quality';if(headers.has('tecnico')&&headers.has('grupoatendimento')&&headers.has('quantidade'))return'service';const found=rawHeaders.filter(Boolean).join(', ')||'nenhum';throw new Error(`Formato de CSV não reconhecido. Para Produto/Empresa, use DataAvaliacao ou Time, nomeApresentativo, NotaProduto e NotaEmpresa. Cabeçalhos encontrados: ${found}.`);
  }
  function csvRating(v){const n=Math.trunc(csvNumber(v));return n>=1&&n<=5?n:null}
  function parseQualityCsv(text){
    const lines=parseCsvRows(String(text||'').replace(/^﻿/,''));if(lines.length<2)throw new Error('CSV de qualidade vazio ou sem linhas de dados.');const rawHeaders=lines[0].map(v=>String(v||'').trim()),resolved=importEngine.resolveQualityImportColumns(rawHeaders);if(resolved.missing.length){const missing=resolved.missing.map(item=>`${item.label} (aceitos: ${item.accepted.join(', ')})`).join('; '),found=rawHeaders.filter(Boolean).join(', ')||'nenhum';throw new Error(`Coluna obrigatória não encontrada no CSV de qualidade: ${missing}. Cabeçalhos encontrados: ${found}.`);}const idx=resolved.indexes,rows=[];let ignored=0;
    for(const cols of lines.slice(1)){const date=parseCsvDate(cols[idx.date]),name=normalizeName(cols[idx.technician]),productNote=csvRating(cols[idx.product]),companyNote=csvRating(cols[idx.company]);if(!date||!name||(!productNote&&!companyNote)){ignored++;continue}const year=date.year,month=date.month,day=date.day;rows.push({id:`${year}-${String(month).padStart(2,'0')}`,year,month,day,name,productNote,companyNote});}
    if(!rows.length)throw new Error('Nenhuma avaliação válida de Produto ou Empresa foi encontrada. Confira a data, o técnico e as notas do arquivo.');return{rows,ignored,total:lines.length-1};
  }
  function qualityUserAliasKeys(name){const key=nameLinkKey(name),keys=new Set([key]);for(const u of state.userDirectory||[]){if(u.role!=='technician')continue;if(samePersonName(u.fullName,name)||samePersonName(u.techName,name)){if(u.techName)keys.add(nameLinkKey(u.techName));if(u.fullName)keys.add(nameLinkKey(u.fullName));}}return keys}
  function monthOrdinal(id){const [y,m]=String(id||'').split('-').map(Number);return safe(y)*12+safe(m)}
  function qualityTechnicianCandidates(row,codes){
    const aliasKeys=qualityUserAliasKeys(row.name),targetOrd=monthOrdinal(row.id),eligible=(codes||[]).filter(code=>!!state.squads?.[code]?.months?.[row.id]);if(!eligible.length)return[];
    const exact=[];for(const code of eligible){const target=state.squads[code].months[row.id];for(const t of target.technicians||[])if(aliasKeys.has(nameLinkKey(t.name)))exact.push({group:code,name:t.name,source:'competência',distance:0});}
    if(exact.length)return [...new Map(exact.map(x=>[`${x.group}|${nameLinkKey(x.name)}`,x])).values()];
    const historical=[];for(const code of eligible){let best=null;for(const [id,m] of Object.entries(state.squads?.[code]?.months||{})){for(const t of m?.technicians||[]){if(!aliasKeys.has(nameLinkKey(t.name)))continue;const ord=monthOrdinal(id),past=ord<=targetOrd,distance=Math.abs(targetOrd-ord),score=distance*2+(past?0:1);if(!best||score<best.score)best={group:code,name:t.name,source:past?'histórico anterior':'histórico posterior',distance,score};}}if(best)historical.push(best);}
    if(historical.length){const min=Math.min(...historical.map(x=>x.score));return historical.filter(x=>x.score===min).map(({score,...x})=>x);}
    const directory=[];for(const u of state.userDirectory||[]){if(u.role!=='technician'||!eligible.includes(u.squadCode))continue;if(aliasKeys.has(nameLinkKey(u.techName))||aliasKeys.has(nameLinkKey(u.fullName)))directory.push({group:u.squadCode,name:u.techName||u.fullName||row.name,source:'cadastro de usuário',distance:999});}
    return [...new Map(directory.map(x=>[`${x.group}|${nameLinkKey(x.name)}`,x])).values()];
  }
  function mapQualityCsvRows(rows,codes){const mapped=[],unmatchedCounts=new Map(),ambiguousCounts=new Map(),sourceCounts={competência:0,'histórico anterior':0,'histórico posterior':0,'cadastro de usuário':0};for(const row of rows||[]){const candidates=qualityTechnicianCandidates(row,codes);if(candidates.length===1){mapped.push({...row,group:candidates[0].group,name:candidates[0].name,linkSource:candidates[0].source});sourceCounts[candidates[0].source]=(sourceCounts[candidates[0].source]||0)+1}else if(!candidates.length)unmatchedCounts.set(row.name,(unmatchedCounts.get(row.name)||0)+1);else ambiguousCounts.set(row.name,(ambiguousCounts.get(row.name)||0)+1)}return{rows:mapped,unmatched:[...unmatchedCounts.keys()].map(titleWords).sort((a,b)=>a.localeCompare(b,'pt-BR')),ambiguous:[...ambiguousCounts.keys()].map(titleWords).sort((a,b)=>a.localeCompare(b,'pt-BR')),sourceCounts}}
  function applyQualityMonthImport(m,rows,fileName){
    const now=new Date().toISOString(),grouped=new Map();for(const row of rows||[]){const key=`${nameLinkKey(row.name)}|${row.day}`,g=grouped.get(key)||{name:row.name,technicianKey:nameLinkKey(row.name),day:row.day,product:{notes5:0,notes4:0,notes3:0,notes2:0,notes1:0},company:{notes5:0,notes4:0,notes3:0,notes2:0,notes1:0}};if(row.productNote)g.product[`notes${row.productNote}`]++;if(row.companyNote)g.company[`notes${row.companyNote}`]++;grouped.set(key,g)}
    const external=[];for(const g of grouped.values())for(const type of ['product','company']){const counts=g[type];if(!qualityNoteTotal(counts))continue;external.push({technicianName:g.name,technicianKey:g.technicianKey,day:g.day,qualityType:type,...counts,sourceFile:fileName,importedAt:now});}
    m.qualityExternal=external.sort((a,b)=>String(a.technicianName).localeCompare(String(b.technicianName),'pt-BR')||safe(a.day)-safe(b.day)||String(a.qualityType).localeCompare(String(b.qualityType)));
    // Mantém a estrutura antiga preenchida somente para técnicos operacionais existentes, sem duplicar na leitura V2.27.
    for(const t of m.technicians||[]){t.qualityDaily=[];for(const q of m.qualityExternal){if(!samePersonName(q.technicianName,t.name))continue;t.qualityDaily.push({day:q.day,qualityType:q.qualityType,notes5:q.notes5,notes4:q.notes4,notes3:q.notes3,notes2:q.notes2,notes1:q.notes1,sourceFile:q.sourceFile,importedAt:q.importedAt});}}
    return{sourceRows:(rows||[]).length,dailyRows:[...grouped.values()].length,externalRows:external.length};
  }
  async function persistQualityMonth(m,fileName){
    if(!state.supabase)return;if(!m?.dbId)throw new Error('Competência operacional sem identificador no banco. Reimporte o CSV operacional antes da qualidade.');
    const {error:de}=await state.supabase.from('quality_person_daily_metrics').delete().eq('squad_month_id',m.dbId);if(de)throw new Error(`Não foi possível gravar a nova estrutura de qualidade. Execute supabase/migrations/MIGRACAO_V2.27.0.sql. ${de.message||''}`.trim());
    const inserts=(m.qualityExternal||[]).map(q=>({squad_month_id:m.dbId,technician_name:q.technicianName,technician_key:q.technicianKey||nameLinkKey(q.technicianName),day:safe(q.day),quality_type:q.qualityType,notes5:safe(q.notes5),notes4:safe(q.notes4),notes3:safe(q.notes3),notes2:safe(q.notes2),notes1:safe(q.notes1),source_file:q.sourceFile||fileName,imported_by:state.user.userId,imported_at:q.importedAt||new Date().toISOString()}));
    for(let i=0;i<inserts.length;i+=500){const {error}=await state.supabase.from('quality_person_daily_metrics').insert(inserts.slice(i,i+500));if(error)throw error}
    // Limpa a tabela V2.26 para evitar dados antigos concorrentes; ela permanece apenas como compatibilidade histórica.
    for(const t of m.technicians||[]){if(!t.dbId)continue;const {error}=await state.supabase.from('quality_daily_metrics').delete().eq('technician_month_id',t.dbId);if(error)console.warn('Não foi possível limpar quality_daily_metrics legado.',error);}
  }

  async function syncHistoricalQualityFromCsv(pending,selectedId){
    const synced=[];let sourceRows=0,externalRows=0;
    for(const code of pending?.codes||[]){
      const squad=state.squads?.[code];if(!squad)continue;
      for(const id of pending?.months||[]){
        if(id===selectedId)continue;
        const mon=squad.months?.[id];if(!mon)continue;
        const rows=(pending.rows||[]).filter(r=>r.group===code&&r.id===id);if(!rows.length)continue;
        const result=applyQualityMonthImport(mon,rows,pending.fileName);sourceRows+=result.sourceRows;externalRows+=result.externalRows;synced.push({code,id,rows:result.sourceRows});
        if(state.supabase)await persistQualityMonth(mon,pending.fileName);
      }
    }
    return{synced,monthsPatched:new Set(synced.map(x=>x.id)).size,squadsPatched:new Set(synced.map(x=>x.code)).size,sourceRows,externalRows};
  }

  function serviceCsvMonthTechMap(rows,id,squadCode){
    const map=new Map();for(const r of rows||[]){if(r.id!==id||r.group!==squadCode)continue;const key=nameLinkKey(r.name),g=map.get(key)||{name:r.name,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,daily:new Map()};g.att+=safe(r.att);for(const n of [5,4,3,2,1])g[`notes${n}`]+=safe(r[`notes${n}`]);const d=g.daily.get(safe(r.day))||{day:safe(r.day),notes5:0,notes4:0,notes3:0,notes2:0,notes1:0};for(const n of [5,4,3,2,1])d[`notes${n}`]+=safe(r[`notes${n}`]);g.daily.set(safe(r.day),d);map.set(key,g);}return map;
  }
  function syncHistoricalServiceDailyFromCsv(pending,selectedId){
    const changed=[],monthKeys=new Set();let techsPatched=0,daysPatched=0,monthlyMismatches=0,missingTechnicians=0;
    for(const code of pending?.codes||[]){
      const squad=state.squads?.[code];if(!squad)continue;
      for(const id of pending.months||[]){
        if(id===selectedId)continue;
        const mon=squad.months?.[id];if(!mon)continue;
        const source=serviceCsvMonthTechMap(pending.rows,id,code);if(!source.size)continue;
        for(const t of mon.technicians||[]){
          const src=source.get(nameLinkKey(t.name));if(!src){missingTechnicians++;continue;}
          if([5,4,3,2,1].some(n=>safe(src[`notes${n}`])!==safe(t[`notes${n}`])))monthlyMismatches++;
          let changedTech=false;
          for(const d of t.daily||[]){
            const sday=src.daily.get(safe(d.day));let changedDay=false;
            for(const n of [5,4,3,2,1]){
              const next=safe(sday?.[`notes${n}`]);
              if(safe(d[`notes${n}`])!==next){d[`notes${n}`]=next;changedTech=true;changedDay=true;}
            }
            if(changedDay)daysPatched++;
          }
          if(!changedTech)continue;
          techsPatched++;monthKeys.add(`${code}|${id}`);changed.push({code,id,month:mon,tech:t});
        }
      }
    }
    return{changed,monthsPatched:monthKeys.size,techsPatched,daysPatched,monthlyMismatches,missingTechnicians};
  }
  async function persistHistoricalServiceDailySync(sync){
    if(!state.supabase||!sync?.changed?.length)return;let done=0;for(const item of sync.changed){const t=item.tech;if(!t?.dbId)continue;const payload=(t.daily||[]).map(d=>({technician_month_id:t.dbId,day:safe(d.day),att:safe(d.att),notes5:safe(d.notes5),notes4:safe(d.notes4),notes3:safe(d.notes3),notes2:safe(d.notes2),notes1:safe(d.notes1),off:!!d.off}));for(let i=0;i<payload.length;i+=500){const {error}=await state.supabase.from('daily_metrics').upsert(payload.slice(i,i+500),{onConflict:'technician_month_id,day'});if(error)throw error}done++;if($('#importProgress'))$('#importProgress').style.width=(92+Math.round(done/Math.max(1,sync.changed.length)*7))+'%';}
  }

  function serviceTechnicianAliases(codes){
    const by={};for(const code of codes||[])by[code]=new Map();
    for(const u of state.userDirectory||[]){
      if(u.role!=='technician'||!u.squadCode||!by[u.squadCode])continue;
      const canonical=normalizeName(u.techName||u.fullName);if(!canonical)continue;
      for(const alias of [u.techName,u.fullName]){const key=nameLinkKey(alias);if(key&&!by[u.squadCode].has(key))by[u.squadCode].set(key,canonical);}
      const ownKey=nameLinkKey(canonical);if(ownKey&&!by[u.squadCode].has(ownKey))by[u.squadCode].set(ownKey,canonical);
    }
    for(const code of codes||[]){const squad=state.squads?.[code];for(const monthData of Object.values(squad?.months||{}))for(const tech of monthData?.technicians||[]){const key=nameLinkKey(tech?.name);if(key&&!by[code].has(key))by[code].set(key,tech.name);}}
    return by;
  }

  function parseServiceCsv(text){
    const lines=parseCsvRows(String(text||'').replace(/^﻿/,''));if(lines.length<2)throw new Error('CSV vazio ou sem linhas de dados.');
    const headers=lines[0].map(normalizeHeader),idx={};headers.forEach((h,i)=>idx[h]=i);
    const required=['time','tecnico','grupoatendimento','quantidade'];for(const h of required)if(idx[h]==null)throw new Error(`Coluna obrigatória não encontrada: ${h}.`);
    const noteIndex=n=>idx[`nota${n}`];const rows=[];let ignored=0;
    for(const cols of lines.slice(1)){
      const date=parseCsvDate(cols[idx.time]),name=normalizeName(cols[idx.tecnico]),group=normalizeName(cols[idx.grupoatendimento]);
      if(!date||!name||!['A','B','D','E'].includes(group)){ignored++;continue}
      const year=date.year,month=date.month,day=date.day;rows.push({id:`${year}-${String(month).padStart(2,'0')}`,year,month,day,name,group,att:csvNumber(cols[idx.quantidade]),notes5:csvNumber(cols[noteIndex(5)]),notes4:csvNumber(cols[noteIndex(4)]),notes3:csvNumber(cols[noteIndex(3)]),notes2:csvNumber(cols[noteIndex(2)]),notes1:csvNumber(cols[noteIndex(1)])});
    }
    if(!rows.length)throw new Error('Nenhuma linha válida foi encontrada para os Squads A, B, D ou E.');return{rows,ignored,total:lines.length-1};
  }

  function isOperationalTechnicianRow(t){
    if(!t?.name)return false;
    const key=normalizeName(t.name);
    if(/^(MEDIA|MÉDIA) GRUPO$|^TOTAL GRUPO$|^RESULTADO EQUIPE$|^TOTAL$|^MEDIA$|^MÉDIA$/.test(key))return false;
    return safe(t.att)>0||safe(t.totalEval)>0||safe(t.notes5)+safe(t.notes4)+safe(t.notes3)+safe(t.notes2)+safe(t.notes1)>0;
  }

  function buildMonthFromCsv(rows,id,fileName,previous,squadCode=state.squadCode){
    const selected=rows.filter(r=>r.id===id&&r.group===squadCode);if(!selected.length)throw new Error('Nenhum registro encontrado para o mês selecionado.');
    const [year,month]=id.split('-').map(Number),byTech=new Map();let latest=1;
    for(const r of selected){latest=Math.max(latest,r.day);let t=byTech.get(r.name);if(!t){t={name:r.name,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,dailyMap:new Map()};byTech.set(r.name,t)}t.att+=r.att;t.notes5+=r.notes5;t.notes4+=r.notes4;t.notes3+=r.notes3;t.notes2+=r.notes2;t.notes1+=r.notes1;let d=t.dailyMap.get(r.day)||{day:r.day,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,off:false};d.att+=r.att;d.notes5+=r.notes5;d.notes4+=r.notes4;d.notes3+=r.notes3;d.notes2+=r.notes2;d.notes1+=r.notes1;t.dailyMap.set(r.day,d)}
    const previousTechs=previous?.technicians||[],prevBy=new Map(previousTechs.map(t=>[nameLinkKey(t.name),t])),daysInMonth=new Date(year,month,0).getDate(),presentKeys=new Set([...byTech.keys()].map(nameLinkKey));
    const technicians=[...byTech.values()].map(raw=>{const prev=prevBy.get(nameLinkKey(raw.name))||{};const daily=[];for(let d=1;d<=daysInMonth;d++)daily.push(raw.dailyMap.get(d)||{day:d,att:0,notes5:0,notes4:0,notes3:0,notes2:0,notes1:0,off:new Date(year,month-1,d).getDay()===0});return{dbId:prev.dbId||null,userId:prev.userId||null,name:raw.name,att:raw.att,notes5:raw.notes5,notes4:raw.notes4,notes3:raw.notes3,notes2:raw.notes2,notes1:raw.notes1,totalEval:0,avg:0,evalPct:0,status:prev.status||'',goalsHit:safe(prev.goalsHit),points:safe(prev.points),rank:prev.rank||null,discount:safe(prev.discount),pointBonus:safe(prev.pointBonus),goalAtt:safe(prev.goalAtt),goalEval:safe(prev.goalEval),financeManualBonus:safe(prev.financeManualBonus),salesCommission:safe(prev.salesCommission),vacation:!!prev.vacation,waiveBelowDiscount:!!prev.waiveBelowDiscount,excludeFromGroupCount:!!prev.excludeFromGroupCount,evaluationExcludedAtt:safe(prev.evaluationExcludedAtt),eligibleAtt:0,financeData:prev.financeData?clone(prev.financeData):{},qualityDaily:prev.qualityDaily?clone(prev.qualityDaily):[],daily}});

    // V2.20.4: a média da competência deve representar todos os técnicos que efetivamente
    // tiveram produção naquele mês. Se um técnico já estava gravado na competência e deixa
    // de aparecer em uma extração posterior (ex.: inativação/migração), preservamos o último
    // consolidado daquele mês em vez de removê-lo. Assim B11/I11/J11/K11 não mudam artificialmente.
    for(const prev of previousTechs){
      const key=nameLinkKey(prev.name);if(presentKeys.has(key)||!isOperationalTechnicianRow(prev))continue;
      const preserved=clone(prev);preserved.daily=(prev.daily||[]).map(d=>({...d}));technicians.push(preserved);
      latest=Math.max(latest,...(preserved.daily||[]).filter(d=>safe(d.att)>0||safe(d.notes5)>0).map(d=>safe(d.day)),1);
    }
    technicians.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    const data={id,month,monthName:MONTHS_PT[month-1],year,sourceFile:fileName,latestDay:latest,importedAt:new Date().toISOString(),teamResult:previous?.teamResult||'',redistributed:safe(previous?.redistributed),settings:previous?.settings?{...previous.settings}:undefined,scoreSettings:previous?.scoreSettings?{...previous.scoreSettings}:{},financeSettings:previous?.financeSettings?clone(previous.financeSettings):clone(DEFAULT_FINANCE_SETTINGS),financeMonthData:previous?.financeMonthData?clone(previous.financeMonthData):{},financeModel:previous?.financeModel||'squad',financeCompare:previous?.financeCompare!==false,financeTechCompare:previous?.financeTechCompare===true,financeIndividualCap:Number.isFinite(Number(previous?.financeIndividualCap))?safe(previous.financeIndividualCap):7000,financeComparison:previous?.financeComparison?clone(previous.financeComparison):{},isClosed:!!previous?.isClosed,closedAt:previous?.closedAt||null,closedBy:previous?.closedBy||null,closedSnapshot:previous?.closedSnapshot?clone(previous.closedSnapshot):{},qualityExternal:previous?.qualityExternal?clone(previous.qualityExternal):[],technicians};recalculateMonth(data);return data;
  }

  function normalizeHeader(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
  function csvNumber(v){if(v==null||String(v).trim()==='')return 0;let s=String(v).trim().replace(/\s/g,'');if(/^[-+]?\d{1,3}(\.\d{3})+,\d+$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^[-+]?\d+,\d+$/.test(s))s=s.replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0}
  function parseCsvDate(v){const raw=String(v||'').trim();let m=raw.match(/^(\d{4})-(\d{2})-(\d{2})/),year,month,day;if(m){year=Number(m[1]);month=Number(m[2]);day=Number(m[3]);}else{m=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);if(!m)return null;day=Number(m[1]);month=Number(m[2]);year=Number(m[3]);}if(month<1||month>12||day<1||day>31)return null;return{year,month,day}}
  function cleanNameWhitespace(s){
    return String(s||'')
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g,'')
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g,' ')
      .trim()
      .replace(/\s+/g,' ');
  }
  function normalizeName(s){return cleanNameWhitespace(s).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function nameLinkKey(s){return normalizeName(s).replace(/\s+/g,'')}
  function samePersonName(a,b){return nameLinkKey(a)===nameLinkKey(b)}

  function audioPrefsKey(){const who=state.user?.userId||state.user?.email||'browser';return `softenPerformanceAudioV1:${who}`}
  function loadAudioPrefs(){try{return JSON.parse(localStorage.getItem(audioPrefsKey())||'{}')||{}}catch(e){return {}}}
  function saveAudioPrefs(patch){const next={...loadAudioPrefs(),...patch};try{localStorage.setItem(audioPrefsKey(),JSON.stringify(next))}catch(e){}return next}
  function sanitizeThemeAudio(v){if(!v)return null;const s=String(v).trim();return /^(data:audio\/(mpeg|mp3|ogg|wav|x-wav|mp4|m4a|aac);base64,|https?:\/\/|assets\/)/i.test(s)?s:null}
  function themeAudioConfig(theme=state.theme){const t=theme||DEFAULT_THEME,hasTrack=Object.prototype.hasOwnProperty.call(t,'soundtrack');return{src:sanitizeThemeAudio(hasTrack?t.soundtrack:DEFAULT_SOUNDTRACK),name:t.soundtrackName||DEFAULT_SOUNDTRACK_NAME,volume:clamp(Number(t.soundtrackVolume??.24),0,1)}}
  function initializeThemeAudio(){
    applySoundtrack(state.theme,{preservePlayback:false});
    const cfg=themeAudioConfig(),prefs=loadAudioPrefs();
    if(!cfg.src)return;
    if(prefs.chosen!==true){showSoundWelcome();return;}
    if(prefs.enabled!==false){state.audio.pendingResume=true;syncSoundPlayerUi();armSoundResumeOnGesture();}
  }
  function showSoundWelcome(){const cfg=themeAudioConfig();if(!cfg.src)return;const el=$('#soundWelcome');if(!el)return;$('#soundWelcomeTrackName').textContent=cfg.name;el.classList.remove('hidden')}
  function hideSoundWelcome(){const el=$('#soundWelcome');if(el)el.classList.add('hidden')}
  async function chooseSoundWelcome(withSound){saveAudioPrefs({chosen:true,enabled:!!withSound});hideSoundWelcome();if(withSound){await playThemeAudio(true)}else{pauseThemeAudio();syncSoundPlayerUi()}}
  function armSoundResumeOnGesture(){
    if(!state.audio.pendingResume)return;
    const resume=async e=>{if(e?.target?.closest?.('#soundPlayer,#soundWelcome,#themeModal'))return;document.removeEventListener('pointerdown',resume,true);document.removeEventListener('keydown',resume,true);if(loadAudioPrefs().enabled!==false)await playThemeAudio(false)};
    document.addEventListener('pointerdown',resume,true);document.addEventListener('keydown',resume,true);
  }
  function applySoundtrack(theme,{preservePlayback=true}={}){
    const audio=$('#themeAudio'),player=$('#soundPlayer');if(!audio||!player)return;
    if(state.audio.previewing){state.audio.previewing=false;state.audio.previewBefore=null;if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').textContent='▶ Ouvir trilha';}
    const cfg=themeAudioConfig(theme),wasPlaying=!audio.paused&&!!audio.src;
    player.classList.toggle('hidden',!cfg.src);
    if(!cfg.src){pauseThemeAudio();audio.removeAttribute('src');audio.load();state.audio.source=null;syncSoundPlayerUi();return;}
    if(state.audio.source!==cfg.src){audio.pause();audio.src=cfg.src;audio.load();state.audio.source=cfg.src;}
    const prefs=loadAudioPrefs();audio.volume=clamp(prefs.volume!=null?Number(prefs.volume):cfg.volume,0,1);audio.muted=!!prefs.muted;
    if($('#soundVolume'))$('#soundVolume').value=Math.round(audio.volume*100);
    if(preservePlayback&&wasPlaying&&prefs.enabled!==false)playThemeAudio(false);else syncSoundPlayerUi();
  }
  function preferredAudioVolume(){const prefs=loadAudioPrefs(),cfg=themeAudioConfig();return clamp(prefs.volume!=null?Number(prefs.volume):cfg.volume,0,1)}
  function cancelAudioFade(){if(state.audio.fadeTimer){clearInterval(state.audio.fadeTimer);state.audio.fadeTimer=null}}
  function fadeAudioTo(target,duration=2200){const audio=$('#themeAudio');if(!audio)return;cancelAudioFade();const from=safe(audio.volume),to=clamp(target,0,1),started=performance.now();state.audio.fadeTimer=setInterval(()=>{const pct=Math.min(1,(performance.now()-started)/duration),eased=1-Math.pow(1-pct,3);audio.volume=from+(to-from)*eased;if(pct>=1)cancelAudioFade()},45)}
  async function playThemeAudio(userGesture=false){
    const audio=$('#themeAudio'),cfg=themeAudioConfig();if(!audio||!cfg.src)return;
    if(state.audio.source!==cfg.src)applySoundtrack(state.theme,{preservePlayback:false});
    const targetVolume=preferredAudioVolume();cancelAudioFade();audio.volume=0;
    try{await audio.play();state.audio.playing=true;state.audio.pendingResume=false;saveAudioPrefs({chosen:true,enabled:true});if(!audio.muted)fadeAudioTo(targetVolume,2400);else audio.volume=targetVolume;syncSoundPlayerUi();}
    catch(err){audio.volume=targetVolume;state.audio.playing=false;state.audio.pendingResume=true;syncSoundPlayerUi();if(userGesture)toast('O navegador bloqueou o áudio. Clique novamente em reproduzir.');}
  }
  function pauseThemeAudio(){const audio=$('#themeAudio');cancelAudioFade();if(audio)audio.pause();state.audio.playing=false;state.audio.pendingResume=false;syncSoundPlayerUi()}
  function stopThemeAudio(){const audio=$('#themeAudio');cancelAudioFade();if(audio){audio.pause();try{audio.currentTime=0}catch(e){}}state.audio.playing=false;state.audio.pendingResume=false;hideSoundWelcome();syncSoundPlayerUi()}
  async function toggleSoundPlayback(){const audio=$('#themeAudio');if(!audio?.src)return;if(audio.paused){await playThemeAudio(true)}else{pauseThemeAudio();saveAudioPrefs({enabled:false})}}
  function toggleSoundMute(){const audio=$('#themeAudio');if(!audio)return;audio.muted=!audio.muted;saveAudioPrefs({muted:audio.muted});syncSoundPlayerUi()}
  function handleSoundVolume(e){const audio=$('#themeAudio');if(!audio)return;cancelAudioFade();audio.volume=clamp(safe(e.target.value)/100,0,1);if(audio.volume>0&&audio.muted)audio.muted=false;saveAudioPrefs({volume:audio.volume,muted:audio.muted});syncSoundPlayerUi()}
  function syncSoundPlayerUi(){
    const audio=$('#themeAudio'),cfg=themeAudioConfig();if($('#soundPlayerName'))$('#soundPlayerName').textContent=cfg.name||'Trilha do tema';if($('#soundWelcomeTrackName'))$('#soundWelcomeTrackName').textContent=cfg.name||'Trilha do tema';
    const playing=!!audio&&!!audio.src&&!audio.paused;state.audio.playing=playing;if($('#soundToggleBtn')){$('#soundToggleBtn').textContent=playing?'❚❚':'▶';$('#soundToggleBtn').setAttribute('aria-label',playing?'Pausar trilha':'Reproduzir trilha')}
    if($('#soundMuteBtn')){$('#soundMuteBtn').textContent=audio?.muted?'🔇':'🔊';$('#soundMuteBtn').setAttribute('aria-label',audio?.muted?'Ativar som':'Silenciar trilha')}
    if($('#soundPlayerStatus'))$('#soundPlayerStatus').textContent=playing?(audio?.muted?'Reproduzindo • silenciado':'Reproduzindo em ambiente'):state.audio.pendingResume?'Clique no painel para iniciar':'Trilha pausada';
  }
  function handleSoundtrackFile(e){
    if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;
    const ok=/^audio\/(mpeg|mp3|ogg|wav|x-wav|mp4|m4a|aac)$/i.test(f.type||'')||/\.(mp3|ogg|wav|m4a|aac)$/i.test(f.name||'');if(!ok){toast('Use MP3, OGG, WAV, M4A ou AAC.');e.target.value='';return}
    if(f.size>3*1024*1024){toast('Use uma trilha de até 3 MB para manter o tema leve.');e.target.value='';return}
    const reader=new FileReader();reader.onload=()=>{state.theme.soundtrack=reader.result;state.theme.soundtrackName=(f.name||DEFAULT_SOUNDTRACK_NAME).replace(/\.[^.]+$/,'');state.theme.soundtrackVolume=state.theme.soundtrackVolume??.24;state.theme.preset='custom';markThemeEditorDirty();applySoundtrack(state.theme,{preservePlayback:false});if($('#soundtrackNameInput'))$('#soundtrackNameInput').value=state.theme.soundtrackName;toast('Trilha do tema atualizada.')};reader.readAsDataURL(f);e.target.value='';
  }
  async function previewThemeSoundtrack(){
    const cfg=themeAudioConfig();if(!cfg.src){toast('Nenhuma trilha configurada neste tema.');return}
    const audio=$('#themeAudio');if(!audio)return;
    if(state.audio.previewing){cancelAudioFade();audio.pause();const before=state.audio.previewBefore||{};audio.volume=before.volume??preferredAudioVolume();audio.muted=!!before.muted;try{audio.currentTime=before.currentTime??0}catch(e){}state.audio.previewing=false;state.audio.previewBefore=null;if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').textContent='▶ Ouvir trilha';if(before.wasPlaying)await playThemeAudio(true);else syncSoundPlayerUi();return}
    state.audio.previewBefore={volume:audio.volume,muted:audio.muted,wasPlaying:!audio.paused,currentTime:safe(audio.currentTime)};state.audio.previewing=true;cancelAudioFade();audio.pause();try{audio.currentTime=0}catch(e){}audio.volume=0;audio.muted=false;try{await audio.play();fadeAudioTo(cfg.volume,1500);if($('#previewSoundtrackBtn'))$('#previewSoundtrackBtn').textContent='❚❚ Pausar prévia';syncSoundPlayerUi()}catch(e){state.audio.previewing=false;state.audio.previewBefore=null;audio.volume=preferredAudioVolume();toast('Clique novamente para permitir a reprodução do áudio.')}
  }
  function resetSoundtrack(){if(!isAdmin())return;state.theme.soundtrack=DEFAULT_SOUNDTRACK;state.theme.soundtrackName=DEFAULT_SOUNDTRACK_NAME;state.theme.soundtrackVolume=.24;state.theme.preset='custom';markThemeEditorDirty();applyTheme(state.theme,{remember:false});toast('Trilha original aplicada na prévia.')}
  function removeSoundtrack(){if(!isAdmin())return;state.theme.soundtrack=null;state.theme.soundtrackName='';state.theme.preset='custom';markThemeEditorDirty();applyTheme(state.theme,{remember:false});toast('Trilha removida da prévia.')}

  function themeColorSubset(source={}){
    const out={};
    ['accent','secondary','bg','bg2','panel','panel2','text','muted','border','success','danger','warn','shadow'].forEach(k=>{if(source?.[k]!=null&&source[k]!=='')out[k]=source[k]});
    return out;
  }
  function isLightSurfaceColor(value){
    const s=String(value||'').trim().toLowerCase();let r,g,b;
    if(/^#[0-9a-f]{3}$/.test(s)){r=parseInt(s[1]+s[1],16);g=parseInt(s[2]+s[2],16);b=parseInt(s[3]+s[3],16)}
    else if(/^#[0-9a-f]{6}$/.test(s)){r=parseInt(s.slice(1,3),16);g=parseInt(s.slice(3,5),16);b=parseInt(s.slice(5,7),16)}
    else{const m=s.match(/^rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/);if(!m)return false;r=+m[1];g=+m[2];b=+m[3]}
    return (r*.2126+g*.7152+b*.0722)>165;
  }
  function deriveLightPalette(dark={}){return{...DEFAULT_LIGHT_COLORS,accent:dark.accent||DEFAULT_LIGHT_COLORS.accent,secondary:dark.secondary||DEFAULT_LIGHT_COLORS.secondary}}
  function syncLegacyThemeColors(t){const d=t.colors?.dark||DEFAULT_DARK_COLORS;['accent','secondary','bg','bg2','panel','text'].forEach(k=>t[k]=d[k]);t.panel2=d.panel2;t.muted=d.muted;t.border=d.border;return t}
  function normalizeThemePayload(theme){
    const t=clone(theme||DEFAULT_THEME);
    t.fontFamily=normalizeSystemFont(t.fontFamily);
    if(t.preset==='vermithor'||(!t.preset&&(!t.campaignTitle||t.campaignTitle==='Dragão Vermithor'))){if(!t.name||t.name==='Vermithor')t.name='Casa do Dragão';if(!t.campaignTitle||t.campaignTitle==='Dragão Vermithor')t.campaignTitle='Casa do Dragão';if(!t.campaignTagline||t.campaignTagline==='Transforme números em conquista.')t.campaignTagline='Unifique os squads, mantenha o fogo das metas e avance o reino dos resultados.';}
    if(!t.favicon)t.favicon=DEFAULT_FAVICON;if(!Object.prototype.hasOwnProperty.call(t,'soundtrack'))t.soundtrack=DEFAULT_SOUNDTRACK;if(!t.soundtrackName&&t.soundtrack)t.soundtrackName=DEFAULT_SOUNDTRACK_NAME;if(t.soundtrackVolume==null)t.soundtrackVolume=.24;
    const flat=themeColorSubset(t),rawDark=themeColorSubset(t.colors?.dark||{}),rawLight=themeColorSubset(t.colors?.light||{}),hasDual=Object.keys(rawDark).length||Object.keys(rawLight).length;
    let dark,light;
    if(hasDual){
      dark={...DEFAULT_DARK_COLORS,...rawDark};
      if(!Object.keys(rawDark).length){dark={...DEFAULT_DARK_COLORS,accent:rawLight.accent||flat.accent||DEFAULT_DARK_COLORS.accent,secondary:rawLight.secondary||flat.secondary||DEFAULT_DARK_COLORS.secondary}}
      light={...deriveLightPalette(dark),...rawLight};
    }else if(isLightSurfaceColor(flat.bg)){
      light={...DEFAULT_LIGHT_COLORS,...flat};
      dark={...DEFAULT_DARK_COLORS,accent:flat.accent||DEFAULT_DARK_COLORS.accent,secondary:flat.secondary||DEFAULT_DARK_COLORS.secondary};
    }else{
      dark={...DEFAULT_DARK_COLORS,...flat};
      light=deriveLightPalette(dark);
    }
    t.colors={dark,light};
    return syncLegacyThemeColors(t);
  }
  function themePalette(theme=state.theme,mode=state.colorMode){const t=theme?.colors?theme:normalizeThemePayload(theme||DEFAULT_THEME);return t.colors?.[mode]||t.colors?.dark||DEFAULT_DARK_COLORS}
  function updateThemeMetaColor(palette=themePalette()){const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',palette.bg||'#080b12')}
  function syncColorModeUi(){
    const mode=state.colorMode==='light'?'light':'dark',next=mode==='light'?'escuro':'claro';
    document.documentElement.dataset.colorMode=mode;document.documentElement.style.colorScheme=mode;
    $$('[data-color-mode-toggle]').forEach(btn=>{btn.dataset.mode=mode;btn.setAttribute('aria-label',`Ativar modo ${next}`);btn.setAttribute('title',`Ativar modo ${next}`);btn.setAttribute('aria-pressed',mode==='light'?'true':'false')});
    $$('[data-theme-edit-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.themeEditMode===mode));
    if($('#themePaletteModeLabel'))$('#themePaletteModeLabel').textContent=mode==='light'?'Modo claro':'Modo escuro';
  }
  function applyThemePalette(theme=state.theme){
    const t=normalizeThemePayload(theme||DEFAULT_THEME),p=themePalette(t,state.colorMode),r=document.documentElement.style;
    const vars={accent:p.accent,accent2:p.secondary,bg:p.bg,bg2:p.bg2,panel:p.panel,panel2:p.panel2,text:p.text,muted:p.muted,border:p.border,success:p.success,danger:p.danger,warn:p.warn,shadow:p.shadow};
    Object.entries(vars).forEach(([k,v])=>{if(v!=null)r.setProperty(`--${k}`,v)});
    updateThemeMetaColor(p);syncColorModeUi();
    if($('#accentColor'))$('#accentColor').value=p.accent||'#f0a33a';if($('#secondaryColor'))$('#secondaryColor').value=p.secondary||'#ef5a29';if($('#accentColorText'))$('#accentColorText').value=String(p.accent||'#f0a33a').toUpperCase();if($('#secondaryColorText'))$('#secondaryColorText').value=String(p.secondary||'#ef5a29').toUpperCase();
    return t;
  }
  function applyColorMode(mode,{persist=true,reapplyTheme=true}={}){
    const next=mode==='light'?'light':'dark';state.colorMode=next;
    if(persist){try{localStorage.setItem(COLOR_MODE_KEY,next)}catch(e){}}
    if(reapplyTheme)state.theme=applyThemePalette(state.theme);else syncColorModeUi();
  }
  function toggleColorMode(){applyColorMode(state.colorMode==='light'?'dark':'light',{persist:true,reapplyTheme:true})}
  function bindSystemColorMode(){
    if(!window.matchMedia)return;const mq=window.matchMedia('(prefers-color-scheme: light)');
    const onChange=e=>{if(!hasStoredColorMode())applyColorMode(e.matches?'light':'dark',{persist:false,reapplyTheme:true})};
    if(mq.addEventListener)mq.addEventListener('change',onChange);else if(mq.addListener)mq.addListener(onChange);
  }
  function setThemePaletteColor(key,value){
    state.theme=normalizeThemePayload(state.theme);const mode=state.colorMode==='light'?'light':'dark';state.theme.colors[mode][key]=value;if(mode==='dark')syncLegacyThemeColors(state.theme);applyThemePalette(state.theme);
  }
  function setThemeEditStatus(message,pending=true){const el=$('#themeEditStatus');if(!el)return;el.textContent=message;el.classList.toggle('pending',!!pending);el.classList.remove('saved')}
  function markThemeEditorDirty(message='Alterações em pré-visualização. Clique em Salvar tema para confirmar.'){state.themeEditorDirty=true;setThemeEditStatus(message,true)}
  function syncThemeColorText(){const p=themePalette(state.theme,state.colorMode);if($('#accentColorText'))$('#accentColorText').value=String(p.accent||'#f0a33a').toUpperCase();if($('#secondaryColorText'))$('#secondaryColorText').value=String(p.secondary||'#ef5a29').toUpperCase();}
  function beginThemeEditor(){if(!canEditAppearance())return toast('Selecione um Squad específico ou use Todos os Squads como Administrador.');state.themeEditorSnapshot=clone(normalizeThemePayload(state.theme));state.themeEditorDirty=false;applyTheme(state.theme,{remember:false});syncThemeColorText();if($('#backgroundFileName'))$('#backgroundFileName').textContent=state.theme.background?'Fundo atual carregado':'Sem fundo personalizado';setThemeEditStatus('Nenhuma alteração pendente.',false);openModal('themeModal')}
  function cancelThemeEditor(){const snapshot=state.themeEditorSnapshot;if(snapshot){state.theme=normalizeThemePayload(snapshot);applyTheme(state.theme,{remember:false});syncChartPreferencePreview()}state.themeEditorSnapshot=null;state.themeEditorDirty=false;if($('#backgroundFile'))$('#backgroundFile').value='';closeModal('themeModal');toast('Alterações do tema descartadas.')}
  function saveThemeEditor(){if(!canEditAppearance())return toast('Você não possui permissão para salvar o tema.');state.theme=normalizeThemePayload({...state.theme,campaignTitle:$('#campaignNameInput')?.value?.trim()||state.theme.campaignTitle,name:$('#campaignNameInput')?.value?.trim()||state.theme.name||'Personalizado',campaignTagline:$('#campaignTaglineInput')?.value?.trim()||'',preset:'custom'});saveTheme();applyTheme(state.theme,{remember:true});state.themeEditorSnapshot=clone(state.theme);state.themeEditorDirty=false;setThemeEditStatus('Tema salvo.',false);closeModal('themeModal');toast(`Tema salvo em ${appearanceScopeLabel()}.`)}
  function applyThemeHexInput(key,input){let value=String(input?.value||'').trim();if(!value.startsWith('#'))value='#'+value;if(!/^#[0-9a-f]{6}$/i.test(value))return setThemeEditStatus('Informe uma cor hexadecimal válida, como #F0A33A.',true);input.value=value.toUpperCase();setThemePaletteColor(key,value);state.theme.name='Personalizado';state.theme.preset='custom';syncThemeColorText();markThemeEditorDirty()}

  function applyPreset(name){
    if(!isAdmin())return;
    const presets={
      vermithor:{soundtrack:'assets/casa-do-dragao-ambient.mp3',soundtrackName:'Fogo & Conquista',soundtrackVolume:.24,favicon:'assets/favicon-dragon.png',name:'Casa do Dragão',campaignTitle:'Casa do Dragão',campaignTagline:'Unifique os squads, mantenha o fogo das metas e avance o reino dos resultados.',preset:'vermithor',colors:{dark:clone(DEFAULT_DARK_COLORS),light:clone(DEFAULT_LIGHT_COLORS)},accent:DEFAULT_DARK_COLORS.accent,secondary:DEFAULT_DARK_COLORS.secondary,bg:DEFAULT_DARK_COLORS.bg,bg2:DEFAULT_DARK_COLORS.bg2,panel:DEFAULT_DARK_COLORS.panel,panel2:DEFAULT_DARK_COLORS.panel2,text:DEFAULT_DARK_COLORS.text,muted:DEFAULT_DARK_COLORS.muted,border:DEFAULT_DARK_COLORS.border,background:'assets/vermithor.png',opacity:.28},
      soften:{name:'Soften',campaignTitle:'Soften Performance',campaignTagline:'Tecnologia que impulsiona resultados.',preset:'soften',colors:{dark:{...DEFAULT_DARK_COLORS,accent:'#20b7f5',secondary:'#176bd3',bg:'#06111f',bg2:'#0a2035',panel:'rgba(8,24,40,.9)',panel2:'rgba(12,32,52,.94)',text:'#f3f8fc'},light:{...DEFAULT_LIGHT_COLORS,accent:'#0284c7',secondary:'#2563eb'}},background:null,favicon:DEFAULT_FAVICON,soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.24,opacity:.18},
      neon:{name:'Neon',campaignTitle:'Squad Neon',campaignTagline:'Acelere. Evolua. Conquiste.',preset:'neon',colors:{dark:{...DEFAULT_DARK_COLORS,accent:'#c05cff',secondary:'#21dbc9',bg:'#090514',bg2:'#151029',panel:'rgba(23,15,42,.9)',panel2:'rgba(31,21,54,.94)',text:'#faf5ff'},light:{...DEFAULT_LIGHT_COLORS,accent:'#9333ea',secondary:'#0f9f91'}},background:null,favicon:DEFAULT_FAVICON,soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.24,opacity:.18},
      clean:{name:'Claro',campaignTitle:'Performance',campaignTagline:'Clareza para acompanhar cada resultado.',preset:'clean',colors:{dark:{...DEFAULT_DARK_COLORS,accent:'#7c8cf8',secondary:'#4f68dd',bg:'#0b1020',bg2:'#121a2c',panel:'rgba(19,27,45,.92)',panel2:'rgba(27,38,61,.94)'},light:{...DEFAULT_LIGHT_COLORS,accent:'#3157d5',secondary:'#6a7be8',bg:'#e9eef5',bg2:'#f7f9fc',panel:'rgba(255,255,255,.94)',panel2:'#ffffff',text:'#172033'}},background:null,favicon:DEFAULT_FAVICON,soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:DEFAULT_SOUNDTRACK_NAME,soundtrackVolume:.24,opacity:.06}
    };
    state.theme=normalizeThemePayload({...presets[name]||presets.vermithor,fontFamily:normalizeSystemFont(state.theme?.fontFamily),chartPreferences:currentChartPreferences()});markThemeEditorDirty();applyTheme(state.theme,{remember:false});toast(`Prévia do tema ${state.theme.name} aplicada.`)
  }
  function applyCampaignIdentity(theme,safeBg,fallbackTitle,fallbackTagline){
    const title=theme.campaignTitle||fallbackTitle||theme.name||'Performance';
    const tagline=theme.campaignTagline||fallbackTagline||'Acompanhe, evolua e conquiste.';
    const art=safeBg||(theme.preset==='vermithor'?'assets/casa-do-dragao-sidebar.png':'');
    $$('[data-theme-art]').forEach(img=>{if(art){img.src=art;img.classList.remove('hidden')}else{img.removeAttribute('src');img.classList.add('hidden')}img.alt=`Arte da campanha ${title}`});
    const cssArt=art?`url(\"${art}\")`:'none';
    $$('.hero,.team-hero,.help-hero,.profile-hero,.theme-preview,.login-screen,.boot-card,.sound-welcome-card').forEach(el=>el.style.setProperty('--hero-img',cssArt));
    if($('#campaignVisual'))$('#campaignVisual').setAttribute('aria-label',`Campanha ${title}`);
    if($('#campaignTitleDisplay'))$('#campaignTitleDisplay').textContent=title;
    if($('#campaignTaglineDisplay'))$('#campaignTaglineDisplay').textContent=tagline;
    if($('#soundWelcomeTitle'))$('#soundWelcomeTitle').textContent=`Entrar em ${title}`;
    if($('#bootCampaignLabel'))$('#bootCampaignLabel').textContent=`${title} • ${tagline}`.toUpperCase();
    if($('#houseMottoTitle'))$('#houseMottoTitle').textContent=title.toUpperCase();
    if($('#houseMottoText'))$('#houseMottoText').textContent=tagline;
  }
  function applyTheme(t,{remember=true}={}){
    state.theme=normalizeThemePayload(t||DEFAULT_THEME);applySystemFont(state.theme.fontFamily);applyThemePalette(state.theme);applyChartPreferences(state.theme.chartPreferences||DEFAULT_CHART_PREFERENCES);const r=document.documentElement.style;
    if(state.theme.opacity!=null)r.setProperty('--hero-opacity',state.theme.opacity);const safeBg=sanitizeThemeBackground(state.theme.background),bg=safeBg?`url("${safeBg}")`:state.theme.preset==='vermithor'?"url('assets/vermithor.png')":'none';r.setProperty('--hero-img',bg);
    const fallbackTitle=state.theme.preset==='vermithor'?'Casa do Dragão':(state.theme.name||`Squad ${state.squadCode}`),fallbackTagline=state.theme.preset==='vermithor'?'Unifique os squads, mantenha o fogo das metas e avance o reino dos resultados.':'Acompanhe, evolua e conquiste.';
    applyCampaignIdentity(state.theme,safeBg,fallbackTitle,fallbackTagline);
    if(remember)rememberLastTheme(state.theme);
    if($('#campaignNameInput'))$('#campaignNameInput').value=state.theme.campaignTitle||fallbackTitle;if($('#campaignTaglineInput'))$('#campaignTaglineInput').value=state.theme.campaignTagline||fallbackTagline;applyFavicon(state.theme.favicon);if($('#soundtrackNameInput'))$('#soundtrackNameInput').value=state.theme.soundtrackName||'';if($('#soundtrackDefaultVolume'))$('#soundtrackDefaultVolume').value=Math.round(clamp(Number(state.theme.soundtrackVolume??.24),0,1)*100);if($('#soundtrackDefaultVolumeLabel'))$('#soundtrackDefaultVolumeLabel').textContent=`${Math.round(clamp(Number(state.theme.soundtrackVolume??.24),0,1)*100)}%`;applySoundtrack(state.theme);updateThemeName()
  }
  function updateThemeName(){if($('#themeName'))$('#themeName').textContent=state.theme?.name||state.theme?.campaignTitle||'Personalizado';syncColorModeUi()}
  function handleBackground(e){if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;if(f.size>5*1024*1024){toast('Use uma imagem de até 5 MB.');return}const reader=new FileReader();reader.onload=()=>{state.theme.background=reader.result;state.theme.name=$('#campaignNameInput').value||'Personalizado';state.theme.campaignTitle=$('#campaignNameInput').value||state.theme.campaignTitle||`Squad ${state.squadCode}`;state.theme.campaignTagline=$('#campaignTaglineInput').value||state.theme.campaignTagline||'';state.theme.preset='custom';if($('#backgroundFileName'))$('#backgroundFileName').textContent=f.name||'Nova imagem selecionada';markThemeEditorDirty();applyTheme(state.theme,{remember:false});toast('Fundo atualizado na prévia.')};reader.readAsDataURL(f)}
  function sanitizeThemeBackground(v){if(!v)return null;const s=String(v).trim();return/^(data:image\/(png|jpeg|jpg|webp|gif);base64,|https?:\/\/|assets\/)/i.test(s)?s:null}
  function applyFavicon(value){
    const safe=sanitizeThemeBackground(value)||DEFAULT_FAVICON;
    let link=$('#appFavicon');
    if(!link){link=document.createElement('link');link.id='appFavicon';link.rel='icon';link.type='image/png';document.head.appendChild(link)}
    link.href=safe;
    if($('#faviconPreview'))$('#faviconPreview').src=safe;
  }
  function handleFavicon(e){
    if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;
    if(!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(f.type||'')){toast('Use PNG, JPG, WEBP ou GIF para o favicon.');e.target.value='';return}
    if(f.size>750*1024){toast('Use um favicon de até 750 KB.');e.target.value='';return}
    const reader=new FileReader();reader.onload=()=>{state.theme.favicon=reader.result;state.theme.preset='custom';markThemeEditorDirty();applyFavicon(state.theme.favicon);toast('Favicon atualizado na prévia.')};reader.readAsDataURL(f);
  }
  function resetFavicon(){if(!isAdmin())return;state.theme.favicon=DEFAULT_FAVICON;state.theme.preset='custom';if($('#faviconFile'))$('#faviconFile').value='';markThemeEditorDirty();applyFavicon(DEFAULT_FAVICON);toast('Favicon padrão aplicado na prévia.')}
  function themePayload(theme=state.theme,code=state.squadCode){const t=normalizeThemePayload(theme);const d=t.colors.dark;return{schema:'squad-theme-v2',fontFamily:normalizeSystemFont(t.fontFamily),name:t.name||'Personalizado',campaignTitle:t.campaignTitle||t.name||(code&&code!=='all'?`Squad ${code}`:'Performance Hub'),campaignTagline:t.campaignTagline||'',colors:clone(t.colors),accent:d.accent,secondary:d.secondary,bg:d.bg,bg2:d.bg2,panel:d.panel,panel2:d.panel2,text:d.text,muted:d.muted,border:d.border,background:t.background||null,favicon:t.favicon||DEFAULT_FAVICON,soundtrack:Object.prototype.hasOwnProperty.call(t,'soundtrack')?t.soundtrack:DEFAULT_SOUNDTRACK,soundtrackName:t.soundtrackName||'',soundtrackVolume:clamp(Number(t.soundtrackVolume??.24),0,1),opacity:t.opacity??.28,chartPreferences:clone(normalizeChartPreferences(t.chartPreferences||DEFAULT_CHART_PREFERENCES))}}
  function downloadJson(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function exportTheme(){if(!canEditAppearance())return;const suffix=state.appearanceScope==='all'&&isSuperAdmin()?'todos-squads':`squad-${state.squadCode.toLowerCase()}`;downloadJson(themePayload(),`tema-${suffix}.json`);toast('Tema exportado em JSON com paletas clara/escura e preferências de gráficos.')}
  async function handleThemeJson(e){if(!isAdmin())return;const f=e.target.files?.[0];if(!f)return;try{const raw=JSON.parse(await f.text());if(!['squad-theme-v1','squad-theme-v2'].includes(raw.schema))throw new Error('Arquivo de tema incompatível.');const theme={...raw,preset:'custom'};delete theme.schema;delete theme._instrucoes;if(theme.background&&!sanitizeThemeBackground(theme.background))throw new Error('Fundo inválido.');if(theme.favicon&&!sanitizeThemeBackground(theme.favicon))throw new Error('Favicon inválido.');if(theme.soundtrack&&!sanitizeThemeAudio(theme.soundtrack))throw new Error('Trilha sonora inválida.');state.theme=normalizeThemePayload(theme);saveTheme();applyTheme(state.theme,{remember:true});toast(raw.schema==='squad-theme-v1'?'Tema antigo convertido para Light/Dark e aplicado.':'Tema importado e aplicado.')}catch(err){toast(err.message||'Não foi possível importar o tema.')}finally{e.target.value=''}}

  /* ===== V2.43: carregamento progressivo, cache e diagnostico ===== */
  const FULL_MONTH_SELECT='id,year,month,source_file,latest_day,imported_at,team_result,redistributed,team_goal_att,team_goal_eval_pct,score_settings,finance_settings,finance_month_data,finance_model,finance_compare,finance_technician_compare,finance_individual_cap,finance_comparison_snapshot,is_closed,closed_at,closed_by,closed_snapshot,quality_person_daily_metrics(technician_name,technician_key,day,quality_type,notes5,notes4,notes3,notes2,notes1,source_file,imported_at),technician_monthly(id,user_id,technician_name,att,notes5,notes4,notes3,notes2,notes1,total_eval,avg_rating,eval_pct,evaluation_excluded_att,status,goals_hit,points,rank,discount,point_bonus,goal_att,goal_eval,technician_finance_monthly(id,manual_bonus,sales_commission,vacation,waive_below_discount,exclude_from_group_count,calculated),daily_metrics(day,att,notes5,notes4,notes3,notes2,notes1,off),quality_daily_metrics(day,quality_type,notes5,notes4,notes3,notes2,notes1,source_file,imported_at))';
  const SUMMARY_MONTH_SELECT='id,squad_id,year,month,source_file,latest_day,imported_at,team_goal_att,team_goal_eval_pct,is_closed,closed_at,closed_by,technician_monthly(id,user_id,technician_name,att,notes5,notes4,notes3,notes2,notes1,total_eval,avg_rating,eval_pct,evaluation_excluded_att,status,goals_hit,points,rank,discount,point_bonus,goal_att,goal_eval,technician_finance_monthly(id,manual_bonus,sales_commission,vacation,waive_below_discount,exclude_from_group_count,calculated))';
  const MONTH_INDEX_SELECT='id,squad_id,year,month,source_file,latest_day,imported_at,is_closed,closed_at,closed_by';
  function performanceScope(){return `${state.user?.organizationId||'org'}:${state.user?.userId||'user'}:v${APP_VERSION}`}
  function invalidateDashboardCaches({themes=false}={}){
    clearPerformanceCacheScope(performanceScope());
    clearPerformanceCacheScope('initial');
    if(themes)clearPerformanceCacheScope(`theme:${state.user?.organizationId||'org'}`);
  }
  function setDataLoadIndicator(active,label='Carregando dados...'){
    const el=$('#dataLoadIndicator');if(!el)return;
    el.classList.toggle('hidden',!active);const text=el.querySelector('span');if(text)text.textContent=label;
  }
  function performanceMark(name,data){try{state.performanceTracker?.mark(name,data)}catch(e){}}
  let lastPerformanceCacheSampleAt=0;
  function performanceCacheMeta(){
    try{const snap=getLocalPerformanceMetrics?.();const c=snap?.cache||{};return{cache_hits:safe(c.hit),cache_misses:safe(c.miss),cache_stale:safe(c.stale),cache_writes:safe(c.write),cache_hit_rate:Number(c.hitRate||0)}}catch(e){return{}}
  }
  function queuePerformanceTelemetry(event){
    if(!event||!state.supabase||!state.user||state.performanceTelemetryAvailable===false)return;
    state.performanceTelemetryQueue.push(event);if(state.performanceTelemetryQueue.length>50)state.performanceTelemetryQueue.splice(0,state.performanceTelemetryQueue.length-50);
    clearTimeout(state.performanceTelemetryTimer);state.performanceTelemetryTimer=setTimeout(()=>schedulePerformanceIdle(()=>flushPerformanceTelemetry(),{timeout:1200}),900);
  }
  async function flushPerformanceTelemetry(){
    if(!state.supabase||!state.user||state.performanceTelemetryAvailable===false||!state.performanceTelemetryQueue.length)return 0;
    clearTimeout(state.performanceTelemetryTimer);state.performanceTelemetryTimer=null;const batch=state.performanceTelemetryQueue.splice(0,20);
    try{const {data,error}=await state.supabase.rpc('record_performance_events',{p_events:batch});if(error)throw error;state.performanceTelemetryAvailable=true;return safe(data)}catch(err){
      const msg=String(err?.message||err||'');if(/record_performance_events|function .* does not exist|schema cache/i.test(msg)){state.performanceTelemetryAvailable=false;state.performanceRemoteError='Execute a MIGRACAO_V2.43.1.sql para habilitar o histórico centralizado.';}
      else{state.performanceTelemetryQueue.unshift(...batch);if(state.performanceTelemetryQueue.length>50)state.performanceTelemetryQueue.length=50;}
      return 0;
    }
  }
  function recordRuntimePerformance(type,name,durationMs=0,meta={},success=true,source=''){
    const merged={...performanceCacheMeta(),...(meta||{})};const local=recordLocalPerformanceEvent?.(type,name,durationMs,merged,success);
    queuePerformanceTelemetry({event_type:type,event_name:name,duration_ms:Math.max(0,Number(durationMs)||0),success:success!==false,source:String(source||meta?.source||'').slice(0,80),metadata:merged,app_version:APP_VERSION});return local;
  }
  function captureClientPerformanceError(name,error,meta={}){
    try{const local=recordLocalPerformanceError?.(name,error,meta);const message=String(error?.message||error||'Erro desconhecido').replace(/\s+/g,' ').slice(0,300);queuePerformanceTelemetry({event_type:'error',event_name:name,duration_ms:0,success:false,source:String(meta?.source||'client').slice(0,80),metadata:{...performanceCacheMeta(),message},app_version:APP_VERSION});return local}catch(e){return null}
  }
  function queueCachePerformanceSample(force=false){
    const now=Date.now();if(!force&&now-lastPerformanceCacheSampleAt<60000)return;lastPerformanceCacheSampleAt=now;const meta=performanceCacheMeta();recordLocalPerformanceEvent?.('cache','session_cache',0,meta,true);queuePerformanceTelemetry({event_type:'cache',event_name:'session_cache',duration_ms:0,success:true,source:'session',metadata:meta,app_version:APP_VERSION});
  }
  function performanceMs(value){const n=safe(value);return n>=1000?`${(n/1000).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} s`:`${Math.round(n)} ms`}
  function performanceEventLabel(name){const key=String(name||'');const labels={'month_load':'Competência completa','month_cache_hit':'Competência via cache','view:alerts':'Central de Alertas','view:individual':'Meu desempenho','view:team':'Visão do Squad','view:indicators':'Indicadores','view:presentation':'Apresentação','view:feedbacks':'Feedbacks','view:admin:operation':'Operação','view:admin:finance':'Bonificação','view:admin:costs':'Custos','login_to_ui':'Login até a Home'};return labels[key]||key.replace(/^view:/,'').replaceAll(':',' • ').replaceAll('_',' ')}
  function performanceStepLabel(name){const key=String(name||'');const labels={'auth_sign_in':'Autenticação','auth_ok':'Sessão autenticada','initial_context':'Contexto inicial','state_ready':'Preparação do painel','ui_ready':'Home utilizável','supabase_library':'Biblioteca Supabase','session_checked':'Validação da sessão'};return labels[key]||key.replaceAll('_',' ')}
  async function loadPerformanceRemoteSummary(force=false){
    if(!isSuperAdmin()||!state.supabase)return null;if(state.performanceRemoteLoading)return state.performanceRemoteLoading;if(state.performanceRemoteSummary&&!force){renderPerformanceSettings();return state.performanceRemoteSummary;}
    state.performanceRemoteLoading=(async()=>{state.performanceRemoteError='';try{await flushPerformanceTelemetry();const {data,error}=await state.supabase.rpc('get_performance_summary',{p_hours:168});if(error)throw error;state.performanceRemoteSummary=data||{};state.performanceTelemetryAvailable=true;return state.performanceRemoteSummary;}catch(err){const msg=String(err?.message||err||'');state.performanceRemoteError=/get_performance_summary|function .* does not exist|schema cache/i.test(msg)?'Execute a MIGRACAO_V2.43.1.sql para habilitar métricas históricas.':'Não foi possível consultar as métricas históricas agora.';return null;}finally{state.performanceRemoteLoading=false;renderPerformanceSettings();}})();return state.performanceRemoteLoading;
  }
  function renderPerformanceSettings(){
    const card=$('#performanceSystemCard');if(!card||!isSuperAdmin())return;const local=getLocalPerformanceMetrics?.()||{},cache=local.cache||{},latest=state.performanceDiagnostics||null,remote=state.performanceRemoteSummary||{},logins=remote.logins||{};
    if($('#performanceMetricLastLogin'))$('#performanceMetricLastLogin').textContent=latest?performanceMs(latest.totalMs):'—';
    if($('#performanceMetricAvgLogin'))$('#performanceMetricAvgLogin').textContent=safe(logins.count)?performanceMs(logins.avg_ms):'—';
    if($('#performanceMetricP95Login'))$('#performanceMetricP95Login').textContent=safe(logins.count)?performanceMs(logins.p95_ms):'—';
    if($('#performanceMetricCache'))$('#performanceMetricCache').textContent=`${Math.round(safe(cache.hitRate)*100)}%`;
    if($('#performanceMetricErrors'))$('#performanceMetricErrors').textContent=remote.errors!=null?fmtInt(remote.errors):fmtInt((local.events||[]).filter(e=>e.type==='error').length);
    if($('#performanceMetricLongTasks'))$('#performanceMetricLongTasks').textContent=fmtInt(local.longTasks||0);
    if($('#performanceLocalStatus'))$('#performanceLocalStatus').textContent=`Sessão atual • ${fmtInt(cache.hit||0)} hits / ${fmtInt(cache.miss||0)} misses • ${fmtInt(local.longTasks||0)} long tasks`;
    const steps=$('#performanceLoginSteps');if(steps)steps.innerHTML=latest?.steps?.length?latest.steps.map(step=>`<div><span>${escapeHtml(performanceStepLabel(step.name))}</span><strong>${performanceMs(step.ms)}</strong></div>`).join(''):'<div class="performance-empty-row">Faça um novo login para registrar as etapas desta sessão.</div>';
    const modules=$('#performanceModuleRows'),moduleRows=Array.isArray(remote.modules)?remote.modules:[];if(modules)modules.innerHTML=moduleRows.length?moduleRows.slice(0,10).map(row=>`<tr><td>${escapeHtml(row.name||'—')}</td><td>${fmtInt(row.count)}</td><td>${performanceMs(row.avg_ms)}</td><td>${performanceMs(row.p95_ms)}</td><td>${performanceMs(row.max_ms)}</td></tr>`).join(''):'<tr><td colspan="5" class="muted">Ainda não há histórico centralizado de módulos.</td></tr>';
    const errors=$('#performanceRecentErrors'),errorRows=Array.isArray(remote.recent_errors)?remote.recent_errors:[];if(errors)errors.innerHTML=errorRows.length?errorRows.map(row=>`<div class="performance-error-item"><strong>${escapeHtml(row.name||'Erro')}</strong><span>${escapeHtml(row.message||'Sem detalhe')}</span><small>${escapeHtml(formatDateTime(row.created_at))} • ${escapeHtml(row.app_version||'')}</small></div>`).join(''):'<div class="performance-empty-row">Nenhum erro recente registrado.</div>';
    const status=$('#performanceRemoteStatus');if(status){if(state.performanceRemoteLoading)status.textContent='Atualizando métricas históricas...';else if(state.performanceRemoteError)status.textContent=state.performanceRemoteError;else if(remote.generated_at)status.textContent=`Últimos 7 dias • ${fmtInt(remote.total_events||0)} eventos leves • atualizado ${formatDateTime(remote.generated_at)}`;else status.textContent='As métricas históricas são carregadas somente quando esta área é aberta.';}
    if(!state.performanceRemoteSummary&&!state.performanceRemoteLoading&&!state.performanceRemoteError&&state.supabase)schedulePerformanceIdle(()=>loadPerformanceRemoteSummary(false),{timeout:1000});
  }
  function resetPerformanceCenter(){resetLocalPerformanceMetrics?.();state.performanceDiagnostics=null;renderPerformanceSettings();toast('Métricas locais desta sessão foram zeradas. O histórico do Supabase não foi apagado.');}
  function exportPerformanceDiagnostics(){const payload={version:APP_VERSION,exportedAt:new Date().toISOString(),latestLogin:state.performanceDiagnostics||null,local:getLocalPerformanceMetrics?.()||{},remote:state.performanceRemoteSummary||null};downloadJson(payload,`performance-diagnostics-${new Date().toISOString().slice(0,10)}.json`);toast('Diagnóstico de performance exportado.');}
  function finishPerformanceDiagnostics(source=''){
    try{
      if(source)state.performanceTracker?.set('initialSource',source);
      const snap=state.performanceTracker?.snapshot?.();if(!snap)return;
      if(state.performanceLoginStartedAt){const fullMs=Math.max(snap.totalMs,performance.now()-state.performanceLoginStartedAt),authMs=Math.max(0,fullMs-snap.totalMs);snap.authToUiMs=snap.totalMs;snap.totalMs=fullMs;if(authMs>1)snap.steps=[{name:'auth_sign_in',ms:authMs},...(snap.steps||[])];state.performanceLoginStartedAt=null;}
      state.performanceDiagnostics=snap;window.SoftenPerformanceDiagnostics={latest:snap,get:()=>state.performanceDiagnostics,local:()=>getLocalPerformanceMetrics?.()||{},flush:()=>flushPerformanceTelemetry()};
      recordRuntimePerformance('login','login_to_ui',snap.totalMs,{initial_source:source||'',steps:snap.steps?.length||0},true,source||'login');queueCachePerformanceSample(true);
      console.info(`[Performance Hub] ${Math.round(snap.totalMs)} ms ate a interface utilizavel.`,snap);
    }catch(e){}
  }
  function monthIdFromParts(year,month){return `${safe(year)}-${String(safe(month)).padStart(2,'0')}`}
  function monthIndexPlaceholder(row){
    const id=monthIdFromParts(row.year,row.month),m={dbId:row.id,id,year:safe(row.year),month:safe(row.month),monthName:MONTHS_PT[safe(row.month)-1],sourceFile:row.source_file||'Supabase',latestDay:safe(row.latest_day)||1,importedAt:row.imported_at||null,teamResult:row.team_result||'',redistributed:safe(row.redistributed),teamTotals:{att:0,eligibleAtt:0,eval:0,evalPct:0},settings:{teamGoalAtt:safe(row.team_goal_att),teamGoalEvalPct:Number(row.team_goal_eval_pct??.343)},scoreSettings:row.score_settings||{},financeSettings:row.finance_settings&&Object.keys(row.finance_settings||{}).length?row.finance_settings:clone(DEFAULT_FINANCE_SETTINGS),financeMonthData:row.finance_month_data||{},financeModel:(row.is_closed&&safe(row.closed_snapshot?.version)<3)?'individual':(row.finance_model||'squad'),financeCompare:row.finance_compare!==false,financeTechCompare:row.finance_technician_compare===true,financeIndividualCap:Number.isFinite(Number(row.finance_individual_cap))?safe(row.finance_individual_cap):7000,financeComparison:row.finance_comparison_snapshot||{},isClosed:!!row.is_closed,closedAt:row.closed_at||null,closedBy:row.closed_by||null,closedSnapshot:row.closed_snapshot||{},qualityExternal:[],technicians:[]};
    return markPerformanceMonth(m,'index');
  }
  function normalizeSupabaseMonthRow(row,level='full'){
    if(!row)return null;
    const technicians=(row.technician_monthly||[]).map(t=>({dbId:t.id,userId:t.user_id,name:t.technician_name,att:safe(t.att),notes5:safe(t.notes5),notes4:safe(t.notes4),notes3:safe(t.notes3),notes2:safe(t.notes2),notes1:safe(t.notes1),totalEval:safe(t.total_eval),avg:safe(t.avg_rating),evalPct:safe(t.eval_pct),evaluationExcludedAtt:safe(t.evaluation_excluded_att),eligibleAtt:Math.max(0,safe(t.att)-safe(t.evaluation_excluded_att)),status:t.status||'',goalsHit:safe(t.goals_hit),points:safe(t.points),rank:safe(t.rank)||null,discount:safe(t.discount),pointBonus:safe(t.point_bonus),goalAtt:safe(t.goal_att),goalEval:safe(t.goal_eval),financeDbId:firstRelation(t.technician_finance_monthly).id||null,financeManualBonus:safe(firstRelation(t.technician_finance_monthly).manual_bonus),salesCommission:safe(firstRelation(t.technician_finance_monthly).sales_commission),vacation:!!firstRelation(t.technician_finance_monthly).vacation,waiveBelowDiscount:!!firstRelation(t.technician_finance_monthly).waive_below_discount,excludeFromGroupCount:!!firstRelation(t.technician_finance_monthly).exclude_from_group_count,financeData:firstRelation(t.technician_finance_monthly).calculated||{},daily:(t.daily_metrics||[]).map(d=>({day:safe(d.day),att:safe(d.att),notes5:safe(d.notes5),notes4:safe(d.notes4),notes3:safe(d.notes3),notes2:safe(d.notes2),notes1:safe(d.notes1),off:!!d.off})).sort((a,b)=>a.day-b.day),qualityDaily:(t.quality_daily_metrics||[]).map(q=>({day:safe(q.day),qualityType:q.quality_type,notes5:safe(q.notes5),notes4:safe(q.notes4),notes3:safe(q.notes3),notes2:safe(q.notes2),notes1:safe(q.notes1),sourceFile:q.source_file||'',importedAt:q.imported_at||null})).sort((a,b)=>a.day-b.day||String(a.qualityType).localeCompare(String(b.qualityType)))}));
    const id=monthIdFromParts(row.year,row.month),m={dbId:row.id,id,year:safe(row.year),month:safe(row.month),monthName:MONTHS_PT[safe(row.month)-1],sourceFile:row.source_file||'Supabase',latestDay:safe(row.latest_day)||1,importedAt:row.imported_at||null,teamResult:row.team_result||'',redistributed:safe(row.redistributed),teamTotals:deriveTotals(technicians),settings:{teamGoalAtt:safe(row.team_goal_att),teamGoalEvalPct:Number(row.team_goal_eval_pct??.343)},scoreSettings:row.score_settings||{},financeSettings:row.finance_settings&&Object.keys(row.finance_settings||{}).length?row.finance_settings:clone(DEFAULT_FINANCE_SETTINGS),financeMonthData:row.finance_month_data||{},financeModel:(row.is_closed&&safe(row.closed_snapshot?.version)<3)?'individual':(row.finance_model||'squad'),financeCompare:row.finance_compare!==false,financeTechCompare:row.finance_technician_compare===true,financeIndividualCap:Number.isFinite(Number(row.finance_individual_cap))?safe(row.finance_individual_cap):7000,financeComparison:row.finance_comparison_snapshot||{},isClosed:!!row.is_closed,closedAt:row.closed_at||null,closedBy:row.closed_by||null,closedSnapshot:row.closed_snapshot||{},qualityExternal:(row.quality_person_daily_metrics||[]).map(q=>({technicianName:q.technician_name||'',technicianKey:nameLinkKey(q.technician_name||''),day:safe(q.day),qualityType:q.quality_type,notes5:safe(q.notes5),notes4:safe(q.notes4),notes3:safe(q.notes3),notes2:safe(q.notes2),notes1:safe(q.notes1),sourceFile:q.source_file||'',importedAt:q.imported_at||null})).sort((a,b)=>String(a.technicianName).localeCompare(String(b.technicianName),'pt-BR')||a.day-b.day||String(a.qualityType).localeCompare(String(b.qualityType))),technicians};
    markPerformanceMonth(m,level);
    if(level==='full')recalculateMonth(m);
    return m;
  }
  function buildUserFromInitialProfile(profile,authUser){
    return{userId:authUser.id,email:profile.email||authUser.email,fullName:profile.full_name||profile.fullName||authUser.email,role:normalizeAccessRole(profile.role),organizationId:profile.organization_id||profile.organizationId||null,squadCode:profile.squad?.code||profile.squads?.code||profile.squadCode||null,techName:profile.technician_name?normalizeName(profile.technician_name):(profile.techName?normalizeName(profile.techName):null),permissions:profile.permissions||{},uiPreferences:profile.ui_preferences||profile.uiPreferences||null,avatarPath:profile.avatar_path||profile.avatarPath||null,avatarUrl:null};
  }
  function hydrateInitialContext(context,authUser){
    const profile=context?.profile||{};state.user=buildUserFromInitialProfile(profile,authUser);state.squads={};state.orgOverview=[];state.orgTechnicianOverview=[];state.orgDailyOverview=[];state.orgTechnicianDailyOverview=[];state.orgOverviewLoaded=false;state.orgOverviewLoading=null;state.superAdminCommissions=[];state.superAdminCommissionsLoaded=false;state.superAdminCommissionsLoading=null;
    const themeScope=`theme:${state.user.organizationId||'org'}`;
    for(const row of context?.squads||[]){const code=String(row.code||'').toUpperCase();if(!code)continue;const cachedTheme=readPerformanceCache(themeScope,performanceThemeCacheId(code));state.squads[code]={code,name:row.name||`Squad ${code}`,dbId:row.id,months:{},theme:cachedTheme?.value?normalizeThemePayload(cachedTheme.value):undefined};}
    const codeById=new Map(Object.values(state.squads).map(s=>[String(s.dbId),s.code]));
    for(const row of context?.month_index||[]){const code=String(row.squad_code||codeById.get(String(row.squad_id))||'').toUpperCase(),s=state.squads[code];if(!s)continue;const m=monthIndexPlaceholder(row);s.months[m.id]=m;}
    for(const row of context?.home_months||[]){const code=String(row.squad_code||codeById.get(String(row.squad_id))||'').toUpperCase(),s=state.squads[code];if(!s)continue;const m=normalizeSupabaseMonthRow(row,'summary');if(m)s.months[m.id]=m;}
    state.initialContextSource=context?.__source||'network';
  }
  async function loadInitialContextViaRpc(){
    const {data,error}=await state.supabase.rpc('get_initial_dashboard_context');if(error)throw error;if(!data?.profile)throw new Error('Contexto inicial vazio.');return{...data,__source:'rpc'};
  }
  async function loadInitialContextFallback(authUser){
    const profileQuery=state.supabase.from('profiles').select('user_id,email,full_name,role,organization_id,squad_id,technician_name,permissions,ui_preferences,avatar_path,squads(id,code,name)').eq('user_id',authUser.id).single();
    const squadsQuery=state.supabase.from('squads').select('id,code,name').eq('active',true).order('code');
    const monthsQuery=state.supabase.from('squad_months').select(MONTH_INDEX_SELECT).order('year',{ascending:false}).order('month',{ascending:false});
    const [{data:profile,error:pe},{data:squads,error:se},{data:monthIndex,error:me}]=await Promise.all([profileQuery,squadsQuery,monthsQuery]);if(pe)throw pe;if(se)throw se;if(me)throw me;
    const rows=monthIndex||[],latestKey=rows.reduce((mx,r)=>Math.max(mx,safe(r.year)*100+safe(r.month)),0),year=Math.floor(latestKey/100),month=latestKey%100;
    let home=[];if(latestKey){const {data,error}=await state.supabase.from('squad_months').select(SUMMARY_MONTH_SELECT).eq('year',year).eq('month',month);if(error)throw error;const codeById=new Map((squads||[]).map(s=>[String(s.id),s.code]));home=(data||[]).map(r=>({...r,squad_code:codeById.get(String(r.squad_id))||''}));}
    const codeById=new Map((squads||[]).map(s=>[String(s.id),s.code]));return{schema:'fallback-v2.43.2',profile,squads:squads||[],month_index:rows.map(r=>({...r,squad_code:codeById.get(String(r.squad_id))||''})),home_months:home,__source:'fallback'};
  }
  async function loadInitialSupabaseContext(authUser,{allowCache=true}={}){
    const cacheScope='initial',cacheKey=performanceInitialCacheId(authUser.id),cached=allowCache?readPerformanceCache(cacheScope,cacheKey):null;
    if(cached?.value)return{...cached.value,__source:'cache'};
    let context;try{context=await loadInitialContextViaRpc();}catch(err){console.warn('RPC inicial V2.43 indisponivel; usando fallback otimizado.',err);context=await loadInitialContextFallback(authUser);}
    writePerformanceCache(cacheScope,cacheKey,context,2*60*1000);return context;
  }
  async function refreshInitialContextInBackground(authUser){
    try{let context;try{context=await loadInitialContextViaRpc();}catch(err){context=await loadInitialContextFallback(authUser);}writePerformanceCache('initial',performanceInitialCacheId(authUser.id),context,2*60*1000);}catch(err){console.warn('Nao foi possivel revalidar o contexto inicial em segundo plano.',err)}
  }
  async function ensureSquadTheme(code,{force=false,apply=true}={}){
    code=String(code||'').toUpperCase();const squad=state.squads?.[code];if(!state.supabase||!squad?.dbId)return squad?.theme||null;
    const scope=`theme:${state.user?.organizationId||'org'}`,key=performanceThemeCacheId(code);if(!force){const cached=readPerformanceCache(scope,key);if(cached?.value){squad.theme=normalizeThemePayload(cached.value);if(apply&&state.squadCode===code){state.theme=resolveLegacyTheme(squad.theme);applyTheme(state.theme);}return squad.theme;}}
    const promiseKey=`theme:${code}`;if(state.dataPromises[promiseKey])return state.dataPromises[promiseKey];state.dataPromises[promiseKey]=(async()=>{try{const {data,error}=await state.supabase.from('squad_themes').select('theme').eq('squad_id',squad.dbId).maybeSingle();if(error)throw error;if(data?.theme){squad.theme=normalizeThemePayload(data.theme);writePerformanceCache(scope,key,squad.theme,10*60*1000);if(apply&&state.squadCode===code){state.theme=resolveLegacyTheme(squad.theme);applyTheme(state.theme);}return squad.theme}return null;}finally{delete state.dataPromises[promiseKey]}})();return state.dataPromises[promiseKey];
  }
  async function ensureMonthLoaded(code,id,{force=false,silent=false}={}){
    code=String(code||'').toUpperCase();const squad=state.squads?.[code],existing=squad?.months?.[id];if(!state.supabase||!squad||!id)return existing||null;if(!force&&isPerformanceFullMonth(existing))return existing;
    const scope=performanceScope(),key=performanceMonthCacheId(code,id,'full');if(!force){const cached=readPerformanceCache(scope,key);if(cached?.value){squad.months[id]=cached.value;recordLocalPerformanceEvent?.('module','month_cache_hit',0,{squad:code,period:id},true);return squad.months[id];}}
    const promiseKey=`month:${code}:${id}`;if(state.dataPromises[promiseKey])return state.dataPromises[promiseKey];if(!silent)setDataLoadIndicator(true,`Carregando ${monthLabelFromId(id)}...`);
    state.dataPromises[promiseKey]=(async()=>{const started=performance.now();try{let query=state.supabase.from('squad_months').select(FULL_MONTH_SELECT);if(existing?.dbId)query=query.eq('id',existing.dbId);else{const [year,month]=String(id).split('-').map(Number);query=query.eq('squad_id',squad.dbId).eq('year',year).eq('month',month);}const {data,error}=await query.single();if(error)throw error;const m=normalizeSupabaseMonthRow(data,'full');if(!m.isClosed&&!isTechnician())recalculateMonth(m);squad.months[id]=m;writePerformanceCache(scope,key,m,5*60*1000);recordRuntimePerformance('module','month_load',performance.now()-started,{squad:code,period:id},true,'supabase');return m;}catch(err){recordRuntimePerformance('module','month_load',performance.now()-started,{squad:code,period:id,message:String(err?.message||err||'').slice(0,180)},false,'supabase');console.error('Falha ao carregar competencia sob demanda.',code,id,err);throw err;}finally{delete state.dataPromises[promiseKey];if(!silent)setDataLoadIndicator(false);}})();return state.dataPromises[promiseKey];
  }
  async function ensureMonthsLoaded(codes,ids,{silent=false}={}){
    const jobs=[];for(const code of [...new Set(codes||[])])for(const id of [...new Set(ids||[])])if(state.squads?.[code]?.months?.[id]&&!isPerformanceFullMonth(state.squads[code].months[id]))jobs.push(ensureMonthLoaded(code,id,{silent:true}).catch(err=>null));if(!jobs.length)return[];if(!silent)setDataLoadIndicator(true,`Carregando ${jobs.length} competencia(s)...`);try{return await Promise.all(jobs);}finally{if(!silent)setDataLoadIndicator(false);}
  }
  async function ensureOrgOverviewData({daily=false,technicians=false,force=false}={}){
    if(!state.supabase)return;if(state.orgOverviewLoaded&&!force&&(!daily||state.orgDailyOverview.length)&&(!technicians||state.orgTechnicianOverview.length))return;
    if(state.orgOverviewLoading)return state.orgOverviewLoading;
    state.orgOverviewLoading=(async()=>{try{
      const jobs=[state.supabase.rpc('get_org_squad_monthly_overview')];if(technicians)jobs.push(state.supabase.rpc('get_org_technician_monthly_overview'));if(daily){jobs.push(state.supabase.rpc('get_org_daily_attendance_overview'));jobs.push(state.supabase.rpc('get_org_technician_daily_overview'));}
      const results=await Promise.all(jobs);let i=0;const overview=results[i++];if(overview.error)throw overview.error;state.orgOverview=(overview.data||[]).map(r=>({squadCode:r.squad_code,squadName:r.squad_name,id:monthIdFromParts(r.year,r.month),year:safe(r.year),month:safe(r.month),totalAtt:safe(r.total_att),totalEval:safe(r.total_eval),evalPct:safe(r.eval_pct),technicianCount:safe(r.technician_count)}));
      if(technicians){const x=results[i++];if(x.error)throw x.error;state.orgTechnicianOverview=(x.data||[]).map(r=>({squadCode:r.squad_code,squadName:r.squad_name,id:monthIdFromParts(r.year,r.month),year:safe(r.year),month:safe(r.month),technicianName:r.technician_name||'',att:safe(r.att),totalEval:safe(r.total_eval),avg:safe(r.avg_rating),evalPct:safe(r.eval_pct),points:safe(r.points),status:String(r.status||'').toUpperCase()}));}
      if(daily){const x=results[i++];if(x.error)throw x.error;state.orgDailyOverview=(x.data||[]).map(r=>({squadCode:r.squad_code,id:monthIdFromParts(r.year,r.month),year:safe(r.year),month:safe(r.month),day:safe(r.day),date:isoDateParts(r.year,r.month,r.day),totalAtt:safe(r.total_att),notes5:safe(r.notes5),notes4:safe(r.notes4),notes3:safe(r.notes3),notes2:safe(r.notes2),notes1:safe(r.notes1),totalEval:safe(r.total_eval),evalPct:safe(r.eval_pct)}));const y=results[i++];if(y.error)throw y.error;state.orgTechnicianDailyOverview=(y.data||[]).map(r=>({squadCode:r.squad_code,id:monthIdFromParts(r.year,r.month),year:safe(r.year),month:safe(r.month),day:safe(r.day),date:isoDateParts(r.year,r.month,r.day),technicianName:r.technician_name||'',att:safe(r.att),notes5:safe(r.notes5),notes4:safe(r.notes4),notes3:safe(r.notes3),notes2:safe(r.notes2),notes1:safe(r.notes1),totalEval:safe(r.total_eval),avg:safe(r.avg_rating),evalPct:safe(r.eval_pct)}));}
      state.orgOverviewLoaded=true;
    }catch(err){console.warn('Consolidados organizacionais indisponiveis.',err);}finally{state.orgOverviewLoading=null;}})();return state.orgOverviewLoading;
  }
  async function ensureSuperAdminCommissions(force=false){
    if(!state.supabase||!isSuperAdmin())return;if(state.superAdminCommissionsLoaded&&!force)return;if(state.superAdminCommissionsLoading)return state.superAdminCommissionsLoading;
    state.superAdminCommissionsLoading=(async()=>{try{const [{data:comms,error:ce},{data:admins,error:ae}]=await Promise.all([state.supabase.from('super_admin_commissions').select('id,user_id,year,month,amount,notes').order('year',{ascending:false}).order('month',{ascending:false}),state.supabase.from('profiles').select('user_id,full_name,email').eq('role','super_admin')]);if(ce)throw ce;if(ae)throw ae;const names=new Map((admins||[]).map(a=>[a.user_id,a.full_name||a.email||'Administrador']));state.superAdminCommissions=(comms||[]).map(c=>({...c,name:names.get(c.user_id)||'Administrador',amount:safe(c.amount)}));state.superAdminCommissionsLoaded=true;}catch(err){console.warn('Comissoes de Administrador indisponiveis.',err);}finally{state.superAdminCommissionsLoading=null;}})();return state.superAdminCommissionsLoading;
  }
  function viewNeedsFullMonth(name,section){return['individual','team','indicators','presentation','feedbacks'].includes(name)||(name==='admin'&&['operation','finance','costs'].includes(section))}
  async function ensureViewData(name=state.currentView,section=state.adminSection){
    if(!state.supabase||name==='home'||['alerts','users','audit','settings','profile','my-feedbacks','help'].includes(name))return;
    const ids=(name==='indicators'||name==='team'||name==='individual')?analysisMonthIds().filter(Boolean):(state.currentId?[state.currentId]:[]),codes=state.squadCode==='all'?Object.keys(state.squads||{}):(state.squadCode?[state.squadCode]:[]),jobs=[];
    if(viewNeedsFullMonth(name,section)&&ids.length&&codes.length)jobs.push(ensureMonthsLoaded(codes,ids,{silent:true}));
    if((name==='indicators'||name==='team')&&isSuperAdmin())jobs.push(ensureOrgOverviewData({daily:true,technicians:true}));
    if(name==='admin'&&section==='finance'&&isSuperAdmin())jobs.push(ensureSuperAdminCommissions());
    if(!jobs.length)return;const metricName=`view:${name}${section?`:${section}`:''}`,started=performance.now();setDataLoadIndicator(true,'Atualizando dados da tela...');try{const result=await Promise.all(jobs);recordRuntimePerformance('module',metricName,performance.now()-started,{jobs:jobs.length,squad:state.squadCode||'',period:state.currentId||''},true,'lazy');return result;}catch(err){recordRuntimePerformance('module',metricName,performance.now()-started,{jobs:jobs.length,message:String(err?.message||err||'').slice(0,180)},false,'lazy');throw err;}finally{setDataLoadIndicator(false);}
  }
  function hydrateCurrentViewAsync(name=state.currentView,section=state.adminSection){
    const token=`${name}:${section||''}:${state.squadCode}:${state.currentId||''}`;ensureViewData(name,section).then(()=>{const current=`${state.currentView}:${state.adminSection||''}:${state.squadCode}:${state.currentId||''}`;if(current!==token)return;refreshSelectors();render();}).catch(err=>{console.error(err);toast('Nao foi possivel carregar todos os dados desta tela.');});
  }
  function schedulePostLoginHydration(authUser){
    if(state.backgroundHydrationStarted)return;state.backgroundHydrationStarted=true;schedulePerformanceIdle(()=>{
      if(state.initialContextSource==='cache')refreshInitialContextInBackground(authUser);
      if(state.squadCode&&state.squadCode!=='all')ensureSquadTheme(state.squadCode,{apply:true}).catch(()=>{});
      if(state.squadCode&&state.squadCode!=='all'&&state.currentId)ensureMonthLoaded(state.squadCode,state.currentId,{silent:true}).then(()=>{if(state.currentView==='home')renderHome();}).catch(()=>{});
      if(isSuperAdmin())ensureOrgOverviewData({daily:false,technicians:false}).catch(()=>{});
    },{timeout:900});
  }

  /* ===== Supabase: login + dados multi-squad ===== */
  async function initSupabase(){
    const cfg=window.APP_CONFIG||{};if(!cfg.supabaseUrl||!cfg.supabaseAnonKey)throw new Error('Preencha supabaseUrl e supabaseAnonKey em js/config.js.');
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    state.supabase=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    const hashType=new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type');
    if(hashType==='recovery')state.recoveryMode=true;
    state.supabase.auth.onAuthStateChange((event)=>{
      if(event==='PASSWORD_RECOVERY'){
        state.recoveryMode=true;
        setTimeout(()=>{showLogin('Link de recuperação validado. Defina sua nova senha.');openModal('recoveryModal');},0);
      }
    });
  }
  function loadScript(src){return new Promise((resolve,reject)=>{if(window.supabase)return resolve();const existing=document.querySelector(`script[data-dynamic-src="${src}"]`);if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',()=>reject(new Error('Falha ao carregar biblioteca Supabase.')),{once:true});return;}const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.fetchPriority='high';s.dataset.dynamicSrc=src;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar biblioteca Supabase.'));document.head.appendChild(s)})}
  async function enterSupabaseSession(authUser,{allowCache=true}={}){
    state.performanceTracker=createPerformanceTracker('login');performanceMark('auth_ok');
    if($('#bootMessage'))$('#bootMessage').textContent='Carregando seu perfil e a competencia atual...';showBoot('Carregando seu perfil e a competencia atual...');
    const context=await loadInitialSupabaseContext(authUser,{allowCache});performanceMark('initial_context',{source:context.__source||'network'});
    hydrateInitialContext(context,authUser);performanceMark('state_ready');
    state.presentationLastSyncAt=new Date().toISOString();await enterApp(state.user);performanceMark('ui_ready');finishPerformanceDiagnostics(context.__source||'network');
    schedulePostLoginHydration(authUser);
  }
  // V2.43: o carregamento monolitico anterior foi removido. Dados detalhados agora entram sob demanda.
  function periodWithinHistory(row,year,month){const key=year*100+month,from=safe(row.valid_from_year)*100+safe(row.valid_from_month),to=row.valid_to_year?safe(row.valid_to_year)*100+safe(row.valid_to_month):999999;return key>=from&&key<=to}
  async function userMapForSquadPeriod(squad,m){
    const userMap={};
    if(!state.supabase||!squad?.dbId)return userMap;
    try{const {data:history,error}=await state.supabase.from('profile_squad_history').select('user_id,technician_name,valid_from_year,valid_from_month,valid_to_year,valid_to_month').eq('squad_id',squad.dbId);if(error)throw error;(history||[]).filter(h=>h.technician_name&&periodWithinHistory(h,m.year,m.month)).forEach(h=>userMap[nameLinkKey(h.technician_name)]=h.user_id)}catch(err){console.warn('Histórico de movimentação indisponível; usando perfil atual.',err)}
    const {data:profiles,error:pe}=await state.supabase.from('profiles').select('user_id,technician_name,full_name').eq('squad_id',squad.dbId);if(pe)throw pe;(profiles||[]).forEach(p=>{for(const alias of [p.technician_name,p.full_name]){const key=nameLinkKey(alias);if(key&&!userMap[key])userMap[key]=p.user_id}});
    return userMap;
  }
  async function persistImportedMonth(m,squad){
    const payload={squad_id:squad.dbId,year:m.year,month:m.month,source_file:m.sourceFile,latest_day:m.latestDay,team_result:m.teamResult,redistributed:m.redistributed,team_goal_att:m.settings?.teamGoalAtt||autoTeamAttGoal(m),team_goal_eval_pct:m.settings?.teamGoalEvalPct??.343,score_settings:m.scoreSettings||{},finance_settings:financeSettingsForMonth(m),finance_month_data:m.financeMonthData||{},finance_model:financeModelForMonth(m),finance_compare:m.financeCompare!==false,finance_technician_compare:m.financeTechCompare===true,finance_individual_cap:Number.isFinite(Number(m.financeIndividualCap))?safe(m.financeIndividualCap):7000,finance_comparison_snapshot:m.financeComparison||{},imported_by:state.user.userId,imported_at:new Date().toISOString()};
    const {data:monthRow,error}=await state.supabase.from('squad_months').upsert(payload,{onConflict:'squad_id,year,month'}).select('id').single();if(error)throw error;m.dbId=monthRow.id;
    const userMap=await userMapForSquadPeriod(squad,m);
    const {data:existing,error:ee}=await state.supabase.from('technician_monthly').select('id,technician_name').eq('squad_month_id',monthRow.id);if(ee)throw ee;const keepNames=new Set();
    for(const t of m.technicians){
      keepNames.add(nameLinkKey(t.name));
      const row={squad_month_id:monthRow.id,user_id:userMap[nameLinkKey(t.name)]||null,technician_name:t.name,att:t.att,notes5:t.notes5,notes4:t.notes4,notes3:t.notes3,notes2:t.notes2,notes1:t.notes1,total_eval:t.totalEval,avg_rating:t.avg,eval_pct:t.evalPct,evaluation_excluded_att:normalizedEvaluationExcludedAtt(t),status:t.status,goals_hit:t.goalsHit,points:t.points,rank:t.rank,discount:t.discount,point_bonus:t.pointBonus,goal_att:t.goalAtt,goal_eval:t.goalEval};
      const {data:tm,error:te}=await state.supabase.from('technician_monthly').upsert(row,{onConflict:'squad_month_id,technician_name'}).select('id').single();if(te)throw te;t.dbId=tm.id;
      const financeRow={technician_month_id:tm.id,manual_bonus:safe(t.financeManualBonus),sales_commission:safe(t.salesCommission),vacation:!!t.vacation,waive_below_discount:!!t.waiveBelowDiscount,exclude_from_group_count:!!t.excludeFromGroupCount,calculated:t.financeData||{},updated_by:state.user.userId,updated_at:new Date().toISOString()};const {error:tfe}=await state.supabase.from('technician_finance_monthly').upsert(financeRow,{onConflict:'technician_month_id'});if(tfe)throw tfe;
      const {error:dd}=await state.supabase.from('daily_metrics').delete().eq('technician_month_id',tm.id);if(dd)throw dd;
      const daily=(t.daily||[]).map(d=>({technician_month_id:tm.id,day:d.day,att:d.att,notes5:d.notes5,notes4:safe(d.notes4),notes3:safe(d.notes3),notes2:safe(d.notes2),notes1:safe(d.notes1),off:!!d.off}));if(daily.length){const {error:de}=await state.supabase.from('daily_metrics').insert(daily);if(de)throw de}
    }
    for(const old of existing||[]){if(!keepNames.has(nameLinkKey(old.technician_name))){const {error:se}=await state.supabase.from('technician_monthly').delete().eq('id',old.id);if(se)throw se}}
    invalidateDashboardCaches();
  }
  async function persistThemeToSupabase(codes=appearanceScopeCodes(),theme=state.theme){if(!state.supabase||!codes?.length)return;const normalized=normalizeThemePayload(theme),now=new Date().toISOString(),rows=codes.map(code=>state.squads?.[code]).filter(s=>s?.dbId).map(s=>({squad_id:s.dbId,theme:themePayload(normalized,s.code),updated_by:state.user.userId,updated_at:now}));if(!rows.length)return;const {error}=await state.supabase.from('squad_themes').upsert(rows,{onConflict:'squad_id'});if(error)throw error;codes.forEach(code=>{if(state.squads?.[code])state.squads[code].theme=clone(normalized)});invalidateDashboardCaches({themes:true})}

  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  boot();
})();
