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

// Device detection hook
const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isLandscape: false,
    pixelRatio: 1,
    screenSize: 'desktop'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const isLandscape = width > height;
      
      let screenSize = 'desktop';
      let isMobile = false;
      let isTablet = false;

      if (width <= 480) {
        screenSize = 'small-mobile';
        isMobile = true;
      } else if (width <= 640) {
        screenSize = 'mobile';
        isMobile = true;
      } else if (width <= 768) {
        screenSize = 'tablet-portrait';
        isTablet = true;
      } else if (width <= 1024) {
        screenSize = 'tablet-landscape';
        isTablet = true;
      } else if (width <= 1280) {
        screenSize = 'large-tablet';
        isTablet = true;
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        isLandscape,
        pixelRatio,
        screenSize
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

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

// Responsive Camera controller with device-specific settings
const ResponsiveCameraController = ({ deviceInfo }: { deviceInfo: any }) => {
  const { camera } = useThree();
  const lastInteractionRef = useRef(Date.now());
  const isResettingRef = useRef(false);
  const defaultPosition = new THREE.Vector3(0, 0, 5);
  const controlsRef = useRef<any>(null);

  // Get proper target position - now always origin since parent group is at origin
  const getTargetPosition = () => {
    // Since we restructured the 3D object to use parent-child groups,
    // the parent (rotation) group is always at origin (0,0,0)
    // This ensures perfect rotation around the object's center regardless of visual positioning
    return new THREE.Vector3(0, 0, 0);
  };

  // Adjust camera settings based on device
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      
      if (deviceInfo.isMobile) {
        // Closer camera for mobile to make object appear larger
        if (isLandscape) {
          defaultPosition.set(0, 0, 3.5); // Even closer in landscape
          camera.fov = 65; // Wider FOV for landscape
        } else {
          defaultPosition.set(0, 0, 4);
          camera.fov = deviceInfo.screenSize === 'small-mobile' ? 60 : 55;
        }
      } else if (deviceInfo.isTablet) {
        if (isLandscape) {
          defaultPosition.set(-1.3, 0, 4); // Position camera to look at model
          camera.fov = 55;
        } else {
          defaultPosition.set(0, 0, 4.5);
          camera.fov = 52;
        }
      } else {
        defaultPosition.set(0, 0, 5);
        camera.fov = 50;
      }
      
      camera.updateProjectionMatrix();
      camera.position.copy(defaultPosition);
      
      // Set the target for orbit controls
      if (controlsRef.current) {
        const target = getTargetPosition();
        controlsRef.current.target.copy(target);
        controlsRef.current.update();
        console.log('🎯 Camera target set to:', target);
      }
    }
  }, [deviceInfo, camera]);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(() => {
        if (camera instanceof THREE.PerspectiveCamera && controlsRef.current) {
          const target = getTargetPosition();
          controlsRef.current.target.copy(target);
          controlsRef.current.update();
          console.log('🔄 Orientation changed - camera target updated to:', target);
        }
      }, 100); // Small delay to ensure orientation change is complete
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [camera]);

  useFrame(() => {
    const now = Date.now();
    const resetTimeout = deviceInfo.isMobile ? 300 : 500; // Faster reset on mobile
    
    if (!isResettingRef.current && now - lastInteractionRef.current > resetTimeout) {
      isResettingRef.current = true;
      
      // Reset both camera position and target
      const target = getTargetPosition();
      
      gsap.to(camera.position, {
        x: defaultPosition.x,
        y: defaultPosition.y,
        z: defaultPosition.z,
        duration: deviceInfo.isMobile ? 0.8 : 1,
        ease: "power2.inOut",
        onComplete: () => {
          isResettingRef.current = false;
        }
      });

      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: deviceInfo.isMobile ? 0.8 : 1,
          ease: "power2.inOut",
          onUpdate: () => {
            controlsRef.current.update();
          }
        });
      }
    }
  });

  const handleChange = () => {
    lastInteractionRef.current = Date.now();
    isResettingRef.current = false;
  };

  return (
    <OrbitControls 
      ref={controlsRef}
      target={getTargetPosition()}
      enableZoom={!deviceInfo.isMobile} // Disable zoom on mobile to prevent conflicts
      enablePan={false}
      enableRotate={true}
      autoRotate={false}
      onChange={handleChange}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 3/4}
      minAzimuthAngle={deviceInfo.isMobile ? -Math.PI / 3 : -Math.PI / 2}
      maxAzimuthAngle={deviceInfo.isMobile ? Math.PI / 3 : Math.PI / 2}
      dampingFactor={deviceInfo.isMobile ? 0.08 : 0.05}
      rotateSpeed={deviceInfo.isMobile ? 0.8 : 0.5}
      enableDamping={true}
      // Touch-specific settings
      touches={{
        ONE: deviceInfo.isMobile ? THREE.TOUCH.ROTATE : THREE.TOUCH.ROTATE,
        TWO: deviceInfo.isMobile ? THREE.TOUCH.DOLLY_PAN : THREE.TOUCH.DOLLY_PAN
      }}
    />
  );
};

