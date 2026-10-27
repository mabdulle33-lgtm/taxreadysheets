const { chromium } = require('playwright');
const src = require('fs').readFileSync(__dirname + '/axe/package/axe.min.js', 'utf8');
const urls = ['/', '/calculators/', '/calculators/self-employed-tax-calculator/', '/calculators/landlord-tax-calculator/', '/calculators/taxi-delivery-driver-tax-calculator/', '/calculators/universal-credit-reporting-dates/', '/guides/', '/guides/trading-allowance-vs-expenses/', '/privacy/'];
(async () => {
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
    for (const u of urls) {
      const p = await ctx.newPage();
      await p.goto('http://localhost:8765' + u, { waitUntil: 'networkidle' });
      await p.addScriptTag({ content: src });
      const res = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'] })).violations.map(v => `${v.id} (${v.impact}): ${v.nodes.slice(0,3).map(n => n.target.join(' ') + ' ' + (n.any[0]?.message||'')).join(' || ')}`));
      if (res.length) console.log(`[${scheme} ${w}] ${u}\n  ` + res.join('\n  '));
      await p.close();
    }
    await ctx.close();
  }
  console.log('axe done'); await b.close();
})();
