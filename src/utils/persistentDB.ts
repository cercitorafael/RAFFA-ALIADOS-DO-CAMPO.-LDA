import { FeaturedInfoItem, ProductItem, QuoteFormData } from '../types';
import { PRODUCTS_DATA } from '../data/agroData';
import { INITIAL_FEATURED_INFO } from '../data/featuredInfoData';

const DB_NAME = 'raffa_agro_database';
const DB_VERSION = 4;

const CATALOG_STORE = 'products_catalog';
const USER_VAULT_STORE = 'user_created_products';
const BRAND_STORE = 'brand_settings';
const FEATURED_STORE = 'featured_info';
const DELETED_STORE = 'deleted_items';
const META_STORE = 'app_metadata';
const QUOTES_STORE = 'quotes';
const CONTACTS_STORE = 'contact_messages';

export const CATALOG_LS_KEY = 'raffa_agro_catalog_v3';
export const USER_VAULT_LS_KEY = 'raffa_agro_user_vault_v3';
export const DELETED_IDS_LS_KEY = 'raffa_agro_deleted_ids_v3';
export const CATALOG_INITIALIZED_KEY = 'raffa_agro_catalog_initialized_v3';
export const BRAND_LOGO_LS_KEY = 'raffa_agro_custom_logo';
export const BRAND_INFO_LS_KEY = 'raffa_agro_custom_brand_info';

export const FEATURED_LS_KEY = 'raffa_featured_info_vault';
export const FEATURED_DELETED_LS_KEY = 'raffa_featured_deleted_ids_v1';
export const FEATURED_INITIALIZED_KEY = 'raffa_featured_initialized_v1';

const LEGACY_CATALOG_KEY = 'raffa_agro_catalog_v2';
const LEGACY_USER_ITEMS_KEY = 'raffa_agro_user_added_items';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80';

let persistRequested = false;

/**
 * Requests browser Persistent Storage permission so IndexedDB uses unlimited
 * local quota without automatic browser eviction.
 */
