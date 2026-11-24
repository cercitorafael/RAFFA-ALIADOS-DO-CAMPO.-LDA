import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductItem } from '../types';
import { PRODUCTS_DATA } from '../data/agroData';
import {
  loadProductsFromStorage,
  saveProductsToStorage,
  saveUserProductToVault,
  deleteProductPermanently,
  deleteMultipleProductsPermanently,
  clearAllProductsFromStorage,
  loadCatalogFromLocalStorage,
  loadUserVaultFromLocalStorage,
  loadUserProductsFromVault,
  loadDeletedIdsFromStorage,
  clearDeletedIds,
  CATALOG_INITIALIZED_KEY,
  CATALOG_LS_KEY,
  USER_VAULT_LS_KEY,
  DELETED_IDS_LS_KEY,
} from '../utils/persistentDB';

export function useProductsCatalog() {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    // Initial synchronous read from fast LocalStorage cache while IndexedDB loads
    try {
      const deletedIds = loadDeletedIdsFromStorage();
      const userVault = loadUserVaultFromLocalStorage();
      const savedCatalog = loadCatalogFromLocalStorage();
      const isInitialized =
        typeof window !== 'undefined' && localStorage.getItem(CATALOG_INITIALIZED_KEY) === 'true';

      if (savedCatalog !== null) {
        const mergedMap = new Map<string, ProductItem>();
        savedCatalog.forEach((item) => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });
        userVault.forEach((item) => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, { ...item, isUserCreated: true });
          }
        });
        return Array.from(mergedMap.values());
      }

      if (isInitialized) {
        return userVault.filter((item) => !deletedIds.has(item.id));
      }

      return PRODUCTS_DATA.filter((item) => !deletedIds.has(item.id));
    } catch (e) {
      console.warn('Initial sync read error:', e);
      return PRODUCTS_DATA;
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const isFirstRender = useRef(true);
  const hasMutatedRef = useRef(false);

  // Load full-resolution unlimited catalog from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    loadProductsFromStorage()
      .then((savedProducts) => {
        if (isMounted && savedProducts && !hasMutatedRef.current) {
          setProducts(savedProducts);
        }
        if (isMounted) setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load from persistent storage:', err);
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-tab and custom event synchronization across browser tabs
  useEffect(() => {
    const handleSync = () => {
      loadProductsFromStorage()
        .then((latest) => {
          setProducts(latest);
        })
        .catch(() => {
          const deletedIds = loadDeletedIdsFromStorage();
          const userVault = loadUserVaultFromLocalStorage();
          const savedCatalog = loadCatalogFromLocalStorage();
          if (savedCatalog !== null) {
            const mergedMap = new Map<string, ProductItem>();
            savedCatalog.forEach((item) => {
              if (!deletedIds.has(item.id)) mergedMap.set(item.id, item);
            });
            userVault.forEach((item) => {
              if (!deletedIds.has(item.id)) mergedMap.set(item.id, { ...item, isUserCreated: true });
            });
            setProducts(Array.from(mergedMap.values()));
          }
        });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === CATALOG_LS_KEY ||
        e.key === USER_VAULT_LS_KEY ||
        e.key === DELETED_IDS_LS_KEY
      ) {
        handleSync();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('raffa_agro_catalog_changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('raffa_agro_catalog_changed', handleSync);
    };
  }, []);

  // Continuous auto-save whenever products list updates after initial hydration
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isLoaded && !hasMutatedRef.current) {
      return;
    }
    void saveProductsToStorage(products);
  }, [products, isLoaded]);

  // Add new product (persists permanently in unlimited IndexedDB + fast cache)
  const addProduct = useCallback((newProduct: Omit<ProductItem, 'id'> & { id?: string }) => {
    hasMutatedRef.current = true;
    const id =
      newProduct.id || `prod-custom-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const productWithId: ProductItem = {
      ...newProduct,
      id,
      isUserCreated: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    void saveUserProductToVault(productWithId);

    setProducts((prev) => {
      const updated = [productWithId, ...prev.filter((p) => p.id !== id)];
      void saveProductsToStorage(updated);
      return updated;
    });

    return productWithId;
  }, []);

  // Update existing product
  const updateProduct = useCallback((id: string, updatedData: Partial<ProductItem>) => {
    hasMutatedRef.current = true;
    setProducts((prev) => {
      let updatedProduct: ProductItem | null = null;
      const updated = prev.map((item) => {
        if (item.id === id) {
          updatedProduct = {
            ...item,
            ...updatedData,
            updatedAt: Date.now(),
            specs: {
              ...item.specs,
              ...updatedData.specs,
            },
          };
          return updatedProduct;
        }
        return item;
      });

      if (updatedProduct) {
        void saveUserProductToVault(updatedProduct);
      }
      void saveProductsToStorage(updated);
      return updated;
    });
  }, []);

  // Delete a single product permanently (stays deleted forever)
  const deleteProduct = useCallback(async (id: string) => {
    hasMutatedRef.current = true;
    setProducts((prev) => prev.filter((item) => item.id !== id));
    await deleteProductPermanently(id);
  }, []);

  // Delete all products permanently (stays empty until user adds or restores)
  const deleteAllProducts = useCallback(async () => {
    hasMutatedRef.current = true;
    const allIds = products.map((p) => p.id);
    setProducts([]);
    await clearAllProductsFromStorage(allIds);
  }, [products]);

  // Delete multiple selected products permanently
  const deleteMultipleProducts = useCallback(async (idsToDelete: string[]) => {
    hasMutatedRef.current = true;
    const idSet = new Set(idsToDelete);
    setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
    await deleteMultipleProductsPermanently(idsToDelete);
  }, []);

  const duplicateProduct = useCallback(
    (id: string) => {
      hasMutatedRef.current = true;
      const target = products.find((p) => p.id === id);
      if (!target) return;
      const duplicated: ProductItem = {
        ...target,
        id: `prod-copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${target.name} (Cópia)`,
        badge: 'Personalizado',
        isUserCreated: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      void saveUserProductToVault(duplicated);
      setProducts((prev) => {
        const updated = [duplicated, ...prev];
        void saveProductsToStorage(updated);
        return updated;
      });

      return duplicated;
    },
    [products]
  );

  const resetToDefault = useCallback(async (preserveUserCreated = true) => {
    hasMutatedRef.current = true;
    clearDeletedIds();

    if (preserveUserCreated) {
      const userVault = await loadUserProductsFromVault();
      const userItemsMap = new Map<string, ProductItem>();
      userVault.forEach((item) => userItemsMap.set(item.id, item));

      const merged = [...userVault, ...PRODUCTS_DATA.filter((p) => !userItemsMap.has(p.id))];
      setProducts(merged);
      await saveProductsToStorage(merged);
    } else {
      setProducts(PRODUCTS_DATA);
      await saveProductsToStorage(PRODUCTS_DATA);
    }
  }, []);

  const importCatalog = useCallback((importedProducts: ProductItem[]) => {
    if (!Array.isArray(importedProducts) || importedProducts.length === 0) {
      throw new Error('Formato de ficheiro inválido. Deve ser uma lista de produtos.');
    }
    hasMutatedRef.current = true;
    clearDeletedIds();
    const normalized = importedProducts.map((p) => ({
      ...p,
      isUserCreated: true,
      updatedAt: Date.now(),
    }));
    setProducts(normalized);
    void saveProductsToStorage(normalized);
  }, []);

  const exportCatalogJSON = useCallback(() => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(products, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `catalogo_raffa_sementes_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [products]);

  return {
    products,
    isLoaded,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
    deleteMultipleProducts,
    duplicateProduct,
    resetToDefault,
    importCatalog,
    exportCatalogJSON,
  };
}
