'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const csv=require('../js/strategy-csv-importer');
const sql=fs.readFileSync('supabase/migrations/MIGRACAO_V2.63.12_ESTORNO_COMPETENCIA.sql','utf8');
const app=fs.readFileSync('js/app.js','utf8'),html=fs.readFileSync('index.html','utf8');
test('filtro mensal seleciona apenas competencia, sem modificar CSV, e preserva repeticoes',()=>{
 const source='contracted_modules_csv', parsed=csv.parse('Data Lançam.,UsuarioVenda,grupoAtendimento,Produto,Vl Anterior,Vl Atual Ativo\n28/10/2026,Heitor,A,Plano,50,20\n28/10/2026,Heitor,A,Plano,50,20\n01/09/2026,Heitor,A,Plano,50,20\ninvalid,Heitor,A,Plano,50,20');
 const before=parsed.rows.length, mapping=csv.suggest(source,parsed.headers);
 const result=csv.filterCompetence(source,parsed,mapping,'2026-10');
 assert.equal(result.selected,2);assert.equal(result.excluded,2);assert.equal(result.invalidDates,1);
 assert.equal(parsed.rows.length,before);assert.notEqual(result.parsed.rows,parsed.rows);
 assert.equal(csv.filterCompetence(source,parsed,mapping,null).selected,4);
 assert.throws(()=>csv.filterCompetence(source,parsed,mapping,'2026-13'),/competência válida/);
});
test('filtro mensal de mercadorias respeita data e nao multiplica valores',()=>{
 const source='merchandise_sales_csv',p=csv.parse('id,Data,Vendedor,grupo,Produto,vlTotalItem\n1,01/10/2026,Heitor,A,Item,100\n2,31/10/2026,Heitor,A,Item,200\n3,01/11/2026,Heitor,A,Item,300');
 const r=csv.filterCompetence(source,p,csv.suggest(source,p.headers),'2026-10');
 assert.equal(r.selected,2);assert.equal(r.excluded,1);
});
test('R16 preserva travas estrategicas e evita bloquear mes operacional fechado antes da importacao',()=>{
 for(const text of ['strategy_competence_snapshots','strategy_financial_closure_v2638','tf.updated_at>=v_batch.created_at','sm.closed_at>=v_batch.created_at','v_batch.status','v_count=0']) assert.ok(sql.includes(text),text);
 assert.match(sql,/create or replace function public\.preview_strategy_commercial_batch_reversal_v26311/);
 assert.doesNotMatch(sql,/update public\.squad_months|delete from public\.squad_months/i);
});
test('interface exibe periodo e aplica filtro aos dois motores de importacao',()=>{
 for(const id of ['strategyCsvPeriodMode','strategyCsvMonth','strategyCsvScopeNotice']) assert.ok(html.includes(`id="${id}"`));
 assert.match(app,/strategyCsvScoped\(\)\.parsed/g);
 assert.match(app,/if\(strategyCsvPeriodMode==='month'&&!strategyCsvPeriodMonth\)/);
});
