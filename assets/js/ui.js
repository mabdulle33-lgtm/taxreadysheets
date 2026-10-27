/*
 * TaxReadySheets — small DOM helpers shared by the calculator pages.
 * Nothing here talks to the network.
 */

const gbpFmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbpWhole = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0, minimumFractionDigits: 0 });

/** £1,234.56 — pass { whole: true } for £1,235. */
export function gbp(n, { whole = false } = {}) {
  const v = Number.isFinite(n) ? n : 0;
  return (whole ? gbpWhole : gbpFmt).format(Math.abs(v) < 0.005 ? 0 : v);
}

export function percent(fraction, digits = 1) {
  const v = Number.isFinite(fraction) ? fraction * 100 : 0;
  return v.toFixed(digits) + '%';
}

/** 2026-11-07 → "Sat 7 Nov 2026" */
export function niceDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = new Date(iso + 'T00:00:00Z');
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(d);
}

/**
 * Read every named field of a form into a plain object.
 * number inputs → raw string (calc.js cleans it, and can tell blank from 0)
 * checkboxes → true/false, radios → checked value, selects → value.
 */
export function readForm(form) {
  const values = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox') values[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) values[el.name] = el.value; }
    else values[el.name] = el.value;
  }
  return values;
}

/**
 * Wire a calculator form: recalculate on every keystroke/change and once on load.
 * update(values, form) should write the results.
 */
export function bindForm(formId, update) {
  const form = document.getElementById(formId);
  if (!form) return;
  const run = () => {
    try { update(readForm(form), form); } catch (err) { console.error(err); }
  };
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  run();
}

/** Set the text of every [data-out="key"] element. */
export function setOut(key, text) {
  document.querySelectorAll(`[data-out="${key}"]`).forEach((el) => { el.textContent = text; });
}

/** Set several outputs at once: setOuts({ incomeTax: '£1', total: '£2' }). */
export function setOuts(map) {
  Object.entries(map).forEach(([k, v]) => setOut(k, v));
}

/** Show or hide every [data-show="key"] element. */
export function show(key, visible) {
  document.querySelectorAll(`[data-show="${key}"]`).forEach((el) => { el.hidden = !visible; });
}

/** Escape text before putting it into innerHTML. */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
