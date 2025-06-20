import React, { useState, useEffect } from 'react';
import { ToneMappingMode } from 'postprocessing';
import type { PostProcessingSettings, LensDistortionSettings } from './LensDistortionEffect';

interface LensDistortionControlsProps {
  onSettingsChange: (settings: PostProcessingSettings) => void;
  initialSettings?: PostProcessingSettings;
}

const LensDistortionControls: React.FC<LensDistortionControlsProps> = ({ 
  onSettingsChange,
  initialSettings
}) => {
  const defaultSettings: PostProcessingSettings = {
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

  const [settings, setSettings] = useState<PostProcessingSettings>(() => {
    if (initialSettings) {
      return {
        lensDistortion: { ...defaultSettings.lensDistortion, ...initialSettings.lensDistortion },
        toneMapping: { ...defaultSettings.toneMapping, ...initialSettings.toneMapping },
        bloom: { ...defaultSettings.bloom, ...initialSettings.bloom },
        filmGrain: { ...defaultSettings.filmGrain, ...initialSettings.filmGrain },
        ssao: { ...defaultSettings.ssao, ...initialSettings.ssao },
      };
    }
    return defaultSettings;
  });

  // Update local settings when initial settings change
  useEffect(() => {
    if (initialSettings) {
      setSettings({
        lensDistortion: { ...defaultSettings.lensDistortion, ...initialSettings.lensDistortion },
        toneMapping: { ...defaultSettings.toneMapping, ...initialSettings.toneMapping },
        bloom: { ...defaultSettings.bloom, ...initialSettings.bloom },
        filmGrain: { ...defaultSettings.filmGrain, ...initialSettings.filmGrain },
        ssao: { ...defaultSettings.ssao, ...initialSettings.ssao },
      });
    }
  }, [initialSettings]);

  const updateLensDistortionSettings = (newSettings: Partial<LensDistortionSettings>) => {
    const updated = { 
      ...settings, 
      lensDistortion: { ...settings.lensDistortion, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateToneMappingSettings = (newSettings: Partial<PostProcessingSettings['toneMapping']>) => {
    const updated = { 
      ...settings, 
      toneMapping: { ...settings.toneMapping, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateBloomSettings = (newSettings: Partial<PostProcessingSettings['bloom']>) => {
    const updated = { 
      ...settings, 
      bloom: { ...settings.bloom, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateFilmGrainSettings = (newSettings: Partial<PostProcessingSettings['filmGrain']>) => {
    const updated = { 
      ...settings, 
      filmGrain: { ...settings.filmGrain, ...newSettings }
    };
    setSettings(updated);
    onSettingsChange(updated);
  };

  const updateSSAOSettings = (newSettings: Partial<PostProcessingSettings['ssao']>) => {
    const updated = { 
      ...settings, 
      ssao: { ...settings.ssao, ...newSettings }
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
        Lens Distortion Controls
        <span style={{ fontSize: '10px', color: '#888', marginLeft: '8px' }}>
          (gkjohnson Style)
        </span>
      </h3>

      {/* Lens Distortion Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#ff6b9d', fontSize: '16px' }}>📷 Lens Effects</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Barrel Distortion: {settings.lensDistortion.barrelDistortion.toFixed(3)}
          </label>
          <input
            type="range"
            min="-0.5"
            max="0.5"
            step="0.01"
            value={settings.lensDistortion.barrelDistortion}
            onChange={(e) => updateLensDistortionSettings({ barrelDistortion: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
            Negative = Pincushion, Positive = Barrel
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Chromatic Aberration: {settings.lensDistortion.chromaticAberration.toFixed(4)}
          </label>
          <input
            type="range"
            min="0.0"
            max="0.02"
            step="0.001"
            value={settings.lensDistortion.chromaticAberration}
            onChange={(e) => updateLensDistortionSettings({ chromaticAberration: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
            Color fringing at edges
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Vignette: {settings.lensDistortion.vignette.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={settings.lensDistortion.vignette}
            onChange={(e) => updateLensDistortionSettings({ vignette: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Center X: {settings.lensDistortion.center[0].toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.01"
            value={settings.lensDistortion.center[0]}
            onChange={(e) => updateLensDistortionSettings({ 
              center: [parseFloat(e.target.value), settings.lensDistortion.center[1]] 
            })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Center Y: {settings.lensDistortion.center[1].toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.01"
            value={settings.lensDistortion.center[1]}
            onChange={(e) => updateLensDistortionSettings({ 
              center: [settings.lensDistortion.center[0], parseFloat(e.target.value)] 
            })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Film Grain Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#c4a47c', fontSize: '16px' }}>🎞️ Film Grain</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Intensity: {settings.filmGrain.intensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.filmGrain.intensity}
            onChange={(e) => updateFilmGrainSettings({ intensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Opacity: {settings.filmGrain.opacity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="0.5"
            step="0.01"
            value={settings.filmGrain.opacity}
            onChange={(e) => updateFilmGrainSettings({ opacity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Bloom Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#b87333', fontSize: '16px' }}>🌟 Bloom Effect</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Intensity: {settings.bloom.intensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="3.0"
            step="0.1"
            value={settings.bloom.intensity}
            onChange={(e) => updateBloomSettings({ intensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Opacity: {settings.bloom.opacity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.bloom.opacity}
            onChange={(e) => updateBloomSettings({ opacity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* SSAO Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#6b73ff', fontSize: '16px' }}>🌑 SSAO</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Intensity: {settings.ssao.intensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.ssao.intensity}
            onChange={(e) => updateSSAOSettings({ intensity: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Radius: {settings.ssao.radius.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={settings.ssao.radius}
            onChange={(e) => updateSSAOSettings({ radius: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Tone Mapping Controls */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#968065', fontSize: '16px' }}>🎨 Tone Mapping</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mode</label>
          <select
            value={settings.toneMapping.mode}
            onChange={(e) => updateToneMappingSettings({ mode: parseInt(e.target.value) as ToneMappingMode })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #555',
              background: '#333',
              color: 'white',
            }}
          >
            {toneMappingModes.map(mode => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Exposure: {settings.toneMapping.exposure.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={settings.toneMapping.exposure}
            onChange={(e) => updateToneMappingSettings({ exposure: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <button
        onClick={resetToDefaults}
        style={{
          width: '100%',
          padding: '10px',
          background: '#968065',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          marginTop: '10px',
        }}
      >
        Reset to Defaults
      </button>
    </div>
  );
};

export default LensDistortionControls; 