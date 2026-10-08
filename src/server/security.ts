import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireCondition(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new ApiError(status, message);
}
export function seal(value: unknown, key: string): string {
  const bytes = Buffer.from(key, 'base64');
  requireCondition(bytes.length === 32, 503, 'Integração de pagamentos não configurada');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', bytes, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}
export function unseal<T>(value: string, key: string): T {
  const data = Buffer.from(value, 'base64');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'base64'),
    data.subarray(0, 12),
  );
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'),
  );
}
export function verifyWebhook(
  signature: string,
  requestId: string,
  dataId: string,
  secret: string,
  now = Date.now(),
): void {
  const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')));
  const ts = parts.ts || '';
  const timestamp = Number(ts) * (ts.length <= 10 ? 1000 : 1);
  requireCondition(
    secret &&
      requestId &&
      /^[a-zA-Z0-9_-]+$/.test(dataId) &&
      /^\d{10,13}$/.test(ts) &&
      Number.isFinite(timestamp) &&
      Math.abs(now - timestamp) <= 5 * 60_000 &&
      /^[a-f0-9]{64}$/i.test(parts.v1 || ''),
    401,
    'Notificação inválida',
  );
  const expected = createHmac('sha256', secret)
    .update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`)
    .digest();
  requireCondition(
    timingSafeEqual(expected, Buffer.from(parts.v1, 'hex')),
    401,
    'Notificação inválida',
  );
}
