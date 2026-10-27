import { bindForm, setOuts, gbp, chart } from '../ui.js';
import { petCarePrice } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

const words = {
  walk: { head: 'Price per dog', cost: 'Total cost of the walk', takings: 'Takings from this walk', unit: 'walk' },
  visit: { head: 'Price per pet', cost: 'Total cost of the visit', takings: 'Takings from this visit', unit: 'visit' },
  stay: { head: 'Price per pet for the stay', cost: 'Total cost of the stay', takings: 'Takings from this stay', unit: 'stay' }
};

function setLabel(key, text) {
  const dd = document.querySelector(`[data-out="${key}"]`);
  const dt = dd && dd.previousElementSibling;
  if (dt) dt.textContent = text;
}

bindForm('calc', (v) => {
  const w = words[v.service] || words.walk;
  const r = petCarePrice({
    minutes: v.minutes,
    travelMinutes: v.travelMinutes,
    hourlyRate: v.hourlyRate,
    pets: v.pets,
    travelMiles: v.miles,
    mileRate: RATES.mileage.carVan.firstRate,
    overheadsMonthly: v.overheads,
    visitsPerMonth: v.visits,
    marginPct: v.margin,
    extraCost: v.extraCost
  });
  const label = document.querySelector('#results .big-label');
  if (label) label.textContent = w.head;
  setLabel('cost', w.cost);
  setLabel('visitTotal', w.takings);
  setOuts({
    perPet: gbp(r.pricePerPet),
    labour: gbp(r.labour),
    travel: gbp(r.travel),
    extras: gbp(r.direct),
    overhead: gbp(r.overhead),
    cost: gbp(r.cost),
    visitTotal: gbp(r.visitTotal),
    hourly: gbp(r.effectiveHourly),
    monthly: gbp(r.monthlyRevenue),
    note: r.price === 0
      ? 'Enter the length of the walk or visit and your hourly rate to see a price.'
      : r.pets > 1
        ? `Each of the ${r.pets} owners pays ${gbp(r.pricePerPet)}. Doing the same ${w.unit} for one animal alone would need ${gbp(Math.ceil(r.price * 2) / 2)}.`
        : `This is the price for one animal. Adding more to the same ${w.unit} lowers each owner's share while raising your hourly earnings.`
  });
  chart([
    { label: 'Your time', value: r.labour, tone: 4 },
    { label: 'Travel', value: r.travel, tone: 5 },
    { label: 'Extras', value: r.direct, tone: 1 },
    { label: 'Business costs', value: r.overhead, tone: 6 },
    { label: 'Profit margin', value: r.margin, tone: 2 }
  ], { value: gbp(r.price), label: `per ${w.unit}` });
});
