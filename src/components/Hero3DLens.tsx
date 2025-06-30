import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { 
  EffectComposer,
  Bloom,
  ToneMapping,
  Vignette,
  ChromaticAberration,
  BrightnessContrast,
  Noise,
  N8AO,
  FXAA
} from '@react-three/postprocessing';
import { Effect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import ChromeObject from './ChromeObject';
// import { ToneMappingMode } from 'postprocessing';
import ToneMappingControls from './ToneMappingControls';
import SettingsManager from './SettingsManager';
import CenteringGrid from './CenteringGrid';
import GridToggle from './GridToggle';
import ViewportCenterTest from './ViewportCenterTest';
// BlurInEffect removed - using material-based blur instead
import type { PostProcessingSettings } from './ToneMappingControls';
import { useSettings } from '../utils/settingsManager';
import { useMobileCameraOptimization } from '../hooks/useMobileCameraOptimization';
import { MobileCameraController } from './MobileCameraController';
import { useResponsive3D } from '../hooks/useResponsive3D';
import { useMobilePerformanceOptimization } from '../hooks/useMobilePerformanceOptimization';
import './Hero3D.css';

// Set to true when you need to adjust settings
const SHOW_CONTROLS = false; // PRODUCTION: Disabled for production deployment

// Custom Lens Distortion Effect
class LensDistortionEffect extends Effect {
  constructor(settings = { barrelDistortion: 0.0, chromaticAberration: 0.0, vignette: 0.0, center: [0.5, 0.5] }) {
    const fragmentShader = `
      uniform float barrelDistortion;
      uniform float chromaticAberration;
      uniform float vignette;
      uniform vec2 center;

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec2 centeredUV = uv - center;
        float distance = length(centeredUV);
        
        // Barrel/Pincushion distortion
        float distortionFactor = 1.0 + barrelDistortion * distance * distance;
        vec2 distortedUV = center + centeredUV * distortionFactor;
        
        // Chromatic aberration (lens distortion type)
        float aberrationIntensity = chromaticAberration * distance;
        
        // Create radial offsets based on direction from center
        vec2 direction = normalize(centeredUV);
        vec2 redOffset = direction * aberrationIntensity * 1.2;    // Red further out (longer wavelength)
        vec2 blueOffset = direction * aberrationIntensity * -0.8;  // Blue closer in (shorter wavelength)
        
        // Sample with aberration offsets
        float r = texture2D(inputBuffer, distortedUV + redOffset).r;
        float g = texture2D(inputBuffer, distortedUV).g;
        float b = texture2D(inputBuffer, distortedUV + blueOffset).b;
        
        vec3 color = vec3(r, g, b);
        
        // Vignette effect
        float vignetteAmount = 1.0 - vignette * distance * distance;
        color *= vignetteAmount;
        
        // Ensure we stay within UV bounds
        if (distortedUV.x < 0.0 || distortedUV.x > 1.0 || distortedUV.y < 0.0 || distortedUV.y > 1.0) {
          color = vec3(0.0);
        }
        
        outputColor = vec4(color, inputColor.a);
      }
    `;

    super("LensDistortion", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["barrelDistortion", new THREE.Uniform(settings.barrelDistortion)],
        ["chromaticAberration", new THREE.Uniform(settings.chromaticAberration)],
        ["vignette", new THREE.Uniform(settings.vignette)],
        ["center", new THREE.Uniform(new THREE.Vector2(settings.center[0], settings.center[1]))]
      ])
    });
  }

  get barrelDistortion() {
    return this.uniforms.get("barrelDistortion")!.value;
  }

  set barrelDistortion(value: number) {
    this.uniforms.get("barrelDistortion")!.value = value;
  }

  get chromaticAberration() {
    return this.uniforms.get("chromaticAberration")!.value;
  }

  set chromaticAberration(value: number) {
    this.uniforms.get("chromaticAberration")!.value = value;
  }

  get vignette() {
    return this.uniforms.get("vignette")!.value;
  }

  set vignette(value: number) {
    this.uniforms.get("vignette")!.value = value;
  }

  get center() {
    return this.uniforms.get("center")!.value;
  }

  set center(value: THREE.Vector2) {
    this.uniforms.get("center")!.value = value;
  }
}

