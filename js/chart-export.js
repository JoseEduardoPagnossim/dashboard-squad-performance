(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoftenChartExport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const escapeXml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

  function fileSafeName(value, fallback = 'grafico-performance-hub') {
    const cleaned = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96);
    return cleaned || fallback;
  }

  function normalizeExportOptions(options) {
    const raw = options && typeof options === 'object' ? options : {};
    return {
      appearance: ['current', 'light', 'transparent', 'transparent-dark'].includes(raw.appearance) ? raw.appearance : 'current',
      layout: ['slide', 'chart'].includes(raw.layout) ? raw.layout : 'slide'
    };
  }

  function legendRows(items, maxPerRow = 4) {
    const rows = [];
    (items || []).forEach((item, index) => {
      const row = Math.floor(index / maxPerRow);
      if (!rows[row]) rows[row] = [];
      rows[row].push(item);
    });
    return rows;
  }

  function buildLegend(items, { x = 120, y = 920, width = 1680, textColor = '#f5f6f8' } = {}) {
    const list = (items || []).filter(item => item && item.label);
    if (!list.length) return '';
    const rows = legendRows(list, 4), colWidth = width / 4;
    return rows.map((row, rowIndex) => row.map((item, colIndex) => {
      const px = x + colIndex * colWidth, py = y + rowIndex * 34;
      return `<g transform="translate(${px} ${py})"><circle cx="8" cy="-5" r="7" fill="${escapeXml(item.color || '#9ea4ad')}"/><text x="24" y="0" fill="${escapeXml(textColor)}" font-size="22" font-weight="650">${escapeXml(item.label)}</text></g>`;
    }).join('')).join('');
  }

  function buildExportSvg(input) {
    const options = normalizeExportOptions(input?.options);
    const slide = options.layout === 'slide';
    const width = slide ? 1920 : 1600;
    const height = slide ? 1080 : 900;
    const palette = input?.palette || {};
    const transparentLight = options.appearance === 'transparent';
    const transparentDark = options.appearance === 'transparent-dark';
    const transparent = transparentLight || transparentDark;
    const light = options.appearance === 'light';
    const bg = transparent ? 'none' : light ? '#ffffff' : (palette.bg || '#080b12');
    const panel = transparent ? 'none' : light ? '#ffffff' : (palette.panel || '#11161f');
    // Export transparente precisa de uma cor de texto explícita, porque o PNG/SVG pode
    // ser inserido em um slide com fundo diferente do tema atual do dashboard.
    const text = transparentLight ? '#111827' : transparentDark ? '#f8fafc' : light ? '#111827' : (palette.text || '#f5f6f8');
    const muted = transparentLight ? '#475569' : transparentDark ? '#cbd5e1' : light ? '#64748b' : (palette.muted || '#9aa3b1');
    const grid = transparentLight ? 'rgba(15,23,42,.16)' : transparentDark ? 'rgba(255,255,255,.16)' : light ? 'rgba(15,23,42,.12)' : 'rgba(255,255,255,.09)';
    const labelHalo = transparentLight || light ? '#ffffff' : transparentDark ? '#07111f' : (panel !== 'none' ? panel : (palette.bg || '#080b12'));
    const accent = palette.accent || '#f0a33a', success = palette.success || '#36c98f', warn = palette.warn || '#f2c14e', danger = palette.danger || '#f26363';
    const chartX = slide ? 100 : 50, chartY = slide ? 205 : 55, chartW = slide ? 1720 : 1500, chartH = slide ? 640 : 700;
    const title = String(input?.title || 'Gráfico');
    const eyebrow = String(input?.eyebrow || 'PERFORMANCE HUB');
    const context = String(input?.context || '');
    const source = String(input?.source || 'Fonte: Performance Hub');
    const scaleNote = String(input?.scaleNote || '');
    let chartMarkup = String(input?.chartSvgMarkup || '').trim();
    chartMarkup = chartMarkup.replace(/<svg\b([^>]*)>/i, `<svg$1 x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}" style="--accent:${accent};--accent2:${palette.secondary || accent};--success:${success};--warn:${warn};--danger:${danger};--text:${text};--muted:${muted};--panel:${panel};--border:${grid};" preserveAspectRatio="xMidYMid meet">`);
    const header = slide ? `<text x="100" y="82" fill="${escapeXml(accent)}" font-size="20" font-weight="800" letter-spacing="2">${escapeXml(eyebrow.toUpperCase())}</text><text x="100" y="132" fill="${escapeXml(text)}" font-size="42" font-weight="800">${escapeXml(title)}</text><text x="100" y="170" fill="${escapeXml(muted)}" font-size="22">${escapeXml(context)}</text>` : '';
    const legend = buildLegend(input?.legend || [], { x: slide ? 110 : 70, y: slide ? 925 : 815, width: slide ? 1680 : 1460, textColor: text });
    const footer = slide ? `<text x="100" y="1030" fill="${escapeXml(muted)}" font-size="18">${escapeXml(source)}</text>${scaleNote ? `<text x="1820" y="1030" text-anchor="end" fill="${escapeXml(muted)}" font-size="18">${escapeXml(scaleNote)}</text>` : ''}` : '';
    const style = `<style>
      text{font-family:Inter,Arial,sans-serif}.grid-line{stroke:${grid};stroke-width:1}.axis-label,.axis-label-right,.history-x-label{fill:${muted};font-size:14px;font-weight:650}.chart-data-label{font-size:15px;font-weight:850;paint-order:stroke fill;stroke:${labelHalo};stroke-width:4px;stroke-linejoin:round}.chart-data-label.compact{font-size:14px;stroke-width:3.4px}.squad-trend-bar-label{fill:${text}}.squad-trend-pct-label{font-size:15px}.chart-series-area{opacity:.8}.chart-point{stroke:${panel === 'none' ? 'transparent' : panel};stroke-width:3}.chart-ruler,.chart-hover-zone{opacity:0}.quality-axis-title,.history-axis-title{fill:${muted};font-size:14px;font-weight:650}
    </style>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${style}${transparent ? '' : `<rect width="100%" height="100%" rx="${slide ? 0 : 30}" fill="${escapeXml(bg)}"/>`}${slide && panel !== 'none' ? `<rect x="70" y="190" width="1780" height="710" rx="30" fill="${escapeXml(panel)}" stroke="${escapeXml(grid)}"/>` : ''}${header}${chartMarkup}${legend}${footer}</svg>`;
  }

  return { escapeXml, fileSafeName, normalizeExportOptions, buildExportSvg };
});
