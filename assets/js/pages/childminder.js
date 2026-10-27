import { bindForm, setOuts, gbp } from '../ui.js';
import { childminderTax } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

bindForm('calc', (v) => {
  const r = childminderTax({
    fees: v.fees,
    fundedIncome: v.funded,
    grants: v.grants,
    expenses: v.expenses,
    homeCosts: v.homeCosts,
    homeUsePct: v.homeUse,
    employmentIncome: v.employment,
    scotland: v.scotland
  });

  let note;
  if (r.turnover === 0) note = 'Enter your fees to see your estimate.';
  else if (r.method === 'allowance') note = `The ${gbp(RATES.tradingAllowance, { whole: true })} trading allowance gives a lower profit than your expenses (${gbp(r.profitWithExpenses)}), so it has been used instead.`;
  else if (r.loss > 0) note = `Your costs are ${gbp(r.loss)} more than your income — a loss, so no tax on childminding this year.`;
  else note = r.class2.treatedAsPaid
    ? 'Class 2 NI: nothing to pay, and this year counts towards your State Pension.'
    : `Profit is under ${gbp(RATES.class2.smallProfitsThreshold, { whole: true })}, so this year will not count for State Pension unless you pay Class 2 voluntarily (about ${gbp(r.class2.voluntaryAnnual)} a year).`;

  setOuts({
    monthly: gbp(r.monthlyTakeHome),
    turnover: gbp(r.turnover),
    homeShare: gbp(r.homeShare),
    totalExpenses: gbp(r.method === 'allowance' ? r.turnover - r.profit : r.totalExpenses),
    profit: gbp(r.profit),
    incomeTax: gbp(r.incomeTax),
    class4: gbp(r.class4),
    total: gbp(r.total),
    takeHome: gbp(r.takeHome),
    setAside: gbp(r.monthlySetAside),
    note
  });
});
