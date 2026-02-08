// public/sw.js - Enterprise-Grade Service Worker with Advanced Auth Handling

const CACHE_NAME = 'modz-enterprise-v1';
const VERSION = '1.0.0';
const CONFIG = {
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  retryAttempts: 3,
  retryDelay: 1000,
  heartbeatInterval: 30000,
  syncInterval: 300000
};

// Advanced cache strategies
const STRATEGIES = {
  STATIC: 'static',
  API_CACHE: 'api_cache',
  API_NETWORK: 'api_network',
  DYNAMIC: 'dynamic',
  AUTH: 'auth',
  MEDIA: 'media',
  FONT: 'font'
};

// Intelligent URL classification with regex patterns
const URL_PATTERNS = {
  SUPABASE_AUTH: [
    /supabase\.co\/auth\/v1\//,
    /supabase\.co\/rest\/v1\/auth/,
    /#access_token=/,
    /#refresh_token=/,
    /token_type=/
  ],
  SUPABASE_DATA: [
    /supabase\.co\/rest\/v1\/(?!auth)/,
    /supabase\.co\/storage\/v1\//
  ],
  GITHUB: [
    /github\.com\//,
    /api\.github\.com\//,
    /githubusercontent\.com\//
  ],
  STATIC_ASSETS: [
    /\.(css|js|json|xml)$/i,
    /\/_next\/static\//,
    /\/styles\//,
    /\/images\//,
    /\/icons\//
  ],
  MEDIA: [
    /\.(png|jpg|jpeg|gif|svg|webp|mp4|webm|ogg|mp3|wav)$/i
  ],
  FONTS: [
    /\.(woff|woff2|ttf|eot|otf)$/i
  ],
  API_ENDPOINTS: [
    /\/api\//,
    /\/graphql/,
    /\/rest\//
  ]
};

// Advanced configuration with priorities
const CACHE_CONFIG = {
  [STRATEGIES.STATIC]: {
    priority: 1,
    staleWhileRevalidate: true,
    backgroundSync: true,
    maxAge: 31536000, // 1 year
    immutable: true
  },
  [STRATEGIES.API_CACHE]: {
    priority: 2,
    networkFirst: true,
    cacheOnSuccess: true,
    maxAge: 3600, // 1 hour
    backgroundUpdate: true
  },
  [STRATEGIES.API_NETWORK]: {
    priority: 3,
    networkOnly: true,
    bypassCache: true,
    noStore: true
  },
  [STRATEGIES.AUTH]: {
    priority: 0, // Highest priority
    networkOnly: true,
    bypassServiceWorker: true,
    noCache: true,
    critical: true
  },
  [STRATEGIES.MEDIA]: {
    priority: 2,
    cacheFirst: true,
    maxAge: 2592000, // 30 days
    varyOn: ['Accept', 'Width', 'Height']
  },
  [STRATEGIES.FONT]: {
    priority: 1,
    cacheFirst: true,
    maxAge: 31536000,
    immutable: true
  }
};

// Advanced analytics and telemetry
const Telemetry = {
  events: [],
  performance: {},
  
  track(event, data = {}) {
    const eventData = {
      timestamp: Date.now(),
      event,
      ...data,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      memory: performance.memory,
      connection: navigator.connection
    };
    
    this.events.push(eventData);
    
    // Send to analytics endpoint if online
    if (navigator.onLine && this.events.length > 10) {
      this.flush();
    }
    
    // Log for debugging
    console.log(`📊 Telemetry: ${event}`, data);
  },
  
  async flush() {
    if (!navigator.onLine || this.events.length === 0) return;
    
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: this.events })
      });
      
      this.events = [];
    } catch (error) {
      console.warn('Failed to send telemetry:', error);
    }
  },
  
  measurePerformance(name, startTime) {
    const duration = Date.now() - startTime;
    this.performance[name] = this.performance[name] || [];
    this.performance[name].push(duration);
    
    if (this.performance[name].length > 100) {
      this.performance[name].shift();
    }
  }
};

// Intelligent network detection
class NetworkIntelligence {
  constructor() {
    this.status = {
      online: navigator.onLine,
      type: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || 0,
      rtt: navigator.connection?.rtt || 0,
      saveData: navigator.connection?.saveData || false,
      lastChecked: Date.now(),
      supabase: 'unknown',
      github: 'unknown',
      blockedEndpoints: new Set(),
      schoolNetwork: false,
      corporateProxy: false
    };
    
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      bandwidth: 0
    };
    
