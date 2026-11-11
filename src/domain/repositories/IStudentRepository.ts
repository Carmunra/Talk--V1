import { Student } from '../types';

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  findByEmail(email: string): Promise<Student | null>;
  findAll(): Promise<Student[]>;
  save(student: Student): Promise<Student>;
  updateWalletBalance(studentId: string, newBalanceBrl: number): Promise<void>;
}
