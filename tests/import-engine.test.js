const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../js/import-engine.js');

test('checksum e deterministico',()=>{
  assert.equal(engine.checksumText('abc'),engine.checksumText('abc'));
  assert.notEqual(engine.checksumText('abc'),engine.checksumText('abd'));
});

test('preview de servico consolida por squad e compara com atual',()=>{
  const rows=[
    {id:'2026-10',group:'A',name:'Ana',att:10,notes5:3,notes4:1,notes3:0,notes2:0,notes1:0},
    {id:'2026-10',group:'A',name:'Ana',att:5,notes5:1,notes4:0,notes3:0,notes2:0,notes1:0},
    {id:'2026-10',group:'A',name:'Bia',att:8,notes5:2,notes4:0,notes3:0,notes2:0,notes1:0}
  ];
  const p=engine.summarizeService(rows,'2026-10',['A'],{A:{technicians:2,attendance:20,evaluations:5,notes5:3}});
  assert.equal(p.rows,3);assert.equal(p.technicians,2);assert.equal(p.attendance,23);assert.equal(p.evaluations,7);assert.equal(p.squads[0].attendanceDelta,.15);
});

test('preview de qualidade conta produto e empresa',()=>{
  const rows=[
    {id:'2026-10',group:'D',name:'Ana',productNote:5,companyNote:4},
    {id:'2026-10',group:'D',name:'Ana',productNote:0,companyNote:5},
    {id:'2026-10',group:'D',name:'Bia',productNote:3,companyNote:0}
  ];
  const p=engine.summarizeQuality(rows,'2026-10',['D'],{D:{rows:2,technicians:1,product:1,company:1}});
  assert.equal(p.rows,3);assert.equal(p.technicians,2);assert.equal(p.product,2);assert.equal(p.company,2);
});

test('validacao bloqueia negativos e mes fechado',()=>{
  const v=engine.validatePreview({kind:'service',totalRows:10,validRows:10,negativeValues:1,closedSquads:['D'],summary:{squads:[]}});
  assert.equal(v.blocked,true);assert.equal(v.level,'error');assert.ok(v.issues.some(x=>x.code==='negative_values'));assert.ok(v.issues.some(x=>x.code==='closed_month'));
});

test('validacao exige confirmacao em queda relevante',()=>{
  const v=engine.validatePreview({kind:'service',totalRows:100,validRows:100,summary:{squads:[{code:'A',current:{attendance:200},incoming:{attendance:100,evaluations:30},attendanceDelta:-.5,technicianDelta:0}]}});
  assert.equal(v.blocked,false);assert.equal(v.requiresConfirmation,true);assert.equal(v.level,'warning');assert.ok(v.issues.some(x=>x.code==='attendance_drop'));
});

test('historico normaliza e rollback exige snapshot',()=>{
  const a=engine.historySummary({batchKey:'1',kind:'quality',period:'2026-10',status:'success',beforeSnapshot:{D:{'2026-10':{id:'2026-10'}}}});
  assert.equal(a.kind,'quality');assert.equal(engine.canRollback(a),true);
  const b=engine.historySummary({batchKey:'2',status:'success'});assert.equal(engine.canRollback(b),false);
});

test('V2.45.2 reconhece cabecalhos do CSV financeiro original',()=>{
  const r=engine.resolveFinancialImpactColumns(['DataAvaliacao','NotaServico','NotaProduto','NotaEmpresa']);
  assert.deepEqual(r.missing,[]);
  assert.deepEqual(r.indexes,{date:0,service:1,product:2,company:3});
});

test('V2.45.2 aceita aliases reais de data e nota de atendimento',()=>{
  const r=engine.resolveFinancialImpactColumns(['Data Avaliação','Nota Atendimento','Nota Produto','Nota Empresa']);
  assert.deepEqual(r.missing,[]);
  assert.deepEqual(r.indexes,{date:0,service:1,product:2,company:3});
  const q=engine.resolveFinancialImpactColumns(['Time','NotaServico','NotaProduto','NotaEmpresa']);
  assert.deepEqual(q.missing,[]);
  assert.equal(q.indexes.date,0);
});

test('V2.45.2 mantem validacao sem aceitar CSV financeiro incompleto',()=>{
  const r=engine.resolveFinancialImpactColumns(['Time','NotaProduto','NotaEmpresa']);
  assert.equal(r.indexes.service,null);
  assert.equal(r.missing.length,1);
  assert.equal(r.missing[0].key,'service');
  assert.ok(r.missing[0].accepted.includes('Nota Atendimento'));
});


test('V2.45.2 ignora diretiva sep do Excel e preserva o cabecalho real',()=>{
  const csv='sep=;\nData Avaliação;Nota Atendimento;Nota Produto;Nota Empresa\n01/10/2026 08:00;5;4;5';
  const rows=engine.parseCsvRows(csv);
  assert.deepEqual(rows[0],['Data Avaliação','Nota Atendimento','Nota Produto','Nota Empresa']);
  assert.deepEqual(rows[1],['01/10/2026 08:00','5','4','5']);
});

test('V2.45.2 parser CSV continua respeitando campos delimitados entre aspas',()=>{
  const rows=engine.parseCsvRows('Data,Texto\n01/10/2026,"A, B"');
  assert.deepEqual(rows[1],['01/10/2026','A, B']);
});


test('V2.47.1 importacao de qualidade aceita DataAvaliacao no lugar de Time',()=>{
  const r=engine.resolveQualityImportColumns(['DataAvaliacao','nomeApresentativo','NotaServico','NotaProduto','NotaEmpresa']);
  assert.deepEqual(r.missing,[]);
  assert.deepEqual(r.indexes,{date:0,technician:1,product:3,company:4});
});

test('V2.47.1 importacao de qualidade aceita aliases com acento e tecnico alternativo',()=>{
  const r=engine.resolveQualityImportColumns(['Data Avaliação','Técnico','Nota Produto','Nota Empresa']);
  assert.deepEqual(r.missing,[]);
  assert.deepEqual(r.indexes,{date:0,technician:1,product:2,company:3});
});

test('V2.47.1 importacao de qualidade continua bloqueando arquivo incompleto',()=>{
  const r=engine.resolveQualityImportColumns(['DataAvaliacao','nomeApresentativo','NotaProduto']);
  assert.equal(r.missing.length,1);
  assert.equal(r.missing[0].key,'company');
  assert.ok(r.missing[0].accepted.includes('NotaEmpresa'));
});
