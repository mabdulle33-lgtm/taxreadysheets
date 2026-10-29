/*
 * TaxReadySheets — EPC C by 2030 checker for private landlords (England & Wales).
 *
 * Every rule below comes from the government response "Improving the energy
 * performance of privately rented homes" (21 January 2026):
 * https://www.gov.uk/government/consultations/improving-the-energy-performance-of-privately-rented-homes-2025-update
 * The new standard still needs regulations (expected 2027), so treat it as the
 * confirmed policy, not yet law. Edit EPC_RULES if anything changes.
 */

export const EPC_RULES = {
  sourceDate: '2026-01-21',
  deadline: '2030-10-01',          // all tenancies must meet the higher standard
  grandfatherBefore: '2029-10-01', // EER C+ on an EPC lodged before this date counts until it expires
  spendCountsFrom: '2025-10-01',   // qualifying spend from this date counts towards the cap
  costCap: 10000,                  // per property, over 10 years
  lowValueThreshold: 100000,       // under this value the cap is 10% of the value
  lowValueCapShare: 0.1,
  currentMinimumBand: 'E',         // today's legal minimum until the new standard applies
  maxPenalty: 30000,               // per property, per breach (new regime)
  epcValidYears: 10,
  exemptionYears: { highCost: 5, allDone: 5, costCap: 10, valueAdjustment: 10, solidWall: 5, negativeImpacts: 10, consent: 5, newLandlordMonths: 6 }
};

/** EER score → band, using the standard EPC bands. */
export const BANDS = [
  { band: 'A', min: 92 }, { band: 'B', min: 81 }, { band: 'C', min: 69 },
  { band: 'D', min: 55 }, { band: 'E', min: 39 }, { band: 'F', min: 21 }, { band: 'G', min: 1 }
];
const ORDER = 'ABCDEFG';

export function bandFromScore(score) {
  const s = Number(score);
  if (!Number.isFinite(s) || s < 1) return null;
  return (BANDS.find((b) => s >= b.min) || BANDS[BANDS.length - 1]).band;
}

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[£,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** 'YYYY-MM' or 'YYYY-MM-DD' → Date (UTC midnight), or null. */
function parseDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 1));
  return Number.isNaN(d.getTime()) ? null : d;
}
const iso = (d) => d.toISOString().slice(0, 10);
const addYears = (d, y) => new Date(Date.UTC(d.getUTCFullYear() + y, d.getUTCMonth(), d.getUTCDate()));
const daysBetween = (a, b) => Math.round((b - a) / 86400000);

/** £10,000, or 10% of the value when the home is worth under £100,000. */
export function costCap(propertyValue, rules = EPC_RULES) {
  const v = num(propertyValue);
  if (v > 0 && v < rules.lowValueThreshold) return Math.round(v * rules.lowValueCapShare * 100) / 100;
  return rules.costCap;
}

/**
 * Work out where one rented home stands.
 * input: { nation, letType, band, score, epcDate, value, spent, planned, today }
 *  - band: 'A'..'G' or '' (score wins if both given)
 *  - epcDate: 'YYYY-MM' the current EPC was lodged
 *  - spent: qualifying spend since 1 Oct 2025 (grants count, Boiler Upgrade Scheme does not)
 *  - planned: estimated cost of the works still needed to reach C
 */
