'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const r=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const auto=require('../js/strategy-automation');
const strategy=require('../js/strategy');
const settings=require('../js/settings-engine');
const navigation=require('../js/navigation-engine');
const sql=r('supabase/migrations/MIGRACAO_V2.63.0.sql');
const app=r('js/app.js');
const index=r('index.html');
const create=r('supabase/functions/create-user/index.ts');
const manage=r('supabase/functions/manage-user/index.ts');
const cfg={organizationId:'org-a',userId:'actor-1'};
test('fontes comerciais sao exatamente CSV recorrente, CSV avulso e manual',()=>{
 assert.deepEqual(auto.SOURCE_DEFINITIONS.map(s=>s.key),['contracted_modules_csv','merchandise_sales_csv','manual']);
 assert.equal(auto.sourceByKey('invalid'),null);
 assert.equal(auto.sourceByKey('contracted_modules_csv').generatesMrr,true);
 assert.equal(auto.sourceByKey('merchandise_sales_csv').generatesMrr,false);
 assert.equal(auto.sourceByKey('manual').generatesMrr,null);
});
test('fonte manual reserva decisao MRR para produto ou venda futura',()=>{
 const rows=auto.createSourcePayload(cfg.organizationId,cfg.userId);
 assert.equal(rows.find(x=>x.source_key==='manual').generates_mrr,false);
 assert.equal(auto.sourceByKey('manual').generatesMrr,null);
});
test('criar payload de fontes exige org e ator, permanece idempotente e nao muta definicoes',()=>{
 assert.throws(()=>auto.createSourcePayload(null,'a'),/obrigatorios/);
 assert.throws(()=>auto.createSourcePayload('org',null),/obrigatorios/);
 const x=auto.createSourcePayload('org','actor');assert.equal(x.length,3);
 assert.equal(new Set(x.map(y=>y.source_key)).size,3);
 assert.ok(x.every(y=>Object.isFrozen(y)));
 assert.equal(auto.SOURCE_DEFINITIONS[0].key,'contracted_modules_csv');
});
test('normalizacao nao duplica por caixa, espaços ou acentos',()=>{
 assert.equal(auto.normalizeName('  Módulo    ADICIONAL  '),'modulo adicional');
 assert.equal(auto.normalizeName('MÓDULO adicional'),'modulo adicional');
});
test('squad valido precisa de codigo A-E; sem grupo nao recebe atribuicao',()=>{
 assert.equal(auto.normalizeSquad(' c '),'C');
 assert.equal(auto.normalizeSquad('b'),'B');
 assert.equal(auto.normalizeSquad(''),null);
 assert.equal(auto.normalizeSquad('PRE'),null);
 assert.equal(auto.normalizeSquad('F'),null);
});
test('pre-atendimento possui identidade propria no SquAD C',()=>{
 assert.equal(auto.isPreAttendance({role:'pre_attendance',squadCode:'C'}),true);
 assert.equal(auto.isPreAttendance({role:'technician',squadCode:'C'}),false);
 assert.equal(auto.isPreAttendance({functionalTeam:'pre_attendance'}),true);
 assert.equal(auto.isPreAttendance({role:'technician',squadCode:'A'}),false);
});
test('vinculo de usuario exige conta ativa, mesmo tenant e pessoa livre',()=>{
 const profile={userId:'u1',organizationId:'org',role:'pre_attendance',active:true};
 const person={id:'p1',organizationId:'org',userId:null};
 const linked=auto.validateIdentityLink({profile,person});
 assert.deepEqual(linked,{userId:'u1',personId:'p1',functionalTeam:'pre_attendance',squadCode:'C'});
 assert.equal(Object.isFrozen(linked),true);
 assert.throws(()=>auto.validateIdentityLink({profile:{...profile,active:false},person}),/inativa/);
 assert.throws(()=>auto.validateIdentityLink({profile:{...profile,role:'technician'},person}),/perfil/);
 assert.throws(()=>auto.validateIdentityLink({profile,person:{...person,organizationId:'other'}}),/Organizacoes/);
 assert.throws(()=>auto.validateIdentityLink({profile,person:{...person,userId:'someone'}}),/vinculada/);
});
test('Gestao Estrategica inclui Automacao e Squad C sem eliminar PRE legado',()=>{
 assert.ok(strategy.VALID_SECTIONS.includes('automation'));
 const codes=strategy.STRATEGIC_GROUPS.map(g=>g.code);
 assert.ok(codes.includes('C'));assert.ok(codes.includes('PRE'));
});
test('perfil pre possui zero permissoes operacionais por padrao',()=>{
 assert.equal(settings.normalizeRole('pre_attendance'),'pre_attendance');
 assert.equal(settings.normalizeRole('squad_admin'),'super_admin');
 const perms=settings.effectivePermissions('pre_attendance',{'finance.view':true,'data.import':true});
 assert.ok(Object.values(perms).every(x=>x===false));
 assert.equal(settings.can('pre_attendance',{},'users.manage'),false);
});
test('login do perfil pre aponta somente para propria tela e protege rotas operacionais',()=>{
 assert.match(app,/state\.currentView=user\.role==='pre_attendance'\?'pre-attendance':'home'/);
 assert.match(app,/if\(isPreAttendance\(\)&&!\['pre-attendance','profile','settings','help'\]\.includes\(name\)\)/);
 assert.ok(index.includes('id="view-pre-attendance"'));
 assert.ok(index.includes('class="nav-btn pre-attendance-only hidden"'));
 assert.match(app,/if\(isPreAttendance\(\)\)\{\$\$\('\[data-nav-group=/);
});
test('contas sao criadas no backend com perfil distinto e pessoa estrategica',()=>{
 assert.match(create,/\['super_admin','technician','pre_attendance'\]/);
 assert.match(create,/if\(role==='pre_attendance'\)/);
 assert.match(create,/functional_team:'pre_attendance'/);
 assert.match(create,/default_squad_code:'C'/);
 assert.match(create,/await admin\.auth\.admin\.deleteUser\(created\.user\.id\)/);
 assert.match(create,/if \(role === 'technician' && targetSquad/);
});
test('alteracao de conta impede conversao pre suporte com historico existente',()=>{
 assert.match(manage,/\(role==='pre_attendance'\)!==\(target\.role==='pre_attendance'\)/);
 assert.match(app,/\(u\.role==='pre_attendance'\)!==\(role==='pre_attendance'\)/);
});
test('RLS pre tem seletor proprio e nao expoe custos salariais',()=>{
 assert.match(sql,/strategy_pre_attendance_self_select/);
 assert.match(sql,/user_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/functional_team='pre_attendance'/);
 assert.doesNotMatch(sql,/drop policy if exists strategy_employee_costs_select/);
});
test('RPC de vinculo exige admin, autorizacao financeira e escopo multiempresa',()=>{
 assert.match(sql,/link_strategy_pre_attendance_person/);
 assert.match(sql,/role='super_admin'/);
 assert.match(sql,/has_strategy_access\('people_costs'\)/);
 assert.match(sql,/has_strategy_access\('edit_costs'\)/);
 assert.match(sql,/where user_id=p_user_id and organization_id=v_org/);
 assert.match(sql,/Conta ja possui custos/);
 assert.match(sql,/Conta ja possui receitas/);
 assert.match(sql,/Conta ja possui atribuicoes/);
});
test('fonte recorrente gera MRR, avulsa nao; conta manual nao presume receita',()=>{
 assert.match(sql,/source_semantics_v2630/);
 assert.match(sql,/source_key='contracted_modules_csv' and origin='csv' and generates_mrr/);
 assert.match(sql,/source_key='merchandise_sales_csv' and origin='csv' and not generates_mrr/);
 assert.match(sql,/source_key='manual' and origin='manual' and not generates_mrr/);
});
test('lotes se mantem isolados por tenant e sem escrita até existir parser validado',()=>{
 assert.match(sql,/strategy_import_batch_scope_guard_v2630/);
 assert.match(sql,/s\.organization_id=new\.organization_id/);
 assert.match(sql,/alter table public\.strategy_import_batches enable row level security/);
 assert.match(sql,/grant select on public\.strategy_import_batches to authenticated/);
 assert.doesNotMatch(sql,/grant select,insert on public\.strategy_import_batches/);
});
test('fontes ainda nao importam arquivos e sao preparadas sem duplicar',()=>{
 assert.match(app,/onConflict:'organization_id,source_key',ignoreDuplicates:true/);
 assert.match(index,/id="strategyAutomationInitSources"/);
 assert.match(index,/id="strategyAutomationBindUser"/);
 assert.match(index,/id="strategyAutomationSourceRows"/);
 assert.match(index,/O reconhecimento de receitas e comissões será implementado nas próximas versões/);
});
test('login RPC nao retorna squad, competencias nem bonus de suporte ao perfil pre',()=>{
 const a=sql.indexOf("if v_profile.role = 'pre_attendance' then");
 const b=sql.indexOf('select max(sm.year * 100 + sm.month)');
 assert.ok(a>0&&b>a);
 const block=sql.slice(a,b);
 assert.match(block,/'squads','\[\]'::jsonb/);
 assert.match(block,/'month_index','\[\]'::jsonb/);
 assert.match(block,/'home_months','\[\]'::jsonb/);
 assert.match(block,/return jsonb_build_object/);
});
test('regras obrigatorias ficam no repositorio para futuras entregas',()=>{
 const rules=r('docs/FASE8_REGRAS_OBRIGATORIAS_V2.63.0.md'),agents=r('AGENTS.md');
 for(const text of ['Vl Atual Ativo','Vl Anterior','Squad C','valor fixo','bonificação oficial','cancelamentos','MIGRACAO']){
   if(text==='MIGRACAO')continue;
   assert.match(rules,new RegExp(text,'i'));
 }
 assert.match(agents,/docs\/FASE8_REGRAS_OBRIGATORIAS_V2\.63\.0\.md/);
});
test('Versao consistente',()=>{
 assert.equal(JSON.parse(r('package.json')).version,'2.63.1');
 assert.match(app,/const APP_VERSION = '2\.63\.1'/);
 assert.match(index,/js\/strategy-automation\.js\?v=2\.63\.1-r1/);
 assert.ok(r('supabase/migrations/README.md').includes('V2.63.0'));
});

test('navegacao restaura rota de Pre-atendimento e reconhece Automacao estrategica',()=>{
 assert.equal(navigation.normalizeRoute({page:'pre-attendance'}).page,'pre-attendance');
 assert.equal(navigation.normalizeRoute({page:'strategy',section:'automation'}).section,'automation');
 assert.match(app,/routeAccessible\(route\)\?route:\{page:isPreAttendance\(\)\?'pre-attendance':'home'\}/);
 assert.match(app,/if\(isPreAttendance\(\)\&\&!\['pre-attendance','settings','profile','help'\]\.includes\(command\.view\)\)return false/);
 assert.match(app,/if\(state\.currentView==='pre-attendance'\)return\[breadcrumbRoute/);
});
test('diretorio exibe Squad C somente para perfil pre sem vinculo operacional',()=>{
 assert.match(app,/normalizeAccessRole\(p\.role\)==='pre_attendance'\?'C':/);
 assert.match(create,/squad_id:role==='technician'\?targetSquad!\.id:null/);
});
