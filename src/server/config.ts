import { z } from 'zod';

export interface RuntimeConfig {
  production: boolean;
  origin: string;
  projectId: string;
  databaseId: string;
  legalName: string;
  legalCnpj: string;
  privacyEmail: string;
  supportEmail: string;
  supportEmails: string[];
  minimumAge: number;
  legalApproved: boolean;
  minorsEnabled: boolean;
  paymentsEnabled: boolean;
  livePayments: boolean;
  mpClientId: string;
  mpClientSecret: string;
  mpWebhookSecret: string;
  tokenKey: string;
  dailyKey: string;
  dailyDomain: string;
  termsVersion: string;
}
export function readConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  for (const flag of [
    'LEGAL_APPROVED',
    'MINORS_ENABLED',
    'MINORS_SAFEGUARDS_APPROVED',
    'PAYMENTS_ENABLED',
    'PAYMENTS_HOMOLOGATED',
  ]) {
    if (env[flag] !== undefined && !['true', 'false'].includes(env[flag]!))
      throw new Error(`${flag} deve ser true ou false`);
  }
  if (env.MP_ENVIRONMENT !== undefined && !['sandbox', 'live'].includes(env.MP_ENVIRONMENT))
    throw new Error('MP_ENVIRONMENT deve ser sandbox ou live');
  const production = env.NODE_ENV === 'production';
  const origin = env.APP_ORIGIN || 'http://localhost:3000';
  const config: RuntimeConfig = {
    production,
    origin,
    projectId: env.FIREBASE_PROJECT_ID || '',
    databaseId: env.FIRESTORE_DATABASE_ID || '(default)',
    legalName: env.LEGAL_NAME || '',
    legalCnpj: env.LEGAL_CNPJ || '',
    privacyEmail: env.PRIVACY_EMAIL || '',
    supportEmail: env.SUPPORT_EMAIL || '',
    supportEmails: [
      ...new Set(
        [env.SUPPORT_EMAIL, env.SUPPORT_EMAIL_SECONDARY].filter((email): email is string =>
          Boolean(email),
        ),
      ),
    ],
    minimumAge: Number(env.MINIMUM_AGE || 18),
    legalApproved: env.LEGAL_APPROVED === 'true',
    minorsEnabled: env.MINORS_ENABLED === 'true',
    paymentsEnabled: env.PAYMENTS_ENABLED === 'true',
    livePayments: env.MP_ENVIRONMENT === 'live',
    mpClientId: env.MP_CLIENT_ID || '',
    mpClientSecret: env.MP_CLIENT_SECRET || '',
    mpWebhookSecret: env.MP_WEBHOOK_SECRET || '',
    tokenKey: env.TOKEN_ENCRYPTION_KEY || '',
    dailyKey: env.DAILY_API_KEY || '',
    dailyDomain: env.DAILY_DOMAIN || '',
    termsVersion: env.TERMS_VERSION || '2026-10-08',
  };
  if (!Number.isInteger(config.minimumAge) || config.minimumAge < 6 || config.minimumAge > 18)
    throw new Error('MINIMUM_AGE inválida');
  if (config.supportEmails.some((email) => !z.string().email().safeParse(email).success))
    throw new Error('Canais de suporte devem ser e-mails válidos');
  const parsedOrigin = z.string().url().safeParse(origin);
  if (
    !parsedOrigin.success ||
    new URL(origin).origin !== origin ||
    !['http:', 'https:'].includes(new URL(origin).protocol)
  )
    throw new Error(
      'APP_ORIGIN deve ser somente a origem, sem caminho, barra final ou credenciais',
    );
  if (config.paymentsEnabled && config.livePayments) {
    if (
      new URL(origin).protocol !== 'https:' ||
      env.PAYMENTS_HOMOLOGATED !== 'true' ||
      env.FIREBASE_AUTH_EMULATOR_HOST ||
      env.FIRESTORE_EMULATOR_HOST
    )
      throw new Error('Pagamentos reais exigem HTTPS, homologação e Firebase sem emuladores');
  }
  if (production) {
    if (!z.string().url().safeParse(origin).success || new URL(origin).protocol !== 'https:')
      throw new Error('APP_ORIGIN deve usar HTTPS');
    if (!config.projectId || env.FIREBASE_AUTH_EMULATOR_HOST || env.FIRESTORE_EMULATOR_HOST)
      throw new Error('Firebase de produção obrigatório; emuladores proibidos');
    if (
      !config.legalApproved ||
      !config.legalName ||
      !/^\d{14}$/.test(config.legalCnpj) ||
      !z.string().email().safeParse(config.privacyEmail).success ||
      !z.string().email().safeParse(config.supportEmail).success
    ) {
      throw new Error(
        'Informe o controlador, CNPJ, canais de contato e aprovação jurídica antes de publicar',
      );
    }
    if (config.minorsEnabled && config.minimumAge === 18)
      throw new Error('Defina a idade mínima aprovada para menores');
    if (config.minorsEnabled && env.MINORS_SAFEGUARDS_APPROVED !== 'true')
      throw new Error(
        'Aprovação dos procedimentos de proteção e aferição de idade/vínculo obrigatória',
      );
    if (config.paymentsEnabled && config.livePayments && env.PAYMENTS_HOMOLOGATED !== 'true')
      throw new Error('Homologação do pagamento e split obrigatória');
    if (
      config.paymentsEnabled &&
      (!config.mpClientId ||
        !config.mpClientSecret ||
        !config.mpWebhookSecret ||
        Buffer.from(config.tokenKey, 'base64').length !== 32)
    )
      throw new Error('Credenciais de pagamento e chave de criptografia obrigatórias');
  }
  return config;
}
