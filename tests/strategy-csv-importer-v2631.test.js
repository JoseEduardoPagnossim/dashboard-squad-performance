'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const dir=path.resolve(__dirname,'..');const engine=require('../js/strategy-csv-importer');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const recurring='\uFEFF"Data Lançam.","Cliente","UsuarioVenda","grupoAtendimento","Produto","Vl Anterior","Vl Atual Ativo"\r\n28/10/2026,Cliente Alfa,José Paulo,C,"Módulo, Extra",250.00,80.00\r\n28/10/2026,Cliente Beta,José Paulo,,Módulo Teste,100.00,30.00\r\n27/10/2026,Cliente Gama,José Paulo,C,"MÓDULO,  EXTRA",250.00,80.00\r\n';
const merch='"id","Data","Vendedor","grupo","Produto","quantidade","vlTotalItem"\n12588,2026-10-27 21:00:00.000,Michelle Pereira,E,Certificado Digital A1,1,150.00\n12588,2026-10-27 21:00:00.000,Michelle Pereira,E,Treinamento,2,200.00\n';
test('suporta exatamente duas fontes CSV e não permite manual como CSV',()=>{assert.deepEqual(Object.keys(engine.DEFINITIONS),['contracted_modules_csv','merchandise_sales_csv']);assert.equal(engine.definition('manual'),null);});
test('CSV UTF8 com BOM, CRLF, aspas e virgulas no produto',()=>{const x=engine.parse(recurring);assert.equal(x.delimiter,',');assert.equal(x.rowCount,3);assert.equal(x.rows[0][4],'Módulo, Extra');assert.equal(x.headers[0],'Data Lançam.');});
test('CSV separados por ponto e virgula, tabs e pipe',()=>{for(const d of [';','\t','|']){const csv=`A${d}B${d}C\n1${d}2${d}3\n`;assert.equal(engine.parse(csv).delimiter,d);}});
test('CSV permite quebras de linha e aspas duplas escapadas no nome',()=>{const x=engine.parse('a,b\n"um\ndois","Disse ""oi"""\n');assert.equal(x.rows[0][0],'um\ndois');assert.equal(x.rows[0][1],'Disse "oi"');});
test('CSV preserva linhas de venda repetidas sem deduplicar por ID',()=>{const x=engine.parse(merch);const m=engine.suggest('merchandise_sales_csv',x.headers);assert.equal(x.rowCount,2);assert.equal(engine.preview('merchandise_sales_csv',x,m).length,2);assert.equal(m.saleId,'id');});
test('colunas recorrentes sao identificadas automaticamente com MRR correto e sem valor anterior',()=>{const x=engine.parse(recurring);const m=engine.suggest('contracted_modules_csv',x.headers);assert.equal(m.amount,'Vl Anterior');assert.equal(m.seller,'UsuarioVenda');assert.equal(m.squad,'grupoAtendimento');assert.equal(m.activeMonthly,'Vl Atual Ativo');});
test('colunas avulsas usam valor total da linha, sem multiplicar por quantidade',()=>{const x=engine.parse(merch);const m=engine.suggest('merchandise_sales_csv',x.headers);assert.equal(m.amount,'vlTotalItem');assert.equal(m.quantity,undefined);assert.equal(engine.preview('merchandise_sales_csv',x,m)[1].amount,'200.00');});
test('normalizacao de nome e acento agrupa produto duplicado na mesma origem',()=>{const x=engine.parse(recurring);const m=engine.suggest('contracted_modules_csv',x.headers);const res=engine.identifyProducts('contracted_modules_csv',x,m);assert.equal(res.totalUnique,1);assert.equal(res.products[0].count,2);});
test('linhas sem grupo sao excluidas da identificacao de produtos',()=>{const x=engine.parse(recurring);const m=engine.suggest('contracted_modules_csv',x.headers);const res=engine.identifyProducts('contracted_modules_csv',x,m);assert.equal(res.ignoredNoGroup,1);assert.equal(res.products[0].count,2);});
test('grupo valido inclui Pré-atendimento C e não inclui grupos inventados',()=>{assert.equal(engine.normalizeSquad(' c '),'C');assert.equal(engine.normalizeSquad('A'),'A');assert.equal(engine.normalizeSquad(''),null);assert.equal(engine.normalizeSquad('Suporte'),null);});
test('datas ISO com horario são exibidas apenas como data civil sem UTC',()=>{const x=engine.parse(merch);const m=engine.suggest('merchandise_sales_csv',x.headers);assert.equal(engine.preview('merchandise_sales_csv',x,m)[0].date,'27/10/2026');assert.equal(engine.dateOnly('28/10/2026'),'28/10/2026');});
test('campos opcionais podem ser omitidos e obrigatorios nao',()=>{const x=engine.parse(recurring),m=engine.suggest('contracted_modules_csv',x.headers);delete m.customer;assert.equal(engine.validateMapping('contracted_modules_csv',x.headers,m).amount,'Vl Anterior');delete m.date;assert.throws(()=>engine.validateMapping('contracted_modules_csv',x.headers,m),/obrigatório/);});
test('coluna não pode ser atribuida duas vezes',()=>{const x=engine.parse(recurring),m=engine.suggest('contracted_modules_csv',x.headers);m.seller=m.product;assert.throws(()=>engine.validateMapping('contracted_modules_csv',x.headers,m),/duplicada/);});
test('coluna desconhecida nao pode ser importada',()=>{const x=engine.parse(recurring),m=engine.suggest('contracted_modules_csv',x.headers);m.seller='Vendedor não existente';assert.throws(()=>engine.validateMapping('contracted_modules_csv',x.headers,m),/indisponível/);});
test('bloqueia CSV malformado e excedente sem gerar lançamentos',()=>{assert.throws(()=>engine.parse('a,b\n"sem fechar,b\n'),/aspas/);assert.throws(()=>engine.parse('a,b\n1,2,3'),/colunas/);assert.throws(()=>engine.parse('a,b\n1,2\n3,4',{maxRows:1}),/limite/);});
test('bloqueia cabecalhos duplicados apos normalizacao',()=>{assert.throws(()=>engine.parse('Produto,prodúto\nA,B'),/duplicados/);});
test('template exige organizacao, usuario e nome de no máximo 80 caracteres',()=>{const x=engine.parse(recurring),m=engine.suggest('contracted_modules_csv',x.headers);assert.throws(()=>engine.createTemplatePayload({sourceKey:'contracted_modules_csv',name:'Modelo',headers:x.headers,mapping:m}),/obrigatórios/);assert.throws(()=>engine.createTemplatePayload({organizationId:'o',userId:'u',sourceKey:'contracted_modules_csv',name:' '.repeat(81),headers:x.headers,mapping:m}),/nome/);});
test('template salvo contém apenas nomes de colunas e nunca as linhas do CSV',()=>{const x=engine.parse(recurring),m=engine.suggest('contracted_modules_csv',x.headers);const payload=engine.createTemplatePayload({organizationId:'o',userId:'u',sourceKey:'contracted_modules_csv',name:'Padrão',headers:x.headers,mapping:m});assert.equal(payload.source_key,'contracted_modules_csv');assert.equal(payload.columns.amount,'Vl Anterior');assert.equal(JSON.stringify(payload).includes('Cliente Alfa'),false);assert.equal(Object.isFrozen(payload),true);});
test('mapeamento salvo é validado novamente quando as colunas mudam',()=>{const x=engine.parse(recurring),m=engine.suggest('contracted_modules_csv',x.headers);assert.throws(()=>engine.validateMapping('contracted_modules_csv',['Produto'],m),/indisponível/);});
test('SQL cria apenas modelos comerciais com isolamento por organização e escrita restrita',()=>{const sql=read('supabase/migrations/MIGRACAO_V2.63.1.sql');for(const v of ['strategy_import_mappings','enable row level security','strategy_import_mappings_read_v2631','strategy_import_mappings_insert_v2631','strategy_import_mappings_update_v2631','has_strategy_access(\'people_costs\')','has_strategy_access(\'edit_costs\')','created_by=(select auth.uid())'])assert.ok(sql.includes(v),v);assert.doesNotMatch(sql,/grant\s+(?:all|delete).*?strategy_import_mappings\s+to\s+authenticated/i);});
test('UI de importacao somente le dados, gera previa, identifica produto, salva mapeamento',()=>{const html=read('index.html'),js=read('js/app.js');for(const id of ['strategyCsvFile','strategyCsvSource','strategyCsvFields','strategyCsvPreview','strategyCsvProducts','strategyCsvTemplate','strategyCsvSave','strategyCsvApplyTemplate'])assert.ok(html.includes(`id="${id}"`),id);assert.match(js,/createTemplatePayload/);assert.match(js,/engine\.parse\(text\)/);assert.match(js,/identifyProducts\(/);assert.match(js,/renderStrategyCsvImporter/);assert.doesNotMatch(js.slice(js.indexOf('function renderStrategyCsvImporter()'),js.indexOf('async function initStrategyAutomationSources')),/strategy_result_events|strategy_employee_costs|\.from\('strategy_import_batches'\)/);});
test('todos scripts JS/CSS usam o cache-buster 2.63.9-r9',()=>{const html=read('index.html'),pkg=JSON.parse(read('package.json'));assert.equal(pkg.assetVersion,'2.63.9-r9');assert.match(html,/strategy-csv-importer\.js\?v=2\.63\.9-r9/);for(const [,ref,v] of html.matchAll(/(?:src|href)="([^"?]+)\?v=([^" ]+)"/g))if(!ref.includes("audit-utils"))assert.equal(v,"2.63.9-r9");});

test('V2.63.11: opcionais iniciam desligadas mesmo quando coluna existe',()=>{
 for(const [key,raw] of [['contracted_modules_csv',recurring],['merchandise_sales_csv',merch]]){
  const parsed=engine.parse(raw),mapping=engine.suggest(key,parsed.headers);
  const def=engine.definition(key);
  assert.ok(def.fields.filter(f=>!f.required).every(f=>!(f.key in mapping)));
  assert.ok(def.fields.filter(f=>f.required).every(f=>mapping[f.key]));
  assert.doesNotThrow(()=>engine.validateMapping(key,parsed.headers,mapping));
 }
});
test('V2.63.11: opcional pode ser ativada e template preserva decisao explicita',()=>{
 const parsed=engine.parse(recurring),mapping=engine.suggest('contracted_modules_csv',parsed.headers);
 mapping.customer='Cliente';
 const template=engine.createTemplatePayload({organizationId:'o',userId:'u',sourceKey:'contracted_modules_csv',name:'Com cliente',headers:parsed.headers,mapping});
 assert.equal(template.columns.customer,'Cliente');
 assert.equal(engine.preview('contracted_modules_csv',parsed,template.columns)[0].customer,'Cliente Alfa');
});
test('V2.63.11: interface separa campos obrigatorios e opcionais',()=>{
 const html=read('index.html'),app=read('js/app.js');
 for(const id of ['strategyCsvOptionalFields','strategyCsvOptionalDetails','strategyCsvTemplatesDetails','strategyCsvCatalogDetails','strategyCsvPreviewDetails'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(app,/def\.fields\.filter\(f=>f\.required\)/);
 assert.match(app,/def\.fields\.filter\(f=>!f\.required\)/);
});

test('Fase 3: auditoria local identifica pendencias e preserva vendas repetidas',()=>{
 const csv='id,Data,Vendedor,grupo,Produto,vlTotalItem\n1,2026-11-04,Ana,A,Produto X,100\n1,2026-11-04,Ana,A,Produto X,100\n2,2026-11-05,,C,Produto Y,200\n3,2026-11-05,Beto,Z,,50\n';
 const parsed=engine.parse(csv),mapping=engine.suggest('merchandise_sales_csv',parsed.headers);
 const audit=engine.auditPreview('merchandise_sales_csv',parsed,mapping);
 assert.equal(audit.summary.total,4);assert.equal(audit.summary.validSquad,3);
 assert.equal(audit.summary.missingSquad,1);assert.equal(audit.summary.missingSeller,1);
 assert.equal(audit.summary.missingProduct,1);assert.equal(audit.summary.needsReview,2);
 assert.equal(audit.summary.possibleRepeats,1);
 assert.equal(audit.bySquad.find(x=>x.squad==='A').rows,2);
 assert.equal(parsed.rowCount,4); // Nenhuma venda foi removida.
});
test('Fase 3: auditoria de campos opcionais nao altera mapeamento e UI oferece filtro',()=>{
 const parsed=engine.parse(recurring),mapping=engine.suggest('contracted_modules_csv',parsed.headers);
 const before=JSON.stringify(mapping);const audit=engine.auditPreview('contracted_modules_csv',parsed,mapping);
 assert.equal(JSON.stringify(mapping),before);assert.equal(audit.summary.missingSquad,1);
 const html=read('index.html'),app=read('js/app.js');
 for(const id of ['strategyCsvAuditSummary','strategyCsvAuditSquads','strategySellerOnlyPending'])assert.ok(html.includes(`id="${id}"`));
 assert.match(app,/engine\.auditPreview\(/);assert.match(app,/renderStrategySellerReconciliation\(\)/);
});
