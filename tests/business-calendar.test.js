const test = require('node:test');
const assert = require('node:assert/strict');
const calendar = require('../js/business-calendar.js');
const finance = require('../js/finance-rules.js');

test('setembro de 2026 possui 22 dias de segunda a sexta antes dos feriados',()=>{
  assert.equal(calendar.weekdayCount(2026,9,30),22);
});

test('feriado nacional de 07/09 reduz setembro de 22 para 21 dias úteis',()=>{
  const summary=calendar.operationalSummary({year:2026,month:9,latestDay:30,exceptions:calendar.mergeYearExceptions(2026,[])});
  assert.equal(summary.weekdays,22);
  assert.equal(summary.excludedCount,1);
  assert.equal(summary.businessDays,21);
  assert.equal(summary.exceptions[0].date,'2026-09-07');
});

test('caso de referência da bonificação reproduz 10,81 com 21 dias',()=>{
  const total=1589,technicians=7;
  const withHoliday=total/21/technicians;
  const withoutHoliday=total/22/technicians;
  assert.equal(Number(withHoliday.toFixed(2)),10.81);
  assert.equal(Number(withoutHoliday.toFixed(2)),10.32);
});

test('10,81 muda a faixa de atendimento em relação a 10,32 na regra financeira atual',()=>{
  const settings=finance.resolveFinanceSettings({});
  const withHoliday=finance.groupFinanceBase({totalAtt:1589,totalN5:0,countedCount:7,days:21,eligibleAtt:1589,evaluationExcludedAtt:0,effectiveMultiplier:1,attendanceTiers:settings.attendanceTiers,notes5Tiers:settings.notes5Tiers});
  const withoutHoliday=finance.groupFinanceBase({totalAtt:1589,totalN5:0,countedCount:7,days:22,eligibleAtt:1589,evaluationExcludedAtt:0,effectiveMultiplier:1,attendanceTiers:settings.attendanceTiers,notes5Tiers:settings.notes5Tiers});
  assert.equal(Number(withHoliday.avgPerDay.toFixed(2)),10.81);
  assert.equal(Number(withoutHoliday.avgPerDay.toFixed(2)),10.32);
  assert.equal(withHoliday.attendanceTier.min,10.5);
  assert.equal(withoutHoliday.attendanceTier.min,8.4);
  assert.equal(withHoliday.commissionAtt,240.43);
  assert.equal(withoutHoliday.commissionAtt,204.37);
});

test('feriado em fim de semana não é descontado duas vezes',()=>{
  const summary=calendar.operationalSummary({year:2026,month:11,latestDay:30,exceptions:[{date:'2026-11-15',description:'Proclamação',type:'national',active:true}]});
  assert.equal(summary.excludedCount,0);
  assert.equal(summary.businessDays,summary.weekdays);
});

test('administrador pode desativar feriado nacional padrão',()=>{
  const rows=calendar.mergeYearExceptions(2026,[{date:'2026-09-07',description:'Operação normal',type:'national',active:false}]);
  const summary=calendar.operationalSummary({year:2026,month:9,latestDay:30,exceptions:rows});
  assert.equal(summary.excludedCount,0);
  assert.equal(summary.businessDays,22);
});

test('recesso de empresa em dia útil entra no calendário operacional',()=>{
  const rows=calendar.mergeYearExceptions(2026,[{date:'2026-09-18',description:'Recesso interno',type:'company',active:true}]);
  const summary=calendar.operationalSummary({year:2026,month:9,latestDay:30,exceptions:rows});
  assert.equal(summary.excludedCount,2);
  assert.equal(summary.businessDays,20);
  assert.ok(summary.exceptions.some(x=>x.date==='2026-09-18'));
});
