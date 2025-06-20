import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ChromeObject from './ChromeObject';
import LensDistortionEffect from './LensDistortionEffect';
import type { PostProcessingSettings } from './LensDistortionEffect';
import LensDistortionControls from './LensDistortionControls';
import { ToneMappingMode } from 'postprocessing';
import './Hero3D.css';

const LENS_DISTORTION_STORAGE_KEY = 'saohouse-lens-distortion-settings';

// Set to true when you need to adjust lens distortion settings
const SHOW_LENS_DISTORTION_CONTROLS = true;

const defaultLensDistortionSettings: PostProcessingSettings = {
  lensDistortion: {
    barrelDistortion: 0.1,
    chromaticAberration: 0.005,
    vignette: 0.8,
    center: [0.5, 0.5],
  },
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
  }
};

const Hero3DLens: React.FC = () => {
  // Load saved settings from localStorage or use defaults
  const [lensSettings, setLensSettings] = useState<PostProcessingSettings>(() => {
    try {
      const saved = localStorage.getItem(LENS_DISTORTION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return {
          lensDistortion: { ...defaultLensDistortionSettings.lensDistortion, ...parsed.lensDistortion },
          toneMapping: { ...defaultLensDistortionSettings.toneMapping, ...parsed.toneMapping },
          bloom: { ...defaultLensDistortionSettings.bloom, ...parsed.bloom },
          filmGrain: { ...defaultLensDistortionSettings.filmGrain, ...parsed.filmGrain },
          ssao: { ...defaultLensDistortionSettings.ssao, ...parsed.ssao },
        };
      }
      return defaultLensDistortionSettings;
    } catch (error) {
      console.warn('Failed to load lens distortion settings from localStorage:', error);
      return defaultLensDistortionSettings;
    }
  });

  const [showControls, setShowControls] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LENS_DISTORTION_STORAGE_KEY, JSON.stringify(lensSettings));
    } catch (error) {
      console.warn('Failed to save lens distortion settings to localStorage:', error);
    }
  }, [lensSettings]);

  const handleSettingsChange = (newSettings: PostProcessingSettings) => {
    setLensSettings(newSettings);
  };

  return (
    <div className="hero-3d-container">
      {/* Development Controls - Only shown when SHOW_LENS_DISTORTION_CONTROLS is true */}
      {SHOW_LENS_DISTORTION_CONTROLS && (
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
            {showControls ? 'Hide' : 'Show'} Lens Distortion Controls
          </button>

          {showControls && (
            <LensDistortionControls 
              onSettingsChange={handleSettingsChange}
              initialSettings={lensSettings}
            />
          )}
        </>
      )}

      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
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
          antialias: false, // Let postprocessing handle antialiasing
          stencil: false,
          depth: false
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
          
          {/* Enhanced Lens Distortion Effects using gkjohnson's approach */}
          <LensDistortionEffect 
            lensDistortion={lensSettings.lensDistortion}
            toneMapping={lensSettings.toneMapping}
            bloom={lensSettings.bloom}
            filmGrain={lensSettings.filmGrain}
            ssao={lensSettings.ssao}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DLens; 