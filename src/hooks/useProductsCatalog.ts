import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductItem } from '../types';
import { PRODUCTS_DATA } from '../data/agroData';
import { 
  loadProductsFromStorage, 
  saveProductsToStorage, 
  saveUserProductToVault, 
  deleteProductPermanently,
  clearAllProductsFromStorage,
  loadCatalogFromLocalStorage,
  loadUserVaultFromLocalStorage,
  loadDeletedIdsFromStorage,
  clearDeletedIds
} from '../utils/persistentDB';

export function useProductsCatalog() {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    // Initial sync read: Combine active catalog with dedicated user vault and exclude deleted items
    try {
      const deletedIds = loadDeletedIdsFromStorage();
      const userVault = loadUserVaultFromLocalStorage();
      const savedCatalog = loadCatalogFromLocalStorage();
      
      if (savedCatalog !== null) {
        const mergedMap = new Map<string, ProductItem>();
        savedCatalog.forEach(item => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });
        userVault.forEach(item => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, { ...item, isUserCreated: true });
          }
        });
        return Array.from(mergedMap.values());
      }

      // First run ever
      saveProductsToStorage(PRODUCTS_DATA);
      return PRODUCTS_DATA;
    } catch (e) {
      console.warn('Initial sync read error:', e);
      return PRODUCTS_DATA;
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const isFirstRender = useRef(true);

  // Load from IndexedDB on startup (dual-vault resolution)
  useEffect(() => {
    let isMounted = true;
    loadProductsFromStorage().then((savedProducts) => {
      if (isMounted && savedProducts) {
        setProducts(savedProducts);
        setIsLoaded(true);
      }
    }).catch((err) => {
      console.error('Failed to load from persistent storage:', err);
      setIsLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-tab and custom event synchronization: sync product catalog across tabs & actions instantly
  useEffect(() => {
    const handleSync = () => {
      const deletedIds = loadDeletedIdsFromStorage();
      const userVault = loadUserVaultFromLocalStorage();
      const savedCatalog = loadCatalogFromLocalStorage();
      if (savedCatalog !== null) {
        const mergedMap = new Map<string, ProductItem>();
        savedCatalog.forEach(item => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });
        userVault.forEach(item => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, { ...item, isUserCreated: true });
          }
        });
        setProducts(Array.from(mergedMap.values()));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'raffa_agro_catalog_v3' || e.key === 'raffa_agro_user_vault_v3' || e.key === 'raffa_agro_deleted_ids_v3') {
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

  // Continuous auto-save whenever products list updates
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveProductsToStorage(products);
  }, [products]);

  // CRUD Actions
  const addProduct = useCallback((newProduct: Omit<ProductItem, 'id'> & { id?: string }) => {
    const id = newProduct.id || `prod-custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const productWithId: ProductItem = {
      ...newProduct,
      id,
      isUserCreated: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // 1. Immediately persist to user vault (fail-proof)
    saveUserProductToVault(productWithId);

    // 2. Update state and full catalog
    setProducts((prev) => {
      const updated = [productWithId, ...prev.filter(p => p.id !== id)];
      saveProductsToStorage(updated);
      return updated;
    });

    return productWithId;
  }, []);

  const updateProduct = useCallback((id: string, updatedData: Partial<ProductItem>) => {
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
        saveUserProductToVault(updatedProduct);
      }
      saveProductsToStorage(updated);
      return updated;
    });
  }, []);

  // Delete a single product in its totality
  const deleteProduct = useCallback(async (id: string) => {
    await deleteProductPermanently(id);
    setProducts((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveProductsToStorage(updated);
      return updated;
    });
  }, []);

  // Delete all products in their totality (complete catalog elimination)
  const deleteAllProducts = useCallback(async () => {
    const allIds = products.map(p => p.id);
    await clearAllProductsFromStorage(allIds);
    setProducts([]);
    saveProductsToStorage([]);
  }, [products]);

  // Delete multiple selected products in their totality
  const deleteMultipleProducts = useCallback(async (idsToDelete: string[]) => {
    for (const id of idsToDelete) {
      await deleteProductPermanently(id);
    }
    setProducts((prev) => {
      const idSet = new Set(idsToDelete);
      const updated = prev.filter(p => !idSet.has(p.id));
      saveProductsToStorage(updated);
      return updated;
    });
  }, []);

  const duplicateProduct = useCallback((id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const duplicated: ProductItem = {
      ...target,
      id: `prod-copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${target.name} (Cópia)`,
      badge: 'Personalizado',
      isUserCreated: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveUserProductToVault(duplicated);
    setProducts((prev) => {
      const updated = [duplicated, ...prev];
      saveProductsToStorage(updated);
      return updated;
    });
    return duplicated;
  }, [products]);

  const resetToDefault = useCallback((preserveUserCreated = true) => {
    clearDeletedIds();
    if (preserveUserCreated) {
      // Keep all user-created products safely, only restore factory products
      const userVault = loadUserVaultFromLocalStorage();
      const userItemsMap = new Map<string, ProductItem>();
      userVault.forEach(item => userItemsMap.set(item.id, item));
      
      // Merge PRODUCTS_DATA with preserved user items
      const merged = [...userVault, ...PRODUCTS_DATA.filter(p => !userItemsMap.has(p.id))];
      setProducts(merged);
      saveProductsToStorage(merged);
    } else {
      // Complete wipe only if explicitly chosen
      setProducts(PRODUCTS_DATA);
      saveProductsToStorage(PRODUCTS_DATA);
    }
  }, []);

  const importCatalog = useCallback((importedProducts: ProductItem[]) => {
    if (!Array.isArray(importedProducts) || importedProducts.length === 0) {
      throw new Error('Formato de ficheiro inválido. Deve ser uma lista de produtos.');
    }
    setProducts(importedProducts);
    saveProductsToStorage(importedProducts);
  }, []);

  const exportCatalogJSON = useCallback(() => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(products, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `catalogo_raffa_sementes_${new Date().toISOString().slice(0, 10)}.json`);
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

