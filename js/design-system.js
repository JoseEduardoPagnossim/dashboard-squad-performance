(function(root){
  'use strict';

  const VERSION='DS-1.1';
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

  let openSelectControl=null;
  const selectControllers=new WeakMap();
  const activeSelectControllers=new Set();

  function selectOptionSignature(select){
    return [...(select?.options||[])].map((option,index)=>`${index}:${option.value}:${option.textContent}:${option.disabled?'1':'0'}`).join('||');
  }

  function selectDisplayLabel(select){
    const option=select?.options?.[select.selectedIndex];
    return option?.textContent?.trim()||select?.getAttribute?.('placeholder')||'Selecione';
  }

  function cleanupSelectController(controller){
    if(!controller)return;
    if(controller===openSelectControl)closeSelectControl(controller);
    controller.menu?.remove();controller.proxy?.remove();
    if(controller.select)selectControllers.delete(controller.select);
    activeSelectControllers.delete(controller);
  }

  function closeSelectControl(controller=openSelectControl){
    if(!controller)return;
    controller.proxy?.classList.remove('open');
    controller.trigger?.setAttribute('aria-expanded','false');
    controller.menu?.classList.remove('open','open-up');
    controller.menu?.setAttribute('aria-hidden','true');
    controller.menu?.style.removeProperty('--ds-select-left');
    controller.menu?.style.removeProperty('--ds-select-top');
    controller.menu?.style.removeProperty('--ds-select-width');
    controller.menu?.style.removeProperty('--ds-select-max-height');
    if(controller===openSelectControl)openSelectControl=null;
  }

  function positionSelectMenu(controller){
    const {trigger,menu}=controller;if(!trigger||!menu)return;
    const rect=trigger.getBoundingClientRect();
    const margin=8,maxHeight=Math.min(300,Math.max(140,window.innerHeight-24));
    const below=Math.max(0,window.innerHeight-rect.bottom-margin),above=Math.max(0,rect.top-margin);
    const openUp=below<Math.min(220,maxHeight)&&above>below;
    const height=Math.min(maxHeight,openUp?above:below);
    const width=Math.max(rect.width,Math.min(360,Math.max(180,menu.scrollWidth||rect.width)));
    const maxLeft=Math.max(margin,window.innerWidth-width-margin);
    const left=Math.min(Math.max(margin,rect.left),maxLeft);
    const top=openUp?Math.max(margin,rect.top-height-margin):Math.min(window.innerHeight-margin,rect.bottom+6);
    menu.classList.toggle('open-up',openUp);
    menu.style.setProperty('--ds-select-left',`${left}px`);
    menu.style.setProperty('--ds-select-top',`${top}px`);
    menu.style.setProperty('--ds-select-width',`${width}px`);
    menu.style.setProperty('--ds-select-max-height',`${Math.max(110,height)}px`);
  }

  function rebuildSelectMenu(controller){
    const {select,menu}=controller;if(!select||!menu)return;
    const fragment=document.createDocumentFragment();
    [...select.options].forEach((option,index)=>{
      const item=document.createElement('button');
      item.type='button';item.className='ds-select-option';item.setAttribute('role','option');item.dataset.optionIndex=String(index);
      item.textContent=option.textContent||option.label||option.value;item.disabled=Boolean(option.disabled);
      const selected=index===select.selectedIndex;item.setAttribute('aria-selected',selected?'true':'false');item.classList.toggle('selected',selected);
      item.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        if(item.disabled||select.disabled)return;
        const previous=select.selectedIndex;
        select.selectedIndex=index;
        syncSelectControl(select,{rebuild:false});
        closeSelectControl(controller);
        controller.trigger?.focus();
        if(previous!==index){
          select.dispatchEvent(new Event('input',{bubbles:true}));
          select.dispatchEvent(new Event('change',{bubbles:true}));
        }
        queueMicrotask(()=>syncSelectControl(select,{rebuild:true}));
      });
      fragment.appendChild(item);
    });
    menu.replaceChildren(fragment);
    controller.signature=selectOptionSignature(select);
  }

  function syncSelectControl(select,{rebuild=false}={}){
    const controller=selectControllers.get(select);if(!controller)return;
    const {trigger,menu,proxy}=controller;
    const signature=selectOptionSignature(select);
    if(rebuild||signature!==controller.signature)rebuildSelectMenu(controller);
    const label=selectDisplayLabel(select);const value=trigger?.querySelector('.ds-select-value');if(value)value.textContent=label;
    if(trigger){trigger.disabled=Boolean(select.disabled);trigger.setAttribute('aria-disabled',select.disabled?'true':'false');trigger.title=label;}
    proxy?.classList.toggle('disabled',Boolean(select.disabled));
    [...(menu?.querySelectorAll('.ds-select-option')||[])].forEach((item,index)=>{
      const selected=index===select.selectedIndex;item.classList.toggle('selected',selected);item.setAttribute('aria-selected',selected?'true':'false');
      if(select.options?.[index])item.disabled=Boolean(select.options[index].disabled);
    });
    if(controller===openSelectControl)positionSelectMenu(controller);
  }

  function openSelect(select){
    const controller=selectControllers.get(select);if(!controller||select.disabled)return;
    if(openSelectControl&&openSelectControl!==controller)closeSelectControl(openSelectControl);
    syncSelectControl(select,{rebuild:true});
    controller.proxy.classList.add('open');controller.trigger.setAttribute('aria-expanded','true');controller.menu.classList.add('open');controller.menu.setAttribute('aria-hidden','false');
    openSelectControl=controller;positionSelectMenu(controller);
    requestAnimationFrame(()=>controller.menu.querySelector('.ds-select-option.selected')?.scrollIntoView?.({block:'nearest'}));
  }

  function focusSelectOption(controller,direction){
    const items=[...controller.menu.querySelectorAll('.ds-select-option:not(:disabled)')];if(!items.length)return;
    const active=document.activeElement;let index=items.indexOf(active);
    if(direction==='first')index=0;else if(direction==='last')index=items.length-1;else if(direction==='next')index=Math.min(items.length-1,index<0?0:index+1);else if(direction==='prev')index=Math.max(0,index<0?items.length-1:index-1);
    items[index]?.focus();
  }

  function enhanceSelect(select){
    if(!select||select.dataset.dsSelectReady==='1')return;
    select.dataset.dsSelectReady='1';select.classList.add('ds-select-control','ds-select-source');
    const proxy=document.createElement('span');proxy.className='ds-select-proxy';proxy.dataset.forSelect=select.id||'';
    const trigger=document.createElement('button');trigger.type='button';trigger.className='ds-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    const accessible=select.getAttribute('aria-label')||select.closest('label')?.querySelector(':scope > span')?.textContent?.trim()||select.name||select.id||'Selecionar opção';
    trigger.setAttribute('aria-label',accessible);trigger.innerHTML='<span class="ds-select-value"></span><i class="ds-select-chevron" aria-hidden="true"></i>';
    proxy.appendChild(trigger);select.insertAdjacentElement('afterend',proxy);
    const menu=document.createElement('div');menu.className='ds-select-menu ds-select-portal';menu.setAttribute('role','listbox');menu.setAttribute('aria-hidden','true');document.body.appendChild(menu);
    const controller={select,proxy,trigger,menu,signature:''};selectControllers.set(select,controller);activeSelectControllers.add(controller);

    trigger.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openSelectControl===controller?closeSelectControl(controller):openSelect(select)});
    trigger.addEventListener('keydown',event=>{
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();if(openSelectControl!==controller)openSelect(select);
        focusSelectOption(controller,event.key==='ArrowDown'?'next':event.key==='ArrowUp'?'prev':event.key==='Home'?'first':'last');
      }else if(event.key==='Escape'){event.preventDefault();closeSelectControl(controller)}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();openSelectControl===controller?closeSelectControl(controller):openSelect(select)}
    });
    menu.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();closeSelectControl(controller);trigger.focus();return}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'||event.key==='Home'||event.key==='End'){
        event.preventDefault();focusSelectOption(controller,event.key==='ArrowDown'?'next':event.key==='ArrowUp'?'prev':event.key==='Home'?'first':'last');
      }
    });
    select.addEventListener('change',()=>syncSelectControl(select,{rebuild:true}));select.addEventListener('input',()=>syncSelectControl(select,{rebuild:true}));
    const label=select.closest('label');
    if(label&&!label.dataset.dsSelectLabelReady){
      label.dataset.dsSelectLabelReady='1';label.addEventListener('click',event=>{
        if(event.target.closest?.('.ds-select-proxy')||event.target.closest?.('button,a,input,textarea'))return;
        event.preventDefault();trigger.focus();openSelect(select);
      });
    }
    syncSelectControl(select,{rebuild:true});
  }

  function syncAllSelectControls({rebuild=false}={}){
    for(const controller of [...activeSelectControllers]){
      if(!controller.select?.isConnected){cleanupSelectController(controller);continue}
      if(!controller.proxy?.isConnected){controller.select.dataset.dsSelectReady='';activeSelectControllers.delete(controller);selectControllers.delete(controller.select);enhanceSelect(controller.select);continue}
      syncSelectControl(controller.select,{rebuild});
    }
  }

  if(typeof document!=='undefined'){
    document.addEventListener('click',event=>{
      if(!openSelectControl)return;
      const c=openSelectControl;if(event.target.closest?.('.ds-select-proxy')===c.proxy||c.menu.contains(event.target))return;closeSelectControl(c);
    },true);
    document.addEventListener('change',event=>{if(event.target?.matches?.('select[data-ds-select-ready="1"]'))syncSelectControl(event.target,{rebuild:true})},true);
    window.addEventListener('resize',()=>openSelectControl?positionSelectMenu(openSelectControl):syncAllSelectControls(),{passive:true});
    window.addEventListener('scroll',()=>{if(openSelectControl)closeSelectControl(openSelectControl)},{passive:true,capture:true});
    window.setInterval(()=>{if(!document.hidden)syncAllSelectControls()},350);
  }

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
        const targetSelect=mutation.target?.tagName==='SELECT'?mutation.target:mutation.target?.closest?.('select');
        if(targetSelect)selectsToSync.add(targetSelect);
        for(const node of mutation.addedNodes||[]){
          if(node.nodeType!==1)continue;
          if(node.matches?.('table')||node.querySelector?.('table'))hasTable=true;
          if(node.matches?.('input,select,textarea')||node.querySelector?.('input,select,textarea'))hasControl=true;
          const owner=node.closest?.('select');if(owner)selectsToSync.add(owner);
        }
      }
      if((hasTable||hasControl||needsColorSync||selectsToSync.size)&&!queued){
        queued=true;
        requestAnimationFrame(()=>{
          queued=false;
          if(hasTable)document.querySelectorAll('.table-wrap table,.status-matrix-scroll table').forEach(enhanceTable);
          if(hasControl)enhanceControls(document);
          if(needsColorSync)document.querySelectorAll('input[type="color"]').forEach(syncColorTrigger);
          selectsToSync.forEach(select=>syncSelectControl(select,{rebuild:true}));
        });
      }
    });
    observer.observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled','selected','label','value']});
  }

  function boot(){refresh();observeDynamicTables()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  root.SoftenDesignSystem=Object.freeze({VERSION,enhance,enhanceTable,enhanceControls,syncSelects:syncAllSelectControls,refresh});
})(window);
