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

const businessCalendarScriptPosition = index.indexOf('js/business-calendar.js');
const financeScriptPosition = index.indexOf('js/finance-rules.js');
const financeAdvancedScriptPosition = index.indexOf('js/finance-advanced.js');
const auditScriptPosition = index.indexOf('js/audit-utils.js');
const chartEngineScriptPosition = index.indexOf('js/chart-engine.js');
const importEngineScriptPosition = index.indexOf('js/import-engine.js');
const predictiveEngineScriptPosition = index.indexOf('js/predictive-engine.js');
const alertEngineScriptPosition = index.indexOf('js/alert-engine.js');
const settingsEngineScriptPosition = index.indexOf('js/settings-engine.js');
const tvEngineScriptPosition = index.indexOf('js/tv-engine.js');
const performanceEngineScriptPosition = index.indexOf('js/performance-engine.js');
const navigationEngineScriptPosition = index.indexOf('js/navigation-engine.js');
const workspaceEngineScriptPosition = index.indexOf('js/workspace-engine.js');
const designSystemScriptPosition = index.indexOf('js/design-system.js');
const appScriptPosition = index.indexOf('js/app.js');
if (businessCalendarScriptPosition < 0) errors.push('index.html não carrega js/business-calendar.js.');
if (financeScriptPosition < 0) errors.push('index.html não carrega js/finance-rules.js.');
if (financeAdvancedScriptPosition < 0) errors.push('index.html não carrega js/finance-advanced.js.');
if (auditScriptPosition < 0) errors.push('index.html não carrega js/audit-utils.js.');
if (chartEngineScriptPosition < 0) errors.push('index.html não carrega js/chart-engine.js.');
if (importEngineScriptPosition < 0) errors.push('index.html não carrega js/import-engine.js.');
if (predictiveEngineScriptPosition < 0) errors.push('index.html não carrega js/predictive-engine.js.');
if (alertEngineScriptPosition < 0) errors.push('index.html não carrega js/alert-engine.js.');
if (settingsEngineScriptPosition < 0) errors.push('index.html não carrega js/settings-engine.js.');
if (tvEngineScriptPosition < 0) errors.push('index.html não carrega js/tv-engine.js.');
if (performanceEngineScriptPosition < 0) errors.push('index.html não carrega js/performance-engine.js.');
if (navigationEngineScriptPosition < 0) errors.push('index.html não carrega js/navigation-engine.js.');
if (workspaceEngineScriptPosition < 0) errors.push('index.html não carrega js/workspace-engine.js.');
if (designSystemScriptPosition < 0) errors.push('index.html não carrega js/design-system.js.');
if (appScriptPosition >= 0 && businessCalendarScriptPosition > appScriptPosition) errors.push('js/business-calendar.js deve ser carregado antes de js/app.js.');
if (financeScriptPosition >= 0 && businessCalendarScriptPosition >= 0 && businessCalendarScriptPosition > financeScriptPosition) errors.push('js/business-calendar.js deve carregar antes de js/finance-rules.js.');
if (appScriptPosition >= 0 && financeScriptPosition > appScriptPosition) errors.push('js/finance-rules.js deve ser carregado antes de js/app.js.');
if (financeAdvancedScriptPosition >= 0 && financeScriptPosition >= 0 && financeAdvancedScriptPosition < financeScriptPosition) errors.push('js/finance-advanced.js deve carregar depois de js/finance-rules.js.');
if (appScriptPosition >= 0 && financeAdvancedScriptPosition > appScriptPosition) errors.push('js/finance-advanced.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && auditScriptPosition > appScriptPosition) errors.push('js/audit-utils.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && chartEngineScriptPosition > appScriptPosition) errors.push('js/chart-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && importEngineScriptPosition > appScriptPosition) errors.push('js/import-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && predictiveEngineScriptPosition > appScriptPosition) errors.push('js/predictive-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && alertEngineScriptPosition > appScriptPosition) errors.push('js/alert-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && settingsEngineScriptPosition > appScriptPosition) errors.push('js/settings-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && tvEngineScriptPosition > appScriptPosition) errors.push('js/tv-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && performanceEngineScriptPosition > appScriptPosition) errors.push('js/performance-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && navigationEngineScriptPosition > appScriptPosition) errors.push('js/navigation-engine.js deve ser carregado antes de js/app.js.');
if (appScriptPosition >= 0 && workspaceEngineScriptPosition > appScriptPosition) errors.push('js/workspace-engine.js deve ser carregado antes de js/app.js.');
if (workspaceEngineScriptPosition >= 0 && navigationEngineScriptPosition >= 0 && workspaceEngineScriptPosition < navigationEngineScriptPosition) errors.push('js/workspace-engine.js deve carregar depois de js/navigation-engine.js.');
if (appScriptPosition >= 0 && designSystemScriptPosition > appScriptPosition) errors.push('js/design-system.js deve ser carregado antes de js/app.js.');
for (const id of ['view-audit','auditRows','confirmDialogPhraseInput','view-alerts','notificationBellBtn','notificationPopover','alertCenterRows','notificationComposerModal','globalSearchTrigger','globalSearchPalette','globalSearchInput','globalSearchResults','appBreadcrumbs','workspaceShell','currentFavoriteBtn','workspaceMenuBtn','workspacePopover','savedViewModal','savedViewForm']) {
  if (!index.includes(`id="${id}"`)) errors.push(`index.html não contém o elemento obrigatório ${id}.`);
}

for (const required of [
  '.github/workflows/quality.yml',
  'package.json',
  'tests/finance-rules.test.js',
  'tests/finance-advanced.test.js',
  'tests/audit-utils.test.js',
  'tests/chart-engine.test.js',
  'tests/import-engine.test.js',
  'tests/predictive-engine.test.js',
  'tests/alert-engine.test.js',
  'tests/settings-engine.test.js',
  'tests/tv-engine.test.js',
  'tests/help-guide.test.js',
  'tests/home-ui.test.js',
  'tests/project-structure.test.js',
  'tests/performance-engine.test.js',
  'tests/navigation-engine.test.js',
  'tests/workspace-engine.test.js',
  'tests/theme-bootstrap.test.js',
  'tests/design-system.test.js',
  'tests/business-calendar.test.js',
  'tests/business-calendar-ui.test.js',
  'js/chart-engine.js',
  'js/import-engine.js',
  'js/predictive-engine.js',
  'js/alert-engine.js',
  'js/settings-engine.js',
  'js/tv-engine.js',
  'js/performance-engine.js',
  'js/navigation-engine.js',
  'js/workspace-engine.js',
  'js/design-system.js',
  'js/business-calendar.js',
  'css/design-system.css',
  'js/finance-rules.js',
  'js/finance-advanced.js',
  'js/audit-utils.js',
  'docs/COMO_USAR_V2.41.0.md',
  'docs/COMO_USAR_V2.42.0.md',
  'docs/EXPERIENCIA_INICIAL_V2.41.0.md',
  'docs/NAVEGACAO_PERFIL_V2.42.0.md',
  'docs/PERFORMANCE_V2.43.0.md',
  'docs/PERFORMANCE_OBSERVABILITY_V2.43.1.md',
  'docs/COMO_USAR_V2.43.1.md',
  'docs/PERFIS_PERMISSOES_V2.43.2.md',
  'docs/COMO_USAR_V2.43.2.md',
  'docs/COMO_USAR_V2.44.0.md',
  'docs/DESIGN_SYSTEM_V2.44.0.md',
  'docs/COMO_USAR_V2.45.0.md',
  'docs/HOME_MODULAR_V2.45.0.md',
  'docs/HOME_MODULAR_V2.45.1.md',
  'docs/FILTROS_IMPORTACAO_V2.45.2.md',
  'docs/ALERTAS_NOTIFICACOES_V2.46.0.md',
  'docs/COMO_USAR_V2.46.0.md',
  'docs/NAVEGACAO_GLOBAL_V2.47.0.md',
  'docs/VISOES_FAVORITOS_V2.48.0.md',
  'docs/SIDEBAR_RESPONSIVA_V2.48.1.md',
  'docs/TEMA_BOOTSTRAP_V2.48.2.md',
  'docs/CALENDARIO_OPERACIONAL_V2.48.7.md',
  'supabase/migrations/MIGRACAO_V2.29.8.sql',
  'supabase/migrations/MIGRACAO_V2.29.9.sql',
  'supabase/migrations/MIGRACAO_V2.36.0.sql',
  'supabase/migrations/MIGRACAO_V2.38.0.sql',
  'supabase/migrations/MIGRACAO_V2.39.0.sql',
  'supabase/migrations/MIGRACAO_V2.40.0.sql',
  'supabase/migrations/MIGRACAO_V2.42.0.sql',
  'supabase/migrations/MIGRACAO_V2.43.0.sql',
  'supabase/migrations/MIGRACAO_V2.43.1.sql',
  'supabase/migrations/MIGRACAO_V2.43.2.sql',
  'supabase/migrations/MIGRACAO_V2.46.0.sql',
  'supabase/migrations/MIGRACAO_V2.48.2.sql',
  'supabase/migrations/MIGRACAO_V2.48.3.sql',
  'supabase/migrations/MIGRACAO_V2.48.7.sql'
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

const designCssPath = join(root, 'css', 'design-system.css');
const designCss = readFileSync(designCssPath, 'utf8');
for (const match of designCss.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) {
  const ref = match[1].trim();
  if (ref.startsWith('#')) continue;
  assertLocalRef(dirname(designCssPath), ref, 'css/design-system.css');
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
if (!appText.includes('window.SoftenChartEngine')) errors.push('js/app.js não depende explicitamente do motor central de gráficos.');
if (!appText.includes('window.SoftenImportEngine')) errors.push('js/app.js não depende explicitamente do motor de importação.');
if (!appText.includes('window.SoftenPredictiveEngine')) errors.push('js/app.js não depende explicitamente do motor preditivo.');
if (!appText.includes('window.SoftenAlertEngine')) errors.push('js/app.js não depende explicitamente do motor de alertas.');
if (!appText.includes('window.SoftenSettingsEngine')) errors.push('js/app.js não depende explicitamente do motor de configurações.');
if (!appText.includes('window.SoftenFinanceAdvanced')) errors.push('js/app.js não depende explicitamente do motor financeiro avançado.');
if (!appText.includes('window.SoftenTvEngine')) errors.push('js/app.js não depende explicitamente do motor de TV/Comunicação.');
if (!appText.includes('window.SoftenPerformanceEngine')) errors.push('js/app.js não depende explicitamente do motor de performance.');
if (!appText.includes('window.SoftenNavigationEngine')) errors.push('js/app.js não depende explicitamente do motor de navegação.');
if (!appText.includes('window.SoftenWorkspaceEngine')) errors.push('js/app.js não depende explicitamente do motor de visões e favoritos.');
if (appText.includes('async function loadSupabaseDataLegacy')) errors.push('js/app.js ainda contém o carregamento monolítico legado.');
for (const duplicatedChartPrimitive of ['smoothSvgPath','smoothAreaPath','splitChartPointSegments','chartDataLabelSvg','chartValueText']) {
  if (appText.includes(`function ${duplicatedChartPrimitive}(`)) errors.push(`Primitiva de gráfico duplicada em js/app.js: ${duplicatedChartPrimitive}.`);
}

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
  "'finance.config_update'",
  "'finance.memory_snapshot'"
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


const financeMemoryMigrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.39.0.sql'), 'utf8').toLowerCase().replace(/\s+/g, ' ');
for (const sqlMarker of [
  'create table if not exists public.finance_calculation_memory',
  'alter table public.finance_calculation_memory enable row level security',
  'grant select, insert on public.finance_calculation_memory to authenticated',
  'revoke update, delete on public.finance_calculation_memory'
]) {
  if (!financeMemoryMigrationText.includes(sqlMarker)) errors.push(`Migracao V2.39.0 incompleta: ${sqlMarker}`);
}


const tvMigrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.40.0.sql'), 'utf8').toLowerCase().replace(/\s+/g, ' ');
for (const sqlMarker of [
  'create table if not exists public.presentation_playlists',
  'create table if not exists public.presentation_devices',
  'create or replace function public.get_presentation_device_config',
  'create or replace function public.touch_presentation_device',
  'alter table public.presentation_devices enable row level security'
]) {
  if (!tvMigrationText.includes(sqlMarker)) errors.push(`Migracao V2.40.0 incompleta: ${sqlMarker}`);
}


const avatarMigrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.42.0.sql'), 'utf8').toLowerCase().replace(/\s+/g, ' ');
for (const sqlMarker of [
  'add column if not exists avatar_path text',
  'insert into storage.buckets',
  'create or replace function public.save_my_avatar_path',
  'create policy user_avatars_select_org',
  'create policy user_avatars_insert_own',
  'create policy user_avatars_update_own',
  'create policy user_avatars_delete_own'
]) {
  if (!avatarMigrationText.includes(sqlMarker)) errors.push(`Migracao V2.42.0 incompleta: ${sqlMarker}`);
}


const performanceMigrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.43.0.sql'), 'utf8').toLowerCase().replace(/\s+/g, ' ');
for (const sqlMarker of [
  'create or replace function public.get_initial_dashboard_context()',
  'create index if not exists idx_squad_months_squad_period_desc',
  'create index if not exists idx_daily_metrics_tech_day',
  'grant execute on function public.get_initial_dashboard_context() to authenticated'
]) {
  if (!performanceMigrationText.includes(sqlMarker)) errors.push(`Migracao V2.43.0 incompleta: ${sqlMarker}`);
}

const alertsMigrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.46.0.sql'), 'utf8').toLowerCase().replace(/\s+/g, ' ');
for (const sqlMarker of [
  'create table if not exists public.internal_notifications',
  'create table if not exists public.internal_notification_reads',
  'alter table public.internal_notifications enable row level security',
  'alter table public.internal_notification_reads enable row level security',
  'create policy internal_notifications_select',
  'create policy internal_notification_reads_insert',
  'grant select, insert, update, delete on table public.internal_notifications to authenticated',
  'grant select, insert, update, delete on table public.internal_notification_reads to authenticated'
]) {
  if (!alertsMigrationText.includes(sqlMarker)) errors.push(`Migracao V2.46.0 incompleta: ${sqlMarker}`);
}
if (!appText.includes("'notification.create'")) errors.push('js/app.js não audita publicação de notificação interna.');
if (!appText.includes("'notification.archive'")) errors.push('js/app.js não audita encerramento de notificação interna.');

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


const performanceObservabilityMigration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.43.1.sql'), 'utf8').toLowerCase();
for (const sqlMarker of [
  'create table if not exists public.app_performance_events',
  'create or replace function public.record_performance_events',
  'create or replace function public.get_performance_summary',
  'alter table public.app_performance_events enable row level security'
]) {
  if (!performanceObservabilityMigration.includes(sqlMarker)) errors.push(`Migração V2.43.1 incompleta: ${sqlMarker}`);
}
if (!appText.includes('record_performance_events')) errors.push('js/app.js não envia telemetria V2.43.1 em lote.');
if (!appText.includes('get_performance_summary')) errors.push('js/app.js não consulta o resumo V2.43.1.');
if (!index.includes('id="performanceSystemCard"')) errors.push('index.html não contém a central de performance V2.43.1.');


const profileMigrationText = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.43.2.sql'), 'utf8').toLowerCase();
for (const sqlMarker of [
  "update public.profiles",
  "where role = 'squad_admin'",
  "set role = 'super_admin'",
  'create or replace function public.can_admin_squad',
  "p.role = 'super_admin'"
]) {
  if (!profileMigrationText.includes(sqlMarker)) errors.push(`Migração V2.43.2 incompleta: ${sqlMarker}`);
}
if (index.includes('value="squad_admin"')) errors.push('index.html ainda expõe Admin de Squad como opção ativa.');
if (/Admin de Squad|Admin Squad/.test(index)) errors.push('index.html ainda contém rótulo ativo de Admin de Squad.');
if (appText.includes('renderSquadAdminHome')) errors.push('js/app.js ainda contém Home exclusiva de Admin de Squad.');
const settingsText = readFileSync(join(root, 'js', 'settings-engine.js'), 'utf8');
if (/roles:\[[^\]]*['"]squad_admin['"]/.test(settingsText)) errors.push('settings-engine.js ainda concede permissões-base ao papel squad_admin.');
const createUserText = readFileSync(join(root, 'supabase', 'functions', 'create-user', 'index.ts'), 'utf8');
const manageUserText = readFileSync(join(root, 'supabase', 'functions', 'manage-user', 'index.ts'), 'utf8');
if (createUserText.includes("['super_admin','squad_admin','technician']") || manageUserText.includes("['super_admin','squad_admin','technician']")) errors.push('Edge Functions ainda aceitam squad_admin como perfil de destino.');
if (!createUserText.includes("['super_admin','technician'].includes(role)")) errors.push('create-user não restringe os perfis ativos a Administrador/Técnico.');
if (!manageUserText.includes("['super_admin','technician'].includes(role)")) errors.push('manage-user não restringe os perfis ativos a Administrador/Técnico.');

if (errors.length) {
  console.error('Falha na validação do projeto:\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log(`Validação concluída: ${checkedRefs.length} referências locais verificadas e JavaScript sintaticamente válido.`);
