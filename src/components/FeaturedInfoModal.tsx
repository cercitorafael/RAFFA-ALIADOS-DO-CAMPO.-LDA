import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Upload, 
  AlertCircle, 
  Megaphone,
  Tag, 
  FileText, 
  Image as ImageIcon,
  MessageCircle,
  Clock,
  Eye,
  Layers
} from 'lucide-react';
import { FeaturedInfoItem } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';

interface FeaturedInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (infoData: Omit<FeaturedInfoItem, 'id' | 'createdAt'> & { id?: string }) => void | Promise<void>;
  initialInfo?: FeaturedInfoItem | null;
}

const CATEGORY_OPTIONS: { value: FeaturedInfoItem['category']; label: string }[] = [
  { value: 'sementes', label: '🌾 Chegada de Sementes & Variedades' },
  { value: 'campanha', label: '🌱 Campanha Agrícola da Época' },
  { value: 'alerta', label: '⚠️ Alerta Fitossanitário & Maneio de Pragas' },
  { value: 'comunicado', label: '📢 Comunicado Oficial aos Produtores' },
  { value: 'preco', label: '💰 Preço Especial & Condições de Pagamento' },
  { value: 'geral', label: 'ℹ️ Informação Geral & Horários' },
];

const STYLE_OPTIONS = [
  { value: 'emerald', label: 'Verde Campo (Padrão Agrícola)', color: 'bg-emerald-700 text-white' },
  { value: 'amber', label: 'Dourado / Âmbar (Destaque Principal)', color: 'bg-amber-500 text-stone-950' },
  { value: 'red', label: 'Vermelho / Coral (Alerta Técnico)', color: 'bg-red-600 text-white' },
  { value: 'blue', label: 'Azul Institucional (Informativo)', color: 'bg-sky-600 text-white' },
];

