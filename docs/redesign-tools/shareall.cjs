const { chromium } = require('playwright');
const fs = require('fs');
const norm = (t) => t.split('\n').filter(l => l.trim() && !/Showing the figures|Link copied|Link ready/.test(l)).join('\n');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  for (const slug of fs.readdirSync('calculators').filter(d => !d.endsWith('.html'))) {
    const p = await ctx.newPage();
    await p.goto(`http://localhost:8765/calculators/${slug}/`);
    const id = await p.locator('#calc input[type=number]').first().getAttribute('id');
    await p.fill('#' + id, '7');
    const sel = p.locator('#calc select').first();
    let selVal = null;
    if (await sel.count()) { const opts = await sel.locator('option').evaluateAll(o => o.map(x => x.value)); selVal = opts[opts.length - 1]; await sel.selectOption(selVal); }
    await p.click('[data-action="share"]');
    const before = await p.locator('#results').innerText();
    const q = await ctx.newPage(); await q.goto(p.url());
    const after = await q.locator('#results').innerText();
    const good = (await q.inputValue('#' + id)) === '7' && (!selVal || (await q.locator('#calc select').first().inputValue()) === selVal) && norm(before) === norm(after);
    console.log((good ? 'PASS ' : 'FAIL ') + slug); if (!good) { console.log('  url', p.url(), 'val', await q.inputValue('#' + id));  const a=before.split('\n'), c=after.split('\n'); a.forEach((l,i)=>{ if (l!==c[i]) console.log('  <'+l+'\n  >'+c[i]); }); }
    await p.close(); await q.close();
  }
  await b.close();
})();
