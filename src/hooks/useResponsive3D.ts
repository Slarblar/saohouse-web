import { useState, useEffect, useCallback } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

interface ResponsiveConfig {
  scale: number;
  position: [number, number, number];
}

interface ViewportInfo {
  width: number;
  height: number;
  aspectRatio: number;
  isPortrait: boolean;
  centerScale: number;
}

interface ResponsiveSettings {
  mobile: {
    portrait: ResponsiveConfig;
    landscape: ResponsiveConfig;
  };
  tablet: {
    portrait: ResponsiveConfig;
    landscape: ResponsiveConfig;
  };
  desktop: {
    portrait: ResponsiveConfig;
    landscape: ResponsiveConfig;
  };
}

// Viewport-based calculations for true centering
const calculateViewportInfo = (): ViewportInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;
  const isPortrait = height > width;
  
  // Calculate responsive scale based on viewport size
  const baseViewportSize = 1000; // Reference size
  const currentViewportSize = Math.sqrt(width * height);
  const scaleMultiplier = currentViewportSize / baseViewportSize;
  
  // Base scale with viewport responsiveness
  const baseScale = 0.03;
  const minScale = baseScale * 0.6;
  const maxScale = baseScale * 1.8;
  const centerScale = Math.max(minScale, Math.min(maxScale, baseScale * scaleMultiplier));
  
  return {
    width,
    height,
    aspectRatio,
    isPortrait,
    centerScale
  };
};

// Manual positioning based on visual center of the SAO logo model
// These positions account for the model's actual geometry center, not coordinate center
const defaultSettings: ResponsiveSettings = {
  mobile: {
    portrait: { scale: 0.0264, position: [0.0, 0.15, 0] }, // Optimized portrait proportions (iPhone 14 Pro Max tested)
    landscape: { scale: 0.084, position: [0.185, 0.52, 0] } // Optimized landscape proportions (Pixel 7 tested)
  },
  tablet: {
    portrait: { scale: 0.0264, position: [0.0, 0.15, 0] }, // Standardized portrait proportions 
    landscape: { scale: 0.084, position: [0.185, 0.52, 0] } // Optimized landscape proportions (Pixel 7 tested)
  },
  desktop: {
    portrait: { scale: 0.0264, position: [0.0, 0.15, 0] }, // Standardized portrait proportions
    landscape: { scale: 0.048, position: [0.10, 0.2, 0] } // Original desktop landscape settings
  }
};

