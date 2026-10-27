/*
 * TaxReadySheets — upcoming Self Assessment dates, built from the rates file.
 * Pure functions: the home page countdown and the Node tests both use them.
 */

import { RATES } from './rates-2026-27.js';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** "31 January 2027" → "2027-01-31" (null if it is not a date like that). */
export function parseUkDate(text) {
  const m = String(text || '').trim().match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  const d = new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
  if (d.getUTCMonth() !== month) return null;
  return d.toISOString().slice(0, 10);
}

/** Every date in the 2026/27 Self Assessment calendar, earliest first. */
export function deadlineList(rates = RATES) {
  const sa = rates.selfAssessment;
  const year = rates.taxYear; // "2026/27"
  const [a, b] = year.split('/');
  const prev = `${Number(a) - 1}/${String(Number(b) - 1).padStart(2, '0')}`;
  const next = `${Number(a) + 1}/${String(Number(b) + 1).padStart(2, '0')}`;
  return [
    { label: sa.firstPaymentOnAccount, title: `Balancing payment for ${prev} and first payment on account for ${year}`, kind: 'pay' },
    { label: sa.secondPaymentOnAccount, title: `Second payment on account for ${year}`, kind: 'pay' },
    { label: sa.registerBy, title: `Register for Self Assessment if ${year} is your first year`, kind: 'register' },
    { label: sa.paperDeadline, title: `Paper tax return deadline for ${year}`, kind: 'file' },
    { label: sa.onlineDeadline, title: `Online return and balancing payment for ${year}`, kind: 'file' },
    { label: sa.nextYearSecondPaymentOnAccount, title: `Second payment on account for ${next}`, kind: 'pay' }
  ]
    .map((d) => ({ ...d, date: parseUkDate(d.label) }))
    .filter((d) => d.date)
    .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}

/** Whole days from today's date to an ISO date (0 = today). Uses calendar days, so clock changes don't matter. */
export function daysUntil(iso, today = new Date()) {
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - t) / 86400000);
}

/**
 * The next deadline on or after today, plus the ones after it.
 * Returns { next: null, later: [] } once every date has passed.
 */
export function upcomingDeadlines(today = new Date(), rates = RATES) {
  const list = deadlineList(rates)
    .map((d) => ({ ...d, days: daysUntil(d.date, today) }))
    .filter((d) => d.days >= 0);
  return { next: list[0] || null, later: list.slice(1) };
}
