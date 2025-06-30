import { useState, useEffect } from 'react';

interface SafariViewportInfo {
  isSafari: boolean;
  isMobileSafari: boolean;
  actualViewportHeight: number;
  documentHeight: number;
  innerHeight: number;
  visualViewportHeight: number;
  safariUIOffset: number;
  isLandscape: boolean;
  needsCenteringFix: boolean;
}

export const useSafariViewportFix = () => {
  const [safariInfo, setSafariInfo] = useState<SafariViewportInfo>({
    isSafari: false,
    isMobileSafari: false,
    actualViewportHeight: 0,
    documentHeight: 0,
    innerHeight: 0,
    visualViewportHeight: 0,
    safariUIOffset: 0,
    isLandscape: false,
    needsCenteringFix: false,
  });

  const detectSafari = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    // More comprehensive Safari detection
    const isSafari = (/safari/.test(userAgent) && !/chrome/.test(userAgent) && !/android/.test(userAgent)) ||
                     (/webkit/.test(userAgent) && /version/.test(userAgent));
    const isMobileSafari = isSafari && (/mobile/.test(userAgent) || /iphone/.test(userAgent) || /ipad/.test(userAgent));
    
    // Debug logging for Safari detection
    console.log('🔍 Safari Detection:', {
      userAgent,
      isSafari,
      isMobileSafari,
      isLandscape: window.innerWidth > window.innerHeight
    });
    
    return { isSafari, isMobileSafari };
  };

  const calculateViewportMetrics = () => {
    const { isSafari, isMobileSafari } = detectSafari();
    const isLandscape = window.innerWidth > window.innerHeight;
    
    // Get various height measurements
    const innerHeight = window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;
    
    // Use Visual Viewport API if available (Safari iOS 13+)
    const visualViewportHeight = window.visualViewport?.height ?? innerHeight;
    
    // Calculate actual usable viewport height
    let actualViewportHeight = innerHeight;
    let safariUIOffset = 0;
    
    if (isMobileSafari && isLandscape) {
      // Safari mobile landscape specific calculations
      const screenHeight = window.screen.height;
      
      // In landscape, Safari's UI takes up space differently
      // The visual viewport is more accurate than innerHeight
      actualViewportHeight = visualViewportHeight;
      
      // Calculate Safari UI offset (address bar, toolbar, etc.)
      safariUIOffset = innerHeight - visualViewportHeight;
      
      // Additional compensation for Safari's new UI changes
      if (safariUIOffset > 0) {
        // Safari is showing UI elements, adjust accordingly
        actualViewportHeight = visualViewportHeight;
      } else {
        // Safari UI is hidden, use full viewport
        actualViewportHeight = Math.min(innerHeight, screenHeight);
      }
    }
    
    // Determine if we need centering fix
    const needsCenteringFix = isMobileSafari && isLandscape;
    
    // Debug logging for viewport calculations
    if (isMobileSafari && isLandscape) {
      console.log('📱 Safari Viewport Info:', {
        innerHeight,
        visualViewportHeight,
        safariUIOffset,
        actualViewportHeight,
        needsCenteringFix,
        heightDifference: Math.abs(innerHeight - visualViewportHeight)
      });
    }
    
    return {
      isSafari,
      isMobileSafari,
      actualViewportHeight,
      documentHeight,
      innerHeight,
      visualViewportHeight,
      safariUIOffset,
      isLandscape,
      needsCenteringFix,
    };
  };

  useEffect(() => {
    const updateSafariInfo = () => {
      const newInfo = calculateViewportMetrics();
      setSafariInfo(newInfo);
    };

    // Initial calculation
    updateSafariInfo();

    // Listen for viewport changes
    const handleResize = () => {
      // Debounce rapid resize events
      setTimeout(updateSafariInfo, 100);
    };

    const handleOrientationChange = () => {
      // Safari needs more time to settle after orientation change
      setTimeout(updateSafariInfo, 300);
    };

    const handleVisualViewportChange = () => {
      // Visual Viewport API changes (Safari UI show/hide)
      setTimeout(updateSafariInfo, 150);
    };

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Visual Viewport API for Safari UI changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
    };
  }, []);

  return safariInfo;
};

// Helper function to calculate Safari-adjusted vertical position
export const getSafariAdjustedPosition = (
  originalPosition: [number, number, number],
  safariInfo: SafariViewportInfo
): [number, number, number] => {
  const [x, y, z] = originalPosition;
  
  // Always apply adjustment for Safari mobile landscape (simplified logic)
  if (safariInfo.isMobileSafari && safariInfo.isLandscape) {
    // Safari landscape specific adjustments - move up by 0.18 units
    const baseAdjustment = 0.18; // User requested adjustment
    const uiRatio = safariInfo.safariUIOffset / safariInfo.innerHeight;
    
    // Start with base upward adjustment
    let yAdjustment = baseAdjustment;
    
    if (uiRatio > 0.1) {
      // Significant UI showing - additional adjustment
      yAdjustment += 0.03;
    } else if (uiRatio < 0.05) {
      // UI mostly hidden - keep base adjustment
      yAdjustment = baseAdjustment;
    }
    
    // Additional fine adjustment based on viewport height difference
    const heightDiff = safariInfo.innerHeight - safariInfo.visualViewportHeight;
    if (heightDiff > 30) {
      // Large height difference indicates Safari UI is affecting centering
      yAdjustment += heightDiff * 0.0002; // Fine adjustment factor (positive to move up)
    }
    
    const adjustedPosition: [number, number, number] = [x, y + yAdjustment, z];
    
    // Debug logging for position adjustment
    console.log('🎯 Safari Position Adjustment:', {
      original: originalPosition,
      adjusted: adjustedPosition,
      yAdjustment,
      uiRatio,
      heightDiff,
      baseAdjustment
    });
    
    return adjustedPosition;
  }
  
  return originalPosition;
}; 