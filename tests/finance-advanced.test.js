const test = require('node:test');
const assert = require('node:assert/strict');
const advanced = require('../js/finance-advanced.js');

test('stable fingerprint ignores object key order', () => {
  const a = advanced.fingerprint({ b: 2, a: { y: 4, x: 3 } });
  const b = advanced.fingerprint({ a: { x: 3, y: 4 }, b: 2 });
  assert.equal(a, b);
  assert.match(a, /^[0-9A-F]{8}$/);
});

test('rule fingerprint changes when financial parameters change', () => {
  const base = { ruleVersion: 'FR-2.39.0-1', settings: { belowDiscount: 200 }, financeMonthData: { customersStart: 100, canceledCount: 1 }, model: 'squad', individualCap: 7000 };
  const changed = { ...base, settings: { belowDiscount: 250 } };
  assert.notEqual(advanced.ruleFingerprint(base), advanced.ruleFingerprint(changed));
});

test('calculation explanation includes vacation only when applicable', () => {
  const base = {
    mode: 'squad', commissionAtt: 400, commissionNotes5: 200, cancelMultiplier: 2,
    afterCancel: 1200, afterVacationBase: 600, vacationBaseAdjustment: -600,
    manualBonus: 100, topAttBonus: 50, topNotes5Bonus: 50, salesCommission: 40,
    discount: 20, redistribution: 80, preCapFinal: 900, final: 900, vacation: true,
    eligibleAtt: 100, notes5Pct: .5, avgPerDay: 10, cancelRate: .01,
    ruleVersion: 'FR-2.39.0-1', ruleFingerprint: 'ABCDEF12'
  };
  const withVacation = advanced.buildCalculationExplanation(base, { technicianName: 'A' });
  const withoutVacation = advanced.buildCalculationExplanation({ ...base, vacation: false, afterVacationBase: 1200, vacationBaseAdjustment: 0, final: 1500 });
  assert.ok(withVacation.steps.some(step => step.id === 'vacation'));
  assert.equal(withoutVacation.steps.some(step => step.id === 'vacation'), false);
  assert.equal(withVacation.ruleVersion, 'FR-2.39.0-1');
  assert.equal(withVacation.ruleFingerprint, 'ABCDEF12');
});

test('explanation preserves extras after vacation base reduction', () => {
  const explanation = advanced.buildCalculationExplanation({
    mode: 'squad', commissionAtt: 750, commissionNotes5: 600, cancelMultiplier: 1.76,
    afterCancel: 2376, vacation: true, afterVacationBase: 1188, vacationBaseAdjustment: -1188,
    manualBonus: 100, topAttBonus: 100, topNotes5Bonus: 100, salesCommission: 50,
    discount: 0, redistribution: 200, preCapFinal: 1738, final: 1738,
    eligibleAtt: 200, notes5Pct: .5, avgPerDay: 10, cancelRate: .005
  });
  const vacation = explanation.steps.find(step => step.id === 'vacation');
  const bonus = explanation.steps.find(step => step.id === 'bonus');
  const sales = explanation.steps.find(step => step.id === 'sales');
  const redistribution = explanation.steps.find(step => step.id === 'redistribution');
  assert.equal(vacation.result, 1188);
  assert.equal(bonus.result, 1488);
  assert.equal(sales.result, 1538);
  assert.equal(redistribution.result, 1738);
  assert.equal(explanation.final, 1738);
});

test('calculation memory freezes rule metadata and technician values', () => {
  const memory = advanced.buildCalculationMemory({
    month: {
      id: '2026-10', year: 2026, month: 10, isClosed: true,
      financeRuleVersion: 'FR-2.39.0-1', financeRuleFingerprint: 'A1B2C3D4',
      financeModel: 'squad', financeIndividualCap: 7000,
      financeSettings: { belowDiscount: 200 }, financeMonthData: { customersStart: 100, canceledCount: 1 },
      financeComparison: { squadTotal: 1234.56, individualTotal: 1400 },
      technicians: [{ name: 'Tecnico A', att: 100, notes5: 40, financeManualBonus: 25, salesCommission: 30, vacation: true, financeData: { final: 500 } }]
    },
    squadCode: 'D', trigger: 'month_close', actor: { userId: 'u1', name: 'Admin' }, now: '2026-10-02T15:00:00.000Z'
  });
  assert.equal(memory.ruleVersion, 'FR-2.39.0-1');
  assert.equal(memory.ruleFingerprint, 'A1B2C3D4');
  assert.equal(memory.summary.total, 500);
  assert.equal(memory.summary.closed, true);
  assert.equal(memory.snapshot.technicians[0].finance.final, 500);
  assert.equal(memory.snapshot.technicians[0].vacation, true);
  assert.equal(memory.trigger, 'month_close');
});

test('memory delta detects total, rule and model changes', () => {
  const delta = advanced.memoryDelta(
    { summary: { total: 1000 }, ruleFingerprint: 'AAAA', officialModel: 'squad' },
    { summary: { total: 1125.5 }, ruleFingerprint: 'BBBB', officialModel: 'individual' }
  );
  assert.equal(delta.totalDifference, 125.5);
  assert.equal(delta.ruleChanged, true);
  assert.equal(delta.modelChanged, true);
});

test('simulation delta compares official and simulated values', () => {
  const delta = advanced.simulationDelta({ final: 1000, afterCancel: 800 }, { final: 1250, afterCancel: 950 });
  assert.equal(delta.difference, 250);
  assert.equal(delta.differencePct, .25);
  assert.equal(delta.actualBase, 800);
  assert.equal(delta.simulatedBase, 950);
});
