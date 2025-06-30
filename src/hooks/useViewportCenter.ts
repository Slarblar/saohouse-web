import { useState, useEffect } from 'react';
import * as THREE from 'three';

interface ViewportCenter {
  position: [number, number, number];
  scale: number;
  aspectRatio: number;
  isPortrait: boolean;
}

export const useViewportCenter = (baseScale: number = 0.03) => {
  const [centerConfig, setCenterConfig] = useState<ViewportCenter>({
    position: [0, 0, 0],
    scale: baseScale,
    aspectRatio: 1,
    isPortrait: false
  });

  const calculateCenter = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    const isPortrait = height > width;
    
    // Mathematical center calculation based on viewport
    // Uses relative positioning to maintain true center
    const centerX = 0; // Always center horizontally
    const centerY = 0; // Always center vertically
    const centerZ = 0; // Maintain depth
    
    // Responsive scale calculation
    // Smaller screens get proportionally larger logos
    const baseViewportSize = 1000; // Reference size
    const currentViewportSize = Math.sqrt(width * height);
    const scaleMultiplier = currentViewportSize / baseViewportSize;
    
    // Clamp scale between reasonable bounds
    const minScale = baseScale * 0.6;
    const maxScale = baseScale * 1.8;
    const calculatedScale = Math.max(minScale, Math.min(maxScale, baseScale * scaleMultiplier));
    
    return {
      position: [centerX, centerY, centerZ] as [number, number, number],
      scale: calculatedScale,
      aspectRatio,
      isPortrait
    };
  };

  const updateCenter = () => {
    const newConfig = calculateCenter();
    setCenterConfig(newConfig);
  };

  useEffect(() => {
    // Initial calculation
    updateCenter();

    // Smooth resize handling with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateCenter, 100); // 100ms debounce
    };

    // Orientation change handling
    const handleOrientationChange = () => {
      // Delay to let the browser settle after orientation change
      setTimeout(updateCenter, 250);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(resizeTimeout);
    };
  }, [baseScale]);

  return centerConfig;
}; 