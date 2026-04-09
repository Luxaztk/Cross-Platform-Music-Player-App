import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { useLanguage } from '../Language';
import { useAudioDevices } from '@music/hooks';
import './SettingsModal.scss';

interface ExtendedAudioContext extends AudioContext {
  setSinkId?(sinkId: string): Promise<void>;
}

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAudioDevice(e.target.value);
  };

  const handleTestSound = async () => {
    // Electron dùng nhân Chromium hiện đại, không cần check webkitAudioContext
    const ctx = new AudioContext() as ExtendedAudioContext;

    try {
      // Kiểm tra an toàn phương thức setSinkId
      if (typeof ctx.setSinkId === 'function' && currentDeviceId !== 'default') {
        await ctx.setSinkId(currentDeviceId);
      }
    } catch (err) {
      // Dùng hàm getErrorMessage nếu đã có, hoặc log lỗi đơn giản
      console.error('[AudioSettings] Failed to set audio sink:', err);
    } finally {
      // Dù set thiết bị lỗi vẫn nên phát âm thanh ở thiết bị mặc định để người dùng biết
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

    // Giảm âm lượng beep để không làm người dùng giật mình
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

    osc.start();
    // Tạo hiệu ứng fade-out mượt mà
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);

    // Tự động đóng context sau khi phát xong để giải phóng tài nguyên
    setTimeout(() => ctx.close(), 1000);
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
            <h3>{t('settings.audioOutput')}</h3>
            <div className="setting-item">
              <div className="setting-info">
                <Volume2 size={24} className="setting-icon" />
                <div className="setting-text">
                  <label htmlFor="audio-output-select">
                    {t('settings.selectDevice')}
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
                  <option value="default">{t('settings.defaultDevice')}</option>
                  {devices
                    .filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications')
                    .map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${t('settings.device')} ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  }
                </select>
                <button className="test-sound-btn" onClick={handleTestSound}>
                  {t('settings.testSound')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};