import React from 'react';
import { Trash2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { ProductItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    onConfirmDelete(product.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full my-auto z-10 overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        {/* Top Warning Strip */}
        <div className="bg-red-50 border-b border-red-100 p-4 flex items-center justify-between text-red-900">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Eliminar Produto na Totalidade</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-stone-700 text-sm font-medium leading-relaxed mb-4">
            Tem a certeza de que deseja eliminar esta semente <strong>na totalidade</strong>? O produto será removido permanentemente de todas as bases de dados e do catálogo da loja.
          </p>

          {/* Product Preview Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-center gap-3.5 mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded">
                  {product.categoryLabel}
                </span>
                {product.isUserCreated && (
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                    Adicionado por Si
                  </span>
                )}
              </div>
              <h4 className="font-bold text-stone-900 text-sm font-['Outfit'] truncate mt-1">
                {product.name}
              </h4>
              <p className="text-xs text-stone-500 truncate">
                {product.tagline || product.description}
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-2 bg-red-50/70 border border-red-200/80 text-red-900 p-3 rounded-xl text-xs">
            <Trash2 className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <p>
              <strong>Eliminação imediata e permanente:</strong> Ao confirmar, o produto é apagado na totalidade do sistema (IndexedDB e LocalStorage) sem deixar rastros.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-stone-50 p-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition-colors"
          >
            Cancelar (Manter Semente)
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sim, Eliminar na Totalidade</span>
          </button>
        </div>
      </div>
    </div>
  );
};
