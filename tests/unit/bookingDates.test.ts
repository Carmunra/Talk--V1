import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingDates } from '../../src/lib/bookingDates';

test('booking dates use the Brazilian calendar across UTC midnight and year boundaries', () => {
  const dates = bookingDates(new Date('2027-01-01T01:30:00Z'));
  assert.equal(dates[0].dateStr, '2027-01-01');
  assert.equal(dates[0].dayOfWeek, 5);
  assert.match(dates[0].label, /01\/01/);
  assert.equal(dates.at(-1)?.dateStr, '2027-01-07');
  const afterBrazilianMidnight = bookingDates(new Date('2027-01-01T03:30:00Z'));
  assert.equal(afterBrazilianMidnight[0].dateStr, '2027-01-02');
});
