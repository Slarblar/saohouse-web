import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface DeviceInfo {
  type: DeviceType;
  orientation: Orientation;
  isIPhone: boolean;
  isIPad: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
  pixelRatio: number;
  screenWidth: number;
  screenHeight: number;
}

const getUserAgent = (): string => {
  return typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
};

const getDeviceInfo = (): DeviceInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = getUserAgent();
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Device identification
  const isIPhone = /iphone/.test(userAgent);
  const isIPad = /ipad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Orientation
  const orientation: Orientation = width > height ? 'landscape' : 'portrait';
  
  // Enhanced device type detection
  let type: DeviceType;
  
  if (isIPhone) {
    type = 'mobile';
    console.log('📱 Detected as iPhone (MOBILE)');
  } else if (isIPad) {
    type = 'tablet';
    console.log('📱 Detected as iPad (TABLET)');
  } else if (isAndroid) {
    // Android tablets typically have width > 600dp and are in landscape, or height > 960dp in portrait
    const androidTabletThreshold = orientation === 'landscape' ? 900 : 600;
    if (width >= androidTabletThreshold || height >= androidTabletThreshold) {
      type = 'tablet';
      console.log('📱 Detected as Android Tablet (TABLET)');
    } else {
      type = 'mobile';
      console.log('📱 Detected as Android Phone (MOBILE)');
    }
  } else if (isTouchDevice) {
    // Generic touch device detection
    if (Math.min(width, height) >= 768) {
      type = 'tablet';
      console.log('📱 Detected as Touch Tablet (TABLET)');
    } else {
      type = 'mobile';
      console.log('📱 Detected as Touch Mobile (MOBILE)');
    }
  } else {
    // Desktop/laptop detection
    type = 'desktop';
    console.log('🖥️ Detected as Desktop/Laptop (DESKTOP)');
  }
  
  console.log(`🔍 Device Details:`, {
    type,
    orientation,
    width,
    height,
    pixelRatio,
    isIPhone,
    isIPad,
    isAndroid,
    isTouchDevice
  });
  
  return {
    type,
    orientation,
    isIPhone,
    isIPad,
    isAndroid,
    isTouchDevice,
    pixelRatio,
    screenWidth: width,
    screenHeight: height
  };
};

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window !== 'undefined') {
      return getDeviceInfo();
    }
    return {
      type: 'desktop' as DeviceType,
      orientation: 'landscape' as Orientation,
      isIPhone: false,
      isIPad: false,
      isAndroid: false,
      isTouchDevice: false,
      pixelRatio: 1,
      screenWidth: 1920,
      screenHeight: 1080
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const newDeviceInfo = getDeviceInfo();
      setDeviceInfo(newDeviceInfo);
    };

    const handleOrientationChange = () => {
      // Delay to ensure orientation change is complete
      setTimeout(() => {
        const newDeviceInfo = getDeviceInfo();
        setDeviceInfo(newDeviceInfo);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Handle modern screen orientation API
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  return deviceInfo;
}; 