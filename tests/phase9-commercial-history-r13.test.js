const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('js/app.js'),html=read('index.html');
test('Fase 9 cria histórico dentro da própria importação, sem nova rota ou modal',()=>{
 for(const id of ['strategyCommercialHistorySection','strategyCommercialHistoryRefresh','strategyCommercialHistoryRows','strategyCommercialHistoryDetails','strategyCommercialHistoryExport','strategyCommercialHistoryExportSales'])assert.ok(html.includes(`id="${id}"`),id);
 assert.ok(html.indexOf('strategyCommercialHistorySection')>html.indexOf('strategyMerchandiseImportSection'));
 assert.ok(html.indexOf('strategyCommercialHistorySection')<html.indexOf('strategyCommissionsSection'));
});
test('Fase 9 consulta lotes e tentativas de ambas fontes sob escopo da organização',()=>{
 for(const name of ['strategy_import_sources','strategy_import_batches','strategy_recurring_import_attempts','strategy_merchandise_import_attempts','strategy_recurring_sales','strategy_merchandise_sales'])assert.ok(app.includes(name),name);
 assert.match(app,/\.eq\('organization_id',org\)/);
 assert.match(app,/\.eq\('batch_id',r\.id\)/);
 assert.match(app,/\.eq\('batch_id',id\)/);
 assert.match(app,/strategyEditAccess\(\).*strategyPeopleAccess\(\)/);
});
test('Fase 9 não grava ou recalcula comissões e usa campos corretos de cada fonte',()=>{
 const first=app.indexOf('// Fase 9: visualizacao somente leitura');
 const last=app.indexOf('function strategyAuditEstimate(',first);
 const part=app.slice(first,last);
 assert.ok(first>=0&&last>first);
 assert.doesNotMatch(part,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/);
 assert.match(part,/batch\.source_key==='contracted_modules_csv'\?/);
 assert.match(part,/active_monthly_amount/);
 assert.match(part,/gross_amount/);
 assert.match(part,/strategyAuditEstimate/);
 assert.match(part,/strategyAuditDownload/);
 assert.match(part,/strategyCommercialHistory\.truncated\)return toast/);
});
test('Fase 9 protege markup vindo do banco e conserva a confirmação financeira',()=>{
 for(const term of ['escapeHtml(r.file_name','escapeHtml(x.customer_name','escapeHtml(x.seller_name','escapeHtml(x.productName)'])assert.ok(app.includes(term),term);
 assert.match(app,/start_strategy_recurring_batch_v2634/);
 assert.match(app,/start_strategy_merchandise_batch_v2635/);
 assert.match(app,/window\.confirm\(`Confirma a importação/);
});
