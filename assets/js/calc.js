/*
 * TaxReadySheets — calculation logic.
 *
 * Every function here is pure: numbers in, plain objects out, no DOM, no
 * network. All rates come from rates-2026-27.js. The browser pages and the
 * Node tests (tests/calc.test.js) both import this file.
 */

import { RATES } from './rates-2026-27.js';

/* ---------- small helpers ---------- */

/** Turn any input (blank, text, negative, NaN) into a finite number >= 0. */
export function clean(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** True when a field was left empty (as opposed to a typed 0). */
export function isBlank(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '') ||
    (typeof value === 'number' && Number.isNaN(value));
}

/** Round to pennies, avoiding floating point noise. */
export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function pct(value, max = 100) {
  return Math.min(clean(value), max) / 100;
}

/* ---------- income tax ---------- */

/** Personal allowance after the £100,000 taper. */
export function personalAllowance(adjustedNetIncome, rates = RATES) {
  const pa = rates.personalAllowance;
  const income = clean(adjustedNetIncome);
  const over = Math.max(0, income - pa.taperStartsAt);
  const reduction = Math.floor(over * pa.taperRate);
  return Math.max(0, pa.amount - reduction);
}

/** Pick the band table for a region. Accepts true/false (Scotland) or a region key. */
export function bandsFor(region, rates = RATES) {
  const scot = region === true || region === 'scotland';
  return (scot ? rates.incomeTax.scotland : rates.incomeTax.rUK).bands;
}

/**
 * Income tax on layered income. Layers are taxed in order, so the personal
 * allowance and lower bands are used by earlier layers first.
 * Each layer: { amount, rates? } where rates (optional) overrides the band
 * rates for that layer (used for the 2027/28 property income rates).
 */
export function taxLayers(layers, { region = false, rates = RATES } = {}) {
  const bands = bandsFor(region, rates);
  const total = layers.reduce((s, l) => s + clean(l.amount), 0);
  const pa = personalAllowance(total, rates);
  let paLeft = pa;
  let position = 0; // taxable income used so far
  const out = layers.map((layer) => {
    let amount = clean(layer.amount);
    const usePa = Math.min(paLeft, amount);
    paLeft -= usePa;
    amount -= usePa;
    let tax = 0;
    const breakdown = [];
    let lower = 0;
    bands.forEach((band, i) => {
      const upper = band.upTo;
      const start = Math.max(lower, position);
      const end = Math.min(upper, position + amount);
      if (end > start) {
        const rate = layer.rates && layer.rates[i] !== undefined ? layer.rates[i] : band.rate;
        const t = (end - start) * rate;
        tax += t;
        breakdown.push({ name: band.name, rate, amount: round2(end - start), tax: round2(t) });
      }
      lower = upper;
    });
    position += amount;
    return { taxable: round2(amount), allowanceUsed: usePa, tax: round2(tax), breakdown };
  });
  return {
    personalAllowance: pa,
    taxable: round2(position),
    tax: round2(out.reduce((s, l) => s + l.tax, 0)),
    layers: out
  };
}

/** Income tax on a single amount of non-savings income. */
export function incomeTax(income, { scotland = false, rates = RATES } = {}) {
  const r = taxLayers([{ amount: income }], { region: scotland, rates });
  return {
    income: round2(clean(income)),
    personalAllowance: r.personalAllowance,
    taxable: r.taxable,
    tax: r.tax,
    breakdown: r.layers[0].breakdown
  };
}

/* ---------- National Insurance ---------- */

export function class4(profit, rates = RATES) {
  const c = rates.class4;
  const p = clean(profit);
  const main = Math.max(0, Math.min(p, c.upperProfitsLimit) - c.lowerProfitsLimit) * c.mainRate;
  const upper = Math.max(0, p - c.upperProfitsLimit) * c.upperRate;
  return round2(main + upper);
}

export function class2Status(profit, rates = RATES) {
  const c = rates.class2;
  const treatedAsPaid = clean(profit) >= c.smallProfitsThreshold;
  return {
    toPay: 0,
    treatedAsPaid,
    smallProfitsThreshold: c.smallProfitsThreshold,
    voluntaryWeekly: c.voluntaryWeekly,
    voluntaryAnnual: round2(c.voluntaryWeekly * c.weeksInYear)
  };
}

