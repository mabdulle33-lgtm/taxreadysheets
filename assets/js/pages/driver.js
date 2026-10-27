import { bindForm, setOuts, gbp } from '../ui.js';
import { driverComparison } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

const rateText = (vehicle) => {
  const m = RATES.mileage;
  if (vehicle === 'motorcycle') return `${Math.round(m.motorcycle * 100)}p a mile`;
  if (vehicle === 'bicycle') return `${Math.round(m.bicycle * 100)}p a mile`;
  return `${Math.round(m.carVan.firstRate * 100)}p a mile for the first ${m.carVan.threshold.toLocaleString('en-GB')} miles, then ${Math.round(m.carVan.laterRate * 100)}p`;
};

bindForm('calc', (v) => {
  const r = driverComparison({
    fares: v.fares,
    platformFees: v.platformFees,
    otherExpenses: v.otherExpenses,
    miles: v.miles,
    vehicle: v.vehicle,
    vehicleCosts: v.vehicleCosts,
    businessPct: v.businessPct,
    employmentIncome: v.employment,
    scotland: v.scotland
  });
  const best = r.best === 'mileage' ? r.mileage : r.actual;
  const tie = r.difference === 0;

  // highlight the winning column on the total row
  document.querySelectorAll('.compare tbody tr').forEach((tr) => tr.classList.remove('best'));
  const totalRow = document.querySelector('.compare tr[data-row="total"]');
  if (totalRow && !tie) totalRow.classList.add('best');

  let note;
  if (r.mileage.turnover === 0) note = 'Enter your earnings to compare the two methods.';
  else if (tie) note = `Both methods give the same tax bill. Mileage rates for your vehicle: ${rateText(v.vehicle)}.`;
  else note = `${r.best === 'mileage' ? 'Mileage rates' : 'Actual costs'} save you ${gbp(r.difference)} in tax this year. Mileage rates for your vehicle: ${rateText(v.vehicle)}. Remember you must keep the same method for as long as you use this vehicle.`;

  setOuts({
    bestHeadline: tie ? 'Either — same tax' : r.best === 'mileage' ? 'Mileage rates' : 'Actual costs',
    mDeduction: gbp(r.mileageDeduction), aDeduction: gbp(r.actualDeduction),
    mProfit: gbp(r.mileage.profit), aProfit: gbp(r.actual.profit),
    mIncomeTax: gbp(r.mileage.incomeTax), aIncomeTax: gbp(r.actual.incomeTax),
    mClass4: gbp(r.mileage.class4), aClass4: gbp(r.actual.class4),
    mTotal: gbp(r.mileage.total), aTotal: gbp(r.actual.total),
    mCash: gbp(r.mileage.cashTakeHome), aCash: gbp(r.actual.cashTakeHome),
    saving: gbp(r.difference),
    setAside: gbp(best.monthlySetAside),
    note
  });
});
