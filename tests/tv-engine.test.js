const test = require('node:test');
const assert = require('node:assert/strict');
const tv = require('../js/tv-engine.js');

test('normaliza playlists e preserva o squad da configuracao', () => {
  const p = tv.normalizePlaylist({id:'p1',name:' TV Suporte ',config:{squad:'d',interval:15}});
  assert.equal(p.name,'TV Suporte');
  assert.equal(p.squad,'D');
  assert.equal(p.config.squad,'D');
  assert.equal(p.config.interval,15);
});

test('classifica TV online, atencao e offline pelo ultimo heartbeat', () => {
  const now = new Date('2026-10-02T18:00:00Z').getTime();
  assert.equal(tv.statusForDevice({active:true,lastSeenAt:new Date(now-30_000).toISOString()},now).key,'online');
  assert.equal(tv.statusForDevice({active:true,lastSeenAt:new Date(now-120_000).toISOString()},now).key,'attention');
  assert.equal(tv.statusForDevice({active:true,lastSeenAt:new Date(now-600_000).toISOString()},now).key,'offline');
  assert.equal(tv.statusForDevice({active:false,lastSeenAt:new Date(now-30_000).toISOString()},now).key,'inactive');
  assert.equal(tv.statusForDevice({active:true},now).key,'never');
});

test('resumo do monitor separa estados das TVs', () => {
  const now = 1_800_000;
  const s = tv.monitorSummary([
    {active:true,lastSeenAt:new Date(now-10_000).toISOString()},
    {active:true,lastSeenAt:new Date(now-100_000).toISOString()},
    {active:true,lastSeenAt:new Date(now-600_000).toISOString()},
    {active:false,lastSeenAt:new Date(now-10_000).toISOString()},
    {active:true}
  ],now);
  assert.deepEqual(s,{total:5,online:1,attention:1,offline:1,inactive:1,never:1});
});

test('URL de dispositivo usa somente identificador dinamico da TV', () => {
  const url = new URL(tv.deviceUrl('https://exemplo.test/app?view=presentation&squad=D&tabs=day,general&interval=20','tv-sala-01'));
  assert.equal(url.searchParams.get('view'),'presentation');
  assert.equal(url.searchParams.get('tv'),'tv-sala-01');
  assert.equal(url.searchParams.has('squad'),false);
  assert.equal(url.searchParams.has('tabs'),false);
  assert.equal(url.searchParams.has('interval'),false);
});

test('heartbeat contem somente telemetria esperada', () => {
  const h = tv.heartbeatPayload({mode:'general',lastRefreshAt:'2026-10-02T17:00:00Z',connectionState:'online',viewport:{width:1920,height:1080},appVersion:'2.40.0'});
  assert.equal(h.last_mode,'general');
  assert.equal(h.connection_state,'online');
  assert.equal(h.viewport.width,1920);
  assert.equal(h.app_version,'2.40.0');
  assert.ok(h.last_seen_at);
});
