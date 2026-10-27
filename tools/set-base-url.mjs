// Rewrites the site's base URL everywhere it has to appear in plain text
// (canonical and Open Graph tags, JSON-LD, the 404 page's <base>, sitemap.xml, robots.txt).
//
// 1. Change `baseUrl` in assets/js/site-config.js
// 2. Run:  node tools/set-base-url.mjs
//
// It finds the old URL from sitemap.xml and replaces it with the new one.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../assets/js/site-config.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const next = SITE.baseUrl.endsWith('/') ? SITE.baseUrl : SITE.baseUrl + '/';
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const prev = sitemap.match(/<loc>([^<]+)<\/loc>/)[1]; // first entry is the home page

if (prev === next) {
  console.log(`Base URL is already ${next} — nothing to do.`);
  process.exit(0);
}

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  if (['.git', 'node_modules'].includes(n)) return [];
  const f = join(dir, n);
  return statSync(f).isDirectory() ? walk(f) : /\.(html|xml|txt)$/.test(n) ? [f] : [];
});

let changed = 0;
for (const f of walk(ROOT)) {
  const src = readFileSync(f, 'utf8');
  if (!src.includes(prev)) continue;
  writeFileSync(f, src.split(prev).join(next));
  changed += 1;
}
console.log(`Replaced ${prev} with ${next} in ${changed} files.`);
