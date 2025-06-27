import { useState, useRef, useCallback } from 'react';

interface BlurInAnimationState {
  isAnimating: boolean;
  progress: number;
  blurAmount: number;
  opacity: number;
  scale: number;
}

export const useBlurInAnimation = (duration: number = 2.0) => { // Optimized timing for coordinated intro
  const [animationState, setAnimationState] = useState<BlurInAnimationState>({
    isAnimating: false,
    progress: 0,
    blurAmount: 2.5, // Reduced starting blur for faster completion
    opacity: 1.0, // Material handles opacity directly
    scale: 1.0
  });
  
  const startTime = useRef<number>(0);

  const updateAnimation = useCallback((currentTime: number) => {
    // Initialize start time on first call
    if (startTime.current === 0) {
      startTime.current = currentTime;
    }
    
    // Calculate progress for coordinated material blur
    const elapsed = currentTime - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Coordinated easing - smooth but not too slow
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3); // Smooth material transition
    };
    
    // Material blur progression - optimized for coordination
    const materialProgress = easeOutCubic(progress);
    
    // Coordinated animation values - complete smoothly for button intro
    const blurAmount = Math.max(0, 2.5 * (1 - Math.pow(materialProgress, 1.4))); // Faster completion
    const opacity = 1.0; // Material handles this directly
    const scale = 1.0; // No scaling for stability
    
    // Complete animation efficiently for coordination
    const isStillAnimating = progress < 0.95; // Natural completion for coordination
    
    const newState: BlurInAnimationState = {
      isAnimating: isStillAnimating,
      progress: materialProgress,
      blurAmount,
      opacity,
      scale
    };
    
    setAnimationState(newState);
    
    return newState;
  }, [duration]);

  const start = useCallback(() => {
    startTime.current = 0;
    setAnimationState({
      isAnimating: true,
      progress: 0,
      blurAmount: 2.5, // Coordinated starting state
      opacity: 1.0, // Material handles opacity
      scale: 1.0
    });
  }, []);

  const reset = useCallback(() => {
    startTime.current = 0;
    setAnimationState({
      isAnimating: false,
      progress: 0,
      blurAmount: 2.5,
      opacity: 1.0,
      scale: 1.0
    });
  }, []);

  return {
    ...animationState,
    updateAnimation,
    start,
    reset
  };
}; 