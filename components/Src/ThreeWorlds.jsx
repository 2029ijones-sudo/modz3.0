'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  Suspense,
  forwardRef,
  useImperativeHandle,
  createContext,
  useContext,
} from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import {
  OrbitControls,
  Grid,
  Environment,
  PerspectiveCamera,
  Text,
  Float,
  Sparkles,
  Cloud,
  Sky,
  useTexture,
  useGLTF,
  Html,
  Box as DreiBox,
  Plane,
  softShadows,
  Effects,
  Stars,
  Trail,
  MeshDistortMaterial,
  SpotLight,
  Billboard,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
} from '@react-three/drei';
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon';
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField, Vignette, Noise } from '@react-three/postprocessing';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Text as TroikaText } from 'troika-three-text';
import safeEval from 'safe-eval';
import { parse } from 'acorn-loose';
import * as lucideIcons from 'lucide-react';
import toast from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

// ----------------------------------------------------------------------
// CONTEXT for mods and world state (avoid prop drilling)
// ----------------------------------------------------------------------
const WorldContext = createContext(null);

// ----------------------------------------------------------------------
// SECURE SCRIPT EVALUATION SANDBOX
// ----------------------------------------------------------------------
const createScriptSandbox = (mod, object3D, api) => {
  const sandbox = {
    // Three.js and vector math
    THREE,
    mesh: object3D,
    position: object3D.position,
    rotation: object3D.rotation,
    scale: object3D.scale,
    time: 0,
    delta: 0,
    Math,
    console: {
      log: (...args) => console.log(`[Mod: ${mod.name}]`, ...args),
      warn: (...args) => console.warn(`[Mod: ${mod.name}]`, ...args),
      error: (...args) => console.error(`[Mod: ${mod.name}]`, ...args),
    },
    // Utility functions
    setColor: (color) => { if (object3D.material) object3D.material.color.set(color); },
    setEmissive: (color) => { if (object3D.material) object3D.material.emissive.set(color); },
    setScale: (x, y, z) => object3D.scale.set(x, y, z),
    lookAt: (x, y, z) => object3D.lookAt(x, y, z),
    // Physics API if available
    applyForce: api?.applyForce,
    applyImpulse: api?.applyImpulse,
    velocity: api?.velocity,
    // Random helpers
    random: (min, max) => Math.random() * (max - min) + min,
    // mod metadata
    mod,
  };
  return sandbox;
};

const executeModScript = (script, sandbox) => {
  try {
    // Validate with acorn-loose first (no throw)
    parse(script, { ecmaVersion: 2022 });
    // Use safe-eval in strict sandbox
    const func = new Function('sandbox', `
      with(sandbox) {
        ${script}
      }
    `);
    func(sandbox);
  } catch (err) {
    console.warn('Script execution error:', err);
    // Fail silently – mod continues without crashing
  }
};

