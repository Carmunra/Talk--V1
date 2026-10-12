import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit, { type Store as RateLimitStore } from 'express-rate-limit';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Platform, Identity } from './platform';
import { ApiError, requireCondition, verifyWebhook } from './security';
import { id, text } from './validation';
import { PrivacyService } from './privacy';
import { VideoService } from './video';
import { MONTHLY_PLANS } from '../domain/monthlyPlans';
import { verifyAsaasWebhook } from './asaas';
import type { MonthlySubscriptions } from './subscriptions';

export interface AppDependencies {
  rateLimitStores?: { public: RateLimitStore; private: RateLimitStore };
  subscriptions?: MonthlySubscriptions;
  platform: Platform;
  verifyToken: (token: string) => Promise<Identity>;
  revokeSessions?: (uid: string) => Promise<void>;
}
type AuthRequest = Request & { identity?: Identity };
export function createApp({
  platform,
  verifyToken,
  revokeSessions,
  subscriptions,
  rateLimitStores,
}: AppDependencies) {
  const app = express();
  const config = platform.config;
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxyHops);
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            ...(config.production ? [] : ["'unsafe-inline'"]),
            'https://apis.google.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            'https://*.googleapis.com',
            'https://*.firebaseio.com',
            'wss://*.firebaseio.com',
            'https://*.daily.co',
            'wss://*.daily.co',
            ...(config.production
              ? []
              : ['http://127.0.0.1:*', 'http://localhost:*', 'ws://localhost:*']),
          ],
          frameSrc: ['https://*.firebaseapp.com', 'https://*.daily.co'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          ...(!config.production ? { upgradeInsecureRequests: null } : {}),
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(
    '/api',
    rateLimit({
      ...(rateLimitStores ? { store: rateLimitStores.public } : {}),
      windowMs: 60_000,
      limit: 180,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' },
    }),
  );
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.header('origin');
    if (origin && origin !== config.origin)
      return res.status(403).json({ error: 'Origem não permitida' });
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  const wrap =
    (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res)).catch(next);
    };
  const actor = (req: AuthRequest) => req.identity!;
  const subject = (req: Request, key = 'id') => id.parse(req.params[key]);
  const verify = (req: AuthRequest, _res: Response, next: NextFunction) => {
    const match = /^Bearer ([^\s]+)$/.exec(req.header('authorization') || '');
    if (!match) return next(new ApiError(401, 'Entre na sua conta para continuar'));
    verifyToken(match[1])
      .then((identity) => {
        if (!identity.emailVerified) return next(new ApiError(403, 'Confirme seu e-mail'));
        req.identity = identity;
        next();
      })
      .catch(() => next(new ApiError(401, 'Sessão inválida ou expirada')));
  };
  const privateApi = express.Router();
  const privacy = new PrivacyService(platform);
  const video = new VideoService(platform.store, config);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  if (subscriptions) {
    app.post(
      '/api/subscriptions/asaas/webhook',
      wrap(async (req, res) => {
        verifyAsaasWebhook(req.header('asaas-access-token') || '', config.asaasWebhookToken);
        await subscriptions.receiveEvent(req.body);
        res.json({ received: true });
      }),
    );
  }
  app.get(
    '/api/ready',
    wrap(async (_req, res) => {
      await platform.store.get('system', 'schema');
      res.json({ status: 'ready' });
    }),
  );
  app.get('/api/config', (_req, res) =>
    res.json({
      paymentsEnabled: config.paymentsEnabled,
      minorsEnabled: config.minorsEnabled,
      minimumAge: config.minimumAge,
      legalName: config.legalName,
      legalCnpj: config.legalCnpj,
      privacyEmail: config.privacyEmail,
      supportEmail: config.supportEmail,
      supportEmails: config.supportEmails,
      termsVersion: config.termsVersion,
      legalApproved: config.legalApproved,
      monthlyPlans: MONTHLY_PLANS,
      // Recurring multi-teacher settlement needs a compatible gateway and approved rules.
      subscriptionsEnabled: Boolean(subscriptions) && config.subscriptionsEnabled,
      subscriptionsSandbox: config.asaasEnvironment !== 'live',
      subscriptionCancelCredits: config.subscriptionCancelCredits,
    }),
  );
  app.get(
    '/api/teachers',
    wrap(async (_req, res) => res.json(await platform.publicTeachers())),
  );
  app.post(
    '/api/payments/webhook',
    wrap(async (req, res) => {
      const dataId = String(req.query['data.id'] || '');
      verifyWebhook(
        req.header('x-signature') || '',
        req.header('x-request-id') || '',
        dataId,
        config.mpWebhookSecret,
      );
      const body = z
        .object({
          type: z.literal('payment'),
          user_id: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]),
          data: z.object({ id: z.union([z.string(), z.number()]) }),
        })
        .passthrough()
        .parse(req.body);
      requireCondition(
        String(body.data.id).toLowerCase() === dataId.toLowerCase(),
        400,
        'Notificação inconsistente',
      );
      await platform.reconcilePayment(dataId, String(body.user_id));
      res.status(200).json({ received: true });
    }),
  );
  app.get(
    '/api/payments/oauth/callback',
    wrap(async (req, res) => {
      await platform.gateway.callback(
        z.string().parse(req.query.state),
        z.string().parse(req.query.code),
      );
      res.redirect(303, `${config.origin}/?seller=connected`);
    }),
  );
  privateApi.use(verify);
  privateApi.use(
    rateLimit({
      ...(rateLimitStores ? { store: rateLimitStores.private } : {}),
      windowMs: 60_000,
      limit: 90,
      keyGenerator: (req: AuthRequest) => actor(req).uid,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' },
    }),
  );
  privateApi.get(
    '/me',
    wrap(async (req, res) => res.json(await platform.me(actor(req)))),
  );
  if (subscriptions) {
    privateApi.get(
      '/subscriptions/checkouts',
      wrap(async (req, res) => res.json(await subscriptions.checkouts(actor(req)))),
    );
    privateApi.get(
      '/admin/subscriptions/status',
      wrap(async (req, res) => {
        await platform.ready(actor(req));
        requireCondition(actor(req).admin, 403, 'Acesso restrito à administração');
        const teachers = await platform.store.find('profiles', 'accountType', 'TEACHER');
        const recipients = await Promise.all(
          teachers.slice(0, 100).map(async (teacher) => {
            const recipient = await platform.store.get('asaas_recipients', teacher.id);
            return {
              id: teacher.id,
              name: teacher.name,
              status: teacher.status,
              recipientVerified:
                recipient?.verified === true && recipient.accountId === config.asaasAccountId,
            };
          }),
        );
        const statuses = ['QUEUED', 'PENDING', 'UNKNOWN', 'SUBMITTING', 'REVIEW'];
        const payouts = (
          await Promise.all(
            statuses.map((status) => platform.store.find('subscription_payouts', 'status', status)),
          )
        )
          .flat()
          .slice(0, 100)
          .map((p) => ({
            id: p.id,
            lessonId: p.lessonId,
            teacherId: p.teacherId,
            amountCents: p.amountCents,
            status: p.status,
            reviewRequired: Boolean(p.reviewRequired),
          }));
        const checkouts = (
          await Promise.all(
            ['UNKNOWN', 'SUBMITTING'].map((status) =>
              platform.store.find('asaas_checkouts', 'status', status),
            ),
          )
        )
          .flat()
          .slice(0, 100)
          .map((c) => ({ id: c.id, studentId: c.studentId, planId: c.planId, status: c.status }));
        res.json({ recipients, payouts, checkouts });
      }),
    );
    privateApi.get(
      '/subscriptions',
      wrap(async (req, res) => res.json(await subscriptions.summary(actor(req)))),
    );
    privateApi.post(
      '/subscriptions/checkout',
      wrap(async (req, res) => {
        const input = z.object({ planId: id, studentId: id }).strict().parse(req.body);
        res.json(
          await subscriptions.checkout(actor(req), input, req.header('Idempotency-Key') || ''),
        );
      }),
    );
    privateApi.post(
      '/subscriptions/:id/bookings',
      wrap(async (req, res) => {
        res.status(201).json(
          await platform.booking(actor(req), req.body, req.header('Idempotency-Key') || '', {
            subscriptions,
            subscriptionId: subject(req),
          }),
        );
      }),
    );
    privateApi.post(
      '/subscriptions/:id/cancel',
      wrap(async (req, res) => res.json(await subscriptions.cancel(actor(req), subject(req)))),
    );
    privateApi.post(
      '/lessons/:id/confirm-completion',
      wrap(async (req, res) =>
        res.json(await subscriptions.confirmCompletion(actor(req), subject(req))),
      ),
    );
    privateApi.post(
      '/admin/subscriptions/bind',
      wrap(async (req, res) => {
        const input = z
          .object({
            subscriptionId: id,
            planId: id,
            payerId: id,
            studentId: id,
            firstDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          })
          .strict()
          .parse(req.body);
        res.json(await subscriptions.bind(actor(req), input));
      }),
    );
    privateApi.post(
      '/admin/subscriptions/reconcile',
      wrap(async (req, res) => {
        await platform.ready(actor(req));
        requireCondition(actor(req).admin, 403, 'Acesso restrito à administração');
        res.json(await subscriptions.drainEvents());
      }),
    );
    privateApi.post(
      '/admin/subscriptions/recipients/:id',
      wrap(async (req, res) => {
        await platform.ready(actor(req));
        requireCondition(actor(req).admin, 403, 'Acesso restrito à administração');
        const input = z
          .object({
            walletId: z.string().uuid(),
            verified: z.boolean(),
            evidence: z.string().trim().min(10).max(1000),
          })
          .strict()
          .parse(req.body);
        await platform.store.transaction(async (tx) => {
          const profile = await tx.get('profiles', subject(req));
          requireCondition(
            profile?.accountType === 'TEACHER' && profile.status === 'ACTIVE',
            409,
            'Professor indisponível',
          );
          tx.set('asaas_recipients', {
            id: subject(req),
            walletId: input.walletId,
            verified: input.verified,
            accountId: config.asaasAccountId,
            verifiedBy: actor(req).uid,
          });
          tx.set('audit_events', {
            id: randomUUID(),
            actorId: actor(req).uid,
            action: 'VERIFY_SUBSCRIPTION_RECIPIENT',
            subjectId: subject(req),
            evidence: input.evidence,
            createdAt: new Date(platform.now()).toISOString(),
          });
        });
        res.json({ updated: true, sandbox: true });
      }),
    );
  }
  privateApi.post(
    '/profiles',
    wrap(async (req, res) => res.status(201).json(await platform.register(actor(req), req.body))),
  );
  privateApi.post(
    '/family/dependents',
    wrap(async (req, res) => {
      const input = z
        .object({
          name: text,
          birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          guardianDeclaration: z.literal(true),
          termsVersion: text,
        })
        .strict()
        .parse(req.body);
      res.status(201).json(await platform.dependent(actor(req), input));
    }),
  );
  privateApi.put(
    '/teachers/me',
    wrap(async (req, res) => res.json(await platform.updateTeacher(actor(req), req.body))),
  );
  privateApi.post(
    '/payments/connect',
    wrap(async (req, res) => {
      const profile = await platform.ready(actor(req));
      requireCondition(profile.accountType === 'TEACHER', 403, 'Cadastro de professor obrigatório');
      res.json({ url: await platform.gateway.connect(actor(req).uid) });
    }),
  );
  privateApi.post(
    '/students/:id/diagnostic',
    wrap(async (req, res) =>
      res.json(await platform.diagnostic(actor(req), subject(req), req.body)),
    ),
  );
  privateApi.get(
    '/students/:id',
    wrap(async (req, res) => {
      await platform.ready(actor(req));
      await platform.authorizedStudent(actor(req), subject(req));
      res.json(await platform.store.get('students', subject(req)));
    }),
  );
  privateApi.get(
    '/progress',
    wrap(async (req, res) => {
      const profile = await platform.ready(actor(req));
      const studentId = req.query.studentId ? id.parse(req.query.studentId) : actor(req).uid;
      if (profile.accountType === 'TEACHER') {
        res.json(await platform.store.find('lesson_notes', 'teacherId', actor(req).uid));
      } else {
        await platform.authorizedStudent(actor(req), studentId);
        res.json(await platform.store.find('lesson_notes', 'studentId', studentId));
      }
    }),
  );
  privateApi.post(
    '/lessons/:id/notes',
    wrap(async (req, res) => {
      await platform.ready(actor(req));
      const input = z
        .object({
          notes: z.string().trim().min(1).max(2000),
          homework: z.string().trim().max(1000),
        })
        .strict()
        .parse(req.body);
      await platform.store.transaction(async (tx) => {
        const lesson = await tx.get('lessons', subject(req));
        requireCondition(
          lesson && lesson.teacherId === actor(req).uid && lesson.status === 'COMPLETED',
          403,
          'Registros permitidos apenas ao professor da aula concluída',
        );
        tx.set('lesson_notes', {
          id: lesson.id,
          lessonId: lesson.id,
          teacherId: lesson.teacherId,
          studentId: lesson.studentId,
          ...input,
          updatedAt: new Date().toISOString(),
        });
      });
      res.json({ saved: true });
    }),
  );
  privateApi.get(
    '/lessons',
    wrap(async (req, res) => res.json(await platform.lessons(actor(req)))),
  );
  privateApi.post(
    '/lessons',
    wrap(async (req, res) =>
      res
        .status(201)
        .json(await platform.booking(actor(req), req.body, req.header('idempotency-key') || '')),
    ),
  );
  privateApi.post(
    '/lessons/:id/checkout',
    wrap(async (req, res) => res.json(await platform.checkout(actor(req), subject(req)))),
  );
  privateApi.post(
    '/lessons/:id/cancel',
    wrap(async (req, res) => {
      let result;
      try {
        result = await platform.cancel(actor(req), subject(req));
      } finally {
        const lesson = await platform.store.get('lessons', subject(req));
        if (
          lesson?.status === 'CANCELLED' &&
          [lesson.payerId, lesson.teacherId].includes(actor(req).uid)
        )
          await video.close(lesson.id);
      }
      res.json(result);
    }),
  );
  privateApi.post(
    '/lessons/:id/complete',
    wrap(async (req, res) => res.json(await platform.complete(actor(req), subject(req)))),
  );
  privateApi.post(
    '/lessons/:id/review',
    wrap(async (req, res) => {
      const input = z
        .object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(1000) })
        .strict()
        .parse(req.body);
      res
        .status(201)
        .json(await platform.review(actor(req), subject(req), input.rating, input.comment));
    }),
  );
  privateApi.post(
    '/lessons/:id/room',
    wrap(async (req, res) => {
      await platform.ready(actor(req));
      const lesson = await platform.store.get('lessons', subject(req));
      requireCondition(
        lesson && [lesson.payerId, lesson.teacherId].includes(actor(req).uid),
        403,
        'Acesso à sala não permitido',
      );
      requireCondition(
        lesson.isPaid && ['CONFIRMED', 'IN_PROGRESS'].includes(lesson.status),
        409,
        'Aula não confirmada',
      );
      const studentProfile = await platform.store.get('profiles', lesson.studentId);
      requireCondition(
        studentProfile?.status === 'ACTIVE',
        403,
        'Cadastro ou autorização do aluno suspensa',
      );
      const now = platform.now(),
        start = lesson.scheduledAt - 10 * 60_000,
        end = lesson.scheduledAt + (lesson.durationMinutes + 15) * 60_000;
      requireCondition(
        now >= start && now <= end,
        409,
        'A sala abre 10 minutos antes e fecha 15 minutos após a aula',
      );
      const result = await video.room(lesson, actor(req).uid, start, end);
      const current = await platform.store.get('lessons', lesson.id);
      const currentStudent = await platform.store.get('profiles', lesson.studentId);
      const currentActor = await platform.profile(actor(req));
      if (
        !current?.isPaid ||
        !['CONFIRMED', 'IN_PROGRESS'].includes(current.status) ||
        currentStudent?.status !== 'ACTIVE' ||
        currentActor?.status !== 'ACTIVE'
      ) {
        await video.close(lesson.id);
        throw new ApiError(403, 'A autorização da aula foi alterada');
      }
      res.json(result);
    }),
  );
  privateApi.get(
    '/payments',
    wrap(async (req, res) => {
      await platform.ready(actor(req));
      const profile = await platform.profile(actor(req));
      const rows = await platform.store.find(
        'orders',
        profile?.accountType === 'TEACHER' ? 'teacherId' : 'payerId',
        actor(req).uid,
      );
      res.json(rows.map(({ sellerId, checkoutUrl, checkoutingAt, ...row }) => row));
    }),
  );
  privateApi.get(
    '/privacy/export/:id',
    wrap(async (req, res) => {
      res.set('Content-Disposition', 'attachment; filename="dados-talke.json"');
      res.json(await privacy.export(actor(req), subject(req)));
    }),
  );
  privateApi.post(
    '/privacy/requests',
    wrap(async (req, res) => {
      const input = z
        .object({
          subjectId: id,
          kind: z.enum(['ACCESS', 'CORRECTION', 'DELETION', 'CONSENT_WITHDRAWAL', 'OBJECTION']),
          details: z.string().trim().max(2000),
        })
        .strict()
        .parse(req.body);
      const result = await privacy.request(actor(req), input.subjectId, input.kind, input.details);
      if (input.kind === 'CONSENT_WITHDRAWAL') await video.closeSubject(input.subjectId);
      res.status(201).json(result);
    }),
  );
  privateApi.post(
    '/safety/reports',
    wrap(async (req, res) => {
      await platform.ready(actor(req));
      const input = z
        .object({ lessonId: id, details: z.string().trim().min(10).max(2000) })
        .strict()
        .parse(req.body);
      const lesson = await platform.store.get('lessons', input.lessonId);
      requireCondition(
        lesson && [lesson.payerId, lesson.teacherId].includes(actor(req).uid),
        403,
        'Denúncia não permitida',
      );
      const report = {
        id: randomUUID(),
        reporterId: actor(req).uid,
        lessonId: lesson.id,
        details: input.details,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      };
      await platform.store.transaction(async (tx) => tx.set('safety_reports', report));
      res.status(201).json({ id: report.id, status: report.status });
    }),
  );
  privateApi.get(
    '/admin/queue',
    wrap(async (req, res) => {
      requireCondition(actor(req).admin, 403, 'Acesso restrito à administração');
      const [
        teachers,
        guardians,
        privacyRequests,
        reports,
        refunds,
        ageReviews,
        roomClosures,
        maintenance,
      ] = await Promise.all([
        platform.store.find('teachers', 'isVerified', false),
        platform.store.find('profiles', 'status', 'PENDING_GUARDIAN_REVIEW'),
        platform.store.find('privacy_requests', 'status', 'OPEN'),
        platform.store.find('safety_reports', 'status', 'OPEN'),
        platform.store.find('refunds', 'status', 'REQUIRES_SUPPORT'),
        platform.store.find('profiles', 'status', 'PENDING_AGE_REVIEW'),
        platform.store.find('room_closures', 'status', 'PENDING'),
        platform.store.get('system', 'maintenance'),
      ]);
      res.json({
        teachers,
        guardians,
        privacyRequests,
        reports,
        refunds,
        ageReviews,
        roomClosures,
        maintenance,
      });
    }),
  );
  privateApi.post(
    '/admin/approve',
    wrap(async (req, res) => {
      const input = z
        .object({
          kind: z.enum(['teacher', 'guardian', 'age']),
          subjectId: id,
          evidenceReference: z.string().trim().min(10).max(200),
        })
        .strict()
        .parse(req.body);
      await platform.approve(actor(req), input.kind, input.subjectId, input.evidenceReference);
      res.json({ approved: true });
    }),
  );
  privateApi.post(
    '/admin/privacy/:id/delete',
    wrap(async (req, res) => {
      const { retentionDecision } = z
        .object({ retentionDecision: z.string().trim().min(20).max(2000) })
        .strict()
        .parse(req.body);
      const result = await privacy.fulfillDeletion(actor(req), subject(req), retentionDecision);
      if (revokeSessions && result.hasLogin) await revokeSessions(result.uid);
      res.json(result);
    }),
  );
  privateApi.post(
    '/admin/resolve',
    wrap(async (req, res) => {
      requireCondition(actor(req).admin, 403, 'Acesso restrito à administração');
      const input = z
        .object({
          kind: z.enum(['privacy', 'safety']),
          requestId: id,
          resolution: z.string().trim().min(20).max(2000),
        })
        .strict()
        .parse(req.body);
      const collection = input.kind === 'privacy' ? 'privacy_requests' : 'safety_reports';
      await platform.store.transaction(async (tx) => {
        const row = await tx.get(collection, input.requestId);
        requireCondition(
          row && row.status === 'OPEN' && row.kind !== 'DELETION',
          409,
          'Solicitação não disponível para este procedimento',
        );
        tx.set(collection, {
          ...row,
          status: 'RESOLVED',
          resolution: input.resolution,
          resolvedBy: actor(req).uid,
          resolvedAt: new Date().toISOString(),
        });
        tx.set('audit_events', {
          id: randomUUID(),
          actorId: actor(req).uid,
          action: 'RESOLVE_REQUEST',
          subjectId: input.requestId,
          createdAt: new Date().toISOString(),
        });
      });
      res.json({ resolved: true });
    }),
  );
  privateApi.post(
    '/admin/suspend',
    wrap(async (req, res) => {
      requireCondition(actor(req).admin, 403, 'Acesso restrito à administração');
      const input = z
        .object({ subjectId: id, reason: z.string().trim().min(10).max(1000) })
        .strict()
        .parse(req.body);
      requireCondition(input.subjectId !== actor(req).uid, 400, 'Não suspenda sua própria conta');
      await platform.store.transaction(async (tx) => {
        const profile = await tx.get('profiles', input.subjectId),
          teacher = await tx.get('teachers', input.subjectId);
        requireCondition(profile, 404, 'Cadastro não encontrado');
        tx.set('profiles', { ...profile, status: 'SUSPENDED' });
        if (teacher) tx.set('teachers', { ...teacher, isVerified: false });
        tx.set('audit_events', {
          id: randomUUID(),
          actorId: actor(req).uid,
          action: 'SUSPEND_ACCOUNT',
          subjectId: input.subjectId,
          reason: input.reason,
          createdAt: new Date().toISOString(),
        });
      });
      if (revokeSessions) await revokeSessions(input.subjectId);
      await video.closeSubject(input.subjectId);
      res.json({ suspended: true });
    }),
  );
  app.use('/api', privateApi);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Operação não disponível' }));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: 'Confira os campos enviados' });
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    if ((error as any)?.type === 'entity.too.large')
      return res.status(413).json({ error: 'Solicitação muito grande' });
    if (error instanceof SyntaxError)
      return res.status(400).json({ error: 'Solicitação inválida' });
    const errorId = randomUUID();
    console.error(JSON.stringify({ event: 'request_failed', errorId }));
    res.status(503).json({ error: 'Serviço temporariamente indisponível', errorId });
  });
  return app;
}
