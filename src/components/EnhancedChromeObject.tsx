import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCursorPosition } from '../hooks/useCursorPosition';
import { useResponsive3D } from '../hooks/useResponsive3D';
import { useLOD } from '../hooks/useLOD';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useBatteryOptimization } from '../hooks/useBatteryOptimization';

interface EnhancedChromeObjectProps {
  materialSettings?: any;
  onResponsiveChange?: (isTransitioning: boolean) => void;
  onModelLoaded?: (isLoaded: boolean) => void;
  enableMobileOptimizations?: boolean;
}

const EnhancedChromeObject: React.FC<EnhancedChromeObjectProps> = ({ 
  materialSettings, 
  onResponsiveChange,
  onModelLoaded,
  enableMobileOptimizations = true,
}) => {
  const parentGroupRef = useRef<THREE.Group>(null);
  const childGroupRef = useRef<THREE.Group>(null);
  
  // Core responsive system
  const { scale, position: visualOffset } = useResponsive3D(
    undefined,
    false,
    onResponsiveChange
  );
  
  // Advanced mobile optimizations
  const { lodLevel, materialComplexity, shadowsEnabled } = useLOD([0, 0, 0]);
  const { qualitySettings, fps, isPerformancePoor } = usePerformanceMonitor();
  const { optimizedSettings, isLowBattery, powerSaverMode } = useBatteryOptimization();
  
  const cursorPosition = useCursorPosition();
  const gltf = useGLTF('/objects/sao-logo.glb');

  // Combine all optimization settings
  const finalSettings = useMemo(() => {
    if (!enableMobileOptimizations) {
      return {
        pixelRatio: 2,
        enableShadows: true,
        enablePostProcessing: true,
        materialComplexity: 'high' as const,
        animationQuality: 'high' as const,
      };
    }

    // Priority: Battery > Performance > Quality > LOD
    return {
      pixelRatio: Math.min(
        qualitySettings.pixelRatio,
        optimizedSettings.pixelRatio
      ),
      enableShadows: qualitySettings.shadows && 
                    optimizedSettings.enableShadows && 
                    shadowsEnabled,
      enablePostProcessing: qualitySettings.postProcessing && 
                           optimizedSettings.enablePostProcessing,
      materialComplexity: isLowBattery || isPerformancePoor 
        ? 'low' as const
        : materialComplexity,
      animationQuality: powerSaverMode 
        ? 'low' as const 
        : optimizedSettings.animationQuality,
    };
  }, [
    enableMobileOptimizations,
    qualitySettings,
    optimizedSettings,
    shadowsEnabled,
    materialComplexity,
    isLowBattery,
    isPerformancePoor,
    powerSaverMode
  ]);

  // Optimized material based on performance
  const optimizedMaterial = useMemo(() => {
    if (!gltf.scene) return null;

    const baseSettings = materialSettings || {
      roughness: 0.01,
      metalness: 1.0,
      reflectivity: 1.0,
      envMapIntensity: 4.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      ior: 2.4,
      color: '#cccccc',
    };

    // Adjust material complexity based on performance
    let adjustedSettings = { ...baseSettings };
    
    switch (finalSettings.materialComplexity) {
      case 'low':
        adjustedSettings = {
          ...adjustedSettings,
          envMapIntensity: Math.min(adjustedSettings.envMapIntensity, 1.0),
          clearcoat: 0,
          clearcoatRoughness: 1,
          roughness: Math.max(adjustedSettings.roughness, 0.1),
        };
        break;
      case 'medium':
        adjustedSettings = {
          ...adjustedSettings,
          envMapIntensity: Math.min(adjustedSettings.envMapIntensity, 2.0),
          clearcoat: Math.min(adjustedSettings.clearcoat, 0.5),
        };
        break;
      // 'high' uses original settings
    }

    return new THREE.MeshPhysicalMaterial({
      ...adjustedSettings,
      transparent: true,
      opacity: 1.0,
      side: THREE.FrontSide,
      flatShading: finalSettings.materialComplexity === 'low',
    });
  }, [gltf.scene, materialSettings, finalSettings.materialComplexity]);

  // Adaptive animation based on performance
  const animationIntensity = useMemo(() => {
    switch (finalSettings.animationQuality) {
      case 'low': return 0.3;
      case 'medium': return 0.6;
      case 'high': return 1.0;
      default: return 1.0;
    }
  }, [finalSettings.animationQuality]);

  // Performance-optimized animation loop
  useFrame((state) => {
    if (!parentGroupRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Skip frames if performance is poor
    if (isPerformancePoor && Math.floor(time * 60) % 2 !== 0) return;
    
    // Simplified animation in power saver mode
    if (powerSaverMode) {
      const gentleFloat = Math.sin(time * 0.5) * 0.02 * animationIntensity;
      parentGroupRef.current.position.y = gentleFloat;
      return;
    }

    // Full animation with adaptive intensity
    const cursorInfluence = animationIntensity;
    const targetRotationY = cursorPosition.normalizedX * 0.3 * cursorInfluence;
    const targetRotationX = -cursorPosition.normalizedY * 0.2 * cursorInfluence;
    
    const lerpFactor = 0.02 * animationIntensity;
    parentGroupRef.current.rotation.x += (targetRotationX - parentGroupRef.current.rotation.x) * lerpFactor;
    parentGroupRef.current.rotation.y += (targetRotationY - parentGroupRef.current.rotation.y) * lerpFactor;
    
    // Floating animation
    const floatOffset = Math.sin(time * 0.3) * 0.06 * animationIntensity;
    parentGroupRef.current.position.y = floatOffset;
  });

  // Apply optimized materials to scene
  React.useEffect(() => {
    if (gltf.scene && optimizedMaterial) {
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.material = optimizedMaterial;
          child.castShadow = finalSettings.enableShadows;
          child.receiveShadow = finalSettings.enableShadows;
          
          // Optimize geometry for low-end devices
          if (finalSettings.materialComplexity === 'low' && child.geometry) {
            child.geometry.computeVertexNormals();
          }
        }
      });
      
      onModelLoaded?.(true);
    }
  }, [gltf.scene, optimizedMaterial, finalSettings.enableShadows, finalSettings.materialComplexity, onModelLoaded]);

  if (!gltf.scene) return null;

  return (
    <group ref={parentGroupRef} position={[0, 0, 0]}>
      <group ref={childGroupRef} scale={scale} position={visualOffset}>
        <primitive object={gltf.scene} />
      </group>
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <Html position={[2, 1, 0]} style={{ pointerEvents: 'none', fontSize: '12px', color: 'white' }}>
          <div>
            <div>FPS: {Math.round(fps)}</div>
            <div>LOD: {lodLevel}</div>
            <div>Material: {finalSettings.materialComplexity}</div>
            {isLowBattery && <div style={{ color: 'orange' }}>🔋 Low Battery</div>}
            {powerSaverMode && <div style={{ color: 'red' }}>⚡ Power Saver</div>}
          </div>
        </Html>
      )}
    </group>
  );
};

// Preload for performance
useGLTF.preload('/objects/sao-logo.glb');

export default EnhancedChromeObject; 