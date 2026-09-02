import React from 'react';
import { 
  X, 
  Sprout, 
  Check, 
  MessageCircle, 
  Clock, 
  Scale, 
  Maximize2, 
  Award, 
  PackageCheck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { ProductItem } from '../types';
import { COMPANY_INFO } from '../data/agroData';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onOpenQuote: (productName: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  onClose,
  onOpenQuote 
}) => {
  if (!product) return null;

  const whatsappMessage = encodeURIComponent(
    `Olá Raffa Aliados do Campo, tenho interesse na semente/produto "${product.name}". Gostaria de saber preço e disponibilidade em Namiconha - Ribaué.`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 text-stone-900 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-product-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white flex items-center justify-center transition-colors"
          aria-label="Fechar janela"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image & Header */}
        <div className="relative w-full overflow-hidden bg-stone-100">
          <div className="h-64 sm:h-72 w-full overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="p-6 pb-2 bg-gradient-to-b from-transparent to-white/90">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                {product.categoryLabel}
              </span>
              {product.badge && (
                <span className="inline-block text-xs font-black uppercase tracking-wider text-stone-900 bg-amber-400 px-3 py-1 rounded-full">
                  {product.badge}
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit']">
              {product.name}
            </h3>
            <p className="text-emerald-700 text-sm font-semibold mt-1">
              {product.tagline}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Descrição Agronómica
            </h4>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Available Varieties */}
          {product.varieties && product.varieties.length > 0 && (
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2.5 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-700" />
                Variedades & Cultivares Disponíveis
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.varieties.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-emerald-950 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Specs Grid */}
          {product.specs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {product.specs.cycleDays && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-stone-500 font-medium">Ciclo Vegetativo</div>
                    <div className="text-sm font-bold text-stone-900">{product.specs.cycleDays}</div>
                  </div>
                </div>
              )}

              {product.specs.seedRatePerHa && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-start gap-3">
                  <Scale className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-stone-500 font-medium">Densidade Recomendada</div>
                    <div className="text-sm font-bold text-stone-900">{product.specs.seedRatePerHa}</div>
                  </div>
                </div>
              )}

              {product.specs.recommendedSpacing && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-start gap-3">
                  <Maximize2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-stone-500 font-medium">Compasso de Sementeira</div>
                    <div className="text-sm font-bold text-stone-900">{product.specs.recommendedSpacing}</div>
                  </div>
                </div>
              )}

              {product.specs.potentialYield && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-stone-500 font-medium">Potencial Produtivo</div>
                    <div className="text-sm font-bold text-stone-900">{product.specs.potentialYield}</div>
                  </div>
                </div>
              )}

              {product.specs.packaging && (
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 flex items-start gap-3 sm:col-span-2">
                  <PackageCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-stone-500 font-medium">Embalagens / Apresentação</div>
                    <div className="text-sm font-bold text-stone-900">{product.specs.packaging}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quality Notice */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs sm:text-sm">
            <Award className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              Todas as sementes fornecidas pela Raffa Aliados do Campo passam por controle rigoroso de pureza e germinação em Namiconha - Ribaué.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            id="modal-direct-whatsapp-btn"
            href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Pedir Preço no WhatsApp</span>
          </a>

          <button
            id="modal-request-quote-form-btn"
            onClick={() => {
              onClose();
              onOpenQuote(product.name);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all"
          >
            <span>Solicitar Orçamento Formal</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
