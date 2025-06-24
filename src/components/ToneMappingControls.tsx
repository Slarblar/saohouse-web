import React, { useState, useEffect } from 'react';
import { ToneMappingMode } from 'postprocessing';

interface PostProcessingControlsProps {
  onSettingsChange: (settings: PostProcessingSettings) => void;
  initialSettings?: PostProcessingSettings;
}

export interface ToneMappingSettings {
  mode: ToneMappingMode;
  exposure: number;
  whitePoint: number;
  middleGrey: number;
  adaptation: number;
}

export interface BloomSettings {
  intensity: number;
  luminanceThreshold: number;
  luminanceSmoothing: number;
  mipmapBlur: boolean;
  opacity: number;
}

export interface ChromaticAberrationSettings {
  enabled: boolean;
  offset: [number, number];
  redOffset: [number, number];
  greenOffset: [number, number];
  blueOffset: [number, number];
  radialModulation: boolean;
  modulationOffset: number;
  blur: number;
  intensity: number;
  radialIntensity: number;
}

export interface FilmGrainSettings {
  intensity: number;
  opacity: number;
}

export interface SSAOSettings {
  intensity: number;
  radius: number;
  bias: number;
  samples: number;
  rings: number;
  distanceThreshold: number;
  distanceFalloff: number;
}

export interface BlurSettings {
  enabled: boolean;
  intensity: number;
  kernelSize: number;
  iterations: number;
}

export interface DepthOfFieldSettings {
  enabled: boolean;
  focusDistance: number;
  focalLength: number;
  bokehScale: number;
}

export interface MotionBlurSettings {
  intensity: number;
  velocityScale: number;
  samples: number;
  enabled: boolean;
}

export interface LensDistortionSettings {
  barrelDistortion: number;
  chromaticAberration: number;
  vignette: number;
  center: [number, number];
  enabled: boolean;
}

export interface HDRISettings {
  enabled: boolean;
  url: string | null;
  intensity: number;
  rotation: number;
  background: boolean;
}

export interface GodRaysSettings {
  enabled: boolean;
  density: number;
  decay: number;
  weight: number;
  exposure: number;
  intensity: number;
}