/* ---------- allowances ---------- */

/**
 * Compare claiming actual expenses with a £1,000 allowance (trading or
 * property) and return the one that leaves the lower profit.
 * The allowance cannot create a loss; expenses can (profit floors at 0 here).
 */
export function bestDeduction(turnover, expenses, allowance = RATES.tradingAllowance) {
  const t = clean(turnover);
  const e = clean(expenses);
  const allowanceUsed = Math.min(allowance, t);
  const profitWithExpenses = Math.max(0, t - e);
  const profitWithAllowance = Math.max(0, t - allowanceUsed);
  const useAllowance = profitWithAllowance < profitWithExpenses;
  return {
    method: useAllowance ? 'allowance' : 'expenses',
    deduction: useAllowance ? allowanceUsed : Math.min(e, t),
    profit: round2(useAllowance ? profitWithAllowance : profitWithExpenses),
    profitWithExpenses: round2(profitWithExpenses),
    profitWithAllowance: round2(profitWithAllowance),
    loss: round2(Math.max(0, e - t)),
    fullyCoveredByAllowance: t > 0 && t <= allowance
  };
}

/* ---------- payments on account ---------- */

export function paymentsOnAccount(selfAssessmentBill, taxCollectedAtSource = 0, rates = RATES) {
  const sa = rates.selfAssessment;
  const bill = clean(selfAssessmentBill);
  const source = clean(taxCollectedAtSource);
  const totalTax = bill + source;
  const sourceShare = totalTax > 0 ? source / totalTax : 0;
  const applies = bill > sa.paymentsOnAccountThreshold && sourceShare < sa.collectedAtSourceLimit;
  const each = applies ? round2(bill / 2) : 0;
  return {
    applies,
    each,
    // In a first year of trading the January payment is the full bill
    // plus the first payment on account towards next year.
    firstJanuaryTotal: round2(bill + each),
    sourceShare
  };
}

/* ---------- 1. self-employed tax & take-home ---------- */

/**
 * @param {object} p
 * @param {number} p.turnover   sales / income before expenses
 * @param {number} p.expenses   allowable business expenses
 * @param {number} p.employmentIncome other PAYE income (tax already deducted)
 * @param {boolean} p.scotland
 * @param {'auto'|'expenses'|'allowance'} p.deduction
 */
export function selfEmployedTax({ turnover, expenses, employmentIncome = 0, scotland = false, deduction = 'auto', rates = RATES } = {}) {
  const best = bestDeduction(turnover, expenses, rates.tradingAllowance);
  let method = best.method;
  if (deduction === 'expenses' || deduction === 'allowance') method = deduction;
  const profit = method === 'allowance' ? best.profitWithAllowance : best.profitWithExpenses;
  const employment = clean(employmentIncome);

  const layered = taxLayers([{ amount: employment }, { amount: profit }], { region: scotland, rates });
  const taxOnEmployment = layered.layers[0].tax;
  const incomeTaxOnProfit = layered.layers[1].tax;
  const ni4 = class4(profit, rates);
  const total = round2(incomeTaxOnProfit + ni4);
  const poa = paymentsOnAccount(total, taxOnEmployment, rates);

  return {
    turnover: round2(clean(turnover)),
    method,
    autoMethod: best.method,
    profit: round2(profit),
    profitWithExpenses: best.profitWithExpenses,
    profitWithAllowance: best.profitWithAllowance,
    loss: best.loss,
    fullyCoveredByAllowance: best.fullyCoveredByAllowance,
    employmentIncome: round2(employment),
    personalAllowance: layered.personalAllowance,
    incomeTaxTotal: layered.tax,
    taxOnEmployment,
    incomeTax: incomeTaxOnProfit,
    incomeTaxBreakdown: layered.layers[1].breakdown,
    class4: ni4,
    class2: class2Status(profit, rates),
    total,
    takeHome: round2(profit - total),
    effectiveRate: profit > 0 ? total / profit : 0,
    monthlySetAside: round2(total / 12),
    paymentsOnAccount: poa
  };
}

