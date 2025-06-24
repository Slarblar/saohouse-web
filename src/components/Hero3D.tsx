import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { 
  EffectComposer,
  Bloom,
  ChromaticAberration,
  ToneMapping,
  Vignette,
  BrightnessContrast
} from '@react-three/postprocessing';
import { gsap } from 'gsap';
import * as THREE from 'three';
import ChromeObject from './ChromeObject';
import settingsData from '../settings.json';
import './Hero3D.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 3D Scene Error:', error);
    console.error('Error details:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <h2>Something went wrong loading the 3D scene.</h2>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Camera controller with smooth reset
const CameraController = () => {
  const { camera } = useThree();
  const lastInteractionRef = useRef(Date.now());
  const isResettingRef = useRef(false);
  const defaultPosition = new THREE.Vector3(0, 0, 5);

  useFrame(() => {
    const now = Date.now();
    if (!isResettingRef.current && now - lastInteractionRef.current > 500) {
      isResettingRef.current = true;
      gsap.to(camera.position, {
        x: defaultPosition.x,
        y: defaultPosition.y,
        z: defaultPosition.z,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
          isResettingRef.current = false;
        }
      });
    }
  });

  const handleChange = () => {
    lastInteractionRef.current = Date.now();
    isResettingRef.current = false;
  };

  return (
    <OrbitControls 
      enableZoom={false}
      enablePan={false}
      enableRotate={true}
      autoRotate={false}
      onChange={handleChange}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 3/4}
      minAzimuthAngle={-Math.PI / 2}
      maxAzimuthAngle={Math.PI / 2}
      dampingFactor={0.05}
      rotateSpeed={0.5}
    />
  );
};

const Hero3D: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const {
    toneMapping,
    bloom,
    chromaticAberration,
    lensDistortion,
    hdri
  } = settingsData.settings;

  useEffect(() => {
    console.log('🎬 Hero3D component mounted');
    return () => console.log('🎬 Hero3D component unmounted');
  }, []);

  const handleCreated = () => {
    console.log('✨ Canvas created');
    setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setIsVisible(true), 100);
    }, 500);
  };

  return (
    <ErrorBoundary>
      <div className="hero-3d-container">
        {isLoading && (
          <div className="loading-screen">
            <div className="loading-text">Loading 3D Scene...</div>
          </div>
        )}
        
        <div className={`canvas-container ${isVisible ? 'visible' : ''}`}>
          <Canvas
            gl={{ 
              antialias: true,
              alpha: false,
              stencil: false,
              depth: true,
              powerPreference: 'high-performance'
            }}
            camera={{ 
              position: [0, 0, 5],
              fov: 50,
              near: 0.1,
              far: 1000
            }}
            onCreated={handleCreated}
            dpr={[1, 2]}
          >
            <color attach="background" args={['#000000']} />
            
            {/* Lighting setup */}
            <ambientLight intensity={0.5} />
            <spotLight 
              position={[10, 10, 10]} 
              angle={0.15} 
              penumbra={1} 
              intensity={1} 
              castShadow
            />
            <spotLight 
              position={[-10, -10, -10]} 
              angle={0.15} 
              penumbra={1} 
              intensity={0.5} 
              castShadow
            />
            
            {/* Environment map */}
            <Environment 
              preset="studio"
              background={hdri.background}
            />
            
            <Suspense fallback={null}>
              <ChromeObject />
              <CameraController />

              {/* Post-processing effects */}
              <EffectComposer>
                <ToneMapping 
                  mode={toneMapping.mode}
                  exposure={toneMapping.exposure}
                  whitePoint={toneMapping.whitePoint}
                  adaptationRate={toneMapping.adaptation}
                />
                
                <Bloom 
                  intensity={bloom.intensity}
                  luminanceThreshold={bloom.luminanceThreshold}
                  luminanceSmoothing={bloom.luminanceSmoothing}
                  mipmapBlur={bloom.mipmapBlur}
                />
                
                <ChromaticAberration 
                  offset={chromaticAberration.offset}
                  blendFunction={chromaticAberration.enabled ? 1 : 0}
                />
                
                <Vignette
                  offset={lensDistortion.vignette}
                  darkness={0.5}
                />

                <BrightnessContrast 
                  brightness={0}
                  contrast={0.1}
                />
              </EffectComposer>
            </Suspense>
          </Canvas>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Hero3D; 