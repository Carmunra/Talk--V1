import {
  Teacher,
  ProficiencyLevel,
  LearningGoal,
  AvailabilitySlot,
} from '../types';
import { Money } from '../value-objects/Money';
import { ValidationError } from '../errors/DomainError';

export class TeacherEntity implements Teacher {
  public id: string;
  public name: string;
  public email: string;
  public avatarUrl?: string;
  public headline: string;
  public bio: string;
  public videoIntroUrl?: string;
  public hourlyPriceBrl: number;
  public levelsTaught: ProficiencyLevel[];
  public specialties: LearningGoal[];
  public languages: string[];
  public certifications: string[];
  public availability: AvailabilitySlot[];
  public rating: number;
  public totalReviews: number;
  public totalLessonsCompleted: number;
  public isVerified: boolean;
  public createdAt: string;

  constructor(data: Teacher) {
    if (!data.id || !data.name || !data.email) {
      throw new ValidationError('Professor deve possuir ID, nome e e-mail válidos.');
    }
    this.id = data.id;
    this.name = data.name.trim();
    this.email = data.email.trim().toLowerCase();
    this.avatarUrl = data.avatarUrl;
    this.headline = data.headline || '';
    this.bio = data.bio || '';
    this.videoIntroUrl = data.videoIntroUrl;
    this.hourlyPriceBrl = Number(data.hourlyPriceBrl) || 50;
    this.levelsTaught = Array.isArray(data.levelsTaught) ? [...data.levelsTaught] : [];
    this.specialties = Array.isArray(data.specialties) ? [...data.specialties] : [];
    this.languages = Array.isArray(data.languages) ? [...data.languages] : ['Português', 'Inglês'];
    this.certifications = Array.isArray(data.certifications) ? [...data.certifications] : [];
    this.availability = Array.isArray(data.availability) ? [...data.availability] : [];
    this.rating = Number(data.rating) || 5.0;
    this.totalReviews = Number(data.totalReviews) || 0;
    this.totalLessonsCompleted = Number(data.totalLessonsCompleted) || 0;
    this.isVerified = data.isVerified ?? true;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  public get hourlyPriceMoney(): Money {
    return Money.fromBrl(this.hourlyPriceBrl);
  }

  public isAvailable(dayOfWeek: number, startTime: string): boolean {
    const slot = this.availability.find(
      (s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime
    );
    return slot ? slot.isAvailable : false;
  }

  public recordLessonCompleted(): void {
    this.totalLessonsCompleted += 1;
  }

  public applyReview(newRating: number): void {
    if (newRating < 1 || newRating > 5) {
      throw new ValidationError('A avaliação deve ser entre 1 e 5 estrelas.');
    }
    const currentSum = this.rating * this.totalReviews;
    this.totalReviews += 1;
    this.rating = Math.round(((currentSum + newRating) / this.totalReviews) * 10) / 10;
  }

  public setAvailability(slots: AvailabilitySlot[]): void {
    this.availability = [...slots];
  }

  public toJSON(): Teacher {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      avatarUrl: this.avatarUrl,
      headline: this.headline,
      bio: this.bio,
      videoIntroUrl: this.videoIntroUrl,
      hourlyPriceBrl: this.hourlyPriceBrl,
      levelsTaught: this.levelsTaught,
      specialties: this.specialties,
      languages: this.languages,
      certifications: this.certifications,
      availability: this.availability,
      rating: this.rating,
      totalReviews: this.totalReviews,
      totalLessonsCompleted: this.totalLessonsCompleted,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
    };
  }
}
