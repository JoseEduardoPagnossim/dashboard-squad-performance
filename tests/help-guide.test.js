const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');

function helpBlock(){
  const start=index.indexOf('<section id="view-help"');
  const end=index.indexOf('<section id="view-admin"',start);
  assert.ok(start>=0 && end>start,'view-help deve existir antes de view-admin');
  return index.slice(start,end);
}

test('Como usar referencia o painel atual e remove a versao antiga do guia', () => {
  const help=helpBlock();
  assert.match(help,/GUIA COMPLETO • V2\.47/);
  assert.equal(help.includes('GUIA COMPLETO • V2.20'),false);
  for(const marker of ['Central de Importação','Gestão preditiva','Bonificação e Financeiro avançado','Central de Configurações','TV / Comunicação','Central de Alertas','NAVEGAÇÃO GLOBAL • V2.47']){
    assert.ok(help.includes(marker),`guia deve documentar ${marker}`);
  }
});

test('Como usar possui busca interna e estado sem resultados', () => {
  const help=helpBlock();
  for(const id of ['helpSearchInput','helpSearchCount','clearHelpSearchBtn','helpNoResults']) assert.ok(help.includes(`id="${id}"`),`guia deve conter ${id}`);
  assert.match(app,/function applyHelpSearch\(/);
  assert.match(app,/function normalizeHelpSearchText\(/);
});

test('Como usar oferece atalhos contextuais para as principais areas', () => {
  const help=helpBlock();
  for(const view of ['home','individual','team','presentation','settings','profile']) assert.ok(help.includes(`data-help-view="${view}"`),`atalho deve apontar para ${view}`);
  for(const section of ['operation','finance','costs']) assert.ok(help.includes(`data-help-admin-section="${section}"`),`atalho deve apontar para admin/${section}`);
  assert.match(app,/function openHelpTarget\(/);
});

test('Guia documenta regras criticas atuais', () => {
  const help=helpBlock();
  assert.match(help,/50% somente da comissão-base após o cancelamento/);
  assert.match(help,/Online<\/b> até 90 s/);
  assert.match(help,/Atenção<\/b> 90 s a 5 min/);
  assert.match(help,/Offline<\/b> acima de 5 min/);
  assert.match(help,/Administradores possuem acesso completo/);
  assert.match(help,/restrições específicas só podem reduzir recursos/);
});
