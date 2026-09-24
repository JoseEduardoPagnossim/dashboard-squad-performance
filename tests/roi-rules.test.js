const test=require('node:test');
const assert=require('node:assert/strict');
const {calculateMonthlyRoi,aggregateRoiRows,groupPeriodId,groupRoiHistory}=require('../js/roi-rules.js');

test('calcula ROI mensal usando receita protegida mensal e receita adicional realizada',()=>{
  const r=calculateMonthlyRoi({cost:100000,attendances:10000,clients:1000,ticket:200,churnReference:.05,churnCurrent:.035,additionalRevenue:30000,technicians:10,businessDays:20,hoursPerDay:8});
  assert.equal(r.preservedClients,15);
  assert.equal(r.protectedMonthly,3000);
  assert.equal(r.protectedAnnual,36000);
  assert.equal(r.economicBenefit,33000);
  assert.equal(r.roiPct,-67);
  assert.equal(r.costPerAttendance,10);
  assert.equal(r.costPerClient,100);
  assert.equal(r.productivityPerTechDay,50);
});

test('preserva sinal negativo quando churn atual piora',()=>{
  const r=calculateMonthlyRoi({cost:1000,clients:100,ticket:100,churnReference:.02,churnCurrent:.03});
  assert.equal(r.preservedClients,-1);
  assert.equal(r.protectedMonthly,-100);
  assert.equal(r.roiPct,-110);
});

test('ROI fica indisponivel quando custo e zero',()=>{
  const r=calculateMonthlyRoi({cost:0,clients:100,ticket:100,churnReference:.03,churnCurrent:.02});
  assert.equal(r.roiPct,null);
  assert.equal(r.costPerAttendance,null);
});

test('agrupa historico por trimestre e ano',()=>{
  assert.equal(groupPeriodId('2026-01','quarter'),'2026-T1');
  assert.equal(groupPeriodId('2026-12','quarter'),'2026-T4');
  assert.equal(groupPeriodId('2026-09','year'),'2026');
  const grouped=groupRoiHistory([
    {id:'2026-01',cost:100,attendances:10,clients:10,protectedMonthly:30,additionalRevenue:20,churnCurrent:.02,churnReference:.03},
    {id:'2026-02',cost:100,attendances:10,clients:10,protectedMonthly:40,additionalRevenue:10,churnCurrent:.02,churnReference:.03},
    {id:'2026-04',cost:200,attendances:20,clients:20,protectedMonthly:50,additionalRevenue:50,churnCurrent:.02,churnReference:.03}
  ],'quarter');
  assert.equal(grouped.length,2);
  assert.equal(grouped[0].id,'2026-T1');
  assert.equal(grouped[0].cost,200);
  assert.equal(grouped[0].economicBenefit,100);
  assert.equal(grouped[0].roiPct,-50);
});

test('historico sinaliza grupos incompletos sem impedir totais operacionais',()=>{
  const grouped=groupRoiHistory([
    {id:'2026-01',cost:100,attendances:10,clients:10,protectedMonthly:20,additionalRevenue:5,churnCurrent:.02,churnReference:.03,hasChurn:true,isComplete:true},
    {id:'2026-02',cost:100,attendances:20,clients:0,protectedMonthly:0,additionalRevenue:10,churnCurrent:0,churnReference:0,hasChurn:false,isComplete:false}
  ],'quarter');
  assert.equal(grouped[0].cost,200);
  assert.equal(grouped[0].attendances,30);
  assert.equal(grouped[0].completeMonths,1);
  assert.equal(grouped[0].isComplete,false);
  assert.equal(grouped[0].hasChurn,true);
});
