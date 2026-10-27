import { bindForm, setOuts, niceDate, esc } from '../ui.js';
import { ucPeriods, isoDate } from '../calc.js';

const short = { day: 'numeric', month: 'short', year: 'numeric' };
const dm = { day: 'numeric', month: 'short' };

bindForm('calc', (v) => {
  const day = Math.floor(Number(v.startDay));
  const body = document.getElementById('periods-body');
  const today = new Date();
  const periods = ucPeriods(day, today, Number(v.count) || 6);
  if (!periods.length) {
    body.innerHTML = '';
    setOuts({ window: '–', note: 'Enter a start day between 1 and 31.' });
    return;
  }
  const todayIso = isoDate(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
  body.innerHTML = periods.map((p) => {
    const current = p.start <= todayIso && todayIso <= p.end;
    return `<tr${current ? ' class="current"' : ''}><td>${esc(niceDate(p.start, dm))} to<br>${esc(niceDate(p.end, short))}${current ? ' <span class="visually-hidden">(current period)</span>' : ''}</td><td>${esc(niceDate(p.reportFrom, dm))}</td><td>${esc(niceDate(p.reportBy, dm))}</td></tr>`;
  }).join('');
  const now = periods[0];
  const fallback = day >= 29 ? ` Because your period starts on day ${day}, in shorter months it starts on the last day of the month instead.` : '';
  setOuts({
    window: `${niceDate(now.reportFrom, short)} and ${niceDate(now.reportBy, short)}`,
    note: `Your current period runs ${niceDate(now.start, short)} to ${niceDate(now.end, short)} (highlighted below). Payment usually arrives about 7 days after a period ends — around ${niceDate(now.paymentAround, short)} for this one.${fallback}`
  });
});