// Custom component to wrap the lens distortion effect
const CustomLensDistortion: React.FC<{ settings: PostProcessingSettings['lensDistortion'] }> = ({ settings }) => {
  const effect = useMemo(() => {
    return new LensDistortionEffect({
      barrelDistortion: settings.barrelDistortion,
      chromaticAberration: settings.chromaticAberration,
      vignette: settings.vignette,
      center: settings.center,
    });
  }, []);

  // Update effect uniforms when settings change
  useEffect(() => {
    if (effect) {
      effect.barrelDistortion = settings.barrelDistortion;
      effect.chromaticAberration = settings.chromaticAberration;
      effect.vignette = settings.vignette;
      effect.center.set(settings.center[0], settings.center[1]);
      
      // Debug: Log the actual values being applied to the shader
      // PRODUCTION: Disabled debug logging
      // console.log('🔧 CustomLensDistortion values applied:', {
      //   enabled: settings.enabled,
      //   barrelDistortion: settings.barrelDistortion,
      //   chromaticAberration: settings.chromaticAberration,
      //   vignette: settings.vignette,
      //   center: settings.center
      // });
    }
  }, [effect, settings]);

  return <primitive object={effect} />;
};

// Production-Safe HDRI Animation Component with stable references and error handling
const AnimatedEnvironment: React.FC<{ 
  preset: string; 
  background: boolean; 
  enabled: boolean;
  baseRotation: number;
}> = ({ preset, background, enabled, baseRotation }) => {
  const rotationArray = useRef<[number, number, number]>([0, baseRotation, 0]);
  const [rotationState, setRotationState] = useState<[number, number, number]>([0, baseRotation, 0]);
  const [hasError, setHasError] = useState(false);

  // Ultra-smooth 60fps HDRI rotation to match cursor animation smoothness
  useFrame((state) => {
    if (enabled && !hasError) {
      try {
        const time = state.clock.getElapsedTime();
        const newRotation = baseRotation + (time * 0.08); // Slower, more elegant rotation
        
        // Update array in place to maintain reference stability
        rotationArray.current[1] = newRotation;
        
        // Update at 60fps for butter-smooth HDRI rotation matching cursor animation
        setRotationState([0, newRotation, 0]);
      } catch (error) {
        console.warn('HDRI animation error:', error);
        setHasError(true);
      }
    }
  });

  // Update base rotation when prop changes
  useEffect(() => {
    try {
      rotationArray.current[1] = baseRotation;
      setRotationState([0, baseRotation, 0]);
      setHasError(false); // Reset error state when props change
    } catch (error) {
      console.warn('HDRI rotation update error:', error);
      setHasError(true);
    }
  }, [baseRotation]);

  // Fallback to static environment if animation fails
  if (hasError) {
    return (
      <Environment 
        preset={preset as any}
        background={background}
        environmentRotation={[0, baseRotation, 0]}
      />
    );
  }

  return (
    <Environment 
      preset={preset as any}
      background={background}
      environmentRotation={rotationState}
    />
  );
};

// Even smoother easing function for ultra-stable movement
const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
};

