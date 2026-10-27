/*
 * TaxReadySheets — "where the money goes" donut chart, drawn with plain SVG.
 * chartSegments() is pure (tested in Node); renderChart() writes the DOM.
 */

/**
 * Turn [{ label, value }] into donut segments. Blank, negative and zero parts
 * are dropped; fractions add up to 1.
 */
export function chartSegments(parts) {
  const clean = (parts || [])
    .map((p, i) => ({ label: String(p.label), value: Number.isFinite(p.value) && p.value > 0 ? p.value : 0, tone: p.tone || i + 1 }))
    .filter((p) => p.value > 0);
  const total = clean.reduce((s, p) => s + p.value, 0);
  let start = 0;
  const segments = clean.map((p) => {
    const fraction = total > 0 ? p.value / total : 0;
    const seg = { ...p, fraction, start, end: start + fraction };
    start += fraction;
    return seg;
  });
  return { total, segments };
}

/** Whole-number percentages that still add up to 100 (largest remainder). */
export function roundedPercents(fractions) {
  const raw = fractions.map((f) => f * 100);
  const floors = raw.map(Math.floor);
  let left = Math.round(raw.reduce((s, v) => s + v, 0)) - floors.reduce((s, v) => s + v, 0);
  raw.map((v, i) => ({ i, r: v - floors[i] })).sort((a, b) => b.r - a.r).forEach(({ i }) => {
    if (left > 0) { floors[i] += 1; left -= 1; }
  });
  return floors;
}

const R = 15.9155; // circumference of 100 makes the dash maths read as percentages

/**
 * Draw (or redraw) a donut and legend into a container.
 * @param {Element} el     the [data-chart] element
 * @param {Array<{label:string,value:number,tone?:number}>} parts
 * @param {object} opts    { format(n) → text, centre: { label, value } }
 */
export function renderChart(el, parts, { format = (n) => String(n), centre } = {}) {
  if (!el) return;
  const { total, segments } = chartSegments(parts);
  const card = el.closest('.chart-card') || el;
  card.hidden = segments.length === 0;
  if (!segments.length) return;
  const pcts = roundedPercents(segments.map((s) => s.fraction));
  const gap = segments.length > 1 ? 0.6 : 0;
  const rings = segments.map((s) => {
    const len = Math.max(0, s.fraction * 100 - gap);
    return `<circle class="tone-${s.tone}" cx="21" cy="21" r="${R}" fill="none" stroke-width="5.2" stroke-dasharray="${len.toFixed(3)} ${(100 - len).toFixed(3)}" stroke-dashoffset="${(25 - s.start * 100).toFixed(3)}"/>`;
  }).join('');
  const mid = centre
    ? `<text x="21" y="20.2" class="donut-value">${escapeXml(centre.value)}</text><text x="21" y="25.4" class="donut-label">${escapeXml(centre.label)}</text>`
    : '';
  el.innerHTML =
    `<svg class="donut" viewBox="0 0 42 42" aria-hidden="true" focusable="false"><circle class="donut-track" cx="21" cy="21" r="${R}" fill="none" stroke-width="5.2"/>${rings}${mid}</svg>` +
    `<ul class="legend">${segments.map((s, i) => `<li><span class="swatch tone-${s.tone}" aria-hidden="true"></span><span class="legend-label">${escapeXml(s.label)}</span><span class="legend-value">${escapeXml(format(s.value))} <span class="legend-pct">${pcts[i]}%</span></span></li>`).join('')}</ul>`;
  el.setAttribute('data-total', String(total));
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
