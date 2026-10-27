import { bindForm, setOuts, gbp } from '../ui.js';
import { rentalReliefComparison } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

bindForm('calc', (v) => {
  const ownHome = v.letType === 'own';
  const r = rentalReliefComparison({ income: v.income, expenses: v.expenses, ownHome, shared: v.shared, otherIncome: v.other, scotland: v.scotland });
  const outs = {};
  r.options.forEach((o) => {
    outs[o.key + 'Taxable'] = o.available ? gbp(o.taxable) : 'n/a';
    outs[o.key + 'Tax'] = o.available ? gbp(o.tax) : 'n/a';
    const row = document.querySelector(`[data-row="${o.key}"]`);
    if (row) row.classList.toggle('best', o.key === r.best && r.income > 0);
  });
  const best = r.options.find((o) => o.key === r.best);
  const phrase = { rentARoom: 'the Rent a Room Scheme', propertyAllowance: `the ${gbp(RATES.propertyAllowance, { whole: true })} property allowance`, expenses: 'claiming actual expenses' }[r.best];
  outs.rentARoomLabel = `Rent a Room Scheme (${gbp(r.rentARoomLimit, { whole: true })} limit)${ownHome ? '' : ' — your own home only'}`;
  outs.bestTax = gbp(r.bestTax);
  outs.bestName = r.income > 0 ? `Best option: ${best.label}` : 'Enter your letting income to compare.';
  if (r.income === 0) outs.verdict = 'Nothing to compare yet.';
  else if (r.taxFree) outs.verdict = `Good news: with ${phrase} this income is tax-free.`;
  else outs.verdict = r.saving > 0 ? `Using ${phrase} saves you ${gbp(r.saving)} compared with the most expensive option.` : 'All available options give the same result.';
  outs.keep = r.income > 0 ? `You keep about ${gbp(r.keep)} after your actual expenses and tax.` : '';
  setOuts(outs);
});
