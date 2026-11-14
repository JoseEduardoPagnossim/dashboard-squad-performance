const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const engine = require('../js/import-engine.js');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const start = app.indexOf('  function financialImpactAggregateFromQualityImport(');
const end = app.indexOf('  async function syncFinancialImpactFromQualityImport(', start);
assert.ok(start >= 0 && end > start, 'agregador R28 presente');
const aggregate = vm.runInNewContext(
  `${app.slice(start, end)}; financialImpactAggregateFromQualityImport`,
  {importEngine: engine, csvRating: v => {const n = Number(v);return Number.isInteger(n)&&n>=1&&n<=5?n:0;}}
);

const headers = ['DataAvaliacao', 'nomeApresentativo', 'Cliente', 'NotaServico', 'NotaProduto', 'NotaEmpresa'];
const mapping = {date: 0, technician: 1, service: 3, product: 4, company: 5};
const original = [
  ['14/11/2026', 'Tecnico Um', 'Cliente X', '5', '4', '4'],
  ['14/11/2026', 'Tecnico Um', 'Cliente X', '1', '2', '3'],
  ['14/11/2026', 'Tecnico Dois', 'Cliente Y', '2', '3', '5'],
  ['14/11/2026', 'Vendedor Externo', 'Cliente Z', '1', '1', '1']
];
function fixture(){
  const prep = engine.prepareQualitySource({headers, rows:original, mapping, dedupeEnabled:true, dedupeColumns:[2]});
  const source = {rawHeaders: headers, rawRows: original, retainedSourceIndexes: prep.retainedSourceIndexes,
    preparation: {dedupeEnabled:true, dedupeColumns:[2], mapping}};
  const pending = {rows:[{id:'2026-11',preparedIndex:0,productNote:4,companyNote:4,group:'D'},
    {id:'2026-11',preparedIndex:1,productNote:3,companyNote:5,group:'A'}]};
  return {prep,source,pending};
}
test('R28 mantém o alinhamento dos índices originais após a deduplicação', ()=>{
  const {prep} = fixture();
  assert.deepEqual(prep.retainedSourceIndexes, [0,2,3]);
});
test('R28 conta clientes únicos vinculados aos Squads, incluindo Serviço, Produto e Empresa', ()=>{
  const {source,pending} = fixture();
  const result=aggregate(pending,'2026-11',source);
  assert.equal(result.status, 'ready');
  assert.equal(result.result.evaluated_clients, 2);
  assert.equal(result.result.risk_any_clients, 1);
  assert.equal(result.result.service_n5, 1);
  assert.equal(result.result.service_n2, 1);
  assert.equal(result.result.product_n4, 1);
  assert.equal(result.result.product_n3, 1);
  assert.equal(result.result.company_n5, 1);
  assert.equal(result.result.service_n1, 0, 'cliente de fora do escopo nao entra no agregado');
  assert.ok(!JSON.stringify(result).includes('Cliente X'), 'identificadores nao vao ao agregado');
});
test('R28 não publica contagem fictícia sem identidade ou Nota Serviço', ()=>{
  const {source,pending} = fixture();
  source.preparation.dedupeEnabled=false;
  assert.equal(aggregate(pending,'2026-11',source).status,'skipped');
  source.preparation.dedupeEnabled=true;
  source.preparation.mapping.service=null;
  assert.equal(aggregate(pending,'2026-11',source).status,'skipped');
  source.preparation.mapping.service=3;
  source.rawRows[0][2]='';
  assert.equal(aggregate(pending,'2026-11',source).status,'skipped');
});
test('R28 integra após gravação da qualidade e preserva importação original', ()=>{
  assert.match(app, /financialSync=await syncFinancialImpactFromQualityImport\(pending,id,state\.pendingCsvSource\)/);
  assert.match(app, /recordCompletedImport\(pending,id,snapshot/);
  assert.match(app, /quality\.financial_sync_from_quality/);
  assert.match(app, /onConflict:'organization_id,year,month'/);
});
