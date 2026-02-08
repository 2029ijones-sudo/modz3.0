// public/sw.js - ADVANCED OFFLINE-FIRST SERVICE WORKER
const CACHE_NAME = 'modz-advanced-v2';
const VERSION = '2.0.0';
const OFFLINE_URL = '/offline.html';
const API_CACHE_NAME = 'modz-api-cache-v1';

// Configuration
const CONFIG = {
  // Cache strategies
  strategies: {
    STATIC: 'static-first',
    API: 'network-first',
    IMAGE: 'cache-first',
    FALLBACK: 'network-only'
  },
  
  // Cache durations (in milliseconds)
  cacheDuration: {
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
    api: 5 * 60 * 1000, // 5 minutes
    image: 24 * 60 * 60 * 1000, // 24 hours
    fallback: 0
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: true
  },
  
  // Network timeout (ms)
  networkTimeout: 5000,
  
  // Cache size limits
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  maxCacheItems: 1000
};

// Service Worker State
class SWState {
  constructor() {
    this.isOnline = navigator.onLine;
    this.cacheSize = 0;
    this.cacheItems = 0;
    this.syncQueue = [];
    this.backgroundSync = [];
    this.isInstalled = false;
    this.isActivated = false;
    this.lastSync = null;
    this.offlineUsers = new Map();
    this.authTokens = new Map();
    
    this.init();
  }
  
  init() {
    console.log(`🚀 Advanced Service Worker v${VERSION} initializing...`);
    
    // Setup network listeners
    self.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Network status: Online');
      this.processSyncQueue();
      this.broadcast({ type: 'NETWORK_STATUS', online: true });
    });
    
    self.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Network status: Offline');
      this.broadcast({ type: 'NETWORK_STATUS', online: false });
    });
    
    // Load initial state
    this.loadState();
  }
  
  async loadState() {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      this.cacheItems = keys.length;
      
      // Calculate approximate cache size
      let totalSize = 0;
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            totalSize += parseInt(contentLength);
          }
        }
      }
      this.cacheSize = totalSize;
      
      console.log(`📊 Cache stats: ${this.cacheItems} items, ${Math.round(this.cacheSize / 1024 / 1024)}MB`);
    } catch (error) {
      console.warn('Failed to load cache state:', error);
    }
  }
  
  async addToSyncQueue(operation) {
    const queueItem = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      ...operation,
      timestamp: Date.now(),
      attempts: 0,
      status: 'pending'
    };
    
    this.syncQueue.push(queueItem);
    
    // Store in IndexedDB for persistence
    await this.storeInIndexedDB('sync_queue', queueItem);
    
    console.log(`📥 Added to sync queue: ${operation.type}`);
    
    // Try to process immediately if online
    if (this.isOnline) {
      await this.processSyncQueue();
    } else {
      // Register for background sync
      if ('sync' in self.registration) {
        try {
          await self.registration.sync.register('modz-sync');
          console.log('🔄 Background sync registered');
        } catch (error) {
          console.warn('Background sync registration failed:', error);
        }
      }
    }
  }
  
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;
    
    console.log(`🔄 Processing sync queue (${this.syncQueue.length} items)...`);
    
    const successful = [];
    const failed = [];
    
    for (const item of this.syncQueue) {
      try {
        await this.processSyncItem(item);
        successful.push(item.id);
        item.status = 'completed';
        
        // Remove from IndexedDB
        await this.deleteFromIndexedDB('sync_queue', item.id);
      } catch (error) {
        item.attempts++;
        console.warn(`Sync failed for ${item.type} (attempt ${item.attempts}):`, error);
        
        if (item.attempts >= CONFIG.retry.attempts) {
          failed.push(item.id);
          item.status = 'failed';
          
          // Store failed items for manual retry
          await this.storeInIndexedDB('failed_syncs', item);
          await this.deleteFromIndexedDB('sync_queue', item.id);
        } else {
          // Update with new attempt count
          await this.storeInIndexedDB('sync_queue', item);
        }
      }
    }
    
    // Remove completed items from queue
    this.syncQueue = this.syncQueue.filter(item => 
      !successful.includes(item.id) && !failed.includes(item.id)
    );
    
    this.lastSync = Date.now();
    
    console.log(`✅ Sync completed: ${successful.length} successful, ${failed.length} failed`);
    this.broadcast({ 
      type: 'SYNC_COMPLETE', 
      successful: successful.length, 
      failed: failed.length 
    });
  }
  
  async processSyncItem(item) {
    switch (item.type) {
      case 'API_CALL':
        return await this.syncApiCall(item);
      case 'DATA_UPDATE':
        return await this.syncDataUpdate(item);
      case 'FILE_UPLOAD':
        return await this.syncFileUpload(item);
      case 'AUTH_SYNC':
        return await this.syncAuth(item);
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }
  
  async syncApiCall(item) {
    const { url, method, headers, body } = item.data;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.networkTimeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  async storeInIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ModzServiceWorkerDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        const putRequest = store.put(data);
        putRequest.onsuccess = () => resolve(putRequest.result);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('status', 'status');
        }
        
        if (!db.objectStoreNames.contains('failed_syncs')) {
          const store = db.createObjectStore('failed_syncs', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('offline_data')) {
          const store = db.createObjectStore('offline_data', { keyPath: 'id' });
          store.createIndex('type', 'type');
        }
        
        if (!db.objectStoreNames.contains('offline_users')) {
          const store = db.createObjectStore('offline_users', { keyPath: 'id' });
          store.createIndex('token', 'token', { unique: true });
        }
      };
    });
  }
  
  async deleteFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ModzServiceWorkerDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }
  
  broadcast(message) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage(message);
      });
    });
  }
}

