import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { PaymentTransaction } from '../../domain/types';
import { ServerFirestoreRepo } from '../../server/db';

export class FirestorePaymentRepository implements IPaymentRepository {
  public async findById(id: string): Promise<PaymentTransaction | null> {
    const all = await ServerFirestoreRepo.getAllPayments();
    return all.find((p) => p.id === id) || null;
  }

  public async findAll(): Promise<PaymentTransaction[]> {
    return ServerFirestoreRepo.getAllPayments();
  }

  public async findByStudentId(studentId: string): Promise<PaymentTransaction[]> {
    return ServerFirestoreRepo.getPaymentsForStudent(studentId);
  }

  public async save(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    return ServerFirestoreRepo.savePayment(transaction);
  }
}
