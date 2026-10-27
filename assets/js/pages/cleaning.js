import { bindForm, setOuts, gbp, chart } from '../ui.js';
import { cleaningJobPrice } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

bindForm('calc', (v) => {
  const r = cleaningJobPrice({
    hours: v.hours,
    cleaners: v.cleaners,
    payPerHour: v.pay,
    supplies: v.supplies,
    travelMiles: v.miles,
    mileRate: RATES.mileage.carVan.firstRate,
    overheadsMonthly: v.overheads,
    jobsPerMonth: v.jobsPerMonth,
    marginPct: v.margin,
    frequency: v.frequency
  });
  setOuts({
    price: gbp(r.roundedPrice),
    labour: gbp(r.labour),
    supplies: gbp(r.direct),
    travel: gbp(r.travel),
    overhead: gbp(r.overhead),
    cost: gbp(r.cost),
    margin: gbp(r.margin),
    perHour: gbp(r.pricePerHour),
    clientMonthly: v.frequency === 'one-off' ? 'One-off' : gbp(r.clientMonthly),
    note: r.price === 0
      ? 'Enter the hours and pay to see a quote.'
      : `Do not go below ${gbp(r.cost)} for this clean — that is your break-even with wages paid. Supplies, travel and overheads alone come to ${gbp(r.breakEven)}.`
  });
  chart([
    { label: 'Wages', value: r.labour, tone: 4 },
    { label: 'Supplies', value: r.direct, tone: 1 },
    { label: 'Travel', value: r.travel, tone: 5 },
    { label: 'Business costs', value: r.overhead, tone: 6 },
    { label: 'Profit margin', value: r.margin, tone: 2 }
  ], { value: gbp(r.price), label: 'per clean' });
});
