// Chaos.jsx – The Ultimate Chaos Engine for Quantum Modz3.0
// Production-ready, immersive, and deeply integrated with your quantum system.
// When imported into page.jsx, it gradually corrupts all real components
// via CSS, WebGL, physics, and version swapping. Press Ctrl+Shift+C to open.

'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
  createContext,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Glitch, EffectComposer } from '@react-three/postprocessing';
import p5 from 'p5';
import Matter from 'matter-js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import CryptoJS from 'crypto-js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import {
  X,
  Zap,
  Skull,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Code,
  Package,
  Users,
  User,
} from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import classNames from 'classnames';

// ============================================================================
// 1. IMPORT THE REAL COMPONENTS (for direct reference – used in overlay)
// ============================================================================
import ThreeWorld from '@/Src/ThreeWorlds';
import CodeEditor from '@/CodeEditor';
import ModManager from '@/ModManager';
import Community from '@/Community';
import Profile from '@/Profile';
import CWAInstaller from '@/CWAInstaller';
import QuantumPWAInstaller from '@/PWAInstaller';

// ============================================================================
// 2. CHAOS CONTEXT & PROVIDER (syncs with quantum system)
// ============================================================================
const ChaosContext = createContext(null);

export const useChaos = () => useContext(ChaosContext);

