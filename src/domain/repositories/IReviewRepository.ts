import { Review } from '../types';

export interface IReviewRepository {
  findById(id: string): Promise<Review | null>;
  findAll(): Promise<Review[]>;
  findByTeacherId(teacherId: string): Promise<Review[]>;
  save(review: Review): Promise<Review>;
}