/* ---------- 2. CIS refund ---------- */

/**
 * @param {number} p.gross        total paid by contractors before deductions (incl. materials)
 * @param {number} p.materials    cost of materials you bought for the jobs
 * @param {number} p.expenses     other allowable expenses
 * @param {number|''} p.cisDeducted  CIS actually deducted (blank = estimate from rate)
 * @param {'registered'|'unregistered'|'grossPayment'} p.status
 */
export function cisRefund({ gross, materials, expenses, cisDeducted, status = 'registered', employmentIncome = 0, scotland = false, rates = RATES } = {}) {
  const g = clean(gross);
  const m = Math.min(clean(materials), g);
  const labour = g - m;
  const rate = rates.cis[status] ?? rates.cis.registered;
  const estimated = isBlank(cisDeducted);
  const deducted = round2(estimated ? labour * rate : clean(cisDeducted));
  const se = selfEmployedTax({ turnover: g, expenses: m + clean(expenses), employmentIncome, scotland, rates });
  const balance = round2(deducted - se.total);
  return {
    labour: round2(labour),
    deducted,
    deductedEstimated: estimated,
    profit: se.profit,
    method: se.method,
    incomeTax: se.incomeTax,
    class4: se.class4,
    liability: se.total,
    refund: balance > 0 ? balance : 0,
    owed: balance < 0 ? -balance : 0,
    outcome: balance > 0 ? 'refund' : balance < 0 ? 'owed' : 'even'
  };
}

/* ---------- 3–5. service pricing ---------- */

/**
 * Generic price for one job or appointment.
 * price = (labour + direct costs + travel + share of overheads) × (1 + margin)
 */
export function jobPrice({ labourHours, hourlyRate, directCost = 0, travelMiles = 0, mileRate = RATES.mileage.carVan.firstRate, overheadsMonthly = 0, jobsPerMonth = 0, marginPct = 0, roundTo = 1 } = {}) {
  const labour = clean(labourHours) * clean(hourlyRate);
  const direct = clean(directCost);
  const travel = clean(travelMiles) * clean(mileRate);
  const jobs = clean(jobsPerMonth);
  const overhead = jobs > 0 ? clean(overheadsMonthly) / jobs : 0;
  const cost = labour + direct + travel + overhead;
  const margin = cost * pct(marginPct, 500);
  const price = cost + margin;
  const step = roundTo > 0 ? roundTo : 1;
  const rounded = Math.ceil(round2(price) / step) * step;
  return {
    labour: round2(labour),
    direct: round2(direct),
    travel: round2(travel),
    overhead: round2(overhead),
    breakEven: round2(direct + travel + overhead),
    cost: round2(cost),
    margin: round2(margin),
    price: round2(price),
    roundedPrice: round2(rounded),
    monthlyRevenue: round2(rounded * jobs)
  };
}

/** Hair, nails, lashes, brows, massage… price for one service. */
export function beautyServicePrice({ minutes, hourlyRate, productCost, overheadsMonthly, servicesPerMonth, marginPct } = {}) {
  const hours = clean(minutes) / 60;
  const r = jobPrice({ labourHours: hours, hourlyRate, directCost: productCost, overheadsMonthly, jobsPerMonth: servicesPerMonth, marginPct });
  return { ...r, hours, effectiveHourly: hours > 0 ? round2(r.roundedPrice / hours) : 0 };
}

/** Cleaning job: hours on site × cleaners, supplies, travel, overheads. */
export function cleaningJobPrice({ hours, cleaners = 1, payPerHour, supplies, travelMiles, overheadsMonthly, jobsPerMonth, marginPct, frequency = 'one-off' } = {}) {
  const h = clean(hours);
  const team = Math.max(1, Math.round(clean(cleaners)) || 1);
  const r = jobPrice({ labourHours: h * team, hourlyRate: payPerHour, directCost: supplies, travelMiles, overheadsMonthly, jobsPerMonth, marginPct });
  const visitsPerMonth = { weekly: 52 / 12, fortnightly: 26 / 12, monthly: 1, 'one-off': 0 }[frequency] ?? 0;
  return {
    ...r,
    team,
    pricePerHour: h > 0 ? round2(r.roundedPrice / h) : 0,
    visitsPerMonth: round2(visitsPerMonth),
    clientMonthly: round2(r.roundedPrice * visitsPerMonth)
  };
}

