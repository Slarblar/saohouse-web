import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

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
}

const ChromeObject: React.FC<ChromeObjectProps> = ({ materialSettings }) => {
  const modelRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(0.05);
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  
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

  // Detect device type and set appropriate scale and position
  useEffect(() => {
    const updateScaleAndPosition = () => {
      const width = window.innerWidth;
      
      if (width >= 1024) {
        // Desktop: width >= 1024px
        setScale(0.0625);
        setPosition([0.225, 0.15, 0]);
        console.log('🖥️ Desktop detected - using larger scale and fine-tuned positioning:', 0.0625, [0.225, 0.15, 0]);
      } else if (width >= 768) {
        // Large tablet: 768px to 1023px (20% smaller: 0.03825 × 0.8 = 0.0306)
        setScale(0.0306);
        setPosition([-1.3, 0, 0]); // 1.3 units to the left (0.3 + 1.0)
        console.log('📱 Large Tablet detected - using smaller scale and far left offset:', 0.0306, [-1.3, 0, 0]);
      } else {
        // Mobile/small tablet: < 768px
        setScale(0.03825);
        setPosition([0.05, 0, 0]);
        console.log('📱 Mobile/Small Tablet detected - using smaller scale and slight right offset:', 0.03825, [0.05, 0, 0]);
      }
    };

    // Initial scale and position setting
    updateScaleAndPosition();

    // Listen for window resize
    window.addEventListener('resize', updateScaleAndPosition);
    
    return () => window.removeEventListener('resize', updateScaleAndPosition);
  }, []);

  useEffect(() => {
    console.log('📦 Logo model mounted');
    if (modelRef.current) {
      console.log('Logo position:', modelRef.current.position);
      console.log('Logo is visible:', modelRef.current.visible);
      console.log('Logo scale:', scale);
      
      // Apply materials to all meshes
      modelRef.current.traverse((child) => {
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
  }, [scene, activeMaterialSettings, scale]);

  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Smooth floating animation (always active) - apply to current position
      const floatOffset = Math.sin(time * 0.5) * 0.1;
      modelRef.current.position.set(position[0], position[1] + floatOffset, position[2]);
    }
  });

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={scale}
      position={position}
    />
  );
};

// Preload the model
useGLTF.preload('/objects/sao-logo.glb');

export default ChromeObject; 