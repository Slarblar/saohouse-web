import React, { useState } from 'react';

interface GridToggleProps {
  onToggle: (visible: boolean) => void;
  initialVisible?: boolean;
}

const GridToggle: React.FC<GridToggleProps> = ({ 
  onToggle, 
  initialVisible = false 
}) => {
  const [isVisible, setIsVisible] = useState(initialVisible);

  const handleToggle = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onToggle(newVisibility);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '8px',
      border: '1px solid #333',
      cursor: 'pointer',
      fontFamily: 'monospace',
      fontSize: '14px',
      userSelect: 'none',
    }} onClick={handleToggle}>
      <div style={{ marginBottom: '5px' }}>
        📐 Centering Grid
      </div>
      <div style={{ 
        fontSize: '12px',
        color: isVisible ? '#00ff00' : '#666'
      }}>
        {isVisible ? '● ON' : '○ OFF'}
      </div>
      <div style={{ 
        fontSize: '10px',
        color: '#999',
        marginTop: '3px'
      }}>
        Click to toggle
      </div>
    </div>
  );
};

export default GridToggle; 