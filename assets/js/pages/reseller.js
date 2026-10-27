import { bindForm, setOuts, gbp } from '../ui.js';
import { resellerCheck, selfEmployedTax } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

const SIGNS = ['signBuy', 'signMake', 'signRegular', 'signProfit', 'signShop'];

bindForm('calc', (v) => {
  const tradingSigns = SIGNS.filter((k) => v[k]).length;
  const r = resellerCheck({ sales: v.sales, salesCount: v.salesCount, costs: v.costs, tradingSigns, activity: v.activity });
  const tax = r.likelyTrading ? selfEmployedTax({ turnover: v.sales, expenses: v.costs, employmentIncome: v.employment, scotland: v.scotland }).total : 0;
  const pr = RATES.platformReporting;
  const allowance = gbp(RATES.tradingAllowance, { whole: true });

  let reportNote;
  if (r.reportReason === 'count') reportNote = `You have ${pr.salesCount} or more sales this calendar year, so the platform will include you in its yearly report. That is information sharing, not a tax.`;
  else if (r.reportReason === 'value') reportNote = `Your sales are about ${gbp(pr.approxGBP, { whole: true })} (€${pr.eur.toLocaleString('en-GB')}) or more, so the platform will include you in its yearly report. That is information sharing, not a tax.`;
  else reportNote = `Under ${pr.salesCount} sales and under about ${gbp(pr.approxGBP, { whole: true })}, so you should not be reported this year.`;

  let verdict;
  if (!r.likelyTrading) verdict = 'This looks like decluttering your own belongings. There is normally no income tax to pay and nothing to register, even if the platform reports you.';
  else if (r.coveredByAllowance) verdict = `This looks like trading, but your sales are within the ${allowance} trading allowance — no tax and no need to register for this income.`;
  else verdict = `This looks like trading and sales are over ${allowance}, so you need to register for Self Assessment and declare a profit of ${gbp(r.profit)} (${r.method === 'expenses' ? 'claiming your actual costs' : 'using the trading allowance'} is better for you).`;

  setOuts({
    reported: r.reported ? 'Yes' : 'No',
    reportNote,
    trading: r.likelyTrading ? 'Yes' : 'No',
    profitExpenses: gbp(r.profitWithExpenses),
    profitAllowance: gbp(r.profitWithAllowance),
    profit: gbp(r.likelyTrading ? r.profit : 0),
    tax: gbp(tax),
    verdict
  });
});
