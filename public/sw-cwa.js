/**
 * CWA Service Worker - Advanced caching and offline support
 */

const CACHE_NAME = 'cwa-v3.0.0';
const INSTALLATION_ID = 'INSTALLATION_ID_PLACEHOLDER';

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/Modz.png',
    '/manifest.json',
    '/lib/cwa-installer.js',
    '/styles/main.css',
    '/scripts/main.js'
];

// Network-first assets
const NETWORK_FIRST = [
    '/api/',
    '/data/'
];

// Cache-first assets (static assets)
const CACHE_FIRST = [
    '/images/',
    '/fonts/',
    '/icons/'
];

// Never cache
const NEVER_CACHE = [
    '/analytics',
    '/tracking',
    '/admin/'
];

self.addEventListener('install', (event) => {
    console.log('[CWA SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[CWA SW] Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
            })
            .then(() => {
                console.log('[CWA SW] Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[CWA SW] Installation failed:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[CWA SW] Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[CWA SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[CWA SW] Activation complete');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Check if request should be ignored
    if (NEVER_CACHE.some(path => url.pathname.startsWith(path))) {
        return;
    }
    
    // Check if request should use network first
    if (NETWORK_FIRST.some(path => url.pathname.startsWith(path))) {
        event.respondWith(networkFirst(event.request));
        return;
    }
    
    // Check if request should use cache first
    if (CACHE_FIRST.some(path => url.pathname.startsWith(path))) {
        event.respondWith(cacheFirst(event.request));
        return;
    }
    
    // Default: stale-while-revalidate
    event.respondWith(staleWhileRevalidate(event.request));
});

// Strategy: Network first, fallback to cache
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page or error
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Strategy: Cache first, fallback to network
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        updateCacheInBackground(request);
        return cachedResponse;
    }
    
    // Not in cache, try network
    try {
        const networkResponse = await fetch(request);
        
        // Cache for future use
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        
        return networkResponse;
    } catch (error) {
        // Both cache and network failed
        return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Strategy: Stale while revalidate
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Return cached response immediately
    const fetchPromise = fetch(request).then(networkResponse => {
        // Update cache with fresh response
        cache.put(request, networkResponse.clone());
        return networkResponse;
    });
    
    return cachedResponse || fetchPromise;
}

// Update cache in background
async function updateCacheInBackground(request) {
    const cache = await caches.open(CACHE_NAME);
    
    fetch(request).then(networkResponse => {
        cache.put(request, networkResponse);
    }).catch(() => {
        // Ignore errors for background updates
    });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CWA_INIT':
            console.log('[CWA SW] Received initialization:', data);
            // Store installation data
            break;
            
        case 'CWA_CLEANUP':
            console.log('[CWA SW] Cleanup requested');
            // Perform cleanup
            break;
            
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
    }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// Periodic sync for updates
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-assets') {
        event.waitUntil(updateAssets());
    }
});

async function syncData() {
    // Implement data synchronization
    console.log('[CWA SW] Syncing data...');
}

async function updateAssets() {
    // Update cached assets
    console.log('[CWA SW] Updating assets...');
    
    const cache = await caches.open(CACHE_NAME);
    const requests = CRITICAL_ASSETS.map(url => new Request(url));
    
    const responses = await Promise.all(
        requests.map(request => fetch(request).catch(() => null))
    );
    
    responses.forEach((response, index) => {
        if (response && response.ok) {
            cache.put(requests[index], response);
        }
    });
}

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update available!',
        icon: '/Modz.png',
        badge: '/Modz.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore',
                icon: '/Modz.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/Modz.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Modz Quantum CWA', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/?cwa=1')
        );
    }
});
