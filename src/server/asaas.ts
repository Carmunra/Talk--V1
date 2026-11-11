import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { MONTHLY_PLANS } from '../domain/monthlyPlans';
import { ApiError, requireCondition } from './security';

const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const value = z.number().finite().nonnegative();
export const asaasPaymentSchema = z
  .object({
    id: identifier,
    subscription: identifier,
    customer: identifier,
    value,
    netValue: value.nullable().transform((v) => v ?? 0),
    dueDate: z.string(),
    status: z.string(),
    deleted: z.boolean().optional(),
    checkoutSession: z.string().uuid().nullable().optional(),
  })
  .strip();
export type AsaasPayment = z.infer<typeof asaasPaymentSchema>;
export const asaasSubscriptionSchema = z
  .object({
    id: identifier,
    customer: identifier,
    value,
    cycle: z.string(),
    billingType: z.string(),
    status: z.string(),
    deleted: z.boolean().optional(),
  })
  .strip();
export type AsaasSubscription = z.infer<typeof asaasSubscriptionSchema>;
export const asaasTransferSchema = z
  .object({
    id: identifier,
    value,
    status: z.string(),
    externalReference: z.string(),
    walletId: z.string().nullable().optional(),
    account: z.object({ walletId: z.string().optional() }).strip().nullable().optional(),
  })
  .strip();
export type AsaasTransfer = z.infer<typeof asaasTransferSchema>;
export interface SubscriptionGateway {
  checkout(
    planId: string,
    reference: string,
    origin: string,
    firstDueDate: string,
  ): Promise<{ id: string; url: string }>;
  checkoutPayments(id: string, firstDueDate?: string): Promise<AsaasPayment[]>;
  subscriptionPayments(id: string): Promise<AsaasPayment[]>;
  subscription(id: string): Promise<AsaasSubscription>;
  customer(id: string): Promise<{ id: string; email: string }>;
  payment(id: string): Promise<AsaasPayment>;
  balance(): Promise<number>;
  transfer(id: string): Promise<AsaasTransfer>;
  sendTransfer(reference: string, walletId: string, amountCents: number): Promise<AsaasTransfer>;
  cancelSubscription(id: string): Promise<void>;
}
export function verifyAsaasWebhook(received: string, secret: string) {
  const expected = Buffer.from(secret),
    actual = Buffer.from(received);
  requireCondition(
    expected.length >= 32 &&
      expected.length <= 255 &&
      actual.length === expected.length &&
      timingSafeEqual(actual, expected),
    401,
    'Notificação Asaas não autorizada',
  );
}
export function cents(amount: number) {
  const result = Math.round(amount * 100);
  requireCondition(
    Number.isFinite(amount) &&
      amount >= 0 &&
      Number.isSafeInteger(result) &&
      Math.abs(amount * 100 - result) < 0.00001,
    502,
    'Valor financeiro inválido',
  );
  return result;
}

