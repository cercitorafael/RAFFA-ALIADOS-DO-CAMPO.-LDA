import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  ContactMessageRecord,
  FeaturedInfoItem,
  ProductItem,
  QuoteFormData,
  QuoteRecord,
} from '../types';

export function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `item-${Date.now()}`;
}

/**
 * Ensures any data:image payload stays well below Firestore's 1MB document limit (max 700KB string).
 */
export async function ensureFirestoreSafeImage(imageSrc: string): Promise<string> {
  if (!imageSrc || !imageSrc.startsWith('data:image/') || imageSrc.length <= 680000) {
    return imageSrc;
  }
  if (imageSrc.startsWith('data:image/svg+xml')) {
    return imageSrc.slice(0, 740000);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 820;
      const ratio = Math.min(1, maxDim / (img.naturalWidth || 800), maxDim / (img.naturalHeight || 800));
      const width = Math.max(1, Math.round((img.naturalWidth || 800) * ratio));
      const height = Math.max(1, Math.round((img.naturalHeight || 800) * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let compressed = canvas.toDataURL('image/webp', 0.78);
      if (!compressed.startsWith('data:image/webp') || compressed.length > 680000) {
        compressed = canvas.toDataURL('image/jpeg', 0.74);
      }
      if (compressed.length > 680000) {
        compressed = canvas.toDataURL('image/jpeg', 0.55);
      }
      resolve(compressed);
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

function toTimestampMs(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

function buildProductFields(product: ProductItem, safeImage: string): Record<string, unknown> {
  const validCategories = ['horticolas', 'milho', 'feijao', 'arroz', 'gergelim', 'insumos', 'agroquimicos', 'equipamentos'];
  const category = validCategories.includes(product.category) ? product.category : 'horticolas';

  const payload: Record<string, unknown> = {
    name: String(product.name || 'Produto').slice(0, 200),
    category,
    categoryLabel: String(product.categoryLabel || 'Sementes').slice(0, 100),
    tagline: String(product.tagline || '').slice(0, 300),
    description: String(product.description || '').slice(0, 3000),
    image: String(safeImage || 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80').slice(0, 750000),
    popular: Boolean(product.popular),
    isUserCreated: Boolean(product.isUserCreated),
    subCategory: product.subCategory ? String(product.subCategory).slice(0, 80) : null,
    badge: product.badge ? String(product.badge).slice(0, 80) : null,
    priceMzn:
      typeof product.priceMzn === 'number' && !Number.isNaN(product.priceMzn) && product.priceMzn > 0
        ? product.priceMzn
        : null,
    priceUnit: product.priceUnit ? String(product.priceUnit).slice(0, 60) : null,
    stockStatus:
      product.stockStatus && ['available', 'low', 'out_of_stock'].includes(product.stockStatus)
        ? product.stockStatus
        : 'available',
    varieties: Array.isArray(product.varieties)
      ? product.varieties
          .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          .slice(0, 30)
          .map((v) => v.slice(0, 120))
      : null,
    specs: null,
  };

  if (product.specs && typeof product.specs === 'object') {
    const cleanSpecs: Record<string, string> = {};
    if (product.specs.cycleDays) cleanSpecs.cycleDays = String(product.specs.cycleDays).slice(0, 120);
    if (product.specs.seedRatePerHa) cleanSpecs.seedRatePerHa = String(product.specs.seedRatePerHa).slice(0, 200);
    if (product.specs.recommendedSpacing) cleanSpecs.recommendedSpacing = String(product.specs.recommendedSpacing).slice(0, 200);
    if (product.specs.potentialYield) cleanSpecs.potentialYield = String(product.specs.potentialYield).slice(0, 200);
    if (product.specs.packaging) cleanSpecs.packaging = String(product.specs.packaging).slice(0, 200);
    if (Object.keys(cleanSpecs).length > 0) {
      payload.specs = cleanSpecs;
    }
  }

  return payload;
}

function buildFeaturedFields(item: FeaturedInfoItem, safeImageUrl?: string): Record<string, unknown> {
  const validCategories = ['sementes', 'campanha', 'alerta', 'comunicado', 'preco', 'geral'];
  const validStyles = ['emerald', 'amber', 'red', 'blue'];
  const validActions = ['whatsapp', 'quote', 'none'];

  const payload: Record<string, unknown> = {
    title: String(item.title || 'Comunicado').slice(0, 200),
    category: validCategories.includes(item.category) ? item.category : 'campanha',
    categoryLabel: String(item.categoryLabel || 'Campanha').slice(0, 100),
    summary: String(item.summary || '').slice(0, 1000),
    highlightStyle: validStyles.includes(item.highlightStyle) ? item.highlightStyle : 'amber',
    actionType: validActions.includes(item.actionType) ? item.actionType : 'whatsapp',
    isActive: Boolean(item.isActive),
    badgeText: item.badgeText ? String(item.badgeText).slice(0, 80) : null,
    details: item.details ? String(item.details).slice(0, 3000) : null,
    actionText: item.actionText ? String(item.actionText).slice(0, 100) : null,
    actionUrlOrMessage: item.actionUrlOrMessage ? String(item.actionUrlOrMessage).slice(0, 500) : null,
    imageUrl: safeImageUrl ? String(safeImageUrl).slice(0, 750000) : null,
    dateText: item.dateText ? String(item.dateText).slice(0, 100) : null,
    priorityOrder:
      typeof item.priorityOrder === 'number' && !Number.isNaN(item.priorityOrder)
        ? item.priorityOrder
        : null,
  };

  return payload;
}

// ============================================================================
// CLOUD PRODUCTS SYNC
// ============================================================================

export function subscribeCloudProducts(
  onData: (products: ProductItem[], cloudInitialized: boolean) => void
): () => void {
  let latestInitialized = false;
  let latestProducts: ProductItem[] = [];
  let metaLoaded = false;
  let listLoaded = false;

  const emitIfReady = () => {
    if (metaLoaded && listLoaded) {
      onData(latestProducts, latestInitialized);
    }
  };

  const unsubMeta = onSnapshot(
    doc(db, 'meta', 'catalog'),
    (snap) => {
      metaLoaded = true;
      latestInitialized = snap.exists() && Boolean(snap.data()?.initialized);
      emitIfReady();
    },
    (err) => {
      console.warn('Firestore meta/catalog listener warning:', err.message);
    }
  );

  const unsubProducts = onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      listLoaded = true;
      latestProducts = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          ...(raw as ProductItem),
          id: d.id,
          subCategory: raw.subCategory || undefined,
          badge: raw.badge || undefined,
          priceMzn: typeof raw.priceMzn === 'number' ? raw.priceMzn : undefined,
          priceUnit: raw.priceUnit || undefined,
          stockStatus: raw.stockStatus || 'available',
          varieties: Array.isArray(raw.varieties) ? raw.varieties : undefined,
          specs: raw.specs || undefined,
          createdAt: toTimestampMs(raw.createdAt),
          updatedAt: toTimestampMs(raw.updatedAt),
        };
      });
      latestProducts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      emitIfReady();
    },
    (err) => {
      console.warn('Firestore products listener warning:', err.message);
    }
  );

  return () => {
    unsubMeta();
    unsubProducts();
  };
}

export async function ensureCatalogMetaInitialized(): Promise<void> {
  if (!auth.currentUser) return;
  const metaRef = doc(db, 'meta', 'catalog');
  try {
    const snap = await getDoc(metaRef);
    if (!snap.exists()) {
      await setDoc(metaRef, {
        initialized: true,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'meta/catalog');
  }
}

export async function upsertCloudProduct(product: ProductItem): Promise<void> {
  if (!auth.currentUser) return;
  const id = sanitizeDocId(product.id);
  const safeImage = await ensureFirestoreSafeImage(product.image);
  const docRef = doc(db, 'products', id);

  try {
    const existingSnap = await getDoc(docRef);
    const fields = buildProductFields(product, safeImage);

    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        id,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
  }
}

export async function seedAndSyncCatalogToCloud(products: ProductItem[]): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Sessão Google de administrador necessária para sincronizar na nuvem.');
  }

  try {
    const existingSnap = await getDocs(collection(db, 'products'));
    const currentIds = new Set(products.map((p) => sanitizeDocId(p.id)));

    // Upsert all current products (ensuring compressed safe images)
    for (const p of products) {
      await upsertCloudProduct(p);
    }

    // Delete products removed locally
    const toDelete = existingSnap.docs.filter((d) => !currentIds.has(d.id));
    if (toDelete.length > 0) {
      const batch = writeBatch(db);
      toDelete.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Mark cloud catalog as initialized
    const metaRef = doc(db, 'meta', 'catalog');
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) {
      await setDoc(metaRef, { initialized: true, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(metaRef, { initialized: true, updatedAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'products');
  }
}

export async function deleteCloudProduct(productId: string): Promise<void> {
  if (!auth.currentUser) return;
  const id = sanitizeDocId(productId);
  try {
    await ensureCatalogMetaInitialized();
    await deleteDoc(doc(db, 'products', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
  }
}

export async function deleteMultipleCloudProducts(productIds: string[]): Promise<void> {
  if (!auth.currentUser || productIds.length === 0) return;
  try {
    await ensureCatalogMetaInitialized();
    const batch = writeBatch(db);
    productIds.forEach((rawId) => {
      batch.delete(doc(db, 'products', sanitizeDocId(rawId)));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'products');
  }
}

// ============================================================================
// CLOUD FEATURED INFO SYNC
// ============================================================================

export function subscribeCloudFeaturedInfo(
  onData: (items: FeaturedInfoItem[], cloudInitialized: boolean) => void
): () => void {
  let latestInitialized = false;
  let latestItems: FeaturedInfoItem[] = [];
  let metaLoaded = false;
  let listLoaded = false;

  const emitIfReady = () => {
    if (metaLoaded && listLoaded) {
      onData(latestItems, latestInitialized);
    }
  };

  const unsubMeta = onSnapshot(
    doc(db, 'meta', 'featured'),
    (snap) => {
      metaLoaded = true;
      latestInitialized = snap.exists() && Boolean(snap.data()?.initialized);
      emitIfReady();
    },
    (err) => {
      console.warn('Firestore meta/featured listener warning:', err.message);
    }
  );

  const unsubList = onSnapshot(
    collection(db, 'featured_info'),
    (snapshot) => {
      listLoaded = true;
      latestItems = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          ...(raw as FeaturedInfoItem),
          id: d.id,
          badgeText: raw.badgeText || undefined,
          details: raw.details || undefined,
          actionText: raw.actionText || undefined,
          actionUrlOrMessage: raw.actionUrlOrMessage || undefined,
          imageUrl: raw.imageUrl || undefined,
          dateText: raw.dateText || undefined,
          priorityOrder: typeof raw.priorityOrder === 'number' ? raw.priorityOrder : undefined,
          createdAt: toTimestampMs(raw.createdAt),
          updatedAt: toTimestampMs(raw.updatedAt),
        };
      });
      latestItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      emitIfReady();
    },
    (err) => {
      console.warn('Firestore featured_info listener warning:', err.message);
    }
  );

  return () => {
    unsubMeta();
    unsubList();
  };
}

export async function upsertCloudFeaturedInfo(item: FeaturedInfoItem): Promise<void> {
  if (!auth.currentUser) return;
  const id = sanitizeDocId(item.id);
  const safeImageUrl = item.imageUrl ? await ensureFirestoreSafeImage(item.imageUrl) : undefined;
  const docRef = doc(db, 'featured_info', id);

  try {
    const existingSnap = await getDoc(docRef);
    const fields = buildFeaturedFields(item, safeImageUrl);

    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        id,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `featured_info/${id}`);
  }
}

export async function syncFeaturedInfoToCloud(items: FeaturedInfoItem[]): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const existingSnap = await getDocs(collection(db, 'featured_info'));
    const currentIds = new Set(items.map((i) => sanitizeDocId(i.id)));

    for (const item of items) {
      await upsertCloudFeaturedInfo(item);
    }

    const toDelete = existingSnap.docs.filter((d) => !currentIds.has(d.id));
    if (toDelete.length > 0) {
      const batch = writeBatch(db);
      toDelete.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    const metaRef = doc(db, 'meta', 'featured');
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) {
      await setDoc(metaRef, { initialized: true, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(metaRef, { initialized: true, updatedAt: serverTimestamp() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'featured_info');
  }
}

export async function deleteCloudFeaturedInfo(infoId: string): Promise<void> {
  if (!auth.currentUser) return;
  const id = sanitizeDocId(infoId);
  try {
    const metaRef = doc(db, 'meta', 'featured');
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) {
      await setDoc(metaRef, { initialized: true, updatedAt: serverTimestamp() });
    }
    await deleteDoc(doc(db, 'featured_info', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `featured_info/${id}`);
  }
}

// ============================================================================
// CLOUD BRAND LOGO SYNC
// ============================================================================

export function subscribeCloudBrandLogo(onData: (logoImage: string | null) => void): () => void {
  return onSnapshot(
    doc(db, 'brand_settings', 'logo'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData(typeof data.logoImage === 'string' && data.logoImage ? data.logoImage : null);
      }
    },
    (err) => {
      console.warn('Firestore brand_settings/logo listener warning:', err.message);
    }
  );
}

export async function saveCloudBrandLogo(logoImage: string | null): Promise<void> {
  if (!auth.currentUser) return;
  const safeLogo = logoImage ? await ensureFirestoreSafeImage(logoImage) : null;
  const docRef = doc(db, 'brand_settings', 'logo');

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        logoImage: safeLogo,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        logoImage: safeLogo,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'brand_settings/logo');
  }
}

// ============================================================================
// CLOUD QUOTES & CONTACT MESSAGES
// ============================================================================

export async function saveCloudQuote(
  quote: QuoteFormData & { id?: string; totalMzn?: number; source?: 'quote_modal' | 'cart_order' }
): Promise<void> {
  const id = sanitizeDocId(
    quote.id || `quote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  const payload: Record<string, unknown> = {
    name: String(quote.name || 'Cliente').slice(0, 150),
    phone: String(quote.phone || '').slice(0, 50),
    location: String(quote.location || 'Ribaué / Nampula').slice(0, 200),
    selectedCategory: String(quote.selectedCategory || 'Geral').slice(0, 150),
    selectedProduct: String(quote.selectedProduct || '').slice(0, 1000),
    areaOrQuantity: String(quote.areaOrQuantity || 'A definir').slice(0, 200),
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  if (quote.notes) payload.notes = String(quote.notes).slice(0, 2000);
  if (typeof quote.totalMzn === 'number' && !Number.isNaN(quote.totalMzn)) {
    payload.totalMzn = quote.totalMzn;
  }
  if (quote.source === 'quote_modal' || quote.source === 'cart_order') {
    payload.source = quote.source;
  }

  try {
    await setDoc(doc(db, 'quotes', id), payload);
  } catch (err) {
    console.warn('Erro ao enviar pedido para Firestore:', err);
  }
}

export async function loadCloudQuotes(): Promise<QuoteRecord[]> {
  if (!auth.currentUser) return [];
  try {
    const snap = await getDocs(collection(db, 'quotes'));
    const items: QuoteRecord[] = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        name: raw.name || '',
        phone: raw.phone || '',
        location: raw.location || '',
        selectedCategory: raw.selectedCategory || '',
        selectedProduct: raw.selectedProduct || '',
        areaOrQuantity: raw.areaOrQuantity || '',
        notes: raw.notes || '',
        status: raw.status || 'pending',
        totalMzn: raw.totalMzn,
        source: raw.source,
        createdAt: toTimestampMs(raw.createdAt),
        updatedAt: raw.updatedAt ? toTimestampMs(raw.updatedAt) : undefined,
      };
    });
    return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'quotes');
  }
}

export async function updateCloudQuoteStatus(
  quoteId: string,
  status: 'pending' | 'contacted' | 'resolved'
): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'quotes', sanitizeDocId(quoteId)), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `quotes/${quoteId}`);
  }
}

export async function deleteCloudQuote(quoteId: string): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'quotes', sanitizeDocId(quoteId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `quotes/${quoteId}`);
  }
}

export async function saveCloudContact(messageData: {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<void> {
  const id = sanitizeDocId(
    messageData.id || `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  const payload: Record<string, unknown> = {
    name: String(messageData.name || 'Cliente').slice(0, 150),
    message: String(messageData.message || '-').slice(0, 2500),
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  if (messageData.email) payload.email = String(messageData.email).slice(0, 150);
  if (messageData.phone) payload.phone = String(messageData.phone).slice(0, 50);
  if (messageData.subject) payload.subject = String(messageData.subject).slice(0, 200);

  try {
    await setDoc(doc(db, 'contact_messages', id), payload);
  } catch (err) {
    console.warn('Erro ao enviar mensagem para Firestore:', err);
  }
}

export async function loadCloudContacts(): Promise<ContactMessageRecord[]> {
  if (!auth.currentUser) return [];
  try {
    const snap = await getDocs(collection(db, 'contact_messages'));
    const items: ContactMessageRecord[] = snap.docs.map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        name: raw.name || '',
        email: raw.email,
        phone: raw.phone,
        subject: raw.subject,
        message: raw.message || '',
        status: raw.status || 'pending',
        createdAt: toTimestampMs(raw.createdAt),
        updatedAt: raw.updatedAt ? toTimestampMs(raw.updatedAt) : undefined,
      };
    });
    return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'contact_messages');
  }
}

export async function updateCloudContactStatus(
  contactId: string,
  status: 'pending' | 'resolved'
): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'contact_messages', sanitizeDocId(contactId)), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `contact_messages/${contactId}`);
  }
}

export async function deleteCloudContact(contactId: string): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'contact_messages', sanitizeDocId(contactId)));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `contact_messages/${contactId}`);
  }
}
