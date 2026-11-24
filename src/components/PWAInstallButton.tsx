import React, { useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide when already running as an installed standalone app
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-700/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold transition-all cursor-pointer ${
          compact ? 'px-3 py-2 text-xs w-full' : 'px-3 py-2 text-xs'
        }`}
        title="Instalar aplicação para usar offline"
      >
        <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span>Instalar App Offline</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold transition-colors cursor-pointer ${
            compact ? 'px-3 py-2 text-xs w-full' : 'px-3 py-2 text-xs'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold font-['Outfit'] text-stone-900">
                  Instalar Raffa Agro no iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed space-y-2">
                <span className="flex items-center gap-1.5">
                  1. Toque no botão <Share className="w-4 h-4 text-emerald-700 inline" /> <strong>Partilhar</strong> no Safari.
                </span>
                <span className="block">
                  2. Desça e toque em <strong>Adicionar ao Ecrã Principal</strong> para aceder ao catálogo mesmo offline.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-bold text-white transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
