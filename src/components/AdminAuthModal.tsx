import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

export const ADMIN_SECURITY_PIN = '4029';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Gerir Catálogo / Edição de Produtos',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMessage('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (codeToTest: string) => {
    if (codeToTest === ADMIN_SECURITY_PIN) {
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
      setErrorMessage('Código PIN incorreto. Tente novamente.');
      setPin('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify(pin);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        handleVerify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full my-auto z-10 overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/50">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Outfit'] text-white">
                Acesso de Gestão (PIN)
              </h3>
              <p className="text-xs text-stone-400">
                Área restrita à administração
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-full text-xs font-bold mb-2">
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
              <span>Código de Segurança Requerido</span>
            </div>
            <p className="text-xs text-stone-600 font-medium">
              Insira o código PIN de 4 dígitos para autorizar:
            </p>
            <p className="text-xs font-bold text-emerald-800 mt-0.5">
              {actionTitle}
            </p>
          </div>

          {/* Hidden Input for Keyboard Typing */}
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(val);
              setError(false);
              if (val.length === 4) {
                handleVerify(val);
              }
            }}
            onKeyDown={handleKeyDown}
            className="opacity-0 absolute -z-10"
            autoFocus
          />

          {/* PIN Indicators Display */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="flex justify-center items-center gap-3 mb-4 cursor-pointer"
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-12 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${
                    error
                      ? 'border-2 border-red-500 bg-red-50 text-red-700'
                      : isFilled
                      ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 scale-105 shadow-sm'
                      : 'border-2 border-stone-200 bg-stone-50 text-stone-400'
                  }`}
                >
                  {isFilled ? '•' : ''}
                </div>
              );
            })}
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 font-bold mb-4 bg-red-50 p-2 rounded-xl border border-red-100 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage || 'Código incorreto'}</span>
            </div>
          )}

          {/* Numeric Keypad for Touch / Mouse Click */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="h-11 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-emerald-600 active:text-white text-stone-900 font-bold text-lg font-['Outfit'] transition-colors"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-500 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-11 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-emerald-600 active:text-white text-stone-900 font-bold text-lg font-['Outfit'] transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors"
              title="Apagar dígito"
            >
              ⌫
            </button>
          </div>

          {/* Manual Submit Button (for full form support) */}
          <button
            type="button"
            onClick={() => handleVerify(pin)}
            disabled={pin.length !== 4}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              pin.length === 4
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-[0.98]'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Código de Acesso</span>
          </button>
        </div>
      </div>
    </div>
  );
};
