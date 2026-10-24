const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../js/import-engine.js');
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'js','app.js'),'utf8');
const pkg=require('../package.json');

test('V2.57.7 publica a preparação de CSV dentro da Central de Importação',()=>{
  assert.equal(pkg.version,'2.59.9');
  for(const id of ['csvPreparationBlock','csvMapDate','csvMapTechnician','csvMapService','csvMapProduct','csvMapCompany','csvMapGroup','csvDedupeEnabled','csvDedupeColumns','csvDedupeKeep','applyCsvPreparationBtn']) assert.ok(index.includes(`id="${id}"`),id);
  assert.match(app,/openCsvPreparation\(state\.pendingCsvSource\)/);
  assert.match(app,/applyCsvPreparation/);
  assert.match(app,/Não é mais necessário excluir colunas manualmente/);
});

test('V2.57.7 sugere mapeamento e chave de cliente no relatório bruto',()=>{
  const headers=['DataAvaliacao','nomeApresentativo','CNPJ','NotaServico','NotaProduto','NotaEmpresa','Outro Campo'];
  const q=engine.suggestQualityPreparation(headers,'quality');
  assert.equal(q.mapping.date,0);
  assert.equal(q.mapping.technician,1);
  assert.equal(q.mapping.product,4);
  assert.equal(q.mapping.company,5);
  assert.deepEqual(q.dedupeColumns,[2]);
  assert.equal(q.dedupeEnabled,true);
  const full=engine.suggestQualityPreparation(headers,'quality-full');
  assert.equal(full.mapping.service,3);
});

test('V2.57.7 deduplica cliente somente dentro da mesma competência',()=>{
  const headers=['Data','Tecnico','CNPJ','NotaServico','NotaProduto','NotaEmpresa'];
  const rows=[
    ['01/10/2026','Ana','11.111.111/0001-01','5','4','5'],
    ['15/10/2026','Ana','11.111.111/0001-01','4','3','4'],
    ['02/11/2026','Ana','11.111.111/0001-01','5','5','5']
  ];
  const result=engine.prepareQualitySource({headers,rows,kind:'quality',mapping:{date:0,technician:1,product:4,company:5},dedupeEnabled:true,dedupeColumns:[2],keep:'first'});
  assert.equal(result.stats.sourceRows,3);
  assert.equal(result.stats.resultRows,2);
  assert.equal(result.stats.duplicatesRemoved,1);
  const parsed=engine.parseCsvRows(result.csvText);
  assert.equal(parsed.length,3);
  assert.equal(parsed[1][0],'01/10/2026');
  assert.equal(parsed[2][0],'02/11/2026');
});

test('V2.57.7 permite manter a última ocorrência quando solicitado',()=>{
  const headers=['Data','Tecnico','Cliente','NotaProduto','NotaEmpresa'];
  const rows=[['01/10/2026','Ana','Cliente X','2','3'],['20/10/2026','Ana','Cliente X','5','5']];
  const result=engine.prepareQualitySource({headers,rows,kind:'quality',mapping:{date:0,technician:1,product:3,company:4},dedupeEnabled:true,dedupeColumns:[2],keep:'last'});
  const parsed=engine.parseCsvRows(result.csvText);
  assert.equal(parsed.length,2);
  assert.equal(parsed[1][0],'20/10/2026');
  assert.equal(parsed[1][2],'5');
});

test('V2.57.7 Qualidade Completa preserva todas as linhas quando deduplicação está desligada',()=>{
  const headers=['Data','Tecnico','Cliente','NotaServico','NotaProduto','NotaEmpresa'];
  const rows=[['01/10/2026','Ana','Cliente X','5','4','5'],['02/10/2026','Ana','Cliente X','4','5','5']];
  const result=engine.prepareQualitySource({headers,rows,kind:'quality-full',mapping:{date:0,technician:1,service:3,product:4,company:5,group:null},dedupeEnabled:false,dedupeColumns:[],keep:'first'});
  assert.equal(result.stats.resultRows,2);
  assert.equal(result.stats.duplicatesRemoved,0);
  assert.match(result.csvText,/NotaServico/);
});
