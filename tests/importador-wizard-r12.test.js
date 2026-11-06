const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/strategy.css'),'utf8');

test('R12: importador tem quatro etapas reais com areas exclusivas e navegacao',()=>{
  for(let step=1;step<=4;step++){
    assert.match(html,new RegExp(`id="strategyCsvWizardStep${step}"`));
    assert.match(html,new RegExp(`data-strategy-csv-step="${step}"`));
  }
  assert.match(html,/id="strategyCsvWizardBack"/);
  assert.match(html,/id="strategyCsvWizardNext"/);
  assert.match(app,/function renderStrategyCsvWizard\(/);
  assert.match(app,/function changeStrategyCsvWizardStep\(/);
  assert.match(app,/step>strategyCsvWizardStep\+1/);
  assert.match(css,/strategy-csv-wizard-step\[hidden\]/);
});
test('R12: confirmacao financeira preserva importadores oficiais, sem gravacao no passo de navegacao',()=>{
  assert.match(html,/id="strategyRecurringImportSection"/);
  assert.match(html,/id="strategyMerchandiseImportSection"/);
  assert.match(app,/recurring.hidden=strategyCsvWizardStep!==4\|\|cs.sourceKey!==/);
  assert.match(app,/merchandise.hidden=strategyCsvWizardStep!==4\|\|cs.sourceKey!==/);
  const nav=app.slice(app.indexOf('function changeStrategyCsvWizardStep('),app.indexOf('function changeStrategyCsvWizardStep(')+900);
  assert.doesNotMatch(nav,/\.rpc\(|\.insert\(|\.upsert\(/);
  assert.match(app,/confirmStrategyRecurringImport\(\)/);
  assert.match(app,/confirmStrategyMerchandiseImport\(\)/);
});
test('R12: obrigatorios e opcionais continuam segregados e lideres nao mudam',()=>{
  assert.match(app,/def\.fields\.filter\(f=>f\.required\)/);
  assert.match(app,/def\.fields\.filter\(f=>!f\.required\)/);
  assert.match(html,/Colunas opcionais · ativar somente se necessário/);
  assert.match(app,/strategyCsvWizardStep=1;if\(\$\('#strategyCsvFile'\)\)/);
  assert.match(app,/strategyCsvWizardStep=2;/);
});
