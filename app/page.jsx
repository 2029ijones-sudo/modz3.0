'use client';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';

// ===== QUANTUM INSTALLATION SYSTEM =====
import { quantumInstallation, getQuantumStateSummary } from '~/quantum-installation';

// ===== ENCRYPTION =====
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'quantum-mods-secret-key-2024';
const encryptData = (data) => { /* ... unchanged ... */ };
const decryptData = (encrypted) => { /* ... unchanged ... */ };

// ===== ACCESSIBILITY UTILITIES =====
const announceToScreenReader = (message, priority = 'polite') => { /* ... unchanged ... */ };
const handleKeyboardNavigation = (event, handler) => { /* ... unchanged ... */ };

// ============================================
// ===== VERSIONED IMPORTS – QUANTUM MIXER =====
// ============================================
// ThreeWorlds
const ThreeWorldStable = dynamic(() => import('@/Src/ThreeWorlds'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading-full">🌍 Stable World</div>
});
const ThreeWorldLite = dynamic(() => import('@/Shared/ThreeWorlds.lite'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading-full">⚡ Lite World</div>
});
const ThreeWorldBroken = dynamic(() => import('@/Shared/ThreeWorlds.broken'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading-full">⚠️ Broken World</div>
});

// CodeEditor
const CodeEditorStable = dynamic(() => import('@/CodeEditor'), { ssr: false });
const CodeEditorLite = dynamic(() => import('@/Shared/CodeEditor.lite'), { ssr: false });
const CodeEditorBroken = dynamic(() => import('@/Shared/CodeEditor.broken'), { ssr: false });

// ModManager
const ModManagerStable = dynamic(() => import('@/ModManager'), { ssr: false });
const ModManagerLite = dynamic(() => import('@/Shared/ModManager.lite'), { ssr: false });
const ModManagerBroken = dynamic(() => import('@/Shared/ModManager.broken'), { ssr: false });

// Community
const CommunityStable = dynamic(() => import('@/Community'), { ssr: false });
const CommunityLite = dynamic(() => import('@/Shared/Community.lite'), { ssr: false });
const CommunityBroken = dynamic(() => import('@/Shared/Community.broken'), { ssr: false });

// Profile
const ProfileStable = dynamic(() => import('@/Profile'), { ssr: false });
const ProfileLite = dynamic(() => import('@/Shared/Profile.lite'), { ssr: false });
const ProfileBroken = dynamic(() => import('@/Shared/Profile.broken'), { ssr: false });

// CWAInstaller
const CWAInstallerStable = dynamic(() => import('@/CWAInstaller'), { ssr: false });
const CWAInstallerLite = dynamic(() => import('@/Shared/CWAInstaller.lite'), { ssr: false });
const CWAInstallerBroken = dynamic(() => import('@/Shared/CWAInstaller.broken'), { ssr: false });

// QuantumPWAInstaller
const QuantumPWAInstallerStable = dynamic(() => import('@/PWAInstaller'), { ssr: false });
const QuantumPWAInstallerLite = dynamic(() => import('@/Shared/PWAInstaller.lite'), { ssr: false });
const QuantumPWAInstallerBroken = dynamic(() => import('@/Shared/PWAInstaller.broken'), { ssr: false });

// ===== COMPONENT VERSION MAP =====
const VERSION_MAP = {
  ThreeWorld:   { stable: ThreeWorldStable,   lite: ThreeWorldLite,   broken: ThreeWorldBroken },
  CodeEditor:   { stable: CodeEditorStable,   lite: CodeEditorLite,   broken: CodeEditorBroken },
  ModManager:   { stable: ModManagerStable,   lite: ModManagerLite,   broken: ModManagerBroken },
  Community:    { stable: CommunityStable,    lite: CommunityLite,    broken: CommunityBroken },
  Profile:      { stable: ProfileStable,      lite: ProfileLite,      broken: ProfileBroken },
  CWAInstaller: { stable: CWAInstallerStable, lite: CWAInstallerLite, broken: CWAInstallerBroken },
  QuantumPWAInstaller: { stable: QuantumPWAInstallerStable, lite: QuantumPWAInstallerLite, broken: QuantumPWAInstallerBroken }
};

