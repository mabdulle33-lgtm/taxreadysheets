import { bindForm, setOuts, show, gbp, percent, chart } from '../ui.js';
import { januaryPayments } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

const JB = RATES.januaryBill;

bindForm('calc', (v) => {
  const r = januaryPayments({
    bill: v.bill,
    poaPaid: v.poaPaid,
    otherDue: v.otherDue,
    taxAtSource: v.taxAtSource,
    expectedNext: v.expected
  });

  let poaNote;
  if (r.bill === 0) poaNote = `Enter your ${JB.taxYear} income tax and Class 4 NI to see what is due.`;
  else if (r.reason === 'under1000') poaNote = `Your ${JB.taxYear} bill is under £1,000, so there are no payments on account. You only pay the balance in January.`;
  else if (r.reason === 'mostlyAtSource') poaNote = `More than 80% of your tax was taken at source (${percent(r.sourceShare, 0)}), so there are no payments on account. You only pay the balance in January.`;
  else if (r.reduced) poaNote = `Based on your lower estimate, each payment on account drops from ${gbp(r.fullEach)} to ${gbp(r.each)}. If your real 2026/27 bill turns out higher, HMRC charges interest on the difference.`;
  else poaNote = `Your bill is £1,000 or more, so HMRC asks for two payments on account of ${gbp(r.each)} each towards 2026/27: half of your ${JB.taxYear} bill.`;


  setOuts({
    january: gbp(r.january),
    balance: gbp(r.balanceDue),
    each: gbp(r.each),
    januaryTotal: gbp(r.january),
    july: gbp(r.july),
    monthly: r.monthsLeft > 1 ? `${gbp(r.monthlySaving)} × ${r.monthsLeft} months` : r.monthsLeft === 1 ? `${gbp(r.monthlySaving)} now` : 'Deadline passed',
    poaNote,
    refundNote: `You paid ${gbp(r.refund)} more than you need in January. HMRC uses it for your January payment and you can claim back the rest.`,
    codeOutNote: `you owe under £${JB.codingOutLimit.toLocaleString('en-GB')} and pay tax through PAYE, so you can ask HMRC to collect the balance through your tax code over 2027/28 instead. File online by ${JB.codingOutBy} and tick the box on the return. Payments on account cannot be collected this way.`,
    lateNote: `if the ${JB.taxYear} balance is still unpaid 30 days after ${JB.dueDate}, HMRC adds a ${percent(JB.latePaymentPenalty, 0)} penalty (${gbp(r.penaltyAt30Days)}), then another ${percent(JB.latePaymentPenalty, 0)} at 6 and 12 months. Interest at ${percent(JB.latePaymentInterest, 2)} a year runs on everything unpaid, about ${gbp(r.interestPerMonth)} a month here.`,
    ttpNote: r.overTimeToPayLimit
      ? `You owe more than £${JB.timeToPayOnlineLimit.toLocaleString('en-GB')}, so you cannot set up a payment plan online. Call HMRC before the deadline to agree one.`
      : `Once you have filed, you can spread a bill of up to £${JB.timeToPayOnlineLimit.toLocaleString('en-GB')} with an online payment plan. Set it up before the 30-day penalty date to avoid the ${percent(JB.latePaymentPenalty, 0)} penalty; interest still applies.`
  });

  const januaryBalance = Math.min(r.balanceDue, r.january);
  chart([
    { label: `Rest of ${JB.taxYear}`, value: januaryBalance, tone: 1 },
    { label: '31 January payment on account', value: Math.max(0, r.january - januaryBalance), tone: 2 },
    { label: '31 July payment on account', value: r.july, tone: 3 }
  ], { value: gbp(r.total, { whole: true }), label: 'Jan + Jul' });

  show('refund', r.refund > 0);
  show('codeout', r.canCodeOut);
  show('late', r.january > 0);
  show('ttp', r.january > 0);
});
