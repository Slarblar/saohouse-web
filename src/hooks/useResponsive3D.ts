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
    portrait: { scale: 0.028, position: [-0.15, 0.2, 0] },
    landscape: { scale: 0.024, position: [0.05, 0.35, 0] }
  },
  tablet: {
    portrait: { scale: 0.033, position: [-0.05, 0.2, 0] },
    landscape: { scale: 0.028, position: [0.05, 0.2, 0] }
  },
  desktop: {
    portrait: { scale: 0.037, position: [0.10, 0.2, 0] },
    landscape: { scale: 0.048, position: [0.10, 0.2, 0] }
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
            scale: 0.033,
            position: [2.85, 0.45, 0] as [number, number, number]
        };
    }

    // Mobile landscape adjustments
    if (deviceInfo.type === 'mobile' && deviceInfo.orientation === 'landscape') {
        newConfig.scale = 0.024;
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