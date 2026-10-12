import { createHash } from 'node:crypto';
import { MONTHLY_PLANS } from '../domain/monthlyPlans';
import type { Platform, Identity } from './platform';
import type { Row, UnitOfWork } from './store';
import { cents, type SubscriptionGateway, type AsaasTransfer } from './asaas';
import { ApiError, requireCondition } from './security';
import { z } from 'zod';

export const MONTHLY_TEACHER_PAYOUT_CENTS = 4000;
export function addCalendarMonths(date: string, count: number, anchorDay?: number) {
  requireCondition(/^\d{4}-\d{2}-\d{2}$/.test(date), 400, 'Data de ciclo inválida');
  const start = new Date(`${date}T12:00:00Z`);
  requireCondition(
    Number.isFinite(start.getTime()) && start.toISOString().slice(0, 10) === date,
    400,
    'Data de ciclo inválida',
  );
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + count + 1, 0, 12));
  const anchor = anchorDay ?? start.getUTCDate();
  requireCondition(
    Number.isInteger(anchor) &&
      anchor >= 1 &&
      anchor <= 31 &&
      Number.isInteger(count) &&
      count >= 0,
    400,
    'Âncora de ciclo inválida',
  );
  end.setUTCDate(Math.min(anchor, end.getUTCDate()));
  return end.toISOString().slice(0, 10);
}
function localDate(now: number) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
const key = (id: string) => createHash('sha256').update(id).digest('hex');
const adverse = (status: string) => /REFUND|CHARGEBACK|DELETED/.test(status);

