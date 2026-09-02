import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProductItem, QuoteFormData } from '../types';

// Read from Vite environment variables, with fallback to the user's provided credentials
const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
  'https://ngmhhoyrkbbnlrycjfqe.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_PUBLISHABLE_KEY) || 
  'sb_publishable_jpimBnIcI6zqlNkTDEii3Q_iyQs9diZ';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

// Create single Supabase client instance with auto session persistence
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

export const SUPABASE_PROJECT_INFO = {
  url: SUPABASE_URL,
  host: SUPABASE_URL ? new URL(SUPABASE_URL).hostname : 'ngmhhoyrkbbnlrycjfqe.supabase.co',
  isConfigured: isSupabaseConfigured,
};

/**
 * Health check: tests the connection to Supabase
 */
export async function checkSupabaseConnection(): Promise<{ 
  connected: boolean; 
  latencyMs?: number; 
  message: string 
}> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Credenciais do Supabase não configuradas.',
    };
  }

  const startTime = Date.now();
  try {
    // Attempt a lightweight ping or read from Supabase
    const { error } = await supabase.from('products').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // 42P01 is "relation does not exist" - meaning Supabase is reachable and authenticated, just table not created yet
      return {
        connected: true,
        latencyMs,
        message: `Supabase alcançável (${latencyMs}ms). Tabela 'products' pronta para criação ou consulta.`,
      };
    }

    return {
      connected: true,
      latencyMs,
      message: `Conexão bem sucedida (${latencyMs}ms)!`,
    };
  } catch (err: any) {
    // Network or fetch error
    return {
      connected: false,
      message: err?.message || 'Falha ao contactar o servidor Supabase.',
    };
  }
}

/**
 * Convert a ProductItem into a Supabase database row format
 */
export function formatProductForSupabase(p: ProductItem) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    sub_category: p.subCategory || null,
    category_label: p.categoryLabel,
    tagline: p.tagline || '',
    description: p.description || '',
    varieties: p.varieties || [],
    specs: p.specs || {},
    image: p.image,
    badge: p.badge || null,
    popular: Boolean(p.popular),
    is_user_created: Boolean(p.isUserCreated),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Convert a Supabase database row into a ProductItem
 */
export function formatSupabaseRowToProduct(row: any): ProductItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category || row.subCategory,
    categoryLabel: row.category_label || row.categoryLabel,
    tagline: row.tagline || '',
    description: row.description || '',
    varieties: Array.isArray(row.varieties) ? row.varieties : (row.varieties ? JSON.parse(row.varieties) : []),
    specs: typeof row.specs === 'object' ? row.specs : (row.specs ? JSON.parse(row.specs) : undefined),
    image: row.image,
    badge: row.badge,
    popular: row.popular,
    isUserCreated: row.is_user_created ?? row.isUserCreated,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
  };
}

/**
 * Fetch all products from Supabase 'products' table
 */
export async function fetchProductsFromCloud(): Promise<ProductItem[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('[Supabase] Could not fetch products from cloud:', error.message);
      return null;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => formatSupabaseRowToProduct(row));
    }

    return [];
  } catch (err) {
    console.error('[Supabase] Error reading products from cloud:', err);
    return null;
  }
}

/**
 * Synchronize/Upload products to Supabase 'products' table
 */
export async function syncProductsToCloud(products: ProductItem[]): Promise<{ 
  success: boolean; 
  count: number; 
  error?: string 
}> {
  if (!isSupabaseConfigured) {
    return { success: false, count: 0, error: 'Supabase não configurado' };
  }

  try {
    const formatted = products.map(formatProductForSupabase);

    const { error } = await supabase
      .from('products')
      .upsert(formatted, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Error upserting products:', error.message);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: formatted.length };
  } catch (err: any) {
    console.error('[Supabase] Upsert error:', err);
    return { success: false, count: 0, error: err?.message || 'Erro inesperado' };
  }
}

/**
 * Upsert a single product to Supabase cloud automatically
 */
export async function upsertSingleProductToCloud(product: ProductItem): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const formatted = formatProductForSupabase(product);
    const { error } = await supabase
      .from('products')
      .upsert([formatted], { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Error upserting single product:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Upsert single product error:', err);
    return false;
  }
}

/**
 * Delete a product permanently from Supabase 'products' table
 */
export async function deleteProductFromCloud(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.warn('[Supabase] Error deleting product from cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error in deleteProductFromCloud:', err);
    return false;
  }
}

/**
 * Record a customer quote request into Supabase 'quotes' table
 */
export async function submitQuoteToCloud(quote: QuoteFormData): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('quotes')
      .insert([
        {
          name: quote.name,
          phone: quote.phone,
          location: quote.location,
          category: quote.selectedCategory,
          product: quote.selectedProduct,
          quantity: quote.areaOrQuantity,
          notes: quote.notes,
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.warn('[Supabase] Could not save quote to table:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error saving quote to cloud:', err);
    return false;
  }
}

/**
 * Record a contact message into Supabase 'contact_messages' table
 */
export async function submitContactToCloud(messageData: {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: messageData.name,
          email: messageData.email || null,
          phone: messageData.phone || null,
          subject: messageData.subject || 'Contacto Website',
          message: messageData.message,
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.warn('[Supabase] Could not save contact message:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error saving contact message to cloud:', err);
    return false;
  }
}
