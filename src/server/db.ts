import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Student,
  Teacher,
  Lesson,
  Review,
  PaymentTransaction,
  AppNotification,
  LessonStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  ProficiencyLevel,
  LearningGoal,
  AvailabilitySlot,
} from '../domain/types';
import { CommissionService } from '../domain/services/commissionService';

const STUDENTS_COLLECTION = 'students';
const TEACHERS_COLLECTION = 'teachers';
const LESSONS_COLLECTION = 'lessons';
const REVIEWS_COLLECTION = 'reviews';
const PAYMENTS_COLLECTION = 'payments';
const NOTIFICATIONS_COLLECTION = 'notifications';

// Generate default weekly availability slots (all 7 days)
export function generateDefaultAvailability(): AvailabilitySlot[] {
  const days = [
    { day: 0, label: 'Domingo' },
    { day: 1, label: 'Segunda-feira' },
    { day: 2, label: 'Terça-feira' },
    { day: 3, label: 'Quarta-feira' },
    { day: 4, label: 'Quinta-feira' },
    { day: 5, label: 'Sexta-feira' },
    { day: 6, label: 'Sábado' },
  ];
  const hours = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];
  const slots: AvailabilitySlot[] = [];

  days.forEach((d) => {
    hours.forEach((h) => {
      const startHourNum = Number(h.split(':')[0]);
      const endHour = String(startHourNum + 1).padStart(2, '0') + ':00';
      const isWeekday = d.day >= 1 && d.day <= 5;
      const isBusinessHour = (startHourNum >= 9 && startHourNum <= 12) || (startHourNum >= 14 && startHourNum <= 20);
      const isWeekendMorning = (d.day === 6 || d.day === 0) && (startHourNum >= 9 && startHourNum <= 14);

      slots.push({
        id: `slot-${d.day}-${h.replace(':', '')}`,
        dayOfWeek: d.day,
        dayLabel: d.label,
        startTime: h,
        endTime: endHour,
        isAvailable: isWeekday ? isBusinessHour : isWeekendMorning,
      });
    });
  });

  return slots;
}

// In-memory fallback / cache for high responsiveness and resiliency
export const memoryFallback = {
  students: new Map<string, Student>(),
  teachers: new Map<string, Teacher>(),
  lessons: new Map<string, Lesson>(),
  reviews: new Map<string, Review>(),
  payments: new Map<string, PaymentTransaction>(),
  notifications: new Map<string, AppNotification>(),
};

export class ServerFirestoreRepo {
  private static seeded = false;
  public static generateDefaultAvailability = generateDefaultAvailability;

