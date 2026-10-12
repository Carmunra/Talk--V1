import { randomUUID } from 'node:crypto';
import type { Platform, Identity } from './platform';
import { requireCondition } from './security';

export class PrivacyService {
  constructor(private readonly platform: Platform) {}
  async export(actor: Identity, subjectId: string) {
    const { store } = this.platform;
    const own = subjectId === actor.uid;
    if (!own) await this.platform.authorizedStudent(actor, subjectId);
    const profile = await store.get('profiles', subjectId);
    requireCondition(profile && !profile.deletedAt, 404, 'Cadastro não encontrado');
    const [student, teacher, lessons, orders, requests, reports, lessonNotes, payments] =
      await Promise.all([
        store.get('students', subjectId),
        store.get('teachers', subjectId),
        store.find(
          'lessons',
          profile.accountType === 'TEACHER' ? 'teacherId' : 'studentId',
          subjectId,
        ),
        store.find(
          'orders',
          profile.accountType === 'TEACHER' ? 'teacherId' : own ? 'payerId' : 'studentId',
          subjectId,
        ),
        store.find('privacy_requests', 'subjectId', subjectId),
        store.find('safety_reports', 'reporterId', subjectId),
        profile.accountType === 'STUDENT'
          ? store.find('lesson_notes', 'studentId', subjectId)
          : Promise.resolve([]),
        store.find(
          'payments',
          profile.accountType === 'TEACHER' ? 'teacherId' : 'payerId',
          subjectId,
        ),
      ]);
    // Counterparties' names and financial credentials do not belong in this export.
    const sanitizeLesson = ({
      teacherName,
      studentName,
      payerId,
      teacherId,
      studentId,
      meetingLink,
      ...row
    }: any) => row;
    const sanitizeOrder = ({ sellerId, teacherId, payerId, studentId, checkoutUrl, ...row }: any) =>
      row;
    const sanitizeNotes = ({ teacherId, studentId, ...row }: any) => row;
    const sanitizePayment = ({ sellerId, teacherId, payerId, ...row }: any) => row;
    const refunds = (
      await Promise.all(orders.map((order) => store.find('refunds', 'orderId', order.id)))
    ).flat();
    const subscriptions = await store.find(
      'subscriptions',
      own ? 'payerId' : 'studentId',
      subjectId,
    );
    const subscriptionPayments = await store.find(
      'asaas_payments',
      own ? 'payerId' : 'studentId',
      subjectId,
    );
    const subscriptionPayouts =
      profile.accountType === 'TEACHER'
        ? await store.find('subscription_payouts', 'teacherId', subjectId)
        : [];
    const sanitizeSubscription = ({ payerId, studentId, customerId, ...row }: any) => row;
    return {
      exportedAt: new Date().toISOString(),
      profile,
      student,
      teacher,
      lessons: lessons.map(sanitizeLesson),
      orders: orders.map(sanitizeOrder),
      requests,
      reports,
      lessonNotes: lessonNotes.map(sanitizeNotes),
      payments: payments.map(sanitizePayment),
      refunds: refunds.map(({ teacherId, ...row }) => row),
      subscriptions: subscriptions.map(sanitizeSubscription),
      subscriptionPayments: subscriptionPayments.map(sanitizeSubscription),
      subscriptionPayouts: subscriptionPayouts.map(
        ({ teacherId, payerId, studentId, walletId, externalReference, ...row }) => row,
      ),
      retention:
        'Registros financeiros e evidências sujeitos a obrigação legal ou defesa de direitos são segregados; consulte o controlador para prazos e base aplicável.',
    };
  }
  async request(actor: Identity, subjectId: string, kind: string, details: string) {
    requireCondition(await this.platform.profile(actor), 403, 'Cadastro obrigatório');
    if (subjectId !== actor.uid) await this.platform.authorizedStudent(actor, subjectId);
    const request = {
      id: randomUUID(),
      requesterId: actor.uid,
      subjectId,
      kind,
      details,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    await this.platform.store.transaction(async (tx) => {
      const profile = await tx.get('profiles', subjectId);
      requireCondition(profile && !profile.deletedAt, 404, 'Cadastro não encontrado');
      tx.set('privacy_requests', request);
      if (kind === 'CONSENT_WITHDRAWAL' && profile.guardianId)
        tx.set('profiles', { ...profile, status: 'CONSENT_WITHDRAWN' });
    });
    return { id: request.id, status: request.status };
  }
  async fulfillDeletion(actor: Identity, requestId: string, retentionDecision: string) {
    requireCondition(actor.admin, 403, 'Acesso restrito à administração');
    // A human must document which obligations justify the retained financial evidence.
    return this.platform.store.transaction(async (tx) => {
      const request = await tx.get('privacy_requests', requestId);
      requireCondition(
        request && request.kind === 'DELETION' && request.status === 'OPEN',
        409,
        'Solicitação não disponível',
      );
      const profile = await tx.get('profiles', request.subjectId);
      const dependents = await tx.find('profiles', 'guardianId', request.subjectId);
      const studentLessons = await tx.find('lessons', 'studentId', request.subjectId);
      const teacherLessons = await tx.find('lessons', 'teacherId', request.subjectId);
      const paidLessons = await tx.find('lessons', 'payerId', request.subjectId);
      const progress = await tx.find('student_progress', 'studentId', request.subjectId);
      const studentNotes = await tx.find('lesson_notes', 'studentId', request.subjectId);
      const teacherNotes = await tx.find('lesson_notes', 'teacherId', request.subjectId);
      const reviews = await tx.find('reviews', 'payerId', request.subjectId);
      const credentials = await tx.get('seller_credentials', request.subjectId);
      const teacherOrders = await tx.find('orders', 'teacherId', request.subjectId);
      const subscriptions = await tx.find('subscriptions', 'payerId', request.subjectId);
      const studentSubscriptions = await tx.find('subscriptions', 'studentId', request.subjectId);
      const payouts = await tx.find('subscription_payouts', 'teacherId', request.subjectId);
      const checkouts = await tx.find('asaas_checkouts', 'payerId', request.subjectId);
      if (this.platform.config.subscriptionCancelCredits === 'keep_until_expiry') {
        const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(
          this.platform.now(),
        );
        for (const subscription of [...subscriptions, ...studentSubscriptions]) {
          const cycles = await tx.find('subscription_cycles', 'subscriptionId', subscription.id);
          requireCondition(
            !cycles.some((c) => c.status === 'FUNDED' && c.remaining > 0 && c.expiresOn > today),
            409,
            'Resolva o saldo de aulas já pagas antes da exclusão',
          );
        }
      }
      requireCondition(
        ![...subscriptions, ...studentSubscriptions].some((s) => s.status !== 'CANCELLED') &&
          !payouts.some((p) => p.status !== 'DONE' || p.reviewRequired) &&
          !checkouts.some((c) => ['CREATED', 'SUBMITTING', 'UNKNOWN'].includes(c.status)),
        409,
        'Resolva assinaturas e repasses em aberto antes da exclusão',
      );
      requireCondition(
        profile && !dependents.some((p) => !p.deletedAt),
        409,
        'Resolva os vínculos de dependentes antes da exclusão',
      );
      const lessons = [
        ...new Map(
          [...studentLessons, ...teacherLessons, ...paidLessons].map((l) => [l.id, l]),
        ).values(),
      ];
      requireCondition(
        !lessons.some(
          (l) =>
            ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'].includes(l.status) ||
            (l.fundingSource === 'ASAAS_SUBSCRIPTION' &&
              l.status === 'COMPLETED' &&
              !l.payerConfirmedAt),
        ),
        409,
        'Resolva as aulas e pagamentos em aberto',
      );
      const stamp = new Date().toISOString();
      tx.set('profiles', {
        id: profile.id,
        accountType: profile.accountType,
        status: 'DELETED',
        deletedAt: stamp,
      });
      tx.remove('students', profile.id);
      tx.remove('teachers', profile.id);
      tx.remove('seller_credentials', profile.id);
      tx.remove('asaas_recipients', profile.id);
      if (
        credentials &&
        teacherOrders.some((order) =>
          ['PAID', 'REFUND_PENDING', 'DISPUTED', 'PARTIAL_REFUND_REVIEW'].includes(order.status),
        )
      ) {
        // Preserve encrypted provider credentials solely to fulfill refunds/disputes,
        // never to publish a profile or create a new sale after deletion.
        tx.set('retained_seller_credentials', {
          ...credentials,
          retentionDecision,
          retainedAt: stamp,
        });
      } else if (credentials) tx.remove('seller_accounts', credentials.sellerId);
      for (const row of progress) tx.remove('student_progress', row.id);
      for (const row of [...studentNotes, ...teacherNotes]) tx.remove('lesson_notes', row.id);
      for (const review of reviews) tx.set('reviews', { ...review, comment: '' });
      for (const lesson of lessons)
        tx.set('lessons', {
          ...lesson,
          ...(lesson.studentId === profile.id
            ? { studentName: 'Cadastro excluído', topic: '' }
            : {}),
          ...(lesson.teacherId === profile.id ? { teacherName: 'Cadastro excluído' } : {}),
          whiteboardNotes: '',
        });
      tx.set('privacy_requests', {
        ...request,
        details: '',
        status: 'FULFILLED',
        retentionDecision,
        fulfilledAt: stamp,
      });
      tx.set('audit_events', {
        id: randomUUID(),
        actorId: actor.uid,
        action: 'PRIVACY_DELETION',
        subjectId: profile.id,
        requestId,
        retentionDecision,
        createdAt: stamp,
      });
      return { uid: profile.id, hasLogin: !profile.guardianId, status: 'FULFILLED' };
    });
  }
}
