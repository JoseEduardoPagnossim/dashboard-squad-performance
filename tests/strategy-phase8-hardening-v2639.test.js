'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const base = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(base, name), 'utf8');
const helper = require('../js/strategy-financial-close.js');
let audit;
async function audited() { audit ||= (await import('../scripts/audit-phase8.mjs')).auditPhase8; return audit; }

test('2639: auditoria Fase 8 aprova contrato integral e migrations 0 a 9', async()=>{
 const check = await audited(); const report = check(read);
 assert.equal(report.passed,true,report.errors.join('\n'));
 assert.equal(report.milestones,10); assert.ok(report.references>=40);
});
test('2639: auditoria detecta conflito de cache-buster', async()=>{
 const check = await audited(); const report = check(f=>f==='index.html'?read(f).replace('js/app.js?v=2.63.9-r1','js/app.js?v=2.62.9-r1'):read(f));
 assert.equal(report.passed,false); assert.ok(report.errors.some(s=>s.includes('Cache-buster')));
});
test('2639: auditoria detecta retirada do preflight sem fallback', async()=>{
 const check = await audited(),p='supabase/migrations/MIGRACAO_V2.63.9.sql';
 const report = check(f=>f===p?read(f).replace('v_row:=v_op.closed_finance_month_data;','v_row:=coalesce(v_op.closed_finance_month_data,v_op.finance_month_data);'):read(f));
 assert.equal(report.passed,false); assert.ok(report.errors.some(s=>s.includes('dados editaveis')));
});
test('2639: auditoria detecta ausencia da migration obrigatoria', async()=>{
 const check = await audited(),p='supabase/migrations/MIGRACAO_V2.63.9.sql';
 const report = check(f=>{if(f===p)throw new Error('missing');return read(f);});
 assert.equal(report.passed,false); assert.ok(report.errors.some(s=>s.includes(p)));
});
test('2639: auditoria detecta regressao nas quatro modalidades', async()=>{
 const check=await audited(),p='supabase/migrations/MIGRACAO_V2.63.6.sql';
 const report=check(f=>f===p?read(f).replace("v_kind='fixed'","v_kind='absent'"):read(f));
 assert.equal(report.passed,false); assert.ok(report.errors.some(s=>s.includes('v_kind=\'fixed\'')));
});
test('2639: auditoria recusa fontes do catálogo removidas', async()=>{
 const check=await audited(),p='supabase/migrations/MIGRACAO_V2.63.5.sql';
 const report=check(f=>f===p?read(f).replaceAll('strategy_merchandise_sales','strategy_removed_sales'):read(f));
 assert.equal(report.passed,false);assert.ok(report.errors.some(s=>s.includes('V2.63.5')));
});
test('2639: historico de lotes recorrentes e avulsos e tratado como append-only',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 for(const t of ['strategy_recurring_sales','strategy_merchandise_sales','strategy_recurring_import_attempts','strategy_merchandise_import_attempts'])
  assert.ok(sql.includes(`'${t}'`),t);
 assert.match(sql,/create trigger phase8_immutable_guard_v2639 before update or delete/);
});
test('2639: historicos de comissao, aprovacao e fechamento nao admitem edicao',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 for(const t of ['strategy_sales_commissions','strategy_pre_bonus_approvals_v2638','strategy_bonus_sync_audit_v2638','strategy_financial_closure_v2638'])
  assert.ok(sql.includes(`'${t}'`),t);
 assert.ok(!sql.includes("'strategy_bonus_cost_links_v2638'"),'link de custo e atualizavel pela RPC oficial');
});
test('2639: guarda protege DELETE e UPDATE mesmo em acesso administrativo acidental',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 assert.ok(sql.includes("using errcode='55000'"));
 assert.ok(sql.includes('revoke all on function public.strategy_phase8_immutable_guard_v2639() from public,anon,authenticated'));
});
test('2639: SQL nao soma MRR e ARR e respeita totais dos dois arquivos',()=>{
 const recur=read('supabase/migrations/MIGRACAO_V2.63.4.sql');
 const merch=read('supabase/migrations/MIGRACAO_V2.63.5.sql');
 assert.ok(recur.includes('v_value,v_value,v_value*12'));
 assert.ok(merch.includes('v_value,0,0'));
 assert.ok(merch.includes('NAO multiplica pela quantidade'));
});
test('2639: isolamentos nas funcoes de importacao por organização',()=>{
 for(const n of [4,5]){
  const sql=read(`supabase/migrations/MIGRACAO_V2.63.${n}.sql`);
  for(const fragment of ['v_org:=(select (public.current_profile()).organization_id)','auth.uid() is null','organization_id=v_org','pg_advisory_xact_lock'])assert.ok(sql.includes(fragment),`263${n}: ${fragment}`);
 }
});
test('2639: fonte sem Squad não gera receita ou comissão presumida',()=>{
 for(const n of [4,5])assert.ok(read(`supabase/migrations/MIGRACAO_V2.63.${n}.sql`).includes("v_squad not in ('A','B','C','D','E')"));
});
test('2639: Squad C exige perfil Pré-atendimento e demais Squads Técnico',()=>{
 for(const n of [4,5]){
  const s=read(`supabase/migrations/MIGRACAO_V2.63.${n}.sql`);
  assert.match(s,/v_squad='C' and \(v_profile.role<>'pre_attendance'/);
  assert.match(s,/v_squad<>'C' and \(v_profile.role<>'technician'/);
 }
});
test('2639: conferencia nao admite retorno a fonte editavel apos fechamento operacional',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 assert.ok(sql.includes('v_row:=v_op.closed_finance_month_data;'));
 assert.ok(sql.includes('v_row:=v_op.finance_month_data;'));
 assert.ok(!sql.includes('coalesce(v_op.closed_finance_month_data,v_op.finance_month_data)'));
});
test('2639: status oficial exige snapshot e cancelamentos sem exceder clientes',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 assert.ok(sql.includes("v_churn_state:='missing_closed_snapshot'"));
 assert.ok(sql.includes("v_churn_state:='invalid_closed_cancellations'"));
 assert.ok(sql.includes("(v_row->>'canceledCount')::numeric > (v_row->>'customersStart')::numeric"));
});
test('2639: o bloco de cancelamentos não usa zero fictício',()=>{
 assert.equal(helper.churnStatus({status:'missing_closed_snapshot'}),'Snapshot ausente');
 assert.equal(helper.churnStatus({status:'invalid_closed_cancellations'}),'Dados inconsistentes');
 assert.equal(helper.churnRate({status:'provisional',customers_start:100,cancellations:3}),null);
 assert.equal(helper.churnRate({status:'missing_closed_snapshot',customers_start:100,cancellations:3}),null);
 assert.equal(helper.churnRate({status:'official_closed',customers_start:100,cancellations:3}),0.03);
});
test('2639: prévia vazia não afirma que a competência pode fechar',()=>{
 const result=helper.normalize({people:[],cancellations_by_squad:[]});
 assert.equal(result.ready,false);
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 assert.ok(sql.includes('jsonb_array_length(v_rows)=0 and jsonb_array_length(v_churn)=0'));
});
test('2639: aprovação do Squad C compara valor com a comissão calculada',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 assert.ok(sql.includes('coalesce(sum(commission_amount),0)'));
 assert.ok(sql.includes('v_approval.amount is distinct from round(v_approved_total,2)'));
});
test('2639: fechamento impõe a mesma permissão do preflight e bloqueia bypass da RPC original',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 assert.ok(sql.includes("not public.has_strategy_access('close_competence')"));
 assert.ok(sql.includes("not public.has_strategy_access('edit_costs')"));
 assert.ok(sql.includes('revoke all on function public.close_strategy_competence_core_v2638(date) from public,anon,authenticated'));
 assert.ok(sql.includes('if (v_preview->>\'issues\')::int>0'));
});
test('2639: frontend comunica pendências específicas sem expor valor inventado',()=>{
 const script=read('js/app.js');
 assert.ok(script.includes('helper.churnStatus(r)'));
 assert.ok(helper.STATUS.approved_amount_mismatch);
 assert.ok(helper.STATUS.invalid_closed_cancellations);
 assert.ok(script.includes('strategy_bonus_reconciliation_preview_v2638'));
});
test('2639: o pacote e a aplicacao usam a revisao 2.63.9',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'2.63.9');assert.equal(pkg.assetVersion,'2.63.9-r1');
 assert.ok(read('index.html').includes('V2.63.9'));
 assert.ok(read('js/app.js').includes("const APP_VERSION = '2.63.9'"));
});
test('2639: migration sempre transacional e read-only para snapshots anteriores',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.9.sql');
 assert.match(sql,/^-- V2\.63\.9/);
 assert.ok(sql.includes('begin;')&&sql.includes('commit;'));
 assert.ok(!sql.includes('update public.strategy_competence_snapshots'));
 assert.ok(!sql.includes('delete from public.strategy_financial_closure'));
});
test('2639: script de auditoria também executa isoladamente',()=>{
 const proc=spawnSync(process.execPath,[path.join(base,'scripts/audit-phase8.mjs')],{encoding:'utf8'});
 assert.equal(proc.status,0,proc.stderr);assert.match(proc.stdout,/Auditoria Fase 8 OK/);
});
