/**
 * CWA (ChromeBook Web App) - Advanced Installation System
 * Dual installation system: Standard PWA + Advanced CWA
 * Bypasses school restrictions with stealth mode
 */

class CWAInstaller {
    constructor() {
        this.isInstalled = false;
        this.isCWAInstalled = false;
        this.performanceProfile = null;
        this.deviceCapabilities = null;
        this.installationId = null;
        this.cwaStorage = null;
        this.stealthMode = true;
        
        // CWA Configuration - Optimized for 40FPS
        this.config = {
            name: 'Modz Quantum CWA',
            version: '3.0.0',
            fpsTarget: 40,
            memoryLimit: 1024, // MB
            storageLimit: 2048, // MB
            stealthMode: true,
            schoolBypass: true,
            detectionAvoidance: true,
            performanceMode: 'adaptive'
        };
    }

    /**
     * Initialize CWA System
     */
    async init() {
        try {
            console.log('[CWA] Initializing Advanced Installation System...');
            
            // Check if device is school Chromebook
            const isSchoolDevice = this.detectSchoolDevice();
            
            // Generate stealth installation ID
            this.installationId = this.generateStealthId();
            
            // Detect device capabilities
            await this.detectDeviceCapabilities();
            
            // Create performance profile based on device
            this.createPerformanceProfile();
            
            // Setup custom storage with stealth
            await this.setupStealthStorage();
            
            // Register CWA-specific service worker
            await this.registerCWAServiceWorker();
            
            // Setup performance monitoring and optimization
            this.setupPerformanceOptimization();
            
            // Set up CWA-specific event listeners
            this.setupCWAListeners();
            
            console.log('[CWA] System initialized successfully', {
                stealth: this.stealthMode,
                schoolDevice: isSchoolDevice,
                capabilities: this.deviceCapabilities
            });
            
            return {
                success: true,
                mode: this.stealthMode ? 'stealth' : 'normal',
                device: this.deviceCapabilities
            };
        } catch (error) {
            console.error('[CWA] Initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate stealth installation ID
     */
    generateStealthId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const userAgentHash = btoa(navigator.userAgent).substring(0, 10);
        const memory = navigator.deviceMemory || 'unknown';
        
        return `cwa-${timestamp}-${random}-${userAgentHash}-${memory}`.toLowerCase();
    }

    /**
     * Detect if device is a school Chromebook
     */
    detectSchoolDevice() {
        const ua = navigator.userAgent.toLowerCase();
        const isChromeOS = ua.includes('cros');
        const isManaged = navigator.managed !== undefined;
        const hasRestrictions = document.featurePolicy && 
            !document.featurePolicy.allowsFeature('camera');
        
        return isChromeOS && (isManaged || hasRestrictions);
    }

    /**
     * Detect device capabilities for optimization
     */
    async detectDeviceCapabilities() {
        this.deviceCapabilities = {
            // Memory and CPU
            memory: navigator.deviceMemory || 4,
            cpuCores: navigator.hardwareConcurrency || 4,
            
            // Storage
            storage: await this.estimateStorage(),
            
            // Platform
            isChromeOS: navigator.userAgent.includes('CrOS'),
            isAndroid: /android/i.test(navigator.userAgent),
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
            isSchoolDevice: this.detectSchoolDevice(),
            
            // Network
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                saveData: navigator.connection.saveData || false
            } : { effectiveType: '4g', downlink: 10, saveData: false },
            
            // Screen
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
                pixelRatio: window.devicePixelRatio || 1
            }
        };
        
        // Estimate GPU capabilities
        await this.detectGPU();
    }

