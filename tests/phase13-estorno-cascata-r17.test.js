"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.13_ESTORNO_CASCATA_R17.sql','utf8');
const earlier=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.11_LIDERES_ESTORNO.sql','utf8');
test('R17 remove heuristica de folha tecnica sem eliminar protecoes de fechamento',()=>{
 assert.match(sql,/create or replace function public\.preview_strategy_commercial_batch_reversal_v26311/);
 assert.doesNotMatch(sql,/v_synced|technician_finance_monthly|tf\.updated_at/);
 for(const x of ['v_locked','v_operational','v_count>5000','v_count=0','strategy_financial_closure_v2638','strategy_competence_snapshots'])assert.ok(sql.includes(x),x);
});
test('RPC existente mantem estorno transacional por lote e copia de auditoria',()=>{
 for(const x of ['insert into public.strategy_commercial_reversed_sales_v26311','delete from public.strategy_sales_commissions','delete from public.strategy_recurring_sales','delete from public.strategy_merchandise_sales','delete from public.strategy_result_attributions','delete from public.strategy_result_events'])assert.ok(earlier.includes(x),x);
 assert.doesNotMatch(sql,/delete from|update public\.technician_finance_monthly|update public\.squad_months/i);
});
