// public/sw.js - Enhanced Service Worker for Modz with Full Offline Support

const CACHE_NAME = 'modz-v5-offline';
const OFFLINE_ASSETS = {
  HTML: '/offline.html',  // You'll need to create this
  IMAGE: '/Modz.png',
  DATA: '/offline-data.json'
};

// Critical assets to cache for offline use
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Modz.png',
  '/styles/three-components.css',
  '/offline.html',  // Offline fallback page
  '/js/app.js',     // Your main app script
  '/js/offline.js', // Offline-specific logic
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  
  // Add more static assets your app needs
  '/css/styles.css',
  '/favicon.ico'
];

// URLs to skip caching (dynamic/auth endpoints)
const SKIP_CACHE_URLS = [
  // Supabase endpoints (auth only)
  '/auth/v1/token',
  '/auth/v1/logout',
  '/auth/v1/refresh',
  '/rest/v1/auth',
  
  // GitHub OAuth
  'github.com/login/oauth',
  'access_token',
  
  // Real-time/WebSocket connections
  'realtime',
  'websocket',
  'wss://'
];

// URLs that CAN be cached for offline (read-only APIs)
const OFFLINE_API_CACHE = [
  '/api/mods/public',
  '/api/mods/featured',
  '/api/assets',
  '/api/config'
];

// Determine strategy for different resources
function getStrategy(url) {
  const urlString = url.toString();
  
  // ====== SKIP DYNAMIC/AUTH REQUESTS ======
  for (const skipUrl of SKIP_CACHE_URLS) {
    if (urlString.includes(skipUrl)) {
      console.log(`🚫 Network-only (auth/dynamic): ${urlString}`);
      return 'network-only';
    }
  }
  
  // Offline API cache (GET requests only)
  if (event && event.request.method === 'GET') {
    for (const cacheUrl of OFFLINE_API_CACHE) {
      if (urlString.includes(cacheUrl)) {
        console.log(`📊 Offline API cache: ${urlString}`);
        return 'cache-first-with-update';
      }
    }
  }
  
  // Static assets - cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$/)) {
    return 'cache-first';
  }
  
  // HTML pages - network first with offline fallback
  if (url.pathname.match(/\.html?$/) || url.pathname === '/') {
    return 'network-first-with-offline';
  }
  
  // API calls - network first
  if (url.pathname.startsWith('/api/')) {
    return 'network-first';
  }
  
  // Default
  return 'network-first-with-offline';
}

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🚀 Modz Service Worker installing (offline enabled)...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('📦 Caching offline assets');
          return cache.addAll(ASSETS_TO_CACHE);
        }),
      
      // Create offline fallback responses
      createOfflineFallbacks()
    ])
    .then(() => {
      console.log('✅ Offline assets cached');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('❌ Cache installation failed:', error);
    })
  );
});

