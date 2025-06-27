import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCursorPosition } from '../hooks/useCursorPosition';
import { useResponsive3D } from '../hooks/useResponsive3D';
import { useBlurInAnimation } from '../hooks/useBlurInAnimation';

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
  followCursor?: boolean;
  onResponsiveChange?: (isTransitioning: boolean) => void;
  onBlurInUpdate?: (blurAmount: number, isAnimating: boolean) => void;
  onModelLoaded?: (isLoaded: boolean) => void;
  onMaterialsReady?: () => void;
  enableCursorFollowing?: boolean;
  startPresentation?: boolean;
}

const ChromeObject: React.FC<ChromeObjectProps> = ({ 
  materialSettings, 
  followCursor = true,
  onResponsiveChange,
  onBlurInUpdate,
  onModelLoaded,
  onMaterialsReady,
  enableCursorFollowing = true,
  startPresentation = false
}) => {
  // BASIC PRODUCTION DEBUG: This should ALWAYS show up
  console.log('🔴 ChromeObject component mounting!', {
    NODE_ENV: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    location: window.location.href,
    userAgent: navigator.userAgent,
    startPresentation
  });
  
  // Alternative logging method that can't be stripped
  (window as any).saoDebug = (window as any).saoDebug || {};
  (window as any).saoDebug.chromeObjectMounted = true;
  (window as any).saoDebug.environment = process.env.NODE_ENV;
  (window as any).saoDebug.timestamp = new Date().toISOString();
  
  // AGGRESSIVE DEBUG: Force visible feedback
  React.useEffect(() => {
    console.error('🚨 FORCE VISIBLE LOG - ChromeObject useEffect running!');
    console.warn('⚠️ Environment check:', process.env.NODE_ENV);
    console.info('ℹ️ StartPresentation:', startPresentation);
    
    // This should show in Network tab if nothing else works
    fetch('data:text/plain,ChromeObject-Mounted-' + Date.now()).catch(() => {});
  }, [startPresentation]);
  
  // Parent group for rotation (stays at origin)
  const parentGroupRef = useRef<THREE.Group>(null);
  // Child group for visual positioning
  const childGroupRef = useRef<THREE.Group>(null);
  
  // Modular blur-in animation - no hardcoded duration!
  const blurAnimation = useBlurInAnimation(); // Use default from hook
  
  // Get responsive configuration with loading callback
  const { scale, position: visualOffset } = useResponsive3D(
    undefined,
    true,
    onResponsiveChange
  );
  
  // Get cursor position
  const cursorPosition = useCursorPosition();
  
  // Debug cursor position changes
  useEffect(() => {
    console.log('🖱️ Cursor position updated:', {
      x: cursorPosition.normalizedX.toFixed(3),
      y: cursorPosition.normalizedY.toFixed(3)
    });
  }, [cursorPosition.normalizedX, cursorPosition.normalizedY]);
  
  // Animation state
  const lastCursorMoveRef = useRef(Date.now());
  const isResettingRef = useRef(false);
  const resetCompleteTimeRef = useRef(0);
  const targetRotationRef = useRef({ x: 0, y: 0, z: 0 });
  const previousCursorRef = useRef({ x: 0, y: 0 });
  
  // Enhanced easing function
  const easeInOutQuint = (t: number): number => {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  };

  // Load the logo model with aggressive preloading
  const gltf = useGLTF('/objects/sao-logo.glb');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isMaterialsReady, setIsMaterialsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // PERFORMANCE: Aggressive preloading for front-loaded performance
  useGLTF.preload('/objects/sao-logo.glb');
  
  // Enhanced error handling for GLTF loading with production debugging
  useEffect(() => {
    console.log('🔍 GLTF Loading Status:', {
      hasGltf: !!gltf,
      hasScene: !!gltf?.scene,
      sceneChildren: gltf?.scene?.children?.length || 0,
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Additional error checking for production
    if (!gltf && !loadError) {
      console.warn('⚠️ GLTF object is undefined - checking network...');
      
      // Test if the GLB file is accessible
      fetch('/objects/sao-logo.glb')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          console.log('✅ GLB file is accessible via fetch');
          return response.blob();
        })
        .then(blob => {
          console.log('📦 GLB file blob:', {
            size: blob.size,
            type: blob.type
          });
        })
        .catch(error => {
          console.error('❌ GLB file fetch failed:', error);
          setLoadError(`Asset loading failed: ${error.message}`);
        });
    }
    
    // Check for scene loading errors
    if (gltf && !gltf.scene) {
      console.error('❌ GLTF loaded but scene is missing');
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

  // Track cursor movement for reset logic - modular cooldown
  const COOLDOWN_DURATION = 300; // Keep as reasonable default
  
  useEffect(() => {
    const currentCursor = cursorPosition;
    const prevCursor = previousCursorRef.current;
    
    const moveThreshold = 0.001;
    const hasMoved = Math.abs(currentCursor.normalizedX - prevCursor.x) > moveThreshold || 
                     Math.abs(currentCursor.normalizedY - prevCursor.y) > moveThreshold;
    
    if (hasMoved) {
      const now = Date.now();
      
      const isInResetCooldown = isResettingRef.current || (resetCompleteTimeRef.current > 0 && now - resetCompleteTimeRef.current < COOLDOWN_DURATION);
      
      if (!isInResetCooldown) {
        lastCursorMoveRef.current = now;
        isResettingRef.current = false;
        previousCursorRef.current = { x: currentCursor.normalizedX, y: currentCursor.normalizedY };
      }
    }
  }, [cursorPosition.normalizedX, cursorPosition.normalizedY]);

  // Track when model is loaded - notify parent immediately
  useEffect(() => {
    if (gltf.scene && !isModelLoaded) {
      console.log('✅ 3D Model loaded successfully!');
      setIsModelLoaded(true);
      
      // PRODUCTION IMMEDIATE FIX: Set full opacity immediately in production
      if (process.env.NODE_ENV === 'production' && materialRef.current) {
        console.log('🚀 Production mode - setting immediate full opacity');
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

  // Handle presentation start - simplified, no competing states
  useEffect(() => {
    if (startPresentation && isModelLoaded && isMaterialsReady) {
      console.log('🎭 Starting presentation - all systems ready');
      
      // Start blur-in immediately when everything is ready
      requestAnimationFrame(() => {
        blurAnimation.start();
      });
    }
  }, [startPresentation, isModelLoaded, isMaterialsReady, blurAnimation]);

  // Set final material properties after animations are done
  useEffect(() => {
    if (!blurAnimation.isAnimating && materialRef.current) {
      materialRef.current.opacity = 1.0;
      materialRef.current.roughness = activeMaterialSettings.roughness;
      materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
      materialRef.current.needsUpdate = true;
    }
  }, [blurAnimation.isAnimating, activeMaterialSettings]);

  // PRODUCTION FAILSAFE: Ensure full opacity after materials are ready
  useEffect(() => {
    if (isMaterialsReady && materialRef.current && process.env.NODE_ENV === 'production') {
      console.log('🎯 Production failsafe - ensuring full opacity after materials ready');
      setTimeout(() => {
        if (materialRef.current) {
          materialRef.current.opacity = 1.0;
          materialRef.current.roughness = activeMaterialSettings.roughness;
          materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
          materialRef.current.needsUpdate = true;
          console.log('🎯 Production opacity set to:', materialRef.current.opacity);
        }
      }, 100); // Small delay to ensure everything is ready
    }
  }, [isMaterialsReady, activeMaterialSettings]);

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
        opacity: 1.0, // Start fully visible - animation will control this
        // Performance optimizations for 60fps
        side: THREE.FrontSide,
        flatShading: false,
        vertexColors: false,
        fog: false,
      });
      
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

  const ANIMATION = {
    ACTIVATION_SPEED: 0.8,
    DEACTIVATION_SPEED: 1.2,
    FLOAT_SPEED: 0.2,
    FLOAT_AMPLITUDE: 0.06
  };

  interface RotationState {
    x: number;
    y: number;
    z: number;
  }

  const currentVelocityRef = useRef<RotationState>({ x: 0, y: 0, z: 0 });
  const activationLoggedRef = useRef<boolean>(false);
  const resetStartTimeRef = useRef<number>(0);
  const lastCursorPositionRef = useRef({ x: 0, y: 0 });
  const lastCursorMoveTimeRef = useRef(0);

  // PERFORMANCE: Frame rate monitoring and optimization
  const debugLogRef = useRef<number>(0);
  const idleDetectionRef = useRef<number>(0);
  const frameTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<number>(0);
  
  // Single unified useFrame optimized for 60fps
  useFrame((state, delta) => {
    if (!parentGroupRef.current || !childGroupRef.current || !isModelLoaded) return;

    // PERFORMANCE: Monitor frame time for 60fps optimization
    frameTimeRef.current += delta;
    fpsCounterRef.current++;
    
    const time = state.clock.getElapsedTime();
    
    // Track cursor movement
    const cursorMoved = 
      Math.abs(cursorPosition.normalizedX - lastCursorPositionRef.current.x) > CURSOR_FOLLOW.MIN_MOVEMENT ||
      Math.abs(cursorPosition.normalizedY - lastCursorPositionRef.current.y) > CURSOR_FOLLOW.MIN_MOVEMENT;

    if (cursorMoved) {
      lastCursorMoveTimeRef.current = time;
      lastCursorPositionRef.current = {
        x: cursorPosition.normalizedX,
        y: cursorPosition.normalizedY
      };
    }
    
    // Update material-based blur-in animation
    const animationState = blurAnimation.updateAnimation(time);
    
    // PRODUCTION DEBUGGING: Log animation state every 2 seconds
    if (Math.floor(time) % 2 === 0 && Math.floor(time) !== debugLogRef.current) {
      debugLogRef.current = Math.floor(time);
      console.log('🎬 Animation State:', {
        isAnimating: animationState.isAnimating,
        progress: animationState.progress.toFixed(3),
        blurAmount: animationState.blurAmount.toFixed(3),
        startPresentation,
        time: time.toFixed(1),
        materialOpacity: materialRef.current?.opacity?.toFixed(3),
        environment: process.env.NODE_ENV
      });
    }
    
    // PRODUCTION FAILSAFE: Force opacity to 1.0 after reasonable time
    const ANIMATION_TIMEOUT = 5.0; // 5 seconds max for animation
    if (time > ANIMATION_TIMEOUT && materialRef.current && materialRef.current.opacity < 1.0) {
      console.warn('⚠️ Animation timeout - forcing full opacity');
      materialRef.current.opacity = 1.0;
      materialRef.current.roughness = activeMaterialSettings.roughness;
      materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
      materialRef.current.needsUpdate = true;
      // Force animation to stop
      blurAnimation.reset();
      return;
    }
    
    // Material-based animation for smooth appearance
    if (materialRef.current && animationState.isAnimating && startPresentation) {
      // Calculate blur progress (0 = fully blurred, 1 = clear)
      const blurProgress = 1 - (animationState.blurAmount / 2.5);
      const smoothProgress = Math.pow(blurProgress, 2); // Quadratic easing for smooth appearance
      
      // Animate opacity from 0.3 to 1.0 for smooth material appearance
      const targetOpacity = 0.3 + (0.7 * smoothProgress);
      materialRef.current.opacity = targetOpacity;
      
      // Animate roughness for "focus" effect (higher roughness = more blurred appearance)
      const baseRoughness = activeMaterialSettings.roughness;
      const blurRoughness = Math.min(1.0, baseRoughness + (0.8 * (1 - smoothProgress)));
      materialRef.current.roughness = blurRoughness;
      
      // Animate clearcoat for crystal-clear final appearance
      const baseClearcoat = activeMaterialSettings.clearcoat;
      materialRef.current.clearcoat = baseClearcoat * smoothProgress;
      
      // PERFORMANCE: Only update material when properties actually change
      materialRef.current.needsUpdate = true;
      
      // PRODUCTION DEBUG: Log when animation should be near completion
      if (smoothProgress > 0.95) {
        console.log('🎯 Animation near completion:', {
          smoothProgress: smoothProgress.toFixed(3),
          targetOpacity: targetOpacity.toFixed(3),
          isAnimating: animationState.isAnimating
        });
      }
    } else if (materialRef.current && (!animationState.isAnimating || !startPresentation)) {
      // PERFORMANCE: Animation complete or not started - ensure full opacity
      const needsUpdate = materialRef.current.opacity !== 1.0 ||
          materialRef.current.roughness !== activeMaterialSettings.roughness ||
          materialRef.current.clearcoat !== activeMaterialSettings.clearcoat;
          
      if (needsUpdate) {
        console.log('🎯 Setting final material properties:', {
          oldOpacity: materialRef.current.opacity.toFixed(3),
          newOpacity: 1.0,
          startPresentation,
          isAnimating: animationState.isAnimating
        });
        
        materialRef.current.opacity = 1.0;
        materialRef.current.roughness = activeMaterialSettings.roughness;
        materialRef.current.clearcoat = activeMaterialSettings.clearcoat;
        materialRef.current.needsUpdate = true;
      }
    }
    
    // PERFORMANCE: Reduced frame skipping for smoother experience 
    if (delta > 0.05 && !animationState.isAnimating) {
      return; // Only skip frames when completely idle (increased threshold)
    }
    
    // Notify parent of blur state (for any UI coordination)
    if (onBlurInUpdate) {
      onBlurInUpdate(animationState.blurAmount, animationState.isAnimating);
    }

    // Handle animation activation - FIXED: Ensure floating animation works even during blur-in
    const currentAnimationMultiplier = animationState.isAnimating
      ? Math.max(animationActivationRef.current - delta * ANIMATION.DEACTIVATION_SPEED, 0.2) // Keep minimum 0.2 for floating
      : Math.min(animationActivationRef.current + delta * ANIMATION.ACTIVATION_SPEED, 1.0);
    
    animationActivationRef.current = currentAnimationMultiplier;
    
    // Always increment cursor activation delay - don't reset during blur animation
    cursorActivationDelayRef.current += delta;

    // Calculate base floating animation - perfectly straight with no rotation
    const baseRotationX = 0; // No X rotation for straight appearance
    const baseRotationY = 0; // No Y rotation for straight appearance
    const baseRotationZ = 0; // No Z rotation for straight appearance

    // Calculate time since component start for initial delay
    const timeSinceStart = time - componentStartTimeRef.current;
    const hasPassedInitialDelay = timeSinceStart >= CURSOR_FOLLOW.INITIAL_DELAY;
    
    // Simplified cursor following activation with initial delay
    const timeSinceLastMove = time - lastCursorMoveTimeRef.current;
    const isCursorIdle = timeSinceLastMove > CURSOR_FOLLOW.IDLE_TIMEOUT;
    
    // Allow cursor following only after initial delay and when not manually interacting
    const canFollowCursor = followCursor && enableCursorFollowing && hasPassedInitialDelay && !isCursorIdle;
    
    // Calculate smooth transition multiplier for cursor following activation
    const transitionProgress = hasPassedInitialDelay 
      ? Math.min((timeSinceStart - CURSOR_FOLLOW.INITIAL_DELAY) / CURSOR_FOLLOW.RAMP_DURATION, 1.0)
      : 0.0;
    const cursorFollowMultiplier = easeInOutQuint(transitionProgress);
    
    // DEBUG DISABLED FOR PERFORMANCE - Re-enable for debugging only
    // if (Math.floor(time * 2) % 2 === 0) {
    //   console.log('🎯 Cursor Following:', {
    //     canFollowCursor,
    //     isCursorIdle: isCursorIdle ? 'YES' : 'NO',
    //     activationDelay: cursorActivationDelayRef.current.toFixed(1),
    //     timeSinceMove: timeSinceLastMove.toFixed(1)
    //   });
    // }



    // PERFORMANCE: Logging disabled for optimal FPS - re-enable for debugging only
    // debugLogRef.current += delta;
    // const logInterval = animationState.isAnimating ? 10.0 : 5.0; // Less frequent during blur
    // if (debugLogRef.current >= logInterval) {
    //   const avgFps = fpsCounterRef.current / frameTimeRef.current;
    //   if (!animationState.isAnimating) { // Only log when not blurring for luxury feel
    //     console.log('🎯 Performance Status:', {
    //       fps: avgFps.toFixed(1),
    //       canFollowCursor,
    //       floatMultiplier: Math.max(currentAnimationMultiplier, 0.3).toFixed(2)
    //     });
    //   }
    //   debugLogRef.current = 0;
    //   frameTimeRef.current = 0;
    //   fpsCounterRef.current = 0;
    // }
    
    // PERFORMANCE: Extended idle optimization (reduced console output)
    idleDetectionRef.current += delta;
    if (idleDetectionRef.current > 600) { // After 10 minutes of idle (less frequent)
      // PERFORMANCE: Idle detection logging disabled for optimal FPS
      // console.log('🛑 Extended idle detected - reducing animation frequency');
      idleDetectionRef.current = 0;
      return; // Skip this frame to reduce memory usage
    }
    
    // Handle reset logic - only after initial delay has passed
    if (isCursorIdle && !isResettingRef.current && hasPassedInitialDelay) {
      isResettingRef.current = true;
      resetStartTimeRef.current = time;
      const currentRotation = parentGroupRef.current.rotation;
      targetRotationRef.current = {
        x: currentRotation.x,
        y: currentRotation.y,
        z: currentRotation.z
      };
    }
    
    if (!isCursorIdle && isResettingRef.current) {
      isResettingRef.current = false;
    }

    // Apply animations
    if (isResettingRef.current) {
      // Reset animation
      const resetProgress = Math.min((time - resetStartTimeRef.current) / CURSOR_FOLLOW.RESET_DURATION, 1.0);
      const easeOutProgress = easeInOutQuint(resetProgress);
      
      const currentRotation = parentGroupRef.current.rotation;
      
      currentRotation.x = targetRotationRef.current.x * (1 - easeOutProgress) + baseRotationX * easeOutProgress;
      currentRotation.y = targetRotationRef.current.y * (1 - easeOutProgress) + baseRotationY * easeOutProgress;
      currentRotation.z = targetRotationRef.current.z * (1 - easeOutProgress) + baseRotationZ * easeOutProgress;
      
      if (resetProgress === 1.0) {
        isResettingRef.current = false;
      }
    } else if (canFollowCursor) {
      // PERFORMANCE: Activation logging disabled for optimal FPS
      // if (!activationLoggedRef.current) {
      //   console.log('🚀 Orbital cursor following activated');
      //   activationLoggedRef.current = true;
      // }
      
             // Premium cursor following with sophisticated easing
       const normalizedX = cursorPosition.normalizedX;
       const normalizedY = cursorPosition.normalizedY;
       
       // Create smooth, premium target rotation with easing curves
       const easeInOutCubic = (t: number): number => {
         return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
       };
       
       // Smooth interpolation factors for premium feel
       const xInfluence = easeInOutCubic(Math.abs(normalizedX)) * Math.sign(normalizedX);
       const yInfluence = easeInOutCubic(Math.abs(normalizedY)) * Math.sign(normalizedY);
       
       // Energetic yet refined rotation range for premium feel
       const maxRotation = 0.18; // Increased from 0.12 for more energetic movement
       const targetRotationX = -yInfluence * maxRotation * cursorFollowMultiplier;
       const targetRotationY = xInfluence * maxRotation * cursorFollowMultiplier;
       const targetRotationZ = xInfluence * maxRotation * 0.25 * cursorFollowMultiplier; // Slightly more Z-axis for depth
       
       // More responsive but still elegant interpolation
       const currentRotation = parentGroupRef.current.rotation;
       const smoothingFactor = 0.028; // Increased from 0.02 for more energetic response
       
       // Premium easing interpolation with smooth transition - feels like floating in premium liquid
       currentRotation.x += (targetRotationX - currentRotation.x) * smoothingFactor;
       currentRotation.y += (targetRotationY - currentRotation.y) * smoothingFactor;
       currentRotation.z += (targetRotationZ - currentRotation.z) * smoothingFactor;
    } else {
      // Base animation - smooth transition back to neutral position
      const currentRotation = parentGroupRef.current.rotation;
      const smoothing = CURSOR_FOLLOW.SMOOTHING;
      
      // Apply smooth transition during initial delay period
      const neutralTransitionMultiplier = hasPassedInitialDelay ? 1.0 : (1.0 - cursorFollowMultiplier);
      
      currentRotation.x += (baseRotationX - currentRotation.x) * smoothing * neutralTransitionMultiplier;
      currentRotation.y += (baseRotationY - currentRotation.y) * smoothing * neutralTransitionMultiplier;
      currentRotation.z += (baseRotationZ - currentRotation.z) * smoothing * neutralTransitionMultiplier;
    }
    
    // Apply floating animation to child group - ALWAYS active regardless of other animation states
    if (childGroupRef.current) {
      const floatProgress = (time * ANIMATION.FLOAT_SPEED) % (2 * Math.PI);
      const floatOffset = Math.cos(floatProgress) * ANIMATION.FLOAT_AMPLITUDE * Math.max(currentAnimationMultiplier, 0.3); // Ensure minimum floating
      
      childGroupRef.current.position.set(
        visualOffset[0],
        visualOffset[1] + floatOffset,
        visualOffset[2]
      );
    }
  });

  // ENHANCED CLEANUP FUNCTION - MEMORY LEAK PREVENTION
  useEffect(() => {
    return () => {
      console.log('🧹 ChromeObject cleanup: Starting comprehensive cleanup');
      
      // Reset all refs to prevent memory leaks
      lastCursorMoveRef.current = 0;
      resetStartTimeRef.current = 0;
      isResettingRef.current = false;
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
      targetRotationRef.current = { x: 0, y: 0, z: 0 };
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