// Cache Strategy Manager
class CacheStrategy {
  constructor() {
    this.strategies = new Map();
    this.setupStrategies();
  }
  
  setupStrategies() {
    // Static-first: Cache then network
    this.strategies.set(CONFIG.strategies.STATIC, async (request) => {
      const cached = await caches.match(request);
      if (cached) {
        // Update cache in background
        this.updateCacheInBackground(request);
        return cached;
      }
      
      return this.networkFirst(request);
    });
    
    // Network-first: Network then cache
    this.strategies.set(CONFIG.strategies.API, async (request) => {
      try {
        const networkResponse = await this.fetchWithTimeout(request);
        // Cache successful API responses (but with short TTL)
        if (networkResponse.ok) {
          const cache = await caches.open(API_CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Fallback to cache if network fails
        const cached = await caches.match(request);
        if (cached) {
          console.log('📦 Serving API from cache (network failed)');
          return cached;
        }
        throw error;
      }
    });
    
    // Cache-first: Cache only, network for update
    this.strategies.set(CONFIG.strategies.IMAGE, async (request) => {
      const cached = await caches.match(request);
      if (cached) {
        // Update in background
        this.updateCacheInBackground(request);
        return cached;
      }
      
      // If not in cache, fetch and cache
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    });
    
    // Network-only: Don't cache
    this.strategies.set(CONFIG.strategies.FALLBACK, async (request) => {
      return fetch(request);
    });
  }
  
  async fetchWithTimeout(request, timeout = CONFIG.networkTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  async updateCacheInBackground(request) {
    // Don't wait for this to complete
    fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
      }
    }).catch(() => {
      // Silently fail - we already have cached version
    });
  }
  
  getStrategyForRequest(request) {
    const url = new URL(request.url);
    
    // Static assets
    if (url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.includes('/_next/static/')) {
      return CONFIG.strategies.STATIC;
    }
    
    // Images
    if (url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.gif') ||
        url.pathname.endsWith('.webp')) {
      return CONFIG.strategies.IMAGE;
    }
    
    // API calls
    if (url.pathname.includes('/api/') ||
        url.pathname.includes('/rest/')) {
      return CONFIG.strategies.API;
    }
    
    // Default: network-first
    return CONFIG.strategies.FALLBACK;
  }
  
  async handle(request) {
    const strategy = this.getStrategyForRequest(request);
    const handler = this.strategies.get(strategy);
    
    if (!handler) {
      return fetch(request);
    }
    
    return handler(request);
  }
}

// Offline Auth System
class OfflineAuth {
  constructor() {
    this.users = new Map();
    this.tokens = new Map();
    this.sessions = new Map();
  }
  
