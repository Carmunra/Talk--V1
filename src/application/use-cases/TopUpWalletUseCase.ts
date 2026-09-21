import { TopUpWalletDTO } from '../dto';
import {
  Student,
  PaymentTransaction,
  PaymentStatus,
  UserRole,
  IStudentRepository,
  IPaymentRepository,
  INotificationRepository,
  EntityNotFoundError,
} from '../../domain/types';
import { StudentEntity } from '../../domain/entities/StudentEntity';
import { PaymentTransactionEntity } from '../../domain/entities/PaymentTransactionEntity';
import { AppNotificationEntity } from '../../domain/entities/AppNotificationEntity';
import { Money } from '../../domain/value-objects/Money';
import { CommissionService } from '../../domain/services/commissionService';

export interface TopUpResult {
  student: Student;
  transaction: PaymentTransaction;
}

export class TopUpWalletUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly notificationRepo: INotificationRepository
  ) {}

  public async execute(dto: TopUpWalletDTO): Promise<TopUpResult> {
    const studentData = await this.studentRepo.findById(dto.studentId);
    if (!studentData) {
      throw new EntityNotFoundError('Estudante', dto.studentId);
    }

    const student = new StudentEntity(studentData);
    const amountMoney = Money.fromBrl(dto.amountBrl);

    student.creditWallet(amountMoney);
    await this.studentRepo.save(student.toJSON());

    const txId = `tx-topup-${Date.now()}`;
    const pixData = CommissionService.generatePixData(dto.amountBrl, txId);

    const transaction = new PaymentTransactionEntity({
      id: txId,
      studentId: student.id,
      studentName: student.name,
      amountBrl: dto.amountBrl,
      platformFeeBrl: 0,
      teacherNetBrl: 0,
      method: dto.method,
      status: PaymentStatus.Paid,
      pixCopyPaste: pixData.pixCopyPaste,
      pixQrCode: pixData.pixQrCode,
      createdAt: new Date().toISOString(),
    });

    const savedTx = await this.paymentRepo.save(transaction.toJSON());

    await this.notificationRepo.save(
      new AppNotificationEntity({
        id: `notif-${Date.now()}-topup`,
        userId: student.id,
        userRole: UserRole.Student,
        title: 'Recarga Confirmada!',
        message: `Seu saldo foi recarregado em ${amountMoney.formatBrl()}. Saldo atual: ${Money.fromBrl(student.walletBalanceBrl).formatBrl()}.`,
        type: 'PAYMENT',
        read: false,
        createdAt: new Date().toISOString(),
      }).toJSON()
    );

    return {
      student: student.toJSON(),
      transaction: savedTx,
    };
  }
}