export function epcCheck(input = {}, rules = EPC_RULES) {
  const today = parseDate(input.today) || new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const deadline = parseDate(rules.deadline);
  const grandfather = parseDate(rules.grandfatherBefore);
  const nation = input.nation || 'england';
  const letType = input.letType || 'tenancy';

  const scoreBand = bandFromScore(input.score);
  const band = scoreBand || (ORDER.includes(String(input.band || '').toUpperCase()) && input.band ? String(input.band).toUpperCase() : null);
  const score = scoreBand ? Math.round(Number(input.score)) : null;

  const cap = costCap(input.value, rules);
  const lowValue = cap < rules.costCap;
  const spent = num(input.spent);
  const planned = num(input.planned);
  const capLeft = Math.max(0, cap - spent);
  const daysLeft = Math.max(0, daysBetween(today, deadline));

  const epcDate = parseDate(input.epcDate);
  const epcExpiry = epcDate ? addYears(epcDate, rules.epcValidYears) : null;

  const out = {
    band, score, cap, lowValue, spent, planned, capLeft, daysLeft,
    deadline: rules.deadline, epcExpiry: epcExpiry ? iso(epcExpiry) : null,
    pointsToC: score != null && score < 69 ? 69 - score : 0,
    status: 'unknown', inScope: true, lettableNow: true, notes: [], steps: []
  };

  if (nation === 'scotland' || nation === 'ni') {
    out.inScope = false;
    out.status = 'other-nation';
    return out;
  }
  if (letType === 'holiday' || letType === 'social') {
    out.inScope = false;
    out.status = letType === 'holiday' ? 'holiday-let' : 'social';
    return out;
  }

  if (!band) {
    out.status = 'need-epc';
    out.steps.push('Look up your rating on the GOV.UK "Find an energy certificate" service, or book an EPC if you have none.');
    return out;
  }

  // Today's rule: F and G cannot be let without a registered exemption.
  if (band === 'F' || band === 'G') {
    out.lettableNow = false;
    out.notes.push(`An ${band} rating is already below today's legal minimum of ${rules.currentMinimumBand}. You cannot start or continue a tenancy without improving it or registering an exemption.`);
  }

  const atC = ORDER.indexOf(band) <= ORDER.indexOf('C');
  if (atC) {
    if (epcDate && epcDate < grandfather) {
      if (epcExpiry >= deadline) {
        out.status = 'compliant-until-expiry';
      } else {
        out.status = 'renew-before-deadline';
      }
    } else if (epcDate) {
      out.status = 'new-metrics';
    } else {
      out.status = 'c-check-date';
    }
  } else {
    if (planned > 0 && planned > capLeft) out.status = 'cap-exemption-likely';
    else out.status = 'upgrade-needed';
  }

  // Steps
  if (out.status === 'compliant-until-expiry') {
    out.steps.push(`Keep this EPC: an EER of C or above on a certificate lodged before ${rules.grandfatherBefore.slice(0, 4)} counts as compliant until it expires (${iso(epcExpiry)}).`);
    out.steps.push('Diary the expiry date. The next EPC will use the new metrics, so plan any upgrades before then.');
  } else if (out.status === 'renew-before-deadline') {
    out.steps.push(`This EPC expires on ${iso(epcExpiry)}, before the 1 October 2030 deadline. A rating of C now only protects you until then.`);
    out.steps.push('Consider getting a fresh EPC before October 2029 while the home still rates C — it would then count as compliant for its full 10 years.');
  } else if (out.status === 'new-metrics' || out.status === 'c-check-date') {
    out.steps.push('A C rating only counts under the grandfathering rule if the EPC was lodged before 1 October 2029. Check the date on your certificate.');
    out.steps.push('EPCs lodged later will be judged on the new fabric performance standard plus heating system or smart readiness.');
  } else {
    out.steps.push(`Get quotes for the measures your EPC recommends, starting with insulation (the new standard is led by fabric performance).`);
    out.steps.push(`Keep every invoice and grant letter from 1 October 2025 — that spending counts towards your ${lowValue ? 'reduced ' : ''}cap.`);
    if (out.status === 'cap-exemption-likely') {
      out.steps.push(`Your planned works (${planned.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })}) are more than you have left under the cap. Once you have spent up to the cap, you can register a cost cap exemption, which lasts ${rules.exemptionYears.costCap} years.`);
    }
    out.steps.push('Book a post-works EPC before 1 October 2030 to prove the home now meets the standard.');
  }
  return out;
}
