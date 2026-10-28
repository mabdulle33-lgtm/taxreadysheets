// Checks for the redesign: share links, the donut chart maths, the deadline
// countdown, the calculator finder, icons, and the page furniture that the
// new layout relies on.
// Run with: node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeState, decodeState, shareUrl } from '../assets/js/share.js';
import { chartSegments, roundedPercents } from '../assets/js/chart.js';
import { parseUkDate, deadlineList, daysUntil, upcomingDeadlines } from '../assets/js/deadlines.js';
import { cardMatches, normalise } from '../assets/js/finder.js';
import { ICONS, icon } from '../assets/js/icons.js';
import { selfEmployedTax } from '../assets/js/calc.js';
import { RATES } from '../assets/js/rates-2026-27.js';
import { PRODUCTS } from '../assets/js/products.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', 'node_modules', 'tests', 'tools', 'docs']);
function htmlFiles(dir = ROOT) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}
const pages = htmlFiles().map((file) => ({ rel: relative(ROOT, file).split(sep).join('/'), html: readFileSync(file, 'utf8') }));
const page = (rel) => pages.find((p) => p.rel === rel).html;
const calcPages = pages.filter((p) => /^calculators\/[^/]+\/index\.html$/.test(p.rel));
const guidePages = pages.filter((p) => /^guides\/[^/]+\/index\.html$/.test(p.rel));

/* ---------- share links ---------- */

test('share: encode → decode round trip keeps numbers, blanks, ticks and choices', () => {
  const values = { turnover: '55000', expenses: '', scotland: true, shared: false, deduction: 'expenses' };
  const q = encodeState(values);
  assert.equal(q, 'deduction=expenses&expenses=&scotland=1&shared=0&turnover=55000');
  const back = decodeState('?' + q, { turnover: 'number', expenses: 'number', scotland: 'checkbox', shared: 'checkbox', deduction: 'choice' });
  assert.deepEqual(back, values);
});

test('share: unknown fields and odd values are ignored', () => {
  const kinds = { turnover: 'number', scotland: 'checkbox', region: 'choice' };
  const out = decodeState('?turnover=12abc&scotland=yes&region=<script>&evil=1', kinds);
  assert.deepEqual(out, {});
  assert.deepEqual(decodeState('?turnover=1234.5&region=wales', kinds), { turnover: '1234.5', region: 'wales' });
  assert.deepEqual(decodeState('', kinds), {});
});

test('share: shareUrl drops any old query and #fragment', () => {
  assert.equal(shareUrl('https://x.test/calc/?a=1#faq', { b: '2' }), 'https://x.test/calc/?b=2');
  assert.equal(shareUrl('https://x.test/calc/', {}), 'https://x.test/calc/');
});

/* ---------- chart ---------- */

test('chart: segments drop empty parts and add up to the whole', () => {
  const { total, segments } = chartSegments([
    { label: 'Expenses', value: 2000 }, { label: 'Tax', value: 0 }, { label: 'NI', value: -5 },
    { label: 'Bad', value: NaN }, { label: 'Take-home', value: 6000 }
  ]);
  assert.equal(total, 8000);
  assert.deepEqual(segments.map((s) => s.label), ['Expenses', 'Take-home']);
  assert.equal(segments[0].fraction, 0.25);
  assert.equal(segments[1].start, 0.25);
  assert.equal(segments[1].end, 1);
  assert.deepEqual(chartSegments([]).segments, []);
});

test('chart: rounded percentages always total 100', () => {
  assert.deepEqual(roundedPercents([1 / 3, 1 / 3, 1 / 3]), [34, 33, 33]);
  const r = selfEmployedTax({ turnover: 32000, expenses: 2000 });
  const { segments } = chartSegments([
    { label: 'Expenses', value: r.turnover - r.profit }, { label: 'Income tax', value: r.incomeTax },
    { label: 'Class 4 NI', value: r.class4 }, { label: 'Take-home', value: r.takeHome }
  ]);
  const pcts = roundedPercents(segments.map((s) => s.fraction));
  assert.equal(pcts.reduce((a, b) => a + b, 0), 100);
  // the self-employed chart parts add back up to turnover
  assert.ok(Math.abs(segments.reduce((s, x) => s + x.value, 0) - 32000) < 0.01);
});

/* ---------- deadlines ---------- */

test('deadlines: UK dates parse; nonsense does not', () => {
  assert.equal(parseUkDate('31 January 2027'), '2027-01-31');
  assert.equal(parseUkDate('5 October 2027'), '2027-10-05');
  assert.equal(parseUkDate('31 February 2027'), null);
  assert.equal(parseUkDate('Smarch 1 2027'), null);
});

