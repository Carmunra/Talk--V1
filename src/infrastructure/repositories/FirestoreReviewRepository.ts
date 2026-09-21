import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { Review } from '../../domain/types';
import { ServerFirestoreRepo } from '../../server/db';

export class FirestoreReviewRepository implements IReviewRepository {
  public async findById(id: string): Promise<Review | null> {
    const all = await ServerFirestoreRepo.getAllReviews();
    return all.find((r) => r.id === id) || null;
  }

  public async findAll(): Promise<Review[]> {
    return ServerFirestoreRepo.getAllReviews();
  }

  public async findByTeacherId(teacherId: string): Promise<Review[]> {
    return ServerFirestoreRepo.getReviewsForTeacher(teacherId);
  }

  public async save(review: Review): Promise<Review> {
    return ServerFirestoreRepo.saveReview(review);
  }
}
