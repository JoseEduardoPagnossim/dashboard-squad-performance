const test=require('node:test'),assert=require('node:assert/strict'),e=require('../js/strategy-scenarios');
const baseline=(rows=[{productCode:'GA',productName:'GA',attendance:100,resolutions:80}])=>e.createDemandBaseline({competence:'2026-10',squadCode:'A',attendanceSourceAvailable:true,resolutionSourceAvailable:true,rows});
test('projeção de demanda preserva taxa de resoluções',()=>{const x=e.simulateDemand(baseline(),{variationPct:20});assert.equal(x.projectedAttendance,120);assert.equal(x.projectedResolutions,96);});
test('ajuste explícito da taxa em pontos percentuais',()=>{const x=e.simulateDemand(baseline(),{resolutionRateDeltaPct:-10});assert.equal(x.projectedResolutions,70);});
test('produto filtrado não inclui demais produtos',()=>{const x=e.simulateDemand(baseline([{productCode:'GA',attendance:100,resolutions:80},{productCode:'SIEM',attendance:50,resolutions:20}]),{productCode:'SIEM'});assert.equal(x.baselineAttendance,50);});
test('fontes indisponíveis bloqueiam projeção',()=>{const x=e.simulateDemand(e.createDemandBaseline({competence:'2026-10',rows:[{attendance:10,resolutions:9}]}));assert.equal(x.status,'insufficient_data');});
test('resoluções maiores que atendimentos são inválidas',()=>{const x=e.simulateDemand(baseline([{attendance:10,resolutions:11}]));assert.equal(x.status,'insufficient_data');});
test('volume zerado não gera resolução artificial',()=>{const x=e.simulateDemand(baseline([{attendance:0,resolutions:0}]));assert.equal(x.status,'insufficient_data');});
test('simulação não altera a base',()=>{const b=baseline();e.simulateDemand(b,{variationPct:50});assert.equal(b.rows[0].attendance,100);});
