import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_EMAIL } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseAuthContextValue {
  user: User | null;
  isAuthReady: boolean;
  isCloudAdmin: boolean;
  authError: string | null;
  unauthorizedDomainHost: string | null;
  firebaseProjectId: string;
  isSigningIn: boolean;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<{ ok: boolean; isAdmin: boolean; error?: string }>;
  signOutCloud: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue>({
  user: null,
  isAuthReady: false,
  isCloudAdmin: false,
  authError: null,
  unauthorizedDomainHost: null,
  firebaseProjectId: firebaseConfig.projectId,
  isSigningIn: false,
  clearAuthError: () => undefined,
  signInWithGoogle: async () => ({ ok: false, isAdmin: false }),
  signOutCloud: async () => undefined,
});

async function checkIsAdminUser(firebaseUser: User | null): Promise<boolean> {
  if (!firebaseUser || !firebaseUser.emailVerified) return false;
  if (firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', firebaseUser.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCloudAdmin, setIsCloudAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomainHost, setUnauthorizedDomainHost] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      const adminOk = await checkIsAdminUser(firebaseUser);
      setIsCloudAdmin(adminOk);
      if (adminOk) {
        setUnauthorizedDomainHost(null);
        setAuthError(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setUnauthorizedDomainHost(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    setAuthError(null);
    setUnauthorizedDomainHost(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const adminOk = await checkIsAdminUser(result.user);
      setIsCloudAdmin(adminOk);
      if (!adminOk) {
        const msg = `A conta "${result.user.email || ''}" não tem permissão de administrador. Entre com ${ADMIN_EMAIL}.`;
        setAuthError(msg);
        return { ok: true, isAdmin: false, error: msg };
      }
      return { ok: true, isAdmin: true };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      let friendlyMsg = 'Não foi possível iniciar sessão com o Google.';
      if (code === 'auth/popup-closed-by-user') {
        friendlyMsg = 'A janela de login Google foi fechada antes de concluir.';
      } else if (code === 'auth/popup-blocked') {
        friendlyMsg = 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.';
      } else if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomainHost(host || 'raffa-aliados-do-campo-lda.vercel.app');
        friendlyMsg = `O domínio "${host}" precisa de ser autorizado 1 única vez no Firebase Console.`;
      } else if (err instanceof Error && err.message) {
        friendlyMsg = err.message;
      }
      setAuthError(friendlyMsg);
      return { ok: false, isAdmin: false, error: friendlyMsg };
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOutCloud = useCallback(async () => {
    await signOut(auth);
    setIsCloudAdmin(false);
    setAuthError(null);
    setUnauthorizedDomainHost(null);
  }, []);

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        isAuthReady,
        isCloudAdmin,
        authError,
        unauthorizedDomainHost,
        firebaseProjectId: firebaseConfig.projectId,
        isSigningIn,
        clearAuthError,
        signInWithGoogle,
        signOutCloud,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}