    this.init();
  }
  
  init() {
    // Detect network characteristics
    this.detectNetworkType();
    
    // Check critical endpoints
    this.checkEndpoints();
    
    // Listen for network changes
    self.addEventListener('online', () => this.handleOnline());
    self.addEventListener('offline', () => this.handleOffline());
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => this.handleConnectionChange());
    }
  }
  
  detectNetworkType() {
    const { hostname, href } = self.location;
    
    // School network detection
    if (hostname.includes('.edu') || 
        hostname.includes('school') ||
        navigator.userAgent.includes('ChromeOS') ||
        href.includes('k12')) {
      this.status.schoolNetwork = true;
    }
    
    // Corporate proxy detection
    if (navigator.userAgent.includes('Enterprise') ||
        navigator.userAgent.includes('Windows NT') ||
        hostname.includes('corp') ||
        hostname.includes('intranet')) {
      this.status.corporateProxy = true;
    }
    
    // Mobile network detection
    if (navigator.userAgent.includes('Mobile') || 
        navigator.userAgent.includes('Android') ||
        navigator.userAgent.includes('iPhone')) {
      this.status.mobileNetwork = true;
    }
  }
  
  async checkEndpoints() {
    const endpoints = [
      {
        name: 'supabase',
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
        method: 'GET',
        timeout: 5000
      },
      {
        name: 'github',
        url: 'https://api.github.com/zen',
        method: 'GET',
        timeout: 10000
      },
      {
        name: 'google',
        url: 'https://www.google.com/generate_204',
        method: 'HEAD',
        timeout: 3000
      }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
        
        const startTime = Date.now();
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          signal: controller.signal,
          cache: 'no-store'
        });
        const responseTime = Date.now() - startTime;
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.status[endpoint.name] = {
            reachable: true,
            responseTime,
            status: response.status
          };
          
          // Update bandwidth estimation
          this.updateBandwidthEstimation(responseTime);
        } else {
          this.status[endpoint.name] = {
            reachable: false,
            responseTime,
            status: response.status
          };
          
          if (response.status === 403 || response.status === 429) {
            this.status.blockedEndpoints.add(endpoint.name);
          }
        }
      } catch (error) {
        this.status[endpoint.name] = {
          reachable: false,
          error: error.message
        };
        
        if (error.name === 'AbortError') {
          this.status.blockedEndpoints.add(`${endpoint.name}_timeout`);
        }
      }
    }
    
    // Notify clients
    this.broadcastStatus();
  }
  
  updateBandwidthEstimation(responseTime, size = 1000) {
    const bandwidth = size / (responseTime / 1000);
    this.metrics.bandwidth = (this.metrics.bandwidth + bandwidth) / 2;
  }
  
  handleOnline() {
    this.status.online = true;
    this.status.lastChecked = Date.now();
    
    Telemetry.track('network_online', { status: this.status });
    this.broadcastStatus();
    this.checkEndpoints();
  }
  
  handleOffline() {
    this.status.online = false;
    Telemetry.track('network_offline', { status: this.status });
    this.broadcastStatus();
  }
  
  handleConnectionChange() {
    this.status.type = navigator.connection?.effectiveType || 'unknown';
    this.status.downlink = navigator.connection?.downlink || 0;
    this.status.rtt = navigator.connection?.rtt || 0;
    this.status.saveData = navigator.connection?.saveData || false;
    
    Telemetry.track('connection_change', { status: this.status });
    this.broadcastStatus();
  }
  
  broadcastStatus() {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NETWORK_INTELLIGENCE',
          status: this.status,
          metrics: this.metrics,
          timestamp: Date.now()
        });
      });
    });
  }
  
  shouldUseLowQuality() {
    return this.status.saveData || 
           this.status.type === 'slow-2g' || 
           this.status.type === '2g' ||
           this.metrics.bandwidth < 100000; // < 100kbps
  }
  
  isEndpointBlocked(name) {
    return this.status.blockedEndpoints.has(name);
  }
}

