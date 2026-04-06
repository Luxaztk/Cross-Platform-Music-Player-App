import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { useLanguage } from '../Language';
import { useAudioDevices } from '@music/hooks';
import './SettingsModal.scss';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAudioDevice(e.target.value);
  };

  const handleTestSound = () => {
    // Play a short beep or sound to test the selected device
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    if (typeof (ctx as any).setSinkId === 'function') {
      (ctx as any).setSinkId(currentDeviceId).then(() => {
        playBeep(ctx);
      }).catch((e: any) => {
        console.error('Failed to set sinkId on audio context', e);
        playBeep(ctx);
      });
    } else {
      playBeep(ctx);
    }
  };

  const playBeep = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    
    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('header.settings')}</h2>
          <button className="close-btn" onClick={onClose}>
             <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3>{t('settings.audioOutput') || 'Audio Output'}</h3>
            <div className="setting-item">
              <div className="setting-info">
                 <Volume2 size={24} className="setting-icon" />
                 <div className="setting-text">
                    <label htmlFor="audio-output-select">
                      {t('settings.selectDevice') || 'Select Device'}
                    </label>
                 </div>
              </div>
              <div className="setting-action">
                <select 
                  id="audio-output-select"
                  className="device-select"
                  value={currentDeviceId}
                  onChange={handleDeviceChange}
                >
                  <option value="default">{t('settings.defaultDevice') || 'System Default'}</option>
                  {devices.filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications').map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                <button className="test-sound-btn" onClick={handleTestSound}>
                  {t('settings.testSound') || 'Test'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