export async function requestUnlimitedPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  if (persistRequested) return true;
  persistRequested = true;
  try {
    const alreadyPersisted = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false;
    if (alreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Serialized write queue to prevent concurrent IndexedDB transactions
 * from overwriting newer additions or deletions.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(task, task);
  writeQueue = next.catch(() => undefined);
  return next;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

function reqPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Initializes and opens IndexedDB with dedicated stores for unlimited local persistence.
 */
function openDB(): Promise<IDBDatabase> {
  void requestUnlimitedPersistentStorage();

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
      if (!db.objectStoreNames.contains(FEATURED_STORE)) {
        db.createObjectStore(FEATURED_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DELETED_STORE)) {
        db.createObjectStore(DELETED_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(QUOTES_STORE)) {
        db.createObjectStore(QUOTES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CONTACTS_STORE)) {
        db.createObjectStore(CONTACTS_STORE, { keyPath: 'id' });
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

function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeGetLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemoveLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

async function getMetaFlag(db: IDBDatabase, key: string): Promise<boolean> {
  if (!db.objectStoreNames.contains(META_STORE)) return false;
  try {
    const tx = db.transaction(META_STORE, 'readonly');
    const res = await reqPromise<{ key: string; value: boolean } | undefined>(
      tx.objectStore(META_STORE).get(key)
    );
    return Boolean(res?.value);
  } catch {
    return false;
  }
}

function putMetaFlagInTx(tx: IDBTransaction, key: string, value: boolean): void {
  if (tx.objectStoreNames.contains(META_STORE)) {
    tx.objectStore(META_STORE).put({ key, value, updatedAt: Date.now() });
  }
}

async function getDeletedIdsFromIDB(db: IDBDatabase, storeKey: 'products' | 'featured_info'): Promise<Set<string>> {
  if (!db.objectStoreNames.contains(DELETED_STORE)) return new Set();
  try {
    const tx = db.transaction(DELETED_STORE, 'readonly');
    const res = await reqPromise<{ key: string; ids: string[] } | undefined>(
      tx.objectStore(DELETED_STORE).get(storeKey)
    );
    if (res && Array.isArray(res.ids)) {
      return new Set(res.ids);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function stripLargeImagesForLS<T extends { image?: string; imageUrl?: string }>(items: T[]): T[] {
  return items.map((item) => {
    const copy = { ...item };
    if (copy.image && copy.image.startsWith('data:image') && copy.image.length > 40000) {
      copy.image = FALLBACK_IMAGE;
    }
    if (copy.imageUrl && copy.imageUrl.startsWith('data:image') && copy.imageUrl.length > 40000) {
      copy.imageUrl = FALLBACK_IMAGE;
    }
    return copy;
  });
}

// ============================================================================
// DELETED IDS TOMBSTONES (PRODUCTS)
// ============================================================================

/**
 * Loads deleted product IDs synchronously from LocalStorage
 */
export function loadDeletedIdsFromStorage(): Set<string> {
  try {
    const raw = safeGetLocalStorage(DELETED_IDS_LS_KEY);
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
 * Loads the union of deleted product IDs from both LocalStorage and IndexedDB
 */
async function loadAllDeletedProductIds(db?: IDBDatabase): Promise<Set<string>> {
  const lsSet = loadDeletedIdsFromStorage();
  try {
    const database = db || (await openDB());
    const idbSet = await getDeletedIdsFromIDB(database, 'products');
    idbSet.forEach((id) => lsSet.add(id));
    // Keep LocalStorage synced with union if possible
    if (lsSet.size > 0) {
      safeSetLocalStorage(DELETED_IDS_LS_KEY, JSON.stringify(Array.from(lsSet)));
    }
  } catch {
    // fallback to LS set
  }
  return lsSet;
}

/**
 * Records a deleted product ID permanently in LocalStorage and IndexedDB
 */
export function recordDeletedProductId(id: string): void {
  try {
    const set = loadDeletedIdsFromStorage();
    set.add(id);
    safeSetLocalStorage(DELETED_IDS_LS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Error saving deleted ID:', e);
  }
}

/**
 * Resets recorded product deletions (only when user explicitly restores factory defaults)
 */
export function clearDeletedIds(): void {
  safeRemoveLocalStorage(DELETED_IDS_LS_KEY);
  void enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (db.objectStoreNames.contains(DELETED_STORE)) {
        const tx = db.transaction(DELETED_STORE, 'readwrite');
        tx.objectStore(DELETED_STORE).put({ key: 'products', ids: [] });
        await txDone(tx);
      }
    } catch (e) {
      console.warn('Error clearing deleted IDs from IndexedDB:', e);
    }
  });
}

// ============================================================================
// BRAND LOGO & SETTINGS PERSISTENCE
// ============================================================================

export async function saveBrandLogoToDB(logoData: string | null): Promise<void> {
  if (logoData) {
    safeSetLocalStorage(BRAND_LOGO_LS_KEY, logoData);
  } else {
    safeRemoveLocalStorage(BRAND_LOGO_LS_KEY);
  }

  await enqueueWrite(async () => {
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
        await txDone(tx);
      }
    } catch (err) {
      console.warn('IndexedDB brand logo write error:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_brand_updated', { detail: { logo: logoData } }));
  }
}

export async function loadBrandLogoFromDB(): Promise<string | null> {
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(BRAND_STORE)) {
      const tx = db.transaction(BRAND_STORE, 'readonly');
      const res = await reqPromise<{ key: string; value: string } | undefined>(
        tx.objectStore(BRAND_STORE).get('logo')
      );
      if (res && res.value) {
        safeSetLocalStorage(BRAND_LOGO_LS_KEY, res.value);
        return res.value;
      }
    }
  } catch {
    // fallback to LocalStorage
  }

  return safeGetLocalStorage(BRAND_LOGO_LS_KEY);
}

// ============================================================================
// PRODUCTS CATALOG & USER VAULT PERSISTENCE (UNLIMITED LOCAL STORAGE)
// ============================================================================

export function loadUserVaultFromLocalStorage(): ProductItem[] {
  try {
    const raw =
      safeGetLocalStorage(USER_VAULT_LS_KEY) || safeGetLocalStorage(LEGACY_USER_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => ({ ...p, isUserCreated: true }));
      }
    }
  } catch (e) {
    console.warn('Error reading user vault from localStorage:', e);
  }
  return [];
}

export function loadCatalogFromLocalStorage(): ProductItem[] | null {
  try {
    const isInitialized = safeGetLocalStorage(CATALOG_INITIALIZED_KEY);
    const raw = safeGetLocalStorage(CATALOG_LS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    if (!isInitialized) {
      const legacy = safeGetLocalStorage(LEGACY_CATALOG_KEY);
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
 * Load user-added products from dedicated vault (IndexedDB prioritized over LocalStorage)
 */
export async function loadUserProductsFromVault(): Promise<ProductItem[]> {
  const deletedIds = await loadAllDeletedProductIds();
  const userVaultLS = loadUserVaultFromLocalStorage().filter((p) => !deletedIds.has(p.id));

  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(USER_VAULT_STORE)) {
      return userVaultLS;
    }
    const tx = db.transaction(USER_VAULT_STORE, 'readonly');
    const result = await reqPromise<ProductItem[]>(tx.objectStore(USER_VAULT_STORE).getAll());
    const idbUserItems: ProductItem[] = Array.isArray(result) ? result : [];

    const itemMap = new Map<string, ProductItem>();
    userVaultLS.forEach((item) => {
      if (!deletedIds.has(item.id)) itemMap.set(item.id, item);
    });
    // IndexedDB takes priority because it always holds full-resolution images
    idbUserItems.forEach((item) => {
      if (!deletedIds.has(item.id)) itemMap.set(item.id, { ...item, isUserCreated: true });
    });

    return Array.from(itemMap.values());
  } catch {
    return userVaultLS;
  }
}

/**
 * Save a single user-created or edited product to the permanent vault
 */
export async function saveUserProductToVault(product: ProductItem): Promise<void> {
  const userItem: ProductItem = {
    ...product,
    isUserCreated: true,
    updatedAt: Date.now(),
  };

  // Ensure if a product with this ID is explicitly added/saved, it is NOT in deleted list
  try {
    const deleted = loadDeletedIdsFromStorage();
    if (deleted.has(userItem.id)) {
      deleted.delete(userItem.id);
      safeSetLocalStorage(DELETED_IDS_LS_KEY, JSON.stringify(Array.from(deleted)));
    }
  } catch {
    // ignore
  }

  // 1. LocalStorage Vault (best-effort fast cache)
  try {
    const current = loadUserVaultFromLocalStorage();
    const filtered = current.filter((p) => p.id !== userItem.id);
    const updated = [userItem, ...filtered];
    if (!safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(updated))) {
      safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(stripLargeImagesForLS(updated)));
    }
  } catch (err) {
    console.warn('LocalStorage vault write warning:', err);
  }

  // 2. IndexedDB Vault (Unlimited storage, awaits commit)
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) storesToUse.push(USER_VAULT_STORE);
      if (db.objectStoreNames.contains(DELETED_STORE)) storesToUse.push(DELETED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const tx = db.transaction(storesToUse, 'readwrite');
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
        tx.objectStore(USER_VAULT_STORE).put(userItem);
      }
      if (db.objectStoreNames.contains(DELETED_STORE)) {
        const deletedReq = tx.objectStore(DELETED_STORE).get('products');
        deletedReq.onsuccess = () => {
          const existing = deletedReq.result?.ids;
          if (Array.isArray(existing) && existing.includes(userItem.id)) {
            tx.objectStore(DELETED_STORE).put({
              key: 'products',
              ids: existing.filter((id: string) => id !== userItem.id),
            });
          }
        };
      }
      putMetaFlagInTx(tx, 'catalog_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.warn('IndexedDB vault write error:', err);
    }
  });
}

