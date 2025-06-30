import React from 'react';
import type { PostProcessingSettings } from '../components/ToneMappingControls';

const SETTINGS_STORAGE_KEY = 'saohouse-settings';
const SETTINGS_CACHE_KEY = 'saohouse-settings-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Centralized default settings - single source of truth
export const DEFAULT_SETTINGS: PostProcessingSettings = {
  toneMapping: {
    mode: 3, // Use consistent numeric mode
    exposure: 1.4,
    whitePoint: 2,
    middleGrey: 0.5,
    adaptation: 1.3
  },
  bloom: {
    intensity: 0.1,
    luminanceThreshold: 0.6,
    luminanceSmoothing: 0,
    mipmapBlur: false,
    opacity: 0.15
  },
  chromaticAberration: {
    enabled: false,
    offset: [0.015, 0.008],
    redOffset: [0.013, 0],
    greenOffset: [0, 0],
    blueOffset: [0, 0],
    radialModulation: false,
    modulationOffset: 0,
    blur: 0,
    intensity: 1,
    radialIntensity: 1
  },
  filmGrain: {
    intensity: 0.55,
    opacity: 0.02
  },
  ssao: {
    intensity: 0.75,
    radius: 0.55,
    bias: 0.55,
    samples: 28,
    rings: 5,
    distanceThreshold: 0.85,
    distanceFalloff: 0.8
  },
  blur: {
    enabled: false,
    intensity: 0.1,
    kernelSize: 3,
    iterations: 1
  },
  depthOfField: {
    enabled: false,
    focusDistance: 4,
    focalLength: 29,
    bokehScale: 1.8
  },
  lensDistortion: {
    enabled: true,
    barrelDistortion: 0,
    chromaticAberration: 0.0167,
    vignette: 0.65,
    center: [0.5, 0.5]
  },
  motionBlur: {
    intensity: 1,
    velocityScale: 1,
    samples: 8,
    enabled: false
  },
  hdri: {
    enabled: true,
    url: "studio",
    intensity: 2.2,
    rotation: 1.9,
    background: false
  },
  godRays: {
    enabled: true,
    density: 0.65,
    decay: 0.77,
    weight: 0.47,
    exposure: 0.67,
    intensity: 1
  },
  material: {
    roughness: 0.176,
    metalness: 1,
    reflectivity: 0.87,
    envMapIntensity: 2.4,
    clearcoat: 0.9,
    clearcoatRoughness: 0.39,
    ior: 2.13,
    color: "#7a7a7a",
    toneMapped: true
  }
};

interface SettingsCache {
  settings: PostProcessingSettings;
  timestamp: number;
  source: string;
}

class SettingsManager {
  private static instance: SettingsManager;
  private currentSettings: PostProcessingSettings = DEFAULT_SETTINGS;
  private isLoading = false;
  private loadPromise: Promise<PostProcessingSettings> | null = null;
  private subscribers: Set<(settings: PostProcessingSettings) => void> = new Set();

