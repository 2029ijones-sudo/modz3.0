import { NextResponse } from 'next/server';

// Update manifest
const UPDATE_MANIFEST = {
  version: '3.0.0',
  required: false,
  critical: false,
  publishedAt: new Date().toISOString(),
  channels: {
    stable: {
      version: '3.0.0',
      url: '/releases/v3.0.0',
      size: 2450000
    },
    beta: {
      version: '3.1.0-beta.1',
      url: '/releases/v3.1.0-beta.1',
      size: 2500000
    },
    alpha: {
      version: '3.2.0-alpha.2',
      url: '/releases/v3.2.0-alpha.2',
      size: 2600000
    }
  }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const currentVersion = searchParams.get('version');
  const channel = searchParams.get('channel') || 'stable';
  const deviceTier = searchParams.get('tier');

  try {
    const update = await checkForUpdates(currentVersion, channel, deviceTier);
    
    return NextResponse.json({
      success: true,
      data: update
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, version, channel, deviceId } = body;

    switch (action) {
      case 'download':
        return getDownloadUrl(version, channel);
      case 'manifest':
        return getUpdateManifest(version, deviceId);
      case 'rollback':
        return getRollbackVersion(version);
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

async function checkForUpdates(currentVersion, channel, deviceTier) {
  const channelConfig = UPDATE_MANIFEST.channels[channel] || UPDATE_MANIFEST.channels.stable;
  const latestVersion = channelConfig.version;
  
  const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
  
  if (!hasUpdate) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion,
      message: 'You have the latest version'
    };
  }

  // Determine if update is critical based on version jump
  const currentParts = currentVersion.split('.').map(Number);
  const latestParts = latestVersion.split('.').map(Number);
  const critical = latestParts[0] > currentParts[0];

  // Customize update for device tier
  const update = {
    hasUpdate: true,
    currentVersion,
    latestVersion,
    critical,
    required: critical || channel === 'stable',
    url: channelConfig.url,
    size: channelConfig.size,
    publishedAt: UPDATE_MANIFEST.publishedAt,
    releaseNotes: getReleaseNotes(latestVersion),
    features: getNewFeatures(latestVersion, currentVersion),
    compatibility: checkCompatibility(deviceTier, latestVersion)
  };

  return update;
}

function getDownloadUrl(version, channel) {
  const channelConfig = UPDATE_MANIFEST.channels[channel] || UPDATE_MANIFEST.channels.stable;
  
  return NextResponse.json({
    success: true,
    data: {
      url: channelConfig.url,
      version: version || channelConfig.version,
      size: channelConfig.size,
      integrity: generateIntegrityHash(channelConfig.url),
      expiresIn: 3600
    }
  });
}

function getUpdateManifest(version, deviceId) {
  // Generate differential update manifest
  return NextResponse.json({
    success: true,
    data: {
      ...UPDATE_MANIFEST,
      deviceId,
      timestamp: Date.now(),
      differential: {
        available: true,
        size: Math.round(UPDATE_MANIFEST.channels.stable.size * 0.3),
        chunks: generateChunks(version)
      }
    }
  });
}

function getRollbackVersion(currentVersion) {
  const parts = currentVersion.split('.').map(Number);
  const rollbackVersion = `${parts[0]}.${Math.max(0, parts[1] - 1)}.${parts[2] || 0}`;
  
  return NextResponse.json({
    success: true,
    data: {
      version: rollbackVersion,
      url: `/releases/v${rollbackVersion}`,
      size: 2400000
    }
  });
}

// Helper functions
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

function getReleaseNotes(version) {
  // In production, fetch from database or markdown file
  return [
    'Performance improvements',
    'Bug fixes',
    'Enhanced stealth mode',
    'Better memory management'
  ];
}

function getNewFeatures(latest, current) {
  // In production, fetch from database
  return [
    'Adaptive quality scaling',
    'Improved offline sync',
    'School bypass enhancement'
  ];
}

function checkCompatibility(deviceTier, version) {
  if (!deviceTier) return true;
  
  const majorVersion = parseInt(version.split('.')[0]);
  
  // Ultra devices support all versions
  if (deviceTier === 'ultra') return true;
  
  // Low-end devices might have restrictions
  if (deviceTier === 'low' && majorVersion > 3) {
    return false;
  }
  
  return true;
}

function generateIntegrityHash(url) {
  // In production, generate actual SRI hash
  return 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';
}

function generateChunks(version) {
  // Generate differential update chunks
  return [
    { id: 1, size: 250000, hash: 'chunk1hash' },
    { id: 2, size: 300000, hash: 'chunk2hash' },
    { id: 3, size: 200000, hash: 'chunk3hash' }
  ];
}
