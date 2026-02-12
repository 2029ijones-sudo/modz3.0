'use client';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';

// Dynamically import components with accessibility - ALL TABS NOW FULLSCREEN
const ThreeWorld = dynamic(() => import('@/Src/ThreeWorlds'), { 
  ssr: false,
  loading: () => (
    <div className="quantum-tab-loading-full">
      <div className="quantum-spinner-giant"></div>
      <p>Manifesting Quantum Reality...</p>
    </div>
  )
});

const CodeEditor = dynamic(() => import('@/CodeEditor'), { ssr: false });
const ModManager = dynamic(() => import('@/ModManager'), { ssr: false });
const Community = dynamic(() => import('@/Community'), { ssr: false });

// ✅ IMPORT THE REAL PROFILE COMPONENT
const Profile = dynamic(() => import('@/Profile'), { ssr: false });

// ✅ NEW TABS - using the components you provided
const CWAInstaller = dynamic(() => import('@/CWAInstaller'), { 
  ssr: false,
  loading: () => <div className="quantum-tab-loading">Initializing CWA Protocol...</div>
});

const QuantumPWAInstaller = dynamic(() => import('@/PWAInstaller'), { 
  ssr: false,
  loading: () => <div className="quantum-tab-loading">Quantum Entangling PWA...</div>
});

// Quantum Installation System
import { quantumInstallation, getQuantumStateSummary } from '~/quantum-installation';

// Encryption key
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'quantum-mods-secret-key-2024';

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

// ===== ACCESSIBILITY UTILITIES =====
const announceToScreenReader = (message, priority = 'polite') => {
  if (typeof window === 'undefined') return;
  const announcer = document.getElementById('quantum-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    setTimeout(() => announcer.textContent = '', 3000);
  }
};

const handleKeyboardNavigation = (event, handler) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handler();
  }
};

