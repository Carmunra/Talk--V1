import { ILessonRepository } from '../../domain/repositories/ILessonRepository';
import { Lesson, LessonStatus, PaymentMethod } from '../../domain/types';
import { ServerFirestoreRepo } from '../../server/db';

export class FirestoreLessonRepository implements ILessonRepository {
  public async findById(id: string): Promise<Lesson | null> {
    return ServerFirestoreRepo.getLessonById(id);
  }

  public async findAll(): Promise<Lesson[]> {
    return ServerFirestoreRepo.getAllLessons();
  }

  public async findByTeacherId(teacherId: string): Promise<Lesson[]> {
    return ServerFirestoreRepo.getLessonsForTeacher(teacherId);
  }

  public async findByStudentId(studentId: string): Promise<Lesson[]> {
    return ServerFirestoreRepo.getLessonsForStudent(studentId);
  }

  public async save(lesson: Lesson): Promise<Lesson> {
    await ServerFirestoreRepo.saveLesson(lesson);
    return lesson;
  }

  public async updateStatus(lessonId: string, status: LessonStatus, notes?: string): Promise<void> {
    const lesson = await this.findById(lessonId);
    if (lesson) {
      lesson.status = status;
      if (notes) {
        lesson.whiteboardNotes = notes;
      }
      await this.save(lesson);
    }
  }

  public async updatePaymentStatus(lessonId: string, isPaid: boolean, method?: PaymentMethod): Promise<void> {
    const lesson = await this.findById(lessonId);
    if (lesson) {
      lesson.isPaid = isPaid;
      if (method) {
        lesson.paymentMethod = method;
      }
      await this.save(lesson);
    }
  }

  public async markReviewed(lessonId: string): Promise<void> {
    const lesson = await this.findById(lessonId);
    if (lesson) {
      lesson.hasBeenReviewed = true;
      await this.save(lesson);
    }
  }
}
