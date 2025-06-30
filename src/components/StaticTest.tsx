import React from 'react';
import { Canvas } from '@react-three/fiber';
import FPSCounter from './FPSCounter';
import DeviceInfo from './DeviceInfo';

// Completely static cube - no animations, no useFrame
const StaticCube: React.FC = () => {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#cccccc" />
    </mesh>
  );
};

const StaticTest: React.FC = () => {
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
            antialias: false,
            alpha: false,
            preserveDrawingBuffer: false,
          }}
          dpr={1} // Force 1x pixel ratio
          frameloop="always" // Force continuous rendering
        >
          <StaticCube />
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
          <div>STATIC TEST</div>
          <div>• Single static cube</div>
          <div>• No animations</div>
          <div>• No useFrame calls</div>
          <div>• No shaders</div>
          <div>• No post-processing</div>
          <div>• Forced continuous rendering</div>
          <div>• Tests for frame throttling</div>
        </div>
      </div>
    </>
  );
};

export default StaticTest; 