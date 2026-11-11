import { Teacher, AvailabilitySlot } from '../types';

export interface ITeacherRepository {
  findById(id: string): Promise<Teacher | null>;
  findByEmail(email: string): Promise<Teacher | null>;
  findAll(): Promise<Teacher[]>;
  save(teacher: Teacher): Promise<Teacher>;
  updateAvailability(teacherId: string, availability: AvailabilitySlot[]): Promise<void>;
  updateRating(teacherId: string, newRating: number, newTotalReviews: number): Promise<void>;
  incrementCompletedLessons(teacherId: string): Promise<void>;
}
