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
    const split = CommissionService.calculateCommission(85.50);
    // 85.50 * 0.15 = 12.825 -> rounded to 12.83
    assert.strictEqual(split.platformFeeBrl, 12.83);
    assert.strictEqual(split.teacherNetBrl, 72.67);
    assert.strictEqual(Math.round((split.platformFeeBrl + split.teacherNetBrl) * 100) / 100, 85.50);
  });

  test('throws ValidationError when gross amount is zero or negative', () => {
    assert.throws(() => {
      CommissionService.calculateCommission(0);
    }, ValidationError);

    assert.throws(() => {
      CommissionService.calculateCommission(-50);
    }, ValidationError);
  });

  test('generates valid simulated PIX copy & paste and payload', () => {
    const pix = CommissionService.generatePixData(120.0, 'tx-test-123');
    assert.ok(pix.pixCopyPaste.startsWith('00020126580014br.gov.bcb.pix'));
    assert.ok(pix.pixCopyPaste.includes('120.00'));
    assert.ok(pix.pixQrCode.length > 10);
  });
});
