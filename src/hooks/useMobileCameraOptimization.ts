import { useEffect, useState } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

interface CameraOptimization {
  fov: number;
  position: [number, number, number];
  lensDistortionReduction: {
    vignetteMultiplier: number;
    chromaticAberrationMultiplier: number;
    barrelDistortionAdjustment: number;
  };
}

export const useMobileCameraOptimization = () => {
  const deviceInfo = useDeviceDetection();
  const [optimization, setOptimization] = useState<CameraOptimization>({
    fov: 75,
    position: [0, 0, 3],
    lensDistortionReduction: {
      vignetteMultiplier: 1.0,
      chromaticAberrationMultiplier: 1.0,
      barrelDistortionAdjustment: 0.0
    }
  });

  useEffect(() => {
    const isMobile = deviceInfo.type === 'mobile';
    const isPortrait = deviceInfo.orientation === 'portrait';

    let newOptimization: CameraOptimization;

    if (isMobile) {
      // Mobile-specific camera optimization to reduce fisheye effect
      newOptimization = {
        fov: isPortrait ? 60 : 65, // Reduced FOV for more natural perspective
        position: [0, 0, 3.5], // Slightly further back to reduce distortion
        lensDistortionReduction: {
          vignetteMultiplier: 0.4, // Reduce vignette significantly on mobile
          chromaticAberrationMultiplier: 0.3, // Reduce chromatic aberration
          barrelDistortionAdjustment: -0.05 // Slight pincushion to counter fisheye
        }
      };
    } else if (deviceInfo.type === 'tablet') {
      // Tablet optimization - middle ground
      newOptimization = {
        fov: isPortrait ? 65 : 70,
        position: [0, 0, 3.2],
        lensDistortionReduction: {
          vignetteMultiplier: 0.7,
          chromaticAberrationMultiplier: 0.6,
          barrelDistortionAdjustment: -0.02
        }
      };
    } else {
      // Desktop - keep original settings
      newOptimization = {
        fov: 75,
        position: [0, 0, 3],
        lensDistortionReduction: {
          vignetteMultiplier: 1.0,
          chromaticAberrationMultiplier: 1.0,
          barrelDistortionAdjustment: 0.0
        }
      };
    }

    setOptimization(newOptimization);

    // Debug logging for mobile optimization
    console.log('📱 Mobile Camera Optimization Applied:', {
      deviceType: deviceInfo.type,
      orientation: deviceInfo.orientation,
      fov: newOptimization.fov,
      position: newOptimization.position,
      lensReduction: newOptimization.lensDistortionReduction
    });

  }, [deviceInfo.type, deviceInfo.orientation]);

  return optimization;
}; 