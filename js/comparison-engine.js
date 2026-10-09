(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SoftenComparisonEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function parseIso(value){
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;
    const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]),date=new Date(y,mo-1,d);
    return date.getFullYear()===y&&date.getMonth()===mo-1&&date.getDate()===d?date:null;
  }
  function iso(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  function addDays(value,delta){const d=parseIso(value);if(!d)return null;d.setDate(d.getDate()+Number(delta||0));return iso(d)}
  function daysInclusive(start,end){const a=parseIso(start),b=parseIso(end);if(!a||!b||a>b)return 0;return Math.floor((b-a)/86400000)+1}
  function shiftMonths(value,delta){
    const d=parseIso(value);if(!d)return null;const originalDay=d.getDate(),target=new Date(d.getFullYear(),d.getMonth()+Number(delta||0),1),last=new Date(target.getFullYear(),target.getMonth()+1,0).getDate();target.setDate(Math.min(originalDay,last));return iso(target);
  }
  function range(start,end,mode='previous-month'){
    if(!parseIso(start)||!parseIso(end)||String(start)>String(end))return null;
    if(mode==='previous-period'){
      const span=daysInclusive(start,end);return{start:addDays(start,-span),end:addDays(start,-1),mode};
    }
    return{start:shiftMonths(start,-1),end:shiftMonths(end,-1),mode:'previous-month'};
  }
  function delta(current,previous,{rate=false}={}){
    const c=Number(current)||0,p=Number(previous)||0,difference=c-p;
    if(rate)return{current:c,previous:p,difference,percentage:null,unit:'pp'};
    const percentage=p===0?(c===0?0:null):difference/Math.abs(p);
    return{current:c,previous:p,difference,percentage,unit:'value'};
  }
  function tone(difference,epsilon=1e-9){const n=Number(difference)||0;return Math.abs(n)<=epsilon?'neutral':n>0?'positive':'negative'}

  return{parseIso,iso,addDays,daysInclusive,shiftMonths,range,delta,tone};
});
