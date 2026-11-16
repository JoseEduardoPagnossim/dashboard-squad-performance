'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync('js/app.js','utf8'),html=fs.readFileSync('index.html','utf8');
const sql=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.20_PREVIEW_RESULTADO_R291.sql','utf8');
test('R29.1 mostra bloqueios com motivo e linha em local visivel',()=>{
 assert.match(html,/strategyRecurringDiagnosticR291/);
 assert.match(app,/Importação bloqueada antes de gravar/);
 assert.match(app,/Primeira: \$\{first.line\} — \$\{first.reason\}/);
});
test('R29.1 nao cria lote se todas as linhas ja existem ou estao fechadas',()=>{
 const fn=app.slice(app.indexOf('async function confirmStrategyRecurringImport()'),app.indexOf('function prepareStrategyMerchandise()'));
 assert.ok(fn.indexOf('previewTotals.newSales===0')<fn.indexOf("start_strategy_recurring_batch_v2634"));
 assert.match(fn,/strategyImportReplaceCommissions/);
 assert.match(fn,/previewTotals.duplicates/);
});
test('R29.1 pre-validacao continua transacional e retorna totais',()=>{
 assert.match(sql,/R291_TRANSACTION_ROLLBACK/);
 assert.match(sql,/RETURN jsonb_build_object\('ok',true,'imported'/);
 assert.match(sql,/SECURITY DEFINER SET search_path=public,pg_temp/);
 assert.match(sql,/has_strategy_access\('edit_costs'\)/);
});
