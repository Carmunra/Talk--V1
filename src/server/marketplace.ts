import { createHash, randomBytes } from 'node:crypto';
import type { RuntimeConfig } from './config';
import type { Store, Row } from './store';
import { ApiError, requireCondition, seal, unseal } from './security';

export interface ProviderPayment {
  id: number;
  collector_id: number;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
  status: string;
  transaction_amount_refunded?: number;
  live_mode: boolean;
  fee_details?: { type: string; amount: number; fee_payer?: string }[];
  date_last_updated?: string;
}
export interface PaymentGateway {
  search(order: Row): Promise<ProviderPayment[]>;
  connect(uid: string): Promise<string>;
  callback(state: string, code: string): Promise<void>;
  checkout(order: Row, teacherId: string): Promise<{ id: string; url: string }>;
  payment(paymentId: string, sellerId: string): Promise<ProviderPayment>;
  refund(paymentId: string, teacherId: string): Promise<void>;
}
interface SellerTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  expiresAt: number;
}

export class MercadoPagoGateway implements PaymentGateway {
  constructor(
    private readonly store: Store,
    private readonly config: RuntimeConfig,
  ) {}
  private async request<T>(
    path: string,
    body?: unknown,
    token?: string,
    key?: string,
    method?: string,
  ): Promise<T> {
    const response = await fetch(`https://api.mercadopago.com${path}`, {
      method: method || (body ? 'POST' : 'GET'),
      signal: AbortSignal.timeout(10_000),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { 'X-Idempotency-Key': key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
      throw new ApiError(
        502,
        'Mercado Pago indisponível ou conta sem autorização. Tente novamente ou contate o suporte.',
      );
    return response.json() as Promise<T>;
  }
  async connect(uid: string) {
    requireCondition(
      this.config.paymentsEnabled && this.config.mpClientId && this.config.mpClientSecret,
      503,
      'Pagamentos não habilitados',
    );
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    const hash = createHash('sha256').update(state).digest('hex');
    await this.store.transaction(async (tx) =>
      tx.set('oauth_states', {
        id: hash,
        uid,
        verifier: seal(verifier, this.config.tokenKey),
        expiresAt: Date.now() + 600_000,
        used: false,
      }),
    );
    const url = new URL('https://auth.mercadopago.com/authorization');
    url.search = new URLSearchParams({
      client_id: this.config.mpClientId,
      response_type: 'code',
      platform_id: 'mp',
      state,
      redirect_uri: `${this.config.origin}/api/payments/oauth/callback`,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
    }).toString();
    return url.toString();
  }
  async callback(state: string, code: string) {
    requireCondition(
      /^[a-zA-Z0-9_-]{43}$/.test(state) && code.length > 0 && code.length < 1024,
      400,
      'Autorização inválida',
    );
    const hash = createHash('sha256').update(state).digest('hex');
    const attempt = await this.store.transaction(async (tx) => {
      const row = await tx.get('oauth_states', hash);
      requireCondition(
        row && !row.used && row.expiresAt > Date.now(),
        400,
        'Autorização expirada. Inicie novamente.',
      );
      tx.set('oauth_states', { ...row, used: true });
      return row;
    });
    const result = await this.request<SellerTokens>('/oauth/token', {
      client_id: this.config.mpClientId,
      client_secret: this.config.mpClientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${this.config.origin}/api/payments/oauth/callback`,
      code_verifier: unseal(attempt.verifier, this.config.tokenKey),
      test_token: !this.config.livePayments,
    });
    requireCondition(
      result.access_token &&
        result.refresh_token &&
        Number.isInteger(result.user_id) &&
        result.expires_in > 0,
      502,
      'Resposta inválida do Mercado Pago',
    );
    await this.store.transaction(async (tx) => {
      const teacher = await tx.get('teachers', attempt.uid);
      const existing = await tx.get('seller_accounts', String(result.user_id));
      const previous = await tx.get('seller_credentials', attempt.uid);
      requireCondition(
        teacher && (!existing || existing.teacherId === attempt.uid),
        409,
        'Conta já vinculada ou cadastro de professor ausente',
      );
      requireCondition(
        !previous || previous.sellerId === String(result.user_id),
        409,
        'Troca de conta recebedora exige análise dos pagamentos existentes pelo suporte',
      );
      tx.set('seller_accounts', { id: String(result.user_id), teacherId: attempt.uid });
      tx.set('seller_credentials', {
        id: attempt.uid,
        sellerId: String(result.user_id),
        encrypted: seal(
          { ...result, expiresAt: Date.now() + result.expires_in * 1000 },
          this.config.tokenKey,
        ),
      });
      tx.set('teachers', { ...teacher, paymentConnected: true });
    });
  }
  private async credentials(teacherId: string, allowRetained = false): Promise<SellerTokens> {
    const row =
      (await this.store.get('seller_credentials', teacherId)) ||
      (allowRetained ? await this.store.get('retained_seller_credentials', teacherId) : null);
    requireCondition(row, 409, 'O professor precisa conectar sua conta Mercado Pago');
    const tokens = unseal<SellerTokens>(row.encrypted, this.config.tokenKey);
    // Reconnection is explicit; expired tokens never fall back to the platform's credentials.
    // Avoid rotating a refresh token concurrently in payment requests.
    requireCondition(
      tokens.expiresAt > Date.now() + 60_000,
      409,
      'Professor precisa renovar a conexão Mercado Pago',
    );
    return tokens;
  }
  async checkout(order: Row, teacherId: string) {
    const token = await this.credentials(teacherId);
    requireCondition(
      order.sellerId === String(token.user_id),
      409,
      'Conta do professor alterada. Contate o suporte.',
    );
    const result = await this.request<{
      id: string;
      init_point: string;
      sandbox_init_point: string;
    }>(
      '/checkout/preferences',
      {
        items: [
          {
            id: order.lessonId,
            title: 'Aula de inglês Talkê · 50 minutos',
            currency_id: 'BRL',
            quantity: 1,
            unit_price: order.amountCents / 100,
          },
        ],
        marketplace_fee: order.feeCents / 100,
        external_reference: order.id,
        notification_url: `${this.config.origin}/api/payments/webhook`,
        back_urls: {
          success: `${this.config.origin}/?payment=return`,
          pending: `${this.config.origin}/?payment=return`,
          failure: `${this.config.origin}/?payment=return`,
        },
        auto_return: 'approved',
        expires: true,
        expiration_date_to: new Date(order.expiresAt).toISOString(),
        payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 1 },
      },
      token.access_token,
      order.id,
    );
    const url = this.config.livePayments ? result.init_point : result.sandbox_init_point;
    requireCondition(
      result.id &&
        url &&
        new URL(url).protocol === 'https:' &&
        new URL(url).hostname.endsWith('.mercadopago.com.br'),
      502,
      'Link de pagamento inválido',
    );
    return { id: result.id, url };
  }
  async payment(paymentId: string, sellerId: string) {
    requireCondition(
      /^\d{1,30}$/.test(paymentId) && /^\d{1,30}$/.test(sellerId),
      400,
      'Pagamento inválido',
    );
    const account = await this.store.get('seller_accounts', sellerId);
    requireCondition(account, 404, 'Conta de pagamento desconhecida');
    const token = await this.credentials(account.teacherId, true);
    return this.request<ProviderPayment>(
      `/v1/payments/${paymentId}`,
      undefined,
      token.access_token,
    );
  }
  async refund(paymentId: string, teacherId: string) {
    requireCondition(/^\d{1,30}$/.test(paymentId), 400, 'Pagamento inválido');
    const tokens = await this.credentials(teacherId, true);
    await this.request(
      `/v1/payments/${paymentId}/refunds`,
      {},
      tokens.access_token,
      `talke-refund-${paymentId}`,
    );
  }
  async search(order: Row) {
    const tokens = await this.credentials(order.teacherId, true);
    requireCondition(String(tokens.user_id) === order.sellerId, 409, 'Conta recebedora alterada');
    const result = await this.request<{ results: ProviderPayment[]; paging: { total: number } }>(
      '/v1/payments/search?' +
        new URLSearchParams({
          external_reference: order.id,
          sort: 'date_created',
          criteria: 'desc',
          limit: '50',
        }),
      undefined,
      tokens.access_token,
    );
    requireCondition(
      result.paging.total <= 50,
      502,
      'Pagamentos exigem investigação; limite de conciliação excedido',
    );
    return result.results;
  }
}
