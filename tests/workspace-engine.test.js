const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../js/workspace-engine.js');

test('workspace padrão ativa filtros persistentes sem visões ou favoritos', () => {
  const ws=engine.normalizeWorkspace({});
  assert.equal(ws.persistentFilters,true);
  assert.deepEqual(ws.savedViews,[]);
  assert.deepEqual(ws.favorites,[]);
  assert.deepEqual(ws.filterMemory,{});
});

test('memória de filtros é separada por tela e subseção', () => {
  let ws=engine.normalizeWorkspace({});
  ws=engine.rememberFilters(ws,{page:'indicators',indicator:'quality',squad:'D',month:'2026-09',from:'2026-09-01',to:'2026-09-30'},'2026-10-05T18:00:00Z');
  ws=engine.rememberFilters(ws,{page:'indicators',indicator:'performance',squad:'E',month:'2026-10'},'2026-10-05T18:01:00Z');
  assert.equal(ws.filterMemory['indicators:quality'].squad,'D');
  assert.equal(ws.filterMemory['indicators:performance'].squad,'E');
});

test('filtro explícito da rota tem prioridade sobre filtro lembrado', () => {
  const memory={'team':{squad:'D',month:'2026-09',from:'2026-09-01',to:'2026-09-30'}};
  const route=engine.mergeRememberedFilters({page:'team',squad:'E'},memory,true);
  assert.equal(route.squad,'E');
  assert.equal(route.month,'2026-09');
  assert.equal(route.from,'2026-09-01');
});

test('filtros persistentes podem ser desligados', () => {
  const memory={'team':{squad:'D',month:'2026-09'}};
  assert.deepEqual(engine.mergeRememberedFilters({page:'team'},memory,false),{page:'team'});
});

test('visão salva preserva rota e nome normalizados', () => {
  const ws=engine.createSavedView({}, {id:'quality-september',name:' Qualidade Setembro ',route:{page:'indicators',indicator:'quality',squad:'d',month:'2026-09'},now:'2026-10-05T18:00:00Z'});
  assert.equal(ws.savedViews.length,1);
  assert.equal(ws.savedViews[0].name,'Qualidade Setembro');
  assert.deepEqual(ws.savedViews[0].route,{page:'indicators',indicator:'quality',squad:'D',month:'2026-09'});
});

test('renomear e excluir visão não altera a rota capturada', () => {
  let ws=engine.createSavedView({}, {id:'view-1',name:'Original',route:{page:'team',squad:'D'},now:'2026-10-05T18:00:00Z'});
  ws=engine.renameSavedView(ws,'view-1','Novo nome','2026-10-05T18:01:00Z');
  assert.equal(ws.savedViews[0].name,'Novo nome');
  assert.deepEqual(ws.savedViews[0].route,{page:'team',squad:'D'});
  ws=engine.deleteSavedView(ws,'view-1');
  assert.equal(ws.savedViews.length,0);
});

test('favorito é único por assinatura da rota e toggle remove o mesmo destino', () => {
  const route={page:'individual',squad:'D',month:'2026-09',tech:'Maria Teresa'};
  let ws=engine.toggleFavorite({}, {route,label:'Maria Setembro',now:'2026-10-05T18:00:00Z'});
  assert.equal(ws.favorites.length,1);
  assert.ok(engine.favoriteForRoute(ws,route));
  ws=engine.toggleFavorite(ws,{route,label:'Outro nome',now:'2026-10-05T18:01:00Z'});
  assert.equal(ws.favorites.length,0);
});

test('assinatura muda quando filtros relevantes mudam', () => {
  const a=engine.routeSignature({page:'team',squad:'D',month:'2026-09'});
  const b=engine.routeSignature({page:'team',squad:'D',month:'2026-10'});
  assert.notEqual(a,b);
});

test('normalização limita listas e remove favoritos duplicados da mesma rota', () => {
  const route={page:'team',squad:'D'};
  const ws=engine.normalizeWorkspace({favorites:[{id:'a',label:'A',route},{id:'b',label:'B',route}]});
  assert.equal(ws.favorites.length,1);
});
