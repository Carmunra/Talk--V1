import { ProficiencyLevel, LearningGoal, Student } from '../types';
import { Money } from '../value-objects/Money';
import { InsufficientFundsError, ValidationError } from '../errors/DomainError';

export class StudentEntity implements Student {
  public id: string;
  public name: string;
  public email: string;
  public avatarUrl?: string;
  public level?: ProficiencyLevel;
  public goal?: LearningGoal;
  public goalDescription?: string;
  public hasCompletedDiagnostic: boolean;
  public walletBalanceBrl: number;
  public totalLessonsCompleted: number;
  public createdAt: string;

  constructor(data: Student) {
    if (!data.id || !data.name || !data.email) {
      throw new ValidationError('Estudante deve possuir ID, nome e e-mail válidos.');
    }
    this.id = data.id;
    this.name = data.name.trim();
    this.email = data.email.trim().toLowerCase();
    this.avatarUrl = data.avatarUrl;
    this.level = data.level;
    this.goal = data.goal;
    this.goalDescription = data.goalDescription;
    this.hasCompletedDiagnostic = data.hasCompletedDiagnostic ?? false;
    this.walletBalanceBrl = Number(data.walletBalanceBrl) || 0;
    this.totalLessonsCompleted = Number(data.totalLessonsCompleted) || 0;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  public get walletMoney(): Money {
    return Money.fromBrl(this.walletBalanceBrl);
  }

  public canAfford(amount: Money): boolean {
    return this.walletMoney.isGreaterThanOrEqual(amount);
  }

  public debitWallet(amount: Money): void {
    if (!this.canAfford(amount)) {
      throw new InsufficientFundsError(amount.amountBrl, this.walletBalanceBrl);
    }
    this.walletBalanceBrl = this.walletMoney.subtract(amount).amountBrl;
  }

  public creditWallet(amount: Money): void {
    if (!amount.isPositive()) {
      throw new ValidationError('Valor a recarregar deve ser maior que zero.');
    }
    this.walletBalanceBrl = this.walletMoney.add(amount).amountBrl;
  }

  public completeLesson(): void {
    this.totalLessonsCompleted += 1;
  }

  public updateDiagnostic(level: ProficiencyLevel, goal: LearningGoal, goalDescription?: string): void {
    this.level = level;
    this.goal = goal;
    if (goalDescription !== undefined) {
      this.goalDescription = goalDescription;
    }
    this.hasCompletedDiagnostic = true;
  }

  public toJSON(): Student {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      avatarUrl: this.avatarUrl,
      level: this.level,
      goal: this.goal,
      goalDescription: this.goalDescription,
      hasCompletedDiagnostic: this.hasCompletedDiagnostic,
      walletBalanceBrl: this.walletBalanceBrl,
      totalLessonsCompleted: this.totalLessonsCompleted,
      createdAt: this.createdAt,
    };
  }
}
