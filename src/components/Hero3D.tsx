import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ChromeObject from './ChromeObject';
import PostProcessingEffects from './ToneMappingEffect';
import type { PostProcessingSettings } from './ToneMappingEffect';
import PostProcessingControls from './ToneMappingControls';
import SettingsManager from './SettingsManager';
import { ToneMappingMode } from 'postprocessing';
import './Hero3D.css';

const POST_PROCESSING_STORAGE_KEY = 'saohouse-postprocessing-settings';
const SETTINGS_VERSION = '1.0';

// Set to true when you need to adjust post-processing settings
const SHOW_POST_PROCESSING_CONTROLS = true;

const defaultPostProcessingSettings: PostProcessingSettings = {
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
    mipmapBlur: true,
    opacity: 0.8,
  },
  chromaticAberration: {
    offset: [0.015, 0.008],
    redOffset: [0.015, 0.0],     // Red channel moves right
    greenOffset: [0.0, 0.0],     // Green channel stays centered
    blueOffset: [-0.015, 0.0],   // Blue channel moves left
    radialModulation: false,
    modulationOffset: 0.0,
    blur: 0.002,
  },
  filmGrain: {
    intensity: 0.3,
    opacity: 0.15,
  },
  ssao: {
    intensity: 0.5,
    radius: 1.0,
    bias: 0.05,
    samples: 16,
    rings: 4,
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
    focusDistance: 5.0,
    focalLength: 0.1,
    bokehScale: 3.0,
  },
  lensDistortion: {
    enabled: false,
    barrelDistortion: 0.0,
    chromaticAberration: 0.0,
    vignette: 0.0,
    center: [0.5, 0.5],
  }
};

