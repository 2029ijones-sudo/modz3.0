'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Zap,
  Cpu,
  Thermometer,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Battery,
  HardDrive,
  Gauge,
  AlertTriangle,
  X, // <-- Added missing import
} from 'lucide-react';

// ===== 1. IMPORT CHAOS ENGINE =====
const ChaosEngine = dynamic(() => import('@/Chaos'), { ssr: false });
// ===== 2. DYNAMIC IMPORTS OF MAIN COMPONENTS =====
const ThreeWorld = dynamic(() => import('@/Src/ThreeWorlds'), {
  ssr: false,
  loading: () => (
    <div className="quantum-tab-loading-full">
      <div className="quantum-spinner-giant"></div>
      <p>Manifesting Quantum Reality...</p>
    </div>
  ),
});

const CodeEditor = dynamic(() => import('@/CodeEditor'), { ssr: false });
const ModManager = dynamic(() => import('@/ModManager'), { ssr: false });
const Community = dynamic(() => import('@/Community'), { ssr: false });
const Profile = dynamic(() => import('@/Profile'), { ssr: false });

const CWAInstaller = dynamic(() => import('@/CWAInstaller'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading">Initializing CWA Protocol...</div>,
});

const QuantumPWAInstaller = dynamic(() => import('@/PWAInstaller'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading">Quantum Entangling PWA...</div>,
});

// ===== 3. VERSIONED IMPORTS FOR QUANTUM MIXER =====
const ThreeWorldStable = dynamic(() => import('@/Src/ThreeWorlds'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading-full">🌍 Stable World</div>,
});
const ThreeWorldLite = dynamic(() => import('@/Shared/ThreeWorlds.lite'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading-full">⚡ Lite World</div>,
});
const ThreeWorldBroken = dynamic(() => import('@/Shared/ThreeWorlds.broken'), {
  ssr: false,
  loading: () => <div className="quantum-tab-loading-full">⚠️ Broken World</div>,
});

const CodeEditorStable = dynamic(() => import('@/CodeEditor'), { ssr: false });
const CodeEditorLite = dynamic(() => import('@/Shared/CodeEditor.lite'), { ssr: false });
const CodeEditorBroken = dynamic(() => import('@/Shared/CodeEditor.broken'), { ssr: false });

const ModManagerStable = dynamic(() => import('@/ModManager'), { ssr: false });
const ModManagerLite = dynamic(() => import('@/Shared/ModManager.lite'), { ssr: false });
const ModManagerBroken = dynamic(() => import('@/Shared/ModManager.broken'), { ssr: false });

const CommunityStable = dynamic(() => import('@/Community'), { ssr: false });
const CommunityLite = dynamic(() => import('@/Shared/Community.lite'), { ssr: false });
const CommunityBroken = dynamic(() => import('@/Shared/Community.broken'), { ssr: false });

const ProfileStable = dynamic(() => import('@/Profile'), { ssr: false });
const ProfileLite = dynamic(() => import('@/Shared/Profile.lite'), { ssr: false });
const ProfileBroken = dynamic(() => import('@/Shared/Profile.broken'), { ssr: false });

const CWAInstallerStable = dynamic(() => import('@/CWAInstaller'), { ssr: false });
const CWAInstallerLite = dynamic(() => import('@/Shared/CWAInstaller.lite'), { ssr: false });
const CWAInstallerBroken = dynamic(() => import('@/Shared/CWAInstaller.broken'), { ssr: false });

const QuantumPWAInstallerStable = dynamic(() => import('@/PWAInstaller'), { ssr: false });
const QuantumPWAInstallerLite = dynamic(() => import('@/Shared/PWAInstaller.lite'), { ssr: false });
const QuantumPWAInstallerBroken = dynamic(() => import('@/Shared/PWAInstaller.broken'), { ssr: false });

// ===== 4. COMPONENT VERSION MAP =====
const VERSION_MAP = {
  ThreeWorld: { stable: ThreeWorldStable, lite: ThreeWorldLite, broken: ThreeWorldBroken },
  CodeEditor: { stable: CodeEditorStable, lite: CodeEditorLite, broken: CodeEditorBroken },
  ModManager: { stable: ModManagerStable, lite: ModManagerLite, broken: ModManagerBroken },
  Community: { stable: CommunityStable, lite: CommunityLite, broken: CommunityBroken },
  Profile: { stable: ProfileStable, lite: ProfileLite, broken: ProfileBroken },
  CWAInstaller: { stable: CWAInstallerStable, lite: CWAInstallerLite, broken: CWAInstallerBroken },
  QuantumPWAInstaller: { stable: QuantumPWAInstallerStable, lite: QuantumPWAInstallerLite, broken: QuantumPWAInstallerBroken },
};

// ===== 5. QUANTUM INSTALLATION SYSTEM =====
const { quantumInstallation, getQuantumStateSummary } = await import('~/quantum-installation');