export const ChaosProvider = ({ children }) => {
  const [chaosLevel, setChaosLevel] = useState(0); // 0..100 from quantum system
  const [manualOverride, setManualOverride] = useState(false);
  const [manualLevel, setManualLevel] = useState(0);
  const [corruptionRate, setCorruptionRate] = useState(0.5); // not used if synced
  const [chaosHistory, setChaosHistory] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(1.0);
  const [showOverlay, setShowOverlay] = useState(false); // toggle floating broken components

  // Sync with quantum system via events
  useEffect(() => {
    const handleQuantumChange = (e) => {
      const level = e.detail?.chaosLevel ?? e.detail?.quantumState?.chaosLevel ?? 0;
      if (!manualOverride) {
        setChaosLevel(level);
        // Record history
        setChaosHistory((h) => [...h.slice(-50), { time: Date.now(), level }]);
      }
    };
    window.addEventListener('quantum-state-change', handleQuantumChange);
    window.addEventListener('quantum-chaos-trigger', handleQuantumChange);

    // Fallback: if no quantum system, start a gentle random walk
    if (typeof window !== 'undefined' && !window.quantumState) {
      const interval = setInterval(() => {
        if (!manualOverride) {
          setChaosLevel((prev) => {
            const change = (Math.random() - 0.5) * 5;
            const newLevel = Math.min(100, Math.max(0, prev + change));
            setChaosHistory((h) => [...h.slice(-50), { time: Date.now(), level: newLevel }]);
            return newLevel;
          });
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    return () => {
      window.removeEventListener('quantum-state-change', handleQuantumChange);
      window.removeEventListener('quantum-chaos-trigger', handleQuantumChange);
    };
  }, [manualOverride]);

  // Effective chaos level (manual or quantum)
  const effectiveChaos = manualOverride ? manualLevel : chaosLevel;

  // Trigger a chaos spike
  const spike = useCallback((amount = 20) => {
    if (manualOverride) {
      setManualLevel((prev) => Math.min(100, prev + amount));
    } else {
      // Dispatch event to quantum system
      window.dispatchEvent(
        new CustomEvent('quantum-chaos-trigger', {
          detail: { type: 'spike', intensity: amount },
        })
      );
    }
    toast.custom(
      (t) => (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
        >
          <Zap className="w-6 h-6" />
          <span className="font-bold">CHAOS SPIKE +{amount}%</span>
        </motion.div>
      ),
      { duration: 2000 }
    );
  }, [manualOverride]);

  // Reset chaos
  const reset = useCallback(() => {
    if (manualOverride) {
      setManualLevel(0);
    } else {
      window.dispatchEvent(new CustomEvent('quantum-chaos-trigger', { detail: { reset: true } }));
    }
    setChaosHistory([]);
    toast.success('Chaos neutralized (for now)');
  }, [manualOverride]);

  // Toggle physics (Matter.js)
  const togglePhysics = useCallback(() => {
    setPhysicsEnabled((p) => !p);
    toast(physicsEnabled ? 'Physics disabled' : 'Physics enabled – brace for impact!');
  }, [physicsEnabled]);

  // Toggle floating broken component overlay
  const toggleOverlay = useCallback(() => {
    setShowOverlay((p) => !p);
  }, []);

  return (
    <ChaosContext.Provider
      value={{
        chaosLevel: effectiveChaos,
        rawChaosLevel: chaosLevel,
        manualOverride,
        setManualOverride,
        manualLevel,
        setManualLevel,
        corruptionRate,
        setCorruptionRate,
        chaosHistory,
        enabled,
        setEnabled,
        glitchIntensity,
        setGlitchIntensity,
        spike,
        reset,
        physicsEnabled,
        togglePhysics,
        showOverlay,
        toggleOverlay,
      }}
    >
      {children}
      {/* Global CSS variables for corruption – applied to :root */}
      <style jsx global>{`
        :root {
          --chaos-level: ${effectiveChaos};
          --chaos-intensity: ${(effectiveChaos / 100) * glitchIntensity};
          --chaos-hue: calc(var(--chaos-intensity) * 180deg);
          --chaos-blur: calc(var(--chaos-intensity) * 2px);
          --chaos-skew: calc(var(--chaos-intensity) * 3deg);
          --chaos-scale: ${1 + (effectiveChaos / 100) * glitchIntensity * 0.1};
        }
        /* Optional: apply to body via CorruptionInjector */
      `}</style>
    </ChaosContext.Provider>
  );
};

// ============================================================================
// 3. GLOBAL CORRUPTION EFFECTS (CSS filters, transforms)
// ============================================================================
const CorruptionInjector = () => {
  const { chaosLevel, glitchIntensity, enabled } = useChaos();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (!enabled) {
      document.body.style.filter = '';
      document.body.style.transform = '';
      return;
    }
    const intensity = (chaosLevel / 100) * glitchIntensity;
    if (reducedMotion) {
      // Only apply subtle effects
      document.body.style.filter = `hue-rotate(${intensity * 90}deg)`;
      document.body.style.transform = '';
    } else {
      // Use GSAP for smooth animation
      gsap.to(document.body, {
        filter: `hue-rotate(${intensity * 180}deg) blur(${intensity * 2}px)`,
        transform: `skew(${intensity * 3}deg) scale(${1 + intensity * 0.1})`,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [chaosLevel, glitchIntensity, enabled, reducedMotion]);

  return null;
};

// ============================================================================
// 4. P5.JS GLITCH OVERLAY
// ============================================================================
const P5Glitch = () => {
  const { chaosLevel, enabled } = useChaos();
  const canvasRef = useRef();
  const p5Instance = useRef();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (!enabled || reducedMotion || !canvasRef.current) return;

    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.noStroke();
      };

      p.draw = () => {
        p.clear();
        const intensity = chaosLevel / 100;
        if (intensity < 0.1) return;

        // Glitch rectangles
        for (let i = 0; i < 20 * intensity; i++) {
          p.fill(
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 100 * intensity
          );
          p.rect(
            Math.random() * p.width,
            Math.random() * p.height,
            Math.random() * 200 * intensity,
            Math.random() * 50 * intensity
          );
        }

        // Scanlines
        p.stroke(0, 0, 0, 50 * intensity);
        p.strokeWeight(1);
        for (let y = 0; y < p.height; y += 4) {
          p.line(0, y, p.width, y);
        }
      };
    };

    p5Instance.current = new p5(sketch, canvasRef.current);
    return () => p5Instance.current.remove();
  }, [chaosLevel, enabled, reducedMotion]);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
};

// ============================================================================
// 5. THREE.JS CHAOS FIELD (background)
// ============================================================================
const ChaosField = () => {
  const { chaosLevel, enabled } = useChaos();
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current || !enabled) return;
    const intensity = chaosLevel / 100;
    meshRef.current.rotation.x += 0.005 * intensity;
    meshRef.current.rotation.y += 0.01 * intensity;
    meshRef.current.scale.setScalar(1 + intensity * 0.5);
  });

  if (!enabled) return null;

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[2, 0.5, 128, 16]} />
        <meshStandardMaterial color="#e84393" emissive="#6c5ce7" wireframe />
      </mesh>
      <EffectComposer>
        <Glitch
          delay={new THREE.Vector2(0.5, 1.5)}
          duration={new THREE.Vector2(0.1, 0.3)}
          strength={new THREE.Vector2(0.1, 0.3).multiplyScalar(chaosLevel / 100)}
        />
      </EffectComposer>
    </>
  );
};

