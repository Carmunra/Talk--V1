import { readConfig } from './config';

export function preflight(env: NodeJS.ProcessEnv, monthlyLaunch = false) {
  const issues: string[] = [];
  try {
    readConfig({ ...env, NODE_ENV: 'production' });
  } catch (error) {
    issues.push((error as Error).message);
  }
  for (const name of [
    'APP_ORIGIN',
    'FIREBASE_PROJECT_ID',
    'LEGAL_NAME',
    'LEGAL_CNPJ',
    'PRIVACY_EMAIL',
    'SUPPORT_EMAIL',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_APP_ID',
    'DAILY_API_KEY',
    'DAILY_DOMAIN',
  ])
    if (!env[name]?.trim()) issues.push(`${name} obrigatório`);
  if (env.LEGAL_APPROVED !== 'true') issues.push('Aprovação jurídica pendente');
  if (env.VITE_FIREBASE_PROJECT_ID && env.FIREBASE_PROJECT_ID !== env.VITE_FIREBASE_PROJECT_ID)
    issues.push('Projeto Firebase do navegador e do servidor devem corresponder');
  if (env.FIREBASE_PROJECT_ID?.startsWith('demo-'))
    issues.push('Projeto demo não pode ser publicado');
  if (env.DAILY_DOMAIN && !/^[a-zA-Z0-9-]+$/.test(env.DAILY_DOMAIN))
    issues.push('DAILY_DOMAIN inválido');
  if (monthlyLaunch) {
    for (const [name, label] of [
      ['SUBSCRIPTIONS_ENABLED', 'Contratação mensal desabilitada'],
      ['PAYMENTS_HOMOLOGATED', 'Homologação financeira completa pendente'],
      ['ASAAS_PRODUCTION_APPROVED', 'Liberação comercial Asaas pendente'],
      ['SUBSCRIPTION_RULES_APPROVED', 'Regras da assinatura pendentes'],
      ['MINORS_ENABLED', 'Atendimento a menores desabilitado'],
      ['MINORS_SAFEGUARDS_APPROVED', 'Procedimentos de proteção de menores pendentes'],
    ])
      if (env[name] !== 'true') issues.push(label);
    if (env.ASAAS_ENVIRONMENT !== 'live') issues.push('Lançamento mensal exige Asaas live');
    if (!env.SUBSCRIPTION_CANCEL_CREDITS)
      issues.push('Definir destino dos créditos após cancelar a renovação');
    for (const name of ['ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN', 'ASAAS_ACCOUNT_ID'])
      if (!env[name]?.trim()) issues.push(`${name} obrigatório para planos reais`);
  }
  return { ready: issues.length === 0, issues };
}
