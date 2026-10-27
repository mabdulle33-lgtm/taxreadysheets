import { bindForm, setOuts, gbp, chart } from '../ui.js';
import { tutorRate, clean } from '../calc.js';

bindForm('calc', (v) => {
  const r = tutorRate({
    targetTakeHome: v.target,
    weeks: v.weeks,
    hoursPerWeek: v.hours,
    unpaidHoursPerWeek: v.unpaid,
    annualCosts: v.costs,
    platformFeePct: v.platformFee,
    scotland: v.scotland
  });
  let note;
  if (r.paidHours === 0) note = 'Enter your teaching weeks and paid hours to see your rate.';
  else if (clean(v.target) === 0) note = 'Enter the take-home pay you want to see the rate you need.';
  else note = `At £${r.roundedRate} an hour, ${r.paidHours.toLocaleString('en-GB')} paid hours bring in about ${gbp(r.roundedRate * r.paidHours, { whole: true })} a year. Put aside around ${gbp(r.tax / 12)} a month for your tax bill.`;
  setOuts({
    rounded: r.paidHours > 0 ? `£${r.roundedRate}` : '£0',
    hourly: gbp(r.hourlyRate),
    turnover: gbp(r.turnoverNeeded),
    fees: gbp(r.platformFees),
    profit: gbp(r.profitNeeded),
    tax: gbp(r.tax),
    perHour: gbp(r.takeHomePerWorkingHour),
    note
  });
  chart([
    { label: 'Agency or platform fees', value: r.platformFees, tone: 5 },
    { label: 'Teaching costs', value: clean(v.costs), tone: 1 },
    { label: 'Tax & NI', value: r.tax, tone: 2 },
    { label: 'Your take-home', value: r.profitNeeded - r.tax, tone: 4 }
  ], { value: gbp(r.turnoverNeeded, { whole: true }), label: 'a year' });
});
