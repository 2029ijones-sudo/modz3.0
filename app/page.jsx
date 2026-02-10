'use client';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import CryptoJS from 'crypto-js';
import './globals.css';

// Dynamically import components for better performance
const ThreeWorld = dynamic(() => import('../components/ThreeWorld'), { 
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
const CodeEditor = dynamic(() => import('../components/CodeEditor'), { ssr: false });
const ModManager = dynamic(() => import('../components/ModManager'), { ssr: false });
const Community = dynamic(() => import('../components/Community'), { ssr: false });
const Profile = dynamic(() => import('../components/Profile'), { ssr: false });
const QuantumPWAInstaller = dynamic(() => import('../components/PWAInstaller'), { ssr: false });

// Quantum Installation System
import { quantumInstallation, getQuantumStateSummary } from '~/quantum-installation';

// Encryption key (in production, store in environment variables)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'quantum-mods-secret-key-2024';

// Function to encrypt URL parameters with quantum enhancement
const encryptData = (data) => {
  try {
    // Add quantum entropy to encryption
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

// Main component wrapper that handles routing
function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('world');
  const [showEditor, setShowEditor] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [worldName, setWorldName] = useState('Quantum Metaverse');
  const [encryptedParams, setEncryptedParams] = useState({});
  const cursorRef = useRef(null);
  const cursorTracerRef = useRef(null);
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
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particleSystemRef = useRef(null);

  // Initialize Quantum System
  const initializeQuantumSystem = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        // Get initial quantum state
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

        // Initialize quantum particles for global effects
        initializeGlobalQuantumEffects();

        console.log('🌀 Quantum system initialized');
      } catch (error) {
        console.error('Quantum initialization failed:', error);
      }
    }
  }, []);

  // Handle quantum events
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
        // Update state based on event
        const state = getQuantumStateSummary();
        setQuantumState(state);
        setChaosLevel(state.chaosLevel);
        setQuantumField(state.quantumFieldStrength);
    }
  }, []);

  // Handle quantum chaos triggers
  const handleQuantumChaosTrigger = useCallback((detail) => {
    const { type, intensity = 50 } = detail;
    
    // Add quantum effect
    const effectId = Date.now();
    const newEffect = {
      id: effectId,
      type,
      intensity,
      timestamp: Date.now()
    };
    
    setQuantumEffects(prev => [...prev, newEffect]);
    
    // Trigger visual effect
    createQuantumVisualEffect(type, intensity);
    
    // Auto-remove effect after duration
    setTimeout(() => {
      setQuantumEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 3000);
    
    // Add notification
    addNotification(`Quantum ${type} effect triggered!`, 'info');
  }, []);

  // Handle quantum anomalies
  const handleQuantumAnomaly = useCallback((detail) => {
    const { strength, position } = detail;
    
    // Create anomaly visual effect
    createAnomalyEffect(position, strength);
    
    // Apply effects based on anomaly
    if (strength > 0.7) {
      // Strong anomaly - cause reality distortion
      window.dispatchEvent(new CustomEvent('reality-distortion', {
        detail: { intensity: strength }
      }));
      addNotification('Reality anomaly detected! Reality coefficient fluctuating.', 'warning');
    }
  }, []);

  // Handle quantum vortices
  const handleQuantumVortex = useCallback((detail) => {
    const { type, strength, position } = detail;
    
    // Create vortex visual effect
    createVortexEffect(type, position, strength);
    
    // Apply time dilation for temporal vortices
    if (type.includes('temporal')) {
      window.dispatchEvent(new CustomEvent('time-dilation', {
        detail: { factor: 1 + strength * 0.5 }
      }));
      addNotification('Temporal vortex detected! Time dilation active.', 'info');
    }
  }, []);

  // Initialize global quantum effects
  const initializeGlobalQuantumEffects = useCallback(() => {
    // Create quantum particle field for background
    createQuantumParticleField();
    
    // Initialize quantum interference patterns
    createInterferencePatterns();
    
    // Start reality coefficient pulsing
    startRealityCoefficientPulse();
  }, []);

  // Create quantum particle field
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

  // Create interference patterns
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

  // Start reality coefficient pulse
  const startRealityCoefficientPulse = () => {
    const pulseEffect = () => {
      const pulse = document.createElement('div');
      pulse.className = 'reality-pulse';
      pulse.style.setProperty('--coefficient', realityCoefficient.toString());
      document.body.appendChild(pulse);
      
      setTimeout(() => pulse.remove(), 2000);
    };
    
    // Pulse periodically based on reality coefficient
    setInterval(pulseEffect, 5000 / realityCoefficient);
  };

  // Start quantum visualization
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
      drawQuantumFieldBackground(ctx, canvas);
      
      // Update and draw particles
      updateQuantumParticles(ctx, canvas);
      
      // Draw attractors
      drawQuantumAttractors(ctx, canvas);
      
      // Draw interference patterns
      drawQuantumInterference(ctx, canvas);
      
      // Draw temporal effects
      drawTemporalEffects(ctx, canvas);
      
      // Update system state
      particleSystemRef.current.time += 0.01;
      particleSystemRef.current.chaos = chaosLevel / 100;
      particleSystemRef.current.quantumField = quantumField;
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  // Draw quantum field background
  const drawQuantumFieldBackground = (ctx, canvas) => {
    const time = particleSystemRef.current.time;
    const fieldStrength = quantumField * 100;
    
    // Create gradient background
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
  };

  // Update quantum particles
  const updateQuantumParticles = (ctx, canvas) => {
    const particles = particleSystemRef.current.particles;
    const attractors = particleSystemRef.current.attractors;
    const time = particleSystemRef.current.time;
    const chaos = particleSystemRef.current.chaos;
    
    particles.forEach((particle, index) => {
      // Apply quantum fluctuations
      particle.vx += Math.sin(time * 0.5 + particle.x * 0.01) * 0.1 * quantumField;
      particle.vy += Math.cos(time * 0.5 + particle.y * 0.01) * 0.1 * quantumField;
      
      // Apply chaos
      particle.vx += (Math.random() - 0.5) * chaos * 0.5;
      particle.vy += (Math.random() - 0.5) * chaos * 0.5;
      
      // Apply attractor forces
      attractors.forEach(attractor => {
        const dx = attractor.x - particle.x;
        const dy = attractor.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < attractor.radius) {
          const force = attractor.strength * (attractor.radius - distance) / attractor.radius;
          const angle = Math.atan2(dy, dx);
          
          particle.vx += Math.cos(angle) * force * 0.05;
          particle.vy += Math.sin(angle) * force * 0.05;
        }
      });
      
      // Apply entanglement effects
      if (particle.entangledWith !== null) {
        const entangledParticle = particles[particle.entangledWith];
        if (entangledParticle) {
          const dx = entangledParticle.x - particle.x;
          const dy = entangledParticle.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            const entanglementForce = 0.01 * (200 - distance) / 200;
            particle.vx += dx * entanglementForce;
            particle.vy += dy * entanglementForce;
          }
        }
      }
      
      // Update position
      particle.x += particle.vx * spatialDistortion;
      particle.y += particle.vy * spatialDistortion;
      
      // Apply friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // Boundary checking with wrap-around
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
      
      // Draw particle with glow
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      
      const glow = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 3
      );
      
      glow.addColorStop(0, particle.color);
      glow.addColorStop(0.5, particle.color.replace(')', ', 0.5)'));
      glow.addColorStop(1, particle.color.replace(')', ', 0)'));
      
      ctx.fillStyle = glow;
      ctx.fill();
      
      // Draw entanglement connections
      if (particle.entangledWith !== null) {
        const entangledParticle = particles[particle.entangledWith];
        if (entangledParticle) {
          const dx = entangledParticle.x - particle.x;
          const dy = entangledParticle.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(entangledParticle.x, entangledParticle.y);
            ctx.strokeStyle = `hsla(${time * 50 % 360}, 100%, 70%, ${0.3 * (1 - distance / 200)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      
      // Update life
      particle.life -= 0.5;
      if (particle.life <= 0) {
        // Quantum particle collapse and rebirth
        particle.x = Math.random() * canvas.width;
        particle.y = Math.random() * canvas.height;
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = (Math.random() - 0.5) * 2;
        particle.life = Math.random() * 200 + 100;
        particle.quantumState = Math.random() > 0.5 ? 'up' : 'down';
        particle.entangledWith = Math.random() > 0.8 ? Math.floor(Math.random() * 100) : null;
      }
    });
  };

  // Draw quantum attractors
  const drawQuantumAttractors = (ctx, canvas) => {
    const attractors = particleSystemRef.current.attractors;
    const time = particleSystemRef.current.time;
    
    attractors.forEach(attractor => {
      // Draw attractor core with pulsating effect
      const pulse = Math.sin(time * 2) * 0.5 + 0.5;
      
      const coreGradient = ctx.createRadialGradient(
        attractor.x, attractor.y, 0,
        attractor.x, attractor.y, 20 + pulse * 10
      );
      
      coreGradient.addColorStop(0, `hsla(${time * 100 % 360}, 100%, 70%, 1)`);
      coreGradient.addColorStop(1, `hsla(${time * 100 % 360}, 100%, 70%, 0)`);
      
      ctx.beginPath();
      ctx.arc(attractor.x, attractor.y, 10 + pulse * 5, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
      
      // Draw attractor field
      ctx.beginPath();
      ctx.arc(attractor.x, attractor.y, attractor.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${time * 100 % 360}, 100%, 70%, 0.1)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  // Draw quantum interference
  const drawQuantumInterference = (ctx, canvas) => {
    const time = particleSystemRef.current.time;
    
    // Draw wave interference patterns
    ctx.strokeStyle = `hsla(${time * 30 % 360}, 100%, 70%, 0.15)`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 50; i++) {
      const frequency = 0.02 + i * 0.001;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 10) {
        const y = canvas.height / 2 + 
                 Math.sin(x * frequency + time) * 50 * spatialDistortion +
                 Math.sin(x * frequency * 2 + time * 1.5) * 30;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    }
  };

  // Draw temporal effects
  const drawTemporalEffects = (ctx, canvas) => {
    const time = particleSystemRef.current.time;
    
    if (Math.abs(temporalDisplacement) > 10) {
      // Draw time dilation effect
      ctx.save();
      
      // Apply time distortion
      const distortion = temporalDisplacement * 0.01;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(time * distortion * 0.1);
      ctx.scale(1 + distortion * 0.1, 1 - distortion * 0.05);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      
      // Draw temporal waves
      ctx.strokeStyle = `hsla(200, 100%, 70%, ${0.1 * Math.abs(temporalDisplacement) / 50})`;
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 5; i++) {
        const radius = 100 + i * 100 + Math.sin(time) * 50;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  };

  // Create quantum visual effects
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

  // Create anomaly effect
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

  // Create vortex effect
  const createVortexEffect = (type, position, strength) => {
    const vortex = document.createElement('div');
    vortex.className = `quantum-vortex quantum-vortex-${type}`;
    vortex.style.left = `${Math.random() * 70 + 15}%`;
    vortex.style.top = `${Math.random() * 70 + 15}%`;
    vortex.style.setProperty('--strength', strength.toString());
    
    document.body.appendChild(vortex);
    
    setTimeout(() => vortex.remove(), 5000);
  };

  // Check WebGL support
  const checkWebGLSupport = useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }, []);

  // Handle WebGL errors from ThreeWorld
  const handleWebGLError = useCallback((errorMessage) => {
    setWebGLError(errorMessage);
    addNotification(`Quantum Rendering Error: ${errorMessage}`, 'error');
    
    // Trigger quantum error event
    quantumInstallation.triggerQuantumEvent('RENDERING_ERROR', {
      error: errorMessage,
      timestamp: Date.now()
    });
  }, []);

  // Decrypt URL parameters on load
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
        
        // Add notification about encrypted session
        if (decrypted.source === 'shared') {
          addNotification(`Loaded quantum-encrypted session from ${decrypted.owner || 'community'}`, 'info');
        }
        
        // Trigger quantum event
        quantumInstallation.triggerQuantumEvent('ENCRYPTED_SESSION_LOADED', decrypted);
      }
    }

    // Check WebGL support on load
    if (!checkWebGLSupport()) {
      handleWebGLError('WebGL is not supported in your browser. Quantum rendering disabled.');
    }

    // Initialize quantum system
    initializeQuantumSystem();
  }, [searchParams, checkWebGLSupport, handleWebGLError, initializeQuantumSystem]);

  // Update URL when active tab changes (with quantum encryption)
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
      // Use replaceState to update URL without refresh
      window.history.replaceState({}, '', `?e=${encrypted}`);
      
      // Trigger quantum navigation event
      quantumInstallation.triggerQuantumEvent('QUANTUM_NAVIGATION', {
        tab: activeTab,
        world: worldName,
        encryptedUrl: encrypted
      });
    }
  }, [activeTab, worldName]);

  // Global quantum effects
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
      
      // Trigger welcome quantum event
      quantumInstallation.triggerQuantumEvent('SYSTEM_INITIALIZED', {
        timestamp: Date.now(),
        chaosLevel: chaosLevel,
        quantumField: quantumField,
        realityCoefficient: realityCoefficient
      });
    }, 1500);
    
    return () => {
      // Clean up animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 3D Quantum Cursor Effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cursor = cursorRef.current;
    const cursorTracer = cursorTracerRef.current;
    let cursorTrail = [];
    const MAX_TRAIL = 15;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (cursor) {
        // Quantum cursor with velocity-based effects
        cursor.style.left = `${e.clientX - 20}px`;
        cursor.style.top = `${e.clientY - 20}px`;
        
        // Add quantum distortion based on velocity and chaos
        const distortion = Math.min(velocity * 0.1 * chaosLevel / 100, 20);
        cursor.style.transform = `translate(-50%, -50%) scale(${1 + distortion * 0.01}) rotate(${distortion}deg)`;
      }

      if (cursorTracer) {
        // Create quantum tracer with entanglement effect
        const tracer = cursorTracer.cloneNode(true);
        tracer.style.left = `${e.clientX}px`;
        tracer.style.top = `${e.clientY}px`;
        tracer.style.opacity = '0.7';
        tracer.style.setProperty('--chaos', `${chaosLevel / 100}`);
        document.body.appendChild(tracer);

        cursorTrail.push(tracer);
        if (cursorTrail.length > MAX_TRAIL) {
          const oldTracer = cursorTrail.shift();
          if (oldTracer.parentNode) {
            oldTracer.style.opacity = '0';
            setTimeout(() => oldTracer.remove(), 300);
          }
        }

        // Update trail with quantum coherence
        cursorTrail.forEach((t, i) => {
          if (t.style.opacity > 0) {
            const coherence = 0.7 * (i / cursorTrail.length) * quantumField;
            t.style.opacity = coherence.toString();
            t.style.transform = `scale(${0.5 + (i / cursorTrail.length) * 0.5})`;
          }
        });

        // Quantum entanglement between trail particles
        if (cursorTrail.length > 2) {
          for (let i = 0; i < cursorTrail.length - 1; i++) {
            if (Math.random() < quantumField * 0.1) {
              const t1 = cursorTrail[i];
              const t2 = cursorTrail[i + 1];
              
              // Create entanglement line
              const line = document.createElement('div');
              line.className = 'quantum-entanglement-line';
              const rect1 = t1.getBoundingClientRect();
              const rect2 = t2.getBoundingClientRect();
              
              line.style.left = `${rect1.left + 8}px`;
              line.style.top = `${rect1.top + 8}px`;
              line.style.width = `${Math.sqrt(
                Math.pow(rect2.left - rect1.left, 2) + 
                Math.pow(rect2.top - rect1.top, 2)
              )}px`;
              line.style.transform = `rotate(${Math.atan2(
                rect2.top - rect1.top, 
                rect2.left - rect1.left
              )}rad)`;
              
              document.body.appendChild(line);
              setTimeout(() => line.remove(), 100);
            }
          }
        }
      }
    };

    const interactiveElements = document.querySelectorAll('.nav-link, .btn, .mod-item, .upload-area, .avatar-3d, .quantum-element');
    
    const handleMouseEnter = () => {
      if (cursor) {
        cursor.style.transform = 'translate(-50%, -50%) scale(2)';
        cursor.style.filter = `drop-shadow(0 0 40px hsl(${Date.now() % 360}, 100%, 70%))`;
        cursor.style.borderColor = `hsl(${Date.now() % 360}, 100%, 70%)`;
        
        // Trigger quantum interaction event
        quantumInstallation.triggerQuantumEvent('QUANTUM_INTERACTION', {
          type: 'hover',
          timestamp: Date.now()
        });
      }
    };
    
    const handleMouseLeave = () => {
      if (cursor) {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.filter = `drop-shadow(0 0 20px var(--quantum-primary))`;
        cursor.style.borderColor = 'var(--quantum-primary)';
      }
    };

    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    window.addEventListener('mousemove', handleMouseMove);

    // Add click quantum effect
    const handleClick = (e) => {
      createQuantumClickEffect(e.clientX, e.clientY);
    };
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [chaosLevel, quantumField]);

  // Create quantum click effect
  const createQuantumClickEffect = (x, y) => {
    const effect = document.createElement('div');
    effect.className = 'quantum-click-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.style.setProperty('--chaos', `${chaosLevel / 100}`);
    effect.style.setProperty('--quantum', `${quantumField}`);
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
      effect.style.transform = 'scale(3)';
      effect.style.opacity = '0';
      setTimeout(() => effect.remove(), 500);
    }, 100);
  };

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
          
          // Add quantum drag effect
          createQuantumDragEffect(e.clientX, e.clientY);
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
          
          // Create quantum drop effect
          createQuantumDropEffect(e.clientX, e.clientY);
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
  }, [activeTab, chaosLevel]);

  // Create quantum drag effect
  const createQuantumDragEffect = (x, y) => {
    const effect = document.createElement('div');
    effect.className = 'quantum-drag-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.style.setProperty('--chaos', `${chaosLevel / 100}`);
    
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
  };

  // Create quantum drop effect
  const createQuantumDropEffect = (x, y) => {
    const effect = document.createElement('div');
    effect.className = 'quantum-drop-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
      effect.style.transform = 'scale(2)';
      effect.style.opacity = '0';
      setTimeout(() => effect.remove(), 500);
    }, 100);
  };

  // Add notification with quantum styling
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
    quantumInstallation.triggerQuantumEvent('NOTIFICATION_ADDED', {
      message,
      type: quantumType,
      timestamp: Date.now()
    });
    
    // Auto-remove notification with quantum decay
    const decayTime = 3000 * (1 + chaosLevel / 100);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, decayTime);
  };

  // Handle ThreeWorld initialization
  const handleThreeWorldReady = useCallback(() => {
    setIsThreeWorldReady(true);
    addNotification('Quantum Reality Field stabilized. 3D World ready!', 'success');
    
    // Trigger quantum world ready event
    quantumInstallation.triggerQuantumEvent('WORLD_READY', {
      timestamp: Date.now(),
      worldName: worldName,
      realityCoefficient: realityCoefficient
    });
  }, [worldName, realityCoefficient]);

  // Handle mod drag from ModManager
  const handleModDragStart = (mod) => {
    setDraggedMod(mod);
    addNotification(`Quantum entanglement established with ${mod.name}`, 'info');
    
    // Trigger quantum drag event
    quantumInstallation.triggerQuantumEvent('MOD_DRAG_START', {
      mod: mod,
      timestamp: Date.now()
    });
  };

  // Handle mod drop into world
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
      
      // Trigger quantum manifestation event
      quantumInstallation.triggerQuantumEvent('MOD_MANIFESTED', {
        mod: draggedMod,
        position: position,
        timestamp: Date.now(),
        quantumState: getQuantumStateSummary()
      });
      
      setDraggedMod(null);
    }
  }, [draggedMod, chaosLevel, realityCoefficient, quantumField]);

  // Navigation functions with quantum encryption
  const navigateToTab = (tab) => {
    setActiveTab(tab);
    setWebGLError(null);
    
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
      console.log('Quantum URL:', url);
      
      // Trigger quantum navigation event
      quantumInstallation.triggerQuantumEvent('TAB_CHANGE', {
        tab: tab,
        encryptedUrl: encrypted,
        timestamp: Date.now()
      });
    }
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
      
      // Copy to clipboard with quantum effect
      navigator.clipboard.writeText(shareUrl).then(() => {
        addNotification('Quantum share link copied to clipboard! Reality entanglement established.', 'success');
        
        // Create quantum copy effect
        createQuantumCopyEffect();
      }).catch(() => {
        // Fallback: show in prompt with quantum styling
        prompt('Quantum Share Link (Encrypted):', shareUrl);
      });
      
      return shareUrl;
    }
    return null;
  };

  // Create quantum copy effect
  const createQuantumCopyEffect = () => {
    const effect = document.createElement('div');
    effect.className = 'quantum-copy-effect';
    effect.style.left = '50%';
    effect.style.top = '50%';
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
      effect.style.transform = 'scale(1.5)';
      effect.style.opacity = '0';
      setTimeout(() => effect.remove(), 500);
    }, 100);
  };

  // Handle world actions with quantum effects
  const handleNewWorld = () => {
    const name = prompt('Enter quantum world name:', `Reality-${Date.now().toString(36)}`);
    if (name) {
      setWorldName(name);
      addNotification(`Quantum world "${name}" created. Reality field initialized.`, 'success');
      
      // Update URL with quantum world data
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
      
      // Trigger quantum world creation event
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
      
      // Trigger quantum clear event
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

  const handleShareWorld = () => {
    const shareLink = generateQuantumShareLink();
    if (shareLink) {
      // Show quantum share dialog
      if (navigator.share) {
        navigator.share({
          title: `Quantum World: ${worldName}`,
          text: `Explore my quantum reality in Modz3.0! Reality Coefficient: ${realityCoefficient.toFixed(2)}`,
          url: shareLink
        });
      }
    }
  };

  // Handle quantum PWA installation
  const handleQuantumInstall = () => {
    addNotification('Quantum installation initiated. Reality synchronization in progress...', 'info');
    
    // Trigger quantum installation event
    quantumInstallation.triggerQuantumEvent('INSTALLATION_INITIATED', {
      timestamp: Date.now(),
      chaosLevel: chaosLevel
    });
  };

  // Dismiss quantum installer
  const dismissQuantumInstaller = () => {
    setShowQuantumInstaller(false);
    localStorage.setItem('quantum_installer_dismissed', 'true');
    addNotification('Quantum installer dismissed. Reality field remains stable.', 'info');
  };

  // Toggle quantum editor
  const toggleQuantumEditor = () => {
    setShowEditor(!showEditor);
    if (!showEditor) {
      addNotification('Quantum code editor activated. Reality manipulation enabled.', 'info');
    }
  };

  // Render active tab content with quantum enhancements
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

      {/* Quantum Cursor System */}
      <div className="quantum-cursor" id="quantumCursor" ref={cursorRef}>
        <div className="cursor-quantum-core"></div>
        <div className="cursor-quantum-ring"></div>
        <div className="cursor-quantum-particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="cursor-particle"></div>
          ))}
        </div>
      </div>
      <div className="quantum-cursor-tracer" id="quantumCursorTracer" ref={cursorTracerRef}></div>

      {/* Quantum Visual Effects */}
      <div className="quantum-scan-line"></div>
      <div className="quantum-hologram-effect"></div>
      <div className="quantum-distortion-field"></div>

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
        {/* Quantum Sidebar - Enhanced */}
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

      {/* Quantum Installer Component */}
      {showQuantumInstaller && (
        <QuantumPWAInstaller 
          addNotification={addNotification}
          onInstall={handleQuantumInstall}
          onDismiss={dismissQuantumInstaller}
          quantumState={quantumState}
        />
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
          <div className="quantum-loading-orb"></div>
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
