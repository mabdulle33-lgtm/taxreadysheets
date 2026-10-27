import { bindForm, setOuts, gbp, chart } from '../ui.js';
import { beautyServicePrice } from '../calc.js';

bindForm('calc', (v) => {
  const r = beautyServicePrice({
    minutes: v.minutes,
    hourlyRate: v.hourlyRate,
    productCost: v.productCost,
    overheadsMonthly: v.overheads,
    servicesPerMonth: v.servicesPerMonth,
    marginPct: v.margin
  });
  setOuts({
    price: gbp(r.roundedPrice),
    labour: gbp(r.labour),
    product: gbp(r.direct),
    overhead: gbp(r.overhead),
    cost: gbp(r.cost),
    margin: gbp(r.margin),
    exact: gbp(r.price),
    hourly: gbp(r.effectiveHourly),
    breakEven: gbp(r.breakEven),
    monthly: gbp(r.monthlyRevenue),
    note: r.price === 0
      ? 'Enter the service length and your hourly rate to see a price.'
      : `Charging less than ${gbp(r.cost)} means paying yourself under your target rate. Below ${gbp(r.breakEven)} you lose money on every client.`
  });
  chart([
    { label: 'Your time', value: r.labour, tone: 4 },
    { label: 'Products', value: r.direct, tone: 1 },
    { label: 'Running costs', value: r.overhead, tone: 5 },
    { label: 'Profit margin', value: r.margin, tone: 2 }
  ], { value: gbp(r.price), label: 'per service' });
});