/**
 * Explicit user deletion: removes a product permanently in its totality from all vaults and databases
 */
export async function deleteProductPermanently(productId: string): Promise<void> {
  // 1. Permanently record deletion in LocalStorage immediately
  recordDeletedProductId(productId);
  safeSetLocalStorage(CATALOG_INITIALIZED_KEY, 'true');

  // 2. Purge from LocalStorage Main Catalog
  try {
    const rawCatalog = safeGetLocalStorage(CATALOG_LS_KEY);
    if (rawCatalog) {
      const parsed = JSON.parse(rawCatalog);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((p: ProductItem) => p.id !== productId);
        if (!safeSetLocalStorage(CATALOG_LS_KEY, JSON.stringify(filtered))) {
          safeSetLocalStorage(CATALOG_LS_KEY, JSON.stringify(stripLargeImagesForLS(filtered)));
        }
      }
    }
  } catch (err) {
    console.warn('LocalStorage catalog delete error:', err);
  }

  // 3. Purge from LocalStorage User Vault
  try {
    const currentVault = loadUserVaultFromLocalStorage();
    const updatedVault = currentVault.filter((p) => p.id !== productId);
    if (!safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(updatedVault))) {
      safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(stripLargeImagesForLS(updatedVault)));
    }
  } catch (err) {
    console.warn('LocalStorage vault delete error:', err);
  }

  // 4. Purge from Legacy LocalStorage keys if present
  try {
    const legCat = safeGetLocalStorage(LEGACY_CATALOG_KEY);
    if (legCat) {
      const parsed = JSON.parse(legCat);
      if (Array.isArray(parsed)) {
        safeSetLocalStorage(
          LEGACY_CATALOG_KEY,
          JSON.stringify(parsed.filter((p: ProductItem) => p.id !== productId))
        );
      }
    }
    const legVault = safeGetLocalStorage(LEGACY_USER_ITEMS_KEY);
    if (legVault) {
      const parsed = JSON.parse(legVault);
      if (Array.isArray(parsed)) {
        safeSetLocalStorage(
          LEGACY_USER_ITEMS_KEY,
          JSON.stringify(parsed.filter((p: ProductItem) => p.id !== productId))
        );
      }
    }
  } catch {
    // ignore
  }

  // 5. Purge from IndexedDB Vault, Catalog & record permanent tombstone
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) storesToUse.push(USER_VAULT_STORE);
      if (db.objectStoreNames.contains(CATALOG_STORE)) storesToUse.push(CATALOG_STORE);
      if (db.objectStoreNames.contains(DELETED_STORE)) storesToUse.push(DELETED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const existingIDBDeleted = await getDeletedIdsFromIDB(db, 'products');
      const unionDeleted = new Set<string>([
        ...Array.from(existingIDBDeleted),
        ...Array.from(loadDeletedIdsFromStorage()),
        productId,
      ]);

      const tx = db.transaction(storesToUse, 'readwrite');
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
        tx.objectStore(USER_VAULT_STORE).delete(productId);
      }
      if (db.objectStoreNames.contains(CATALOG_STORE)) {
        tx.objectStore(CATALOG_STORE).delete(productId);
      }
      if (db.objectStoreNames.contains(DELETED_STORE)) {
        tx.objectStore(DELETED_STORE).put({
          key: 'products',
          ids: Array.from(unionDeleted),
        });
      }
      putMetaFlagInTx(tx, 'catalog_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.warn('IndexedDB vault delete error:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_agro_catalog_changed'));
  }
}

export const deleteUserProductFromVault = deleteProductPermanently;

/**
 * Eliminates multiple products permanently in a single atomic batch
 */
