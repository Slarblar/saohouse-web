import { useMemo } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

export interface PerformanceOptimizations {
  // Effect toggles
  enableN8AO: boolean;
  enableBloom: boolean;
  enableFXAA: boolean;
  enableMipmapBlur: boolean;
  
  // Performance multipliers
  bloomIntensityMultiplier: number;
  bloomThresholdMultiplier: number;
  ssaoIntensityMultiplier: number;
  ssaoRadiusMultiplier: number;
  ssaoDenoiseRadiusMultiplier: number;
  noiseOpacityMultiplier: number;
  
  // Quality settings
  pixelRatioMax: number;
  shadowQuality: 'none' | 'low' | 'medium' | 'high';
  antialiasing: boolean;
}

export const useMobilePerformanceOptimization = (): PerformanceOptimizations => {
  const deviceInfo = useDeviceDetection();
  
  const optimizations = useMemo((): PerformanceOptimizations => {
    const isMobile = deviceInfo.type === 'mobile';
    const isTablet = deviceInfo.type === 'tablet';
    const isLowEnd = deviceInfo.pixelRatio <= 1.5;
    
    if (isMobile && isLowEnd) {
      // Low-end mobile: Maximum performance, minimal effects
      return {
        enableN8AO: false,        // Biggest FPS killer - disable completely
        enableBloom: false,       // Second biggest - disable on low-end
        enableFXAA: false,        // Canvas antialiasing is enough
        enableMipmapBlur: false,
        
        bloomIntensityMultiplier: 0,
        bloomThresholdMultiplier: 1.5,
        ssaoIntensityMultiplier: 0,
        ssaoRadiusMultiplier: 0,
        ssaoDenoiseRadiusMultiplier: 0,
        noiseOpacityMultiplier: 0.3,
        
        pixelRatioMax: 1,
        shadowQuality: 'none',
        antialiasing: false,
      };
    } else if (isMobile) {
      // Mid-range mobile: Reduced effects for ~45-50 FPS
      return {
        enableN8AO: false,        // Still disable - too expensive on mobile
        enableBloom: true,        // Enable bloom but reduce intensity
        enableFXAA: false,        // Canvas AA sufficient on mobile
        enableMipmapBlur: false,  // Disable mipmap blur
        
        bloomIntensityMultiplier: 0.5,
        bloomThresholdMultiplier: 1.4,
        ssaoIntensityMultiplier: 0,
        ssaoRadiusMultiplier: 0,
        ssaoDenoiseRadiusMultiplier: 0,
        noiseOpacityMultiplier: 0.6,
        
        pixelRatioMax: 1.5,
        shadowQuality: 'low',
        antialiasing: false,
      };
    } else if (isTablet) {
      // Tablet: Moderate optimization for ~50-55 FPS
      return {
        enableN8AO: true,         // Enable but reduce settings
        enableBloom: true,
        enableFXAA: true,
        enableMipmapBlur: false,  // Still expensive on tablets
        
        bloomIntensityMultiplier: 0.7,
        bloomThresholdMultiplier: 1.2,
        ssaoIntensityMultiplier: 0.6,
        ssaoRadiusMultiplier: 0.7,
        ssaoDenoiseRadiusMultiplier: 0.5, // Reduce from 12 to 6
        noiseOpacityMultiplier: 0.8,
        
        pixelRatioMax: 2,
        shadowQuality: 'medium',
        antialiasing: true,
      };
    } else {
      // Desktop: Full quality
      return {
        enableN8AO: true,
        enableBloom: true,
        enableFXAA: true,
        enableMipmapBlur: true,
        
        bloomIntensityMultiplier: 1.0,
        bloomThresholdMultiplier: 1.0,
        ssaoIntensityMultiplier: 1.0,
        ssaoRadiusMultiplier: 1.0,
        ssaoDenoiseRadiusMultiplier: 1.0,
        noiseOpacityMultiplier: 1.0,
        
        pixelRatioMax: 2,
        shadowQuality: 'high',
        antialiasing: true,
      };
    }
  }, [deviceInfo.type, deviceInfo.pixelRatio]);
  
  return optimizations;
}; 