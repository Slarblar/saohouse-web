import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCursorPosition } from '../hooks/useCursorPosition';

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
}

const ChromeObject: React.FC<ChromeObjectProps> = ({ 
  materialSettings, 
  followCursor = true,
  followIntensity = 0.3 
}) => {
  // Parent group for rotation (stays at origin)
  const parentGroupRef = useRef<THREE.Group>(null);
  // Child group for visual positioning
  const childGroupRef = useRef<THREE.Group>(null);
  
  const [scale, setScale] = useState(0.05);
  const [visualOffset, setVisualOffset] = useState<[number, number, number]>([0, 0, 0]);
  
  // Get cursor position
  const cursorPosition = useCursorPosition();
  
  // Enhanced floating animation state
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const momentumRef = useRef(new THREE.Vector3(0, 0, 0));
  const easingFactorRef = useRef(0);
  
  // Reset animation state
  const lastCursorMoveRef = useRef(Date.now());
  const isResettingRef = useRef(false);
  const targetRotationRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentRotationRef = useRef(new THREE.Vector3(0, 0, 0));
  const previousCursorRef = useRef({ x: 0, y: 0 });
  
  // Easing functions for smooth floating animation
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };
  
  const easeInOutElastic = (t: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  };
  
  // Test if cursor hook is working at all
  useEffect(() => {
    console.log('🖱️ Cursor position updated:', cursorPosition);
  }, [cursorPosition.normalizedX, cursorPosition.normalizedY]);
  
  // Load the logo model
  const { scene } = useGLTF('/objects/sao-logo.glb');
  
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

  // Track cursor movement for reset logic with enhanced sensitivity
  useEffect(() => {
    const currentCursor = cursorPosition;
    const prevCursor = previousCursorRef.current;
    
    // More sensitive threshold for floating feeling
    const moveThreshold = 0.005; // Reduced for more responsive detection
    const hasMoved = Math.abs(currentCursor.normalizedX - prevCursor.x) > moveThreshold || 
                     Math.abs(currentCursor.normalizedY - prevCursor.y) > moveThreshold;
    
    if (hasMoved) {
      lastCursorMoveRef.current = Date.now();
      isResettingRef.current = false;
      previousCursorRef.current = { x: currentCursor.normalizedX, y: currentCursor.normalizedY };
      
      // Reset momentum when cursor moves again
      if (easingFactorRef.current < 0.1) {
        console.log('🎈 Cursor reactivated - resetting momentum');
        momentumRef.current.set(0, 0, 0);
      }
    }
  }, [cursorPosition.normalizedX, cursorPosition.normalizedY]);

  // Detect device type and set appropriate scale and visual offset
  useEffect(() => {
    const updateScaleAndOffset = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      
      if (width >= 1024) {
        // Desktop: width >= 1024px
        if (isLandscape) {
          setScale(0.075); // Increased by 100% (0.0375 * 2)
          setVisualOffset([0.4, 0.4, 0]); // Left 0.05 (0.45 - 0.05), up 0.25 (0.15 + 0.25)
          console.log('🖥️ Desktop Landscape - scale:', 0.075, 'visual offset:', [0.4, 0.4, 0]);
        } else {
          setScale(0.062); // Portrait reduced by 35% (0.096 * 0.65)
          setVisualOffset([0.4, 0.4, 0]); // Left 0.05 (0.45 - 0.05), up 0.25 (0.15 + 0.25)
          console.log('🖥️ Desktop Portrait - scale:', 0.062, 'visual offset:', [0.4, 0.4, 0]);
        }
      } else if (width >= 768) {
        // Large tablet: 768px to 1023px
        if (isLandscape) {
          setScale(0.0225); // Back to previous value
          setVisualOffset([0.3, 0.25, 0]); // Right 0.3 (0.1 + 0.2), up 0.25 (0 + 0.25)
          console.log('📱 Large Tablet Landscape - scale:', 0.0225, 'visual offset:', [0.3, 0.25, 0]);
        } else {
          setScale(0.047); // Portrait reduced by 35% (0.072 * 0.65)
          setVisualOffset([0.2, 0.25, 0]); // Right 0.1 (0.1 + 0.1), up 0.25 (0 + 0.25)
          console.log('📱 Large Tablet Portrait - scale:', 0.047, 'visual offset:', [0.2, 0.25, 0]);
        }
      } else {
        // Mobile/small tablet: < 768px
        if (isLandscape) {
          setScale(0.072); // Reduced by 20% (0.09 * 0.8)
          setVisualOffset([0.3, 0.25, 0]); // Right 0.3 (0.1 + 0.2), up 0.25 (0 + 0.25)
          console.log('📱 Mobile Landscape - scale:', 0.072, 'visual offset:', [0.3, 0.25, 0]);
        } else {
          setScale(0.035); // Portrait reduced by 35% (0.054 * 0.65)
          setVisualOffset([0.1, 0.25, 0]); // Left 0.25 (0.35 - 0.25), up 0.25 (0 + 0.25)
          console.log('📱 Mobile Portrait - scale:', 0.035, 'visual offset:', [0.1, 0.25, 0]);
        }
      }
    };

    // Initial scale and offset setting
    updateScaleAndOffset();

    // Listen for window resize and orientation change
    window.addEventListener('resize', updateScaleAndOffset);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure orientation change is complete
      setTimeout(updateScaleAndOffset, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateScaleAndOffset);
      window.removeEventListener('orientationchange', updateScaleAndOffset);
    };
  }, []);

  useEffect(() => {
    console.log('📦 Logo model mounted');
    if (childGroupRef.current) {
      console.log('Logo visual offset:', visualOffset);
      console.log('Logo is visible:', childGroupRef.current.visible);
      console.log('Logo scale:', scale);
      
      // Apply materials to all meshes in the child group
      childGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: activeMaterialSettings.color,
            metalness: activeMaterialSettings.metalness,
            roughness: activeMaterialSettings.roughness,
            clearcoat: activeMaterialSettings.clearcoat,
            clearcoatRoughness: activeMaterialSettings.clearcoatRoughness,
            ior: activeMaterialSettings.ior,
            reflectivity: activeMaterialSettings.reflectivity,
            envMapIntensity: activeMaterialSettings.envMapIntensity,
            toneMapped: activeMaterialSettings.toneMapped
          });
        }
      });
    }
  }, [scene, activeMaterialSettings, scale, visualOffset]);

  useFrame((state, delta) => {
    if (parentGroupRef.current && childGroupRef.current) {
      const time = state.clock.getElapsedTime();
      const now = Date.now();
      
      // Enhanced floating animation with multiple sine waves for organic movement
      const primaryFloat = Math.sin(time * 0.3) * 0.12; // Slower primary wave
      const secondaryFloat = Math.sin(time * 0.7) * 0.04; // Faster secondary wave
      const tertiaryFloat = Math.cos(time * 0.5) * 0.06; // Tertiary wave for complexity
      const floatOffset = primaryFloat + secondaryFloat + tertiaryFloat;
      
      // Check if we should reset to default
      const resetDelay = 1200; // Increased to 1.2s for more deliberate feeling
      const shouldReset = now - lastCursorMoveRef.current > resetDelay;
      const timeSinceMove = now - lastCursorMoveRef.current;
      
             // Calculate dynamic easing factor based on cursor activity
       if (!shouldReset) {
         // When cursor is active, very gradually increase responsiveness
         easingFactorRef.current = Math.min(easingFactorRef.current + delta * 0.8, 1);
       } else {
         // When cursor is idle, gradually decrease responsiveness for floating effect
         easingFactorRef.current = Math.max(easingFactorRef.current - delta * 0.4, 0);
       }
      
             if (followCursor && !shouldReset) {
         // Calculate target rotation with very subtle intensity
         const enhancedIntensity = followIntensity * 0.8; // Further reduced for subtle movement
        
        targetRotationRef.current.set(
          cursorPosition.normalizedY * enhancedIntensity * 0.9,
          cursorPosition.normalizedX * enhancedIntensity * 1.4,
          cursorPosition.normalizedX * enhancedIntensity * 0.4
        );
        
                 // Calculate velocity for momentum effects (very subtle)
         velocityRef.current.set(
           cursorPosition.normalizedY * enhancedIntensity * 0.07,
           cursorPosition.normalizedX * enhancedIntensity * 0.07,
           cursorPosition.normalizedX * enhancedIntensity * 0.03
         );
        
      } else if (shouldReset && !isResettingRef.current) {
        // Start reset to default position with momentum decay
        isResettingRef.current = true;
        targetRotationRef.current.set(0, 0, 0);
        
        // Apply momentum for continued movement after cursor stops
        const momentumDecay = Math.max(0, 1 - (timeSinceMove - resetDelay) / 1000);
        const easedMomentum = easeOutQuart(momentumDecay);
        
        momentumRef.current.copy(velocityRef.current).multiplyScalar(easedMomentum * 0.3);
        targetRotationRef.current.add(momentumRef.current);
      }
      
             // Enhanced smooth interpolation with custom easing
       const baseLerpFactor = 0.015; // Very slow base animation for subtle floating feeling
       const activityMultiplier = easeInOutCubic(easingFactorRef.current) * 1.5 + 1;
       const dynamicLerpFactor = baseLerpFactor * activityMultiplier;
       
       // Apply eased interpolation
       const lerpProgress = Math.min(dynamicLerpFactor, 0.08); // Further reduced cap for very subtle movement
      currentRotationRef.current.lerp(targetRotationRef.current, lerpProgress);
      
      // Enhanced base animation with organic movement
      const baseRotX = Math.sin(time * 0.15) * 0.08 + Math.cos(time * 0.23) * 0.03;
      const baseRotY = Math.cos(time * 0.12) * 0.1 + Math.sin(time * 0.31) * 0.04;
      const baseRotZ = Math.sin(time * 0.18) * 0.04 + Math.cos(time * 0.27) * 0.02;
      
      // Apply rotations to PARENT group with floating feeling
      parentGroupRef.current.rotation.x = currentRotationRef.current.x + baseRotX;
      parentGroupRef.current.rotation.y = currentRotationRef.current.y + baseRotY;
      parentGroupRef.current.rotation.z = currentRotationRef.current.z + baseRotZ;
      
      // Enhanced floating animation to CHILD group position with organic movement
      const horizontalFloat = Math.sin(time * 0.25) * 0.02;
      const depthFloat = Math.cos(time * 0.35) * 0.015;
      
      childGroupRef.current.position.set(
        visualOffset[0] + horizontalFloat,
        visualOffset[1] + floatOffset,
        visualOffset[2] + depthFloat
      );
      
      // Update scale with subtle breathing effect
      const breathingScale = 1 + Math.sin(time * 0.4) * 0.02;
      childGroupRef.current.scale.setScalar(scale * breathingScale);
      
      // Debug logging (less frequent)
      if (time % 2 < 0.016) { // Log every 2 seconds
        console.log('🎈 Floating animation state:', {
          easingFactor: easingFactorRef.current.toFixed(3),
          lerpFactor: lerpProgress.toFixed(3),
          shouldReset,
          momentum: momentumRef.current.length().toFixed(3)
        });
      }
    }
  });

  return (
    <group ref={parentGroupRef} position={[0, 0, 0]}>
      <group ref={childGroupRef} scale={scale} position={visualOffset}>
        <primitive object={scene} />
      </group>
    </group>
  );
};

// Preload the model
useGLTF.preload('/objects/sao-logo.glb');

export default ChromeObject; 