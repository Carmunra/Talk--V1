import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Student,
  Teacher,
  Lesson,
  Review,
  PaymentTransaction,
  AppNotification,
  StudentDevelopmentRecord,
} from '../domain/types';

// Collection references
const STUDENTS_COLLECTION = 'students';
const TEACHERS_COLLECTION = 'teachers';
const LESSONS_COLLECTION = 'lessons';
const REVIEWS_COLLECTION = 'reviews';
const PAYMENTS_COLLECTION = 'payments';
const NOTIFICATIONS_COLLECTION = 'notifications';
const STUDENT_PROGRESS_COLLECTION = 'student_progress';


export class FirestoreService {
  private static isInitialized = false;

  /**
   * Initializes Firestore data: loads existing documents, or seeds initial dataset if empty.
   */
  public static async initializeOrSync(
    fallbackStudents: Student[],
    fallbackTeachers: Teacher[],
    fallbackLessons: Lesson[],
    fallbackNotifications: AppNotification[]
  ): Promise<{
    students: Student[];
    teachers: Teacher[];
    lessons: Lesson[];
    notifications: AppNotification[];
    isCloudSynced: boolean;
  }> {
    try {
      const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
      const teachersSnap = await getDocs(collection(db, TEACHERS_COLLECTION));

      // If database is brand new and empty, seed it to Firestore
      if (studentsSnap.empty && teachersSnap.empty) {
        console.log('[Firestore] Seeding initial data to Cloud Firestore...');
        await Promise.all([
          ...fallbackStudents.map((s) => setDoc(doc(db, STUDENTS_COLLECTION, s.id), s)),
          ...fallbackTeachers.map((t) => setDoc(doc(db, TEACHERS_COLLECTION, t.id), t)),
          ...fallbackLessons.map((l) => setDoc(doc(db, LESSONS_COLLECTION, l.id), l)),
          ...fallbackNotifications.map((n) => setDoc(doc(db, NOTIFICATIONS_COLLECTION, n.id), n)),
        ]);
        this.isInitialized = true;
        return {
          students: fallbackStudents,
          teachers: fallbackTeachers,
          lessons: fallbackLessons,
          notifications: fallbackNotifications,
          isCloudSynced: true,
        };
      }

      // If database has records, load from Firestore
      const students: Student[] = studentsSnap.docs.map((d) => d.data() as Student);
      const teachers: Teacher[] = teachersSnap.docs.map((d) => d.data() as Teacher);

      const lessonsSnap = await getDocs(collection(db, LESSONS_COLLECTION));
      const lessons: Lesson[] = lessonsSnap.docs.map((d) => d.data() as Lesson);

      const notifsSnap = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
      const notifications: AppNotification[] = notifsSnap.docs.map((d) => d.data() as AppNotification);

      this.isInitialized = true;
      return {
        students: students.length > 0 ? students : fallbackStudents,
        teachers: teachers.length > 0 ? teachers : fallbackTeachers,
        lessons: lessons.length > 0 ? lessons : fallbackLessons,
        notifications: notifications.length > 0 ? notifications : fallbackNotifications,
        isCloudSynced: true,
      };
    } catch (err) {
      console.warn('[Firestore] Synchronization fallback used (local cache active):', err);
      return {
        students: fallbackStudents,
        teachers: fallbackTeachers,
        lessons: fallbackLessons,
        notifications: fallbackNotifications,
        isCloudSynced: false,
      };
    }
  }

  // ==================== STUDENTS ====================
  public static async saveStudent(student: Student): Promise<void> {
    try {
      await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving student:', err);
    }
  }

  // ==================== TEACHERS ====================
  public static async saveTeacher(teacher: Teacher): Promise<void> {
    try {
      await setDoc(doc(db, TEACHERS_COLLECTION, teacher.id), teacher, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving teacher:', err);
    }
  }

  // ==================== LESSONS ====================
  public static async saveLesson(lesson: Lesson): Promise<void> {
    try {
      await setDoc(doc(db, LESSONS_COLLECTION, lesson.id), lesson, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving lesson:', err);
    }
  }

  // ==================== REVIEWS ====================
  public static async saveReview(review: Review): Promise<void> {
    try {
      await setDoc(doc(db, REVIEWS_COLLECTION, review.id), review, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving review:', err);
    }
  }

  // ==================== PAYMENTS ====================
  public static async savePayment(payment: PaymentTransaction & {
    cardBrand?: string;
    lastFour?: string;
    installments?: number;
    billingName?: string;
    gatewayProvider?: string;
  }): Promise<void> {
    try {
      await setDoc(doc(db, PAYMENTS_COLLECTION, payment.id), payment, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving payment:', err);
    }
  }

  // ==================== NOTIFICATIONS ====================
  public static async saveNotification(notification: AppNotification): Promise<void> {
    try {
      await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notification.id), notification, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving notification:', err);
    }
  }

  // ==================== STUDENT PROGRESS ====================
  public static async saveStudentProgress(record: StudentDevelopmentRecord): Promise<void> {
    try {
      await setDoc(doc(db, STUDENT_PROGRESS_COLLECTION, record.id), record, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving student progress:', err);
    }
  }

  public static async getStudentProgressList(): Promise<StudentDevelopmentRecord[]> {
    try {
      const snap = await getDocs(collection(db, STUDENT_PROGRESS_COLLECTION));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as StudentDevelopmentRecord);
      }
      return [];
    } catch (err) {
      console.warn('[Firestore] Error getting student progress:', err);
      return [];
    }
  }

  public static subscribeToStudentProgress(callback: (records: StudentDevelopmentRecord[]) => void): Unsubscribe {
    try {
      const q = query(collection(db, STUDENT_PROGRESS_COLLECTION));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => d.data() as StudentDevelopmentRecord);
        callback(data);
      });
    } catch (err) {
      console.warn('[Firestore] Snapshot listener skipped for student progress:', err);
      return () => {};
    }
  }

  // ==================== REAL-TIME LISTENERS ====================
  public static subscribeToLessons(callback: (lessons: Lesson[]) => void): Unsubscribe {
    try {
      const q = query(collection(db, LESSONS_COLLECTION));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => d.data() as Lesson);
        callback(data);
      });
    } catch (err) {
      console.warn('[Firestore] Snapshot listener skipped:', err);
      return () => {};
    }
  }

  public static subscribeToNotifications(userId: string, callback: (notifs: AppNotification[]) => void): Unsubscribe {
    try {
      const q = query(collection(db, NOTIFICATIONS_COLLECTION));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs
          .map((d) => d.data() as AppNotification)
          .filter((n) => n.userId === userId || n.userId === 'all');
        callback(data);
      });
    } catch (err) {
      console.warn('[Firestore] Snapshot listener skipped:', err);
      return () => {};
    }
  }
}
