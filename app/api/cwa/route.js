import { NextResponse } from 'next/server';
import crypto from 'crypto';

// CWA API Configuration
const CWA_CONFIG = {
  version: '3.0.0',
  apiVersion: 'v1',
  maxDevices: 1000,
  rateLimit: 100,
  cacheDuration: 3600,
  supportedPlatforms: ['chromeos', 'android', 'ios', 'windows', 'macos', 'linux'],
  features: [
    'stealth_mode',
    'fps_limiter',
    'memory_optimizer',
    'cache_manager',
    'offline_sync',
    'background_updates',
    'device_profiling',
    'adaptive_quality',
    'school_bypass'
  ]
};

// In-memory store (replace with Redis/DB in production)
const installStore = new Map();
const deviceStore = new Map();
const analyticsStore = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const installId = searchParams.get('installId');
  const deviceId = searchParams.get('deviceId');

  try {
    switch (action) {
      case 'status':
        return getStatus(installId);
      case 'config':
        return getConfig();
      case 'device':
        return getDeviceProfile(deviceId);
      case 'analytics':
        return getAnalytics(installId);
      case 'health':
        return getHealth();
      case 'updates':
        return checkUpdates(searchParams.get('version'));
      case 'features':
        return getFeatures(deviceId);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          actions: ['status', 'config', 'device', 'analytics', 'health', 'updates', 'features']
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[CWA API] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 });
    }

    switch (action) {
      case 'register':
        return registerInstallation(data);
      case 'update':
        return updateInstallation(data);
      case 'sync':
        return syncDeviceData(data);
      case 'analytics':
        return trackAnalytics(data);
      case 'feedback':
        return submitFeedback(data);
      case 'report':
        return submitReport(data);
      case 'optimize':
        return getOptimizations(data);
      case 'validate':
        return validateInstallation(data);
      case 'uninstall':
        return uninstallCWA(data);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          actions: ['register', 'update', 'sync', 'analytics', 'feedback', 'report', 'optimize', 'validate', 'uninstall']
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[CWA API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET Handlers
function getStatus(installId) {
  if (!installId) {
    return NextResponse.json({
      success: false,
      error: 'Installation ID required'
    }, { status: 400 });
  }

  const installation = installStore.get(installId);
  
  if (!installation) {
    return NextResponse.json({
      success: false,
      error: 'Installation not found',
      installId
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      installId: installation.id,
      status: installation.status,
      version: installation.version,
      installedAt: installation.installedAt,
      lastActive: installation.lastActive,
      deviceProfile: installation.deviceProfile,
      optimizations: installation.optimizations,
      features: installation.enabledFeatures,
      metrics: installation.metrics
    }
  });
}

function getConfig() {
  return NextResponse.json({
    success: true,
    data: {
      ...CWA_CONFIG,
      timestamp: Date.now(),
      endpoints: {
        register: '/api/cwa/register',
        sync: '/api/cwa/sync',
        analytics: '/api/cwa/analytics',
        updates: '/api/cwa/updates'
      }
    }
  });
}

function getDeviceProfile(deviceId) {
  if (!deviceId) {
    return NextResponse.json({
      success: false,
      error: 'Device ID required'
    }, { status: 400 });
  }

  const profile = deviceStore.get(deviceId);
  
  return NextResponse.json({
    success: true,
    data: profile || {
      deviceId,
      status: 'unknown',
      firstSeen: null,
      lastSeen: null
    }
  });
}

function getAnalytics(installId) {
  const analytics = analyticsStore.get(installId) || {
    sessions: 0,
    totalTime: 0,
    avgFPS: 0,
    crashes: 0,
    features: {}
  };

  return NextResponse.json({
    success: true,
    data: analytics
  });
}

function getHealth() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'operational',
      version: CWA_CONFIG.version,
      apiVersion: CWA_CONFIG.apiVersion,
      timestamp: Date.now(),
      stats: {
        totalInstallations: installStore.size,
        activeDevices: deviceStore.size,
        totalAnalytics: analyticsStore.size
      }
    }
  });
}

