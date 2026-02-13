'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';

export default function ThreeWorld({ addNotification, worldName }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // Store all THREE.js objects in refs to prevent re-creation
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const physicsWorldRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const cubesRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const isMountedRef = useRef(true);

  // Initialize on mount - ONE TIME ONLY
  useEffect(() => {
    isMountedRef.current = true;
    
    if (typeof window === 'undefined') return;
    if (!containerRef.current || !canvasRef.current) {
      console.log('Waiting for refs...');
      return;
    }

    console.log('Starting 3D initialization...');
    
    const init = () => {
      try {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        
        if (!container || !canvas) {
          throw new Error('Container or canvas not found');
        }

        const { width, height } = container.getBoundingClientRect();
        
        if (width === 0 || height === 0) {
          console.log('Container has no dimensions, waiting...');
          setTimeout(init, 100);
          return;
        }

        console.log(`Container dimensions: ${width}x${height}`);

        // ========== CLEANUP ANY EXISTING INSTANCES ==========
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
        if (sceneRef.current) {
          sceneRef.current.clear();
        }
        cubesRef.current = [];
        physicsWorldRef.current = null;

        // ========== CREATE NEW INSTANCES ==========
        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);
        scene.fog = new THREE.Fog(0x0a0a1a, 10, 100);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(15, 10, 20);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
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

        // Physics
        const physicsWorld = new CANNON.World({
          gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        physicsWorld.broadphase = new CANNON.NaiveBroadphase();
        physicsWorld.solver.iterations = 10;
        physicsWorldRef.current = physicsWorld;

        // ========== LIGHTS ==========
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

        // ========== GRID FLOOR ==========
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
        physicsWorld.addBody(groundBody);

        // ========== CREATE CUBES ==========
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
          physicsWorld.addBody(body);

          cube.userData.physicsBody = body;
          scene.add(cube);
          return cube;
        };

        // Create cubes
        const cubes = [
          addCube(new THREE.Vector3(0, 5, 0), 0xff0000),
          addCube(new THREE.Vector3(5, 10, 0), 0x00ff00),
          addCube(new THREE.Vector3(-5, 8, 5), 0x0000ff),
        ];
        cubesRef.current = cubes;

        // ========== ANIMATION LOOP ==========
        const animate = () => {
          if (!isMountedRef.current) return;
          
          animationFrameIdRef.current = requestAnimationFrame(animate);
          
          // Update physics
          if (physicsWorldRef.current) {
            physicsWorldRef.current.step(1/60);
          }
          
          // Update cubes from physics
          cubesRef.current.forEach(cube => {
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
          if (rendererRef.current && cameraRef.current && sceneRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        };

        // Start animation
        animate();
        
        // Mark as initialized
        setIsInitialized(true);
        if (addNotification) {
          addNotification(`${worldName || '3D World'} loaded!`, 'success');
        }
        
        console.log('3D World initialized successfully');

      } catch (err) {
        console.error('3D Initialization error:', err);
        setError(err.message);
        if (isMountedRef.current && addNotification) {
          addNotification(`3D Error: ${err.message}`, 'error');
        }
      }
    };

    // Start initialization
    init();

    // Handle resize
    const handleResize = () => {
      if (!isMountedRef.current || !containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const container = containerRef.current;
      const { width, height } = container.getBoundingClientRect();
      
      if (width === 0 || height === 0) return;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    // Use ResizeObserver for better performance
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Also listen to window resize for good measure
    window.addEventListener('resize', handleResize);

    // ========== CLEANUP ==========
    return () => {
      console.log('Cleaning up 3D world...');
      isMountedRef.current = false;
      
      // Cancel animation frame
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      // Dispose resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      // Remove window listener
      window.removeEventListener('resize', handleResize);
      
      // Dispose Three.js objects
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      
      // Clean up cubes
      cubesRef.current.forEach(cube => {
        if (cube.geometry) cube.geometry.dispose();
        if (cube.material) {
          if (Array.isArray(cube.material)) {
            cube.material.forEach(m => m.dispose());
          } else {
            cube.material.dispose();
          }
        }
      });
      cubesRef.current = [];
      
      // Clear scene
      if (sceneRef.current) {
        sceneRef.current.clear();
        sceneRef.current = null;
      }
      
      cameraRef.current = null;
      physicsWorldRef.current = null;
    };
  }, [addNotification, worldName]); // Run only once on mount

  // Debug: Log render state
  useEffect(() => {
    console.log('ThreeWorld render state:', {
      isInitialized,
      error,
      container: !!containerRef.current,
      canvas: !!canvasRef.current,
      scene: !!sceneRef.current,
      renderer: !!rendererRef.current
    });
  }, [isInitialized, error]);

  // ========== RENDER ==========
  if (error) {
    return (
      <div className="error-fallback">
        <i className="fas fa-exclamation-triangle fa-3x"></i>
        <h3>3D World Failed to Load</h3>
        <p>Error: {error}</p>
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
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        minHeight: '500px'
      }}
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
      
      {isInitialized && (
        <>
          <div className="world-ui">
            <div className="world-header">
              <h3>{worldName || '3D World'}</h3>
              <div className="stats">
                <span className="stat">Objects: {cubesRef.current.length}</span>
                <span className="stat">Physics: Active</span>
              </div>
            </div>
            
            <div className="controls">
              <button className="btn btn-small" onClick={() => addNotification('Add Object feature coming soon', 'info')}>
                <i className="fas fa-cube"></i> Add Object
              </button>
              <button className="btn btn-small" onClick={() => {
                if (sceneRef.current) {
                  cubesRef.current.forEach(cube => {
                    if (cube.userData?.physicsBody) {
                      cube.userData.physicsBody.applyImpulse(
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
          
          <div className="instructions">
            <p>Click and drag to orbit • Scroll to zoom • Right-click to pan</p>
          </div>
        </>
      )}
    </div>
  );
}
