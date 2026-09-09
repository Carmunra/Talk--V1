import React, { useState, useEffect } from 'react';
import {
  UserRole,
  Student,
  Teacher,
  Lesson,
  Review,
  AppNotification,
  ProficiencyLevel,
  LearningGoal,
  LessonStatus,
} from './domain/types';

import { Header } from './components/Header';
import { TeacherDirectory } from './components/TeacherDirectory';
import { DiagnosticAndGoalView } from './components/DiagnosticAndGoalView';
import { MyLessonsView } from './components/MyLessonsView';
import { StudentWalletView } from './components/StudentWalletView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { TalkeAdminView } from './components/TalkeAdminView';
import { ApiConsole } from './components/ApiConsole';

// Modals
import { StudentRegisterModal } from './components/StudentRegisterModal';
import { TeacherRegisterModal } from './components/TeacherRegisterModal';
import { TeacherProfileModal } from './components/TeacherProfileModal';
import { BookingModal } from './components/BookingModal';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { VirtualClassroomModal } from './components/VirtualClassroomModal';
import { ReviewModal } from './components/ReviewModal';

export default function App() {
  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Student);
  const [currentTab, setCurrentTab] = useState<string>('teachers');

  // Core Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [selectedTeacherForProfile, setSelectedTeacherForProfile] = useState<Teacher | null>(null);
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState<Teacher | null>(null);
  const [selectedLessonForPayment, setSelectedLessonForPayment] = useState<Lesson | null>(null);
  const [activeClassroomLesson, setActiveClassroomLesson] = useState<Lesson | null>(null);
  const [selectedLessonForReview, setSelectedLessonForReview] = useState<Lesson | null>(null);

  // Load all initial data from server
  const loadInitialData = async () => {
    try {
      const [studentsRes, teachersRes, lessonsRes, notifsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/teachers'),
        fetch('/api/lessons'),
        fetch('/api/notifications'),
      ]);

      const studentsData: Student[] = await studentsRes.json();
      const teachersData: Teacher[] = await teachersRes.json();
      const lessonsData: Lesson[] = await lessonsRes.json();
      const notifsData: AppNotification[] = await notifsRes.json();

      setStudents(studentsData);
      setTeachers(teachersData);
      setLessons(lessonsData);
      setNotifications(notifsData);

      if (studentsData.length > 0 && !currentStudent) {
        setCurrentStudent(studentsData[0]);
      }
      if (teachersData.length > 0 && !currentTeacher) {
        setCurrentTeacher(teachersData[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handlers for Students
  const handleSelectStudent = (student: Student) => {
    setCurrentStudent(student);
  };

  const handleCreatedStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
    setCurrentStudent(newStudent);
    setCurrentRole(UserRole.Student);
    setCurrentTab('diagnostic'); // guide new student to diagnostic
  };

  // Handlers for Teachers
  const handleSelectTeacher = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
  };

  const handleCreatedTeacher = (newTeacher: Teacher) => {
    setTeachers((prev) => [newTeacher, ...prev]);
    setCurrentTeacher(newTeacher);
    setCurrentRole(UserRole.Teacher);
    setCurrentTab('teacher-dash');
  };

  // Save diagnostic & goal
  const handleSaveDiagnostic = async (
    level: ProficiencyLevel,
    goal: LearningGoal,
    goalDescription: string
  ) => {
    if (!currentStudent) return;
    const res = await fetch(`/api/students/${currentStudent.id}/diagnostic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, goal, goalDescription }),
    });

    if (res.ok) {
      const updated: Student = await res.json();
      setCurrentStudent(updated);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setCurrentTab('teachers'); // go to matched teachers!
      loadInitialData();
    }
  };

  // Booking a lesson
  const handleConfirmBooking = async (bookingData: {
    teacherId: string;
    scheduledDate: string;
    startTime: string;
    topic: string;
  }) => {
    if (!currentStudent) return;
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: currentStudent.id,
        ...bookingData,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao agendar aula.');
    }

    const newLesson: Lesson = await res.json();
    setLessons((prev) => [newLesson, ...prev]);

    // Open Payment Modal immediately (MVP flow: reservar aula -> pagar)
    setSelectedLessonForPayment(newLesson);
    loadInitialData();
  };

  // Payment confirmation
  const handlePaymentSuccess = (updatedLesson: Lesson, newWalletBalance?: number) => {
    setLessons((prev) => prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)));
    if (newWalletBalance !== undefined && currentStudent) {
      setCurrentStudent({ ...currentStudent, walletBalanceBrl: newWalletBalance });
      setStudents((prev) =>
        prev.map((s) => (s.id === currentStudent.id ? { ...s, walletBalanceBrl: newWalletBalance } : s))
      );
    }
    setCurrentTab('lessons'); // show in scheduled lessons
    loadInitialData();
  };

  // Finish lesson in classroom
  const handleFinishLesson = async (lessonId: string, notes: string) => {
    const res = await fetch(`/api/lessons/${lessonId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: LessonStatus.Completed,
        whiteboardNotes: notes,
      }),
    });

    if (res.ok) {
      const finished: Lesson = await res.json();
      setLessons((prev) => prev.map((l) => (l.id === finished.id ? finished : l)));

      // If finished as student, open review modal right away (MVP flow: fazer aula -> avaliar)
      if (currentRole === UserRole.Student) {
        setSelectedLessonForReview(finished);
      }
      loadInitialData();
    }
  };

  // Submit review
  const handleSubmitReview = async (
    lessonId: string,
    rating: number,
    comment: string,
    tags: string[]
  ) => {
    const res = await fetch(`/api/lessons/${lessonId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment, tags }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar avaliação.');
    }

    // Refresh teacher & lessons
    loadInitialData();
  };

  // Top up wallet
  const handleTopUpWallet = async (amount: number) => {
    if (!currentStudent) return;
    const res = await fetch(`/api/students/${currentStudent.id}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountBrl: amount }),
    });

    if (res.ok) {
      const data = await res.json();
      const updated = { ...currentStudent, walletBalanceBrl: data.newBalanceBrl };
      setCurrentStudent(updated);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      loadInitialData();
    }
  };

  // Mark notification as read
  const handleMarkNotificationAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md animate-pulse">
            T
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Iniciando Plataforma Talkê...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* Header with Talke branding and role switchers */}
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        students={students}
        currentStudent={currentStudent}
        onSelectStudent={handleSelectStudent}
        teachers={teachers}
        currentTeacher={currentTeacher}
        onSelectTeacher={handleSelectTeacher}
        onOpenCreateStudent={() => setShowStudentModal(true)}
        onOpenCreateTeacher={() => setShowTeacherModal(true)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== MODO ALUNO ==================== */}
        {currentRole === UserRole.Student && (
          <>
            {currentTab === 'teachers' && (
              <TeacherDirectory
                teachers={teachers}
                currentStudent={currentStudent}
                onSelectTeacher={(t) => setSelectedTeacherForProfile(t)}
                onBookTeacher={(t) => setSelectedTeacherForBooking(t)}
                onGoToDiagnostic={() => setCurrentTab('diagnostic')}
              />
            )}

            {currentTab === 'diagnostic' && currentStudent && (
              <DiagnosticAndGoalView
                currentStudent={currentStudent}
                onSave={handleSaveDiagnostic}
                onGoToTeachers={() => setCurrentTab('teachers')}
              />
            )}

            {currentTab === 'lessons' && (
              <MyLessonsView
                lessons={lessons.filter((l) => l.studentId === currentStudent?.id)}
                onEnterClassroom={(l) => setActiveClassroomLesson(l)}
                onPayLesson={(l) => setSelectedLessonForPayment(l)}
                onReviewLesson={(l) => setSelectedLessonForReview(l)}
                onGoToTeachers={() => setCurrentTab('teachers')}
              />
            )}

            {currentTab === 'wallet' && currentStudent && (
              <StudentWalletView
                currentStudent={currentStudent}
                onTopUp={handleTopUpWallet}
                onGoToTeachers={() => setCurrentTab('teachers')}
              />
            )}
          </>
        )}

        {/* ==================== MODO PROFESSOR ==================== */}
        {currentRole === UserRole.Teacher && currentTeacher && (
          <>
            {currentTab === 'teacher-dash' && (
              <TeacherDashboardView
                currentTeacher={currentTeacher}
                onEnterClassroom={(l) => setActiveClassroomLesson(l)}
                onRefreshTeacher={loadInitialData}
              />
            )}
          </>
        )}

        {/* ==================== TALKÊ CORE / ADMIN ==================== */}
        {currentRole === UserRole.Admin && (
          <>
            {currentTab === 'admin-dash' && (
              <TalkeAdminView students={students} teachers={teachers} />
            )}
          </>
        )}

        {/* ==================== API CONSOLE ==================== */}
        {currentTab === 'api' && <ApiConsole currentStudent={currentStudent} />}
      </main>

      {/* ==================== MODALS ==================== */}

      {/* Criar Conta Aluno Modal */}
      {showStudentModal && (
        <StudentRegisterModal
          onClose={() => setShowStudentModal(false)}
          onSuccess={handleCreatedStudent}
        />
      )}

      {/* Criar Perfil Professor Modal */}
      {showTeacherModal && (
        <TeacherRegisterModal
          onClose={() => setShowTeacherModal(false)}
          onSuccess={handleCreatedTeacher}
        />
      )}

      {/* Visualizar Perfil Completo do Professor */}
      {selectedTeacherForProfile && (
        <TeacherProfileModal
          teacher={selectedTeacherForProfile}
          reviews={reviews}
          onClose={() => setSelectedTeacherForProfile(null)}
          onBookClick={(t) => {
            setSelectedTeacherForProfile(null);
            setSelectedTeacherForBooking(t);
          }}
        />
      )}

      {/* Escolher Horário & Reservar Aula */}
      {selectedTeacherForBooking && currentStudent && (
        <BookingModal
          teacher={selectedTeacherForBooking}
          currentStudent={currentStudent}
          onClose={() => setSelectedTeacherForBooking(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {/* Pagar Aula (PIX / Cartão / Carteira) */}
      {selectedLessonForPayment && currentStudent && (
        <CheckoutPaymentModal
          lesson={selectedLessonForPayment}
          currentStudent={currentStudent}
          onClose={() => setSelectedLessonForPayment(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Fazer Aula / Realizar Aula (Virtual Classroom) */}
      {activeClassroomLesson && (
        <VirtualClassroomModal
          lesson={activeClassroomLesson}
          userRole={currentRole}
          currentUserName={
            currentRole === UserRole.Student
              ? currentStudent?.name || 'Aluno'
              : currentTeacher?.name || 'Professor'
          }
          onClose={() => setActiveClassroomLesson(null)}
          onFinishLesson={handleFinishLesson}
        />
      )}

      {/* Avaliar Aula & Professor */}
      {selectedLessonForReview && (
        <ReviewModal
          lesson={selectedLessonForReview}
          onClose={() => setSelectedLessonForReview(null)}
          onSubmitReview={handleSubmitReview}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <span className="font-bold text-slate-800 block">
              Talkê — Plataforma de Aulas Particulares & Diagnóstico de Inglês
            </span>
            <span className="text-[11px] text-slate-400">
              Arquitetura Clean Code, Clean Architecture & Domain-Driven Design (DDD).
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Talkê Take-Rate: 15% • Liquidação Segura por Aula
          </div>
        </div>
      </footer>
    </div>
  );
}
