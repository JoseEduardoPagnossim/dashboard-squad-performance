(function(root){
  'use strict';

  const VERSION='DS-1.0';
  const KPI_SELECTORS=[
    '.kpi','.indicator-kpi','.home-kpi-card','.feedback-stat','.performance-kpi',
    '.predictive-kpi','.financial-impact-kpi','.tv-monitor-stat','.team-kpi'
  ];
  const ANALYSIS_SELECTORS=[
    '.chart-card','.history-chart-card','.business-days-chart-card','.business-days-table-card',
    '.detail-ranking-card','.leaderboard-card','.compact-ranking','.daily-card'
  ];
  const CONFIG_SELECTORS=[
    '.settings-card','.admin-card','.finance-admin-card','.profile-account-card','.profile-password-card',
    '.profile-avatar-card','.import-center-card'
  ];

  function inferTableLabel(table){
    const card=table.closest('.card,.modal-card,section');
    const title=card?.querySelector('.section-title h2,.section-title h3,h2,h3');
    return (title?.textContent||'Tabela de dados').trim();
  }

  function enhanceTable(table){
    if(!table||table.dataset.dsReady==='1')return table;
    table.dataset.dsReady='1';
    table.classList.add('ds-table');
    const headers=[...table.querySelectorAll('thead th')];
    const count=headers.length;
    if(count>=7)table.classList.add('ds-table-wide');
    if(count>=9)table.classList.add('ds-table-dense');
    if(count>=12)table.classList.add('ds-table-compact');
    const wrap=table.closest('.table-wrap,.status-matrix-scroll');
    if(wrap){
      wrap.classList.add('ds-table-shell');
      const scrollable=table.scrollWidth>wrap.clientWidth||count>=7;
      if(scrollable){
        wrap.classList.add('ds-scrollable');
        if(!wrap.hasAttribute('tabindex'))wrap.tabIndex=0;
        if(!wrap.hasAttribute('aria-label'))wrap.setAttribute('aria-label',inferTableLabel(table));
      }
    }
    return table;
  }

  function addCardType(selector,className){
    document.querySelectorAll(selector).forEach(card=>card.classList.add(className));
  }

  function enhance(rootNode=document){
    document.documentElement.dataset.designSystem=VERSION;
    rootNode.querySelectorAll?.('.table-wrap table,.status-matrix-scroll table').forEach(enhanceTable);
    addCardType(KPI_SELECTORS.join(','),'ds-card-kpi');
    addCardType(ANALYSIS_SELECTORS.join(','),'ds-card-analysis');
    addCardType(CONFIG_SELECTORS.join(','),'ds-card-config');
    rootNode.querySelectorAll?.('button.card,[role="button"].card,.home-squad-card').forEach(el=>el.classList.add('ds-card-interactive'));
    rootNode.querySelectorAll?.('.admin-note,.detail-note-card,.financial-impact-disclaimer,.profile-security-note').forEach(el=>el.classList.add('ds-card-muted'));
  }

  function refresh(){enhance(document)}

  function observeDynamicTables(){
    const target=document.getElementById('appShell');
    if(!target||typeof MutationObserver==='undefined')return;
    let queued=false;
    const observer=new MutationObserver(mutations=>{
      let hasTable=false;
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType!==1)continue;
          if(node.matches?.('table')||node.querySelector?.('table')){hasTable=true;break}
        }
        if(hasTable)break;
      }
      if(hasTable&&!queued){
        queued=true;
        requestAnimationFrame(()=>{queued=false;target.querySelectorAll('.table-wrap table,.status-matrix-scroll table').forEach(enhanceTable)});
      }
    });
    observer.observe(target,{childList:true,subtree:true});
  }

  function boot(){refresh();observeDynamicTables()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  root.SoftenDesignSystem=Object.freeze({VERSION,enhance,enhanceTable,refresh});
})(window);
