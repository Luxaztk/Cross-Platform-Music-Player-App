import React, { useEffect } from 'react';
import './HotkeysModal.scss';
import { ICON_SIZES } from '@constants';
import { X, PlayCircle, MousePointer2, Layout, Keyboard as KeyboardIcon, Search } from 'lucide-react';
import { useLanguage } from '@hooks';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  // Close modal when pressing escape if it's somehow not caught by global listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hotkeyGroups = [
    {
      title: t('hotkeys.playback', { defaultValue: 'Phát nhạc' }),
      icon: <PlayCircle size={18} />,
      hotkeys: [
        { key: 'Space', description: t('hotkeys.playPause', { defaultValue: 'Phát / Tạm dừng' }) },
        { key: '← | →', description: t('hotkeys.seek', { defaultValue: 'Tua lại / Tua tiếp' }) },
        { key: 'Shift + N', description: t('hotkeys.next', { defaultValue: 'Bài tiếp theo' }) },
        { key: 'Shift + P', description: t('hotkeys.prev', { defaultValue: 'Bài trước đó' }) },
        { key: '↑ | ↓', description: t('hotkeys.volume', { defaultValue: 'Tăng / Giảm âm lượng' }) },
        { key: 'M', description: t('hotkeys.mute', { defaultValue: 'Bật / Tắt âm (Mute)' }) },
        { key: 'R', description: t('hotkeys.repeat', { defaultValue: 'Chế độ lặp lại' }) },
        { key: 'S', description: t('hotkeys.shuffle', { defaultValue: 'Phát ngẫu nhiên' }) },
      ]
    },
    {
      title: t('hotkeys.mouse', { defaultValue: 'Thao tác Chuột' }),
      icon: <MousePointer2 size={18} />,
      hotkeys: [
        { key: 'Click', description: t('hotkeys.click', { defaultValue: 'Phát bài hát' }) },
        { key: 'Ctrl + Click', description: t('hotkeys.ctrlClick', { defaultValue: 'Chọn nhiều bài hát' }) },
        { key: 'Shift + Click', description: t('hotkeys.shiftClick', { defaultValue: 'Chọn dải bài hát' }) },
        { key: 'Right Click', description: t('hotkeys.rightClick', { defaultValue: 'Mở Menu phụ' }) },
      ]
    },
    {
      title: t('hotkeys.navigation', { defaultValue: 'Điều hướng' }),
      icon: <Search size={18} />,
      hotkeys: [
        { key: '/', description: t('hotkeys.search', { defaultValue: 'Tìm kiếm' }) },
        { key: 'Esc', description: t('hotkeys.escape', { defaultValue: 'Đóng Menu / Thoát' }) },
      ]
    },
    {
      title: t('hotkeys.ui', { defaultValue: 'Giao diện' }),
      icon: <Layout size={18} />,
      hotkeys: [
        { key: 'F', description: t('hotkeys.fullscreen', { defaultValue: 'Toàn màn hình (Sắp ra mắt)' }) },
        { key: 'V', description: t('hotkeys.visualizer', { defaultValue: 'Hiệu ứng (Sắp ra mắt)' }) },
      ]
    },
    {
      title: t('hotkeys.app', { defaultValue: 'Hệ thống' }),
      icon: <KeyboardIcon size={18} />,
      hotkeys: [
        { key: '? | F1 | Ctrl + /', description: t('hotkeys.showHotkeys', { defaultValue: 'Hiển thị Bảng phím tắt' }) },
      ]
    }
  ];

  // Helper to visually split hotkey combinations
  const renderKeys = (keyString: string) => {
    const parts = keyString.split(/(\s*\+\s*|\s*\|\s*)/);
    return parts.filter(part => part !== '').map((part, i) => {
      const trimmed = part.trim();
      if (trimmed === '+' || trimmed === '|') {
        return <span key={i} className="key-separator">{trimmed === '|' ? '/' : '+'}</span>;
      }
      // Thay thế chữ 'Ctrl' thành ký hiệu của HĐH nếu muốn, tạm thời cứ để nguyên chữ
      let displayKey = trimmed;
      if (trimmed === 'Click' || trimmed === 'Right Click') {
        displayKey = trimmed;
      }
      return <kbd key={i} className={`hotkey-key ${trimmed.length > 1 ? 'hotkey-key-wide' : ''}`}>{displayKey}</kbd>;
    });
  };

  return (
    <div className="hotkeys-modal-overlay" onClick={onClose}>
      <div className="hotkeys-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hotkeys-modal-header">
          <div className="header-title">
            <KeyboardIcon size={24} className="header-icon" />
            <h2>{t('common.keyboardShortcuts', { defaultValue: 'Bảng Phím Tắt' })}</h2>
          </div>
          <button className="close-button" onClick={onClose} title={t('common.close')}>
            <X size={ICON_SIZES.SMALL} />
          </button>
        </div>
        
        <div className="hotkeys-modal-body">
          <div className="hotkeys-grid">
            {hotkeyGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="hotkeys-group">
                <div className="hotkeys-group-header">
                  {group.icon}
                  <h3 className="hotkeys-group-title">{group.title}</h3>
                </div>
                <div className="hotkeys-list">
                  {group.hotkeys.map((hotkey, index) => (
                    <div key={index} className="hotkey-item">
                      <div className="hotkey-keys-wrapper">
                        {renderKeys(hotkey.key)}
                      </div>
                      <span className="hotkey-description">{hotkey.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};