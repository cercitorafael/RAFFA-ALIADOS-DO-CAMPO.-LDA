import { ProductItem } from '../types';
import { PRODUCTS_DATA } from '../data/agroData';

const DB_NAME = 'raffa_agro_database';
const DB_VERSION = 3;
const CATALOG_STORE = 'products_catalog';
const USER_VAULT_STORE = 'user_created_products';
const BRAND_STORE = 'brand_settings';

export const CATALOG_LS_KEY = 'raffa_agro_catalog_v3';
export const USER_VAULT_LS_KEY = 'raffa_agro_user_vault_v3';
export const DELETED_IDS_LS_KEY = 'raffa_agro_deleted_ids_v3';
export const CATALOG_INITIALIZED_KEY = 'raffa_agro_catalog_initialized_v3';
export const BRAND_LOGO_LS_KEY = 'raffa_agro_custom_logo';
export const BRAND_INFO_LS_KEY = 'raffa_agro_custom_brand_info';

const LEGACY_CATALOG_KEY = 'raffa_agro_catalog_v2';
const LEGACY_USER_ITEMS_KEY = 'raffa_agro_user_added_items';

/**
 * Initializes and opens IndexedDB with dedicated stores for catalog, user products and brand settings
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CATALOG_STORE)) {
        db.createObjectStore(CATALOG_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(USER_VAULT_STORE)) {
        db.createObjectStore(USER_VAULT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BRAND_STORE)) {
        db.createObjectStore(BRAND_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Loads deleted IDs to prevent deleted items from ever resurrecting
 */
export function loadDeletedIdsFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {
    console.warn('Error reading deleted IDs:', e);
  }
  return new Set();
}

/**
 * Records a deleted product ID permanently
 */
export function recordDeletedProductId(id: string): void {
  try {
    const set = loadDeletedIdsFromStorage();
    set.add(id);
    localStorage.setItem(DELETED_IDS_LS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error saving deleted ID:', e);
  }
}

/**
 * Brand Logo & Settings Persistence in IndexedDB & LocalStorage
 */
export async function saveBrandLogoToDB(logoData: string | null): Promise<void> {
  // 1. LocalStorage
  try {
    if (logoData) {
      localStorage.setItem(BRAND_LOGO_LS_KEY, logoData);
    } else {
      localStorage.removeItem(BRAND_LOGO_LS_KEY);
    }
  } catch (err) {
    console.warn('LocalStorage brand logo quota reached, relying on IndexedDB:', err);
  }

  // 2. IndexedDB (No 5MB quota limit, permanent durability)
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(BRAND_STORE)) {
      const tx = db.transaction(BRAND_STORE, 'readwrite');
      const store = tx.objectStore(BRAND_STORE);
      if (logoData) {
        store.put({ key: 'logo', value: logoData, updatedAt: Date.now() });
      } else {
        store.delete('logo');
      }
    }
  } catch (err) {
    console.warn('IndexedDB brand logo write error:', err);
  }

  // 3. Dispatch cross-component event so all header/hero/footer logos sync immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_brand_updated', { detail: { logo: logoData } }));
  }
}

export async function loadBrandLogoFromDB(): Promise<string | null> {
  // 1. Try LocalStorage for immediate instant paint
  if (typeof window !== 'undefined') {
    const ls = localStorage.getItem(BRAND_LOGO_LS_KEY);
    if (ls) return ls;
  }

  // 2. Try IndexedDB
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(BRAND_STORE)) return null;
    const tx = db.transaction(BRAND_STORE, 'readonly');
    const store = tx.objectStore(BRAND_STORE);
    const request = store.get('logo');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const res = request.result;
        if (res && res.value) {
          // Re-populate localStorage if possible
          try {
            localStorage.setItem(BRAND_LOGO_LS_KEY, res.value);
          } catch {}
          resolve(res.value);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Load user-added products from dedicated vault (LocalStorage & IndexedDB)
 */
export async function loadUserProductsFromVault(): Promise<ProductItem[]> {
  const userVaultLS = loadUserVaultFromLocalStorage();

  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(USER_VAULT_STORE)) {
      return userVaultLS;
    }
    const transaction = db.transaction(USER_VAULT_STORE, 'readonly');
    const store = transaction.objectStore(USER_VAULT_STORE);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const idbUserItems: ProductItem[] = Array.isArray(request.result) ? request.result : [];
        // Merge IDB and LocalStorage user items without duplicates
        const itemMap = new Map<string, ProductItem>();
        userVaultLS.forEach(item => itemMap.set(item.id, item));
        idbUserItems.forEach(item => itemMap.set(item.id, item));
        resolve(Array.from(itemMap.values()));
      };
      request.onerror = () => {
        resolve(userVaultLS);
      };
    });
  } catch (err) {
    return userVaultLS;
  }
}

