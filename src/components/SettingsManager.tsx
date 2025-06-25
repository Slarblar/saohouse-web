import React, { useState } from 'react';
import type { PostProcessingSettings } from './ToneMappingEffect';

interface SettingsManagerProps {
  currentSettings: PostProcessingSettings;
  onSettingsLoad: (settings: PostProcessingSettings) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ currentSettings, onSettingsLoad }) => {
  const [showManager, setShowManager] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);

  // Check if backup exists on component mount
  React.useEffect(() => {
    const backupKey = 'saohouse-settings-backup';
    const backupData = localStorage.getItem(backupKey);
    setHasBackup(!!backupData);
  }, []);

  const exportSettings = () => {
    const settingsData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: currentSettings
    };
    
    const dataStr = JSON.stringify(settingsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `saohouse-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        
        if (data.settings) {
          onSettingsLoad(data.settings);
          alert('Settings imported successfully!');
        } else {
          alert('Invalid settings file format');
        }
      } catch (error) {
        alert('Error importing settings: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const saveToBackup = () => {
    try {
      const backupKey = 'saohouse-settings-backup';
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings: JSON.parse(JSON.stringify(currentSettings)) // Deep clone to ensure clean save
      };
      
      // Validate settings before saving
      if (!currentSettings || typeof currentSettings !== 'object') {
        alert('Error: Invalid settings data to backup');
        return;
      }
      
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      setHasBackup(true); // Update backup status

      alert(`Settings backed up successfully!\nTimestamp: ${new Date().toLocaleString()}`);
    } catch (error) {
      console.error('Backup save error:', error);
      alert('Error saving backup: ' + (error as Error).message);
    }
  };

  const loadFromBackup = () => {
    try {
      const backupKey = 'saohouse-settings-backup';
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        alert('No backup found. Please save a backup first.');
        return;
      }
      
      const data = JSON.parse(backupData);

      
      if (!data.settings) {
        alert('Error: Backup data is corrupted or invalid');
        return;
      }
      
      // Validate the backup structure
      const requiredKeys = ['toneMapping', 'bloom', 'chromaticAberration', 'filmGrain', 'ssao'];
      const hasAllKeys = requiredKeys.every(key => key in data.settings);
      
      if (!hasAllKeys) {
        alert('Error: Backup appears to be incomplete or corrupted');
        return;
      }
      
      // Apply the settings
      onSettingsLoad(data.settings);
      
      const backupDate = data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown';
      alert(`Settings restored successfully!\nBackup from: ${backupDate}`);
      
    } catch (error) {
      console.error('Backup load error:', error);
      alert('Error loading backup: ' + (error as Error).message);
    }
  };

  const copyToClipboard = () => {
    const settingsData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: currentSettings
    };
    
    navigator.clipboard.writeText(JSON.stringify(settingsData, null, 2))
      .then(() => alert('Settings copied to clipboard!'))
      .catch(() => alert('Failed to copy settings'));
  };

  return (
    <>
      <button
        onClick={() => setShowManager(!showManager)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1002,
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          opacity: showManager ? 1 : 0.7,
          transition: 'opacity 0.2s ease',
        }}
      >
        ⚙️ Settings Manager
      </button>

      {showManager && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '20px',
          zIndex: 1003,
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: 'white',
          minWidth: '250px',
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Settings Manager</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={exportSettings}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              📥 Export Settings
            </button>
            
            <label style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              textAlign: 'center',
              display: 'block',
            }}>
              📤 Import Settings
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style={{ display: 'none' }}
              />
            </label>
            
            <hr style={{ border: '1px solid rgba(255, 255, 255, 0.2)', margin: '10px 0' }} />
            
            <button
              onClick={saveToBackup}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              💾 Save Backup
            </button>
            
            <button
              onClick={loadFromBackup}
              disabled={!hasBackup}
              style={{
                background: hasBackup ? '#8b5cf6' : '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: hasBackup ? 'pointer' : 'not-allowed',
                fontSize: '11px',
                opacity: hasBackup ? 1 : 0.6,
              }}
            >
              🔄 Restore Backup {hasBackup ? '' : '(No backup)'}
            </button>
            
            <button
              onClick={copyToClipboard}
              style={{
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              📋 Copy to Clipboard
            </button>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '4px',
            fontSize: '10px',
            lineHeight: '1.4'
          }}>
            <strong>💡 Tips:</strong><br/>
            • Export settings before making changes<br/>
            • Use backup for quick save/restore<br/>
            • Settings are auto-saved to localStorage
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsManager; 