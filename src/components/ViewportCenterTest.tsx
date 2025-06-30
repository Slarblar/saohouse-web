import React from 'react';
import { useResponsive3D } from '../hooks/useResponsive3D';

const ViewportCenterTest: React.FC = () => {
  const responsiveData = useResponsive3D(
    undefined, // Default settings
    false      // IMPROVED: Disable mobile reload for production stability
  );

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 1000,
    minWidth: '250px',
    backdropFilter: 'blur(10px)'
  };

  const labelStyle: React.CSSProperties = {
    color: '#00ff88',
    fontWeight: 'bold'
  };

  const valueStyle: React.CSSProperties = {
    color: '#ffffff',
    marginLeft: '8px'
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '10px', color: '#00ff88', fontWeight: 'bold', fontSize: '14px' }}>
        📍 Manual Positioning Active
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <span style={labelStyle}>Device:</span>
        <span style={valueStyle}>{responsiveData.deviceType} {responsiveData.orientation}</span>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <span style={labelStyle}>Position:</span>
        <span style={valueStyle}>[{responsiveData.position.map(p => p.toFixed(3)).join(', ')}]</span>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <span style={labelStyle}>Scale:</span>
        <span style={valueStyle}>{responsiveData.scale.toFixed(4)}</span>
      </div>
      
      {responsiveData.viewportInfo && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <span style={labelStyle}>Viewport:</span>
            <span style={valueStyle}>
              {responsiveData.viewportInfo.width} × {responsiveData.viewportInfo.height}
            </span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={labelStyle}>Aspect Ratio:</span>
            <span style={valueStyle}>{responsiveData.viewportInfo.aspectRatio.toFixed(2)}</span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={labelStyle}>Center Scale:</span>
            <span style={valueStyle}>{responsiveData.viewportInfo.centerScale.toFixed(4)}</span>
          </div>
        </>
      )}
      
      <div style={{ 
        marginTop: '10px', 
        padding: '8px', 
        background: 'rgba(0, 255, 136, 0.1)', 
        borderRadius: '4px',
        border: '1px solid rgba(0, 255, 136, 0.3)'
      }}>
        <div style={{ color: '#00ff88', fontSize: '11px', fontWeight: 'bold' }}>
          ✓ Manual Visual Center + Viewport Scaling
        </div>
        <div style={{ color: '#ffffff', fontSize: '10px', marginTop: '2px' }}>
          Positions based on model's actual visual center
        </div>
      </div>
    </div>
  );
};

export default ViewportCenterTest; 