// Advanced cache manager
class CacheManager {
  constructor() {
    this.caches = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0
    };
  }
  
  async open(name) {
    if (!this.caches.has(name)) {
      const cache = await caches.open(name);
      this.caches.set(name, cache);
      await this.updateStats(cache);
    }
    return this.caches.get(name);
  }
  
  async updateStats(cache) {
    const keys = await cache.keys();
    this.stats.entries = keys.length;
    
    // Estimate size
    let totalSize = 0;
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const clone = response.clone();
        const blob = await clone.blob();
        totalSize += blob.size;
      }
    }
    this.stats.size = totalSize;
  }
  
  async put(request, response, strategy) {
    const cache = await this.open(CACHE_NAME);
    
    // Check cache size limits
    if (this.stats.size > CONFIG.maxCacheSize) {
      await this.cleanupOldEntries(cache);
    }
    
    // Clone response before storing
    const responseToCache = response.clone();
    
    // Add cache metadata
    const headers = new Headers(responseToCache.headers);
    headers.set('X-Cache-Date', new Date().toISOString());
    headers.set('X-Cache-Strategy', strategy);
    headers.set('X-Cache-Version', VERSION);
    
    const cachedResponse = new Response(await responseToCache.blob(), {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers
    });
    
    await cache.put(request, cachedResponse);
    await this.updateStats(cache);
    
    Telemetry.track('cache_store', {
      url: request.url,
      strategy,
      size: this.stats.size
    });
  }
  
  async cleanupOldEntries(cache) {
    const keys = await cache.keys();
    const entries = [];
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('X-Cache-Date');
        const date = dateHeader ? new Date(dateHeader).getTime() : Date.now();
        entries.push({ request, date });
      }
    }
    
    // Sort by date (oldest first)
    entries.sort((a, b) => a.date - b.date);
    
    // Remove oldest entries until under limit
    const toRemove = Math.max(0, entries.length - 50); // Keep at least 50 entries
    for (let i = 0; i < toRemove; i++) {
      await cache.delete(entries[i].request);
    }
    
    await this.updateStats(cache);
    Telemetry.track('cache_cleanup', { removed: toRemove });
  }
  
  async match(request, options = {}) {
    const cache = await this.open(CACHE_NAME);
    const cached = await cache.match(request, options);
    
    if (cached) {
      this.stats.hits++;
      
      // Check if cache is stale
      const cacheDate = cached.headers.get('X-Cache-Date');
      const cacheAge = cacheDate ? Date.now() - new Date(cacheDate).getTime() : Infinity;
      
      if (cacheAge > CONFIG.maxCacheAge) {
        // Stale but usable
        Telemetry.track('cache_stale', { url: request.url, age: cacheAge });
        return { response: cached, stale: true };
      }
      
      Telemetry.track('cache_hit', { url: request.url });
      return { response: cached, stale: false };
    }
    
    this.stats.misses++;
    Telemetry.track('cache_miss', { url: request.url });
    return null;
  }
}

// Advanced request router
class RequestRouter {
  constructor(networkIntelligence) {
    this.network = networkIntelligence;
    this.classifier = new URLClassifier();
  }
  
  async route(event) {
    const request = event.request;
    const url = new URL(request.url);
    
    // Get request classification
    const classification = this.classifier.classify(url, request);
    
    // Apply network intelligence
    if (this.network.shouldUseLowQuality() && classification.strategy === STRATEGIES.MEDIA) {
      // Serve low-quality media on slow connections
      return this.handleLowQualityMedia(request, classification);
    }
    
    // Handle auth requests specially
    if (classification.strategy === STRATEGIES.AUTH) {
      return this.handleAuthRequest(event, request, classification);
    }
    
    // Apply strategy
    switch (classification.strategy) {
      case STRATEGIES.STATIC:
        return this.handleStatic(request, classification);
      case STRATEGIES.API_CACHE:
        return this.handleApiCache(request, classification);
      case STRATEGIES.API_NETWORK:
        return this.handleApiNetwork(request, classification);
      case STRATEGIES.MEDIA:
        return this.handleMedia(request, classification);
      case STRATEGIES.FONT:
        return this.handleFont(request, classification);
      default:
        return this.handleDynamic(request, classification);
    }
  }
  
  async handleAuthRequest(event, request, classification) {
    Telemetry.track('auth_request', { 
      url: request.url,
      method: request.method 
    });
    
    // For auth requests, we have several strategies:
    
    // 1. Complete bypass for OAuth callbacks and token exchanges
    if (this.isOAuthCallback(request.url)) {
      console.log('🔐 OAuth callback detected - complete bypass');
      // Don't intercept at all
      return null;
    }
    
    // 2. Network-only for auth API calls
    if (this.isAuthApiCall(request.url)) {
      console.log('🔐 Auth API call - network only');
      event.respondWith(this.fetchWithRetry(request, classification));
      return;
    }
    
    // 3. Special handling for session refresh
    if (this.isSessionRefresh(request)) {
      console.log('🔐 Session refresh - priority handling');
      return this.handleSessionRefresh(event, request);
    }
    
    // Default: let it through
    return null;
  }
  
  isOAuthCallback(url) {
    return url.includes('#access_token=') || 
           url.includes('#refresh_token=') ||
           url.includes('oauth/callback') ||
           url.includes('auth/callback');
  }
  
  isAuthApiCall(url) {
    return url.includes('/auth/v1/') ||
           url.includes('/rest/v1/auth') ||
           url.includes('supabase.co/auth');
  }
  
  isSessionRefresh(request) {
    return request.url.includes('/auth/v1/token') && 
           request.method === 'POST' &&
           request.headers.get('Content-Type')?.includes('application/json');
  }
  
