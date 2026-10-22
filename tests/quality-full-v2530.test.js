const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const styles=readFileSync(join(root,'css','styles.css'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.53.0.sql');
const migration=readFileSync(migrationPath,'utf8');
const schema=readFileSync(join(root,'supabase','schema.sql'),'utf8');

 test('V2.53.0 publica a importacao exclusiva e os dois pontos de visualizacao',()=>{
  assert.equal(pkg.version,'2.58.0');
  assert.ok(index.includes('id="adminQualityFullImportBtn"'));
  assert.ok(index.includes('Importar Qualidade Completa'));
  assert.ok(index.includes('id="portfolioQualityFullChart"'));
  assert.ok(index.includes('id="teamQualityFullChart"'));
  assert.ok(index.includes('Qualidade Atendimento × Produto × Empresa'));
  assert.ok(styles.includes('.quality-full-trend-card'));
});

test('V2.53.0 usa fonte separada sem alterar a importacao Produto Empresa existente',()=>{
  assert.match(app,/quality_full_daily/);
  assert.match(app,/parseQualityFullCsv/);
  assert.match(app,/replaceQualityFullMonth/);
  assert.match(app,/expectedCsvKind==='quality-full'/);
  assert.match(app,/deduplicated:false/);
  assert.match(app,/Fonte: Qualidade Completa/);
  assert.match(app,/focusNumeric:true/);
  assert.ok(index.includes('<b>Produto/Empresa e Qualidade Completa:</b>'));
  assert.ok(index.includes('◆ Importar Qualidade Completa'));
});

test('V2.53.0 exige migration e armazena somente agregados diarios',()=>{
  assert.equal(existsSync(migrationPath),true);
  assert.match(migration,/create table if not exists public\.quality_full_daily/i);
  assert.match(migration,/service_n5 integer/i);
  assert.match(migration,/product_n5 integer/i);
  assert.match(migration,/company_n5 integer/i);
  assert.match(migration,/source_rows integer/i);
  assert.match(migration,/check \(kind in \('service','quality','quality-full'\)\)/i);
  assert.match(migration,/can_read_squad\(squad_id\)/i);
  assert.match(migration,/can_admin_squad\(squad_id\)/i);
  assert.doesNotMatch(migration,/\b(customer_name|client_name|customer_id|client_id|cnpj|cpf)\s+(text|uuid|varchar)/i);
  assert.match(schema,/create table if not exists public\.quality_full_daily/i);
});

test('V2.53.0 atualiza cache de assets e scripts',()=>{
  assert.ok(index.includes('css/styles.css?v=2.58.0'));
  assert.ok(index.includes('js/import-engine.js?v=2.58.0'));
  assert.ok(index.includes('js/app.js?v=2.58.0'));
  assert.ok(index.includes('V2.58.0'));
});
