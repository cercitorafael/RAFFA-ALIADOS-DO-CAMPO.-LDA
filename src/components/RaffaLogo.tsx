import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useBrandConfig } from '../hooks/useBrandConfig';
import { LogoEditorModal } from './LogoEditorModal';
import { OfficialRaffaEmblem } from './OfficialRaffaEmblem';
import { AdminAuthModal } from './AdminAuthModal';

interface RaffaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark' | 'color';
  className?: string;
  allowEdit?: boolean;
}

export const RaffaLogo: React.FC<RaffaLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'color',
  className = '',
  allowEdit = true,
}) => {
  const { logoImage, updateLogo, removeCustomLogo } = useBrandConfig();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const sizeMap = {
    sm: {
      emblem: 'w-10 h-10',
      customBox: 'h-10 w-auto max-w-[140px]',
      title: 'text-base',
      sub: 'text-[9px]',
    },
    md: {
      emblem: 'w-12 h-12 sm:w-14 sm:h-14',
      customBox: 'h-12 sm:h-14 w-auto max-w-[180px]',
      title: 'text-lg sm:text-xl',
      sub: 'text-[10px]',
    },
    lg: {
      emblem: 'w-18 h-18 sm:w-20 sm:h-20',
      customBox: 'h-16 sm:h-20 w-auto max-w-[240px]',
      title: 'text-2xl',
      sub: 'text-xs',
    },
    xl: {
      emblem: 'w-28 h-28',
      customBox: 'h-24 sm:h-28 w-auto max-w-[300px]',
      title: 'text-3xl',
      sub: 'text-sm',
    },
  };

  const currentSize = sizeMap[size];

  const handleLogoClick = (e: React.MouseEvent) => {
    if (allowEdit) {
      e.preventDefault();
      e.stopPropagation();
      setIsAuthOpen(true);
    }
  };

  return (
    <>
      <div className={`inline-flex items-center gap-3 ${className}`}>
        {/* Emblem or Custom Image with Click-to-Edit */}
        <div
          className={`relative ${logoImage ? currentSize.customBox : currentSize.emblem} shrink-0 group flex items-center justify-center ${allowEdit ? 'cursor-pointer' : ''}`}
          onClick={handleLogoClick}
          title={allowEdit ? 'Logótipo Oficial RAFFA Aliados do Campo (Requer PIN para alterar)' : undefined}
        >
          {logoImage ? (
            /* Custom Uploaded Image Logo: preserves exact original shape & aspect ratio without cropping */
            <img
              src={logoImage}
              alt="RAFFA Aliados do Campo"
              className="h-full w-auto max-w-full object-contain block"
            />
          ) : (
            /* Official High-Resolution Vector Emblem */
            <div className="w-full h-full rounded-2xl bg-white p-1 shadow-sm border border-stone-200/80 flex items-center justify-center transition-transform group-hover:scale-105">
              <OfficialRaffaEmblem className="w-full h-full drop-shadow-sm" />
            </div>
          )}

          {/* Quick Hover Edit Badge Icon */}
          {allowEdit && (
            <div className="absolute -bottom-1 -right-1 bg-stone-900/90 text-white rounded-full p-1 shadow-md border border-white opacity-0 group-hover:opacity-100 group-hover:scale-110 group-hover:bg-emerald-700 transition-all">
              <Camera className="w-2.5 h-2.5" />
            </div>
          )}
        </div>

        {/* Text Details */}
        {showText && (
          <div className="flex flex-col">
            <div className={`font-extrabold tracking-tight font-['Outfit'] leading-none ${
              theme === 'light' ? 'text-white' : 'text-stone-900'
            } ${currentSize.title}`}>
              RAFFA <span className="text-emerald-700 font-extrabold">Aliados do Campo</span>
            </div>
            <div className={`font-bold tracking-wider uppercase mt-1 ${
              theme === 'light' ? 'text-emerald-300' : 'text-emerald-800'
            } ${currentSize.sub}`}>
              Foco no Agro • Ganho no Campo
            </div>
          </div>
        )}
      </div>

      {/* Security Auth Modal for Logo Alteration */}
      <AdminAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          setIsEditorOpen(true);
        }}
        actionTitle="Alterar Logótipo da Empresa"
      />

      {/* Modal for editing / uploading logo */}
      {isEditorOpen && (
        <LogoEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          currentLogo={logoImage}
          onSaveLogo={(url) => updateLogo(url)}
          onResetLogo={() => removeCustomLogo()}
        />
      )}
    </>
  );
};

