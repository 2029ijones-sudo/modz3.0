'use client';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';
import './globals.css';

// Use your alias structure for imports
const ThreeWorld = dynamic(() => import('@/ThreeWorld'), { 
  ssr: false,
  loading: () => (
    <div className="quantum-loading">
      <div className="quantum-spinner">
        <div className="quantum-particle"></div>
        <div className="quantum-particle"></div>
        <div className="quantum-particle"></div>
      </div>
      <p>Initializing Quantum Reality...</p>
    </div>
  )
});

const CodeEditor = dynamic(() => import('@/CodeEditor'), { ssr: false });
const ModManager = dynamic(() => import('@/ModManager'), { ssr: false });
const Community = dynamic(() => import('@/Community'), { ssr: false });
const Profile = dynamic(() => import('@/Profile'), { ssr: false });

// Quantum Installation System
import { quantumInstallation, getQuantumStateSummary } from '~/quantum-installation';

// Encryption key
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'quantum-mods-secret-key-2024';

// Function to encrypt URL parameters
const encryptData = (data) => {
  try {
    const quantumEntropy = quantumInstallation.quantumState?.quantumSignature || Math.random().toString(36);
    const enhancedKey = CryptoJS.SHA256(ENCRYPTION_KEY + quantumEntropy).toString();
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), enhancedKey).toString();
    return encodeURIComponent(encrypted);
  } catch (error) {
    console.error('Quantum encryption error:', error);
    return null;
  }
};

// Function to decrypt URL parameters
const decryptData = (encrypted) => {
  try {
    const quantumEntropy = quantumInstallation.quantumState?.quantumSignature || Math.random().toString(36);
    const enhancedKey = CryptoJS.SHA256(ENCRYPTION_KEY + quantumEntropy).toString();
    const decrypted = CryptoJS.AES.decrypt(decodeURIComponent(encrypted), enhancedKey);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Quantum decryption error:', error);
    return null;
  }
};