/** Dog walk or pet-sitting visit, split per dog/pet. */
export function petCarePrice({ minutes, travelMinutes = 0, hourlyRate, pets = 1, travelMiles, overheadsMonthly, visitsPerMonth, marginPct, extraCost = 0 } = {}) {
  const hours = (clean(minutes) + clean(travelMinutes)) / 60;
  const n = Math.max(1, Math.round(clean(pets)) || 1);
  const r = jobPrice({ labourHours: hours, hourlyRate, directCost: extraCost, travelMiles, overheadsMonthly, jobsPerMonth: visitsPerMonth, marginPct, roundTo: 0.5 });
  const perPet = Math.ceil((r.price / n) * 2) / 2; // round up to 50p
  return {
    ...r,
    hours: round2(hours),
    pets: n,
    pricePerPet: round2(perPet),
    visitTotal: round2(perPet * n),
    effectiveHourly: hours > 0 ? round2((perPet * n) / hours) : 0,
    monthlyRevenue: round2(perPet * n * clean(visitsPerMonth))
  };
}

/* ---------- 6. reseller checker ---------- */

/**
 * @param {number} p.sales        total received from sales in the calendar year
 * @param {number} p.salesCount   number of items sold in the calendar year
 * @param {number} p.costs        cost of stock, fees, postage, packaging
 * @param {number} p.tradingSigns number of "badges of trade" answered yes
 * @param {'declutter'|'trading'|'mixed'} p.activity
 */
export function resellerCheck({ sales, salesCount, costs, tradingSigns = 0, activity = 'declutter', rates = RATES } = {}) {
  const pr = rates.platformReporting;
  const s = clean(sales);
  const count = Math.floor(clean(salesCount));
  const reported = count >= pr.salesCount || s >= pr.approxGBP;
  const signs = Math.floor(clean(tradingSigns));
  const likelyTrading = activity === 'trading' || (activity === 'mixed' && signs > 0) || signs >= 2;
  const best = bestDeduction(s, costs, rates.tradingAllowance);
  const needsToRegister = likelyTrading && s > rates.tradingAllowance;
  return {
    reported,
    reportReason: count >= pr.salesCount ? 'count' : s >= pr.approxGBP ? 'value' : null,
    likelyTrading,
    needsToRegister,
    coveredByAllowance: likelyTrading && s <= rates.tradingAllowance,
    method: best.method,
    profit: best.profit,
    profitWithAllowance: best.profitWithAllowance,
    profitWithExpenses: best.profitWithExpenses
  };
}

/* ---------- 7. childminder ---------- */

export function childminderTax({ fees, fundedIncome, grants, expenses, homeCosts, homeUsePct, employmentIncome = 0, scotland = false, rates = RATES } = {}) {
  const turnover = clean(fees) + clean(fundedIncome) + clean(grants);
  const homeShare = clean(homeCosts) * pct(homeUsePct);
  const totalExpenses = clean(expenses) + homeShare;
  const se = selfEmployedTax({ turnover, expenses: totalExpenses, employmentIncome, scotland, rates });
  return { ...se, turnover: round2(turnover), homeShare: round2(homeShare), totalExpenses: round2(totalExpenses), monthlyTakeHome: round2(se.takeHome / 12) };
}

/* ---------- 8. landlord ---------- */

/** Earliest Making Tax Digital start date for one year's qualifying income. */
export function mtdStatus(qualifyingIncome, rates = RATES) {
  const q = clean(qualifyingIncome);
  const phase = rates.mtd.find((p) => q > p.over) || null;
  return {
    qualifyingIncome: round2(q),
    required: !!phase,
    startDate: phase ? phase.startDate : null,
    startLabel: phase ? phase.startLabel : null,
    threshold: phase ? phase.over : null
  };
}