/**
 * Save a single user-created product to the permanent vault
 */
export async function saveUserProductToVault(product: ProductItem): Promise<void> {
  const userItem: ProductItem = {
    ...product,
    isUserCreated: true,
    updatedAt: Date.now(),
  };

  // 1. LocalStorage Vault
  try {
    const current = loadUserVaultFromLocalStorage();
    const filtered = current.filter(p => p.id !== userItem.id);
    const updated = [userItem, ...filtered];
    localStorage.setItem(USER_VAULT_LS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('LocalStorage vault write error:', err);
  }

  // 2. IndexedDB Vault
  try {
    const db = await openDB();
    const transaction = db.transaction(USER_VAULT_STORE, 'readwrite');
    const store = transaction.objectStore(USER_VAULT_STORE);
    store.put(userItem);
  } catch (err) {
    console.warn('IndexedDB vault write error:', err);
  }
}

/**
 * Explicit user deletion: removes a product permanently in its totality from all vaults, catalogs, and databases
 */
export async function deleteProductPermanently(productId: string): Promise<void> {
  // 1. Permanently record deletion so factory items or vault never resurrect it
  recordDeletedProductId(productId);

  // 2. Mark catalog as initialized so default items do not auto-repopulate
  try {
    localStorage.setItem(CATALOG_INITIALIZED_KEY, 'true');
  } catch {}

  // 3. Purge from LocalStorage Main Catalog
  try {
    const rawCatalog = localStorage.getItem(CATALOG_LS_KEY);
    if (rawCatalog) {
      const parsed = JSON.parse(rawCatalog);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((p: ProductItem) => p.id !== productId);
        localStorage.setItem(CATALOG_LS_KEY, JSON.stringify(filtered));
      }
    }
  } catch (err) {
    console.warn('LocalStorage catalog delete error:', err);
  }

  // 4. Purge from LocalStorage User Vault
  try {
    const currentVault = loadUserVaultFromLocalStorage();
    const updatedVault = currentVault.filter(p => p.id !== productId);
    localStorage.setItem(USER_VAULT_LS_KEY, JSON.stringify(updatedVault));
  } catch (err) {
    console.warn('LocalStorage vault delete error:', err);
  }

  // 5. Purge from Legacy LocalStorage keys if present
  try {
    const legCat = localStorage.getItem(LEGACY_CATALOG_KEY);
    if (legCat) {
      const parsed = JSON.parse(legCat);
      if (Array.isArray(parsed)) {
        localStorage.setItem(LEGACY_CATALOG_KEY, JSON.stringify(parsed.filter((p: any) => p.id !== productId)));
      }
    }
    const legVault = localStorage.getItem(LEGACY_USER_ITEMS_KEY);
    if (legVault) {
      const parsed = JSON.parse(legVault);
      if (Array.isArray(parsed)) {
        localStorage.setItem(LEGACY_USER_ITEMS_KEY, JSON.stringify(parsed.filter((p: any) => p.id !== productId)));
      }
    }
  } catch {}

  // 6. Purge from IndexedDB Vault & Catalog
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
      const txVault = db.transaction(USER_VAULT_STORE, 'readwrite');
      txVault.objectStore(USER_VAULT_STORE).delete(productId);
    }
    if (db.objectStoreNames.contains(CATALOG_STORE)) {
      const txCatalog = db.transaction(CATALOG_STORE, 'readwrite');
      txCatalog.objectStore(CATALOG_STORE).delete(productId);
    }
  } catch (err) {
    console.warn('IndexedDB vault delete error:', err);
  }

  // 7. Dispatch storage event for instant UI synchronization
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_agro_catalog_changed'));
  }
}

// Alias for backwards compatibility
export const deleteUserProductFromVault = deleteProductPermanently;