test('deadlines: built from the rates file, in date order', () => {
  const list = deadlineList();
  const dates = list.map((d) => d.date);
  assert.deepEqual(dates, [...dates].sort());
  for (const key of ['firstPaymentOnAccount', 'secondPaymentOnAccount', 'registerBy']) {
    assert.ok(dates.includes(parseUkDate(RATES.selfAssessment[key])), key);
  }
  assert.deepEqual(dates.slice(0, 3), ['2027-01-31', '2027-07-31', '2027-10-05']);
  assert.match(list[0].title, /2025\/26/);
});

test('deadlines: countdown picks the next date and handles the day itself and the end of the list', () => {
  const at = (y, m, d) => new Date(y, m - 1, d, 15, 30);
  let u = upcomingDeadlines(at(2026, 10, 27));
  assert.equal(u.next.date, '2027-01-31');
  assert.equal(u.next.days, 96);
  assert.equal(u.later[0].date, '2027-07-31');
  u = upcomingDeadlines(at(2027, 1, 31));
  assert.equal(u.next.date, '2027-01-31');
  assert.equal(u.next.days, 0);
  u = upcomingDeadlines(at(2027, 2, 1));
  assert.equal(u.next.date, '2027-07-31');
  assert.equal(upcomingDeadlines(at(2030, 1, 1)).next, null);
  // across the October clock change, still whole days
  assert.equal(daysUntil('2026-11-01', at(2026, 10, 24)), 8);
});

/* ---------- finder ---------- */

test('finder: trade chips and search words', () => {
  const driver = { trades: ['driving'], text: 'Taxi, private hire & delivery driver tax calculator uber deliveroo' };
  const general = { trades: ['all'], text: 'Self-employed tax & take-home calculator' };
  assert.ok(cardMatches(driver, { trade: 'driving' }));
  assert.ok(!cardMatches(driver, { trade: 'beauty' }));
  assert.ok(cardMatches(general, { trade: 'beauty' }), "'all' cards show for every trade");
  assert.ok(cardMatches(driver, { query: 'UBER' }));
  assert.ok(cardMatches(driver, { query: 'taxi  uber' }));
  assert.ok(!cardMatches(driver, { query: 'lodger' }));
  assert.equal(normalise('Café — £1,000!'), 'cafe £1 000');
});

/* ---------- icons ---------- */

test('icons: every icon used in the pages exists in icons.js and inline copies match', () => {
  const bodies = new Set(Object.values(ICONS));
  for (const p of pages) {
    for (const m of p.html.matchAll(/<svg class="icon[^"]*" viewBox="0 0 24 24"[^>]*>([\s\S]*?)<\/svg>/g)) {
      assert.ok(bodies.has(m[1]), `${p.rel}: inline icon not from icons.js: ${m[1].slice(0, 60)}`);
    }
  }
  assert.match(icon('check'), /aria-hidden="true"/);
  assert.equal(icon('nope'), '');
});

/* ---------- page furniture ---------- */

test('every page: theme script, sticky header with menu + theme buttons, self-hosted font', () => {
  assert.ok(existsSync(join(ROOT, 'assets/fonts/inter-latin-wght-normal.woff2')));
  assert.ok(existsSync(join(ROOT, 'assets/fonts/Inter-OFL.txt')), 'font licence ships with the font');
  for (const p of pages) {
    const h = p.html;
    assert.match(h, /<script src="[^"]*assets\/js\/theme-init\.js(?:\?v=\d+)?"><\/script>\s*<link rel="preload"[^>]*inter-latin-wght-normal\.woff2/, `${p.rel}: theme-init + font preload`);
    assert.match(h, /data-theme-toggle/, `${p.rel}: theme toggle`);
    assert.match(h, /data-nav-toggle aria-expanded="false" aria-controls="site-nav"/, `${p.rel}: menu button`);
    assert.match(h, /<nav class="site-nav" id="site-nav"/, `${p.rel}: nav id`);
    assert.doesNotMatch(h, /fonts\.googleapis|fonts\.gstatic|cdn\./, `${p.rel}: no external font/CDN`);
  }
});