export const FeaturedInfoModal: React.FC<FeaturedInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInfo,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FeaturedInfoItem['category']>('campanha');
  const [badgeText, setBadgeText] = useState('⭐ Destaque');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [highlightStyle, setHighlightStyle] = useState<FeaturedInfoItem['highlightStyle']>('amber');
  const [actionType, setActionType] = useState<FeaturedInfoItem['actionType']>('whatsapp');
  const [actionText, setActionText] = useState('Saber Mais no WhatsApp');
  const [actionUrlOrMessage, setActionUrlOrMessage] = useState('Olá Raffa Aliados do Campo, vi esta informação em destaque e gostaria de saber mais.');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [dateText, setDateText] = useState('Campanha Atual');
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialInfo;

  useEffect(() => {
    if (initialInfo) {
      setTitle(initialInfo.title || '');
      setCategory(initialInfo.category || 'campanha');
      setBadgeText(initialInfo.badgeText || '⭐ Destaque');
      setSummary(initialInfo.summary || '');
      setDetails(initialInfo.details || '');
      setHighlightStyle(initialInfo.highlightStyle || 'amber');
      setActionType(initialInfo.actionType || 'whatsapp');
      setActionText(initialInfo.actionText || 'Saber Mais no WhatsApp');
      setActionUrlOrMessage(initialInfo.actionUrlOrMessage || '');
      setImageUrl(initialInfo.imageUrl || '');
      setIsActive(initialInfo.isActive !== false);
      setDateText(initialInfo.dateText || 'Campanha Atual');
    } else {
      setTitle('');
      setCategory('campanha');
      setBadgeText('⭐ Destaque da Campanha');
      setSummary('');
      setDetails('');
      setHighlightStyle('amber');
      setActionType('whatsapp');
      setActionText('Consultar no WhatsApp');
      setActionUrlOrMessage('Olá Raffa Aliados do Campo, gostaria de informações sobre o comunicado em destaque.');
      setImageUrl('https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80');
      setIsActive(true);
      setDateText('Campanha Agrícola ' + new Date().getFullYear());
    }
  }, [initialInfo, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Por favor selecione uma imagem válida.');
      return;
    }

    try {
      const optimized = await optimizeImage(file, 1000, 1000, 0.82);
      setImageUrl(optimized);
      setImageError('');
    } catch (err) {
      console.warn('Erro ao otimizar imagem da informação:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor insira um título para a informação.');
      return;
    }
    if (!summary.trim()) {
      alert('Por favor insira o resumo / texto principal da informação.');
      return;
    }

    setIsSaving(true);
    try {
      const categoryObj = CATEGORY_OPTIONS.find((c) => c.value === category);
      const categoryLabel = categoryObj ? categoryObj.label.split(' ')[1] || categoryObj.label : 'Comunicado';

      await onSave({
        ...(initialInfo?.id ? { id: initialInfo.id } : {}),
        title: title.trim(),
        category,
        categoryLabel,
        badgeText: badgeText.trim() || undefined,
        summary: summary.trim(),
        details: details.trim() || undefined,
        highlightStyle,
        actionType,
        actionText: actionText.trim() || undefined,
        actionUrlOrMessage: actionUrlOrMessage.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        isActive,
        dateText: dateText.trim() || undefined,
        priorityOrder: initialInfo?.priorityOrder || 1,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao guardar informação:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950 px-6 py-5 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-['Outfit'] tracking-tight flex items-center gap-2">
                {isEditing ? 'Editar Informação em Destaque' : 'Adicionar Nova Informação ao Destaque'}
              </h2>
              <p className="text-stone-300 text-xs mt-0.5">
                Esta informação será exibida com destaque imediato na página inicial para os produtores.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* CRITICAL TOGGLE: Exibir no Destaque */}
          <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-stone-950" />
              </div>
              <div>
                <span className="font-extrabold text-stone-900 text-sm block">
                  Exibir esta Informação no Destaque da Página Principal
                </span>
                <span className="text-stone-600 text-xs block mt-0.5">
                  Quando ativo, este comunicado aparece imediatamente no quadro de novidades e avisos em destaque da Raffa Aliados do Campo.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Form Fields: Título & Categoria */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                Título da Informação em Destaque *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Chegada de Sementes Certificadas Matuba & Pan 53"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-semibold text-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" />
                  Categoria do Comunicado
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeaturedInfoItem['category'])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs font-medium text-stone-900 bg-white"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Texto do Selo / Distintivo
                </label>
                <input
                  type="text"
                  placeholder="Ex: ⭐ Destaque da Campanha / ⚠️ Alerta"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs font-semibold text-stone-900"
                />
              </div>
            </div>

            {/* Estilo Visual & Data/Validade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  Estilo Visual do Destaque
                </label>
                <select
                  value={highlightStyle}
                  onChange={(e) => setHighlightStyle(e.target.value as FeaturedInfoItem['highlightStyle'])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs font-medium text-stone-900 bg-white"
                >
                  {STYLE_OPTIONS.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Data de Referência / Época
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campanha 2024 / 2025"
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Resumo da Informação (Principal) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Resumo da Informação (Visível no cartão de destaque) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Insira as principais informações que quer destacar para os clientes..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm text-stone-900 leading-relaxed"
              />
            </div>

            {/* Detalhes Opcionais Adicionais */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Detalhes & Recomendações Técnicas Adicionais (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Instruções agronómicas, variedades incluídas, horários ou recomendações de aplicação..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs text-stone-800 leading-relaxed"
              />
            </div>

            {/* Imagem da Informação */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                Imagem / Foto da Informação
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  placeholder="URL da imagem (Ex: https://images.unsplash.com/...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full sm:flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono text-stone-800"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-600" />
                  <span>Subir Foto</span>
                </button>
              </div>
              {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
            </div>

            {/* Botão de Ação (WhatsApp / Cotação) */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                Ação Rápida do Produtor ao Clicar
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Tipo de Ação</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as FeaturedInfoItem['actionType'])}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium bg-white"
                  >
                    <option value="whatsapp">Abrir Conversa de WhatsApp Directa</option>
                    <option value="quote">Abrir Modal de Cotação de Preços</option>
                    <option value="none">Apenas Informativo (Sem botão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    placeholder="Ex: Saber Mais no WhatsApp"
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              {actionType === 'whatsapp' && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Mensagem Pré-configurada de WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Olá Raffa Aliados do Campo, vi a informação sobre sementes..."
                    value={actionUrlOrMessage}
                    onChange={(e) => setActionUrlOrMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium"
                  />
                </div>
              )}
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs sm:text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>A Guardar...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Publicar no Destaque'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
