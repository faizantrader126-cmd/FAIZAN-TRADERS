import { createClient } from '@supabase/supabase-js';

// Retrieve values from environment or use user-provided defaults with robust URL validation
const getSupabaseConfig = () => {
  const defaultUrl = 'https://vwoqpxljyxqacadnpgfk.supabase.co';
  const defaultKey = 'sb_publishable_8imO92Hxr2KGilgnAbNsVw_Dho4Vc9q';

  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    localUrl = window.localStorage.getItem('custom_supabase_url') || '';
    localKey = window.localStorage.getItem('custom_supabase_anon_key') || '';
  }

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const isValidUrl = (str: any): boolean => {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  };

  const finalUrl = isValidUrl(localUrl) ? localUrl.trim() : (isValidUrl(envUrl) ? envUrl.trim() : defaultUrl);
  const finalKey = (typeof localKey === 'string' && localKey.trim()) ? localKey.trim() : ((typeof envKey === 'string' && envKey.trim() && !envKey.includes('placeholder')) ? envKey.trim() : defaultKey);

  return { url: finalUrl, key: finalKey };
};

export const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * SQL SCHEMA SUGGESTION FOR USER'S SUPABASE DASHBOARD:
 * 
 * -- Create Appointments / Inquiries table
 * create table appointments (
 *   id uuid default gen_random_uuid() primary key,
 *   name text not null,
 *   phone text not null,
 *   message text,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Create Orders / Store Bookings table
 * create table orders (
 *   id uuid default gen_random_uuid() primary key,
 *   order_id text not null,
 *   customer_name text not null,
 *   customer_phone text not null,
 *   customer_whatsapp text,
 *   customer_address text not null,
 *   customer_city text not null,
 *   customer_notes text,
 *   items jsonb not null,
 *   total_amount numeric not null,
 *   shipping_cost numeric not null,
 *   status text not null default 'Pending',
 *   payment_method text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 */

export interface InquiryPayload {
  name: string;
  phone: string;
  message: string;
}

/**
 * Saves a customer inquiry or appointment booking to Supabase.
 * It attempts multiple common tables ('appointments', 'bookings', 'inquiries') to be robust.
 */
export async function saveInquiryToSupabase(data: InquiryPayload) {
  const payload = {
    name: data.name,
    phone: data.phone,
    message: data.message,
    created_at: new Date().toISOString()
  };

  console.log('Supabase Sync - Sending inquiry details:', payload);

  // Try inserting into 'appointments' table first (requested by user as appointment booking)
  try {
    const { error: appointmentsErr } = await supabase
      .from('appointments')
      .insert([payload]);

    if (!appointmentsErr) {
      console.log('Supabase Sync success: Saved into "appointments" table.');
      return { success: true, table: 'appointments' };
    }
    console.warn('"appointments" table insert failed/absent, trying "bookings" table:', appointmentsErr.message);

    // Try 'bookings' table
    const { error: bookingsErr } = await supabase
      .from('bookings')
      .insert([payload]);

    if (!bookingsErr) {
      console.log('Supabase Sync success: Saved into "bookings" table.');
      return { success: true, table: 'bookings' };
    }
    console.warn('"bookings" table insert failed/absent, trying "inquiries" table:', bookingsErr.message);

    // Try 'inquiries' table
    const { error: inquiriesErr } = await supabase
      .from('inquiries')
      .insert([payload]);

    if (!inquiriesErr) {
      console.log('Supabase Sync success: Saved into "inquiries" table.');
      return { success: true, table: 'inquiries' };
    }

    console.error('All standard table syncs failed! Please ensure you have created an "appointments", "bookings", or "inquiries" table in your Supabase SQL Editor.');
    return { 
      success: false, 
      error: inquiriesErr.message, 
      suggestion: `CREATE TABLE appointments (id uuid default gen_random_uuid() primary key, name text, phone text, message text, created_at timestamptz default now());`
    };
  } catch (catchErr: any) {
    console.error('Supabase query error:', catchErr);
    return { success: false, error: catchErr.message || catchErr };
  }
}

/**
 * Saves completed web orders to Supabase database.
 */
export async function saveOrderToSupabase(order: any) {
  const payload = {
    order_id: order.id,
    customer_name: order.customerDetails.name,
    customer_phone: order.customerDetails.phone,
    customer_whatsapp: order.customerDetails.whatsapp,
    customer_address: order.customerDetails.address,
    customer_city: order.customerDetails.city,
    customer_notes: order.customerDetails.notes || '',
    items: order.items, // Saves list with nested objects as jsonb
    total_amount: order.totalAmount,
    shipping_cost: order.shippingCost,
    status: order.status,
    payment_method: order.paymentMethod,
    created_at: new Date().toISOString()
  };

  console.log('Supabase Sync - Transmitting order payload:', payload);

  try {
    const { error } = await supabase
      .from('orders')
      .insert([payload]);

    if (error) {
      console.error('Could not insert order to Supabase "orders" table:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Supabase Sync success: Saved into "orders" table.');
    return { success: true };
  } catch (catchErr: any) {
    console.error('Supabase exception saving order details:', catchErr);
    return { success: false, error: catchErr.message || catchErr };
  }
}

/**
 * Maps a frontend Product object to Supabase column format (snake_case).
 */
export function mapToSupabaseProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price || 0),
    original_price: Number(p.originalPrice ?? p.original_price ?? p.price ?? 0),
    description: p.description || '',
    long_description: p.longDescription ?? p.long_description ?? '',
    image: p.image || '',
    images: p.images ?? [],
    rating: Number(p.rating ?? 5),
    reviews_count: Number(p.reviewsCount ?? p.reviews_count ?? 0),
    category: p.category || 'all',
    features: p.features ?? [],
    variants: p.variants ?? [],
    sizes: p.sizes ?? [],
    variant_images: p.variantImages ?? p.variant_images ?? {},
    stock: Number(p.stock ?? 10),
    badge: p.badge || null
  };
}