// Sandbox bindings are explicit, audited and checked against provider customer data.
// CHECKOUT_PAID alone never grants lessons; every charge is fetched from Asaas.
export class MonthlySubscriptions {
  constructor(
    readonly platform: Platform,
    readonly gateway: SubscriptionGateway,
  ) {}
  private get store() {
    return this.platform.store;
  }
  private now() {
    return this.platform.now();
  }
  private stamp() {
    return new Date(this.now()).toISOString();
  }
  private enabled() {
    requireCondition(
      this.platform.config.asaasSandboxEnabled && !this.platform.config.production,
      503,
      'Assinaturas disponíveis apenas para homologação',
    );
  }
  async bind(
    actor: Identity,
    input: {
      subscriptionId: string;
      planId: string;
      payerId: string;
      studentId: string;
      firstDueDate: string;
    },
  ) {
    this.enabled();
    await this.platform.ready(actor);
    requireCondition(actor.admin, 403, 'Acesso restrito à administração');
    return this.attach(input, actor.uid);
  }
  private async attach(
    input: {
      subscriptionId: string;
      planId: string;
      payerId: string;
      studentId: string;
      firstDueDate: string;
    },
    actorId: string,
  ) {
    addCalendarMonths(input.firstDueDate, 0);
    const plan = MONTHLY_PLANS.find((p) => p.id === input.planId);
    requireCondition(plan, 400, 'Plano inválido');
    const subscription = await this.gateway.subscription(input.subscriptionId);
    const customer = await this.gateway.customer(subscription.customer);
    requireCondition(
      subscription.status === 'ACTIVE' &&
        !subscription.deleted &&
        subscription.cycle === 'MONTHLY' &&
        subscription.billingType === 'CREDIT_CARD' &&
        cents(subscription.value) === plan.amountCents,
      409,
      'Assinatura incompatível com o plano',
    );
    return this.store.transaction(async (tx) => {
      const payer = await tx.get('profiles', input.payerId);
      requireCondition(
        payer &&
          payer.status === 'ACTIVE' &&
          payer.ageGroup === 'ADULT' &&
          ['STUDENT', 'GUARDIAN'].includes(payer.accountType) &&
          payer.termsVersion === this.platform.config.termsVersion &&
          String(payer.email).toLowerCase() === customer.email.toLowerCase(),
        409,
        'Pagador não verificado',
      );
      const subject = await this.platform.authorizedStudent(
        { uid: input.payerId } as Identity,
        input.studentId,
        tx,
      );
      requireCondition(
        subject.accountType === 'STUDENT' &&
          subject.status === 'ACTIVE' &&
          subject.termsVersion === this.platform.config.termsVersion,
        409,
        'Cadastro do aluno pendente',
      );
      const prior = await tx.get('subscriptions', subscription.id);
      const customerBinding = await tx.get('asaas_customers', customer.id);
      const sameStudent = await tx.find('subscriptions', 'studentId', input.studentId);
      requireCondition(
        !sameStudent.some((s) => s.id !== subscription.id && s.status !== 'CANCELLED'),
        409,
        'Aluno já possui assinatura vinculada',
      );
      requireCondition(
        !prior ||
          (prior.payerId === input.payerId &&
            prior.studentId === input.studentId &&
            prior.planId === input.planId &&
            prior.customerId === customer.id),
        409,
        'Assinatura já vinculada',
      );
      requireCondition(
        !prior || prior.firstDueDate === input.firstDueDate,
        409,
        'Âncora de ciclo divergente',
      );
      requireCondition(
        !customerBinding || customerBinding.payerId === input.payerId,
        409,
        'Cliente já vinculado',
      );
      if (prior) return prior;
      const row: Row = {
        id: subscription.id,
        ...input,
        customerId: customer.id,
        amountCents: plan.amountCents,
        lessonsPerMonth: plan.lessonsPerMonth,
        teacherPayoutCents: MONTHLY_TEACHER_PAYOUT_CENTS,
        status: 'ACTIVE',
        createdAt: this.stamp(),
      };
      tx.set('subscriptions', row);
      tx.set('asaas_customers', { id: customer.id, payerId: input.payerId });
      tx.set('audit_events', {
        id: `asaas-bind-${key(subscription.id)}`,
        actorId,
        action: 'BIND_SANDBOX_SUBSCRIPTION',
        subjectId: input.studentId,
        createdAt: this.stamp(),
      });
      return row;
    });
  }
  async checkout(
    actor: Identity,
    input: { planId: string; studentId: string },
    requestKey: string,
  ) {
    this.enabled();
    await this.platform.ready(actor);
    requireCondition(/^[a-zA-Z0-9_-]{16,128}$/.test(requestKey), 400, 'Identificador obrigatório');
    const plan = MONTHLY_PLANS.find((p) => p.id === input.planId);
    requireCondition(plan, 400, 'Plano inválido');
    const reference = key(`${actor.uid}_${requestKey}`);
    const request = await this.store.transaction(async (tx) => {
      const payer = await tx.get('profiles', actor.uid);
      requireCondition(
        payer?.ageGroup === 'ADULT' && ['STUDENT', 'GUARDIAN'].includes(payer.accountType),
        403,
        'Somente aluno adulto ou responsável pode contratar',
      );
      const subject = await this.platform.authorizedStudent(actor, input.studentId, tx);
      requireCondition(
        subject.accountType === 'STUDENT' &&
          subject.status === 'ACTIVE' &&
          subject.termsVersion === this.platform.config.termsVersion,
        403,
        'Cadastro do aluno pendente',
      );
      const prior = await tx.get('asaas_checkouts', reference);
      const bindings = await tx.find('subscriptions', 'studentId', input.studentId);
      const pending = await tx.find('asaas_checkouts', 'studentId', input.studentId);
      requireCondition(
        !bindings.some((b) => b.status !== 'CANCELLED') &&
          !pending.some((c) => c.id !== reference && c.status !== 'CANCELLED'),
        409,
        'Assinatura ou checkout já existente',
      );
      if (prior) {
        requireCondition(
          prior.payerId === actor.uid &&
            prior.studentId === input.studentId &&
            prior.planId === input.planId,
          409,
          'Identificador já usado',
        );
        requireCondition(
          prior.status === 'CREATED',
          409,
          'Checkout requer conciliação antes de repetir',
        );
        return prior;
      }
      const row: Row = {
        id: reference,
        payerId: actor.uid,
        ...input,
        firstDueDate: localDate(this.now()),
        status: 'SUBMITTING',
        createdAt: this.stamp(),
      };
      tx.set('asaas_checkouts', row);
      return row;
    });
    if (request.checkoutId) return { id: request.checkoutId, url: request.url, sandbox: true };
    try {
      const result = await this.gateway.checkout(
        plan.id,
        reference,
        this.platform.config.origin,
        request.firstDueDate,
      );
      await this.store.transaction(async (tx) => {
        const fresh = await tx.get('asaas_checkouts', reference);
        requireCondition(fresh?.status === 'SUBMITTING', 409, 'Checkout requer conciliação');
        tx.set('asaas_checkouts', {
          ...fresh,
          status: 'CREATED',
          checkoutId: result.id,
          url: result.url,
        });
      });
      return { ...result, sandbox: true };
    } catch {
      await this.store.transaction(async (tx) => {
        const fresh = await tx.get('asaas_checkouts', reference);
        if (fresh?.status === 'SUBMITTING')
          tx.set('asaas_checkouts', { ...fresh, status: 'UNKNOWN' });
      });
      throw new ApiError(502, 'Checkout requer conciliação antes de repetir');
    }
  }
  async reconcileCheckouts() {
    this.enabled();
    const rows = await this.store.find('asaas_checkouts', 'status', 'CREATED');
    let failures = 0;
    for (const row of rows.slice(0, 100)) {
      try {
        const payments = await this.gateway.checkoutPayments(row.checkoutId, row.firstDueDate);
        if (!payments.length) continue;
        requireCondition(
          new Set(payments.map((p) => p.subscription)).size === 1,
          409,
          'Checkout com assinaturas divergentes',
        );
        const subscription = await this.attach(
          {
            subscriptionId: payments[0].subscription,
            payerId: row.payerId,
            studentId: row.studentId,
            planId: row.planId,
            firstDueDate: row.firstDueDate,
          },
          row.payerId,
        );
        for (const payment of payments) await this.reconcilePayment(payment.id);
        await this.store.transaction(async (tx) => {
          const fresh = await tx.get('asaas_checkouts', row.id);
          if (fresh?.status === 'CREATED')
            tx.set('asaas_checkouts', {
              ...fresh,
              status: 'BOUND',
              subscriptionId: subscription.id,
            });
        });
      } catch {
        failures++;
      }
    }
    return { checked: Math.min(rows.length, 100), failures };
  }
  async summary(actor: Identity) {
    await this.platform.ready(actor);
    const rows = await this.store.find('subscriptions', 'payerId', actor.uid);
    return Promise.all(
      rows.map(async (row) => {
        const batches = await this.store.find('subscription_cycles', 'subscriptionId', row.id);
        const today = localDate(this.now());
        return {
          id: row.id,
          studentId: row.studentId,
          planId: row.planId,
          status: row.status,
          cycles: batches.map((b) => ({
            id: b.id,
            startsOn: b.startsOn,
            expiresOn: b.expiresOn,
            remaining:
              b.status === 'FUNDED' && b.startsOn <= today && today < b.expiresOn ? b.remaining : 0,
            status: b.status,
          })),
        };
      }),
    );
  }
  async syncSubscriptions() {
    this.enabled();
    let failures = 0;
    for (const status of ['ACTIVE', 'REVIEW', 'CANCELLED']) {
      const rows = await this.store.find('subscriptions', 'status', status);
      for (const row of rows.slice(0, 100)) {
        try {
          const remote = await this.gateway.subscription(row.id);
          requireCondition(
            remote.customer === row.customerId &&
              remote.cycle === 'MONTHLY' &&
              remote.billingType === 'CREDIT_CARD' &&
              cents(remote.value) === row.amountCents,
            409,
            'Assinatura alterada requer análise',
          );
          if (remote.deleted || remote.status !== 'ACTIVE')
            await this.store.transaction(async (tx) => {
              const fresh = await tx.get('subscriptions', row.id);
              if (fresh?.status === 'ACTIVE')
                tx.set('subscriptions', { ...fresh, status: 'CANCELLED' });
            });
          const payments = await this.gateway.subscriptionPayments(row.id);
          for (const payment of payments) await this.reconcilePayment(payment.id);
        } catch {
          failures++;
        }
      }
    }
    return { failures };
  }
  async reconcilePayment(paymentId: string) {
    this.enabled();
    const payment = await this.gateway.payment(paymentId);
    const binding = await this.store.get('subscriptions', payment.subscription);
    requireCondition(
      binding &&
        binding.customerId === payment.customer &&
        cents(payment.value) === binding.amountCents &&
        cents(payment.netValue) <= binding.amountCents,
      409,
      'Cobrança não corresponde à assinatura',
    );
    const subscription = await this.gateway.subscription(binding.id);
    requireCondition(
      subscription.customer === binding.customerId &&
        subscription.cycle === 'MONTHLY' &&
        subscription.billingType === 'CREDIT_CARD' &&
        cents(subscription.value) === binding.amountCents,
      409,
      'Assinatura alterada requer análise',
    );
    const anchor = Number(binding.firstDueDate.slice(8));
    requireCondition(
      payment.dueDate >= binding.firstDueDate &&
        addCalendarMonths(payment.dueDate, 0, anchor) === payment.dueDate,
      409,
      'Vencimento não corresponde ao ciclo mensal',
    );
    const expiresOn = addCalendarMonths(payment.dueDate, 2, anchor);
    const cycleId = `${binding.id}_${payment.dueDate}`;
    await this.store.transaction(async (tx) => {
      const row = await tx.get('subscriptions', binding.id);
      const prior = await tx.get('asaas_payments', payment.id);
      const cycle = await tx.get('subscription_cycles', cycleId);
      requireCondition(
        row && row.customerId === payment.customer && row.amountCents === cents(payment.value),
        409,
        'Vínculo alterado durante a conciliação',
      );
      // A second payment for the same due date never creates a second batch.
      requireCondition(
        !cycle || cycle.paymentId === payment.id,
        409,
        'Cobrança duplicada para o mesmo ciclo',
      );
      const reversed = adverse(payment.status) || payment.deleted || prior?.adverse === true;
      tx.set('asaas_payments', {
        id: payment.id,
        subscriptionId: binding.id,
        payerId: binding.payerId,
        studentId: binding.studentId,
        amountCents: cents(payment.value),
        netCents: cents(payment.netValue),
        status: payment.status,
        adverse: Boolean(reversed),
        dueDate: payment.dueDate,
        checkedAt: this.stamp(),
      });
      if (reversed) {
        if (cycle) tx.set('subscription_cycles', { ...cycle, status: 'REVIEW', remaining: 0 });
        tx.set('subscriptions', {
          ...row,
          status: row.status === 'CANCELLED' ? 'CANCELLED' : 'REVIEW',
        });
        const reservations = await tx.find('subscription_reservations', 'cycleId', cycleId);
        for (const reservation of reservations) {
          const lesson = await tx.get('lessons', reservation.id);
          const payout = await tx.get('subscription_payouts', key(reservation.id));
          if (payout)
            tx.set('subscription_payouts', {
              ...payout,
              reviewRequired: true,
              status: ['DONE', 'PENDING', 'SUBMITTING', 'UNKNOWN'].includes(payout.status)
                ? payout.status
                : 'REVIEW',
            });
          if (lesson && ['CONFIRMED', 'REQUESTED', 'IN_PROGRESS'].includes(lesson.status)) {
            const days = await Promise.all(
              [lesson.teacherId, lesson.studentId].map((uid) =>
                tx.get('booking_days', `${uid}_${lesson.scheduledDate}`),
              ),
            );
            tx.set('lessons', { ...lesson, status: 'CANCELLED', isPaid: false });
            for (const day of days)
              if (day)
                tx.set('booking_days', {
                  ...day,
                  slots: day.slots.filter((s: any) => s.lessonId !== lesson.id),
                });
            tx.set('room_closures', { id: lesson.id, lessonId: lesson.id, status: 'PENDING' });
          }
        }
        return;
      }
      if (['CONFIRMED', 'RECEIVED'].includes(payment.status) && !cycle && row.status === 'ACTIVE') {
        tx.set('subscription_cycles', {
          id: cycleId,
          subscriptionId: binding.id,
          paymentId: payment.id,
          startsOn: payment.dueDate,
          expiresOn,
          remaining: binding.lessonsPerMonth,
          total: binding.lessonsPerMonth,
          status: 'FUNDED',
          createdAt: this.stamp(),
        });
      }
    });
    // Funds can settle after the lesson ends; repeat settlement events retry only unsent payouts.
    const payouts = await this.store.find('subscription_payouts', 'paymentId', payment.id);
    for (const payout of payouts) await this.processPayout(payout.id);
  }
  async reserve(tx: UnitOfWork, actor: Identity, subscriptionId: string, lesson: Row) {
    this.enabled();
    const subscription = await tx.get('subscriptions', subscriptionId);
    const batches = await tx.find('subscription_cycles', 'subscriptionId', subscriptionId);
    const recipient = await tx.get('asaas_recipients', lesson.teacherId);
    requireCondition(
      subscription &&
        subscription.status === 'ACTIVE' &&
        subscription.payerId === actor.uid &&
        subscription.studentId === lesson.studentId,
      403,
      'Assinatura não permitida',
    );
    requireCondition(
      recipient?.verified === true && recipient.accountId === this.platform.config.asaasAccountId,
      409,
      'Repasse do professor não homologado',
    );
    const today = localDate(this.now());
    const batch = batches
      .filter(
        (b) =>
          b.status === 'FUNDED' &&
          b.remaining > 0 &&
          b.startsOn <= today &&
          today < b.expiresOn &&
          b.startsOn <= lesson.scheduledDate &&
          lesson.scheduledDate < b.expiresOn,
      )
      .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))[0];
    requireCondition(batch, 409, 'Sem aulas válidas para esta data');
    const prior = await tx.get('subscription_reservations', lesson.id);
    requireCondition(!prior, 409, 'Crédito já reservado');
    tx.set('subscription_cycles', { ...batch, remaining: batch.remaining - 1 });
    tx.set('subscription_reservations', {
      id: lesson.id,
      cycleId: batch.id,
      subscriptionId,
      paymentId: batch.paymentId,
      teacherId: lesson.teacherId,
      payerId: actor.uid,
      studentId: lesson.studentId,
      walletId: recipient.walletId,
      payoutCents: MONTHLY_TEACHER_PAYOUT_CENTS,
      status: 'RESERVED',
    });
  }
  async queueCompleted(tx: UnitOfWork, lesson: Row) {
    requireCondition(
      lesson.status === 'COMPLETED' &&
        lesson.durationMinutes === 50 &&
        lesson.fundingSource === 'ASAAS_SUBSCRIPTION' &&
        lesson.payerConfirmedAt &&
        this.now() >= lesson.scheduledAt + lesson.durationMinutes * 60_000,
      409,
      'Repasse exige conclusão confirmada pelo pagador',
    );
    const reservation = await tx.get('subscription_reservations', lesson.id);
    requireCondition(
      reservation &&
        reservation.teacherId === lesson.teacherId &&
        reservation.studentId === lesson.studentId &&
        reservation.payerId === lesson.payerId,
      409,
      'Reserva do plano não corresponde à aula',
    );
    const cycle = await tx.get('subscription_cycles', reservation.cycleId);
    requireCondition(cycle?.status === 'FUNDED', 409, 'Pagamento do plano requer análise');
    const id = key(lesson.id),
      prior = await tx.get('subscription_payouts', id);
    if (!prior)
      tx.set('subscription_payouts', {
        id,
        lessonId: lesson.id,
        paymentId: reservation.paymentId,
        teacherId: lesson.teacherId,
        studentId: lesson.studentId,
        payerId: lesson.payerId,
        amountCents: MONTHLY_TEACHER_PAYOUT_CENTS,
        walletId: reservation.walletId,
        externalReference: `talke-${id}`,
        status: 'QUEUED',
        reviewRequired: false,
        createdAt: this.stamp(),
      });
    tx.set('subscription_reservations', { ...reservation, status: 'COMPLETED' });
  }
  async confirmCompletion(actor: Identity, lessonId: string) {
    this.enabled();
    await this.platform.ready(actor);
    await this.store.transaction(async (tx) => {
      const lesson = await tx.get('lessons', lessonId);
      requireCondition(
        lesson &&
          lesson.payerId === actor.uid &&
          lesson.fundingSource === 'ASAAS_SUBSCRIPTION' &&
          lesson.status === 'COMPLETED' &&
          lesson.isPaid,
        403,
        'Confirmação não permitida',
      );
      await this.platform.authorizedStudent(actor, lesson.studentId, tx);
      const updated = { ...lesson, payerConfirmedAt: lesson.payerConfirmedAt || this.stamp() };
      await this.queueCompleted(tx, updated);
      tx.set('lessons', updated);
    });
    await this.processPayout(key(lessonId));
    return { confirmed: true };
  }
  async receiveEvent(body: unknown) {
    this.enabled();
    const event = z
      .object({
        id: z.string().min(1).max(200),
        event: z.string().regex(/^[A-Z_]{3,80}$/),
        account: z.object({ id: z.string().uuid() }).passthrough(),
        payment: z
          .object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) })
          .passthrough()
          .optional(),
        transfer: z
          .object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .parse(body);
    requireCondition(
      event.account.id === this.platform.config.asaasAccountId,
      401,
      'Conta Asaas divergente',
    );
    requireCondition(!event.event.startsWith('PAYMENT_') || event.payment, 400, 'Cobrança ausente');
    requireCondition(
      !event.event.startsWith('TRANSFER_') || event.transfer,
      400,
      'Transferência ausente',
    );
    await this.store.transaction(async (tx) => {
      const id = key(event.id),
        prior = await tx.get('asaas_events', id);
      if (!prior)
        tx.set('asaas_events', {
          id,
          event: event.event,
          paymentId: event.payment?.id || '',
          transferId: event.transfer?.id || '',
          status: 'PENDING',
          createdAt: this.stamp(),
        });
    });
  }
  async drainEvents() {
    this.enabled();
    const checkouts = await this.reconcileCheckouts();
    const events = await this.store.find('asaas_events', 'status', 'PENDING');
    let failures = checkouts.failures + (await this.syncSubscriptions()).failures;
    for (const event of events.slice(0, 100)) {
      try {
        if (event.event.startsWith('PAYMENT_')) await this.reconcilePayment(event.paymentId);
        else if (event.event.startsWith('TRANSFER_')) {
          await this.reconcileTransfer(event.transferId);
        }
        await this.store.transaction(async (tx) => {
          const fresh = await tx.get('asaas_events', event.id);
          if (fresh)
            tx.set('asaas_events', { ...fresh, status: 'PROCESSED', processedAt: this.stamp() });
        });
      } catch {
        failures++;
      }
    }
    failures += (await this.processQueued()).failures;
    return { checked: Math.min(events.length, 100), failures };
  }
  private validateTransfer(payout: Row, transfer: AsaasTransfer) {
    requireCondition(
      transfer.externalReference === payout.externalReference &&
        cents(transfer.value) === MONTHLY_TEACHER_PAYOUT_CENTS &&
        (transfer.walletId || transfer.account?.walletId) === payout.walletId &&
        ['PENDING', 'DONE', 'CANCELLED'].includes(transfer.status),
      409,
      'Transferência requer conciliação',
    );
  }
  async reconcileTransfer(transferId: string) {
    this.enabled();
    const transfer = await this.gateway.transfer(transferId);
    const rows = await this.store.find(
      'subscription_payouts',
      'externalReference',
      transfer.externalReference,
    );
    for (const row of rows) {
      this.validateTransfer(row, transfer);
      await this.store.transaction(async (tx) => {
        const fresh = await tx.get('subscription_payouts', row.id);
        requireCondition(
          fresh && (!fresh.transferId || fresh.transferId === transfer.id),
          409,
          'Transferência duplicada requer análise',
        );
        requireCondition(
          ['SUBMITTING', 'UNKNOWN', 'PENDING', 'DONE', 'CANCELLED'].includes(fresh.status),
          409,
          'Transferência sem solicitação registrada',
        );
        if (fresh.status !== 'DONE')
          tx.set('subscription_payouts', {
            ...fresh,
            transferId: transfer.id,
            status: transfer.status,
            checkedAt: this.stamp(),
          });
      });
    }
  }
  async processPayout(id: string) {
    this.enabled();
    const payout = await this.store.get('subscription_payouts', id);
    if (!payout || ['DONE', 'REVIEW', 'UNKNOWN', 'SUBMITTING', 'CANCELLED'].includes(payout.status))
      return;
    if (payout.transferId) {
      const transfer = await this.gateway.transfer(payout.transferId);
      this.validateTransfer(payout, transfer);
      await this.store.transaction(async (tx) => {
        const fresh = await tx.get('subscription_payouts', id);
        if (fresh && fresh.status !== 'DONE')
          tx.set('subscription_payouts', {
            ...fresh,
            status: transfer.status,
            checkedAt: this.stamp(),
          });
      });
      return;
    }
    const payment = await this.gateway.payment(payout.paymentId);
    // Confirmed credit-card payments may not yet be available in the account.
    if (
      payment.status !== 'RECEIVED' ||
      payment.deleted ||
      cents(payment.netValue) < MONTHLY_TEACHER_PAYOUT_CENTS
    )
      return;
    if ((await this.gateway.balance()) < MONTHLY_TEACHER_PAYOUT_CENTS) return;
    const claimed = await this.store.transaction(async (tx) => {
      const fresh = await tx.get('subscription_payouts', id);
      const lesson = fresh ? await tx.get('lessons', fresh.lessonId) : null;
      const record = fresh ? await tx.get('asaas_payments', fresh.paymentId) : null;
      const recipient = fresh ? await tx.get('asaas_recipients', fresh.teacherId) : null;
      const teacher = fresh ? await tx.get('profiles', fresh.teacherId) : null;
      requireCondition(
        lesson?.status === 'COMPLETED' && lesson.fundingSource === 'ASAAS_SUBSCRIPTION',
        409,
        'Repasse exige aula concluída do plano',
      );
      if (
        !fresh ||
        fresh.status !== 'QUEUED' ||
        fresh.reviewRequired ||
        record?.adverse ||
        record?.status !== 'RECEIVED' ||
        recipient?.verified !== true ||
        recipient.accountId !== this.platform.config.asaasAccountId ||
        recipient.walletId !== fresh.walletId ||
        teacher?.status !== 'ACTIVE'
      )
        return null;
      const subscription = await tx.get('subscriptions', record.subscriptionId);
      requireCondition(
        subscription &&
          payment.subscription === subscription.id &&
          payment.customer === subscription.customerId &&
          cents(payment.value) === subscription.amountCents,
        409,
        'Pagamento divergente no repasse',
      );
      tx.set('subscription_payouts', { ...fresh, status: 'SUBMITTING', submittedAt: this.stamp() });
      return fresh;
    });
    if (!claimed) return;
    try {
      const transfer = await this.gateway.sendTransfer(
        claimed.externalReference,
        claimed.walletId,
        MONTHLY_TEACHER_PAYOUT_CENTS,
      );
      this.validateTransfer(claimed, transfer);
      await this.store.transaction(async (tx) => {
        const fresh = await tx.get('subscription_payouts', id);
        requireCondition(fresh, 409, 'Repasse não encontrado');
        tx.set('subscription_payouts', {
          ...fresh,
          transferId: transfer.id,
          status: transfer.status,
          checkedAt: this.stamp(),
        });
      });
    } catch {
      // externalReference is a correlation key, not a documented idempotency guarantee.
      // Never resubmit after a timeout/crash: an operator must inspect Asaas first.
      await this.store.transaction(async (tx) => {
        const fresh = await tx.get('subscription_payouts', id);
        if (fresh?.status === 'SUBMITTING')
          tx.set('subscription_payouts', { ...fresh, status: 'UNKNOWN', reviewRequired: true });
      });
    }
  }
  async processQueued() {
    this.enabled();
    let failures = 0;
    for (const status of ['QUEUED', 'PENDING']) {
      const rows = await this.store.find('subscription_payouts', 'status', status);
      for (const row of rows.slice(0, 100)) {
        try {
          await this.processPayout(row.id);
        } catch {
          failures++;
        }
      }
    }
    return { failures };
  }
  async cancel(actor: Identity, subscriptionId: string) {
    this.enabled();
    await this.platform.ready(actor);
    const row = await this.store.get('subscriptions', subscriptionId);
    requireCondition(row && row.payerId === actor.uid, 403, 'Assinatura não permitida');
    if (row.status === 'CANCELLED') return { status: 'CANCELLED' };
    await this.gateway.cancelSubscription(subscriptionId);
    await this.store.transaction(async (tx) => {
      const fresh = await tx.get('subscriptions', subscriptionId);
      requireCondition(fresh, 404, 'Assinatura não encontrada');
      tx.set('subscriptions', { ...fresh, status: 'CANCELLED', cancelledAt: this.stamp() });
    });
    return { status: 'CANCELLED' };
  }
}
