// Run with: node --test
// Expected results worked out by hand from the 21 January 2026 government response.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { epcCheck, costCap, bandFromScore, EPC_RULES } from '../assets/js/epc.js';

const TODAY = '2026-10-29';

test('rules match the January 2026 government response', () => {
  assert.equal(EPC_RULES.deadline, '2030-10-01');
  assert.equal(EPC_RULES.grandfatherBefore, '2029-10-01');
  assert.equal(EPC_RULES.spendCountsFrom, '2025-10-01');
  assert.equal(EPC_RULES.costCap, 10000);
  assert.equal(EPC_RULES.lowValueThreshold, 100000);
  assert.equal(EPC_RULES.maxPenalty, 30000);
});

test('bands from EER score', () => {
  assert.equal(bandFromScore(92), 'A');
  assert.equal(bandFromScore(81), 'B');
  assert.equal(bandFromScore(80), 'C');
  assert.equal(bandFromScore(69), 'C');
  assert.equal(bandFromScore(68), 'D');
  assert.equal(bandFromScore(55), 'D');
  assert.equal(bandFromScore(54), 'E');
  assert.equal(bandFromScore(39), 'E');
  assert.equal(bandFromScore(38), 'F');
  assert.equal(bandFromScore(21), 'F');
  assert.equal(bandFromScore(20), 'G');
  assert.equal(bandFromScore(''), null);
  assert.equal(bandFromScore(0), null);
});

test('cost cap: £10,000, or 10% of value under £100,000', () => {
  assert.equal(costCap(''), 10000);
  assert.equal(costCap(250000), 10000);
  assert.equal(costCap(100000), 10000); // not under £100k
  assert.equal(costCap(80000), 8000);
  assert.equal(costCap(99999), 9999.9);
});

test('days to deadline from 29 Oct 2026', () => {
  // 29 Oct 2026 → 1 Oct 2030: 1,433 days (2027 + 2029 non-leap, 2028 leap)
  const r = epcCheck({ band: 'D', today: TODAY });
  assert.equal(r.daysLeft, 1433);
});

test('D-rated home, no spend: upgrade needed, full cap left', () => {
  const r = epcCheck({ score: 60, today: TODAY });
  assert.equal(r.band, 'D');
  assert.equal(r.pointsToC, 9);
  assert.equal(r.status, 'upgrade-needed');
  assert.equal(r.capLeft, 10000);
  assert.equal(r.lettableNow, true);
});

test('planned works over what is left of the cap → cost cap exemption likely', () => {
  const r = epcCheck({ band: 'E', spent: 3000, planned: 9000, today: TODAY });
  assert.equal(r.capLeft, 7000);
  assert.equal(r.status, 'cap-exemption-likely');
  assert.ok(r.steps.some((s) => /10 years/.test(s)));
});

test('low-value home uses the reduced cap', () => {
  const r = epcCheck({ band: 'D', value: 75000, spent: 2000, planned: 6000, today: TODAY });
  assert.equal(r.cap, 7500);
  assert.equal(r.lowValue, true);
  assert.equal(r.capLeft, 5500);
  assert.equal(r.status, 'cap-exemption-likely');
});

test('F and G cannot be let today', () => {
  assert.equal(epcCheck({ band: 'F', today: TODAY }).lettableNow, false);
  assert.equal(epcCheck({ band: 'G', today: TODAY }).lettableNow, false);
  assert.equal(epcCheck({ band: 'E', today: TODAY }).lettableNow, true);
});

test('C on an EPC lodged before Oct 2029 that outlasts the deadline is compliant until expiry', () => {
  const r = epcCheck({ band: 'C', epcDate: '2024-03', today: TODAY });
  assert.equal(r.status, 'compliant-until-expiry');
  assert.equal(r.epcExpiry, '2034-03-01');
});

test('C on an EPC that expires before the deadline needs renewing', () => {
  const r = epcCheck({ band: 'B', epcDate: '2019-06', today: TODAY });
  assert.equal(r.status, 'renew-before-deadline');
  assert.equal(r.epcExpiry, '2029-06-01');
});

test('C on an EPC lodged after the grandfathering date is judged on the new metrics', () => {
  assert.equal(epcCheck({ band: 'C', epcDate: '2029-11', today: TODAY }).status, 'new-metrics');
  assert.equal(epcCheck({ band: 'C', today: TODAY }).status, 'c-check-date');
});

test('out of scope: Scotland, Northern Ireland, holiday lets, social housing', () => {
  assert.equal(epcCheck({ nation: 'scotland', band: 'D' }).inScope, false);
  assert.equal(epcCheck({ nation: 'ni', band: 'D' }).inScope, false);
  assert.equal(epcCheck({ letType: 'holiday', band: 'D' }).status, 'holiday-let');
  assert.equal(epcCheck({ letType: 'social', band: 'D' }).status, 'social');
});

test('no rating entered asks for the EPC', () => {
  assert.equal(epcCheck({ today: TODAY }).status, 'need-epc');
});
