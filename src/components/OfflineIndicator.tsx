import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[180] flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-stone-950 shadow-xl border border-amber-300">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Modo Offline — Catálogo e destaques disponíveis</span>
    </div>
  );
};
