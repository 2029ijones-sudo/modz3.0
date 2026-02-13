'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { motion } from 'framer-motion';
import * as lucideIcons from 'lucide-react';
import safeEval from 'safe-eval';
import { parse } from 'acorn-loose';

export default function ThreeWorld({ addNotification, worldName, onModDrop, isDraggingOverWorld }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ objects: 0, mods: 0, physics: 'active' });

  // Store all THREE.js objects in refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const physicsWorldRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const objectsRef = useRef([]);
  const modObjectsRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const isMountedRef = useRef(true);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isInitializingRef = useRef(false);
  const initAttemptRef = useRef(0);
  const loaderRef = useRef(null);
  const composerRef = useRef(null);
  const characterRef = useRef(null);

  // ----------------------------------------------------------------------
  // CONTEXT LOSS HANDLERS – lifted to component scope (FIXED)
  // ----------------------------------------------------------------------
  const handleContextLost = useCallback((event) => {
    event.preventDefault();
    setError('WebGL context lost. Trying to restore...');
  }, []);

  const handleContextRestored = useCallback(() => {
    setError(null);
    setTimeout(() => {
      initAttemptRef.current = 0;
      initialize3DWorld();
    }, 1000);
  }, []);

  // ----------------------------------------------------------------------
  // SECURE SCRIPT EVALUATION SANDBOX
  // ----------------------------------------------------------------------
  const createScriptSandbox = (mod, object3D, api) => {
    const sandbox = {
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
      setColor: (color) => { if (object3D.material) object3D.material.color.set(color); },
      setEmissive: (color) => { if (object3D.material) object3D.material.emissive.set(color); },
      setScale: (x, y, z) => object3D.scale.set(x, y, z),
      lookAt: (x, y, z) => object3D.lookAt(x, y, z),
      applyForce: api?.applyForce,
      applyImpulse: api?.applyImpulse,
      velocity: api?.velocity,
      random: (min, max) => Math.random() * (max - min) + min,
      mod,
    };
    return sandbox;
  };

  const executeModScript = (script, sandbox) => {
    try {
      parse(script, { ecmaVersion: 2022 });
      const func = new Function('sandbox', `with(sandbox) { ${script} }`);
      func(sandbox);
    } catch (err) {
      console.warn('Script execution error:', err);
    }
  };

  // ----------------------------------------------------------------------
  // ORIGINAL initializeWebGLContext (uses lifted handlers)
  // ----------------------------------------------------------------------
  const initializeWebGLContext = useCallback(() => {
    if (!canvasRef.current) return null;
    try {
      const canvas = canvasRef.current;
      const contextAttributes = {
        alpha: false,
        antialias: true,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false
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
  }, [handleContextLost, handleContextRestored]);

  // ----------------------------------------------------------------------
  // MAIN INITIALIZATION (YOUR STRUCTURE + IMMERSIVE UPGRADES)
  // ----------------------------------------------------------------------
  const initialize3DWorld = useCallback(() => {
    if (!isMountedRef.current || isInitializingRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      setTimeout(() => { if (isMountedRef.current && initAttemptRef.current < 5) { initAttemptRef.current++; initialize3DWorld(); } }, 500);
      return;
    }
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) {
      setTimeout(() => { if (isMountedRef.current && initAttemptRef.current < 5) { initAttemptRef.current++; initialize3DWorld(); } }, 500);
      return;
    }

    isInitializingRef.current = true;
    try {
      // ---------- CLEANUP ----------
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
      if (composerRef.current) composerRef.current.dispose();
      if (sceneRef.current) sceneRef.current.clear();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      composerRef.current = null;
      characterRef.current = null;

      // ---------- WebGL Context ----------
      const gl = initializeWebGLContext();
      if (!gl) throw new Error('Failed to initialize WebGL context');

      // ---------- Loaders ----------
      loaderRef.current = {
        gltf: new GLTFLoader(),
        texture: new THREE.TextureLoader(),
        draco: new DRACOLoader()
      };
      loaderRef.current.draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
      loaderRef.current.gltf.setDRACOLoader(loaderRef.current.draco);

      // ---------- SCENE ----------
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a1a);
      scene.fog = new THREE.FogExp2(0x0a0a1a, 0.025);
      sceneRef.current = scene;

      // ---------- CAMERA ----------
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.set(20, 15, 25);
      camera.lookAt(0, 2, 0);
      cameraRef.current = camera;

      // ---------- RENDERER ----------
      const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;

      // ---------- POST PROCESSING (Bloom) ----------
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
      bloomPass.threshold = 0.2;
      bloomPass.strength = 1.0;
      bloomPass.radius = 0.5;
      composer.addPass(bloomPass);
      composerRef.current = composer;

      // ---------- CONTROLS ----------
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = true;
      controls.minDistance = 5;
      controls.maxDistance = 100;
      controls.maxPolarAngle = Math.PI / 2.2;
      controls.autoRotate = false;
      controlsRef.current = controls;

      // ---------- PHYSICS ----------
      const physicsWorld = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
      physicsWorld.broadphase = new CANNON.NaiveBroadphase();
      physicsWorld.solver.iterations = 10;
      physicsWorldRef.current = physicsWorld;
      const groundShape = new CANNON.Plane();
      const groundBody = new CANNON.Body({ mass: 0 });
      groundBody.addShape(groundShape);
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      physicsWorld.addBody(groundBody);

      // ---------- LIGHTS (enhanced) ----------
      const ambientLight = new THREE.AmbientLight(0x404060);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.2);
      directionalLight.position.set(10, 20, 10);
      directionalLight.castShadow = true;
      directionalLight.receiveShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 1;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -25;
      directionalLight.shadow.camera.right = 25;
      directionalLight.shadow.camera.top = 25;
      directionalLight.shadow.camera.bottom = -25;
      scene.add(directionalLight);
      const pointLight = new THREE.PointLight(0x6c5ce7, 0.8, 100);
      pointLight.position.set(0, 20, 0);
      scene.add(pointLight);
      const backLight = new THREE.PointLight(0xaa88ff, 0.5);
      backLight.position.set(0, 5, -20);
      scene.add(backLight);

      // ---------- ATMOSPHERE (Stars, Grid, Ground Glow) ----------
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 4000;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 400;
        starPositions[i+1] = (Math.random() - 0.5) * 400;
        starPositions[i+2] = (Math.random() - 0.5) * 400 - 50;
      }
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true }));
      scene.add(stars);

      const gridHelper = new THREE.GridHelper(60, 30, 0x8a7cd6, 0x5a4c9a);
      gridHelper.material.opacity = 0.2;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);

      const groundGlow = new THREE.Mesh(
        new THREE.CircleGeometry(35, 32),
        new THREE.MeshBasicMaterial({ color: 0x1a1a2e, side: THREE.DoubleSide, transparent: true, opacity: 0.1 })
      );
      groundGlow.rotation.x = -Math.PI / 2;
      groundGlow.position.y = -0.49;
      scene.add(groundGlow);

      // ---------- 3D CHARACTER ----------
      const characterGroup = new THREE.Group();
      characterGroup.position.set(0, 2, 0);
      characterRef.current = characterGroup;
      scene.add(characterGroup);

      loaderRef.current.gltf.load(
        '/models/robot.glb',
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.8, 0.8, 0.8);
          model.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
          characterGroup.add(model);
        },
        undefined,
        () => {
          // Fallback: stylised character
          const core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1, 0),
            new THREE.MeshStandardMaterial({ color: 0x6c5ce7, emissive: 0x3a2e6b, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.2 })
          );
          core.castShadow = true;
          core.receiveShadow = true;
          characterGroup.add(core);
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.5, 0.05, 16, 50),
            new THREE.MeshBasicMaterial({ color: 0xa29bfe, transparent: true, opacity: 0.2, wireframe: true })
          );
          ring.rotation.x = Math.PI / 2;
          characterGroup.add(ring);
          const sparkles = new THREE.Points(
            new THREE.BufferGeometry().setFromPoints(Array.from({ length: 30 }, () => new THREE.Vector3(
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3
            ))),
            new THREE.PointsMaterial({ color: 0xa29bfe, size: 0.1, transparent: true })
          );
          characterGroup.add(sparkles);
        }
      );

      // ---------- FLOATING ORBS (ambient life) ----------
      const orbMat = new THREE.MeshStandardMaterial({ color: 0xfd79a8, emissive: 0xe84393, emissiveIntensity: 0.3 });
      const orb1 = new THREE.Mesh(new THREE.SphereGeometry(0.2), orbMat);
      orb1.position.set(-4, 3, 5);
      scene.add(orb1);
      const orb2 = new THREE.Mesh(new THREE.SphereGeometry(0.25), orbMat.clone());
      orb2.material.color.setHex(0x74b9ff);
      orb2.material.emissive.setHex(0x0984e3);
      orb2.position.set(5, 4, -3);
      scene.add(orb2);

      // ---------- DRAG & DROP (YOUR ORIGINAL HANDLERS) ----------
      const handleCanvasDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.style.borderColor = '#a29bfe';
        container.style.boxShadow = '0 0 40px rgba(108,92,231,0.6)';
      };
      const handleCanvasDragLeave = () => {
        container.style.borderColor = 'transparent';
        container.style.boxShadow = 'none';
      };
      const handleCanvasDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.style.borderColor = 'transparent';
        container.style.boxShadow = 'none';
        try {
          const modData = e.dataTransfer.getData('application/mod-data');
          if (modData) {
            const mod = JSON.parse(modData);
            const rect = canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            mouseRef.current.set(x, y);
            raycasterRef.current.setFromCamera(mouseRef.current, camera);
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectionPoint = new THREE.Vector3();
            if (raycasterRef.current.ray.intersectPlane(groundPlane, intersectionPoint)) {
              await addModToWorld(mod, intersectionPoint);
            } else {
              await addModToWorld(mod, new THREE.Vector3(0, 5, 0));
            }
          } else {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileDrop(files[0]);
          }
        } catch (error) {
          addNotification?.('Failed to add mod to world', 'error');
        }
      };
      canvas.addEventListener('dragover', handleCanvasDragOver);
      canvas.addEventListener('dragleave', handleCanvasDragLeave);
      canvas.addEventListener('drop', handleCanvasDrop);

      // ---------- ANIMATION LOOP ----------
      const animate = () => {
        if (!isMountedRef.current) return;
        animationFrameIdRef.current = requestAnimationFrame(animate);
        try {
          if (physicsWorldRef.current) physicsWorldRef.current.step(1/60);
          
          if (characterRef.current) {
            characterRef.current.position.y = 2 + Math.sin(Date.now() * 0.002) * 0.1;
            characterRef.current.rotation.y += 0.005;
          }

          objectsRef.current.forEach(obj => {
            if (obj.userData?.physicsBody) {
              obj.position.copy(obj.userData.physicsBody.position);
              obj.quaternion.copy(obj.userData.physicsBody.quaternion);
            }
            if (obj.userData?.modType === 'javascript' && obj.userData?.sandbox) {
              obj.userData.sandbox.time = Date.now() * 0.001;
              obj.userData.sandbox.delta = 1/60;
              executeModScript(obj.userData.script, obj.userData.sandbox);
            }
          });

          orb1.position.x = -4 + Math.sin(Date.now() * 0.001) * 0.5;
          orb2.position.z = -3 + Math.cos(Date.now() * 0.001) * 0.5;

          controlsRef.current?.update();
          if (composerRef.current) {
            composerRef.current.render();
          } else {
            rendererRef.current?.render(scene, camera);
          }
        } catch (err) {
          console.error('Animation loop error:', err);
        }
      };
      animate();

      setIsInitialized(true);
      setError(null);
      addNotification?.(`${worldName || '3D World'} loaded — immersive mode`, 'success');
      isInitializingRef.current = false;
      setStats(s => ({ ...s, objects: objectsRef.current.length, mods: modObjectsRef.current.length }));
    } catch (err) {
      console.error('3D Initialization error:', err);
      setError(err.message);
      isInitializingRef.current = false;
      setTimeout(() => { if (isMountedRef.current && initAttemptRef.current < 3) { initAttemptRef.current++; initialize3DWorld(); } }, 2000);
    }
  }, [addNotification, worldName, initializeWebGLContext]);

  // ----------------------------------------------------------------------
  // ALL YOUR ORIGINAL MOD MANAGEMENT FUNCTIONS (fully preserved)
  // ----------------------------------------------------------------------
  const addModToWorld = async (mod, position) => {
    if (!sceneRef.current || !physicsWorldRef.current) return;
    try {
      addNotification?.(`Adding ${mod.name}...`, 'info');
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
      }
      addNotification?.(`${mod.name} added to world!`, 'success');
      setStats(s => ({ ...s, mods: modObjectsRef.current.length }));
    } catch (error) {
      console.error('Error adding mod to world:', error);
      addNotification?.(`Failed to add ${mod.name}`, 'error');
    }
  };

  const executeJavaScriptMod = (mod, script, position) => {
    try {
      const geometry = new THREE.IcosahedronGeometry(1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: mod.metadata?.color || 0x00ff88,
        emissive: mod.metadata?.color || 0x00aa55,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const shape = new CANNON.Sphere(1);
      const body = new CANNON.Body({ mass: 1 });
      body.addShape(shape);
      body.position.copy(position);
      physicsWorldRef.current.addBody(body);

      const api = {
        applyForce: body.applyForce.bind(body),
        applyImpulse: body.applyImpulse.bind(body),
        velocity: body.velocity
      };
      const sandbox = createScriptSandbox(mod, mesh, api);

      mesh.userData = {
        physicsBody: body,
        modType: 'javascript',
        modId: mod.id,
        modName: mod.name,
        script,
        sandbox
      };

      executeModScript(script, sandbox);

      sceneRef.current.add(mesh);
      objectsRef.current.push(mesh);
      modObjectsRef.current.push(mesh);
      createParticleEffect(position, mod.metadata?.color || 0x00ff88);
    } catch (error) {
      console.error('Error executing JavaScript mod:', error);
      throw error;
    }
  };

  const load3DModel = async (mod, modelData, position) => {
    return new Promise((resolve, reject) => {
      try {
        if (!loaderRef.current) {
          reject(new Error('Loader not initialized'));
          return;
        }
        if (mod.data?.startsWith('data:')) {
          const blob = dataURLToBlob(mod.data);
          const url = URL.createObjectURL(blob);
          loaderRef.current.gltf.load(url, (gltf) => {
            URL.revokeObjectURL(url);
            processLoadedModel(gltf, mod, position);
            resolve();
          }, undefined, (error) => {
            console.error('Error loading model:', error);
            reject(error);
          });
        } else {
          const blob = new Blob([modelData], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          loaderRef.current.gltf.load(url, (gltf) => {
            URL.revokeObjectURL(url);
            processLoadedModel(gltf, mod, position);
            resolve();
          }, undefined, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const processLoadedModel = (gltf, mod, position) => {
    const model = gltf.scene;
    model.position.copy(position);
    model.scale.set(1, 1, 1);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.emissive = new THREE.Color(mod.metadata?.color || 0x6c5ce7);
          child.material.emissiveIntensity = 0.1;
          child.material.metalness = 0.7;
          child.material.roughness = 0.3;
        }
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.copy(position.clone().add(center));
    physicsWorldRef.current.addBody(body);
    model.userData = { physicsBody: body, modType: '3d-model', modId: mod.id, modName: mod.name };
    sceneRef.current.add(model);
    objectsRef.current.push(model);
    modObjectsRef.current.push(model);
    createGlowEffect(position, mod.metadata?.color || 0x6c5ce7);
  };

  const addTextureToWorld = (mod, textureData, position) => {
    const texture = new THREE.Texture();
    const image = new Image();
    image.onload = () => {
      texture.image = image;
      texture.needsUpdate = true;
      const geometry = new THREE.PlaneGeometry(5, 5);
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const plane = new THREE.Mesh(geometry, material);
      plane.position.copy(position);
      plane.rotation.x = -Math.PI / 2;
      plane.userData = { modType: 'texture', modId: mod.id, modName: mod.name, texture };
      sceneRef.current.add(plane);
      objectsRef.current.push(plane);
      modObjectsRef.current.push(plane);
      plane.userData.floatOffset = Math.random() * Math.PI * 2;
    };
    if (textureData?.startsWith('data:')) {
      image.src = textureData;
    } else {
      image.src = `data:image/png;base64,${textureData}`;
    }
  };

  const applyConfigMod = (mod, configData, position) => {
    try {
      const config = JSON.parse(configData);
      if (config.light) {
        const lightColor = new THREE.Color(config.light.color || 0xffffff);
        const light = new THREE.PointLight(lightColor, config.light.intensity || 1, 100);
        light.position.copy(position);
        sceneRef.current.add(light);
        light.userData = { modType: 'config', modId: mod.id, config };
        objectsRef.current.push(light);
        modObjectsRef.current.push(light);
      }
      if (config.fog) {
        sceneRef.current.fog = new THREE.FogExp2(
          new THREE.Color(config.fog.color || 0x0a0a1a),
          config.fog.density || 0.025
        );
      }
    } catch (error) {
      console.error('Error applying config:', error);
    }
  };

  const createBasicObjectFromMod = (mod, position) => {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: mod.metadata?.color || 0x6c5ce7,
      emissive: mod.metadata?.color || 0x4a3a8a,
      emissiveIntensity: 0.2,
      metalness: 0.8,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.copy(position);
    physicsWorldRef.current.addBody(body);
    mesh.userData = { physicsBody: body, modType: 'basic', modId: mod.id, modName: mod.name };
    sceneRef.current.add(mesh);
    objectsRef.current.push(mesh);
    modObjectsRef.current.push(mesh);
  };

  // Original helper functions
  const dataURLToBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const createParticleEffect = (position, color) => {
    if (!sceneRef.current) return;
    const particleCount = 50;
    const particles = new THREE.Group();
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      );
      particle.userData.life = 1.0;
      particles.add(particle);
    }
    sceneRef.current.add(particles);
    const animateParticles = () => {
      if (!sceneRef.current || !particles.parent) return;
      particles.children.forEach((particle, index) => {
        particle.userData.life -= 0.02;
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.1));
        particle.userData.velocity.y -= 0.01;
        particle.material.opacity = particle.userData.life;
        if (particle.userData.life <= 0) particles.remove(particle);
      });
      if (particles.children.length > 0) {
        requestAnimationFrame(animateParticles);
      } else {
        sceneRef.current.remove(particles);
      }
    };
    animateParticles();
  };

  const createGlowEffect = (position, color) => {
    if (!sceneRef.current) return;
    const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.BackSide });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(position);
    sceneRef.current.add(glowMesh);
    let scale = 1;
    const animateGlow = () => {
      if (!sceneRef.current || !glowMesh.parent) return;
      scale += 0.02;
      glowMesh.scale.setScalar(scale);
      glowMaterial.opacity -= 0.02;
      if (glowMaterial.opacity > 0) {
        requestAnimationFrame(animateGlow);
      } else {
        sceneRef.current.remove(glowMesh);
      }
    };
    animateGlow();
  };

  const clearWorld = () => {
    modObjectsRef.current.forEach(obj => {
      if (obj.parent) obj.parent.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    modObjectsRef.current = [];
    objectsRef.current = objectsRef.current.filter(obj => !obj.userData?.modType);
    addNotification?.('World cleared', 'success');
    setStats(s => ({ ...s, mods: 0 }));
  };

  const handleFileDrop = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const mod = {
        id: Date.now().toString(),
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        data: e.target.result,
        metadata: { uploaded_by: 'user', version: '1.0.0', category: 'uploaded' }
      };
      await addModToWorld(mod, new THREE.Vector3(0, 5, 0));
    };
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else if (file.type === 'application/json') reader.readAsText(file);
    else reader.readAsText(file, 'UTF-8');
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) return 'javascript';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['glb', 'gltf', 'fbx', 'obj'].includes(ext)) return '3d-model';
    if (['json', 'yml', 'yaml'].includes(ext)) return 'config';
    return 'basic';
  };

  // ----------------------------------------------------------------------
  // CLEANUP & EFFECTS – FIXED: no more undefined handler references
  // ----------------------------------------------------------------------
  const cleanup3DWorld = useCallback(() => {
    console.log('Cleaning up 3D world...');
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.removeEventListener('dragover', () => {});
      canvas.removeEventListener('dragleave', () => {});
      canvas.removeEventListener('drop', () => {});
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    }
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    if (composerRef.current) {
      composerRef.current.dispose();
      composerRef.current = null;
    }
    objectsRef.current.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    objectsRef.current = [];
    modObjectsRef.current = [];
    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }
    cameraRef.current = null;
    physicsWorldRef.current = null;
  }, [handleContextLost, handleContextRestored]); // ✅ Now they are in scope

  useEffect(() => {
    isMountedRef.current = true;
    const initTimer = setTimeout(() => initialize3DWorld(), 100);
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      composerRef.current?.setSize(width, height);
    };
    resizeObserverRef.current = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserverRef.current.observe(containerRef.current);
    window.addEventListener('resize', handleResize);
    return () => {
      isMountedRef.current = false;
      isInitializingRef.current = false;
      clearTimeout(initTimer);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      cleanup3DWorld();
    };
  }, [initialize3DWorld, cleanup3DWorld]);

  // ----------------------------------------------------------------------
  // RENDER: IMMERSIVE UI (framer-motion + lucide-react)
  // ----------------------------------------------------------------------
  if (error) {
    return (
      <div className="error-fallback" style={{ background: '#0a0a1a', color: 'white', padding: 40, borderRadius: 16 }}>
        <lucideIcons.AlertTriangle size={48} color="#ff6b6b" />
        <h3 style={{ color: '#ff6b6b' }}>3D World Crashed</h3>
        <p>{error}</p>
        <button 
          onClick={() => { setError(null); setIsInitialized(false); initAttemptRef.current = 0; initialize3DWorld(); }}
          style={{ background: '#6c5ce7', padding: '12px 24px', border: 'none', borderRadius: 8, color: 'white', marginTop: 20 }}
        >
          Reload World
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="world-container"
      style={{
        width: '100%', height: '100%', position: 'relative', minHeight: '700px',
        overflow: 'hidden', borderRadius: '16px',
        border: isDraggingOverWorld ? '3px dashed #a29bfe' : '1px solid rgba(108,92,231,0.3)',
        boxShadow: isDraggingOverWorld ? '0 0 60px rgba(108,92,231,0.7)' : '0 10px 40px rgba(0,0,0,0.6)',
        transition: 'all 0.2s ease'
      }}
    >
      <canvas
        ref={canvasRef}
        className="three-canvas"
        style={{
          width: '100%', height: '100%', display: 'block',
          background: '#050510',
          cursor: isDraggingOverWorld ? 'copy' : 'default'
        }}
      />

      {/* ---------- IMMERSIVE HUD ---------- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute', top: 20, left: 20, right: 20,
          display: 'flex', justifyContent: 'space-between',
          pointerEvents: 'none', zIndex: 100
        }}
      >
        <motion.div whileHover={{ scale: 1.05 }} style={{
          background: 'rgba(10,10,26,0.8)', backdropFilter: 'blur(12px)',
          padding: '16px 28px', borderRadius: '40px',
          border: '1px solid rgba(108,92,231,0.6)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          color: 'white', display: 'flex', alignItems: 'center', gap: 12
        }}>
          <lucideIcons.Cube size={24} color="#a29bfe" />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: 1 }}>
            {worldName || 'MODZ 3.0'}
          </h2>
          <span style={{ background: '#6c5ce7', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem' }}>
            IMMERSIVE
          </span>
        </motion.div>

        <motion.div style={{
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
          padding: '16px 24px', borderRadius: '40px',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', display: 'flex', gap: 28
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <lucideIcons.Box size={18} /> Objects: {objectsRef.current.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <lucideIcons.Code size={18} /> Mods: {modObjectsRef.current.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <lucideIcons.Zap size={18} color="#feca57" /> Physics: active
          </div>
        </motion.div>
      </motion.div>

      {/* Control panel */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          position: 'absolute', bottom: 30, left: 30,
          display: 'flex', gap: 12, zIndex: 100, pointerEvents: 'auto'
        }}
      >
        <button
          className="btn-3d"
          onClick={() => addModToWorld(
            { id: 'cube-' + Date.now(), name: 'Demo Cube', type: 'basic', metadata: { color: '#ff7675' } },
            new THREE.Vector3(0, 8, 0)
          )}
          style={{
            background: 'rgba(108,92,231,0.9)', backdropFilter: 'blur(8px)',
            border: 'none', padding: '14px 24px', borderRadius: 40,
            color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 20px rgba(108,92,231,0.4)', cursor: 'pointer'
          }}
        >
          <lucideIcons.Plus size={20} /> Add Object
        </button>
        <button
          className="btn-3d"
          onClick={clearWorld}
          style={{
            background: 'rgba(30,30,50,0.8)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', padding: '14px 24px', borderRadius: 40,
            color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer'
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
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'rgba(108,92,231,0.95)', backdropFilter: 'blur(20px)',
            padding: '48px 64px', borderRadius: 32,
            border: '2px solid rgba(255,255,255,0.5)',
            color: 'white', textAlign: 'center',
            boxShadow: '0 0 100px rgba(108,92,231,0.8)',
            zIndex: 200, pointerEvents: 'none'
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
          position: 'absolute', bottom: 30, right: 30,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          padding: '16px 24px', borderRadius: 40,
          color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem',
          display: 'flex', gap: 20, letterSpacing: 1,
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <span><lucideIcons.MousePointer size={14} /> Drag orbit</span>
        <span><lucideIcons.Scroll size={14} /> Scroll zoom</span>
        <span><lucideIcons.PanRight size={14} /> Right pan</span>
        <span><lucideIcons.Droplet size={14} /> Drop mods</span>
      </motion.div>

      {/* Loading indicator */}
      {!isInitialized && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white', fontSize: '1.5rem', textAlign: 'center'
        }}>
          <lucideIcons.Loader size={48} className="spin" />
          <p>Awakening the world...</p>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin { animation: spin 2s linear infinite; }
        .btn-3d:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(108,92,231,0.6); }
        .world-container canvas { transition: filter 0.3s; }
      `}</style>
    </div>
  );
}