function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ===== FULLSCREEN TAB SYSTEM =====
  const [activeTab, setActiveTab] = useState('world');
  const [showEditor, setShowEditor] = useState(false);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false); // Profile overlay state
  
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
  const mainRef = useRef(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  // Performance state
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

  // ========== ACCESSIBILITY DETECTION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(reducedMotionQuery.matches);
    const handleReducedMotionChange = (e) => setIsReducedMotion(e.matches);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(highContrastQuery.matches);
    const handleHighContrastChange = (e) => setHighContrast(e.matches);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // ========== KEYBOARD SHORTCUTS ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.altKey && e.key === 'w') { e.preventDefault(); navigateToTab('world'); }
      if (e.altKey && e.key === 'e') { e.preventDefault(); toggleQuantumEditor(); }
      if (e.altKey && e.key === 'c') { e.preventDefault(); navigateToTab('community'); }
      if (e.altKey && e.key === 'p') { e.preventDefault(); setShowProfileOverlay(true); } // Profile overlay
      if (e.altKey && e.key === 'i') { e.preventDefault(); navigateToTab('installer'); } // New installer tab
      if (e.altKey && e.key === 'a') { e.preventDefault(); navigateToTab('cwa'); } // New CWA tab
      if (e.altKey && e.key === 'n') { e.preventDefault(); handleNewWorld(); }
      if (e.altKey && e.shiftKey && e.key === 'P') { e.preventDefault(); togglePerformanceMode(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, showEditor]);

  // ========== PERFORMANCE DETECTION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let detectedMemoryValue = 8;
    if (navigator.deviceMemory) detectedMemoryValue = navigator.deviceMemory;
    const cpuCores = navigator.hardwareConcurrency || 4;
    let webglScore = 1;
    let isLowEndGPU = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          setGpuInfo(renderer.length > 20 ? renderer.substring(0, 20) + '...' : renderer);
          webglScore = renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('RTX') || renderer.includes('Intel Iris') ? 2 : 1;
          isLowEndGPU = renderer.includes('Intel') && !renderer.includes('Iris') || renderer.includes('Mali') || renderer.includes('Adreno') || renderer.includes('PowerVR');
        }
      }
    } catch (e) {}
    const performanceScore = (detectedMemoryValue * 0.4) + (cpuCores * 0.3) + (webglScore * 0.3);
    let level = 'high';
    let perfFlags = { lowQuality: false, disableEffects: false, disableAnimations: false, reduceParticles: false, disableShadows: false, simpleRendering: false, fpsLimit: 60 };
    if (performanceScore < 3 || isLowEndGPU || detectedMemoryValue < 2) {
      level = 'extreme';
      perfFlags = { lowQuality: true, disableEffects: true, disableAnimations: true, reduceParticles: true, disableShadows: true, simpleRendering: true, fpsLimit: 30 };
    } else if (performanceScore < 6 || detectedMemoryValue < 4) {
      level = 'low';
      perfFlags = { lowQuality: true, disableEffects: true, disableAnimations: false, reduceParticles: true, disableShadows: true, simpleRendering: false, fpsLimit: 40 };
    } else if (performanceScore < 9 || detectedMemoryValue < 6) {
      level = 'medium';
      perfFlags = { lowQuality: false, disableEffects: false, disableAnimations: false, reduceParticles: true, disableShadows: false, simpleRendering: false, fpsLimit: 50 };
    }
    setPerformanceLevel(level);
    setPerformanceMode(perfFlags);
    
    let frameCount = 0;
    let lastTime = performance.now();
    function updateFPS() {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        const fpsValue = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(fpsValue);
        frameCount = 0;
        lastTime = currentTime;
        if (fpsValue < 25 && level !== 'extreme') {
          setPerformanceLevel('extreme');
          setPerformanceMode({ lowQuality: true, disableEffects: true, disableAnimations: true, reduceParticles: true, disableShadows: true, simpleRendering: true, fpsLimit: 30 });
        }
      }
      requestAnimationFrame(updateFPS);
    }
    const fpsAnimationId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(fpsAnimationId);
  }, []);

  const togglePerformanceMode = useCallback(() => {
    const body = document.body;
    const isExtreme = body.classList.contains('extreme-performance-mode');
    const isLow = body.classList.contains('low-performance');
    let newMode, newPerfFlags;
    if (isExtreme) {
      body.classList.remove('extreme-performance-mode'); body.classList.add('low-performance');
      newMode = 'Low Performance';
      newPerfFlags = { lowQuality: true, disableEffects: true, disableAnimations: false, reduceParticles: true, disableShadows: true, simpleRendering: false, fpsLimit: 40 };
      setPerformanceLevel('low');
    } else if (isLow) {
      body.classList.remove('low-performance');
      newMode = 'Normal';
      newPerfFlags = { lowQuality: false, disableEffects: false, disableAnimations: false, reduceParticles: false, disableShadows: false, simpleRendering: false, fpsLimit: 60 };
      setPerformanceLevel('high');
    } else {
      body.classList.add('extreme-performance-mode');
      newMode = 'Extreme Performance';
      newPerfFlags = { lowQuality: true, disableEffects: true, disableAnimations: true, reduceParticles: true, disableShadows: true, simpleRendering: true, fpsLimit: 30 };
      setPerformanceLevel('extreme');
    }
    setPerformanceMode(newPerfFlags);
    addNotification(`Performance mode: ${newMode}`, 'info');
  }, []);

  // ========== QUANTUM SYSTEM ==========
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
        if (!isReducedMotion && !performanceMode.disableAnimations) {
          startQuantumVisualization();
        }
      } catch (error) { console.error('Quantum initialization failed:', error); }
    }
  }, [isReducedMotion, performanceMode.disableAnimations]);

  const handleQuantumEvent = useCallback((event) => {
    const { detail } = event;
    switch (event.type) {
      case 'quantum-state-change': setQuantumState(detail.quantumState); break;
      case 'quantum-chaos-trigger': handleQuantumChaosTrigger(detail); break;
      case 'quantum-field-strength-change': setQuantumField(detail.quantumFieldStrength); break;
      case 'quantum-temporal-displacement': setTemporalDisplacement(detail.temporalDisplacement); break;
      case 'quantum-spatial-distortion': setSpatialDistortion(detail.spatialDistortion); break;
      case 'quantum-reality-coefficient-change': setRealityCoefficient(detail.realityCoefficient); break;
      default: const state = getQuantumStateSummary(); setQuantumState(state); setChaosLevel(state.chaosLevel); setQuantumField(state.quantumFieldStrength);
    }
  }, []);

  const handleQuantumChaosTrigger = useCallback((detail) => {
    const { type, intensity = 50 } = detail;
    const effectId = Date.now();
    setQuantumEffects(prev => [...prev, { id: effectId, type, intensity, timestamp: Date.now() }]);
    setTimeout(() => setQuantumEffects(prev => prev.filter(effect => effect.id !== effectId)), 3000);
    addNotification(`Quantum ${type} effect triggered!`, 'info');
  }, []);

  // ========== FULLSCREEN TAB NAVIGATION ==========
  const navigateToTab = useCallback((tab) => {
    console.log(`🌀 Quantum shift to dimension: ${tab}`);
    setActiveTab(tab);
    setWebGLError(null);
    addNotification(`Quantum reality shifted to ${tab} dimension`, 'quantum');
    announceToScreenReader(`Navigated to ${tab} tab`);
    
    // Update URL with encrypted state
    const data = { tab, world: worldName, timestamp: Date.now(), quantumState: getQuantumStateSummary() };
    const encrypted = encryptData(data);
    if (encrypted && typeof window !== 'undefined') {
      window.history.replaceState({}, '', `?e=${encrypted}`);
    }
  }, [worldName]);

  const toggleQuantumEditor = useCallback(() => {
    setShowEditor(!showEditor);
    addNotification(!showEditor ? 'Quantum code editor activated' : 'Quantum editor closed', 'info');
  }, [showEditor]);

  // ========== NOTIFICATIONS ==========
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    const quantumType = type === 'info' ? 'quantum' : type;
    setNotifications(prev => [...prev, { id, message, type: quantumType, timestamp: Date.now(), chaosLevel }]);
    const decayTime = 3000 * (1 + chaosLevel / 100);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), decayTime);
  }, [chaosLevel]);

  // ========== THREE WORLD ==========
  const handleThreeWorldReady = useCallback(() => {
    setIsThreeWorldReady(true);
    addNotification('Quantum Reality Field stabilized. 3D World ready!', 'success');
  }, []);

  const handleWebGLError = useCallback((errorMessage) => {
    setWebGLError(errorMessage);
    addNotification(`Quantum Rendering Error: ${errorMessage}`, 'error');
  }, []);

  // ========== DRAG AND DROP ==========
  const handleModDragStart = useCallback((mod) => {
    setDraggedMod(mod);
    addNotification(`Quantum entanglement established with ${mod.name}`, 'info');
  }, []);

  const handleModDropIntoWorld = useCallback((position) => {
    if (draggedMod) {
      window.dispatchEvent(new CustomEvent('add-mod-to-world', { detail: { mod: draggedMod, position } }));
      addNotification(`Quantum manifestation: ${draggedMod.name} materialized`, 'success');
      setDraggedMod(null);
    }
  }, [draggedMod]);

  // ========== WORLD ACTIONS ==========
  const handleNewWorld = useCallback(() => {
    const name = prompt('Enter quantum world name:', `Reality-${Date.now().toString(36)}`);
    if (name) { setWorldName(name); addNotification(`Quantum world "${name}" created.`, 'success'); }
  }, []);

  const handleClearWorld = useCallback(() => {
    if (confirm('Collapse quantum superposition? This will clear the entire reality field.')) {
      window.dispatchEvent(new CustomEvent('clear-world'));
      addNotification('Quantum reality field collapsed. World cleared.', 'success');
    }
  }, []);

  const handleImportWorld = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.modz3,.zip,.json,.quantum';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) { addNotification(`Quantum import initiated: ${file.name}...`, 'info'); }
    };
    input.click();
  }, []);

  const handleExportWorld = useCallback(() => {
    addNotification('Quantum reality export in progress...', 'info');
    window.dispatchEvent(new CustomEvent('export-world'));
  }, []);

  const generateQuantumShareLink = useCallback(() => {
    const data = { tab: activeTab, world: worldName, timestamp: Date.now(), source: 'quantum_shared', quantumState: getQuantumStateSummary() };
    const encrypted = encryptData(data);
    return encrypted ? `${window.location.origin}${window.location.pathname}?e=${encrypted}` : null;
  }, [activeTab, worldName]);

  const handleShareWorld = useCallback(() => {
    const shareLink = generateQuantumShareLink();
    if (shareLink && navigator.share) {
      navigator.share({ title: `Quantum World: ${worldName}`, url: shareLink }).catch(() => {
        navigator.clipboard.writeText(shareLink);
        addNotification('Quantum share link copied to clipboard!', 'success');
      });
    } else if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      addNotification('Quantum share link copied to clipboard!', 'success');
    }
  }, [worldName, generateQuantumShareLink]);

  // ========== PWA / CWA INSTALLATION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // ========== INITIALIZATION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const announcer = document.createElement('div');
    announcer.id = 'quantum-announcer'; announcer.setAttribute('aria-live', 'polite'); announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute'; announcer.style.width = '1px'; announcer.style.height = '1px'; announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)'; document.body.appendChild(announcer);

    const encrypted = searchParams.get('e');
    if (encrypted) {
      const decrypted = decryptData(encrypted);
      if (decrypted) {
        setEncryptedParams(decrypted);
        if (decrypted.tab) setActiveTab(decrypted.tab);
        if (decrypted.world) setWorldName(decrypted.world);
      }
    }

    initializeQuantumSystem();
    setTimeout(() => addNotification('Welcome to Quantum Modz3.0! Reality coefficient stabilized.', 'info'), 1500);
    return () => { if (announcer) announcer.remove(); };
  }, [searchParams, initializeQuantumSystem]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const data = { tab: activeTab, world: worldName, timestamp: Date.now(), quantumState: getQuantumStateSummary() };
    const encrypted = encryptData(data);
    if (encrypted) window.history.replaceState({}, '', `?e=${encrypted}`);
  }, [activeTab, worldName]);

  // ========== QUANTUM VISUALIZATION ==========
  const startQuantumVisualization = useCallback(() => {
    if (!canvasRef.current || isReducedMotion || performanceMode.disableAnimations) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    
    particleSystemRef.current = { particles: [], attractors: [], time: 0, chaos: chaosLevel / 100, quantumField };
    const particleCount = performanceMode.reduceParticles ? 30 : 100;
    for (let i = 0; i < particleCount; i++) {
      particleSystemRef.current.particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        radius: performanceMode.lowQuality ? Math.random() * 2 + 1 : Math.random() * 4 + 2,
        color: `hsla(${Math.random() * 360}, 100%, 70%, ${performanceMode.lowQuality ? 0.3 : 0.5})`,
        life: Math.random() * 200 + 100
      });
    }
    
    const animate = () => {
      if (!ctx || !canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!performanceMode.simpleRendering) {
        const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2);
        gradient.addColorStop(0, `hsla(270, 100%, 60%, ${0.05 * (quantumField * 100) / 100})`);
        gradient.addColorStop(0.3, `hsla(200, 100%, 50%, ${0.03 * (quantumField * 100) / 100})`);
        gradient.addColorStop(0.6, `hsla(150, 100%, 50%, ${0.02 * (quantumField * 100) / 100})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      particleSystemRef.current.time += 0.01;
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [chaosLevel, quantumField, isReducedMotion, performanceMode]);

  // ========== RENDER FULLSCREEN TAB ==========
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
      case 'world':
        return (
          <div className="quantum-fullscreen-tab world-tab">
            <ThreeWorld 
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
            {showEditor && (
              <div className="quantum-editor-floating">
                <CodeEditor 
                  onClose={() => setShowEditor(false)}
                  addNotification={addNotification}
                  quantumState={quantumState}
                  performanceMode={performanceMode}
                />
              </div>
            )}
            {/* Mod Manager Sidebar - overlaid on fullscreen world */}
            <aside className="quantum-mod-sidebar">
              <ModManager 
                addNotification={addNotification}
                onModDragStart={handleModDragStart}
                isWorldReady={isThreeWorldReady && !webGLError}
                quantumEffects={{ chaosLevel, realityCoefficient, quantumField }}
                performanceMode={performanceMode}
              />
            </aside>
          </div>
        );
      
      case 'community':
        return (
          <div className="quantum-fullscreen-tab community-tab">
            <Community 
              addNotification={addNotification}
              encryptedParams={encryptedParams}
              reducedMotion={isReducedMotion}
              highContrast={highContrast}
              screenReaderMode={screenReaderMode}
              performanceMode={performanceMode}
            />
          </div>
        );
      
      case 'installer':
        return (
          <div className="quantum-fullscreen-tab installer-tab">
            <div className="installer-grid">
              <QuantumPWAInstaller addNotification={addNotification} />
            </div>
          </div>
        );
      
      case 'cwa':
        return (
          <div className="quantum-fullscreen-tab cwa-tab">
            <div className="installer-grid">
              <CWAInstaller addNotification={addNotification} />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="quantum-fullscreen-tab world-tab">
            <ThreeWorld 
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
  }, [activeTab, worldName, handleModDropIntoWorld, isDraggingOverWorld, handleThreeWorldReady, 
      handleWebGLError, chaosLevel, realityCoefficient, temporalDisplacement, spatialDistortion, 
      quantumField, encryptedParams, quantumState, isReducedMotion, highContrast, screenReaderMode,
      performanceMode, showEditor, isThreeWorldReady, webGLError]);

  // ========== RENDER JSX WITH EMBEDDED CSS ==========
  return (
    <>
      {/* ===== IMMERSIVE QUANTUM CSS ===== */}
      <style jsx global>{`
        /* ---------- QUANTUM DESIGN SYSTEM 3.0 ---------- */
        :root {
          --quantum-deep-space: #03050a;
          --quantum-void: #0a0c15;
          --quantum-abyss: #0f121c;
          --quantum-primary: #6c5ce7;
          --quantum-secondary: #a29bfe;
          --quantum-accent: #fd79a8;
          --quantum-chaos: #e84393;
          --quantum-temporal: #00cec9;
          --quantum-spatial: #00b894;
          --quantum-field: #0984e3;
          --quantum-reality: #6c5ce7;
          --quantum-plasma: #6c5ce7;
          --quantum-glow: rgba(108, 92, 231, 0.5);
          --quantum-glow-intense: rgba(108, 92, 231, 0.8);
          --quantum-surface: rgba(15, 20, 30, 0.95);
          --quantum-surface-glass: rgba(20, 25, 40, 0.8);
          --quantum-border: rgba(108, 92, 231, 0.3);
          --quantum-border-glow: rgba(162, 155, 254, 0.5);
          --font-quantum: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: var(--quantum-deep-space);
          color: rgba(255, 255, 255, 0.92);
          font-family: var(--font-quantum);
          font-size: 16px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          background: radial-gradient(circle at 50% 50%, var(--quantum-void) 0%, var(--quantum-deep-space) 100%);
        }

        /* ---------- FULLSCREEN TAB SYSTEM ---------- */
        .quantum-app-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          width: 100dvw;
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .quantum-fullscreen-tab {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
          background: radial-gradient(ellipse at center, var(--quantum-void) 0%, var(--quantum-deep-space) 100%);
          animation: quantumRealityShift 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        @keyframes quantumRealityShift {
          0% { opacity: 0.7; transform: scale(0.98) rotateX(2deg); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1) rotateX(0); filter: blur(0); }
        }

        /* World tab specific - full bleed */
        .world-tab {
          padding: 0;
        }

        .community-tab, .installer-tab, .cwa-tab {
          padding: 2rem;
        }

        /* ---------- QUANTUM BACKGROUND CANVAS ---------- */
        .quantum-background-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.7;
        }

        /* ---------- QUANTUM HEADER (COMPACT OVERLAY) ---------- */
        .quantum-header {
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--quantum-border);
          border-radius: 50px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px var(--quantum-glow);
          animation: headerFloat 6s infinite ease-in-out;
        }

        @keyframes headerFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .quantum-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-quantum-animation {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .quantum-logo-singularity {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: radial-gradient(circle, var(--quantum-primary), var(--quantum-secondary));
          border-radius: 50%;
          box-shadow: 0 0 30px var(--quantum-primary);
          animation: pulse 3s infinite;
        }

        .logo-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 1px solid var(--quantum-border-glow);
          border-radius: 50%;
          animation: ringPulse 3s infinite;
        }
        .logo-ring:nth-child(1) { width: 30px; height: 30px; margin-left: -15px; margin-top: -15px; opacity: 0.5; animation-delay: 0s; }
        .logo-ring:nth-child(2) { width: 40px; height: 40px; margin-left: -20px; margin-top: -20px; opacity: 0.3; animation-delay: 0.5s; }
        .logo-ring:nth-child(3) { width: 50px; height: 50px; margin-left: -25px; margin-top: -25px; opacity: 0.2; animation-delay: 1s; }

        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }

        .quantum-logo-text {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          display: flex;
          gap: 4px;
        }
        .logo-text-modz { background: linear-gradient(135deg, #fff, #e0e0ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .logo-text-quantum { background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-secondary)); -webkit-background-clip: text; background-clip: text; color: transparent; }

        /* ---------- QUANTUM NAVIGATION ---------- */
        .quantum-nav-links {
          display: flex;
          gap: 12px;
          background: rgba(10, 15, 25, 0.6);
          padding: 6px;
          border-radius: 40px;
          backdrop-filter: blur(10px);
        }

        .quantum-nav-link {
          position: relative;
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          font-weight: 600;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .quantum-nav-link i {
          font-size: 1.1rem;
          color: var(--quantum-secondary);
        }

        .quantum-nav-link:hover {
          background: rgba(108, 92, 231, 0.15);
          color: white;
          transform: translateY(-2px);
        }

        .quantum-nav-link.active {
          background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-accent));
          color: white;
          box-shadow: 0 5px 20px var(--quantum-glow);
        }

        .quantum-nav-link.active i {
          color: white;
        }

        /* ---------- QUANTUM USER SECTION / AVATAR ---------- */
        .quantum-user-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .quantum-world-actions {
          display: flex;
          gap: 8px;
        }

        .btn-quantum-primary, .btn-quantum-secondary, .btn-quantum-accent {
          padding: 8px 16px;
          border: none;
          border-radius: 30px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid var(--quantum-border);
        }
        .btn-quantum-primary { background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-secondary)); }
        .btn-quantum-accent { background: linear-gradient(135deg, var(--quantum-accent), var(--quantum-chaos)); }

        .quantum-avatar-container {
          position: relative;
        }

        .quantum-avatar-3d {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-accent));
          border: 2px solid var(--quantum-border-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 30px var(--quantum-glow);
          overflow: hidden;
        }
        .quantum-avatar-3d:hover { transform: scale(1.1); border-color: white; }
        .avatar-quantum-core { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent); }

        /* ---------- PROFILE OVERLAY (USING REAL PROFILE COMPONENT) ---------- */
        .profile-overlay-global {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 20000;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .profile-overlay-global > * {
          pointer-events: auto;
          width: 90%;
          max-width: 1200px;
          height: 80vh;
          animation: profileAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes profileAppear {
          0% { opacity: 0; transform: scale(0.9) translateY(30px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ---------- MOD MANAGER SIDEBAR (OVERLAY ON WORLD) ---------- */
        .quantum-mod-sidebar {
          position: absolute;
          top: 100px;
          right: 30px;
          width: 320px;
          max-width: 90vw;
          height: calc(100% - 130px);
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(30px);
          border: 1px solid var(--quantum-border);
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          overflow-y: auto;
          z-index: 5000;
          animation: sidebarGlide 0.5s ease;
        }
        @keyframes sidebarGlide {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* ---------- INSTALLER GRID (FULLSCREEN TABS) ---------- */
        .installer-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .installer-tab, .cwa-tab {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---------- QUANTUM NOTIFICATIONS ---------- */
        .quantum-notification-container {
          position: fixed;
          top: 100px;
          right: 30px;
          z-index: 30000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 350px;
        }
        .quantum-notification {
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px);
          border-left: 6px solid var(--quantum-primary);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          animation: notificationSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes notificationSlide {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* ---------- QUANTUM STATUS BAR ---------- */
        .quantum-status-bar {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: var(--quantum-surface-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--quantum-border);
          border-radius: 50px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10000;
        }
        .status-items {
          display: flex;
          gap: 30px;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .status-icon { color: var(--quantum-secondary); font-size: 1rem; }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 1200px) {
          .quantum-header { flex-direction: column; align-items: stretch; height: auto; border-radius: 20px; }
          .quantum-nav-links { flex-wrap: wrap; }
        }
      `}</style>

      <div className="quantum-app-container" ref={mainRef}>
        {/* Skip to content */}
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <div id="quantum-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>

        {/* Quantum Background Canvas */}
        <canvas ref={canvasRef} className="quantum-background-canvas" aria-hidden="true" />

        {/* Quantum Header - FLOATING OVERLAY */}
        <header className="quantum-header" role="banner">
          <div className="quantum-logo">
            <div className="logo-quantum-animation" aria-hidden={isReducedMotion}>
              <div className="quantum-logo-singularity"></div>
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
          
          {/* NAVIGATION - FULLSCREEN TAB CONTROLS */}
          <nav className="quantum-nav-links" aria-label="Quantum dimensions">
            <button className={`quantum-nav-link ${activeTab === 'world' ? 'active' : ''}`} onClick={() => navigateToTab('world')}>
              <i className="fas fa-globe-americas" /> World
            </button>
            <button className={`quantum-nav-link ${activeTab === 'community' ? 'active' : ''}`} onClick={() => navigateToTab('community')}>
              <i className="fas fa-share-alt" /> Community
            </button>
            <button className={`quantum-nav-link ${activeTab === 'installer' ? 'active' : ''}`} onClick={() => navigateToTab('installer')}>
              <i className="fas fa-download" /> Installer
            </button>
            <button className={`quantum-nav-link ${activeTab === 'cwa' ? 'active' : ''}`} onClick={() => navigateToTab('cwa')}>
              <i className="fas fa-bolt" /> CWA
            </button>
            <button className="quantum-nav-link" onClick={toggleQuantumEditor} aria-pressed={showEditor}>
              <i className="fas fa-atom" /> Editor
            </button>
          </nav>
          
          <div className="quantum-user-section">
            <div className="quantum-world-actions">
              <button className="btn-quantum-secondary" onClick={handleImportWorld}><i className="fas fa-folder-open" /> Import</button>
              <button className="btn-quantum-primary" onClick={handleExportWorld}><i className="fas fa-download" /> Export</button>
              <button className="btn-quantum-accent" onClick={handleShareWorld}><i className="fas fa-share" /> Share</button>
            </div>
            
            {/* AVATAR - CLICK TO SHOW PROFILE OVERLAY (REAL Profile.jsx) */}
            <div className="quantum-avatar-container">
              <button className="quantum-avatar-3d" onClick={() => setShowProfileOverlay(true)} aria-label="Open quantum profile">
                <div className="avatar-quantum-core"></div>
                <i className="fas fa-robot"></i>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT - FULLSCREEN TABS */}
        <main id="main-content" className="quantum-main-content" style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {renderFullscreenTab()}
        </main>

        {/* PROFILE OVERLAY - USING REAL IMPORTED PROFILE COMPONENT */}
        {showProfileOverlay && (
          <div className="profile-overlay-global">
            <Profile 
              addNotification={addNotification}
              quantumState={quantumState}
              reducedMotion={isReducedMotion}
              highContrast={highContrast}
              performanceMode={performanceMode}
              onClose={() => setShowProfileOverlay(false)}
            />
          </div>
        )}

        {/* QUANTUM STATUS BAR */}
        <div className="quantum-status-bar">
          <div className="status-items">
            <div className="status-item"><i className="fas fa-atom status-icon" /> Quantum Field: {Math.round(quantumField * 100)}%</div>
            <div className="status-item"><i className="fas fa-fire status-icon" /> Chaos: {Math.round(chaosLevel)}%</div>
            <div className="status-item"><i className="fas fa-tachometer-alt status-icon" /> {performanceLevel}</div>
            <div className="status-item"><i className="fas fa-clock status-icon" /> {fps} FPS</div>
          </div>
          <div className="status-actions">
            <button className="btn-quantum-small" onClick={() => setShowQuantumInstaller(true)}><i className="fas fa-download" /></button>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="quantum-notification-container">
          {notifications.map(n => (
            <div key={n.id} className={`quantum-notification ${n.type}`}>
              <div className="notification-message">{n.message}</div>
            </div>
          ))}
        </div>

        {/* QUANTUM INSTALLERS (if not dismissed) */}
        {showQuantumInstaller && (
          <>
            <CWAInstaller addNotification={addNotification} />
            <QuantumPWAInstaller addNotification={addNotification} />
          </>
        )}
      </div>
    </>
  );
}

// Main export with Suspense
export default function Home() {
  return (
    <Suspense fallback={
      <div className="quantum-loading-screen" style={{ 
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'radial-gradient(circle at center, #0a0c15 0%, #03050a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        color: 'white', zIndex: 999999
      }}>
        <div className="quantum-spinner-cosmic" style={{ width: '80px', height: '80px', border: '4px solid rgba(108,92,231,0.2)', borderTopColor: '#6c5ce7', borderRadius: '50%', animation: 'spin 1s infinite' }}></div>
        <p style={{ marginTop: '20px', fontSize: '1.5rem', background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Initializing Quantum Reality...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
