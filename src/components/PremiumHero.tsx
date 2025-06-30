import React, { useState, useEffect, useRef } from 'react';
import LoadingIndicator from './LoadingIndicator';
import Hero3DLens from './Hero3DLens';
import FPSCounter from './FPSCounter';
import DeviceInfo from './DeviceInfo';

const PremiumHero: React.FC = () => {
  const [isSceneReady, setIsSceneReady] = useState(false);
  const heroContainerRef = useRef<HTMLDivElement>(null);

  const handleSceneReady = () => {
    // PRODUCTION: Disabled debug logging
    // console.log('🎯 PremiumHero: Scene is ready, starting transition');
    setIsSceneReady(true);
  };

  useEffect(() => {
    // PRODUCTION: Disabled debug logging
    // console.log('🚀 PremiumHero: Component mounted');
    // console.log('🔍 ENVIRONMENT CHECK - Using Hero3DLens component');
    // console.log('📍 NODE_ENV:', process.env.NODE_ENV);
    // console.log('🌐 Production URL detection:', window.location.hostname);
    // console.log('🏠 Local Port Detection:', window.location.port);
    // console.log('⚙️ SHOW_CONTROLS should be enabled for local testing');
  }, []);

  useEffect(() => {
    // PRODUCTION: Disabled debug logging
    // console.log('🔄 PremiumHero: isSceneReady changed to:', isSceneReady);
    
    if (isSceneReady && heroContainerRef.current) {
      // PRODUCTION: Disabled debug logging
      // console.log('✨ PremiumHero: Starting container animation');
      
      const container = heroContainerRef.current;
      
      // Force GPU hardware acceleration
      container.style.willChange = 'opacity, filter, transform';
      
      // Set the initial state for the 3D scene (blurred and scaled up)
      container.style.opacity = '0';
      container.style.filter = 'blur(12px)';
      container.style.transform = 'scale(1.05)';

      // Begin the smooth transition
      requestAnimationFrame(() => {
        container.style.transition = 'opacity 2s ease-out, filter 2.5s ease-out, transform 2.5s ease-out';
        container.style.opacity = '1';
        container.style.filter = 'blur(0px)';
        container.style.transform = 'scale(1)';
      });

      // Clean up animation properties after it's finished to save resources
      const cleanupTimer = setTimeout(() => {
        container.style.willChange = 'auto';
        // PRODUCTION: Disabled debug logging
        // console.log('🧹 PremiumHero: Animation cleanup complete');
      }, 2500);

      return () => clearTimeout(cleanupTimer);
    }
  }, [isSceneReady]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#000' }}>
      {/* FPS Counter for performance monitoring */}
      <FPSCounter position="top-right" showDetails={true} />
      <DeviceInfo position="bottom-right" collapsed={true} />
      
      {/* The loading indicator fades out as the scene fades in */}
      <LoadingIndicator isFadingOut={isSceneReady} />

      {/* The 3D scene container, which will be animated */}
      <div
        ref={heroContainerRef}
        style={{
          opacity: 1, // TEMP: Always visible for debugging
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Hero3DLens onReady={handleSceneReady} />
      </div>
    </div>
  );
};

export default PremiumHero; 