  async createOfflineUser(profile) {
    const userId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = this.generateToken();
    
    const user = {
      id: userId,
      email: profile.email || `user${Date.now()}@offline.github`,
      name: profile.name || 'Offline User',
      avatar: profile.avatar || '/default-avatar.png',
      token,
      permissions: {
        canView: true,
        canEdit: true,
        canUpload: false,
        canComment: true
      },
      created: Date.now(),
      lastLogin: Date.now(),
      provider: profile.provider || 'offline'
    };
    
    this.users.set(userId, user);
    this.tokens.set(token, userId);
    
    // Store in IndexedDB
    await this.storeUser(user);
    
    return { user, token };
  }
  
  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  async validateToken(token) {
    const userId = this.tokens.get(token);
    if (!userId) return null;
    
    const user = this.users.get(userId);
    if (!user) return null;
    
    // Update last login
    user.lastLogin = Date.now();
    await this.storeUser(user);
    
    return user;
  }
  
  async storeUser(user) {
    // Implementation for IndexedDB storage
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ModzAuthDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('users')) {
          const tx = db.transaction(['users'], 'readwrite');
          const store = tx.objectStore('users');
          store.put(user);
          tx.oncomplete = () => resolve();
        } else {
          resolve();
        }
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
      };
    });
  }
}

// Main Service Worker Instance
let swState;
let cacheStrategy;
let offlineAuth;

// Install Event
self.addEventListener('install', (event) => {
  console.log('🚀 Installing Advanced Service Worker...');
  
  event.waitUntil(
    (async () => {
      // Initialize components
      swState = new SWState();
      cacheStrategy = new CacheStrategy();
      offlineAuth = new OfflineAuth();
      
      // Pre-cache essential assets
      const cache = await caches.open(CACHE_NAME);
      const urlsToCache = [
        '/',
        '/manifest.json',
        '/Modz.png',
        '/offline.html',
        '/default-avatar.png',
        '/styles/three-components.css'
      ];
      
      await cache.addAll(urlsToCache);
      
      // Create API cache
      await caches.open(API_CACHE_NAME);
      
      swState.isInstalled = true;
      console.log('✅ Installation complete');
      
      return self.skipWaiting();
    })()
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('⚡ Activating Advanced Service Worker...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(key => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log(`🗑️ Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
      
      // Claim clients immediately
      await self.clients.claim();
      
      swState.isActivated = true;
      console.log('✅ Activation complete');
      
      // Broadcast ready state
      swState.broadcast({ 
        type: 'SW_READY', 
        version: VERSION,
        offlineCapable: true
      });
    })()
  );
});

// Fetch Event - THE MAIN EVENT
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle auth callbacks specially
  if (url.pathname.includes('/auth/callback') || url.hash.includes('access_token=')) {
    event.respondWith(handleAuthCallback(event.request));
    return;
  }
  
  // Don't intercept external requests (Supabase, GitHub, CDNJS)
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('github.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    return; // Let browser handle directly
  }
  
  // For navigation requests, ensure we serve the app shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await cacheStrategy.handle(event.request);
          return response;
        } catch (error) {
          // If offline and navigation fails, show offline page
          const cache = await caches.open(CACHE_NAME);
          const offlinePage = await cache.match(OFFLINE_URL);
          return offlinePage || new Response('Offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })()
    );
    return;
  }
  
  // For all other same-origin requests, use our strategies
  if (url.origin === self.location.origin) {
    event.respondWith(
      cacheStrategy.handle(event.request)
        .catch(error => {
          console.warn('Fetch failed:', error);
          
          // For API calls, return cached version if available
          if (url.pathname.includes('/api/') || url.pathname.includes('/rest/')) {
            return caches.match(event.request)
              .then(cached => cached || Promise.reject(error));
          }
          
          throw error;
        })
    );
  }
});

