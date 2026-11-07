import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const app=readFileSync(new URL('js/app.js',root),'utf8');
const index=readFileSync(new URL('index.html',root),'utf8');
const sql=readFileSync(new URL('supabase/migrations/MIGRACAO_V2.63.16_GESTAO_LIDERES_R21.sql',root),'utf8');
test('R21 cria seletor de lideres na bonificacao existente',()=>{
 assert.match(index,/finance-super-card[\s\S]*financeLeaderLinks[\s\S]*<\/article>/);
 assert.match(app,/function renderLeaderFinancialLinks/);
 assert.match(app,/function saveLeaderFinancialLink/);
});
test('R21 usa RPC autorizada e nao sobrescreve campos financeiros',()=>{
 assert.match(app,/rpc\('strategy_set_leader_financial_squad_r21'/);
 assert.match(sql,/security definer/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/role='super_admin' and p\.active=true/);
 assert.match(sql,/update public\.super_admin_commissions set squad_code=p_squad_code/);
 assert.doesNotMatch(sql,/update public\.super_admin_commissions set amount=/);
 assert.match(sql,/strategy_people/);
});
test('R21 carrega somente admins ativos e usa competencia independente do squad aberto',()=>{
 assert.match(app,/\.eq\('active',true\)\.eq\('organization_id',state\.user\.organizationId\)/);
 assert.match(app,/financeLeaderPeriod/);
 assert.match(index,/2\.63\.9-r21/);
});
