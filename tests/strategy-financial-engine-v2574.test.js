const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const engine=require(join(root,'js','strategy-cost-engine.js'));
const access=require(join(root,'js','strategy-access.js'));
const app=readFileSync(join(root,'js','app.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.57.4.sql');
const migration=readFileSync(migrationPath,'utf8');

test('V2.57.7 publica motor financeiro e consolidação por Squad',()=>{assert.equal(pkg.version,'2.62.8');assert.equal(existsSync(migrationPath),true);assert.match(index,/strategySquadCostRows/);assert.match(index,/strategyOperationalRows/);assert.match(app,/get_strategy_financial_summary/);assert.match(app,/get_strategy_squad_cost_summary/);});

test('checkbox estratégico do MVP habilita custos pessoais e edição',()=>{const demo=access.demoAccessForRole('super_admin',true);assert.equal(demo.canViewStrategy,true);assert.equal(demo.canViewPeopleCosts,true);assert.equal(demo.canEditCosts,true);assert.match(app,/can_view_people_costs:enabled===true,can_edit_costs:enabled===true/);assert.match(migration,/where can_view_strategy = true/i);});

test('rateio por FTE preserva exatamente o valor em centavos',()=>{const rows=engine.calculateOperationalAllocations({amount:100,scopeType:'organization',allocationMethod:'fte'},{fteBySquad:{A:1,B:2,D:3}});assert.equal(rows.reduce((s,r)=>s+r.allocatedAmount,0),100);assert.equal(rows.find(r=>r.squadCode==='D').allocatedAmount,50);});

test('rateio por atendimento e direto funcionam sem misturar bases',()=>{const attendance=engine.calculateOperationalAllocations({amount:120,scopeType:'organization',allocationMethod:'attendance'},{attendanceBySquad:{A:100,B:200}});assert.equal(attendance.find(r=>r.squadCode==='A').allocatedAmount,40);assert.equal(attendance.find(r=>r.squadCode==='B').allocatedAmount,80);const direct=engine.calculateOperationalAllocations({amount:77.5,scopeType:'squad',squadCode:'D',allocationMethod:'direct'},{});assert.deepEqual(direct.map(r=>[r.squadCode,r.allocatedAmount]),[['D',77.5]]);});

test('base ausente não perde custo e marca não rateado',()=>{const rows=engine.calculateOperationalAllocations({amount:90,scopeType:'organization',allocationMethod:'fte'},{fteBySquad:{}});assert.equal(rows.length,1);assert.equal(rows[0].squadCode,'UNALLOCATED');assert.equal(rows[0].allocatedAmount,90);});

test('consolidação por Squad soma pessoas operação e calcula unit economics',()=>{const people=[{personId:'1',squadCode:'A',fte:1,salary:3000},{personId:'2',squadCode:'D',fte:1,salary:4000}];const ops=[{id:'o1',amount:300}];const allocations=[{operationalCostId:'o1',squadCode:'A',allocatedAmount:100},{operationalCostId:'o1',squadCode:'D',allocatedAmount:200}];const rows=engine.consolidateSquads({squadCodes:['A','D'],peopleCosts:people,operationalCosts:ops,allocations,operationalStats:{A:{attendance:100},D:{attendance:200}}});const a=rows.find(r=>r.squadCode==='A'),d=rows.find(r=>r.squadCode==='D');assert.equal(a.totalCost,3100);assert.equal(a.costPerAttendance,31);assert.equal(d.totalCost,4200);assert.equal(d.costPerAttendance,21);});

test('migration cria tabelas operacionais RPCs e RLS',()=>{assert.match(migration,/strategy_operational_costs/i);assert.match(migration,/strategy_cost_allocations/i);assert.match(migration,/get_strategy_financial_summary/i);assert.match(migration,/get_strategy_squad_cost_summary/i);assert.match(migration,/enable row level security/i);});
