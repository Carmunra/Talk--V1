import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TimeSlot } from '../../src/domain/value-objects/TimeSlot';
import { ValidationError } from '../../src/domain/errors/DomainError';

describe('TimeSlot Value Object', () => {
  test('creates a valid time slot and calculates duration in minutes', () => {
    const slot = new TimeSlot('09:00', '10:30');
    assert.strictEqual(slot.startTime, '09:00');
    assert.strictEqual(slot.endTime, '10:30');
    assert.strictEqual(slot.durationMinutes, 90);
  });

  test('validates format (HH:mm)', () => {
    assert.throws(() => {
      new TimeSlot('9:00', '10:00');
    }, ValidationError);

    assert.throws(() => {
      new TimeSlot('09:00', '25:00');
    }, ValidationError);
  });

  test('throws if endTime is before or equal to startTime', () => {
    assert.throws(() => {
      new TimeSlot('10:00', '09:00');
    }, ValidationError);

    assert.throws(() => {
      new TimeSlot('10:00', '10:00');
    }, ValidationError);
  });

  test('detects overlapping time slots', () => {
    const slotA = new TimeSlot('10:00', '11:00');
    const slotB = new TimeSlot('10:30', '11:30');
    const slotC = new TimeSlot('11:00', '12:00');

    assert.strictEqual(slotA.overlapsWith(slotB), true);
    assert.strictEqual(slotB.overlapsWith(slotA), true);
    assert.strictEqual(slotA.overlapsWith(slotC), false); // Boundary adjacent, not overlapping
  });

  test('containsTime returns true if time falls within interval', () => {
    const slot = new TimeSlot('14:00', '15:00');
    assert.strictEqual(slot.containsTime('14:00'), true);
    assert.strictEqual(slot.containsTime('14:30'), true);
    assert.strictEqual(slot.containsTime('15:00'), false);
    assert.strictEqual(slot.containsTime('13:59'), false);
  });
});
