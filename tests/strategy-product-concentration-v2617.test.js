const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../js/strategy-product-concentration.js');
function summary(squad,rows,extras={}) {return {squadCode:squad,aggregate:{sourceAvailable:true},view:{attendanceSourceAvailable:true,reconciled:{cost:true,direct:true,influenced:true,protected:true},rows:rows.map(([product,attendance,cost,direct,influenced=0,protected=0])=>({productCode:product,productName:product,unclassified:product==='UNCLASSIFIED',attendance,totalCost:cost,directRevenue:direct,influencedRevenue:influenced,protectedRevenue:protected})),...extras}};}
test('participações por produto e squad são reconciliadas, incluindo não classificado',()=>{
 const a=engine.analyze({summaries:[summary('A',[['P',60,100,30],['UNCLASSIFIED',40,10,0]]),summary('B',[['P',20,10,5],['Q',80,60,50]])]});
 assert.equal(a.total,200);assert.equal(a.products.find(x=>x.code==='P').value,80);assert.equal(a.unclassifiedShare,0.2);assert.equal(a.productStats.top1,0.4);assert.equal(a.squads.length,2);assert.equal(a.dependencies.find(x=>x.squadCode==='B').topProductShare,0.8);
});
test('separação das naturezas: receita protegida não entra em direta',()=>{
 const rows=[summary('A',[['P',10,100,20,200,500]])];
 assert.equal(engine.analyze({summaries:rows,metric:'direct'}).total,20);
 assert.equal(engine.analyze({summaries:rows,metric:'influenced'}).total,200);
 assert.equal(engine.analyze({summaries:rows,metric:'protected'}).total,500);
});
test('fonte de demanda incompleta exclui squad e sinaliza dados parciais',()=>{
 const a=engine.analyze({summaries:[summary('A',[['P',20,0,0]]),summary('B',[['Q',10,0,0]],{attendanceSourceAvailable:false})]});
 assert.equal(a.total,20);assert.equal(a.partial,true);assert.equal(a.excluded,1);assert.ok(a.alerts.some(x=>x.includes('parcial')));
});
test('sem fonte não produz percentuais zero artificiais',()=>{
 const a=engine.analyze({summaries:[]});assert.equal(a.total,0);assert.equal(a.productStats.top1,null);assert.equal(a.unclassifiedShare,null);
});
test('interface e motor V2.62.0 presentes com proteção de acesso',()=>{
 const root=path.join(__dirname,'..'),index=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
 assert.ok(index.includes('js/strategy-product-concentration.js?v=2.62.0-r1'));
 assert.ok(index.includes('strategyConcentrationProductRows'));
 assert.ok(app.includes('renderStrategyProductConcentration(vm,displayAggregate)'));
 assert.ok(app.includes('if(!displayAggregate){body.innerHTML'));
});
