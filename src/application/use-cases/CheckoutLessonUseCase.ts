import { CheckoutLessonDTO } from '../dto';
import {
  Lesson,
  PaymentTransaction,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  IStudentRepository,
  ILessonRepository,
  IPaymentRepository,
  INotificationRepository,
  EntityNotFoundError,
} from '../../domain/types';
import { StudentEntity } from '../../domain/entities/StudentEntity';
import { LessonEntity } from '../../domain/entities/LessonEntity';
import { PaymentTransactionEntity } from '../../domain/entities/PaymentTransactionEntity';
import { AppNotificationEntity } from '../../domain/entities/AppNotificationEntity';
import { CommissionService } from '../../domain/services/commissionService';
import { Money } from '../../domain/value-objects/Money';

export interface CheckoutResult {
  success: boolean;
  lesson: Lesson;
  transaction: PaymentTransaction;
  newWalletBalanceBrl: number;
}

export class CheckoutLessonUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly lessonRepo: ILessonRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly notificationRepo: INotificationRepository
  ) {}

  public async execute(dto: CheckoutLessonDTO): Promise<CheckoutResult> {
    const lessonData = await this.lessonRepo.findById(dto.lessonId);
    if (!lessonData) {
      throw new EntityNotFoundError('Aula', dto.lessonId);
    }

    const studentData = await this.studentRepo.findById(dto.studentId || lessonData.studentId);
    if (!studentData) {
      throw new EntityNotFoundError('Estudante', dto.studentId);
    }

    const lesson = new LessonEntity(lessonData);
    const student = new StudentEntity(studentData);
    const lessonPrice = lesson.priceMoney;

    // Process payment by method
    if (dto.method === PaymentMethod.Wallet) {
      // Debit student wallet domain operation
      student.debitWallet(lessonPrice);
      await this.studentRepo.updateWalletBalance(student.id, student.walletBalanceBrl);
    }

    // Mark lesson paid
    lesson.markPaid(dto.method);
    await this.lessonRepo.save(lesson.toJSON());

    // Record transaction
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const pixData = CommissionService.generatePixData(lesson.priceBrl, txId);

    const transactionEntity = new PaymentTransactionEntity({
      id: txId,
      lessonId: lesson.id,
      studentId: student.id,
      studentName: student.name,
      amountBrl: lesson.priceBrl,
      platformFeeBrl: lesson.platformFeeBrl,
      teacherNetBrl: lesson.teacherNetBrl,
      method: dto.method,
      status: PaymentStatus.Paid,
      pixCopyPaste: pixData.pixCopyPaste,
      pixQrCode: pixData.pixQrCode,
      createdAt: new Date().toISOString(),
    });

    const savedTx = await this.paymentRepo.save(transactionEntity.toJSON());

    // Dispatch notifications
    await Promise.all([
      this.notificationRepo.save(
        new AppNotificationEntity({
          id: `notif-${Date.now()}-pay-s`,
          userId: student.id,
          userRole: UserRole.Student,
          title: 'Pagamento Aprovado!',
          message: `O pagamento de ${Money.fromBrl(lesson.priceBrl).formatBrl()} para a aula com ${lesson.teacherName} foi confirmado.`,
          type: 'PAYMENT',
          read: false,
          relatedLessonId: lesson.id,
          createdAt: new Date().toISOString(),
        }).toJSON()
      ),
      this.notificationRepo.save(
        new AppNotificationEntity({
          id: `notif-${Date.now()}-pay-t`,
          userId: lesson.teacherId,
          userRole: UserRole.Teacher,
          title: 'Pagamento Confirmado!',
          message: `O aluno ${student.name} concluiu o pagamento da aula. Valor líquido a receber: ${Money.fromBrl(lesson.teacherNetBrl).formatBrl()}.`,
          type: 'PAYMENT',
          read: false,
          relatedLessonId: lesson.id,
          createdAt: new Date().toISOString(),
        }).toJSON()
      ),
    ]);

    return {
      success: true,
      lesson: lesson.toJSON(),
      transaction: savedTx,
      newWalletBalanceBrl: student.walletBalanceBrl,
    };
  }
}
