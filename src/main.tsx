import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import './index.css';

// Register Service Worker for full offline availability of catalog and featured info
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Periodically check for Service Worker updates when online
      setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          void registration.update();
        }
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.warn('Service Worker registration warning:', error);
  },
});

// Google Maps Case A global quota defense (must be at module root before React render)
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseAuthProvider>
        <App />
      </FirebaseAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