/**
 * Eliminates all products in totality from the system (full catalog purge)
 */
export async function clearAllProductsFromStorage(allProductIds?: string[]): Promise<void> {
  // 1. Blacklist all current IDs and default IDs so nothing resurrects
  try {
    const idsToBlacklist = new Set<string>();
    if (allProductIds && allProductIds.length > 0) {
      allProductIds.forEach(id => idsToBlacklist.add(id));
    }
    PRODUCTS_DATA.forEach(p => idsToBlacklist.add(p.id));
    const currentDeleted = loadDeletedIdsFromStorage();
    idsToBlacklist.forEach(id => currentDeleted.add(id));
    localStorage.setItem(DELETED_IDS_LS_KEY, JSON.stringify(Array.from(currentDeleted)));
  } catch (e) {
    console.warn('Error recording batch deletion IDs:', e);
  }

  // 2. Clear LocalStorage keys and lock initialized state as empty
  try {
    localStorage.setItem(CATALOG_LS_KEY, JSON.stringify([]));
    localStorage.setItem(USER_VAULT_LS_KEY, JSON.stringify([]));
    localStorage.setItem(CATALOG_INITIALIZED_KEY, 'true');
    localStorage.removeItem(LEGACY_CATALOG_KEY);
    localStorage.removeItem(LEGACY_USER_ITEMS_KEY);
  } catch (e) {
    console.warn('Error clearing LocalStorage catalog:', e);
  }

  // 3. Clear IndexedDB stores completely
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(CATALOG_STORE)) {
      const txCatalog = db.transaction(CATALOG_STORE, 'readwrite');
      txCatalog.objectStore(CATALOG_STORE).clear();
    }
    if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
      const txVault = db.transaction(USER_VAULT_STORE, 'readwrite');
      txVault.objectStore(USER_VAULT_STORE).clear();
    }
  } catch (err) {
    console.warn('Error clearing IndexedDB stores:', err);
  }

  // 4. Dispatch sync event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_agro_catalog_changed'));
  }
}

/**
 * Loads all saved products from IndexedDB & LocalStorage with GUARANTEED recovery of user items
 */
export async function loadProductsFromStorage(): Promise<ProductItem[]> {
  const deletedIds = loadDeletedIdsFromStorage();
  const isInitialized = typeof window !== 'undefined' ? localStorage.getItem(CATALOG_INITIALIZED_KEY) : null;

  // 1. Always load user-added products from the persistent vault first
  const userProducts = await loadUserProductsFromVault();
  const userProductsMap = new Map<string, ProductItem>();
  userProducts.forEach(p => {
    if (!deletedIds.has(p.id)) {
      userProductsMap.set(p.id, { ...p, isUserCreated: true });
    }
  });

  try {
    const db = await openDB();
    const transaction = db.transaction(CATALOG_STORE, 'readonly');
    const store = transaction.objectStore(CATALOG_STORE);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        let baseList: ProductItem[] = [];

        if (Array.isArray(result) && (result.length > 0 || isInitialized === 'true')) {
          // If initialized and result is empty, it means the user legitimately emptied or deleted products!
          baseList = result;
        } else {
          // Check LocalStorage fallback
          const fallback = loadCatalogFromLocalStorage();
          if (fallback !== null) {
            baseList = fallback;
          } else {
            // First run: load default products and initialize
            baseList = PRODUCTS_DATA;
            if (typeof window !== 'undefined') {
              localStorage.setItem(CATALOG_INITIALIZED_KEY, 'true');
            }
          }
        }

        // Merge saved base list and user products without deleted items
        const mergedMap = new Map<string, ProductItem>();
        baseList.forEach(item => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });
        userProductsMap.forEach((item, id) => {
          if (!deletedIds.has(id)) {
            mergedMap.set(id, item);
          }
        });

        const finalList = Array.from(mergedMap.values());
        saveProductsToStorage(finalList);
        resolve(finalList);
      };

      request.onerror = () => {
        const fallback = loadCatalogFromLocalStorage();
        const baseList = fallback !== null ? fallback : (isInitialized === 'true' ? [] : PRODUCTS_DATA);
        const mergedMap = new Map<string, ProductItem>();
        baseList.forEach(item => {
          if (!deletedIds.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });
        userProductsMap.forEach((item, id) => {
          if (!deletedIds.has(id)) {
            mergedMap.set(id, item);
          }
        });
        resolve(Array.from(mergedMap.values()));
      };
    });
  } catch (err) {
    console.warn('IndexedDB catalog read error, using LocalStorage fallback:', err);
    const fallback = loadCatalogFromLocalStorage();
    const baseList = fallback !== null ? fallback : (isInitialized === 'true' ? [] : PRODUCTS_DATA);
    const mergedMap = new Map<string, ProductItem>();
    baseList.forEach(item => {
      if (!deletedIds.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });
    userProductsMap.forEach((item, id) => {
      if (!deletedIds.has(id)) {
        mergedMap.set(id, item);
      }
    });
    return Array.from(mergedMap.values());
  }
}

