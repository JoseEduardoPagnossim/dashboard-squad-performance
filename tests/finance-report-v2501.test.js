const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname,'..');
const engine = require(join(root,'js','finance-report-engine.js'));
const index = readFileSync(join(root,'index.html'),'utf8');
const app = readFileSync(join(root,'js','app.js'),'utf8');
const css = readFileSync(join(root,'css','styles.css'),'utf8');
const pkg = require(join(root,'package.json'));

test('V2.53.0 carrega o configurador de relatório antes do app',()=>{
  assert.equal(pkg.version,'2.59.6');
  const enginePos=index.indexOf('js/finance-report-engine.js?v=2.59.6-r1');
  const appPos=index.indexOf('js/app.js?v=2.59.6-r1');
  assert.ok(enginePos>=0 && appPos>enginePos);
  assert.match(app,/window\.SoftenFinanceReportEngine/);
  assert.match(app,/APP_VERSION = '2\.59\.6'/);
});

test('catálogo mantém Técnico obrigatório e padrão compatível com o PDF anterior',()=>{
  const cfg=engine.defaultConfig();
  assert.ok(cfg.visible.includes('technician'));
  assert.deepEqual(engine.selectedColumns(cfg).map(c=>c.id),[
    'technician','status','squadFinal','individualFinal','difference','officialModel','officialValue','bonusTotal','sales','discount','redistribution','vacation','countsSquadBase'
  ]);
  const hidden=engine.setVisible(cfg,'technician',false);
  assert.ok(hidden.visible.includes('technician'));
});

test('presets Enxuto, RH e Completo usam o mesmo catálogo e preservam ordem configurável',()=>{
  const compact=engine.presetConfig('compact');
  assert.deepEqual(engine.selectedColumns(compact).map(c=>c.id),['technician','status','attendance','officialValue','bonusTotal','discount','redistribution','vacation']);
  const hr=engine.presetConfig('hr');
  assert.deepEqual(engine.selectedColumns(hr).map(c=>c.id),['group','technician','baseTechnicianCommission','sales','manualCommission','hrPaymentTotal']);
  assert.deepEqual(engine.selectedColumns(hr).map(c=>c.label),['Grupo','Técnico','Comissão base do técnico','Comissão Venda','Comissão manual','Bônus total (RH)']);
  assert.equal(hr.applyToExcel,true);
  const full=engine.presetConfig('full');
  assert.equal(engine.selectedColumns(full).length,engine.COLUMNS.filter(c=>!c.presetOnly).length);
  const moved=engine.moveColumn(compact,'officialValue','status');
  assert.ok(moved.order.indexOf('officialValue')<moved.order.indexOf('status'));
  const stepped=engine.stepColumn(moved,'officialValue','down');
  assert.equal(stepped.order.indexOf('status')+1,stepped.order.indexOf('officialValue'));
});



test('preset RH reconcilia comissão base + venda + manual com o valor oficial',()=>{
  const row={'Valor oficial':1450,'Comissão vendas':200,'Bônus manual':100,'Prêmio atendimento':30,'Prêmio Notas 5':20,'Comissão base do técnico':1100,'Grupo':'D','Técnico':'Teste'};
  const hr=engine.presetConfig('hr');
  const cols=engine.selectedColumns(hr);
  assert.equal(engine.computedValue(row,engine.columnById('baseTechnicianCommission')),1100);
  assert.equal(engine.computedValue(row,engine.columnById('sales')),200);
  assert.equal(engine.computedValue(row,engine.columnById('manualCommission')),150);
  assert.equal(1100+200+150,row['Valor oficial']);
  assert.equal(engine.computedValue(row,engine.columnById('hrPaymentTotal')),1450);
  assert.equal(engine.columnById('hrPaymentTotal').exportLabel,'Bônus total');
  assert.deepEqual(cols.map(c=>c.shortLabel),['Grupo','Técnico','Comissão base','Comissão Venda','Comissão manual','Bônus total']);
});

test('Bônus total é calculado sem alterar as colunas brutas do fechamento',()=>{
  const col=engine.columnById('bonusTotal');
  assert.equal(engine.computedValue({'Bônus manual':100,'Prêmio atendimento':80,'Prêmio Notas 5':20},col),200);
});

test('UI permite seleção, drag-and-drop, presets, prévia e aplicação opcional no Excel',()=>{
  for(const id of ['configureFinanceReportBtn','financeReportConfigModal','financeReportColumnList','financeReportPreview','financeReportApplyExcel','financeReportPresetCompact','financeReportPresetHr','financeReportPresetFull','financeReportPresetMine','saveFinanceReportConfigBtn'])assert.ok(index.includes(`id="${id}"`),`faltando ${id}`);
  assert.match(index,/Configurar relatório/);
  assert.match(index,/Usar estas colunas também no Excel/);
  assert.match(app,/function renderFinanceReportConfigurator\(/);
  assert.match(app,/addEventListener\('dragstart'/);
  assert.match(app,/moveFinanceReportDraft/);
  assert.match(app,/persistMyUiPreferences\(\)/);
  assert.match(css,/V2\.50\.1 - RELATORIO DE BONIFICACAO PERSONALIZAVEL/);
  assert.match(css,/\.finance-report-column-row\.finance-report-drag-over/);
});

test('PDF usa colunas dinâmicas e Excel só personaliza quando a opção estiver ativa',()=>{
  assert.match(app,/columns=financeReportSelectedColumns\(config\)/);
  assert.match(app,/head:\[columns\.map\(c=>c\.shortLabel\|\|c\.label\)\]/);
  assert.match(app,/body=rows\.map\(row=>columns\.map\(column=>financeReportDisplayValue\(row,column\)\)\)/);
  assert.match(app,/horizontalPageBreak:columns\.length>13/);
  assert.match(app,/excelRows=config\.applyToExcel\?financeReportProjectedRows\(rows,columns\):rows/);
  assert.match(app,/column\.exportLabel\|\|column\.label/);
  assert.match(app,/financeReport:normalizeFinanceReportConfig\(raw\.financeReport\)/);
});


test('linhas do relatório RH incluem grupo e decomposição de pagamento',()=>{
  assert.match(app,/['"]Grupo['"]:\s*String\(state\.squadCode\|\|['"]['"]\)/);
  assert.match(app,/['"]Comissão base do técnico['"]:Number\(\(safe\(d\.final\)-safe\(d\.salesCommission\)-safe\(d\.manualBonus\)-safe\(d\.topAttBonus\)-safe\(d\.topNotes5Bonus\)\)\.toFixed\(2\)\)/);
});
