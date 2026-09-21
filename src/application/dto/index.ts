import { PaymentMethod, LearningGoal, ProficiencyLevel } from '../../domain/types';

export interface BookLessonDTO {
  studentId: string;
  teacherId: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string;     // HH:mm
  durationMinutes?: number;
  topic?: string;
}

export interface CheckoutLessonDTO {
  lessonId: string;
  studentId: string;
  method: PaymentMethod;
}

export interface CompleteLessonDTO {
  lessonId: string;
  whiteboardNotes?: string;
}

export interface CreateReviewDTO {
  lessonId: string;
  teacherId: string;
  studentId: string;
  rating: number;
  comment: string;
  tags?: string[];
}

export interface TopUpWalletDTO {
  studentId: string;
  amountBrl: number;
  method: PaymentMethod;
}

export interface TeacherRecommendationsQueryDTO {
  studentId?: string;
  goal?: LearningGoal;
  level?: ProficiencyLevel;
  maxPriceBrl?: number;
}
