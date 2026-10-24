const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const efficiency=require(join(root,'js','strategy-efficiency.js'));
const data=require(join(root,'js','strategy-data.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.58.2.sql');
const migration=readFileSync(migrationPath,'utf8');

test('V2.58.2 permanece preservada com custo por resolução e migration própria',()=>{
  assert.equal(pkg.version,'2.60.7');
  assert.equal(pkg.assetVersion,'2.60.7');
  assert.equal(efficiency.RULE_VERSION,'EF-0.9.0-phase3-hardening');
  assert.equal(existsSync(migrationPath),true);
  assert.match(index,/INDICADOR V2\.58\.2[\s\S]*Custo por resolução/);
  assert.match(index,/strategyCostPerResolutionValue/);
  assert.match(index,/strategyCostPerResolutionSquadRows/);
  assert.match(index,/strategyCostPerResolutionTechRows/);
  assert.match(index,/strategySaveResolutionMetricsBtn/);
});

test('motor calcula custo e taxa de resolução sem dividir por zero',()=>{
  assert.equal(efficiency.calculateCostPerResolution(30000,1500),20);
  assert.equal(efficiency.calculateCostPerResolution(30000,0),null);
  assert.equal(efficiency.calculateResolutionRate(1500,2000),.75);
  assert.equal(efficiency.calculateResolutionRate(0,0),null);
  assert.equal(efficiency.calculateResolutionRate(2500,2000),1);
});

test('comparação de custo por resolução mede delta e impacto econômico',()=>{
  const result=efficiency.buildCostPerResolution({
    current:{totalCost:30000,attendance:2000,resolutions:1500},
    baseline:{totalCost:32000,attendance:2000,resolutions:1400},
    comparisonLabel:'Mês anterior'
  });
  assert.equal(result.status,'ready');
  assert.equal(result.current.costPerResolution,20);
  assert.ok(Math.abs(result.baseline.costPerResolution-(32000/1400))<1e-9);
  assert.ok(result.delta<0);
  assert.ok(result.impact<0);
});

test('normalização financeira preserva resoluções, entradas e taxa',()=>{
  const row=data.normalizeFinancialSummary({total_cost:50000,attendance:2500,resolutions:1800,resolution_entries:8});
  assert.equal(row.resolutions,1800);
  assert.equal(row.resolutionEntries,8);
  assert.equal(row.costPerResolution,50000/1800);
  assert.equal(row.resolutionRate,.72);
});

test('migration cria base explícita e protege competência fechada',()=>{
  assert.match(migration,/create table if not exists public\.strategy_resolution_metrics/i);
  assert.match(migration,/resolutions bigint not null default 0 check \(resolutions >= 0\)/i);
  assert.match(migration,/public\.is_strategy_competence_open\(competence_id\)/i);
  assert.match(migration,/get_strategy_resolution_summary/i);
  assert.match(migration,/get_strategy_resolution_squad_summary/i);
  assert.match(migration,/get_strategy_resolution_history/i);
  assert.match(migration,/has_strategy_access\('people_costs'\)/i);
  assert.match(migration,/has_strategy_access\('aggregates'\)/i);
});

test('UI não usa atendimentos como resolução e persiste linhas explícitas',()=>{
  const start=app.indexOf('function strategyCostPerResolutionAnalysis');
  const end=app.indexOf('function renderStrategyEfficiency(vm',start);
  assert.ok(start>=0&&end>start);
  const block=app.slice(start,end);
  assert.match(block,/strategyResolutionMetricForUser/);
  assert.match(block,/strategy_resolution_metrics/);
  assert.match(block,/resoluções não podem superar os atendimentos/i);
  assert.match(block,/strategyEfficiencyEngine\.calculateCostPerResolution/);
  assert.doesNotMatch(block,/resolutions\s*=\s*attendance/);
});
