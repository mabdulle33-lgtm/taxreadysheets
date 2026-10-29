// Run with: node --test
// Every expected figure below was worked out by hand from the 2026/27 rates
// (the working is in the comments) rather than copied from the code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../assets/js/calc.js';
import { RATES } from '../assets/js/rates-2026-27.js';

const near = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) < 0.011, `${msg || ''} expected ${expected}, got ${actual}`);

test('clean() turns blank, text, NaN and negative input into 0', () => {
  assert.equal(c.clean(''), 0);
  assert.equal(c.clean(undefined), 0);
  assert.equal(c.clean(null), 0);
  assert.equal(c.clean('abc'), 0);
  assert.equal(c.clean(NaN), 0);
  assert.equal(c.clean(-500), 0);
  assert.equal(c.clean('1234.5'), 1234.5);
  assert.equal(c.clean(Infinity), 0);
});

test('personal allowance taper', () => {
  assert.equal(c.personalAllowance(50000), 12570);
  assert.equal(c.personalAllowance(100000), 12570);
  assert.equal(c.personalAllowance(100001), 12570); // £1 over: floor(0.5) = 0 lost
  assert.equal(c.personalAllowance(110000), 7570); // 10,000 over → 5,000 lost
  assert.equal(c.personalAllowance(125140), 0);
  assert.equal(c.personalAllowance(200000), 0);
  assert.equal(c.personalAllowance(-10), 12570);
});

test('income tax England/Wales/NI', () => {
  assert.equal(c.incomeTax(0).tax, 0);
  assert.equal(c.incomeTax(12570).tax, 0);
  // 30,000 − 12,570 = 17,430 × 20% = 3,486
  near(c.incomeTax(30000).tax, 3486);
  // 50,270 → 37,700 × 20% = 7,540 (top of basic rate)
  near(c.incomeTax(50270).tax, 7540);
  // 60,000 → 37,700 × 20% + 9,730 × 40% = 7,540 + 3,892 = 11,432
  near(c.incomeTax(60000).tax, 11432);
  // 110,000 → PA 7,570, taxable 102,430: 7,540 + 64,730 × 40% (25,892) = 33,432
  near(c.incomeTax(110000).tax, 33432);
  // 150,000 → PA 0: 7,540 + 87,440 × 40% (34,976) + 24,860 × 45% (11,187) = 53,703
  near(c.incomeTax(150000).tax, 53703);
});

test('income tax Scotland', () => {
  // 30,000 → taxable 17,430: 3,967 × 19% (753.73) + 12,989 × 20% (2,597.80) + 474 × 21% (99.54) = 3,451.07
  near(c.incomeTax(30000, { scotland: true }).tax, 3451.07);
  // 80,000 → taxable 67,430: 753.73 + 2,597.80 + 14,136 × 21% (2,968.56) + 31,338 × 42% (13,161.96) + 5,000 × 45% (2,250) = 21,732.05
  near(c.incomeTax(80000, { scotland: true }).tax, 21732.05);
  // 16,537 → taxable 3,967 all at starter rate = 753.73
  near(c.incomeTax(16537, { scotland: true }).tax, 753.73);
});

test('Class 4 National Insurance', () => {
  assert.equal(c.class4(0), 0);
  assert.equal(c.class4(12570), 0);
  near(c.class4(30000), 1045.8); // 17,430 × 6%
  near(c.class4(50270), 2262); // 37,700 × 6%
  near(c.class4(60000), 2456.6); // 2,262 + 9,730 × 2%
  near(c.class4(-100), 0);
});

test('Class 2 small profits threshold', () => {
  assert.equal(c.class2Status(7104).treatedAsPaid, false);
  assert.equal(c.class2Status(7105).treatedAsPaid, true);
  near(c.class2Status(0).voluntaryAnnual, 189.8); // 3.65 × 52
  assert.equal(c.class2Status(50000).toPay, 0);
});

test('trading allowance vs expenses picks the lower profit', () => {
  const a = c.bestDeduction(5000, 300);
  assert.equal(a.method, 'allowance');
  assert.equal(a.profit, 4000);
  const b = c.bestDeduction(5000, 1800);
  assert.equal(b.method, 'expenses');
  assert.equal(b.profit, 3200);
  const small = c.bestDeduction(800, 50);
  assert.equal(small.profit, 0);
  assert.equal(small.fullyCoveredByAllowance, true);
  const loss = c.bestDeduction(2000, 3000);
  assert.equal(loss.profit, 0);
  assert.equal(loss.loss, 1000);
});