/**
 * Maps a Supabase row back into a frontend Product model (camelCase).
 */
export function mapFromSupabaseProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price || 0),
    originalPrice: Number(row.original_price ?? row.originalPrice ?? row.price ?? 0),
    description: row.description || '',
    longDescription: row.long_description ?? row.longDescription ?? '',
    image: row.image || '',
    images: row.images ?? [],
    rating: Number(row.rating ?? 5),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? 0),
    category: row.category || 'all',
    features: row.features ?? [],
    variants: row.variants ?? [],
    sizes: row.sizes ?? [],
    variantImages: row.variant_images ?? row.variantImages ?? {},
    stock: Number(row.stock ?? 10),
    badge: row.badge || undefined
  };
}

/**
 * Fetches all products from Supabase 'products' table.
 */
export async function fetchProductsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase fetchProducts error:', error.message);
      return { success: false, error: error.message };
    }

    const mapped = (data || []).map(mapFromSupabaseProduct);
    return { success: true, data: mapped };
  } catch (err: any) {
    console.error('Exception fetching products:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Upserts a single product to Supabase.
 */
export async function upsertProductToSupabase(product: any) {
  const payload = mapToSupabaseProduct(product);
  try {
    const { error } = await supabase
      .from('products')
      .upsert([payload], { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsertProduct error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception upserting product:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Deletes a product from Supabase.
 */
export async function deleteProductFromSupabase(productId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Supabase deleteProduct error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception deleting product:', err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Pushes a batch of products to Supabase to seed/sync them all at once.
 */
export async function pushAllProductsToSupabase(products: any[]) {
  const payloads = products.map(mapToSupabaseProduct);
  try {
    const { error } = await supabase
      .from('products')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      console.error('Supabase pushAllProducts error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception pushing products:', err);
    return { success: false, error: err.message || err };
  }
}