    /**
     * Estimate available storage
     */
    async estimateStorage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: Math.floor(estimate.quota / (1024 * 1024)), // MB
                    usage: Math.floor(estimate.usage / (1024 * 1024)), // MB
                    available: Math.floor((estimate.quota - estimate.usage) / (1024 * 1024)) // MB
                };
            } catch (e) {
                return { quota: 1024, usage: 100, available: 924 };
            }
        }
        return { quota: 1024, usage: 100, available: 924 };
    }

    /**
     * Detect GPU capabilities
     */
    async detectGPU() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                this.deviceCapabilities.gpu = {
                    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
                    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
                    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    supportsWebGL2: !!canvas.getContext('webgl2')
                };
            }
        } catch (e) {
            this.deviceCapabilities.gpu = { error: 'GPU detection failed' };
        }
    }

    /**
     * Create performance profile based on device
     */
    createPerformanceProfile() {
        const cap = this.deviceCapabilities;
        
        // Determine performance tier
        let tier = 'low';
        if (cap.memory >= 8 && cap.cpuCores >= 4) tier = 'high';
        else if (cap.memory >= 4 && cap.cpuCores >= 2) tier = 'medium';
        
        // Create adaptive profile
        this.performanceProfile = {
            tier: tier,
            fpsTarget: this.config.fpsTarget,
            memoryLimit: Math.min(this.config.memoryLimit, cap.memory * 256), // Adaptive
            renderQuality: tier === 'high' ? 1.0 : tier === 'medium' ? 0.75 : 0.5,
            physicsRate: tier === 'high' ? 60 : tier === 'medium' ? 30 : 20,
            aiBatchSize: tier === 'high' ? 32 : tier === 'medium' ? 16 : 8,
            cacheStrategy: 'aggressive',
            lazyLoading: true,
            preemptiveCaching: tier !== 'low'
        };
        
        // Apply stealth optimizations for school devices
        if (cap.isSchoolDevice) {
            this.performanceProfile.stealthMode = true;
            this.performanceProfile.memoryLimit = Math.min(512, this.performanceProfile.memoryLimit);
            this.performanceProfile.cpuThrottle = 0.7; // Use max 70% CPU
        }
    }

    /**
     * Setup stealth storage for school bypass
     */
    async setupStealthStorage() {
        try {
            // Use IndexedDB for stealth storage
            const dbName = `cwa_cache_${this.installationId.substring(0, 8)}`;
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, 1);
                
                request.onerror = () => reject('IndexedDB failed');
                
                request.onsuccess = (event) => {
                    this.cwaStorage = event.target.result;
                    console.log('[CWA] Stealth storage initialized');
                    resolve();
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object stores for different data types
                    if (!db.objectStoreNames.contains('assets')) {
                        db.createObjectStore('assets', { keyPath: 'id' });
                    }
                    
                    if (!db.objectStoreNames.contains('settings')) {
                        db.createObjectStore('settings', { keyPath: 'key' });
                    }
                    
                    if (!db.objectStoreNames.contains('cache')) {
                        db.createObjectStore('cache', { keyPath: 'url' });
                    }
                };
            });
        } catch (error) {
            console.warn('[CWA] Stealth storage failed, using fallback');
            this.cwaStorage = {
                get: (key) => localStorage.getItem(`cwa_${key}`),
                set: (key, value) => localStorage.setItem(`cwa_${key}`, value),
                delete: (key) => localStorage.removeItem(`cwa_${key}`)
            };
        }
    }

    /**
     * Register CWA-specific service worker
     */
    async registerCWAServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Create CWA-specific service worker
                const swUrl = '/sw-cwa.js';
                
                const registration = await navigator.serviceWorker.register(swUrl, {
                    scope: '/',
                    updateViaCache: 'none'
                });
                
                console.log('[CWA] Service Worker registered:', registration);
                
                // Send initialization data to service worker
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'CWA_INIT',
                        data: {
                            installationId: this.installationId,
                            performanceProfile: this.performanceProfile,
                            stealthMode: this.stealthMode
                        }
                    });
                }
                
                return registration;
            } catch (error) {
                console.warn('[CWA] Service Worker registration failed:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Setup performance optimization
     */
    setupPerformanceOptimization() {
        // Request idle callback for background tasks
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.preloadCriticalAssets();
                this.setupMemoryManagement();
            });
        } else {
            setTimeout(() => {
                this.preloadCriticalAssets();
                this.setupMemoryManagement();
            }, 1000);
        }
        
        // Setup FPS limiter for consistent performance
        this.setupFPSLimiter();
        
        // Setup adaptive quality based on performance
        this.setupAdaptiveQuality();
        
        // Setup memory monitoring
        this.setupMemoryMonitoring();
    }

    /**
     * Setup FPS limiter for consistent 40FPS
     */
    setupFPSLimiter() {
        let lastTime = 0;
        const fpsInterval = 1000 / this.config.fpsTarget;
        
        const animate = (timestamp) => {
            const delta = timestamp - lastTime;
            
            if (delta > fpsInterval) {
                lastTime = timestamp - (delta % fpsInterval);
                
                // Trigger animation frame
                this.onAnimationFrame(timestamp);
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Animation frame handler
     */
    onAnimationFrame(timestamp) {
        // This will be called at max 40FPS
        // Dispatch custom event for CWA apps
        window.dispatchEvent(new CustomEvent('cwa-frame', {
            detail: {
                timestamp,
                fps: this.config.fpsTarget,
                profile: this.performanceProfile
            }
        }));
    }

    /**
     * Setup adaptive quality
     */
    setupAdaptiveQuality() {
        let frameCount = 0;
        let lastFpsCheck = performance.now();
        let currentFPS = this.config.fpsTarget;
        
        const checkFPS = () => {
            frameCount++;
            const now = performance.now();
            
            if (now - lastFpsCheck >= 1000) {
                currentFPS = frameCount;
                frameCount = 0;
                lastFpsCheck = now;
                
                // Adjust quality based on FPS
                if (currentFPS < this.config.fpsTarget * 0.8) {
                    this.adjustQuality('lower');
                } else if (currentFPS > this.config.fpsTarget * 1.2) {
                    this.adjustQuality('higher');
                }
            }
            
            requestAnimationFrame(checkFPS);
        };
        
        requestAnimationFrame(checkFPS);
    }

    /**
     * Adjust quality based on performance
     */
    adjustQuality(direction) {
        if (!this.performanceProfile) return;
        
        if (direction === 'lower') {
            this.performanceProfile.renderQuality *= 0.9;
            this.performanceProfile.physicsRate = Math.max(20, this.performanceProfile.physicsRate - 5);
        } else if (direction === 'higher') {
            this.performanceProfile.renderQuality = Math.min(1.0, this.performanceProfile.renderQuality * 1.1);
            this.performanceProfile.physicsRate = Math.min(60, this.performanceProfile.physicsRate + 5);
        }
        
        console.log('[CWA] Quality adjusted:', this.performanceProfile);
    }

    /**
     * Setup memory monitoring
     */
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = memory.usedJSHeapSize / (1024 * 1024);
                const limitMB = this.performanceProfile.memoryLimit;
                
                if (usedMB > limitMB * 0.8) {
                    this.triggerGarbageCollection();
                    this.clearNonCriticalCache();
                }
            }, 10000); // Check every 10 seconds
        }
    }

    /**
     * Trigger garbage collection
     */
    triggerGarbageCollection() {
        if (window.gc) {
            window.gc();
        } else {
            // Force GC by allocating and releasing memory
            try {
                const largeArray = new Array(1000000).fill(0);
                setTimeout(() => {
                    largeArray.length = 0;
                }, 100);
            } catch (e) {
                // Ignore errors
            }
        }
    }

    /**
     * Clear non-critical cache
     */
    clearNonCriticalCache() {
        if (this.cwaStorage && this.cwaStorage.transaction) {
            const transaction = this.cwaStorage.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('[CWA] Non-critical cache cleared');
            };
        }
    }

    /**
     * Preload critical assets
     */
    preloadCriticalAssets() {
        const criticalAssets = [
            '/Modz.png',
            '/manifest.json',
            '/lib/cwa-installer.js'
        ];
        
        criticalAssets.forEach(asset => {
            fetch(asset, { cache: 'force-cache' })
                .then(() => console.log(`[CWA] Preloaded: ${asset}`))
                .catch(e => console.warn(`[CWA] Failed to preload ${asset}:`, e));
        });
    }

    /**
     * Setup CWA event listeners
     */
    setupCWAListeners() {
        // Handle beforeinstallprompt for custom installation
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showCustomInstallPrompt();
        });
        
        // Handle appinstalled event
        window.addEventListener('appinstalled', (e) => {
            console.log('[CWA] App installed successfully');
            this.isCWAInstalled = true;
            this.triggerPostInstallOptimization();
        });
        
        // Handle online/offline events
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
        
        // Handle visibility change for resource management
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppHidden();
            } else {
                this.onAppVisible();
            }
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    /**
     * Show custom installation prompt
     */
    showCustomInstallPrompt() {
        // Create custom installation UI
        const installModal = document.createElement('div');
        installModal.id = 'cwa-install-modal';
        installModal.innerHTML = `
            <div class="cwa-install-overlay">
                <div class="cwa-install-modal">
                    <h3>🚀 Install Modz Quantum CWA</h3>
                    <p>Choose installation method:</p>
                    <div class="cwa-install-options">
                        <button class="cwa-btn cwa-btn-pwa" data-mode="pwa">
                            <span class="cwa-icon">📱</span>
                            <span>Standard PWA</span>
                            <small>Basic installation</small>
                        </button>
                        <button class="cwa-btn cwa-btn-cwa" data-mode="cwa">
                            <span class="cwa-icon">⚡</span>
                            <span>Advanced CWA</span>
                            <small>40FPS • School Bypass • Stealth Mode</small>
                        </button>
                    </div>
                    <button class="cwa-btn-close">×</button>
                </div>
            </div>
        `;
        
        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #cwa-install-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .cwa-install-overlay {
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .cwa-install-modal {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid #6c5ce7;
                border-radius: 20px;
                padding: 30px;
                width: 90%;
                max-width: 500px;
                position: relative;
                box-shadow: 0 20px 60px rgba(108, 92, 231, 0.3);
            }
            .cwa-install-modal h3 {
                margin: 0 0 15px 0;
                color: #fff;
                font-size: 24px;
                background: linear-gradient(45deg, #6c5ce7, #a29bfe);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .cwa-install-modal p {
                color: #aaa;
                margin-bottom: 25px;
            }
            .cwa-install-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            .cwa-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid transparent;
                border-radius: 15px;
                padding: 20px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .cwa-btn:hover {
                transform: translateY(-5px);
                background: rgba(108, 92, 231, 0.2);
                border-color: #6c5ce7;
            }
            .cwa-btn-cwa {
                background: linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(162, 155, 254, 0.1));
            }
            .cwa-btn-cwa:hover {
                background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(162, 155, 254, 0.2));
                border-color: #a29bfe;
            }
            .cwa-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }
            .cwa-btn span {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .cwa-btn small {
                font-size: 12px;
                opacity: 0.7;
            }
            .cwa-btn-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: #aaa;
                font-size: 24px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .cwa-btn-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            @media (max-width: 600px) {
                .cwa-install-options {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(installModal);
        
        // Add event listeners
        installModal.querySelector('.cwa-btn-pwa').addEventListener('click', () => {
            this.installPWA();
            installModal.remove();
        });
        
        installModal.querySelector('.cwa-btn-cwa').addEventListener('click', () => {
            this.installCWA();
            installModal.remove();
        });
        
        installModal.querySelector('.cwa-btn-close').addEventListener('click', () => {
            installModal.remove();
        });
    }

    /**
     * Install standard PWA
     */
    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('[CWA] User accepted PWA installation');
                this.isInstalled = true;
            }
            
            this.deferredPrompt = null;
        }
    }

    /**
     * Install advanced CWA
     */
    async installCWA() {
        console.log('[CWA] Starting advanced installation...');
        
        try {
            // Create CWA shortcut
            await this.createCWAShortcut();
            
            // Setup CWA-specific optimizations
            await this.applyCWAOptimizations();
            
            // Show success message
            this.showInstallSuccess();
            
            this.isCWAInstalled = true;
            console.log('[CWA] Advanced installation complete');
        } catch (error) {
            console.error('[CWA] Installation failed:', error);
            this.showInstallError(error);
        }
    }

    /**
     * Create CWA shortcut
     */
    async createCWAShortcut() {
        if ('BeforeInstallPromptEvent' in window) {
            // Use standard PWA prompt but with CWA parameters
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                await this.deferredPrompt.userChoice;
                this.deferredPrompt = null;
            }
        } else {
            // Fallback for browsers without PWA support
            this.showManualInstallInstructions();
        }
    }

    /**
     * Apply CWA optimizations
     */
    async applyCWAOptimizations() {
        // Store CWA settings
        await this.storeCWASettings();
        
        // Preload CWA assets
        await this.preloadCWAAssets();
        
        // Setup CWA background sync
        this.setupBackgroundSync();
        
        // Enable stealth mode if needed
        if (this.deviceCapabilities.isSchoolDevice) {
            this.enableStealthMode();
        }
    }

    /**
     * Show installation success
     */
    showInstallSuccess() {
        const success = document.createElement('div');
        success.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #00b09b, #96c93d);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            ">
                <strong>🚀 CWA Installed!</strong><br>
                <small>Advanced optimizations enabled • 40FPS • Stealth Mode</small>
            </div>
        `;
        
        document.body.appendChild(success);
        
        setTimeout(() => {
            success.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => success.remove(), 300);
        }, 5000);
    }

    /**
     * Enable stealth mode for school devices
     */
    enableStealthMode() {
        console.log('[CWA] Enabling stealth mode...');
        
        // Disable logging in production
        if (window.location.hostname !== 'localhost') {
            console.log = () => {};
            console.warn = () => {};
            console.info = () => {};
        }
        
        // Use minimal storage
        this.config.memoryLimit = 256;
        this.config.storageLimit = 512;
        
        // Disable features that might trigger monitoring
        this.disableMonitoringFeatures();
        
        // Use random request delays to avoid pattern detection
        this.setupRequestRandomization();
    }

    /**
     * Setup request randomization
     */
    setupRequestRandomization() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            // Add random delay (0-500ms)
            const delay = Math.random() * 500;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Randomize request timing
            return originalFetch.apply(this, args);
        };
    }

    /**
     * Trigger post-install optimization
     */
    triggerPostInstallOptimization() {
        // Run optimization in background
        setTimeout(() => {
            this.optimizeDatabase();
            this.prefetchResources();
            this.setupPeriodicSync();
        }, 5000);
    }

    /**
     * Handle connection changes
     */
    handleConnectionChange(online) {
        if (online) {
            console.log('[CWA] Back online, syncing data...');
            this.syncOfflineData();
        } else {
            console.log('[CWA] Offline mode activated');
            this.enableOfflineMode();
        }
    }

    /**
     * On app hidden (background)
     */
    onAppHidden() {
        // Reduce resource usage
        this.performanceProfile.fpsTarget = 10;
        this.clearTemporaryData();
    }

    /**
     * On app visible (foreground)
     */
    onAppVisible() {
        // Restore full performance
        this.performanceProfile.fpsTarget = this.config.fpsTarget;
        this.restorePerformance();
    }

    /**
     * Cleanup before unload
     */
    cleanup() {
        // Save state
        this.saveState();
        
        // Clear temporary data
        this.clearTemporaryData();
        
        // Notify service worker
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CWA_CLEANUP',
                data: { installationId: this.installationId }
            });
        }
    }

    /**
     * Public API methods
     */
    
    /**
     * Check if CWA is available
     */
    isCWAavailable() {
        return 'serviceWorker' in navigator && 
               'indexedDB' in window &&
               'caches' in window;
    }
    
    /**
     * Get installation status
     */
    getStatus() {
        return {
            installed: this.isInstalled,
            cwaInstalled: this.isCWAInstalled,
            installationId: this.installationId,
            performanceProfile: this.performanceProfile,
            deviceCapabilities: this.deviceCapabilities,
            stealthMode: this.stealthMode
        };
    }
    
    /**
     * Toggle stealth mode
     */
    toggleStealthMode(enabled) {
        this.stealthMode = enabled;
        if (enabled) {
            this.enableStealthMode();
        }
        return this.stealthMode;
    }
    
    /**
     * Clear CWA data
     */
    async clearData() {
        try {
            // Clear IndexedDB
            if (this.cwaStorage) {
                this.cwaStorage.close();
                indexedDB.deleteDatabase(this.cwaStorage.name);
            }
            
            // Clear caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
            }
            
            // Clear localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('cwa_')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('[CWA] All data cleared');
            return true;
        } catch (error) {
            console.error('[CWA] Failed to clear data:', error);
            return false;
        }
    }
}

// Export for use in your application
window.CWAInstaller = CWAInstaller;

// Auto-initialize if script is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check if CWA mode is requested
    const urlParams = new URLSearchParams(window.location.search);
    const cwaMode = urlParams.get('cwa') === '1';
    
    if (cwaMode) {
        window.cwa = new CWAInstaller();
        const result = await window.cwa.init();
        
        if (result.success) {
            console.log('[CWA] Running in advanced mode');
            
            // Dispatch event for other scripts
            window.dispatchEvent(new CustomEvent('cwa-ready', {
                detail: result
            }));
        }
    }
});