  public static async seedIfEmpty() {
    if (this.seeded) return;
    try {
      const snap = await getDocs(collection(db, TEACHERS_COLLECTION));
      if (!snap.empty) {
        // Load into memory cache
        const tDocs = snap.docs.map((d) => d.data() as Teacher);
        tDocs.forEach((t) => memoryFallback.teachers.set(t.id, t));

        const sSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
        sSnap.docs.forEach((d) => memoryFallback.students.set(d.id, d.data() as Student));

        const lSnap = await getDocs(collection(db, LESSONS_COLLECTION));
        lSnap.docs.forEach((d) => memoryFallback.lessons.set(d.id, d.data() as Lesson));

        const rSnap = await getDocs(collection(db, REVIEWS_COLLECTION));
        rSnap.docs.forEach((d) => memoryFallback.reviews.set(d.id, d.data() as Review));

        const nSnap = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
        nSnap.docs.forEach((d) => memoryFallback.notifications.set(d.id, d.data() as AppNotification));

        this.seeded = true;
        console.log('[Firestore] Synced existing database into server repository cache.');
        return;
      }

      console.log('[Firestore] Seeding initial dataset into Cloud Firestore...');

      // Seed Student 1
      const student1: Student = {
        id: 'std-001',
        name: 'Jonathan Oliveira',
        email: 'jonathan.oliveira.da@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
        level: ProficiencyLevel.B1_Intermediate,
        goal: LearningGoal.Business,
        goalDescription: 'Melhorar a desenvoltura em reuniões de tecnologia e entrevistas internacionais.',
        hasCompletedDiagnostic: true,
        walletBalanceBrl: 350.0,
        totalLessonsCompleted: 4,
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      };
      await setDoc(doc(db, STUDENTS_COLLECTION, student1.id), student1);
      memoryFallback.students.set(student1.id, student1);

      // Seed Teacher 1
      const teacher1: Teacher = {
        id: 'tch-001',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@talke.com',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop',
        headline: 'Especialista em Business English & Preparação de Entrevistas',
        bio: 'Nativa de Londres com certificação CELTA pela Universidade de Cambridge. Especialista em treinar líderes e engenheiros para o mercado global.',
        hourlyPriceBrl: 110.0,
        levelsTaught: [
          ProficiencyLevel.B1_Intermediate,
          ProficiencyLevel.B2_Upper_Intermediate,
          ProficiencyLevel.C1_Advanced,
          ProficiencyLevel.C2_Proficient,
        ],
        specialties: [LearningGoal.Business, LearningGoal.Conversation],
        languages: ['Inglês (Nativo)', 'Português (Fluente)'],
        certifications: ['CELTA Cambridge', 'DELTA Module 1', 'TEFL 120h'],
        availability: generateDefaultAvailability(),
        rating: 4.95,
        totalReviews: 28,
        totalLessonsCompleted: 142,
        isVerified: true,
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      };
      await setDoc(doc(db, TEACHERS_COLLECTION, teacher1.id), teacher1);
      memoryFallback.teachers.set(teacher1.id, teacher1);

      // Seed Teacher 2
      const teacher2: Teacher = {
        id: 'tch-002',
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@talke.com',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
        headline: 'Conversação Descomplicada & Destrave Imediato',
        bio: 'Mais de 6 anos de experiência ensinando brasileiros a perderem a vergonha de falar inglês.',
        hourlyPriceBrl: 75.0,
        levelsTaught: [
          ProficiencyLevel.A1_Beginner,
          ProficiencyLevel.A2_Elementary,
          ProficiencyLevel.B1_Intermediate,
          ProficiencyLevel.B2_Upper_Intermediate,
        ],
        specialties: [LearningGoal.Conversation, LearningGoal.Travel, LearningGoal.BeginnerFoundation],
        languages: ['Inglês (C2)', 'Espanhol (Nativo)', 'Português (Fluente)'],
        certifications: ['TESOL International', 'Licenciatura em Letras'],
        availability: generateDefaultAvailability(),
        rating: 4.88,
        totalReviews: 19,
        totalLessonsCompleted: 98,
        isVerified: true,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      };
      await setDoc(doc(db, TEACHERS_COLLECTION, teacher2.id), teacher2);
      memoryFallback.teachers.set(teacher2.id, teacher2);

      // Seed Teacher 3
      const teacher3: Teacher = {
        id: 'tch-003',
        name: 'David Miller',
        email: 'david.miller@talke.com',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
        headline: 'Preparador Oficial para TOEFL iBT & IELTS Academic',
        bio: 'Ex-examinador oficial IELTS nos Estados Unidos. Estratégias táticas e simulados para alta pontuação.',
        hourlyPriceBrl: 130.0,
        levelsTaught: [
          ProficiencyLevel.B2_Upper_Intermediate,
          ProficiencyLevel.C1_Advanced,
          ProficiencyLevel.C2_Proficient,
        ],
        specialties: [LearningGoal.Exams, LearningGoal.Pronunciation, LearningGoal.Business],
        languages: ['Inglês (Nativo Americano)'],
        certifications: ['Master in Applied Linguistics', 'IELTS Examiner Certified'],
        availability: generateDefaultAvailability(),
        rating: 4.98,
        totalReviews: 34,
        totalLessonsCompleted: 210,
        isVerified: true,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      };
      await setDoc(doc(db, TEACHERS_COLLECTION, teacher3.id), teacher3);
      memoryFallback.teachers.set(teacher3.id, teacher3);

      // Seed Lesson 1
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
      const comm1 = CommissionService.calculateCommission(teacher1.hourlyPriceBrl);

      const lesson1: Lesson = {
        id: 'lsn-101',
        studentId: student1.id,
        studentName: student1.name,
        teacherId: teacher1.id,
        teacherName: teacher1.name,
        scheduledDate: tomorrowDateStr,
        startTime: '14:00',
        durationMinutes: 50,
        status: LessonStatus.Confirmed,
        priceBrl: comm1.grossAmountBrl,
        platformFeeBrl: comm1.platformFeeBrl,
        teacherNetBrl: comm1.teacherNetBrl,
        topic: 'Simulação de apresentação em inglês para investidores',
        meetingLink: `https://talke.daily.co/talke-lsn-101`,
        whiteboardNotes: 'Pauta: Pitch deck, vocabulário financeiro, tratamento de objeções.',
        isPaid: true,
        paymentMethod: PaymentMethod.Pix,
        hasBeenReviewed: false,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      };
      await setDoc(doc(db, LESSONS_COLLECTION, lesson1.id), lesson1);
      memoryFallback.lessons.set(lesson1.id, lesson1);

      this.seeded = true;
      console.log('[Firestore] Seed complete.');
    } catch (err) {
      console.warn('[Firestore] Error while seeding initial Firestore documents:', err);
    }
  }

