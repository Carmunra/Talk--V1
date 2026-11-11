import { PaymentTransaction } from '../types';

export interface IPaymentRepository {
  findById(id: string): Promise<PaymentTransaction | null>;
  findAll(): Promise<PaymentTransaction[]>;
  findByStudentId(studentId: string): Promise<PaymentTransaction[]>;
  save(transaction: PaymentTransaction): Promise<PaymentTransaction>;
}
