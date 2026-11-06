'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('js/app.js');
const recurrenceSql=read('supabase/migrations/MIGRACAO_V2.63.4.sql');
const merchandiseSql=read('supabase/migrations/MIGRACAO_V2.63.5.sql');
const activeSql=read('supabase/migrations/MIGRACAO_V2.63.9_R5.sql');
const leaderSql=read('supabase/migrations/MIGRACAO_V2.63.10_FASE1_LIDERES.sql');
const inTable=(sql,name)=>sql.match(new RegExp('create table if not exists public\\.'+name+' \\(([\\s\\S]*?)\\n\\);','i'))?.[1]||'';
const fields=sql=>new Set([...sql.matchAll(/(?:^|,)\s*([a-z][a-z0-9_]*)\s+(?:uuid|text|integer|numeric|date|timestamptz|jsonb|boolean)/gm)].map(x=>x[1]));
test('Fase 10: campos do detalhe MRR existem no schema ou migration R5',()=>{
 const section=app.slice(app.indexOf('async function openStrategyCommercialHistoryBatch('),app.indexOf('function exportStrategyCommercialHistory(',app.indexOf('async function openStrategyCommercialHistoryBatch(')));
 const projections=[...section.matchAll(/'((?:id,occurred_on)[^']+)'/g)].map(x=>x[1]);
 assert.equal(projections.length,2);
 const source=fields(inTable(recurrenceSql,'strategy_recurring_sales'));
 source.add('active_monthly_amount');assert.match(activeSql,/add column if not exists active_monthly_amount/);
 for(const col of projections[0].split(','))assert.ok(source.has(col),`MRR: ${col}`);
 const merchandise=fields(inTable(merchandiseSql,'strategy_merchandise_sales'));
 for(const col of projections[1].split(','))assert.ok(merchandise.has(col),`mercadorias: ${col}`);
 assert.ok(!projections[1].includes('customer_name'));
 assert.ok(!projections[1].includes('monthly_amount'));
});
test('Fase 10: historico aplica organizacao, isolamento de fontes e somente leitura',()=>{
 const section=app.slice(app.indexOf('// Fase 9: visualizacao somente leitura'),app.indexOf('function strategyAuditEstimate(',app.indexOf('// Fase 9: visualizacao somente leitura')));
 assert.match(section,/\.eq\('organization_id',org\)/);
 assert.match(section,/batch\.source_key===\'contracted_modules_csv\'/);
 assert.doesNotMatch(section,/\.(insert|update|upsert|delete|rpc)\(/);
 assert.match(section,/strategyCommercialHistory\.truncated\)return toast/);
});
test('Fase 10: quatro lideres seguem em Squads financeiros sem alterar base operacional',()=>{
 assert.match(leaderSql,/check \(squad_code is null or squad_code in \('A','B','D','E'\)\)/);
 assert.match(app,/function financeReportRows\(m\)\{return \[\.\.\.individualMetricTechnicians\(m\)\.map/);
 assert.match(app,/Conta na Base do Squad/);
});
test('Fase 10: CSV exportado evita formula injection e filtro de origem re-renderiza',()=>{
 assert.match(app,/\[=\+@-\]/);
 assert.match(app,/if\(e\.target\.id===\'strategyCommercialHistorySource\'\)\{renderStrategyCommercialHistory\(\)/);
});