export const useResponsive3D = (
  customSettings?: Partial<ResponsiveSettings>, 
  enableMobileReload = false,
  onResponsiveChange?: (isTransitioning: boolean) => void
) => {
  const deviceInfo = useDeviceDetection();
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>(calculateViewportInfo);
  
  // Initialize with correct device settings from the start to prevent jumping
  const getInitialConfig = () => {
    const settings = { ...defaultSettings, ...customSettings };
    const deviceConfig = settings[deviceInfo.type][deviceInfo.orientation];
    // const viewport = calculateViewportInfo();
    
    // Keep device config as-is for manual positioning, with minimal viewport influence
    return deviceConfig;
  };
  
  const [config, setConfig] = useState<ResponsiveConfig>(getInitialConfig);
  const [isInitialized, setIsInitialized] = useState(false);
  const [previousDeviceInfo, setPreviousDeviceInfo] = useState(deviceInfo);

  const settings = { ...defaultSettings, ...customSettings };

  // Viewport monitoring with smooth resize handling
  const updateViewportInfo = useCallback(() => {
    const newViewportInfo = calculateViewportInfo();
    setViewportInfo(newViewportInfo);
    
    // Use manual configuration as-is, viewport info for monitoring only
    const baseConfig = settings[deviceInfo.type][deviceInfo.orientation];
    setConfig(baseConfig);
  }, [deviceInfo.type, deviceInfo.orientation, settings]);

  // Handle viewport changes (resize, orientation)
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    let orientationTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateViewportInfo();
        onResponsiveChange && onResponsiveChange(true);
        
        // Complete transition after viewport update
        setTimeout(() => {
          onResponsiveChange && onResponsiveChange(false);
        }, 300);
      }, 100); // 100ms debounce for smooth performance
    };

    const handleOrientationChange = () => {
      // IMPROVED: Better stability handling for orientation changes
      clearTimeout(orientationTimeout);
      
      // Immediate feedback for better UX
      onResponsiveChange && onResponsiveChange(true);
      
      // Delay to let the browser settle after orientation change
      orientationTimeout = setTimeout(() => {
        updateViewportInfo();
        
        // Complete the transition
        setTimeout(() => {
          onResponsiveChange && onResponsiveChange(false);
        }, 200);
      }, 350); // Increased delay for better stability
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(resizeTimeout);
      clearTimeout(orientationTimeout);
    };
  }, [updateViewportInfo, onResponsiveChange]);



  useEffect(() => {
    // Skip if device info hasn't stabilized yet
    if (!deviceInfo.type || !deviceInfo.orientation) {
      return;
    }

    // DEFENSIVE: Prevent processing if component is unmounting
    let isMounted = true;

    // IMPROVED: Smart orientation change handling for mobile devices
    if (previousDeviceInfo.type === 'mobile' && 
        deviceInfo.type === 'mobile' &&
        previousDeviceInfo.orientation !== deviceInfo.orientation &&
        isInitialized && enableMobileReload) {
        
        // PRODUCTION: Disabled debug logging
        // console.log('📱 Mobile orientation change detected (reload disabled):', {
        //   from: previousDeviceInfo.orientation,
        //   to: deviceInfo.orientation,
        //   enableMobileReload
        // });
        
        // Notify responsive change handlers for smooth transitions
        if (isMounted && onResponsiveChange) {
          onResponsiveChange(true);
        }
        
        // Allow components to update their layout smoothly
        setTimeout(() => {
          if (isMounted && onResponsiveChange) {
            onResponsiveChange(false);
          }
        }, 600); // Give more time for smooth transitions
        
        // Continue to normal configuration update instead of reloading
    }

    // Major layout change detection
    if (previousDeviceInfo.type !== deviceInfo.type || 
        previousDeviceInfo.orientation !== deviceInfo.orientation) {
        if (isMounted && onResponsiveChange) {
          onResponsiveChange(true);
        }
    }

    // Update responsive 3D configuration - using manual positioning
    const baseConfig = settings[deviceInfo.type][deviceInfo.orientation];
    const currentViewport = calculateViewportInfo();
    
    let newConfig = { ...baseConfig };

    // Pixel 7 specific adjustments
    const isPixel7Portrait = ((currentViewport.width === 412 || currentViewport.width === 411) && 
                              (currentViewport.height === 915 || currentViewport.height === 891));
    const isPixel7Landscape = ((currentViewport.width === 915 || currentViewport.width === 891) && 
                               (currentViewport.height === 412 || currentViewport.height === 411));
    
    // Galaxy Z Fold specific adjustments
    const isGalaxyZFoldLandscape = deviceInfo.orientation === 'landscape' && 
                                  ((currentViewport.width === 882 && currentViewport.height === 344) ||
                                   (currentViewport.width === 344 && currentViewport.height === 882));
    
    if (isPixel7Portrait && deviceInfo.orientation === 'portrait') {
        // Reduce by 18% from the standardized portrait scale (0.0264)
        const reducedScale = 0.0264 * 0.82; // 18% reduction
        newConfig = {
            ...newConfig,
            scale: reducedScale,
            position: [0.05, 0.15, 0] as [number, number, number] // Centered with slight right adjustment for Pixel 7
        };
    } else if (isPixel7Landscape && deviceInfo.orientation === 'landscape') {
        // Increase by 200% from the current detected scale (300% of original = 3x)
        const currentScale = deviceInfo.type === 'mobile' ? 0.07728 : 0.028;
        const tripleScale = currentScale * 3.0; // 200% increase (triple)
        newConfig = {
            ...newConfig,
            scale: tripleScale,
            position: deviceInfo.type === 'mobile' ? [0.385, 0.85, 0] : [0.185, 0.52, 0] as [number, number, number] // Moved 0.135 units right, 0.32 units up total
        };
    } else if (isGalaxyZFoldLandscape) {
        // Galaxy Z Fold landscape - move logo up slightly
        newConfig = {
            ...newConfig,
            scale: 0.084, // Use optimized landscape scale
            position: [0.185, 0.65, 0] as [number, number, number] // Moved up from 0.52 to 0.65
        };
    }

    // iPad Mini and iPad Air specific adjustments for landscape - reduce size by 35%
    const isIPadMiniLandscape = deviceInfo.isIPad && deviceInfo.orientation === 'landscape' && 
                               ((currentViewport.width === 1024 && currentViewport.height === 768) ||
                                (currentViewport.width === 768 && currentViewport.height === 1024));
    const isIPadAirLandscape = deviceInfo.isIPad && deviceInfo.orientation === 'landscape' && 
                              ((currentViewport.width === 1180 && currentViewport.height === 820) ||
                               (currentViewport.width === 820 && currentViewport.height === 1180));
    
    if (isIPadMiniLandscape || isIPadAirLandscape) {
        const reducedScale = 0.084 * 0.65; // 35% reduction from optimized landscape scale
        newConfig = {
            ...newConfig,
            scale: reducedScale,
            position: [0.185, 0.52, 0] as [number, number, number] // Keep optimized position
        };
    }

    // iPad Mini specific adjustments for portrait - increase size by 75%
    const isIPadMiniPortrait = deviceInfo.isIPad && deviceInfo.orientation === 'portrait' && 
                              ((currentViewport.width === 768 && currentViewport.height === 1024) ||
                               (currentViewport.width === 1024 && currentViewport.height === 768));
    
    // iPad Air specific adjustments for portrait - increase size by 35%
    const isIPadAirPortrait = deviceInfo.isIPad && deviceInfo.orientation === 'portrait' && 
                             ((currentViewport.width === 820 && currentViewport.height === 1180) ||
                              (currentViewport.width === 1180 && currentViewport.height === 820));
    
    if (isIPadMiniPortrait) {
        const adjustedScale = 0.0264 * 1.2529688; // 25.3% increase (125.3% of original) - was 7.2% reduction, now increased by additional 35%
        newConfig = {
            ...newConfig,
            scale: adjustedScale,
            position: [0.0, 0.15, 0] as [number, number, number] // Keep standardized position
        };
    } else if (isIPadAirPortrait) {
        const increasedScale = 0.0264 * 1.70; // 70% increase (170% of original) - was 35%, now additional 35%
        newConfig = {
            ...newConfig,
            scale: increasedScale,
            position: [0.0, 0.15, 0] as [number, number, number] // Keep standardized position
        };
    }
    // Other iPad specific adjustments (only for portrait - let landscape use optimized settings)
    else if (deviceInfo.isIPad && deviceInfo.type === 'tablet' && deviceInfo.orientation === 'portrait') {
        const increasedScale = 0.0264 * 1.62; // 62% increase for iPad Pro portrait (was 20%, now increased by 35%)
        newConfig = {
            ...newConfig,
            scale: increasedScale,
            position: [0.2575, 0.15, 0] as [number, number, number] // Moved additional 0.125 units to the right (total 0.2575)
        };
    }

    // Keep manual scaling as-is - no automatic aspect ratio adjustments

    setConfig(newConfig);
    setViewportInfo(currentViewport);
    setPreviousDeviceInfo(deviceInfo);
    
    // Mark as initialized after first config update
    if (!isInitialized) {
      setTimeout(() => {
        if (isMounted) setIsInitialized(true);
      }, 500);
    } else if (onResponsiveChange) {
      // Complete transition after config is applied
      setTimeout(() => {
        if (isMounted && onResponsiveChange) {
          onResponsiveChange(false);
        }
      }, 400);
    }

    // Cleanup function to prevent race conditions
    return () => {
      isMounted = false;
    };
  }, [deviceInfo.type, deviceInfo.orientation, deviceInfo.isIPhone, deviceInfo.isIPad, isInitialized, enableMobileReload, onResponsiveChange]);

  return {
    deviceType: deviceInfo.type,
    orientation: deviceInfo.orientation,
    scale: config.scale,
    position: config.position,
    isLoading: false,
    deviceInfo, // Expose full device info for debugging
    viewportInfo, // Expose viewport calculations for debugging
    isManuallyPositioned: true, // Using manual positioning based on visual center
  };
}; 