// Create offline fallback responses
async function createOfflineFallbacks() {
  const cache = await caches.open(CACHE_NAME);
  
  // HTML offline page
  const offlineHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Modz - Offline</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .container {
          max-width: 500px;
          padding: 2rem;
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 2rem;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2rem;
          font-size: 1rem;
          border-radius: 50px;
          cursor: pointer;
          transition: transform 0.3s;
        }
        button:hover {
          transform: scale(1.05);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📶</div>
        <h1>You're Offline</h1>
        <p>Don't worry! You can still browse previously loaded 3D models and assets.</p>
        <p>New features requiring internet will be available when you reconnect.</p>
        <button onclick="window.location.reload()">Retry Connection</button>
        <button onclick="history.back()" style="margin-left: 1rem; background: transparent; border: 1px solid white;">Go Back</button>
      </div>
    </body>
    </html>
  `;
  
  await cache.put(
    new Request('/offline.html'),
    new Response(offlineHtml, {
      headers: { 'Content-Type': 'text/html' }
    })
  );
  
  // Offline data for API fallback
  const offlineData = {
    timestamp: new Date().toISOString(),
    message: "You're offline. Data was last updated while online.",
    cachedMods: [],
    status: "offline"
  };
  
  await cache.put(
    new Request('/offline-data.json'),
    new Response(JSON.stringify(offlineData), {
      headers: { 'Content-Type': 'application/json' }
    })
  );
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Modz Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean old caches
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
        }),
      
      // Claim clients immediately
      self.clients.claim(),
      
      // Initialize IndexedDB for offline storage
      initializeOfflineDatabase()
    ])
    .then(() => {
      console.log('✅ Service Worker activated with offline support');
      
      // Notify all clients that we're ready
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY',
            version: 'v5-offline',
            timestamp: new Date().toISOString()
          });
        });
      });
    })
  );
});

// ====== OFFLINE-ENABLED STRATEGIES ======

// Cache-first with background update
async function cacheFirstWithUpdate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Always return cached version immediately for offline
  if (cachedResponse) {
    console.log(`📦 Serving cached API data: ${request.url}`);
    
    // Update in background if online
    if (navigator.onLine) {
      fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            console.log(`🔄 Updated cache in background: ${request.url}`);
            
            // Notify app about updated data
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'DATA_UPDATED',
                  url: request.url,
                  timestamp: new Date().toISOString()
                });
              });
            });
          }
        })
        .catch(error => {
          console.log(`⚠️ Background update failed: ${request.url}`, error);
        });
    }
    
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error(`❌ Network failed for API: ${request.url}`, error);
    
    // Return generic offline response
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline. Please reconnect to fetch new data.',
        cached: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Offline': 'true'
        }
      }
    );
  }
}

// Network first with offline fallback
async function networkFirstWithOffline(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log(`🌐 Network failed, trying cache: ${request.url}`);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For HTML requests, return offline page
    if (request.headers.get('Accept')?.includes('text/html')) {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // For API requests, return offline data
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          status: 'offline',
          message: 'You are offline. Data will sync when you reconnect.',
          cached: false,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-Offline': 'true'
          }
        }
      );
    }
    
    // Generic offline response
    return new Response(
      'You are offline. Please check your internet connection.',
      {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}

// Cache-first (for static assets)
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
    
    // For images, return placeholder
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
      return caches.match('/Modz.png');
    }
    
    throw error;
  }
}

// Network-first
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network-only (for auth)
async function networkOnly(request) {
  console.log(`🌐 Network-only: ${request.url}`);
  return fetch(request);
}

// ====== MAIN FETCH HANDLER ======
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const urlString = url.toString();
  
  // Skip non-GET requests for caching
  if (event.request.method !== 'GET') {
    // But allow POST to be intercepted for offline queue
    if (event.request.method === 'POST' && urlString.includes('/api/')) {
      handleOfflinePost(event);
      return;
    }
    return;
  }
  
  // Skip browser extensions and dev tools
  if (urlString.startsWith('chrome-extension://') ||
      urlString.includes('sockjs-node') ||
      urlString.includes('hot-update')) {
    return;
  }
  
  const strategy = getStrategy(url);
  
  console.log(`🔄 ${strategy} for ${url.pathname}`);
  
  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request));
      break;
      
    case 'network-first':
      event.respondWith(networkFirst(event.request));
      break;
      
    case 'network-first-with-offline':
      event.respondWith(networkFirstWithOffline(event.request));
      break;
      
    case 'cache-first-with-update':
      event.respondWith(cacheFirstWithUpdate(event.request));
      break;
      
    case 'network-only':
      // Don't intercept - let it go directly to network
      return;
      
    default:
      event.respondWith(
        networkFirstWithOffline(event.request)
      );
  }
});

// Handle POST requests while offline
async function handleOfflinePost(event) {
  if (!navigator.onLine) {
    // Queue the request for later
    const request = event.request;
    const requestData = await request.clone().json();
    
    // Store in IndexedDB for later sync
    const db = await getOfflineDatabase();
    await db.add('pendingRequests', {
      url: request.url,
      method: 'POST',
      data: requestData,
      timestamp: Date.now(),
      retries: 0
    });
    
    // Return success response immediately
    event.respondWith(
      new Response(
        JSON.stringify({
          status: 'queued',
          message: 'Request queued for when you reconnect',
          id: Date.now(),
          timestamp: new Date().toISOString()
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
    
    // Register a sync if available
    if ('sync' in self.registration) {
      self.registration.sync.register('sync-pending-requests');
    }
  }
}

// ====== OFFLINE DATABASE ======
async function initializeOfflineDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ModzOfflineDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Pending requests (for POST/PUT/DELETE)
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('url', 'url');
      }
      
      // Cached API responses
      if (!db.objectStoreNames.contains('apiCache')) {
        const store = db.createObjectStore('apiCache', {
          keyPath: 'url'
        });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('expires', 'expires');
      }
      
      // Offline mods/3D models
      if (!db.objectStoreNames.contains('offlineModels')) {
        const store = db.createObjectStore('offlineModels', {
          keyPath: 'id'
        });
        store.createIndex('name', 'name');
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function getOfflineDatabase() {
  const db = await initializeOfflineDatabase();
  return {
    add: (storeName, data) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    getAll: (storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    delete: (storeName, id) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  };
}

// ====== SYNC EVENTS ======
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    console.log('🔄 Syncing pending requests...');
    event.waitUntil(syncPendingRequests());
  }
  
  if (event.tag === 'sync-models') {
    console.log('🔄 Syncing offline models...');
    event.waitUntil(syncOfflineModels());
  }
});

// Sync pending requests when back online
async function syncPendingRequests() {
  const db = await getOfflineDatabase();
  const pending = await db.getAll('pendingRequests');
  
  for (const request of pending) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.data)
      });
      
      if (response.ok) {
        await db.delete('pendingRequests', request.id);
        console.log(`✅ Synced: ${request.url}`);
        
        // Notify clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              requestId: request.id,
              success: true
            });
          });
        });
      }
    } catch (error) {
      console.error(`❌ Sync failed: ${request.url}`, error);
      
      // Increment retry count
      request.retries++;
      if (request.retries < 3) {
        // Will retry on next sync
        console.log(`🔄 Will retry (${request.retries}/3): ${request.url}`);
      } else {
        // Too many retries, delete
        await db.delete('pendingRequests', request.id);
        console.log(`🗑️ Deleted after too many retries: ${request.url}`);
      }
    }
  }
}

// ====== PUSH NOTIFICATIONS ======
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Modz update available',
    icon: '/Modz.png',
    badge: '/Modz.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/',
      timestamp: new Date().toISOString()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Modz', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// ====== MESSAGE HANDLING ======
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearCacheAndDatabase()
        .then(() => {
          event.ports?.[0]?.postMessage({ success: true });
        })
        .catch(error => {
          event.ports?.[0]?.postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'SAVE_FOR_OFFLINE':
      saveModelForOffline(data)
        .then(() => {
          event.ports?.[0]?.postMessage({ success: true });
        })
        .catch(error => {
          event.ports?.[0]?.postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'CHECK_OFFLINE_STATUS':
      checkOfflineStatus()
        .then(status => {
          event.ports?.[0]?.postMessage({ success: true, status });
        });
      break;
  }
});

// Save 3D model for offline use
async function saveModelForOffline(modelData) {
  const db = await getOfflineDatabase();
  
  await db.add('offlineModels', {
    id: modelData.id || Date.now(),
    name: modelData.name,
    data: modelData.model,
    preview: modelData.preview,
    timestamp: Date.now(),
    size: JSON.stringify(modelData.model).length
  });
  
  // Also cache any associated assets
  if (modelData.textures) {
    for (const textureUrl of modelData.textures) {
      try {
        const response = await fetch(textureUrl);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(new Request(textureUrl), response);
        }
      } catch (error) {
        console.error(`❌ Failed to cache texture: ${textureUrl}`, error);
      }
    }
  }
  
  console.log(`✅ Saved model for offline: ${modelData.name}`);
}

// Check offline capabilities
async function checkOfflineStatus() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  const db = await getOfflineDatabase();
  const offlineModels = await db.getAll('offlineModels');
  
  return {
    cacheSize: keys.length,
    offlineModels: offlineModels.length,
    storage: {
      estimated: await navigator.storage?.estimate?.(),
      persisted: await navigator.storage?.persisted?.()
    },
    capabilities: {
      backgroundSync: 'sync' in self.registration,
      periodicSync: 'periodicSync' in self.registration,
      pushNotifications: 'PushManager' in self
    }
  };
}

// Clear all offline data
async function clearCacheAndDatabase() {
  await caches.delete(CACHE_NAME);
  
  const request = indexedDB.deleteDatabase('ModzOfflineDB');
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ====== OFFLINE DETECTION ======
self.addEventListener('offline', () => {
  console.log('📴 App is offline');
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: false,
        timestamp: new Date().toISOString()
      });
    });
  });
});

self.addEventListener('online', () => {
  console.log('📶 App is back online');
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: true,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  // Trigger sync when back online
  if ('sync' in self.registration) {
    self.registration.sync.register('sync-pending-requests');
    self.registration.sync.register('sync-models');
  }
});

console.log('⚡ Mods Service Worker loaded (Full Offline Support v5)');