test('self-employed worked example: £32,000 turnover, £2,000 expenses', () => {
  const r = c.selfEmployedTax({ turnover: 32000, expenses: 2000 });
  assert.equal(r.method, 'expenses');
  assert.equal(r.profit, 30000);
  near(r.incomeTax, 3486);
  near(r.class4, 1045.8);
  near(r.total, 4531.8);
  near(r.takeHome, 25468.2);
  near(r.monthlySetAside, 377.65);
  near(r.effectiveRate * 100, 15.106);
  assert.equal(r.paymentsOnAccount.applies, true);
  near(r.paymentsOnAccount.each, 2265.9);
  near(r.paymentsOnAccount.firstJanuaryTotal, 6797.7);
});

test('self-employed: blank, zero and negative inputs give zero tax', () => {
  for (const input of [{}, { turnover: '' }, { turnover: 0, expenses: 0 }, { turnover: -5000, expenses: -1 }]) {
    const r = c.selfEmployedTax(input);
    assert.equal(r.total, 0);
    assert.equal(r.profit, 0);
    assert.equal(r.effectiveRate, 0);
    assert.equal(r.paymentsOnAccount.applies, false);
  }
});

test('self-employed: profits above £50,270 hit higher rate and 2% NI', () => {
  const r = c.selfEmployedTax({ turnover: 65000, expenses: 5000 });
  near(r.incomeTax, 11432);
  near(r.class4, 2456.6);
  near(r.total, 13888.6);
});

test('self-employed with a PAYE job uses up the allowance first', () => {
  // Job 20,000 (tax 1,486 via PAYE). Profit 15,000 all at 20% = 3,000.
  // Class 4 on 15,000: 2,430 × 6% = 145.80
  const r = c.selfEmployedTax({ turnover: 16000, expenses: 1000, employmentIncome: 20000 });
  near(r.taxOnEmployment, 1486);
  near(r.incomeTax, 3000);
  near(r.class4, 145.8);
  near(r.total, 3145.8);
  // SA bill 3,145.80 > 1,000 and only 32% collected at source → payments on account
  assert.equal(r.paymentsOnAccount.applies, true);
});

test('payments on account not needed when 80%+ collected at source', () => {
  // Job 60,000 (PAYE 11,432) + small profit 4,000 → SA bill 1,600 + 0 NI. 11,432/13,032 = 87.7% at source.
  const r = c.selfEmployedTax({ turnover: 5000, expenses: 1000, employmentIncome: 60000 });
  near(r.incomeTax, 1600);
  assert.equal(r.paymentsOnAccount.applies, false);
  // Bill of £1,000 or less never needs them
  assert.equal(c.paymentsOnAccount(1000, 0).applies, false);
  assert.equal(c.paymentsOnAccount(1000.01, 0).applies, true);
});

test('self-employed personal allowance taper (profit £110,000)', () => {
  const r = c.selfEmployedTax({ turnover: 120000, expenses: 10000 });
  assert.equal(r.personalAllowance, 7570);
  near(r.incomeTax, 33432);
  near(r.class4, 3456.6); // 2,262 + 59,730 × 2%
});

test('self-employed Scotland', () => {
  const r = c.selfEmployedTax({ turnover: 32000, expenses: 2000, scotland: true });
  near(r.incomeTax, 3451.07);
  near(r.class4, 1045.8); // Class 4 is UK-wide
});

test('CIS refund worked example', () => {
  // Gross 40,000, materials 5,000 → labour 35,000 × 20% = 7,000 deducted (estimated).
  // Profit 40,000 − 5,000 − 3,000 = 32,000 → tax 3,886 + NI 1,165.80 = 5,051.80. Refund 1,948.20
  const r = c.cisRefund({ gross: 40000, materials: 5000, expenses: 3000, cisDeducted: '' });
  assert.equal(r.deductedEstimated, true);
  near(r.deducted, 7000);
  near(r.liability, 5051.8);
  near(r.refund, 1948.2);
  assert.equal(r.outcome, 'refund');
});

