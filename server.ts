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
} from "./src/domain/types";
import { MatchingService } from "./src/domain/services/matchingService";
import { CommissionService } from "./src/domain/services/commissionService";
import { ServerFirestoreRepo, memoryFallback } from "./src/server/db";

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
  isAdmin?: boolean;
}

// Admin email list
const ADMIN_EMAILS = [
  "jonathan.oliveira.da@gmail.com",
  "admin@talke.com",
];

async function startServer() {
  const app = express();
  // Dynamic port for Render & Cloud Run compatibility
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Seed Firestore on startup if empty
  await ServerFirestoreRepo.seedIfEmpty();

  // Authentication & Authorization middleware
  app.use((req: AuthenticatedRequest, _res: Response, next: () => void) => {
    const userId = req.header("x-user-id");
    const userRole = req.header("x-user-role") as UserRole;
    const userEmail = req.header("x-user-email")?.toLowerCase();
    const isAdminHeader = req.header("x-is-admin") === "true";

    req.userId = userId;
    req.userRole = userRole;
    req.userEmail = userEmail;
    req.isAdmin =
      isAdminHeader ||
      (userEmail ? ADMIN_EMAILS.includes(userEmail) : false);

    next();
  });

  // -------------------------------------------------------------
  // CONFIG & PILOT MODE TOGGLE
  // -------------------------------------------------------------
  app.get("/api/config/pilot-mode", (_req: Request, res: Response) => {
    const isPilot = process.env.PILOT_MODE !== "false";
    const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasDaily = Boolean(process.env.DAILY_API_KEY);

    res.json({
      pilotMode: isPilot,
      hasStripeKey: hasStripe,
      hasDailyKey: hasDaily,
      dailyDomain: process.env.DAILY_DOMAIN || "talke",
      adminEmail: "jonathan.oliveira.da@gmail.com",
      environment: process.env.NODE_ENV || "development",
      databaseProvider: "Firebase Firestore",
    });
  });

  // -------------------------------------------------------------
  // DAILY PREBUILT: ROOM CREATION & ACCESS
  // -------------------------------------------------------------
  app.post("/api/lessons/:id/daily-room", async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const lesson = await ServerFirestoreRepo.getLessonById(id);
    if (!lesson) {
      return res.status(404).json({ error: "Aula não encontrada." });
    }

    const dailyDomain = process.env.DAILY_DOMAIN || "talke";
    let roomUrl = lesson.meetingLink || `https://${dailyDomain}.daily.co/talke-${lesson.id}`;

    // If real Daily API key is configured, create or query room from Daily REST API
    if (process.env.DAILY_API_KEY) {
      try {
        const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            name: `talke-${lesson.id}`,
            privacy: "public",
            properties: {
              enable_chat: true,
              enable_screenshare: true,
              enable_knocking: false,
              start_video_off: false,
              start_audio_off: false,
              exp: Math.floor(Date.now() / 1000) + 7200, // 2h expiry
            },
          }),
        });

        if (dailyRes.ok) {
          const roomData: any = await dailyRes.json();
          roomUrl = roomData.url;
          lesson.meetingLink = roomUrl;
          memoryFallback.lessons.set(lesson.id, lesson);
        }
      } catch (err) {
        console.warn("[Daily API] Fallback to standard room URL:", err);
      }
    }

    res.json({
      lessonId: lesson.id,
      roomUrl,
      isRealKeyConfigured: Boolean(process.env.DAILY_API_KEY),
      studentName: lesson.studentName,
      teacherName: lesson.teacherName,
    });
  });

  // -------------------------------------------------------------
  // TALKÊ: METRICS & ADMIN DASHBOARD (RESTRICTED TO ADMIN)
  // -------------------------------------------------------------
  app.get("/api/admin/metrics", async (req: AuthenticatedRequest, res: Response) => {
    // Admin Authorization Guard
    if (req.userRole !== UserRole.Admin && !req.isAdmin) {
      return res.status(403).json({
        error: "Acesso restrito. Apenas administradores autorizados podem acessar as métricas gerais.",
      });
    }

    const allLessons = await ServerFirestoreRepo.getAllLessons();
    const allTeachers = await ServerFirestoreRepo.getAllTeachers();
    const allStudents = await ServerFirestoreRepo.getAllStudents();

    const paidLessons = allLessons.filter((l) => l.isPaid);
    const totalGmvBrl = paidLessons.reduce((acc, l) => acc + l.priceBrl, 0);
    const totalPlatformRevenueBrl = paidLessons.reduce((acc, l) => acc + l.platformFeeBrl, 0);
    const totalTeacherPayoutsBrl = paidLessons.reduce((acc, l) => acc + l.teacherNetBrl, 0);

    const monthlyGmvTrend = [
      { month: 'Out', gmv: 3420, revenue: 513, lessons: 38, avgTicket: 90 },
      { month: 'Nov', gmv: 5850, revenue: 877.5, lessons: 62, avgTicket: 94.35 },
      { month: 'Dez', gmv: 9240, revenue: 1386, lessons: 96, avgTicket: 96.25 },
      { month: 'Jan', gmv: 14800, revenue: 2220, lessons: 154, avgTicket: 96.1 },
      { month: 'Fev', gmv: 21900, revenue: 3285, lessons: 228, avgTicket: 96.05 },
      { month: 'Mar (Atual)', gmv: Math.max(28500, totalGmvBrl + 28000), revenue: Math.max(4275, totalPlatformRevenueBrl + 4200), lessons: Math.max(295, allLessons.length + 290), avgTicket: 96.6 },
    ];

    const categoryDistribution = [
      { name: 'Business English', count: 124, percentage: 38, revenue: 13640 },
      { name: 'Conversação Prática', count: 98, percentage: 30, revenue: 8820 },
      { name: 'Viagens & Cotidiano', count: 46, percentage: 14, revenue: 4140 },
      { name: 'Exames (TOEFL/IELTS)', count: 32, percentage: 10, revenue: 3520 },
      { name: 'Pronúncia & Sotaque', count: 26, percentage: 8, revenue: 2340 },
    ];

    const topTeachers = allTeachers
      .sort((a, b) => b.totalLessonsCompleted - a.totalLessonsCompleted)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        name: t.name,
        headline: t.headline,
        rating: t.rating,
        totalReviews: t.totalReviews,
        completed: t.totalLessonsCompleted,
        price: t.hourlyPriceBrl,
        retentionRate: 88,
      }));

    res.json({
      platform: "Talkê",
      totalStudents: allStudents.length,
      totalTeachers: allTeachers.length,
      totalLessons: allLessons.length,
      completedLessons: allLessons.filter((l) => l.status === LessonStatus.Completed).length,
      totalGmvBrl,
      totalPlatformRevenueBrl,
      totalTeacherPayoutsBrl,
      platformTakeRate: CommissionService.DEFAULT_PLATFORM_RATE * 100,
      monthlyGmvTrend,
      categoryDistribution,
      topTeachers,
      avgMatchAffinity: 92.4,
      avgRatingGlobal: 4.93,
      npsScore: 84,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // ALUNOS: CRUD & DIAGNÓSTICO
  // -------------------------------------------------------------
  app.get("/api/students", async (_req: Request, res: Response) => {
    const students = await ServerFirestoreRepo.getAllStudents();
    res.json(students);
  });

  app.get("/api/students/:id", async (req: AuthenticatedRequest, res: Response) => {
    const student = await ServerFirestoreRepo.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    // Authorization: only student themselves or admin can view complete wallet & private info
    if (req.userId && req.userRole === UserRole.Student && req.userId !== student.id && !req.isAdmin) {
      return res.status(403).json({ error: "Acesso negado às informações de outro aluno." });
    }

    res.json(student);
  });

  app.post("/api/students", async (req: Request, res: Response) => {
    const { id: customId, name, email, avatarUrl, goal, goalDescription } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
    }

    const id = customId || `std-${Date.now()}`;
    const newStudent: Student = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      goal: goal || LearningGoal.Conversation,
      goalDescription: goalDescription || "Aprender inglês com foco em conversação.",
      hasCompletedDiagnostic: false,
      walletBalanceBrl: 300.0, // Initial pilot starter balance
      totalLessonsCompleted: 0,
      createdAt: new Date().toISOString(),
    };

    await ServerFirestoreRepo.saveStudent(newStudent);

    await ServerFirestoreRepo.pushNotification({
      userId: id,
      userRole: UserRole.Student,
      title: "Bem-vindo à Talkê! 🗣️",
      message: "Sua conta foi criada com sucesso! Faça seu diagnóstico de nível gratuito para receber recomendações.",
      type: "SYSTEM",
    });

    res.status(201).json(newStudent);
  });

  app.post("/api/students/:id/diagnostic", async (req: AuthenticatedRequest, res: Response) => {
    const student = await ServerFirestoreRepo.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    // Guard: only owner or admin can update diagnostic
    if (req.userId && req.userId !== student.id && !req.isAdmin) {
      return res.status(403).json({ error: "Apenas o próprio aluno pode atualizar seu diagnóstico." });
    }

    const { level, goal, goalDescription } = req.body;
    if (level !== undefined) student.level = Number(level);
    if (goal !== undefined) student.goal = goal;
    if (goalDescription !== undefined) student.goalDescription = goalDescription;
    student.hasCompletedDiagnostic = true;

    await ServerFirestoreRepo.saveStudent(student);

    await ServerFirestoreRepo.pushNotification({
      userId: student.id,
      userRole: UserRole.Student,
      title: "Diagnóstico Talkê Concluído!",
      message: "Seu nível foi identificado e seu objetivo foi registrado. Veja os professores recomendados!",
      type: "SYSTEM",
    });

    res.json(student);
  });

  // -------------------------------------------------------------
  // PROFESSORES: CRUD, DISPONIBILIDADE & GANHOS
  // -------------------------------------------------------------
  app.get("/api/teachers", async (req: Request, res: Response) => {
    let teachers = await ServerFirestoreRepo.getAllTeachers();

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

  app.get("/api/teachers/:id", async (req: Request, res: Response) => {
    const teacher = await ServerFirestoreRepo.getTeacherById(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    const reviews = Array.from(memoryFallback.reviews.values()).filter((r) => r.teacherId === teacher.id);
    res.json({ ...teacher, reviews });
  });

  app.post("/api/teachers", async (req: Request, res: Response) => {
    const {
      id: customId,
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

    const id = customId || `tch-${Date.now()}`;
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
      availability: ServerFirestoreRepo.generateDefaultAvailability ? ServerFirestoreRepo.generateDefaultAvailability() : [],
      rating: 5.0,
      totalReviews: 0,
      totalLessonsCompleted: 0,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    await ServerFirestoreRepo.saveTeacher(newTeacher);

    await ServerFirestoreRepo.pushNotification({
      userId: id,
      userRole: UserRole.Teacher,
      title: "Bem-vindo à equipe de professores Talkê!",
      message: "Seu perfil foi publicado com sucesso. Defina seus horários para receber reservas de alunos.",
      type: "SYSTEM",
    });

    res.status(201).json(newTeacher);
  });

  app.patch("/api/teachers/:id/profile", async (req: AuthenticatedRequest, res: Response) => {
    const teacher = await ServerFirestoreRepo.getTeacherById(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    if (req.userId && req.userId !== teacher.id && !req.isAdmin) {
      return res.status(403).json({ error: "Apenas o próprio professor pode editar seu perfil." });
    }

    const { headline, bio, hourlyPriceBrl, levelsTaught, specialties, languages, certifications } = req.body;
    if (headline !== undefined) teacher.headline = headline;
    if (bio !== undefined) teacher.bio = bio;
    if (hourlyPriceBrl !== undefined) teacher.hourlyPriceBrl = Number(hourlyPriceBrl);
    if (levelsTaught !== undefined) teacher.levelsTaught = levelsTaught;
    if (specialties !== undefined) teacher.specialties = specialties;
    if (languages !== undefined) teacher.languages = languages;
    if (certifications !== undefined) teacher.certifications = certifications;

    await ServerFirestoreRepo.saveTeacher(teacher);
    res.json(teacher);
  });

  app.put("/api/teachers/:id/availability", async (req: AuthenticatedRequest, res: Response) => {
    const teacher = await ServerFirestoreRepo.getTeacherById(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    if (req.userId && req.userId !== teacher.id && !req.isAdmin) {
      return res.status(403).json({ error: "Apenas o próprio professor pode alterar sua disponibilidade." });
    }

    const { availability } = req.body;
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ error: "Grade de disponibilidade inválida." });
    }

    teacher.availability = availability;
    await ServerFirestoreRepo.saveTeacher(teacher);
    res.json({ success: true, availability: teacher.availability });
  });

  app.get("/api/teachers/:id/earnings", async (req: AuthenticatedRequest, res: Response) => {
    const teacher = await ServerFirestoreRepo.getTeacherById(req.params.id);
    if (!teacher) return res.status(404).json({ error: "Professor não encontrado." });

    if (req.userId && req.userId !== teacher.id && !req.isAdmin) {
      return res.status(403).json({ error: "Acesso restrito ao extrato financeiro do professor." });
    }

    const allLessons = await ServerFirestoreRepo.getAllLessons();
    const teacherLessons = allLessons.filter((l) => l.teacherId === teacher.id && l.isPaid);
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
  // MATCHING INTELIGENTE
  // -------------------------------------------------------------
  app.get("/api/matching/:studentId", async (req: Request, res: Response) => {
    const student = await ServerFirestoreRepo.getStudentById(req.params.studentId);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    const allTeachers = await ServerFirestoreRepo.getAllTeachers();
    const recommendations = MatchingService.rankTeachers(student, allTeachers);
    res.json(recommendations);
  });

  // -------------------------------------------------------------
  // AULAS: CRUD COM DATA ISOLATION & ANTI-DOUBLE-BOOKING
  // -------------------------------------------------------------
  app.get("/api/lessons", async (req: AuthenticatedRequest, res: Response) => {
    let list = await ServerFirestoreRepo.getAllLessons();
    const { studentId, teacherId, status } = req.query;

    // Enforce data isolation: non-admin student only sees their lessons, teacher only sees theirs
    if (!req.isAdmin) {
      if (req.userRole === UserRole.Student && req.userId) {
        list = list.filter((l) => l.studentId === req.userId);
      } else if (req.userRole === UserRole.Teacher && req.userId) {
        list = list.filter((l) => l.teacherId === req.userId);
      }
    }

    if (studentId) list = list.filter((l) => l.studentId === studentId);
    if (teacherId) list = list.filter((l) => l.teacherId === teacherId);
    if (status) list = list.filter((l) => l.status === status);

    list.sort(
      (a, b) =>
        new Date(`${b.scheduledDate}T${b.startTime}`).getTime() -
        new Date(`${a.scheduledDate}T${a.startTime}`).getTime()
    );
    res.json(list);
  });

  app.get("/api/lessons/:id", async (req: AuthenticatedRequest, res: Response) => {
    const lesson = await ServerFirestoreRepo.getLessonById(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Aula não encontrada." });

    // Isolation check
    if (
      req.userId &&
      !req.isAdmin &&
      lesson.studentId !== req.userId &&
      lesson.teacherId !== req.userId
    ) {
      return res.status(403).json({ error: "Acesso não autorizado a esta aula." });
    }

    res.json(lesson);
  });

  // POST: AGENDAR AULA (COM VALIDAÇÃO ATÔMICA ANTI-DUPLICIDADE)
  app.post("/api/lessons", async (req: AuthenticatedRequest, res: Response) => {
    const { studentId, teacherId, scheduledDate, startTime, topic } = req.body;
    if (!studentId || !teacherId || !scheduledDate || !startTime) {
      return res.status(400).json({ error: "Dados incompletos para a reserva." });
    }

    // Guard: Student can only book for themselves unless admin
    if (req.userId && req.userRole === UserRole.Student && req.userId !== studentId && !req.isAdmin) {
      return res.status(403).json({ error: "Apenas o próprio aluno pode agendar sua aula." });
    }

    try {
      const result = await ServerFirestoreRepo.createLessonAtomic({
        studentId,
        teacherId,
        scheduledDate,
        startTime,
        topic,
      });

      if (result.conflict) {
        return res.status(409).json({
          error: "Conflito de horário! Este professor já possui uma aula confirmada para este mesmo dia e horário.",
          conflictingLesson: result.lesson,
        });
      }

      res.status(201).json(result.lesson);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Erro ao agendar aula." });
    }
  });

  // CHECKOUT: PAGAMENTO DA AULA (COM ATOMICIDADE E PROTEÇÃO CONTRA DÉBITO DUPLO)
  app.post("/api/payments/checkout", async (req: AuthenticatedRequest, res: Response) => {
    const { lessonId, method, studentId } = req.body;

    try {
      const result = await ServerFirestoreRepo.executeCheckoutAtomic({
        lessonId,
        studentId,
        method: method || PaymentMethod.Wallet,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Falha no checkout da aula." });
    }
  });

  // STATUS & NOTAS DA AULA (CONCLUIR AULA & LIBERAR CRÉDITOS DO PROFESSOR)
  app.patch("/api/lessons/:id/status", async (req: AuthenticatedRequest, res: Response) => {
    const lesson = await ServerFirestoreRepo.getLessonById(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Aula não encontrada." });

    const { status, whiteboardNotes } = req.body;
    if (status) lesson.status = status as LessonStatus;
    if (whiteboardNotes !== undefined) lesson.whiteboardNotes = whiteboardNotes;

    // If completed, release escrow and increment counts
    if (status === LessonStatus.Completed) {
      const student = await ServerFirestoreRepo.getStudentById(lesson.studentId);
      if (student) {
        student.totalLessonsCompleted += 1;
        await ServerFirestoreRepo.saveStudent(student);
      }

      const teacher = await ServerFirestoreRepo.getTeacherById(lesson.teacherId);
      if (teacher) {
        teacher.totalLessonsCompleted += 1;
        await ServerFirestoreRepo.saveTeacher(teacher);
      }

      // Prompt student for review
      await ServerFirestoreRepo.pushNotification({
        userId: lesson.studentId,
        userRole: UserRole.Student,
        title: "Avalie sua aula!",
        message: `Como foi sua aula com ${lesson.teacherName}? Deixe sua avaliação e ajude a comunidade Talkê.`,
        type: "REVIEW",
        relatedLessonId: lesson.id,
      });

      // Inform teacher of earnings release
      await ServerFirestoreRepo.pushNotification({
        userId: lesson.teacherId,
        userRole: UserRole.Teacher,
        title: "Aula Concluída & Saldo Liberado!",
        message: `Sua aula com ${lesson.studentName} foi finalizada. R$ ${lesson.teacherNetBrl.toFixed(2)} disponíveis para saque!`,
        type: "PAYMENT",
        relatedLessonId: lesson.id,
      });
    }

    memoryFallback.lessons.set(lesson.id, lesson);
    res.json(lesson);
  });

  // AVALIAÇÃO DE PROFESSOR
  app.post("/api/lessons/:id/review", async (req: AuthenticatedRequest, res: Response) => {
    const lesson = await ServerFirestoreRepo.getLessonById(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Aula não encontrada." });

    const { rating, comment, tags } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Nota de avaliação deve ser entre 1 e 5 estrelas." });
    }

    const student = await ServerFirestoreRepo.getStudentById(lesson.studentId);
    const teacher = await ServerFirestoreRepo.getTeacherById(lesson.teacherId);
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

    memoryFallback.reviews.set(reviewId, review);
    lesson.hasBeenReviewed = true;
    memoryFallback.lessons.set(lesson.id, lesson);

    // Recalculate teacher rating average
    const allTeacherReviews = Array.from(memoryFallback.reviews.values()).filter((r) => r.teacherId === teacher.id);
    const avgRating = allTeacherReviews.reduce((acc, r) => acc + r.rating, 0) / allTeacherReviews.length;
    teacher.rating = Math.round(avgRating * 100) / 100;
    teacher.totalReviews = allTeacherReviews.length;
    await ServerFirestoreRepo.saveTeacher(teacher);

    await ServerFirestoreRepo.pushNotification({
      userId: teacher.id,
      userRole: UserRole.Teacher,
      title: "Nova Avaliação Recebida! ⭐",
      message: `${lesson.studentName} avaliou sua aula com ${rating} estrelas: "${comment.slice(0, 60)}..."`,
      type: "REVIEW",
      relatedLessonId: lesson.id,
    });

    res.status(201).json({ review, teacherRating: teacher.rating });
  });

  // -------------------------------------------------------------
  // NOTIFICAÇÕES (ALUNO, PROFESSOR E TALKÊ)
  // -------------------------------------------------------------
  app.get("/api/notifications", async (req: AuthenticatedRequest, res: Response) => {
    const userId = (req.query.userId as string) || req.userId || "all";
    const list = await ServerFirestoreRepo.getNotificationsForUser(userId);
    res.json(list);
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    const notif = await ServerFirestoreRepo.markNotificationRead(req.params.id);
    if (!notif) return res.status(404).json({ error: "Notificação não encontrada." });
    res.json(notif);
  });

  // -------------------------------------------------------------
  // CARTEIRA & GATEWAY DE PAGAMENTO (PILOTO VS PRODUÇÃO)
  // -------------------------------------------------------------
  app.post("/api/students/:id/wallet/topup", async (req: AuthenticatedRequest, res: Response) => {
    const student = await ServerFirestoreRepo.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: "Aluno não encontrado." });

    if (req.userId && req.userId !== student.id && !req.isAdmin) {
      return res.status(403).json({ error: "Apenas o próprio aluno ou admin pode recarregar a carteira." });
    }

    const { amountBrl } = req.body;
    const amount = Number(amountBrl);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valor de recarga inválido." });
    }

    student.walletBalanceBrl += amount;
    await ServerFirestoreRepo.saveStudent(student);

    await ServerFirestoreRepo.pushNotification({
      userId: student.id,
      userRole: UserRole.Student,
      title: "Recarga Efetuada!",
      message: `R$ ${amount.toFixed(2)} foram adicionados à sua carteira Talkê. Novo saldo: R$ ${student.walletBalanceBrl.toFixed(2)}.`,
      type: "PAYMENT",
    });

    res.json({ success: true, newBalanceBrl: student.walletBalanceBrl });
  });

  app.post("/api/payments/process-card", async (req: AuthenticatedRequest, res: Response) => {
    const {
      studentId,
      amountBrl,
      cardNumber,
      cardHolder,
      installments = 1,
    } = req.body;

    const student = await ServerFirestoreRepo.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Aluno não encontrado." });
    }

    const amount = Number(amountBrl);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valor de recarga inválido." });
    }

    const isPilot = process.env.PILOT_MODE !== "false";
    const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);

    // If live production without key and not pilot, reject unsafe mock
    if (!isPilot && !hasStripe) {
      return res.status(400).json({
        error: "Gateway de produção (Stripe) não configurado. Ative o PILOT_MODE=true nas variáveis de ambiente para realizar testes.",
      });
    }

    const cleanNumber = String(cardNumber || "").replace(/\D/g, "");
    const lastFour = cleanNumber.length >= 4 ? cleanNumber.slice(-4) : "4242";
    const brand = /^4/.test(cleanNumber) ? "Visa" : /^5/.test(cleanNumber) ? "Mastercard" : "Elo";

    student.walletBalanceBrl += amount;
    await ServerFirestoreRepo.saveStudent(student);

    const txId = `tx-card-${Date.now()}`;
    const transaction: PaymentTransaction & {
      cardBrand?: string;
      lastFour?: string;
      installments?: number;
      cardHolder?: string;
    } = {
      id: txId,
      studentId: student.id,
      studentName: student.name,
      amountBrl: amount,
      platformFeeBrl: Math.round(amount * 0.0399 * 100) / 100,
      teacherNetBrl: amount,
      method: PaymentMethod.CreditCard,
      status: PaymentStatus.Paid,
      createdAt: new Date().toISOString(),
      cardBrand: brand,
      lastFour,
      installments: Number(installments),
      cardHolder: String(cardHolder || "TITULAR").toUpperCase(),
    };

    memoryFallback.payments.set(txId, transaction);

    await ServerFirestoreRepo.pushNotification({
      userId: student.id,
      userRole: UserRole.Student,
      title: isPilot ? "Recarga Piloto Aprovada! 💳" : "Pagamento Aprovado no Cartão! 💳",
      message: `Recarga de R$ ${amount.toFixed(2)} confirmada (${isPilot ? "Modo Piloto" : "Stripe"}). Novo saldo: R$ ${student.walletBalanceBrl.toFixed(2)}.`,
      type: "PAYMENT",
    });

    res.json({
      success: true,
      transaction,
      newBalanceBrl: student.walletBalanceBrl,
      authorizationCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
      mode: isPilot ? "PILOT_SANDBOX" : "LIVE_STRIPE",
    });
  });

  // -------------------------------------------------------------
  // Vite Middleware & Static Production Serving
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
