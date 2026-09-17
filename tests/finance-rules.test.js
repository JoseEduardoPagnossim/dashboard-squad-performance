const test = require('node:test');
const assert = require('node:assert/strict');

const finance = require('../js/finance-rules.js');

const settings = finance.resolveFinanceSettings();

function approx(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `esperado ${expected}, recebido ${actual}`);
}

test('configuração financeira padrão é resolvida sem compartilhar arrays mutáveis', () => {
  const a = finance.resolveFinanceSettings();
  const b = finance.resolveFinanceSettings();
  assert.equal(a.topAttendancePrize, 100);
  assert.equal(a.topNotes5Prize, 100);
  assert.equal(a.belowDiscount, 200);
  a.attendanceTiers[0].amount = 1;
  assert.equal(b.attendanceTiers[0].amount, 750);
  assert.equal(finance.DEFAULT_FINANCE_SETTINGS.attendanceTiers[0].amount, 750);
});

test('faixas de atendimento respeitam os limites oficiais', () => {
  assert.equal(finance.financeFloorTier(50, settings.attendanceTiers).amount, 750);
  assert.equal(finance.financeFloorTier(49.99, settings.attendanceTiers).amount, 637.5);
  assert.equal(finance.financeFloorTier(32, settings.attendanceTiers).amount, 541.88);
  assert.equal(finance.financeFloorTier(8.4, settings.attendanceTiers).amount, 204.37);
  assert.equal(finance.financeFloorTier(6.7, settings.attendanceTiers).amount, 0);
});

test('faixas de notas 5 respeitam os limites oficiais', () => {
  assert.equal(finance.financeFloorTier(1, settings.notes5Tiers).amount, 750);
  assert.equal(finance.financeFloorTier(.70, settings.notes5Tiers).amount, 600);
  assert.equal(finance.financeFloorTier(.343, settings.notes5Tiers).amount, 384);
  assert.equal(finance.financeFloorTier(.3429, settings.notes5Tiers).amount, 307.2);
  assert.equal(finance.financeFloorTier(.118, settings.notes5Tiers).amount, 196.61);
});

test('cancelamento seleciona a faixa correta e mantém multiplicador neutro quando a faixa vale zero', () => {
  const excelente = finance.cancellationSummary(1000, 4, settings.cancelTiers);
  approx(excelente.rate, .004);
  assert.equal(excelente.rawMultiplier, 2);
  assert.equal(excelente.effectiveMultiplier, 2);

  const segundaFaixa = finance.cancellationSummary(1000, 5, settings.cancelTiers);
  assert.equal(segundaFaixa.rawMultiplier, 1.76);
  assert.equal(segundaFaixa.effectiveMultiplier, 1.76);

  const neutro = finance.cancellationSummary(1000, 28, settings.cancelTiers);
  assert.equal(neutro.rawMultiplier, 0);
  assert.equal(neutro.effectiveMultiplier, 1);

  const semBase = finance.cancellationSummary(0, 0, settings.cancelTiers);
  assert.equal(semBase.rate, 0);
  assert.equal(semBase.effectiveMultiplier, 1);
});

test('status financeiro exige pelo menos 2 dos 4 critérios', () => {
  const refs = { refAtt: 10, refTotalEval: 4, refAvg: 4.8, refEvalPct: .343 };
  assert.equal(finance.financePerformanceStatus({ att: 12, totalEval: 5, avg: 4.5, evalPct: .2 }, refs), 'ACIMA');
  assert.equal(finance.financePerformanceStatus({ att: 12, totalEval: 2, avg: 4.5, evalPct: .2 }, refs), 'ABAIXO');
  assert.equal(finance.financePerformanceStatus({ att: 0, totalEval: 10, avg: 5, evalPct: 1 }, refs), '');
});

test('prêmio de liderança é dividido igualmente em caso de empate', () => {
  assert.equal(finance.splitPrize(100, 1), 100);
  assert.equal(finance.splitPrize(100, 2), 50);
  approx(finance.splitPrize(100, 3), 100 / 3);
  assert.equal(finance.splitPrize(100, 0), 0);
});

test('prêmio identifica todos os líderes empatados e divide o valor', () => {
  const a = { name: 'A', att: 20 };
  const b = { name: 'B', att: 20 };
  const c = { name: 'C', att: 10 };
  const result = finance.topPrizeAllocation([a, b, c], 'att', 100);
  assert.equal(result.max, 20);
  assert.deepEqual(result.winners, [a, b]);
  assert.equal(result.amountEach, 50);
});

test('Base do Squad mantém todos no numerador e exclui competência parcial apenas do divisor', () => {
  const result = finance.groupFinanceBase({
    totalAtt: 200,
    totalN5: 100,
    countedCount: 1,
    days: 10,
    eligibleAtt: 200,
    evaluationExcludedAtt: 0,
    effectiveMultiplier: 1.76,
    attendanceTiers: settings.attendanceTiers,
    notes5Tiers: settings.notes5Tiers
  });
  assert.equal(result.avgPerDay, 20);
  assert.equal(result.notes5Pct, .5);
  assert.equal(result.commissionAtt, 332.78);
  assert.equal(result.commissionNotes5, 480);
  approx(result.afterCancel, (332.78 + 480) * 1.76);
});