// ===== 6. ENCRYPTION UTILITIES =====
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

// ===== 7. ACCESSIBILITY UTILITIES =====
const announceToScreenReader = (message, priority = 'polite') => {
  if (typeof window === 'undefined') return;
  const announcer = document.getElementById('quantum-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    setTimeout(() => (announcer.textContent = ''), 3000);
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
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);

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
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  // ===== ADVANCED PERFORMANCE MODE =====
  const [fps, setFps] = useState(60);
  const [fpsHistory, setFpsHistory] = useState([]);
  const [memoryUsage, setMemoryUsage] = useState('--');
  const [gpuInfo, setGpuInfo] = useState('--');
  const [gpuUtilization, setGpuUtilization] = useState(0);
  const [cpuCores, setCpuCores] = useState(4);
  const [cpuLoad, setCpuLoad] = useState(0);
  const [batteryInfo, setBatteryInfo] = useState(null);
  const [thermalThrottling, setThermalThrottling] = useState(false);
  const [performanceLevel, setPerformanceLevel] = useState('high');
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [detectedMemory, setDetectedMemory] = useState(8);

  // Granular performance settings
  const [performanceSettings, setPerformanceSettings] = useState({
    shadows: 'medium',
    particles: 100,
    postProcessing: true,
    reflections: false,
    antiAliasing: 'fxaa',
    textureQuality: 'high',
    drawDistance: 1000,
    physicsQuality: 'high',
    fpsLimit: 60,
    dynamicResolution: true,
    resolutionScale: 1.0,
  });

  // ===== FIX #1: ADD MISSING performanceMode STATE =====
  // Simple flags derived from performanceSettings for quick checks
  const [performanceMode, setPerformanceMode] = useState(() => {
    // Initialize from default performanceSettings (high profile)
    return {
      lowQuality: false,
      disableEffects: false,
      disableAnimations: false,
      reduceParticles: false,
      disableShadows: false,
      simpleRendering: false,
      fpsLimit: 60,
    };
  });

  // ===== FIX #2: SYNC performanceMode WITH performanceSettings =====
  // Whenever performanceSettings changes, update the simple flags
  useEffect(() => {
    const settings = performanceSettings;
    const newMode = {
      lowQuality: settings.textureQuality === 'low' || settings.shadows === 'off',
      disableEffects: !settings.postProcessing,
      disableAnimations: settings.particles < 50,
      reduceParticles: settings.particles < 150,
      disableShadows: settings.shadows === 'off',
      simpleRendering: settings.antiAliasing === 'off' && !settings.postProcessing,
      fpsLimit: settings.fpsLimit,
    };
    setPerformanceMode(newMode);
  }, [performanceSettings]);

  // Predefined performance profiles
  const performanceProfiles = {
    ultra: {
      shadows: 'high',
      particles: 500,
      postProcessing: true,
      reflections: true,
      antiAliasing: 'ssaa',
      textureQuality: 'high',
      drawDistance: 2000,
      physicsQuality: 'high',
      fpsLimit: 144,
      dynamicResolution: false,
      resolutionScale: 1.0,
    },
    high: {
      shadows: 'medium',
      particles: 300,
      postProcessing: true,
      reflections: false,
      antiAliasing: 'fxaa',
      textureQuality: 'high',
      drawDistance: 1500,
      physicsQuality: 'high',
      fpsLimit: 60,
      dynamicResolution: false,
      resolutionScale: 1.0,
    },
    medium: {
      shadows: 'low',
      particles: 150,
      postProcessing: false,
      reflections: false,
      antiAliasing: 'off',
      textureQuality: 'medium',
      drawDistance: 1000,
      physicsQuality: 'medium',
      fpsLimit: 60,
      dynamicResolution: true,
      resolutionScale: 0.8,
    },
    low: {
      shadows: 'off',
      particles: 50,
      postProcessing: false,
      reflections: false,
      antiAliasing: 'off',
      textureQuality: 'low',
      drawDistance: 500,
      physicsQuality: 'low',
      fpsLimit: 30,
      dynamicResolution: true,
      resolutionScale: 0.6,
    },
    potato: {
      shadows: 'off',
      particles: 10,
      postProcessing: false,
      reflections: false,
      antiAliasing: 'off',
      textureQuality: 'low',
      drawDistance: 200,
      physicsQuality: 'low',
      fpsLimit: 24,
      dynamicResolution: true,
      resolutionScale: 0.4,
    },
  };

  // Detect device capabilities
  useEffect(() => {
    const detectCapabilities = async () => {
      // Memory
      if (navigator.deviceMemory) {
        setDetectedMemory(navigator.deviceMemory);
      }
      // CPU cores
      if (navigator.hardwareConcurrency) {
        setCpuCores(navigator.hardwareConcurrency);
      }
      // GPU info
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            setGpuInfo(renderer);
          }
        }
      } catch (e) {}
      // Battery
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          setBatteryInfo({
            level: battery.level * 100,
            charging: battery.charging,
          });
          battery.addEventListener('levelchange', () =>
            setBatteryInfo((prev) => ({ ...prev, level: battery.level * 100 }))
          );
          battery.addEventListener('chargingchange', () =>
            setBatteryInfo((prev) => ({ ...prev, charging: battery.charging }))
          );
        } catch (e) {}
      }
    };
    detectCapabilities();
  }, []);

  // ===== FIX #3: PROPER RAF CLEANUP FOR FPS MONITORING =====
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId;

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(currentFps);
        setFpsHistory((prev) => [...prev.slice(-50), { time: Date.now(), fps: currentFps }]);
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Auto-adjust performance based on FPS and chaos
  useEffect(() => {
    if (fps < 20 && performanceLevel !== 'potato') {
      setPerformanceLevel('potato');
      setPerformanceSettings(performanceProfiles.potato);
    } else if (fps < 30 && performanceLevel === 'high') {
      setPerformanceLevel('medium');
      setPerformanceSettings(performanceProfiles.medium);
    } else if (fps < 40 && performanceLevel === 'ultra') {
      setPerformanceLevel('high');
      setPerformanceSettings(performanceProfiles.high);
    }
  }, [fps, performanceLevel]);

  // Keyboard shortcut: Ctrl+Shift+P toggles performance dashboard
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPerformanceDashboard((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ===== QUANTUM VERSION MIXER =====
  const STORAGE_KEY = 'quantum-component-versions';
  const defaultVersions = {
    ThreeWorld: 'stable',
    CodeEditor: 'stable',
    ModManager: 'stable',
    Community: 'stable',
    Profile: 'stable',
    CWAInstaller: 'stable',
    QuantumPWAInstaller: 'stable',
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(componentVersions));
    }
  }, [componentVersions]);

  const getComponent = useCallback(
    (componentName) => {
      const version = componentVersions[componentName] || 'stable';
      return VERSION_MAP[componentName]?.[version] || VERSION_MAP[componentName]?.stable;
    },
    [componentVersions]
  );

  const setComponentVersion = useCallback((component, version) => {
    setComponentVersions((prev) => ({ ...prev, [component]: version }));
    addNotification(`⚛️ ${component} set to ${version}`, 'quantum');
  }, []);

  // ===== ACCESSIBILITY DETECTION =====
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

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.altKey && e.key === 'w') {
        e.preventDefault();
        navigateToTab('world');
      }
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        toggleQuantumEditor();
      }
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        navigateToTab('community');
      }
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        setShowProfileOverlay(true);
      }
      if (e.altKey && e.key === 'i') {
        e.preventDefault();
        navigateToTab('installer');
      }
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        navigateToTab('cwa');
      }
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        navigateToTab('mixer');
      }
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        handleNewWorld();
      }
      if (e.altKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePerformanceMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, showEditor, navigateToTab, toggleQuantumEditor, handleNewWorld, togglePerformanceMode]);

  // ===== PERFORMANCE DETECTION (original) =====
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
    const performanceScore = detectedMemoryValue * 0.4 + cpuCores * 0.3 + webglScore * 0.3;
    let level = 'high';
    let perfFlags = {
      lowQuality: false,
      disableEffects: false,
      disableAnimations: false,
      reduceParticles: false,
      disableShadows: false,
      simpleRendering: false,
      fpsLimit: 60,
    };
    let settings = { ...performanceProfiles.high };

    if (performanceScore < 3 || isLowEndGPU || detectedMemoryValue < 2) {
      level = 'extreme';
      perfFlags = {
        lowQuality: true,
        disableEffects: true,
        disableAnimations: true,
        reduceParticles: true,
        disableShadows: true,
        simpleRendering: true,
        fpsLimit: 30,
      };
      settings = performanceProfiles.potato;
    } else if (performanceScore < 6 || detectedMemoryValue < 4) {
      level = 'low';
      perfFlags = {
        lowQuality: true,
        disableEffects: true,
        disableAnimations: false,
        reduceParticles: true,
        disableShadows: true,
        simpleRendering: false,
        fpsLimit: 40,
      };
      settings = performanceProfiles.low;
    } else if (performanceScore < 9 || detectedMemoryValue < 6) {
      level = 'medium';
      perfFlags = {
        lowQuality: false,
        disableEffects: false,
        disableAnimations: false,
        reduceParticles: true,
        disableShadows: false,
        simpleRendering: false,
        fpsLimit: 50,
      };
      settings = performanceProfiles.medium;
    }

    setPerformanceLevel(level);
    setPerformanceMode(perfFlags);   // <-- now defined
    setPerformanceSettings(settings); // keep settings in sync
  }, []);

  // ===== FIX #4: TOGGLE PERFORMANCE MODE UPDATES BOTH =====
  const togglePerformanceMode = useCallback(() => {
    const body = document.body;
    const isExtreme = body.classList.contains('extreme-performance-mode');
    const isLow = body.classList.contains('low-performance');
    let newMode, newPerfFlags, newSettings;

    if (isExtreme) {
      body.classList.remove('extreme-performance-mode');
      body.classList.add('low-performance');
      newMode = 'Low Performance';
      newPerfFlags = {
        lowQuality: true,
        disableEffects: true,
        disableAnimations: false,
        reduceParticles: true,
        disableShadows: true,
        simpleRendering: false,
        fpsLimit: 40,
      };
      newSettings = performanceProfiles.low;
      setPerformanceLevel('low');
    } else if (isLow) {
      body.classList.remove('low-performance');
      newMode = 'Normal';
      newPerfFlags = {
        lowQuality: false,
        disableEffects: false,
        disableAnimations: false,
        reduceParticles: false,
        disableShadows: false,
        simpleRendering: false,
        fpsLimit: 60,
      };
      newSettings = performanceProfiles.high;
      setPerformanceLevel('high');
    } else {
      body.classList.add('extreme-performance-mode');
      newMode = 'Extreme Performance';
      newPerfFlags = {
        lowQuality: true,
        disableEffects: true,
        disableAnimations: true,
        reduceParticles: true,
        disableShadows: true,
        simpleRendering: true,
        fpsLimit: 30,
      };
      newSettings = performanceProfiles.potato;
      setPerformanceLevel('extreme');
    }

    setPerformanceMode(newPerfFlags);
    setPerformanceSettings(newSettings); // <-- now also updates settings
    addNotification(`Performance mode: ${newMode}`, 'info');
  }, []);

  // ===== QUANTUM SYSTEM =====
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
      } catch (error) {
        console.error('Quantum initialization failed:', error);
      }
    }
  }, [isReducedMotion, performanceMode.disableAnimations, startQuantumVisualization]);

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
    setQuantumEffects((prev) => [...prev, { id: effectId, type, intensity, timestamp: Date.now() }]);
    setTimeout(
      () => setQuantumEffects((prev) => prev.filter((effect) => effect.id !== effectId)),
      3000
    );
    addNotification(`Quantum ${type} effect triggered!`, 'info');
  }, [addNotification]);

  // ===== FULLSCREEN TAB NAVIGATION =====
  const navigateToTab = useCallback(
    (tab) => {
      console.log(`🌀 Quantum shift to dimension: ${tab}`);
      setActiveTab(tab);
      setWebGLError(null);
      addNotification(`Quantum reality shifted to ${tab} dimension`, 'quantum');
      announceToScreenReader(`Navigated to ${tab} tab`);

      const data = {
        tab,
        world: worldName,
        timestamp: Date.now(),
        quantumState: getQuantumStateSummary(),
      };
      const encrypted = encryptData(data);
      if (encrypted && typeof window !== 'undefined') {
        window.history.replaceState({}, '', `?e=${encrypted}`);
      }
    },
    [worldName, addNotification] // added addNotification dependency
  );

  const toggleQuantumEditor = useCallback(() => {
    setShowEditor(!showEditor);
    addNotification(!showEditor ? 'Quantum code editor activated' : 'Quantum editor closed', 'info');
  }, [showEditor, addNotification]);

  // ===== NOTIFICATIONS =====
  const addNotification = useCallback(
    (message, type = 'info') => {
      const id = Date.now();
      const quantumType = type === 'info' ? 'quantum' : type;
      setNotifications((prev) => [
        ...prev,
        { id, message, type: quantumType, timestamp: Date.now(), chaosLevel },
      ]);
      const decayTime = 3000 * (1 + chaosLevel / 100);
      setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), decayTime);
    },
    [chaosLevel]
  );

  // ===== THREE WORLD =====
  const handleThreeWorldReady = useCallback(() => {
    setIsThreeWorldReady(true);
    addNotification('Quantum Reality Field stabilized. 3D World ready!', 'success');
  }, [addNotification]);

  const handleWebGLError = useCallback((errorMessage) => {
    setWebGLError(errorMessage);
    addNotification(`Quantum Rendering Error: ${errorMessage}`, 'error');
  }, [addNotification]);

  // ===== DRAG AND DROP =====
  const handleModDragStart = useCallback((mod) => {
    setDraggedMod(mod);
    addNotification(`Quantum entanglement established with ${mod.name}`, 'info');
  }, [addNotification]);

  const handleModDropIntoWorld = useCallback(
    (position) => {
      if (draggedMod) {
        window.dispatchEvent(
          new CustomEvent('add-mod-to-world', { detail: { mod: draggedMod, position } })
        );
        addNotification(`Quantum manifestation: ${draggedMod.name} materialized`, 'success');
        setDraggedMod(null);
      }
    },
    [draggedMod, addNotification]
  );

  // ===== WORLD ACTIONS =====
  const handleNewWorld = useCallback(() => {
    const name = prompt('Enter quantum world name:', `Reality-${Date.now().toString(36)}`);
    if (name) {
      setWorldName(name);
      addNotification(`Quantum world "${name}" created.`, 'success');
    }
  }, [addNotification]);

  const handleClearWorld = useCallback(() => {
    if (confirm('Collapse quantum superposition? This will clear the entire reality field.')) {
      window.dispatchEvent(new CustomEvent('clear-world'));
      addNotification('Quantum reality field collapsed. World cleared.', 'success');
    }
  }, [addNotification]);

  const handleImportWorld = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.modz3,.zip,.json,.quantum';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        addNotification(`Quantum import initiated: ${file.name}...`, 'info');
      }
    };
    input.click();
  }, [addNotification]);

  const handleExportWorld = useCallback(() => {
    addNotification('Quantum reality export in progress...', 'info');
    window.dispatchEvent(new CustomEvent('export-world'));
  }, [addNotification]);

  const generateQuantumShareLink = useCallback(() => {
    const data = {
      tab: activeTab,
      world: worldName,
      timestamp: Date.now(),
      source: 'quantum_shared',
      quantumState: getQuantumStateSummary(),
    };
    const encrypted = encryptData(data);
    return encrypted ? `${window.location.origin}${window.location.pathname}?e=${encrypted}` : null;
  }, [activeTab, worldName]);

  const handleShareWorld = useCallback(() => {
    const shareLink = generateQuantumShareLink();
    if (shareLink && navigator.share) {
      navigator
        .share({ title: `Quantum World: ${worldName}`, url: shareLink })
        .catch(() => {
          navigator.clipboard.writeText(shareLink);
          addNotification('Quantum share link copied to clipboard!', 'success');
        });
    } else if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      addNotification('Quantum share link copied to clipboard!', 'success');
    }
  }, [worldName, generateQuantumShareLink, addNotification]);

  // ===== PWA / CWA INSTALLATION =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const announcer = document.createElement('div');
    announcer.id = 'quantum-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    document.body.appendChild(announcer);

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
    setTimeout(
      () => addNotification('Welcome to Quantum Modz3.0! Reality coefficient stabilized.', 'info'),
      1500
    );
    return () => {
      if (announcer) announcer.remove();
    };
  }, [searchParams, initializeQuantumSystem, addNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const data = {
      tab: activeTab,
      world: worldName,
      timestamp: Date.now(),
      quantumState: getQuantumStateSummary(),
    };
    const encrypted = encryptData(data);
    if (encrypted) window.history.replaceState({}, '', `?e=${encrypted}`);
  }, [activeTab, worldName]);

  // ===== QUANTUM VISUALIZATION =====
  const startQuantumVisualization = useCallback(() => {
    if (!canvasRef.current || isReducedMotion || performanceMode.disableAnimations) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particleSystemRef.current = {
      particles: [],
      attractors: [],
      time: 0,
      chaos: chaosLevel / 100,
      quantumField,
    };
    const particleCount = performanceMode.reduceParticles ? 30 : 100;
    for (let i = 0; i < particleCount; i++) {
      particleSystemRef.current.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: performanceMode.lowQuality ? Math.random() * 2 + 1 : Math.random() * 4 + 2,
        color: `hsla(${Math.random() * 360}, 100%, 70%, ${performanceMode.lowQuality ? 0.3 : 0.5})`,
        life: Math.random() * 200 + 100,
      });
    }

    const animate = () => {
      if (!ctx || !canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!performanceMode.simpleRendering) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, `hsla(270, 100%, 60%, ${0.05 * (quantumField * 100) / 100})`);
        gradient.addColorStop(0.3, `hsla(200, 100%, 50%, ${0.03 * (quantumField * 100) / 100})`);
        gradient.addColorStop(0.6, `hsla(150, 100%, 50%, ${0.02 * (quantumField * 100) / 100})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      particleSystemRef.current.time += 0.01;
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [chaosLevel, quantumField, isReducedMotion, performanceMode]);

  // ===== RENDER FULLSCREEN TAB (VERSION AWARE) =====
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
              performanceSettings={performanceSettings}
            />
            {showEditor && CodeEditorComponent && (
              <div className="quantum-editor-floating">
                <CodeEditorComponent
                  onClose={() => setShowEditor(false)}
                  addNotification={addNotification}
                  quantumState={quantumState}
                  performanceMode={performanceMode}
                  performanceSettings={performanceSettings}
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
                performanceSettings={performanceSettings}
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
              performanceSettings={performanceSettings}
            />
          </div>
        );
      }

      case 'installer': {
        const QuantumPWAInstallerComponent = getComponent('QuantumPWAInstaller');
        return (
          <div className="quantum-fullscreen-tab installer-tab">
            <div className="installer-grid">
              <QuantumPWAInstallerComponent addNotification={addNotification} performanceSettings={performanceSettings} />
            </div>
          </div>
        );
      }

      case 'cwa': {
        const CWAInstallerComponent = getComponent('CWAInstaller');
        return (
          <div className="quantum-fullscreen-tab cwa-tab">
            <div className="installer-grid">
              <CWAInstallerComponent addNotification={addNotification} performanceSettings={performanceSettings} />
            </div>
          </div>
        );
      }

      case 'mixer':
        return (
          <div className="quantum-fullscreen-tab mixer-tab">
            <div className="mixer-container">
              <h2 className="mixer-title">🌀 Quantum Version Mixer</h2>
              <p className="mixer-subtitle">
                Choose which reality each component manifests from.<br />
                Mix stable, lite, and broken versions to generate emergent chaos.
              </p>
              <div className="mixer-grid">
                {Object.keys(VERSION_MAP).map((component) => (
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
              <button className="mixer-reset-btn" onClick={() => setComponentVersions(defaultVersions)}>
                ↺ Reset to Stable Reality
              </button>
            </div>
          </div>
        );

      default: {
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
              performanceSettings={performanceSettings}
            />
          </div>
        );
      }
    }
  }, [
    activeTab,
    worldName,
    handleModDropIntoWorld,
    isDraggingOverWorld,
    handleThreeWorldReady,
    handleWebGLError,
    chaosLevel,
    realityCoefficient,
    temporalDisplacement,
    spatialDistortion,
    quantumField,
    encryptedParams,
    quantumState,
    isReducedMotion,
    highContrast,
    screenReaderMode,
    performanceMode,
    showEditor,
    isThreeWorldReady,
    webGLError,
    getComponent,
    componentVersions,
    setComponentVersion,
    performanceSettings,
    addNotification,
  ]);

  // ===== RENDER JSX =====
  return (
    <>
      {/* ===== IMMERSIVE QUANTUM CSS ===== (unchanged) */}
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

        html,
        body {
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
          0% {
            opacity: 0.7;
            transform: scale(0.98) rotateX(2deg);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateX(0);
            filter: blur(0);
          }
        }

        .world-tab {
          padding: 0;
        }
        .community-tab,
        .installer-tab,
        .cwa-tab,
        .mixer-tab {
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

        /* ---------- QUANTUM HEADER ---------- */
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
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
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
        .logo-ring:nth-child(1) {
          width: 30px;
          height: 30px;
          margin-left: -15px;
          margin-top: -15px;
          opacity: 0.5;
          animation-delay: 0s;
        }
        .logo-ring:nth-child(2) {
          width: 40px;
          height: 40px;
          margin-left: -20px;
          margin-top: -20px;
          opacity: 0.3;
          animation-delay: 0.5s;
        }
        .logo-ring:nth-child(3) {
          width: 50px;
          height: 50px;
          margin-left: -25px;
          margin-top: -25px;
          opacity: 0.2;
          animation-delay: 1s;
        }
        @keyframes ringPulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.1;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        .quantum-logo-text {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          display: flex;
          gap: 4px;
        }
        .logo-text-modz {
          background: linear-gradient(135deg, #fff, #e0e0ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .logo-text-quantum {
          background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-secondary));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

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

        /* ---------- USER SECTION ---------- */
        .quantum-user-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .quantum-world-actions {
          display: flex;
          gap: 8px;
        }
        .btn-quantum-primary,
        .btn-quantum-secondary,
        .btn-quantum-accent {
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
        .btn-quantum-primary {
          background: linear-gradient(135deg, var(--quantum-primary), var(--quantum-secondary));
        }
        .btn-quantum-accent {
          background: linear-gradient(135deg, var(--quantum-accent), var(--quantum-chaos));
        }
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
        .quantum-avatar-3d:hover {
          transform: scale(1.1);
          border-color: white;
        }
        .avatar-quantum-core {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent);
        }

        /* ---------- PROFILE OVERLAY ---------- */
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
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* ---------- MOD MANAGER SIDEBAR ---------- */
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
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          overflow-y: auto;
          z-index: 5000;
          animation: sidebarGlide 0.5s ease;
        }
        @keyframes sidebarGlide {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* ---------- INSTALLER GRID ---------- */
        .installer-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .installer-tab,
        .cwa-tab {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---------- NOTIFICATIONS ---------- */
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
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          animation: notificationSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes notificationSlide {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* ---------- STATUS BAR ---------- */
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
        .status-icon {
          color: var(--quantum-secondary);
          font-size: 1rem;
        }

        /* ---------- VERSION MIXER STYLES ---------- */
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
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          animation: mixerAppear 0.5s ease;
        }
        @keyframes mixerAppear {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
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
          color: rgba(255, 255, 255, 0.7);
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
          box-shadow: 0 0 30px rgba(108, 92, 231, 0.2);
          transform: translateY(-2px);
        }
        .mixer-component-name {
          display: block;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: white;
          text-shadow: 0 0 10px rgba(108, 92, 231, 0.3);
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
          border-top: 1px dashed rgba(162, 155, 254, 0.3);
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
          box-shadow: 0 0 30px rgba(253, 121, 168, 0.3);
        }
        .mixer-reset-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 50px rgba(253, 121, 168, 0.6);
        }

        /* ---------- PERFORMANCE DASHBOARD STYLES ---------- */
        .performance-dashboard {
          position: fixed;
          bottom: 100px;
          left: 20px;
          width: 420px;
          background: rgba(10, 10, 20, 0.95);
          backdrop-filter: blur(12px);
          border: 2px solid #6c5ce7;
          border-radius: 24px;
          padding: 24px;
          color: white;
          z-index: 20000;
          font-family: var(--font-mono);
          box-shadow: 0 0 40px #6c5ce7, 0 10px 30px rgba(0, 0, 0, 0.8);
          animation: dashboardGlow 3s infinite alternate;
        }
        @keyframes dashboardGlow {
          from { box-shadow: 0 0 30px #6c5ce7, 0 10px 30px black; }
          to { box-shadow: 0 0 60px #e84393, 0 10px 30px black; }
        }
        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          border-bottom: 1px solid #6c5ce7;
          padding-bottom: 8px;
        }
        .dashboard-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a29bfe, #fd79a8);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .perf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .perf-item {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
        .perf-label {
          font-size: 0.8rem;
          color: #a29bfe;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .perf-value {
          font-size: 1.3rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .profile-badge {
          background: #6c5ce7;
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-block;
          margin: 8px 0;
        }
        .setting-slider {
          width: 100%;
          margin: 8px 0;
          accent-color: #e84393;
        }
        .chart-container {
          height: 100px;
          margin: 12px 0;
        }
        .close-btn {
          background: none;
          border: none;
          color: #e84393;
          cursor: pointer;
          font-size: 1.2rem;
          transition: transform 0.2s;
        }
        .close-btn:hover {
          transform: scale(1.2);
        }
      `}</style>

      <div className="quantum-app-container" ref={mainRef}>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <div id="quantum-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>

        <canvas ref={canvasRef} className="quantum-background-canvas" aria-hidden="true" />

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

          <nav className="quantum-nav-links" aria-label="Quantum dimensions">
            <button
              className={`quantum-nav-link ${activeTab === 'world' ? 'active' : ''}`}
              onClick={() => navigateToTab('world')}
            >
              <i className="fas fa-globe-americas" /> World
            </button>
            <button
              className={`quantum-nav-link ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => navigateToTab('community')}
            >
              <i className="fas fa-share-alt" /> Community
            </button>
            <button
              className={`quantum-nav-link ${activeTab === 'installer' ? 'active' : ''}`}
              onClick={() => navigateToTab('installer')}
            >
              <i className="fas fa-download" /> Installer
            </button>
            <button
              className={`quantum-nav-link ${activeTab === 'cwa' ? 'active' : ''}`}
              onClick={() => navigateToTab('cwa')}
            >
              <i className="fas fa-bolt" /> CWA
            </button>
            <button
              className={`quantum-nav-link ${activeTab === 'mixer' ? 'active' : ''}`}
              onClick={() => navigateToTab('mixer')}
            >
              <i className="fas fa-sliders-h" /> Mixer
            </button>
            <button className="quantum-nav-link" onClick={toggleQuantumEditor} aria-pressed={showEditor}>
              <i className="fas fa-atom" /> Editor
            </button>
          </nav>

          <div className="quantum-user-section">
            <div className="quantum-world-actions">
              <button className="btn-quantum-secondary" onClick={handleImportWorld}>
                <i className="fas fa-folder-open" /> Import
              </button>
              <button className="btn-quantum-primary" onClick={handleExportWorld}>
                <i className="fas fa-download" /> Export
              </button>
              <button className="btn-quantum-accent" onClick={handleShareWorld}>
                <i className="fas fa-share" /> Share
              </button>
            </div>

            <div className="quantum-avatar-container">
              <button
                className="quantum-avatar-3d"
                onClick={() => setShowProfileOverlay(true)}
                aria-label="Open quantum profile"
              >
                <div className="avatar-quantum-core"></div>
                <i className="fas fa-robot"></i>
              </button>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="quantum-main-content"
          style={{ position: 'relative', flex: 1, overflow: 'hidden' }}
        >
          {renderFullscreenTab()}
        </main>

        {showProfileOverlay && (
          <div className="profile-overlay-global">
            {(() => {
              const ProfileComponent = getComponent('Profile');
              return (
                <ProfileComponent
                  addNotification={addNotification}
                  quantumState={quantumState}
                  reducedMotion={isReducedMotion}
                  highContrast={highContrast}
                  performanceMode={performanceMode}
                  onClose={() => setShowProfileOverlay(false)}
                />
              );
            })()}
          </div>
        )}

        <div className="quantum-status-bar">
          <div className="status-items">
            <div className="status-item">
              <i className="fas fa-atom status-icon" /> Quantum Field: {Math.round(quantumField * 100)}%
            </div>
            <div className="status-item">
              <i className="fas fa-fire status-icon" /> Chaos: {Math.round(chaosLevel)}%
            </div>
            <div className="status-item">
              <i className="fas fa-tachometer-alt status-icon" /> {performanceLevel}
            </div>
            <div className="status-item">
              <i className="fas fa-clock status-icon" /> {fps} FPS
            </div>
          </div>
          <div className="status-actions">
            <button className="btn-quantum-small" onClick={() => setShowQuantumInstaller(true)}>
              <i className="fas fa-download" />
            </button>
          </div>
        </div>

        <div className="quantum-notification-container">
          {notifications.map((n) => (
            <div key={n.id} className={`quantum-notification ${n.type}`}>
              <div className="notification-message">{n.message}</div>
            </div>
          ))}
        </div>

        {showQuantumInstaller && (
          <>
            {(() => {
              const CWAComponent = getComponent('CWAInstaller');
              const PWAComponent = getComponent('QuantumPWAInstaller');
              return (
                <>
                  <CWAComponent addNotification={addNotification} />
                  <PWAComponent addNotification={addNotification} />
                </>
              );
            })()}
          </>
        )}

        {/* ===== PERFORMANCE DASHBOARD ===== */}
        <AnimatePresence>
          {showPerformanceDashboard && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="performance-dashboard"
            >
              <div className="dashboard-header">
                <span className="dashboard-title">
                  <Gauge className="inline mr-2" size={20} /> Performance Dashboard
                </span>
                <button className="close-btn" onClick={() => setShowPerformanceDashboard(false)}>
                  <X size={18} /> {/* Now imported */}
                </button>
              </div>

              {/* Live metrics */}
              <div className="perf-grid">
                <div className="perf-item">
                  <span className="perf-label">FPS</span>
                  <span className="perf-value">
                    <Activity className="text-green-400" size={18} /> {fps}
                  </span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Memory</span>
                  <span className="perf-value">
                    <HardDrive className="text-blue-400" size={18} /> {detectedMemory}GB
                  </span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">CPU Cores</span>
                  <span className="perf-value">
                    <Cpu className="text-yellow-400" size={18} /> {cpuCores}
                  </span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Battery</span>
                  <span className="perf-value">
                    <Battery
                      className={
                        batteryInfo?.charging
                          ? 'text-green-400'
                          : batteryInfo?.level < 20
                          ? 'text-red-400'
                          : 'text-white'
                      }
                      size={18}
                    />{' '}
                    {batteryInfo ? `${Math.round(batteryInfo.level)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* FPS Chart */}
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fpsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" tick={false} />
                    <YAxis domain={[0, 144]} stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #6c5ce7' }}
                    />
                    <Line type="monotone" dataKey="fps" stroke="#e84393" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Profile Badge */}
              <div className="profile-badge">Current Profile: {performanceLevel.toUpperCase()}</div>

              {/* Granular Settings */}
              <div>
                <label className="text-sm">Particle Count</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={performanceSettings.particles}
                  onChange={(e) =>
                    setPerformanceSettings({ ...performanceSettings, particles: parseInt(e.target.value) })
                  }
                  className="setting-slider"
                />
                <div className="flex justify-between text-xs">
                  <span>0</span>
                  <span>{performanceSettings.particles}</span>
                  <span>500</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setPerformanceSettings(performanceProfiles.ultra)}
                  className="px-3 py-1 bg-purple-700 rounded-lg text-xs"
                >
                  Ultra
                </button>
                <button
                  onClick={() => setPerformanceSettings(performanceProfiles.high)}
                  className="px-3 py-1 bg-blue-700 rounded-lg text-xs"
                >
                  High
                </button>
                <button
                  onClick={() => setPerformanceSettings(performanceProfiles.medium)}
                  className="px-3 py-1 bg-yellow-700 rounded-lg text-xs"
                >
                  Medium
                </button>
                <button
                  onClick={() => setPerformanceSettings(performanceProfiles.low)}
                  className="px-3 py-1 bg-orange-700 rounded-lg text-xs"
                >
                  Low
                </button>
                <button
                  onClick={() => setPerformanceSettings(performanceProfiles.potato)}
                  className="px-3 py-1 bg-red-700 rounded-lg text-xs"
                >
                  Potato
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== CHAOS ENGINE ===== */}
      <ChaosEngine />
    </>
  );
}

// ===== MAIN EXPORT =====
export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="quantum-loading-screen"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'radial-gradient(circle at center, #0a0c15 0%, #03050a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white',
            zIndex: 999999,
          }}
        >
          <div
            className="quantum-spinner-cosmic"
            style={{
              width: '80px',
              height: '80px',
              border: '4px solid rgba(108,92,231,0.2)',
              borderTopColor: '#6c5ce7',
              borderRadius: '50%',
              animation: 'spin 1s infinite',
            }}
          ></div>
          <p
            style={{
              marginTop: '20px',
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Initializing Quantum Reality...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}