// Main component wrapper
function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('world');
  const [showEditor, setShowEditor] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [worldName, setWorldName] = useState('Quantum Metaverse');
  const [encryptedParams, setEncryptedParams] = useState({});
  const [showQuantumInstaller, setShowQuantumInstaller] = useState(true);
  const [draggedMod, setDraggedMod] = useState(null);
  const [isDraggingOverWorld, setIsDraggingOverWorld] = useState(false);
  const [webGLError, setWebGLError] = useState(null);
  const [isThreeWorldReady, setIsThreeWorldReady] = useState(false);
  const [quantumState, setQuantumState] = useState(null);
  const [chaosLevel, setChaosLevel] = useState(0);
  const [realityCoefficient, setRealityCoefficient] = useState(1.0);
  const [temporalDisplacement, setTemporalDisplacement] = useState(0);
  const [spatialDistortion, setSpatialDistortion] = useState(1.0);
  const [quantumField, setQuantumField] = useState(0);
  const [quantumEffects, setQuantumEffects] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [cwaInstaller, setCWAInstaller] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particleSystemRef = useRef(null);

  // ========== TAB NAVIGATION ==========
  const navigateToTab = (tab) => {
    console.log(`🔘 Switching to tab: ${tab}`);
    setActiveTab(tab);
    setWebGLError(null);
    
    // Add quantum notification
    addNotification(`Quantum reality shifted to ${tab} dimension`, 'quantum');
    
    // Trigger quantum event
    if (quantumInstallation) {
      quantumInstallation.triggerQuantumEvent('TAB_CHANGE', {
        tab: tab,
        timestamp: Date.now()
      });
    }
  };

  // ========== NOTIFICATIONS ==========
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const quantumType = type === 'info' ? 'quantum' : type;
    
    setNotifications(prev => [...prev, { 
      id, 
      message, 
      type: quantumType,
      timestamp: Date.now(),
      chaosLevel: chaosLevel 
    }]);
    
    // Trigger quantum notification event
    if (quantumInstallation) {
      quantumInstallation.triggerQuantumEvent('NOTIFICATION_ADDED', {
        message,
        type: quantumType,
        timestamp: Date.now()
      });
    }
    
    // Auto-remove notification
    const decayTime = 3000 * (1 + chaosLevel / 100);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, decayTime);
  };

  // ========== WORLD FUNCTIONS ==========
  const toggleQuantumEditor = () => {
    setShowEditor(!showEditor);
    if (!showEditor) {
      addNotification('Quantum code editor activated. Reality manipulation enabled.', 'info');
    }
  };

  const handleThreeWorldReady = useCallback(() => {
    setIsThreeWorldReady(true);
    addNotification('Quantum Reality Field stabilized. 3D World ready!', 'success');
  }, []);

  const handleWebGLError = useCallback((errorMessage) => {
    setWebGLError(errorMessage);
    addNotification(`Quantum Rendering Error: ${errorMessage}`, 'error');
  }, []);

  const handleModDragStart = (mod) => {
    setDraggedMod(mod);
    addNotification(`Quantum entanglement established with ${mod.name}`, 'info');
  };

  const handleModDropIntoWorld = useCallback((position) => {
    if (draggedMod) {
      window.dispatchEvent(new CustomEvent('add-mod-to-world', {
        detail: {
          mod: draggedMod,
          position: position,
          quantumEffects: {
            chaosLevel: chaosLevel,
            realityCoefficient: realityCoefficient,
            quantumField: quantumField
          }
        }
      }));
      
      addNotification(`Quantum manifestation: ${draggedMod.name} materialized in reality`, 'success');
      setDraggedMod(null);
    }
  }, [draggedMod, chaosLevel, realityCoefficient, quantumField]);

  const handleNewWorld = () => {
    const name = prompt('Enter quantum world name:', `Reality-${Date.now().toString(36)}`);
    if (name) {
      setWorldName(name);
      addNotification(`Quantum world "${name}" created. Reality field initialized.`, 'success');
    }
  };

  const handleClearWorld = () => {
    if (confirm('Collapse quantum superposition? This will clear the entire reality field.')) {
      window.dispatchEvent(new CustomEvent('clear-world'));
      addNotification('Quantum reality field collapsed. World cleared.', 'success');
    }
  };

  const handleImportWorld = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.modz3,.zip,.json,.quantum';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        addNotification(`Quantum import initiated: ${file.name}...`, 'info');
        window.dispatchEvent(new CustomEvent('import-world', { 
          detail: { 
            file: file,
            quantumSignature: quantumInstallation?.quantumState?.quantumSignature 
          } 
        }));
      }
    };
    input.click();
  };

  const handleExportWorld = () => {
    addNotification('Quantum reality export in progress...', 'info');
    window.dispatchEvent(new CustomEvent('export-world', {
      detail: {
        quantumState: getQuantumStateSummary(),
        chaosLevel: chaosLevel
      }
    }));
  };

  const handleShareWorld = () => {
    const shareLink = `${window.location.origin}${window.location.pathname}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      addNotification('Quantum share link copied to clipboard!', 'success');
    }).catch(() => {
      prompt('Quantum Share Link:', shareLink);
    });
  };

  // ========== PWA INSTALLATION ==========
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA installation available');
      addNotification('PWA installation available. Click install button.', 'info');
    };

    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      addNotification('Quantum Reality installed successfully!', 'success');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ========== CWA INSTALLATION ==========
  useEffect(() => {
    const initializeCWA = async () => {
      try {
        // Dynamically import CWA installer
        const { CWAInstaller } = await import('~/cwa-installer');
        const cwa = new CWAInstaller();
        setCWAInstaller(cwa);
        
        // Initialize CWA if CWA mode is requested
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('cwa') === '1') {
          const status = await cwa.init();
          if (status.success) {
            addNotification('CWA Mode Activated. Advanced optimizations enabled.', 'success');
          }
        }
      } catch (error) {
        console.warn('[CWA] Failed to initialize:', error);
      }
    };

    initializeCWA();
  }, []);

  // Handle PWA installation
  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          addNotification('Quantum PWA installation started!', 'success');
        } else {
          addNotification('PWA installation cancelled', 'info');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('PWA installation failed:', error);
        addNotification('PWA installation failed. Please try manual installation.', 'error');
      }
    } else {
      addNotification('Manual PWA installation required. Use browser menu.', 'info');
      showManualInstallInstructions('pwa');
    }
  };

  // Handle CWA installation
  const handleCWAInstall = async () => {
    try {
      // Load CWA installer if not loaded
      if (!cwaInstaller) {
        const { CWAInstaller } = await import('~/cwa-installer');
        const cwa = new CWAInstaller();
        setCWAInstaller(cwa);
      }
      
      addNotification('Starting CWA installation...', 'info');
      
      if (cwaInstaller) {
        const result = await cwaInstaller.installCWA();
        
        if (result.success) {
          addNotification('CWA installed successfully! Advanced features enabled.', 'success');
          
          setTimeout(() => {
            window.location.href = '/?cwa=1';
          }, 2000);
        } else {
          throw new Error(result.error || 'CWA installation failed');
        }
      } else {
        throw new Error('CWA installer not available');
      }
    } catch (error) {
      console.error('CWA installation failed:', error);
      addNotification(`CWA installation failed: ${error.message}`, 'error');
      showManualInstallInstructions('cwa');
    }
  };

  // Show manual installation instructions
  const showManualInstallInstructions = (type) => {
    const instructions = type === 'cwa' 
      ? `
        To install CWA manually:
        1. Click ⋮ (Menu) in your browser
        2. Select "Add to Home Screen" or "Install App"
        3. For school Chromebooks, you may need to:
           - Enable developer mode
           - Use "Add to desktop" instead
           - Visit https://modz3-0.vercel.app/?cwa=1 first
      `
      : `
        To install PWA manually:
        1. Click ⋮ (Menu) in your browser
        2. Look for "Install Modz Quantum" option
        3. Or click "Add to Home Screen"
        4. Some browsers may show an install icon in the address bar
      `;
    
    const modal = document.createElement('div');
    modal.className = 'quantum-instruction-modal';
    modal.innerHTML = `
      <div class="instruction-content">
        <h3>${type === 'cwa' ? '⚡ CWA Installation' : '📱 PWA Installation'}</h3>
        <pre>${instructions}</pre>
        <div class="instruction-actions">
          <button class="btn-instruction-close">Close</button>
          ${type === 'cwa' ? '<button class="btn-instruction-retry">Retry CWA</button>' : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .quantum-instruction-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      }
      .instruction-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid #6c5ce7;
        border-radius: 15px;
        padding: 30px;
        max-width: 500px;
        color: white;
      }
      .instruction-content h3 {
        color: #6c5ce7;
        margin-bottom: 20px;
      }
      .instruction-content pre {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px;
        border-radius: 10px;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .instruction-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .btn-instruction-close, .btn-instruction-retry {
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: bold;
      }
      .btn-instruction-close {
        background: #666;
        color: white;
      }
      .btn-instruction-retry {
        background: #6c5ce7;
        color: white;
      }
    `;
    document.head.appendChild(styles);
    
    // Add event listeners
    modal.querySelector('.btn-instruction-close').addEventListener('click', () => {
      modal.remove();
      styles.remove();
    });
    
    if (type === 'cwa') {
      modal.querySelector('.btn-instruction-retry').addEventListener('click', () => {
        modal.remove();
        styles.remove();
        handleCWAInstall();
      });
    }
  };

  // Dismiss quantum installer
  const dismissQuantumInstaller = () => {
    setShowQuantumInstaller(false);
    localStorage.setItem('quantum_installer_dismissed', 'true');
    addNotification('Quantum installer dismissed.', 'info');
  };

  // ========== QUANTUM SYSTEM INITIALIZATION ==========
  const initializeQuantumSystem = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const state = getQuantumStateSummary();
        setQuantumState(state);
        setChaosLevel(state.chaosLevel);
        setRealityCoefficient(state.realityCoefficient);
        setTemporalDisplacement(state.temporalDisplacement);
        setSpatialDistortion(state.spatialDistortion);
        setQuantumField(state.quantumFieldStrength);

        console.log('🌀 Quantum system initialized');
        
        // Auto-detect if installer should be shown
        if ('serviceWorker' in navigator && 
            !window.matchMedia('(display-mode: standalone)').matches &&
            !localStorage.getItem('quantum_installer_dismissed')) {
          setShowQuantumInstaller(true);
        }
      } catch (error) {
        console.error('Quantum initialization failed:', error);
      }
    }
  }, []);

  // ========== URL PARAMETERS HANDLING ==========
  useEffect(() => {
    const encrypted = searchParams.get('e');
    if (encrypted) {
      const decrypted = decryptData(encrypted);
      if (decrypted) {
        setEncryptedParams(decrypted);
        
        // Handle decrypted parameters
        if (decrypted.tab) {
          setActiveTab(decrypted.tab);
        }
        if (decrypted.world) {
          setWorldName(decrypted.world);
        }
        if (decrypted.showEditor) {
          setShowEditor(true);
        }
        
        if (decrypted.source === 'shared') {
          addNotification(`Loaded quantum-encrypted session from ${decrypted.owner || 'community'}`, 'info');
        }
      }
    }

    // Initialize quantum system
    initializeQuantumSystem();

    // Add welcome notification
    setTimeout(() => {
      addNotification('Welcome to Quantum Modz3.0! Reality coefficient stabilized.', 'info');
    }, 1500);
  }, [searchParams]);

  // ========== RENDER FUNCTIONS ==========
  const renderActiveTab = () => {
    console.log('Rendering tab:', activeTab);
    
    switch (activeTab) {
      case 'world':
        return (
          <ThreeWorld 
            addNotification={addNotification} 
            worldName={worldName}
            onModDrop={handleModDropIntoWorld}
            isDraggingOverWorld={isDraggingOverWorld}
            onReady={handleThreeWorldReady}
            onError={handleWebGLError}
            quantumEffects={{
              chaosLevel,
              realityCoefficient,
              temporalDisplacement,
              spatialDistortion,
              quantumField
            }}
          />
        );
      case 'community':
        return <Community addNotification={addNotification} encryptedParams={encryptedParams} />;
      case 'profile':
        return <Profile addNotification={addNotification} quantumState={quantumState} />;
      default:
        return (
          <ThreeWorld 
            addNotification={addNotification} 
            worldName={worldName}
            onReady={handleThreeWorldReady}
            onError={handleWebGLError}
            quantumEffects={{
              chaosLevel,
              realityCoefficient,
              temporalDisplacement,
              spatialDistortion,
              quantumField
            }}
          />
        );
    }
  };

  // Quantum error fallback
  const renderQuantumErrorFallback = () => (
    <div className="quantum-error-fallback">
      <div className="quantum-error-icon">
        <i className="fas fa-atom fa-spin"></i>
        <div className="quantum-error-rings">
          <div className="ring"></div>
          <div className="ring"></div>
          <div className="ring"></div>
        </div>
      </div>
      <h3>Quantum Reality Unstable</h3>
      <p className="error-message">{webGLError}</p>
      <div className="quantum-error-actions">
        <button 
          className="btn btn-quantum"
          onClick={() => window.location.reload()}
          style={{
            background: `linear-gradient(135deg, var(--quantum-primary), var(--quantum-accent))`
          }}
        >
          <i className="fas fa-redo"></i> Quantum Reboot
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => navigateToTab('community')}
        >
          <i className="fas fa-share-alt"></i> Quantum Community
        </button>
      </div>
    </div>
  );

  return (
    <div className="quantum-app-container" suppressHydrationWarning>
      {/* Quantum Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="quantum-background-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Quantum Header */}
      <header className="quantum-header">
        <div className="quantum-logo">
          <div className="logo-quantum-animation">
            <div className="quantum-logo-orb"></div>
            <div className="quantum-logo-rings">
              <div className="logo-ring"></div>
              <div className="logo-ring"></div>
              <div className="logo-ring"></div>
            </div>
          </div>
          <h1 className="quantum-logo-text">
            <span className="logo-text-modz">Modz</span>
            <span className="logo-text-quantum">Quantum</span>
          </h1>
        </div>
        
        {/* FIXED NAVIGATION - This will work now */}
        <nav className="quantum-nav-links">
          <button 
            className={`quantum-nav-link ${activeTab === 'world' ? 'active' : ''}`}
            onClick={() => navigateToTab('world')}
            data-quantum="world"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-globe-americas"></i>
              <span>Quantum World</span>
              {webGLError && activeTab === 'world' && (
                <span className="quantum-error-badge">
                  <i className="fas fa-radiation"></i>
                </span>
              )}
              {chaosLevel > 50 && (
                <span className="quantum-chaos-indicator" style={{
                  '--chaos': `${chaosLevel}%`
                }}></span>
              )}
            </div>
          </button>
          
          <button 
            className="quantum-nav-link"
            onClick={toggleQuantumEditor}
            data-quantum="editor"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-atom"></i>
              <span>Quantum Editor</span>
            </div>
          </button>
          
          <button 
            className={`quantum-nav-link ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => navigateToTab('community')}
            data-quantum="community"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-share-alt"></i>
              <span>Quantum Community</span>
            </div>
          </button>
          
          <button 
            className={`quantum-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => navigateToTab('profile')}
            data-quantum="profile"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-user-astronaut"></i>
              <span>Quantum Profile</span>
            </div>
          </button>
        </nav>
        
        <div className="quantum-user-section">
          <div className="quantum-world-actions">
            <button className="btn btn-quantum-secondary" onClick={handleImportWorld}>
              <i className="fas fa-folder-open"></i>
              <span>Quantum Import</span>
            </button>
            <button className="btn btn-quantum-primary" onClick={handleExportWorld}>
              <i className="fas fa-download"></i>
              <span>Quantum Export</span>
            </button>
            <button className="btn btn-quantum-accent" onClick={handleShareWorld}>
              <i className="fas fa-share"></i>
              <span>Quantum Share</span>
            </button>
          </div>
          <div className="quantum-avatar-container">
            <div className="quantum-avatar-glow"></div>
            <div className="quantum-avatar-halo"></div>
            <div className="quantum-avatar-3d" title="Quantum Profile" onClick={() => navigateToTab('profile')}>
              <div className="avatar-quantum-core"></div>
              <i className="fas fa-robot"></i>
            </div>
          </div>
        </div>
      </header>

      {/* Quantum Main Container */}
      <div className="quantum-main-container">
        {/* Quantum Sidebar */}
        {activeTab === 'world' && (
          <div className="quantum-sidebar">
            <div className="quantum-sidebar-header">
              <h3>Quantum Mod Manager</h3>
              <div className="quantum-sidebar-stats">
                <div className="stat">
                  <span className="stat-label">Reality</span>
                  <span className="stat-value">{realityCoefficient.toFixed(2)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Chaos</span>
                  <span className="stat-value">{Math.round(chaosLevel)}%</span>
                </div>
              </div>
            </div>
            <ModManager 
              addNotification={addNotification} 
              onModDragStart={handleModDragStart}
              isWorldReady={isThreeWorldReady && !webGLError}
              quantumEffects={{
                chaosLevel,
                realityCoefficient,
                quantumField
              }}
            />
          </div>
        )}

        {/* Quantum Content Area */}
        <div className={`quantum-content-area ${activeTab !== 'world' ? 'quantum-full-width' : ''}`}>
          {activeTab === 'world' ? (
            <>
              <div className="quantum-world-wrapper">
                <div className="quantum-world-header">
                  <h2 className="quantum-world-title">
                    <span className="world-name">Quantum Reality: {worldName}</span>
                    {encryptedParams.source === 'shared' && (
                      <span className="quantum-shared-badge">
                        <i className="fas fa-lock"></i> Quantum Encrypted
                      </span>
                    )}
                    {webGLError && (
                      <span className="quantum-error-badge-global">
                        <i className="fas fa-radiation"></i> Reality Unstable
                      </span>
                    )}
                  </h2>
                  <div className="quantum-world-actions">
                    <button className="btn btn-quantum-secondary" onClick={() => addNotification('Quantum Grid Manipulation - Coming soon', 'info')}>
                      <i className="fas fa-th"></i>
                      <span>Quantum Grid</span>
                    </button>
                    <button className="btn btn-quantum-danger" onClick={handleClearWorld}>
                      <i className="fas fa-trash"></i>
                      <span>Collapse Reality</span>
                    </button>
                    <button className="btn btn-quantum-success" onClick={handleNewWorld}>
                      <i className="fas fa-plus"></i>
                      <span>New Reality</span>
                    </button>
                  </div>
                </div>

                <div className="quantum-world-overlay"></div>
                {webGLError ? renderQuantumErrorFallback() : renderActiveTab()}
              </div>

              {/* Quantum Code Editor */}
              {showEditor && (
                <div className="quantum-editor-panel active">
                  <CodeEditor 
                    onClose={() => setShowEditor(false)}
                    addNotification={addNotification}
                    quantumMode={true}
                    quantumState={quantumState}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={`quantum-tab-content ${activeTab}-tab`}>
              <div className="quantum-tab-header">
                <h2>
                  {activeTab === 'community' && 'Quantum Community Hub'}
                  {activeTab === 'profile' && 'Quantum Reality Profile'}
                </h2>
              </div>
              <div className="quantum-tab-inner">
                {renderActiveTab()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quantum Installer Modal */}
      {showQuantumInstaller && (
        <div className="quantum-installer-modal">
          <div className="quantum-installer-content">
            <div className="installer-header">
              <div className="installer-quantum-icon">
                <i className="fas fa-atom fa-spin"></i>
              </div>
              <h2>🚀 Install Modz Quantum</h2>
              <p>Choose your installation method:</p>
              <button 
                className="installer-close-btn"
                onClick={dismissQuantumInstaller}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="installer-options">
              {/* PWA Option */}
              <div className="installer-option installer-option-pwa">
                <div className="option-icon">
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <div className="option-content">
                  <h3>Standard PWA</h3>
                  <p>Basic Progressive Web App installation</p>
                  <div className="option-features">
                    <span><i className="fas fa-check"></i> Works everywhere</span>
                    <span><i className="fas fa-check"></i> Offline support</span>
                    <span><i className="fas fa-check"></i> Auto-updates</span>
                  </div>
                  {deferredPrompt && (
                    <div className="option-available">
                      <i className="fas fa-bell"></i> Installation available
                    </div>
                  )}
                </div>
                <button 
                  className="option-btn btn-pwa"
                  onClick={handlePWAInstall}
                  disabled={!deferredPrompt}
                >
                  {deferredPrompt ? 'Install PWA Now' : 'Manual Install'}
                </button>
              </div>
              
              {/* CWA Option */}
              <div className="installer-option installer-option-cwa">
                <div className="option-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <div className="option-content">
                  <h3>Advanced CWA <span className="cwa-badge">⚡ NEW</span></h3>
                  <p>ChromeBook Web App with advanced optimizations</p>
                  <div className="option-features">
                    <span><i className="fas fa-check"></i> 40FPS Performance</span>
                    <span><i className="fas fa-check"></i> School Bypass</span>
                    <span><i className="fas fa-check"></i> Stealth Mode</span>
                    <span><i className="fas fa-check"></i> Memory Optimized</span>
                  </div>
                </div>
                <button 
                  className="option-btn btn-cwa"
                  onClick={handleCWAInstall}
                >
                  Install CWA
                </button>
              </div>
            </div>
            
            <div className="installer-footer">
              <p className="installer-tip">
                <i className="fas fa-lightbulb"></i> 
                <strong>Tip:</strong> CWA is recommended for school Chromebooks & better performance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quantum Notifications */}
      <div className="quantum-notification-container">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`quantum-notification show ${notification.type}`}
          >
            <div className="quantum-notification-header">
              <div className="notification-quantum-icon">
                <i className={`fas fa-${
                  notification.type === 'success' ? 'atom' :
                  notification.type === 'error' ? 'radiation' :
                  notification.type === 'warning' ? 'exclamation-triangle' : 
                  notification.type === 'quantum' ? 'bolt' : 'info-circle'
                }`}></i>
              </div>
              <div className="quantum-notification-title">
                {notification.type === 'quantum' ? 'Quantum Event' : 
                 notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              </div>
            </div>
            <div className="quantum-notification-message">{notification.message}</div>
          </div>
        ))}
      </div>

      {/* Quantum Dragging Indicator */}
      {draggedMod && (
        <div className="quantum-dragging-indicator">
          <div className="quantum-dragging-icon">
            <i className="fas fa-atom fa-spin"></i>
          </div>
          <div className="quantum-dragging-text">
            <div className="dragging-title">Quantum Entanglement Active</div>
            <div className="dragging-mod">{draggedMod.name}</div>
          </div>
        </div>
      )}

      {/* Quantum Status Bar */}
      <div className="quantum-status-bar">
        <div className="status-items">
          <div className="status-item">
            <div className="status-icon">
              <i className="fas fa-atom"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Quantum Field</div>
              <div className="status-value">{Math.round(quantumField * 100)}%</div>
            </div>
          </div>
          <div className="status-item">
            <div className="status-icon">
              <i className="fas fa-fire"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Chaos Level</div>
              <div className="status-value">{Math.round(chaosLevel)}%</div>
            </div>
          </div>
          <div className="status-item">
            <div className="status-icon">
              <i className="fas fa-globe-americas"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Reality Coeff</div>
              <div className="status-value">{realityCoefficient.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="status-actions">
          <button className="btn btn-quantum-small" onClick={() => setShowQuantumInstaller(true)}>
            <i className="fas fa-download"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={
      <div className="quantum-loading-screen">
        <div className="quantum-loading-animation">
          <div className="quantum-loading-orb"></div>
          <div className="quantum-loading-rings">
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="ring"></div>
          </div>
        </div>
        <p className="quantum-loading-text">Initializing Quantum Reality Field...</p>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
