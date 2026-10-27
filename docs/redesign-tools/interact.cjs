const { chromium } = require('playwright');
const B = 'http://localhost:8765';
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  // share link
  await p.goto(B + '/calculators/self-employed-tax-calculator/');
  await p.fill('#turnover', '55000'); await p.fill('#expenses', '4000');
  await p.check('#scotland'); await p.check('#deduction-1');
  await p.click('[data-action="share"]');
  const url = p.url();
  ok(/turnover=55000/.test(url) && /scotland=1/.test(url) && /deduction=expenses/.test(url), 'share URL encodes inputs: ' + url);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  ok(clip === url, 'share link copied to clipboard');
  const total1 = await p.textContent('[data-out="total"]');
  const p2 = await ctx.newPage();
  await p2.goto(url);
  ok(await p2.inputValue('#turnover') === '55000' && await p2.isChecked('#scotland') && await p2.isChecked('#deduction-1'), 'share link restores inputs');
  ok(await p2.textContent('[data-out="total"]') === total1, 'restored results match: ' + total1);
  ok((await p2.textContent('[data-action-status]')).includes('shared link'), 'restored notice shown');
  // copy
  await p2.click('[data-action="copy"]');
  const txt = await p2.evaluate(() => navigator.clipboard.readText());
  ok(txt.includes('Total tax bill') && txt.includes(total1) && txt.includes('55000'), 'copy results text');
  // reset
  await p2.click('[data-action="reset"]');
  ok(await p2.inputValue('#turnover') === '32000' && !p2.url().includes('?'), 'reset restores defaults and clears URL');
  ok(await p2.textContent('[data-out="total"]') === '£4,531.80', 'reset recalculates');
  // slider
  const r = p2.locator('input[type=range][data-for="turnover"]');
  await r.evaluate(el => { el.value = '60000'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  ok(await p2.inputValue('#turnover') === '60000', 'slider drives number box');
  // chart
  ok(await p2.locator('[data-chart] .legend li').count() === 4, 'chart legend has 4 parts');
  // tooltip
  await p2.click('#calc .tip');
  ok(await p2.locator('#tip-expenses').isVisible(), 'tooltip opens');
  await p2.keyboard.press('Escape');
  ok(!(await p2.locator('#tip-expenses').isVisible()), 'tooltip closes on Escape');
  // menu
  await p2.click('[data-nav-toggle]');
  ok(await p2.locator('#site-nav a[href$="guides/"]').isVisible(), 'mobile menu opens');
  await p2.keyboard.press('Escape');
  // theme
  await p2.click('[data-theme-toggle]');
  ok(await p2.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'theme toggles to dark');
  await p2.reload();
  ok(await p2.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'theme remembered after reload');
  // home finder + widget + countdown
  await p2.goto(B + '/');
  await p2.click('[data-filter="driving"]');
  const vis = await p2.locator('.calc-grid > li:not([hidden])').count();
  ok(vis >= 4 && vis < 15, 'trade chip filters grid: ' + vis);
  await p2.click('[data-filter="all"]');
  await p2.fill('#finder-q', 'uber');
  ok(await p2.locator('.calc-grid > li:not([hidden]) h3').first().textContent().then(t => t.includes('Taxi')), 'search finds driver calc');
  await p2.fill('#finder-q', 'zzzz');
  ok(await p2.locator('[data-finder-empty]').isVisible(), 'empty state shown');
  await p2.fill('#q-turnover', '50000');
  ok((await p2.textContent('[data-out="qSetAside"]')).startsWith('£'), 'quick widget updates: ' + await p2.textContent('[data-out="qSetAside"]'));
  ok((await p2.getAttribute('[data-quick-more]', 'href')).includes('turnover=50000'), 'widget links to full calculator with figures');
  const days = await p2.textContent('[data-cd="days"]');
  ok(/^\d+$/.test(days), 'countdown days: ' + days + ' / ' + await p2.textContent('[data-cd="date"]'));
  ok(errs.length === 0, 'no errors ' + errs.join('; '));
  await b.close();
})();