// ============================================
// ===== APP CONTENT =====
// ============================================
function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ----- TAB SYSTEM -----
  const [activeTab, setActiveTab] = useState('world');
  const [showEditor, setShowEditor] = useState(false);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);

  // ----- QUANTUM STATE -----
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
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particleSystemRef = useRef(null);
  const mainRef = useRef(null);

  // ----- ACCESSIBILITY / PERFORMANCE -----
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState('--');
  const [gpuInfo, setGpuInfo] = useState('--');
  const [performanceLevel, setPerformanceLevel] = useState('high');
  const [showMemoryWarning, setShowMemoryWarning] = useState(false);
  const [detectedMemory, setDetectedMemory] = useState(8);
  const [performanceMode, setPerformanceMode] = useState({
    lowQuality: false,
    disableEffects: false,
    disableAnimations: false,
    reduceParticles: false,
    disableShadows: false,
    simpleRendering: false,
    fpsLimit: 60
  });

  // ========================================
  // ===== QUANTUM VERSION MIXER =====
  // ========================================
  const STORAGE_KEY = 'quantum-component-versions';
  const defaultVersions = {
    ThreeWorld: 'stable',
    CodeEditor: 'stable',
    ModManager: 'stable',
    Community: 'stable',
    Profile: 'stable',
    CWAInstaller: 'stable',
    QuantumPWAInstaller: 'stable'
  };

  const [componentVersions, setComponentVersions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultVersions, ...JSON.parse(saved) };
        } catch (e) {}
      }
    }
    return defaultVersions;
  });

  // Persist version choices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(componentVersions));
    }
  }, [componentVersions]);

  // Helper: get current component based on selected version
  const getComponent = useCallback((componentName) => {
    const version = componentVersions[componentName] || 'stable';
    return VERSION_MAP[componentName]?.[version] || VERSION_MAP[componentName]?.stable;
  }, [componentVersions]);

  // Update single component version
  const setComponentVersion = useCallback((component, version) => {
    setComponentVersions(prev => ({ ...prev, [component]: version }));
    addNotification(`⚛️ ${component} set to ${version}`, 'quantum');
  }, []);

  // ----- EXISTING HOOKS (unchanged) -----
  useEffect(() => { /* accessibility detection */ }, []);
  useEffect(() => { /* keyboard shortcuts – updated with mixer tab */ 
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.altKey && e.key === 'w') { e.preventDefault(); navigateToTab('world'); }
      if (e.altKey && e.key === 'e') { e.preventDefault(); toggleQuantumEditor(); }
      if (e.altKey && e.key === 'c') { e.preventDefault(); navigateToTab('community'); }
      if (e.altKey && e.key === 'p') { e.preventDefault(); setShowProfileOverlay(true); }
      if (e.altKey && e.key === 'i') { e.preventDefault(); navigateToTab('installer'); }
      if (e.altKey && e.key === 'a') { e.preventDefault(); navigateToTab('cwa'); }
      if (e.altKey && e.key === 'm') { e.preventDefault(); navigateToTab('mixer'); } // NEW
      if (e.altKey && e.key === 'n') { e.preventDefault(); handleNewWorld(); }
      if (e.altKey && e.shiftKey && e.key === 'P') { e.preventDefault(); togglePerformanceMode(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, showEditor]);

  // Performance detection, quantum system, etc. (unchanged)
  useEffect(() => { /* performance detection */ }, []);
  const togglePerformanceMode = useCallback(() => { /* ... */ }, []);
  const initializeQuantumSystem = useCallback(() => { /* ... */ }, []);
  const handleQuantumEvent = useCallback(() => { /* ... */ }, []);
  const handleQuantumChaosTrigger = useCallback(() => { /* ... */ }, []);
  const navigateToTab = useCallback((tab) => { /* ... */ }, [worldName]);
  const toggleQuantumEditor = useCallback(() => { /* ... */ }, [showEditor]);
  const addNotification = useCallback((message, type = 'info') => { /* ... */ }, [chaosLevel]);
  const handleThreeWorldReady = useCallback(() => { /* ... */ }, []);
  const handleWebGLError = useCallback((errorMessage) => { /* ... */ }, []);
  const handleModDragStart = useCallback((mod) => { /* ... */ }, []);
  const handleModDropIntoWorld = useCallback((position) => { /* ... */ }, [draggedMod]);
  const handleNewWorld = useCallback(() => { /* ... */ }, []);
  const handleClearWorld = useCallback(() => { /* ... */ }, []);
  const handleImportWorld = useCallback(() => { /* ... */ }, []);
  const handleExportWorld = useCallback(() => { /* ... */ }, []);
  const generateQuantumShareLink = useCallback(() => { /* ... */ }, [activeTab, worldName]);
  const handleShareWorld = useCallback(() => { /* ... */ }, [worldName, generateQuantumShareLink]);
  useEffect(() => { /* PWA install prompt */ }, []);
  useEffect(() => { /* initialization + URL decryption */ }, [searchParams, initializeQuantumSystem]);
  useEffect(() => { /* URL encryption on tab/world change */ }, [activeTab, worldName]);
  const startQuantumVisualization = useCallback(() => { /* ... */ }, [chaosLevel, quantumField, isReducedMotion, performanceMode]);

  // ========================================
  // ===== RENDER FULLSCREEN TAB (VERSION AWARE) =====
  // ========================================
  const renderFullscreenTab = useCallback(() => {
    if (activeTab === 'loading') {
      return (
        <div className="quantum-fullscreen-tab loading-tab">
          <div className="quantum-spinner-cosmic"></div>
          <h2>Reconfiguring Quantum Reality...</h2>
        </div>
      );
    }

    switch (activeTab) {
      case 'world': {
        const ThreeWorldComponent = getComponent('ThreeWorld');
        const CodeEditorComponent = showEditor ? getComponent('CodeEditor') : null;
        const ModManagerComponent = getComponent('ModManager');
        return (
          <div className="quantum-fullscreen-tab world-tab">
            <ThreeWorldComponent
              addNotification={addNotification}
              worldName={worldName}
              onModDrop={handleModDropIntoWorld}
              isDraggingOverWorld={isDraggingOverWorld}
              onReady={handleThreeWorldReady}
              onError={handleWebGLError}
              quantumEffects={{ chaosLevel, realityCoefficient, temporalDisplacement, spatialDistortion, quantumField }}
              reducedMotion={isReducedMotion}
              highContrast={highContrast}
              performanceMode={performanceMode}
            />
            {showEditor && CodeEditorComponent && (
              <div className="quantum-editor-floating">
                <CodeEditorComponent
                  onClose={() => setShowEditor(false)}
                  addNotification={addNotification}
                  quantumState={quantumState}
                  performanceMode={performanceMode}
                />
              </div>
            )}
            <aside className="quantum-mod-sidebar">
              <ModManagerComponent
                addNotification={addNotification}
                onModDragStart={handleModDragStart}
                isWorldReady={isThreeWorldReady && !webGLError}
                quantumEffects={{ chaosLevel, realityCoefficient, quantumField }}
                performanceMode={performanceMode}
              />
            </aside>
          </div>
        );
      }

      case 'community': {
        const CommunityComponent = getComponent('Community');
        return (
          <div className="quantum-fullscreen-tab community-tab">
            <CommunityComponent
              addNotification={addNotification}
              encryptedParams={encryptedParams}
              reducedMotion={isReducedMotion}
              highContrast={highContrast}
              screenReaderMode={screenReaderMode}
              performanceMode={performanceMode}
            />
          </div>
        );
      }

      case 'installer': {
        const QuantumPWAInstallerComponent = getComponent('QuantumPWAInstaller');
        return (
          <div className="quantum-fullscreen-tab installer-tab">
            <div className="installer-grid">
              <QuantumPWAInstallerComponent addNotification={addNotification} />
            </div>
          </div>
        );
      }

      case 'cwa': {
        const CWAInstallerComponent = getComponent('CWAInstaller');
        return (
          <div className="quantum-fullscreen-tab cwa-tab">
            <div className="installer-grid">
              <CWAInstallerComponent addNotification={addNotification} />
            </div>
          </div>
        );
      }

      // ===== NEW: VERSION MIXER TAB =====
      case 'mixer':
        return (
          <div className="quantum-fullscreen-tab mixer-tab">
            <div className="mixer-container">
              <h2 className="mixer-title">🌀 Quantum Version Mixer</h2>
              <p className="mixer-subtitle">
                Choose which reality each component manifests from.<br/>
                Mix stable, lite, and broken versions to generate emergent chaos.
              </p>
              <div className="mixer-grid">
                {Object.keys(VERSION_MAP).map(component => (
                  <div key={component} className="mixer-card">
                    <span className="mixer-component-name">{component}</span>
                    <select
                      className="mixer-select"
                      value={componentVersions[component] || 'stable'}
                      onChange={(e) => setComponentVersion(component, e.target.value)}
                    >
                      <option value="stable">🧬 Stable</option>
                      <option value="lite">⚡ Lite</option>
                      <option value="broken">💥 Broken</option>
                    </select>
                    <div className="mixer-quantum-effect">
                      {componentVersions[component] === 'broken' && '⚠️ Chaos imminent'}
                      {componentVersions[component] === 'lite' && '⚡ Performance mode'}
                      {componentVersions[component] === 'stable' && '🧊 Reality stable'}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="mixer-reset-btn"
                onClick={() => setComponentVersions(defaultVersions)}
              >
                ↺ Reset to Stable Reality
              </button>
            </div>
          </div>
        );

      default:
        const ThreeWorldComponent = getComponent('ThreeWorld');
        return (
          <div className="quantum-fullscreen-tab world-tab">
            <ThreeWorldComponent
              addNotification={addNotification}
              worldName={worldName}
              onReady={handleThreeWorldReady}
              onError={handleWebGLError}
              quantumEffects={{ chaosLevel, realityCoefficient, temporalDisplacement, spatialDistortion, quantumField }}
              reducedMotion={isReducedMotion}
              highContrast={highContrast}
              performanceMode={performanceMode}
            />
          </div>
        );
    }
  }, [
    activeTab, worldName, handleModDropIntoWorld, isDraggingOverWorld,
    handleThreeWorldReady, handleWebGLError, chaosLevel, realityCoefficient,
    temporalDisplacement, spatialDistortion, quantumField, encryptedParams,
    quantumState, isReducedMotion, highContrast, screenReaderMode, performanceMode,
    showEditor, isThreeWorldReady, webGLError, getComponent, componentVersions,
    setComponentVersion
  ]);

  // ========================================
  // ===== RENDER (with added CSS for mixer) =====
  // ========================================
  return (
    <>
      <style jsx global>{`
        /* ---------- EXISTING QUANTUM CSS (unchanged) ---------- */
        :root { /* ... your existing variables ... */ }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        /* ... all existing styles ... */

        /* ---------- NEW: VERSION MIXER STYLES ---------- */
        .mixer-tab {
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
        }
        .mixer-container {
          max-width: 1200px;
          width: 100%;
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--quantum-border);
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          animation: mixerAppear 0.5s ease;
        }
        @keyframes mixerAppear {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .mixer-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #a29bfe, #6c5ce7);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 16px;
          text-align: center;
        }
        .mixer-subtitle {
          color: rgba(255,255,255,0.7);
          text-align: center;
          margin-bottom: 40px;
          font-size: 1.1rem;
        }
        .mixer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .mixer-card {
          background: rgba(20, 30, 50, 0.6);
          border: 1px solid var(--quantum-border);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        .mixer-card:hover {
          border-color: var(--quantum-primary);
          box-shadow: 0 0 30px rgba(108,92,231,0.2);
          transform: translateY(-2px);
        }
        .mixer-component-name {
          display: block;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: white;
          text-shadow: 0 0 10px rgba(108,92,231,0.3);
        }
        .mixer-select {
          width: 100%;
          padding: 12px 16px;
          background: rgba(10, 15, 30, 0.8);
          border: 1px solid var(--quantum-border);
          border-radius: 40px;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
          margin-bottom: 12px;
        }
        .mixer-select:hover {
          border-color: var(--quantum-secondary);
          background: rgba(30, 40, 70, 0.8);
        }
        .mixer-quantum-effect {
          font-size: 0.9rem;
          color: var(--quantum-secondary);
          opacity: 0.9;
          padding-top: 8px;
          border-top: 1px dashed rgba(162,155,254,0.3);
        }
        .mixer-reset-btn {
          background: linear-gradient(135deg, #fd79a8, #e84393);
          border: none;
          padding: 16px 32px;
          border-radius: 50px;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          display: block;
          margin: 0 auto;
          transition: all 0.3s;
          box-shadow: 0 0 30px rgba(253,121,168,0.3);
        }
        .mixer-reset-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 50px rgba(253,121,168,0.6);
        }
      `}</style>

      <div className="quantum-app-container" ref={mainRef}>
        {/* Skip link & announcer */}
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <div id="quantum-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>

        {/* Quantum background canvas */}
        <canvas ref={canvasRef} className="quantum-background-canvas" aria-hidden="true" />

        {/* HEADER */}
        <header className="quantum-header" role="banner">
          <div className="quantum-logo"> {/* ... unchanged ... */} </div>
          <nav className="quantum-nav-links" aria-label="Quantum dimensions">
            <button className={`quantum-nav-link ${activeTab === 'world' ? 'active' : ''}`} onClick={() => navigateToTab('world')}><i className="fas fa-globe-americas" /> World</button>
            <button className={`quantum-nav-link ${activeTab === 'community' ? 'active' : ''}`} onClick={() => navigateToTab('community')}><i className="fas fa-share-alt" /> Community</button>
            <button className={`quantum-nav-link ${activeTab === 'installer' ? 'active' : ''}`} onClick={() => navigateToTab('installer')}><i className="fas fa-download" /> Installer</button>
            <button className={`quantum-nav-link ${activeTab === 'cwa' ? 'active' : ''}`} onClick={() => navigateToTab('cwa')}><i className="fas fa-bolt" /> CWA</button>
            {/* NEW MIXER TAB */}
            <button className={`quantum-nav-link ${activeTab === 'mixer' ? 'active' : ''}`} onClick={() => navigateToTab('mixer')}><i className="fas fa-sliders-h" /> Mixer</button>
            <button className="quantum-nav-link" onClick={toggleQuantumEditor} aria-pressed={showEditor}><i className="fas fa-atom" /> Editor</button>
          </nav>
          <div className="quantum-user-section"> {/* ... unchanged ... */} </div>
        </header>

        {/* MAIN CONTENT */}
        <main id="main-content" className="quantum-main-content" style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {renderFullscreenTab()}
        </main>

        {/* PROFILE OVERLAY */}
        {showProfileOverlay && (
          <div className="profile-overlay-global">
            <ProfileComponent
              addNotification={addNotification}
              quantumState={quantumState}
              reducedMotion={isReducedMotion}
              highContrast={highContrast}
              performanceMode={performanceMode}
              onClose={() => setShowProfileOverlay(false)}
            />
          </div>
        )}

        {/* STATUS BAR */}
        <div className="quantum-status-bar"> {/* ... unchanged ... */} </div>

        {/* NOTIFICATIONS */}
        <div className="quantum-notification-container"> {/* ... unchanged ... */} </div>

        {/* QUANTUM INSTALLERS (if not dismissed) */}
        {showQuantumInstaller && (
          <>
            <CWAInstallerComponent addNotification={addNotification} />
            <QuantumPWAInstallerComponent addNotification={addNotification} />
          </>
        )}
      </div>
    </>
  );
}

// ============================================
// ===== EXPORT WITH SUSPENSE =====
// ============================================
export default function Home() {
  return (
    <Suspense fallback={ /* ... unchanged ... */ }>
      <AppContent />
    </Suspense>
  );
}
