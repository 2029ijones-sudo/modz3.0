'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { Water } from 'three/examples/jsm/objects/Water';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

export default function ThreeWorld({ 
  addNotification, 
  worldName, 
  onModDrop, 
  isDraggingOverWorld,
  quantumEffects = {},
  reducedMotion = false,
  highContrast = false,
  performanceMode = {
    lowQuality: false,
    disableEffects: false,
    disableAnimations: false,
    reduceParticles: false,
    disableShadows: false,
    simpleRendering: false,
    fpsLimit: 60
  }
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [performanceScore, setPerformanceScore] = useState(10);
  const [deviceMemory, setDeviceMemory] = useState(8);
  const [gpuTier, setGpuTier] = useState('high');
  
  // Store all THREE.js objects in refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const composerRef = useRef(null);
  const controlsRef = useRef(null);
  const physicsWorldRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const objectsRef = useRef([]);
  const modObjectsRef = useRef([]);
  const npcsRef = useRef([]);
  const environmentRef = useRef({});
  const resizeObserverRef = useRef(null);
  const isMountedRef = useRef(true);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isInitializingRef = useRef(false);
  const initAttemptRef = useRef(0);
  const loaderRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const fpsCounterRef = useRef({ lastTime: performance.now(), frames: 0, fps: 60 });
  const characterRef = useRef(null);
  const waterRef = useRef(null);
  const skyRef = useRef(null);
  const particlesRef = useRef([]);
  const portalsRef = useRef([]);
  const floatingIslandsRef = useRef([]);
  const npcBehaviorsRef = useRef({});

  // ========== PERFORMANCE DETECTION ==========
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detect device capabilities
    const memory = navigator.deviceMemory || 8;
    setDeviceMemory(memory);
    
    // Detect GPU tier
    let gpuScore = 10;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer.includes('Intel') && !renderer.includes('Iris')) gpuScore = 4;
          if (renderer.includes('Mali') || renderer.includes('Adreno')) gpuScore = 3;
          if (renderer.includes('PowerVR')) gpuScore = 2;
          if (renderer.includes('SwiftShader')) gpuScore = 1;
        }
      }
    } catch (e) {}
    
    const performanceScore = (memory * 0.6) + (gpuScore * 0.4);
    setPerformanceScore(performanceScore);
    
    if (performanceScore < 5) {
      setGpuTier('low');
    } else if (performanceScore < 8) {
      setGpuTier('medium');
    } else {
      setGpuTier('high');
    }
  }, []);

  // ========== INITIALIZATION ==========
  const initializeWebGLContext = useCallback(() => {
    if (!canvasRef.current) return null;
    
    try {
      const canvas = canvasRef.current;
      
      const contextAttributes = {
        alpha: false,
        antialias: !performanceMode.simpleRendering,
        depth: true,
        stencil: false,
        powerPreference: gpuTier === 'high' ? "high-performance" : "default",
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: gpuTier === 'high'
      };
      
      const gl = canvas.getContext('webgl2', contextAttributes) || 
                 canvas.getContext('webgl', contextAttributes) ||
                 canvas.getContext('experimental-webgl', contextAttributes);
      
      if (!gl) throw new Error('WebGL not supported');
      
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
      
      return gl;
    } catch (err) {
      console.error('Failed to initialize WebGL context:', err);
      return null;
    }
  }, [performanceMode.simpleRendering, gpuTier]);

  const handleContextLost = useCallback((event) => {
    event.preventDefault();
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setError('WebGL context lost. Trying to restore...');
    addNotification?.('⚠️ Quantum field instability detected', 'warning');
  }, [addNotification]);

  const handleContextRestored = useCallback(() => {
    setError(null);
    addNotification?.('✨ Quantum field stabilized', 'success');
    setTimeout(() => {
      if (isMountedRef.current) {
        initAttemptRef.current = 0;
        initialize3DWorld();
      }
    }, 1000);
  }, [addNotification]);

  // ========== CREATE FLOATING ISLANDS ==========
  const createFloatingIslands = useCallback((scene, physicsWorld) => {
    if (!scene || gpuTier === 'low') return;
    
    const islandCount = performanceMode.lowQuality ? 3 : 6;
    
    for (let i = 0; i < islandCount; i++) {
      const islandGroup = new THREE.Group();
      
      // Random position in a ring
      const angle = (i / islandCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 45 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 15 + Math.random() * 15;
      
      islandGroup.position.set(x, y, z);
      
      // Main island body
      const bodyGeo = new THREE.DodecahedronGeometry(3 + Math.random() * 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.75 + Math.random() * 0.2, 0.7, 0.3),
        emissive: new THREE.Color().setHSL(0.75 + Math.random() * 0.2, 0.7, 0.1),
        emissiveIntensity: 0.2,
        roughness: 0.5,
        metalness: 0.6,
        wireframe: Math.random() > 0.8
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = !performanceMode.disableShadows;
      body.receiveShadow = !performanceMode.disableShadows;
      islandGroup.add(body);
      
      // Crystal formations
      const crystalCount = 5 + Math.floor(Math.random() * 10);
      for (let j = 0; j < crystalCount; j++) {
        const crystalGeo = new THREE.ConeGeometry(0.4, 1 + Math.random() * 2, 5);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0.8 + Math.random() * 0.3, 0.9, 0.6),
          emissive: new THREE.Color().setHSL(0.8 + Math.random() * 0.3, 0.9, 0.3),
          emissiveIntensity: 0.5,
          roughness: 0.2,
          metalness: 0.9,
          transparent: true,
          opacity: 0.9
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(
          (Math.random() - 0.5) * 3,
          1 + Math.random() * 2,
          (Math.random() - 0.5) * 3
        );
        crystal.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        crystal.castShadow = !performanceMode.disableShadows;
        islandGroup.add(crystal);
      }
      
      // Floating particles around island
      if (!performanceMode.reduceParticles) {
        const particleCount = 20;
        const particles = new THREE.Group();
        for (let j = 0; j < particleCount; j++) {
          const particleGeo = new THREE.SphereGeometry(0.1, 4, 4);
          const particleMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.7 + Math.random() * 0.3, 0.8, 0.6),
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
          });
          const particle = new THREE.Mesh(particleGeo, particleMat);
          
          const pAngle = Math.random() * Math.PI * 2;
          const pRadius = 4 + Math.random() * 2;
          const pHeight = (Math.random() - 0.5) * 4;
          
          particle.position.set(
            Math.cos(pAngle) * pRadius,
            pHeight,
            Math.sin(pAngle) * pRadius
          );
          
          particle.userData = {
            angle: pAngle,
            radius: pRadius,
            height: pHeight,
            speed: 0.2 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2
          };
          
          particles.add(particle);
        }
        islandGroup.add(particles);
        islandGroup.userData.particles = particles;
      }
      
      // Add physics body
      const shape = new CANNON.Sphere(3);
      const body = new CANNON.Body({ 
        mass: 0,
        material: new CANNON.Material('island')
      });
      body.addShape(shape);
      body.position.copy(islandGroup.position);
      physicsWorld.addBody(body);
      
      islandGroup.userData = {
        physicsBody: body,
        type: 'floatingIsland',
        rotationSpeed: 0.001 + Math.random() * 0.002,
        floatSpeed: 0.5 + Math.random() * 0.5,
        floatPhase: Math.random() * Math.PI * 2
      };
      
      scene.add(islandGroup);
      floatingIslandsRef.current.push(islandGroup);
      environmentRef.current[`island${i}`] = islandGroup;
    }
  }, [performanceMode, gpuTier]);

  // ========== CREATE QUANTUM PORTALS ==========
  const createPortals = useCallback((scene) => {
    if (!scene || gpuTier === 'low' || performanceMode.disableEffects) return;
    
    const portalCount = 3;
    
    for (let i = 0; i < portalCount; i++) {
      const portalGroup = new THREE.Group();
      
      const angle = (i / portalCount) * Math.PI * 2;
      const radius = 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 2;
      
      portalGroup.position.set(x, y, z);
      
      // Outer ring
      const outerRingGeo = new THREE.TorusGeometry(2, 0.1, 16, 100);
      const outerRingMat = new THREE.MeshStandardMaterial({
        color: 0x6c5ce7,
        emissive: 0x4a3a8a,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.rotation.x = Math.PI / 2;
      portalGroup.add(outerRing);
      
      // Inner ring
      const innerRingGeo = new THREE.TorusGeometry(1.5, 0.15, 16, 100);
      const innerRingMat = new THREE.MeshStandardMaterial({
        color: 0xa29bfe,
        emissive: 0x6c5ce7,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.9,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.rotation.x = Math.PI / 2;
      innerRing.rotation.z = 0.5;
      portalGroup.add(innerRing);
      
      // Center glow
      const centerGlowGeo = new THREE.SphereGeometry(1, 16, 16);
      const centerGlowMat = new THREE.MeshBasicMaterial({
        color: 0x8a7ae6,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const centerGlow = new THREE.Mesh(centerGlowGeo, centerGlowMat);
      portalGroup.add(centerGlow);
      
      // Particle vortex
      const particleCount = 50;
      const particles = new THREE.Group();
      for (let j = 0; j < particleCount; j++) {
        const particleGeo = new THREE.SphereGeometry(0.08, 4, 4);
        const particleMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.7 + Math.random() * 0.2, 0.9, 0.6),
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        const pAngle = Math.random() * Math.PI * 2;
        const pRadius = 1 + Math.random() * 2;
        const pHeight = (Math.random() - 0.5) * 0.5;
        
        particle.position.set(
          Math.cos(pAngle) * pRadius,
          pHeight,
          Math.sin(pAngle) * pRadius
        );
        
        particle.userData = {
          angle: pAngle,
          radius: pRadius,
          speed: 1 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2
        };
        
        particles.add(particle);
      }
      portalGroup.add(particles);
      
      portalGroup.userData = {
        type: 'portal',
        particles: particles,
        outerRing: outerRing,
        innerRing: innerRing,
        rotationSpeed: 0.01,
        pulsePhase: 0
      };
      
      scene.add(portalGroup);
      portalsRef.current.push(portalGroup);
      environmentRef.current[`portal${i}`] = portalGroup;
    }
  }, [performanceMode, gpuTier]);

  // ========== CREATE IMMERSIVE ENVIRONMENT ==========
  const createEnvironment = useCallback((scene, physicsWorld) => {
    if (!scene) return;
    
    // ===== ENHANCED GROUND WITH TEXTURE =====
    const groundGeometry = new THREE.CircleGeometry(300, 128);
    
    // Create procedural grid texture
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    
    // Dark sci-fi grid pattern
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, 2048, 2048);
    
    // Main grid lines
    ctx.strokeStyle = performanceMode.lowQuality ? '#3a3a5a' : '#6c5ce7';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 64; i++) {
      const pos = i * 32;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 2048);
      ctx.strokeStyle = i % 8 === 0 ? '#9f8ef0' : '#6c5ce7';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(2048, pos);
      ctx.stroke();
    }
    
    // Hexagonal pattern overlay
    if (!performanceMode.lowQuality) {
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 40; i++) {
        for (let j = 0; j < 40; j++) {
          const x = i * 60 + (j % 2) * 30;
          const y = j * 52;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const angle = k * 60 * Math.PI / 180;
            const px = x + 20 * Math.cos(angle);
            const py = y + 20 * Math.sin(angle);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
    
    // Energy runes
    if (!performanceMode.lowQuality) {
      ctx.fillStyle = 'rgba(108, 92, 231, 0.1)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        ctx.beginPath();
        ctx.arc(x, y, 5 + Math.random() * 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(12, 12);
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.7,
      metalness: 0.4,
      emissive: new THREE.Color(0x1a1a2e),
      emissiveIntensity: performanceMode.lowQuality ? 0.1 : 0.2
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = !performanceMode.disableShadows;
    scene.add(ground);
    
    // ===== PHYSICS GROUND =====
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physicsWorld.addBody(groundBody);
    
    // ===== ADD DECORATIVE GRID RINGS =====
    if (!performanceMode.lowQuality) {
      for (let i = 1; i <= 8; i++) {
        const ringRadius = i * 25;
        const ringPoints = [];
        const ringSegments = 120;
        
        for (let j = 0; j <= ringSegments; j++) {
          const angle = (j / ringSegments) * Math.PI * 2;
          ringPoints.push(new THREE.Vector3(
            Math.cos(angle) * ringRadius,
            0,
            Math.sin(angle) * ringRadius
          ));
        }
        
        const ringGeometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
        const ringMaterial = new THREE.LineBasicMaterial({ 
          color: new THREE.Color(`hsl(${260 + i * 15}, 80%, 70%)`),
          opacity: 0.1,
          transparent: true
        });
        
        const ringLine = new THREE.LineLoop(ringGeometry, ringMaterial);
        ringLine.position.y = 0.02;
        scene.add(ringLine);
        environmentRef.current[`ring${i}`] = ringLine;
      }
    }
    
    // ===== ENHANCED LIGHTING SYSTEM =====
    const ambientLight = new THREE.AmbientLight(0x404880, gpuTier === 'high' ? 0.5 : 0.7);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    mainLight.position.set(15, 40, 20);
    mainLight.castShadow = !performanceMode.disableShadows;
    mainLight.receiveShadow = !performanceMode.disableShadows;
    if (!performanceMode.disableShadows) {
      mainLight.shadow.mapSize.width = gpuTier === 'high' ? 4096 : 2048;
      mainLight.shadow.mapSize.height = gpuTier === 'high' ? 4096 : 2048;
      mainLight.shadow.camera.near = 0.5;
      mainLight.shadow.camera.far = 300;
      mainLight.shadow.camera.left = -100;
      mainLight.shadow.camera.right = 100;
      mainLight.shadow.camera.top = 100;
      mainLight.shadow.camera.bottom = -100;
      mainLight.shadow.bias = -0.0005;
    }
    scene.add(mainLight);
    
    // Fill lights with colors
    const fillLight1 = new THREE.PointLight(0x4466aa, 0.8);
    fillLight1.position.set(-30, 20, 30);
    scene.add(fillLight1);
    
    const fillLight2 = new THREE.PointLight(0xaa44aa, 0.6);
    fillLight2.position.set(30, 15, -30);
    scene.add(fillLight2);
    
    const fillLight3 = new THREE.PointLight(0x44aa88, 0.5);
    fillLight3.position.set(-20, 10, -40);
    scene.add(fillLight3);
    
    // Floating orbs for atmosphere
    if (!performanceMode.disableEffects && gpuTier !== 'low') {
      for (let i = 0; i < 12; i++) {
        const orbLight = new THREE.PointLight(0x6c5ce7, 0.6);
        const angle = (i / 12) * Math.PI * 2;
        const radius = 50;
        orbLight.position.set(
          Math.cos(angle) * radius,
          8 + Math.sin(i * 1.2) * 4,
          Math.sin(angle) * radius
        );
        scene.add(orbLight);
        
        // Visual orb
        const orbGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({
          color: 0x6c5ce7,
          emissive: 0x6c5ce7,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.copy(orbLight.position);
        scene.add(orb);
        
        environmentRef.current[`orb${i}`] = { 
          light: orbLight, 
          mesh: orb, 
          angle: angle, 
          radius: radius,
          speed: 0.1 + Math.random() * 0.2,
          height: orbLight.position.y,
          phase: Math.random() * Math.PI * 2
        };
      }
    }
    
    // ===== SKYBOX / ATMOSPHERE =====
    if (!performanceMode.lowQuality) {
      const sky = new Sky();
      sky.scale.setScalar(500);
      scene.add(sky);
      
      const skyUniforms = sky.material.uniforms;
      skyUniforms['turbidity'].value = 1;
      skyUniforms['rayleigh'].value = 0.3;
      skyUniforms['mieCoefficient'].value = 0.005;
      skyUniforms['mieDirectionalG'].value = 0.7;
      skyUniforms['sunPosition'].value.copy(new THREE.Vector3(1, 0.3, 1));
      
      skyRef.current = sky;
    }
    
    // ===== WATER EFFECT (if high performance) =====
    if (!performanceMode.disableEffects && gpuTier === 'high') {
      const waterGeometry = new THREE.CircleGeometry(250, 128);
      const water = new Water(waterGeometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/water/Water_1_M_Normal.jpg', 
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
          }
        ),
        sunDirection: new THREE.Vector3(1, 1, 1),
        sunColor: 0xffffff,
        waterColor: 0x2a2a4a,
        distortionScale: 3,
        fog: scene.fog !== undefined
      });
      water.rotation.x = -Math.PI / 2;
      water.position.y = -8;
      scene.add(water);
      waterRef.current = water;
    }
    
    // ===== FLOATING CRYSTALS =====
    if (!performanceMode.reduceParticles && gpuTier !== 'low') {
      const crystalCount = performanceMode.lowQuality ? 30 : 80;
      
      for (let i = 0; i < crystalCount; i++) {
        const crystalGroup = new THREE.Group();
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 70;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 2 + Math.random() * 25;
        
        crystalGroup.position.set(x, y, z);
        
        // Crystal geometry
        const height = 1 + Math.random() * 3;
        const geometry = new THREE.ConeGeometry(0.4, height, 6);
        const hue = 0.65 + Math.random() * 0.35;
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(hue, 0.9, 0.6),
          emissive: new THREE.Color().setHSL(hue, 0.9, 0.3),
          emissiveIntensity: 0.4,
          roughness: 0.2,
          metalness: 0.9,
          transparent: true,
          opacity: 0.9,
          wireframe: Math.random() > 0.8
        });
        
        const crystal = new THREE.Mesh(geometry, material);
        crystal.castShadow = !performanceMode.disableShadows;
        crystal.receiveShadow = !performanceMode.disableShadows;
        crystal.rotation.x = Math.random() * 0.3;
        crystal.rotation.z = Math.random() * 0.3;
        
        crystalGroup.add(crystal);
        
        // Add small base
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 6);
        const baseMaterial = new THREE.MeshStandardMaterial({
          color: 0x334455,
          roughness: 0.7,
          metalness: 0.4,
          emissive: 0x112233,
          emissiveIntensity: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -height/2 - 0.1;
        base.rotation.x = Math.PI / 6;
        crystalGroup.add(base);
        
        scene.add(crystalGroup);
        
        // Store for animation
        environmentRef.current[`crystal${i}`] = {
          group: crystalGroup,
          angle: angle,
          radius: radius,
          speed: 0.1 + Math.random() * 0.3,
          height: y,
          phase: Math.random() * Math.PI * 2,
          rotationSpeed: 0.001 + Math.random() * 0.003
        };
      }
    }
    
    // ===== SCATTERED PILLARS =====
    if (!performanceMode.lowQuality) {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 45;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const pillarGroup = new THREE.Group();
        pillarGroup.position.set(x, 0, z);
        
        // Pillar base
        const baseGeo = new THREE.CylinderGeometry(1, 1, 0.3, 8);
        const baseMat = new THREE.MeshStandardMaterial({ 
          color: 0x445566, 
          roughness: 0.6, 
          metalness: 0.4,
          emissive: 0x223344,
          emissiveIntensity: 0.1
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        base.receiveShadow = !performanceMode.disableShadows;
        base.castShadow = !performanceMode.disableShadows;
        pillarGroup.add(base);
        
        // Pillar column
        const columnGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
        const columnMat = new THREE.MeshStandardMaterial({ 
          color: 0x556677, 
          roughness: 0.5, 
          metalness: 0.6,
          emissive: new THREE.Color(0x223344),
          emissiveIntensity: 0.15
        });
        const column = new THREE.Mesh(columnGeo, columnMat);
        column.position.y = 3.15;
        column.castShadow = !performanceMode.disableShadows;
        column.receiveShadow = !performanceMode.disableShadows;
        pillarGroup.add(column);
        
        // Pillar top
        const topGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8);
        const topMat = new THREE.MeshStandardMaterial({ 
          color: 0x6c5ce7, 
          roughness: 0.3, 
          metalness: 0.9,
          emissive: 0x4a3a8a,
          emissiveIntensity: 0.3
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 6.3;
        top.castShadow = !performanceMode.disableShadows;
        top.receiveShadow = !performanceMode.disableShadows;
        pillarGroup.add(top);
        
        // Energy orb on top
        const orbGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const orbMat = new THREE.MeshStandardMaterial({
          color: 0xa29bfe,
          emissive: 0x6c5ce7,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.9
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.y = 6.8;
        orb.castShadow = !performanceMode.disableShadows;
        pillarGroup.add(orb);
        
        scene.add(pillarGroup);
        environmentRef.current[`pillar${i}`] = pillarGroup;
      }
    }
    
    // ===== CREATE FLOATING ISLANDS =====
    createFloatingIslands(scene, physicsWorld);
    
    // ===== CREATE QUANTUM PORTALS =====
    createPortals(scene);
    
    return { ground, groundBody };
  }, [performanceMode, gpuTier, createFloatingIslands, createPortals]);

  // ========== CREATE IMMERSIVE CHARACTER ==========
  const createCharacter = useCallback((scene, physicsWorld) => {
    if (!scene) return null;
    
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 1, 8);
    
    // ===== BODY =====
    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x6c5ce7,
      emissive: 0x3a2a6a,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.7,
      transparent: true,
      opacity: 0.95
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.castShadow = !performanceMode.disableShadows;
    torso.receiveShadow = !performanceMode.disableShadows;
    torso.position.y = 1.2;
    characterGroup.add(torso);
    
    // Chest armor
    const chestGeo = new THREE.BoxGeometry(1.0, 0.8, 0.4);
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0x8a7ae6,
      emissive: 0x4a3a8a,
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.9
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.castShadow = !performanceMode.disableShadows;
    chest.receiveShadow = !performanceMode.disableShadows;
    chest.position.y = 1.4;
    chest.position.z = 0.25;
    characterGroup.add(chest);
    
    // Quantum core (glowing orb in chest)
    const coreGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffaa88,
      emissive: 0xff5500,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.95
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.castShadow = !performanceMode.disableShadows;
    core.position.y = 1.4;
    core.position.z = 0.45;
    characterGroup.add(core);
    
    // ===== HEAD =====
    const headGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x8a9aa8,
      roughness: 0.5,
      metalness: 0.4,
      emissive: 0x2a3a4a,
      emissiveIntensity: 0.15
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.castShadow = !performanceMode.disableShadows;
    head.receiveShadow = !performanceMode.disableShadows;
    head.position.y = 2.25;
    characterGroup.add(head);
    
    // Helmet visor
    const visorGeo = new THREE.BoxGeometry(0.5, 0.2, 0.15);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0088aa,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.95,
      transparent: true,
      opacity: 0.85
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.castShadow = !performanceMode.disableShadows;
    visor.position.y = 2.3;
    visor.position.z = 0.3;
    characterGroup.add(visor);
    
    // Helmet crest
    const crestGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0x6c5ce7,
      emissive: 0x4a3a8a,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8
    });
    const crest = new THREE.Mesh(crestGeo, crestMat);
    crest.castShadow = !performanceMode.disableShadows;
    crest.rotation.x = -0.3;
    crest.rotation.z = 0.2;
    crest.position.y = 2.5;
    crest.position.z = 0.2;
    characterGroup.add(crest);
    
    // ===== ARMS =====
    // Left arm
    const leftArmGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x6c5ce7,
      roughness: 0.5,
      metalness: 0.6,
      emissive: 0x3a2a6a,
      emissiveIntensity: 0.2
    });
    const leftArm = new THREE.Mesh(leftArmGeo, armMat);
    leftArm.castShadow = !performanceMode.disableShadows;
    leftArm.receiveShadow = !performanceMode.disableShadows;
    leftArm.position.set(-0.8, 1.5, 0);
    leftArm.rotation.z = 0.3;
    leftArm.rotation.x = -0.2;
    characterGroup.add(leftArm);
    
    // Left shoulder pad
    const leftShoulderGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const leftShoulder = new THREE.Mesh(leftShoulderGeo, armMat);
    leftShoulder.castShadow = !performanceMode.disableShadows;
    leftShoulder.position.set(-0.8, 2.0, 0);
    leftShoulder.scale.set(0.9, 0.5, 0.7);
    characterGroup.add(leftShoulder);
    
    // Right arm
    const rightArm = new THREE.Mesh(leftArmGeo.clone(), armMat.clone());
    rightArm.castShadow = !performanceMode.disableShadows;
    rightArm.receiveShadow = !performanceMode.disableShadows;
    rightArm.position.set(0.8, 1.5, 0);
    rightArm.rotation.z = -0.3;
    rightArm.rotation.x = 0.2;
    characterGroup.add(rightArm);
    
    // Right shoulder pad
    const rightShoulderGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const rightShoulder = new THREE.Mesh(rightShoulderGeo, armMat.clone());
    rightShoulder.castShadow = !performanceMode.disableShadows;
    rightShoulder.position.set(0.8, 2.0, 0);
    rightShoulder.scale.set(0.9, 0.5, 0.7);
    characterGroup.add(rightShoulder);
    
    // ===== LEGS =====
    // Left leg
    const legGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.2, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x4a5a6a,
      roughness: 0.6,
      metalness: 0.5,
      emissive: 0x2a3a4a,
      emissiveIntensity: 0.1
    });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.castShadow = !performanceMode.disableShadows;
    leftLeg.receiveShadow = !performanceMode.disableShadows;
    leftLeg.position.set(-0.3, 0.6, 0);
    characterGroup.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeo.clone(), legMat.clone());
    rightLeg.castShadow = !performanceMode.disableShadows;
    rightLeg.receiveShadow = !performanceMode.disableShadows;
    rightLeg.position.set(0.3, 0.6, 0);
    characterGroup.add(rightLeg);
    
    // ===== CAPE =====
    if (!performanceMode.lowQuality) {
      const capeGeo = new THREE.BoxGeometry(1.2, 1.5, 0.1);
      const capeMat = new THREE.MeshStandardMaterial({
        color: 0x3a2a6a,
        roughness: 0.8,
        metalness: 0.2,
        emissive: 0x1a1a3a,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.9
      });
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.castShadow = !performanceMode.disableShadows;
      cape.receiveShadow = !performanceMode.disableShadows;
      cape.position.set(0, 1.2, -0.3);
      cape.rotation.x = 0.2;
      characterGroup.add(cape);
      characterGroup.userData.cape = cape;
    }
    
    // ===== ENERGY EFFECTS =====
    if (!performanceMode.disableEffects && gpuTier !== 'low') {
      // Energy aura
      const auraGeo = new THREE.SphereGeometry(1.5, 24, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x6c5ce7,
        transparent: true,
        opacity: 0.08,
        wireframe: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.y = 1.2;
      characterGroup.add(aura);
      characterGroup.userData.aura = aura;
      
      // Floating particles around character
      const particleCount = performanceMode.reduceParticles ? 20 : 45;
      const particles = new THREE.Group();
      
      for (let i = 0; i < particleCount; i++) {
        const particleGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const particleMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.7 + Math.random() * 0.2, 0.9, 0.6),
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.8 + Math.random() * 1.2;
        const height = 0.5 + Math.random() * 1.8;
        
        particle.position.set(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
        
        particle.userData = {
          angle: angle,
          radius: radius,
          speed: 0.3 + Math.random() * 0.7,
          height: height,
          phase: Math.random() * Math.PI * 2
        };
        
        particles.add(particle);
      }
      
      characterGroup.add(particles);
      characterGroup.userData.particles = particles;
      
      // Energy beams from shoulders
      const beamGroup = new THREE.Group();
      for (let i = 0; i < 2; i++) {
        const beamGeo = new THREE.ConeGeometry(0.1, 0.5, 8);
        const beamMat = new THREE.MeshStandardMaterial({
          color: 0xa29bfe,
          emissive: 0x6c5ce7,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(i === 0 ? -0.4 : 0.4, 2.0, -0.1);
        beam.rotation.x = 0.5;
        beam.rotation.z = i === 0 ? 0.3 : -0.3;
        beamGroup.add(beam);
      }
      characterGroup.add(beamGroup);
      characterGroup.userData.beams = beamGroup;
    }
    
    // Add name label
    const labelDiv = document.createElement('div');
    labelDiv.textContent = '⚡ QUANTUM GUARDIAN ⚡';
    labelDiv.style.color = '#a29bfe';
    labelDiv.style.fontFamily = 'Space Grotesk, monospace';
    labelDiv.style.fontSize = '18px';
    labelDiv.style.fontWeight = 'bold';
    labelDiv.style.textShadow = '0 0 15px #6c5ce7, 0 0 30px #4a3a8a';
    labelDiv.style.letterSpacing = '3px';
    labelDiv.style.background = 'rgba(10,15,25,0.7)';
    labelDiv.style.padding = '6px 16px';
    labelDiv.style.borderRadius = '30px';
    labelDiv.style.border = '1px solid rgba(108,92,231,0.5)';
    labelDiv.style.backdropFilter = 'blur(5px)';
    
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 3.0, 0);
    characterGroup.add(label);
    
    // Add to scene
    scene.add(characterGroup);
    
    // Add physics body
    const shape = new CANNON.Cylinder(0.6, 0.6, 2.2, 8);
    const body = new CANNON.Body({ 
      mass: 0,
      material: new CANNON.Material('character')
    });
    body.addShape(shape);
    body.position.copy(characterGroup.position);
    physicsWorld.addBody(body);
    
    characterGroup.userData = {
      physicsBody: body,
      type: 'character',
      torso: torso,
      chest: chest,
      core: core,
      head: head,
      visor: visor,
      crest: crest,
      arms: [leftArm, rightArm],
      legs: [leftLeg, rightLeg],
      aura: aura,
      idlePhase: 0,
      walkPhase: 0,
      label: label
    };
    
    return characterGroup;
  }, [performanceMode, gpuTier]);

  // ========== 🔥 ACTUALLY EXECUTE JAVASCRIPT MODS ==========
  const executeJavaScriptMod = useCallback((mod, script, position) => {
    try {
      console.log(`🚀 EXECUTING MOD: ${mod.name}`, { 
        scriptLength: script?.length,
        position 
      });
      
      // Create sandboxed execution context with powerful APIs
      const sandbox = {
        // THREE.js
        THREE: THREE,
        CANNON: CANNON,
        
        // Position data
        position: { x: position.x, y: position.y, z: position.z },
        worldPosition: position,
        
        // World interaction
        scene: sceneRef.current,
        physicsWorld: physicsWorldRef.current,
        
        // Add objects to world
        addCube: (props = {}) => {
          const size = props.size || 1;
          const color = props.color || 0x6c5ce7;
          const pos = props.position || position;
          
          const geometry = new THREE.BoxGeometry(size, size, size);
          const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            metalness: 0.7,
            roughness: 0.3
          });
          
          const cube = new THREE.Mesh(geometry, material);
          cube.position.copy(pos);
          cube.castShadow = !performanceMode.disableShadows;
          cube.receiveShadow = !performanceMode.disableShadows;
          
          // Add physics
          const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
          const body = new CANNON.Body({ mass: props.mass || 1 });
          body.addShape(shape);
          body.position.copy(pos);
          physicsWorldRef.current.addBody(body);
          
          cube.userData.physicsBody = body;
          cube.userData.modId = mod.id;
          cube.userData.modName = mod.name;
          
          sceneRef.current.add(cube);
          objectsRef.current.push(cube);
          modObjectsRef.current.push(cube);
          
          return cube;
        },
        
        addSphere: (props = {}) => {
          const radius = props.radius || 0.5;
          const color = props.color || 0xff6b6b;
          const pos = props.position || position;
          
          const geometry = new THREE.SphereGeometry(radius, 32, 32);
          const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            metalness: 0.5,
            roughness: 0.3
          });
          
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.copy(pos);
          sphere.castShadow = !performanceMode.disableShadows;
          sphere.receiveShadow = !performanceMode.disableShadows;
          
          const shape = new CANNON.Sphere(radius);
          const body = new CANNON.Body({ mass: props.mass || 1 });
          body.addShape(shape);
          body.position.copy(pos);
          physicsWorldRef.current.addBody(body);
          
          sphere.userData.physicsBody = body;
          sphere.userData.modId = mod.id;
          sphere.userData.modName = mod.name;
          
          sceneRef.current.add(sphere);
          objectsRef.current.push(sphere);
          modObjectsRef.current.push(sphere);
          
          return sphere;
        },
        
        addCylinder: (props = {}) => {
          const radiusTop = props.radiusTop || 0.5;
          const radiusBottom = props.radiusBottom || 0.5;
          const height = props.height || 1;
          const color = props.color || 0x4ecdc4;
          const pos = props.position || position;
          
          const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
          const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            metalness: 0.6,
            roughness: 0.4
          });
          
          const cylinder = new THREE.Mesh(geometry, material);
          cylinder.position.copy(pos);
          cylinder.castShadow = !performanceMode.disableShadows;
          cylinder.receiveShadow = !performanceMode.disableShadows;
          
          const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, 16);
          const body = new CANNON.Body({ mass: props.mass || 1 });
          body.addShape(shape);
          body.position.copy(pos);
          physicsWorldRef.current.addBody(body);
          
          cylinder.userData.physicsBody = body;
          cylinder.userData.modId = mod.id;
          
          sceneRef.current.add(cylinder);
          objectsRef.current.push(cylinder);
          modObjectsRef.current.push(cylinder);
          
          return cylinder;
        },
        
        addLight: (props = {}) => {
          const color = props.color || 0xffffff;
          const intensity = props.intensity || 1;
          const pos = props.position || position;
          
          const light = new THREE.PointLight(color, intensity, props.distance || 20);
          light.position.copy(pos);
          
          if (props.castShadow) {
            light.castShadow = true;
            light.shadow.mapSize.width = 512;
            light.shadow.mapSize.height = 512;
          }
          
          sceneRef.current.add(light);
          objectsRef.current.push(light);
          modObjectsRef.current.push(light);
          
          // Add visual representation
          if (props.showHelper) {
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(0.2, 16, 16),
              new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.3 })
            );
            sphere.position.copy(pos);
            light.add(sphere);
          }
          
          return light;
        },
        
        addGroup: () => {
          const group = new THREE.Group();
          group.position.copy(position);
          sceneRef.current.add(group);
          objectsRef.current.push(group);
          modObjectsRef.current.push(group);
          return group;
        },
        
        // Console with mod prefix
        console: {
          log: (...args) => {
            console.log(`[Mod:${mod.name}]`, ...args);
            addNotification?.(`[${mod.name}] ${args.join(' ')}`, 'info');
          },
          error: (...args) => {
            console.error(`[Mod:${mod.name}]`, ...args);
            addNotification?.(`[${mod.name}] Error: ${args.join(' ')}`, 'error');
          },
          warn: (...args) => {
            console.warn(`[Mod:${mod.name}]`, ...args);
            addNotification?.(`[${mod.name}] ${args.join(' ')}`, 'warn');
          },
          info: (...args) => {
            console.info(`[Mod:${mod.name}]`, ...args);
            addNotification?.(`[${mod.name}] ${args.join(' ')}`, 'info');
          }
        },
        
        // Utilities
        notify: (message, type = 'info') => {
          addNotification?.(`[${mod.name}] ${message}`, type);
        },
        
        random: (min, max) => Math.random() * (max - min) + min,
        
        // Time
        time: Date.now() * 0.001,
        delta: clockRef.current?.getDelta() || 0.016,
        
        // Math
        Math: Math,
        Vector3: THREE.Vector3,
        Color: THREE.Color,
        
        // Mod metadata
        modName: mod.name,
        modId: mod.id,
        
        // World state
        worldName: worldName,
        objects: objectsRef.current,
        modObjects: modObjectsRef.current,
        
        // Character reference
        character: characterRef.current,
        
        // Environment references
        environment: environmentRef.current,
        
        // API for animations
        animate: (callback) => {
          const id = `anim_${Date.now()}_${Math.random()}`;
          const animObject = { callback, active: true };
          
          if (!window.__modAnimations) window.__modAnimations = {};
          window.__modAnimations[id] = animObject;
          
          return id;
        },
        
        stopAnimation: (id) => {
          if (window.__modAnimations && window.__modAnimations[id]) {
            window.__modAnimations[id].active = false;
            delete window.__modAnimations[id];
            return true;
          }
          return false;
        },
        
        // Raycasting
        raycast: (origin, direction, distance = 100) => {
          const raycaster = new THREE.Raycaster(origin, direction, 0, distance);
          const intersects = raycaster.intersectObjects(objectsRef.current);
          return intersects;
        },
        
        // Create particle system
        createParticles: (count = 100, color = 0x6c5ce7, pos = position) => {
          const particles = new THREE.Group();
          particles.position.copy(pos);
          
          for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 4, 4),
              new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
              })
            );
            
            particle.position.set(
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5
            );
            
            particle.userData.velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 0.1,
              (Math.random() - 0.5) * 0.1,
              (Math.random() - 0.5) * 0.1
            );
            
            particles.add(particle);
          }
          
          sceneRef.current.add(particles);
          objectsRef.current.push(particles);
          modObjectsRef.current.push(particles);
          
          return particles;
        }
      };
      
      // Add all sandbox variables as parameters
      const sandboxKeys = Object.keys(sandbox);
      const sandboxValues = Object.values(sandbox);
      
      // Create the function with sandboxed context
      const fn = new Function(...sandboxKeys, `
        try {
          "use strict";
          ${script}
        } catch (error) {
          console.error('[Mod Execution Error]', error.message, error.stack);
          throw error;
        }
      `);
      
      // Execute the script
      fn(...sandboxValues);
      
      // Create optional visual representation
      if (!mod.metadata?.suppressVisual) {
        const geometry = new THREE.IcosahedronGeometry(0.8, 2);
        const material = new THREE.MeshStandardMaterial({
          color: mod.metadata?.color || 0x6c5ce7,
          emissive: mod.metadata?.color || 0x6c5ce7,
          emissiveIntensity: 0.6,
          metalness: 0.9,
          roughness: 0.1,
          wireframe: mod.metadata?.wireframe || false,
          transparent: true,
          opacity: 0.95
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = !performanceMode.disableShadows;
        mesh.receiveShadow = !performanceMode.disableShadows;
        
        // Add physics
        const shape = new CANNON.Sphere(0.8);
        const body = new CANNON.Body({ mass: 0.5 });
        body.addShape(shape);
        body.position.copy(position);
        physicsWorldRef.current.addBody(body);
        
        mesh.userData = {
          physicsBody: body,
          modType: 'script',
          modId: mod.id,
          modName: mod.name,
          script: script,
          createdAt: Date.now(),
          color: mod.metadata?.color || 0x6c5ce7
        };
        
        sceneRef.current.add(mesh);
        objectsRef.current.push(mesh);
        modObjectsRef.current.push(mesh);
      }
      
      addNotification?.(`✅ Executed: ${mod.name}`, 'success');
      
    } catch (error) {
      console.error(`❌ Error executing mod ${mod.name}:`, error);
      addNotification?.(`Failed to execute ${mod.name}: ${error.message}`, 'error');
      throw error;
    }
  }, [addNotification, worldName, performanceMode.disableShadows]);

  // ========== MAIN INITIALIZATION ==========
  const initialize3DWorld = useCallback(() => {
    if (!isMountedRef.current || isInitializingRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    if (!container || !canvas) {
      setTimeout(() => {
        if (isMountedRef.current && initAttemptRef.current < 5) {
          initAttemptRef.current++;
          initialize3DWorld();
        }
      }, 500);
      return;
    }

    const { width, height } = container.getBoundingClientRect();
    
    if (width === 0 || height === 0) {
      setTimeout(() => {
        if (isMountedRef.current && initAttemptRef.current < 5) {
          initAttemptRef.current++;
          initialize3DWorld();
        }
      }, 500);
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      // Cleanup existing
      cleanup3DWorld();
      
      // Initialize WebGL
      const gl = initializeWebGLContext();
      if (!gl) throw new Error('Failed to initialize WebGL context');
      
      // Initialize loaders
      loaderRef.current = {
        gltf: new GLTFLoader(),
        texture: new THREE.TextureLoader(),
        draco: new DRACOLoader()
      };
      loaderRef.current.draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
      loaderRef.current.gltf.setDRACOLoader(loaderRef.current.draco);
      
      // ===== SCENE =====
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x03030a);
      scene.fog = new THREE.Fog(0x03030a, 40, 250);
      sceneRef.current = scene;
      
      // ===== CAMERA =====
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.set(25, 15, 35);
      camera.lookAt(0, 2, 0);
      cameraRef.current = camera;
      
      // ===== RENDERERS =====
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: gl,
        antialias: !performanceMode.simpleRendering,
        alpha: false,
        powerPreference: gpuTier === 'high' ? "high-performance" : "default",
        preserveDrawingBuffer: false
      });
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, gpuTier === 'high' ? 2 : 1.5));
      renderer.shadowMap.enabled = !performanceMode.disableShadows;
      renderer.shadowMap.type = gpuTier === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      renderer.shadowMap.bias = 0.0001;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.outputEncoding = THREE.sRGBEncoding;
      rendererRef.current = renderer;
      
      // CSS2 Renderer for labels
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.left = '0';
      labelRenderer.domElement.style.pointerEvents = 'none';
      container.appendChild(labelRenderer.domElement);
      labelRendererRef.current = labelRenderer;
      
      // ===== EFFECT COMPOSER (Post-processing) =====
      if (!performanceMode.disableEffects && gpuTier === 'high') {
        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.2;
        bloomPass.strength = 0.9;
        bloomPass.radius = 0.6;
        composer.addPass(bloomPass);
        
        if (!performanceMode.simpleRendering) {
          const smaaPass = new SMAAPass(width, height);
          composer.addPass(smaaPass);
        }
        
        composerRef.current = composer;
      }
      
      // ===== CONTROLS =====
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = true;
      controls.minDistance = 15;
      controls.maxDistance = 120;
      controls.maxPolarAngle = Math.PI / 2.2;
      controls.autoRotate = false;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.rotateSpeed = 0.6;
      controls.zoomSpeed = 1.0;
      controls.panSpeed = 0.8;
      controls.enableRotate = true;
      controls.enableDamping = true;
      controlsRef.current = controls;
      
      // ===== PHYSICS =====
      const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, -20, 0)
      });
      physicsWorld.broadphase = new CANNON.NaiveBroadphase();
      physicsWorld.solver.iterations = gpuTier === 'high' ? 12 : 8;
      physicsWorld.defaultContactMaterial.restitution = 0.3;
      physicsWorld.defaultContactMaterial.friction = 0.5;
      physicsWorldRef.current = physicsWorld;
      
      // ===== CREATE ENVIRONMENT =====
      createEnvironment(scene, physicsWorld);
      
      // ===== CREATE CHARACTER =====
      const character = createCharacter(scene, physicsWorld);
      characterRef.current = character;
      
      // ===== DRAG & DROP =====
      const handleCanvasDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('application/mod-data')) {
          container.style.borderColor = '#6c5ce7';
          container.style.boxShadow = '0 0 50px rgba(108, 92, 231, 0.8)';
          container.style.borderWidth = '3px';
        }
      };
      
      const handleCanvasDragLeave = (e) => {
        container.style.borderColor = 'transparent';
        container.style.boxShadow = '0 0 30px rgba(0,0,0,0.5)';
        container.style.borderWidth = '2px';
      };
      
      const handleCanvasDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        container.style.borderColor = 'transparent';
        container.style.boxShadow = '0 0 30px rgba(0,0,0,0.5)';
        container.style.borderWidth = '2px';
        
        try {
          const modData = e.dataTransfer.getData('application/mod-data');
          if (!modData) {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              await handleFileDrop(files[0]);
              return;
            }
            return;
          }
          
          const mod = JSON.parse(modData);
          
          const rect = canvas.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          
          mouseRef.current.set(x, y);
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectionPoint = new THREE.Vector3();
          raycasterRef.current.ray.intersectPlane(groundPlane, intersectionPoint);
          
          await addModToWorld(mod, intersectionPoint);
          
        } catch (error) {
          console.error('Error processing drop:', error);
          addNotification?.('Failed to add mod to world', 'error');
        }
      };
      
      canvas.addEventListener('dragover', handleCanvasDragOver);
      canvas.addEventListener('dragleave', handleCanvasDragLeave);
      canvas.addEventListener('drop', handleCanvasDrop);
      
      // ===== ANIMATION LOOP =====
      const animate = () => {
        if (!isMountedRef.current) return;
        
        animationFrameIdRef.current = requestAnimationFrame(animate);
        
        try {
          const delta = Math.min(clockRef.current.getDelta(), 0.1);
          const elapsedTime = performance.now() * 0.001;
          
          // FPS Limiter
          fpsCounterRef.current.frames++;
          const now = performance.now();
          if (now >= fpsCounterRef.current.lastTime + 1000) {
            fpsCounterRef.current.fps = fpsCounterRef.current.frames;
            fpsCounterRef.current.frames = 0;
            fpsCounterRef.current.lastTime = now;
            
            // Auto-adjust quality
            if (fpsCounterRef.current.fps < 30 && gpuTier === 'high') {
              setGpuTier('medium');
              addNotification?.('📊 Adjusting to medium quality for better performance', 'info');
            } else if (fpsCounterRef.current.fps < 20 && gpuTier === 'medium') {
              setGpuTier('low');
              addNotification?.('📊 Adjusting to low quality for smooth performance', 'info');
            }
          }
          
          // Update physics
          if (physicsWorldRef.current) {
            physicsWorldRef.current.step(1/60, delta, 3);
          }
          
          // Update objects from physics
          objectsRef.current.forEach(obj => {
            if (obj.userData?.physicsBody) {
              obj.position.copy(obj.userData.physicsBody.position);
              obj.quaternion.copy(obj.userData.physicsBody.quaternion);
            }
          });
          
          // Animate environment
          if (!performanceMode.disableAnimations) {
            // Floating orbs
            Object.keys(environmentRef.current).forEach(key => {
              if (key.startsWith('orb')) {
                const orb = environmentRef.current[key];
                if (orb && orb.light) {
                  const time = elapsedTime * orb.speed || 0.2;
                  orb.light.position.y = orb.height + Math.sin(time + orb.phase) * 3;
                  if (orb.mesh) {
                    orb.mesh.position.y = orb.height + Math.sin(time + orb.phase) * 3;
                    orb.mesh.rotation.x += 0.01;
                    orb.mesh.rotation.y += 0.02;
                  }
                }
              }
              
              if (key.startsWith('crystal')) {
                const crystal = environmentRef.current[key];
                if (crystal && crystal.group) {
                  crystal.group.rotation.y += crystal.rotationSpeed || 0.001;
                  crystal.group.position.y = crystal.height + Math.sin(elapsedTime * crystal.speed + crystal.phase) * 0.5;
                }
              }
              
              if (key.startsWith('portal')) {
                const portal = environmentRef.current[key];
                if (portal) {
                  portal.rotation.y += 0.005;
                  portal.rotation.x += 0.001;
                  if (portal.userData?.innerRing) {
                    portal.userData.innerRing.rotation.z += 0.01;
                  }
                  if (portal.userData?.particles) {
                    portal.userData.particles.children.forEach((particle, i) => {
                      particle.userData.angle += 0.02 * particle.userData.speed;
                      particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
                      particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
                    });
                  }
                }
              }
              
              if (key.startsWith('island')) {
                const island = environmentRef.current[key];
                if (island) {
                  island.rotation.y += island.userData?.rotationSpeed || 0.0005;
                  island.position.y = island.userData?.floatPhase 
                    ? 15 + Math.sin(elapsedTime * (island.userData.floatSpeed || 0.5) + island.userData.floatPhase) * 2
                    : island.position.y;
                  if (island.userData?.particles) {
                    island.userData.particles.rotation.y += 0.002;
                  }
                }
              }
            });
            
            // Animate character
            if (characterRef.current) {
              // Idle floating
              characterRef.current.position.y = 1 + Math.sin(elapsedTime * 1.2) * 0.08;
              
              // Core pulse
              if (characterRef.current.userData.core) {
                characterRef.current.userData.core.scale.setScalar(1 + Math.sin(elapsedTime * 8) * 0.1);
                characterRef.current.userData.core.material.emissiveIntensity = 0.8 + Math.sin(elapsedTime * 10) * 0.2;
              }
              
              // Rotate aura
              if (characterRef.current.userData.aura) {
                characterRef.current.userData.aura.rotation.y += 0.002;
                characterRef.current.userData.aura.rotation.x += 0.001;
              }
              
              // Rotate particles
              if (characterRef.current.userData.particles) {
                characterRef.current.userData.particles.rotation.y += 0.01;
                characterRef.current.userData.particles.children.forEach((particle, i) => {
                  particle.userData.angle += 0.01 * particle.userData.speed;
                  particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
                  particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
                });
              }
              
              // Animate beams
              if (characterRef.current.userData.beams) {
                characterRef.current.userData.beams.children.forEach((beam, i) => {
                  beam.scale.y = 1 + Math.sin(elapsedTime * 10 + i) * 0.2;
                });
              }
              
              // Animate cape
              if (characterRef.current.userData.cape) {
                characterRef.current.userData.cape.rotation.x = 0.2 + Math.sin(elapsedTime * 2) * 0.05;
              }
            }
            
            // Animate water
            if (waterRef.current) {
              waterRef.current.material.uniforms['time'].value += delta * 0.3;
            }
          }
          
          // Run mod animations
          if (window.__modAnimations) {
            Object.values(window.__modAnimations).forEach(anim => {
              if (anim.active) {
                try {
                  anim.callback(elapsedTime);
                } catch (e) {
                  console.error('Error in mod animation:', e);
                  anim.active = false;
                }
              }
            });
          }
          
          // Update controls
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
          // Render
          if (composerRef.current && !performanceMode.simpleRendering) {
            composerRef.current.render();
          } else if (rendererRef.current && cameraRef.current && sceneRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          
          // Render labels
          if (labelRendererRef.current && sceneRef.current && cameraRef.current) {
            labelRendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          
        } catch (err) {
          console.error('Animation error:', err);
        }
      };
      
      animate();
      
      setIsInitialized(true);
      setError(null);
      isInitializingRef.current = false;
      
      addNotification?.(`✨ ${worldName || 'Quantum Nexus'} stabilized at ${gpuTier} quality`, 'success');
      addNotification?.('👤 Quantum Guardian online - protect the realm!', 'info');
      addNotification?.('🌌 Floating islands, quantum portals, and energy crystals detected', 'info');
      
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err.message);
      isInitializingRef.current = false;
      addNotification?.(`3D Error: ${err.message}`, 'error');
      
      setTimeout(() => {
        if (isMountedRef.current && initAttemptRef.current < 3) {
          initAttemptRef.current++;
          initialize3DWorld();
        }
      }, 2000);
    }
  }, [addNotification, worldName, initializeWebGLContext, createEnvironment, createCharacter, performanceMode, gpuTier]);

  // ========== CLEANUP ==========
  const cleanup3DWorld = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    if (labelRendererRef.current?.domElement) {
      labelRendererRef.current.domElement.remove();
      labelRendererRef.current = null;
    }
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    
    if (composerRef.current) {
      composerRef.current = null;
    }
    
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    
    // Clear all references
    objectsRef.current = [];
    modObjectsRef.current = [];
    npcsRef.current = [];
    environmentRef.current = {};
    floatingIslandsRef.current = [];
    portalsRef.current = [];
    particlesRef.current = [];
    
    window.__modAnimations = {};
    
  }, []);

  // ========== MOD HANDLERS ==========
  const addModToWorld = useCallback(async (mod, position) => {
    if (!sceneRef.current || !physicsWorldRef.current) return;
    
    try {
      addNotification?.(`✨ Adding ${mod.name} to quantum realm...`, 'info');
      
      switch (mod.type) {
        case 'javascript':
          executeJavaScriptMod(mod, mod.data, position);
          break;
        case '3d-model':
          await load3DModel(mod, mod.data, position);
          break;
        case 'image':
          addTextureToWorld(mod, mod.data, position);
          break;
        case 'config':
          applyConfigMod(mod, mod.data, position);
          break;
        default:
          createBasicObjectFromMod(mod, position);
          break;
      }
      
    } catch (error) {
      console.error('Error adding mod:', error);
      addNotification?.(`Failed to add ${mod.name}`, 'error');
    }
  }, [addNotification, executeJavaScriptMod]);

  // ========== LOAD 3D MODEL ==========
  const load3DModel = useCallback(async (mod, modelData, position) => {
    return new Promise((resolve, reject) => {
      try {
        if (!loaderRef.current) {
          reject(new Error('Loader not initialized'));
          return;
        }
        
        const processLoadedModel = (gltf, mod, position) => {
          const model = gltf.scene;
          model.position.copy(position);
          model.scale.set(1, 1, 1);
          
          // Traverse and configure model
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = !performanceMode.disableShadows;
              child.receiveShadow = !performanceMode.disableShadows;
              
              // Enhance material
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    mat.emissive = new THREE.Color(mod.metadata?.color || 0x6c5ce7);
                    mat.emissiveIntensity = 0.2;
                    mat.metalness = 0.7;
                    mat.roughness = 0.3;
                  });
                } else {
                  child.material.emissive = new THREE.Color(mod.metadata?.color || 0x6c5ce7);
                  child.material.emissiveIntensity = 0.2;
                  child.material.metalness = 0.7;
                  child.material.roughness = 0.3;
                }
              }
            }
          });
          
          // Add physics
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
          const body = new CANNON.Body({ mass: mod.metadata?.mass || 1 });
          body.addShape(shape);
          body.position.copy(position.clone().add(center));
          physicsWorldRef.current.addBody(body);
          
          model.userData = {
            physicsBody: body,
            modType: '3d-model',
            modId: mod.id,
            modName: mod.name
          };
          
          sceneRef.current.add(model);
          objectsRef.current.push(model);
          modObjectsRef.current.push(model);
          
          // Add glow effect
          createGlowEffect(position, mod.metadata?.color || 0x6c5ce7);
        };
        
        if (mod.data.startsWith('data:')) {
          // Base64 encoded model
          const blob = dataURLToBlob(mod.data);
          const url = URL.createObjectURL(blob);
          
          loaderRef.current.gltf.load(url, (gltf) => {
            URL.revokeObjectURL(url);
            processLoadedModel(gltf, mod, position);
            resolve();
          }, undefined, (error) => {
            URL.revokeObjectURL(url);
            console.error('Error loading model:', error);
            reject(error);
          });
        } else {
          // Direct GLTF/GLB data
          const blob = new Blob([modelData], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          
          loaderRef.current.gltf.load(url, (gltf) => {
            URL.revokeObjectURL(url);
            processLoadedModel(gltf, mod, position);
            resolve();
          }, undefined, (error) => {
            URL.revokeObjectURL(url);
            reject(error);
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }, [performanceMode.disableShadows]);

  // ========== ADD TEXTURE ==========
  const addTextureToWorld = useCallback((mod, textureData, position) => {
    const texture = new THREE.Texture();
    const image = new Image();
    
    image.onload = () => {
      texture.image = image;
      texture.needsUpdate = true;
      
      // Create a plane with the texture
      const geometry = new THREE.PlaneGeometry(6, 6);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        emissive: new THREE.Color(mod.metadata?.color || 0x6c5ce7),
        emissiveIntensity: 0.2
      });
      
      const plane = new THREE.Mesh(geometry, material);
      plane.position.copy(position);
      plane.rotation.x = -Math.PI / 2;
      plane.castShadow = !performanceMode.disableShadows;
      plane.receiveShadow = !performanceMode.disableShadows;
      
      // Add physics
      const shape = new CANNON.Box(new CANNON.Vec3(3, 0.1, 3));
      const body = new CANNON.Body({ mass: 0.5 });
      body.addShape(shape);
      body.position.copy(position);
      physicsWorldRef.current.addBody(body);
      
      plane.userData = {
        physicsBody: body,
        modType: 'texture',
        modId: mod.id,
        modName: mod.name,
        texture: texture,
        floatOffset: Math.random() * Math.PI * 2
      };
      
      sceneRef.current.add(plane);
      objectsRef.current.push(plane);
      modObjectsRef.current.push(plane);
      
      addNotification?.(`🖼️ Texture ${mod.name} manifested`, 'success');
    };
    
    image.onerror = () => {
      addNotification?.(`Failed to load texture: ${mod.name}`, 'error');
    };
    
    if (textureData.startsWith('data:')) {
      image.src = textureData;
    } else {
      image.src = `data:image/png;base64,${textureData}`;
    }
  }, [performanceMode.disableShadows, addNotification]);

  // ========== APPLY CONFIG ==========
  const applyConfigMod = useCallback((mod, configData, position) => {
    try {
      const config = JSON.parse(configData);
      
      if (config.light) {
        // Add custom light
        const lightColor = new THREE.Color(config.light.color || 0xffffff);
        const light = new THREE.PointLight(lightColor, config.light.intensity || 1, config.light.distance || 50);
        light.position.copy(position);
        sceneRef.current.add(light);
        
        light.userData = {
          modType: 'config',
          modId: mod.id,
          config: config
        };
        
        objectsRef.current.push(light);
        modObjectsRef.current.push(light);
        
        // Add visual helper
        if (config.light.showHelper) {
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshBasicMaterial({ color: lightColor, transparent: true, opacity: 0.3 })
          );
          sphere.position.copy(position);
          light.add(sphere);
        }
      }
      
      if (config.fog) {
        // Update fog
        sceneRef.current.fog = new THREE.Fog(
          new THREE.Color(config.fog.color || 0x03030a),
          config.fog.near || 30,
          config.fog.far || 250
        );
      }
      
      if (config.gravity) {
        // Update physics gravity
        physicsWorldRef.current.gravity = new CANNON.Vec3(
          config.gravity.x || 0,
          config.gravity.y || -20,
          config.gravity.z || 0
        );
      }
      
      if (config.ambient) {
        // Add ambient light
        const ambientColor = new THREE.Color(config.ambient.color || 0x404880);
        const ambient = new THREE.AmbientLight(ambientColor, config.ambient.intensity || 0.5);
        sceneRef.current.add(ambient);
        objectsRef.current.push(ambient);
      }
      
      addNotification?.(`⚙️ Applied config: ${mod.name}`, 'success');
      
    } catch (error) {
      console.error('Error applying config:', error);
      addNotification?.(`Failed to apply config: ${error.message}`, 'error');
    }
  }, [addNotification]);

  // ========== CREATE BASIC OBJECT ==========
  const createBasicObjectFromMod = useCallback((mod, position) => {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: mod.metadata?.color || 0x6c5ce7,
      emissive: mod.metadata?.color || 0x6c5ce7,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.95
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = !performanceMode.disableShadows;
    mesh.receiveShadow = !performanceMode.disableShadows;
    
    // Add physics
    const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    const body = new CANNON.Body({ mass: mod.metadata?.mass || 1 });
    body.addShape(shape);
    body.position.copy(position);
    physicsWorldRef.current.addBody(body);
    
    mesh.userData = {
      physicsBody: body,
      modType: 'basic',
      modId: mod.id,
      modName: mod.name,
      createdAt: Date.now()
    };
    
    sceneRef.current.add(mesh);
    objectsRef.current.push(mesh);
    modObjectsRef.current.push(mesh);
    
    addNotification?.(`📦 Created: ${mod.name}`, 'success');
    
    return mesh;
  }, [performanceMode.disableShadows, addNotification]);

  // ========== CLEAR WORLD ==========
  const clearWorld = useCallback(() => {
    // Remove all mod objects
    modObjectsRef.current.forEach(obj => {
      if (obj.parent) obj.parent.remove(obj);
      
      // Clean up geometries and materials
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      
      // Remove physics bodies
      if (obj.userData?.physicsBody && physicsWorldRef.current) {
        physicsWorldRef.current.removeBody(obj.userData.physicsBody);
      }
    });
    
    modObjectsRef.current = [];
    
    // Keep environment objects but clear mod data
    objectsRef.current = objectsRef.current.filter(obj => !obj.userData?.modType);
    
    // Clear mod animations
    window.__modAnimations = {};
    
    addNotification?.('🧹 Quantum realm cleared', 'success');
  }, [addNotification]);

  // ========== FILE HANDLING ==========
  const handleFileDrop = useCallback(async (file) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const mod = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        data: e.target.result,
        metadata: {
          uploaded_by: 'user',
          version: '1.0.0',
          category: detectCategory(file.name),
          color: getModColor(file.name),
          icon: getModIcon(file.name),
          uploaded_at: new Date().toISOString()
        }
      };
      
      await addModToWorld(mod, new THREE.Vector3(0, 5, 0));
    };
    
    reader.onerror = () => {
      addNotification?.(`Failed to read file: ${file.name}`, 'error');
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else if (file.type === 'application/json') {
      reader.readAsText(file);
    } else {
      reader.readAsText(file, 'UTF-8');
    }
  }, [addNotification, addModToWorld]);

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx', 'mjs'].includes(ext)) return 'javascript';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['glb', 'gltf', 'fbx', 'obj', 'stl'].includes(ext)) return '3d-model';
    if (['json', 'yml', 'yaml', 'toml'].includes(ext)) return 'config';
    if (['css', 'scss', 'less', 'styl'].includes(ext)) return 'style';
    if (['html', 'htm', 'xhtml'].includes(ext)) return 'html';
    if (['txt', 'md', 'markdown'].includes(ext)) return 'text';
    return 'basic';
  };

  const detectCategory = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('character') || name.includes('player') || name.includes('hero')) return 'character';
    if (name.includes('vehicle') || name.includes('car') || name.includes('ship')) return 'vehicle';
    if (name.includes('building') || name.includes('house') || name.includes('tower')) return 'building';
    if (name.includes('tree') || name.includes('plant') || name.includes('flower')) return 'nature';
    if (name.includes('weapon') || name.includes('gun') || name.includes('sword')) return 'weapon';
    if (name.includes('effect') || name.includes('particle') || name.includes('spell')) return 'effect';
    if (name.includes('ui') || name.includes('interface') || name.includes('hud')) return 'ui';
    if (name.includes('ai') || name.includes('bot') || name.includes('enemy')) return 'ai';
    if (name.includes('crystal') || name.includes('gem') || name.includes('ore')) return 'resource';
    return 'object';
  };

  const getModColor = (filename) => {
    const category = detectCategory(filename);
    const colors = {
      'character': '#ff6b6b',
      'vehicle': '#4ecdc4',
      'building': '#45b7d1',
      'nature': '#96ceb4',
      'weapon': '#feca57',
      'effect': '#ff9ff3',
      'ui': '#54a0ff',
      'ai': '#5f27cd',
      'resource': '#ff9f43',
      'object': '#8395a7',
      'default': '#6c5ce7'
    };
    return colors[category] || colors.default;
  };

  const getModIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx', 'mjs'].includes(ext)) return 'fa-code';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'fa-image';
    if (['glb', 'gltf', 'fbx', 'obj'].includes(ext)) return 'fa-cube';
    if (['json', 'yml', 'yaml'].includes(ext)) return 'fa-cogs';
    if (['css', 'scss', 'less'].includes(ext)) return 'fa-paint-brush';
    if (['html', 'htm'].includes(ext)) return 'fa-code';
    if (['txt', 'md'].includes(ext)) return 'fa-file-alt';
    return 'fa-file';
  };

  // ========== HELPER FUNCTIONS ==========
  const dataURLToBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  };

  const createParticleEffect = (position, color) => {
    if (!sceneRef.current || performanceMode.reduceParticles) return;
    
    const particleCount = performanceMode.lowQuality ? 20 : 50;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.2
      );
      particle.userData.life = 1.0;
      
      particles.add(particle);
    }
    
    sceneRef.current.add(particles);
    particlesRef.current.push(particles);
    
    // Animate particles
    const animateParticles = () => {
      if (!sceneRef.current || !particles.parent) return;
      
      let allDead = true;
      
      particles.children.forEach((particle) => {
        particle.userData.life -= 0.01;
        particle.position.add(particle.userData.velocity);
        particle.userData.velocity.y -= 0.005;
        particle.material.opacity = particle.userData.life;
        
        if (particle.userData.life > 0) {
          allDead = false;
        }
      });
      
      if (!allDead) {
        requestAnimationFrame(animateParticles);
      } else {
        sceneRef.current.remove(particles);
        const index = particlesRef.current.indexOf(particles);
        if (index > -1) particlesRef.current.splice(index, 1);
      }
    };
    
    animateParticles();
  };

  const createGlowEffect = (position, color) => {
    if (!sceneRef.current || performanceMode.disableEffects) return;
    
    const glowGeometry = new THREE.SphereGeometry(2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(position);
    sceneRef.current.add(glowMesh);
    
    // Animate glow
    let scale = 1;
    const animateGlow = () => {
      if (!sceneRef.current || !glowMesh.parent) return;
      
      scale += 0.03;
      glowMesh.scale.setScalar(scale);
      glowMesh.material.opacity -= 0.02;
      
      if (glowMesh.material.opacity > 0) {
        requestAnimationFrame(animateGlow);
      } else {
        sceneRef.current.remove(glowMesh);
      }
    };
    
    animateGlow();
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    isMountedRef.current = true;
    
    const initTimer = setTimeout(() => {
      initialize3DWorld();
    }, 100);
    
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      
      if (labelRendererRef.current) {
        labelRendererRef.current.setSize(width, height);
      }
      
      if (composerRef.current) {
        composerRef.current.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Event listeners for mods
    const handleAddModToWorld = async (event) => {
      try {
        const { mod, position } = event.detail;
        await addModToWorld(mod, position || new THREE.Vector3(0, 5, 0));
      } catch (error) {
        console.error('Error adding mod:', error);
        addNotification?.('Failed to add mod', 'error');
      }
    };
    
    const handleExecuteModScript = (event) => {
      try {
        const { mod, script, position } = event.detail;
        executeJavaScriptMod(mod, script || mod.data, position || new THREE.Vector3(0, 5, 0));
      } catch (error) {
        console.error('Error executing script:', error);
        addNotification?.('Failed to execute script', 'error');
      }
    };
    
    const handleClearWorld = () => {
      clearWorld();
    };
    
    window.addEventListener('add-mod-to-world', handleAddModToWorld);
    window.addEventListener('execute-mod-script', handleExecuteModScript);
    window.addEventListener('clear-world', handleClearWorld);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('add-mod-to-world', handleAddModToWorld);
      window.removeEventListener('execute-mod-script', handleExecuteModScript);
      window.removeEventListener('clear-world', handleClearWorld);
      cleanup3DWorld();
    };
  }, [initialize3DWorld, cleanup3DWorld, executeJavaScriptMod, addModToWorld, clearWorld, addNotification]);

  // ========== RENDER ==========
  if (error) {
    return (
      <div className="error-fallback" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, #0a0c15, #03050a)',
        color: 'white',
        gap: '20px',
        fontFamily: 'Space Grotesk, sans-serif'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '3px solid rgba(255,107,107,0.3)',
          borderTopColor: '#ff6b6b',
          animation: 'spin 1s infinite',
          marginBottom: '20px'
        }}></div>
        <i className="fas fa-exclamation-triangle fa-4x" style={{ color: '#ff6b6b' }}></i>
        <h3 style={{ fontSize: '2rem', marginBottom: '10px', textShadow: '0 0 20px #ff6b6b' }}>Quantum Field Collapse</h3>
        <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '600px', textAlign: 'center' }}>
          {error}
        </p>
        <button 
          className="btn-quantum-primary"
          onClick={() => {
            setError(null);
            setIsInitialized(false);
            initAttemptRef.current = 0;
            initialize3DWorld();
          }}
          style={{
            padding: '14px 36px',
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            border: 'none',
            borderRadius: '40px',
            color: 'white',
            cursor: 'pointer',
            marginTop: '20px',
            boxShadow: '0 0 30px rgba(108,92,231,0.5)',
            transition: 'all 0.3s',
            fontWeight: '600',
            letterSpacing: '2px'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <i className="fas fa-atom" style={{ marginRight: '10px' }}></i>
          RESTORE REALITY
        </button>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="quantum-world-container"
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        minHeight: '700px',
        border: isDraggingOverWorld ? '3px dashed #a29bfe' : 'none',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: isDraggingOverWorld 
          ? '0 0 80px rgba(108, 92, 231, 0.8), inset 0 0 40px rgba(162, 155, 254, 0.3)' 
          : '0 0 40px rgba(0,0,0,0.6)',
        background: '#03050a'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="three-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDraggingOverWorld ? 'copy' : 'grab'
        }}
      />
      
      {!isInitialized && !error && (
        <div className="quantum-loading-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(3,5,10,0.95)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          zIndex: 100,
          fontFamily: 'Space Grotesk, sans-serif'
        }}>
          <div className="quantum-spinner" style={{
            width: '80px',
            height: '80px',
            border: '4px solid rgba(108,92,231,0.2)',
            borderTopColor: '#6c5ce7',
            borderRightColor: '#a29bfe',
            borderRadius: '50%',
            animation: 'spin 1.2s infinite cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            marginBottom: '30px',
            boxShadow: '0 0 40px rgba(108,92,231,0.3)'
          }}></div>
          <p style={{ 
            marginTop: '20px', 
            fontSize: '1.6rem', 
            letterSpacing: '4px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(108,92,231,0.5)'
          }}>
            QUANTUM ENTANGLEMENT
          </p>
          <p style={{ fontSize: '1rem', opacity: 0.8, marginTop: '20px' }}>
            Initializing quantum field...
          </p>
          <div style={{
            display: 'flex',
            gap: '30px',
            marginTop: '30px',
            fontSize: '0.9rem',
            color: 'rgba(162,155,254,0.9)'
          }}>
            <span><i className="fas fa-microchip"></i> {gpuTier.toUpperCase()} MODE</span>
            <span><i className="fas fa-memory"></i> {deviceMemory}GB RAM</span>
            <span><i className="fas fa-tachometer-alt"></i> {performanceScore.toFixed(1)} SCORE</span>
          </div>
        </div>
      )}
      
      {isInitialized && (
        <>
          {/* Performance indicator */}
          <div className="performance-indicator" style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(10,15,25,0.8)',
            backdropFilter: 'blur(15px)',
            padding: '10px 20px',
            borderRadius: '40px',
            border: '1px solid rgba(108,92,231,0.4)',
            color: 'rgba(255,255,255,0.95)',
            fontSize: '0.85rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.3)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-tachometer-alt" style={{ color: '#6c5ce7' }}></i>
              {fpsCounterRef.current.fps} FPS
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-layer-group" style={{ color: '#a29bfe' }}></i>
              {gpuTier.toUpperCase()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-cube" style={{ color: '#00cec9' }}></i>
              {objectsRef.current.length}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-code" style={{ color: '#fd79a8' }}></i>
              {modObjectsRef.current.length}
            </span>
          </div>
          
          {/* World UI */}
          <div className="quantum-world-ui" style={{
            position: 'absolute',
            bottom: '30px',
            left: '30px',
            right: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pointerEvents: 'none',
            zIndex: 500
          }}>
            <div className="world-header" style={{
              background: 'rgba(10,15,25,0.8)',
              backdropFilter: 'blur(15px)',
              padding: '20px 28px',
              borderRadius: '20px',
              border: '1px solid rgba(108,92,231,0.4)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
              pointerEvents: 'auto',
              transition: 'all 0.3s'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                fontWeight: '700',
                letterSpacing: '1px'
              }}>
                <i className="fas fa-atom" style={{ color: '#6c5ce7' }}></i>
                {worldName || 'QUANTUM NEXUS'}
              </h3>
              <div className="stats" style={{ 
                display: 'flex', 
                gap: '30px', 
                marginTop: '12px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.9rem'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-cube"></i> {objectsRef.current.length} Objects
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-code"></i> {modObjectsRef.current.length} Mods
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-microchip"></i> {gpuTier} Mode
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-atom"></i> Quantum Active
                </span>
              </div>
            </div>
            
            <div className="world-controls" style={{
              display: 'flex',
              gap: '15px',
              pointerEvents: 'auto'
            }}>
              <button 
                className="btn-quantum-control"
                onClick={() => {
                  const position = new THREE.Vector3(
                    (Math.random() - 0.5) * 30,
                    8,
                    (Math.random() - 0.5) * 30
                  );
                  
                  const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
                  const material = new THREE.MeshStandardMaterial({
                    color: Math.random() * 0xffffff,
                    emissive: new THREE.Color().setHSL(Math.random(), 0.9, 0.5),
                    emissiveIntensity: 0.4,
                    metalness: 0.8,
                    roughness: 0.2,
                    transparent: true,
                    opacity: 0.95
                  });
                  
                  const cube = new THREE.Mesh(geometry, material);
                  cube.position.copy(position);
                  cube.castShadow = !performanceMode.disableShadows;
                  cube.receiveShadow = !performanceMode.disableShadows;
                  
                  const shape = new CANNON.Box(new CANNON.Vec3(0.9, 0.9, 0.9));
                  const body = new CANNON.Body({ mass: 1 });
                  body.addShape(shape);
                  body.position.copy(position);
                  physicsWorldRef.current.addBody(body);
                  
                  cube.userData.physicsBody = body;
                  sceneRef.current.add(cube);
                  objectsRef.current.push(cube);
                  
                  addNotification?.('⚡ Quantum object materialized', 'success');
                  createParticleEffect(position, cube.material.emissive.getHex());
                }}
                style={{
                  background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 24px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  boxShadow: '0 8px 25px rgba(108,92,231,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(108,92,231,0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(108,92,231,0.5)';
                }}
              >
                <i className="fas fa-cube"></i> SPAWN OBJECT
              </button>
              
              <button 
                className="btn-quantum-control"
                onClick={clearWorld}
                style={{
                  background: 'rgba(200,70,100,0.9)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 24px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  boxShadow: '0 8px 25px rgba(200,70,100,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(200,70,100,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(200,70,100,0.4)';
                }}
              >
                <i className="fas fa-trash"></i> CLEAR MODS
              </button>
            </div>
          </div>
          
          {/* Instructions overlay */}
          <div className="instructions-overlay" style={{
            position: 'absolute',
            bottom: '30px',
            right: '30px',
            background: 'rgba(10,15,25,0.7)',
            backdropFilter: 'blur(15px)',
            padding: '16px 24px',
            borderRadius: '16px',
            border: '1px solid rgba(108,92,231,0.3)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '0.85rem',
            pointerEvents: 'none',
            zIndex: 500,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span><i className="fas fa-mouse-pointer" style={{ color: '#6c5ce7' }}></i> Drag to orbit</span>
              <span><i className="fas fa-mouse" style={{ color: '#a29bfe' }}></i> Scroll to zoom</span>
              <span><i className="fas fa-arrows-alt" style={{ color: '#fd79a8' }}></i> Right-click pan</span>
              <span><i className="fas fa-cube" style={{ color: '#00cec9' }}></i> Drag mods here!</span>
            </p>
          </div>
          
          {/* Drop hint overlay */}
          {isDraggingOverWorld && (
            <div className="drop-hint" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(108,92,231,0.2)',
              backdropFilter: 'blur(12px)',
              zIndex: 2000,
              pointerEvents: 'none',
              border: '3px dashed #a29bfe',
              animation: 'pulseGlow 2s infinite'
            }}>
              <div className="drop-hint-content" style={{
                textAlign: 'center',
                color: 'white',
                transform: 'scale(1.3)'
              }}>
                <i className="fas fa-cloud-upload-alt fa-5x" style={{ 
                  color: '#a29bfe', 
                  marginBottom: '25px',
                  filter: 'drop-shadow(0 0 30px #6c5ce7)'
                }}></i>
                <h3 style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: '15px', 
                  textShadow: '0 0 30px #6c5ce7, 0 0 60px #4a3a8a',
                  letterSpacing: '4px',
                  fontWeight: '800'
                }}>
                  DROP MOD HERE
                </h3>
                <p style={{ 
                  fontSize: '1.3rem', 
                  opacity: 0.95,
                  textShadow: '0 0 20px rgba(0,0,0,0.5)'
                }}>
                  Manifest in quantum reality
                </p>
              </div>
            </div>
          )}
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulseGlow {
          0% { box-shadow: inset 0 0 40px rgba(108,92,231,0.3), 0 0 60px rgba(108,92,231,0.2); }
          50% { box-shadow: inset 0 0 80px rgba(162,155,254,0.4), 0 0 100px rgba(108,92,231,0.3); }
          100% { box-shadow: inset 0 0 40px rgba(108,92,231,0.3), 0 0 60px rgba(108,92,231,0.2); }
        }
        
        .btn-quantum-control {
          position: relative;
          overflow: hidden;
        }
        
        .btn-quantum-control::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -20%;
          width: 140%;
          height: 200%;
          background: linear-gradient(
            to right,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.3) 50%,
            rgba(255,255,255,0) 100%
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
          pointer-events: none;
        }
        
        @keyframes shine {
          0% { left: -20%; }
          20% { left: 120%; }
          100% { left: 120%; }
        }
        
        .three-canvas {
          transition: filter 0.5s;
        }
        
        .quantum-world-container {
          animation: worldAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes worldAppear {
          0% { opacity: 0; transform: scale(0.95) rotateX(2deg); }
          100% { opacity: 1; transform: scale(1) rotateX(0); }
        }
      `}</style>
    </div>
  );
}
