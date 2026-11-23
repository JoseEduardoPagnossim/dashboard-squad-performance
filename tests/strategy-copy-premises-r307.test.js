'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const html=read('index.html'),app=read('js/app.js');
const sql=read('supabase/migrations/MIGRACAO_V2.63.24_COPIA_PREMISSAS_R307.sql');

test('R30.7 expõe prévia e confirmação sem gravar antecipadamente',()=>{
 for(const id of ['strategyCopyCostsPreviewBtn','strategyCopyCostsPreview','strategyCopyPeopleRows','strategyCopyOperationalRows','strategyCopyFte','strategyCopyCostsConfirmBtn','strategyCopyCostsCancelBtn']){
  assert.ok(html.includes(`id="${id}"`),id);
 }
 assert.ok(app.includes("rpc('strategy_preview_previous_costs_r307'"));
 assert.ok(app.includes("rpc('strategy_copy_previous_costs_r307'"));
 assert.ok(app.includes('strategyCopyCostsReset()'));
 assert.ok(app.includes('strategyCopyCostsMonth()!==st.preview.month'));
 assert.ok(app.includes("'strategyCopyCostsPreviewBtn','strategyCopyCostsConfirmBtn'"));
});

test('R30.7 separa custos recorrentes e eventuais e preserva valores pessoais variáveis',()=>{
 assert.match(html,/id="strategyNewOperationalRecurring"/);
 assert.match(app,/data-strategy-op-field="recurring"/);
 assert.match(app,/o\.eligible&&o\.recurring/);
 for(const literal of ['salary','employer_charges','benefits','variable_pay','overtime','other_costs']) assert.ok(sql.includes(literal));
 assert.match(sql,/v_cost\.salary,v_cost\.employer_charges,v_cost\.benefits,0,0,0/);
 assert.match(sql,/on conflict\(organization_id,competence_id,person_id\) do nothing/);
 assert.match(sql,/v_op\.allocation_method='manual'/);
});

test('R30.7 trava o destino fechado, valida organização e registra auditoria',()=>{
 assert.match(sql,/public\.has_strategy_access\('edit_costs'\)/);
 assert.match(sql,/public\.has_strategy_access\('people_costs'\)/);
 assert.match(sql,/v_status='closed'/);
 assert.match(sql,/where organization_id=v_org and competence=p_competence for update/);
 assert.match(sql,/source_reference like 'r307:%'/);
 assert.match(sql,/strategy_cost_copy_audit_r307/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/grant execute on function public\.strategy_copy_previous_costs_r307/);
 assert.doesNotMatch(sql,/update public\.strategy_employee_costs/i);
});
