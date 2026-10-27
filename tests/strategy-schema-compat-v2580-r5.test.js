const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const migration=readFileSync(join(root,'supabase','migrations','MIGRACAO_V2.58.0_R5.sql'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const index=readFileSync(join(root,'index.html'),'utf8');

test('R5 detects and upgrades the legacy V2.57.3 allocation shape without dropping tables',()=>{
  assert.match(migration,/column_name = 'allocated_amount'/);
  assert.match(migration,/add column if not exists allocation_method_snapshot text/);
  assert.match(migration,/add column if not exists allocated_amount numeric\(14,2\)/);
  assert.match(migration,/using \(percentage \/ 100\.0\)::numeric\(10,8\)/);
  assert.match(migration,/set allocated_amount = round\(\(soc\.amount \* sca\.percentage\)::numeric,2\)/);
  assert.doesNotMatch(migration,/drop table/i);
});

test('R5 normalizes legacy operational values used by the old schema',()=>{
  assert.match(migration,/when 'technology' then 'Tecnologia'/);
  assert.match(migration,/when 'communication' then U&'Comunica\\00E7\\00E3o'/);
  assert.match(migration,/set allocation_method = 'fte'/);
  assert.match(migration,/where allocation_method = 'headcount'/);
  assert.match(migration,/allocation_method in \('direct','fte','attendance','manual'\)/);
});

test('UI points schema-drift errors to the R5 migration',()=>{
  assert.match(app,/schemaDrift=\/allocated_amount\|allocation_method_snapshot\|column\\s\+sca\\\.\/i/);
  assert.match(app,/schemaDrift\?'V2\.58\.0 R5':'V2\.57\.6'/);
});

test('R5 permanece preservada como migration histórica após a V2.58.9',()=>{
  assert.equal(pkg.version,'2.61.9');
  assert.equal(pkg.assetVersion,'2.61.9-r1');
  assert.match(index,/js\/app\.js\?v=2\.61\.9/);
  assert.match(migration,/notify pgrst,'reload schema'/);
});