// Handle auth callback
async function handleAuthCallback(request) {
  const url = new URL(request.url);
  
  if (url.hash.includes('access_token=')) {
    const hash = url.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const provider = params.get('provider') || 'github';
    
    if (accessToken) {
      // Create offline user profile
      const offlineProfile = {
        email: `${provider}_user_${Date.now()}@temp.com`,
        name: `${provider} User`,
        avatar: '/default-avatar.png',
        provider
      };
      
      const { user, token } = await offlineAuth.createOfflineUser(offlineProfile);
      
      // Store the real token for sync when online
      if (swState) {
        await swState.addToSyncQueue({
          type: 'AUTH_SYNC',
          data: { accessToken, provider, user }
        });
      }
      
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .success { 
              font-size: 24px; 
              margin: 20px 0; 
              padding: 20px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            .token { 
              font-family: monospace; 
              background: rgba(0, 0, 0, 0.3);
              padding: 10px;
              border-radius: 5px;
              margin: 20px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Authentication Successful!</h2>
            <p>You can now use Modz offline.</p>
            <div class="token">Token: ${token}</div>
            <p>Keep this token safe for offline access.</p>
            <p>Closing window in 3 seconds...</p>
          </div>
          <script>
            // Send token back to main window
            window.opener.postMessage({
              type: 'AUTH_CALLBACK',
              access_token: '${token}',
              provider: '${provider}',
              offline_mode: true,
              user: ${JSON.stringify(user)}
            }, '*');
            
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
        `,
        { 
          headers: { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
  }
  
  return fetch(request);
}

// Message Handler
self.addEventListener('message', (event) => {
  const { type, data, id } = event.data || {};
  
  const respond = (response) => {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ id, ...response });
    }
  };
  
  (async () => {
    try {
      switch (type) {
        case 'PING':
          respond({ pong: true, version: VERSION, online: swState?.isOnline });
          break;
          
        case 'GET_CACHE_INFO':
          respond({
            cacheSize: swState?.cacheSize,
            cacheItems: swState?.cacheItems,
            isOnline: swState?.isOnline,
            syncQueueLength: swState?.syncQueue?.length || 0
          });
          break;
          
        case 'CLEAR_CACHE':
          await caches.delete(CACHE_NAME);
          await caches.delete(API_CACHE_NAME);
          if (swState) {
            swState.cacheSize = 0;
            swState.cacheItems = 0;
          }
          respond({ success: true });
          break;
          
        case 'QUEUE_SYNC':
          if (swState) {
            await swState.addToSyncQueue(data);
            respond({ success: true, queued: true });
          } else {
            respond({ success: false, error: 'SW not initialized' });
          }
          break;
          
        case 'FORCE_SYNC':
          if (swState) {
            await swState.processSyncQueue();
            respond({ success: true });
          } else {
            respond({ success: false, error: 'SW not initialized' });
          }
          break;
          
        case 'OFFLINE_LOGIN':
          if (offlineAuth) {
            const result = await offlineAuth.createOfflineUser(data);
            respond({ success: true, data: result });
          } else {
            respond({ success: false, error: 'Auth system not ready' });
          }
          break;
          
        case 'VALIDATE_OFFLINE_TOKEN':
          if (offlineAuth) {
            const user = await offlineAuth.validateToken(data.token);
            respond({ success: true, user });
          } else {
            respond({ success: false, error: 'Auth system not ready' });
          }
          break;
          
        case 'GET_OFFLINE_DATA':
          // Implementation for getting offline data from IndexedDB
          respond({ success: true, data: [] });
          break;
          
        default:
          respond({ success: false, error: 'Unknown command' });
      }
    } catch (error) {
      respond({ success: false, error: error.message });
    }
  })();
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event.tag);
  
  if (event.tag === 'modz-sync') {
    event.waitUntil(
      (async () => {
        if (swState) {
          await swState.processSyncQueue();
        }
      })()
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'Modz Notification',
      body: 'You have updates in Modz',
      icon: '/Modz.png'
    };
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/Modz.png',
    badge: '/Modz.png',
    tag: 'modz-notification',
    data: data.data || { url: '/' },
    vibrate: [100, 50, 100],
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Modz', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
    );
  }
});

// Periodic Cleanup
setInterval(() => {
  (async () => {
    // Clean up old API cache entries
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    
    const now = Date.now();
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const cachedDate = new Date(dateHeader).getTime();
          if (now - cachedDate > CONFIG.cacheDuration.api) {
            await cache.delete(request);
          }
        }
      }
    }
    
    console.log('🧹 Periodic cleanup completed');
  })().catch(error => {
    console.warn('Cleanup failed:', error);
  });
}, 15 * 60 * 1000); // Every 15 minutes

console.log(`⚡ Advanced Service Worker v${VERSION} loaded and ready`);
console.log('🔐 Features: Offline Auth, Smart Caching, Background Sync, Push Notifications');
