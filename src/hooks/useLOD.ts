import { useState, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useDeviceDetection } from './useDeviceDetection';

interface LODConfig {
  high: {
    segments: number;
    materialComplexity: 'high' | 'medium' | 'low';
    shadowsEnabled: boolean;
    postProcessingEnabled: boolean;
  };
  medium: {
    segments: number;
    materialComplexity: 'high' | 'medium' | 'low';
    shadowsEnabled: boolean;
    postProcessingEnabled: boolean;
  };
  low: {
    segments: number;
    materialComplexity: 'high' | 'medium' | 'low';
    shadowsEnabled: boolean;
    postProcessingEnabled: boolean;
  };
}

const defaultLODConfig: LODConfig = {
  high: {
    segments: 64,
    materialComplexity: 'high',
    shadowsEnabled: true,
    postProcessingEnabled: true,
  },
  medium: {
    segments: 32,
    materialComplexity: 'medium',
    shadowsEnabled: true,
    postProcessingEnabled: true,
  },
  low: {
    segments: 16,
    materialComplexity: 'low',
    shadowsEnabled: false,
    postProcessingEnabled: false,
  }
};

export const useLOD = (objectPosition: [number, number, number] = [0, 0, 0]) => {
  const { camera } = useThree();
  const deviceInfo = useDeviceDetection();
  const [lodLevel, setLodLevel] = useState<'high' | 'medium' | 'low'>('high');

  const lodConfig = useMemo(() => {
    // Base LOD on device type
    if (deviceInfo.type === 'mobile') {
      if (deviceInfo.screenWidth < 480) return defaultLODConfig.low;
      return defaultLODConfig.medium;
    } else if (deviceInfo.type === 'tablet') {
      return defaultLODConfig.medium;
    }
    return defaultLODConfig.high;
  }, [deviceInfo.type, deviceInfo.screenWidth]);

  useEffect(() => {
    const updateLOD = () => {
      if (!camera) return;

      // Calculate distance from camera to object
      const distance = camera.position.distanceTo({ x: objectPosition[0], y: objectPosition[1], z: objectPosition[2] } as any);
      
      // Adjust LOD based on distance and device
      if (deviceInfo.type === 'mobile') {
        setLodLevel(distance > 6 ? 'low' : 'medium');
      } else if (deviceInfo.type === 'tablet') {
        setLodLevel(distance > 8 ? 'medium' : 'high');
      } else {
        if (distance > 10) setLodLevel('medium');
        else if (distance > 15) setLodLevel('low');
        else setLodLevel('high');
      }
    };

    // Update LOD every few frames to avoid performance hit
    const interval = setInterval(updateLOD, 200);
    updateLOD(); // Initial call

    return () => clearInterval(interval);
  }, [camera, objectPosition, deviceInfo.type]);

  return {
    lodLevel,
    config: lodConfig,
    segments: lodConfig.segments,
    materialComplexity: lodConfig.materialComplexity,
    shadowsEnabled: lodConfig.shadowsEnabled,
    postProcessingEnabled: lodConfig.postProcessingEnabled,
  };
}; 