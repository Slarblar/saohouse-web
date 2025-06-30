import { useState, useEffect, useRef } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

interface BatteryState {
  level: number | null;
  charging: boolean | null;
  chargingTime: number | null;
  dischargingTime: number | null;
  isLowBattery: boolean;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical' | 'unknown';
  powerSaverMode: boolean;
  adaptivePowerSaving: boolean;
}

interface PowerSavingSettings {
  lowBatteryThreshold: number;
  criticalBatteryThreshold: number;
  enableThermalThrottling: boolean;
  enableBatteryOptimization: boolean;
}

const defaultSettings: PowerSavingSettings = {
  lowBatteryThreshold: 0.3, // 30%
  criticalBatteryThreshold: 0.15, // 15%
  enableThermalThrottling: true,
  enableBatteryOptimization: true,
};

export const useBatteryOptimization = (
  settings: Partial<PowerSavingSettings> = {}
) => {
  const config = { ...defaultSettings, ...settings };
  const deviceInfo = useDeviceDetection();
  
  const [batteryState, setBatteryState] = useState<BatteryState>({
    level: null,
    charging: null,
    chargingTime: null,
    dischargingTime: null,
    isLowBattery: false,
    thermalState: 'unknown',
    powerSaverMode: false,
    adaptivePowerSaving: config.enableBatteryOptimization,
  });

  const thermalCheckRef = useRef<number>(0);
  const batteryCheckRef = useRef<number>(0);

  // Battery API monitoring
  useEffect(() => {
    if (!('getBattery' in navigator) || !deviceInfo.isTouchDevice) return;

    const monitorBattery = async () => {
      try {
        const battery = await (navigator as any).getBattery();
        
        const updateBatteryInfo = () => {
          const level = battery.level;
          const charging = battery.charging;
          const isLowBattery = level < config.lowBatteryThreshold;
          const isCriticalBattery = level < config.criticalBatteryThreshold;
          
          setBatteryState(prev => ({
            ...prev,
            level,
            charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            isLowBattery,
            powerSaverMode: prev.adaptivePowerSaving && (isLowBattery || isCriticalBattery),
          }));
        };

        // Initial update
        updateBatteryInfo();

        // Listen for battery events
        battery.addEventListener('chargingchange', updateBatteryInfo);
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingtimechange', updateBatteryInfo);
        battery.addEventListener('dischargingtimechange', updateBatteryInfo);

        return () => {
          battery.removeEventListener('chargingchange', updateBatteryInfo);
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingtimechange', updateBatteryInfo);
          battery.removeEventListener('dischargingtimechange', updateBatteryInfo);
        };
      } catch (error) {
        console.log('Battery API not available');
      }
    };

    monitorBattery();
  }, [config.lowBatteryThreshold, config.criticalBatteryThreshold, deviceInfo.isTouchDevice]);

  // Thermal monitoring (experimental)
  useEffect(() => {
    if (!config.enableThermalThrottling || !deviceInfo.isTouchDevice) return;

    const monitorThermalState = () => {
      thermalCheckRef.current++;
      
      // Check for thermal indicators (experimental)
      const connectionType = (navigator as any).connection?.effectiveType;
      const deviceMemory = (navigator as any).deviceMemory;
      
      // Heuristic thermal detection based on performance degradation
      if (thermalCheckRef.current % 60 === 0) { // Check every 2 seconds at 30fps
        const now = performance.now();
        const memoryPressure = deviceMemory && deviceMemory < 4; // Low memory devices tend to throttle
        const slowConnection = connectionType && ['slow-2g', '2g'].includes(connectionType);
        
        let thermalState: BatteryState['thermalState'] = 'nominal';
        
        if (memoryPressure || slowConnection) {
          thermalState = 'fair';
        }
        
        // Additional heuristics could be added here
        
        setBatteryState(prev => ({
          ...prev,
          thermalState,
        }));
      }
    };

    const interval = setInterval(monitorThermalState, 100);
    return () => clearInterval(interval);
  }, [config.enableThermalThrottling, deviceInfo.isTouchDevice]);

  // Get optimized settings based on battery and thermal state
  const getOptimizedSettings = () => {
    const { level, charging, isLowBattery, thermalState, powerSaverMode, adaptivePowerSaving } = batteryState;
    
    // Base settings
    let settings = {
      targetFps: 60,
      pixelRatio: deviceInfo.pixelRatio,
      enablePostProcessing: true,
      enableShadows: true,
      enableAntialiasing: true,
      animationQuality: 'high' as 'high' | 'medium' | 'low',
      materialComplexity: 'high' as 'high' | 'medium' | 'low',
    };

    // Apply power saving optimizations
    if (adaptivePowerSaving && !charging) {
      if (level !== null && level < config.criticalBatteryThreshold) {
        // Critical battery - maximum power saving
        settings = {
          targetFps: 15,
          pixelRatio: 1,
          enablePostProcessing: false,
          enableShadows: false,
          enableAntialiasing: false,
          animationQuality: 'low',
          materialComplexity: 'low',
        };
      } else if (isLowBattery) {
        // Low battery - moderate power saving
        settings = {
          targetFps: 30,
          pixelRatio: Math.min(deviceInfo.pixelRatio, 1.5),
          enablePostProcessing: false,
          enableShadows: false,
          enableAntialiasing: true,
          animationQuality: 'medium',
          materialComplexity: 'medium',
        };
      }
    }

    // Apply thermal throttling
    if (config.enableThermalThrottling) {
      switch (thermalState) {
        case 'fair':
          settings.targetFps = Math.min(settings.targetFps, 45);
          settings.pixelRatio = Math.min(settings.pixelRatio, 1.5);
          break;
        case 'serious':
          settings.targetFps = Math.min(settings.targetFps, 30);
          settings.pixelRatio = 1;
          settings.enablePostProcessing = false;
          break;
        case 'critical':
          settings.targetFps = 15;
          settings.pixelRatio = 1;
          settings.enablePostProcessing = false;
          settings.enableShadows = false;
          settings.enableAntialiasing = false;
          break;
      }
    }

    return settings;
  };

  const enablePowerSaverMode = () => {
    setBatteryState(prev => ({ ...prev, powerSaverMode: true }));
  };

  const disablePowerSaverMode = () => {
    setBatteryState(prev => ({ ...prev, powerSaverMode: false }));
  };

  const toggleAdaptivePowerSaving = () => {
    setBatteryState(prev => ({ ...prev, adaptivePowerSaving: !prev.adaptivePowerSaving }));
  };

  return {
    ...batteryState,
    optimizedSettings: getOptimizedSettings(),
    enablePowerSaverMode,
    disablePowerSaverMode,
    toggleAdaptivePowerSaving,
    isBatteryApiSupported: 'getBattery' in navigator,
    recommendsPowerSaving: batteryState.isLowBattery || batteryState.thermalState === 'serious',
  };
}; 