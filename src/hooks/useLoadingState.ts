import { useState, useEffect, useRef, useCallback } from 'react';

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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const completeInitialLoading = useCallback(() => {
    if (!initialLoadingRef.current) return;
    
    initialLoadingRef.current = false;
    setLoadingState(prev => ({ ...prev, isLoading: false }));
    
    // Smooth completion with slight delay for natural feel
    const completionTimeout = window.setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }, 800);
    
    return () => window.clearTimeout(completionTimeout);
  }, []);

  const startTransition = useCallback((message: string) => {
    if (initialLoadingRef.current) return;
    
    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    
    setLoadingState({
      isLoading: true,
      loadingType: 'transition',
      message
    });
    
    // Auto-hide after smooth timing
    transitionTimeoutRef.current = window.setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }, 800); // Slightly longer for smoother experience
  }, []);

  const completeTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    
    // Coordinated delay for smooth transition completion
    setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }, 300); // Smooth completion timing
  }, []);

  const manualComplete = useCallback(() => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    
    // Coordinated delay for smooth transition completion
    setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }, 300); // Smooth completion timing
  }, []);

  return {
    ...loadingState,
    completeInitialLoading,
    startTransition,
    completeTransition,
    manualComplete
  };
}; 