import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  TrendingUp,
  ShoppingCart,
  ZoomIn
} from 'lucide-react';
import { ProductItem } from '../types';
import { COMPANY_INFO } from '../data/agroData';
import { formatMzn } from './CartDrawerModal';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onOpenQuote: (productName: string) => void;
  onAddToCart?: (product: ProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  product, 
  onClose,
  onOpenQuote,
  onAddToCart,
}) => {
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  useEffect(() => {
    setIsImageFullscreen(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isImageFullscreen) {
          setIsImageFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, isImageFullscreen, onClose]);

  if (!product) return null;

  const whatsappMessage = encodeURIComponent(
    `Olá Raffa Aliados do Campo, tenho interesse na semente/produto "${product.name}". Gostaria de saber preço e disponibilidade em Namiconha - Ribaué.`
  );

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[9995] bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 text-stone-900 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Always-visible Close Button */}
          <button
            id="close-product-modal-btn"
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-lg border border-stone-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable Body including full uncropped image */}
          <div className="flex-1 overflow-y-auto">
            {/* Full Uncropped Product Image Area */}
            <div className="relative w-full bg-stone-100 border-b border-stone-200 flex items-center justify-center p-3 sm:p-5">
              <img
                src={product.image}
                alt={product.name}
                onClick={() => setIsImageFullscreen(true)}
                className="max-h-[52vh] w-auto max-w-full object-contain rounded-xl shadow-sm cursor-zoom-in transition-transform duration-200 hover:scale-[1.01]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => setIsImageFullscreen(true)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-stone-900/80 hover:bg-stone-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md transition-colors cursor-pointer"
                title="Ampliar imagem completa"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Ampliar</span>
              </button>
            </div>

            {/* Product Header Info */}
            <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-stone-100 bg-white">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
                  {product.categoryLabel}
                </span>
                {product.badge && (
                  <span className="inline-block text-xs font-black uppercase tracking-wider text-stone-900 bg-amber-400 px-3 py-1 rounded-lg">
                    {product.badge}
                  </span>
                )}
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border ${
                    product.stockStatus === 'low'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : product.stockStatus === 'out_of_stock'
                      ? 'bg-stone-100 text-stone-700 border-stone-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {product.stockStatus === 'low'
                    ? 'Últimas Unidades'
                    : product.stockStatus === 'out_of_stock'
                    ? 'Sob Encomenda'
                    : 'Em Stock'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit']">
                {product.name}
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
                <p className="text-emerald-700 text-sm font-semibold">
                  {product.tagline}
                </p>
                <div className="text-base font-black text-emerald-900 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {product.priceMzn && product.priceMzn > 0
                    ? `${formatMzn(product.priceMzn)} MZN${product.priceUnit ? ` / ${product.priceUnit}` : ''}`
                    : 'Preço sob consulta'}
                </div>
              </div>
            </div>

            {/* Product Agronomic Details */}
            <div className="p-6 sm:p-8 space-y-6">
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
          </div>

          {/* Sticky Modal Footer Actions */}
          <div className="shrink-0 p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm px-5 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Adicionar à Lista</span>
                </button>
              )}
              <a
                id="modal-direct-whatsapp-btn"
                href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              id="modal-request-quote-form-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenQuote(product.name);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all cursor-pointer"
            >
              <span>Orçamento Formal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox */}
      {isImageFullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-150"
          onClick={() => setIsImageFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar imagem ampliada"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={product.image}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
          <p className="mt-4 text-sm font-semibold text-stone-200 text-center">
            {product.name} — Clique fora para fechar
          </p>
        </div>
      )}
    </>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};
