import { bindForm, setOuts, show, gbp, percent, chart } from '../ui.js';
import { selfEmployedTax } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

bindForm('calc', (v) => {
  const r = selfEmployedTax({
    turnover: v.turnover,
    expenses: v.expenses,
    employmentIncome: v.employment,
    scotland: v.scotland,
    deduction: v.deduction
  });

  let methodNote;
  if (r.turnover === 0) methodNote = 'Enter your income to see your estimate.';
  else if (r.fullyCoveredByAllowance) methodNote = `Your income is within the £${RATES.tradingAllowance.toLocaleString('en-GB')} trading allowance, so there is no tax on it and you may not need to register for Self Assessment for this income.`;
  else if (r.method === 'allowance') methodNote = `Using the £1,000 trading allowance gives a lower profit (${gbp(r.profitWithAllowance)}) than your expenses (${gbp(r.profitWithExpenses)}).`;
  else methodNote = `Claiming your actual expenses gives a lower profit (${gbp(r.profitWithExpenses)}) than the £1,000 trading allowance (${gbp(r.profitWithAllowance)}).`;
  if (r.method !== r.autoMethod && r.turnover > 0) methodNote += ' Tip: the other option would save you tax.';
  if (r.loss > 0 && r.method === 'expenses') methodNote = `Your expenses are ${gbp(r.loss)} more than your income — a loss, so no tax on this business this year.`;

  const poa = r.paymentsOnAccount;
  setOuts({
    setAside: gbp(r.monthlySetAside),
    profit: gbp(r.profit),
    incomeTax: gbp(r.incomeTax),
    class4: gbp(r.class4),
    total: gbp(r.total),
    takeHome: gbp(r.takeHome),
    effective: percent(r.effectiveRate),
    methodNote,
    poaNote: `your bill is over £1,000, so expect two advance payments of ${gbp(poa.each)} towards next year (31 January and 31 July). In a first year, January could mean ${gbp(poa.firstJanuaryTotal)} in one go.`,
    class2Note: r.profit === 0 ? '' : r.class2.treatedAsPaid
      ? 'Class 2 NI: nothing to pay — with profits over £7,105 you are treated as having paid, so this year counts towards your State Pension.'
      : `Class 2 NI: profits are under £7,105, so this year will not count towards your State Pension unless you pay voluntarily (about ${gbp(r.class2.voluntaryAnnual)} a year).`
  });
  chart([
    { label: r.method === 'allowance' ? 'Trading allowance' : 'Expenses', value: r.turnover - r.profit, tone: 1 },
    { label: 'Income tax', value: r.incomeTax, tone: 2 },
    { label: 'Class 4 NI', value: r.class4, tone: 3 },
    { label: 'Take-home', value: r.takeHome, tone: 4 }
  ], { value: gbp(r.turnover, { whole: true }), label: 'income' });
  show('poa', poa.applies);
});
