import { useState, useEffect, useMemo } from 'react';
import { useDeviceDetection } from './useDeviceDetection';
import { useViewportCenter } from './useViewportCenter';

interface ResponsiveCenterConfig {
  position: [number, number, number];
  scale: number;
  adjustments: {
    deviceOffset: [number, number, number];
    scaleMultiplier: number;
  };
}

interface DeviceAdjustments {
  mobile: {
    portrait: { offsetX?: number; offsetY: number; scaleMultiplier: number };
    landscape: { offsetX: number; offsetY: number; scaleMultiplier: number };
  };
  tablet: {
    portrait: { offsetX?: number; offsetY: number; scaleMultiplier: number };
    landscape: { offsetX?: number; offsetY: number; scaleMultiplier: number };
  };
  desktop: {
    landscape: { offsetX?: number; offsetY?: number; scaleMultiplier: number };
  };
}

export const useResponsiveCenterPosition = (baseScale: number = 0.03) => {
  const deviceInfo = useDeviceDetection();
  const viewportCenter = useViewportCenter(baseScale);
  
  // Device-specific fine-tuning adjustments
  const deviceAdjustments: DeviceAdjustments = useMemo(() => ({
    mobile: {
      portrait: { 
        offsetY: 0.05, // Slightly above center for better visual balance
        scaleMultiplier: 1.0 
      },
      landscape: { 
        offsetX: 0.0, // Keep centered horizontally
        offsetY: 0.1, // Move up slightly for landscape
        scaleMultiplier: 0.85 // Smaller in landscape due to limited height
      }
    },
    tablet: {
      portrait: { 
        offsetY: 0.02, // Minimal adjustment for tablets
        scaleMultiplier: 0.9 
      },
      landscape: { 
        offsetX: 0.0, // Centered horizontally
        offsetY: 0.05,
        scaleMultiplier: 0.8 
      }
    },
    desktop: {
      landscape: { 
        offsetX: 0.0, // Centered horizontally
        offsetY: 0.0, // Centered vertically
        scaleMultiplier: 1.0 // Standard scale for desktop
      }
    }
  }), []);

  const [config, setConfig] = useState<ResponsiveCenterConfig>({
    position: [0, 0, 0],
    scale: baseScale,
    adjustments: {
      deviceOffset: [0, 0, 0],
      scaleMultiplier: 1
    }
  });

  useEffect(() => {
    // Get the mathematical center from viewport calculations
    const { position: centerPosition, scale: centerScale } = viewportCenter;
    
    // Apply device-specific adjustments
    let adjustments = deviceAdjustments.desktop.landscape; // Default
    
    if (deviceInfo.type === 'mobile') {
      adjustments = deviceAdjustments.mobile[deviceInfo.orientation];
    } else if (deviceInfo.type === 'tablet') {
      adjustments = deviceAdjustments.tablet[deviceInfo.orientation];
    }

    // Calculate final position with device adjustments
    const finalPosition: [number, number, number] = [
      centerPosition[0] + (adjustments.offsetX || 0),
      centerPosition[1] + (adjustments.offsetY || 0),
      centerPosition[2]
    ];

    // Calculate final scale
    const finalScale = centerScale * adjustments.scaleMultiplier;

    setConfig({
      position: finalPosition,
      scale: finalScale,
      adjustments: {
        deviceOffset: [
          adjustments.offsetX || 0,
          adjustments.offsetY || 0,
          0
        ],
        scaleMultiplier: adjustments.scaleMultiplier
      }
    });

  }, [viewportCenter, deviceInfo, deviceAdjustments]);

  return config;
};

// Alternative: Simple center-only hook for components that just need centering
export const useMathematicalCenter = () => {
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    const updatePosition = () => {
      // Always return mathematical center regardless of device
      setPosition([0, 0, 0]);
    };

    updatePosition();

    // Listen for viewport changes
    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return position;
}; 