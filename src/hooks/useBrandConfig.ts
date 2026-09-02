import { useState, useEffect } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';
import { 
  saveBrandLogoToDB, 
  loadBrandLogoFromDB, 
  BRAND_LOGO_LS_KEY, 
  BRAND_INFO_LS_KEY 
} from '../utils/persistentDB';

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

  // Reconcile with IndexedDB on mount (bulletproof persistence)
  useEffect(() => {
    let isMounted = true;
    loadBrandLogoFromDB().then((logo) => {
      if (isMounted && logo && logo !== config.logoImage) {
        setConfig((prev) => ({ ...prev, logoImage: logo }));
      }
    }).catch((err) => {
      console.warn('Erro ao sincronizar logótipo do IndexedDB:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to cross-component and cross-tab brand updates in real time
  useEffect(() => {
    const handleBrandEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ logo?: string | null }>;
      if (customEvent.detail && 'logo' in customEvent.detail) {
        setConfig((prev) => ({ ...prev, logoImage: customEvent.detail.logo || null }));
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === BRAND_LOGO_LS_KEY) {
        setConfig((prev) => ({ ...prev, logoImage: e.newValue || null }));
      }
    };

    window.addEventListener('raffa_brand_updated', handleBrandEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('raffa_brand_updated', handleBrandEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const updateLogo = async (fileOrUrl: File | string): Promise<string> => {
    try {
      let finalUrl = '';
      if (typeof fileOrUrl === 'string') {
        finalUrl = fileOrUrl;
      } else {
        finalUrl = await optimizeImage(fileOrUrl, 600, 600, 0.88);
      }

      setConfig((prev) => ({ ...prev, logoImage: finalUrl }));
      await saveBrandLogoToDB(finalUrl);
      return finalUrl;
    } catch (err) {
      console.error('Falha ao gravar logótipo personalizado:', err);
      throw err;
    }
  };

  const removeCustomLogo = async (): Promise<void> => {
    setConfig((prev) => ({ ...prev, logoImage: null }));
    await saveBrandLogoToDB(null);
  };

  return {
    logoImage: config.logoImage,
    companyName: config.companyName,
    slogan: config.slogan,
    subSlogan: config.subSlogan,
    updateLogo,
    removeCustomLogo,
  };
}
