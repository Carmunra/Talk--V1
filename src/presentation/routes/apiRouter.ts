import { Router } from 'express';
import {
  LessonController,
  TeacherController,
  StudentController,
  PaymentController,
  AdminController,
  ConfigController,
} from '../controllers';

export const apiRouter = Router();

// Config & Health
apiRouter.get('/config/pilot-mode', ConfigController.pilotMode);
apiRouter.get('/health', ConfigController.health);

// Teachers
apiRouter.get('/teachers', TeacherController.list);
apiRouter.get('/teachers/recommendations', TeacherController.recommendations);
apiRouter.get('/teachers/:id', TeacherController.getById);
apiRouter.get('/teachers/:id/earnings', TeacherController.getEarnings);
apiRouter.post('/teachers', TeacherController.save);
apiRouter.put('/teachers/:id/availability', TeacherController.updateAvailability);
apiRouter.get('/teachers/:id/reviews', TeacherController.getReviews);

// Matching
apiRouter.get('/matching/:studentId', TeacherController.recommendations);
apiRouter.get('/matching', TeacherController.recommendations);

// Students
apiRouter.get('/students', StudentController.list);
apiRouter.get('/students/:id', StudentController.getById);
apiRouter.post('/students', StudentController.save);
apiRouter.put('/students/:id/diagnostic', StudentController.updateDiagnostic);
apiRouter.post('/students/:id/diagnostic', StudentController.updateDiagnostic);
apiRouter.post('/students/:id/wallet/topup', StudentController.topUpWallet);

// Lessons
apiRouter.get('/lessons', LessonController.list);
apiRouter.get('/lessons/:id', LessonController.getById);
apiRouter.post('/lessons', LessonController.book);
apiRouter.post('/lessons/book', LessonController.book);
apiRouter.post('/lessons/checkout', LessonController.checkout);
apiRouter.post('/lessons/:id/complete', LessonController.complete);
apiRouter.put('/lessons/:id/status', LessonController.updateStatus);
apiRouter.patch('/lessons/:id/status', LessonController.updateStatus);
apiRouter.get('/lessons/:id/daily-room', LessonController.getDailyRoom);
apiRouter.post('/lessons/:id/daily-room', LessonController.getDailyRoom);
apiRouter.post('/lessons/:id/review', LessonController.review);

// Payments
apiRouter.get('/payments', PaymentController.list);
apiRouter.get('/payments/student/:studentId', PaymentController.getByStudent);
apiRouter.get('/payments/gateway-info', PaymentController.getGatewayInfo);
apiRouter.post('/payments/checkout', LessonController.checkout);
apiRouter.post('/payments/intent', PaymentController.createIntent);
apiRouter.post('/payments/process-card', PaymentController.processCard);

// Notifications & Admin
apiRouter.get('/notifications', AdminController.notifications);
apiRouter.put('/notifications/:id/read', AdminController.markNotificationRead);
apiRouter.patch('/notifications/:id/read', AdminController.markNotificationRead);
apiRouter.get('/admin/metrics', AdminController.metrics);

// Legacy .NET template API compatibility route
apiRouter.get('/weatherforecast', (_req, res) => {
  const summaries = ['Freezing', 'Bracing', 'Chilly', 'Cool', 'Mild', 'Warm', 'Balmy', 'Hot', 'Sweltering', 'Scorching'];
  const forecast = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const tempC = Math.floor(Math.random() * 35) + 5;
    return {
      date: d.toISOString().split('T')[0],
      temperatureC: tempC,
      temperatureF: 32 + Math.round(tempC / 0.5556),
      summary: summaries[Math.floor(Math.random() * summaries.length)],
    };
  });
  res.json(forecast);
});
