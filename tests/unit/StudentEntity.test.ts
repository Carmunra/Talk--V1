import { test, describe } from 'node:test';
import assert from 'node:assert';
import { StudentEntity } from '../../src/domain/entities/StudentEntity';
import { Money } from '../../src/domain/value-objects/Money';
import { InsufficientFundsError, ValidationError } from '../../src/domain/errors/DomainError';
import { ProficiencyLevel, LearningGoal } from '../../src/domain/types';

describe('StudentEntity Domain Entity', () => {
  test('creates student entity and exposes wallet Money VO', () => {
    const student = new StudentEntity({
      id: 'std-100',
      name: 'João Silva',
      email: 'joao@talke.com',
      walletBalanceBrl: 150.0,
      totalLessonsCompleted: 3,
      createdAt: new Date().toISOString(),
    });

    assert.strictEqual(student.id, 'std-100');
    assert.strictEqual(student.walletMoney.amountBrl, 150.0);
    assert.strictEqual(student.canAfford(Money.fromBrl(100)), true);
    assert.strictEqual(student.canAfford(Money.fromBrl(200)), false);
  });

  test('credits and debits wallet maintaining exact balance', () => {
    const student = new StudentEntity({
      id: 'std-100',
      name: 'João Silva',
      email: 'joao@talke.com',
      walletBalanceBrl: 100.0,
      totalLessonsCompleted: 0,
      createdAt: new Date().toISOString(),
    });

    student.creditWallet(Money.fromBrl(50));
    assert.strictEqual(student.walletBalanceBrl, 150.0);

    student.debitWallet(Money.fromBrl(60));
    assert.strictEqual(student.walletBalanceBrl, 90.0);
  });

  test('throws InsufficientFundsError when debit exceeds balance', () => {
    const student = new StudentEntity({
      id: 'std-100',
      name: 'João Silva',
      email: 'joao@talke.com',
      walletBalanceBrl: 30.0,
      totalLessonsCompleted: 0,
      createdAt: new Date().toISOString(),
    });

    assert.throws(() => {
      student.debitWallet(Money.fromBrl(50));
    }, InsufficientFundsError);
  });

  test('updates diagnostic information correctly', () => {
    const student = new StudentEntity({
      id: 'std-100',
      name: 'João Silva',
      email: 'joao@talke.com',
      walletBalanceBrl: 0,
      totalLessonsCompleted: 0,
      createdAt: new Date().toISOString(),
    });

    student.updateDiagnostic(
      ProficiencyLevel.B2_Upper_Intermediate,
      LearningGoal.Career,
      'Entrevistas internacionais'
    );

    assert.strictEqual(student.hasCompletedDiagnostic, true);
    assert.strictEqual(student.level, ProficiencyLevel.B2_Upper_Intermediate);
    assert.strictEqual(student.goal, LearningGoal.Career);
  });

  test('throws ValidationError if missing mandatory fields', () => {
    assert.throws(() => {
      new StudentEntity({
        id: '',
        name: 'Invalido',
        email: 'inv@talke.com',
        walletBalanceBrl: 0,
        totalLessonsCompleted: 0,
        createdAt: new Date().toISOString(),
      });
    }, ValidationError);
  });
});
