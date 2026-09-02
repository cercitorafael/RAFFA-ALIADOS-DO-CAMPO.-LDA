import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Mail, 
  Send, 
  CheckCircle2, 
  Sprout, 
  MapPin, 
  User, 
  Phone,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { COMPANY_INFO, PRODUCTS_DATA } from '../data/agroData';
import { QuoteFormData } from '../types';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: string;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ 
  isOpen, 
  onClose, 
  initialProduct = '' 
}) => {
  const [formData, setFormData] = useState<QuoteFormData>({
    name: '',
    phone: '',
    location: '',
    selectedCategory: 'Sementes',
    selectedProduct: '',
    areaOrQuantity: '',
    notes: ''
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setFormData((prev) => ({
        ...prev,
        selectedProduct: initialProduct,
      }));
    }
  }, [initialProduct]);

  if (!isOpen) return null;

  const categories = [
    'Sementes (Milho, Feijões, Arroz, Hortícolas, Gergelim)',
    'Fertilizantes (NPK 12-24-12, Ureia 46%, etc.)',
    'Agroquímicos & Defensivos',
    'Instrumentos e Equipamentos Agrícolas',
    'Prestação de Serviços & Assistência no Terreno',
    'Pacote Completo para Safra'
  ];

  const buildWhatsAppMessage = () => {
    return encodeURIComponent(
      `*PEDIDO DE ORÇAMENTO - RAFFA ALIADOS DO CAMPO*\n\n` +
      `👤 *Nome:* ${formData.name || 'Não informado'}\n` +
      `📱 *Contacto/WhatsApp:* ${formData.phone || 'Não informado'}\n` +
      `📍 *Localização:* ${formData.location || 'Ribaué / Nampula'}\n` +
      `📦 *Categoria:* ${formData.selectedCategory}\n` +
      `🌱 *Produto / Variedade:* ${formData.selectedProduct || 'Geral'}\n` +
      `📐 *Área ou Quantidade:* ${formData.areaOrQuantity || 'A definir'}\n` +
      `📝 *Observações:* ${formData.notes || 'Sem observações adicionais'}\n\n` +
      `_Enviado através do website oficial Raffa Aliados do Campo_`
    );
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = `https://wa.me/258${COMPANY_INFO.whatsapp}?text=${buildWhatsAppMessage()}`;
    window.open(url, '_blank');
    setSubmitted(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Solicitação de Orçamento - ${formData.name || 'Cliente'}`);
    const body = encodeURIComponent(
      `Nome: ${formData.name}\n` +
      `Telefone/WhatsApp: ${formData.phone}\n` +
      `Localização: ${formData.location}\n` +
      `Categoria: ${formData.selectedCategory}\n` +
      `Produto/Variedade: ${formData.selectedProduct}\n` +
      `Quantidade/Área: ${formData.areaOrQuantity}\n\n` +
      `Notas:\n${formData.notes}`
    );
    window.location.href = `mailto:${COMPANY_INFO.email}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      phone: '',
      location: '',
      selectedCategory: 'Sementes',
      selectedProduct: '',
      areaOrQuantity: '',
      notes: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 text-stone-900 relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 sm:p-7 relative">
          <button
            id="close-quote-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-600/40 px-3 py-0.5 rounded-full text-xs font-semibold text-emerald-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Atendimento Rápido em Ribaué
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-white">
            Solicitar Orçamento
          </h3>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Preencha os dados e receba resposta imediata com preços e disponibilidade em Namiconha - Ribaué.
          </p>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-bold text-stone-900 font-['Outfit']">
              Pedido Encaminhado com Sucesso!
            </h4>
            <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
              O seu pedido foi preparado para a nossa equipa comercial da <strong>Raffa Aliados do Campo</strong>. Se abriu o WhatsApp, basta clicar em enviar mensagem para receber a resposta imediata!
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleReset}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form className="p-6 sm:p-7 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Seu Nome ou Associação: *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="quote-input-name"
                    type="text"
                    required
                    placeholder="Ex: João Silvestre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Telefone / WhatsApp: *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="quote-input-phone"
                    type="tel"
                    required
                    placeholder="Ex: 870095149 ou 848361130"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Location & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Localidade / Distrito:
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="quote-input-location"
                    type="text"
                    placeholder="Ex: Namiconha, Ribaué, Malema..."
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Categoria Principal:
                </label>
                <select
                  id="quote-select-category"
                  value={formData.selectedCategory}
                  onChange={(e) => setFormData({ ...formData, selectedCategory: e.target.value })}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Produto ou Semente Desejada:
                </label>
                <div className="relative">
                  <Sprout className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="quote-input-product"
                    type="text"
                    placeholder="Ex: Milho PAN 53 / Feijão Boer"
                    value={formData.selectedProduct}
                    onChange={(e) => setFormData({ ...formData, selectedProduct: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Quantidade / Área em Hectares:
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="quote-input-quantity"
                    type="text"
                    placeholder="Ex: 5 sacos de 25kg ou 2 hectares"
                    value={formData.areaOrQuantity}
                    onChange={(e) => setFormData({ ...formData, areaOrQuantity: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Outras Necessidades ou Dúvidas:
              </label>
              <textarea
                id="quote-input-notes"
                rows={2}
                placeholder="Ex: Preciso também de adubo NPK de fundo e insecticida para lagarta."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none resize-none"
              />
            </div>

            {/* Submit buttons */}
            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
              <button
                id="quote-submit-whatsapp-btn"
                type="button"
                onClick={handleWhatsAppSubmit}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar via WhatsApp ({COMPANY_INFO.whatsapp})</span>
              </button>

              <button
                id="quote-submit-email-btn"
                type="button"
                onClick={handleEmailSubmit}
                className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar por Email</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