function propertyYearTax({ profit, finance, otherIncome, region, year, rates }) {
  const newRates = year === '2027/28' && rates.property.from2027.regions.includes(region);
  const creditRate = newRates ? rates.property.from2027.financeCostCredit : rates.property.financeCostCredit;
  const layers = [{ amount: otherIncome }, { amount: profit, rates: newRates ? rates.property.from2027.rates : undefined }];
  const t = taxLayers(layers, { region, rates });
  const otherTax = t.layers[0].tax;
  const ani = clean(otherIncome) + clean(profit);
  const creditBase = Math.min(clean(finance), clean(profit), Math.max(0, ani - t.personalAllowance));
  const credit = round2(Math.min(creditBase * creditRate, t.tax));
  const totalTax = round2(t.tax - credit);
  return { totalTax, otherTax, propertyTax: round2(Math.max(0, totalTax - otherTax)), credit, creditRate, newRates };
}

/**
 * @param {number} p.rent       gross rent received
 * @param {number} p.expenses   allowable running costs (not mortgage interest)
 * @param {number} p.finance    mortgage interest and other finance costs
 * @param {number} p.otherIncome other taxable income (salary, pension, trading profit)
 * @param {'england'|'wales'|'scotland'|'ni'} p.region
 * @param {number} p.seTurnover gross self-employment turnover (for MTD only)
 */
export function landlordTax({ rent, expenses, finance, otherIncome = 0, region = 'england', seTurnover = 0, rates = RATES } = {}) {
  const r = clean(rent);
  const years = ['2026/27', '2027/28'].map((year) => {
    const withExpenses = Math.max(0, r - clean(expenses));
    const withAllowance = Math.max(0, r - Math.min(rates.propertyAllowance, r));
    const a = propertyYearTax({ profit: withExpenses, finance, otherIncome, region, year, rates });
    const b = propertyYearTax({ profit: withAllowance, finance: 0, otherIncome, region, year, rates });
    const useAllowance = b.propertyTax < a.propertyTax;
    const chosen = useAllowance ? b : a;
    return {
      year,
      method: useAllowance ? 'allowance' : 'expenses',
      profit: round2(useAllowance ? withAllowance : withExpenses),
      ...chosen,
      // What is left of the rent after real running costs, mortgage interest and tax on the rent.
      afterTax: round2(r - clean(expenses) - clean(finance) - chosen.propertyTax)
    };
  });
  return {
    rent: round2(r),
    years,
    current: years[0],
    next: years[1],
    change: round2(years[1].propertyTax - years[0].propertyTax),
    newRatesApply: years[1].newRates,
    mtd: mtdStatus(r + clean(seTurnover), rates)
  };
}

/* ---------- 9. Airbnb / holiday let / Rent a Room ---------- */

export function rentalReliefComparison({ income, expenses, ownHome = true, shared = false, otherIncome = 0, scotland = false, rates = RATES } = {}) {
  const inc = clean(income);
  const limit = shared ? rates.rentARoom.shared : rates.rentARoom.full;
  const taxFor = (taxable) => {
    const t = taxLayers([{ amount: otherIncome }, { amount: taxable }], { region: scotland, rates });
    return t.layers[1].tax;
  };
  const options = [
    { key: 'rentARoom', label: 'Rent a Room Scheme', available: !!ownHome, taxable: Math.max(0, inc - limit) },
    { key: 'propertyAllowance', label: '£1,000 property allowance', available: true, taxable: Math.max(0, inc - Math.min(rates.propertyAllowance, inc)) },
    { key: 'expenses', label: 'Actual expenses', available: true, taxable: Math.max(0, inc - clean(expenses)) }
  ].map((o) => ({ ...o, taxable: round2(o.taxable), tax: o.available ? taxFor(o.taxable) : null }));
  const usable = options.filter((o) => o.available);
  const best = usable.reduce((a, b) => (b.taxable < a.taxable ? b : a));
  const worst = usable.reduce((a, b) => (b.taxable > a.taxable ? b : a));
  return {
    income: round2(inc),
    rentARoomLimit: limit,
    options,
    best: best.key,
    bestTax: best.tax,
    saving: round2(worst.tax - best.tax),
    keep: round2(inc - clean(expenses) - best.tax),
    taxFree: best.taxable === 0
  };
}

