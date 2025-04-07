
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please connect your project to Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database type definitions
export type DbTransaction = {
  id: string;
  user_id: string | null;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  created_at: string;
  merchant_name?: string;
  imported_from?: 'manual' | 'wechat' | 'receipt' | 'file';
}
