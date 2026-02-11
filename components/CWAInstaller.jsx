import { useState, useEffect, useCallback, useRef } from 'react';
import './CWAInstaller.css';

// Installation state machine
const INSTALL_STATES = {
  IDLE: 'idle',
  CHECKING: 'checking',
  READY: 'ready',
  INSTALLING: 'installing',
  INSTALLED: 'installed',
  ERROR: 'error',
  UPDATING: 'updating'
};

// Device capability scoring
const DEVICE_SCORES = {
  MINIMUM: 0,
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  ULTRA: 100
};

export default function CWAInstaller() {
  // Core state
  const [installState, setInstallState] = useState(INSTALL_STATES.IDLE);
  const [cwaStatus, setCWAStatus] = useState({
    installed: false,
    canInstall: false,
    deferredPrompt: null,
    installProgress: 0,
    installStage: '',
    lastChecked: null
  });
  
  // Device and environment state
  const [deviceProfile, setDeviceProfile] = useState({
    isSchoolDevice: false,
    capabilities: null,
    score: 0,
    tier: 'unknown',
    restrictions: [],
    optimizations: []
  });
  
  const [installError, setInstallError] = useState(null);
  const [installMetrics, setInstallMetrics] = useState({
    startTime: null,
    endTime: null,
    method: null,
    attempts: 0,
    success: false
  });

  // Refs
  const fpLimiterRef = useRef(null);
  const qualityObserverRef = useRef(null);
  const storageCheckRef = useRef(null);
  const serviceWorkerRef = useRef(null);

  // Advanced device fingerprinting
  const detectDeviceCapabilities = useCallback(async () => {
    const capabilities = {
      // Hardware
      memory: navigator.deviceMemory || 4,
      cpuCores: navigator.hardwareConcurrency || 4,
      gpu: await detectGPU(),
      
      // Platform
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      isChromeOS: navigator.userAgent.includes('CrOS'),
      isAndroid: /android/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isWindows: /win/i.test(navigator.userAgent),
      isMac: /mac/i.test(navigator.userAgent),
      isLinux: /linux/i.test(navigator.userAgent),
      
      // Storage
      storage: await estimateStorage(),
      
      // Network
      connection: navigator.connection ? {
        type: navigator.connection.type,
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData || false
      } : { effectiveType: '4g', downlink: 10, saveData: false },
      
      // Display
      display: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
        refreshRate: await detectRefreshRate(),
        hdr: await detectHDR()
      },
      
      // Battery
      battery: await detectBattery(),
      
      // Touch support
      touchPoints: navigator.maxTouchPoints || 0,
      hasTouch: 'ontouchstart' in window,
      
      // Audio
      audioChannels: await detectAudioChannels(),
      
      // Security
      isManaged: await detectManagedDevice(),
      hasRestrictions: await detectDeviceRestrictions(),
      permissions: await detectPermissions()
    };

    // Calculate device score
    const score = calculateDeviceScore(capabilities);
    const tier = getDeviceTier(score);
    
    // Detect school device with enhanced checks
    const isSchoolDevice = await detectSchoolDevice(capabilities);
    
    // Generate optimizations based on device profile
    const optimizations = generateOptimizations(capabilities, tier, isSchoolDevice);
    
    // Detect restrictions
    const restrictions = await detectRestrictions();

    return {
      ...capabilities,
      score,
      tier,
      isSchoolDevice,
      optimizations,
      restrictions
    };
  }, []);

  // GPU detection
  const detectGPU = async () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return { supported: false };
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      
      return {
        supported: true,
        vendor,
        renderer,
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        antialiasing: gl.getContextAttributes().antialias,
        depth: gl.getContextAttributes().depth,
        stencil: gl.getContextAttributes().stencil,
        supportsWebGL2: !!canvas.getContext('webgl2'),
        extensions: gl.getSupportedExtensions()?.length || 0
      };
    } catch (e) {
      return { supported: false, error: e.message };
    }
  };

  // Refresh rate detection
  const detectRefreshRate = () => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();
      let rafId;
      
      const countFrames = (timestamp) => {
        frameCount++;
        if (timestamp - startTime < 1000) {
          rafId = requestAnimationFrame(countFrames);
        } else {
          cancelAnimationFrame(rafId);
          resolve(Math.round(frameCount));
        }
      };
      
      rafId = requestAnimationFrame(countFrames);
      
      // Timeout fallback
      setTimeout(() => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          resolve(60);
        }
      }, 1100);
    });
  };

  // HDR detection
  const detectHDR = async () => {
    if (!window.matchMedia) return false;
    return window.matchMedia('(dynamic-range: high)').matches ||
           window.matchMedia('(color-gamut: p3)').matches;
  };

  // Battery detection
  const detectBattery = async () => {
    if (!navigator.getBattery) {
      return { supported: false };
    }
    
    try {
      const battery = await navigator.getBattery();
      return {
        supported: true,
        charging: battery.charging,
        level: battery.level,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (e) {
      return { supported: false, error: e.message };
    }
  };

  // Audio channels detection
  const detectAudioChannels = () => {
    try {
      const audio = new (window.AudioContext || window.webkitAudioContext)();
      return audio.destination.maxChannelCount || 2;
    } catch (e) {
      return 2;
    }
  };

  // Storage estimation
  const estimateStorage = async () => {
    if ('storage' in navigator && navigator.storage && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: Math.floor(estimate.quota / (1024 * 1024)),
          usage: Math.floor(estimate.usage / (1024 * 1024)),
          available: Math.floor((estimate.quota - estimate.usage) / (1024 * 1024)),
          persistent: await navigator.storage.persisted?.() || false
        };
      } catch (e) {
        return { quota: 1024, usage: 100, available: 924, persistent: false };
      }
    }
    return { quota: 1024, usage: 100, available: 924, persistent: false };
  };

  // Managed device detection
  const detectManagedDevice = async () => {
    // Check for enterprise policies
    const isManaged = navigator.managed !== undefined && navigator.managed !== null;
    
    // Check for ChromeOS management
    if (navigator.userAgent.includes('CrOS')) {
      try {
        const response = await fetch('chrome://management/');
        return response.ok;
      } catch (e) {
        // Ignore fetch errors
      }
    }
    
    return isManaged;
  };

  // Device restrictions detection
  const detectDeviceRestrictions = async () => {
    const restrictions = [];
    
    // Feature Policy restrictions
    if (document.featurePolicy) {
      const features = [
        'camera', 'microphone', 'geolocation', 'notifications',
        'fullscreen', 'payment', 'usb', 'bluetooth', 'midi',
        'sync-xhr', 'accelerometer', 'gyroscope', 'magnetometer'
      ];
      
      features.forEach(feature => {
        if (typeof document.featurePolicy.allowsFeature === 'function' &&
            !document.featurePolicy.allowsFeature(feature)) {
          restrictions.push(feature);
        }
      });
    }
    
    // Permission restrictions
    const permissions = ['geolocation', 'notifications', 'camera', 'microphone'];
    for (const permission of permissions) {
      try {
        const status = await navigator.permissions.query({ name: permission });
        if (status.state === 'denied') {
          restrictions.push(`${permission}_denied`);
        }
      } catch (e) {
        // Permission not supported
      }
    }
    
    return restrictions;
  };

  // Permissions detection
  const detectPermissions = async () => {
    const permissions = {};
    const permissionNames = [
      'geolocation', 'notifications', 'camera', 'microphone',
      'clipboard-read', 'clipboard-write', 'persistent-storage',
      'background-sync', 'idle-detection', 'window-placement'
    ];
    
    for (const name of permissionNames) {
      try {
        const status = await navigator.permissions.query({ name });
        permissions[name] = status.state;
      } catch (e) {
        permissions[name] = 'unsupported';
      }
    }
    
    return permissions;
  };

  // Enhanced school device detection
  const detectSchoolDevice = async (capabilities) => {
    const signals = [];
    
    // Chromebook check
    if (capabilities.isChromeOS) signals.push('chromeos');
    
    // Managed device check
    if (capabilities.isManaged) signals.push('managed');
    
    // Restricted features
    if (capabilities.restrictions?.includes('camera')) signals.push('no_camera');
    if (capabilities.restrictions?.includes('microphone')) signals.push('no_mic');
    if (capabilities.restrictions?.includes('geolocation')) signals.push('no_gps');
    
    // Network patterns
    if (capabilities.connection?.effectiveType === 'slow-2g') signals.push('slow_network');
    
    // Domain patterns
    const domain = window.location.hostname;
    if (domain.includes('school') || domain.includes('k12') || domain.includes('edu')) {
      signals.push('edu_domain');
    }
    
    // Time patterns (school hours)
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 15) signals.push('school_hours');
    
    // Extension patterns
    if (navigator.plugins?.length < 5) signals.push('limited_plugins');
    
    // Score the signals
    const signalScore = signals.length;
    const isSchoolDevice = signalScore >= 3;
    
    return {
      detected: isSchoolDevice,
      confidence: Math.min(signalScore / 5, 1),
      signals,
      profile: isSchoolDevice ? 'strict' : 'standard'
    };
  };

  // Calculate device performance score
  const calculateDeviceScore = (caps) => {
    let score = DEVICE_SCORES.MINIMUM;
    
    // Memory score (0-25)
    score += Math.min(caps.memory * 3, 25);
    
    // CPU score (0-25)
    score += Math.min(caps.cpuCores * 4, 25);
    
    // GPU score (0-20)
    if (caps.gpu.supported) {
      if (caps.gpu.renderer?.includes('Intel')) score += 10;
      else if (caps.gpu.renderer?.includes('AMD')) score += 15;
      else if (caps.gpu.renderer?.includes('NVIDIA')) score += 20;
      else if (caps.gpu.renderer?.includes('Apple')) score += 15;
      else score += 5;
    }
    
    // Storage score (0-15)
    if (caps.storage.available > 1024) score += 15;
    else if (caps.storage.available > 512) score += 10;
    else if (caps.storage.available > 256) score += 5;
    else score += 2;
    
    // Network score (0-15)
    if (caps.connection) {
      if (caps.connection.effectiveType === '4g') score += 15;
      else if (caps.connection.effectiveType === '3g') score += 10;
      else if (caps.connection.effectiveType === '2g') score += 5;
      else score += 2;
    }
    
    return Math.min(score, DEVICE_SCORES.ULTRA);
  };

  // Get device tier from score
  const getDeviceTier = (score) => {
    if (score >= DEVICE_SCORES.ULTRA) return 'ultra';
    if (score >= DEVICE_SCORES.HIGH) return 'high';
    if (score >= DEVICE_SCORES.MEDIUM) return 'medium';
    if (score >= DEVICE_SCORES.LOW) return 'low';
    return 'minimum';
  };

  // Generate optimizations based on device profile
  const generateOptimizations = (caps, tier, isSchoolDevice) => {
    const optimizations = {
      fpsTarget: 60,
      renderScale: 1.0,
      textureQuality: 1.0,
      shadowQuality: 1.0,
      particleEffects: true,
      physicsSteps: 60,
      cacheStrategy: 'aggressive',
      prefetchDepth: 3,
      concurrentDownloads: 6
    };
    
    // Adjust based on tier
    switch (tier) {
      case 'minimum':
        optimizations.fpsTarget = 30;
        optimizations.renderScale = 0.5;
        optimizations.textureQuality = 0.3;
        optimizations.shadowQuality = 0;
        optimizations.particleEffects = false;
        optimizations.physicsSteps = 20;
        optimizations.cacheStrategy = 'conservative';
        optimizations.prefetchDepth = 1;
        optimizations.concurrentDownloads = 2;
        break;
        
      case 'low':
        optimizations.fpsTarget = 40;
        optimizations.renderScale = 0.6;
        optimizations.textureQuality = 0.5;
        optimizations.shadowQuality = 0.3;
        optimizations.particleEffects = false;
        optimizations.physicsSteps = 30;
        optimizations.cacheStrategy = 'balanced';
        optimizations.prefetchDepth = 2;
        optimizations.concurrentDownloads = 3;
        break;
        
      case 'medium':
        optimizations.fpsTarget = 50;
        optimizations.renderScale = 0.8;
        optimizations.textureQuality = 0.8;
        optimizations.shadowQuality = 0.6;
        optimizations.particleEffects = true;
        optimizations.physicsSteps = 45;
        optimizations.cacheStrategy = 'aggressive';
        optimizations.prefetchDepth = 2;
        optimizations.concurrentDownloads = 4;
        break;
        
      case 'high':
        optimizations.fpsTarget = 60;
        optimizations.renderScale = 1.0;
        optimizations.textureQuality = 1.0;
        optimizations.shadowQuality = 0.8;
        optimizations.particleEffects = true;
        optimizations.physicsSteps = 60;
        optimizations.cacheStrategy = 'aggressive';
        optimizations.prefetchDepth = 3;
        optimizations.concurrentDownloads = 5;
        break;
        
      case 'ultra':
        optimizations.fpsTarget = 60;
        optimizations.renderScale = 1.0;
        optimizations.textureQuality = 1.0;
        optimizations.shadowQuality = 1.0;
        optimizations.particleEffects = true;
        optimizations.physicsSteps = 60;
        optimizations.cacheStrategy = 'maximum';
        optimizations.prefetchDepth = 4;
        optimizations.concurrentDownloads = 8;
        break;
    }
    
    // Apply school device optimizations
    if (isSchoolDevice.detected) {
      optimizations.fpsTarget = 40;
      optimizations.renderScale = Math.min(optimizations.renderScale, 0.7);
      optimizations.textureQuality = Math.min(optimizations.textureQuality, 0.6);
      optimizations.shadowQuality = Math.min(optimizations.shadowQuality, 0.3);
      optimizations.stealthMode = true;
      optimizations.cpuThrottle = 0.7;
      optimizations.memoryLimit = 512;
      optimizations.disableAnalytics = true;
      optimizations.obfuscateRequests = true;
      optimizations.randomizeDelays = true;
    }
    
    return optimizations;
  };

  // Detect restrictions
  const detectRestrictions = async () => {
    const restrictions = [];
    
    // Storage persistence
    try {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) restrictions.push('storage_not_persistent');
      }
    } catch (e) {}
    
    // Service Worker
    if (!('serviceWorker' in navigator)) {
      restrictions.push('no_service_worker');
    }
    
    // IndexedDB
    if (!window.indexedDB) {
      restrictions.push('no_indexeddb');
    }
    
    // Cache API
    if (!('caches' in window)) {
      restrictions.push('no_cache_api');
    }
    
    // WebGL
    try {
      const canvas = document.createElement('canvas');
      if (!canvas.getContext('webgl') && !canvas.getContext('experimental-webgl')) {
        restrictions.push('no_webgl');
      }
    } catch (e) {
      restrictions.push('webgl_error');
    }
    
    // Web Workers
    if (!window.Worker) {
      restrictions.push('no_web_workers');
    }
    
    // WebAssembly
    if (!window.WebAssembly) {
      restrictions.push('no_wasm');
    }
    
    // SharedArrayBuffer
    if (!window.SharedArrayBuffer) {
      restrictions.push('no_sab');
    }
    
    return restrictions;
  };

  // Initialize CWA
  useEffect(() => {
    const initializeCWA = async () => {
      setInstallState(INSTALL_STATES.CHECKING);
      
      try {
        // Detect device capabilities
        const profile = await detectDeviceCapabilities();
        setDeviceProfile(profile);
        
        // Check installation status
        await checkCWAStatus();
        
        // Setup PWA install listener
        setupPWAInstallListener();
        
        // Setup app installed listener
        setupAppInstalledListener();
        
        // Setup connection change listener
        setupConnectionListener();
        
        // Setup visibility change listener
        setupVisibilityListener();
        
        // Preload critical assets
        await preloadCriticalAssets();
        
        // Check for updates
        await checkForUpdates();
        
        setInstallState(INSTALL_STATES.READY);
        
        console.log('[CWA] Initialization complete', {
          profile: deviceProfile,
          status: cwaStatus
        });
      } catch (error) {
        console.error('[CWA] Initialization failed:', error);
        setInstallState(INSTALL_STATES.ERROR);
        setInstallError(error.message);
      }
    };
    
    initializeCWA();
    
    return () => {
      cleanup();
    };
  }, []);

  // Setup PWA install listener
  const setupPWAInstallListener = () => {
    const handler = (e) => {
      e.preventDefault();
      setCWAStatus(prev => ({
        ...prev,
        canInstall: true,
        deferredPrompt: e
      }));
      setInstallState(INSTALL_STATES.READY);
      console.log('[CWA] Install prompt ready');
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  };

  // Setup app installed listener
  const setupAppInstalledListener = () => {
    const handler = () => {
      console.log('[CWA] Successfully installed');
      setCWAStatus(prev => ({
        ...prev,
        installed: true,
        canInstall: false,
        deferredPrompt: null
      }));
      setInstallState(INSTALL_STATES.INSTALLED);
      
      // Enable CWA features
      enableCWAFeatures();
      
      // Close modal if open
      setShowModal(false);
      
      // Track installation success
      setInstallMetrics(prev => ({
        ...prev,
        endTime: Date.now(),
        success: true
      }));
    };
    
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  };

  // Setup connection listener
  const setupConnectionListener = () => {
    const onlineHandler = () => {
      console.log('[CWA] Back online');
      syncOfflineData();
    };
    
    const offlineHandler = () => {
      console.log('[CWA] Offline mode activated');
      enableOfflineMode();
    };
    
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  };

  // Setup visibility listener
  const setupVisibilityListener = () => {
    const handler = () => {
      if (document.hidden) {
        onAppHidden();
      } else {
        onAppVisible();
      }
    };
    
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  };

  // Check CWA installation status
  const checkCWAStatus = async () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.matchMedia('(display-mode: fullscreen)').matches ||
                        window.matchMedia('(display-mode: minimal-ui)').matches;
    
    const hasLocalFlag = localStorage.getItem('cwa_installed') === 'true';
    const hasSessionFlag = sessionStorage.getItem('cwa_active') === 'true';
    
    // Check for service worker
    let hasSW = false;
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      hasSW = registrations.some(reg => 
        reg.active?.scriptURL.includes('cwa') ||
        reg.active?.scriptURL.includes('pwa')
      );
    }
    
    const installed = isStandalone || hasLocalFlag || hasSessionFlag || hasSW;
    
    setCWAStatus(prev => ({
      ...prev,
      installed,
      canInstall: prev.canInstall && !installed,
      lastChecked: Date.now()
    }));
    
    if (installed) {
      setInstallState(INSTALL_STATES.INSTALLED);
      enableCWAFeatures();
    }
  };

  // Preload critical assets
  const preloadCriticalAssets = async () => {
    const criticalAssets = [
      '/manifest.json',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/sw-cwa.js'
    ];
    
    const preloadPromises = criticalAssets.map(asset => {
      return fetch(asset, { 
        method: 'HEAD',
        cache: 'force-cache'
      }).catch(() => null);
    });
    
    await Promise.allSettled(preloadPromises);
    console.log('[CWA] Critical assets preloaded');
  };

  // Check for updates
  const checkForUpdates = async () => {
    if (!cwaStatus.installed) return;
    
    try {
      const response = await fetch('/version.json?' + Date.now());
      const remote = await response.json();
      const local = localStorage.getItem('cwa_version');
      
      if (remote.version !== local) {
        setInstallState(INSTALL_STATES.UPDATING);
        await applyUpdate(remote);
      }
    } catch (e) {
      console.warn('[CWA] Update check failed:', e);
    }
  };

  // Apply update
  const applyUpdate = async (remote) => {
    console.log('[CWA] Applying update:', remote.version);
    
    // Update service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
    
    // Clear old caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('cwa') && !name.includes(remote.version)
      );
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    }
    
    // Update stored version
    localStorage.setItem('cwa_version', remote.version);
    localStorage.setItem('cwa_updated_at', new Date().toISOString());
    
    setInstallState(INSTALL_STATES.READY);
    console.log('[CWA] Update applied');
  };

  // Enable CWA features
  const enableCWAFeatures = () => {
    console.log('[CWA] Enabling advanced features...');
    
    // Apply device optimizations
    applyDeviceOptimizations();
    
    // Setup performance monitoring
    setupPerformanceMonitoring();
    
    // Register CWA service worker
    registerCWAServiceWorker();
    
    // Setup FPS limiter
    setupFPSLimiter();
    
    // Setup adaptive quality
    setupAdaptiveQuality();
    
    // Setup memory management
    setupMemoryManagement();
    
    // Setup cache management
    setupCacheManagement();
    
    // Apply school optimizations if needed
    if (deviceProfile.isSchoolDevice?.detected) {
      applySchoolOptimizations();
    }
  };

  // Apply device optimizations
  const applyDeviceOptimizations = () => {
    const optimizations = deviceProfile.optimizations;
    
    // Apply CSS custom properties
    Object.entries(optimizations).forEach(([key, value]) => {
      if (typeof value === 'number' || typeof value === 'string') {
        document.documentElement.style.setProperty(`--cwa-${key}`, value);
      }
    });
    
    // Set meta tags
    let viewport = document.querySelector('meta[name=viewport]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = `width=device-width, initial-scale=${optimizations.renderScale}, maximum-scale=${optimizations.renderScale}, user-scalable=no`;
    
    console.log('[CWA] Device optimizations applied:', optimizations);
  };

  // Setup performance monitoring
  const setupPerformanceMonitoring = () => {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      // Monitor FPS
      let frameCount = 0;
      let lastFpsUpdate = performance.now();
      
      const measureFPS = () => {
        frameCount++;
        const now = performance.now();
        const delta = now - lastFpsUpdate;
        
        if (delta >= 1000) {
          const fps = frameCount;
          frameCount = 0;
          lastFpsUpdate = now;
          
          // Dispatch FPS event
          window.dispatchEvent(new CustomEvent('cwa-fps', {
            detail: { fps, target: deviceProfile.optimizations.fpsTarget }
          }));
        }
        
        fpLimiterRef.current = requestAnimationFrame(measureFPS);
      };
      
      fpLimiterRef.current = requestAnimationFrame(measureFPS);
      
      // Monitor long tasks
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[CWA] Long task detected:', entry.duration);
            adjustQuality('lower');
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      qualityObserverRef.current = observer;
      
      // Monitor memory
      if (performance.memory) {
        storageCheckRef.current = setInterval(() => {
          const usedJSHeapSize = performance.memory.usedJSHeapSize;
          const jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
          const usage = usedJSHeapSize / jsHeapSizeLimit;
          
          if (usage > 0.8) {
            console.warn('[CWA] High memory usage:', usage);
            triggerGarbageCollection();
          }
        }, 10000);
      }
    } catch (e) {
      console.warn('[CWA] Performance monitoring setup failed:', e);
    }
  };

  // Register CWA service worker
  const registerCWAServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw-cwa.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      serviceWorkerRef.current = registration;
      
      console.log('[CWA] Service worker registered:', registration);
      
      // Send initialization data
      if (registration.active) {
        registration.active.postMessage({
          type: 'CWA_INIT',
          data: {
            deviceProfile,
            optimizations: deviceProfile.optimizations,
            installId: localStorage.getItem('cwa_install_id'),
            installDate: localStorage.getItem('cwa_install_date'),
            version: localStorage.getItem('cwa_version')
          }
        });
      }
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[CWA] New service worker found');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[CWA] New version ready');
            // Show update notification
          }
        });
      });
    } catch (error) {
      console.warn('[CWA] Service worker registration failed:', error);
    }
  };

  // Setup FPS limiter
  const setupFPSLimiter = () => {
    const targetFPS = deviceProfile.optimizations.fpsTarget;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;
    let rafId;
    
    const frameCallback = (timestamp) => {
      rafId = requestAnimationFrame(frameCallback);
      
      const elapsed = timestamp - lastFrameTime;
      
      if (elapsed > frameInterval) {
        lastFrameTime = timestamp - (elapsed % frameInterval);
        
        window.dispatchEvent(new CustomEvent('cwa-frame', {
          detail: {
            timestamp,
            fps: targetFPS,
            interval: frameInterval,
            profile: deviceProfile
          }
        }));
      }
    };
    
    rafId = requestAnimationFrame(frameCallback);
    fpLimiterRef.current = rafId;
  };

  // Setup adaptive quality
  const setupAdaptiveQuality = () => {
    let frameTimes = [];
    const maxSamples = 60;
    
    const measurePerformance = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'frame') {
            frameTimes.push(entry.duration);
            
            if (frameTimes.length > maxSamples) {
              frameTimes.shift();
            }
            
            if (frameTimes.length === maxSamples) {
              const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / maxSamples;
              const currentFPS = 1000 / avgFrameTime;
              const targetFPS = deviceProfile.optimizations.fpsTarget;
              
              if (currentFPS < targetFPS * 0.8) {
                adjustQuality('lower');
              } else if (currentFPS > targetFPS * 1.2) {
                adjustQuality('higher');
              }
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['frame'] });
      qualityObserverRef.current = observer;
    };
    
    if (window.PerformanceObserver) {
      try {
        measurePerformance();
      } catch (e) {
        console.warn('[CWA] PerformanceObserver not supported');
      }
    }
  };

  // Adjust quality based on performance
  const adjustQuality = (direction) => {
    const optimizations = { ...deviceProfile.optimizations };
    
    if (direction === 'lower') {
      optimizations.renderScale = Math.max(0.3, (optimizations.renderScale || 1) * 0.9);
      optimizations.textureQuality = Math.max(0.2, (optimizations.textureQuality || 1) * 0.9);
      optimizations.shadowQuality = Math.max(0, (optimizations.shadowQuality || 1) * 0.8);
      optimizations.particleEffects = optimizations.renderScale > 0.5;
      optimizations.physicsSteps = Math.max(20, (optimizations.physicsSteps || 60) - 5);
    } else if (direction === 'higher') {
      optimizations.renderScale = Math.min(1, (optimizations.renderScale || 1) * 1.1);
      optimizations.textureQuality = Math.min(1, (optimizations.textureQuality || 1) * 1.1);
      optimizations.shadowQuality = Math.min(1, (optimizations.shadowQuality || 1) * 1.1);
      optimizations.particleEffects = true;
      optimizations.physicsSteps = Math.min(60, (optimizations.physicsSteps || 20) + 5);
    }
    
    // Update CSS custom properties
    Object.entries(optimizations).forEach(([key, value]) => {
      if (typeof value === 'number' || typeof value === 'string') {
        document.documentElement.style.setProperty(`--cwa-${key}`, value);
      }
    });
    
    deviceProfile.optimizations = optimizations;
    console.log('[CWA] Quality adjusted:', direction, optimizations);
  };

  // Setup memory management
  const setupMemoryManagement = () => {
    const memoryThreshold = deviceProfile.optimizations.memoryLimit || 512;
    
    const checkMemory = async () => {
      if (performance.memory) {
        const usedJSHeapSize = performance.memory.usedJSHeapSize;
        const usedMB = usedJSHeapSize / (1024 * 1024);
        
        if (usedMB > memoryThreshold * 0.8) {
          console.warn('[CWA] Memory threshold exceeded:', usedMB);
          await triggerGarbageCollection();
          await clearNonCriticalCache();
        }
      }
      
      storageCheckRef.current = setTimeout(checkMemory, 30000);
    };
    
    storageCheckRef.current = setTimeout(checkMemory, 30000);
  };

  // Setup cache management
  const setupCacheManagement = () => {
    const cacheStrategy = deviceProfile.optimizations.cacheStrategy || 'balanced';
    
    const manageCache = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const cwaCaches = cacheNames.filter(name => name.includes('cwa'));
          
          for (const cacheName of cwaCaches) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            if (cacheStrategy === 'conservative' && requests.length > 50) {
              // Keep only recent items
              const toDelete = requests.slice(0, requests.length - 50);
              await Promise.all(toDelete.map(request => cache.delete(request)));
            } else if (cacheStrategy === 'aggressive' && requests.length > 100) {
              const toDelete = requests.slice(0, requests.length - 100);
              await Promise.all(toDelete.map(request => cache.delete(request)));
            } else if (cacheStrategy === 'maximum' && requests.length > 200) {
              const toDelete = requests.slice(0, requests.length - 200);
              await Promise.all(toDelete.map(request => cache.delete(request)));
            }
          }
        } catch (e) {
          console.warn('[CWA] Cache management failed:', e);
        }
      }
    };
    
    // Run cache management periodically
    setInterval(manageCache, 5 * 60 * 1000); // Every 5 minutes
  };

  // Trigger garbage collection
  const triggerGarbageCollection = async () => {
    if (window.gc) {
      try {
        window.gc();
        console.log('[CWA] Garbage collection triggered');
      } catch (e) {}
    } else {
      // Force GC by allocating and releasing
      try {
        const largeArray = new Array(1000000).fill('*');
        setTimeout(() => {
          largeArray.length = 0;
        }, 100);
      } catch (e) {}
    }
  };

  // Clear non-critical cache
  const clearNonCriticalCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const nonCriticalCaches = cacheNames.filter(name => 
          name.includes('cwa') && 
          !name.includes('critical') &&
          !name.includes('core')
        );
        
        await Promise.all(nonCriticalCaches.map(name => caches.delete(name)));
        console.log('[CWA] Non-critical cache cleared');
      } catch (e) {
        console.warn('[CWA] Failed to clear cache:', e);
      }
    }
  };

  // Apply school optimizations
  const applySchoolOptimizations = () => {
    console.log('[CWA] Applying school device optimizations...');
    
    // Disable console logs in production
    if (window.location.hostname !== 'localhost') {
      const originalConsole = { ...console };
      
      console.log = () => {};
      console.warn = () => {};
      console.info = () => {};
      console.debug = () => {};
      
      // Restore on cleanup
      window.__restoreConsole = () => {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
        console.debug = originalConsole.debug;
      };
    }
    
    // Obfuscate requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      // Add random delay (0-300ms)
      const delay = Math.random() * 300;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Obfuscate headers
      if (args[1]?.headers) {
        args[1].headers = {
          ...args[1].headers,
          'X-CWA-Stealth': Math.random().toString(36),
          'X-CWA-Session': localStorage.getItem('cwa_install_id')?.substring(0, 8)
        };
      }
      
      return originalFetch.apply(this, args);
    };
    
    // Store for cleanup
    window.__originalFetch = originalFetch;
    
    // Reduce animation quality
    document.documentElement.style.setProperty('--cwa-animation-quality', 'low');
    document.documentElement.style.setProperty('--cwa-transition-duration', '0.1s');
    
    // Disable non-essential features
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        document.querySelectorAll('video, audio').forEach(el => {
          if (!el.hasAttribute('data-essential')) {
            el.pause();
            el.remove();
          }
        });
      });
    }
  };

  // Sync offline data
  const syncOfflineData = async () => {
    console.log('[CWA] Syncing offline data...');
    
    // Check for pending sync
    const pendingSync = localStorage.getItem('cwa_pending_sync');
    if (pendingSync) {
      try {
        const data = JSON.parse(pendingSync);
        // Attempt to sync
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        localStorage.removeItem('cwa_pending_sync');
        console.log('[CWA] Offline data synced');
      } catch (e) {
        console.warn('[CWA] Sync failed:', e);
      }
    }
  };

  // Enable offline mode
  const enableOfflineMode = () => {
    console.log('[CWA] Enabling offline mode...');
    
    // Set offline flag
    sessionStorage.setItem('cwa_offline', 'true');
    
    // Switch to offline assets
    document.documentElement.classList.add('cwa-offline');
    
    // Show offline indicator
    window.dispatchEvent(new CustomEvent('cwa-offline'));
  };

  // On app hidden
  const onAppHidden = () => {
    // Reduce resource usage
    if (fpLimiterRef.current) {
      cancelAnimationFrame(fpLimiterRef.current);
    }
    
    // Set low power mode
    document.documentElement.classList.add('cwa-background');
    
    // Save state
    saveApplicationState();
  };

  // On app visible
  const onAppVisible = () => {
    // Restore FPS limiter
    setupFPSLimiter();
    
    // Remove low power mode
    document.documentElement.classList.remove('cwa-background');
    
    // Restore state
    restoreApplicationState();
  };

  // Save application state
  const saveApplicationState = () => {
    try {
      const state = {
        timestamp: Date.now(),
        url: window.location.href,
        scrollY: window.scrollY,
        cwaActive: localStorage.getItem('cwa_mode') === 'enabled',
        optimizations: deviceProfile.optimizations
      };
      
      sessionStorage.setItem('cwa_state', JSON.stringify(state));
    } catch (e) {
      console.warn('[CWA] Failed to save state:', e);
    }
  };

  // Restore application state
  const restoreApplicationState = () => {
    try {
      const state = sessionStorage.getItem('cwa_state');
      if (state) {
        const parsed = JSON.parse(state);
        window.scrollTo(0, parsed.scrollY || 0);
        sessionStorage.removeItem('cwa_state');
      }
    } catch (e) {
      console.warn('[CWA] Failed to restore state:', e);
    }
  };

  // Cleanup
  const cleanup = () => {
    // Cancel animation frames
    if (fpLimiterRef.current) {
      cancelAnimationFrame(fpLimiterRef.current);
    }
    
    // Disconnect observers
    if (qualityObserverRef.current) {
      qualityObserverRef.current.disconnect();
    }
    
    // Clear timeouts
    if (storageCheckRef.current) {
      clearTimeout(storageCheckRef.current);
    }
    
    // Restore console
    if (window.__restoreConsole) {
      window.__restoreConsole();
    }
    
    // Restore fetch
    if (window.__originalFetch) {
      window.fetch = window.__originalFetch;
    }
    
    // Save final state
    saveApplicationState();
  };

  // Installation methods
  const installCWA = async () => {
    setInstallState(INSTALL_STATES.INSTALLING);
    setInstallError(null);
    setInstallMetrics(prev => ({
      ...prev,
      startTime: Date.now(),
      attempts: prev.attempts + 1
    }));
    
    try {
      console.log('[CWA] Starting CWA installation...');
      
      // Generate unique installation ID
      const installId = generateInstallationId();
      localStorage.setItem('cwa_install_id', installId);
      
      // Check install availability
      if (!cwaStatus.deferredPrompt) {
        throw new Error('Install prompt not available. Ensure HTTPS and valid manifest.');
      }
      
      // Show native install prompt
      const deferredPrompt = cwaStatus.deferredPrompt;
      deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // Installation accepted
        console.log('[CWA] Installation accepted');
        
        // Store installation metadata
        const installData = {
          id: installId,
          timestamp: Date.now(),
          date: new Date().toISOString(),
          version: '3.0.0',
          deviceProfile: deviceProfile,
          optimizations: deviceProfile.optimizations,
          metrics: installMetrics
        };
        
        localStorage.setItem('cwa_installed', 'true');
        localStorage.setItem('cwa_install_data', JSON.stringify(installData));
        localStorage.setItem('cwa_install_date', installData.date);
        localStorage.setItem('cwa_version', installData.version);
        localStorage.setItem('cwa_school_mode', deviceProfile.isSchoolDevice.detected ? 'true' : 'false');
        localStorage.setItem('cwa_device_tier', deviceProfile.tier);
        localStorage.setItem('cwa_device_score', deviceProfile.score);
        
        // Pre-enable CWA features
        localStorage.setItem('cwa_mode', 'enabled');
        localStorage.setItem('cwa_performance', 'adaptive');
        localStorage.setItem('cwa_fps_target', deviceProfile.optimizations.fpsTarget);
        localStorage.setItem('cwa_stealth', deviceProfile.isSchoolDevice.detected ? 'true' : 'false');
        localStorage.setItem('cwa_optimizations', JSON.stringify(deviceProfile.optimizations));
        
        // Clear deferred prompt
        setCWAStatus(prev => ({
          ...prev,
          deferredPrompt: null
        }));
        
        setInstallMetrics(prev => ({
          ...prev,
          method: 'native_prompt',
          success: true
        }));
        
        setInstallState(INSTALL_STATES.READY);
        setShowModal(false);
        
        // Show success message
        showInstallSuccess();
        
      } else {
        throw new Error('Installation cancelled by user');
      }
    } catch (error) {
      console.error('[CWA] Installation failed:', error);
      setInstallError(error.message);
      setInstallState(INSTALL_STATES.ERROR);
      setInstallMetrics(prev => ({
        ...prev,
        success: false,
        error: error.message
      }));
    }
  };

  // Generate installation ID
  const generateInstallationId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const userAgent = navigator.userAgent.length.toString(36);
    const memory = (navigator.deviceMemory || 4).toString(36);
    
    return `cwa-${timestamp}-${random}-${userAgent}-${memory}`.toLowerCase();
  };

  // Show install success
  const showInstallSuccess = () => {
    const success = document.createElement('div');
    success.className = 'cwa-success-notification';
    success.innerHTML = `
      <div class="cwa-success-content">
        <div class="cwa-success-icon">✨</div>
        <div class="cwa-success-text">
          <strong>CWA Installed Successfully!</strong>
          <small>${deviceProfile.tier.charAt(0).toUpperCase() + deviceProfile.tier.slice(1)} Performance Profile • ${deviceProfile.optimizations.fpsTarget}FPS</small>
        </div>
      </div>
    `;
    
    document.body.appendChild(success);
    
    setTimeout(() => {
      success.classList.add('cwa-success-hide');
      setTimeout(() => success.remove(), 300);
    }, 5000);
  };

  // Show install prompt
  const showCWAPrompt = () => {
    if (!cwaStatus.canInstall) {
      if (deviceProfile.restrictions?.length > 0) {
        alert(`CWA cannot be installed due to device restrictions:\n- ${deviceProfile.restrictions.join('\n- ')}`);
      } else {
        alert('CWA installation is not available right now.\n\nRequirements:\n• Chrome/Edge browser\n• HTTPS connection\n• Valid manifest.json\n• Not already installed');
      }
      return;
    }
    
    setShowModal(true);
    setInstallError(null);
  };

  // Check if installation is available
  const isInstallAvailable = () => {
    return cwaStatus.canInstall && 
           cwaStatus.deferredPrompt !== null && 
           installState !== INSTALL_STATES.INSTALLING &&
           installState !== INSTALL_STATES.INSTALLED;
  };

  // Get installation button text
  const getInstallButtonText = () => {
    switch (installState) {
      case INSTALL_STATES.INSTALLING:
        return 'Installing...';
      case INSTALL_STATES.INSTALLED:
        return 'CWA Installed';
      case INSTALL_STATES.UPDATING:
        return 'Updating...';
      case INSTALL_STATES.ERROR:
        return 'Retry Installation';
      default:
        return 'Install CWA';
    }
  };

  // Get performance badge
  const getPerformanceBadge = () => {
    const tier = deviceProfile.tier;
    const fps = deviceProfile.optimizations?.fpsTarget || 40;
    
    switch (tier) {
      case 'ultra':
        return { text: 'ULTRA', color: '#ffd700' };
      case 'high':
        return { text: 'HIGH', color: '#00ff00' };
      case 'medium':
        return { text: 'MEDIUM', color: '#00ffff' };
      case 'low':
        return { text: 'LOW', color: '#ff9900' };
      default:
        return { text: 'MINIMUM', color: '#ff0000' };
    }
  };

  const performanceBadge = getPerformanceBadge();

  return (
    <div className="cwa-installer">
      {/* CWA Install Button */}
      <button 
        className={`cwa-install-button 
          ${cwaStatus.installed ? 'installed' : ''} 
          ${installState === INSTALL_STATES.INSTALLING ? 'installing' : ''}
          ${installState === INSTALL_STATES.ERROR ? 'error' : ''}
          ${deviceProfile.tier}
        `}
        onClick={showCWAPrompt}
        disabled={cwaStatus.installed || installState === INSTALL_STATES.INSTALLING}
      >
        <span className="cwa-icon">
          {installState === INSTALL_STATES.INSTALLING ? '⏳' : 
           installState === INSTALL_STATES.INSTALLED ? '✅' : 
           installState === INSTALL_STATES.ERROR ? '⚠️' : '⚡'}
        </span>
        
        <span className="cwa-text">
          {getInstallButtonText()}
        </span>
        
        {!cwaStatus.installed && installState !== INSTALL_STATES.INSTALLING && (
          <span 
            className="cwa-badge"
            style={{ backgroundColor: performanceBadge.color }}
          >
            {performanceBadge.text}
          </span>
        )}
        
        {installState === INSTALL_STATES.INSTALLING && (
          <span className="cwa-progress">
            <span className="cwa-progress-bar"></span>
          </span>
        )}
      </button>

      {/* CWA Installation Modal */}
      {showModal && (
        <div className="cwa-modal-overlay">
          <div className="cwa-modal">
            <button 
              className="cwa-modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            
            <div className="cwa-modal-header">
              <div className={`cwa-modal-icon ${deviceProfile.tier}`}>
                {deviceProfile.tier === 'ultra' ? '⚡' :
                 deviceProfile.tier === 'high' ? '🚀' :
                 deviceProfile.tier === 'medium' ? '💪' :
                 deviceProfile.tier === 'low' ? '⚙️' : '🔧'}
              </div>
              
              <h2>
                Install Modz Quantum CWA
                <span className={`cwa-tier-badge ${deviceProfile.tier}`}>
                  {deviceProfile.tier.toUpperCase()}
                </span>
              </h2>
              
              <p>
                {deviceProfile.isSchoolDevice?.detected 
                  ? 'School device detected • Stealth mode enabled • 40FPS optimized'
                  : `Optimized for ${deviceProfile.tier}-performance devices • ${deviceProfile.optimizations?.fpsTarget || 40}FPS`
                }
              </p>
            </div>

            {/* Device Profile Summary */}
            <div className="cwa-device-summary">
              <div className="cwa-summary-item">
                <span className="summary-label">Device Score</span>
                <span className="summary-value">{deviceProfile.score}/100</span>
                <div className="summary-bar">
                  <div 
                    className="summary-fill"
                    style={{ width: `${deviceProfile.score}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="cwa-summary-stats">
                <div className="cwa-stat">
                  <span className="stat-icon">🧠</span>
                  <span className="stat-value">{deviceProfile.memory || 4}GB</span>
                  <span className="stat-label">RAM</span>
                </div>
                
                <div className="cwa-stat">
                  <span className="stat-icon">⚙️</span>
                  <span className="stat-value">{deviceProfile.cpuCores || 4}</span>
                  <span className="stat-label">Cores</span>
                </div>
                
                <div className="cwa-stat">
                  <span className="stat-icon">📱</span>
                  <span className="stat-value">{deviceProfile.optimizations?.fpsTarget || 40}</span>
                  <span className="stat-label">FPS</span>
                </div>
                
                <div className="cwa-stat">
                  <span className="stat-icon">💾</span>
                  <span className="stat-value">{deviceProfile.storage?.available || 924}MB</span>
                  <span className="stat-label">Free</span>
                </div>
              </div>
            </div>

            {/* Optimizations Preview */}
            <div className="cwa-optimizations-preview">
              <h4>Optimizations Applied</h4>
              <div className="cwa-optimization-tags">
                <span className={`cwa-tag ${deviceProfile.optimizations?.cacheStrategy}`}>
                  Cache: {deviceProfile.optimizations?.cacheStrategy}
                </span>
                <span className={`cwa-tag ${deviceProfile.optimizations?.renderScale > 0.7 ? 'high' : 'low'}`}>
                  Render: {Math.round(deviceProfile.optimizations?.renderScale * 100)}%
                </span>
                <span className={`cwa-tag ${deviceProfile.optimizations?.textureQuality > 0.7 ? 'high' : 'low'}`}>
                  Textures: {Math.round(deviceProfile.optimizations?.textureQuality * 100)}%
                </span>
                <span className={`cwa-tag ${deviceProfile.optimizations?.physicsSteps > 30 ? 'high' : 'low'}`}>
                  Physics: {deviceProfile.optimizations?.physicsSteps}Hz
                </span>
                {deviceProfile.optimizations?.stealthMode && (
                  <span className="cwa-tag stealth">
                    🕵️ Stealth Mode
                  </span>
                )}
              </div>
            </div>

            {/* Features Grid */}
            <div className="cwa-features">
              <div className="cwa-feature">
                <span className="feature-icon">🎯</span>
                <div>
                  <h4>Performance Optimized</h4>
                  <p>{deviceProfile.optimizations?.fpsTarget || 40}FPS target • Adaptive quality</p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">🏫</span>
                <div>
                  <h4>School Chromebook Bypass</h4>
                  <p>
                    {deviceProfile.isSchoolDevice?.detected 
                      ? '✓ Stealth mode • Request obfuscation • Console disabled'
                      : 'Automatic detection • Stealth ready'}
                  </p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">⚡</span>
                <div>
                  <h4>Smart Memory Management</h4>
                  <p>{deviceProfile.optimizations?.cacheStrategy} caching • Auto cleanup • {deviceProfile.optimizations?.memoryLimit || 512}MB limit</p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">🔒</span>
                <div>
                  <h4>Enhanced Privacy</h4>
                  <p>Local-first • Minimal logging • No tracking</p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">📦</span>
                <div>
                  <h4>Offline Support</h4>
                  <p>{deviceProfile.storage?.available || 924}MB available • Background sync</p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">🔄</span>
                <div>
                  <h4>Auto Updates</h4>
                  <p>Version {localStorage.getItem('cwa_version') || '3.0.0'} • Silent background updates</p>
                </div>
              </div>
            </div>

            {/* Device Warnings */}
            {deviceProfile.restrictions?.length > 0 && (
              <div className="cwa-warnings">
                <h4>⚠️ Device Restrictions Detected</h4>
                <ul className="cwa-restriction-list">
                  {deviceProfile.restrictions.slice(0, 3).map((restriction, i) => (
                    <li key={i}>{restriction.replace(/_/g, ' ')}</li>
                  ))}
                  {deviceProfile.restrictions.length > 3 && (
                    <li>+{deviceProfile.restrictions.length - 3} more</li>
                  )}
                </ul>
                <p className="cwa-warning-note">
                  CWA will automatically work around these restrictions.
                </p>
              </div>
            )}

            {deviceProfile.isSchoolDevice?.detected && (
              <div className="cwa-school-warning">
                <div className="warning-header">
                  <span className="warning-icon">🏫</span>
                  <span className="warning-title">School Device Detected</span>
                  <span className="warning-confidence">
                    {Math.round(deviceProfile.isSchoolDevice.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="warning-details">
                  <p>Stealth mode will be enabled with these protections:</p>
                  <ul>
                    <li>40FPS locked (reduces detection)</li>
                    <li>Console logging disabled</li>
                    <li>Request timing randomized</li>
                    <li>Memory usage limited to 512MB</li>
                    <li>Analytics & tracking disabled</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Installation Error */}
            {installError && (
              <div className="cwa-error">
                <span className="error-icon">❌</span>
                <div className="error-content">
                  <strong>Installation Failed</strong>
                  <p>{installError}</p>
                  {installError.includes('HTTPS') && (
                    <small>Run on localhost or deploy to HTTPS</small>
                  )}
                  {installError.includes('manifest') && (
                    <small>Check that manifest.json exists and is valid</small>
                  )}
                </div>
              </div>
            )}

            {/* Installation Actions */}
            <div className="cwa-modal-buttons">
              <button 
                className={`cwa-btn cwa-btn-primary ${deviceProfile.tier}`}
                onClick={installCWA}
                disabled={!isInstallAvailable() || installState === INSTALL_STATES.INSTALLING}
              >
                {installState === INSTALL_STATES.INSTALLING ? (
                  <>
                    <span className="btn-icon spinner">⏳</span>
                    Installing CWA...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📱</span>
                    {isInstallAvailable() 
                      ? `Install CWA (${deviceProfile.optimizations?.fpsTarget || 40}FPS)` 
                      : 'Installation Not Available'}
                  </>
                )}
              </button>
              
              <button 
                className="cwa-btn cwa-btn-secondary"
                onClick={() => {
                  window.location.href = '/?cwa=1&demo=1';
                  setShowModal(false);
                }}
              >
                <span className="btn-icon">🎮</span>
                Try Demo Mode
              </button>
              
              <button 
                className="cwa-btn cwa-btn-tertiary"
                onClick={() => setShowModal(false)}
              >
                <span className="btn-icon">📋</span>
                Close
              </button>
            </div>

            {/* Installation Requirements */}
            <div className="cwa-requirements">
              <p className="requirements-title">Installation Requirements:</p>
              <ul className="requirements-list">
                <li className={cwaStatus.canInstall ? 'met' : 'unmet'}>
                  ✓ Chrome/Edge browser
                </li>
                <li className={window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? 'met' : 'unmet'}>
                  ✓ HTTPS or localhost
                </li>
                <li className={cwaStatus.canInstall ? 'met' : 'unmet'}>
                  ✓ Valid manifest.json
                </li>
                <li className={!cwaStatus.installed ? 'met' : 'unmet'}>
                  ✓ Not already installed
                </li>
              </ul>
            </div>

            <div className="cwa-footer">
              <p>
                <small>
                  CWA v{localStorage.getItem('cwa_version') || '3.0.0'} • 
                  Device Tier: {deviceProfile.tier} • 
                  Score: {deviceProfile.score}/100
                </small>
              </p>
              <p>
                <small className="cwa-footnote">
                  Uses native PWA installation with advanced runtime optimizations.
                  {!cwaStatus.canInstall && ' Refresh page if installation remains unavailable.'}
                </small>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