export async function deleteMultipleProductsPermanently(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  const idSet = new Set(productIds);

  // 1. Update LocalStorage tombstones & caches immediately
  const deletedLS = loadDeletedIdsFromStorage();
  productIds.forEach((id) => deletedLS.add(id));
  safeSetLocalStorage(DELETED_IDS_LS_KEY, JSON.stringify(Array.from(deletedLS)));
  safeSetLocalStorage(CATALOG_INITIALIZED_KEY, 'true');

  try {
    const rawCatalog = safeGetLocalStorage(CATALOG_LS_KEY);
    if (rawCatalog) {
      const parsed = JSON.parse(rawCatalog);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((p: ProductItem) => !idSet.has(p.id));
        if (!safeSetLocalStorage(CATALOG_LS_KEY, JSON.stringify(filtered))) {
          safeSetLocalStorage(CATALOG_LS_KEY, JSON.stringify(stripLargeImagesForLS(filtered)));
        }
      }
    }
    const currentVault = loadUserVaultFromLocalStorage().filter((p) => !idSet.has(p.id));
    if (!safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(currentVault))) {
      safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(stripLargeImagesForLS(currentVault)));
    }
  } catch {
    // ignore
  }

  // 2. Atomic IndexedDB batch delete + tombstones
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) storesToUse.push(USER_VAULT_STORE);
      if (db.objectStoreNames.contains(CATALOG_STORE)) storesToUse.push(CATALOG_STORE);
      if (db.objectStoreNames.contains(DELETED_STORE)) storesToUse.push(DELETED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const existingIDBDeleted = await getDeletedIdsFromIDB(db, 'products');
      const unionDeleted = new Set<string>([
        ...Array.from(existingIDBDeleted),
        ...Array.from(loadDeletedIdsFromStorage()),
        ...productIds,
      ]);

      const tx = db.transaction(storesToUse, 'readwrite');
      productIds.forEach((id) => {
        if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
          tx.objectStore(USER_VAULT_STORE).delete(id);
        }
        if (db.objectStoreNames.contains(CATALOG_STORE)) {
          tx.objectStore(CATALOG_STORE).delete(id);
        }
      });
      if (db.objectStoreNames.contains(DELETED_STORE)) {
        tx.objectStore(DELETED_STORE).put({
          key: 'products',
          ids: Array.from(unionDeleted),
        });
      }
      putMetaFlagInTx(tx, 'catalog_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.warn('IndexedDB batch delete error:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_agro_catalog_changed'));
  }
}

/**
 * Eliminates all products in totality from the system (full catalog purge)
 */
export async function clearAllProductsFromStorage(allProductIds?: string[]): Promise<void> {
  const idsToBlacklist = new Set<string>();
  if (allProductIds && allProductIds.length > 0) {
    allProductIds.forEach((id) => idsToBlacklist.add(id));
  }
  PRODUCTS_DATA.forEach((p) => idsToBlacklist.add(p.id));
  const currentDeleted = loadDeletedIdsFromStorage();
  idsToBlacklist.forEach((id) => currentDeleted.add(id));

  safeSetLocalStorage(DELETED_IDS_LS_KEY, JSON.stringify(Array.from(currentDeleted)));
  safeSetLocalStorage(CATALOG_LS_KEY, JSON.stringify([]));
  safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify([]));
  safeSetLocalStorage(CATALOG_INITIALIZED_KEY, 'true');
  safeRemoveLocalStorage(LEGACY_CATALOG_KEY);
  safeRemoveLocalStorage(LEGACY_USER_ITEMS_KEY);

  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(CATALOG_STORE)) storesToUse.push(CATALOG_STORE);
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) storesToUse.push(USER_VAULT_STORE);
      if (db.objectStoreNames.contains(DELETED_STORE)) storesToUse.push(DELETED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const existingIDBDeleted = await getDeletedIdsFromIDB(db, 'products');
      const unionDeleted = new Set<string>([
        ...Array.from(existingIDBDeleted),
        ...Array.from(currentDeleted),
      ]);

      const tx = db.transaction(storesToUse, 'readwrite');
      if (db.objectStoreNames.contains(CATALOG_STORE)) {
        tx.objectStore(CATALOG_STORE).clear();
      }
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
        tx.objectStore(USER_VAULT_STORE).clear();
      }
      if (db.objectStoreNames.contains(DELETED_STORE)) {
        tx.objectStore(DELETED_STORE).put({
          key: 'products',
          ids: Array.from(unionDeleted),
        });
      }
      putMetaFlagInTx(tx, 'catalog_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.warn('Error clearing IndexedDB stores:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_agro_catalog_changed'));
  }
}

/**
 * Loads all saved products from IndexedDB & LocalStorage with GUARANTEED recovery of user items
 * and permanent exclusion of deleted items.
 */
