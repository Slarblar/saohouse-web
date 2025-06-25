import { useState, useRef, useCallback } from 'react';

interface BlurInAnimationState {
  isAnimating: boolean;
  progress: number;
  blurAmount: number;
  opacity: number;
  scale: number;
}

export const useBlurInAnimation = (duration: number = 2.5) => { // Faster, more consistent fade-in
  const [animationState, setAnimationState] = useState<BlurInAnimationState>({
    isAnimating: false, // Don't start animating until explicitly started
    progress: 0,
    blurAmount: 6.0, // Further reduced initial blur for better visibility
    opacity: 0.3, // Higher initial visibility to prevent flicker
    scale: 1.0 // Maintain full size - no scaling animation
  });
  
  const startTime = useRef<number>(0);

  const updateAnimation = useCallback((currentTime: number) => {
    // Initialize start time on first call
    if (startTime.current === 0) {
      startTime.current = currentTime;
    }
    
    // Calculate progress
    const elapsed = currentTime - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ultra-slow materialization - like object forming from mist
    const easeOutSine = (t: number): number => Math.sin((t * Math.PI) / 2);
    const easeInQuart = (t: number): number => t * t * t * t;
    
    // Fast, consistent progression to prevent flicker
    const gentleStart = Math.pow(progress, 1.0); // Linear progression for consistency
    const blurProgress = easeOutSine(gentleStart); // Quick blur clearing
    const opacityProgress = easeInQuart(Math.max(0, progress - 0.1)); // Earlier opacity start
    
    // Fast, consistent materialization to eliminate flicker
    const blurAmount = Math.max(0, 6.0 * (1 - Math.pow(blurProgress, 0.9))); // Faster blur reduction from 6 to 0
    const opacity = Math.min(1.0, 0.3 + (0.7 * Math.pow(opacityProgress, 0.5))); // Quicker opacity progression
    const scale = 1.0; // No scaling - maintain position and size
    
    // Ensure smooth completion with coordinated timing
    const isStillAnimating = progress < 0.95; // Slightly earlier completion for reliable handoff
    
    const newState: BlurInAnimationState = {
      isAnimating: isStillAnimating,
      progress: blurProgress, // Use blur progress for tracking
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
      blurAmount: 6.0,
      opacity: 0.3,
      scale: 1.0
    });
  }, []);

  const reset = useCallback(() => {
    startTime.current = 0;
    setAnimationState({
      isAnimating: false,
      progress: 0,
      blurAmount: 6.0,
      opacity: 0.3,
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