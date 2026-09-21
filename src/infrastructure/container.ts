import {
  FirestoreStudentRepository,
  FirestoreTeacherRepository,
  FirestoreLessonRepository,
  FirestorePaymentRepository,
  FirestoreReviewRepository,
  FirestoreNotificationRepository,
} from './repositories';
import {
  BookLessonUseCase,
  CheckoutLessonUseCase,
  CompleteLessonUseCase,
  CreateReviewUseCase,
  TopUpWalletUseCase,
  GetTeacherRecommendationsUseCase,
  GetAdminMetricsUseCase,
} from '../application';

export class Container {
  // Repositories
  public readonly studentRepo = new FirestoreStudentRepository();
  public readonly teacherRepo = new FirestoreTeacherRepository();
  public readonly lessonRepo = new FirestoreLessonRepository();
  public readonly paymentRepo = new FirestorePaymentRepository();
  public readonly reviewRepo = new FirestoreReviewRepository();
  public readonly notificationRepo = new FirestoreNotificationRepository();

  // Use Cases
  public readonly bookLessonUseCase = new BookLessonUseCase(
    this.studentRepo,
    this.teacherRepo,
    this.lessonRepo,
    this.notificationRepo
  );

  public readonly checkoutLessonUseCase = new CheckoutLessonUseCase(
    this.studentRepo,
    this.lessonRepo,
    this.paymentRepo,
    this.notificationRepo
  );

  public readonly completeLessonUseCase = new CompleteLessonUseCase(
    this.lessonRepo,
    this.studentRepo,
    this.teacherRepo,
    this.notificationRepo
  );

  public readonly createReviewUseCase = new CreateReviewUseCase(
    this.reviewRepo,
    this.lessonRepo,
    this.teacherRepo,
    this.studentRepo,
    this.notificationRepo
  );

  public readonly topUpWalletUseCase = new TopUpWalletUseCase(
    this.studentRepo,
    this.paymentRepo,
    this.notificationRepo
  );

  public readonly getTeacherRecommendationsUseCase = new GetTeacherRecommendationsUseCase(
    this.teacherRepo,
    this.studentRepo
  );

  public readonly getAdminMetricsUseCase = new GetAdminMetricsUseCase(
    this.lessonRepo,
    this.teacherRepo,
    this.studentRepo,
    this.paymentRepo
  );
}

export const container = new Container();
