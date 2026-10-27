import { bindForm, setOuts, show, gbp } from '../ui.js';
import { mileageClaim } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

bindForm('calc', (v) => {
  const employee = v.mode === 'employee';
  const r = mileageClaim({
    carMiles: v.carMiles,
    motorcycleMiles: v.motorcycleMiles,
    bicycleMiles: v.bicycleMiles,
    mode: v.mode,
    employerPaid: v.employerPaid
  });
  show('employee', employee);

  const basic = Math.round(RATES.incomeTax.rUK.bands[0].rate * 100);
  const higher = Math.round(RATES.incomeTax.rUK.bands[1].rate * 100);
  let note;
  if (r.total === 0) note = 'Enter your business miles to see your claim.';
  else if (employee && r.taxedExtra > 0) note = `Your employer paid ${gbp(r.taxedExtra)} more than the approved amount. That extra is taxable and should appear on your P11D or payslip.`;
  else if (employee && r.claimable === 0) note = 'Your employer has paid the full approved amount, so there is no relief to claim.';
  else if (employee) note = `Claim Mileage Allowance Relief on ${gbp(r.claimable)} through a P87 form or your Self Assessment return. Savings shown at ${basic}% and ${higher}% income tax.`;
  else note = `Deduct ${gbp(r.claimable)} from your business profit as a vehicle expense. Savings shown include Class 4 National Insurance (${Math.round(RATES.class4.mainRate * 100)}% or ${Math.round(RATES.class4.upperRate * 100)}%).`;

  setOuts({
    claimable: gbp(employee ? r.claimable : r.total),
    car: gbp(r.car),
    motorcycle: gbp(r.motorcycle),
    bicycle: gbp(r.bicycle),
    total: gbp(r.total),
    paid: gbp(r.employerPaid),
    savingBasic: gbp(r.savingBasic),
    savingHigher: gbp(r.savingHigher),
    note
  });
});
