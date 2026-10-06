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

  let openSelectShell=null;

  function closeSelectShell(shell=openSelectShell){
    if(!shell)return;
    shell.classList.remove('open');
    shell.querySelector('.ds-select-trigger')?.setAttribute('aria-expanded','false');
    openSelectShell=shell===openSelectShell?null:openSelectShell;
  }

  function syncSelectControl(select,rebuild=false){
    const shell=select?.closest?.('.ds-select-shell');
    if(!shell)return;
    const trigger=shell.querySelector('.ds-select-trigger');
    const menu=shell.querySelector('.ds-select-menu');
    if(trigger){
      const opt=select.options?.[select.selectedIndex];
      trigger.querySelector('.ds-select-value').textContent=opt?.textContent?.trim()||'Selecione';
      trigger.disabled=Boolean(select.disabled);
      trigger.setAttribute('aria-disabled',select.disabled?'true':'false');
    }
    if(rebuild&&menu){
      menu.innerHTML='';
      [...select.options].forEach((option,index)=>{
        const item=document.createElement('button');
        item.type='button';item.className='ds-select-option';item.setAttribute('role','option');item.dataset.optionIndex=String(index);
        item.textContent=option.textContent;item.disabled=Boolean(option.disabled);
        item.setAttribute('aria-selected',index===select.selectedIndex?'true':'false');
        if(index===select.selectedIndex)item.classList.add('selected');
        item.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();
          if(option.disabled)return;
          select.selectedIndex=index;
          select.dispatchEvent(new Event('input',{bubbles:true}));
          select.dispatchEvent(new Event('change',{bubbles:true}));
          syncSelectControl(select,true);closeSelectShell(shell);shell.querySelector('.ds-select-trigger')?.focus();
        });
        menu.appendChild(item);
      });
    }else if(menu){
      [...menu.querySelectorAll('.ds-select-option')].forEach((item,index)=>{const selected=index===select.selectedIndex;item.classList.toggle('selected',selected);item.setAttribute('aria-selected',selected?'true':'false')});
    }
  }

  function enhanceSelect(select){
    if(!select||select.dataset.dsSelectReady==='1')return;
    select.dataset.dsSelectReady='1';
    const parent=select.parentNode;if(!parent)return;
    const shell=document.createElement('span');shell.className='ds-select-shell';
    parent.insertBefore(shell,select);shell.appendChild(select);
    select.classList.add('ds-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const trigger=document.createElement('button');trigger.type='button';trigger.className='ds-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    trigger.innerHTML='<span class="ds-select-value"></span><i class="ds-select-chevron" aria-hidden="true"></i>';
    const menu=document.createElement('span');menu.className='ds-select-menu';menu.setAttribute('role','listbox');
    shell.appendChild(trigger);shell.appendChild(menu);
    const open=()=>{
      if(select.disabled)return;
      if(openSelectShell&&openSelectShell!==shell)closeSelectShell(openSelectShell);
      syncSelectControl(select,true);shell.classList.add('open');trigger.setAttribute('aria-expanded','true');openSelectShell=shell;
      const rect=shell.getBoundingClientRect();const roomBelow=window.innerHeight-rect.bottom;const menuHeight=Math.min(menu.scrollHeight||260,280);shell.classList.toggle('open-up',roomBelow<menuHeight&&rect.top>roomBelow);
      menu.querySelector('.ds-select-option.selected')?.scrollIntoView?.({block:'nearest'});
    };
    trigger.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();shell.classList.contains('open')?closeSelectShell(shell):open()});
    trigger.addEventListener('keydown',event=>{
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();if(!shell.classList.contains('open'))open();const items=[...menu.querySelectorAll('.ds-select-option:not(:disabled)')];if(!items.length)return;const active=document.activeElement;let idx=items.indexOf(active);if(event.key==='Home')idx=0;else if(event.key==='End')idx=items.length-1;else if(event.key==='ArrowDown')idx=Math.min(items.length-1,idx<0?0:idx+1);else idx=Math.max(0,idx<0?items.length-1:idx-1);items[idx]?.focus()}
      else if(event.key==='Escape'){event.preventDefault();closeSelectShell(shell)}
      else if(event.key==='Enter'||event.key===' '){if(shell.classList.contains('open')&&document.activeElement?.classList?.contains('ds-select-option'))return;event.preventDefault();shell.classList.contains('open')?closeSelectShell(shell):open()}
    });
    menu.addEventListener('keydown',event=>{
      const items=[...menu.querySelectorAll('.ds-select-option:not(:disabled)')];let idx=items.indexOf(document.activeElement);
      if(event.key==='Escape'){event.preventDefault();closeSelectShell(shell);trigger.focus();return}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();idx=event.key==='ArrowDown'?Math.min(items.length-1,idx+1):Math.max(0,idx-1);items[idx]?.focus()}
      if(event.key==='Home'){event.preventDefault();items[0]?.focus()}if(event.key==='End'){event.preventDefault();items.at(-1)?.focus()}
    });
    select.addEventListener('change',()=>syncSelectControl(select,true));select.addEventListener('input',()=>syncSelectControl(select,true));
    const label=shell.closest('label');if(label&&!label.dataset.dsSelectLabelReady){label.dataset.dsSelectLabelReady='1';label.addEventListener('click',event=>{if(event.target.closest?.('.ds-select-shell'))return;event.preventDefault();trigger.focus();trigger.click()})}
    syncSelectControl(select,true);
  }

  function installSelectValueHooks(){
    if(typeof HTMLSelectElement==='undefined'||HTMLSelectElement.prototype.__dsValueHooks)return;
    try{
      const valueDesc=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
      const indexDesc=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'selectedIndex');
      if(valueDesc?.get&&valueDesc?.set)Object.defineProperty(HTMLSelectElement.prototype,'value',{configurable:valueDesc.configurable,enumerable:valueDesc.enumerable,get:valueDesc.get,set:function(v){valueDesc.set.call(this,v);queueMicrotask(()=>syncSelectControl(this,true))}});
      if(indexDesc?.get&&indexDesc?.set)Object.defineProperty(HTMLSelectElement.prototype,'selectedIndex',{configurable:indexDesc.configurable,enumerable:indexDesc.enumerable,get:indexDesc.get,set:function(v){indexDesc.set.call(this,v);queueMicrotask(()=>syncSelectControl(this,true))}});
      Object.defineProperty(HTMLSelectElement.prototype,'__dsValueHooks',{value:true,configurable:true});
    }catch(_){/* fallback: change/mutation observers continuam sincronizando */}
  }

  if(typeof document!=='undefined')document.addEventListener('click',event=>{if(openSelectShell&&!event.target.closest?.('.ds-select-shell'))closeSelectShell(openSelectShell)},true);

  function syncColorTrigger(input){
    const trigger=input?.nextElementSibling?.classList?.contains('ds-color-trigger')?input.nextElementSibling:null;
    if(trigger)trigger.style.setProperty('--ds-color-value',input.value||'#000000');
  }

  function enhanceColorInput(input){
    if(!input||input.dataset.dsControlReady==='1')return;
    input.dataset.dsControlReady='1';
    input.classList.add('ds-color-source');
    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='ds-color-trigger';
    trigger.setAttribute('aria-label',input.getAttribute('aria-label')||'Escolher cor');
    trigger.innerHTML='<i aria-hidden="true"></i>';
    input.insertAdjacentElement('afterend',trigger);
    const sync=()=>syncColorTrigger(input);
    trigger.addEventListener('click',()=>{sync();try{if(typeof input.showPicker==='function')input.showPicker();else input.click()}catch(_){input.click()}});
    input.addEventListener('input',sync);input.addEventListener('change',sync);sync();
  }

  function enhancePickerInput(input){
    if(!input||input.dataset.dsControlReady==='1'||input.classList.contains('native-date-picker'))return;
    input.dataset.dsControlReady='1';
    const parent=input.parentNode;if(!parent)return;
    const shell=document.createElement('span');shell.className='ds-picker-shell';
    parent.insertBefore(shell,input);shell.appendChild(input);
    const trigger=document.createElement('button');trigger.type='button';trigger.className='ds-picker-button';trigger.setAttribute('aria-label','Abrir seletor');trigger.innerHTML='▣';shell.appendChild(trigger);
    trigger.addEventListener('click',()=>{try{if(typeof input.showPicker==='function')input.showPicker();else input.focus()}catch(_){input.focus()}});
  }

  function enhanceControl(control){
    if(!control||control.nodeType!==1)return;
    const tag=control.tagName?.toLowerCase();
    if(tag==='select'){control.classList.add('ds-select-control');enhanceSelect(control);return}
    if(tag==='textarea'){control.classList.add('ds-textarea-control');return}
    if(tag!=='input')return;
    const type=(control.type||'text').toLowerCase();
    control.classList.add(`ds-${type}-control`);
    if(type==='color')enhanceColorInput(control);
    if(['date','month','datetime-local'].includes(type))enhancePickerInput(control);
  }

  function enhanceControls(rootNode=document){
    rootNode.querySelectorAll?.('input,select,textarea').forEach(enhanceControl);
  }

  function enhance(rootNode=document){
    document.documentElement.dataset.designSystem=VERSION;
    rootNode.querySelectorAll?.('.table-wrap table,.status-matrix-scroll table').forEach(enhanceTable);
    addCardType(KPI_SELECTORS.join(','),'ds-card-kpi');
    addCardType(ANALYSIS_SELECTORS.join(','),'ds-card-analysis');
    addCardType(CONFIG_SELECTORS.join(','),'ds-card-config');
    rootNode.querySelectorAll?.('button.card,[role="button"].card,.home-squad-card').forEach(el=>el.classList.add('ds-card-interactive'));
    rootNode.querySelectorAll?.('.admin-note,.detail-note-card,.financial-impact-disclaimer,.profile-security-note').forEach(el=>el.classList.add('ds-card-muted'));
    enhanceControls(rootNode);
  }

  function refresh(){enhance(document)}

  function observeDynamicTables(){
    const target=document.body;
    if(!target||typeof MutationObserver==='undefined')return;
    let queued=false;
    const observer=new MutationObserver(mutations=>{
      let hasTable=false,hasControl=false,needsColorSync=false,selectsToSync=new Set();
      for(const mutation of mutations){
        if(mutation.type==='attributes'&&mutation.target?.classList?.contains('theme-modal'))needsColorSync=true;
        if(mutation.target?.tagName==='SELECT')selectsToSync.add(mutation.target);
        for(const node of mutation.addedNodes||[]){
          if(node.nodeType!==1)continue;
          if(node.matches?.('table')||node.querySelector?.('table'))hasTable=true;
          if(node.matches?.('input,select,textarea')||node.querySelector?.('input,select,textarea'))hasControl=true;
        }
      }
      if((hasTable||hasControl||needsColorSync||selectsToSync.size)&&!queued){
        queued=true;
        requestAnimationFrame(()=>{
          queued=false;
          if(hasTable)document.querySelectorAll('.table-wrap table,.status-matrix-scroll table').forEach(enhanceTable);
          if(hasControl)enhanceControls(document);
          if(needsColorSync)document.querySelectorAll('input[type="color"]').forEach(syncColorTrigger);
          selectsToSync.forEach(select=>syncSelectControl(select,true));
        });
      }
    });
    observer.observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  function boot(){installSelectValueHooks();refresh();observeDynamicTables()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  root.SoftenDesignSystem=Object.freeze({VERSION,enhance,enhanceTable,enhanceControls,refresh});
})(window);
