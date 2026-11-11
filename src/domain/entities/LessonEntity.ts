import {
  Lesson,
  LessonStatus,
  PaymentMethod,
} from '../types';
import { Money } from '../value-objects/Money';
import { CommissionService } from '../services/commissionService';
import { InvalidLessonStateError, ValidationError } from '../errors/DomainError';

export class LessonEntity implements Lesson {
  public id: string;
  public studentId: string;
  public studentName: string;
  public teacherId: string;
  public teacherName: string;
  public scheduledDate: string; // YYYY-MM-DD
  public startTime: string; // HH:mm
  public durationMinutes: number;
  public status: LessonStatus;
  public priceBrl: number;
  public platformFeeBrl: number;
  public teacherNetBrl: number;
  public topic?: string;
  public meetingLink?: string;
  public whiteboardNotes?: string;
  public isPaid: boolean;
  public paymentMethod?: PaymentMethod;
  public hasBeenReviewed?: boolean;
  public createdAt: string;

  constructor(data: Lesson) {
    if (!data.id || !data.studentId || !data.teacherId) {
      throw new ValidationError('A aula deve ter IDs de identificação válidos para aluno e professor.');
    }
    this.id = data.id;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.teacherId = data.teacherId;
    this.teacherName = data.teacherName;
    this.scheduledDate = data.scheduledDate;
    this.startTime = data.startTime;
    this.durationMinutes = data.durationMinutes || 50;
    this.status = data.status || LessonStatus.Requested;
    this.priceBrl = Number(data.priceBrl) || 0;

    // Financial split
    if (data.platformFeeBrl !== undefined && data.teacherNetBrl !== undefined) {
      this.platformFeeBrl = data.platformFeeBrl;
      this.teacherNetBrl = data.teacherNetBrl;
    } else {
      const split = CommissionService.calculateCommission(this.priceBrl);
      this.platformFeeBrl = split.platformFeeBrl;
      this.teacherNetBrl = split.teacherNetBrl;
    }

    this.topic = data.topic;
    this.meetingLink = data.meetingLink;
    this.whiteboardNotes = data.whiteboardNotes;
    this.isPaid = data.isPaid ?? false;
    this.paymentMethod = data.paymentMethod;
    this.hasBeenReviewed = data.hasBeenReviewed ?? false;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  public get priceMoney(): Money {
    return Money.fromBrl(this.priceBrl);
  }

  public get platformFeeMoney(): Money {
    return Money.fromBrl(this.platformFeeBrl);
  }

  public get teacherNetMoney(): Money {
    return Money.fromBrl(this.teacherNetBrl);
  }

  public markPaid(method: PaymentMethod): void {
    if (this.status !== LessonStatus.Requested) throw new InvalidLessonStateError('Somente reservas pendentes podem receber pagamento.');
    if (this.isPaid) {
      throw new InvalidLessonStateError('Esta aula já possui pagamento confirmado.');
    }
    this.isPaid = true;
    this.paymentMethod = method;
    if (this.status === LessonStatus.Requested) {
      this.status = LessonStatus.Confirmed;
    }
  }

  public start(): void {
    if (!this.isPaid || this.status !== LessonStatus.Confirmed) {
      throw new InvalidLessonStateError('Somente aulas pagas e confirmadas podem iniciar.');
    }
    this.status = LessonStatus.InProgress;
  }

  public complete(whiteboardNotes?: string): void {
    if (!this.isPaid || ![LessonStatus.Confirmed,LessonStatus.InProgress].includes(this.status)) {
      throw new InvalidLessonStateError('Somente aulas pagas em andamento ou confirmadas podem concluir.');
    }
    this.status = LessonStatus.Completed;
    if (whiteboardNotes !== undefined) {
      this.whiteboardNotes = whiteboardNotes;
    }
  }

  public cancel(reason?: string): void {
    if (this.status === LessonStatus.Completed) {
      throw new InvalidLessonStateError('Não é possível cancelar uma aula já concluída.');
    }
    this.status = LessonStatus.Cancelled;
    if (reason) {
      this.whiteboardNotes = this.whiteboardNotes
        ? `${this.whiteboardNotes} | Cancelada: ${reason}`
        : `Aula cancelada: ${reason}`;
    }
  }

  public markReviewed(): void {
    if (this.status !== LessonStatus.Completed) {
      throw new InvalidLessonStateError('Apenas aulas concluídas podem receber avaliação.');
    }
    if (this.hasBeenReviewed) {
      throw new InvalidLessonStateError('Esta aula já foi avaliada anteriormente.');
    }
    this.hasBeenReviewed = true;
  }

  public toJSON(): Lesson {
    return {
      id: this.id,
      studentId: this.studentId,
      studentName: this.studentName,
      teacherId: this.teacherId,
      teacherName: this.teacherName,
      scheduledDate: this.scheduledDate,
      startTime: this.startTime,
      durationMinutes: this.durationMinutes,
      status: this.status,
      priceBrl: this.priceBrl,
      platformFeeBrl: this.platformFeeBrl,
      teacherNetBrl: this.teacherNetBrl,
      topic: this.topic,
      meetingLink: this.meetingLink,
      whiteboardNotes: this.whiteboardNotes,
      isPaid: this.isPaid,
      paymentMethod: this.paymentMethod,
      hasBeenReviewed: this.hasBeenReviewed,
      createdAt: this.createdAt,
    };
  }
}