export async function loadProductsFromStorage(): Promise<ProductItem[]> {
  try {
    const db = await openDB();
    const deletedIds = await loadAllDeletedProductIds(db);
    const idbInitialized = await getMetaFlag(db, 'catalog_initialized');
    const lsInitialized = safeGetLocalStorage(CATALOG_INITIALIZED_KEY) === 'true';
    const isInitialized = idbInitialized || lsInitialized;

    const tx = db.transaction([CATALOG_STORE, USER_VAULT_STORE], 'readonly');
    const [catalogResult, vaultResult] = await Promise.all([
      reqPromise<ProductItem[]>(tx.objectStore(CATALOG_STORE).getAll()),
      reqPromise<ProductItem[]>(tx.objectStore(USER_VAULT_STORE).getAll()),
    ]);

    const idbCatalog = Array.isArray(catalogResult) ? catalogResult : [];
    const idbVault = Array.isArray(vaultResult) ? vaultResult : [];
    const lsCatalog = loadCatalogFromLocalStorage();
    const lsVault = loadUserVaultFromLocalStorage();

    let baseList: ProductItem[] = [];

    if (isInitialized) {
      // Respect user deletions even if the catalog was emptied to []
      if (idbCatalog.length > 0 || idbInitialized) {
        baseList = idbCatalog;
      } else if (lsCatalog !== null) {
        baseList = lsCatalog;
      } else {
        baseList = [];
      }
    } else if (idbCatalog.length > 0) {
      baseList = idbCatalog;
      safeSetLocalStorage(CATALOG_INITIALIZED_KEY, 'true');
    } else if (lsCatalog !== null) {
      baseList = lsCatalog;
      safeSetLocalStorage(CATALOG_INITIALIZED_KEY, 'true');
    } else {
      // True first run ever: seed initial factory products (minus any deleted IDs)
      baseList = PRODUCTS_DATA;
      safeSetLocalStorage(CATALOG_INITIALIZED_KEY, 'true');
    }

    const mergedMap = new Map<string, ProductItem>();

    // First apply LocalStorage items as baseline, then overwrite with IndexedDB full-resolution items
    if (lsCatalog) {
      lsCatalog.forEach((item) => {
        if (!deletedIds.has(item.id) && baseList.some((b) => b.id === item.id)) {
          mergedMap.set(item.id, item);
        }
      });
    }
    baseList.forEach((item) => {
      if (!deletedIds.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });
    lsVault.forEach((item) => {
      if (!deletedIds.has(item.id) && !mergedMap.has(item.id)) {
        mergedMap.set(item.id, { ...item, isUserCreated: true });
      }
    });
    idbVault.forEach((item) => {
      if (!deletedIds.has(item.id)) {
        mergedMap.set(item.id, { ...item, isUserCreated: true });
      }
    });

    const finalList = Array.from(mergedMap.values());
    await saveProductsToStorage(finalList);
    return finalList;
  } catch (err) {
    console.warn('IndexedDB catalog read error, using LocalStorage fallback:', err);
    const deletedIds = loadDeletedIdsFromStorage();
    const isInitialized = safeGetLocalStorage(CATALOG_INITIALIZED_KEY) === 'true';
    const fallback = loadCatalogFromLocalStorage();
    const baseList = fallback !== null ? fallback : isInitialized ? [] : PRODUCTS_DATA;
    const lsVault = loadUserVaultFromLocalStorage();

    const mergedMap = new Map<string, ProductItem>();
    baseList.forEach((item) => {
      if (!deletedIds.has(item.id)) mergedMap.set(item.id, item);
    });
    lsVault.forEach((item) => {
      if (!deletedIds.has(item.id)) mergedMap.set(item.id, { ...item, isUserCreated: true });
    });
    return Array.from(mergedMap.values());
  }
}

/**
 * Persists products to both IndexedDB (unlimited, full-resolution) and LocalStorage (fast cache)
 */
export async function saveProductsToStorage(products: ProductItem[]): Promise<void> {
  const defaultIds = new Set(PRODUCTS_DATA.map((p) => p.id));

  // Always enforce deletion tombstones so deleted items never sneak back in
  const deletedLS = loadDeletedIdsFromStorage();
  const safeProducts = products.filter((p) => !deletedLS.has(p.id));

  const userItems = safeProducts
    .filter((p) => p.isUserCreated || !defaultIds.has(p.id))
    .map((p) => ({
      ...p,
      isUserCreated: true,
    }));

  // 1. Fast cache in LocalStorage (gracefully strips oversized images if 5MB cap is hit)
  safeSetLocalStorage(CATALOG_INITIALIZED_KEY, 'true');
  const savedCatalogLS = safeSetLocalStorage(CATALOG_LS_KEY, JSON.stringify(safeProducts));
  const savedVaultLS = safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(userItems));

  if (!savedCatalogLS) {
    safeSetLocalStorage(CATALOG_LS_KEY, JSON.stringify(stripLargeImagesForLS(safeProducts)));
  }
  if (!savedVaultLS) {
    safeSetLocalStorage(USER_VAULT_LS_KEY, JSON.stringify(stripLargeImagesForLS(userItems)));
  }

  // 2. Save full-resolution unlimited data to IndexedDB (serialized & awaited)
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const idbDeleted = await getDeletedIdsFromIDB(db, 'products');
      const allDeleted = new Set<string>([...Array.from(deletedLS), ...Array.from(idbDeleted)]);
      const idbSafeProducts = safeProducts.filter((p) => !allDeleted.has(p.id));
      const idbSafeUserItems = userItems.filter((p) => !allDeleted.has(p.id));

      const storesToUse: string[] = [CATALOG_STORE];
      if (db.objectStoreNames.contains(USER_VAULT_STORE)) storesToUse.push(USER_VAULT_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      const tx = db.transaction(storesToUse, 'readwrite');
      const catalogStore = tx.objectStore(CATALOG_STORE);
      catalogStore.clear();
      idbSafeProducts.forEach((prod) => {
        catalogStore.put(prod);
      });

      if (db.objectStoreNames.contains(USER_VAULT_STORE)) {
        const vaultStore = tx.objectStore(USER_VAULT_STORE);
        vaultStore.clear();
        idbSafeUserItems.forEach((prod) => {
          vaultStore.put(prod);
        });
      }

      putMetaFlagInTx(tx, 'catalog_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.error('Error saving products to IndexedDB:', err);
    }
  });
}

// ============================================================================
// FEATURED INFO / DESTAQUES PERSISTENCE (UNLIMITED LOCAL STORAGE + TOMBSTONES)
// ============================================================================

