(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.SoftenSettingsEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const PERMISSIONS=[
    {key:'dashboard.customize',section:'Experiência',label:'Personalizar o próprio painel',roles:['super_admin','technician']},
    {key:'presentation.view',section:'Experiência',label:'Visualizar Apresentação / TV',roles:['super_admin','technician']},
    {key:'presentation.manage',section:'Gestão',label:'Configurar Apresentação / TV',roles:['super_admin']},
    {key:'indicators.view',section:'Gestão',label:'Visualizar Indicadores executivos',roles:['super_admin']},
    {key:'data.import',section:'Operação',label:'Importar dados e qualidade',roles:['super_admin']},
    {key:'goals.manage',section:'Operação',label:'Alterar metas e referências',roles:['super_admin']},
    {key:'month.manage',section:'Operação',label:'Fechar, reabrir e excluir competências',roles:['super_admin']},
    {key:'finance.view',section:'Financeiro',label:'Visualizar bonificação administrativa',roles:['super_admin']},
    {key:'finance.manage',section:'Financeiro',label:'Alterar regras e valores de bonificação',roles:['super_admin']},
    {key:'costs.view',section:'Financeiro',label:'Visualizar e alterar Custos do Suporte',roles:['super_admin']},
    {key:'feedback.manage',section:'Pessoas',label:'Gerar e finalizar feedbacks',roles:['super_admin']},
    {key:'users.manage',section:'Pessoas',label:'Gerenciar usuários do escopo',roles:['super_admin']},
    {key:'audit.view',section:'Governança',label:'Visualizar auditoria',roles:['super_admin']},
    {key:'appearance.manage',section:'Governança',label:'Alterar aparência e gráficos',roles:['super_admin']},
    {key:'permissions.manage',section:'Governança',label:'Definir permissões específicas',roles:['super_admin']}
  ];


  const NAVIGATION_DEFAULTS={
    sidebarCollapsed:false,
    groups:{performance:false,management:false,account:false},
    subgroups:{finance:false,people:false,governance:false}
  };

  const LAYOUTS={
    home:{label:'Início',blocks:[
      {key:'kpis',label:'Indicadores principais',selector:'#homeWidgetKpis',defaultSize:'full',sizes:['wide','full']},
      {key:'alerts',label:'Alertas e prioridades',selector:'#homeWidgetAlerts',defaultSize:'medium',sizes:['small','medium','wide','full']},
      {key:'actions',label:'Atalhos rápidos',selector:'#homeWidgetActions',defaultSize:'medium',sizes:['small','medium','wide','full']},
      {key:'squads',label:'Visão dos Squads',selector:'#homeWidgetSquads',defaultSize:'full',sizes:['wide','full']},
      {key:'context',label:'Contexto dos dados',selector:'#homeWidgetContext',defaultSize:'full',sizes:['wide','full']}
    ]},
    individual:{label:'Meu desempenho',blocks:[
      {key:'hero',label:'Resumo e ranking',selector:'#individualContent > .hero'},
      {key:'kpis',label:'Indicadores principais',selector:'#individualContent > .kpi-grid'},
      {key:'status',label:'Status auditável',selector:'#individualContent > .status-audit-card'},
      {key:'finance',label:'Bonificação financeira',selector:'#individualContent > .finance-summary-card'},
      {key:'game',label:'Jornada do mês',selector:'#individualContent > .game-card'},
      {key:'goalsChart',label:'Meta e evolução diária',selector:'#individualContent > .content-grid:not(.bottom-grid)'},
      {key:'historyRankings',label:'Histórico e rankings',selector:'#individualContent > .bottom-grid'}
    ]},
    team:{label:'Visão do Squad',blocks:[
      {key:'hero',label:'Resumo do Squad',selector:'#teamContent > .team-hero'},
      {key:'kpis',label:'Indicadores do Squad',selector:'#teamContent > .team-kpis'},
      {key:'leaderboard',label:'Ranking completo',selector:'#teamContent > .leaderboard-card'},
      {key:'history',label:'Histórico dos técnicos',selector:'#teamContent > .team-history-section'},
      {key:'sector',label:'Consolidado do setor',selector:'#teamContent > .team-sector-overview'}
    ]},
    indicators:{label:'Indicadores',blocks:[
      {key:'executiveKpis',label:'KPIs executivos',selector:'#indicatorPerformancePanel > .indicator-kpis'},
      {key:'predictive',label:'Gestão preditiva',selector:'#indicatorPerformancePanel > .predictive-management-section'},
      {key:'financeRanking',label:'Ranking de bonificação',selector:'#indicatorPerformancePanel > .indicator-finance-ranking-card'},
      {key:'sector',label:'Consolidado por Squad',selector:'#indicatorPerformancePanel > .indicator-sector-overview'},
      {key:'statusMonthly',label:'Status e avaliação por grupo',selector:'#indicatorPerformancePanel > .indicator-grid:not(.bottom-grid)'},
      {key:'weeklyInsights',label:'Visão semanal e insights',selector:'#indicatorPerformancePanel > .bottom-grid'},
      {key:'history',label:'Evolução histórica',selector:'#indicatorPerformancePanel > .indicator-history-section'}
    ]}
  };

  function normalizeRole(role){
    const value=String(role||'').trim();
    if(value==='super_admin'||value==='squad_admin')return 'super_admin';
    return 'technician';
  }
  function permissionDefinition(key){return PERMISSIONS.find(p=>p.key===key)||null}
  function defaultPermissions(role){
    const normalized=normalizeRole(role),out={};
    for(const p of PERMISSIONS)out[p.key]=p.roles.includes(normalized);
    return out;
  }
  function normalizePermissionOverrides(overrides){
    const out={};
    const raw=overrides&&typeof overrides==='object'?overrides:{};
    for(const p of PERMISSIONS)if(typeof raw[p.key]==='boolean')out[p.key]=raw[p.key];
    return out;
  }
  function effectivePermissions(role,overrides){
    const normalized=normalizeRole(role),base=defaultPermissions(normalized),raw=normalizePermissionOverrides(overrides),out={};
    for(const p of PERMISSIONS){
      // Administradores sempre possuem acesso administrativo completo.
      // Overrides continuam existindo somente para restringir recursos do Técnico.
      out[p.key]=normalized==='super_admin'?base[p.key]:(base[p.key]&&raw[p.key]!==false);
    }
    return out;
  }
  function can(role,overrides,key){return effectivePermissions(role,overrides)[key]===true}
  function permissionGroups(role){
    const base=defaultPermissions(normalizeRole(role)),groups={};
    for(const p of PERMISSIONS){
      if(!base[p.key])continue;
      (groups[p.section]||(groups[p.section]=[])).push({...p});
    }
    return groups;
  }
  function normalizeLayout(view,layout){
    const def=LAYOUTS[view];if(!def)return{order:[],hidden:[],density:'comfortable',sizes:{}};
    const keys=def.blocks.map(b=>b.key),raw=layout&&typeof layout==='object'?layout:{};
    const order=[];
    for(const key of Array.isArray(raw.order)?raw.order:[])if(keys.includes(key)&&!order.includes(key))order.push(key);
    for(const key of keys)if(!order.includes(key))order.push(key);
    const hidden=(Array.isArray(raw.hidden)?raw.hidden:[]).filter(k=>keys.includes(k));
    const density=['compact','comfortable'].includes(raw.density)?raw.density:'comfortable';
    const sizes={};
    for(const block of def.blocks){
      const allowed=Array.isArray(block.sizes)&&block.sizes.length?block.sizes:['full'];
      const fallback=allowed.includes(block.defaultSize)?block.defaultSize:allowed[0];
      sizes[block.key]=allowed.includes(raw.sizes?.[block.key])?raw.sizes[block.key]:fallback;
    }
    return{order,hidden,density,sizes};
  }
  function normalizeNavigation(navigation){
    const raw=navigation&&typeof navigation==='object'?navigation:{};
    const groups={},subgroups={};
    for(const key of Object.keys(NAVIGATION_DEFAULTS.groups))groups[key]=typeof raw.groups?.[key]==='boolean'?raw.groups[key]:NAVIGATION_DEFAULTS.groups[key];
    for(const key of Object.keys(NAVIGATION_DEFAULTS.subgroups))subgroups[key]=typeof raw.subgroups?.[key]==='boolean'?raw.subgroups[key]:NAVIGATION_DEFAULTS.subgroups[key];
    return{sidebarCollapsed:raw.sidebarCollapsed===true,groups,subgroups};
  }
  function normalizePreferences(preferences){
    const raw=preferences&&typeof preferences==='object'?preferences:{};
    const layouts={};
    for(const view of Object.keys(LAYOUTS))layouts[view]=normalizeLayout(view,raw.layouts?.[view]);
    return{version:3,layouts,navigation:normalizeNavigation(raw.navigation)};
  }
  function defaultPreferences(){return normalizePreferences({})}
  function layoutDefinition(view){return LAYOUTS[view]||null}
  function moveBlock(view,layout,key,direction){
    const next=normalizeLayout(view,layout),i=next.order.indexOf(key),j=i+(direction==='up'?-1:1);
    if(i<0||j<0||j>=next.order.length)return next;
    [next.order[i],next.order[j]]=[next.order[j],next.order[i]];return next;
  }
  function toggleBlock(view,layout,key,visible){
    const next=normalizeLayout(view,layout),set=new Set(next.hidden);
    if(visible)set.delete(key);else set.add(key);next.hidden=[...set];return next;
  }
  function setBlockSize(view,layout,key,size){
    const next=normalizeLayout(view,layout),def=LAYOUTS[view],block=def?.blocks?.find(b=>b.key===key);
    if(!block)return next;
    const allowed=Array.isArray(block.sizes)&&block.sizes.length?block.sizes:['full'];
    if(allowed.includes(size))next.sizes[key]=size;
    return next;
  }
  return{PERMISSIONS,LAYOUTS,NAVIGATION_DEFAULTS,normalizeRole,permissionDefinition,defaultPermissions,normalizePermissionOverrides,effectivePermissions,can,permissionGroups,normalizeLayout,normalizeNavigation,normalizePreferences,defaultPreferences,layoutDefinition,moveBlock,toggleBlock,setBlockSize};
});
