(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SoftenNavigationEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ROUTE_PARAMS=['page','section','module','indicator','squad','month','tech','from','to'];
  const VALID_PAGES=new Set(['home','alerts','individual','team','indicators','presentation','feedbacks','users','audit','admin','settings','profile','my-feedbacks','help']);
  const VALID_ADMIN_SECTIONS=new Set(['operation','finance','costs','appearance']);
  const VALID_SETTINGS_MODULES=new Set(['all','personalization','operation','finance','appearance','presentation','access','system']);
  const VALID_INDICATOR_SECTIONS=new Set(['performance','quality','financial-impact','business-days','detail']);
  function text(value){return String(value??'').trim()}
  function normalizeText(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim()}
  function safePage(value){const page=text(value);return VALID_PAGES.has(page)?page:'home'}
  function normalizeRoute(input={}){
    const page=safePage(input.page),route={page};
    const section=text(input.section),module=text(input.module),indicator=text(input.indicator),squad=text(input.squad).toUpperCase(),month=text(input.month),tech=text(input.tech),from=text(input.from),to=text(input.to);
    if(page==='admin'&&VALID_ADMIN_SECTIONS.has(section))route.section=section;
    if(page==='settings'&&VALID_SETTINGS_MODULES.has(module)&&module!=='all')route.module=module;
    if(page==='indicators'&&VALID_INDICATOR_SECTIONS.has(indicator))route.indicator=indicator;
    if(squad&&(/^[A-Z]$/.test(squad)||squad==='ALL'))route.squad=squad==='ALL'?'all':squad;
    if(/^\d{4}-\d{2}$/.test(month))route.month=month;
    if(tech)route.tech=tech.slice(0,160);
    if(/^\d{4}-\d{2}-\d{2}$/.test(from))route.from=from;
    if(/^\d{4}-\d{2}-\d{2}$/.test(to))route.to=to;
    return route;
  }
  function routeFromSearch(search=''){
    const params=new URLSearchParams(String(search||'').replace(/^\?/,''));
    return normalizeRoute({page:params.get('page')||'home',section:params.get('section'),module:params.get('module'),indicator:params.get('indicator'),squad:params.get('squad'),month:params.get('month'),tech:params.get('tech'),from:params.get('from'),to:params.get('to')});
  }
  function routeFromLocation(locationLike){return routeFromSearch(locationLike?.search||'')}
  function routeUrl(base,routeInput={}){
    const url=base instanceof URL?new URL(base.toString()):new URL(String(base),'https://local.invalid/');
    const route=normalizeRoute(routeInput);
    ROUTE_PARAMS.forEach(key=>url.searchParams.delete(key));
    if(route.page&&route.page!=='home')url.searchParams.set('page',route.page);
    if(route.section)url.searchParams.set('section',route.section);
    if(route.module)url.searchParams.set('module',route.module);
    if(route.indicator)url.searchParams.set('indicator',route.indicator);
    if(route.squad)url.searchParams.set('squad',route.squad);
    if(route.month)url.searchParams.set('month',route.month);
    if(route.tech)url.searchParams.set('tech',route.tech);
    if(route.from)url.searchParams.set('from',route.from);
    if(route.to)url.searchParams.set('to',route.to);
    return url;
  }
  function tokenScore(haystack,needle){
    if(!needle)return 0;
    if(haystack===needle)return 120;
    if(haystack.startsWith(needle))return 80;
    const word=haystack.split(' ').find(x=>x.startsWith(needle));if(word)return 55;
    if(haystack.includes(needle))return 35;
    let hi=0,streak=0,best=0;for(const ch of needle){const idx=haystack.indexOf(ch,hi);if(idx<0)return 0;streak=idx===hi?streak+1:1;best=Math.max(best,streak);hi=idx+1;}return 8+best*2;
  }
  function scoreCommand(command,query){
    const normalized=normalizeText(query);if(!normalized)return Number(command?.priority||0);
    const tokens=normalized.split(/\s+/).filter(Boolean),label=normalizeText(command?.label),description=normalizeText(command?.description),keywords=normalizeText(Array.isArray(command?.keywords)?command.keywords.join(' '):command?.keywords),group=normalizeText(command?.group),hay=[label,keywords,description,group].filter(Boolean);
    let total=0;for(const token of tokens){let best=0;hay.forEach((part,index)=>{const weight=index===0?1.5:index===1?1.2:1;best=Math.max(best,tokenScore(part,token)*weight)});if(best<=0)return -1;total+=best;}if(label.includes(normalized))total+=45;if(keywords.includes(normalized))total+=25;return total+Number(command?.priority||0);
  }
  function searchCommands(commands=[],query='',limit=14){
    return (commands||[]).map((command,index)=>({command,index,score:scoreCommand(command,query)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||Number(b.command?.priority||0)-Number(a.command?.priority||0)||a.index-b.index).slice(0,Math.max(1,Number(limit)||14)).map(x=>x.command);
  }
  return{ROUTE_PARAMS,normalizeText,normalizeRoute,routeFromSearch,routeFromLocation,routeUrl,scoreCommand,searchCommands};
});