test('CIS amount owed when deductions are too low', () => {
  // Profit 60,000: tax 11,432 + NI 2,456.60 = 13,888.60. Deducted 9,000 → owe 4,888.60
  const r = c.cisRefund({ gross: 62000, materials: 0, expenses: 2000, cisDeducted: 9000 });
  near(r.liability, 13888.6);
  near(r.owed, 4888.6);
  assert.equal(r.refund, 0);
  assert.equal(r.outcome, 'owed');
});

test('CIS unregistered 30% and typed zero deduction', () => {
  const r = c.cisRefund({ gross: 10000, materials: 0, expenses: 0, status: 'unregistered' });
  near(r.deducted, 3000);
  // Profit 9,000 (trading allowance beats £0 expenses) → no tax → full refund
  near(r.refund, 3000);
  const z = c.cisRefund({ gross: 10000, cisDeducted: 0 });
  assert.equal(z.deducted, 0);
  assert.equal(z.deductedEstimated, false);
});

test('beauty service price', () => {
  // 60 min at £20/h = 20; product 4; overheads 400 / 80 = 5 → 29; +10% = 31.90 → £32
  const r = c.beautyServicePrice({ minutes: 60, hourlyRate: 20, productCost: 4, overheadsMonthly: 400, servicesPerMonth: 80, marginPct: 10 });
  near(r.cost, 29);
  near(r.price, 31.9);
  assert.equal(r.roundedPrice, 32);
  near(r.breakEven, 9);
  const zero = c.beautyServicePrice({ minutes: '', hourlyRate: -3 });
  assert.equal(zero.price, 0);
  assert.equal(zero.effectiveHourly, 0);
});

test('cleaning job price', () => {
  // 3h × 2 cleaners × £15 = 90; supplies 5; 10 miles × 55p = 5.50; overheads 300/60 = 5 → 105.50; +20% = 126.60 → £127
  const r = c.cleaningJobPrice({ hours: 3, cleaners: 2, payPerHour: 15, supplies: 5, travelMiles: 10, overheadsMonthly: 300, jobsPerMonth: 60, marginPct: 20, frequency: 'weekly' });
  near(r.cost, 105.5);
  near(r.price, 126.6);
  assert.equal(r.roundedPrice, 127);
  near(r.pricePerHour, 127 / 3);
  near(r.clientMonthly, 127 * 52 / 12);
});

test('dog walking price per dog', () => {
  // (60 + 15 min) = 1.25h × £16 = 20; 6 miles × 55p = 3.30; overheads 150/100 = 1.50 → 24.80; +0% → split 4 dogs = 6.20 → £6.50 each
  const r = c.petCarePrice({ minutes: 60, travelMinutes: 15, hourlyRate: 16, pets: 4, travelMiles: 6, overheadsMonthly: 150, visitsPerMonth: 100, marginPct: 0 });
  near(r.price, 24.8);
  near(r.pricePerPet, 6.5);
  near(r.visitTotal, 26);
  const solo = c.petCarePrice({ minutes: 30, hourlyRate: 20, pets: 0 });
  assert.equal(solo.pets, 1);
  near(solo.pricePerPet, 10);
});

test('reseller checker', () => {
  const declutter = c.resellerCheck({ sales: 900, salesCount: 12, costs: 0, activity: 'declutter' });
  assert.equal(declutter.reported, false);
  assert.equal(declutter.likelyTrading, false);
  const count = c.resellerCheck({ sales: 600, salesCount: 30, activity: 'declutter' });
  assert.equal(count.reported, true);
  assert.equal(count.reportReason, 'count');
  const value = c.resellerCheck({ sales: 1700, salesCount: 5 });
  assert.equal(value.reported, true);
  assert.equal(value.reportReason, 'value');
  const trader = c.resellerCheck({ sales: 6000, salesCount: 200, costs: 2500, activity: 'trading' });
  assert.equal(trader.needsToRegister, true);
  assert.equal(trader.method, 'expenses');
  assert.equal(trader.profit, 3500);
  const small = c.resellerCheck({ sales: 950, salesCount: 40, costs: 100, activity: 'trading' });
  assert.equal(small.needsToRegister, false);
  assert.equal(small.coveredByAllowance, true);
  const signs = c.resellerCheck({ sales: 3000, salesCount: 10, activity: 'declutter', tradingSigns: 2 });
  assert.equal(signs.likelyTrading, true);
});

