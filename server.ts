import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import {
  UserRole,
  ProficiencyLevel,
  LearningGoal,
  LessonStatus,
  PaymentMethod,
  PaymentStatus,
  Student,
  Teacher,
  Lesson,
  Review,
  PaymentTransaction,
  AppNotification,
  AvailabilitySlot,
} from "./src/domain/types";
import { MatchingService } from "./src/domain/services/matchingService";
import { CommissionService } from "./src/domain/services/commissionService";

// In-Memory DDD Repositories
const studentsRepo: Map<string, Student> = new Map();
const teachersRepo: Map<string, Teacher> = new Map();
const lessonsRepo: Map<string, Lesson> = new Map();
const reviewsRepo: Map<string, Review> = new Map();
const paymentsRepo: Map<string, PaymentTransaction> = new Map();
const notificationsRepo: Map<string, AppNotification> = new Map();

// Helper to send notification
function pushNotification(
  userId: string,
  userRole: UserRole,
  title: string,
  message: string,
  type: 'BOOKING' | 'PAYMENT' | 'LESSON' | 'REVIEW' | 'SYSTEM',
  relatedLessonId?: string
) {
  const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const notif: AppNotification = {
    id,
    userId,
    userRole,
    title,
    message,
    type,
    read: false,
    relatedLessonId,
    createdAt: new Date().toISOString(),
  };
  notificationsRepo.set(id, notif);
  return notif;
}

// Generate default weekly availability slots
function generateDefaultAvailability(): AvailabilitySlot[] {
  const days = [
    { day: 1, label: 'Segunda-feira' },
    { day: 2, label: 'Terça-feira' },
    { day: 3, label: 'Quarta-feira' },
    { day: 4, label: 'Quinta-feira' },
    { day: 5, label: 'Sexta-feira' },
    { day: 6, label: 'Sábado' },
  ];
  const hours = ['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'];
  const slots: AvailabilitySlot[] = [];

  days.forEach((d) => {
    hours.forEach((h, idx) => {
      const endHour = String(Number(h.split(':')[0]) + 1).padStart(2, '0') + ':00';
      slots.push({
        id: `slot-${d.day}-${h.replace(':', '')}`,
        dayOfWeek: d.day,
        dayLabel: d.label,
        startTime: h,
        endTime: endHour,
        isAvailable: idx % 2 === 0 || d.day === 6, // sample availability pattern
      });
    });
  });

  return slots;
}

