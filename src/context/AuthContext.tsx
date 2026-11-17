import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, authReady } from '../lib/firebase';
import { api } from '../lib/apiClient';
export interface Session {
  profile: any;
  isAdmin: boolean;
  student: any;
  teacher: any;
  dependents: { id: string; name: string; status: string; ageGroup: string }[];
}
interface AuthState {
  firebaseUser: User | null;
  session: Session | null;
  loadingAuth: boolean;
  authError: string;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
}
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setUser] = useState<User | null>(null),
    [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoading] = useState(true),
    [authError, setError] = useState('');
  const generation = useRef(0);
  const refreshProfiles = async () => {
    const user = auth.currentUser,
      current = generation.current;
    if (!user) {
      setSession(null);
      return;
    }
    const result = await api<Session>('/api/me');
    if (current === generation.current && auth.currentUser?.uid === user.uid) setSession(result);
  };
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void authReady
      .then(() => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          const current = ++generation.current;
          setUser(user);
          setSession(null);
          setError('');
          setLoading(true);
          if (user) {
            try {
              const result = await api<Session>('/api/me');
              if (current === generation.current) setSession(result);
            } catch (error) {
              if (current === generation.current) setError((error as Error).message);
            }
          }
          if (current === generation.current) setLoading(false);
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setError(error.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      ++generation.current;
      unsubscribe?.();
    };
  }, []);
  const loginWithGoogle = async () => {
    await authReady;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const code = String((error as { code?: string }).code || (error as Error).message);
      if (/api-key-not-valid|invalid-api-key/i.test(code))
        throw new Error(
          'A chave do Firebase publicada no site é inválida. Confira VITE_FIREBASE_API_KEY na Vercel e faça um novo deploy.',
        );
      if (/unauthorized-domain/i.test(code))
        throw new Error(
          'Este domínio não está autorizado no Firebase Authentication. Adicione www.talke.club aos domínios autorizados.',
        );
      if (/operation-not-allowed/i.test(code))
        throw new Error('O login com Google não está ativado no Firebase Authentication.');
      if (/popup-blocked/i.test(code))
        throw new Error(
          'O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.',
        );
      throw error;
    }
  };
  const logout = async () => {
    ++generation.current;
    setSession(null);
    setUser(null);
    await signOut(auth);
  };
  return (
    <Context.Provider
      value={{
        firebaseUser,
        session,
        loadingAuth,
        authError,
        loginWithGoogle,
        logout,
        refreshProfiles,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error('AuthProvider obrigatório');
  return context;
}
