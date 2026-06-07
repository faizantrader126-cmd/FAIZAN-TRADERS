import { createClient } from '@supabase/supabase-js';

// Retrieve values from environment or use user-provided defaults
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vwoqpxljyxqacadnpgfk.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8imO92Hxr2KGilgnAbNsVw_Dho4Vc9q';

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
