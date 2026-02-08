import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ADD THESE AUTH OPTIONS:
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,      // Auto-refresh expired tokens
    persistSession: true,        // Save session to localStorage
    detectSessionInUrl: true,    // Detect OAuth callback in URL
    storageKey: 'modz3-supabase-auth'  // UNIQUE KEY TO PREVENT CONFLICTS
  }
});

// Initialize database with mods table
export async function initializeDatabase() {
  const { error } = await supabase
    .from('mods')
    .select('count')
    .limit(1);
    
  // Table will be created automatically if it doesn't exist
}
