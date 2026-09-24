import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const checkedRefs = [];

function assertLocalRef(baseDir, ref, source) {
  if (!ref || /^(?:https?:)?\/\//.test(ref) || ref.startsWith('#') || ref.startsWith('data:')) return;
  const clean = ref.split(/[?#]/, 1)[0];
  const full = resolve(baseDir, clean);
  checkedRefs.push(`${source}: ${ref}`);
  if (!existsSync(full)) errors.push(`Referência ausente em ${source}: ${ref}`);
}

const indexPath = join(root, 'index.html');
const index = readFileSync(indexPath, 'utf8');
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/g)) assertLocalRef(root, match[1], 'index.html');

const financeScriptPosition = index.indexOf('js/finance-rules.js');
const auditScriptPosition = index.indexOf('js/audit-utils.js');
const appScriptPosition = index.indexOf('js/app.js');
if (financeScriptPosition < 0) errors.push('index.html não carrega js/finance-rules.js.');
if (auditScriptPosition < 0) errors.push('index.html não carrega js/audit-utils.js.');
if (appScriptPosition >= 0 && financeScriptPosition > appScriptPosition) errors.push('js/finance-rules.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && auditScriptPosition > appScriptPosition) errors.push('js/audit-utils.js deve ser carregado antes de js/app.js.');
for (const id of ['view-audit','auditRows','confirmDialogPhraseInput']) {
  if (!index.includes(`id="${id}"`)) errors.push(`index.html não contém o elemento obrigatório ${id}.`);
}

for (const required of [
  '.github/workflows/quality.yml',
  'package.json',
  'tests/finance-rules.test.js',
  'tests/audit-utils.test.js',
  'js/finance-rules.js',
  'js/audit-utils.js',
  'supabase/migrations/MIGRACAO_V2.29.8.sql',
  'supabase/migrations/MIGRACAO_V2.29.9.sql'
]) {
  if (!existsSync(join(root, required))) errors.push(`Arquivo obrigatório ausente: ${required}`);
}

const cssPath = join(root, 'css', 'styles.css');
const css = readFileSync(cssPath, 'utf8');
for (const match of css.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) {
  const ref = match[1].trim();
  if (ref.startsWith('#')) continue;
  assertLocalRef(dirname(cssPath), ref, 'css/styles.css');
}

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (name === '.git') return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk(join(root, 'js')).filter(f => f.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`JavaScript inválido em ${file}: ${result.stderr.trim()}`);
}

const appText = readFileSync(join(root, 'js', 'app.js'), 'utf8');
if (appText.includes('squad-dashboard-v2.1.0')) errors.push('Referência ao nome antigo do repositório encontrada em js/app.js.');

for (const financeCall of [
  'financeRules.resolveFinanceSettings',
  'financeRules.cancellationSummary',
  'financeRules.groupFinanceBase',
  'financeRules.topPrizeAllocation',
  'financeRules.financialAdjustmentSummary',
  'financeRules.buildFinanceModelData',
  'financeRules.applyIndividualTotalCap'
]) {
  if (!appText.includes(financeCall)) errors.push(`js/app.js deixou de usar a regra financeira testada: ${financeCall}`);
}

for (const auditMarker of [
  "rpc('log_audit_event'",
  "'month.import_service'",
  "'month.import_quality'",
  "'month.close'",
  "'month.reopen'",
  "'finance.config_update'"
]) {
  if (!appText.includes(auditMarker)) errors.push(`js/app.js deixou de registrar auditoria esperada: ${auditMarker}`);
}

const migrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.29.8.sql'), 'utf8').toLowerCase();
for (const sqlMarker of [
  'create table if not exists public.audit_logs',
  'alter table public.audit_logs enable row level security',
  'create or replace function public.log_audit_event'
]) {
  if (!migrationText.includes(sqlMarker)) errors.push(`Migração V2.29.8 incompleta: ${sqlMarker}`);
}

const grantMigrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.29.9.sql'), 'utf8')
  .toLowerCase()
  .replace(/\s+/g, ' ');
for (const sqlMarker of [
  'on table public.technician_finance_monthly to authenticated;',
  'on table public.super_admin_commissions to authenticated;',
  'on table public.profiles to service_role;',
  'on table public.squads to service_role;',
  'on table public.squad_months to service_role;',
  'on table public.technician_monthly to service_role;',
  'on table public.profile_squad_history to service_role;',
  'on table public.audit_logs to service_role;'
]) {
  if (!grantMigrationText.includes(sqlMarker)) errors.push(`Migração V2.29.9 incompleta: ${sqlMarker}`);
}

// Toda nova migration que cria tabela em public deve declarar um GRANT explícito.
// As duas tabelas da V2.18.0 são exceções históricas e foram remediadas pela V2.29.9.
const grantRemediatedTables = new Set(['technician_finance_monthly', 'super_admin_commissions']);
const migrationsDir = join(root, 'supabase', 'migrations');
for (const migrationFile of readdirSync(migrationsDir).filter(name => name.endsWith('.sql'))) {
  const migrationSql = readFileSync(join(migrationsDir, migrationFile), 'utf8');
  for (const match of migrationSql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)/gi)) {
    const table = match[1].toLowerCase();
    if (grantRemediatedTables.has(table)) continue;
    const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const grantPattern = new RegExp(`grant\\s+[\\s\\S]*?on\\s+(?:table\\s+)?public\\.${escapedTable}\\b`, 'i');
    if (!grantPattern.test(migrationSql)) {
      errors.push(`${migrationFile} cria public.${table} sem GRANT explícito na mesma migration.`);
    }
  }
}

if (errors.length) {
  console.error('Falha na validação do projeto:\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log(`Validação concluída: ${checkedRefs.length} referências locais verificadas e JavaScript sintaticamente válido.`);
