const { chromium } = require('playwright');
const [,, prefix, ...schemes] = process.argv;
const pages = { home: '/', calculator: '/calculators/self-employed-tax-calculator/', guide: '/guides/self-assessment-deadlines-2026-27/' };
(async () => {
  const b = await chromium.launch();
  for (const scheme of (schemes.length ? schemes : ['light'])) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    for (const [name, path] of Object.entries(pages)) {
      await p.goto('http://localhost:8765' + path, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-visible')));
      await p.waitForTimeout(300);
      await p.screenshot({ path: `docs/redesign-screenshots/${prefix}-${name}-${w}${scheme==='dark'?'-dark':''}.png`, fullPage: true });
    }
    await ctx.close();
  }
  await b.close();
})();
