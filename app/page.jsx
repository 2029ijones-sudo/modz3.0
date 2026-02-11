'use client';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';
import './globals.css';

// Dynamically import components
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

        // Subscribe to quantum events
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

        // Start quantum visualization
        startQuantumVisualization();
        initializeGlobalQuantumEffects();

        console.log('🌀 Quantum system initialized');
      } catch (error) {
        console.error('Quantum initialization failed:', error);
      }
    }
  }, []);

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
    createQuantumVisualEffect(type, intensity);
    
    setTimeout(() => {
      setQuantumEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 3000);
    
    addNotification(`Quantum ${type} effect triggered!`, 'info');
  }, []);

  const handleQuantumAnomaly = useCallback((detail) => {
    const { strength, position } = detail;
    createAnomalyEffect(position, strength);
    
    if (strength > 0.7) {
      window.dispatchEvent(new CustomEvent('reality-distortion', {
        detail: { intensity: strength }
      }));
      addNotification('Reality anomaly detected! Reality coefficient fluctuating.', 'warning');
    }
  }, []);

  const handleQuantumVortex = useCallback((detail) => {
    const { type, strength, position } = detail;
    createVortexEffect(type, position, strength);
    
    if (type.includes('temporal')) {
      window.dispatchEvent(new CustomEvent('time-dilation', {
        detail: { factor: 1 + strength * 0.5 }
      }));
      addNotification('Temporal vortex detected! Time dilation active.', 'info');
    }
  }, []);

  const initializeGlobalQuantumEffects = useCallback(() => {
    createQuantumParticleField();
    createInterferencePatterns();
    startRealityCoefficientPulse();
  }, []);

  const createQuantumParticleField = () => {
    const container = document.getElementById('quantum-particle-field');
    if (!container) return;
    
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
  };

  const createInterferencePatterns = () => {
    const container = document.getElementById('interference-patterns');
    if (!container) return;
    
    for (let i = 0; i < 5; i++) {
      const pattern = document.createElement('div');
      pattern.className = 'interference-pattern';
      pattern.style.setProperty('--rotation', `${Math.random() * 360}deg`);
      pattern.style.setProperty('--scale', `${Math.random() * 2 + 1}`);
      pattern.style.setProperty('--opacity', `${Math.random() * 0.2 + 0.1}`);
      container.appendChild(pattern);
    }
  };

  const startRealityCoefficientPulse = () => {
    const pulseEffect = () => {
      const pulse = document.createElement('div');
      pulse.className = 'reality-pulse';
      pulse.style.setProperty('--coefficient', realityCoefficient.toString());
      document.body.appendChild(pulse);
      setTimeout(() => pulse.remove(), 2000);
    };
    setInterval(pulseEffect, 5000 / realityCoefficient);
  };

  const startQuantumVisualization = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particleSystemRef.current = {
      particles: [],
      attractors: [],
      time: 0,
      chaos: chaosLevel / 100,
      quantumField: quantumField
    };
    
    // Initialize quantum particles
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
    
    // Initialize strange attractors
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw quantum field background
      const time = particleSystemRef.current.time;
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
      
      // Update system state
      particleSystemRef.current.time += 0.01;
      particleSystemRef.current.chaos = chaosLevel / 100;
      particleSystemRef.current.quantumField = quantumField;
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  const createQuantumVisualEffect = (type, intensity) => {
    const effect = document.createElement('div');
    effect.className = `quantum-effect quantum-effect-${type}`;
    effect.style.setProperty('--intensity', `${intensity}%`);
    document.body.appendChild(effect);
    
    setTimeout(() => {
      effect.style.opacity = '0';
      setTimeout(() => effect.remove(), 1000);
    }, 2000);
  };

  const createAnomalyEffect = (position, strength) => {
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
  };

  const createVortexEffect = (type, position, strength) => {
    const vortex = document.createElement('div');
    vortex.className = `quantum-vortex quantum-vortex-${type}`;
    vortex.style.left = `${Math.random() * 70 + 15}%`;
    vortex.style.top = `${Math.random() * 70 + 15}%`;
    vortex.style.setProperty('--strength', strength.toString());
    document.body.appendChild(vortex);
    setTimeout(() => vortex.remove(), 5000);
  };

  // ========== TAB NAVIGATION ==========
  const navigateToTab = (tab) => {
    console.log(`Changing to tab: ${tab}`);
    setActiveTab(tab);
    setWebGLError(null);
    
    // Add quantum notification
    addNotification(`Quantum reality shifted to ${tab} dimension`, 'quantum');
    
    // Create quantum shareable URL
    const data = {
      tab,
      world: worldName,
      timestamp: Date.now(),
      session: Math.random().toString(36).substring(7),
      quantumState: getQuantumStateSummary()
    };
    
    const encrypted = encryptData(data);
    if (encrypted) {
      const url = `${window.location.origin}${window.location.pathname}?e=${encrypted}`;
      window.history.replaceState({}, '', `?e=${encrypted}`);
      
      quantumInstallation.triggerQuantumEvent('TAB_CHANGE', {
        tab: tab,
        encryptedUrl: encrypted,
        timestamp: Date.now()
      });
    }
  };

  const toggleQuantumEditor = () => {
    setShowEditor(!showEditor);
    if (!showEditor) {
      addNotification('Quantum code editor activated. Reality manipulation enabled.', 'info');
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
    
    quantumInstallation.triggerQuantumEvent('NOTIFICATION_ADDED', {
      message,
      type: quantumType,
      timestamp: Date.now()
    });
    
    const decayTime = 3000 * (1 + chaosLevel / 100);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, decayTime);
  };

  // ========== THREE WORLD ==========
  const handleThreeWorldReady = useCallback(() => {
    setIsThreeWorldReady(true);
    addNotification('Quantum Reality Field stabilized. 3D World ready!', 'success');
    
    quantumInstallation.triggerQuantumEvent('WORLD_READY', {
      timestamp: Date.now(),
      worldName: worldName,
      realityCoefficient: realityCoefficient
    });
  }, [worldName, realityCoefficient]);

  const handleWebGLError = useCallback((errorMessage) => {
    setWebGLError(errorMessage);
    addNotification(`Quantum Rendering Error: ${errorMessage}`, 'error');
    
    quantumInstallation.triggerQuantumEvent('RENDERING_ERROR', {
      error: errorMessage,
      timestamp: Date.now()
    });
  }, []);

  // ========== DRAG AND DROP ==========
  const handleModDragStart = (mod) => {
    setDraggedMod(mod);
    addNotification(`Quantum entanglement established with ${mod.name}`, 'info');
    
    quantumInstallation.triggerQuantumEvent('MOD_DRAG_START', {
      mod: mod,
      timestamp: Date.now()
    });
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
      
      quantumInstallation.triggerQuantumEvent('MOD_MANIFESTED', {
        mod: draggedMod,
        position: position,
        timestamp: Date.now(),
        quantumState: getQuantumStateSummary()
      });
      
      setDraggedMod(null);
    }
  }, [draggedMod, chaosLevel, realityCoefficient, quantumField]);

  // Drag and drop handlers with quantum effects
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
  }, [activeTab]);

  // ========== WORLD ACTIONS ==========
  const handleNewWorld = () => {
    const name = prompt('Enter quantum world name:', `Reality-${Date.now().toString(36)}`);
    if (name) {
      setWorldName(name);
      addNotification(`Quantum world "${name}" created. Reality field initialized.`, 'success');
      
      const data = {
        tab: activeTab,
        world: name,
        timestamp: Date.now(),
        action: 'quantum_world_created',
        quantumState: getQuantumStateSummary()
      };
      
      const encrypted = encryptData(data);
      if (encrypted) {
        window.history.replaceState({}, '', `?e=${encrypted}`);
      }
      
      quantumInstallation.triggerQuantumEvent('WORLD_CREATED', {
        worldName: name,
        timestamp: Date.now()
      });
    }
  };

  const handleClearWorld = () => {
    if (confirm('Collapse quantum superposition? This will clear the entire reality field.')) {
      window.dispatchEvent(new CustomEvent('clear-world'));
      addNotification('Quantum reality field collapsed. World cleared.', 'success');
      
      quantumInstallation.triggerQuantumEvent('WORLD_CLEARED', {
        timestamp: Date.now()
      });
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
            quantumSignature: quantumInstallation.quantumState?.quantumSignature 
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

  const generateQuantumShareLink = () => {
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
    if (encrypted) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?e=${encrypted}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        addNotification('Quantum share link copied to clipboard! Reality entanglement established.', 'success');
      }).catch(() => {
        prompt('Quantum Share Link (Encrypted):', shareUrl);
      });
      
      return shareUrl;
    }
    return null;
  };

  const handleShareWorld = () => {
    const shareLink = generateQuantumShareLink();
    if (shareLink && navigator.share) {
      navigator.share({
        title: `Quantum World: ${worldName}`,
        text: `Explore my quantum reality in Modz3.0! Reality Coefficient: ${realityCoefficient.toFixed(2)}`,
        url: shareLink
      });
    }
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
        const { CWAInstaller } = await import('~/cwa-installer');
        const cwa = new CWAInstaller();
        setCWAInstaller(cwa);
        
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
    addNotification('Quantum installer dismissed. You can install later from the status bar.', 'info');
  };

  // ========== INITIALIZATION ==========
  useEffect(() => {
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

    // Check WebGL support
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

    // Auto-detect if installer should be shown
    if ('serviceWorker' in navigator && 
        !window.matchMedia('(display-mode: standalone)').matches &&
        !localStorage.getItem('quantum_installer_dismissed')) {
      setShowQuantumInstaller(true);
    }

    // Global quantum effects
    const createGlobalParticles = () => {
      const particleCount = 100;
      const particlesContainer = document.getElementById('quantum-global-particles');
      if (!particlesContainer) return;
      
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
    };
  }, [searchParams]);

  // Update URL when active tab changes
  useEffect(() => {
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
  const renderActiveTab = () => {
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
            background: `linear-gradient(135deg, var(--quantum-plasma), var(--quantum-hyperpurple))`
          }}
        >
          <i className="fas fa-redo"></i> Quantum Reboot
        </button>
        <button 
          className="btn btn-quantum-secondary"
          onClick={() => navigateToTab('community')}
        >
          <i className="fas fa-share-alt"></i> Quantum Community
        </button>
      </div>
      <div className="quantum-tips">
        <p><strong>Quantum Tips:</strong></p>
        <ul>
          <li>Ensure quantum entanglement (WebGL) is enabled</li>
          <li>Update quantum drivers (Graphics drivers)</li>
          <li>Check reality field stability (Browser compatibility)</li>
          <li>Adjust quantum coherence settings (Disable hardware acceleration blockers)</li>
        </ul>
      </div>
      <div className="quantum-stats">
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
  );

  // ========== RENDER JSX ==========
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

      {/* Quantum Visual Effects Containers */}
      <div className="quantum-visual-effects">
        <div id="quantum-particle-field" className="quantum-particle-field"></div>
        <div id="interference-patterns" className="interference-patterns"></div>
        <div id="quantum-global-particles" className="quantum-global-particles"></div>
      </div>

      {/* Quantum Visual Effects */}
      <div className="quantum-scan-line"></div>
      <div className="quantum-hologram-effect"></div>
      <div className="quantum-distortion-field"></div>

      {/* Quantum Header */}
      <header className="quantum-header">
        <div className="quantum-logo">
          <div className="logo-quantum-animation">
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
        
        {/* NAVIGATION - FIXED TO MATCH CSS */}
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
            <button className="btn btn-quantum-secondary" onClick={handleImportWorld} data-action="import">
              <i className="fas fa-folder-open"></i>
              <span>Quantum Import</span>
            </button>
            <button className="btn btn-quantum-primary" onClick={handleExportWorld} data-action="export">
              <i className="fas fa-download"></i>
              <span>Quantum Export</span>
            </button>
            <button className="btn btn-quantum-accent" onClick={handleShareWorld} data-action="share">
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
              {quantumState && (
                <div className="avatar-quantum-stats">
                  <div className="avatar-stat" title={`Chaos: ${Math.round(chaosLevel)}%`}>
                    <div className="stat-bar">
                      <div className="stat-fill" style={{width: `${chaosLevel}%`}}></div>
                    </div>
                  </div>
                </div>
              )}
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
                  <h2 className="quantum-world-title" id="quantumWorldTitle">
                    <span className="world-name">Quantum Reality: {worldName}</span>
                    {encryptedParams.source === 'shared' && (
                      <span className="quantum-shared-badge" title="Quantum Shared via encrypted link">
                        <i className="fas fa-lock"></i> Quantum Encrypted
                      </span>
                    )}
                    {webGLError && (
                      <span className="quantum-error-badge-global" title="Quantum Rendering Error">
                        <i className="fas fa-radiation"></i> Reality Unstable
                      </span>
                    )}
                    {quantumEffects.length > 0 && (
                      <span className="quantum-effects-indicator">
                        <i className="fas fa-bolt"></i> {quantumEffects.length} Active Effects
                      </span>
                    )}
                  </h2>
                  <div className="quantum-world-actions">
                    <button className="btn btn-quantum-secondary" id="quantumToggleGrid" onClick={() => addNotification('Quantum Grid Manipulation - Coming soon', 'info')}>
                      <i className="fas fa-th"></i>
                      <span>Quantum Grid</span>
                    </button>
                    <button className="btn btn-quantum-danger" id="quantumClearWorld" onClick={handleClearWorld}>
                      <i className="fas fa-trash"></i>
                      <span>Collapse Reality</span>
                    </button>
                    <button className="btn btn-quantum-success" id="quantumNewWorld" onClick={handleNewWorld}>
                      <i className="fas fa-plus"></i>
                      <span>New Reality</span>
                    </button>
                  </div>
                </div>

                <div className="quantum-world-overlay"></div>
                {webGLError ? renderQuantumErrorFallback() : renderActiveTab()}
                <div className="quantum-drop-zone" id="dropZone"></div>

                {/* Quantum Stats Overlay */}
                {quantumState && (
                  <div className="quantum-stats-overlay">
                    <div className="quantum-stat">
                      <div className="stat-label">Quantum Field</div>
                      <div className="stat-value">{Math.round(quantumField * 100)}%</div>
                      <div className="stat-bar">
                        <div className="stat-fill" style={{width: `${quantumField * 100}%`}}></div>
                      </div>
                    </div>
                    <div className="quantum-stat">
                      <div className="stat-label">Temporal Displacement</div>
                      <div className="stat-value">{temporalDisplacement.toFixed(1)}</div>
                      <div className="stat-indicator" style={{
                        left: `${50 + temporalDisplacement * 5}%`
                      }}></div>
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
                {activeTab === 'community' && (
                  <button className="btn btn-quantum-accent" onClick={handleShareWorld}>
                    <i className="fas fa-share"></i> Share Quantum Reality
                  </button>
                )}
              </div>
              <div className="quantum-tab-inner">
                {renderActiveTab()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quantum Installer Modal - Using existing CSS classes */}
      {showQuantumInstaller && (
        <div className="quantum-notification quantum-notification show info" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10002,
          maxWidth: '600px',
          width: '90%'
        }}>
          <div className="quantum-notification-header">
            <div className="notification-quantum-icon">
              <i className="fas fa-atom fa-spin"></i>
            </div>
            <div className="quantum-notification-title">
              🚀 Install Modz Quantum
            </div>
            <button 
              className="quantum-notification-time"
              onClick={dismissQuantumInstaller}
              style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer'}}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="quantum-notification-message">
            <p>Choose your installation method:</p>
            
            <div className="installer-options" style={{marginTop: '20px'}}>
              {/* PWA Option */}
              <div className="quantum-effect-item" style={{marginBottom: '15px'}}>
                <div style={{flex: 1}}>
                  <h4 style={{margin: '0 0 5px 0'}}>
                    <i className="fas fa-mobile-alt" style={{marginRight: '10px'}}></i>
                    Standard PWA
                  </h4>
                  <p style={{margin: '0', fontSize: '14px', opacity: 0.8}}>
                    Basic Progressive Web App installation
                  </p>
                  <div style={{display: 'flex', gap: '10px', marginTop: '10px', fontSize: '12px'}}>
                    <span><i className="fas fa-check"></i> Works everywhere</span>
                    <span><i className="fas fa-check"></i> Offline support</span>
                    <span><i className="fas fa-check"></i> Auto-updates</span>
                  </div>
                </div>
                <button 
                  className="btn btn-quantum-small"
                  onClick={handlePWAInstall}
                  disabled={!deferredPrompt}
                  style={{minWidth: '120px'}}
                >
                  {deferredPrompt ? 'Install PWA' : 'Manual Install'}
                </button>
              </div>
              
              {/* CWA Option */}
              <div className="quantum-effect-item" style={{borderLeftColor: 'var(--quantum-warning)'}}>
                <div style={{flex: 1}}>
                  <h4 style={{margin: '0 0 5px 0'}}>
                    <i className="fas fa-bolt" style={{marginRight: '10px'}}></i>
                    Advanced CWA <span style={{
                      background: 'var(--quantum-warning)',
                      color: 'var(--quantum-whitehole)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      marginLeft: '5px'
                    }}>⚡ NEW</span>
                  </h4>
                  <p style={{margin: '0', fontSize: '14px', opacity: 0.8}}>
                    ChromeBook Web App with advanced optimizations
                  </p>
                  <div style={{display: 'flex', gap: '10px', marginTop: '10px', fontSize: '12px', flexWrap: 'wrap'}}>
                    <span><i className="fas fa-check"></i> 40FPS Performance</span>
                    <span><i className="fas fa-check"></i> School Bypass</span>
                    <span><i className="fas fa-check"></i> Stealth Mode</span>
                    <span><i className="fas fa-check"></i> Memory Optimized</span>
                  </div>
                </div>
                <button 
                  className="btn btn-quantum-small"
                  onClick={handleCWAInstall}
                  style={{
                    minWidth: '120px',
                    background: 'linear-gradient(135deg, var(--quantum-warning), #ffaa00)'
                  }}
                >
                  Install CWA
                </button>
              </div>
            </div>
            
            <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
              <p style={{margin: '0 0 10px 0', fontSize: '12px', opacity: 0.8}}>
                <i className="fas fa-lightbulb"></i> 
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
      <div className="quantum-notification-container" id="quantumNotificationContainer">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`quantum-notification show ${notification.type}`}
            data-chaos={notification.chaosLevel}
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
              <div className="quantum-notification-time">
                {new Date(notification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            <div className="quantum-notification-message">{notification.message}</div>
            <div className="quantum-notification-progress"></div>
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
            <small>Drop into quantum reality field</small>
          </div>
          <div className="quantum-dragging-effects">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="dragging-effect"></div>
            ))}
          </div>
        </div>
      )}

      {/* Quantum Effects Display */}
      {quantumEffects.length > 0 && (
        <div className="quantum-effects-display">
          <div className="effects-header">
            <i className="fas fa-bolt"></i>
            <span>Active Quantum Effects</span>
          </div>
          <div className="effects-list">
            {quantumEffects.map(effect => (
              <div key={effect.id} className="quantum-effect-item">
                <div className="effect-type">{effect.type}</div>
                <div className="effect-intensity">
                  <div className="intensity-bar">
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
        <div className="quantum-session-indicator">
          <div className="indicator-content">
            <i className="fas fa-lock"></i>
            <span>Quantum Encrypted Session</span>
            <div className="indicator-stats">
              <span className="stat">RC: {realityCoefficient.toFixed(2)}</span>
              <span className="stat">CL: {Math.round(chaosLevel)}%</span>
            </div>
          </div>
          <button onClick={() => window.location.href = window.location.pathname}>
            <i className="fas fa-times"></i>
          </button>
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
          <div className="status-item">
            <div className="status-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="status-content">
              <div className="status-label">Time Shift</div>
              <div className="status-value">{temporalDisplacement.toFixed(1)}</div>
            </div>
          </div>
        </div>
        <div className="status-actions">
          <button className="btn btn-quantum-small" onClick={() => setShowQuantumInstaller(true)}>
            <i className="fas fa-download"></i>
          </button>
          <button className="btn btn-quantum-small" onClick={generateQuantumShareLink}>
            <i className="fas fa-share"></i>
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
          >
            <div className="install-button-quantum">
              <i className="fas fa-atom fa-spin"></i>
              <span>Install Quantum Reality</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// Main export with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={
      <div className="quantum-loading-screen">
        <div className="quantum-loading-animation">
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
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
{/* Add these elements to your JSX return statement */}
<div className="performance-indicator">
  <i className="fas fa-tachometer-alt"></i>
  <span>Performance Mode: <span id="performance-level">Normal</span></span>
</div>

<div className="performance-stats">
  <div className="stat">
    <span className="stat-label">FPS:</span>
    <span className="stat-value" id="fps-counter">60</span>
  </div>
  <div className="stat">
    <span className="stat-label">Memory:</span>
    <span className="stat-value" id="memory-usage">--</span>
  </div>
  <div className="stat">
    <span className="stat-label">GPU:</span>
    <span className="stat-value" id="gpu-info">--</span>
  </div>
</div>

<button className="performance-toggle" id="performanceToggle">
  <i className="fas fa-cog"></i>
  <span>Performance</span>
</button>

<div className="fps-counter" id="fpsDisplay">60 FPS</div>

<div className="memory-warning" id="memoryWarning">
  <h3>⚠️ Low Memory Detected</h3>
  <p>Your device has limited memory (<span id="detected-memory">--</span>GB).</p>
  <p>Enabling Extreme Performance Mode to prevent crashes...</p>
  <div className="memory-warning-buttons">
    <button className="btn btn-quantum" onClick={window.enableExtremePerformance}>
      Enable Extreme Mode
    </button>
    <button 
      className="btn btn-quantum-secondary" 
      onClick={() => document.getElementById('memoryWarning').classList.remove('show')}
    >
      Continue Anyway
    </button>
  </div>
</div>
// ===== PERFORMANCE DETECTION & 40FPS OPTIMIZER =====

// Performance Detection & 40FPS Optimizer
(function() {
  console.log('🔧 Performance Optimizer v1.0 - Scanning device...');
  
  let performanceLevel = 'high';
  let detectedMemory = 8; // Default to 8GB
  
  // Detect device memory if available
  if (navigator.deviceMemory) {
    detectedMemory = navigator.deviceMemory;
    console.log('💾 Detected memory:', detectedMemory + 'GB');
  }
  
  // Detect CPU cores
  const cpuCores = navigator.hardwareConcurrency || 4;
  console.log('⚙️ CPU Cores:', cpuCores);
  
  // Detect WebGL capability
  let webglScore = 1;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        webglScore = renderer.includes('NVIDIA') || renderer.includes('AMD') || 
                     renderer.includes('RTX') || renderer.includes('Intel Iris') ? 2 : 1;
      }
    }
  } catch (e) {}
  
  // Calculate performance score
  const performanceScore = (detectedMemory * 0.4) + (cpuCores * 0.3) + (webglScore * 0.3);
  console.log('📊 Performance Score:', performanceScore.toFixed(2));
  
  // Apply performance classes
  if (performanceScore < 3) {
    performanceLevel = 'extreme';
    document.body.classList.add('extreme-performance-mode', 'low-performance');
    console.log('🚨 EXTREME PERFORMANCE MODE ACTIVATED');
  } else if (performanceScore < 6) {
    performanceLevel = 'low';
    document.body.classList.add('low-performance');
    console.log('⚠️ LOW PERFORMANCE MODE ACTIVATED');
  } else if (performanceScore < 9) {
    performanceLevel = 'medium';
    document.body.classList.add('medium-performance');
    console.log('🔶 MEDIUM PERFORMANCE MODE ACTIVATED');
  }
  
  // Update performance indicator
  const indicator = document.querySelector('.performance-indicator');
  if (indicator) {
    document.getElementById('performance-level').textContent = 
      performanceLevel.charAt(0).toUpperCase() + performanceLevel.slice(1);
  }
  
  // FPS Counter
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;
  const fpsDisplay = document.getElementById('fpsDisplay');
  const fpsCounter = document.getElementById('fps-counter');
  
  function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;
      
      if (fpsDisplay) {
        fpsDisplay.textContent = `${fps} FPS`;
        fpsDisplay.classList.toggle('low', fps < 30);
      }
      if (fpsCounter) {
        fpsCounter.textContent = fps;
      }
      
      // Dynamic adjustment based on FPS
      if (fps < 25 && !document.body.classList.contains('extreme-performance-mode')) {
        document.body.classList.add('extreme-performance-mode');
        console.log('📉 FPS dropped below 25, enabling extreme mode');
      }
    }
    requestAnimationFrame(updateFPS);
  }
  
  // Memory monitoring
  if ('memory' in performance) {
    setInterval(() => {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
      const memoryElement = document.getElementById('memory-usage');
      if (memoryElement) {
        memoryElement.textContent = `${memoryUsage.toFixed(1)} MB`;
        
        // Show warning if memory usage is high
        if (memoryUsage > 500 && detectedMemory < 4) {
          document.getElementById('memoryWarning').classList.add('show');
          document.getElementById('detected-memory').textContent = detectedMemory;
        }
      }
    }, 5000);
  }
  
  // GPU detection
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const gpuElement = document.getElementById('gpu-info');
        if (gpuElement) {
          // Shorten GPU name for display
          const shortRenderer = renderer.length > 20 ? 
            renderer.substring(0, 20) + '...' : renderer;
          gpuElement.textContent = shortRenderer;
          
          // Detect integrated graphics
          if (renderer.includes('Intel') && !renderer.includes('Iris')) {
            document.body.classList.add('low-performance');
            console.log('🖥️ Integrated GPU detected, enabling low performance mode');
          }
        }
      }
    }
  } catch (e) {}
  
  // Performance toggle functionality
  const performanceToggle = document.getElementById('performanceToggle');
  if (performanceToggle) {
    performanceToggle.addEventListener('click', function() {
      const body = document.body;
      const isExtreme = body.classList.contains('extreme-performance-mode');
      const isLow = body.classList.contains('low-performance');
      
      if (isExtreme) {
        body.classList.remove('extreme-performance-mode');
        body.classList.add('low-performance');
        console.log('⬆️ Switched to Low Performance Mode');
      } else if (isLow) {
        body.classList.remove('low-performance');
        console.log('⬆️ Switched to Normal Mode');
      } else {
        body.classList.add('extreme-performance-mode');
        console.log('⬇️ Switched to Extreme Performance Mode');
      }
      
      // Show notification
      if (window.addNotification) {
        const mode = body.classList.contains('extreme-performance-mode') ? 'Extreme' :
                    body.classList.contains('low-performance') ? 'Low' : 'Normal';
        window.addNotification(`Performance mode: ${mode}`, 'info');
      }
    });
  }
  
  // Start FPS counter
  requestAnimationFrame(updateFPS);
  
  // Show performance stats on Ctrl+Shift+P
  let statsVisible = false;
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      statsVisible = !statsVisible;
      document.querySelector('.performance-stats').classList.toggle('show', statsVisible);
    }
  });
  
  console.log('✅ Performance optimization complete. Mode:', performanceLevel);
  
  // Export functions for manual control
  window.enableExtremePerformance = function() {
    document.body.classList.add('extreme-performance-mode');
    if (document.getElementById('memoryWarning')) {
      document.getElementById('memoryWarning').classList.remove('show');
    }
    if (window.addNotification) {
      window.addNotification('Extreme performance mode enabled', 'info');
    }
  };
})();
