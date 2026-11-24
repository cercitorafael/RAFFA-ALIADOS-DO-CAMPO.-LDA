import { useState, useEffect, useCallback, useRef } from 'react';
import { FeaturedInfoItem } from '../types';
import { auth } from '../firebase';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import {
  loadFeaturedInfoFromLocalStorageSync,
  loadFeaturedInfoFromStorage,
  saveFeaturedInfoToStorage,
  upsertFeaturedInfoToStorage,
  deleteFeaturedInfoPermanently,
  resetFeaturedInfoToDefault,
  replaceLocalFeaturedFromCloud,
  FEATURED_LS_KEY,
  FEATURED_DELETED_LS_KEY,
} from '../utils/persistentDB';
import {
  subscribeCloudFeaturedInfo,
  upsertCloudFeaturedInfo,
  syncFeaturedInfoToCloud,
  deleteCloudFeaturedInfo,
} from '../utils/cloudSync';

export function useFeaturedInfo() {
  const { isCloudAdmin } = useFirebaseAuth();

  const [featuredItems, setFeaturedItems] = useState<FeaturedInfoItem[]>(() =>
    loadFeaturedInfoFromLocalStorageSync()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasCloudLoaded, setHasCloudLoaded] = useState(false);
  const [isCloudInitialized, setIsCloudInitialized] = useState(false);

  const featuredRef = useRef<FeaturedInfoItem[]>(featuredItems);
  const hasMutatedRef = useRef(false);
  const isFirstRender = useRef(true);
  const cloudInitializedRef = useRef(false);

  useEffect(() => {
    featuredRef.current = featuredItems;
  }, [featuredItems]);

  // Load full-resolution unlimited featured items from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    loadFeaturedInfoFromStorage()
      .then((items) => {
        if (isMounted && !hasMutatedRef.current && !cloudInitializedRef.current) {
          featuredRef.current = items;
          setFeaturedItems(items);
        }
        if (isMounted) setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Erro ao carregar informações em destaque do IndexedDB:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time Firestore subscription for Featured Info
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeCloudFeaturedInfo((cloudItems, cloudInit) => {
      if (!isMounted) return;
      cloudInitializedRef.current = cloudInit;
      setHasCloudLoaded(true);
      setIsCloudInitialized(cloudInit);

      if (cloudInit) {
        featuredRef.current = cloudItems;
        setFeaturedItems(cloudItems);
        void replaceLocalFeaturedFromCloud(cloudItems);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Multi-tab and cross-component sync
  useEffect(() => {
    const handleSync = () => {
      if (cloudInitializedRef.current) return;
      loadFeaturedInfoFromStorage()
        .then((items) => {
          featuredRef.current = items;
          setFeaturedItems(items);
        })
        .catch(() => {
          const fallback = loadFeaturedInfoFromLocalStorageSync();
          featuredRef.current = fallback;
          setFeaturedItems(fallback);
        });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FEATURED_LS_KEY || e.key === FEATURED_DELETED_LS_KEY) {
        handleSync();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('raffa_featured_info_changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('raffa_featured_info_changed', handleSync);
    };
  }, []);

  // Keep storage synchronized whenever featuredItems changes after initial hydration
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isLoading && !hasMutatedRef.current) {
      return;
    }
    void saveFeaturedInfoToStorage(featuredItems);
  }, [featuredItems, isLoading]);

  const syncFeaturedToCloud = useCallback(async () => {
    if (!auth.currentUser || !isCloudAdmin) return false;
    await syncFeaturedInfoToCloud(featuredRef.current);
    cloudInitializedRef.current = true;
    setIsCloudInitialized(true);
    return true;
  }, [isCloudAdmin]);

  // Add new featured info (IndexedDB + Firestore cloud)
  const addFeaturedItem = useCallback(
    async (newItem: Omit<FeaturedInfoItem, 'id' | 'createdAt'>) => {
      hasMutatedRef.current = true;
      const createdItem: FeaturedInfoItem = {
        ...newItem,
        id: 'info-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const nextList = [createdItem, ...featuredRef.current];
      featuredRef.current = nextList;
      setFeaturedItems(nextList);
      await upsertFeaturedInfoToStorage(createdItem);

      if (auth.currentUser && isCloudAdmin) {
        try {
          if (!cloudInitializedRef.current) {
            await syncFeaturedInfoToCloud(nextList);
            cloudInitializedRef.current = true;
            setIsCloudInitialized(true);
          } else {
            await upsertCloudFeaturedInfo(createdItem);
          }
        } catch (err) {
          console.warn('Falha ao gravar destaque na nuvem:', err);
        }
      }

      return createdItem;
    },
    [isCloudAdmin]
  );

  // Update existing featured info
  const updateFeaturedItem = useCallback(
    async (id: string, updates: Partial<FeaturedInfoItem>) => {
      hasMutatedRef.current = true;
      let updatedObj: FeaturedInfoItem | null = null;
      const nextList = featuredRef.current.map((item) => {
        if (item.id === id) {
          updatedObj = { ...item, ...updates, updatedAt: Date.now() };
          return updatedObj;
        }
        return item;
      });

      featuredRef.current = nextList;
      setFeaturedItems(nextList);

      if (updatedObj) {
        await upsertFeaturedInfoToStorage(updatedObj);
        if (auth.currentUser && isCloudAdmin) {
          try {
            if (!cloudInitializedRef.current) {
              await syncFeaturedInfoToCloud(nextList);
              cloudInitializedRef.current = true;
              setIsCloudInitialized(true);
            } else {
              await upsertCloudFeaturedInfo(updatedObj);
            }
          } catch (err) {
            console.warn('Falha ao atualizar destaque na nuvem:', err);
          }
        }
      }
    },
    [isCloudAdmin]
  );

  // Toggle active status (sair no destaque)
  const toggleActive = useCallback(
    async (id: string) => {
      hasMutatedRef.current = true;
      let targetItem: FeaturedInfoItem | null = null;
      const nextList = featuredRef.current.map((item) => {
        if (item.id === id) {
          targetItem = { ...item, isActive: !item.isActive, updatedAt: Date.now() };
          return targetItem;
        }
        return item;
      });

      featuredRef.current = nextList;
      setFeaturedItems(nextList);

      if (targetItem) {
        await upsertFeaturedInfoToStorage(targetItem);
        if (auth.currentUser && isCloudAdmin) {
          try {
            if (!cloudInitializedRef.current) {
              await syncFeaturedInfoToCloud(nextList);
              cloudInitializedRef.current = true;
              setIsCloudInitialized(true);
            } else {
              await upsertCloudFeaturedInfo(targetItem);
            }
          } catch (err) {
            console.warn('Falha ao atualizar visibilidade na nuvem:', err);
          }
        }
      }
    },
    [isCloudAdmin]
  );

  // Delete featured info permanently
  const deleteFeaturedItem = useCallback(
    async (id: string) => {
      hasMutatedRef.current = true;
      const nextList = featuredRef.current.filter((item) => item.id !== id);
      featuredRef.current = nextList;
      setFeaturedItems(nextList);
      await deleteFeaturedInfoPermanently(id);

      if (auth.currentUser && isCloudAdmin) {
        try {
          if (!cloudInitializedRef.current) {
            await syncFeaturedInfoToCloud(nextList);
            cloudInitializedRef.current = true;
            setIsCloudInitialized(true);
          } else {
            await deleteCloudFeaturedInfo(id);
          }
        } catch (err) {
          console.warn('Falha ao eliminar destaque na nuvem:', err);
        }
      }
    },
    [isCloudAdmin]
  );

  // Reset to default
  const resetToDefault = useCallback(async () => {
    hasMutatedRef.current = true;
    const defaults = await resetFeaturedInfoToDefault();
    featuredRef.current = defaults;
    setFeaturedItems(defaults);

    if (auth.currentUser && isCloudAdmin) {
      try {
        await syncFeaturedInfoToCloud(defaults);
        cloudInitializedRef.current = true;
        setIsCloudInitialized(true);
      } catch (err) {
        console.warn('Falha ao restaurar destaques na nuvem:', err);
      }
    }
  }, [isCloudAdmin]);

  const activeFeaturedItems = featuredItems.filter((item) => item.isActive);

  return {
    featuredItems,
    activeFeaturedItems,
    isLoading,
    hasCloudLoaded,
    isCloudInitialized,
    syncFeaturedToCloud,
    addFeaturedItem,
    updateFeaturedItem,
    toggleActive,
    deleteFeaturedItem,
    resetToDefault,
  };
}
