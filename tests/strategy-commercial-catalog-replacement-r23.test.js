import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('R23 deixa catalogo fora das etapas de importacao e preserva ids',()=>{
 const html=read('index.html');
 assert.ok(html.indexOf('id="strategyCsvCatalogDetails"')<html.indexOf('id="strategyCsvImporter"'));
 assert.match(html,/data-strategy-independent="catalog"/);
 assert.ok(html.includes('id="strategyCatalogSearch"'));
 assert.ok(html.includes('id="strategyImportReplaceCommissions" checked'));
 assert.equal((html.match(/id="strategyCommercialCatalog"/g)||[]).length,1);
});
test('R23 vincula recálculo de comissões ao lote concluido e exige prévia e consentimento',()=>{
 const js=read('js/app.js');
 assert.match(js,/replace_strategy_batch_commissions_r23/);
 assert.match(js,/p_batch_id:batchId,p_apply:false/);
 assert.match(js,/p_batch_id:batchId,p_apply:true/);
 assert.match(js,/window\.confirm\(message\)/);
 assert.match(js,/if\(\$\('#strategyImportReplaceCommissions'\)\?\.checked\)/);
});
test('R23 usa auditoria por lote, isola tenant e bloqueia competencias e bonus sincronizados',()=>{
 const sql=read('supabase/migrations/MIGRACAO_V2.63.17_REIMPORTACAO_COMISSOES_R23.sql');
 for(const term of ['strategy_commission_replacements_r23','unique(organization_id,batch_id,source_key,sale_id)',"a.outcome='duplicate'",'has_strategy_access(\'people_costs\')','has_strategy_access(\'edit_costs\')',"c.status='closed'",'sm.is_closed=true','technician_finance_monthly','super_admin_commissions','for update','p_apply','rule_revision=v_row_revision'])assert.ok(sql.includes(term),term);
 assert.match(sql,/revoke all on function public\.replace_strategy_batch_commissions_r23/);
});