/**
 * Persists products to both IndexedDB and LocalStorage with dual-redundancy
 */
export async function saveProductsToStorage(products: ProductItem[]): Promise<void> {
  const defaultIds = new Set(PRODUCTS_DATA.map(p => p.id));
  
  // Extract user-created products (flagged or non-default ID)
  const userItems = products.filter(p => p.isUserCreated || !defaultIds.has(p.id)).map(p => ({
    ...p,
    isUserCreated: true,
  }));

  // 1. Save to LocalStorage (Main Catalog + User Vault)
  try {
    localStorage.setItem(CATALOG_LS_KEY, JSON.stringify(products));
    localStorage.setItem(USER_VAULT_LS_KEY, JSON.stringify(userItems));
  } catch (err) {
    console.warn('LocalStorage quota reached, optimizing payload for LocalStorage fallback:', err);
    try {
      // If quota exceeded, save essential metadata without large base64 strings in LS fallback
      const lightCatalog = products.map(p => {
        if (p.image && p.image.startsWith('data:image') && p.image.length > 50000) {
          return { ...p, image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80' };
        }
        return p;
      });
      localStorage.setItem(CATALOG_LS_KEY, JSON.stringify(lightCatalog));
      localStorage.setItem(USER_VAULT_LS_KEY, JSON.stringify(userItems));
    } catch (e2) {
      console.warn('LocalStorage fallback failed, relying exclusively on IndexedDB:', e2);
    }
  }

  // 2. Save to IndexedDB (No quota limits, full high-res images preserved)
  try {
    const db = await openDB();
    
    // Save Catalog
    const txCatalog = db.transaction(CATALOG_STORE, 'readwrite');
    const catalogStore = txCatalog.objectStore(CATALOG_STORE);
    catalogStore.clear();
    products.forEach((prod) => {
      catalogStore.put(prod);
    });

    // Save User Vault Store
    if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
      const txVault = db.transaction(USER_VAULT_STORE, 'readwrite');
      const vaultStore = txVault.objectStore(USER_VAULT_STORE);
      vaultStore.clear();
      userItems.forEach((prod) => {
        vaultStore.put(prod);
      });
    }
  } catch (err) {
    console.error('Error saving to IndexedDB:', err);
  }
}

/**
 * Reads user items from LocalStorage
 */
export function loadUserVaultFromLocalStorage(): ProductItem[] {
  try {
    const raw = localStorage.getItem(USER_VAULT_LS_KEY) || localStorage.getItem(LEGACY_USER_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(p => ({ ...p, isUserCreated: true }));
      }
    }
  } catch (e) {
    console.warn('Error reading user vault from localStorage:', e);
  }
  return [];
}

/**
 * Reads active catalog from LocalStorage
 */
export function loadCatalogFromLocalStorage(): ProductItem[] | null {
  try {
    const isInitialized = typeof window !== 'undefined' ? localStorage.getItem(CATALOG_INITIALIZED_KEY) : null;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CATALOG_LS_KEY) : null;
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    if (!isInitialized && typeof window !== 'undefined') {
      const legacy = localStorage.getItem(LEGACY_CATALOG_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading catalog from localStorage:', e);
  }
  return null;
}

/**
 * Resets recorded deletions (used when user requests factory reset)
 */
export function clearDeletedIds(): void {
  try {
    localStorage.removeItem(DELETED_IDS_LS_KEY);
  } catch (e) {
    console.warn('Error clearing deleted IDs:', e);
  }
}