// ============================================================================
// 6. MATTER.JS PHYSICS FOR FLOATING UI (optional)
// ============================================================================
const PhysicsEngine = ({ children }) => {
  const { physicsEnabled, enabled } = useChaos();
  const containerRef = useRef();
  const engineRef = useRef();
  const runnerRef = useRef();
  const bodiesRef = useRef([]);

  useEffect(() => {
    if (!physicsEnabled || !enabled || !containerRef.current) return;

    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Walls
    const walls = [
      Matter.Bodies.rectangle(window.innerWidth / 2, -50, window.innerWidth, 100, { isStatic: true }),
      Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true }),
      Matter.Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true }),
      Matter.Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true }),
    ];
    Matter.World.add(engine.world, walls);

    const childElements = containerRef.current.children;
    bodiesRef.current = Array.from(childElements).map((el) => {
      const rect = el.getBoundingClientRect();
      const body = Matter.Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height,
        { restitution: 0.8, friction: 0.1, mass: 1 }
      );
      Matter.World.add(engine.world, body);
      return { body, el };
    });

    const update = () => {
      bodiesRef.current.forEach(({ body, el }) => {
        const { x, y } = body.position;
        el.style.transform = `translate(${x - el.offsetWidth / 2}px, ${y - el.offsetHeight / 2}px) rotate(${body.angle}rad)`;
      });
      requestAnimationFrame(update);
    };
    update();

    return () => {
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [physicsEnabled, enabled]);

  return <div ref={containerRef} style={{ position: 'relative' }}>{children}</div>;
};

