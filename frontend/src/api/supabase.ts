import { createClient } from '@supabase/supabase-js';

// Fallback to env vars if available, but hardcoding here for immediate resolution for the user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://klplpflfjgqfyuccymgg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_771H2voAXXBecx8Xc0sFKQ_1OkpybE6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
