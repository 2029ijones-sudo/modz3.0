// public/sw.js - Advanced Service Worker for Modz

const CACHE_NAME = 'modz-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/Modz.png',
  '/styles/three-components.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Cache strategies
const STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only'
};

// Determine strategy for different resources
function getStrategy(url) {
  // API calls - network first
  if (url.pathname.startsWith('/api/')) {
    return STRATEGIES.NETWORK_FIRST;
  }
  
  // Static assets - cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return STRATEGIES.CACHE_FIRST;
  }
  
  // HTML pages - stale while revalidate
  if (url.pathname.match(/\.html?$/) || url.pathname === '/') {
    return STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // Default
  return STRATEGIES.NETWORK_FIRST;
}

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🚀 Modz Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching critical assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Modz Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(`🗑️ Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log(`📦 Cache hit: ${request.url}`);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error(`❌ Network failed: ${request.url}`, error);
    // Return offline page or fallback
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'You are offline. Please check your connection.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log(`🌐 Network failed, trying cache: ${request.url}`);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Return cached version immediately
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed - we already have cached response or will return offline
    });
  
  return cachedResponse || fetchPromise;
}

// Fetch event - main handler
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://') ||
      event.request.url.includes('sockjs-node')) {
    return;
  }
  
  const url = new URL(event.request.url);
  const strategy = getStrategy(url);
  
  console.log(`🔄 ${strategy} for ${url.pathname}`);
  
  switch (strategy) {
    case STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(event.request));
      break;
      
    case STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(event.request));
      break;
      
    case STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(event.request));
      break;
      
    default:
      event.respondWith(fetch(event.request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mod-data') {
    console.log('🔄 Background sync for mod data');
    event.waitUntil(syncModData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Modz';
  const options = {
    body: data.body || 'New update available!',
    icon: '/Modz.png',
    badge: '/Modz.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  event.notification.close();
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync function example
async function syncModData() {
  try {
    const db = await openModDatabase();
    const pendingMods = await db.getAll('pendingMods');
    
    for (const mod of pendingMods) {
      const response = await fetch('/api/mods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mod)
      });
      
      if (response.ok) {
        await db.delete('pendingMods', mod.id);
        console.log(`✅ Synced mod: ${mod.name}`);
      }
    }
    
    // Show notification when sync completes
    self.registration.showNotification('Modz', {
      body: 'Offline mods synced successfully!',
      icon: '/Modz.png'
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Helper: IndexedDB for offline mod storage
function openModDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ModzDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store for pending mods
      if (!db.objectStoreNames.contains('pendingMods')) {
        const store = db.createObjectStore('pendingMods', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Create object store for cached 3D assets
      if (!db.objectStoreNames.contains('assets')) {
        const store = db.createObjectStore('assets', { keyPath: 'url' });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// Periodic sync (if browser supports it)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-assets') {
      console.log('🔄 Periodic asset update');
      event.waitUntil(updateCachedAssets());
    }
  });
}

// Update cached assets periodically
async function updateCachedAssets() {
  const cache = await caches.open(CACHE_NAME);
  const requests = ASSETS_TO_CACHE.map(url => new Request(url));
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
        console.log(`✅ Updated cache: ${request.url}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update: ${request.url}`, error);
    }
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});

console.log('⚡ Modz Advanced Service Worker loaded');