test('childminder take-home', () => {
  // Fees 24,000 + funded 6,000 = 30,000. Expenses 3,000 + home 4,000 × 25% = 1,000 → profit 26,000
  // Tax 13,430 × 20% = 2,686; NI 13,430 × 6% = 805.80 → 3,491.80; take-home 22,508.20
  const r = c.childminderTax({ fees: 24000, fundedIncome: 6000, expenses: 3000, homeCosts: 4000, homeUsePct: 25 });
  near(r.profit, 26000);
  near(r.total, 3491.8);
  near(r.takeHome, 22508.2);
  near(r.monthlyTakeHome, 1875.68);
  const capped = c.childminderTax({ fees: 10000, homeCosts: 1000, homeUsePct: 250 });
  near(capped.homeShare, 1000);
});

test('landlord 2026/27 vs 2027/28 (England)', () => {
  // Salary 40,000, rent 20,000, costs 3,000, mortgage interest 6,000 → profit 17,000
  // 26/27: total 57,000 taxable 44,430 → 7,540 + 6,730 × 40% = 10,232; salary alone 5,486
  //        rent tax 4,746 − credit 20% × 6,000 (1,200) = 3,546
  // 27/28: 10,270 × 24% (2,464.80) + 6,730 × 44% (2,961.20) = 5,426 − 24% × 6,000 (1,440) = 3,986 (Budget 2026 rates)
  const r = c.landlordTax({ rent: 20000, expenses: 3000, finance: 6000, otherIncome: 40000, region: 'england' });
  near(r.current.propertyTax, 3546);
  near(r.next.propertyTax, 3986);
  near(r.change, 440);
  assert.equal(r.newRatesApply, true);
  near(r.current.afterTax, 7454);
  assert.equal(r.mtd.required, false); // 20,000 qualifying income
});

test('landlord: Scotland keeps current rates in 2027/28', () => {
  const r = c.landlordTax({ rent: 20000, expenses: 3000, finance: 6000, otherIncome: 40000, region: 'scotland' });
  assert.equal(r.newRatesApply, false);
  near(r.next.propertyTax, r.current.propertyTax);
});

test('landlord: finance credit capped by profits and property allowance used when better', () => {
  // No other income, rent 14,000, costs 0, interest 10,000 → profit 14,000; tax 1,430 × 20% = 286;
  // credit limited to 20% × min(10,000, 14,000, 14,000 − 12,570 = 1,430) = 286 → 0 tax
  const r = c.landlordTax({ rent: 14000, expenses: 0, finance: 10000 });
  near(r.current.propertyTax, 0);
  // Rent 5,000 with £200 costs and no mortgage: allowance (4,000) beats expenses (4,800)
  const a = c.landlordTax({ rent: 5000, expenses: 200, finance: 0, otherIncome: 30000 });
  assert.equal(a.current.method, 'allowance');
  near(a.current.propertyTax, 800);
});

test('landlord MTD check uses property + self-employment turnover', () => {
  const r = c.landlordTax({ rent: 36000, seTurnover: 0 });
  assert.equal(r.mtd.startLabel, '6 April 2027');
  const r2 = c.landlordTax({ rent: 30000, seTurnover: 25000 });
  assert.equal(r2.mtd.startLabel, '6 April 2026');
});

test('Rent a Room vs property allowance vs expenses', () => {
  // 6,000 lodger income in own home → Rent a Room makes it tax-free
  const a = c.rentalReliefComparison({ income: 6000, expenses: 1500, ownHome: true, otherIncome: 30000 });
  assert.equal(a.best, 'rentARoom');
  assert.equal(a.taxFree, true);
  near(a.saving, 1000); // vs the worst option (property allowance): 5,000 × 20%
  // Shared limit 3,750: income 10,000 → taxable 6,250 vs allowance 9,000 vs expenses (2,000) 8,000
  const b = c.rentalReliefComparison({ income: 10000, expenses: 2000, ownHome: true, shared: true, otherIncome: 30000 });
  assert.equal(b.rentARoomLimit, 3750);
  assert.equal(b.best, 'rentARoom');
  near(b.bestTax, 1250);
  // Separate holiday let: Rent a Room not available; big expenses win
  const c3 = c.rentalReliefComparison({ income: 18000, expenses: 9000, ownHome: false, otherIncome: 30000 });
  assert.equal(c3.options[0].available, false);
  assert.equal(c3.best, 'expenses');
  near(c3.bestTax, 1800);
});

