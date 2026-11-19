'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const ds=fs.readFileSync(path.join(root,'js/design-system.js'),'utf8');
const dates=fs.readFileSync(path.join(root,'js/date-controls.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const pkg=require(path.join(root,'package.json'));
test('R30.6.2: calendario de data e competencia nao abre seletor nativo pelo Design System',()=>{
 const start=ds.indexOf('function enhancePickerInput(input)');
 const end=ds.indexOf('function enhanceControl(control)',start);
 assert.ok(start>0&&end>start);
 const picker=ds.slice(start,end);
 assert.doesNotMatch(picker,/showPicker\(|\.click\(|ds-picker-button|createElement\('button'\)/);
 assert.match(picker,/dataset\.dsControlReady/);
});
test('R30.6.2: date-controls assume os dois alvos e limpa icone legado',()=>{
 assert.match(dates,/legacyShell\.querySelectorAll\(':scope > \.ds-picker-button'\)/);
 assert.match(dates,/legacyShell\.remove\(\)/);
 assert.match(dates,/button\.addEventListener\('click'/);
 assert.match(dates,/open\(input\)/);
});
test('R30.6.2: mesma versao em index, testes e package',()=>{
 assert.equal(pkg.assetVersion,'2.63.9-r3062');
 assert.match(html,/js\/date-controls\.js\?v=2\.63\.9-r3062/);
 assert.match(html,/js\/design-system\.js\?v=2\.63\.9-r3062/);
});
