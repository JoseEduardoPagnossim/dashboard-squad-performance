const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const result=require(join(root,'js','strategy-result.js'));
const data=require(join(root,'js','strategy-data.js'));
const strategy=require(join(root,'js','strategy.js'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.60.5.sql'),'utf8');

function access(){return{canViewStrategy:true,canViewAggregates:true,canViewPeopleCosts:true,canEditCosts:true,remoteAvailable:true};}

test('V2.60.5 publica Resultado por Squad e atualiza motor',()=>{
  assert.equal(pkg.version,'2.61.4');
  assert.equal(pkg.assetVersion,'2.61.4');
  assert.equal(result.RULE_VERSION,'RE-1.0.0-phase5-hardening');
  assert.equal(result.CATALOG.find(item=>item.id==='result-by-squad')?.state,'ready');
  assert.ok(existsSync(join(root,'docs','RESULTADO_SQUAD_V2.60.5.md')));
  assert.ok(existsSync(join(root,'supabase','migrations','MIGRACAO_V2.60.5.sql')));
  assert.ok(index.includes('V2.60.5 • RESULTADO POR SQUAD'));
  assert.ok(index.includes('js/strategy-result.js?v=2.61.4'));
});

test('motor normaliza e ordena Resultado por Squad sem total composto',()=>{
  const vm=result.buildSquadResults({scope:{competence:'2026-10',squadCode:'all'},aggregate:{
    source_available:true,squad_count:2,technician_count:5,participation_count:7,credited_event_count:6,
    direct_revenue:1000,influenced_revenue:2000,protected_revenue:3000,direct_mrr:100,influenced_mrr:200,protected_mrr:300,
    rows:[
      {squad_code:'E',technician_count:2,participation_count:2,direct_revenue:300,influenced_revenue:500,protected_revenue:700},
      {squad_code:'D',technician_count:3,participation_count:5,direct_revenue:700,influenced_revenue:1500,protected_revenue:2300}
    ]
  }});
  assert.equal(vm.status,'ready');
  assert.equal(vm.squadCount,2);
  assert.equal(vm.directRevenue,1000);
  assert.equal(vm.influencedRevenue,2000);
  assert.equal(vm.protectedRevenue,3000);
  assert.deepEqual(vm.rows.map(row=>row.squadCode),['D','E']);
  assert.equal(Object.hasOwn(vm,'totalRevenue'),false);
  assert.match(vm.warnings.join(' '),/não formam um total econômico único/i);
});

test('contexto financeiro preserva Resultado por Squad',()=>{
  const ctx=data.buildFinancialContext({resultSquad:{source_available:true,squad_count:1,direct_revenue:500,rows:[{squad_code:'D',technician_count:2,direct_revenue:500}]}});
  assert.equal(ctx.resultSquad.sourceAvailable,true);
  assert.equal(ctx.resultSquad.squadCount,1);
  assert.equal(ctx.resultSquad.rows[0].squadCode,'D');
  assert.equal(ctx.resultSquad.rows[0].directRevenue,500);
});

test('controller expõe Resultado por Squad no view model',()=>{
  const controller=strategy.createController({access:access(),competence:'2026-10'});
  controller.initializeContext({squads:{D:{name:'Delta',competences:['2026-10']}}});
  controller.setFinancialData({competences:[{competence:'2026-10'}],resultSquad:{sourceAvailable:true,squadCount:1,rows:[{squadCode:'D',directRevenue:250}]}});
  const vm=controller.viewModel();
  assert.equal(vm.financial.resultSquad.sourceAvailable,true);
  assert.equal(vm.financial.resultSquad.rows[0].directRevenue,250);
});

test('app carrega e renderiza Resultado por Squad como visão agregada',()=>{
  assert.match(app,/get_strategy_result_squad_summary/);
  assert.match(app,/renderStrategySquadResults/);
  assert.match(app,/strategySquadResultRows/);
  assert.match(app,/canViewAggregates/);
  assert.doesNotMatch(app,/result\.directRevenue\s*\+\s*result\.influencedRevenue\s*\+\s*result\.protectedRevenue/);
});

test('migration calcula participação antes do filtro de Squad',()=>{
  const credited=migration.indexOf('), credited as (');
  const scoped=migration.indexOf('), scoped as (');
  assert.ok(credited>0&&scoped>credited);
  assert.match(migration,/effective_share/);
  assert.match(migration,/where v_all or effective_squad=v_code/);
  assert.match(migration,/attribution_share/);
});

test('migration exige agregados e não expõe identificação individual no retorno',()=>{
  assert.match(migration,/has_strategy_access\('aggregates'\)/);
  assert.match(migration,/get_strategy_result_squad_summary/);
  assert.doesNotMatch(migration,/'technician_name'/);
  assert.doesNotMatch(migration,/'person_id'/);
  assert.doesNotMatch(migration,/create table/i);
});

test('UI mantém as três naturezas independentes e reserva ROI para V2.60.6',()=>{
  assert.match(index,/Direta atribuída/);
  assert.match(index,/Influenciada atribuída/);
  assert.match(index,/Protegida atribuída/);
  assert.match(index,/ROI E RETORNO OPERACIONAL/);
  assert.match(index,/Sem total artificial/);
});
