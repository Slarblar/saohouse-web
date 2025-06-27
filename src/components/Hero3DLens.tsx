import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import { 
  EffectComposer,
  Bloom,
  ToneMapping,
  Vignette,
  ChromaticAberration
} from '@react-three/postprocessing';
import { Effect, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import ChromeObject from './ChromeObject';
import { ToneMappingMode } from 'postprocessing';
import ToneMappingControls from './ToneMappingControls';
import SettingsManager from './SettingsManager';
// BlurInEffect removed - using material-based blur instead
import type { PostProcessingSettings } from './ToneMappingControls';
import './Hero3D.css';

const SETTINGS_STORAGE_KEY = 'saohouse-settings';

// Set to true when you need to adjust settings
const SHOW_CONTROLS = true;

const defaultSettings: PostProcessingSettings = {
  toneMapping: {
    mode: ToneMappingMode.ACES_FILMIC,
    exposure: 1.2,
    whitePoint: 16.0,
    middleGrey: 0.6,
    adaptation: 1.0,
  },
  bloom: {
    intensity: 0.8,
    luminanceThreshold: 0.85,
    luminanceSmoothing: 0.4,
    mipmapBlur: false,
    opacity: 0.8,
  },
  chromaticAberration: {
    enabled: false,
    offset: [0.0, 0.0],
    redOffset: [0.0, 0.0],
    greenOffset: [0.0, 0.0],
    blueOffset: [0.0, 0.0],
    radialModulation: false,
    modulationOffset: 0.0,
    blur: 0.0,
    intensity: 1.0,
    radialIntensity: 1.0,
  },
  filmGrain: {
    intensity: 0.15,
    opacity: 0.1,
  },
  ssao: {
    intensity: 0.3,
    radius: 0.8,
    bias: 0.05,
    samples: 8,
    rings: 3,
    distanceThreshold: 1.0,
    distanceFalloff: 0.5,
  },
  blur: {
    enabled: false,
    intensity: 0.5,
    kernelSize: 35.5,
    iterations: 1,
  },
  depthOfField: {
    enabled: false,
    focusDistance: 10.0,
    focalLength: 50.0,
    bokehScale: 1.0,
  },
  lensDistortion: {
    enabled: false,
    barrelDistortion: 0.0,
    chromaticAberration: 0.0,
    vignette: 0.0,
    center: [0.5, 0.5],
  },
  motionBlur: {
    intensity: 1.0,
    velocityScale: 1.0,
    samples: 8,
    enabled: false,
  },
  hdri: {
    enabled: true,
    url: 'studio',
    intensity: 2.0,
    rotation: 0,
    background: false
  },
  godRays: {
    enabled: false,
    density: 0.96,
    decay: 0.9,
    weight: 0.4,
    exposure: 0.6,
    intensity: 1.0,
  },
  material: {
    roughness: 0.01,
    metalness: 1.0,
    reflectivity: 1.0,
    envMapIntensity: 4.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    ior: 2.4,
    color: '#cccccc',
    toneMapped: true,
  },
};

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
    }
  }, [effect, settings]);

  return <primitive object={effect} />;
};

