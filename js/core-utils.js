/**
 * Utilidades compartilhadas do Soften Performance Hub.
 * Mantidas fora do app principal para reduzir acoplamento e facilitar testes/refatorações.
 */
(() => {
  const safe = n => Number.isFinite(Number(n)) ? Number(n) : 0;
  const clone = obj => JSON.parse(JSON.stringify(obj));

  window.SoftenPerformanceUtils = Object.freeze({
    MONTHS_PT: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
    MONTH_SHEET: {'JANEIRO':1,'FEVEREIRO':2,'MARÇO':3,'MARCO':3,'ABRIL':4,'MAIO':5,'JUNHO':6,'JULHO':7,'AGOSTO':8,'SETEMBRO':9,'OUTUBRO':10,'NOVEMBRO':11,'DEZEMBRO':12},
    $: (selector, root=document) => root.querySelector(selector),
    $$: (selector, root=document) => [...root.querySelectorAll(selector)],
    fmtInt: n => Math.round(Number(n)||0).toLocaleString('pt-BR'),
    fmtPct: n => (Number(n||0)*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%',
    fmtMoney: n => (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),
    fmtNum: n => (Number(n)||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2}),
    clamp: (n,a,b) => Math.min(b,Math.max(a,n)),
    HISTORY_COLORS: Object.freeze(['#f0a33a','#36c98f','#ff4ddb','#e6edf7','#9ea4ad','#2f78ff','#ff3b30','#9b6cff','#22c7d6','#f2c14e','#63d471','#ef7f4d']),
    safe,
    roundTo: (n,decimals=0) => {const f=10**decimals;return Math.round((safe(n)+Number.EPSILON)*f)/f},
    clone,
    firstRelation: v => Array.isArray(v)?(v[0]||{}):(v||{})
  });
})();
