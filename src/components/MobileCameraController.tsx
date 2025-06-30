import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraOptimization {
  fov: number;
  position: [number, number, number];
  lensDistortionReduction: {
    vignetteMultiplier: number;
    chromaticAberrationMultiplier: number;
    barrelDistortionAdjustment: number;
  };
}

interface MobileCameraControllerProps {
  optimization: CameraOptimization;
}

export const MobileCameraController: React.FC<MobileCameraControllerProps> = ({ optimization }) => {
  const { camera } = useThree();

  // Apply camera settings when optimization changes (but not on initial load to prevent jump)
  useEffect(() => {
    // PRODUCTION: Disabled debug logging
    // console.log('🎥 Mobile Camera Optimization Active:', {
    //   fov: optimization.fov,
    //   position: optimization.position,
    //   lensReduction: optimization.lensDistortionReduction
    // });
  }, [optimization]);

  // Additional viewport-based FOV adjustment for extreme aspect ratios
  useEffect(() => {
    const handleResize = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        const aspectRatio = window.innerWidth / window.innerHeight;
        
        // Adjust FOV based on aspect ratio to prevent fisheye on very wide/tall screens
        let fovAdjustment = 0;
        
        if (aspectRatio > 2.5) {
          // Very wide screens (ultrawide monitors) - reduce FOV
          fovAdjustment = -5;
        } else if (aspectRatio < 0.6) {
          // Very tall screens (mobile portrait) - reduce FOV more
          fovAdjustment = -8;
        }
        
        const newFov = optimization.fov + fovAdjustment;
        camera.fov = Math.max(45, Math.min(80, newFov)); // Clamp between 45-80 degrees
        camera.updateProjectionMatrix();
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [optimization.fov, camera]);

  // This component doesn't render anything visible
  return null;
}; 