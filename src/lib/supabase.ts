import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Host = {
  id: string;
  telegram_id: number;
  object_id: string;
  name: string;
  wifi_name: string;
  wifi_password: string;
  instructions_json: any[];
  services_json: any[];
  checklist_json: any[];
  payment_details: string;
  blacklist: string[];
  show_review: boolean;
  show_services: boolean;
  show_instructions: boolean;
  show_sos: boolean;
  airbnb_url: string;
  booking_url: string;
  is_active: boolean;
  subscription_until: string;
  created_at: string;
};

export type Checkout = {
  id: string;
  host_id: string;
  guest_phone: string;
  photos_urls: string[];
  status: string;
  created_at: string;
};
