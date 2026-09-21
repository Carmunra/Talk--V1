import { CreateReviewDTO } from '../dto';
import {
  Review,
  UserRole,
  IStudentRepository,
  ITeacherRepository,
  ILessonRepository,
  IReviewRepository,
  INotificationRepository,
  EntityNotFoundError,
} from '../../domain/types';
import { LessonEntity } from '../../domain/entities/LessonEntity';
import { TeacherEntity } from '../../domain/entities/TeacherEntity';
import { ReviewEntity } from '../../domain/entities/ReviewEntity';
import { AppNotificationEntity } from '../../domain/entities/AppNotificationEntity';

export class CreateReviewUseCase {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly lessonRepo: ILessonRepository,
    private readonly teacherRepo: ITeacherRepository,
    private readonly studentRepo: IStudentRepository,
    private readonly notificationRepo: INotificationRepository
  ) {}

  public async execute(dto: CreateReviewDTO): Promise<Review> {
    const lessonData = await this.lessonRepo.findById(dto.lessonId);
    if (!lessonData) {
      throw new EntityNotFoundError('Aula', dto.lessonId);
    }

    const lesson = new LessonEntity(lessonData);
    lesson.markReviewed(); // Validates completed and not already reviewed

    const resolvedTeacherId = dto.teacherId || lessonData.teacherId;
    const resolvedStudentId = dto.studentId || lessonData.studentId;

    const [teacherData, studentData] = await Promise.all([
      this.teacherRepo.findById(resolvedTeacherId),
      this.studentRepo.findById(resolvedStudentId),
    ]);

    if (!teacherData) {
      throw new EntityNotFoundError('Professor', resolvedTeacherId);
    }
    if (!studentData) {
      throw new EntityNotFoundError('Estudante', resolvedStudentId);
    }

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const reviewEntity = new ReviewEntity({
      id: reviewId,
      lessonId: lesson.id,
      teacherId: teacherData.id,
      studentId: studentData.id,
      studentName: studentData.name,
      studentAvatar: studentData.avatarUrl,
      rating: dto.rating,
      comment: dto.comment,
      tags: dto.tags || [],
      createdAt: new Date().toISOString(),
    });

    const savedReview = await this.reviewRepo.save(reviewEntity.toJSON());

    // Update teacher rating aggregate
    const teacher = new TeacherEntity(teacherData);
    teacher.applyReview(dto.rating);
    await this.teacherRepo.save(teacher.toJSON());

    // Update lesson reviewed flag
    await this.lessonRepo.markReviewed(lesson.id);

    // Notify teacher
    await this.notificationRepo.save(
      new AppNotificationEntity({
        id: `notif-${Date.now()}-rev`,
        userId: teacher.id,
        userRole: UserRole.Teacher,
        title: 'Nova Avaliação Recebida! ⭐',
        message: `${studentData.name} avaliou sua aula com nota ${dto.rating}/5: "${dto.comment.substring(0, 60)}..."`,
        type: 'REVIEW',
        read: false,
        relatedLessonId: lesson.id,
        createdAt: new Date().toISOString(),
      }).toJSON()
    );

    return savedReview;
  }
}