const Hero3D: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const deviceInfo = useDeviceDetection();
  
  const {
    toneMapping,
    bloom,
    chromaticAberration,
    lensDistortion,
    hdri
  } = settingsData.settings;

  useEffect(() => {
    console.log('🎬 Hero3D component mounted');
    console.log('📱 Device info:', deviceInfo);
    return () => console.log('🎬 Hero3D component unmounted');
  }, [deviceInfo]);

  const handleCreated = () => {
    console.log('✨ Canvas created for device:', deviceInfo.screenSize);
    const loadingDelay = deviceInfo.isMobile ? 300 : 500; // Faster loading on mobile
    
    setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setIsVisible(true), 100);
    }, loadingDelay);
  };

  // Responsive canvas settings
  const getCanvasSettings = () => {
    const baseSettings = {
      gl: { 
        antialias: !deviceInfo.isMobile, // Disable antialiasing on mobile for performance
        alpha: false,
        stencil: false,
        depth: true,
        powerPreference: deviceInfo.isMobile ? 'default' as const : 'high-performance' as const
      },
      camera: { 
        position: [0, 0, deviceInfo.isMobile ? 4 : 5] as [number, number, number],
        fov: deviceInfo.isMobile ? (deviceInfo.screenSize === 'small-mobile' ? 60 : 55) : 50,
        near: 0.1,
        far: 1000
      },
      dpr: deviceInfo.isMobile ? [1, 1.5] as [number, number] : [1, 2] as [number, number] // Limit pixel ratio on mobile
    };

    return baseSettings;
  };

  const canvasSettings = getCanvasSettings();

  return (
    <ErrorBoundary>
      <div className="hero-3d-container">
        {isLoading && (
          <div className="loading-screen">
            <div className="loading-text">
              {deviceInfo.isMobile ? 'Loading...' : 'Loading 3D Scene...'}
            </div>
          </div>
        )}
        
        <div className={`canvas-container ${isVisible ? 'visible' : ''}`}>
          <Canvas
            {...canvasSettings}
            onCreated={handleCreated}
          >
            <color attach="background" args={['#000000']} />
            
            {/* Responsive lighting setup */}
            <ambientLight intensity={deviceInfo.isMobile ? 0.6 : 0.5} />
            <spotLight 
              position={[10, 10, 10]} 
              angle={0.15} 
              penumbra={1} 
              intensity={deviceInfo.isMobile ? 0.8 : 1} 
              castShadow={!deviceInfo.isMobile} // Disable shadows on mobile
            />
            <spotLight 
              position={[-10, -10, -10]} 
              angle={0.15} 
              penumbra={1} 
              intensity={deviceInfo.isMobile ? 0.4 : 0.5} 
              castShadow={!deviceInfo.isMobile}
            />
            
            {/* Environment map */}
            <Environment 
              preset="studio"
              background={hdri.background && !deviceInfo.isMobile}
            />
            
            <Suspense fallback={null}>
              <ChromeObject 
                followCursor={!deviceInfo.isMobile} // Disable cursor following on mobile
                followIntensity={deviceInfo.isMobile ? 0 : 0.5} 
              />
              <ResponsiveCameraController deviceInfo={deviceInfo} />

              {/* Responsive post-processing effects */}
              <EffectComposer enabled={!deviceInfo.isMobile || deviceInfo.screenSize !== 'small-mobile'}>
                <ToneMapping 
                  mode={toneMapping.mode}
                  exposure={deviceInfo.isMobile ? toneMapping.exposure * 0.8 : toneMapping.exposure}
                  whitePoint={toneMapping.whitePoint}
                  adaptationRate={toneMapping.adaptation}
                />
                
                {/* Reduced bloom on mobile for performance */}
                <Bloom 
                  intensity={deviceInfo.isMobile ? bloom.intensity * 0.7 : bloom.intensity}
                  luminanceThreshold={deviceInfo.isMobile ? bloom.luminanceThreshold * 1.2 : bloom.luminanceThreshold}
                  luminanceSmoothing={bloom.luminanceSmoothing}
                  mipmapBlur={deviceInfo.isMobile ? false : bloom.mipmapBlur}
                />
                
                {/* Chromatic aberration - conditional */}
                {(!deviceInfo.isMobile || deviceInfo.screenSize !== 'small-mobile') ? (
                  <ChromaticAberration 
                    offset={chromaticAberration.offset}
                    blendFunction={chromaticAberration.enabled ? 1 : 0}
                  />
                ) : null}
                
                <Vignette
                  offset={deviceInfo.isMobile ? lensDistortion.vignette * 0.8 : lensDistortion.vignette}
                  darkness={deviceInfo.isMobile ? 0.3 : 0.5}
                />

                <BrightnessContrast 
                  brightness={deviceInfo.isMobile ? 0.1 : 0}
                  contrast={deviceInfo.isMobile ? 0.1 : 0}
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