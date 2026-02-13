'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer, BloomEffect, VignetteEffect } from '@react-three/postprocessing';
import { gsap } from 'gsap';

export default function ThreeWorld() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const worldRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const physicsWorld = useRef(new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) }));

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize THREE.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 10, 100);

    // Camera with cinematic effects
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 20);

    // Advanced renderer with effects
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    // Advanced OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2.2;

    // Physics world setup
    physicsWorld.current.gravity.set(0, -9.82, 0);
    physicsWorld.current.broadphase = new CANNON.NaiveBroadphase();
    physicsWorld.current.solver.iterations = 10;

    // Advanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 30, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x6c5ce7, 3, 100);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    const hemisphereLight = new THREE.HemisphereLight(0x4433ff, 0x00ffaa, 0.5);
    scene.add(hemisphereLight);

    // Grid floor with physics
    const gridSize = 100;
    const gridDivisions = 100;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x6c5ce7, 0x6c5ce7);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Physics ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physicsWorld.current.addBody(groundBody);

    // Particle system
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      colors[i] = Math.random();
      colors[i + 1] = Math.random();
      colors[i + 2] = Math.random();
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Add default interactive objects
    const addInteractiveCube = (position, color = 0x6c5ce7, size = 2) => {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.3
      });

      const cube = new THREE.Mesh(geometry, material);
      cube.position.copy(position);
      cube.castShadow = true;
      cube.receiveShadow = true;

      // Physics body
      const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
      const body = new CANNON.Body({ mass: 1 });
      body.addShape(shape);
      body.position.copy(position);
      physicsWorld.current.addBody(body);

      // Interactive properties
      cube.userData = {
        type: 'interactive',
        physicsBody: body,
        update: (time) => {
          cube.position.copy(body.position);
          cube.quaternion.copy(body.quaternion);
          cube.rotation.y = time * 0.001;
        }
      };

      scene.add(cube);
      return cube;
    };

    // Create initial objects
    const initialObjects = [];
    for (let i = 0; i < 5; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        5 + Math.random() * 10,
        (Math.random() - 0.5) * 20
      );
      const color = new THREE.Color(Math.random() * 0xffffff);
      initialObjects.push(addInteractiveCube(pos, color));
    }

    setObjects(initialObjects);

    // Animation loop
    let lastTime = 0;
    const animate = (currentTime) => {
      requestAnimationFrame(animate);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update physics
      if (delta > 0) {
        physicsWorld.current.step(1/60, delta, 3);
      }

      // Update objects
      scene.traverse((object) => {
        if (object.userData && object.userData.update) {
          object.userData.update(currentTime);
        }
      });

      // Animate particles
      particleSystem.rotation.y += 0.001;

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate(0);

    sceneRef.current = scene;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const addObjectFromMod = async (modData) => {
    if (!sceneRef.current) return;

    try {
      // Parse mod data
      const mod = typeof modData === 'string' ? JSON.parse(modData) : modData;
      
      if (mod.type === 'javascript') {
        // Execute JavaScript mod
        const sandbox = createSandbox(sceneRef.current, physicsWorld.current);
        const result = await executeInSandbox(mod.code, sandbox);
        
        if (result && result.object) {
          sceneRef.current.add(result.object);
          setObjects(prev => [...prev, result.object]);
        }
      } else if (mod.type === '3d-model') {
        // Load 3D model
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(mod.url);
        sceneRef.current.add(gltf.scene);
        setObjects(prev => [...prev, gltf.scene]);
      }
    } catch (error) {
      console.error('Error adding mod:', error);
    }
  };

  const createSandbox = (scene, physicsWorld) => {
    return {
      THREE,
      CANNON,
      gsap,
      scene,
      physicsWorld,
      Math,
      Date,
      console: {
        log: (...args) => console.log('[Sandbox]:', ...args),
        warn: (...args) => console.warn('[Sandbox]:', ...args),
        error: (...args) => console.error('[Sandbox]:', ...args)
      },
      setTimeout: (fn, delay) => setTimeout(fn, delay),
      setInterval: (fn, interval) => setInterval(fn, interval),
      clearTimeout: (id) => clearTimeout(id),
      clearInterval: (id) => clearInterval(id)
    };
  };

  const executeInSandbox = async (code, sandbox) => {
    try {
      // Create a function from the code with sandboxed scope
      const func = new Function(...Object.keys(sandbox), `
        "use strict";
        try {
          ${code}
          return typeof createObject !== 'undefined' ? createObject() : undefined;
        } catch(error) {
          console.error('Sandbox error:', error);
          return null;
        }
      `);
      
      return func(...Object.values(sandbox));
    } catch (error) {
      console.error('Execution error:', error);
      return null;
    }
  };

  return (
    <div className="world-container">
      <canvas ref={canvasRef} className="three-canvas" />
      <div className="world-stats">
        <div className="stat">Objects: {objects.length}</div>
        <div className="stat">Physics: Active</div>
        <div className="stat">FPS: 60</div>
      </div>
    </div>
  );
}
