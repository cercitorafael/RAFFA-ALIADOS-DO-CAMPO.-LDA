import { useState, useEffect, useRef, useCallback } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';
import { auth } from '../firebase';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import {
  saveBrandLogoToDB,
  loadBrandLogoFromDB,
  BRAND_LOGO_LS_KEY,
  BRAND_INFO_LS_KEY,
} from '../utils/persistentDB';
import { subscribeCloudBrandLogo, saveCloudBrandLogo } from '../utils/cloudSync';

export interface BrandConfig {
  logoImage: string | null;
  companyName: string;
  slogan: string;
  subSlogan: string;
}

const DEFAULT_BRAND_CONFIG: BrandConfig = {
  logoImage: null,
  companyName: 'RAFFA Aliados do Campo',
  slogan: 'Foco no Agro • Ganho no Campo',
  subSlogan: 'A Sua Parceria para o Sucesso no Campo',
};

export function useBrandConfig() {
  const { isCloudAdmin } = useFirebaseAuth();

  const [config, setConfig] = useState<BrandConfig>(() => {
    try {
      const savedLogo = typeof window !== 'undefined' ? localStorage.getItem(BRAND_LOGO_LS_KEY) : null;
      const savedInfo = typeof window !== 'undefined' ? localStorage.getItem(BRAND_INFO_LS_KEY) : null;
      const parsedInfo = savedInfo ? JSON.parse(savedInfo) : {};
      return {
        ...DEFAULT_BRAND_CONFIG,
        ...parsedInfo,
        logoImage: savedLogo || null,
      };
    } catch (e) {
      console.warn('Erro ao carregar configurações de marca:', e);
      return DEFAULT_BRAND_CONFIG;
    }
  });

  const cloudLogoReceivedRef = useRef(false);
  const logoRef = useRef<string | null>(config.logoImage);

  useEffect(() => {
    logoRef.current = config.logoImage;
  }, [config.logoImage]);

  // Reconcile with IndexedDB on mount (offline cache)
  useEffect(() => {
    let isMounted = true;
    loadBrandLogoFromDB()
      .then((logo) => {
        if (isMounted && !cloudLogoReceivedRef.current && logo && logo !== logoRef.current) {
          logoRef.current = logo;
          setConfig((prev) => ({ ...prev, logoImage: logo }));
        }
      })
      .catch((err) => {
        console.warn('Erro ao sincronizar logótipo do IndexedDB:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to Firestore cloud brand logo
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeCloudBrandLogo((cloudLogo) => {
      if (!isMounted) return;
      cloudLogoReceivedRef.current = true;
      if (cloudLogo !== logoRef.current) {
        logoRef.current = cloudLogo;
        setConfig((prev) => ({ ...prev, logoImage: cloudLogo }));
        void saveBrandLogoToDB(cloudLogo);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Listen to cross-component and cross-tab brand updates in real time
  useEffect(() => {
    const handleBrandEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ logo?: string | null }>;
      if (customEvent.detail && 'logo' in customEvent.detail) {
        const nextLogo = customEvent.detail.logo || null;
        logoRef.current = nextLogo;
        setConfig((prev) => ({ ...prev, logoImage: nextLogo }));
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === BRAND_LOGO_LS_KEY) {
        const nextLogo = e.newValue || null;
        logoRef.current = nextLogo;
        setConfig((prev) => ({ ...prev, logoImage: nextLogo }));
      }
    };

    window.addEventListener('raffa_brand_updated', handleBrandEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('raffa_brand_updated', handleBrandEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const syncLogoToCloud = useCallback(async () => {
    if (!auth.currentUser || !isCloudAdmin || !logoRef.current) return false;
    await saveCloudBrandLogo(logoRef.current);
    return true;
  }, [isCloudAdmin]);

  const updateLogo = async (fileOrUrl: File | string): Promise<string> => {
    try {
      let finalUrl = '';
      if (typeof fileOrUrl === 'string') {
        finalUrl = fileOrUrl;
      } else {
        finalUrl = await optimizeImage(fileOrUrl, 1200, 1200, 0.92);
      }

      logoRef.current = finalUrl;
      setConfig((prev) => ({ ...prev, logoImage: finalUrl }));
      await saveBrandLogoToDB(finalUrl);

      if (auth.currentUser && isCloudAdmin) {
        try {
          await saveCloudBrandLogo(finalUrl);
        } catch (cloudErr) {
          console.warn('Falha ao gravar logótipo na nuvem:', cloudErr);
        }
      }

      return finalUrl;
    } catch (err) {
      console.error('Falha ao gravar logótipo personalizado:', err);
      throw err;
    }
  };

  const removeCustomLogo = async (): Promise<void> => {
    logoRef.current = null;
    setConfig((prev) => ({ ...prev, logoImage: null }));
    await saveBrandLogoToDB(null);

    if (auth.currentUser && isCloudAdmin) {
      try {
        await saveCloudBrandLogo(null);
      } catch (cloudErr) {
        console.warn('Falha ao remover logótipo na nuvem:', cloudErr);
      }
    }
  };

  return {
    logoImage: config.logoImage,
    companyName: config.companyName,
    slogan: config.slogan,
    subSlogan: config.subSlogan,
    updateLogo,
    removeCustomLogo,
    syncLogoToCloud,
  };
}
