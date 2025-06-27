import { useState, useEffect, useRef, useCallback } from 'react';

interface LoadingPhase {
  id: string;
  name: string;
  isComplete: boolean;
  priority: number; // Higher priority phases block lower ones
}

interface LoadingState {
  isLoading: boolean;
  loadingType: 'initial' | 'transition';
  message: string;
  currentPhase: string;
  progress: number; // 0-100
}

// Centralized loading configuration - no more hardcoded values!
const LOADING_CONFIG = {
  phases: {
    SETTINGS: { id: 'settings', name: 'Loading Settings...', priority: 1 },
    MODEL: { id: 'model', name: 'Loading 3D Model...', priority: 2 },
    MATERIALS: { id: 'materials', name: 'Preparing Materials...', priority: 3 },
    PRESENTATION: { id: 'presentation', name: 'Starting Experience...', priority: 4 }
  },
  transitions: {
    PHASE_COMPLETE_DELAY: 100, // Minimal delay for smooth transitions
    FINAL_COMPLETION_DELAY: 200, // Brief final completion
    FORCE_COMPLETE_TIMEOUT: 8000 // Fallback if something hangs
  }
} as const;

export const useLoadingState = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    loadingType: 'initial',
    message: 'Initializing SAO House...',
    currentPhase: LOADING_CONFIG.phases.SETTINGS.id,
    progress: 0
  });

  const [phases, setPhases] = useState<Record<string, LoadingPhase>>({
    [LOADING_CONFIG.phases.SETTINGS.id]: { ...LOADING_CONFIG.phases.SETTINGS, isComplete: false },
    [LOADING_CONFIG.phases.MODEL.id]: { ...LOADING_CONFIG.phases.MODEL, isComplete: false },
    [LOADING_CONFIG.phases.MATERIALS.id]: { ...LOADING_CONFIG.phases.MATERIALS, isComplete: false },
    [LOADING_CONFIG.phases.PRESENTATION.id]: { ...LOADING_CONFIG.phases.PRESENTATION, isComplete: false }
  });

  const forceCompleteTimeoutRef = useRef<number | undefined>(undefined);
  const transitionTimeoutRef = useRef<number | undefined>(undefined);

  // Calculate current phase and progress
  const updateLoadingState = useCallback(() => {
    const phaseArray = Object.values(phases).sort((a, b) => a.priority - b.priority);
    const completedPhases = phaseArray.filter(p => p.isComplete);
    const progress = (completedPhases.length / phaseArray.length) * 100;
    
    // Find current active phase
    const currentPhase = phaseArray.find(p => !p.isComplete);
    const allComplete = completedPhases.length === phaseArray.length;
    
    if (allComplete && loadingState.isLoading) {
      // All phases complete - finish loading
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        currentPhase: LOADING_CONFIG.phases.PRESENTATION.id,
        message: 'Experience Ready!'
      }));
    } else if (currentPhase) {
      // Update to current phase
      setLoadingState(prev => ({
        ...prev,
        currentPhase: currentPhase.id,
        message: currentPhase.name,
        progress: Math.round(progress)
      }));
    }
  }, [phases, loadingState.isLoading]);

  // Update state when phases change
  useEffect(() => {
    updateLoadingState();
  }, [updateLoadingState]);

  // Force complete fallback
  useEffect(() => {
    if (loadingState.isLoading) {
             forceCompleteTimeoutRef.current = window.setTimeout(() => {
         // PERFORMANCE: Timeout warning logging disabled for optimal FPS
         // console.warn('🚨 Loading timeout reached - force completing');
         setPhases(prev => {
           const updated = { ...prev };
           Object.keys(updated).forEach(key => {
             updated[key] = { ...updated[key], isComplete: true };
           });
           return updated;
         });
       }, LOADING_CONFIG.transitions.FORCE_COMPLETE_TIMEOUT);
    }

    return () => {
      if (forceCompleteTimeoutRef.current) {
        window.clearTimeout(forceCompleteTimeoutRef.current);
      }
    };
  }, [loadingState.isLoading]);

  // Phase completion methods
  const completePhase = useCallback((phaseId: string) => {
    setPhases(prev => ({
      ...prev,
      [phaseId]: { ...prev[phaseId], isComplete: true }
    }));
  }, []);

  const completeAllPhases = useCallback(() => {
    setPhases(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], isComplete: true };
      });
      return updated;
    });
  }, []);

  // Transition methods
  const startTransition = useCallback((message: string) => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      loadingType: 'transition',
      message,
      progress: 0
    }));
    
    transitionTimeoutRef.current = window.setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }, LOADING_CONFIG.transitions.PHASE_COMPLETE_DELAY);
  }, []);

  const completeTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    
    setTimeout(() => {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
    }, LOADING_CONFIG.transitions.FINAL_COMPLETION_DELAY);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (forceCompleteTimeoutRef.current) {
        window.clearTimeout(forceCompleteTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...loadingState,
    phases,
    completePhase,
    completeAllPhases,
    startTransition,
    completeTransition,
    // Legacy methods for backward compatibility
    completeInitialLoading: completeAllPhases,
    manualComplete: completeAllPhases
  };
}; 