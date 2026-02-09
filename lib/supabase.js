import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Create a single instance of Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Set to false to prevent URL-based auth issues
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'modz3-supabase-auth',
    flowType: 'pkce', // Use PKCE flow for better security
    // Disable service worker for auth
    disableMultiTabAuth: false,
  },
  // Global fetch options
  global: {
    headers: { 'Content-Type': 'application/json' }
  }
});

// Safe database initialization with error handling
export async function initializeDatabase() {
  try {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Check if we have internet connection
    if (!navigator.onLine) {
      console.warn('No internet connection. Skipping database initialization.');
      return;
    }
    
    // Check if mods table exists with a safer query
    const { data, error } = await supabase
      .from('mods')
      .select('id')
      .limit(1)
      .maybeSingle(); // Returns null instead of throwing error if no rows
    
    if (error) {
      // If table doesn't exist, this error will occur
      console.warn('Mods table might not exist:', error.message);
      
      // You might want to create the table here if needed
      // But for now, we'll just warn and continue
      return;
    }
    
    console.log('Database initialized successfully');
    return data;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return null;
  }
}

// Add a function to disable service worker if causing issues
export function disableServiceWorkerRegistration() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Unregister any existing service workers
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }
}

// Helper function to check if user is authenticated
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

// Helper function to handle auth state changes
export function setupAuthListener(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, 'Session:', session ? 'exists' : 'none');
    
    if (callback) {
      callback(event, session);
    }
  });
}

// Initialize on module load in browser
if (typeof window !== 'undefined') {
  // Disable service worker if it's causing 404 errors
  disableServiceWorkerRegistration();
  
  // Set up default auth listener for debugging
  setupAuthListener((event, session) => {
    console.log(`Auth state changed to: ${event}`);
  });
  
  // Initialize database on page load
  setTimeout(() => {
    initializeDatabase().catch(console.error);
  }, 1000); // Delay to ensure page is fully loaded
}