test('calculator pages: actions, help, sliders, chart and related cards', () => {
  for (const p of calcPages) {
    const h = p.html;
    for (const a of ['copy', 'share', 'print', 'reset']) assert.match(h, new RegExp(`data-action="${a}"`), `${p.rel}: ${a}`);
    assert.match(h, /data-action-status role="status"/, `${p.rel}: action status`);
    assert.match(h, /class="tip" aria-expanded="false" aria-controls="tip-/, `${p.rel}: inline help`);
    assert.match(h, /data-range="[\d.]+ [\d.]+ [\d.]+"/, `${p.rel}: slider`);
    assert.match(h, /class="related-card"/, `${p.rel}: related cards`);
    assert.match(h, /class="title-icon"/, `${p.rel}: title icon`);
    assert.match(h, /class="product-media"/, `${p.rel}: product card preview`);
    // every inline help button points at a real popup
    for (const m of h.matchAll(/aria-controls="(tip-[^"]+)"/g)) assert.match(h, new RegExp(`id="${m[1]}"`), `${p.rel}: ${m[1]}`);
    const isDates = /universal-credit|making-tax-digital/.test(p.rel);
    assert.equal(/data-chart/.test(h), !isDates, `${p.rel}: chart only on money calculators`);
  }
});

test('page scripts that have a chart call chart()', () => {
  for (const p of calcPages.filter((x) => /data-chart/.test(x.html))) {
    const script = p.html.match(/src="[^"]*assets\/js\/pages\/([^"?]+)(?:\?v=\d+)?"/)[1];
    assert.match(readFileSync(join(ROOT, 'assets/js/pages', script), 'utf8'), /\bchart\(\[/, script);
  }
});

test('guides: reading time and a table of contents that links to real headings', () => {
  for (const p of guidePages) {
    const h = p.html;
    assert.match(h, /\d+ min read/, p.rel);
    const toc = h.match(/<nav class="toc"[\s\S]*?<\/nav>/);
    assert.ok(toc, `${p.rel}: toc`);
    const ids = [...toc[0].matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    assert.ok(ids.length >= 4, `${p.rel}: ${ids.length} toc links`);
    for (const id of ids) assert.match(h, new RegExp(`<h2 id="${id}"`), `${p.rel}: #${id}`);
  }
});

test('home: hero estimate, trust strip, finder, countdown, products, guides', () => {
  const h = page('index.html');
  assert.match(h, /<form class="quick[^"]*" id="quick"/);
  assert.match(h, /src="assets\/js\/pages\/home\.js(?:\?v=\d+)?"/);
  for (const t of ['Checked for 2026/27', 'Based on GOV.UK rates', 'No sign-up', 'Nothing leaves your device']) assert.ok(h.includes(t), t);
  assert.match(h, /data-finder/);
  assert.equal((h.match(/data-filter="/g) || []).length, 10);
  assert.equal((h.match(/class="calc-card reveal" data-trades=/g) || []).length, 14);
  assert.match(h, /data-countdown/);
  assert.match(h, /How it works/);
  assert.match(h, /Spreadsheets that do it all year/);
  for (const m of h.matchAll(/class="product-card[^"]*" data-product="([^"]+)"/g)) {
    assert.ok(PRODUCTS[m[1]], m[1]);
    assert.ok(h.includes(`https://www.etsy.com/listing/${PRODUCTS[m[1]].id}`), `${m[1]} link from products.js`);
  }
  // the static numbers in the widget match the real calculation for its default figures
  const r = selfEmployedTax({ turnover: 32000, expenses: 2000 });
  assert.ok(h.includes(`£${Math.round(r.monthlySetAside)}`), 'default set-aside');
});

test('calculators index lists every calculator once', () => {
  const h = page('calculators/index.html').match(/<ul class="calc-grid">[\s\S]*?<\/ul>/)[0];
  for (const p of calcPages) {
    const slug = p.rel.split('/')[1];
    assert.equal((h.match(new RegExp(`href="\\.\\./calculators/${slug}/"`, 'g')) || []).length, 1, slug);
  }
});

test('no fake reviews, ratings or user counts anywhere', () => {
  for (const p of pages) {
    const text = p.html.replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(text, /aggregateRating|reviewCount|ratingValue|★|☆|\b\d+(?:,\d{3})*\+? (?:happy )?(?:users|customers|people use)\b|testimonial|5 stars|five stars/i, p.rel);
  }
});

test('privacy page explains the theme choice and share links', () => {
  const h = page('privacy/index.html');
  assert.match(h, /trs-theme/);
  assert.match(h, /Share link/);
});

test('stylesheet: dark mode, reduced motion and print rules exist', () => {
  const css = readFileSync(join(ROOT, 'assets/css/style.css'), 'utf8');
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media print/);
  assert.doesNotMatch(css, /@import|url\(["']?https?:/, 'no external CSS resources');
});
