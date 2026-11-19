/* R30.6 — Soften Date Controls: visual de calendário uniforme, preservando inputs nativos como fonte de dados. */
(function () {
  'use strict';
  const types = ['date', 'month', 'datetime-local'];
  const selector = types.map(type => `input[type="${type}"]`).join(',');
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const format2 = n => String(n).padStart(2,'0');
  let openField = null;
  let viewYear = 0;
  let viewMonth = 0;
  let selectedDate = '';
  let hour = '12';
  let minute = '00';
  let popup;
  const instances = new WeakMap();

  function formatValue(input) {
    const val = input.value;
    if (!val) return input.type === 'month' ? 'Selecione a competência' : input.type === 'datetime-local' ? 'Selecione data e horário' : 'Selecione a data';
    const [ymd, tm] = val.split('T');
    const [y,m,d] = ymd.split('-');
    if (!y || !m) return val;
    return input.type === 'month' ? `${monthNames[Number(m)-1] || m} de ${y}` : `${d || '01'}/${m}/${y}${tm ? ' às ' + tm.slice(0,5) : ''}`;
  }

  function sync(input) {
    const obj = instances.get(input);
    if (!obj) return;
    obj.button.textContent = formatValue(input);
    obj.button.classList.toggle('is-empty', !input.value);
  }

  function valueWithinBounds(input, value) {
    if (!value) return true;
    const compare = input.type === 'datetime-local' ? value : value.slice(0,input.type === 'month' ? 7 : 10);
    const low = input.min && input.min.slice(0,compare.length);
    const high = input.max && input.max.slice(0,compare.length);
    return (!low || compare >= low) && (!high || compare <= high);
  }

  function setup(input) {
    if (instances.has(input) || input.closest('.ds-date-control')) return;
    const labelText = (input.closest('label')?.querySelector('span')?.textContent || input.getAttribute('aria-label') || 'Selecionar data').trim();
    const shell = document.createElement('span');
    shell.className = 'ds-date-control';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ds-date-trigger';
    button.setAttribute('aria-label', labelText);
    button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-expanded','false');
    input.parentNode.insertBefore(shell,input);
    shell.appendChild(input);
    shell.appendChild(button);
    // Os dois alvos (texto e icone) pertencem somente ao trigger personalizado.
    // O input segue como fonte de valor, mas nunca recebe clique nem abre showPicker().
    input.setAttribute('aria-hidden','true');
    input.classList.add('ds-date-source');
    input.tabIndex = -1;
    instances.set(input,{button});
    // Valores continuam sendo os originais, inclusive atribuições feitas pelos módulos.
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    if (descriptor?.get && descriptor?.set && !Object.hasOwn(input,'value')) {
      Object.defineProperty(input,'value',{
        configurable:true,
        get(){return descriptor.get.call(this)},
        set(v){descriptor.set.call(this,v);sync(this)}
      });
    }
    input.addEventListener('change',()=>sync(input));
    input.addEventListener('input',()=>sync(input));
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open(input)});
    shell.addEventListener('pointerdown',event=>{
      if(event.target===input){event.preventDefault();open(input)}
    },true);
    sync(input);
  }

  function ensurePopup() {
    if (popup) return;
    popup = document.createElement('div');
    popup.className = 'ds-date-dialog hidden';
    popup.setAttribute('role','dialog');
    popup.setAttribute('aria-modal','true');
    popup.setAttribute('aria-label','Calendário Soften');
    document.body.appendChild(popup);
    popup.addEventListener('click', event => {
      const action = event.target.closest('[data-date-action]');
      if (!action || !openField) return;
      const act = action.dataset.dateAction;
      if (act === 'close') return close();
      if (act === 'prev' || act === 'next') {
        const next = new Date(viewYear,viewMonth - 1 + (act === 'next' ? 1 : -1),1);
        viewYear = next.getFullYear(); viewMonth = next.getMonth()+1;
        if (openField.type === 'month') selectedDate = `${viewYear}-${format2(viewMonth)}-01`;
        render(); return;
      }
      if (act === 'day') { selectedDate = action.dataset.value; render(); return; }
      if (act === 'month') { viewMonth = Number(action.dataset.value); selectedDate = `${viewYear}-${format2(viewMonth)}-${format2(Math.min(Number(selectedDate.slice(-2))||1,new Date(viewYear,viewMonth,0).getDate()))}`; render(); return; }
      if (act === 'today') { const now = new Date(); viewYear=now.getFullYear(); viewMonth=now.getMonth()+1; selectedDate=`${viewYear}-${format2(viewMonth)}-${format2(now.getDate())}`;render();return; }
      if (act === 'clear') { if (!openField.required) commit(''); return; }
      if (act === 'apply') {
        const dateVal = openField.type === 'month' ? selectedDate.slice(0,7) : selectedDate;
        const val = openField.type === 'datetime-local' ? `${dateVal}T${hour}:${minute}` : dateVal;
        if (!valueWithinBounds(openField,val)) return;
        commit(val);
      }
    });
    popup.addEventListener('change', event => {
      if (event.target.dataset.dateHour !== undefined) hour=event.target.value;
      if (event.target.dataset.dateMinute !== undefined) minute=event.target.value;
      if (event.target.dataset.dateYear !== undefined) {
        const y=Number(event.target.value);
        if (Number.isInteger(y) && y>=1900 && y<=2100) {viewYear=y;render()}
      }
    });
    document.addEventListener('keydown',event => {if(event.key==='Escape' && openField){event.preventDefault();close();}});
    document.addEventListener('pointerdown',event => {
      if (!openField || popup.contains(event.target) || instances.get(openField)?.button.contains(event.target)) return;
      close();
    },true);
  }

  function open(input) {
    if (input.disabled) return;
    ensurePopup();
    if (openField && openField !== input) close();
    openField=input;
    const value = input.value || '';
    const now = new Date();
    const parts=value.slice(0,10).split('-');
    viewYear=Number(parts[0])||now.getFullYear();
    viewMonth=Number(parts[1])||now.getMonth()+1;
    selectedDate = `${viewYear}-${format2(viewMonth)}-${format2(Number(parts[2])||1)}`;
    hour=(value.split('T')[1] || '').slice(0,2) || format2(now.getHours());
    minute=(value.split('T')[1] || '').slice(3,5) || '00';
    popup.classList.remove('hidden');
    document.body.classList.add('ds-date-open');
    instances.get(input).button.setAttribute('aria-expanded','true');
    render();
    popup.querySelector('[data-date-action="close"]')?.focus();
  }
  function close() {
    if (!openField) return;
    const button=instances.get(openField)?.button;
    if (button) button.setAttribute('aria-expanded','false');
    openField=null;
    popup?.classList.add('hidden');
    document.body.classList.remove('ds-date-open');
    button?.focus();
  }
  function commit(val) {
    const input=openField;
    if (!input) return;
    input.value=val;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    close();
  }
  function render() {
    if (!openField) return;
    const isMonth = openField.type==='month';
    const before = new Date(viewYear,viewMonth-1,1).getDay();
    const days = new Date(viewYear,viewMonth,0).getDate();
    let items = '';
    if (isMonth) {
      items = `<div class="ds-date-months">${monthNames.map((m,i)=>{
        const v=`${viewYear}-${format2(i+1)}`;
        return `<button type="button" data-date-action="month" data-value="${i+1}" class="${selectedDate.slice(0,7)===v?'selected':''}" ${valueWithinBounds(openField,v)?'':'disabled'}>${m.slice(0,3)}</button>`;
      }).join('')}</div>`;
    } else {
      items = `<div class="ds-date-weekdays">${['D','S','T','Q','Q','S','S'].map(x=>`<span>${x}</span>`).join('')}</div><div class="ds-date-days">${'<span></span>'.repeat(before)}${Array.from({length:days},(_,i)=>{
        const v=`${viewYear}-${format2(viewMonth)}-${format2(i+1)}`;
        return `<button type="button" data-date-action="day" data-value="${v}" class="${selectedDate===v?'selected':''}" ${valueWithinBounds(openField,v)?'':'disabled'}>${i+1}</button>`;
      }).join('')}</div>`;
    }
    const times = openField.type==='datetime-local' ? `<div class="ds-date-time"><label>Hora <select data-date-hour>${Array.from({length:24},(_,i)=>`<option value="${format2(i)}" ${hour===format2(i)?'selected':''}>${format2(i)}</option>`).join('')}</select></label><label>Minuto <select data-date-minute>${Array.from({length:60},(_,i)=>`<option value="${format2(i)}" ${minute===format2(i)?'selected':''}>${format2(i)}</option>`).join('')}</select></label></div>` : '';
    popup.innerHTML=`<div class="ds-date-dialog-panel"><div class="ds-date-dialog-head"><strong>${isMonth?'Selecionar competência':'Selecionar data'}${openField.type==='datetime-local'?' e horário':''}</strong><button type="button" data-date-action="close" aria-label="Fechar calendário">×</button></div><div class="ds-date-dialog-body"><div class="ds-date-nav"><button type="button" data-date-action="prev" aria-label="Mês anterior">‹</button><span class="ds-date-nav-current"><strong>${monthNames[viewMonth-1]}</strong><input type="number" data-date-year aria-label="Ano" min="1900" max="2100" step="1" value="${viewYear}"></span><button type="button" data-date-action="next" aria-label="Próximo mês">›</button></div>${items}${times}</div><div class="ds-date-dialog-foot"><button type="button" data-date-action="today">Hoje</button>${openField.required?'':'<button type="button" data-date-action="clear">Limpar</button>'}<button type="button" class="primary" data-date-action="apply">Aplicar</button></div></div>`;
  }
  function scan(root=document) {if(root.matches?.(selector))setup(root);root.querySelectorAll?.(selector).forEach(setup)}
  function start(){scan();const observer=new MutationObserver(mutations=>mutations.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)})));observer.observe(document.body,{subtree:true,childList:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