// Seed initial MVP Data
function seedDatabase() {
  // 1. Initial Students
  const student1: Student = {
    id: "std-001",
    name: "Jonathan Oliveira",
    email: "jonathan.oliveira.da@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    level: ProficiencyLevel.B1_Intermediate,
    goal: LearningGoal.Business,
    goalDescription: "Melhorar a desenvoltura em reuniões de tecnologia e entrevistas internacionais.",
    hasCompletedDiagnostic: true,
    walletBalanceBrl: 350.0,
    totalLessonsCompleted: 4,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  };
  studentsRepo.set(student1.id, student1);

  const student2: Student = {
    id: "std-002",
    name: "Camila Ribeiro",
    email: "camila.ribeiro@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
    level: undefined,
    goal: LearningGoal.Travel,
    goalDescription: "Destravar a fala para viagem de férias no exterior.",
    hasCompletedDiagnostic: false,
    walletBalanceBrl: 120.0,
    totalLessonsCompleted: 0,
    createdAt: new Date().toISOString(),
  };
  studentsRepo.set(student2.id, student2);

  // 2. Initial Teachers
  const teacher1: Teacher = {
    id: "tch-001",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@talke.com",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop",
    headline: "Especialista em Business English & Preparação de Entrevistas",
    bio: "Nativa de Londres (Reino Unido) com certificação CELTA pela Universidade de Cambridge. Especialista em treinar líderes, gerentes de produto e desenvolvedores de software para o mercado global.",
    hourlyPriceBrl: 110.0,
    levelsTaught: [
      ProficiencyLevel.B1_Intermediate,
      ProficiencyLevel.B2_Upper_Intermediate,
      ProficiencyLevel.C1_Advanced,
      ProficiencyLevel.C2_Proficient,
    ],
    specialties: [LearningGoal.Business, LearningGoal.Conversation],
    languages: ["Inglês (Nativo)", "Português (Fluente)"],
    certifications: ["CELTA Cambridge", "DELTA Module 1", "TEFL 120h"],
    availability: generateDefaultAvailability(),
    rating: 4.95,
    totalReviews: 28,
    totalLessonsCompleted: 142,
    isVerified: true,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  };
  teachersRepo.set(teacher1.id, teacher1);

  const teacher2: Teacher = {
    id: "tch-002",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@talke.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop",
    headline: "Conversação Descomplicada & Destrave Imediato",
    bio: "Mais de 6 anos de experiência ensinando brasileiros a perderem a vergonha de falar inglês. Metodologia comunicativa sem regras gramaticais chatas e com feedback em tempo real.",
    hourlyPriceBrl: 75.0,
    levelsTaught: [
      ProficiencyLevel.A1_Beginner,
      ProficiencyLevel.A2_Elementary,
      ProficiencyLevel.B1_Intermediate,
      ProficiencyLevel.B2_Upper_Intermediate,
    ],
    specialties: [LearningGoal.Conversation, LearningGoal.Travel, LearningGoal.BeginnerFoundation],
    languages: ["Inglês (C2)", "Espanhol (Nativo)", "Português (Fluente)"],
    certifications: ["TESOL International", "Licenciatura em Letras"],
    availability: generateDefaultAvailability(),
    rating: 4.88,
    totalReviews: 19,
    totalLessonsCompleted: 98,
    isVerified: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  };
  teachersRepo.set(teacher2.id, teacher2);

  const teacher3: Teacher = {
    id: "tch-003",
    name: "David Miller",
    email: "david.miller@talke.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop",
    headline: "Preparador Oficial para TOEFL iBT & IELTS Academic",
    bio: "Ex-examinador oficial IELTS nos Estados Unidos. Estratégias táticas e simulados para você atingir nota 100+ no TOEFL ou band 7.5+ no IELTS com rapidez.",
    hourlyPriceBrl: 130.0,
    levelsTaught: [
      ProficiencyLevel.B2_Upper_Intermediate,
      ProficiencyLevel.C1_Advanced,
      ProficiencyLevel.C2_Proficient,
    ],
    specialties: [LearningGoal.Exams, LearningGoal.Pronunciation, LearningGoal.Business],
    languages: ["Inglês (Nativo Americano)"],
    certifications: ["Master in Applied Linguistics", "IELTS Examiner Certified"],
    availability: generateDefaultAvailability(),
    rating: 4.98,
    totalReviews: 34,
    totalLessonsCompleted: 210,
    isVerified: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  };
  teachersRepo.set(teacher3.id, teacher3);

  const teacher4: Teacher = {
    id: "tch-004",
    name: "Beatriz Nogueira",
    email: "beatriz.nogueira@talke.com",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop",
    headline: "Fundamentos Sólidos, Pronúncia & Gramática Prática",
    bio: "Graduada pela USP com intercâmbio em Dublin. Ajudo iniciantes e intermediários a construírem confiança através de fonética clara e vocabulário relevante.",
    hourlyPriceBrl: 80.0,
    levelsTaught: [
      ProficiencyLevel.A1_Beginner,
      ProficiencyLevel.A2_Elementary,
      ProficiencyLevel.B1_Intermediate,
    ],
    specialties: [LearningGoal.BeginnerFoundation, LearningGoal.Pronunciation, LearningGoal.Conversation],
    languages: ["Português (Nativo)", "Inglês (C2)"],
    certifications: ["Cambridge C2 Proficiency (CPE)", "TEFL UK"],
    availability: generateDefaultAvailability(),
    rating: 4.92,
    totalReviews: 15,
    totalLessonsCompleted: 75,
    isVerified: true,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  };
  teachersRepo.set(teacher4.id, teacher4);

  // 3. Initial Lessons
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  const comm1 = CommissionService.calculateCommission(teacher1.hourlyPriceBrl);
  const lesson1: Lesson = {
    id: "lsn-101",
    studentId: student1.id,
    studentName: student1.name,
    teacherId: teacher1.id,
    teacherName: teacher1.name,
    scheduledDate: tomorrowDateStr,
    startTime: "14:00",
    durationMinutes: 50,
    status: LessonStatus.Confirmed,
    priceBrl: comm1.grossAmountBrl,
    platformFeeBrl: comm1.platformFeeBrl,
    teacherNetBrl: comm1.teacherNetBrl,
    topic: "Simulação de apresentação em inglês para investidores",
    meetingLink: "https://talke.app/room/lsn-101",
    whiteboardNotes: "Pauta: Pitch deck, vocabulário financeiro, tratamento de objeções e Q&A.",
    isPaid: true,
    paymentMethod: PaymentMethod.Pix,
    hasBeenReviewed: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  };
  lessonsRepo.set(lesson1.id, lesson1);

  // Sample Past Completed Lesson with review
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);
  const comm2 = CommissionService.calculateCommission(teacher2.hourlyPriceBrl);
  const lesson2: Lesson = {
    id: "lsn-102",
    studentId: student1.id,
    studentName: student1.name,
    teacherId: teacher2.id,
    teacherName: teacher2.name,
    scheduledDate: yesterday.toISOString().split('T')[0],
    startTime: "16:00",
    durationMinutes: 50,
    status: LessonStatus.Completed,
    priceBrl: comm2.grossAmountBrl,
    platformFeeBrl: comm2.platformFeeBrl,
    teacherNetBrl: comm2.teacherNetBrl,
    topic: "Conversação sobre cultura e hábitos em viagens",
    meetingLink: "https://talke.app/room/lsn-102",
    whiteboardNotes: "Vocabulário: customs, jet lag, booking adjustments, layover.",
    isPaid: true,
    paymentMethod: PaymentMethod.CreditCard,
    hasBeenReviewed: true,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  };
  lessonsRepo.set(lesson2.id, lesson2);

  // 4. Initial Review
  const review1: Review = {
    id: "rev-001",
    lessonId: lesson2.id,
    teacherId: teacher2.id,
    studentId: student1.id,
    studentName: student1.name,
    studentAvatar: student1.avatarUrl,
    rating: 5,
    comment: "Excelente aula! O professor Carlos é super paciente e me deixou muito à vontade para falar sem medo de errar. Recomendo muito!",
    tags: ["Muito paciente", "Ótima didática", "Pontual"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  };
  reviewsRepo.set(review1.id, review1);

  // 5. Initial Notifications
  pushNotification(
    student1.id,
    UserRole.Student,
    "Aula Confirmada!",
    `Sua aula com a professora ${teacher1.name} está confirmada para ${tomorrowDateStr} às 14:00.`,
    'BOOKING',
    lesson1.id
  );
  pushNotification(
    teacher1.id,
    UserRole.Teacher,
    "Nova Reserva de Aula",
    `O aluno ${student1.name} reservou uma aula para ${tomorrowDateStr} às 14:00. Valor: R$ ${comm1.teacherNetBrl.toFixed(2)} líquido.`,
    'BOOKING',
    lesson1.id
  );
}

seedDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // -------------------------------------------------------------
  // WeatherForecast (compatibility check with initial import)
  // -------------------------------------------------------------
  app.get("/weatherforecast", (_req: Request, res: Response) => {
    res.json([
      { date: new Date().toISOString().split('T')[0], temperatureC: 24, temperatureF: 75, summary: "Warm" }
    ]);
  });

  // -------------------------------------------------------------
  // TALKÊ: METRICS & SYSTEM HEALTH (Clean Architecture & Talkê Dashboard)
  // -------------------------------------------------------------
  app.get("/api/admin/metrics", (_req: Request, res: Response) => {
    const allLessons = Array.from(lessonsRepo.values());
    const paidLessons = allLessons.filter((l) => l.isPaid);
    const totalGmvBrl = paidLessons.reduce((acc, l) => acc + l.priceBrl, 0);
    const totalPlatformRevenueBrl = paidLessons.reduce((acc, l) => acc + l.platformFeeBrl, 0);
    const totalTeacherPayoutsBrl = paidLessons.reduce((acc, l) => acc + l.teacherNetBrl, 0);

    res.json({
      platform: "Talkê",
      totalStudents: studentsRepo.size,
      totalTeachers: teachersRepo.size,
      totalLessons: allLessons.length,
      completedLessons: allLessons.filter((l) => l.status === LessonStatus.Completed).length,
      totalGmvBrl,
      totalPlatformRevenueBrl,
      totalTeacherPayoutsBrl,
      platformTakeRate: CommissionService.DEFAULT_PLATFORM_RATE * 100,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // ALUNO: CRIAR CONTA & PERFIL
  // -------------------------------------------------------------
  app.get("/api/students", (_req: Request, res: Response) => {
    res.json(Array.from(studentsRepo.values()));
  });

  app.get("/api/students/:id", (req: Request, res: Response) => {
    const student = studentsRepo.get(req.params.id);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    res.json(student);
  });

  app.post("/api/students", (req: Request, res: Response) => {
    const { name, email, avatarUrl, goal, goalDescription } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
    }

    const id = `std-${Date.now()}`;
    const newStudent: Student = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      goal: goal || LearningGoal.Conversation,
      goalDescription: goalDescription || "Aprender inglês com foco em conversação.",
      hasCompletedDiagnostic: false,
      walletBalanceBrl: 150.0, // Initial balance bonus for testing MVP
      totalLessonsCompleted: 0,
      createdAt: new Date().toISOString(),
    };
    studentsRepo.set(id, newStudent);

    pushNotification(
      id,
      UserRole.Student,
      "Bem-vindo à Talkê! 🗣️",
      "Sua conta foi criada com sucesso! Faça seu diagnóstico de nível gratuito para receber recomendações sob medida.",
      'SYSTEM'
    );

    res.status(201).json(newStudent);
  });

  // ALUNO: RESPONDER DIAGNÓSTICO & DEFINIR OBJETIVO
  app.post("/api/students/:id/diagnostic", (req: Request, res: Response) => {
    const student = studentsRepo.get(req.params.id);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    const { level, goal, goalDescription } = req.body;
    if (level !== undefined) student.level = Number(level);
    if (goal !== undefined) student.goal = goal;
    if (goalDescription !== undefined) student.goalDescription = goalDescription;
    student.hasCompletedDiagnostic = true;

    studentsRepo.set(student.id, student);

    pushNotification(
      student.id,
      UserRole.Student,
      "Diagnóstico Talkê Concluído!",
      `Seu nível foi identificado e seu objetivo foi registrado. Veja os professores recomendados para você!`,
      'SYSTEM'
    );

    res.json(student);
  });

  // -------------------------------------------------------------
  // PROFESSOR: CRIAR CONTA, CRIAR PERFIL, INFORMAR CONHECIMENTO, PREÇO, DISPONIBILIDADE
  // -------------------------------------------------------------
  app.get("/api/teachers", (req: Request, res: Response) => {
    let teachers = Array.from(teachersRepo.values());

    const { goal, level, maxPrice, search } = req.query;
    if (goal) {
      teachers = teachers.filter((t) => t.specialties.includes(goal as LearningGoal));
    }
    if (level) {
      const lvlNum = Number(level);
      teachers = teachers.filter((t) => t.levelsTaught.includes(lvlNum));
    }
    if (maxPrice) {
      teachers = teachers.filter((t) => t.hourlyPriceBrl <= Number(maxPrice));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      teachers = teachers.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.headline.toLowerCase().includes(q) ||
          t.bio.toLowerCase().includes(q)
      );
    }

    res.json(teachers);
  });

  app.get("/api/teachers/:id", (req: Request, res: Response) => {
    const teacher = teachersRepo.get(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    // Include teacher's reviews
    const teacherReviews = Array.from(reviewsRepo.values()).filter((r) => r.teacherId === teacher.id);
    res.json({
      ...teacher,
      reviews: teacherReviews,
    });
  });

  app.post("/api/teachers", (req: Request, res: Response) => {
    const {
      name,
      email,
      headline,
      bio,
      hourlyPriceBrl,
      levelsTaught,
      specialties,
      languages,
      certifications,
      avatarUrl,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
    }

    const id = `tch-${Date.now()}`;
    const newTeacher: Teacher = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      headline: headline || "Professor de Inglês Talkê",
      bio: bio || "Apaixonado por ensinar e transformar a carreira dos meus alunos através do inglês.",
      hourlyPriceBrl: Number(hourlyPriceBrl) || 80.0,
      levelsTaught: levelsTaught || [ProficiencyLevel.A1_Beginner, ProficiencyLevel.B1_Intermediate],
      specialties: specialties || [LearningGoal.Conversation],
      languages: languages || ["Português (Nativo)", "Inglês (Fluente)"],
      certifications: certifications || ["Certificação Talkê"],
      availability: generateDefaultAvailability(),
      rating: 5.0,
      totalReviews: 0,
      totalLessonsCompleted: 0,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    teachersRepo.set(id, newTeacher);

    pushNotification(
      id,
      UserRole.Teacher,
      "Bem-vindo à equipe de professores Talkê!",
      "Seu perfil foi publicado com sucesso. Defina seus horários de disponibilidade para receber reservas de alunos.",
      'SYSTEM'
    );

    res.status(201).json(newTeacher);
  });

  // PROFESSOR: ATUALIZAR PERFIL, CONHECIMENTO E PREÇO
  app.patch("/api/teachers/:id/profile", (req: Request, res: Response) => {
    const teacher = teachersRepo.get(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    const { headline, bio, hourlyPriceBrl, levelsTaught, specialties, languages, certifications } = req.body;
    if (headline !== undefined) teacher.headline = headline;
    if (bio !== undefined) teacher.bio = bio;
    if (hourlyPriceBrl !== undefined) teacher.hourlyPriceBrl = Number(hourlyPriceBrl);
    if (levelsTaught !== undefined) teacher.levelsTaught = levelsTaught;
    if (specialties !== undefined) teacher.specialties = specialties;
    if (languages !== undefined) teacher.languages = languages;
    if (certifications !== undefined) teacher.certifications = certifications;

    teachersRepo.set(teacher.id, teacher);
    res.json(teacher);
  });

  // PROFESSOR: DEFINIR DISPONIBILIDADE
  app.put("/api/teachers/:id/availability", (req: Request, res: Response) => {
    const teacher = teachersRepo.get(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    const { availability } = req.body;
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ error: "Grade de disponibilidade inválida." });
    }

    teacher.availability = availability;
    teachersRepo.set(teacher.id, teacher);

    res.json({ success: true, availability: teacher.availability });
  });

  // PROFESSOR: GANHOS & EXTRATO DE PAGAMENTOS
  app.get("/api/teachers/:id/earnings", (req: Request, res: Response) => {
    const teacher = teachersRepo.get(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    const teacherLessons = Array.from(lessonsRepo.values()).filter((l) => l.teacherId === teacher.id && l.isPaid);
    const totalGross = teacherLessons.reduce((acc, l) => acc + l.priceBrl, 0);
    const totalPlatformCommission = teacherLessons.reduce((acc, l) => acc + l.platformFeeBrl, 0);
    const totalNetEarnings = teacherLessons.reduce((acc, l) => acc + l.teacherNetBrl, 0);

    const completedNetEarnings = teacherLessons
      .filter((l) => l.status === LessonStatus.Completed)
      .reduce((acc, l) => acc + l.teacherNetBrl, 0);

    const pendingEscrow = totalNetEarnings - completedNetEarnings;

    res.json({
      teacherId: teacher.id,
      totalGross,
      totalPlatformCommission,
      totalNetEarnings,
      availableForWithdrawalBrl: completedNetEarnings,
      escrowPendingBrl: pendingEscrow,
      platformRatePercent: CommissionService.DEFAULT_PLATFORM_RATE * 100,
      lessons: teacherLessons,
    });
  });

  // -------------------------------------------------------------
  // TALKÊ: MATCHING INTELIGENTE
  // -------------------------------------------------------------
  app.get("/api/matching/:studentId", (req: Request, res: Response) => {
    const student = studentsRepo.get(req.params.studentId);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    const allTeachers = Array.from(teachersRepo.values());
    const recommendations = MatchingService.rankTeachers(student, allTeachers);
    res.json(recommendations);
  });

  // -------------------------------------------------------------
  // AULAS: ESCOLHER HORÁRIO, RESERVAR AULA, FAZER AULA, CONCLUIR
  // -------------------------------------------------------------
  app.get("/api/lessons", (req: Request, res: Response) => {
    let list = Array.from(lessonsRepo.values());
    const { studentId, teacherId, status } = req.query;

    if (studentId) list = list.filter((l) => l.studentId === studentId);
    if (teacherId) list = list.filter((l) => l.teacherId === teacherId);
    if (status) list = list.filter((l) => l.status === status);

    list.sort((a, b) => new Date(`${b.scheduledDate}T${b.startTime}`).getTime() - new Date(`${a.scheduledDate}T${a.startTime}`).getTime());
    res.json(list);
  });

  app.get("/api/lessons/:id", (req: Request, res: Response) => {
    const lesson = lessonsRepo.get(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Aula não encontrada." });
    res.json(lesson);
  });

  app.post("/api/lessons", (req: Request, res: Response) => {
    const { studentId, teacherId, scheduledDate, startTime, topic } = req.body;
    if (!studentId || !teacherId || !scheduledDate || !startTime) {
      return res.status(400).json({ error: "Dados incompletos para a reserva." });
    }

    const student = studentsRepo.get(studentId);
    const teacher = teachersRepo.get(teacherId);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    // Calculate commission using DDD Domain Service
    const commission = CommissionService.calculateCommission(teacher.hourlyPriceBrl);

    const lessonId = `lsn-${Date.now()}`;
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
      topic: topic || "Conversação e objetivos definidos pelo aluno",
      meetingLink: `https://talke.app/room/${lessonId}`,
      whiteboardNotes: `Aula Talkê com ${teacher.name} e ${student.name}.`,
      isPaid: false, // will be paid in checkout
      hasBeenReviewed: false,
      createdAt: new Date().toISOString(),
    };

    lessonsRepo.set(lessonId, newLesson);

    // Notifications
    pushNotification(
      teacher.id,
      UserRole.Teacher,
      "Nova Aula Reservada!",
      `O aluno ${student.name} agendou uma aula para ${scheduledDate} às ${startTime}.`,
      'BOOKING',
      lessonId
    );

    res.status(201).json(newLesson);
  });

  // ALUNO: PAGAMENTO DA AULA (PIX, CARTÃO OU CARTEIRA)
  app.post("/api/payments/checkout", (req: Request, res: Response) => {
    const { lessonId, method, studentId } = req.body;
    const lesson = lessonsRepo.get(lessonId);
    if (!lesson) return res.status(404).json({ error: "Aula não encontrada para pagamento." });

    const student = studentsRepo.get(studentId || lesson.studentId);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    const amount = lesson.priceBrl;

    // If wallet, check balance and deduct
    if (method === PaymentMethod.Wallet) {
      if (student.walletBalanceBrl < amount) {
        return res.status(400).json({
          error: `Saldo insuficiente na carteira (R$ ${student.walletBalanceBrl.toFixed(2)}). Recarregue ou selecione PIX/Cartão.`,
        });
      }
      student.walletBalanceBrl -= amount;
      studentsRepo.set(student.id, student);
    }

    // Mark lesson as paid
    lesson.isPaid = true;
    lesson.paymentMethod = method;
    lessonsRepo.set(lesson.id, lesson);

    // Register transaction
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
    paymentsRepo.set(txId, transaction);

    // Notify student and teacher
    pushNotification(
      student.id,
      UserRole.Student,
      "Pagamento Aprovado!",
      `O pagamento de R$ ${amount.toFixed(2)} para a aula com ${lesson.teacherName} foi processado com sucesso.`,
      'PAYMENT',
      lesson.id
    );

    pushNotification(
      lesson.teacherId,
      UserRole.Teacher,
      "Pagamento Confirmado!",
      `O aluno ${student.name} concluiu o pagamento da aula. Crédito líquido a receber: R$ ${lesson.teacherNetBrl.toFixed(2)}.`,
      'PAYMENT',
      lesson.id
    );

    res.json({
      success: true,
      transaction,
      lesson,
      newWalletBalanceBrl: student.walletBalanceBrl,
    });
  });

  // REALIZAR / CONCLUIR AULA & SALVAR NOTAS DA SALA
  app.patch("/api/lessons/:id/status", (req: Request, res: Response) => {
    const lesson = lessonsRepo.get(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Aula não encontrada." });

    const { status, whiteboardNotes } = req.body;
    if (status) lesson.status = status as LessonStatus;
    if (whiteboardNotes !== undefined) lesson.whiteboardNotes = whiteboardNotes;

    // If completed, increment lesson count for student & teacher
    if (status === LessonStatus.Completed) {
      const student = studentsRepo.get(lesson.studentId);
      if (student) {
        student.totalLessonsCompleted += 1;
        studentsRepo.set(student.id, student);
      }

      const teacher = teachersRepo.get(lesson.teacherId);
      if (teacher) {
        teacher.totalLessonsCompleted += 1;
        teachersRepo.set(teacher.id, teacher);
      }

      // Prompt student for review
      pushNotification(
        lesson.studentId,
        UserRole.Student,
        "Avalie sua aula!",
        `Como foi sua aula com ${lesson.teacherName}? Deixe sua avaliação e ajude a comunidade Talkê.`,
        'REVIEW',
        lesson.id
      );

      // Inform teacher of earnings release
      pushNotification(
        lesson.teacherId,
        UserRole.Teacher,
        "Aula Concluída & Saldo Liberado!",
        `Sua aula com ${lesson.studentName} foi finalizada. R$ ${lesson.teacherNetBrl.toFixed(2)} disponíveis para saque!`,
        'PAYMENT',
        lesson.id
      );
    }

    lessonsRepo.set(lesson.id, lesson);
    res.json(lesson);
  });

  // ALUNO: AVALIAR PROFESSOR (RATING, TAGS & COMENTÁRIO)
  app.post("/api/lessons/:id/review", (req: Request, res: Response) => {
    const lesson = lessonsRepo.get(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Aula não encontrada." });

    const { rating, comment, tags } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Nota de avaliação deve ser entre 1 e 5 estrelas." });
    }

    const student = studentsRepo.get(lesson.studentId);
    const teacher = teachersRepo.get(lesson.teacherId);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    const reviewId = `rev-${Date.now()}`;
    const review: Review = {
      id: reviewId,
      lessonId: lesson.id,
      teacherId: teacher.id,
      studentId: lesson.studentId,
      studentName: student?.name || lesson.studentName,
      studentAvatar: student?.avatarUrl,
      rating: Number(rating),
      comment: comment || "",
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };
    reviewsRepo.set(reviewId, review);

    // Update lesson
    lesson.hasBeenReviewed = true;
    lessonsRepo.set(lesson.id, lesson);

    // Recalculate teacher rating average
    const allTeacherReviews = Array.from(reviewsRepo.values()).filter((r) => r.teacherId === teacher.id);
    const avgRating = allTeacherReviews.reduce((acc, r) => acc + r.rating, 0) / allTeacherReviews.length;
    teacher.rating = Math.round(avgRating * 100) / 100;
    teacher.totalReviews = allTeacherReviews.length;
    teachersRepo.set(teacher.id, teacher);

    pushNotification(
      teacher.id,
      UserRole.Teacher,
      "Nova Avaliação Recebida! ⭐",
      `${lesson.studentName} avaliou sua aula com ${rating} estrelas: "${comment.slice(0, 60)}..."`,
      'REVIEW',
      lesson.id
    );

    res.status(201).json({ review, teacherRating: teacher.rating });
  });

  // -------------------------------------------------------------
  // NOTIFICAÇÕES (ALUNO, PROFESSOR E TALKÊ)
  // -------------------------------------------------------------
  app.get("/api/notifications", (req: Request, res: Response) => {
    const { userId } = req.query;
    let list = Array.from(notificationsRepo.values());
    if (userId) {
      list = list.filter((n) => n.userId === userId || n.userId === 'all');
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  });

  app.patch("/api/notifications/:id/read", (req: Request, res: Response) => {
    const notif = notificationsRepo.get(req.params.id);
    if (!notif) return res.status(404).json({ error: "Notificação não encontrada." });
    notif.read = true;
    notificationsRepo.set(notif.id, notif);
    res.json(notif);
  });

  // -------------------------------------------------------------
  // CARTEIRA: RECARREGAR SALDO DO ALUNO
  // -------------------------------------------------------------
  app.post("/api/students/:id/wallet/topup", (req: Request, res: Response) => {
    const student = studentsRepo.get(req.params.id);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    const { amountBrl } = req.body;
    const amount = Number(amountBrl);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valor de recarga inválido." });
    }

    student.walletBalanceBrl += amount;
    studentsRepo.set(student.id, student);

    pushNotification(
      student.id,
      UserRole.Student,
      "Recarga Efetuada!",
      `R$ ${amount.toFixed(2)} foram adicionados à sua carteira Talkê. Novo saldo: R$ ${student.walletBalanceBrl.toFixed(2)}.`,
      'PAYMENT'
    );

    res.json({ success: true, newBalanceBrl: student.walletBalanceBrl });
  });

  // -------------------------------------------------------------
  // Vite Middleware & Static Serving
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Talkê Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
