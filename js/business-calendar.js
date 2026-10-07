(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SoftenBusinessCalendar=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const NATIONAL_FIXED=[
    ['01-01','Confraternização Universal'],
    ['04-21','Tiradentes'],
    ['05-01','Dia do Trabalho'],
    ['09-07','Independência do Brasil'],
    ['10-12','Nossa Senhora Aparecida'],
    ['11-02','Finados'],
    ['11-15','Proclamação da República'],
    ['11-20','Dia Nacional de Zumbi e da Consciência Negra'],
    ['12-25','Natal']
  ];
  const TYPES=new Set(['national','state','municipal','company']);

  function pad(v){return String(Math.trunc(Number(v)||0)).padStart(2,'0')}
  function dateKey(year,month,day){return `${Math.trunc(Number(year)||0)}-${pad(month)}-${pad(day)}`}
  function parseDateKey(value){
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;
    const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
    if(year<2020||year>2100||month<1||month>12||day<1||day>new Date(year,month,0).getDate())return null;
    return{year,month,day,key:dateKey(year,month,day)};
  }
  function normalizeException(row={}){
    const parsed=parseDateKey(row.date||row.day||row.key);if(!parsed)return null;
    const type=TYPES.has(String(row.type||'').toLowerCase())?String(row.type).toLowerCase():'company';
    return{
      id:row.id||null,date:parsed.key,description:String(row.description||row.name||'Dia não útil').trim()||'Dia não útil',
      type,active:row.active!==false,builtIn:row.builtIn===true||row.built_in===true,source:row.source||null,
      createdAt:row.created_at||row.createdAt||null,updatedAt:row.updated_at||row.updatedAt||null
    };
  }
  function nationalFixedHolidays(year){
    year=Math.trunc(Number(year)||0);if(year<2020||year>2100)return[];
    return NATIONAL_FIXED.map(([md,description])=>normalizeException({date:`${year}-${md}`,description,type:'national',active:true,builtIn:true,source:'national-default'}));
  }
  function mergeYearExceptions(year,persisted=[]){
    const map=new Map(nationalFixedHolidays(year).map(row=>[row.date,row]));
    for(const raw of persisted||[]){const row=normalizeException(raw);if(!row)continue;const parsed=parseDateKey(row.date);if(parsed.year!==Number(year))continue;map.set(row.date,{...(map.get(row.date)||{}),...row,builtIn:(map.get(row.date)?.builtIn===true)||row.builtIn===true});}
    return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  function isWeekday(year,month,day){const dow=new Date(Number(year),Number(month)-1,Number(day)).getDay();return dow>=1&&dow<=5}
  function weekdayCount(year,month,latestDay){
    const max=new Date(Number(year),Number(month),0).getDate(),limit=Math.min(max,Math.max(0,Math.trunc(Number(latestDay)||0)));let count=0;
    for(let day=1;day<=limit;day++)if(isWeekday(year,month,day))count++;
    return count;
  }
  function operationalSummary({year,month,latestDay,exceptions=[]}={}){
    year=Number(year);month=Number(month);const max=new Date(year,month,0).getDate(),limit=Math.min(max,Math.max(0,Math.trunc(Number(latestDay)||0))),weekdays=weekdayCount(year,month,limit),seen=new Set(),effective=[];
    for(const raw of exceptions||[]){const row=normalizeException(raw);if(!row||!row.active||seen.has(row.date))continue;const parsed=parseDateKey(row.date);if(!parsed||parsed.year!==year||parsed.month!==month||parsed.day>limit||!isWeekday(year,month,parsed.day))continue;seen.add(row.date);effective.push({...row,day:parsed.day});}
    effective.sort((a,b)=>a.date.localeCompare(b.date));
    return{year,month,latestDay:limit,weekdays,excludedCount:effective.length,businessDays:Math.max(0,weekdays-effective.length),exceptions:effective};
  }
  return{NATIONAL_FIXED,dateKey,parseDateKey,normalizeException,nationalFixedHolidays,mergeYearExceptions,isWeekday,weekdayCount,operationalSummary};
});
