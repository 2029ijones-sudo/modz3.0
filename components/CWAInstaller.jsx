import { useState, useEffect } from 'react';
import './CWAInstaller.css';

export default function CWAInstaller() {
  const [showModal, setShowModal] = useState(false);
  const [cwaStatus, setCWAStatus] = useState(null);
  const [isSchoolDevice, setIsSchoolDevice] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);

  // Initialize CWA detection
  useEffect(() => {
    detectDevice();
    checkCWAStatus();
  }, []);

  const detectDevice = () => {
    const ua = navigator.userAgent.toLowerCase();
    const isChromeOS = ua.includes('cros');
    const isManaged = navigator.managed !== undefined;
    const hasRestrictions = document.featurePolicy && 
      !document.featurePolicy.allowsFeature('camera');
    
    setIsSchoolDevice(isChromeOS && (isManaged || hasRestrictions));
  };

  const checkCWAStatus = async () => {
    // Check if CWA is already installed
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const hasCWA = registrations.some(reg => 
        reg.active?.scriptURL.includes('cwa') || 
        localStorage.getItem('cwa_installed')
      );
      
      setCWAStatus({
        installed: hasCWA,
        canInstall: true
      });
    }
  };

  const showCWAPrompt = () => {
    setShowModal(true);
    // Trigger analytics
    console.log('[CWA] User requested CWA installation');
  };

  const installCWA = async () => {
    try {
      console.log('[CWA] Starting CWA installation...');
      
      // 1. Create custom installation
      await createCWAShortcut();
      
      // 2. Enable CWA features
      enableCWAFeatures();
      
      // 3. Store CWA status
      localStorage.setItem('cwa_installed', 'true');
      localStorage.setItem('cwa_install_date', new Date().toISOString());
      
      // 4. Show success
      setCWAStatus({ installed: true, canInstall: false });
      setShowModal(false);
      
      alert('🚀 CWA Installed Successfully!\nAdvanced features enabled.');
      
    } catch (error) {
      console.error('[CWA] Installation failed:', error);
      alert('Installation failed. Please try standard PWA method.');
    }
  };

  const createCWAShortcut = () => {
    return new Promise((resolve) => {
      // Create a CWA-specific bookmark/favorite
      if (window.navigator.share) {
        window.navigator.share({
          title: 'Modz Quantum CWA',
          text: 'Install Modz Quantum with CWA (Advanced Mode)',
          url: window.location.origin + '/?cwa=1&install=1'
        }).then(() => resolve());
      } else {
        // Fallback: Show instructions
        const instructions = `
          To install CWA:
          1. Click ⋮ (Menu) → "Add to Home Screen"
          2. Or use Ctrl+D to bookmark
          3. Open from home screen/bookmarks
          
          CWA will automatically enable when launched.
        `;
        alert(instructions);
        resolve();
      }
    });
  };

  const enableCWAFeatures = () => {
    // Set CWA flags
    localStorage.setItem('cwa_mode', 'enabled');
    localStorage.setItem('cwa_performance', 'adaptive');
    localStorage.setItem('cwa_fps_target', '40');
    localStorage.setItem('cwa_stealth', isSchoolDevice ? 'true' : 'false');
    
    // Trigger service worker registration for CWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-cwa.js')
        .then(reg => console.log('[CWA] Service Worker registered'))
        .catch(err => console.warn('[CWA] SW registration failed:', err));
    }
  };

  const detectCapabilities = () => {
    const capabilities = {
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 50) + '...',
      isSchoolDevice
    };
    setDeviceCapabilities(capabilities);
    return capabilities;
  };

  return (
    <div className="cwa-installer">
      {/* CWA Install Button - Always Visible */}
      <button 
        className="cwa-install-button"
        onClick={showCWAPrompt}
        disabled={cwaStatus?.installed}
      >
        <span className="cwa-icon">⚡</span>
        <span className="cwa-text">
          {cwaStatus?.installed ? 'CWA Installed' : 'Install CWA'}
        </span>
        <span className="cwa-badge">ADVANCED</span>
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
              <p>Advanced Web App with school bypass & 40FPS optimization</p>
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

            <div className="cwa-modal-buttons">
              <button 
                className="cwa-btn cwa-btn-primary"
                onClick={installCWA}
              >
                <span className="btn-icon">📱</span>
                Install CWA Now
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
                Standard PWA Instead
              </button>
            </div>

            <div className="cwa-footer">
              <p>
                <small>
                  CWA runs in your browser but behaves like a native app.
                  Uses existing PWA infrastructure with custom optimizations.
                </small>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