test('mileage allowance rates', () => {
  near(c.mileageAllowance(8000), 4400); // 55p from 6 April 2026
  near(c.mileageAllowance(10000), 5500);
  near(c.mileageAllowance(15000), 6750); // 5,500 + 5,000 × 25p
  near(c.mileageAllowance(1000, 'motorcycle'), 240);
  near(c.mileageAllowance(1000, 'bicycle'), 200);
  assert.equal(c.mileageAllowance(-50), 0);
});

test('mileage claim for employees nets off employer payments', () => {
  const r = c.mileageClaim({ carMiles: 12000, mode: 'employee', employerPaid: 3000 });
  near(r.total, 6000); // 5,500 + 2,000 × 25p
  near(r.claimable, 3000);
  near(r.savingBasic, 600);
  const over = c.mileageClaim({ carMiles: 1000, mode: 'employee', employerPaid: 600 });
  near(over.claimable, 0);
  near(over.taxedExtra, 50);
  const se = c.mileageClaim({ carMiles: 1000, bicycleMiles: 500 });
  near(se.total, 650);
  near(se.savingBasic, 169); // 650 × 26%
});

test('driver: mileage vs actual vehicle costs', () => {
  // Fares 40,000, fees 8,000, other 1,000. 20,000 miles → 5,500 + 2,500 = 8,000 mileage.
  // Actual 9,000 × 80% = 7,200 → mileage wins by 800 profit: tax+NI difference 26% = 208
  const r = c.driverComparison({ fares: 40000, platformFees: 8000, otherExpenses: 1000, miles: 20000, vehicleCosts: 9000, businessPct: 80 });
  near(r.mileageDeduction, 8000);
  near(r.actualDeduction, 7200);
  assert.equal(r.best, 'mileage');
  near(r.mileage.profit, 23000);
  near(r.actual.profit, 23800);
  // Tax on 23,000: 2,086 + 625.80 = 2,711.80; on 23,800: 2,246 + 673.80 = 2,919.80 → 208 less with mileage
  near(r.mileage.total, 2711.8);
  near(r.actual.total, 2919.8);
  near(r.difference, 208);
  // Cash left: 40,000 − 8,000 − 1,000 − 9,000 (real vehicle spend) − tax
  near(r.actual.cashTakeHome, 19080.2);
  const cheap = c.driverComparison({ fares: 30000, miles: 15000, vehicleCosts: 3000, businessPct: 100 });
  assert.equal(cheap.best, 'mileage');
});

test('tutor hourly rate', () => {
  // Take-home 20,000 with no other income: profit P where P − 26% × (P − 12,570) = 20,000 → 0.74P = 16,731.80 → P = 22,610.54
  const r = c.tutorRate({ targetTakeHome: 20000, weeks: 40, hoursPerWeek: 20, annualCosts: 1000 });
  near(r.profitNeeded, 22610.54);
  near(r.turnoverNeeded, 23610.54);
  near(r.hourlyRate, 29.51);
  assert.equal(r.roundedRate, 30);
  const fee = c.tutorRate({ targetTakeHome: 20000, weeks: 40, hoursPerWeek: 20, annualCosts: 1000, platformFeePct: 20 });
  near(fee.turnoverNeeded, 29513.18); // 23,610.54 / 0.8
  const zero = c.tutorRate({ targetTakeHome: 0, weeks: 0, hoursPerWeek: 0 });
  assert.equal(zero.hourlyRate, 0);
});

test('profitForTakeHome inverts the tax calculation', () => {
  for (const t of [5000, 12570, 30000, 45000, 90000]) {
    const p = c.profitForTakeHome(t);
    near(p - c.taxOnProfit(p), t, `take-home ${t}`);
  }
});