// Custom OrbitControls with return-to-center animation
const AnimatedOrbitControls: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Default camera state - maintain consistent distance
  const defaultCameraState = {
    position: new THREE.Vector3(0, 0, 5),
    target: new THREE.Vector3(0, 0, 0),
  };
  
  // Animation state
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(0);
  const [returnAnimation, setReturnAnimation] = useState({
    isActive: false,
    startTime: 0,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    startDistance: 5,
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const currentTime = Date.now();
    
    // Check if we should start return animation with stability checks
    if (!isUserInteracting && !returnAnimation.isActive && 
        controlsRef.current && (currentTime - lastInteractionTime) > 500) { // 0.5 seconds delay
      
      // Stability check: ensure we have valid positions
      const currentPos = camera.position.clone();
      const currentTarget = controlsRef.current.target.clone();
      
      if (currentPos.length() > 0 && !currentPos.equals(defaultCameraState.position)) {
        // Calculate position maintaining current distance but moving towards default angle
        const currentDistance = Math.max(currentPos.distanceTo(currentTarget), 3); // Min distance safety
        const normalizedDefault = defaultCameraState.position.clone().normalize();
        const targetPosition = normalizedDefault.multiplyScalar(currentDistance);
        
        // Start return animation with validated values
        setReturnAnimation({
          isActive: true,
          startTime: time,
          startPosition: currentPos,
          startTarget: currentTarget,
          targetPosition: targetPosition,
          startDistance: currentDistance,
        });
        
  
      }
    }
    
    // Handle return animation with stability
    if (returnAnimation.isActive && controlsRef.current) {
      const animationDuration = 2.0; // Longer duration for ultra-smooth movement
      const elapsed = time - returnAnimation.startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      if (progress < 1) {
        // Apply ultra-smooth easing
        const easedProgress = easeInOutQuart(progress);
        
        // Calculate target position in spherical coordinates for natural movement
        const startPos = returnAnimation.startPosition.clone();
        const targetPos = returnAnimation.targetPosition.clone();
        
        // Convert to spherical coordinates for smooth angular interpolation
        const startSpherical = new THREE.Spherical().setFromVector3(startPos);
        const targetSpherical = new THREE.Spherical().setFromVector3(targetPos);
        
        // Interpolate spherical coordinates directly
        const currentSpherical = new THREE.Spherical(
          THREE.MathUtils.lerp(startSpherical.radius, targetSpherical.radius, easedProgress),
          THREE.MathUtils.lerp(startSpherical.phi, targetSpherical.phi, easedProgress),
          THREE.MathUtils.lerp(startSpherical.theta, targetSpherical.theta, easedProgress)
        );
        
        // Convert back to Cartesian coordinates
        const newPosition = new THREE.Vector3().setFromSpherical(currentSpherical);
        camera.position.copy(newPosition);
        
        // Smoothly interpolate camera target
        controlsRef.current.target.lerpVectors(
          returnAnimation.startTarget,
          defaultCameraState.target,
          easedProgress
        );
        
        // Update controls gently
        controlsRef.current.update();
      } else {
        // Animation complete - ensure exact final position with validation
        const finalDistance = Math.max(returnAnimation.startDistance, 3);
        const normalizedDefault = defaultCameraState.position.clone().normalize();
        const finalPosition = normalizedDefault.multiplyScalar(finalDistance);
        
        camera.position.copy(finalPosition);
        controlsRef.current.target.copy(defaultCameraState.target);
        controlsRef.current.update();
        setReturnAnimation(prev => ({ ...prev, isActive: false }));

      }
    }
  });

  // Handle orbit control events with debouncing for stability
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      let startTimeout: number | undefined;
      let endTimeout: number | undefined;
      
      const handleStart = () => {
        if (startTimeout) clearTimeout(startTimeout);
        if (endTimeout) clearTimeout(endTimeout);
        
        setIsUserInteracting(true);
        setLastInteractionTime(Date.now());
        // Stop any ongoing return animation smoothly
        if (returnAnimation.isActive) {
          setReturnAnimation(prev => ({ ...prev, isActive: false }));
        }
      };
      
      const handleEnd = () => {
        if (endTimeout) clearTimeout(endTimeout);
        // Debounce the end event to avoid rapid state changes
        endTimeout = window.setTimeout(() => {
          setIsUserInteracting(false);
          setLastInteractionTime(Date.now());
        }, 50); // Small delay to stabilize
      };
      
      controls.addEventListener('start', handleStart);
      controls.addEventListener('end', handleEnd);
      
      return () => {
        if (startTimeout) clearTimeout(startTimeout);
        if (endTimeout) clearTimeout(endTimeout);
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
      };
    }
  }, [returnAnimation.isActive]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={false}
      enablePan={false}
      enableRotate={true}
      autoRotate={false}
      autoRotateSpeed={0}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={8}
      rotateSpeed={0.5}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
    />
  );
};

// Component to control renderer's tone mapping exposure
const ToneMappingExposure: React.FC<{ exposure: number }> = ({ exposure }) => {
  const { gl } = useThree();
  
  useEffect(() => {
    gl.toneMappingExposure = exposure;

  }, [gl, exposure]);
  
  return null;
};

// Function to load settings from public folder
// 🎯 MODULAR SETTINGS DISCOVERY
// Automatically loads whatever settings file is in /public/importsettings
// Just drop any .json settings file in the folder and it will be auto-discovered!


interface Hero3DLensProps {
  onReady?: () => void;
}