async function checkUpdates(currentVersion) {
  try {
    // Check GitHub for latest release
    const response = await fetch('https://api.github.com/repos/2029ijones-sudo/modz3.0/releases/latest');
    const data = await response.json();
    
    const latestVersion = data.tag_name?.replace('v', '') || CWA_CONFIG.version;
    const hasUpdate = compareVersions(latestVersion, currentVersion || '0.0.0') > 0;
    
    return NextResponse.json({
      success: true,
      data: {
        hasUpdate,
        currentVersion: currentVersion || 'unknown',
        latestVersion,
        releaseNotes: data.body || 'Performance improvements and bug fixes',
        releaseUrl: data.html_url,
        publishedAt: data.published_at,
        critical: isCriticalUpdate(currentVersion, latestVersion),
        features: extractFeaturesFromNotes(data.body)
      }
    });
  } catch (error) {
    // Fallback to no updates
    return NextResponse.json({
      success: true,
      data: {
        hasUpdate: false,
        currentVersion: currentVersion || 'unknown',
        latestVersion: CWA_CONFIG.version,
        error: 'Could not fetch latest version'
      }
    });
  }
}

function getFeatures(deviceId) {
  const deviceProfile = deviceStore.get(deviceId);
  
  // Generate feature flags based on device profile
  const features = {
    stealth_mode: deviceProfile?.isSchoolDevice?.detected || false,
    fps_limiter: true,
    memory_optimizer: deviceProfile?.memory < 8,
    cache_manager: true,
    offline_sync: deviceProfile?.connection?.effectiveType !== 'slow-2g',
    background_updates: deviceProfile?.battery?.charging !== false,
    device_profiling: true,
    adaptive_quality: deviceProfile?.tier !== 'ultra',
    school_bypass: deviceProfile?.isSchoolDevice?.detected || false,
    experimental: deviceProfile?.tier === 'ultra'
  };

  return NextResponse.json({
    success: true,
    data: {
      features,
      enabled: Object.keys(features).filter(f => features[f]),
      disabled: Object.keys(features).filter(f => !features[f]),
      timestamp: Date.now()
    }
  });
}

// POST Handlers
async function registerInstallation(data) {
  const {
    deviceId,
    deviceProfile,
    optimizations,
    version = CWA_CONFIG.version
  } = data;

  // Generate unique installation ID
  const installId = generateInstallationId(deviceId, deviceProfile);
  
  // Check if already registered
  if (installStore.has(installId)) {
    const existing = installStore.get(installId);
    return NextResponse.json({
      success: true,
      data: {
        installId,
        status: 'already_registered',
        installedAt: existing.installedAt,
        version: existing.version
      }
    });
  }

  // Validate device profile
  if (!deviceProfile || !deviceId) {
    return NextResponse.json({
      success: false,
      error: 'Device ID and profile required'
    }, { status: 400 });
  }

  // Create installation record
  const installation = {
    id: installId,
    deviceId,
    status: 'active',
    version,
    installedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    deviceProfile,
    optimizations,
    enabledFeatures: [],
    metrics: {
      sessions: 0,
      totalTime: 0,
      avgFPS: 0,
      crashes: 0,
      lastSync: null
    },
    settings: {
      autoUpdate: true,
      stealthMode: deviceProfile.isSchoolDevice?.detected || false,
      fpsTarget: optimizations?.fpsTarget || 40,
      memoryLimit: optimizations?.memoryLimit || 512,
      cacheStrategy: optimizations?.cacheStrategy || 'balanced'
    }
  };

  // Store installation
  installStore.set(installId, installation);
  deviceStore.set(deviceId, {
    ...deviceProfile,
    installId,
    firstSeen: installation.installedAt,
    lastSeen: installation.lastActive
  });

  // Initialize analytics
  analyticsStore.set(installId, {
    sessions: 0,
    totalTime: 0,
    avgFPS: 0,
    crashes: 0,
    features: {},
    installMethod: data.installMethod || 'unknown',
    referrer: data.referrer || 'direct'
  });

  // Generate installation token
  const token = generateToken(installId, deviceId);

  return NextResponse.json({
    success: true,
    data: {
      installId,
      token,
      status: 'registered',
      installedAt: installation.installedAt,
      config: CWA_CONFIG,
      features: await calculateEnabledFeatures(deviceProfile),
      optimizations: installation.optimizations
    }
  });
}

