import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole, Student, Teacher } from '../domain/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isAdmin: boolean;
  studentProfile: Student | null;
  teacherProfile: Teacher | null;
  loadingAuth: boolean;
  loginWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setDemoUser: (role: UserRole, student?: Student | null, teacher?: Teacher | null) => void;
  refreshProfiles: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configured admin email from project context
const ADMIN_EMAILS = [
  'jonathan.oliveira.da@gmail.com',
  'admin@talke.com',
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Student);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Fetch or sync user profile in Firestore
  const syncUserProfile = async (user: FirebaseUser) => {
    try {
      const email = user.email?.toLowerCase() || '';
      const checkIsAdmin = ADMIN_EMAILS.some((adm) => adm.toLowerCase() === email);
      setIsAdmin(checkIsAdmin);

      // Check if student exists
      const studentDocRef = doc(db, 'students', user.uid);
      const studentSnap = await getDoc(studentDocRef);

      // Check if teacher exists
      const teacherDocRef = doc(db, 'teachers', user.uid);
      const teacherSnap = await getDoc(teacherDocRef);

      if (teacherSnap.exists()) {
        const tData = teacherSnap.data() as Teacher;
        setTeacherProfile(tData);
        if (!checkIsAdmin) {
          setCurrentRole(UserRole.Teacher);
        }
      }

      if (studentSnap.exists()) {
        const sData = studentSnap.data() as Student;
        setStudentProfile(sData);
        if (!teacherSnap.exists() && !checkIsAdmin) {
          setCurrentRole(UserRole.Student);
        }
      } else if (!teacherSnap.exists()) {
        // Auto-provision initial student profile for new Google user with pilot starter balance
        const newStudent: Student = {
          id: user.uid,
          name: user.displayName || email.split('@')[0] || 'Aluno Talkê',
          email: email,
          avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.uid)}`,
          hasCompletedDiagnostic: false,
          walletBalanceBrl: 300.0, // Pilot test starter balance
          totalLessonsCompleted: 0,
          createdAt: new Date().toISOString(),
        };
        await setDoc(studentDocRef, newStudent, { merge: true });
        setStudentProfile(newStudent);
        if (!checkIsAdmin) {
          setCurrentRole(UserRole.Student);
        }
      }

      if (checkIsAdmin) {
        // Admin default view
        setCurrentRole(UserRole.Admin);
      }
    } catch (err) {
      console.warn('[Auth] Error syncing user profile from Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setIsAdmin(false);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (preferredRole?: UserRole) => {
    try {
      setLoadingAuth(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setFirebaseUser(result.user);
        if (preferredRole) {
          setCurrentRole(preferredRole);
        }
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      console.error('[Auth] Error signing in with Google:', err);
      // If popup blocked or cancelled, let the user know
      if (err.code !== 'auth/popup-closed-by-user') {
        alert('Não foi possível concluir o login com o Google. Verifique se popups estão permitidos.');
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setFirebaseUser(null);
      setStudentProfile(null);
      setTeacherProfile(null);
      setIsAdmin(false);
      setCurrentRole(UserRole.Student);
    } catch (err) {
      console.error('[Auth] Error signing out:', err);
    }
  };

  const setDemoUser = (role: UserRole, student?: Student | null, teacher?: Teacher | null) => {
    setCurrentRole(role);
    if (student) setStudentProfile(student);
    if (teacher) setTeacherProfile(teacher);
  };

  const refreshProfiles = async () => {
    if (firebaseUser) {
      await syncUserProfile(firebaseUser);
    }
  };

  // Helper to attach authorization headers to backend fetch calls
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-user-id'] = firebaseUser.uid;
        headers['x-user-email'] = firebaseUser.email || '';
      } catch (err) {
        console.warn('[Auth] Could not get ID token:', err);
      }
    } else {
      // Demo / fallback local user for seamless testing
      if (currentRole === UserRole.Student && studentProfile) {
        headers['x-user-id'] = studentProfile.id;
        headers['x-user-email'] = studentProfile.email;
      } else if (currentRole === UserRole.Teacher && teacherProfile) {
        headers['x-user-id'] = teacherProfile.id;
        headers['x-user-email'] = teacherProfile.email;
      }
    }

    headers['x-user-role'] = currentRole;
    if (isAdmin) {
      headers['x-is-admin'] = 'true';
    }

    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentRole,
        setCurrentRole,
        isAdmin,
        studentProfile,
        teacherProfile,
        loadingAuth,
        loginWithGoogle,
        logout,
        setDemoUser,
        refreshProfiles,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  firebaseUser: null,
  currentRole: UserRole.Student,
  setCurrentRole: () => {},
  isAdmin: false,
  studentProfile: null,
  teacherProfile: null,
  loadingAuth: false,
  loginWithGoogle: async () => {},
  logout: async () => {},
  setDemoUser: () => {},
  refreshProfiles: async () => {},
  getAuthHeaders: async () => ({}),
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};
