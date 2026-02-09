'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { gsap } from 'gsap';

export default function ThreeWorld({ addNotification, worldName }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // Keep physics world reference
  const physicsWorld = useRef(null);

  useEffect(() => {
    // Don't run on server side
    if (typeof window === 'undefined') return;
    
    const init = async () => {
      try {
        if (!containerRef.current || !canvasRef.current) {
          throw new Error('Container or canvas not found');
        }

        console.log('Initializing 3D World...');
        
        // Get container dimensions
        const container = containerRef.current;
        const { width, height } = container.getBoundingClientRect();
        
        if (width === 0 || height === 0) {
          throw new Error('Container has zero dimensions');
        }

        // Initialize THREE.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a1a);
        scene.fog = new THREE.Fog(0x0a0a1a, 10, 100);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(15, 10, 20);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
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

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI / 2.2;

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
        let frameId;
        const animate = () => {
          frameId = requestAnimationFrame(animate);
          
          // Update physics
          world.step(1/60);
          
          // Update object positions from physics
          cubes.forEach(cube => {
            if (cube.userData.physicsBody) {
              cube.position.copy(cube.userData.physicsBody.position);
              cube.quaternion.copy(cube.userData.physicsBody.quaternion);
            }
          });
          
          // Update controls
          controls.update();
          
          // Render
          renderer.render(scene, camera);
        };

        // Start animation
        animate();
        
        // Handle resize
        const handleResize = () => {
          const { width, height } = container.getBoundingClientRect();
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          if (frameId) cancelAnimationFrame(frameId);
          renderer.dispose();
          
          // Dispose geometries and materials
          cubes.forEach(cube => {
            cube.geometry.dispose();
            cube.material.dispose();
          });
        };

      } catch (error) {
        console.error('Failed to initialize 3D world:', error);
        setError(error.message);
        addNotification(`3D World Error: ${error.message}`, 'error');
        throw error;
      }
    };

    init()
      .then(() => {
        setIsInitialized(true);
        addNotification(`${worldName} loaded successfully!`, 'success');
      })
      .catch(err => {
        console.error('Initialization failed:', err);
      });

  }, [addNotification, worldName]);

  // Force canvas to fill container
  useEffect(() => {
    if (containerRef.current && canvasRef.current) {
      const updateSize = () => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (container && canvas) {
          const { width, height } = container.getBoundingClientRect();
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
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
    <div className="world-container" ref={containerRef}>
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
