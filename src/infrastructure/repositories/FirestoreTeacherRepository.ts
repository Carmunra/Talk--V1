import { ITeacherRepository } from '../../domain/repositories/ITeacherRepository';
import { Teacher, AvailabilitySlot } from '../../domain/types';
import { ServerFirestoreRepo } from '../../server/db';

export class FirestoreTeacherRepository implements ITeacherRepository {
  public async findById(id: string): Promise<Teacher | null> {
    return ServerFirestoreRepo.getTeacherById(id);
  }

  public async findByEmail(email: string): Promise<Teacher | null> {
    return ServerFirestoreRepo.getTeacherByEmail(email);
  }

  public async findAll(): Promise<Teacher[]> {
    return ServerFirestoreRepo.getAllTeachers();
  }

  public async save(teacher: Teacher): Promise<Teacher> {
    await ServerFirestoreRepo.saveTeacher(teacher);
    return teacher;
  }

  public async updateAvailability(teacherId: string, availability: AvailabilitySlot[]): Promise<void> {
    const teacher = await this.findById(teacherId);
    if (teacher) {
      teacher.availability = availability;
      await this.save(teacher);
    }
  }

  public async updateRating(teacherId: string, newRating: number, newTotalReviews: number): Promise<void> {
    const teacher = await this.findById(teacherId);
    if (teacher) {
      teacher.rating = newRating;
      teacher.totalReviews = newTotalReviews;
      await this.save(teacher);
    }
  }

  public async incrementCompletedLessons(teacherId: string): Promise<void> {
    const teacher = await this.findById(teacherId);
    if (teacher) {
      teacher.totalLessonsCompleted += 1;
      await this.save(teacher);
    }
  }
}
