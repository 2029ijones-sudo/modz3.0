import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

// SIMPLIFIED Supabase client - remove problematic config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

// CRITICAL FIX: Service Worker Block - must run immediately
if (typeof window !== 'undefined') {
  // Immediately block service worker registration
  const originalRegister = navigator.serviceWorker.register;
  navigator.serviceWorker.register = function(scriptURL, options) {
    console.log('Blocked service worker:', scriptURL);
    return Promise.reject(new Error('Service workers disabled'));
  };
  
  // Clean up any existing
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        console.log('Removing existing service worker:', reg.scope);
        reg.unregister();
      });
    });
  }
}

// FIX FOR 406 ERROR: Get profile with correct format
export async function getProfile(userId) {
  try {
    if (!userId) return null;
    
    // The 406 error is likely due to malformed query. Let's try different approaches:
    
    // APPROACH 1: Simple select with specific columns
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, bio, profile_picture_url, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.log('Profile fetch error (approach 1):', error.message);
      
      // APPROACH 2: Try with raw fetch (bypass Supabase client issues)
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data[0] || null;
      }
      
      return null;
    }
    
    return data;
  } catch (error) {
    console.log('Profile fetch exception:', error.message);
    return null;
  }
}

// Create profile if doesn't exist
export async function createProfileIfNeeded(userId, email) {
  try {
    const existingProfile = await getProfile(userId);
    if (existingProfile) return existingProfile;
    
    const username = email?.split('@')[0] || `user_${userId.slice(0, 8)}`;
    
    // Try direct REST API if Supabase client has issues
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          username: username,
          bio: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('Created profile via REST API');
      return data[0];
    }
    
    console.log('Failed to create profile:', await response.text());
    return null;
  } catch (error) {
    console.log('Create profile error:', error.message);
    return null;
  }
}

// Safe database initialization
export async function initializeDatabase() {
  try {
    if (typeof window === 'undefined') return;
    
    // Test with simple query that doesn't trigger 406
    const { error } = await supabase
      .from('mods')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Database note:', error.message);
    } else {
      console.log('Database connected');
    }
  } catch (error) {
    console.log('Init error:', error.message);
  }
}

// Current user helper - FIXED
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('getCurrentUser error:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.log('getCurrentUser exception:', error.message);
    return null;
  }
}

// FIXED: Setup auth listener WITHOUT auto-creating profiles
export function setupAuthListener() {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    
    // ONLY log, don't fetch profiles or create them
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      console.log('User authenticated:', session?.user?.email);
    }
    
    if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  });
}

// REMOVE the global initialization or change to:
if (typeof window !== 'undefined') {
  // Only initialize database, NOT auth listener
  setTimeout(() => {
    initializeDatabase();
  }, 500);
}
