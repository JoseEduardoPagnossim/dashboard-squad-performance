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
