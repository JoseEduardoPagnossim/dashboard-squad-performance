const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/MIGRACAO_V2.63.21_LIDERES_FINANCEIROS_IMPORTACAO_R292.sql'), 'utf8');
const r291 = fs.readFileSync(path.join(__dirname, '..', 'supabase/migrations/MIGRACAO_V2.63.20_PREVIEW_RESULTADO_R291.sql'), 'utf8');
const recurring = migration.split('create or replace function public.import_strategy_recurring_sales_v2639_r5(')[1].split('create or replace function public.import_strategy_merchandise_sales_v2635(')[0];
const merchandise = migration.split('create or replace function public.import_strategy_merchandise_sales_v2635(')[1].split('REVOKE ALL ON FUNCTION')[0];

for (const [label, body] of [['MRR', recurring], ['Nao MRR', merchandise]]) {
  test(`R29.2 ${label}: lider usa Squad financeiro do mes e ano da venda`, () => {
    assert.match(body, /v_profile\.role='super_admin'/);
    assert.match(body, /lc\.organization_id=v_org and lc\.user_id=v_person\.user_id/);
    assert.match(body, /lc\.year=extract\(year from v_date\)::int/);
    assert.match(body, /lc\.month=extract\(month from v_date\)::int/);
    assert.match(body, /lc\.squad_code=v_squad/);
    assert.match(body, /elsif v_person\.default_squad_code is distinct from v_squad/);
    assert.doesNotMatch(body, /if not found or v_person\.user_id is null or v_person\.default_squad_code is distinct from v_squad/);
  });
  test(`R29.2 ${label}: mantem protecoes operacionais e idempotencia`, () => {
    assert.match(body, /v_squad='C'/);
    assert.match(body, /v_person\.functional_team='pre_attendance'/);
    assert.match(body, /strategy_seller_aliases/);
    assert.match(body, /v_comp_status='closed'/);
    assert.match(body, /duplicate/);
    assert.match(body, /v_batch\.status<>'draft'/);
  });
}

test('R29.2: pre-validacao R29.1 reusa motor corrigido sem escrita permanente', () => {
  assert.match(r291, /public\.import_strategy_recurring_sales_v2639_r5\(v_batch,p_sales\)/);
  assert.match(r291, /R291_TRANSACTION_ROLLBACK/);
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;/);
});
