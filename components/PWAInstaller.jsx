'use client';
import { useState, useEffect, useRef } from 'react';
import { quantumInstallation, getQuantumStateSummary } from '~/quantum-installation';

export default function QuantumPWAInstaller({ addNotification }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [quantumState, setQuantumState] = useState(null);
  const [chaosLevel, setChaosLevel] = useState(0);
  const [quantumField, setQuantumField] = useState(0);
  const [activeEffect, setActiveEffect] = useState(null);
  const [installationStage, setInstallationStage] = useState(null);
  const [quantumProgress, setQuantumProgress] = useState(0);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particleSystemRef = useRef(null);

  useEffect(() => {
    // Initialize quantum system
    const initializeQuantum = async () => {
      try {
        const state = getQuantumStateSummary();
        setQuantumState(state);
        setChaosLevel(state.chaosLevel);
        setQuantumField(state.quantumFieldStrength);
        
        // Subscribe to quantum events
        window.addEventListener('quantum-state-change', handleQuantumStateChange);
        window.addEventListener('quantum-chaos-trigger', handleChaosTrigger);
        window.addEventListener('quantum-installation-progress', handleInstallationProgress);
        window.addEventListener('quantum-field-strength-change', handleFieldStrengthChange);
        
        // Start quantum visualization
        startQuantumVisualization();
      } catch (error) {
        console.error('Quantum initialization failed:', error);
      }
    };

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = window.navigator.standalone;
      const quantumInstalled = localStorage.getItem('modz_quantum_installed') === 'true';
      setIsInstalled(isStandalone || isInWebApp || quantumInstalled);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('🌀 Quantum install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Store the event for later use
      window.deferredPrompt = e;
      
      // Trigger quantum event
      quantumInstallation.triggerQuantumEvent('INSTALL_PROMPT_AVAILABLE', { 
        event: e,
        timestamp: Date.now()
      });
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ Quantum PWA installed successfully');
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.setItem('modz_quantum_installed', 'true');
      
      if (addNotification) {
        addNotification('Modz installed successfully! Quantum entanglement established.', 'success');
      }
      
      quantumInstallation.triggerQuantumEvent('APP_INSTALLED', { 
        timestamp: Date.now()
      });
    };

    // Listen for display mode changes
    const handleDisplayMode = (e) => {
      setIsInstalled(e.matches);
      quantumInstallation.triggerQuantumEvent('DISPLAY_MODE_CHANGED', { 
        mode: e.matches ? 'standalone' : 'browser',
        timestamp: Date.now()
      });
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    displayModeMediaQuery.addEventListener('change', handleDisplayMode);

    // Register quantum service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-quantum.js')
        .then(registration => {
          console.log('✅ Quantum Service Worker registered:', registration);
          
          // Send quantum configuration to service worker
          registration.active?.postMessage({
            type: 'INIT_QUANTUM',
            quantumState: quantumInstallation.getState(),
            timestamp: Date.now()
          });
        })
        .catch(error => {
          console.error('❌ Quantum Service Worker registration failed:', error);
          // Fallback to regular service worker
          navigator.serviceWorker.register('/sw.js');
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
      
      quantumInstallation.triggerQuantumEvent('INSTALL_CRITERIA_CHECKED', { 
        canInstall,
        timestamp: Date.now()
      });
    };

    checkInstallCriteria();
    initializeQuantum();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeMediaQuery.removeEventListener('change', handleDisplayMode);
      
      window.removeEventListener('quantum-state-change', handleQuantumStateChange);
      window.removeEventListener('quantum-chaos-trigger', handleChaosTrigger);
      window.removeEventListener('quantum-installation-progress', handleInstallationProgress);
      window.removeEventListener('quantum-field-strength-change', handleFieldStrengthChange);
      
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [addNotification]);

  // Quantum event handlers
  const handleQuantumStateChange = (event) => {
    const state = getQuantumStateSummary();
    setQuantumState(state);
    setChaosLevel(state.chaosLevel);
    setQuantumField(state.quantumFieldStrength);
  };

  const handleChaosTrigger = (event) => {
    const { type, intensity } = event.detail;
    setActiveEffect({ type, intensity });
    
    // Clear effect after duration
    setTimeout(() => {
      setActiveEffect(null);
    }, 2000);
  };

  const handleInstallationProgress = (event) => {
    const { stage, progress } = event.detail;
    setInstallationStage(stage);
    setQuantumProgress(progress);
  };

  const handleFieldStrengthChange = (event) => {
    const { quantumFieldStrength } = event.detail;
    setQuantumField(quantumFieldStrength);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (addNotification) {
        addNotification('Quantum install not available on this reality plane', 'warning');
      }
      return;
    }

    try {
      // Start quantum installation
      setInstallationStage('quantum_initialization');
      setQuantumProgress(10);
      
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`🌀 User quantum response: ${outcome}`);
      
      if (outcome === 'accepted') {
        // Advanced quantum installation
        await performQuantumInstallation();
        
        if (addNotification) {
          addNotification('Modz installation complete! Quantum entanglement established.', 'success');
        }
      } else {
        if (addNotification) {
          addNotification('Installation collapsed by observer effect', 'info');
        }
      }
      
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setIsInstallable(false);
      
    } catch (error) {
      console.error('Quantum installation error:', error);
      if (addNotification) {
        addNotification('Installation failed due to quantum decoherence', 'error');
      }
    }
  };

  const performQuantumInstallation = async () => {
    try {
      const config = {
        colorScheme: 'quantum_purple',
        windowMode: 'quantum_floating',
        performanceProfile: 'quantum',
        chaosSettings: {
          particleDensity: 75,
          attractorStrength: 85,
          chaosAmplification: 60
        },
        quantumSettings: {
          superpositionDepth: 5,
          entanglementRange: 1500,
          quantumTunnelingProbability: 0.05
        }
      };
      
      // Use the quantum installation manager
      await quantumInstallation.installWithQuantumEntanglement(config);
      
    } catch (error) {
      console.error('Quantum installation failed:', error);
      throw error;
    }
  };

  const handleAdvancedInstall = () => {
    // Show advanced quantum installation wizard
    quantumInstallation.showAdvancedInstallationWizard().then(config => {
      if (config) {
        localStorage.setItem('modz_quantum_config', JSON.stringify(config));
        
        if (addNotification) {
          addNotification('Quantum configuration complete. Reality coefficient adjusted.', 'success');
        }
        
        // Apply quantum styling
        applyQuantumStyling(config.colorScheme, config.windowMode);
      }
    });
  };

  const applyQuantumStyling = (colorScheme = 'quantum_purple', windowMode = 'quantum_floating') => {
    // Apply quantum CSS variables
    const scheme = quantumInstallation.quantumConfig.colorSchemes[colorScheme];
    const mode = quantumInstallation.quantumConfig.windowModes[windowMode];
    
    // Update CSS variables
    document.documentElement.style.setProperty('--quantum-primary', scheme.primary);
    document.documentElement.style.setProperty('--quantum-secondary', scheme.secondary);
    document.documentElement.style.setProperty('--quantum-accent', scheme.accent);
    document.documentElement.style.setProperty('--quantum-background', scheme.background);
    document.documentElement.style.setProperty('--quantum-surface', scheme.surface);
    document.documentElement.style.setProperty('--quantum-field', scheme.quantum_field);
    document.documentElement.style.setProperty('--quantum-chaos', scheme.chaos_stream);
    document.documentElement.style.setProperty('--quantum-temporal', scheme.temporal_flux);
    document.documentElement.style.setProperty('--quantum-spatial', scheme.spatial_grid);
    document.documentElement.style.setProperty('--quantum-reality', scheme.reality_border);
    
    // Apply window mode styles
    if (mode.transparent) {
      document.documentElement.style.setProperty('--window-background', 'transparent');
    }
    
    if (mode.vibrancy) {
      document.documentElement.style.setProperty('--window-vibrancy', 'blur(20px)');
    }
  };

  const startQuantumVisualization = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 400;
    canvas.height = 300;
    
    particleSystemRef.current = {
      particles: [],
      attractors: [],
      time: 0
    };
    
    // Initialize quantum particles
    for (let i = 0; i < 50; i++) {
      particleSystemRef.current.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        color: `hsla(${Math.random() * 360}, 100%, 70%, ${Math.random() * 0.5 + 0.3})`,
        charge: Math.random() > 0.5 ? 1 : -1,
        life: Math.random() * 100 + 50
      });
    }
    
    // Initialize strange attractors
    for (let i = 0; i < 3; i++) {
      particleSystemRef.current.attractors.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        strength: Math.random() * 0.5 + 0.5,
        type: ['lorenz', 'rossler', 'aizawa'][i]
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw quantum field
      drawQuantumField(ctx, canvas);
      
      // Update and draw particles
      updateParticles(ctx, canvas);
      
      // Draw attractors
      drawAttractors(ctx);
      
      // Draw interference patterns
      drawInterferencePatterns(ctx, canvas);
      
      particleSystemRef.current.time += 0.01;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const drawQuantumField = (ctx, canvas) => {
    const time = particleSystemRef.current.time;
    const fieldStrength = quantumField * 100;
    
    // Create gradient for quantum field
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    
    gradient.addColorStop(0, `hsla(270, 100%, 60%, ${0.1 * fieldStrength / 100})`);
    gradient.addColorStop(0.5, `hsla(200, 100%, 50%, ${0.05 * fieldStrength / 100})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw field lines
    ctx.strokeStyle = `hsla(${time * 50 % 360}, 100%, 70%, 0.3)`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 100 + Math.sin(time + i) * 50;
      
      ctx.beginPath();
      for (let r = 0; r < radius; r += 5) {
        const x = canvas.width / 2 + Math.cos(angle) * r;
        const y = canvas.height / 2 + Math.sin(angle) * r;
        const offset = Math.sin(time + r * 0.1) * 10;
        
        if (r === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x + offset, y + offset);
        }
      }
      ctx.stroke();
    }
  };

  const updateParticles = (ctx, canvas) => {
    const particles = particleSystemRef.current.particles;
    const attractors = particleSystemRef.current.attractors;
    const time = particleSystemRef.current.time;
    const chaos = chaosLevel / 100;
    
    particles.forEach(particle => {
      // Apply attractor forces
      attractors.forEach(attractor => {
        const dx = attractor.x - particle.x;
        const dy = attractor.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = attractor.strength * (100 - distance) / 100;
          particle.vx += (dx / distance) * force * 0.05;
          particle.vy += (dy / distance) * force * 0.05;
        }
      });
      
      // Apply chaos
      particle.vx += (Math.random() - 0.5) * chaos * 0.5;
      particle.vy += (Math.random() - 0.5) * chaos * 0.5;
      
      // Apply quantum fluctuations
      particle.vx += Math.sin(time + particle.x * 0.01) * 0.1;
      particle.vy += Math.cos(time + particle.y * 0.01) * 0.1;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // Boundary checking
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.5;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.5;
      particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      
      // Create glow effect
      const glow = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 3
      );
      
      glow.addColorStop(0, particle.color);
      glow.addColorStop(1, particle.color.replace(')', ', 0)'));
      
      ctx.fillStyle = glow;
      ctx.fill();
      
      // Draw connection lines
      if (Math.random() < 0.1 * chaos) {
        particles.forEach(other => {
          if (particle === other) return;
          
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 50 && Math.random() < 0.3) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `hsla(${Math.random() * 360}, 100%, 70%, ${0.2 * (1 - distance / 50)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }
      
      // Update life
      particle.life -= 0.5;
      if (particle.life <= 0) {
        // Respawn particle
        particle.x = Math.random() * canvas.width;
        particle.y = Math.random() * canvas.height;
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = (Math.random() - 0.5) * 2;
        particle.life = Math.random() * 100 + 50;
      }
    });
  };

  const drawAttractors = (ctx) => {
    const attractors = particleSystemRef.current.attractors;
    const time = particleSystemRef.current.time;
    
    attractors.forEach(attractor => {
      // Draw attractor core
      const gradient = ctx.createRadialGradient(
        attractor.x, attractor.y, 0,
        attractor.x, attractor.y, 20
      );
      
      gradient.addColorStop(0, `hsla(${time * 100 % 360}, 100%, 60%, 1)`);
      gradient.addColorStop(1, `hsla(${time * 100 % 360}, 100%, 60%, 0)`);
      
      ctx.beginPath();
      ctx.arc(attractor.x, attractor.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw attractor field
      ctx.beginPath();
      ctx.arc(attractor.x, attractor.y, 50, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${time * 100 % 360}, 100%, 60%, 0.2)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const drawInterferencePatterns = (ctx, canvas) => {
    const time = particleSystemRef.current.time;
    
    // Draw quantum interference pattern
    ctx.strokeStyle = `hsla(${time * 50 % 360}, 100%, 70%, 0.3)`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < canvas.width; i += 10) {
      const x = i;
      const y = canvas.height / 2 + Math.sin(i * 0.1 + time) * 30 + Math.sin(i * 0.05 + time * 2) * 20;
      
      ctx.beginPath();
      ctx.moveTo(x, canvas.height / 2);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  // Don't show installer if already installed
  if (isInstalled) {
    return null;
  }

  // Only show on supported browsers
  if (!isInstallable) {
    return null;
  }

  // Get current color scheme from quantum config
  const colorScheme = quantumInstallation?.quantumConfig?.colorSchemes?.quantum_purple || {
    primary: '#6c5ce7',
    secondary: '#a29bfe',
    accent: '#fd79a8',
    background: '#000814',
    surface: '#0f0f23'
  };

  return (
    <div className="quantum-installer">
      {/* Background canvas for quantum effects */}
      <canvas 
        ref={canvasRef} 
        className="quantum-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      
      <div className="quantum-installer-card">
        {/* Quantum Header */}
        <div className="quantum-header">
          <div className="quantum-logo">
            <div className="quantum-spinner"></div>
            <div className="quantum-orb"></div>
            <div className="quantum-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </div>
          
          <div className="quantum-title">
            <h3>Quantum Installation</h3>
            <div className="quantum-subtitle">
              <span className="badge quantum-badge">QUANTUM ENTANGLED</span>
              <span className="chaos-level">Chaos: {Math.round(chaosLevel)}%</span>
            </div>
          </div>
          
          <div className="quantum-stats">
            <div className="stat">
              <div className="stat-label">Field Strength</div>
              <div className="stat-value">{Math.round(quantumField * 100)}%</div>
              <div className="stat-bar">
                <div 
                  className="stat-fill" 
                  style={{ width: `${quantumField * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Installation Progress */}
        {installationStage && (
          <div className="quantum-progress">
            <div className="progress-header">
              <span className="stage-name">{installationStage.replace('_', ' ')}</span>
              <span className="stage-progress">{Math.round(quantumProgress)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${quantumProgress}%` }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            <div className="progress-particles">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i}
                  className="progress-particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    opacity: Math.random() * 0.5 + 0.3
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quantum Features */}
        <div className="quantum-features">
          <div className="feature-grid">
            <div className="quantum-feature">
              <div className="feature-icon">🌀</div>
              <div className="feature-content">
                <h4>Quantum Entanglement</h4>
                <p>Instant sync across all realities</p>
              </div>
            </div>
            
            <div className="quantum-feature">
              <div className="feature-icon">🌌</div>
              <div className="feature-content">
                <h4>Temporal Manipulation</h4>
                <p>Control the flow of time</p>
              </div>
            </div>
            
            <div className="quantum-feature">
              <div className="feature-icon">⚛️</div>
              <div className="feature-content">
                <h4>Reality Warping</h4>
                <p>Bend space to your will</p>
              </div>
            </div>
            
            <div className="quantum-feature">
              <div className="feature-icon">🌀</div>
              <div className="feature-content">
                <h4>Chaos Engine</h4>
                <p>Powered by strange attractors</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Effects */}
        {activeEffect && (
          <div className="active-effect">
            <div className="effect-badge">
              {activeEffect.type} - {activeEffect.intensity}%
            </div>
          </div>
        )}
        
        {/* Installation Actions */}
        <div className="quantum-actions">
          <button 
            className="btn-quantum-install"
            onClick={handleInstallClick}
            style={{
              background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`,
              boxShadow: `0 0 30px ${colorScheme.primary}80`
            }}
          >
            <span className="btn-glow"></span>
            <span className="btn-content">
              <span className="btn-icon">⚡</span>
              <span className="btn-text">Initiate Quantum Installation</span>
            </span>
            <span className="btn-particles">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="btn-particle"></span>
              ))}
            </span>
          </button>
          
          <div className="secondary-actions">
            <button 
              className="btn-quantum-advanced"
              onClick={handleAdvancedInstall}
              style={{
                borderColor: colorScheme.secondary,
                color: colorScheme.secondary
              }}
            >
              <span className="btn-icon">⚙️</span>
              Quantum Configuration
            </button>
            
            <button 
              className="btn-quantum-info"
              onClick={() => addNotification('Quantum installation collapses reality waves into actuality', 'info')}
            >
              <span className="btn-icon">ℹ️</span>
              Quantum Mechanics
            </button>
          </div>
        </div>
        
        {/* Quantum Status */}
        <div className="quantum-status">
          <div className="status-item">
            <div className="status-dot" style={{ background: colorScheme.primary }}></div>
            <span>Superposition: {quantumState?.superpositionState || 'uncollapsed'}</span>
          </div>
          <div className="status-item">
            <div className="status-dot" style={{ background: colorScheme.accent }}></div>
            <span>Reality Coeff: {quantumState?.realityCoefficient?.toFixed(2) || '1.00'}</span>
          </div>
          <div className="status-item">
            <div className="status-dot" style={{ background: colorScheme.secondary }}></div>
            <span>Temporal Displacement: {quantumState?.temporalDisplacement?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .quantum-installer {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 99999;
          animation: quantumAppear 1s cubic-bezier(0.34, 1.56, 0.64, 1);
          width: 500px;
          max-width: 90vw;
        }
        
        .quantum-installer-card {
          position: relative;
          background: linear-gradient(135deg, 
            var(--quantum-background, rgba(15, 20, 25, 0.98)) 0%,
            var(--quantum-surface, rgba(10, 15, 20, 0.95)) 100%);
          backdrop-filter: var(--window-vibrancy, blur(30px)) saturate(180%);
          border-radius: 25px;
          padding: 30px;
          border: 1px solid var(--quantum-field, rgba(108, 92, 231, 0.4));
          box-shadow: 
            0 25px 70px rgba(0, 0, 0, 0.9),
            0 0 100px var(--quantum-primary, rgba(108, 92, 231, 0.3)),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform-style: preserve-3d;
          perspective: 1000px;
          overflow: hidden;
        }
        
        .quantum-installer-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent,
            var(--quantum-chaos, rgba(162, 155, 254, 0.3)),
            var(--quantum-temporal, rgba(253, 121, 168, 0.3)),
            var(--quantum-spatial, rgba(0, 206, 201, 0.3)),
            transparent
          );
          animation: rotate 20s linear infinite;
          pointer-events: none;
          opacity: 0.5;
        }
        
        .quantum-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          position: relative;
          z-index: 2;
        }
        
        .quantum-logo {
          position: relative;
          width: 60px;
          height: 60px;
        }
        
        .quantum-spinner {
          width: 60px;
          height: 60px;
          border: 2px solid transparent;
          border-top-color: var(--quantum-primary, #6c5ce7);
          border-radius: 50%;
          animation: spin 2s linear infinite;
        }
        
        .quantum-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: radial-gradient(circle, var(--quantum-primary, #6c5ce7), var(--quantum-secondary, #a29bfe));
          border-radius: 50%;
          box-shadow: 0 0 20px var(--quantum-primary, #6c5ce7);
        }
        
        .quantum-rings {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .ring {
          position: absolute;
          border: 1px solid;
          border-radius: 50%;
          animation: pulse 3s ease-in-out infinite;
        }
        
        .ring-1 {
          width: 40px;
          height: 40px;
          border-color: var(--quantum-secondary, #a29bfe);
          animation-delay: 0s;
        }
        
        .ring-2 {
          width: 50px;
          height: 50px;
          border-color: var(--quantum-accent, #fd79a8);
          animation-delay: 0.5s;
        }
        
        .ring-3 {
          width: 60px;
          height: 60px;
          border-color: var(--quantum-primary, #6c5ce7);
          animation-delay: 1s;
        }
        
        .quantum-title h3 {
          margin: 0;
          font-size: 24px;
          background: linear-gradient(45deg, var(--quantum-secondary, #a29bfe), var(--quantum-primary, #6c5ce7));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        
        .quantum-subtitle {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 5px;
        }
        
        .quantum-badge {
          background: linear-gradient(135deg, var(--quantum-primary, #6c5ce7), var(--quantum-accent, #fd79a8));
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .chaos-level {
          color: var(--quantum-secondary, #a29bfe);
          font-size: 12px;
          font-family: monospace;
        }
        
        .quantum-stats {
          margin-left: auto;
        }
        
        .stat {
          min-width: 120px;
        }
        
        .stat-label {
          font-size: 11px;
          color: var(--quantum-secondary, #a29bfe);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--quantum-primary, #6c5ce7);
          margin-bottom: 5px;
        }
        
        .stat-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .stat-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--quantum-primary, #6c5ce7), var(--quantum-accent, #fd79a8));
          border-radius: 2px;
          transition: width 0.5s ease-out;
        }
        
        .quantum-progress {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 25px;
          border: 1px solid var(--quantum-field, rgba(108, 92, 231, 0.2));
          position: relative;
          overflow: hidden;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .stage-name {
          color: var(--quantum-secondary, #a29bfe);
          font-size: 14px;
          text-transform: capitalize;
        }
        
        .stage-progress {
          color: var(--quantum-primary, #6c5ce7);
          font-size: 18px;
          font-weight: 700;
          font-family: monospace;
        }
        
        .progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, 
            var(--quantum-primary, #6c5ce7), 
            var(--quantum-accent, #fd79a8),
            var(--quantum-primary, #6c5ce7));
          background-size: 200% 100%;
          animation: gradientShift 2s linear infinite;
          border-radius: 3px;
          position: relative;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .progress-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: glowMove 1.5s ease-in-out infinite;
        }
        
        .progress-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .progress-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: var(--quantum-primary, #6c5ce7);
          border-radius: 50%;
          animation: floatUp 2s ease-in infinite;
        }
        
        .quantum-features {
          margin: 30px 0;
        }
        
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .quantum-feature {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 15px;
          border: 1px solid rgba(108, 92, 231, 0.1);
          transition: all 0.3s ease;
        }
        
        .quantum-feature:hover {
          background: rgba(108, 92, 231, 0.1);
          transform: translateY(-2px);
          border-color: rgba(108, 92, 231, 0.3);
        }
        
        .feature-icon {
          font-size: 24px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(108, 92, 231, 0.1);
          border-radius: 12px;
        }
        
        .feature-content h4 {
          margin: 0 0 5px 0;
          color: var(--quantum-secondary, #a29bfe);
          font-size: 14px;
        }
        
        .feature-content p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }
        
        .active-effect {
          margin: 20px 0;
          text-align: center;
        }
        
        .effect-badge {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(253, 121, 168, 0.2);
          border: 1px solid rgba(253, 121, 168, 0.4);
          border-radius: 20px;
          color: var(--quantum-accent, #fd79a8);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          animation: pulseEffect 2s ease-in-out infinite;
        }
        
        .quantum-actions {
          margin: 30px 0;
        }
        
        .btn-quantum-install {
          position: relative;
          width: 100%;
          padding: 25px;
          border: none;
          border-radius: 15px;
          color: white;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          margin-bottom: 20px;
        }
        
        .btn-quantum-install:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 
            0 20px 50px var(--quantum-primary, rgba(108, 92, 231, 0.5)),
            0 0 80px var(--quantum-accent, rgba(253, 121, 168, 0.3));
        }
        
        .btn-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: rotate 3s linear infinite;
          opacity: 0.5;
        }
        
        .btn-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }
        
        .btn-icon {
          font-size: 24px;
        }
        
        .btn-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .btn-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: particleFloat 3s ease-in infinite;
        }
        
        .secondary-actions {
          display: flex;
          gap: 15px;
        }
        
        .btn-quantum-advanced, .btn-quantum-info {
          flex: 1;
          padding: 15px;
          background: transparent;
          border: 1px solid;
          border-radius: 12px;
          color: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }
        
        .btn-quantum-advanced:hover {
          background: rgba(108, 92, 231, 0.1);
          transform: translateY(-2px);
        }
        
        .btn-quantum-info:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }
        
        .quantum-status {
          display: flex;
          justify-content: space-between;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes quantumAppear {
          0% {
            opacity: 0;
            transform: translateY(100px) scale(0.8) rotateX(-20deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        @keyframes glowMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes floatUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        @keyframes particleFloat {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx, 100px), var(--ty, -100px));
            opacity: 0;
          }
        }
        
        @keyframes pulseEffect {
          0%, 100% {
            box-shadow: 0 0 10px rgba(253, 121, 168, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(253, 121, 168, 0.6);
          }
        }
        
        /* Generate random particle animations */
        .btn-particle:nth-child(1) { --tx: 50px; --ty: -50px; top: 20%; left: 10%; animation-delay: 0s; }
        .btn-particle:nth-child(2) { --tx: -80px; --ty: -30px; top: 30%; left: 30%; animation-delay: 0.2s; }
        .btn-particle:nth-child(3) { --tx: 70px; --ty: -80px; top: 40%; left: 50%; animation-delay: 0.4s; }
        .btn-particle:nth-child(4) { --tx: -60px; --ty: -60px; top: 20%; left: 70%; animation-delay: 0.6s; }
        .btn-particle:nth-child(5) { --tx: 90px; --ty: -40px; top: 60%; left: 20%; animation-delay: 0.8s; }
        .btn-particle:nth-child(6) { --tx: -70px; --ty: -70px; top: 70%; left: 40%; animation-delay: 1s; }
        .btn-particle:nth-child(7) { --tx: 80px; --ty: -50px; top: 50%; left: 60%; animation-delay: 1.2s; }
        .btn-particle:nth-child(8) { --tx: -90px; --ty: -60px; top: 80%; left: 80%; animation-delay: 1.4s; }
      `}</style>
    </div>
  );
}
