import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ADD BROWSER LOCALSTORAGE SUPPORT
const createBrowserClient = () => {
  if (typeof window === 'undefined') {
    // Return a dummy client for server-side
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage, // CRITICAL: Tell Supabase to use localStorage
      storageKey: 'modz3-supabase-auth'
    },
    // ADD GLOBAL HEADERS TO FIX 406 ERRORS
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    }
  });
};

export const supabase = createBrowserClient();

// Initialize database with mods table
export async function initializeDatabase() {
  const { error } = await supabase
    .from('mods')
    .select('count')
    .limit(1);
}
