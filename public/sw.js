// public/sw.js - Enhanced Service Worker with Auth Bypass & Network Detection

const CACHE_NAME = 'modz-v6-offline';
const OFFLINE_ASSETS = {
  HTML: '/offline.html',
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
  '/offline.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
];

// URLs to COMPLETELY BYPASS service worker (no interception at all)
const BYPASS_SERVICE_WORKER = [
  'supabase.co',
  '.supabase.co',
  '/auth/v1/',
  '/rest/v1/auth',
  'github.com/login/oauth',
  'access_token',
  'refresh_token',
  'realtime',
  'websocket',
  'wss://',
  // Add any other auth/real-time endpoints
  'oauth2',
  'session',
  'token',
  'callback',
  'authorize'
];

// GitHub endpoints that might be blocked
const GITHUB_ENDPOINTS = [
  'github.com',
  'api.github.com',
  'raw.githubusercontent.com',
  'githubusercontent.com'
];

// URLs that CAN be cached for offline (read-only APIs)
const OFFLINE_API_CACHE = [
  '/api/mods/public',
  '/api/mods/featured',
  '/api/assets',
  '/api/config',
  '/api/community'  // Add community API for offline
];

// Network status tracking
let networkStatus = {
  online: navigator.onLine,
  supabase: 'unknown',
  github: 'unknown',
  schoolNetwork: false,
  blocked: []
};

// Determine strategy for different resources
function getStrategy(url, requestMethod = 'GET') {
  const urlString = url.toString();
  
  // ====== BYPASS SERVICE WORKER COMPLETELY FOR AUTH/SUPABASE ======
  for (const bypassUrl of BYPASS_SERVICE_WORKER) {
    if (urlString.includes(bypassUrl)) {
      console.log(`🔓 Bypassing service worker: ${urlString}`);
      return 'bypass';  // Special strategy that doesn't intercept
    }
  }
  
  // Track GitHub endpoints for network detection
  if (GITHUB_ENDPOINTS.some(endpoint => urlString.includes(endpoint))) {
    console.log(`🐙 GitHub endpoint detected: ${urlString}`);
    // We'll handle this specially to detect blocking
  }
  
  // Offline API cache (GET requests only)
  if (requestMethod === 'GET') {
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
  console.log('🚀 Modz Service Worker installing (v6)...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('📦 Caching offline assets');
          return cache.addAll(ASSETS_TO_CACHE);
        }),
      
      // Create offline fallback responses
      createOfflineFallbacks(),
      
      // Initialize network status
      checkNetworkStatus()
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

// Check network status for GitHub/Supabase
async function checkNetworkStatus() {
  console.log('🌐 Checking network status...');
  
  const endpoints = [
    { name: 'supabase', url: 'https://api.supabase.io/health' },
    { name: 'github', url: 'https://api.github.com/zen' },
    { name: 'google', url: 'https://www.google.com/favicon.ico' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint.url, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name} reachable (${responseTime}ms)`);
        networkStatus[endpoint.name] = 'reachable';
      } else {
        console.log(`⚠️ ${endpoint.name} returned ${response.status}`);
        networkStatus[endpoint.name] = 'blocked';
        networkStatus.blocked.push(endpoint.name);
      }
      
      // School network detection based on response time
      if (responseTime > 1000) { // Over 1 second might be school network
        networkStatus.schoolNetwork = true;
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name} unreachable:`, error.message);
      networkStatus[endpoint.name] = 'unreachable';
      networkStatus.blocked.push(endpoint.name);
    }
  }
  
  // Notify all clients about network status
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        status: networkStatus,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  return networkStatus;
}

