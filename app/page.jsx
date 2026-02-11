'use client';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';
import './globals.css';

// Dynamically import components with accessibility
const ThreeWorld = dynamic(() => import('@/ThreeWorld'), { 
  ssr: false,
  loading: () => (
    <div 
      className="quantum-loading" 
      role="status" 
      aria-label="Initializing 3D quantum reality field"
      aria-live="polite"
    >
      <div className="quantum-spinner" aria-hidden="true">
        <div className="quantum-particle"></div>
        <div className="quantum-particle"></div>
        <div className="quantum-particle"></div>
      </div>
      <p>Initializing Quantum Reality...</p>
      <span className="sr-only">Loading 3D world, please wait</span>
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

// Function to encrypt URL parameters with quantum enhancement
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

// ===== ACCESSIBILITY UTILITIES =====
const announceToScreenReader = (message, priority = 'polite') => {
  if (typeof window === 'undefined') return;
  
  const announcer = document.getElementById('quantum-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 3000);
  }
};

const handleKeyboardNavigation = (event, handler) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handler();
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

  // ========== ACCESSIBILITY DETECTION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e) => setIsReducedMotion(e.matches);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Detect high contrast mode
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(highContrastQuery.matches);
    
    const handleHighContrastChange = (e) => setHighContrast(e.matches);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Detect screen reader (basic detection)
    const detectScreenReader = () => {
      // Check for common screen reader accessibility APIs
      if (window.speechSynthesis || 
          navigator.accessibility?.screenReader || 
          navigator.userAgent.includes('TalkBack') ||
          navigator.userAgent.includes('VoiceOver') ||
          navigator.userAgent.includes('NVDA')) {
        setScreenReaderMode(true);
      }
    };
    detectScreenReader();

    // Add accessibility attributes to body
    document.body.setAttribute('data-reduced-motion', reducedMotionQuery.matches);
    document.body.setAttribute('data-high-contrast', highContrastQuery.matches);
    document.body.setAttribute('data-screen-reader', screenReaderMode);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, [screenReaderMode]);

  // ========== KEYBOARD SHORTCUTS ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e) => {
      // Skip if in input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Global shortcuts
      if (e.altKey && e.key === 'w') {
        e.preventDefault();
        navigateToTab('world');
        announceToScreenReader('Navigated to Quantum World');
      }
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        toggleQuantumEditor();
        announceToScreenReader(`Quantum Editor ${showEditor ? 'closed' : 'opened'}`);
      }
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        navigateToTab('community');
        announceToScreenReader('Navigated to Quantum Community');
      }
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        navigateToTab('profile');
        announceToScreenReader('Navigated to Quantum Profile');
      }
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleNewWorld();
      }
      if (e.altKey && e.key === 'i') {
        e.preventDefault();
        setShowQuantumInstaller(true);
        announceToScreenReader('Quantum installer opened');
      }
      if (e.altKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePerformanceMode();
      }
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        announceToScreenReader(
          'Keyboard shortcuts: Alt+W for World, Alt+E for Editor, ' +
          'Alt+C for Community, Alt+P for Profile, Alt+N for New World, ' +
          'Alt+I for Installer, Alt+Shift+P for Performance Mode'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, showEditor]);

  // ========== PERFORMANCE DETECTION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔧 Performance Optimizer v1.0 - Scanning device...');
    
    let detectedMemoryValue = 8;
    if (navigator.deviceMemory) {
      detectedMemoryValue = navigator.deviceMemory;
      setDetectedMemory(detectedMemoryValue);
      console.log('💾 Detected memory:', detectedMemoryValue + 'GB');
    }
    
    const cpuCores = navigator.hardwareConcurrency || 4;
    console.log('⚙️ CPU Cores:', cpuCores);
    
    let webglScore = 1;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          setGpuInfo(renderer.length > 20 ? renderer.substring(0, 20) + '...' : renderer);
          webglScore = renderer.includes('NVIDIA') || renderer.includes('AMD') || 
                       renderer.includes('RTX') || renderer.includes('Intel Iris') ? 2 : 1;
          
          if (renderer.includes('Intel') && !renderer.includes('Iris')) {
            document.body.classList.add('low-performance');
          }
        }
      }
    } catch (e) {}
    
    const performanceScore = (detectedMemoryValue * 0.4) + (cpuCores * 0.3) + (webglScore * 0.3);
    console.log('📊 Performance Score:', performanceScore.toFixed(2));
    
    let level = 'high';
    if (performanceScore < 3) {
      level = 'extreme';
      document.body.classList.add('extreme-performance-mode', 'low-performance');
      console.log('🚨 EXTREME PERFORMANCE MODE ACTIVATED');
    } else if (performanceScore < 6) {
      level = 'low';
      document.body.classList.add('low-performance');
      console.log('⚠️ LOW PERFORMANCE MODE ACTIVATED');
    } else if (performanceScore < 9) {
      level = 'medium';
      document.body.classList.add('medium-performance');
      console.log('🔶 MEDIUM PERFORMANCE MODE ACTIVATED');
    }
    
    setPerformanceLevel(level);
    
    // FPS Counter
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
        
        if (fpsValue < 25 && !document.body.classList.contains('extreme-performance-mode')) {
          document.body.classList.add('extreme-performance-mode');
          console.log('📉 FPS dropped below 25, enabling extreme mode');
        }
      }
      requestAnimationFrame(updateFPS);
    }
    
    const fpsAnimationId = requestAnimationFrame(updateFPS);
    
    // Memory monitoring
    let memoryInterval;
    if ('memory' in performance) {
      memoryInterval = setInterval(() => {
        const memoryValue = performance.memory.usedJSHeapSize / 1024 / 1024;
        setMemoryUsage(`${memoryValue.toFixed(1)} MB`);
        
        if (memoryValue > 500 && detectedMemoryValue < 4) {
          setShowMemoryWarning(true);
        }
      }, 5000);
    }
    
    return () => {
      cancelAnimationFrame(fpsAnimationId);
      if (memoryInterval) clearInterval(memoryInterval);
    };
  }, [isReducedMotion]);

  // Performance toggle handler - UPDATED to properly affect tabs
  const togglePerformanceMode = useCallback(() => {
    const body = document.body;
    const isExtreme = body.classList.contains('extreme-performance-mode');
    const isLow = body.classList.contains('low-performance');
    
    let newMode;
    if (isExtreme) {
      body.classList.remove('extreme-performance-mode');
      body.classList.add('low-performance');
      setPerformanceLevel('low');
      newMode = 'Low Performance';
      console.log('⬆️ Switched to Low Performance Mode');
    } else if (isLow) {
      body.classList.remove('low-performance');
      setPerformanceLevel('high');
      newMode = 'Normal';
      console.log('⬆️ Switched to Normal Mode');
    } else {
      body.classList.add('extreme-performance-mode');
      setPerformanceLevel('extreme');
      newMode = 'Extreme Performance';
      console.log('⬇️ Switched to Extreme Performance Mode');
    }
    
    // Force update tab rendering by toggling active tab state
    setActiveTab(prevTab => {
      const currentTab = prevTab;
      // Small delay to ensure performance classes are applied
      setTimeout(() => {
        setActiveTab(currentTab);
      }, 10);
      return prevTab;
    });
    
    addNotification(`Performance mode: ${newMode}`, 'info');
    announceToScreenReader(`Performance mode changed to ${newMode}`);
  }, []);

  // Enable extreme performance - UPDATED to properly affect tabs
  const enableExtremePerformance = useCallback(() => {
    document.body.classList.add('extreme-performance-mode');
    setShowMemoryWarning(false);
    setPerformanceLevel('extreme');
    
    // Force update tab rendering
    setActiveTab(prevTab => {
      const currentTab = prevTab;
      setTimeout(() => {
        setActiveTab(currentTab);
      }, 10);
      return prevTab;
    });
    
    addNotification('Extreme performance mode enabled', 'info');
    announceToScreenReader('Extreme performance mode enabled for your device');
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

        const quantumEvents = [
          'quantum-state-change',
          'quantum-chaos-trigger',
          'quantum-installation-progress',
          'quantum-field-strength-change',
          'quantum-temporal-displacement',
          'quantum-spatial-distortion',
          'quantum-reality-coefficient-change',
          'quantum-coherence-change',
          'quantum-resonance-change',
          'quantum-vortex-detected',
          'quantum-anomaly-detected',
          'quantum-echo-detected'
        ];

        quantumEvents.forEach(eventName => {
          window.addEventListener(eventName, handleQuantumEvent);
        });

        if (!isReducedMotion) {
          startQuantumVisualization();
          initializeGlobalQuantumEffects();
        }

        console.log('🌀 Quantum system initialized');
      } catch (error) {
        console.error('Quantum initialization failed:', error);
      }
    }
  }, [isReducedMotion]);

  const handleQuantumEvent = useCallback((event) => {
    const { detail } = event;
    
    switch (event.type) {
      case 'quantum-state-change':
        setQuantumState(detail.quantumState);
        break;
      case 'quantum-chaos-trigger':
        handleQuantumChaosTrigger(detail);
        break;
      case 'quantum-field-strength-change':
        setQuantumField(detail.quantumFieldStrength);
        break;
      case 'quantum-temporal-displacement':
        setTemporalDisplacement(detail.temporalDisplacement);
        break;
      case 'quantum-spatial-distortion':
        setSpatialDistortion(detail.spatialDistortion);
        break;
      case 'quantum-reality-coefficient-change':
        setRealityCoefficient(detail.realityCoefficient);
        break;
      case 'quantum-anomaly-detected':
        handleQuantumAnomaly(detail);
        break;
      case 'quantum-vortex-detected':
        handleQuantumVortex(detail);
        break;
      default:
        const state = getQuantumStateSummary();
        setQuantumState(state);
        setChaosLevel(state.chaosLevel);
        setQuantumField(state.quantumFieldStrength);
    }
  }, []);

  const handleQuantumChaosTrigger = useCallback((detail) => {
    const { type, intensity = 50 } = detail;
    
    const effectId = Date.now();
    const newEffect = {
      id: effectId,
      type,
      intensity,
      timestamp: Date.now()
    };
    
    setQuantumEffects(prev => [...prev, newEffect]);
    
    if (!isReducedMotion) {
      createQuantumVisualEffect(type, intensity);
    }
    
    setTimeout(() => {
      setQuantumEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 3000);
    
    addNotification(`Quantum ${type} effect triggered!`, 'info');
    announceToScreenReader(`Quantum ${type} effect triggered with ${intensity} percent intensity`);
  }, [isReducedMotion]);

  const handleQuantumAnomaly = useCallback((detail) => {
    const { strength, position } = detail;
    
    if (!isReducedMotion) {
      createAnomalyEffect(position, strength);
    }
    
    if (strength > 0.7) {
      window.dispatchEvent(new CustomEvent('reality-distortion', {
        detail: { intensity: strength }
      }));
      addNotification('Reality anomaly detected! Reality coefficient fluctuating.', 'warning');
      announceToScreenReader('Warning: Reality anomaly detected. Reality coefficient fluctuating.');
    }
  }, [isReducedMotion]);

  const handleQuantumVortex = useCallback((detail) => {
    const { type, strength, position } = detail;
    
    if (!isReducedMotion) {
      createVortexEffect(type, position, strength);
    }
    
    if (type.includes('temporal')) {
      window.dispatchEvent(new CustomEvent('time-dilation', {
        detail: { factor: 1 + strength * 0.5 }
      }));
      addNotification('Temporal vortex detected! Time dilation active.', 'info');
      announceToScreenReader('Temporal vortex detected. Time dilation active.');
    }
  }, [isReducedMotion]);

  const initializeGlobalQuantumEffects = useCallback(() => {
    if (isReducedMotion) return;
    createQuantumParticleField();
    createInterferencePatterns();
    startRealityCoefficientPulse();
  }, [isReducedMotion]);

  const createQuantumParticleField = useCallback(() => {
    const container = document.getElementById('quantum-particle-field');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
      const particle = document.createElement('div');
      particle.className = 'quantum-particle-bg';
      particle.style.setProperty('--x', `${Math.random() * 100}%`);
      particle.style.setProperty('--y', `${Math.random() * 100}%`);
      particle.style.setProperty('--duration', `${Math.random() * 10 + 5}s`);
      particle.style.setProperty('--delay', `${Math.random() * 5}s`);
      particle.style.setProperty('--size', `${Math.random() * 3 + 1}px`);
      particle.style.setProperty('--hue', `${Math.random() * 360}`);
      container.appendChild(particle);
    }
  }, []);

  const createInterferencePatterns = useCallback(() => {
    const container = document.getElementById('interference-patterns');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
      const pattern = document.createElement('div');
      pattern.className = 'interference-pattern';
      pattern.style.setProperty('--rotation', `${Math.random() * 360}deg`);
      pattern.style.setProperty('--scale', `${Math.random() * 2 + 1}`);
      pattern.style.setProperty('--opacity', `${Math.random() * 0.2 + 0.1}`);
      container.appendChild(pattern);
    }
  }, []);

  const startRealityCoefficientPulse = useCallback(() => {
    let intervalId;
    
    const pulseEffect = () => {
      const pulse = document.createElement('div');
      pulse.className = 'reality-pulse';
      pulse.style.setProperty('--coefficient', realityCoefficient.toString());
      document.body.appendChild(pulse);
      setTimeout(() => pulse.remove(), 2000);
    };
    
    intervalId = setInterval(pulseEffect, 5000 / realityCoefficient);
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [realityCoefficient]);

  const startQuantumVisualization = useCallback(() => {
    if (!canvasRef.current || isReducedMotion) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particleSystemRef.current = {
      particles: [],
      attractors: [],
      time: 0,
      chaos: chaosLevel / 100,
      quantumField: quantumField
    };
    
    for (let i = 0; i < 100; i++) {
      particleSystemRef.current.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 4 + 2,
        color: `hsla(${Math.random() * 360}, 100%, 70%, ${Math.random() * 0.5 + 0.3})`,
        charge: Math.random() > 0.5 ? 1 : -1,
        life: Math.random() * 200 + 100,
        quantumState: Math.random() > 0.5 ? 'up' : 'down',
        entangledWith: Math.random() > 0.8 ? Math.floor(Math.random() * 100) : null
      });
    }
    
    for (let i = 0; i < 5; i++) {
      particleSystemRef.current.attractors.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        strength: Math.random() * 0.8 + 0.2,
        type: ['lorenz', 'rossler', 'aizawa', 'thomas', 'dadras'][i],
        radius: Math.random() * 150 + 50
      });
    }
    
    const animate = () => {
      if (!ctx || !canvasRef.current) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const fieldStrength = quantumField * 100;
      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      
      gradient.addColorStop(0, `hsla(270, 100%, 60%, ${0.05 * fieldStrength / 100})`);
      gradient.addColorStop(0.3, `hsla(200, 100%, 50%, ${0.03 * fieldStrength / 100})`);
      gradient.addColorStop(0.6, `hsla(150, 100%, 50%, ${0.02 * fieldStrength / 100})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particleSystemRef.current.time += 0.01;
      particleSystemRef.current.chaos = chaosLevel / 100;
      particleSystemRef.current.quantumField = quantumField;
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chaosLevel, quantumField, isReducedMotion]);

  const createQuantumVisualEffect = useCallback((type, intensity) => {
    if (isReducedMotion) return;
    
    const effect = document.createElement('div');
    effect.className = `quantum-effect quantum-effect-${type}`;
    effect.style.setProperty('--intensity', `${intensity}%`);
    document.body.appendChild(effect);
    
    setTimeout(() => {
      effect.style.opacity = '0';
      setTimeout(() => effect.remove(), 1000);
    }, 2000);
  }, [isReducedMotion]);

  const createAnomalyEffect = useCallback((position, strength) => {
    if (isReducedMotion) return;
    
    const anomaly = document.createElement('div');
    anomaly.className = 'quantum-anomaly';
    anomaly.style.left = `${Math.random() * 80 + 10}%`;
    anomaly.style.top = `${Math.random() * 80 + 10}%`;
    anomaly.style.setProperty('--strength', strength.toString());
    document.body.appendChild(anomaly);
    
    setTimeout(() => {
      anomaly.style.transform = 'scale(0)';
      anomaly.style.opacity = '0';
      setTimeout(() => anomaly.remove(), 1000);
    }, 3000);
  }, [isReducedMotion]);

  const createVortexEffect = useCallback((type, position, strength) => {
    if (isReducedMotion) return;
    
    const vortex = document.createElement('div');
    vortex.className = `quantum-vortex quantum-vortex-${type}`;
    vortex.style.left = `${Math.random() * 70 + 15}%`;
    vortex.style.top = `${Math.random() * 70 + 15}%`;
    vortex.style.setProperty('--strength', strength.toString());
    document.body.appendChild(vortex);
    setTimeout(() => vortex.remove(), 5000);
  }, [isReducedMotion]);

  // ========== TAB NAVIGATION ==========
  const navigateToTab = useCallback((tab) => {
    console.log(`Changing to tab: ${tab}`);
    setActiveTab(tab);
    setWebGLError(null);
    
    addNotification(`Quantum reality shifted to ${tab} dimension`, 'quantum');
    announceToScreenReader(`Navigated to ${tab} tab`);
    
    // Announce tab content for screen readers
    setTimeout(() => {
      const tabContent = document.querySelector(`[data-quantum-tab="${tab}"]`);
      if (tabContent) {
        const heading = tabContent.querySelector('h2');
        if (heading) {
          announceToScreenReader(`Now viewing ${heading.textContent}`);
        }
      }
    }, 100);
    
    const data = {
      tab,
      world: worldName,
      timestamp: Date.now(),
      session: Math.random().toString(36).substring(7),
      quantumState: getQuantumStateSummary()
    };
    
    const encrypted = encryptData(data);
    if (encrypted && typeof window !== 'undefined') {
      window.history.replaceState({}, '', `?e=${encrypted}`);
      
      quantumInstallation.triggerQuantumEvent('TAB_CHANGE', {
        tab: tab,
        encryptedUrl: encrypted,
        timestamp: Date.now()
      });
    }
  }, [worldName]);

  const toggleQuantumEditor = useCallback(() => {
    setShowEditor(!showEditor);
    if (!showEditor) {
      addNotification('Quantum code editor activated. Reality manipulation enabled.', 'info');
      announceToScreenReader('Quantum code editor opened');
    } else {
      announceToScreenReader('Quantum code editor closed');
    }
  }, [showEditor]);

  // ========== NOTIFICATIONS ==========
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    const quantumType = type === 'info' ? 'quantum' : type;
    
    setNotifications(prev => [...prev, { 
      id, 
      message, 
      type: quantumType,
      timestamp: Date.now(),
      chaosLevel: chaosLevel 
    }]);
    
    // Announce to screen reader with appropriate priority
    if (type === 'error' || type === 'warning') {
      announceToScreenReader(`Warning: ${message}`, 'assertive');
    } else {
      announceToScreenReader(message, 'polite');
    }
    
    quantumInstallation.triggerQuantumEvent('NOTIFICATION_ADDED', {
      message,
      type: quantumType,
      timestamp: Date.now()
    });
    
    const decayTime = 3000 * (1 + chaosLevel / 100);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, decayTime);
  }, [chaosLevel]);

  // ========== THREE WORLD ==========
  const handleThreeWorldReady = useCallback(() => {
    setIsThreeWorldReady(true);
    addNotification('Quantum Reality Field stabilized. 3D World ready!', 'success');
    announceToScreenReader('3D Quantum World is now ready');
    
    quantumInstallation.triggerQuantumEvent('WORLD_READY', {
      timestamp: Date.now(),
      worldName: worldName,
      realityCoefficient: realityCoefficient
    });
  }, [worldName, realityCoefficient]);

  const handleWebGLError = useCallback((errorMessage) => {
    setWebGLError(errorMessage);
    addNotification(`Quantum Rendering Error: ${errorMessage}`, 'error');
    announceToScreenReader(`Error: ${errorMessage}. Please check WebGL support.`, 'assertive');
    
    quantumInstallation.triggerQuantumEvent('RENDERING_ERROR', {
      error: errorMessage,
      timestamp: Date.now()
    });
  }, []);

  // ========== DRAG AND DROP ==========
  const handleModDragStart = useCallback((mod) => {
    setDraggedMod(mod);
    addNotification(`Quantum entanglement established with ${mod.name}`, 'info');
    announceToScreenReader(`Dragging mod: ${mod.name}. Drop into quantum reality field to manifest.`);
    
    quantumInstallation.triggerQuantumEvent('MOD_DRAG_START', {
      mod: mod,
      timestamp: Date.now()
    });
  }, []);

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
      announceToScreenReader(`Mod ${draggedMod.name} has been manifested into the quantum world`);
      
      quantumInstallation.triggerQuantumEvent('MOD_MANIFESTED', {
        mod: draggedMod,
        position: position,
        timestamp: Date.now(),
        quantumState: getQuantumStateSummary()
      });
      
      setDraggedMod(null);
    }
  }, [draggedMod, chaosLevel, realityCoefficient, quantumField]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (activeTab === 'world' && e.dataTransfer.types.includes('application/mod-data')) {
        setIsDraggingOverWorld(true);
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
          dropZone.classList.add('drag-active');
          dropZone.innerHTML = '<div class="drop-message"><i class="fas fa-atom"></i> Quantum entanglement in progress...</div>';
          
          // Announce for screen readers
          if (screenReaderMode) {
            announceToScreenReader('Drop zone active. Release to manifest mod.');
          }
        }
      }
    };

    const handleGlobalDragLeave = (e) => {
      if (activeTab === 'world') {
        setIsDraggingOverWorld(false);
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
          dropZone.classList.remove('drag-active');
          dropZone.innerHTML = '';
        }
      }
    };

    const handleGlobalDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (activeTab === 'world') {
        setIsDraggingOverWorld(false);
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
          dropZone.classList.remove('drag-active');
          dropZone.innerHTML = '';
        }
      }
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [activeTab, screenReaderMode]);

  // ========== WORLD ACTIONS ==========
  const handleNewWorld = useCallback(() => {
    const name = prompt('Enter quantum world name:', `Reality-${Date.now().toString(36)}`);
    if (name) {
      setWorldName(name);
      addNotification(`Quantum world "${name}" created. Reality field initialized.`, 'success');
      announceToScreenReader(`New quantum world created: ${name}`);
      
      const data = {
        tab: activeTab,
        world: name,
        timestamp: Date.now(),
        action: 'quantum_world_created',
        quantumState: getQuantumStateSummary()
      };
      
      const encrypted = encryptData(data);
      if (encrypted && typeof window !== 'undefined') {
        window.history.replaceState({}, '', `?e=${encrypted}`);
      }
      
      quantumInstallation.triggerQuantumEvent('WORLD_CREATED', {
        worldName: name,
        timestamp: Date.now()
      });
    }
  }, [activeTab]);

  const handleClearWorld = useCallback(() => {
    if (typeof window !== 'undefined' && confirm('Collapse quantum superposition? This will clear the entire reality field.')) {
      window.dispatchEvent(new CustomEvent('clear-world'));
      addNotification('Quantum reality field collapsed. World cleared.', 'success');
      announceToScreenReader('Quantum world has been cleared');
      
      quantumInstallation.triggerQuantumEvent('WORLD_CLEARED', {
        timestamp: Date.now()
      });
    }
  }, []);

  const handleImportWorld = useCallback(() => {
    if (typeof document === 'undefined') return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.modz3,.zip,.json,.quantum';
    input.setAttribute('aria-label', 'Import quantum world file');
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        addNotification(`Quantum import initiated: ${file.name}...`, 'info');
        announceToScreenReader(`Importing world file: ${file.name}`);
        window.dispatchEvent(new CustomEvent('import-world', { 
          detail: { 
            file: file,
            quantumSignature: quantumInstallation.quantumState?.quantumSignature 
          } 
        }));
      }
    };
    input.click();
  }, []);

  const handleExportWorld = useCallback(() => {
    addNotification('Quantum reality export in progress...', 'info');
    announceToScreenReader('Exporting quantum world');
    window.dispatchEvent(new CustomEvent('export-world', {
      detail: {
        quantumState: getQuantumStateSummary(),
        chaosLevel: chaosLevel
      }
    }));
  }, [chaosLevel]);

  const generateQuantumShareLink = useCallback(() => {
    const data = {
      tab: activeTab,
      world: worldName,
      timestamp: Date.now(),
      source: 'quantum_shared',
      owner: 'Quantum User',
      quantumState: getQuantumStateSummary(),
      chaosLevel: chaosLevel,
      realityCoefficient: realityCoefficient,
      secure: true
    };
    
    const encrypted = encryptData(data);
    if (encrypted && typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?e=${encrypted}`;
      return shareUrl;
    }
    return null;
  }, [activeTab, worldName, chaosLevel, realityCoefficient]);

  const handleShareWorld = useCallback(() => {
    const shareLink = generateQuantumShareLink();
    if (shareLink && navigator.share) {
      navigator.share({
        title: `Quantum World: ${worldName}`,
        text: `Explore my quantum reality in Modz3.0! Reality Coefficient: ${realityCoefficient.toFixed(2)}`,
        url: shareLink
      }).catch(() => {
        navigator.clipboard.writeText(shareLink).then(() => {
          addNotification('Quantum share link copied to clipboard!', 'success');
          announceToScreenReader('Share link copied to clipboard');
        }).catch(() => {
          prompt('Quantum Share Link (Encrypted):', shareLink);
        });
      });
    } else if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        addNotification('Quantum share link copied to clipboard!', 'success');
        announceToScreenReader('Share link copied to clipboard');
      }).catch(() => {
        prompt('Quantum Share Link (Encrypted):', shareLink);
      });
    }
  }, [worldName, realityCoefficient, generateQuantumShareLink]);

  // ========== PWA INSTALLATION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA installation available');
      addNotification('PWA installation available. Click install button.', 'info');
      announceToScreenReader('Quantum PWA installation is now available');
    };

    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      addNotification('Quantum Reality installed successfully!', 'success');
      announceToScreenReader('Quantum Reality has been installed successfully');
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
        const { CWAInstaller } = await import('~/cwa-installer');
        const cwa = new CWAInstaller();
        setCWAInstaller(cwa);
        
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('cwa') === '1') {
            const status = await cwa.init();
            if (status.success) {
              addNotification('CWA Mode Activated. Advanced optimizations enabled.', 'success');
              announceToScreenReader('Chrome Web App mode activated with advanced optimizations');
            }
          }
        }
      } catch (error) {
        console.warn('[CWA] Failed to initialize:', error);
      }
    };

    initializeCWA();
  }, []);

  const handlePWAInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          addNotification('Quantum PWA installation started!', 'success');
          announceToScreenReader('PWA installation started');
        } else {
          addNotification('PWA installation cancelled', 'info');
          announceToScreenReader('PWA installation cancelled');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('PWA installation failed:', error);
        addNotification('PWA installation failed. Please try manual installation.', 'error');
        announceToScreenReader('PWA installation failed', 'assertive');
      }
    } else {
      addNotification('Manual PWA installation required. Use browser menu.', 'info');
      announceToScreenReader('Manual PWA installation required. Use browser menu.');
      showManualInstallInstructions('pwa');
    }
  }, [deferredPrompt]);

  const handleCWAInstall = useCallback(async () => {
    try {
      if (!cwaInstaller) {
        const { CWAInstaller } = await import('~/cwa-installer');
        const cwa = new CWAInstaller();
        setCWAInstaller(cwa);
      }
      
      addNotification('Starting CWA installation...', 'info');
      announceToScreenReader('Starting Chrome Web App installation');
      
      if (cwaInstaller) {
        const result = await cwaInstaller.installCWA();
        
        if (result.success) {
          addNotification('CWA installed successfully! Advanced features enabled.', 'success');
          announceToScreenReader('Chrome Web App installed successfully');
          
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/?cwa=1';
            }, 2000);
          }
        } else {
          throw new Error(result.error || 'CWA installation failed');
        }
      } else {
        throw new Error('CWA installer not available');
      }
    } catch (error) {
      console.error('CWA installation failed:', error);
      addNotification(`CWA installation failed: ${error.message}`, 'error');
      announceToScreenReader(`CWA installation failed: ${error.message}`, 'assertive');
      showManualInstallInstructions('cwa');
    }
  }, [cwaInstaller]);

  const showManualInstallInstructions = useCallback((type) => {
    if (typeof document === 'undefined') return;
    
    const instructions = type === 'cwa' 
      ? `To install CWA manually:
        1. Click ⋮ (Menu) in your browser
        2. Select "Add to Home Screen" or "Install App"
        3. For school Chromebooks, you may need to:
           - Enable developer mode
           - Use "Add to desktop" instead
           - Visit https://modz3-0.vercel.app/?cwa=1 first`
      : `To install PWA manually:
        1. Click ⋮ (Menu) in your browser
        2. Look for "Install Modz Quantum" option
        3. Or click "Add to Home Screen"
        4. Some browsers may show an install icon in the address bar`;
    
    const modal = document.createElement('div');
    modal.className = 'quantum-instruction-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'instruction-title');
    
    modal.innerHTML = `
      <div class="instruction-content">
        <h2 id="instruction-title">${type === 'cwa' ? '⚡ CWA Installation' : '📱 PWA Installation'}</h2>
        <pre>${instructions}</pre>
        <div class="instruction-actions">
          <button class="btn-instruction-close" aria-label="Close instructions">Close</button>
          ${type === 'cwa' ? '<button class="btn-instruction-retry" aria-label="Retry CWA installation">Retry CWA</button>' : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.btn-instruction-close');
    closeBtn.addEventListener('click', () => modal.remove());
    closeBtn.focus();
    
    if (type === 'cwa') {
      modal.querySelector('.btn-instruction-retry').addEventListener('click', () => {
        modal.remove();
        handleCWAInstall();
      });
    }
  }, [handleCWAInstall]);

  const dismissQuantumInstaller = useCallback(() => {
    setShowQuantumInstaller(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('quantum_installer_dismissed', 'true');
    }
    addNotification('Quantum installer dismissed. You can install later from the status bar.', 'info');
    announceToScreenReader('Quantum installer dismissed');
  }, []);

  // ========== INITIALIZATION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create screen reader announcer
    const announcer = document.createElement('div');
    announcer.id = 'quantum-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    document.body.appendChild(announcer);

    const encrypted = searchParams.get('e');
    if (encrypted) {
      const decrypted = decryptData(encrypted);
      if (decrypted) {
        setEncryptedParams(decrypted);
        
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
        
        quantumInstallation.triggerQuantumEvent('ENCRYPTED_SESSION_LOADED', decrypted);
      }
    }

    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      } catch (error) {
        return false;
      }
    };

    if (!checkWebGLSupport()) {
      handleWebGLError('WebGL is not supported in your browser. Quantum rendering disabled.');
    }

    initializeQuantumSystem();

    if ('serviceWorker' in navigator && 
        !window.matchMedia('(display-mode: standalone)').matches &&
        !localStorage.getItem('quantum_installer_dismissed')) {
      setShowQuantumInstaller(true);
    }

    const createGlobalParticles = () => {
      if (isReducedMotion) return;
      
      const particleCount = 100;
      const particlesContainer = document.getElementById('quantum-global-particles');
      if (!particlesContainer) return;
      
      particlesContainer.innerHTML = '';
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'quantum-global-particle';
        particle.style.setProperty('--x', `${Math.random() * 100}vw`);
        particle.style.setProperty('--y', `${Math.random() * 100}vh`);
        particle.style.setProperty('--duration', `${Math.random() * 20 + 10}s`);
        particle.style.setProperty('--delay', `${Math.random() * 10}s`);
        particle.style.setProperty('--size', `${Math.random() * 6 + 2}px`);
        particle.style.setProperty('--hue', `${Math.random() * 360}`);
        particle.style.setProperty('--opacity', `${Math.random() * 0.3 + 0.1}`);
        particlesContainer.appendChild(particle);
      }
    };

    createGlobalParticles();
    
    setTimeout(() => {
      addNotification('Welcome to Quantum Modz3.0! Reality coefficient stabilized.', 'info');
      announceToScreenReader('Welcome to Quantum Modz3.0');
      
      quantumInstallation.triggerQuantumEvent('SYSTEM_INITIALIZED', {
        timestamp: Date.now(),
        chaosLevel: chaosLevel,
        quantumField: quantumField,
        realityCoefficient: realityCoefficient
      });
    }, 1500);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (announcer) {
        announcer.remove();
      }
    };
  }, [searchParams, initializeQuantumSystem, handleWebGLError, isReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const data = {
      tab: activeTab,
      world: worldName,
      timestamp: Date.now(),
      session: Math.random().toString(36).substring(7),
      quantumState: getQuantumStateSummary()
    };
    
    const encrypted = encryptData(data);
    if (encrypted) {
      window.history.replaceState({}, '', `?e=${encrypted}`);
      
      quantumInstallation.triggerQuantumEvent('QUANTUM_NAVIGATION', {
        tab: activeTab,
        world: worldName,
        encryptedUrl: encrypted
      });
    }
  }, [activeTab, worldName]);

  // ========== RENDER FUNCTIONS ==========
  const renderActiveTab = useCallback(() => {
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
            reducedMotion={isReducedMotion}
            highContrast={highContrast}
          />
        );
      case 'community':
        return (
          <Community 
            addNotification={addNotification} 
            encryptedParams={encryptedParams}
            reducedMotion={isReducedMotion}
            highContrast={highContrast}
            screenReaderMode={screenReaderMode}
          />
        );
      case 'profile':
        return (
          <Profile 
            addNotification={addNotification} 
            quantumState={quantumState}
            reducedMotion={isReducedMotion}
            highContrast={highContrast}
          />
        );
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
            reducedMotion={isReducedMotion}
            highContrast={highContrast}
          />
        );
    }
  }, [activeTab, worldName, handleModDropIntoWorld, isDraggingOverWorld, handleThreeWorldReady, 
      handleWebGLError, chaosLevel, realityCoefficient, temporalDisplacement, spatialDistortion, 
      quantumField, encryptedParams, quantumState, isReducedMotion, highContrast, screenReaderMode]);

  const renderQuantumErrorFallback = useCallback(() => (
    <div 
      className="quantum-error-fallback" 
      role="alert" 
      aria-live="assertive"
      aria-labelledby="error-heading"
    >
      <div className="quantum-error-icon" aria-hidden={isReducedMotion ? "true" : "false"}>
        <i className="fas fa-atom fa-spin"></i>
        <div className="quantum-error-rings">
          <div className="ring"></div>
          <div className="ring"></div>
          <div className="ring"></div>
        </div>
      </div>
      <h2 id="error-heading">Quantum Reality Unstable</h2>
      <p className="error-message">{webGLError}</p>
      <div className="quantum-error-actions">
        <button 
          className="btn btn-quantum"
          onClick={() => window.location.reload()}
          onKeyDown={(e) => handleKeyboardNavigation(e, () => window.location.reload())}
          aria-label="Reload page to fix quantum rendering error"
        >
          <i className="fas fa-redo" aria-hidden="true"></i> Quantum Reboot
        </button>
        <button 
          className="btn btn-quantum-secondary"
          onClick={() => navigateToTab('community')}
          onKeyDown={(e) => handleKeyboardNavigation(e, () => navigateToTab('community'))}
          aria-label="Go to Quantum Community"
        >
          <i className="fas fa-share-alt" aria-hidden="true"></i> Quantum Community
        </button>
      </div>
      <div className="quantum-tips">
        <h3>Quantum Tips:</h3>
        <ul>
          <li>Ensure quantum entanglement (WebGL) is enabled</li>
          <li>Update quantum drivers (Graphics drivers)</li>
          <li>Check reality field stability (Browser compatibility)</li>
          <li>Adjust quantum coherence settings (Disable hardware acceleration blockers)</li>
        </ul>
      </div>
      <div className="quantum-stats" aria-label="Quantum statistics">
        <div className="stat">
          <span className="stat-label">Reality Coefficient</span>
          <span className="stat-value">{realityCoefficient.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Chaos Level</span>
          <span className="stat-value">{Math.round(chaosLevel)}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Quantum Field</span>
          <span className="stat-value">{Math.round(quantumField * 100)}%</span>
        </div>
      </div>
    </div>
  ), [webGLError, realityCoefficient, chaosLevel, quantumField, isReducedMotion, navigateToTab]);

  const renderAccessibilityControls = () => (
    <div 
      className="accessibility-controls" 
      role="group" 
      aria-label="Accessibility controls"
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 100000,
        display: 'flex',
        gap: '10px'
      }}
    >
      <button
        className="btn btn-quantum-small"
        onClick={() => {
          const newFontSize = fontSize === 'normal' ? 'large' : 'normal';
          setFontSize(newFontSize);
          document.body.setAttribute('data-font-size', newFontSize);
          announceToScreenReader(`Font size changed to ${newFontSize}`);
        }}
        aria-label="Toggle font size"
        title="Toggle large text"
      >
        <i className="fas fa-text-height" aria-hidden="true"></i>
        <span className="sr-only">Toggle font size</span>
      </button>
      
      <button
        className="btn btn-quantum-small"
        onClick={() => {
          const newContrast = !highContrast;
          setHighContrast(newContrast);
          document.body.setAttribute('data-high-contrast', newContrast);
          announceToScreenReader(`High contrast mode ${newContrast ? 'enabled' : 'disabled'}`);
        }}
        aria-pressed={highContrast}
        aria-label="Toggle high contrast"
      >
        <i className="fas fa-adjust" aria-hidden="true"></i>
        <span className="sr-only">Toggle high contrast</span>
      </button>
      
      <button
        className="btn btn-quantum-small"
        onClick={() => {
          const newMotion = !isReducedMotion;
          setIsReducedMotion(newMotion);
          document.body.setAttribute('data-reduced-motion', newMotion);
          announceToScreenReader(`Reduced motion ${newMotion ? 'enabled' : 'disabled'}`);
        }}
        aria-pressed={isReducedMotion}
        aria-label="Toggle reduced motion"
      >
        <i className="fas fa-heartbeat" aria-hidden="true"></i>
        <span className="sr-only">Toggle reduced motion</span>
      </button>
      
      <button
        className="btn btn-quantum-small"
        onClick={() => {
          const helpText = `
            Quantum Modz 3.0 Accessibility Features:
            
            Keyboard Shortcuts:
            - Alt+W: Go to World
            - Alt+E: Toggle Editor
            - Alt+C: Go to Community
            - Alt+P: Go to Profile
            - Alt+N: Create New World
            - Alt+I: Open Installer
            - Alt+Shift+P: Toggle Performance Mode
            - Alt+H: Show this help
            
            Screen Reader Support: Full NVDA, JAWS, VoiceOver compatibility
            High Contrast Mode: Toggle with button or system preference
            Reduced Motion: Toggle with button or system preference
            Large Text: Toggle font size scaling
            
            For more help, visit our community tab.
          `;
          announceToScreenReader(helpText, 'assertive');
        }}
        aria-label="Accessibility help"
        title="Show accessibility shortcuts"
      >
        <i className="fas fa-question-circle" aria-hidden="true"></i>
        <span className="sr-only">Accessibility help</span>
      </button>
    </div>
  );

  // ========== RENDER JSX ==========
  return (
    <div 
      className="quantum-app-container" 
      suppressHydrationWarning
      ref={mainRef}
      data-active-tab={activeTab}
      data-reduced-motion={isReducedMotion}
      data-high-contrast={highContrast}
      data-font-size={fontSize}
      data-screen-reader={screenReaderMode}
      data-performance-level={performanceLevel}
    >
      {/* Skip to content link for keyboard users */}
      <a 
        href="#main-content" 
        className="skip-to-content"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '0',
          background: 'var(--quantum-plasma)',
          color: 'white',
          padding: '8px 16px',
          zIndex: 100000,
          textDecoration: 'none',
          borderRadius: '0 0 8px 0',
          transition: 'top 0.2s'
        }}
        onFocus={(e) => e.target.style.top = '0'}
        onBlur={(e) => e.target.style.top = '-40px'}
      >
        Skip to main content
      </a>

      {/* Screen reader announcer */}
      <div id="quantum-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>

      {/* Quantum Background Canvas - hidden from screen readers */}
      <canvas 
        ref={canvasRef} 
        className="quantum-background-canvas"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          display: isReducedMotion ? 'none' : 'block'
        }}
      />

      {/* Quantum Visual Effects Containers - hidden from screen readers */}
      {!isReducedMotion && (
        <div className="quantum-visual-effects" aria-hidden="true">
          <div id="quantum-particle-field" className="quantum-particle-field"></div>
          <div id="interference-patterns" className="interference-patterns"></div>
          <div id="quantum-global-particles" className="quantum-global-particles"></div>
        </div>
      )}

      {/* Performance Indicator - accessible */}
      <div 
        className="performance-indicator" 
        role="status" 
        aria-live="polite"
        aria-label={`Performance mode: ${performanceLevel}`}
      >
        <i className="fas fa-tachometer-alt" aria-hidden="true"></i>
        <span>Performance Mode: <span id="performance-level">{performanceLevel.charAt(0).toUpperCase() + performanceLevel.slice(1)}</span></span>
      </div>

      {/* Performance Stats - toggle with keyboard */}
      <div className="performance-stats" role="region" aria-label="Performance statistics">
        <div className="stat">
          <span className="stat-label">FPS:</span>
          <span className="stat-value" id="fps-counter">{fps}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Memory:</span>
          <span className="stat-value" id="memory-usage">{memoryUsage}</span>
        </div>
        <div className="stat">
          <span className="stat-label">GPU:</span>
          <span className="stat-value" id="gpu-info">{gpuInfo}</span>
        </div>
      </div>

      {/* Performance Toggle Button */}
      <button 
        className="performance-toggle" 
        id="performanceToggle" 
        onClick={togglePerformanceMode}
        onKeyDown={(e) => handleKeyboardNavigation(e, togglePerformanceMode)}
        aria-label={`Current performance mode: ${performanceLevel}. Click to toggle.`}
      >
        <i className="fas fa-cog" aria-hidden="true"></i>
        <span>Performance</span>
      </button>

      {/* FPS Display - accessible */}
      <div 
        className={`fps-counter ${fps < 30 ? 'low' : ''}`} 
        id="fpsDisplay"
        role="status"
        aria-live="polite"
        aria-label={`Frames per second: ${fps}`}
      >
        {fps} FPS
      </div>

      {/* Memory Warning - accessible alert */}
      {showMemoryWarning && (
        <div 
          className="memory-warning show" 
          id="memoryWarning"
          role="alert"
          aria-live="assertive"
        >
          <h3>⚠️ Low Memory Detected</h3>
          <p>Your device has limited memory (<span id="detected-memory">{detectedMemory}</span>GB).</p>
          <p>Enabling Extreme Performance Mode to prevent crashes...</p>
          <div className="memory-warning-buttons">
            <button 
              className="btn btn-quantum" 
              onClick={enableExtremePerformance}
              onKeyDown={(e) => handleKeyboardNavigation(e, enableExtremePerformance)}
              aria-label="Enable extreme performance mode for better stability"
            >
              Enable Extreme Mode
            </button>
            <button 
              className="btn btn-quantum-secondary" 
              onClick={() => setShowMemoryWarning(false)}
              onKeyDown={(e) => handleKeyboardNavigation(e, () => setShowMemoryWarning(false))}
              aria-label="Dismiss memory warning and continue"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      {/* Quantum Header */}
      <header className="quantum-header" role="banner">
        <div className="quantum-logo">
          <div className="logo-quantum-animation" aria-hidden={isReducedMotion ? "true" : "false"}>
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
        
        {/* NAVIGATION - accessible - FIXED TO RESPECT PERFORMANCE MODE */}
        <nav className="quantum-nav-links" aria-label="Main navigation" role="navigation">
          <button 
            className={`quantum-nav-link ${activeTab === 'world' ? 'active' : ''}`}
            onClick={() => navigateToTab('world')}
            onKeyDown={(e) => handleKeyboardNavigation(e, () => navigateToTab('world'))}
            aria-current={activeTab === 'world' ? 'page' : undefined}
            aria-label={`Quantum World ${activeTab === 'world' ? 'current page' : ''}`}
            data-quantum="world"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-globe-americas" aria-hidden="true"></i>
              <span>Quantum World</span>
              {webGLError && activeTab === 'world' && (
                <span className="quantum-error-badge" aria-label="WebGL error detected">
                  <i className="fas fa-radiation" aria-hidden="true"></i>
                </span>
              )}
              {chaosLevel > 50 && (
                <span 
                  className="quantum-chaos-indicator" 
                  style={{'--chaos': `${chaosLevel}%`}}
                  aria-label={`High chaos level: ${Math.round(chaosLevel)}%`}
                ></span>
              )}
            </div>
          </button>
          <button 
            className="quantum-nav-link"
            onClick={toggleQuantumEditor}
            onKeyDown={(e) => handleKeyboardNavigation(e, toggleQuantumEditor)}
            aria-pressed={showEditor}
            aria-label={`Quantum Editor ${showEditor ? 'active' : 'inactive'}`}
            data-quantum="editor"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-atom" aria-hidden="true"></i>
              <span>Quantum Editor</span>
            </div>
          </button>
          <button 
            className={`quantum-nav-link ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => navigateToTab('community')}
            onKeyDown={(e) => handleKeyboardNavigation(e, () => navigateToTab('community'))}
            aria-current={activeTab === 'community' ? 'page' : undefined}
            aria-label="Quantum Community"
            data-quantum="community"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-share-alt" aria-hidden="true"></i>
              <span>Quantum Community</span>
            </div>
          </button>
          <button 
            className={`quantum-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => navigateToTab('profile')}
            onKeyDown={(e) => handleKeyboardNavigation(e, () => navigateToTab('profile'))}
            aria-current={activeTab === 'profile' ? 'page' : undefined}
            aria-label="Quantum Profile"
            data-quantum="profile"
          >
            <div className="nav-link-quantum">
              <i className="fas fa-user-astronaut" aria-hidden="true"></i>
              <span>Quantum Profile</span>
            </div>
          </button>
        </nav>
        
        <div className="quantum-user-section">
          <div className="quantum-world-actions">
            <button 
              className="btn btn-quantum-secondary" 
              onClick={handleImportWorld} 
              onKeyDown={(e) => handleKeyboardNavigation(e, handleImportWorld)}
              aria-label="Import quantum world"
              data-action="import"
            >
              <i className="fas fa-folder-open" aria-hidden="true"></i>
              <span>Quantum Import</span>
            </button>
            <button 
              className="btn btn-quantum-primary" 
              onClick={handleExportWorld} 
              onKeyDown={(e) => handleKeyboardNavigation(e, handleExportWorld)}
              aria-label="Export quantum world"
              data-action="export"
            >
              <i className="fas fa-download" aria-hidden="true"></i>
              <span>Quantum Export</span>
            </button>
            <button 
              className="btn btn-quantum-accent" 
              onClick={handleShareWorld} 
              onKeyDown={(e) => handleKeyboardNavigation(e, handleShareWorld)}
              aria-label="Share quantum world"
              data-action="share"
            >
              <i className="fas fa-share" aria-hidden="true"></i>
              <span>Quantum Share</span>
            </button>
          </div>
          <div className="quantum-avatar-container">
            <div className="quantum-avatar-glow" aria-hidden="true"></div>
            <div className="quantum-avatar-halo" aria-hidden="true"></div>
            <button 
              className="quantum-avatar-3d" 
              title="Quantum Profile" 
              onClick={() => navigateToTab('profile')}
              onKeyDown={(e) => handleKeyboardNavigation(e, () => navigateToTab('profile'))}
              aria-label="Open quantum profile"
            >
              <div className="avatar-quantum-core" aria-hidden="true"></div>
              <i className="fas fa-robot" aria-hidden="true"></i>
              {quantumState && (
                <div className="avatar-quantum-stats" aria-label={`Chaos level: ${Math.round(chaosLevel)}%`}>
                  <div className="avatar-stat">
                    <div className="stat-bar" aria-hidden="true">
                      <div className="stat-fill" style={{width: `${chaosLevel}%`}}></div>
                    </div>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Quantum Main Container */}
      <main id="main-content" className="quantum-main-container" role="main">
        {/* Quantum Sidebar - UPDATED to respect performance mode */}
        {activeTab === 'world' && (
          <aside className="quantum-sidebar" aria-label="Quantum Mod Manager">
            <div className="quantum-sidebar-header">
              <h2>Quantum Mod Manager</h2>
              <div className="quantum-sidebar-stats" aria-label="Quantum statistics">
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
              reducedMotion={isReducedMotion}
              highContrast={highContrast}
              screenReaderMode={screenReaderMode}
            />
          </aside>
        )}

        {/* Quantum Content Area */}
        <div 
          className={`quantum-content-area ${activeTab !== 'world' ? 'quantum-full-width' : ''}`}
          data-quantum-tab={activeTab}
        >
          {activeTab === 'world' ? (
            <>
              <div className="quantum-world-wrapper">
                <div className="quantum-world-header">
                  <h2 className="quantum-world-title" id="quantumWorldTitle">
                    <span className="world-name">Quantum Reality: {worldName}</span>
                    {encryptedParams.source === 'shared' && (
                      <span className="quantum-shared-badge" title="Quantum Shared via encrypted link">
                        <i className="fas fa-lock" aria-hidden="true"></i> Quantum Encrypted
                      </span>
                    )}
                    {webGLError && (
                      <span className="quantum-error-badge-global" title="Quantum Rendering Error">
                        <i className="fas fa-radiation" aria-hidden="true"></i> Reality Unstable
                      </span>
                    )}
                    {quantumEffects.length > 0 && (
                      <span className="quantum-effects-indicator" aria-label={`${quantumEffects.length} active quantum effects`}>
                        <i className="fas fa-bolt" aria-hidden="true"></i> {quantumEffects.length} Active Effects
                      </span>
                    )}
                  </h2>
                  <div className="quantum-world-actions">
                    <button 
                      className="btn btn-quantum-secondary" 
                      id="quantumToggleGrid" 
                      onClick={() => addNotification('Quantum Grid Manipulation - Coming soon', 'info')}
                      onKeyDown={(e) => handleKeyboardNavigation(e, () => addNotification('Quantum Grid Manipulation - Coming soon', 'info'))}
                      aria-label="Toggle quantum grid - coming soon"
                    >
                      <i className="fas fa-th" aria-hidden="true"></i>
                      <span>Quantum Grid</span>
                    </button>
                    <button 
                      className="btn btn-quantum-danger" 
                      id="quantumClearWorld" 
                      onClick={handleClearWorld}
                      onKeyDown={(e) => handleKeyboardNavigation(e, handleClearWorld)}
                      aria-label="Clear quantum world"
                    >
                      <i className="fas fa-trash" aria-hidden="true"></i>
                      <span>Collapse Reality</span>
                    </button>
                    <button 
                      className="btn btn-quantum-success" 
                      id="quantumNewWorld" 
                      onClick={handleNewWorld}
                      onKeyDown={(e) => handleKeyboardNavigation(e, handleNewWorld)}
                      aria-label="Create new quantum world"
                    >
                      <i className="fas fa-plus" aria-hidden="true"></i>
                      <span>New Reality</span>
                    </button>
                  </div>
                </div>

                <div className="quantum-world-overlay" aria-hidden="true"></div>
                {webGLError ? renderQuantumErrorFallback() : renderActiveTab()}
                <div 
                  className="quantum-drop-zone" 
                  id="dropZone"
                  role="region"
                  aria-label="Mod drop zone"
                  aria-live="polite"
                ></div>

                {/* Quantum Stats Overlay */}
                {quantumState && (
                  <div className="quantum-stats-overlay" aria-label="Quantum statistics">
                    <div className="quantum-stat">
                      <div className="stat-label">Quantum Field</div>
                      <div className="stat-value">{Math.round(quantumField * 100)}%</div>
                      <div className="stat-bar" aria-hidden="true">
                        <div className="stat-fill" style={{width: `${quantumField * 100}%`}}></div>
                      </div>
                    </div>
                    <div className="quantum-stat">
                      <div className="stat-label">Temporal Displacement</div>
                      <div className="stat-value">{temporalDisplacement.toFixed(1)}</div>
                      <div className="stat-indicator" style={{
                        left: `${50 + temporalDisplacement * 5}%`
                      }} aria-hidden="true"></div>
                    </div>
                    <div className="quantum-stat">
                      <div className="stat-label">Spatial Distortion</div>
                      <div className="stat-value">{spatialDistortion.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantum Code Editor */}
              {showEditor && (
                <div className="quantum-editor-panel active" role="region" aria-label="Quantum Code Editor">
                  <CodeEditor 
                    onClose={() => setShowEditor(false)}
                    addNotification={addNotification}
                    quantumMode={true}
                    quantumState={quantumState}
                    reducedMotion={isReducedMotion}
                    highContrast={highContrast}
                    screenReaderMode={screenReaderMode}
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
                {activeTab === 'community' && (
                  <button 
                    className="btn btn-quantum-accent" 
                    onClick={handleShareWorld}
                    onKeyDown={(e) => handleKeyboardNavigation(e, handleShareWorld)}
                    aria-label="Share quantum world with community"
                  >
                    <i className="fas fa-share" aria-hidden="true"></i> Share Quantum Reality
                  </button>
                )}
              </div>
              <div className="quantum-tab-inner">
                {renderActiveTab()}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quantum Installer Modal - accessible */}
      {showQuantumInstaller && (
        <div 
          className="quantum-notification quantum-notification show info" 
          role="dialog"
          aria-modal="true"
          aria-label="Quantum Installation Options"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10002,
            maxWidth: '600px',
            width: '90%'
          }}
        >
          <div className="quantum-notification-header">
            <div className="notification-quantum-icon" aria-hidden="true">
              <i className="fas fa-atom fa-spin"></i>
            </div>
            <h2 className="quantum-notification-title">
              🚀 Install Modz Quantum
            </h2>
            <button 
              className="quantum-notification-time"
              onClick={dismissQuantumInstaller}
              onKeyDown={(e) => handleKeyboardNavigation(e, dismissQuantumInstaller)}
              style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
              aria-label="Close installer"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <div className="quantum-notification-message">
            <p>Choose your installation method:</p>
            
            <div className="installer-options" style={{marginTop: '20px'}}>
              {/* PWA Option */}
              <div className="quantum-effect-item" style={{marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <h3 style={{margin: '0 0 5px 0', fontSize: '18px'}}>
                    <i className="fas fa-mobile-alt" style={{marginRight: '10px'}} aria-hidden="true"></i>
                    Standard PWA
                  </h3>
                  <p style={{margin: '0', fontSize: '14px', opacity: 0.8}}>
                    Basic Progressive Web App installation
                  </p>
                  <div style={{display: 'flex', gap: '10px', marginTop: '10px', fontSize: '12px'}}>
                    <span><i className="fas fa-check" aria-hidden="true"></i> Works everywhere</span>
                    <span><i className="fas fa-check" aria-hidden="true"></i> Offline support</span>
                    <span><i className="fas fa-check" aria-hidden="true"></i> Auto-updates</span>
                  </div>
                </div>
                <button 
                  className="btn btn-quantum-small"
                  onClick={handlePWAInstall}
                  onKeyDown={(e) => handleKeyboardNavigation(e, handlePWAInstall)}
                  disabled={!deferredPrompt}
                  style={{minWidth: '120px'}}
                  aria-label={deferredPrompt ? 'Install Progressive Web App' : 'PWA installation not available'}
                >
                  {deferredPrompt ? 'Install PWA' : 'Manual Install'}
                </button>
              </div>
              
              {/* CWA Option */}
              <div className="quantum-effect-item" style={{borderLeftColor: 'var(--quantum-warning)'}}>
                <div style={{flex: 1}}>
                  <h3 style={{margin: '0 0 5px 0', fontSize: '18px'}}>
                    <i className="fas fa-bolt" style={{marginRight: '10px'}} aria-hidden="true"></i>
                    Advanced CWA 
                    <span style={{
                      background: 'var(--quantum-warning)',
                      color: 'var(--quantum-whitehole)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      marginLeft: '5px'
                    }}>⚡ NEW</span>
                  </h3>
                  <p style={{margin: '0', fontSize: '14px', opacity: 0.8}}>
                    ChromeBook Web App with advanced optimizations
                  </p>
                  <div style={{display: 'flex', gap: '10px', marginTop: '10px', fontSize: '12px', flexWrap: 'wrap'}}>
                    <span><i className="fas fa-check" aria-hidden="true"></i> 40FPS Performance</span>
                    <span><i className="fas fa-check" aria-hidden="true"></i> School Bypass</span>
                    <span><i className="fas fa-check" aria-hidden="true"></i> Stealth Mode</span>
                    <span><i className="fas fa-check" aria-hidden="true"></i> Memory Optimized</span>
                  </div>
                </div>
                <button 
                  className="btn btn-quantum-small"
                  onClick={handleCWAInstall}
                  onKeyDown={(e) => handleKeyboardNavigation(e, handleCWAInstall)}
                  style={{
                    minWidth: '120px',
                    background: 'linear-gradient(135deg, var(--quantum-warning), #ffaa00)'
                  }}
                  aria-label="Install Chrome Web App with advanced features"
                >
                  Install CWA
                </button>
              </div>
            </div>
            
            <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
              <p style={{margin: '0 0 10px 0', fontSize: '12px', opacity: 0.8}}>
                <i className="fas fa-lightbulb" aria-hidden="true"></i> 
                <strong> Tip:</strong> CWA is recommended for school Chromebooks & better performance
              </p>
              <div className="quantum-sidebar-stats" style={{justifyContent: 'center', gap: '30px'}}>
                <div className="stat" style={{minWidth: 'auto'}}>
                  <span className="stat-label">Reality Coeff</span>
                  <span className="stat-value">{realityCoefficient.toFixed(2)}</span>
                </div>
                <div className="stat" style={{minWidth: 'auto'}}>
                  <span className="stat-label">Chaos Level</span>
                  <span className="stat-value">{Math.round(chaosLevel)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quantum Notifications */}
      <div 
        className="quantum-notification-container" 
        id="quantumNotificationContainer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`quantum-notification show ${notification.type}`}
            data-chaos={notification.chaosLevel}
            role="alert"
            aria-live={notification.type === 'error' || notification.type === 'warning' ? 'assertive' : 'polite'}
          >
            <div className="quantum-notification-header">
              <div className="notification-quantum-icon" aria-hidden="true">
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
              <div className="quantum-notification-time">
                {new Date(notification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            <div className="quantum-notification-message">{notification.message}</div>
            <div className="quantum-notification-progress" aria-hidden="true"></div>
          </div>
        ))}
      </div>

      {/* Quantum Dragging Indicator */}
      {draggedMod && (
        <div 
          className="quantum-dragging-indicator" 
          role="status" 
          aria-live="polite"
          aria-label={`Dragging mod: ${draggedMod.name}`}
        >
          <div className="quantum-dragging-icon" aria-hidden="true">
            <i className="fas fa-atom fa-spin"></i>
          </div>
          <div className="quantum-dragging-text">
            <div className="dragging-title">Quantum Entanglement Active</div>
            <div className="dragging-mod">{draggedMod.name}</div>
            <small>Drop into quantum reality field</small>
          </div>
          <div className="quantum-dragging-effects" aria-hidden="true">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="dragging-effect"></div>
            ))}
          </div>
        </div>
      )}

      {/* Quantum Effects Display */}
      {quantumEffects.length > 0 && !isReducedMotion && (
        <div 
          className="quantum-effects-display" 
          role="region" 
          aria-label="Active quantum effects"
        >
          <div className="effects-header">
            <i className="fas fa-bolt" aria-hidden="true"></i>
            <span>Active Quantum Effects</span>
          </div>
          <div className="effects-list">
            {quantumEffects.map(effect => (
              <div key={effect.id} className="quantum-effect-item">
                <div className="effect-type">{effect.type}</div>
                <div className="effect-intensity">
                  <div className="intensity-bar" aria-hidden="true">
                    <div className="intensity-fill" style={{width: `${effect.intensity}%`}}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantum Session Indicators */}
      {encryptedParams.source === 'shared' && (
        <div 
          className="quantum-session-indicator" 
          role="status" 
          aria-live="polite"
          aria-label="Quantum encrypted session active"
        >
          <div className="indicator-content">
            <i className="fas fa-lock" aria-hidden="true"></i>
            <span>Quantum Encrypted Session</span>
            <div className="indicator-stats">
              <span className="stat">RC: {realityCoefficient.toFixed(2)}</span>
              <span className="stat">CL: {Math.round(chaosLevel)}%</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = window.location.pathname;
              }
            }}
            onKeyDown={(e) => handleKeyboardNavigation(e, () => {
              if (typeof window !== 'undefined') {
                window.location.href = window.location.pathname;
              }
            })}
            aria-label="Clear session and return to home"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      )}

      {/* Quantum Status Bar */}
      <div className="quantum-status-bar" role="region" aria-label="Quantum system status">
        <div className="status-items">
          <div className="status-item">
            <div className="status-icon" aria-hidden="true">
              <i className="fas fa-atom"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Quantum Field</div>
              <div className="status-value">{Math.round(quantumField * 100)}%</div>
            </div>
          </div>
          <div className="status-item">
            <div className="status-icon" aria-hidden="true">
              <i className="fas fa-fire"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Chaos Level</div>
              <div className="status-value">{Math.round(chaosLevel)}%</div>
            </div>
          </div>
          <div className="status-item">
            <div className="status-icon" aria-hidden="true">
              <i className="fas fa-globe-americas"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Reality Coeff</div>
              <div className="status-value">{realityCoefficient.toFixed(2)}</div>
            </div>
          </div>
          <div className="status-item">
            <div className="status-icon" aria-hidden="true">
              <i className="fas fa-clock"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Time Shift</div>
              <div className="status-value">{temporalDisplacement.toFixed(1)}</div>
            </div>
          </div>
        </div>
        <div className="status-actions">
          <button 
            className="btn btn-quantum-small" 
            onClick={() => setShowQuantumInstaller(true)}
            onKeyDown={(e) => handleKeyboardNavigation(e, () => setShowQuantumInstaller(true))}
            aria-label="Open quantum installer"
          >
            <i className="fas fa-download" aria-hidden="true"></i>
          </button>
          <button 
            className="btn btn-quantum-small" 
            onClick={generateQuantumShareLink}
            onKeyDown={(e) => handleKeyboardNavigation(e, generateQuantumShareLink)}
            aria-label="Generate share link"
          >
            <i className="fas fa-share" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      {/* Quantum Installation Button */}
      {typeof window !== 'undefined' && 
       !window.matchMedia('(display-mode: standalone)').matches &&
       'serviceWorker' in navigator && (
        <div className="quantum-install-button">
          <button 
            className="btn btn-quantum-primary btn-quantum-install"
            onClick={() => setShowQuantumInstaller(true)}
            onKeyDown={(e) => handleKeyboardNavigation(e, () => setShowQuantumInstaller(true))}
            aria-label="Install Quantum Reality application"
          >
            <div className="install-button-quantum">
              <i className="fas fa-atom fa-spin" aria-hidden="true"></i>
              <span>Install Quantum Reality</span>
            </div>
          </button>
        </div>
      )}

      {/* Accessibility Controls */}
      {renderAccessibilityControls()}
    </div>
  );
}

// Main export with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={
      <div 
        className="quantum-loading-screen" 
        role="status" 
        aria-live="polite"
        aria-label="Loading Quantum Modz 3.0"
      >
        <div className="quantum-loading-animation" aria-hidden="true">
          <div className="quantum-loading-singularity"></div>
          <div className="quantum-loading-rings">
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="ring"></div>
          </div>
          <div className="quantum-loading-particles">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="particle"></div>
            ))}
          </div>
        </div>
        <p className="quantum-loading-text">Initializing Quantum Reality Field...</p>
        <div className="quantum-loading-stats">
          <div className="stat">
            <span>Chaos Field</span>
            <span>{(Math.random() * 100).toFixed(0)}%</span>
          </div>
          <div className="stat">
            <span>Reality Coeff</span>
            <span>{(Math.random() * 2).toFixed(2)}</span>
          </div>
        </div>
        <span className="sr-only">Loading, please wait</span>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