async function updateInstallation(data) {
  const { installId, deviceId, status, metrics, settings } = data;

  const installation = installStore.get(installId);
  
  if (!installation) {
    return NextResponse.json({
      success: false,
      error: 'Installation not found'
    }, { status: 404 });
  }

  // Update installation record
  installation.lastActive = new Date().toISOString();
  installation.status = status || installation.status;
  
  if (metrics) {
    installation.metrics = {
      ...installation.metrics,
      ...metrics,
      lastSync: new Date().toISOString()
    };
  }

  if (settings) {
    installation.settings = {
      ...installation.settings,
      ...settings
    };
  }

  installStore.set(installId, installation);

  // Update device record
  const device = deviceStore.get(deviceId) || {};
  deviceStore.set(deviceId, {
    ...device,
    lastSeen: installation.lastActive,
    status: installation.status
  });

  // Update analytics
  const analytics = analyticsStore.get(installId) || {};
  if (metrics) {
    analytics.sessions = (analytics.sessions || 0) + (metrics.sessions || 0);
    analytics.totalTime = (analytics.totalTime || 0) + (metrics.totalTime || 0);
    analytics.avgFPS = metrics.avgFPS || analytics.avgFPS;
    analytics.crashes = (analytics.crashes || 0) + (metrics.crashes || 0);
    analyticsStore.set(installId, analytics);
  }

  return NextResponse.json({
    success: true,
    data: {
      installId,
      updated: true,
      timestamp: installation.lastActive,
      status: installation.status
    }
  });
}

async function syncDeviceData(data) {
  const { installId, deviceId, syncData, timestamp } = data;

  const installation = installStore.get(installId);
  
  if (!installation) {
    return NextResponse.json({
      success: false,
      error: 'Installation not found'
    }, { status: 404 });
  }

  // Process sync data
  const syncResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    received: Object.keys(syncData || {}).length,
    actions: []
  };

  // Handle settings sync
  if (syncData?.settings) {
    installation.settings = {
      ...installation.settings,
      ...syncData.settings
    };
    syncResponse.actions.push('settings_updated');
  }

  // Handle cache sync
  if (syncData?.cache) {
    // Process cache invalidation
    syncResponse.actions.push('cache_synced');
  }

  // Handle offline data
  if (syncData?.offline) {
    // Store offline actions for processing
    syncResponse.actions.push('offline_data_received');
  }

  installStore.set(installId, installation);

  // Return server-side data
  const serverData = {
    settings: installation.settings,
    features: await calculateEnabledFeatures(installation.deviceProfile),
    updates: await checkForServerUpdates(installation.version),
    notifications: await getPendingNotifications(installId)
  };

  syncResponse.serverData = serverData;

  return NextResponse.json({
    success: true,
    data: syncResponse
  });
}

async function trackAnalytics(data) {
  const { installId, event, properties, timestamp } = data;

  let analytics = analyticsStore.get(installId);
  
  if (!analytics) {
    analytics = {
      sessions: 0,
      totalTime: 0,
      avgFPS: 0,
      crashes: 0,
      features: {},
      events: []
    };
  }

  // Initialize events array if not exists
  if (!analytics.events) {
    analytics.events = [];
  }

  // Store event
  analytics.events.push({
    event,
    properties,
    timestamp: timestamp || new Date().toISOString()
  });

  // Limit events stored
  if (analytics.events.length > 1000) {
    analytics.events = analytics.events.slice(-1000);
  }

  // Update specific metrics based on event
  switch (event) {
    case 'session_start':
      analytics.sessions = (analytics.sessions || 0) + 1;
      break;
    case 'fps_update':
      analytics.avgFPS = calculateMovingAverage(analytics.avgFPS, properties.fps, 0.1);
      break;
    case 'crash':
      analytics.crashes = (analytics.crashes || 0) + 1;
      break;
    case 'feature_used':
      const feature = properties.feature;
      analytics.features[feature] = (analytics.features[feature] || 0) + 1;
      break;
  }

  analyticsStore.set(installId, analytics);

  return NextResponse.json({
    success: true,
    data: {
      received: true,
      event,
      timestamp: new Date().toISOString()
    }
  });
}

