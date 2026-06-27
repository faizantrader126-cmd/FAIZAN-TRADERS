import { createClient } from '@supabase/supabase-js';

// Retrieve values from environment or use user-provided defaults with robust URL validation
const getSupabaseConfig = () => {
  const defaultUrl = 'https://jwvnhppeklmdfsedhvkj.supabase.co';
  const defaultKey = 'sb_publishable_oRgaxoHMvDHQqmWl_4918A_VNdfom0F';

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

export interface InquiryPayload {
  name: string;
  phone: string;
  message: string;
}

export async function saveInquiryToSupabase(data: InquiryPayload) {
  const payload = {
    name: data.name,
    phone: data.phone,
    message: data.message,
    created_at: new Date().toISOString()
  };

  try {
    const { error: appointmentsErr } = await supabase.from('appointments').insert([payload]);
    if (!appointmentsErr) return { success: true, table: 'appointments' };

    const { error: bookingsErr } = await supabase.from('bookings').insert([payload]);
    if (!bookingsErr) return { success: true, table: 'bookings' };

    const { error: inquiriesErr } = await supabase.from('inquiries').insert([payload]);
    if (!inquiriesErr) return { success: true, table: 'inquiries' };

    return { success: false, error: inquiriesErr.message };
  } catch (catchErr: any) {
    return { success: false, error: catchErr.message || catchErr };
  }
}

export async function saveOrderToSupabase(order: any) {
  const payload = {
    order_id: order.id,
    customer_name: order.customerDetails.name,
    customer_phone: order.customerDetails.phone,
    customer_whatsapp: order.customerDetails.whatsapp,
    customer_address: order.customerDetails.address,
    customer_city: order.customerDetails.city,
    customer_notes: order.customerDetails.notes || '',
    items: order.items,
    total_amount: order.totalAmount,
    shipping_cost: order.shippingCost,
    status: order.status,
    payment_method: order.paymentMethod,
    created_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('orders').insert([payload]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (catchErr: any) {
    return { success: false, error: catchErr.message || catchErr };
  }
}

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

export async function fetchProductsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return { success: false, error: error.message };
    const mapped = (data || []).map(mapFromSupabaseProduct);
    return { success: true, data: mapped };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

export async function upsertProductToSupabase(product: any) {
  const payload = mapToSupabaseProduct(product);
  try {
    const { error } = await supabase.from('products').upsert([payload], { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

export async function deleteProductFromSupabase(productId: string) {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

export async function pushAllProductsToSupabase(products: any[]) {
  const payloads = products.map(mapToSupabaseProduct);
  try {
    const { error } = await supabase.from('products').upsert(payloads, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}
