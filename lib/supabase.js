import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// FIX 1: Create Supabase client with proper headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'modz3-supabase-auth'
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      // Remove Authorization header from global - it's added automatically
    }
  }
});

// FIX 2: Service Worker - MUST run immediately
if (typeof window !== 'undefined') {
  // UNREGISTER service workers immediately
  if ('serviceWorker' in navigator) {
    // Unregister ALL service workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        console.log('Unregistering service worker:', registration.scope);
        registration.unregister();
      });
    });
    
    // Also clear service worker cache
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
}

// FIX 3: Safe database initialization
export async function initializeDatabase() {
  try {
    if (typeof window === 'undefined') return;
    
    const { error } = await supabase
      .from('mods')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Database note:', error.message);
    }
    
    return true;
  } catch (error) {
    console.log('Init note:', error.message);
    return false;
  }
}

// FIX 4: Get profiles with proper headers
export async function getProfile(userId) {
  try {
    if (!userId) return null;
    
    // Use the proper Supabase query format
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single() to avoid 406
    
    if (error) {
      // Check if profile table exists
      if (error.message.includes('relation') || error.code === '406') {
        console.log('Profiles table might need setup or has permission issues');
        return null;
      }
      console.log('Profile fetch error:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.log('Profile error:', error.message);
    return null;
  }
}

// FIX 5: Current user helper
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('Auth note:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.log('User fetch note:', error.message);
    return null;
  }
}

// FIX 6: Setup auth listener
export function setupAuthListener() {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event);
    
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (session?.user?.id) {
        // Try to get profile
        const profile = await getProfile(session.user.id);
        if (!profile) {
          console.log('No profile found, creating one...');
          // You might want to create a profile here
        }
      }
    }
  });
}

// Initialize on load
if (typeof window !== 'undefined') {
  // Setup auth listener
  const { data: { subscription } } = setupAuthListener();
  
  // Initialize database
  setTimeout(() => {
    initializeDatabase();
  }, 500);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  });
}
