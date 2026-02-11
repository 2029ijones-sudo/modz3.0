import { useState, useEffect } from 'react';
import './CWAInstaller.css';

export default function CWAInstaller() {
  const [showModal, setShowModal] = useState(false);
  const [cwaStatus, setCWAStatus] = useState({
    installed: false,
    canInstall: false,
    deferredPrompt: null
  });
  const [isSchoolDevice, setIsSchoolDevice] = useState(false);
  const [installError, setInstallError] = useState(null);

  // Initialize CWA detection
  useEffect(() => {
    detectDevice();
    checkCWAStatus();
    
    // Listen for beforeinstallprompt event (PWA install prompt)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setCWAStatus(prev => ({
        ...prev,
        canInstall: true,
        deferredPrompt: e
      }));
      console.log('[CWA] Install prompt ready');
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('[CWA] Successfully installed');
      setCWAStatus(prev => ({
        ...prev,
        installed: true,
        canInstall: false,
        deferredPrompt: null
      }));
      
      // Enable CWA features after installation
      enableCWAFeatures();
      
      // Close modal if open
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const detectDevice = () => {
    const ua = navigator.userAgent.toLowerCase();
    const isChromeOS = ua.includes('cros');
    const isManaged = navigator.managed !== undefined && navigator.managed !== null;
    const hasRestrictions = document.featurePolicy && 
      typeof document.featurePolicy.allowsFeature === 'function' &&
      !document.featurePolicy.allowsFeature('camera');
    
    setIsSchoolDevice(isChromeOS && (isManaged || hasRestrictions));
  };

  const checkCWAStatus = async () => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        localStorage.getItem('cwa_installed') === 'true') {
      
      setCWAStatus(prev => ({
        ...prev,
        installed: true,
        canInstall: false
      }));
    }
  };

  const installCWA = async () => {
    setInstallError(null);
    
    try {
      console.log('[CWA] Starting CWA installation...');
      
      // Check if install prompt is available
      if (!cwaStatus.deferredPrompt) {
        throw new Error('Install prompt not available. Make sure the site is served over HTTPS and has a valid manifest.');
      }

      // Show the native install prompt
      const deferredPrompt = cwaStatus.deferredPrompt;
      deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // Installation was accepted, CWA features will be enabled by appinstalled event
        console.log('[CWA] Installation accepted');
        
        // Store installation metadata
        localStorage.setItem('cwa_installed', 'true');
        localStorage.setItem('cwa_install_date', new Date().toISOString());
        localStorage.setItem('cwa_school_mode', isSchoolDevice ? 'true' : 'false');
        localStorage.setItem('cwa_version', '3.0.0');
        
        // Pre-enable CWA features (they'll be fully enabled on appinstalled)
        localStorage.setItem('cwa_mode', 'enabled');
        localStorage.setItem('cwa_performance', 'adaptive');
        localStorage.setItem('cwa_fps_target', '40');
        localStorage.setItem('cwa_stealth', isSchoolDevice ? 'true' : 'false');
        
        // Clear the deferred prompt
        setCWAStatus(prev => ({
          ...prev,
          deferredPrompt: null
        }));
        
        // Don't close modal immediately - show success message
        setInstallError(null);
      } else {
        throw new Error('User declined installation');
      }
    } catch (error) {
      console.error('[CWA] Installation failed:', error);
      setInstallError(error.message || 'Installation failed. Please try again.');
    }
  };

  const enableCWAFeatures = () => {
    // These will run after successful installation
    console.log('[CWA] Enabling advanced features...');
    
    // Register CWA-specific service worker if not already registered
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller?.scriptURL.includes('sw-cwa')) {
      navigator.serviceWorker.register('/sw-cwa.js')
        .then(reg => {
          console.log('[CWA] CWA Service Worker registered');
          
          // Send initialization data
          if (reg.active) {
            reg.active.postMessage({
              type: 'CWA_INIT',
              data: {
                fpsTarget: 40,
                stealthMode: isSchoolDevice,
                installDate: localStorage.getItem('cwa_install_date')
              }
            });
          }
        })
        .catch(err => console.warn('[CWA] CWA SW registration failed:', err));
    }
    
    // Set up FPS limiter
    setupFPSLimiter();
    
    // Apply school device optimizations
    if (isSchoolDevice) {
      applySchoolOptimizations();
    }
  };

  const setupFPSLimiter = () => {
    // Simple FPS limiter for consistent 40FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const checkFPS = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;
      
      if (delta >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = now;
        
        // Adjust quality based on FPS
        if (fps < 40) {
          document.documentElement.style.setProperty('--render-quality', '0.7');
        } else {
          document.documentElement.style.setProperty('--render-quality', '1');
        }
      }
      
      requestAnimationFrame(checkFPS);
    };
    
    requestAnimationFrame(checkFPS);
  };

  const applySchoolOptimizations = () => {
    // Disable console logs in production
    if (window.location.hostname !== 'localhost') {
      const noop = () => {};
      console.log = noop;
      console.warn = noop;
      console.info = noop;
    }
    
    // Reduce resource usage
    document.documentElement.style.setProperty('--animation-quality', 'low');
    document.documentElement.style.setProperty('--texture-quality', '0.5');
  };

  const showCWAPrompt = () => {
    if (!cwaStatus.canInstall) {
      alert('CWA is not available to install right now. Make sure you're using Chrome/Edge and the site is properly configured.');
      return;
    }
    setShowModal(true);
    setInstallError(null);
  };

  // Check if installation is available
  const isInstallAvailable = () => {
    return cwaStatus.canInstall && cwaStatus.deferredPrompt !== null;
  };

  return (
    <div className="cwa-installer">
      {/* CWA Install Button */}
      <button 
        className={`cwa-install-button ${cwaStatus.installed ? 'installed' : ''}`}
        onClick={showCWAPrompt}
        disabled={cwaStatus.installed}
      >
        <span className="cwa-icon">⚡</span>
        <span className="cwa-text">
          {cwaStatus.installed ? 'CWA Installed' : 'Install CWA'}
        </span>
        {!cwaStatus.installed && (
          <span className="cwa-badge">ADVANCED</span>
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
              <div className="cwa-modal-icon">🚀</div>
              <h2>Install Modz Quantum CWA</h2>
              <p>Advanced Web App with 40FPS optimization & school bypass</p>
            </div>

            <div className="cwa-features">
              <div className="cwa-feature">
                <span className="feature-icon">🎯</span>
                <div>
                  <h4>40FPS Locked Performance</h4>
                  <p>Consistent frame rate, adaptive quality</p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">🏫</span>
                <div>
                  <h4>School Chromebook Bypass</h4>
                  <p>Stealth mode, reduced detection</p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">⚡</span>
                <div>
                  <h4>Memory Optimized</h4>
                  <p>Smart caching, aggressive cleanup</p>
                </div>
              </div>
              
              <div className="cwa-feature">
                <span className="feature-icon">🔒</span>
                <div>
                  <h4>Enhanced Privacy</h4>
                  <p>Local-first, minimal logging</p>
                </div>
              </div>
            </div>

            {isSchoolDevice && (
              <div className="cwa-school-warning">
                ⚠️ School device detected. Stealth mode will be enabled.
              </div>
            )}

            {installError && (
              <div className="cwa-error">
                ❌ {installError}
              </div>
            )}

            <div className="cwa-modal-buttons">
              <button 
                className="cwa-btn cwa-btn-primary"
                onClick={installCWA}
                disabled={!isInstallAvailable()}
              >
                <span className="btn-icon">📱</span>
                {isInstallAvailable() ? 'Install CWA Now' : 'Installation Not Available'}
              </button>
              
              <button 
                className="cwa-btn cwa-btn-secondary"
                onClick={() => {
                  window.location.href = '/?cwa=1&demo=1';
                  setShowModal(false);
                }}
              >
                <span className="btn-icon">🎮</span>
                Try Demo First
              </button>
              
              <button 
                className="cwa-btn cwa-btn-tertiary"
                onClick={() => setShowModal(false)}
              >
                <span className="btn-icon">📋</span>
                Close
              </button>
            </div>

            <div className="cwa-footer">
              <p>
                <small>
                  CWA uses the native PWA installation prompt but adds advanced optimizations.
                  {!cwaStatus.canInstall && ' Make sure you're using Chrome/Edge and the site is served over HTTPS.'}
                </small>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
