const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'js/date-controls.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
const pkg=require('../package.json');
test('R30.6: calendario nativo preservado como fonte mas com controles visuais uniformes',()=>{
 assert.match(js,/const types = \['date', 'month', 'datetime-local'\]/);
 assert.match(js,/input\.dispatchEvent\(new Event\('change',\{bubbles:true\}\)\)/);
 assert.match(js,/Object\.defineProperty\(input,'value'/);
 assert.match(css,/\.ds-date-source/);
 assert.match(css,/\.ds-date-dialog-panel/);
});
test('R30.6: seletor global rola conteudo com rodape aplicar analise visivel',()=>{
 assert.match(html,/class="period-picker-scroll-area"/);
 assert.match(css,/\.period-picker-scroll-area\{[^}]*overflow-y:auto/);
 assert.match(css,/\.analysis-period-popover:not\(\.hidden\)\{[^}]*flex-direction:column/);
 assert.match(css,/\.analysis-period-popover \.period-picker-foot\{[^}]*flex:0 0 auto/);
 const scrollStart=html.indexOf('class="period-picker-scroll-area"');
 const scrollEnd=html.indexOf('class="period-picker-foot"');
 assert.ok(scrollStart>0&&scrollEnd>scrollStart);
});
test('R30.6: assetVersion e formulario de periodo mantidos',()=>{
 assert.equal(pkg.assetVersion,'2.63.9-r3061');
 assert.match(html,/js\/date-controls\.js\?v=2\.63\.9-r3061/);
 assert.match(html,/id="periodPickerApply"/);
 assert.match(html,/id="notificationStartsAtInput" type="datetime-local"/);
});
