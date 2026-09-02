import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Check, 
  Trash2, 
  AlertCircle,
  Eye,
  Maximize2,
  Sun,
  Moon,
  Grid,
  Sparkles
} from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';
import { OfficialRaffaEmblem } from './OfficialRaffaEmblem';

interface LogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string | null;
  onSaveLogo: (logoUrl: string) => void | Promise<any>;
  onResetLogo: () => void | Promise<any>;
}

export const LogoEditorModal: React.FC<LogoEditorModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  onSaveLogo,
  onResetLogo,
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo);
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [previewBg, setPreviewBg] = useState<'white' | 'dark' | 'green' | 'grid'>('white');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor seleccione um ficheiro de imagem válido (PNG, JPG, SVG, WEBP).');
      return;
    }

    setErrorMsg('');
    try {
      const optimized = await optimizeImage(file, 800, 800, 0.88);
      setLogoPreview(optimized);
    } catch (err) {
      console.warn('Erro ao processar imagem:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Por favor insira o link da imagem.');
      return;
    }
    setErrorMsg('');
    setLogoPreview(urlInput.trim());
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      if (logoPreview) {
        await onSaveLogo(logoPreview);
      } else {
        await onResetLogo();
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Erro ao gravar logótipo:', err);
      setErrorMsg('Ocorreu um erro ao guardar as alterações. Por favor tente novamente.');
      setIsSaving(false);
    }
  };

  const bgStyles = {
    white: 'bg-white border-stone-200',
    dark: 'bg-stone-900 border-stone-800 text-white',
    green: 'bg-emerald-950 border-emerald-800 text-white',
    grid: 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-stone-100 border-stone-300'
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden border border-stone-300 flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg font-['Outfit'] tracking-tight">
                  Visualização & Alteração do Logótipo
                </h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Ecrã Grande
                </span>
              </div>
              <p className="text-xs text-emerald-300">
                RAFFA Aliados do Campo • Ribaué, Nampula
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Large 2-column or expansive layout */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50/50">
          
          {/* Main Visualizer Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left/Center: Large HD Visualizer Box */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  Ecrã de Visualização em Alta Resolução:
                </span>

                {/* Background Toggles */}
                <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewBg('white')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      previewBg === 'white' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="Fundo Claro"
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('dark')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      previewBg === 'dark' ? 'bg-stone-900 shadow-xs text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="Fundo Escuro"
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('green')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      previewBg === 'green' ? 'bg-emerald-900 shadow-xs text-emerald-100 font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="Fundo Verde Oficial"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('grid')}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      previewBg === 'grid' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                    title="Fundo Transparente / Grelha"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Large Display Canvas */}
              <div className={`w-full h-72 sm:h-84 rounded-2xl border-2 shadow-inner flex items-center justify-center p-6 relative overflow-hidden transition-colors ${bgStyles[previewBg]}`}>
                <div className="w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logótipo RAFFA"
                      className="max-w-full max-h-full object-contain drop-shadow-md transition-transform hover:scale-105"
                      onError={() => setErrorMsg('Não foi possível carregar a imagem deste link.')}
                    />
                  ) : (
                    <OfficialRaffaEmblem className="w-full h-full drop-shadow-md hover:scale-105 transition-transform" />
                  )}
                </div>
              </div>

              {/* Application Context Preview */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Exemplo de Aplicação no Cabeçalho do Site:
                </span>
                <div className="flex items-center gap-3 bg-stone-900 text-white p-3 rounded-xl border border-stone-800">
                  <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/20">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <OfficialRaffaEmblem className="w-full h-full" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-black tracking-tight text-white font-['Outfit'] leading-none">
                      RAFFA
                    </div>
                    <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
                      Aliados do Campo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Controls, Upload & URL Options */}
            <div className="lg:col-span-5 space-y-5">
              
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Opções de Alteração
                </div>

                {/* Mode Selector */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Carregar Ficheiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'url'
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Link da Imagem
                  </button>
                </div>

                {/* Upload Box */}
                {activeTab === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-500 hover:border-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 p-6 rounded-2xl cursor-pointer text-center transition-all group"
                    >
                      <Upload className="w-9 h-9 text-emerald-700 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-sm font-bold text-emerald-950">
                        Carregar nova foto do Logótipo
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        Formatos: PNG, JPG, SVG, WEBP
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-700">
                      Endereço Web (URL) da Imagem
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://exemplo.com/logo-raffa.png"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="text-xs text-red-600 font-medium flex items-center gap-1.5 p-2 bg-red-50 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Reset button if custom logo exists */}
                {logoPreview && (
                  <div className="pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setLogoPreview(null)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Restaurar emblema oficial original
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <span className="font-bold block mb-1">Dica de Visualização:</span>
                O logótipo configurado aqui será aplicado instantaneamente em todo o cabeçalho, rodapé e documentos de cotação da RAFFA Aliados do Campo.
              </div>

            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-white px-6 py-4 border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  A Guardar Alterações...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Alterações Guardadas!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Guardar e Aplicar
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
