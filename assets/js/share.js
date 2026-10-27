/*
 * TaxReadySheets — turn a calculator's inputs into a link and back.
 * Pure functions (no DOM) so the Node tests can check them.
 *
 * The figures only go into the address when someone presses "Share link";
 * nothing is stored and nothing is sent anywhere by this file.
 */

const NUMBER_LIKE = /^-?\d{0,12}(?:\.\d{0,4})?$/;
const SAFE_TEXT = /^[\w .,'&()£%-]{0,60}$/;

/**
 * Build a query string from form values (as read by ui.js readForm).
 * true/false → 1/0, everything else as typed (blank kept as blank).
 */
export function encodeState(values) {
  const q = new URLSearchParams();
  Object.keys(values).sort().forEach((name) => {
    const v = values[name];
    if (v === undefined || v === null) return;
    q.set(name, typeof v === 'boolean' ? (v ? '1' : '0') : String(v).trim());
  });
  return q.toString();
}

/**
 * Read shared values back out of a query string.
 * @param {string} search  e.g. location.search
 * @param {Object<string,'checkbox'|'number'|'choice'>} fields  the form's named fields and their kind
 * @returns {Object} only known fields with values that look valid; unknown or odd values are dropped
 */
export function decodeState(search, fields) {
  const q = new URLSearchParams(search || '');
  const out = {};
  for (const [name, kind] of Object.entries(fields)) {
    if (!q.has(name)) continue;
    const raw = q.get(name).trim();
    if (kind === 'checkbox') {
      if (raw === '1' || raw === '0') out[name] = raw === '1';
    } else if (kind === 'number') {
      if (NUMBER_LIKE.test(raw)) out[name] = raw;
    } else if (SAFE_TEXT.test(raw)) {
      out[name] = raw;
    }
  }
  return out;
}

/** The current page address with the given state as its query (and no #fragment). */
export function shareUrl(pageUrl, values) {
  const base = String(pageUrl).split('#')[0].split('?')[0];
  const q = encodeState(values);
  return q ? `${base}?${q}` : base;
}
