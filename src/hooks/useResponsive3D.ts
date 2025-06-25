import { useState, useEffect } from 'react';
import { useDeviceDetection, type DeviceType, type Orientation } from './useDeviceDetection';

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
    // Check if this is a mobile device orientation change after initialization
    if (isInitialized && enableMobileReload && deviceInfo.isIPhone && 
        (previousDeviceInfo.orientation !== deviceInfo.orientation)) {
      console.log(`📱 iPhone orientation change detected: ${previousDeviceInfo.orientation} → ${deviceInfo.orientation}. Reloading...`);
      window.location.reload();
      return;
    }
    
    // Trigger loading state for responsive transitions (but not during initial load)
    if (isInitialized && onResponsiveChange && 
        (previousDeviceInfo.type !== deviceInfo.type || 
         previousDeviceInfo.orientation !== deviceInfo.orientation)) {
      console.log(`🔄 Responsive transition detected: ${previousDeviceInfo.type} ${previousDeviceInfo.orientation} → ${deviceInfo.type} ${deviceInfo.orientation}`);
      onResponsiveChange(true);
    }
    
    // Log current device detection
    console.log(`📊 Device Detection Results:`, {
      type: deviceInfo.type,
      orientation: deviceInfo.orientation,
      isIPhone: deviceInfo.isIPhone,
      isIPad: deviceInfo.isIPad,
      isAndroid: deviceInfo.isAndroid,
      screenSize: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`
    });
    
    if (deviceInfo.type === 'mobile' && deviceInfo.orientation === 'landscape') {
      console.log(`🚨 MOBILE LANDSCAPE DETECTED - Scale should be 0.094`);
    }
    
    if (deviceInfo.isIPad) {
      console.log(`🚨 IPAD DETECTED - Using tablet settings`);
    }
    
    const newConfig = settings[deviceInfo.type][deviceInfo.orientation];
    setConfig(newConfig);
    setPreviousDeviceInfo(deviceInfo);
    
    console.log(`📱 Final Config: ${deviceInfo.type} ${deviceInfo.orientation} - scale: ${newConfig.scale}, position:`, newConfig.position);
    
    // TEMPORARY DEBUG: Specifically log iPad detection and config
    if (deviceInfo.isIPad) {
      console.log('🚨 IPAD DETECTED - Applied Config:', {
        type: deviceInfo.type,
        orientation: deviceInfo.orientation,
        scale: newConfig.scale,
        position: newConfig.position,
        expectedPosition: deviceInfo.orientation === 'portrait' ? '[0.40, 0, 0]' : '[0, 0, 0]'
      });
    }
    
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