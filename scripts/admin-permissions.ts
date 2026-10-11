import type { Auth } from 'firebase-admin/auth';
import { z } from 'zod';

type AdminAuth = Pick<
  Auth,
  'getUser' | 'getUserByEmail' | 'setCustomUserClaims' | 'revokeRefreshTokens'
>;

export function parseAdminArguments(args: string[]) {
  const byEmail = args[0] === '--email';
  const target = args[byEmail ? 1 : 0];
  const action = args[byEmail ? 2 : 1];
  if (
    args.length !== (byEmail ? 3 : 2) ||
    !target ||
    (byEmail ? !z.string().email().safeParse(target).success : target.startsWith('--')) ||
    !['grant', 'revoke'].includes(action)
  )
    throw new Error('Argumentos: UID grant|revoke ou --email EMAIL grant|revoke');
  return { target, byEmail, action: action as 'grant' | 'revoke' };
}

export async function setAdminPermission(auth: AdminAuth, args: string[]) {
  const { target, byEmail, action } = parseAdminArguments(args);
  const user = byEmail ? await auth.getUserByEmail(target) : await auth.getUser(target);
  if (byEmail && user.email?.toLowerCase() !== target.toLowerCase())
    throw new Error('O e-mail da conta não corresponde ao solicitado');
  if (action === 'grant' && (!user.emailVerified || user.disabled))
    throw new Error('Conta ativa com e-mail verificado obrigatória');
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: action === 'grant' });
  await auth.revokeRefreshTokens(user.uid);
}
