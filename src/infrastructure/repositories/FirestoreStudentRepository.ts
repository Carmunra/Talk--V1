import { IStudentRepository } from '../../domain/repositories/IStudentRepository';
import { Student } from '../../domain/types';
import { ServerFirestoreRepo } from '../../server/db';

export class FirestoreStudentRepository implements IStudentRepository {
  public async findById(id: string): Promise<Student | null> {
    return ServerFirestoreRepo.getStudentById(id);
  }

  public async findByEmail(email: string): Promise<Student | null> {
    return ServerFirestoreRepo.getStudentByEmail(email);
  }

  public async findAll(): Promise<Student[]> {
    return ServerFirestoreRepo.getAllStudents();
  }

  public async save(student: Student): Promise<Student> {
    await ServerFirestoreRepo.saveStudent(student);
    return student;
  }

  public async updateWalletBalance(studentId: string, newBalanceBrl: number): Promise<void> {
    const student = await this.findById(studentId);
    if (student) {
      student.walletBalanceBrl = newBalanceBrl;
      await this.save(student);
    }
  }
}