// Create offline fallback responses
async function createOfflineFallbacks() {
  const cache = await caches.open(CACHE_NAME);
  
  // Enhanced offline HTML page with network detection
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
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 500px;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
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
        .network-status {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          padding: 1rem;
          margin: 1rem 0;
          text-align: left;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          margin: 0.5rem 0;
        }
        .status-good { color: #4CAF50; }
        .status-warning { color: #FF9800; }
        .status-bad { color: #F44336; }
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
        .buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2rem;
          font-size: 1rem;
          border-radius: 50px;
          cursor: pointer;
          transition: transform 0.3s, background 0.3s;
          flex: 1;
          min-width: 150px;
        }
        button:hover {
          transform: scale(1.05);
          background: #f0f0f0;
        }
        button.secondary {
          background: transparent;
          border: 2px solid white;
          color: white;
        }
        button.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .features {
          margin-top: 2rem;
          text-align: left;
        }
        .features ul {
          list-style: none;
          padding: 0;
        }
        .features li {
          margin: 0.5rem 0;
          display: flex;
          align-items: center;
        }
        .features li:before {
          content: "✓";
          color: #4CAF50;
          margin-right: 10px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📶</div>
        <h1>You're Offline</h1>
        <p>Don't worry! You can still use Modz with these features:</p>
        
        <div class="features">
          <ul>
            <li>Browse previously loaded 3D models</li>
            <li>View cached community mods</li>
            <li>Edit models locally</li>
            <li>Save your work offline</li>
            <li>Queue actions for when you're back online</li>
          </ul>
        </div>
        
        <div id="networkStatus" class="network-status">
          <h3>Network Status</h3>
          <div id="statusItems">
            <!-- Network status will be populated by JavaScript -->
          </div>
        </div>
        
        <div class="buttons">
          <button onclick="window.location.reload()">Retry Connection</button>
          <button onclick="history.back()" class="secondary">Go Back</button>
          <button onclick="window.location.href='/offline-models.html'" class="secondary">View Offline Models</button>
        </div>
        
        <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
          Modz will automatically sync when you reconnect
        </p>
      </div>
      
      <script>
        // Update network status on the offline page
        function updateNetworkStatus() {
          const statusItems = document.getElementById('statusItems');
          if (!statusItems) return;
          
          statusItems.innerHTML = \`
            <div class="status-item">
              <span>Internet Connection:</span>
              <span class="status-\${navigator.onLine ? 'good' : 'bad'}">
                \${navigator.onLine ? 'Online' : 'Offline'}
              </span>
            </div>
            <div class="status-item">
              <span>GitHub Access:</span>
              <span class="status-warning">Checking...</span>
            </div>
            <div class="status-item">
              <span>Service Worker:</span>
              <span class="status-good">Active</span>
            </div>
          \`;
          
          // Check GitHub access
          fetch('https://api.github.com/zen', { 
            method: 'HEAD',
            mode: 'no-cors'
          }).then(() => {
            document.querySelector('.status-warning').textContent = 'Available';
            document.querySelector('.status-warning').className = 'status-good';
          }).catch(() => {
            document.querySelector('.status-warning').textContent = 'Blocked';
            document.querySelector('.status-warning').className = 'status-bad';
          });
        }
        
        updateNetworkStatus();
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        
        // Try to detect school network
        if (window.location.hostname.includes('.edu') || 
            window.location.hostname.includes('school') ||
            navigator.userAgent.includes('ChromeOS')) {
          document.querySelector('.network-status').innerHTML += 
            '<p style="color: #FF9800; margin-top: 10px;">⚠️ School network detected. Some features may be restricted.</p>';
        }
      </script>
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
    status: "offline",
    networkStatus: networkStatus
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
      initializeOfflineDatabase(),
      
      // Check network status
      checkNetworkStatus()
    ])
    .then(() => {
      console.log('✅ Service Worker activated with offline support');
      
      // Notify all clients that we're ready
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY',
            version: 'v6',
            timestamp: new Date().toISOString(),
            networkStatus: networkStatus
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

// Network-only (for auth - but actually we should bypass completely)
async function networkOnly(request) {
  console.log(`🌐 Network-only: ${request.url}`);
  return fetch(request);
}

// ====== MAIN FETCH HANDLER ======
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const urlString = url.toString();
  
  // ====== CRITICAL FIX: Check for bypass URLs BEFORE anything else ======
  for (const bypassUrl of BYPASS_SERVICE_WORKER) {
    if (urlString.includes(bypassUrl)) {
      console.log(`🔓 COMPLETE BYPASS for: ${urlString}`);
      // DON'T call event.respondWith() - let request go directly to network
      return;
    }
  }
  
  // Skip non-GET requests for caching (except for our offline queue)
  if (event.request.method !== 'GET') {
    if (event.request.method === 'POST' && urlString.includes('/api/')) {
      handleOfflinePost(event);
      return;
    }
    // For other non-GET requests (like auth), just let them through
    return;
  }
  
  // Skip browser extensions and dev tools
  if (urlString.startsWith('chrome-extension://') ||
      urlString.includes('sockjs-node') ||
      urlString.includes('hot-update')) {
    return;
  }
  
  // Get strategy with correct method parameter
  const strategy = getStrategy(url, event.request.method);
  
  if (strategy === 'bypass') {
    // Should have been caught earlier, but just in case
    return;
  }
  
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
      event.respondWith(fetch(event.request));
      break;
      
    default:
      event.respondWith(
        networkFirstWithOffline(event.request)
      );
  }
});

// Handle GitHub authorization attempts with fallback
async function handleGitHubRequest(request) {
  try {
    // First try direct request
    const response = await fetch(request);
    
    // If we get a 403/429 (rate limit or blocking), try alternative approach
    if (response.status === 403 || response.status === 429) {
      console.log(`🐙 GitHub request blocked (${response.status}), trying fallback...`);
      
      // Store the request for later retry
      const db = await getOfflineDatabase();
      await db.add('pendingGitHubRequests', {
        url: request.url,
        method: request.method,
        timestamp: Date.now(),
        headers: Object.fromEntries(request.headers.entries())
      });
      
      // Return a message about the blocking
      return new Response(
        JSON.stringify({
          error: 'github_blocked',
          message: 'GitHub is currently blocked or rate limited. We\'ll retry later.',
          status: 'queued',
          timestamp: new Date().toISOString()
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return response;
  } catch (error) {
    console.error(`❌ GitHub request failed: ${error.message}`);
    
    // If it's an OAuth request, we need special handling
    if (request.url.includes('github.com/login/oauth')) {
      // Notify user about GitHub access issues
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'GITHUB_BLOCKED',
            message: 'GitHub authentication is blocked. Please try from a different network.',
            timestamp: new Date().toISOString()
          });
        });
      });
    }
    
    throw error;
  }
}

// Handle POST requests while offline
async function handleOfflinePost(event) {
  const url = new URL(event.request.url);
  
  // Check if it's a GitHub-related API call
  if (url.pathname.includes('github') || url.pathname.includes('issue') || url.pathname.includes('fork')) {
    event.respondWith(handleGitHubRequest(event.request));
    return;
  }
  
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
    const request = indexedDB.open('ModzOfflineDB', 3);
    
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
      
      // GitHub pending requests
      if (!db.objectStoreNames.contains('pendingGitHubRequests')) {
        const store = db.createObjectStore('pendingGitHubRequests', {
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
        store.createIndex('type', 'type');
      }
      
      // Network status history
      if (!db.objectStoreNames.contains('networkHistory')) {
        const store = db.createObjectStore('networkHistory', {
          keyPath: 'timestamp'
        });
        store.createIndex('online', 'online');
        store.createIndex('blocked', 'blocked');
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
  
  if (event.tag === 'sync-github-requests') {
    console.log('🔄 Syncing GitHub requests...');
    event.waitUntil(syncGitHubRequests());
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
        console.log(`🔄 Will retry (${request.retries}/3): ${request.url}`);
      } else {
        await db.delete('pendingRequests', request.id);
        console.log(`🗑️ Deleted after too many retries: ${request.url}`);
      }
    }
  }
}

// Sync GitHub-specific requests
async function syncGitHubRequests() {
  const db = await getOfflineDatabase();
  const pending = await db.getAll('pendingGitHubRequests');
  
  for (const request of pending) {
    try {
      console.log(`🔄 Attempting GitHub sync: ${request.url}`);
      
      // For GitHub API, we need to add proper headers
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.data ? JSON.stringify(request.data) : undefined
      });
      
      if (response.ok) {
        await db.delete('pendingGitHubRequests', request.id);
        console.log(`✅ GitHub sync successful: ${request.url}`);
      } else if (response.status === 403 || response.status === 429) {
        console.log(`⚠️ GitHub still blocked, will retry later: ${request.url}`);
        // Keep in queue for next sync
      } else {
        console.log(`❌ GitHub sync failed with status ${response.status}`);
        await db.delete('pendingGitHubRequests', request.id);
      }
    } catch (error) {
      console.error(`❌ GitHub sync error: ${error.message}`);
      // Keep in queue for next attempt
    }
  }
}

// ====== OFFLINE DETECTION & NETWORK STATUS ======
self.addEventListener('offline', () => {
  console.log('📴 App is offline');
  networkStatus.online = false;
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: false,
        networkStatus: networkStatus,
        timestamp: new Date().toISOString()
      });
    });
  });
});

self.addEventListener('online', () => {
  console.log('📶 App is back online');
  networkStatus.online = true;
  
  // Re-check network status when back online
  checkNetworkStatus();
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: true,
        networkStatus: networkStatus,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  // Trigger sync when back online
  if ('sync' in self.registration) {
    self.registration.sync.register('sync-pending-requests');
    self.registration.sync.register('sync-github-requests');
    self.registration.sync.register('sync-models');
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
      
    case 'CHECK_GITHUB_ACCESS':
      checkGitHubAccess()
        .then(access => {
          event.ports?.[0]?.postMessage({ success: true, access });
        });
      break;
      
    case 'DETECT_SCHOOL_NETWORK':
      detectSchoolNetwork()
        .then(isSchool => {
          event.ports?.[0]?.postMessage({ success: true, isSchool });
        });
      break;
  }
});

// Check GitHub access specifically
async function checkGitHubAccess() {
  try {
    const startTime = Date.now();
    const response = await fetch('https://api.github.com/zen', {
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors'
    });
    const responseTime = Date.now() - startTime;
    
    return {
      accessible: true,
      responseTime: responseTime,
      schoolNetwork: responseTime > 1000,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      schoolNetwork: networkStatus.schoolNetwork,
      timestamp: new Date().toISOString()
    };
  }
}

// Detect school network
async function detectSchoolNetwork() {
  const indicators = [
    window.location.hostname.includes('.edu'),
    window.location.hostname.includes('school'),
    navigator.userAgent.includes('ChromeOS'),
    networkStatus.schoolNetwork
  ];
  
  return indicators.some(indicator => indicator);
}

// Save 3D model for offline use
async function saveModelForOffline(modelData) {
  const db = await getOfflineDatabase();
  
  await db.add('offlineModels', {
    id: modelData.id || Date.now(),
    name: modelData.name,
    data: modelData.model,
    preview: modelData.preview,
    type: modelData.type || '3d_model',
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
  
  // Notify all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_MODEL_SAVED',
        modelName: modelData.name,
        timestamp: new Date().toISOString()
      });
    });
  });
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
    networkStatus: networkStatus,
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

// Periodic network checks (every 5 minutes)
setInterval(() => {
  if (navigator.onLine) {
    checkNetworkStatus();
  }
}, 5 * 60 * 1000);

console.log('⚡ Modz Service Worker v6 loaded (Auth Bypass + Network Detection)');
