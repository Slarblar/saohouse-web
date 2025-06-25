import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

interface ViewportConfig {
  scale: number;
  position: [number, number, number];
}

export const useViewportResponsive = (baseScale = 0.05, basePosition: [number, number, number] = [0, 0, 0]) => {
  const { viewport, size } = useThree();
  
  const responsiveConfig = useMemo((): ViewportConfig => {
    // Use viewport dimensions for responsive scaling
    const aspectRatio = size.width / size.height;
    const viewportScale = Math.min(viewport.width, viewport.height);
    
    // Calculate responsive scale based on viewport
    let scale = baseScale * (viewportScale / 10); // Adjust divisor as needed
    
    // Calculate responsive position based on aspect ratio
    let position: [number, number, number] = [...basePosition];
    
    // Adjust for different aspect ratios
    if (aspectRatio < 0.75) {
      // Portrait mobile
      scale *= 0.7;
      position = [basePosition[0] * 0.5, basePosition[1], basePosition[2]];
    } else if (aspectRatio < 1.33) {
      // Portrait tablet or square
      scale *= 0.85;
      position = [basePosition[0] * 0.75, basePosition[1], basePosition[2]];
    } else if (aspectRatio > 2) {
      // Ultra-wide landscape
      scale *= 1.2;
      position = [basePosition[0] * 1.2, basePosition[1], basePosition[2]];
    }
    
    // Clamp scale to reasonable bounds
    scale = Math.max(0.01, Math.min(0.2, scale));
    
    return { scale, position };
  }, [viewport.width, viewport.height, size.width, size.height, baseScale, basePosition]);
  
  return {
    scale: responsiveConfig.scale,
    position: responsiveConfig.position,
    viewport,
    aspectRatio: size.width / size.height,
    isPortrait: size.width < size.height,
    isLandscape: size.width >= size.height,
    viewportScale: Math.min(viewport.width, viewport.height)
  };
}; 