import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useDeviceDetection } from './useDeviceDetection';

interface PerformanceState {
  fps: number;
  averageFps: number;
  frameTime: number;
  memoryUsage: number | null;
  qualityLevel: 'high' | 'medium' | 'low' | 'potato';
  adaptiveQuality: boolean;
}

interface PerformanceThresholds {
  highQualityFps: number;
  mediumQualityFps: number;
  lowQualityFps: number;
  frameTimeTarget: number;
}

const defaultThresholds: PerformanceThresholds = {
  highQualityFps: 55,
  mediumQualityFps: 45,
  lowQualityFps: 30,
  frameTimeTarget: 16.67, // 60fps target
};

export const usePerformanceMonitor = (
  thresholds: Partial<PerformanceThresholds> = {},
  adaptiveQuality = true
) => {
  const deviceInfo = useDeviceDetection();
  const config = { ...defaultThresholds, ...thresholds };
  
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    fps: 60,
    averageFps: 60,
    frameTime: 16.67,
    memoryUsage: null,
    qualityLevel: deviceInfo.type === 'mobile' ? 'medium' : 'high',
    adaptiveQuality,
  });

  const frameTimeRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const qualityStabilityRef = useRef<number>(0);

  // Monitor performance in real-time
  useFrame(() => {
    const now = performance.now();
    const frameTime = now - lastTimeRef.current;
    lastTimeRef.current = now;

    if (frameTime > 0) {
      // Track frame times
      frameTimeRef.current.push(frameTime);
      if (frameTimeRef.current.length > 60) {
        frameTimeRef.current.shift(); // Keep last 60 frames
      }

      frameCountRef.current++;

      // Update performance metrics every 30 frames
      if (frameCountRef.current % 30 === 0) {
        const avgFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
        const currentFps = 1000 / avgFrameTime;
        const averageFps = frameTimeRef.current.length > 0 
          ? 1000 / avgFrameTime 
          : performanceState.averageFps;

        // Get memory usage if available
        const memoryUsage = (performance as any).memory 
          ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 
          : null;

        setPerformanceState(prev => ({
          ...prev,
          fps: currentFps,
          averageFps,
          frameTime: avgFrameTime,
          memoryUsage,
        }));

        // Adaptive quality adjustment
        if (adaptiveQuality) {
          adjustQualityLevel(currentFps, averageFps);
        }
      }
    }
  });

  const adjustQualityLevel = (currentFps: number, averageFps: number) => {
    qualityStabilityRef.current++;

    // Only adjust quality if performance has been stable for a while
    if (qualityStabilityRef.current < 60) return; // Wait 2 seconds at 30fps

    const targetFps = deviceInfo.type === 'mobile' ? 30 : 45;
    
    setPerformanceState(prev => {
      let newQualityLevel = prev.qualityLevel;

      // Downgrade quality if performance is poor
      if (averageFps < config.lowQualityFps && prev.qualityLevel !== 'potato') {
        if (prev.qualityLevel === 'high') newQualityLevel = 'medium';
        else if (prev.qualityLevel === 'medium') newQualityLevel = 'low';
        else if (prev.qualityLevel === 'low') newQualityLevel = 'potato';
        
        qualityStabilityRef.current = 0; // Reset stability counter
      }
      // Upgrade quality if performance is good
      else if (averageFps > config.highQualityFps && prev.qualityLevel !== 'high') {
        if (prev.qualityLevel === 'potato') newQualityLevel = 'low';
        else if (prev.qualityLevel === 'low') newQualityLevel = 'medium';
        else if (prev.qualityLevel === 'medium') newQualityLevel = 'high';
        
        qualityStabilityRef.current = 0; // Reset stability counter
      }

      return {
        ...prev,
        qualityLevel: newQualityLevel,
      };
    });
  };

  // Get quality settings based on current performance level
  const getQualitySettings = () => {
    const { qualityLevel } = performanceState;
    
    switch (qualityLevel) {
      case 'high':
        return {
          pixelRatio: Math.min(deviceInfo.pixelRatio, 2),
          antialias: true,
          shadows: true,
          postProcessing: true,
          materialComplexity: 'high' as const,
          lodLevel: 'high' as const,
        };
      case 'medium':
        return {
          pixelRatio: Math.min(deviceInfo.pixelRatio, 1.5),
          antialias: true,
          shadows: !deviceInfo.isTouchDevice,
          postProcessing: true,
          materialComplexity: 'medium' as const,
          lodLevel: 'medium' as const,
        };
      case 'low':
        return {
          pixelRatio: 1,
          antialias: false,
          shadows: false,
          postProcessing: false,
          materialComplexity: 'low' as const,
          lodLevel: 'low' as const,
        };
      case 'potato':
        return {
          pixelRatio: 1,
          antialias: false,
          shadows: false,
          postProcessing: false,
          materialComplexity: 'low' as const,
          lodLevel: 'low' as const,
        };
    }
  };

  const enableAdaptiveQuality = () => {
    setPerformanceState(prev => ({ ...prev, adaptiveQuality: true }));
  };

  const disableAdaptiveQuality = () => {
    setPerformanceState(prev => ({ ...prev, adaptiveQuality: false }));
  };

  const setQualityLevel = (level: 'high' | 'medium' | 'low' | 'potato') => {
    setPerformanceState(prev => ({ ...prev, qualityLevel: level }));
  };

  return {
    ...performanceState,
    qualitySettings: getQualitySettings(),
    enableAdaptiveQuality,
    disableAdaptiveQuality,
    setQualityLevel,
    isPerformanceGood: performanceState.averageFps >= config.mediumQualityFps,
    isPerformancePoor: performanceState.averageFps < config.lowQualityFps,
  };
}; 