export function loadFeaturedDeletedIdsFromStorage(): Set<string> {
  try {
    const raw = safeGetLocalStorage(FEATURED_DELETED_LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {
    console.warn('Error reading featured deleted IDs:', e);
  }
  return new Set();
}

async function loadAllDeletedFeaturedIds(db?: IDBDatabase): Promise<Set<string>> {
  const lsSet = loadFeaturedDeletedIdsFromStorage();
  try {
    const database = db || (await openDB());
    const idbSet = await getDeletedIdsFromIDB(database, 'featured_info');
    idbSet.forEach((id) => lsSet.add(id));
    if (lsSet.size > 0) {
      safeSetLocalStorage(FEATURED_DELETED_LS_KEY, JSON.stringify(Array.from(lsSet)));
    }
  } catch {
    // fallback to LS set
  }
  return lsSet;
}

export function loadFeaturedInfoFromLocalStorageSync(): FeaturedInfoItem[] {
  const deletedIds = loadFeaturedDeletedIdsFromStorage();
  const isInitialized = safeGetLocalStorage(FEATURED_INITIALIZED_KEY) === 'true';

  try {
    const raw = safeGetLocalStorage(FEATURED_LS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Respect empty array if initialized or explicitly stored
        return parsed.filter((item: FeaturedInfoItem) => !deletedIds.has(item.id));
      }
    }
  } catch (e) {
    console.warn('Error reading featured info from localStorage:', e);
  }

  if (isInitialized) {
    return [];
  }

  return INITIAL_FEATURED_INFO.filter((item) => !deletedIds.has(item.id));
}

export async function loadFeaturedInfoFromStorage(): Promise<FeaturedInfoItem[]> {
  try {
    const db = await openDB();
    const deletedIds = await loadAllDeletedFeaturedIds(db);
    const idbInitialized = await getMetaFlag(db, 'featured_initialized');
    const lsInitialized = safeGetLocalStorage(FEATURED_INITIALIZED_KEY) === 'true';
    const isInitialized = idbInitialized || lsInitialized;

    let idbItems: FeaturedInfoItem[] = [];
    if (db.objectStoreNames.contains(FEATURED_STORE)) {
      const tx = db.transaction(FEATURED_STORE, 'readonly');
      const res = await reqPromise<FeaturedInfoItem[]>(tx.objectStore(FEATURED_STORE).getAll());
      if (Array.isArray(res)) {
        idbItems = res;
      }
    }

    let lsItems: FeaturedInfoItem[] | null = null;
    try {
      const raw = safeGetLocalStorage(FEATURED_LS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) lsItems = parsed;
      }
    } catch {
      lsItems = null;
    }

    let finalItems: FeaturedInfoItem[];

    if (isInitialized) {
      if (idbInitialized || idbItems.length > 0) {
        finalItems = idbItems;
      } else if (lsItems !== null) {
        finalItems = lsItems;
      } else {
        finalItems = [];
      }
    } else if (idbItems.length > 0) {
      finalItems = idbItems;
    } else if (lsItems !== null) {
      // Legacy localStorage migration: preserve user's existing items
      finalItems = lsItems;
    } else {
      // True first run ever
      finalItems = INITIAL_FEATURED_INFO;
    }

    const filtered = finalItems
      .filter((item) => !deletedIds.has(item.id))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    await saveFeaturedInfoToStorage(filtered);
    return filtered;
  } catch (err) {
    console.warn('IndexedDB featured info read error, using LocalStorage fallback:', err);
    return loadFeaturedInfoFromLocalStorageSync();
  }
}

export async function saveFeaturedInfoToStorage(items: FeaturedInfoItem[]): Promise<void> {
  const deletedLS = loadFeaturedDeletedIdsFromStorage();
  const safeItems = items.filter((item) => !deletedLS.has(item.id));

  safeSetLocalStorage(FEATURED_INITIALIZED_KEY, 'true');
  if (!safeSetLocalStorage(FEATURED_LS_KEY, JSON.stringify(safeItems))) {
    safeSetLocalStorage(FEATURED_LS_KEY, JSON.stringify(stripLargeImagesForLS(safeItems)));
  }

  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const idbDeleted = await getDeletedIdsFromIDB(db, 'featured_info');
      const allDeleted = new Set<string>([...Array.from(deletedLS), ...Array.from(idbDeleted)]);
      const idbSafeItems = safeItems.filter((item) => !allDeleted.has(item.id));

      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(FEATURED_STORE)) storesToUse.push(FEATURED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const tx = db.transaction(storesToUse, 'readwrite');
      if (db.objectStoreNames.contains(FEATURED_STORE)) {
        const store = tx.objectStore(FEATURED_STORE);
        store.clear();
        idbSafeItems.forEach((item) => {
          store.put(item);
        });
      }
      putMetaFlagInTx(tx, 'featured_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.error('Error saving featured info to IndexedDB:', err);
    }
  });
}

export async function upsertFeaturedInfoToStorage(item: FeaturedInfoItem): Promise<void> {
  // Remove from deleted set if explicitly saved
  const deletedLS = loadFeaturedDeletedIdsFromStorage();
  if (deletedLS.has(item.id)) {
    deletedLS.delete(item.id);
    safeSetLocalStorage(FEATURED_DELETED_LS_KEY, JSON.stringify(Array.from(deletedLS)));
  }

  // Update LocalStorage cache immediately
  safeSetLocalStorage(FEATURED_INITIALIZED_KEY, 'true');
  try {
    const current = loadFeaturedInfoFromLocalStorageSync();
    const exists = current.some((i) => i.id === item.id);
    const updated = exists
      ? current.map((i) => (i.id === item.id ? item : i))
      : [item, ...current];
    if (!safeSetLocalStorage(FEATURED_LS_KEY, JSON.stringify(updated))) {
      safeSetLocalStorage(FEATURED_LS_KEY, JSON.stringify(stripLargeImagesForLS(updated)));
    }
  } catch {
    // ignore
  }

  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(FEATURED_STORE)) storesToUse.push(FEATURED_STORE);
      if (db.objectStoreNames.contains(DELETED_STORE)) storesToUse.push(DELETED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const existingIDBDeleted = await getDeletedIdsFromIDB(db, 'featured_info');
      const tx = db.transaction(storesToUse, 'readwrite');
      if (db.objectStoreNames.contains(FEATURED_STORE)) {
        tx.objectStore(FEATURED_STORE).put(item);
      }
      if (db.objectStoreNames.contains(DELETED_STORE) && existingIDBDeleted.has(item.id)) {
        existingIDBDeleted.delete(item.id);
        tx.objectStore(DELETED_STORE).put({
          key: 'featured_info',
          ids: Array.from(existingIDBDeleted),
        });
      }
      putMetaFlagInTx(tx, 'featured_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.error('Error upserting featured info to IndexedDB:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_featured_info_changed'));
  }
}