async function submitFeedback(data) {
  const { installId, type, title, description, rating, email } = data;

  // Validate feedback
  if (!title || !description) {
    return NextResponse.json({
      success: false,
      error: 'Title and description required'
    }, { status: 400 });
  }

  // Generate feedback ID
  const feedbackId = generateFeedbackId(installId);

  // Store feedback (in production, save to database)
  const feedback = {
    id: feedbackId,
    installId,
    type: type || 'general',
    title,
    description,
    rating: rating || null,
    email: email || null,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  // Here you would save to database
  console.log('[CWA API] Feedback received:', feedback);

  // Send notification (in production, email/slack)
  await sendFeedbackNotification(feedback);

  return NextResponse.json({
    success: true,
    data: {
      feedbackId,
      status: 'submitted',
      timestamp: feedback.timestamp
    }
  });
}

async function submitReport(data) {
  const { installId, type, description, logs, screenshot } = data;

  // Generate report ID
  const reportId = generateReportId(installId);

  // Create report
  const report = {
    id: reportId,
    installId,
    type: type || 'bug',
    description,
    logs: logs || null,
    screenshot: screenshot || null,
    timestamp: new Date().toISOString(),
    userAgent: data.userAgent,
    deviceProfile: data.deviceProfile,
    status: 'open'
  };

  // Here you would save to database/issue tracker
  console.log('[CWA API] Report submitted:', report);

  // Create GitHub issue if configured
  if (process.env.GITHUB_TOKEN && type === 'bug') {
    await createGitHubIssue(report);
  }

  return NextResponse.json({
    success: true,
    data: {
      reportId,
      status: 'submitted',
      timestamp: report.timestamp,
      tracking: `CWA-${reportId.substring(0, 8)}`
    }
  });
}

async function getOptimizations(data) {
  const { deviceProfile, installId, preferences } = data;

  // Calculate optimal settings based on device profile
  const optimizations = {
    fpsTarget: calculateOptimalFPS(deviceProfile),
    renderScale: calculateOptimalRenderScale(deviceProfile),
    textureQuality: calculateOptimalTextureQuality(deviceProfile),
    shadowQuality: calculateOptimalShadowQuality(deviceProfile),
    particleEffects: deviceProfile?.tier !== 'low',
    physicsSteps: calculateOptimalPhysicsSteps(deviceProfile),
    cacheStrategy: calculateOptimalCacheStrategy(deviceProfile),
    prefetchDepth: calculateOptimalPrefetchDepth(deviceProfile),
    concurrentDownloads: calculateOptimalConcurrentDownloads(deviceProfile),
    memoryLimit: calculateOptimalMemoryLimit(deviceProfile),
    batteryOptimization: deviceProfile?.battery?.charging === false,
    dataSaver: deviceProfile?.connection?.saveData || false
  };

  // Apply user preferences
  if (preferences) {
    Object.keys(preferences).forEach(key => {
      if (optimizations[key] !== undefined) {
        optimizations[key] = preferences[key];
      }
    });
  }

  // Apply school device optimizations
  if (deviceProfile?.isSchoolDevice?.detected) {
    optimizations.stealthMode = true;
    optimizations.fpsTarget = Math.min(optimizations.fpsTarget, 40);
    optimizations.renderScale = Math.min(optimizations.renderScale, 0.7);
    optimizations.textureQuality = Math.min(optimizations.textureQuality, 0.6);
    optimizations.shadowQuality = Math.min(optimizations.shadowQuality, 0.3);
    optimizations.memoryLimit = Math.min(optimizations.memoryLimit, 512);
  }

  return NextResponse.json({
    success: true,
    data: {
      optimizations,
      profile: deviceProfile?.tier || 'standard',
      timestamp: Date.now(),
      expiresIn: CWA_CONFIG.cacheDuration
    }
  });
}

async function validateInstallation(data) {
  const { installId, deviceId, token } = data;

  const installation = installStore.get(installId);
  
  if (!installation) {
    return NextResponse.json({
      success: false,
      error: 'Installation not found',
      valid: false
    });
  }

  // Validate device match
  if (installation.deviceId !== deviceId) {
    return NextResponse.json({
      success: false,
      error: 'Device mismatch',
      valid: false
    });
  }

  // Validate token (in production, use JWT)
  const validToken = generateToken(installId, deviceId) === token;

  return NextResponse.json({
    success: true,
    data: {
      valid: validToken,
      installation: {
        id: installation.id,
        status: installation.status,
        version: installation.version,
        installedAt: installation.installedAt
      }
    }
  });
}

async function uninstallCWA(data) {
  const { installId, deviceId, reason, feedback } = data;

  const installation = installStore.get(installId);
  
  if (!installation) {
    return NextResponse.json({
      success: false,
      error: 'Installation not found'
    }, { status: 404 });
  }

  // Record uninstall
  const uninstallRecord = {
    installId,
    deviceId,
    reason: reason || 'unknown',
    feedback: feedback || null,
    timestamp: new Date().toISOString(),
    duration: Date.now() - new Date(installation.installedAt).getTime(),
    metrics: installation.metrics
  };

  console.log('[CWA API] Uninstall recorded:', uninstallRecord);

  // Remove from stores
  installStore.delete(installId);
  deviceStore.delete(deviceId);
  analyticsStore.delete(installId);

  return NextResponse.json({
    success: true,
    data: {
      uninstalled: true,
      timestamp: uninstallRecord.timestamp,
      reason: uninstallRecord.reason
    }
  });
}

// Helper Functions
function generateInstallationId(deviceId, profile) {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(`${deviceId}-${timestamp}-${random}`)
    .digest('hex')
    .substring(0, 16);
  
  return `cwa-${timestamp}-${hash}`;
}

function generateToken(installId, deviceId) {
  return crypto
    .createHash('sha256')
    .update(`${installId}-${deviceId}-${CWA_CONFIG.version}`)
    .digest('hex')
    .substring(0, 32);
}

function generateFeedbackId(installId) {
  return `fb-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

function generateReportId(installId) {
  return `rep-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

function checkRateLimit(clientIp) {
  // Simple in-memory rate limiting
  const key = `ratelimit:${clientIp}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  // In production, use Redis or similar
  const requests = global.rateLimitMap?.get(key) || [];
  const recentRequests = requests.filter(t => now - t < windowMs);
  
  if (recentRequests.length >= CWA_CONFIG.rateLimit) {
    return false;
  }
  
  recentRequests.push(now);
  if (!global.rateLimitMap) global.rateLimitMap = new Map();
  global.rateLimitMap.set(key, recentRequests);
  
  return true;
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  
  return 0;
}

function isCriticalUpdate(current, latest) {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  // Major version bump is critical
  return latestParts[0] > currentParts[0];
}

function extractFeaturesFromNotes(notes) {
  if (!notes) return [];
  
  const features = [];
  const lines = notes.split('\n');
  
  for (const line of lines) {
    if (line.includes('feature') || line.includes('add') || line.includes('new')) {
      features.push(line.replace(/^[#\s*-]*/, '').trim());
    }
  }
  
  return features.slice(0, 5);
}

async function calculateEnabledFeatures(deviceProfile) {
  const features = [];
  
  if (deviceProfile?.isSchoolDevice?.detected) {
    features.push('stealth_mode', 'school_bypass');
  }
  
  if (deviceProfile?.memory < 8) {
    features.push('memory_optimizer');
  }
  
  features.push('fps_limiter', 'cache_manager', 'device_profiling');
  
  if (deviceProfile?.connection?.effectiveType !== 'slow-2g') {
    features.push('offline_sync');
  }
  
  if (deviceProfile?.battery?.charging !== false) {
    features.push('background_updates');
  }
  
  if (deviceProfile?.tier !== 'ultra') {
    features.push('adaptive_quality');
  }
  
  return features;
}

function calculateMovingAverage(current, newValue, alpha = 0.1) {
  if (current === 0) return newValue;
  return current * (1 - alpha) + newValue * alpha;
}

async function checkForServerUpdates(currentVersion) {
  try {
    const response = await fetch('https://api.github.com/repos/2029ijones-sudo/modz3.0/releases/latest');
    const data = await response.json();
    const latest = data.tag_name?.replace('v', '');
    
    return {
      available: compareVersions(latest, currentVersion) > 0,
      version: latest,
      url: data.html_url
    };
  } catch {
    return { available: false };
  }
}

async function getPendingNotifications(installId) {
  // In production, fetch from database
  return [];
}

async function sendFeedbackNotification(feedback) {
  // In production, send email/Slack
  console.log('[CWA API] Feedback notification:', feedback.id);
}

async function createGitHubIssue(report) {
  // In production, create GitHub issue
  console.log('[CWA API] GitHub issue created for:', report.id);
}

// Optimization calculation functions
function calculateOptimalFPS(profile) {
  if (!profile) return 40;
  
  switch (profile.tier) {
    case 'ultra': return 60;
    case 'high': return 60;
    case 'medium': return 50;
    case 'low': return 40;
    default: return 30;
  }
}

function calculateOptimalRenderScale(profile) {
  if (!profile) return 0.8;
  
  switch (profile.tier) {
    case 'ultra': return 1.0;
    case 'high': return 1.0;
    case 'medium': return 0.8;
    case 'low': return 0.6;
    default: return 0.5;
  }
}

function calculateOptimalTextureQuality(profile) {
  if (!profile) return 0.7;
  
  switch (profile.tier) {
    case 'ultra': return 1.0;
    case 'high': return 0.9;
    case 'medium': return 0.7;
    case 'low': return 0.5;
    default: return 0.3;
  }
}

function calculateOptimalShadowQuality(profile) {
  if (!profile) return 0.5;
  
  switch (profile.tier) {
    case 'ultra': return 1.0;
    case 'high': return 0.8;
    case 'medium': return 0.5;
    case 'low': return 0.2;
    default: return 0;
  }
}

function calculateOptimalPhysicsSteps(profile) {
  if (!profile) return 30;
  
  switch (profile.tier) {
    case 'ultra': return 60;
    case 'high': return 60;
    case 'medium': return 45;
    case 'low': return 30;
    default: return 20;
  }
}

function calculateOptimalCacheStrategy(profile) {
  if (!profile) return 'balanced';
  
  if (profile.storage?.available > 1024) return 'maximum';
  if (profile.storage?.available > 512) return 'aggressive';
  if (profile.storage?.available > 256) return 'balanced';
  return 'conservative';
}

function calculateOptimalPrefetchDepth(profile) {
  if (!profile) return 2;
  
  switch (profile.tier) {
    case 'ultra': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 1;
  }
}

function calculateOptimalConcurrentDownloads(profile) {
  if (!profile) return 4;
  
  switch (profile.connection?.effectiveType) {
    case '4g': return 6;
    case '3g': return 4;
    case '2g': return 2;
    case 'slow-2g': return 1;
    default: return 4;
  }
}

function calculateOptimalMemoryLimit(profile) {
  if (!profile) return 512;
  
  const baseLimit = (profile.memory || 4) * 256;
  
  if (profile.isSchoolDevice?.detected) {
    return Math.min(baseLimit, 512);
  }
  
  return Math.min(baseLimit, 2048);
}
