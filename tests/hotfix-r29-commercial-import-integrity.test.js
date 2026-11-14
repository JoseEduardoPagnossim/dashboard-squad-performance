'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('js/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sql=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.19_PREFLIGHT_IMPORTACAO_R29.sql','utf8');
const csv=require('../js/strategy-csv-importer');
const recurring=require('../js/strategy-recurring-import');

test('R29 pre-valida lotes antes de criar lote real ou gravar receitas',()=>{
  const fn=app.slice(app.indexOf('async function confirmStrategyRecurringImport()'),app.indexOf('function prepareStrategyMerchandise()'));
  assert.ok(fn.indexOf("preview_strategy_recurring_chunk_r29")<fn.indexOf("start_strategy_recurring_batch_v2634"));
  assert.match(fn,/chunk\.length===1/);
  assert.match(fn,/preflightIssues\.length/);
  assert.match(fn,/Importacao NAO iniciada/);
  assert.match(fn,/if\(org!==state\.user\?\.organizationId/);
});

test('R29 migração faz rollback intencional e restringe RPC para usuário autorizado',()=>{
  assert.match(sql,/SECURITY DEFINER SET search_path=public,pg_temp/i);
  assert.match(sql,/auth\.uid\(\) IS NULL/);
  assert.match(sql,/has_strategy_access\('people_costs'\)/);
  assert.match(sql,/has_strategy_access\('edit_costs'\)/);
  assert.match(sql,/R29_TRANSACTION_ROLLBACK/);
  assert.match(sql,/EXCEPTION WHEN OTHERS/);
  assert.match(sql,/REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC,anon/);
  assert.match(sql,/GRANT EXECUTE[\s\S]*TO authenticated/);
  assert.doesNotMatch(sql,/DELETE FROM public\.strategy_recurring_sales/i);
});

test('R29 historico inclui auditoria local, sem nova importacao ou exposicao de clientes',()=>{
  for(const id of ['strategyCommercialCsvAuditFile','strategyCommercialCsvAuditRun','strategyCommercialCsvAuditMonth','strategyCommercialCsvAuditRows','strategyCommercialCsvAuditSearch','strategyCommercialCsvAuditExport'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(app,/function runStrategyCommercialCsvAuditR29/);
  assert.match(app,/Nao localizada neste lote/);
  assert.match(app,/exportStrategyCommercialCsvAuditR29/);
  assert.match(app,/saved\.set\(key,saved\.get\(key\)-1\)/);
  assert.doesNotMatch(app.slice(app.indexOf('async function runStrategyCommercialCsvAuditR29'),app.indexOf('function exportStrategyCommercialCsvAuditR29')),/\.insert\(|\.upsert\(|\.update\(/);
});

test('R29 mantem linha original mesmo com filtro de competencia e repeticoes',()=>{
  const p=csv.parse('Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Anterior,Vl Atual Ativo\n30/09/2026,Arthur,D,Financeiro,35.00,35.00\n14/10/2026,Arthur,D,Financeiro,35.00,35.00\n01/10/2026,Arthur,D,Modulo de DRE,9.90,10.51');
  const m=csv.suggest('contracted_modules_csv',p.headers);
  const filtered=csv.filterCompetence('contracted_modules_csv',p,m,'2026-10').parsed;
  assert.deepEqual(filtered.sourceLineNumbers,[3,4]);
  assert.equal(recurring.date('01/10/2026'),'2026-10-01');
  assert.equal(recurring.cents('9.90'),990);
});
