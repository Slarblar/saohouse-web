import { useState, useEffect } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

interface ResponsiveConfig {
  scale: number;
  position: [number, number, number];
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

const defaultSettings: ResponsiveSettings = {
  mobile: {
    portrait: { scale: 0.038, position: [0, 0, 0] },
    landscape: { scale: 0.0752, position: [0.2, 0.15, 0] } // Reduced by 20% (0.094 * 0.8), moved 0.2 right and 0.15 up
  },
  tablet: {
    portrait: { scale: 0.0369, position: [0.10, 0, 0] }, // Moved 0.05 right from 0.05 (0.05 + 0.05 = 0.10) for iPad Pro portrait
    landscape: { scale: 0.04631, position: [0.2, 0, 0] } // Increased by 10% (0.0421 * 1.1) and moved 0.2 right for iPad Air landscape
  },
  desktop: {
    portrait: { scale: 0.04183, position: [0.25, 0, 0] }, // Increased by 5% (0.03984 * 1.05) and moved 0.1 left for better centering
    landscape: { scale: 0.05061, position: [0.25, 0, 0] } // Increased by 5% (0.04820 * 1.05) and moved 0.1 left for better centering
  }
};

export const useResponsive3D = (
  customSettings?: Partial<ResponsiveSettings>, 
  enableMobileReload = true,
  onResponsiveChange?: (isTransitioning: boolean) => void
) => {
  const deviceInfo = useDeviceDetection();
  const [config, setConfig] = useState<ResponsiveConfig>(defaultSettings.desktop.landscape);
  const [isInitialized, setIsInitialized] = useState(false);
  const [previousDeviceInfo, setPreviousDeviceInfo] = useState(deviceInfo);

  const settings = { ...defaultSettings, ...customSettings };

  useEffect(() => {
    // iPhone orientation change reload logic
    if (previousDeviceInfo.type === 'mobile' && 
        deviceInfo.type === 'mobile' &&
        previousDeviceInfo.orientation !== deviceInfo.orientation &&
        isInitialized && enableMobileReload) {
        
        // Give a moment for orientation to settle, then reload
        setTimeout(() => {
            window.location.reload();
        }, 100);
        return;
    }

    // Major layout change detection
    if (previousDeviceInfo.type !== deviceInfo.type || 
        previousDeviceInfo.orientation !== deviceInfo.orientation) {
        onResponsiveChange && onResponsiveChange(true);
    }

    // Update responsive 3D configuration
    const baseConfig = settings[deviceInfo.type][deviceInfo.orientation];
    let newConfig = { ...baseConfig };

    // iPad specific adjustments
    if (deviceInfo.isIPad && deviceInfo.type === 'tablet') {
        newConfig = {
            ...newConfig,
            scale: 0.24,
            position: [3, 0.25, 0] as [number, number, number]
        };
    }

    // Mobile landscape adjustments
    if (deviceInfo.type === 'mobile' && deviceInfo.orientation === 'landscape') {
        newConfig.scale = 0.094;
    }

    setConfig(newConfig);
    setPreviousDeviceInfo(deviceInfo);
    
    // Mark as initialized after first config update
    if (!isInitialized) {
      setTimeout(() => setIsInitialized(true), 500);
    } else if (onResponsiveChange) {
      // Complete transition after config is applied
      setTimeout(() => {
        onResponsiveChange(false);
      }, 400);
    }
  }, [deviceInfo.type, deviceInfo.orientation, deviceInfo.isIPhone, deviceInfo.isIPad, isInitialized, enableMobileReload, onResponsiveChange]);

  return {
    deviceType: deviceInfo.type,
    orientation: deviceInfo.orientation,
    scale: config.scale,
    position: config.position,
    isLoading: false,
    deviceInfo, // Expose full device info for debugging
  };
}; 