'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export default function ThreeWorld({ addNotification, worldName, onModDrop, isDraggingOverWorld }) {
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
  const objectsRef = useRef([]);
  const modObjectsRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const isMountedRef = useRef(true);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const isInitializingRef = useRef(false);
  const initAttemptRef = useRef(0);
  const loaderRef = useRef(null);

  // Initialize WebGL context with error handling
  const initializeWebGLContext = useCallback(() => {
    if (!canvasRef.current) return null;
    
    try {
      const canvas = canvasRef.current;
      
      // Get WebGL context with proper attributes
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
      
      if (!gl) {
        throw new Error('WebGL not supported');
      }
      
      // Add context loss handling
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
      
      return gl;
    } catch (err) {
      console.error('Failed to initialize WebGL context:', err);
      return null;
    }
  }, []);

  const handleContextLost = useCallback((event) => {
    console.log('WebGL context lost');
    event.preventDefault();
    
    // Cancel animation frame
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Set error state
    setError('WebGL context lost. Trying to restore...');
  }, []);

  const handleContextRestored = useCallback(() => {
    console.log('WebGL context restored');
    setError(null);
    
    // Re-initialize
    setTimeout(() => {
      if (isMountedRef.current) {
        initAttemptRef.current = 0;
        initialize3DWorld();
      }
    }, 1000);
  }, []);

  // Main initialization function
  const initialize3DWorld = useCallback(() => {
    if (!isMountedRef.current || isInitializingRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    if (!container || !canvas) {
      console.log('Waiting for refs...');
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
      console.log('Container has no dimensions, waiting...');
      setTimeout(() => {
        if (isMountedRef.current && initAttemptRef.current < 5) {
          initAttemptRef.current++;
          initialize3DWorld();
        }
      }, 500);
      return;
    }

    console.log(`Container dimensions: ${width}x${height}`);
    console.log('Starting 3D initialization...');
    
    isInitializingRef.current = true;
    
    try {
      // ========== CLEANUP ANY EXISTING INSTANCES ==========
      cleanup3DWorld();
      
      // Initialize WebGL context first
      const gl = initializeWebGLContext();
      if (!gl) {
        throw new Error('Failed to initialize WebGL context');
      }
      
      // Initialize loaders
      loaderRef.current = {
        gltf: new GLTFLoader(),
        texture: new THREE.TextureLoader(),
        draco: new DRACOLoader()
      };
      
      // Configure Draco loader
      loaderRef.current.draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
      loaderRef.current.gltf.setDRACOLoader(loaderRef.current.draco);
      
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
      
      // Renderer with proper configuration
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: gl,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false
      });
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
      renderer.autoClear = true;
      rendererRef.current = renderer;
      
      // Controls with null check
      if (renderer.domElement) {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI / 2.2;
        controls.autoRotate = false;
        controlsRef.current = controls;
      }
      
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
      
      // ========== DRAG & DROP HANDLERS ==========
      const handleCanvasDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('application/mod-data')) {
          container.style.borderColor = '#6c5ce7';
          container.style.boxShadow = '0 0 30px rgba(108, 92, 231, 0.5)';
        }
      };
      
      const handleCanvasDragLeave = (e) => {
        container.style.borderColor = 'transparent';
        container.style.boxShadow = 'none';
      };
      
      const handleCanvasDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        container.style.borderColor = 'transparent';
        container.style.boxShadow = 'none';
        
        try {
          // Get mod data from drag event
          const modData = e.dataTransfer.getData('application/mod-data');
          if (!modData) {
            // Try to read as file
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              await handleFileDrop(files[0]);
              return;
            }
            return;
          }
          
          const mod = JSON.parse(modData);
          
          // Calculate drop position in 3D space
          const rect = canvas.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          
          mouseRef.current.set(x, y);
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          
          // Calculate intersection with ground plane
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersectionPoint = new THREE.Vector3();
          raycasterRef.current.ray.intersectPlane(groundPlane, intersectionPoint);
          
          // Add mod to world at drop position
          await addModToWorld(mod, intersectionPoint);
          
        } catch (error) {
          console.error('Error processing drop:', error);
          addNotification && addNotification('Failed to add mod to world', 'error');
        }
      };
      
      canvas.addEventListener('dragover', handleCanvasDragOver);
      canvas.addEventListener('dragleave', handleCanvasDragLeave);
      canvas.addEventListener('drop', handleCanvasDrop);
      
      // ========== ANIMATION LOOP ==========
      const animate = () => {
        if (!isMountedRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
          return;
        }
        
        animationFrameIdRef.current = requestAnimationFrame(animate);
        
        try {
          // Update physics
          if (physicsWorldRef.current) {
            physicsWorldRef.current.step(1/60);
          }
          
          // Update objects from physics
          objectsRef.current.forEach(obj => {
            if (obj.userData?.physicsBody) {
              obj.position.copy(obj.userData.physicsBody.position);
              obj.quaternion.copy(obj.userData.physicsBody.quaternion);
            }
            
            // Apply mod-specific animations
            if (obj.userData?.modType === 'script') {
              updateScriptObject(obj);
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
        } catch (err) {
          console.error('Error in animation loop:', err);
          // Don't break the animation loop on error
        }
      };
      
      // Start animation
      animate();
      
      // Mark as initialized
      setIsInitialized(true);
      setError(null);
      isInitializingRef.current = false;
      
      if (addNotification) {
        addNotification(`${worldName || '3D World'} loaded!`, 'success');
      }
      
      console.log('3D World initialized successfully');
      
    } catch (err) {
      console.error('3D Initialization error:', err);
      setError(err.message);
      isInitializingRef.current = false;
      
      if (isMountedRef.current && addNotification) {
        addNotification(`3D Error: ${err.message}`, 'error');
      }
      
      // Retry initialization after delay
      setTimeout(() => {
        if (isMountedRef.current && initAttemptRef.current < 3) {
          initAttemptRef.current++;
          initialize3DWorld();
        }
      }, 2000);
    }
  }, [addNotification, worldName, initializeWebGLContext]);

  // Cleanup function
  const cleanup3DWorld = useCallback(() => {
    console.log('Cleaning up 3D world...');
    
    // Cancel animation frame
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Remove event listeners from canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.removeEventListener('dragover', () => {});
      canvas.removeEventListener('dragleave', () => {});
      canvas.removeEventListener('drop', () => {});
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    }
    
    // Remove window event listeners
    window.removeEventListener('add-mod-to-world', () => {});
    window.removeEventListener('execute-mod-script', () => {});
    window.removeEventListener('add-3d-model', () => {});
    window.removeEventListener('add-texture', () => {});
    window.removeEventListener('clear-world', () => {});
    
    // Dispose controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    
    // Dispose renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    
    // Clean up objects
    objectsRef.current.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj.userData?.texture) obj.userData.texture.dispose();
    });
    objectsRef.current = [];
    
    // Clean up mod objects
    modObjectsRef.current.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
            obj.material.dispose();
          }
        }
      });
      modObjectsRef.current = [];
      
      // Clear scene
      if (sceneRef.current) {
        sceneRef.current.clear();
        sceneRef.current = null;
      }
      
      cameraRef.current = null;
      physicsWorldRef.current = null;
    }, [handleContextLost, handleContextRestored]);
    
    // Initialize on mount
    useEffect(() => {
      isMountedRef.current = true;
      
      if (typeof window === 'undefined') return;
      
      const handleAddModToWorld = async (event) => {
        try {
          const { mod, position } = event.detail;
          await addModToWorld(mod, position || new THREE.Vector3(0, 5, 0));
        } catch (error) {
          console.error('Error adding mod:', error);
          addNotification && addNotification('Failed to add mod', 'error');
        }
      };
      
      const handleExecuteModScript = (event) => {
        try {
          const { mod, script, position } = event.detail;
          executeJavaScriptMod(mod, script, position);
        } catch (error) {
          console.error('Error executing script:', error);
          addNotification && addNotification('Failed to execute script', 'error');
        }
      };
      
      const handleAdd3DModel = async (event) => {
        try {
          const { mod, modelData, position } = event.detail;
          await load3DModel(mod, modelData, position);
        } catch (error) {
          console.error('Error loading 3D model:', error);
          addNotification && addNotification('Failed to load 3D model', 'error');
        }
      };
      
      const handleAddTexture = (event) => {
        try {
          const { mod, textureData, position } = event.detail;
          addTextureToWorld(mod, textureData, position);
        } catch (error) {
          console.error('Error adding texture:', error);
          addNotification && addNotification('Failed to add texture', 'error');
        }
      };
      
      const handleClearWorld = () => {
        clearWorld();
      };
      
      window.addEventListener('add-mod-to-world', handleAddModToWorld);
      window.addEventListener('execute-mod-script', handleExecuteModScript);
      window.addEventListener('add-3d-model', handleAdd3DModel);
      window.addEventListener('add-texture', handleAddTexture);
      window.addEventListener('clear-world', handleClearWorld);
      
      // Start initialization with a small delay to ensure DOM is ready
      const initTimer = setTimeout(() => {
        initialize3DWorld();
      }, 100);
      
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
        console.log('Component unmounting, cleaning up...');
        isMountedRef.current = false;
        isInitializingRef.current = false;
        
        clearTimeout(initTimer);
        
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
        window.removeEventListener('add-mod-to-world', handleAddModToWorld);
        window.removeEventListener('execute-mod-script', handleExecuteModScript);
        window.removeEventListener('add-3d-model', handleAdd3DModel);
        window.removeEventListener('add-texture', handleAddTexture);
        window.removeEventListener('clear-world', handleClearWorld);
        
        // Cleanup 3D world
        cleanup3DWorld();
      };
    }, [initialize3DWorld, cleanup3DWorld]);
    
    // Rest of your functions remain the same (addModToWorld, executeJavaScriptMod, load3DModel, etc.)
    // Add mod to world function
    const addModToWorld = async (mod, position) => {
      if (!sceneRef.current || !physicsWorldRef.current) return;
      
      try {
        addNotification && addNotification(`Adding ${mod.name} to world...`, 'info');
        
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
        
        addNotification && addNotification(`${mod.name} added to world!`, 'success');
        
      } catch (error) {
        console.error('Error adding mod to world:', error);
        addNotification && addNotification(`Failed to add ${mod.name}`, 'error');
      }
    };

    // Execute JavaScript mod
    const executeJavaScriptMod = (mod, script, position) => {
      try {
        // Create a visual representation for the script
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshStandardMaterial({
          color: mod.metadata?.color || 0x00ff00,
          emissive: mod.metadata?.color || 0x00ff00,
          emissiveIntensity: 0.3,
          metalness: 0.9,
          roughness: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add physics
        const shape = new CANNON.Sphere(1);
        const body = new CANNON.Body({ mass: 1 });
        body.addShape(shape);
        body.position.copy(position);
        physicsWorldRef.current.addBody(body);
        
        mesh.userData = {
          physicsBody: body,
          modType: 'script',
          modId: mod.id,
          modName: mod.name,
          script: script,
          updateFunction: null
        };
        
        // Try to extract and execute script behavior
        try {
          const scriptLines = script.split('\n');
          const behaviorScript = scriptLines.join('\n');
          
          // Create a function from the script
          const updateBehavior = new Function('object', 'time', `
            const mesh = object;
            const position = mesh.position;
            const rotation = mesh.rotation;
            ${behaviorScript}
          `);
          
          mesh.userData.updateFunction = updateBehavior;
        } catch (scriptError) {
          console.warn('Could not parse script behavior:', scriptError);
        }
        
        sceneRef.current.add(mesh);
        objectsRef.current.push(mesh);
        modObjectsRef.current.push(mesh);
        
        // Add particle effect
        createParticleEffect(position, mod.metadata?.color || 0x00ff00);
        
      } catch (error) {
        console.error('Error executing JavaScript mod:', error);
        throw error;
      }
    };

    // Load 3D model from mod
    const load3DModel = async (mod, modelData, position) => {
      return new Promise((resolve, reject) => {
        try {
          if (!loaderRef.current) {
            reject(new Error('Loader not initialized'));
            return;
          }
          
          if (mod.data.startsWith('data:')) {
            // Base64 encoded model
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
            // Direct GLTF/GLB data
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
      
      // Traverse and configure model
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Enhance material
          if (child.material) {
            child.material.emissive = new THREE.Color(mod.metadata?.color || 0x6c5ce7);
            child.material.emissiveIntensity = 0.1;
            child.material.metalness = 0.7;
            child.material.roughness = 0.3;
          }
        }
      });
      
      // Add physics
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
      const body = new CANNON.Body({ mass: 1 });
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

    // Add texture to world
    const addTextureToWorld = (mod, textureData, position) => {
      const texture = new THREE.Texture();
      const image = new Image();
      
      image.onload = () => {
        texture.image = image;
        texture.needsUpdate = true;
        
        // Create a plane with the texture
        const geometry = new THREE.PlaneGeometry(5, 5);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.position.copy(position);
        plane.rotation.x = -Math.PI / 2;
        
        plane.userData = {
          modType: 'texture',
          modId: mod.id,
          modName: mod.name,
          texture: texture
        };
        
        sceneRef.current.add(plane);
        objectsRef.current.push(plane);
        modObjectsRef.current.push(plane);
        
        // Add floating animation
        plane.userData.floatOffset = Math.random() * Math.PI * 2;
      };
      
      if (textureData.startsWith('data:')) {
        image.src = textureData;
      } else {
        image.src = `data:image/png;base64,${textureData}`;
      }
    };

    // Apply config mod
    const applyConfigMod = (mod, configData, position) => {
      try {
        const config = JSON.parse(configData);
        
        if (config.light) {
          // Add custom light
          const lightColor = new THREE.Color(config.light.color || 0xffffff);
          const light = new THREE.PointLight(lightColor, config.light.intensity || 1, 100);
          light.position.copy(position);
          sceneRef.current.add(light);
          
          light.userData = {
            modType: 'config',
            modId: mod.id,
            config: config
          };
          
          objectsRef.current.push(light);
          modObjectsRef.current.push(light);
        }
        
        if (config.fog) {
          // Update fog
          sceneRef.current.fog = new THREE.Fog(
            new THREE.Color(config.fog.color || 0x0a0a1a),
            config.fog.near || 10,
            config.fog.far || 100
          );
        }
        
      } catch (error) {
        console.error('Error applying config:', error);
      }
    };

    // Create basic object from mod
    const createBasicObjectFromMod = (mod, position) => {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({
        color: mod.metadata?.color || 0x6c5ce7,
        emissive: mod.metadata?.color || 0x6c5ce7,
        emissiveIntensity: 0.2,
        metalness: 0.8,
        roughness: 0.2
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Add physics
      const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
      const body = new CANNON.Body({ mass: 1 });
      body.addShape(shape);
      body.position.copy(position);
      physicsWorldRef.current.addBody(body);
      
      mesh.userData = {
        physicsBody: body,
        modType: 'basic',
        modId: mod.id,
        modName: mod.name
      };
      
      sceneRef.current.add(mesh);
      objectsRef.current.push(mesh);
      modObjectsRef.current.push(mesh);
    };

    // Update script objects in animation loop
    const updateScriptObject = (object) => {
      if (!object.userData.updateFunction) return;
      
      try {
        const time = Date.now() * 0.001;
        object.userData.updateFunction(object, time);
        
        // Update physics body position if object moved
        if (object.userData.physicsBody) {
          object.userData.physicsBody.position.copy(object.position);
          object.userData.physicsBody.quaternion.copy(object.quaternion);
        }
      } catch (error) {
        console.warn('Error updating script object:', error);
      }
    };

    // Helper functions
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
      if (!sceneRef.current) return;
      
      const particleCount = 50;
      const particles = new THREE.Group();
      
      for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.7
        });
        
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
      
      // Animate particles
      const animateParticles = () => {
        if (!sceneRef.current || !particles.parent) return;
        
        particles.children.forEach((particle, index) => {
          particle.userData.life -= 0.02;
          particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.1));
          particle.userData.velocity.y -= 0.01;
          particle.material.opacity = particle.userData.life;
          
          if (particle.userData.life <= 0) {
            particles.remove(particle);
          }
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
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(position);
      sceneRef.current.add(glowMesh);
      
      // Animate glow
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
      // Remove all mod objects
      modObjectsRef.current.forEach(obj => {
        if (obj.parent) {
          obj.parent.remove(obj);
        }
        
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      
      modObjectsRef.current = [];
      
      // Keep basic cubes but clear their mod data
      objectsRef.current.forEach(obj => {
        if (obj.userData?.modType) {
          if (obj.parent) {
            obj.parent.remove(obj);
          }
        }
      });
      
      objectsRef.current = objectsRef.current.filter(obj => !obj.userData?.modType);
      
      addNotification && addNotification('World cleared', 'success');
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
          metadata: {
            uploaded_by: 'user',
            version: '1.0.0',
            category: 'uploaded'
          }
        };
        
        await addModToWorld(mod, new THREE.Vector3(0, 5, 0));
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else if (file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsText(file, 'UTF-8');
      }
    };

    const getFileType = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) return 'javascript';
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
      if (['glb', 'gltf', 'fbx', 'obj'].includes(ext)) return '3d-model';
      if (['json', 'yml', 'yaml'].includes(ext)) return 'config';
      return 'basic';
    };

    // Debug: Log render state
    useEffect(() => {
      console.log('ThreeWorld render state:', {
        isInitialized,
        error,
        container: !!containerRef.current,
        canvas: !!canvasRef.current,
        scene: !!sceneRef.current,
        renderer: !!rendererRef.current,
        modObjects: modObjectsRef.current.length
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
            onClick={() => {
              setError(null);
              setIsInitialized(false);
              initAttemptRef.current = 0;
              initialize3DWorld();
            }}
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
          minHeight: '500px',
          border: isDraggingOverWorld ? '2px dashed #6c5ce7' : '2px solid transparent',
          transition: 'all 0.3s ease',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <canvas 
          ref={canvasRef} 
          className="three-canvas"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#0a0a1a',
            cursor: isDraggingOverWorld ? 'copy' : 'default'
          }}
        />
        
        {!isInitialized && !error && (
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
                  <span className="stat">Objects: {objectsRef.current.length}</span>
                  <span className="stat">Mods: {modObjectsRef.current.length}</span>
                  <span className="stat">Physics: Active</span>
                </div>
              </div>
              
              <div className="controls">
                <button className="btn btn-small" onClick={() => {
                  if (!sceneRef.current || !physicsWorldRef.current) return;
                  
                  const position = new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    10,
                    (Math.random() - 0.5) * 20
                  );
                  
                  const geometry = new THREE.BoxGeometry(2, 2, 2);
                  const material = new THREE.MeshStandardMaterial({
                    color: Math.random() * 0xffffff,
                    metalness: 0.9,
                    roughness: 0.1
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
                  physicsWorldRef.current.addBody(body);
                  
                  cube.userData.physicsBody = body;
                  sceneRef.current.add(cube);
                  objectsRef.current.push(cube);
                  
                  addNotification && addNotification('Added new object', 'success');
                }}>
                  <i className="fas fa-cube"></i> Add Object
                </button>
                
                <button className="btn btn-small" onClick={() => {
                  if (!sceneRef.current) return;
                  
                  objectsRef.current.forEach(obj => {
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
                  addNotification && addNotification('Physics impulse applied!', 'success');
                }}>
                  <i className="fas fa-bolt"></i> Apply Physics
                </button>
                
                <button className="btn btn-small" onClick={() => {
                  clearWorld();
                }}>
                  <i className="fas fa-trash"></i> Clear Mods
                </button>
              </div>
            </div>
            
            <div className="instructions">
              <p>
                <i className="fas fa-mouse-pointer"></i> Click and drag to orbit • 
                <i className="fas fa-mouse"></i> Scroll to zoom • 
                <i className="fas fa-arrows-alt"></i> Right-click to pan • 
                <i className="fas fa-cube"></i> Drag mods here!
              </p>
            </div>
            
            {isDraggingOverWorld && (
              <div className="drop-hint">
                <div className="drop-hint-content">
                  <i className="fas fa-cloud-upload-alt fa-2x"></i>
                  <p>Drop mod here to add to world</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
}
