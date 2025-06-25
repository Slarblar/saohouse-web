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
  followIntensity?: number;
  onResponsiveChange?: (isTransitioning: boolean) => void;
  onBlurInUpdate?: (blurAmount: number, isAnimating: boolean) => void;
  onModelLoaded?: (isLoaded: boolean) => void;
  enableCursorFollowing?: boolean;
  startPresentation?: boolean; // New prop to trigger presentation animation
}

const ChromeObject: React.FC<ChromeObjectProps> = ({ 
  materialSettings, 
  followCursor = true,
  followIntensity = 0.3,
  onResponsiveChange,
  onBlurInUpdate,
  onModelLoaded,
  enableCursorFollowing = true,
  startPresentation = false
}) => {
  // Parent group for rotation (stays at origin)
  const parentGroupRef = useRef<THREE.Group>(null);
  // Child group for visual positioning
  const childGroupRef = useRef<THREE.Group>(null);
  
  // Blur-in animation hook with fast, consistent timing
  const blurAnimation = useBlurInAnimation(2.5); // 2.5 seconds for quick, consistent fade-in
  
  // Get responsive configuration with loading callback
  const { scale, position: visualOffset } = useResponsive3D(
    undefined, // use default settings
    true,      // enable mobile reload
    onResponsiveChange // pass the loading callback
  );
  
  // Get cursor position
  const cursorPosition = useCursorPosition();
  
  // Enhanced floating animation state
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const momentumRef = useRef(new THREE.Vector3(0, 0, 0));
  const easingFactorRef = useRef(0);
  
  // Reset animation state - ensure everything starts at perfect zero
  const lastCursorMoveRef = useRef(Date.now());
  const isResettingRef = useRef(false);
  const resetCompleteTimeRef = useRef(0);
  const targetRotationRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentRotationRef = useRef(new THREE.Vector3(0, 0, 0));
  const previousCursorRef = useRef({ x: 0, y: 0 });
  
  // Smooth blending state for seamless cursor activation
  const baseAnimationStateRef = useRef(new THREE.Vector3(0, 0, 0));
  const cursorInfluenceRef = useRef(0); // 0 = pure base animation, 1 = pure cursor following
  
  // Easing functions for smooth floating animation
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  

  
  // Minimal debugging - removed excessive re-renders
  
  // Load the logo model and track loading state
  const gltf = useGLTF('/objects/sao-logo.glb');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [presentationStarted, setPresentationStarted] = useState(false);
  
  // Preload the model for consistent loading
  useGLTF.preload('/objects/sao-logo.glb');
  
  // Model loaded when gltf.scene exists
  
  // Default material settings
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

  // Initialize cursor movement timer on first load and ensure zero rotation start
  useEffect(() => {
    if (lastCursorMoveRef.current === 0) {
      lastCursorMoveRef.current = Date.now(); // Initialize with current time
    }
    
    // Ensure parent group starts with zero rotation (default state)
    if (parentGroupRef.current) {
      parentGroupRef.current.rotation.set(0, 0, 0);
    }
  }, []);

  // Track cursor movement for reset logic with enhanced sensitivity
  useEffect(() => {
    const currentCursor = cursorPosition;
    const prevCursor = previousCursorRef.current;
    
    // Adaptive threshold based on screen size for immediate floating response
    const moveThreshold = 0.001; // Even more responsive detection for ultra-smooth cursor following
    const hasMoved = Math.abs(currentCursor.normalizedX - prevCursor.x) > moveThreshold || 
                     Math.abs(currentCursor.normalizedY - prevCursor.y) > moveThreshold;
    
    if (hasMoved) {
      const now = Date.now();
      
      // Only register cursor movement if we're not in reset cooldown
      const isInResetCooldown = isResettingRef.current || (resetCompleteTimeRef.current > 0 && now - resetCompleteTimeRef.current < COOLDOWN_DURATION);
      
      if (!isInResetCooldown) {
        lastCursorMoveRef.current = now;
        isResettingRef.current = false;
        previousCursorRef.current = { x: currentCursor.normalizedX, y: currentCursor.normalizedY };
        
        // Reset momentum when cursor moves again
        if (easingFactorRef.current < 0.1) {
          momentumRef.current.set(0, 0, 0);
        }
      }
    }
  }, [cursorPosition.normalizedX, cursorPosition.normalizedY]);



  // Track when model is loaded reliably
  useEffect(() => {
    if (gltf.scene && !isModelLoaded) {
      
      
      // Mark as loaded immediately for reliable timing
      setIsModelLoaded(true);
      
      // Notify parent component that model is ready
      if (onModelLoaded) {
        onModelLoaded(true);
      }
    }
  }, [gltf.scene, isModelLoaded, onModelLoaded]);

  // Single effect to handle presentation start - eliminates race conditions
  useEffect(() => {
    if (startPresentation && isModelLoaded && !presentationStarted) {
      
      setPresentationStarted(true);
      blurAnimation.start();
    }
  }, [startPresentation, isModelLoaded, presentationStarted, blurAnimation]);

  // Apply materials and handle responsive settings - run only once when model loads
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const materialsInitialized = useRef(false);
  
  useEffect(() => {
    if (gltf.scene && !materialsInitialized.current) {
      
      
      // Center the model geometry at origin to fix any internal offset
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      
      // Apply the offset to center the model properly at origin
      gltf.scene.position.set(-center.x, -center.y, -center.z);
      
      
      // Create material once and apply to all meshes
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
        transparent: true, // Always enable transparency for smooth animations
        opacity: 1.0
      });
      
      // Apply materials to all meshes - ONE TIME SETUP
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.material = materialRef.current;
        }
      });
      
      materialsInitialized.current = true;
      
    }
    
    // Cleanup function
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
        materialRef.current = null;
      }
      materialsInitialized.current = false;
    };
  }, [gltf.scene]); // Only depend on scene, not settings

  // Gradual animation activation state for smooth handoff
  const animationActivationRef = useRef<number>(0); // 0 = fully suppressed, 1 = fully active
  const cursorActivationDelayRef = useRef<number>(0); // Track time since blur-in completed for cursor following only
  const cursorFollowingActivatedRef = useRef<boolean>(false); // Flag to log activation only once

  // Dynamic timing constants for smooth transitions (no hardcoded values)
  const CURSOR_ACTIVATION_DELAY = 0.3; // Even faster activation for immediate response
  const CURSOR_RAMP_DURATION = 0.6; // Reduced for smoother activation
  const RESET_DELAY = 3000; // Increased to give cursor following more time to work
  const COOLDOWN_DURATION = 300; // Reduced for quicker reactivation
  const ANIMATION_ACTIVATION_SPEED = 1.5; // Faster activation
  const ANIMATION_DEACTIVATION_SPEED = 3.0; // Faster deactivation

  // Throttle frame updates to prevent excessive calculations
  const lastFrameTime = useRef<number>(0);
  
  useFrame((state, delta) => {
    if (parentGroupRef.current && childGroupRef.current && isModelLoaded) {
      const time = state.clock.getElapsedTime();
      const now = Date.now();
      
      // Throttle calculations to max 60fps to prevent memory pressure
      if (now - lastFrameTime.current < 16) { // ~60fps limit
        return;
      }
      lastFrameTime.current = now;
      
      // Update blur-in animation only when model is loaded
      const animationState = blurAnimation.updateAnimation(time);
      
      // Notify parent component of blur animation updates
      if (onBlurInUpdate) {
        onBlurInUpdate(animationState.blurAmount, animationState.isAnimating);
      }
      
      // Gradual animation activation for smooth handoff (base animations activate immediately)
      if (animationState.isAnimating) {
        // During blur-in, keep animations fully suppressed and reset cursor delay timer
        animationActivationRef.current = Math.max(animationActivationRef.current - delta * ANIMATION_DEACTIVATION_SPEED, 0);
        cursorActivationDelayRef.current = 0; // Reset cursor delay timer during blur-in
        cursorFollowingActivatedRef.current = false; // Reset activation flag
      } else {
        // After blur-in completes, gradually activate base animations with smooth timing
        animationActivationRef.current = Math.min(animationActivationRef.current + delta * ANIMATION_ACTIVATION_SPEED, 1.0);
        
        // Separately track cursor following delay with reduced timing
        cursorActivationDelayRef.current += delta;
      }
      
            // Smooth multiplier instead of abrupt 0→1 switch
      const smoothAnimationMultiplier = easeInOutCubic(animationActivationRef.current);
      
      const primaryFloat = Math.sin(time * 0.3) * 0.12 * smoothAnimationMultiplier;
      const secondaryFloat = Math.sin(time * 0.7) * 0.04 * smoothAnimationMultiplier;
      const tertiaryFloat = Math.cos(time * 0.5) * 0.06 * smoothAnimationMultiplier;
      const floatOffset = primaryFloat + secondaryFloat + tertiaryFloat;
      
            // Check if we should reset to default with smooth timing
      // Don't reset if cursor following is active or cursor influence is still present
      const timeSinceMove = now - lastCursorMoveRef.current;
      const shouldReset = timeSinceMove > RESET_DELAY && cursorInfluenceRef.current <= 0.01;
      
      // Check if we're in the reset cooldown period with reduced duration
      const isInResetCooldown = isResettingRef.current || (resetCompleteTimeRef.current > 0 && now - resetCompleteTimeRef.current < COOLDOWN_DURATION);
      
      // Calculate dynamic easing factor based on cursor activity with ultra-smooth transitions
      const easingActivationSpeed = 1.5; // Faster activation for responsiveness
      const easingDeactivationSpeed = 0.8; // Slower deactivation for smoothness
      
      if (!shouldReset && !isInResetCooldown) {
        // When cursor is active and not in cooldown, smoothly increase responsiveness
        easingFactorRef.current = Math.min(easingFactorRef.current + delta * easingActivationSpeed, 1);
      } else {
        // When cursor is idle or in reset cooldown, smoothly decrease responsiveness for floating effect
        easingFactorRef.current = Math.max(easingFactorRef.current - delta * easingDeactivationSpeed, 0);
      }
      
      // Check if cursor following should be enabled with smooth activation timing
      const isCursorFollowingReady = cursorActivationDelayRef.current >= CURSOR_ACTIVATION_DELAY;
      
      // Simplified condition with smooth timing - more reliable check
      const simpleTestCondition = followCursor && enableCursorFollowing && !animationState.isAnimating && isCursorFollowingReady && !isResettingRef.current;
      
      // Calculate base animation state (always running for smooth blending)
      let baseRotX = 0;
      let baseRotY = 0;
      let baseRotZ = 0;
      
      // Completely disable base animation during reset to prevent interference
      if (smoothAnimationMultiplier > 0.05 && !isResettingRef.current && !isInResetCooldown) {
        baseRotX = (Math.sin(time * 0.15) * 0.08 + Math.cos(time * 0.23) * 0.03) * smoothAnimationMultiplier;
        baseRotY = (Math.cos(time * 0.12) * 0.1 + Math.sin(time * 0.31) * 0.04) * smoothAnimationMultiplier;
        baseRotZ = (Math.sin(time * 0.18) * 0.04 + Math.cos(time * 0.27) * 0.02) * smoothAnimationMultiplier;
      }
      
      // Force base animation to zero during reset
      if (isResettingRef.current) {
        baseRotX = 0;
        baseRotY = 0;
        baseRotZ = 0;
      }
      
      baseAnimationStateRef.current.set(baseRotX, baseRotY, baseRotZ);
      
      // Smooth cursor influence transition (no sudden jumps)
      if (followCursor && simpleTestCondition) {
        // Log when cursor following first becomes active (once)
        if (!cursorFollowingActivatedRef.current) {
          cursorFollowingActivatedRef.current = true;
        }
        
        // Gradually increase cursor influence for seamless blending
        const cursorActivationProgress = Math.min((cursorActivationDelayRef.current - CURSOR_ACTIVATION_DELAY) / CURSOR_RAMP_DURATION, 1.0);
        const targetCursorInfluence = easeInOutCubic(Math.max(0, cursorActivationProgress)) * 0.9; // Increased to 90% cursor influence
        
        // Faster transition of cursor influence for more responsive feeling
        cursorInfluenceRef.current += (targetCursorInfluence - cursorInfluenceRef.current) * delta * 4.0;
        
             } else {
         // Gradually reduce cursor influence when not active
         cursorInfluenceRef.current = Math.max(cursorInfluenceRef.current - delta * 1.5, 0);
       }
       
       // Always apply blending logic regardless of cursor following state
       // If cursor influence is zero, this naturally becomes pure base animation
       const baseInfluence = 1.0 - cursorInfluenceRef.current;
       const cursorInfluence = cursorInfluenceRef.current;
       
       // Calculate cursor-based rotation (even when not actively following)
       const refinedIntensity = followIntensity * 0.8 * smoothAnimationMultiplier;
       const cursorRotX = cursorPosition.normalizedY * refinedIntensity * 0.9;
       const cursorRotY = cursorPosition.normalizedX * refinedIntensity * 1.4;
       const cursorRotZ = cursorPosition.normalizedX * refinedIntensity * 0.4;
       
       // Always blend (when cursorInfluence = 0, this becomes pure base animation)
       const finalTargetX = baseRotX * baseInfluence + cursorRotX * cursorInfluence;
       const finalTargetY = baseRotY * baseInfluence + cursorRotY * cursorInfluence;
       const finalTargetZ = baseRotZ * baseInfluence + cursorRotZ * cursorInfluence;
       
       targetRotationRef.current.set(finalTargetX, finalTargetY, finalTargetZ);
       
       if (shouldReset && !isResettingRef.current) {
        // Start reset to default position
        isResettingRef.current = true;
        
        // Clear any momentum and set target to absolute zero for perfect reset
        momentumRef.current.set(0, 0, 0);
        velocityRef.current.set(0, 0, 0);
        targetRotationRef.current.set(0, 0, 0);
        cursorInfluenceRef.current = 0; // Force cursor influence to zero immediately
        
        
       }
      
             // During reset, override everything to force exact zero rotation
       if (isResettingRef.current) {
         // Force target to exactly zero (override any blending)
         targetRotationRef.current.set(0, 0, 0);
         baseAnimationStateRef.current.set(0, 0, 0); // Also force base animation to zero
         
         // Use slower, smoother lerp during reset for gradual return
         const resetLerpProgress = 0.04; // Much slower and smoother reset
         currentRotationRef.current.lerp(targetRotationRef.current, resetLerpProgress);
         
         // Check if reset animation is complete with very tight threshold
         const rotationDistance = currentRotationRef.current.distanceTo(targetRotationRef.current);
         if (rotationDistance < 0.0001) { // Extremely tight threshold for perfect reset
           // Force exact zero to eliminate any floating point errors
           currentRotationRef.current.set(0, 0, 0);
           targetRotationRef.current.set(0, 0, 0);
           baseAnimationStateRef.current.set(0, 0, 0);
           
           // Also force the actual parent group rotation to zero immediately
           parentGroupRef.current.rotation.set(0, 0, 0);
           
           isResettingRef.current = false;
           resetCompleteTimeRef.current = now;
           
         }
       }
      
      // Clear cooldown period when cursor moves again
      if (!shouldReset && !isInResetCooldown && resetCompleteTimeRef.current > 0) {
        resetCompleteTimeRef.current = 0;
        
      }
      
             // Enhanced smooth interpolation with adaptive responsiveness (skip during reset)
       if (!isResettingRef.current) {
         const baseLerpFactor = 0.03; // Optimized base speed for smoothness
         const activityMultiplier = easeInOutCubic(easingFactorRef.current) * 1.8 + 1; // Refined response curve
         const cursorResponsivenessFactor = enableCursorFollowing && isCursorFollowingReady ? 1.3 : 1.0; // Balanced responsiveness
         const dynamicLerpFactor = baseLerpFactor * activityMultiplier * cursorResponsivenessFactor;
         
         // Apply eased interpolation with adaptive cap
         const lerpProgress = Math.min(dynamicLerpFactor, 0.1); // Optimized cap for ultra-smooth movement
         currentRotationRef.current.lerp(targetRotationRef.current, lerpProgress);
       }
      
      // Apply final blended rotations to PARENT group (now seamlessly blended)
      parentGroupRef.current.rotation.x = currentRotationRef.current.x;
      parentGroupRef.current.rotation.y = currentRotationRef.current.y;
      parentGroupRef.current.rotation.z = currentRotationRef.current.z;
      
      // Enhanced floating animation to CHILD group position with organic movement (gradually activated)
      // Remove horizontal float to maintain perfect centering
      const depthFloat = Math.cos(time * 0.35) * 0.015 * smoothAnimationMultiplier;
      
      childGroupRef.current.position.set(
        visualOffset[0],                    // Perfect horizontal centering - no horizontal drift
        visualOffset[1] + floatOffset,      // Vertical floating for liveliness
        visualOffset[2] + depthFloat        // Subtle depth movement
      );
      
      // Update scale with subtle breathing effect (gradually activated after blur-in)
      const breathingScale = 1 + (Math.sin(time * 0.4) * 0.02 * smoothAnimationMultiplier);
      
      // Consistent material opacity handling to prevent flicker
      const finalOpacity = animationState.isAnimating ? Math.max(animationState.opacity, 0.1) : 1.0; // Ensure minimum visibility
      const finalScale = animationState.isAnimating ? animationState.scale : 1.0; // Maintain scale consistency
      
      // Apply consistent scale (no sudden jumping)
      childGroupRef.current.scale.setScalar(scale * breathingScale * finalScale);
      
      // Apply opacity only to the shared material (no traversal needed)
      if (materialRef.current) {
        materialRef.current.opacity = finalOpacity;
        // Transparency is always enabled from initialization
      }
      
      // Reduced debug logging to prevent memory pressure
      // Only log significant state changes, not regular updates
    }
  });

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Reset all refs to prevent memory leaks
      lastCursorMoveRef.current = 0;
      resetCompleteTimeRef.current = 0;
      isResettingRef.current = false;
      easingFactorRef.current = 0;
      
      // Clear vectors
      targetRotationRef.current.set(0, 0, 0);
      currentRotationRef.current.set(0, 0, 0);
      velocityRef.current.set(0, 0, 0);
      momentumRef.current.set(0, 0, 0);
      baseAnimationStateRef.current.set(0, 0, 0);
      cursorInfluenceRef.current = 0;
      
      
    };
  }, []);

  return (
    <group ref={parentGroupRef} position={[0, 0, 0]}>
      <group ref={childGroupRef} scale={scale} position={visualOffset}>
        {/* Always render model - opacity controls visibility */}
        {gltf.scene && <primitive object={gltf.scene} />}
      </group>
    </group>
  );
};

// Preload the model
useGLTF.preload('/objects/sao-logo.glb');

export default ChromeObject; 