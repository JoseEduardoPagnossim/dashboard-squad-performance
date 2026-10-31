import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const validFile = (name, dir = base) => readFileSync(join(dir, name), 'utf8');

export function auditPhase8(read = (name) => validFile(name)) {
  const errors = [];
  const take = (name) => { try { return read(name); } catch { errors.push(`Arquivo indisponivel: ${name}`); return ''; } };
  const requireText = (file, marker, reason) => { if (!take(file).includes(marker)) errors.push(`${file}: ${reason}`); };
  const pkg = (() => { try { return JSON.parse(take('package.json')); } catch { errors.push('package.json invalido'); return {}; } })();
  const html = take('index.html');
  const version = `${pkg.version}-r1`;
  if (pkg.version !== '2.63.9' || pkg.assetVersion !== version) errors.push('Versao do pacote/caches inconsistente.');
  const refs = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"?]+\.(?:js|css))\?v=([^"]+)"/g)];
  if (refs.length < 40) errors.push('Referencias locais insuficientes para auditar cache-busters.');
  for (const [, name, cache] of refs) if (cache !== pkg.assetVersion && !(name==='js/audit-utils.js' && cache==='2.29.9')) errors.push(`Cache-buster fora da versao: ${name}`);
  for (const [name, marker] of [
    ['js/app.js', "const APP_VERSION = '2.63.9'"],
    ['js/strategy-csv-importer.js', 'contracted_modules_csv'],
    ['js/strategy-recurring-import.js', 'amountCents'],
    ['js/strategy-merchandise-import.js', 'amountCents'],
    ['js/strategy-commissions.js', 'SoftenStrategyCommissions'],
    ['js/strategy-financial-close.js', 'missing_closed_snapshot'],
    ['js/strategy-financial-close.js', 'churnStatus']
  ]) requireText(name, marker, 'Contrato de integracao ausente.');
  for (const [version, marker] of [
    [0, 'pre_attendance'],[1, 'strategy_import_mapping'],[2, 'strategy_seller_aliases'],
    [3, 'strategy_commercial_products'],[4, 'strategy_recurring_sales'],
    [5, 'strategy_merchandise_sales'],[6, 'strategy_sales_commissions'],
    [7, 'strategy_manual_entries'],[8, 'strategy_financial_closure_v2638']
  ]) {
    const file = `supabase/migrations/MIGRACAO_V2.63.${version}.sql`;
    // V2.63.1's mapping table has a slightly different identifier.
    const actual = take(file);
    if (!actual.includes(marker) && !(version===1 && /strategy.*mapping/i.test(actual))) errors.push(`${file}: contrato do marco da Fase 8 nao encontrado (${marker}).`);
  }
  const hardening = take('supabase/migrations/MIGRACAO_V2.63.9.sql');
  for (const term of [
    'begin;', 'commit;',
    'create or replace function public.strategy_bonus_reconciliation_preview_v2638',
    'v_row:=v_op.closed_finance_month_data;',
    'missing_closed_snapshot', 'invalid_closed_cancellations',
    'approved_amount_mismatch',
    'jsonb_array_length(v_rows)=0 and jsonb_array_length(v_churn)=0',
    "public.has_strategy_access('edit_costs')",
    'strategy_phase8_immutable_guard_v2639()',
    'strategy_recurring_sales','strategy_merchandise_sales',
    'strategy_sales_commissions', 'strategy_financial_closure_v2638',
    'revoke all on function public.close_strategy_competence_core_v2638(date) from public,anon,authenticated;'
  ]) if (!hardening.includes(term)) errors.push(`Hardening SQL incompleto: ${term}`);
  if (hardening.includes('coalesce(v_op.closed_finance_month_data,v_op.finance_month_data)')) errors.push('Fallback proibido para dados editaveis no fechamento.');
  for (const [name, terms] of [
    ['supabase/migrations/MIGRACAO_V2.63.4.sql', ['v_amount_cents::numeric / 100','monthly_recurring_amount','source_occurrence','organization_id']],
    ['supabase/migrations/MIGRACAO_V2.63.5.sql', ['v_amount_cents::numeric/100','monthly_recurring_amount','source_occurrence','organization_id']],
    ['supabase/migrations/MIGRACAO_V2.63.6.sql', ["v_kind='full'", "v_kind='percentage'", "v_kind='net_after_third_party'", "v_kind='fixed'",'return round(v_result,2);']]
  ]) {
    const sql = take(name);
    for (const term of terms) if (!sql.includes(term)) errors.push(`${name}: invariante financeira ausente: ${term}`);
  }
  return { passed: errors.length === 0, errors, references: refs.length, milestones: 10 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = auditPhase8();
  if (!report.passed) {
    console.error('Auditoria Fase 8 falhou:\n- ' + report.errors.join('\n- '));
    process.exitCode = 1;
  } else console.log(`Auditoria Fase 8 OK: ${report.milestones} migrations, ${report.references} referencias JS/CSS e contratos financeiros verificados.`);
}
