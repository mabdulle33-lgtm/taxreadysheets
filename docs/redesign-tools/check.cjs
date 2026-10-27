const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = '/home/user/taxreadysheets';
function pages(dir = ROOT) {
  return fs.readdirSync(dir).flatMap((n) => {
    if (['.git', 'node_modules', 'tests', 'tools', 'docs'].includes(n)) return [];
    const f = path.join(dir, n);
    if (fs.statSync(f).isDirectory()) return pages(f);
    return n === 'index.html' ? ['/' + path.relative(ROOT, dir).split(path.sep).join('/') + (dir === ROOT ? '' : '/')].map(s => s.replace('//', '/')) : [];
  });
}
(async () => {
  const b = await chromium.launch();
  const list = pages();
  let problems = 0;
  for (const scheme of ['light', 'dark']) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    for (const url of list) {
      const p = await ctx.newPage();
      const errs = [];
      p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
      p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
      p.on('requestfailed', (r) => { if (r.url().startsWith('http://localhost')) errs.push('reqfail: ' + r.url()); });
      p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith('http://localhost')) errs.push(r.status() + ' ' + r.url()); });
      await p.goto('http://localhost:8765' + url, { waitUntil: 'networkidle' });
      await p.waitForTimeout(150);
      const info = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth, iw: window.innerWidth,
        bad: (document.body.innerText.match(/.{0,30}\b(NaN|undefined|Infinity)\b.{0,30}/g) || []),
        wide: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed' && !e.closest('.table-scroll') && !e.closest('.visually-hidden'); }).slice(0, 3).map(e => e.tagName + '.' + e.className)
      }));
      const issues = [...errs];
      if (info.sw > info.iw) issues.push(`sideways scroll ${info.sw}>${info.iw} ${info.wide.join(' ')}`);
      if (info.bad.length) issues.push('text: ' + info.bad.join(' | '));
      if (issues.length) { problems++; console.log(`[${scheme} ${w}] ${url}\n  ` + issues.join('\n  ')); }
      await p.close();
    }
    await ctx.close();
  }
  console.log(`checked ${list.length} pages x 4, pages with problems: ${problems}`);
  await b.close();
})();
