import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductItem } from '../types';
import { PRODUCTS_DATA } from '../data/agroData';
import { auth } from '../firebase';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
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
  replaceLocalCatalogFromCloud,
  CATALOG_INITIALIZED_KEY,
  CATALOG_LS_KEY,
  USER_VAULT_LS_KEY,
  DELETED_IDS_LS_KEY,
} from '../utils/persistentDB';
import {
  subscribeCloudProducts,
  upsertCloudProduct,
  deleteCloudProduct,
  deleteMultipleCloudProducts,
  seedAndSyncCatalogToCloud,
} from '../utils/cloudSync';

export interface CloudOpResult {
  syncedToCloud: boolean;
  cloudError?: string;
}

export function useProductsCatalog() {
  const { isCloudAdmin } = useFirebaseAuth();

  const [products, setProducts] = useState<ProductItem[]>(() => {
    // Initial synchronous read from fast LocalStorage cache while IndexedDB & Firestore load
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
  const [hasCloudLoaded, setHasCloudLoaded] = useState(false);
  const [isCloudInitialized, setIsCloudInitialized] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastCloudError, setLastCloudError] = useState<string | null>(null);

  const productsRef = useRef<ProductItem[]>(products);
  const isFirstRender = useRef(true);
  const hasMutatedRef = useRef(false);
  const cloudInitializedRef = useRef(false);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Load full-resolution unlimited catalog from IndexedDB on startup (offline fallback)
  useEffect(() => {
    let isMounted = true;
    loadProductsFromStorage()
      .then((savedProducts) => {
        if (isMounted && savedProducts && !hasMutatedRef.current && !cloudInitializedRef.current) {
          productsRef.current = savedProducts;
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

  // Real-time Firestore cloud subscription (single source of truth across all devices & Vercel)
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeCloudProducts((cloudProducts, cloudInit) => {
      if (!isMounted) return;
      cloudInitializedRef.current = cloudInit;
      setHasCloudLoaded(true);
      setIsCloudInitialized(cloudInit);

      if (cloudInit) {
        productsRef.current = cloudProducts;
        setProducts(cloudProducts);
        void replaceLocalCatalogFromCloud(cloudProducts);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Multi-tab and custom event synchronization across browser tabs
  useEffect(() => {
    const handleSync = () => {
      if (cloudInitializedRef.current) return;
      loadProductsFromStorage()
        .then((latest) => {
          productsRef.current = latest;
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
            const list = Array.from(mergedMap.values());
            productsRef.current = list;
            setProducts(list);
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

  // Continuous auto-save to IndexedDB offline cache after initial hydration
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

  // Publish full local catalog to Firestore (used on initial cloud seed or explicit sync button)
  const syncAllToCloud = useCallback(
    async (overrideProducts?: ProductItem[]): Promise<CloudOpResult> => {
      if (!auth.currentUser || !isCloudAdmin) {
        return {
          syncedToCloud: false,
          cloudError: 'Sessão Google de administrador não iniciada.',
        };
      }

      setIsCloudSyncing(true);
      setLastCloudError(null);
      try {
        const list = overrideProducts ?? productsRef.current;
        await seedAndSyncCatalogToCloud(list);
        cloudInitializedRef.current = true;
        setIsCloudInitialized(true);
        return { syncedToCloud: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao sincronizar catálogo na nuvem.';
        setLastCloudError(msg);
        return { syncedToCloud: false, cloudError: msg };
      } finally {
        setIsCloudSyncing(false);
      }
    },
    [isCloudAdmin]
  );

  // Add new product (IndexedDB + Firestore cloud)
  const addProduct = useCallback(
    async (
      newProduct: Omit<ProductItem, 'id'> & { id?: string }
    ): Promise<{ product: ProductItem } & CloudOpResult> => {
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

      const nextList = [productWithId, ...productsRef.current.filter((p) => p.id !== id)];
      productsRef.current = nextList;
      setProducts(nextList);

      await saveUserProductToVault(productWithId);
      await saveProductsToStorage(nextList);

      if (auth.currentUser && isCloudAdmin) {
        setIsCloudSyncing(true);
        setLastCloudError(null);
        try {
          if (!cloudInitializedRef.current) {
            await seedAndSyncCatalogToCloud(nextList);
            cloudInitializedRef.current = true;
            setIsCloudInitialized(true);
          } else {
            await upsertCloudProduct(productWithId);
          }
          return { product: productWithId, syncedToCloud: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Falha ao guardar produto na nuvem.';
          setLastCloudError(msg);
          return { product: productWithId, syncedToCloud: false, cloudError: msg };
        } finally {
          setIsCloudSyncing(false);
        }
      }

      return { product: productWithId, syncedToCloud: false };
    },
    [isCloudAdmin]
  );

  // Update existing product (IndexedDB + Firestore cloud)
  const updateProduct = useCallback(
    async (id: string, updatedData: Partial<ProductItem>): Promise<CloudOpResult> => {
      hasMutatedRef.current = true;
      let updatedProduct: ProductItem | null = null;
      const nextList = productsRef.current.map((item) => {
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

      productsRef.current = nextList;
      setProducts(nextList);

      if (updatedProduct) {
        await saveUserProductToVault(updatedProduct);
      }
      await saveProductsToStorage(nextList);

      if (updatedProduct && auth.currentUser && isCloudAdmin) {
        setIsCloudSyncing(true);
        setLastCloudError(null);
        try {
          if (!cloudInitializedRef.current) {
            await seedAndSyncCatalogToCloud(nextList);
            cloudInitializedRef.current = true;
            setIsCloudInitialized(true);
          } else {
            await upsertCloudProduct(updatedProduct);
          }
          return { syncedToCloud: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Falha ao atualizar produto na nuvem.';
          setLastCloudError(msg);
          return { syncedToCloud: false, cloudError: msg };
        } finally {
          setIsCloudSyncing(false);
        }
      }

      return { syncedToCloud: false };
    },
    [isCloudAdmin]
  );

  // Delete a single product permanently (IndexedDB + Firestore cloud)
  const deleteProduct = useCallback(
    async (id: string): Promise<CloudOpResult> => {
      hasMutatedRef.current = true;
      const nextList = productsRef.current.filter((item) => item.id !== id);
      productsRef.current = nextList;
      setProducts(nextList);
      await deleteProductPermanently(id);

      if (auth.currentUser && isCloudAdmin) {
        setIsCloudSyncing(true);
        setLastCloudError(null);
        try {
          if (!cloudInitializedRef.current) {
            await seedAndSyncCatalogToCloud(nextList);
            cloudInitializedRef.current = true;
            setIsCloudInitialized(true);
          } else {
            await deleteCloudProduct(id);
          }
          return { syncedToCloud: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Falha ao eliminar produto na nuvem.';
          setLastCloudError(msg);
          return { syncedToCloud: false, cloudError: msg };
        } finally {
          setIsCloudSyncing(false);
        }
      }

      return { syncedToCloud: false };
    },
    [isCloudAdmin]
  );

  // Delete all products permanently
  const deleteAllProducts = useCallback(async (): Promise<CloudOpResult> => {
    hasMutatedRef.current = true;
    const allIds = productsRef.current.map((p) => p.id);
    productsRef.current = [];
    setProducts([]);
    await clearAllProductsFromStorage(allIds);

    if (auth.currentUser && isCloudAdmin) {
      setIsCloudSyncing(true);
      setLastCloudError(null);
      try {
        await seedAndSyncCatalogToCloud([]);
        cloudInitializedRef.current = true;
        setIsCloudInitialized(true);
        return { syncedToCloud: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao esvaziar catálogo na nuvem.';
        setLastCloudError(msg);
        return { syncedToCloud: false, cloudError: msg };
      } finally {
        setIsCloudSyncing(false);
      }
    }

    return { syncedToCloud: false };
  }, [isCloudAdmin]);

  // Delete multiple selected products permanently
  const deleteMultipleProducts = useCallback(
    async (idsToDelete: string[]): Promise<CloudOpResult> => {
      hasMutatedRef.current = true;
      const idSet = new Set(idsToDelete);
      const nextList = productsRef.current.filter((p) => !idSet.has(p.id));
      productsRef.current = nextList;
      setProducts(nextList);
      await deleteMultipleProductsPermanently(idsToDelete);

      if (auth.currentUser && isCloudAdmin) {
        setIsCloudSyncing(true);
        setLastCloudError(null);
        try {
          if (!cloudInitializedRef.current) {
            await seedAndSyncCatalogToCloud(nextList);
            cloudInitializedRef.current = true;
            setIsCloudInitialized(true);
          } else {
            await deleteMultipleCloudProducts(idsToDelete);
          }
          return { syncedToCloud: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Falha ao eliminar produtos na nuvem.';
          setLastCloudError(msg);
          return { syncedToCloud: false, cloudError: msg };
        } finally {
          setIsCloudSyncing(false);
        }
      }

      return { syncedToCloud: false };
    },
    [isCloudAdmin]
  );

  const duplicateProduct = useCallback(
    async (id: string): Promise<ProductItem | undefined> => {
      hasMutatedRef.current = true;
      const target = productsRef.current.find((p) => p.id === id);
      if (!target) return undefined;
      const duplicated: ProductItem = {
        ...target,
        id: `prod-copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${target.name} (Cópia)`,
        badge: 'Personalizado',
        isUserCreated: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const nextList = [duplicated, ...productsRef.current];
      productsRef.current = nextList;
      setProducts(nextList);

      await saveUserProductToVault(duplicated);
      await saveProductsToStorage(nextList);

      if (auth.currentUser && isCloudAdmin) {
        setIsCloudSyncing(true);
        try {
          if (!cloudInitializedRef.current) {
            await seedAndSyncCatalogToCloud(nextList);
            cloudInitializedRef.current = true;
            setIsCloudInitialized(true);
          } else {
            await upsertCloudProduct(duplicated);
          }
        } catch (err) {
          setLastCloudError(err instanceof Error ? err.message : 'Falha ao duplicar produto na nuvem.');
        } finally {
          setIsCloudSyncing(false);
        }
      }

      return duplicated;
    },
    [isCloudAdmin]
  );

  const resetToDefault = useCallback(
    async (preserveUserCreated = true): Promise<CloudOpResult> => {
      hasMutatedRef.current = true;
      clearDeletedIds();

      let nextList: ProductItem[];
      if (preserveUserCreated) {
        const userVault = await loadUserProductsFromVault();
        const userItemsMap = new Map<string, ProductItem>();
        userVault.forEach((item) => userItemsMap.set(item.id, item));
        nextList = [...userVault, ...PRODUCTS_DATA.filter((p) => !userItemsMap.has(p.id))];
      } else {
        nextList = PRODUCTS_DATA;
      }

      productsRef.current = nextList;
      setProducts(nextList);
      await saveProductsToStorage(nextList);

      if (auth.currentUser && isCloudAdmin) {
        return await syncAllToCloud(nextList);
      }

      return { syncedToCloud: false };
    },
    [isCloudAdmin, syncAllToCloud]
  );

  const importCatalog = useCallback(
    async (importedProducts: ProductItem[]): Promise<CloudOpResult> => {
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
      productsRef.current = normalized;
      setProducts(normalized);
      await saveProductsToStorage(normalized);

      if (auth.currentUser && isCloudAdmin) {
        return await syncAllToCloud(normalized);
      }

      return { syncedToCloud: false };
    },
    [isCloudAdmin, syncAllToCloud]
  );

  const exportCatalogJSON = useCallback(() => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(productsRef.current, null, 2)
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
  }, []);

  return {
    products,
    isLoaded,
    hasCloudLoaded,
    isCloudInitialized,
    isCloudSyncing,
    lastCloudError,
    syncAllToCloud,
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
