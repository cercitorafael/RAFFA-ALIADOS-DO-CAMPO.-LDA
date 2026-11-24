import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Mail,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';
import { CartItem } from '../types';
import { COMPANY_INFO } from '../data/agroData';
import { saveQuoteToLocalDB } from '../utils/persistentDB';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  estimatedTotalMzn: number;
  hasUnpricedItems: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const formatMzn = (value: number): string => {
  return new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  onClose,
  items,
  estimatedTotalMzn,
  hasUnpricedItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('Namiconha / Ribaué');
  const [notes, setNotes] = useState('');
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOrderSent(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const buildItemsSummaryText = () => {
    return items
      .map((item, idx) => {
        const unitLabel = item.priceUnit ? ` (${item.priceUnit})` : '';
        const pricePart =
          item.priceMzn && item.priceMzn > 0
            ? ` — ${formatMzn(item.priceMzn * item.quantity)} MZN`
            : ' — Preço sob consulta';
        return `${idx + 1}. ${item.name}${unitLabel} × ${item.quantity}${pricePart}`;
      })
      .join('\n');
  };

  const persistOrderToHistory = () => {
    const summaryList = items
      .map((i) => `${i.quantity}x ${i.name}${i.priceMzn ? ` (${formatMzn(i.priceMzn)} MZN)` : ''}`)
      .join(', ');

    void saveQuoteToLocalDB({
      name: customerName.trim() || 'Produtor / Cliente',
      phone: customerPhone.trim() || 'Não informado',
      location: customerLocation.trim() || 'Ribaué / Nampula',
      selectedCategory: 'Lista de Pedido (Carrinho)',
      selectedProduct: summaryList,
      areaOrQuantity: `${items.reduce((s, i) => s + i.quantity, 0)} item(ns)`,
      notes: notes.trim(),
      totalMzn: estimatedTotalMzn > 0 ? estimatedTotalMzn : undefined,
      source: 'cart_order',
    });
  };

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    persistOrderToHistory();

    const totalLine =
      estimatedTotalMzn > 0
        ? `\n💰 *Subtotal Estimado:* ${formatMzn(estimatedTotalMzn)} MZN${hasUnpricedItems ? ' (+ itens sob consulta)' : ''}`
        : '\n💰 *Cotação:* Todos os itens sob consulta';

    const message = encodeURIComponent(
      `*NOVA LISTA DE PEDIDO - RAFFA ALIADOS DO CAMPO*\n\n` +
        `👤 *Cliente:* ${customerName.trim() || 'Não informado'}\n` +
        `📱 *Contacto:* ${customerPhone.trim() || 'Não informado'}\n` +
        `📍 *Localidade:* ${customerLocation.trim() || 'Ribaué / Nampula'}\n\n` +
        `🛒 *ITENS DO PEDIDO:*\n${buildItemsSummaryText()}\n` +
        `${totalLine}\n` +
        `${notes.trim() ? `\n📝 *Observações:* ${notes.trim()}\n` : ''}\n` +
        `_Enviado pela Lista de Pedido do website Raffa Aliados do Campo_`
    );

    window.open(`https://wa.me/258${COMPANY_INFO.whatsapp}?text=${message}`, '_blank');
    setOrderSent(true);
    onClearCart();
  };

  const handleSendEmail = () => {
    if (items.length === 0) return;
    persistOrderToHistory();

    const subject = encodeURIComponent(
      `Lista de Pedido - ${customerName.trim() || 'Cliente'} (${items.length} produtos)`
    );
    const body = encodeURIComponent(
      `Cliente: ${customerName.trim() || 'Não informado'}\n` +
        `Telefone/WhatsApp: ${customerPhone.trim() || 'Não informado'}\n` +
        `Localidade: ${customerLocation.trim() || 'Ribaué / Nampula'}\n\n` +
        `ITENS SOLICITADOS:\n${buildItemsSummaryText()}\n\n` +
        (estimatedTotalMzn > 0 ? `Subtotal estimado: ${formatMzn(estimatedTotalMzn)} MZN\n` : '') +
        (notes.trim() ? `\nNotas: ${notes.trim()}\n` : '')
    );
    window.location.href = `mailto:${COMPANY_INFO.email}?subject=${subject}&body=${body}`;
    setOrderSent(true);
    onClearCart();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="relative bg-white w-full max-w-lg h-full z-10 shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-amber-300">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold font-['Outfit']">
                Minha Lista de Pedido
              </h2>
              <p className="text-xs text-emerald-300">
                Selecione sementes & insumos e envie um único pedido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
            aria-label="Fechar lista de pedido"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {orderSent ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 font-['Outfit']">
              Pedido Registado e Encaminhado!
            </h3>
            <p className="text-sm text-stone-600 max-w-sm leading-relaxed">
              A sua lista foi guardada no sistema e preparada para envio à nossa loja em Namiconha - Ribaué. Confirme o envio no WhatsApp ou Email para atendimento imediato.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm cursor-pointer"
            >
              Continuar no Catálogo
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-800 font-['Outfit']">
              A sua lista de pedido está vazia
            </h3>
            <p className="text-sm text-stone-500 max-w-xs">
              Adicione sementes, adubos, agroquímicos ou equipamentos a partir do catálogo para enviar um orçamento consolidado.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-sm flex items-center gap-3.5"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {item.categoryLabel}
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="text-xs font-semibold text-stone-600 mt-0.5">
                        {item.priceMzn && item.priceMzn > 0 ? (
                          <span className="text-emerald-800 font-bold">
                            {formatMzn(item.priceMzn)} MZN / {item.priceUnit || 'un'}
                          </span>
                        ) : (
                          <span className="text-amber-700">Preço sob consulta</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="inline-flex items-center border border-stone-200 rounded-lg bg-stone-50">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 hover:bg-stone-200 text-stone-700 rounded-l-lg cursor-pointer"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            className="p-1.5 hover:bg-stone-200 text-stone-700 rounded-r-lg cursor-pointer"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.productId)}
                          className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Total de Itens Selecionados:</span>
                  <span>{items.reduce((s, i) => s + i.quantity, 0)} un</span>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-emerald-950 pt-1 border-t border-emerald-200/70">
                  <span>Subtotal Estimado (MZN):</span>
                  <span>
                    {estimatedTotalMzn > 0 ? `${formatMzn(estimatedTotalMzn)} MZN` : 'Sob Consulta'}
                  </span>
                </div>
                {hasUnpricedItems && (
                  <p className="text-[11px] text-amber-800 font-medium pt-1">
                    Alguns itens estão marcados como "sob consulta" e serão cotados pela nossa equipa.
                  </p>
                )}
              </div>

              {/* Quick Checkout Form */}
              <form id="cart-checkout-form" onSubmit={handleSendWhatsApp} className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Dados para Envio da Encomenda
                </h4>

                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome ou Associação *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="Telefone / WhatsApp *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Localidade"
                      value={customerLocation}
                      onChange={(e) => setCustomerLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Observações (ex: entrega em Ribaué ou levantamento na loja)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none resize-none"
                />
              </form>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-stone-200 space-y-2 shrink-0">
              <button
                type="submit"
                form="cart-checkout-form"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Lista via WhatsApp ({COMPANY_INFO.whatsapp})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="flex-1 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar por Email</span>
                </button>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="py-2.5 px-3 bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Limpar Lista
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
