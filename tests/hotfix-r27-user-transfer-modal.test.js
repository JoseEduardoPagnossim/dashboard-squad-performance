const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const edge=fs.readFileSync(path.join(root,'supabase/functions/manage-user/index.ts'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
const sql=fs.readFileSync(path.join(root,'supabase/migrations/MIGRACAO_V2.63.18_MOVIMENTACAO_PRE_ATENDIMENTO_R27.sql'),'utf8');
test('R27: pre-atendimento para tecnico exige transicao server-side atomica',()=>{
 assert.match(app,/const converting=u\.role==='pre_attendance'&&role==='technician'/);
 assert.match(edge,/admin\.rpc\('convert_pre_attendance_to_support_r27'/);
 assert.match(sql,/UPDATE public\.profiles SET role='technician'/);
 assert.match(sql,/UPDATE public\.strategy_people\s+SET user_id=NULL, role_label=/);
 assert.match(sql,/INSERT INTO public\.profile_squad_history/);
});
test('R27: competencia fechada e escopo protegidos',()=>{
 assert.match(sql,/status='closed'/);
 assert.match(sql,/is_closed=true/);
 assert.match(sql,/organization_id=v_org/);
 assert.match(sql,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION.*convert_pre_attendance_to_support_r27/s);
});
test('R27: modais de criar e editar preservam botoes acessiveis sob zoom',()=>{
 assert.match(css,/#userModal,#editUserModal\{overflow-y:auto/);
 assert.match(css,/max-height:calc\(100dvh - 24px\)/);
 assert.match(css,/\.user-form \.modal-actions\{position:sticky;bottom:0/);
});
