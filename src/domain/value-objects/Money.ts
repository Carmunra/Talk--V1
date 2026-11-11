import { ValidationError } from '../errors/DomainError';

/**
 * Value Object: Money (BRL)
 * Enforces financial domain invariants, rounding, and formatting.
 */
export class Money {
  private readonly _amountInCents: number;

  private constructor(amountInCents: number) {
    if (!Number.isFinite(amountInCents)) {
      throw new ValidationError('Valor monetário inválido.');
    }
    this._amountInCents = Math.round(amountInCents);
  }

  public static fromBrl(amountBrl: number): Money {
    return new Money(amountBrl * 100);
  }

  public static fromCents(cents: number): Money {
    return new Money(cents);
  }

  public static zero(): Money {
    return new Money(0);
  }

  public get amountBrl(): number {
    return this._amountInCents / 100;
  }

  public get cents(): number {
    return this._amountInCents;
  }

  public add(other: Money): Money {
    return new Money(this._amountInCents + other._amountInCents);
  }

  public subtract(other: Money): Money {
    const result = this._amountInCents - other._amountInCents;
    return new Money(result);
  }

  public multiply(multiplier: number): Money {
    return new Money(this._amountInCents * multiplier);
  }

  public percentage(pct: number): Money {
    return new Money(this._amountInCents * pct);
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    return this._amountInCents >= other._amountInCents;
  }

  public isLessThan(other: Money): boolean {
    return this._amountInCents < other._amountInCents;
  }

  public isPositive(): boolean {
    return this._amountInCents > 0;
  }

  public equals(other: Money): boolean {
    return this._amountInCents === other._amountInCents;
  }

  public formatBrl(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.amountBrl);
  }

  public toJSON(): number {
    return this.amountBrl;
  }
}
