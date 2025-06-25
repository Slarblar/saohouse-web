import React from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  type?: 'initial' | 'transition';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = 'Loading...', 
  type = 'initial' 
}) => {
  const [shouldRender, setShouldRender] = React.useState(isVisible);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsAnimatingOut(false);
    } else if (shouldRender) {
      setIsAnimatingOut(true);
      // Delay unmounting to allow enhanced fade-out animation
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 1200); // Match the enhanced CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`loading-overlay ${type === 'transition' ? 'loading-transition' : ''} ${isAnimatingOut ? 'fade-out' : ''}`}
      style={{ opacity: isAnimatingOut ? 0 : undefined }}
    >
      <div className="loading-content">
        {/* Favicon-based animated orb */}
        <div className="loading-orb">
          <div className="orb-favicon">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              baseProfile="tiny" 
              version="1.2" 
              viewBox="0 0 256 256"
              className="favicon-svg"
            >
              <path d="M46.96,125.59c13.01,0,64.38,0,76.32,0,5.03.04,9.69-3.2,11.44-7.88.52-1.36.81-2.83.81-4.37V16.79c0-.74-.37-1.4-1.11-1.4-.66,0-1.04.63-1.09,1.29-5.72,82.32-41.88,105.31-86.31,106.99-1.15.04-1.21,1.91-.06,1.91Z" fill="currentColor"/>
              <path d="M209.18,130.43c-30.36-.87-54.92-11.6-59.68-51.17-.05-.84-.09-1.69-.12-2.53-.04-1.15-1.91-1.21-1.91-.06l-.04,36.64c0,12.56-8.91,23.44-21.55,23.84h0c-.74.02-2.15.01-2.9.01h0c-3.44,0-16.67,0-20.35,0-.85.28-.71,1.82.34,1.86.17,0,.34.02.51.02,2.83.19,16.71,1.89,17.01,17.02v83.12c0,.74.37,1.4,1.11,1.4.66,0,1.04-.63,1.09-1.29,5.72-82.32,41.88-105.31,86.31-106.99,1.1-.04,1.2-1.76.19-1.89Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="orb-ring orb-ring-1"></div>
          <div className="orb-ring orb-ring-2"></div>
          <div className="orb-ring orb-ring-3"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 