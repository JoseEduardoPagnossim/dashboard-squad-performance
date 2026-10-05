const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const engine = readFileSync(join(root, 'js', 'chart-engine.js'), 'utf8');
const predictiveEngine = readFileSync(join(root, 'js', 'predictive-engine.js'), 'utf8');
const settingsEngine = readFileSync(join(root, 'js', 'settings-engine.js'), 'utf8');
const financeAdvancedEngine = readFileSync(join(root, 'js', 'finance-advanced.js'), 'utf8');
const tvEngine = readFileSync(join(root, 'js', 'tv-engine.js'), 'utf8');

test('chart-engine carrega antes do app principal', () => {
  const enginePos = index.indexOf('js/chart-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(enginePos >= 0, 'chart-engine.js deve estar no index.html');
  assert.ok(appPos > enginePos, 'chart-engine.js deve carregar antes de app.js');
});

test('app principal depende explicitamente do motor de gráficos', () => {
  assert.match(app, /window\.SoftenChartEngine/);
  assert.match(app, /chartEngineLineVisual/);
  assert.match(app, /chartEnginePercentScale/);
});

test('primitivas duplicadas de gráfico não permanecem no app principal', () => {
  for (const name of ['smoothSvgPath', 'smoothAreaPath', 'splitChartPointSegments', 'chartDataLabelSvg', 'chartValueText']) {
    assert.equal(app.includes(`function ${name}(`), false, `${name} deve residir no chart-engine.js`);
  }
});

test('motor exporta as primitivas centrais esperadas', () => {
  for (const marker of ['normalizePreferences', 'labelVisible', 'percentScale', 'lineVisual', 'applyCssVariables', 'smoothSvgPath', 'dataLabelSvg']) {
    assert.ok(engine.includes(marker), `chart-engine.js deve conter ${marker}`);
  }
});


test('gráfico diário inicializa visual antes de usar linha e pontos', () => {
  const start = app.indexOf('function renderChart(');
  const end = app.indexOf('function renderDaily(', start);
  assert.ok(start >= 0 && end > start, 'renderChart deve existir');
  const renderChartBlock = app.slice(start, end);
  assert.match(renderChartBlock, /visual=chartEngineLineVisual\(prefs\)/);
  assert.ok(renderChartBlock.indexOf('visual=chartEngineLineVisual(prefs)') < renderChartBlock.indexOf('visual.pointRadius'), 'visual deve ser inicializado antes do primeiro uso');
});

test('import-engine carrega antes do app principal', () => {
  const enginePos = index.indexOf('js/import-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(enginePos >= 0, 'import-engine.js deve estar no index.html');
  assert.ok(appPos > enginePos, 'import-engine.js deve carregar antes de app.js');
});

test('central de importacao possui preview, historico e reversao', () => {
  for (const id of ['importPreviewBlock','importPreviewSummary','importValidationList','importComparisonRows','importHistoryRows','undoLastImportBtn']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(app, /window\.SoftenImportEngine/);
  assert.match(app, /captureImportSnapshot/);
  assert.match(app, /undoLastImport/);
});


test('predictive-engine carrega antes do app principal', () => {
  const enginePos = index.indexOf('js/predictive-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(enginePos >= 0, 'predictive-engine.js deve estar no index.html');
  assert.ok(appPos > enginePos, 'predictive-engine.js deve carregar antes de app.js');
});

test('gestao preditiva possui KPIs, alertas e comparativos', () => {
  for (const id of ['predictiveKpis','predictiveAlerts','predictiveSquadRows','predictiveRiskRows','predictiveConfidence']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(app, /window\.SoftenPredictiveEngine/);
  assert.match(app, /renderPredictiveManagement/);
  assert.match(app, /predictiveScopeData/);
  for (const marker of ['projectCount','countMetric','rateMetric','technicianRisk','buildAlerts']) assert.ok(predictiveEngine.includes(marker), `predictive-engine.js deve conter ${marker}`);
});


test('settings-engine carrega antes do app principal', () => {
  const enginePos = index.indexOf('js/settings-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(enginePos >= 0, 'settings-engine.js deve estar no index.html');
  assert.ok(appPos > enginePos, 'settings-engine.js deve carregar antes de app.js');
});

test('central de configuracoes possui layout e permissoes granulares', () => {
  for (const id of ['view-settings','layoutViewSelect','layoutBlockList','saveLayoutBtn','editUserPermissions','settingsPermissionOverview']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(app, /window\.SoftenSettingsEngine/);
  assert.match(app, /applyPersonalLayout/);
  assert.match(app, /hasPermission/);
  for (const marker of ['effectivePermissions','normalizeLayout','moveBlock','toggleBlock']) assert.ok(settingsEngine.includes(marker), `settings-engine.js deve conter ${marker}`);
});

test('V2.38.1 centraliza configurações por módulo sem duplicar telas operacionais', () => {
  for (const id of ['settingsSearchInput','settingsMonthSelect','settingsModuleNav','centralConfigModules','configOperationGoalsCard','configOperationScoreCard','configFinanceModelCard','configFinanceRulesCard','configAppearanceCard','presentationAdminPanel']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  for (const module of ['operation','finance','appearance','presentation']) {
    assert.ok(index.includes(`data-central-config="${module}"`), `deve haver configuração centralizada do módulo ${module}`);
  }
  assert.match(app, /prepareCentralSettings/);
  assert.match(app, /openSettingsModule/);
  assert.match(app, /applySettingsModuleFilter/);
  assert.ok(index.includes('data-open-settings-module="finance"'), 'Bonificação deve apontar para Configurações > Bonificação');
  assert.ok(index.includes('data-open-settings-module="operation"'), 'Operação deve apontar para Configurações > Operação e metas');
});

test('configuração da apresentação pode ser sincronizada fora da tela de TV', () => {
  const presentation = readFileSync(join(root, 'js', 'presentation.js'), 'utf8');
  assert.match(presentation, /function syncAdminConfig\(/);
  assert.match(presentation, /syncAdminConfig,/);
  assert.match(app, /SoftenPresentation\?\.syncAdminConfig/);
});


test('finance-advanced carrega entre regras financeiras e app principal', () => {
  const rulesPos = index.indexOf('js/finance-rules.js');
  const advancedPos = index.indexOf('js/finance-advanced.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(advancedPos >= 0, 'finance-advanced.js deve estar no index.html');
  assert.ok(advancedPos > rulesPos, 'finance-advanced.js deve carregar depois de finance-rules.js');
  assert.ok(appPos > advancedPos, 'finance-advanced.js deve carregar antes de app.js');
});

test('V2.39 possui simulador, memoria e explicacao financeira completa', () => {
  for (const id of ['financeSelfExplanation','financeSimulatorCard','financeSimulatorTech','runFinanceSimulationBtn','financeSimulationResult','financeMemoryCard','financeMemoryRows','recordFinanceMemoryBtn','financeRuleVersion','financeRuleFingerprint','configFinanceRuleVersion','configFinanceRuleFingerprint']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(app, /window\.SoftenFinanceAdvanced/);
  assert.match(app, /recordFinanceCalculationMemory/);
  assert.match(app, /runFinanceSimulation/);
  assert.match(app, /financeRuleVersionForMonth/);
  assert.match(app, /financeRuleFingerprintForMonth/);
  assert.match(app, /financeRuleVersion:financeRuleVersionForMonth\(m\)/);
  for (const marker of ['ruleFingerprint','buildCalculationExplanation','buildCalculationMemory','memoryDelta','simulationDelta']) {
    assert.ok(financeAdvancedEngine.includes(marker), `finance-advanced.js deve conter ${marker}`);
  }
});

test('V2.39 inclui migration de memoria financeira imutavel', () => {
  const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.39.0.sql'), 'utf8').toLowerCase();
  assert.match(migration, /create table if not exists public\.finance_calculation_memory/);
  assert.match(migration, /alter table public\.finance_calculation_memory enable row level security/);
  assert.match(migration, /grant select, insert on public\.finance_calculation_memory to authenticated/);
  assert.match(migration, /revoke update, delete on public\.finance_calculation_memory/);
});


test('tv-engine carrega antes da apresentacao e do app principal', () => {
  const tvPos = index.indexOf('js/tv-engine.js');
  const presentationPos = index.indexOf('js/presentation.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(tvPos >= 0, 'tv-engine.js deve estar no index.html');
  assert.ok(presentationPos > tvPos, 'tv-engine.js deve carregar antes de presentation.js');
  assert.ok(appPos > tvPos, 'tv-engine.js deve carregar antes de app.js');
});

test('V2.40 possui playlists, multiplas TVs e monitoramento', () => {
  for (const id of ['presentationPlaylistSelect','presentationPlaylistName','presentationPlaylistSaveBtn','presentationDeviceName','presentationDevicePlaylist','presentationCreateDeviceBtn','presentationDeviceRows','presentationMonitorSummary','presentationMonitorRefreshBtn']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.match(app, /window\.SoftenTvEngine/);
  assert.match(app, /ensurePresentationOpsLoaded/);
  assert.match(app, /savePresentationPlaylist/);
  assert.match(app, /createPresentationDevice/);
  assert.match(app, /persistPresentationHeartbeat/);
  assert.match(app, /preparePresentationRouteContext/);
  for (const marker of ['statusForDevice','monitorSummary','generateDeviceKey','deviceUrl','heartbeatPayload']) assert.ok(tvEngine.includes(marker), `tv-engine.js deve conter ${marker}`);
});

test('V2.40 inclui migration para playlists, dispositivos e heartbeat', () => {
  const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.40.0.sql'), 'utf8').toLowerCase();
  assert.match(migration, /create table if not exists public\.presentation_playlists/);
  assert.match(migration, /create table if not exists public\.presentation_devices/);
  assert.match(migration, /create or replace function public\.get_presentation_device_config/);
  assert.match(migration, /create or replace function public\.touch_presentation_device/);
  assert.match(migration, /alter table public\.presentation_devices enable row level security/);
});

test('apresentacao direta envia heartbeat quando usa uma TV cadastrada', () => {
  const presentation = readFileSync(join(root, 'js', 'presentation.js'), 'utf8');
  assert.match(presentation, /route\.tv/);
  assert.match(presentation, /soften:presentation-heartbeat/);
  assert.match(presentation, /restartHeartbeat/);
  assert.match(presentation, /getRuntimeStatus/);
});

test('V2.42 possui sidebar retratil, grupos e submodulos persistentes', () => {
  for (const id of ['sidebarCollapseBtn','appSidebar']) assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  for (const group of ['performance','management','account']) assert.ok(index.includes(`data-nav-group="${group}"`), `sidebar deve conter grupo ${group}`);
  for (const subgroup of ['finance','people','governance']) assert.ok(index.includes(`data-nav-subgroup="${subgroup}"`), `sidebar deve conter subgrupo ${subgroup}`);
  assert.match(app, /applyNavigationPreferences/);
  assert.match(app, /toggleSidebarCollapsed/);
  assert.match(app, /toggleNavigationGroup/);
  assert.match(app, /toggleNavigationSubgroup/);
  assert.match(settingsEngine, /normalizeNavigation/);
});

test('V2.42 possui avatar otimizado sem carregar fotos da lista de usuarios', () => {
  for (const id of ['profileAvatarInput','chooseProfileAvatarBtn','removeProfileAvatarBtn','profileAvatarPreview','profileAvatarMessage']) assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  assert.match(app, /optimizeAvatarFile/);
  assert.match(app, /AVATAR_TARGET_BYTES/);
  assert.match(app, /createSignedUrl\(state\.user\.avatarPath,86400\)/);
  assert.match(app, /save_my_avatar_path/);
  assert.equal(/select\([^)]*avatar_path[^)]*\).*userDirectory/.test(app), false, 'diretorio de usuarios nao deve depender de avatars');
});

test('V2.42 inclui migration de avatar privado no Supabase Storage', () => {
  const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.42.0.sql'), 'utf8').toLowerCase();
  assert.match(migration, /add column if not exists avatar_path text/);
  assert.match(migration, /insert into storage\.buckets/);
  assert.match(migration, /'user-avatars'/);
  assert.match(migration, /create or replace function public\.save_my_avatar_path/);
  assert.match(migration, /create policy user_avatars_select_org/);
  assert.match(migration, /create policy user_avatars_update_own/);
});

test('V2.43 carrega performance-engine antes do app principal', () => {
  const performancePos = index.indexOf('js/performance-engine.js');
  const appPos = index.indexOf('js/app.js');
  assert.ok(performancePos >= 0, 'performance-engine.js deve estar no index.html');
  assert.ok(appPos > performancePos, 'performance-engine.js deve carregar antes de app.js');
  assert.match(app, /window\.SoftenPerformanceEngine/);
});

test('V2.43 libera a interface pelo contexto inicial e nao pelo carregamento monolitico antigo', () => {
  const start = app.indexOf('async function enterSupabaseSession');
  const end = app.indexOf('function periodWithinHistory', start);
  assert.ok(start >= 0 && end > start, 'fluxo de sessao V2.43 deve existir');
  const block = app.slice(start, end);
  assert.match(block, /loadInitialSupabaseContext/);
  assert.match(block, /enterApp\(state\.user\)/);
  assert.equal(block.includes('loadSupabaseDataLegacy'), false, 'login nao pode depender do carregamento monolitico antigo');
  assert.equal(app.includes('async function loadSupabaseDataLegacy'), false, 'codigo monolitico antigo deve ser removido do bundle');
});

test('V2.43 aplica lazy loading, cache e paralelismo por competencia', () => {
  for (const marker of ['ensureMonthLoaded','ensureMonthsLoaded','ensureViewData','schedulePostLoginHydration','writePerformanceCache','readPerformanceCache','Promise.all']) {
    assert.ok(app.includes(marker), `app.js deve conter ${marker}`);
  }
  assert.ok(index.includes('id="dataLoadIndicator"'), 'interface deve sinalizar carregamento sob demanda');
  assert.match(index, /themeAudio" loop preload="none"/);
});

test('V2.43 possui RPC inicial enxuta e indices de apoio', () => {
  const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.43.0.sql'), 'utf8').toLowerCase();
  assert.match(migration, /create or replace function public\.get_initial_dashboard_context/);
  assert.match(migration, /idx_squad_months_squad_period_desc/);
  assert.match(migration, /idx_daily_metrics_tech_day/);
  assert.match(migration, /grant execute on function public\.get_initial_dashboard_context\(\) to authenticated/);
  const monthIndex = migration.slice(migration.indexOf("'month_index'"), migration.indexOf("'home_months'"));
  assert.equal(monthIndex.includes("'finance_settings'"), false, 'indice inicial nao deve transportar regras financeiras pesadas');
});

test('V2.43 expoe diagnostico de performance sem bloquear o usuario', () => {
  assert.match(app, /window\.SoftenPerformanceDiagnostics/);
  assert.match(app, /finishPerformanceDiagnostics/);
  assert.match(index, /preconnect" href="https:\/\/cdn\.jsdelivr\.net/);
  assert.match(index, /preload" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"/);
});

test('V2.43.1 possui central de observabilidade para Admin Geral', () => {
  for (const id of ['performanceSystemCard','performanceMetricLastLogin','performanceMetricAvgLogin','performanceMetricP95Login','performanceMetricCache','performanceMetricErrors','performanceModuleRows','performanceRecentErrors','refreshPerformanceMetricsBtn','exportPerformanceMetricsBtn']) {
    assert.ok(index.includes(`id="${id}"`), `index.html deve conter ${id}`);
  }
  assert.ok(index.includes('data-settings-module-filter="system"'));
  assert.match(app, /renderPerformanceSettings/);
  assert.match(app, /loadPerformanceRemoteSummary/);
  assert.match(app, /recordRuntimePerformance/);
  assert.match(app, /captureClientPerformanceError/);
});

test('V2.43.1 envia telemetria em lote sem bloquear o login', () => {
  assert.match(app, /record_performance_events/);
  assert.match(app, /performanceTelemetryQueue/);
  assert.match(app, /schedulePerformanceIdle/);
  const start = app.indexOf('async function enterSupabaseSession');
  const end = app.indexOf('function periodWithinHistory', start);
  const block = app.slice(start, end);
  assert.equal(block.includes('await flushPerformanceTelemetry'), false, 'login nao deve aguardar envio de telemetria');
});

test('V2.43.1 inclui migration de observabilidade com RPCs seguras', () => {
  const migration = readFileSync(join(root, 'supabase', 'migrations', 'MIGRACAO_V2.43.1.sql'), 'utf8').toLowerCase();
  assert.match(migration, /create table if not exists public\.app_performance_events/);
  assert.match(migration, /alter table public\.app_performance_events enable row level security/);
  assert.match(migration, /create or replace function public\.record_performance_events/);
  assert.match(migration, /create or replace function public\.get_performance_summary/);
  assert.match(migration, /v_role <> 'super_admin'/);
  assert.match(migration, /revoke all on table public\.app_performance_events from anon, authenticated/);
});

test('V2.43.1 mede carregamento sob demanda e cache', () => {
  assert.match(app, /month_cache_hit/);
  assert.match(app, /recordRuntimePerformance\('module','month_load'/);
  assert.match(app, /recordRuntimePerformance\('module',metricName/);
  assert.match(app, /queueCachePerformanceSample/);
});
