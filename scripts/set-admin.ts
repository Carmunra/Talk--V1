import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { parseAdminArguments, setAdminPermission } from './admin-permissions';
const args = process.argv.slice(2);
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('Informe FIREBASE_PROJECT_ID');
parseAdminArguments(args);
if (
  process.env.NODE_ENV === 'production' &&
  (projectId.startsWith('demo-') || process.env.FIREBASE_AUTH_EMULATOR_HOST)
)
  throw new Error('A administração de produção exige Firebase sem emulador');
const firebase = initializeApp({ projectId, credential: applicationDefault() }),
  auth = getAuth(firebase);
await setAdminPermission(auth, args);
console.log('Permissão atualizada. A conta deve entrar novamente.');