/* ---------- 10–11. mileage and drivers ---------- */

export function mileageAllowance(miles, vehicle = 'car', rates = RATES) {
  const m = clean(miles);
  const r = rates.mileage;
  if (vehicle === 'motorcycle') return round2(m * r.motorcycle);
  if (vehicle === 'bicycle') return round2(m * r.bicycle);
  const first = Math.min(m, r.carVan.threshold);
  return round2(first * r.carVan.firstRate + (m - first) * r.carVan.laterRate);
}

/**
 * @param {'selfEmployed'|'employee'} p.mode
 * @param {number} p.employerPaid total mileage paid by an employer (employee mode)
 */
export function mileageClaim({ carMiles, motorcycleMiles, bicycleMiles, mode = 'selfEmployed', employerPaid = 0, rates = RATES } = {}) {
  const car = mileageAllowance(carMiles, 'car', rates);
  const motorcycle = mileageAllowance(motorcycleMiles, 'motorcycle', rates);
  const bicycle = mileageAllowance(bicycleMiles, 'bicycle', rates);
  const total = round2(car + motorcycle + bicycle);
  const paid = mode === 'employee' ? clean(employerPaid) : 0;
  const claimable = round2(Math.max(0, total - paid));
  const basic = rates.incomeTax.rUK.bands[0].rate;
  const higher = rates.incomeTax.rUK.bands[1].rate;
  return {
    car, motorcycle, bicycle, total,
    employerPaid: round2(paid),
    claimable,
    taxedExtra: round2(Math.max(0, paid - total)),
    savingBasic: round2(claimable * (basic + (mode === 'selfEmployed' ? rates.class4.mainRate : 0))),
    savingHigher: round2(claimable * (higher + (mode === 'selfEmployed' ? rates.class4.upperRate : 0)))
  };
}

/**
 * Taxi, private hire and delivery drivers: simplified mileage vs actual costs.
 * @param {'car'|'motorcycle'|'bicycle'} p.vehicle
 */
export function driverComparison({ fares, platformFees, otherExpenses, miles, vehicle = 'car', vehicleCosts, businessPct = 100, employmentIncome = 0, scotland = false, rates = RATES } = {}) {
  const base = clean(platformFees) + clean(otherExpenses);
  const mileage = mileageAllowance(miles, vehicle, rates);
  const actual = round2(clean(vehicleCosts) * pct(businessPct));
  const calc = (vehicleDeduction) => selfEmployedTax({ turnover: fares, expenses: base + vehicleDeduction, employmentIncome, scotland, deduction: 'expenses', rates });
  const m = calc(mileage);
  const a = calc(actual);
  // The method with the lower tax bill wins; your real spending is the same either way.
  const best = m.total <= a.total ? 'mileage' : 'actual';
  const cashBeforeTax = clean(fares) - base - clean(vehicleCosts);
  return {
    mileageDeduction: mileage,
    actualDeduction: actual,
    mileage: { ...m, cashTakeHome: round2(cashBeforeTax - m.total) },
    actual: { ...a, cashTakeHome: round2(cashBeforeTax - a.total) },
    best,
    difference: round2(Math.abs(m.total - a.total))
  };
}

/* ---------- 12. tutor hourly rate ---------- */

/** Total income tax + Class 4 on a self-employed profit (no other income). */
export function taxOnProfit(profit, scotland = false, rates = RATES) {
  return round2(incomeTax(profit, { scotland, rates }).tax + class4(profit, rates));
}

/** Profit needed to keep a given take-home after income tax and Class 4. */
export function profitForTakeHome(target, scotland = false, rates = RATES) {
  const t = clean(target);
  if (t === 0) return 0;
  let lo = t;
  let hi = t * 3 + 10000;
  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2;
    if (mid - taxOnProfit(mid, scotland, rates) < t) lo = mid; else hi = mid;
  }
  return round2(hi);
}

