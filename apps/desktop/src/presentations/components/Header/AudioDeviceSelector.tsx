import React, { useRef, useEffect } from 'react';
import { Headphones, Check } from 'lucide-react';
import { useLanguage } from '@hooks';
import { useAudioDevices } from '@music/hooks';
import './AudioDeviceSelector.scss';

export const AudioDeviceSelector: React.FC = () => {
  const { t } = useLanguage();
  const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();
  const [isOpen, setIsOpen] = React.useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle device change and close popover
  const handleSelectDevice = (deviceId: string) => {
    setAudioDevice(deviceId);
    setIsOpen(false);
  };

  return (
    <div className="audio-device-selector" ref={popoverRef}>
      <button 
        className={`icon-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={t('settings.audioOutput') || 'Audio Output'}
      >
        <Headphones size={18} />
      </button>

      {isOpen && (
        <div className="device-popover">
          <div className="popover-header">
            <span>{t('settings.audioOutput') || 'Audio Output'}</span>
          </div>
          <div className="popover-body">
            <button 
              className={`device-item ${currentDeviceId === 'default' ? 'selected' : ''}`}
              onClick={() => handleSelectDevice('default')}
            >
              <div className="device-info">
                <span>{t('settings.defaultDevice') || 'System Default'}</span>
              </div>
              {currentDeviceId === 'default' && <Check size={16} className="check-icon" />}
            </button>
            
            {devices.filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications').map((device) => {
              const isSelected = currentDeviceId === device.deviceId;
              return (
                <button 
                  key={device.deviceId}
                  className={`device-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectDevice(device.deviceId)}
                >
                  <div className="device-info">
                    <span>{device.label}</span>
                  </div>
                  {isSelected && <Check size={16} className="check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