test('Universal Credit periods: normal start day', () => {
  const p = c.ucPeriods(15, '2026-10-27', 3);
  assert.deepEqual(p[0], { start: '2026-10-15', end: '2026-11-14', reportFrom: '2026-11-07', reportBy: '2026-11-28', paymentAround: '2026-11-21' });
  assert.equal(p[1].start, '2026-11-15');
  assert.equal(p.length, 3);
  // Date before this month's start day → the period that began last month
  assert.equal(c.ucPeriods(28, '2026-10-27', 1)[0].start, '2026-09-28');
});

test('Universal Credit periods: days 29–31 fall back in short months', () => {
  const p31 = c.ucPeriods(31, '2027-01-31', 3);
  assert.equal(p31[0].start, '2027-01-31');
  assert.equal(p31[0].end, '2027-02-27'); // Feb 2027 has 28 days → next starts 28 Feb
  assert.equal(p31[1].start, '2027-02-28');
  assert.equal(p31[1].end, '2027-03-30');
  assert.equal(p31[2].start, '2027-03-31');
  const p30 = c.ucPeriods(30, '2027-02-10', 2);
  assert.equal(p30[0].start, '2027-01-30');
  assert.equal(p30[0].end, '2027-02-27');
  assert.equal(p30[1].start, '2027-02-28');
  const p29 = c.ucPeriods(29, '2028-02-15', 2); // 2028 is a leap year
  assert.equal(p29[0].start, '2028-01-29');
  assert.equal(p29[0].end, '2028-02-28');
  assert.equal(p29[1].start, '2028-02-29');
  // Crossing a year end
  const dec = c.ucPeriods(31, '2026-12-31', 2);
  assert.equal(dec[0].end, '2027-01-30');
  assert.equal(dec[1].start, '2027-01-31');
});

test('Universal Credit periods: invalid day and 12-period list', () => {
  assert.deepEqual(c.ucPeriods(0, '2026-10-27', 6), []);
  assert.deepEqual(c.ucPeriods(32, '2026-10-27', 6), []);
  assert.deepEqual(c.ucPeriods('', '2026-10-27', 6), []);
  const twelve = c.ucPeriods(1, '2026-10-27', 12);
  assert.equal(twelve.length, 12);
  assert.equal(twelve[11].start, '2027-09-01');
  assert.equal(twelve[0].end, '2026-10-31');
});

test('Making Tax Digital checker', () => {
  assert.equal(c.mtdCheck({ y2425: 60000 }).startLabel, '6 April 2026');
  assert.equal(c.mtdCheck({ y2425: 50000 }).years[0].over, false); // must be OVER £50,000
  assert.equal(c.mtdCheck({ y2425: 50000 }).startLabel, '6 April 2027'); // carried forward: 50,000 > 30,000
  assert.equal(c.mtdCheck({ y2425: 25000 }).startLabel, '6 April 2028');
  assert.equal(c.mtdCheck({ y2425: 25000, y2526: 35000 }).startLabel, '6 April 2027');
  assert.equal(c.mtdCheck({ y2425: 18000 }).required, false);
  assert.equal(c.mtdCheck({ y2425: 18000, y2526: '', y2627: 20001 }).startLabel, '6 April 2028');
  assert.equal(c.mtdCheck({}).empty, true);
  assert.equal(c.mtdCheck({ y2425: -5 }).required, false);
  assert.equal(c.mtdStatus(30000).startLabel, '6 April 2028'); // not over £30,000, but over £20,000
  assert.equal(c.mtdStatus(20000).required, false);
  assert.equal(c.mtdStatus(30000.01).startLabel, '6 April 2027');
});

test('rates file holds the checked 2026/27 figures', () => {
  assert.equal(RATES.personalAllowance.amount, 12570);
  assert.equal(RATES.class4.upperProfitsLimit, 50270);
  assert.equal(RATES.class2.smallProfitsThreshold, 7105);
  assert.equal(RATES.rentARoom.full, 7500);
  assert.deepEqual(RATES.property.from2027.rates, [0.24, 0.44, 0.49]);
  assert.deepEqual(RATES.mtd.map((m) => m.over), [50000, 30000, 20000]);
  // Scottish band limits are taxable income = gross threshold − 12,570
  const s = RATES.incomeTax.scotland.bands.map((b) => b.upTo);
  assert.deepEqual(s.slice(0, 4), [16537 - 12570, 29526 - 12570, 43662 - 12570, 75000 - 12570]);
});
