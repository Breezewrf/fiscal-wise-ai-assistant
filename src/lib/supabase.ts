
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a dummy client for development if credentials are missing
let supabase: ReturnType<typeof createClient>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please connect your project to Supabase.');
  
  // Create a mock client with dummy methods to prevent runtime errors
  const mockResponse = <T>(data: T) => 
    Promise.resolve({ data, error: null, count: null, status: 200, statusText: 'OK' });
  
  const mockErrorResponse = (message: string) => 
    Promise.resolve({ data: null, error: { message }, count: null, status: 400, statusText: 'Error' });

  // Create a mock supabase client
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => mockResponse([]),
        order: () => mockResponse([]),
        single: () => mockResponse({}),
        execute: () => mockResponse([])
      }),
      insert: () => ({
        select: () => ({
          single: () => mockResponse({})
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => mockResponse({})
          })
        })
      }),
      delete: () => ({
        eq: () => mockErrorResponse('This is a mock response. Please connect to Supabase.')
      })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    // Add other methods as needed
  } as any;
} else {
  // Create the real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

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
