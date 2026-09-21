import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { UserRole } from './src/domain/types';
import { ServerFirestoreRepo } from './src/server/db';
import { apiRouter } from './src/presentation/routes/apiRouter';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
  isAdmin?: boolean;
}

// Admin email list
const ADMIN_EMAILS = [
  'jonathan.oliveira.da@gmail.com',
  'admin@talke.com',
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
    const userId = req.header('x-user-id');
    const userRole = req.header('x-user-role') as UserRole;
    const userEmail = req.header('x-user-email')?.toLowerCase();
    const isAdminHeader = req.header('x-is-admin') === 'true';

    req.userId = userId;
    req.userRole = userRole;
    req.userEmail = userEmail;
    req.isAdmin =
      isAdminHeader ||
      (userEmail ? ADMIN_EMAILS.includes(userEmail) : false);

    next();
  });

  // Mount Clean Architecture Presentation API router
  app.use('/api', apiRouter);

  // Vite Middleware & Static Production Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Talkê Clean Architecture] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