export async function deleteFeaturedInfoPermanently(infoId: string): Promise<void> {
  // 1. Record tombstone in LocalStorage immediately
  const deletedLS = loadFeaturedDeletedIdsFromStorage();
  deletedLS.add(infoId);
  safeSetLocalStorage(FEATURED_DELETED_LS_KEY, JSON.stringify(Array.from(deletedLS)));
  safeSetLocalStorage(FEATURED_INITIALIZED_KEY, 'true');

  // 2. Purge from LocalStorage cache
  try {
    const raw = safeGetLocalStorage(FEATURED_LS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((item: FeaturedInfoItem) => item.id !== infoId);
        if (!safeSetLocalStorage(FEATURED_LS_KEY, JSON.stringify(filtered))) {
          safeSetLocalStorage(FEATURED_LS_KEY, JSON.stringify(stripLargeImagesForLS(filtered)));
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Purge from IndexedDB and record tombstone permanently
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(FEATURED_STORE)) storesToUse.push(FEATURED_STORE);
      if (db.objectStoreNames.contains(DELETED_STORE)) storesToUse.push(DELETED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const existingIDBDeleted = await getDeletedIdsFromIDB(db, 'featured_info');
      const unionDeleted = new Set<string>([
        ...Array.from(existingIDBDeleted),
        ...Array.from(loadFeaturedDeletedIdsFromStorage()),
        infoId,
      ]);

      const tx = db.transaction(storesToUse, 'readwrite');
      if (db.objectStoreNames.contains(FEATURED_STORE)) {
        tx.objectStore(FEATURED_STORE).delete(infoId);
      }
      if (db.objectStoreNames.contains(DELETED_STORE)) {
        tx.objectStore(DELETED_STORE).put({
          key: 'featured_info',
          ids: Array.from(unionDeleted),
        });
      }
      putMetaFlagInTx(tx, 'featured_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.warn('IndexedDB featured info delete error:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('raffa_featured_info_changed'));
  }
}

export async function resetFeaturedInfoToDefault(): Promise<FeaturedInfoItem[]> {
  safeRemoveLocalStorage(FEATURED_DELETED_LS_KEY);
  safeSetLocalStorage(FEATURED_INITIALIZED_KEY, 'true');
  safeSetLocalStorage(FEATURED_LS_KEY, JSON.stringify(INITIAL_FEATURED_INFO));

  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      const storesToUse: string[] = [];
      if (db.objectStoreNames.contains(FEATURED_STORE)) storesToUse.push(FEATURED_STORE);
      if (db.objectStoreNames.contains(DELETED_STORE)) storesToUse.push(DELETED_STORE);
      if (db.objectStoreNames.contains(META_STORE)) storesToUse.push(META_STORE);

      if (storesToUse.length === 0) return;

      const tx = db.transaction(storesToUse, 'readwrite');
      if (db.objectStoreNames.contains(DELETED_STORE)) {
        tx.objectStore(DELETED_STORE).put({ key: 'featured_info', ids: [] });
      }
      if (db.objectStoreNames.contains(FEATURED_STORE)) {
        const store = tx.objectStore(FEATURED_STORE);
        store.clear();
        INITIAL_FEATURED_INFO.forEach((item) => store.put(item));
      }
      putMetaFlagInTx(tx, 'featured_initialized', true);
      await txDone(tx);
    } catch (err) {
      console.warn('Error resetting featured info in IndexedDB:', err);
    }
  });

  return INITIAL_FEATURED_INFO;
}

// ============================================================================
// LOCAL QUOTES & CONTACT MESSAGES HISTORY (INDEXEDDB)
// ============================================================================

export async function saveQuoteToLocalDB(
  quote: QuoteFormData & { totalMzn?: number; source?: 'quote_modal' | 'cart_order' }
): Promise<void> {
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(QUOTES_STORE)) return;
      const tx = db.transaction(QUOTES_STORE, 'readwrite');
      tx.objectStore(QUOTES_STORE).put({
        id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...quote,
        status: 'pending',
        createdAt: Date.now(),
      });
      await txDone(tx);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('raffa_history_updated'));
      }
    } catch (err) {
      console.warn('Erro ao guardar pedido de orçamento localmente:', err);
    }
  });
}

export async function loadQuotesFromLocalDB(): Promise<
  Array<
    QuoteFormData & {
      id: string;
      status?: 'pending' | 'contacted' | 'resolved';
      totalMzn?: number;
      source?: 'quote_modal' | 'cart_order';
      createdAt: number;
      updatedAt?: number;
    }
  >
> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(QUOTES_STORE)) return [];
    const tx = db.transaction(QUOTES_STORE, 'readonly');
    const res = await reqPromise<any[]>(tx.objectStore(QUOTES_STORE).getAll());
    if (!Array.isArray(res)) return [];
    return res.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

export async function updateQuoteStatusInLocalDB(
  quoteId: string,
  status: 'pending' | 'contacted' | 'resolved'
): Promise<void> {
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(QUOTES_STORE)) return;
      const tx = db.transaction(QUOTES_STORE, 'readwrite');
      const store = tx.objectStore(QUOTES_STORE);
      const existing = await reqPromise<any>(store.get(quoteId));
      if (existing) {
        store.put({ ...existing, status, updatedAt: Date.now() });
      }
      await txDone(tx);
    } catch (err) {
      console.warn('Erro ao atualizar estado do orçamento:', err);
    }
  });
}

