import { Lesson, LessonStatus, PaymentMethod } from '../types';

export interface ILessonRepository {
  findById(id: string): Promise<Lesson | null>;
  findAll(): Promise<Lesson[]>;
  findByTeacherId(teacherId: string): Promise<Lesson[]>;
  findByStudentId(studentId: string): Promise<Lesson[]>;
  save(lesson: Lesson): Promise<Lesson>;
  updateStatus(lessonId: string, status: LessonStatus, notes?: string): Promise<void>;
  updatePaymentStatus(lessonId: string, isPaid: boolean, method?: PaymentMethod): Promise<void>;
  markReviewed(lessonId: string): Promise<void>;
}
