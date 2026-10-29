import { bindForm, setOuts, gbp, niceDate, show, chart } from '../ui.js';
import { epcCheck, EPC_RULES } from '../epc.js';

const HEADLINES = {
  'other-nation': ['Different rules apply', 'The EPC C by 2030 standard covers England and Wales. Scotland and Northern Ireland set their own rules — check the Scottish Government or nidirect.'],
  'holiday-let': ['Not covered for now', 'Short-term and holiday lets are outside the new standard for now. The government is keeping this under review and wants powers to bring them in later.'],
  'social': ['Separate rules', 'Social housing has its own standard and consultation. This checker is for private landlords.'],
  'need-epc': ['Find your EPC rating first', 'Enter your current rating or score. You can look it up free on GOV.UK.'],
  'compliant-until-expiry': ['On track: compliant until your EPC expires', 'Your current C-or-better rating should count under the new standard until the certificate runs out.'],
  'renew-before-deadline': ['Rated C, but your EPC runs out first', 'Your certificate expires before 1 October 2030, so it will not carry you past the deadline on its own.'],
  'new-metrics': ['Check against the new standard', 'EPCs lodged from 1 October 2029 are judged on the new fabric and heating or smart-readiness metrics, not the old letter rating.'],
  'c-check-date': ['Rated C — check your EPC date', 'Add the month your EPC was issued to see how long your C rating protects you.'],
  'upgrade-needed': ['Upgrades needed by 1 October 2030', 'Your home is below C, so it needs work — or a registered exemption — before the deadline.'],
  'cap-exemption-likely': ['Upgrades needed — a cost cap exemption may apply', 'Your planned works cost more than you have left under the cap. Spend up to the cap, then you may register an exemption.']
};

bindForm('calc', (v) => {
  const r = epcCheck({ nation: v.nation, letType: v.letType, band: v.band, score: v.score, epcDate: v.epcDate, value: v.value, spent: v.spent, planned: v.planned });
  const [headline, summary] = HEADLINES[r.status] || HEADLINES['need-epc'];

  setOuts({
    headline,
    summary,
    daysLeft: r.daysLeft.toLocaleString('en-GB') + ' days',
    deadline: niceDate(EPC_RULES.deadline, { day: 'numeric', month: 'long', year: 'numeric' }),
    band: r.band ? r.band + (r.score ? ` (score ${r.score})` : '') : '—',
    pointsToC: r.band ? (r.pointsToC ? `${r.pointsToC} points` : (r.score ? 'Already at C or above' : '—')) : '—',
    cap: gbp(r.cap, { whole: true }) + (r.lowValue ? ' (10% of value)' : ''),
    spent: gbp(r.spent, { whole: true }),
    capLeft: gbp(r.capLeft, { whole: true }),
    epcExpiry: r.epcExpiry ? niceDate(r.epcExpiry, { month: 'long', year: 'numeric' }) : 'Add the date your EPC was issued',
    lettableNote: r.lettableNow ? '' : r.notes[0]
  });
  show('inScope', r.inScope);
  show('lettable', !r.lettableNow);

  const spentInCap = Math.min(r.spent, r.cap);
  const plannedInCap = Math.min(r.planned, r.capLeft);
  chart([
    { label: 'Spent so far', value: spentInCap, tone: 1 },
    { label: 'Planned works', value: plannedInCap, tone: 2 },
    { label: 'Still available', value: Math.max(0, r.cap - spentInCap - plannedInCap), tone: 4 }
  ], { value: gbp(r.cap, { whole: true }), label: 'cost cap' });

  const list = document.querySelector('[data-steps]');
  if (list) {
    list.replaceChildren(...r.steps.map((s) => { const li = document.createElement('li'); li.textContent = s; return li; }));
    list.hidden = r.steps.length === 0;
  }
});