const Hero3DLens: React.FC<Hero3DLensProps> = ({ onReady }) => {
  console.log('🚀🚀🚀 HERO3D LENS COMPONENT MOUNTING 🚀🚀🚀');
  
  // Use centralized settings manager
  const { settings, updateSettings, isLoading: isSettingsLoading } = useSettings();
  const [showControls, setShowControls] = useState(false);
  const [showCenteringGrid, setShowCenteringGrid] = useState(false); // PRODUCTION: Disabled for production deployment
  
  // Mobile camera optimization to reduce fisheye effect
  const cameraOptimization = useMobileCameraOptimization();
  
  // Responsive 3D settings for positioning work
  const responsive3D = useResponsive3D(
    undefined, // Default settings
    false      // IMPROVED: Disable mobile reload for production stability
  );
  
  // Mobile performance optimizations
  const performanceOpt = useMobilePerformanceOptimization();
  
  // Simplified loading phases - PremiumHero handles loading UI
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isMaterialsReady, setIsMaterialsReady] = useState(false);

  useEffect(() => {
    // PRODUCTION: Disabled debug logging
    // console.log('🎬 Hero3DLens: Component mounted');
    // console.log('🎛️ SHOW_CONTROLS:', SHOW_CONTROLS);
    // console.log('🌍 Environment info:', {
    //   NODE_ENV: process.env.NODE_ENV,
    //   hostname: window.location.hostname,
    //   port: window.location.port
    // });
  }, []);

  // Handle model loading completion
  const handleModelLoaded = (loaded: boolean) => {
    // PRODUCTION: Disabled debug logging
    // console.log('📦 Hero3DLens: Model loaded:', loaded);
    if (loaded && !isModelLoaded) {
      setIsModelLoaded(true);
    }
  };

  // Handle materials ready
  const handleMaterialsReady = () => {
    // PERFORMANCE: Logging disabled for optimal FPS
    // console.log('🎨 Hero3DLens: Materials ready');
    if (!isMaterialsReady) {
      setIsMaterialsReady(true);
    }
  };

  // Handle final presentation phase - notify parent when ready
  useEffect(() => {
    // PERFORMANCE: Logging disabled for optimal FPS
    // console.log('🔍 Hero3DLens: Loading state check:', {
    //   isSettingsLoading,
    //   isModelLoaded,
    //   isMaterialsReady
    // });
    
    if (!isSettingsLoading && isModelLoaded && isMaterialsReady) {
      // PERFORMANCE: Logging disabled for optimal FPS
      // console.log('🎯 Hero3DLens: All loaded, calling onReady');
      // Notify parent component that the scene is ready
      if (onReady) {
        onReady();
      }
    }
  }, [isSettingsLoading, isModelLoaded, isMaterialsReady, onReady]);

  const handleSettingsChange = (newSettings: PostProcessingSettings) => {
    updateSettings(newSettings);
  };

  const handleSettingsLoad = (newSettings: PostProcessingSettings) => {
    updateSettings(newSettings);
  };

  // Debug: Log settings when they change - PROMINENT LOGGING
  useEffect(() => {
    // PRODUCTION: Disabled prominent debug logging
    // console.log('🎨🎨🎨 POST-PROCESSING SETTINGS UPDATED 🎨🎨🎨');
    // console.log('📊 Exposure:', settings.toneMapping.exposure);
    // console.log('✨ Bloom Intensity:', settings.bloom.intensity);
    // console.log('🌈 Chromatic Aberration:', {
    //   enabled: settings.chromaticAberration.enabled,
    //   offset: settings.chromaticAberration.offset,
    //   scaledOffset: settings.chromaticAberration.enabled 
    //     ? [settings.chromaticAberration.offset[0] * 0.001, settings.chromaticAberration.offset[1] * 0.001]
    //     : [0, 0]
    // });
    // console.log('🔍 Lens Distortion:', {
    //   enabled: settings.lensDistortion.enabled,
    //   chromaticAberration: settings.lensDistortion.chromaticAberration,
    //   vignette: settings.lensDistortion.vignette
    // });
    // console.log('📺 Film Grain Opacity:', settings.filmGrain.opacity);
    // console.log('🌫️ SSAO Intensity:', settings.ssao.intensity);
    // console.log('🎨🎨🎨 END POST-PROCESSING SETTINGS 🎨🎨🎨');
  }, [settings]);

  return (
    <div className="hero-3d-container">
      {/* PRODUCTION: Disabled performance stats monitor */}
      {/* <Stats showPanel={0} className="stats-panel" /> */}
      



      {/* Development Controls - Only shown when SHOW_CONTROLS is true */}
      {SHOW_CONTROLS && (
        <>
          <button
            onClick={() => setShowControls(!showControls)}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              background: '#ff6b9d',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              zIndex: 1001,
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              opacity: showControls ? 1 : 0.7,
              transition: 'opacity 0.2s ease',
            }}
          >
            {showControls ? 'Hide' : 'Show'} Controls
          </button>

          {showControls && (
            <ToneMappingControls 
              onSettingsChange={handleSettingsChange}
              initialSettings={settings}
            />
          )}

          <SettingsManager 
            currentSettings={settings}
            onSettingsLoad={handleSettingsLoad}
          />

          {/* Centering Grid Toggle - Always visible for positioning work */}
          <GridToggle 
            onToggle={setShowCenteringGrid}
            initialVisible={showCenteringGrid}
          />
          
          {/* Quick Grid Toggle Button for easier access */}
          <button
            onClick={() => setShowCenteringGrid(!showCenteringGrid)}
            style={{
              position: 'fixed',
              top: '70px',
              left: '20px',
              background: showCenteringGrid ? '#00ff00' : '#666666',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              zIndex: 1001,
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 'bold',
              opacity: 0.9,
              transition: 'all 0.2s ease',
            }}
          >
            📐 GRID {showCenteringGrid ? 'ON' : 'OFF'}
          </button>

          {/* Device Info Display for positioning work */}
          <div style={{
            position: 'fixed',
            top: '110px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '4px',
            zIndex: 1001,
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            lineHeight: '1.4',
            opacity: 0.9,
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <div>🖥️ <strong>{responsive3D.deviceType.toUpperCase()}</strong> | 📱 <strong>{responsive3D.orientation.toUpperCase()}</strong></div>
            <div>📏 Scale: <strong>{responsive3D.scale.toFixed(4)}</strong></div>
            <div>📍 Logo Position: <strong>[{responsive3D.position[0].toFixed(2)}, {responsive3D.position[1].toFixed(2)}, {responsive3D.position[2].toFixed(2)}]</strong></div>
            <div>📐 Camera FOV: <strong>{cameraOptimization.fov}°</strong></div>
            <div style={{ marginTop: '4px', color: '#aaa', fontSize: '9px' }}>
              💡 Edit: <strong>src/hooks/useResponsive3D.ts</strong>
            </div>
          </div>

          {/* Viewport-Based Centering Test Display */}
          <ViewportCenterTest />
        </>
      )}

      {/* Canvas with enhanced quality settings for crisp rendering */}
      <Canvas
        camera={{ 
          position: cameraOptimization.position, 
          fov: cameraOptimization.fov 
        }}
        style={{ 
          width: '100vw', 
          height: '100vh',
          opacity: 1,
          pointerEvents: 'auto'
        }}
        gl={{ 
          antialias: performanceOpt.antialiasing,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: performanceOpt.antialiasing ? "high-performance" : "default",
          // Enhanced rendering settings for crisp quality
          preserveDrawingBuffer: false,
          premultipliedAlpha: false,
          logarithmicDepthBuffer: false,
        }}
        // PERFORMANCE: Mobile-optimized pixel ratio for smooth FPS with crisp visuals
        dpr={[1, performanceOpt.pixelRatioMax]} // Adaptive pixel density based on device capabilities
        onCreated={({ gl, scene }) => {
          // PERFORMANCE: Optimized shadow settings for smooth FPS
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap; // Balanced quality/performance (was PCFSoftShadowMap)
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          // Exposure is handled by the ToneMappingExposure component below
          
          // PERFORMANCE: Optimized pixel ratio for smooth FPS
          gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          
          // Scene optimizations for crisp edges
          scene.fog = null; // Remove fog for crisp edges
        }}
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
        
        {/* Animated Environment map with production fallback */}
        {settings.hdri.enabled ? (
          <AnimatedEnvironment 
            preset={settings.hdri.url || "studio"}
            background={settings.hdri.background}
            enabled={settings.hdri.enabled}
            baseRotation={settings.hdri.rotation}
          />
        ) : (
          <Environment preset="studio" background={false} />
        )}
        
        <Suspense fallback={null}>
          {/* Mobile Camera Controller - Applies optimized camera settings inside Canvas */}
          <MobileCameraController optimization={cameraOptimization} />
          
          <ToneMappingExposure exposure={settings.toneMapping.exposure} />
          

          
          <ChromeObject 
            materialSettings={settings.material} 
            onModelLoaded={handleModelLoaded}
            onMaterialsReady={handleMaterialsReady}
          />
          
          {/* PRODUCTION: Centering Grid only shown in development */}
          {SHOW_CONTROLS && (
            <CenteringGrid 
              visible={showCenteringGrid}
              gridSize={10}
              divisions={20}
              centerLineColor="#ff0000"
              gridColor="#444444"
              opacity={0.8}
            />
          )}
          
          <AnimatedOrbitControls />
          
          {/* Post-processing effects with all the cool visual effects */}
          <EffectComposer>
            <ToneMapping 
              mode={settings.toneMapping.mode}
              exposure={settings.toneMapping.exposure}
              whitePoint={settings.toneMapping.whitePoint}
              middleGrey={settings.toneMapping.middleGrey}
              adaptationRate={settings.toneMapping.adaptation}
            />
            
            <>
              {performanceOpt.enableBloom && (
                <Bloom 
                  intensity={settings.bloom.intensity * performanceOpt.bloomIntensityMultiplier}
                  luminanceThreshold={settings.bloom.luminanceThreshold * performanceOpt.bloomThresholdMultiplier}
                  luminanceSmoothing={settings.bloom.luminanceSmoothing}
                  mipmapBlur={performanceOpt.enableMipmapBlur ? settings.bloom.mipmapBlur : false}
                  opacity={settings.bloom.opacity}
                />
              )}
            </>
            
            <ChromaticAberration 
              offset={settings.chromaticAberration.enabled 
                ? [
                    settings.chromaticAberration.offset[0] * 0.001 * cameraOptimization.lensDistortionReduction.chromaticAberrationMultiplier,
                    settings.chromaticAberration.offset[1] * 0.001 * cameraOptimization.lensDistortionReduction.chromaticAberrationMultiplier
                  ]
                : [0, 0]
              }
            />
            
            {/* Custom Lens Distortion - Mobile-optimized to reduce fisheye effect */}
            <CustomLensDistortion 
              key={`lens-${settings.lensDistortion.enabled}-${settings.lensDistortion.chromaticAberration}-${settings.lensDistortion.vignette}`}
              settings={settings.lensDistortion.enabled ? {
                enabled: settings.lensDistortion.enabled,
                barrelDistortion: settings.lensDistortion.barrelDistortion + cameraOptimization.lensDistortionReduction.barrelDistortionAdjustment,
                chromaticAberration: settings.lensDistortion.chromaticAberration * cameraOptimization.lensDistortionReduction.chromaticAberrationMultiplier,
                vignette: settings.lensDistortion.vignette * cameraOptimization.lensDistortionReduction.vignetteMultiplier,
                center: settings.lensDistortion.center
              } : {
                enabled: false,
                barrelDistortion: 0.0,
                chromaticAberration: 0.0,
                vignette: 0.0,
                center: [0.5, 0.5]
              }} 
            />
            
            <Vignette
              offset={settings.lensDistortion.vignette * cameraOptimization.lensDistortionReduction.vignetteMultiplier}
              darkness={0.5}
            />

            <BrightnessContrast
              brightness={0}
              contrast={0.1}
            />

            <Noise
              opacity={settings.filmGrain.opacity * performanceOpt.noiseOpacityMultiplier}
            />

            {/* Mobile-optimized N8AO - Performance-based conditional rendering */}
            <>
              {performanceOpt.enableN8AO && (
                <N8AO
                  aoRadius={settings.ssao.radius * performanceOpt.ssaoRadiusMultiplier}
                  intensity={settings.ssao.intensity * performanceOpt.ssaoIntensityMultiplier}
                  distanceFalloff={settings.ssao.distanceFalloff}
                  denoiseRadius={12 * performanceOpt.ssaoDenoiseRadiusMultiplier}
                />
              )}
            </>

            {/* Mobile-optimized FXAA - Performance-based conditional rendering */}
            <>
              {performanceOpt.enableFXAA && <FXAA />}
            </>
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DLens; 