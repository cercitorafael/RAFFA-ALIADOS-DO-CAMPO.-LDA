import { useState, useCallback } from 'react';

export const ADMIN_SECURITY_PIN = '4029';

export function useAdminAuth() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionTitle, setAuthActionTitle] = useState('Gerir Catálogo');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Strict PIN Requirement: Always ask for PIN upon every entry/action
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const checkOrPromptAuth = useCallback((actionTitle: string, onAuthorized: () => void) => {
    // If user is currently actively within an authenticated session state
    if (isAuthenticated) {
      onAuthorized();
      return;
    }

    // Always prompt for PIN 4029 when entering or executing admin tasks
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

  // Strict Lock / Logout whenever the user closes the admin panel or leaves
  const lockAdminSession = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isAuthModalOpen,
    authActionTitle,
    checkOrPromptAuth,
    handleAuthSuccess,
    handleCloseAuth,
    lockAdminSession,
  };
}

