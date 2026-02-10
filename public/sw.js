    case 'status':
      return new Response(JSON.stringify({
        status: 'quantum_entangled',
        cache_version: QUANTUM_CACHE_VERSION,
        chaos_active: true,
        clients_count: await getClientCount(),
        quantum_state: QUANTUM_STATES.ENTANGLED
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    default:
      return new Response(JSON.stringify({
        error: 'Unknown quantum endpoint',
        available_endpoints: ['init', 'status']
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Handle chaos stream requests
function handleChaosStream(request) {
  const stream = new ReadableStream({
    start(controller) {
      // Generate chaotic data stream
      const chaosInterval = setInterval(() => {
        const chaosData = {
          type: 'chaos_packet',
          timestamp: Date.now(),
          particles: generateChaosParticles(10),
          entropy: Math.random(),
          interference: Math.random() > 0.7 ? 'high' : 'low',
          quantum_state: Object.values(QUANTUM_STATES)[
            Math.floor(Math.random() * Object.values(QUANTUM_STATES).length)
          ]
        };
        
        controller.enqueue(new TextEncoder().encode(
          JSON.stringify(chaosData) + '\n'
        ));
      }, 100);
      
      // Stop after 30 seconds or when client disconnects
      setTimeout(() => {
        clearInterval(chaosInterval);
        controller.close();
      }, 30000);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Quantum-Stream': 'active'
    }
  });
}

// Helper functions
function generateChaosParticles(count) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 1000 - 500,
    y: Math.random() * 1000 - 500,
    z: Math.random() * 1000 - 500,
    velocity: {
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5,
      z: Math.random() * 10 - 5
    },
    charge: Math.random() > 0.5 ? 'positive' : 'negative',
    life: Math.random() * 100
  }));
}

function generateStrangeAttractors(count) {
  const attractors = ['lorenz', 'rossler', 'thomas', 'aizawa', 'dadras'];
  return Array.from({ length: count }, () => ({
    type: attractors[Math.floor(Math.random() * attractors.length)],
    position: {
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      z: Math.random() * 200 - 100
    },
    strength: Math.random() * 2 + 0.5,
    chaos_param: Math.random() * 10 + 10
  }));
}

function generateQuantumNoiseFields(count) {
  return Array.from({ length: count }, () => ({
    frequency: Math.random() * 100 + 1,
    amplitude: Math.random() * 5,
    octaves: Math.floor(Math.random() * 6) + 1,
    lacunarity: Math.random() * 3 + 1.5,
    persistence: Math.random() * 0.8 + 0.2
  }));
}

function generateChaosData() {
  return {
    entropy: Math.random(),
    butterfly_effect: Math.random() > 0.95,
    quantum_fluctuations: Array.from({ length: 8 }, () => Math.random()),
    fractal_dimension: 2 + Math.random(),
    bifurcation_point: Math.random() * 4
  };
}

function generateQuantumSessionId() {
  return 'quantum_' + Date.now() + '_' + 
         Math.random().toString(36).substr(2, 9) + '_' +
         btoa(navigator.userAgent).substr(0, 8);
}

async function getClientCount() {
  const clients = await self.clients.matchAll();
  return clients.length;
}

function activateQuantumStreams() {
  console.log('🌊 Activating quantum data streams...');
  return Promise.resolve();
}

function initializeQuantumChaos() {
  console.log('🌀 Initializing quantum chaos engine...');
  
  // Start periodic chaos updates
  setInterval(() => {
    const chaosLevel = Math.random();
    if (chaosLevel > 0.8) {
      sendQuantumMessage({
        type: 'CHAOS_SPIKE',
        level: chaosLevel,
        timestamp: Date.now()
      });
    }
  }, 10000);
  
  return Promise.resolve();
}

function sendQuantumMessage(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        source: 'quantum_service_worker',
        ...message
      });
    });
  });
}

// Background sync for offline chaos
self.addEventListener('sync', (event) => {
  console.log('🔄 Quantum sync event:', event.tag);
  
  if (event.tag === 'sync-quantum-data') {
    event.waitUntil(syncQuantumData());
  } else if (event.tag === 'sync-chaos-state') {
    event.waitUntil(syncChaosState());
  }
});

