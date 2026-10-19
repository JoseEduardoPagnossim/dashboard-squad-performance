(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoftenChartEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_SQUAD_COLORS = Object.freeze({
    A: '#f0a33a',
    B: '#36c98f',
    D: '#46a4ff',
    E: '#d879ff'
  });

  const VISUAL_PRESETS = Object.freeze({
    executive: Object.freeze({
      labelDensity: 'extremes', labelFontSize: 10, axisFontSize: 11, legendFontSize: 10,
      chartHeight: 340, cardPadding: 22, yScaleMode: 'focus', yMin: 0, yMax: 100,
      lineWidth: 3, pointRadius: 4
    }),
    analytical: Object.freeze({
      labelDensity: 'all', labelFontSize: 10, axisFontSize: 11, legendFontSize: 10,
      chartHeight: 370, cardPadding: 22, yScaleMode: 'focus', yMin: 0, yMax: 100,
      lineWidth: 3, pointRadius: 4
    }),
    presentation: Object.freeze({
      labelDensity: 'extremes', labelFontSize: 12, axisFontSize: 13, legendFontSize: 12,
      chartHeight: 420, cardPadding: 24, yScaleMode: 'focus', yMin: 0, yMax: 100,
      lineWidth: 4, pointRadius: 5
    })
  });

  const DEFAULT_PREFERENCES = Object.freeze({
    visualPreset: 'executive',
    ...VISUAL_PRESETS.executive,
    squadColors: DEFAULT_SQUAD_COLORS
  });

  const safe = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, safe(value)));
  const numberOrDefault = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const normalizeHexColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '').trim()) ? String(value).trim().toLowerCase() : fallback;

  function normalizeSquadColors(colors) {
    const raw = colors && typeof colors === 'object' ? colors : {};
    return Object.fromEntries(Object.entries(DEFAULT_SQUAD_COLORS).map(([code, fallback]) => [code, normalizeHexColor(raw[code], fallback)]));
  }

  function presetPreferences(name = 'executive', current = {}) {
    const key = Object.prototype.hasOwnProperty.call(VISUAL_PRESETS, name) ? name : 'executive';
    return normalizePreferences({ ...current, ...VISUAL_PRESETS[key], visualPreset: key });
  }

  function normalizePreferences(prefs) {
    const raw = prefs && typeof prefs === 'object' ? prefs : {};
    const validPreset = ['executive', 'analytical', 'presentation', 'custom'].includes(raw.visualPreset);
    const legacyVisualKeys = ['labelDensity','labelFontSize','axisFontSize','legendFontSize','chartHeight','cardPadding','yScaleMode','yMin','yMax','lineWidth','pointRadius'];
    const hasLegacyVisualPrefs = legacyVisualKeys.some(key => Object.prototype.hasOwnProperty.call(raw, key));
    const visualPreset = validPreset ? raw.visualPreset : (hasLegacyVisualPrefs ? 'custom' : DEFAULT_PREFERENCES.visualPreset);
    const base = visualPreset !== 'custom' && VISUAL_PRESETS[visualPreset] ? VISUAL_PRESETS[visualPreset] : DEFAULT_PREFERENCES;
    const labelDensity = ['all', 'alternate', 'every3', 'extremes', 'none'].includes(raw.labelDensity) ? raw.labelDensity : base.labelDensity;
    const requestedScale = raw.yScaleMode === 'auto' ? 'focus' : raw.yScaleMode;
    const yScaleMode = ['focus', 'full', 'manual'].includes(requestedScale) ? requestedScale : base.yScaleMode;
    const yMin = clamp(numberOrDefault(raw.yMin, base.yMin), 0, 99);
    const requestedYMax = numberOrDefault(raw.yMax, base.yMax);
    const yMax = clamp(Math.max(requestedYMax, yMin + 1), 1, 100);
    return {
      visualPreset,
      labelDensity,
      labelFontSize: clamp(numberOrDefault(raw.labelFontSize, base.labelFontSize), 8, 18),
      axisFontSize: clamp(numberOrDefault(raw.axisFontSize, base.axisFontSize), 9, 16),
      legendFontSize: clamp(numberOrDefault(raw.legendFontSize, base.legendFontSize), 9, 16),
      chartHeight: clamp(numberOrDefault(raw.chartHeight, base.chartHeight), 260, 520),
      cardPadding: clamp(numberOrDefault(raw.cardPadding, base.cardPadding), 16, 34),
      yScaleMode,
      yMin,
      yMax,
      lineWidth: clamp(numberOrDefault(raw.lineWidth, base.lineWidth), 2, 6),
      pointRadius: clamp(numberOrDefault(raw.pointRadius, base.pointRadius), 2, 8),
      squadColors: normalizeSquadColors(raw.squadColors || DEFAULT_SQUAD_COLORS)
    };
  }

  function labelVisible(index, total, prefs) {
    const mode = normalizePreferences(prefs).labelDensity;
    const i = Math.max(0, Math.trunc(safe(index)));
    const count = Math.max(0, Math.trunc(safe(total)));
    if (mode === 'none') return false;
    if (count <= 2) return true;
    if (mode === 'alternate') return i === 0 || i === count - 1 || i % 2 === 0;
    if (mode === 'every3') return i === 0 || i === count - 1 || i % 3 === 0;
    if (mode === 'extremes') return i === 0 || i === count - 1;
    return true;
  }

  function configuredHeight(baseHeight, prefs) {
    const cfg = normalizePreferences(prefs);
    return Math.max(220, (safe(baseHeight) || 340) + (cfg.chartHeight - 340));
  }

  function percentScale(rawTop, explicitMax, prefs) {
    const cfg = normalizePreferences(prefs);
    if (cfg.yScaleMode === 'manual') return { min: cfg.yMin, max: Math.max(cfg.yMax, cfg.yMin + 1) };
    if (cfg.yScaleMode === 'full') return { min: 0, max: Math.max(1, explicitMax != null ? safe(explicitMax) : 100) };
    const autoMax = explicitMax != null ? safe(explicitMax) : Math.max(10, Math.ceil(Math.max(1, safe(rawTop)) / 10) * 10);
    return { min: 0, max: Math.max(1, autoMax) };
  }

  function percentScaleForValues(values, explicitMax, prefs) {
    const cfg = normalizePreferences(prefs);
    if (cfg.yScaleMode === 'manual') return { min: cfg.yMin, max: Math.max(cfg.yMax, cfg.yMin + 1), focused: cfg.yMin > 0 };
    if (cfg.yScaleMode === 'full') return { min: 0, max: Math.max(1, explicitMax != null ? safe(explicitMax) : 100), focused: false };
    const nums = (values || []).map(Number).filter(Number.isFinite).map(v => clamp(v, 0, 100));
    if (!nums.length) return { min: 0, max: Math.max(1, explicitMax != null ? safe(explicitMax) : 100), focused: false };
    let low = Math.min(...nums), high = Math.max(...nums);
    const spread = high - low;
    const padding = Math.max(2.5, spread * .25, spread < 1 ? 5 : 0);
    let min = Math.max(0, Math.floor((low - padding) / 5) * 5);
    let max = Math.min(100, Math.ceil((high + padding) / 5) * 5);
    if (max - min < 15) {
      const center = (low + high) / 2;
      min = Math.max(0, Math.floor((center - 7.5) / 5) * 5);
      max = Math.min(100, Math.ceil((center + 7.5) / 5) * 5);
    }
    if (max <= min) max = Math.min(100, min + 10);
    return { min, max, focused: min > 0 || max < 100 };
  }

  function squadColor(code, prefs, fallback = '#9ea4ad') {
    const cfg = normalizePreferences(prefs);
    return cfg.squadColors?.[String(code || '').toUpperCase()] || fallback;
  }

  function lineVisual(prefs, { emphasis = false, dashed = false } = {}) {
    const cfg = normalizePreferences(prefs);
    return {
      lineWidth: Math.max(1.8, cfg.lineWidth + (emphasis ? .25 : 0) - (dashed ? .3 : 0)),
      pointRadius: Math.max(2, cfg.pointRadius + (emphasis ? .3 : 0))
    };
  }

  function applyCssVariables(rootStyle, prefs) {
    const cfg = normalizePreferences(prefs);
    if (!rootStyle || typeof rootStyle.setProperty !== 'function') return cfg;
    const delta = cfg.chartHeight - 340;
    rootStyle.setProperty('--chart-card-padding', `${cfg.cardPadding}px`);
    rootStyle.setProperty('--chart-label-font-size', `${cfg.labelFontSize}px`);
    rootStyle.setProperty('--chart-label-font-size-compact', `${Math.max(8, cfg.labelFontSize - 1)}px`);
    rootStyle.setProperty('--chart-axis-font-size', `${cfg.axisFontSize}px`);
    rootStyle.setProperty('--chart-legend-font-size', `${cfg.legendFontSize}px`);
    rootStyle.setProperty('--chart-height-base', `${cfg.chartHeight}px`);
    rootStyle.setProperty('--chart-height-sm', `${Math.max(220, 250 + delta)}px`);
    rootStyle.setProperty('--chart-height-lg', `${Math.max(240, 290 + delta)}px`);
    rootStyle.setProperty('--chart-height-history', `${Math.max(260, 330 + delta)}px`);
    rootStyle.setProperty('--chart-height-business', `${Math.max(280, 360 + delta)}px`);
    return cfg;
  }

  let renderId = 0;
  function nextRenderId(prefix = 'chart') {
    renderId += 1;
    return `${String(prefix || 'chart').replace(/[^a-z0-9_-]/gi, '')}-${renderId}`;
  }

  function splitPointSegments(values, xFn, yFn) {
    const segments = [];
    let current = [];
    (values || []).forEach((value, index) => {
      if (value == null || Number.isNaN(Number(value))) {
        if (current.length) segments.push(current);
        current = [];
        return;
      }
      current.push({ x: xFn(index), y: yFn(value), value, index });
    });
    if (current.length) segments.push(current);
    return segments;
  }

  function smoothSvgPath(points) {
    if (!points?.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  function smoothAreaPath(points, baseline) {
    if (!points?.length) return '';
    const line = smoothSvgPath(points);
    return `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  }

  function seriesGradient(id, color, startOpacity = .2) {
    const safeId = String(id || 'chart-gradient').replace(/[^a-z0-9_-]/gi, '');
    return `<linearGradient id="${safeId}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="${startOpacity}"/><stop offset="58%" stop-color="${color}" stop-opacity="${startOpacity*.28}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient>`;
  }

  function inlineLabel(value, { percent = false, decimals = 0, formatter = null } = {}) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    if (typeof formatter === 'function') return formatter(value);
    const n = safe(value);
    if (percent) return `${n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function valueText(value, { percent = false, decimals = 0, suffix = '' } = {}) {
    const n = safe(value);
    if (percent) return `${n.toLocaleString('pt-BR', { minimumFractionDigits: decimals ? 1 : 0, maximumFractionDigits: Math.max(1, decimals || 1) })}%`;
    return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: decimals })}${suffix || ''}`;
  }

  function dataLabelSvg(x, y, text, { color = 'var(--text)', anchor = 'middle', dy = 0, compact = false } = {}) {
    if (text == null || text === '') return '';
    return `<text x="${x}" y="${y}" dy="${dy}" text-anchor="${anchor}" class="chart-data-label${compact ? ' compact' : ''}" fill="${color}">${escapeHtml(String(text))}</text>`;
  }


  function ensureTooltip(el) {
    if (!el) return null;
    let tip = el.querySelector('.chart-hover-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'chart-hover-tooltip';
      tip.setAttribute('role', 'tooltip');
      tip.setAttribute('aria-hidden', 'true');
      el.appendChild(tip);
    }
    return tip;
  }

  function positionTooltip(el, tip, event) {
    const r = el.getBoundingClientRect();
    const gap = 18, px = event.clientX - r.left, py = event.clientY - r.top;
    const tw = tip.offsetWidth || 300, th = tip.offsetHeight || 120;
    let x = px + gap, y = py + gap;
    if (x + tw > r.width - 10) x = px - tw - gap;
    if (y + th > r.height - 10) y = py - th - gap;
    tip.style.left = Math.max(10, Math.min(x, Math.max(10, r.width - tw - 10))) + 'px';
    tip.style.top = Math.max(10, Math.min(y, Math.max(10, r.height - th - 10))) + 'px';
  }

  function sharedTooltipHtml(label, entries) {
    const valid = (entries || []).filter(x => x && x.value != null && !Number.isNaN(Number(x.value)))
      .sort((a, b) => safe(b.value) - safe(a.value) || String(a.name).localeCompare(String(b.name), 'pt-BR'));
    const dense = valid.length > 10 ? ' dense' : '';
    return `<div class="chart-tooltip-head"><strong>${escapeHtml(label || '')}</strong><span>${valid.length} ${valid.length === 1 ? 'série' : 'séries'}</span></div><div class="chart-tooltip-list${dense}">${valid.map((x, i) => `<div class="chart-tooltip-row${i === 0 && valid.length > 1 ? ' leader' : ''}"><i style="background:${x.color || 'var(--accent)'}"></i><span>${escapeHtml(x.name)}</span><strong>${escapeHtml(x.text)}</strong></div>`).join('')}</div>`;
  }

  function setRulerState(el, index, show = true) {
    el.querySelectorAll('[data-ruler-index]').forEach(node => node.classList.toggle('is-active', show && Number(node.dataset.rulerIndex) === Number(index)));
    el.querySelectorAll('[data-point-index]').forEach(node => node.classList.toggle('is-active', show && Number(node.dataset.pointIndex) === Number(index)));
  }

  function focusSeries(el, index = null, locked = false) {
    const has = index != null && index !== '';
    el.classList.toggle('has-series-focus', has);
    el.dataset.lockedSeries = locked && has ? String(index) : '';
    el.querySelectorAll('[data-series-index]').forEach(node => {
      const same = has && String(node.dataset.seriesIndex) === String(index);
      node.classList.toggle('is-focused', same);
      node.classList.toggle('is-muted', has && !same);
      if (node.classList.contains('chart-legend-item')) node.setAttribute('aria-pressed', same && locked ? 'true' : 'false');
    });
  }

  function bindInteractiveLegend(el) {
    if (!el) return;
    [...el.querySelectorAll('.chart-legend-item[data-series-index]')].forEach(item => {
      const idx = item.dataset.seriesIndex;
      item.addEventListener('pointerenter', () => { if (!el.dataset.lockedSeries) focusSeries(el, idx, false); });
      item.addEventListener('pointerleave', () => { if (!el.dataset.lockedSeries) focusSeries(el, null, false); });
      item.addEventListener('click', () => { const locked = el.dataset.lockedSeries === String(idx); focusSeries(el, locked ? null : idx, !locked); });
      item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.click(); } });
    });
  }

  function bindSharedTooltip(el, model) {
    if (!el) return;
    const tip = ensureTooltip(el), zones = [...el.querySelectorAll('[data-chart-index]')];
    const show = (node, event) => {
      const index = Number(node.dataset.chartIndex), label = model.labels?.[index] || '';
      const entries = (model.entriesForIndex?.(index) || []).filter(Boolean);
      tip.innerHTML = sharedTooltipHtml(label, entries);
      tip.classList.add('show', 'shared');
      tip.setAttribute('aria-hidden', 'false');
      setRulerState(el, index, true);
      positionTooltip(el, tip, event);
    };
    zones.forEach(node => {
      node.addEventListener('pointerenter', event => show(node, event));
      node.addEventListener('pointermove', event => show(node, event));
      node.addEventListener('pointerleave', () => { tip.classList.remove('show', 'shared'); tip.setAttribute('aria-hidden', 'true'); setRulerState(el, -1, false); });
    });
    bindInteractiveLegend(el);
  }

  function bindTooltips(el) {
    if (!el) return;
    const tip = ensureTooltip(el), targets = [...el.querySelectorAll('[data-chart-tip]')];
    targets.forEach(node => {
      node.addEventListener('pointerenter', event => { tip.textContent = node.dataset.chartTip || ''; tip.classList.add('show'); tip.setAttribute('aria-hidden', 'false'); positionTooltip(el, tip, event); });
      node.addEventListener('pointermove', event => positionTooltip(el, tip, event));
      node.addEventListener('pointerleave', () => { tip.classList.remove('show'); tip.setAttribute('aria-hidden', 'true'); });
    });
  }

  return {
    DEFAULT_SQUAD_COLORS,
    VISUAL_PRESETS,
    DEFAULT_PREFERENCES,
    normalizePreferences,
    normalizeSquadColors,
    presetPreferences,
    labelVisible,
    configuredHeight,
    percentScale,
    percentScaleForValues,
    squadColor,
    lineVisual,
    applyCssVariables,
    nextRenderId,
    splitPointSegments,
    smoothSvgPath,
    smoothAreaPath,
    seriesGradient,
    inlineLabel,
    valueText,
    dataLabelSvg,
    sharedTooltipHtml,
    bindSharedTooltip,
    bindTooltips,
    bindInteractiveLegend,
    focusSeries,
    setRulerState
  };
});
