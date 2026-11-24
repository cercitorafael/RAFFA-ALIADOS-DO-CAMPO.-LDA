import { useState, useEffect, useCallback } from 'react';
import { CartItem, ProductItem } from '../types';
import { loadCartSync, loadCartFromStorage, saveCartToStorage } from '../utils/persistentDB';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => loadCartSync<CartItem>());

  useEffect(() => {
    let active = true;
    loadCartFromStorage<CartItem>().then((loaded) => {
      if (active && Array.isArray(loaded)) {
        setItems(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
    void saveCartToStorage(nextItems);
  }, []);

  const addToCart = useCallback(
    (product: ProductItem, quantityToAdd = 1) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.productId === product.id);
        let next: CartItem[];
        if (existingIndex >= 0) {
          next = prev.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: item.quantity + quantityToAdd }
              : item
          );
        } else {
          next = [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              categoryLabel: product.categoryLabel,
              priceMzn: product.priceMzn,
              priceUnit: product.priceUnit || 'unidade',
              quantity: quantityToAdd,
              image: product.image,
            },
          ];
        }
        void saveCartToStorage(next);
        return next;
      });
    },
    []
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((item) => item.productId !== productId)
          : prev.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            );
      void saveCartToStorage(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.productId !== productId);
      void saveCartToStorage(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTotalMzn = items.reduce(
    (sum, item) => sum + (item.priceMzn && item.priceMzn > 0 ? item.priceMzn * item.quantity : 0),
    0
  );
  const hasUnpricedItems = items.some((item) => !item.priceMzn || item.priceMzn <= 0);

  return {
    items,
    totalItems,
    estimatedTotalMzn,
    hasUnpricedItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}