test('desconto dos ABAIXO forma pool e redistribui apenas entre ACIMA', () => {
  const result = finance.financialAdjustmentSummary(['ABAIXO', 'ABAIXO', 'ACIMA', 'ACIMA'], 200);
  assert.deepEqual(result, { belowCount: 2, aboveCount: 2, pool: 400, redistributionEach: 200 });

  const semAcima = finance.financialAdjustmentSummary(['ABAIXO', 'ABAIXO'], 200);
  assert.equal(semAcima.pool, 400);
  assert.equal(semAcima.redistributionEach, 0);

  const competenciaParcial = finance.financialAdjustmentSummary([
    { status: 'ABAIXO', eligible: true },
    { status: 'ABAIXO', eligible: false },
    { status: 'ACIMA', eligible: true },
    { status: 'ACIMA', eligible: false }
  ], 200);
  assert.deepEqual(competenciaParcial, { belowCount: 1, aboveCount: 1, pool: 200, redistributionEach: 200 });
});

test('modelo individual aplica piso zero quando descontos superam a bonificação', () => {
  const result = finance.buildFinanceModelData({
    mode: 'individual', hasProduction: true, days: 20, avgPerDay: 1, notes5Pct: 0,
    eligibleAtt: 20, evaluationExcludedAtt: 0, commissionAtt: 0, commissionNotes5: 0,
    cancelRate: 0, cancelTier: { max: .004 }, rawMult: 2, effectiveMult: 2,
    financeStatus: 'ABAIXO', financialAdjustmentEligible: true, topAttBonus: 0,
    topNotes5Bonus: 0, manualBonus: 0, sales: 0, discount: 200,
    redistributed: 0, vacation: false, pool: 200
  });
  assert.equal(result.rawBeforeVacation, -200);
  assert.equal(result.beforeVacation, 0);
  assert.equal(result.zeroFloorAdjustment, 200);
  assert.equal(result.final, 0);
});

test('modelo Base do Squad preserva valor negativo antes das férias conforme regra atual', () => {
  const result = finance.buildFinanceModelData({
    mode: 'squad', hasProduction: true, days: 20, avgPerDay: 1, notes5Pct: 0,
    eligibleAtt: 20, evaluationExcludedAtt: 0, commissionAtt: 0, commissionNotes5: 0,
    cancelRate: 0, cancelTier: { max: .004 }, rawMult: 2, effectiveMult: 2,
    financeStatus: 'ABAIXO', financialAdjustmentEligible: true, topAttBonus: 0,
    topNotes5Bonus: 0, manualBonus: 0, sales: 0, discount: 200,
    redistributed: 0, vacation: false, pool: 200
  });
  assert.equal(result.beforeVacation, -200);
  assert.equal(result.final, -200);
});

test('férias aplicam redutor final de 50%', () => {
  const result = finance.buildFinanceModelData({
    mode: 'individual', hasProduction: true, days: 20, avgPerDay: 10, notes5Pct: .5,
    eligibleAtt: 200, evaluationExcludedAtt: 0, commissionAtt: 750, commissionNotes5: 600,
    cancelRate: .005, cancelTier: { max: .008 }, rawMult: 1.76, effectiveMult: 1.76,
    financeStatus: 'ACIMA', financialAdjustmentEligible: true, topAttBonus: 100,
    topNotes5Bonus: 100, manualBonus: 100, sales: 50, discount: 0,
    redistributed: 200, vacation: true, pool: 400
  });
  assert.equal(result.afterCancel, 2376);
  assert.equal(result.beforeVacation, 2926);
  assert.equal(result.final, 1463);
});

test('teto individual não altera valores quando total está abaixo do limite', () => {
  const records = [
    { data: { preCapFinal: 1000 } },
    { data: { preCapFinal: 2000 } }
  ];
  const result = finance.applyIndividualTotalCap(records, 7000);
  assert.equal(result.applied, false);
  assert.equal(result.after, 3000);
  assert.deepEqual(records.map(r => r.data.final), [1000, 2000]);
});

test('teto individual limita o total exatamente a R$ 7.000 com rateio em centavos', () => {
  const records = [
    { data: { preCapFinal: 3000 } },
    { data: { preCapFinal: 3000 } },
    { data: { preCapFinal: 3000 } }
  ];
  const result = finance.applyIndividualTotalCap(records, 7000);
  assert.equal(result.applied, true);
  assert.equal(result.before, 9000);
  assert.equal(result.after, 7000);
  assert.equal(records.reduce((sum, r) => sum + r.data.final, 0), 7000);
  assert.ok(records.every(r => r.data.capApplied));
  assert.ok(records.every(r => r.data.final >= 0));
});

test('teto zero zera integralmente o modelo individual', () => {
  const records = [{ data: { preCapFinal: 1200.55 } }, { data: { preCapFinal: 800.45 } }];
  const result = finance.applyIndividualTotalCap(records, 0);
  assert.equal(result.applied, true);
  assert.equal(result.after, 0);
  assert.deepEqual(records.map(r => r.data.final), [0, 0]);
});
