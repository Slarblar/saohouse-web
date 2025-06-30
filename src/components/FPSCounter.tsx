import React, { useRef, useEffect, useState } from 'react';

interface FPSCounterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
}

const FPSCounter: React.FC<FPSCounterProps> = ({ 
  position = 'top-left', 
  showDetails = true 
}) => {
  const [fps, setFps] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const [minFps, setMinFps] = useState(Infinity);
  const [maxFps, setMaxFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    let animationId: number;

    const updateFPS = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      
      frameCountRef.current++;
      
      // Update FPS every 100ms for smooth display
      if (deltaTime >= 100) {
        const currentFps = Math.round((frameCountRef.current * 1000) / deltaTime);
        
        setFps(currentFps);
        
        // Update min/max
        setMinFps(prev => Math.min(prev, currentFps));
        setMaxFps(prev => Math.max(prev, currentFps));
        
        // Keep rolling average of last 30 samples
        fpsHistoryRef.current.push(currentFps);
        if (fpsHistoryRef.current.length > 30) {
          fpsHistoryRef.current.shift();
        }
        
        const average = Math.round(
          fpsHistoryRef.current.reduce((sum, val) => sum + val, 0) / 
          fpsHistoryRef.current.length
        );
        setAvgFps(average);
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(updateFPS);
    };

    updateFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      padding: '12px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.4',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      minWidth: '120px',
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' };
      default:
        return { ...base, top: '20px', left: '20px' };
    }
  };

  const getFpsColor = (fps: number): string => {
    if (fps >= 55) return '#10b981'; // Green
    if (fps >= 45) return '#f59e0b'; // Yellow
    if (fps >= 30) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div style={getPositionStyles()}>
      <div style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: getFpsColor(fps),
        marginBottom: showDetails ? '8px' : '0'
      }}>
        {fps} FPS
      </div>
      
      {showDetails && (
        <>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Avg: <span style={{ color: getFpsColor(avgFps) }}>{avgFps}</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Min: <span style={{ color: getFpsColor(minFps) }}>{minFps === Infinity ? 0 : minFps}</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Max: <span style={{ color: getFpsColor(maxFps) }}>{maxFps}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default FPSCounter; 