import { z } from 'zod';

export interface RuntimeConfig {
  production: boolean;
  trustProxyHops: number;
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
  asaasSandboxEnabled: boolean;
  asaasApiKey: string;
  asaasWebhookToken: string;
  asaasAccountId: string;
  subscriptionsEnabled: boolean;
  asaasEnvironment: 'sandbox' | 'live';
  subscriptionCancelCredits: 'keep_until_expiry' | 'block_booking';
}
export function readConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  for (const flag of [
    'LEGAL_APPROVED',
    'MINORS_ENABLED',
    'MINORS_SAFEGUARDS_APPROVED',
    'PAYMENTS_ENABLED',
    'PAYMENTS_HOMOLOGATED',
    'ASAAS_SANDBOX_ENABLED',
    'SUBSCRIPTIONS_ENABLED',
    'SUBSCRIPTION_RULES_APPROVED',
    'ASAAS_PRODUCTION_APPROVED',
  ]) {
    if (env[flag] !== undefined && !['true', 'false'].includes(env[flag]!))
      throw new Error(`${flag} deve ser true ou false`);
  }
  if (env.MP_ENVIRONMENT !== undefined && !['sandbox', 'live'].includes(env.MP_ENVIRONMENT))
    throw new Error('MP_ENVIRONMENT deve ser sandbox ou live');
  const production = env.NODE_ENV === 'production';
  const asaasEnvironment = env.ASAAS_ENVIRONMENT || 'sandbox';
  if (!['sandbox', 'live'].includes(asaasEnvironment))
    throw new Error('ASAAS_ENVIRONMENT deve ser sandbox ou live');
  if (env.ASAAS_SANDBOX_ENABLED === 'true' && asaasEnvironment === 'live')
    throw new Error('Não misture a habilitação Sandbox com Asaas live');
  const subscriptionCancelCredits = env.SUBSCRIPTION_CANCEL_CREDITS || 'block_booking';
  if (!['keep_until_expiry', 'block_booking'].includes(subscriptionCancelCredits))
    throw new Error('Política de créditos após cancelamento inválida');
  if (env.TRUST_PROXY_HOPS !== undefined && !['0', '1'].includes(env.TRUST_PROXY_HOPS))
    throw new Error('TRUST_PROXY_HOPS deve ser 0 ou 1; habilite somente atrás de um proxy isolado');
  const origin = env.APP_ORIGIN || 'http://localhost:3000';
  const config: RuntimeConfig = {
    production,
    trustProxyHops: Number(env.TRUST_PROXY_HOPS || 0),
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
    termsVersion: env.TERMS_VERSION || '2026-10-12',
    asaasSandboxEnabled: env.ASAAS_SANDBOX_ENABLED === 'true',
    asaasApiKey:
      (asaasEnvironment === 'live' ? env.ASAAS_API_KEY : env.ASAAS_SANDBOX_API_KEY) || '',
    asaasWebhookToken:
      (asaasEnvironment === 'live' ? env.ASAAS_WEBHOOK_TOKEN : env.ASAAS_SANDBOX_WEBHOOK_TOKEN) ||
      '',
    asaasAccountId:
      (asaasEnvironment === 'live' ? env.ASAAS_ACCOUNT_ID : env.ASAAS_SANDBOX_ACCOUNT_ID) || '',
    subscriptionsEnabled: env.SUBSCRIPTIONS_ENABLED === 'true',
    asaasEnvironment: asaasEnvironment as 'sandbox' | 'live',
    subscriptionCancelCredits: subscriptionCancelCredits as 'keep_until_expiry' | 'block_booking',
  };
  if (
    (config.asaasSandboxEnabled || config.subscriptionsEnabled) &&
    (!config.asaasApiKey ||
      !/^\S{32,255}$/.test(config.asaasWebhookToken) ||
      config.asaasWebhookToken === config.asaasApiKey ||
      !z.string().uuid().safeParse(config.asaasAccountId).success)
  )
    throw new Error('Asaas exige chave, token separado e ID da conta do ambiente selecionado');
  if (config.subscriptionsEnabled || config.asaasSandboxEnabled) {
    const prefix = asaasEnvironment === 'live' ? '$aact_prod_' : '$aact_hmlg_';
    if (!config.asaasApiKey.startsWith(prefix))
      throw new Error('Chave Asaas não corresponde ao ambiente selecionado');
  }
  if (config.subscriptionsEnabled && asaasEnvironment === 'live') {
    if (
      new URL(origin).protocol !== 'https:' ||
      env.PAYMENTS_HOMOLOGATED !== 'true' ||
      env.ASAAS_PRODUCTION_APPROVED !== 'true' ||
      env.SUBSCRIPTION_RULES_APPROVED !== 'true' ||
      !env.SUBSCRIPTION_CANCEL_CREDITS ||
      !config.legalApproved ||
      env.FIREBASE_AUTH_EMULATOR_HOST ||
      env.FIRESTORE_EMULATOR_HOST ||
      !config.projectId ||
      config.projectId.startsWith('demo-')
    )
      throw new Error(
        'Assinaturas reais exigem HTTPS, Firebase real, homologação e aprovações comercial/jurídica das regras',
      );
  }
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