  async handleSessionRefresh(event, request) {
    try {
      // Try to refresh from network first
      const response = await fetch(request);
      
      if (response.ok) {
        // Broadcast session update to all tabs
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SESSION_REFRESHED',
              timestamp: Date.now()
            });
          });
        });
      }
      
      return response;
    } catch (error) {
      // If refresh fails, notify all tabs
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SESSION_EXPIRED',
            error: error.message,
            timestamp: Date.now()
          });
        });
      });
      
      throw error;
    }
  }
  
  async handleStatic(request, classification) {
    const cacheManager = new CacheManager();
    const cached = await cacheManager.match(request);
    
    if (cached && !cached.stale) {
      return cached.response;
    }
    
    // Stale-while-revalidate pattern
    if (cached?.stale) {
      this.updateInBackground(request, classification);
      return cached.response;
    }
    
    // Fetch and cache
    const response = await this.fetchWithRetry(request, classification);
    
    if (response.ok) {
      await cacheManager.put(request, response, classification.strategy);
    }
    
    return response;
  }
  
  async handleApiCache(request, classification) {
    // Check if this API endpoint is blocked
    if (this.network.isEndpointBlocked('github') && request.url.includes('github.com')) {
      return this.handleBlockedApi(request, classification);
    }
    
    const cacheManager = new CacheManager();
    const cached = await cacheManager.match(request);
    
    // Return cached response immediately if available
    if (cached) {
      // Update in background if stale
      if (cached.stale && this.network.status.online) {
        this.updateInBackground(request, classification);
      }
      return cached.response;
    }
    
    // Try network
    try {
      const response = await this.fetchWithRetry(request, classification);
      
      if (response.ok) {
        await cacheManager.put(request, response, classification.strategy);
      }
      
      return response;
    } catch (error) {
      // If offline and no cache, return offline response
      if (!this.network.status.online) {
        return this.offlineApiResponse(request, classification);
      }
      throw error;
    }
  }
  
  async handleBlockedApi(request, classification) {
    // Store request for later sync
    const db = await Database.getInstance();
    await db.queueRequest(request, classification);
    
    // Return queued response
    return new Response(
      JSON.stringify({
        status: 'queued',
        message: 'Request queued due to network restrictions',
        id: Date.now(),
        timestamp: new Date().toISOString(),
        retryAfter: Date.now() + 300000 // 5 minutes
      }),
      {
        status: 202,
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-Queued': 'true'
        }
      }
    );
  }
  
  offlineApiResponse(request, classification) {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline. Data will sync when you reconnect.',
        cached: false,
        timestamp: new Date().toISOString(),
        endpoint: classification.endpoint
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Offline': 'true',
          'X-Cache-Timestamp': new Date().toISOString()
        }
      }
    );
  }
  
  async handleLowQualityMedia(request, classification) {
    // On slow networks, serve lower quality media
    const url = new URL(request.url);
    
    // Check if we have a low-quality version
    const lowQualityUrl = this.getLowQualityUrl(url);
    const lowQualityRequest = new Request(lowQualityUrl, request);
    
    const cacheManager = new CacheManager();
    const cached = await cacheManager.match(lowQualityRequest);
    
    if (cached) {
      Telemetry.track('low_quality_served', { original: url.href, served: lowQualityUrl.href });
      return cached.response;
    }
    
    // Otherwise, fetch and cache the low-quality version
    const response = await fetch(lowQualityRequest);
    if (response.ok) {
      await cacheManager.put(lowQualityRequest, response, `${classification.strategy}_low`);
    }
    
    return response;
  }
  
  getLowQualityUrl(url) {
    // Implement logic to get low-quality version
    // This could involve query parameters, different paths, or image resizing service
    const newUrl = new URL(url);
    
    if (url.pathname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      newUrl.searchParams.set('quality', '50');
      newUrl.searchParams.set('width', '800');
    }
    
    return newUrl;
  }
  
  async updateInBackground(request, classification) {
    if (!this.network.status.online) return;
    
    // Use Background Fetch API if available
    if ('BackgroundFetchManager' in self.registration) {
      try {
        const bgFetch = await self.registration.backgroundFetch.fetch(
          `update-${Date.now()}`,
          [request],
          {
            title: 'Updating cached content',
            icons: [{ src: '/Modz.png', sizes: '192x192', type: 'image/png' }],
            downloadTotal: 1024 * 1024 // 1MB
          }
        );
        
        Telemetry.track('background_update_started', { url: request.url });
      } catch (error) {
        console.warn('Background fetch failed:', error);
      }
    } else {
      // Fallback to regular fetch
      fetch(request)
        .then(async response => {
          if (response.ok) {
            const cacheManager = new CacheManager();
            await cacheManager.put(request, response, classification.strategy);
            
            // Notify clients
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'BACKGROUND_UPDATE',
                  url: request.url,
                  timestamp: new Date().toISOString()
                });
              });
            });
          }
        })
        .catch(error => {
          console.warn('Background update failed:', error);
        });
    }
  }
  
  async fetchWithRetry(request, classification, attempt = 1) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(request);
      Telemetry.measurePerformance('fetch', startTime);
      
      if (response.ok) {
        Telemetry.track('fetch_success', {
          url: request.url,
          attempt,
          status: response.status,
          strategy: classification.strategy
        });
        return response;
      }
      
      // Handle specific error cases
      if (response.status === 401 || response.status === 403) {
        Telemetry.track('auth_error', {
          url: request.url,
          status: response.status
        });
        
        // Notify clients about auth issues
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'AUTH_ERROR',
              status: response.status,
              url: request.url,
              timestamp: new Date().toISOString()
            });
          });
        });
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      Telemetry.track('fetch_error', {
        url: request.url,
        attempt,
        error: error.message,
        strategy: classification.strategy
      });
      
      if (attempt < CONFIG.retryAttempts && this.shouldRetry(error)) {
        await this.delay(CONFIG.retryDelay * attempt);
        return this.fetchWithRetry(request, classification, attempt + 1);
      }
      
      throw error;
    }
  }
  
  shouldRetry(error) {
    // Retry on network errors, but not on auth errors
    return error.message.includes('Failed to fetch') ||
           error.message.includes('NetworkError') ||
           error.message.includes('TypeError');
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Advanced URL classifier with machine learning-like patterns
class URLClassifier {
  classify(url, request) {
    const urlString = url.href;
    
    // Check patterns in priority order
    for (const [patternType, patterns] of Object.entries(URL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(urlString)) {
          return this.getClassification(patternType, url, request);
        }
      }
    }
    
    // Default classification
    return this.getClassification('DYNAMIC', url, request);
  }
  
  getClassification(type, url, request) {
    const base = {
      url: url.href,
      hostname: url.hostname,
      pathname: url.pathname,
      method: request.method,
      endpoint: this.getEndpointName(url),
      priority: this.getPriority(type),
      strategy: this.getStrategy(type),
      cacheable: this.isCacheable(type, request),
      timestamp: Date.now()
    };
    
    // Add specific properties based on type
    switch (type) {
      case 'SUPABASE_AUTH':
        return {
          ...base,
          authFlow: this.detectAuthFlow(url),
          requiresFreshToken: true,
          bypassCache: true
        };
      case 'GITHUB':
        return {
          ...base,
          apiVersion: this.getGitHubApiVersion(url),
          requiresAuth: url.pathname.includes('/user') || url.pathname.includes('/repos'),
          rateLimitAware: true
        };
      case 'MEDIA':
        return {
          ...base,
          mediaType: this.getMediaType(url),
          dimensions: this.extractDimensions(url),
          quality: 'high'
        };
      default:
        return base;
    }
  }
  
  getEndpointName(url) {
    const path = url.pathname.split('/').filter(Boolean);
    return path.length > 0 ? path[path.length - 1] : 'root';
  }
  
  getPriority(type) {
    const priorities = {
      SUPABASE_AUTH: 0,
      STATIC_ASSETS: 1,
      FONTS: 1,
      MEDIA: 2,
      API_ENDPOINTS: 3,
      GITHUB: 4,
      SUPABASE_DATA: 5,
      DYNAMIC: 6
    };
    return priorities[type] || 6;
  }
  
  getStrategy(type) {
    const strategies = {
      SUPABASE_AUTH: STRATEGIES.AUTH,
      STATIC_ASSETS: STRATEGIES.STATIC,
      FONTS: STRATEGIES.FONT,
      MEDIA: STRATEGIES.MEDIA,
      API_ENDPOINTS: STRATEGIES.API_CACHE,
      GITHUB: STRATEGIES.API_CACHE,
      SUPABASE_DATA: STRATEGIES.API_NETWORK,
      DYNAMIC: STRATEGIES.DYNAMIC
    };
    return strategies[type] || STRATEGIES.DYNAMIC;
  }
  
  isCacheable(type, request) {
    if (request.method !== 'GET') return false;
    
    const nonCacheable = ['SUPABASE_AUTH'];
    return !nonCacheable.includes(type);
  }
  
  detectAuthFlow(url) {
    if (url.href.includes('#access_token=')) return 'oauth_callback';
    if (url.pathname.includes('/token')) return 'token_exchange';
    if (url.pathname.includes('/authorize')) return 'authorization';
    if (url.pathname.includes('/logout')) return 'logout';
    return 'unknown';
  }
  
  getGitHubApiVersion(url) {
    return url.pathname.startsWith('/api/v3') ? 'v3' : 
           url.pathname.startsWith('/api/v4') ? 'v4' : 'v3';
  }
  
  getMediaType(url) {
    const ext = url.pathname.split('.').pop().toLowerCase();
    const types = {
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      webp: 'image',
      mp4: 'video',
      webm: 'video',
      ogg: 'video',
      mp3: 'audio',
      wav: 'audio'
    };
    return types[ext] || 'unknown';
  }
  
  extractDimensions(url) {
    // Extract from query params like ?width=800&height=600
    const width = url.searchParams.get('width');
    const height = url.searchParams.get('height');
    return width && height ? { width: parseInt(width), height: parseInt(height) } : null;
  }
}

