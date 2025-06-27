import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCursorPosition } from '../hooks/useCursorPosition';
import { useResponsive3D } from '../hooks/useResponsive3D';

interface MaterialSettings {
  roughness: number;
  metalness: number;
  reflectivity: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  ior: number;
  color: string;
  toneMapped: boolean;
}

interface ChromeObjectProps {
  materialSettings?: MaterialSettings;
  onResponsiveChange?: (isTransitioning: boolean) => void;
  onModelLoaded?: (isLoaded: boolean) => void;
  onMaterialsReady?: () => void;
}

const ChromeObject: React.FC<ChromeObjectProps> = ({ 
  materialSettings, 
  onResponsiveChange,
  onModelLoaded,
  onMaterialsReady
}) => {
  // Alternative logging method that can't be stripped
  (window as any).saoDebug = (window as any).saoDebug || {};
  (window as any).saoDebug.chromeObjectMounted = true;
  (window as any).saoDebug.environment = process.env.NODE_ENV;
  (window as any).saoDebug.timestamp = new Date().toISOString();
  
  // Parent group for rotation (stays at origin)
  const parentGroupRef = useRef<THREE.Group>(null);
  // Child group for visual positioning
  const childGroupRef = useRef<THREE.Group>(null);
  
  // Get responsive configuration with loading callback
  const { scale, position: visualOffset } = useResponsive3D(
    undefined,
    true,
    onResponsiveChange
  );
  
  // Get cursor position
  const cursorPosition = useCursorPosition();
  
  // Animation state
  const lastCursorMoveRef = useRef(Date.now());
  const lastCursorPositionRef = useRef({ x: 0, y: 0 });
  
  // Load the logo model with aggressive preloading
  const gltf = useGLTF('/objects/sao-logo.glb');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isMaterialsReady, setIsMaterialsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // PERFORMANCE: Aggressive preloading for front-loaded performance
  useGLTF.preload('/objects/sao-logo.glb');
  
  // Clean error handling for GLTF loading
  useEffect(() => {
    // Basic error checking for production
    if (!gltf && !loadError) {
      // Test if the GLB file is accessible
      fetch('/objects/sao-logo.glb')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        })
        .catch(error => {
          setLoadError(`Asset loading failed: ${error.message}`);
        });
    }
    
    // Check for scene loading errors
    if (gltf && !gltf.scene) {
      setLoadError('3D model scene is missing');
    }
  }, [gltf, loadError]);
  
  // Default material settings - now modular
  const defaultMaterialSettings: MaterialSettings = {
    roughness: 0.01,
    metalness: 1.0,
    reflectivity: 1.0,
    envMapIntensity: 4.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    ior: 2.4,
    color: '#cccccc',
    toneMapped: true,
  };

  const activeMaterialSettings = materialSettings || defaultMaterialSettings;

  // Initialize cursor movement timer and component start time on first load
  useEffect(() => {
    if (lastCursorMoveRef.current === 0) {
      lastCursorMoveRef.current = Date.now();
    }
    
    // Initialize component start time for 1.5s delay
    if (componentStartTimeRef.current === 0) {
      componentStartTimeRef.current = performance.now() / 1000; // Convert to seconds
    }
    
    if (parentGroupRef.current) {
      parentGroupRef.current.rotation.set(0, 0, 0);
    }
  }, []);

  // Track cursor movement for reset logic
  useEffect(() => {
    const currentCursor = cursorPosition;
    const prevCursor = lastCursorPositionRef.current;
    
    const moveThreshold = 0.001;
    const hasMoved = Math.abs(currentCursor.normalizedX - prevCursor.x) > moveThreshold || 
                     Math.abs(currentCursor.normalizedY - prevCursor.y) > moveThreshold;
    
    if (hasMoved) {
      const now = Date.now();
      lastCursorMoveRef.current = now;
      lastCursorPositionRef.current = { x: currentCursor.normalizedX, y: currentCursor.normalizedY };
    }
  }, [cursorPosition.normalizedX, cursorPosition.normalizedY]);

  // Track when model is loaded - Clean version
  useEffect(() => {
    if (gltf.scene && !isModelLoaded) {
      setIsModelLoaded(true);
      
      // Set full opacity immediately in production
      if (process.env.NODE_ENV === 'production' && materialRef.current) {
        materialRef.current.opacity = 1.0;
        materialRef.current.roughness = activeMaterialSettings.roughness;
        materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
        materialRef.current.needsUpdate = true;
      }
      
      if (onModelLoaded) {
        onModelLoaded(true);
      }
    }
  }, [gltf.scene, isModelLoaded, onModelLoaded, activeMaterialSettings]);

  // Handle presentation start - Clean version without excessive logging
  useEffect(() => {
    // Ensure full opacity immediately when materials change
    if (materialRef.current) {
      materialRef.current.opacity = 1.0;
      materialRef.current.roughness = activeMaterialSettings.roughness;
      materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
      materialRef.current.needsUpdate = true;
    }
  }, [activeMaterialSettings]);

  // Set opacity when model loads
  useEffect(() => {
    if (isModelLoaded && materialRef.current) {
      materialRef.current.opacity = 1.0;
      materialRef.current.needsUpdate = true;
    }
  }, [isModelLoaded]);

  // Set opacity when materials are ready  
  useEffect(() => {
    if (isMaterialsReady && materialRef.current) {
      materialRef.current.opacity = 1.0;
      materialRef.current.needsUpdate = true;
    }
  }, [isMaterialsReady]);

  // UNIFIED VISIBILITY: Single source of truth - no competing states
  const shouldRender = isModelLoaded && !loadError; // Don't render if there's an error

  // Apply materials and handle responsive settings - modular material system with direct blur
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const materialsInitialized = useRef(false);
  
  useEffect(() => {
    if (gltf.scene && !materialsInitialized.current) {
      // Center the model at origin using scene position
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      
      // Apply the offset to center the model properly at origin
      gltf.scene.position.set(-center.x, -center.y, -center.z);
      
      // PERFORMANCE: Create optimized material for 60fps rendering with blur capability
      materialRef.current = new THREE.MeshPhysicalMaterial({
        color: activeMaterialSettings.color,
        metalness: activeMaterialSettings.metalness,
        roughness: activeMaterialSettings.roughness,
        clearcoat: activeMaterialSettings.clearcoat,
        clearcoatRoughness: activeMaterialSettings.clearcoatRoughness,
        ior: activeMaterialSettings.ior,
        reflectivity: activeMaterialSettings.reflectivity,
        envMapIntensity: activeMaterialSettings.envMapIntensity,
        toneMapped: activeMaterialSettings.toneMapped,
        transparent: true, // Enable for blur effect
        opacity: 1.0, // IMMEDIATE FIX: Start at full opacity
        // Performance optimizations for 60fps
        side: THREE.FrontSide,
        flatShading: false,
        vertexColors: false,
        fog: false,
      });
      
      // IMMEDIATE PRODUCTION FIX: Set full opacity and final properties immediately
      materialRef.current.opacity = 1.0;
      materialRef.current.roughness = activeMaterialSettings.roughness;
      materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
      
      // PERFORMANCE: Warm up GPU for the material
      materialRef.current.needsUpdate = true;
      
      // PERFORMANCE: Apply materials and optimize geometry for 60fps
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.material = materialRef.current;
          
          // Front-load geometry optimization for 60fps performance
          if (child.geometry) {
            child.geometry.computeVertexNormals(); // Smooth normals
            child.geometry.normalizeNormals(); // Consistent lighting
            
            // PERFORMANCE: Pre-compute expensive operations
            if (child.geometry.attributes.position) {
              child.geometry.computeBoundingBox();
              child.geometry.computeBoundingSphere();
            }
            
            // Shadow optimization
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Animation performance optimization
            child.frustumCulled = true;
            child.matrixAutoUpdate = true;
            
            // PERFORMANCE: Mark geometry as static for GPU optimization
            (child.geometry as any).dynamic = false;
          }
        }
      });
      
      materialsInitialized.current = true;
      setIsMaterialsReady(true); // Notify that materials are ready
      
      // Notify parent component
      if (onMaterialsReady) {
        onMaterialsReady();
      }
    }
  }, [gltf.scene, activeMaterialSettings, onMaterialsReady]);

  // Animation activation state
  const animationActivationRef = useRef<number>(0);
  const cursorActivationDelayRef = useRef<number>(0);
  const componentStartTimeRef = useRef<number>(0);

  // Constants for cursor following with 1.5s initial delay
  const CURSOR_FOLLOW = {
    INITIAL_DELAY: 1.5,        // 1.5 second delay before cursor following begins
    ACTIVATION_DELAY: 0.2,     // Much faster activation after initial delay
    RAMP_DURATION: 1.0,        // Reduced for faster ramp up
    ROTATION_SCALE: 0.1,
    MIN_MOVEMENT: 0.001,       // Slightly increased threshold
    SMOOTHING: 0.045,
    RESET_DURATION: 2.0,
    IDLE_TIMEOUT: 1.5,         // 1.5 second timeout for cursor following
    SPRING: {
      STRENGTH: 2.5,
      DAMPENING: 0.92,
      MIN_VELOCITY: 0.001
    },
    ORBIT: {
      RADIUS: {
        X: 0.4,                // Increased for more noticeable movement
        Y: 0.35               // Increased for more noticeable movement  
      }
    }
  };

  interface RotationState {
    x: number;
    y: number;
    z: number;
  }

  const currentVelocityRef = useRef<RotationState>({ x: 0, y: 0, z: 0 });
  const activationLoggedRef = useRef<boolean>(false);
  const resetStartTimeRef = useRef<number>(0);

  // PERFORMANCE: Frame rate monitoring and optimization
  const debugLogRef = useRef<number>(0);
  const idleDetectionRef = useRef<number>(0);
  
  // Clean useFrame - Essential functionality only
  useFrame((state) => {
    if (!parentGroupRef.current || !childGroupRef.current || !isModelLoaded) return;

    // Ensure full opacity on every frame (silent)
    if (materialRef.current && materialRef.current.opacity !== 1.0) {
      materialRef.current.opacity = 1.0;
      materialRef.current.roughness = activeMaterialSettings.roughness;
      materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
      materialRef.current.needsUpdate = true;
    }

    const time = state.clock.getElapsedTime();
    
    // Basic cursor movement tracking (no debugging)
    const cursorMoved = 
      Math.abs(cursorPosition.normalizedX - lastCursorPositionRef.current.x) > CURSOR_FOLLOW.MIN_MOVEMENT ||
      Math.abs(cursorPosition.normalizedY - lastCursorPositionRef.current.y) > CURSOR_FOLLOW.MIN_MOVEMENT;

    if (cursorMoved) {
      lastCursorMoveRef.current = time;
      lastCursorPositionRef.current = {
        x: cursorPosition.normalizedX,
        y: cursorPosition.normalizedY
      };
    }
  });

  // ENHANCED CLEANUP FUNCTION - MEMORY LEAK PREVENTION
  useEffect(() => {
    return () => {
      console.log('🧹 ChromeObject cleanup: Starting comprehensive cleanup');
      
      // Reset all refs to prevent memory leaks
      lastCursorMoveRef.current = 0;
      resetStartTimeRef.current = 0;
      cursorActivationDelayRef.current = 0;
      animationActivationRef.current = 0;
      componentStartTimeRef.current = 0;
      debugLogRef.current = 0;
      idleDetectionRef.current = 0;
      activationLoggedRef.current = false;
      
      // Clean up group references
      if (parentGroupRef.current) {
        parentGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        parentGroupRef.current = null;
      }
      
      if (childGroupRef.current) {
        childGroupRef.current = null;
      }
      
      // Reset state objects
      currentVelocityRef.current = { x: 0, y: 0, z: 0 };
      lastCursorPositionRef.current = { x: 0, y: 0 };
      
      // Clean up GLTF resources
      if (gltf) {
        gltf.scenes.forEach(scene => {
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) {
                child.geometry.dispose();
              }
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(material => material.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        });
      }
      
      // Dispose of material reference
      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }
      
      console.log('✅ ChromeObject cleanup: Complete');
    };
  }, [gltf]); // Keep gltf dependency for proper cleanup

  // Fallback error component
  if (loadError) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 1, 0.1]} />
        <meshStandardMaterial 
          color="#ff4444" 
          transparent 
          opacity={0.8}
        />
        {/* Add text if possible, or just a simple geometric fallback */}
      </mesh>
    );
  }

  // Don't render anything if model isn't loaded yet
  if (!shouldRender) {
    return null;
  }

  // TEMP: Rendering log disabled to reduce console noise
  // console.log('🎯 ChromeObject rendering:', { 
  //   shouldRender, 
  //   hasScene: !!gltf.scene, 
  //   scale, 
  //   visualOffset,
  //   isModelLoaded,
  //   isMaterialsReady,
  //   parentGroupPosition: parentGroupRef.current?.position,
  //   childGroupPosition: childGroupRef.current?.position,
  //   childGroupScale: childGroupRef.current?.scale,
  //   gltfScenePosition: gltf.scene?.position
  // });

  return (
    <group ref={parentGroupRef} position={[0, 0, 0]}>
      <group ref={childGroupRef} scale={scale} position={visualOffset}>
        {gltf.scene && <primitive object={gltf.scene} />}

      </group>
    </group>
  );
};

export default ChromeObject; 