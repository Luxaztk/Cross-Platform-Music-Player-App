import React from 'react';
import './HotkeysModal.scss';
import { ICON_SIZES } from '@constants';
import { X } from 'lucide-react';
import { useLanguage } from '../Language';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { t } = useLanguage();

  const hotkeyGroups = [
    {
      title: 'Playback',
      hotkeys: [
        { key: 'Space', description: 'Play/Pause' },
        { key: '← / →', description: 'Seek -5s / +5s' },
        { key: 'Shift + N', description: 'Next song' },
        { key: 'Shift + P', description: 'Previous song' },
        { key: '↑ / ↓', description: 'Volume Up/Down' },
        { key: 'M', description: 'Toggle Mute' },
        { key: 'R', description: 'Toggle Repeat mode' },
        { key: 'S', description: 'Toggle Shuffle mode' },
      ]
    },
    {
      title: 'UI Controls',
      hotkeys: [
        { key: 'F', description: 'Toggle Fullscreen (Coming soon!)' },
        { key: 'V', description: 'Toggle Visualizer (Coming soon!)' },
      ]
    },
    {
      title: 'Navigation',
      hotkeys: [
        { key: '/', description: 'Focus search input' },
        { key: 'Escape', description: 'Close modals / Blur focus' },
      ]
    },
    {
      title: 'App Controls',
      hotkeys: [
        { key: 'Shift + ?', description: 'Show this hotkeys list' },
      ]
    }
  ];

  return (
    <div className="hotkeys-modal-overlay" onClick={onClose}>
      <div className="hotkeys-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hotkeys-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="close-button" onClick={onClose} title={t('common.close')}>
            <X size={ICON_SIZES.SMALL} />
          </button>
        </div>
        <div className="hotkeys-modal-body">
          {hotkeyGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="hotkeys-group">
              <h3 className="hotkeys-group-title">{group.title}</h3>
              <div className="hotkeys-list">
                {group.hotkeys.map((hotkey, index) => (
                  <div key={index} className="hotkey-item">
                    <kbd className="hotkey-key">{hotkey.key}</kbd>
                    <span className="hotkey-description">{hotkey.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};