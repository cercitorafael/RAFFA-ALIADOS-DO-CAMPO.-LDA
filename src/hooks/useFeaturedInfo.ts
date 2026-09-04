import { useState, useEffect, useCallback } from 'react';
import { FeaturedInfoItem } from '../types';
import { INITIAL_FEATURED_INFO } from '../data/featuredInfoData';
import { 
  fetchFeaturedInfoFromCloud, 
  upsertFeaturedInfoToCloud, 
  deleteFeaturedInfoFromCloud 
} from '../lib/supabase';

const STORAGE_KEY = 'raffa_featured_info_vault';

export function useFeaturedInfo() {
  const [featuredItems, setFeaturedItems] = useState<FeaturedInfoItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar informações em destaque locais:', e);
    }
    return INITIAL_FEATURED_INFO;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(featuredItems));
    } catch (err) {
      console.error('Falha ao guardar informações em destaque no localStorage:', err);
    }
  }, [featuredItems]);

  // Pull from Cloud on mount if available
  useEffect(() => {
    let isMounted = true;
    async function loadCloudInfo() {
      try {
        setIsLoading(true);
        const cloudData = await fetchFeaturedInfoFromCloud();
        if (isMounted && cloudData && cloudData.length > 0) {
          setFeaturedItems(cloudData);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar informações em destaque com Supabase:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCloudInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Add new featured info
  const addFeaturedItem = useCallback(async (newItem: Omit<FeaturedInfoItem, 'id' | 'createdAt'>) => {
    const createdItem: FeaturedInfoItem = {
      ...newItem,
      id: 'info-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setFeaturedItems((prev) => [createdItem, ...prev]);

    // Upsert to Supabase
    upsertFeaturedInfoToCloud(createdItem).catch((err) => {
      console.warn('Erro em background ao enviar info para Supabase:', err);
    });

    return createdItem;
  }, []);

  // Update existing featured info
  const updateFeaturedItem = useCallback(async (id: string, updates: Partial<FeaturedInfoItem>) => {
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
      upsertFeaturedInfoToCloud(updatedObj).catch((err) => {
        console.warn('Erro ao atualizar info no Supabase:', err);
      });
    }
  }, []);

  // Toggle active status (sair no destaque)
  const toggleActive = useCallback(async (id: string) => {
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
      upsertFeaturedInfoToCloud(targetItem).catch((err) => {
        console.warn('Erro ao alternar destaque no Supabase:', err);
      });
    }
  }, []);

  // Delete featured info
  const deleteFeaturedItem = useCallback(async (id: string) => {
    setFeaturedItems((prev) => prev.filter((item) => item.id !== id));
    deleteFeaturedInfoFromCloud(id).catch((err) => {
      console.warn('Erro ao apagar info no Supabase:', err);
    });
  }, []);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setFeaturedItems(INITIAL_FEATURED_INFO);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FEATURED_INFO));
    INITIAL_FEATURED_INFO.forEach((item) => {
      upsertFeaturedInfoToCloud(item).catch(() => {});
    });
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
