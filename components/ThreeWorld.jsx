'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import { gsap } from 'gsap';

export default function ThreeWorld({ addNotification, worldName }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Keep physics world reference
  const physicsWorld = useRef(null);
  const animationRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // First: Wait for container to be available and get its size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Second: Initialize Three.js only when container has size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (containerSize.width === 0 || containerSize.height === 0) return;
    if (!containerRef.current || !canvasRef.current) return;

    let isMounted = true;

    const init = async () => {
      try {
        console.log('Initializing 3D World with size:', containerSize);
        
        const container = containerRef.current;
        const canvas = canvasRef.current;
        
        if (!container || !canvas) {
          throw new Error('Container or canvas element not found');
        }

        // Initialize THREE.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);
        scene.fog = new THREE.Fog(0x0a0a1a, 10, 100);

        // Camera
        const camera = new THREE.PerspectiveCamera(
          75, 
          containerSize.width / containerSize.height, 
          0.1, 
          1000
        );
        camera.position.set(15, 10, 20);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        });
        
        renderer.setSize(containerSize.width, containerSize.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI / 2.2;
        controlsRef.current = controls;

        // Initialize physics
        const world = new CANNON.World({
          gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;
        physicsWorld.current = world;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 30, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x6c5ce7, 3, 100);
        pointLight.position.set(0, 20, 0);
        scene.add(pointLight);

        // Grid floor
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
        world.addBody(groundBody);

        // Add sample objects
        const addCube = (position, color = 0x6c5ce7) => {
          const geometry = new THREE.BoxGeometry(2, 2, 2);
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

          // Physics
          const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
          const body = new CANNON.Body({ mass: 1 });
          body.addShape(shape);
          body.position.copy(position);
          world.addBody(body);

          cube.userData = { physicsBody: body };
          scene.add(cube);
          return cube;
        };

        // Create initial cubes
        const cubes = [
          addCube(new THREE.Vector3(0, 5, 0), 0xff0000),
          addCube(new THREE.Vector3(5, 10, 0), 0x00ff00),
          addCube(new THREE.Vector3(-5, 8, 5), 0x0000ff),
        ];

        setObjects(cubes);
        sceneRef.current = scene;

        // Animation loop
        const animate = () => {
          if (!isMounted) return;
          
          animationRef.current = requestAnimationFrame(animate);
          
          // Update physics
          if (physicsWorld.current) {
            physicsWorld.current.step(1/60);
          }
          
          // Update object positions from physics
          cubes.forEach(cube => {
            if (cube.userData?.physicsBody) {
              cube.position.copy(cube.userData.physicsBody.position);
              cube.quaternion.copy(cube.userData.physicsBody.quaternion);
            }
          });
          
          // Update controls
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
          // Render
          if (rendererRef.current && cameraRef.current && scene) {
            rendererRef.current.render(scene, cameraRef.current);
          }
        };

        // Start animation
        animate();
        
        setIsInitialized(true);
        addNotification(`${worldName} loaded successfully!`, 'success');

      } catch (error) {
        console.error('Failed to initialize 3D world:', error);
        setError(error.message);
        if (isMounted) {
          addNotification(`3D World Error: ${error.message}`, 'error');
        }
      }
    };

    init();

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      if (physicsWorld.current) {
        // Clean up physics bodies
        physicsWorld.current = null;
      }
      
      cameraRef.current = null;
    };
  }, [containerSize, addNotification, worldName]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div className="error-fallback">
        <i className="fas fa-exclamation-triangle fa-3x"></i>
        <h3>3D World Failed to Load</h3>
        <p>Error: {error}</p>
        <p>This could be due to WebGL not being supported in your browser.</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      className="world-container" 
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <canvas 
        ref={canvasRef} 
        className="three-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#0a0a1a'
        }}
      />
      
      {!isInitialized && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading 3D World...</p>
        </div>
      )}
      
      <div className="world-ui">
        <div className="world-header">
          <h3>{worldName || '3D World'}</h3>
          <div className="stats">
            <span className="stat">Objects: {objects.length}</span>
            <span className="stat">Physics: Active</span>
          </div>
        </div>
        
        <div className="controls">
          <button className="btn btn-small" onClick={() => addNotification('Add Object feature coming soon', 'info')}>
            <i className="fas fa-cube"></i> Add Object
          </button>
          <button className="btn btn-small" onClick={() => {
            if (sceneRef.current) {
              sceneRef.current.children.forEach(obj => {
                if (obj.userData?.physicsBody) {
                  obj.userData.physicsBody.applyImpulse(
                    new CANNON.Vec3(
                      (Math.random() - 0.5) * 10,
                      Math.random() * 20,
                      (Math.random() - 0.5) * 10
                    ),
                    new CANNON.Vec3(0, 0, 0)
                  );
                }
              });
              addNotification('Physics impulse applied!', 'success');
            }
          }}>
            <i className="fas fa-bolt"></i> Apply Physics
          </button>
        </div>
      </div>
      
      {/* Instructions overlay */}
      <div className="instructions">
        <p>Click and drag to orbit • Scroll to zoom • Right-click to pan</p>
      </div>
    </div>
  );
}