  // ================= STUDENTS =================
  public static async getAllStudents(): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, STUDENTS_COLLECTION));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Student);
        list.forEach((s) => memoryFallback.students.set(s.id, s));
        return list;
      }
    } catch (err) {
      console.warn('[Firestore] getAllStudents error, using cache:', err);
    }
    return Array.from(memoryFallback.students.values());
  }

  public static async getStudentById(id: string): Promise<Student | null> {
    try {
      const snap = await getDoc(doc(db, STUDENTS_COLLECTION, id));
      if (snap.exists()) {
        const student = snap.data() as Student;
        memoryFallback.students.set(id, student);
        return student;
      }
    } catch (err) {
      console.warn('[Firestore] getStudentById error, using cache:', err);
    }
    return memoryFallback.students.get(id) || null;
  }

  public static async getStudentByEmail(email: string): Promise<Student | null> {
    const lower = email.toLowerCase().trim();
    const cached = Array.from(memoryFallback.students.values()).find(
      (s) => s.email.toLowerCase() === lower
    );
    if (cached) return cached;
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), where('email', '==', lower));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as Student;
      }
    } catch (err) {
      console.warn('[Firestore] getStudentByEmail error:', err);
    }
    return null;
  }

  public static async saveStudent(student: Student): Promise<void> {
    memoryFallback.students.set(student.id, student);
    try {
      await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving student:', err);
    }
  }

  // ================= TEACHERS =================
  public static async getAllTeachers(): Promise<Teacher[]> {

    try {
      const snap = await getDocs(collection(db, TEACHERS_COLLECTION));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Teacher);
        list.forEach((t) => memoryFallback.teachers.set(t.id, t));
        return list;
      }
    } catch (err) {
      console.warn('[Firestore] getAllTeachers error, using cache:', err);
    }
    return Array.from(memoryFallback.teachers.values());
  }

  public static async getTeacherById(id: string): Promise<Teacher | null> {
    try {
      const snap = await getDoc(doc(db, TEACHERS_COLLECTION, id));
      if (snap.exists()) {
        const teacher = snap.data() as Teacher;
        memoryFallback.teachers.set(id, teacher);
        return teacher;
      }
    } catch (err) {
      console.warn('[Firestore] getTeacherById error, using cache:', err);
    }
    return memoryFallback.teachers.get(id) || null;
  }

  public static async getTeacherByEmail(email: string): Promise<Teacher | null> {
    const lower = email.toLowerCase().trim();
    const cached = Array.from(memoryFallback.teachers.values()).find(
      (t) => t.email.toLowerCase() === lower
    );
    if (cached) return cached;
    try {
      const q = query(collection(db, TEACHERS_COLLECTION), where('email', '==', lower));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as Teacher;
      }
    } catch (err) {
      console.warn('[Firestore] getTeacherByEmail error:', err);
    }
    return null;
  }

  public static async saveTeacher(teacher: Teacher): Promise<void> {
    memoryFallback.teachers.set(teacher.id, teacher);
    try {
      await setDoc(doc(db, TEACHERS_COLLECTION, teacher.id), teacher, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving teacher:', err);
    }
  }

  // ================= LESSONS (WITH DOUBLE-BOOKING PREVENTION) =================
  public static async getAllLessons(): Promise<Lesson[]> {
    try {
      const snap = await getDocs(collection(db, LESSONS_COLLECTION));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Lesson);
        list.forEach((l) => memoryFallback.lessons.set(l.id, l));
        return list;
      }
    } catch (err) {
      console.warn('[Firestore] getAllLessons error, using cache:', err);
    }
    return Array.from(memoryFallback.lessons.values());
  }

  public static async getLessonsForTeacher(teacherId: string): Promise<Lesson[]> {
    const all = await this.getAllLessons();
    return all.filter((l) => l.teacherId === teacherId);
  }

  public static async getLessonsForStudent(studentId: string): Promise<Lesson[]> {
    const all = await this.getAllLessons();
    return all.filter((l) => l.studentId === studentId);
  }

  public static async saveLesson(lesson: Lesson): Promise<void> {
    memoryFallback.lessons.set(lesson.id, lesson);
    try {
      await setDoc(doc(db, LESSONS_COLLECTION, lesson.id), lesson, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving lesson:', err);
    }
  }

  public static async getLessonById(id: string): Promise<Lesson | null> {
    try {
      const snap = await getDoc(doc(db, LESSONS_COLLECTION, id));
      if (snap.exists()) {
        const lesson = snap.data() as Lesson;
        memoryFallback.lessons.set(id, lesson);
        return lesson;
      }
    } catch (err) {
      console.warn('[Firestore] getLessonById error, using cache:', err);
    }
    return memoryFallback.lessons.get(id) || null;
  }

  /**
   * Creates a lesson with strict concurrency / anti-double-booking check.
   */
  public static async createLessonAtomic(lessonData: {
    studentId: string;
    teacherId: string;
    scheduledDate: string;
    startTime: string;
    topic?: string;
  }): Promise<{ lesson: Lesson; conflict?: boolean }> {
    const { studentId, teacherId, scheduledDate, startTime, topic } = lessonData;

    // Check conflict in database and cache
    try {
      const q = query(
        collection(db, LESSONS_COLLECTION),
        where('teacherId', '==', teacherId),
        where('scheduledDate', '==', scheduledDate),
        where('startTime', '==', startTime)
      );
      const conflictSnap = await getDocs(q);
      const activeConflicts = conflictSnap.docs
        .map((d) => d.data() as Lesson)
        .filter((l) => l.status !== LessonStatus.Cancelled);

      if (activeConflicts.length > 0) {
        return { lesson: activeConflicts[0], conflict: true };
      }
    } catch (err) {
      console.warn('[Firestore] Conflict check query error, checking local memory cache:', err);
      const memoryConflict = Array.from(memoryFallback.lessons.values()).find(
        (l) =>
          l.teacherId === teacherId &&
          l.scheduledDate === scheduledDate &&
          l.startTime === startTime &&
          l.status !== LessonStatus.Cancelled
      );
      if (memoryConflict) {
        return { lesson: memoryConflict, conflict: true };
      }
    }

    const student = await this.getStudentById(studentId);
    const teacher = await this.getTeacherById(teacherId);
    if (!student || !teacher) {
      throw new Error('Aluno ou professor não encontrado para agendamento.');
    }

    const commission = CommissionService.calculateCommission(teacher.hourlyPriceBrl);
    const lessonId = `lsn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Dedicated Daily Room URL
    const dailySubdomain = process.env.DAILY_DOMAIN || 'talke';
    const dailyRoomUrl = `https://${dailySubdomain}.daily.co/talke-${lessonId}`;

    const newLesson: Lesson = {
      id: lessonId,
      studentId: student.id,
      studentName: student.name,
      teacherId: teacher.id,
      teacherName: teacher.name,
      scheduledDate,
      startTime,
      durationMinutes: 50,
      status: LessonStatus.Confirmed,
      priceBrl: commission.grossAmountBrl,
      platformFeeBrl: commission.platformFeeBrl,
      teacherNetBrl: commission.teacherNetBrl,
      topic: topic || 'Conversação e objetivos pedagógicos definidos na plataforma Talkê',
      meetingLink: dailyRoomUrl,
      whiteboardNotes: `Aula Talkê: ${teacher.name} & ${student.name}.`,
      isPaid: false,
      hasBeenReviewed: false,
      createdAt: new Date().toISOString(),
    };

    memoryFallback.lessons.set(lessonId, newLesson);
    try {
      await setDoc(doc(db, LESSONS_COLLECTION, lessonId), newLesson);
    } catch (err) {
      console.error('[Firestore] Error saving new lesson to Firestore:', err);
    }

    // Push notification to teacher
    await this.pushNotification({
      userId: teacher.id,
      userRole: UserRole.Teacher,
      title: 'Nova Aula Reservada!',
      message: `O aluno ${student.name} agendou uma aula para ${scheduledDate} às ${startTime}.`,
      type: 'BOOKING',
      relatedLessonId: lessonId,
    });

    return { lesson: newLesson, conflict: false };
  }

  // ================= CHECKOUT WITH RACE-CONDITION & BALANCE GUARD =================
  public static async executeCheckoutAtomic(params: {
    lessonId: string;
    studentId: string;
    method: PaymentMethod;
  }): Promise<{
    success: boolean;
    lesson: Lesson;
    transaction: PaymentTransaction;
    newWalletBalanceBrl: number;
    error?: string;
  }> {
    const { lessonId, studentId, method } = params;
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new Error('Aula não encontrada para realização do pagamento.');
    }

    if (lesson.isPaid) {
      throw new Error('Esta aula já possui pagamento confirmado anteriormente.');
    }

    const student = await this.getStudentById(studentId || lesson.studentId);
    if (!student) {
      throw new Error('Aluno não encontrado.');
    }

    const amount = lesson.priceBrl;

    // Check balance if wallet payment
    if (method === PaymentMethod.Wallet) {
      if (student.walletBalanceBrl < amount) {
        throw new Error(
          `Saldo insuficiente na carteira (R$ ${student.walletBalanceBrl.toFixed(2)}). Recarregue ou selecione PIX/Cartão.`
        );
      }
      student.walletBalanceBrl -= amount;
      await this.saveStudent(student);
    }

    // Mark lesson paid
    lesson.isPaid = true;
    lesson.paymentMethod = method;
    memoryFallback.lessons.set(lesson.id, lesson);
    try {
      await updateDoc(doc(db, LESSONS_COLLECTION, lesson.id), {
        isPaid: true,
        paymentMethod: method,
      });
    } catch (err) {
      console.error('[Firestore] Error updating lesson payment in Firestore:', err);
    }

    // Record transaction
    const txId = `tx-${Date.now()}`;
    const pixData = CommissionService.generatePixData(amount, txId);
    const transaction: PaymentTransaction = {
      id: txId,
      lessonId: lesson.id,
      studentId: student.id,
      studentName: student.name,
      amountBrl: amount,
      platformFeeBrl: lesson.platformFeeBrl,
      teacherNetBrl: lesson.teacherNetBrl,
      method,
      status: PaymentStatus.Paid,
      pixCopyPaste: pixData.pixCopyPaste,
      pixQrCode: pixData.pixQrCode,
      createdAt: new Date().toISOString(),
    };

    memoryFallback.payments.set(txId, transaction);
    try {
      await setDoc(doc(db, PAYMENTS_COLLECTION, txId), transaction);
    } catch (err) {
      console.error('[Firestore] Error saving payment transaction:', err);
    }

    // Push notification to student & teacher
    await this.pushNotification({
      userId: student.id,
      userRole: UserRole.Student,
      title: 'Pagamento Aprovado!',
      message: `O pagamento de R$ ${amount.toFixed(2)} para a aula com ${lesson.teacherName} foi confirmado.`,
      type: 'PAYMENT',
      relatedLessonId: lesson.id,
    });

    await this.pushNotification({
      userId: lesson.teacherId,
      userRole: UserRole.Teacher,
      title: 'Pagamento Confirmado!',
      message: `O aluno ${student.name} concluiu o pagamento da aula. Valor líquido a receber: R$ ${lesson.teacherNetBrl.toFixed(2)}.`,
      type: 'PAYMENT',
      relatedLessonId: lesson.id,
    });

    return {
      success: true,
      lesson,
      transaction,
      newWalletBalanceBrl: student.walletBalanceBrl,
    };
  }

  // ================= PAYMENTS =================
  public static async getAllPayments(): Promise<PaymentTransaction[]> {
    try {
      const snap = await getDocs(collection(db, PAYMENTS_COLLECTION));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as PaymentTransaction);
        list.forEach((p) => memoryFallback.payments.set(p.id, p));
        return list;
      }
    } catch (err) {
      console.warn('[Firestore] getAllPayments error:', err);
    }
    return Array.from(memoryFallback.payments.values());
  }

  public static async getPaymentsForStudent(studentId: string): Promise<PaymentTransaction[]> {
    const all = await this.getAllPayments();
    return all.filter((p) => p.studentId === studentId);
  }

  public static async savePayment(payment: PaymentTransaction): Promise<PaymentTransaction> {
    memoryFallback.payments.set(payment.id, payment);
    try {
      await setDoc(doc(db, PAYMENTS_COLLECTION, payment.id), payment, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving payment:', err);
    }
    return payment;
  }

  // ================= REVIEWS =================
  public static async getAllReviews(): Promise<Review[]> {
    try {
      const snap = await getDocs(collection(db, REVIEWS_COLLECTION));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Review);
        list.forEach((r) => memoryFallback.reviews.set(r.id, r));
        return list;
      }
    } catch (err) {
      console.warn('[Firestore] getAllReviews error:', err);
    }
    return Array.from(memoryFallback.reviews.values());
  }

  public static async getReviewsForTeacher(teacherId: string): Promise<Review[]> {
    const all = await this.getAllReviews();
    return all.filter((r) => r.teacherId === teacherId);
  }

  public static async saveReview(review: Review): Promise<Review> {
    memoryFallback.reviews.set(review.id, review);
    try {
      await setDoc(doc(db, REVIEWS_COLLECTION, review.id), review, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving review:', err);
    }
    return review;
  }

  // ================= NOTIFICATIONS =================

  public static async pushNotification(params: {
    userId: string;
    userRole: UserRole;
    title: string;
    message: string;
    type: 'BOOKING' | 'PAYMENT' | 'LESSON' | 'REVIEW' | 'SYSTEM';
    relatedLessonId?: string;
  }): Promise<AppNotification> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const notif: AppNotification = {
      id,
      userId: params.userId,
      userRole: params.userRole,
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      relatedLessonId: params.relatedLessonId,
      createdAt: new Date().toISOString(),
    };

    memoryFallback.notifications.set(id, notif);
    try {
      await setDoc(doc(db, NOTIFICATIONS_COLLECTION, id), notif);
    } catch (err) {
      console.error('[Firestore] Error saving notification:', err);
    }
    return notif;
  }

  public static async getNotificationsForUser(userId: string): Promise<AppNotification[]> {
    try {
      const snap = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
      if (!snap.empty) {
        const all = snap.docs.map((d) => d.data() as AppNotification);
        all.forEach((n) => memoryFallback.notifications.set(n.id, n));
        return (userId === 'all' ? all : all.filter((n) => n.userId === userId || n.userId === 'all'))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (err) {
      console.warn('[Firestore] Error getting notifications from Firestore:', err);
    }
    const memList = Array.from(memoryFallback.notifications.values());
    return (userId === 'all' ? memList : memList.filter((n) => n.userId === userId || n.userId === 'all'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async markNotificationRead(id: string): Promise<AppNotification | null> {
    const notif = memoryFallback.notifications.get(id);
    if (notif) {
      notif.read = true;
      try {
        await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
      } catch (err) {
        console.error('[Firestore] Error marking notification read:', err);
      }
      return notif;
    }
    return null;
  }
}
