import React, { useRef, useEffect, useState, useMemo } from 'react';
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
    false, // IMPROVED: Disable mobile reload for production stability
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
  const [loadError, setLoadError] = useState<string | null>(null);
  // Removed isMaterialsReady state to prevent unnecessary re-renders
  
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
  
  // MEMOIZED: Default material settings to prevent object recreation
  const defaultMaterialSettings = useMemo<MaterialSettings>(() => ({
    roughness: 0.01,
    metalness: 1.0,
    reflectivity: 1.0,
    envMapIntensity: 4.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    ior: 2.4,
    color: '#cccccc',
    toneMapped: true,
  }), []); // Empty deps - this object never changes

  // MEMOIZED: Prevent re-renders when parent passes same material settings
  const activeMaterialSettings = useMemo(() => 
    materialSettings || defaultMaterialSettings, 
    [materialSettings]
  );

  // Initialize cursor movement timer and component start time on first load
  useEffect(() => {
    if (lastCursorMoveRef.current === 0) {
      lastCursorMoveRef.current = 0; // Use elapsed time instead of Date.now()
      // Initialize cursor position on first load
      lastCursorPositionRef.current = { x: 0, y: 0 };
    }
    
    if (parentGroupRef.current) {
      parentGroupRef.current.rotation.set(0, 0, 0);
    }
  }, []);

  // Remove cursor tracking useEffect - this was causing re-renders on every cursor move!
  // Cursor tracking is now handled directly in useFrame for better performance

  // Track when model is loaded - Clean version with minimal re-renders
  useEffect(() => {
    if (gltf.scene && !isModelLoaded) {
      setIsModelLoaded(true);
      
      // Notify parent component once
      if (onModelLoaded) {
        onModelLoaded(true);
      }
    }
  }, [gltf.scene, isModelLoaded, onModelLoaded]); // Removed activeMaterialSettings dependency

  // Material updates handled in useFrame - no effect needed to prevent re-renders

  // UNIFIED VISIBILITY: Single source of truth - no competing states
  const shouldRender = isModelLoaded && !loadError; // Don't render if there's an error

  // Apply materials and handle responsive settings - modular material system with direct blur
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const materialsInitialized = useRef(false);
  
  // STABLE: Materials initialization - runs once only
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
      // Use ref instead of state to prevent re-renders
      
      // Notify parent component directly - no state update needed
      if (onMaterialsReady) {
        onMaterialsReady();
      }
    }
  }, [gltf.scene, onMaterialsReady]); // Removed activeMaterialSettings to prevent re-runs

  // Animation activation state (for future use)
  // const animationActivationRef = useRef<number>(0);
  // const cursorActivationDelayRef = useRef<number>(0);
  const componentStartTimeRef = useRef<number>(0);
  
  // Initialize component start time in useFrame for consistency
  // This will be set on first useFrame call

  // Constants for cursor following with noticeable and responsive movement
  const CURSOR_FOLLOW = {
    INITIAL_DELAY: 1.2,        // Reduced delay for faster mobile loading
    ACTIVATION_DELAY: 0.2,     // Much faster activation after initial delay
    RAMP_DURATION: 1.0,        // Reduced for faster ramp up
    ROTATION_SCALE: 0.1,
    MIN_MOVEMENT: 0.002,       // Reduced threshold for easier reactivation
    SMOOTHING: 0.02,           // Enhanced smoothing for ultra-fluid motion
    RESET_DURATION: 1.2,       // Slightly faster return to center
    IDLE_TIMEOUT: 1.5,         // 1.5 second timeout for cursor following (smoother transitions)
    AUTO_RESET: 3.0,           // Automatic reset after 3 seconds regardless of movement
    SPRING: {
      STRENGTH: 0.25,          // More responsive spring for noticeable movement
      DAMPENING: 0.96,         // High damping but more responsive
      MIN_VELOCITY: 0.0001,    // Low threshold for smooth stops
      LERP_FACTOR: 0.15        // Higher linear interpolation for smoothing
    },
    ORBIT: {
      RADIUS: {
        X: 0.35,               // Optimal for smooth cursor following
        Y: 0.28                // Optimal for smooth cursor following  
      }
    }
  };

  interface RotationState {
    x: number;
    y: number;
    z: number;
  }

  // SIMPLIFIED STATE - Only essential refs to prevent breakage
  const currentVelocityRef = useRef<RotationState>({ x: 0, y: 0, z: 0 });
  const lastActiveTimeRef = useRef<number>(0); // When cursor was last active
  const animationModeRef = useRef<'floating' | 'cursor' | 'returning'>('floating');
  
  // Simplified manual reset for testing
  useEffect(() => {
    (window as any).forceReset = () => {
      animationModeRef.current = 'floating';
      lastActiveTimeRef.current = 0;
      currentVelocityRef.current = { x: 0, y: 0, z: 0 };
    };
    return () => {
      delete (window as any).forceReset;
    };
  }, []);
  
  // Motion smoothing buffer for responsive smooth animation
  const rotationHistoryRef = useRef<RotationState[]>([]);
  // const SMOOTHING_BUFFER_SIZE = 2; // Reduced for more responsive feel
  
  // Smoothing helper function for ultra-smooth easing (for future use)
  // const smoothEase = (t: number): number => {
  //   // Smooth step function for buttery interpolation
  //   return t * t * (3.0 - 2.0 * t);
  // };
  
  // Motion smoothing function for glass-like smoothness (for future use)
  // const smoothRotation = (newRotation: RotationState): RotationState => {
  //   // Add new rotation to history
  //   rotationHistoryRef.current.push(newRotation);
  //   
  //   // Keep only recent frames
  //   if (rotationHistoryRef.current.length > SMOOTHING_BUFFER_SIZE) {
  //     rotationHistoryRef.current.shift();
  //   }
  //   
  //   // Average the rotations for ultra-smooth motion
  //   const avgRotation = rotationHistoryRef.current.reduce(
  //     (acc, rot) => ({
  //       x: acc.x + rot.x,
  //       y: acc.y + rot.y,
  //       z: acc.z + rot.z
  //     }),
  //     { x: 0, y: 0, z: 0 }
  //   );
  //   
  //   const count = rotationHistoryRef.current.length;
  //   return {
  //     x: avgRotation.x / count,
  //     y: avgRotation.y / count,
  //     z: avgRotation.z / count
  //   };
  // };

  // PERFORMANCE: Frame rate monitoring and optimization (for future use)
  // const debugLogRef = useRef<number>(0);
  // const idleDetectionRef = useRef<number>(0);
  
  // SIMPLIFIED, STABLE ANIMATION SYSTEM
  useFrame((state) => {
    if (!parentGroupRef.current || !childGroupRef.current || !isModelLoaded) return;

    const time = state.clock.getElapsedTime();
    
    // Initialize component start time
    if (componentStartTimeRef.current === 0) {
      componentStartTimeRef.current = time;
    }
    
    // Check if initial delay has passed - Reduced delay for mobile optimization
    const hasInitialDelayPassed = time >= CURSOR_FOLLOW.INITIAL_DELAY + 0.2; // Faster initialization for mobile
    
    // Calculate smooth transition factor to prevent jump when floating starts
    const timeSinceDelayPassed = Math.max(0, time - (CURSOR_FOLLOW.INITIAL_DELAY + 0.2));
    const floatingTransitionFactor = Math.min(1, timeSinceDelayPassed / 0.5); // 0.5s smooth transition
    
    // PREVENT JUMPING: Keep responsive positioning during loading, but prevent interactive animation
    if (!hasInitialDelayPassed) {
      // Apply responsive positioning immediately but prevent rotation during loading
      parentGroupRef.current.rotation.set(0, 0, 0);
      // Ensure parentGroup stays at origin during loading - let childGroup handle positioning
      parentGroupRef.current.position.set(0, 0, 0);
      // Continue execution to allow other position updates (don't return early)
    }
    
    // Track meaningful cursor movement
    const cursorMoved = hasInitialDelayPassed && (
      Math.abs(cursorPosition.normalizedX - lastCursorPositionRef.current.x) > CURSOR_FOLLOW.MIN_MOVEMENT ||
      Math.abs(cursorPosition.normalizedY - lastCursorPositionRef.current.y) > CURSOR_FOLLOW.MIN_MOVEMENT
    );
    
    // Simple state management
    if (cursorMoved) {
      lastActiveTimeRef.current = time;
      lastCursorPositionRef.current = {
        x: cursorPosition.normalizedX,
        y: cursorPosition.normalizedY
      };
      animationModeRef.current = 'cursor';
    }
    
    // Determine current mode based on time since last activity
    const timeSinceActive = time - lastActiveTimeRef.current;
    if (timeSinceActive > CURSOR_FOLLOW.IDLE_TIMEOUT && animationModeRef.current === 'cursor') {
      animationModeRef.current = 'returning';
    }
    
    // Apply animations based on current mode - only after initial delay
    if (animationModeRef.current === 'cursor' && hasInitialDelayPassed) {
      // CURSOR FOLLOWING - Simple and stable
      const targetRotationY = cursorPosition.normalizedX * CURSOR_FOLLOW.ORBIT.RADIUS.X;
      const targetRotationX = -cursorPosition.normalizedY * CURSOR_FOLLOW.ORBIT.RADIUS.Y;
      
      const currentRotation = parentGroupRef.current.rotation;
      
      // Simple lerp - 35% slower for more elegant movement
      const lerpFactor = 0.0325;
      parentGroupRef.current.rotation.x += (targetRotationX - currentRotation.x) * lerpFactor;
      parentGroupRef.current.rotation.y += (targetRotationY - currentRotation.y) * lerpFactor;
      
      // Ensure position is at 0 for cursor control
      if (Math.abs(parentGroupRef.current.position.y) > 0.001) {
        parentGroupRef.current.position.y *= 0.9;
      } else {
        parentGroupRef.current.position.y = 0;
      }
    }

    else if (animationModeRef.current === 'returning' && hasInitialDelayPassed) {
      // RETURN TO CENTER - Simple and stable
      const currentRotation = parentGroupRef.current.rotation;
      
      // Simple lerp back to center
      const returnSpeed = 0.02;
      parentGroupRef.current.rotation.x *= (1 - returnSpeed);
      parentGroupRef.current.rotation.y *= (1 - returnSpeed);
      
      // Switch to floating when close to center
      if (Math.abs(currentRotation.x) < 0.01 && Math.abs(currentRotation.y) < 0.01) {
        animationModeRef.current = 'floating';
        // Snap to exact center
        parentGroupRef.current.rotation.x = 0;
        parentGroupRef.current.rotation.y = 0;
      }
    } else if (hasInitialDelayPassed) {
      // FLOATING ANIMATION - Smooth transition to prevent jump
      const floatOffset = Math.sin(time * 0.3) * 0.06 * floatingTransitionFactor; // Smooth easing in
      parentGroupRef.current.position.y = floatOffset;
      
      // Gentle rotation dampening when floating
      const dampingFactor = 0.985;
      parentGroupRef.current.rotation.x *= dampingFactor;
      parentGroupRef.current.rotation.y *= dampingFactor;
      parentGroupRef.current.rotation.z *= dampingFactor;
    }

  });

  // ENHANCED CLEANUP FUNCTION - MEMORY LEAK PREVENTION
  useEffect(() => {
    return () => {
      // Silent cleanup for optimal performance
      
      // Reset simplified refs to prevent memory leaks
      lastCursorMoveRef.current = 0;
      lastActiveTimeRef.current = 0;
      animationModeRef.current = 'floating';
      
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
      
      // Clear rotation history for clean cleanup
      rotationHistoryRef.current = [];
      
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
      
      // Cleanup complete - silent operation for performance
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