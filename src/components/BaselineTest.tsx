import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import FPSCounter from './FPSCounter';
import DeviceInfo from './DeviceInfo';

// Simple rotating logo with basic material - no shaders, no post-processing
const SimpleLogo: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF('/objects/sao-logo.glb');

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#cccccc',
    });
  }, []);

  React.useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });
    }
  }, [gltf.scene, material]);

  if (!gltf.scene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
};

const BaselineTest: React.FC = () => {
  return (
    <>
      <FPSCounter position="top-right" showDetails={true} />
      <DeviceInfo position="bottom-right" collapsed={true} />
      
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        backgroundColor: '#000',
        position: 'relative'
      }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{
            powerPreference: 'high-performance',
            antialias: false, // Disable for max performance
            alpha: false,
            preserveDrawingBuffer: false,
          }}
          dpr={1} // Force 1x pixel ratio for baseline test
        >
          {/* No lighting needed for basic material */}
          <SimpleLogo />
        </Canvas>
        
        {/* Test info overlay */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '4px',
        }}>
          <div>BASELINE TEST</div>
          <div>• SAO logo 3D model</div>
          <div>• Basic material (no lighting)</div>
          <div>• No shaders</div>
          <div>• No post-processing</div>
          <div>• 1x pixel ratio</div>
          <div>• No antialiasing</div>
        </div>
      </div>
    </>
  );
};

export default BaselineTest; 