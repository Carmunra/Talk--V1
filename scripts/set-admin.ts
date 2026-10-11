import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const uid = process.argv[2],
  action = process.argv[3],
  projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId || !uid || !['grant', 'revoke'].includes(action))
  throw new Error('Informe FIREBASE_PROJECT_ID e argumentos: UID grant|revoke');
const firebase = initializeApp({ projectId, credential: applicationDefault() }),
  auth = getAuth(firebase);
const user = await auth.getUser(uid);
if (!user.emailVerified || user.disabled)
  throw new Error('Conta ativa com e-mail verificado obrigatória');
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: action === 'grant' });
await auth.revokeRefreshTokens(uid);
console.log('Permissão atualizada. A conta deve entrar novamente.');
