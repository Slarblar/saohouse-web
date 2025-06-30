import React, { useState, useEffect } from 'react';

interface DeviceInfoProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  collapsed?: boolean;
}

const DeviceInfo: React.FC<DeviceInfoProps> = ({ 
  position = 'bottom-left',
  collapsed = false 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    pixelRatio: 1,
    screenSize: '',
    viewportSize: '',
    memory: 'Unknown',
    cores: 'Unknown',
    platform: '',
    isMobile: false,
    isTouch: false,
    webglRenderer: '',
    webglVendor: '',
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      // Get WebGL info
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
      const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
      
      setDeviceInfo({
        userAgent: navigator.userAgent,
        pixelRatio: window.devicePixelRatio,
        screenSize: `${screen.width}×${screen.height}`,
        viewportSize: `${window.innerWidth}×${window.innerHeight}`,
        memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'Unknown',
        cores: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}` : 'Unknown',
        platform: navigator.platform,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTouch: 'ontouchstart' in window,
        webglRenderer: debugInfo && gl ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
        webglVendor: debugInfo && gl ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    
    return () => window.removeEventListener('resize', updateDeviceInfo);
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9998,
      padding: '8px 12px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '11px',
      lineHeight: '1.3',
      borderRadius: '6px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      maxWidth: isCollapsed ? '150px' : '300px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: '70px', left: '20px' };
      case 'top-right':
        return { ...base, top: '70px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' };
      default:
        return { ...base, bottom: '20px', left: '20px' };
    }
  };

  const getMobileType = () => {
    const ua = deviceInfo.userAgent;
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android';
    return 'Desktop';
  };

  return (
    <div 
      style={getPositionStyles()}
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: isCollapsed ? '0' : '6px',
        color: deviceInfo.isMobile ? '#f59e0b' : '#10b981'
      }}>
        {isCollapsed ? '📱 Device Info' : `📱 ${getMobileType()} Device Info`}
      </div>
      
      {!isCollapsed && (
        <>
          <div>DPR: <span style={{ color: '#60a5fa' }}>{deviceInfo.pixelRatio}x</span></div>
          <div>Screen: <span style={{ color: '#60a5fa' }}>{deviceInfo.screenSize}</span></div>
          <div>Viewport: <span style={{ color: '#60a5fa' }}>{deviceInfo.viewportSize}</span></div>
          <div>Memory: <span style={{ color: '#60a5fa' }}>{deviceInfo.memory}</span></div>
          <div>Cores: <span style={{ color: '#60a5fa' }}>{deviceInfo.cores}</span></div>
          <div>Touch: <span style={{ color: deviceInfo.isTouch ? '#10b981' : '#ef4444' }}>
            {deviceInfo.isTouch ? 'Yes' : 'No'}
          </span></div>
          
          {deviceInfo.webglRenderer !== 'Unknown' && (
            <>
              <div style={{ marginTop: '6px', fontWeight: 'bold', color: '#f59e0b' }}>GPU:</div>
              <div style={{ fontSize: '10px', wordBreak: 'break-word' }}>
                {deviceInfo.webglRenderer}
              </div>
            </>
          )}
          
          <div style={{ 
            marginTop: '6px', 
            fontSize: '9px', 
            opacity: 0.7,
            color: '#94a3b8'
          }}>
            Click to collapse
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceInfo; 