// Advanced IndexedDB with encryption support
class Database {
  static async getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
      await Database.instance.init();
    }
    return Database.instance;
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ModzEnterpriseDB', 4);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        this.db = event.target.result;
        
        // Handle database upgrades
        this.db.onversionchange = () => {
          this.db.close();
          console.log('Database upgrade required');
        };
        
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Queued requests store
        if (!db.objectStoreNames.contains('queuedRequests')) {
          const store = db.createObjectStore('queuedRequests', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('status', 'status');
          store.createIndex('priority', 'priority');
          store.createIndex('endpoint', 'endpoint');
        }
        
        // Offline models with versioning
        if (!db.objectStoreNames.contains('offlineModels')) {
          const store = db.createObjectStore('offlineModels', {
            keyPath: 'id'
          });
          store.createIndex('name', 'name');
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('version', 'version');
          store.createIndex('type', 'type');
          store.createIndex('size', 'size');
        }
        
        // User preferences
        if (!db.objectStoreNames.contains('preferences')) {
          const store = db.createObjectStore('preferences', {
            keyPath: 'key'
          });
        }
        
        // Sync history
        if (!db.objectStoreNames.contains('syncHistory')) {
          const store = db.createObjectStore('syncHistory', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
          store.createIndex('success', 'success');
        }
        
        // Cache metadata
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          const store = db.createObjectStore('cacheMetadata', {
            keyPath: 'url'
          });
          store.createIndex('strategy', 'strategy');
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('expires', 'expires');
        }
      };
    });
  }
  
  async queueRequest(request, classification) {
    const transaction = this.db.transaction(['queuedRequests'], 'readwrite');
    const store = transaction.objectStore('queuedRequests');
    
    const queuedRequest = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      classification,
      timestamp: Date.now(),
      status: 'pending',
      priority: classification.priority,
      endpoint: classification.endpoint,
      retries: 0
    };
    
    // Try to get request body for POST/PUT requests
    if (request.method === 'POST' || request.method === 'PUT') {
      try {
        const clone = request.clone();
        const body = await clone.text();
        if (body) {
          queuedRequest.body = body;
        }
      } catch (error) {
        console.warn('Could not read request body:', error);
      }
    }
    
    return new Promise((resolve, reject) => {
      const req = store.add(queuedRequest);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

// Main service worker initialization
let networkIntelligence;
let requestRouter;

self.addEventListener('install', (event) => {
  console.log('🚀 Modz Enterprise Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      Telemetry.track('install_start', { version: VERSION });
      
      // Skip waiting to activate immediately
      await self.skipWaiting();
      
      // Initialize components
      networkIntelligence = new NetworkIntelligence();
      
      // Create basic cache
      const cache = await caches.open(CACHE_NAME);
      
      // Cache critical assets
      const criticalAssets = [
        '/',
        '/manifest.json',
        '/Modz.png',
        '/styles/three-components.css',
        '/offline.html'
      ];
      
      try {
        await cache.addAll(criticalAssets);
        Telemetry.track('install_complete', { version: VERSION });
      } catch (error) {
        console.error('Cache installation failed:', error);
        Telemetry.track('install_error', { error: error.message });
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('⚡ Modz Enterprise Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(key => {
          if (key !== CACHE_NAME) {
            console.log(`🗑️ Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
      
      // Claim clients immediately
      await self.clients.claim();
      
      // Initialize router
      requestRouter = new RequestRouter(networkIntelligence);
      
      // Initialize database
      await Database.getInstance();
      
      // Start heartbeat
      startHeartbeat();
      
      // Broadcast ready message
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY',
            version: VERSION,
            timestamp: Date.now(),
            capabilities: {
              backgroundSync: 'sync' in self.registration,
              backgroundFetch: 'BackgroundFetchManager' in self.registration,
              periodicSync: 'periodicSync' in self.registration,
              networkIntelligence: true,
              telemetry: true
            }
          });
        });
      });
      
      Telemetry.track('activate_complete', { version: VERSION });
      console.log('✅ Enterprise Service Worker activated');
    })()
  );
});

// Main fetch handler
self.addEventListener('fetch', (event) => {
  const startTime = Date.now();
  
  // Skip non-GET requests for certain types
  if (event.request.method !== 'GET') {
    // Handle POST requests for offline queue
    if (event.request.method === 'POST' || event.request.method === 'PUT') {
      handleOfflineMutation(event);
      return;
    }
    
    // Let other non-GET requests through
    return;
  }
  
  // Skip certain URLs entirely
  if (shouldSkipUrl(event.request.url)) {
    return;
  }
  
  // Route the request
  event.respondWith(
    (async () => {
      try {
        const result = await requestRouter.route(event);
        
        if (result === null) {
          // Router decided not to handle this request
          return fetch(event.request);
        }
        
        Telemetry.measurePerformance('total_request', startTime);
        return result;
      } catch (error) {
        Telemetry.track('fetch_handler_error', {
          url: event.request.url,
          error: error.message
        });
        
        // Fallback to network
        return fetch(event.request);
      }
    })()
  );
});

function shouldSkipUrl(url) {
  const skipPatterns = [
    /chrome-extension:\/\//,
    /sockjs-node/,
    /hot-update/,
    /webpack-hmr/,
    /\/__webpack/,
    /\/ws/
  ];
  
  return skipPatterns.some(pattern => pattern.test(url));
}

async function handleOfflineMutation(event) {
  if (!navigator.onLine) {
    // Queue for later sync
    const db = await Database.getInstance();
    const classification = new URLClassifier().classify(new URL(event.request.url), event.request);
    
    await db.queueRequest(event.request.clone(), classification);
    
    // Respond with queued status
    event.respondWith(
      new Response(
        JSON.stringify({
          status: 'queued',
          id: Date.now(),
          message: 'Request queued for sync when online',
          timestamp: new Date().toISOString()
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
    
    // Register sync
    if ('sync' in self.registration) {
      try {
        await self.registration.sync.register('sync-queued-requests');
      } catch (error) {
        console.warn('Sync registration failed:', error);
      }
    }
  }
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  switch (event.tag) {
    case 'sync-queued-requests':
      event.waitUntil(syncQueuedRequests());
      break;
    case 'sync-telemetry':
      event.waitUntil(Telemetry.flush());
      break;
    case 'sync-models':
      event.waitUntil(syncOfflineModels());
      break;
    case 'cleanup-cache':
      event.waitUntil(cleanupCache());
      break;
  }
});

async function syncQueuedRequests() {
  const db = await Database.getInstance();
  const transaction = db.transaction(['queuedRequests'], 'readwrite');
  const store = transaction.objectStore('queuedRequests');
  const index = store.index('status');
  
  const requests = await new Promise((resolve, reject) => {
    const req = index.getAll('pending');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  
  for (const queued of requests) {
    try {
      const response = await fetch(queued.url, {
        method: queued.method,
        headers: queued.headers,
        body: queued.body
      });
      
      if (response.ok) {
        // Mark as completed
        queued.status = 'completed';
        queued.completedAt = Date.now();
        store.put(queued);
        
        // Notify clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETED',
              requestId: queued.id,
              success: true,
              timestamp: Date.now()
            });
          });
        });
        
        Telemetry.track('sync_success', { url: queued.url, id: queued.id });
      }
    } catch (error) {
      queued.retries++;
      queued.lastError = error.message;
      
      if (queued.retries >= CONFIG.retryAttempts) {
        queued.status = 'failed';
      }
      
      store.put(queued);
      Telemetry.track('sync_error', { url: queued.url, error: error.message });
    }
  }
}

// Heartbeat for service worker health monitoring
function startHeartbeat() {
  setInterval(() => {
    Telemetry.track('heartbeat', {
      memory: performance.memory,
      clients: self.clients ? 'available' : 'unavailable',
      network: navigator.onLine ? 'online' : 'offline'
    });
    
    // Periodic cache cleanup
    if (Math.random() < 0.1) { // 10% chance each heartbeat
      cleanupCache();
    }
  }, CONFIG.heartbeatInterval);
}

async function cleanupCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  const now = Date.now();
  
  for (const request of keys) {
    try {
      const response = await cache.match(request);
      if (response) {
        const cacheDate = response.headers.get('X-Cache-Date');
        if (cacheDate) {
          const age = now - new Date(cacheDate).getTime();
          if (age > CONFIG.maxCacheAge) {
            await cache.delete(request);
            Telemetry.track('cache_expired', { url: request.url, age });
          }
        }
      }
    } catch (error) {
      console.warn('Error cleaning up cache entry:', error);
    }
  }
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  const { type, data, id } = event.data || {};
  
  const respond = (response) => {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ id, ...response });
    }
  };
  
  switch (type) {
    case 'GET_NETWORK_STATUS':
      respond({ 
        success: true, 
        data: networkIntelligence?.status || {} 
      });
      break;
      
    case 'GET_CACHE_STATS':
      const cacheManager = new CacheManager();
      respond({ 
        success: true, 
        data: cacheManager.stats 
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME)
        .then(() => respond({ success: true }))
        .catch(error => respond({ success: false, error: error.message }));
      break;
      
    case 'SAVE_FOR_OFFLINE':
      saveForOffline(data)
        .then(() => respond({ success: true }))
        .catch(error => respond({ success: false, error: error.message }));
      break;
      
    case 'QUEUE_REQUEST':
      Database.getInstance()
        .then(db => db.queueRequest(new Request(data.url, data.options), data.classification))
        .then(id => respond({ success: true, id }))
        .catch(error => respond({ success: false, error: error.message }));
      break;
      
    case 'GET_OFFLINE_DATA':
      Database.getInstance()
        .then(db => {
          const transaction = db.transaction(['offlineModels'], 'readonly');
          const store = transaction.objectStore('offlineModels');
          return store.getAll();
        })
        .then(data => respond({ success: true, data }))
        .catch(error => respond({ success: false, error: error.message }));
      break;
      
    case 'FORCE_SYNC':
      if ('sync' in self.registration) {
        self.registration.sync.register('sync-queued-requests')
          .then(() => respond({ success: true }))
          .catch(error => respond({ success: false, error: error.message }));
      } else {
        respond({ success: false, error: 'Sync not supported' });
      }
      break;
      
    case 'DEBUG_INFO':
      respond({
        success: true,
        data: {
          version: VERSION,
          cacheName: CACHE_NAME,
          networkStatus: networkIntelligence?.status || {},
          clients: self.clients ? 'available' : 'unavailable',
          registration: self.registration ? 'available' : 'unavailable',
          indexedDB: 'available'
        }
      });
      break;
  }
});

async function saveForOffline(modelData) {
  const db = await Database.getInstance();
  const transaction = db.transaction(['offlineModels'], 'readwrite');
  const store = transaction.objectStore('offlineModels');
  
  const offlineModel = {
    id: modelData.id || `model_${Date.now()}`,
    name: modelData.name,
    data: modelData.model,
    preview: modelData.preview,
    type: modelData.type || '3d_model',
    timestamp: Date.now(),
    version: modelData.version || '1.0',
    size: JSON.stringify(modelData.model).length,
    metadata: modelData.metadata || {}
  };
  
  await new Promise((resolve, reject) => {
    const req = store.put(offlineModel);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  
  // Cache associated assets
  if (modelData.assets) {
    const cache = await caches.open(CACHE_NAME);
    for (const asset of modelData.assets) {
      try {
        const response = await fetch(asset.url);
        if (response.ok) {
          await cache.put(new Request(asset.url), response);
        }
      } catch (error) {
        console.warn('Failed to cache asset:', asset.url, error);
      }
    }
  }
  
  Telemetry.track('offline_save', { 
    modelId: offlineModel.id, 
    name: offlineModel.name,
    size: offlineModel.size 
  });
}

// Push notifications with rich capabilities
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Modz Update',
    icon: '/Modz.png',
    badge: '/Modz.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'modz-notification',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };
  
  // Add image if provided
  if (data.image) {
    options.image = data.image;
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Modz', options)
  );
  
  Telemetry.track('push_received', { data });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, notification } = event;
  const data = notification.data || {};
  
  Telemetry.track('notification_click', { action, data });
  
  if (action === 'open' || action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (const client of windowClients) {
          if (client.url === data.url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(data.url || '/');
        }
      })
    );
  }
});

// Periodic sync for background updates
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    switch (event.tag) {
      case 'update-content':
        event.waitUntil(updateContent());
        break;
      case 'cleanup-storage':
        event.waitUntil(cleanupStorage());
        break;
      case 'send-telemetry':
        event.waitUntil(Telemetry.flush());
        break;
    }
  });
}

async function updateContent() {
  // Update frequently accessed content in background
  const urlsToUpdate = [
    '/api/community',
    '/api/mods/featured',
    '/api/assets'
  ];
  
  const cache = await caches.open(CACHE_NAME);
  
  for (const url of urlsToUpdate) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(new Request(url), response);
        Telemetry.track('periodic_update', { url, success: true });
      }
    } catch (error) {
      Telemetry.track('periodic_update', { url, success: false, error: error.message });
    }
  }
}

async function cleanupStorage() {
  // Clean up expired data from IndexedDB
  const db = await Database.getInstance();
  const transaction = db.transaction(['queuedRequests'], 'readwrite');
  const store = transaction.objectStore('queuedRequests');
  const index = store.index('timestamp');
  
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const range = IDBKeyRange.upperBound(weekAgo);
  
  const oldRequests = await new Promise((resolve, reject) => {
    const req = index.getAll(range);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  
  for (const request of oldRequests) {
    await new Promise((resolve, reject) => {
      const req = store.delete(request.id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  
  Telemetry.track('storage_cleanup', { removed: oldRequests.length });
}

console.log(`⚡ Modz Enterprise Service Worker v${VERSION} loaded`);
console.log(`🔧 Config: ${JSON.stringify(CONFIG, null, 2)}`);
