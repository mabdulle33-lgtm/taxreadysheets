import { bindForm, setOuts, gbp, chart } from '../ui.js';
import { landlordTax, clean } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

bindForm('calc', (v) => {
  const r = landlordTax({ rent: v.rent, expenses: v.expenses, finance: v.finance, otherIncome: v.other, region: v.region, seTurnover: v.seTurnover });
  const [a, b] = r.years;
  const next = RATES.property.from2027;

  let changeNote;
  if (!r.newRatesApply) changeNote = `For ${v.region === 'wales' ? 'Wales' : 'Scotland'} the ${next.taxYear} figure uses today's rates, because property income rates there are set separately and had not been confirmed.`;
  else if (r.change > 0) changeNote = `From April 2027 the new ${next.rates.map((x) => Math.round(x * 100) + '%').join('/')} property rates would cost you ${gbp(r.change)} more a year on the same figures.`;
  else changeNote = `On these figures the April 2027 property rates make no difference to your bill.`;

  const m = r.mtd;
  const mtdNote = m.required
    ? `your qualifying income (rent plus self-employed turnover) is ${gbp(m.qualifyingIncome, { whole: true })}, over £${m.threshold.toLocaleString('en-GB')}. If that holds for the relevant year, quarterly updates start from ${m.startLabel}.`
    : `your qualifying income is ${gbp(m.qualifyingIncome, { whole: true })}, not over the lowest announced threshold of £${RATES.mtd[RATES.mtd.length - 1].over.toLocaleString('en-GB')}, so MTD does not apply yet.`;

  setOuts({
    headline: gbp(a.propertyTax),
    profit0: gbp(a.profit), profit1: gbp(b.profit),
    credit0: gbp(a.credit), credit1: gbp(b.credit),
    tax0: gbp(a.propertyTax), tax1: gbp(b.propertyTax),
    after0: gbp(a.afterTax), after1: gbp(b.afterTax),
    changeNote,
    methodNote: a.method === 'allowance'
      ? `The £${RATES.propertyAllowance.toLocaleString('en-GB')} property allowance gives you a lower bill than claiming costs, so it has been used (no mortgage interest credit with it).`
      : 'Uses your actual running costs, with mortgage interest relieved through the tax credit.',
    mtdNote
  });
  chart([
    { label: 'Running costs', value: Math.min(clean(v.expenses), r.rent), tone: 1 },
    { label: 'Mortgage interest', value: clean(v.finance), tone: 5 },
    { label: 'Tax on rent', value: a.propertyTax, tone: 2 },
    { label: 'Left for you', value: a.afterTax, tone: 4 }
  ], { value: gbp(r.rent, { whole: true }), label: 'rent' });
});
