import { randomUUID } from 'node:crypto';
import { MonthlySubscriptions } from '../../src/server/subscriptions';
import type {
  AsaasPayment,
  AsaasSubscription,
  AsaasTransfer,
  SubscriptionGateway,
} from '../../src/server/asaas';
import { fixture, admin, student } from './fixture';

export const wallet = '43c4bc1b-0227-49ae-b363-21d497891ef3';
export const account = 'ce40c7b4-28d8-4125-bcd5-3c5d00406615';
export class FakeSubscriptions implements SubscriptionGateway {
  payments = new Map<string, AsaasPayment>();
  subscriptions = new Map<string, AsaasSubscription>();
  customers = new Map<string, { id: string; email: string }>();
  transfers = new Map<string, AsaasTransfer>();
  checkoutId = randomUUID();
  checkoutCalls = 0;
  checkoutPlan = '';
  checkoutRows: AsaasPayment[] = [];
  sendCalls = 0;
  available = 100_000;
  failSend = false;
  failCheckout = false;
  transferStatus = 'DONE';
  async checkout(planId: string) {
    this.checkoutCalls++;
    this.checkoutPlan = planId;
    if (this.failCheckout) throw new Error('secret-provider-error');
    return {
      id: this.checkoutId,
      url: `https://sandbox.asaas.com/checkoutSession/show?id=${this.checkoutId}`,
    };
  }
  async checkoutPayments() {
    return structuredClone(this.checkoutRows);
  }
  async subscriptionPayments(id: string) {
    return structuredClone([...this.payments.values()].filter((p) => p.subscription === id));
  }
  async subscription(id: string) {
    return structuredClone(this.subscriptions.get(id)!);
  }
  async customer(id: string) {
    return structuredClone(this.customers.get(id)!);
  }
  async payment(id: string) {
    return structuredClone(this.payments.get(id)!);
  }
  async transfer(id: string) {
    return structuredClone(this.transfers.get(id)!);
  }
  async balance() {
    return this.available;
  }
  async sendTransfer(externalReference: string, walletId: string, amountCents: number) {
    this.sendCalls++;
    const row = {
      id: `transfer_${this.sendCalls}`,
      externalReference,
      walletId,
      value: amountCents / 100,
      status: this.transferStatus,
    };
    this.transfers.set(row.id, row);
    if (this.failSend) throw new Error('timeout with secret-provider-error');
    return structuredClone(row);
  }
  async cancelSubscription(id: string) {
    this.subscriptions.get(id)!.status = 'INACTIVE';
  }
}
export async function subscriptionFixture(bind = true) {
  const f = await fixture();
  const gateway = new FakeSubscriptions();
  Object.assign(f.config, {
    asaasSandboxEnabled: true,
    asaasApiKey: 'sandbox-key',
    asaasWebhookToken: 's'.repeat(40),
    asaasAccountId: account,
  });
  const subscriptions = new MonthlySubscriptions(f.platform, gateway);
  const dueDate = new Date(f.platform.now() - 3 * 3600_000).toISOString().slice(0, 10);
  gateway.customers.set('cus_student', { id: 'cus_student', email: student.email });
  gateway.subscriptions.set('sub_student', {
    id: 'sub_student',
    customer: 'cus_student',
    value: 439,
    cycle: 'MONTHLY',
    billingType: 'CREDIT_CARD',
    status: 'ACTIVE',
  });
  const payment: AsaasPayment = {
    id: 'pay_first',
    subscription: 'sub_student',
    customer: 'cus_student',
    value: 439,
    netValue: 429,
    dueDate,
    status: 'RECEIVED',
  };
  gateway.payments.set(payment.id, payment);
  await f.store.transaction(async (tx) => {
    tx.set('asaas_recipients', {
      id: 'teacher',
      walletId: wallet,
      verified: true,
      accountId: account,
    });
  });
  const binding = {
    subscriptionId: 'sub_student',
    planId: 'monthly-4',
    payerId: student.uid,
    studentId: student.uid,
    firstDueDate: dueDate,
  };
  if (bind) {
    await subscriptions.bind(admin, binding);
    await subscriptions.reconcilePayment(payment.id);
  }
  const book = (startTime = '10:00', requestKey: string = randomUUID()) =>
    f.platform.booking(student, { ...f.booking, startTime }, requestKey, {
      subscriptions,
      subscriptionId: binding.subscriptionId,
    });
  return { ...f, gateway, subscriptions, dueDate, payment, binding, book };
}
