import { useState, useCallback, useEffect } from 'react';
import {
  DEFAULT_ADMIN_PIN,
  getAdminPinSync,
  loadAdminPinFromStorage,
  saveAdminPinToStorage,
} from '../utils/persistentDB';

export const ADMIN_SECURITY_PIN = DEFAULT_ADMIN_PIN;

export function useAdminAuth() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionTitle, setAuthActionTitle] = useState('Gerir Catálogo');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
  const [currentPin, setCurrentPin] = useState<string>(() => getAdminPinSync());

  // Strict PIN Requirement: Always ask for PIN upon every entry/action
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    loadAdminPinFromStorage().then((pin) => {
      if (active) setCurrentPin(pin);
    });
    return () => {
      active = false;
    };
  }, []);

  const checkOrPromptAuth = useCallback((actionTitle: string, onAuthorized: () => void) => {
    if (isAuthenticated) {
      onAuthorized();
      return;
    }

    setAuthActionTitle(actionTitle);
    setPendingCallback(() => onAuthorized);
    setIsAuthModalOpen(true);
  }, [isAuthenticated]);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  const handleCloseAuth = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingCallback(null);
  }, []);

  const lockAdminSession = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const verifyPin = useCallback(
    async (candidate: string): Promise<boolean> => {
      const latestPin = await loadAdminPinFromStorage();
      setCurrentPin(latestPin);
      return candidate === latestPin;
    },
    []
  );

  const changeAdminPin = useCallback(
    async (oldPin: string, newPin: string): Promise<{ ok: boolean; error?: string }> => {
      const latestPin = await loadAdminPinFromStorage();
      if (oldPin !== latestPin) {
        return { ok: false, error: 'O PIN atual está incorreto.' };
      }
      if (!/^\d{4}$/.test(newPin)) {
        return { ok: false, error: 'O novo PIN deve ter exatamente 4 dígitos numéricos.' };
      }
      const saved = await saveAdminPinToStorage(newPin);
      if (!saved) {
        return { ok: false, error: 'Não foi possível guardar o novo PIN.' };
      }
      setCurrentPin(newPin);
      return { ok: true };
    },
    []
  );

  return {
    isAuthenticated,
    isAuthModalOpen,
    authActionTitle,
    currentPin,
    checkOrPromptAuth,
    handleAuthSuccess,
    handleCloseAuth,
    lockAdminSession,
    verifyPin,
    changeAdminPin,
  };
}

