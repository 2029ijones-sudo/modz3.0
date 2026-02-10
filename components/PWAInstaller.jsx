'use client';
import { useState, useEffect } from 'react';

export default function PWAInstaller({ addNotification }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = window.navigator.standalone;
      setIsInstalled(isStandalone || isInWebApp);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('🎯 PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Store the event for later use
      window.deferredPrompt = e;
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstallable(false);
      setIsInstalled(true);
      if (addNotification) {
        addNotification('Modz installed successfully! Launch from your app drawer.', 'success');
      }
    };

    // Listen for display mode changes
    const handleDisplayMode = (e) => {
      setIsInstalled(e.matches);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    displayModeMediaQuery.addEventListener('change', handleDisplayMode);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Check install criteria
    const checkInstallCriteria = () => {
      const criteria = [
        'BeforeInstallPromptEvent' in window,
        window.matchMedia('(display-mode: standalone)').matches === false,
        navigator.standalone === false
      ];
      
      const canInstall = criteria.every(c => c === true);
      setIsInstallable(canInstall);
    };

    checkInstallCriteria();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeMediaQuery.removeEventListener('change', handleDisplayMode);
    };
  }, [addNotification]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (addNotification) {
        addNotification('Install feature not available on this browser', 'warning');
      }
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        if (addNotification) {
          addNotification('Installing Modz...', 'success');
        }
      } else {
        if (addNotification) {
          addNotification('Installation cancelled', 'info');
        }
      }
      
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setIsInstallable(false);
      
    } catch (error) {
      console.error('Install error:', error);
      if (addNotification) {
        addNotification('Installation failed. Please try again.', 'error');
      }
    }
  };

  const handleAdvancedInstall = () => {
    // Show advanced installation options
    const advancedOptions = {
      offline: true,
      backgroundSync: true,
      pushNotifications: true,
      fileHandling: true,
      protocolHandling: true
    };

    localStorage.setItem('modz_pwa_config', JSON.stringify(advancedOptions));
    
    if (addNotification) {
      addNotification('Advanced features enabled. Full PWA capabilities activated.', 'success');
    }
  };

  const checkPWAFeatures = () => {
    const features = {
      offline: 'serviceWorker' in navigator,
      install: 'BeforeInstallPromptEvent' in window,
      notifications: 'Notification' in window && 'PushManager' in window,
      backgroundSync: 'SyncManager' in window,
      fileHandling: 'launchQueue' in window && 'files' in window.launchQueue,
      protocolHandling: 'registerProtocolHandler' in navigator,
      storage: 'storage' in navigator && 'estimate' in navigator.storage,
      share: 'share' in navigator,
      clipboard: 'clipboard' in navigator
    };

    console.log('PWA Features:', features);
    return features;
  };

  // Don't show installer if already installed
  if (isInstalled) {
    return null;
  }

  // Only show on supported browsers
  if (!isInstallable) {
    return null;
  }

  return (
    <div className="pwa-installer">
      <div className="installer-card">
        <div className="installer-header">
          <i className="fas fa-rocket"></i>
          <h3>Install Modz App</h3>
          <span className="badge">PWA</span>
        </div>
        
        <div className="installer-features">
          <div className="feature">
            <i className="fas fa-bolt"></i>
            <span>Fast Loading</span>
          </div>
          <div className="feature">
            <i className="fas fa-wifi-slash"></i>
            <span>Offline Mode</span>
          </div>
          <div className="feature">
            <i className="fas fa-desktop"></i>
            <span>Desktop App</span>
          </div>
          <div className="feature">
            <i className="fas fa-bell"></i>
            <span>Notifications</span>
          </div>
        </div>

        <div className="installer-actions">
          <button 
            className="btn btn-primary install-btn"
            onClick={handleInstallClick}
          >
            <i className="fas fa-download"></i>
            Install Modz
          </button>
          
          <button 
            className="btn btn-secondary advanced-btn"
            onClick={handleAdvancedInstall}
          >
            <i className="fas fa-cog"></i>
            Advanced Options
          </button>
          
          <button 
            className="btn btn-text help-btn"
            onClick={() => addNotification('PWA allows installing web apps like native apps', 'info')}
          >
            <i className="fas fa-question-circle"></i>
            What is this?
          </button>
        </div>

        <div className="installer-info">
          <p>
            <i className="fas fa-info-circle"></i>
            Install to launch from desktop, get notifications, and work offline
          </p>
        </div>
      </div>

      <style jsx>{`
        .pwa-installer {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9999;
          animation: slideInUp 0.5s ease-out;
        }
        
        .installer-card {
          background: linear-gradient(135deg, 
            rgba(15, 20, 25, 0.95) 0%,
            rgba(10, 15, 20, 0.9) 100%);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(108, 92, 231, 0.4);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.7),
            0 0 50px rgba(108, 92, 231, 0.3);
          max-width: 400px;
          transform-style: preserve-3d;
        }
        
        .installer-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .installer-header i {
          font-size: 32px;
          color: var(--primary);
          filter: drop-shadow(0 0 10px var(--primary));
        }
        
        .installer-header h3 {
          margin: 0;
          font-size: 22px;
          background: linear-gradient(45deg, var(--secondary), var(--primary-light));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .badge {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .installer-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 25px 0;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--gray-light);
          font-size: 14px;
        }
        
        .feature i {
          color: var(--secondary);
          font-size: 16px;
        }
        
        .installer-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 25px 0;
        }
        
        .install-btn, .advanced-btn, .help-btn {
          width: 100%;
          justify-content: center;
          padding: 15px;
          border-radius: 12px;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .install-btn:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 15px 35px rgba(108, 92, 231, 0.4),
            0 0 40px rgba(108, 92, 231, 0.3);
        }
        
        .advanced-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .advanced-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
        
        .help-btn {
          background: transparent;
          color: var(--gray-light);
          opacity: 0.8;
        }
        
        .installer-info {
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--gray-light);
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .installer-info i {
          color: var(--secondary);
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
