const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const index=readFileSync(join(root,'index.html'),'utf8');
const app=readFileSync(join(root,'js','app.js'),'utf8');
const design=readFileSync(join(root,'js','design-system.js'),'utf8');
const migrationPath=join(root,'supabase','migrations','MIGRACAO_V2.53.1.sql');
const migration=readFileSync(migrationPath,'utf8');
const schema=readFileSync(join(root,'supabase','schema.sql'),'utf8');

test('V2.57.7 consulta consolidados diarios somente no periodo ativo e pagina a resposta',()=>{
  assert.equal(pkg.version,'2.63.1');
  assert.match(app,/function orgDailyRequestedRange\(\)/);
  assert.match(app,/fetchRpcPaged\('get_org_daily_attendance_overview_range',params\)/);
  assert.match(app,/fetchRpcPaged\('get_org_technician_daily_overview_range',params\)/);
  assert.match(app,/p_start_date:requested\.start,p_end_date:requested\.end/);
  assert.match(app,/pageSize=900/);
  assert.match(app,/query=query\.range\(from,from\+size-1\)/);
  assert.match(app,/state\.orgDailyRangeKey!==requested\.key/);
});

test('V2.57.7 publica RPCs por intervalo mantendo isolamento organizacional',()=>{
  assert.equal(existsSync(migrationPath),true);
  for(const sql of [migration,schema]){
    assert.match(sql,/get_org_daily_attendance_overview_range\s*\(/i);
    assert.match(sql,/get_org_technician_daily_overview_range\s*\(/i);
    assert.match(sql,/p_start_date date/i);
    assert.match(sql,/p_end_date date/i);
    assert.match(sql,/p\.organization_id = s\.organization_id/i);
    assert.match(sql,/make_date\(sm\.year, sm\.month, dm\.day\) >= p_start_date/i);
    assert.match(sql,/make_date\(sm\.year, sm\.month, dm\.day\) <= p_end_date/i);
  }
});

test('V2.57.7 permite rolar o menu do select sem fecha-lo',()=>{
  assert.match(design,/target===openSelectControl\.menu\|\|openSelectControl\.menu\?\.contains\?\.\(target\)\)return/);
  assert.match(design,/window\.addEventListener\('scroll',event=>/);
});

test('V2.57.7 atualiza cache-bust e versao visivel',()=>{
  assert.ok(index.includes('V2.60.7'));
  assert.ok(index.includes('css/styles.css?v=2.63.1-r1'));
  assert.ok(index.includes('js/design-system.js?v=2.63.1-r1'));
  assert.ok(index.includes('js/app.js?v=2.63.1-r1'));
  assert.match(app,/APP_VERSION = '2\.63\.1'/);
});
