'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.14_ESTORNO_IMUTABILIDADE_R18.sql','utf8');
test('R18 enables DELETE only during a matching audited reversal, never UPDATE',()=>{
 assert.match(sql,/if TG_OP='DELETE'/);
 assert.match(sql,/a\.sale_data=to_jsonb\(OLD\)/);
 assert.match(sql,/a\.commission_data=to_jsonb\(OLD\)/);
 assert.match(sql,/r\.batch_id=OLD\.batch_id/);
 assert.match(sql,/r\.organization_id=OLD\.organization_id/);
 assert.match(sql,/v_marker::uuid/);
 assert.match(sql,/if v_allowed then return OLD; end if;/);
 assert.match(sql,/raise exception 'Historico comercial\/financeiro imutavel/);
 assert.doesNotMatch(sql,/disable trigger|drop trigger|alter table.+disable/i);
});
test('R18 RPC uses transaction local authorization marker and archives before any deletion',()=>{
 const marker="perform set_config('app.strategy_commercial_reversal_id',v_reversal::text,true)";
 assert.ok(sql.includes(marker));
 assert.ok(sql.indexOf('insert into public.strategy_commercial_batch_reversals_v26311')<sql.indexOf(marker));
 assert.ok(sql.indexOf('insert into public.strategy_commercial_reversed_sales_v26311')<sql.indexOf('delete from public.strategy_sales_commissions'));
 assert.ok(sql.indexOf('delete from public.strategy_sales_commissions')<sql.indexOf('delete from public.strategy_recurring_sales'));
 assert.match(sql,/perform set_config\('app\.strategy_commercial_reversal_id','',true\)/);
 assert.match(sql,/v_preview:=public\.preview_strategy_commercial_batch_reversal_v26311/);
 assert.match(sql,/for update;/);
 assert.match(sql,/p_expected_sales/);
 assert.match(sql,/update public\.strategy_import_batches set status='reverted'/);
 assert.doesNotMatch(sql,/update public\.technician_finance_monthly|update public\.squad_months|delete from public\.strategy_competence_snapshots/i);
});