export function tutorRate({ targetTakeHome, weeks, hoursPerWeek, annualCosts, platformFeePct = 0, unpaidHoursPerWeek = 0, scotland = false, rates = RATES } = {}) {
  const profit = profitForTakeHome(targetTakeHome, scotland, rates);
  const tax = taxOnProfit(profit, scotland, rates);
  const fee = pct(platformFeePct, 90);
  const turnover = (profit + clean(annualCosts)) / (1 - fee);
  const paidHours = clean(weeks) * clean(hoursPerWeek);
  const allHours = paidHours + clean(weeks) * clean(unpaidHoursPerWeek);
  const hourly = paidHours > 0 ? turnover / paidHours : 0;
  return {
    profitNeeded: profit,
    tax,
    platformFees: round2(turnover * fee),
    turnoverNeeded: round2(turnover),
    paidHours: round2(paidHours),
    hourlyRate: round2(hourly),
    roundedRate: Math.ceil(round2(hourly)),
    takeHomePerWorkingHour: allHours > 0 ? round2(clean(targetTakeHome) / allHours) : 0
  };
}

/* ---------- 13. Universal Credit assessment periods ---------- */

function utc(y, m, d) { return new Date(Date.UTC(y, m, d)); }
function daysInMonth(y, m) { return utc(y, m + 1, 0).getUTCDate(); }
function addDays(date, n) { return new Date(date.getTime() + n * 86400000); }
export function isoDate(date) { return date.toISOString().slice(0, 10); }

/** Start date of the assessment period that begins in month m (0-based). Days 29–31 fall back to the month's last day. */
export function periodStartIn(y, m, startDay) {
  const day = Math.min(Math.max(1, Math.floor(startDay)), daysInMonth(y, m));
  return utc(y, m, day);
}

/**
 * Upcoming Universal Credit assessment periods for a self-employed claimant.
 * @param {number} startDay  day of the month the assessment period starts (1–31)
 * @param {Date|string} from the date to start from (the period containing it is first)
 * @param {number} count     how many periods to list
 */
export function ucPeriods(startDay, from = new Date(), count = 6) {
  const d = Math.floor(clean(startDay));
  if (d < 1 || d > 31) return [];
  const f = typeof from === 'string' ? new Date(from + 'T00:00:00Z') : utc(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  let y = f.getUTCFullYear();
  let m = f.getUTCMonth();
  if (f < periodStartIn(y, m, d)) { m -= 1; if (m < 0) { m = 11; y -= 1; } }
  const out = [];
  for (let i = 0; i < Math.max(0, Math.floor(count)); i += 1) {
    const start = periodStartIn(y, m, d);
    let ny = y; let nm = m + 1;
    if (nm > 11) { nm = 0; ny += 1; }
    const end = addDays(periodStartIn(ny, nm, d), -1);
    out.push({
      start: isoDate(start),
      end: isoDate(end),
      reportFrom: isoDate(addDays(end, -7)),
      reportBy: isoDate(addDays(end, 14)),
      paymentAround: isoDate(addDays(end, 7))
    });
    y = ny; m = nm;
  }
  return out;
}

/* ---------- 14. Making Tax Digital ---------- */

/**
 * @param {number|''} p.y2425 qualifying income 2024/25 (decides April 2026)
 * @param {number|''} p.y2526 qualifying income 2025/26 (decides April 2027) — blank = same as previous
 * @param {number|''} p.y2627 qualifying income 2026/27 (decides April 2028) — blank = same as previous
 */
export function mtdCheck({ y2425, y2526, y2627, rates = RATES } = {}) {
  const raw = [y2425, y2526, y2627];
  if (raw.every(isBlank)) return { required: false, empty: true, years: [] };
  const values = [];
  raw.forEach((v, i) => { values[i] = isBlank(v) ? (i > 0 ? values[i - 1] : 0) : clean(v); });
  const years = rates.mtd.map((phase, i) => ({
    basedOn: phase.basedOn,
    income: round2(values[i]),
    threshold: phase.over,
    startLabel: phase.startLabel,
    startDate: phase.startDate,
    over: values[i] > phase.over
  }));
  const first = years.find((y) => y.over) || null;
  return {
    required: !!first,
    empty: false,
    startLabel: first ? first.startLabel : null,
    startDate: first ? first.startDate : null,
    basedOn: first ? first.basedOn : null,
    years
  };
}
