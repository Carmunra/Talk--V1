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
import { Sidebar } from './components/Sidebar';
import { TeacherDirectory } from './components/TeacherDirectory';
import { DiagnosticAndGoalView } from './components/DiagnosticAndGoalView';
import { MyLessonsView } from './components/MyLessonsView';
import { StudentWalletView } from './components/StudentWalletView';
import { StudentInteractiveHub } from './components/StudentInteractiveHub';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { TalkeAdminView } from './components/TalkeAdminView';
import { ApiConsole } from './components/ApiConsole';
import { StudentProgressAndContentView } from './components/StudentProgressAndContentView';
import { LandingPageView } from './components/LandingPageView';
import { TalkeLogo } from './components/TalkeLogo';

// Modals
import { StudentRegisterModal } from './components/StudentRegisterModal';
import { TeacherRegisterModal } from './components/TeacherRegisterModal';
import { TeacherProfileModal } from './components/TeacherProfileModal';
import { BookingModal } from './components/BookingModal';
import { CheckoutPaymentModal } from './components/CheckoutPaymentModal';
import { VirtualClassroomModal } from './components/VirtualClassroomModal';
import { ReviewModal } from './components/ReviewModal';
import { FirestoreService } from './lib/firestoreService';

export default function App() {
  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Student);
  const [currentTab, setCurrentTab] = useState<string>('teachers');
  const [teacherInitialTab, setTeacherInitialTab] = useState<'reservations' | 'students_progress' | 'materials' | 'availability' | 'earnings' | 'reviews'>('reservations');
  const [adminInitialSection, setAdminInitialSection] = useState<'analytics' | 'teachers' | 'rules' | 'all'>('analytics');
  const [isShowingLandingPage, setIsShowingLandingPage] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

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

  // Load all initial data from server and synchronize with Cloud Firestore
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

      // Cloud Firestore synchronization
      const synced = await FirestoreService.initializeOrSync(
        studentsData,
        teachersData,
        lessonsData,
        notifsData
      );

      setIsCloudSynced(synced.isCloudSynced);
      setStudents(synced.students);
      setTeachers(synced.teachers);
      setLessons(synced.lessons);
      setNotifications(synced.notifications);

      if (synced.students.length > 0 && !currentStudent) {
        setCurrentStudent(synced.students[0]);
      }
      if (synced.teachers.length > 0 && !currentTeacher) {
        setCurrentTeacher(synced.teachers[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to real-time lesson status updates from Firestore
    const unsubscribe = FirestoreService.subscribeToLessons((liveLessons) => {
      if (liveLessons && liveLessons.length > 0) {
        setLessons(liveLessons);
      }
    });

    return () => {
      unsubscribe();
    };
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
    FirestoreService.saveStudent(newStudent);
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
    FirestoreService.saveTeacher(newTeacher);
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
      FirestoreService.saveStudent(updated);
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
    FirestoreService.saveLesson(newLesson);

    // Open Payment Modal immediately (MVP flow: reservar aula -> pagar)
    setSelectedLessonForPayment(newLesson);
    loadInitialData();
  };

  // Payment confirmation
  const handlePaymentSuccess = (updatedLesson: Lesson, newWalletBalance?: number) => {
    setLessons((prev) => prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)));
    FirestoreService.saveLesson(updatedLesson);
    if (newWalletBalance !== undefined && currentStudent) {
      const updatedStudent = { ...currentStudent, walletBalanceBrl: newWalletBalance };
      setCurrentStudent(updatedStudent);
      setStudents((prev) =>
        prev.map((s) => (s.id === currentStudent.id ? { ...s, walletBalanceBrl: newWalletBalance } : s))
      );
      FirestoreService.saveStudent(updatedStudent);
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
      FirestoreService.saveLesson(finished);

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

    const data = await res.json();
    if (data.review) {
      FirestoreService.saveReview(data.review);
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
      FirestoreService.saveStudent(updated);
      loadInitialData();
    }
  };

  // Mark notification as read
  const handleMarkNotificationAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const target = updated.find((n) => n.id === id);
      if (target) FirestoreService.saveNotification(target);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9FD] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-pulse flex justify-center">
            <TalkeLogo size="lg" variant="card" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Iniciando Plataforma Talkê...
          </p>
        </div>
      </div>
    );
  }

  // Map active sidebar nav key
  const getActiveSidebarNav = () => {
    if (currentRole === UserRole.Student) {
      if (currentTab === 'student-content') return 'student_content';
      if (currentTab === 'interactive_hub') return 'interactive_hub';
      if (currentTab === 'lessons') return 'my_lessons';
      return 'teachers';
    }
    if (currentRole === UserRole.Teacher) {
      if (teacherInitialTab === 'students_progress') return 'teacher_students_progress';
      if (teacherInitialTab === 'materials') return 'teacher_materials';
      if (teacherInitialTab === 'availability') return 'teacher_availability';
      if (teacherInitialTab === 'earnings') return 'teacher_earnings';
      if (teacherInitialTab === 'reviews') return 'teacher_profile';
      return 'teacher_lessons';
    }
    if (currentRole === UserRole.Admin) {
      if (adminInitialSection === 'teachers') return 'admin_teachers';
      if (adminInitialSection === 'rules') return 'admin_rules';
      return 'admin_dashboard';
    }
    return 'admin_dashboard';
  };

  const handleSidebarNavChange = (navId: string) => {
    if (navId === 'student_content') {
      setCurrentTab('student-content');
    } else if (navId === 'teachers') {
      setCurrentTab('teachers');
    } else if (navId === 'interactive_hub') {
      setCurrentTab('interactive_hub');
    } else if (navId === 'my_lessons') {
      setCurrentTab('lessons');
    } else if (navId === 'teacher_lessons') {
      setCurrentTab('teacher-dash');
      setTeacherInitialTab('reservations');
    } else if (navId === 'teacher_students_progress') {
      setCurrentTab('teacher-dash');
      setTeacherInitialTab('students_progress');
    } else if (navId === 'teacher_materials') {
      setCurrentTab('teacher-dash');
      setTeacherInitialTab('materials');
    } else if (navId === 'teacher_availability') {
      setCurrentTab('teacher-dash');
      setTeacherInitialTab('availability');
    } else if (navId === 'teacher_earnings') {
      setCurrentTab('teacher-dash');
      setTeacherInitialTab('earnings');
    } else if (navId === 'teacher_profile') {
      setCurrentTab('teacher-dash');
      setTeacherInitialTab('reviews');
    } else if (navId === 'admin_dashboard') {
      setCurrentTab('admin-dash');
      setAdminInitialSection('analytics');
    } else if (navId === 'admin_teachers') {
      setCurrentTab('admin-dash');
      setAdminInitialSection('teachers');
    } else if (navId === 'admin_rules') {
      setCurrentTab('admin-dash');
      setAdminInitialSection('rules');
    } else if (navId.startsWith('admin_')) {
      setCurrentTab('admin-dash');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FD] flex flex-col font-sans text-slate-700">
      {isShowingLandingPage ? (
        <LandingPageView
          onEnterPlatform={(role) => {
            setIsShowingLandingPage(false);
            if (role) {
              setCurrentRole(role);
              if (role === UserRole.Teacher) {
                setCurrentTab('teacher-dash');
                setTeacherInitialTab('reservations');
              } else if (role === UserRole.Admin) {
                setCurrentTab('admin-dash');
              } else {
                setCurrentTab('teachers');
              }
            }
          }}
          onExploreTeachers={() => {
            setIsShowingLandingPage(false);
            setCurrentRole(UserRole.Student);
            setCurrentTab('teachers');
          }}
        />
      ) : (
        <>
          {/* Interactive Sidebar */}
          {currentStudent && currentTeacher && (
            <Sidebar
              currentRole={currentRole}
              onRoleChange={(role) => {
                setCurrentRole(role);
                if (role === UserRole.Student) setCurrentTab('teachers');
                else if (role === UserRole.Teacher) {
                  setCurrentTab('teacher-dash');
                  setTeacherInitialTab('reservations');
                } else if (role === UserRole.Admin) {
                  setCurrentTab('admin-dash');
                }
              }}
              activeNav={getActiveSidebarNav()}
              onNavChange={handleSidebarNavChange}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              currentStudent={currentStudent}
              currentTeacher={currentTeacher}
              onOpenDiagnostic={() => {
                setCurrentTab('diagnostic');
                setIsMobileSidebarOpen(false);
              }}
              onOpenWallet={() => {
                setCurrentTab('wallet');
                setIsMobileSidebarOpen(false);
              }}
              onOpenLandingPage={() => setIsShowingLandingPage(true)}
            />
          )}

          {/* Main Content Column with dynamic sidebar padding */}
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ${
              isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
            }`}
          >
            {/* Header with Talke branding and notifications */}
            <Header
              currentRole={currentRole}
              onChangeRole={(role) => {
                setCurrentRole(role);
                if (role === UserRole.Student) setCurrentTab('teachers');
                else if (role === UserRole.Teacher) {
                  setCurrentTab('teacher-dash');
                  setTeacherInitialTab('reservations');
                } else if (role === UserRole.Admin) {
                  setCurrentTab('admin-dash');
                }
              }}
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
              onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
              isCloudSynced={isCloudSynced}
              onOpenLandingPage={() => setIsShowingLandingPage(true)}
            />

            {/* Main App Content Body */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* ==================== MODO ALUNO ==================== */}
              {currentRole === UserRole.Student && (
                <>
                  {/* Conteúdo Aplicado & Onde Parei (Trilha Pedagógica Talkê) */}
                  {currentTab === 'student-content' && currentStudent && (
                    <StudentProgressAndContentView
                      currentStudent={currentStudent}
                      lessons={lessons.filter((l: Lesson) => l.studentId === currentStudent.id)}
                      teachers={teachers}
                      onGoToTeachers={() => setCurrentTab('teachers')}
                      onOpenPracticeLab={() => setCurrentTab('interactive_hub')}
                      onBookLesson={() => setCurrentTab('teachers')}
                      onGoToClassroom={(l: Lesson) => setActiveClassroomLesson(l)}
                    />
                  )}

                  {currentTab === 'teachers' && (
                    <TeacherDirectory
                      teachers={teachers}
                      currentStudent={currentStudent}
                      onSelectTeacher={(t) => setSelectedTeacherForProfile(t)}
                      onBookTeacher={(t) => setSelectedTeacherForBooking(t)}
                      onGoToDiagnostic={() => setCurrentTab('diagnostic')}
                    />
                  )}

                  {/* Laboratório Prático Interativo do Aluno */}
                  {currentTab === 'interactive_hub' && currentStudent && (
                    <StudentInteractiveHub
                      currentStudent={currentStudent}
                      teachers={teachers}
                      onBookTeacher={(t) => setSelectedTeacherForBooking(t)}
                      onGoToTeachers={() => setCurrentTab('teachers')}
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
                      initialTab={teacherInitialTab}
                    />
                  )}
                </>
              )}

              {/* ==================== TALKÊ CORE / ADMIN ==================== */}
              {currentRole === UserRole.Admin && (
                <>
                  {currentTab === 'admin-dash' && (
                    <TalkeAdminView
                      students={students}
                      teachers={teachers}
                      activeSection={adminInitialSection}
                      onSectionChange={(sec) => setAdminInitialSection(sec)}
                    />
                  )}
                </>
              )}

              {/* ==================== API CONSOLE ==================== */}
              {currentTab === 'api' && <ApiConsole currentStudent={currentStudent} />}
            </main>
          </div>
        </>
      )}

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
