// Site checks: every page has its meta tags, every internal link resolves,
// structured data parses, and the sitemap matches the pages.
// Run with: node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../assets/js/site-config.js';
import { PRODUCTS } from '../assets/js/products.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', 'node_modules', 'tests', 'tools']);

function htmlFiles(dir = ROOT) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const pages = htmlFiles().map((file) => {
  const rel = relative(ROOT, file).split(sep).join('/');
  const urlPath = rel.replace(/index\.html$/, '');
  return { file, rel, urlPath, html: readFileSync(file, 'utf8') };
});

const meta = (html, attr, key) => {
  const m = html.match(new RegExp(`<meta ${attr}="${key.replace(/[:]/g, '\\$&')}" content="([^"]*)"`));
  return m ? m[1] : null;
};
const isCalc = (p) => /^calculators\/[^/]+\/$/.test(p.urlPath);

test('found the expected pages', () => {
  assert.ok(pages.length >= 23, `only ${pages.length} pages`);
  assert.equal(pages.filter(isCalc).length, 14);
});

for (const p of pages) {
  test(`meta tags: ${p.rel}`, () => {
    const h = p.html;
    assert.match(h, /^<!doctype html>/i);
    assert.match(h, /<html lang="en-GB">/);
    assert.match(h, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    const title = h.match(/<title>([^<]+)<\/title>/);
    assert.ok(title && title[1].length >= 15 && title[1].length <= 70, `title length: ${title && title[1].length}`);
    const desc = meta(h, 'name', 'description');
    assert.ok(desc && desc.length >= 70 && desc.length <= 170, `description length: ${desc && desc.length}`);
    const canonical = h.match(/<link rel="canonical" href="([^"]+)">/);
    assert.ok(canonical, 'canonical');
    assert.equal(canonical[1], SITE.baseUrl + p.urlPath, 'canonical uses base URL + path');
    assert.equal(meta(h, 'property', 'og:url'), canonical[1]);
    for (const k of ['og:title', 'og:description', 'og:type', 'og:site_name', 'og:image']) assert.ok(meta(h, 'property', k), k);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, 'exactly one h1');
    assert.match(h, /<link rel="icon" href="[^"]*favicon\.svg"/);
  });
}

test('titles, descriptions and canonicals are unique', () => {
  for (const pick of [(h) => h.match(/<title>([^<]+)/)[1], (h) => meta(h, 'name', 'description'), (h) => h.match(/rel="canonical" href="([^"]+)"/)[1]]) {
    const values = pages.map((p) => pick(p.html));
    assert.equal(new Set(values).size, values.length);
  }
});