// Optimized 60fps HDRI Animation Component with smooth interpolation
const AnimatedEnvironment: React.FC<{ 
  preset: string; 
  background: boolean; 
  enabled: boolean;
  baseRotation: number;
}> = ({ preset, background, enabled, baseRotation }) => {
  const rotationRef = useRef(baseRotation);
  const [environmentRotation, setEnvironmentRotation] = useState([0, baseRotation, 0]);
  const lastUpdateTime = useRef(0);

  useFrame((state) => {
    if (enabled) {
      // Calculate rotation at 60fps with optimized updates
      const time = state.clock.getElapsedTime();
      const newRotation = baseRotation + (time * 0.08); // Slower, more elegant rotation
      
      // Only update React state at 30fps to maintain smoothness without over-rendering
      if (time - lastUpdateTime.current > 1/30) { // 30fps updates for React
        rotationRef.current = newRotation;
        setEnvironmentRotation([0, newRotation, 0]);
        lastUpdateTime.current = time;
      }
    }
  });

  return (
    <Environment 
      preset={preset as any}
      background={background}
      environmentRotation={environmentRotation as [number, number, number]}
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
const discoverAndLoadSettings = async (): Promise<PostProcessingSettings> => {
  try {
    // Generate smart file patterns based on current date and common naming conventions
    const generateFilePatterns = (): string[] => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yDay = String(yesterday.getDate()).padStart(2, '0');
      const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
      
      return [
        // TODAY's patterns (highest priority)
        `saohouse-settings-${year}-${month}-${day} (3).json`,
        `saohouse-settings-${year}-${month}-${day} (2).json`, 
        `saohouse-settings-${year}-${month}-${day} (1).json`,
        `saohouse-settings-${year}-${month}-${day}.json`,
        
        // YESTERDAY's patterns (second priority)
        `saohouse-settings-${year}-${yMonth}-${yDay} (3).json`,
        `saohouse-settings-${year}-${yMonth}-${yDay} (2).json`,
        `saohouse-settings-${year}-${yMonth}-${yDay} (1).json`,
        `saohouse-settings-${year}-${yMonth}-${yDay}.json`,
        
        // Recent weeks (third priority)
        'saohouse-settings-2025-06-27 (1).json',
        'saohouse-settings-2025-06-26 (1).json',
        'saohouse-settings-2025-06-25 (1).json',
        'saohouse-settings-2025-06-24 (2).json',
        'saohouse-settings-2025-06-24 (1).json',
        'saohouse-settings-2025-06-23 (1).json',
        
        // Generic/fallback patterns (lowest priority)
        'latest.json',
        'current.json', 
        'settings.json',
        'saohouse-settings.json',
        'latest-settings.json',
        'current-settings.json',
        'production.json',
        'config.json'
      ];
    };

    const potentialFiles = generateFilePatterns();
    console.log('🔍 Auto-discovering settings in /public/importsettings...');
    console.log(`📁 Checking ${potentialFiles.length} potential file patterns...`);
    
    // Try each potential file until we find one that works
    for (const filename of potentialFiles) {
      try {
        const response = await fetch(`/importsettings/${filename}`);
        if (response.ok) {
          const data = await response.json();
          
          // Validate that it's actually a settings file
          if (data && (data.settings || data.toneMapping || data.material)) {
            console.log(`✅ Found and loaded settings: ${filename}`);
            console.log(`📊 Settings timestamp: ${data.timestamp || 'Unknown'}`);
            
            // Extract settings from the JSON structure and merge with defaults
            const importedSettings = data.settings || data;
            return {
              ...defaultSettings,
              ...importedSettings,
              toneMapping: { ...defaultSettings.toneMapping, ...importedSettings.toneMapping },
              bloom: { ...defaultSettings.bloom, ...importedSettings.bloom },
              chromaticAberration: { ...defaultSettings.chromaticAberration, ...importedSettings.chromaticAberration },
              filmGrain: { ...defaultSettings.filmGrain, ...importedSettings.filmGrain },
              ssao: { ...defaultSettings.ssao, ...importedSettings.ssao },
              blur: { ...defaultSettings.blur, ...importedSettings.blur },
              depthOfField: { ...defaultSettings.depthOfField, ...importedSettings.depthOfField },
              lensDistortion: { ...defaultSettings.lensDistortion, ...importedSettings.lensDistortion },
              motionBlur: { ...defaultSettings.motionBlur, ...importedSettings.motionBlur },
              hdri: { ...defaultSettings.hdri, ...importedSettings.hdri },
              godRays: { ...defaultSettings.godRays, ...importedSettings.godRays },
              material: { ...defaultSettings.material, ...importedSettings.material },
            };
          }
        }
      } catch (fileError) {
        // Continue to next file - this is expected for missing files
        continue;
      }
    }
    
    throw new Error('No valid settings files found in /public/importsettings/');
    
  } catch (error) {
    console.warn('⚠️ Failed to auto-discover settings, falling back to localStorage or defaults:', error);
    
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📱 Loaded settings from localStorage fallback');
        return {
          ...defaultSettings,
          ...parsed,
          toneMapping: { ...defaultSettings.toneMapping, ...parsed.toneMapping },
          bloom: { ...defaultSettings.bloom, ...parsed.bloom },
          chromaticAberration: { ...defaultSettings.chromaticAberration, ...parsed.chromaticAberration },
          filmGrain: { ...defaultSettings.filmGrain, ...parsed.filmGrain },
          ssao: { ...defaultSettings.ssao, ...parsed.ssao },
          blur: { ...defaultSettings.blur, ...parsed.blur },
          depthOfField: { ...defaultSettings.depthOfField, ...parsed.depthOfField },
          lensDistortion: { ...defaultSettings.lensDistortion, ...parsed.lensDistortion },
          motionBlur: { ...defaultSettings.motionBlur, ...parsed.motionBlur },
          hdri: { ...defaultSettings.hdri, ...parsed.hdri },
          godRays: { ...defaultSettings.godRays, ...parsed.godRays },
          material: { ...defaultSettings.material, ...parsed.material },
        };
      }
      console.log('🔧 Using default settings (no saved settings found)');
      return defaultSettings;
    } catch (localStorageError) {
      console.warn('❌ Failed to load settings from localStorage:', localStorageError);
      console.log('🔧 Using default settings (localStorage failed)');
      return defaultSettings;
    }
  }
};

