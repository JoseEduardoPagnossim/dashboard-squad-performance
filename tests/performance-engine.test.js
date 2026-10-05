const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../js/performance-engine.js');

test('gera chaves de cache estáveis por squad e competência',()=>{
  assert.equal(engine.monthCacheId('d','2026-10'),'month:D:2026-10:full');
  assert.equal(engine.themeCacheId('a'),'theme:A');
});

test('cache em memória respeita expiração e stale',()=>{
  engine.writeCache('t','a',{ok:true},1000);
  assert.deepEqual(engine.readCache('t','a').value,{ok:true});
  engine.removeCache('t','a');
  assert.equal(engine.readCache('t','a'),null);
});

test('marca nível de carregamento do mês sem alterar demais campos',()=>{
  const m={id:'2026-10'};engine.markMonth(m,'summary');
  assert.equal(engine.isSummaryMonth(m),true);
  engine.markMonth(m,'full');
  assert.equal(engine.isFullMonth(m),true);
});

test('tracker produz snapshot com etapas',async()=>{
  const t=engine.createTracker('login');t.mark('perfil');t.set('source','rpc');
  const s=t.snapshot();assert.equal(s.label,'login');assert.ok(s.totalMs>=0);assert.equal(s.steps[0].name,'perfil');assert.equal(s.meta.source,'rpc');
});

test('V2.43.1 mede hit e miss de cache na sessao',()=>{
  engine.resetMetrics();
  engine.writeCache('metrics','hit',{ok:true},5000);
  assert.ok(engine.readCache('metrics','hit'));
  assert.equal(engine.readCache('metrics','missing'),null);
  const snap=engine.metricsSnapshot();
  assert.equal(snap.cache.hit,1);
  assert.equal(snap.cache.miss,1);
  assert.equal(snap.cache.lookups,2);
  assert.equal(snap.cache.hitRate,.5);
});

test('V2.43.1 agrega eventos e calcula p95',()=>{
  engine.resetMetrics();
  for(const ms of [100,120,140,180,500])engine.recordEvent('module','view:team',ms,{},true);
  const summary=engine.summarizeEvents().find(x=>x.name==='view:team');
  assert.equal(summary.count,5);
  assert.equal(summary.maxMs,500);
  assert.equal(summary.p95Ms,500);
  assert.ok(summary.avgMs>0);
});

test('V2.43.1 registra erro sem stack sensivel',()=>{
  engine.resetMetrics();
  engine.recordError('window_error',new Error('Falha de teste'),{source:'app.js'});
  const event=engine.metricsSnapshot().events.at(-1);
  assert.equal(event.type,'error');
  assert.equal(event.success,false);
  assert.equal(event.meta.message,'Falha de teste');
  assert.equal(event.meta.source,'app.js');
  assert.equal(Object.prototype.hasOwnProperty.call(event.meta,'stack'),false);
});

test('V2.43.1 mede funcao assincrona sem alterar retorno',async()=>{
  engine.resetMetrics();
  const value=await engine.measureAsync('task',async()=>42,{type:'module',meta:{source:'test'}});
  assert.equal(value,42);
  const event=engine.metricsSnapshot().events.at(-1);
  assert.equal(event.name,'task');
  assert.equal(event.meta.source,'test');
});
