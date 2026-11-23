import test from 'node:test';
import assert from 'node:assert/strict';
import { sumDaily, sumLastDays } from '../src/stats.js';

function days(...downloads) {
  return downloads.map((downloads, i) => ({ day: `2026-01-${String(i + 1).padStart(2, '0')}`, downloads }));
}

test('sumDaily sums every daily entry', () => {
  assert.equal(sumDaily(days(1, 2, 3)), 6);
});

test('sumDaily ignores missing or non-numeric entries', () => {
  assert.equal(sumDaily([]), 0);
  assert.equal(sumDaily([{}, { downloads: 'x' }, { downloads: 4 }]), 4);
});

test('sumLastDays sums only the last n entries', () => {
  assert.equal(sumLastDays(days(1, 2, 3, 4), 2), 7);
});

test('sumLastDays returns the full total when fewer entries than n', () => {
  assert.equal(sumLastDays(days(5, 6), 30), 11);
});

test('7-day and 30-day windows over a 40-day range', () => {
  const daily = days(...Array.from({ length: 40 }, (_, i) => i + 1));
  assert.equal(sumDaily(daily), 820);
  assert.equal(sumLastDays(daily, 7), 259);
  assert.equal(sumLastDays(daily, 30), 765);
});
