const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../js/navigation-engine.js');

test('rota persistente normaliza página, seção e filtros conhecidos', () => {
  const route = engine.routeFromSearch('?page=admin&section=finance&squad=d&month=2026-10&tech=Maria%20Teresa&from=2026-10-01&to=2026-10-05');
  assert.deepEqual(route,{page:'admin',section:'finance',squad:'D',month:'2026-10',tech:'Maria Teresa',from:'2026-10-01',to:'2026-10-05'});
});

test('rota inválida volta para Início sem carregar seções desconhecidas', () => {
  const route = engine.routeFromSearch('?page=hack&section=secret&module=whatever');
  assert.deepEqual(route,{page:'home'});
});

test('URL persistente usa page e não conflita com view=presentation da TV', () => {
  const url = engine.routeUrl('https://exemplo.test/app/?foo=1',{page:'presentation',squad:'D',from:'2026-10-01',to:'2026-10-05'});
  assert.equal(url.searchParams.get('page'),'presentation');
  assert.equal(url.searchParams.get('view'),null);
  assert.equal(url.searchParams.get('foo'),'1');
});

test('serialização remove parâmetros antigos da rota sem remover parâmetros externos', () => {
  const url = engine.routeUrl('https://exemplo.test/app/?page=admin&section=costs&foo=1',{page:'settings',module:'appearance',squad:'E'});
  assert.equal(url.searchParams.get('page'),'settings');
  assert.equal(url.searchParams.get('module'),'appearance');
  assert.equal(url.searchParams.get('section'),null);
  assert.equal(url.searchParams.get('foo'),'1');
});

test('busca global ignora acentos e prioriza correspondência no título', () => {
  const commands=[
    {id:'a',label:'Configurações',description:'Aparência e gráficos',keywords:'tema'},
    {id:'b',label:'Aparência',description:'Configurações visuais',keywords:'cores tema'},
    {id:'c',label:'Usuários',description:'Pessoas',keywords:'acessos'}
  ];
  const result=engine.searchCommands(commands,'aparencia',10);
  assert.equal(result[0].id,'b');
  assert.equal(result.some(x=>x.id==='c'),false);
});

test('busca aceita múltiplos termos distribuídos entre título e palavras-chave', () => {
  const commands=[
    {id:'quality',label:'Indicadores de Qualidade',description:'Serviço e produto',keywords:'nota baixa técnico'},
    {id:'finance',label:'Bonificação',description:'Financeiro',keywords:'comissão férias'}
  ];
  assert.deepEqual(engine.searchCommands(commands,'qualidade tecnico').map(x=>x.id),['quality']);
});
