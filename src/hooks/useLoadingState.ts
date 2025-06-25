import { useState, useEffect, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingType: 'initial' | 'transition';
  message: string;
}

export const useLoadingState = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    loadingType: 'initial',
    message: 'Loading experience...'
  });


  
  const transitionTimeoutRef = useRef<number | undefined>(undefined);
  const initialLoadingRef = useRef(true);

  // Handle initial loading completion with coordinated timing
  const completeInitialLoading = () => {
    if (!initialLoadingRef.current) return;
    
    console.log('🎬 Initiating smooth loading completion sequence');
    
    // Coordinated transition for ultra-smooth UX
    // This timing coordinates with Canvas fade-in and blur-in animation
    setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
      initialLoadingRef.current = false;
      console.log('✨ Loading overlay dismissed - Canvas and 3D model ready');
    }, 200); // Short delay to ensure Canvas is ready
  };

  // Handle responsive transitions with improved timing
  const startTransition = (message: string = 'Adjusting layout...') => {
    if (initialLoadingRef.current) return; // Don't show transition during initial load
    
    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    console.log('🔄 Starting layout transition:', message);
    setLoadingState({
      isLoading: true,
      loadingType: 'transition',
      message
    });
    
    // Auto-hide after smooth timing
    transitionTimeoutRef.current = setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
      console.log('✅ Layout transition completed');
    }, 800); // Slightly longer for smoother experience
  };

  const completeTransition = () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Coordinated delay for smooth transition completion
    setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
      console.log('✅ Transition manually completed');
    }, 300); // Smooth completion timing
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...loadingState,
    completeInitialLoading,
    startTransition,
    completeTransition
  };
}; 