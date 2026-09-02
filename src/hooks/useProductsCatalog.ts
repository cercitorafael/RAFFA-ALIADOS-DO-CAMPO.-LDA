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
import { 
  syncProductsToCloud, 
  fetchProductsFromCloud, 
  deleteProductFromCloud,
  upsertSingleProductToCloud,
  formatSupabaseRowToProduct,
  supabase,
  isSupabaseConfigured
} from '../lib/supabase';

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
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
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

  // Automatic Cloud Sync with Supabase on startup & Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    async function autoSynchronizeWithSupabase() {
      if (!isSupabaseConfigured) return;

      try {
        setSyncStatus('syncing');
        const cloudProducts = await fetchProductsFromCloud();
        if (!isMounted) return;

        if (cloudProducts && cloudProducts.length > 0) {
          // Cloud has catalog: automatically apply and update local storage
          console.log(`[Supabase Auto-Sync] Sincronização automática: ${cloudProducts.length} produtos carregados da nuvem.`);
          setProducts(cloudProducts);
          saveProductsToStorage(cloudProducts);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        } else if (cloudProducts && cloudProducts.length === 0) {
          // Cloud table is currently empty: automatically seed it with local catalog
          console.log('[Supabase Auto-Sync] Tabela da nuvem vazia: a semear catálogo inicial no Supabase...');
          const currentCatalog = products;
          if (currentCatalog.length > 0) {
            const res = await syncProductsToCloud(currentCatalog);
            if (!isMounted) return;
            if (res.success) {
              setSyncStatus('synced');
              setLastSyncedAt(new Date());
              console.log(`[Supabase Auto-Sync] Catálogo inicial de ${res.count} produtos sincronizado com sucesso.`);
            } else {
              setSyncStatus('idle');
            }
          } else {
            setSyncStatus('synced');
          }
        } else {
          setSyncStatus('idle');
        }
      } catch (err) {
        console.warn('[Supabase Auto-Sync] Erro na sincronização inicial:', err);
        if (isMounted) setSyncStatus('error');
      }
    }

    autoSynchronizeWithSupabase();

    // Supabase Realtime channel subscription for instant multi-user / multi-tab synchronization
    let channel: any = null;
    try {
      channel = supabase
        .channel('realtime_products_catalog')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload: any) => {
            console.log('[Supabase Realtime] Alteração detetada na nuvem:', payload.eventType);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const cloudItem = formatSupabaseRowToProduct(payload.new);
              setProducts((prev) => {
                const index = prev.findIndex(p => p.id === cloudItem.id);
                let next: ProductItem[];
                if (index >= 0) {
                  next = [...prev];
                  next[index] = cloudItem;
                } else {
                  next = [cloudItem, ...prev];
                }
                saveProductsToStorage(next);
                return next;
              });
              setLastSyncedAt(new Date());
              setSyncStatus('synced');
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any)?.id;
              if (deletedId) {
                setProducts((prev) => {
                  const next = prev.filter(p => p.id !== deletedId);
                  saveProductsToStorage(next);
                  return next;
                });
                setLastSyncedAt(new Date());
                setSyncStatus('synced');
              }
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('[Supabase Realtime] Falha ao registar subscrição em tempo real:', e);
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
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

  // CRUD Actions with Automatic Cloud Sync
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

    // 3. Automatically sync single product to Supabase cloud in background
    upsertSingleProductToCloud(productWithId)
      .then((ok) => {
        if (ok) {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        }
      })
      .catch((err) => console.warn('[Supabase] Background add failed:', err));

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
        // Automatically sync single updated product to Supabase cloud in background
        upsertSingleProductToCloud(updatedProduct)
          .then((ok) => {
            if (ok) {
              setSyncStatus('synced');
              setLastSyncedAt(new Date());
            }
          })
          .catch((err) => console.warn('[Supabase] Background update failed:', err));
      }
      saveProductsToStorage(updated);
      return updated;
    });
  }, []);

  // Delete a single product in its totality
  const deleteProduct = useCallback(async (id: string) => {
    await deleteProductPermanently(id);
    // Asynchronously delete from Supabase cloud without blocking local UI
    deleteProductFromCloud(id)
      .then(() => {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      })
      .catch((err) => console.warn('[Supabase] Background delete failed:', err));

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
    // Asynchronously delete from Supabase cloud
    allIds.forEach(id => {
      deleteProductFromCloud(id).catch(err => console.warn('[Supabase] Background delete failed:', err));
    });
    setProducts([]);
    saveProductsToStorage([]);
    setSyncStatus('synced');
    setLastSyncedAt(new Date());
  }, [products]);

  // Delete multiple selected products in their totality
  const deleteMultipleProducts = useCallback(async (idsToDelete: string[]) => {
    for (const id of idsToDelete) {
      await deleteProductPermanently(id);
      deleteProductFromCloud(id).catch(err => console.warn('[Supabase] Background delete failed:', err));
    }
    setProducts((prev) => {
      const idSet = new Set(idsToDelete);
      const updated = prev.filter(p => !idSet.has(p.id));
      saveProductsToStorage(updated);
      return updated;
    });
    setSyncStatus('synced');
    setLastSyncedAt(new Date());
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

    // Automatically sync duplicated product to Supabase cloud
    upsertSingleProductToCloud(duplicated)
      .then((ok) => {
        if (ok) {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        }
      })
      .catch((err) => console.warn('[Supabase] Background duplicate sync failed:', err));

    return duplicated;
  }, [products]);

  const resetToDefault = useCallback((preserveUserCreated = true) => {
    clearDeletedIds();
    let merged: ProductItem[];
    if (preserveUserCreated) {
      // Keep all user-created products safely, only restore factory products
      const userVault = loadUserVaultFromLocalStorage();
      const userItemsMap = new Map<string, ProductItem>();
      userVault.forEach(item => userItemsMap.set(item.id, item));
      
      // Merge PRODUCTS_DATA with preserved user items
      merged = [...userVault, ...PRODUCTS_DATA.filter(p => !userItemsMap.has(p.id))];
      setProducts(merged);
      saveProductsToStorage(merged);
    } else {
      // Complete wipe only if explicitly chosen
      merged = PRODUCTS_DATA;
      setProducts(PRODUCTS_DATA);
      saveProductsToStorage(PRODUCTS_DATA);
    }

    // Automatically sync restored catalog to Supabase
    syncProductsToCloud(merged)
      .then((res) => {
        if (res.success) {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        }
      })
      .catch((err) => console.warn('[Supabase] Auto sync on reset failed:', err));
  }, []);

  const importCatalog = useCallback((importedProducts: ProductItem[]) => {
    if (!Array.isArray(importedProducts) || importedProducts.length === 0) {
      throw new Error('Formato de ficheiro inválido. Deve ser uma lista de produtos.');
    }
    setProducts(importedProducts);
    saveProductsToStorage(importedProducts);

    // Automatically sync imported catalog to Supabase
    syncProductsToCloud(importedProducts)
      .then((res) => {
        if (res.success) {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
        }
      })
      .catch((err) => console.warn('[Supabase] Auto sync on import failed:', err));
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

  // Push current catalog to Supabase cloud
  const syncWithCloud = useCallback(async () => {
    setSyncStatus('syncing');
    const res = await syncProductsToCloud(products);
    if (res.success) {
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    } else {
      setSyncStatus('error');
    }
    return res;
  }, [products]);

  // Pull products stored in Supabase cloud and update local catalog
  const pullFromCloud = useCallback(async () => {
    setSyncStatus('syncing');
    const cloudProducts = await fetchProductsFromCloud();
    if (cloudProducts && cloudProducts.length > 0) {
      setProducts(cloudProducts);
      saveProductsToStorage(cloudProducts);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      return { success: true, count: cloudProducts.length };
    }
    setSyncStatus('idle');
    return { success: false, count: 0 };
  }, []);

  return {
    products,
    isLoaded,
    syncStatus,
    lastSyncedAt,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
    deleteMultipleProducts,
    duplicateProduct,
    resetToDefault,
    importCatalog,
    exportCatalogJSON,
    syncWithCloud,
    pullFromCloud,
  };
}

