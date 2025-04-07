
// Re-export the supabase client from the integrations directory
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Database type definitions - these are now defined in the transactions.ts file
export type { DbTransaction } from './db/transactions';
