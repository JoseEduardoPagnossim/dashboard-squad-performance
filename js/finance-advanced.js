(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoftenFinanceAdvanced = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MEMORY_SCHEMA_VERSION = 1;

  const safe = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const clone = value => JSON.parse(JSON.stringify(value == null ? null : value));

  function stableNormalize(value) {
    if (Array.isArray(value)) return value.map(stableNormalize);
    if (value && typeof value === 'object') {
      const out = {};
      Object.keys(value).sort().forEach(key => { out[key] = stableNormalize(value[key]); });
      return out;
    }
    return value;
  }

  function stableStringify(value) {
    return JSON.stringify(stableNormalize(value));
  }

  function fingerprint(value) {
    const text = stableStringify(value);
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0').toUpperCase();
  }

  function ruleFingerprint({ ruleVersion = 'legacy', settings = {}, financeMonthData = {}, model = 'squad', individualCap = 0 } = {}) {
    return fingerprint({ ruleVersion, settings, financeMonthData, model, individualCap: safe(individualCap) });
  }

  function ruleDescriptor(input = {}) {
    const version = String(input.ruleVersion || 'legacy');
    return {
      version,
      fingerprint: ruleFingerprint({ ...input, ruleVersion: version })
    };
  }

  function buildCalculationExplanation(data = {}, context = {}) {
    const mode = data.mode || context.model || 'squad';
    const base = safe(data.commissionAtt) + safe(data.commissionNotes5);
    const cancelMultiplier = safe(data.cancelMultiplier || 1) || 1;
    const afterCancel = safe(data.afterCancel);
    const afterVacationBase = Number.isFinite(Number(data.afterVacationBase)) ? safe(data.afterVacationBase) : afterCancel;
    const prizes = safe(data.topAttBonus) + safe(data.topNotes5Bonus);
    const extrasBeforeAdjustments = safe(data.manualBonus) + prizes + safe(data.salesCommission);
    const afterExtras = afterVacationBase + extrasBeforeAdjustments;
    const afterDiscount = afterExtras - safe(data.discount);
    const afterRedistribution = afterDiscount + safe(data.redistribution);
    const beforeCap = Number.isFinite(Number(data.preCapFinal)) ? safe(data.preCapFinal) : afterRedistribution;
    const final = safe(data.final);
    const steps = [
      {
        id: 'attendance',
        label: 'Comissão por atendimento',
        formula: context.attendanceFormula || `Faixa atingida pela média de ${safe(data.avgPerDay).toFixed(2)} atend./dia`,
        value: safe(data.commissionAtt),
        result: safe(data.commissionAtt),
        tone: 'neutral'
      },
      {
        id: 'quality',
        label: 'Comissão por Notas 5',
        formula: context.qualityFormula || `Faixa atingida por ${(safe(data.notes5Pct) * 100).toFixed(2)}% de Notas 5 sobre ${safe(data.eligibleAtt)} atendimentos elegíveis`,
        value: safe(data.commissionNotes5),
        result: base,
        tone: 'neutral',
        note: `Comissão-base: ${safe(data.commissionAtt).toFixed(2)} + ${safe(data.commissionNotes5).toFixed(2)}`
      },
      {
        id: 'cancellation',
        label: 'Multiplicador de cancelamento',
        formula: `${base.toFixed(2)} × ${cancelMultiplier.toFixed(3)}`,
        value: cancelMultiplier,
        result: afterCancel,
        tone: cancelMultiplier >= 1 ? 'positive' : 'negative',
        note: `Taxa do mês: ${(safe(data.cancelRate) * 100).toFixed(2)}%`
      }
    ];

    if (data.vacation) {
      steps.push({
        id: 'vacation',
        label: 'Férias',
        formula: `${afterCancel.toFixed(2)} × 50%`,
        value: safe(data.vacationBaseAdjustment),
        result: afterVacationBase,
        tone: 'negative',
        note: 'O redutor incide somente sobre a comissão-base após cancelamento.'
      });
    }

    steps.push(
      {
        id: 'bonus',
        label: 'Bônus e prêmios',
        formula: `${safe(data.manualBonus).toFixed(2)} + ${safe(data.topAttBonus).toFixed(2)} + ${safe(data.topNotes5Bonus).toFixed(2)}`,
        value: safe(data.manualBonus) + prizes,
        result: afterVacationBase + safe(data.manualBonus) + prizes,
        tone: 'positive'
      },
      {
        id: 'sales',
        label: 'Comissão de vendas',
        formula: `+ ${safe(data.salesCommission).toFixed(2)}`,
        value: safe(data.salesCommission),
        result: afterExtras,
        tone: 'positive'
      },
      {
        id: 'discount',
        label: 'Desconto por desempenho',
        formula: `- ${safe(data.discount).toFixed(2)}`,
        value: -safe(data.discount),
        result: afterDiscount,
        tone: safe(data.discount) ? 'negative' : 'neutral',
        note: data.discountEligible === false
          ? ({ vacation: 'Férias: desconto ABAIXO isento.', manual: 'Exceção manual: desconto ABAIXO isento.', partial: 'Competência parcial: desconto ABAIXO isento.' }[String(data.discountWaiverReason || '')] || 'Desconto ABAIXO isento.')
          : String(data.financeStatus || '')
      },
      {
        id: 'redistribution',
        label: 'Redistribuição',
        formula: `+ ${safe(data.redistribution).toFixed(2)}`,
        value: safe(data.redistribution),
        result: afterRedistribution,
        tone: safe(data.redistribution) ? 'positive' : 'neutral'
      }
    );

    if (mode === 'individual' && safe(data.zeroFloorAdjustment) > 0) {
      steps.push({
        id: 'floor',
        label: 'Piso mínimo',
        formula: `Valor negativo ajustado para R$ 0,00`,
        value: safe(data.zeroFloorAdjustment),
        result: Math.max(0, beforeCap),
        tone: 'neutral'
      });
    }

    if (mode === 'individual') {
      steps.push({
        id: 'cap',
        label: 'Teto proporcional do modelo Individual',
        formula: data.capApplied ? `${beforeCap.toFixed(2)} × ${(safe(data.capFactor) * 100).toFixed(4)}%` : 'Teto não atingido',
        value: safe(data.capAdjustment),
        result: final,
        tone: data.capApplied ? 'negative' : 'neutral',
        note: data.capApplied ? 'Ajuste proporcional para respeitar o teto total do Squad.' : ''
      });
    }

    steps.push({
      id: 'final',
      label: 'Bonificação final',
      formula: 'Resultado oficial do cálculo',
      value: final,
      result: final,
      tone: 'final'
    });

    return {
      schemaVersion: MEMORY_SCHEMA_VERSION,
      ruleVersion: String(data.ruleVersion || context.ruleVersion || 'legacy'),
      ruleFingerprint: String(data.ruleFingerprint || context.ruleFingerprint || ''),
      model: mode,
      technicianName: String(context.technicianName || ''),
      final,
      steps
    };
  }

  function buildCalculationMemory({ month = {}, squadCode = '', trigger = 'manual', actor = {}, now = new Date().toISOString() } = {}) {
    const settings = clone(month.financeSettings || {});
    const financeMonthData = clone(month.financeMonthData || {});
    const model = month.financeModel || 'squad';
    const individualCap = safe(month.financeIndividualCap);
    const ruleVersion = String(month.financeRuleVersion || month.financeComparison?.ruleVersion || 'legacy');
    const ruleFingerprintValue = String(month.financeRuleFingerprint || month.financeComparison?.ruleFingerprint || ruleFingerprint({ ruleVersion, settings, financeMonthData, model, individualCap }));
    const technicians = (month.technicians || []).map(t => ({
      technicianName: t.name || '',
      attendance: safe(t.att),
      notes5: safe(t.notes5),
      evaluationExcludedAtt: safe(t.evaluationExcludedAtt),
      manualBonus: safe(t.financeManualBonus),
      salesCommission: safe(t.salesCommission),
      vacation: !!t.vacation,
      waiveBelowDiscount: !!t.waiveBelowDiscount,
      excludeFromGroupCount: !!t.excludeFromGroupCount,
      finance: clone(t.financeData || {})
    }));
    const total = technicians.reduce((sum, row) => sum + safe(row.finance?.final), 0);
    const entry = {
      schemaVersion: MEMORY_SCHEMA_VERSION,
      createdAt: now,
      trigger: String(trigger || 'manual'),
      squadCode: String(squadCode || ''),
      period: month.id || `${month.year || ''}-${String(month.month || '').padStart(2, '0')}`,
      year: safe(month.year),
      month: safe(month.month),
      officialModel: model,
      ruleVersion,
      ruleFingerprint: ruleFingerprintValue,
      actor: {
        userId: actor.userId || null,
        name: actor.name || actor.fullName || '',
        email: actor.email || ''
      },
      summary: {
        technicianCount: technicians.length,
        total: Number(total.toFixed(2)),
        squadTotal: Number(safe(month.financeComparison?.squadTotal).toFixed(2)),
        individualTotal: Number(safe(month.financeComparison?.individualTotal).toFixed(2)),
        individualCap: Number(individualCap.toFixed(2)),
        closed: !!month.isClosed
      },
      snapshot: {
        financeSettings: settings,
        financeMonthData,
        financeModel: model,
        financeCompare: month.financeCompare !== false,
        financeTechCompare: month.financeTechCompare === true,
        financeIndividualCap: individualCap,
        financeComparison: clone(month.financeComparison || {}),
        technicians
      }
    };
    entry.localId = `${entry.period}|${entry.trigger}|${entry.createdAt}|${entry.ruleFingerprint}`;
    return entry;
  }

  function memoryDelta(previous, current) {
    if (!previous || !current) return null;
    const prevTotal = safe(previous.summary?.total);
    const currentTotal = safe(current.summary?.total);
    return {
      totalBefore: prevTotal,
      totalAfter: currentTotal,
      totalDifference: Number((currentTotal - prevTotal).toFixed(2)),
      ruleChanged: String(previous.ruleFingerprint || '') !== String(current.ruleFingerprint || ''),
      modelChanged: String(previous.officialModel || '') !== String(current.officialModel || '')
    };
  }

  function simulationDelta(actual = {}, simulated = {}) {
    const actualFinal = safe(actual.final);
    const simulatedFinal = safe(simulated.final);
    return {
      actualFinal,
      simulatedFinal,
      difference: Number((simulatedFinal - actualFinal).toFixed(2)),
      differencePct: actualFinal ? (simulatedFinal - actualFinal) / Math.abs(actualFinal) : 0,
      actualBase: safe(actual.afterCancel),
      simulatedBase: safe(simulated.afterCancel)
    };
  }

  return {
    MEMORY_SCHEMA_VERSION,
    stableStringify,
    fingerprint,
    ruleFingerprint,
    ruleDescriptor,
    buildCalculationExplanation,
    buildCalculationMemory,
    memoryDelta,
    simulationDelta
  };
});