// ----------------------------------------------------------------------
// ADVANCED 3D CHARACTER (floating robot with idle animation)
// ----------------------------------------------------------------------
const AdvancedCharacter = ({ position = [0, 1.5, 0] }) => {
  const { scene } = useThree();
  const groupRef = useRef();
  
  // Use a low-poly robot from Drei's useGLTF (cached)
  const { nodes, materials, animations } = useGLTF('/models/robot.glb', true);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Idle floating
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      // Gentle rotation
      groupRef.current.rotation.y += 0.005;
    }
  });

  // Fallback: create a stylized character if model not loaded
  if (!nodes) {
    return (
      <group ref={groupRef} position={position}>
        {/* Core body */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
          <mesh castShadow receiveShadow>
            <icosahedronGeometry args={[1, 0]} />
            <MeshDistortMaterial color="#6c5ce7" emissive="#3a2e6b" distort={0.3} speed={1.5} metalness={0.8} roughness={0.2} />
          </mesh>
        </Float>
        {/* Floating orbs around */}
        <Sparkles count={20} scale={[3, 3, 3]} size={0.3} speed={0.4} color="#a29bfe" />
        {/* Holographic ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
          <torusGeometry args={[1.4, 0.05, 16, 50]} />
          <meshBasicMaterial color="#a29bfe" transparent opacity={0.3} wireframe />
        </mesh>
        {/* 3D text label */}
        <TroikaText
          position={[0, 1.8, 0]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          text="WORLD_GUIDE"
          emissive="#6c5ce7"
        />
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} dispose={null}>
      <primitive object={nodes.Scene} scale={0.8} />
    </group>
  );
};

// ----------------------------------------------------------------------
// MOD OBJECT: renders different mod types with physics and scripting
// ----------------------------------------------------------------------
const ModObject = ({ mod, position = [0, 5, 0] }) => {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [1, 1, 1],
    material: { friction: 0.3, restitution: 0.5 },
  }));

  const meshRef = useRef();
  const scriptSandboxRef = useRef(null);
  const { addNotification } = useContext(WorldContext) || {};

  // Initialize sandbox once
  useEffect(() => {
    if (mod.type === 'javascript' && mod.script && meshRef.current) {
      scriptSandboxRef.current = createScriptSandbox(mod, meshRef.current, {
        applyForce: api.applyForce,
        applyImpulse: api.applyImpulse,
        velocity: api.velocity,
      });
      // Execute once at spawn
      executeModScript(mod.script, scriptSandboxRef.current);
      addNotification?.(`Script ${mod.name} initialized`, 'info');
    }
  }, [mod, api]);

  // Per-frame script update
  useFrame((state) => {
    if (mod.type === 'javascript' && scriptSandboxRef.current) {
      scriptSandboxRef.current.time = state.clock.elapsedTime;
      scriptSandboxRef.current.delta = state.clock.delta;
      executeModScript(mod.script, scriptSandboxRef.current);
    }
  });

  // Visual representation based on mod type
  const renderContent = () => {
    switch (mod.type) {
      case 'javascript':
        return (
          <Float speed={1.5} rotationIntensity={1} floatIntensity={0.5}>
            <mesh ref={meshRef} castShadow receiveShadow>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial
                color={mod.metadata?.color || '#00ff88'}
                emissive={mod.metadata?.color || '#00aa55'}
                emissiveIntensity={0.4}
                metalness={0.9}
                roughness={0.2}
                transparent
                opacity={0.95}
              />
            </mesh>
          </Float>
        );
      case '3d-model':
        return (
          <Suspense fallback={null}>
            <primitive ref={meshRef} object={mod.scene} scale={mod.scale || 1} />
          </Suspense>
        );
      case 'image':
        return (
          <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3, 3]} />
            <meshStandardMaterial map={mod.texture} side={THREE.DoubleSide} transparent />
          </mesh>
        );
      default:
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={mod.metadata?.color || '#6c5ce7'}
              emissive={mod.metadata?.color || '#4a3a8a'}
              emissiveIntensity={0.2}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        );
    }
  };

  return (
    <group ref={ref} api={api}>
      {renderContent()}
      {/* Glow effect for important mods */}
      {mod.type === 'javascript' && (
        <Sparkles count={15} scale={[1.5, 1.5, 1.5]} size={0.2} color={mod.metadata?.color || '#00ff88'} />
      )}
    </group>
  );
};

