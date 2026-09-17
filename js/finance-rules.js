(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoftenFinanceRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const safe = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const clone = value => JSON.parse(JSON.stringify(value));

  const DEFAULT_FINANCE_SETTINGS = {
    attendanceTiers: [
      { min: 50, amount: 750 }, { min: 40, amount: 637.50 }, { min: 32, amount: 541.88 }, { min: 25.6, amount: 460.59 }, { min: 20.5, amount: 391.50 },
      { min: 16.4, amount: 332.78 }, { min: 13.1, amount: 282.86 }, { min: 10.5, amount: 240.43 }, { min: 8.4, amount: 204.37 }, { min: 6.7, amount: 0 }
    ],
    notes5Tiers: [
      { min: 1, amount: 750 }, { min: .70, amount: 600 }, { min: .49, amount: 480 }, { min: .343, amount: 384 }, { min: .24, amount: 307.20 },
      { min: .168, amount: 245.76 }, { min: .118, amount: 196.61 }, { min: .083, amount: 0 }, { min: .058, amount: 0 }, { min: .04, amount: 0 }
    ],
    cancelTiers: [
      { max: .004, mult: 2 }, { max: .008, mult: 1.760 }, { max: .012, mult: 1.549 }, { max: .016, mult: 1.363 }, { max: .020, mult: 1.199 },
      { max: .024, mult: 1.055 }, { max: .028, mult: 0 }, { max: .032, mult: 0 }, { max: .036, mult: 0 }, { max: .040, mult: 0 }
    ],
    topAttendancePrize: 100,
    topNotes5Prize: 100,
    belowDiscount: 200
  };

  function resolveFinanceSettings(current = {}) {
    const source = current && typeof current === 'object' ? current : {};
    return {
      attendanceTiers: Array.isArray(source.attendanceTiers) && source.attendanceTiers.length ? clone(source.attendanceTiers) : clone(DEFAULT_FINANCE_SETTINGS.attendanceTiers),
      notes5Tiers: Array.isArray(source.notes5Tiers) && source.notes5Tiers.length ? clone(source.notes5Tiers) : clone(DEFAULT_FINANCE_SETTINGS.notes5Tiers),
      cancelTiers: Array.isArray(source.cancelTiers) && source.cancelTiers.length ? clone(source.cancelTiers) : clone(DEFAULT_FINANCE_SETTINGS.cancelTiers),
      topAttendancePrize: Number.isFinite(Number(source.topAttendancePrize)) ? safe(source.topAttendancePrize) : DEFAULT_FINANCE_SETTINGS.topAttendancePrize,
      topNotes5Prize: Number.isFinite(Number(source.topNotes5Prize)) ? safe(source.topNotes5Prize) : DEFAULT_FINANCE_SETTINGS.topNotes5Prize,
      belowDiscount: Number.isFinite(Number(source.belowDiscount)) ? safe(source.belowDiscount) : DEFAULT_FINANCE_SETTINGS.belowDiscount
    };
  }

  function financeFloorTier(value, tiers) {
    const sorted = [...(tiers || [])].sort((a, b) => safe(b.min) - safe(a.min));
    return sorted.find(tier => safe(value) >= safe(tier.min)) || sorted[sorted.length - 1] || { min: 0, amount: 0 };
  }

  function financeCancelTier(rate, tiers) {
    const sorted = [...(tiers || [])].sort((a, b) => safe(a.max) - safe(b.max));
    return sorted.find(tier => safe(rate) <= safe(tier.max)) || sorted[sorted.length - 1] || { max: 0, mult: 0 };
  }

  function cancellationSummary(customersStart, canceledCount, tiers) {
    const customers = safe(customersStart);
    const canceled = safe(canceledCount);
    const rate = customers > 0 ? canceled / customers : 0;
    const tier = financeCancelTier(rate, tiers);
    const rawMultiplier = customers > 0 ? safe(tier.mult) : 0;
    // Regra atual do painel: faixas configuradas com multiplicador 0 não zeram a
    // bonificação; são tratadas como multiplicador neutro 1.
    const effectiveMultiplier = customers > 0 ? (rawMultiplier === 0 ? 1 : rawMultiplier) : 1;
    return { customers, canceled, rate, tier, rawMultiplier, effectiveMultiplier };
  }

  function financePerformanceStatus(metrics, refs) {
    if (safe(metrics?.att) <= 0) return '';
    const hits = [
      safe(metrics.att) >= safe(refs?.refAtt),
      safe(metrics.totalEval) >= safe(refs?.refTotalEval),
      safe(metrics.avg) >= safe(refs?.refAvg),
      safe(metrics.evalPct) >= safe(refs?.refEvalPct)
    ].filter(Boolean).length;
    return hits >= 2 ? 'ACIMA' : 'ABAIXO';
  }

  function splitPrize(totalPrize, winnerCount) {
    const count = Math.max(0, Math.trunc(safe(winnerCount)));
    return count ? safe(totalPrize) / count : 0;
  }

  function topPrizeAllocation(records, metric, totalPrize) {
    const rows = Array.isArray(records) ? records : [];
    const read = typeof metric === 'function' ? metric : row => row?.[metric];
    const max = rows.length ? Math.max(...rows.map(row => safe(read(row)))) : 0;
    const winners = max > 0 ? rows.filter(row => safe(read(row)) === max) : [];
    return { max, winners, amountEach: splitPrize(totalPrize, winners.length) };
  }

  function groupFinanceBase({ totalAtt, totalN5, countedCount, days, eligibleAtt, evaluationExcludedAtt, effectiveMultiplier, attendanceTiers, notes5Tiers }) {
    const divisorCount = Math.max(0, Math.trunc(safe(countedCount)));
    const dayCount = Math.max(1, safe(days));
    const eligible = Math.max(0, safe(eligibleAtt));
    const avgPerDay = divisorCount ? safe(totalAtt) / (dayCount * divisorCount) : 0;
    const notes5Pct = eligible ? safe(totalN5) / eligible : 0;
    const attendanceTier = financeFloorTier(avgPerDay, attendanceTiers);
    const notes5Tier = financeFloorTier(notes5Pct, notes5Tiers);
    const commissionAtt = safe(attendanceTier.amount);
    const commissionNotes5 = safe(notes5Tier.amount);
    const afterCancel = (commissionAtt + commissionNotes5) * safe(effectiveMultiplier);
    return {
      avgPerDay,
      notes5Pct,
      eligibleAtt: eligible,
      evaluationExcludedAtt: Math.max(0, safe(evaluationExcludedAtt)),
      attendanceTier,
      notes5Tier,
      commissionAtt,
      commissionNotes5,
      afterCancel
    };
  }

  function financialAdjustmentSummary(entries, belowDiscount) {
    const list = (entries || [])
      .filter(entry => !(entry && typeof entry === 'object') || entry.eligible !== false)
      .map(entry => String(entry && typeof entry === 'object' ? entry.status : entry || '').toUpperCase());
    const belowCount = list.filter(status => status === 'ABAIXO').length;
    const aboveCount = list.filter(status => status === 'ACIMA').length;
    const pool = belowCount * safe(belowDiscount);
    const redistributionEach = aboveCount ? pool / aboveCount : 0;
    return { belowCount, aboveCount, pool, redistributionEach };
  }

  function buildFinanceModelData({ mode, hasProduction, days, avgPerDay, notes5Pct, eligibleAtt, evaluationExcludedAtt, commissionAtt, commissionNotes5, cancelRate, cancelTier, rawMult, effectiveMult, financeStatus, financialAdjustmentEligible, topAttBonus, topNotes5Bonus, manualBonus, sales, discount, redistributed, vacation, pool }) {
    const base = hasProduction ? safe(commissionAtt) + safe(commissionNotes5) : 0;
    const afterCancel = hasProduction ? base * safe(effectiveMult) : 0;
    const rawBeforeVacation = hasProduction ? afterCancel + safe(manualBonus) + safe(topAttBonus) + safe(topNotes5Bonus) + safe(sales) - safe(discount) + safe(redistributed) : 0;
    const beforeVacation = mode === 'individual' ? Math.max(0, rawBeforeVacation) : rawBeforeVacation;
    const zeroFloorAdjustment = mode === 'individual' && rawBeforeVacation < 0 ? -rawBeforeVacation : 0;
    const preCapFinal = vacation ? beforeVacation * .5 : beforeVacation;
    return {
      mode,
      hasProduction: !!hasProduction,
      days: safe(days),
      avgPerDay: safe(avgPerDay),
      notes5Pct: safe(notes5Pct),
      eligibleAtt: safe(eligibleAtt),
      evaluationExcludedAtt: safe(evaluationExcludedAtt),
      attendanceTier: null,
      notes5Tier: null,
      commissionAtt: safe(commissionAtt),
      commissionNotes5: safe(commissionNotes5),
      base,
      cancelRate: safe(cancelRate),
      cancelTier: safe(cancelTier?.max),
      cancelRawMultiplier: safe(rawMult),
      cancelMultiplier: safe(effectiveMult),
      afterCancel,
      financeStatus: financeStatus || '',
      financialAdjustmentEligible: financialAdjustmentEligible !== false,
      topAttBonus: safe(topAttBonus),
      topNotes5Bonus: safe(topNotes5Bonus),
      manualBonus: safe(manualBonus),
      salesCommission: safe(sales),
      discount: safe(discount),
      redistribution: safe(redistributed),
      rawBeforeVacation,
      beforeVacation,
      zeroFloorAdjustment,
      vacation: !!vacation,
      vacationFactor: vacation ? .5 : 1,
      preCapFinal: Number(preCapFinal.toFixed(2)),
      capAdjustment: 0,
      capFactor: 1,
      capApplied: false,
      final: Number(preCapFinal.toFixed(2)),
      pool: Number(safe(pool).toFixed(2))
    };
  }

  function applyIndividualTotalCap(records, cap) {
    const limit = Math.max(0, Number.isFinite(Number(cap)) ? safe(cap) : 7000);
    const before = (records || []).reduce((sum, record) => sum + Math.max(0, safe(record?.data?.preCapFinal)), 0);
    if (before <= limit || before <= 0) {
      (records || []).forEach(record => {
        record.data.capFactor = 1;
        record.data.capApplied = false;
        record.data.capAdjustment = 0;
        record.data.final = Number(safe(record.data.preCapFinal).toFixed(2));
      });
      return { before: Number(before.toFixed(2)), after: Number(before.toFixed(2)), cap: limit, factor: 1, applied: false, adjustment: 0 };
    }

    const factor = limit / before;
    const targetCents = Math.round(limit * 100);
    const parts = (records || []).map((record, index) => {
      const raw = Math.max(0, safe(record.data.preCapFinal)) * factor * 100;
      const base = Math.floor(raw + 1e-9);
      return { index, record, raw, base, frac: raw - base };
    });
    const used = parts.reduce((sum, part) => sum + part.base, 0);
    const remainder = Math.max(0, targetCents - used);

    parts.sort((a, b) => b.frac - a.frac || safe(b.record.data.preCapFinal) - safe(a.record.data.preCapFinal) || a.index - b.index);
    for (let index = 0; index < remainder && parts.length; index += 1) parts[index % parts.length].base += 1;

    parts.forEach(part => {
      const final = part.base / 100;
      const data = part.record.data;
      data.capFactor = factor;
      data.capApplied = true;
      data.final = final;
      data.capAdjustment = Number((final - safe(data.preCapFinal)).toFixed(2));
    });

    const after = (records || []).reduce((sum, record) => sum + safe(record.data.final), 0);
    return {
      before: Number(before.toFixed(2)),
      after: Number(after.toFixed(2)),
      cap: limit,
      factor,
      applied: true,
      adjustment: Number((after - before).toFixed(2))
    };
  }

  return {
    DEFAULT_FINANCE_SETTINGS,
    resolveFinanceSettings,
    financeFloorTier,
    financeCancelTier,
    cancellationSummary,
    financePerformanceStatus,
    splitPrize,
    topPrizeAllocation,
    groupFinanceBase,
    financialAdjustmentSummary,
    buildFinanceModelData,
    applyIndividualTotalCap
  };
});