async function syncQuantumData() {
  try {
    const cache = await caches.open(QUANTUM_CACHE_VERSION);
    const response = await fetch('/api/quantum/sync');
    
    if (response.ok) {
      await cache.put('/api/quantum/sync', response.clone());
      sendQuantumMessage({
        type: 'QUANTUM_SYNC_COMPLETE',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Quantum sync failed:', error);
  }
}

async function syncChaosState() {
  // Synchronize chaos state between clients
  const clients = await self.clients.matchAll();
  const chaosState = {
    timestamp: Date.now(),
    global_entropy: Math.random(),
    active_attractors: generateStrangeAttractors(3)
  };
  
  clients.forEach(client => {
    client.postMessage({
      type: 'CHAOS_STATE_UPDATE',
      state: chaosState
    });
  });
}

// Push notifications with quantum effects
self.addEventListener('push', (event) => {
  console.log('📬 Quantum push notification received');
  
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'Quantum Alert',
      body: 'Chaos fluctuation detected',
      chaos: Math.random()
    };
  }
  
  const options = {
    body: data.body || 'Quantum event detected',
    icon: '/Modz.png',
    badge: '/Modz.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/?chaos=1',
      chaos_level: data.chaos || Math.random(),
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'quantum_view',
        title: '🌀 View Chaos'
      },
      {
        action: 'dismiss',
        title: 'Collapse Wave'
      }
    ],
    tag: 'quantum_alert_' + Date.now(),
    renotify: true,
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '⚡ Quantum Modz', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'quantum_view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/?chaos=view')
    );
  } else if (event.action === 'dismiss') {
    // Quantum collapse - dismiss notification
    sendQuantumMessage({
      type: 'QUANTUM_COLLAPSE',
      timestamp: Date.now()
    });
  } else {
    // Default action
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic quantum maintenance
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'quantum-maintenance') {
    event.waitUntil(performQuantumMaintenance());
  }
});

async function performQuantumMaintenance() {
  console.log('🔧 Performing quantum maintenance...');
  
  // Clean up old chaos data
  try {
    const cache = await caches.open(CHAOS_CACHE);
    const keys = await cache.keys();
    
    const oneHourAgo = Date.now() - 3600000;
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const timestamp = response.headers.get('x-quantum-timestamp');
        if (timestamp && parseInt(timestamp) < oneHourAgo) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('Quantum maintenance failed:', error);
  }
  
  // Send maintenance complete message
  sendQuantumMessage({
    type: 'QUANTUM_MAINTENANCE_COMPLETE',
    timestamp: Date.now()
  });
}

// Quantum error handling
self.addEventListener('error', (event) => {
  console.error('💥 Quantum error:', event.error);
  
  sendQuantumMessage({
    type: 'QUANTUM_ERROR',
    error: event.error?.message || 'Unknown quantum error',
    timestamp: Date.now()
  });
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Quantum message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'GET_QUANTUM_STATE':
      event.ports[0].postMessage({
        cache_version: QUANTUM_CACHE_VERSION,
        quantum_state: QUANTUM_STATES.ENTANGLED,
        chaos_active: true,
        offline_capable: true
      });
      break;
      
    case 'TRIGGER_CHAOS':
      const chaosIntensity = data?.intensity || 50;
      sendQuantumMessage({
        type: 'MANUAL_CHAOS_TRIGGER',
        intensity: chaosIntensity,
        timestamp: Date.now()
      });
      break;
      
    case 'CLEAR_QUANTUM_CACHE':
      caches.delete(QUANTUM_CACHE_VERSION).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

// Quantum fallback handler
async function quantumFallback(request, error) {
  console.error('🌌 Quantum fallback triggered:', error);
  
  // Try to serve from cache with quantum modifications
  const cache = await caches.open(QUANTUM_CACHE_VERSION);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  // Ultimate quantum fallback
  return new Response(
    JSON.stringify({
      quantum_fallback: true,
      error: error.message,
      timestamp: Date.now(),
      chaos_recommendation: 'Increase quantum stability',
      retry_after: 30
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '30',
        'X-Quantum-Fallback': 'active'
      }
    }
  );
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    QUANTUM_CACHE_VERSION,
    QUANTUM_STATES,
    generateChaosParticles,
    generateQuantumSessionId
  };
}