  private constructor() {}

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  // Subscribe to settings changes
  subscribe(callback: (settings: PostProcessingSettings) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of settings changes
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.currentSettings));
  }

  // Get current settings (cached)
  getCurrentSettings(): PostProcessingSettings {
    return { ...this.currentSettings };
  }

  // Load settings with caching and deduplication
  async loadSettings(): Promise<PostProcessingSettings> {
    // If already loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Check cache first
    const cached = this.getCachedSettings();
    if (cached) {
      console.log('⚡ SettingsManager: Using cached settings');
      this.currentSettings = cached.settings;
      return this.currentSettings;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.performSettingsLoad();

    try {
      const settings = await this.loadPromise;
      this.currentSettings = settings;
      this.notifySubscribers();
      return settings;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  private async performSettingsLoad(): Promise<PostProcessingSettings> {
    try {
      // Try file discovery first
      const fileSettings = await this.discoverFileSettings();
      this.cacheSettings(fileSettings, 'file');
      console.log('✅ SettingsManager: Loaded from file discovery');
      return fileSettings;
    } catch (fileError) {
      console.warn('⚠️ SettingsManager: File discovery failed, trying localStorage');
      
      try {
        // Fallback to localStorage
        const localSettings = this.loadFromLocalStorage();
        if (localSettings) {
          this.cacheSettings(localSettings, 'localStorage');
          console.log('📱 SettingsManager: Loaded from localStorage');
          return localSettings;
        }
      } catch (localError) {
        console.warn('❌ SettingsManager: localStorage failed');
      }

      // Final fallback to defaults
      console.log('🔧 SettingsManager: Using default settings');
      return DEFAULT_SETTINGS;
    }
  }

  private async discoverFileSettings(): Promise<PostProcessingSettings> {
    const potentialFiles = this.generateFilePatterns();
    
    console.log('🔍 SettingsManager: Auto-discovering settings...');
    console.log(`📁 SettingsManager: Checking ${potentialFiles.length} file patterns`);
    
    for (const filename of potentialFiles) {
      try {
        const response = await fetch(`/importsettings/${filename}`, {
          cache: 'no-cache', // Prevent browser caching issues
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && (data.settings || data.toneMapping || data.material)) {
            console.log(`✅ SettingsManager: Found settings file: ${filename}`);
            
            const importedSettings = data.settings || data;
            return this.mergeWithDefaults(importedSettings);
          }
        }
      } catch (error) {
        continue; // Try next file
      }
    }
    
    throw new Error('No valid settings files found');
  }

  private generateFilePatterns(): string[] {
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
      
      // YESTERDAY's patterns  
      `saohouse-settings-${year}-${yMonth}-${yDay} (3).json`,
      `saohouse-settings-${year}-${yMonth}-${yDay} (2).json`,
      `saohouse-settings-${year}-${yMonth}-${yDay} (1).json`,
      `saohouse-settings-${year}-${yMonth}-${yDay}.json`,
      
      // Recent patterns
      'saohouse-settings-2025-06-29.json',
      'saohouse-settings-2025-06-28.json',
      'saohouse-settings-2025-06-27.json',
      
      // Generic fallbacks (lowest priority)
      'latest.json',
      'current.json',
      'settings.json'
    ];
  }

  private loadFromLocalStorage(): PostProcessingSettings | null {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse localStorage settings:', error);
    }
    return null;
  }

  private mergeWithDefaults(importedSettings: any): PostProcessingSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...importedSettings,
      toneMapping: { ...DEFAULT_SETTINGS.toneMapping, ...importedSettings.toneMapping },
      bloom: { ...DEFAULT_SETTINGS.bloom, ...importedSettings.bloom },
      chromaticAberration: { ...DEFAULT_SETTINGS.chromaticAberration, ...importedSettings.chromaticAberration },
      filmGrain: { ...DEFAULT_SETTINGS.filmGrain, ...importedSettings.filmGrain },
      ssao: { ...DEFAULT_SETTINGS.ssao, ...importedSettings.ssao },
      blur: { ...DEFAULT_SETTINGS.blur, ...importedSettings.blur },
      depthOfField: { ...DEFAULT_SETTINGS.depthOfField, ...importedSettings.depthOfField },
      lensDistortion: { ...DEFAULT_SETTINGS.lensDistortion, ...importedSettings.lensDistortion },
      motionBlur: { ...DEFAULT_SETTINGS.motionBlur, ...importedSettings.motionBlur },
      hdri: { ...DEFAULT_SETTINGS.hdri, ...importedSettings.hdri },
      godRays: { ...DEFAULT_SETTINGS.godRays, ...importedSettings.godRays },
      material: { ...DEFAULT_SETTINGS.material, ...importedSettings.material },
    };
  }

  // Cache settings to prevent repeated loads
  private cacheSettings(settings: PostProcessingSettings, source: string) {
    try {
      const cache: SettingsCache = {
        settings,
        timestamp: Date.now(),
        source
      };
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache settings:', error);
    }
  }

  private getCachedSettings(): SettingsCache | null {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        const parsedCache: SettingsCache = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
          return parsedCache;
        }
      }
    } catch (error) {
      console.warn('Failed to read settings cache:', error);
    }
    return null;
  }

  // Update settings and save to localStorage
  updateSettings(newSettings: PostProcessingSettings): void {
    this.currentSettings = newSettings;
    
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      this.cacheSettings(newSettings, 'user-update');
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
    
    this.notifySubscribers();
  }

  // Clear cache (useful for development)
  clearCache(): void {
    try {
      localStorage.removeItem(SETTINGS_CACHE_KEY);
      console.log('🧹 SettingsManager: Cache cleared');
    } catch (error) {
      console.warn('Failed to clear settings cache:', error);
    }
  }
}

// Export singleton instance and hook
export const settingsManager = SettingsManager.getInstance();

// React hook for easy integration
export function useSettings() {
  const [settings, setSettings] = React.useState<PostProcessingSettings>(
    () => settingsManager.getCurrentSettings()
  );
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = settingsManager.subscribe(setSettings);
    
    // Load settings if not already loaded
    if (JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS)) {
      setIsLoading(true);
      settingsManager.loadSettings()
        .then(loadedSettings => {
          setSettings(loadedSettings);
        })
        .finally(() => setIsLoading(false));
    }

    return unsubscribe;
  }, []);

  const updateSettings = React.useCallback((newSettings: PostProcessingSettings) => {
    settingsManager.updateSettings(newSettings);
  }, []);

  return {
    settings,
    updateSettings,
    isLoading,
    clearCache: settingsManager.clearCache
  };
} 