interface Hero3DLensProps {
  onReady?: () => void;
}

const Hero3DLens: React.FC<Hero3DLensProps> = ({ onReady }) => {
  // Load settings with priority: public folder > localStorage > defaults
  const [settings, setSettings] = useState<PostProcessingSettings>(defaultSettings);
  const [showControls, setShowControls] = useState(false);
  

  
  // Simplified loading phases - PremiumHero handles loading UI
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isMaterialsReady, setIsMaterialsReady] = useState(false);

  useEffect(() => {
    console.log('🎬 Hero3DLens: Component mounted');
  }, []);

  // Load settings with auto-discovery
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await discoverAndLoadSettings();
        setSettings(loadedSettings);
        setIsSettingsLoaded(true);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setIsSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (isSettingsLoaded) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
      }
    }
  }, [settings, isSettingsLoaded]);

  // Handle model loading completion
  const handleModelLoaded = (loaded: boolean) => {
    // PERFORMANCE: Logging disabled for optimal FPS
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
    //   isSettingsLoaded,
    //   isModelLoaded,
    //   isMaterialsReady
    // });
    
    if (isSettingsLoaded && isModelLoaded && isMaterialsReady) {
      // PERFORMANCE: Logging disabled for optimal FPS
      // console.log('🎯 Hero3DLens: All loaded, calling onReady');
      // Notify parent component that the scene is ready
      if (onReady) {
        onReady();
      }
    }
  }, [isSettingsLoaded, isModelLoaded, isMaterialsReady, onReady]);

  const handleSettingsChange = (newSettings: PostProcessingSettings) => {
    setSettings(newSettings);
  };

  const handleSettingsLoad = (newSettings: PostProcessingSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="hero-3d-container">
      <Stats showPanel={0} className="stats-panel" />
      



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
        </>
      )}

      {/* Canvas with enhanced quality settings for crisp rendering */}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        style={{ 
          width: '100vw', 
          height: '100vh',
          opacity: 1,
          pointerEvents: 'auto'
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          // Enhanced rendering settings for crisp quality
          preserveDrawingBuffer: false,
          premultipliedAlpha: false,
          logarithmicDepthBuffer: false,
        }}
        // PERFORMANCE: Optimized pixel ratio for smooth FPS with crisp visuals
        dpr={[1, 2]} // Range from 1x to 2x pixel density (3x was causing FPS drops)
        onCreated={({ gl, scene }) => {
          // PERFORMANCE: Optimized shadow settings for smooth FPS
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap; // Balanced quality/performance (was PCFSoftShadowMap)
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          
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
        
        {/* Animated Environment map */}
        <AnimatedEnvironment 
          preset={settings.hdri.enabled && settings.hdri.url ? settings.hdri.url : "studio"}
          background={settings.hdri.background}
          enabled={settings.hdri.enabled}
          baseRotation={settings.hdri.rotation}
        />
        
        <Suspense fallback={null}>
          <ToneMappingExposure exposure={settings.toneMapping.exposure} />
          

          
          <ChromeObject 
            materialSettings={settings.material} 
            followCursor={true}
            enableCursorFollowing={true}
            startPresentation={true}
            onModelLoaded={handleModelLoaded}
            onMaterialsReady={handleMaterialsReady}
          />
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
            
            <Bloom 
              intensity={settings.bloom.intensity}
              luminanceThreshold={settings.bloom.luminanceThreshold}
              luminanceSmoothing={settings.bloom.luminanceSmoothing}
              mipmapBlur={settings.bloom.mipmapBlur}
              opacity={settings.bloom.opacity}
            />
            
            <ChromaticAberration 
              offset={[settings.chromaticAberration.offset[0] * 0.002, settings.chromaticAberration.offset[1] * 0.002]}
            />
            
            <CustomLensDistortion settings={settings.lensDistortion} />
            
            <Vignette
              offset={settings.lensDistortion.vignette}
              darkness={0.5}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DLens; 