const Hero3D: React.FC = () => {
  // Load saved settings from localStorage or use defaults
  const [postProcessingSettings, setPostProcessingSettings] = useState<PostProcessingSettings>(() => {
    try {
      const saved = localStorage.getItem(POST_PROCESSING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Check if this is a versioned settings object
        if (parsed.version === SETTINGS_VERSION && parsed.settings) {
          return parsed.settings;
        }
        
        // Handle migration from old structures
        if (parsed.mode !== undefined) {
          // Very old structure - tone mapping only
          return {
            toneMapping: parsed,
            bloom: defaultPostProcessingSettings.bloom,
            chromaticAberration: defaultPostProcessingSettings.chromaticAberration,
            filmGrain: defaultPostProcessingSettings.filmGrain,
            ssao: defaultPostProcessingSettings.ssao,
            blur: defaultPostProcessingSettings.blur,
            depthOfField: defaultPostProcessingSettings.depthOfField,
            lensDistortion: defaultPostProcessingSettings.lensDistortion,
          };
        } else if (!parsed.chromaticAberration || !parsed.filmGrain || !parsed.ssao || !parsed.blur || !parsed.depthOfField || !parsed.lensDistortion) {
          // Partial structure - missing new effects
          return {
            toneMapping: parsed.toneMapping || defaultPostProcessingSettings.toneMapping,
            bloom: parsed.bloom || defaultPostProcessingSettings.bloom,
            chromaticAberration: parsed.chromaticAberration || defaultPostProcessingSettings.chromaticAberration,
            filmGrain: parsed.filmGrain || defaultPostProcessingSettings.filmGrain,
            ssao: parsed.ssao || defaultPostProcessingSettings.ssao,
            blur: parsed.blur || defaultPostProcessingSettings.blur,
            depthOfField: parsed.depthOfField || defaultPostProcessingSettings.depthOfField,
            lensDistortion: parsed.lensDistortion || defaultPostProcessingSettings.lensDistortion,
          };
        } else if (parsed.chromaticAberration && !parsed.chromaticAberration.redOffset) {
          // Handle migration from old chromatic aberration to RGB channels
          const migratedChromaticAberration = {
            ...defaultPostProcessingSettings.chromaticAberration,
            ...parsed.chromaticAberration,
            redOffset: [parsed.chromaticAberration.offset[0] || 0.015, 0.0] as [number, number],
            greenOffset: [0.0, 0.0] as [number, number],
            blueOffset: [-(parsed.chromaticAberration.offset[0] || 0.015), 0.0] as [number, number],
          };
          
          return {
            ...parsed,
            chromaticAberration: migratedChromaticAberration,
            depthOfField: parsed.depthOfField || defaultPostProcessingSettings.depthOfField,
            lensDistortion: parsed.lensDistortion || defaultPostProcessingSettings.lensDistortion,
          };
        }
        return {
          ...parsed,
          depthOfField: parsed.depthOfField || defaultPostProcessingSettings.depthOfField,
          lensDistortion: parsed.lensDistortion || defaultPostProcessingSettings.lensDistortion,
        };
      }
      return defaultPostProcessingSettings;
    } catch (error) {
      console.warn('Failed to load post-processing settings from localStorage:', error);
      return defaultPostProcessingSettings;
    }
  });

  const [showControls, setShowControls] = useState(false);

  // Save settings to localStorage whenever they change (with version protection)
  useEffect(() => {
    try {
      const versionedSettings = {
        version: SETTINGS_VERSION,
        timestamp: new Date().toISOString(),
        settings: postProcessingSettings
      };
      localStorage.setItem(POST_PROCESSING_STORAGE_KEY, JSON.stringify(versionedSettings));
      
      // Also create an automatic backup
      const autoBackupKey = 'saohouse-settings-auto-backup';
      localStorage.setItem(autoBackupKey, JSON.stringify(versionedSettings));
    } catch (error) {
      console.warn('Failed to save post-processing settings to localStorage:', error);
    }
  }, [postProcessingSettings]);

  const handleSettingsChange = (newSettings: PostProcessingSettings) => {
    console.log('Settings changed:', newSettings); // Debug log
    setPostProcessingSettings(newSettings);
  };

  const handleSettingsLoad = (newSettings: PostProcessingSettings) => {
    console.log('Settings loaded:', newSettings); // Debug log
    
    // Force a complete state update by creating a new object
    const cleanSettings = JSON.parse(JSON.stringify(newSettings));
    setPostProcessingSettings(cleanSettings);
    
    // Force localStorage to update with the new settings immediately
    setTimeout(() => {
      const versionedSettings = {
        version: SETTINGS_VERSION,
        timestamp: new Date().toISOString(),
        settings: cleanSettings
      };
      localStorage.setItem(POST_PROCESSING_STORAGE_KEY, JSON.stringify(versionedSettings));
    }, 100);
  };

  return (
    <div className="hero-3d-container">
      {/* Settings Manager - Always available */}
      <SettingsManager 
        currentSettings={postProcessingSettings}
        onSettingsLoad={handleSettingsLoad}
      />

      {/* Development Controls - Only shown when SHOW_POST_PROCESSING_CONTROLS is true */}
      {SHOW_POST_PROCESSING_CONTROLS && (
        <>
          <button
            onClick={() => setShowControls(!showControls)}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              background: '#968065',
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
            {showControls ? 'Hide' : 'Show'} Post-Processing Controls
          </button>

          {showControls && (
            <PostProcessingControls 
              onSettingsChange={handleSettingsChange}
              initialSettings={postProcessingSettings}
            />
          )}
        </>
      )}

      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={Math.min(window.devicePixelRatio, 2)} // Handle high-DPI displays
        style={{ 
          width: '100vw', 
          height: '100vh',
          opacity: 0,
          animation: 'heroFadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards'
        }}
        gl={{ 
          toneMapping: THREE.NoToneMapping, // Disable default tone mapping to use our custom one
          outputColorSpace: THREE.SRGBColorSpace,
          // Enhanced settings for better quality
          powerPreference: "high-performance",
          antialias: true, // Enable antialias for smoother edges
          stencil: false,
          depth: true, // Enable depth buffer for proper rendering
        }}
      >
        <Suspense fallback={null}>
          <ChromeObject position={[0, 0, 0]} />
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            autoRotate={false}
            autoRotateSpeed={0}
          />
          
          {/* Enhanced Post-Processing Effects using direct pmndrs/postprocessing */}
          <PostProcessingEffects 
            toneMapping={postProcessingSettings.toneMapping}
            bloom={postProcessingSettings.bloom}
            chromaticAberration={postProcessingSettings.chromaticAberration}
            filmGrain={postProcessingSettings.filmGrain}
            ssao={postProcessingSettings.ssao}
            blur={postProcessingSettings.blur}
            depthOfField={postProcessingSettings.depthOfField}
            lensDistortion={postProcessingSettings.lensDistortion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3D; 