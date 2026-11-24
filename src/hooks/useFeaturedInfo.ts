import { useState, useEffect, useCallback, useRef } from 'react';
import { FeaturedInfoItem } from '../types';
import {
  loadFeaturedInfoFromLocalStorageSync,
  loadFeaturedInfoFromStorage,
  saveFeaturedInfoToStorage,
  upsertFeaturedInfoToStorage,
  deleteFeaturedInfoPermanently,
  resetFeaturedInfoToDefault,
  FEATURED_LS_KEY,
  FEATURED_DELETED_LS_KEY,
} from '../utils/persistentDB';

export function useFeaturedInfo() {
  const [featuredItems, setFeaturedItems] = useState<FeaturedInfoItem[]>(() =>
    loadFeaturedInfoFromLocalStorageSync()
  );
  const [isLoading, setIsLoading] = useState(true);
  const hasMutatedRef = useRef(false);
  const isFirstRender = useRef(true);

  // Load full-resolution unlimited featured items from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    loadFeaturedInfoFromStorage()
      .then((items) => {
        if (isMounted && !hasMutatedRef.current) {
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

  // Multi-tab and cross-component sync
  useEffect(() => {
    const handleSync = () => {
      loadFeaturedInfoFromStorage()
        .then((items) => setFeaturedItems(items))
        .catch(() => setFeaturedItems(loadFeaturedInfoFromLocalStorageSync()));
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

  // Add new featured info (persists permanently in unlimited IndexedDB)
  const addFeaturedItem = useCallback(
    async (newItem: Omit<FeaturedInfoItem, 'id' | 'createdAt'>) => {
      hasMutatedRef.current = true;
      const createdItem: FeaturedInfoItem = {
        ...newItem,
        id: 'info-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setFeaturedItems((prev) => [createdItem, ...prev]);
      await upsertFeaturedInfoToStorage(createdItem);

      return createdItem;
    },
    []
  );

  // Update existing featured info
  const updateFeaturedItem = useCallback(
    async (id: string, updates: Partial<FeaturedInfoItem>) => {
      hasMutatedRef.current = true;
      let updatedObj: FeaturedInfoItem | null = null;
      setFeaturedItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updatedObj = { ...item, ...updates, updatedAt: Date.now() };
            return updatedObj;
          }
          return item;
        })
      );

      if (updatedObj) {
        await upsertFeaturedInfoToStorage(updatedObj);
      }
    },
    []
  );

  // Toggle active status (sair no destaque)
  const toggleActive = useCallback(async (id: string) => {
    hasMutatedRef.current = true;
    let targetItem: FeaturedInfoItem | null = null;
    setFeaturedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          targetItem = { ...item, isActive: !item.isActive, updatedAt: Date.now() };
          return targetItem;
        }
        return item;
      })
    );

    if (targetItem) {
      await upsertFeaturedInfoToStorage(targetItem);
    }
  }, []);

  // Delete featured info permanently (never resurrects)
  const deleteFeaturedItem = useCallback(async (id: string) => {
    hasMutatedRef.current = true;
    setFeaturedItems((prev) => prev.filter((item) => item.id !== id));
    await deleteFeaturedInfoPermanently(id);
  }, []);

  // Reset to default
  const resetToDefault = useCallback(async () => {
    hasMutatedRef.current = true;
    const defaults = await resetFeaturedInfoToDefault();
    setFeaturedItems(defaults);
  }, []);

  const activeFeaturedItems = featuredItems.filter((item) => item.isActive);

  return {
    featuredItems,
    activeFeaturedItems,
    isLoading,
    addFeaturedItem,
    updateFeaturedItem,
    toggleActive,
    deleteFeaturedItem,
    resetToDefault,
  };
}
