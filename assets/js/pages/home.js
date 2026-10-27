import { bindForm, setOuts, gbp, percent, niceDate, esc } from '../ui.js';
import { selfEmployedTax } from '../calc.js';
import { upcomingDeadlines } from '../deadlines.js';
import { shareUrl } from '../share.js';

// Quick estimate: the same sums as the full self-employed calculator.
bindForm('quick', (v) => {
  const r = selfEmployedTax({ turnover: v.turnover, expenses: v.expenses });
  const share = r.profit > 0 ? Math.min(1, r.total / r.profit) : 0;
  setOuts({
    qTotal: gbp(r.total, { whole: true }),
    qSetAside: gbp(r.monthlySetAside, { whole: true }),
    qTakeHome: gbp(r.takeHome, { whole: true }),
    qRate: percent(r.effectiveRate),
    qNote: r.turnover === 0
      ? 'Type your yearly income to see an estimate.'
      : r.fullyCoveredByAllowance
        ? 'Within the £1,000 trading allowance — no tax to pay on this income.'
        : `Income tax ${gbp(r.incomeTax, { whole: true })} + Class 4 NI ${gbp(r.class4, { whole: true })} on a profit of ${gbp(r.profit, { whole: true })}.`
  });
  const bar = document.querySelector('[data-quick-bar]');
  if (bar) bar.style.setProperty('--tax', `${(share * 100).toFixed(1)}%`);
  const more = document.querySelector('[data-quick-more]');
  if (more) more.href = shareUrl(more.href, { turnover: v.turnover, expenses: v.expenses });
});

// Next tax deadline countdown, from the dates in the rates file.
const box = document.querySelector('[data-countdown]');
if (box) {
  const { next, later } = upcomingDeadlines(new Date());
  const put = (key, text) => { const el = box.querySelector(`[data-cd="${key}"]`); if (el) el.textContent = text; };
  if (next) {
    put('days', next.days === 0 ? 'Today' : String(next.days));
    put('unit', next.days === 0 ? 'is the deadline' : next.days === 1 ? 'day to go' : 'days to go');
    put('date', niceDate(next.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    put('title', next.title);
    const list = box.querySelector('[data-cd-later]');
    if (list) {
      list.innerHTML = later.slice(0, 3).map((d) => `<li><time datetime="${esc(d.date)}">${esc(niceDate(d.date, { day: 'numeric', month: 'short', year: 'numeric' }))}</time><span>${esc(d.title)}</span></li>`).join('');
    }
  } else {
    put('days', '—');
    put('unit', '');
    put('date', 'New tax year dates coming soon');
    put('title', 'Check GOV.UK for the latest Self Assessment deadlines.');
  }
}
