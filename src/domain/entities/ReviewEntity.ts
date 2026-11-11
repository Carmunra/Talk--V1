import { Review } from '../types';
import { ValidationError } from '../errors/DomainError';

export class ReviewEntity implements Review {
  public id: string;
  public lessonId: string;
  public teacherId: string;
  public studentId: string;
  public studentName: string;
  public studentAvatar?: string;
  public rating: number;
  public comment: string;
  public tags: string[];
  public createdAt: string;

  constructor(data: Review) {
    if (!data.id || !data.lessonId || !data.teacherId || !data.studentId) {
      throw new ValidationError('A avaliação deve conter referências para aula, professor e aluno.');
    }
    const rating = Number(data.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new ValidationError('A nota da avaliação deve ser um número entre 1 e 5.');
    }

    this.id = data.id;
    this.lessonId = data.lessonId;
    this.teacherId = data.teacherId;
    this.studentId = data.studentId;
    this.studentName = data.studentName;
    this.studentAvatar = data.studentAvatar;
    this.rating = rating;
    this.comment = (data.comment || '').trim();
    this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  public toJSON(): Review {
    return {
      id: this.id,
      lessonId: this.lessonId,
      teacherId: this.teacherId,
      studentId: this.studentId,
      studentName: this.studentName,
      studentAvatar: this.studentAvatar,
      rating: this.rating,
      comment: this.comment,
      tags: this.tags,
      createdAt: this.createdAt,
    };
  }
}