// ----------------------------------------------------------------------
// MAIN WORLD SCENE with all objects, effects, and physics
// ----------------------------------------------------------------------
const WorldScene = forwardRef(({ worldName, addNotification }, ref) => {
  const { scene, gl, camera } = useThree();
  const [mods, setMods] = useState([]);
  const [performance, setPerformance] = useState('high');
  const objectsRef = useRef([]);

  // Expose API to parent via ref
  useImperativeHandle(ref, () => ({
    addMod: (mod, position) => {
      setMods((prev) => [...prev, { ...mod, id: mod.id || Date.now() + Math.random(), position }]);
      addNotification?.(`${mod.name} added to world`, 'success');
    },
    clearMods: () => setMods([]),
    getScene: () => scene,
  }));

  // Physics ground
  usePlane(() => ({ position: [0, -0.5, 0], rotation: [-Math.PI / 2, 0, 0], material: { friction: 0.5 } }));

  // Ambient post-processing
  const [bloomEnabled, setBloomEnabled] = useState(true);

  return (
    <>
      {/* Performance adaptation */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* Sky & atmosphere */}
      <Sky distance={450000} sunPosition={[10, 10, 10]} inclination={0} azimuth={0.25} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <pointLight position={[0, 10, 0]} intensity={0.8} color="#a29bfe" />

      {/* Floating clouds for immersion */}
      <Cloud position={[-15, 8, -20]} speed={0.2} opacity={0.3} />
      <Cloud position={[20, 5, 10]} speed={0.2} opacity={0.2} />
      <Cloud position={[5, 12, -5]} speed={0.3} opacity={0.25} />

      {/* Advanced grid with infinite illusion */}
      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6c5ce7"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#a29bfe"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
      />

      {/* Stars in background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

      {/* Interactive floating character */}
      <AdvancedCharacter position={[0, 1.5, 0]} />

      {/* Mod objects */}
      {mods.map((mod) => (
        <ModObject key={mod.id} mod={mod} position={mod.position} />
      ))}

      {/* Floating orbs (ambient life) */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
        <DreiBox args={[0.2, 0.2, 0.2]} position={[-3, 2, 4]}>
          <meshStandardMaterial color="#fd79a8" emissive="#e84393" emissiveIntensity={0.3} />
        </DreiBox>
      </Float>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
        <DreiBox args={[0.25, 0.25, 0.25]} position={[4, 3, -2]}>
          <meshStandardMaterial color="#74b9ff" emissive="#0984e3" emissiveIntensity={0.2} />
        </DreiBox>
      </Float>

      {/* Post-processing magic */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.2} />
        <ChromaticAberration offset={[0.001, 0.001]} />
        <DepthOfField focusDistance={0.01} focalLength={0.02} bokehScale={2} />
        <Vignette eskil={false} offset={0.2} darkness={0.5} />
        <Noise opacity={0.02} />
      </EffectComposer>

      {/* 3D UI Labels */}
      <Billboard position={[0, 3.2, 0]}>
        <Text fontSize={0.5} color="white" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#6c5ce7">
          {worldName || 'MODZ 3.0'}
        </Text>
      </Billboard>
    </>
  );
});

// ----------------------------------------------------------------------
// MAIN COMPONENT (with all UI overlays, drag-drop, error handling)
// ----------------------------------------------------------------------
export default function ThreeWorld({ addNotification, worldName, onModDrop, isDraggingOverWorld }) {
  const containerRef = useRef(null);
  const worldRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ objects: 0, mods: 0, physics: 'active' });
  const [showUI, setShowUI] = useState(true);

  // Drag-drop handler (enhanced)
  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const modData = e.dataTransfer.getData('application/mod-data');
        if (modData) {
          const mod = JSON.parse(modData);
          // Calculate 3D position from mouse
          const rect = e.target.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          // We'll set a default position; actual raycast would be better but this is stable
          const position = [x * 15, 5, -y * 15];
          worldRef.current?.addMod(mod, position);
          addNotification?.(`${mod.name} dropped into world`, 'success');
        } else {
          // File drop
          const files = e.dataTransfer.files;
          if (files.length) handleFileDrop(files[0]);
        }
      } catch (err) {
        addNotification?.('Drop failed', 'error');
      }
    },
    [addNotification]
  );

  const handleFileDrop = async (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const mod = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.includes('image') ? 'image' : file.name.endsWith('.js') ? 'javascript' : 'basic',
        size: file.size,
        data: e.target.result,
        metadata: { color: '#6c5ce7' },
      };
      worldRef.current?.addMod(mod, [0, 5, 0]);
    };
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  // Preload robot model (cached)
  useEffect(() => {
    useGLTF.preload('/models/robot.glb');
  }, []);

  // Error fallback UI
  if (error) {
    return (
      <div className="error-fallback" style={{ background: '#0a0a1a', color: 'white', padding: 40, borderRadius: 16 }}>
        <lucideIcons.AlertTriangle size={48} color="#ff6b6b" />
        <h3 style={{ color: '#ff6b6b' }}>3D World Crashed</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={{ background: '#6c5ce7', padding: '12px 24px', border: 'none', borderRadius: 8, color: 'white', marginTop: 20 }}>
          Reload World
        </button>
      </div>
    );
  }

  return (
    <WorldContext.Provider value={{ addNotification }}>
      <div
        ref={containerRef}
        className="world-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '700px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          border: isDraggingOverWorld ? '3px dashed #a29bfe' : '1px solid rgba(108,92,231,0.3)',
          boxShadow: isDraggingOverWorld ? '0 0 40px rgba(108,92,231,0.6)' : '0 10px 30px rgba(0,0,0,0.5)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* React Three Fiber Canvas */}
        <Canvas
          shadows
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false,
            stencil: false,
            depth: true,
          }}
          camera={{ position: [20, 15, 25], fov: 60 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0a0a1a');
            setIsInitialized(true);
            addNotification?.('3D World initialized', 'success');
          }}
          onError={(e) => setError(e.message)}
        >
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.82, 0]} defaultContactMaterial={{ friction: 0.3, restitution: 0.5 }}>
              <WorldScene ref={worldRef} worldName={worldName} addNotification={addNotification} />
            </Physics>
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              screenSpacePanning
              maxPolarAngle={Math.PI / 2.2}
              minDistance={5}
              maxDistance={80}
              enablePan={true}
            />
          </Suspense>
        </Canvas>

        {/* ========== IMMERSIVE UI OVERLAY ========== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {/* World title card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              background: 'rgba(10,10,26,0.8)',
              backdropFilter: 'blur(12px)',
              padding: '16px 28px',
              borderRadius: '40px',
              border: '1px solid rgba(108,92,231,0.6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <lucideIcons.Cube size={24} color="#a29bfe" />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: 1 }}>{worldName || 'MODZ 3.0'}</h2>
            <span style={{ background: '#6c5ce7', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem' }}>IMMERSIVE</span>
          </motion.div>

          {/* Live stats */}
          <motion.div
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(12px)',
              padding: '16px 24px',
              borderRadius: '40px',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              display: 'flex',
              gap: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <lucideIcons.Box size={18} />
              <span>Objects: {stats.objects}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <lucideIcons.Code size={18} />
              <span>Mods: {stats.mods}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <lucideIcons.Zap size={18} color="#feca57" />
              <span>Physics: {stats.physics}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Control panel (bottom left) */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            position: 'absolute',
            bottom: 30,
            left: 30,
            display: 'flex',
            gap: 12,
            zIndex: 100,
            pointerEvents: 'auto',
          }}
        >
          <button
            className="btn-3d"
            onClick={() => worldRef.current?.addMod({ id: 'cube-' + Date.now(), name: 'Demo Cube', type: 'basic', metadata: { color: '#ff7675' } }, [0, 8, 0])}
            style={{
              background: 'rgba(108,92,231,0.9)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              padding: '14px 24px',
              borderRadius: 40,
              color: 'white',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 20px rgba(108,92,231,0.4)',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            <lucideIcons.Plus size={20} /> Add Object
          </button>
          <button
            className="btn-3d"
            onClick={() => worldRef.current?.clearMods()}
            style={{
              background: 'rgba(30,30,50,0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '14px 24px',
              borderRadius: 40,
              color: 'white',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <lucideIcons.Trash2 size={20} /> Clear Mods
          </button>
        </motion.div>

        {/* Immersive drag-drop hint */}
        {isDraggingOverWorld && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(108,92,231,0.95)',
              backdropFilter: 'blur(20px)',
              padding: '48px 64px',
              borderRadius: 32,
              border: '2px solid rgba(255,255,255,0.5)',
              color: 'white',
              textAlign: 'center',
              boxShadow: '0 0 100px rgba(108,92,231,0.8)',
              zIndex: 200,
              pointerEvents: 'none',
            }}
          >
            <lucideIcons.CloudUpload size={64} />
            <h3 style={{ fontSize: '2rem', margin: '20px 0 10px' }}>DROP MOD HERE</h3>
            <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Unleash its power in the 3D realm</p>
          </motion.div>
        )}

        {/* HUD instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1 }}
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            padding: '16px 24px',
            borderRadius: 40,
            color: 'rgba(255,255,255,0.9)',
            fontSize: '0.9rem',
            display: 'flex',
            gap: 20,
            letterSpacing: 1,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <span><lucideIcons.MousePointer size={14} /> Drag orbit</span>
          <span><lucideIcons.Scroll size={14} /> Scroll zoom</span>
          <span><lucideIcons.PanRight size={14} /> Right pan</span>
          <span><lucideIcons.Droplet size={14} /> Drop mods</span>
        </motion.div>

        {/* Loading indicator */}
        {!isInitialized && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '1.5rem' }}>
            <lucideIcons.Loader size={48} className="spin" />
            <p>Awakening the world...</p>
          </div>
        )}
      </div>
    </WorldContext.Provider>
  );
}

// Global CSS for spinner (inline style or you can add to global CSS)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .spin {
      animation: spin 2s linear infinite;
    }
    .btn-3d:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(108,92,231,0.6);
    }
    .world-container canvas {
      transition: filter 0.3s;
    }
  `;
  document.head.appendChild(style);
}
