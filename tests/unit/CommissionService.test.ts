import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CommissionService } from '../../src/domain/services/commissionService';
import { ValidationError } from '../../src/domain/errors/DomainError';

describe('CommissionService Domain Service', () => {
  test('calculates 15% platform split correctly for standard hourly rate', () => {
    const split = CommissionService.calculateCommission(100);
    assert.strictEqual(split.grossAmountBrl, 100);
    assert.strictEqual(split.platformFeeBrl, 15);
    assert.strictEqual(split.teacherNetBrl, 85);
    assert.strictEqual(split.platformRate, 0.15);
  });

  test('handles fractional cents with correct rounding', () => {
    const split = CommissionService.calculateCommission(85.5);
    // 85.50 * 0.15 = 12.825 -> rounded to 12.83
    assert.strictEqual(split.platformFeeBrl, 12.83);
    assert.strictEqual(split.teacherNetBrl, 72.67);
    assert.strictEqual(Math.round((split.platformFeeBrl + split.teacherNetBrl) * 100) / 100, 85.5);
  });

  test('throws ValidationError when gross amount is zero or negative', () => {
    assert.throws(() => {
      CommissionService.calculateCommission(0);
    }, ValidationError);

    assert.throws(() => {
      CommissionService.calculateCommission(-50);
    }, ValidationError);
  });

  test('rejects invalid commission rates', () => {
    for (const rate of [NaN, Infinity, -0.1, 1.1])
      assert.throws(() => CommissionService.calculateCommission(100, rate), ValidationError);
  });
});
