// ============================================================================
// QUANTUM MAINTENANCE MODE MIDDLEWARE - EDGE CONFIG INTEGRATION
// ============================================================================
// Location: /middleware.js (project root)
// Purpose:  INSTANT maintenance mode using Vercel Edge Config (no redeploy)
// ============================================================================

import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

/**
 * Quantum Maintenance Mode Middleware
 * 
 * This middleware runs on EVERY request and checks if maintenance mode is active
 * via Vercel Edge Config. Updates are INSTANT - no redeploy, no waiting.
 * 
 * Edge Config Item:
 * - key: "enabled"
 * - value: true/false
 * 
 * @param {NextRequest} request - The incoming request object
 * @returns {NextResponse} - Rewritten response or next()
 */
export async function middleware(request) {
  // ==========================================================================
  // 1. QUANTUM STATE OBSERVATION - Wave function collapse
  // ==========================================================================
  const timestamp = new Date().toISOString();
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const method = request.method;
  
  // Quantum entropy generation - multiple sources of randomness
  const timeEntropy = Date.now().toString(36);
  const randomEntropy = Math.random().toString(36).substring(2, 10);
  const pathEntropy = pathname.split('/').filter(Boolean).join('').length.toString(16);
  const requestId = `${timeEntropy}-${randomEntropy}-${pathEntropy}`;
  
  // ==========================================================================
  // 2. EDGE CONFIG MAINTENANCE MODE OBSERVATION - INSTANT UPDATES
  // ==========================================================================
  let MAINTENANCE_MODE = false;
  let edgeConfigAvailable = false;
  
  try {
    // ⚡⚡⚡ INSTANT - Reads from Edge Config, no redeploy needed ⚡⚡⚡
    MAINTENANCE_MODE = await get('enabled') === true;
    edgeConfigAvailable = true;
  } catch (error) {
    // Fallback to env var if Edge Config fails
    console.error('❌ Edge Config error:', error.message);
    MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
  }
  
  // ==========================================================================
  // 3. STATIC ASSET DETECTION MATRIX - 7 layers of classification
  // ==========================================================================
  
  // Layer 1: Next.js internal assets
  const isNextJsInternal = 
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/__nextjs_') ||
    pathname.startsWith('/_error') ||
    pathname === '/404' ||
    pathname === '/500';
  
  // Layer 2: Web standards & PWA
  const isWebStandard = [
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap-0.xml',
    '/sitemap-index.xml',
    '/sitemap.xml.gz',
    '/manifest.json',
    '/site.webmanifest',
    '/browserconfig.xml',
    '/.well-known/',
    '/security.txt',
    '/humans.txt',
    '/crossdomain.xml',
    '/ads.txt',
    '/app-ads.txt',
    '/yandex_',
    '/google',
    '/BingSiteAuth.xml'
  ].some(pattern => 
    pathname === pattern || 
    pathname.startsWith('/.well-known/') || 
    pathname.startsWith('/yandex_') || 
    pathname.startsWith('/google')
  );
  
  // Layer 3: App icons - every possible size
  const isAppIcon = [
    '/apple-icon',
    '/apple-touch-icon',
    '/icon',
    '/favicon',
    '/ms-icon',
    '/android-icon',
    '/chrome-icon',
    '/safari-pinned-tab',
    '/mstile',
    '/browserconfig'
  ].some(pattern => 
    pathname.startsWith(pattern) && 
    /\.(png|ico|svg|jpg|jpeg|webp)$/i.test(pathname)
  );
  
  // Layer 4: Service workers & offline support
  const isServiceWorkerAsset = 
    pathname === '/sw.js' ||
    pathname === '/sw-cwa.js' ||
    pathname === '/workbox.js' ||
    pathname === '/precache.js' ||
    pathname === '/offline.html' ||
    pathname.startsWith('/sw-') && pathname.endsWith('.js') ||
    pathname.startsWith('/workbox-') && pathname.endsWith('.js') ||
    pathname.startsWith('/precache-manifest.') && pathname.endsWith('.js');
  
  // Layer 5: File extension spectrum analysis
  const staticExtensions = [
    // Web assets
    'css', 'js', 'mjs', 'jsx', 'ts', 'tsx', 'json', 'map',
    // Documents
    'txt', 'xml', 'csv', 'yaml', 'yml', 'md', 'markdown', 'rst',
    // Images
    'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'bmp', 'tiff', 'webp2',
    // Fonts
    'woff', 'woff2', 'ttf', 'eot', 'otf',
    // Archives
    'pdf', 'zip', 'tar', 'gz', '7z', 'rar',
    // Media
    'mp4', 'webm', 'ogg', 'mp3', 'wav',
    // Configs
    'webmanifest', 'htaccess', 'env.example'
  ];
  
  const fileExtension = pathname.split('.').pop()?.toLowerCase();
  const isStaticExtension = staticExtensions.includes(fileExtension);
  const isVersionedFile = /[a-f0-9]{8,}\.(css|js)$/i.test(pathname);
  
  // Layer 6: Maintenance mode assets (must be whitelisted)
  const isMaintenanceAsset = 
    pathname.startsWith('/maintenance.') || 
    pathname === '/maintenance.html' ||
    pathname.startsWith('/assets/maintenance/') ||
    pathname.startsWith('/images/maintenance/') ||
    pathname.startsWith('/styles/maintenance/') ||
    pathname.startsWith('/js/maintenance/');
  
  // Layer 7: Build system artifacts
  const isBuildArtifact = 
    pathname.startsWith('/build/') ||
    pathname.startsWith('/dist/') ||
    pathname.startsWith('/out/') ||
    pathname.startsWith('.next/') ||
    pathname.includes('/_next/');
  
  // FINAL STATIC ASSET DECISION
  const isStaticAsset = 
    isNextJsInternal ||
    isWebStandard ||
    isAppIcon ||
    isServiceWorkerAsset ||
    isStaticExtension ||
    isVersionedFile ||
    isBuildArtifact;
  
  // ==========================================================================
  // 4. MAINTENANCE PAGE DETECTION - Prevent quantum entanglement
  // ==========================================================================
  const isMaintenancePage = pathname === '/maintenance.html';
  const isMaintenanceResource = isMaintenanceAsset && !isMaintenancePage;
  
  // ==========================================================================
  // 5. PATH COMPLEXITY ANALYSIS - Quantum path entanglement
  // ==========================================================================
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathDepth = pathSegments.length;
  const hasTrailingSlash = pathname.endsWith('/') && pathname.length > 1;
  const hasFileExtension = pathname.includes('.') && !pathname.endsWith('/');
  const isDirectoryIndex = pathname.endsWith('/') || pathSegments[pathSegments.length - 1] === 'index';
  const isRootPath = pathname === '/' || pathname === '';
  
  // ==========================================================================
  // 6. REQUEST ANALYSIS - Quantum observation effects
  // ==========================================================================
  const isPrefetch = request.headers.get('next-router-prefetch') === '1' || 
                     request.headers.get('next-router-prefetch') === 'true' ||
                     request.headers.get('purpose') === 'prefetch' ||
                     request.headers.get('sec-purpose') === 'prefetch';
  
  const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|yahoo|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot/i.test(request.headers.get('user-agent') || '');
  
  const isBackground = request.headers.get('next-router-prefetch') === '1' ||
                      request.headers.get('x-nextjs-data') === '1' ||
                      request.headers.get('x-middleware-prefetch') === '1';
  
  // ==========================================================================
  // 7. BYPASS DECISION ENGINE - Pure logic, no external dependencies
  // ==========================================================================
  const shouldBypassMaintenance = 
    isStaticAsset ||                    // Static assets never blocked
    isMaintenancePage ||               // Already on maintenance page
    isMaintenanceResource ||          // Maintenance page resources
    isPrefetch ||                    // Prefetch requests bypass
    isBot ||                        // Search engines bypass (don't index maintenance)
    isBackground;                  // Background requests bypass
  
  // ==========================================================================
  // 8. QUANTUM STATE LOGGING - Full visibility
  // ==========================================================================
  console.log(`\n⚛️ [${timestamp}] QUANTUM MAINTENANCE DECOHERENCE #${requestId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 REQ: ${method} ${pathname} ${Object.keys(url.searchParams).length ? '?' + url.search : ''}`);
  console.log(`🌀 DEPTH: ${pathDepth} | EXT: ${fileExtension || 'none'} | ROOT: ${isRootPath}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔮 MAINTENANCE SOURCE: ${edgeConfigAvailable ? '⚡ EDGE CONFIG (INSTANT)' : '⚠️ ENV VAR (NEEDS REDEPLOY)'}`);
  console.log(`🔮 MAINTENANCE MODE: ${MAINTENANCE_MODE ? '🟢 ACTIVE' : '⚫ INACTIVE'}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 ASSET ANALYSIS:`);
  console.log(`  ├─ Next.js Internal: ${isNextJsInternal ? '✅' : '❌'}`);
  console.log(`  ├─ Web Standard: ${isWebStandard ? '✅' : '❌'}`);
  console.log(`  ├─ App Icon: ${isAppIcon ? '✅' : '❌'}`);
  console.log(`  ├─ Service Worker: ${isServiceWorkerAsset ? '✅' : '❌'}`);
  console.log(`  ├─ Static Extension: ${isStaticExtension ? '✅' : '❌'}`);
  console.log(`  ├─ Versioned File: ${isVersionedFile ? '✅' : '❌'}`);
  console.log(`  ├─ Build Artifact: ${isBuildArtifact ? '✅' : '❌'}`);
  console.log(`  └─ TOTAL STATIC: ${isStaticAsset ? '✅ YES' : '❌ NO'}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🧠 REQUEST ANALYSIS:`);
  console.log(`  ├─ Prefetch: ${isPrefetch ? '✅' : '❌'}`);
  console.log(`  ├─ Bot/Crawler: ${isBot ? '✅' : '❌'}`);
  console.log(`  └─ Background: ${isBackground ? '✅' : '❌'}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`⚖️ BYPASS DECISION: ${shouldBypassMaintenance ? '✅ PASS' : '❌ BLOCK'}`);
  
  // ==========================================================================
  // 9. FINAL RESPONSE - Quantum collapse to single state
  // ==========================================================================
  let response;
  
  if (!MAINTENANCE_MODE) {
    // Quantum state: NORMAL OPERATION
    console.log(`💫 ACTION: ➡️ CONTINUE (maintenance inactive)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    response = NextResponse.next();
    
  } else if (shouldBypassMaintenance) {
    // Quantum state: BYPASS GRANTED
    console.log(`💫 ACTION: ➡️ CONTINUE (bypass active)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    response = NextResponse.next();
    
    // Tag the response for debugging
    if (isPrefetch) response.headers.set('X-Quantum-Bypass', 'prefetch');
    if (isBot) response.headers.set('X-Quantum-Bypass', 'bot');
    if (isStaticAsset) response.headers.set('X-Quantum-Bypass', 'static');
    
  } else {
    // Quantum state: MAINTENANCE MODE ACTIVE
    console.log(`💫 ACTION: 🔄 REWRITE → /maintenance.html (INSTANT)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    const maintenanceUrl = new URL('/maintenance.html', request.url);
    response = NextResponse.rewrite(maintenanceUrl);
    
    // Quantum state headers
    response.headers.set('X-Quantum-State', 'maintenance');
    response.headers.set('X-Maintenance-Mode', 'true');
    response.headers.set('X-Maintenance-Source', edgeConfigAvailable ? 'edge-config' : 'env-var');
    response.headers.set('X-Original-Path', pathname);
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  // Common headers for all responses
  response.headers.set('X-Quantum-Timestamp', timestamp);
  response.headers.set('X-Quantum-Request-ID', requestId);
  response.headers.set('X-Edge-Config-Available', edgeConfigAvailable ? 'true' : 'false');
  
  return response;
}

// ============================================================================
// QUANTUM CONFIGURATION - Route matcher with negative lookahead
// ============================================================================
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt (static files)
     * - public folder assets (images, fonts, etc)
     * - maintenance.html (prevent loops)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|maintenance.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff2?|ttf|eot|otf|pdf|zip|webmanifest)).*)',
  ],
};