export async function deleteQuoteFromLocalDB(quoteId: string): Promise<void> {
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(QUOTES_STORE)) return;
      const tx = db.transaction(QUOTES_STORE, 'readwrite');
      tx.objectStore(QUOTES_STORE).delete(quoteId);
      await txDone(tx);
    } catch (err) {
      console.warn('Erro ao eliminar orçamento:', err);
    }
  });
}

export async function saveContactToLocalDB(messageData: {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<void> {
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(CONTACTS_STORE)) return;
      const tx = db.transaction(CONTACTS_STORE, 'readwrite');
      tx.objectStore(CONTACTS_STORE).put({
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...messageData,
        status: 'pending',
        createdAt: Date.now(),
      });
      await txDone(tx);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('raffa_history_updated'));
      }
    } catch (err) {
      console.warn('Erro ao guardar mensagem localmente:', err);
    }
  });
}

export async function loadContactsFromLocalDB(): Promise<
  Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    subject?: string;
    message: string;
    status?: 'pending' | 'resolved';
    createdAt: number;
    updatedAt?: number;
  }>
> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(CONTACTS_STORE)) return [];
    const tx = db.transaction(CONTACTS_STORE, 'readonly');
    const res = await reqPromise<any[]>(tx.objectStore(CONTACTS_STORE).getAll());
    if (!Array.isArray(res)) return [];
    return res.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

export async function updateContactStatusInLocalDB(
  contactId: string,
  status: 'pending' | 'resolved'
): Promise<void> {
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(CONTACTS_STORE)) return;
      const tx = db.transaction(CONTACTS_STORE, 'readwrite');
      const store = tx.objectStore(CONTACTS_STORE);
      const existing = await reqPromise<any>(store.get(contactId));
      if (existing) {
        store.put({ ...existing, status, updatedAt: Date.now() });
      }
      await txDone(tx);
    } catch (err) {
      console.warn('Erro ao atualizar estado da mensagem:', err);
    }
  });
}

export async function deleteContactFromLocalDB(contactId: string): Promise<void> {
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(CONTACTS_STORE)) return;
      const tx = db.transaction(CONTACTS_STORE, 'readwrite');
      tx.objectStore(CONTACTS_STORE).delete(contactId);
      await txDone(tx);
    } catch (err) {
      console.warn('Erro ao eliminar mensagem:', err);
    }
  });
}

// ============================================================================
// ORDER CART PERSISTENCE (INDEXEDDB + LOCALSTORAGE)
// ============================================================================

export const CART_LS_KEY = 'raffa_agro_order_cart_v1';

export function loadCartSync<T = unknown>(): T[] {
  try {
    const raw = safeGetLocalStorage(CART_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export async function saveCartToStorage<T = unknown>(items: T[]): Promise<void> {
  safeSetLocalStorage(CART_LS_KEY, JSON.stringify(items));
  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(META_STORE)) return;
      const tx = db.transaction(META_STORE, 'readwrite');
      tx.objectStore(META_STORE).put({ key: 'order_cart', value: items, updatedAt: Date.now() });
      await txDone(tx);
    } catch {
      // ignore
    }
  });
}

export async function loadCartFromStorage<T = unknown>(): Promise<T[]> {
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(META_STORE)) {
      const tx = db.transaction(META_STORE, 'readonly');
      const res = await reqPromise<{ key: string; value: T[] } | undefined>(
        tx.objectStore(META_STORE).get('order_cart')
      );
      if (res && Array.isArray(res.value)) {
        safeSetLocalStorage(CART_LS_KEY, JSON.stringify(res.value));
        return res.value;
      }
    }
  } catch {
    // fallback
  }
  return loadCartSync<T>();
}

// ============================================================================
// DYNAMIC ADMIN SECURITY PIN PERSISTENCE
// ============================================================================

export const DEFAULT_ADMIN_PIN = '4029';
export const ADMIN_PIN_LS_KEY = 'raffa_agro_admin_pin_v1';

export function getAdminPinSync(): string {
  const stored = safeGetLocalStorage(ADMIN_PIN_LS_KEY);
  if (stored && /^\d{4}$/.test(stored)) {
    return stored;
  }
  return DEFAULT_ADMIN_PIN;
}

export async function loadAdminPinFromStorage(): Promise<string> {
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(META_STORE)) {
      const tx = db.transaction(META_STORE, 'readonly');
      const res = await reqPromise<{ key: string; value: string } | undefined>(
        tx.objectStore(META_STORE).get('admin_security_pin')
      );
      if (res && typeof res.value === 'string' && /^\d{4}$/.test(res.value)) {
        safeSetLocalStorage(ADMIN_PIN_LS_KEY, res.value);
        return res.value;
      }
    }
  } catch {
    // fallback to LS
  }
  return getAdminPinSync();
}

export async function saveAdminPinToStorage(newPin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(newPin)) return false;
  safeSetLocalStorage(ADMIN_PIN_LS_KEY, newPin);

  await enqueueWrite(async () => {
    try {
      const db = await openDB();
      if (!db.objectStoreNames.contains(META_STORE)) return;
      const tx = db.transaction(META_STORE, 'readwrite');
      tx.objectStore(META_STORE).put({
        key: 'admin_security_pin',
        value: newPin,
        updatedAt: Date.now(),
      });
      await txDone(tx);
    } catch (err) {
      console.warn('Erro ao guardar novo PIN no IndexedDB:', err);
    }
  });

  return true;
}
