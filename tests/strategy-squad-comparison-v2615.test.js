const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const engine=require('../js/strategy-squad-comparison.js');
const base={squadCode:'D',totalCost:1000,attendance:100,resolutions:80,availableFte:2,fte:2,availabilityComplete:true,usedCapacityComplete:true,usedCapacityVolume:130};
test('V2.61.5 compara custos FCR FTE e receita sem misturar natureza de resultado',()=>{
 const view=engine.build({squads:[base,{...base,squadCode:'E',availableFte:1,attendance:50,resolutions:20}],result:{sourceAvailable:true,rows:[{squadCode:'D',directRevenue:1200,influencedRevenue:10000,protectedRevenue:9000}]}});
 assert.equal(view.rows.length,2);
 const d=view.rows[0];assert.equal(d.costPerAttendance,10);assert.equal(d.attendancePerFte,50);assert.equal(d.fcr,0.8);assert.equal(d.directNet,200);assert.equal(d.directRoi,.2);assert.equal(d.influencedRevenue,10000);
});
test('FTE ausente e divisores zerados não produzem dados falsos',()=>{
 const row=engine.build({squads:[{...base,attendance:0,resolutions:0,availableFte:null,availabilityComplete:false,totalCost:0}],result:{sourceAvailable:false}}).rows[0];
 assert.equal(row.fte,null);assert.equal(row.fcr,null);assert.equal(row.costPerAttendance,null);assert.equal(row.directRoi,null);
});
test('Comparativo respeita filtro Squad e está ligado à tela e aos scripts',()=>{
 assert.deepEqual(engine.build({squads:[base,{...base,squadCode:'E'}],scope:'D'}).rows.map(x=>x.code),['D']);
 const html=readFileSync(join(__dirname,'../index.html'),'utf8');const app=readFileSync(join(__dirname,'../js/app.js'),'utf8');
 assert.match(html,/strategySquadComparisonRows/);assert.match(html,/strategy-squad-comparison.js/);assert.match(app,/renderStrategySquadComparison\(vm,displayAggregate\)/);
});
