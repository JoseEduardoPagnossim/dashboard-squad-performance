const test = require('node:test');
const assert = require('node:assert/strict');
const comparison = require('../js/comparison-engine.js');

test('V2.50 desloca o mesmo recorte para o mês anterior',()=>{
  assert.deepEqual(comparison.range('2026-10-01','2026-10-08','previous-month'),{start:'2026-09-01',end:'2026-09-08',mode:'previous-month'});
  assert.deepEqual(comparison.range('2026-09-15','2026-10-08','previous-month'),{start:'2026-08-15',end:'2026-09-08',mode:'previous-month'});
});

test('V2.50 limita dias inexistentes ao deslocar meses',()=>{
  assert.equal(comparison.shiftMonths('2026-03-31',-1),'2026-02-28');
  assert.equal(comparison.shiftMonths('2024-03-31',-1),'2024-02-29');
});

test('V2.50 cria período anterior com a mesma duração inclusiva',()=>{
  assert.equal(comparison.daysInclusive('2026-10-01','2026-10-08'),8);
  assert.deepEqual(comparison.range('2026-10-01','2026-10-08','previous-period'),{start:'2026-09-23',end:'2026-09-30',mode:'previous-period'});
});

test('V2.50 calcula deltas absolutos, percentuais e em pontos percentuais',()=>{
  assert.deepEqual(comparison.delta(110,100),{current:110,previous:100,difference:10,percentage:.1,unit:'value'});
  assert.deepEqual(comparison.delta(.463,.365,{rate:true}),{current:.463,previous:.365,difference:.09800000000000003,percentage:null,unit:'pp'});
  assert.equal(comparison.tone(1),'positive');
  assert.equal(comparison.tone(-1),'negative');
  assert.equal(comparison.tone(0),'neutral');
});
