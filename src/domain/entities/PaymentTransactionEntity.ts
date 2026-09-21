import { PaymentTransaction, PaymentMethod, PaymentStatus } from '../types';
import { Money } from '../value-objects/Money';
import { ValidationError } from '../errors/DomainError';

export class PaymentTransactionEntity implements PaymentTransaction {
  public id: string;
  public lessonId?: string;
  public studentId: string;
  public studentName: string;
  public amountBrl: number;
  public platformFeeBrl: number;
  public teacherNetBrl: number;
  public method: PaymentMethod;
  public status: PaymentStatus;
  public pixQrCode?: string;
  public pixCopyPaste?: string;
  public createdAt: string;

  constructor(data: PaymentTransaction) {
    if (!data.id || !data.studentId) {
      throw new ValidationError('Transação financeira inválida.');
    }
    this.id = data.id;
    this.lessonId = data.lessonId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.amountBrl = Number(data.amountBrl) || 0;
    this.platformFeeBrl = Number(data.platformFeeBrl) || 0;
    this.teacherNetBrl = Number(data.teacherNetBrl) || 0;
    this.method = data.method;
    this.status = data.status || PaymentStatus.Pending;
    this.pixQrCode = data.pixQrCode;
    this.pixCopyPaste = data.pixCopyPaste;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  public get amountMoney(): Money {
    return Money.fromBrl(this.amountBrl);
  }

  public markPaid(): void {
    this.status = PaymentStatus.Paid;
  }

  public markRefunded(): void {
    this.status = PaymentStatus.Refunded;
  }

  public toJSON(): PaymentTransaction {
    return {
      id: this.id,
      lessonId: this.lessonId,
      studentId: this.studentId,
      studentName: this.studentName,
      amountBrl: this.amountBrl,
      platformFeeBrl: this.platformFeeBrl,
      teacherNetBrl: this.teacherNetBrl,
      method: this.method,
      status: this.status,
      pixQrCode: this.pixQrCode,
      pixCopyPaste: this.pixCopyPaste,
      createdAt: this.createdAt,
    };
  }
}
