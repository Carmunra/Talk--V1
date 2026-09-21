import {
  LessonStatus,
  ILessonRepository,
  ITeacherRepository,
  IStudentRepository,
  IPaymentRepository,
} from '../../domain/types';

export interface AdminMetrics {
  totalGmvBrl: number;
  totalPlatformRevenueBrl: number;
  totalTeacherPayoutsBrl: number;
  totalLessons: number;
  completedLessons: number;
  scheduledLessons: number;
  activeTeachers: number;
  totalStudents: number;
  totalPaymentsProcessed: number;
}

export class GetAdminMetricsUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
    private readonly teacherRepo: ITeacherRepository,
    private readonly studentRepo: IStudentRepository,
    private readonly paymentRepo: IPaymentRepository
  ) {}

  public async execute(): Promise<AdminMetrics> {
    const [lessons, teachers, students, payments] = await Promise.all([
      this.lessonRepo.findAll(),
      this.teacherRepo.findAll(),
      this.studentRepo.findAll(),
      this.paymentRepo.findAll(),
    ]);

    const paidLessons = lessons.filter((l) => l.isPaid);
    const completedLessons = lessons.filter((l) => l.status === LessonStatus.Completed);
    const scheduledLessons = lessons.filter(
      (l) => l.status === LessonStatus.Confirmed || l.status === LessonStatus.Requested
    );

    const totalGmvBrl = paidLessons.reduce((acc, l) => acc + l.priceBrl, 0);
    const totalPlatformRevenueBrl = paidLessons.reduce((acc, l) => acc + l.platformFeeBrl, 0);
    const totalTeacherPayoutsBrl = paidLessons.reduce((acc, l) => acc + l.teacherNetBrl, 0);

    return {
      totalGmvBrl: Math.round(totalGmvBrl * 100) / 100,
      totalPlatformRevenueBrl: Math.round(totalPlatformRevenueBrl * 100) / 100,
      totalTeacherPayoutsBrl: Math.round(totalTeacherPayoutsBrl * 100) / 100,
      totalLessons: lessons.length,
      completedLessons: completedLessons.length,
      scheduledLessons: scheduledLessons.length,
      activeTeachers: teachers.length,
      totalStudents: students.length,
      totalPaymentsProcessed: payments.length,
    };
  }
}