// ============================================================================
// 7. FLOATING BROKEN COMPONENTS OVERLAY
// ============================================================================
const BrokenComponentOverlay = () => {
  const { showOverlay, chaosLevel } = useChaos();
  const components = useMemo(
    () => [
      { name: 'ThreeWorld', Comp: ThreeWorld },
      { name: 'CodeEditor', Comp: CodeEditor },
      { name: 'ModManager', Comp: ModManager },
      { name: 'Community', Comp: Community },
      { name: 'Profile', Comp: Profile },
      { name: 'CWAInstaller', Comp: CWAInstaller },
      { name: 'PWAInstaller', Comp: QuantumPWAInstaller },
    ],
    []
  );
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (!showOverlay) {
      setVisible([]);
      return;
    }
    // Spawn random broken components based on chaos level
    const interval = setInterval(() => {
      const randomComp = components[Math.floor(Math.random() * components.length)];
      const id = uuidv4();
      setVisible((prev) => {
        // Keep max 5 floating windows
        const newVis = [...prev, { id, ...randomComp }];
        return newVis.slice(-5);
      });
      // Auto-remove after a few seconds
      setTimeout(() => {
        setVisible((prev) => prev.filter((v) => v.id !== id));
      }, 5000 + Math.random() * 3000);
    }, 2000 / (chaosLevel / 10 + 1));
    return () => clearInterval(interval);
  }, [showOverlay, chaosLevel, components]);

  return (
    <AnimatePresence>
      {visible.map(({ id, name, Comp }) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, scale: 0.5, x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', damping: 20 }}
          style={{
            position: 'fixed',
            top: '20%',
            left: '20%',
            width: '400px',
            height: '300px',
            background: 'rgba(20,10,30,0.9)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #e84393',
            borderRadius: '16px',
            overflow: 'hidden',
            zIndex: 10000,
            boxShadow: '0 0 50px #e84393',
            pointerEvents: 'none', // make non-interactive to avoid interfering
          }}
        >
          <div style={{ padding: '10px', background: '#e84393', color: 'white', fontWeight: 'bold' }}>
            {name} [BROKEN]
          </div>
          <div style={{ padding: '10px', height: 'calc(100% - 40px)', overflow: 'auto' }}>
            <Comp
              // Pass dummy props – these components expect certain props, so we provide minimal
              addNotification={console.log}
              worldName="Chaos Realm"
              onModDrop={() => {}}
              quantumEffects={{ chaosLevel }}
              reducedMotion={false}
              highContrast={false}
              performanceMode={{ lowQuality: true }}
            />
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

// ============================================================================
// 8. CHAOS CONTROL PANEL (UI)
// ============================================================================
const ChaosPanel = () => {
  const {
    chaosLevel,
    rawChaosLevel,
    manualOverride,
    setManualOverride,
    manualLevel,
    setManualLevel,
    corruptionRate,
    setCorruptionRate,
    chaosHistory,
    enabled,
    setEnabled,
    glitchIntensity,
    setGlitchIntensity,
    spike,
    reset,
    togglePhysics,
    physicsEnabled,
    showOverlay,
    toggleOverlay,
  } = useChaos();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chaos');

  // Keyboard shortcut: Ctrl+Shift+C toggles panel, Ctrl+Shift+X spikes
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        spike(30);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        toggleOverlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [spike, toggleOverlay]);

  return (
    <TooltipPrimitive.Provider>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-20 right-5 w-96 bg-gray-900/95 backdrop-blur-xl border-2 border-pink-500 rounded-2xl shadow-2xl text-white p-5 z-[9999] font-mono"
            role="dialog"
            aria-label="Chaos Engine Control Panel"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                <Skull className="w-6 h-6 text-pink-500" />
                CHAOS ENGINE
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                aria-label="Close panel"
              >
                <X />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4">
              {['chaos', 'graphs', 'export'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={classNames(
                    'px-3 py-1 rounded-lg capitalize transition',
                    activeTab === tab
                      ? 'bg-pink-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Chaos Controls */}
            {activeTab === 'chaos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Master Chaos</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Manual Override</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualOverride}
                      onChange={(e) => setManualOverride(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Chaos Level</span>
                    <span className="text-pink-400">{Math.round(chaosLevel)}%</span>
                    {manualOverride && (
                      <span className="text-xs text-gray-400">(manual: {Math.round(manualLevel)}%)</span>
                    )}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={manualOverride ? manualLevel : chaosLevel}
                    onChange={(e) => manualOverride && setManualLevel(parseInt(e.target.value))}
                    disabled={!manualOverride}
                    className="w-full accent-pink-500"
                  />
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${chaosLevel}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm block mb-1">
                    Glitch Intensity: {glitchIntensity.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={glitchIntensity}
                    onChange={(e) => setGlitchIntensity(parseFloat(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div className="flex gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => spike(20)}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Zap className="w-4 h-4" /> SPIKE
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition"
                  >
                    RESET
                  </button>
                  <button
                    onClick={togglePhysics}
                    className={classNames(
                      'flex-1 py-2 rounded-lg transition',
                      physicsEnabled ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'
                    )}
                  >
                    {physicsEnabled ? 'PHYSICS ON' : 'PHYSICS'}
                  </button>
                  <button
                    onClick={toggleOverlay}
                    className={classNames(
                      'flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1',
                      showOverlay ? 'bg-pink-600 hover:bg-pink-700' : 'bg-gray-700 hover:bg-gray-600'
                    )}
                  >
                    {showOverlay ? <Eye /> : <EyeOff />} OVERLAY
                  </button>
                </div>
              </div>
            )}

            {/* Graphs */}
            {activeTab === 'graphs' && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chaosHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="time" tick={false} />
                    <YAxis domain={[0, 100]} stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #e84393' }}
                    />
                    <Line type="monotone" dataKey="level" stroke="#e84393" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Export/Import */}
            {activeTab === 'export' && (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const state = {
                      chaosLevel: manualOverride ? manualLevel : chaosLevel,
                      glitchIntensity,
                      physicsEnabled,
                      showOverlay,
                    };
                    const encrypted = CryptoJS.AES.encrypt(
                      JSON.stringify(state),
                      'chaos-secret'
                    ).toString();
                    const blob = new Blob([encrypted], { type: 'text/plain' });
                    saveAs(blob, `chaos-${Date.now()}.chaos`);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export Chaos State
                </button>
                <input
                  type="file"
                  accept=".chaos"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const decrypted = CryptoJS.AES.decrypt(
                          ev.target.result,
                          'chaos-secret'
                        ).toString(CryptoJS.enc.Utf8);
                        const state = JSON.parse(decrypted);
                        setGlitchIntensity(state.glitchIntensity);
                        if (state.physicsEnabled) togglePhysics(); // simplistic
                        if (state.showOverlay) toggleOverlay();
                        toast.success('Chaos state loaded');
                      } catch {
                        toast.error('Invalid chaos file');
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="hidden"
                  id="chaos-upload"
                />
                <label
                  htmlFor="chaos-upload"
                  className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Import Chaos State
                </label>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500 text-center border-t border-gray-800 pt-3">
              <div>Ctrl+Shift+C: toggle panel</div>
              <div>Ctrl+Shift+X: chaos spike</div>
              <div>Ctrl+Shift+O: toggle overlay</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Provider>
  );
};

// ============================================================================
// 9. VERSION RANDOMIZER (writes to localStorage to flip component versions)
// ============================================================================
const VersionRandomizer = () => {
  const { chaosLevel, enabled } = useChaos();
  const COMPONENT_NAMES = [
    'ThreeWorld',
    'CodeEditor',
    'ModManager',
    'Community',
    'Profile',
    'CWAInstaller',
    'QuantumPWAInstaller',
  ];
  const VERSIONS = ['stable', 'lite', 'broken'];

  useEffect(() => {
    if (!enabled || chaosLevel < 10) return;

    const randomize = () => {
      try {
        const stored = localStorage.getItem('quantum-component-versions');
        const current = stored ? JSON.parse(stored) : {};
        const newVersions = { ...current };
        const flipCount = Math.floor((chaosLevel / 100) * COMPONENT_NAMES.length * 0.3) + 1;
        for (let i = 0; i < flipCount; i++) {
          const randomComponent =
            COMPONENT_NAMES[Math.floor(Math.random() * COMPONENT_NAMES.length)];
          const randomVersion = VERSIONS[Math.floor(Math.random() * VERSIONS.length)];
          newVersions[randomComponent] = randomVersion;
        }
        localStorage.setItem('quantum-component-versions', JSON.stringify(newVersions));
        // Notify page.jsx
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'quantum-component-versions',
            newValue: JSON.stringify(newVersions),
          })
        );
      } catch (e) {
        console.error('Version randomizer error', e);
      }
    };

    const interval = setInterval(randomize, 5000 / (chaosLevel / 10 + 1));
    return () => clearInterval(interval);
  }, [chaosLevel, enabled, COMPONENT_NAMES, VERSIONS]);

  return null;
};

// ============================================================================
// 10. UTILITY: useMediaQuery
// ============================================================================
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query, matches]);
  return matches;
}

// ============================================================================
// 11. MAIN EXPORT: ChaosEngine (combines everything)
// ============================================================================
export default function ChaosEngine() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Avoid SSR mismatch

  return (
    <ChaosProvider>
      <CorruptionInjector />
      <P5Glitch />
      <VersionRandomizer />
      <BrokenComponentOverlay />

      {/* Three.js background – only render if needed (performance) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <Canvas>
          <ChaosField />
        </Canvas>
      </div>

      <ChaosPanel />
      <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
    </ChaosProvider>
  );
}

// Export context and provider for advanced usage
export { useChaos, ChaosProvider };