export interface MaterialSettings {
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

export interface PostProcessingSettings {
  toneMapping: ToneMappingSettings;
  bloom: BloomSettings;
  chromaticAberration: ChromaticAberrationSettings;
  filmGrain: FilmGrainSettings;
  ssao: SSAOSettings;
  blur: BlurSettings;
  depthOfField: DepthOfFieldSettings;
  lensDistortion: LensDistortionSettings;
  motionBlur: MotionBlurSettings;
  hdri: HDRISettings;
  godRays: GodRaysSettings;
  material: MaterialSettings;
}

const PostProcessingControls: React.FC<PostProcessingControlsProps> = ({ 
  onSettingsChange,
  initialSettings
}) => {
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
      mipmapBlur: true,
      opacity: 0.8,
    },
    chromaticAberration: {
      enabled: false,
      offset: [0.0, 0.0],
      redOffset: [0.0, 0.0],       // Red channel at center
      greenOffset: [0.0, 0.0],     // Green channel at center  
      blueOffset: [0.0, 0.0],      // Blue channel at center
      radialModulation: false,
      modulationOffset: 0.0,
      blur: 0.0,
      intensity: 1.0,
      radialIntensity: 1.0,
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
      enabled: false,
      url: null,
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

  const [settings, setSettings] = useState<PostProcessingSettings>(() => {
    if (initialSettings) {
      // Merge with defaults to ensure all properties exist
      return {
        toneMapping: { ...defaultSettings.toneMapping, ...initialSettings.toneMapping },
        bloom: { ...defaultSettings.bloom, ...initialSettings.bloom },
        chromaticAberration: { ...defaultSettings.chromaticAberration, ...initialSettings.chromaticAberration },
        filmGrain: { ...defaultSettings.filmGrain, ...initialSettings.filmGrain },
        ssao: { ...defaultSettings.ssao, ...initialSettings.ssao },
        blur: { ...defaultSettings.blur, ...initialSettings.blur },
        depthOfField: { ...defaultSettings.depthOfField, ...initialSettings.depthOfField },
        lensDistortion: { ...defaultSettings.lensDistortion, ...initialSettings.lensDistortion },
        motionBlur: { ...defaultSettings.motionBlur, ...initialSettings.motionBlur },
        hdri: { ...defaultSettings.hdri, ...initialSettings.hdri },
        godRays: { ...defaultSettings.godRays, ...initialSettings.godRays },
        material: { ...defaultSettings.material, ...initialSettings.material },
      };
    }
    return defaultSettings;
  });

  // Update local settings when initial settings change (when component mounts)
  useEffect(() => {
    if (initialSettings) {
      // Merge with defaults to ensure all properties exist
      setSettings({
        toneMapping: { ...defaultSettings.toneMapping, ...initialSettings.toneMapping },
        bloom: { ...defaultSettings.bloom, ...initialSettings.bloom },
        chromaticAberration: { ...defaultSettings.chromaticAberration, ...initialSettings.chromaticAberration },
        filmGrain: { ...defaultSettings.filmGrain, ...initialSettings.filmGrain },
        ssao: { ...defaultSettings.ssao, ...initialSettings.ssao },
        blur: { ...defaultSettings.blur, ...initialSettings.blur },
        depthOfField: { ...defaultSettings.depthOfField, ...initialSettings.depthOfField },
        lensDistortion: { ...defaultSettings.lensDistortion, ...initialSettings.lensDistortion },
        motionBlur: { ...defaultSettings.motionBlur, ...initialSettings.motionBlur },
        hdri: { ...defaultSettings.hdri, ...initialSettings.hdri },
        godRays: { ...defaultSettings.godRays, ...initialSettings.godRays },
        material: { ...defaultSettings.material, ...initialSettings.material },
      });
    }
  }, [initialSettings]);

  const updateToneMappingSettings = (newSettings: Partial<ToneMappingSettings>) => {
    const updated = { 
      ...settings, 
      toneMapping: { ...settings.toneMapping, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateBloomSettings = (newSettings: Partial<BloomSettings>) => {
    const updated = { 
      ...settings, 
      bloom: { ...settings.bloom, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateChromaticAberrationSettings = (newSettings: Partial<ChromaticAberrationSettings>) => {
    const updated = { 
      ...settings, 
      chromaticAberration: { ...settings.chromaticAberration, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateFilmGrainSettings = (newSettings: Partial<FilmGrainSettings>) => {
    const updated = { 
      ...settings, 
      filmGrain: { ...settings.filmGrain, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateSSAOSettings = (newSettings: Partial<SSAOSettings>) => {
    const updated = { 
      ...settings, 
      ssao: { ...settings.ssao, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateBlurSettings = (newSettings: Partial<BlurSettings>) => {
    const updated = { 
      ...settings, 
      blur: { ...settings.blur, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateDepthOfFieldSettings = (newSettings: Partial<DepthOfFieldSettings>) => {
    const updated = { 
      ...settings, 
      depthOfField: { ...settings.depthOfField, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateLensDistortionSettings = (newSettings: Partial<LensDistortionSettings>) => {
    const updated = { 
      ...settings, 
      lensDistortion: { ...settings.lensDistortion, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateHDRI = (newSettings: Partial<HDRISettings>) => {
    const updated = { 
      ...settings, 
      hdri: { ...settings.hdri, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateGodRays = (newSettings: Partial<GodRaysSettings>) => {
    const updated = { 
      ...settings, 
      godRays: { ...settings.godRays, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateMaterial = (newSettings: Partial<MaterialSettings>) => {
    const updated = { 
      ...settings, 
      material: { ...settings.material, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const toneMappingModes = [
    { value: ToneMappingMode.LINEAR, label: 'Linear' },
    { value: ToneMappingMode.REINHARD, label: 'Reinhard' },
    { value: ToneMappingMode.REINHARD2, label: 'Reinhard2' },
    { value: ToneMappingMode.REINHARD2_ADAPTIVE, label: 'Reinhard2 Adaptive' },
    { value: ToneMappingMode.OPTIMIZED_CINEON, label: 'Optimized Cineon' },
    { value: ToneMappingMode.ACES_FILMIC, label: 'ACES Filmic' },
  ];

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  const handleHDRIUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type - only allow proper HDRI formats
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const validHDRIExtensions = ['hdr', 'exr', 'hdri'];
      
      if (!validHDRIExtensions.includes(fileExtension || '')) {
        alert('Please upload a proper HDRI file (.hdr, .exr, .hdri only). Regular images are not supported.');
        return;
      }

      // Additional file size check (HDRI files are typically larger)
      if (file.size < 1024 * 100) { // Less than 100KB is suspicious for HDRI
        if (!confirm('This file seems very small for an HDRI. Are you sure it\'s a proper HDRI file?')) {
          return;
        }
      }

      try {
        // Create object URL for the file
        const url = URL.createObjectURL(file);
        updateHDRI({ url, enabled: true });
        
        // Clean up the URL after a delay to prevent memory leaks
        setTimeout(() => {
          // URL.revokeObjectURL(url); // Keep commented to maintain file access
        }, 100);
      } catch (error) {
        console.error('Error creating HDRI file URL:', error);
        alert('Error loading HDRI file. Please try a different file.');
      }
    }
  };

  const presetHDRIs = [
    { name: 'None', url: null },
    { name: 'City', url: 'city' },
    { name: 'Forest', url: 'forest' },
    { name: 'Studio', url: 'studio' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      borderRadius: '8px',
      color: 'white',
      minWidth: '300px',
      maxHeight: '90vh',
      overflowY: 'auto',
      zIndex: 1000,
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      animation: 'slideInFromRight 0.3s ease-out',
    }}>
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
      
      <h3 style={{ margin: '0 0 20px 0', color: '#968065' }}>
        Post-Processing Controls
        <span style={{ fontSize: '10px', color: '#888', marginLeft: '8px' }}>
          (Settings Auto-Saved)
        </span>
      </h3>

      {/* Quick Blur Debug Section */}
      <div style={{ 
        marginBottom: '25px', 
        padding: '15px', 
        background: 'rgba(255, 0, 0, 0.1)', 
        border: '1px solid rgba(255, 0, 0, 0.3)',
        borderRadius: '8px' 
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#ff4444', fontSize: '16px' }}>🚨 Blur Debug</h4>
        
        <div style={{ marginBottom: '15px', fontSize: '12px', color: '#ffaaaa' }}>
          Current Blur Status:
          <br />• Instagram Blur: {settings.blur?.enabled ? '✅ ENABLED' : '❌ Disabled'}
          <br />• Chromatic Aberration Blur: {(settings.chromaticAberration?.blur || 0) > 0 ? `✅ ${(settings.chromaticAberration?.blur || 0).toFixed(3)}` : '❌ 0.000'}
          <br />• Bloom Mipmap Blur: {settings.bloom?.mipmapBlur ? '✅ ENABLED' : '❌ Disabled'}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <button
            onClick={() => {
              const updated = {
                ...settings,
                blur: { ...settings.blur, enabled: !settings.blur?.enabled }
              };
              setSettings(updated);
              onSettingsChange(updated);
            }}
            style={{
              padding: '6px',
              background: settings.blur?.enabled ? '#22c55e' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            📱 Toggle Instagram
          </button>
          
          <button
            onClick={() => {
              const updated = {
                ...settings,
                bloom: { ...settings.bloom, mipmapBlur: !settings.bloom?.mipmapBlur }
              };
              setSettings(updated);
              onSettingsChange(updated);
            }}
            style={{
              padding: '6px',
              background: settings.bloom?.mipmapBlur ? '#22c55e' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            🌟 Toggle Bloom
          </button>
        </div>
        
        <button
          onClick={() => {
            const updated = {
              ...settings,
              blur: { ...settings.blur, enabled: false },
              chromaticAberration: { ...settings.chromaticAberration, blur: 0 },
              bloom: { ...settings.bloom, mipmapBlur: false }
            };
            setSettings(updated);
            onSettingsChange(updated);
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🚫 DISABLE ALL BLUR EFFECTS
        </button>
      </div>

      {/* Chromatic Aberration Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#ff6b9d', fontSize: '16px' }}>🌈 RGB Chromatic Aberration</h4>
        
        {/* Enable/Disable Toggle */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: '#555', 
            fontSize: '11px',
            cursor: 'pointer',
            gap: '8px'
          }}>
            <input
              type="checkbox"
              checked={settings.chromaticAberration?.enabled || false}
              onChange={(e) => updateChromaticAberrationSettings({ enabled: e.target.checked })}
              style={{ marginRight: '0px' }}
            />
            Enable Chromatic Aberration
          </label>
          <button
            onClick={() => updateChromaticAberrationSettings({
              enabled: true,
              redOffset: [0.006, 0.006],      // Red offset radially outward
              greenOffset: [0.0, 0.0],        // Green stays centered
              blueOffset: [-0.006, -0.006],   // Blue offset radially inward
              blur: 0.001,
              intensity: 1.0,
              radialIntensity: 2.0,
            })}
            style={{
              marginTop: '5px',
              padding: '4px 8px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            ✨ Set Radial Preset
          </button>
        </div>

        {/* Reset to Zero Button */}
        <button
          onClick={() => updateChromaticAberrationSettings({ 
            redOffset: [0.0, 0.0],
            greenOffset: [0.0, 0.0],
            blueOffset: [0.0, 0.0],
            blur: 0.0
          })}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '15px',
            backgroundColor: '#333',
            color: '#ff6b9d',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🎯 RESET ALL TO ZERO
        </button>

        {settings.chromaticAberration?.enabled && (
          <>
        {/* Red Channel */}
        <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255, 0, 0, 0.1)', borderRadius: '5px' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#ff4444' }}>🔴 Red Channel</h5>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Red X: {(settings.chromaticAberration?.redOffset?.[0] || 0).toFixed(3)}
            </label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.001"
              value={settings.chromaticAberration?.redOffset?.[0] || 0}
              onChange={(e) => updateChromaticAberrationSettings({ 
                redOffset: [parseFloat(e.target.value), settings.chromaticAberration?.redOffset?.[1] || 0] 
              })}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Red Y: {(settings.chromaticAberration?.redOffset?.[1] || 0).toFixed(3)}
            </label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.001"
              value={settings.chromaticAberration?.redOffset?.[1] || 0}
              onChange={(e) => updateChromaticAberrationSettings({ 
                redOffset: [settings.chromaticAberration?.redOffset?.[0] || 0, parseFloat(e.target.value)] 
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Green Channel */}
        <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(0, 255, 0, 0.1)', borderRadius: '5px' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#44ff44' }}>🟢 Green Channel</h5>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Green X: {(settings.chromaticAberration?.greenOffset?.[0] || 0).toFixed(3)}
            </label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.001"
              value={settings.chromaticAberration?.greenOffset?.[0] || 0}
              onChange={(e) => updateChromaticAberrationSettings({ 
                greenOffset: [parseFloat(e.target.value), settings.chromaticAberration?.greenOffset?.[1] || 0] 
              })}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Green Y: {(settings.chromaticAberration?.greenOffset?.[1] || 0).toFixed(3)}
            </label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.001"
              value={settings.chromaticAberration?.greenOffset?.[1] || 0}
              onChange={(e) => updateChromaticAberrationSettings({ 
                greenOffset: [settings.chromaticAberration?.greenOffset?.[0] || 0, parseFloat(e.target.value)] 
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Blue Channel */}
        <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(0, 0, 255, 0.1)', borderRadius: '5px' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#4444ff' }}>🔵 Blue Channel</h5>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Blue X: {(settings.chromaticAberration?.blueOffset?.[0] || 0).toFixed(3)}
            </label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.001"
              value={settings.chromaticAberration?.blueOffset?.[0] || 0}
              onChange={(e) => updateChromaticAberrationSettings({ 
                blueOffset: [parseFloat(e.target.value), settings.chromaticAberration?.blueOffset?.[1] || 0] 
              })}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Blue Y: {(settings.chromaticAberration?.blueOffset?.[1] || 0).toFixed(3)}
            </label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.001"
              value={settings.chromaticAberration?.blueOffset?.[1] || 0}
              onChange={(e) => updateChromaticAberrationSettings({ 
                blueOffset: [settings.chromaticAberration?.blueOffset?.[0] || 0, parseFloat(e.target.value)] 
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Blur Amount: {(settings.chromaticAberration?.blur || 0).toFixed(3)}
          </label>
          <input
            type="range"
            min="0.0"
            max="0.01"
            step="0.0001"
            value={settings.chromaticAberration?.blur || 0}
            onChange={(e) => updateChromaticAberrationSettings({ blur: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
          </>
        )}
      </div>

      {/* Film Grain Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#c4a47c', fontSize: '16px' }}>🎞️ Film Grain</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Intensity: {(settings.filmGrain?.intensity || 0.3).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.filmGrain?.intensity || 0.3}
            onChange={(e) => updateFilmGrainSettings({ intensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Opacity: {(settings.filmGrain?.opacity || 0.15).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="0.5"
            step="0.01"
            value={settings.filmGrain?.opacity || 0.15}
            onChange={(e) => updateFilmGrainSettings({ opacity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Blur Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#9b59b6', fontSize: '16px' }}>📱 Instagram Blur</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.blur?.enabled || false}
              onChange={(e) => updateBlurSettings({ enabled: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Enable Blur Effect
          </label>
        </div>

        {settings.blur?.enabled && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Intensity: {(settings.blur?.intensity || 0.5).toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={settings.blur?.intensity || 0.5}
                onChange={(e) => updateBlurSettings({ intensity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Kernel Size: {(settings.blur?.kernelSize || 35.5).toFixed(1)}
              </label>
              <input
                type="range"
                min="3"
                max="101"
                step="0.5"
                value={settings.blur?.kernelSize || 35.5}
                onChange={(e) => updateBlurSettings({ kernelSize: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Iterations: {settings.blur?.iterations || 1}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={settings.blur?.iterations || 1}
                onChange={(e) => updateBlurSettings({ iterations: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Bloom Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#b87333', fontSize: '16px' }}>🌟 Bloom Effect</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Intensity: {(settings.bloom?.intensity || 0.8).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="3.0"
            step="0.1"
            value={settings.bloom?.intensity || 0.8}
            onChange={(e) => updateBloomSettings({ intensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Threshold: {(settings.bloom?.luminanceThreshold || 0.85).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.bloom?.luminanceThreshold || 0.85}
            onChange={(e) => updateBloomSettings({ luminanceThreshold: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Smoothing: {(settings.bloom?.luminanceSmoothing || 0.4).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.bloom?.luminanceSmoothing || 0.4}
            onChange={(e) => updateBloomSettings({ luminanceSmoothing: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Opacity: {(settings.bloom?.opacity || 0.8).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.bloom?.opacity || 0.8}
            onChange={(e) => updateBloomSettings({ opacity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.bloom?.mipmapBlur || true}
              onChange={(e) => updateBloomSettings({ mipmapBlur: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Enable Mipmap Blur
          </label>
        </div>
      </div>

      {/* SSAO Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#6b73ff', fontSize: '16px' }}>🌑 SSAO (Ambient Occlusion)</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Intensity: {(settings.ssao?.intensity || 0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.ssao?.intensity || 0}
            onChange={(e) => updateSSAOSettings({ intensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Radius: {(settings.ssao?.radius || 0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={settings.ssao?.radius || 1.0}
            onChange={(e) => updateSSAOSettings({ radius: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Bias: {(settings.ssao?.bias || 0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.ssao?.bias || 0}
            onChange={(e) => updateSSAOSettings({ bias: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Samples: {settings.ssao?.samples || 16}
          </label>
          <input
            type="range"
            min="1"
            max="32"
            step="1"
            value={settings.ssao?.samples || 16}
            onChange={(e) => updateSSAOSettings({ samples: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Rings: {settings.ssao?.rings || 4}
          </label>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={settings.ssao?.rings || 4}
            onChange={(e) => updateSSAOSettings({ rings: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Distance Threshold: {(settings.ssao?.distanceThreshold || 0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={settings.ssao?.distanceThreshold || 1.0}
            onChange={(e) => updateSSAOSettings({ distanceThreshold: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Distance Falloff: {(settings.ssao?.distanceFalloff || 0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={settings.ssao?.distanceFalloff || 0.5}
            onChange={(e) => updateSSAOSettings({ distanceFalloff: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Depth of Field Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#9b59b6', fontSize: '16px' }}>🔍 Depth of Field</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.depthOfField?.enabled || false}
              onChange={(e) => updateDepthOfFieldSettings({ enabled: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Enable Depth of Field
          </label>
        </div>

        {settings.depthOfField?.enabled && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Focus Distance: {(settings.depthOfField?.focusDistance || 10.0).toFixed(1)}
              </label>
              <input
                type="range"
                min="1.0"
                max="20.0"
                step="0.1"
                value={settings.depthOfField?.focusDistance || 10.0}
                onChange={(e) => updateDepthOfFieldSettings({ focusDistance: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Focal Length: {(settings.depthOfField?.focalLength || 50.0).toFixed(1)}
              </label>
              <input
                type="range"
                min="10.0"
                max="100.0"
                step="1.0"
                value={settings.depthOfField?.focalLength || 50.0}
                onChange={(e) => updateDepthOfFieldSettings({ focalLength: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Bokeh Scale: {(settings.depthOfField?.bokehScale || 1.0).toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={settings.depthOfField?.bokehScale || 1.0}
                onChange={(e) => updateDepthOfFieldSettings({ bokehScale: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Lens Distortion Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#e67e22', fontSize: '16px' }}>📷 Lens Distortion</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.lensDistortion?.enabled || false}
              onChange={(e) => updateLensDistortionSettings({ enabled: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Enable Lens Distortion
          </label>
        </div>

        {settings.lensDistortion?.enabled && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Barrel Distortion: {(settings.lensDistortion?.barrelDistortion || 0.0).toFixed(3)}
              </label>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={settings.lensDistortion?.barrelDistortion || 0.0}
                onChange={(e) => updateLensDistortionSettings({ barrelDistortion: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                Negative = Pincushion, Positive = Barrel
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Chromatic Aberration: {(settings.lensDistortion?.chromaticAberration || 0.0).toFixed(4)}
              </label>
              <input
                type="range"
                min="0.0"
                max="0.2"
                step="0.0001"
                value={settings.lensDistortion?.chromaticAberration || 0.0}
                onChange={(e) => updateLensDistortionSettings({ chromaticAberration: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                Lens-based red/blue separation
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Vignette: {(settings.lensDistortion?.vignette || 0.0).toFixed(3)}
              </label>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.01"
                value={settings.lensDistortion?.vignette || 0.0}
                onChange={(e) => updateLensDistortionSettings({ vignette: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Center X: {(settings.lensDistortion?.center?.[0] || 0.5).toFixed(3)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={settings.lensDistortion?.center?.[0] || 0.5}
                onChange={(e) => updateLensDistortionSettings({ 
                  center: [parseFloat(e.target.value), settings.lensDistortion?.center?.[1] || 0.5] 
                })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Center Y: {(settings.lensDistortion?.center?.[1] || 0.5).toFixed(3)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={settings.lensDistortion?.center?.[1] || 0.5}
                onChange={(e) => updateLensDistortionSettings({ 
                  center: [settings.lensDistortion?.center?.[0] || 0.5, parseFloat(e.target.value)] 
                })}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Tone Mapping Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#9caf88', fontSize: '16px' }}>🎨 Tone Mapping</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mode:</label>
          <select
            value={settings.toneMapping?.mode || ToneMappingMode.ACES_FILMIC}
            onChange={(e) => updateToneMappingSettings({ mode: parseInt(e.target.value) as ToneMappingMode })}
            style={{
              width: '100%',
              padding: '5px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          >
            {toneMappingModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Exposure: {(settings.toneMapping?.exposure || 1.2).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={settings.toneMapping?.exposure || 1.2}
            onChange={(e) => updateToneMappingSettings({ exposure: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            White Point: {(settings.toneMapping?.whitePoint || 16.0).toFixed(1)}
          </label>
          <input
            type="range"
            min="1.0"
            max="32.0"
            step="1.0"
            value={settings.toneMapping?.whitePoint || 16.0}
            onChange={(e) => updateToneMappingSettings({ whitePoint: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Middle Grey: {(settings.toneMapping?.middleGrey || 0.6).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={settings.toneMapping?.middleGrey || 0.6}
            onChange={(e) => updateToneMappingSettings({ middleGrey: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Adaptation: {(settings.toneMapping?.adaptation || 1.0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={settings.toneMapping?.adaptation || 1.0}
            onChange={(e) => updateToneMappingSettings({ adaptation: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* HDRI Settings */}
      <div className="control-section">
        <h3 style={{ color: '#333', fontSize: '14px', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
          HDRI Environment
        </h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={settings.hdri.enabled}
              onChange={(e) => updateHDRI({ enabled: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Enable HDRI Environment
          </label>
        </div>

        {settings.hdri.enabled && (
          <>
            {/* HDRI Preset Selection */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#ccc' }}>
                Environment Preset:
              </label>
              <select
                value={settings.hdri.url || 'city'}
                onChange={(e) => updateHDRI({ url: e.target.value === 'none' ? null : e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {presetHDRIs.map(preset => (
                  <option key={preset.name} value={preset.url || 'none'}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom HDRI Upload */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#ccc' }}>
                📁 Upload Custom HDRI:
              </label>
              <input
                type="file"
                accept=".hdr,.exr,.rgbe,.pic"
                onChange={handleHDRIUpload}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}
              />
              <div style={{ 
                marginTop: '8px', 
                fontSize: '10px', 
                color: '#999',
                lineHeight: '1.4'
              }}>
                <strong>Supported:</strong> .hdr, .exr, .rgbe, .pic<br/>
                <strong>Sources:</strong> <a href="https://hdri-haven.com/" target="_blank" rel="noopener noreferrer" style={{color: '#4A9EFF'}}>HDRi Haven</a>, <a href="https://polyhaven.com/hdris" target="_blank" rel="noopener noreferrer" style={{color: '#4A9EFF'}}>Poly Haven</a>
              </div>
              {settings.hdri.url && !['city', 'forest', 'studio'].includes(settings.hdri.url) && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '11px', 
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ✅ Custom HDRI loaded
                </div>
              )}
              
              {/* Loading indicator for custom HDRI */}
              {settings.hdri.enabled && settings.hdri.url && !['city', 'forest', 'studio'].includes(settings.hdri.url) && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '10px', 
                  color: '#ffa500',
                  fontStyle: 'italic'
                }}>
                  🔄 Loading custom HDRI... Check console for progress.
                </div>
              )}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
                Intensity: {settings.hdri.intensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={settings.hdri.intensity}
                onChange={(e) => updateHDRI({ intensity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
                Rotation: {Math.round(settings.hdri.rotation * 180 / Math.PI)}°
              </label>
              <input
                type="range"
                min="0"
                max={2 * Math.PI}
                step="0.1"
                value={settings.hdri.rotation}
                onChange={(e) => updateHDRI({ rotation: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={settings.hdri.background}
                  onChange={(e) => updateHDRI({ background: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Show as Background
              </label>
            </div>

            <button
              onClick={() => updateHDRI({ enabled: false, url: null, intensity: 2.0, rotation: 0, background: false })}
              style={{
                width: '100%',
                padding: '5px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Reset HDRI
            </button>
          </>
        )}
      </div>

      {/* God Rays Controls */}
      <div className="control-section">
        <h3 style={{ color: '#333', fontSize: '14px', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
          God Rays
        </h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={settings.godRays.enabled}
              onChange={(e) => updateGodRays({ enabled: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            Enable God Rays
          </label>
        </div>

        {settings.godRays.enabled && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
                Density: {(settings.godRays.density || 0.5).toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.godRays.density || 0.5}
                onChange={(e) => updateGodRays({ density: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
                Decay: {(settings.godRays.decay || 0.8).toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.godRays.decay || 0.8}
                onChange={(e) => updateGodRays({ decay: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
                Weight: {(settings.godRays.weight || 0.5).toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.godRays.weight || 0.5}
                onChange={(e) => updateGodRays({ weight: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
                Exposure: {(settings.godRays.exposure || 1.0).toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.godRays.exposure || 1.0}
                onChange={(e) => updateGodRays({ exposure: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '12px' }}>
                Intensity: {(settings.godRays.intensity || 1.0).toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.godRays.intensity || 1.0}
                onChange={(e) => updateGodRays({ intensity: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Material Settings */}
      <div className="control-section">
        <h3 style={{ color: '#333', fontSize: '14px', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
          🔧 Material Properties
        </h3>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            Roughness: {settings.material.roughness.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={settings.material.roughness}
            onChange={(e) => updateMaterial({ roughness: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
            0 = Mirror smooth, 1 = Rough matte
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            Metalness: {settings.material.metalness.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.material.metalness}
            onChange={(e) => updateMaterial({ metalness: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
            0 = Dielectric, 1 = Pure metal
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            Reflectivity: {settings.material.reflectivity.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.material.reflectivity}
            onChange={(e) => updateMaterial({ reflectivity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            Environment Intensity: {settings.material.envMapIntensity.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={settings.material.envMapIntensity}
            onChange={(e) => updateMaterial({ envMapIntensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            Clearcoat: {settings.material.clearcoat.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.material.clearcoat}
            onChange={(e) => updateMaterial({ clearcoat: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
            Extra glossy layer on top
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            Clearcoat Roughness: {settings.material.clearcoatRoughness.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={settings.material.clearcoatRoughness}
            onChange={(e) => updateMaterial({ clearcoatRoughness: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            IOR (Index of Refraction): {settings.material.ior.toFixed(2)}
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={settings.material.ior}
            onChange={(e) => updateMaterial({ ior: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
            1.5 = Glass, 2.4 = Diamond
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '3px', color: '#555', fontSize: '11px' }}>
            Base Color:
          </label>
          <input
            type="color"
            value={settings.material.color}
            onChange={(e) => updateMaterial({ color: e.target.value })}
            style={{
              width: '100%',
              height: '30px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: '#555', 
            fontSize: '11px',
            cursor: 'pointer',
            gap: '6px'
          }}>
            <input
              type="checkbox"
              checked={settings.material.toneMapped}
              onChange={(e) => updateMaterial({ toneMapped: e.target.checked })}
              style={{ marginRight: '0px' }}
            />
            Enable Tone Mapping
          </label>
          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px', marginLeft: '16px' }}>
            Apply post-processing tone mapping to material
          </div>
        </div>

        <button
          onClick={() => updateMaterial({
            roughness: 0.01,
            metalness: 1.0,
            reflectivity: 1.0,
            envMapIntensity: 4.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.01,
            ior: 2.4,
            color: '#cccccc',
            toneMapped: true,
          })}
          style={{
            width: '100%',
            padding: '5px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Reset to Chrome Defaults
        </button>
      </div>

      <button
        onClick={resetToDefaults}
        style={{
          width: '100%',
          padding: '8px',
          background: '#968065',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Reset All to Defaults
      </button>
    </div>
  );
};

export default PostProcessingControls; 