test('every internal link and asset resolves', () => {
  const broken = [];
  for (const p of pages) {
    const baseHref = p.html.match(/<base href="([^"]+)">/);
    const fromDir = baseHref ? ROOT : dirname(p.file);
    if (baseHref) assert.equal(baseHref[1], SITE.baseUrl);
    const refs = [...p.html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|data:)/.test(ref) || ref.startsWith('#')) continue;
      assert.ok(!ref.startsWith('/'), `${p.rel}: root-relative link ${ref} breaks on GitHub Pages`);
      const clean = ref.split('#')[0].split('?')[0];
      let target = resolve(fromDir, clean || '.');
      if (clean === '' || clean.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) target = join(target, 'index.html');
      if (!existsSync(target)) broken.push(`${p.rel} → ${ref}`);
      // fragment links to the same page must point at a real id
    }
    for (const m of p.html.matchAll(/href="#([^"]+)"/g)) {
      if (!p.html.includes(`id="${m[1]}"`)) broken.push(`${p.rel} → #${m[1]}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('external links: no third-party scripts, styles or fonts', () => {
  for (const p of pages) {
    assert.doesNotMatch(p.html, /<script[^>]+src="https?:/, p.rel);
    assert.doesNotMatch(p.html, /<link[^>]+rel="stylesheet"[^>]+href="https?:/, p.rel);
    for (const m of p.html.matchAll(/<a [^>]*href="https:\/\/www\.etsy\.com[^"]*"[^>]*>/g)) {
      assert.match(m[0], /target="_blank"/, `${p.rel}: ${m[0]}`);
      assert.match(m[0], /rel="noopener"/, `${p.rel}: ${m[0]}`);
    }
  }
});

test('structured data parses; home has Organization + WebSite', () => {
  for (const p of pages) {
    for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(m[1]), p.rel);
    }
  }
  const home = pages.find((p) => p.rel === 'index.html').html;
  assert.match(home, /"@type":"Organization"/);
  assert.match(home, /"@type":"WebSite"/);
});

test('calculator pages have every required section', () => {
  for (const p of pages.filter(isCalc)) {
    const h = p.html;
    const faq = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((j) => j['@type'] === 'FAQPage');
    assert.ok(faq, `${p.rel}: FAQPage JSON-LD`);
    assert.ok(faq.mainEntity.length >= 4 && faq.mainEntity.length <= 6, `${p.rel}: ${faq.mainEntity.length} FAQs`);
    assert.equal((h.match(/<details>/g) || []).length, faq.mainEntity.length, `${p.rel}: visible FAQs match JSON-LD`);
    assert.match(h, /<form class="calc" id="calc"/, `${p.rel}: calculator form`);
    assert.match(h, /id="example"/, `${p.rel}: worked example`);
    assert.match(h, /id="explained"/, `${p.rel}: explanation`);
    assert.match(h, /Checked for 2026\/27/, `${p.rel}: checked note`);
    assert.match(h, /Estimates only, not tax advice/, `${p.rel}: disclaimer`);
    assert.match(h, /GOV\.UK/, `${p.rel}: GOV.UK pointer`);
    assert.match(h, /data-signup/, `${p.rel}: sign-up block`);
    assert.match(h, /Free UK tax deadline reminders/, `${p.rel}: sign-up heading`);
    const product = h.match(/data-product="([^"]+)"/);
    assert.ok(product && PRODUCTS[product[1]], `${p.rel}: product box with a known product`);
    const script = h.match(/src="[^"]*assets\/js\/pages\/([^"]+)"/);
    assert.ok(script && existsSync(join(ROOT, 'assets/js/pages', script[1])), `${p.rel}: page script`);
  }
});

test('home page has the sign-up block', () => {
  assert.match(pages.find((p) => p.rel === 'index.html').html, /Free UK tax deadline reminders/);
});

test('sitemap lists every indexable page with the base URL; robots points at it', () => {
  const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = pages.filter((p) => !/noindex/.test(p.html)).map((p) => SITE.baseUrl + p.urlPath);
  assert.deepEqual([...locs].sort(), [...expected].sort());
  const robots = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
  assert.match(robots, new RegExp(`Sitemap: ${SITE.baseUrl.replace(/[.]/g, '\\.')}sitemap\\.xml`));
});

test('no cookies or tracking in site scripts; storage only for the light/dark choice', () => {
  const dir = join(ROOT, 'assets/js');
  const files = [...readdirSync(dir).map((f) => join(dir, f)), ...readdirSync(join(dir, 'pages')).map((f) => join(dir, 'pages', f))].filter((f) => f.endsWith('.js'));
  const THEME_FILES = new Set(['theme-init.js', 'site.js']);
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /document\.cookie|sessionStorage|navigator\.sendBeacon|indexedDB/, f);
    const name = f.split(sep).pop();
    const uses = [...src.matchAll(/localStorage\.(\w+)\(([^)]*)\)/g)];
    if (!THEME_FILES.has(name)) {
      assert.doesNotMatch(src, /localStorage/, `${f}: only the theme scripts may use storage`);
      continue;
    }
    for (const m of uses) {
      assert.ok(['getItem', 'setItem'].includes(m[1]), `${f}: localStorage.${m[1]}`);
      assert.match(m[2], /^('trs-theme'|THEME_KEY)(,|$)/, `${f}: storage key must be the theme key`);
      // every storage call sits inside a try block, so blocked storage can't break the page
      const before = src.slice(0, m.index).split('\n').slice(-3).join('\n');
      assert.match(before, /try\s*\{/, `${f}: storage call not wrapped in try`);
    }
  }
  assert.match(readFileSync(join(dir, 'site.js'), 'utf8'), /const THEME_KEY = 'trs-theme';/);
});

test('page scripts never hard-code tax rates', () => {
  const dir = join(ROOT, 'assets/js/pages');
  for (const f of readdirSync(dir)) {
    const src = readFileSync(join(dir, f), 'utf8');
    assert.doesNotMatch(src, /\b0\.(?:19|2|20|21|22|24|25|4|40|42|45|47|48|06|02)\b/, `${f} contains what looks like a rate`);
  }
});
