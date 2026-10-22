import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const TARGET_VERSION = '2.57.9';

function file(path) { return join(root, path); }
function read(path) {
  const full = file(path);
  if (!existsSync(full)) throw new Error(`Arquivo não encontrado: ${path}`);
  return readFileSync(full, 'utf8');
}
function write(path, content) {
  const full = file(path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
}
function replaceRequired(path, before, after, label = before) {
  const current = read(path);
  if (current.includes(after)) return false;
  if (!current.includes(before)) throw new Error(`Trecho esperado não encontrado em ${path}: ${label}`);
  write(path, current.replace(before, after));
  return true;
}
function replaceOneOf(path, candidates, after, label) {
  const current = read(path);
  if (current.includes(after)) return false;
  const before = candidates.find(value => current.includes(value));
  if (!before) throw new Error(`Nenhum trecho esperado encontrado em ${path}: ${label}`);
  write(path, current.replace(before, after));
  return true;
}

const changed = [];
function mark(path, didChange) { if (didChange) changed.push(path); }

// 1) Versão de release
{
  const path = 'package.json';
  const json = JSON.parse(read(path));
  if (!['2.57.8', TARGET_VERSION].includes(json.version)) throw new Error(`package.json está em ${json.version}; esperado 2.57.8 ou ${TARGET_VERSION}.`);
  if (json.version !== TARGET_VERSION) {
    json.version = TARGET_VERSION;
    write(path, `${JSON.stringify(json, null, 2)}\n`);
    changed.push(path);
  }
}
{
  const path = 'package-lock.json';
  const json = JSON.parse(read(path));
  const current = json.version;
  const rootCurrent = json.packages?.['']?.version;
  if (![undefined, '2.57.6', '2.57.8', TARGET_VERSION].includes(current)) throw new Error(`package-lock.json está em ${current}; revise antes de aplicar.`);
  if (![undefined, '2.57.6', '2.57.8', TARGET_VERSION].includes(rootCurrent)) throw new Error(`package-lock root está em ${rootCurrent}; revise antes de aplicar.`);
  let dirty = false;
  if (json.version !== TARGET_VERSION) { json.version = TARGET_VERSION; dirty = true; }
  if (json.packages?.[''] && json.packages[''].version !== TARGET_VERSION) { json.packages[''].version = TARGET_VERSION; dirty = true; }
  if (dirty) { write(path, `${JSON.stringify(json, null, 2)}\n`); changed.push(path); }
}

// 2) Acesso fail-closed: campo DB snake_case, quando presente, é autoritativo.
mark('js/strategy-access.js', replaceRequired(
  'js/strategy-access.js',
  "  function bool(value){return value===true}\n  function normalizeAccess(raw={},meta={}){\n    const source=raw&&typeof raw==='object'?raw:{};\n    const out={...EMPTY_ACCESS};\n    for(const key of ACCESS_KEYS){\n      const dbKey=DB_FIELD_MAP[key];\n      out[key]=bool(source[key])||bool(source[dbKey]);\n    }",
  "  function bool(value){return value===true}\n  function hasOwn(source,key){return Object.prototype.hasOwnProperty.call(source,key)}\n  function normalizeAccess(raw={},meta={}){\n    const source=raw&&typeof raw==='object'?raw:{};\n    const out={...EMPTY_ACCESS};\n    for(const key of ACCESS_KEYS){\n      const dbKey=DB_FIELD_MAP[key];\n      out[key]=hasOwn(source,dbKey)?bool(source[dbKey]):bool(source[key]);\n    }",
  'normalizeAccess fail-closed'
));

// 3) Normalização defensiva dos valores financeiros.
mark('js/strategy-data.js', replaceRequired(
  'js/strategy-data.js',
  "      totalCost:Number.isFinite(Number(row.total_cost))?Number(row.total_cost):gross*fte,",
  "      totalCost:Number.isFinite(Number(row.total_cost))?Math.max(0,Number(row.total_cost)):gross*fte,",
  'total_cost não-negativo'
));
mark('js/strategy-data.js', replaceRequired(
  'js/strategy-data.js',
  "percentage:Math.max(0,num(row.percentage)),",
  "percentage:Math.max(0,Math.min(1,num(row.percentage))),",
  'percentage entre 0 e 1'
));

// 4) Motor de rateio: consolida aliases/códigos que normalizam para o mesmo Squad.
mark('js/strategy-cost-engine.js', replaceRequired(
  'js/strategy-cost-engine.js',
  "  const RULE_VERSION='SC-0.6.0-snapshot';",
  "  const RULE_VERSION='SC-0.6.1';",
  'RULE_VERSION do motor'
));
mark('js/strategy-cost-engine.js', replaceRequired(
  'js/strategy-cost-engine.js',
`  function allocateCents(amount,weights={}){\n    const totalCents=Math.round(money(amount)*100),entries=Object.entries(weights||{}).map(([code,value])=>[cleanCode(code),Math.max(0,num(value))]).filter(([code,value])=>code&&value>0),basis=entries.reduce((s,[,v])=>s+v,0);\n    if(totalCents<=0||basis<=0)return{allocations:{},percentages:{},basis};\n    const raw=entries.map(([code,value])=>{const exact=totalCents*(value/basis),floor=Math.floor(exact);return{code,value,exact,floor,frac:exact-floor}}),used=raw.reduce((s,r)=>s+r.floor,0),remaining=totalCents-used;\n    raw.sort((a,b)=>b.frac-a.frac||a.code.localeCompare(b.code));for(let i=0;i<remaining;i++)raw[i%raw.length].floor++;\n    raw.sort((a,b)=>a.code.localeCompare(b.code));const allocations={},percentages={};for(const row of raw){allocations[row.code]=row.floor/100;percentages[row.code]=row.value/basis;}\n    return{allocations,percentages,basis};\n  }`,
`  function allocateCents(amount,weights={}){\n    const normalizedWeights={};\n    for(const [rawCode,rawValue] of Object.entries(weights||{})){\n      const code=cleanCode(rawCode),value=Math.max(0,num(rawValue));\n      if(!code||value<=0)continue;\n      normalizedWeights[code]=(normalizedWeights[code]||0)+value;\n    }\n    const totalCents=Math.round(money(amount)*100),entries=Object.entries(normalizedWeights),basis=entries.reduce((s,[,v])=>s+v,0);\n    if(totalCents<=0||basis<=0)return{allocations:{},percentages:{},basis,weights:normalizedWeights};\n    const raw=entries.map(([code,value])=>{const exact=totalCents*(value/basis),floor=Math.floor(exact);return{code,value,exact,floor,frac:exact-floor}}),used=raw.reduce((s,r)=>s+r.floor,0),remaining=totalCents-used;\n    raw.sort((a,b)=>b.frac-a.frac||a.code.localeCompare(b.code));for(let i=0;i<remaining;i++)raw[i%raw.length].floor++;\n    raw.sort((a,b)=>a.code.localeCompare(b.code));const allocations={},percentages={};for(const row of raw){allocations[row.code]=row.floor/100;percentages[row.code]=row.value/basis;}\n    return{allocations,percentages,basis,weights:normalizedWeights};\n  }`,
  'allocateCents consolidado'
));
mark('js/strategy-cost-engine.js', replaceRequired(
  'js/strategy-cost-engine.js',
  "basisValue:Math.max(0,num(weights[code])),allocatedAmount:money(distributed.allocations[code])",
  "basisValue:Math.max(0,num(distributed.weights?.[code]??weights[code])),allocatedAmount:money(distributed.allocations[code])",
  'basisValue normalizado'
));

// 5) Revogação/alteração de acesso limpa imediatamente dados financeiros carregados.
mark('js/strategy.js', replaceRequired(
  'js/strategy.js',
  "    function setAccess(access){state={...state,access:accessEngine.normalizeAccess(access)};return getState()}",
  "    function setAccess(access){financial=emptyFinancial();state={...state,access:accessEngine.normalizeAccess(access),financialLoaded:false,financialLoading:false,financialError:''};return getState()}",
  'setAccess limpa dados sensíveis'
));

// 6) Defesa em profundidade na UI: nenhuma composição/consolidação/insight agregado é renderizada sem permissão.
mark('js/app.js', replaceOneOf(
  'js/app.js',
  ["  const APP_VERSION = '2.57.6';", "  const APP_VERSION = '2.57.8';"],
  "  const APP_VERSION = '2.57.9';",
  'APP_VERSION'
));
mark('js/app.js', replaceRequired(
  'js/app.js',
  "  function renderStrategyExecutive(vm,displayAggregate){\n    const analysis=strategyExecutiveAnalysis(vm),history=strategyExecutiveHistory(vm),current=history.find(row=>row.competence===vm.state.competence),squads=strategyConsolidatedSquads(vm),insights=insightEngine.executiveInsights(analysis,vm.summary,squads,vm.competenceRecord||{}),set=(id,text)=>{const el=$(id);if(el)el.textContent=text};",
  "  function renderStrategyExecutive(vm,displayAggregate){\n    const set=(id,text)=>{const el=$(id);if(el)el.textContent=text};\n    if(!displayAggregate){\n      set('#strategyExecutiveAttendance','—');set('#strategyExecutiveFte','—');set('#strategyExecutiveAttendancePerFte','—');set('#strategyExecutiveEvaluation','—');set('#strategyExecutiveCostPerAttendance','—');\n      for(const id of ['#strategyExecutiveTotalCostDelta','#strategyExecutiveCostPerAttendanceDelta','#strategyExecutiveProductionDelta','#strategyExecutiveFteDelta']){const el=$(id);if(el){el.textContent='—';el.className='strategy-delta neutral';}}\n      set('#strategyExecutiveComparisonLabel','Sem permissão agregada');set('#strategyEfficiencyProduction','—');set('#strategyEfficiencyCost','—');set('#strategyEfficiencySpread','—');set('#strategyEfficiencyQuality','—');\n      const status=$('#strategyEfficiencyStatus');if(status){status.textContent='SEM PERMISSÃO';status.className='strategy-efficiency-status neutral';}\n      const composition=$('#strategyExecutiveComposition');if(composition)composition.innerHTML='<div class=\"chart-empty\">Sem permissão agregada.</div>';\n      const rowsEl=$('#strategyExecutiveSquadRows');if(rowsEl)rowsEl.innerHTML='<tr><td colspan=\"7\" class=\"muted\">Sem permissão agregada.</td></tr>';\n      const insightEl=$('#strategyExecutiveInsights');if(insightEl)insightEl.innerHTML='';\n      if($('#strategyExecutiveUnitCostChart'))$('#strategyExecutiveUnitCostChart').innerHTML='<div class=\"chart-empty\">Sem permissão agregada.</div>';if($('#strategyExecutiveEfficiencyChart'))$('#strategyExecutiveEfficiencyChart').innerHTML='<div class=\"chart-empty\">Sem permissão agregada.</div>';\n      return;\n    }\n    const analysis=strategyExecutiveAnalysis(vm),history=strategyExecutiveHistory(vm),current=history.find(row=>row.competence===vm.state.competence),squads=strategyConsolidatedSquads(vm),insights=insightEngine.executiveInsights(analysis,vm.summary,squads,vm.competenceRecord||{});",
  'renderStrategyExecutive fail-closed'
));
mark('js/app.js', replaceRequired(
  'js/app.js',
  "  function renderStrategySquadConsolidation(vm){const tbody=$('#strategySquadCostRows');if(!tbody)return;const rows=strategyConsolidatedSquads(vm);",
  "  function renderStrategySquadConsolidation(vm,displayAggregate=false){const tbody=$('#strategySquadCostRows');if(!tbody)return;if(!displayAggregate){tbody.innerHTML='<tr><td colspan=\"8\" class=\"muted\">Sem permissão agregada.</td></tr>';return;}const rows=strategyConsolidatedSquads(vm);",
  'consolidação por Squad protegida'
));
mark('js/app.js', replaceRequired(
  'js/app.js',
  "    renderStrategyPeopleRows(vm);renderStrategyOperationalRows(vm);renderStrategySquadConsolidation(vm);",
  "    renderStrategyPeopleRows(vm);renderStrategyOperationalRows(vm);renderStrategySquadConsolidation(vm,displayAggregate);",
  'chamada de consolidação protegida'
));
mark('js/app.js', replaceRequired(
  'js/app.js',
  "console.error('Falha ao carregar Gestão Estratégica V2.57.6',err)",
  "console.error('Falha ao carregar Gestão Estratégica V2.57.9',err)",
  'log de versão estratégica'
));

// 7) HTML/cache-busters e rótulos de release.
{
  const path = 'index.html';
  let html = read(path);
  const before = html;
  html = html.replaceAll('?v=2.57.6', '?v=2.57.9').replaceAll('?v=2.57.8', '?v=2.57.9');
  html = html.replaceAll('V2.57.8', 'V2.57.9');
  html = html.replace('V2.57.9 • Reimportação substitutiva e saneamento', 'V2.57.9 • Hardening, segurança e regressões');
  html = html.replace('A V2.57.9 mantém fechamento seguro e passa a tratar a reimportação operacional como fotografia substitutiva da competência aberta.', 'A V2.57.9 reforça permissões, limpeza de dados sensíveis em memória, integridade dos rateios e regressões automáticas da Gestão Estratégica.');
  if (html === before && !html.includes('?v=2.57.9')) throw new Error('index.html não apresentou marcadores esperados da V2.57.8/V2.57.9.');
  write(path, html); changed.push(path);
}

// 8) Validador passa a bloquear divergência entre package, lock, APP_VERSION e cache-busters.
mark('scripts/validate-project.mjs', replaceRequired(
  'scripts/validate-project.mjs',
  "  'package.json',\n  'tests/finance-rules.test.js',",
  "  'package.json',\n  'tests/strategy-hardening-v2579.test.js',\n  'docs/HARDENING_ESTRATEGIA_V2.57.9.md',\n  'tests/finance-rules.test.js',",
  'arquivos obrigatórios V2.57.9'
));
mark('scripts/validate-project.mjs', replaceRequired(
  'scripts/validate-project.mjs',
  "const appText = readFileSync(join(root, 'js', 'app.js'), 'utf8');\nif (appText.includes('squad-dashboard-v2.1.0')) errors.push('Referência ao nome antigo do repositório encontrada em js/app.js.');",
  `const appText = readFileSync(join(root, 'js', 'app.js'), 'utf8');\nconst packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));\nconst packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));\nconst releaseVersion = String(packageJson.version || '').trim();\nif (!releaseVersion) errors.push('package.json não informa versão da aplicação.');\nif (String(packageLock.version || '') !== releaseVersion) errors.push(\`package-lock.json divergente do package.json: \${packageLock.version || 'sem versão'} != \${releaseVersion}.\`);\nif (String(packageLock.packages?.['']?.version || '') !== releaseVersion) errors.push(\`package-lock root divergente do package.json: \${packageLock.packages?.['']?.version || 'sem versão'} != \${releaseVersion}.\`);\nconst appVersionMatch = appText.match(/const APP_VERSION = ['\"]([^'\"]+)['\"]/);\nif (!appVersionMatch) errors.push('js/app.js não declara APP_VERSION.');\nelse if (appVersionMatch[1] !== releaseVersion) errors.push(\`APP_VERSION divergente do package.json: \${appVersionMatch[1]} != \${releaseVersion}.\`);\nfor (const match of index.matchAll(/(?:src|href)=['\"]([^'\"]+)\\?v=([^'\"]+)['\"]/g)) {\n  const asset = match[1], version = match[2];\n  if (asset === 'js/audit-utils.js') continue;\n  if (version !== releaseVersion) errors.push(\`Cache-buster divergente em \${asset}: \${version} != \${releaseVersion}.\`);\n}\nfor (const marker of [\`login-version\">V\${releaseVersion}\`,\`sidebar-footer\">V\${releaseVersion}\`,\`GUIA COMPLETO • V\${releaseVersion}\`]) {\n  if (!index.includes(marker)) errors.push(\`index.html não apresenta o marcador de release esperado: \${marker}.\`);\n}\nif (appText.includes('squad-dashboard-v2.1.0')) errors.push('Referência ao nome antigo do repositório encontrada em js/app.js.');`,
  'consistência de versão no validador'
));

// 9) Testes de regressão.
const hardeningTest = `const test = require('node:test');\nconst assert = require('node:assert/strict');\nconst fs = require('node:fs');\nconst path = require('node:path');\n\nconst access = require('../js/strategy-access.js');\nconst data = require('../js/strategy-data.js');\nconst cost = require('../js/strategy-cost-engine.js');\nconst strategy = require('../js/strategy.js');\n\ntest('V2.57.9: campo DB explícito false prevalece sobre camelCase stale true', () => {\n  const normalized = access.normalizeAccess({ canViewStrategy: true, can_view_strategy: false });\n  assert.equal(normalized.canViewStrategy, false);\n  assert.equal(access.normalizeAccess({ canViewStrategy: true }).canViewStrategy, true);\n});\n\ntest('V2.57.9: alteração/revogação de acesso apaga dados financeiros carregados', () => {\n  const controller = strategy.createController();\n  controller.initializeContext({ squads: { D: { code: 'D', name: 'Squad D', months: { '2026-10': {} } } } });\n  controller.setAccess({ canViewStrategy: true, canViewAggregates: true, canViewPeopleCosts: true, canEditCosts: true });\n  controller.setFinancialData({\n    competences: [{ id: 'c1', competence: '2026-10-01', status: 'draft' }],\n    summary: { competence: '2026-10', people_cost: 900, operational_cost: 100, total_cost: 1000 },\n    history: [{ competence: '2026-10', total_cost: 1000, attendance: 100 }]\n  });\n  assert.equal(controller.getState().financialLoaded, true);\n  assert.equal(controller.getFinancialData().summary.totalCost, 1000);\n  controller.setAccess({ canViewStrategy: true, canViewAggregates: false, canViewPeopleCosts: false, canEditCosts: false });\n  assert.equal(controller.getState().financialLoaded, false);\n  assert.equal(controller.getFinancialData().summary.totalCost, 0);\n  assert.deepEqual(controller.getFinancialData().history, []);\n});\n\ntest('V2.57.9: total_cost explícito negativo é normalizado para zero', () => {\n  const row = data.normalizeEmployeeCostRow({ person_id: 'p1', fte: 1, salary: 100, total_cost: -50 });\n  assert.equal(row.totalCost, 0);\n});\n\ntest('V2.57.9: percentual de rateio fica limitado entre 0 e 1', () => {\n  assert.equal(data.normalizeAllocationRow({ operational_cost_id: 'op1', percentage: 2 }).percentage, 1);\n  assert.equal(data.normalizeAllocationRow({ operational_cost_id: 'op1', percentage: -2 }).percentage, 0);\n});\n\ntest('V2.57.9: aliases de Squad são consolidados sem perder centavos', () => {\n  const result = cost.allocateCents(10.01, { a: 1, A: 1, B: 2 });\n  assert.deepEqual(Object.keys(result.allocations).sort(), ['A', 'B']);\n  assert.equal(result.weights.A, 2);\n  assert.equal(result.basis, 4);\n  assert.equal(result.percentages.A, 0.5);\n  assert.equal(Number(Object.values(result.allocations).reduce((sum, value) => sum + value, 0).toFixed(2)), 10.01);\n});\n\ntest('V2.57.9: rateio operacional usa base normalizada e preserva o valor total', () => {\n  const rows = cost.calculateOperationalAllocations(\n    { amount: 10.01, scopeType: 'organization', allocationMethod: 'fte' },\n    { fteBySquad: { a: 1, A: 1, B: 2 } }\n  );\n  const a = rows.find(row => row.squadCode === 'A');\n  assert.equal(a.basisValue, 2);\n  assert.equal(Number(rows.reduce((sum, row) => sum + row.allocatedAmount, 0).toFixed(2)), 10.01);\n});\n\ntest('V2.57.9: versão do motor de custo identifica a regra corrigida', () => {\n  assert.equal(cost.RULE_VERSION, 'SC-0.6.1');\n});\n\ntest('V2.57.9: UI executiva aplica guarda agregada antes de calcular dados sensíveis', () => {\n  const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');\n  const start = app.indexOf('function renderStrategyExecutive(vm,displayAggregate)');\n  const end = app.indexOf('async function loadStrategyFinanceData', start);\n  assert.ok(start >= 0 && end > start);\n  const block = app.slice(start, end);\n  const guard = block.indexOf('if(!displayAggregate)');\n  const analysis = block.indexOf('strategyExecutiveAnalysis(vm)');\n  assert.ok(guard >= 0, 'guarda de permissão agregada ausente');\n  assert.ok(analysis > guard, 'análise agregada ocorre antes da guarda de permissão');\n  assert.match(app, /renderStrategySquadConsolidation\\(vm,displayAggregate=false\\)/);\n  assert.match(app, /renderStrategySquadConsolidation\\(vm,displayAggregate\\)/);\n});\n`;
write('tests/strategy-hardening-v2579.test.js', hardeningTest);
changed.push('tests/strategy-hardening-v2579.test.js');

// 10) Documentação da etapa.
const hardeningDoc = `# V2.57.9 — Hardening, segurança e regressões\n\n## Objetivo\nEncerrar a Fase 2 da Gestão Estratégica com defesa em profundidade, integridade de cálculos e regressões automáticas antes de avançar para Eficiência.\n\n## Alterações\n- Permissões estratégicas passam a ser **fail-closed**: quando o payload contém o campo oficial do banco (snake_case), ele é autoritativo, inclusive quando é \`false\`.\n- Qualquer alteração/revogação de acesso limpa imediatamente o contexto financeiro em memória e força nova carga antes de reutilizar dados.\n- A UI executiva não calcula nem renderiza composição de custos, consolidação por Squad, insights ou gráficos agregados quando \`can_view_aggregates\` não está ativo.\n- \`total_cost\` explícito negativo é normalizado para zero.\n- Percentuais persistidos de rateio são limitados a 0..1.\n- O motor de rateio consolida códigos equivalentes após normalização (ex.: \`a\` e \`A\`) antes de distribuir centavos, evitando sobrescrita/perda de valor.\n- Motor de custo passa de \`SC-0.6.0-snapshot\` para \`SC-0.6.1\`.\n- CI/validador passa a exigir consistência entre \`package.json\`, \`package-lock.json\`, \`APP_VERSION\` e cache-busters do HTML.\n- Nova suíte \`strategy-hardening-v2579.test.js\` cobre permissão, limpeza de memória, limites financeiros, rateio e guarda da UI.\n\n## Banco de dados\nNão há nova migration nesta versão. As proteções desta entrega são de aplicação, normalização, renderização e regressão. As RLS/RPCs já existentes continuam sendo a camada autoritativa no servidor.\n\n## Checklist de regressão\n1. Usuário sem Gestão Estratégica não vê a rota.\n2. Usuário com Estratégia, mas sem agregados, vê valores protegidos e nenhuma composição/consolidação antiga.\n3. Revogar acesso do próprio usuário limpa a tela sem depender de refresh.\n4. Custos individuais continuam disponíveis somente com \`can_view_people_costs\`.\n5. Edição continua exigindo \`can_edit_costs\` + visualização de pessoas.\n6. Fechamento/reabertura e snapshots da V2.57.6 permanecem sem alteração funcional.\n7. Reimportação/saneamento das V2.57.7/V2.57.8 permanece sem alteração funcional.\n8. Rateios somam exatamente o valor do custo, inclusive com aliases de Squad que normalizam para o mesmo código.\n9. \`npm run check\` deve finalizar sem falhas.\n\n## Critério de saída da Fase 2\nA Fase 2 pode ser considerada encerrada quando \`npm run check\` estiver verde e os cenários de permissão acima forem validados em ambiente conectado ao Supabase.\n`;
write('docs/HARDENING_ESTRATEGIA_V2.57.9.md', hardeningDoc);
changed.push('docs/HARDENING_ESTRATEGIA_V2.57.9.md');

// 11) CHANGELOG e README.
{
  const path = 'CHANGELOG.md';
  let text = read(path);
  if (!text.includes('## V2.57.9 — Hardening, segurança e regressões')) {
    const section = `## V2.57.9 — Hardening, segurança e regressões\n\n- torna a normalização de permissões estratégica fail-closed quando o campo oficial do banco está presente;\n- limpa dados financeiros em memória imediatamente após alteração/revogação de acesso;\n- bloqueia composição, consolidação, insights e gráficos agregados na UI sem \`can_view_aggregates\`;\n- normaliza custos negativos e percentuais de rateio fora de 0..1;\n- consolida aliases de Squad no rateio antes da distribuição de centavos;\n- atualiza o motor estratégico para \`SC-0.6.1\`;\n- adiciona regressões específicas e trava de consistência de versão no validador;\n- não exige migration nova.\n\n`;
    text = text.replace(/\n# Changelog\n/, '\n');
    if (text.startsWith('# Changelog')) text = text.replace(/^# Changelog\s*/, '');
    text = `# Changelog\n\n${section}${text}`;
    write(path, text); changed.push(path);
  }
}
{
  const path = 'README.md';
  let text = read(path);
  if (!text.includes('## V2.57.9 — Hardening, segurança e regressões')) {
    const section = `## V2.57.9 — Hardening, segurança e regressões\n\nA Gestão Estratégica encerra a Fase 2 com permissões fail-closed, limpeza imediata de dados financeiros após revogação de acesso, proteção de renderização agregada, normalização defensiva de valores e regressões automáticas para o motor de rateio. O CI também passa a bloquear versões divergentes entre package, lock, APP_VERSION e cache-busters.\n\nNão há migration nova. Detalhes: \`docs/HARDENING_ESTRATEGIA_V2.57.9.md\`.\n\n`;
    write(path, section + text); changed.push(path);
  }
}

console.log(`V2.57.9 aplicada. Arquivos alterados/criados: ${[...new Set(changed)].length}`);
for (const path of [...new Set(changed)]) console.log(`- ${path}`);
console.log('\nPróximo passo: npm run check');