// Fixed provider origins; no card data and no automatic POST retry.
export class AsaasGateway implements SubscriptionGateway {
  constructor(
    private readonly apiKey: string,
    private readonly enabled: boolean,
    private readonly requestFetch: typeof fetch = fetch,
    private readonly environment: 'sandbox' | 'live' = 'sandbox',
  ) {}
  private async request(path: string, method = 'GET', body?: unknown): Promise<unknown> {
    requireCondition(
      this.enabled && Boolean(this.apiKey),
      503,
      'Homologação Asaas não configurada',
    );
    try {
      const base =
        this.environment === 'live'
          ? 'https://api.asaas.com/v3'
          : 'https://api-sandbox.asaas.com/v3';
      const response = await this.requestFetch(`${base}${path}`, {
        method,
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
        headers: {
          access_token: this.apiKey,
          'User-Agent': 'Talke/1.0',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new Error('Provider rejected request');
      return await response.json();
    } catch {
      // Never forward a provider error, request body or credential to the browser/logs.
      throw new ApiError(
        502,
        'Asaas indisponível; consulte a conciliação antes de repetir operações',
      );
    }
  }
  async subscription(id: string) {
    const row = asaasSubscriptionSchema.parse(
      await this.request(`/subscriptions/${identifier.parse(id)}`),
    );
    requireCondition(row.id === id, 502, 'Assinatura divergente');
    return row;
  }
  async customer(id: string) {
    const row = z
      .object({ id: identifier, email: z.string().email() })
      .strip()
      .parse(await this.request(`/customers/${identifier.parse(id)}`));
    requireCondition(row.id === id, 502, 'Cliente divergente');
    return row;
  }
  async payment(id: string) {
    const row = asaasPaymentSchema.parse(await this.request(`/payments/${identifier.parse(id)}`));
    requireCondition(row.id === id, 502, 'Cobrança divergente');
    return row;
  }
  async balance() {
    return cents(
      z.object({ balance: value }).parse(await this.request('/finance/balance')).balance,
    );
  }
  async transfer(id: string) {
    const row = asaasTransferSchema.parse(await this.request(`/transfers/${identifier.parse(id)}`));
    requireCondition(row.id === id, 502, 'Transferência divergente');
    return row;
  }
  async sendTransfer(reference: string, walletId: string, amountCents: number) {
    requireCondition(
      Number.isSafeInteger(amountCents) && amountCents === 4000,
      400,
      'Repasse inválido',
    );
    z.string().uuid().parse(walletId);
    return asaasTransferSchema.parse(
      await this.request('/transfers/', 'POST', {
        value: amountCents / 100,
        walletId,
        externalReference: identifier.parse(reference),
      }),
    );
  }
  async cancelSubscription(id: string) {
    await this.request(`/subscriptions/${identifier.parse(id)}`, 'DELETE');
  }
  async checkout(planId: string, reference: string, origin: string, firstDueDate: string) {
    const plan = MONTHLY_PLANS.find((item) => item.id === planId);
    requireCondition(plan, 400, 'Plano inválido');
    requireCondition(
      new URL(origin).origin === origin && ['http:', 'https:'].includes(new URL(origin).protocol),
      400,
      'Origem inválida',
    );
    const due = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .parse(firstDueDate);
    requireCondition(
      new Date(`${due}T12:00:00Z`).toISOString().slice(0, 10) === due,
      400,
      'Data inválida',
    );
    const row = z
      .object({ id: z.string().uuid() })
      .strip()
      .parse(
        await this.request('/checkouts', 'POST', {
          externalReference: identifier.parse(reference),
          billingTypes: ['CREDIT_CARD'],
          chargeTypes: ['RECURRENT'],
          minutesToExpire: 60,
          callback: {
            successUrl: `${origin}/planos?checkout=retorno`,
            cancelUrl: `${origin}/planos?checkout=cancelado`,
            expiredUrl: `${origin}/planos?checkout=expirado`,
          },
          items: [
            {
              name: `Talkê — ${plan.lessonsPerMonth} aulas mensais`,
              quantity: 1,
              value: plan.amountCents / 100,
              description: 'Assinatura mensal com renovação automática',
            },
          ],
          subscription: { cycle: 'MONTHLY', nextDueDate: due },
        }),
      );
    const host = this.environment === 'live' ? 'asaas.com' : 'sandbox.asaas.com';
    return { id: row.id, url: `https://${host}/checkoutSession/show?id=${row.id}` };
  }
  async checkoutPayments(id: string, firstDueDate?: string) {
    z.string().uuid().parse(id);
    let range: URLSearchParams | undefined;
    if (firstDueDate !== undefined) {
      z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .parse(firstDueDate);
      const start = new Date(`${firstDueDate}T12:00:00Z`);
      requireCondition(
        Number.isFinite(start.getTime()) && start.toISOString().slice(0, 10) === firstDueDate,
        400,
        'Data de checkout inválida',
      );
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      range = new URLSearchParams({
        'dateCreated[ge]': firstDueDate,
        'dateCreated[le]': end.toISOString().slice(0, 10),
      });
    }
    const filtered = await this.paymentPages(`/payments?checkoutSession=${id}&`, id);
    if (filtered.length || !range) return filtered;
    // Sandbox may return an empty session filter despite a confirmed checkout.
    // Scan only its creation window and accept an exact provider-returned UUID.
    return this.paymentPages(`/payments?${range.toString()}&`, id);
  }
  async subscriptionPayments(id: string) {
    return this.paymentPages(`/subscriptions/${identifier.parse(id)}/payments?`);
  }
  private async paymentPages(path: string, checkoutId?: string) {
    const all: AsaasPayment[] = [];
    for (let offset = 0; offset < 500; offset += 100) {
      const page = z
        .object({ data: z.array(z.unknown()), hasMore: z.boolean() })
        .parse(await this.request(`${path}limit=100&offset=${offset}`));
      const matching = checkoutId
        ? page.data.filter((row: any) => row && row.checkoutSession === checkoutId)
        : page.data;
      all.push(...matching.map((row) => asaasPaymentSchema.parse(row)));
      if (!page.hasMore) return all;
    }
    throw new ApiError(502, 'Conciliação de checkout excedeu o limite; requer análise');
  }
}

export class AsaasSandboxGateway extends AsaasGateway {}
