const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const pkg=require(join(root,'package.json'));
const costEngine=require(join(root,'js','strategy-cost-engine.js'));

test('V2.59.6 R1 preserva campos estendidos no resumo estratégico',()=>{
  assert.equal(pkg.version,'2.62.4');
  assert.equal(pkg.assetVersion,'2.62.4-r1');
  const merged=costEngine.mergeFinancialSummary({
    peopleCount:29,fte:29,totalCost:40000,attendance:4860,
    resolutions:4785,resolutionEntries:29,
    availableFte:29,unavailableFte:0,availabilityComplete:true,availabilityRate:1,
    usedCapacityVolume:4785,usedCapacityComplete:true
  },{competence:'2026-10',squadCode:'all'});
  assert.equal(merged.resolutions,4785);
  assert.equal(merged.resolutionEntries,29);
  assert.equal(merged.availableFte,29);
  assert.equal(merged.availabilityComplete,true);
  assert.equal(merged.availabilityRate,1);
  assert.equal(merged.usedCapacityVolume,4785);
  assert.equal(merged.usedCapacityComplete,true);
  assert.equal(merged.fte,29);
  assert.equal(merged.attendance,4860);
});

test('hotfix do resumo permanece coberto na V2.59.7',()=>{
  const index=readFileSync(join(root,'index.html'),'utf8');
  assert.ok(index.includes('js/strategy-cost-engine.js?v=2.62.4-r1'));
  assert.ok(index.includes('js/app.js?v=2.62.4-r1'));
});
