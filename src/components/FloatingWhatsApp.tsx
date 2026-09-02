import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { COMPANY_INFO } from '../data/agroData';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip bubble */}
      {showTooltip && (
        <div className="bg-white text-stone-900 px-3.5 py-2 rounded-2xl shadow-xl border border-stone-200 text-xs font-semibold max-w-[200px] sm:max-w-[240px] flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>Precisa de sementes ou adubo? Fale connosco no WhatsApp!</span>
          <button 
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-stone-600 p-0.5"
            aria-label="Fechar dica"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Button */}
      <a
        id="floating-whatsapp-btn"
        href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=Olá%20Raffa%20Aliados%20do%20Campo,%20gostaria%20de%20consultar%20preços%20e%20disponibilidade`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/40 hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white"
        aria-label="Contactar Raffa Aliados do Campo pelo WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white/20" />
      </a>
    </div>
  );
};
