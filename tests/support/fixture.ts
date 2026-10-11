import { readConfig } from '../../src/server/config';
import { Platform, Identity } from '../../src/server/platform';
import type { PaymentGateway, ProviderPayment } from '../../src/server/marketplace';
import type { Row } from '../../src/server/store';
import { MemoryStore } from './memory-store';
export const student: Identity = {
  uid: 'student',
  email: 'student@example.test',
  emailVerified: true,
  admin: false,
};
export const teacher: Identity = {
  uid: 'teacher',
  email: 'teacher@example.test',
  emailVerified: true,
  admin: false,
};
export const other: Identity = {
  uid: 'other',
  email: 'other@example.test',
  emailVerified: true,
  admin: false,
};
export const guardian: Identity = {
  uid: 'guardian',
  email: 'parent@example.test',
  emailVerified: true,
  admin: false,
};
export const admin: Identity = {
  uid: 'admin',
  email: 'admin@example.test',
  emailVerified: true,
  admin: true,
};
export class FakeGateway implements PaymentGateway {
  async search(order: Row) {
    return [...this.payments.values()].filter((p) => p.external_reference === order.id);
  }
  payments = new Map<string, ProviderPayment>();
  refunds: string[] = [];
  checkoutCalls = 0;
  failRefund = false;
  async connect(uid: string) {
    return 'https://auth.mercadopago.com/authorization?state=' + uid;
  }
  async callback() {}
  async checkout(order: Row) {
    this.checkoutCalls++;
    return { id: 'preference-' + order.id, url: 'https://www.mercadopago.com.br/checkout/test' };
  }
  async payment(id: string) {
    const payment = this.payments.get(id);
    if (!payment) throw new Error('missing provider payment');
    return structuredClone(payment);
  }
  async refund(id: string) {
    if (this.failRefund) throw new Error('refund unavailable');
    if (!this.refunds.includes(id)) this.refunds.push(id);
  }
  approve(order: Row, id = '123'): ProviderPayment {
    const payment = {
      id: Number(id),
      collector_id: 99,
      external_reference: order.id,
      transaction_amount: order.amountCents / 100,
      currency_id: 'BRL',
      status: 'approved',
      live_mode: false,
      fee_details: [{ type: 'application_fee', amount: order.feeCents / 100 }],
      date_last_updated: new Date().toISOString(),
    };
    this.payments.set(id, payment);
    return payment;
  }
}
export async function fixture() {
  const store = new MemoryStore(),
    gateway = new FakeGateway();
  let now = Date.now();
  const config = readConfig({
    NODE_ENV: 'test',
    FIREBASE_PROJECT_ID: 'demo-talke',
    SUPPORT_EMAIL: 'support@example.test',
    SUPPORT_EMAIL_SECONDARY: 'alternate@example.test',
    PAYMENTS_ENABLED: 'true',
    MINORS_ENABLED: 'true',
    MINIMUM_AGE: '6',
    MP_WEBHOOK_SECRET: 'webhook-test-secret',
    TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
  });
  const platform = new Platform(store, config, gateway, () => now);
  for (const [actor, accountType] of [
    [student, 'STUDENT'],
    [teacher, 'TEACHER'],
    [other, 'STUDENT'],
    [guardian, 'GUARDIAN'],
    [admin, 'STUDENT'],
  ] as const) {
    await platform.register(actor, {
      name: actor.uid,
      birthDate: '1990-01-01',
      accountType,
      termsVersion: config.termsVersion,
      acceptedTerms: true,
    });
    await platform.approve(
      admin,
      'age',
      actor.uid,
      'Aferição de idade realizada no cenário de teste',
    );
  }
  const date = new Date(now + 2 * 86400_000).toISOString().slice(0, 10),
    weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  await platform.updateTeacher(teacher, {
    headline: 'English teacher',
    bio: 'Experienced English language teacher for adults and minors.',
    hourlyPriceBrl: 100,
    levelsTaught: [1, 2, 3, 4, 5, 6],
    specialties: ['CONVERSATION'],
    languages: ['Inglês'],
    certifications: [],
    availability: [
      {
        id: 'all-day',
        dayOfWeek: weekday,
        dayLabel: 'Disponível',
        startTime: '08:00',
        endTime: '20:00',
        isAvailable: true,
      },
    ],
  });
  await store.transaction(async (tx) => {
    const row = await tx.get('teachers', teacher.uid);
    tx.set('teachers', { ...row!, isVerified: true, paymentConnected: true });
    tx.set('seller_credentials', { id: teacher.uid, sellerId: '99' });
  });
  const booking = {
    studentId: student.uid,
    teacherId: teacher.uid,
    scheduledDate: date,
    startTime: '10:00',
    topic: 'Conversation',
  };
  return {
    store,
    gateway,
    platform,
    config,
    booking,
    advance: (millis: number) => {
      now += millis;
    },
  };
}
