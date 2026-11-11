import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  inMemoryPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
const test = import.meta.env.MODE === 'test';
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (test ? 'demo-key' : ''),
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (test ? 'demo-talke.firebaseapp.com' : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (test ? 'demo-talke' : ''),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (test ? 'demo-app' : ''),
});
export const auth = getAuth(app);
if (test) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
export const authReady = setPersistence(
  auth,
  test ? inMemoryPersistence : browserSessionPersistence,
);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export { app };
