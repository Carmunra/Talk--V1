export enum UserRole {
  Student = 'STUDENT',
  Teacher = 'TEACHER',
  Admin = 'ADMIN',
}

export enum ProficiencyLevel {
  A1_Beginner = 1,
  A2_Elementary = 2,
  B1_Intermediate = 3,
  B2_Upper_Intermediate = 4,
  C1_Advanced = 5,
  C2_Proficient = 6,
}

export const ProficiencyLevelLabels: Record<ProficiencyLevel, string> = {
  [ProficiencyLevel.A1_Beginner]: 'A1 - Iniciante',
  [ProficiencyLevel.A2_Elementary]: 'A2 - Básico',
  [ProficiencyLevel.B1_Intermediate]: 'B1 - Intermediário',
  [ProficiencyLevel.B2_Upper_Intermediate]: 'B2 - Intermediário Superior',
  [ProficiencyLevel.C1_Advanced]: 'C1 - Avançado',
  [ProficiencyLevel.C2_Proficient]: 'C2 - Fluente / Domínio Pleno',
};

export enum LearningGoal {
  Conversation = 'CONVERSATION',
  Business = 'BUSINESS',
  Exams = 'EXAMS',
  Travel = 'TRAVEL',
  BeginnerFoundation = 'BEGINNER_FOUNDATION',
  Pronunciation = 'PRONUNCIATION',
}

export const LearningGoalLabels: Record<LearningGoal, string> = {
  [LearningGoal.Conversation]: 'Conversação Geral & Destrave',
  [LearningGoal.Business]: 'Inglês para Negócios & Entrevistas',
  [LearningGoal.Exams]: 'Preparação para Exames (TOEFL / IELTS)',
  [LearningGoal.Travel]: 'Inglês para Viagens & Cotidiano',
  [LearningGoal.BeginnerFoundation]: 'Começando do Zero (Gramática Básica)',
  [LearningGoal.Pronunciation]: 'Pronúncia & Redução de Sotaque',
};

export enum LessonStatus {
  Requested = 'REQUESTED',
  Confirmed = 'CONFIRMED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export const LessonStatusLabels: Record<LessonStatus, string> = {
  [LessonStatus.Requested]: 'Aguardando Confirmação',
  [LessonStatus.Confirmed]: 'Confirmada & Agendada',
  [LessonStatus.InProgress]: 'Em Andamento',
  [LessonStatus.Completed]: 'Concluída',
  [LessonStatus.Cancelled]: 'Cancelada',
};

export enum PaymentMethod {
  Pix = 'PIX',
  CreditCard = 'CREDIT_CARD',
  Wallet = 'WALLET',
}

export enum PaymentStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Refunded = 'REFUNDED',
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
  dayLabel: string;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  isAvailable: boolean;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  level?: ProficiencyLevel;
  goal?: LearningGoal;
  goalDescription?: string;
  hasCompletedDiagnostic: boolean;
  walletBalanceBrl: number;
  totalLessonsCompleted: number;
  createdAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  headline: string;
  bio: string;
  videoIntroUrl?: string;
  hourlyPriceBrl: number;
  levelsTaught: ProficiencyLevel[];
  specialties: LearningGoal[];
  languages: string[];
  certifications: string[];
  availability: AvailabilitySlot[];
  rating: number;
  totalReviews: number;
  totalLessonsCompleted: number;
  isVerified: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  status: LessonStatus;
  priceBrl: number;
  platformFeeBrl: number; // 15% Talkê commission
  teacherNetBrl: number;
  topic?: string;
  meetingLink?: string;
  whiteboardNotes?: string;
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  hasBeenReviewed?: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  lessonId: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  tags: string[];
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  lessonId?: string;
  studentId: string;
  studentName: string;
  amountBrl: number;
  platformFeeBrl: number;
  teacherNetBrl: number;
  method: PaymentMethod;
  status: PaymentStatus;
  pixQrCode?: string;
  pixCopyPaste?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string; // studentId, teacherId or 'admin'
  userRole: UserRole;
  title: string;
  message: string;
  type: 'BOOKING' | 'PAYMENT' | 'LESSON' | 'REVIEW' | 'SYSTEM';
  read: boolean;
  relatedLessonId?: string;
  createdAt: string;
}

export interface MatchRecommendation {
  teacher: Teacher;
  matchScore: number;
  matchReasons: string[];
  isGoalMatch: boolean;
  isLevelMatch: boolean;
  isAvailabilityMatch: boolean;
}

export type TalkeModuleTier = 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO';

export interface TalkeSlidePage {
  title: string;
  bullets: string[];
  example?: string;
  exercisePrompt?: string;
}

export interface TalkeMaterialItem {
  id: string;
  tier: TalkeModuleTier;
  tierLabel: string;
  cefr: string; // "A1 - A2", "B1 - B2", "C1 - C2"
  unitNumber: number;
  title: string;
  objective: string;
  durationMinutes: number;
  grammarFocus: string;
  vocabulary: string[];
  discussionQuestions: string[];
  roleplayScenario: string;
  teacherTips: string;
  homeworkIdea: string;
  slides: TalkeSlidePage[];
}

export interface StudentDevelopmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  teacherId: string;
  currentTier: TalkeModuleTier;
  currentUnitNumber: number;
  currentLessonTitle: string;
  checkpointStatus: string; // e.g. "Unidade 3: Aeroporto e Viagens - Parou no exercício 2 de simulação de alfândega"
  totalLessonsCompleted: number;
  totalHours: number;
  lastLessonDate: string;
  cefrLevel: ProficiencyLevel;
  targetGoal: LearningGoal;
  grammarScorePct: number; // 0 to 100
  vocabularyScorePct: number;
  pronunciationScorePct: number;
  fluencyScorePct: number;
  pedagogicalNotes: string;
  homeworkAssigned: string;
  nextRecommendedStep: string;
  strengths: string[];
  areasToImprove: string[];
  updatedAt: string;
}

// Clean Architecture & DDD Re-exports
export * from './errors';
export * from './value-objects';
export * from './entities';
export * from './repositories';

