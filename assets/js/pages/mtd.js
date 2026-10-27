import { bindForm, setOuts, show, gbp, esc } from '../ui.js';
import { mtdCheck, isBlank } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

const quarters = RATES.mtdQuarterlyDeadlines;
const listText = quarters.slice(0, -1).join(', ') + ' and ' + quarters[quarters.length - 1];

bindForm('calc', (v) => {
  const r = mtdCheck({ y2425: v.y2425, y2526: v.y2526, y2627: v.y2627 });
  const body = document.getElementById('mtd-body');
  if (r.empty) {
    body.innerHTML = '';
    setOuts({ headLabel: 'You need Making Tax Digital from', start: '–', note: 'Enter your qualifying income for 2024/25 to start.' });
    show('mtdDeadlines', false);
    return;
  }
  const raw = [v.y2425, v.y2526, v.y2627];
  body.innerHTML = r.years.map((y, i) => `<tr${r.required && y.basedOn === r.basedOn ? ' class="best"' : ''}><td>${esc(y.basedOn)}${i > 0 && isBlank(raw[i]) ? ' (assumed)' : ''}</td><td>${esc(gbp(y.income, { whole: true }))}</td><td>${esc(gbp(y.threshold, { whole: true }))}</td><td>${y.over ? esc(y.startLabel) : 'No'}</td></tr>`).join('');

  let note;
  if (r.required) {
    const first = RATES.mtd.find((p) => p.startLabel === r.startLabel);
    note = `Your ${r.basedOn} qualifying income is over ${gbp(first.over, { whole: true })}, so you need compatible software and digital records from ${r.startLabel}. Your first quarterly update for the ${first.taxYear} tax year is due by ${quarters[0]} ${first.startDate.slice(0, 4)}.`;
  } else {
    note = `Based on these figures you are not required to join by April 2028. The lowest confirmed threshold is ${gbp(RATES.mtd[RATES.mtd.length - 1].over, { whole: true })}. Keep checking each year — and you can still sign up voluntarily.`;
  }
  setOuts({
    headLabel: r.required ? 'You need Making Tax Digital from' : 'Making Tax Digital',
    start: r.required ? r.startLabel : 'Not yet required',
    note,
    quarters: listText
  });
  show('mtdDeadlines', r.required);
});
