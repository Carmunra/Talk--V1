import { randomUUID } from 'node:crypto';
import type { Store, Row, UnitOfWork } from './store';
import type { RuntimeConfig } from './config';
import type { PaymentGateway, ProviderPayment } from './marketplace';
import { ApiError, requireCondition } from './security';
import {
  appointment,
  minutes,
  profileSchema,
  teacherSchema,
  bookingSchema,
  diagnosticSchema,
} from './validation';
import { VideoService } from './video';

export interface Identity {
  uid: string;
  email: string;
  emailVerified: boolean;
  admin: boolean;
}
export class Platform {
  constructor(
    readonly store: Store,
    readonly config: RuntimeConfig,
    readonly gateway: PaymentGateway,
    readonly now = () => Date.now(),
  ) {}
  private stamp() {
    return new Date(this.now()).toISOString();
  }
  async profile(actor: Identity) {
    const profile = await this.store.get('profiles', actor.uid);
    requireCondition(!profile?.deletedAt, 403, 'Conta encerrada');
    return profile;
  }
  async ready(actor: Identity) {
    const profile = await this.profile(actor);
    requireCondition(
      profile && profile.status === 'ACTIVE' && profile.termsVersion === this.config.termsVersion,
      403,
      'Conclua o cadastro e aceite os termos atuais',
    );
    return profile;
  }
  async me(actor: Identity) {
    const profile = await this.profile(actor);
    const dependents = await this.store.find('profiles', 'guardianId', actor.uid);
    return {
      profile,
      isAdmin: actor.admin,
      student: await this.store.get('students', actor.uid),
      teacher: await this.store.get('teachers', actor.uid),
      dependents: dependents
        .filter((p) => !p.deletedAt)
        .map((p) => ({ id: p.id, name: p.name, status: p.status, ageGroup: p.ageGroup })),
    };
  }
  async register(actor: Identity, raw: unknown) {
    requireCondition(actor.emailVerified, 403, 'Confirme seu e-mail antes do cadastro');
    const input = profileSchema.parse(raw);
    requireCondition(
      input.termsVersion === this.config.termsVersion,
      409,
      'Leia os termos atualizados',
    );
    const age = this.age(input.birthDate);
    requireCondition(
      age >= 18,
      403,
      'O cadastro de menores deve ser feito por um responsável adulto',
    );
    return this.store.transaction(async (tx) => {
      const existing = await tx.get('profiles', actor.uid);
      const student =
        existing?.accountType === 'STUDENT' ? await tx.get('students', actor.uid) : null;
      const teacher =
        existing?.accountType === 'TEACHER' ? await tx.get('teachers', actor.uid) : null;
      requireCondition(
        !existing ||
          (!existing.deletedAt &&
            ['ACTIVE', 'PENDING_AGE_REVIEW'].includes(existing.status) &&
            existing.accountType === input.accountType),
        409,
        'Cadastro ou tipo de conta não disponível para alteração',
      );
      const identityChanged =
        existing && (existing.name !== input.name || existing.birthDate !== input.birthDate);
      const profile = {
        id: actor.uid,
        name: input.name,
        email: actor.email,
        birthDate: input.birthDate,
        ageGroup: 'ADULT',
        accountType: input.accountType,
        status:
          this.config.minorsEnabled && (!existing || identityChanged)
            ? 'PENDING_AGE_REVIEW'
            : existing?.status || 'ACTIVE',
        termsVersion: input.termsVersion,
        termsAcceptedAt: this.stamp(),
        createdAt: existing?.createdAt || this.stamp(),
        ...(existing?.ageVerifiedAt && !identityChanged
          ? { ageVerifiedAt: existing.ageVerifiedAt }
          : {}),
      };
      if (!existing && input.accountType === 'STUDENT') tx.set('students', this.student(profile));
      if (!existing && input.accountType === 'TEACHER')
        tx.set('teachers', {
          id: actor.uid,
          name: input.name,
          email: actor.email,
          headline: '',
          bio: '',
          hourlyPriceBrl: 0,
          levelsTaught: [],
          specialties: [],
          languages: [],
          certifications: [],
          availability: [],
          rating: 0,
          totalReviews: 0,
          totalLessonsCompleted: 0,
          isVerified: false,
          paymentConnected: false,
          createdAt: this.stamp(),
        });
      if (student) tx.set('students', { ...student, name: input.name, email: actor.email });
      if (teacher)
        tx.set('teachers', {
          ...teacher,
          name: input.name,
          email: actor.email,
          isVerified: identityChanged ? false : teacher.isVerified,
        });
      tx.set('profiles', profile);
      return profile;
    });
  }
  private age(birthDate: string) {
    const date = new Date(`${birthDate}T12:00:00Z`);
    requireCondition(
      Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === birthDate,
      400,
      'Data de nascimento inválida',
    );
    const today = new Date(this.now());
    const age =
      today.getUTCFullYear() -
      date.getUTCFullYear() -
      (today.toISOString().slice(5, 10) < birthDate.slice(5, 10) ? 1 : 0);
    requireCondition(age >= 0 && age <= 120, 400, 'Data de nascimento inválida');
    return age;
  }
  private student(profile: Row) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email || '',
      walletBalanceBrl: 0,
      totalLessonsCompleted: 0,
      hasCompletedDiagnostic: false,
      createdAt: this.stamp(),
    };
  }
  async dependent(
    actor: Identity,
    input: { name: string; birthDate: string; guardianDeclaration: boolean; termsVersion: string },
  ) {
    const parent = await this.ready(actor);
    requireCondition(
      this.config.minorsEnabled &&
        parent.accountType === 'GUARDIAN' &&
        input.guardianDeclaration &&
        input.termsVersion === this.config.termsVersion,
      403,
      'Cadastro de menor indisponível ou autorização ausente',
    );
    const age = this.age(input.birthDate);
    requireCondition(
      age >= this.config.minimumAge && age < 18,
      400,
      'Idade fora da faixa atendida',
    );
    const profile = {
      id: randomUUID(),
      name: input.name,
      birthDate: input.birthDate,
      ageGroup: age < 12 ? 'CHILD' : 'ADOLESCENT',
      accountType: 'STUDENT',
      guardianId: actor.uid,
      status: 'PENDING_GUARDIAN_REVIEW',
      termsVersion: input.termsVersion,
      guardianConsentAt: this.stamp(),
      createdAt: this.stamp(),
    };
    await this.store.transaction(async (tx) => {
      tx.set('profiles', profile);
      tx.set('students', this.student(profile));
    });
    return { id: profile.id, name: profile.name, status: profile.status };
  }
  async approve(
    actor: Identity,
    kind: 'teacher' | 'guardian' | 'age',
    subject: string,
    evidenceReference: string,
  ) {
    requireCondition(actor.admin, 403, 'Acesso restrito à administração');
    await this.store.transaction(async (tx) => {
      const profile = await tx.get('profiles', subject);
      requireCondition(profile && !profile.deletedAt, 404, 'Cadastro não encontrado');
      if (kind === 'teacher') {
        const teacher = await tx.get('teachers', subject);
        requireCondition(
          profile.status === 'ACTIVE' &&
            profile.accountType === 'TEACHER' &&
            profile.termsVersion === this.config.termsVersion,
          409,
          'Professor precisa de cadastro e aferição de idade aprovados',
        );
        requireCondition(
          teacher && teacher.bio && teacher.hourlyPriceBrl >= 10,
          409,
          'Professor precisa completar o cadastro',
        );
        tx.set('teachers', { ...teacher, isVerified: true });
      } else if (kind === 'age') {
        requireCondition(
          profile.status === 'PENDING_AGE_REVIEW' &&
            !profile.guardianId &&
            this.age(profile.birthDate) >= 18,
          409,
          'Aferição de idade não disponível',
        );
        tx.set('profiles', { ...profile, status: 'ACTIVE', ageVerifiedAt: this.stamp() });
      } else {
        const parent = await tx.get('profiles', profile.guardianId || 'missing');
        requireCondition(
          profile.status === 'PENDING_GUARDIAN_REVIEW' &&
            parent?.status === 'ACTIVE' &&
            parent?.accountType === 'GUARDIAN',
          409,
          'Vínculo não disponível para aprovação',
        );
        tx.set('profiles', { ...profile, status: 'ACTIVE', guardianVerifiedAt: this.stamp() });
      }
      tx.set('audit_events', {
        id: randomUUID(),
        actorId: actor.uid,
        action: `APPROVE_${kind.toUpperCase()}`,
        subjectId: subject,
        evidenceReference,
        createdAt: this.stamp(),
      });
    });
  }
  async authorizedStudent(
    actor: Identity,
    studentId: string,
    tx: Pick<UnitOfWork, 'get'> = this.store,
  ) {
    const profile = await tx.get('profiles', studentId);
    requireCondition(
      profile &&
        !profile.deletedAt &&
        (actor.uid === studentId || profile.guardianId === actor.uid),
      403,
      'Acesso ao aluno não permitido',
    );
    return profile;
  }
  async publicTeachers() {
    const rows = await this.store.find('teachers', 'isVerified', true);
    const eligible = await Promise.all(
      rows
        .filter((t) => t.paymentConnected)
        .map(async (t) => {
          const profile = await this.store.get('profiles', t.id);
          return profile?.status === 'ACTIVE' &&
            profile.accountType === 'TEACHER' &&
            profile.termsVersion === this.config.termsVersion
            ? t
            : null;
        }),
    );
    return eligible
      .filter((t): t is Row => !!t)
      .map((t) => ({
        id: t.id,
        name: t.name,
        email: '',
        headline: t.headline,
        bio: t.bio,
        avatarUrl: t.avatarUrl || '',
        hourlyPriceBrl: t.hourlyPriceBrl,
        levelsTaught: t.levelsTaught,
        specialties: t.specialties,
        languages: t.languages,
        certifications: t.certifications,
        availability: t.availability,
        rating: t.rating,
        totalReviews: t.totalReviews,
        totalLessonsCompleted: t.totalLessonsCompleted,
        isVerified: true,
        createdAt: t.createdAt,
      }));
  }
  async updateTeacher(actor: Identity, raw: unknown) {
    const profile = await this.ready(actor);
    requireCondition(profile.accountType === 'TEACHER', 403, 'Cadastro de professor obrigatório');
    const input = teacherSchema.parse(raw);
    requireCondition(
      input.availability.every((s) => minutes(s.endTime) > minutes(s.startTime)),
      400,
      'Disponibilidade inválida',
    );
    return this.store.transaction(async (tx) => {
      const teacher = await tx.get('teachers', actor.uid);
      requireCondition(teacher, 404, 'Professor não encontrado');
      const changedPublicClaims =
        teacher.headline !== input.headline ||
        teacher.bio !== input.bio ||
        JSON.stringify(teacher.certifications) !== JSON.stringify(input.certifications);
      const updated = {
        ...teacher,
        ...input,
        isVerified: changedPublicClaims ? false : teacher.isVerified,
      };
      tx.set('teachers', updated);
      return updated;
    });
  }
  async diagnostic(actor: Identity, studentId: string, raw: unknown) {
    await this.ready(actor);
    const input = diagnosticSchema.parse(raw);
    return this.store.transaction(async (tx) => {
      await this.authorizedStudent(actor, studentId, tx);
      const student = await tx.get('students', studentId);
      requireCondition(student, 404, 'Aluno não encontrado');
      const updated = { ...student, ...input, hasCompletedDiagnostic: true };
      tx.set('students', updated);
      return updated;
    });
  }
  async lessons(actor: Identity) {
    await this.ready(actor);
    const mine = await this.store.find('lessons', 'payerId', actor.uid);
    const teaching = await this.store.find('lessons', 'teacherId', actor.uid);
    return [...new Map([...mine, ...teaching].map((l) => [l.id, l])).values()];
  }
  async booking(actor: Identity, raw: unknown, requestKey: string) {
    await this.ready(actor);
    requireCondition(
      this.config.paymentsEnabled,
      503,
      'Reservas com pagamento ainda não habilitadas',
    );
    const input = bookingSchema.parse(raw);
    requireCondition(
      /^[a-zA-Z0-9_-]{16,128}$/.test(requestKey),
      400,
      'Identificador da reserva obrigatório',
    );
    let slot: ReturnType<typeof appointment>;
    try {
      slot = appointment(input.scheduledDate, input.startTime, this.now());
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
    const lessonId = `${actor.uid}_${requestKey}`;
    requireCondition(lessonId.length <= 256, 400, 'Identificador inválido');
    return this.store.transaction(async (tx) => {
      const profile = await this.authorizedStudent(actor, input.studentId, tx);
      const payer = await tx.get('profiles', actor.uid);
      requireCondition(
        profile.status === 'ACTIVE' &&
          profile.termsVersion === this.config.termsVersion &&
          payer?.status === 'ACTIVE',
        403,
        'Cadastro ou vínculo com responsável pendente',
      );
      const existing = await tx.get('lessons', lessonId);
      if (existing) {
        requireCondition(
          existing.studentId === input.studentId &&
            existing.teacherId === input.teacherId &&
            existing.scheduledDate === input.scheduledDate &&
            existing.startTime === input.startTime &&
            existing.topic === input.topic,
          409,
          'Identificador já usado em outra reserva',
        );
        return existing;
      }
      const teacher = await tx.get('teachers', input.teacherId);
      const teacherProfile = await tx.get('profiles', input.teacherId);
      const seller = await tx.get('seller_credentials', input.teacherId);
      requireCondition(
        teacher &&
          teacherProfile?.status === 'ACTIVE' &&
          teacherProfile.accountType === 'TEACHER' &&
          teacherProfile.termsVersion === this.config.termsVersion &&
          teacher.isVerified &&
          teacher.paymentConnected &&
          seller,
        409,
        'Professor indisponível para reservas',
      );
      requireCondition(
        input.teacherId !== input.studentId && input.teacherId !== actor.uid,
        400,
        'Não é possível reservar a própria aula',
      );
      requireCondition(
        teacher.availability.some(
          (s: any) =>
            s.isAvailable &&
            s.dayOfWeek === slot.weekday &&
            minutes(s.startTime) <= slot.startMinutes &&
            minutes(s.endTime) >= slot.endMinutes,
        ),
        409,
        'Horário fora da disponibilidade do professor',
      );
      const teacherDay = await tx.get('booking_days', `${input.teacherId}_${input.scheduledDate}`);
      const studentDay = await tx.get('booking_days', `${input.studentId}_${input.scheduledDate}`);
      const active = (day: Row | null) =>
        (day?.slots || []).filter((s: any) => s.paid || s.expiresAt > this.now());
      const teacherSlots = active(teacherDay),
        studentSlots = active(studentDay);
      requireCondition(
        ![...teacherSlots, ...studentSlots].some(
          (s: any) => slot.startMinutes < s.end && slot.endMinutes > s.start,
        ),
        409,
        'Já existe uma reserva que ocupa este intervalo',
      );
      const amountCents = Math.round(teacher.hourlyPriceBrl * 100);
      requireCondition(
        Number.isSafeInteger(amountCents) && amountCents >= 1000 && amountCents <= 200000,
        409,
        'Preço do professor inválido',
      );
      const feeCents = Math.round(amountCents * 0.15);
      const expiresAt = Math.min(this.now() + 30 * 60_000, slot.timestamp - 5 * 60_000);
      requireCondition(
        expiresAt > this.now() + 60_000,
        409,
        'Agende com pelo menos 7 minutos de antecedência',
      );
      const lesson = {
        id: lessonId,
        ...input,
        payerId: actor.uid,
        studentName: profile.name,
        teacherName: teacher.name,
        durationMinutes: 50,
        status: 'REQUESTED',
        priceBrl: amountCents / 100,
        platformFeeBrl: feeCents / 100,
        teacherNetBrl: (amountCents - feeCents) / 100,
        isPaid: false,
        scheduledAt: slot.timestamp,
        expiresAt,
        createdAt: this.stamp(),
        orderId: lessonId,
      };
      const reservation = {
        lessonId,
        start: slot.startMinutes,
        end: slot.endMinutes,
        expiresAt,
        paid: false,
      };
      tx.set('booking_days', {
        id: `${input.teacherId}_${input.scheduledDate}`,
        slots: [...teacherSlots, reservation],
      });
      tx.set('booking_days', {
        id: `${input.studentId}_${input.scheduledDate}`,
        slots: [...studentSlots, reservation],
      });
      tx.set('lessons', lesson);
      tx.set('orders', {
        id: lessonId,
        lessonId,
        studentId: input.studentId,
        payerId: actor.uid,
        teacherId: input.teacherId,
        sellerId: seller.sellerId,
        amountCents,
        feeCents,
        status: 'PENDING',
        expiresAt,
        createdAt: this.stamp(),
      });
      return lesson;
    });
  }
  async checkout(actor: Identity, lessonId: string) {
    await this.ready(actor);
    requireCondition(this.config.paymentsEnabled, 503, 'Pagamentos não habilitados');
    const order = await this.store.transaction(async (tx) => {
      const row = await tx.get('orders', lessonId);
      const lesson = await tx.get('lessons', lessonId);
      requireCondition(row && row.payerId === actor.uid, 403, 'Pagamento não permitido');
      requireCondition(
        lesson?.status === 'REQUESTED' && row.status === 'PENDING' && row.expiresAt > this.now(),
        409,
        'Reserva expirada ou já processada',
      );
      await this.authorizedStudent(actor, row.studentId, tx);
      if (row.checkoutUrl) return row;
      requireCondition(
        !row.checkoutingAt || row.checkoutingAt < this.now() - 30_000,
        409,
        'Pagamento está sendo preparado; aguarde alguns segundos',
      );
      const next: Row = { ...row, checkoutingAt: this.now() };
      tx.set('orders', next);
      return next;
    });
    if (order.checkoutUrl) return { url: order.checkoutUrl };
    const result = await this.gateway.checkout(order, order.teacherId);
    await this.store.transaction(async (tx) => {
      const fresh = await tx.get('orders', order.id);
      requireCondition(fresh, 404, 'Reserva não encontrada');
      requireCondition(
        fresh.status === 'PENDING' && fresh.expiresAt > this.now(),
        409,
        'Reserva cancelada ou expirada durante a preparação do pagamento',
      );
      tx.set('orders', { ...fresh, preferenceId: result.id, checkoutUrl: result.url });
    });
    return { url: result.url };
  }
  async reconcilePayment(paymentId: string, sellerId: string) {
    const payment = await this.gateway.payment(paymentId, sellerId);
    requireCondition(
      String(payment.id) === paymentId &&
        String(payment.collector_id) === sellerId &&
        payment.currency_id === 'BRL' &&
        payment.live_mode === this.config.livePayments,
      400,
      'Pagamento não corresponde à integração',
    );
    const refund = await this.store.transaction(async (tx) => this.applyPayment(tx, payment));
    if (refund) await this.performRefund(refund.id, refund.teacherId, refund.paymentId);
    if (
      ['refunded', 'charged_back', 'cancelled'].includes(payment.status) ||
      (payment.transaction_amount_refunded || 0) > 0
    ) {
      const order = await this.store.get('orders', payment.external_reference);
      const lesson = order ? await this.store.get('lessons', order.lessonId) : null;
      if (lesson?.status === 'CANCELLED')
        await new VideoService(this.store, this.config).close(lesson.id);
    }
  }
  private async applyPayment(tx: UnitOfWork, payment: ProviderPayment) {
    const order = await tx.get('orders', payment.external_reference || 'missing');
    requireCondition(
      order &&
        order.sellerId === String(payment.collector_id) &&
        order.amountCents === Math.round(payment.transaction_amount * 100),
      400,
      'Valor ou destinatário do pagamento inválido',
    );
    const lesson = await tx.get('lessons', order.lessonId);
    requireCondition(lesson, 404, 'Reserva não encontrada');
    const teacherDay = await tx.get('booking_days', `${lesson.teacherId}_${lesson.scheduledDate}`);
    const studentDay = await tx.get('booking_days', `${lesson.studentId}_${lesson.scheduledDate}`);
    const prior = await tx.get('payments', String(payment.id));
    // Provider state is read on every retry. A replay cannot regress a refund/chargeback.
    const existingRefund = await tx.get('refunds', `refund_${payment.id}`);
    if (
      prior &&
      prior.updatedAt &&
      payment.date_last_updated &&
      Date.parse(prior.updatedAt) > Date.parse(payment.date_last_updated)
    )
      return null;
    if (
      prior &&
      ['refunded', 'charged_back'].includes(prior.status) &&
      payment.status === 'approved'
    )
      return null;
    if (existingRefund?.status === 'REFUNDED') return null;
    if (payment.status === 'refunded' && existingRefund) {
      tx.set('refunds', { ...existingRefund, status: 'REFUNDED', confirmedAt: this.stamp() });
    }
    if (prior && prior.updatedAt === payment.date_last_updated && prior.status === payment.status) {
      return existingRefund && ['PENDING', 'REQUIRES_SUPPORT'].includes(existingRefund.status)
        ? existingRefund
        : null;
    }
    const fee = (payment.fee_details || [])
      .filter((f) => f.type === 'application_fee')
      .reduce((total, f) => total + Math.round(f.amount * 100), 0);
    requireCondition(
      payment.status !== 'approved' || fee === order.feeCents,
      400,
      'Comissão divergente; pagamento requer análise',
    );
    const record = {
      id: String(payment.id),
      orderId: order.id,
      payerId: order.payerId,
      teacherId: order.teacherId,
      sellerId: order.sellerId,
      amountCents: order.amountCents,
      status: payment.status,
      updatedAt: payment.date_last_updated || '',
      createdAt: prior?.createdAt || this.stamp(),
    };
    tx.set('payments', record);
    if (payment.status === 'approved') {
      if ((payment.transaction_amount_refunded || 0) > 0) {
        if (!order.paymentId || order.paymentId === String(payment.id)) {
          tx.set('orders', { ...order, status: 'PARTIAL_REFUND_REVIEW' });
          tx.set('lessons', { ...lesson, isPaid: false, status: 'CANCELLED' });
          for (const day of [teacherDay, studentDay])
            if (day)
              tx.set('booking_days', {
                ...day,
                slots: day.slots.filter((s: any) => s.lessonId !== lesson.id),
              });
        }
        tx.set('refunds', {
          id: `refund_${payment.id}`,
          teacherId: order.teacherId,
          paymentId: String(payment.id),
          orderId: order.id,
          status: 'REQUIRES_SUPPORT',
          reason: 'PARTIAL_REFUND',
          createdAt: existingRefund?.createdAt || this.stamp(),
        });
        return null;
      }
      if (existingRefund)
        return ['PENDING', 'REQUIRES_SUPPORT'].includes(existingRefund.status)
          ? existingRefund
          : null;
      if (order.paymentId === String(payment.id) && order.status === 'PAID') return null;
      const holdsSlot = (day: Row | null) =>
        day?.slots?.some(
          (s: any) => s.lessonId === lesson.id && (s.paid || s.expiresAt > this.now()),
        );
      if (
        order.status !== 'PENDING' ||
        lesson.status !== 'REQUESTED' ||
        order.expiresAt <= this.now() ||
        !holdsSlot(teacherDay) ||
        !holdsSlot(studentDay)
      ) {
        // Duplicate payments or late approvals are refunded, never attached to another reservation.
        const request = {
          id: `refund_${payment.id}`,
          teacherId: order.teacherId,
          paymentId: String(payment.id),
          orderId: order.id,
          status: 'PENDING',
          reason: 'DUPLICATE_OR_EXPIRED',
          createdAt: this.stamp(),
        };
        tx.set('refunds', request);
        return request;
      }
      const mark = (day: Row) => ({
        ...day,
        slots: day.slots.map((s: any) => (s.lessonId === lesson.id ? { ...s, paid: true } : s)),
      });
      tx.set('booking_days', mark(teacherDay!));
      tx.set('booking_days', mark(studentDay!));
      tx.set('orders', {
        ...order,
        status: 'PAID',
        paymentId: String(payment.id),
        paidAt: this.stamp(),
      });
      tx.set('lessons', {
        ...lesson,
        isPaid: true,
        status: 'CONFIRMED',
        paymentMethod: 'MERCADO_PAGO',
      });
    } else if (
      ['refunded', 'charged_back', 'cancelled'].includes(payment.status) &&
      order.paymentId === String(payment.id)
    ) {
      tx.set('orders', {
        ...order,
        status: payment.status === 'refunded' ? 'REFUNDED' : 'DISPUTED',
      });
      tx.set('lessons', { ...lesson, isPaid: false, status: 'CANCELLED' });
      for (const day of [teacherDay, studentDay])
        if (day)
          tx.set('booking_days', {
            ...day,
            slots: day.slots.filter((s: any) => s.lessonId !== lesson.id),
          });
      const request = await tx.get('refunds', `refund_${payment.id}`);
      if (request && payment.status === 'refunded')
        tx.set('refunds', { ...request, status: 'REFUNDED', confirmedAt: this.stamp() });
    }
    return null;
  }
  private async performRefund(id: string, teacherId: string, paymentId: string) {
    try {
      await this.gateway.refund(paymentId, teacherId);
      await this.store.transaction(async (tx) => {
        const row = await tx.get('refunds', id);
        if (row && row.status !== 'REFUNDED')
          tx.set('refunds', { ...row, status: 'SENT', submittedAt: this.stamp() });
      });
    } catch {
      await this.store.transaction(async (tx) => {
        const row = await tx.get('refunds', id);
        if (row) tx.set('refunds', { ...row, status: 'REQUIRES_SUPPORT' });
      });
      throw new ApiError(502, 'Reembolso solicitado e registrado para acompanhamento do suporte');
    }
  }
  async cancel(actor: Identity, lessonId: string) {
    await this.ready(actor);
    const request = await this.store.transaction(async (tx) => {
      const lesson = await tx.get('lessons', lessonId);
      requireCondition(
        lesson && (lesson.payerId === actor.uid || lesson.teacherId === actor.uid || actor.admin),
        403,
        'Cancelamento não permitido',
      );
      requireCondition(
        ['REQUESTED', 'CONFIRMED', 'CANCELLED'].includes(lesson.status),
        409,
        'Aula iniciada ou concluída requer atendimento do suporte',
      );
      const order = await tx.get('orders', lessonId);
      const teacherDay = await tx.get(
        'booking_days',
        `${lesson.teacherId}_${lesson.scheduledDate}`,
      );
      const studentDay = await tx.get(
        'booking_days',
        `${lesson.studentId}_${lesson.scheduledDate}`,
      );
      const existing = order?.paymentId
        ? await tx.get('refunds', `refund_${order.paymentId}`)
        : null;
      tx.set('lessons', { ...lesson, status: 'CANCELLED' });
      for (const day of [teacherDay, studentDay])
        if (day)
          tx.set('booking_days', {
            ...day,
            slots: day.slots.filter((s: any) => s.lessonId !== lesson.id),
          });
      if (!order) return null;
      if (existing?.status === 'REFUNDED') return null;
      if (order.paymentId) {
        const row = existing || {
          id: `refund_${order.paymentId}`,
          teacherId: lesson.teacherId,
          paymentId: order.paymentId,
          orderId: order.id,
          status: 'PENDING',
          reason: 'CANCELLATION',
          createdAt: this.stamp(),
        };
        tx.set('refunds', row);
        tx.set('orders', { ...order, status: 'REFUND_PENDING' });
        return row;
      }
      tx.set('orders', { ...order, status: 'CANCELLED' });
      return null;
    });
    if (request) await this.performRefund(request.id, request.teacherId, request.paymentId);
    return { status: request ? 'REFUND_PENDING' : 'CANCELLED' };
  }
  async complete(actor: Identity, lessonId: string) {
    await this.ready(actor);
    return this.store.transaction(async (tx) => {
      const lesson = await tx.get('lessons', lessonId);
      requireCondition(
        lesson && lesson.teacherId === actor.uid,
        403,
        'Somente o professor pode concluir a aula',
      );
      requireCondition(
        lesson.isPaid && ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(lesson.status),
        409,
        'Aula não paga ou cancelada',
      );
      if (lesson.status === 'COMPLETED') return lesson;
      requireCondition(
        this.now() >= lesson.scheduledAt + lesson.durationMinutes * 60_000,
        409,
        'Aguarde o término previsto da aula',
      );
      const student = await tx.get('students', lesson.studentId),
        teacher = await tx.get('teachers', lesson.teacherId);
      requireCondition(student && teacher, 409, 'Cadastros indisponíveis');
      const updated = { ...lesson, status: 'COMPLETED', completedAt: this.stamp() };
      tx.set('lessons', updated);
      tx.set('students', { ...student, totalLessonsCompleted: student.totalLessonsCompleted + 1 });
      tx.set('teachers', { ...teacher, totalLessonsCompleted: teacher.totalLessonsCompleted + 1 });
      return updated;
    });
  }
  async review(actor: Identity, lessonId: string, rating: number, comment: string) {
    await this.ready(actor);
    return this.store.transaction(async (tx) => {
      const lesson = await tx.get('lessons', lessonId);
      requireCondition(
        lesson && lesson.payerId === actor.uid && lesson.status === 'COMPLETED' && lesson.isPaid,
        403,
        'Avaliação disponível após sua aula concluída',
      );
      const prior = await tx.get('reviews', lessonId),
        teacher = await tx.get('teachers', lesson.teacherId);
      requireCondition(!prior && teacher, 409, 'Avaliação já registrada');
      const row = {
        id: lessonId,
        teacherId: lesson.teacherId,
        payerId: actor.uid,
        rating,
        comment,
        createdAt: this.stamp(),
      };
      tx.set('reviews', row);
      tx.set('teachers', {
        ...teacher,
        totalReviews: teacher.totalReviews + 1,
        rating: (teacher.rating * teacher.totalReviews + rating) / (teacher.totalReviews + 1),
      });
      return row;
    });
  }
  async reconcileOrder(orderId: string) {
    const order = await this.store.get('orders', orderId);
    requireCondition(order, 404, 'Pedido não encontrado');
    const payments = await this.gateway.search(order);
    for (const payment of payments) await this.reconcilePayment(String(payment.id), order.sellerId);
  }
}
