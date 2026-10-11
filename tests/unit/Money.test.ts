import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Money } from '../../src/domain/value-objects/Money';
import { ValidationError } from '../../src/domain/errors/DomainError';

describe('Money Value Object', () => {
  test('creates money from BRL amount accurately converting to cents', () => {
    const m = Money.fromBrl(150.5);
    assert.strictEqual(m.cents, 15050);
    assert.strictEqual(m.amountBrl, 150.5);
  });

  test('formats BRL currency correctly', () => {
    const m = Money.fromBrl(120);
    const formatted = m.formatBrl();
    assert.ok(formatted.includes('120'));
    assert.ok(formatted.includes('R$'));
  });

  test('performs exact addition and subtraction without floating point issues', () => {
    const a = Money.fromBrl(0.1);
    const b = Money.fromBrl(0.2);
    const sum = a.add(b);
    assert.strictEqual(sum.amountBrl, 0.3);
    assert.strictEqual(sum.cents, 30);

    const sub = sum.subtract(a);
    assert.strictEqual(sub.amountBrl, 0.2);
  });

  test('calculates percentages correctly', () => {
    const total = Money.fromBrl(100);
    const commission = total.percentage(0.15); // 15% Talke fee
    assert.strictEqual(commission.amountBrl, 15);
    assert.strictEqual(commission.cents, 1500);
  });

  test('compares values correctly', () => {
    const m1 = Money.fromBrl(50);
    const m2 = Money.fromBrl(100);
    assert.ok(m2.isGreaterThanOrEqual(m1));
    assert.ok(m1.isLessThan(m2));
    assert.strictEqual(m1.equals(Money.fromBrl(50)), true);
  });

  test('throws ValidationError on non-finite amounts', () => {
    assert.throws(() => {
      Money.fromBrl(NaN);
    }, ValidationError);
  });
});
